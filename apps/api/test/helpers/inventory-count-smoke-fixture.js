const { PrismaClient } = require('@prisma/client');

const DEFAULT_DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://vscode@127.0.0.1:55432/ivyhouse_api_test?schema=public';

async function resetAndSeedInventoryCountSmokeFixture(options = {}) {
  const databaseUrl = options.databaseUrl || DEFAULT_DATABASE_URL;
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  const now = new Date();
  const recentStartedAt = daysAgo(now, 5, 9, 0);
  const recentCompletedAt = daysAgo(now, 5, 18, 5);
  const staleStartedAt = daysAgo(now, 40, 9, 0);
  const staleCompletedAt = daysAgo(now, 40, 18, 0);
  const oldStartedAt = daysAgo(now, 20, 9, 0);
  const oldCompletedAt = daysAgo(now, 20, 18, 0);
  const openStartedAt = daysAgo(now, 2, 10, 30);

  try {
    await prisma.$connect();
    await clearFixtureData(prisma);

    await prisma.inventoryCountSession.create({
      data: {
        id: 'inventory-smoke-sf0002-recent',
        countScope: 'DAILY_OPS',
        status: 'COMPLETED',
        performedBy: 'inventory-smoke-fixture',
        startedAt: recentStartedAt,
        completedAt: recentCompletedAt,
        lines: {
          create: [
            {
              bucketType: 'INNER_PACK_FINISHED',
              itemSku: 'SF0002',
              beforeQty: 380,
              countedQty: 365,
              variancePct: -3.9473684211,
              note: 'fixture recent shortage',
            },
          ],
        },
      },
    });

    await prisma.inventoryCountSession.create({
      data: {
        id: 'inventory-smoke-sf0002-old',
        countScope: 'DAILY_OPS',
        status: 'COMPLETED',
        performedBy: 'inventory-smoke-fixture',
        startedAt: oldStartedAt,
        completedAt: oldCompletedAt,
        lines: {
          create: [
            {
              bucketType: 'INNER_PACK_FINISHED',
              itemSku: 'SF0002',
              beforeQty: 400,
              countedQty: 390,
              variancePct: -2.5,
              note: 'fixture older shortage',
            },
          ],
        },
      },
    });

    await prisma.inventoryCountSession.create({
      data: {
        id: 'inventory-smoke-packaging-stale',
        countScope: 'PACKAGING_MATERIAL',
        status: 'COMPLETED',
        performedBy: 'inventory-smoke-fixture',
        startedAt: staleStartedAt,
        completedAt: staleCompletedAt,
        lines: {
          create: [
            {
              bucketType: 'PACKAGING_MATERIAL',
              itemSku: 'PK0038',
              beforeQty: 2,
              countedQty: 2,
              variancePct: 0,
              note: 'fixture stale packaging count',
            },
          ],
        },
      },
    });

    await prisma.inventoryCountSession.create({
      data: {
        id: 'inventory-smoke-shipping-open',
        countScope: 'SHIPPING_SUPPLY',
        status: 'IN_PROGRESS',
        performedBy: 'inventory-smoke-fixture',
        startedAt: openStartedAt,
      },
    });

    await prisma.inventoryEventLedger.create({
      data: {
        eventType: 'MANUAL_ADJUSTMENT',
        bucketType: 'PACKAGING_MATERIAL',
        itemSku: 'PK0040',
        qtyDelta: -2,
        sourceType: 'InventoryAdjustmentEvent',
        sourceId: 'inventory-smoke-negative-ledger',
        performedBy: 'inventory-smoke-fixture',
        performedAt: daysAgo(now, 1, 8, 0),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'inventory-smoke.seeded',
        entityType: 'InventorySmokeFixture',
        entityId: 'inventory-smoke-fixture-v1',
        performedBy: 'inventory-smoke-fixture',
        performedAt: new Date(),
        payload: {
          databaseUrl,
          seedVersion: 'v1',
        },
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function clearFixtureData(prisma) {
  await prisma.$transaction([
    prisma.inventoryEventLedger.deleteMany(),
    prisma.inventoryAdjustmentEvent.deleteMany(),
    prisma.inventoryCountLine.deleteMany(),
    prisma.inventoryCountSession.deleteMany(),
    prisma.auditLog.deleteMany({
      where: {
        OR: [
          { performedBy: 'inventory-smoke-fixture' },
          { performedBy: 'inventory-smoke-runner' },
          { performedBy: 'inventory-smoke-complete' },
          { performedBy: 'inventory-smoke-manual' },
        ],
      },
    }),
  ]);
}

function daysAgo(reference, days, hours, minutes) {
  const value = new Date(reference);
  value.setDate(value.getDate() - days);
  value.setHours(hours, minutes, 0, 0);
  return value;
}

module.exports = {
  DEFAULT_DATABASE_URL,
  resetAndSeedInventoryCountSmokeFixture,
};