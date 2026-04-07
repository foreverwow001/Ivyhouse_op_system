-- Idx-020: opening balance 多窗口 / 中斷補救治理補強

ALTER TABLE "InventoryCountSession"
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledByPrincipalId" TEXT,
ADD COLUMN "cancelReason" TEXT;