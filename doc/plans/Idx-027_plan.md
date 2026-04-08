# Plan: Idx-027 — Workflow 修正切片：UI/UX local skills 自動載入鏈與 PTY formal execution 強制收斂

> Historical note (`Idx-029` Phase 4): 本文件中的 `.agent/skills_local/**` 與 `.agent/state/skills/INDEX.local.md` 為 cutover 前路徑，現行 mutable authority 已改為 `.workflow-core/**`。

**Index**: Idx-027
**Created**: 2026-04-05
**Planner**: Copilot
**Phase**: Phase 1 → Go-Live Support
**Primary Module**: Workflow Tooling / Portal
**Work Type**: governance / implementation
**Track**: workflow-core

---

## 🎯 目標

在 `Idx-023` 前端 Portal 正式切片開工前，先修正 workflow 的兩個基礎缺口：

1. `Idx-026` 已建立的 UI/UX local skills 尚未被 workflow 自動載入。
2. formal workflow 雖可在 Plan 內選擇 `codex-cli` / `copilot-cli` 作為 executor / QA tool，但目前缺少確保「真的透過 PTY 主路徑執行」的收斂機制，導致 chat direct-edit 可能偽裝成 formal execution。

本計畫的成功條件是：後續前端切片能透過正式 workflow 自動命中 UI/UX local skills，且正式執行與 QA 都留下可驗證的 PTY evidence，而不是只停留在 Plan 欄位選擇。

---

## 📋 SPEC

### Goal

把 UI/UX local skills 接進 workflow trigger 鏈，並為 formal PTY execution 建立可驗證的 enforcement 與 smoke 驗證路徑。

### Business Context

- `Idx-023` 的關鍵路徑是前端 Portal UI，已依賴 `Idx-026` 建立的 UI/UX skill family。
- 若 workflow 不會自動載入這批 skills，後續 login / landing / token / icon / UI states 任務仍會靠臨時聊天指令解釋，無法保證一致性。
- 若 formal workflow 選定了 executor / qa tool 卻沒有真的透過 PTY 主路徑執行，整個 workflow evidence chain 會失真，無法支撐後續高風險前端與治理工作。

### Non-goals

- 不直接實作 `Idx-023` 的 login page、landing page 或 Next.js app。
- 不新增 UI agent / UX agent。
- 不改動 business module、schema、API 或 RBAC。

### Acceptance Criteria

1. workflow 中存在可實際使用的 UI/UX skill trigger 規則，能對應 `.agent/skills_local/` 的 skill family，而不是只停留在 local overlay catalog。
2. Coordinator / Engineer 注入規則可明確說明：命中前端 / UI/UX 任務時，需先讀哪些 local skills 與 references。
3. formal PTY execution contract 被補強，使「選定 executor / qa tool」與「真的透過 PTY 執行 / 留證」之間不再脫鉤。
4. 至少有一條最小 smoke / validation 路徑，可以驗證 Codex PTY 與 Copilot PTY 都真的被 workflow 接手，而不是只改 Plan 欄位。
5. `Idx-023` 後續前端切片可以直接引用本修正成果開工。

### Edge Cases

- 現有 workflow 明文引用的 `engineer_skill_trigger_checklist.md`、`coordinator_research_skill_trigger_checklist.md`、`.agent/roles/coordinator.md` 目前在 repo 中未找到 -> 必須先決定是補檔還是改寫引用面。
- PTY command surface 已存在，但若 extension / command wiring 仍缺實際 workflow 注入證據 -> 需補 smoke / verification step，不可只靠 README 宣稱。
- 若 QA 仍只以 chat 內審查替代 Copilot PTY 實跑 -> 需在 contract 上禁止視為 formal QA 完成。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `.agent/workflows/AGENT_ENTRY.md`
- `.agent/workflows/dev-team.md`
- `.agent/runtime/tools/vscode_terminal_pty/README.md`
- `.agent/runtime/scripts/vscode/workflow_preflight_check.py`
- `.agent/state/skills/INDEX.local.md`
- `.agent/skills_local/**`
- `doc/plans/Idx-026_plan.md`
- `doc/logs/Idx-026_log.md`

### Missing Inputs

- `.agent/workflows/references/engineer_skill_trigger_checklist.md`
- `.agent/workflows/references/coordinator_research_skill_trigger_checklist.md`
- `.agent/roles/coordinator.md`

