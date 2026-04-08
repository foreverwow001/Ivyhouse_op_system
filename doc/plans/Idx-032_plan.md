# Plan: Idx-032 — Reviewer CLI behavioral hardening 與 Domain reviewer contract 補強

**Index**: Idx-032
**Created**: 2026-04-07
**Planner**: Copilot
**Phase**: Phase 1 → Workflow Hardening
**Primary Module**: Workflow reviewer surface
**Work Type**: implementation / governance

---

## 🎯 目標

修正目前 reviewer tooling 的假就緒與輸出不完整問題，讓 QA / Security / Domain reviewer 都能以 fresh one-shot session 穩定產生可採信結論，並讓 `Idx-024` 的 Domain blocker 有正式解除路徑。

---

## 📋 SPEC

### Goal

把 reviewer CLI 從「只檢查 command 與 wrapper 存在」提升到「可驗證 one-shot 行為、輸出完整性與 Domain reviewer contract」的正式工具鏈。

### Business Context

- `Idx-024` 已完成三個 slices，但仍卡在 Domain reviewer 無可採信結論。
- 目前 `workflow_preflight_reviewer_cli.py` 只驗靜態存在性，無法攔住 wrapper 卡住、空輸出或 section 缺失。
- `copilot_cli_one_shot_reviewer.py` 只支援 `qa` / `security`，與 repo 內既有 `Ivy Domain Expert` surface 不一致。

### Non-goals

- 不改 application runtime、Portal、API 或 CI workflow 本體。
- 不代替 external infra owner 完成 production backup/restore sign-off。
- 不在本任務內啟動 `Idx-025` 的 health endpoint 或 observability runtime 實作。

### Acceptance Criteria

1. reviewer wrapper 正式支援 `qa`、`security`、`domain` 三種 one-shot role。
2. reviewer preflight 除靜態存在檢查外，至少新增一個最小 behavioral smoke，能辨識卡住、空輸出或缺少必要 section 的情況。
3. reviewer wrapper 對 timeout、empty output、incomplete output 必須 fail-closed，不得回傳假成功。
4. Domain reviewer 有固定 package contract，且可產出完整結論，足以解除 `Idx-024` 的 Domain blocker。
5. `Idx-024` 可在本任務完成後補一次可採信 Domain review，並與 external infra sign-off 一起推進到 `Completed`。

### Edge Cases

- `copilot` CLI 可用，但 one-shot reviewer prompt 進入互動或輸出被截斷 -> preflight / wrapper 應回傳 fail，而不是 ready。
- reviewer 有輸出檔，但只產生標題或單一段落 -> 視為 incomplete output，不得當作有效 review。
- Domain reviewer surface 缺 package 欄位或 authority inputs -> reviewer 可回 `REVISE` / `PASS_WITH_RISK`，但 wrapper 不得因缺 role 而直接無輸出。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `.github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py`
- `.github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py`
- `.github/instructions/reviewer-packages.instructions.md`
- `.github/agents/ivy-domain-expert.agent.md`
- `.vscode/settings.json`
- `doc/logs/Idx-024_log.md`
- `doc/implementation_plan_index.md`

### Missing Inputs

- 無。根因已在 repo 內 tooling 與 log 證據收斂完成。

research_required: false

### Sources

- reviewer wrapper / preflight 實作
- `Idx-024` 的 QA / Security / Domain reviewer readback 證據
- `Ivy Domain Expert` custom agent 的固定輸出格式

### Assumptions

- VERIFIED - `copilot --prompt ... --no-ask-user --silent` 的最小 one-shot 命令可在此 workspace 成功返回
- VERIFIED - 目前主要缺口在 wrapper / preflight 行為驗證與 Domain role contract，不在 `copilot` binary 本身缺失
- RISK: unverified - Domain reviewer 若改用固定 one-shot wrapper 後，仍可能暴露新的 section completeness 問題

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: workflow reviewer surface
- Adjacent modules: reviewer package instructions、Domain reviewer surface、`Idx-024` review closure artifact
- Out of scope modules: application runtime、Portal、API、CI release workflow、production infra

### File whitelist

- `.github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py`
- `.github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py`
- `.github/instructions/reviewer-packages.instructions.md`
- `doc/implementation_plan_index.md`
- `doc/plans/Idx-032_plan.md`
- `doc/logs/Idx-032_log.md`
- `doc/logs/Idx-024_log.md`

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 影響正式 reviewer readiness 與 review closure path。
- 不改 `/dev` gate contract，不改 Engineer main execution surface。

#### RBAC IMPACT

- N/A

#### SHARED KEY / CROSS-MODULE IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- reviewer CLI 的 timeout、空輸出與 incomplete output 必須留下可讀 evidence。

### Done 定義

1. reviewer wrapper / preflight 的 behavioral fail-closed contract 已落地。
2. Domain reviewer role 與 package contract 已正式補齊。
3. `Idx-024` 可補一次可採信 Domain review，並移除 Domain blocker。

