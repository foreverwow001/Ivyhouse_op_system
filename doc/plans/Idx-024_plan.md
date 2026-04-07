# Plan: Idx-024 — Go-Live 後高風險補強：E2E 場景擴充、運維預案與用戶操作手冊

**Index**: Idx-024
**Created**: 2026-04-04
**Planner**: Copilot
**Phase**: Phase 1 → Post-Launch
**Primary Module**: 跨模組
**Work Type**: implementation / governance

---

## 🎯 目標

在 go-live 後 2 週內完成高風險 gap 的補強，確保線上系統的可維護性、可觀測性與操作可靠性。這些項目不阻斷 go-live，但若延遲超過 2 週，會顯著增加線上事故的恢復成本與影響範圍。

---

## 📋 SPEC

### Goal

補齊 go-live 後第一時間需要的營運支撐能力。

### Business Context

- 上線後營運團隊需要操作手冊與排故指引
- E2E 邊界場景（cancel recovery、approval workflow、權限拒絕）未涵蓋，線上遇到時缺乏已驗證的處理路徑
- 正式環境缺乏 backup / restore / health check 自動化

### Non-goals

- 新業務功能（採購、財務、報表）
- 效能與負載測試（Tier 3）
- 前端無障礙與瀏覽器相容性（Tier 3）

### Acceptance Criteria

1. **E2E 場景補強**：cancel-after-opening-balance、production-planning approval/rejection 完整路徑、非授權角色嘗試高風險操作被拒絕、transaction rollback 與 ledger 一致性驗證
2. **正式環境運維預案**：backup / restore SOP 已驗證、health check endpoint 已建立並可自動觸發、on-call escalation path 已文件化
3. **用戶操作手冊**：中文版 intake 操作手冊、日常營運（扣庫存/排程/盤點）操作手冊、常見排故指引

### Edge Cases

- 正式環境 backup 工具與本機不同 -> SOP 需區分工具版本
- 某些邊界場景難以在正式環境重現 -> 以測試叢集為主要驗證環境

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `doc/logs/Idx-015_log.md`（mainline coverage baseline）
- `doc/logs/Idx-016_log.md`（regression coverage baseline）
- `doc/logs/Idx-017_log.md`（deploy runbook baseline）
- `doc/logs/Idx-020_log.md`（opening balance cancel recovery）
- `doc/logs/Idx-022_log.md`（approval persistence）
- 正式環境 infrastructure 規格（DB backup 工具、monitoring stack）

### Missing Inputs

- 正式環境 monitoring stack 選型（需 DevOps 確認）
- 營運團隊操作流程偏好（需與現場確認）

research_required: true

### Sources

- Idx-015 / Idx-016 test coverage 現狀
- Idx-017 deploy runbook

### Assumptions

- VERIFIED - mainline E2E smoke 與 regression suite 已涵蓋 happy path
- RISK: unverified - 正式環境 monitoring stack 與本機一致

---

## 🧩 SUB-TASKS

| # | 子任務 | 優先順序 | 阻斷關係 | 預估工期 |
|---|--------|---------|---------|---------|
| 1 | E2E 邊界場景補強（cancel recovery、approval、權限拒絕、ledger 一致性） | P1 | 獨立 | 5-7 days |
| 2 | 正式環境運維預案（backup/restore、health check、on-call playbook） | P1 | 依賴正式環境 infra 規格 | 3-5 days |
| 3 | 用戶操作手冊（中文版 intake / 日常營運 / 排故） | P1 | 依賴前端 UI 穩定後 | 3-5 days |

---

## ⚠️ 風險

| 風險 | 嚴重性 | 緩解方式 |
|------|--------|---------|
| 上線後 2 週內若發生邊界場景事故，缺乏已驗證的處理路徑 | 高 | 優先補 cancel recovery 與 approval 關鍵路徑 |
| 正式環境無 backup 驗證就上線 | 高 | 至少在 go-live 前做一次手動 backup/restore 演練 |
| 操作手冊寫完但 UI 仍在變動 | 中 | 先寫 API 操作手冊，UI 穩定後再補前端截圖 |

---

## 🔒 審查需求

- Domain Review：操作手冊與實際營運流程對齊
- Security Review：health check endpoint 不可洩漏敏感資訊
