-- Idx-022: production-planning 完整 approval persistence 與 approver boundary 收斂

ALTER TABLE "ProductionPlanHeader"
ADD COLUMN "createdBySessionId" TEXT,
ADD COLUMN "createdByAuthSource" TEXT,
ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
ADD COLUMN "approverPrincipalId" TEXT,
ADD COLUMN "approvalDecidedAt" TIMESTAMP(3),
ADD COLUMN "approvalNote" TEXT,
ADD COLUMN "singlePersonOverride" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "ProductionPlanHeader_approvalStatus_idx" ON "ProductionPlanHeader"("approvalStatus");

ALTER TABLE "BomReservationRun"
ADD COLUMN "requestedByPrincipalId" TEXT,
ADD COLUMN "requestedBySessionId" TEXT,
ADD COLUMN "requestedByAuthSource" TEXT,
ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
ADD COLUMN "approverPrincipalId" TEXT,
ADD COLUMN "approvalDecidedAt" TIMESTAMP(3),
ADD COLUMN "approvalNote" TEXT,
ADD COLUMN "singlePersonOverride" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "executedAt" DROP NOT NULL,
ALTER COLUMN "executedBy" DROP NOT NULL;

CREATE INDEX "BomReservationRun_approvalStatus_idx" ON "BomReservationRun"("approvalStatus");