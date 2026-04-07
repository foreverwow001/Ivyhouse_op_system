# Plan: Idx-015

**Index**: Idx-015
**Created**: 2026-04-02
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: Daily Ops / End-to-End Validation
**Work Type**: implementation

---

## 目標

打通 daily ops MVP 主線的端到端 smoke 與 evidence，讓系統可以從 demand batch 一路驗證到 inventory adjustment 與 audit 追溯，不再只停在局部模組可用。

---

## SPEC

### Goal

建立一套可重跑的 mainline E2E 驗證鏈，覆蓋 demand → deduction → plan → BOM → replenishment → count → adjustment → audit。

### Business Context

- intake mapping、特殊項治理、inventory-count 與 shared key 例外已各自有基線。
- 目前缺的是把這些基線串成 MVP 主線的整體證據。
- 若沒有 mainline E2E，go-live 前只能靠分段 smoke 與人工推理，風險過高。

### Non-goals

- 不在本輪建立完整 UI 自動化測試。
- 不在本輪擴張到 finance reconciliation 主線。
- 不在本輪承諾所有 failure path 一次補齊。

### Acceptance Criteria

1. 已有至少一條可重跑的 mainline E2E smoke，覆蓋 demand 到 audit 追溯鏈。
2. E2E evidence 可明確指出每個節點使用的 owner 規則、事件與輸出。
3. 若主線涉及 direct-pack 例外或 inventory-count 高風險操作，需與 `Idx-013`、`Idx-014` 產物一致。
4. E2E 驗收結果與已知缺口已回寫 log，不得只口頭宣稱通過。

### Edge Cases

- 各節點可能目前由不同 smoke / fixture 支撐，需決定是串接單一 scenario 還是建立 orchestration harness。
- 若某段尚無 persistence，需清楚標註 stub / in-memory 假設，不能偽裝完整上線鏈。
- audit evidence 若只存在 log 而非資料表，需明確記錄其暫行性質。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/phase1_mvp_three_phase_execution_plan.md`
- `doc/architecture/flows/daily_ops_engineering_breakdown.md`
- `doc/architecture/flows/inventory_count_api_contract.md`
- `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`
- `doc/architecture/flows/end_of_day_replenishment_spec.md`
- `apps/api/src/intake/**`
- `apps/api/src/daily-ops/**`
- `apps/api/src/inventory/**`
- `apps/api/test/**`

### Missing Inputs

- 單一主線 scenario 的正式 fixture 編排與驗收表尚未建立。
- 目前缺一份從 demand 到 audit 的 evidence matrix。

research_required: true

### Assumptions

- VERIFIED - `Idx-009`、`Idx-010`、inventory-count backend 與 smoke 已提供主線局部能力。
- VERIFIED - `Idx-011`、`Idx-012`、`Idx-013`、`Idx-014` 完成後，mainline E2E 才有穩定前提。
- RISK: unverified - daily ops 各段目前是否已能在單一測試 harness 中串起，仍待實作前確認。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Daily Ops / End-to-End Validation
- Adjacent modules: Intake、Inventory、Master Data、Audit
- Out of scope modules: Finance closing、前端操作流程自動化

### File whitelist

- `apps/api/src/intake/**`
- `apps/api/src/daily-ops/**`
- `apps/api/src/inventory/**`
- `apps/api/test/**`
- `doc/architecture/flows/daily_ops_engineering_breakdown.md`
- `doc/architecture/flows/inventory_count_api_contract.md`
- `doc/plans/Idx-015_plan.md`
- `doc/logs/Idx-015_log.md`

### Done 定義

1. mainline E2E smoke 已存在且可重跑。
2. evidence 可追溯每個節點的輸入、規則與輸出。
3. 本輪不把 failure-path matrix 一起膨脹到失控範圍。

### Rollback 策略

- Level: L2
- 前置條件: 若整合 smoke 導致原有局部 smoke 全面失效，需可回退到分段驗證狀態。
- 回滾動作: 回退 orchestration、fixture 與主線測試，保留既有分段 smoke。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-015-daily-ops-mainline-e2e-evidence
  goal: 建立 daily ops MVP 主線的端到端 smoke 與 evidence
  retry_budget: 5
  allowed_checks:
    - e2e-smoke
    - touched-slice-build
    - evidence-readback
  file_scope:
    - apps/api/src/intake/**
    - apps/api/src/daily-ops/**
    - apps/api/src/inventory/**
    - apps/api/test/**
    - doc/architecture/flows/daily_ops_engineering_breakdown.md
    - doc/architecture/flows/inventory_count_api_contract.md
    - doc/plans/Idx-015_plan.md
    - doc/logs/Idx-015_log.md
  done_criteria:
    - demand 到 audit 主線 smoke 可重跑
    - evidence matrix 已建立
    - 已知斷點與 stub 已誠實記錄
    - no file changes outside file_scope
  escalation_conditions:
    - 主線需跨未規格化模組才能繼續
    - authoritative contract 之間存在阻斷衝突
    - retry budget exhausted
```

---

## 注意事項

- 本任務涉及 inventory、shared key、audit 與高風險營運主線，正式執行必須有 Security Review、Domain Review 與 cross-QA。
- 不得以手動補洞或 Excel 平行追蹤偽裝 E2E 已完成。
- 若主線仍需 stub，必須明示 stub 所在與退出條件。

## 2026-04-02 正式執行排程

### 當前狀態

- 已建立正式 plan/log artifact。
- 直接依賴 `Idx-014`，目前尚未開始實作。
- 啟動條件：`Idx-014` 完成 runtime normalization，且 011~013 的盤點 / guard 路徑維持可重跑。

### 預定落地重點

1. 以 `DailyOpsService.createDemandBatch / confirmBatch`、`ProductionPlanningService.createPlan`、`ReplenishmentService`、inventory-count API 串成單一路徑。
2. 建立 mainline E2E smoke 與 evidence matrix。
3. 誠實標示仍需 stub / 仍未落地的節點。

### 預定驗證

- focused validation：單一 mainline E2E smoke。
- 文件 validation：evidence matrix readback 與節點對齊檢查。

## 2026-04-02 執行結果

- 已新增 `test/daily-ops-mainline-e2e-smoke.js`，以單一 scenario 串 demand、deduction、production plan、BOM、replenishment、inventory count、adjustment 與 audit。
- 主線 scenario 以 `N10120` 驗證 014 的 direct-pack BOM 正規化，並以 `PK0016` 驗證 replenishment / count / adjustment evidence。
- 已用 Prisma readback 驗證 audit action chain 與 inventory ledger event chain。
- focused validation：`npm run test:daily-ops:mainline` 回傳 `PASS`。

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: 2026-04-02 00:00:00
plan_approved: 2026-04-02 00:00:00
scope_policy: strict
expert_required: true
expert_conclusion: MVP 是否可交付，取決於 daily ops 主線能否形成可重跑 evidence，而不是單點功能是否可編譯
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: domain-rule
security_review_trigger_matches:
  - inventory
  - audit
  - shared key
security_review_start: 2026-04-02 00:00:00
security_review_end: 2026-04-02 00:00:00
security_review_result: PASS_WITH_RISK
security_review_conclusion: production-planning create / revise / rerun 端點的 RBAC guard 已於修正輪補上；剩餘風險改為 audit payload before/after 證據不足與正式 auth / maker-checker 未落地
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
qa_compliance: PASS - cross-QA reviewer 與 last_change_tool 不同，且修正輪後已完成 re-review 與驗證 rerun

# 收尾
log_file_path: doc/logs/Idx-015_log.md
<!-- EXECUTION_BLOCK_END -->