# Plan: Idx-035 — 單人營運正式層 release-preflight 觸發者身份與角色邊界

**Index**: Idx-035
**Created**: 2026-04-08
**Planner**: GitHub Copilot
**Phase**: Phase 1 → Governance
**Primary Module**: Release governance
**Work Type**: docs-only governance / specification
**Track**: product-system
**Operating Mode**: single-operator-production

---

## 目標

以最小 authority 補齊 `單人營運正式層` 的 `release-preflight` 觸發者身份與角色邊界，避免把 `workflow_dispatch`、既有 GitHub surface 或系統管理權限誤解成任何人都可正式按下。

---

## SPEC

### Goal

建立 `release-preflight` 的 `authorized actor boundary`：

- staging：只能由被指派的 `Release operator` 觸發，`Backend owner` 只協助判讀
- production：只能由被指派的 `Release owner` 觸發，且 backup / restore checklist 未完整時不得按下，必須 fail-closed
- `Release owner`、`Release operator` 只是 release assignment label，不是新的 app RBAC 正式角色

### Business Context

- `Idx-034` 已收斂單人營運正式層的 deploy / backup / rollback 最小 contract，但 `release-preflight` 的正式觸發者身份仍未被單獨寫清楚。
- 若沒有這個邊界，讀者容易把 `workflow_dispatch`、`系統管理`、或一般 GitHub 介面存取誤判為正式 trigger authority。
- 單人營運允許同一人同時承擔多個 assignment，但仍必須保留 audit 與責任留痕，不能因為同一人兼任就把邊界寫模糊。

### White List

- `doc/implementation_plan_index.md`
- `doc/plans/Idx-035_plan.md`
- `doc/logs/Idx-035_log.md`
- `doc/architecture/roles/README.md`
- `doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md`
- `doc/architecture/flows/post_launch_ops_runbook.md`
- `doc/architecture/decisions/ci_and_env_governance_baseline.md`

### Non-goals

- 不修改任何 runtime code、workflow yaml、schema、migration、deploy script 或其他文件。
- 不新增 GitHub 權限 enforcement、environment approval、branch protection 或 workflow-level technical guard。
- 不建立第二套平行角色模型，也不把 `Release owner` / `Release operator` 擴張成 app RBAC 新角色。
- 不把 `管理員` / `系統管理` 直接視為 production trigger 的自動放行來源。
- 不解除 `Idx-024` external infra blocker，不宣稱 production backup / restore sign-off 已完成。

### Acceptance Criteria

1. `doc/implementation_plan_index.md` 新增 `Idx-035`，並標記本輪是 docs-only governance 收斂。
2. `doc/architecture/roles/README.md` 新增小節，明確定義 `Release owner` / `Release operator` 是 release assignment label，不是 app RBAC 正式角色。
3. `doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md` 與 `doc/architecture/flows/post_launch_ops_runbook.md` 都明確寫出 staging / production 的 `authorized actor boundary`。
4. `doc/architecture/decisions/ci_and_env_governance_baseline.md` 補 cross-reference，避免把 `workflow_dispatch` 誤讀成任何人都能正式使用。
5. `doc/logs/Idx-035_log.md` 誠實記錄本輪只補身份邊界，不含 GitHub 權限 enforcement 或 production sign-off。

### Edge Cases

- 單人營運下，同一人可同時承擔 `Release owner`、`Release operator`、`Backend owner` 或其他正式角色，但每次實際觸發仍要保留 acting assignment 與 audit 留痕。
- `Backend owner` 可以協助 staging / production 的 readback 判讀，但這不自動賦予 trigger authority；除非該人同時被正式指派為對應 assignment。
- production 若 backup / restore checklist 任一必填欄位未完整，即使已有 `Release owner` 指派也不得按下 `release-preflight`。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `doc/implementation_plan_index.md`
- `doc/architecture/roles/README.md`
- `doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md`
- `doc/architecture/flows/post_launch_ops_runbook.md`
- `doc/architecture/decisions/ci_and_env_governance_baseline.md`
- `doc/plans/Idx-034_plan.md`
- `doc/logs/Idx-034_log.md`

research_required: false

### Assumptions

- VERIFIED - 本輪是 docs-only governance 任務，允許直接在白名單 markdown 落權威用語與 artifact。
- VERIFIED - `Release owner`、`Release operator` 的正確定位是 release assignment label，不是 app RBAC 新角色。
- VERIFIED - `workflow_dispatch` 只是 workflow surface，不是正式 trigger authority 定義來源。
- VERIFIED - `Idx-024` external infra blocker 仍然存在，本輪不能以文件補字取代外部 sign-off。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: release governance
- Adjacent modules: RBAC governance、single-operator formal contract、post-launch ops governance、CI / env governance
- Out of scope modules: runtime auth、GitHub permission enforcement、workflow implementation、production sign-off execution

