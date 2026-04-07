# Plan: Idx-020

**Index**: Idx-020
**Created**: 2026-04-02
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: Daily Ops / Inventory / Operations Governance
**Work Type**: implementation

---

## 目標

把 `Idx-012` 已建立的 opening balance 與首盤窗口控制，進一步補成可治理的多窗口 / 中斷補救 / 取消邊界，避免首盤被實際營運流量打斷後失去一致性與可追溯性。

---

## SPEC

### Goal

建立 opening balance 的進階治理基線，至少涵蓋：

1. 同倉 / 多窗口首盤規則
2. 首盤中斷、取消與重新開窗的補救策略
3. 實際營運流量插入首盤期間時的責任分工與停等點

### Business Context

- `Idx-012` 已完成 opening balance runbook、首盤 rehearsal 與同 `countScope` 窗口鎖定。
- reviewer 已明確指出殘餘風險仍在多窗口、跨倉、中斷補救與取消 / 恢復策略。
- 若這些規則不先寫清楚，首盤一旦被營運事件打斷，庫存台帳與後續常態盤點就可能失真。

### Non-goals

- 不在本輪完成完整盤點前台 UI。
- 不在本輪處理 finance closing、成本結轉或歷史 inventory import。
- 不在本輪把所有例外都改成自動化工作流。

### Acceptance Criteria

1. opening balance 多窗口 / 跨倉規則已正式文件化。
2. 首盤中斷、取消、恢復與部分完成至少有明確狀態語意與 SOP。
3. 若首盤期間有實際營運流量，已定義禁止規則、停等點與重開責任。
4. 需要新增 API / schema / state 時，已先在 plan 中標示風險、驗證與回滾條件。

### Edge Cases

- 同一倉不同 bucket 是否可平行首盤，需避免與既有 `countScope` 鎖定規則衝突。
- 首盤做到一半若發現主資料或單位換算錯誤，需定義是取消重來還是補正後續台帳。
- 目前 Phase 1 僅有單一倉別，因此跨倉規則先記錄為 not-applicable，而非假裝已支援。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`
- `doc/architecture/flows/inventory_count_api_contract.md`
- `doc/plans/Idx-012_plan.md`
- `doc/logs/Idx-012_log.md`
- `doc/plans/Idx-017_plan.md`
- `doc/logs/Idx-017_log.md`
- `apps/api/src/daily-ops/inventory-count/**`
- `apps/api/test/**`

### Missing Inputs

- 無；本輪已由使用者確認單倉、cancel-only、禁止 live ops 與取消後必須重開窗口的營運政策。

research_required: true

### Assumptions

- VERIFIED - `Idx-012` 已完成首盤 rehearsal 與同 `countScope` 鎖窗，但尚未覆蓋多窗口與中斷補救。
- VERIFIED - `Idx-017` runbook 需要一套可交付的首盤恢復與停等規則，否則無法支撐正式上線演練。
- VERIFIED - Phase 1 目前只有單一倉別；多倉同步首盤暫不納入本輪治理範圍。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Daily Ops / Inventory / Operations Governance
- Adjacent modules: Release / Runbook、RBAC、Audit
- Out of scope modules: Finance、採購、完整前端工作台

### File whitelist

- `apps/api/src/daily-ops/inventory-count/**`
- `apps/api/test/**`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`
- `doc/architecture/flows/inventory_count_api_contract.md`
- `doc/plans/Idx-020_plan.md`
- `doc/logs/Idx-020_log.md`

### Done 定義

1. opening balance 的單倉單窗口 / 中斷補救治理已可被正式說明。
2. 首盤取消與重新開窗停等點已對齊 runbook。
3. 若需後續 API / schema 變更，已先在 plan 中明寫邊界與風險。

### Rollback 策略

- Level: L2
- 前置條件: 若新增治理規則與既有 opening balance 契約衝突，先回退新治理結論，保留已驗證的首盤主線。
- 回滾動作: 標記新治理規格為 draft / blocked，回退不一致的例外規則與 SOP 結論。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-020-opening-balance-multi-window-recovery
  goal: 建立 opening balance 的多窗口、中斷補救、取消與重新開窗治理基線
  retry_budget: 4
  allowed_checks:
    - fixture-rehearsal
    - runbook-readback
    - policy-validation
  file_scope:
    - apps/api/src/daily-ops/inventory-count/**
    - apps/api/test/**
    - doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md
    - doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md
    - doc/architecture/flows/inventory_count_api_contract.md
    - doc/plans/Idx-020_plan.md
    - doc/logs/Idx-020_log.md
  done_criteria:
    - 多窗口 / 中斷補救規則已文件化
    - cancel-only 邊界與重新開窗流程已明確
    - 與首盤 runbook 與窗口鎖定規則一致
    - no file changes outside file_scope
  escalation_conditions:
    - 需新增不可逆資料回填或 schema migration
    - 多倉營運切窗無法在現有 state model 下表達
    - retry budget exhausted
```

---

## 注意事項

- 本任務命中 inventory、opening balance、runbook 高風險面，正式執行必須補 Domain Review、Security Review 與 Evidence gate。
- 不得把首盤中斷補救交由現場口頭判斷，必須落成 SOP 與權責邊界。
- 若未來需要 maker-checker 參與首盤恢復，需與正式 auth / approval 工作單同步對齊。

## 2026-04-02 Artifact 啟動結論

### 本輪確認結果

- 本輪只建立 `Idx-020` plan/log artifact，不直接進入 inventory-count 程式實作。
- `Idx-020` 直接承接 `Idx-012` 的 PASS_WITH_RISK 殘餘風險與 `Idx-017` runbook 的上線前治理需求。

### 下一步預計切口

1. 先定義單倉單窗口與不同 `countScope` 不可平行的治理規則。
2. 再補 cancel API / schema 與 focused validation。
3. 最後把 runbook、政策文件與 API contract 收口。

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: 2026-04-02 00:00:00
plan_approved: 2026-04-02 00:00:00
scope_policy: strict
expert_required: true
expert_conclusion: opening balance 主線雖已成立，但若缺少多窗口與中斷補救治理，仍不足以上線
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: domain-rule
security_review_trigger_matches:
  - inventory
  - opening balance
  - runbook
security_review_start: 2026-04-03 16:10:00
security_review_end: 2026-04-03 16:10:00
security_review_result: PASS_WITH_RISK
security_review_conclusion: cancel-only opening balance recovery 已落正式 API 與 audit，不允許 cancelled session 污染 ledger；多倉治理因目前單倉 not-applicable 保留為後續擴張議題
execution_backend_policy: pty-primary-with-consented-fallback
scope_exceptions: []

# Engineer 執行
executor_tool: copilot-cli
executor_backend: pty-primary
monitor_backend: manual_confirmation
executor_tool_version: GPT-5.4
executor_user: GitHub Copilot
executor_start: 2026-04-03 15:55:00
executor_end: 2026-04-03 16:20:00
session_id: 01ed7b0f-14c3-4668-9363-2143b6da0901
last_change_tool: copilot-cli

# QA 執行
qa_tool: Explore
qa_tool_version: GPT-5.4
qa_user: Explore
qa_start: 2026-04-03 16:10:00
qa_end: 2026-04-03 16:10:00
qa_result: PASS_WITH_RISK
qa_compliance: qa_tool != last_change_tool satisfied

# 收尾
log_file_path: doc/logs/Idx-020_log.md
<!-- EXECUTION_BLOCK_END -->