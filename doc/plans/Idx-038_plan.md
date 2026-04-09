# Plan: Idx-038 — internal-testing deferred external/platform evidence 治理 authority 補位

**Index**: Idx-038
**Created**: 2026-04-09
**Planner**: GitHub Copilot
**Phase**: Phase 1 → Governance
**Primary Module**: Operating mode governance
**Work Type**: docs-only governance / cross-reference hardening
**Track**: product-system
**Operating Mode**: cross-mode-governance

> 本輪同時覆蓋 `internal-testing` 與 `single-operator-production`，目的是把 external infra facts 與 platform control evidence 的 defer timing 明文化成 repo-native authority。`cross-mode-governance` 只是治理 artifact 的 meta marker，不是第三種正式 operating mode。

---

## 🎯 目標

把「目前 internal-testing 可暫緩 external infra facts 與 platform control evidence；進入 single-operator-production 前則必補」正式寫回 authority 文檔、implementation index 與既有計畫的最小 cross-reference，避免後續 task 把 deferred gap 誤寫成 blocker 已解除。

---

## 📋 SPEC

### Goal

在不修改 checklist 狀態、workflow yaml 或 runtime code 的前提下，建立一個明確的 defer policy authority，讓後續 plan / log / flow 導覽都能一致回指同一份規則。

### Business Context

- `Idx-033` 已建立 operating mode authority，但尚未把 external infra facts 與 platform control evidence 的 defer timing寫成明文規則。
- `Idx-024` 與 `Idx-037` 都已誠實記錄 external / platform gap，仍需要一份更高層的 authority 說明哪些 gap 在 `internal-testing` 可維持 `deferred`、哪些情境在 `single-operator-production` 前必須補齊。
- 若 defer policy 不被正式寫回 repo，後續文件容易把「目前仍 deferred」誤讀成「blocker 已解除」或「可宣稱 production-ready」。

### Non-goals

- 不修改 `Idx-024` / `Idx-037` log。
- 不改任何 checklist 狀態、workflow yaml、release guard、CI 行為或 runtime code。
- 不新增 external infra facts、platform evidence、backup/restore 真實值或 production sign-off 結論。

### Acceptance Criteria

1. `doc/architecture/decisions/operating_mode_and_database_provider_baseline.md` 明文化 defer policy：
   - `internal-testing` 可暫緩 external infra facts 與 platform control evidence，只要 plan / log 誠實標記 `deferred`
   - 一旦任何 release / environment / gate 要被敘述成 `single-operator-production`，就必須先補齊 evidence，否則不得宣稱 `production-ready` 或放行 production promote
   - 至少列出最近成功備份時間、保留策略、RTO、RPO、restore rehearsal 日期 / 結果 / 證據、final sign-off、branch protection / required reviewers 平台證據等 examples
2. `doc/architecture/decisions/ci_and_env_governance_baseline.md` 與 `doc/architecture/flows/README.md` 補最小 cross-reference，讓讀者能找到 defer policy authority。
3. `doc/plans/Idx-024_plan.md` 與 `doc/plans/Idx-037_plan.md` 明示 external / platform gaps 在 `internal-testing` 可維持 `deferred`，但 `single-operator-production` 前必補，且不得誤寫成 blocker 已解除。
4. `doc/implementation_plan_index.md` 新增 `Idx-038`，摘要明示為 docs-only governance authority 補位，不暗示 external blocker 已解除。
5. 建立 `doc/plans/Idx-038_plan.md` 與 `doc/logs/Idx-038_log.md`，Track 為 `product-system`，Operating Mode 為 `cross-mode-governance`。

### Edge Cases

- 同一份 artifact 同時提到 `internal-testing` 與 `single-operator-production` 時，必須把 deferred gap 與必補條件分開寫，不能混成單一結論。
- 若某份文件只引用 CI / env baseline 或 flow README，而未回指 operating mode authority，仍可能造成治理漂移；因此本輪只補最小 cross-reference，不在多處複製完整規格。
- 即使 repo 內已有 fail-closed technical guard，也不能拿來替代 external infra facts 或平台控制證據本身。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `doc/architecture/decisions/operating_mode_and_database_provider_baseline.md`
- `doc/architecture/decisions/ci_and_env_governance_baseline.md`
- `doc/architecture/flows/README.md`
- `doc/implementation_plan_index.md`
- `doc/plans/Idx-024_plan.md`
- `doc/plans/Idx-037_plan.md`

### Missing Inputs

- 無。本輪是 authority 補位，不需要新增 external infra 或 platform evidence 實值。

research_required: false

### Assumptions

- VERIFIED - Coordinator 已透過 `vscode_askQuestions` 完成正式確認，且使用者已批准本輪 docs-only follow-up 直接修改白名單文件。
- VERIFIED - 本輪只能修改使用者指定的 8 份既有 markdown 與建立 `Idx-038` plan / log artifact。
- VERIFIED - 本輪 reviewer 需求為 Domain、Security、QA，但 Engineer 不做最終 reviewer approval。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: operating mode / governance authority
- Adjacent modules: CI / env governance、flow navigation、implementation planning
- Out of scope modules: workflow runtime、CI implementation、checklist state、external platform settings、runtime code

### File whitelist

- `doc/architecture/decisions/operating_mode_and_database_provider_baseline.md`
- `doc/architecture/decisions/ci_and_env_governance_baseline.md`
- `doc/architecture/flows/README.md`
- `doc/implementation_plan_index.md`
- `doc/plans/Idx-024_plan.md`
- `doc/plans/Idx-037_plan.md`
- `doc/plans/Idx-038_plan.md`
- `doc/logs/Idx-038_log.md`

### Review Requirements

