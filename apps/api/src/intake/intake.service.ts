import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';

import { parseMomoPdfToParsedLines } from './parsers/momo-pdf.parser';
import { autoMapParsedLineToBootstrapResult } from './mapping/bootstrap-mapping.engine';
import { parseOfficialXlsxToParsedLines } from './parsers/official-xlsx.parser';
import { parseOrangePointXlsToParsedLines } from './parsers/orangepoint-xls.parser';
import { parseShopeePdfToParsedLines } from './parsers/shopee-pdf.parser';

import { ConfirmIntakeBatchDto } from './dto/confirm-intake-batch.dto';
import { CreateIntakeBatchDto } from './dto/create-intake-batch.dto';
import { CreateMappingRuleProposalDto } from './dto/create-mapping-rule-proposal.dto';
import { CreateNewProductProposalDto } from './dto/create-new-product-proposal.dto';
import { ResolveExceptionDto } from './dto/resolve-exception.dto';
import { ReviewMappingDto } from './dto/review-mapping.dto';
import { TriggerParseDto } from './dto/trigger-parse.dto';
import { UploadSourceFileDto } from './dto/upload-source-file.dto';
import {
  BatchResolutionRecord,
  BatchStatus,
  ConfidenceLevel,
  ExceptionStatus,
  ExceptionType,
  FileStatus,
  IntakeBatchRecord,
  IntakeExceptionRecord,
  IntakeTarget,
  MappingMethod,
  MappingResultRecord,
  MappingResultStatus,
  MappingRuleProposalRecord,
  NewProductProposalRecord,
  ParsedLineRecord,
  ParsedLineStatus,
  ParseKind,
  ProposalStatus,
  ResolutionType,
  SourceFileRecord,
  SuggestedAction,
} from './types/intake.types';

@Injectable()
export class IntakeService {
  private readonly batches: IntakeBatchRecord[] = [];
  private readonly sourceFiles: SourceFileRecord[] = [];
  private readonly sourceFileBuffers = new Map<string, Buffer>();
  private readonly parsedLines: ParsedLineRecord[] = [];
  private readonly mappingResults: MappingResultRecord[] = [];
  private readonly exceptions: IntakeExceptionRecord[] = [];
  private readonly batchResolutions: BatchResolutionRecord[] = [];
  private readonly mappingRuleProposals: MappingRuleProposalRecord[] = [];
  private readonly newProductProposals: NewProductProposalRecord[] = [];

  createBatch(dto: CreateIntakeBatchDto) {
    if (dto.intakeTarget === IntakeTarget.PEAK_PLANNING && !dto.planningWindowId) {
      throw new BadRequestException('旺季試算批次必須提供 planningWindowId');
    }

    if (dto.intakeTarget === IntakeTarget.FORMAL_DEMAND && dto.planningWindowId) {
      throw new BadRequestException('正式需求批次不可帶入 planningWindowId');
    }

    const now = this.now();
    const batch: IntakeBatchRecord = {
      intakeBatchId: randomUUID(),
      intakeTarget: dto.intakeTarget,
      primaryChannelCode: dto.primaryChannelCode,
      batchDate: dto.batchDate,
      planningWindowId: dto.planningWindowId ?? null,
      defaultDemandDate: dto.defaultDemandDate ?? null,
      note: dto.note,
      sourceFileCount: 0,
      parsedLineCount: 0,
      unmappedCount: 0,
      pendingReviewCount: 0,
      status: BatchStatus.DRAFT,
      createdAt: now,
      createdBy: dto.createdBy ?? 'system',
      updatedAt: now,
      updatedBy: dto.createdBy ?? 'system',
    };

    this.batches.push(batch);

    return batch;
  }

