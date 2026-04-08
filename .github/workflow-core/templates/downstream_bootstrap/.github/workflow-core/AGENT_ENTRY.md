# AGENT_ENTRY.md（VS Code 多代理工作流程唯一入口）

> 本檔案是此 repo 的「唯一入口文件」。
> 任何工作在開始 **產出 Plan** 前，必須先完成「必讀檔案逐檔閱讀」並回報「已讀驗收回報」。
> 未完成者：不得出 Plan、不得執行、不得 QA。

---

## 0) 一條不可妥協的鐵律
**在你完成「1) 必讀檔案」並輸出「2) 已讀驗收回報」之前，禁止產出任何 Plan。**

若任一必讀檔找不到：必須立刻停下並詢問使用者確認檔名/路徑與目前是「範本 repo 維護」還是「下游專案工作區」（不得自行猜測或跳過）。

---

## 1) 必讀檔案（必須逐檔「開啟並閱讀」，不可只提到檔名）
請依序「開啟並閱讀」以下檔案：

1. `./.github/workflow-core/workflows/dev.md`
2. **規則檔（依工作區型態擇一）**：
  - 若目前在維護 `agent-workflow-template` 本身 → 必讀 `./.github/workflow-core/workflow_baseline_rules.md`
  - 若目前在下游/新專案工作區內執行 workflow → 必讀 `./project_rules.md`
3. **Index 檔案**：`./doc/implementation_plan_index.md`

> 注意：
> - 「提到」不等於「已讀」；你必須實際打開檔案並萃取重點。
> - 缺任一檔案，或無法判定目前是 template repo 維護 / 下游專案工作區時，先停下詢問，不得自行跳過。

---

## 2) 已讀驗收回報（必須照格式輸出）
完成必讀檔逐檔閱讀後，請輸出以下 **完全一致** 的段落格式（不得省略欄位）：

### ===READ_BACK_REPORT===
- 本機時間（local）：
- 已開啟閱讀的檔案（含路徑）：
  - [ ] ./.github/workflow-core/workflows/dev.md
  - [ ] 規則檔：./.github/workflow-core/workflow_baseline_rules.md（template repo 維護）或 ./project_rules.md（下游/新專案）
  - [ ] ./doc/implementation_plan_index.md

- 從「規則/流程」萃取的前 5 項硬約束（請用條列）：
  1.
  2.
  3.
  4.
  5.

- 與 Index 對照（根據任務類型選擇對應 Index）：
  - 這次任務是否已存在於 Index？（YES / NO / UNCLEAR）
  - 若 YES：請寫出 Index 中的 Task ID / Task 名稱（照 Index 原文）
  - 若 NO：請寫「NEW TASK - 需先登記 Index 才能進入執行」

- 風險旗標（若有）：
  - None /（列出風險）

### ===END_READ_BACK_REPORT===

**輸出後必須停下，並先完成 Runtime Capability Gate。** 若目前 runtime 已提供相容於 VS Code `#askQuestions` 的 gate surface，才可用該 surface 等待使用者確認/回覆；正式 gate 決策不得改由一般聊天輸入收集。若目前 runtime 缺少 askQuestions-compatible gate surface，或本輪 formal workflow 所需的實作 / 派工能力，必須 fail-closed，明確標記為 workflow environment blocker，並停止進入下一階段。

**Bootstrap（新 /dev 任務）**：READ_BACK_REPORT 通過、且 Coordinator 準備進入本次 `/dev` 任務時，必須先建立全新的 context boundary：Engineer 必須在新的 Copilot Chat turn / custom agent mode 中執行，QA 與 Security Reviewer 必須使用新的 one-shot reviewer session，不得重用上一輪聊天或 reviewer session。

---

## 3) 工作流程合約（高層順序）

> **單一來源規則**：本節是 active workflow 中所有 Gate 規格、欄位回填契約與 Security Review 觸發規則的唯一來源。
> `.github/workflow-core/workflows/dev.md` 只負責工作流程順序摘要、階段交接與產物路徑；`.github/workflow-core/roles/coordinator.md` 只負責角色責任、terminal/backend 策略、監控、scope/cross-QA 決策與失敗處置。
> 兩者都不得另行定義不同題組、不同欄位或不同 trigger 規則。

