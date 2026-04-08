# Idx-034: 單人營運正式層最小 deploy / backup / rollback contract - Execution Log

> 建立日期: 2026-04-08
> 最近更新: 2026-04-08
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-034`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-034_plan.md`
- log_file_path: `doc/logs/Idx-034_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

建立單人營運正式層的最小 formal deploy / backup / rollback contract 單一入口，讓後續 plan / log / review package 能以同一份 authority 文檔引用正式最低線。

### Scope

- 新增一份 flows authority 文檔
- 更新 flows README 導覽
- 在 implementation index 新增 Idx-034
- 建立 Idx-034 plan / log artifact

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | GitHub Copilot |
| last_change_tool | GitHub Copilot |
| qa_tool | Ivy QA Reviewer |
| latest_qa_review_outcome | PASS_WITH_RISK |
| security_review_outcome | PASS_WITH_RISK |
| domain_review_outcome | PASS_WITH_RISK |
| runtime_code_changed | no |
| commit_hash | pending |

## 📝 EXECUTION_NOTES

### 本輪執行前提

1. `Idx-033` 已完成 operating mode 與 provider baseline，正式採納 `單人營運正式層` 與 Supabase provider baseline。
2. `Idx-024` 仍停在 external infra backup / restore sign-off fail-closed 狀態；本輪只能把最小 contract 單一入口落地，不能自行解除 blocker。
3. 本輪限定為 docs-only governance，只允許修改 5 份白名單 markdown，不能觸碰 runtime code、schema、migration、deploy script 或其他文件。

### 本輪決策落地

1. 新增 `single_operator_formal_deploy_backup_rollback_contract.md`，把單人營運正式層的固定 deploy path、backup / restore 最小 contract、rollback 限制、secrets / audit 最低關係與 external infra fail-closed 邊界收斂成單一 authority 入口。
2. 新文檔明確回指 `operating_mode_and_database_provider_baseline.md`、`ci_and_env_governance_baseline.md`、`post_launch_ops_runbook.md`、`production_backup_restore_signoff_checklist.md` 與 `migration_governance_and_deployment_replay.md`，避免建立第二套平行 runbook。
3. `doc/architecture/flows/README.md` 新增正式導覽入口，讓後續讀者可以先找到最小 contract，再回到既有 runbook / checklist / governance baseline。
4. `doc/implementation_plan_index.md`、`doc/plans/Idx-034_plan.md` 與本 log 誠實記錄本輪只完成 authority 收斂，不包含 automation 或 sign-off 完成宣告。

### Reviewer 正式結果

1. Domain reviewer 結論為 `PASS_WITH_RISK`：目前 contract 仍較接近最小邊界宣告，尚缺獨立的 promote / cutover / post-promote readback authority；後續引用本 contract 時，仍建議同步引用 `post_launch_ops_runbook` 與 `production_backup_restore_signoff_checklist`。
2. Security reviewer 結論為 `PASS_WITH_RISK`：本 contract 屬 governance-only，沒有 infra 強制層；deploy trigger 的身份與角色邊界尚未定義，且 `Idx-024` backup / restore sign-off 仍 pending。
3. QA reviewer 結論為 `PASS_WITH_RISK`：先前 artifact 內的 reviewer pending 欄位需要回填；`flows README` 未帶 `Idx-034` tag 僅屬低風險 observation，不需要擴修。

### 本輪未做事項

- 未新增 deploy automation、Cloud Run / Cloudflare runtime 接線、workflow step 或 infra provisioning。
- 未回填 backup tooling 真實值、最近成功備份時間、RTO / RPO 或 restore rehearsal evidence。
- 未執行 restore drill、production sign-off，亦未把 reviewer `PASS_WITH_RISK` 轉換成無條件 approval 或解除任何 fail-closed blocker。
- 未解除 `Idx-024` external infra blocker。

## ✅ VALIDATION_SUMMARY

- `get_errors`（`doc/implementation_plan_index.md`、`doc/plans/Idx-034_plan.md`、`doc/logs/Idx-034_log.md`、`doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md`、`doc/architecture/flows/README.md`） -> 全數 `No errors found`
- `grep_search single_operator_formal_deploy_backup_rollback_contract.md|Idx-034|external infra blocker|release-preflight`（`doc/**`） -> 確認新 contract 已出現在 flows README、Idx-034 artifacts 與 authority 本文，且 `release-preflight` 與 `Idx-024` external infra blocker 留痕存在

## ⚠️ RESIDUAL_RISKS

- `Idx-024` 的 external infra backup / restore sign-off 仍未完成；本輪只是把 fail-closed contract 寫清楚，沒有新增任何可採信的 infra evidence。
- 目前 contract 仍偏向最小邊界宣告，尚缺獨立的 promote / cutover / post-promote readback authority；後續引用時仍應同步參照 `post_launch_ops_runbook` 與 `production_backup_restore_signoff_checklist`。
- contract 目前是 governance-only，沒有 infra 強制層；deploy trigger 的身份與角色邊界仍未定義。
- 目前仍沒有通用 destructive rollback API；application revision 可回退，不等於資料庫或 ledger 可通用回滾。
- 若後續 plan / log 只引用 runbook 或 checklist 而不回指本 contract authority，仍可能再次出現治理漂移。

## 📎 CHANGED_FILES

- `doc/implementation_plan_index.md`
- `doc/plans/Idx-034_plan.md`
- `doc/logs/Idx-034_log.md`
- `doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md`
- `doc/architecture/flows/README.md`