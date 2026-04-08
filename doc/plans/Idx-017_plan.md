# Plan: Idx-017

**Index**: Idx-017
**Created**: 2026-04-02
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: Release / Operations Enablement
**Work Type**: release
**Track**: product-system

---

## 目標

把 migrate、bootstrap、opening balance、first batch 與 rollback 收斂成可交付的部署 / 啟動 / 回復 runbook，讓技術可跑轉成團隊可操作。

---

## SPEC

### Goal

建立一份 Phase 1 MVP 上線前必備的操作手冊，說明環境前置、執行順序、檢查點、失敗判斷與 rollback。

### Business Context

- `Idx-011`、`Idx-012`、`Idx-015` 解決的是技術路徑；`Idx-017` 解決的是交付與交接。
- 沒有 runbook，團隊仍要靠聊天紀錄或作者記憶才能操作。
- 上線流程若不能回滾，就不具備可接受的營運風險控制。

### Non-goals

- 不在本輪建立 full CI/CD pipeline。
- 不在本輪處理所有 infra 自動化。
- 不在本輪擴張到 Phase 2 之後的長期維運手冊。

### Acceptance Criteria

1. 已有 deploy / bootstrap / opening balance / first batch / rollback 的正式 runbook。
2. runbook 明確區分一次性步驟與日常步驟，避免把 bootstrap 特例帶進常態營運。
3. 每個高風險步驟均有前置條件、成功判斷、失敗判斷與回復策略。
4. 至少一次按 runbook 演練或等價 evidence 已記錄於 log。

### Edge Cases

- rollback 可能不是單一步驟，需要同時回退資料、服務狀態與人工作業窗口。
- opening balance 與 first batch 順序若錯，可能造成無法追溯的庫存失真。
- 若某步驟仍仰賴人工確認，必須明寫責任角色與停等點。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/phase1_mvp_three_phase_execution_plan.md`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/architecture/flows/daily_ops_engineering_breakdown.md`
- `apps/api/package.json`
- `apps/api/prisma/migrations/**`
- `apps/api/test/**`

### Missing Inputs

- 正式部署 / rollback runbook 尚未存在。
- 目前沒有一份可供營運與工程共用的 Phase 1 啟動順序文件。

research_required: true

### Assumptions

- VERIFIED - migration、opening balance 與 mainline E2E 完成後，才有足夠基線寫出 runbook。
- VERIFIED - rollback 不是可省略項目，必須和部署一樣被文件化。
- RISK: unverified - 實際環境差異是否需要 dev/staging/prod 三版本 runbook，仍待執行時確認。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Release / Operations Enablement
- Adjacent modules: Persistence、Daily Ops、Inventory
- Out of scope modules: CI/CD 自動化、infra provisioning

### File whitelist

- `apps/api/package.json`
- `apps/api/prisma/migrations/**`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/architecture/flows/daily_ops_engineering_breakdown.md`
- `doc/plans/Idx-017_plan.md`
- `doc/logs/Idx-017_log.md`

### Done 定義

1. Phase 1 runbook 已完整涵蓋 deploy 到 rollback。
2. 操作責任與停等點已明確。
3. 至少一次 runbook 演練 evidence 已留存。

### Rollback 策略

- Level: L1
- 前置條件: 若 runbook 文件內容與實際驗證不一致，先回退文件結論，不回退已驗證的程式碼事實。
- 回滾動作: 標記 runbook 為 draft / blocked，移除錯誤步驟並重新演練。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-017-deploy-bootstrap-rollback-runbook
  goal: 把 Phase 1 MVP 的部署、bootstrap 與 rollback 流程文件化並完成演練
  retry_budget: 4
  allowed_checks:
    - runbook-rehearsal
    - inventory-smoke
    - migrate-deploy-check
  file_scope:
    - apps/api/package.json
    - apps/api/prisma/migrations/**
    - doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md
    - doc/architecture/flows/daily_ops_engineering_breakdown.md
    - doc/plans/Idx-017_plan.md
    - doc/logs/Idx-017_log.md
  done_criteria:
    - deploy/rollback runbook 已建立
    - 演練 evidence 已記錄
    - 角色責任與停等點已明確
    - no file changes outside file_scope
  escalation_conditions:
    - rollback 需依賴未定義外部系統
    - runbook 與實際環境差異過大
    - retry budget exhausted
```

---

## 注意事項

- 本任務屬部署、bootstrap、inventory 高風險面，正式執行必須補 Security Review、Domain Review 與 Evidence gate。
- 不得把口頭知識或 terminal 歷程當成正式 runbook。
- 若 runbook 包含人工確認步驟，必須明寫可觀察證據與失敗判斷。

## 2026-04-03 正式啟動結論

### 本輪確認結果

- 已確認 `Idx-011`、`Idx-012`、`Idx-015` 可作為 `Idx-017` 第一輪 runbook 收斂的直接證據來源。
- 本輪先優先補文件面 runbook：環境 preflight、first batch SOP、rollback matrix、失敗補救與停等點。
- 本輪不把 `Idx-017` 擴張成新功能開發；若後續需要補驗證腳本或命令封裝，再以 runbook 缺口為準逐步補齊。

### 第一輪收斂切口

1. 以 `daily_ops_seed_bootstrap_strategy.md` 作為 deploy / bootstrap / opening balance / first batch / rollback 的單一操作入口。
2. 用 `Idx-011`、`Idx-012`、`Idx-015` 的既有 evidence 回填成功判定與失敗補救。
3. 先把高風險步驟的停等點、責任角色與不可假裝 rollback 的邊界寫清楚。

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: 2026-04-02 00:00:00
plan_approved: 2026-04-03 00:00:00
scope_policy: strict
expert_required: true
expert_conclusion: Phase 1 交付不能只靠功能存在，還需要部署與回滾可操作性
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: domain-rule
security_review_trigger_matches:
  - deploy
  - rollback
  - inventory
security_review_start: 2026-04-03 00:00:00
security_review_end: 2026-04-03 00:00:00
security_review_result: PASS_WITH_RISK
security_review_conclusion: runbook rehearsal 與 readback 已成立，但正式 destructive rollback API 尚未存在；此限制需由 Idx-018 sign-off 明確列為 accepted risk
execution_backend_policy: pty-primary-with-consented-fallback
scope_exceptions: []

# Engineer 執行
executor_tool: copilot-cli
executor_backend: pty-primary
monitor_backend: manual_confirmation
executor_tool_version: GPT-5.4
executor_user: GitHub Copilot
executor_start: 2026-04-03 00:00:00
executor_end: 2026-04-03 00:00:00
session_id: idx-017-runbook-kickoff
last_change_tool: copilot-cli

# QA 執行
qa_tool: Explore
qa_tool_version: N/A
qa_user: Explore
qa_start: 2026-04-03 00:00:00
qa_end: 2026-04-03 00:00:00
qa_result: PASS_WITH_RISK
qa_compliance: ✅ cross-QA completed; qa_tool != last_change_tool

# 收尾
log_file_path: doc/logs/Idx-017_log.md
<!-- EXECUTION_BLOCK_END -->