# 🚀 可攜式 Workflow 指南

> 本文件說明如何將此 Workflow 系統移植到其他專案。

> 這份文件現在也是唯一推薦的 downstream bootstrap 入口。GitHub `Use this template` 不再是推薦的下游建專案方式，因為它會複製整個 repository，而不是只交付 curated core surface。

---

## 📦 必須移植的檔案結構

```
new-project/
├── .github/
│   └── workflow-core/
│       ├── workflow_baseline_rules.md  📌 僅 template repo 維護使用；下游專案不作為 active rules source
│       ├── AGENT_ENTRY.md       ✅ 核心入口（通用）
│       ├── workflows/
│       │   └── dev.md           ✅ 團隊流程（通用）
│       ├── roles/
│       │   ├── planner.md       ✅ 規劃師（通用）
│       │   ├── engineer.md      ✅ 工程師（通用）
│       │   ├── engineer_pending_review_recorder.md  ✅ 工程 triage 記錄 overlay（通用）
│       │   ├── qa.md            ✅ 品管員（通用）
│       │   ├── qa_pending_review_recorder.md        ✅ QA triage 記錄 overlay（通用）
│       │   ├── domain_expert.md ⚙️ 領域專家（需客製）
│       │   ├── security.md      ✅ 安全審查員（通用）
│       │   └── security_pending_review_recorder.md  ✅ 安全 triage 記錄 overlay（通用）
│       ├── skills/
│       │   ├── INDEX.md             ✅ 技能索引（通用）
│       │   ├── code-reviewer/       ✅ 代碼審查 skill package（通用）
│       │   ├── doc-generator/       ✅ 文件生成 skill package（通用）
│       │   ├── test-runner/         ✅ 測試執行 skill package（通用）
│       │   ├── plan-validator/      ✅ Plan 驗證 skill package（通用）
│       │   ├── git-stats-reporter/  ✅ Git 統計 skill package（通用）
│       │   ├── skills-evaluator/    ✅ 技能統計 skill package（通用）
│       │   ├── github-explorer/     ✅ 外部技能搜尋/下載 package（通用）
│       │   ├── skill-converter/     ✅ 外部技能轉換 package（內部 toolchain）
│       │   ├── manifest-updater/    ✅ manifest 同步 package（通用）
│       │   ├── pending-review-recorder/ ✅ triage 記錄與 dedupe 規格（通用）
│       │   ├── _shared/             ✅ shared helper / path resolver
│       │   ├── explore-cli-tool/    ✅ CLI 探索（通用）
│       │   └── schemas/             ✅ output schema public path
│       ├── runtime/
│       ├── templates/
│       │   └── handoff_template.md  ✅ 交接模板（通用）
│       └── scripts/
├── .workflow-core/
│   ├── skills_local/            🔄 external/local skills install target
│   ├── state/skills/INDEX.local.md  🔄 local overlay skill catalog
│   └── active_sessions.json     🔄 執行時生成
├── project_maintainers/
│   ├── chat/
│   │   ├── README.md            ✅ downstream project handoff guidance
│   │   ├── handoff/
│   │   │   └── SESSION-HANDOFF.template.md  ✅ downstream session handoff 模板
│   │   └── archive/
│   │       └── README.md        ✅ downstream handoff archive guide
│   └── improvement_candidates/
│       ├── README.md            ✅ downstream candidate queue 說明
│       ├── IMPROVEMENT-CANDIDATE.template.md  ✅ candidate 模板
│       └── PROMOTION-GUIDE.md   ✅ promotion criteria 與 decision rules
├── doc/
│   ├── plans/
│   │   └── Idx-000_plan.template.md  ✅ Plan 模板
│   └── implementation_plan_index.md  🆕 需新建
└── project_rules.md             ⚙️ 下游專案 active 規則檔（取代 ivy_house_rules.md）
```

> template repo 自身維護時，`READ_BACK_REPORT` 應讀 `./.github/workflow-core/workflow_baseline_rules.md`；移植到新專案後，active rule source 改為根目錄 `project_rules.md`。

---

## 🔧 移植步驟

這套流程對應的是目前已定下的 core + overlay 模型：

1. 第一次把 curated workflow core materialize 到下游 repo
2. 讓下游專案自己的規則、plans、logs 與 domain overlay 留在 managed paths 之外
3. 後續更新改走 `workflow-core release/*` 與 `workflow-core sync/*`，而不是再次整包複製 template repo

