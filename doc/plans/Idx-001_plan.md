# Plan: Idx-001

**Index**: Idx-001
**Created**: 2026-04-03
**Planner**: @GitHubCopilot
**Phase**: Phase 0
**Primary Module**: Governance / Architecture
**Work Type**: governance

---

## 目標

把 Phase 0 已實際採用的權威文件入口、優先順序與文件責任邊界正式回掛成 `Idx-001` artifact，避免後續任務只能引用聊天或 index 敘述，而無法追溯 `權威文件盤點` 的完成依據。

---

## SPEC

### Goal

補齊 Phase 0 權威文件盤點與責任界定的正式 artifact，明確記錄哪些文件已成為 repo-native authoritative source。

### Business Context

- Phase 0 後續任務大量引用 `project_rules.md`、`doc/architecture/README.md` 與各架構入口，但 `Idx-001` 本身尚無 plan/log。
- 若不補 artifact，後續任務雖實質建立在權威文件之上，卻缺少可審計的 work unit 鏈。
- 本輪屬治理回填，不新增新規格主題。

### Non-goals

- 不在本輪新增新的權威文件主題。
- 不在本輪重寫既有 architecture 內容。

### Acceptance Criteria

1. `Idx-001` 已建立 plan/log artifact。
2. 權威文件優先順序、主要入口與文件責任邊界已可追溯。
3. 後續 work unit 可引用 `Idx-001` 作為已完成基線。

### Edge Cases

- 若同一主題同時有 draft 與 authoritative 文件，需明確標記以 authoritative source 為準。
- 若權威入口存在但某些子文件仍缺正式標記，需在 log 中保留缺口說明，而不是假裝全數齊備。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/README.md`
- `doc/architecture/modules/README.md`
- `doc/architecture/data/README.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/decisions/README.md`
- `doc/architecture/project_overview.md`

### Missing Inputs

- 權威文件清單目前散落在 rules 與 README 入口，尚未有單獨的 `Idx-001` artifact 回掛。

research_required: true

### Assumptions

- VERIFIED - `project_rules.md` 已定義規則優先順序與 authoritative docs 概念。
- VERIFIED - `doc/architecture/README.md` 與各子 README 已實際扮演 repo-native 權威入口。
- RISK: unverified - 個別子文件的 authoritative source 標記仍有不完全一致之處，後續可再獨立治理。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Governance / Architecture
- Adjacent modules: N/A
- Out of scope modules: 應用程式 runtime、schema、migration

### File whitelist

- `doc/implementation_plan_index.md`
- `doc/plans/Idx-001_plan.md`
- `doc/logs/Idx-001_log.md`

### Done 定義

1. `Idx-001` artifact 已建立。
2. 權威文件盤點完成依據已可追溯。
3. index 狀態與 artifact 狀態一致。

### Rollback 策略

- Level: L1
- 前置條件: 若回填 artifact 與現況文件事實不一致，先回退 artifact 結論。
- 回滾動作: 回退 `Idx-001` plan/log 與 index 狀態說明，不變動既有權威文件內容。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-001-authoritative-doc-inventory-backfill
  goal: 回填權威文件盤點與責任界定的正式 artifact
  retry_budget: 2
  allowed_checks:
    - artifact-readback
    - touched-doc-diagnostics
  file_scope:
    - doc/implementation_plan_index.md
    - doc/plans/Idx-001_plan.md
    - doc/logs/Idx-001_log.md
  done_criteria:
    - Idx-001 artifact 已建立
    - 權威文件完成依據可追溯
    - no file changes outside file_scope
  escalation_conditions:
    - 權威文件之間存在未解衝突
    - retry budget exhausted
```

---

## 注意事項

- 本任務是治理回填，不等於新增一份平行規格。
- 若後續要做更細的 authoritative source tagging，應另立治理任務，而不是在本 work unit 擴張範圍。

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
session_id: idx-001-artifact-backfill
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
log_file_path: doc/logs/Idx-001_log.md
<!-- EXECUTION_BLOCK_END -->