import { Injectable, NotFoundException } from '@nestjs/common';
import { ReplenishmentRunStatus } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { InventoryService } from '../../inventory/inventory.service';
import { MasterDataService } from '../../master-data/master-data.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CommitReplenishmentDto } from './dto/commit-replenishment.dto';
import { CreateReplenishmentDto } from './dto/create-replenishment.dto';

@Injectable()
export class ReplenishmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly masterDataService: MasterDataService,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
  ) {}

  async createRun(dto: CreateReplenishmentDto) {
    await this.masterDataService.assertInventoryItemsExist(
      dto.lines.map((line) => ({
        bucketType: line.bucketType,
        itemSku: line.itemSku,
      })),
    );

    const run = await this.prisma.replenishmentRun.create({
      data: {
        businessDate: new Date(dto.businessDate),
        status: ReplenishmentRunStatus.DRAFT,
        performedBy: dto.performedBy,
        performedAt: new Date(),
        lines: {
          create: dto.lines.map((line) => ({
            bucketType: line.bucketType,
            itemSku: line.itemSku,
            itemName: line.itemName,
            quantity: line.quantity,
            uom: line.uom,
          })),
        },
      },
      include: {
        lines: true,
      },
    });

    await this.auditService.record({
      action: 'replenishment-run.created',
      entityType: 'ReplenishmentRun',
      entityId: run.id,
      performedBy: dto.performedBy,
      payload: {
        lineCount: run.lines.length,
      },
    });

    return run;
  }

  async commitRun(runId: string, dto: CommitReplenishmentDto) {
    const run = await this.findRunOrThrow(runId);

    const updatedRun = await this.prisma.replenishmentRun.update({
      where: { id: run.id },
      data: {
        status: ReplenishmentRunStatus.COMMITTED,
        performedBy: dto.performedBy,
        performedAt: new Date(),
      },
      include: {
        lines: true,
      },
    });

    await this.inventoryService.recordReplenishmentRun({
      runId: updatedRun.id,
      performedBy: dto.performedBy,
      performedAt: updatedRun.performedAt,
      lines: updatedRun.lines,
    });

    await this.auditService.record({
      action: 'replenishment-run.committed',
      entityType: 'ReplenishmentRun',
      entityId: updatedRun.id,
      performedBy: dto.performedBy,
      payload: {
        lineCount: updatedRun.lines.length,
      },
    });

    return updatedRun;
  }

  private async findRunOrThrow(runId: string) {
    const run = await this.prisma.replenishmentRun.findUnique({
      where: { id: runId },
    });
    if (!run) {
      throw new NotFoundException(`找不到 replenishment run: ${runId}`);
    }

    return run;
  }
}