技能系統的 split contract 也已定型：builtin core catalog 保留在 `.github/workflow-core/skills/INDEX.md`，external/local skills 安裝到 `.workflow-core/skills_local/`，overlay catalog 則寫到 `.workflow-core/state/skills/INDEX.local.md`。

另外，curated core 現在也會帶出 `project_maintainers/chat/` 與 `project_maintainers/improvement_candidates/` skeleton，讓新專案一開始就具備自己的 handoff / archive / candidate 落點。這組 skeleton 是 downstream project-local supporting surface，不是 authoritative workflow 規則來源。

補充：template repo 自身的 maintainer-local Dev Container 目前可把完整 Obsidian vault 掛到 `/obsidian/vault`，並在 repo root 自動暴露 `obsidian-vault -> /obsidian/vault` 這個 single-root Explorer 入口。這只是 template repo 的工作便利層，不是 multi-root workspace，也不是 downstream repo 的預設 contract。

### Step 0：先確認最小依賴

下游 repo 最小建議依賴如下：

- `git`
- `python` 或 `python3`，且必須支援 `venv`
- `node`
- `npm`
- `codex`
- `copilot`
- `bwrap`（Linux / Dev Container 環境建議安裝）

若你是用目前這份 curated core 啟動新 repo，建議先跑：

```bash
bash .github/workflow-core/runtime/scripts/install_workflow_prereqs.sh
```

這支腳本會先檢查上述依賴；若環境具備 `apt-get` 與可用的 root / passwordless `sudo`，或具備可寫的 global npm prefix，則會自動安裝缺少的項目。

若你只想檢查、不想安裝：

```bash
bash .github/workflow-core/runtime/scripts/install_workflow_prereqs.sh --check-only
```

> 單一來源規則：bootstrap materialization 的實際行為以 `.github/workflow-core/scripts/setup_workflow.sh` 為準；本文件不再內嵌腳本副本，避免文檔與實作漂移。

### Step 1：執行 canonical bootstrap script

```bash
SOURCE="/workspaces/agent-workflow-template"
TARGET="/path/to/new-project"

bash "$SOURCE/.github/workflow-core/scripts/setup_workflow.sh" "$TARGET" "我的新專案"
```

這支 script 目前是推薦的唯一 bootstrap 入口，會直接 materialize：

- `.github/workflow-core/AGENT_ENTRY.md`、`.github/workflow-core/workflows/`、`.github/workflow-core/roles/`、`.github/workflow-core/skills/`、`.github/workflow-core/runtime/`、`.github/workflow-core/templates/`
- `doc/plans/Idx-000_plan.template.md` 與 `doc/logs/Idx-000_log.template.md` 的 repo 內真實模板
- `project_maintainers/` skeleton
- `doc/implementation_plan_index.md` placeholder
- `project_rules.md` starter
- `.vscode/settings.json` 與 `.vscode/extensions.json` 的 downstream workspace template
- `.devcontainer/devcontainer.json` 的 downstream container template

bootstrap 後，下游 repo 在第一次 `Reopen in Container` / `Rebuild Container` 時，會由 `.devcontainer/devcontainer.json` 的 `postCreateCommand` 自動執行：

- `.github/workflow-core/runtime/scripts/install_workflow_prereqs.sh`
- `.github/workflow-core/runtime/scripts/vscode/install_terminal_tooling.sh`

這代表下游新專案不需要再手動補 `.vscode/`、`.devcontainer/`、PTY auto-start 設定或本地 PTY/fallback extension symlink；第一次 container 啟動完成後，`Reload Window` 即可依 workspace settings 自動拉起 Codex PTY / Copilot PTY。

若你要的是 template repo 那種 single-root Explorer 使用感，但又不想把 full vault mount 進 downstream repo，bootstrap 後可直接在新專案執行：

```bash
bash .github/workflow-core/scripts/setup_obsidian_surface.sh --vault-root /path/to/ObsidianVault
```

這支腳本會在 repo root 建立 `obsidian-vault/` 入口，但只暴露 restricted surface：

- `00-indexes/`
- `20-reviewed/`
- `10-inbox/pending-review-notes/`

預設模式是 `symlink`；若你要改成把最小子集同步進 repo-local surface，而不是直接連到外部路徑，可改用：

