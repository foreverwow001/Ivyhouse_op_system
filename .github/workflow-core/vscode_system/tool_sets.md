# 工具集

Ivy House 共通指令（所有 Agent 必須遵守）

---

## 1️⃣ 語言

所有回覆、Spec、Plan、Log、註解均使用**繁體中文**。

---

## 2️⃣ 確認機制

任何程式碼變更前，必須：
1. 複述需求
2. 等待用戶確認
3. user-facing Gate 預設使用 VS Code `#askQuestions`

一般聊天不可用來收集 formal gate 決策；在 VS Code / Copilot runtime 內，應先完成 Runtime Capability Gate，再使用當前 runtime 已註冊的 askQuestions surface。若確認不可用，必須 fail-closed，回報 workflow environment blocker。

---

## 3️⃣ 角色邊界

- **Coordinator** 不做實作
- 程式碼變更只允許透過：
  - Copilot Chat custom agent / agent mode
  - `copilot-cli-reviewer`（僅 reviewer，read-only）

---

## 4️⃣ git/diff 限制

所有 git/diff/行數計算只允許在：
- Project terminal
- VS Code SCM

**禁止**：
- 注入到 Codex/Copilot terminal
- 在 Codex CLI 中執行 git 指令

---

## 5️⃣ Workflow 觸發

使用者輸入 `/dev` 視為啟動。

`READ_BACK_REPORT` 確認後，先建立 fresh context boundary，再做 Mode Selection Gate：
- `formal-workflow`（預設）
- `lightweight-direct-edit`（僅限低風險、小範圍修正；一旦 scope 擴張必須升級回正式 workflow）

---

## 6️⃣ Completion Markers

以下 marker 未出現視為未完成：
- `[ENGINEER_DONE]`
- `[QA_DONE]`
- `[FIX_DONE]`

---

## 7️⃣ Cross-QA 規則

QA 工具不得等於 `last_change_tool`

**例外**：需明確記錄並由用戶確認。

---

## 8️⃣ Deterministic Gates

以下 Gate 必須按規範執行並寫入 Log：

### Research Gate
- 若 `research_required: true` 或依賴檔案變更
- 必須補 Sources（Link-required）或標 `RISK: unverified`

### Maintainability Gate
- 有 `.py` 變更且總行數 > 50 或命中 `core/**|utils/**|config.py`
- Log 必有 `MAINTAINABILITY REVIEW`（只給建議，不改 code）

### UI/UX Gate
- 命中 UI 路徑時
- Log 的 `SCOPE GATE` 記 `UI/UX triggered: YES/NO`
- YES 時 QA 必有 `UI/UX CHECK`

### Evidence Gate
- 只有在（變更行數 > 200）或（需要貼完整終端輸出且 > 80 行）才允許新增 evidence

---

## 9️⃣ Security

- 不得硬寫任何 key/token
- 敏感資料只能用 `.env`

---

## 已可用工具集

### 執行工具
- **codex-cli** - 程式碼生成與執行
- **copilot-cli** - Copilot CLI 型終端執行工具

### 互動工具
- **VS Code `#askQuestions` / `vscode_askQuestions`** - user-facing Gate 的預設互動工具；前者是 UI surface 名稱，後者是本 workspace 常見的 Copilot runtime 工具呼叫名稱。

### Runtime Capability Gate（VS Code adapter）
- 進入第一個 formal gate 前，先確認目前 runtime 已註冊 askQuestions-compatible tool。
- 在這個 workspace 的目前 host runtime 中，若工具直接出現在可呼叫列表，應直接以標準 function call 方式使用 `vscode_askQuestions`。
- 若未來某個 VS Code host runtime 採用延遲載入機制，應以該 host runtime 實際提供的載入方式為準；不得把單一載入方式回寫成 repo-wide live contract。
- **絕對禁止**用 `vscode_listCodeUsages` 或其他程式碼搜尋工具查詢 askQuestions 工具是否存在；它們無法反映 runtime 的真實工具能力。

### 終端工具
- **Project Terminal** - 執行 git/bash 指令
- **Codex CLI Terminal** - codex 指令執行
- **Copilot CLI Terminal** - copilot 指令執行

### 監控工具
- **Reviewer Output** - one-shot reviewer 回傳作為主要審查證據
- **Targeted Validation Evidence** - 執行結果與檢查輸出作為主要監測證據
- **Checkpoint-based Progress** - Plan / Log / result summary 作為流程完成判定

### 文件工具
- **Markdown Logger** - `.md` 格式日誌
- **Plan Generator** - `doc/plans/Idx-XXX_plan.md`
- **Log Generator** - `doc/logs/Idx-XXX_log.md`
- **Artifact Path Rule** - active workflow / 治理 / 專案功能任務統一使用 `doc/implementation_plan_index.md`、`doc/plans/Idx-XXX_plan.md`、`doc/logs/Idx-XXX_log.md`

---

## 使用限制速查表

| 工具 | 允許 | 禁止 |
|------|------|------|
| codex-cli | 程式碼變更 | git 操作 |
| copilot-cli | 程式碼變更 | git 操作 |
| Project Terminal | git / bash | 無 |
| Coordinator | Gate 判定、注入指令 | 直接執行程式碼 |

---

## 執行流程

1. **SPEC_MODE**：Coordinator 複述需求並等待確認
2. **READ_BACK_REPORT + Bootstrap + Mode Selection Gate**：先建立 fresh context boundary，再決定 `formal-workflow` 或 `lightweight-direct-edit`
3. **Plan 產出**：若為 formal workflow，要求 Planner 產出 `doc/plans/Idx-XXX_plan.md`
4. **Plan 確認**：以 batched `#askQuestions` 收集 Approve / Scope / Tool 決策；不得要求使用者在一般聊天重貼 gate prompt
5. **ORCH_MODE**：記錄 `executor_tool`、`security_reviewer_tool`（條件式）、`qa_tool` 並開始執行
6. **Reviewer / 驗證操作**：使用 reviewer CLI 與 targeted checks 作為審查與完成證據
7. **完成判定**：以 handoff package、reviewer output 與 Log 回填判定是否完成
8. **Log 回填**：產生 `doc/logs/Idx-XXX_log.md`
