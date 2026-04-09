# Plan: Idx-037 — release-preflight authorized actor boundary repo-native enforcement

**Index**: Idx-037
**Created**: 2026-04-08
**Planner**: GitHub Copilot
**Phase**: Phase 1 → Governance
**Primary Module**: Release governance
**Work Type**: repo-native enforcement / workflow guard
**Track**: product-system
**Operating Mode**: single-operator-production

---

## 目標

以最小 repo-native technical enforcement，把 `Idx-035` 已收斂的 `release-preflight` authorized actor boundary 從 docs-only governance 推進到 workflow fail-closed guard，避免未授權 actor、空白 evidence reference，或 production checklist 未過時仍可啟動正式 preflight。

---

## SPEC

### Goal

在 `.github/workflows/ci.yml` 新增 workflow_dispatch 專用、非 environment-bound 的 `release-preflight-guard` 前置 job，並讓 environment-bound 的 `release-preflight` 以 `needs` 依賴它；guard job 透過既有腳本 `tools/validate-release-preflight-guard.js` 實作以下最小 fail-closed enforcement：

- effective actor 以 `github.triggering_actor` 優先，否則 fallback `github.actor`
- staging / production allowlist 目前都只允許 `foreverwow001`
- `workflow_dispatch` 新增必填 `assignment_ref`
- `assignment_ref` 只能作為 evidence reference gate，不等於正式 assignment proof
- production 必須讀取 `doc/architecture/flows/production_backup_restore_signoff_checklist.md`，只有 `可允許 production promote = pass` 才放行
- guard summary 要寫入 `github.triggering_actor`、`github.actor`、`effective_actor`、target environment、assignment reference 與判定結果，且 `assignment_ref` 寫入前需做最小 Markdown escape，避免污染 `GITHUB_STEP_SUMMARY`

### Business Context

- `Idx-035` 已把 release-preflight authorized actor boundary 收斂成正式文檔規則，但 repo-native enforcement 的控制路徑若只掛在 quality-gate 或 environment-bound job 內第一個 step，仍會污染一般 CI，且無法在進入 environment-bound preflight 前先 fail-closed。
- `release-preflight` 不依賴 `quality-gate` 是本輪刻意的 scope 切割：本 task 只處理 authorized actor / `assignment_ref` / production checklist gate，不把一般 CI 成功與否混進 release authority decision。
- 這一輪是高風險 release / sign-off slice，但 scope 必須嚴格限制在 preflight guard，不擴成 full deploy automation、environment reviewer automation 或外部 sign-off 平台整合。
- `single-operator-production` 允許同一人兼任 `Release owner` / `Release operator`，目前保守 allowlist 只納入已在 checklist 明示的 `foreverwow001`。
- 依 `doc/architecture/decisions/operating_mode_and_database_provider_baseline.md` 的 defer policy，同一批 external infra / platform control evidence 若只存在於 `internal-testing` artifact，可誠實標記為 `deferred`；但本 plan 的 operating mode 是 `single-operator-production`，因此 required reviewers / branch protection 平台證據與 backup / restore evidence 仍只能列為未解除缺口，不能誤寫成已完成。
- production backup / restore checklist 目前仍為 fail-closed，因此 repo-native guard 應穩定阻擋 production `release-preflight`，直到外部 owner 補齊證據。
- 已知風險：workflow 的 global concurrency `cancel-in-progress: true` 可能在同一 ref 有新 push 時取消 `workflow_dispatch` 的 `release-preflight` / `release-preflight-guard`；本輪只誠實留痕，不調整 concurrency 策略。

### White List

- `.github/workflows/ci.yml`
- `tools/validate-release-preflight-guard.js`
- `doc/implementation_plan_index.md`
- `doc/plans/Idx-037_plan.md`
- `doc/logs/Idx-037_log.md`
- `doc/architecture/decisions/ci_and_env_governance_baseline.md`
- `doc/architecture/flows/post_launch_ops_runbook.md`

### Non-goals

- 不修改 `doc/architecture/roles/README.md` 或 `doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md`。
- 不新增 package dependency、deploy automation、GitHub Environment required reviewers automation、branch protection 驗證、org/team membership enforcement 或 external sign-off 平台接線。
- 不把 `assignment_ref` 假裝成正式 assignment proof，也不新增第二套 release assignment 契約。
- 不解除 `Idx-024` external infra blocker，不把 production checklist 的 `fail` 改寫成 `pass`。
- 不在 repo 內假裝解掉 checklist bypass path；該路徑維持 external / platform residual risk。

