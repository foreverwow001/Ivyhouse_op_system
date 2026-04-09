# CI 與環境變數治理基線

更新日期：2026-04-08

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

`workflow_dispatch` 模式下，workflow 會先執行非 environment-bound 的 `release-preflight-guard` job，通過後才由 environment-bound 的 `release-preflight` 驗證 target environment 的必要 binding，最後執行 repo-native 的 read-only migration preflight，不直接執行 deploy。`quality-gate` 不承接這個 guard，因此 push / pull_request 的一般 CI 不受 `assignment_ref` / `target_environment` 影響；這是本輪刻意的 scope 切割，本 task 只處理 authorized actor / assignment / production checklist gate，不把一般 CI 成功與否混進 release authority decision。這個 gate 目前檢查：

這裡的 `workflow_dispatch` 只描述 workflow surface，不代表任何可見或可操作 GitHub 介面的人都能正式使用。`release-preflight` 的正式 `authorized actor boundary` 仍以 `doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md` 與 `doc/architecture/flows/post_launch_ops_runbook.md` 為準：staging 只限被指派的 `Release operator`，production 只限被指派的 `Release owner`，且 production 在 backup / restore checklist 未完整前必須 fail-closed。`Idx-037` 已把這條 boundary 的最小 repo-native enforcement 落入 `.github/workflows/ci.yml` 與 `tools/validate-release-preflight-guard.js`：workflow 先跑 `release-preflight-guard` job，再由 `release-preflight` 以 `needs` 接手 environment-bound preflight；effective actor 以 `github.triggering_actor` 優先、fallback 到 `github.actor`，staging / production allowlist 目前保守只允許 `foreverwow001`，且 production 會直接讀取 `doc/architecture/flows/production_backup_restore_signoff_checklist.md` 做 fail-closed 判定。guard 寫入 `GITHUB_STEP_SUMMARY` 時，會對 `assignment_ref` 的 `|`、`<`、`>`、backtick、CR、LF 做最小安全處理，並同時留下 `github.triggering_actor`、`github.actor`、`effective_actor` 以便 rerun 稽核；若 checklist 檔案無法讀取，也必須以結構化 deny 訊息 fail-closed，而不是露出 raw stack trace。

已知風險：workflow 的 global concurrency `cancel-in-progress: true` 仍可能在同一 ref 有新 push 時取消 `workflow_dispatch` 的 `release-preflight-guard` / `release-preflight`；本輪不改 concurrency 設計，只誠實列為後續治理風險。

binding 檢查通過也不代表 `Release assignment` 已成立；`Idx-037` 新增的 `assignment_ref` 只是 evidence reference gate，不等於正式 assignment proof。正式觸發前仍必須有最小留痕欄位：`指派人`、`被指派人`、`目標環境`、`有效範圍`、`時間戳`。

GitHub Environment required reviewers、branch protection 與其實際設定值屬 repo 外控制面；本 repo 在本輪只能把它們列為 external follow-up，不能宣稱已完成驗證。若存在 checklist bypass path，也只可視為 external / platform residual risk，而非 repo 內已解決事項。

- staging：`vars.DATABASE_URL`、`vars.NEXT_PUBLIC_PORTAL_API_BASE_URL`
- production：`secrets.DATABASE_URL`、`secrets.ADMIN_DATABASE_URL`、`vars.NEXT_PUBLIC_PORTAL_API_BASE_URL`

通過 binding 檢查後，workflow 會執行：

- `npm run prisma:generate`
- `npm run preflight:formal-env`
- 上傳 `migration-preflight-report.json` artifact

理由是目前正式 deploy artifact 與 Secret Manager vendor 尚未 final，但 go-live blocker 不能繼續停留在「完全沒有 gate」。先把 binding completeness gate 與 read-only migration preflight 建起來；對 staging 先以 managed provider 可行的 read-only preflight 為主，不再把 `ADMIN_DATABASE_URL` 當成硬性阻斷。正式 clone drill、admin-capable scratch DB 與 deploy 仍由 production 或後續受控步驟處理。

### 3. Operating mode 與環境治理最低線

- `內部測試模式`：用於內部驗證、流程演練與受控資料操作，不綁 production sign-off；但仍必須遵守 secret handling 邊界與基本 quality gate。
- `單人營運正式層`：允許只有一位管理者，但最低必須保留 provider-managed backup、固定 deploy 路徑、rollback、audit trail、secrets 管理。
- external infra facts 與 platform control evidence 的 defer timing，應以 [營運模式與正式資料庫 Provider 基線](./operating_mode_and_database_provider_baseline.md) 為準；`internal-testing` 可以在 plan / log 誠實標記 `deferred`，但一旦敘述成 `single-operator-production`，就必須先補齊最近成功備份時間、保留策略、RTO、RPO、restore rehearsal 日期 / 結果 / 證據、final sign-off 與 branch protection / required reviewers 平台證據，否則不得改寫成 `production-ready` 或解除 production promote blocker。
- 完整 evidence 欄位與判定語意以 [營運模式與正式資料庫 Provider 基線](./operating_mode_and_database_provider_baseline.md) 為準；本文件只做 cross-reference，不另建較寬鬆的 evidence completeness 標準。
- 若後續任務要宣稱更高等級 production 治理，或改變正式資料庫 provider，必須先引用並更新 [營運模式與正式資料庫 Provider 基線](./operating_mode_and_database_provider_baseline.md)，不得直接在 CI / workflow 內隱含升級。

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
- GitHub Environment required reviewers、branch protection、org / team membership 驗證與 external sign-off 平台設定，不是 repo 內可完整自動化的 surface；目前只作為 external follow-up，且本輪無法從 repo 內驗證其實際設定值。
- workflow 的 global concurrency `cancel-in-progress: true` 可能取消同 ref 上進行中的 `workflow_dispatch release-preflight`；目前仍屬已知風險，尚未在 repo 內拆分 concurrency policy。

## 關聯檔案

- `.github/workflows/ci.yml`
- `.env.example`
- `apps/api/.env.example`
- `apps/portal/.env.example`
- `doc/plans/Idx-023_plan.md`
- `doc/logs/Idx-023_log.md`
