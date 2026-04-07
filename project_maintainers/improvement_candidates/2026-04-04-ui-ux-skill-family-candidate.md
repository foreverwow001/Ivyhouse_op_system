# IMPROVEMENT-CANDIDATE

> Historical note (`Idx-029` Phase 4): 本候選文件內提到的 `.agent/skills_local/**` 與 `.agent/state/skills/INDEX.local.md` 為提案提出時的歷史路徑；現行 mutable authority 已改為 `.workflow-core/**`。

## Candidate summary

- 這個候選改進要解決什麼問題
  - 目前 repo 的 `/dev` workflow 已有 `UI/UX Gate`，但缺少可重用、可審查、可逐步落地的 UI/UX skill family。
  - `Idx-023` 已把前端 Portal、登入/會話、入口頁與日常作業 UI 列為 go-live blocker；若沒有 repo-native UI/UX skills，後續實作很容易退化成 generic admin UI，無法同時滿足品牌風格、流程導向與營運系統可用性。
- 目前為什麼懷疑它值得回 upstream
  - 這不是單一專案的美感偏好，而是 workflow 層普遍會遇到的缺口：有前端實作 skill，沒有 UI/UX 專責 skill family；有 Gate，沒有可執行內容。
  - 本專案已具備 `.agent/skills_local/` 與 external/local overlay catalog，可先 project-local 驗證，再決定是否 promotion。

## Source context

- 專案名稱：Ivyhouse OP System
- 任務 / issue / milestone：`Idx-023` 前端 Portal UI 前置分析
- 發現日期：2026-04-04
- 相關 handoff / plan / log：
  - `doc/plans/Idx-023_plan.md`
  - `doc/plans/Idx-024_plan.md`
  - `doc/plans/Idx-025_plan.md`
  - `project_maintainers/chat/handoff/2026-04-03_mvp-status-and-chat-reorg_handoff.md`

## Problem statement

- 問題具體長什麼樣子
  - 現有 builtin skills 偏工程與審查輔助，例如 `typescript-expert`、`code-reviewer`、`test-runner`、`git-stats-reporter`；並沒有負責品牌視覺、入口頁 UX、流程導向 landing page、2.5D icon 語言、前端互動狀態與內部營運系統可讀性平衡的 skill。
  - 現有 `UI/UX Gate` 只是一個觸發點，不是完整方法論。若不補 skill family，後續 QA 很難穩定判斷「是否符合品牌風格」、「是否保持流程清晰」、「是否兼顧資料密度與可讀性」。
- 原本造成什麼成本、錯誤或混亂
  - 前端畫面容易在三種錯誤方向間擺盪：
    - 太像 generic SaaS dashboard，失去品牌辨識度
    - 太像官網行銷頁，犧牲營運系統效率與資訊密度
    - 太依賴單次聊天指令，沒有可追溯的 skill contract

## What changed locally

- 在本專案做了什麼修正或調整
  - 盤點 5 個外部 UI/UX skill 候選後，重新以 Ivyhouse 的品牌需求、營運系統特性與 workflow 邊界做篩選。
  - 明確排除 `awesome-copilot/penpot-uiux-design` 作為第一波導入來源，因為它是 Penpot MCP 導向 skill，不適合目前 repo 的主流程。
  - 將其餘 4 個 repo 重新拆成：可直接吸收、可拆分吸收、僅參考資料三類。
- 哪些做法有效，哪些做法被排除
  - 有效：以 `vibeforge1111/vibeship-spawner-skills` 當 skill family 骨架；以 `sickn33/antigravity-awesome-skills` 補 React UI state；以 `anthropics/skills` 補品牌視覺 guardrail；以 `nextlevelbuilder/ui-ux-pro-max-skill` 補資料庫與 checklist。
  - 排除：直接整包導入 `nextlevelbuilder/ui-ux-pro-max-skill`；直接新增新 agent；直接把 Penpot skill 當成一般前端 skill。

## Evidence

- 已跑過的 command / tests / smoke
  - 已檢視下列 repo 的檔案樹與核心 skill 內容：
    - `nextlevelbuilder/ui-ux-pro-max-skill`
    - `sickn33/antigravity-awesome-skills`
    - `anthropics/skills`
    - `vibeforge1111/vibeship-spawner-skills`
  - 已對照本 repo 的 `.agent/workflows/*`、`.agent/roles/*`、`.agent/skills/INDEX.md` 與 `git-stats-reporter` UI/UX Gate 行為。
- 觀察到的 before / after 差異
  - before：只有 UI/UX Gate，沒有 skill family。
  - after：已能明確提出一套 repo-native UI/UX skill family 與 external source mapping。
