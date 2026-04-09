# Plan: Idx-039 — 本機啟動基線收斂：Supabase DATABASE_URL 讀取驗證、API／Portal 固定埠位、最小 smoke path 與單一操作文檔

**Index**: Idx-039
**Created**: 2026-04-09
**Planner**: GitHub Copilot
**Phase**: Phase 1
**Primary Module**: Portal
**Work Type**: bugfix
**Track**: product-system
**Operating Mode**: internal-testing

> 本輪目標是把本機 API / Portal 啟動基線收斂到單一操作方式：固定埠位、驗證 runtime 實際讀到 Supabase `DATABASE_URL`、跑通最小 smoke path，並把人工步驟固化成 `project_maintainers/chat` 根目錄的 dated 單檔文檔。

---

## 🎯 目標

收斂本機 API / Portal 啟動基線，讓單一操作者能以固定埠位與既有 Supabase 資料庫完成最小驗證與最小 UI smoke，並把操作方式固化成單一文檔。

---

## 📋 SPEC

### Goal

在不擴張到 auth、schema、deploy 治理的前提下，明確驗證 API runtime 讀到 Supabase `DATABASE_URL`、固定 API `3000` 與 Portal `3001`、建立一條最小 Supabase 驗證路徑，並交付單一操作文檔。

### Business Context

- `Idx-023` 已建立 CI / env 治理最低線與 Portal / API baseline，但尚未把本機啟動路徑收斂成單一操作者可重現的最短操作面。
- `Idx-033` 已正式採納 `internal-testing` 與 Supabase provider baseline，後續本機驗證不得再用模糊的 provider / 埠位假設。
- 目前缺少兩個權威面：一是能在 runtime 脫敏證明 `DATABASE_URL` 來自 env 且指向 Supabase 的 readiness surface；二是既有 Supabase 的最小 read-only 驗證路徑。

### Non-goals

- 不做 auth / SSO / RBAC 調整。
- 不做 schema / migration / seed 結構重整。
- 不做 production deploy / backup / rollback 治理擴張。
- 不建立第二套 env 載入機制。

### Acceptance Criteria

1. API 啟動時可脫敏證明 runtime 使用到 Supabase `DATABASE_URL`。
2. API `3000`、Portal `3001` 固定下來，且 local 設定與說明一致。
3. 一條最小 Supabase 路徑可執行成功並留下 log evidence。
4. `project_maintainers/chat` 新增單一 dated 文檔，內含最短本機啟動清單與最小人工 UI 劇本。
5. Security Review 完成，Domain Expert Review 為 `N/A`。

### Edge Cases

