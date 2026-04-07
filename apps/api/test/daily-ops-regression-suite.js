const { spawn } = require('node:child_process');

const adminDatabaseUrl =
  process.env.ADMIN_DATABASE_URL || 'postgresql://vscode@127.0.0.1:55432/postgres';
const testDatabaseUrl = process.env.DATABASE_URL || 'postgresql://vscode@127.0.0.1:55432/ivyhouse_api_test?schema=public';

const scenarios = [
  {
    id: 'zero-baseline-opening-balance',
    command: 'node',
    args: ['test/inventory-opening-balance-api-smoke.js'],
  },
  {
    id: 'negative-stock-reminder-and-reject',
    command: 'node',
    args: ['test/inventory-count-api-smoke.js'],
  },
  {
    id: 'rerun-and-revision-regression',
    command: 'node',
    args: ['test/production-plan-rerun-regression-smoke.js'],
  },
];

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function run() {
  const results = [];

  for (const scenario of scenarios) {
    await resetDatabase();
    await runCommand('npx', ['prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma']);
    await runCommand(scenario.command, scenario.args);
    results.push({ id: scenario.id, result: 'PASS' });
  }

  if (results.some((item) => item.result !== 'PASS')) {
    throw new Error(`daily ops regression suite 失敗: ${JSON.stringify(results)}`);
  }
}

async function resetDatabase() {
  await runCommand('psql', [adminDatabaseUrl, '-c', 'DROP DATABASE IF EXISTS ivyhouse_api_test;', '-c', 'CREATE DATABASE ivyhouse_api_test;'], {
    env: process.env,
  });
}

async function runCommand(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
      },
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} 失敗\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`));
    });
  });
}