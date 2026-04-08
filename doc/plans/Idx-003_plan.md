# Plan: Idx-003

**Index**: Idx-003
**Created**: 2026-03-26
**Planner**: @GitHubCopilot
**Phase**: Phase 0
**Primary Module**: Master Data
**Work Type**: governance
**Track**: product-system

---

## 🎯 目標

建立 Ivyhouse OP System 第一版主資料字典，先把目前已治理的 CSV 主資料與高風險參照實體升格為正式權威輸出，並補上原料、配方版本、出貨用品 / 包裝耗材，以及「內外包材共用同一份包材主檔」的最低可執行定義。這輪的重點不是一次補完整個系統，而是先把目前最直接阻斷 ERP 落地的主資料骨架補齊。

---

## 📋 SPEC

### Goal

建立可供後續 schema、workflow 與 RBAC 對齊的第一版主資料字典。

### Business Context

- 屬於主資料治理與跨模組 shared key 收斂主線
- 使用角色為主資料治理、流程設計、後續 schema / migration 規劃者
- 目前多張 CSV 已正式化，但尚未回到 Phase 0 正式 artifact，存在規則只在聊天與個別文件中的風險

### Non-goals

- 不在本輪補齊門市、倉庫、供應商、客戶等全部主資料字典細節
- 不在本輪建立正式資料庫 schema 或 migration

### Acceptance Criteria

1. 建立一份權威主資料字典，涵蓋目前已治理的五類資料，並補上原料、配方版本、出貨用品 / 包裝耗材與內外包材共用主檔的最低必要治理定義。
2. 文件明確定義生命週期欄位與高風險規則的核定欄位語意。
3. `doc/implementation_plan_index.md` 與本任務 plan/log artifact 同步建立，任務狀態改為 `In Progress`。

### Edge Cases

- 單位換算規則不是典型主資料 -> 仍納入本輪字典，因其控制數量語意且屬高風險共享契約
- 既有 CSV 缺歷史有效期間 -> 允許以 2026/3/26 過渡回填，但必須在字典中明寫限制

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/data/README.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/modules/README.md`
- `doc/architecture/decisions/README.md`
- `doc/architecture/data/shared_key_contract.md`
- `doc/architecture/data/shared_key_matrix_six_csv.md`
- `doc/architecture/data/sellable_product_master_spec.md`

### Missing Inputs

- 門市、倉庫、供應商、客戶等核心主資料的獨立字典仍缺漏
- 原料採購條件、配方 BOM 明細與出貨用品盤點細則仍待補獨立規格
- 正式 glossary 與 RBAC matrix 尚未建立

research_required: true

### Sources

- repo 內既有 authoritative docs
- 目前已治理的五張正式 / 高風險 CSV 載體

### Assumptions

- VERIFIED - 目前六張 CSV shared key contract 已作為第一版跨模組 key 基線
- RISK: unverified - 尚未有完整 RBAC matrix 支撐規則表的正式核定責任分工

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Master Data
- Adjacent modules: Production、Inventory、Order / Fulfillment
- Out of scope modules: Finance / Reconciliation、Portal / Identity / Audit 的完整設計

### File whitelist

- `doc/architecture/data/master_data_dictionary.md` - 建立第一版主資料字典
- `doc/architecture/data/README.md` - 掛上新字典文件
- `doc/implementation_plan_index.md` - 同步任務狀態
- `doc/plans/Idx-003_plan.md` - 建立正式 plan
- `doc/logs/Idx-003_log.md` - 建立正式 log

### Conditional impact blocks

#### MASTER DATA IMPACT

- 涉及銷售商品、包材主檔、內包裝完成品、單位換算規則、轉換扣帳規則、原料、配方版本、出貨用品 / 包裝耗材
- 需要定義 owner、正式 key、生命週期欄位與停用規則

#### STATE / WORKFLOW IMPACT

- 涉及主資料 / 參照的 `草稿`、`啟用`、`停用` 狀態語意
- 本輪不處理完整訂單 / 工單 / 財務 state machine

#### RBAC IMPACT

- 規則表存在核定責任，但正式 RBAC matrix 尚未完成
- 本輪僅標記待補，不宣稱正式 maker-checker 已完成

#### SHARED KEY / CROSS-MODULE IMPACT

- 涉及 `銷售商品SKU_正式`、`內包裝完成品SKU_正式`、`外包裝材料SKU_正式`、`規則代碼_正式`
- 需讓 Production、Inventory、Order / Fulfillment 對齊同一份主資料字典

#### FINANCE / RECONCILIATION IMPACT

- N/A，本輪不直接改動財務參照與對帳模型

#### OBSERVABILITY / AUDIT IMPACT

- 需把生命週期與核定欄位納入正式文件，作為後續 audit 與例外追溯基線

### Done 定義

1. 第一版主資料字典已建立且可對應目前治理中的五類資料，並補上原料、配方版本、出貨用品 / 包裝耗材的最低必要治理結構。
2. Implementation index 與 Idx-003 plan/log artifact 已對齊。
3. 文件已清楚標示仍缺的 Phase 0 主資料範圍，不虛報完成。

### Rollback 策略

- Level: L1
- 前置條件: 僅限文件與索引變更，尚未產生 schema / migration
- 回滾動作: 以單次文件回退移除新字典與 index 狀態調整

### Max rounds

- 估計: 1
- 超過處理: 若發現字典範圍需擴至全量核心實體，回到 implementation index 拆下一輪工作

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-003-master-data-dictionary-v1
  goal: 建立第一版主資料字典並把目前 CSV 治理成果升格為正式輸出
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - touched-file-lint
  file_scope:
    - doc/architecture/data/master_data_dictionary.md
    - doc/architecture/data/README.md
    - doc/implementation_plan_index.md
    - doc/plans/Idx-003_plan.md
    - doc/logs/Idx-003_log.md
  done_criteria:
    - 第一版主資料字典可對應目前五類資料
    - index 與 plan/log artifact 已同步
    - no file changes outside file_scope
    - engineer result is ready for external review
  escalation_conditions:
    - scope break
    - new security-sensitive path or keyword triggered
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/architecture/data/master_data_dictionary.md` | 新增 | 建立第一版主資料字典 |
| `doc/architecture/data/README.md` | 修改 | 掛上字典入口 |
| `doc/implementation_plan_index.md` | 修改 | 將 Idx-003 轉為 In Progress |
| `doc/plans/Idx-003_plan.md` | 新增 | 正式 plan artifact |
| `doc/logs/Idx-003_log.md` | 新增 | 正式 log artifact |

