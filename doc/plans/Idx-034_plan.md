# Plan: Idx-034 — 單人營運正式層最小 deploy / backup / rollback contract

**Index**: Idx-034
**Created**: 2026-04-08
**Planner**: GitHub Copilot
**Phase**: Phase 1 → Governance
**Primary Module**: Flow governance
**Work Type**: docs-only governance / specification
**Operating Mode**: single-operator-production

---

## 🎯 目標

把目前分散在 operating mode baseline、CI / env baseline、post-launch runbook、backup sign-off checklist 與 migration governance 的最小正式層 deploy / backup / rollback 規則，收斂成一份可直接被後續 plan / log / review package 引用的單一 authority 入口。

---

## 📋 SPEC

### Goal

建立單人營運正式層的最小 formal contract authority，明確定義固定 deploy path、backup / restore fail-closed 欄位、rollback 最低限制與 secrets / audit 關係，同時保留既有 runbook / checklist 的權責分層。

### Business Context

- `Idx-033` 已正式採納 `單人營運正式層` 與 provider baseline，但 deploy / backup / rollback 的最小 contract 仍分散在多份 authority 與 runbook。
- `Idx-024` 目前唯一剩餘 blocker 是 external infra backup / restore sign-off；本輪需要把 fail-closed contract 收斂清楚，但不能假裝 blocker 已解除。
- 若沒有單一入口，後續 plan / log 很容易把「最小正式層 contract」與「full production ready」混寫，或另外長出平行 runbook。

### Non-goals

- 不修改任何 runtime code、schema、migration、deploy script 或 workflow implementation。
- 不新增 deploy automation、restore drill、RTO / RPO 回填、external infra evidence 或 production sign-off。
- 不擴張到 full production、多人輪值、DR / SRE 體系或 multi-operator governance。
- 不建立第二套平行 runbook；操作步驟仍回指既有 runbook / checklist。

### Acceptance Criteria

1. `doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md` 建立完成，且明確標示只適用單人營運正式層，不等於 full production ready。
2. 文檔內明確收斂固定 deploy path：GitHub -> GitHub Actions `release-preflight` / formal env preflight -> Cloud Run / Cloudflare 既有正式方向，並禁止 ad-hoc shell deploy、`db push` 與直接改寫正式資料庫。
3. 文檔內明確定義 backup / restore 最小 contract、external owner 必填欄位與 fail-closed 條件，並明示 `Idx-024` external infra sign-off 尚未完成。
4. 文檔內明確定義 rollback 最小 contract：目前沒有通用 destructive rollback API、允許的回退方式與停等點。
5. `doc/architecture/flows/README.md`、`doc/implementation_plan_index.md`、`doc/plans/Idx-034_plan.md` 與 `doc/logs/Idx-034_log.md` 都能引用這份 contract，且只改白名單檔案。

### Edge Cases

- contract 文檔可先完成，但這只代表最小 authority 入口已落地，不代表 `Idx-024` external infra sign-off 已完成。
- 若 provider-managed backup 工具、最近成功備份時間、restore owner、RTO / RPO 或 rehearsal evidence 任一欄位缺失，production release 仍必須 fail-closed。
- 若 release path 想繞過 GitHub Actions gate 改走本機 shell、手動 `psql`、`prisma db push` 或未留痕的 ad-hoc deploy，視為違反 formal contract。
- 若應用版本可回退但 migration / ledger 已前進，仍不得把 application revision rollback 誤寫成通用資料回滾能力。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `doc/implementation_plan_index.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/decisions/operating_mode_and_database_provider_baseline.md`
- `doc/architecture/decisions/ci_and_env_governance_baseline.md`
- `doc/architecture/flows/post_launch_ops_runbook.md`
- `doc/architecture/flows/production_backup_restore_signoff_checklist.md`
- `doc/architecture/flows/migration_governance_and_deployment_replay.md`
- `doc/plans/Idx-033_plan.md`
- `doc/logs/Idx-033_log.md`

### Missing Inputs

- external infra owner 的 backup tooling、最近成功備份時間、RTO / RPO 與 restore rehearsal evidence 尚未補齊；本輪只把缺口收斂成 fail-closed contract，不自行虛構內容。

research_required: false

### Assumptions

- VERIFIED - 本輪是 docs-only governance 任務，允許直接在白名單 markdown 檔案內建立 authority 文檔與 artifact。
- VERIFIED - `單人營運正式層` 是本輪唯一適用 operating mode，不同於 full production 或 `cross-mode-governance`。
- VERIFIED - 既有正式 deploy 方向仍是 GitHub + GitHub Actions gate + Cloud Run / Cloudflare，不存在可採信的平行 ad-hoc release path。
- VERIFIED - `Idx-024` 的 external infra backup / restore sign-off 仍需由外部 owner 與 checklist 回填，不能由本輪文檔完成取代。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: flow governance
- Adjacent modules: implementation planning、operating mode governance、CI / env governance、post-launch operations governance
- Out of scope modules: API runtime、Portal runtime、schema / migration、deploy automation、external infra provisioning、review approval execution

### File whitelist

- `doc/implementation_plan_index.md` - 新增 Idx-034 與更新統計
- `doc/plans/Idx-034_plan.md` - 建立正式 plan artifact
- `doc/logs/Idx-034_log.md` - 建立正式 log artifact
- `doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md` - 建立最小 formal contract authority
- `doc/architecture/flows/README.md` - 把新 contract 掛入正式導覽

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 本輪只收斂單人營運正式層 deploy / backup / rollback 的正式治理入口與引用鏈。
- 不修改任何 runtime workflow、approval path、migration state 或 release execution state。

