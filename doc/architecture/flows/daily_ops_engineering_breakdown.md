# 日常營運流程工程拆解清單

更新日期：2026-03-31

Authoritative source：否（implementation decomposition）

## 目的

本文件把已確認的日常營運正式 flows 規格，拆解成工程可直接評估與排工的實作清單，聚焦三個面向：

- 資料表 / 聚合根候選
- API / command surface 候選
- 狀態事件 / 庫存事件候選

本文件不取代權威流程文件；若內容與正式規格衝突，以正式規格為準。

## 來源規格

- `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`
- `doc/architecture/flows/end_of_day_replenishment_spec.md`
- `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`
- `doc/architecture/roles/README.md`

## 工程拆解原則

### 1. 三張正式表的 owner 邊界不可混用

- `銷售商品組成對照表`：sellable -> inner-pack / 外包裝材料
- `內包裝耗材用量對照表`：inner-pack -> 耗材
- `生產_分裝_轉換扣帳規則表`：拆包 / 秤重 / 單片 / 分裝轉換

### 2. 一個 command 對應一組正式事件

- 匯入需求、建立排工、回沖 BOM、日終回填、完成盤點都應留下事件，而不是只存最終數量。

### 3. 現況 SOP 與終版治理並存

- 工程實作應先支援目前 `生產 / 包裝 / 會計 / 主管` 四角色皆可操作的流程。
- 同時保留後續導入 maker-checker 的欄位與事件擴充點。
- Idx-021 / Idx-022 已把 inventory-count / production-planning 的 actor 與 approval 來源收斂到 Portal session principal；後續治理應沿同一 principal contract 擴充，不得再回到自由文字 actor 或 `x-ivyhouse-role` 過渡模型。

### 4. Phase 1 evidence 先以可重跑 smoke / regression 固化

- mainline evidence 以單一 scenario 串 `demand batch -> deduction -> production plan -> BOM reservation -> replenishment -> inventory count -> adjustment -> audit`。
- failure-path evidence 以固定 regression suite 固化 `zero-baseline`、`negative stock`、`count reminder`、`權限拒絕`、`manual rerun` 與 `revision-as-rollback-guard`。
- 若正式 rollback API 尚未存在，不得假裝 rollback 已 ready；應以受控 revision / rerun 證據先守住回歸，再把缺口列為 follow-up 任務。

## 資料表候選

### A. 日常需求匯入與扣帳

| 候選資料表 | 用途 | 核心欄位 |
|------------|------|----------|
| `daily_demand_batch` | 每日匯入批次主檔 | `id`, `batch_no`, `business_date`, `source_type`, `imported_at`, `imported_by`, `status` |
| `daily_demand_line` | 匯入後的正式需求行 | `id`, `batch_id`, `channel`, `sellable_sku`, `sellable_name`, `spec`, `quantity`, `ship_date`, `raw_source_ref` |
| `inventory_deduction_run` | 每次匯入後的正式扣帳執行紀錄 | `id`, `batch_id`, `executed_at`, `executed_by`, `status`, `warning_count` |
| `inventory_deduction_line` | 扣帳明細，記錄扣到哪個桶 | `id`, `run_id`, `bucket_type`, `item_type`, `item_sku`, `quantity`, `fallback_from_bucket`, `warning_code` |

### B. 隔日排工與 BOM 保留

| 候選資料表 | 用途 | 核心欄位 |
|------------|------|----------|
| `production_plan_header` | 隔日排工單頭 | `id`, `plan_date`, `status`, `created_by`, `approval_status`, `approver_principal_id`, `approval_decided_at`, `single_person_override`, `created_at`, `revised_from_id` |
| `production_plan_line` | 排工明細，支援 sellable 與 inner-pack level | `id`, `plan_id`, `plan_level`, `target_sku`, `target_name`, `planned_qty`, `uom` |
| `bom_reservation_run` | 排工 approval 或 rerun approval 後的 BOM 扣帳主檔 | `id`, `plan_id`, `trigger_type`, `requested_by_principal_id`, `approval_status`, `approver_principal_id`, `approval_decided_at`, `single_person_override`, `executed_at`, `executed_by`, `reversed_run_id` |
| `bom_reservation_line` | BOM 扣帳 / 回沖明細 | `id`, `run_id`, `material_type`, `material_sku`, `material_name`, `qty_delta`, `uom` |

補充治理規則：

