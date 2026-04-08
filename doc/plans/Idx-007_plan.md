# Plan: Idx-007

**Index**: Idx-007
**Created**: 2026-04-03
**Planner**: @GitHubCopilot
**Phase**: Phase 0
**Primary Module**: Platform / Engineering Foundation
**Work Type**: governance
**Track**: product-system

---

## 🎯 目標

正式開啟 Ivyhouse OP System 的技術基線與專案 bootstrap work unit，把目前散落在 `project_rules.md`、`project_overview.md` 與既有 Phase 1 runbook 的技術前提收斂為可引用的權威文件與 artifact 鏈。這輪先解決「技術基線已選定，但 repo 內沒有正式 work unit 與 baseline 文件承接」的問題，而不是假裝完整前後端應用骨架都已完成。

---

## 📋 SPEC

### Goal

建立 `Idx-007` 的正式 plan/log artifact 與第一版技術基線文件，明確定義目前已落地的 bootstrap 骨架、正式技術邊界與 deferred 缺口。

### Business Context

- 屬於 Phase 0 implementation-ready 收斂主線。
- 使用角色為 Planner、Engineer、QA、Security / Domain reviewer 與後續 deploy / bootstrap work unit owner。
- 若沒有正式技術基線文件，後續 work unit 會持續在「可否另起框架 / app skeleton 是否已存在 / migration path 是否屬正式 bootstrap」上反覆猜測。

### Non-goals

- 不在本輪建立完整 `apps/web` 或內部後台 UI。
- 不在本輪新增 Docker Compose、Cloud Run manifest 或 observability runtime wiring。
- 不在本輪宣稱完整產品應用 bootstrap 已全部完成。

### Acceptance Criteria

1. `Idx-007` 已建立正式 plan/log artifact，implementation index 狀態可由 `Planning` 轉為 `In Progress`。
2. 已有一份權威文件收斂正式技術棧、workspace / bootstrap 路徑、repo 現況與 deferred 缺口。
3. 文件明確限制後續 work unit 不得另起平行技術棧、平行 bootstrap 路徑或把 deferred 寫成已完成。

### Edge Cases

- repo 目前僅有 `apps/api`，沒有 `apps/web` -> 必須誠實標示 frontend skeleton deferred，而不是虛報 bootstrap 已完成。
- `Idx-011` 之後的 migration / bootstrap runbook 已存在 -> 本輪應承接並統一引用，不得重寫平行部署規則。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/README.md`
- `doc/architecture/project_overview.md`
- `doc/architecture/decisions/README.md`
- `doc/architecture/phase1_mvp_scope.md`
- `doc/architecture/phase1_mvp_three_phase_execution_plan.md`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/architecture/flows/migration_governance_and_deployment_replay.md`
- root `package.json`
- `apps/api/package.json`

### Missing Inputs

- `apps/web` 或等價 frontend skeleton 尚未建立。
- Docker Compose、Cloud Run manifest、observability runtime wiring 尚未作為 repo-native artifact 正式落地。

research_required: true

### Sources

- repo 內正式權威文件與 workspace package / app 結構
- `apps/api` 已存在的 NestJS + Prisma runtime skeleton 與 script

### Assumptions

- VERIFIED - 技術棧已由 `project_rules.md` 正式採納。
- VERIFIED - repo 目前只有 `apps/api`，沒有 frontend app skeleton。
- VERIFIED - `Idx-011`、`Idx-017`、`Idx-019` 等 work unit 已產出 migration / bootstrap / deploy runbook，可作為 `Idx-007` 的下游證據，而非上游替代文件。
- RISK: unverified - 後續是否要以 `apps/web` 為唯一前端 package 名稱，仍待後續 frontend work unit 定案。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Platform / Engineering Foundation
- Adjacent modules: Daily Ops、Deployment / Bootstrap、Architecture Decisions
- Out of scope modules: Finance / Reconciliation、Intake runtime、frontend UI implementation

### File whitelist

- `doc/architecture/decisions/technical_baseline_and_project_bootstrap.md` - 建立第一版技術基線與 bootstrap 權威文件
- `doc/architecture/decisions/README.md` - 掛上新基線文件入口
- `doc/implementation_plan_index.md` - 將 Idx-007 狀態轉為 `In Progress`
- `doc/plans/Idx-007_plan.md` - 建立正式 plan artifact
- `doc/logs/Idx-007_log.md` - 建立正式 log artifact

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A，本輪不改主資料字典或 shared key。

#### STATE / WORKFLOW IMPACT

- 不直接改業務流程 state machine。
- 只收斂技術 bootstrap 與 deploy / migration 路徑的正式引用邊界。

#### RBAC IMPACT

- N/A，本輪不改 RBAC；僅記錄 frontend / auth shell 尚未建立。

