import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ConfirmDemandBatchDto } from './dto/confirm-demand-batch.dto';
import { CreateDemandBatchDto } from './dto/create-demand-batch.dto';
import { DailyOpsService } from './daily-ops.service';

@Controller('daily-ops')
export class DailyOpsController {
  constructor(private readonly dailyOpsService: DailyOpsService) {}

  @Post('demand-batches')
  createDemandBatch(@Body() dto: CreateDemandBatchDto) {
    return this.dailyOpsService.createDemandBatch(dto);
  }

  @Post('demand-batches/:batchId/confirm')
  confirmDemandBatch(@Param('batchId') batchId: string, @Body() dto: ConfirmDemandBatchDto) {
    return this.dailyOpsService.confirmDemandBatch(batchId, dto);
  }

  @Get('demand-batches/:batchId')
  getDemandBatch(@Param('batchId') batchId: string) {
    return this.dailyOpsService.getDemandBatch(batchId);
  }
}