export type MappingReviewAction = 'acceptRuleMatch' | 'assignSku' | 'createException';

export class ReviewMappingItemDto {
  parsedLineId!: string;
  action!: MappingReviewAction;
  sellableProductSku?: string;
  reason?: string;
}

export class ReviewMappingDto {
  items!: ReviewMappingItemDto[];
  reviewedBy?: string;
}