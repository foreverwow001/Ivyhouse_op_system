# Post-Launch 操作手冊（繁中）

本手冊承接 `Idx-024` Slice 3，只整理已凍結流程的操作與 readback，不描述尚未正式承諾的未來功能。

## 適用對象

- Intake operator
- Daily Ops operator
- Supervisor / 值班 lead
- Release operator

## 1. Intake Workbench

### 入口與目的

- Portal 入口：`/intake`
- 主要用途：建立 intake batch、上傳來源檔、觸發解析、檢視 parsed lines / mapping / exceptions，最後才做 confirm

### 標準操作順序

1. 建立 Intake Batch
2. 上傳來源檔
3. 執行 parse
4. 讀取 batch 摘要、parsed lines、mapping results、exceptions
5. 若 `Unmapped`、`Pending Review` 或 `Exceptions` 不為 0，先停在 review / exception queue
6. 所有 open exceptions 關閉後，才可 confirm batch

### Batch 建立欄位

| 欄位 | 說明 |
|---|---|
| `Intake Target` | `FORMAL_DEMAND` 或 `PEAK_PLANNING` |
| `Batch Date` | 批次日期 |
| `Primary Channel` | `MOMO`、`SHOPEE`、`ORANGEPOINT`、`OFFICIAL` |
| `Default Demand Date` | 預設需求日期 |
| `Note` | 本批補充說明 |

### Confirm 前判讀

| 狀態 / 指標 | 處置 |
|---|---|
| `status=例外處理中` | 不可 confirm；先處理 exception |
| `unmappedCount > 0` | 不可 confirm；先做 mapping review 或建立例外 |
| `pendingReviewCount > 0` | 不可 confirm；先完成人工覆核 |
| confirm 回 `INTAKE_BATCH_HAS_OPEN_EXCEPTIONS` | 正常 fail-closed；代表仍有 open exceptions |

### 常見排故

| 現象 | 先做什麼 | 不可做的事 |
|---|---|---|
| 來源檔上傳成功但 parse 沒有資料 | 回看來源檔、channel code 與 parser warning | 不得手動補資料到正式需求表 |
| 有未映射商品 | 進 exception queue 或補 master data mapping | 不得跳過 exception 直接 confirm |
| 已確認批次無法重複 confirm | 視為正常保護 | 不得試圖把已確認批次回改成草稿 |

## 2. Daily Ops Workbench

### 入口與目的

- Portal 入口：`/daily-ops`
- 主要用途：建立 / confirm demand batch、建立 production plan、做 BOM rerun / approval、建立 inventory count session 與讀取 alerts

### A. 建立 / 確認每日需求

1. 填寫 `Batch No`、`Business Date`、`Source Type`、`Sellable SKU`、`Quantity`
2. 先建立 demand batch
3. 需要扣帳時再按 `Confirm Batch`
4. confirm 後應可在 readback 中看到 demand batch 與 deduction evidence

### B. 排工 / BOM / Approval

1. 建立 production plan
2. 視需要執行 `Rerun BOM`
3. 由合法 approver 執行 `Approval Decision`
4. 若 rerun / approval 被拒絕，先保留 audit 線索，再由 supervisor 判定是否 revision 或重建

### C. 盤點 Session / Alerts

1. 建立 count session
2. 檢查 `Count Scope`、`Bucket Type`、`Item SKU`、`Counted Qty`
3. 完成盤點時按 `Complete Session`
4. 中斷或窗口衝突時按 `Cancel Session`
5. 用 `Refresh Alerts` 讀取 negative stock / count reminder

### Daily Ops 常見排故

| 現象 | 先做什麼 | 不可做的事 |
|---|---|---|
| opening balance / count session 窗口衝突 | 取消當前窗口、重新安排 session | 不得把未完成 session 視為有效盤點 |
| production rerun 被拒絕 | 依 revision / rerun 流程重跑 | 不得直接改 ledger |
| manual adjustment 被拒絕 | 補 `reason` 或確認角色邊界 | 不得繞過 maker-checker |
| negative stock alert 持續存在 | 回看最新 count / replenishment / adjustment evidence | 不得靜默清除 alert |

## 3. Release-Preflight Readback

### 誰來做

- Release operator 主責
- Backend owner 與 DBA / Platform owner 提供判讀支援

### 怎麼看

1. 在 GitHub Actions 觸發 `release-preflight`
2. 確認 target environment bindings 存在
3. 下載 `migration-preflight-{target_environment}` artifact
4. 讀 `status`、`pendingRepoMigrations`、`unexpectedDatabaseMigrations`、`failedMigrations`
5. staging 若出現 `appliedMigrationCount=0` 且 `deploymentNeeded=true`，先依 runbook 判定是否屬 ephemeral DB 特例

### 什麼情況必須停

- 缺 environment bindings
- artifact 缺失
- migration report 出現 pending / unexpected / failed migrations
- production backup / restore 必填欄位未補齊

## 4. Rollback / 停等指引

### 核心原則

- Phase 1 沒有一鍵 rollback API
- 先保留證據，再決定 rerun、revision、重新開窗或停止部署

### 快速判斷

| 節點 | 正式處置 |
|---|---|
| migration 失敗 | 停止部署，修正 migration path，重跑 preflight / replay |
| seed 失敗 | 修正 owner version / seed path，重跑 seed |
| opening balance 失敗 | cancel window，保留原因，重新開窗 |
| intake unresolved exception | 停在 exception queue，resolve 後再 confirm |
| production rerun / revision 異常 | 由 supervisor 依 audit 決定 rerun 或 revision |

## 5. 值班交接最小清單

每次交接至少留下以下資訊：

1. 當前 active batch / plan / count session ID
2. 是否存在 open exceptions、pending approvals、negative stock alerts
3. 最近一次 `release-preflight` artifact 與判讀結論
4. 若有失敗，記錄停等節點、已做補救與下一步 owner
