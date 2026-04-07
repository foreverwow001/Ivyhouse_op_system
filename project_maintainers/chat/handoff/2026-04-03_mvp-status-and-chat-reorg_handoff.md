# SESSION-HANDOFF — Phase 1 MVP 收斂完成、資料重整落地與 Go-Live 路線圖

> 建立日期：2026-04-03
> 最後更新：2026-04-04
> 涵蓋範圍：Phase 0 / Phase 1 全收口、chat 資料重整實際完成、repo guard 與治理文件落地、Go-Live 三層路線圖（Idx-023 / 024 / 025）
> 前序 handoff：`2026-03-31_ops-workflow-and-sku-alignment_handoff.md`

---

## Current goal

截至 2026-04-04，本輪跨越兩個 session 已完成以下工作：

### 已完成（04-03 session）

1. **Phase 0 / Phase 1 artifact 全面收口**：`Idx-001` ~ `Idx-022` 全部 Completed。
2. **技術與財務治理補齊**：`Idx-007` cross-QA 關帳；`Idx-008` 財務/對帳控制基線建立。

### 已完成（04-03 → 04-04 session）

3. **`project_maintainers/chat` 檔案重整實際執行**：
   - sample 遷移至 `apps/api/test/fixtures/intake-source-documents/`
   - active CSV → `project_maintainers/data/active/**`
   - drafts → `project_maintainers/data/drafts/**`
   - notes → `project_maintainers/data/notes/`
   - raw workbook → `project_maintainers/data/raw-workbooks/`
   - runtime / seed / test / doc 引用全部更新，18 份 sample + 8 active + 11 drafts + 3 notes 全部就位
4. **Repo guard 落地**：`tools/check-maintainer-path-references.js` 已建立，禁止舊路徑引用；已串接 `build:api` 與所有 `test:api:*` script
5. **治理文件正式化**：`doc/architecture/data/maintainer_data_surface_governance.md` 已建立，定義 chat / data / sample 的正式邊界
6. **Idx-013 / 014 / 015 / 016 log header 升格**：從 QA 修正為 Completed，對齊 index
7. **全套驗證通過**：
   - Parser fixtures: 18/18 PASS
   - Mapping fixtures: 18/18 PASS
   - Recipe-owner: 1/1 PASS
   - Inventory metrics: 3/3 PASS
   - API smoke / Mapping smoke / Inventory smoke / Daily-ops mainline / Daily-ops regression: 全部 EXIT 0
   - Prisma migrate deploy (4 migrations) + seed: PASS
   - Repo guard: PASS
8. **Go-Live 三層路線圖建立**：Idx-023 / 024 / 025 plan + log + index 已建立

---

## Current branch

- `main`（workspace 無 git repo，但所有檔案在 workspace filesystem）

---

## Active environment

- Dev Container / Debian GNU/Linux 12 (bookworm)
- monorepo workspace：根目錄 + `apps/api`
- Backend：TypeScript / NestJS / Prisma / PostgreSQL
- 測試叢集：workspace-local PostgreSQL @ port 55432（`/workspaces/Ivyhouse_op_system/.tmp-postgres-idx011`）
- 目前無 `apps/web`；frontend skeleton 仍屬 deferred（Idx-023 scope）
- 最近已驗證指令：全套測試（上方第 7 點）

---

## Files touched

### 本輪資料重整

- `apps/api/test/fixtures/intake-source-documents/` — 18 份 sample 遷入
- `apps/api/test/fixtures/intake-source-documents-path.js` — 新增 path helper
- `apps/api/src/master-data/maintainer-data-paths.ts` — 新增集中路徑映射
- `apps/api/src/master-data/master-data.service.ts` — 更新 resolveChatFile
- `apps/api/prisma/seed.ts` — 更新載體路徑
- `project_maintainers/data/**` — 新建完整資料載體結構
- 多份 `doc/architecture/**`、`doc/plans/**`、`doc/logs/**` — 路徑引用更新

### 本輪 guard 與治理

- `tools/check-maintainer-path-references.js` — repo guard 腳本
- `package.json` — guard 串接到 build / test
- `doc/architecture/data/maintainer_data_surface_governance.md` — 治理文件
- `doc/architecture/data/README.md` — 掛回治理文件連結
- `project_maintainers/data/README.md` — 掛回治理文件連結
- `doc/logs/Idx-013_log.md` / `Idx-014_log.md` / `Idx-015_log.md` / `Idx-016_log.md` — header 升格

### 本輪 Go-Live 路線圖

- `doc/plans/Idx-023_plan.md` + `doc/logs/Idx-023_log.md`
- `doc/plans/Idx-024_plan.md` + `doc/logs/Idx-024_log.md`
- `doc/plans/Idx-025_plan.md` + `doc/logs/Idx-025_log.md`
- `doc/implementation_plan_index.md` — 新增 Idx-023 / 024 / 025 並更新統計

---

## What has been confirmed

### 1. 任務狀態

- `Idx-001` ~ `Idx-022`：全部 Completed，plan / log artifact 齊全
- `Idx-023` / `Idx-024` / `Idx-025`：Planning，plan / log 已建立

### 2. 目前產品階段

