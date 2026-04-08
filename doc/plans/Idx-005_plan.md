# Plan: Idx-005

**Index**: Idx-005
**Created**: 2026-03-26
**Planner**: @GitHubCopilot
**Phase**: Phase 0
**Primary Module**: Portal / Identity / Audit
**Work Type**: governance
**Track**: product-system

---

## 🎯 目標

建立第一版 RBAC 矩陣與 approval matrix，先收斂四表直連的高風險主資料 / 規則治理邊界，補上核定角色與 maker-checker 定義，並把兩張規則表中的過渡核定值改成正式角色值。這輪重點是把角色責任落到權威文件與 CSV 契約，不是假裝全系統授權模型已完成。

---

## 📋 SPEC

### Goal

補齊四表直連高風險治理的 RBAC 與 approval 邊界，回收規則表過渡核定值。

### Business Context

- 屬於 Phase 0 的 RBAC 與責任分工基線
- 使用角色為主資料治理、Production、Inventory、Portal / Identity / Audit 與後續 schema / workflow 設計者
- 目前規則表已補核定欄位，但仍是 `暫行核定` 與待補角色字串，無法作為正式 approval contract

### Non-goals

- 不在本輪建立完整登入授權、API 保護或 row-level security
- 不在本輪擴張到全系統高風險操作，只先覆蓋四表及其直接相關 approval boundary

### Acceptance Criteria

1. 建立一份權威 RBAC / approval matrix，清楚定義角色集、可見性、maker-checker 與正式核定角色。
2. `doc/implementation_plan_index.md` 與 Idx-005 plan/log artifact 已建立，任務狀態可推進到 `QA`。
3. `單位換算規則表` 與 `生產_分裝_轉換扣帳規則表` 的 `核定狀態`、`核定人` 已由過渡值回收為正式值。
4. 對回日常營運 flows 規格，補齊 `生產 / 包裝 / 會計 / 主管` 四角色的現況操作矩陣與治理落差說明。

### Edge Cases

