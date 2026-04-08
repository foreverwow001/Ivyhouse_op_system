# Idx-032: Reviewer CLI behavioral hardening 與 Domain reviewer contract 補強 - Execution Log

> 建立日期: 2026-04-07
> 最近更新: 2026-04-07
> 狀態: In Progress

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
| executor_tool | pending |
| security_reviewer_tool | pending |
| qa_tool | pending |
| last_change_tool | N/A |
| qa_result | pending |
| commit_hash | pending |

## 📝 EXECUTION_NOTES

### 本輪決策

1. `Idx-024` 的真正 reviewer blocker 已從內容面收斂到 tooling 面：wrapper 未支援正式 Domain role，preflight 只驗靜態存在性。
2. 先把 reviewer tooling hardening 獨立成 `Idx-032`，避免把 workflow tooling 修復與 `Idx-024` 結案混成同一包。
3. 先補 `reviewer-packages.instructions.md` 的 Domain package contract，作為後續 Engineer 修正 wrapper / preflight 的 authority input。
4. 已完成 `Idx-032` plan validator，證明新 work unit 結構合法；並補 external infra sign-off checklist，避免 `Idx-024` 的 production sign-off 只停留在聊天待辦。

### 目前已知根因

- `copilot_cli_one_shot_reviewer.py` 只支援 `qa` / `security`，未與 `Ivy Domain Expert` surface 對齊。
- `workflow_preflight_reviewer_cli.py` 的 `status=ready` 只依賴 command / path / wrapper 存在，不驗 one-shot 行為與輸出完整性。
- `Idx-024` Domain reviewer 曾產生輸出檔，但只含不完整 `Task Summary`，證明目前 tooling 缺少 output completeness fail-closed。

## ✅ QA_SUMMARY

- 結論：pending
- 風險：在 reviewer tooling 未修復前，`Idx-024` 只能停留在 `QA`，不得宣告 `Completed`
- 後續事項：待 Engineer 完成 wrapper / preflight hardening 後，重跑 Domain reviewer，解除 `Idx-024` blocker

## 📎 EVIDENCE

- `.github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py`
- `.github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py`
- `.github/agents/ivy-domain-expert.agent.md`
- `.github/instructions/reviewer-packages.instructions.md`
- `python .github/workflow-core/skills/plan-validator/scripts/plan_validator.py doc/plans/Idx-032_plan.md` -> PASS
- `doc/architecture/flows/production_backup_restore_signoff_checklist.md`
- `doc/logs/Idx-024_log.md`
