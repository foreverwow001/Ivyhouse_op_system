export type PromoteTarget = 'mappingRuleProposal' | 'newProductProposal' | 'engineeringBacklog';

export class ResolveExceptionDto {
  resolutionType!: string;
  resolvedSellableProductSku?: string;
  resolvedQuantity?: number;
  resolutionReason?: string;
  shouldPromote!: boolean;
  promoteTarget?: PromoteTarget;
  resolvedBy?: string;
}