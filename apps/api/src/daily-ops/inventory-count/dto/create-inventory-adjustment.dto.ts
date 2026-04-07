import { AdjustmentSourceType, InventoryBucketType } from '../../types/daily-ops.types';

export class CreateInventoryAdjustmentDto {
  sourceType!: AdjustmentSourceType;
  sourceSessionId?: string;
  bucketType!: InventoryBucketType;
  itemSku!: string;
  qtyDelta!: number;
  reason?: string;
  performedBy!: string;
}