在使用者確認 READ_BACK_REPORT 後，才可依序執行：

0) **Runtime Capability Gate（非 user-facing formal gate）**
- Coordinator 必須先確認目前 runtime 是否提供：
  - 相容於 VS Code `#askQuestions` 的 user-facing gate surface
  - 若本輪要進入 `formal-workflow`，足以完成派工或實作的受支援能力面
- 這個 capability check 必須以「目前 runtime 實際可用的工具面」為準，不得以文件存在、字串搜尋結果或程式碼符號查詢代替。
- host-specific 的工具別名、載入機制或 deferred-tool 規則屬於 adapter 文件責任，不屬於本 live authority contract。
- 若 capability check 失敗，Coordinator 必須在進入第一個 user-facing formal gate 前就 fail-closed，回報 unsupported runtime / workflow environment blocker。

1) **互動契約（askQuestions-first）**
- 所有面向使用者的 Gate 一律使用 VS Code `#askQuestions`。
- 在 Copilot / VS Code runtime 內，`#askQuestions` 常見會映射到 `vscode_askQuestions`；但實際工具別名與載入方式應以當前 host runtime 的 adapter 文件與已註冊工具面為準，不得把單一 host 的載入細節寫死成通用契約。
- 多個 gate 決策應盡量 batch 成單次或最少次數的 `#askQuestions` 流程，不得要求使用者在一般聊天重貼 prompt 或逐題補填。
- 一般聊天只允許用來說明 blocker、補充自由文字背景或回報 askQuestions 執行狀態；不得用來收集 formal gate 的 Approve / Scope / Tool / Review 決策。
- 若 `#askQuestions` surface 缺失、失效或無法承載必要選項，必須 fail-closed 並向使用者明確說明目前是 workflow environment blocker；不得改為一般聊天確認後繼續執行。
- askQuestions-first 節點至少包含：
  - READ_BACK_REPORT 是否通過
  - Mode Selection Gate
  - Plan `Approve / Reject / Revise`
  - `expert_required`
  - `security_review_required`
  - `scope_policy`
  - `executor_tool`
  - `security_reviewer_tool`
  - `qa_tool`
  - 逾時處置
  - rollback 確認
  - scope break 決策

2) **模式選擇 Gate**
- 預設模式為 `formal-workflow`
- 只有同時符合以下條件，Coordinator 才可提供 `lightweight-direct-edit`：
  - 單檔或極少數檔案的小修正
  - 不涉及 dependency、runtime、preflight 或長流程 terminal 執行
  - 不命中安全敏感路徑與 deterministic Security Review trigger
  - 不需要獨立 QA log、Cross-QA 或 one-shot reviewer evidence
- 若使用者選擇 `lightweight-direct-edit`，由 GitHub Copilot Chat 直接處理，不進 formal Plan / Engineer / QA / Log 鏈。
- 若後續 scope 擴張或命中上述禁制條件，必須立刻升級回 `formal-workflow`，並從 Plan Gate 重新開始。

3) **Plan**
- 輸出可審核、可落地的計畫（可含里程碑與驗收條件）
- 若任務屬於新專案啟動、workflow baseline 客製、或 authoritative docs 尚未補齊的業務系統專案，必須先完成 generic `Phase 0 precheck`，再進正式 implementation plan
- `Phase 0 precheck` 至少包含：藍圖拆解 / 需求分層、authoritative docs inventory、規則與角色客製缺口、`doc/architecture/` 等 repo-native 架構文件骨架是否已建立
- 若 `Phase 0 precheck` 尚未完成，這一輪 Plan 只能先產出「前置補齊工作」與缺口清單，不得假裝已具備正式可實作條件
- 此階段不得改 code、不得下執行命令

4) **Approve Gate（使用者審核）**
- 必須詢問使用者：`Approve / Reject / Revise`
- 必須一併確認並回填：`expert_required`、`scope_policy`，以及 user 是否額外要求 Security Review
- 若 deterministic trigger 已命中，`security_review_required` 最終值仍必須為 `true`
- 未明確 Approve：不得執行

