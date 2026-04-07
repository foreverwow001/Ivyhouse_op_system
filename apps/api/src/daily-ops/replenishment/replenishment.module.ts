import { Module } from '@nestjs/common';

import { AuditModule } from '../../audit/audit.module';
import { InventoryModule } from '../../inventory/inventory.module';
import { MasterDataModule } from '../../master-data/master-data.module';
import { ReplenishmentController } from './replenishment.controller';
import { ReplenishmentService } from './replenishment.service';

@Module({
  imports: [MasterDataModule, InventoryModule, AuditModule],
  controllers: [ReplenishmentController],
  providers: [ReplenishmentService],
})
export class ReplenishmentModule {}