import { ProductionPlanLevel } from '../../types/daily-ops.types';

export class UpdateProductionPlanDto {
  revisedBy!: string;
  lines!: Array<{
    planLevel: ProductionPlanLevel;
    targetSku: string;
    targetName: string;
    plannedQty: number;
    uom: string;
  }>;
}