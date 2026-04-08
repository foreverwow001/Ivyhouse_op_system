# Plan: Idx-010

**Index**: Idx-010
**Created**: 2026-03-30
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: Intake / Master Data Governance
**Work Type**: spec
**Track**: product-system

---

## 目標

為四渠道 intake 中目前最容易與 legacy analyzer 混淆的三類特殊項 `補寄商品專用/勿下單`、咖啡、`提袋加購` 建立正式治理基線，先決定哪些應升成正式銷售商品、哪些只屬底層主資料、哪些必須維持例外流程，作為下一步 `matchedProductName -> 銷售商品SKU_正式` 接線的前置依據。

---

## SPEC

### Goal

把特殊項分類從「bootstrap 規則猜測」提升為「有 owner、有邊界、有例外路徑的正式治理決策」。

### Business Context

- `Idx-009` 已把 parser 後的 bootstrap `mappingResult` 落地，但目前只輸出語意命中，尚未正式接到 `銷售商品SKU_正式`
- `提袋加購`、咖啡與 `補寄商品專用/勿下單` 若不先分類清楚，下一步 SKU lookup 會混淆銷售商品、出貨用品與例外標記三種不同語意
- analyzer repo 過去對其中部分項目採靜默略過，與 Ivyhouse 的主資料治理方向衝突

### Non-goals

- 不在本輪修改 runtime mapping engine、API、DTO 或測試
- 不在本輪新增 DB table、主資料欄位、schema 或 migration
- 不在本輪完成 `matchedProductName -> SKU` 程式接線

### Acceptance Criteria

1. 已有一份正式文件明確規定三類特殊項的分類、owner 與 intake 路徑。
2. 文件必須明確說明哪些屬 `銷售商品主檔`、哪些只屬 `出貨用品 / 包裝耗材`、哪些不能成為商品而必須走例外。
3. 文件必須補上下一步 SKU 接線的最小前置條件與禁止事項。
4. `doc/implementation_plan_index.md`、plan/log 與 data 架構入口需同步掛上本 work unit。

### Edge Cases

- 咖啡存在單包、40 包盒裝、60 包盒裝、綜合盒裝與禮盒內子項多種粒度
- `提袋加購` 既可能代表實際對客收費附加購商品，也可能被誤解成單純出貨用品
- `補寄商品專用/勿下單` 會出現在真實樣本，但它不是穩定商品名稱，而是操作標記

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/data/README.md`
- `doc/architecture/data/master_data_dictionary.md`
- `doc/architecture/data/shared_key_contract.md`
- `doc/architecture/data/sellable_product_master_spec.md`
- `doc/architecture/data/channel_product_mapping_governance.md`
- `doc/architecture/flows/channel_intake_exception_resolution_spec.md`
- `project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv`
- `project_maintainers/data/active/master-data/2026-03-25_內包裝完成品主檔_template.csv`

### Missing Inputs

- `提袋加購` 對客販售的正式 SKU 清單尚未文件化
- `補寄商品專用/勿下單` 對應的正式補寄流程 state / 欄位尚未建模

research_required: true

### Assumptions

- VERIFIED - 咖啡家族已存在正式銷售商品、內包裝完成品與外包裝組成依據
- VERIFIED - `提袋加購` 不應再被當成 parser / mapping 噪音直接濾掉
- VERIFIED - `補寄商品專用/勿下單` 不符合正式銷售商品的最小定義
- RISK: unverified - `提袋加購` 是否會分尺寸、盒型或袋型多 SKU，仍需後續主資料 owner 補齊

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Intake / Master Data Governance
- Adjacent modules: Order / Fulfillment、Inventory、Exception Handling
- Out of scope modules: Finance、runtime parser / mapping code、schema

### File whitelist

- `doc/implementation_plan_index.md`
- `doc/plans/Idx-010_plan.md`
- `doc/logs/Idx-010_log.md`
- `doc/architecture/data/README.md`
- `doc/architecture/data/channel_product_mapping_governance.md`
- `doc/architecture/data/channel_intake_special_item_governance.md`

### Done 定義

1. 特殊項治理規則已文件化。
2. plan / log / index 已可追溯本輪決策。
3. 下一步 SKU 接線的前置條件與禁止事項已清楚列出。

### Rollback 策略

- Level: L1
- 前置條件: 本輪只新增 / 更新文件，不涉及 runtime 與資料結構
- 回滾動作: 回退 `Idx-010` 與特殊項治理文件

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-010-intake-special-item-governance-v1
  goal: 為補寄標記、咖啡與提袋加購建立正式治理分類，作為 SKU 接線前置依據
  retry_budget: 3
  allowed_checks:
    - document-consistency-readback
  file_scope:
    - doc/implementation_plan_index.md
    - doc/plans/Idx-010_plan.md
    - doc/logs/Idx-010_log.md
    - doc/architecture/data/README.md
    - doc/architecture/data/channel_product_mapping_governance.md
    - doc/architecture/data/channel_intake_special_item_governance.md
  done_criteria:
    - three special item families have explicit governance classification
    - sku-bridge prerequisites are documented
    - no runtime files changed
  escalation_conditions:
    - shared key contract conflict found
    - authoritative docs disagree on owner boundary
    - bag add-on requires new entity type before continuation
```

---

## 注意事項

- `提袋加購` 是否升成正式商品，不等於把 `PK` 外包裝材料 key 直接當 sellable SKU 使用
- 咖啡應區分銷售商品層、內包裝完成品層與外包裝材料層，避免下一步 lookup 錯接到底層 key
- `補寄商品專用/勿下單` 若未來要自動化，應往補寄流程欄位或作業事件建模，不得偽裝成商品主檔

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: 2026-03-30 00:00:00
plan_approved: 2026-03-30 00:00:00
scope_policy: strict
expert_required: true
expert_conclusion: 需先鎖定特殊項 owner 與例外邊界，才能安全接正式 SKU
security_review_required: false
security_reviewer_tool: N/A
execution_backend_policy: pty-primary-with-consented-fallback
scope_exceptions: []

# Engineer 執行
executor_tool: copilot-cli
executor_backend: ivyhouse_terminal_fallback
<!-- EXECUTION_BLOCK_END -->