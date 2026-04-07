export class CreateNewProductProposalDto {
  sourceExceptionId?: string;
  proposedProductName!: string;
  proposedProductType!: string;
  proposedSpecSummary?: string;
  isBundleProduct!: boolean;
  proposedChannelScope?: string[];
  proposedBy?: string;
}