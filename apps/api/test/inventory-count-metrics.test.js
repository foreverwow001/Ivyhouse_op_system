const assert = require('node:assert/strict');
const test = require('node:test');

const {
  calculateInventoryCountLineMetrics,
  calculateInventoryVarianceSummary,
  calculateInventoryRollingMetrics,
} = require('../dist/daily-ops/inventory-count/inventory-count.metrics.js');

test('zero baseline line 會回傳 null 百分比與 ZERO_BASELINE', () => {
  const result = calculateInventoryCountLineMetrics(0, 0.25);

  assert.equal(result.differenceQty, 0.25);
  assert.equal(result.variancePct, null);
  assert.equal(result.errorPct, null);
  assert.equal(result.varianceDirection, 'ZERO_BASELINE');
  assert.equal(result.zeroBaselineFlag, true);
});

test('帳面與實盤皆為 0 時視為 MATCHED 且百分比為 0', () => {
  const result = calculateInventoryCountLineMetrics(0, 0);

  assert.equal(result.differenceQty, 0);
  assert.equal(result.variancePct, 0);
  assert.equal(result.errorPct, 0);
  assert.equal(result.varianceDirection, 'MATCHED');
  assert.equal(result.zeroBaselineFlag, false);
});

test('summary 與 rolling metric 會排除 zero baseline 分母並正確計算 weighted error', () => {
  const summary = calculateInventoryVarianceSummary([
    { beforeQty: 10, countedQty: 8 },
    { beforeQty: 0, countedQty: 1 },
    { beforeQty: 5, countedQty: 5 },
  ]);
  const rolling = calculateInventoryRollingMetrics([
    { beforeQty: 10, countedQty: 8 },
    { beforeQty: 0, countedQty: 1 },
    { beforeQty: 5, countedQty: 5 },
  ]);

  assert.equal(summary.matchedLineCount, 1);
  assert.equal(summary.varianceLineCount, 2);
  assert.equal(summary.zeroBaselineLineCount, 1);
  assert.equal(summary.totalAbsDifferenceQty, 3);
  assert.equal(summary.weightedErrorPct, 13.33);

  assert.equal(rolling.countSessionCount, 3);
  assert.equal(rolling.totalAbsDifferenceQty, 3);
  assert.equal(rolling.zeroBaselineCount, 1);
  assert.equal(rolling.weightedErrorPct, 13.33);
});