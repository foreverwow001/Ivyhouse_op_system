# 2026-04-09 本機啟動清單與最小 UI Smoke

適用範圍：`Idx-039`、`internal-testing`、既有 Supabase 資料庫。

## 最短本機啟動清單

1. 安裝相依：在 repo root 執行 `npm ci`。
2. 準備環境檔：
   - `cp apps/api/.env.example apps/api/.env`
   - `cp apps/portal/.env.example apps/portal/.env.local`
3. 只填必要值：
   - `apps/api/.env` 內填入 Supabase `DATABASE_URL`
   - `apps/portal/.env.local` 預設保留 `NEXT_PUBLIC_PORTAL_API_BASE_URL=http://localhost:3000/api`
4. 產生 Prisma client：在 repo root 執行 `npm run prisma:generate`。
5. 驗證 API runtime 與最小 Supabase smoke：在 repo root 執行 `npm run smoke:local:supabase --workspace @ivyhouse/api`。
6. 啟動 Portal：在 repo root 執行 `npm run dev --workspace @ivyhouse/portal`，Portal 固定在 `http://localhost:3001/login`。

## 預期 API smoke 證據

- 看到 API runtime readiness line，格式類似：`[ivyhouse/api] runtime ready host=127.0.0.1 port=3000 provider=supabase database=postgres dbPort=6543`
- 看到 smoke line：`[ivyhouse/api] smoke ok route=/api/daily-ops/inventory-alerts/count-reminder itemCount=<number>`
- 若 host 不是 `supabase.com`，啟動必須 fail-closed，不接受其他 provider 當作通過。

## 最小人工 UI Smoke 劇本

1. 開啟 `http://localhost:3001/login`。
2. 確認登入頁載入成功，畫面顯示「艾薇手工坊營運入口」與 API Base URL 預設值 `http://localhost:3000/api`。
3. 輸入任一長度至少 3 的帳號、任一長度至少 6 的密碼，保留任一角色預設，送出表單。
4. 確認頁面導向 `/landing`，而不是停留在錯誤訊息。
5. 用瀏覽器 DevTools 檢查 `localStorage` 的 `ivyhouse.portal.session`，確認有 `principalId`、`roleCodes`、`sessionId`、`apiBaseUrl`。
6. 返回登入頁，把密碼改成少於 6 字元再送出一次，確認出現「此切片僅提供本地登入殼層，尚未接正式驗證流程」類型的錯誤提示。

## 邊界與注意事項

- 本文檔只適用本機 `internal-testing`，不代表正式 auth、deploy、backup 或 rollback 流程。
- 本輪 smoke 使用既有 GET route `/api/daily-ops/inventory-alerts/count-reminder`，屬 read-only 驗證，不應新增測試資料。
- 不得在任何截圖、log 或 handoff 內貼出完整 `DATABASE_URL` 或 credential。