- revision 鏈在 Phase 1 不設硬性上限；工程上必須保留完整 revision graph 與 audit trail，不得因鏈長治理需求而刪改既有版本。
- 若同一 principal 同時具有 `主管 + 管理員`，高風險業務 approval 只可依 `主管` 角色成立；service / guard / audit contract 均不得把 `管理員` 當成 approver 放行來源。

### C. 日終回填

| 候選資料表 | 用途 | 核心欄位 |
|------------|------|----------|
| `replenishment_run` | 日終回填主檔 | `id`, `business_date`, `performed_by`, `performed_at`, `status` |
| `replenishment_line` | 回填明細，記錄回填到哪個桶 | `id`, `run_id`, `bucket_type`, `item_sku`, `item_name`, `qty`, `uom` |

### D. 盤點與差異調整

| 候選資料表 | 用途 | 核心欄位 |
|------------|------|----------|
| `inventory_count_session` | 盤點作業單頭 | `id`, `count_scope`, `started_at`, `completed_at`, `performed_by`, `completed_by_principal_id`, `completion_approval_status`, `completion_approver_principal_id`, `completion_single_person_override`, `status` |
| `inventory_count_line` | 盤點明細 | `id`, `session_id`, `bucket_type`, `item_sku`, `before_qty`, `counted_qty`, `variance_pct`, `note` |
| `inventory_adjustment_event` | 盤點差異或手工調整事件 | `id`, `source_session_id`, `bucket_type`, `item_sku`, `qty_delta`, `reason`, `performed_by`, `approval_status`, `approver_principal_id`, `single_person_override`, `performed_at` |
| `inventory_reminder_state` | 盤點提醒狀態 | `id`, `scope`, `last_counted_at`, `next_reminder_after` |

### E. 共用事件台帳

| 候選資料表 | 用途 | 核心欄位 |
|------------|------|----------|
| `inventory_event_ledger` | 對所有扣帳 / 回填 / 回沖 / 盤點調整保留單一追溯鏈 | `id`, `event_type`, `bucket_type`, `item_sku`, `qty_delta`, `source_type`, `source_id`, `performed_by`, `performed_at` |

## Prisma schema 候選

以下不是最終 schema，而是提供後續 Prisma / migration 設計時可直接評估的候選模型與關聯方向。

### 1. Daily demand 與扣帳

```prisma
model DailyDemandBatch {
  id             String               @id @default(cuid())
  batchNo        String               @unique
  businessDate   DateTime
  sourceType     String
  status         String
  importedAt     DateTime
  importedById   String
  lines          DailyDemandLine[]
  deductionRuns  InventoryDeductionRun[]
  createdAt      DateTime             @default(now())
  updatedAt      DateTime             @updatedAt
}

model DailyDemandLine {
  id             String   @id @default(cuid())
  batchId        String
  channel        String
  sellableSku    String
  sellableName   String
  spec           String?
  quantity       Decimal
  shipDate       DateTime?
  rawSourceRef   String?
  batch          DailyDemandBatch @relation(fields: [batchId], references: [id])
}

model InventoryDeductionRun {
  id             String                   @id @default(cuid())
  batchId        String
  status         String
  warningCount   Int                      @default(0)
  executedAt     DateTime
  executedById   String
  lines          InventoryDeductionLine[]
  batch          DailyDemandBatch         @relation(fields: [batchId], references: [id])
}

model InventoryDeductionLine {
  id                 String   @id @default(cuid())
  runId              String
  bucketType         String
  itemType           String
  itemSku            String
  quantity           Decimal
  fallbackFromBucket String?
  warningCode        String?
  run                InventoryDeductionRun @relation(fields: [runId], references: [id])
}
```

### 2. 排工與 BOM 保留

```prisma
model ProductionPlanHeader {
  id               String                @id @default(cuid())
  planDate         DateTime
  status           String
  createdById      String
  revisedFromId    String?
  lines            ProductionPlanLine[]
  bomRuns          BomReservationRun[]
  createdAt        DateTime              @default(now())
  updatedAt        DateTime              @updatedAt
}

model ProductionPlanLine {
  id               String   @id @default(cuid())
  planId           String
  planLevel        String
  targetSku        String
  targetName       String
  plannedQty       Decimal
  uom              String
  plan             ProductionPlanHeader @relation(fields: [planId], references: [id])
}

model BomReservationRun {
  id               String               @id @default(cuid())
  planId           String
  triggerType      String
  executedAt       DateTime
  executedById     String
  reversedRunId    String?
  lines            BomReservationLine[]
  plan             ProductionPlanHeader @relation(fields: [planId], references: [id])
}

model BomReservationLine {
  id               String   @id @default(cuid())
  runId            String
  materialType     String
  materialSku      String
  materialName     String
  qtyDelta         Decimal
  uom              String
  run              BomReservationRun @relation(fields: [runId], references: [id])
}
```