5) **角色選擇 Gate**
必須詢問使用者選擇：
- **Engineer Tool（執行者）**：`copilot-chat-agent`
- **Security Reviewer Tool（條件式）**：
  - 若 `security_review_required=false` → `security_reviewer_tool = N/A`
  - 若 `security_review_required=true` → 必須詢問 `copilot-cli-reviewer`
  - 若 workflow 進行中才從 `false` 轉為 `true`，必須補做一次 askQuestions，不得沿用預設值
- **QA Tool（驗收者）**：`copilot-cli-reviewer`
  - **Cross-QA 硬規則**：`qa_tool ≠ last_change_tool`，且 QA 必須使用新的 one-shot reviewer session（例外需記錄在 `qa_compliance` 並由 user 明確允許）
- **Execution Backend Policy（執行後端策略）**：`chat-primary-with-one-shot-reviewers`
  - `chat-primary-with-one-shot-reviewers`（固定）：Engineer 在 Copilot Chat custom agent / agent mode 中執行，QA / Security Reviewer 以 one-shot reviewer session 執行
- **Monitor Backend Policy（監測後端策略）**：`checkpoint-first-reviewer-output`
  - `checkpoint-first-reviewer-output`（預設）：主證據使用 Plan/Log、targeted checks、one-shot reviewer output 與 git diff/result summary

> Gate 完成後，必須在 Plan 的 `EXECUTION_BLOCK` 回填：
> `scope_policy`、`expert_required`、`security_review_required`、`executor_tool`、`security_reviewer_tool`、`qa_tool`、`execution_backend_policy`、`executor_backend`、`monitor_backend`、`security_review_trigger_source`、`security_review_trigger_matches`。

6) **執行前 Gates（唯一規格來源）**
- **Research Gate**：若 Plan 的 `research_required: true` 或依賴檔案變更（`requirements.txt`、`pyproject.toml`、`*requirements*.txt`），必須先補齊 `RESEARCH & ASSUMPTIONS`；未完成不得進入 Engineer。
  - **Coordinator Research Skill Trigger Checklist（authoritative）**：見 [coordinator_research_skill_trigger_checklist.md](./references/coordinator_research_skill_trigger_checklist.md)
  - Coordinator 必須逐列檢查；任一列命中即載入對應 skill；若同時命中多列，必須全部載入
- **Obsidian Knowledge Intake Gate（downstream / 新專案工作區條件式）**：若目前在 downstream / 新專案工作區執行 workflow，且工作區已配置 Obsidian access surface，Coordinator 在注入 Engineer / Security Reviewer / QA 前必須先完成受控知識檢閱。
  - downstream 若採用 core-shipped restricted mount generator，推薦的 repo-local access surface 為 `obsidian-knowledge/00-indexes/` 與 `obsidian-knowledge/20-reviewed/`
  - 啟動順序固定為：先檢閱 `00-indexes/`，再依索引只讀取最小必要的 `20-reviewed/` 文件
  - 啟動階段允許讀取的 Obsidian surface 只有：`00-indexes/` 與經索引選出的 `20-reviewed/` 文件
  - 啟動階段禁止讀寫：`10-inbox/reviewed-sync-candidates/`、`30-archives/`、私人草稿區與其他未列入 allow-list 的 vault 路徑
  - `10-inbox/pending-review-notes/` 不屬於啟動前置閱讀；只有 user 明確要求處理 capture / triage，或 workflow 命中 `pending-review-notes` recorder 路徑且工作區政策允許時，才可後續 read / write
  - 若沒有 Obsidian mount、沒有可用索引，或索引中沒有命中本次任務的文件，Coordinator 應記錄為 `none` 後繼續，不得改成整包掃描 vault
  - Coordinator 必須在 `RESEARCH & ASSUMPTIONS` 或等價執行紀錄中留下：已檢閱的 index 路徑、實際採用的 reviewed 文件路徑，或 `none`