  uploadSourceFile(batchId: string, file: any, dto: UploadSourceFileDto) {
    const batch = this.findBatchOrThrow(batchId);

    if (!file) {
      throw new BadRequestException('file 為必填');
    }

    const now = this.now();
    const sourceFile: SourceFileRecord = {
      sourceFileId: randomUUID(),
      intakeBatchId: batchId,
      originalFileName: file.originalname,
      fileExtension: this.getExtension(file.originalname),
      mimeType: file.mimetype ?? 'application/octet-stream',
      fileHash: this.buildFileHash(file),
      fileSizeBytes: file.size ?? 0,
      channelCode: dto.channelCode,
      intakeTarget: dto.intakeTarget,
      storagePath: `/uploads/${batchId}/${file.originalname}`,
      parserProfile: this.buildParserProfile(dto.channelCode, file.originalname),
      status: FileStatus.UPLOADED,
      uploadedAt: now,
      uploadedBy: dto.uploadedBy ?? 'system',
      createdAt: now,
      updatedAt: now,
    };

    this.sourceFiles.push(sourceFile);
    if (file.buffer) {
      this.sourceFileBuffers.set(sourceFile.sourceFileId, file.buffer as Buffer);
    }
    batch.sourceFileCount += 1;
    batch.updatedAt = now;
    batch.updatedBy = dto.uploadedBy ?? 'system';

    return sourceFile;
  }

  async triggerParse(batchId: string, dto: TriggerParseDto) {
    const batch = this.findBatchOrThrow(batchId);
    const sourceFiles = this.findSourceFilesForBatch(batchId, dto.sourceFileIds);

    if (sourceFiles.length === 0) {
      throw new BadRequestException('找不到可解析的來源檔案');
    }

    batch.status = BatchStatus.PARSING;
    batch.updatedAt = this.now();
    batch.updatedBy = dto.triggeredBy ?? 'system';

    for (const sourceFile of sourceFiles) {
      sourceFile.status = FileStatus.PARSING;
      sourceFile.updatedAt = this.now();

      try {
        const parsedLines = await this.parseSourceFile(batch, sourceFile, dto.triggeredBy ?? 'system');
        this.parsedLines.push(...parsedLines);
        this.mappingResults.push(...this.buildBootstrapMappingResults(parsedLines));
        batch.parsedLineCount += parsedLines.length;
        sourceFile.status = FileStatus.PARSED;
        sourceFile.parseErrorMessage = undefined;
      } catch (error) {
        sourceFile.status = FileStatus.PARSE_FAILED;
        sourceFile.parseErrorMessage = this.getErrorMessage(error);
        this.exceptions.push(
          this.buildParseFailureException({
            batchId,
            sourceFile,
            createdBy: dto.triggeredBy ?? 'system',
            errorMessage: sourceFile.parseErrorMessage,
          }),
        );
      }

      sourceFile.updatedAt = this.now();
    }

    batch.unmappedCount = this.countUnmapped(batchId);
    batch.pendingReviewCount = this.countPendingReview(batchId);

    batch.status = this.hasOpenExceptions(batchId)
      ? BatchStatus.EXCEPTION_IN_PROGRESS
      : batch.unmappedCount > 0
        ? BatchStatus.PENDING_MAPPING
        : BatchStatus.PENDING_REVIEW;
    batch.updatedAt = this.now();

    return {
      batchId: batch.intakeBatchId,
      status: batch.status,
      parsedLineCount: batch.parsedLineCount,
      mappingResultCount: this.countMappingResults(batchId),
    };
  }

  getBatch(batchId: string) {
    return this.findBatchOrThrow(batchId);
  }

  listParsedLines(
    batchId: string,
    options: {
      status?: string;
      channelCode?: string;
      parseKind?: string;
      page: number;
      pageSize: number;
    },
  ) {
    this.findBatchOrThrow(batchId);

    const filtered = this.parsedLines.filter((item) => {
      if (item.intakeBatchId !== batchId) {
        return false;
      }

      if (options.status && item.status !== options.status) {
        return false;
      }

      if (options.channelCode && item.channelCode !== options.channelCode) {
        return false;
      }

      if (options.parseKind && item.parseKind !== options.parseKind) {
        return false;
      }

      return true;
    });

    const page = Math.max(options.page, 1);
    const pageSize = Math.max(options.pageSize, 1);
    const start = (page - 1) * pageSize;

    return {
      items: filtered.slice(start, start + pageSize),
      page,
      pageSize,
      total: filtered.length,
    };
  }

