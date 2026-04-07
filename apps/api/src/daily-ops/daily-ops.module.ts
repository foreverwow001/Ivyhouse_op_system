import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { MasterDataModule } from '../master-data/master-data.module';
import { InventoryCountModule } from './inventory-count/inventory-count.module';
import { ProductionPlanningModule } from './production-planning/production-planning.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReplenishmentModule } from './replenishment/replenishment.module';
import { DailyOpsController } from './daily-ops.controller';
import { DailyOpsService } from './daily-ops.service';

@Module({
  imports: [
    PrismaModule,
    MasterDataModule,
    InventoryModule,
    AuditModule,
    ProductionPlanningModule,
    ReplenishmentModule,
    InventoryCountModule,
  ],
  controllers: [DailyOpsController],
  providers: [DailyOpsService],
})
export class DailyOpsModule {}