# Plan: Idx-029 Phase 4 — `.agent/**` Compatibility Shim、`.vscode/**` / `.devcontainer/**` Cutover

**Parent Task**: Idx-029
**Created**: 2026-04-07
**Planner**: Copilot
**Phase**: Phase 4
**Primary Module**: Workflow Tooling / Governance
**Work Type**: migration

---

## 🎯 目標

在新 canonical roots 與 local overlay 已就位後，將舊 `.agent/**` 從 live authority 收斂為 compatibility shim，並同步把 `.vscode/settings.json`、`.devcontainer/devcontainer.json` 等工作區啟動面改到新模型。這一 phase 是真正的 live cutover：從此之後，舊 `.agent/**` 只能扮演轉接或說明角色，不能再作正式 workflow source。

---

## 📋 SPEC

### Goal

完成 authority cutover，讓工作區啟動與導航都以新 workflow-core 模型為準。

### Business Context

- 前三個 phase 只是在建立新 roots 與搬移 local customization，並未真正切換 live authority。
- `.vscode/**`、`.devcontainer/**`、`.agent/workflows/**` 是使用者最直接接觸的入口，如果這裡不切，整個升版只會停留在檔案層而不是工作流層。
- 這一 phase 也是最容易讓 workflow 一度中斷的地方，因此必須嚴格用 batch 做。

### Non-goals

- 不做 upstream sync verify。
- 不做 downstream 完整 smoke / tests。
- 不在本 phase 清除所有 `.agent/**` 歷史檔；只收斂 authority。

### Acceptance Criteria

1. `.agent/workflows/**`、`.agent/roles/**`、`.agent/runtime/**` 已不再是 live authority。
2. `.agent/**` 保留內容僅為 forwarding docs、tiny wrappers 或 compatibility notes。
3. `.vscode/settings.json` 已從 PTY-primary-only 設定切換到新 workflow/reviewer CLI readiness 設定。
4. `.devcontainer/devcontainer.json` 與 post-create / bootstrap scripts 已對齊新 root paths。
5. 使用者透過 `/dev` 進入 workflow 時，預期已會先碰到 root `.github/**` 與 `.github/workflow-core/**`，而不是舊 `.agent/**`。

### Edge Cases

- 某些舊 wrapper script 仍被 maintainers 習慣使用 -> 可暫留 tiny wrapper，但需明確寫 forwarding，且不得再有獨立邏輯分叉。
- `.vscode/settings.json` 若同時承載本地 PTY extension 設定與新 reviewer CLI 設定 -> 可以保留過渡設定，但 `defaultMode` 與正式路徑需切到新模型。
- devcontainer 若依賴舊 `.agent/runtime/scripts/devcontainer/post_create.sh` -> 可先以 wrapper 轉呼叫新路徑，再於後續清理。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `doc/plans/Idx-029_plan.md`
- `doc/plans/Idx-029_phase-2_plan.md`
- `doc/plans/Idx-029_phase-3_plan.md`
- `.vscode/settings.json`
- `.devcontainer/devcontainer.json`
- `.agent/workflows/**`
- `.agent/roles/**`
- `.agent/runtime/**`
- upstream `doc/VSCODE_INSIDER_CHAT_SETUP.md`

### Missing Inputs

- Phase 3 產出的 local overlay 最終落點尚未正式實作

research_required: true

### Sources

- 本地 `.agent/**`, `.vscode/**`, `.devcontainer/**`
- upstream workflow-core setup docs

### Assumptions

- VERIFIED - `.agent/**` 在 cutover 完成後只能做 shim，不能再是 canonical authority。
- VERIFIED - `.vscode/settings.json` 是正式 workflow mode 切換的關鍵 surface 之一。
- RISK: unverified - 本地自製 PTY extensions 是否仍需保留部分 compatibility config，需要正式執行前再確認。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: `.agent/**`, `.vscode/settings.json`, `.devcontainer/devcontainer.json`
- Adjacent modules: `.github/workflow-core/**`, `.workflow-core/**`
- Out of scope modules: downstream product code, upstream sync verify, full regression tests

### File whitelist

- `.agent/workflows/**`
- `.agent/roles/**`
- `.agent/runtime/**`
- `.vscode/settings.json`
- `.devcontainer/devcontainer.json`
- `.devcontainer/**` related bootstrap scripts
- `doc/logs/Idx-029_phase-4_log.md`

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 正式切換 workflow live authority。
- 切換 `/dev`、reviewer path、default mode、bootstrap path。

#### RBAC IMPACT

- 只影響 workflow roles routing，不動業務 RBAC。

#### SHARED KEY / CROSS-MODULE IMPACT

- 影響 editor / devcontainer 與 workflow core 的 path contract。

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- execution evidence path 將從舊 PTY artifacts 轉向新 review package / execution log 路徑。

### Done 定義

1. `.agent/**` 已完成 shim 化。
2. `.vscode/**` 與 `.devcontainer/**` 已對齊新 roots。
3. 新 authority 已生效，舊 authority 已退位。

### Rollback 策略

- Level: L4
- 前置條件: 必須分批進行，先 `.agent/workflows/**`，再 `.vscode/**`，最後 `.devcontainer/**`
- 回滾動作: 若 live cutover 後 `/dev` 或 bootstrap 失效，回滾最後一批次，保留已驗證生效的上一批次

### Max rounds

- 估計: 4
- 超過處理: 若 cutover 需超過 4 輪，表示 shim 粒度太大，應拆出 editor/devcontainer compatibility 子 work unit

### Bounded work unit contract

> 正式執行時建議拆成三個 bounded units：`.agent/workflows+roles`、`.vscode/settings.json`、`.devcontainer/**`。

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/plans/Idx-029_phase-4_plan.md` | 新增 | 建立 Phase 4 supporting plan |

---

## 實作指引

### 1. `.agent/**` Shim 原則

- workflow docs 改成 forwarding docs。
- runtime scripts 若仍需兼容舊操作，保留 tiny wrappers，但主邏輯只准存在於新 root。
- roles 若保留檔案，也只能做導覽，不可維持一份獨立 project fork。

### 2. `.vscode/settings.json`

- 切到新 workflow mode 與 reviewer CLI readiness 設定。
- 若需保留 PTY extension compatibility，應明確標記為 fallback / compatibility，而非 default path。

### 3. `.devcontainer/**`

- 更新 post-create 與 bootstrap 路徑。
- 若短期仍需舊 shell script，改由 wrapper 呼叫新位置。

### 4. 驗證切面

- 人工檢查 `/dev` 入口導航。
- 檢查新 settings key 是否存在，舊 key 是否已退為次要或 compatibility。
- 檢查 devcontainer bootstrap 不再硬綁 `.agent` 作唯一 authority。

---

## 注意事項

- 風險提示: 這是最接近使用者體感的 phase，任何 routing 失誤都會讓人以為 workflow 整體壞掉。
- 資安考量: 不得把 reviewer CLI 命令、terminal session id 或本地路徑硬編碼到不該版控的檔案。
- 相依性: 依賴 Phase 2 / Phase 3 已完成新 roots 與 local overlay 分離。
- 缺漏前提: 若 local overlay 仍未搬完，就不能宣告 `.agent/**` 已可安全 shim 化。

---

## 相關資源

- `doc/plans/Idx-029_plan.md`
- `doc/plans/Idx-029_phase-2_plan.md`
- `doc/plans/Idx-029_phase-3_plan.md`

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