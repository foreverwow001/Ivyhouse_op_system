# Plan: Idx-004

**Index**: Idx-004
**Created**: 2026-03-26
**Planner**: @GitHubCopilot
**Phase**: Phase 0
**Primary Module**: Master Data
**Work Type**: governance
**Track**: product-system

---

## 🎯 目標

建立 Phase 0 的統一狀態語意與流程基線，先把主資料與高風險參照的生命週期狀態、核定狀態與欄位語意正式化，並補上兩條包裝治理規則：出貨用品 / 包裝耗材採人工盤點、不自動扣除；內包裝包材併入包材主檔且需正式扣帳。這份基線用來支撐目前 CSV 治理與後續 workflow state machine，而不是一次取代各流程的完整狀態設計。

---

## 📋 SPEC

### Goal

讓目前 CSV 與權威文件共用同一套狀態語意，並補上出貨用品人工盤點流程基線與內包裝包材正式扣帳邊界，避免 `狀態`、`核定狀態`、有效期間與包材管理方式被各自解讀。

### Business Context

- 屬於 Phase 0 工作流程與狀態模型基線
- 使用角色為主資料治理、流程設計、後續 schema / service 設計者
- 目前多張 CSV 已有 `狀態`，但缺少統一語意與核定欄位定義，無法安全銜接高風險規則表

### Non-goals

- 不在本輪建立訂單、工單、採購、庫存、財務的完整 state machine
- 不在本輪建立 RBAC matrix 或 approval matrix 完整版本

### Acceptance Criteria

1. 建立一份權威狀態語意文件，定義 `草稿`、`啟用`、`停用` 與高風險規則的核定狀態。
2. 文件明確說明 `生效日`、`失效日`、`停用原因`、`來源建立方式`、`核定人`、`核定日期` 的使用規則。
3. 建立一份出貨用品 / 包裝耗材的人工盤點與調整規則文件，明確定義「進 ERP 但不自動扣除」的流程邊界。
4. 在流程權威文件中明確定義內包裝包材併入包材主檔，且屬正式扣帳範圍。
5. `doc/implementation_plan_index.md` 與本任務 plan/log artifact 同步建立，任務狀態改為 `In Progress`。
6. 補齊日常扣帳、隔日排工、日終回填、盤點 / 負庫存政策三份正式 flows 規格。
7. 補一份工程實作用的 `資料表 / API / 狀態事件` 拆解清單，並與三張正式表的 owner 邊界對齊。

### Edge Cases

- `停用 -> 啟用` 需要復用 -> 非預設路徑，必須保留新的有效期間與審計說明
- 目前沒有正式核定角色 -> 允許用 `暫行核定` 作為過渡值，但不可假裝正式 maker-checker 已完成

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/data/README.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/modules/README.md`
- `doc/architecture/decisions/README.md`
- `doc/architecture/data/master_data_dictionary.md`
- `doc/architecture/data/shared_key_contract.md`

### Missing Inputs

- 訂單、工單、採購、庫存、財務等完整 state machine 定義仍缺
- RBAC matrix 與 approval matrix 尚未建立

research_required: true

### Sources

- repo 內 architecture 與 shared key 權威文件
- 四張需補生命週期與審計欄位的 CSV 載體

### Assumptions

- VERIFIED - 目前主資料 / 參照資料共通需要 `狀態` 與有效期間欄位
- RISK: unverified - 正式核定角色與 maker-checker 邊界尚未由 RBAC matrix 定稿

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Master Data
- Adjacent modules: Production、Inventory、Order / Fulfillment
- Out of scope modules: Finance / Reconciliation、Portal / Identity / Audit 的完整流程實作

### File whitelist

- `doc/architecture/flows/unified_status_semantics.md` - 建立統一狀態語意基線
- `doc/architecture/flows/README.md` - 掛上新文件
- `doc/architecture/flows/shipping_supply_inventory_policy.md` - 建立出貨用品人工盤點規則
- `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md` - 建立日常扣帳與隔日排工正式規格
- `doc/architecture/flows/end_of_day_replenishment_spec.md` - 建立日終回填正式規格
- `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md` - 建立盤點、差異調整與負庫存政策正式規格
- `doc/architecture/flows/daily_ops_engineering_breakdown.md` - 建立工程實作用的資料表 / API / 狀態事件拆解清單
- `doc/architecture/data/shared_key_contract.md` - 對齊生命週期與核定欄位規則
- `doc/implementation_plan_index.md` - 同步任務狀態
- `doc/plans/Idx-004_plan.md` - 建立正式 plan
- `doc/logs/Idx-004_log.md` - 建立正式 log

### Conditional impact blocks

#### MASTER DATA IMPACT

- 涉及主資料 / 參照的生命週期與欄位語意
- 啟用與停用規則會直接影響 consumer 可否引用資料

#### STATE / WORKFLOW IMPACT

- 本輪定義主資料 / 高風險參照的狀態與轉移規則
- 本輪補上出貨用品 / 包裝耗材的人工作業流程邊界
- 本輪明確定義內包裝包材不是人工盤點型耗材，而是正式扣帳型包材
- 完整流程狀態機仍待後續工作分拆

#### RBAC IMPACT

- `核定狀態` 與 `核定人` 需要 RBAC / approval matrix 支撐
- 本輪僅提供暫行核定語意，不宣稱正式核定流程已完成

#### SHARED KEY / CROSS-MODULE IMPACT

- `狀態` 與 `核定狀態` 會影響 Production、Inventory、Order / Fulfillment 對 shared key 的使用時機
- 高風險規則表的核定欄位是跨模組契約的一部分

#### FINANCE / RECONCILIATION IMPACT

- N/A，本輪不直接處理財務狀態模型

#### OBSERVABILITY / AUDIT IMPACT

- 新增有效期間與核定欄位語意，作為後續 audit / exception log 基線

### Done 定義

1. 統一狀態語意文件已建立並被 flows README 掛載。
2. 出貨用品人工盤點與調整規則文件已建立並被 flows README 掛載。
3. Shared key contract 已同步納入生命週期與核定欄位原則。
4. Index 與 Idx-004 plan/log artifact 已對齊。

### Rollback 策略

- Level: L1
- 前置條件: 僅限文件與 index 調整
- 回滾動作: 回退狀態語意文件、README 與 index 變更

### Max rounds

- 估計: 1
- 超過處理: 若需要直接展開各流程 state machine，改由新一輪 Idx-004 子任務處理

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-004-unified-status-semantics-v1
  goal: 建立統一狀態語意基線並對齊 shared key contract
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - touched-file-lint
  file_scope:
    - doc/architecture/flows/unified_status_semantics.md
    - doc/architecture/flows/README.md
    - doc/architecture/flows/shipping_supply_inventory_policy.md
    - doc/architecture/data/shared_key_contract.md
    - doc/implementation_plan_index.md
    - doc/plans/Idx-004_plan.md
    - doc/logs/Idx-004_log.md
  done_criteria:
    - 統一狀態語意文件已建立
    - 出貨用品人工盤點規則已建立
    - shared key contract 已對齊生命週期與核定欄位
    - no file changes outside file_scope
    - engineer result is ready for external review
  escalation_conditions:
    - scope break
    - new security-sensitive path or keyword triggered
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/architecture/flows/unified_status_semantics.md` | 新增 | 建立狀態語意基線 |
| `doc/architecture/flows/README.md` | 修改 | 掛上新文件 |
| `doc/architecture/flows/shipping_supply_inventory_policy.md` | 新增 | 建立出貨用品人工盤點規則 |
| `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md` | 新增 | 建立日常扣帳與隔日排工正式規格 |
| `doc/architecture/flows/end_of_day_replenishment_spec.md` | 新增 | 建立日終回填正式規格 |
| `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md` | 新增 | 建立盤點、差異調整與負庫存政策正式規格 |
| `doc/architecture/flows/daily_ops_engineering_breakdown.md` | 新增 | 建立工程拆解清單 |
| `doc/architecture/data/shared_key_contract.md` | 修改 | 納入生命週期與核定欄位規則 |
| `doc/implementation_plan_index.md` | 修改 | 將 Idx-004 轉為 In Progress |
| `doc/plans/Idx-004_plan.md` | 新增 | 正式 plan artifact |
| `doc/logs/Idx-004_log.md` | 新增 | 正式 log artifact |

