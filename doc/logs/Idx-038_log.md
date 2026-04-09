# Idx-038: internal-testing deferred external/platform evidence 治理 authority 補位 - Execution Log

> 建立日期: 2026-04-09
> 最近更新: 2026-04-09
> 狀態: QA

---

## ARTIFACT_CHAIN

- task_id: `Idx-038`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-038_plan.md`
- log_file_path: `doc/logs/Idx-038_log.md`

## WORKFLOW_SUMMARY

### Goal

把 `internal-testing` 可暫緩 external infra facts / platform control evidence、但 `single-operator-production` 前必補的 defer policy 正式寫回 repo authority。

### Scope

- 更新 operating mode authority、CI / env baseline 與 flows README 的最小 cross-reference
- 在 implementation index 建立 `Idx-038`
- 在 `Idx-024_plan.md` 與 `Idx-037_plan.md` 補最小 cross-reference，保留 external blocker 未解除的事實
- 建立 `Idx-038` plan / log artifact

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

1. Coordinator 已透過 `vscode_askQuestions` 完成正式確認，且使用者已批准 `Idx-038` docs-only follow-up 可直接修改白名單文件。
2. 本輪只允許修改指定 markdown，且不得改 `Idx-024` / `Idx-037` log、checklist 狀態、workflow yaml 或 runtime code。
3. reviewer 需求為 Domain、Security、QA，但 Engineer 不做最終 reviewer approval。

### 本輪決策落地

1. 在 operating mode authority 新增 explicit defer policy，正式區分 `internal-testing` 可 `deferred` 與 `single-operator-production` 必補 evidence 的邊界。
2. defer policy 明列 examples：最近成功備份時間、保留策略、RTO、RPO、restore rehearsal 日期 / 結果 / 證據、final sign-off、branch protection / required reviewers 平台證據。
3. CI / env baseline 改為明確回指 operating mode authority，不再由該文檔自行決定 external / platform evidence 的 defer timing。
4. flows README 補導覽句，避免讀者在流程文檔內自行判定 deferred 與 production-ready 邊界。
5. `Idx-024_plan.md` 與 `Idx-037_plan.md` 都只補最小 cross-reference，並維持 external blocker 未解除的敘述。
6. implementation index 新增 `Idx-038`，摘要明示為 docs-only governance authority 補位，不暗示 external blocker 已解除。
7. `cross-mode-governance` 只作 governance artifact 的 meta marker；正式 operating mode 仍只有 `internal-testing` 與 `single-operator-production`。

### QA Compliance 例外留痕

- `qa_compliance`: `⚠️ 例外：本次修補只承接既有 reviewer findings 與核准 follow-up scope；Engineer 不自行做最終 QA approval。`

### Reviewer 正式結果

1. Domain reviewer 結論為 `PASS_WITH_RISK`：defer policy authority 已清楚區分 `internal-testing` 的 `deferred` 與 `single-operator-production` 的 required evidence，但下游 artifact 仍必須持續引用 operating mode authority，且不得把 `cross-mode-governance` 誤讀成第三種正式模式。
2. Security reviewer 結論為 `PASS_WITH_RISK`：restore rehearsal 完整度與 platform control evidence 仍依賴 repo 外控制面，checklist bypass path 也尚未能在 repo 內單獨封閉。
3. QA reviewer 結論為 `PASS_WITH_RISK`：本輪需回填 restore rehearsal wording 對齊與 `cross-mode-governance` disclaimer，但 follow-up 維持在已核准 docs-only slice，未擴修成新 task。

### 本輪未做事項

- 未修改 `Idx-024` / `Idx-037` log。
- 未調整任何 checklist 狀態、workflow yaml、CI guard 或 runtime code。
- 未新增或回填任何 external infra facts、platform evidence、backup / restore 真實值或 production sign-off 結論。

## VALIDATION_SUMMARY

- `get_errors`（`doc/architecture/decisions/operating_mode_and_database_provider_baseline.md`、`doc/architecture/decisions/ci_and_env_governance_baseline.md`、`doc/architecture/flows/README.md`、`doc/implementation_plan_index.md`、`doc/plans/Idx-024_plan.md`、`doc/plans/Idx-037_plan.md`、`doc/plans/Idx-038_plan.md`、`doc/logs/Idx-038_log.md`） -> 全數 `No errors found`
- `grep_search defer policy|deferred|single-operator-production|branch protection|required reviewers`（`doc/architecture/decisions/operating_mode_and_database_provider_baseline.md`） -> 已確認 authority 文檔包含 explicit defer policy、`production-ready` / promote fail-closed wording 與 evidence examples
- `grep_search Idx-038|docs-only governance authority|deferred|single-operator-production`（`doc/implementation_plan_index.md`） -> 已確認 index 新增 `Idx-038`，摘要明示 docs-only governance authority 補位且未宣稱 external blocker 已解除
- `grep_search defer policy|deferred|single-operator-production|blocker 已解除`（`doc/plans/Idx-024_plan.md`） -> 已確認 `Idx-024` plan 明示 external / platform gaps 在 `internal-testing` 可維持 `deferred`，且未宣稱 blocker 已解除
- `grep_search defer policy|deferred|single-operator-production|required reviewers|branch protection`（`doc/plans/Idx-037_plan.md`） -> 已確認 `Idx-037` plan 保留 `single-operator-production` 前必補 external / platform evidence 的敘述，且未把 required reviewers / branch protection gap 誤寫為已完成

## RESIDUAL_RISKS

- text policy 與 machine gate 仍有結構性缺口；目前只有 authority wording 與部分 repo-native guard，尚未把 external / platform evidence completeness 全面機器化。
- checklist bypass path 仍依賴 repo 外 platform control；GitHub Environment required reviewers、branch protection 與其他 platform 設定值，依舊不在 repo 內可完整驗證或強制。
- 本輪只補 authority wording 與 reviewer backfill，不新增 external infra 或 platform evidence；因此任何 `single-operator-production` 敘述仍需外部 owner 先補齊 restore rehearsal 日期 / 結果 / 證據與其他必要 evidence。

## CHANGED_FILES

| 檔案 | 本 slice 角色 |
|------|---------------|
| `doc/architecture/decisions/operating_mode_and_database_provider_baseline.md` | defer policy authority |
| `doc/architecture/decisions/ci_and_env_governance_baseline.md` | authority cross-reference |
| `doc/architecture/flows/README.md` | 流程導覽 cross-reference |
| `doc/implementation_plan_index.md` | 任務索引與狀態統計 |
| `doc/plans/Idx-024_plan.md` | external / platform gap cross-reference |
| `doc/plans/Idx-037_plan.md` | external / platform gap cross-reference |
| `doc/plans/Idx-038_plan.md` | 正式 plan artifact |
| `doc/logs/Idx-038_log.md` | 正式 log artifact |