# Post-Launch Operator Runbook

本文件承接 `Idx-024` Slice 2，目的不是發明新的 deploy / rollback 規則，而是把已存在的 hosted preflight、rollback 基線、backup / restore 責任與 health readback 收斂成值班可執行入口。

## 適用範圍

- GitHub-hosted `release-preflight` readback
- staging / production backup 與 restore 責任矩陣
- Phase 1 最小 health / readiness contract
- 事故 escalation 與 rollback 停等點

## 核心原則

- 若環境綁定、backup / restore owner、或 readback evidence 任一缺失，流程必須 fail-closed。
- Phase 1 目前沒有通用 destructive rollback API；runbook 只能指向停止切流、修復、rerun、revision 或重新開窗。
- 不得把 staging ephemeral DB 的 read-only preflight 結果誤判為 production deploy 失敗。

## 1. Hosted Release-Preflight Readback

### 觸發前置

1. staging：確認 target environment 已存在 `DATABASE_URL` 與 `NEXT_PUBLIC_PORTAL_API_BASE_URL` binding。
2. production：確認 target environment 已存在 `DATABASE_URL`、`ADMIN_DATABASE_URL` 與 `NEXT_PUBLIC_PORTAL_API_BASE_URL` binding。
3. 確認本次 release 需要 read-only migration preflight，而不是直接做 destructive deploy。
4. 若 target 為 production，先確認 backup / restore matrix 對應欄位都已填滿；缺任何一欄即停止。

### 執行入口

- GitHub Actions workflow: `.github/workflows/ci.yml` 的 `release-preflight`
- workflow 會先驗證 environment bindings，再執行 `npm run preflight:formal-env`
- 產出 artifact：`migration-preflight-{target_environment}`

### Readback 步驟

1. 確認 workflow job 成功。
2. 下載 `migration-preflight-{target_environment}` artifact。
3. 檢查 JSON report 的以下欄位：
   - `status`
   - `target`
   - `expectedMigrationCount`
   - `appliedMigrationCount`
   - `deploymentNeeded`
   - `pendingRepoMigrations`
   - `unexpectedDatabaseMigrations`
   - `failedMigrations`
4. 若任一 fail-closed 欄位非空，停止 release，回到 migration governance。

### Staging 判讀規則

| 條件 | 判讀 |
|---|---|
| `status=pass` 且 `appliedMigrationCount=0`、`deploymentNeeded=true` | 目前 staging binding 指向 ephemeral service DB，可作為 drift/read-only evidence，不代表 deploy 失敗 |
| artifact 存在但 target 與預期環境不一致 | 視為 runbook 操作錯誤，必須重跑 |
| workflow 成功但 artifact 缺失 | 視為 CI artifact contract 失敗，先修 workflow，不得口頭放行 |

### Production 判讀規則

| 條件 | 處置 |
|---|---|
| `status=pass` 且無 pending/unexpected/failed migrations | 可進入下一個 release gate |
| `deploymentNeeded=true` 且 repo migrations 與 DB history 不一致 | 停在 preflight，修正 migration path 後重跑 |
| bindings 缺失 | 停止 release，先補 environment contract |

## 2. Backup / Restore Responsibility Matrix

> 目前 repo 內沒有 production backup tool 實作。本矩陣的目的是 fail-closed 地標出 release 前必填責任，而不是假裝 restore 已經自動化。

| 環境 | 資料範圍 | 主要 owner | 執行工具 / 載體 | Release 前必備證據 | 缺失時處置 |
|---|---|---|---|---|---|
| Local / scratch DB | replay drill 臨時 DB | Engineer | `npm run drill:migration-replay` + PostgreSQL scratch DB | 最新 drill report、step status 全 PASS | 不得當作 production restore 證據 |
| Staging | environment-bound testing DB | Release operator + Backend owner | GitHub-hosted `release-preflight` artifact、必要時 staging clone | 最新 artifact readback、目標環境 bindings | 缺 binding 或 artifact 即停止 staging promotion |
| Production | 主庫、`_prisma_migrations`、審計與庫存台帳 | DBA / Platform owner + Backend owner + Release owner | 外部 backup / PITR 工具，repo 只保留 readback 記錄 | 備份時間點、restore 聯絡窗口、RTO/RPO、最近一次 restore rehearsal 編號與證據位置 | 任一欄位缺失即不得進 production release |