  listMappingResults(
    batchId: string,
    options: {
      status?: string;
      channelCode?: string;
      page: number;
      pageSize: number;
    },
  ) {
    this.findBatchOrThrow(batchId);

    const filtered = this.mappingResults.filter((item) => {
      const parsedLine = this.parsedLines.find(
        (candidate) => candidate.parsedLineId === item.parsedLineId,
      );
      if (!parsedLine || parsedLine.intakeBatchId !== batchId) {
        return false;
      }

      if (options.status && item.status !== options.status) {
        return false;
      }

      if (options.channelCode && parsedLine.channelCode !== options.channelCode) {
        return false;
      }

      return true;
    });

    const page = Math.max(options.page, 1);
    const pageSize = Math.max(options.pageSize, 1);
    const start = (page - 1) * pageSize;

    return {
      items: filtered.slice(start, start + pageSize).map((item) => {
        const parsedLine = this.findParsedLineOrThrow(item.parsedLineId);

        return {
          ...item,
          parsedLine: {
            parsedLineId: parsedLine.parsedLineId,
            channelCode: parsedLine.channelCode,
            sourceRowRef: parsedLine.sourceRowRef,
            rawProductText: parsedLine.rawProductText,
            rawSpecText: parsedLine.rawSpecText,
            rawQuantity: parsedLine.rawQuantity,
            parseKind: parsedLine.parseKind,
          },
        };
      }),
      page,
      pageSize,
      total: filtered.length,
    };
  }

  reviewMappings(batchId: string, dto: ReviewMappingDto) {
    const batch = this.findBatchOrThrow(batchId);

    let createdExceptionCount = 0;

    for (const item of dto.items) {
      const parsedLine = this.findParsedLineOrThrow(item.parsedLineId);

      if (parsedLine.intakeBatchId !== batchId) {
        throw new BadRequestException(`parsedLine ${item.parsedLineId} 不屬於此批次`);
      }

      if (item.action === 'createException') {
        parsedLine.status = ParsedLineStatus.PENDING_MANUAL_CONFIRMATION;
        this.exceptions.push(
          this.buildExceptionRecord({
            batchId,
            parsedLine,
            type: ExceptionType.UNMAPPED,
            suggestedAction: SuggestedAction.BATCH_ACCEPTANCE,
            createdBy: dto.reviewedBy ?? 'system',
            errorMessage: item.reason ?? '需人工處理的映射例外',
          }),
        );
        batch.unmappedCount += 1;
        createdExceptionCount += 1;
        continue;
      }

      const mappingResult: MappingResultRecord = {
        mappingResultId: randomUUID(),
        parsedLineId: parsedLine.parsedLineId,
        sellableProductSku: item.sellableProductSku,
        multiplier: 1,
        mappedQuantity: parsedLine.rawQuantity,
        mappingMethod:
          item.action === 'assignSku' ? MappingMethod.MANUAL_ASSIGNMENT : MappingMethod.RULE_MATCH,
        mappingConfidence:
          item.action === 'assignSku' ? ConfidenceLevel.MEDIUM : ConfidenceLevel.HIGH,
        mappingConfidenceScore:
          item.action === 'assignSku' ? 0.8 : 0.95,
        isHumanReviewed: item.action === 'assignSku',
        reviewedBy: dto.reviewedBy,
        reviewedAt: dto.reviewedBy ? this.now() : undefined,
        requiresExplosion: false,
        ruleHitSummary:
          item.action === 'assignSku' ? '人工指定 SKU' : '人工接受 bootstrap rule match',
        status:
          item.action === 'assignSku'
            ? MappingResultStatus.ACCEPTED
            : MappingResultStatus.MAPPED,
        createdAt: this.now(),
        updatedAt: this.now(),
      };

      this.mappingResults.push(mappingResult);
      parsedLine.status = ParsedLineStatus.PENDING_MAPPING;
    }

    batch.pendingReviewCount = this.countPendingReview(batchId);
    batch.status = this.hasOpenExceptions(batchId)
      ? BatchStatus.EXCEPTION_IN_PROGRESS
      : BatchStatus.PENDING_REVIEW;
    batch.updatedAt = this.now();
    batch.updatedBy = dto.reviewedBy ?? 'system';

    return {
      batchId,
      processed: dto.items.length,
      createdExceptionCount,
      status: batch.status,
    };
  }

  listExceptions(batchId: string, options: { exceptionType?: string; status?: string }) {
    this.findBatchOrThrow(batchId);

    return {
      items: this.exceptions.filter((item) => {
        if (item.intakeBatchId !== batchId) {
          return false;
        }

        if (options.exceptionType && item.exceptionType !== options.exceptionType) {
          return false;
        }

        if (options.status && item.status !== options.status) {
          return false;
        }

        return true;
      }),
    };
  }

