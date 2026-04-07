const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { intakeSourceDocumentsDir } = require('./fixtures/intake-source-documents-path');

const { parseMomoPdfToParsedLines } = require('../dist/intake/parsers/momo-pdf.parser.js');
const { parseOfficialXlsxToParsedLines } = require('../dist/intake/parsers/official-xlsx.parser.js');
const { parseOrangePointXlsToParsedLines } = require('../dist/intake/parsers/orangepoint-xls.parser.js');
const { parseShopeePdfToParsedLines } = require('../dist/intake/parsers/shopee-pdf.parser.js');

const fixtureFile = path.join(__dirname, 'fixtures', 'intake-parser-fixtures.json');
const sampleDir = intakeSourceDocumentsDir;
const fixtureList = JSON.parse(fs.readFileSync(fixtureFile, 'utf8')).fixtures;

for (const fixture of fixtureList) {
  test(`${fixture.channelCode} fixture ${fixture.fileName}`, async () => {
    const parser = selectParser(fixture.channelCode);
    const parsedLines = await parser({
      fileBuffer: fs.readFileSync(path.join(sampleDir, fixture.fileName)),
      originalFileName: fixture.fileName,
    });
    const normalizedProducts = parsedLines.map((item) =>
      normalizeText(`${item.rawProductText ?? ''} ${item.rawSpecText ?? ''}`),
    );
    const warningCodes = new Set(parsedLines.map((item) => item.parserWarningCode).filter(Boolean));
    const giftCount = parsedLines.filter((item) => item.parseKind === '贈品').length;
    const trialCount = parsedLines.filter((item) => item.parseKind === '試吃組合').length;

    assert.equal(parsedLines.length, fixture.expectedCount, `${fixture.fileName} 筆數不符`);

    for (const expectedProduct of fixture.expectedProducts) {
      assert.ok(
        normalizedProducts.some((product) => product.includes(normalizeText(expectedProduct))),
        `${fixture.fileName} 缺少代表商品 ${expectedProduct}`,
      );
    }

    for (const expectedWarningCode of fixture.expectedWarningCodes ?? []) {
      assert.ok(
        warningCodes.has(expectedWarningCode),
        `${fixture.fileName} 缺少 parser warning ${expectedWarningCode}`,
      );
    }

    if (fixture.expectedHeaderRow) {
      assert.ok(
        parsedLines.every((item) => item.parserMeta.headerRow === fixture.expectedHeaderRow),
        `${fixture.fileName} header row 不符預期`,
      );
    }

    if (typeof fixture.expectedGiftCount === 'number') {
      assert.equal(giftCount, fixture.expectedGiftCount, `${fixture.fileName} giftCount 不符`);
    }

    if (typeof fixture.expectedTrialCount === 'number') {
      assert.equal(trialCount, fixture.expectedTrialCount, `${fixture.fileName} trialCount 不符`);
    }
  });
}

function selectParser(channelCode) {
  if (channelCode === 'MOMO') {
    return parseMomoPdfToParsedLines;
  }

  if (channelCode === 'OFFICIAL') {
    return parseOfficialXlsxToParsedLines;
  }

  if (channelCode === 'SHOPEE') {
    return parseShopeePdfToParsedLines;
  }

  if (channelCode === 'ORANGEPOINT') {
    return parseOrangePointXlsToParsedLines;
  }

  throw new Error(`未支援的 fixture channelCode: ${channelCode}`);
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/gu, '');
}