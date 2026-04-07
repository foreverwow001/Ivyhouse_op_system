export class ProductionPlanApprovalDecisionDto {
  decision!: 'APPROVED' | 'REJECTED';
  reason?: string;
}