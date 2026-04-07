const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const {
  DEFAULT_DATABASE_URL,
  resetAndSeedInventoryCountSmokeFixture,
} = require('./helpers/inventory-count-smoke-fixture.js');

const port = 3111;
const apiRoot = path.join(__dirname, '..');
const prismaSchemaPath = 'prisma/schema.prisma';

function buildPortalHeaders({ principalId, roleCodes, displayName, sessionId }) {
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
  const databaseUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

  await execCommand(
    'npx',
    ['prisma', 'migrate', 'deploy', '--schema', prismaSchemaPath],
    {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
    },
  );
  await resetAndSeedInventoryCountSmokeFixture({ databaseUrl });

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
    await verifyFixtureReadSide();
    await verifyMutationFlow();
  } finally {
    server.kill('SIGTERM');
    await once(server, 'exit').catch(() => undefined);
  }
}

async function verifyFixtureReadSide() {
  const summary = await fetchJson('/api/daily-ops/inventory-variance/items/INNER_PACK_FINISHED/SF0002');

  assert.equal(summary.itemSku, 'SF0002');
  assert.equal(summary.itemName, '熟塔皮');
  assert.equal(summary.latestCount.differenceQty, -15);
  assert.equal(summary.latestCount.variancePct, -3.95);
  assert.equal(summary.latestCount.errorPct, 3.95);
  assert.equal(summary.latestCount.varianceDirection, 'SHORT');
  assert.equal(summary.rollingMetrics.last7Days.countSessionCount, 1);
  assert.equal(summary.rollingMetrics.last7Days.totalAbsDifferenceQty, 15);
  assert.equal(summary.rollingMetrics.last7Days.weightedErrorPct, 3.95);
  assert.equal(summary.rollingMetrics.last30Days.countSessionCount, 2);
  assert.equal(summary.rollingMetrics.last30Days.totalAbsDifferenceQty, 25);
  assert.equal(summary.rollingMetrics.last30Days.weightedErrorPct, 3.21);
  assert.equal(summary.uiHints.showSemiFinishedVarianceDisclaimer, true);
  assert.equal(summary.uiHints.varianceDisclaimer, '本差異率為庫存差異，不代表固定耗損率');

  const history = await fetchJson(
    '/api/daily-ops/inventory-variance/items/INNER_PACK_FINISHED/SF0002/history?page=1&pageSize=10',
  );

  assert.equal(history.total, 2);
  assert.equal(history.items[0].differenceQty, -15);
  assert.equal(history.items[1].differenceQty, -10);

  const alerts = await fetchJson('/api/daily-ops/inventory-alerts/negative-stock');
  const negativePackaging = alerts.find(
    (item) => item.bucketType === 'PACKAGING_MATERIAL' && item.itemSku === 'PK0040',
  );
  assert.ok(negativePackaging, '應回傳 PK0040 負庫存提醒');
  assert.equal(negativePackaging.currentQty, -2);
  assert.equal(negativePackaging.alertReason, '帳面庫存小於 0');
  assert.ok(negativePackaging.itemName);
  assert.ok(negativePackaging.inventoryPrimaryUnit);

  const reminders = await fetchJson('/api/daily-ops/inventory-alerts/count-reminder');
  const shippingReminder = reminders.find((item) => item.countScope === 'SHIPPING_SUPPLY');
  const packagingReminder = reminders.find((item) => item.countScope === 'PACKAGING_MATERIAL');
  const warehouseReminder = reminders.find((item) => item.countScope === 'FULL_WAREHOUSE');

  assert.ok(shippingReminder, '應回傳 SHIPPING_SUPPLY 進行中提醒');
  assert.equal(shippingReminder.status, 'IN_PROGRESS');
  assert.equal(shippingReminder.reminderReason, '盤點作業尚未完成');

  assert.ok(packagingReminder, '應回傳 PACKAGING_MATERIAL 逾期提醒');
  assert.equal(packagingReminder.reminderReason, '超過一個月未完成盤點');

  assert.ok(warehouseReminder, '應回傳 FULL_WAREHOUSE 缺少盤點提醒');
  assert.equal(warehouseReminder.status, 'MISSING');
}