### Acceptance Criteria

1. `.github/workflows/ci.yml` 的 `workflow_dispatch` 維持 required `assignment_ref` input。
2. workflow 內新增獨立的 `release-preflight-guard` job，僅在 `workflow_dispatch` 下執行，且不綁 environment。
3. `release-preflight` job 明確 `needs: release-preflight-guard`，先通過 guard 再進入 environment-bound preflight。
4. `quality-gate` 不再包含 guard step，也不再受 `assignment_ref` / `target_environment` 影響；這是本輪刻意 scope 切割，不把一般 CI success signal 混入 release authority decision。
5. guard 腳本會 fail-closed 檢查 effective actor、allowlist、非空白 `assignment_ref`，以及 production checklist 狀態，且若有 `GITHUB_STEP_SUMMARY` 會對 `|`、`<`、`>`、backtick、CR、LF 做最小安全處理後再寫入 `github.triggering_actor`、`github.actor`、`effective_actor`、target environment、assignment_ref 與判定結果。
6. `doc/architecture/decisions/ci_and_env_governance_baseline.md`、`doc/architecture/flows/post_launch_ops_runbook.md` 與 `doc/logs/Idx-037_log.md` 會同步改成新的 job sequencing，誠實標示 repo 內 guard 與 repo 外 follow-up。
7. GitHub Environment required reviewers / branch protection 的實際設定值，本輪只可標記為 repo 外控制面與 external follow-up，不可在 repo 內宣稱已驗證。

### Edge Cases

- 若 `github.triggering_actor` 缺值，guard 必須 fallback 到 `github.actor`，而不是直接放行。
- 若 target environment 非 `staging` / `production`，guard 必須 fail-closed。
- 若 checklist 行不存在、值不可解析，或 checklist 檔案無法讀取，guard 必須把 production 視為 deny，且輸出結構化 deny 訊息而不是 raw stack trace。
- 若 `GITHUB_STEP_SUMMARY` 不存在，guard 仍必須輸出 stderr/stdout 並正常 fail/pass。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `.github/workflows/ci.yml`
- `doc/implementation_plan_index.md`
- `doc/architecture/decisions/ci_and_env_governance_baseline.md`
- `doc/architecture/flows/post_launch_ops_runbook.md`
- `doc/architecture/flows/production_backup_restore_signoff_checklist.md`
- `doc/plans/Idx-035_plan.md`
- `doc/logs/Idx-035_log.md`

research_required: false

### Assumptions

- VERIFIED - 本輪已取得 Coordinator 正式確認，可直接修改白名單檔案並完成 focused validation。
- VERIFIED - 本輪 operating mode 是 `single-operator-production`，allowlist 暫只允許 `foreverwow001`。
- VERIFIED - `assignment_ref` 只能是 evidence reference gate，不等於正式 assignment proof。
- VERIFIED - production checklist 目前 `可允許 production promote = fail`，因此 production guard 預期 deny。
- VERIFIED - GitHub Environment required reviewers、org membership 與 external sign-off 不是 repo 內可完整自動化的 surface。
- VERIFIED - GitHub Environment required reviewers / branch protection 屬 repo 外控制面；本輪無法從 repo 內驗證其實際設定值。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: release governance
- Adjacent modules: CI / env governance、post-launch ops governance
- Out of scope modules: deploy automation、external sign-off platform、GitHub org/team policy automation、白名單外 authority docs

### Review Requirements

- Domain review: required
- Security review: required
- QA review: required
- 理由：本輪命中 release trigger identity、authorized actor boundary、production fail-closed 與 evidence gate，屬高風險 release / sign-off slice。

### Done 定義

1. workflow 已把最小 authorized actor boundary 落成 repo-native fail-closed enforcement，且 guard sequencing 位於 environment-bound preflight 之前。
2. quality-gate 已恢復只承接一般 CI，不依賴 `assignment_ref` / `target_environment`。
3. plan / log / index 與相關 authority cross-reference 已同步落地。
4. focused validation 已覆蓋 touched files error check，以及 workflow guard job / `needs` / quality-gate 解耦確認。
5. focused validation 需額外覆蓋一個含特殊字元 `assignment_ref` 的 summary case，確認不會原樣污染 `GITHUB_STEP_SUMMARY`。