- **Plan Validator Gate**：必須先執行 `python .github/workflow-core/skills/plan-validator/scripts/plan_validator.py <plan_file_path>`；若回傳 `status: fail|error`，退回 Planner 修正。
- **Bounded Work Unit Gate（條件式，V1）**：若 Plan 要進入 bounded Engineer loop，Coordinator 在注入 Engineer 前必須確認 Plan 內存在且僅存在一個 machine-readable `work_unit`。
  - `work_unit` 是 Engineer 內圈 contract，不取代既有 `EXECUTION_BLOCK`
  - `work_unit.file_scope` 必須與 `File whitelist` 一致或為其子集合
  - `work_unit.done_criteria` 必須與 `Done 定義` 對齊
  - `work_unit.retry_budget` 必須與 `Max rounds` 對齊
  - `work_unit.allowed_checks` 必須是 allow-list token，不是自由文字或任意 shell command
  - `work_unit.allowed_checks` 的允許值一律依 `.github/workflow-core/skills/INDEX.md` 與 `.github/workflow-core/skills/_shared/__init__.py` 的 bounded work unit registry
  - V1 預設允許值：`plan-validator`、`targeted-unit-tests`、`touched-file-lint`
  - V1 不預設允許：`full-test-suite`、`integration-tests`、`migration`、`deploy-check`、arbitrary shell commands
  - `work_unit.retry_budget: 5` 的正式語意：首次實作後，最多再允許 5 輪「bounded fix -> re-run allowed checks」；budget 用盡後必須交回外層，不得自動延長
  - `work_unit.file_scope` 必須是相對路徑白名單；若偵測到白名單外修改，視為 `SCOPE BREAK`
  - `work_unit.done_criteria` 的正式語意是「Engineer 內圈結果已 ready for external review」，不是「整個任務已完成」
  - 若缺少 `work_unit`，或存在多個 `work_unit`，不得進入 bounded Engineer loop；必須退回 Planner 補齊，或明確改回非 bounded execute 路徑
- **Reviewer CLI Ready Gate**：
  - 預設 reviewer 路徑：`python .github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py --json`
  - 未達 `status=ready`：不得進入 QA / Security Reviewer 注入。
- **歷史檔案 Checkpoint**：檢核 dirty paths 是否命中 legacy archived plan/log surface；若僅為命名一致性調整，禁止改寫歷史 plan/log。

> Execute 前必跑 reviewer readiness check（Project terminal）：
> - 預設 reviewer 路徑：`python .github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py --json`
> - 未達 `status=ready`：不得進入 QA / Security Reviewer 注入。

> 注意：GitHub Copilot Chat 現在是正式 workflow 的預設執行表面；Engineer 應在 Copilot Chat custom agent / agent mode 中實作，QA / Security Reviewer 則使用 one-shot reviewer session，不得退化為同一個長上下文自審。

7) **Security Review Trigger（deterministic）**
- `security_review_required=true` 的判定順序如下，命中任一條件即觸發：
  1. **Explicit Request**：user 或 Coordinator 明確要求安全審查。
  2. **Path Rule**：Plan 的 file whitelist、檔案變更清單或實際修改檔案命中任一安全敏感路徑規則。
  3. **Keyword Rule**：Goal / SPEC / 檔案變更表 / 變更摘要 / 檔名命中任一安全關鍵字規則。
- **Path Rule（大小寫不敏感，命中任一路徑片段即可）**：
  - `/auth/`
  - `/security/`
  - `/middleware/`
  - `/permission/` 或 `/permissions/`
  - `/api/`、`/routes/`、`/controllers/`、`/handlers/`
  - `/bridge/`
  - `/subprocess/`
  - `/upload/`
  - `/templates/`
  - 檔名含 `token`、`secret`、`session`、`credential`、`oauth`、`jwt`
- **Keyword Rule（大小寫不敏感，建議以完整詞或片語匹配）**：
  - `auth`、`authentication`、`authorization`
  - `token`、`secret`、`session`、`cookie`、`jwt`、`oauth`、`api key`
  - `permission`、`role`、`rbac`、`acl`
  - `bridge`、`subprocess`、`shell`、`command injection`、`exec`
  - `upload`、`path traversal`
  - `template`、`render`、`deserialize`
  - `sql`、`query`、`raw query`
  - `endpoint`、`webhook`
- **回填規則**：
  - `security_review_trigger_source`: `none|user|coordinator|path-rule|keyword-rule|mixed`
  - `security_review_trigger_matches`: 寫入命中的路徑片段、檔名或關鍵字
  - 若 user 明確豁免已命中的 Security Review，必須在 `security_review_conclusion` 寫明豁免理由

