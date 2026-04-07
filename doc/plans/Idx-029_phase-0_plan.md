# Plan: Idx-029 Phase 0 — Workflow-core Cutover Readiness、Ownership Matrix 與 Migration Inventory

**Parent Task**: Idx-029
**Created**: 2026-04-07
**Planner**: Copilot
**Phase**: Phase 0
**Primary Module**: Workflow Tooling / Governance
**Work Type**: governance / migration

---

## 🎯 目標

在任何 bootstrap refresh、canonical core 導入或 shim 清理之前，先把 Ivyhouse downstream 目前的 workflow surface、檔案 ownership、managed divergence 與專案特化內容完整盤點出來，形成可直接支撐 cutover 的 migration inventory。這一 phase 的成功與否，決定後續 Phase 1 到 Phase 5 能不能用可控 batch 前進，而不是靠人工記憶在舊 `.agent` 與新 `.github/workflow-core` 之間來回對照。

---

## 📋 SPEC

### Goal

產出一份可操作的 ownership matrix、upstream ref 決策、batch inventory 與 cutover 前置條件清單，作為後續所有 phase 的共同基線。

### Business Context

- 這一輪屬於 workflow 治理主線，不直接產生產品功能，但它決定後續 `/dev`、Engineer、QA、Security Review 的執行基座是否可持續維護。
- 主要使用角色是 Coordinator / Maintainer，而不是功能模組使用者。
- 如果沒有先把 managed core、project-local overlay 與 mutable surface 分開，後續每一輪 sync 都會把專案特化內容當成偏差，而不是預期設計。

### Non-goals

- 不導入任何 upstream 檔案。
- 不直接修改 `.agent/**`、`.github/**`、`.workflow-core/**`、`.vscode/**`、`.devcontainer/**` 的 live contract。
- 不處理產品功能、測試程式或 schema。

### Acceptance Criteria

1. 已建立完整 inventory，涵蓋 workflow entry、prompt、roles、skills、runtime scripts、settings、devcontainer、maintainer surfaces。
2. 已為每一批相關檔案標註 ownership 類別：upstream-managed、project-local、mutable/runtime、compatibility-only、historical/archive。
3. 已選定本次 cutover 要追的 upstream ref，並記錄 upstream canonical files 的比對基線。
4. 已形成 phase batch inventory，明確指出每個 phase 的輸入檔案與禁止提前動作。
5. 已識別所有高風險 divergence 與需要人工 merge 的 surface。

### Edge Cases

