import { ProductionPlanLevel } from '../../types/daily-ops.types';

export class CreateProductionPlanDto {
  planDate!: string;
  createdBy!: string;
  lines!: Array<{
    planLevel: ProductionPlanLevel;
    targetSku: string;
    targetName: string;
    plannedQty: number;
    uom: string;
  }>;
}