- Domain review: required
- Security review: required
- QA review: required
- 理由：本輪雖為 docs-only，但直接補強 operating mode authority、production promote fail-closed 敘述與 external / platform evidence 邊界。

### Done 定義

1. defer policy authority 已落入 operating mode decision。
2. index、flows README、CI / env baseline、Idx-024 plan、Idx-037 plan 都有最小 cross-reference。
3. `Idx-038` plan / log artifact 已建立，且不宣稱任何 external blocker 已解除。
4. focused validation 已涵蓋 touched markdown 的 `get_errors` 與指定 cross-reference readback。

### Rollback 策略

- Level: L1
- 前置條件: 本輪僅調整白名單內 markdown artifact
- 回滾動作: 若 defer policy wording 與既有 authority 衝突，只回退本輪文檔變更，不涉及 workflow 或 runtime rollback

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-038-deferred-external-platform-evidence-governance-authority
  goal: formalize when external infra facts and platform control evidence may stay deferred in internal-testing, and when they must be completed before any single-operator-production claim
  retry_budget: 3
  allowed_checks:
    - touched-file-lint
    - targeted-grep
    - targeted-readback
  file_scope:
    - doc/architecture/decisions/operating_mode_and_database_provider_baseline.md
    - doc/architecture/decisions/ci_and_env_governance_baseline.md
    - doc/architecture/flows/README.md
    - doc/implementation_plan_index.md
    - doc/plans/Idx-024_plan.md
    - doc/plans/Idx-037_plan.md
    - doc/plans/Idx-038_plan.md
    - doc/logs/Idx-038_log.md
  done_criteria:
    - operating mode authority contains explicit defer policy and required evidence examples
    - ci/env baseline and flows README point back to the authority doc
    - Idx-024 and Idx-037 plans preserve deferred wording without implying blocker removal
    - implementation index describes Idx-038 as docs-only governance authority backfill
    - no file changes outside file_scope
  escalation_conditions:
    - authority wording conflicts with higher-priority governance docs
    - request expands into workflow yaml, checklist state, or runtime code changes
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/architecture/decisions/operating_mode_and_database_provider_baseline.md` | 修改 | 新增 external / platform evidence defer policy authority |
| `doc/architecture/decisions/ci_and_env_governance_baseline.md` | 修改 | 補 defer timing 的 authority cross-reference |
| `doc/architecture/flows/README.md` | 修改 | 補導覽句，指出 defer policy authority 位置 |
| `doc/implementation_plan_index.md` | 修改 | 新增 Idx-038 與更新統計 |
| `doc/plans/Idx-024_plan.md` | 修改 | 補最小 cross-reference，保留 external blocker 未解除 |
| `doc/plans/Idx-037_plan.md` | 修改 | 補最小 cross-reference，保留 external blocker 未解除 |
| `doc/plans/Idx-038_plan.md` | 新增 | 建立本輪正式 plan artifact |
| `doc/logs/Idx-038_log.md` | 新增 | 建立本輪執行留痕與 reviewer handoff 入口 |

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
operating_mode: [cross-mode-governance]
track: [product-system]
plan_created: [2026-04-09 00:00:00]
plan_approved: [Coordinator 已透過 vscode_askQuestions 取得正式確認；使用者批准 Idx-038 docs-only follow-up 可直接修改白名單文件]
scope_policy: [strict]
expert_required: [true]
expert_conclusion: [pending Domain review]
security_review_required: [true]
domain_reviewer_tool: [Ivy Domain Expert]
domain_review_start: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
domain_review_end: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
domain_review_result: [PASS_WITH_RISK]
domain_review_conclusion: [defer policy authority now cleanly separates internal-testing deferred evidence from single-operator-production required evidence, but downstream artifacts must keep citing the operating mode authority and must not reinterpret cross-mode-governance as a third mode]
security_reviewer_tool: [Ivy Security Reviewer]
security_review_trigger_source: [operating mode authority / production promote defer policy]
security_review_trigger_matches: [backup, restore, sign-off, branch protection, required reviewers]
security_review_start: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
security_review_end: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
security_review_result: [PASS_WITH_RISK]
security_review_conclusion: [restore rehearsal completeness and platform control evidence still depend on repo-external control, and checklist bypass path remains a residual risk until platform control is separately evidenced]
execution_backend_policy: [chat-primary-with-one-shot-reviewers]
executor_tool: [GitHub Copilot]
executor_backend: [copilot-chat-agent]
last_change_tool: [GitHub Copilot]
qa_tool: [Ivy QA Reviewer]
qa_review_start: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
qa_review_end: [completed in prior independent reviewer session; exact timestamp not captured in artifact]
qa_review_result: [PASS_WITH_RISK]
qa_review_conclusion: [restore rehearsal wording and cross-mode-governance disclaimer required follow-up backfill, but the repair remains correctly bounded to the approved docs-only slice]
qa_compliance: [⚠️ 例外：本次修補只承接既有 reviewer findings 與核准 follow-up scope；Engineer 不自行做最終 QA approval]
reviewer_outcome_summary: [Domain PASS_WITH_RISK: defer policy authority now cleanly separates internal-testing deferred evidence from single-operator-production required evidence, but downstream artifacts must keep citing the operating mode authority and must not reinterpret cross-mode-governance as a third mode; Security PASS_WITH_RISK: restore rehearsal completeness and platform control evidence still depend on repo-external control, and checklist bypass path remains a residual risk until platform control is separately evidenced; QA PASS_WITH_RISK: restore rehearsal wording and cross-mode-governance disclaimer required follow-up backfill, but the repair remains correctly bounded to the approved docs-only slice]
log_file_path: [doc/logs/Idx-038_log.md]
scope_exceptions: []
<!-- EXECUTION_BLOCK_END -->