# Idx-023: Go-Live Blocker 收斂 — Portal、CI/CD、環境治理、主資料完整化與正式環境 Preflight - Execution Log

> 建立日期: 2026-04-04
> 最近更新: 2026-04-07
> 狀態: In Progress

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-023`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-023_plan.md`
- log_file_path: `doc/logs/Idx-023_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

把 `Idx-023` 從 go-live blocker 大包計畫，收斂成可逐 slice 執行的正式 implementation plan，並凍結下一個 active slice。

### Scope

- 明確標定 `Idx-028` 為已完成的 slice 1
- 將 `Idx-023` 剩餘 blocker 拆成後續 slices 與依賴順序
- 凍結 active slice：`Portal session boundary + Intake workbench`
- 更新 reviewer / gate / security trigger 與後續執行前置條件

### Out of Scope

- 不執行任何 Portal、API、CI/CD、schema、migration 或部署修改
- 不處理 `Idx-024`、`Idx-025` 項目

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | GitHub Copilot |
| security_reviewer_tool | reviewer-preflight + security checklist manual readback |
| qa_tool | get_errors + targeted checks + manual QA readback |
| last_change_tool | GitHub Copilot |
| qa_result | PASS |
| commit_hash | pending |

## 📝 PLANNING_REFINEMENT

### 本輪決策

1. `Idx-023` 不再以單一跨模組 blocker 大包進入 Engineer。
2. `Idx-028` 明確視為 `Idx-023` 的 Slice 1 completed，不再和未完成項目混列。
3. 下一個 active slice 凍結為 `Portal session boundary + Intake workbench`，因為：
   - Portal shell 已存在
   - 後端已有 intake runtime surface
   - 後端已有 `PortalSessionPrincipal` bridge
4. 正式環境 preflight、secret manager、主資料升格與 approval residuals 全部留在後續 slices，不阻斷當前 active slice。

### Slice Sequence Snapshot

| Slice | 狀態 | 說明 |
|---|---|---|
| Slice 1 | Completed | `Idx-028`：Portal scaffold、login、landing shell |
| Slice 2 | Completed | Portal session boundary + Intake workbench |
| Slice 3 | Completed | Daily Ops workbench |
| Slice 4 | Completed | CI/CD gate |
| Slice 5 | Completed | 環境變數與密鑰治理 |
| Slice 6 | Completed | 主資料升格 + approval 收口 |
| Slice 7 | Completed | 正式環境 migration preflight + rollback drill |

### Residual Risks

- GitHub-hosted `release-preflight` 尚待實際對接 staging / production environment bindings 後觸發一次，才能補齊 hosted runner artifact
- production 若需 clone drill，仍需 DBA / 受控 runner 視窗與 `ALLOW_PRODUCTION_REPLAY_DRILL=true` 明確授權
- `Idx-024` 與 `Idx-025` 的 post-launch / progressive hardening 尚未開始

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| plan-refinement | `doc/plans/Idx-023_plan.md` | PASS | 已將 blocker 大包收斂為 slice sequence，並凍結 active slice 與單一 `work_unit` | 2026-04-07 15:34 UTC |
| plan-refinement | `doc/logs/Idx-023_log.md` | PASS | 已回填 planning evidence、slice snapshot、active slice 風險與 validator 結果 | 2026-04-07 15:34 UTC |

## 🚚 EXECUTION_UPDATES

### Slice 2 — Portal session boundary + Intake workbench

- 已完成 Portal session local bridge、principal header injection、intake batch create / detail / parse / review / confirm workbench。
- Focused validation：`npm run build:portal` -> PASS

### Slice 3 — Daily Ops workbench

- 已完成 demand batch、production planning、inventory count 與 alerts 的 Portal workbench。
- Focused validation：`npm run build:portal` -> PASS

### Slice 4 — CI/CD gate

- 新增 `.github/workflows/ci.yml`
- 建立 repo-native GitHub Actions quality gate：install、guard、Prisma generate、API build、Portal build、fixtures、intake smoke、daily ops mainline smoke
- 建立 `workflow_dispatch` release preflight gate，驗證 target environment bindings 是否存在

### Slice 5 — 環境變數與密鑰治理

- 新增 root `.env.example`、`apps/api/.env.example`、`apps/portal/.env.example`
- 更新 `.gitignore`，忽略 env 實值檔並保留 example files
- 新增 `doc/architecture/decisions/ci_and_env_governance_baseline.md` 收斂 env / secret handling 契約
- 更新 `README.md` 說明 local setup、common commands 與 env contract

### Slice 6 — 主資料升格 + production-planning approval 收口

- 新增 `project_maintainers/data/active/master-data/2026-04-01_半成品主檔第一版草案.csv`
- 新增 `project_maintainers/data/active/master-data/2026-04-01_原料主檔最低版本草案.csv`
- `MasterDataService` 與 maintainer path contract 改讀 active master-data surface，不再把 raw / semi-finished runtime 直接綁在 drafts 路徑
- production-planning approval audit payload 新增 `approvalRoleBasis = 主管`，明確證明最終 approver 合法性依正式業務角色成立
- 新增 focused test `apps/api/test/master-data-active-surface.test.js`
- 更新 production-planning regression smoke，驗證 dual-role approver 的 audit evidence 仍以 `主管` 為核決依據

### Slice 7 — 正式環境 migration preflight + rollback drill

- 新增 `apps/api/scripts/migration-preflight.js`，將 repo migrations、`_prisma_migrations` 與 `pg_extension` inventory 收斂成 read-only JSON preflight
- 新增 `apps/api/scripts/migration-replay-drill.js`，以 scratch DB replay `migrate deploy`、`seed`、preflight 與 smoke，作為 non-destructive rollback drill evidence
- 新增 `apps/api/test/migration-preflight.test.js`，固定 drift / fresh-env / sanitize semantics
- 更新 `.github/workflows/ci.yml`，讓 `release-preflight` 在 binding check 後執行 repo-native migration preflight 並上傳 artifact
- 更新 migration / bootstrap / env governance 權威文件，明確寫入 read-only preflight、scratch DB drill、production fail-closed guard 與 same-server guard
- 補上 replay drill fail-closed hardening：production target 需顯式 `ALLOW_PRODUCTION_REPLAY_DRILL=true`，且 `DATABASE_URL` / `ADMIN_DATABASE_URL` 必須指向同一個 PostgreSQL server

## ✅ QA_SUMMARY

- 結論：PASS
- 風險：workspace 無 one-shot reviewer tool，因此本輪 QA 以 reviewer preflight、get_errors、focused tests 與 executable smoke 作替代證據
- 後續事項：Hosted runner `release-preflight` 實跑、`Idx-024` post-launch hardening、`Idx-025` progressive hardening

## 📎 EVIDENCE

- Reviewed inputs:
  - `doc/implementation_plan_index.md`
  - `doc/plans/Idx-028_plan.md`
  - `doc/logs/Idx-028_log.md`
  - `doc/logs/Idx-018_log.md`
  - `doc/logs/Idx-022_log.md`
  - `doc/architecture/modules/portal_ui_ux_baseline.md`
  - `doc/architecture/flows/portal_landing_flow_mapping_spec.md`
  - `doc/architecture/flows/channel_intake_api_contract.md`
  - `apps/api/src/common/auth/portal-session-principal.ts`
  - `apps/api/src/intake/intake.controller.ts`
  - `apps/api/src/daily-ops/daily-ops.controller.ts`
- Planning evidence: `python .github/workflow-core/skills/plan-validator/scripts/plan_validator.py doc/plans/Idx-023_plan.md` -> PASS (`Plan 驗證通過`)
- Slice 4 / 5 本輪未改 schema 或 migration，但已新增 CI/CD、env contract 與文件 surface

### 2026-04-07 Slice 4 / Slice 5 evidence

- 新增 `.github/workflows/ci.yml`
- 新增 `.env.example`
- 新增 `apps/api/.env.example`
- 新增 `apps/portal/.env.example`
- 新增 `doc/architecture/decisions/ci_and_env_governance_baseline.md`
- 更新 `README.md`
- 更新 `.gitignore`
- 更新 `doc/plans/Idx-023_plan.md`
- 更新 `doc/logs/Idx-023_log.md`

### 2026-04-07 Slice 6 evidence

- 更新 `apps/api/src/master-data/maintainer-data-paths.ts`
- 更新 `apps/api/src/master-data/master-data.service.ts`
- 更新 `apps/api/src/daily-ops/production-planning/production-planning.service.ts`
- 新增 `apps/api/test/master-data-active-surface.test.js`
- 更新 `apps/api/test/production-plan-rerun-regression-smoke.js`
- 新增 `project_maintainers/data/active/master-data/2026-04-01_半成品主檔第一版草案.csv`
- 新增 `project_maintainers/data/active/master-data/2026-04-01_原料主檔最低版本草案.csv`
- 更新 `doc/architecture/data/shared_key_contract.md`
- Focused validation: `npm run build:api` -> PASS
- Focused validation: `npm run test:recipe-owner --workspace @ivyhouse/api` -> PASS
- Focused validation: `cd apps/api && npm run build && node --test test/master-data-active-surface.test.js` -> PASS
- Attempted validation: `npm run test:daily-ops:regression --workspace @ivyhouse/api` -> BLOCKED (`psql` not installed)
- Attempted validation: `cd apps/api && node test/production-plan-rerun-regression-smoke.js` -> BLOCKED (`DATABASE_URL` target 127.0.0.1:55432 unavailable)

### 2026-04-07 Slice 7 evidence

- 新增 `apps/api/scripts/migration-preflight.js`
- 新增 `apps/api/scripts/migration-replay-drill.js`
- 新增 `apps/api/test/migration-preflight.test.js`
- 更新 `apps/api/package.json`
- 更新 `package.json`
- 更新 `.github/workflows/ci.yml`
- 更新 `doc/architecture/flows/migration_governance_and_deployment_replay.md`
- 更新 `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- 更新 `doc/architecture/decisions/ci_and_env_governance_baseline.md`
- Focused validation: `cd apps/api && node scripts/migration-preflight.js --help` -> PASS
- Focused validation: `cd apps/api && node scripts/migration-replay-drill.js --help` -> PASS
- Focused validation: `cd apps/api && node --test test/migration-preflight.test.js` -> PASS
- Executable validation: local user-owned PostgreSQL 15 on `127.0.0.1:55432` -> `npm run prisma:migrate:deploy` PASS
- Executable validation: local user-owned PostgreSQL 15 on `127.0.0.1:55432` -> `npm run preflight:migration` PASS (`expectedMigrationCount=4`, `appliedMigrationCount=4`, `deploymentNeeded=false`)
- Executable validation: local user-owned PostgreSQL 15 on `127.0.0.1:55432` -> `npm run drill:migration-replay` PASS (`migrate deploy` / `seed` / `preflight` / `inventory opening balance smoke` / `daily ops mainline smoke` 全數通過)
- Security hardening validation: `MIGRATION_PREFLIGHT_TARGET=production npm run drill:migration-replay` -> FAIL-CLOSED，需顯式 `ALLOW_PRODUCTION_REPLAY_DRILL=true`
- Reviewer preflight: `python .github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py --json` -> READY