#### SHARED KEY / CROSS-MODULE IMPACT

- 會影響後續 work unit 對 workspace package、migration path 與 bootstrap 路徑的引用方式。
- 不得再讓後續 task 自行另起平行技術棧或未納管 app skeleton。

#### FINANCE / RECONCILIATION IMPACT

- N/A，本輪不碰財務控制邊界。

#### OBSERVABILITY / AUDIT IMPACT

- 收斂 observability baseline 的採納狀態與 deferred 缺口，避免後續把 logging / tracing / audit wiring 誤判為已完成。

### Done 定義

1. `Idx-007` 已正式進入 implementation index 與 plan/log artifact 鏈。
2. 權威文件已明確說明技術棧、repo 現況骨架與 deferred 邊界。
3. 本輪變更未超出 whitelist，且未虛報 frontend / deploy / observability 已完成。

### Rollback 策略

- Level: L1
- 前置條件: 本輪僅涉及文件與 artifact。
- 回滾動作: 回退 `Idx-007` plan/log、index 與技術基線文件。

### Max rounds

- 估計: 1
- 超過處理: 若需要直接建立 frontend / infra artifact，拆成下一輪 implementation work unit，不在本輪硬擴張。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-007-technical-baseline-bootstrap-v1
  goal: 建立技術基線與專案 bootstrap 第一版權威文件與 artifact 鏈
  retry_budget: 3
  allowed_checks:
    - plan-validator
    - touched-file-lint
  file_scope:
    - doc/architecture/decisions/technical_baseline_and_project_bootstrap.md
    - doc/architecture/decisions/README.md
    - doc/implementation_plan_index.md
    - doc/plans/Idx-007_plan.md
    - doc/logs/Idx-007_log.md
  done_criteria:
    - Idx-007 artifact 鏈已建立
    - 技術基線與 bootstrap 權威文件已建立
    - deferred 邊界已明確標示
    - no file changes outside file_scope
    - engineer result is ready for external review
  escalation_conditions:
    - scope break
    - need to create runtime frontend or infra artifact
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/architecture/decisions/technical_baseline_and_project_bootstrap.md` | 新增 | 建立第一版技術基線與 bootstrap 權威文件 |
| `doc/architecture/decisions/README.md` | 修改 | 掛上新文件入口 |
| `doc/implementation_plan_index.md` | 修改 | 將 Idx-007 轉為 `In Progress` |
| `doc/plans/Idx-007_plan.md` | 新增 | 正式 plan artifact |
| `doc/logs/Idx-007_log.md` | 新增 | 正式 log artifact |

## 實作指引

### 1. 模組與資料層

- 本輪只處理技術基線與 bootstrap 權威文件，不建立平行技術決策來源。
- 後續 runtime / infra work unit 必須引用這份 baseline，而不是各自重寫一套 bootstrap 假設。

### 2. 流程與權限

- 不得把文件收斂誤寫成完整 app bootstrap 已完成。
- 若後續需要 frontend / deploy / observability runtime 落地，應拆獨立 task 與 review。

### 3. 介面與驗證

- 以權威文件一致性、workspace 現況與 implementation index 對齊作為驗證方式。
- 不在本輪執行 runtime build / deploy 作為完成條件。

## 注意事項

- 風險提示: 若把 `Idx-007` 寫成已完成完整前後端骨架，會直接與 repo 現況衝突。
- 資安考量: 本輪不碰 secret、auth runtime 或 deploy credentials，但 deploy / observability 基線仍屬高風險技術面，後續落地時需 review。
- 相依性: 依賴 `project_rules.md` 與既有 migration / bootstrap runbook。
- 缺漏前提: frontend skeleton、container artifact 與 observability wiring 尚未正式落地。

## 相關資源

- `project_rules.md`
- `doc/architecture/project_overview.md`
- `doc/architecture/phase1_mvp_three_phase_execution_plan.md`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/architecture/flows/migration_governance_and_deployment_replay.md`

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: 2026-04-03 17:35:00
plan_approved: 2026-04-03 17:35:00
scope_policy: strict
expert_required: true
expert_conclusion: 需先把 repo 已採納的技術棧與 bootstrap 邊界收斂成正式 artifact，後續 work unit 才有一致前提
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
executor_start: 2026-04-03 17:35:00
executor_end: 2026-04-03 17:35:00
session_id: idx-007-governance-open
last_change_tool: copilot-cli

# QA 執行
qa_tool: pending-cross-qa
qa_tool_version: N/A
qa_user: N/A
qa_start: N/A
qa_end: N/A
qa_result: PASS_WITH_RISK
qa_compliance: ⚠️ 例外：本輪為正式開案與文件收斂，尚未進入關帳 QA
<!-- EXECUTION_BLOCK_END -->