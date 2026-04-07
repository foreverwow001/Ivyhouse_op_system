# Plan: Idx-014

**Index**: Idx-014
**Created**: 2026-04-02
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: Master Data / Runtime Validation
**Work Type**: implementation

---

## 目標

把 `原料直接分裝 / no_inner_stage` 等 CSV owner 例外正規化成 runtime 可驗證規則，避免後端長期靠欄位名或備註猜實體型別。

---

## SPEC

### Goal

將共享鍵例外從文件層正式延伸到 runtime validation 與資料輸入正規化策略，建立 `compositionInputType + compositionInputSku` 的明確落地方向。

### Business Context

- CSV 已完成第二輪掃描與修正，`N0001..N0004` 已被正式替換為 raw-material codes。
- shared key contract 已承認 `銷售商品組成對照表` 在特定條件下可承接 `原料代碼`。
- 若 runtime 仍把該欄位視為單一 `內包裝完成品SKU`，未來 E2E 與 schema 都會不穩定。

### Non-goals

- 不在本輪重做整套主資料 owner 模型。
- 不在本輪建立完整 CSV 匯入 UI。
- 不在本輪把所有 CSV 例外一次一般化成通用 DSL。

### Acceptance Criteria

1. runtime 有明確規則可辨識 `inner-pack` 與 `raw-material direct-pack` 兩種輸入型別。
2. `compositionInputType + compositionInputSku` 的正規化策略已文件化，必要時有過渡 DTO / validation 實作。
3. 對 CSV authoritative source 的 validation 規則可阻擋不存在 SKU、owner 越權與未核定例外。
4. 至少有一組 fixture / 測試覆蓋 `原料直接分裝` 與一般 `內包裝完成品` 兩條路徑。

### Edge Cases

