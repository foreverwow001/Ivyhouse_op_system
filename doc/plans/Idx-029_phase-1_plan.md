# Plan: Idx-029 Phase 1 — Root `.github/**` Bootstrap Refresh 與 Agent / Prompt / Instruction Merge

**Parent Task**: Idx-029
**Created**: 2026-04-07
**Planner**: Copilot
**Phase**: Phase 1
**Primary Module**: Workflow Tooling / Governance
**Work Type**: migration

---

## 🎯 目標

將 upstream 新模型所需的 root `.github/**` bootstrap surface 導入 Ivyhouse repo，讓新版 `/dev` 入口、custom agents、workspace-shared instructions 與 reviewer package navigation 可以先在 workspace 層成立。這一 phase 的重點不是切掉舊 `.agent`，而是先把新的 bootstrap shell 建起來，讓後續 canonical core 導入有明確入口可接。

---

## 📋 SPEC

### Goal

完成 root `.github/**` 的 bootstrap refresh，並把 Ivyhouse 專案既有 `.github/instructions/**` 內容安全 merge 到新 surface。

### Business Context

- upstream 新模型把 `/dev` 的正式入口下放到 root `.github/prompts/dev.prompt.md` 與 `.github/agents/**`。
- 目前 Ivyhouse 的 root `.github/**` 只有專案指令檔，缺少 prompt、agents、copilot instructions 等 bootstrap surface。
- 若先導入 canonical core 而不補 root `.github/**`，工作區層的 agent routing 仍會斷在舊 `.agent/**`。

### Non-goals

- 不導入 `.github/workflow-core/**`。
- 不建立 `.workflow-core/**` mutable root。
- 不修改 `.agent/**` 的 authority，只做新 bootstrap surface 導入。

### Acceptance Criteria

1. root `.github/**` 已具備新版 `/dev` 所需的 prompts、agents、instructions、copilot instructions surface。
2. `Ivyhouse_op_system_instructions.instructions.md` 仍保留且未被 generic content 覆蓋。
3. 已明確標註哪些 root `.github/**` 檔案是 upstream 直接採納、哪些經過人工 merge、哪些保留 project-local wording。
4. Phase 1 完成後，workspace customization surface 可辨識新版 workflow 導航，但尚未切換 live authority。

### Edge Cases

- 若 upstream agent 名稱與本地 instruction routing 衝突 -> 保留 upstream agent id，但在 project-local instruction 中調整導航說明。
- 若 root `.github/copilot-instructions.md` 與本地 instruction 檔內容重疊 -> 以「bootstrap navigation vs project governance」分層，而不是互相覆蓋。
- 若某些 upstream instructions 假設 downstream 已有 `.github/workflow-core/**` -> 在 Phase 1 僅保留導航，實際 authority 啟用延到 Phase 2。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `doc/plans/Idx-029_plan.md`
- `doc/plans/Idx-029_phase-0_plan.md`
- `.github/instructions/Ivyhouse_op_system_instructions.instructions.md`
- upstream `.github/prompts/dev.prompt.md`
- upstream `.github/copilot-instructions.md`
- upstream `.github/agents/**`
- upstream `.github/instructions/**`

### Missing Inputs

- Phase 0 產出的 root bootstrap merge inventory 尚未落檔

research_required: true

### Sources

- upstream root `.github/**` bootstrap surface
- 本地現有 `.github/instructions/**`

### Assumptions

- VERIFIED - Phase 1 的成功條件是建立新 bootstrap surface，不是完成 authority cutover。
- VERIFIED - 本地唯一既有 `.github` customization 目前主要是 instruction 檔，因此 merge 成本集中在導航與規則優先序。
- RISK: unverified - upstream `.github/agents/**` 的具體 agent 名稱若異動，可能需要再調整本地 prompt 導向描述。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: root `.github/**`
- Adjacent modules: `.agent/workflows/**` 僅作 reference，不修改 authority
- Out of scope modules: `.github/workflow-core/**`, `.workflow-core/**`, `.agent/**` live contract, `.vscode/**`, `.devcontainer/**`

