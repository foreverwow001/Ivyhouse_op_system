import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ApprovalStatus,
  InventoryAdjustmentSourceType,
  InventoryCountSessionStatus,
} from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { PortalSessionPrincipal } from '../../common/auth/portal-session-principal';
import { InventoryService } from '../../inventory/inventory.service';
import { MasterDataService } from '../../master-data/master-data.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CancelInventoryCountDto } from './dto/cancel-inventory-count.dto';
import { CompleteInventoryCountDto } from './dto/complete-inventory-count.dto';
import { CreateInventoryAdjustmentDto } from './dto/create-inventory-adjustment.dto';
import { CreateInventoryCountDto } from './dto/create-inventory-count.dto';
import {
  InventoryApprovalStateDto,
  CompleteInventoryCountResponseDto,
  CountReminderResponseDto,
  InventoryAdjustmentResponseDto,
  InventoryCountLineListResponseDto,
  InventoryCountLineResponseDto,
  InventoryCountSessionResponseDto,
  InventoryItemVarianceHistoryResponseDto,
  InventoryItemVarianceSummaryResponseDto,
  InventoryRollingMetricDto,
  NegativeStockAlertResponseDto,
} from './dto/inventory-count-response.dto';
import {
  calculateInventoryCountLineMetrics,
  calculateInventoryRollingMetrics,
  calculateInventoryVarianceSummary,
  roundQuantity,
  VarianceDirection,
} from './inventory-count.metrics';

