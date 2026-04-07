const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const { PrismaClient } = require('@prisma/client');

const apiRoot = path.join(__dirname, '..');
const port = 3113;
const prismaSchemaPath = 'prisma/schema.prisma';
const databaseUrl = process.env.DATABASE_URL || 'postgresql://vscode@127.0.0.1:55432/ivyhouse_api_test?schema=public';
const actors = {
  importer: 'daily-ops-mainline-importer',
  confirmer: 'daily-ops-mainline-confirmer',
  planner: 'daily-ops-mainline-planner',
  replenisher: 'daily-ops-mainline-replenisher',
  counter: 'daily-ops-mainline-counter',
  approver: 'daily-ops-mainline-approver',
};

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

  await resetMainlineSmokeData();

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
    await verifyMainlineFlow();
  } finally {
    server.kill('SIGTERM');
    await once(server, 'exit').catch(() => undefined);
  }
}

async function verifyMainlineFlow() {
  await expectHttpError(
    '/api/daily-ops/production-plans',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'daily-ops-mainline-supervisor-blocked',
          roleCodes: 'supervisor',
          sessionId: 'daily-ops-mainline-production-blocked-001',
        }),
      },
      body: JSON.stringify({
        planDate: '2026-04-02',
        lines: [
          {
            planLevel: 'SELLABLE',
            targetSku: 'N10120',
            targetName: '無調味夏威夷豆',
            plannedQty: 1,
            uom: '包',
          },
        ],
      }),
    },
    403,
    '此操作需要角色',
  );

  const createdBatch = await fetchJson('/api/daily-ops/demand-batches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchNo: 'E2E-20260402-001',
      businessDate: '2026-04-02',
      sourceType: 'ORDER_IMPORT',
      importedBy: actors.importer,
      lines: [
        {
          channelCode: 'SHOPIFY',
          sellableSku: 'N10120',
          sellableName: '無調味夏威夷豆',
          spec: '120g',
          quantity: 2,
          rawSourceRef: 'shopify-order-20260402-001',
        },
      ],
    }),
  });

  assert.equal(createdBatch.status, 'DRAFT');
  assert.equal(createdBatch.lines.length, 1);

  const confirmedBatch = await fetchJson(`/api/daily-ops/demand-batches/${createdBatch.id}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      executedBy: actors.confirmer,
    }),
  });

  assert.equal(confirmedBatch.batch.status, 'CONFIRMED');
  assert.equal(confirmedBatch.deductionRun.status, 'EXECUTED');
  assert.equal(confirmedBatch.deductionLines[0].itemSku, 'N10120');
  assert.equal(Number(confirmedBatch.deductionLines[0].quantity), 2);

  const productionPlan = await fetchJson('/api/daily-ops/production-plans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: actors.planner,
        roleCodes: 'production',
        sessionId: 'daily-ops-mainline-production-create-001',
      }),
    },
    body: JSON.stringify({
      planDate: '2026-04-02',
      lines: [
        {
          planLevel: 'SELLABLE',
          targetSku: 'N10120',
          targetName: '無調味夏威夷豆',
          plannedQty: 1,
          uom: '包',
        },
      ],
    }),
  });

  assert.equal(productionPlan.approvalStatus, 'PENDING_APPROVAL');

  const approvedProductionPlan = await fetchJson(
    `/api/daily-ops/production-plans/${productionPlan.id}/approval`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: actors.approver,
          roleCodes: 'supervisor',
          sessionId: 'daily-ops-mainline-production-approve-001',
        }),
      },
      body: JSON.stringify({
        decision: 'APPROVED',
      }),
    },
  );

  const bomRawLine = approvedProductionPlan.bomRun.lines.find((line) => line.materialSku === 'RM0001');
  const bomPackagingLine = approvedProductionPlan.bomRun.lines.find((line) => line.materialSku === 'PK0016');

  assert.equal(approvedProductionPlan.plan.status, 'CONFIRMED');
  assert.ok(bomRawLine, '主線應包含 RM0001 直分裝 BOM reservation');
  assert.equal(bomRawLine.materialType, 'MATERIAL');
  assert.equal(Number(bomRawLine.qtyDelta), -120);
  assert.ok(bomPackagingLine, '主線應包含 PK0016 外包裝 BOM reservation');
  assert.equal(Number(bomPackagingLine.qtyDelta), -1);

  const createdReplenishment = await fetchJson('/api/daily-ops/replenishments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      businessDate: '2026-04-02',
      performedBy: actors.replenisher,
      lines: [
        {
          bucketType: 'PACKAGING_MATERIAL',
          itemSku: 'PK0016',
          itemName: '橫窗鋁箔夾鏈立袋',
          quantity: 5,
          uom: '個',
        },
      ],
    }),
  });

  assert.equal(createdReplenishment.status, 'DRAFT');
  assert.equal(createdReplenishment.lines.length, 1);

  const committedReplenishment = await fetchJson(
    `/api/daily-ops/replenishments/${createdReplenishment.id}/commit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        performedBy: actors.replenisher,
      }),
    },
  );

  assert.equal(committedReplenishment.status, 'COMMITTED');

  const createdCountSession = await fetchJson('/api/daily-ops/inventory-counts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: actors.counter,
        roleCodes: 'supervisor',
        sessionId: 'daily-ops-mainline-count-create-001',
      }),
    },
    body: JSON.stringify({
      countScope: 'PACKAGING_MATERIAL',
      lines: [
        {
          bucketType: 'PACKAGING_MATERIAL',
          itemSku: 'PK0016',
          beforeQty: 4,
          countedQty: 3.5,
          note: 'mainline E2E packaging reconciliation',
        },
      ],
    }),
  });

  assert.equal(createdCountSession.status, 'IN_PROGRESS');
  assert.equal(createdCountSession.summary.varianceLineCount, 1);

  const completedCountSession = await fetchJson(
    `/api/daily-ops/inventory-counts/${createdCountSession.sessionId}/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: actors.approver,
          roleCodes: 'supervisor',
          sessionId: 'daily-ops-mainline-count-complete-001',
        }),
      },
      body: JSON.stringify({}),
    },
  );

  assert.equal(completedCountSession.session.status, 'COMPLETED');
  assert.equal(completedCountSession.session.completedByPrincipalId, actors.approver);
  assert.equal(completedCountSession.session.completionApproval.status, 'APPROVED');
  assert.equal(completedCountSession.adjustments.length, 1);
  assert.equal(completedCountSession.adjustments[0].itemSku, 'PK0016');
  assert.equal(completedCountSession.adjustments[0].qtyDelta, -0.5);

  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });

  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        performedBy: {
          in: Object.values(actors),
        },
      },
      orderBy: {
        performedAt: 'asc',
      },
    });

    const ledgerEntries = await prisma.inventoryEventLedger.findMany({
      where: {
        performedBy: {
          in: Object.values(actors),
        },
      },
      orderBy: [
        { performedAt: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    assert.deepEqual(
      auditLogs.map((log) => log.action),
      [
        'daily-demand-batch.created',
        'daily-demand-batch.confirmed',
        'production-plan.created',
        'production-plan.approved',
        'replenishment-run.created',
        'replenishment-run.committed',
        'inventory-count.started',
        'inventory-count.completed',
      ],
    );

    assert.equal(
      ledgerEntries.some(
        (entry) =>
          entry.eventType === 'DEDUCTION' &&
          entry.bucketType === 'SELLABLE' &&
          entry.itemSku === 'N10120' &&
          Number(entry.qtyDelta) === -2,
      ),
      true,
    );
    assert.equal(
      ledgerEntries.some(
        (entry) =>
          entry.eventType === 'BOM_RESERVATION' &&
          entry.bucketType === 'PACKAGING_MATERIAL' &&
          entry.itemSku === 'RM0001' &&
          Number(entry.qtyDelta) === -120,
      ),
      true,
    );
    assert.equal(
      ledgerEntries.some(
        (entry) =>
          entry.eventType === 'BOM_RESERVATION' &&
          entry.bucketType === 'PACKAGING_MATERIAL' &&
          entry.itemSku === 'PK0016' &&
          Number(entry.qtyDelta) === -1,
      ),
      true,
    );
    assert.equal(
      ledgerEntries.some(
        (entry) =>
          entry.eventType === 'REPLENISHMENT' &&
          entry.bucketType === 'PACKAGING_MATERIAL' &&
          entry.itemSku === 'PK0016' &&
          Number(entry.qtyDelta) === 5,
      ),
      true,
    );
    assert.equal(
      ledgerEntries.some(
        (entry) =>
          entry.eventType === 'COUNT_ADJUSTMENT' &&
          entry.bucketType === 'PACKAGING_MATERIAL' &&
          entry.itemSku === 'PK0016' &&
          Number(entry.qtyDelta) === -0.5,
      ),
      true,
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function resetMainlineSmokeData() {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });

  try {
    await prisma.$transaction([
      prisma.inventoryEventLedger.deleteMany(),
      prisma.inventoryAdjustmentEvent.deleteMany(),
      prisma.inventoryCountSession.deleteMany(),
      prisma.replenishmentRun.deleteMany(),
      prisma.productionPlanHeader.deleteMany(),
      prisma.dailyDemandBatch.deleteMany(),
      prisma.auditLog.deleteMany({
        where: {
          performedBy: {
            in: Object.values(actors),
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
      reject(new Error('daily-ops mainline E2E smoke 等待 server 啟動逾時'));
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
        reject(new Error(`daily-ops mainline E2E smoke 啟動失敗: ${text}`));
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`daily-ops mainline E2E smoke server 提前結束，exit code=${code ?? 'unknown'}`));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      server.stdout.off('data', onStdout);
      server.stderr.off('data', onStderr);
      server.off('exit', onExit);
    };

    server.stdout.on('data', onStdout);
    server.stderr.on('data', onStderr);
    server.on('exit', onExit);
  });
}

async function fetchJson(pathname, options) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, options);
  const bodyText = await response.text();
  const json = bodyText ? JSON.parse(bodyText) : null;

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${pathname}: ${bodyText}`);
  }

  return json;
}

async function expectHttpError(pathname, options, expectedStatus, expectedMessage) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, options);
  const bodyText = await response.text();

  assert.equal(response.status, expectedStatus, bodyText);
  assert.match(bodyText, new RegExp(expectedMessage, 'u'));
}