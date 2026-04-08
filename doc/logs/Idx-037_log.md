# Idx-037: release-preflight authorized actor boundary repo-native enforcement - Execution Log

> 建立日期: 2026-04-08
> 最近更新: 2026-04-08
> 狀態: QA

---

## ARTIFACT_CHAIN

- task_id: `Idx-037`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-037_plan.md`
- log_file_path: `doc/logs/Idx-037_log.md`

## WORKFLOW_SUMMARY

### Goal

把 `Idx-035` 的 release-preflight authorized actor boundary 從 docs-only governance 推進到 repo-native technical enforcement，並修正控制路徑，讓 workflow_dispatch 專用 guard job 在 environment-bound `release-preflight` 之前先 fail-closed 檢查 actor、`assignment_ref` 與 production checklist。

### Scope

- `.github/workflows/ci.yml` 維持 required `assignment_ref` input
- 將 guard 從 `quality-gate` 抽成 workflow_dispatch 專用的 `release-preflight-guard` job
- `release-preflight` 改以 `needs` 依賴 guard job 後，再進 environment-bound preflight
- 補 `Idx-037` plan / log / index artifact 的 sequencing 更正
- 補最小 governance cross-reference，標示 repo-native guard 與 external follow-up

## EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | GitHub Copilot |
| last_change_tool | GitHub Copilot |
| qa_tool | Ivy QA Reviewer |
| latest_qa_review_outcome | FAIL |
| security_review_outcome | PASS_WITH_RISK |
| domain_review_outcome | PASS_WITH_RISK |
| runtime_code_changed | yes |
| commit_hash | pending |

## EXECUTION_NOTES

### 本輪執行前提

1. Coordinator 已完成正式確認，且使用者明示可 autonomous execution，因此本輪直接進入實作與 focused validation。
2. 本輪 operating mode 固定為 `single-operator-production`，allowlist 採保守預設，只允許 `foreverwow001` 作為 staging / production authorized trigger actor。
3. 本輪 scope 嚴格限制在 release-preflight enforcement 與引用鏈，不擴成 full deploy automation，也不修改 roles README 或 `single_operator_formal_deploy_backup_rollback_contract.md`。
4. production backup / restore checklist 目前仍為 fail-closed，技術 guard 應穩定阻擋 production release-preflight。

### 本輪落地決策

1. `workflow_dispatch` 的 `assignment_ref` 仍只作為 evidence reference gate，不等於正式 assignment proof，也不取代既有 release assignment 最小留痕欄位。
2. guard 不再掛在 `quality-gate` 或 environment-bound job 內第一個 step，而是抽成 workflow_dispatch 專用、非 environment-bound 的 `release-preflight-guard` job，避免污染 push / pull_request 一般 CI。
3. `release-preflight` 改以 `needs: release-preflight-guard` 進入 environment-bound preflight，確保 actor / checklist fail-closed 發生在 environment assignment 之前。
4. `release-preflight` 不依賴 `quality-gate` 是本輪刻意 scope 切割；本 task 只處理 authorized actor / `assignment_ref` / production checklist gate，不把一般 CI 成功與否混進 release authority decision。
4. guard 仍以 `github.triggering_actor` 優先、fallback 到 `github.actor`，避免 re-run 或代理情境下只看單一 actor 欄位。
5. staging / production allowlist 都暫時只允許 `foreverwow001`；本輪不自動把 `ivyhousetw` 或其他支援角色加入 allowlist。
6. production 會直接讀取 `doc/architecture/flows/production_backup_restore_signoff_checklist.md`；只有 `可允許 production promote = pass` 才能放行。因目前 checklist 為 `fail`，production guard 預期穩定 deny。
7. `GITHUB_STEP_SUMMARY` 內的 `assignment_ref` 只保留 evidence reference，寫入前需對 `|`、`<`、`>`、backtick、CR、LF 做最小安全處理，並額外留下 `github.triggering_actor`、`github.actor`、`effective_actor` 以支援 rerun 稽核。
8. production checklist 讀取若發生 file-not-found 或其他 read error，guard 必須以結構化 deny 訊息 fail-closed，不能把 raw stack trace 直接寫到 stderr。

### Reviewer 正式結果

1. Domain reviewer 結論為 `PASS_WITH_RISK`：repo-native guard 的授權邊界方向正確，但 `assignment_ref` 仍僅是 evidence reference gate，且 release authority 仍須與 `single_operator_formal_deploy_backup_rollback_contract.md`、`post_launch_ops_runbook.md` 共同引用。
2. Security reviewer 結論為 `PASS_WITH_RISK`：原始實作的 summary escaping 未處理 CR/LF、checklist read error 會暴露 raw stack；actor / assignment / production checklist fail-closed 邊界本身方向正確，但 `workflow_dispatch` 與外部 release control 仍屬殘餘風險。
3. QA reviewer 當前狀態為 `FAIL`：`VALIDATION_SUMMARY` 先前仍是計畫語氣、plan/log 未回填 Domain / Security 結果，且未明示 `quality-gate` 解耦是刻意 scope 切割；本輪 follow-up 專注收口這些缺口，最終 QA approval 仍待獨立 reviewer rerun。

### 明確未完成 / 外部 follow-up

1. `assignment_ref` 不是正式 assignment proof；真正的 assignment authority 仍需依賴 release pack / 值班單或等價 artifact 的完整留痕。
2. GitHub Environment required reviewers、branch protection、org / team membership 驗證、external sign-off 平台與外部 owner 實際簽核，不是 repo 內可完整自動化的 surface；本輪也無法從 repo 內驗證其實際設定值。
3. production checklist 要解除 fail-closed，仍需外部 owner 補回 backup / restore evidence、RTO / RPO 與 restore rehearsal 證據。
4. checklist bypass path 仍屬 external / platform residual risk；本輪沒有在 repo 內假裝把這條路徑封死。
5. workflow 的 global concurrency `cancel-in-progress: true` 仍可能在同一 ref 發生新 push 時，取消進行中的 `workflow_dispatch release-preflight`；本輪不改 concurrency，只把它列為已知風險。

## VALIDATION_SUMMARY

- `staging allow`：exit code `0`；stdout 包含 `release-preflight guard passed: actor=foreverwow001 target_environment=staging assignment_ref=ops-allow-001`
- `staging deny`：exit code `1`；stderr 包含 `release-preflight guard: actor unauthorized-user is not authorized for staging`
- `production deny`：exit code `1`；stderr 包含 `release-preflight guard: production checklist deny: /workspaces/Ivyhouse_op_system/doc/architecture/flows/production_backup_restore_signoff_checklist.md reports 可允許 production promote = fail`
- `special-char + newline assignment_ref`：使用可寫測試路徑 `/tmp/idx-037-step-summary-writable.md`，exit code `0`；stdout 包含 `assignment_ref=ops|<rerun>\`tag\`\nnext-line` 的單行安全輸出；summary assignment row 為 `| assignment_ref | ops\|&lt;rerun&gt;\`tag\`\nnext-line |`，確認沒有把原始多行值原樣污染到 `GITHUB_STEP_SUMMARY`
- `summary path not writable`：使用不可寫測試路徑 `/proc/1/mem`，exit code `0`；stderr 為 `release-preflight guard: summary write skipped: path=/proc/1/mem code=EACCES`，`NO_RAW_STACK=PASS`
- `checklist file-not-found` fail-closed：暫時 rename checklist 後執行 production case，exit code `1`；stderr 為 `release-preflight guard: production checklist deny: unable to read /workspaces/Ivyhouse_op_system/doc/architecture/flows/production_backup_restore_signoff_checklist.md (ENOENT)`；`NO_RAW_STACK=PASS`
- workflow readback：`.github/workflows/ci.yml` 讀回顯示 `release-preflight-guard` job 存在於 line `87`；`release-preflight` 在 line `108` 起，line `110-111` 明確 `needs: - release-preflight-guard`；`quality-gate` 自 line `28` 起且 `QUALITY_GATE_HAS_GUARD=PASS`，確認一般 CI 不含 guard step

