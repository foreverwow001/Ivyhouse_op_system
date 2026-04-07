# Workflow Navigation

- root `.github/**` 是 Copilot-facing navigation surface。
- `.github/workflow-core/**` 是 workflow docs / rules / roles 的 canonical source。

## 正式入口

- `/dev` 的正式入口是 `.github/prompts/dev.prompt.md`，由 `Ivy Coordinator` 啟動完整 coordinator-driven workflow。
- workflow contract 的唯一正式入口是 `.github/workflow-core/AGENT_ENTRY.md`。
- workflow 順序摘要使用 `.github/workflow-core/workflows/dev.md`。
- reviewer package 導覽使用 `.github/instructions/reviewer-packages.instructions.md`。

## 可直接使用的 Custom Agents

- `Ivy Coordinator`：`.github/agents/ivy-coordinator.agent.md`
- `Ivy Domain Expert`：`.github/agents/ivy-domain-expert.agent.md`
- `Ivy Planner`：`.github/agents/ivy-planner.agent.md`
- `Ivy Engineer`：`.github/agents/ivy-engineer.agent.md`
- `Ivy QA Reviewer`：`.github/agents/ivy-qa-reviewer.agent.md`
- `Ivy Security Reviewer`：`.github/agents/ivy-security-reviewer.agent.md`

## 目前不提供的 Root-Level 入口

- QA / Security Review 不提供 workspace-level slash prompt；請改走固定輸入包與 fresh one-shot reviewer session。
- repo 不提供額外的 engineer-only slash prompt；Engineer 直接實作請切換 `Ivy Engineer` custom agent。
- 即使 root 已提供 `Ivy Domain Expert` template，若 downstream 要讓它成為 `/dev` 內的正式 dispatch 節點，仍需把對應條件式 dispatch 規則接回 Coordinator / workflow docs。

## 維護規則

- legacy compatibility surface 不構成權威來源；若 root `.github` 與 `.github/workflow-core` 已有對應內容，維護時優先改 canonical root。
