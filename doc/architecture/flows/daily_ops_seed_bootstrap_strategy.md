# 日常營運 MVP Seed 與 Bootstrap 策略

更新日期：2026-04-03

Authoritative source：否（implementation rollout strategy）

## 目的

本文件定義日常營運 MVP 在第一階段上線前，資料庫初始化與最小 bootstrap 的策略。

## 核心原則

- 目前商品、內包裝、包材、組成規則、內包裝耗材規則、轉換規則，仍以 chat 側 CSV 工作載體為正式 owner 來源。
- 因此第一階段 `prisma seed` 不做主資料複製，不產生平行 master data table。
- 真正的開帳庫存不可用假資料 seed；必須透過第一次正式盤點作業匯入或建立 `InventoryCountSession` 後形成 opening balance。
- 真正的需求起點不可用假訂單 seed；必須從第一個正式 `DailyDemandBatch` 開始。

## 環境 preflight checklist

在執行 deploy / bootstrap / opening balance / first batch 前，至少確認以下項目：

1. `DATABASE_URL` 已指向目標環境，且操作者能以最小必要權限連線。
2. `apps/api/prisma/migrations/**` 與目標環境 migration history 一致，不存在未受控的空 migration 或手動熱修補未回掛情況。
3. `npm run prisma:migrate:deploy` 與 `npm run prisma:seed` 的執行責任人、停等點與失敗回報窗口已指定。
4. opening balance 使用的 SKU / bucket 範圍、營運窗口與盤點責任角色已先確認，不允許邊首盤邊改 owner 主資料。
5. 第一個 `DailyDemandBatch` 的來源檔、渠道映射與 CSV owner 版本已確認，避免首批營運直接踩到未確認的 mapping 差異。

### preflight 成功判定

- `npm run preflight:migration` 回傳 `pass`，或等價 read-only migration preflight 通過。
- bootstrap 使用的 CSV owner 檔名、版本與 hash 已可追溯。
- 首盤窗口與第一批需求導入窗口已被明確排定，且責任角色已知。

### preflight 失敗補救

- 若 `DATABASE_URL`、migration history 或目標環境連線條件不明，不得進入 deploy。
- 若 CSV owner 版本或渠道映射存在未決差異，先停在 preflight，不得以口頭確認取代正式追溯。

## 最小可執行步驟

### 1. 套用 migration

- 執行 `npm run prisma:migrate:deploy`

#### Readback & Evidence Commands

```bash
cd /workspaces/Ivyhouse_op_system/apps/api
DATABASE_URL='<target-database-url>' MIGRATION_PREFLIGHT_TARGET='<target-environment>' npm run preflight:migration

DATABASE_URL='<target-database-url>' npm run prisma:migrate:deploy

psql '<target-database-url>' -c "SELECT migration_name, finished_at FROM \"_prisma_migrations\" ORDER BY finished_at DESC LIMIT 5;"
```

#### 成功判定

- 目標環境 migration 全數套用完成，且不存在 `P3015` 之類的 migration 缺檔或 history 斷鏈錯誤。
- `_prisma_migrations` 可讀到最新 migration history，且最後一筆 `finished_at` 非空。

#### 失敗補救

- 若 migration 失敗發生在 service 尚未正式切流前，先停止部署並修復 migration path，不得跳過 migration 直接以 `db push` 代替。
- 若 migration 失敗原因與正式環境 history 差異有關，應回到 `Idx-019` 的 governance / replay 流程處理，不得在 runbook 中假裝已可安全繼續。
- 若 read-only preflight 已顯示 repo migration 缺口、未回掛 hotfix 或 extension 異常，先停在 preflight，不得直接進入 `migrate deploy`。

### 2. 執行 bootstrap seed

- 執行 `npm run prisma:seed`
- seed 只會寫入一筆 `AuditLog`，記錄：
  - bootstrap 版本
  - 目前引用的 CSV owner 檔名
  - 各檔案 hash 與大小

