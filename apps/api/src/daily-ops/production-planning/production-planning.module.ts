import { Module } from '@nestjs/common';

import { AuditModule } from '../../audit/audit.module';
import { InventoryModule } from '../../inventory/inventory.module';
import { MasterDataModule } from '../../master-data/master-data.module';
import { ProductionPlanningController } from './production-planning.controller';
import { ProductionPlanningRoleGuard } from './production-planning-role.guard';
import { ProductionPlanningService } from './production-planning.service';

@Module({
  imports: [MasterDataModule, InventoryModule, AuditModule],
  controllers: [ProductionPlanningController],
  providers: [ProductionPlanningService, ProductionPlanningRoleGuard],
})
export class ProductionPlanningModule {}