### 3. 日終回填與盤點

```prisma
model ReplenishmentRun {
  id               String              @id @default(cuid())
  businessDate     DateTime
  status           String
  performedById    String
  performedAt      DateTime
  lines            ReplenishmentLine[]
}

model ReplenishmentLine {
  id               String   @id @default(cuid())
  runId            String
  bucketType       String
  itemSku          String
  itemName         String
  qty              Decimal
  uom              String
  run              ReplenishmentRun @relation(fields: [runId], references: [id])
}

model InventoryCountSession {
  id               String               @id @default(cuid())
  countScope       String
  status           String
  performedById    String
  startedAt        DateTime
  completedAt      DateTime?
  lines            InventoryCountLine[]
}

model InventoryCountLine {
  id               String   @id @default(cuid())
  sessionId        String
  bucketType       String
  itemSku          String
  beforeQty        Decimal
  countedQty       Decimal
  variancePct      Decimal?
  note             String?
  session          InventoryCountSession @relation(fields: [sessionId], references: [id])
}

model InventoryAdjustmentEvent {
  id               String   @id @default(cuid())
  sourceSessionId  String?
  bucketType       String
  itemSku          String
  qtyDelta         Decimal
  reason           String?
  performedById    String
  performedAt      DateTime
}

model InventoryEventLedger {
  id               String   @id @default(cuid())
  eventType        String
  bucketType       String
  itemSku          String
  qtyDelta         Decimal
  sourceType       String
  sourceId         String
  performedById    String
  performedAt      DateTime
}
```

### 4. schema 設計注意事項

- `itemSku`、`targetSku`、`materialSku` 先以 shared key 串接，不直接複製主資料表欄位當外鍵 owner。
- `bucketType` 應明確列舉至少：`sellable`, `inner_pack_finished`, `packaging_material`, `shipping_supply_manual`。
- `status` 先保留 string + enum 對照策略，待正式 state machine 收斂後再鎖定 enum。
- 所有 `performedById` / `importedById` / `executedById` 都應對接同一個 Portal principal contract；inventory-count 與 production-planning 均已落 `singlePersonOverride` 與 approver 欄位，後續擴充不得再分裂成平行 actor / approval 模型。
- 若 approver 當下帶有多個 `roleCodes`，audit 應保留完整角色快照；但是否有權核准，仍應依該動作要求的正式業務角色判定。

## NestJS module 邊界候選

### A. DailyOpsModule

責任：

- 匯入當日需求
- 觸發正式扣帳
- 提供 demand batch / deduction run 查詢

建議組件：

- `DailyOpsController`
- `DemandBatchService`
- `InventoryDeductionService`
- `DailyOpsQueryService`

### B. ProductionPlanningModule

責任：

- 建立隔日排工
- 修改排工
- 觸發 BOM 回沖 / 重算

建議組件：

- `ProductionPlanController`
- `ProductionPlanService`
- `BomReservationService`

### C. ReplenishmentModule

責任：

- 建立日終回填批次
- 驗證回填桶別
- 寫入回填事件

建議組件：

- `ReplenishmentController`
- `ReplenishmentService`
- `ReplenishmentValidator`

### D. InventoryCountModule

責任：

- 建立盤點作業
- 完成盤點與差異調整
- 提供負庫存與盤點提醒

建議組件：

- `InventoryCountController`
- `InventoryCountService`
- `InventoryAdjustmentService`
- `InventoryAlertService`

### E. Shared dependency 邊界

- `MasterDataModule`：提供 sellable / inner-pack / 包材耗材主資料查詢，不接受 DailyOps 直接寫入主資料。
- `InventoryModule`：提供正式庫存台帳與事件寫入能力；DailyOps / Replenishment / Count 模組透過受控 service 寫入，不直接共享 repository。
- `OrderFulfillmentModule`：提供訂單與撿貨單正式需求來源；DailyOps 只消費正式需求，不回寫其私有狀態。
- `PortalIdentityAuditModule`：提供操作者身分、角色與 audit event 寫入。

### F. 模組落地原則

