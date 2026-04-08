# CI 與環境變數治理基線

更新日期：2026-04-07

Authoritative source：是

## 目的

這份文件收斂 `Idx-023` Slice 4 與 Slice 5 的最低正式交付：

- repo-native GitHub Actions quality gate
- release preflight gate
- API / Portal 環境變數契約
- 本地、CI、正式環境的 secret handling 邊界

本文件不是正式部署 runbook，也不宣稱 Cloud Run、託管 PostgreSQL、Secret Manager vendor 已完成最終接線；它的責任是先把「哪些值必須存在、哪些值不能進 repo、CI 最低要驗證什麼」定義清楚。

## 採納結論

### 1. GitHub Actions quality gate

repo 正式採用 `.github/workflows/ci.yml` 作為 Phase 1 的最低 quality gate，內容包含：

- `npm ci`
- `guard:maintainer-paths`
- `prisma:generate`
- `build:api`
- `build:portal`
- intake fixture tests
- intake API smoke
- daily ops mainline smoke

CI 使用 workflow 內建 PostgreSQL service container，避免把共享開發資料庫或正式連線資訊塞進 pull request quality gate。

### 2. Release preflight gate

`workflow_dispatch` 模式下，`release-preflight` 會先驗證 target environment 的必要 binding 是否存在，再執行 repo-native 的 read-only migration preflight，不直接執行 deploy。這個 gate 目前檢查：

- staging：`vars.DATABASE_URL`、`vars.NEXT_PUBLIC_PORTAL_API_BASE_URL`
- production：`secrets.DATABASE_URL`、`secrets.ADMIN_DATABASE_URL`、`vars.NEXT_PUBLIC_PORTAL_API_BASE_URL`

通過 binding 檢查後，workflow 會執行：

- `npm run prisma:generate`
- `npm run preflight:formal-env`
- 上傳 `migration-preflight-report.json` artifact

理由是目前正式 deploy artifact 與 Secret Manager vendor 尚未 final，但 go-live blocker 不能繼續停留在「完全沒有 gate」。先把 binding completeness gate 與 read-only migration preflight 建起來；對 staging 先以 managed provider 可行的 read-only preflight 為主，不再把 `ADMIN_DATABASE_URL` 當成硬性阻斷。正式 clone drill、admin-capable scratch DB 與 deploy 仍由 production 或後續受控步驟處理。

## 環境變數契約

### API

| 變數 | 必要性 | 用途 | 備註 |
|---|---|---|---|
| `DATABASE_URL` | Required | Prisma datasource、NestJS runtime、smoke tests | 不得提交真實值 |
| `ADMIN_DATABASE_URL` | Conditional | regression / database admin path | 本地可指向 `postgres` DB |
| `PORT` | Optional | API 監聽 port | smoke scripts 可覆寫 |

### Portal

| 變數 | 必要性 | 用途 | 備註 |
|---|---|---|---|
| `NEXT_PUBLIC_PORTAL_API_BASE_URL` | Required | Portal shell 與 workbench API base URL | 屬 public runtime config，不存放 secret |

## Secret Handling 邊界

### Local

- 使用 `.env`、`apps/api/.env`、`apps/portal/.env.local` 承接實值。
- repo 只保留 `.env.example` 與 app-level `.env.example`。
- `.gitignore` 必須忽略所有 `.env` 實值檔與 `.env.*.local`。

### CI

- build / smoke 預設使用 ephemeral PostgreSQL service container。
- PR quality gate 不依賴 production secrets。
- 只有 release preflight 會去檢查 target environment bindings 是否存在。

### Staging / Production

- 真實 DB credential 不得硬寫在 repo、workflow yaml、plan/log 或聊天輸出。
- 正式環境應使用 environment-scoped secrets 或等價 Secret Manager 注入。
- `NEXT_PUBLIC_PORTAL_API_BASE_URL` 雖非 secret，仍應由 environment variable / variable store 注入，避免 hard-coded environment drift。

## 目前未完成但已收斂的缺口

- Cloud Run deploy step 尚未落地；目前只有 release preflight gate 與 migration preflight artifact。
- Secret Manager vendor 尚未 final；本文件只定義 contract，不綁定 GCP Secret Manager、GitHub Environments 以外的單一實作。
- staging clone / scratch DB replay drill 不在 GitHub-hosted release-preflight 內自動執行，需由受控 runner 或人工 DBA 視窗執行。

## 關聯檔案

- `.github/workflows/ci.yml`
- `.env.example`
- `apps/api/.env.example`
- `apps/portal/.env.example`
- `doc/plans/Idx-023_plan.md`
- `doc/logs/Idx-023_log.md`
