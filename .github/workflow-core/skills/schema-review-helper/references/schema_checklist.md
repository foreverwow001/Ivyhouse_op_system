# Schema Review Checklist

> 用途：提供 generic business-system 專案可共用的 schema / master data / shared key review 清單。
> 這份 checklist 不替任何特定產業預設實體或欄位，只提供結構化審查問題。

## 1. Intake

- 本輪變更涉及哪些檔案？
- 哪些檔案是 schema / migration / contract / model / mapping 的 authoritative source？
- Plan 的 `MASTER DATA IMPACT`、`STATE / WORKFLOW IMPACT`、`RBAC IMPACT`、`SHARED KEY / CROSS-MODULE IMPACT` 是否已填寫？
- 是否存在 glossary、master data dictionary、event contract、API schema、migration note？

## 2. Data Ownership

- 哪個模組或文件是這份資料結構的 authoritative owner？
- shared key 是否有單一命名與語意來源？
- 是否存在不同模組各自定義同名欄位但語意不一致？

## 3. Compatibility

- 是新增欄位、刪除欄位、改型別、改 enum、改 relation，還是改 key？
- 這個修改是否 backward-compatible？
- 若不是 backward-compatible，是否已標出協調範圍與切換策略？
- 下游 reader / writer / integration 是否會因為這次修改靜默失敗？

## 4. Migration / Rollout Risk

- 是否需要 migration？若需要，是否已有 migration / rollback plan？
- 是否需要 backfill、reindex、dual-write、dual-read、feature flag 或分階段 rollout？
- 若 migration 中斷，資料是否可能停在不一致狀態？

## 5. Shared Key / Cross-Module Impact

- shared key、join key、external id、event payload key 是否被改名或改語意？
- 哪些相鄰模組、外部整合、報表、同步程序會受影響？
- 是否已有 integration mapping 或 contract test 可支撐這次變更？

## 6. State / RBAC Linkage

- 若 schema 變更涉及 status、state、permission、approval boundary，是否同步檢查相對應流程與權限文件？
- 是否存在資料結構已更新，但狀態流或權限邏輯仍維持舊假設的風險？

## 7. Evidence Expectations

- 需要哪些 docs / tests / migration evidence 才能把風險降到可接受？
- 若目前只能人工驗證，是否已在 Plan / QA 結果中留下明確範圍與未覆蓋缺口？

## 8. Decision Heuristic

- `PASS`：變更相容、authoritative docs 充足、跨模組風險已覆蓋。
- `PASS_WITH_RISK`：主要路徑合理，但仍缺部分 migration / contract / downstream evidence。
- `FAIL`：authoritative docs 缺失嚴重、breaking impact 未被控制，或 shared key / migration 風險不可接受。
