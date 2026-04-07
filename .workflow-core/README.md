# Workflow-core Mutable Root

本目錄是 `Idx-029` Phase 2 建立的 mutable/runtime companion root。

用途：

- 儲存 local skill installs
- 儲存 skill manifest / whitelist / audit 等 mutable metadata
- 儲存 execution log、staging 與其他 downstream local state

在 `Idx-029` Phase 3 之前，本目錄僅建立 scaffold，不搬入既有 `.agent/state/**`、`.agent/config/**` 或 `.agent/skills_local/**` 的內容。