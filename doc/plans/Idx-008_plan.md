# Plan: Idx-008

**Index**: Idx-008
**Created**: 2026-04-03
**Planner**: @GitHubCopilot
**Phase**: Phase 0
**Primary Module**: Finance / Reconciliation
**Work Type**: governance

---

## 🎯 目標

建立 Ivyhouse OP System 的財務與對帳控制基線第一版，先把發票、收付款、核銷、成本、結帳與對帳的正式邊界、控制點、審核點與不可逆規則落成權威文件。這輪重點是補 Phase 0 缺失的 Finance / Reconciliation 前置基線，避免後續模組在沒有權威邊界的情況下，自行發明平行的財務語意。

---

## 📋 SPEC

### Goal

建立 `Idx-008` 的正式 plan/log artifact 與第一版財務 / 對帳控制基線文件，並明確判定它在現行 Phase 1 MVP 中屬受控 deferred，但對未來 finance-bearing work unit 屬 implementation-ready gate。

### Business Context

- 屬於 Phase 0 implementation-ready 收斂與高風險財務治理主線。
- 使用角色為 Domain Expert、Planner、Engineer、QA、未來 Finance / Reconciliation work unit owner。
- 目前專案已採納「財務結果必須追溯到交易事實」原則，但 repo 尚無 finance / reconciliation 專屬權威文件，形成治理真空。

### Non-goals

- 不在本輪建立發票、付款、核銷、成本、對帳或關帳的 runtime / schema / API。
- 不在本輪把完整 AR / AP 或財務審核工作流納入 Phase 1 MVP。
- 不在本輪修改任何 daily-ops 後端程式碼或資料表。

### Acceptance Criteria

1. `Idx-008` 已建立正式 plan/log artifact，且 implementation index 狀態可正式推進。
2. 已有一份 authority doc 定義發票、收付款、核銷、成本、對帳、關帳的邊界與控制點。
3. 文件明確標示 Phase 1 受控 deferred 與 future finance-bearing implementation-ready gate 的判定。
4. 已完成 cross-QA，確認本 work unit 屬文件基線收斂，不需反向擴張成 Phase 1 財務 runtime。

### Edge Cases

- Phase 1 scope 已排除完整財務流程 -> 文件必須誠實標示 deferred，而不是假裝現在就要實作。
- 後續若任何 work unit 開始碰發票、付款、核銷、成本、對帳 -> 本文件立即轉為前置 gate，不得被忽略。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/project_overview.md`
- `doc/architecture/modules/README.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/roles/README.md`
- `doc/architecture/decisions/README.md`
- `doc/architecture/phase1_mvp_scope.md`
- `doc/architecture/project_blueprint_alignment_draft.md`

### Missing Inputs

- finance / reconciliation 專屬權威文件目前不存在。
- 發票、收付款、核銷、成本、關帳的正式 schema / API / state machine 尚未建立。

research_required: true

### Sources

- repo 內現有權威文件與已採納 Phase 1 scope / architecture decisions
- `Idx-008` 在 implementation index 的既有定位

### Assumptions

- VERIFIED - Phase 1 MVP 明確排除完整財務 / 對帳 / 發票 / AR / AP 流程。
- VERIFIED - Finance / Reconciliation 原則已在 `project_rules.md`、`project_overview.md` 與 `decisions/README.md` 採納，但尚未專檔化。
- VERIFIED - 目前需要的是基線治理，不是 runtime 落地。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Finance / Reconciliation
- Adjacent modules: Order / Fulfillment、Inventory、Production、Portal / Identity / Audit
- Out of scope modules: Daily Ops runtime、frontend UI、正式 finance schema / API

### File whitelist

- `doc/architecture/flows/finance_reconciliation_control_baseline.md` - 建立第一版財務 / 對帳控制基線權威文件
- `doc/architecture/flows/README.md` - 掛上新文件入口
- `doc/implementation_plan_index.md` - 更新 Idx-008 狀態與說明
- `doc/plans/Idx-008_plan.md` - 建立正式 plan artifact
- `doc/logs/Idx-008_log.md` - 建立正式 log artifact

### Conditional impact blocks

#### MASTER DATA IMPACT

- 不直接補 finance master data schema。
- 但明確定義 future finance-bearing work unit 必須依附正式來源單據、對象與交易事實。

#### STATE / WORKFLOW IMPACT

- 定義發票、收付款、核銷、對帳與關帳的正式治理節點。
- 不在本輪落完整 state machine 或 runtime transition。

#### RBAC IMPACT

- 明確列出高風險財務動作需要 maker-checker 或等價覆核。
- 不在本輪補 page/API/row-level RBAC。

#### SHARED KEY / CROSS-MODULE IMPACT

- 定義 future finance work unit 必須追溯來源單據與交易事件，不得建立平行來源鍵。
- 與 Order / Fulfillment、Inventory、Production 的來源關聯屬正式 cross-module contract 前置基線。

#### FINANCE / RECONCILIATION IMPACT

- 本輪直接處理發票、付款、核銷、成本、結帳、對帳的控制邊界與審核點。
- 明確標示不可逆節點、reversal / adjustment 原則與期間結帳 guard。

#### OBSERVABILITY / AUDIT IMPACT

- 要求 actor / approver trace、reason、reversal 與 adjustment 線索不可缺失。

### Done 定義

1. `Idx-008` artifact 鏈已建立且完成 cross-QA。
2. 財務 / 對帳控制基線 authority doc 已建立並掛回 flows 入口。
3. 已明確判定：對 Phase 1 MVP 屬受控 deferred；對 future finance-bearing work unit 屬 implementation-ready gate。

### Rollback 策略

- Level: L1
- 前置條件: 本輪僅涉及文件與 artifact。
- 回滾動作: 回退 `Idx-008` plan/log、index 與 authority doc。

### Max rounds

- 估計: 1
- 超過處理: 若需要直接進入 finance schema / API，拆成下一輪 implementation work unit，不在本輪硬擴張。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-008-finance-reconciliation-baseline-v1
  goal: 建立財務與對帳控制基線第一版權威文件與 artifact 鏈
  retry_budget: 3
  allowed_checks:
    - plan-validator
    - touched-file-lint
    - cross-qa-readback
  file_scope:
    - doc/architecture/flows/finance_reconciliation_control_baseline.md
    - doc/architecture/flows/README.md
    - doc/implementation_plan_index.md
    - doc/plans/Idx-008_plan.md
    - doc/logs/Idx-008_log.md
  done_criteria:
    - Idx-008 artifact 鏈已建立
    - 財務 / 對帳控制基線 authority doc 已建立
    - deferred 與 gate 判定已明確
    - no file changes outside file_scope
    - engineer result is ready for external review
  escalation_conditions:
    - scope break
    - need runtime/schema implementation
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/architecture/flows/finance_reconciliation_control_baseline.md` | 新增 | 建立第一版財務 / 對帳控制基線權威文件 |
| `doc/architecture/flows/README.md` | 修改 | 掛上新文件入口 |
| `doc/implementation_plan_index.md` | 修改 | 更新 Idx-008 狀態與說明 |
| `doc/plans/Idx-008_plan.md` | 新增 | 正式 plan artifact |
| `doc/logs/Idx-008_log.md` | 新增 | 正式 log artifact |

