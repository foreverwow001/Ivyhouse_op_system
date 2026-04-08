# IMPROVEMENT-CANDIDATE

## Candidate summary

- 這個候選改進要解決什麼問題
  - `/dev` workflow 在 VS Code custom agent runtime 中，多次把 `#askQuestions` / `vscode_askQuestions` 問題誤判成 coordinator gate blocker，導致 formal workflow 在真正進入第一個 formal gate 前就 fail-closed。
  - 問題不是單一 prompt wording，而是 live authority、adapter 說明與 custom agent 工具白名單三者之間有缺口。
- 目前為什麼懷疑它值得回 upstream
  - 這個問題屬於 workflow runtime contract 與 custom agent tool restriction 的通用缺陷，不是 Ivyhouse 專案獨有的業務規則問題。
  - 若 downstream workspace 直接沿用舊的 `Ivy Coordinator` frontmatter 與 capability gate 定義，容易在任何需要 `#askQuestions` 的正式 workflow 中重現。

## Source context

- 專案名稱：Ivyhouse OP System
- 任務 / issue / milestone：`Idx-031` askQuestions-first hardening 延伸問題、`Idx-032` reviewer tooling 前置阻斷分析、`/dev` workflow runtime capability 誤判
- 發現日期：2026-04-08
- 相關 handoff / plan / log：
  - `doc/implementation_plan_index.md`
  - `doc/plans/Idx-032_plan.md`
  - `.github/workflow-core/AGENT_ENTRY.md`
  - `.github/prompts/dev.prompt.md`
  - `.github/agents/ivy-coordinator.agent.md`

## Problem statement

- 問題具體長什麼樣子
  - `/Dev` 啟動後，Coordinator 完成 `READ_BACK_REPORT`，但在 Runtime Capability Gate 就回報「目前 session 未暴露 `vscode_askQuestions`」與「沒有可 dispatch `Ivy Engineer` 的受支援 surface」，因此拒絕進入第一個 formal gate。
  - 同一個 session 其實可以直接呼叫 `vscode_askQuestions`，表示 blocker 結論與實際 runtime 能力不一致。
- 原本造成什麼成本、錯誤或混亂
  - 使用者已在支援 askQuestions 的環境中，workflow 卻仍被 fail-closed，造成 `/dev` 形式上符合 contract、實際上無法啟動。
  - 問題初期容易被誤認成 prompt wording、tool alias 名稱、或 host-specific deferred-tool loader 問題，導致修正反覆打轉。

## Root cause analysis

### Root cause 1：capability gate 只有負向規則，缺少正向判定

- live authority 先前明確寫了「什麼情況下可以 fail-closed」，但沒有寫清楚「哪些訊號足以判定 capability 已存在」。
- 結果是 Coordinator 只要主觀上「還不確定」，就可能在未實際呼叫 `vscode_askQuestions`、未實際嘗試 dispatch `Ivy Engineer` 前，提前宣告 blocker。

### Root cause 2：`Ivy Coordinator` custom agent 的工具白名單不完整

- `Ivy Coordinator` 的 `.agent.md` frontmatter 原本是：`tools: [read, search, execute, todo]`。
- 依 VS Code custom agent contract，`tools` 是實際可用工具白名單，不只是說明文字。
- 這代表 `/Dev` 真正切進 `Ivy Coordinator` custom agent 時，可能根本拿不到 `vscode_askQuestions`，也拿不到 `agent` alias，因此 formal gate 與 `Ivy Engineer` dispatch 都會失敗。

### Root cause 3：adapter 細節與 repo-wide live contract 曾經混在一起

- 某些分析曾把 host-specific 的 `tool_search` / deferred-tool 載入機制當成 repo-wide 通用規則。
- 這在某些 runtime 可能成立，但不應寫成所有 workspace 都必須遵守的 live authority。

## What changed locally

- 在本專案做了什麼修正或調整
  - 第一波：把 askQuestions-first 規則收斂為 fail-closed contract，禁止用一般聊天收集 formal gate 決策。
  - 第二波：把 `Runtime Capability Gate` 明確移到第一個 user-facing formal gate 前，避免再把問題誤歸類成 coordinator gate。
  - 第三波：補上 capability gate 的正向判定規則，並修正 `Ivy Coordinator` custom agent 的工具白名單。
- 哪些做法有效，哪些做法被排除
  - 有效：
    - 明寫 `vscode_askQuestions` 與 `agent` 為 `Ivy Coordinator` custom agent 的最小必要工具集合。
    - 明寫「若 runtime 工具清單已直接暴露 `vscode_askQuestions` 與 `agent`，即構成 capability gate 的正向證據」。
    - 明寫「有正向證據時，不得在未實際呼叫 gate tool / 未實際 dispatch 前就宣告 blocker」。
  - 被排除：
    - 用 `vscode_listCodeUsages`、`grep_search`、`semantic_search` 等程式碼工具去查 runtime tool 是否存在。
    - 把某個 host 的 deferred-tool loader 寫死成 repo-wide contract。

