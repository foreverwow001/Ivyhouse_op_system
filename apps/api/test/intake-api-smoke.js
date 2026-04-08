const assert = require('node:assert/strict');
const fs = require('node:fs');
const net = require('node:net');
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
    let settled = false;
    let stdoutBuffer = '';
    let stderrBuffer = '';
    const timeout = setTimeout(() => {
      const details = [
        'API smoke test 等待 server 啟動逾時',
        `stdout=${summarizeOutput(stdoutBuffer)}`,
        `stderr=${summarizeOutput(stderrBuffer)}`,
      ].join('\n');

      finish(new Error(details));
    }, 20000);

    const readinessInterval = setInterval(() => {
      probePort(port)
        .then(() => finish())
        .catch(() => undefined);
    }, 200);

    const onStdout = (chunk) => {
      const text = chunk.toString();
      stdoutBuffer = appendOutput(stdoutBuffer, text);

      if (text.includes('Nest application successfully started')) {
        finish();
      }
    };

    const onStderr = (chunk) => {
      const text = chunk.toString();
      stderrBuffer = appendOutput(stderrBuffer, text);
      if (text.trim()) {
        finish(new Error(`API smoke test 啟動失敗: ${text}`));
      }
    };

    const onExit = (code) => {
      finish(new Error(`API smoke test server 提前結束，exit code=${code}`));
    };

    function cleanup() {
      clearTimeout(timeout);
      clearInterval(readinessInterval);
      server.stdout.off('data', onStdout);
      server.stderr.off('data', onStderr);
      server.off('exit', onExit);
    }

    function finish(error) {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      if (error) {
        reject(error);
        return;
      }

      resolve(undefined);
    }

    server.stdout.on('data', onStdout);
    server.stderr.on('data', onStderr);
    server.on('exit', onExit);
  });
}

function probePort(portNumber) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: portNumber });

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('probe timeout'));
    }, 150);

    socket.once('connect', () => {
      clearTimeout(timer);
      socket.end();
      resolve(undefined);
    });

    socket.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function appendOutput(buffer, chunk) {
  const next = `${buffer}${chunk}`;

  if (next.length <= 500) {
    return next;
  }

  return next.slice(-500);
}

function summarizeOutput(value) {
  const normalized = String(value ?? '').trim();
  return normalized ? normalized : '<empty>';
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

  if (fixture.expectedExceptionCount > 0) {
    const confirmError = await expectHttpErrorJson(
      `/api/intake/batches/${batch.intakeBatchId}/confirm`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationNote: 'smoke should reject unresolved exceptions',
          expectedExceptionCount: 0,
          confirmedBy: 'fixture-test',
        }),
      },
      409,
    );

    assert.equal(confirmError.errorCode, 'INTAKE_BATCH_HAS_OPEN_EXCEPTIONS');
    assert.equal(confirmError.details.openExceptionCount, fixture.expectedExceptionCount);
  }

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

async function expectHttpErrorJson(pathname, options, expectedStatus) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, options);
  const bodyText = await response.text();

  assert.equal(response.status, expectedStatus, `${pathname} 預期 HTTP ${expectedStatus}，實際為 ${response.status}`);

  try {
    return JSON.parse(bodyText);
  } catch (error) {
    throw new Error(`${pathname} 預期 JSON 錯誤回應，實際 body=${bodyText}`);
  }
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/gu, '');
}