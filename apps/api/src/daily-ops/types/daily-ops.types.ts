export const demandBatchStatuses = ['DRAFT', 'CONFIRMED', 'VOIDED'] as const;
export type DemandBatchStatus = (typeof demandBatchStatuses)[number];

export const demandSourceTypes = ['ORDER_IMPORT', 'MANUAL_ENTRY'] as const;
export type DemandSourceType = (typeof demandSourceTypes)[number];

export const deductionRunStatuses = ['PENDING', 'EXECUTED', 'PARTIALLY_EXECUTED', 'VOIDED'] as const;
export type DeductionRunStatus = (typeof deductionRunStatuses)[number];

export const inventoryBucketTypes = [
  'SELLABLE',
  'INNER_PACK_FINISHED',
  'PACKAGING_MATERIAL',
  'SHIPPING_SUPPLY_MANUAL',
] as const;
export type InventoryBucketType = (typeof inventoryBucketTypes)[number];

export const inventoryItemTypes = ['SELLABLE_PRODUCT', 'INNER_PACK_PRODUCT', 'MATERIAL'] as const;
export type InventoryItemType = (typeof inventoryItemTypes)[number];

export const productionPlanStatuses = ['DRAFT', 'CONFIRMED', 'REVISED', 'VOIDED'] as const;
export type ProductionPlanStatus = (typeof productionPlanStatuses)[number];

export const productionPlanLevels = ['SELLABLE', 'INNER_PACK'] as const;
export type ProductionPlanLevel = (typeof productionPlanLevels)[number];

export const bomTriggerTypes = ['PLAN_CREATED', 'PLAN_REVISED', 'MANUAL_RERUN'] as const;
export type BomTriggerType = (typeof bomTriggerTypes)[number];

export const replenishmentStatuses = ['DRAFT', 'COMMITTED', 'VOIDED'] as const;
export type ReplenishmentStatus = (typeof replenishmentStatuses)[number];

export const countScopes = ['DAILY_OPS', 'PACKAGING_MATERIAL', 'SHIPPING_SUPPLY', 'FULL_WAREHOUSE'] as const;
export type CountScope = (typeof countScopes)[number];

export const countSessionStatuses = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type CountSessionStatus = (typeof countSessionStatuses)[number];

export const adjustmentSourceTypes = ['COUNT_SESSION', 'MANUAL', 'REPLENISHMENT'] as const;
export type AdjustmentSourceType = (typeof adjustmentSourceTypes)[number];

export interface DemandBatchRecord {
  id: string;
  batchNo: string;
  businessDate: string;
  sourceType: DemandSourceType;
  status: DemandBatchStatus;
  importedAt: string;
  importedBy: string;
  note?: string;
}

export interface DemandBatchLineRecord {
  id: string;
  batchId: string;
  channelCode: string;
  sellableSku: string;
  sellableName: string;
  spec?: string;
  quantity: number;
  shipDate?: string;
  rawSourceRef?: string;
}

export interface InventoryDeductionRunRecord {
  id: string;
  batchId: string;
  status: DeductionRunStatus;
  executedAt: string;
  executedBy: string;
  warningCount: number;
}

export interface InventoryDeductionLineRecord {
  id: string;
  runId: string;
  bucketType: InventoryBucketType;
  itemType: InventoryItemType;
  itemSku: string;
  quantity: number;
  fallbackFromBucket?: InventoryBucketType;
  warningCode?: string;
}

export interface ProductionPlanRecord {
  id: string;
  planDate: string;
  status: ProductionPlanStatus;
  createdBy: string;
  revisedFromId?: string;
}

export interface ProductionPlanLineRecord {
  id: string;
  planId: string;
  planLevel: ProductionPlanLevel;
  targetSku: string;
  targetName: string;
  plannedQty: number;
  uom: string;
}

export interface BomReservationRunRecord {
  id: string;
  planId: string;
  triggerType: BomTriggerType;
  executedAt: string;
  executedBy: string;
  reversedRunId?: string;
}

export interface ReplenishmentRunRecord {
  id: string;
  businessDate: string;
  status: ReplenishmentStatus;
  performedBy: string;
  performedAt: string;
}

export interface ReplenishmentLineRecord {
  id: string;
  runId: string;
  bucketType: InventoryBucketType;
  itemSku: string;
  itemName: string;
  quantity: number;
  uom: string;
}

export interface InventoryCountSessionRecord {
  id: string;
  countScope: CountScope;
  status: CountSessionStatus;
  performedBy: string;
  startedAt: string;
  completedAt?: string;
}

export interface InventoryCountLineRecord {
  id: string;
  sessionId: string;
  bucketType: InventoryBucketType;
  itemSku: string;
  beforeQty: number;
  countedQty: number;
  variancePct?: number;
  note?: string;
}

export interface InventoryAdjustmentRecord {
  id: string;
  sourceType: AdjustmentSourceType;
  sourceSessionId?: string;
  bucketType: InventoryBucketType;
  itemSku: string;
  qtyDelta: number;
  reason?: string;
  performedBy: string;
  performedAt: string;
}