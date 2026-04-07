import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentPortalPrincipal } from '../../common/auth/current-portal-principal.decorator';
import { PortalSessionPrincipal } from '../../common/auth/portal-session-principal';

import { CreateProductionPlanDto } from './dto/create-production-plan.dto';
import { ProductionPlanApprovalDecisionDto } from './dto/production-plan-approval-decision.dto';
import { UpdateProductionPlanDto } from './dto/update-production-plan.dto';
import { ProductionPlanningAllowedRoles } from './production-planning-role.decorator';
import { ProductionPlanningRoleGuard } from './production-planning-role.guard';
import { ProductionPlanningService } from './production-planning.service';

@Controller('daily-ops/production-plans')
export class ProductionPlanningController {
  constructor(private readonly productionPlanningService: ProductionPlanningService) {}

  @Post()
  @UseGuards(ProductionPlanningRoleGuard)
  @ProductionPlanningAllowedRoles('生產', '包裝及出貨', '會計', '管理員')
  createPlan(
    @Body() dto: CreateProductionPlanDto,
    @CurrentPortalPrincipal() principal: PortalSessionPrincipal,
  ) {
    return this.productionPlanningService.createPlan(dto, principal);
  }

  @Patch(':planId')
  @UseGuards(ProductionPlanningRoleGuard)
  @ProductionPlanningAllowedRoles('生產', '包裝及出貨', '會計', '管理員')
  updatePlan(
    @Param('planId') planId: string,
    @Body() dto: UpdateProductionPlanDto,
    @CurrentPortalPrincipal() principal: PortalSessionPrincipal,
  ) {
    return this.productionPlanningService.updatePlan(planId, dto, principal);
  }

  @Post(':planId/reserve-bom')
  @UseGuards(ProductionPlanningRoleGuard)
  @ProductionPlanningAllowedRoles('生產', '包裝及出貨', '會計', '管理員')
  rerunBom(
    @Param('planId') planId: string,
    @CurrentPortalPrincipal() principal: PortalSessionPrincipal,
  ) {
    return this.productionPlanningService.rerunBom(planId, principal);
  }

  @Post(':planId/approval')
  @UseGuards(ProductionPlanningRoleGuard)
  @ProductionPlanningAllowedRoles('主管')
  decidePlanApproval(
    @Param('planId') planId: string,
    @Body() dto: ProductionPlanApprovalDecisionDto,
    @CurrentPortalPrincipal() principal: PortalSessionPrincipal,
  ) {
    return this.productionPlanningService.decidePlanApproval(planId, dto, principal);
  }

  @Post('bom-runs/:runId/approval')
  @UseGuards(ProductionPlanningRoleGuard)
  @ProductionPlanningAllowedRoles('主管')
  decideBomRerunApproval(
    @Param('runId') runId: string,
    @Body() dto: ProductionPlanApprovalDecisionDto,
    @CurrentPortalPrincipal() principal: PortalSessionPrincipal,
  ) {
    return this.productionPlanningService.decideBomRerunApproval(runId, dto, principal);
  }
}