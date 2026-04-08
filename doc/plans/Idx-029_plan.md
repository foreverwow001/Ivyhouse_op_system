# Plan: Idx-029 — Workflow-core 升版與 cutover 計畫：由 `.agent` PTY-primary 遷移到 `.github/workflow-core` Chat-primary

**Index**: Idx-029
**Created**: 2026-04-07
**Planner**: Copilot
**Phase**: Phase 1 → Workflow Upgrade
**Primary Module**: Workflow Tooling / Governance
**Work Type**: governance / migration
**Track**: workflow-core

---

## 🎯 目標

把目前仍以 `.agent/**` 為 live workflow surface、以 PTY-primary 為正式執行模型的 Ivyhouse downstream repo，升級到 upstream 現行的 `workflow-core` delivery model：以 `.github/workflow-core/**` 為 canonical source、以 `.workflow-core/**` 為 mutable/runtime companion，並以 Chat-primary + fresh one-shot reviewers 作為正式 workflow 執行面。

這份計畫的目的不是直接開始改所有檔案，而是先把升版切成可執行的幾個 phase，明確定義每個 phase 的準備、驗收、rollback gate，以及每一批檔案該保留、搬移、shim、淘汰，避免把 cutover 做成一次不可控的大覆蓋。

---

## 📋 SPEC

### Goal

建立一份由現況到 workflow-core 升版完成的完整 cutover 計畫，使本 repo 後續可以先安全完成一次性架構切換，再回到 upstream `workflow-core sync lane` 的常規更新模式。

### Business Context

- 本 repo 是由舊版 `agent-workflow-template` 生成的 downstream，但 upstream 已改成 `core_ownership_manifest.yml` 驅動的 `workflow-core + overlay + sync lane` 模型。
- 目前 repo 仍以 `.agent/workflows/AGENT_ENTRY.md`、`.agent/workflows/dev-team.md`、PTY preflight 與 PTY artifact evidence 作為正式 workflow contract，與 upstream 現行 `.github/workflow-core/**` + Chat-primary / one-shot reviewer 模型不一致。
- 若直接把這次升級當成 `sync_update`，會漏掉 root `.github/**` bootstrap surface、`.workflow-core/**` mutable surface 與 project-specific customization 分離工作，後續每次 sync 都會持續產生 managed divergence。

### Non-goals

- 本計畫不直接執行檔案同步、刪除、搬移或 runtime 安裝。
- 本計畫不直接修改 `apps/api/**`、`apps/portal/**`、schema、migration、RBAC 或業務模組。
- 本計畫不把 Ivyhouse 專案治理內容退回 generic template；`project_rules.md`、`doc/architecture/**` 與專案特定審查邊界仍維持 project-local authority。

### Acceptance Criteria

1. 升版被明確拆成 several phases，且每個 phase 都有：目標、前置準備、操作內容、驗證方式、完成 gate、rollback / stop condition。
2. 計畫明確說明目前 repo 為何屬於「一次性 cutover / re-bootstrap」，而不是「可直接跑常規 sync_update」。
3. 計畫包含完整檔案分類矩陣，至少把相關 surface 分成：保留、搬移、shim、淘汰。
4. 計畫明確區分 upstream-managed core、project-local overlay、mutable/runtime surface、starter skeleton、historical/archive surface。
5. 計畫包含 cutover 完成後如何回到常規 sync lane 的條件與驗證步驟。

### Edge Cases

