---
description: 艾薇虛擬開發團隊工作流程 - 自動化規劃 → 諮詢 → 實作 → 審查
---
# 🤖 艾薇虛擬開發團隊工作流程

當使用者輸入 `/dev` 或請求「啟動開發團隊」時，請依照以下步驟執行。

> 📌 **Slash 指令說明**：
> - `/dev`：啟動本 repo 的 dev workflow（Ivy Coordinator 流程）
> - 如果你有個人的 Copilot prompt file 使用 `/dev`，建議改用其他個人自訂名稱以避免衝突

---

## 📋 前置準備

1. **確認需求**：先請使用者說明他們的開發需求是什麼。
2. **閱讀規則**：在開始任何工作前，先依 `.github/workflow-core/AGENT_ENTRY.md` 判定本次應讀 `./.github/workflow-core/workflow_baseline_rules.md`（template repo 維護）或 `./project_rules.md`（下游/新專案）作為核心規範。

> ⚠️ 在 `READ_BACK_REPORT` 確認之前，Coordinator 必須先完成入口讀檔；在 `READ_BACK_REPORT` 確認之後，必須先建立全新的 context boundary：Engineer 使用新的 Copilot Chat turn / custom agent mode，QA 與 Security Reviewer 使用新的 one-shot reviewer session。只有選定 `formal-workflow` 時，才進入本檔後續 Step 1 ~ Step 5。

---

## 🔄 工作流程（依序執行）

> **本檔定位**：本檔只保留工作流程順序、階段交接、產物路徑與角色責任摘要。
> Gate 題組、`EXECUTION_BLOCK` 欄位契約、deterministic trigger、pre-execution gate 與 rollback/scope break 的正式規格，一律以 `.github/workflow-core/AGENT_ENTRY.md` 第 3 節為準。

### Step 1️⃣ 艾薇規劃師 (Planner)
**角色定義**：參考 `.github/workflow-core/roles/planner.md`

**任務**：
1. 掃描專案目錄結構，理解現有檔案。
2. 閱讀相關程式碼（如 `app.py`, `.github/workflow-core/runtime/scripts/`）。
3. 若任務涉及多階段拆解、依賴、估時或風險盤點，先載入：
  ```bash
  cat .github/workflow-core/skills/project-planner/SKILL.md
  cat .github/workflow-core/skills/project-planner/references/planning-framework.md
  cat .github/workflow-core/skills/project-planner/references/task-sizing-and-dependencies.md
  cat .github/workflow-core/skills/project-planner/references/estimation-and-risk.md
  ```
4. 產出一份 Markdown 格式的 **開發規格書 (Spec)**，包含：
   - 目標描述
   - 需要修改/新增的檔案清單
   - 每個檔案的邏輯細節
   - 注意事項與風險提示
5. **保存 Spec 為獨立文件**：
  - 所有 active workflow / 治理 / 專案功能任務一律使用 `doc/plans/Idx-NNN_plan.md`
6. **Plan 固定段落（必須存在）**：
   - `## 📋 SPEC`
   - `## 🔍 RESEARCH & ASSUMPTIONS`（至少包含 `research_required: true/false`）
   - `## 🔒 SCOPE & CONSTRAINTS`（含 File whitelist / Done 定義 / Rollback / Max rounds）
  - 若本次要使用 bounded Engineer loop，必須在 `## 🔒 SCOPE & CONSTRAINTS` 內額外補上單一 `work_unit` contract

**產出格式**：參考模板 `doc/plans/Idx-000_plan.template.md`

```markdown
## 📄 開發規格書

### 目標
[描述]

### 檔案變更
| 檔案 | 動作 | 說明 |
|------|------|------|
| xxx.py | 修改 | ... |

### 邏輯細節
...

### 注意事項
...
```

> 🛑 **必要停頓點**：Spec 產出後，必須等待用戶確認才能進入 Step 2。

---

### Step 2️⃣ 領域專家 (Domain Expert)
**角色定義**：參考 `.github/workflow-core/roles/domain_expert.md`

**任務**：
1. 檢視 Planner 的 Spec。
2. 若任務涉及特定領域邏輯，提供專業建議與風險提示。
3. 確認業務規則、計算邏輯、合規邊界是否正確。
4. 若這次任務不涉及特定領域邏輯，可以明確回覆 `N/A` 並跳過。

**產出格式**：
```markdown
## 📊 領域專家審核

### 涉及的專業邏輯
- [列出相關邏輯、公式、規則]

### 專業建議
- [任何改進或注意事項]

### 結論
✅ 通過 / ⚠️ 需要修正 / N/A
```

---

### Step 2.5️⃣ 執行工具選擇（角色選擇 Gate）🚦

**執行者**: GitHub Copilot Chat（固定作為 Coordinator）

