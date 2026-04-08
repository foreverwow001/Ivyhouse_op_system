# Plan: Idx-018

**Index**: Idx-018
**Created**: 2026-04-02
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: Review / Go-Live Governance
**Work Type**: release
**Track**: product-system

---

## 目標

收斂 Phase 1 MVP 的 review pack 與 go-live sign-off，將 cross-QA、domain/security review evidence、已知風險、延後項與驗收清單正式封板。

---

## SPEC

### Goal

建立一份可被工程、營運與審查角色共同接受的 MVP 封板套件，回答「能不能交付、風險剩什麼、誰核定」。

### Business Context

- 前面 work units 解決的是功能、驗證與操作；`Idx-018` 解決的是最後的交付治理。
- 若沒有 sign-off 套件，MVP 仍停留在「看起來差不多可以」而非可審查交付。
- Phase 1 涉及 inventory、shared key、盤點與高風險操作，不能跳過 formal review evidence。

### Non-goals

- 不在本輪再開新功能。
- 不在本輪延伸到 Phase 2 roadmap 細化。
- 不在本輪補做前面 work unit 未完成的實作。

### Acceptance Criteria

1. 已建立 MVP review pack，包含 cross-QA、domain review、security review、evidence、已知風險與延後項。
2. go-live sign-off 清單已明確標記 blocker / non-blocker / deferred。
3. 各高風險工作單元的完成依據可追溯到具體 log、測試或 runtime evidence。
4. 若仍有未完項，必須清楚標示為不能上線或接受風險，不得模糊處理。

### Edge Cases

- 某些 work unit 可能是 `PASS_WITH_RISK` 而非純 PASS，需定義是否可帶風險 sign-off。
- 若 cross-QA 尚未完成，不能只用同工具自評代替。
- 若 domain 或 security review 與工程結論衝突，必須先記錄阻斷點。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/phase1_mvp_three_phase_execution_plan.md`
- `doc/plans/Idx-011_plan.md`
- `doc/plans/Idx-012_plan.md`
- `doc/plans/Idx-013_plan.md`
- `doc/plans/Idx-014_plan.md`
- `doc/plans/Idx-015_plan.md`
- `doc/plans/Idx-016_plan.md`
- `doc/plans/Idx-017_plan.md`
- `doc/logs/Idx-011_log.md`
- `doc/logs/Idx-012_log.md`
- `doc/logs/Idx-013_log.md`
- `doc/logs/Idx-014_log.md`
- `doc/logs/Idx-015_log.md`
- `doc/logs/Idx-016_log.md`
- `doc/logs/Idx-017_log.md`

### Missing Inputs

- 正式 Phase 1 sign-off template 尚未建立。
- cross-QA、domain review、security review 的最終結論尚待前序 work unit 回填。

research_required: true

### Assumptions

- VERIFIED - `Idx-018` 只能建立在 `Idx-015`、`Idx-016`、`Idx-017` 已有 evidence 的前提上。
- VERIFIED - 高風險 MVP 不能只靠 build/test pass 宣稱可上線。
- RISK: unverified - sign-off 是否需額外營運或財務角色共同核可，仍待實際封板時確認。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Review / Go-Live Governance
- Adjacent modules: Daily Ops、Inventory、Security、Domain Review
- Out of scope modules: 新功能開發、Phase 2 規劃

### File whitelist

- `doc/implementation_plan_index.md`
- `doc/architecture/phase1_mvp_three_phase_execution_plan.md`
- `doc/plans/Idx-011_plan.md`
- `doc/plans/Idx-012_plan.md`
- `doc/plans/Idx-013_plan.md`
- `doc/plans/Idx-014_plan.md`
- `doc/plans/Idx-015_plan.md`
- `doc/plans/Idx-016_plan.md`
- `doc/plans/Idx-017_plan.md`
- `doc/plans/Idx-018_plan.md`
- `doc/logs/Idx-011_log.md`
- `doc/logs/Idx-012_log.md`
- `doc/logs/Idx-013_log.md`
- `doc/logs/Idx-014_log.md`
- `doc/logs/Idx-015_log.md`
- `doc/logs/Idx-016_log.md`
- `doc/logs/Idx-017_log.md`
- `doc/logs/Idx-018_log.md`

### Done 定義

1. review pack 與 sign-off 清單已建立。
2. blocker、風險與延後項已清楚分類。
3. 任何可上線結論都有可追溯 evidence。

### Rollback 策略

- Level: L1
- 前置條件: 若封板結論與實際 evidence 不一致，應回退結論而非偽裝完成。
- 回滾動作: 將 sign-off 狀態退回 draft / blocked，補齊缺口後再重新封板。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-018-phase1-mvp-review-pack-signoff
  goal: 建立 Phase 1 MVP 的正式 review pack 與 go-live sign-off 套件
  retry_budget: 3
  allowed_checks:
    - artifact-readback
    - evidence-audit
    - cross-qa-confirmation
  file_scope:
    - doc/implementation_plan_index.md
    - doc/architecture/phase1_mvp_three_phase_execution_plan.md
    - doc/plans/Idx-011_plan.md
    - doc/plans/Idx-012_plan.md
    - doc/plans/Idx-013_plan.md
    - doc/plans/Idx-014_plan.md
    - doc/plans/Idx-015_plan.md
    - doc/plans/Idx-016_plan.md
    - doc/plans/Idx-017_plan.md
    - doc/plans/Idx-018_plan.md
    - doc/logs/Idx-011_log.md
    - doc/logs/Idx-012_log.md
    - doc/logs/Idx-013_log.md
    - doc/logs/Idx-014_log.md
    - doc/logs/Idx-015_log.md
    - doc/logs/Idx-016_log.md
    - doc/logs/Idx-017_log.md
    - doc/logs/Idx-018_log.md
  done_criteria:
    - review pack 已建立
    - sign-off blocker 與 risk 已分類
    - cross-QA / domain / security evidence 已可追溯
    - no file changes outside file_scope
  escalation_conditions:
    - 關鍵上游 evidence 缺失
    - review 結論彼此衝突
    - retry budget exhausted
```

