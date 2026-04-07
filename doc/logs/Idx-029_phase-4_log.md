# Idx-029 Phase 4: `.agent/**` Compatibility Shim、`.vscode/**` / `.devcontainer/**` Cutover - Execution Log

> 建立日期: 2026-04-07
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-029 Phase 4`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-029_phase-4_plan.md`
- log_file_path: `doc/logs/Idx-029_phase-4_log.md`
- prior_log_path: `doc/logs/Idx-029_phase-3_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal
完成 live authority cutover，讓 root `.github/**` 與 `.github/workflow-core/**` 成為正式 workflow surface，並將 legacy `.agent/**` 收斂成 forwarding docs、tiny wrappers 與 retired compatibility stubs。

### Scope
- 清理非 live docs 中殘留的舊 `.agent` mutable path 敘述，改以 superseded note 收斂
- 切換 root `.github/**` 的 authority/navigation 文案
- 更新 `.vscode/settings.json` 到 `chat-primary-with-one-shot-reviewers` 與 reviewer CLI readiness 模型
- 更新 `.devcontainer/devcontainer.json` 的 post-create canonical path
- 將 `.agent/workflows/**`、`.agent/roles/**` 改寫為 forwarding docs
- 將 `.agent/runtime/**` 改寫為 canonical wrappers 或 retired compatibility stubs

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | GitHub Copilot |
| security_reviewer_tool | N/A |
| qa_tool | N/A |
| last_change_tool | GitHub Copilot |
| qa_result | N/A |
| commit_hash | pending |

## 🛠️ CUTOVER_REPORT

| Area | Status | Summary | Timestamp |
|------|--------|---------|-----------|
| historical-doc cleanup | done | 對非 live docs 補上 superseded note，保留歷史內容但明確標示 `.workflow-core/**` 才是現行 mutable authority | 2026-04-07 |
| root authority switch | done | `.github/copilot-instructions.md`、`.github/prompts/dev.prompt.md`、workflow navigation 與 reviewer package instructions 已改成新 authority 敘述 | 2026-04-07 |
| editor/devcontainer cutover | done | `.vscode/settings.json` 切到 `chat-primary-with-one-shot-reviewers`，`.devcontainer/devcontainer.json` 改呼叫 `.github/workflow-core/runtime/scripts/devcontainer/post_create.sh` | 2026-04-07 |
| workflow/role shim | done | `.agent/workflows/**`、`.agent/roles/**` 全數改為 forwarding docs，不再承擔 live contract | 2026-04-07 |
| runtime shim | done | `.agent/runtime/scripts/**` 已重建為 tiny wrappers 或 retired compatibility stubs；`.agent/runtime/tools/**` README 已補 compatibility note | 2026-04-07 |

## 📈 CUTOVER_EVALUATION

Phase 4 完成後，root `.github/**` 已不再把 `.agent/**` 視為 live authority，workspace 啟動面也不再直接依賴舊 `.agent/runtime/scripts/**`。legacy `.agent/**` 仍存在，但只承擔三種角色：

1. forwarding docs：將舊 workflow/role 入口導回 `.github/workflow-core/**`
2. tiny wrappers：將仍可能被人手動呼叫的 runtime 入口轉呼叫到 `.github/workflow-core/runtime/scripts/**`
3. retired stubs：對已被淘汰的 PTY/fallback-only 入口 fail-fast，避免舊自動化誤以為這些路徑仍是正式 live contract

## ✅ VALIDATION_SUMMARY

- `get_errors` on historical-note edits -> No errors found
- `get_errors` on root `.github/**` authority switch files -> No errors found
- `get_errors` on `.agent/workflows/**` and `.agent/roles/**` forwarding docs -> No errors found
- `get_errors` on representative `.agent/runtime/scripts/**` wrappers/stubs -> No errors found
- `python -m py_compile` on all recreated Python wrappers/stubs -> passed
- `bash -n` on recreated shell wrappers -> passed
- `python .agent/runtime/scripts/workflow_core_sync_precheck.py --help` -> 成功輸出 canonical argparse usage，證明 wrapper 可正確載入 sibling imports 與轉呼叫正式 script
- `python .agent/runtime/scripts/vscode/workflow_preflight_check.py --json` -> 回傳 `{"status": "retired", ...}` retired payload，證明舊 PTY preflight 入口會 fail-fast 並導向新 reviewer CLI preflight
- `grep_search` on `.github/**` for staged-only / `.agent/**` live authority wording -> No matches found
- `grep_search` on `.devcontainer/**`, `.vscode/**`, `.github/**` for old runtime bootstrap paths -> No matches found

## 📎 EVIDENCE

- root authority artifacts:
  - `.github/copilot-instructions.md`
  - `.github/prompts/dev.prompt.md`
  - `.github/instructions/workflow-navigation.instructions.md`
  - `.github/instructions/reviewer-packages.instructions.md`
  - `.github/agents/ivy-engineer.agent.md`
  - `.github/agents/ivy-qa-reviewer.agent.md`
  - `.github/agents/ivy-security-reviewer.agent.md`
- workspace launch artifacts:
  - `.vscode/settings.json`
  - `.devcontainer/devcontainer.json`
- shimmed legacy surfaces:
  - `.agent/workflows/**`
  - `.agent/roles/**`
  - `.agent/runtime/scripts/_compat_exec.py`
  - `.agent/runtime/scripts/workflow_core_sync_precheck.py`
  - `.agent/runtime/scripts/workflow_core_sync_update.py`
  - `.agent/runtime/scripts/vscode/workflow_preflight_check.py`
  - `.agent/runtime/tools/vscode_terminal_pty/README.md`
  - `.agent/runtime/tools/vscode_terminal_fallback/README.md`

## ⚠️ RESIDUAL_RISKS

- 任何仍直接呼叫 `.agent/runtime/scripts/vscode/workflow_preflight_check.py`、`workflow_preflight_fallback.py`、`workflow_preflight_pty.py` 的舊自動化，現在會收到 retired stub 錯誤；這是刻意的 fail-fast 行為，後續若有外部依賴需另行盤點。
- 非 live 歷史文件仍可能保留舊 `.agent` path 作為歷史證據，但已透過 superseded note 明確標示不得作為現行 authority。
- `.agent/runtime/tools/**` 仍保留 legacy extension 文檔，後續若要進一步縮減 repo surface，可在 Phase 5 或後續 maintenance 中評估是否移到 archive。