- 本地若存在未提交 workflow 變更 -> 先標記為 local delta，不得直接納入 migration inventory 當成既有 authority。
- upstream 某些文件若有過渡期舊命名殘留 -> 以實際 canonical entry、manifest 與 root bootstrap surface 為準，不以單一文件字串作唯一判定。
- 本地已有部分 `workflow_core_*` scripts -> 視為半升級痕跡，需要單獨標註，不得直接歸類為 canonical core 已導入。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/plans/Idx-029_plan.md`
- `.github/instructions/Ivyhouse_op_system_instructions.instructions.md`
- `.agent/workflows/AGENT_ENTRY.md`
- `.agent/workflows/dev-team.md`
- `.agent/roles/coordinator.md`
- `.agent/roles/engineer.md`
- `.agent/roles/qa.md`
- `.agent/runtime/scripts/workflow_core_projection.py`
- `.agent/runtime/scripts/workflow_core_sync_precheck.py`
- `.agent/runtime/scripts/workflow_core_sync_apply.py`
- `.agent/runtime/scripts/workflow_core_sync_verify.py`
- `.agent/runtime/scripts/workflow_core_sync_update.py`
- `.agent/runtime/scripts/vscode/workflow_preflight_check.py`
- `.agent/skills/_shared/__init__.py`
- `.vscode/settings.json`
- `.devcontainer/devcontainer.json`
- `project_maintainers/README.md`
- `obsidian-vault/20-reviewed/lessons-learned/downstream-workflow-core-upgrade-customization-lessons.md`

### Missing Inputs

- upstream 固定 release ref 尚未正式記錄到 repo artifact
- 本地 ownership matrix 尚未落檔
- 本地 batch inventory 尚未落檔

research_required: true

### Sources

- 本 repo 現況文件與 workflow surface
- upstream `agent-workflow-template` 現行 canonical files
- reviewed lessons learned 文檔

### Assumptions

- VERIFIED - 目前 repo 沒有既有的 phase supporting plan 命名慣例，因此可由 `Idx-029_phase-*` 建立新慣例。
- VERIFIED - `project_rules.md`、`doc/plans/**`、`doc/logs/**`、`tests/**`、dated `project_maintainers/**` 應保留 project-local ownership。
- VERIFIED - root `.github/**` 與 `.github/workflow-core/**` 是 upstream 新模型的必要 bootstrap + canonical surface。
- RISK: unverified - 本地是否存在未提交的 workflow local delta，需要正式執行前再檢查一次。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Workflow Tooling / Governance
- Adjacent modules: `.agent/**`, `.github/**`, `.workflow-core/**`, `.vscode/**`, `.devcontainer/**`, `project_maintainers/**`
- Out of scope modules: `apps/**`, `doc/architecture/**` 的業務規格正文、schema、migration、runtime 功能程式碼

### File whitelist

- `doc/plans/Idx-029_phase-0_plan.md` - 本 phase 計畫
- 後續建議輸出：ownership matrix / migration inventory / ref decision note

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 盤點 workflow canonical source、execution evidence source 與 role routing。
- 不改正式 workflow 狀態，只建立盤點基線。

#### RBAC IMPACT

- 僅盤點 workflow-level reviewer / coordinator / engineer / QA / security role surfaces。

#### SHARED KEY / CROSS-MODULE IMPACT

- 盤點 workflow path contract，不涉及業務 shared key。

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- 盤點 execution log、PTY artifact、review package 與 future `.workflow-core/state/**` 的預期落點。

### Done 定義

1. 已完成 ownership matrix 初稿。
2. 已完成 upstream ref 決策紀錄。
3. 已完成 phase batch inventory。
4. 已列出需要人工 merge、patch queue、shim、淘汰的候選 surface。

### Rollback 策略

- Level: L1
- 前置條件: 僅允許新增 planning / inventory artifacts
- 回滾動作: 若盤點分類邏輯有誤，只回滾盤點 artifact，不影響 live workflow surface

### Max rounds

- 估計: 2
- 超過處理: 若第二輪仍無法判斷 ownership，必須建立 decision record 再進行後續 phase

### Bounded work unit contract

> 本 phase 屬治理盤點，不進 bounded Engineer loop。

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/plans/Idx-029_phase-0_plan.md` | 新增 | 建立 Phase 0 supporting plan |

---

## 實作指引

### 1. Inventory 範圍

- 必須逐批盤點：workflow entry、prompts、agents、instructions、roles、runtime scripts、skill manifests、local skills、VS Code settings、devcontainer bootstrap、maintainer supporting surfaces。
- 每一批都要標 ownership 與未來去向，不能只寫「待確認」。

### 2. Ownership Matrix 形狀

- 建議至少包含：現有路徑、用途、目前 authority、目標 authority、phase、處理方式、驗證 gate、備註。
- `move`、`shim`、`retire`、`keep` 必須是 machine-sortable 的欄位值，避免靠敘述判斷。

### 3. Upstream Ref 決策

- 先選固定 tag 或 SHA，再做所有 phase planning。
- 不建議直接追 `main`，除非 maintainers 願意承受 planning 與 implementation 不可重現風險。

### 4. 高風險清單

- 必須顯式列出：Ivyhouse-specific role wording、UI/UX local skills、`.vscode/settings.json`、`.devcontainer/devcontainer.json`、`.agent/runtime/scripts/**`。

---

## 注意事項

- 風險提示: 若 inventory 不完整，後續 phase 會同時踩到 managed divergence、lost customization 與 broken bootstrap 三種問題。
- 資安考量: 盤點時不得把任何 token、secret、terminal artifact 內容寫進 planning doc。
- 相依性: 本 phase 是所有後續 phase 的 hard gate。
- 缺漏前提: 若 upstream ref 尚未固定，Phase 1 之後的所有差異比較都不具可重現性。

---

## 相關資源

- `doc/plans/Idx-029_plan.md`
- `obsidian-vault/20-reviewed/lessons-learned/downstream-workflow-core-upgrade-customization-lessons.md`

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