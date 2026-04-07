const test = require("node:test");
const assert = require("node:assert/strict");

const { buildPreflightReport, sanitizeDatabaseUrl } = require("../scripts/migration-preflight");

test("buildPreflightReport returns pass when repo and database migrations align", () => {
  const report = buildPreflightReport({
    target: "staging",
    databaseUrl: "postgresql://ivy:secret@db.example.com:5432/ivyhouse",
    expectedMigrations: ["20260401183000_daily_ops_persistence"],
    appliedMigrations: [
      {
        migrationName: "20260401183000_daily_ops_persistence",
        finishedAt: "2026-04-07T00:00:00.000Z",
        rolledBackAt: null,
        hasLogs: false,
      },
    ],
    extensionInventory: [{ name: "plpgsql", version: "1.0" }],
    databaseIdentity: {
      databaseName: "ivyhouse",
      schemaName: "public",
      currentUser: "ivy",
      serverVersion: "PostgreSQL 16",
    },
    requiredExtensions: ["plpgsql"],
  });

  assert.equal(report.status, "pass");
  assert.deepEqual(report.summary.pendingRepoMigrations, []);
  assert.deepEqual(report.summary.unexpectedDatabaseMigrations, []);
  assert.equal(report.database.url, "postgresql://db.example.com:5432/ivyhouse");
});

test("buildPreflightReport treats pending repo migrations as deploy-needed, not drift", () => {
  const report = buildPreflightReport({
    target: "staging",
    databaseUrl: "postgresql://ivy:secret@db.example.com:5432/ivyhouse",
    expectedMigrations: ["20260401183000_daily_ops_persistence"],
    appliedMigrations: [],
    migrationHistoryTableExists: false,
    extensionInventory: [{ name: "plpgsql", version: "1.0" }],
    databaseIdentity: {
      databaseName: "ivyhouse",
      schemaName: "public",
      currentUser: "ivy",
      serverVersion: "PostgreSQL 16",
    },
    requiredExtensions: [],
  });

  assert.equal(report.status, "pass");
  assert.equal(report.summary.deploymentNeeded, true);
  assert.equal(report.summary.migrationHistoryTableExists, false);
  assert.deepEqual(report.summary.pendingRepoMigrations, ["20260401183000_daily_ops_persistence"]);
});

test("buildPreflightReport fails closed on pending, drifted, and missing extension states", () => {
  const report = buildPreflightReport({
    target: "production",
    databaseUrl: "postgresql://ivy:secret@db.example.com/ivyhouse",
    expectedMigrations: [
      "20260401183000_daily_ops_persistence",
      "20260403154000_idx022_production_planning_approval_persistence",
    ],
    appliedMigrations: [
      {
        migrationName: "20260401183000_daily_ops_persistence",
        finishedAt: null,
        rolledBackAt: null,
        hasLogs: true,
      },
      {
        migrationName: "20260405000000_manual_hotfix",
        finishedAt: "2026-04-07T00:00:00.000Z",
        rolledBackAt: null,
        hasLogs: false,
      },
    ],
    extensionInventory: [{ name: "plpgsql", version: "1.0" }],
    databaseIdentity: {
      databaseName: "ivyhouse",
      schemaName: "public",
      currentUser: "ivy",
      serverVersion: "PostgreSQL 16",
    },
    requiredExtensions: ["pgcrypto"],
  });

  assert.equal(report.status, "fail");
  assert.deepEqual(report.summary.pendingRepoMigrations, ["20260403154000_idx022_production_planning_approval_persistence"]);
  assert.deepEqual(report.summary.unexpectedDatabaseMigrations, ["20260405000000_manual_hotfix"]);
  assert.deepEqual(report.summary.failedMigrations, ["20260401183000_daily_ops_persistence"]);
  assert.deepEqual(report.summary.missingRequiredExtensions, ["pgcrypto"]);
  assert.ok(report.findings.length >= 3);
});

test("sanitizeDatabaseUrl strips credentials", () => {
  assert.equal(
    sanitizeDatabaseUrl("postgresql://ivy:secret@db.example.com:5432/ivyhouse?schema=public"),
    "postgresql://db.example.com:5432/ivyhouse",
  );
});
