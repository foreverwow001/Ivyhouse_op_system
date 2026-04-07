import { Body, Controller, Param, Post } from '@nestjs/common';

import { CommitReplenishmentDto } from './dto/commit-replenishment.dto';
import { CreateReplenishmentDto } from './dto/create-replenishment.dto';
import { ReplenishmentService } from './replenishment.service';

@Controller('daily-ops/replenishments')
export class ReplenishmentController {
  constructor(private readonly replenishmentService: ReplenishmentService) {}

  @Post()
  createRun(@Body() dto: CreateReplenishmentDto) {
    return this.replenishmentService.createRun(dto);
  }

  @Post(':runId/commit')
  commitRun(@Param('runId') runId: string, @Body() dto: CommitReplenishmentDto) {
    return this.replenishmentService.commitRun(runId, dto);
  }
}