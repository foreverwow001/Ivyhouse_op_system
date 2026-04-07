# Ivyhouse OP System

Ivyhouse OP System 是一個烘焙營運管理系統 monorepo，服務對象涵蓋內部營運、門市、採購、生產、物流與財務團隊。Phase 1 目前以 NestJS API 與 Next.js Portal 為主軸，重點放在 intake、daily ops、庫存追溯、配方版本與 go-live blocker 收斂。

## Workspace

- `apps/api`: NestJS + Prisma + PostgreSQL API
- `apps/portal`: Next.js Portal shell / intake / daily ops workbench
- `doc/`: architecture、plans、logs 與執行證據
- `.github/workflows/ci.yml`: Phase 1 quality gate 與 release preflight gate

## Local Setup

1. 安裝相依：`npm ci`
2. 複製環境變數範本：
   - `cp .env.example .env`
   - `cp apps/api/.env.example apps/api/.env`
   - `cp apps/portal/.env.example apps/portal/.env.local`
3. 依實際 PostgreSQL 連線資訊調整 `DATABASE_URL` 與 `ADMIN_DATABASE_URL`
4. 產生 Prisma client：`npm run prisma:generate`

## Common Commands

- `npm run build:api`
- `npm run build:portal`
- `npm run test:api:fixtures`
- `npm run test:api:mapping:fixtures`
- `npm run test:api:smoke`
- `npm run test:daily-ops:mainline --workspace @ivyhouse/api`

## Environment Contract

- API 必要變數：`DATABASE_URL`
- API 選用變數：`ADMIN_DATABASE_URL`、`PORT`
- Portal 必要變數：`NEXT_PUBLIC_PORTAL_API_BASE_URL`
- 所有 `.env` 實值檔都不得提交；repo 僅保留 `.env.example`

完整治理規則與 CI / release preflight 期待值，請參考 `doc/architecture/decisions/ci_and_env_governance_baseline.md`。