**觸發條件**: Plan 通過 User Approval Gate 且 Domain Expert Review 完成

**任務**: 由 Coordinator 依 `AGENT_ENTRY.md` 的 askQuestions-first 契約，收集 Gate 決策與正式工具選擇，並更新 Plan 的 `EXECUTION_BLOCK`。

> **單一來源規則**：Approve Gate、Role Selection Gate、Research Gate、Plan Validator Gate、Preflight Gate、Historical File Checkpoint、Security Review Trigger 與 `EXECUTION_BLOCK` 欄位契約，一律以 `.github/workflow-core/AGENT_ENTRY.md` 第 3 節為準；本檔只保留流程順序與角色責任摘要，不再重複定義另一套規格。

**本步最少要完成的事**：
1. 依 `AGENT_ENTRY.md` 問完唯一題組，並把 user 決策回填到 Plan 的 `EXECUTION_BLOCK`。
2. 依 `AGENT_ENTRY.md` 完成 `Research Gate`、`Plan Validator Gate`、`Bounded Work Unit Gate`（條件式）、`Obsidian Knowledge Intake Gate`（條件式）、`Preflight Gate` 與 `Historical File Checkpoint`。
3. 僅在所有前置 gate 通過後，才可把任務交給 Engineer。
4. workflow backend 固定為 Chat-primary + one-shot reviewers。

**Coordinator 實作提示**：
- Research skill trigger 判定與載入命令：直接對照 [coordinator_research_skill_trigger_checklist.md](./references/coordinator_research_skill_trigger_checklist.md)
- Engineer / reviewer handoff 與 reviewer readiness：依 `.github/workflow-core/roles/coordinator.md` 的執行/back-end 策略執行

---

### Step 3️⃣ 全端工程師 (Engineer)
**角色定義**：參考 `.github/workflow-core/roles/engineer.md`

**任務**：根據 Planner 的 Spec、Domain Expert 的建議與 Plan 的 `EXECUTION_BLOCK.executor_tool`，由選定的 Copilot Chat custom agent / agent mode 完成實作。

**執行方式**（由 Step 2.5 決定）：

#### 共同規則（Coordinator 必須落地）
- **Plan 執行方式**：由 Coordinator 在 Copilot Chat 中切換到對應 custom agent / agent mode，並以 bounded work unit / acceptance package 驅動實作
- **Bounded work unit contract（條件式）**：若 Plan 啟用 bounded Engineer loop，Coordinator 注入 Engineer 時必須明確附上單一 approved `work_unit`；其 `file_scope`、`done_criteria`、`retry_budget` 作為 Engineer 內圈 contract 使用，但不取代 Plan 的 `EXECUTION_BLOCK`
- **完成條件（預設）**：Engineer 以 Copilot Chat 回傳實作摘要與變更結果；QA / Security Reviewer 以單次 reviewer output 回傳結論。
- **監測方式（預設）**：Coordinator 以變更結果、targeted checks、one-shot reviewer output 與 Log 回填作為主證據，不做長時間常駐監測
- **監控備援**：若 one-shot reviewer CLI 不可用，先執行 reviewer readiness check；必要時改人工回報
- **Scope Gate**：偵測到變更後，Coordinator 必須先確認變更檔案未超出 Plan 的檔案清單（超出則停下來請用戶決策）

- **執行記錄**:
  - ✅ 每次執行追加到 `.workflow-core/state/execution_log.jsonl`
  - ✅ 失敗/超範圍時，先由 Coordinator 詢問用戶是否回滾/拆分（禁止自動執行破壞性操作）
- **產出格式**:
  ```markdown
  ## 🔧 實作報告 (Executor Tool)

  ### 已修改/新增的檔案
  [由 Codex 輸出]
  ```

**通用規範**（兩種模式都必須遵守）：
- 每個檔案開頭有中文用途註釋
- 單檔不超過 500 行
- 無 Hard-code API Key
- 遵循本次工作區對應的 active 規則檔（template repo 維護讀 `./.github/workflow-core/workflow_baseline_rules.md`；下游/新專案讀 `./project_rules.md`）

**實作前技能載入（條件式必做）**：
- 判定方式與載入命令：直接對照 [engineer_skill_trigger_checklist.md](./references/engineer_skill_trigger_checklist.md)
- 若同時符合多個條件，Engineer 必須全部載入。

**Skill Execution Gate（每次變更必執行，且需留證據）**：
- 對每個新建/修改的 `.py` 檔案或對應變更範圍，執行至少一條：
  ```bash
  python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <file_path>

  # 或以目錄 / diff / git diff 模式執行
  python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <directory_path>
  python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <diff_file> .
  python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py git diff --staged .
  python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py git diff --cached .
  python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py git diff <base>..<head> .
  ```
