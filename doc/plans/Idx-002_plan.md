# Plan: Idx-002

**Index**: Idx-002
**Created**: 2026-04-03
**Planner**: @GitHubCopilot
**Phase**: Phase 0
**Primary Module**: Architecture / Modules
**Work Type**: governance

---

## 目標

把已在 `project_overview.md` 與 `modules/README.md` 落地的模組化單體骨架、模組清單與依賴方向，正式回掛成 `Idx-002` artifact，讓後續的主資料、流程、RBAC 與技術基線都能追溯到同一組模組地圖完成依據。

---

## SPEC

### Goal

補齊 Phase 0 架構骨架與模組地圖第一版的正式 artifact。

### Business Context

- 後續 `Idx-003` 到 `Idx-008` 都假定模組切分與依賴方向已建立。
- 目前正式模組地圖與依賴規則已存在於 architecture 文件，但 `Idx-002` 尚無 plan/log。
- 若不回填 artifact，後續任務會缺少可審計的模組骨架完成證據。

### Non-goals

- 不在本輪擴張新的模組分拆。
- 不在本輪建立更細的程式碼目錄樹或 ADR 編號系統。

### Acceptance Criteria

1. `Idx-002` 已建立 plan/log artifact。
2. 正式模組清單、責任分工與依賴方向的完成依據已可追溯。
3. index 狀態與 artifact 狀態一致。

### Edge Cases

- 若專案總覽與模組 README 在表述層級上不同，需明確以 `modules/README.md` 的模組邊界規則為準。
- 若未來有新模組需求，應另立 ADR 或新 work unit，不回頭修改本 work unit 完成判定。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/project_overview.md`
- `doc/architecture/modules/README.md`
- `doc/architecture/README.md`

### Missing Inputs

- `Idx-002` 缺少正式 plan/log artifact。

research_required: true

### Assumptions

- VERIFIED - `project_overview.md` 已定義正式模組地圖。
- VERIFIED - `modules/README.md` 已定義正式模組責任、允許依賴方向與禁止耦合規則。
- RISK: unverified - 後續若需更細的依賴矩陣圖，應另立治理工作單，不影響本輪完成判定。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Architecture / Modules
- Adjacent modules: N/A
- Out of scope modules: 應用程式 runtime、schema、migration

### File whitelist

- `doc/implementation_plan_index.md`
- `doc/plans/Idx-002_plan.md`
- `doc/logs/Idx-002_log.md`

### Done 定義

1. `Idx-002` artifact 已建立。
2. 模組骨架完成依據已可追溯。
3. index 狀態與 artifact 狀態一致。

### Rollback 策略

- Level: L1
- 前置條件: 若 artifact 回填與現況模組文件不一致，先回退 artifact 結論。
- 回滾動作: 回退 `Idx-002` plan/log 與 index 狀態說明，不變動既有模組文件內容。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-002-module-map-backfill
  goal: 回填模組骨架與依賴方向第一版的正式 artifact
  retry_budget: 2
  allowed_checks:
    - artifact-readback
    - touched-doc-diagnostics
  file_scope:
    - doc/implementation_plan_index.md
    - doc/plans/Idx-002_plan.md
    - doc/logs/Idx-002_log.md
  done_criteria:
    - Idx-002 artifact 已建立
    - 模組骨架完成依據可追溯
    - no file changes outside file_scope
  escalation_conditions:
    - 模組邊界文件與總覽互相衝突
    - retry budget exhausted
```

---

## 注意事項

- 本任務是 artifact 回填，不是重新設計模組邊界。
- 後續若要補更細的依賴矩陣或 ADR，應另立工作單。

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: 2026-04-03 00:00:00
plan_approved: 2026-04-03 00:00:00
scope_policy: strict
expert_required: false
expert_conclusion: N/A
security_review_required: false
security_reviewer_tool: N/A
security_review_trigger_source: none
security_review_trigger_matches: []
security_review_start: N/A
security_review_end: N/A
security_review_result: N/A
security_review_conclusion: N/A
execution_backend_policy: pty-primary-with-consented-fallback
scope_exceptions: []

# Engineer 執行
executor_tool: copilot-cli
executor_backend: pty-primary
monitor_backend: manual_confirmation
executor_tool_version: GPT-5.4
executor_user: GitHub Copilot
executor_start: 2026-04-03 00:00:00
executor_end: 2026-04-03 00:00:00
session_id: idx-002-artifact-backfill
last_change_tool: copilot-cli

# QA 執行
qa_tool: Explore
qa_tool_version: N/A
qa_user: Explore
qa_start: 2026-04-03 00:00:00
qa_end: 2026-04-03 00:00:00
qa_result: PASS
qa_compliance: ✅ cross-QA completed; qa_tool != last_change_tool

# 收尾
log_file_path: doc/logs/Idx-002_log.md
<!-- EXECUTION_BLOCK_END -->