## 實作指引

### 1. 模組與資料層

- 只處理權威文件與 CSV 契約，不建立平行資料字典。
- owner、正式 key 與 consumer 邊界必須沿用既有 shared key contract。

### 2. 流程與權限

- 本輪只定義主資料生命週期，不自行發明完整交易流程狀態。
- 涉及核定責任的欄位要誠實標記待補，不跳過審計需求。

### 3. 介面與驗證

- 以文件一致性、index 狀態與 CSV 欄位對照作為驗證方式。
- 不涉及 API、UI 或 migration 測試。

## 注意事項

- 風險提示: 若把高風險參照當成一般備註資料，後續 schema 會失真
- 資安考量: 本輪不處理 secrets，但需保留審計與責任界線
- 相依性: 依賴 shared key contract、flows baseline 與 implementation index
- 缺漏前提: 正式 glossary、RBAC matrix、全量主資料字典仍缺

## 相關資源

- `doc/architecture/data/README.md`
- `doc/architecture/data/shared_key_contract.md`
- `doc/architecture/data/shared_key_matrix_six_csv.md`

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: 2026-03-26 16:37:03
plan_approved: 2026-03-26 16:37:03
scope_policy: strict
expert_required: true
expert_conclusion: 需先補主資料字典，避免 CSV 治理成果停留在零散文件
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
executor_backend: ivyhouse_terminal_fallback
monitor_backend: manual_confirmation
executor_tool_version: GPT-5.4
executor_user: GitHub Copilot
executor_start: 2026-03-26 16:37:03
executor_end: 2026-03-26 16:42:18
session_id: N/A
last_change_tool: copilot-cli

# QA 執行
qa_tool: pending-cross-qa
qa_tool_version: N/A
qa_user: N/A
qa_start: N/A
qa_end: N/A
qa_result: PASS_WITH_RISK
qa_compliance: ⚠️ 例外：尚未完成 cross-QA

# 收尾
log_file_path: doc/logs/Idx-003_log.md
<!-- EXECUTION_BLOCK_END -->