# Workflow-core Cutover Inventory

更新日期：2026-04-07

Authoritative source：否（cutover inventory / migration planning support）

## 目的

本文件作為 `Idx-029` Phase 0 的正式 inventory artifact，記錄 Ivyhouse downstream 從舊 `.agent/**` PTY-primary workflow 升級到 `.github/workflow-core/**` + `.workflow-core/**` 新模型前的基線、ownership 分類、phase batch 與 root bootstrap merge 決策。

本文件不取代 `project_rules.md`、`doc/implementation_plan_index.md`、`.github/instructions/Ivyhouse_op_system_instructions.instructions.md` 或未來 `.github/workflow-core/**` 的 canonical authority；它只負責描述 cutover 過程中的現況與遷移決策。

## Upstream 基線

- upstream repo：`foreverwow001/agent-workflow-template`
- branch：`main`
- fixed ref：`3f6be124ee718744e6fd32812cd0e9591da97319`
- 取樣日期：2026-04-07

## 本地現況摘要

### root `.github/**`

- 本地 Phase 1 實作前只有 `.github/instructions/Ivyhouse_op_system_instructions.instructions.md`
- 缺少 root bootstrap surface：`.github/prompts/**`、`.github/agents/**`、`.github/copilot-instructions.md`

### 舊 canonical workflow surface

- `.agent/workflows/AGENT_ENTRY.md`
- `.agent/workflows/dev-team.md`
- `.agent/roles/**`
- `.agent/runtime/**`
- `.agent/skills/**`
- `.agent/skills_local/**`
- `.agent/state/**`
- `.agent/config/**`

### 尚未存在的新模型必要 surface

- `core_ownership_manifest.yml`
- `.github/workflow-core/**`
- `.workflow-core/**`

## Ownership Matrix

| 現有或目標路徑 | 目前狀態 | 目標 authority | 分類 | 預定處理 | 目標 phase |
|------|------|------|------|------|------|
| `.github/instructions/Ivyhouse_op_system_instructions.instructions.md` | 已存在 | project-local instruction overlay | keep | 保留，不由 upstream 覆蓋 | Phase 1 |
| `.github/copilot-instructions.md` | Phase 1 前不存在 | root bootstrap surface | upstream-managed bootstrap + local note | 導入並補本地 overlay 說明 | Phase 1 |
| `.github/prompts/dev.prompt.md` | Phase 1 前不存在 | root bootstrap surface | upstream-managed bootstrap | 直接導入 | Phase 1 |
| `.github/agents/*.agent.md` | Phase 1 前不存在 | root bootstrap surface | upstream-managed bootstrap | 直接導入 | Phase 1 |
| `.github/instructions/reviewer-packages.instructions.md` | Phase 1 前不存在 | root bootstrap surface | upstream-managed bootstrap | 直接導入 | Phase 1 |
| `.github/instructions/workflow-navigation.instructions.md` | Phase 1 前不存在 | root bootstrap surface | upstream-managed bootstrap + local note | 導入並補本地 overlay 導航說明 | Phase 1 |
| `core_ownership_manifest.yml` | 不存在 | manifest-backed ownership source | upstream-managed canonical | 導入 | Phase 2 |
| `.github/workflow-core/**` | 不存在 | canonical workflow docs / rules / roles | upstream-managed canonical | 導入 | Phase 2 |
| `.workflow-core/**` | 不存在 | mutable/runtime companion root | project-local mutable surface | 建立 | Phase 2 |
| `.agent/workflows/**` | 現行 workflow authority | compatibility surface | shim candidate | 改成 forwarding docs | Phase 4 |
| `.agent/roles/**` | 現行 role docs | compatibility / overlay source | split + shim candidate | 先盤點專案特化，再 shim 化 | Phase 3-4 |
| `.agent/runtime/**` | 現行 runtime / sync helper root | compatibility / wrapper surface | split + shim candidate | canonical 移轉後保留 tiny wrappers | Phase 3-4 |
| `.agent/skills_local/**` | 現行 local skills | `.workflow-core/skills_local/**` | move | 搬移 | Phase 3 |
| `.agent/state/skills/INDEX.local.md` | 現行 local catalog | `.workflow-core/state/skills/INDEX.local.md` | move | 搬移 | Phase 3 |
| `.agent/state/**` runtime-written content | 現行 mutable state | `.workflow-core/state/**` | move | 搬移 | Phase 3 |
| `.agent/config/**` project-local policy | 現行 local config | `.workflow-core/config/**` | move | 搬移 | Phase 3 |
| `.vscode/settings.json` | 現行 PTY-primary settings | project-local editor bootstrap | merge / cutover | 切到新 workflow mode | Phase 4 |
| `.devcontainer/devcontainer.json` | 現行舊 root bootstrap path | project-local environment bootstrap | merge / cutover | 切到新 root path | Phase 4 |
| `project_rules.md` | 已存在 | project-local governance authority | keep | 保留 | N/A |
| `doc/implementation_plan_index.md` | 已存在 | project-local state | keep | 保留 | N/A |
| `doc/plans/**` | 已存在 | project-local mutable artifact | keep | 保留 | N/A |
| `doc/logs/**` | 已存在 | project-local mutable artifact | keep | 保留 | N/A |
| `project_maintainers/**` dated artifacts | 已存在 | project-local support history | keep | 保留 | N/A |
| `tests/**` | 已存在 | downstream validation surface | keep | 保留並於 Phase 5 重跑 | N/A |