---

## 注意事項

- 本任務屬 Phase 1 封板與上線治理，不得把 `PASS_WITH_RISK` 模糊寫成 `Completed`。
- cross-QA 必須符合 `qa_tool != last_change_tool`。
- 若仍有 blocker，應明確維持 blocked / draft，不得因排程壓力硬過。

## 2026-04-03 Sign-off 準備結論

### 本輪確認結果

- `Idx-017` 與 `Idx-019` 已完成 Security / Domain review 回寫，可作為 sign-off pack 的 completed evidence。
- 本輪 sign-off 準備要先收斂 blocker、deferred 與 accepted risk，不預設等於最終 go-live 核准。
- 目前最主要 blocker 為 `Idx-021` 正式 auth / maker-checker 尚未實作完成；`Idx-020` 則屬可明列限制後延後的治理補強。

### Sign-off pack 第一輪切口

1. 匯整 `Idx-011` 到 `Idx-019` 的 completed evidence 與 review 結論。
2. 明確切出 blocker、deferred、accepted risk。
3. 只有在 blocker 清空時，才允許把 sign-off 結論改為最終過件。

## 2026-04-03 最終 Sign-off 判定

### 本輪最終結論

- `Idx-021` 第一個正式實作切片已完成，原先 blocker 已解除。
- 本輪最終 go-live sign-off 判定為 `PASS_WITH_RISK`，允許在受控 operating envelope 下交付。
- `Idx-020`、destructive rollback 缺口、formal-environment 差異，以及 production-planning admin 最終 approver 邊界，均列為 deferred / accepted risk，不再視為 blocker。

### Operating envelope

1. opening balance 僅允許同倉、同窗口首盤流程，不得擴張為多窗口或中斷恢復情境。
2. deploy 前仍須執行正式環境 migration history / extension / hotfix preflight。
3. production-planning 本輪以 formal principal + audit trace 交付，不宣稱已完成完整 approval persistence。

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: 2026-04-02 00:00:00
plan_approved: 2026-04-03 00:00:00
scope_policy: strict
expert_required: true
expert_conclusion: Phase 1 最後是否能交付，取決於 sign-off 套件是否可把證據、風險與阻斷點說清楚
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: domain-rule
security_review_trigger_matches:
  - sign-off
  - inventory
  - audit
security_review_start: 2026-04-03 15:08:00
security_review_end: 2026-04-03 15:12:00
security_review_result: PASS_WITH_RISK
security_review_conclusion: `Idx-021` blocker 已解除；其餘缺口已可正式分類為 deferred / accepted risk，不阻斷受控 go-live
execution_backend_policy: pty-primary-with-consented-fallback
scope_exceptions: []

# Engineer 執行
executor_tool: copilot-cli
executor_backend: pty-primary
monitor_backend: manual_confirmation
executor_tool_version: GPT-5.4
executor_user: GitHub Copilot
executor_start: 2026-04-03 00:00:00
executor_end: 2026-04-03 15:12:00
session_id: idx-018-signoff-prep
last_change_tool: copilot-cli

# QA 執行
qa_tool: Explore
qa_tool_version: GPT-5.4
qa_user: GitHub Copilot
qa_start: 2026-04-03 15:08:00
qa_end: 2026-04-03 15:12:00
qa_result: PASS_WITH_RISK
qa_compliance: PASS

# 收尾
log_file_path: doc/logs/Idx-018_log.md
<!-- EXECUTION_BLOCK_END -->