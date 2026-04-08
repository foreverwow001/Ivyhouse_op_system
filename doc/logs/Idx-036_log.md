# Idx-036: 任務 Track 欄位治理補強：系統任務與 workflow 任務分流 - Execution Log

> 建立日期: 2026-04-08
> 最近更新: 2026-04-08
> 狀態: QA

---

## ARTIFACT_CHAIN

- task_id: `Idx-036`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-036_plan.md`
- log_file_path: `doc/logs/Idx-036_log.md`

## WORKFLOW_SUMMARY

### Goal

以 docs-only governance 方式補齊 `Track` 欄位治理，將 implementation task 的工作焦點正式分流為 `product-system` 與 `workflow-core`，並明確區分 `Track` 與 `Operating Mode`。

### Scope

- implementation index 新增 `Track` 欄位與 `Idx-036`
- plan template 新增 `Track` header 與 execution block `track`
- 主 plan 回補最小 `Track` 留痕
- README 補 `Track` 與 `Operating Mode` 差異說明

## EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | GitHub Copilot |
| last_change_tool | GitHub Copilot |
| qa_tool | Ivy QA Reviewer |
| latest_qa_review_outcome | PASS_WITH_RISK |
| security_review_outcome | N/A |
| domain_review_outcome | N/A |
| runtime_code_changed | no |
| commit_hash | pending |

## EXECUTION_NOTES

### 本輪執行前提

1. `Idx-033` 已把 `Operating Mode` 正式落入 plan template，因此本輪只補任務工作焦點的 `Track`，不得改動 `Operating Mode` 語意。
2. 使用者已提供明確白名單與分類規則，並要求 phase plans 不得修改。
3. 本輪限定為 docs-only governance；不得觸碰 runtime code、workflow yaml、schema、migration 或白名單外文件。
4. `Idx-036` 雖影響 product-system artifacts，但主要修改面是 planning / workflow governance metadata，因此本輪將其 Track 明確收斂為 `workflow-core`。

### QA Compliance 例外留痕

- 本輪只承接既有 QA findings 的 docs-only follow-up 與結果留痕，不新增第二輪 QA review，也不由 Engineer 自行轉換成無條件 `PASS`。

### 本輪 follow-up 結果

1. 已將 `Idx-036` 的 plan / index Track 明確收斂為 `workflow-core`，理由同步留在 plan、log 與 implementation index：雖觸及 product-system artifacts，但主要變更標的是 planning / workflow governance metadata。
2. 已在 `Idx-025_plan.md` 的最小 execution block 附近新增 accepted-exception 等價說明，明示該 block 是為承接 `Idx-036` 的刻意最小補位，不擴寫其他新制欄位。
3. 已完成主 plan header Track 與 execution block `track` 全量一致性檢查，確認 `Idx-001` 到 `Idx-036` 主 plan 全數一致。
4. 已重新確認 `Idx-029_phase-*` phase plans 仍未出現 `Track`，符合排除範圍。
5. QA reviewer 正式結果已回填為 `PASS_WITH_RISK`，並同步保留「本輪只承接既有 findings、非 Engineer 最終 QA approval」的例外留痕與 residual risks。

### QA 結果

- Reviewer: `Ivy QA Reviewer`
- Verdict: `PASS_WITH_RISK`
- Conclusion: `Idx-036` 的 Track 分類、`Idx-025` 最小補位例外說明，以及主 plan / phase plan 的一致性留痕均已補齊；本輪 follow-up 不擴 scope，且未觸碰 phase plans、runtime 或白名單外檔案。

## VALIDATION_SUMMARY

- `get_errors`（`doc/implementation_plan_index.md`、`doc/plans/Idx-025_plan.md`、`doc/plans/Idx-036_plan.md`、`doc/logs/Idx-036_log.md`） -> 全數 `No errors found`
- 主 plan Track 一致性檢查（以 `awk` 比對 `doc/plans/Idx-001_plan.md` 到 `doc/plans/Idx-036_plan.md` 的 header `**Track**:` 與 execution block `track:`） -> `total=36, pass=36, mismatch=0`
- `grep -nHE '^\*\*Track\*\*:|^track:' doc/plans/Idx-029_phase-*_plan.md` -> `No matches found`，確認 phase plans 仍未出現 `Track`

## RESIDUAL_RISKS

- `Idx-025_plan.md` 仍維持歷史主 plan 的最小 execution block；本輪只補 accepted-exception 說明與 Track 留痕，未升級成新制完整欄位集。
- `Track` 分類仍仰賴治理規則與人工判讀；後續若出現同時跨 product-system 與 workflow-core 的模糊任務，仍需在 plan 建立時明確記錄判斷依據。
- 本輪 QA 結果回填為 `PASS_WITH_RISK`；雖然 findings 已收斂，但此結論僅覆蓋 docs-only governance artifact，不提供 runtime、phase plan 或非白名單檔案的額外保證。

## CHANGED_FILES

- `doc/implementation_plan_index.md`
- `doc/plans/Idx-025_plan.md`
- `doc/plans/Idx-036_plan.md`
- `doc/logs/Idx-036_log.md`