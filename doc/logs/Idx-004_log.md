# Idx-004: 工作流程與狀態模型第一版 - Execution Log

> 建立日期: 2026-03-26
> 更新日期: 2026-04-02
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-004`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-004_plan.md`
- log_file_path: `doc/logs/Idx-004_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

先建立主資料與高風險參照的統一狀態語意，並補上兩條包裝流程基線：出貨用品 / 包裝耗材採人工盤點、不自動扣除；內包裝包材併入包材主檔且需正式扣帳，作為後續各流程 state machine 的共同底座。

### Scope

- 建立 `unified_status_semantics.md`
- 建立 `shipping_supply_inventory_policy.md`
- 對齊 flows README 與 shared key contract
- 對齊內包裝包材與包材主檔 / 正式扣帳邊界
- 明確標記完整 workflow state machine 仍待後續補齊
- 補上日常扣帳、隔日排工、日終回填與盤點 / 負庫存政策三份正式 flows 規格
- 建立日常營運流程的工程實作拆解清單

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | copilot-cli |
| security_reviewer_tool | N/A |
| qa_tool | Explore |
| last_change_tool | copilot-cli |
| qa_result | PASS_WITH_RISK |
| commit_hash | pending |

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| Explore | Idx-004 closure cross-QA | completed | 驗證統一狀態語意、出貨用品細則與 daily ops 狀態銜接已達第一版完成邊界 | 2026-04-03 17:05:00 |

## 📈 SKILLS_EVALUATION

本輪先補共通狀態語意文件，並補上出貨用品人工盤點流程基線，避免在完整流程狀態機尚未落地前各文件各自解讀 `狀態`、`核定狀態` 與出貨耗材的庫存管理方式。2026-04-03 再以 Explore cross-QA 驗證：盤點頻率、調整原因字典、Phase 1 最小狀態銜接與角色邊界已足以完成第一版關帳。

2026-03-31 / 2026-04-01 補充：已進一步把 handoff 中確認的日常營運主線落成正式規格，並把三張正式表的 owner 邊界拆成工程可執行的資料表 / API / 狀態事件候選。

## ✅ QA_SUMMARY

- 結論：PASS_WITH_RISK
- 風險：完整訂單、工單、採購、庫存、財務 state machine 仍待後續獨立 work unit 擴版
- 後續事項：依本基線拆出各流程 state machine，但不回頭否定本輪統一狀態語意與日常營運流程基線

## ✅ COMPLETION_DECISION

- 關帳判定：可由 `In Progress` 轉為 `Completed`
- 理由：統一狀態語意、出貨用品人工盤點細則、日常營運三份正式 flows 規格與工程拆解清單都已落地並完成 cross-QA
- deferred 範圍：完整跨模組 state machine 與更細的人員層級 RBAC

## 🆕 2026-03-31 / 2026-04-01 變更摘要

- 新增 `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`
- 新增 `doc/architecture/flows/end_of_day_replenishment_spec.md`
- 新增 `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`
- 新增 `doc/architecture/flows/daily_ops_engineering_breakdown.md`
- 更新 `doc/architecture/flows/README.md`，把上述文件掛回流程入口
- 更新 `doc/architecture/flows/shipping_supply_inventory_policy.md`，明確人工盤點型與正式扣帳型耗材邊界

### 本輪確認結論

- `銷售商品組成對照表` owner：sellable -> inner-pack / 外包裝材料
- `內包裝耗材用量對照表` owner：inner-pack -> 耗材
- `生產_分裝_轉換扣帳規則表` owner：拆包、秤重、單片、分裝轉換
- `Q1-Q5`、`G1-G5`、`C1-C7` 主體屬轉換規則 owner，不在耗材表重複建列
- `K1001-K4001` 濾掛咖啡單包目前不另建內包裝耗材規則

## 📎 EVIDENCE

- PTY debug: None
- PTY live: None
- 其他 evidence: shared key contract、flows README 與 CSV 欄位語意對齊檢查、Explore cross-QA closure review

### 2026-04-01 evidence 補充

- `doc/architecture/flows/README.md` 已掛上三份日常營運 flows 規格與 `daily_ops_engineering_breakdown.md`
- `doc/architecture/flows/daily_ops_engineering_breakdown.md` 已補 Prisma schema 候選、NestJS module 邊界、資料表 / API / 狀態事件拆解
- markdown 檢查：`README.md`、三份新 flows 規格、工程拆解清單皆無錯誤

## 🆕 2026-04-02 變更摘要

- 更新 `doc/architecture/data/shared_key_contract.md`，正式補上 `銷售商品組成對照表` 的 `對應內包裝成品SKU` 在 `原料直接分裝 / no_inner_stage` 條件下可承接 `原料代碼` 的共享鍵例外
- 更新 `doc/architecture/data/shared_key_matrix_six_csv.md`，把六表矩陣中的組成 consumer 槽位例外與 owner 邊界補回矩陣說明

### 2026-04-02 本輪確認結論

- N 系列無調味堅果等直分裝 sellable，目前已核定可在組成表使用原料主檔 `原料代碼` 作為輸入槽位
- 這個例外只改變組成 consumer 欄位的可接受輸入，不改變 `內包裝完成品SKU_正式` 與 `原料代碼` 各自的 owner
- 後續若進入正式 schema / API，應把此欄位正規化為 `compositionInputType + compositionInputSku`，避免後端長期用欄位名猜型別

### 2026-04-02 evidence 補充

- `doc/architecture/data/shared_key_contract.md` 已與目前 CSV 現況一致，不再把已核定的直分裝原料引用視為資料錯誤
- `doc/architecture/data/shared_key_matrix_six_csv.md` 已補上矩陣層說明，避免 consumer 端誤以為 owner 已轉移