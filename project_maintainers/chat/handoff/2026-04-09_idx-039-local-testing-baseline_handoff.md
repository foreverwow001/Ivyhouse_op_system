# SESSION-HANDOFF — Idx-039 本機 Supabase 啟動基線與最小 UI Smoke 交接

> 建立日期：2026-04-09
> 最後更新：2026-04-09
> 涵蓋範圍：Idx-039 本機 API / Portal 啟動基線、Supabase env runtime 驗證、read-only smoke path、操作文檔與 reviewer 收口
> 前序 handoff：`2026-04-03_mvp-status-and-chat-reorg_handoff.md`

---

## Current goal

- 目前階段目標是把 `internal-testing` 的本機可見 UI 驗證基線固定下來，讓下一個 session 不必再回頭確認 API 是否真的讀到 Supabase、API / Portal 埠位是否一致、以及最短 smoke path 是否可重現。
- 下一位接手者應以前述基線為前提，直接進入人工 UI smoke、Portal 後續 blocker 收斂，或擴充 `Idx-023` 的 go-live blocker，而不是重做本機啟動基線。

## Current branch

- `main`

## Active environment

- Dev Container / Debian GNU/Linux 12 (bookworm)
- monorepo workspace：`/workspaces/Ivyhouse_op_system`
- Backend：TypeScript / NestJS / Prisma / PostgreSQL（Supabase provider baseline）
- Frontend：Next.js / React / TypeScript
- 本機固定埠位：API `127.0.0.1:3000`、Portal `3001`

## Files touched

- `apps/api/src/main.ts`
- `apps/api/package.json`
- `apps/api/.env.example`
- `apps/api/scripts/local-runtime-supabase-smoke.js`
- `apps/portal/package.json`
- `apps/portal/.env.example`
- `README.md`
- `doc/implementation_plan_index.md`
- `doc/plans/Idx-039_plan.md`
- `doc/logs/Idx-039_log.md`
- `project_maintainers/chat/2026-04-09_local-startup-and-ui-smoke.md`

## What has been confirmed

- API runtime 會在啟動後輸出：`[ivyhouse/api] runtime ready host=127.0.0.1 port=3000 provider=supabase database=postgres dbPort=6543` 類型的證據，證明本機讀到的 `DATABASE_URL` 是 Supabase provider。
- `npm run smoke:local:supabase --workspace @ivyhouse/api` 已通過，並輸出 `smoke ok route=/api/daily-ops/inventory-alerts/count-reminder itemCount=4`。
- `npm run build --workspace @ivyhouse/portal` 已通過，Next.js build 完成且靜態頁面 8/8 生成成功。
- 非 Supabase fake `DATABASE_URL` 已驗證會 fail-closed，錯誤訊息為 `本機啟動要求 Supabase DATABASE_URL，但目前讀到非 Supabase host。`，退出碼 `1`。
- API bind host 已固定為 `127.0.0.1`，不再接受外層 `HOST` env 覆寫。
- Security reviewer：`PASS_WITH_RISK`。
- QA reviewer：`PASS_WITH_RISK`。
- 本輪只適用 `internal-testing`，不代表正式 auth、deploy、backup、rollback 已收斂完成。

## Current stage

- Idx-039 runtime 基線已實作完成、focused validation 已完成、QA / Security reviewer 已完成。
- 目前剩餘工作是把本輪變更整理成 commit 並 push，之後下一個 session 可直接承接人工 UI smoke 或更高層 blocker 收斂。

## What was rejected

- 不擴張到 auth / SSO / RBAC 正式機制。
- 不擴張到 schema / migration / seed 重整。
- 不引入第二套 env 載入機制。
- 不接受非 Supabase provider 當成本輪通過條件。
- 不把 `.github/agents/ivy-engineer.agent.md` 的無關差異混入 Idx-039 主 commit；該差異應獨立提交。

## Next exact prompt

- 建議下一位接手者直接使用以下 prompt：

```md
請以 `project_maintainers/chat/handoff/2026-04-09_idx-039-local-testing-baseline_handoff.md` 為起點接手。

先確認 `Idx-039` 已提供的本機基線證據，不要重做 API / Portal 埠位與 Supabase runtime 驗證。

接著只做兩件事：
1. 依 `project_maintainers/chat/2026-04-09_local-startup-and-ui-smoke.md` 跑完整人工 UI smoke，回填實際觀察到的 UI / session 行為與差異。
2. 依 `doc/implementation_plan_index.md` 判斷下一個應承接的是 `Idx-023` 哪個 blocker slice，並先提出最小可執行切片，不要擴張到正式 deploy / auth 治理。
```

## Risks

- 本輪 provider guard 只驗證 host suffix，不驗證 DNS ownership、憑證或 infra identity。
- UI smoke 目前仍是人工劇本，沒有自動化瀏覽器證據。
- smoke script 會把目前 shell 的 env 傳入子程序 tree，包含 `DATABASE_URL`；風險侷限於 local session。
- `/api/daily-ops/inventory-alerts/count-reminder` 目前作為本機 read-only smoke route，不是正式 auth 證據。

## Verification status

- 已驗證：
  - API 正向 Supabase smoke
  - Portal build
  - 非 Supabase `DATABASE_URL` 的 fail-closed 負向驗證
  - QA / Security reviewer 完成，皆為 `PASS_WITH_RISK`
- 尚未驗證：
  - 自動化瀏覽器 UI evidence
  - 正式 auth / deploy / rollback / backup 治理
  - staging / production 層級的 infra identity 驗證
