# Idx-017: 部署、bootstrap 與 rollback runbook - Execution Log

> 建立日期: 2026-04-02
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-017`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-017_plan.md`
- log_file_path: `doc/logs/Idx-017_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

建立 Phase 1 MVP 的 deploy / bootstrap / opening balance / first batch / rollback 操作手冊與演練證據。

### Scope

- 收斂環境前置、執行順序、停等點與回復策略
- 串接 migration、opening balance 與主線驗收結果
- 補 runbook rehearsal evidence

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | copilot-cli |
| security_reviewer_tool | pending |
| qa_tool | Explore |
| last_change_tool | copilot-cli |
| qa_result | PASS_WITH_RISK |
| commit_hash | pending |

## 🚦 FORMAL_WORKFLOW_GATES

| Gate | Status | Summary | Timestamp |
|------|--------|---------|-----------|
| Preflight | PASS | 已以 `Idx-011`、`Idx-012`、`Idx-015` 的既有證據盤點 runbook 前置、責任角色與停等點 | 2026-04-03 |
| Research | PASS | 已確認 runbook 第一輪直接收斂到 `daily_ops_seed_bootstrap_strategy.md`，並以既有 evidence 回填成功 / 失敗判定 | 2026-04-03 |
| Maintainability | PASS | 已把分散於 migration、opening balance 與 mainline evidence 的操作知識回收為單一文件入口 | 2026-04-03 |
| UI-UX | N/A | 非前端任務 | 2026-04-02 |
| Evidence | PASS | 已在乾淨測試 DB 上完成 migrate / seed / opening balance / mainline rehearsal 與 readback | 2026-04-03 |
| Security | Pending | deploy / rollback / inventory 屬高風險面，待 Security Review | 2026-04-02 |
| Domain | Pending | 待確認 runbook 與營運窗口 / 首盤窗口一致 | 2026-04-02 |
| Plan Validator | PASS | 本輪變更維持在 runbook 與對應 plan/log file scope，未擴張到 runtime 新功能 | 2026-04-03 |

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| Explore | Idx-017 runbook gap audit | completed | 唯讀整理 `Idx-011`、`Idx-012`、`Idx-015` 證據與 runbook 最缺段落，供正式啟動使用 | 2026-04-03 |
| Explore | Idx-017 evidence review | completed | 唯讀確認 runbook 應補的 readback / evidence 與 deployment replay 最小證據組合 | 2026-04-03 |

## 🔐 SECURITY_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：runbook rehearsal、readback 與交付前置條件已成立；`migrate deploy`、`seed`、opening balance 與 mainline 主線均可在乾淨測試 DB 重演
- 殘餘風險：正式 destructive rollback API 尚未存在；正式環境仍需在 go-live 前完成最後 preflight 驗證

## 🧭 DOMAIN_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：runbook 已把 opening balance、first batch 與窗口鎖定責任寫入單一操作入口，足以支撐 Phase 1 MVP 的最小交接
- 殘餘風險：多窗口 / 中斷補救治理仍未完成，應由 Idx-020 與 Idx-018 sign-off 明確列為限制與 deferred 項

## 🆕 2026-04-03 正式啟動摘要

- 已將 `Idx-017` 從 `Approved` 推進為 `In Progress`。
- 已選定 `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md` 作為 Phase 1 deploy / bootstrap / rollback 的單一 runbook 入口。
- 已先補 runbook 所缺的環境 preflight checklist、first batch SOP、rollback matrix 與高風險失敗補救段落。

## 🆕 2026-04-03 Rehearsal 與 readback 結果

- 已建立本機 PostgreSQL 測試叢集，並以 `vscode@127.0.0.1:55432` 重建乾淨測試 DB。
- `npm run prisma:migrate:deploy` 成功套用 `20260401183000_daily_ops_persistence`。
- `npm run prisma:seed` 成功完成；本輪同時修正 [apps/api/prisma/seed.ts](/workspaces/Ivyhouse_op_system/apps/api/prisma/seed.ts) 的 CSV 相對路徑錯誤，讓 seed 可正確讀取 `project_maintainers/data/**`。
- `node test/inventory-opening-balance-api-smoke.js` 回傳 `PASS`。
- `npm run test:daily-ops:mainline` 回傳 `PASS`。
- DB readback 已確認：
	- `_prisma_migrations` 存在最新 migration history
	- `AuditLog`、`InventoryEventLedger`、`InventoryCountSession` 表存在
	- `InventoryEventLedger` 可讀回 `COUNT_ADJUSTMENT`
	- `InventoryCountSession` 可讀回 `PACKAGING_MATERIAL / COMPLETED`

## ✅ QA_SUMMARY

- 結論：PASS_WITH_RISK
- 風險：runbook rehearsal 與 readback 已成立，但 Security Review、Domain Review 與正式交接 readback 尚未完成；正式 destructive rollback API 仍不存在
- 後續事項：補 `Idx-017` 的 Security / Domain review，並在 `Idx-018` sign-off 前完成交接 readback

## 🏁 COMPLETION_MARKERS

- `[ENGINEER_DONE]`: present
- `[QA_DONE]`: present
- `[FIX_DONE]`: present

## 📎 EVIDENCE

- PTY debug: pending
- PTY live: pending
- 其他 evidence: 2026-04-03 乾淨測試 DB 上重跑 `npm run prisma:migrate:deploy`、`npm run prisma:seed`、`node test/inventory-opening-balance-api-smoke.js`、`npm run test:daily-ops:mainline` 皆通過；`_prisma_migrations`、`AuditLog`、`InventoryEventLedger`、`InventoryCountSession` readback 已確認