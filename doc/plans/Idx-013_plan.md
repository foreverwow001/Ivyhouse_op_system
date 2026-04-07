# Plan: Idx-013

**Index**: Idx-013
**Created**: 2026-04-02
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: Daily Ops / Portal / Identity
**Work Type**: implementation

---

## 目標

為 inventory-count 的高風險操作補上最小權限閘與驗收硬化，優先收斂 `complete session` 與 `manual adjustment`，避免在 RBAC 終版前持續裸露高風險入口。

---

## SPEC

### Goal

以最小但可驗收的方式，為盤點完成與手動調整建立授權邊界、錯誤回應與驗收矩陣。

### Business Context

- 目前 inventory-count API 已能完成功能流程，但尚未有正式權限閘。
- `complete session` 與 `manual adjustment` 會直接影響庫存數量、差異、負庫存與審計鏈。
- 等到完整 RBAC 終版再補這塊，風險過高。

### Non-goals

- 不在本輪完成全系統 auth / RBAC 終版。
- 不在本輪補齊 row-level security 或全域 permission framework。
- 不在本輪修改非 inventory-count 模組的授權行為。

### Acceptance Criteria

1. `complete session` 與 `manual adjustment` 至少具備最小權限檢查或等價控制。
2. 未授權、缺少必要理由、角色不符等失敗路徑有明確 API 回應與測試 evidence。
3. 驗收矩陣已對齊 `Idx-005` 的 RBAC 基線與現行 high-risk inventory 邊界。
4. smoke 或 focused test 可覆蓋成功 / 拒絕 / 缺理由三類核心情境。

### Edge Cases

- 尚未有完整登入基礎設施時，可能需要使用 header-based stub guard，但必須清楚標註過渡性質。
- session 建立者與完成者若需分離，必須與 maker-checker 原則一致。
- 系統管理角色不得直接被視為 inventory 高風險業務核定者。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/roles/README.md`
- `doc/architecture/flows/inventory_count_api_contract.md`
- `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`
- `apps/api/src/daily-ops/inventory-count/**`
- `apps/api/test/inventory-count-api-smoke.js`
- `apps/api/test/inventory-count-metrics.test.js`

### Missing Inputs

- inventory-count 專屬的最小 authorization contract 尚未文件化。
- 現有 API 缺正式 permission failure matrix。

research_required: true

### Assumptions

- VERIFIED - `Idx-005` 已建立第一版 RBAC / approval matrix，可作為最小 guard 對齊基線。
- VERIFIED - `manual adjustment` 已有 `sourceType=MANUAL` 必填 reason 的商務驗證。
- RISK: unverified - 現有 app 是否已有可重用 guard / request identity 注入機制，仍待實作前確認。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Daily Ops / Portal / Identity
- Adjacent modules: Inventory、Audit
- Out of scope modules: 全系統登入、使用者管理、row-level policy

### File whitelist

- `apps/api/src/daily-ops/inventory-count/**`
- `apps/api/src/app.module.ts`
- `apps/api/test/inventory-count-api-smoke.js`
- `apps/api/test/**`
- `doc/architecture/roles/README.md`
- `doc/architecture/flows/inventory_count_api_contract.md`
- `doc/plans/Idx-013_plan.md`
- `doc/logs/Idx-013_log.md`

### Done 定義

1. inventory-count 高風險入口已有最小 guard。
2. 驗收矩陣與失敗路徑 evidence 已建立。
3. 不擴張到全系統 auth framework。

### Rollback 策略

- Level: L2
- 前置條件: 若 guard 影響既有 smoke 或阻斷正常盤點流程，需可快速回退到前一版 API 行為。
- 回滾動作: 回退新增 guard、測試與契約說明，同步保留風險紀錄。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-013-inventory-count-minimal-auth-hardening
  goal: 為 inventory-count 高風險操作建立最小權限閘與驗收矩陣
  retry_budget: 5
  allowed_checks:
    - api-smoke
    - focused-auth-tests
    - contract-readback
  file_scope:
    - apps/api/src/daily-ops/inventory-count/**
    - apps/api/src/app.module.ts
    - apps/api/test/inventory-count-api-smoke.js
    - apps/api/test/**
    - doc/architecture/roles/README.md
    - doc/architecture/flows/inventory_count_api_contract.md
    - doc/plans/Idx-013_plan.md
    - doc/logs/Idx-013_log.md
  done_criteria:
    - complete session 與 manual adjustment 已有最小 guard
    - 未授權與拒絕路徑具備測試 evidence
    - no file changes outside file_scope
  escalation_conditions:
    - 需引入完整 identity provider 才能繼續
    - RBAC 基線與現場操作責任衝突
    - retry budget exhausted
```

---

## 注意事項

- 本任務命中 auth / permission / inventory 高風險面，正式執行必須做 Security Review 與 Domain Review。
- 不得為了測試方便而關閉驗證或繞過 audit 邊界。
- 若 guard 為過渡做法，必須明示升級到正式 auth framework 的退出條件。

## 2026-04-02 正式執行排程

### 當前狀態

- 已建立正式 plan/log artifact。
- 直接依賴 `Idx-011`，目前尚未開始實作。
- 啟動條件：`Idx-011` 完成正式 migration 驗證後，再以最新 inventory-count 路徑加 guard。

### 預定落地重點

1. 確認 inventory-count 最小 guard 掛點。
2. 收斂 `complete session`、`manual adjustment` 的允許角色與拒絕回應。
3. 以 focused auth smoke 補成功 / 拒絕 / 缺理由三類 evidence。

### 預定驗證

- focused validation：inventory-count API smoke + auth failure path。
- 文件 validation：RBAC 基線與 API 契約 readback。

## 後續補強子任務

- `Idx-021`：Inventory-count auth 與 maker-checker 補強
  - 以正式身份驗證取代 header-based guard
  - 補 create / complete / manual 的 maker-checker 與 approval flow

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: 2026-04-02 00:00:00
plan_approved: 2026-04-02 00:00:00
scope_policy: strict
expert_required: true
expert_conclusion: inventory-count 已進入可驗收階段，必須先補最小權限閘，避免高風險操作裸露
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: path-rule
security_review_trigger_matches:
  - auth
  - permission
  - inventory
security_review_start: 2026-04-02 00:00:00
security_review_end: 2026-04-02 00:00:00
security_review_result: PASS_WITH_RISK
security_review_conclusion: Phase 1 過渡 guard 已就位，但 header-based 角色聲明仍可被偽造，需後續正式 auth framework 替換
execution_backend_policy: pty-primary-with-consented-fallback
scope_exceptions: []

# Engineer 執行
executor_tool: copilot-cli
executor_backend: pty-primary
monitor_backend: manual_confirmation
executor_tool_version: GPT-5.4
executor_user: GitHub Copilot
executor_start: 2026-04-02 00:00:00
executor_end: 2026-04-02 00:00:00
session_id: idx-013-inventory-count-minimal-guard
last_change_tool: copilot-cli

# QA 執行
qa_tool: Explore
qa_tool_version: N/A
qa_user: Explore
qa_start: 2026-04-02 00:00:00
qa_end: 2026-04-02 00:00:00
qa_result: PASS_WITH_RISK
qa_compliance: ✅ cross-QA completed; qa_tool != last_change_tool

# 收尾
log_file_path: doc/logs/Idx-013_log.md
<!-- EXECUTION_BLOCK_END -->