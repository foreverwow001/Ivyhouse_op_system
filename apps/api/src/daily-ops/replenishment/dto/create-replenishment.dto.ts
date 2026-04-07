import { InventoryBucketType } from '../../types/daily-ops.types';

export class CreateReplenishmentDto {
  businessDate!: string;
  performedBy!: string;
  lines!: Array<{
    bucketType: InventoryBucketType;
    itemSku: string;
    itemName: string;
    quantity: number;
    uom: string;
  }>;
}