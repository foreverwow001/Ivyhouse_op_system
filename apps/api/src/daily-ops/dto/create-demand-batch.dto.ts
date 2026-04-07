import { DemandSourceType } from '../types/daily-ops.types';

export class CreateDemandBatchDto {
  batchNo!: string;
  businessDate!: string;
  sourceType!: DemandSourceType;
  importedBy!: string;
  note?: string;
  lines!: Array<{
    channelCode: string;
    sellableSku: string;
    sellableName: string;
    spec?: string;
    quantity: number;
    shipDate?: string;
    rawSourceRef?: string;
  }>;
}