# Idx-022: Production-planning 完整 approval persistence 與 approver boundary 收斂 - Execution Log

> 建立日期: 2026-04-03
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-022`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-022_plan.md`
- log_file_path: `doc/logs/Idx-022_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

補齊 production-planning 的完整 approval persistence，並完成 deploy preflight 實地記錄。

### Scope

- 落 plan / rerun approval state 與決策端點
- 收斂 `管理員` 最終 approver 邊界
- 補 focused validation 與 deploy preflight evidence

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | copilot-cli |
| security_reviewer_tool | Explore |
| qa_tool | Explore |
| last_change_tool | copilot-cli |
| qa_result | PASS_WITH_RISK |
| commit_hash | N/A (workspace-no-git) |

## 🚦 FORMAL_WORKFLOW_GATES

| Gate | Status | Summary | Timestamp |
|------|--------|---------|-----------|
| Preflight | PASS | `Idx-022` 已按 `Idx-018` operating envelope 完成 local/test-cluster deploy preflight：drop/create DB、`migrate deploy`、`seed`、inventory smoke、mainline、regression 皆通過 | 2026-04-03 |
| Research | PASS | 已確認 production-planning 原本只有 formal principal；本輪以 `ProductionPlanHeader` + `BomReservationRun` 落 approval persistence，未開平行 approval table | 2026-04-03 |
| Maintainability | PASS | approval 欄位集中於既有 plan/run owner model，未引入平行狀態機；service 層已補 supervisor approver 與 approved revision source 檢查 | 2026-04-03 |
| UI-UX | N/A | 本輪先處理 backend / release governance | 2026-04-03 |
| Evidence | PASS | `npm run build`、`node test/production-plan-rerun-regression-smoke.js`、`node test/daily-ops-mainline-e2e-smoke.js`、deploy preflight 與 DB readback 全數成立 | 2026-04-03 |
| Security | PASS_WITH_RISK | Explore final review 確認 rejection 不寫 ledger、admin-only approver 不成立、service 層要求 supervisor；殘餘 revision 鏈長與 role 交集政策待後續治理 | 2026-04-03 |
| Domain | PASS_WITH_RISK | `管理員` 僅作 requestor，最終 approval 需 `主管`；single-person override 已持久化並有 regression 證據；admin+supervisor 交集政策仍待營運明文化 | 2026-04-03 |
| Plan Validator | PASS | 本輪 scope 完整對齊 `Idx-018` operating envelope 與 user 指示，並已補本機 / 測試叢集 preflight record | 2026-04-03 |

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| Explore | Idx-022 design sanity check | completed | 唯讀確認 approval persistence 最小掛點應落 `ProductionPlanHeader` / `BomReservationRun`，且最終 approver 必須為 `主管` | 2026-04-03 |
| Explore | Idx-022 final cross-review | completed | 最終 review 無 blocking findings；確認 rejection path、singlePersonOverride、service 邊界與 revision source 檢查皆已收斂 | 2026-04-03 |

## ✅ QA_SUMMARY

- 結論：PASS_WITH_RISK
- 風險：production-planning approval persistence 與 deploy preflight 已完成，但 revision 鏈長治理與 admin+supervisor 交集政策仍待後續明文化
- 後續事項：將 residual risk 轉交後續治理 work unit；本輪不阻斷 `Idx-018` operating envelope 內的 local/test-cluster preflight 成立

## 🏁 COMPLETION_MARKERS

- `[ENGINEER_DONE]`: present
- `[QA_DONE]`: present
- `[FIX_DONE]`: present

## 📎 EVIDENCE

- PTY debug: `npm run build`、`node test/production-plan-rerun-regression-smoke.js`、`node test/daily-ops-mainline-e2e-smoke.js`
- PTY live: `psql postgresql://vscode@127.0.0.1:55432/postgres -c 'DROP DATABASE IF EXISTS ivyhouse_api_test;' -c 'CREATE DATABASE ivyhouse_api_test;'`、`npm run prisma:migrate:deploy`、`npm run prisma:seed`、`npm run test:inventory:smoke`、`npm run test:daily-ops:mainline`、`npm run test:daily-ops:regression`
- 其他 evidence: `_prisma_migrations` readback 顯示 `20260403154000_idx022_production_planning_approval_persistence` 已套用；`ProductionPlanHeader` readback = `APPROVED x2`；`BomReservationRun` readback = `PLAN_CREATED APPROVED x1`、`PLAN_REVISED APPROVED x1`、`MANUAL_RERUN APPROVED x1`、`MANUAL_RERUN REJECTED x1`；`AuditLog` readback 已出現 `production-plan.approved`、`production-plan.bom-rerun.approved`、`production-plan.bom-rerun.rejected`

## 🆕 2026-04-03 Residual Risk Closure Addendum

- 使用者已明確決策：production-planning revision 鏈 Phase 1 不設硬性上限，保留完整歷史；若鏈長失控，改由人工覆核與新 plan 起點處理。
- 使用者已明確決策：`admin + supervisor` 同帳號在高風險業務 approval 一律以 `主管` 身分認定；`管理員` 身分不得放寬 approver 邊界。
- 使用者已明確決策：Phase 1 單人營運例外只允許依 `主管` 邊界成立的 `singlePersonOverride`，不得把 `管理員` 視為 override 合法性來源。
- 已回寫權威文件：`doc/architecture/roles/README.md`、`doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`、`doc/architecture/flows/daily_ops_engineering_breakdown.md`、`doc/architecture/decisions/README.md`。
- 結論：`Idx-022` 原先列管的兩項 residual governance gap 已完成明文化，不再作為本 work unit 未解風險。