### Rollback 策略

- Level: L1
- 前置條件: 只改 workflow reviewer tooling 與對應文檔
- 回滾動作: 若 behavioral smoke 與 live `copilot` CLI 不相容，回退 wrapper / preflight 變更並保留 `Idx-032` artifact 與 blocker 說明

### Max rounds

- 估計: 2
- 超過處理: 若 reviewer tooling 修正後仍無法得到可採信 Domain output，必須停下並改由正式 Domain Expert 人工 one-shot surface 接手，不得再假裝自動 reviewer 可用

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-032-reviewer-cli-behavioral-hardening
  goal: harden the repo-native reviewer wrapper and preflight so qa security and domain one-shot reviews fail closed on timeout empty or incomplete output and produce trustworthy review evidence
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - touched-file-lint
  file_scope:
    - .github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py
    - .github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py
    - .github/instructions/reviewer-packages.instructions.md
    - doc/implementation_plan_index.md
    - doc/plans/Idx-032_plan.md
    - doc/logs/Idx-032_log.md
    - doc/logs/Idx-024_log.md
  done_criteria:
    - reviewer wrapper supports qa security and domain roles
    - reviewer preflight performs behavioral validation beyond static command existence
    - empty timeout or incomplete reviewer output fails closed with evidence
    - idx-024 domain blocker can be retried on the hardened surface
    - engineer result is ready for external review
  escalation_conditions:
    - askQuestions gate remains unavailable for required formal dispatch
    - changes would expand into application runtime or CI workflow logic
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `.github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py` | 修改 | 補 Domain role、timeout / incomplete output fail-closed |
| `.github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py` | 修改 | 補 behavioral smoke 與 ready 判定強化 |
| `.github/instructions/reviewer-packages.instructions.md` | 修改 | 正式補 Domain package contract |
| `doc/implementation_plan_index.md` | 修改 | 登記 Idx-032 並反映 Idx-024 新依賴 |
| `doc/plans/Idx-032_plan.md` | 新增 | reviewer tooling hardening plan |
| `doc/logs/Idx-032_log.md` | 新增 | reviewer tooling hardening execution log |
| `doc/logs/Idx-024_log.md` | 修改 | 回填 Domain blocker 與解除證據 |

---

## ⚠️ 風險

| 風險 | 嚴重性 | 緩解方式 |
|------|--------|---------|
| reviewer preflight 誤判 ready，導致高風險任務在假 reviewer surface 上前進 | 高 | 補 behavioral smoke 與 output completeness 檢查 |
| Domain reviewer 輸出格式與 repo authority 不一致，仍無法解除 blocker | 中 | 以 `Ivy Domain Expert` fixed headings 作為 wrapper 正式輸出 contract |
| 為了追 reviewer tooling 而擴張到 CI / runtime 改動 | 中 | file scope 嚴格限縮在 reviewer tooling 與對應文檔 |

---

## 🔒 審查需求

- Domain Review：N/A（本任務是為了讓 Domain review surface 可用）
- Security Review：需要，因為修改 reviewer tooling、command execution 與 output fail-closed contract

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: [2026-04-07]
plan_approved: [2026-04-08 via `/Dev` batched `vscode_askQuestions` formal gate]
scope_policy: [strict]
expert_required: [true]
expert_conclusion: [root cause is narrowed to reviewer wrapper/preflight behavioral gaps plus missing domain reviewer contract]
security_review_required: [true]
security_reviewer_tool: [copilot-cli-reviewer]
security_review_trigger_source: [mixed]
security_review_trigger_matches: [subprocess, shell, command, session]
security_review_start: [2026-04-08]
security_review_end: [2026-04-08]
security_review_result: [PASS_WITH_RISK]
security_review_conclusion: [core reviewer trust-boundary gaps已收斂；殘餘風險以host-level copilot CLI supply chain與LLM prompt injection固有風險為主]
execution_backend_policy: [chat-primary-with-one-shot-reviewers]
scope_exceptions: []

# Engineer 執行
executor_tool: [GitHub Copilot]
executor_backend: [copilot-chat-agent]
monitor_backend: [checkpoint-first-reviewer-output]
executor_tool_version: [GPT-5.4]
executor_user: [GitHub Copilot]
executor_start: [2026-04-08]
executor_end: [2026-04-08]
session_id: [N/A]
last_change_tool: [GitHub Copilot]

# QA 執行
qa_tool: [copilot-cli-reviewer]
qa_tool_version: [pending]
qa_user: [pending]
qa_start: [2026-04-08]
qa_end: [2026-04-08]
qa_result: [PASS_WITH_RISK]
qa_compliance: [PASS - cross-QA satisfied via one-shot reviewer lane]

# 收尾
log_file_path: [doc/logs/Idx-032_log.md]
commit_hash: [pending]
rollback_at: [N/A]
rollback_reason: [N/A]
rollback_files: [N/A]
<!-- EXECUTION_BLOCK_END -->