- 哪些證據支持它可能不是 project-specific workaround
  - skill family 的缺口類型具有普遍性：品牌風格、入口頁 IA、設計系統、前端狀態模式、無障礙與密度平衡，並非僅屬 Ivyhouse 特例。

## Repo-native UI/UX skill family 建議

### 設計原則

- 先補 skills，不先補 agent。
- 先以 `.agent/skills_local/` 做 project-local overlay，驗證有效後再評估 promotion。
- skill family 要服務現有角色：Coordinator / Planner / Engineer / QA，而不是創造平行責任鏈。
- 每個 skill 都必須清楚標示 owns / does-not-own，避免和 Domain Expert、Planner、QA 邊界打架。

### Skill family 清單

| Skill 名稱 | 主要責任 | 不負責什麼 | 觸發條件 | 建議內容 |
|---|---|---|---|---|
| `brand-style-system` | 將官網品牌語言轉成系統可用的色彩、字體、圓角、陰影、背景、按鈕、卡片與文案語氣基線 | 不負責 user flow、資訊架構、資料表單驗證 | 任務涉及 login page、landing page、theme、token、視覺重做、brand alignment | 品牌色票、字體策略、卡片/按鈕/表單 token、do/don't、與官網相似但不照抄的轉譯規則 |
| `ops-entry-pages` | 設計登入頁、登入後首頁、模組入口頁與角色導覽頁 | 不負責複雜表單流程細節與後端狀態模型 | 任務涉及 portal skeleton、login、home、dashboard、workspace selector、module entry | login page 結構、landing hero 區、入口卡片模式、角色 quick entry、第一層導航與進入條件 |
| `ops-flow-landing` | 專管流程圖 landing page、流程節點、節點關聯、可視化導覽與任務分流 | 不負責最終 icon 繪製資產本身，不負責詳細 business state machine 定義 | 任務涉及流程圖首頁、主線流程導航、流程節點 icon、entry graph、process overview | 節點命名規則、流程分層、資訊顯示優先序、點擊行為、 hover/focus/disabled 狀態、角色與模組映射 |
| `react-ui-state-patterns` | 定義 loading、error、empty、success、disabled、submission、toast、skeleton 等互動狀態 | 不負責品牌色票、資訊架構、跨頁導覽邏輯 | 任務涉及 React/Next.js 畫面、資料載入、表單送出、列表、查詢、非同步操作 | loading decision tree、error hierarchy、empty state pattern、button state、form submission pattern、QA checklist |
| `iconography-2_5d` | 定義可愛且典雅的 2.5D icon 視覺規範，確保 login、landing、流程圖與入口卡片風格一致 | 不負責完整插畫場景與品牌攝影 | 任務涉及功能 icon、流程節點 icon、空狀態 icon、入口卡片 icon | 透視角度、光影、圓角、描邊、配色、材質感、避免過度卡通化與過度扁平化的邊界 |
| `accessibility-density-review` | 確保內部系統在有品牌風格的前提下仍具備可讀性、可掃描性、鍵盤可達性與適當資訊密度 | 不負責主品牌定調與角色權限模型 | 任務涉及資料表格、表單、卡片網格、流程頁、瀏覽器相容與 a11y 基線 | contrast、focus、touch target、字級、留白、密度階梯、資料分群、表單幫助文與錯誤訊息規則 |

## 建議觸發方式

- `brand-style-system`
  - trigger 關鍵字：`brand`、`theme`、`palette`、`typography`、`landing page style`、`login page style`
- `ops-entry-pages`
  - trigger 關鍵字：`login`、`portal home`、`landing page`、`dashboard entry`、`module cards`
- `ops-flow-landing`
  - trigger 關鍵字：`flow`、`process map`、`workflow landing`、`入口流程圖`
- `react-ui-state-patterns`
  - trigger 關鍵字：`loading`、`error state`、`empty state`、`form submit`、`skeleton`
- `iconography-2_5d`
  - trigger 關鍵字：`icon`、`2.5D`、`illustration`、`feature icon`、`process icon`
- `accessibility-density-review`
  - trigger 關鍵字：`a11y`、`contrast`、`dense UI`、`table readability`、`keyboard`、`browser compatibility`

## 外部 repo 吸收建議

### 1. `vibeforge1111/vibeship-spawner-skills`

- 適合拆分 / 吸收
  - `design/ui-design`
  - `design/ux-design`
  - `design/design-systems`
  - 同 repo 的 `icon-design`、`accessibility-design` 概念邊界
- 建議吸收方式
  - 吸收 skill family 的骨架：`skill` / `patterns` / `anti-patterns` / `validations` / `collaboration` 的分層思路。
  - 轉譯其 owns / does-not-own / triggers / handoff 模型，對齊本 repo 現有角色。