#### Readback & Evidence Commands

```bash
cd /workspaces/Ivyhouse_op_system/apps/api
DATABASE_URL='<target-database-url>' npm run prisma:seed

psql '<target-database-url>' -c "SELECT action, payload, \"createdAt\" FROM \"AuditLog\" ORDER BY \"createdAt\" DESC LIMIT 1;"
```

#### 成功判定

- `AuditLog` 已留下 bootstrap 版本、引用檔名、hash 與大小。
- 最新 `AuditLog` 可讀回 bootstrap action 與對應 payload。

#### 失敗補救

- 若 seed 未能留下對應 `AuditLog`，不得進入 opening balance。
- 若 seed 使用的 owner 檔名與 preflight 不一致，需先停等並重新確認引用版本。

### 3. 建立 opening balance

- 以第一次正式全盤或範圍盤點建立 `InventoryCountSession`
- 完成盤點後由 `InventoryAdjustmentEvent` 與 `InventoryEventLedger` 形成 opening balance

### opening balance runbook

#### 前置條件

- `npm run prisma:migrate:deploy` 已在目標環境成功執行。
- 首盤使用的 SKU / bucket 範圍已與當日營運窗口對齊，不允許邊盤邊改 owner 主資料。
- 執行角色至少包含盤點操作人與可追溯的覆核角色；若需例外調整，必須保留原因。

#### 執行步驟

1. 鎖定首盤窗口，確認首盤期間不再插入歷史假庫存。
2. 建立第一個正式 `InventoryCountSession`，`beforeQty` 以 0 或明確可追溯的暫時基線輸入。
3. 完成 `InventoryCountSession` 後，確認系統自動產生對應 `InventoryAdjustmentEvent` 與 `InventoryEventLedger`。
4. 以同一批 SKU 抽樣建立第二次盤點，確認後續盤點已改用首盤完成後的帳面數量，而不是再次視為 bootstrap。

#### Readback & Evidence Commands

```bash
cd /workspaces/Ivyhouse_op_system/apps/api
DATABASE_URL='<target-database-url>' npm run build && node test/inventory-opening-balance-api-smoke.js

psql '<target-database-url>' -c "SELECT \"eventType\", \"bucketType\", \"itemSku\", \"qtyDelta\", \"performedAt\" FROM \"InventoryEventLedger\" WHERE \"eventType\" = 'COUNT_ADJUSTMENT' ORDER BY \"performedAt\" DESC LIMIT 5;"

psql '<target-database-url>' -c "SELECT \"countScope\", status, \"startedAt\", \"completedAt\" FROM \"InventoryCountSession\" ORDER BY \"startedAt\" DESC LIMIT 5;"
```

#### 首盤窗口鎖定

- Phase 1 目前只有單一倉別；因此 opening balance 一律採單倉單窗口治理，不允許不同 `countScope` 平行首盤。
- 同一倉的 `SELLABLE / INNER_PACK_FINISHED / PACKAGING_MATERIAL / SHIPPING_SUPPLY / FULL_WAREHOUSE` 必須在同一營運窗口內依序完成，不得分散成平行首盤。
- 同一 `countScope` 在尚未出現第一筆 `COMPLETED` session 前，只允許存在一筆 `IN_PROGRESS` session。
- 若首盤 session 尚未完成，再次建立相同 `countScope` 的 session 應直接拒絕，避免首盤基線並發建立。
- 若已有其他 `countScope` 的 `IN_PROGRESS` session，亦應拒絕建立新 session，避免單倉首盤窗口分裂。
- 首盤完成後，後續同一 `countScope` 仍不得同時存在多筆 `IN_PROGRESS` session；需先完成現有 session 才能開下一筆。

#### 首盤中斷與取消

