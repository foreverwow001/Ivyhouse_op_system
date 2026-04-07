# Plan: Idx-029 Phase 5 — Verification、Sync Lane 收斂與 Cutover Sign-off

**Parent Task**: Idx-029
**Created**: 2026-04-07
**Planner**: Copilot
**Phase**: Phase 5
**Primary Module**: Workflow Tooling / Governance
**Work Type**: validation / migration

---

## 🎯 目標

在 authority cutover 完成後，以新模型完成完整驗證、portable smoke、downstream workflow smoke、必要 build/tests 與 sign-off，並把 repo 的後續維護方式正式收斂到 manifest-backed sync lane。這一 phase 的目的不是再做功能修改，而是判定「cutover 是否真的完成」，避免只看檔案存在就誤判升版結束。

---

## 📋 SPEC

### Goal

完成 cutover 驗證與 sign-off，使後續 workflow 更新可以回到常規 sync lane。

### Business Context

- 前四個 phase 完成後，repo 結構與入口已切到新模型，但若沒有集中驗證，仍可能留下 broken wrappers、stale settings、unmigrated local config 或 downstream smoke failure。
- 這一 phase 主要面向 Coordinator / Maintainer / Reviewer，不是產品最終使用者。
- 若此 phase 被省略，後續每次 sync 都會在不確定基線上繼續漂移。

### Non-goals

- 不再做新的 structural migration。
- 不新增新的 customizations。
- 不在 verify 階段順手修 unrelated workflow 問題；若發現新問題，應退回對應 phase 處理。

### Acceptance Criteria

1. manifest-backed precheck、sync verify、portable smoke 均通過，或有明確可接受風險記錄。
2. downstream workflow smoke 通過，至少涵蓋 `/dev` 入口、Engineer、QA / Security reviewer routing、local skills catalog、editor bootstrap。
3. downstream build / tests 至少完成 workflow 相關最小驗證，不得只靠 core portable smoke 宣告成功。
4. 已形成 cutover sign-off 結論與殘餘風險清單。
5. 已定義 cutover 後的常規更新流程與維運規則。

### Edge Cases

- precheck pass 但 downstream smoke fail -> 視為 cutover 未完成，回退到對應 phase 修補。
- portable smoke pass 但 `.vscode/**` / devcontainer bootstrap fail -> 視為 live workflow 未完成 cutover。
- 只剩少量 compatibility warnings -> 可 PASS_WITH_RISK，但必須有期限與 owner。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `doc/plans/Idx-029_plan.md`
- `doc/plans/Idx-029_phase-4_plan.md`
- `.github/workflow-core/**`
- `.workflow-core/**`
- `core_ownership_manifest.yml`
- local sync / verify scripts
- downstream workflow-related tests / build commands

### Missing Inputs

- 各 phase 實作完成後的實際 log / evidence 尚未存在

research_required: true

### Sources

- upstream sync lane docs
- local verification commands 與 workflow smoke evidence

### Assumptions

- VERIFIED - cutover 完成定義不能只看檔案結構，必須包含 workflow smoke 與 downstream checks。
- VERIFIED - 發現問題後應回退到對應 phase 修復，而不是在 verify 階段持續加 scope。
- RISK: unverified - downstream 目前尚未整理出完整的 workflow smoke script，正式執行前可能需要先定義最小 smoke checklist。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: verification / sign-off artifacts
- Adjacent modules: `.github/workflow-core/**`, `.workflow-core/**`, `.agent/**`, `.vscode/**`, `.devcontainer/**`
- Out of scope modules: unrelated product feature development

### File whitelist

- `doc/logs/Idx-029_phase-5_log.md`
- 驗證過程需要的最小 supporting notes / checklists

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 驗證 workflow live authority、reviewer routing、skills catalog、bootstrap path、execution evidence path。

#### RBAC IMPACT

- 驗證 workflow-level role separation 是否仍成立。

#### SHARED KEY / CROSS-MODULE IMPACT

- 驗證新 path contract 與 wrapper contract 是否一致。

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- 要求完整記錄 precheck、verify、smoke、tests、exceptions 與 sign-off 結論。

### Done 定義

1. workflow-core cutover 已完成驗證。
2. sign-off 結論已形成。
3. 後續常規 sync lane 已定義。

### Rollback 策略

- Level: L4
- 前置條件: verify 發現問題時，必須能定位到來源 phase
- 回滾動作: 不在 verify 階段直接大改，退回對應 phase 修補後再重跑 verify

### Max rounds

- 估計: 3
- 超過處理: 若 verify 連續 3 輪仍失敗，應重新檢討 cutover phase 分割與 acceptance gates

### Bounded work unit contract

> 本 phase 偏向 QA / sign-off，不建議混入大規模 Engineer 修改。

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/plans/Idx-029_phase-5_plan.md` | 新增 | 建立 Phase 5 supporting plan |

---

## 實作指引

### 1. 核心驗證序列

1. manifest-backed precheck
2. sync verify
3. portable smoke
4. downstream workflow smoke
5. downstream build / tests
6. sign-off 記錄

### 2. Workflow Smoke 最小內容

- `/dev` 入口導航
- root `.github/**` 與 `.github/workflow-core/**` 可讀
- `.workflow-core/skills_local/**` 與 local catalog 可見
- `.agent/**` shim 不再是 authority
- `.vscode/**` / `.devcontainer/**` 啟動面不再綁舊 canonical root

### 3. PASS / PASS_WITH_RISK / FAIL 判準

- PASS：全部 gate 通過，且無高風險殘留
- PASS_WITH_RISK：主線可用，但仍有可解釋且已列 owner / 時限的殘餘風險
- FAIL：任何 live authority、sync verify 或 workflow smoke 的硬 gate 失敗

### 4. 常規維運切換

- cutover 完成後，後續更新流程收斂為：固定 upstream ref -> precheck -> stage/apply/update -> verify -> downstream tests -> sign-off
- 不再以人工大覆蓋方式升級 root architecture

---

## 注意事項

- 風險提示: 若這一 phase 只驗證 upstream core 而不驗證 downstream 自己的 workflow smoke，最終會得到假的完成結論。
- 資安考量: log 中僅記錄命令結果與結論，不洩漏 secrets、tokens、私人路徑或 reviewer session 內容。
- 相依性: 依賴前四個 phase 都已完成並留下可讀 log。
- 缺漏前提: 若 downstream 尚未整理 workflow smoke checklist，應先補 checklist 再跑 sign-off。

---

## 相關資源

- `doc/plans/Idx-029_plan.md`
- `doc/plans/Idx-029_phase-4_plan.md`

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: [2026-04-07 00:00:00]
plan_approved: [待用戶確認]
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
execution_backend_policy: [N/A - planning only]
scope_exceptions: []

# Engineer 執行
executor_tool: [N/A - planning only]
executor_backend: [N/A]
monitor_backend: [N/A]
log_file_path: [待後續 phase 建立]
executor_tool_version: [N/A]
executor_user: [N/A]
executor_start: [N/A]
executor_end: [N/A]
session_id: [N/A]
last_change_tool: [N/A]

# QA 執行
qa_tool: [N/A - planning only]
qa_tool_version: [N/A]
qa_user: [N/A]
qa_start: [N/A]
qa_end: [N/A]
qa_result: [N/A]
qa_compliance: [N/A]
<!-- EXECUTION_BLOCK_END -->