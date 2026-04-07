# Plan: Idx-029 Phase 2 — Canonical Core 導入：`core_ownership_manifest.yml`、`.github/workflow-core/**` 與 `.workflow-core/**`

**Parent Task**: Idx-029
**Created**: 2026-04-07
**Planner**: Copilot
**Phase**: Phase 2
**Primary Module**: Workflow Tooling / Governance
**Work Type**: migration

---

## 🎯 目標

在 root bootstrap surface 已就位之後，正式把 upstream 新模型的 canonical core 與 mutable/runtime companion root 導入 Ivyhouse repo。這一 phase 會讓 repo 首次具備 `.github/workflow-core/**` 與 `.workflow-core/**` 的正式雙根結構，從而結束「只有舊 `.agent` live surface」的架構狀態。

---

## 📋 SPEC

### Goal

導入 manifest-backed core 與 mutable surface，使本 repo 在結構上具備進入新 sync lane 的最小前提。

### Business Context

- upstream 現行模型的 machine-readable authority 來自 `core_ownership_manifest.yml`。
- `.github/workflow-core/**` 是 canonical workflow source，`.workflow-core/**` 是 downstream mutable/state surface。
- 若沒有這一 phase，後續即使有新 root `.github/**` prompt / agents，也只是 bootstrap shell，無法完成真正 cutover。

### Non-goals

- 不搬移 project-local customization。
- 不修改 `.agent/**` 使其失效。
- 不切 `.vscode/**` 或 `.devcontainer/**` 的 live bootstrap path。

### Acceptance Criteria

1. repo root 已存在 `core_ownership_manifest.yml`。
2. `.github/workflow-core/**` canonical tree 已導入，且包含 AGENT_ENTRY、workflows、roles、runtime scripts、skills、docs/downstream surface。
3. `.workflow-core/**` mutable/runtime companion root 已建立，至少涵蓋 state、config、skills_local、staging 與 execution log 落點。
4. 本地 helper / sync scripts 已能在結構上找到 manifest 與新 canonical root。
5. 此 phase 完成後，repo 可進行 project-local customization 分離，而不必再倚賴 `.agent/**` 作唯一 root。

### Edge Cases

- upstream manifest 對某些 starter files 有 excluded / split_required 規則 -> 必須原樣理解，不可為了本地方便而改寫語意。
- 本地 `.agent/runtime/scripts/workflow_core_*.py` 已存在類似功能 -> 需標記為舊 root wrapper 候選，而不是直接覆寫成新 canonical implementation。
- 若 `.workflow-core/**` 某些目錄在 upstream 僅於 runtime 產生 -> 本 phase 可先建立空目錄 / placeholder 約定，但不能把 runtime data 預寫成假內容。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `doc/plans/Idx-029_plan.md`
- `doc/plans/Idx-029_phase-0_plan.md`
- `doc/plans/Idx-029_phase-1_plan.md`
- upstream `core_ownership_manifest.yml`
- upstream `.github/workflow-core/**`
- upstream `.github/workflow-core/docs/downstream/PORTABLE_WORKFLOW.md`
- upstream `doc/AGENT_WORKFLOW_TEMPLATE_UPSTREAM.md`
- local `.agent/runtime/scripts/workflow_core_manifest.py`

### Missing Inputs

- Phase 0 的 batch inventory 與 mapping note 尚未落檔

research_required: true

### Sources

- upstream canonical core tree
- local workflow-core helper scripts

### Assumptions

- VERIFIED - `.agent/runtime/scripts/workflow_core_manifest.py` 已預期 root manifest 路徑為 `core_ownership_manifest.yml`。
- VERIFIED - `.workflow-core/**` 是 mutable/runtime split 的正式落點，不應再維持在 `.agent/state/**` 與 `.agent/config/**`。
- RISK: unverified - upstream 現行 `.github/workflow-core/**` 內是否有本地已客製過的對應 surface，需要在導入前再做一次 diff inventory。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: `.github/workflow-core/**`, `.workflow-core/**`, `core_ownership_manifest.yml`
- Adjacent modules: `.agent/runtime/scripts/**` 只作 reference
- Out of scope modules: project-local skills 搬移、`.agent/**` shim、`.vscode/**`、`.devcontainer/**`

### File whitelist

- `core_ownership_manifest.yml`
- `.github/workflow-core/**`
- `.workflow-core/**`
- `doc/logs/Idx-029_phase-2_log.md`

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 建立 workflow canonical source 與 mutable state surface。
- 暫不切換 live execution model，但 structure 上已可支援新模型。

#### RBAC IMPACT

- 導入 core roles surface，不改業務 RBAC。

#### SHARED KEY / CROSS-MODULE IMPACT

- 影響 workflow contract 與 sync lane，不涉及業務 shared key。

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- 建立 `.workflow-core/state/execution_log.jsonl` 等 future evidence 落點。

### Done 定義

1. canonical core 已導入。
2. mutable root 已建立。
3. manifest 可被正確讀取。
4. 後續 project-local customization 已有正式去向。

### Rollback 策略

- Level: L2
- 前置條件: Phase 2 只導入新 root，不動舊 `.agent/**` authority
- 回滾動作: 若 manifest 或 canonical tree 導入造成 path contract 混亂，回滾 Phase 2 新增檔案，保留 Phase 1 bootstrap surface

### Max rounds

- 估計: 3
- 超過處理: 若三輪內仍無法對齊 manifest 與 local helper，拆出 sync-tool compatibility 子 work unit

### Bounded work unit contract

> 正式執行時可切成「manifest + canonical tree」與「mutable root scaffolding」兩個 batch，但此處先作單一 supporting plan。

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/plans/Idx-029_phase-2_plan.md` | 新增 | 建立 Phase 2 supporting plan |

---

## 實作指引

### 1. 導入順序

1. `core_ownership_manifest.yml`
2. `.github/workflow-core/AGENT_ENTRY.md`
3. `.github/workflow-core/workflows/**`
4. `.github/workflow-core/roles/**`
5. `.github/workflow-core/runtime/**`
6. `.github/workflow-core/skills/**`
7. `.workflow-core/**` mutable root

### 2. Mutable Root 原則

- `.workflow-core/state/**` 只放 mutable state，不放 upstream-managed canonical docs。
- `.workflow-core/config/**` 只放 downstream local config。
- `.workflow-core/skills_local/**` 是 custom skills 正式去向。

### 3. 驗證切面

- 至少確認 manifest path、AGENT_ENTRY path、workflows/dev path 與 mutable root 路徑一致。
- 至少做一次新舊 root path mapping 檢查，避免 `.agent/state/**` 與 `.workflow-core/state/**` 產生雙寫。

### 4. 禁止事項

- 不可在本 phase 偷渡 local skills 搬家。
- 不可在本 phase 直接清掉 `.agent/**`。

---

## 注意事項

- 風險提示: Phase 2 最容易形成「雙 canonical root」假象；導入成功不代表 authority 已切換。
- 資安考量: mutable root 建置時不可預填真實 execution artifacts 或敏感 terminal traces。
- 相依性: 依賴 Phase 1 的 bootstrap surface 已就位。
- 缺漏前提: 若 Phase 0 尚未確認哪些 local state 需要搬移，Phase 2 只能先建空 root，不能宣稱 split 完成。

---

## 相關資源

- `doc/plans/Idx-029_plan.md`
- `doc/plans/Idx-029_phase-0_plan.md`
- `doc/plans/Idx-029_phase-1_plan.md`

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