- Phase 1 首盤一律不支援 resume；若首盤中斷，必須走 `cancel -> 重新建立新 session`。
- cancel 只能由 `主管` 執行，且必須提供取消原因；取消後不得留下待補正暫存狀態。
- cancel 後原窗口必須由同一營運窗口重新建立新 session，不得把已取消 session 視為有效 opening balance。
- 已取消 session 不得產生 `InventoryAdjustmentEvent` 或 `InventoryEventLedger`。

#### 首盤期間的營運流量

- 首盤期間禁止插入實際營運流量，例如訂單匯入、補貨 commit、production planning、正式扣帳等。
- 若首盤期間仍發生實際營運流量，視為首盤窗口失敗，必須停在人工處理窗口，取消當前 session 並重新安排首盤，不得以事後補算直接視為成功。

#### 成功判定

- 第一個正式盤點完成後，可在 `InventoryEventLedger` 看到對應 `COUNT_ADJUSTMENT` 事件。
- 第二次盤點的 `beforeQty` 已能對應首盤完成後的帳面基線。
- 首盤與後續日常盤點可在 history / summary 中被區分與追溯。
- `inventory_count_session` 可讀回至少一筆 `COMPLETED` 首盤 session，且 ledger 與 session 時序一致。

#### 失敗補救

- 若首盤 session 建立後未完成，不得直接把未完成資料視為 opening balance；應取消該窗口並重新建立 session。
- 若首盤 session 因人員、系統或營運流量中斷，必須由 `主管` 取消並重建，不支援 resume。
- 若首盤完成後發現數量錯誤，必須以新的盤點 session 或具理由的調整事件補正，不得直接改寫既有 ledger。
- 若首盤期間仍發生實際營運流量，需在 log 記錄鎖窗失敗原因，並重新安排首盤窗口。
- 若 readback 查不到 `COUNT_ADJUSTMENT` 事件或 session / ledger 時序不一致，視為 rehearsal 失敗，不得繼續 first batch。

### 4. 建立第一個正式需求批次

#### 執行步驟

1. 匯入第一個正式 `DailyDemandBatch`。
2. 確認 demand import 與 mapping 結果可追溯，且未映射例外已被明確攔下，而非靜默忽略。
3. 執行第一輪正式扣帳與 production planning 主線。
4. 抽樣確認 audit action chain 與 inventory ledger event chain 已成立。

#### Readback & Evidence Commands

```bash
cd /workspaces/Ivyhouse_op_system/apps/api
DATABASE_URL='<target-database-url>' npm run test:daily-ops:mainline
```

必要時可輔以 DB readback 檢查主線事件：

```bash
psql '<target-database-url>' -c "SELECT action, \"createdAt\" FROM \"AuditLog\" ORDER BY \"createdAt\" DESC LIMIT 20;"

psql '<target-database-url>' -c "SELECT \"eventType\", \"sourceType\", \"sourceId\", \"performedAt\" FROM \"InventoryEventLedger\" ORDER BY \"performedAt\" DESC LIMIT 20;"
```

#### 成功判定

- 第一個 `DailyDemandBatch` 已建立，並能串到 demand -> deduction -> production plan -> replenishment -> inventory count -> adjustment -> audit 主線。
- 至少可追溯 `daily-demand-batch.created -> confirmed -> production-plan.created -> replenishment-run.created -> committed -> inventory-count.started -> completed` action chain。
- inventory ledger 至少可看到 `DEDUCTION`、`BOM_RESERVATION`、`REPLENISHMENT`、`COUNT_ADJUSTMENT` 事件。
- `npm run test:daily-ops:mainline` 可在目標資料庫條件下回傳 `PASS`。

#### 失敗補救

- 若第一個正式批次無法完成 mapping 或扣帳主線，不得直接進入日常營運；應先保留批次證據並停在人工處理窗口。
- 若 mainline event chain 缺節點，需先確認是 runbook 漏步、runtime 缺口，還是權限 / mapping 問題，再決定回退或補救。

### 5. 開始正式營運

- 匯入第一個 `DailyDemandBatch`
- 建立第一個 `ProductionPlanHeader`
- 執行 `ReplenishmentRun`、`InventoryCountSession`