- 若專案有測試，執行：
  ```bash
  python .github/workflow-core/skills/test-runner/scripts/test_runner.py [test_path]
  ```
- **Coordinator 收集流程（預設 one-shot reviewer 路徑）**：
  - Copilot Chat 直接收斂 Engineer 的實作結果
  - QA / Security Reviewer 使用 one-shot reviewer session 輸出結果
  - 從 reviewer stdout / 摘要擷取結論與 issues
  - 將結果寫入 Log 的 `## 🛠️ SKILLS_EXECUTION_REPORT` 段落
- **Skills Evaluation（建議每回合一次，產生可追溯統計）**：
  - 若 Log 已包含 `SKILLS_EXECUTION_REPORT`，執行：
    ```bash
    python .github/workflow-core/skills/skills-evaluator/scripts/skills_evaluator.py <log_file_path>
    ```
  - 將輸出摘要/統計寫入 Log 的 `## 📈 SKILLS_EVALUATION` 段落
- 若 `code-reviewer` 回傳 `status: fail`（例如 API key 洩漏）→ 立即停止並回報 user

**產出格式** (若為模式 A)：
```markdown
## 🔧 實作報告 (Antigravity Direct)

### 已修改/新增的檔案
...完整程式碼...
```

---

### Step 3.5️⃣ 安全審查員 (Security Reviewer)
**角色定義**：參考 `.github/workflow-core/roles/security.md`

**觸發時機**:
- Engineer completion marker 被偵測後
- 且 `AGENT_ENTRY.md` 第 3 節定義的 deterministic trigger 命中（explicit request / path rule / keyword rule）
- 或 Plan 的 `EXECUTION_BLOCK.security_review_required=true`

**任務**：
1. 從防禦者視角審查變更與關聯模組的攻擊面。
2. 分析資料流、權限邊界、危險 sink 與 exploit path。
3. 對 findings 做二次驗證，降低 false positive。
4. 為 findings 標記 `Severity` 與 `Confidence`。
5. 只提出修補建議，不直接改 code。

**必做命令**：
```bash
cat .github/workflow-core/skills/security-review-helper/SKILL.md
cat .github/workflow-core/skills/security-review-helper/references/security_checklist.md
```

- Security Reviewer 不是選擇性參考 helper；開始審查前必須先讀完上述兩份文件。

**結果處理**：
| 結果 | 處理 |
|------|------|
| `PASS` | 進入 QA |
| `PASS_WITH_RISK` | 記錄風險後進入 QA |
| `FAIL` | 先回 Engineer 修正，不直接進 QA |

**Bounded re-entry 補充（條件式，V1）**：
- Security FAIL 不授權 bounded Engineer loop 在內圈自動復跑；只能由 Coordinator 在外層決定是否重新派回
- 若 Security findings 仍完全位於既有 `work_unit.file_scope` 內，且沒有新 security trigger、沒有 failure signature drift、且 budget 尚有餘量，Coordinator 才可重新派回同一個 `work_unit`
- 若 Security findings 需要白名單外檔案、改動 `done_criteria`、或原 budget 已用盡，必須回到 Plan Gate，不能沿用原 work unit

> `security_review_trigger_source`、`security_review_trigger_matches` 與是否可豁免，均以 `AGENT_ENTRY.md` 的單一規格來源為準。

---

### Step 4️⃣ 艾薇品管員 (QA)
**角色定義**：參考 `.github/workflow-core/roles/qa.md`

**觸發時機**:
- Engineer completion marker 被偵測後立即執行

**Cross-QA 工具檢測（在審查前執行）**：
1. 讀取 Plan 的 `EXECUTION_BLOCK.last_change_tool`
2. 用戶選擇 `qa_tool`（`codex-cli|copilot-cli`）
3. 若 `qa_tool == last_change_tool` → **拒絕執行 QA**，要求改選另一個工具（除非符合例外並記錄）

**記錄格式**:
- 違規: `qa_compliance: ⚠️ 違規（同工具）- 理由：[用戶說明]`
- 例外: `qa_compliance: ⚠️ 例外（小修正）- 變更：[X 行]`
- 豁免: `qa_compliance: ✅ 豁免（文件修正）- 檔案：[列表]`
**任務**：
1. 審查工程師的程式碼。
2. **確認 Cross-QA 規則**：QA 工具必須與 `last_change_tool` 不同
  - last_change_tool: codex-cli → QA: copilot-cli
  - last_change_tool: copilot-cli → QA: codex-cli
3. **必做命令**：先依審查範圍執行至少一條 `code-reviewer` 命令
  ```bash
  python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <file_path>

  # 或以目錄 / diff / git diff 模式執行
  python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <directory_path>
  python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <diff_file> .
  python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py git diff --staged .
  python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py git diff --cached .
  python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py git diff <base>..<head> .
  ```
