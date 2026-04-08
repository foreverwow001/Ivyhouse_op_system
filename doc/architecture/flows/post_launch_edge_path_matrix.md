# Post-Launch 高風險邊界場景矩陣

本文件是 `Idx-024` Slice 1 的正式輸出，用來把 go-live 後最容易造成庫存、審計、權限或 deploy 判讀失真的邊界路徑，收斂成單一權威矩陣。

## 目的

- 明確標示每個 P1 邊界場景的 owner runtime surface
- 對齊 authority 文件、現有 executable evidence 與剩餘 manual drill
- 避免 post-launch 仍以零散 smoke、log 與聊天紀錄追查高風險路徑

## 分類規則

| 分類 | 定義 |
|---|---|
| `Executable smoke` | 可直接在 repo 內重跑的 smoke / regression evidence |
| `Hosted executable + readback` | 需依賴 GitHub-hosted workflow 與 artifact readback 的 evidence |
| `Controlled manual drill` | 目前無法 repo-native 自動化，需保留人工演練與 owner |

## Edge Path Matrix

| 邊界場景 | 主要風險 | Owner runtime surface | Authority / policy | 現有 evidence | 分類 | Slice 1 結論 | 殘餘缺口 |
|---|---|---|---|---|---|---|---|
| Opening balance cancel / guard | 首盤窗口重入、並行開窗、cancel 後殘留 ledger/history | `inventory-count` session 建立、complete、cancel | `doc/architecture/flows/inventory_count_api_contract.md`、`doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md` | `apps/api/test/inventory-opening-balance-api-smoke.js` 驗證首盤窗口鎖、跨窗口互斥、cancel 後 history 為 0、重開後才寫入第一筆 ledger/history | `Executable smoke` | 已有直接可重播證據，足以證明 cancel-only recovery 不會污染庫存台帳 | Slice 2 只需補 operator readback，不需新增 runtime coverage |
| Production planning approve / reject / rerun | unauthorized approver 越權、rejected rerun 仍執行 reservation、revision ledger 污染 | `production-planning` 建立、approval、`reserve-bom` rerun、revision | `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`、`doc/architecture/roles/README.md` | `apps/api/test/production-plan-rerun-regression-smoke.js` 驗證 create / approve / rerun 權限邊界、approved rerun、rejected rerun `executedAt=null`、revision 後 audit / ledger 序列一致 | `Executable smoke` | P1 rerun / reject 路徑已有 executable evidence，可直接作為 release 後回歸基線 | Slice 2 需補 rerun/rollback operator escalation，不需先改測試 |
| Inventory count unauthorized / dual-role boundary | 非授權角色完成盤點或手動調整、缺 reason 仍寫入調整 | `inventory-count` controller、role guard、manual adjustment | `doc/architecture/flows/inventory_count_api_contract.md`、`doc/architecture/roles/README.md` | `apps/api/test/inventory-count-api-smoke.js` 驗證 finance create、admin / production 不可 complete 或手動調整、manual adjustment 缺 `reason` 直接拒絕 | `Executable smoke` | 權限與 maker-checker 邊界已有直接 smoke，足以支撐 post-launch readback | 若 Portal session header contract 改變，需重跑同一 smoke |
| Intake confirm / exception unresolved | 未解例外仍可 confirm，導致未映射需求直接進主流程 | `intake` parse、mapping review、exception resolve、confirm | `doc/architecture/flows/channel_intake_exception_resolution_spec.md`、`doc/architecture/flows/channel_intake_api_contract.md` | `apps/api/test/intake-api-smoke.js` 驗證 fixture parse 後若仍有 open exceptions，`POST /confirm` 必回 `409` 與 `INTAKE_BATCH_HAS_OPEN_EXCEPTIONS`；`apps/api/test/intake-mapping-api-smoke.js` 提供未映射計數基線 | `Executable smoke` | 本輪已補齊缺失的 negative-path smoke，`unresolved confirm` 不再只有文字契約 | Slice 3 再補 Portal workbench 操作手冊，不需先新增 runtime 功能 |
| Ledger / audit consistency under failure | reject / cancel path 寫入多餘 ledger、happy path 與 failure path 證據斷裂 | `inventoryEventLedger`、`auditLog` 與 daily ops 各 workflow | `doc/architecture/flows/unified_status_semantics.md`、`doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md` | `apps/api/test/inventory-opening-balance-api-smoke.js` 證明 cancel 不寫 history；`apps/api/test/production-plan-rerun-regression-smoke.js` 證明 rejected rerun 不執行但保留 audit；`apps/api/test/daily-ops-mainline-e2e-smoke.js` 證明主線 audit / ledger event chain 完整 | `Executable smoke` | 現有證據已覆蓋 failure 不污染 ledger 與 happy-path event chain；Slice 1 不必再發明平行 ledger 驗證面 | 仍缺 dedicated fail-injection suite；列入後續 progressive hardening 候選 |
| Hosted release-preflight readback | artifact 路徑錯誤、ephemeral DB 結果被誤判為 deploy 失敗、staging/prod readback 混淆 | GitHub-hosted `release-preflight`、migration preflight artifact | `doc/architecture/flows/migration_governance_and_deployment_replay.md`、`doc/logs/Idx-023_log.md` | `Idx-023` 已記錄 hosted run `24097414322` PASS、artifact `migration-preflight-staging`、`appliedMigrationCount=0` / `deploymentNeeded=true` 的 staging readback，並保留先前 artifact path fix evidence | `Hosted executable + readback` | Slice 1 已有 hosted baseline，可直接承接 Slice 2 operator guide | production bindings / backup / restore responsibility 仍待 Slice 2 補齊 |

## Slice 1 判定

- 五個指定高風險路徑都已對齊 authority、owner 與 executable evidence。
- `intake unresolved confirm` 是本輪唯一需要補 smoke 的缺口，已補上並通過 focused validation。
- 其餘剩餘項目已收斂為 runbook / readback 類缺口，屬於 Slice 2，不應再擴張成新的 runtime 實作。

## 後續 backlog

| 項目 | 類型 | 建議去向 |
|---|---|---|
| ledger / audit 跨模組 fail-injection suite | progressive hardening | `Idx-025` 或後續 reliability work item |
| rerun / opening balance / preflight operator escalation tree | runbook | `Idx-024` Slice 2 |
| intake / daily ops 中文操作與排故手冊 | manual guide | `Idx-024` Slice 3 |