async function verifyMutationFlow() {
  const created = await fetchJson('/api/daily-ops/inventory-counts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: 'portal-finance-operator',
        roleCodes: 'finance',
        sessionId: 'portal-session-create-001',
      }),
    },
    body: JSON.stringify({
      countScope: 'PACKAGING_MATERIAL',
      lines: [
        {
          bucketType: 'PACKAGING_MATERIAL',
          itemSku: 'PK0038',
          beforeQty: 1.5,
          countedQty: 1,
          note: '開卷後剩餘量重估',
        },
        {
          bucketType: 'PACKAGING_MATERIAL',
          itemSku: 'PK0039',
          beforeQty: 0,
          countedQty: 0.25,
        },
      ],
    }),
  });

  assert.equal(created.status, 'IN_PROGRESS');
  assert.equal(created.lineCount, 2);
  assert.equal(created.summary.varianceLineCount, 2);
  assert.equal(created.summary.zeroBaselineLineCount, 1);
  assert.equal(created.summary.totalAbsDifferenceQty, 0.75);
  assert.equal(created.summary.weightedErrorPct, 33.33);
  assert.equal(created.performedBy, 'portal-finance-operator');
  assert.equal(created.completionApproval, null);
  assert.equal(created.lines.length, 2);
  assert.equal(created.lines[0].countScope, 'PACKAGING_MATERIAL');

  const session = await fetchJson(`/api/daily-ops/inventory-counts/${created.sessionId}`);
  assert.equal(session.sessionId, created.sessionId);
  assert.equal(session.status, 'IN_PROGRESS');

  const lineList = await fetchJson(
    `/api/daily-ops/inventory-counts/${created.sessionId}/lines?varianceOnly=true&page=1&pageSize=10`,
  );
  assert.equal(lineList.total, 2);
  assert.equal(
    lineList.items.some((item) => item.itemSku === 'PK0039' && item.varianceDirection === 'ZERO_BASELINE'),
    true,
  );

  const completed = await fetchJson(`/api/daily-ops/inventory-counts/${created.sessionId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: 'portal-supervisor-approver',
        roleCodes: 'supervisor',
        sessionId: 'portal-session-complete-001',
      }),
    },
    body: JSON.stringify({}),
  });

  assert.equal(completed.session.status, 'COMPLETED');
  assert.equal(completed.session.completedByPrincipalId, 'portal-supervisor-approver');
  assert.equal(completed.session.completionApproval.status, 'APPROVED');
  assert.equal(completed.session.completionApproval.approverPrincipalId, 'portal-supervisor-approver');
  assert.equal(completed.session.completionApproval.singlePersonOverride, false);
  assert.equal(completed.adjustments.length, 2);
  assert.equal(
    completed.adjustments.every((item) => item.approval && item.approval.status === 'APPROVED'),
    true,
  );
  assert.equal(
    completed.adjustments.some((item) => item.itemSku === 'PK0038' && item.qtyDelta === -0.5),
    true,
  );
  assert.equal(
    completed.adjustments.some((item) => item.itemSku === 'PK0039' && item.qtyDelta === 0.25),
    true,
  );

  const manualAdjustment = await fetchJson('/api/daily-ops/inventory-adjustments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: 'portal-supervisor-adjuster',
        roleCodes: 'supervisor',
        sessionId: 'portal-session-adjust-001',
      }),
    },
    body: JSON.stringify({
      sourceType: 'MANUAL',
      bucketType: 'PACKAGING_MATERIAL',
      itemSku: 'PK0038',
      qtyDelta: 0.2,
      reason: 'smoke test manual correction',
    }),
  });

  assert.equal(manualAdjustment.sourceType, 'MANUAL');
  assert.equal(manualAdjustment.qtyDelta, 0.2);
  assert.equal(manualAdjustment.itemSku, 'PK0038');
  assert.equal(manualAdjustment.performedBy, 'portal-supervisor-adjuster');
  assert.equal(manualAdjustment.approval.status, 'APPROVED');
  assert.equal(manualAdjustment.approval.singlePersonOverride, true);
  assert.ok(manualAdjustment.itemName);

  const zeroBaselineHistory = await fetchJson(
    '/api/daily-ops/inventory-variance/items/PACKAGING_MATERIAL/PK0039/history?page=1&pageSize=10',
  );
  assert.ok(zeroBaselineHistory.total >= 1);
  assert.equal(zeroBaselineHistory.items[0].varianceDirection, 'ZERO_BASELINE');
  assert.equal(zeroBaselineHistory.items[0].zeroBaselineFlag, true);

  const unauthorizedSession = await fetchJson('/api/daily-ops/inventory-counts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: 'portal-finance-operator-2',
        roleCodes: 'finance',
        sessionId: 'portal-session-create-002',
      }),
    },
    body: JSON.stringify({
      countScope: 'PACKAGING_MATERIAL',
      lines: [
        {
          bucketType: 'PACKAGING_MATERIAL',
          itemSku: 'PK0038',
          beforeQty: 1,
          countedQty: 1,
        },
      ],
    }),
  });

  await expectHttpError(
    `/api/daily-ops/inventory-counts/${unauthorizedSession.sessionId}/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'portal-admin-operator',
          roleCodes: 'admin',
          sessionId: 'portal-session-admin-001',
        }),
      },
      body: JSON.stringify({}),
    },
    403,
    '此操作需要角色',
  );

  await expectHttpError(
    '/api/daily-ops/inventory-adjustments',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'portal-production-operator',
          roleCodes: 'production',
          sessionId: 'portal-session-production-001',
        }),
      },
      body: JSON.stringify({
        sourceType: 'MANUAL',
        bucketType: 'PACKAGING_MATERIAL',
        itemSku: 'PK0038',
        qtyDelta: 0.1,
        reason: 'unauthorized test',
      }),
    },
    403,
    '此操作需要角色',
  );

  await expectHttpError(
    '/api/daily-ops/inventory-adjustments',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'portal-supervisor-adjuster-2',
          roleCodes: 'supervisor',
          sessionId: 'portal-session-adjust-002',
        }),
      },
      body: JSON.stringify({
        sourceType: 'MANUAL',
        bucketType: 'PACKAGING_MATERIAL',
        itemSku: 'PK0038',
        qtyDelta: 0.1,
      }),
    },
    400,
    '手動調整必須提供 reason',
  );

  await expectHttpError(
    '/api/daily-ops/inventory-counts',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'portal-admin-operator-2',
          roleCodes: 'admin',
          sessionId: 'portal-session-admin-002',
        }),
      },
      body: JSON.stringify({
        countScope: 'PACKAGING_MATERIAL',
        lines: [
          {
            bucketType: 'PACKAGING_MATERIAL',
            itemSku: 'PK0038',
            beforeQty: 0,
            countedQty: 0,
          },
        ],
      }),
    },
    403,
    '此操作需要角色',
  );
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
      reject(new Error('inventory-count API smoke test 等待 server 啟動逾時'));
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
        reject(new Error(`inventory-count API smoke test 啟動失敗: ${text}`));
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`inventory-count API smoke test server 提前結束，exit code=${code}`));
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