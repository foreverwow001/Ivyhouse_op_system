export enum IntakeTarget {
  FORMAL_DEMAND = '正式需求',
  PEAK_PLANNING = '旺季試算',
}

export enum FileStatus {
  UPLOADED = '已上傳',
  PARSING = '解析中',
  PARSED = '已解析',
  PARSE_FAILED = '解析失敗',
  ARCHIVED = '已封存',
}

export enum BatchStatus {
  DRAFT = '草稿',
  PARSING = '解析中',
  PENDING_MAPPING = '待映射',
  PENDING_REVIEW = '待人工確認',
  EXCEPTION_IN_PROGRESS = '例外處理中',
  CONFIRMED = '已確認',
  VOIDED = '已作廢',
}

export enum ParseKind {
  STANDARD = '普通列',
  GIFT = '贈品',
  TRIAL_SNACK = '試吃組合',
  MANUAL = '手動輸入',
  UNKNOWN = '未知',
}

export enum ConfidenceLevel {
  HIGH = '高',
  MEDIUM = '中',
  LOW = '低',
}

export enum ParsedLineStatus {
  EXTRACTED = '已抽取',
  PENDING_MANUAL_CONFIRMATION = '待人工確認',
  PENDING_MAPPING = '待映射',
  REJECTED = '已拒絕',
}

export enum MappingMethod {
  RULE_MATCH = '規則命中',
  MANUAL_ASSIGNMENT = '人工指定',
  BATCH_ACCEPTANCE = '單批接受',
  UNMAPPED = '未映射',
}

export enum MappingResultStatus {
  PENDING_MAPPING = '待映射',
  MAPPED = '已映射',
  PENDING_MANUAL_REVIEW = '待人工覆核',
  UNMAPPED = '未映射',
  ACCEPTED = '已接受',
  EXCEPTION_ESCALATED = '已轉例外',
}

export enum ExceptionType {
  CHANNEL_IDENTIFICATION_FAILED = '平台辨識失敗',
  PARSE_FAILED = '解析失敗',
  LOW_CONFIDENCE_PARSE = '低信心解析',
  UNMAPPED = '未映射',
  RULE_CONFLICT = '規則衝突',
  NEW_GRAMMAR_REQUIRED = '需新grammar',
}

export enum SuggestedAction {
  BATCH_ACCEPTANCE = '單批接受',
  CREATE_MAPPING_RULE_PROPOSAL = '提報規則',
  CREATE_NEW_PRODUCT_PROPOSAL = '提報新商品',
  ENGINEERING_HANDOFF = '工程處理',
}

export enum ExceptionStatus {
  PENDING = '待處理',
  MANUAL_PROCESSING = '人工處理中',
  BATCH_ACCEPTED = '單批已接受',
  RULE_PROPOSAL_CREATED = '已轉規則提案',
  NEW_PRODUCT_PROPOSAL_CREATED = '已轉商品提案',
  ENGINEERING_ESCALATED = '已轉工程待辦',
  CLOSED = '已關閉',
}

export enum ResolutionType {
  ACCEPT_FOR_BATCH = '單批接受',
  REJECT_FOR_BATCH = '單批拒絕',
  ASSIGN_SKU = '改指定SKU',
}

export enum ProposalStatus {
  DRAFT = '草稿',
  PENDING_REVIEW = '待審核',
  APPROVED = '已核准',
  REJECTED = '已駁回',
  PUBLISHED = '已發布',
}

export interface IntakeBatchRecord {
  intakeBatchId: string;
  intakeTarget: IntakeTarget;
  primaryChannelCode?: string;
  batchDate: string;
  planningWindowId?: string | null;
  defaultDemandDate?: string | null;
  note?: string;
  sourceFileCount: number;
  parsedLineCount: number;
  unmappedCount: number;
  pendingReviewCount: number;
  confirmedAt?: string;
  confirmedBy?: string;
  status: BatchStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface SourceFileRecord {
  sourceFileId: string;
  intakeBatchId: string;
  originalFileName: string;
  fileExtension: string;
  mimeType: string;
  fileHash: string;
  fileSizeBytes: number;
  channelCode: string;
  intakeTarget: IntakeTarget;
  storagePath: string;
  parserProfile?: string;
  parseErrorMessage?: string;
  status: FileStatus;
  uploadedAt: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedLineRecord {
  parsedLineId: string;
  intakeBatchId: string;
  sourceFileId?: string;
  channelCode: string;
  sourceRowRef: string;
  rawProductText: string;
  rawSpecText?: string;
  rawQuantity: number;
  parseKind: ParseKind;
  parseConfidence: ConfidenceLevel;
  parserWarningCode?: string;
  parserMeta?: Record<string, unknown>;
  status: ParsedLineStatus;
  createdAt: string;
  createdBy: string;
}

export interface MappingResultRecord {
  mappingResultId: string;
  parsedLineId: string;
  sellableProductSku?: string;
  bundleProductSku?: string;
  mappingRuleCode?: string;
  matchedProductName?: string;
  matchedSpec?: string;
  multiplier: number;
  mappedQuantity: number;
  mappingMethod: MappingMethod;
  mappingConfidence: ConfidenceLevel;
  mappingConfidenceScore?: number;
  isHumanReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  requiresExplosion: boolean;
  ruleHitSummary?: string;
  status: MappingResultStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IntakeExceptionRecord {
  intakeExceptionId: string;
  intakeBatchId: string;
  sourceFileId?: string;
  parsedLineId?: string;
  mappingResultId?: string;
  exceptionType: ExceptionType;
  sourceRowRef?: string;
  rawProductText?: string;
  rawSpecText?: string;
  rawQuantity?: number;
  errorMessage?: string;
  suggestedAction: SuggestedAction;
  status: ExceptionStatus;
  createdAt: string;
  createdBy: string;
}

export interface BatchResolutionRecord {
  batchResolutionId: string;
  intakeExceptionId: string;
  resolutionType: ResolutionType;
  resolvedSellableProductSku?: string;
  resolvedQuantity?: number;
  resolutionReason?: string;
  shouldPromote: boolean;
  resolvedBy: string;
  resolvedAt: string;
}

export interface MappingRuleProposalRecord {
  mappingRuleProposalId: string;
  sourceExceptionId?: string;
  channelCode: string;
  rawProductPattern: string;
  rawSpecPattern?: string;
  proposedSellableProductSku: string;
  proposalReason?: string;
  status: ProposalStatus;
  proposedBy: string;
  proposedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface NewProductProposalRecord {
  newProductProposalId: string;
  sourceExceptionId?: string;
  proposedProductName: string;
  proposedProductType: string;
  proposedSpecSummary?: string;
  isBundleProduct: boolean;
  proposedChannelScope?: string[];
  status: ProposalStatus;
  proposedBy: string;
  proposedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}