- 僅參考部分
  - 原生 YAML schema 與整套多 skill orchestration，不建議直接原樣搬入。

### 2. `sickn33/antigravity-awesome-skills`

- 適合拆分 / 吸收
  - `skills/react-ui-patterns/SKILL.md`
- 建議吸收方式
  - 幾乎可直接轉寫成 `react-ui-state-patterns`，保留 loading / error / empty / button / form submission / checklist 主體。
- 僅參考部分
  - 任何與其餘 community skills 的整合描述，可只保留概念，不需複製 catalog 依賴。

### 3. `anthropics/skills`

- 適合拆分 / 吸收
  - `skills/frontend-design/SKILL.md`
- 建議吸收方式
  - 抽取其「不要做成 generic AI frontend」的 guardrail，並改寫成 Ivyhouse 品牌視覺語言約束。
  - 用於 `brand-style-system` 與 `ops-entry-pages` 的視覺品質要求。
- 僅參考部分
  - 偏藝術化或行銷導向的極端審美表述，只保留原則，不直接照搬。

### 4. `nextlevelbuilder/ui-ux-pro-max-skill`

- 適合拆分 / 吸收
  - `styles.csv`
  - `colors.csv`
  - `typography.csv`
  - `ux-guidelines.csv`
  - `ui-reasoning.csv`
  - `ui-styling` 與 `ui-ux-pro-max` 的 checklist / workflow 概念
- 建議吸收方式
  - 作為 reference dataset 與 checklist 來源，而不是 skill package 直接安裝。
  - 可抽其「先產 design system，再做頁面」的方法論，轉寫到 `brand-style-system`。
- 僅參考部分
  - CLI、Python search 腳本、platform templates、installer 與整個外部 distribution 流程，不建議導入。

## Reusability assessment

- 這比較像：
  - reusable skill / doc improvement candidate
- 若認為可重用，請說明跨專案適用條件
  - 適用於以下條件的 downstream 專案：
    - 需要內部系統前端，但不想只靠 generic frontend skill
    - workflow 已有 Planner / Engineer / QA / Gate，但缺少 UI/UX 內容層
    - 需要品牌風格、登入入口、landing page、流程頁或 design system

## Agent 是否需要增加

- 目前建議：**不新增 agent**
- 原因
  - 現有角色已足夠承接：
    - Planner 可定義畫面 scope 與 deliverable
    - Engineer 可在 skill 輔助下實作
    - QA 已有 `UI/UX Gate`
    - Domain Expert 專注業務邊界，不應混成設計 agent
  - 真正缺的是 skill contract，不是新角色數量。
  - 若現在新增 `UI agent` 或 `UX agent`，高機率與 Planner、QA、Domain Expert 責任重疊，增加 handoff 成本。
- 什麼情況下才值得加 agent
  - `apps/web` 已正式建立且 UI 工作長期成為主線
  - 需要獨立的 IA / wireframe / UX review artifact，而不是附屬在 QA 後面
  - skill family 已穩定，仍發現現有角色無法吸收 UI/UX review 工作量
- 若未來真的要加
  - 只建議加一個 advisory 型 `UI/UX Reviewer`，不建議同時拆成 `UI agent` 與 `UX agent`

## Promotion target

- 若要 promotion，應更新哪裡：
  - external/local skill package：先落 `.agent/skills_local/`
  - local overlay catalog：更新 `.agent/state/skills/INDEX.local.md`
  - maintainer SOP：補如何選用 UI/UX skill family
  - workflow doc：只有在 project-local 驗證穩定後，才考慮把 trigger / gate 補到正式入口文件

## Risks and limits

- 這個做法目前還有哪些前提或限制
  - 目前仍是分析與候選設計，尚未經多輪實作驗證。
  - 2.5D icon 規範需要在實作前先補一版範例資產或 token 基線，否則容易語義漂移。
  - 若後續前端選定的 UI library 與 skill 假設不一致，需再收斂元件層規則。
- 哪些情境下可能不適用
  - 純 API / 後端任務
  - 完全沒有前端 UI 的專案
  - 完全不需要品牌風格與入口頁體驗的內部工具

## Promotion decision

- 建議：待更多驗證
- 下一步：
  - 先在本專案建立 1 份 Portal UI/UX 基線文件，作為 `Idx-023` 前端實作 authority。
  - 第一波只優先落地 3 個 skills：`brand-style-system`、`ops-entry-pages`、`react-ui-state-patterns`。
  - 等 login page 與 landing page 第一版完成後，再決定是否補 `ops-flow-landing`、`iconography-2_5d`、`accessibility-density-review`。