## Files changed locally

- root live authority
  - `.github/agents/ivy-coordinator.agent.md`
  - `.github/workflow-core/AGENT_ENTRY.md`
  - `.github/workflow-core/roles/coordinator.md`
  - `.github/workflow-core/vscode_system/tool_sets.md`
  - `.github/workflow-core/vscode_system/Ivy_Coordinator.md`
  - `.github/prompts/dev.prompt.md`
- downstream bootstrap sync
  - `.github/workflow-core/templates/downstream_bootstrap/.github/agents/ivy-coordinator.agent.md`
  - `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/AGENT_ENTRY.md`
  - `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/roles/coordinator.md`
  - `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/vscode_system/tool_sets.md`
  - `.github/workflow-core/templates/downstream_bootstrap/.github/prompts/dev.prompt.md`

## Evidence

- 已跑過的 command / tests / smoke
  - `vscode_askQuestions` 實呼 smoke 成功，證明當前 session 的 askQuestions surface 可正常互動。
  - `Ivy Coordinator` read-only smoke / validation 已確認新的 capability gate 規則不再允許「未呼叫就先判 blocker」。
  - root 與 downstream template 修改檔都通過 `get_errors` 檢查。
- 觀察到的 before / after 差異
  - before：Coordinator 可以在未實際呼叫 `vscode_askQuestions`、未實際 dispatch `Ivy Engineer` 前，用「看起來沒工具」直接 fail-closed。
  - after：若 custom agent 工具清單已直接包含 `vscode_askQuestions` 與 `agent`，則它們本身就是 capability gate 的正向證據；Coordinator 必須先實呼 formal gate / dispatch，再決定是否 blocker。
- 哪些證據支持它可能不是 project-specific workaround
  - 問題核心落在 VS Code custom agent 的 `tools` frontmatter 與 workflow contract 的介面定義，屬於任何使用 custom agent orchestration 的 workflow 都可能遇到的通用問題。

## Reusability assessment

- 這比較像：
  - reusable workflow improvement candidate
  - reusable doc / custom-agent contract improvement candidate
- 若認為可重用，請說明跨專案適用條件
  - 適用於以下條件：
    - 使用 VS Code custom agents 承接正式 workflow
    - formal gate 依賴 `#askQuestions` / `vscode_askQuestions`
    - 執行面依賴 subagent dispatch（例如 `agent` alias）
    - repo 內同時存在 live authority 文件與 `.agent.md` frontmatter 工具限制

## Promotion target

- 若要 promotion，應更新哪裡：
  - workflow doc
  - custom agent frontmatter / maintainer SOP
  - adapter doc
  - downstream bootstrap template
- 建議 promotion 內容
  - 在 workflow authority 中明確定義 capability gate 的正向證據，不只定義 fail-closed 條件。
  - 在 custom agent 設計 checklist 中加入：「若 agent 要承擔 formal gate 或 dispatch，frontmatter `tools` 必須顯式包含對應工具」。

## Risks and limits

- 這個做法目前還有哪些前提或限制
  - 仍然依賴 host runtime 真的支援 `vscode_askQuestions` 與 custom agent dispatch；若底層 runtime 沒提供，workflow 仍應 fail-closed。
  - 這份候選文件記錄的是 workflow orchestration 與 tool-surface contract，不保證所有 agent host 對 `tools` alias 的實作完全一致。
  - `Idx-032`、`Idx-024` 的正式執行與收口仍待後續在可完整跑 formal `/dev` 的 session 中完成。
- 哪些情境下可能不適用
  - 不使用 custom agent 的單一聊天 workflow
  - 完全不依賴 askQuestions-first formal gate 的簡單 direct-edit 任務

## Current maintainer guidance

- 若再次遇到 `/dev` 在 capability gate 就聲稱沒有 askQuestions surface，先檢查三件事：
  1. `Ivy Coordinator` custom agent frontmatter 是否真的包含 `vscode_askQuestions` 與 `agent`
  2. live authority 是否明確定義這兩者為正向證據
  3. agent 是否真的有先實際呼叫 `vscode_askQuestions`，而不是直接用敘述宣告 blocker
- 若第 1 點失敗，優先修 `.github/agents/ivy-coordinator.agent.md` 與 downstream template，而不是只修 prompt wording。
- 若第 2 點失敗，優先修 `AGENT_ENTRY` / `dev.prompt` / adapter doc，而不是再引入新的 host-specific workaround。

## Promotion decision

- 建議：待更多驗證後回 upstream
- 下一步：
  - 用修正後的 `Ivy Coordinator` 再跑一次完整 `/Dev`，確認正式 gate 真的會先實呼 `vscode_askQuestions`。
  - 若後續在其他 downstream workspace 也觀察到相同改善，再把這份 candidate 提升成 upstream custom-agent / workflow authoring checklist 的正式規則。