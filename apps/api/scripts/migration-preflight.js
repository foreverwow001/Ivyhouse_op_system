const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const repoRoot = path.resolve(__dirname, "..");
const migrationsRoot = path.join(repoRoot, "prisma", "migrations");

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--help") || args.has("-h")) {
    printHelp();
    return;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("缺少 DATABASE_URL，無法執行 migration preflight。");
  }

  const prisma = new PrismaClient();

  try {
    const expectedMigrations = readExpectedMigrations();
    const databaseIdentity = await readDatabaseIdentity(prisma);
    const migrationHistory = await readAppliedMigrations(prisma);
    const extensionInventory = await readExtensionInventory(prisma);
    const report = buildPreflightReport({
      target: process.env.MIGRATION_PREFLIGHT_TARGET?.trim() || "unspecified",
      databaseUrl,
      expectedMigrations,
      appliedMigrations: migrationHistory.migrations,
      migrationHistoryTableExists: migrationHistory.tableExists,
      extensionInventory,
      databaseIdentity,
      requiredExtensions: readRequiredExtensions(),
    });

    if (process.env.MIGRATION_PREFLIGHT_OUTPUT?.trim()) {
      fs.writeFileSync(process.env.MIGRATION_PREFLIGHT_OUTPUT.trim(), `${JSON.stringify(report, null, 2)}\n`);
    }

    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.status !== "pass") {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

function printHelp() {
  process.stdout.write(
    [
      "用法：DATABASE_URL=<target> node apps/api/scripts/migration-preflight.js",
      "",
      "可選環境變數：",
      "- MIGRATION_PREFLIGHT_TARGET: 報告中的 target label，例如 staging / production",
      "- MIGRATION_PREFLIGHT_OUTPUT: 將 JSON 報告寫入指定檔案",
      "- MIGRATION_PREFLIGHT_REQUIRED_EXTENSIONS: 逗號分隔的必需 extension 名單",
    ].join("\n") + "\n",
  );
}

function readExpectedMigrations() {
  return fs
    .readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function readDatabaseIdentity(prisma) {
  const [row] = await prisma.$queryRawUnsafe(`
    SELECT
      current_database() AS database_name,
      current_schema() AS schema_name,
      current_user AS current_user,
      version() AS server_version
  `);

  return {
    databaseName: row.database_name,
    schemaName: row.schema_name,
    currentUser: row.current_user,
    serverVersion: row.server_version,
  };
}

async function readAppliedMigrations(prisma) {
  const [tableRow] = await prisma.$queryRawUnsafe(`
    SELECT to_regclass('public."_prisma_migrations"')::text AS table_name
  `);

  if (!tableRow.table_name) {
    return {
      tableExists: false,
      migrations: [],
    };
  }

  const rows = await prisma.$queryRawUnsafe(`
    SELECT migration_name, finished_at, rolled_back_at, logs
    FROM "_prisma_migrations"
    ORDER BY migration_name ASC
  `);

  return {
    tableExists: true,
    migrations: rows.map((row) => ({
      migrationName: row.migration_name,
      finishedAt: row.finished_at,
      rolledBackAt: row.rolled_back_at,
      hasLogs: typeof row.logs === "string" && row.logs.trim().length > 0,
    })),
  };
}

async function readExtensionInventory(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT extname, extversion
    FROM pg_extension
    ORDER BY extname ASC
  `);

  return rows.map((row) => ({
    name: row.extname,
    version: row.extversion,
  }));
}

function readRequiredExtensions() {
  return (process.env.MIGRATION_PREFLIGHT_REQUIRED_EXTENSIONS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .sort();
}

function buildPreflightReport({
  target,
  databaseUrl,
  expectedMigrations,
  appliedMigrations,
  extensionInventory,
  databaseIdentity,
  requiredExtensions,
  migrationHistoryTableExists = true,
}) {
  const sanitizedTarget = sanitizeDatabaseUrl(databaseUrl);
  const appliedNames = appliedMigrations.map((item) => item.migrationName);
  const pendingRepoMigrations = expectedMigrations.filter((name) => !appliedNames.includes(name));
  const unexpectedDatabaseMigrations = appliedNames.filter((name) => !expectedMigrations.includes(name));
  const failedMigrations = appliedMigrations
    .filter((item) => !item.finishedAt && !item.rolledBackAt)
    .map((item) => item.migrationName);
  const rolledBackMigrations = appliedMigrations
    .filter((item) => item.rolledBackAt)
    .map((item) => item.migrationName);
  const installedExtensions = extensionInventory.map((item) => item.name);
  const missingRequiredExtensions = requiredExtensions.filter((name) => !installedExtensions.includes(name));

  const findings = [];
  if (unexpectedDatabaseMigrations.length > 0) {
    findings.push(`目標環境存在 ${unexpectedDatabaseMigrations.length} 個未回掛 repo 的 migration。`);
  }
  if (failedMigrations.length > 0) {
    findings.push(`_prisma_migrations 中存在未完成 migration。`);
  }
  if (missingRequiredExtensions.length > 0) {
    findings.push(`目標環境缺少必要 PostgreSQL extension。`);
  }

  return {
    generatedAt: new Date().toISOString(),
    target,
    status: findings.length === 0 ? "pass" : "fail",
    database: {
      url: sanitizedTarget,
      ...databaseIdentity,
    },
    summary: {
      expectedMigrationCount: expectedMigrations.length,
      appliedMigrationCount: appliedMigrations.length,
      migrationHistoryTableExists,
      deploymentNeeded: pendingRepoMigrations.length > 0,
      pendingRepoMigrations,
      unexpectedDatabaseMigrations,
      failedMigrations,
      rolledBackMigrations,
      requiredExtensions,
      missingRequiredExtensions,
    },
    extensionInventory,
    findings,
  };
}

function sanitizeDatabaseUrl(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}`;
}

module.exports = {
  buildPreflightReport,
  readExpectedMigrations,
  readRequiredExtensions,
  sanitizeDatabaseUrl,
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
