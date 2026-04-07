const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { intakeSourceDocumentsDir } = require('./fixtures/intake-source-documents-path');

const { autoMapParsedLineToBootstrapResult } = require('../dist/intake/mapping/bootstrap-mapping.engine.js');
const { parseMomoPdfToParsedLines } = require('../dist/intake/parsers/momo-pdf.parser.js');
const { parseOfficialXlsxToParsedLines } = require('../dist/intake/parsers/official-xlsx.parser.js');
const { parseOrangePointXlsToParsedLines } = require('../dist/intake/parsers/orangepoint-xls.parser.js');
const { parseShopeePdfToParsedLines } = require('../dist/intake/parsers/shopee-pdf.parser.js');

const fixtureFile = path.join(__dirname, 'fixtures', 'intake-mapping-fixtures.json');
const sampleDir = intakeSourceDocumentsDir;
const fixtureList = JSON.parse(fs.readFileSync(fixtureFile, 'utf8')).fixtures;

for (const fixture of fixtureList) {
  test(`${fixture.channelCode} mapping fixture ${fixture.fileName}`, async () => {
    const parser = selectParser(fixture.channelCode);
    const parsedLines = await parser({
      fileBuffer: fs.readFileSync(path.join(sampleDir, fixture.fileName)),
      originalFileName: fixture.fileName,
    });

    const mappingResults = parsedLines.map((parsedLine) =>
      autoMapParsedLineToBootstrapResult({
        channelCode: fixture.channelCode,
        rawProductText: parsedLine.rawProductText,
        rawSpecText: parsedLine.rawSpecText,
        rawQuantity: parsedLine.rawQuantity,
        parseKind: parsedLine.parseKind,
      }),
    );

    const mappedProducts = mappingResults.map((item) => item.matchedProductName).filter(Boolean);
    const mappedSkus = mappingResults.map((item) => item.sellableProductSku).filter(Boolean);
    const reviewCount = mappingResults.filter((item) => item.status === '待人工覆核').length;
    const unmappedCount = mappingResults.filter((item) => item.status === '未映射').length;
    const ruleCodes = new Set(mappingResults.map((item) => item.mappingRuleCode).filter(Boolean));

    assert.equal(mappingResults.length, fixture.expectedMappingCount, `${fixture.fileName} mapping 筆數不符`);
    assert.equal(unmappedCount, fixture.expectedUnmappedCount, `${fixture.fileName} unmappedCount 不符`);
    assert.equal(reviewCount, fixture.expectedReviewCount, `${fixture.fileName} reviewCount 不符`);

    for (const expectedMappedProduct of fixture.expectedMappedProducts) {
      assert.ok(
        mappedProducts.some((product) => normalizeText(product).includes(normalizeText(expectedMappedProduct))),
        `${fixture.fileName} 缺少代表 mapping 商品 ${expectedMappedProduct}`,
      );
    }

    for (const expectedRuleCode of fixture.expectedRuleCodes ?? []) {
      assert.ok(ruleCodes.has(expectedRuleCode), `${fixture.fileName} 缺少 rule code ${expectedRuleCode}`);
    }

    for (const expectedMappedSku of fixture.expectedMappedSkus ?? []) {
      assert.ok(mappedSkus.includes(expectedMappedSku), `${fixture.fileName} 缺少 sellable SKU ${expectedMappedSku}`);
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