- upstream 目前仍處於過渡期，少數 artifact 存在舊命名殘留；本計畫需以實際 canonical entry 為準，不可機械照抄單一檔案字串。
- downstream 已混入部分早期 `workflow_core_*` scripts，但仍綁在 `.agent/**` root contract；必須視為「半升級」狀態，不可誤判為已完成新架構 bootstrap。
- Ivyhouse 專案目前的 `engineer.md`、`qa.md`、UI/UX skills、settings 與 devcontainer 已帶有專案特化內容；若直接覆蓋，會掉專案治理語意或產生長期 divergence。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `.github/instructions/Ivyhouse_op_system_instructions.instructions.md`
- `.agent/workflows/AGENT_ENTRY.md`
- `.agent/workflows/dev-team.md`
- `.agent/roles/coordinator.md`
- `.agent/roles/engineer.md`
- `.agent/roles/qa.md`
- `.agent/runtime/scripts/workflow_core_projection.py`
- `.agent/runtime/scripts/workflow_core_sync_update.py`
- `.agent/runtime/scripts/workflow_core_manifest.py`
- `.agent/skills/_shared/__init__.py`
- `.vscode/settings.json`
- `.devcontainer/devcontainer.json`
- `project_maintainers/README.md`
- `project_maintainers/chat/README.md`
- `project_maintainers/improvement_candidates/README.md`
- reviewed note: `obsidian-vault/20-reviewed/lessons-learned/downstream-workflow-core-upgrade-customization-lessons.md`

### Missing Inputs

- 本地目前無 `core_ownership_manifest.yml`
- 本地目前無 `.github/workflow-core/**` canonical tree
- 本地目前無 `.workflow-core/**` mutable companion root
- 本地目前無 root `.github/agents/**` / `.github/prompts/**` / `.github/copilot-instructions.md` bootstrap surface

research_required: true

### Sources

- 本地現況：`.agent/**`、`.vscode/settings.json`、`.devcontainer/devcontainer.json`
- upstream 現行模型：`README.md`、`core_ownership_manifest.yml`、`.github/workflow-core/AGENT_ENTRY.md`、`doc/AGENT_WORKFLOW_TEMPLATE_UPSTREAM.md`、`doc/VSCODE_INSIDER_CHAT_SETUP.md`
- reviewed lesson：`obsidian-vault/20-reviewed/lessons-learned/downstream-workflow-core-upgrade-customization-lessons.md`

### Assumptions

- VERIFIED - Ivyhouse 目前屬於「舊 `.agent` live surface + 部分 workflow_core scripts 提前落地」的半升級狀態，不能直接視為現行 bootstrap downstream。
- VERIFIED - `workflow_core_sync_update.py` 不會自動補 root `.github/**` bootstrap surface，因此第一次升版不能只靠單一 sync wrapper。
- VERIFIED - `project_rules.md`、`doc/implementation_plan_index.md`、active plan/log、tests 與專案自己的 dated `project_maintainers` artifacts 應保留 project-local ownership。
- VERIFIED - custom skills 的長期正確落點應為 `.workflow-core/skills_local/**`，local catalog 應落在 `.workflow-core/state/skills/INDEX.local.md`。
- RISK: unverified - upstream 現行 release/tag 選擇與本地 cutover 時的最佳 staging label 尚未決定；正式執行前需明確選 ref。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Workflow Tooling / Governance
- Adjacent modules: `.github/**`, `.agent/**`, `.workflow-core/**`, `.vscode/**`, `.devcontainer/**`, `project_maintainers/**`, `doc/plans/**`, `doc/logs/**`
- Out of scope modules: `apps/api/**`, `apps/portal/**`, `apps/**` 的業務功能程式碼、schema、migration、營運資料檔案

### File whitelist

- `doc/implementation_plan_index.md` - 登記本計畫任務
- `doc/plans/Idx-029_plan.md` - 本輪正式計畫
- 後續實作 phase 若啟動，再依各 phase 拆出更小的實作計畫與對應 file whitelist

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 本計畫直接影響 workflow entry、rules、role routing、review package、preflight 與 execution evidence 的 canonical source。
- 會改變正式 workflow 的執行模型：由 PTY-primary 遷移到 Chat-primary + one-shot reviewers。

#### RBAC IMPACT

- 不改業務 RBAC，但會影響 workflow 層的角色定義與責任分離方式。

#### SHARED KEY / CROSS-MODULE IMPACT

- 主要是 workflow surface 的 ownership 與 path contract，不涉及業務 shared key。

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- 會改變 workflow execution evidence 的來源：從 PTY current artifact 為主，轉向 review package、targeted checks、one-shot reviewer output 與 log 回填為主。

### Done 定義

