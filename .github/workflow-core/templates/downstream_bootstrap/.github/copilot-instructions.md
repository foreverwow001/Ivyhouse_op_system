# Project Copilot Instructions

## Authoritative Surfaces

- `/dev` 的正式入口是 `.github/prompts/dev.prompt.md`；repo 不再提供額外的 coordinator alias prompt。
- Engineer 直接實作由 `Ivy Engineer` custom agent 負責；repo 不提供額外的 engineer-only slash command 作為 downstream 正式入口。
- `.github/agents/ivy-coordinator.agent.md` 是 root `.github/**` 的 orchestration agent surface。
- `.github/workflow-core/**` 是 workflow docs / rules / roles 的 canonical source；legacy compatibility surface 不構成第二套權威來源。
- `.github/instructions/**` 只負責導航與 reviewer package 提示，不形成第二套 authoritative workflow 規格。

## Workflow Mode

- 預設執行路徑是 Chat-primary with one-shot reviewers。
- Engineer 在 Copilot Chat custom agent / agent mode 內實作。
- QA 與 Security Review 必須使用 fresh one-shot reviewer session，不得沿用 Engineer 的聊天上下文。

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
