import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentPortalPrincipal } from '../../common/auth/current-portal-principal.decorator';
import { PortalSessionPrincipal } from '../../common/auth/portal-session-principal';

import { CancelInventoryCountDto } from './dto/cancel-inventory-count.dto';
import { CompleteInventoryCountDto } from './dto/complete-inventory-count.dto';
import { CreateInventoryAdjustmentDto } from './dto/create-inventory-adjustment.dto';
import { CreateInventoryCountDto } from './dto/create-inventory-count.dto';
import { InventoryCountService } from './inventory-count.service';
import { InventoryBucketType } from '../types/daily-ops.types';
import { InventoryCountAllowedRoles } from './inventory-count-role.decorator';
import { InventoryCountRoleGuard } from './inventory-count-role.guard';

@Controller('daily-ops')
export class InventoryCountController {
  constructor(private readonly inventoryCountService: InventoryCountService) {}

  @Post('inventory-counts')
  @UseGuards(InventoryCountRoleGuard)
  @InventoryCountAllowedRoles('生產', '包裝', '會計', '主管')
  createSession(
    @Body() dto: CreateInventoryCountDto,
    @CurrentPortalPrincipal() principal: PortalSessionPrincipal,
  ) {
    return this.inventoryCountService.createSession(dto, principal);
  }

  @Post('inventory-counts/:sessionId/complete')
  @UseGuards(InventoryCountRoleGuard)
  @InventoryCountAllowedRoles('主管')
  completeSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: CompleteInventoryCountDto,
    @CurrentPortalPrincipal() principal: PortalSessionPrincipal,
  ) {
    return this.inventoryCountService.completeSession(sessionId, dto, principal);
  }

  @Post('inventory-counts/:sessionId/cancel')
  @UseGuards(InventoryCountRoleGuard)
  @InventoryCountAllowedRoles('主管')
  cancelSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: CancelInventoryCountDto,
    @CurrentPortalPrincipal() principal: PortalSessionPrincipal,
  ) {
    return this.inventoryCountService.cancelSession(sessionId, dto, principal);
  }

  @Get('inventory-counts/:sessionId')
  getSession(@Param('sessionId') sessionId: string) {
    return this.inventoryCountService.getSession(sessionId);
  }

  @Get('inventory-counts/:sessionId/lines')
  getSessionLines(
    @Param('sessionId') sessionId: string,
    @Query('bucketType') bucketType?: InventoryBucketType,
    @Query('varianceOnly') varianceOnly?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.inventoryCountService.getSessionLines(sessionId, {
      bucketType,
      varianceOnly: varianceOnly === 'true',
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Post('inventory-adjustments')
  @UseGuards(InventoryCountRoleGuard)
  @InventoryCountAllowedRoles('主管')
  createAdjustment(
    @Body() dto: CreateInventoryAdjustmentDto,
    @CurrentPortalPrincipal() principal: PortalSessionPrincipal,
  ) {
    return this.inventoryCountService.createAdjustment(dto, principal);
  }

  @Get('inventory-variance/items/:bucketType/:itemSku')
  getItemVarianceSummary(
    @Param('bucketType') bucketType: InventoryBucketType,
    @Param('itemSku') itemSku: string,
  ) {
    return this.inventoryCountService.getItemVarianceSummary(bucketType, itemSku);
  }

  @Get('inventory-variance/items/:bucketType/:itemSku/history')
  getItemVarianceHistory(
    @Param('bucketType') bucketType: InventoryBucketType,
    @Param('itemSku') itemSku: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.inventoryCountService.getItemVarianceHistory(bucketType, itemSku, {
      from,
      to,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('inventory-alerts/negative-stock')
  getNegativeStockAlerts() {
    return this.inventoryCountService.getNegativeStockAlerts();
  }

  @Get('inventory-alerts/count-reminder')
  getCountReminders() {
    return this.inventoryCountService.getCountReminders();
  }
}