### Production 必填欄位

在 production go-live 或正式 release 前，至少補齊以下欄位到 release pack / 值班單：

- backup 工具名稱與入口
- 最近一次成功備份時間點
- restore 責任人與替補
- 預估 RTO / RPO
- 最近一次 restore rehearsal 證據位置

若以上任一欄位缺失，本 runbook 視為未完成，不得進 production cutover。

截至 `Idx-024` 收口時，production backup / restore 的具體工具與 rehearsal evidence 仍未回填到 repo authority。這代表本 runbook 目前只定義 fail-closed 欄位與責任，不代表 production restore capability 已完成演練或可直接 sign-off。

正式回填入口請使用 `doc/architecture/flows/production_backup_restore_signoff_checklist.md`。在該 checklist 仍有 `pending` 前，不得把 `Idx-024` 視為完成。

## 3. Health / Readiness Contract

> 目前 repo 內沒有正式 `/healthz` 或 `/readyz` endpoint，因此 Phase 1 不可假裝有 HTTP health probe。readiness 必須以 build、startup 與 smoke readback 共同成立。

| 層級 | 最小 readback | 成功條件 | 失敗時處置 |
|---|---|---|---|
| GitHub-hosted Postgres service | GitHub Actions service health (`pg_isready`) | workflow service health passes | 停止 workflow，先修 runner / service DB |
| API runtime | `npm run build:api`、Nest startup log、targeted smoke | API build 成功、server 可啟動、smoke 通過 | 停在 release gate，不得以 portal-only readback 取代 |
| Portal runtime | `npm run build:portal` | build 成功，`NEXT_PUBLIC_PORTAL_API_BASE_URL` 綁定存在 | 缺 binding 或 build fail 即停止 |
| Daily Ops critical path | `inventory-opening-balance-api-smoke`、`daily-ops-mainline-e2e-smoke`、`production-plan-rerun-regression-smoke` | 至少一組與本次變更相關的 targeted smoke PASS | 回到對應 runtime owner 修復 |
| Intake critical path | `intake-api-smoke`、`intake-mapping-api-smoke` | parse / exception / confirm gating 正常 | 停在 intake manual window，不得放行未解例外 |

## 4. Escalation / Rollback Decision Tree

| 症狀 | 第一責任角色 | 第二責任角色 | 正式處置 | 禁止事項 |
|---|---|---|---|---|
| `release-preflight` binding 缺失 | Release operator | Backend owner | 補 environment bindings，重跑 preflight | 不得手動略過 binding check |
| migration preflight 有 pending / unexpected / failed migration | Backend owner | DBA / Platform owner | 停在 preflight，回到 migration governance 修復 | 不得改走 `db push` |
| seed / bootstrap 失敗 | Backend owner | Domain owner | 修正 owner version / seed path 後重跑 | 不得跳過 `AuditLog` |
| opening balance 窗口衝突或未完成 | Inventory owner / Supervisor | Domain owner | cancel window、保留原因、重新開窗 | 不得把未完成 session 視為有效 opening balance |
| intake 出現未映射 / 開放例外 | Intake operator | Master data owner / Domain owner | 停在 exception queue，先 resolve，再 confirm | 不得口頭允許 confirm |
| production plan rerun / revision 異常 | Production owner | Supervisor / Backend owner | 依 revision / rerun matrix 處理並保留 audit | 不得直接改寫 ledger |

## 5. Slice 2 Completion Readback

Slice 2 可以視為完成，至少需滿足：

1. `release-preflight` 的 hosted readback 路徑、artifact 名稱與 staging 特例已寫清楚。
2. backup / restore matrix 已明確標示 production 仍需外部 owner input，且缺值時 fail-closed。
3. health / readiness contract 已誠實註記目前沒有 `/healthz` endpoint。
4. escalation / rollback tree 已對齊既有 rollback policy，而非新建第二套規則。