- 不另外創造 `PackagingModule` 當平行流程 owner；包裝 / 回填應由 `Order / Fulfillment` 與 `Inventory` 邊界協作，或作為 `DailyOps` 的應用層編排。
- `DailyOpsModule` 是流程 orchestration，不應直接擁有 Inventory / Master Data 的資料 owner。
- 若後續 Prisma schema 落地於同一資料庫，仍必須透過 module service 維持 owner 邊界。

## API / Command surface 候選

### 日常需求匯入

- `POST /api/daily-ops/demand-batches`
  - 建立當日匯入批次並上傳來源資料
- `POST /api/daily-ops/demand-batches/{batchId}/confirm`
  - 確認批次並執行正式扣帳
- `GET /api/daily-ops/demand-batches/{batchId}`
  - 查看匯入結果、警告與扣帳摘要

### 排工與 BOM

- `POST /api/daily-ops/production-plans`
  - 建立隔日排工單
- `PATCH /api/daily-ops/production-plans/{planId}`
  - 修改排工數量；需同時觸發 BOM 回沖 / 重算
- `POST /api/daily-ops/production-plans/{planId}/reserve-bom`
  - 手動重跑 BOM 扣帳

### 日終回填

- `POST /api/daily-ops/replenishments`
  - 建立日終回填批次
- `POST /api/daily-ops/replenishments/{runId}/commit`
  - 正式寫入回填結果

### 盤點與調整

- `POST /api/inventory-counts`
  - 建立盤點作業
- `POST /api/inventory-counts/{sessionId}/complete`
  - 完成盤點並產生調整事件
- `POST /api/inventory-adjustments`
  - 建立非盤點來源的手工調整事件
- `GET /api/inventory-alerts/negative-stock`
  - 取得負庫存警示清單
- `GET /api/inventory-alerts/count-reminder`
  - 取得超過一個月未盤點的提醒

## 狀態事件候選

### 需求匯入與扣帳

- `DailyDemandBatchCreated`
- `DailyDemandImported`
- `DailyDemandConfirmed`
- `InventoryDeductionExecuted`
- `InventoryDeductionFallbackApplied`
- `NegativeInventoryFlagged`

### 排工與 BOM

- `ProductionPlanCreated`
- `ProductionPlanRevised`
- `BomReservationExecuted`
- `BomReservationReversed`

### 日終回填

- `ReplenishmentRunCreated`
- `InventoryReplenishedToInnerPack`
- `InventoryReplenishedToSellable`

### 盤點與差異調整

- `InventoryCountStarted`
- `InventoryCountCompleted`
- `InventoryAdjusted`
- `InventoryCountReminderRaised`

## 三張表交叉檢查結論

### 已確認不重複的部分

- 塔類 / 雪花餅 / 鳳梨酥的膠捲耗材規則只在 `內包裝耗材用量對照表`。
- 奶油曲奇 / 西點餅乾 / 杏仁瓦片單片袋耗材只在 `內包裝耗材用量對照表`。
- sellable 的 `PK0016`、`PK0014` 等外包裝材料仍由 `銷售商品組成對照表` owner。
- `Q1-Q5`、`G1-G5`、`C1-C7` 的整包 / 秤重主體轉換關係由 `生產_分裝_轉換扣帳規則表` owner。

### 目前刻意留白的部分

- `K1001-K4001` 濾掛咖啡單包不另建內包裝耗材規則。
- 50g 牛奶糖屬 sellable 直接包裝，不進內包裝耗材表。

## 實作注意事項

### 1. 不可只存最終數量

- 需求匯入、正式扣帳、回沖、回填、盤點調整都必須留事件。

### 2. 要支援現況 SOP

- 目前四角色 `生產 / 包裝 / 會計 / 主管` 都可操作大多數日常作業。
- 只有日終回填目前限定由 `包裝` 執行。

### 3. 要保留未來治理擴充點

- 即使現況大多數流程不覆核，資料模型與事件仍應保留日後加入 maker-checker 的欄位與擴充點。
- 若已落正式 principal contract，就不得在新切片回退到 request body actor 或自由文字 `performedBy` 作為正式身份來源。

## 非目標

- 本文件不定義最終資料表 schema 欄位型別。
- 本文件不定義最終 REST response contract。
- 本文件不取代 domain model、migration 設計或 API contract 正文。

## 關聯文件

- `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`
- `doc/architecture/flows/end_of_day_replenishment_spec.md`
- `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`
- `doc/architecture/roles/README.md`