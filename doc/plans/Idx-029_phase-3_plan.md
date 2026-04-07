# Plan: Idx-029 Phase 3 — Project-local Customization、Skills 與 Mutable State 搬家

> Historical note (`Idx-029` Phase 4): 本文件中的 `.agent/skills_local/**`、`.agent/state/**` 與 `.agent/config/**` 為 Phase 3 規劃時的來源路徑；實際 cutover 後，現行 mutable authority 已改為 `.workflow-core/**`。

**Parent Task**: Idx-029
**Created**: 2026-04-07
**Planner**: Copilot
**Phase**: Phase 3
**Primary Module**: Workflow Tooling / Governance
**Work Type**: migration

---

## 🎯 目標

將 Ivyhouse 專案自己的 workflow customization 從 upstream-managed core 中分離出來，正式搬到 `.workflow-core/**`、project rules、project-local instructions 或其他 overlay surface。這一 phase 的關鍵是建立「同步可持續性」而不是「內容複製完整」，也就是讓後續 sync 時，真正需要維護的差異都是預期中的 local overlay，而不是埋在 managed core 裡的長期 fork。

---

## 📋 SPEC

### Goal

完成 custom skills、mutable state、project-specific role wording、settings policy 與 maintainer-local surface 的去 managed divergence 化。

### Business Context

- Ivyhouse 的 engineer / QA / workflow guardrails 已高度專案化，不能在導入 generic core 後直接消失。
- 同時，這些內容也不能繼續散落在未來會被 upstream sync 覆蓋的 managed tree 中。
- 若不做這一 phase，後續每次 sync 都會在 roles、skills、runtime policy 與 docs 上產生巨大 diff，最後回到「不敢 sync」的狀態。

### Non-goals

- 不把 `.agent/**` 轉成 shim。
- 不切 `/dev` live authority。
- 不做 downstream product tests / smoke。

### Acceptance Criteria

1. custom skills 已有正式去向，原則上收斂到 `.workflow-core/skills_local/**`。
2. mutable catalog / config / state 已有正式去向，原則上收斂到 `.workflow-core/state/**` 與 `.workflow-core/config/**`。
3. Ivyhouse-specific role / review / governance wording 已找到正式落點，不再只能依附在 upstream-managed core 檔案上。
4. `workflow_core_sync_precheck.py` 預期只剩可解釋的小量 divergence，而不是大面積本地客製修改。

### Edge Cases

- 某些 Ivyhouse-specific 內容若同時屬規則與導航 -> 規則應上移到 `project_rules.md` / project-local instruction，導航則保留在 bootstrap surface。
- local skills 若與 upstream built-in skills 名稱重疊 -> 必須改以 local namespace 處理，不可覆蓋 built-in skill。
- `project_maintainers/**` 若既有 skeleton 與 upstream starter 類似 -> dated local records 保留；僅 skeleton 類文件需要判斷是否對齊或 patch。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `doc/plans/Idx-029_plan.md`
- `doc/plans/Idx-029_phase-0_plan.md`
- `doc/plans/Idx-029_phase-2_plan.md`
- `.agent/roles/engineer.md`
- `.agent/roles/qa.md`
- `.agent/roles/coordinator.md`
- `.agent/skills_local/**`
- `.agent/state/skills/INDEX.local.md`
- `.agent/config/**`
- `.agent/state/**`
- `project_rules.md`
- `project_maintainers/**`

### Missing Inputs

- Phase 0 的 detailed ownership matrix 尚未落檔
- local customization patch queue strategy 尚未正式決策

research_required: true

### Sources

- 本地 workflow customization files
- reviewed lessons learned 文檔

### Assumptions

- VERIFIED - local skills 正確長期去向是 `.workflow-core/skills_local/**`。
- VERIFIED - active plan/log、`project_rules.md` 與 dated maintainer artifacts 屬 project-local，不應被 upstream-managed core 吃掉。
- RISK: unverified - 某些 `.agent/roles/**` 內容可能需要部分回饋 upstream、部分保留 local overlay，正式搬家前需再做細切。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: `.workflow-core/**`, `project_rules.md`, `.github/instructions/**`, project-local docs
- Adjacent modules: `.agent/**` 作為來源對照，不進 shim 化
- Out of scope modules: `.vscode/**`, `.devcontainer/**`, live authority cutover

### File whitelist

- `.workflow-core/skills_local/**`
- `.workflow-core/state/**`
- `.workflow-core/config/**`
- `project_rules.md`
- `.github/instructions/**`
- `project_maintainers/**`
- `doc/logs/Idx-029_phase-3_log.md`

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 會決定 workflow customization 的 authority 落點。
- 不直接切 live authority，但會大幅改變後續 sync divergence 形狀。

#### RBAC IMPACT

- 只調整 workflow-level role wording authority，不動產品 RBAC。

#### SHARED KEY / CROSS-MODULE IMPACT

- 影響 workflow local config / state path，不涉及業務 shared key。

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- local execution state、skill catalog 與 policy config 的落點需要可追溯。

### Done 定義

1. custom skills 已搬家。
2. local catalog / config / state 已搬家。
3. Ivyhouse-specific 規則與導航的權威落點已重整。
4. managed divergence 顯著下降，且剩餘部分可解釋。

### Rollback 策略

- Level: L3
- 前置條件: Phase 3 需分批次搬移，先 skill / state，再 role wording / docs
- 回滾動作: 若任一批次搬家後 authority 消失，回滾該批次，不回滾已驗證完成的前一批次

### Max rounds

- 估計: 4
- 超過處理: 若第 4 輪仍有大量未分類 customizations，必須拆出 patch-queue work unit

### Bounded work unit contract

> 正式執行時建議拆為三個 bounded units：skills、state/config、role/docs wording。

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/plans/Idx-029_phase-3_plan.md` | 新增 | 建立 Phase 3 supporting plan |

---

## 實作指引

### 1. Custom Skills

- 將 `.agent/skills_local/**` 全數盤點 namespace、觸發條件、引用位置與 owner。
- 搬到 `.workflow-core/skills_local/**` 後，需同步處理 local catalog 與任何引用清單。

### 2. Mutable State / Config

- 把 `.agent/state/**` 與 `.agent/config/**` 中真正會被 runtime 寫入或 project-local 覆寫的內容，搬到 `.workflow-core/**`。
- 不可把 upstream canonical docs 誤搬到 mutable root。

### 3. Role / Governance Wording

- 分辨哪些是 workflow generic core、哪些是 Ivyhouse domain overlay。
- generic core 儘量不改；domain overlay 改由 project rules、custom instructions 或極小 patch queue 承接。

### 4. Maintainer Surface

- `project_maintainers/**` 只保留本專案需要的 supporting artifacts。
- 不必將 upstream `maintainers/**` 整包導入 downstream。

---

## 注意事項

- 風險提示: 這一 phase 最容易把「很重要的本地規則」搬丟，尤其是 role docs 與 local skills 的引用鏈。
- 資安考量: customizations 搬家時，不得把任何執行 artifact、評審暫存內容或憑證帶進 `.workflow-core/**`。
- 相依性: 必須建立在 Phase 2 canonical roots 已存在的前提上。
- 缺漏前提: 若未先決定 patch queue 策略，role wording 分離時會反覆卡在「到底放 local 還是 upstream」。

---

## 相關資源

- `doc/plans/Idx-029_plan.md`
- `doc/plans/Idx-029_phase-0_plan.md`
- `doc/plans/Idx-029_phase-2_plan.md`

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