research_required: true

### Sources

- workflow 入口與順序：`.agent/workflows/AGENT_ENTRY.md`、`.agent/workflows/dev-team.md`
- PTY command surface 與 artifact contract：`.agent/runtime/tools/vscode_terminal_pty/README.md`
- 已建 UI/UX local skill family：`.agent/state/skills/INDEX.local.md`、`.agent/skills_local/**`

### Assumptions

- VERIFIED - UI/UX skills 已存在於 `.agent/skills_local/`，缺口在 trigger/injection，而不是 skill package 本身不存在。
- VERIFIED - PTY command surface 與 preflight 腳本已存在，缺口在 workflow 實際 enforcement 與 smoke evidence，而不是完全沒有 PTY 工具。
- RISK: unverified - 補齊 checklist 與 PTY enforcement 後，是否還需要調整 log / completion marker 偵測路徑，需在 implementation 階段確認。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Workflow Tooling / Portal
- Adjacent modules: `.agent/runtime/tools/vscode_terminal_pty/`, `.agent/runtime/scripts/vscode/`, `.agent/roles/`, `.agent/state/skills/`
- Out of scope modules: `apps/api/**`, `apps/web/**`, `doc/architecture/**`（除必要引用外不修改）

### File whitelist

- `.agent/workflows/AGENT_ENTRY.md` - 若需補 formal execution / trigger 合約
- `.agent/workflows/dev-team.md` - 若需補順序與 handoff 規則
- `.agent/workflows/references/engineer_skill_trigger_checklist.md` - 補 UI/UX local skills 載入規則
- `.agent/workflows/references/coordinator_research_skill_trigger_checklist.md` - 若需補 coordinator 研究期 skill 載入規則
- `.agent/roles/coordinator.md` - 若缺檔則補最小責任與 PTY enforcement 契約
- `.agent/roles/engineer.md` - 若需補 local overlay skill 載入說明
- `.agent/roles/qa.md` - 若需補 UI/UX local skills 的 QA 使用規則
- `.agent/runtime/scripts/vscode/workflow_preflight_check.py` - 若需補 PTY formal execution 前置檢查
- `.agent/runtime/tools/vscode_terminal_pty/README.md` - 僅在契約說明需同步更新時修改
- `doc/logs/Idx-027_log.md` - 執行記錄

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 影響 active workflow 的 skill injection 與 execution evidence contract。
- 不改 business state machine，但會改 workflow state 的「何時可視為正式執行完成」判定條件。

#### RBAC IMPACT

- N/A

#### SHARED KEY / CROSS-MODULE IMPACT

- N/A（僅限 workflow tooling surface）

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- 會直接影響 PTY artifact、workflow evidence、log 是否可作為真正執行證據。

### Done 定義

1. UI/UX local skills 已有正式 trigger / injection path，不再只是存在於 `.agent/skills_local/`。
2. formal workflow 若選定 `codex-cli` / `copilot-cli`，必須有可驗證的 PTY execution / QA evidence contract。
3. 至少有一條可重跑的最小 smoke 驗證路徑，能證明 workflow 真的用了 PTY 主路徑。

### Rollback 策略

- Level: L2
- 前置條件: 僅限 workflow / runtime tooling / local checklist 修正
- 回滾動作: 還原 `.agent/` 相關修正，保留 `Idx-027` plan / log 與問題分析記錄

### Max rounds