1. 已完成一次性 cutover 所需的 phase 設計、前置準備、檔案矩陣與驗證 gates。
2. 已明確定義哪些 surface 屬於 upstream-managed core、哪些屬於 project-local overlay、哪些屬於 mutable/runtime surface。
3. 已定義 cutover 完成後回到常規 sync lane 的最小條件。

### Rollback 策略

- Level: L1（本計畫文件） / L2（後續 cutover phase）
- 前置條件: 正式實作前每個 phase 必須有可分離的 file batch 與驗證 gate，避免一次性不可逆覆寫
- 回滾動作: 若任一 phase 驗證失敗，停在該 phase 並保留前一 phase 已驗證完成的 surface，不允許把未驗證批次半套留在 canonical path

### Max rounds

- 估計: 5 phases
- 超過處理: 若 phase 內仍需再拆 batch，必須在 phase 啟動前額外建立子 work unit，而不是在執行中持續擴 scope

### Bounded work unit contract

> 本計畫屬治理 / migration blueprint，不直接進入 bounded Engineer loop。正式實作時，應依 phase 再拆成更小的 `work_unit`。

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/implementation_plan_index.md` | 修改 | 登記 `Idx-029` 任務 |
| `doc/plans/Idx-029_plan.md` | 新增 | 建立 workflow-core 升版與 cutover 正式計畫 |

---

## 升版總覽

### 升級判定

本 repo 目前命中以下條件，因此本次升級必須視為 **一次性 cutover / re-bootstrap**，不可直接當成例行 `sync_update`：

1. 正式 workflow 入口仍位於 `.agent/workflows/**`。
2. 正式執行模型仍為 PTY-primary，而非 Chat-primary + fresh one-shot reviewers。
3. root `.github/**` 缺少新版 bootstrap surface。
4. repo 尚未建立 `.workflow-core/**` mutable/runtime companion root。
5. repo 沒有 `core_ownership_manifest.yml`，無法進入 manifest-backed sync lane。

### 升版原則

1. 先建立新 canonical surfaces，再處理舊 surface 收斂。
2. 先分離 project-specific customization，再導入 upstream-managed core。
3. 先完成 root `.github/**` bootstrap refresh，再導入 `.github/workflow-core/**`。
4. `.agent/**` 在 cutover 完成前可暫存，但完成後只能作 shim，不可再獨立演化。
5. cutover 完成後，後續 upstream 更新才回到常規 `precheck -> sync_update -> downstream tests`。

---

## Phase Breakdown

## Phase 0 — Cutover Readiness 與 Ownership 盤點

### 目標

在任何檔案搬移或 bootstrap 前，先把現況、ownership 與 divergence 盤清楚，避免把 project-local customization 視為 upstream bug，或把 upstream-managed core 直接當成本地自由編輯面。

### 前置準備

1. 建立升級分支。
2. 固定本次要追的 upstream ref（建議 tag 或固定 SHA，而不是直接漂浮追 `main`）。
3. 盤點本地是否已有未提交變更，特別是 `.agent/**`、`.github/**`、`.vscode/**`、`.devcontainer/**`。
4. 明確記錄目前 `/dev` 正式入口、reviewer path、local skills path、execution evidence path。

### 執行內容

1. 建立「現況基線」清單：
   - workflow entry
   - rules source
   - role docs
   - skills / local skills / mutable state
   - VS Code settings
   - devcontainer post-create path
2. 盤點 project-specific customization：
   - Ivyhouse-specific engineer / QA / domain constraints
   - local UI/UX skills
   - reviewer / PTY settings
3. 若已先導入部分 `workflow_core_*` scripts，標記為「半升級 surface」，不可誤認為新 canonical root 已存在。

### 驗證方式

- 確認已能明確回答：哪些檔案屬於 upstream-managed core、哪些是 project-local、哪些是 mutable/runtime。
- 確認沒有把 `maintainers/**`、active plans/logs、tests、`project_rules.md` 誤列入 managed import 範圍。

### 完成 Gate

- 已完成 file ownership migration matrix 初稿。
- 已決定 upstream ref 與 cutover branch。
- 已確認本 repo 屬 cutover 而非常規 sync。

### Stop / Rollback Condition

- 若無法判定某批檔案是 upstream-managed 還是 project-local，停止進入下一 phase，先補 decision record。

---

## Phase 1 — Root Bootstrap Surface Refresh

### 目標

把新版 root `.github/**` bootstrap / customization surface 導入 repo，讓新版 `/dev` 入口與 agent customization 可以落地。

### 前置準備

1. 保留現有 `.github/instructions/Ivyhouse_op_system_instructions.instructions.md`。
2. 盤點目前 repo 是否已有 project-local `.github` customization 需要保留。
3. 決定 root `.github/**` 哪些檔案採 upstream 直接落地、哪些需 merge。

### 執行內容

1. 導入或對齊以下 root bootstrap surface：
   - `.github/copilot-instructions.md`
   - `.github/prompts/dev.prompt.md`
   - `.github/agents/ivy-coordinator.agent.md`
   - `.github/agents/ivy-engineer.agent.md`
   - `.github/agents/ivy-planner.agent.md`
   - `.github/agents/ivy-qa-reviewer.agent.md`
   - `.github/agents/ivy-security-reviewer.agent.md`
   - `.github/instructions/reviewer-packages.instructions.md`
   - `.github/instructions/workflow-navigation.instructions.md`
2. 保留 Ivyhouse 專案自己的 instruction 檔，並確認其導航不與 upstream authoritative source 衝突。
3. 若 root `.github/agents/*.agent.md` 需要保留 project-specific wording，改用人工 merge，而非覆蓋。

### 驗證方式

- `/dev` 可明確指向新版 `.github/prompts/dev.prompt.md`。
- `Ivy Coordinator`、`Ivy Engineer` 等 custom agent surface 已可被工作區識別。
- root `.github/**` 沒有覆蓋掉 Ivyhouse 專案自己的規則來源。

### 完成 Gate

- root `.github/**` bootstrap surface 已齊備。
- project-specific root `.github` customization 已完成 merge 或保留決策。

### Stop / Rollback Condition

- 若 root `.github/**` 導入後使現有 instruction routing 失效，先 rollback 本 phase，再補對應 merge 規則。

---

## Phase 2 — Canonical Core 導入與 Mutable Surface 建立

### 目標

建立新版 canonical core 與 companion mutable/runtime root，讓 repo 從「只有舊 `.agent` live surface」變成「`.github/workflow-core/**` + `.workflow-core/**`」雙根結構。

### 前置準備

1. 準備 upstream `core_ownership_manifest.yml` 與 `.github/workflow-core/**` 導入批次。
2. 確認 `.workflow-core/**` 在本地不存在，避免與舊 path 混用。
3. 盤點現有 `.agent/state/**`、`.agent/config/**`、`.agent/skills_local/**` 的可搬移內容。

### 執行內容

1. 導入 `core_ownership_manifest.yml`。
2. 導入 `.github/workflow-core/**` canonical tree。
3. 建立 `.workflow-core/**` mutable/runtime companion root，至少包含：
   - `.workflow-core/state/skills/`
   - `.workflow-core/config/skills/`
   - `.workflow-core/skills_local/`
   - `.workflow-core/staging/`
   - `.workflow-core/state/execution_log.jsonl` 的正式落點
4. 將 local skills / mutable state 的 canonical path 設計改為 `.workflow-core/**`。

### 驗證方式

- `core_ownership_manifest.yml` 可被本地 helper 正確讀取。
- `.github/workflow-core/AGENT_ENTRY.md`、`.github/workflow-core/workflows/dev.md`、`.github/workflow-core/roles/**`、`.github/workflow-core/skills/**` 均存在。
- `.workflow-core/**` mutable root 已建立，不再要求 canonical mutable state 留在 `.agent/**`。

### 完成 Gate

- 新 core 與 mutable root 都已存在。
- repo 已具備進入 manifest-backed sync lane 的基本前提。

### Stop / Rollback Condition

- 若 canonical core 導入後與 project_rules / workflow entry 發生明確衝突，停在本 phase，先做 project-local overlay cut。 

---

## Phase 3 — Project-specific Customization 搬家與 Overlay 收斂

### 目標

把 Ivyhouse 專案特有 customization 從 upstream-managed core 分離出去，避免後續每次 sync 都產生 divergence。

### 前置準備

1. 盤點目前哪些內容是專案特有，而不是 upstream 應持有：
   - Ivyhouse-specific role wording
   - 專案特有 reviewer / execution policy
   - repo-local UI/UX skills
   - `.vscode` / `.devcontainer` project-local設定
2. 決定哪些內容應上移到 `project_rules.md` 或 `doc/architecture/**`，哪些保留在 custom agent / overlay role / local skill。

### 執行內容

1. custom skills：
   - 將 project-local skills 正式歸位到 `.workflow-core/skills_local/**`
   - 將 local catalog 歸位到 `.workflow-core/state/skills/INDEX.local.md`
2. role customization：
   - upstream-managed core roles 盡量不直接改
   - 需要 project-specific extension 的內容，改成 custom agent wording、project rules、或少量 patch queue
3. mutable config / state：
   - 將 `.agent/state/**`、`.agent/config/**` 中屬 runtime / policy 的內容搬到 `.workflow-core/**`
4. project_maintainers：
   - 保留 dated handoff / archive / candidate records
   - README / template skeleton 若與 upstream starter 不同，明確記錄是保留 patch 還是回 upstream

### 驗證方式

- `workflow_core_sync_precheck.py` 不再把本地 customization 大量視為 managed divergence。
- custom skills、local catalog、mutable state 的 canonical path 都已離開 core-managed tree。
- Ivyhouse-specific治理語意仍能從 project rules / architecture / overlay surface 找到，不因 generic core 導入而消失。

### 完成 Gate

- 已完成 project-local customization 分離。
- upstream-managed core 與 project-local overlay 的責任邊界已清楚。

### Stop / Rollback Condition

- 若任何 Ivyhouse-specific 規則在搬家後找不到權威落點，停止進入下一 phase。

---

## Phase 4 — Compatibility Shim 與 Tooling Cutover

### 目標

把現有 `.agent/**` 從 live canonical surface 收斂為 compatibility shim，同時把 editor / devcontainer / workflow tooling 切到新模型。

### 前置準備

1. 確認 `.github/workflow-core/**` 與 `.workflow-core/**` 已就位。
2. 確認新版 root `.github/**` prompt / agent surface 可用。
3. 決定舊 `.agent/**` 哪些保留 forwarding doc，哪些保留 tiny wrapper script。

### 執行內容

1. `.agent/workflows/**`：
   - 改成 forwarding docs，指向 `.github/workflow-core/**`
2. `.agent/roles/**`、`.agent/skills/**`、`.agent/runtime/**`：
   - 能 wrapper 的保留 tiny wrapper
   - 能轉文檔導航的改 forwarding doc
   - 不再允許作為獨立 authoritative source 持續修改
3. `.vscode/settings.json`：
   - 從 PTY-primary 設定切到 Chat-primary + reviewer CLI readiness 設定
4. `.devcontainer/devcontainer.json`：
   - 更新 post-create 與相關 bootstrap 路徑到新 core

### 驗證方式

- `/dev` 正式入口已切到 `.github/prompts/dev.prompt.md`
- workflow 讀檔與 role routing 都以 `.github/workflow-core/**` 為準
- `.agent/**` 即使保留，也不再是 live authority
- settings / devcontainer 不再只依賴舊 `.agent` 路徑

### 完成 Gate

- 新 canonical source 已正式生效
- 舊 `.agent/**` 已只剩 shim / wrapper / compatibility 說明

### Stop / Rollback Condition

- 若 cutover 後 `/dev` 無法啟動、reviewer path 無法工作、或 bootstrap 失效，先暫停淘汰/收斂動作，只保留已驗證可工作的 shim。

---

## Phase 5 — Verification、Sign-off 與回到常規 Sync Lane

### 目標

驗證 cutover 已完成，並把後續升級模式正式收斂回常規 sync lane。

### 前置準備

1. 決定本次 cutover 完成後要追的 upstream remote / release lane。
2. 準備 downstream 自己的 targeted tests / smoke checks。

### 執行內容

1. 跑 manifest-backed precheck。
2. 跑 `sync_update` 或拆分 `stage -> apply -> verify`。
3. 跑 portable smoke。
4. 跑 downstream 自己的 tests / build / workflow smoke。
5. 確認新模型下的 `/dev`、Engineer、QA、Security Review 都能正常進行。

### 驗證方式

- `workflow_core_sync_precheck.py`：managed divergence 可控
- `workflow_core_sync_verify.py`：pass
- portable smoke：pass
- downstream 自己的 tests / build：pass 或明確記錄殘餘風險

### 完成 Gate

- cutover 後 repo 可正式回到常規 `precheck -> sync_update -> downstream tests` lane。
- 後續 upstream 更新不再需要重新做一次 root architecture cutover。

### Stop / Rollback Condition

- 若 verify 僅 portable smoke 通過，但 downstream tests 或 workflow smoke 失敗，不可宣告 cutover 完成。

---

## 檔案分類矩陣

## A. 直接保留（project-local overlay / state）

| 檔案或 surface | 理由 | 備註 |
|------|------|------|
| `project_rules.md` | 專案治理與業務 authority | 不由 upstream 覆蓋 |
| `doc/implementation_plan_index.md` | project-local state | 只做本專案任務排序 |
| `doc/plans/Idx-*_plan.md` | mutable project artifact | 保留 |
| `doc/logs/Idx-*_log.md` | mutable project artifact | 保留 |
| `tests/**` | downstream-owned validation surface | 升版後需重跑 |
| `project_maintainers/chat/handoff/*.md` dated files | local supporting artifacts | 保留 |
| `project_maintainers/chat/archive/*.md` dated files | local history | 保留 |
| `project_maintainers/improvement_candidates/20*.md` | local candidate queue | 保留 |
| `.workflow-core/**` | mutable/runtime companion root | cutover 後保留為正式 local surface |

## B. 搬移（move to new canonical/local destination）

| 目前 surface | 新落點 | 理由 |
|------|------|------|
| `.agent/skills_local/**` | `.workflow-core/skills_local/**` | custom skills 不應留在舊 `.agent` surface |
| `.agent/state/skills/INDEX.local.md` | `.workflow-core/state/skills/INDEX.local.md` | local catalog 應走 mutable state root |
| `.agent/state/**` 中 runtime-written content | `.workflow-core/state/**` | mutable state 與 core 分離 |
| `.agent/config/**` 中 project-local policy | `.workflow-core/config/**` | project-local config 不應被 core sync 覆蓋 |

## C. 保留 shim（compatibility only）

| 舊 path | shim 形式 | 備註 |
|------|------|------|
| `.agent/workflows/AGENT_ENTRY.md` | forwarding doc | 指向 `.github/workflow-core/AGENT_ENTRY.md` |
| `.agent/workflows/dev-team.md` | forwarding doc | 指向 `.github/workflow-core/workflows/dev.md` |
| `.agent/roles/**` | forwarding doc 或 tiny wrapper | 僅保留兼容導航 |
| `.agent/runtime/scripts/workflow_core_*.py` | tiny wrapper 或轉呼叫新路徑 | cutover 過渡期可保留 |
| `.agent/scripts/setup_*` | wrapper | 視是否仍需兼容舊操作習慣 |

## D. 淘汰 / 不再作為 live authority

| 檔案或 surface | 原因 | 處理方式 |
|------|------|------|
| `.agent/**` 作為正式 canonical workflow source | 與新 `.github/workflow-core/**` 重複 | cutover 後不得再獨立演化 |
| `maintainers/**` | upstream 維護歷史，不屬 downstream canonical surface | 不導入到 managed sync |
| upstream template `tests/**` | 非 downstream project test surface | 只參考，不納入本 repo managed import |
| `.devcontainer/**` upstream 版本 | 屬 project/environment local | 僅人工對帳，不直接覆蓋 |
| root `.github/**` 以外的舊 alias prompt surface | 容易與新版 `/dev` 衝突 | 視情況停用或刪除 |

---

## Supporting Phase Plans

- `doc/plans/Idx-029_phase-0_plan.md` - Cutover readiness、ownership matrix、upstream ref 與 batch inventory
- `doc/plans/Idx-029_phase-1_plan.md` - root `.github/**` bootstrap refresh 與 agent/prompt/instruction merge
- `doc/plans/Idx-029_phase-2_plan.md` - `core_ownership_manifest.yml`、`.github/workflow-core/**` 與 `.workflow-core/**` 導入
- `doc/plans/Idx-029_phase-3_plan.md` - project-local customization、skills、mutable state 與 overlay 分離
- `doc/plans/Idx-029_phase-4_plan.md` - `.agent/**` shim 化、`.vscode/**` / `.devcontainer/**` cutover
- `doc/plans/Idx-029_phase-5_plan.md` - precheck、sync verify、downstream smoke 與 sign-off

---

## Phase-by-Phase 批次執行順序

1. Phase 0：盤點與 ownership matrix
2. Phase 1：root `.github/**` bootstrap refresh
3. Phase 2：導入 `.github/workflow-core/**` 與 `.workflow-core/**`
4. Phase 3：搬移 custom skills / mutable state / project-local customization
5. Phase 4：`.agent/**` shim 化 + settings/devcontainer cutover
6. Phase 5：precheck / sync / verify / downstream tests / sign-off

> 硬規則：每個 phase 都必須先完成自己的驗證與 stop gate，才可進下一 phase；不得在同一輪同時做 bootstrap refresh、canonical core 導入、local customization 搬家與 shim 清理。

---

## 實作指引

### 1. 不要把 cutover 做成一個大 commit

- 建議每個 phase 各自獨立成一組 plan/log/commit 鏈。
- 這樣一旦 rollback，只會退回單一 surface，而不是全部打散重來。

### 2. 先保 project-local authority，再導入 upstream-managed core

- `project_rules.md`、`doc/architecture/**`、active plan/log 永遠先保留。
- generic core 導入後，若發現專案語意消失，視為 migration defect，不可硬吃 upstream generic wording。

### 3. 驗證不能只看 portable smoke

- portable smoke 只能驗證 core contract，不能取代 downstream 自己的 tests / build / workflow smoke。
- cutover 完成定義必須包含 downstream 驗證。

### 4. 第一輪建議先用固定 ref，而不是漂浮 `main`

- 先把架構切換穩定下來，再追 `main`。
- 若一定要追 `main`，也應把 `release_ref` 當 staging label，而不是當正式 release lineage。

---

## 注意事項

- 風險提示: 這次升版不是單純同步檔案，而是 workflow canonical source 轉換；若 phase 混做，後續會同時維護兩套 workflow。
- 資安考量: 不得為了保留舊 PTY path 而把 reviewer 或 execution context 混回同一段長上下文；Chat-primary / one-shot reviewer 的 fresh context boundary 必須保留。
- 相依性: 本計畫引用 upstream 現行 workflow-core delivery model，但不代表立即覆蓋 Ivyhouse-specific治理內容。
- 缺漏前提: 正式執行前仍需決定 upstream ref、local patch queue 策略、以及 root `.github/**` 與 Ivyhouse instruction 的 merge 方式。

---

## 相關資源

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/plans/Idx-027_plan.md`
- `doc/logs/Idx-027_log.md`
- `doc/plans/Idx-028_plan.md`
- `doc/plans/Idx-029_phase-0_plan.md`
- `doc/plans/Idx-029_phase-1_plan.md`
- `doc/plans/Idx-029_phase-2_plan.md`
- `doc/plans/Idx-029_phase-3_plan.md`
- `doc/plans/Idx-029_phase-4_plan.md`
- `doc/plans/Idx-029_phase-5_plan.md`
- `obsidian-vault/20-reviewed/lessons-learned/downstream-workflow-core-upgrade-customization-lessons.md`

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [workflow-core]
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