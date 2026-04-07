const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const { PrismaClient } = require('@prisma/client');

const apiRoot = path.join(__dirname, '..');
const port = 3112;
const prismaSchemaPath = 'prisma/schema.prisma';
const databaseUrl = process.env.DATABASE_URL || 'postgresql://vscode@127.0.0.1:55432/ivyhouse_api_test?schema=public';

function buildPortalHeaders({ principalId, roleCodes, sessionId, displayName }) {
  return {
    'x-portal-principal-id': principalId,
    'x-portal-display-name': displayName ?? principalId,
    'x-portal-role-codes': roleCodes,
    'x-portal-session-id': sessionId,
    'x-portal-auth-source': 'PORTAL_SESSION',
  };
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function run() {
  await execCommand('npx', ['prisma', 'migrate', 'deploy', '--schema', prismaSchemaPath], {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  await resetOpeningBalanceSmokeData();

  const server = spawn('node', ['dist/main.js'], {
    cwd: apiRoot,
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: databaseUrl,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForServerReady(server);
    await verifyOpeningBalanceRehearsal();
  } finally {
    server.kill('SIGTERM');
    await once(server, 'exit').catch(() => undefined);
  }
}

async function verifyOpeningBalanceRehearsal() {
  const firstSession = await fetchJson('/api/daily-ops/inventory-counts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: 'opening-balance-runner',
        roleCodes: 'supervisor',
        sessionId: 'opening-balance-create-001',
      }),
    },
    body: JSON.stringify({
      countScope: 'PACKAGING_MATERIAL',
      lines: [
        {
          bucketType: 'PACKAGING_MATERIAL',
          itemSku: 'PK0038',
          beforeQty: 0,
          countedQty: 12,
          note: 'opening balance rehearsal',
        },
      ],
    }),
  });

  assert.equal(firstSession.summary.zeroBaselineLineCount, 1);
  assert.equal(firstSession.lines[0].varianceDirection, 'ZERO_BASELINE');
  assert.equal(firstSession.lines[0].zeroBaselineFlag, true);

  await expectHttpError(
    '/api/daily-ops/inventory-counts',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'opening-balance-runner',
          roleCodes: 'supervisor',
          sessionId: 'opening-balance-create-002',
        }),
      },
      body: JSON.stringify({
        countScope: 'PACKAGING_MATERIAL',
        lines: [
          {
            bucketType: 'PACKAGING_MATERIAL',
            itemSku: 'PK0038',
            beforeQty: 0,
            countedQty: 8,
          },
        ],
      }),
    },
    409,
    '首盤窗口已鎖定',
  );

  await expectHttpError(
    '/api/daily-ops/inventory-counts',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'opening-balance-runner',
          roleCodes: 'supervisor',
          sessionId: 'opening-balance-create-004',
        }),
      },
      body: JSON.stringify({
        countScope: 'DAILY_OPS',
        lines: [
          {
            bucketType: 'SELLABLE',
            itemSku: 'N10120',
            beforeQty: 0,
            countedQty: 2,
          },
        ],
      }),
    },
    409,
    '單倉首盤 / 盤點窗口不可並行',
  );

  const cancelledSession = await fetchJson(
    `/api/daily-ops/inventory-counts/${firstSession.sessionId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'opening-balance-approver',
          roleCodes: 'supervisor',
          sessionId: 'opening-balance-cancel-001',
        }),
      },
      body: JSON.stringify({
        reason: 'opening balance interrupted; restart same window',
      }),
    },
  );

  assert.equal(cancelledSession.status, 'CANCELLED');
  assert.equal(cancelledSession.cancelReason, 'opening balance interrupted; restart same window');
  assert.equal(cancelledSession.completedAt, null);

  const cancelledHistory = await fetchJson(
    '/api/daily-ops/inventory-variance/items/PACKAGING_MATERIAL/PK0038/history?page=1&pageSize=10',
  );
  assert.equal(cancelledHistory.total, 0);

  const replacementFirstSession = await fetchJson('/api/daily-ops/inventory-counts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: 'opening-balance-runner',
        roleCodes: 'supervisor',
        sessionId: 'opening-balance-create-005',
      }),
    },
    body: JSON.stringify({
      countScope: 'PACKAGING_MATERIAL',
      lines: [
        {
          bucketType: 'PACKAGING_MATERIAL',
          itemSku: 'PK0038',
          beforeQty: 0,
          countedQty: 12,
          note: 'opening balance restart after cancel',
        },
      ],
    }),
  });

  const firstCompleted = await fetchJson(
    `/api/daily-ops/inventory-counts/${replacementFirstSession.sessionId}/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'opening-balance-approver',
          roleCodes: 'supervisor',
          sessionId: 'opening-balance-complete-001',
        }),
      },
      body: JSON.stringify({}),
    },
  );

  assert.equal(firstCompleted.adjustments.length, 1);
  assert.equal(firstCompleted.adjustments[0].qtyDelta, 12);
  assert.equal(firstCompleted.adjustments[0].sourceType, 'COUNT_SESSION');
  assert.equal(firstCompleted.session.completionApproval.status, 'APPROVED');

  const firstHistory = await fetchJson(
    '/api/daily-ops/inventory-variance/items/PACKAGING_MATERIAL/PK0038/history?page=1&pageSize=10',
  );
  assert.equal(firstHistory.total, 1);
  assert.equal(firstHistory.items[0].varianceDirection, 'ZERO_BASELINE');
  assert.equal(firstHistory.items[0].differenceQty, 12);

  const secondSession = await fetchJson('/api/daily-ops/inventory-counts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: 'opening-balance-runner',
        roleCodes: 'supervisor',
        sessionId: 'opening-balance-create-003',
      }),
    },
    body: JSON.stringify({
      countScope: 'PACKAGING_MATERIAL',
      lines: [
        {
          bucketType: 'PACKAGING_MATERIAL',
          itemSku: 'PK0038',
          beforeQty: 12,
          countedQty: 10,
          note: 'post-opening routine count',
        },
      ],
    }),
  });

  assert.equal(secondSession.summary.zeroBaselineLineCount, 0);
  assert.equal(secondSession.lines[0].varianceDirection, 'SHORT');
  assert.equal(secondSession.lines[0].differenceQty, -2);

  const secondCompleted = await fetchJson(
    `/api/daily-ops/inventory-counts/${secondSession.sessionId}/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'opening-balance-approver',
          roleCodes: 'supervisor',
          sessionId: 'opening-balance-complete-002',
        }),
      },
      body: JSON.stringify({}),
    },
  );

  assert.equal(secondCompleted.adjustments.length, 1);
  assert.equal(secondCompleted.adjustments[0].qtyDelta, -2);

  const summary = await fetchJson('/api/daily-ops/inventory-variance/items/PACKAGING_MATERIAL/PK0038');
  assert.equal(summary.latestCount.varianceDirection, 'SHORT');
  assert.equal(summary.latestCount.differenceQty, -2);
  assert.equal(summary.rollingMetrics.last30Days.countSessionCount, 2);
  assert.equal(summary.rollingMetrics.last30Days.totalAbsDifferenceQty, 14);

  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });

  try {
    const ledgerEntries = await prisma.inventoryEventLedger.findMany({
      where: {
        bucketType: 'PACKAGING_MATERIAL',
        itemSku: 'PK0038',
      },
      orderBy: {
        performedAt: 'asc',
      },
    });

    assert.equal(ledgerEntries.length, 2);
    assert.equal(Number(ledgerEntries[0].qtyDelta), 12);
    assert.equal(Number(ledgerEntries[1].qtyDelta), -2);
  } finally {
    await prisma.$disconnect();
  }
}

async function resetOpeningBalanceSmokeData() {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });

  try {
    await prisma.$transaction([
      prisma.inventoryEventLedger.deleteMany(),
      prisma.inventoryAdjustmentEvent.deleteMany(),
      prisma.inventoryCountLine.deleteMany(),
      prisma.inventoryCountSession.deleteMany(),
      prisma.auditLog.deleteMany({
        where: {
          performedBy: {
            in: ['opening-balance-runner', 'opening-balance-approver'],
          },
        },
      }),
    ]);
  } finally {
    await prisma.$disconnect();
  }
}

async function execCommand(command, args, options) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} 失敗: ${stderr}`));
    });
  });
}

async function waitForServerReady(server) {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('opening-balance smoke test 等待 server 啟動逾時'));
    }, 20000);

    const onStdout = (chunk) => {
      const text = chunk.toString();

      if (text.includes('Nest application successfully started')) {
        cleanup();
        resolve(undefined);
      }
    };

    const onStderr = (chunk) => {
      const text = chunk.toString();
      if (text.trim()) {
        cleanup();
        reject(new Error(`opening-balance smoke test 啟動失敗: ${text}`));
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`opening-balance smoke test server 提前結束，exit code=${code}`));
    };

    function cleanup() {
      clearTimeout(timeout);
      server.stdout.off('data', onStdout);
      server.stderr.off('data', onStderr);
      server.off('exit', onExit);
    }

    server.stdout.on('data', onStdout);
    server.stderr.on('data', onStderr);
    server.on('exit', onExit);
  });
}

async function fetchJson(pathname, options) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, options);
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${pathname}: ${bodyText}`);
  }

  return JSON.parse(bodyText);
}

async function expectHttpError(pathname, options, expectedStatus, expectedText) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, options);
  const bodyText = await response.text();

  assert.equal(response.status, expectedStatus);
  assert.match(bodyText, new RegExp(expectedText));
}