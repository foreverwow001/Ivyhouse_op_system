# Workflow Navigation

- `Idx-029` Phase 4 authority cutover 已完成。
- root `.github/**` 與 `.github/workflow-core/**` 現在是本 repo 的正式 workflow navigation 與 canonical source。
- `.workflow-core/**` 是正式 mutable/runtime companion root。
- `.agent/**` 僅保留 compatibility shim / forwarding surface，不再是 live authority。

## 正式入口

- `/dev` 的正式 root 入口是 `.github/prompts/dev.prompt.md`，由 `Ivy Coordinator` 啟動 coordinator-driven workflow。
- 正式 live workflow contract 入口是 `.github/workflow-core/AGENT_ENTRY.md`。
- 正式 live workflow sequence summary 是 `.github/workflow-core/workflows/dev.md`。
- reviewer package 導覽使用 `.github/instructions/reviewer-packages.instructions.md`。
- Ivyhouse project-local instruction overlay 使用 `.github/instructions/Ivyhouse_op_system_instructions.instructions.md`；專案治理、語言與高風險規則以該檔與 `project_rules.md` 為準。

## 可直接使用的 Custom Agents

- `Ivy Coordinator`：`.github/agents/ivy-coordinator.agent.md`
- `Ivy Domain Expert`：`.github/agents/ivy-domain-expert.agent.md`
- `Ivy Planner`：`.github/agents/ivy-planner.agent.md`
- `Ivy Engineer`：`.github/agents/ivy-engineer.agent.md`
- `Ivy QA Reviewer`：`.github/agents/ivy-qa-reviewer.agent.md`
- `Ivy Security Reviewer`：`.github/agents/ivy-security-reviewer.agent.md`

## 目前不提供的 Root-Level 入口

- QA / Security Review 不提供 workspace-level slash prompt；請改走固定 review package。
- repo 不提供額外的 engineer-only slash prompt；Engineer 直接實作請切換 `Ivy Engineer` custom agent。
- `.agent/**` 不再提供正式 workflow 入口；若必須經 legacy path 啟動，應視為 compatibility shim，而非另一套 authority。

## 維護規則

- 若 root `.github` 與 `.github/workflow-core` 已有對應內容，維護時優先改新 canonical root。
- 需要更新 local skills/state/config 時，應改 `.workflow-core/**`，不得再回寫 `.agent/state/**`、`.agent/config/**` 或 `.agent/skills_local/**`。