## RESIDUAL_RISKS

- allowlist 目前只含 `foreverwow001`，屬保守單人營運基線；若未來 production / staging 交接給其他正式 owner，仍需經權威文件與 repo guard 同步更新。
- repo-native guard 只能覆蓋 workflow 內的 technical enforcement，不能取代 GitHub Environment required reviewers、org membership 或外部 sign-off 平台控制。
- production checklist 目前為 `fail`，因此 production `release-preflight` 會被穩定阻擋；這符合 fail-closed 目標，但也代表 production promote 仍受 external blocker 限制。
- workflow 的 global concurrency `cancel-in-progress: true` 仍可能在同一 ref push 時取消進行中的 `workflow_dispatch release-preflight`；本輪未更動 concurrency，需留待後續治理判斷是否要拆分或放寬該策略。

## CHANGED_FILES

| 檔案 | 本輪角色 |
|------|----------|
| `.github/workflows/ci.yml` | 將 guard 從 `quality-gate` 抽成 `release-preflight-guard` 前置 job，並讓 `release-preflight` 以 `needs` 依賴它 |
| `doc/implementation_plan_index.md` | 更正 `Idx-037` 摘要為獨立 guard job sequencing |
| `doc/plans/Idx-037_plan.md` | 對齊獨立 guard job 與 quality-gate 解耦 |
| `doc/logs/Idx-037_log.md` | 本輪控制路徑修補與 focused validation 留痕 |
| `doc/architecture/decisions/ci_and_env_governance_baseline.md` | 補 guard job sequencing / CI 解耦 cross-reference |
| `doc/architecture/flows/post_launch_ops_runbook.md` | 補 workflow_dispatch guard job → environment-bound preflight 順序 |
| `tools/validate-release-preflight-guard.js` | 補 step summary 最小 Markdown escape 與 rerun actor audit 欄位 |