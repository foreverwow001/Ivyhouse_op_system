-- Formal migration for daily-ops persistence and audit baseline.
-- Assumption: existing intake tables already exist in target database.

CREATE TYPE "DailyDemandSourceType" AS ENUM ('ORDER_IMPORT', 'MANUAL_ENTRY');
CREATE TYPE "DailyDemandBatchStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'VOIDED');
CREATE TYPE "InventoryBucketType" AS ENUM ('SELLABLE', 'INNER_PACK_FINISHED', 'PACKAGING_MATERIAL', 'SHIPPING_SUPPLY_MANUAL');
CREATE TYPE "InventoryItemType" AS ENUM ('SELLABLE_PRODUCT', 'INNER_PACK_PRODUCT', 'MATERIAL');
CREATE TYPE "InventoryDeductionRunStatus" AS ENUM ('PENDING', 'EXECUTED', 'PARTIALLY_EXECUTED', 'VOIDED');
CREATE TYPE "ProductionPlanStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'REVISED', 'VOIDED');
CREATE TYPE "ProductionPlanLevel" AS ENUM ('SELLABLE', 'INNER_PACK');
CREATE TYPE "BomTriggerType" AS ENUM ('PLAN_CREATED', 'PLAN_REVISED', 'MANUAL_RERUN');
CREATE TYPE "ReplenishmentRunStatus" AS ENUM ('DRAFT', 'COMMITTED', 'VOIDED');
CREATE TYPE "InventoryCountScope" AS ENUM ('DAILY_OPS', 'PACKAGING_MATERIAL', 'SHIPPING_SUPPLY', 'FULL_WAREHOUSE');
CREATE TYPE "InventoryCountSessionStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "InventoryAdjustmentSourceType" AS ENUM ('COUNT_SESSION', 'MANUAL', 'REPLENISHMENT');
CREATE TYPE "InventoryEventType" AS ENUM ('DEDUCTION', 'DEDUCTION_FALLBACK', 'BOM_RESERVATION', 'BOM_REVERSAL', 'REPLENISHMENT', 'COUNT_ADJUSTMENT', 'MANUAL_ADJUSTMENT');

