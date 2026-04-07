# Idx-011: Prisma migration 衛生與 release-safe schema path 收斂 - Execution Log

> 建立日期: 2026-04-02
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-011`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-011_plan.md`
- log_file_path: `doc/logs/Idx-011_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

恢復正式 `prisma migrate deploy` 路徑，消除 migration hygiene blocker，讓 release、smoke 與 bootstrap 不再依賴 `db push` workaround。

### Scope

- 盤點 Prisma migration 目錄與 schema path
- 收斂 test bootstrap 與 release bootstrap 的界線
- 建立 migration hygiene 決策與驗證 evidence

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | copilot-cli |
| security_reviewer_tool | Explore |
| qa_tool | Explore |
| last_change_tool | copilot-cli |
| qa_result | PASS_WITH_RISK |
| commit_hash | pending |

## 🚦 FORMAL_WORKFLOW_GATES

| Gate | Status | Summary | Timestamp |
|------|--------|---------|-----------|
| Preflight | PASS | 已以 workspace-local PostgreSQL 建立隔離驗證環境，補齊 `DATABASE_URL` 驗證前提 | 2026-04-02 |
| Research | PASS | 已確認空的 draft migration 目錄是 `migrate deploy` 的直接 blocker | 2026-04-02 |
| Maintainability | PASS | 已收斂為單一正式 migration 路徑，移除 smoke 對 `db push` workaround 的依賴 | 2026-04-02 |
| UI-UX | N/A | 非前端任務 | 2026-04-02 |
| Evidence | PASS | 乾淨測試 DB 上 `inventory-count-api-smoke` 已於正式 `migrate deploy` 路徑下通過 | 2026-04-02 |
| Security | PASS_WITH_RISK | 正式 migration path 已恢復，但部署環境、約束完整性與 governance 文件仍待補齊 | 2026-04-02 |
| Domain | PASS_WITH_RISK | 與 bootstrap 策略一致，但正式部署環境與 intake 前置表存在性仍待驗證 | 2026-04-02 |
| Plan Validator | PASS | 實際變更維持在 migration 目錄與 smoke 驗證路徑，符合 file scope | 2026-04-02 |

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| N/A | N/A | N/A | 已完成正式執行 kickoff：確認 shell 缺 `DATABASE_URL`，並定位 PostgreSQL 15 server binary 可用 | 2026-04-02 |

## 🆕 2026-04-02 Kickoff 摘要

- 已確認 `apps/api/prisma/migrations/20260401183000_daily_ops_persistence_draft/` 存在。
- 已重現目前 shell 執行 `npm run prisma:migrate:deploy` 時首先會因缺少 `DATABASE_URL` 失敗。
- 已確認本機可用 server binary：`/usr/lib/postgresql/15/bin/initdb`、`/usr/lib/postgresql/15/bin/pg_ctl`。
- 下一步是建立隔離測試 DB，取得 `migrate deploy` 在實際資料庫上的直接失敗證據。

## 🆕 2026-04-02 執行結果

- 已建立 workspace-local PostgreSQL 測試叢集，port `55432`。
- 已在乾淨 DB 上重現 Prisma `P3015`，直接指出缺少 `prisma/migrations/20260401183000_daily_ops_persistence_draft/migration.sql`。
- 已移除空的 `20260401183000_daily_ops_persistence_draft/` 目錄。
- 已將 `apps/api/test/inventory-count-api-smoke.js` 從 `prisma db push` 改回 `prisma migrate deploy`。
- focused validation：`DATABASE_URL=postgresql://postgres@127.0.0.1:55432/ivyhouse_api_test?schema=public node test/inventory-count-api-smoke.js` 回傳 `PASS`。

## 🆕 2026-04-02 修正輪判定

- 針對 follow-up review findings 重新檢查後，未新增 `Idx-011` 程式碼修正。
- 本 work unit 保留的主要風險改為部署級 replay 與 migration governance，不屬本輪 runtime 缺陷修正範圍。

## ✅ QA_SUMMARY

- 結論：PASS_WITH_RISK
- 風險：目前驗證基於 workspace-local PostgreSQL，不等於正式部署環境；正式 migration governance 與 deployment-level replay 仍待後續補強
- 後續事項：補 Security / Domain review，並在後續 deploy runbook 中固化本次 migration hygiene 結論

## 🔎 CROSS_QA_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：work unit 邊界與驗證順序正確；focused smoke 已回到正式 `migrate deploy` 路徑；但證據仍以 workspace-local PostgreSQL 為主，未覆蓋正式部署環境 replay
- 殘餘風險：正式部署環境的 migration history、舊資料與多人協作衝突仍待後續驗證

## 🔐 SECURITY_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：空 draft migration blocker 已清除；但 migration 仍假設部分既有表存在，且 schema 約束與 migration governance 文件尚未完整補齊
- 殘餘風險：若正式環境前置表或部署流程與 smoke 環境不同，仍可能在 replay 時失敗

## 🧭 DOMAIN_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：seed/bootstrap 策略與正式 `migrate deploy` 路徑已一致；inventory smoke 能支撐 daily ops 基線；但正式開帳與部署情境仍未在真實環境驗證
- 殘餘風險：deployment-level bootstrap 仍需在後續 runbook 與環境演練中補足

## 🔁 FOLLOW_UP_TASKS

- `Idx-019`：Migration governance 與 deployment replay 補強

## 🏁 COMPLETION_MARKERS

- `[ENGINEER_DONE]`: present
- `[QA_DONE]`: present
- `[FIX_DONE]`: not-required

## 📎 EVIDENCE

- PTY debug: pending
- PTY live: pending
- 其他 evidence: `npm run prisma:migrate:deploy` 在乾淨 DB 上重現 Prisma `P3015`；修正後 `node test/inventory-count-api-smoke.js` 回傳 `PASS`

### 2026-04-02 最終 QA rerun

- 乾淨測試 DB 上重新執行 `node test/inventory-count-api-smoke.js`，結果 `PASS`
- 確認 `Idx-011` 的正式 migration path 仍為 inventory smoke 的前置步驟，未被後續修正輪破壞