```bash
bash .github/workflow-core/scripts/setup_obsidian_surface.sh --vault-root /path/to/ObsidianVault --mode copy
```

### Step 2：確認專案規則檔

bootstrap script 會建立 `project_rules.md`（取代 `ivy_house_rules.md`）。第一次使用後，請至少補齊以下區塊：

```markdown
# [專案名稱] - 系統開發核心守則

## 1. 核心溝通規範
- 語言：繁體中文 / English
- 確認機制：執行前必須複述需求

## 2. 架構策略
- [依專案調整]

## 3. 開發流程
- Git Flow: [依專案調整]

## 4. 技術規範
- 檔案長度：主程式 ≤ 600 行
- [其他規範]

## 5. 資安紅線
- 絕對禁止 Hard-code API Key
```

### Step 3：更新 AGENT_ENTRY.md 必讀清單

`setup_workflow.sh` 會自動把 `.github/workflow-core/AGENT_ENTRY.md` 中的 template/downstream rule/index 路徑改成下游版本；你只需要確認下游專案的 active rule source 確實是 `project_rules.md`，而不是 template repo 的 baseline rules。

```markdown
## 1) 必讀檔案
1. `./.github/workflow-core/workflows/dev.md`
2. `./project_rules.md`              ← 下游專案的 active 規則檔
3. `./doc/implementation_plan_index.md`
```

### Step 4：客製化領域專家角色

編輯 `domain_expert.md` 成為專案適用的領域專家：

| 專案類型 | 領域專家角色 |
|---------|-------------|
| Meta 廣告分析 | Domain Expert（數據計算） |
| 電商系統 | E-commerce Expert (訂單/庫存) |
| 金融系統 | Finance Expert (合規/計算) |
| API 開發 | API Expert (設計/安全) |

若 downstream 需要新增 project-local role、可直接 dispatch 的 custom agent，或把新 agent 正式接入 workflow，請另外閱讀：

- `./ROLE_AGENT_EXTENSION_RULES.md`

### Step 5：保留安全審查員角色

`security.md` 應作為通用角色一起移植，用於條件式安全審查，不需要依專案類型重寫結構，只需補充專案特有的高風險面。

### Step 6：檢查 bootstrap 產物

確認以下路徑都已由 script 建好：

- `.github/workflow-core/runtime/`
- `doc/plans/Idx-000_plan.template.md`
- `doc/logs/Idx-000_log.template.md`
- `.vscode/settings.json`
- `.vscode/extensions.json`
- `.devcontainer/devcontainer.json`
- `project_maintainers/chat/handoff/SESSION-HANDOFF.template.md`
- `project_maintainers/improvement_candidates/IMPROVEMENT-CANDIDATE.template.md`
- `doc/implementation_plan_index.md`

## 📋 移植檢查清單

- [ ] 執行 `.github/workflow-core/scripts/setup_workflow.sh`
- [ ] 建立 `project_rules.md`（專案規則）
- [ ] 確認 `AGENT_ENTRY.md` 在下游專案讀 `project_rules.md`
- [ ] 確認 `.github/workflow-core/runtime/` 已 materialize
- [ ] 確認 `project_maintainers/` skeleton 已 materialize
- [ ] 客製化領域專家角色
- [ ] 建立 `doc/implementation_plan_index.md`
- [ ] 測試：執行 `/dev` 確認流程正常

---

## 🎯 為什麼不再推薦 GitHub Template

1. GitHub `Use this template` 會直接複製整個 repository
2. 它無法遵守 `core_ownership_manifest.yml` 中已定下的 curated export boundary
3. 它會把 maintainer-only、template-only、mutable/generated surface 一起帶進下游 repo
4. 它也無法提供後續 upstream core sync 的固定 contract

因此，GitHub template 最多只適合作為歷史或過渡方案，不再是正式推薦的 downstream 建專案方式。

---

## ⚠️ 注意事項

1. **規則檔分工**：template repo 維護讀 `.github/workflow-core/workflow_baseline_rules.md`；下游專案讀 `project_rules.md`
2. **領域專家**：`domain_expert.md` 需依專案客製
3. **安全審查**：`security.md` 作為通用角色一併保留
3. **技能擴充**：新專案可能需要新增專用技能
4. **Index 獨立**：每個專案有自己的 `implementation_plan_index.md`