- env 存在但不是 Supabase host -> fail-closed。
- 找不到穩定 read-only 路徑 -> 允許 `internal-testing` 的 test-tagged create+read，但需記錄殘留資料風險。
- 埠位調整後不能留下雙重真相；說明、`.env.example`、package script 與 runtime surface 必須一致。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/decisions/operating_mode_and_database_provider_baseline.md`
- `doc/architecture/decisions/ci_and_env_governance_baseline.md`
- `README.md`
- `project_maintainers/chat/README.md`

### Missing Inputs

- 缺少既有 Supabase 最小 read-only 驗證路徑的權威指定。
- 缺少現成 runtime readiness surface，可直接證明 env/provider readback。

research_required: true

### Assumptions

- VERIFIED - 使用者已批准 API `3000` / Portal `3001` 固定埠位。
- VERIFIED - 驗證路徑優先 read-only；若 read-only 不可行，允許 `internal-testing` 下的 tagged fallback create+read。
- VERIFIED - 操作文檔應建立在 `project_maintainers/chat` 根目錄，採 dated 單檔命名。
- OPEN - 若既有 Supabase 資料庫沒有可接受的最小驗證路徑，本 work unit 必須依 escalation condition 停下來回報，而不是臨時擴張到 schema 或 auth。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Portal
- Adjacent modules: API bootstrap / env governance、local operator documentation
- Out of scope modules: auth / session 正式機制、schema / migration、production deploy / rollback governance

### File whitelist

- `doc/implementation_plan_index.md`
- `doc/plans/Idx-039_plan.md`
- `doc/logs/Idx-039_log.md`
- `apps/api/src/main.ts`
- `apps/api/.env.example`
- `apps/api/package.json`
- `apps/api/scripts/local-runtime-supabase-smoke.js`
- `apps/portal/package.json`
- `apps/portal/.env.example`
- `apps/portal/lib/portal-session.ts`
- `apps/portal/app/login/page.tsx`
- `README.md`
- `project_maintainers/chat/<dated-local-startup-and-ui-smoke-doc>.md`

### Review Requirements

- Domain Expert Review: `N/A`
- Security Review: required
- QA Review: required
- 理由：本輪直接碰到 `/api/`、session / auth 鄰近面、`DATABASE_URL`、env contract 與本機操作文檔，屬高風險治理交界，必須做 Security / QA，但不要求 Domain Expert。

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A。本輪不新增也不修改任何主資料字典、owner 邊界或治理契約。

#### STATE / WORKFLOW IMPACT

- 本輪只收斂 `internal-testing` 的本機啟動與 smoke path，不修改正式業務狀態機、auth flow、schema lifecycle 或 deploy workflow。

#### RBAC IMPACT

- N/A。本輪不碰 auth、RBAC、session 正式權限模型或角色矩陣。

#### SHARED KEY / CROSS-MODULE IMPACT

- N/A。本輪不新增 shared key、跨模組寫入契約或 schema 關聯調整。

### Done 定義

1. API runtime 有脫敏證據顯示 `DATABASE_URL` 來自 env 且指向 Supabase。
2. API 與 Portal 埠位固定且本機不衝突。
3. 一條最小 Supabase 測試路徑驗證成功並被記錄到 log。
4. 單一 chat 文檔已交付且可讓操作者重現本機啟動與最小 UI smoke。
5. 不修改 `file_scope` 之外的檔案。
6. 結果可直接送 QA 與 Security Review。

### Rollback 策略

- Level: L1
- 前置條件: 本輪僅允許修改白名單內檔案
- 回滾動作: 若固定埠位、Supabase 驗證或操作文檔與既有 authority 衝突，只回退白名單內變更，不擴及 schema、auth 或 deploy surface

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-039-local-runtime-supabase-bootstrap
  goal: 收斂本機 API 與 Portal 啟動路徑，明確驗證 API runtime 讀到 Supabase DATABASE_URL，固定雙端埠位，跑通一條最小 Supabase 測試路徑，並交付單一操作文檔
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - targeted-unit-tests
    - touched-file-lint
  file_scope:
    - doc/implementation_plan_index.md
    - doc/plans/Idx-039_plan.md
    - doc/logs/Idx-039_log.md
    - apps/api/src/main.ts
    - apps/api/.env.example
    - apps/api/package.json
    - apps/api/scripts/local-runtime-supabase-smoke.js
    - apps/portal/package.json
    - apps/portal/.env.example
    - apps/portal/lib/portal-session.ts
    - apps/portal/app/login/page.tsx
    - README.md
    - project_maintainers/chat/
  done_criteria:
    - API runtime 有脫敏證據顯示 DATABASE_URL 來自 env 且指向 Supabase
    - API 與 Portal 埠位固定且本機不衝突
    - 一條最小 Supabase 測試路徑驗證成功並被記錄到 log
    - 單一 chat 文檔已交付且可讓操作者重現本機啟動與最小 UI smoke
    - 不得修改 file_scope 之外的檔案
    - 結果可直接送 QA 與 Security Review
  escalation_conditions:
    - 需要新增第二套 env 載入機制
    - 需要碰 auth 或 session 正式機制
    - 需要 schema、migration 或資料回填
    - 既有 Supabase 資料庫沒有可接受的最小驗證路徑
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/implementation_plan_index.md` | 修改 | 新增 Idx-039 與更新統計 |
| `doc/plans/Idx-039_plan.md` | 新增 | 建立正式 plan artifact |
| `doc/logs/Idx-039_log.md` | 新增 | 建立 planning kickoff 與後續執行留痕入口 |
| `apps/api/src/main.ts` | 預計修改 | 補 runtime 脫敏 env/provider readback surface |
| `apps/api/.env.example` | 預計修改 | 固定 API local port 與 env contract 說明 |
| `apps/api/package.json` | 預計修改 | 固定本機 API 啟動埠位與 smoke 指令接線 |
| `apps/api/scripts/local-runtime-supabase-smoke.js` | 預計新增或修改 | 建立最小 Supabase smoke path |
| `apps/portal/package.json` | 預計修改 | 固定 Portal local port |
| `apps/portal/.env.example` | 預計修改 | 對齊 Portal API base URL 與 local 啟動說明 |
| `apps/portal/lib/portal-session.ts` | 預計視需要修改 | 僅在不改正式 auth/session 機制前提下處理 login smoke 所需最小接線 |
| `apps/portal/app/login/page.tsx` | 預計視需要修改 | 僅處理最小人工 UI smoke 路徑 |
| `README.md` | 預計修改 | 收斂本機啟動指引，避免雙重真相 |
| `project_maintainers/chat/` | 預計新增檔案 | 單一 dated 本機操作文檔，實際檔名需落在既有白名單目錄內 |

