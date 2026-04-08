# 技術基線與專案 Bootstrap 第一版

更新日期：2026-04-08

Authoritative source：是

## 目的

本文件正式收斂 Ivyhouse OP System 在 Phase 0 / Phase 1 可採用的技術基線與專案 bootstrap 策略，讓後續 plan / log、deploy runbook、migration path 與 runtime work unit 不必再分散引用多份草案或聊天摘要。

這份文件的目標不是宣稱完整產品應用已全部建好，而是定義：

- 目前正式採納的技術棧
- 現有 repo 已落地的 bootstrap 骨架
- 仍屬 deferred 的 runtime / frontend / observability 缺口
- 後續 work unit 不得違反的技術與環境邊界

## 採納結論

### 1. 正式技術棧

- Backend：TypeScript + NestJS
- Frontend / Client：Next.js + React + TypeScript
- Database engine：PostgreSQL
- Database provider baseline：Supabase PostgreSQL（中短期 3-5 年正式首選）
- ORM / migration：Prisma + Prisma Migrate
- Deployment / edge / release path：GitHub + GitHub Actions、Cloud Run、Cloudflare；開發環境以 Docker Compose 為主
- Observability：結構化 JSON logging、request id / job id、audit log、OpenTelemetry traces、Sentry 與 Prometheus / Grafana 或等價託管服務

正式 deploy 方向收斂為 GitHub + Cloud Run + Cloudflare + Supabase PostgreSQL。Cloud SQL 保留為未來在明確條件成立時的重評選項，不是現階段 baseline；營運模式與 provider 重評條件以 [營運模式與正式資料庫 Provider 基線](./operating_mode_and_database_provider_baseline.md) 為準。

以上技術基線以 `project_rules.md` 為最高優先權威來源；本文件負責把 repo 現況與 bootstrap 邊界收斂成可執行基線。

### 2. 目前 repo 已落地的 bootstrap 骨架

- monorepo workspace 已建立，根 `package.json` 以 `apps/*` 管理工作區。
- `apps/api` 已存在 NestJS + Prisma API 骨架，且具備：
  - TypeScript build script
  - `start` / `start:dev`
  - `prisma generate`、`prisma migrate deploy`、`prisma seed`
  - parser / mapping / daily-ops / inventory smoke 與 regression 驗證腳本
- `apps/api/prisma/**` 已形成正式 schema 與 migration 路徑，可被 Phase 1 runtime work units 直接引用。
- dev container 與 workspace 已足以支撐後端優先的 implementation、migration replay 與 focused smoke 驗證。

### 3. 尚未完成但已明確 deferred 的缺口

- `apps/web` 或等價 Next.js 前端應用骨架尚未建立。
- Docker Compose、container image、Cloud Run deploy manifest 尚未作為 repo-native artifact 正式落地。
- OpenTelemetry、Sentry、Prometheus / Grafana 仍停留在技術基線決策，尚未完成 runtime wiring。
- 前後端共用 DTO / contract、frontend route skeleton、auth UI / portal shell 尚未建立。

上述缺口必須誠實保留為 deferred，不得把 `Idx-007` 誤寫成「完整前後端 app bootstrap 已完成」。

## Bootstrap 邊界

### Workspace / package 邊界

- 根 workspace 目前只正式承接 `apps/api`。
- 後續若新增 `apps/web`、共享 package 或 infra package，必須維持 monorepo 結構，不得另建平行 repo-native app 樹。
- 不得繞過 workspace script 直接建立無治理的獨立 Node 專案作為長期主線。

### Database / migration 邊界

- Prisma schema 與 migration 是正式 schema path。
- release path 一律以 `prisma migrate deploy` 為準，不得以 `db push` 取代正式部署路徑。
- seed、bootstrap、opening balance 與 deploy preflight，必須沿用已建立的 migration governance 與 runbook 文件。

### Runtime / verification 邊界

- 在 frontend 尚未建立前，Phase 1 的可執行驗證以 API build、fixture、smoke、regression 為主。
- 新增 runtime work unit 時，若只需要後端與資料路徑，不得以「前端尚未存在」作為阻擋理由。
- 但若 work unit 明確要求內部後台 UI、帳號入口或 operator workflow screen，必須先建立對應 frontend skeleton 或拆成前置 task。

## Local Development 基線

- 開發主路徑以 dev container + Node workspace + `apps/api` script 為準。
- 本機開發至少應能完成：
  - `npm run build --workspace @ivyhouse/api`
  - Prisma client generate
  - 受控 migration deploy / seed
  - fixture / smoke 測試
- 若驗證需要隔離資料庫，可使用 workspace-local PostgreSQL 測試叢集；但此能力不等於正式部署環境已就緒。

## 對後續 work unit 的約束

### 對 `Idx-011` ~ `Idx-020`

- 這些已完成的 Phase 1 work units 可直接引用本文件，說明其 runtime 建立於「後端優先、Prisma migration 正式路徑已成立、前端 deferred」的技術基線上。

### 對未來 frontend work units

- 若要建立 operator portal 或內部後台畫面，正式 frontend skeleton 應使用 Next.js + React + TypeScript，不得另起其他框架。
- frontend work unit 應補：route skeleton、shared contract boundary、auth/session 承接方式與 deployment 策略。

### 對 observability / deployment work units

- 若要進一步落地 OTel、Sentry、Prometheus / Grafana、Docker Compose 或 Cloud Run manifest，應拆成獨立 work unit，不回頭把本文件改寫成「已完成實作」。

## Idx-007 第一版完成與未完成邊界

本文件定義 `Idx-007` 第一版的真實完成邊界應為：

- 技術棧、環境、migration / seed / bootstrap 路徑的正式基線已收斂。
- repo 現況已落地與未落地的骨架差異已被明文化。
- 後續 work unit 不再需要自行猜測是否允許另起技術棧或平行 bootstrap 路徑。

本文件不等於：

- 完整前端骨架已建立
- 完整部署 artifact 已建立
- observability runtime wiring 已完成

## 關聯文件

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/project_overview.md`
- `doc/architecture/phase1_mvp_scope.md`
- `doc/architecture/phase1_mvp_three_phase_execution_plan.md`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/architecture/flows/migration_governance_and_deployment_replay.md`