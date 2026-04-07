import {
  AdjustmentSourceType,
  CountScope,
  CountSessionStatus,
  InventoryBucketType,
} from '../../types/daily-ops.types';
import {
  InventoryRollingMetrics,
  InventoryVarianceSummaryMetrics,
  VarianceDirection,
} from '../inventory-count.metrics';

export interface InventoryVarianceSummaryDto extends InventoryVarianceSummaryMetrics {}

export interface InventoryRollingMetricDto extends InventoryRollingMetrics {
  lastCountedAt: string | null;
}

export interface InventoryApprovalStateDto {
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approverPrincipalId: string | null;
  approvedAt: string | null;
  singlePersonOverride: boolean;
}

export interface InventoryCountLineResponseDto {
  lineId: string;
  sessionId: string;
  bucketType: InventoryBucketType;
  itemSku: string;
  itemName: string;
  inventoryPrimaryUnit: string;
  beforeQty: number;
  countedQty: number;
  differenceQty: number;
  variancePct: number | null;
  errorPct: number | null;
  varianceDirection: VarianceDirection;
  zeroBaselineFlag: boolean;
  note: string | null;
  countedAt: string | null;
  countScope: CountScope;
}

export interface InventoryCountLineListResponseDto {
  items: InventoryCountLineResponseDto[];
  page: number;
  pageSize: number;
  total: number;
}

export interface InventoryCountSessionResponseDto {
  sessionId: string;
  countScope: CountScope;
  status: CountSessionStatus;
  performedBy: string;
  startedAt: string;
  cancelledAt: string | null;
  cancelledByPrincipalId: string | null;
  cancelReason: string | null;
  completedAt: string | null;
  completedByPrincipalId: string | null;
  lineCount: number;
  summary: InventoryVarianceSummaryDto;
  completionApproval: InventoryApprovalStateDto | null;
  lines?: InventoryCountLineResponseDto[];
}

export interface InventoryAdjustmentResponseDto {
  adjustmentId: string;
  sourceType: AdjustmentSourceType;
  sourceSessionId: string | null;
  bucketType: InventoryBucketType;
  itemSku: string;
  itemName: string;
  qtyDelta: number;
  reason: string | null;
  performedBy: string;
  performedAt: string;
  approval: InventoryApprovalStateDto | null;
}

export interface CompleteInventoryCountResponseDto {
  session: InventoryCountSessionResponseDto;
  adjustments: InventoryAdjustmentResponseDto[];
}

export interface InventoryItemVarianceSummaryResponseDto {
  bucketType: InventoryBucketType;
  itemSku: string;
  itemName: string;
  inventoryPrimaryUnit: string;
  latestCount: {
    sessionId: string;
    countScope: CountScope;
    countedAt: string;
    beforeQty: number;
    countedQty: number;
    differenceQty: number;
    variancePct: number | null;
    errorPct: number | null;
    varianceDirection: VarianceDirection;
    zeroBaselineFlag: boolean;
  } | null;
  rollingMetrics: {
    last7Days: InventoryRollingMetricDto;
    last30Days: InventoryRollingMetricDto;
  };
  uiHints: {
    showZeroBaselineHint: boolean;
    showSemiFinishedVarianceDisclaimer: boolean;
    varianceDisclaimer: string | null;
  };
}

export interface InventoryItemVarianceHistoryResponseDto {
  items: Array<{
    sessionId: string;
    lineId: string;
    countScope: CountScope;
    countedAt: string;
    beforeQty: number;
    countedQty: number;
    differenceQty: number;
    variancePct: number | null;
    errorPct: number | null;
    varianceDirection: VarianceDirection;
    zeroBaselineFlag: boolean;
    note: string | null;
    performedBy: string;
  }>;
  page: number;
  pageSize: number;
  total: number;
}

export interface NegativeStockAlertResponseDto {
  bucketType: InventoryBucketType;
  itemSku: string;
  itemName: string;
  currentQty: number;
  inventoryPrimaryUnit: string;
  lastLedgerAt: string | null;
  alertReason: string;
}

export interface CountReminderResponseDto {
  countScope: CountScope;
  sessionId: string | null;
  status: string;
  startedAt: string | null;
  lastCompletedAt: string | null;
  reminderReason: string;
}