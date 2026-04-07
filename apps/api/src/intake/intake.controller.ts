import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { ConfirmIntakeBatchDto } from './dto/confirm-intake-batch.dto';
import { CreateIntakeBatchDto } from './dto/create-intake-batch.dto';
import { CreateMappingRuleProposalDto } from './dto/create-mapping-rule-proposal.dto';
import { CreateNewProductProposalDto } from './dto/create-new-product-proposal.dto';
import { ResolveExceptionDto } from './dto/resolve-exception.dto';
import { ReviewMappingDto } from './dto/review-mapping.dto';
import { TriggerParseDto } from './dto/trigger-parse.dto';
import { UploadSourceFileDto } from './dto/upload-source-file.dto';
import { IntakeService } from './intake.service';

@Controller('intake')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Post('batches')
  createBatch(@Body() dto: CreateIntakeBatchDto) {
    return this.intakeService.createBatch(dto);
  }

  @Post('batches/:batchId/source-files')
  @UseInterceptors(FileInterceptor('file'))
  uploadSourceFile(
    @Param('batchId') batchId: string,
    @UploadedFile() file: any,
    @Body() dto: UploadSourceFileDto,
  ) {
    return this.intakeService.uploadSourceFile(batchId, file, dto);
  }

  @Post('batches/:batchId/parse')
  async triggerParse(@Param('batchId') batchId: string, @Body() dto: TriggerParseDto) {
    return this.intakeService.triggerParse(batchId, dto);
  }

  @Get('batches/:batchId')
  getBatch(@Param('batchId') batchId: string) {
    return this.intakeService.getBatch(batchId);
  }

  @Get('batches/:batchId/parsed-lines')
  listParsedLines(
    @Param('batchId') batchId: string,
    @Query('status') status?: string,
    @Query('channelCode') channelCode?: string,
    @Query('parseKind') parseKind?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    return this.intakeService.listParsedLines(batchId, {
      status,
      channelCode,
      parseKind,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  }

  @Get('batches/:batchId/mapping-results')
  listMappingResults(
    @Param('batchId') batchId: string,
    @Query('status') status?: string,
    @Query('channelCode') channelCode?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    return this.intakeService.listMappingResults(batchId, {
      status,
      channelCode,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  }

  @Post('batches/:batchId/mapping/review')
  reviewMappings(@Param('batchId') batchId: string, @Body() dto: ReviewMappingDto) {
    return this.intakeService.reviewMappings(batchId, dto);
  }

  @Get('batches/:batchId/exceptions')
  listExceptions(
    @Param('batchId') batchId: string,
    @Query('exceptionType') exceptionType?: string,
    @Query('status') status?: string,
  ) {
    return this.intakeService.listExceptions(batchId, { exceptionType, status });
  }

  @Post('exceptions/:exceptionId/resolve')
  resolveException(
    @Param('exceptionId') exceptionId: string,
    @Body() dto: ResolveExceptionDto,
  ) {
    return this.intakeService.resolveException(exceptionId, dto);
  }

  @Post('mapping-rule-proposals')
  createMappingRuleProposal(@Body() dto: CreateMappingRuleProposalDto) {
    return this.intakeService.createMappingRuleProposal(dto);
  }

  @Post('new-product-proposals')
  createNewProductProposal(@Body() dto: CreateNewProductProposalDto) {
    return this.intakeService.createNewProductProposal(dto);
  }

  @Post('batches/:batchId/confirm')
  confirmBatch(@Param('batchId') batchId: string, @Body() dto: ConfirmIntakeBatchDto) {
    return this.intakeService.confirmBatch(batchId, dto);
  }
}