# Agent Workflow Template 基線規則

> 此檔僅用於維護 `agent-workflow-template` 這個 template repo 本身。
> 新專案落地時，目前生效的規則來源應改為 repo 根目錄的 `project_rules.md`；本檔不應取代下游專案規則。

---

## 1. 溝通與互動契約

- 所有回覆、Plan、Log、維護文檔與說明一律使用繁體中文。
- 進入實作前，必須先完成 `READ_BACK_REPORT`，並先通過 Runtime Capability Gate，再優先使用 VS Code `#askQuestions` 完成 user-facing Gate。host-specific 的 askQuestions 工具別名或載入細節屬於 adapter 文件，不得直接寫死成 template / live authority 的通用契約；**禁止使用 `vscode_listCodeUsages` 之類的程式碼分析工具驗證工具是否存在**。
- `READ_BACK_REPORT` 確認後，先決定 `formal-workflow` 或 `lightweight-direct-edit`；若 scope 擴張或命中風險條件，必須升級回正式 workflow。

## 2. 工作流程契約

- active artifact path 一律使用 `doc/implementation_plan_index.md`、`doc/plans/Idx-NNN_plan.md`、`doc/logs/Idx-NNN_log.md`。
- Gate、`EXECUTION_BLOCK` 欄位契約、Security Review trigger 的唯一來源是 `.github/workflow-core/AGENT_ENTRY.md`。
- workflow sequence 摘要以 `.github/workflow-core/workflows/dev.md` 為主；它只保留階段順序、交接點與產物路徑，不得再長出另一套 Gate 題組或欄位契約。
- `.github/workflow-core/roles/coordinator.md` 只保留角色責任、terminal/backend 策略、監控、scope/cross-QA 決策與失敗處置；不得重述 GOAL/PLAN/PICK_ENGINEER/PICK_QA/QA/LOG 的 stage-by-stage spec。
- GitHub Copilot Chat 現在是正式 workflow 的預設執行表面：Coordinator 留在 Copilot Chat orchestration flow，Engineer 以 Copilot Chat custom agent / agent mode 執行。
- QA / Security Reviewer 預設使用 `copilot-cli-reviewer` one-shot reviewer session；reviewer session 必須 fresh context、固定輸入包、read-only，且執行完即結束。
- workflow 主路徑固定使用 `chat-primary-with-one-shot-reviewers`；不再保留 PTY / fallback runtime 作為正式或備援能力。

## 3. Template Repo 維護限制

- 維護 template repo 時，不得把根目錄 `project_rules.md` 視為 active authoritative 規則檔；它保留為下游專案 starter template。
- legacy archived plan/log surface 僅視為歷史 artifact，不是 active workflow 的預設輸出路徑。
- 變更 workflow 契約時，需同步檢查 authoritative 與 supporting docs，避免多重真相來源。
- 禁止對 Codex CLI / Copilot CLI terminal 注入 git 指令；git 只可在 Project terminal 或 VS Code SCM 執行。

## 4. 安全與敏感資料

- 不得 hard-code API key、token、secret、password 或其他敏感憑證。
- 敏感資料必須透過環境變數或安全設定來源載入。
- 若任務命中 `auth`、`security`、`api`、`bridge`、`subprocess`、`upload`、`template`、`token`、`secret`、`session`、`oauth`、`jwt` 等高風險面，必須依 `AGENT_ENTRY.md` 的 deterministic 規則進入 Security Review。
