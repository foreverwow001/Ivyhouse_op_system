# Plan: Idx-009

**Index**: Idx-009
**Created**: 2026-03-30
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: Intake / Mapping
**Work Type**: implementation
**Track**: product-system

---

## 目標

把 `foreverjojo/picking-order-analyzer` 已驗證有效的 MOMO / 官網 / 蝦皮 / 橘點子 mapping 規則，先整理成 Ivyhouse 的 bootstrap inventory，再基於目前四渠道 parser 產出落一版最小 mapping engine，範圍只做到規則命中與 `mappingResult` 輸出。

---

## SPEC

### Goal

建立可被後續正式治理接手的第一版 mapping bootstrap，而不是把 analyzer 的硬編碼直接搬進長期 runtime。

### Business Context

- 目前四渠道 parser 已可穩定輸出 `parsedLine`
- 下一個阻斷點不是 parser，而是如何把平台原始品名落到 Ivyhouse 可治理的 mapping 結果
- analyzer repo 的規則命中率高，適合作為 bootstrap inventory 與對照 oracle

### Non-goals

- 不在本輪建立正式可維護的 DB 映射規則表與發布流程
- 不在本輪把單批例外、自動提案、BOM 展開一起落地
- 不在本輪宣稱正式 SKU 主檔與 mapping rule master 已完成治理閉環

### Acceptance Criteria

1. 已有一份 Ivyhouse rule inventory，整理 MOMO / 官網 / 蝦皮 / 橘點子四渠道 analyzer 規則家族。
2. API parse flow 後可自動產生 `mappingResult`，至少包含規則代碼、命中商品名、命中規格、倍率、對應數量、信心與狀態。
3. 四渠道 18 份 sample 可透過 fixture / smoke 驗證代表性 mapping 結果。
4. analyzer 的 legacy ignore 行為若與 Ivyhouse 治理衝突，必須在 inventory 與測試中明確標註，不得靜默沿用。

### Edge Cases

- `提袋加購`、`濾掛式咖啡`、贈品與 `試吃:` 子項在 analyzer 中存在 legacy ignore 或弱治理邊界
- MOMO / 官網共用同一組 mapping family，但 parser 萃取的 raw text 粒度可能不同
- OrangePoint 的 `試吃:` 已在 parser 階段展開，mapping 應吃展開後子品項，而不是再解 grammar

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/data/channel_product_mapping_governance.md`
- `doc/architecture/flows/channel_intake_parser_contract.md`
- `doc/architecture/flows/channel_intake_api_contract.md`
- `doc/architecture/flows/channel_intake_state_machine.md`
- `apps/api/src/intake/intake.service.ts`
- `apps/api/src/intake/types/intake.types.ts`
- analyzer repo: `MappingEngine.js`, `MomoMapping.js`, `ShopeeMapping.js`, `OrangePointMapping.js`

### Missing Inputs

- 正式 `sellableProductSku` 與平台 mapping rule master data 尚未落地
- analyzer repo 沒有可直接當 Ivyhouse 正式權威的 rule inventory artifact

research_required: true

### Assumptions

- VERIFIED - 四渠道 parser 現已可穩定供應 mapping input
- VERIFIED - analyzer repo 適合作為 bootstrap inventory，不適合作為長期 authoritative runtime
- RISK: unverified - 正式 SKU code 尚未接入，因此本輪 `mappingResult` 會以命中商品語意為主，而非完整主資料鍵

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Intake / Mapping
- Adjacent modules: Master Data Governance、Exception Handling
- Out of scope modules: BOM explosion、Finance、正式 proposal publish flow

### File whitelist

- `doc/implementation_plan_index.md`
- `doc/plans/Idx-009_plan.md`
- `doc/logs/Idx-009_log.md`
- `doc/architecture/data/channel_mapping_rule_inventory_bootstrap.md`
- `apps/api/src/intake/intake.controller.ts`
- `apps/api/src/intake/intake.service.ts`
- `apps/api/src/intake/types/intake.types.ts`
- `apps/api/src/intake/mapping/**`
- `apps/api/test/**`

### Done 定義

1. rule inventory 已建立。
2. parse 後可查詢 mapping results。
3. mapping fixture 與 smoke 驗證可提供 sample 級 evidence。

### Rollback 策略

- Level: L2
- 前置條件: 僅新增 mapping bootstrap 邏輯，未改 parser 與 persistence schema
- 回滾動作: 回退 mapping engine、controller endpoint、fixture 與對應文件

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-009-intake-mapping-bootstrap-v1
  goal: 以 analyzer 規則 inventory 為基礎，為四渠道 sample 補上最小 mappingResult 輸出
  retry_budget: 5
  allowed_checks:
    - build-api
    - mapping-fixtures
    - api-smoke
  file_scope:
    - doc/implementation_plan_index.md
    - doc/plans/Idx-009_plan.md
    - doc/logs/Idx-009_log.md
    - doc/architecture/data/channel_mapping_rule_inventory_bootstrap.md
    - apps/api/src/intake/intake.controller.ts
    - apps/api/src/intake/intake.service.ts
    - apps/api/src/intake/types/intake.types.ts
    - apps/api/src/intake/mapping/**
    - apps/api/test/**
  done_criteria:
    - inventory exists and documents analyzer deviations
    - mappingResult is emitted for parsed lines
    - fixtures prove representative mapping hits across four channels
    - no file changes outside file_scope
  escalation_conditions:
    - need formal SKU master integration
    - shared contract conflict found
    - retry budget exhausted
```

---

## 注意事項

- analyzer 的 `提袋加購` / 非禮盒咖啡過濾不可直接照抄，需轉成 Ivyhouse 顯式治理偏差
- 本輪若出現規則命中但正式 SKU 不存在，只能輸出 bootstrap mapping result，不得偽裝成正式 master data 已完備

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: 2026-03-30 00:00:00
plan_approved: 2026-03-30 00:00:00
scope_policy: strict
expert_required: true
expert_conclusion: 需先把 analyzer 規則轉成 Ivyhouse inventory，再做最小 runtime bootstrap
security_review_required: false
security_reviewer_tool: N/A
execution_backend_policy: pty-primary-with-consented-fallback
scope_exceptions: []

# Engineer 執行
executor_tool: copilot-cli
executor_backend: ivyhouse_terminal_fallback
<!-- EXECUTION_BLOCK_END -->