- 目前只有角色層級，沒有人員層級 -> 第一版 `核定人` 寫正式角色名，不寫個人姓名
- 系統管理負責權限設定 -> 但不得自我核准高風險業務資料變更，避免角色與業務核定混淆

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/modules/README.md`
- `doc/architecture/data/README.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/flows/unified_status_semantics.md`
- `doc/architecture/data/shared_key_contract.md`
- `doc/architecture/data/master_data_dictionary.md`

### Missing Inputs

- 全系統 RBAC matrix 與 approval matrix 尚未完成
- 人員層級指派與部門對應尚未建立

research_required: true

### Sources

- repo 內 authoritative docs 的角色與 approval boundary 原則
- 四表 CSV 已落地的生命周期 / 核定欄位

### Assumptions

- VERIFIED - 現有權威文件已明示角色集：門市營運、採購、倉管、生產、財務、系統管理，且允許稽核 / 營運分析只讀
- RISK: unverified - 角色內部是否還需細分主管 / 專員，在本輪未處理

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Portal / Identity / Audit
- Adjacent modules: Master Data、Production、Inventory、Order / Fulfillment
- Out of scope modules: 全系統登入 / API 授權、Finance / Reconciliation 全域 approval matrix

### File whitelist

- `doc/architecture/roles/README.md` - 建立第一版 RBAC / approval matrix
- `doc/architecture/README.md` - 掛上 roles 子目錄
- `doc/architecture/flows/README.md` - 掛上 RBAC / approval 文件
- `doc/architecture/flows/unified_status_semantics.md` - 對齊正式核定語意
- `doc/architecture/data/master_data_dictionary.md` - 明確 `核定人` 欄位語意
- `doc/architecture/data/shared_key_contract.md` - 對齊正式核定角色規則
- `doc/implementation_plan_index.md` - 更新 Idx-005 狀態
- `doc/plans/Idx-005_plan.md` - 建立正式 plan
- `doc/logs/Idx-005_log.md` - 建立正式 log
- `project_maintainers/data/active/rules/2026-03-25_單位換算規則表_template.csv` - 回收核定過渡值
- `project_maintainers/data/active/rules/2026-03-25_生產_分裝_轉換扣帳規則表_template.csv` - 回收核定過渡值

### Conditional impact blocks

#### MASTER DATA IMPACT

- 涉及外包裝材料主檔、內包裝完成品主檔、單位換算規則表、轉換扣帳規則表的維護與核定邊界
- 高風險規則的正式核定角色會成為共享契約一部分

#### STATE / WORKFLOW IMPACT

- 涉及 `核定狀態` 從 `暫行核定` 升級為 `正式核定`
- 定義四表直連高風險操作的 maker-checker 邊界，不延伸到完整 workflow state machine

#### RBAC IMPACT

- 補齊角色清單、可見性、操作權限、核准責任與 approval matrix
- 系統管理僅管理權限，不作高風險業務核准

#### SHARED KEY / CROSS-MODULE IMPACT

- 單位換算規則與轉換扣帳規則的正式核定角色，會影響 Production、Inventory 對數量語意的採用條件
- 內外包裝主檔的停用 / 大改 approval boundary，會影響 consumer 切換要求

#### FINANCE / RECONCILIATION IMPACT

- 本輪只保留財務查閱權與後續追溯前提，不建立 finance approval matrix 終版

#### OBSERVABILITY / AUDIT IMPACT

- `核定人` 由待補值回收為正式角色值，提升審計可追溯性
- Domain Review 與 Security Review 需求需記入 artifact

### Done 定義

1. 第一版 RBAC / approval matrix 已建立並掛上 architecture 入口。
2. Idx-005 index / plan / log artifact 已建立並對齊高風險審查需求。
3. 兩張規則表的核定過渡值已改為正式角色值。

### Rollback 策略

- Level: L2
- 前置條件: 仍屬文件與 CSV 契約治理，尚未有系統程式碼依賴這份 RBAC 文件執行授權
- 回滾動作: 回退 roles 文件、index / artifact 與兩張規則表核定值；若已被下游引用，需同步回滾引用文件

### Max rounds

- 估計: 1
- 超過處理: 若角色需細分到主管 / 專員或擴張到全系統高風險流程，拆成下一輪 Idx-005 子任務

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-005-rbac-approval-v1
  goal: 建立四表直連高風險操作的 RBAC / approval matrix，並回收規則表過渡核定值
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - touched-file-lint
    - targeted-unit-tests
  file_scope:
    - doc/architecture/roles/README.md
    - doc/architecture/README.md
    - doc/architecture/flows/README.md
    - doc/architecture/flows/unified_status_semantics.md
    - doc/architecture/data/master_data_dictionary.md
    - doc/architecture/data/shared_key_contract.md
    - doc/implementation_plan_index.md
    - doc/plans/Idx-005_plan.md
    - doc/logs/Idx-005_log.md
    - project_maintainers/data/active/rules/2026-03-25_單位換算規則表_template.csv
    - project_maintainers/data/active/rules/2026-03-25_生產_分裝_轉換扣帳規則表_template.csv
  done_criteria:
    - RBAC / approval matrix 已建立
    - 規則表核定值已回收為正式角色值
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
| `doc/architecture/roles/README.md` | 新增 | 建立 RBAC / approval matrix |
| `doc/architecture/README.md` | 修改 | 掛上 roles 子目錄 |
| `doc/architecture/flows/README.md` | 修改 | 掛上 RBAC / approval 文件 |
| `doc/architecture/flows/unified_status_semantics.md` | 修改 | 對齊正式核定語意 |
| `doc/architecture/data/master_data_dictionary.md` | 修改 | 收斂 `核定人` 欄位語意 |
| `doc/architecture/data/shared_key_contract.md` | 修改 | 收斂正式核定角色規則 |
| `doc/implementation_plan_index.md` | 修改 | 將 Idx-005 推進到 QA |
| `doc/plans/Idx-005_plan.md` | 新增 | 正式 plan artifact |
| `doc/logs/Idx-005_log.md` | 新增 | 正式 log artifact |
| `project_maintainers/data/active/rules/2026-03-25_單位換算規則表_template.csv` | 修改 | 回收核定過渡值 |
| `project_maintainers/data/active/rules/2026-03-25_生產_分裝_轉換扣帳規則表_template.csv` | 修改 | 回收核定過渡值 |

## 2026-04-01 範圍補充

- 本任務已補入日常營運現況的四角色操作矩陣，用於承接：
  - 匯入訂單
  - 手動改排程
  - 先扣食材 / BOM 扣帳
  - 回沖重算
  - 接受負庫存
  - 月底 / 週盤點差異調整
  - 下班前回填（目前只由包裝執行）
- 文件已同時標註：現況 SOP 不等於終版 maker-checker 治理完成狀態。

## 實作指引

### 1. 模組與資料層

- 角色邊界必須落到權威文件，不可只寫在聊天紀錄。
- 規則表的 `核定人` 先記角色名；若未來需要人員層級，再透過審計事件補足。

### 2. 流程與權限

- maker 與 checker 不得由同一角色承接。
- 系統管理不可自我核准高風險業務資料變更。

### 3. 介面與驗證

- 本輪以文件一致性與 CSV 欄位值驗證為主。
- 不涉及 API / UI / auth middleware 實作。

## 注意事項

- 風險提示: 若角色集後續需要細分，第一版矩陣仍可能調整
- 資安考量: RBAC / approval 屬高風險面，需標示 Domain Review 與 Security Review 需求
- 相依性: 依賴 modules、flows、data 權威文件與四表既有欄位
- 缺漏前提: 全系統授權模型、人員層級指派與全域 approval matrix 仍缺

## 相關資源

- `project_rules.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/flows/unified_status_semantics.md`
- `doc/architecture/data/shared_key_contract.md`

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: 2026-03-26 18:47:25
plan_approved: 2026-03-26 18:47:25
scope_policy: strict
expert_required: true
expert_conclusion: 需建立正式 RBAC / approval matrix，才能把規則表過渡核定值回收為正式值
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: path-rule
security_review_trigger_matches:
  - RBAC
  - approval boundary
  - permission
security_review_start: 2026-03-26 20:56:21
security_review_end: 2026-03-26 20:56:21
security_review_result: PASS_WITH_RISK
security_review_conclusion: 無阻斷性 findings；已補強系統管理不得任高風險核定、maker-checker 綁定、核定人驗證規則與過渡期退場條件，仍保留全系統 RBAC 與人員層級指派待補風險
execution_backend_policy: pty-primary-with-consented-fallback
scope_exceptions: []

# Engineer 執行
executor_tool: copilot-cli
executor_backend: ivyhouse_terminal_fallback
monitor_backend: manual_confirmation
executor_tool_version: GPT-5.4
executor_user: GitHub Copilot
executor_start: 2026-03-26 18:47:25
executor_end: 2026-03-26 18:50:17
session_id: N/A
last_change_tool: copilot-cli

# QA 執行
qa_tool: Explore
qa_tool_version: N/A
qa_user: Explore subagent
qa_start: 2026-03-26 20:56:21
qa_end: 2026-03-26 20:56:21
qa_result: PASS_WITH_RISK
qa_compliance: ✅ 符合

# 收尾
log_file_path: doc/logs/Idx-005_log.md
<!-- EXECUTION_BLOCK_END -->