## 實作指引

### 1. 模組與資料層

- 本輪只建立財務 / 對帳基線文件，不建立正式 finance schema 或 table。
- 後續 finance-bearing work unit 必須沿用本文件，不得自創平行財務語意。

### 2. 流程與權限

- 不可把發票、付款、核銷、對帳、關帳混成單一欄位。
- 高風險財務動作必須保留 maker-checker 或等價 approval 空間。

### 3. 介面與驗證

- 以權威文件一致性、Phase 1 scope 對齊與 Explore cross-QA 作為驗證。
- 不在本輪執行 runtime / schema 驗證。

## 注意事項

- 風險提示: 若沒有這份基線，後續模組可能自行發明發票 / 付款 / 對帳語意，導致 Phase 2/3 財務整合失真。
- 資安考量: 本輪未碰敏感財務資料實作，但財務 / 對帳屬高風險面，已明確標示 maker-checker 與審計要求。
- 相依性: 依賴 `project_rules.md`、`project_overview.md`、`phase1_mvp_scope.md` 與 modules / roles / flows 權威文件。
- 缺漏前提: finance schema、API、state machine 與實際 AR / AP / invoice workflow 仍未建立。

## 相關資源

- `project_rules.md`
- `doc/architecture/project_overview.md`
- `doc/architecture/modules/README.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/phase1_mvp_scope.md`
- `doc/architecture/project_blueprint_alignment_draft.md`

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: 2026-04-03 18:05:00
plan_approved: 2026-04-03 18:05:00
scope_policy: strict
expert_required: true
expert_conclusion: Finance / Reconciliation 原則雖已採納，但若沒有專屬基線文件，後續 finance-bearing work unit 會失去一致前提
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: keyword-rule
security_review_trigger_matches:
  - invoice
  - payment
  - reconciliation
  - costing
security_review_start: 2026-04-03 18:05:00
security_review_end: 2026-04-03 18:05:00
security_review_result: PASS_WITH_RISK
security_review_conclusion: 本輪只建立基線治理文件，未碰敏感財務 runtime；高風險操作與 maker-checker 需求已明確標示，後續實作仍需正式 security review
execution_backend_policy: pty-primary-with-consented-fallback
scope_exceptions: []

# Engineer 執行
executor_tool: copilot-cli
executor_backend: ivyhouse_terminal_fallback
monitor_backend: manual_confirmation
executor_tool_version: GPT-5.4
executor_user: GitHub Copilot
executor_start: 2026-04-03 18:05:00
executor_end: 2026-04-03 18:05:00
session_id: idx-008-governance-open
last_change_tool: copilot-cli

# QA 執行
qa_tool: Explore
qa_tool_version: N/A
qa_user: Explore
qa_start: 2026-04-03 18:05:00
qa_end: 2026-04-03 18:05:00
qa_result: PASS_WITH_RISK
qa_compliance: ✅ cross-QA completed; qa_tool != last_change_tool
<!-- EXECUTION_BLOCK_END -->