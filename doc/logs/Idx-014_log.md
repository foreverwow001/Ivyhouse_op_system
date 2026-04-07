# Idx-014: CSV owner 例外正規化與 runtime validation 收斂 - Execution Log

> 建立日期: 2026-04-02
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-014`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-014_plan.md`
- log_file_path: `doc/logs/Idx-014_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

把 `原料直接分裝` 等 shared key 例外收斂到 runtime validation 與正規化策略，不再讓程式長期猜欄位語意。

### Scope

- 對齊 shared key contract 與 CSV 現況
- 設計 `compositionInputType + compositionInputSku` 落地方向
- 建立 runtime validation 與 fixture evidence

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | copilot-cli |
| security_reviewer_tool | Explore |
| qa_tool | Explore |
| last_change_tool | copilot-cli |
| qa_result | PASS_WITH_RISK |
| commit_hash | pending |

## 🚦 FORMAL_WORKFLOW_GATES

| Gate | Status | Summary | Timestamp |
|------|--------|---------|-----------|
| Preflight | PASS | 已鎖定 `RecipeOwnerService.expandSellablePlanLine()` 為最接近的 runtime owning abstraction，並在該切口完成修正 | 2026-04-02 |
| Research | PASS | 已確認 `RM****` 直分裝例外原先被錯分；並以 focused test 證明修正後分類正確 | 2026-04-02 |
| Maintainability | PASS | 以 owner 主檔 membership 判定型別，未新增平行 owner 模型或硬編碼欄位語意 | 2026-04-02 |
| UI-UX | N/A | 非前端任務 | 2026-04-02 |
| Evidence | PASS | `test:recipe-owner` 已同時覆蓋 `A1` inner-pack 與 `RM0001` raw direct-pack 兩條路徑 | 2026-04-02 |
| Security | PASS_WITH_RISK | runtime normalization 已成立，但 CSV authoritative source validation 與 raw-material bucket 治理仍待後續補強 | 2026-04-02 |
| Domain | PASS_WITH_RISK | owner 邊界維持正確，但 raw-material direct-pack 與 packaging-material 仍共用同一 bucket 映射 | 2026-04-02 |
| Plan Validator | PASS | 實際變更維持在 master-data、focused test 與對應權威文件範圍內 | 2026-04-02 |

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| N/A | N/A | N/A | 已完成 kickoff：定位 `recipe-owner.service.ts` 為 014 的第一個修正切口 | 2026-04-02 |

## 🆕 2026-04-02 Kickoff 摘要

- 已確認 `RecipeOwnerService` 直接決定 sellable 組成展開時的 `materialType`。
- 已確認目前 `對應內包裝成品SKU` 欄位中的 `RM****` 例外會被視為 `INNER_PACK_PRODUCT`。
- 下一步是以 focused test 驗證一般 `inner-pack` 與 `raw direct-pack` 兩條路徑。

## 🆕 2026-04-02 執行結果

- 已在 `MasterDataService` 新增 `resolveCompositionInputType()`，用正式 owner 主檔 membership 辨識組成輸入型別。
- 已更新 `RecipeOwnerService`，讓 `RM0001` 類 direct-pack 例外輸出 `MATERIAL`，一般 `A1` 仍維持 `INNER_PACK_PRODUCT`。
- 已新增 `test/recipe-owner-direct-pack.test.js`，覆蓋一般 / 例外兩條路徑。
- focused validation：`npm run test:recipe-owner` 回傳 `PASS`。

## ✅ QA_SUMMARY

- 結論：PASS_WITH_RISK
- 風險：目前正規化已落到 runtime，但 raw material 仍暫沿用 `MATERIAL -> PACKAGING_MATERIAL` bucket 映射，尚未擴成獨立 raw-material inventory bucket 治理
- 後續事項：補 CSV authoritative source validation，並在後續 schema / inventory owner 精化時處理 raw-material bucket 模型

## 🔎 CROSS_QA_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：runtime type resolution 已正確落地，`RecipeOwnerService` 也已套用 `resolveCompositionInputType()`；focused test 已覆蓋 `A1 -> INNER_PACK_PRODUCT` 與 `RM0001 -> MATERIAL`
- 殘餘風險：inventory ledger 目前仍把 direct-pack raw material 與 packaging material 收斂到同一 bucket，需後續 bucket 模型補強

## 🔐 SECURITY_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：未知 composition input SKU 目前會被 runtime 明確拒絕；但 CSV authoritative source 尚未有 import-time validation，可攔阻未核定例外或 owner 越權
- 殘餘風險：若 CSV 直接引入未核定 `RM****` 或錯誤槽位，仍需等 runtime 執行到該路徑才會失敗

## 🧭 DOMAIN_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：shared key 例外的 owner 邊界維持正確，組成表只是被核准的 consumer 槽位；但 bucket 層仍未區分 raw-material direct-pack 與 packaging-material
- 殘餘風險：後續盤點、溯源與成本分析若需要分離 raw material 與 packaging material，仍需更精細的 inventory bucket 治理

## 🏁 COMPLETION_MARKERS

- `[ENGINEER_DONE]`: present
- `[QA_DONE]`: present
- `[FIX_DONE]`: not-required

## 📎 EVIDENCE

- PTY debug: pending
- PTY live: pending
- 其他 evidence: `npm run test:recipe-owner` 回傳 `PASS`，並驗證 `A1 -> INNER_PACK_PRODUCT`、`RM0001 -> MATERIAL`