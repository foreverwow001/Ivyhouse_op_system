# Plan: Idx-011

**Index**: Idx-011
**Created**: 2026-04-02
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: Platform / Persistence
**Work Type**: implementation

---

## 目標

收斂 Prisma migration 衛生與 release-safe schema path，移除目前只靠 `prisma db push` 才能過 smoke 的暫行狀態，恢復新環境可正式 `prisma migrate deploy` 的可交付路徑。

---

## SPEC

### Goal

建立可被 release、smoke、bootstrap 共用的正式 migration path，並把 draft migration、測試 DB bootstrap 與 schema 漂移風險收斂成單一路徑。

### Business Context

- 目前 inventory-count smoke 已可跑通，但依賴 isolated DB + `prisma db push` workaround。
- 只要 migration path 還不穩定，後續 opening balance、部署 runbook 與 E2E evidence 都建立在脆弱前提上。
- 本任務是 Phase 1 的技術 blocker 清理，不是新功能開發。

### Non-goals

- 不在本輪擴張 daily-ops 新功能範圍。
- 不在本輪補齊所有資料模型重構。
- 不在本輪把 production seed、opening balance 或 RBAC 一起做完。

### Acceptance Criteria

1. 新環境可成功執行 `prisma migrate deploy`，不再被空 migration 目錄或 draft path 阻斷。
2. 測試 DB bootstrap 策略已收斂，並明確區分 release 路徑與 test-only 路徑。
3. migration hygiene 清單已文件化，明確說明哪些 migration 可保留、哪些需整併、哪些不得進 release。
4. inventory smoke 或等價驗證可在正式 migration path 下通過至少一次。

### Edge Cases

- draft migration 可能已被本地 smoke 或文件引用，不能只刪目錄不補替代說明。
- 若 schema 與現有 smoke fixture 存在隱性漂移，需同時調整 fixture 或 bootstrap 策略。
- 若 release path 與 local dev path 需要不同策略，必須明寫切換條件與禁止事項。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/phase1_mvp_three_phase_execution_plan.md`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/package.json`
- `apps/api/test/inventory-count-api-smoke.js`

### Missing Inputs

- 正式 production / staging migration promotion 規則尚未文件化。
- 目前 migration 目錄的治理規則與命名慣例未獨立成文。

research_required: true

### Assumptions

- VERIFIED - `20260401183000_daily_ops_persistence_draft` 目前會阻斷 `prisma migrate deploy`。
- VERIFIED - inventory smoke 已證明功能路徑可運作，但 release path 尚未被正式驗證。
- RISK: unverified - 其他未使用到的 Prisma model 是否也受相同 migration 衛生問題影響，仍待掃描。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Platform / Persistence
- Adjacent modules: Daily Ops、Inventory、Test Infrastructure
- Out of scope modules: Finance、Intake runtime 行為調整

### File whitelist

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/package.json`
- `apps/api/test/inventory-count-api-smoke.js`
- `apps/api/test/helpers/inventory-count-smoke-fixture.js`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/plans/Idx-011_plan.md`
- `doc/logs/Idx-011_log.md`

### Done 定義

1. 正式 migration path 已可被執行與解釋。
2. test bootstrap 與 release bootstrap 的界線已文件化。
3. 本 work unit 的變更未超出 whitelist。

### Rollback 策略

- Level: L3
- 前置條件: 若新 migration path 造成既有 smoke、fixture 或開發環境不可用，需可回退到前一個可工作的 schema 版本。
- 回滾動作: 回退新增 / 調整的 migration、恢復 package script 與 smoke bootstrap，並在 log 中記錄失敗原因。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-011-migration-hygiene-release-safe-path
  goal: 恢復正式 prisma migrate deploy 路徑，移除 smoke 對 db push workaround 的依賴
  retry_budget: 5
  allowed_checks:
    - prisma-migrate-deploy
    - prisma-validate
    - inventory-smoke
  file_scope:
    - apps/api/prisma/schema.prisma
    - apps/api/prisma/migrations/**
    - apps/api/package.json
    - apps/api/test/inventory-count-api-smoke.js
    - apps/api/test/helpers/inventory-count-smoke-fixture.js
    - doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md
    - doc/plans/Idx-011_plan.md
    - doc/logs/Idx-011_log.md
  done_criteria:
    - prisma migrate deploy 可在新環境成功執行
    - migration hygiene 清單已落檔
    - inventory smoke 已在正式 migration path 下通過
    - no file changes outside file_scope
  escalation_conditions:
    - schema drift 影響非 daily-ops 模組
    - migration replay 失敗且無法局部修復
    - retry budget exhausted
```

---

## 注意事項

- 本任務屬 schema / migration 高風險面，正式執行時必須補 Security Review 與 Domain Review。
- 不得以長期保留 `db push` workaround 取代正式 release path。
- 若需新增 ADR 或 migration governance 文件，必須回掛 architecture 入口。

## 2026-04-02 正式執行策略

### 已確認前提

- `apps/api/prisma/migrations/20260401183000_daily_ops_persistence_draft/` 目前存在，且與 smoke 改走 `prisma db push` 的 workaround 直接相關。
- 目前 shell 未設定 `DATABASE_URL`，因此正式 `prisma migrate deploy` 驗證需先建立隔離測試 DB。
- 本機可用 PostgreSQL server binary 位於 `/usr/lib/postgresql/15/bin/initdb` 與 `/usr/lib/postgresql/15/bin/pg_ctl`。

### 本輪執行順序

1. 建立 workspace-local PostgreSQL 測試叢集與乾淨測試 DB。
2. 以現況重跑 `npm run prisma:migrate:deploy`，確認直接 blocker。
3. 收斂 draft migration / 正式 migration path。
4. 以正式 migration path 重跑 inventory smoke。
5. 回填 migration hygiene 決策、證據與 rollback 說明。

### 第一個可否證假設

- 假設：空的 draft migration 目錄是正式 `migrate deploy` 無法成立的主要 blocker；只要收斂到單一路徑，release-safe path 可恢復。
- 便宜檢查：在乾淨測試 DB 上重跑 `npm run prisma:migrate:deploy`；若失敗主因不是 draft migration，而是 schema / SQL 本身，則立即改寫實作路徑。

## 2026-04-02 修正輪判定

- 本輪針對 reviewer findings 重新檢查後，未發現需要立即修改的 `Idx-011` 程式碼缺陷。
- `Idx-011` 目前保留的風險屬 deployment replay、migration governance 與正式環境驗證，應在後續 runbook / go-live 工作單收斂。

## 後續補強子任務

- `Idx-019`：Migration governance 與 deployment replay 補強
  - 補 migration governance 規則與命名 / promotion 準則
  - 建立 deployment-level replay evidence 與前置表檢查清單

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: 2026-04-02 00:00:00
plan_approved: 2026-04-02 00:00:00
scope_policy: strict
expert_required: true
expert_conclusion: 需先清除 migration blocker，後續 opening balance、部署與 E2E 驗收才有可信基線
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: path-rule
security_review_trigger_matches:
  - schema
  - migration
security_review_start: 2026-04-02 00:00:00
security_review_end: 2026-04-02 00:00:00
security_review_result: PASS_WITH_RISK
security_review_conclusion: 正式 migrate deploy 已恢復，但仍需後續部署環境驗證與 migration governance 文件化
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
session_id: idx-011-local-postgres-validation
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
log_file_path: doc/logs/Idx-011_log.md
<!-- EXECUTION_BLOCK_END -->