- **Phase 0 治理基線**：已完成
- **Phase 1 MVP 主線治理與 runtime 驗證**：已完成，`Idx-018` 結論 `PASS_WITH_RISK`
- **資料重整**：已完成，`project_maintainers/chat/` 已收窄為 supporting memory，active data 已在 `project_maintainers/data/`
- **目前所在階段**：準備啟動 Idx-023（Go-Live Blocker 收斂）

### 3. 資料載體結構

```
project_maintainers/data/
├── active/master-data/    ← 8 份正式 CSV（runtime / seed 引用）
├── active/rules/          ← 換算、轉換、耗材規則
├── active/supplies/       ← 出貨及行政耗材
├── drafts/semifinished/   ← 半成品草案
├── drafts/materials-and-recipes/ ← 原料相關草案
├── notes/                 ← CSV 欄位說明
└── raw-workbooks/         ← Excel 原始底稿

apps/api/test/fixtures/intake-source-documents/
└── 18 份撿貨單 sample（pdf / xlsx / xls）
```

### 4. Repo Guard

- `guard:maintainer-paths`：硬性禁止 code / docs 引用舊的 `project_maintainers/chat/sample/` 與已搬遷 CSV 路徑
- 白名單：guard 腳本自身 + 治理文件（`maintainer_data_surface_governance.md`）
- 已串接到 `build:api` 與所有 `test:api:*` script

---

## Go-Live 路線圖

### Idx-023 — Tier 1 Blocker（Go-Live 前必須完成）

| # | 子任務 | 說明 |
|---|--------|------|
| 1 | **前端 Portal UI 基礎版** | Next.js 骨架、登入/會話、intake 批次上傳與覆核、日常營運基本表單（**關鍵路徑**） |
| 2 | **CI/CD Pipeline** | GitHub Actions test + build + deploy gate |
| 3 | **環境變數與密鑰治理** | `.env.example`、Secret Manager 策略、環境隔離 |
| 4 | **主資料完整化** | 原料 / 配方 / 門市 / 倉庫從 draft 升格 active |
| 5 | **正式環境 migration preflight** | migration replay、extension / hotfix 盤點、故障復原預案 |
| 6 | **Production-planning approval 完化** | 完整 approval state machine、maker-checker 歷史追溯 |

### Idx-024 — Tier 2 High Risk（Go-Live 後 2 週內）

| # | 子任務 | 說明 |
|---|--------|------|
| 1 | E2E 邊界場景補強 | cancel recovery、approval workflow、權限拒絕、ledger 一致性 |
| 2 | 正式環境運維預案 | backup / restore / health check / on-call playbook |
| 3 | 用戶操作手冊 | 中文版 intake / 日常營運 / 排故 SOP |

### Idx-025 — Tier 3 Progressive（漸進補強）

| # | 子任務 | 說明 |
|---|--------|------|
| 1 | 後端單元測試補強 | service / repository layer |
| 2 | Logging & Observability | JSON logging、request ID、monitoring dashboard |
| 3 | Opening balance 多窗口/多倉 | 承接 Idx-020 deferred |
| 4 | 效能與負載基準 | 批次匯入 SLA、並發用戶數 |
| 5 | 前端品質 | 無障礙、瀏覽器相容性 |

---

## What was rejected

- **不再重開 `Idx-001` ~ `Idx-022`**：全部 Completed，新能力走新 Idx
- **不把 active CSV 放回 `project_maintainers/chat/`**：repo guard 會阻止
- **不把 finance runtime 偷渡進 Phase 1 MVP**：`Idx-008` 是基線不是實作
- **不在沒有前端的情況下宣稱可交付**：前端是 go-live 的充要條件

---

## Next exact prompt

下一位接手者應：

1. **啟動 Idx-023**：優先推進前端 Portal UI 骨架（關鍵路徑），並行推進 CI/CD 與環境治理
2. 主資料升格需要與 owner 確認原料最終欄位值、門市/倉庫定義
3. 正式環境 migration preflight 需要 DevOps 提供連線資訊
4. 不需要回頭處理 Idx-001 ~ Idx-022 的任何舊 work unit

建議的具體起步：

```
1. cd /workspaces/Ivyhouse_op_system
2. 建立 apps/web（Next.js skeleton）
3. 建立 .github/workflows/ci.yml
4. 建立 .env.example
5. 以 Idx-023 plan 為 authority，逐項推進
```

---

## Risks

- **前端工期為關鍵路徑**：決定 go-live 日期
- **正式環境連線資訊未就緒**：需提前向 DevOps 發出需求
- **原料主檔欄位值仍缺**：需 owner 填寫後才能升格
- **門市/倉庫主檔不存在**：需營運確認最低版本定義
- **無 git repo**：workspace 僅有 filesystem，CI/CD 建立時需先 git init

---

## Verification status

- 已驗證（2026-04-04）：
  - `Idx-001` ~ `Idx-022` 全部 Completed，plan / log artifact 齊全
  - 全套測試通過（parser / mapping / recipe / inventory / daily-ops / smoke / seed / migrate / guard）
  - 資料重整後所有引用完整、runtime 正常
  - Idx-023 / 024 / 025 plan + log + index 已建立
- 尚未驗證：
  - 正式環境 migration preflight
  - 前端 Portal UI
  - CI/CD Pipeline
  - 主資料升格
  - Finance runtime