  resolveException(exceptionId: string, dto: ResolveExceptionDto) {
    const exception = this.findExceptionOrThrow(exceptionId);

    exception.status = ExceptionStatus.MANUAL_PROCESSING;

    const resolution: BatchResolutionRecord = {
      batchResolutionId: randomUUID(),
      intakeExceptionId: exceptionId,
      resolutionType: dto.resolutionType as ResolutionType,
      resolvedSellableProductSku: dto.resolvedSellableProductSku,
      resolvedQuantity: dto.resolvedQuantity,
      resolutionReason: dto.resolutionReason,
      shouldPromote: dto.shouldPromote,
      resolvedBy: dto.resolvedBy ?? 'system',
      resolvedAt: this.now(),
    };

    this.batchResolutions.push(resolution);

    let promotion: Record<string, unknown> | undefined;

    if (dto.shouldPromote) {
      if (!dto.promoteTarget) {
        throw new BadRequestException('shouldPromote 為 true 時必須提供 promoteTarget');
      }

      promotion = this.promoteException(exception, dto);
    } else {
      exception.status = ExceptionStatus.BATCH_ACCEPTED;
    }

    if (!promotion) {
      exception.status = ExceptionStatus.BATCH_ACCEPTED;
    }

    return {
      intakeExceptionId: exception.intakeExceptionId,
      status: exception.status,
      promotion,
    };
  }

  createMappingRuleProposal(dto: CreateMappingRuleProposalDto) {
    const proposal: MappingRuleProposalRecord = {
      mappingRuleProposalId: randomUUID(),
      sourceExceptionId: dto.sourceExceptionId,
      channelCode: dto.channelCode,
      rawProductPattern: dto.rawProductPattern,
      rawSpecPattern: dto.rawSpecPattern,
      proposedSellableProductSku: dto.proposedSellableProductSku,
      proposalReason: dto.proposalReason,
      status: ProposalStatus.DRAFT,
      proposedBy: dto.proposedBy ?? 'system',
      proposedAt: this.now(),
    };

    this.mappingRuleProposals.push(proposal);

    return proposal;
  }

  createNewProductProposal(dto: CreateNewProductProposalDto) {
    const proposal: NewProductProposalRecord = {
      newProductProposalId: randomUUID(),
      sourceExceptionId: dto.sourceExceptionId,
      proposedProductName: dto.proposedProductName,
      proposedProductType: dto.proposedProductType,
      proposedSpecSummary: dto.proposedSpecSummary,
      isBundleProduct: dto.isBundleProduct,
      proposedChannelScope: dto.proposedChannelScope,
      status: ProposalStatus.DRAFT,
      proposedBy: dto.proposedBy ?? 'system',
      proposedAt: this.now(),
    };

    this.newProductProposals.push(proposal);

    return proposal;
  }

  confirmBatch(batchId: string, dto: ConfirmIntakeBatchDto) {
    const batch = this.findBatchOrThrow(batchId);

    if (batch.status === BatchStatus.CONFIRMED) {
      throw new ConflictException('批次已確認，不可重複確認');
    }

    const openExceptionCount = this.exceptions.filter(
      (item) =>
        item.intakeBatchId === batchId &&
        ![ExceptionStatus.BATCH_ACCEPTED, ExceptionStatus.CLOSED].includes(item.status),
    ).length;

    if (openExceptionCount > 0) {
      throw new ConflictException({
        errorCode: 'INTAKE_BATCH_HAS_OPEN_EXCEPTIONS',
        message: '批次仍有待處理例外，無法確認',
        details: { openExceptionCount },
      });
    }

    if (
      typeof dto.expectedExceptionCount === 'number' &&
      dto.expectedExceptionCount !== openExceptionCount
    ) {
      throw new BadRequestException('expectedExceptionCount 與實際例外數不一致');
    }

    batch.status = BatchStatus.CONFIRMED;
    batch.confirmedAt = this.now();
    batch.confirmedBy = dto.confirmedBy ?? 'system';
    batch.updatedAt = this.now();
    batch.updatedBy = dto.confirmedBy ?? 'system';

    return {
      intakeBatchId: batch.intakeBatchId,
      status: batch.status,
      confirmedAt: batch.confirmedAt,
      confirmedBy: batch.confirmedBy,
      confirmationNote: dto.confirmationNote,
    };
  }

