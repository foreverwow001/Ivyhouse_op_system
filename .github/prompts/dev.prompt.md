---
description: "為這個工作區啟動正式 root /dev workflow，使用 `.github/workflow-core/**` 作為 live authority。"
name: "Dev"
agent: "Ivy Coordinator"
argument-hint: "描述任務目標、範圍限制、已知目標檔案、完成條件，以及任何 failing checks 或風險"
---
請在這個工作區使用完整的 coordinator-driven `/dev` workflow。

必要行為：

1. 將 `.github/workflow-core/AGENT_ENTRY.md` 視為目前 live workflow entry。
2. 將 `.github/workflow-core/workflows/dev.md` 視為目前 live workflow sequence summary。
3. 將 root `.github/**` 與 `.github/workflow-core/**` 視為正式 workflow authority。
4. 在 downstream workspace 運作時，active rules source 仍是 `project_rules.md`。
5. 正式執行模型為 `chat-primary-with-one-shot-reviewers`；legacy `.agent/**` 已退役並待移除，不可視為另一套 authority 或受支援入口。
6. 所有 user-facing formal gate 一律以 VS Code `#askQuestions` 收集；進入第一個 formal gate 前，必須先完成 Runtime Capability Gate，確認目前 runtime 已提供相容的 askQuestions surface。
7. 只有在 Runtime Capability Gate 或實際 gate 呼叫後，仍確認 `#askQuestions` surface 缺失、失效或無法承載必要選項時，才可視為 workflow environment blocker；不得改用一般聊天要求使用者重貼 prompt 或逐題補填 formal gate 決策。
- 8. 若 `Ivy Coordinator` custom agent 的工具清單已直接包含 `vscode_askQuestions` 與 `agent`，Coordinator 必須把它們視為 capability gate 的正向證據，不得在未實際呼叫 / 未實際 dispatch 前先判定 formal `/dev` 不可用。

請使用以下輸入包格式：

```markdown
## 目標

## 詳細需求

## 預期白名單檔案

## 驗收條件

## 已知 failing checks 或風險
```

請回傳：

```markdown
## READ_BACK_REPORT

## Coordinator Summary

## Proposed Gates

## Next Required Confirmation
```