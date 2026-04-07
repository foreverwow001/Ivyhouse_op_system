import { CountScope, InventoryBucketType } from '../../types/daily-ops.types';

export class CreateInventoryCountDto {
  countScope!: CountScope;
  performedBy!: string;
  lines!: Array<{
    bucketType: InventoryBucketType;
    itemSku: string;
    beforeQty: number;
    countedQty: number;
    note?: string;
  }>;
}