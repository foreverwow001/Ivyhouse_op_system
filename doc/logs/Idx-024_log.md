# Idx-024: Go-Live 後高風險補強 — E2E 場景擴充、運維預案與用戶操作手冊 - Execution Log

> 建立日期: 2026-04-04
> 最近更新: 2026-04-08
> 狀態: QA

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-024`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-024_plan.md`
- log_file_path: `doc/logs/Idx-024_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

把 `Idx-024` 從泛化 post-launch backlog 收斂為可直接派工的高風險補強 sequence，並凍結優先順序：E2E 邊界場景、運維預案、手冊。

### Scope

- E2E 邊界場景矩陣與 executable evidence gap inventory
- 正式環境運維預案（hosted preflight readback、backup / restore、health / escalation）
- 中文版操作手冊與排故指引的分期交付策略

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | GitHub Copilot |
| security_reviewer_tool | copilot-cli-reviewer（direct one-shot prompt） |
| qa_tool | copilot-cli-reviewer（direct one-shot prompt） + targeted smoke + evidence readback |
| last_change_tool | GitHub Copilot |
| qa_result | PASS_WITH_RISK |
| commit_hash | pending |

## 📝 PLANNING_REFINEMENT

### 本輪決策

1. `Idx-024` 不再以「E2E + 運維 + 手冊」三件事同時啟動，而是改成 slice sequence。
2. Active slice 固定為 `E2E 邊界場景矩陣 + executable evidence inventory`。
3. 運維預案優先承接 `Idx-023` 已完成的 GitHub-hosted `release-preflight` artifact 與 staging binding，先做 readback / runbook，不直接假裝 production 接線已完成。
4. 中文版手冊降到 Slice 3，只承接已凍結流程與 runbook，不與高風險驗證並行。

### Slice Sequence Snapshot

| Slice | 狀態 | 說明 |
|---|---|---|
| Slice 1 | Completed | E2E 邊界場景矩陣、owner mapping、executable / manual drill 分流 |
| Slice 2 | Completed | hosted preflight readback、backup / restore matrix、health / escalation runbook |
| Slice 3 | Completed | intake / daily ops / rollback / preflight 中文手冊 |

### Upstream Closure Confirmed

- `Idx-023` GitHub-hosted `release-preflight` 已於 run `24097414322` 成功完成。
- staging environment 已建立三個 bindings：`DATABASE_URL`、`ADMIN_DATABASE_URL`、`NEXT_PUBLIC_PORTAL_API_BASE_URL`。
- hosted artifact `migration-preflight-staging` 已存在，artifact id `6312520463`，報告摘要為 `status=pass`、`target=staging`、`expectedMigrationCount=4`、`appliedMigrationCount=0`、`deploymentNeeded=true`。
- 首次 hosted run `24097220713` 失敗原因已定位並修正：workflow 內 `MIGRATION_PREFLIGHT_OUTPUT` 使用錯誤相對路徑；fix commit 已推上 `main`。

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| plan-refinement | `doc/plans/Idx-024_plan.md` | PASS | 已將 post-launch 高風險補強拆成三個 slices，並凍結 active slice 與優先順序 | 2026-04-07 18:30 UTC |
| evidence-readback | GitHub-hosted `release-preflight` | PASS | 已完成 staging environment bindings、hosted run、artifact download 與 report readback | 2026-04-07 18:30 UTC |

## 🚚 EXECUTION_UPDATES

### Slice 1 — Edge-path matrix 與 executable evidence 對齊

- 新增 `doc/architecture/flows/post_launch_edge_path_matrix.md`，把 opening balance、production-planning、inventory-count、intake、ledger / audit、hosted preflight 六個高風險面收斂成單一矩陣。
- 已把每個場景標定為 `Executable smoke`、`Hosted executable + readback` 或後續 `Controlled manual drill`，避免把 runbook 類缺口誤判成 runtime gap。
- `intake unresolved confirm` 原本只有 authority contract，現已在 `apps/api/test/intake-api-smoke.js` 補 negative-path smoke：fixture 仍有 open exceptions 時，confirm 必須回 `409` 與 `INTAKE_BATCH_HAS_OPEN_EXCEPTIONS`。
- Focused validation：`cd apps/api && npm run build && node test/intake-api-smoke.js` -> PASS

### Slice 2 — Hosted preflight / backup / health runbook

- 新增 `doc/architecture/flows/post_launch_ops_runbook.md`，把 `release-preflight` hosted readback、staging 特例判讀、production backup / restore 責任矩陣、health / readiness contract 與 escalation tree 收斂為單一 runbook。
- runbook 明確標示目前 repo 沒有正式 `/healthz` / `/readyz` endpoint，因此 readiness 只能以 build、startup 與 targeted smoke 成立，不得假裝有 HTTP probe。
- production backup / restore 保持 fail-closed：若備份工具、restore owner、RTO/RPO 或 rehearsal evidence 缺失，即不得進 production release；目前 repo authority 尚未持有該 rehearsal evidence，因此不得把 Slice 2 文件誤讀成 production restore sign-off。
- 已新增 `doc/architecture/flows/production_backup_restore_signoff_checklist.md` 作為 external infra owner 正式回填入口；在該 checklist 仍有 `pending` 前，`Idx-024` 不得從 `QA` 推進到 `Completed`。

### Slice 3 — 繁中操作手冊

- 新增 `doc/architecture/flows/post_launch_operator_handbook_zh_tw.md`，提供 intake、daily ops、release-preflight 與 rollback 的繁中操作順序、判讀規則與值班交接清單。
- 手冊只承接已凍結的 Portal surface 與既有 rollback policy，不宣稱尚未存在的 runtime 能力。

## ✅ QA_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：QA one-shot reviewer 判定三個 slices 的核心交付與最小 executable evidence 皆成立；`intake unresolved confirm` fail-closed 已有 focused smoke PASS evidence
- 風險：production backup / restore 的具體工具與 rehearsal 證據仍需外部 infra owner 補齊；ledger / audit 跨模組 fail-injection 也尚未獨立成專用 suite
- 後續事項：保留 pre-production 必填的 backup/restore sign-off，並等待 Domain reviewer 取得可用結論

## 🔐 SECURITY_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：Security one-shot reviewer 確認 intake confirm/open exception、hosted preflight bindings/artifact、backup/restore、health endpoint 缺失與文件資訊揭露風險為主要 attack surface；文件未要求暴露 secrets，runbook 亦已明示 production restore 尚未 sign-off
- 已關閉事項：reviewer 提出的 `intake confirm fail-closed` negative smoke 缺口，已由 `cd apps/api && npm run build && node test/intake-api-smoke.js` PASS 證明成立
- 殘餘風險：production backup/restore rehearsal 仍為 production 前 P0 外部阻斷；`/healthz` / `/readyz` 與 artifact provenance 屬後續 hardening 項

## 🧭 DOMAIN_REVIEW_STATUS

- 狀態：PASS_WITH_RISK
- 原因：`Idx-032` 已修復 reviewer tooling 與 Domain contract；重新執行 read-only Domain review 後，未再發現 repo 內 domain blocker
- 影響：`Idx-024` 的 repo 內交付與 Domain 面已完成收口；目前唯一剩餘阻斷為 external infra backup/restore sign-off checklist 仍為 `pending/fail`
- 下一步：由 external infra owner 補齊 backup/restore rehearsal evidence、RTO/RPO 與三方 final sign-off；未補齊前不得把 `Idx-024` 宣告為 `Completed`

## 🚧 CURRENT BLOCKER CONSOLIDATION

### 2026-04-08 truth-first 收口

- 本輪未取得新的 external infra evidence，因此 `doc/architecture/flows/production_backup_restore_signoff_checklist.md` 的既有 `fail/pending` 狀態不變，`Idx-024` 也不得從 `QA` 推進到 `Completed`。
- `Idx-037` 已提供 repo-native technical block：production `release-preflight-guard` 會直接讀取 checklist 的 `可允許 production promote` 列；只要該列仍為 `fail`，production release-preflight 就會在 environment-bound preflight 前 fail-closed。
- 目前仍待 external infra owner / platform owner 補齊的事實與平台證據包括：最近成功備份時間、備份保留策略、RTO、RPO、restore rehearsal 日期/結果/證據、三方 final sign-off，以及若 branch protection / required reviewers 被視為正式 production gate 一部分時的對應平台 readback。
- 本輪只做 docs/status consolidation，不回填任何新的外部事實，也不把 repo-native guard 誤寫成 external sign-off 完成。

## 🏁 COMPLETION_MARKERS

- `[ENGINEER_DONE]`: present
- `[QA_DONE]`: present
- `[FIX_DONE]`: present

## 📎 EVIDENCE

- `doc/implementation_plan_index.md`
- `doc/plans/Idx-024_plan.md`
- `doc/logs/Idx-023_log.md`
- `doc/architecture/flows/post_launch_edge_path_matrix.md`
- `doc/architecture/flows/post_launch_ops_runbook.md`
- `doc/architecture/flows/post_launch_operator_handbook_zh_tw.md`
- `apps/api/test/intake-api-smoke.js`
- `apps/api/test/inventory-opening-balance-api-smoke.js`
- `apps/api/test/production-plan-rerun-regression-smoke.js`
- `apps/api/test/inventory-count-api-smoke.js`
- `apps/api/test/daily-ops-mainline-e2e-smoke.js`
- GitHub Actions run `24097414322` -> `release-preflight=success`, `quality-gate=success`
- GitHub artifact `migration-preflight-staging` (`artifact_id=6312520463`)
- Downloaded report: `/tmp/ivyhouse-hosted-artifacts/migration-preflight-staging-6312520463/migration-preflight-report.json`
- Hosted report summary: `status=pass`, `target=staging`, `expectedMigrationCount=4`, `appliedMigrationCount=0`, `deploymentNeeded=true`
- Focused validation: `cd apps/api && npm run build && node test/intake-api-smoke.js` -> PASS
- QA one-shot reviewer: `PASS_WITH_RISK`（direct one-shot prompt）
- Security one-shot reviewer: `PASS_WITH_RISK`（direct one-shot prompt）
- Domain one-shot reviewer：`PASS_WITH_RISK`（read-only Domain review 已確認 repo 內無持續阻斷的 domain blocker）
- `doc/architecture/flows/production_backup_restore_signoff_checklist.md`：`Pre-Production Decision=fail`，`Final Sign-off=pending`
- `Idx-037` repo-native guard binding：production `release-preflight-guard` 直接讀取 `production_backup_restore_signoff_checklist.md` 的 `可允許 production promote` 列；當前值仍為 `fail`，因此 production release-preflight 維持 technical fail-closed
