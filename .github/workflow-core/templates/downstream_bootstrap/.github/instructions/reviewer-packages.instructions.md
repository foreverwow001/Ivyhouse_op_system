# Reviewer Packages

- QA 與 Security Review 都必須使用 fresh one-shot reviewer session。
- QA package 至少包含：`Task Summary`、`Expected Behavior`、`Changed Files or Diff`、`Validation Evidence`、`Open Risks / Known Gaps`。
- Security package 至少包含：`Task Summary`、`Trust Boundary / Attack Surface`、`Changed Files or Diff`、`Validation Evidence`、`Secrets / Permissions Notes`、`Known Security Concerns`。
- Reviewer surface 是 read-only；reviewer 不直接改 code。
- `.github/instructions/**` 只提供 package 導覽，不取代 `.github/workflow-core/**` 的 canonical workflow 規格。
