export type VarianceDirection = 'MATCHED' | 'OVER' | 'SHORT' | 'ZERO_BASELINE';

export interface InventoryCountLineMetrics {
  beforeQty: number;
  countedQty: number;
  differenceQty: number;
  variancePct: number | null;
  errorPct: number | null;
  varianceDirection: VarianceDirection;
  zeroBaselineFlag: boolean;
}

export interface InventoryVarianceSummaryMetrics {
  matchedLineCount: number;
  varianceLineCount: number;
  zeroBaselineLineCount: number;
  totalAbsDifferenceQty: number;
  weightedErrorPct: number | null;
}

export interface InventoryRollingMetrics {
  countSessionCount: number;
  totalAbsDifferenceQty: number;
  weightedErrorPct: number | null;
  zeroBaselineCount: number;
}

export function calculateInventoryCountLineMetrics(
  beforeQtyInput: unknown,
  countedQtyInput: unknown,
): InventoryCountLineMetrics {
  const beforeQty = roundQuantity(Number(beforeQtyInput ?? 0));
  const countedQty = roundQuantity(Number(countedQtyInput ?? 0));
  const differenceQty = roundQuantity(countedQty - beforeQty);
  const zeroBaselineFlag = beforeQty === 0 && countedQty !== 0;

  let variancePct: number | null;
  let errorPct: number | null;

  if (zeroBaselineFlag) {
    variancePct = null;
    errorPct = null;
  } else if (beforeQty === 0 && countedQty === 0) {
    variancePct = 0;
    errorPct = 0;
  } else {
    variancePct = roundPercentage((differenceQty / beforeQty) * 100);
    errorPct = roundPercentage((Math.abs(differenceQty) / Math.abs(beforeQty)) * 100);
  }

  return {
    beforeQty,
    countedQty,
    differenceQty,
    variancePct,
    errorPct,
    varianceDirection: resolveVarianceDirection(differenceQty, zeroBaselineFlag),
    zeroBaselineFlag,
  };
}

export function calculateInventoryVarianceSummary(
  lines: Array<{ beforeQty: unknown; countedQty: unknown }>,
): InventoryVarianceSummaryMetrics {
  const metrics = lines.map((line) =>
    calculateInventoryCountLineMetrics(line.beforeQty, line.countedQty),
  );

  const weighted = calculateWeightedError(metrics);

  return {
    matchedLineCount: metrics.filter((line) => line.differenceQty === 0).length,
    varianceLineCount: metrics.filter((line) => line.differenceQty !== 0).length,
    zeroBaselineLineCount: metrics.filter((line) => line.zeroBaselineFlag).length,
    totalAbsDifferenceQty: roundQuantity(
      metrics.reduce((sum, line) => sum + Math.abs(line.differenceQty), 0),
    ),
    weightedErrorPct: weighted,
  };
}

export function calculateInventoryRollingMetrics(
  lines: Array<{ beforeQty: unknown; countedQty: unknown }>,
): InventoryRollingMetrics {
  const metrics = lines.map((line) =>
    calculateInventoryCountLineMetrics(line.beforeQty, line.countedQty),
  );

  return {
    countSessionCount: lines.length,
    totalAbsDifferenceQty: roundQuantity(
      metrics.reduce((sum, line) => sum + Math.abs(line.differenceQty), 0),
    ),
    weightedErrorPct: calculateWeightedError(metrics),
    zeroBaselineCount: metrics.filter((line) => line.zeroBaselineFlag).length,
  };
}

function calculateWeightedError(metrics: InventoryCountLineMetrics[]) {
  const weightedBase = metrics
    .filter((line) => line.beforeQty !== 0)
    .reduce(
      (accumulator, line) => {
        accumulator.difference += Math.abs(line.differenceQty);
        accumulator.before += Math.abs(line.beforeQty);
        return accumulator;
      },
      { difference: 0, before: 0 },
    );

  if (weightedBase.before === 0) {
    return null;
  }

  return roundPercentage((weightedBase.difference / weightedBase.before) * 100);
}

function resolveVarianceDirection(
  differenceQty: number,
  zeroBaselineFlag: boolean,
): VarianceDirection {
  if (zeroBaselineFlag) {
    return 'ZERO_BASELINE';
  }

  if (differenceQty > 0) {
    return 'OVER';
  }

  if (differenceQty < 0) {
    return 'SHORT';
  }

  return 'MATCHED';
}

export function roundQuantity(value: number) {
  return roundToPrecision(value, 3);
}

export function roundPercentage(value: number) {
  return roundToPrecision(value, 2);
}

function roundToPrecision(value: number, precision: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const rounded = Number(value.toFixed(precision));
  return Object.is(rounded, -0) ? 0 : rounded;
}