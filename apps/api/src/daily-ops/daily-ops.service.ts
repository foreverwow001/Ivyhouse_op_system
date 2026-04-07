import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DailyDemandBatchStatus, InventoryDeductionRunStatus, InventoryBucketType, InventoryItemType } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { InventoryService } from '../inventory/inventory.service';
import { MasterDataService } from '../master-data/master-data.service';
import { ConfirmDemandBatchDto } from './dto/confirm-demand-batch.dto';
import { CreateDemandBatchDto } from './dto/create-demand-batch.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyOpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly masterDataService: MasterDataService,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
  ) {}

  async createDemandBatch(dto: CreateDemandBatchDto) {
    await this.masterDataService.assertSellableSkusExist(dto.lines.map((line) => line.sellableSku));

    const batch = await this.prisma.dailyDemandBatch.create({
      data: {
        batchNo: dto.batchNo,
        businessDate: new Date(dto.businessDate),
        sourceType: dto.sourceType,
        status: DailyDemandBatchStatus.DRAFT,
        importedAt: new Date(),
        importedBy: dto.importedBy,
        lines: {
          create: dto.lines.map((line) => ({
            channelCode: line.channelCode,
            sellableSku: line.sellableSku,
            sellableName: line.sellableName,
            spec: line.spec,
            quantity: line.quantity,
            shipDate: line.shipDate ? new Date(line.shipDate) : undefined,
            rawSourceRef: line.rawSourceRef,
          })),
        },
      },
      include: {
        lines: true,
      },
    });

    await this.auditService.record({
      action: 'daily-demand-batch.created',
      entityType: 'DailyDemandBatch',
      entityId: batch.id,
      performedBy: dto.importedBy,
      payload: {
        batchNo: batch.batchNo,
        lineCount: batch.lines.length,
      },
    });

    return batch;
  }

  async confirmDemandBatch(batchId: string, dto: ConfirmDemandBatchDto) {
    const batch = await this.findDemandBatchOrThrow(batchId);
    if (batch.status !== DailyDemandBatchStatus.DRAFT) {
      throw new ConflictException(`daily demand batch 狀態不可確認：${batch.status}`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedBatch = await tx.dailyDemandBatch.update({
        where: { id: batch.id },
        data: {
          status: DailyDemandBatchStatus.CONFIRMED,
        },
        include: {
          lines: true,
        },
      });

      const deductionRun = await tx.inventoryDeductionRun.create({
        data: {
          batchId: batch.id,
          status: InventoryDeductionRunStatus.EXECUTED,
          executedAt: new Date(),
          executedBy: dto.executedBy,
          warningCount: 0,
          lines: {
            create: updatedBatch.lines.map((line) => ({
              bucketType: InventoryBucketType.SELLABLE,
              itemType: InventoryItemType.SELLABLE_PRODUCT,
              itemSku: line.sellableSku,
              quantity: line.quantity,
            })),
          },
        },
        include: {
          lines: true,
        },
      });

      return {
        batch: updatedBatch,
        deductionRun,
        deductionLines: deductionRun.lines,
      };
    });

    await this.inventoryService.recordDeductionRun({
      runId: result.deductionRun.id,
      performedBy: dto.executedBy,
      performedAt: result.deductionRun.executedAt,
      lines: result.deductionLines,
    });

    await this.auditService.record({
      action: 'daily-demand-batch.confirmed',
      entityType: 'DailyDemandBatch',
      entityId: result.batch.id,
      performedBy: dto.executedBy,
      payload: {
        deductionRunId: result.deductionRun.id,
        deductionLineCount: result.deductionLines.length,
      },
    });

    return result;
  }

  async getDemandBatch(batchId: string) {
    return this.findDemandBatchOrThrow(batchId);
  }

  private async findDemandBatchOrThrow(batchId: string) {
    const batch = await this.prisma.dailyDemandBatch.findUnique({
      where: { id: batchId },
      include: {
        lines: true,
        deductionRuns: {
          include: {
            lines: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`找不到 daily demand batch: ${batchId}`);
    }

    return batch;
  }
}