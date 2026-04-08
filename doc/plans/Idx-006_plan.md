# Plan: Idx-006

**Index**: Idx-006
**Created**: 2026-03-26
**Planner**: @GitHubCopilot
**Phase**: Phase 0
**Primary Module**: Master Data
**Work Type**: governance
**Track**: product-system

---

## 🎯 目標

把目前六張 CSV 的 shared key contract 與跨模組引用規則，升格成有 plan / log artifact 支撐的正式輸出，並補上生命週期與核定欄位的契約要求。這輪以現有 CSV 治理成果為範圍，不擴張到全部模組的 integration contract。

---

## 📋 SPEC

### Goal

讓目前已存在的 shared key contract 與 lifecycle / audit 欄位規則，正式納入 Phase 0 的 In Progress artifact 鏈。

### Business Context

- 屬於 shared key 與跨模組契約治理主線
- 使用角色為主資料治理、Production / Inventory / Order 流程設計與後續 schema 設計者
- 雖然 shared key contract 已建立，但仍缺正式 artifact 與生命週期 / 審計欄位契約，難以支撐後續 schema / integration work

### Non-goals

- 不在本輪補齊全部模組的 API payload 或 integration schema mapping
- 不在本輪建立正式資料庫 surrogate key 設計

### Acceptance Criteria

1. shared key contract 已納入生命週期與核定欄位原則。
2. Idx-006 plan/log artifact 已建立，implementation index 狀態改為 `In Progress`。
3. 文件清楚標示目前 shared key 契約仍以六張 CSV 為第一版範圍。

### Edge Cases

