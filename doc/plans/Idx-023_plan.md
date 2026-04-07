# Plan: Idx-023 — Go-Live Blocker 收斂：前端骨架、CI/CD、環境治理、主資料完整化與正式環境 Preflight

**Index**: Idx-023
**Created**: 2026-04-04
**Planner**: Copilot
**Phase**: Phase 1 → Go-Live
**Primary Module**: Portal / Infra / Master Data
**Work Type**: implementation

---

## 🎯 目標

收斂 Phase 1 MVP go-live 前的所有 blocker 級缺口。目前後端 API、schema、治理文件與測試已全數到位（Idx-001 到 Idx-022 全部 Completed），但以下六項為 go-live 充要條件中仍缺失的 blocker：

1. 前端 Portal UI 基礎版
2. CI/CD Pipeline
3. 環境變數與密鑰治理
4. 主資料完整化（原料、配方、門市/倉庫）
5. 正式環境 migration preflight
6. Production-planning approval persistence 完化

本 plan 的成功標準是：上述六項全部就緒，Idx-018 operating envelope 的限制可被解除或受控收窄。

---

## 📋 SPEC

### Goal

將 Phase 1 MVP 從「後端 API ready + PASS_WITH_RISK sign-off」推進到「可交付、可部署、可操作」。

### Business Context

- 營運團隊（包裝、出貨、會計、主管）需要 UI 才能執行日常作業
- 部署需要 CI/CD 與環境隔離才能可靠重現
- 原料 / 配方主資料仍在 draft，需升格才能成為 runtime 正式輸入
- 正式環境 migration 差異需在 go-live 前驗證

### Non-goals

- Phase 2 功能（平台 API 直連、採購完整流程、財務 runtime、儀表板）
- 多倉 / 多窗口 opening balance 擴張（Idx-025 scope）
- 效能與負載測試（Tier 3）

### Acceptance Criteria

1. **前端 Portal UI**：Next.js 應用骨架已建立，至少包含登入/會話、intake 批次上傳與覆核、日常營運基本表單（扣庫存、排程、盤點）
2. **CI/CD**：GitHub Actions（或等價）test + build + deploy gate 已建立並可自動觸發
3. **環境治理**：`.env.example` 已定義、Secret Manager 策略已文件化、開發/測試/正式環境隔離定義已落地
4. **主資料完整化**：原料主檔從 draft 升格 active、配方版本 / BOM 明細從 draft 升格 active、門市 / 倉庫最低版本主檔已建立
5. **正式環境 preflight**：migration replay 在正式環境叢集完成、extension / hotfix 差異已盤點、故障復原預案已驗證
6. **Production-planning approval**：完整 approval state machine、maker-checker 歷史追溯、admin approver 角色邊界定版

### Edge Cases

- 前端與後端 API 契約不一致 -> 以 `doc/architecture/flows/channel_intake_api_contract.md` 為 authority，前端對齊
- 正式環境有手動 hotfix migration -> preflight 時比對 `_prisma_migrations` 表，差異需手動 reconcile 後才能繼續
- 原料主檔資料不齊 -> 先以最低版本欄位升格，缺漏欄位標記 `待補`，不阻斷 go-live

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/data/README.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/decisions/technical_baseline_and_project_bootstrap.md`
- `doc/architecture/phase1_mvp_scope_draft.md`
- `doc/logs/Idx-018_log.md`（sign-off operating envelope）
- `doc/logs/Idx-022_log.md`（approval persistence 殘餘）

### Missing Inputs

- 正式環境 PostgreSQL 連線資訊與 extension 清單（需 DevOps 提供）
- Secret Manager 選型決策（需與基礎設施 owner 確認）
- 原料主檔最終欄位值（需 owner 填寫後才能升格）
- 門市 / 倉庫最低版本定義（需營運確認）

research_required: true

### Sources

- Idx-018 sign-off operating envelope
- Idx-022 residual risk closure addendum
- `doc/architecture/decisions/technical_baseline_and_project_bootstrap.md`

### Assumptions

- VERIFIED - 後端 API 已具備前端所需的所有端點（intake、daily-ops、inventory-count、production-planning）
- VERIFIED - Prisma migrate deploy 路徑已在本機 / 測試叢集驗證
- RISK: unverified - 正式環境 PostgreSQL 版本與 extension 與本機一致

---

## 🧩 SUB-TASKS

| # | 子任務 | 優先順序 | 阻斷關係 | 預估工期 |
|---|--------|---------|---------|---------|
| 1 | 前端 Next.js 骨架與登入/會話 | P0 | 關鍵路徑 | 2-3 weeks |
| 2 | Intake UI（上傳、映射覆核、批次確認） | P0 | 依賴 #1 | 2-3 weeks |
| 3 | 日常營運 UI（扣庫存、排程、工單、盤點） | P0 | 依賴 #1 | 3-4 weeks |
| 4 | CI/CD Pipeline 建立 | P0 | 可與 #1 並行 | 3-5 days |
| 5 | 環境變數與密鑰治理 | P0 | 可與 #4 並行 | 2-3 days |
| 6 | 主資料完整化（原料、配方、門市/倉庫升格） | P0 | 依賴 owner 資料 | 2-3 days |
| 7 | 正式環境 migration preflight | P0 | 依賴 #5 + 正式環境可達 | 2-3 days |
| 8 | Production-planning approval persistence 完化 | P0 | 可獨立推進 | 3-5 days |

---

## ⚠️ 風險

| 風險 | 嚴重性 | 緩解方式 |
|------|--------|---------|
| 前端工期為關鍵路徑，決定 go-live 日期 | 高 | 先做最小可用版本，非核心畫面延後 |
| 正式環境連線資訊未就緒 | 高 | 提前向 DevOps 發出需求，不等到最後 |
| 原料主檔欄位值仍缺 | 中 | 以最低版本先升格，缺漏標記待補 |

---

## 🔒 審查需求

- Security Review：環境變數治理、Secret Manager 策略、前端 auth flow
- Domain Review：主資料升格欄位正確性、approval persistence 邊界