- 估計: 2-4
- 超過處理: 若 PTY enforcement 需改到 extension/runtime 深層行為，應拆成子切片，不在同一輪硬做完

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-027-workflow-autoload-and-pty-enforcement
  goal: repair workflow skill autoload path for local UI/UX skills and enforce real PTY-backed formal execution with a minimal validation route
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - touched-file-lint
  file_scope:
    - .agent/workflows/
    - .agent/roles/
    - .agent/runtime/scripts/vscode/
    - .agent/runtime/tools/vscode_terminal_pty/
    - doc/logs/Idx-027_log.md
  done_criteria:
    - local UI/UX skills have an explicit workflow trigger path
    - formal execution contract explicitly distinguishes PTY execution from chat direct-edit
    - a minimal PTY validation route is documented or implemented within approved scope
    - no file changes outside file_scope
    - engineer result is ready for external review
  escalation_conditions:
    - scope break
    - missing workflow reference files require broader template-level reconstruction
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `.agent/workflows/AGENT_ENTRY.md` | 可能修改 | 補 formal execution / trigger contract |
| `.agent/workflows/dev-team.md` | 可能修改 | 補 workflow 順序與注入規則 |
| `.agent/workflows/references/engineer_skill_trigger_checklist.md` | 新增 / 修改 | 補 UI/UX local skill triggers |
| `.agent/workflows/references/coordinator_research_skill_trigger_checklist.md` | 新增 / 修改 | 補 coordinator research triggers |
| `.agent/roles/coordinator.md` | 新增 / 修改 | 補 PTY enforcement 與注入責任 |
| `.agent/roles/engineer.md` | 可能修改 | 補 local overlay skill 載入說明 |
| `.agent/roles/qa.md` | 可能修改 | 補 UI/UX local skill QA 使用規則 |
| `.agent/runtime/scripts/vscode/workflow_preflight_check.py` | 可能修改 | 補 formal execution 驗證條件 |
| `doc/logs/Idx-027_log.md` | 新增 | 記錄執行與驗證證據 |

---

## 實作指引

### 1. skills autoload 修正

- 先決定 workflow authoritative 來源應該是：
  - 補齊原本引用但缺失的 checklist files
  - 或把引用重寫到現有可維護 surface
- 前端 / UI / UX 任務需至少能自動命中：
  - `brand-style-system`
  - `ops-entry-pages`
  - `ops-flow-landing`（條件式）
  - `react-ui-state-patterns`
  - `iconography-2_5d`（條件式）
  - `accessibility-density-review`（條件式）

### 2. PTY formal execution 修正

- formal workflow 選定 executor / qa tool 後，不應再讓 chat direct-edit 被視為正式執行完成。
- 至少要明確要求：
  - PTY bootstrap
  - preflight pass
  - start / send / submit / verify evidence
  - completion marker 或等價可驗證結果

### 3. 驗證策略

- 第一層：plan validator / touched-file checks
- 第二層：最小 PTY smoke / no-op workflow 驗證
- 驗證目標不是實作業務功能，而是驗證 workflow 本身會真的載入 skills 並走 PTY

---

## 注意事項

- 風險提示: 這個切片碰的是 workflow 自己的可信度；若做不對，後續所有 formal tasks 的 evidence 都可能失真。
- 資安考量: 不要為了證明 PTY 有跑，就在 runtime 中加入會洩漏 prompt / secret 的 debug shortcut。
- 相依性: 直接承接 `Idx-026` 與 `Idx-023` 的前端工作前置需求。
- 缺漏前提: 缺失的 checklist / coordinator 檔案若屬 template 遺失而不是 project-local 遺失，可能需要先做最小補件再談修正。

---

## 相關資源

- `doc/plans/Idx-026_plan.md`
- `doc/logs/Idx-026_log.md`
- `.agent/workflows/AGENT_ENTRY.md`
- `.agent/workflows/dev-team.md`
- `.agent/runtime/tools/vscode_terminal_pty/README.md`
- `.agent/state/skills/INDEX.local.md`

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [workflow-core]
plan_created: [2026-04-05 09:26:11]
plan_approved: [2026-04-05 09:27:09]
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
execution_backend_policy: [pty-primary-with-consented-fallback]
scope_exceptions: []

# Engineer 執行
executor_tool: [codex-cli]
executor_backend: [ivyhouse_terminal_pty]
monitor_backend: [pty_runtime_monitor]
log_file_path: [doc/logs/Idx-027_log.md]
executor_tool_version: [workspace-installed]
executor_user: [GitHub Copilot]
executor_start: [2026-04-05 09:27:09]
executor_end: [2026-04-05 09:36:30]
session_id: [N/A]
last_change_tool: [codex-cli]

# QA 執行
qa_tool: [copilot-cli]
qa_tool_version: [workspace-installed]
qa_user: [GitHub Copilot]
qa_start: [2026-04-05 09:34:38]
qa_end: [2026-04-05 09:36:30]
qa_result: [PASS]
qa_compliance: [✅ 符合（cross-QA）]
<!-- EXECUTION_BLOCK_END -->