8) **執行（只允許被選定的 Executor 動手）**
- 僅能依照已核准 Plan 執行
- 變更應最小化，避免無關改動
- 預設 execute 路徑為 Copilot Chat custom agent / agent mode；不得再把長互動 PTY prompt loop 當成正式主路徑
- 若 Plan 啟用 bounded Engineer loop，Coordinator 只可注入單一 approved `work_unit`；不得讓 Executor 自行擴張為 multi-unit queue
- bounded Engineer loop 的 `work_unit` 僅作為 Engineer 內圈 contract，不能取代外層 `EXECUTION_BLOCK`、Approve Gate、Security Review 或 QA
- 若 Plan 啟用 bounded Engineer loop，Coordinator 與 Executor 都必須遵守以下 enforcement contract：
  - 只可執行 `work_unit.allowed_checks` 中出現、且已在 registry 定義的 canonical checks
  - 不得把 `allowed_checks` 解讀為任意命令執行權
  - 只可修改 `work_unit.file_scope` 白名單內的檔案
  - 一旦出現白名單外改動、新 security trigger、或 failure signature drift，必須 fail-closed 跳回外層
  - 命中 `work_unit.done_criteria` 後，只代表可交給外層 Security Review / QA，不代表 Coordinator 可直接宣告 Close
- Coordinator 在注入 Engineer 任務時，**必須**對照 [engineer_skill_trigger_checklist.md](./references/engineer_skill_trigger_checklist.md) 逐列檢查，並附上所有命中的 skill 載入命令；若同時命中多列，必須全部附上，不得擇一省略。
- 若 Engineer 任務同時命中 pending-review triage 條件，且工作區允許寫入 `pending-review-notes`，Coordinator **必須**額外附上：
  - `cat .github/workflow-core/skills/pending-review-recorder/SKILL.md`
  - `cat .github/workflow-core/roles/engineer_pending_review_recorder.md`
  - `python .github/workflow-core/skills/pending-review-recorder/scripts/pending_review_recorder.py --notes-dir <pending-review-notes-dir> --payload-file <event.json>`
- 若事件未命中 triage 條件，或工作區不允許寫入 `pending-review-notes`，不得預設注入 recorder 路徑。

9) **Security Review（條件式）**
- 若 `security_review_required=true`，先進行 Security Review
- Security Review 的目標是找出可被利用的漏洞、攻擊路徑與修補建議
- 若 Security Review 結果為高風險 `FAIL`，不得直接進 QA
- 若 Security Review 結果為 `FAIL`，bounded Engineer loop 不得在內圈自動復跑；只能由 Coordinator 在外層決定是否重新派回
- Security Review 完成後，必須回填：`security_reviewer_tool`、`security_review_start`、`security_review_end`、`security_review_result`、`security_review_conclusion`
- 預設 Security Review 必須使用 fresh one-shot reviewer session，輸入包至少包含 plan 摘要、diff、targeted checks 與 security hints；review 結果輸出後立即結束，不做長時間互動式監測
- Coordinator 在注入 Security Reviewer 任務時，**必須**明確附上 helper 命令：`cat .github/workflow-core/skills/security-review-helper/SKILL.md` 與 `cat .github/workflow-core/skills/security-review-helper/references/security_checklist.md`；不得只寫「參考 security.md」。
- 若 Security Review 過程命中 pending-review triage 條件，且工作區允許寫入 `pending-review-notes`，Coordinator **必須**額外附上：
  - `cat .github/workflow-core/skills/pending-review-recorder/SKILL.md`
  - `cat .github/workflow-core/roles/security_pending_review_recorder.md`
  - `python .github/workflow-core/skills/pending-review-recorder/scripts/pending_review_recorder.py --notes-dir <pending-review-notes-dir> --payload-file <event.json>`
- 若 security evidence 涉及 exploit 細節、敏感 payload、token、secret，Coordinator 不得要求走自動 note writer，應改成人工控管處理。

