# Plan: Idx-031 — AskQuestions-first fail-closed workflow hardening

**Index**: Idx-031
**Created**: 2026-04-07
**Planner**: Copilot
**Phase**: Phase 1 → Workflow Hardening
**Primary Module**: Workflow authority / prompt surface
**Work Type**: governance
**Track**: workflow-core

---

## 🎯 目標

修正正式 `/dev` workflow 在 user-facing gate 上退化為一般聊天確認的 contract 缺口，將 live authority 收斂為：

1. formal gate 一律以 `#askQuestions` 收集
2. 多個 gate 決策必須盡量 batch 成單次 askQuestions flow
3. 若 askQuestions surface 缺失，視為 workflow environment blocker，fail-closed，不得改用一般聊天收正式 gate 決策

---

## 📋 SPEC

### Goal

消除「askQuestions 不可用時就退回一般聊天收 formal gate」的再發路徑，並同步更新 live authority 與 downstream bootstrap template，避免未來在同樣情境下再次打斷流程或要求使用者手動貼 prompt。

### Business Context

- 現行 live authority 明文允許在 `#askQuestions` 不可用時退回一般聊天輸入，這會讓正式 gate 決策失去一致的互動表面
- 使用者明確要求未來遇到 gate 或類似確認，一律走 `#askQuestions`，不要在一般聊天要求輸入 prompt
- 本 repo 已完成 `.agent` 退場與 `.github/workflow-core/**` authority cutover，因此 askQuestions-first contract 應在 canonical surface 與 downstream template 一併修正

### Non-goals

- 不新增 VS Code extension API 或執行時工具注入
- 不變更 Engineer / QA / Security Reviewer 的 completion marker 或 reviewer CLI contract
- 不處理 `Idx-024` 的功能內容；只修正其前置 workflow gate contract

### Acceptance Criteria

1. `AGENT_ENTRY.md` 明確規定 formal gate 僅能以 `#askQuestions` 收集，缺少該 surface 時必須 fail-closed
2. `dev.prompt.md`、`vscode_system/prompt_dev.md`、`tool_sets.md`、`roles/coordinator.md` 與 downstream bootstrap template 都同步對齊
3. 文檔要明確要求 batch gate questions，避免要求使用者在一般聊天重貼 prompt 或逐題補填
4. `Idx-031` 已正式登記進 index，並有對應 plan/log artifact

### Edge Cases

- 若執行環境真的沒有 askQuestions surface，workflow 會被視為環境阻斷，而不是回退成一般聊天
- 若 user 需要自由文字補充，仍可在 askQuestions 流程之外補述理由；但 formal gate 決策本身不得改由一般聊天收集

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `.github/workflow-core/AGENT_ENTRY.md`
- `.github/workflow-core/workflows/dev.md`
- `.github/workflow-core/roles/coordinator.md`
- `.github/workflow-core/vscode_system/tool_sets.md`
- `.github/workflow-core/vscode_system/prompt_dev.md`
- `.github/prompts/dev.prompt.md`

### Missing Inputs

- 無。這是 authority doc hardening，不依賴外部 infra 決策。

research_required: false

### Sources

- live authority 與 downstream bootstrap template 中的 askQuestions / fallback wording

### Assumptions

- VERIFIED - 目前 recurrence 根因是 live authority 允許一般聊天 fallback，而不是單一 prompt 語氣問題
- VERIFIED - downstream bootstrap template 需同步修正，否則未來 bootstrap 仍會重新導入舊 contract

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: workflow authority / prompt surface
- Adjacent modules: downstream bootstrap template、coordinator role、VS Code prompt surface
- Out of scope modules: application runtime、CI jobs、reviewer CLI implementation

### File whitelist

- `.github/workflow-core/AGENT_ENTRY.md`
- `.github/workflow-core/roles/coordinator.md`
- `.github/workflow-core/vscode_system/tool_sets.md`
- `.github/workflow-core/vscode_system/prompt_dev.md`
- `.github/prompts/dev.prompt.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/AGENT_ENTRY.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/roles/coordinator.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/vscode_system/tool_sets.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/vscode_system/prompt_dev.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/prompts/dev.prompt.md`
- `doc/implementation_plan_index.md`
- `doc/plans/Idx-031_plan.md`
- `doc/logs/Idx-031_log.md`

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 只影響 workflow gate contract 與 prompt discipline
- 不改 completion marker、reviewer readiness 或 execution backend policy

#### RBAC IMPACT

- N/A

#### SHARED KEY / CROSS-MODULE IMPACT

- N/A

### Done 定義

1. Live authority 與 downstream template 已同步改為 askQuestions fail-closed
2. `Idx-031` plan/log/index artifact 完整落地
3. 已完成至少一個 focused validation，證明不存在舊的 formal-gate chat fallback wording

### Rollback 策略

