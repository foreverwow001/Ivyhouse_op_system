# Plan: Idx-012

**Index**: Idx-012
**Created**: 2026-04-02
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: Daily Ops / Inventory
**Work Type**: implementation
**Track**: product-system

---

## 目標

把 opening balance bootstrap 與第一次正式盤點收斂成可執行 runbook，不再依賴假 seed 或口頭 SOP，並建立首盤 rehearsal evidence 與失敗補救路徑。

---

## SPEC

### Goal

明確定義 opening balance 只能如何建立、由誰建立、何時建立、失敗時如何補救，讓 inventory-count 從技術可跑走向營運可啟動。

### Business Context

- Phase 1 MVP 已明定 opening balance 不能靠任意 seed 假裝完成。
- inventory-count API 與 smoke 已具基線，但缺少首盤與開帳實務流程。
- 若 opening balance 邏輯不明確，後續所有差異率、負庫存警示與 reminder 都會失真。

### Non-goals

- 不在本輪完成完整倉庫盤點 UI。
- 不在本輪建立一般性 historical inventory import 工具。
- 不在本輪處理 finance closing 與成本結轉。

### Acceptance Criteria

1. 已有正式 opening balance runbook，說明前置條件、執行角色、資料來源、盤點頻率與補救流程。
2. inventory-count 首盤 rehearsal 至少完成一輪，並有 evidence 可追溯。
3. 首盤與後續日常盤點的界線已文件化，避免把 bootstrap 特例帶入常態流程。
4. smoke fixture、seed strategy 或等價測試資料已能模擬首盤前後行為差異。

### Edge Cases

- 首盤前已有負庫存或歷史資料不完整時，需定義是否允許 maker-checker 例外處理。
- 同一 bucket 若在首盤期間有實際營運流量，需定義鎖窗或補錄策略。
- 若首盤中斷或只完成部分 session，需明確定義 rollback / resume 規則。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/phase1_mvp_three_phase_execution_plan.md`
- `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/architecture/flows/inventory_count_api_contract.md`
- `apps/api/src/daily-ops/inventory-count/**`
- `apps/api/test/inventory-count-api-smoke.js`
- `apps/api/test/helpers/inventory-count-smoke-fixture.js`

### Missing Inputs

- 正式 opening balance runbook 尚未建立。
- 首盤窗口的角色責任、maker-checker 例外與營運切換點尚未文件化。

research_required: true

### Assumptions

- VERIFIED - inventory-count 契約已可支援 session、line、complete、manual adjustment 與 reminder。
- VERIFIED - Phase 1 要求 opening balance 只能透過第一次正式盤點建立。
- RISK: unverified - 實際門市 / 倉庫首盤切窗 SOP 與現況資料準備成熟度仍待 domain 確認。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Daily Ops / Inventory
- Adjacent modules: Master Data、RBAC、Bootstrap Strategy
- Out of scope modules: Finance closing、採購開帳、完整前台 UI

### File whitelist

- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`
- `doc/architecture/flows/inventory_count_api_contract.md`
- `apps/api/src/daily-ops/inventory-count/**`
- `apps/api/test/inventory-count-api-smoke.js`
- `apps/api/test/helpers/inventory-count-smoke-fixture.js`
- `doc/plans/Idx-012_plan.md`
- `doc/logs/Idx-012_log.md`

### Done 定義

1. opening balance 與首盤流程已能被正式說明與演練。
2. 首盤例外、失敗補救與 evidence 收集方式已明確。
3. 本輪不跨出 inventory-count / bootstrap 核心範圍。

### Rollback 策略

- Level: L2
- 前置條件: 若首盤 bootstrap 設計造成常態盤點邏輯混淆，必須可回退到只保留文件與 fixture 的狀態。
- 回滾動作: 回退首盤專屬流程實作與 fixture，保留既有日常盤點契約不受影響。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-012-opening-balance-bootstrap-rehearsal
  goal: 以第一次正式盤點建立 opening balance，並留下可重跑的 rehearsal evidence
  retry_budget: 5
  allowed_checks:
    - inventory-smoke
    - fixture-rehearsal
    - runbook-readback
  file_scope:
    - doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md
    - doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md
    - doc/architecture/flows/inventory_count_api_contract.md
    - apps/api/src/daily-ops/inventory-count/**
    - apps/api/test/inventory-count-api-smoke.js
    - apps/api/test/helpers/inventory-count-smoke-fixture.js
    - doc/plans/Idx-012_plan.md
    - doc/logs/Idx-012_log.md
  done_criteria:
    - opening balance runbook 已建立
    - rehearsal evidence 已記錄
    - bootstrap 與常態盤點邊界已明確
    - no file changes outside file_scope
  escalation_conditions:
    - 首盤流程需新增不可逆資料回填
    - bucket 切窗規則無法在現有契約下表達
    - retry budget exhausted
```

---

## 注意事項

- 本任務屬庫存與盤點高風險面，正式執行時必須補 Domain Review 與 Security Review。
- opening balance 不得被一般 seed script 假裝完成。
- 若需臨時允許負庫存或手動補值，必須同時定義角色、期限與補正機制。

## 2026-04-02 正式執行排程

### 當前狀態

- 已建立正式 plan/log artifact。
- 直接依賴 `Idx-011`，目前尚未開始實作。
- 啟動條件：`Idx-011` 的正式 migration path 與測試 DB bootstrap 完成。

### 預定落地重點

1. 把 `daily_ops_seed_bootstrap_strategy.md` 擴成 opening balance runbook。
2. 以 inventory-count smoke fixture 補首盤 rehearsal 情境。
3. 補首盤與常態盤點的切窗、補救與 evidence 收集規則。

### 預定驗證

- focused validation：首盤 rehearsal fixture / smoke。
- 文件 validation：runbook readback 與例外路徑一致性檢查。

## 後續補強子任務

- `Idx-020`：Opening balance 多窗口 / 中斷補救治理補強
  - 補首盤中斷補救、取消 / 恢復與跨倉 / 多窗口規則
  - 收斂實際營運流量打斷首盤時的治理邊界

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: 2026-04-02 00:00:00
plan_approved: 2026-04-02 00:00:00
scope_policy: strict
expert_required: true
expert_conclusion: opening balance 是 inventory-count 進入營運的前置條件，必須先收斂 runbook 與 reheasal
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: domain-rule
security_review_trigger_matches:
  - inventory
  - opening balance
security_review_start: 2026-04-02 00:00:00
security_review_end: 2026-04-02 00:00:00
security_review_result: PASS_WITH_RISK
security_review_conclusion: 首盤 rehearsal 已成立，但 opening balance 期間仍缺 createSession 權限閘與窗口鎖定控制
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
session_id: idx-012-opening-balance-rehearsal
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
log_file_path: doc/logs/Idx-012_log.md
<!-- EXECUTION_BLOCK_END -->