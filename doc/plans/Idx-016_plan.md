# Plan: Idx-016

**Index**: Idx-016
**Created**: 2026-04-02
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: QA / Daily Ops Regression
**Work Type**: implementation

---

## 目標

建立日常營運的 regression fixture matrix 與 failure-path 驗收，讓零基準、負庫存、reminder、rollback、rerun 等高風險例外有可重複驗證的證據，不再每次靠手動試跑。

---

## SPEC

### Goal

把 mainline E2E 之外最容易回歸的 daily ops 例外路徑整理成固定 fixtures、固定預期與固定驗收矩陣。

### Business Context

- `Idx-015` 會先打通主線，但主線通過不代表例外安全。
- inventory-count 已知存在 zero-baseline、negative stock alert、reminder 與 manual adjustment 等敏感路徑。
- 若沒有 regression matrix，後續調整容易用修一條壞兩條的方式累積風險。

### Non-goals

- 不在本輪擴張到所有歷史資料回填案例。
- 不在本輪建立大而全的測試平台。
- 不在本輪處理與 Phase 1 無關的長尾 exception。

### Acceptance Criteria

1. 已有代表性 regression fixtures 覆蓋 zero-baseline、negative stock、reminder、rerun、rollback 與拒絕路徑。
2. failure-path 驗收矩陣已清楚定義預期狀態、預期錯誤碼或預期 evidence。
3. regression 執行方式與 mainline E2E 的關係已清楚切分，避免互相覆寫資料前提。
4. 至少一次完整 regression run 有 evidence 留存。

### Edge Cases

- 部分例外需要故意製造不一致資料，必須避免污染主線 smoke fixture。
- rollback 與 rerun 若尚未是正式 API，需定義用 service-level 還是 fixture-level 驗證。
- 某些例外可能需要以權限拒絕與業務拒絕兩種方式分開驗證。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`
- `doc/architecture/flows/inventory_count_api_contract.md`
- `doc/architecture/flows/daily_ops_engineering_breakdown.md`
- `apps/api/test/**`
- `apps/api/src/daily-ops/**`
- `apps/api/src/inventory/**`

### Missing Inputs

- failure-path regression matrix 尚未正式文件化。
- 部分 rollback / rerun 情境目前只有口頭或局部測試概念，無固定 fixture。

research_required: true

### Assumptions

- VERIFIED - inventory-count focused metrics test 已覆蓋部分數學行為，但未形成例外矩陣。
- VERIFIED - mainline E2E 完成後，failure-path matrix 才能穩定建在固定主線之上。
- RISK: unverified - 某些 rollback / rerun 例外可能需要額外 API 或事件鉤子才能驗證。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: QA / Daily Ops Regression
- Adjacent modules: Inventory、Daily Ops、Authorization
- Out of scope modules: 非 Phase 1 長尾 exception、完整測試平台基建

### File whitelist

- `apps/api/test/**`
- `apps/api/src/daily-ops/**`
- `apps/api/src/inventory/**`
- `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`
- `doc/architecture/flows/inventory_count_api_contract.md`
- `doc/plans/Idx-016_plan.md`
- `doc/logs/Idx-016_log.md`

### Done 定義

1. 代表性 failure-path regression matrix 已建立。
2. regression 與 mainline fixture 邊界已清楚。
3. 至少一次完整 run 留下 evidence。

### Rollback 策略

- Level: L2
- 前置條件: 若 regression fixture 汙染主線測試前提，需可快速回退矩陣與 fixtures。
- 回滾動作: 回退新增 fixture 與 regression harness，保留 mainline E2E 不變。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-016-daily-ops-regression-failure-matrix
  goal: 建立可重跑的 daily ops failure-path regression matrix
  retry_budget: 5
  allowed_checks:
    - regression-suite
    - focused-failure-tests
    - evidence-readback
  file_scope:
    - apps/api/test/**
    - apps/api/src/daily-ops/**
    - apps/api/src/inventory/**
    - doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md
    - doc/architecture/flows/inventory_count_api_contract.md
    - doc/plans/Idx-016_plan.md
    - doc/logs/Idx-016_log.md
  done_criteria:
    - 代表性例外路徑均有 fixture
    - regression run 可重跑
    - failure expectations 已文件化
    - no file changes outside file_scope
  escalation_conditions:
    - rollback / rerun 需要新增新 API 才能驗證
    - fixture 相依關係失控
    - retry budget exhausted
```

---

## 注意事項

- 本任務雖以測試為主，但覆蓋的是 inventory 高風險面；正式執行時仍需 Security Review 與 Domain Review。
- 不得讓 failure-path fixture 直接污染 mainline E2E 資料基線。
- 若發現例外無法用現有契約表達，必須先回報阻斷而不是硬寫測試。

## 2026-04-02 正式執行排程

### 當前狀態

- 已建立正式 plan/log artifact。
- 直接依賴 `Idx-015`，本輪採固定 regression suite 落地。
- 受限於正式 rollback API 尚未存在，本輪以 `revision-as-rollback-guard` 誠實記錄目前可驗證的受控替代路徑。

### 預定落地重點

1. 抽出與 mainline 可共存的 regression fixtures。
2. 收斂 zero-baseline、negative stock、count reminder、權限拒絕與 rerun / revision regression。
3. 建立 regression run 與 expectation matrix。

### 預定驗證

- focused validation：先跑 production-plan rerun / revision smoke，再跑整體 regression suite。
- 文件 validation：failure expectation matrix readback。

## 2026-04-02 執行結果

- 已新增 `test/production-plan-rerun-regression-smoke.js`，固定 `PLAN_CREATED -> MANUAL_RERUN -> PLAN_REVISED` 三段 evidence。
- 已新增 `test/daily-ops-regression-suite.js`，串接 opening-balance、inventory-count、production-plan rerun / revision 三組固定場景。
- regression matrix 目前覆蓋 `zero-baseline`、`negative stock`、`count reminder`、`權限拒絕`、`manual rerun` 與 `revision-as-rollback-guard`。
- focused validation：`node test/production-plan-rerun-regression-smoke.js` 回傳 `PASS`；整體 `npm run test:daily-ops:regression` 回傳 `PASS`。

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: 2026-04-02 00:00:00
plan_approved: 2026-04-02 00:00:00
scope_policy: strict
expert_required: true
expert_conclusion: Phase 1 MVP 不能只有主線通過，還要有 failure-path regression 才算可守住品質
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: domain-rule
security_review_trigger_matches:
  - inventory
  - rollback
  - reminder
security_review_start: 2026-04-02 00:00:00
security_review_end: 2026-04-02 00:00:00
security_review_result: PASS_WITH_RISK
security_review_conclusion: regression suite 的 DB 隔離已成立，production-planning RBAC gap 已於修正輪補上；剩餘風險改為正式 destructive rollback API 與完整 auth / maker-checker 未落地
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
session_id: pending
last_change_tool: copilot-cli

# QA 執行
qa_tool: Explore
qa_tool_version: GPT-5.4
qa_user: Explore
qa_start: 2026-04-02 00:00:00
qa_end: 2026-04-02 00:00:00
qa_result: PASS_WITH_RISK
qa_compliance: PASS - cross-QA reviewer 與 last_change_tool 不同，且 regression matrix 已完成獨立 cross-QA / Security / Domain review

# 收尾
log_file_path: doc/logs/Idx-016_log.md
<!-- EXECUTION_BLOCK_END -->