#### RBAC IMPACT

- N/A

#### SHARED KEY / CROSS-MODULE IMPACT

- N/A

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- 本輪只在 authority 文檔中明文化 deploy / backup / rollback 必須保留的 audit / 留痕最低要求。

### Review Requirements

- Domain review: required
- Security review: required
- QA review: required
- 理由：本輪雖然是 docs-only governance，但命中正式 deploy path、backup / restore、rollback、secrets 與 audit 的高風險治理面。

### Done 定義

1. 新 contract authority 文檔已落地，並清楚界定單人營運正式層最小 contract 與既有 runbook / checklist 的分工。
2. `Idx-034` plan / log 已誠實記錄本輪只完成文件治理，不含 deploy automation、restore drill、RTO / RPO 回填或 production sign-off。
3. 所有變更都侷限於白名單檔案。
4. touched markdown 通過 focused validation，且新 contract 與反向引用鏈可被 grep 找到。

### Rollback 策略

- Level: L1
- 前置條件: 本輪僅改動 5 份白名單 markdown
- 回滾動作: 若 authority wording 或導覽位置被判定不清楚，回退本輪文檔變更並重新收斂 wording；不涉及 runtime rollback

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-034-single-operator-formal-deploy-backup-rollback-contract
  goal: land a single formal authority entry for the minimum single-operator formal deploy/backup/rollback contract without changing runtime code or relaxing the external infra blocker
  retry_budget: 4
  allowed_checks:
    - touched-file-lint
    - targeted-grep
  file_scope:
    - doc/implementation_plan_index.md
    - doc/plans/Idx-034_plan.md
    - doc/logs/Idx-034_log.md
    - doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md
    - doc/architecture/flows/README.md
  done_criteria:
    - formal contract authority exists and is linked from flows README and task artifacts
    - plan records docs-only governance scope, whitelist, non-goals, and review requirements
    - log records that external infra sign-off remains blocked
    - no file changes outside file_scope
  escalation_conditions:
    - request expands into runtime implementation or infra automation
    - authority conflicts with higher-priority governance docs
    - focused validation finds missing reference chain
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/implementation_plan_index.md` | 修改 | 新增 Idx-034 與更新統計 |
| `doc/plans/Idx-034_plan.md` | 新增 | 建立本輪正式計畫 |
| `doc/logs/Idx-034_log.md` | 新增 | 建立本輪執行紀錄 |
| `doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md` | 新增 | 建立單人營運正式層最小 contract authority |
| `doc/architecture/flows/README.md` | 修改 | 導覽新增 contract 入口 |

---

## 實作指引

### 1. Authority 分層

- 新文檔只收斂最小 contract，不重寫既有 runbook / checklist 細節。
- deploy path、backup sign-off 與 rollback 停等的操作細節一律回指既有 authority。

### 2. Wording 原則

- 必須明寫「可先完成 contract，但不代表 external infra sign-off 已完成」。
- 必須明寫「沒有通用 destructive rollback API」，避免讀者誤解為已有完整資料回滾能力。

### 3. 驗證

- 針對 5 份 touched markdown 執行 `get_errors`。
- 以 grep 確認新 contract 與既有 authority 的引用鏈存在。

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
operating_mode: [single-operator-production]
plan_created: [2026-04-08 00:00:00]
plan_approved: [docs-only governance task; white-list doc edits requested by user]
scope_policy: [strict]
expert_required: [false]
expert_conclusion: [N/A]
security_review_required: [true]
security_reviewer_tool: [Ivy Security Reviewer]
security_review_trigger_source: [formal deploy / backup / rollback governance]
security_review_trigger_matches: [deploy, backup, restore, rollback, secrets, audit]
security_review_start: [completed in external reviewer session; exact timestamp not captured in artifact]
security_review_end: [completed in external reviewer session; exact timestamp not captured in artifact]
security_review_result: [PASS_WITH_RISK]
security_review_conclusion: [governance-only contract has no infra enforcement layer; deploy trigger identity and role boundary remain undefined; Idx-024 backup/restore sign-off is still pending]
execution_backend_policy: [chat-primary-with-one-shot-reviewers]
executor_tool: [GitHub Copilot]
executor_backend: [copilot-chat-agent]
monitor_backend: [checkpoint-first-targeted-validation]
last_change_tool: [GitHub Copilot]
qa_tool: [Ivy QA Reviewer]
qa_review_start: [completed in external reviewer session; exact timestamp not captured in artifact]
qa_review_end: [completed in external reviewer session; exact timestamp not captured in artifact]
qa_review_result: [PASS_WITH_RISK]
qa_review_conclusion: [previous pending reviewer fields needed backfill; flows README missing Idx-034 tag is low-risk observation and does not justify scope expansion]
reviewer_outcome_summary: [Domain PASS_WITH_RISK: contract is still a minimum boundary declaration and should be cited together with post_launch_ops_runbook and production_backup_restore_signoff_checklist; Security PASS_WITH_RISK: no infra enforcement layer, deploy trigger identity or role boundary undefined, and Idx-024 sign-off still pending; QA PASS_WITH_RISK: reviewer status fields are now backfilled, while missing Idx-034 tag in flows README remains low risk only]
log_file_path: [doc/logs/Idx-034_log.md]
scope_exceptions: []
<!-- EXECUTION_BLOCK_END -->