---

## 實作指引

### 1. 埠位與 env 收斂

- API 固定 `3000`、Portal 固定 `3001`。
- `.env.example`、package scripts、README 與 runtime 行為不得出現不同埠位。
- `DATABASE_URL` 驗證需以脫敏方式證明 provider / host 來自 env，不得輸出完整 credential。

### 2. Supabase smoke path

- 優先尋找既有穩定 read-only 路徑。
- 若找不到可接受的 read-only 路徑，才允許使用 test-tagged create+read fallback，且必須在 log 記錄殘留資料風險與清理責任。
- 若 env host 不是 Supabase，必須 fail-closed，不以其他 provider 視為等價通過。

### 3. 操作文檔

- `project_maintainers/chat` 僅交付一份 dated 單檔，集中記錄最短啟動清單與最小人工 UI 劇本。
- 不得同時在 README、chat 文檔與 env example 留下互相衝突的本機操作說法。

---

## 注意事項

- 風險提示: 本輪最可能的 blocker 是缺少現成 read-only Supabase 驗證路徑；若發生，只能在 `internal-testing` 下走 tagged fallback，且必須誠實留痕。
- 資安考量: `DATABASE_URL`、session、auth 與 env surface 屬高風險鄰近面；任何需要擴張到正式 auth/session 機制的需求都應立即升級處理，而不是在本 task 內隱性吸收。
- 相依性: 本輪需沿用 `Idx-023` 的 CI / env 基線與 `Idx-033` 的 Supabase provider baseline。

---

## 相關資源

- `doc/architecture/decisions/operating_mode_and_database_provider_baseline.md`
- `doc/architecture/decisions/ci_and_env_governance_baseline.md`
- `README.md`
- `project_maintainers/chat/README.md`

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
operating_mode: [internal-testing]
track: [product-system]
plan_created: [2026-04-09 00:00:00]
plan_approved: [2026-04-09 使用者已要求建立 Idx-039 artifact，並明確批准 API 3000 / Portal 3001、prefer read-only、allow tagged fallback 與 chat 根目錄 dated 單檔命名；正式實作待後續 execution kickoff]
scope_policy: [strict]
expert_required: [false]
expert_conclusion: [N/A]
security_review_required: [true]
security_reviewer_tool: [copilot-cli-reviewer]
security_review_trigger_source: [mixed]
security_review_trigger_matches: [/api/, session, auth, DATABASE_URL, env]
security_review_start: [2026-04-09]
security_review_end: [2026-04-09]
security_review_result: [PASS_WITH_RISK]
security_review_conclusion: [無 blocker；固定 localhost bind、generic fail-closed message、縮減 runtime readback 與 smoke script cleanup 已落地。殘留風險僅限 provider guard 不驗 infra identity、local env 繼承與 smoke route 無正式 auth，於 internal-testing 可接受]
execution_backend_policy: [chat-primary-with-one-shot-reviewers]
executor_tool: [copilot-chat-agent]
executor_backend: [copilot-chat-agent]
monitor_backend: [checkpoint-first-targeted-validation]
last_change_tool: [GitHub Copilot]
qa_tool: [copilot-cli-reviewer]
qa_review_start: [2026-04-09]
qa_review_end: [2026-04-09]
qa_review_result: [PASS_WITH_RISK]
qa_review_conclusion: [無 blocker；正向 smoke、Portal build 與負向 fail-closed 均有證據，README / env example / operator doc 已對齊。殘留風險為人工 UI smoke 尚未自動化，且本輪只適用 internal-testing]
qa_compliance: [pass-with-risk]
reviewer_outcome_summary: [QA / Security reviewer 均為 PASS_WITH_RISK，未阻斷 commit / push / handoff；殘留風險已記錄於 log 並限制在 internal-testing]
log_file_path: [doc/logs/Idx-039_log.md]
scope_exceptions: []
<!-- EXECUTION_BLOCK_END -->