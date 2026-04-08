# Reviewer Packages

- QA 與 Security Review 的 package 欄位定義維持固定格式。
- QA、Security、Domain Review 都必須使用 fresh one-shot reviewer session。
- `Idx-029` Phase 4 已完成後，本 repo 的 live workflow 改由 `.github/workflow-core/**` 與 root `.github/**` 承接。
- QA package 至少包含：`Task Summary`、`Expected Behavior`、`Changed Files or Diff`、`Validation Evidence`、`Open Risks / Known Gaps`。
- Security package 至少包含：`Task Summary`、`Trust Boundary / Attack Surface`、`Changed Files or Diff`、`Validation Evidence`、`Secrets / Permissions Notes`、`Known Security Concerns`。
- Domain package 至少包含：`Task Summary`、`Domain Scope`、`Authoritative Inputs`、`Spec or Plan Summary`。
- repo-native one-shot reviewer wrapper 為 `.github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py`。
- reviewer readiness preflight 會執行最小 one-shot behavioral smoke；`status=ready` 不再只代表 command/path 存在。
- 建議用法：
  - QA：`python .github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py --role qa --package-file <package.md> --output-file <out.md>`
  - Security：`python .github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py --role security --package-file <package.md> --output-file <out.md>`
  - Domain：`python .github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py --role domain --package-file <package.md> --output-file <out.md>`
- Domain reviewer 的預期輸出固定標題應包含：`Domain Findings`、`Missing Preconditions or Docs`、`Recommendations`、`Contract Boundary`、`Domain Verdict`。
- Reviewer surface 是 read-only；reviewer 不直接改 code。
- `.github/instructions/**` 提供 package 導覽與 instruction overlay；正式 reviewer 與 workflow 合約仍以 `.github/workflow-core/**` 為準。