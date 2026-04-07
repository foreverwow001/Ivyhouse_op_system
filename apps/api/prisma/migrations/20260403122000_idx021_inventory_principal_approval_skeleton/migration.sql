-- Idx-021 第一個正式實作切片：inventory-count Portal principal 與 approval skeleton

CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

ALTER TABLE "InventoryCountSession"
ADD COLUMN "startedBySessionId" TEXT,
ADD COLUMN "startedByAuthSource" TEXT,
ADD COLUMN "completedByPrincipalId" TEXT,
ADD COLUMN "completionApprovalStatus" "ApprovalStatus",
ADD COLUMN "completionApproverPrincipalId" TEXT,
ADD COLUMN "completionApprovedAt" TIMESTAMP(3),
ADD COLUMN "completionSinglePersonOverride" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "InventoryAdjustmentEvent"
ADD COLUMN "performedBySessionId" TEXT,
ADD COLUMN "performedByAuthSource" TEXT,
ADD COLUMN "approvalStatus" "ApprovalStatus",
ADD COLUMN "approverPrincipalId" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "singlePersonOverride" BOOLEAN NOT NULL DEFAULT false;