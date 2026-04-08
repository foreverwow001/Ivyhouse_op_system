# Plan: Idx-030 — `.agent` 刪除前置作業：legacy surface 退役、canonical 去耦與刪除前驗證

**Index**: Idx-030
**Created**: 2026-04-07
**Planner**: GitHub Copilot
**Phase**: Phase 1 → Workflow Upgrade Follow-up
**Primary Module**: Workflow Tooling / Governance
**Work Type**: migration
**Track**: workflow-core

---

## 🎯 目標

在 `Idx-029` 已完成 workflow-core cutover 的前提下，補齊真正刪除 `.agent/` 之前的所有前置作業。這一輪不直接刪除 `.agent/`，而是先讓 canonical/live surface 對 `.agent/` 完全去耦，撤銷 compatibility promise，並用 delete-readiness 驗證證明 repo 已可在無 `.agent/` 情境下運作。

---

## 📋 SPEC

### Goal

完成 `.agent/` 真正退場前的 canonical 去耦、legacy 退役準備與刪除前驗證。

### Business Context

- 本輪屬 workflow tooling / governance 主線，不涉及 Ivyhouse 業務模組或財務資料。
- 使用角色是 workflow maintainers 與 repo 維運者。
- `Idx-029` 已證明 `.agent/**` 不再是 live authority；現在要處理的是「如何安全撤銷 compatibility promise 並準備實際刪除」。

### Non-goals

- 不在本輪直接刪除 `.agent/` 目錄本身。
- 不重寫歷史 plan / log / architecture evidence，只保留必要的 historical note。

### Acceptance Criteria

1. canonical/live code 不再把 `.agent/` 視為 repo root、static root、runtime surface 或 template marker fallback。
2. root `.github/**` 不再把 `.agent/**` 描述為保留中的 compatibility shim，而是明示其已退役、待移除。
3. canonical runner / tooling 不再主動建立 `.agent/` 目錄。
4. 以不含 `.agent/` 的臨時副本跑完整驗證矩陣時，workflow 核心檢查與 downstream smoke 仍可通過。

### Edge Cases

- 若某些 live helper 仍接受 `.agent` 前綴的 metadata 或 path fallback -> 本輪需一併收斂，不能只改文件。
- 若歷史 plan/log 仍大量提到 `.agent/` -> 保留作為歷史證據，不因本輪而改寫既有執行事實。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `.github/instructions/Ivyhouse_op_system_instructions.instructions.md`
- `.github/instructions/workflow-navigation.instructions.md`
- `doc/logs/Idx-029_phase-5_log.md`
- `doc/architecture/agent_retirement_predelete_inventory.md`

### Missing Inputs

- N/A

research_required: true

### Sources

- `doc/logs/Idx-029_phase-5_log.md`
- `.github/prompts/dev.prompt.md`
- `.github/copilot-instructions.md`
- `.github/agents/**`
- `.github/workflow-core/**`
- `.agent/**`

### Assumptions

- VERIFIED - `Idx-029` 已完成 canonical authority cutover，`.agent/**` 不再是 live authority。
- VERIFIED - 目前仍存在 compatibility promise，因此直接刪除 `.agent/` 會構成 breaking cleanup。
- VERIFIED - `Idx-030` 的主目標是 delete-readiness，而不是同輪刪除實體目錄。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: workflow tooling / governance
- Adjacent modules: `.github/**`, `.github/workflow-core/**`, `.workflow-core/**`, `.agent/**`, `doc/**`
- Out of scope modules: `apps/api/**`, `apps/portal/**`, `project_maintainers/**` 的歷史 dated artifacts

### File whitelist

- `doc/implementation_plan_index.md` - 登記 `Idx-030`
- `doc/architecture/agent_retirement_predelete_inventory.md` - 前置作業盤點
- `doc/plans/Idx-030_plan.md` - 正式 plan
- `doc/logs/Idx-030_log.md` - 正式 log
- `.github/workflow-core/runtime/scripts/bounded_work_unit_orchestrator.py` - 移除 legacy repo root / static root fallback
- `.github/workflow-core/skills/_shared/__init__.py` - 移除 shared legacy root fallback
- `.github/workflow-core/skills/reviewed-sync-manager/scripts/reviewed_sync_manager.py` - 移除 `.agent` template marker fallback
- `.github/workflow-core/scripts/run_codex_template.sh` - 移除 `.agent` 目錄再生
- `.github/prompts/dev.prompt.md` - 收斂 compatibility promise
- `.github/copilot-instructions.md` - 收斂 compatibility promise
- `.github/instructions/workflow-navigation.instructions.md` - 收斂 navigation / retirement 說明
- `.github/instructions/Ivyhouse_op_system_instructions.instructions.md` - 收斂 project-local governance wording
- `.github/agents/ivy-coordinator.agent.md` - 收斂 legacy wording
- `.github/agents/ivy-engineer.agent.md` - 收斂 legacy wording
- `.github/agents/ivy-qa-reviewer.agent.md` - 收斂 legacy wording
- `.github/agents/ivy-security-reviewer.agent.md` - 收斂 legacy wording

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 影響 workflow governance wording 與 legacy retirement semantics
- 不改變 `/dev` 正式流程順序，只移除 `.agent` compatibility 承諾

