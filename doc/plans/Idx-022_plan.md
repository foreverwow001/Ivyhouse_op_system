# Plan: Idx-022

**Index**: Idx-022
**Created**: 2026-04-03
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: Daily Ops / Production Planning / Approval
**Work Type**: implementation
**Track**: product-system

---

## 目標

補齊 production-planning 的完整 approval persistence，讓 create / revise / rerun 不只具 formal principal，而是具備可稽核的 maker-checker 狀態與 `管理員` 最終 approver 邊界，並依 `Idx-018` operating envelope 做一次 deploy preflight 實地記錄。

---

## SPEC

### Goal

建立 production-planning 的第二輪正式 auth / approval 切片，至少覆蓋：

1. plan create / revise 的 approval persistence 與 approve / reject 決策端點
2. rerun bom request 的 approval persistence 與 approve / reject 決策端點
3. `管理員` 僅可作 maker / requestor，不得作高風險業務最終 approver
4. 依 `Idx-018_log.md` operating envelope 完成一份本機 / 測試叢集 deploy preflight 記錄

### Business Context

- `Idx-021` 已把 production-planning 切到 Portal principal，但 sign-off 已明列其完整 approval persistence 尚未落地。
- [roles README](/workspaces/Ivyhouse_op_system/doc/architecture/roles/README.md) 已明定 `管理員` 不得作高風險業務最終 approver。
- 若 production-planning 的 create / revise / rerun 仍沒有可持久化的 approval state，就無法和 inventory-count 保持一致的高風險治理水位。

### Non-goals

- 不在本輪擴張到全系統 approval engine 或共用 approval table。
- 不在本輪補 destructive rollback API。
- 不在本輪處理 `Idx-020` 多窗口 / 中斷補救實作。

### Acceptance Criteria

1. production-planning 的 create / revise / rerun 均可追溯 maker、approver、approvalStatus、approvalDecidedAt 與 singlePersonOverride。
2. `管理員` 可提交 request，但若不具 `主管` 身分，不得完成最終 approval。
3. BOM reservation 只在 approval 成立後才寫入正式庫存事件，拒絕或待批不應產生誤寫入。
4. focused smoke、mainline 或 regression 對應 slice 已更新並通過。
5. deploy preflight 實地記錄已落到 plan/log artifact，且與 `Idx-018` operating envelope 一致。

### Edge Cases

- 同一 principal 同時具有 `主管 + 管理員` 時，可批准，但必須依 `主管` 邊界判定，且若 maker=approver 要留下 `single_person_override`。
- revision proposal 未批准前，不得污染已生效 plan 的正式 BOM reservation。
- rerun request 若被拒絕，不得寫入 ledger，也不得假裝完成 execution。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/roles/README.md`
- `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`
- `doc/architecture/flows/daily_ops_engineering_breakdown.md`
- `doc/plans/Idx-018_plan.md`
- `doc/logs/Idx-018_log.md`
- `doc/plans/Idx-021_plan.md`
- `doc/logs/Idx-021_log.md`
- `apps/api/src/daily-ops/production-planning/**`
- `apps/api/prisma/schema.prisma`
- `apps/api/test/production-plan-rerun-regression-smoke.js`
- `apps/api/test/daily-ops-mainline-e2e-smoke.js`

### Assumptions

- VERIFIED - production-planning 的 actor 已正式切到 Portal principal。
- VERIFIED - `管理員` 不得作高風險業務最終 approver，但可保留 maker / requestor 能力。
- VERIFIED - deploy preflight 先以本機 / 測試叢集做正式記錄；不預設可存取正式環境。

research_required: true

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Daily Ops / Production Planning / Approval
- Adjacent modules: Audit、Inventory Ledger、Prisma Schema、Release Governance
- Out of scope modules: destructive rollback API、opening balance 多窗口治理、全系統 approval engine

### File whitelist

- `apps/api/src/daily-ops/production-planning/**`
- `apps/api/src/audit/**`
- `apps/api/prisma/**`
- `apps/api/test/production-plan-rerun-regression-smoke.js`
- `apps/api/test/daily-ops-mainline-e2e-smoke.js`
- `doc/implementation_plan_index.md`
- `doc/architecture/roles/README.md`
- `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`
- `doc/architecture/flows/daily_ops_engineering_breakdown.md`
- `doc/plans/Idx-022_plan.md`
- `doc/logs/Idx-022_log.md`

### Done 定義

1. production-planning approval persistence 與決策端點已落地。
2. `管理員` 最終 approver 邊界已被程式與測試明確驗證。
3. deploy preflight 記錄已正式落檔。

### Rollback 策略

- Level: L3
- 前置條件: 若 approval gating 導致既有 mainline / regression 失效，可回退 production-planning 新增 approval schema、端點與 guard 行為，保留 artifact 與風險紀錄。
- 回滾動作: 回退新增 approval 欄位、決策端點、更新過的 smoke / regression，恢復至 `Idx-021` 的 principal-only 狀態。

---

## 注意事項

- 本任務命中 auth、approval、RBAC、inventory ledger 與 schema 高風險面，必須補 Security Review 與 Domain Review。
- BOM reservation 不得在 approval 未成立前偷跑寫入 ledger。
- deploy preflight 本輪僅限本機 / 測試叢集正式記錄；若要擴到正式環境，需另具備可用連線與操作前提。

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: 2026-04-03 15:20:00
plan_approved: 2026-04-03 15:20:00
scope_policy: strict
expert_required: true
expert_conclusion: production-planning 若只有 formal principal 而無 approval persistence，仍無法滿足高風險 maker-checker 治理閉環
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: path-rule
security_review_trigger_matches:
  - approval
  - permission
  - inventory
  - schema
security_review_start: 2026-04-03 15:37:00
security_review_end: 2026-04-03 15:44:00
security_review_result: PASS_WITH_RISK
security_review_conclusion: final Explore review 確認 rejection 不寫 ledger、supervisor approver 邊界已落地、schema與service一致；殘餘 revision 鏈長與 admin+supervisor 交集政策列為後續治理
execution_backend_policy: pty-primary-with-consented-fallback
scope_exceptions: []

# Engineer 執行
executor_tool: copilot-cli
executor_backend: pty-primary
monitor_backend: manual_confirmation
executor_tool_version: GPT-5.4
executor_user: GitHub Copilot
executor_start: 2026-04-03 15:20:00
executor_end: 2026-04-03 15:45:30
session_id: 01ed7b0f-14c3-4668-9363-2143b6da0901
last_change_tool: copilot-cli

# QA 執行
qa_tool: Explore
qa_tool_version: GPT-5.4
qa_user: Explore
qa_start: 2026-04-03 15:37:00
qa_end: 2026-04-03 15:44:00
qa_result: PASS_WITH_RISK
qa_compliance: qa_tool != last_change_tool satisfied

# 收尾
log_file_path: doc/logs/Idx-022_log.md
<!-- EXECUTION_BLOCK_END -->