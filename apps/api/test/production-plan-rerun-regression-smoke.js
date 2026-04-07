const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const { PrismaClient } = require('@prisma/client');

const apiRoot = path.join(__dirname, '..');
const port = 3114;
const prismaSchemaPath = 'prisma/schema.prisma';
const databaseUrl = process.env.DATABASE_URL || 'postgresql://vscode@127.0.0.1:55432/ivyhouse_api_test?schema=public';
const principalActors = {
  planner: 'portal-production-planner',
  creatorApprover: 'portal-supervisor-creator-approver',
  rerunner: 'portal-packaging-rerunner',
  rerunApprover: 'portal-supervisor-rerun-approver',
  reviser: 'portal-admin-reviser',
  reviseApprover: 'portal-admin-supervisor-reviser',
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

  await resetProductionPlanRegressionData();

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
    await verifyRerunAndRevisionFlow();
  } finally {
    server.kill('SIGTERM');
    await once(server, 'exit').catch(() => undefined);
  }
}

async function verifyRerunAndRevisionFlow() {
  await expectHttpError(
    '/api/daily-ops/production-plans',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'portal-supervisor-blocked',
          roleCodes: 'supervisor',
          sessionId: 'portal-production-plan-blocked-001',
        }),
      },
      body: JSON.stringify({
        planDate: '2026-04-02',
        lines: [
          {
            planLevel: 'SELLABLE',
            targetSku: 'A10010',
            targetName: '豆塔-蔓越莓',
            plannedQty: 1,
            uom: '袋',
          },
        ],
      }),
    },
    403,
    '此操作需要角色',
  );

  const createdPlan = await fetchJson('/api/daily-ops/production-plans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: principalActors.planner,
          roleCodes: 'production',
          sessionId: 'portal-production-plan-create-001',
        }),
    },
    body: JSON.stringify({
      planDate: '2026-04-02',
      lines: [
        {
          planLevel: 'SELLABLE',
          targetSku: 'A10010',
          targetName: '豆塔-蔓越莓',
          plannedQty: 1,
          uom: '袋',
        },
      ],
    }),
  });

  assert.equal(createdPlan.approvalStatus, 'PENDING_APPROVAL');

  await expectHttpError(
    `/api/daily-ops/production-plans/${createdPlan.id}/approval`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'portal-admin-only-approver',
          roleCodes: 'admin',
          sessionId: 'portal-production-plan-admin-approve-001',
        }),
      },
      body: JSON.stringify({
        decision: 'APPROVED',
      }),
    },
    403,
    '此操作需要角色',
  );

  const approvedCreate = await fetchJson(`/api/daily-ops/production-plans/${createdPlan.id}/approval`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: principalActors.creatorApprover,
        roleCodes: 'supervisor',
        sessionId: 'portal-production-plan-approve-001',
      }),
    },
    body: JSON.stringify({
      decision: 'APPROVED',
    }),
  });

  assert.equal(approvedCreate.plan.approvalStatus, 'APPROVED');
  assert.equal(approvedCreate.bomRun.triggerType, 'PLAN_CREATED');

  await expectHttpError(
    `/api/daily-ops/production-plans/${createdPlan.id}/reserve-bom`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'portal-supervisor-rerun-blocked',
          roleCodes: 'supervisor',
          sessionId: 'portal-production-plan-rerun-blocked-001',
        }),
      },
      body: JSON.stringify({}),
    },
    403,
    '此操作需要角色',
  );

  const rerun = await fetchJson(`/api/daily-ops/production-plans/${createdPlan.id}/reserve-bom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: principalActors.rerunner,
        roleCodes: 'packaging-shipping,supervisor',
        sessionId: 'portal-production-plan-rerun-001',
      }),
    },
    body: JSON.stringify({}),
  });

  assert.equal(rerun.triggerType, 'MANUAL_RERUN');
  assert.equal(rerun.approvalStatus, 'PENDING_APPROVAL');

  await expectHttpError(
    `/api/daily-ops/production-plans/bom-runs/${rerun.id}/approval`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'portal-admin-only-rerun-approver',
          roleCodes: 'admin',
          sessionId: 'portal-production-plan-rerun-admin-approve-001',
        }),
      },
      body: JSON.stringify({
        decision: 'APPROVED',
      }),
    },
    403,
    '此操作需要角色',
  );

  const approvedRerun = await fetchJson(`/api/daily-ops/production-plans/bom-runs/${rerun.id}/approval`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: principalActors.rerunner,
        roleCodes: 'packaging-shipping,supervisor',
        sessionId: 'portal-production-plan-rerun-approve-001',
      }),
    },
    body: JSON.stringify({
      decision: 'APPROVED',
    }),
  });

  assert.equal(approvedRerun.approvalStatus, 'APPROVED');
  assert.equal(approvedRerun.singlePersonOverride, true);

  const rejectedRerunRequest = await fetchJson(`/api/daily-ops/production-plans/${createdPlan.id}/reserve-bom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: principalActors.rerunner,
        roleCodes: 'packaging-shipping,supervisor',
        sessionId: 'portal-production-plan-rerun-002',
      }),
    },
    body: JSON.stringify({}),
  });

  const rejectedRerun = await fetchJson(
    `/api/daily-ops/production-plans/bom-runs/${rejectedRerunRequest.id}/approval`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: principalActors.creatorApprover,
          roleCodes: 'supervisor',
          sessionId: 'portal-production-plan-rerun-reject-001',
        }),
      },
      body: JSON.stringify({
        decision: 'REJECTED',
        reason: 'duplicate rerun request',
      }),
    },
  );

  assert.equal(rejectedRerun.approvalStatus, 'REJECTED');
  assert.equal(rejectedRerun.executedAt, null);

  const revised = await fetchJson(`/api/daily-ops/production-plans/${createdPlan.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: principalActors.reviser,
        roleCodes: 'admin',
        sessionId: 'portal-production-plan-revise-001',
      }),
    },
    body: JSON.stringify({
      lines: [
        {
          planLevel: 'SELLABLE',
          targetSku: 'A10010',
          targetName: '豆塔-蔓越莓',
          plannedQty: 2,
          uom: '袋',
        },
      ],
    }),
  });

  assert.equal(revised.previousPlanId, createdPlan.id);
  assert.equal(revised.plan.approvalStatus, 'PENDING_APPROVAL');

  await expectHttpError(
    `/api/daily-ops/production-plans/${revised.plan.id}/approval`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildPortalHeaders({
          principalId: 'portal-admin-only-revision-approver',
          roleCodes: 'admin',
          sessionId: 'portal-production-plan-revision-admin-approve-001',
        }),
      },
      body: JSON.stringify({
        decision: 'APPROVED',
      }),
    },
    403,
    '此操作需要角色',
  );

  const approvedRevision = await fetchJson(`/api/daily-ops/production-plans/${revised.plan.id}/approval`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildPortalHeaders({
        principalId: principalActors.reviseApprover,
        roleCodes: 'admin,supervisor',
        sessionId: 'portal-production-plan-revision-approve-001',
      }),
    },
    body: JSON.stringify({
      decision: 'APPROVED',
    }),
  });

  assert.equal(approvedRevision.plan.approvalStatus, 'APPROVED');
  assert.equal(approvedRevision.bomRun.triggerType, 'PLAN_REVISED');

  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });

  try {
    const bomRuns = await prisma.bomReservationRun.findMany({
      where: {
        OR: [
          { planId: createdPlan.id },
          { planId: revised.plan.id },
        ],
      },
      include: {
        lines: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        performedBy: {
          in: Object.values(principalActors),
        },
      },
      orderBy: {
        performedAt: 'asc',
      },
    });

    const ledgerEntries = await prisma.inventoryEventLedger.findMany({
      where: {
        performedBy: {
          in: Object.values(principalActors),
        },
      },
      orderBy: [
        { performedAt: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    assert.deepEqual(
      bomRuns.map((run) => run.triggerType),
      ['PLAN_CREATED', 'MANUAL_RERUN', 'MANUAL_RERUN', 'PLAN_REVISED'],
    );
    assert.deepEqual(
      bomRuns.map((run) => run.approvalStatus),
      ['APPROVED', 'APPROVED', 'REJECTED', 'APPROVED'],
    );

    const [createdRun, rerunRun, rejectedRun, revisedRun] = bomRuns;
    assert.equal(Number(createdRun.lines.find((line) => line.materialSku === 'A1').qtyDelta), -10);
    assert.equal(Number(rerunRun.lines.find((line) => line.materialSku === 'A1').qtyDelta), -10);
    assert.equal(rejectedRun.lines.length > 0, true);
    assert.equal(rejectedRun.executedAt, null);
    assert.equal(Number(revisedRun.lines.find((line) => line.materialSku === 'A1').qtyDelta), -20);
    assert.equal(Number(revisedRun.lines.find((line) => line.materialSku === 'PK0014').qtyDelta), -2);

    assert.deepEqual(
      auditLogs.map((log) => log.action),
      [
        'production-plan.created',
        'production-plan.approved',
        'production-plan.bom-rerun.requested',
        'production-plan.bom-rerun.approved',
        'production-plan.bom-rerun.requested',
        'production-plan.bom-rerun.rejected',
        'production-plan.revised',
        'production-plan.approved',
      ],
    );

    assert.equal(auditLogs[0].performedBy, principalActors.planner);
    assert.equal(auditLogs[1].performedBy, principalActors.creatorApprover);
    assert.equal(auditLogs[2].performedBy, principalActors.rerunner);
    assert.equal(auditLogs[3].performedBy, principalActors.rerunner);
    assert.equal(auditLogs[4].performedBy, principalActors.rerunner);
    assert.equal(auditLogs[5].performedBy, principalActors.creatorApprover);
    assert.equal(auditLogs[6].performedBy, principalActors.reviser);
    assert.equal(auditLogs[7].performedBy, principalActors.reviseApprover);

    assert.equal(
      ledgerEntries.filter((entry) => entry.eventType === 'BOM_RESERVATION' && entry.itemSku === 'A1').length,
      3,
    );
    assert.equal(
      ledgerEntries.filter((entry) => entry.eventType === 'BOM_RESERVATION' && entry.itemSku === 'PK0014').length,
      3,
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function resetProductionPlanRegressionData() {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });

  try {
    await prisma.$transaction([
      prisma.inventoryEventLedger.deleteMany(),
      prisma.productionPlanHeader.deleteMany(),
      prisma.auditLog.deleteMany({
        where: {
          performedBy: {
              in: Object.values(principalActors),
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
      reject(new Error('production plan regression smoke 等待 server 啟動逾時'));
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
        reject(new Error(`production plan regression smoke 啟動失敗: ${text}`));
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`production plan regression smoke server 提前結束，exit code=${code ?? 'unknown'}`));
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