## Phase Batch Inventory

### Phase 0

- 固定 upstream ref
- 記錄 root `.github/**` 現況
- 建立 ownership matrix
- 建立 Phase 1 import / merge 決策表

### Phase 1

- 導入 root `.github/copilot-instructions.md`
- 導入 root `.github/prompts/dev.prompt.md`
- 導入 root `.github/agents/*.agent.md`
- 導入 root `.github/instructions/reviewer-packages.instructions.md`
- 導入 root `.github/instructions/workflow-navigation.instructions.md`
- 保留 `.github/instructions/Ivyhouse_op_system_instructions.instructions.md`

### Phase 2

- 導入 `core_ownership_manifest.yml`
- 導入 `.github/workflow-core/**`
- 建立 `.workflow-core/**`

### Phase 3

- 搬移 local skills、state、config
- 分離 Ivyhouse-specific role / governance wording

### Phase 4

- `.agent/**` shim 化
- `.vscode/**` 與 `.devcontainer/**` cutover

### Phase 5

- precheck / verify / portable smoke / downstream workflow smoke / sign-off

## Phase 1 Root Bootstrap Import / Merge 決策

| 檔案 | 決策 | 理由 |
|------|------|------|
| `.github/prompts/dev.prompt.md` | direct import | 本地無對應檔案，且 downstream active rules source 已由 prompt 指向 `project_rules.md` |
| `.github/agents/ivy-coordinator.agent.md` | direct import | 本地無 root agent，後續 canonical root 仍在 `.github/workflow-core/**` |
| `.github/agents/ivy-domain-expert.agent.md` | direct import | 本地無 root agent，作為 future review surface |
| `.github/agents/ivy-planner.agent.md` | direct import | 本地無 root agent |
| `.github/agents/ivy-engineer.agent.md` | direct import | 本地無 root agent |
| `.github/agents/ivy-qa-reviewer.agent.md` | direct import | 本地無 root agent |
| `.github/agents/ivy-security-reviewer.agent.md` | direct import | 本地無 root agent |
| `.github/instructions/reviewer-packages.instructions.md` | direct import | 本地無對應檔案，屬 generic reviewer package navigation |
| `.github/instructions/workflow-navigation.instructions.md` | import + local note | 需補充現有 Ivyhouse project-local instruction overlay 導航 |
| `.github/copilot-instructions.md` | import + local note | 需補充現有 Ivyhouse project-local instruction overlay 優先序 |

## 已識別高風險差異

1. `.agent/**` 仍是現行 live authority，Phase 1 不能提早改成 shim。
2. `.vscode/settings.json` 與 `.devcontainer/devcontainer.json` 仍是舊模型，Phase 1 不處理。
3. `.agent/roles/**` 與 `.agent/skills_local/**` 含大量 Ivyhouse-specific 內容，必須在 Phase 3 才處理。
4. root `.github/**` 導入後只提供 bootstrap / navigation；真正 canonical source 仍待 Phase 2 導入 `.github/workflow-core/**`。

## 完成條件

### Phase 0 完成條件

1. upstream ref 已固定。
2. ownership matrix 已建立。
3. Phase 1 import / merge 決策已建立。

### Phase 1 完成條件

1. root `.github/**` bootstrap surface 已導入。
2. `.github/instructions/Ivyhouse_op_system_instructions.instructions.md` 仍保留。
3. root `.github` 導航已明確標示 project-local overlay 與未來 canonical root 的邊界。

## 後續動作

1. 進入 Phase 2 前，先確認 root `.github/**` 已齊備且沒有和本地 instruction routing 衝突。
2. 進入 Phase 3 前，需先列出 `.agent/roles/**` 與 `.agent/state/**` 的 local divergence 細表。
3. Phase 4 不得在 Phase 2 / 3 未完成前提下啟動。