- `read_file` 與實際 CSV 內容可能短暫不一致 -> 驗證時以磁碟實況為準
- 規則表雖不是典型主資料 -> 仍需列入 shared contract，因其控制數量與扣帳語意

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/data/README.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/modules/README.md`
- `doc/architecture/decisions/README.md`
- `doc/architecture/data/shared_key_contract.md`
- `doc/architecture/data/shared_key_matrix_six_csv.md`
- `doc/architecture/data/master_data_dictionary.md`
- `doc/architecture/flows/unified_status_semantics.md`

### Missing Inputs

- 其餘模組的 integration schema / event payload contract 尚未建立
- 正式 surrogate key / business code mapping 仍待 schema 設計階段補充

research_required: true

### Sources

- repo 內 shared key 與架構權威文件
- 六張 CSV 的既有治理結果

### Assumptions

- VERIFIED - 六張 CSV 已形成目前可執行的第一版 shared key contract 範圍
- RISK: unverified - 其餘模組 contract 尚未拆出，因此 Idx-006 只能視為 In Progress

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Master Data
- Adjacent modules: Production、Inventory、Order / Fulfillment
- Out of scope modules: Procurement、Finance / Reconciliation 的專屬 contract

### File whitelist

- `doc/architecture/data/shared_key_contract.md` - 補生命週期與核定欄位契約
- `doc/architecture/data/shared_key_matrix_six_csv.md` - 既有第一版 shared key 範圍依據
- `doc/architecture/data/master_data_dictionary.md` - 對齊欄位與 owner 語意
- `doc/architecture/flows/unified_status_semantics.md` - 對齊狀態語意
- `doc/implementation_plan_index.md` - 同步任務狀態
- `doc/plans/Idx-006_plan.md` - 建立正式 plan
- `doc/logs/Idx-006_log.md` - 建立正式 log

### Conditional impact blocks

#### MASTER DATA IMPACT

- shared key contract 直接約束銷售商品、內包裝完成品、外包裝材料與規則 owner
- 生命週期欄位成為共享契約的一部分

#### STATE / WORKFLOW IMPACT

- `狀態` 與 `核定狀態` 會影響各模組何時可引用正式契約
- 本輪不建立完整 execution state machine

#### RBAC IMPACT

- 高風險規則表需要核定責任，但正式 RBAC 仍待後續工作
- 本輪只提供過渡核定欄位，不宣稱 RBAC 已完成

#### SHARED KEY / CROSS-MODULE IMPACT

- 直接涉及 `銷售商品SKU_正式`、`內包裝完成品SKU_正式`、`外包裝材料SKU_正式`、`規則代碼_正式`
- Production、Inventory、Order / Fulfillment 都要依同一契約引用，不得自行補碼或平行延伸語意

#### FINANCE / RECONCILIATION IMPACT

- N/A，本輪不處理財務 contract

#### OBSERVABILITY / AUDIT IMPACT

- 新欄位契約提供後續 audit log、execution log 與例外追溯最小基線

### Done 定義

1. shared key contract 已補生命週期與核定欄位原則。
2. Idx-006 plan/log artifact 已建立且 index 狀態已更新。
3. 文件已明確標示第一版 shared key 契約仍限六張 CSV 範圍。

### Rollback 策略

- Level: L1
- 前置條件: 仍屬文件與 CSV 契約治理，未建立程式碼或 schema 耦合
- 回滾動作: 回退 shared key contract、index 與 artifact 變更

### Max rounds

- 估計: 1
- 超過處理: 若需擴展至全模組 integration contract，回到 index 拆下一輪 work unit

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-006-shared-key-contract-v1
  goal: 把六張 CSV 的 shared key 契約升格為正式 artifact 並補 lifecycle / audit 欄位要求
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - touched-file-lint
  file_scope:
    - doc/architecture/data/shared_key_contract.md
    - doc/architecture/data/shared_key_matrix_six_csv.md
    - doc/architecture/data/master_data_dictionary.md
    - doc/architecture/flows/unified_status_semantics.md
    - doc/implementation_plan_index.md
    - doc/plans/Idx-006_plan.md
    - doc/logs/Idx-006_log.md
  done_criteria:
    - shared key contract 已補 lifecycle / audit 欄位原則
    - index 與 plan/log artifact 已同步
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
| `doc/architecture/data/shared_key_contract.md` | 修改 | 納入 lifecycle / audit 欄位契約 |
| `doc/implementation_plan_index.md` | 修改 | 將 Idx-006 轉為 In Progress |
| `doc/plans/Idx-006_plan.md` | 新增 | 正式 plan artifact |
| `doc/logs/Idx-006_log.md` | 新增 | 正式 log artifact |

## 實作指引

### 1. 模組與資料層

- owner、consumer 與禁止平行 key 的原則必須沿用既有 shared key contract。
- 生命週期與核定欄位一旦納入契約，後續 schema / integration 不得再視為可選欄位。

### 2. 流程與權限

- `核定狀態` 的正式責任歸屬待 RBAC matrix 補齊，本輪只能做過渡治理。
- 停用規則與 consumer 切換計畫必須保留可追溯依據。

### 3. 介面與驗證

- 以權威文件一致性、index 狀態與 CSV 欄位存在性作為驗證方式。
- 不涉及 API / event / integration 測試。

## 注意事項

- 風險提示: 若 contract 沒有同步欄位語意，後續 schema / migration 很容易各自發明欄位
- 資安考量: 本輪不處理 secrets，但屬高風險共享契約治理，不能省略審計語意
- 相依性: 依賴主資料字典與統一狀態語意文件
- 缺漏前提: 全模組 integration contract、RBAC matrix 仍缺

## 相關資源

- `doc/architecture/data/shared_key_contract.md`
- `doc/architecture/data/shared_key_matrix_six_csv.md`
- `doc/architecture/data/master_data_dictionary.md`
- `doc/architecture/flows/unified_status_semantics.md`

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: 2026-03-26 16:37:03
plan_approved: 2026-03-26 16:37:03
scope_policy: strict
expert_required: true
expert_conclusion: 需把 shared key 契約與 lifecycle / audit 欄位一起升格為正式 artifact
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
log_file_path: doc/logs/Idx-006_log.md
<!-- EXECUTION_BLOCK_END -->