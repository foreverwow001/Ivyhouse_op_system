import { Injectable } from '@nestjs/common';
import { InventoryItemType, ProductionPlanLevel } from '@prisma/client';

import { MasterDataService } from './master-data.service';

type PlanLineInput = {
  planLevel: string;
  targetSku: string;
  targetName: string;
  plannedQty: number;
  uom: string;
};

type BomLineDraft = {
  materialType: InventoryItemType;
  materialSku: string;
  materialName: string;
  qtyDelta: number;
  uom: string;
};

@Injectable()
export class RecipeOwnerService {
  constructor(private readonly masterDataService: MasterDataService) {}

  async buildReservationLinesForPlanLines(planLines: PlanLineInput[]) {
    const compositionRows = this.masterDataService.readOwnerRows('1-2026-03-24_銷售商品組成對照表_template.csv');
    const innerMaterialRows = this.masterDataService.readOwnerRows('2026-03-31_內包裝耗材用量對照表_template.csv');
    const conversionRows = this.masterDataService.readOwnerRows('2026-03-25_生產_分裝_轉換扣帳規則表_template.csv');

    const result = new Map<string, BomLineDraft>();

    for (const planLine of planLines) {
      if (planLine.planLevel === ProductionPlanLevel.SELLABLE) {
        this.expandSellablePlanLine(planLine, compositionRows, result);
        continue;
      }

      this.expandInnerPackPlanLine(planLine, innerMaterialRows, conversionRows, result);
    }

    return Array.from(result.values()).map((line) => ({
      materialType: line.materialType,
      materialSku: line.materialSku,
      materialName: line.materialName,
      qtyDelta: line.qtyDelta,
      uom: line.uom,
    }));
  }

  private expandSellablePlanLine(
    planLine: PlanLineInput,
    compositionRows: Record<string, unknown>[],
    result: Map<string, BomLineDraft>,
  ) {
    const matchedRows = compositionRows.filter(
      (row) =>
        String(row['銷售商品SKU_正式'] ?? '').trim() === planLine.targetSku,
    );

    for (const row of matchedRows) {
      const componentSku = String(row['對應內包裝成品SKU'] ?? '').trim();
      const componentName = String(row['對應內包裝成品名稱'] ?? '').trim();
      const componentQty = Number(row['每1單位銷售商品需用內包裝數量'] ?? 0);
      const componentUom = String(row['內包裝扣帳單位'] ?? '').trim() || '個';
      if (componentSku && componentQty > 0) {
        const componentType = this.masterDataService.resolveCompositionInputType(componentSku);
        this.mergeLine(result, {
          materialType: componentType,
          materialSku: componentSku,
          materialName: componentName || componentSku,
          qtyDelta: -componentQty * planLine.plannedQty,
          uom: componentUom,
        });
      }

      const materialSku = String(row['外包裝材料SKU'] ?? '').trim();
      const materialName = String(row['外包裝材料名稱'] ?? '').trim();
      const materialQty = Number(row['外包裝材料數量'] ?? 0);
      const materialUom = String(row['外包裝扣帳單位'] ?? '').trim() || '個';
      if (materialSku && materialQty > 0) {
        this.mergeLine(result, {
          materialType: InventoryItemType.MATERIAL,
          materialSku,
          materialName: materialName || materialSku,
          qtyDelta: -materialQty * planLine.plannedQty,
          uom: materialUom,
        });
      }
    }
  }

  private expandInnerPackPlanLine(
    planLine: PlanLineInput,
    innerMaterialRows: Record<string, unknown>[],
    conversionRows: Record<string, unknown>[],
    result: Map<string, BomLineDraft>,
  ) {
    const matchedInnerMaterials = innerMaterialRows.filter(
      (row) => String(row['內包裝完成品SKU'] ?? '').trim() === planLine.targetSku,
    );

    for (const row of matchedInnerMaterials) {
      const materialSku = String(row['內包裝耗材SKU'] ?? '').trim();
      const materialName = String(row['內包裝耗材名稱'] ?? '').trim();
      const materialQty = Number(row['每1單位內包裝完成品需用耗材數量'] ?? 0);
      const materialUom = String(row['耗材扣帳單位'] ?? '').trim() || '個';
      if (materialSku && materialQty > 0) {
        this.mergeLine(result, {
          materialType: InventoryItemType.MATERIAL,
          materialSku,
          materialName: materialName || materialSku,
          qtyDelta: -materialQty * planLine.plannedQty,
          uom: materialUom,
        });
      }
    }

    const matchedConversions = conversionRows.filter(
      (row) => String(row['輸出項目SKU'] ?? '').trim() === planLine.targetSku,
    );

    for (const row of matchedConversions) {
      const inputSku = String(row['輸入項目SKU'] ?? '').trim();
      const inputName = String(row['輸入項目名稱'] ?? '').trim();
      const inputQty = Number(row['輸入標準數量'] ?? 0);
      const outputQty = Number(row['輸出標準數量'] ?? 0);
      const inputUom = String(row['輸入單位'] ?? '').trim() || '個';
      if (inputSku && inputQty > 0 && outputQty > 0) {
        this.mergeLine(result, {
          materialType: InventoryItemType.INNER_PACK_PRODUCT,
          materialSku: inputSku,
          materialName: inputName || inputSku,
          qtyDelta: -(inputQty / outputQty) * planLine.plannedQty,
          uom: inputUom,
        });
      }
    }
  }

  private mergeLine(result: Map<string, BomLineDraft>, line: BomLineDraft) {
    const key = `${line.materialType}:${line.materialSku}:${line.uom}`;
    const existing = result.get(key);
    if (existing) {
      existing.qtyDelta += line.qtyDelta;
      return;
    }

    result.set(key, { ...line });
  }
}