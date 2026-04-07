import { Module } from '@nestjs/common';

import { AuditModule } from '../../audit/audit.module';
import { InventoryModule } from '../../inventory/inventory.module';
import { MasterDataModule } from '../../master-data/master-data.module';
import { InventoryCountController } from './inventory-count.controller';
import { InventoryCountRoleGuard } from './inventory-count-role.guard';
import { InventoryCountService } from './inventory-count.service';

@Module({
  imports: [MasterDataModule, InventoryModule, AuditModule],
  controllers: [InventoryCountController],
  providers: [InventoryCountService, InventoryCountRoleGuard],
})
export class InventoryCountModule {}