@Injectable()
export class InventoryCountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly masterDataService: MasterDataService,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
  ) {}

  async createSession(
    dto: CreateInventoryCountDto,
    principal: PortalSessionPrincipal,
  ): Promise<InventoryCountSessionResponseDto> {
    await this.assertSessionWindowAvailable(dto.countScope, this.isOpeningBalanceCandidate(dto.lines));

    await this.masterDataService.assertInventoryItemsExist(
      dto.lines.map((line) => ({
        bucketType: line.bucketType,
        itemSku: line.itemSku,
      })),
    );

    const session = await this.prisma.inventoryCountSession.create({
      data: {
        countScope: dto.countScope,
        status: InventoryCountSessionStatus.IN_PROGRESS,
        performedBy: principal.principalId,
        startedBySessionId: principal.sessionId,
        startedByAuthSource: principal.authSource,
        startedAt: new Date(),
        lines: {
          create: dto.lines.map((line) => ({
            bucketType: line.bucketType,
            itemSku: line.itemSku,
            beforeQty: line.beforeQty,
            countedQty: line.countedQty,
            variancePct:
              line.beforeQty === 0
                ? undefined
                : ((line.countedQty - line.beforeQty) / line.beforeQty) * 100,
            note: line.note,
          })),
        },
      },
      include: {
        lines: true,
      },
    });

    await this.auditService.record({
      action: 'inventory-count.started',
      entityType: 'InventoryCountSession',
      entityId: session.id,
      performedBy: principal.principalId,
      payload: {
        countScope: session.countScope,
        lineCount: session.lines.length,
        actor: this.buildPrincipalAuditPayload(principal),
      },
    });

    return this.buildSessionResponse(session, true);
  }

  private async assertSessionWindowAvailable(countScope: string, requestedIsOpeningBalance: boolean) {
    const [completedSessionCount, inProgressSession] = await this.prisma.$transaction([
      this.prisma.inventoryCountSession.count({
        where: {
          countScope: countScope as any,
          status: InventoryCountSessionStatus.COMPLETED,
        },
      }),
      this.prisma.inventoryCountSession.findFirst({
        where: {
          status: InventoryCountSessionStatus.IN_PROGRESS,
        },
        include: {
          lines: true,
        },
        orderBy: {
          startedAt: 'asc',
        },
      }),
    ]);

    if (!inProgressSession) {
      return;
    }

    if (inProgressSession.countScope !== countScope) {
      const inProgressIsOpeningBalance = this.isOpeningBalanceCandidate(inProgressSession.lines);

      if (requestedIsOpeningBalance || inProgressIsOpeningBalance) {
        throw new ConflictException(
          `單倉首盤 / 盤點窗口不可並行：${inProgressSession.countScope} 尚有進行中的 session，請先完成或取消該 session`,
        );
      }

      return;
    }

    if (completedSessionCount === 0) {
      throw new ConflictException(
        `首盤窗口已鎖定：${countScope} 已有進行中的首盤 session，請先完成該 session`,
      );
    }

    throw new ConflictException(
      `${countScope} 已有進行中的盤點 session，請先完成該 session 再建立新 session`,
    );
  }

  async completeSession(
    sessionId: string,
    _dto: CompleteInventoryCountDto,
    principal: PortalSessionPrincipal,
  ): Promise<CompleteInventoryCountResponseDto> {
    const session = await this.findSessionOrThrow(sessionId);

    if (session.status !== InventoryCountSessionStatus.IN_PROGRESS) {
      throw new ConflictException(`只有 IN_PROGRESS session 可完成：${sessionId}`);
    }

    const approvedAt = new Date();
    const singlePersonOverride = session.performedBy === principal.principalId;

    const completedSession = await this.prisma.inventoryCountSession.update({
      where: { id: session.id },
      data: {
        status: InventoryCountSessionStatus.COMPLETED,
        completedAt: approvedAt,
        completedByPrincipalId: principal.principalId,
        completionApprovalStatus: ApprovalStatus.APPROVED,
        completionApproverPrincipalId: principal.principalId,
        completionApprovedAt: approvedAt,
        completionSinglePersonOverride: singlePersonOverride,
      },
      include: {
        lines: true,
      },
    });

    const adjustmentInputs = completedSession.lines
      .filter((line) => Number(line.beforeQty) !== Number(line.countedQty))
      .map((line) => ({
        sourceType: InventoryAdjustmentSourceType.COUNT_SESSION,
        sourceSessionId: completedSession.id,
        bucketType: line.bucketType,
        itemSku: line.itemSku,
        qtyDelta: Number(line.countedQty) - Number(line.beforeQty),
        reason: '盤點完成自動產生差異調整事件',
        performedBy: principal.principalId,
        performedBySessionId: principal.sessionId,
        performedByAuthSource: principal.authSource,
        approvalStatus: ApprovalStatus.APPROVED,
        approverPrincipalId: principal.principalId,
        approvedAt,
        singlePersonOverride,
        performedAt: completedSession.completedAt ?? approvedAt,
      }));

    const adjustments = adjustmentInputs.length
      ? await this.prisma.$transaction(
          adjustmentInputs.map((item) =>
            this.prisma.inventoryAdjustmentEvent.create({
              data: item,
            }),
          ),
        )
      : [];

    await this.inventoryService.recordAdjustments(adjustments);

    await this.auditService.record({
      action: 'inventory-count.completed',
      entityType: 'InventoryCountSession',
      entityId: completedSession.id,
      performedBy: principal.principalId,
      payload: {
        adjustmentCount: adjustments.length,
        actor: this.buildPrincipalAuditPayload(principal),
        completionApproval: this.buildApprovalState(
          completedSession.completionApprovalStatus,
          completedSession.completionApproverPrincipalId,
          completedSession.completionApprovedAt,
          completedSession.completionSinglePersonOverride,
        ),
      },
    });

    return {
      session: this.buildSessionResponse(completedSession, false),
      adjustments: adjustments.map((adjustment) => this.buildAdjustmentResponse(adjustment)),
    };
  }

  async cancelSession(
    sessionId: string,
    dto: CancelInventoryCountDto,
    principal: PortalSessionPrincipal,
  ): Promise<InventoryCountSessionResponseDto> {
    const session = await this.findSessionWithLinesOrThrow(sessionId);
    const cancelReason = dto.reason?.trim();

    if (!cancelReason) {
      throw new BadRequestException('取消首盤 / 盤點 session 必須提供 reason');
    }

    if (session.status !== InventoryCountSessionStatus.IN_PROGRESS) {
      throw new ConflictException(`只有 IN_PROGRESS session 可取消：${sessionId}`);
    }

    const cancelledSession = await this.prisma.inventoryCountSession.update({
      where: { id: session.id },
      data: {
        status: InventoryCountSessionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledByPrincipalId: principal.principalId,
        cancelReason,
      },
      include: {
        lines: true,
      },
    });

    await this.auditService.record({
      action: 'inventory-count.cancelled',
      entityType: 'InventoryCountSession',
      entityId: cancelledSession.id,
      performedBy: principal.principalId,
      payload: {
        countScope: cancelledSession.countScope,
        cancelReason,
        actor: this.buildPrincipalAuditPayload(principal),
      },
    });

    return this.buildSessionResponse(cancelledSession, false);
  }

  async getSession(sessionId: string): Promise<InventoryCountSessionResponseDto> {
    const session = await this.findSessionWithLinesOrThrow(sessionId);
    return this.buildSessionResponse(session, false);
  }

  async getSessionLines(
    sessionId: string,
    options: {
      bucketType?: string;
      varianceOnly?: boolean;
      page?: number;
      pageSize?: number;
    },
  ): Promise<InventoryCountLineListResponseDto> {
    const session = await this.findSessionWithLinesOrThrow(sessionId);
    const mappedLines = this.buildLineResponses(session.lines, {
      sessionId: session.id,
      countScope: session.countScope,
      countedAt: session.completedAt,
    });

    const filteredLines = mappedLines.filter((line) => {
      if (options.bucketType && line.bucketType !== options.bucketType) {
        return false;
      }

      if (options.varianceOnly && line.differenceQty === 0) {
        return false;
      }

      return true;
    });

    const page = this.normalizePage(options.page);
    const pageSize = this.normalizePageSize(options.pageSize);
    const start = (page - 1) * pageSize;

    return {
      items: filteredLines.slice(start, start + pageSize),
      page,
      pageSize,
      total: filteredLines.length,
    };
  }

  async createAdjustment(
    dto: CreateInventoryAdjustmentDto,
    principal: PortalSessionPrincipal,
  ): Promise<InventoryAdjustmentResponseDto> {
    if (dto.sourceType === 'MANUAL' && !dto.reason?.trim()) {
      throw new BadRequestException('手動調整必須提供 reason');
    }

    await this.masterDataService.assertInventoryItemsExist([
      {
        bucketType: dto.bucketType,
        itemSku: dto.itemSku,
      },
    ]);

    const adjustment = await this.prisma.inventoryAdjustmentEvent.create({
      data: {
        sourceType: dto.sourceType,
        sourceSessionId: dto.sourceSessionId,
        bucketType: dto.bucketType,
        itemSku: dto.itemSku,
        qtyDelta: dto.qtyDelta,
        reason: dto.reason,
        performedBy: principal.principalId,
        performedBySessionId: principal.sessionId,
        performedByAuthSource: principal.authSource,
        approvalStatus: ApprovalStatus.APPROVED,
        approverPrincipalId: principal.principalId,
        approvedAt: new Date(),
        singlePersonOverride: true,
        performedAt: new Date(),
      },
    });

    await this.inventoryService.recordAdjustments([adjustment]);
    await this.auditService.record({
      action: 'inventory-adjustment.created',
      entityType: 'InventoryAdjustmentEvent',
      entityId: adjustment.id,
      performedBy: principal.principalId,
      payload: {
        bucketType: adjustment.bucketType,
        itemSku: adjustment.itemSku,
        qtyDelta: adjustment.qtyDelta,
        actor: this.buildPrincipalAuditPayload(principal),
        approval: this.buildApprovalState(
          adjustment.approvalStatus,
          adjustment.approverPrincipalId,
          adjustment.approvedAt,
          adjustment.singlePersonOverride,
        ),
      },
    });

    return this.buildAdjustmentResponse(adjustment);
  }

  async getItemVarianceSummary(
    bucketType: string,
    itemSku: string,
  ): Promise<InventoryItemVarianceSummaryResponseDto> {
    await this.masterDataService.assertInventoryItemsExist([{ bucketType, itemSku }]);

    const lines = await this.prisma.inventoryCountLine.findMany({
      where: {
        bucketType: bucketType as any,
        itemSku,
        session: {
          status: InventoryCountSessionStatus.COMPLETED,
        },
      },
      include: {
        session: true,
      },
    });

    const sortedLines = this.sortCountLines(lines);
    const latestLine = sortedLines[0] ?? null;
    const metadata = this.masterDataService.getInventoryItemMetadata(bucketType, itemSku);

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const latestCount = latestLine
      ? this.buildVarianceSnapshot(latestLine, latestLine.session.completedAt ?? latestLine.session.startedAt)
      : null;

    return {
      bucketType: bucketType as any,
      itemSku,
      itemName: metadata?.itemName ?? itemSku,
      inventoryPrimaryUnit: metadata?.inventoryPrimaryUnit ?? '',
      latestCount,
      rollingMetrics: {
        last7Days: this.buildRollingMetricDto(
          sortedLines.filter((line) => this.getCountedAt(line) >= last7Days),
        ),
        last30Days: this.buildRollingMetricDto(
          sortedLines.filter((line) => this.getCountedAt(line) >= last30Days),
        ),
      },
      uiHints: {
        showZeroBaselineHint: latestCount?.zeroBaselineFlag ?? false,
        showSemiFinishedVarianceDisclaimer:
          bucketType === 'INNER_PACK_FINISHED' && /^SF/iu.test(itemSku),
        varianceDisclaimer:
          bucketType === 'INNER_PACK_FINISHED' && /^SF/iu.test(itemSku)
            ? '本差異率為庫存差異，不代表固定耗損率'
            : null,
      },
    };
  }

  async getItemVarianceHistory(
    bucketType: string,
    itemSku: string,
    options: {
      from?: string;
      to?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<InventoryItemVarianceHistoryResponseDto> {
    await this.masterDataService.assertInventoryItemsExist([{ bucketType, itemSku }]);

    const lines = await this.prisma.inventoryCountLine.findMany({
      where: {
        bucketType: bucketType as any,
        itemSku,
        session: {
          status: InventoryCountSessionStatus.COMPLETED,
        },
      },
      include: {
        session: true,
      },
    });

    const from = options.from ? new Date(options.from) : null;
    const to = options.to ? new Date(options.to) : null;
    const sortedLines = this.sortCountLines(lines).filter((line) => {
      const countedAt = this.getCountedAt(line);
      if (from && countedAt < from) {
        return false;
      }
      if (to && countedAt > to) {
        return false;
      }
      return true;
    });

    const page = this.normalizePage(options.page);
    const pageSize = this.normalizePageSize(options.pageSize);
    const start = (page - 1) * pageSize;

    return {
      items: sortedLines.slice(start, start + pageSize).map((line) => {
        const countedAt = this.getCountedAt(line);
        const metrics = calculateInventoryCountLineMetrics(line.beforeQty, line.countedQty);

        return {
          sessionId: line.sessionId,
          lineId: line.id,
          countScope: line.session.countScope as any,
          countedAt: countedAt.toISOString(),
          beforeQty: metrics.beforeQty,
          countedQty: metrics.countedQty,
          differenceQty: metrics.differenceQty,
          variancePct: metrics.variancePct,
          errorPct: metrics.errorPct,
          varianceDirection: metrics.varianceDirection,
          zeroBaselineFlag: metrics.zeroBaselineFlag,
          note: line.note ?? null,
          performedBy: line.session.performedBy,
        };
      }),
      page,
      pageSize,
      total: sortedLines.length,
    };
  }

  async getNegativeStockAlerts(): Promise<NegativeStockAlertResponseDto[]> {
    const alerts = await this.inventoryService.getNegativeStockAlerts();

    return alerts.map((alert) => {
      const metadata = this.masterDataService.getInventoryItemMetadata(
        alert.bucketType,
        alert.itemSku,
      );

      return {
        bucketType: alert.bucketType as any,
        itemSku: alert.itemSku,
        itemName: metadata?.itemName ?? alert.itemSku,
        currentQty: roundQuantity(alert.currentQty),
        inventoryPrimaryUnit: metadata?.inventoryPrimaryUnit ?? '',
        lastLedgerAt: alert.lastLedgerAt?.toISOString() ?? null,
        alertReason: '帳面庫存小於 0',
      };
    });
  }

  async getCountReminders(): Promise<CountReminderResponseDto[]> {
    const scopes = ['DAILY_OPS', 'PACKAGING_MATERIAL', 'SHIPPING_SUPPLY', 'FULL_WAREHOUSE'] as const;
    const sessions = await this.prisma.inventoryCountSession.findMany({
      orderBy: [{ completedAt: 'desc' }, { startedAt: 'desc' }],
    });

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 30);

    return scopes
      .map((scope) => {
        const completed = sessions.find(
          (session) => session.countScope === scope && session.completedAt,
        );
        const openSession = sessions.find(
          (session) =>
            session.countScope === scope && session.status === InventoryCountSessionStatus.IN_PROGRESS,
        );

        if (openSession) {
          return {
            countScope: scope,
            sessionId: openSession.id,
            status: openSession.status,
            startedAt: openSession.startedAt.toISOString(),
            lastCompletedAt: completed?.completedAt?.toISOString() ?? null,
            reminderReason: '盤點作業尚未完成',
          };
        }

        if (!completed || completed.completedAt! < threshold) {
          return {
            countScope: scope,
            sessionId: completed?.id ?? null,
            status: completed?.status ?? 'MISSING',
            startedAt: completed?.startedAt?.toISOString() ?? null,
            lastCompletedAt: completed?.completedAt?.toISOString() ?? null,
            reminderReason: '超過一個月未完成盤點',
          };
        }

        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  private async findSessionOrThrow(sessionId: string) {
    const session = await this.prisma.inventoryCountSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException(`找不到 inventory count session: ${sessionId}`);
    }

    return session;
  }

  private async findSessionWithLinesOrThrow(sessionId: string) {
    const session = await this.prisma.inventoryCountSession.findUnique({
      where: { id: sessionId },
      include: {
        lines: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`找不到 inventory count session: ${sessionId}`);
    }

    return session;
  }

  private buildSessionResponse(
    session: {
      id: string;
      countScope: string;
      status: string;
      performedBy: string;
      startedBySessionId?: string | null;
      startedByAuthSource?: string | null;
      startedAt: Date;
      cancelledAt?: Date | null;
      cancelledByPrincipalId?: string | null;
      cancelReason?: string | null;
      completedAt: Date | null;
      completedByPrincipalId?: string | null;
      completionApprovalStatus?: ApprovalStatus | null;
      completionApproverPrincipalId?: string | null;
      completionApprovedAt?: Date | null;
      completionSinglePersonOverride?: boolean;
      lines: Array<{
        id: string;
        sessionId: string;
        bucketType: string;
        itemSku: string;
        beforeQty: unknown;
        countedQty: unknown;
        note: string | null;
      }>;
    },
    includeLines: boolean,
  ): InventoryCountSessionResponseDto {
    const lines = this.buildLineResponses(session.lines, {
      sessionId: session.id,
      countScope: session.countScope,
      countedAt: session.completedAt,
    });

    return {
      sessionId: session.id,
      countScope: session.countScope as any,
      status: session.status as any,
      performedBy: session.performedBy,
      startedAt: session.startedAt.toISOString(),
      cancelledAt: session.cancelledAt?.toISOString() ?? null,
      cancelledByPrincipalId: session.cancelledByPrincipalId ?? null,
      cancelReason: session.cancelReason ?? null,
      completedAt: session.completedAt?.toISOString() ?? null,
      completedByPrincipalId: session.completedByPrincipalId ?? null,
      lineCount: session.lines.length,
      summary: calculateInventoryVarianceSummary(session.lines),
      completionApproval: this.buildApprovalState(
        session.completionApprovalStatus,
        session.completionApproverPrincipalId,
        session.completionApprovedAt,
        session.completionSinglePersonOverride,
      ),
      ...(includeLines ? { lines } : {}),
    };
  }

  private buildLineResponses(
    lines: Array<{
      id: string;
      sessionId: string;
      bucketType: string;
      itemSku: string;
      beforeQty: unknown;
      countedQty: unknown;
      note: string | null;
    }>,
    sessionContext: {
      sessionId: string;
      countScope: string;
      countedAt: Date | null;
    },
  ): InventoryCountLineResponseDto[] {
    const metadataMap = this.masterDataService.getInventoryItemMetadataMap(
      lines.map((line) => ({
        bucketType: line.bucketType,
        itemSku: line.itemSku,
      })),
    );

    return lines.map((line) => {
      const metadata = metadataMap.get(`${line.bucketType}:${line.itemSku}`);
      const metrics = calculateInventoryCountLineMetrics(line.beforeQty, line.countedQty);

      return {
        lineId: line.id,
        sessionId: sessionContext.sessionId,
        bucketType: line.bucketType as any,
        itemSku: line.itemSku,
        itemName: metadata?.itemName ?? line.itemSku,
        inventoryPrimaryUnit: metadata?.inventoryPrimaryUnit ?? '',
        beforeQty: metrics.beforeQty,
        countedQty: metrics.countedQty,
        differenceQty: metrics.differenceQty,
        variancePct: metrics.variancePct,
        errorPct: metrics.errorPct,
        varianceDirection: metrics.varianceDirection,
        zeroBaselineFlag: metrics.zeroBaselineFlag,
        note: line.note ?? null,
        countedAt: sessionContext.countedAt?.toISOString() ?? null,
        countScope: sessionContext.countScope as any,
      };
    });
  }

  private buildAdjustmentResponse(adjustment: {
    id: string;
    sourceType: string;
    sourceSessionId: string | null;
    bucketType: string;
    itemSku: string;
    qtyDelta: unknown;
    reason: string | null;
    performedBy: string;
    performedBySessionId?: string | null;
    performedByAuthSource?: string | null;
    approvalStatus?: ApprovalStatus | null;
    approverPrincipalId?: string | null;
    approvedAt?: Date | null;
    singlePersonOverride?: boolean;
    performedAt: Date;
  }): InventoryAdjustmentResponseDto {
    const metadata = this.masterDataService.getInventoryItemMetadata(
      adjustment.bucketType,
      adjustment.itemSku,
    );

    return {
      adjustmentId: adjustment.id,
      sourceType: adjustment.sourceType as any,
      sourceSessionId: adjustment.sourceSessionId,
      bucketType: adjustment.bucketType as any,
      itemSku: adjustment.itemSku,
      itemName: metadata?.itemName ?? adjustment.itemSku,
      qtyDelta: roundQuantity(Number(adjustment.qtyDelta ?? 0)),
      reason: adjustment.reason ?? null,
      performedBy: adjustment.performedBy,
      performedAt: adjustment.performedAt.toISOString(),
      approval: this.buildApprovalState(
        adjustment.approvalStatus,
        adjustment.approverPrincipalId,
        adjustment.approvedAt,
        adjustment.singlePersonOverride,
      ),
    };
  }

  private buildApprovalState(
    status: ApprovalStatus | string | null | undefined,
    approverPrincipalId: string | null | undefined,
    approvedAt: Date | null | undefined,
    singlePersonOverride: boolean | null | undefined,
  ): InventoryApprovalStateDto | null {
    if (!status) {
      return null;
    }

    return {
      status: status as InventoryApprovalStateDto['status'],
      approverPrincipalId: approverPrincipalId ?? null,
      approvedAt: approvedAt?.toISOString() ?? null,
      singlePersonOverride: Boolean(singlePersonOverride),
    };
  }

  private buildPrincipalAuditPayload(principal: PortalSessionPrincipal) {
    return {
      principalId: principal.principalId,
      displayName: principal.displayName,
      roleCodes: principal.roleCodes,
      sessionId: principal.sessionId,
      authSource: principal.authSource,
    };
  }

  private isOpeningBalanceCandidate(
    lines: Array<{
      beforeQty: unknown;
    }>,
  ) {
    return lines.length > 0 && lines.every((line) => Number(line.beforeQty) === 0);
  }

  private buildVarianceSnapshot(
    line: {
      sessionId: string;
      beforeQty: unknown;
      countedQty: unknown;
      session: {
        countScope: string;
      };
    },
    countedAt: Date,
  ) {
    const metrics = calculateInventoryCountLineMetrics(line.beforeQty, line.countedQty);

    return {
      sessionId: line.sessionId,
      countScope: line.session.countScope as any,
      countedAt: countedAt.toISOString(),
      beforeQty: metrics.beforeQty,
      countedQty: metrics.countedQty,
      differenceQty: metrics.differenceQty,
      variancePct: metrics.variancePct,
      errorPct: metrics.errorPct,
      varianceDirection: metrics.varianceDirection,
      zeroBaselineFlag: metrics.zeroBaselineFlag,
    };
  }

  private buildRollingMetricDto(
    lines: Array<{
      beforeQty: unknown;
      countedQty: unknown;
      session: {
        completedAt: Date | null;
        startedAt: Date;
      };
      createdAt: Date;
    }>,
  ): InventoryRollingMetricDto {
    const metrics = calculateInventoryRollingMetrics(lines);
    const latestCountedAt = lines[0] ? this.getCountedAt(lines[0]).toISOString() : null;

    return {
      ...metrics,
      lastCountedAt: latestCountedAt,
    };
  }

  private sortCountLines<T extends {
    session: {
      completedAt: Date | null;
      startedAt: Date;
    };
    createdAt: Date;
  }>(lines: T[]) {
    return [...lines].sort(
      (left, right) => this.getCountedAt(right).getTime() - this.getCountedAt(left).getTime(),
    );
  }

  private getCountedAt(line: {
    session: {
      completedAt: Date | null;
      startedAt: Date;
    };
    createdAt: Date;
  }) {
    return line.session.completedAt ?? line.session.startedAt ?? line.createdAt;
  }

  private normalizePage(page?: number) {
    return page && Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  }

  private normalizePageSize(pageSize?: number) {
    if (pageSize && Number.isFinite(pageSize) && pageSize > 0) {
      return Math.min(Math.floor(pageSize), 100);
    }

    return 50;
  }
}