### Rollback 策略

- Level: L2
- 前置條件: 本輪僅新增一個獨立 guard 腳本與最小 workflow / 文檔引用
- 回滾動作: 若 allowlist 或 checklist gate wording 被認定錯誤，回退 guard step 與腳本即可恢復 docs-only boundary；不涉及 deploy rollback

---

## 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `.github/workflows/ci.yml` | 修改 | 將 guard 從 `quality-gate` 抽成 `release-preflight-guard` 前置 job，並讓 `release-preflight` 以 `needs` 依賴它 |
| `doc/implementation_plan_index.md` | 修改 | 更正 `Idx-037` 摘要為獨立 guard job sequencing |
| `doc/plans/Idx-037_plan.md` | 修改 | 對齊獨立 guard job 與 quality-gate 解耦的 acceptance |
| `doc/logs/Idx-037_log.md` | 修改 | 記錄控制路徑修補與 focused validation |
| `doc/architecture/decisions/ci_and_env_governance_baseline.md` | 修改 | 補新的 guard job sequencing 與 CI 解耦說明 |
| `doc/architecture/flows/post_launch_ops_runbook.md` | 修改 | 補 workflow_dispatch guard job → environment-bound preflight 的執行順序 |

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
operating_mode: [single-operator-production]
track: [product-system]
plan_created: [2026-04-08 00:00:00]
plan_approved: [Coordinator 已完成正式確認；使用者授權 autonomous execution]
scope_policy: [strict]
expert_required: [false]
expert_conclusion: [N/A]
security_review_required: [true]
domain_reviewer_tool: [Ivy Domain Expert]
domain_review_start: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
domain_review_end: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
domain_review_result: [PASS_WITH_RISK]
domain_review_conclusion: [repo-native guard 的授權邊界方向正確，但 assignment_ref 仍僅是 evidence reference gate，且 release authority 仍須與 single-operator contract / post-launch ops runbook 共同引用]
security_reviewer_tool: [Ivy Security Reviewer]
security_review_trigger_source: [release-preflight authorized actor boundary repo-native enforcement]
security_review_trigger_matches: [workflow_dispatch trigger, actor allowlist, assignment evidence gate, production fail-closed]
security_review_start: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
security_review_end: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
security_review_result: [PASS_WITH_RISK]
security_review_conclusion: [summary escaping 原先未覆蓋 CR/LF、checklist read error 原先會暴露 raw stack；actor / assignment / production checklist fail-closed boundary 方向正確，但 workflow_dispatch 與 external release control 仍屬殘餘風險]
execution_backend_policy: [chat-primary-with-one-shot-reviewers]
executor_tool: [GitHub Copilot]
executor_backend: [copilot-chat-agent]
monitor_backend: [checkpoint-first-targeted-validation]
last_change_tool: [GitHub Copilot]
qa_tool: [Ivy QA Reviewer]
qa_review_start: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
qa_review_end: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
qa_review_result: [FAIL]
qa_review_conclusion: [Idx-037 log 的 VALIDATION_SUMMARY 缺真實 output/exit code，plan/log 未回填 Domain / Security review 結果，且需明示 quality-gate 解耦是刻意 scope 切割]
qa_compliance: [focused validation completed by Engineer；當前 QA 狀態仍為 FAIL，需由獨立 Ivy QA Reviewer 依本輪 follow-up 再次確認]
reviewer_outcome_summary: [Domain PASS_WITH_RISK: repo-native guard 的授權邊界方向正確，但 assignment_ref 仍只是 evidence reference gate，且 release authority 仍須共同引用 single-operator contract / post-launch ops runbook；Security PASS_WITH_RISK: CR/LF summary escaping 與 checklist read fail-closed deny 需補強，workflow_dispatch 與 external release control 仍是殘餘風險；QA FAIL: plan/log 必須回填 reviewer 結果、真實 validation evidence，並明示 quality-gate 解耦是刻意 scope 切割]
log_file_path: [doc/logs/Idx-037_log.md]
scope_exceptions: []
<!-- EXECUTION_BLOCK_END -->