10) **QA（必須對照 Plan 與硬約束）**
- QA 必須分級：PASS / PASS_WITH_RISK / FAIL
- 若非 PASS：必須指出風險與原因
- 若 QA 結果為 `FAIL`，bounded Engineer loop 不得在內圈自動復跑；只能由 Coordinator 在外層重新派回
- 預設 QA 必須使用 fresh one-shot reviewer session，輸入包至少包含 plan 摘要、diff、targeted checks 與已知風險；review 結果輸出後立即結束，不做常駐監測
- Coordinator 在注入 QA 任務時，**必須**依審查範圍明確附上至少一條 `code-reviewer` canonical script 命令（單檔 / 目錄 / diff / `git diff --staged|--cached|<base>..<head>`）；若專案有測試，也必須一併附上 `test-runner` 命令。
- 若 QA 過程命中 pending-review triage 條件，且工作區允許寫入 `pending-review-notes`，Coordinator **必須**額外附上：
  - `cat .github/workflow-core/skills/pending-review-recorder/SKILL.md`
  - `cat .github/workflow-core/roles/qa_pending_review_recorder.md`
  - `python .github/workflow-core/skills/pending-review-recorder/scripts/pending_review_recorder.py --notes-dir <pending-review-notes-dir> --payload-file <event.json>`
- 若 QA 事件只是單次且不可重現的失敗、操作失誤或無 evidence 懷疑，不得預設注入 recorder 路徑。

11) **重入政策（QA / Security FAIL 後，bounded loop V1）**
- QA FAIL / Security FAIL 不授權內圈自動復跑；只能由 Coordinator 在外層重新派回
- 若修正仍完全位於既有 `work_unit.file_scope` 內，且未新增 security trigger、未發生 failure signature drift、且 `retry_budget` 尚未用盡，Coordinator 可重新派回同一個 `work_unit`
- 同一個 `work_unit` 的 re-entry 必須沿用原 `work_unit_id` 與原 retry budget；`retry_count` 不得歸零，也不得私自補發額外 budget
- 若 QA FAIL / Security FAIL 導致需要白名單外檔案、需改寫 `done_criteria`、新增 security-sensitive path / keyword、或原 budget 已用盡，必須回到 Plan Gate；不得在原 work unit 上繼續
- 回到 Plan Gate 後，外層只能選擇：建立新的 approved `work_unit`、修訂原 Plan 後重審、或明確終止本輪 workflow

12) **Log（QA 後必寫）**
- QA 結束後必須產出 log
- log 若已 commit，需包含 commit hash
- 是否提交（含 log）由使用者決策；若有提交，Log 應與變更一起納入版本控管以利稽核追蹤

13) **Close**
- 總結完成內容、變更範圍、風險、後續事項

---

## 4) Scope Break（停止條件）
若執行中出現「Plan 未包含的新需求」：
- 立即停止
- 回報：`SCOPE BREAK`
- 詢問使用者決策：
  - 回到原 scope，或
  - 新增/更新 Index 並開新 plan

---

## 5) 並行任務（停止條件）
**一個任務 = 一份 plan = 一份 log = 一組（或一串）commit。**
不得把不同任務混寫在同一份 plan/log/commit 鏈。

---

## 6) 小修正例外（暫定政策，稍後用 git hooks / lint-staged 落地）
小修正可能允許「較簡化流程」，但需同時符合：
- 變更行數 ≤ 20 行
- 僅限 doc / README / 註解 / formatting
- 仍需使用者明確允許（例如使用者說「這次是小修正可簡化」）

> 之後會用 git hooks / lint-staged 在 commit 時做硬性卡控。

---

## 7) 相關參考資料

若你需要查看 workflow skill trigger 的補充說明，請使用下列 reference 文件：

- [README.md](./references/README.md)：`references/` 目錄導覽入口
- [coordinator_research_skill_trigger_checklist.md](./references/coordinator_research_skill_trigger_checklist.md)：Coordinator 的權威 checklist
- [engineer_skill_trigger_checklist.md](./references/engineer_skill_trigger_checklist.md)：Engineer 的權威 checklist
- [workflow_skill_trigger_design_principles.md](./references/workflow_skill_trigger_design_principles.md)：哪些角色該用 checklist、哪些不該用的設計原則
- [workflow_skill_trigger_index.md](./references/workflow_skill_trigger_index.md)：各角色 checklist 的導航索引（非權威來源）
