const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

const { sanitizeDatabaseUrl } = require("./migration-preflight");

const repoRoot = path.resolve(__dirname, "..");

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--help") || args.has("-h")) {
    printHelp();
    return;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  const adminDatabaseUrl = process.env.ADMIN_DATABASE_URL?.trim();
  if (!databaseUrl || !adminDatabaseUrl) {
    throw new Error("缺少 DATABASE_URL 或 ADMIN_DATABASE_URL，無法執行 migration replay drill。");
  }

  const replayTarget = process.env.MIGRATION_PREFLIGHT_TARGET?.trim() || "staging-clone";
  assertReplayTargetAllowed(replayTarget);
  assertSameServer(databaseUrl, adminDatabaseUrl);

  const drillDatabaseName =
    process.env.MIGRATION_REPLAY_DB_NAME?.trim() || `ivyhouse_slice7_${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
  assertSafeDatabaseName(drillDatabaseName);

  const drillDatabaseUrl = replaceDatabaseName(databaseUrl, drillDatabaseName);
  const report = {
    generatedAt: new Date().toISOString(),
    target: replayTarget,
    status: "pass",
    sourceDatabase: sanitizeDatabaseUrl(databaseUrl),
    drillDatabase: sanitizeDatabaseUrl(drillDatabaseUrl),
    steps: [],
    cleanup: "pending",
    findings: [],
  };

  const adminPrisma = new PrismaClient({
    datasources: {
      db: {
        url: adminDatabaseUrl,
      },
    },
  });

  try {
    await resetScratchDatabase(adminPrisma, drillDatabaseName);

    runCommand(report, "prisma migrate deploy", ["npm", ["run", "prisma:migrate:deploy"]], drillDatabaseUrl);
    runCommand(report, "prisma seed", ["npm", ["run", "prisma:seed"]], drillDatabaseUrl);
    const preflightOutputPath =
      process.env.MIGRATION_PREFLIGHT_OUTPUT?.trim() || path.join(os.tmpdir(), "ivyhouse-migration-preflight-report.json");
    fs.mkdirSync(path.dirname(preflightOutputPath), { recursive: true });

    runCommand(
      report,
      "migration preflight",
      ["node", ["scripts/migration-preflight.js"]],
      drillDatabaseUrl,
      {
        MIGRATION_PREFLIGHT_TARGET: `${report.target}-drill`,
        MIGRATION_PREFLIGHT_OUTPUT: preflightOutputPath,
      },
    );
    runCommand(report, "inventory opening balance smoke", ["node", ["test/inventory-opening-balance-api-smoke.js"]], drillDatabaseUrl);
    runCommand(report, "daily ops mainline smoke", ["npm", ["run", "test:daily-ops:mainline"]], drillDatabaseUrl);
  } catch (error) {
    report.status = "fail";
    report.findings.push(error instanceof Error ? error.message : String(error));
  } finally {
    const keepDrillDatabase = process.env.KEEP_MIGRATION_REPLAY_DB === "true";
    if (keepDrillDatabase) {
      report.cleanup = "skipped";
    } else {
      await dropScratchDatabase(adminPrisma, drillDatabaseName);
      report.cleanup = "completed";
    }

    await adminPrisma.$disconnect();
  }

  if (process.env.MIGRATION_REPLAY_OUTPUT?.trim()) {
    fs.writeFileSync(process.env.MIGRATION_REPLAY_OUTPUT.trim(), `${JSON.stringify(report, null, 2)}\n`);
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== "pass") {
    process.exitCode = 1;
  }
}

function printHelp() {
  process.stdout.write(
    [
      "用法：DATABASE_URL=<source> ADMIN_DATABASE_URL=<admin> node apps/api/scripts/migration-replay-drill.js",
      "",
      "用途：在同一 PostgreSQL server 建立 scratch DB，重播 migrate/seed/smoke，作為 Slice 7 的 non-destructive rollback drill evidence。",
      "",
      "注意：",
      "- 預設會 drop/create 一個臨時資料庫，因此只應用在 staging 或 DBA 核准的 clone server。",
      "- production 正式環境請先跑 read-only migration preflight，再由人工確認是否允許 clone drill。",
      "",
      "可選環境變數：",
      "- MIGRATION_REPLAY_DB_NAME: 指定 scratch DB 名稱",
      "- KEEP_MIGRATION_REPLAY_DB=true: 保留 scratch DB 供人工 readback",
      "- MIGRATION_REPLAY_OUTPUT: 將 drill JSON 報告寫入指定檔案",
    ].join("\n") + "\n",
  );
}

function runCommand(report, label, [command, args], databaseUrl, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      ...extraEnv,
    },
    encoding: "utf8",
  });

  report.steps.push({
    label,
    command: [command, ...args].join(" "),
    status: result.status === 0 ? "pass" : "fail",
    stdoutTail: trimOutput(result.stdout),
    stderrTail: trimOutput(result.stderr),
  });

  if (result.status !== 0) {
    throw new Error(`${label} 失敗。`);
  }
}

async function resetScratchDatabase(adminPrisma, databaseName) {
  await terminateConnections(adminPrisma, databaseName);
  await adminPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`);
  await adminPrisma.$executeRawUnsafe(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
}

async function dropScratchDatabase(adminPrisma, databaseName) {
  await terminateConnections(adminPrisma, databaseName);
  await adminPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`);
}

async function terminateConnections(adminPrisma, databaseName) {
  await adminPrisma.$executeRawUnsafe(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
    databaseName,
  );
}

function replaceDatabaseName(databaseUrl, databaseName) {
  const parsed = new URL(databaseUrl);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
}

function assertSafeDatabaseName(databaseName) {
  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error(`不安全的 scratch DB 名稱：${databaseName}`);
  }
}

function assertReplayTargetAllowed(replayTarget) {
  if (/prod/i.test(replayTarget) && process.env.ALLOW_PRODUCTION_REPLAY_DRILL !== "true") {
    throw new Error("production target 不允許直接執行 replay drill；若為受控 drill，需明確設定 ALLOW_PRODUCTION_REPLAY_DRILL=true。");
  }
}

function assertSameServer(databaseUrl, adminDatabaseUrl) {
  const source = extractServerIdentity(databaseUrl);
  const admin = extractServerIdentity(adminDatabaseUrl);

  if (source.protocol !== admin.protocol || source.hostname !== admin.hostname || source.port !== admin.port) {
    throw new Error("DATABASE_URL 與 ADMIN_DATABASE_URL 必須指向同一個 PostgreSQL server，否則不得執行 replay drill。");
  }
}

function extractServerIdentity(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port || "5432",
  };
}

function quoteIdentifier(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

function trimOutput(output) {
  if (!output) {
    return "";
  }

  const normalized = output.trim();
  if (normalized.length <= 2000) {
    return normalized;
  }

  return normalized.slice(-2000);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