CREATE TABLE "DailyDemandBatch" (
    "id" TEXT NOT NULL,
    "batchNo" TEXT NOT NULL,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "sourceType" "DailyDemandSourceType" NOT NULL,
    "status" "DailyDemandBatchStatus" NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL,
    "importedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyDemandBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyDemandLine" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "channelCode" TEXT NOT NULL,
    "sellableSku" TEXT NOT NULL,
    "sellableName" TEXT NOT NULL,
    "spec" TEXT,
    "quantity" DECIMAL(18,4) NOT NULL,
    "shipDate" TIMESTAMP(3),
    "rawSourceRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyDemandLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryDeductionRun" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "status" "InventoryDeductionRunStatus" NOT NULL,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "executedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryDeductionRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryDeductionLine" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "bucketType" "InventoryBucketType" NOT NULL,
    "itemType" "InventoryItemType" NOT NULL,
    "itemSku" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "fallbackFromBucket" "InventoryBucketType",
    "warningCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryDeductionLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductionPlanHeader" (
    "id" TEXT NOT NULL,
    "planDate" TIMESTAMP(3) NOT NULL,
    "status" "ProductionPlanStatus" NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revisedFromId" TEXT,
    CONSTRAINT "ProductionPlanHeader_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductionPlanLine" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planLevel" "ProductionPlanLevel" NOT NULL,
    "targetSku" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "plannedQty" DECIMAL(18,4) NOT NULL,
    "uom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductionPlanLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BomReservationRun" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "triggerType" "BomTriggerType" NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "executedBy" TEXT NOT NULL,
    "reversedRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BomReservationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BomReservationLine" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "materialType" "InventoryItemType" NOT NULL,
    "materialSku" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "qtyDelta" DECIMAL(18,4) NOT NULL,
    "uom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BomReservationLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReplenishmentRun" (
    "id" TEXT NOT NULL,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "status" "ReplenishmentRunStatus" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReplenishmentRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReplenishmentLine" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "bucketType" "InventoryBucketType" NOT NULL,
    "itemSku" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "uom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReplenishmentLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryCountSession" (
    "id" TEXT NOT NULL,
    "countScope" "InventoryCountScope" NOT NULL,
    "status" "InventoryCountSessionStatus" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InventoryCountSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryCountLine" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "bucketType" "InventoryBucketType" NOT NULL,
    "itemSku" TEXT NOT NULL,
    "beforeQty" DECIMAL(18,4) NOT NULL,
    "countedQty" DECIMAL(18,4) NOT NULL,
    "variancePct" DECIMAL(18,4),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryCountLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryAdjustmentEvent" (
    "id" TEXT NOT NULL,
    "sourceType" "InventoryAdjustmentSourceType" NOT NULL,
    "sourceSessionId" TEXT,
    "bucketType" "InventoryBucketType" NOT NULL,
    "itemSku" TEXT NOT NULL,
    "qtyDelta" DECIMAL(18,4) NOT NULL,
    "reason" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryAdjustmentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryEventLedger" (
    "id" TEXT NOT NULL,
    "eventType" "InventoryEventType" NOT NULL,
    "bucketType" "InventoryBucketType" NOT NULL,
    "itemSku" TEXT NOT NULL,
    "qtyDelta" DECIMAL(18,4) NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryEventLedger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyDemandBatch_batchNo_key" ON "DailyDemandBatch"("batchNo");
CREATE INDEX "DailyDemandBatch_businessDate_idx" ON "DailyDemandBatch"("businessDate");
CREATE INDEX "DailyDemandBatch_status_idx" ON "DailyDemandBatch"("status");
CREATE INDEX "DailyDemandLine_batchId_idx" ON "DailyDemandLine"("batchId");
CREATE INDEX "DailyDemandLine_sellableSku_idx" ON "DailyDemandLine"("sellableSku");
CREATE INDEX "InventoryDeductionRun_batchId_idx" ON "InventoryDeductionRun"("batchId");
CREATE INDEX "InventoryDeductionRun_status_idx" ON "InventoryDeductionRun"("status");
CREATE INDEX "InventoryDeductionLine_runId_idx" ON "InventoryDeductionLine"("runId");
CREATE INDEX "InventoryDeductionLine_itemSku_idx" ON "InventoryDeductionLine"("itemSku");
CREATE INDEX "ProductionPlanHeader_planDate_idx" ON "ProductionPlanHeader"("planDate");
CREATE INDEX "ProductionPlanHeader_status_idx" ON "ProductionPlanHeader"("status");
CREATE INDEX "ProductionPlanLine_planId_idx" ON "ProductionPlanLine"("planId");
CREATE INDEX "ProductionPlanLine_targetSku_idx" ON "ProductionPlanLine"("targetSku");
CREATE INDEX "BomReservationRun_planId_idx" ON "BomReservationRun"("planId");
CREATE INDEX "BomReservationRun_triggerType_idx" ON "BomReservationRun"("triggerType");
CREATE INDEX "BomReservationLine_runId_idx" ON "BomReservationLine"("runId");
CREATE INDEX "BomReservationLine_materialSku_idx" ON "BomReservationLine"("materialSku");
CREATE INDEX "ReplenishmentRun_businessDate_idx" ON "ReplenishmentRun"("businessDate");
CREATE INDEX "ReplenishmentRun_status_idx" ON "ReplenishmentRun"("status");
CREATE INDEX "ReplenishmentLine_runId_idx" ON "ReplenishmentLine"("runId");
CREATE INDEX "ReplenishmentLine_itemSku_idx" ON "ReplenishmentLine"("itemSku");
CREATE INDEX "InventoryCountSession_countScope_idx" ON "InventoryCountSession"("countScope");
CREATE INDEX "InventoryCountSession_status_idx" ON "InventoryCountSession"("status");
CREATE INDEX "InventoryCountLine_sessionId_idx" ON "InventoryCountLine"("sessionId");
CREATE INDEX "InventoryCountLine_itemSku_idx" ON "InventoryCountLine"("itemSku");
CREATE INDEX "InventoryAdjustmentEvent_sourceType_idx" ON "InventoryAdjustmentEvent"("sourceType");
CREATE INDEX "InventoryAdjustmentEvent_itemSku_idx" ON "InventoryAdjustmentEvent"("itemSku");
CREATE INDEX "InventoryEventLedger_eventType_idx" ON "InventoryEventLedger"("eventType");
CREATE INDEX "InventoryEventLedger_itemSku_idx" ON "InventoryEventLedger"("itemSku");
CREATE INDEX "InventoryEventLedger_sourceType_sourceId_idx" ON "InventoryEventLedger"("sourceType", "sourceId");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");
CREATE INDEX "AuditLog_performedAt_idx" ON "AuditLog"("performedAt");

ALTER TABLE "DailyDemandLine"
    ADD CONSTRAINT "DailyDemandLine_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "DailyDemandBatch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryDeductionRun"
    ADD CONSTRAINT "InventoryDeductionRun_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "DailyDemandBatch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryDeductionLine"
    ADD CONSTRAINT "InventoryDeductionLine_runId_fkey"
    FOREIGN KEY ("runId") REFERENCES "InventoryDeductionRun"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductionPlanHeader"
    ADD CONSTRAINT "ProductionPlanHeader_revisedFromId_fkey"
    FOREIGN KEY ("revisedFromId") REFERENCES "ProductionPlanHeader"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductionPlanLine"
    ADD CONSTRAINT "ProductionPlanLine_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "ProductionPlanHeader"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BomReservationRun"
    ADD CONSTRAINT "BomReservationRun_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "ProductionPlanHeader"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BomReservationRun"
    ADD CONSTRAINT "BomReservationRun_reversedRunId_fkey"
    FOREIGN KEY ("reversedRunId") REFERENCES "BomReservationRun"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BomReservationLine"
    ADD CONSTRAINT "BomReservationLine_runId_fkey"
    FOREIGN KEY ("runId") REFERENCES "BomReservationRun"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReplenishmentLine"
    ADD CONSTRAINT "ReplenishmentLine_runId_fkey"
    FOREIGN KEY ("runId") REFERENCES "ReplenishmentRun"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryCountLine"
    ADD CONSTRAINT "InventoryCountLine_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "InventoryCountSession"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryAdjustmentEvent"
    ADD CONSTRAINT "InventoryAdjustmentEvent_sourceSessionId_fkey"
    FOREIGN KEY ("sourceSessionId") REFERENCES "InventoryCountSession"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;