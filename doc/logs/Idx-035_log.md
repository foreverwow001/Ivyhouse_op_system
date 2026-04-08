# Idx-035: 單人營運正式層 release-preflight 觸發者身份與角色邊界 - Execution Log

> 建立日期: 2026-04-08
> 最近更新: 2026-04-08
> 狀態: QA

---

## ARTIFACT_CHAIN

- task_id: `Idx-035`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-035_plan.md`
- log_file_path: `doc/logs/Idx-035_log.md`

## WORKFLOW_SUMMARY

### Goal

以 docs-only governance 方式補齊 `single-operator-production` 的 `release-preflight` 觸發者身份與角色邊界，避免 `workflow_dispatch`、一般 GitHub surface 或既有系統管理權限被誤解成正式 trigger authority。

### Scope

- 新增 `Idx-035` plan / log artifact
- 在 roles authority 補 release assignment label 語意
- 在 single-operator contract 與 post-launch runbook 補 `authorized actor boundary`
- 在 CI / env baseline 補 cross-reference，避免讀者誤讀

## EXECUTION_SUMMARY

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

## EXECUTION_NOTES

### 本輪執行前提

1. `Idx-034` 已建立單人營運正式層 deploy / backup / rollback 的最小 contract，但未單獨明文化 `release-preflight` 誰能按、誰只能支援判讀。
2. `Idx-024` external infra backup / restore blocker 仍未解除；production release 相關 wording 只能收斂 fail-closed 邊界，不能宣稱 sign-off 完成。
3. 本輪限定為 docs-only governance，只允許修改使用者指定的 7 份白名單 markdown。

### 本輪決策落地

1. `Release owner`、`Release operator` 被明確定義為 release assignment label，不是新的 app RBAC 正式角色，也不形成第二套平行角色模型。
2. staging `release-preflight` 只能由被指派的 `Release operator` 觸發；`Backend owner` 只協助 artifact / readback 判讀，不自動取得 trigger authority。
3. production `release-preflight` 只能由被指派的 `Release owner` 觸發；若 backup / restore checklist 未完整，則 production `release-preflight` 不得按下，必須 fail-closed。
4. `Release assignment` 的最小留痕欄位已收斂為：`指派人`、`被指派人`、`目標環境`、`有效範圍`、`時間戳`；缺任一欄時，assignment 不得視為正式成立。
5. 單人營運可由同一人同時承擔多個 assignment，但 release pack / artifact / log 仍需保留 acting assignment 與責任留痕。

### QA Compliance 例外留痕

- `qa_compliance`: `⚠️ 例外：使用者已明確同意以獨立 reviewer agent 作為例外；本次 Engineer 修補只承接既有 reviewer findings，且不自行做最終 QA approval。`

### Reviewer 正式結果

1. Domain reviewer 結論為 `PASS_WITH_RISK`：release assignment label 與 authorized actor boundary 現已寫清楚，但本 slice 仍屬 governance-only authority，後續引用時仍應同步回指 `single_operator_formal_deploy_backup_rollback_contract.md` 與 `post_launch_ops_runbook.md`。
2. Security reviewer 結論為 `PASS_WITH_RISK`：主要殘餘風險為無 GitHub enforcement、`workflow_dispatch` 仍是 open surface、`Idx-024` external infra checklist 仍需人工 fail-closed。
3. QA reviewer 結論為 `PASS_WITH_RISK`：主要殘餘風險為 assignment 指派媒介未統一、ci baseline cross-reference 長句可讀性弱；本輪修補限定在已核准 docs-only scope。

### 本輪未做事項

- 未新增 GitHub 權限 enforcement、workflow yaml technical guard、environment approval 或 branch protection。
- 未把 `管理員` / `系統管理` 寫成 production trigger 的自動放行來源。
- 未新增 production sign-off，也未解除 `Idx-024` external infra blocker。
- 未回填 backup tooling 真實值、restore rehearsal evidence 或任何外部 infra 證據。

## VALIDATION_SUMMARY

- `get_errors`（`doc/implementation_plan_index.md`、`doc/plans/Idx-035_plan.md`、`doc/logs/Idx-035_log.md`、`doc/architecture/roles/README.md`、`doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md`、`doc/architecture/flows/post_launch_ops_runbook.md`、`doc/architecture/decisions/ci_and_env_governance_baseline.md`） -> 全數 `No errors found`
- `grep_search Release owner|Release operator|authorized actor boundary`（`Idx-035` artifact、roles authority、single-operator contract、post-launch runbook、CI / env baseline） -> 關鍵用語皆存在；staging / production 邊界、assignment label 定位與 fail-closed wording 一致

## RESIDUAL_RISKS

- 無 GitHub enforcement；若 assignment 與實際 GitHub 權限未對齊，仍需後續治理承接。
- `workflow_dispatch` 仍是 open surface；本輪只補 authority cross-reference，不能單靠文檔阻止錯誤操作。
- `Idx-024` external infra checklist 仍需人工 fail-closed；backup / restore evidence 未完整前，production 依舊不得 promote。
- assignment 指派媒介未統一；跨 artifact 的指派留痕仍可能增加操作理解成本。
- ci baseline cross-reference 長句可讀性弱；後續維護時仍有誤讀風險。

## CHANGED_FILES

| 檔案 | 本 slice 角色 |
|------|---------------|
| `doc/implementation_plan_index.md` | 記錄 `Idx-035` 的 docs-only governance 狀態與 authority 輸出 |
| `doc/plans/Idx-035_plan.md` | 收斂 scope、review requirement、qa_compliance 例外與 reviewer verdict 留痕 |
| `doc/logs/Idx-035_log.md` | 記錄 reviewer findings 補修、focused validation 與 residual risks |
| `doc/architecture/roles/README.md` | 定義 `Release owner` / `Release operator` 的 release assignment label 邊界與 production fail-closed 條件 |
| `doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md` | 明確化 authorized actor boundary、`Release assignment` 最小欄位與 fail-closed 契約 |
| `doc/architecture/flows/post_launch_ops_runbook.md` | 對齊 staging / production 觸發 wording，補值班留痕欄位與前置檢查 |
| `doc/architecture/decisions/ci_and_env_governance_baseline.md` | 明示 env binding gate 不等於 `Release assignment` 已成立 |