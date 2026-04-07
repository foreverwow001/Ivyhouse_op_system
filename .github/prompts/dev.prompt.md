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
5. 正式執行模型為 `chat-primary-with-one-shot-reviewers`；legacy `.agent/**` 只作 compatibility shim，不可視為另一套 authority。

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