  private findBatchOrThrow(batchId: string): IntakeBatchRecord {
    const batch = this.batches.find((item) => item.intakeBatchId === batchId);

    if (!batch) {
      throw new NotFoundException(`找不到匯入批次 ${batchId}`);
    }

    return batch;
  }

  private findParsedLineOrThrow(parsedLineId: string): ParsedLineRecord {
    const parsedLine = this.parsedLines.find((item) => item.parsedLineId === parsedLineId);

    if (!parsedLine) {
      throw new NotFoundException(`找不到 parsedLine ${parsedLineId}`);
    }

    return parsedLine;
  }

  private findExceptionOrThrow(exceptionId: string): IntakeExceptionRecord {
    const exception = this.exceptions.find((item) => item.intakeExceptionId === exceptionId);

    if (!exception) {
      throw new NotFoundException(`找不到 intakeException ${exceptionId}`);
    }

    return exception;
  }

  private findSourceFilesForBatch(batchId: string, sourceFileIds: string[]): SourceFileRecord[] {
    const sourceFiles = this.sourceFiles.filter(
      (item) => item.intakeBatchId === batchId && sourceFileIds.includes(item.sourceFileId),
    );

    return sourceFiles;
  }

  private buildFileHash(file: any): string {
    const hash = createHash('sha256');
    hash.update(String(file.originalname ?? ''));
    hash.update(String(file.size ?? 0));
    hash.update(String(file.mimetype ?? ''));

    return hash.digest('hex');
  }

  private buildParserProfile(channelCode: string, originalFileName: string): string {
    const extension = this.getExtension(originalFileName).toLowerCase();

    return `${channelCode.toLowerCase()}_${extension}_v1`;
  }

  private getExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');

