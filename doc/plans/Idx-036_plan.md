# Plan: Idx-036 — 任務 Track 欄位治理補強：系統任務與 workflow 任務分流

**Index**: Idx-036
**Created**: 2026-04-08
**Planner**: GitHub Copilot
**Phase**: Phase 1 → Governance
**Primary Module**: Implementation governance
**Work Type**: docs-only governance / specification
**Operating Mode**: cross-mode-governance
**Track**: workflow-core

---

## 目標

以 docs-only governance 方式補齊 implementation task 的 `Track` 欄位治理，正式把 `product-system` 與 `workflow-core` 分流落到 implementation index、plan template、既有主 plan 與 root README，避免把任務工作焦點誤讀成 `Operating Mode`。

---

## SPEC

### Goal

建立一套最小但一致的 `Track` 留痕規則，讓後續所有主 plan 都能同時保有 `Operating Mode` 與 `Track`，且兩者語意不混淆。

### Business Context

- `Idx-033` 已把 `Operating Mode` 掛進 plan template，但它描述的是正式營運層級，不是任務工作焦點。
- 目前 implementation index 與舊主 plan 尚未有一致的 `Track` 欄位，後續很難快速辨識哪些任務屬產品 / 營運系統面，哪些屬 workflow-core surface。
- 本 task 雖會修改 product-system artifacts，但實際收斂對象是 planning / workflow governance metadata，因此 `Track` 應歸類為 `workflow-core`。
- 本輪只做 docs-only governance，不改任何 runtime code、workflow yaml、schema、migration 或 phase plan。

### White List

- `README.md`
- `doc/implementation_plan_index.md`
- `doc/plans/Idx-000_plan.template.md`
- `doc/plans/Idx-001_plan.md` 到 `doc/plans/Idx-035_plan.md` 的主 plan
- `doc/plans/Idx-036_plan.md`
- `doc/logs/Idx-036_log.md`

### Non-goals

- 不修改任何 runtime code、workflow yaml、schema、migration 或白名單外文件。
- 不修改任何 `Idx-029_phase-*` phase plans。
- 不回補舊 plan 的 `Operating Mode`，也不建立第三種 `Track` 值。
- 不把 `Track` 當成營運層級欄位，亦不變更 `Operating Mode` 現有語意。

### Acceptance Criteria

1. `doc/implementation_plan_index.md` 新增 `Track` 欄位與 `Idx-036`，並依既有分類規則回填現有任務。
2. `doc/plans/Idx-000_plan.template.md` 新增 `Track` header 與 execution block 的 `track` 鍵。
3. 所有主 plan（`Idx-001` 到 `Idx-035`，不含 `Idx-029_phase-*`）都補上最小 `Track` header 與 execution block `track` 留痕。
4. `README.md` 明確說明 `Track` 與 `Operating Mode` 的差異。
5. `doc/logs/Idx-036_log.md` 誠實記錄本輪是 docs-only governance，且 focused validation 可證明主 plan 與 template 已回補，phase plan 未被改。

### Edge Cases

- 舊主 plan 若沒有 `Operating Mode`，只補最小 `Track` header 與 execution block `track`，不重排整份版面。
- 已有 `Operating Mode` 的新計畫，`Track` 必須保留為獨立欄位，不得用註解或括號混寫在同一行。
- `Idx-029_phase-*` phase plan 屬明確排除範圍，即使其格式與主 plan 類似，也不得補 `Track`。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `README.md`
- `doc/implementation_plan_index.md`
- `doc/plans/Idx-000_plan.template.md`
- `doc/plans/Idx-001_plan.md` 到 `doc/plans/Idx-035_plan.md` 的主 plan
- `doc/plans/Idx-033_plan.md`
- `doc/logs/Idx-033_log.md`

research_required: false

### Assumptions

- VERIFIED - 本輪是 docs-only governance 任務，可直接在白名單 markdown 補欄位與 artifact。
- VERIFIED - `Track` enum 只允許 `product-system` 與 `workflow-core`。
- VERIFIED - `Track` 只標示任務工作焦點，不是營運層級；`Operating Mode` 仍維持 `Idx-033` 定義。
- VERIFIED - `Idx-036` 的主要變更面是 planning / workflow governance metadata，因此即使觸及 product-system artifacts，Track 仍應標為 `workflow-core`。
- VERIFIED - phase plans 明確不在本輪回補範圍。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: implementation governance
- Adjacent modules: README navigation、planning artifacts
- Out of scope modules: runtime code、workflow yaml、schema、migration、phase plans、白名單外文件

### Review Requirements

- Domain review: N/A
- Security review: N/A
- QA review: required
- 理由：本輪為 docs-only governance，且使用者已明確指定 reviewer 只需要 QA。

### Done 定義

1. implementation index、template、README 與所有主 plan 的 `Track` 留痕一致。
2. phase plans 未被修改，且未額外回補舊 plan 的 `Operating Mode`。
3. `Idx-036` plan / log 已建立並記錄 focused validation 結果。

### Rollback 策略

- Level: L1
- 前置條件: 本輪只改白名單 markdown
- 回滾動作: 若 `Track` wording 或分類回填被認定有誤，回退對應文檔欄位，不涉及 runtime rollback

---

## 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `README.md` | 修改 | 補 `Track` 與 `Operating Mode` 差異說明 |
| `doc/implementation_plan_index.md` | 修改 | 新增 `Track` 欄位、回填既有任務、登記 `Idx-036` |
| `doc/plans/Idx-000_plan.template.md` | 修改 | 新增 `Track` header 與 execution block `track` |
| `doc/plans/Idx-001_plan.md` 到 `doc/plans/Idx-035_plan.md` 主 plan | 修改 | 回補最小 `Track` header 與 execution block `track` |
| `doc/plans/Idx-036_plan.md` | 新增 | 建立本輪 docs-only governance plan |
| `doc/logs/Idx-036_log.md` | 新增 | 建立本輪執行紀錄 |

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
operating_mode: [cross-mode-governance]
track: [workflow-core]
plan_created: [2026-04-08 00:00:00]
plan_approved: [docs-only governance task; white-list doc edits requested by user]
scope_policy: [strict]
expert_required: [false]
expert_conclusion: [N/A]
security_review_required: [false]
security_reviewer_tool: [N/A]
security_review_trigger_source: [none]
security_review_trigger_matches: []
security_review_start: [N/A]
security_review_end: [N/A]
security_review_result: [N/A]
security_review_conclusion: [N/A]
execution_backend_policy: [chat-primary-with-one-shot-reviewers]
executor_tool: [GitHub Copilot]
executor_backend: [copilot-chat-agent]
monitor_backend: [checkpoint-first-targeted-validation]
last_change_tool: [GitHub Copilot]
qa_tool: [Ivy QA Reviewer]
qa_review_start: [2026-04-08]
qa_review_end: [2026-04-08]
qa_review_result: [PASS_WITH_RISK]
qa_review_conclusion: [既有 QA findings 的 follow-up 已留痕；最終 QA ownership 仍屬 Ivy QA Reviewer]
qa_compliance: [focused validation completed; 本輪只承接既有 QA findings 留痕，不自行做最終 QA approval]
reviewer_outcome_summary: [QA findings follow-up 已回填，主 plan Track 一致性檢查與 phase-plan 排除檢查均已留痕]
log_file_path: [doc/logs/Idx-036_log.md]
scope_exceptions: []
<!-- EXECUTION_BLOCK_END -->