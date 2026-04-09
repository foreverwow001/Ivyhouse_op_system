# Idx-039: 本機啟動基線收斂：Supabase DATABASE_URL 讀取驗證、API／Portal 固定埠位、最小 smoke path 與單一操作文檔 - Execution Log

> 建立日期: 2026-04-09
> 最近更新: 2026-04-09
> 狀態: QA

---

## ARTIFACT_CHAIN

- task_id: `Idx-039`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-039_plan.md`
- log_file_path: `doc/logs/Idx-039_log.md`

## WORKFLOW_SUMMARY

### Goal

收斂本機 API / Portal 啟動基線，固定 API `3000`、Portal `3001`，驗證 API runtime 讀到 Supabase `DATABASE_URL`，跑通一條最小 Supabase smoke path，並交付單一 dated 操作文檔。

### Scope

- 本輪先建立 `Idx-039` 的 index / plan / log artifact
- 後續實作只允許在白名單內處理 API / Portal local port、Supabase env/provider readback、最小 smoke path、README 與單一 chat 文檔
- 不碰 auth / SSO / RBAC 正式機制、不碰 schema / migration / seed 結構重整、不擴張 production deploy / backup / rollback 治理

## EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | copilot-chat-agent |
| last_change_tool | GitHub Copilot |
| qa_tool | copilot-cli-reviewer |
| latest_qa_review_outcome | PASS_WITH_RISK |
| security_review_outcome | PASS_WITH_RISK |
| domain_review_outcome | N/A |
| runtime_code_changed | yes |
| commit_hash | pending |

## EXECUTION_NOTES

### Execution update

1. 使用者正式批准依 `doc/plans/Idx-039_plan.md` 白名單直接實作，不需再次走改碼確認。
2. `Idx-039` 適用 `internal-testing`，並沿用 `Idx-033` 的 Supabase provider baseline，不得把本機啟動基線描述成 `single-operator-production`。
3. 已依白名單完成 API `3000`、Portal `3001`、Supabase runtime readback、read-only smoke route 與 `project_maintainers/chat` 根目錄 dated 單檔命名收斂。
4. 已定位並修補 `apps/api/scripts/local-runtime-supabase-smoke.js` 成功後仍殘留 process 的 root cause，並以同一條 smoke 指令完成 focused validation。
5. 本輪 follow-up 依白名單僅收斂 `apps/api/src/main.ts` 的 Supabase host 判定，將 `hostname.includes('supabase.com')` 改為嚴格後綴規則：只接受 `supabase.com` 或 `*.supabase.com`，避免非 Supabase 網域因子字串命中而被誤判。
6. reviewer residual cleanup 已完成：API listen host 固定為 `127.0.0.1`、fail-closed 錯誤訊息不再暴露實際 hostname、runtime readiness log 改為 `host / port / provider / database / dbPort`、smoke script 移除 dead variable 並縮減 payload error output、未使用 `dotenv` dependency 已移除。
7. Security reviewer 與 QA reviewer 均已完成 re-review，結論皆為 `PASS_WITH_RISK`；本輪無 blocker，可進入 commit / push / handoff。

### 實作結果

1. API 啟動入口會以 `host / port / provider / database / dbPort` 形式回報 runtime 證據，並在 `IVYHOUSE_EXPECT_SUPABASE=1` 時對非 Supabase host fail-closed。
2. API 啟動腳本固定 `3000`；Portal `dev` / `start` 腳本固定 `3001`，且 `.env.example` 與 README 說法一致。
3. 最小 smoke path 採既有 read-only GET route `/api/daily-ops/inventory-alerts/count-reminder`，避免 tagged create+read fallback 與殘留資料風險。
4. 已新增 `project_maintainers/chat/2026-04-09_local-startup-and-ui-smoke.md`，集中記錄最短本機啟動清單與最小人工 UI smoke 劇本。
5. `local-runtime-supabase-smoke.js` 原本只對 `npm run start:dev` 外層程序送出 `SIGTERM`，且成功路徑未等待 teardown；在 `npm run` 內層 `node --require ts-node/register src/main.ts` 被 orphan 時，會留下監聽 `3000` 的殘留程序並讓後續 smoke 污染。現已改為回收整個 child tree，先送 `SIGTERM`，逾時才升級 `SIGKILL`，且成功路徑也會等待退出完成。
6. 最終版本將 API bind host 固定為 `127.0.0.1`，不再接受外層 `HOST` env 覆寫，避免本機 smoke 誤暴露到全介面。

### 驗證證據

1. `lsof -nP -iTCP:3000 -sTCP:LISTEN` 與 `ps -ef | grep -E 'src/main.ts|local-runtime-supabase-smoke|npm run start:dev' | grep -v grep`：先確認舊殘留 `node --require ts-node/register src/main.ts`（PID 5032, PPID 1）仍占用 `3000`，與「只殺外層、未回收內層 API」症狀一致。
2. `kill 5032`：清除修補前遺留的舊 orphan process，避免污染本次 focused validation。
3. `npm run smoke:local:supabase --workspace @ivyhouse/api`：通過，命令會自行結束；輸出包含 `[ivyhouse/api] runtime ready host=127.0.0.1 port=3000 provider=supabase database=postgres dbPort=6543` 與 `[ivyhouse/api] smoke ok route=/api/daily-ops/inventory-alerts/count-reminder itemCount=4`。
4. smoke 結束後再次執行 `lsof -nP -iTCP:3000 -sTCP:LISTEN` 與 `ps -ef | grep -E 'src/main.ts|local-runtime-supabase-smoke|npm run start:dev' | grep -v grep`：皆無輸出，確認沒有留下新的監聽 `3000` 或相關殘留程序。
5. `npm run build --workspace @ivyhouse/portal`：通過；Next.js production build compiled successfully，lint/type check 通過，靜態頁面 8/8 生成完成。
6. reviewer residual cleanup 後重跑 `npm run smoke:local:supabase --workspace @ivyhouse/api`：通過；輸出包含 `[ivyhouse/api] runtime ready host=127.0.0.1 port=3000 provider=supabase database=postgres dbPort=6543` 與 `[ivyhouse/api] smoke ok route=/api/daily-ops/inventory-alerts/count-reminder itemCount=4`，退出碼 `0`，確認 localhost bind、generic error 與 smoke cleanup 未破壞既有路徑。
7. `npm run build --workspace @ivyhouse/portal`：於 reviewer residual cleanup 後再次通過；Next.js production build compiled successfully，靜態頁面 8/8 生成完成。
8. `DATABASE_URL='postgresql://postgres:postgres@localhost:5432/ivyhouse_negative_probe' npm run start:dev --workspace @ivyhouse/api`：如預期 fail-closed；輸出 `Error: 本機啟動要求 Supabase DATABASE_URL，但目前讀到非 Supabase host。`，退出碼 `1`。
9. Security reviewer：`PASS_WITH_RISK`。重點結論為本輪無 blocker；殘留風險限於 provider guard 不驗 infra identity、local env 繼承與 smoke route 無正式 auth，於 `internal-testing` 可接受。
10. QA reviewer：`PASS_WITH_RISK`。重點結論為正向 smoke、Portal build、負向 fail-closed 與文件對齊均成立；殘留風險為 UI smoke 仍屬人工劇本。

### 本輪未做事項

- 未修改 auth / SSO / RBAC 正式機制。
- 未修改 schema / migration / seed 結構。
- 未修改 auth / SSO / RBAC 正式機制。
- 未修改 schema / migration / seed 結構。

## VALIDATION_SUMMARY

- API local Supabase smoke 已通過，且成功輸出後會乾淨退出，不再留下 `src/main.ts`、`npm run start:dev` 或 `local-runtime-supabase-smoke.js` 殘留程序。
- Portal build 已在兩輪 focused validation 中通過，確認本輪 cleanup 未破壞 Portal build surface。
- 非 Supabase fake `DATABASE_URL` 已驗證會 fail-closed，錯誤訊息為 generic `非 Supabase host`，退出碼 `1`。
- QA / Security reviewer 均為 `PASS_WITH_RISK`，本輪無 blocker。

## RESIDUAL_RISKS

- API smoke 仍依賴操作者提供有效且可連通的 Supabase `DATABASE_URL`；若環境值無效，runtime 會 fail-closed。
- Supabase provider guard 本輪僅收斂為 hostname 嚴格後綴比對，用來避免子字串誤判；它不驗證 DNS 所有權、憑證或其他基礎設施真實性，這仍屬本輪 scope 外。
- Portal UI smoke 目前是人工劇本，不含自動化瀏覽器證據。
- 修補後不再製造新的 lingering process，但若工作區先前已存在舊 orphan process，仍需先清除後再跑 smoke；本次 validation 已完成一次清場並證實新版本 teardown 正常。
- smoke script 仍會把目前 shell 的 env 傳入子程序 tree，包含 `DATABASE_URL`；這是本機 smoke 的結構性前提，風險侷限於 local session。
- `DATABASE_URL`、session、auth 與 env 鄰近面屬高風險；本輪刻意只做本機 baseline 收斂，不延伸到正式 auth/session 治理。

## CHANGED_FILES

| 檔案 | 本輪角色 |
|------|----------|
| `apps/api/src/main.ts` | API runtime `DATABASE_URL` 脫敏 readback 與 Supabase fail-closed 驗證 |
| `apps/api/.env.example` | Supabase env contract 與固定 API `3000` 說明 |
| `apps/api/package.json` | 固定 API `3000` 與最小 Supabase smoke 指令 |
| `apps/api/scripts/local-runtime-supabase-smoke.js` | read-only smoke route 驗證 |
| `apps/portal/package.json` | 固定 Portal `3001` |
| `apps/portal/.env.example` | 對齊 Portal 本機埠位與 API base URL |
| `README.md` | 收斂本機啟動與 smoke 指令單一說法 |
| `project_maintainers/chat/2026-04-09_local-startup-and-ui-smoke.md` | dated 單檔本機啟動與 UI smoke 劇本 |
| `doc/implementation_plan_index.md` | 將 Idx-039 狀態推進到 QA |
| `doc/logs/Idx-039_log.md` | 回填實作摘要、驗證證據與殘留風險 |