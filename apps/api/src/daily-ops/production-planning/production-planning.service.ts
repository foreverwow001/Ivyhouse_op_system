import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalStatus,
  BomTriggerType,
  ProductionPlanStatus,
} from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { PortalSessionPrincipal } from '../../common/auth/portal-session-principal';
import { InventoryService } from '../../inventory/inventory.service';
import { MasterDataService } from '../../master-data/master-data.service';
import { RecipeOwnerService } from '../../master-data/recipe-owner.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductionPlanDto } from './dto/create-production-plan.dto';
import { ProductionPlanApprovalDecisionDto } from './dto/production-plan-approval-decision.dto';
import { UpdateProductionPlanDto } from './dto/update-production-plan.dto';

@Injectable()
export class ProductionPlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly masterDataService: MasterDataService,
    private readonly recipeOwnerService: RecipeOwnerService,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
  ) {}

  async createPlan(dto: CreateProductionPlanDto, principal: PortalSessionPrincipal) {
    await this.masterDataService.assertProductionTargetsExist(dto.lines);

    const plan = await this.prisma.productionPlanHeader.create({
      data: {
        planDate: new Date(dto.planDate),
        status: ProductionPlanStatus.DRAFT,
        createdBy: principal.principalId,
        createdBySessionId: principal.sessionId,
        createdByAuthSource: principal.authSource,
        approvalStatus: ApprovalStatus.PENDING_APPROVAL,
        lines: {
          create: dto.lines.map((line) => ({
            planLevel: line.planLevel,
            targetSku: line.targetSku,
            targetName: line.targetName,
            plannedQty: line.plannedQty,
            uom: line.uom,
          })),
        },
      },
      include: {
        lines: true,
      },
    });

    await this.auditService.record({
      action: 'production-plan.created',
      entityType: 'ProductionPlanHeader',
      entityId: plan.id,
      performedBy: principal.principalId,
      payload: {
        lineCount: plan.lines.length,
        approvalStatus: plan.approvalStatus,
        actor: this.buildPrincipalAuditPayload(principal),
      },
    });

    return plan;
  }

  async updatePlan(planId: string, dto: UpdateProductionPlanDto, principal: PortalSessionPrincipal) {
    const plan = await this.findPlanOrThrow(planId);

    if (plan.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new BadRequestException(`只有已核准 plan 才能提出 revision：${planId}`);
    }

    await this.masterDataService.assertProductionTargetsExist(dto.lines);

    const revisedPlan = await this.prisma.productionPlanHeader.create({
      data: {
        planDate: plan.planDate,
        status: ProductionPlanStatus.REVISED,
        createdBy: principal.principalId,
        createdBySessionId: principal.sessionId,
        createdByAuthSource: principal.authSource,
        approvalStatus: ApprovalStatus.PENDING_APPROVAL,
        revisedFromId: plan.id,
        lines: {
          create: dto.lines.map((line) => ({
            planLevel: line.planLevel,
            targetSku: line.targetSku,
            targetName: line.targetName,
            plannedQty: line.plannedQty,
            uom: line.uom,
          })),
        },
      },
      include: {
        lines: true,
      },
    });

    await this.auditService.record({
      action: 'production-plan.revised',
      entityType: 'ProductionPlanHeader',
      entityId: revisedPlan.id,
      performedBy: principal.principalId,
      payload: {
        previousPlanId: plan.id,
        lineCount: revisedPlan.lines.length,
        approvalStatus: revisedPlan.approvalStatus,
        actor: this.buildPrincipalAuditPayload(principal),
      },
    });

    return {
      previousPlanId: plan.id,
      plan: revisedPlan,
      lines: revisedPlan.lines,
    };
  }

  async rerunBom(planId: string, principal: PortalSessionPrincipal) {
    const plan = await this.prisma.productionPlanHeader.findUnique({
      where: { id: planId },
      include: { lines: true },
    });
    if (!plan) {
      throw new NotFoundException(`找不到 production plan: ${planId}`);
    }

    if (plan.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new BadRequestException(`production plan 尚未核准，不可 rerun BOM：${planId}`);
    }

    const reservationLines = await this.recipeOwnerService.buildReservationLinesForPlanLines(
      plan.lines.map((line) => ({
        planLevel: line.planLevel,
        targetSku: line.targetSku,
        targetName: line.targetName,
        plannedQty: Number(line.plannedQty),
        uom: line.uom,
      })),
    );

    const bomRun = await this.prisma.bomReservationRun.create({
      data: {
        planId,
        triggerType: BomTriggerType.MANUAL_RERUN,
        requestedByPrincipalId: principal.principalId,
        requestedBySessionId: principal.sessionId,
        requestedByAuthSource: principal.authSource,
        approvalStatus: ApprovalStatus.PENDING_APPROVAL,
        lines: {
          create: reservationLines,
        },
      },
      include: {
        lines: true,
      },
    });

    await this.auditService.record({
      action: 'production-plan.bom-rerun.requested',
      entityType: 'ProductionPlanHeader',
      entityId: planId,
      performedBy: principal.principalId,
      payload: {
        bomRunId: bomRun.id,
        approvalStatus: bomRun.approvalStatus,
        actor: this.buildPrincipalAuditPayload(principal),
      },
    });

    return bomRun;
  }

  async decidePlanApproval(
    planId: string,
    dto: ProductionPlanApprovalDecisionDto,
    principal: PortalSessionPrincipal,
  ) {
    this.assertSupervisorApprover(principal);

    const plan = await this.prisma.productionPlanHeader.findUnique({
      where: { id: planId },
      include: { lines: true },
    });

    if (!plan) {
      throw new NotFoundException(`找不到 production plan: ${planId}`);
    }

    this.assertApprovalDecision(dto);

    if (plan.approvalStatus !== ApprovalStatus.PENDING_APPROVAL) {
      throw new ConflictException(`production plan 已完成審批：${planId}`);
    }

    const singlePersonOverride = plan.createdBy === principal.principalId;
    const approvalNote = dto.reason?.trim();

    if (dto.decision === 'REJECTED') {
      const rejectedPlan = await this.prisma.productionPlanHeader.update({
        where: { id: plan.id },
        data: {
          approvalStatus: ApprovalStatus.REJECTED,
          approverPrincipalId: principal.principalId,
          approvalDecidedAt: new Date(),
          approvalNote,
          singlePersonOverride,
        },
        include: { lines: true },
      });

      await this.auditService.record({
        action: 'production-plan.rejected',
        entityType: 'ProductionPlanHeader',
        entityId: rejectedPlan.id,
        performedBy: principal.principalId,
        payload: {
          decision: dto.decision,
          approvalNote,
          actor: this.buildPrincipalAuditPayload(principal),
          singlePersonOverride,
        },
      });

      return { plan: rejectedPlan, bomRun: null };
    }

    const reservationLines = await this.recipeOwnerService.buildReservationLinesForPlanLines(
      plan.lines.map((line) => ({
        planLevel: line.planLevel,
        targetSku: line.targetSku,
        targetName: line.targetName,
        plannedQty: Number(line.plannedQty),
        uom: line.uom,
      })),
    );

    const decisionAt = new Date();
    const { approvedPlan, bomRun } = await this.prisma.$transaction(async (tx) => {
      if (plan.revisedFromId) {
        await tx.productionPlanHeader.update({
          where: { id: plan.revisedFromId },
          data: { status: ProductionPlanStatus.REVISED },
        });
      }

      const approvedPlanResult = await tx.productionPlanHeader.update({
        where: { id: plan.id },
        data: {
          status: ProductionPlanStatus.CONFIRMED,
          approvalStatus: ApprovalStatus.APPROVED,
          approverPrincipalId: principal.principalId,
          approvalDecidedAt: decisionAt,
          approvalNote,
          singlePersonOverride,
        },
        include: { lines: true },
      });

      const bomRunResult = await tx.bomReservationRun.create({
        data: {
          planId: approvedPlanResult.id,
          triggerType: approvedPlanResult.revisedFromId
            ? BomTriggerType.PLAN_REVISED
            : BomTriggerType.PLAN_CREATED,
          requestedByPrincipalId: approvedPlanResult.createdBy,
          requestedBySessionId: approvedPlanResult.createdBySessionId,
          requestedByAuthSource: approvedPlanResult.createdByAuthSource,
          approvalStatus: ApprovalStatus.APPROVED,
          approverPrincipalId: principal.principalId,
          approvalDecidedAt: decisionAt,
          approvalNote,
          singlePersonOverride,
          executedAt: decisionAt,
          executedBy: principal.principalId,
          lines: {
            create: reservationLines,
          },
        },
        include: { lines: true },
      });

      return {
        approvedPlan: approvedPlanResult,
        bomRun: bomRunResult,
      };
    });

    await this.inventoryService.recordBomReservation({
      runId: bomRun.id,
      performedBy: principal.principalId,
      performedAt: bomRun.executedAt ?? decisionAt,
      lines: bomRun.lines,
    });

    await this.auditService.record({
      action: 'production-plan.approved',
      entityType: 'ProductionPlanHeader',
      entityId: approvedPlan.id,
      performedBy: principal.principalId,
      payload: {
        decision: dto.decision,
        bomRunId: bomRun.id,
        actor: this.buildPrincipalAuditPayload(principal),
        singlePersonOverride,
      },
    });

    return { plan: approvedPlan, bomRun };
  }

  async decideBomRerunApproval(
    runId: string,
    dto: ProductionPlanApprovalDecisionDto,
    principal: PortalSessionPrincipal,
  ) {
    this.assertSupervisorApprover(principal);

    const bomRun = await this.prisma.bomReservationRun.findUnique({
      where: { id: runId },
      include: { lines: true },
    });

    if (!bomRun) {
      throw new NotFoundException(`找不到 bom rerun request: ${runId}`);
    }

    this.assertApprovalDecision(dto);

    if (bomRun.triggerType !== BomTriggerType.MANUAL_RERUN) {
      throw new BadRequestException(`只允許核決 MANUAL_RERUN：${runId}`);
    }

    if (bomRun.approvalStatus !== ApprovalStatus.PENDING_APPROVAL) {
      throw new ConflictException(`bom rerun request 已完成審批：${runId}`);
    }

    const decisionAt = new Date();
    const approvalNote = dto.reason?.trim();
    const singlePersonOverride = bomRun.requestedByPrincipalId === principal.principalId;
    const updatedRun = await this.prisma.bomReservationRun.update({
      where: { id: bomRun.id },
      data: {
        approvalStatus: dto.decision === 'APPROVED' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        approverPrincipalId: principal.principalId,
        approvalDecidedAt: decisionAt,
        approvalNote,
        singlePersonOverride,
        executedAt: dto.decision === 'APPROVED' ? decisionAt : null,
        executedBy: dto.decision === 'APPROVED' ? principal.principalId : null,
      },
      include: { lines: true },
    });

    if (dto.decision === 'APPROVED') {
      await this.inventoryService.recordBomReservation({
        runId: updatedRun.id,
        performedBy: principal.principalId,
        performedAt: updatedRun.executedAt ?? decisionAt,
        lines: updatedRun.lines,
      });
    }

    await this.auditService.record({
      action:
        dto.decision === 'APPROVED'
          ? 'production-plan.bom-rerun.approved'
          : 'production-plan.bom-rerun.rejected',
      entityType: 'ProductionPlanHeader',
      entityId: updatedRun.planId,
      performedBy: principal.principalId,
      payload: {
        bomRunId: updatedRun.id,
        decision: dto.decision,
        actor: this.buildPrincipalAuditPayload(principal),
        singlePersonOverride,
      },
    });

    return updatedRun;
  }

  private async findPlanOrThrow(planId: string) {
    const plan = await this.prisma.productionPlanHeader.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException(`找不到 production plan: ${planId}`);
    }

    return plan;
  }

  private assertApprovalDecision(dto: ProductionPlanApprovalDecisionDto) {
    if (dto.decision !== 'APPROVED' && dto.decision !== 'REJECTED') {
      throw new BadRequestException('decision 只允許 APPROVED 或 REJECTED');
    }

    if (dto.decision === 'REJECTED' && !dto.reason?.trim()) {
      throw new BadRequestException('reject 必須提供 reason');
    }
  }

  private assertSupervisorApprover(principal: PortalSessionPrincipal) {
    if (!principal.roleCodes.includes('主管')) {
      throw new ForbiddenException('production-planning approval 必須由主管角色執行');
    }
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
}