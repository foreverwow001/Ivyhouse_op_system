import { Module } from '@nestjs/common';

import { DailyOpsModule } from './daily-ops/daily-ops.module';
import { IntakeModule } from './intake/intake.module';

@Module({
  imports: [IntakeModule, DailyOpsModule],
})
export class AppModule {}