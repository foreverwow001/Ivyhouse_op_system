# 專案 Copilot 指引

## Bootstrap 狀態

- 本 repo 目前正在執行 `Idx-029` workflow-core 升版。
- `Idx-029` Phase 4 已完成 authority cutover。
- root `.github/**` 與 `.github/workflow-core/**` 現在是正式 workflow authority；`.agent/**` 僅保留 compatibility shim / forwarding surface。

## Authoritative Surfaces

- `/dev` 的正式 root 入口是 `.github/prompts/dev.prompt.md`。
- 正式 live workflow entry 是 `.github/workflow-core/AGENT_ENTRY.md`。
- 正式 live workflow sequence summary 是 `.github/workflow-core/workflows/dev.md`。
- canonical root 是 `.github/workflow-core/**`；mutable/runtime companion root 是 `.workflow-core/**`。
- root `.github/agents/**` 是正式 custom agent surface。
- `.github/instructions/**` 提供導航與專案 instruction overlay，但 workflow 合約仍以 `.github/workflow-core/**` 與 `project_rules.md` 為準。
- Ivyhouse 專案治理與 active rules source 仍以 `project_rules.md` 與 `.github/instructions/Ivyhouse_op_system_instructions.instructions.md` 為準。

## Workflow Mode

- 目前 live 執行路徑是 `chat-primary-with-one-shot-reviewers`。
- reviewer readiness、固定輸入包與 root navigation 以 `.github/workflow-core/**` 為準；舊 `.agent/**` 不再承擔正式 authority。

## Execution Discipline

- 先讀 task anchor、相鄰實作與最小必要規則，再開始改動。
- 第一次實質改動後，立刻跑最便宜的 targeted validation。
- 只修和目前 task 直接相關的問題；不要順手擴 scope。
- 若需要 reviewer，輸出固定 review package，而不是自由發揮的長段落摘要。

## Required Review Packages

### Engineer handoff package

- `Task Summary`
- `Changed Files`
- `Done Criteria`
- `Validation Evidence`
- `Residual Risks`

### QA review package

- `Task Summary`
- `Expected Behavior`
- `Changed Files or Diff`
- `Validation Evidence`
- `Open Risks / Known Gaps`

### Security review package

- `Task Summary`
- `Trust Boundary / Attack Surface`
- `Changed Files or Diff`
- `Validation Evidence`
- `Secrets / Permissions Notes`
- `Known Security Concerns`