    return lastDotIndex >= 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : 'unknown';
  }

  private createStubParsedLine(
    batch: IntakeBatchRecord,
    sourceFile: SourceFileRecord,
    createdBy: string,
  ): ParsedLineRecord {
    const now = this.now();

    return {
      parsedLineId: randomUUID(),
      intakeBatchId: batch.intakeBatchId,
      sourceFileId: sourceFile.sourceFileId,
      channelCode: sourceFile.channelCode,
      sourceRowRef: `${sourceFile.originalFileName}#1`,
      rawProductText: `PARSER_STUB:${sourceFile.originalFileName}`,
      rawSpecText: sourceFile.parserProfile,
      rawQuantity: 1,
      parseKind: ParseKind.UNKNOWN,
      parseConfidence: ConfidenceLevel.LOW,
      parserWarningCode: 'PARSER_NOT_IMPLEMENTED',
      parserMeta: {
        sourceFileId: sourceFile.sourceFileId,
        note: '本版為 backend intake skeleton，尚未接入真實 parser。',
      },
      status: ParsedLineStatus.PENDING_MAPPING,
      createdAt: now,
      createdBy,
    };
  }

  private async parseSourceFile(
    batch: IntakeBatchRecord,
    sourceFile: SourceFileRecord,
    createdBy: string,
  ): Promise<ParsedLineRecord[]> {
    const fileBuffer = this.sourceFileBuffers.get(sourceFile.sourceFileId);

    if (this.isMomoChannel(sourceFile.channelCode)) {
      if (!fileBuffer) {
        throw new BadRequestException('MOMO parser 需要上傳檔案 buffer，但目前 sourceFile 不含檔案內容');
      }

      const parsedLines = await parseMomoPdfToParsedLines({
        fileBuffer,
        originalFileName: sourceFile.originalFileName,
      });

      return this.mapParserCandidatesToRecords(batch, sourceFile, parsedLines, createdBy);
    }

    if (this.isShopeeChannel(sourceFile.channelCode)) {
      if (!fileBuffer) {
        throw new BadRequestException('蝦皮 parser 需要上傳檔案 buffer，但目前 sourceFile 不含檔案內容');
      }

      const parsedLines = await parseShopeePdfToParsedLines({
        fileBuffer,
        originalFileName: sourceFile.originalFileName,
      });

      return this.mapParserCandidatesToRecords(batch, sourceFile, parsedLines, createdBy);
    }

    if (this.isOfficialChannel(sourceFile.channelCode)) {
      if (!fileBuffer) {
        throw new BadRequestException('官網 parser 需要上傳檔案 buffer，但目前 sourceFile 不含檔案內容');
      }

      const parsedLines = await parseOfficialXlsxToParsedLines({
        fileBuffer,
        originalFileName: sourceFile.originalFileName,
      });

      return this.mapParserCandidatesToRecords(batch, sourceFile, parsedLines, createdBy);
    }

    if (this.isOrangePointChannel(sourceFile.channelCode)) {
      if (!fileBuffer) {
        throw new BadRequestException('橘點子 parser 需要上傳檔案 buffer，但目前 sourceFile 不含檔案內容');
      }

      const parsedLines = await parseOrangePointXlsToParsedLines({
        fileBuffer,
        originalFileName: sourceFile.originalFileName,
      });

      return this.mapParserCandidatesToRecords(batch, sourceFile, parsedLines, createdBy);
    }

    return [this.createStubParsedLine(batch, sourceFile, createdBy)];
  }

  private mapParserCandidatesToRecords(
    batch: IntakeBatchRecord,
    sourceFile: SourceFileRecord,
    parsedLines: Array<{
      sourceRowRef: string;
      rawProductText: string;
      rawSpecText?: string;
      rawQuantity: number;
      parseKind: ParseKind;
      parseConfidence: ConfidenceLevel;
      parserWarningCode?: string;
      parserMeta?: Record<string, unknown>;
    }>,
    createdBy: string,
  ): ParsedLineRecord[] {
    const now = this.now();

    return parsedLines.map((item) => ({
      parsedLineId: randomUUID(),
      intakeBatchId: batch.intakeBatchId,
      sourceFileId: sourceFile.sourceFileId,
      channelCode: sourceFile.channelCode,
      sourceRowRef: item.sourceRowRef,
      rawProductText: item.rawProductText,
      rawSpecText: item.rawSpecText,
      rawQuantity: item.rawQuantity,
      parseKind: item.parseKind,
      parseConfidence: item.parseConfidence,
      parserWarningCode: item.parserWarningCode,
      parserMeta: item.parserMeta,
      status: ParsedLineStatus.PENDING_MAPPING,
      createdAt: now,
      createdBy,
    }));
  }

  private buildBootstrapMappingResults(parsedLines: ParsedLineRecord[]): MappingResultRecord[] {
    const now = this.now();

    return parsedLines.map((parsedLine) => {
      const candidate = autoMapParsedLineToBootstrapResult(parsedLine);

      return {
        mappingResultId: randomUUID(),
        parsedLineId: parsedLine.parsedLineId,
        sellableProductSku: candidate.sellableProductSku,
        mappingRuleCode: candidate.mappingRuleCode,
        matchedProductName: candidate.matchedProductName,
        matchedSpec: candidate.matchedSpec,
        multiplier: candidate.multiplier,
        mappedQuantity: candidate.mappedQuantity,
        mappingMethod: candidate.mappingMethod,
        mappingConfidence: candidate.mappingConfidence,
        mappingConfidenceScore: candidate.mappingConfidenceScore,
        isHumanReviewed: false,
        requiresExplosion: candidate.requiresExplosion,
        ruleHitSummary: candidate.ruleHitSummary,
        status: candidate.status,
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  private isMomoChannel(channelCode: string): boolean {
    return /momo|mo店/iu.test(channelCode);
  }

  private isOfficialChannel(channelCode: string): boolean {
    return /official|官網/iu.test(channelCode);
  }

  private isShopeeChannel(channelCode: string): boolean {
    return /shopee|蝦皮/iu.test(channelCode);
  }

  private isOrangePointChannel(channelCode: string): boolean {
    return /orangepoint|orange|橘點子/iu.test(channelCode);
  }

  private buildParseFailureException(params: {
    batchId: string;
    sourceFile: SourceFileRecord;
    createdBy: string;
    errorMessage: string;
  }): IntakeExceptionRecord {
    return {
      intakeExceptionId: randomUUID(),
      intakeBatchId: params.batchId,
      sourceFileId: params.sourceFile.sourceFileId,
      exceptionType: ExceptionType.PARSE_FAILED,
      sourceRowRef: `${params.sourceFile.originalFileName}#file`,
      rawProductText: params.sourceFile.originalFileName,
      errorMessage: params.errorMessage,
      suggestedAction: SuggestedAction.ENGINEERING_HANDOFF,
      status: ExceptionStatus.PENDING,
      createdAt: this.now(),
      createdBy: params.createdBy,
    };
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return '未知解析錯誤';
  }

  private buildExceptionRecord(params: {
    batchId: string;
    parsedLine: ParsedLineRecord;
    type: ExceptionType;
    suggestedAction: SuggestedAction;
    createdBy: string;
    errorMessage?: string;
  }): IntakeExceptionRecord {
    return {
      intakeExceptionId: randomUUID(),
      intakeBatchId: params.batchId,
      sourceFileId: params.parsedLine.sourceFileId,
      parsedLineId: params.parsedLine.parsedLineId,
      exceptionType: params.type,
      sourceRowRef: params.parsedLine.sourceRowRef,
      rawProductText: params.parsedLine.rawProductText,
      rawSpecText: params.parsedLine.rawSpecText,
      rawQuantity: params.parsedLine.rawQuantity,
      errorMessage: params.errorMessage,
      suggestedAction: params.suggestedAction,
      status: ExceptionStatus.PENDING,
      createdAt: this.now(),
      createdBy: params.createdBy,
    };
  }

  private promoteException(exception: IntakeExceptionRecord, dto: ResolveExceptionDto) {
    if (dto.promoteTarget === 'mappingRuleProposal') {
      const proposal = this.createMappingRuleProposal({
        sourceExceptionId: exception.intakeExceptionId,
        channelCode: 'UNKNOWN',
        rawProductPattern: exception.rawProductText ?? 'UNKNOWN',
        proposedSellableProductSku: dto.resolvedSellableProductSku ?? 'TBD-SKU',
        proposalReason: dto.resolutionReason,
        proposedBy: dto.resolvedBy,
      });

      exception.status = ExceptionStatus.RULE_PROPOSAL_CREATED;

      return {
        target: dto.promoteTarget,
        created: true,
        proposalId: proposal.mappingRuleProposalId,
      };
    }

    if (dto.promoteTarget === 'newProductProposal') {
      const proposal = this.createNewProductProposal({
        sourceExceptionId: exception.intakeExceptionId,
        proposedProductName: exception.rawProductText ?? 'TBD Product',
        proposedProductType: '待分類商品',
        proposedSpecSummary: exception.rawSpecText,
        isBundleProduct: false,
        proposedBy: dto.resolvedBy,
      });

      exception.status = ExceptionStatus.NEW_PRODUCT_PROPOSAL_CREATED;

      return {
        target: dto.promoteTarget,
        created: true,
        proposalId: proposal.newProductProposalId,
      };
    }

    exception.status = ExceptionStatus.ENGINEERING_ESCALATED;

    return {
      target: dto.promoteTarget,
      created: false,
      backlogType: 'engineering',
    };
  }

  private countPendingReview(batchId: string): number {
    return this.mappingResults.filter(
      (item) =>
        this.parsedLines.find(
          (parsedLine) =>
            parsedLine.parsedLineId === item.parsedLineId && parsedLine.intakeBatchId === batchId,
        ) !== undefined && item.status === MappingResultStatus.PENDING_MANUAL_REVIEW,
    ).length;
  }

  private countUnmapped(batchId: string): number {
    return this.mappingResults.filter(
      (item) =>
        this.parsedLines.find(
          (parsedLine) =>
            parsedLine.parsedLineId === item.parsedLineId && parsedLine.intakeBatchId === batchId,
        ) !== undefined && item.status === MappingResultStatus.UNMAPPED,
    ).length;
  }

  private countMappingResults(batchId: string): number {
    return this.mappingResults.filter(
      (item) =>
        this.parsedLines.find(
          (parsedLine) =>
            parsedLine.parsedLineId === item.parsedLineId && parsedLine.intakeBatchId === batchId,
        ) !== undefined,
    ).length;
  }

  private hasOpenExceptions(batchId: string): boolean {
    return this.exceptions.some(
      (item) =>
        item.intakeBatchId === batchId &&
        ![ExceptionStatus.BATCH_ACCEPTED, ExceptionStatus.CLOSED].includes(item.status),
    );
  }

  private now(): string {
    return new Date().toISOString();
  }
}