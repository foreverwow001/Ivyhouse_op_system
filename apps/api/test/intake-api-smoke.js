const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const { intakeSourceDocumentsDir } = require('./fixtures/intake-source-documents-path');

const fixtureFile = path.join(__dirname, 'fixtures', 'intake-parser-fixtures.json');
const sampleDir = intakeSourceDocumentsDir;
const fixtureList = JSON.parse(fs.readFileSync(fixtureFile, 'utf8')).fixtures;
const port = 3101;

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function run() {
  const server = spawn('node', ['dist/main.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForServerReady(server);

    for (const fixture of fixtureList) {
      await runFixture(fixture);
    }
  } finally {
    server.kill('SIGTERM');
    await once(server, 'exit').catch(() => undefined);
  }
}

async function waitForServerReady(server) {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('API smoke test 等待 server 啟動逾時'));
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
        reject(new Error(`API smoke test 啟動失敗: ${text}`));
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`API smoke test server 提前結束，exit code=${code}`));
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

async function runFixture(fixture) {
  const batch = await fetchJson('/api/intake/batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intakeTarget: '正式需求',
      primaryChannelCode: fixture.channelCode,
      batchDate: '2026-03-30',
      createdBy: 'fixture-test',
    }),
  });

  const uploadForm = new FormData();
  const fileBuffer = fs.readFileSync(path.join(sampleDir, fixture.fileName));
  uploadForm.append('file', new Blob([fileBuffer]), fixture.fileName);
  uploadForm.append('channelCode', fixture.channelCode);
  uploadForm.append('intakeTarget', '正式需求');
  uploadForm.append('uploadedBy', 'fixture-test');

  const uploadResult = await fetchJson(
    `/api/intake/batches/${batch.intakeBatchId}/source-files`,
    {
      method: 'POST',
      body: uploadForm,
    },
  );

  const parseResult = await fetchJson(`/api/intake/batches/${batch.intakeBatchId}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceFileIds: [uploadResult.sourceFileId],
      triggeredBy: 'fixture-test',
    }),
  });

  const parsedLines = await fetchJson(
    `/api/intake/batches/${batch.intakeBatchId}/parsed-lines?page=1&pageSize=500`,
  );
  const exceptions = await fetchJson(`/api/intake/batches/${batch.intakeBatchId}/exceptions`);
  const normalizedProducts = parsedLines.items.map((item) =>
    normalizeText(`${item.rawProductText ?? ''} ${item.rawSpecText ?? ''}`),
  );
  const giftCount = parsedLines.items.filter((item) => item.parseKind === '贈品').length;
  const trialCount = parsedLines.items.filter((item) => item.parseKind === '試吃組合').length;

  assert.equal(parseResult.parsedLineCount, fixture.expectedCount, `${fixture.fileName} parse count 不符`);
  assert.equal(parsedLines.total, fixture.expectedCount, `${fixture.fileName} parsed-lines total 不符`);
  assert.equal(exceptions.items.length, fixture.expectedExceptionCount, `${fixture.fileName} exception 數量不符`);

  for (const expectedProduct of fixture.expectedProducts) {
    assert.ok(
      normalizedProducts.some((product) => product.includes(normalizeText(expectedProduct))),
      `${fixture.fileName} API smoke 缺少代表商品 ${expectedProduct}`,
    );
  }

  for (const expectedWarningCode of fixture.expectedWarningCodes ?? []) {
    assert.ok(
      parsedLines.items.some((item) => item.parserWarningCode === expectedWarningCode),
      `${fixture.fileName} API smoke 缺少 warning ${expectedWarningCode}`,
    );
  }

  if (fixture.expectedHeaderRow) {
    assert.ok(
      parsedLines.items.every((item) => item.parserMeta.headerRow === fixture.expectedHeaderRow),
      `${fixture.fileName} API smoke header row 不符`,
    );
  }

  if (typeof fixture.expectedGiftCount === 'number') {
    assert.equal(giftCount, fixture.expectedGiftCount, `${fixture.fileName} API smoke giftCount 不符`);
  }

  if (typeof fixture.expectedTrialCount === 'number') {
    assert.equal(trialCount, fixture.expectedTrialCount, `${fixture.fileName} API smoke trialCount 不符`);
  }
}

async function fetchJson(pathname, options) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, options);
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${pathname}: ${bodyText}`);
  }

  return JSON.parse(bodyText);
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/gu, '');
}