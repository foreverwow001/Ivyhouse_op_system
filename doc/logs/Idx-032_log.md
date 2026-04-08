# Idx-032: Reviewer CLI behavioral hardening 與 Domain reviewer contract 補強 - Execution Log

> 建立日期: 2026-04-07
> 最近更新: 2026-04-08
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-032`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-032_plan.md`
- log_file_path: `doc/logs/Idx-032_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

讓 repo-native reviewer CLI 對 QA / Security / Domain 三條 reviewer surface 都能穩定返回可採信 one-shot 結果，並消除 preflight 的假就緒問題。

### Scope

- reviewer wrapper behavioral fail-closed
- reviewer preflight behavioral smoke
- Domain reviewer package / role contract 對齊
- `Idx-024` Domain blocker closure path

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | GitHub Copilot |
| security_reviewer_tool | copilot-cli-reviewer |
| qa_tool | copilot-cli-reviewer |
| last_change_tool | GitHub Copilot |
| qa_result | PASS_WITH_RISK |
| commit_hash | pending |

## 📝 EXECUTION_NOTES

### 本輪決策

1. 本輪完成 reviewer wrapper / preflight / package contract 三個面向的收口，已讓 QA、Security、Domain reviewer surface 都能走 fail-closed contract。
2. reviewer command trust source 已自 workspace settings 抽離，並補上 repo 外 package / output-file fence、workspace-local fake copilot 拒絕、resolved command path 一致性與 pinned path 驗證。
3. `Idx-024` 原先的 repo 內 Domain blocker 已解除；剩餘阻斷已收斂為 external infra backup/restore sign-off。

### 目前已知根因

- preflight 先前只做靜態存在性檢查，無法攔住 empty output、incomplete output 或 one-shot reviewer 行為失敗。
- wrapper 先前缺少 `domain` role、command trust boundary 與 repo fence，導致 `Idx-024` 的 fresh Domain review 無法產出可採信結論。

### 本輪 Engineer 實作

1. `copilot_cli_one_shot_reviewer.py` 已正式支援 `qa`、`security`、`domain` 三種 role，並對 empty output、timeout、incomplete output fail-closed。
2. wrapper 已移除 `--allow-all-tools`，補上 workspace-local fake copilot 拒絕、repo 外 package / output-file fence、resolved command path 一致性與 pinned path 驗證。
3. `workflow_preflight_reviewer_cli.py` 已升級為 static checks + behavioral smoke 的 `ready` 判定，且不再信任 workspace settings 作為 command / wrapper trust source。
4. `reviewer-packages.instructions.md` 已補齊 Domain package contract 與 fixed headings，讓 `Idx-024` 能重新執行可採信 Domain review。

## ✅ QA_SUMMARY

- 結論：PASS_WITH_RISK
- 風險：output_file 在 fail-closed 路徑仍可能留下未驗證內容；live-run section completeness 的可重播證據仍可在後續補強
- 後續事項：`Idx-024` 使用 hardened reviewer surface 回補 Domain review；後續 progressive hardening 可再收斂 output_file 寫入時序與 pinned path enforcement 細節

## 🔐 SECURITY_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：command trust source、workspace-local fake copilot、repo 外 package/output-file fence、resolved command path 一致性與 pinned path 驗證皆已收斂；殘餘風險以 host-level copilot CLI supply chain 與 LLM prompt injection 固有風險為主
- 後續事項：若要再往下收斂，可補 output_file 僅在完全驗證後寫入、以及缺少 pinned path 時的更嚴格 fail policy

## 🏁 COMPLETION_MARKERS

- `[ENGINEER_DONE]`: present
- `[QA_DONE]`: present
- `[FIX_DONE]`: present

## 📎 EVIDENCE

- `command -v copilot` -> PASS；resolved path: `/home/vscode/.vscode-server-insiders/data/User/globalStorage/github.copilot-chat/copilotCli/copilot`
- `python .github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py --role domain --package-file doc/plans/Idx-032_plan.md --dry-run` -> PASS；`resolved_copilot_command` 與 `command[0]` 同為 `/home/vscode/.vscode-server-insiders/data/User/globalStorage/github.copilot-chat/copilotCli/copilot`
- `tmp=$(mktemp /tmp/idx032_outside_XXXX.md) && printf '# temp\n' > "$tmp" && python .github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py --role domain --package-file "$tmp" --dry-run` -> FAIL（預期）；stderr 含 `reviewer wrapper rejected package file outside repo root`
- `python .github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py --role domain --package-file doc/plans/Idx-032_plan.md --output-file /tmp/reviewer-out.txt --dry-run` -> FAIL（預期）；stderr 含 `reviewer wrapper rejected output file outside repo root`
- `IVYHOUSE_REVIEWER_CLI_PINNED_COMMAND_PATH=/home/vscode/.vscode-server-insiders/data/User/globalStorage/github.copilot-chat/copilotCli/copilot python .github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py --role domain --package-file doc/plans/Idx-032_plan.md --copilot-command /tmp/fake/copilot --dry-run` -> FAIL（預期）；stderr 含 `reviewer wrapper rejected copilot command path mismatch`
- `IVYHOUSE_REVIEWER_CLI_PINNED_COMMAND_PATH=/home/vscode/.vscode-server-insiders/data/User/globalStorage/github.copilot-chat/copilotCli/copilot python .github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py --role domain --package-file doc/plans/Idx-032_plan.md --copilot-command /home/vscode/.vscode-server-insiders/data/User/globalStorage/github.copilot-chat/copilotCli/copilot --dry-run` -> PASS
- `python .github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py --json` -> PASS；`status=ready`、`resolved_command_path=/home/vscode/.vscode-server-insiders/data/User/globalStorage/github.copilot-chat/copilotCli/copilot`、`command_outside_workspace=true`、`behavioral_smoke.status=passed`
- Security one-shot reviewer：`PASS_WITH_RISK`
- QA one-shot reviewer：`PASS_WITH_RISK`
