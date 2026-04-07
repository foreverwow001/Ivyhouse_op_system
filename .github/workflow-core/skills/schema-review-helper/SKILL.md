---
name: schema-review-helper
description: "在通用 business-system 專案中審查 schema、master-data、shared-key、migration 或 cross-module contract 影響時使用。"
---

# Schema Review Helper

> 用途：降低 schema / master data / shared key / cross-module review 的執行摩擦。
> 這不是新的 gate 規格來源，也不負責決定是否一定要啟動 Domain Review、QA 或 migration gate；workflow hard contract 仍以 `.github/workflow-core/AGENT_ENTRY.md` 為準。

## 何時使用

當任務命中以下任一情況時，可加讀本 helper，先完成 intake 與風險盤點，再開始寫正式 Plan、Domain Review、Engineer 實作或 QA 驗收：

- Plan 的 `MASTER DATA IMPACT` 非 `N/A`
- Plan 的 `SHARED KEY / CROSS-MODULE IMPACT` 非 `N/A`
- file whitelist 或變更檔案命中 `models/`、`schemas/`、`migrations/`、`contracts/`
- user / Planner / Domain Expert / Coordinator 明確要求 schema review

## 與其他角色 / 技能的分工

- `domain_expert`：回答「這個變更在資料架構、流程狀態、RBAC、財務邏輯上是否合理」。
- `schema-review-helper`：聚焦回答「資料結構、shared key、migration 與 cross-module contract 會不會造成靜默壞掉或不一致」。
- `code-reviewer`：先抓靜態問題與 obvious smell，但不能取代 schema / contract review。

結論：本 helper 是資料結構與契約一致性的 review accelerator，不是新的 runtime skill，也不是自動 migration checker。

## 使用前先確認

1. 已讀 `project_rules.md` 或 `.github/workflow-core/workflow_baseline_rules.md`（依工作區型態）
2. 已讀本輪 Plan 的下列區塊：
   - `File whitelist`
   - `MASTER DATA IMPACT`
   - `STATE / WORKFLOW IMPACT`
   - `RBAC IMPACT`
   - `SHARED KEY / CROSS-MODULE IMPACT`
3. 已確認相關 authoritative docs 是否存在：
   - schema contract / glossary / master data dictionary
   - integration mapping / event payload 定義
   - migration note / rollback note

若上述文件缺失：

- 先把缺口記錄進 Plan / Review findings
- 不要憑空推定欄位語意、shared key owner 或 migration 順序

## 快速流程

1. 先找出 authoritative data owner 與 shared contract。
2. 確認這次變更是新增欄位、改型別、改 key、改 relation、改 migration，還是只是文件補充。
3. 盤點 upstream / downstream 模組、外部整合與同步流程是否會受影響。
4. 區分 backward-compatible、requires coordination、requires migration、requires rollback planning。
5. 輸出 review 建議，供 Planner / Domain Expert / QA / Coordinator 使用。

## 詳細 Checklist

完整的 intake、compatibility 問題、migration 風險、shared key / module boundary 問題與建議輸出骨架，請閱讀：

- `.github/workflow-core/skills/schema-review-helper/references/schema_checklist.md`

## 建議輸出骨架

```markdown
## 🧩 Schema Review

### Scope
- Reviewed files:
- Reviewed contracts/docs:

### Impact Classification
- master_data_impact: [none / low / medium / high]
- schema_compatibility: [compatible / coordination-required / breaking]
- migration_risk: [none / low / medium / high]
- cross_module_risk: [none / low / medium / high]

### Findings
| ID | Area | Risk | Evidence | Impact | Recommendation |
|----|------|------|----------|--------|----------------|

### Coverage Gaps
- [缺少哪些 authoritative docs / mapping / rollback evidence]

### Decision
- PASS
- PASS_WITH_RISK
- FAIL
```