- 同一 sellable family 可能同時存在 `inner-pack` 與 direct-pack 版本，不能只靠 SKU 前綴粗暴判斷。
- 若例外只存在 CSV 層，runtime 需清楚定義是 import-time normalization 還是 service-time interpretation。
- 未來若引入更多 `compositionInputType`，本輪設計不得鎖死只剩兩種型別。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/data/shared_key_contract.md`
- `doc/architecture/data/shared_key_matrix_six_csv.md`
- `doc/architecture/data/sellable_product_master_spec.md`
- `doc/architecture/flows/daily_ops_engineering_breakdown.md`
- `project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv`
- `project_maintainers/data/drafts/materials-and-recipes/2026-04-01_原料主檔最低版本草案.csv`
- `apps/api/src/master-data/**`
- `apps/api/src/intake/**`

### Missing Inputs

- runtime 層尚無 composition input type 的正式欄位定義。
- authoritative CSV import validation 邏輯尚未專門承接這個例外。

research_required: true

### Assumptions

- VERIFIED - shared key contract 已正式寫回 consumer 槽位例外，不是資料錯誤。
- VERIFIED - 後續 schema / API 應正規化為 `compositionInputType + compositionInputSku`。
- RISK: unverified - 目前哪個 runtime owning abstraction 最適合承接 validation，仍需實作前定錨。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Master Data / Runtime Validation
- Adjacent modules: Intake、Daily Ops、Inventory
- Out of scope modules: Finance、完整主資料發佈後台

### File whitelist

- `doc/architecture/data/shared_key_contract.md`
- `doc/architecture/data/shared_key_matrix_six_csv.md`
- `doc/architecture/data/sellable_product_master_spec.md`
- `doc/architecture/flows/daily_ops_engineering_breakdown.md`
- `project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv`
- `project_maintainers/data/drafts/materials-and-recipes/2026-04-01_原料主檔最低版本草案.csv`
- `apps/api/src/master-data/**`
- `apps/api/src/intake/**`
- `apps/api/test/**`
- `doc/plans/Idx-014_plan.md`
- `doc/logs/Idx-014_log.md`

### Done 定義

1. CSV owner 例外在 runtime 已有正規化策略。
2. validation 與 fixture 已能證明例外合法邊界。
3. 不把 owner 邊界誤改成平行主資料模型。

### Rollback 策略

- Level: L2
- 前置條件: 若 runtime normalization 造成既有 mapping / daily-ops 路徑失效，需回退到文件承認但 runtime 未切換的狀態。
- 回滾動作: 回退新增欄位、validation 與 fixture，保留 shared key 文件不回退。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-014-csv-owner-exception-runtime-normalization
  goal: 把 CSV shared key 例外正規化為 runtime 可驗證契約
  retry_budget: 5
  allowed_checks:
    - csv-validation-fixtures
    - targeted-unit-tests
    - touched-slice-build
  file_scope:
    - doc/architecture/data/shared_key_contract.md
    - doc/architecture/data/shared_key_matrix_six_csv.md
    - doc/architecture/data/sellable_product_master_spec.md
    - doc/architecture/flows/daily_ops_engineering_breakdown.md
    - project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv
    - project_maintainers/data/drafts/materials-and-recipes/2026-04-01_原料主檔最低版本草案.csv
    - apps/api/src/master-data/**
    - apps/api/src/intake/**
    - apps/api/test/**
    - doc/plans/Idx-014_plan.md
    - doc/logs/Idx-014_log.md
  done_criteria:
    - composition input type 已可正規化
    - 例外 validation 規則已落地
    - 至少一組 fixture 證明一般與例外路徑皆可驗證
    - no file changes outside file_scope
  escalation_conditions:
    - 需新增平行 owner 模組才能繼續
    - shared key contract 與現場 CSV 再次衝突
    - retry budget exhausted
```

---

## 注意事項

- 本任務屬 shared key / inventory 高風險面，正式執行必須補 Security Review 與 Domain Review。
- 不得以「先讓它過」為理由，把 consumer 例外誤寫成 owner 轉移。
- 若新增 type enum 或 DTO 欄位，需同時更新權威文件與測試 fixture。

## 2026-04-02 正式執行策略

### 已確認前提

- `recipe-owner.service.ts` 目前把 `銷售商品組成對照表` 的 `對應內包裝成品SKU` 一律視為 `INNER_PACK_PRODUCT`。
- CSV 已存在已核定的 `RM****` 直分裝例外，因此現況會把 direct-pack raw material 誤分類到錯誤 inventory bucket。
- 最接近的 owning abstraction 是 `RecipeOwnerService.expandSellablePlanLine()`，因為它直接決定 BOM reservation 的 `materialType`。

### 本輪執行順序

1. 先在 `RecipeOwnerService` 補 composition input type 正規化。
2. 補 focused test，證明一般 `inner-pack` 與 `raw direct-pack` 兩條路徑都被正確分類。
3. 再把 shared key / runtime 文件與 log 補齊。

### 第一個可否證假設

- 假設：`RM` 直分裝例外目前被誤當成 `INNER_PACK_PRODUCT`，因此 `InventoryService.mapMaterialTypeToBucket()` 會落到錯誤 bucket。
- 便宜檢查：建立 focused test 驗證 `SELLABLE` plan line 展開後，`RM****` 例外應輸出 `InventoryItemType.MATERIAL`，而一般 `IP****` / `SF****` 仍保持 `INNER_PACK_PRODUCT`。

## 2026-04-02 執行結果

- 已在 `MasterDataService` 補 `resolveCompositionInputType()`，改用正式 owner 主檔 membership 判定組成輸入型別。
- 已在 `RecipeOwnerService.expandSellablePlanLine()` 套用正規化結果，讓 `RM0001` 類 direct-pack 例外輸出 `MATERIAL`。
- 已新增 `test/recipe-owner-direct-pack.test.js`，同時覆蓋一般 `inner-pack` 與 `raw direct-pack` 兩條路徑。
- focused validation：`npm run test:recipe-owner` 回傳 `PASS`。

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: 2026-04-02 00:00:00
plan_approved: 2026-04-02 00:00:00
scope_policy: strict
expert_required: true
expert_conclusion: shared key 例外已被文件正式核定，下一步必須收斂到 runtime，不可長期停在備註層
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: path-rule
security_review_trigger_matches:
  - shared key
  - inventory
security_review_start: 2026-04-02 00:00:00
security_review_end: 2026-04-02 00:00:00
security_review_result: PASS_WITH_RISK
security_review_conclusion: runtime normalization 已成立，但 CSV authoritative source validation 與 raw-material bucket 治理仍待後續補強
execution_backend_policy: pty-primary-with-consented-fallback
scope_exceptions: []

# Engineer 執行
executor_tool: copilot-cli
executor_backend: pty-primary
monitor_backend: manual_confirmation
executor_tool_version: GPT-5.4
executor_user: GitHub Copilot
executor_start: 2026-04-02 00:00:00
executor_end: 2026-04-02 00:00:00
session_id: pending
last_change_tool: copilot-cli

# QA 執行
qa_tool: Explore
qa_tool_version: GPT-5.4
qa_user: Explore
qa_start: 2026-04-02 00:00:00
qa_end: 2026-04-02 00:00:00
qa_result: PASS_WITH_RISK
qa_compliance: PASS - cross-QA reviewer 與 last_change_tool 不同，且已完成 cross-QA / Security / Domain review 回填

# 收尾
log_file_path: doc/logs/Idx-014_log.md
<!-- EXECUTION_BLOCK_END -->