### File whitelist

- `.github/copilot-instructions.md`
- `.github/prompts/**`
- `.github/agents/**`
- `.github/instructions/**`
- `doc/logs/Idx-029_phase-1_log.md`

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 導入新版 `/dev` bootstrap prompt 與 navigation instructions。
- 暫不改 live workflow state source。

#### RBAC IMPACT

- 導入 reviewer / planner / engineer / coordinator agent surface，但不改業務 RBAC。

#### SHARED KEY / CROSS-MODULE IMPACT

- 影響工作區 customization routing，不涉及業務 integration contract。

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- 應在 log 中記錄哪些檔案 direct import、哪些 merge、哪些保留 local wording。

### Done 定義

1. root `.github/**` bootstrap surface 已齊備。
2. Ivyhouse 專案 instruction surface 已安全 merge。
3. `/dev` navigation 已能定位到新 bootstrap prompt。

### Rollback 策略

- Level: L2
- 前置條件: Phase 1 僅動 root `.github/**`
- 回滾動作: 若 merge 後工作區 customization routing 異常，回滾整批 root `.github/**` 變更，保留 Phase 0 盤點 artifact

### Max rounds

- 估計: 3
- 超過處理: 若第三輪仍存在 instruction 衝突，拆出單獨 instruction merge work unit

### Bounded work unit contract

> 正式執行時，可將 root `.github/**` 視為單一 bounded work unit，但本 supporting plan 僅提供規格，不直接執行。

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/plans/Idx-029_phase-1_plan.md` | 新增 | 建立 Phase 1 supporting plan |

---

## 實作指引

### 1. 建議導入批次

1. `.github/copilot-instructions.md`
2. `.github/prompts/dev.prompt.md`
3. `.github/agents/*.agent.md`
4. `.github/instructions/*.instructions.md`

### 2. Merge 原則

- upstream 提供 bootstrap 導航與 agent invocation 說明。
- Ivyhouse project instruction 保留規則優先序、語言要求、formal workflow 約束與高風險面治理。
- 兩者若重疊，優先把 generic navigation 放在 bootstrap files，把專案治理留在 project-local instruction。

### 3. 驗證切面

- 至少驗證工作區能識別 prompt / agent files。
- 至少人工 read-through 一次 `/dev` 入口文本，確認沒有再指向舊 `.agent/workflows/dev-team.md` 當唯一 authority。

### 4. 禁止事項

- 不可在本 phase 直接把 `.agent/**` 改為 shim。
- 不可把 `.github/instructions/Ivyhouse_op_system_instructions.instructions.md` 刪除或 generic 化。

---

## 注意事項

- 風險提示: Phase 1 最容易因為「看起來都在 `.github`」而誤把 bootstrap refresh 與 canonical core 導入混在一起，必須嚴格分離。
- 資安考量: 不得把 reviewer CLI 命令、terminal 名稱或環境 secret 寫死在 generic prompt 中。
- 相依性: 依賴 Phase 0 的 ownership 與 merge inventory。
- 缺漏前提: Phase 0 若未先標出需要人工 merge 的 root `.github/**` surface，Phase 1 風險會顯著上升。

---

## 相關資源

- `doc/plans/Idx-029_plan.md`
- `doc/plans/Idx-029_phase-0_plan.md`

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: [2026-04-07 00:00:00]
plan_approved: [待用戶確認]
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
execution_backend_policy: [N/A - planning only]
scope_exceptions: []

# Engineer 執行
executor_tool: [N/A - planning only]
executor_backend: [N/A]
monitor_backend: [N/A]
log_file_path: [待後續 phase 建立]
executor_tool_version: [N/A]
executor_user: [N/A]
executor_start: [N/A]
executor_end: [N/A]
session_id: [N/A]
last_change_tool: [N/A]

# QA 執行
qa_tool: [N/A - planning only]
qa_tool_version: [N/A]
qa_user: [N/A]
qa_start: [N/A]
qa_end: [N/A]
qa_result: [N/A]
qa_compliance: [N/A]
<!-- EXECUTION_BLOCK_END -->