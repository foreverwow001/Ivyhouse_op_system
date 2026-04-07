const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const { intakeSourceDocumentsDir } = require('./fixtures/intake-source-documents-path');

const fixtureFile = path.join(__dirname, 'fixtures', 'intake-mapping-fixtures.json');
const sampleDir = intakeSourceDocumentsDir;
const fixtureList = JSON.parse(fs.readFileSync(fixtureFile, 'utf8')).fixtures;
const port = 3105;

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
      reject(new Error('mapping API smoke test 等待 server 啟動逾時'));
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
        reject(new Error(`mapping API smoke test 啟動失敗: ${text}`));
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`mapping API smoke test server 提前結束，exit code=${code}`));
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
      createdBy: 'mapping-fixture-test',
    }),
  });

  const uploadForm = new FormData();
  const fileBuffer = fs.readFileSync(path.join(sampleDir, fixture.fileName));
  uploadForm.append('file', new Blob([fileBuffer]), fixture.fileName);
  uploadForm.append('channelCode', fixture.channelCode);
  uploadForm.append('intakeTarget', '正式需求');
  uploadForm.append('uploadedBy', 'mapping-fixture-test');

  const uploadResult = await fetchJson(`/api/intake/batches/${batch.intakeBatchId}/source-files`, {
    method: 'POST',
    body: uploadForm,
  });

  const parseResult = await fetchJson(`/api/intake/batches/${batch.intakeBatchId}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceFileIds: [uploadResult.sourceFileId],
      triggeredBy: 'mapping-fixture-test',
    }),
  });

  const mappingResults = await fetchJson(
    `/api/intake/batches/${batch.intakeBatchId}/mapping-results?page=1&pageSize=1000`,
  );

  const mappedProducts = mappingResults.items.map((item) => item.matchedProductName).filter(Boolean);
  const mappedSkus = mappingResults.items.map((item) => item.sellableProductSku).filter(Boolean);
  const reviewCount = mappingResults.items.filter((item) => item.status === '待人工覆核').length;
  const unmappedCount = mappingResults.items.filter((item) => item.status === '未映射').length;
  const ruleCodes = new Set(mappingResults.items.map((item) => item.mappingRuleCode).filter(Boolean));

  assert.equal(
    parseResult.mappingResultCount,
    fixture.expectedMappingCount,
    `${fixture.fileName} parseResult.mappingResultCount 不符`,
  );
  assert.equal(mappingResults.total, fixture.expectedMappingCount, `${fixture.fileName} mapping total 不符`);
  assert.equal(unmappedCount, fixture.expectedUnmappedCount, `${fixture.fileName} mapping unmappedCount 不符`);
  assert.equal(reviewCount, fixture.expectedReviewCount, `${fixture.fileName} mapping reviewCount 不符`);

  for (const expectedMappedProduct of fixture.expectedMappedProducts) {
    assert.ok(
      mappedProducts.some((product) => normalizeText(product).includes(normalizeText(expectedMappedProduct))),
      `${fixture.fileName} API smoke 缺少 mapping 商品 ${expectedMappedProduct}`,
    );
  }

  for (const expectedRuleCode of fixture.expectedRuleCodes ?? []) {
    assert.ok(ruleCodes.has(expectedRuleCode), `${fixture.fileName} API smoke 缺少 rule code ${expectedRuleCode}`);
  }

  for (const expectedMappedSku of fixture.expectedMappedSkus ?? []) {
    assert.ok(mappedSkus.includes(expectedMappedSku), `${fixture.fileName} API smoke 缺少 sellable SKU ${expectedMappedSku}`);
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