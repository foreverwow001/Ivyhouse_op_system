# Reviewer Packages

- QA 與 Security Review 的 package 欄位定義維持固定格式。
- `Idx-029` Phase 4 已完成後，本 repo 的 live workflow 改由 `.github/workflow-core/**` 與 root `.github/**` 承接。
- QA package 至少包含：`Task Summary`、`Expected Behavior`、`Changed Files or Diff`、`Validation Evidence`、`Open Risks / Known Gaps`。
- Security package 至少包含：`Task Summary`、`Trust Boundary / Attack Surface`、`Changed Files or Diff`、`Validation Evidence`、`Secrets / Permissions Notes`、`Known Security Concerns`。
- repo-native one-shot reviewer wrapper 為 `.github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py`。
- 建議用法：
  - QA：`python .github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py --role qa --package-file <package.md> --output-file <out.md>`
  - Security：`python .github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py --role security --package-file <package.md> --output-file <out.md>`
- Reviewer surface 是 read-only；reviewer 不直接改 code。
- `.github/instructions/**` 提供 package 導覽與 instruction overlay；正式 reviewer 與 workflow 合約仍以 `.github/workflow-core/**` 為準。