- Level: L1
- 前置條件: 只改 workflow / prompt authority 文檔
- 回滾動作: 若 wording 造成 authority 衝突，回退本次文檔 patch，不影響 runtime surface

### Max rounds

- 估計: 1
- 超過處理: 若 canonical 與 template surface 仍不同步，補齊同步後結束，不擴張到 runtime tool 開發

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-031-askquestions-fail-closed-hardening
  goal: harden the workflow authority so formal gates use batched askQuestions only and fail closed when the askQuestions surface is unavailable
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - touched-file-lint
  file_scope:
    - .github/workflow-core/AGENT_ENTRY.md
    - .github/workflow-core/roles/coordinator.md
    - .github/workflow-core/vscode_system/tool_sets.md
    - .github/workflow-core/vscode_system/prompt_dev.md
    - .github/prompts/dev.prompt.md
    - .github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/AGENT_ENTRY.md
    - .github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/roles/coordinator.md
    - .github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/vscode_system/tool_sets.md
    - .github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/vscode_system/prompt_dev.md
    - .github/workflow-core/templates/downstream_bootstrap/.github/prompts/dev.prompt.md
    - doc/implementation_plan_index.md
    - doc/plans/Idx-031_plan.md
    - doc/logs/Idx-031_log.md
  done_criteria:
    - live authority and downstream bootstrap template both state that formal gates must use askQuestions and fail closed without it
    - prompt surfaces explicitly require batched askQuestions instead of chat-based prompt re-entry
    - idx-031 plan log and index artifacts are complete
    - focused validation confirms the new wording and plan structure
  escalation_conditions:
    - runtime tool implementation becomes required
    - workflow authority conflicts across canonical surfaces remain unresolved
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `.github/workflow-core/AGENT_ENTRY.md` | 修改 | askQuestions-first 改為 fail-closed 正式契約 |
| `.github/workflow-core/roles/coordinator.md` | 修改 | 明定不可以一般聊天收 formal gate 決策 |
| `.github/workflow-core/vscode_system/tool_sets.md` | 修改 | 工具集與執行流程對齊 batched askQuestions |
| `.github/workflow-core/vscode_system/prompt_dev.md` | 修改 | prompt surface 對齊 askQuestions fail-closed |
| `.github/prompts/dev.prompt.md` | 修改 | root `/dev` prompt 對齊 askQuestions-first 行為 |
| downstream bootstrap template 對應檔案 | 修改 | 同步未來 bootstrap contract |
| `doc/implementation_plan_index.md` | 修改 | 登記 Idx-031 |
| `doc/plans/Idx-031_plan.md` | 新增 | workflow hardening plan |
| `doc/logs/Idx-031_log.md` | 新增 | workflow hardening execution log |

---

## ⚠️ 風險

| 風險 | 嚴重性 | 緩解方式 |
|------|--------|---------|
| askQuestions surface 缺失時，workflow 會直接 block | 中 | 明確將其標為 environment blocker，而不是默默退化 |
| 只改 live authority、不改 template，未來 bootstrap 仍會重演 | 高 | live 與 downstream template 同步修正 |

---

## 🔒 審查需求

- Domain Review：N/A
- Security Review：N/A

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [workflow-core]
plan_created: [2026-04-07]
plan_approved: [2026-04-07 user requested workflow hardening before continuing Idx-024]
scope_policy: [strict]
expert_required: [false]
expert_conclusion: [N/A]
security_review_required: [false]
security_reviewer_tool: [N/A]
security_review_trigger_source: [none]
security_review_trigger_matches: []
security_review_start: [N/A]
security_review_end: [N/A]
security_review_result: [N/A]
security_review_conclusion: [N/A]
execution_backend_policy: [chat-primary-with-one-shot-reviewers]
scope_exceptions: []

# Engineer 執行
executor_tool: [GitHub Copilot]
executor_backend: [copilot-chat-agent]
monitor_backend: [checkpoint-first-reviewer-output]
executor_tool_version: [GPT-5.4]
executor_user: [GitHub Copilot]
executor_start: [2026-04-07]
executor_end: [2026-04-07]
session_id: [N/A]
last_change_tool: [GitHub Copilot]

# QA 執行
qa_tool: [plan-validator + targeted wording check]
qa_tool_version: [workspace tooling]
qa_user: [GitHub Copilot]
qa_start: [2026-04-07]
qa_end: [2026-04-07]
qa_result: [PASS]
qa_compliance: [doc-only workflow hardening; no Cross-QA conflict; plan-validator 與 targeted wording checks 已通過]

# 收尾
log_file_path: [doc/logs/Idx-031_log.md]
commit_hash: [pending]
rollback_at: [N/A]
rollback_reason: [N/A]
rollback_files: [N/A]
<!-- EXECUTION_BLOCK_END -->
