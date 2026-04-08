# Plan: Idx-025 — 漸進補強：測試深化、Observability、Opening Balance 擴張與效能基準

**Index**: Idx-025
**Created**: 2026-04-04
**Planner**: Copilot
**Phase**: Phase 2
**Primary Module**: 跨模組
**Work Type**: implementation / governance
**Track**: product-system

---

## 🎯 目標

在 go-live 穩定後漸進補強系統品質、可觀測性與功能邊界。這些項目不影響 go-live，也不影響上線後基本營運；但長期缺失會影響系統可維護性、問題診斷效率與功能擴張能力。

---

## 📋 SPEC

### Goal

將 Phase 1 MVP 從「可用」推進到「可持續維護與擴張」。

### Business Context

- 後端單元測試覆蓋率不足，service/repository layer 缺乏隔離測試
- Logging & Observability 有技術基線定義但 runtime 實裝未驗證
- Opening balance 目前限制同倉同窗口，多倉擴張為已知 deferred（Idx-020）
- 效能與負載基準不存在，無法評估系統容量上限

### Non-goals

- Phase 2 新業務功能（平台 API 直連、採購完整流程、財務 runtime）
- 前端重大功能擴張
- 第三方整合（Webhook、排程、外部 API）

### Acceptance Criteria

1. **後端單元測試補強**：service layer（inventory-count、production-planning、deduction logic）有獨立單元測試；repository layer 有 mock-based 測試
2. **Logging & Observability**：JSON structured logging 已驗證、request ID propagation 已驗證、正式環境 log 目的地已確認、monitoring dashboard 建立步驟已文件化
3. **Opening balance 多窗口治理**：多倉協調規則、中斷恢復（resume/rewind）狀態機、reconciliation 邏輯（承接 Idx-020 deferred）
4. **效能基準**：批次匯入 SLA（10,000 行彙總目標）、庫存查詢延遲目標、並發用戶數基準
5. **前端品質**：前端無障礙基線、主流瀏覽器相容性驗證

### Edge Cases

- Observability 工具選型與正式環境不同 -> 先驗證結構化日誌格式，目的地對接延後
- 多倉 opening balance 的 reconciliation 與單倉邏輯衝突 -> 需新的 state machine，不能直接擴張現有 cancel-only recovery

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `doc/logs/Idx-020_log.md`（opening balance 多窗口 deferred scope）
- `doc/architecture/decisions/technical_baseline_and_project_bootstrap.md`（Observability 基線）
- Idx-023 產出的 CI/CD 與環境治理成果
- 正式環境 monitoring stack 選型結果

### Missing Inputs

- 效能目標 SLA（需與營運確認可接受的匯入/查詢延遲）
- 多倉 opening balance 的營運主線場景描述（需現場確認）
- Observability 工具最終選型（Prometheus / Grafana / Sentry 或等價）

research_required: true

### Sources

- Idx-020 opening balance cancel-only recovery & deferred scope
- `doc/architecture/decisions/technical_baseline_and_project_bootstrap.md`

### Assumptions

- VERIFIED - 目前 mainline E2E 與 regression suite 涵蓋 happy path + 主要 failure path
- RISK: unverified - 正式環境 monitoring stack 選型尚未決定
- RISK: unverified - 多倉 opening balance 的實際營運場景可能比目前定義更複雜

---

## 🧩 SUB-TASKS

| # | 子任務 | 優先順序 | 阻斷關係 | 預估工期 |
|---|--------|---------|---------|---------|
| 1 | 後端單元測試補強（service / repository layer） | P2 | 獨立 | 3-5 days |
| 2 | Logging & Observability 實裝驗證與部署 | P2 | 依賴正式環境 monitoring 選型 | 3-5 days |
| 3 | Opening balance 多窗口 / 多倉治理與設計（承接 Idx-020） | P2 | 依賴多倉場景確認 | 5-7 days |
| 4 | 效能與負載基準建立 | P3 | 依賴正式環境可達 | 5-7 days |
| 5 | 前端無障礙基線與瀏覽器相容性 | P3 | 依賴前端 UI 穩定 | 3-5 days |

---

## ⚠️ 風險

| 風險 | 嚴重性 | 緩解方式 |
|------|--------|---------|
| 多倉 opening balance 設計複雜度可能超過預期 | 中 | 先完成單倉 resume 能力，再擴張多倉 |
| Observability 工具選型延遲 | 低 | 先驗證結構化日誌格式，工具對接可後補 |
| 效能基準缺乏明確 SLA 目標 | 低 | 先建立可量測的基線數據，再與營運協商目標 |

---

## 🔒 審查需求

- Security Review：Observability 日誌不可含敏感資料（個資、密鑰、session token）
- Domain Review：多倉 opening balance 的營運規則對齊

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
scope_exception_note: [accepted exception - 此 execution block 為歷史主 plan 的最小補位，只補 Track 留痕以承接 Idx-036，不擴寫其他新制欄位]
plan_created: [pending historical backfill]
scope_exceptions: []
<!-- EXECUTION_BLOCK_END -->
