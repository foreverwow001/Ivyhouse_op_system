# Plan: Idx-019

**Index**: Idx-019
**Created**: 2026-04-02
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: Platform / Persistence / Release
**Work Type**: implementation

---

## 目標

把 `Idx-011` 已恢復的正式 migration path 從「本機可驗證」提升到「可治理、可 replay、可交付」，補齊 migration governance、deployment replay evidence 與正式環境 preflight checklist。

---

## SPEC

### Goal

建立一套可被部署流程反覆使用的 migration governance 基線，至少涵蓋：

1. migration promotion / naming / review 規則
2. deployment replay evidence 與回放前置檢查
3. 正式環境前置表 / migration history / rollback 停等點

### Business Context

- `Idx-011` 已清除空 draft migration blocker，並在隔離 DB 上重跑 `prisma migrate deploy` 成功。
- 目前殘餘風險已明確集中在 deployment-level replay 與 migration governance，而不是 runtime 功能缺陷。
- 若沒有 promotion 與 replay 規則，未來 schema 變更仍可能在 staging / prod 因歷史資料、多人協作或前置表差異而失敗。

### Non-goals

- 不在本輪擴張 daily-ops 新功能。
- 不在本輪補完整 CI/CD pipeline。
- 不在本輪把所有環境自動化 provisioning 一次做完。

### Acceptance Criteria

1. migration governance 規則已正式文件化，至少包含命名、promotion、禁止事項與 reviewer 責任。
2. deployment replay 有至少一輪可重述 evidence 或等價演練紀錄。
3. 正式環境 preflight checklist 已定義，至少涵蓋 `DATABASE_URL`、migration history、前置表存在性與停等點。
4. rollback / hotfix migration 的例外處理條件已明確，不得靠口頭約定。

### Edge Cases

- 本機隔離 DB replay 成功，不代表 staging / prod 與舊資料狀態下同樣安全。
- migration 若依賴既有表、extensions 或 seed 順序，必須在 checklist 中明示。
- hotfix migration 若直接插入正式環境，必須有事後補登與 replay 可追溯性。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/architecture/flows/migration_governance_and_deployment_replay.md`
- `doc/architecture/phase1_mvp_three_phase_execution_plan.md`
- `doc/plans/Idx-011_plan.md`
- `doc/logs/Idx-011_log.md`
- `doc/plans/Idx-017_plan.md`
- `doc/logs/Idx-017_log.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/package.json`

### Missing Inputs

- migration governance 獨立權威文件尚未建立。
- deployment replay 的環境級 evidence 尚未固定成正式模板。
- rollback 後 schema / migration history readback 的標準步驟尚未文件化。

research_required: true

### Assumptions

- VERIFIED - `Idx-011` 的主要 blocker 已清除，後續風險集中在 governance 與 deployment replay。
- VERIFIED - `Idx-017` 將承接 deploy / rollback runbook，因此 `Idx-019` 必須提供 migration 專屬治理基線。
- RISK: unverified - staging / prod 是否有額外前置 extension、舊 migration history 或手動補丁，仍待正式盤點。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Platform / Persistence / Release
- Adjacent modules: Daily Ops、Operations Enablement
- Out of scope modules: Daily Ops 業務流程擴張、前端功能、財務模組

### File whitelist

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/package.json`
- `doc/architecture/flows/README.md`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/architecture/flows/migration_governance_and_deployment_replay.md`
- `doc/plans/Idx-019_plan.md`
- `doc/logs/Idx-019_log.md`

### Done 定義

1. migration governance 已有正式 artifact 可引用。
2. deployment replay 與 preflight checklist 已可支援 `Idx-017` runbook。
3. rollback / hotfix migration 例外處理已具備明確規則。

### Rollback 策略

- Level: L1
- 前置條件: 若治理文件與實際 replay 證據不一致，先回退文件結論，不回退既有已驗證程式事實。
- 回滾動作: 標記治理結論為 draft / blocked，移除錯誤 promotion / replay 指引並重新演練。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-019-migration-governance-deployment-replay
  goal: 建立 migration governance、deployment replay evidence 與 preflight checklist
  retry_budget: 4
  allowed_checks:
    - replay-rehearsal
    - migrate-deploy-check
    - runbook-readback
  file_scope:
    - apps/api/prisma/schema.prisma
    - apps/api/prisma/migrations/**
    - apps/api/package.json
    - doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md
    - doc/plans/Idx-019_plan.md
    - doc/logs/Idx-019_log.md
  done_criteria:
    - migration governance 已文件化
    - deployment replay evidence 已建立
    - preflight checklist 已可重用
    - no file changes outside file_scope
  escalation_conditions:
    - 正式環境 migration history 與本機驗證差異過大
    - 需補外部系統或 DBA 流程決策
    - retry budget exhausted
```

---

## 注意事項

- 本任務命中 schema、migration、deploy、rollback 高風險面，正式執行必須補 Security Review、Domain Review 與 Evidence gate。
- 不得把單次 local replay 當成正式 deployment governance。
- 若需要新增 migration governance 權威文件，必須回掛 architecture 入口並與 `Idx-017` runbook 對齊。

## 2026-04-02 Artifact 啟動結論

### 本輪確認結果

- 本輪只建立 `Idx-019` plan/log artifact，不直接進入程式或 migration 實作。
- `Idx-019` 直接承接 `Idx-011` 的 PASS_WITH_RISK 殘餘風險與 `Idx-017` 的 deploy / rollback runbook 需求。

### 下一步預計切口

1. 先盤點 migration governance 應掛在哪一份權威文件。
2. 再定義 deployment replay 與 preflight checklist 的 evidence 格式。
3. 最後才進入必要的文件與腳本補強。

## 2026-04-03 正式啟動與第一輪 evidence

### 本輪執行結果

- 已新增 `doc/architecture/flows/migration_governance_and_deployment_replay.md`，作為 migration governance 與 deployment replay 的權威入口。
- 已把該文件掛回 `doc/architecture/flows/README.md`，避免治理規則只留在 plan/log。
- 已完成第一輪最小 deployment replay evidence：乾淨測試 DB 上重跑 `migrate deploy`、`seed`、opening balance smoke、mainline smoke 與 migration / audit / ledger readback。

### 本輪確認結論

1. migration governance 應獨立於 `Idx-017` runbook，作為跨 work unit 共用規則。
2. deployment replay 最小證據至少要同時包含 migration history、bootstrap `AuditLog` 與 smoke / ledger readback。
3. 正式 destructive rollback API 尚未存在，文件必須維持誠實揭露，不得把 revision / rerun 說成通用 rollback。

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: 2026-04-02 00:00:00
plan_approved: 2026-04-02 00:00:00
scope_policy: strict
expert_required: true
expert_conclusion: migration 問題已從功能 blocker 轉成治理與部署可靠性問題，需獨立 work unit 收斂
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: path-rule
security_review_trigger_matches:
  - schema
  - migration
  - deploy
  - rollback
security_review_start: 2026-04-03 00:00:00
security_review_end: 2026-04-03 00:00:00
security_review_result: PASS_WITH_RISK
security_review_conclusion: migration governance 與 replay evidence 已成立，但正式環境 migration history、extension 與 hotfix 差異仍待 go-live 前最後驗證；此風險需由 Idx-018 sign-off 管理
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
session_id: idx-019-governance-replay
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
log_file_path: doc/logs/Idx-019_log.md
<!-- EXECUTION_BLOCK_END -->