#### RBAC IMPACT

- N/A

#### SHARED KEY / CROSS-MODULE IMPACT

- N/A

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- 需保留完整驗證證據，並補 delete-readiness log

### Done 定義

1. canonical/live surface 已不依賴 `.agent/` 路徑或 fallback
2. root `.github/**` 已不再承諾 `.agent/**` compatibility
3. 完整驗證與 no-`.agent` 臨時副本驗證通過，足以支持「現在可以刪 `.agent/`」的判定

### Rollback 策略

- Level: L4
- 前置條件: 若 canonical 去耦後任一 workflow core 驗證失敗，必須立即停止，不進行 delete-readiness 宣告
- 回滾動作: 回滾本輪 canonical/live surface 文字與 fallback 清理，維持 `Idx-029` 的 compatibility shim 狀態

### Max rounds

- 估計: 3
- 超過處理: 若超過 3 輪仍有隱藏 `.agent` 依賴，需拆出子 work unit 處理特定 tooling surface

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: agent-retirement-predelete-prep
  goal: 移除 canonical/live surface 對 `.agent` 的依賴並完成 delete-readiness 驗證
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - targeted-unit-tests
    - touched-file-lint
  file_scope:
    - doc/implementation_plan_index.md
    - doc/architecture/agent_retirement_predelete_inventory.md
    - doc/plans/Idx-030_plan.md
    - doc/logs/Idx-030_log.md
    - .github/workflow-core/runtime/scripts/bounded_work_unit_orchestrator.py
    - .github/workflow-core/skills/_shared/__init__.py
    - .github/workflow-core/skills/reviewed-sync-manager/scripts/reviewed_sync_manager.py
    - .github/workflow-core/scripts/run_codex_template.sh
    - .github/prompts/dev.prompt.md
    - .github/copilot-instructions.md
    - .github/instructions/workflow-navigation.instructions.md
    - .github/instructions/Ivyhouse_op_system_instructions.instructions.md
    - .github/agents/ivy-coordinator.agent.md
    - .github/agents/ivy-engineer.agent.md
    - .github/agents/ivy-qa-reviewer.agent.md
    - .github/agents/ivy-security-reviewer.agent.md
  done_criteria:
    - canonical/live surface no longer depends on `.agent`
    - no compatibility promise remains in active root docs
    - delete-readiness validation passes in a workspace copy without `.agent`
    - no file changes outside file_scope
    - engineer result is ready for external review
  escalation_conditions:
    - hidden runtime dependency on `.agent` discovered outside file_scope
    - workflow verification regresses after de-coupling
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/implementation_plan_index.md` | 修改 | 登記 `Idx-030` |
| `doc/architecture/agent_retirement_predelete_inventory.md` | 新增 | 前置作業盤點 |
| `doc/plans/Idx-030_plan.md` | 新增 | 正式 plan |
| `doc/logs/Idx-030_log.md` | 新增 | 正式 log |

---

## 實作指引

### 1. canonical code

- 先移除 repo root / static root / runtime marker 的 `.agent` fallback
- 不為了過渡保留雙分支；若 canonical root 不存在應直接 fail

### 2. governance wording

- root `.github/**` 改為「`.agent/**` 已退役、待移除」，不再宣稱 compatibility promise
- 保留歷史事實，但不可讓 active docs 還在提供舊入口保證

### 3. 驗證

- 先跑目前 workspace 的完整 workflow 驗證
- 再以臨時副本移除 `.agent/` 後重跑同一組關鍵驗證，作為 delete-readiness 證據

---

## 注意事項

- 風險提示: 若遺漏任一 hidden fallback，會在真正刪除 `.agent/` 後才暴露問題。
- 資安考量: 不涉及 secrets 或權限模型變更，但不能破壞 reviewer readiness 與 runtime path hardening。
- 相依性: 依賴 `Idx-029` 已完成 authority cutover。
- 缺漏前提: N/A

---

## 相關資源

- `doc/logs/Idx-029_phase-5_log.md`
- `doc/architecture/agent_retirement_predelete_inventory.md`

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [workflow-core]
plan_created: 2026-04-07 13:55:00
plan_approved: 2026-04-07 13:56:00
scope_policy: strict
executor_tool: copilot-cli
qa_tool: Ivy QA Reviewer
last_change_tool: GitHub Copilot
<!-- EXECUTION_BLOCK_END -->