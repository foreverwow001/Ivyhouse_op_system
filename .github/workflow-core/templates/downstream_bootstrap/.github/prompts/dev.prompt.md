---
description: "為這個工作區啟動完整的 /dev coordinator workflow。"
name: "Dev"
agent: "Ivy Coordinator"
argument-hint: "描述任務目標、範圍限制、已知目標檔案、完成條件，以及任何 failing checks 或風險"
---
請在這個工作區使用完整的 coordinator-driven `/dev` workflow。

必要行為：

1. 將 `.github/workflow-core/AGENT_ENTRY.md` 視為 canonical workflow entry。
2. 將 `.github/workflow-core/workflows/dev.md` 視為 workflow sequence summary。
3. 維護 template repo 本身時，請以 `.github/workflow-core/workflow_baseline_rules.md` 作為 active baseline rules source。
4. 在 downstream workspace 運作時，請把 active rules source 切換為 `project_rules.md`。
5. 遵守 fresh context boundary：Engineer 在新的 Copilot Chat custom agent turn 執行；QA 與 Security Review 使用 fresh one-shot reviewer sessions。

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
