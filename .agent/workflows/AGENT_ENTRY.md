# Legacy Compatibility Shim: AGENT_ENTRY

本檔自 `Idx-029` Phase 4 起不再承擔正式 workflow authority。

正式入口請改讀：

1. `.github/workflow-core/AGENT_ENTRY.md`
2. `.github/workflow-core/workflows/dev.md`
3. `project_rules.md`

說明：

- root `.github/**` 與 `.github/workflow-core/**` 已是正式 live workflow authority。
- `.agent/**` 僅保留 compatibility shim / forwarding surface。
- 若你是從舊路徑或歷史文件跳到這裡，請停止在此讀取合約內容，直接改用新 canonical root.
