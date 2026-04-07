import { Injectable } from '@nestjs/common';
import { InventoryEventType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async recordDeductionRun(input: {
    runId: string;
    performedBy: string;
    performedAt: Date;
    lines: Array<{
      bucketType: string;
      itemSku: string;
      quantity: unknown;
      fallbackFromBucket?: string | null;
    }>;
  }) {
    if (input.lines.length === 0) {
      return;
    }

    await this.prisma.inventoryEventLedger.createMany({
      data: input.lines.map((line) => ({
        eventType: line.fallbackFromBucket
          ? InventoryEventType.DEDUCTION_FALLBACK
          : InventoryEventType.DEDUCTION,
        bucketType: line.bucketType as any,
        itemSku: line.itemSku,
        qtyDelta: -Math.abs(Number(line.quantity)),
        sourceType: 'InventoryDeductionRun',
        sourceId: input.runId,
        performedBy: input.performedBy,
        performedAt: input.performedAt,
      })),
    });
  }

  async recordBomReservation(input: {
    runId: string;
    performedBy: string;
    performedAt: Date;
    lines: Array<{
      materialType: string;
      materialSku: string;
      qtyDelta: unknown;
    }>;
  }) {
    if (input.lines.length === 0) {
      return;
    }

    await this.prisma.inventoryEventLedger.createMany({
      data: input.lines.map((line) => ({
        eventType: Number(line.qtyDelta) >= 0 ? InventoryEventType.BOM_REVERSAL : InventoryEventType.BOM_RESERVATION,
        bucketType: this.mapMaterialTypeToBucket(line.materialType),
        itemSku: line.materialSku,
        qtyDelta: Number(line.qtyDelta),
        sourceType: 'BomReservationRun',
        sourceId: input.runId,
        performedBy: input.performedBy,
        performedAt: input.performedAt,
      })),
    });
  }

  private mapMaterialTypeToBucket(materialType: string) {
    if (materialType === 'MATERIAL') {
      return 'PACKAGING_MATERIAL';
    }

    if (materialType === 'SELLABLE_PRODUCT') {
      return 'SELLABLE';
    }

    return 'INNER_PACK_FINISHED';
  }

  async recordReplenishmentRun(input: {
    runId: string;
    performedBy: string;
    performedAt: Date;
    lines: Array<{
      bucketType: string;
      itemSku: string;
      quantity: unknown;
    }>;
  }) {
    if (input.lines.length === 0) {
      return;
    }

    await this.prisma.inventoryEventLedger.createMany({
      data: input.lines.map((line) => ({
        eventType: InventoryEventType.REPLENISHMENT,
        bucketType: line.bucketType as any,
        itemSku: line.itemSku,
        qtyDelta: Math.abs(Number(line.quantity)),
        sourceType: 'ReplenishmentRun',
        sourceId: input.runId,
        performedBy: input.performedBy,
        performedAt: input.performedAt,
      })),
    });
  }

  async recordAdjustments(
    adjustments: Array<{
      id: string;
      bucketType: string;
      itemSku: string;
      qtyDelta: unknown;
      performedBy: string;
      performedAt: Date;
      sourceType?: string;
    }>,
  ) {
    if (adjustments.length === 0) {
      return;
    }

    await this.prisma.inventoryEventLedger.createMany({
      data: adjustments.map((adjustment) => ({
        eventType: adjustment.sourceType === 'MANUAL'
          ? InventoryEventType.MANUAL_ADJUSTMENT
          : InventoryEventType.COUNT_ADJUSTMENT,
        bucketType: adjustment.bucketType as any,
        itemSku: adjustment.itemSku,
        qtyDelta: Number(adjustment.qtyDelta),
        sourceType: 'InventoryAdjustmentEvent',
        sourceId: adjustment.id,
        performedBy: adjustment.performedBy,
        performedAt: adjustment.performedAt,
      })),
    });
  }

  async getNegativeStockAlerts() {
    const balances = await this.prisma.inventoryEventLedger.groupBy({
      by: ['itemSku', 'bucketType'],
      _sum: {
        qtyDelta: true,
      },
      _max: {
        performedAt: true,
      },
    });

    return balances
      .filter((item) => Number(item._sum.qtyDelta ?? 0) < 0)
      .map((item) => ({
        itemSku: item.itemSku,
        bucketType: item.bucketType,
        currentQty: Number(item._sum.qtyDelta ?? 0),
        lastLedgerAt: item._max.performedAt,
      }));
  }
}