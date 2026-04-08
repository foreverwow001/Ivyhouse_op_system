# Idx-031: AskQuestions-first fail-closed workflow hardening - Execution Log

> 建立日期: 2026-04-07
> 最近更新: 2026-04-07
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-031`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-031_plan.md`
- log_file_path: `doc/logs/Idx-031_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

把 formal gate 的 askQuestions-first contract 收斂成 fail-closed，避免再用一般聊天收集正式 gate 決策。

### Scope

- live authority wording 修正
- downstream bootstrap template sync
- root `/dev` prompt 與 vscode prompt 對齊

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | GitHub Copilot |
| security_reviewer_tool | N/A |
| qa_tool | plan-validator + targeted wording check |
| last_change_tool | GitHub Copilot |
| qa_result | PASS |
| commit_hash | pending |

## 📝 EXECUTION_NOTES

### 本輪決策

1. recurrence 的根因收斂為 live authority 允許 formal gate 退化成一般聊天，而不是單一 prompt 缺漏。
2. 修正策略採 askQuestions fail-closed，不再接受「工具不可用就改一般聊天收 gate」的行為。
3. live authority 與 downstream bootstrap template 一併同步，避免未來 bootstrap 時重新導入舊 contract。

### 修正面

- `AGENT_ENTRY.md` 改為明定 formal gate 必須使用 `#askQuestions`，缺失時視為 workflow environment blocker。
- `roles/coordinator.md` 改為明定 Coordinator 不可把 gate 改成一般聊天逐題確認。
- `tool_sets.md`、`prompt_dev.md`、root `/dev` prompt 改為要求 batched `#askQuestions`，不得要求使用者在一般聊天重貼 gate prompt。
- downstream bootstrap template 已同步上述 contract。

## ✅ QA_SUMMARY

- 結論：PASS
- 風險：這是 authority doc hardening，不會讓目前缺失的 askQuestions surface 自動出現；若執行環境本身沒有該工具，未來會依新 contract fail-closed
- 後續事項：以此新 contract 繼續推進 `Idx-024`，formal gate 不再接受一般聊天補填

## 📎 EVIDENCE

- `python .github/workflow-core/skills/plan-validator/scripts/plan_validator.py doc/plans/Idx-031_plan.md` -> PASS
- targeted wording check：舊的 formal-gate chat fallback wording 已不存在於 live authority surface
- targeted wording check：live 與 downstream template 均已出現 `workflow environment blocker` 與 `batched #askQuestions` 條文