## 2026-03-31 / 2026-04-01 範圍補充

- 本任務已從共通狀態語意基線延伸到日常營運流程正式規格，補上：
  - 早上匯入後的正式扣帳分桶
  - 隔日排工與 BOM 回沖 / 重算
  - 日終回填與雙桶 family 規則
  - 盤點頻率、差異調整欄位與負庫存政策
- 另新增工程拆解清單，用於銜接後續 Prisma schema 與 NestJS module 落地。

## 實作指引

### 1. 模組與資料層

- 統一狀態語意只定義共通規則，不替代各模組私有流程細節。
- 高風險規則表的核定欄位屬跨模組契約，不可只寫在備註。

### 2. 流程與權限

- `狀態` 與 `核定狀態` 必須分離。
- 若需正式 maker-checker，待 RBAC matrix 完成後再將 `暫行核定` 升級為 `正式核定`。

### 3. 介面與驗證

- 以文件一致性與 CSV 欄位存在性作為驗證方式。
- 不涉及 API / UI / workflow engine 測試。

## 注意事項

- 風險提示: 若把可用性與核定責任混成單一欄位，後續審計會失真
- 資安考量: 雖不碰 secrets，但此輪屬高風險治理變更，需保留審計邊界
- 相依性: 依賴主資料字典、shared key contract、RBAC matrix 後續工作
- 缺漏前提: 完整 state machine、RBAC matrix、approval matrix 仍缺

## 相關資源

- `doc/architecture/flows/README.md`
- `doc/architecture/data/master_data_dictionary.md`
- `doc/architecture/data/shared_key_contract.md`

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: 2026-03-26 16:37:03
plan_approved: 2026-03-26 16:37:03
scope_policy: strict
expert_required: true
expert_conclusion: 需先補統一狀態語意，避免 CSV 與後續流程設計各自定義狀態
security_review_required: false
security_reviewer_tool: N/A
security_review_trigger_source: none
security_review_trigger_matches: []
security_review_start: N/A
security_review_end: N/A
security_review_result: N/A
security_review_conclusion: N/A
execution_backend_policy: pty-primary-with-consented-fallback
scope_exceptions: []

# Engineer 執行
executor_tool: copilot-cli
executor_backend: ivyhouse_terminal_fallback
monitor_backend: manual_confirmation
executor_tool_version: GPT-5.4
executor_user: GitHub Copilot
executor_start: 2026-03-26 16:37:03
executor_end: 2026-03-26 16:42:18
session_id: N/A
last_change_tool: copilot-cli

# QA 執行
qa_tool: pending-cross-qa
qa_tool_version: N/A
qa_user: N/A
qa_start: N/A
qa_end: N/A
qa_result: PASS_WITH_RISK
qa_compliance: ⚠️ 例外：尚未完成 cross-QA

# 收尾
log_file_path: doc/logs/Idx-004_log.md
<!-- EXECUTION_BLOCK_END -->