## rollback runbook

### 核心原則

- Phase 1 目前沒有萬用的一鍵 rollback；必須依失敗節點決定回退方式。
- 不得在沒有正式 rollback API 的情況下，對外宣稱 runtime rollback 已 ready。
- 若屬資料層或流程層失敗，應優先保留證據、停止切流，再選擇 revision、rerun、重建測試環境或重新開窗。

### rollback matrix

| 失敗節點 | 可否繼續 | 主要處置 | 不可做的事 |
|----------|----------|----------|------------|
| migration 失敗，服務未切流 | 否 | 停止部署、修復 migration path、重跑 deploy | 不得改走 `db push` 假裝 release-safe |
| bootstrap seed 失敗 | 否 | 修正 seed / owner 版本後重跑 seed | 不得跳過 `AuditLog` 直接進 opening balance |
| opening balance 未完成或窗口衝突 | 否 | 取消窗口、保留失敗原因、重新安排首盤 | 不得把未完成 session 視為有效 opening balance |
| first batch mapping / mainline 失敗 | 視情況 | 停在人工處理窗口、保留批次證據、修正 mapping / 權限 / runtime 後重跑 | 不得靜默刪除未映射例外或直接人工改寫 ledger |
| production plan / BOM 需局部回退 | 有條件 | 以受控 revision / rerun 處理，並保留 audit 線索 | 不得宣稱已有完整 rollback API |

### rollback 成功判定

- 失敗節點、補救步驟與重新啟動條件均已被記錄。
- 沒有未經審計的資料改寫或假裝完成的切流。
- 後續操作者可根據 log 判讀目前是 blocked、需 rerun，還是可重新開窗。

## staging clone / scratch DB drill

- 若需要在 go-live 前做 non-destructive rollback drill，應優先使用 staging clone 或 DBA 核准的 scratch DB server。
- repo-native 入口為：`DATABASE_URL='<source-db>' ADMIN_DATABASE_URL='<admin-db>' npm run drill:migration-replay`
- 若 drill target 明確標記為 production，必須另外設定 `ALLOW_PRODUCTION_REPLAY_DRILL=true`；否則腳本會 fail-closed。
- 此 drill 會建立臨時資料庫、重播 `migrate deploy`、`seed`、preflight 與 smoke；不應直接對 production 主庫執行。
- 若 drill 失敗，應以 `steps[*].label` 對應失敗節點，回到 rollback matrix 做停等與補救，不得直接切流。

## rehearsal checklist

在 `Idx-017` 正式宣稱完成前，至少完成一次下列 rehearsal：

1. 乾淨測試 DB 上執行 `npm run prisma:migrate:deploy`。
2. 同一 DB 上執行 `npm run prisma:seed`，並 readback 最新 bootstrap `audit_log`。
3. 執行 opening balance rehearsal，並 readback `inventory_count_session` 與 `inventory_event_ledger`。
4. 執行 mainline E2E smoke，確認 audit action chain 與 inventory ledger event chain 成立。
5. 若任一步驟失敗，需把失敗節點、readback 結果與補救決策回寫 `Idx-017` log，不得只留下 terminal 成敗。

## 目前限制

- 這份 seed 不會把 CSV 主資料匯入資料庫；因為正式主資料 schema 與 approval 流程尚未完成。
- 這份 seed 不會建立假使用者、假訂單、假庫存。
- 若要進入更完整 ERP 階段，後續仍需把 master data / recipe version 正式升格為 schema owner，而不是長期停留在 CSV runtime reference。

## 首盤 rehearsal evidence 要求

- 至少一次在乾淨測試 DB 上重現「第一次盤點建立 opening balance、第二次盤點進入常態差異」的 executable smoke。
- rehearsal evidence 至少要包含：建立 session、完成 session、ledger 寫入、history / summary 驗證。
- rehearsal 不得依賴預先灌入假庫存；只能依賴 migration、正式主檔 reference 與盤點 API。