### Review Requirements

- Domain review: required
- Security review: required
- QA review: required
- 理由：本輪雖為 docs-only governance，但命中 release trigger identity、production fail-closed 與 audit 邊界，屬高風險治理文件。
- qa_compliance 例外：使用者已明確同意以獨立 reviewer agent 作為例外；本次 Engineer 修補只針對既有 reviewer findings 做 docs-only artifact 補修。

### Done 定義

1. 白名單文件已完成 `authorized actor boundary` 收斂，且用語一致。
2. `Release owner` / `Release operator` 已被明確界定為 release assignment label，而非新 RBAC 角色。
3. `Idx-035` log 已誠實記錄本輪未做 GitHub 權限 enforcement、production sign-off 與 external infra blocker 解除。
4. touched markdown 通過 focused validation；必要時以 grep 確認關鍵用語存在。

### Rollback 策略

- Level: L1
- 前置條件: 本輪只改 7 份白名單 markdown
- 回滾動作: 若用語被認定造成平行角色模型或授權誤讀，回退本輪文檔 wording 並重新收斂；不涉及 runtime rollback

---

## 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/implementation_plan_index.md` | 修改 | 新增 `Idx-035` 與更新統計 |
| `doc/plans/Idx-035_plan.md` | 新增 | 建立本輪 docs-only governance plan |
| `doc/logs/Idx-035_log.md` | 新增 | 建立本輪執行紀錄 |
| `doc/architecture/roles/README.md` | 修改 | 補 release assignment label 與 RBAC 邊界說明 |
| `doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md` | 修改 | 補 `authorized actor boundary` 與 production fail-closed 觸發條件 |
| `doc/architecture/flows/post_launch_ops_runbook.md` | 修改 | 補 staging / production 觸發者邊界與判讀支援責任 |
| `doc/architecture/decisions/ci_and_env_governance_baseline.md` | 修改 | 補 cross-reference，避免誤解 `workflow_dispatch` |

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
operating_mode: [single-operator-production]
track: [product-system]
plan_created: [2026-04-08 00:00:00]
plan_approved: [docs-only governance task; white-list doc edits requested by user]
scope_policy: [strict]
expert_required: [false]
expert_conclusion: [N/A]
security_review_required: [true]
domain_reviewer_tool: [Ivy Domain Expert]
domain_review_start: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
domain_review_end: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
domain_review_result: [PASS_WITH_RISK]
domain_review_conclusion: [release assignment label boundary is now explicit, but this slice remains governance-only and must still be cited together with the single-operator contract and post-launch ops runbook]
security_reviewer_tool: [Ivy Security Reviewer]
security_review_trigger_source: [release-preflight identity boundary governance]
security_review_trigger_matches: [release trigger, authorized actor boundary, production fail-closed, audit]
security_review_start: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
security_review_end: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
security_review_result: [PASS_WITH_RISK]
security_review_conclusion: [無 GitHub enforcement、workflow_dispatch 仍是 open surface，且 Idx-024 external infra checklist 仍需人工 fail-closed]
execution_backend_policy: [chat-primary-with-one-shot-reviewers]
executor_tool: [GitHub Copilot]
executor_backend: [copilot-chat-agent]
monitor_backend: [checkpoint-first-targeted-validation]
last_change_tool: [GitHub Copilot]
qa_tool: [Ivy QA Reviewer]
qa_review_start: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
qa_review_end: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
qa_review_result: [PASS_WITH_RISK]
qa_review_conclusion: [assignment 指派媒介未統一，且 ci baseline cross-reference 長句可讀性仍偏弱]
qa_compliance: [⚠️ 例外：使用者已明確同意以獨立 reviewer agent 作為例外；本次修補僅承接既有 reviewer findings，不在本輪由 Engineer 自行做最終 QA approval]
reviewer_outcome_summary: [Domain PASS_WITH_RISK: release assignment label boundary is now explicit but still depends on the single-operator contract and post-launch ops runbook; Security PASS_WITH_RISK: 無 GitHub enforcement、workflow_dispatch 仍是 open surface，且 Idx-024 external infra checklist 仍需人工 fail-closed; QA PASS_WITH_RISK: assignment 指派媒介未統一，且 ci baseline cross-reference 長句可讀性仍偏弱]
log_file_path: [doc/logs/Idx-035_log.md]
scope_exceptions: []
<!-- EXECUTION_BLOCK_END -->