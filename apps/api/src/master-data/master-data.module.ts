import { Module } from '@nestjs/common';

import { MasterDataService } from './master-data.service';
import { RecipeOwnerService } from './recipe-owner.service';

@Module({
  providers: [MasterDataService, RecipeOwnerService],
  exports: [MasterDataService, RecipeOwnerService],
})
export class MasterDataModule {}