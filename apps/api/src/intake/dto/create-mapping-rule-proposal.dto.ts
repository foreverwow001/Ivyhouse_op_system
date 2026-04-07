export class CreateMappingRuleProposalDto {
  sourceExceptionId?: string;
  channelCode!: string;
  rawProductPattern!: string;
  rawSpecPattern?: string;
  proposedSellableProductSku!: string;
  proposalReason?: string;
  proposedBy?: string;
}