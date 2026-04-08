# Plan: Idx-028 — Idx-023 Slice 1：Portal app scaffold、login page 與 landing shell

> Historical note (`Idx-029` Phase 4): 本文件中的 `.agent` mutable path 是 Phase 4 cutover 前的歷史描述，現行應讀 `.workflow-core/skills_local/**` 與 `.workflow-core/state/skills/INDEX.local.md`。

**Index**: Idx-028
**Created**: 2026-04-05
**Planner**: Copilot
**Phase**: Phase 1 → Go-Live
**Primary Module**: Portal
**Work Type**: implementation
**Track**: product-system

---

## 🎯 目標

以 `Idx-023` 的前端 Portal 路徑為主，先完成第一個最小可用切片：建立前端 app scaffold、品牌化 login page 與流程導向 landing shell。這輪不追求 intake / daily ops 表單功能，而是先把前端承接面建立起來，同時驗證 `Idx-027` 補強後的 PTY-based formal execution 是否真的走通。

---

## 📋 SPEC

### Goal

建立 `Portal` 前端 app 的最小骨架，並完成 login page 與 landing shell 第一版。

### Business Context

- `Idx-023` 的關鍵路徑是前端 Portal UI，但目前 repo 尚無任何前端 app。
- 營運系統需要先有品牌一致且流程導向的入口頁，後續 intake / daily ops / production / inventory 才有可掛載的正式承接面。
- 使用者明確要求這輪不只改碼，還要驗證 Codex PTY 實作、Copilot PTY QA、Close strict PTY check 全鏈是否真的工作。

### Non-goals

- 不做 intake batch upload / review 的正式表單與 API 串接。
- 不做 daily ops、production planning、inventory count 的正式操作頁。
- 不改 auth backend contract、RBAC matrix 或 portal session API。

### Acceptance Criteria

1. `apps/portal`（或等價 Portal app 路徑）已建立為 workspace app，能執行最小開發 / build 檢查。
2. 第一版 login page 已存在，符合 `portal_ui_ux_baseline.md` 的品牌基線，至少具備品牌區、登入表單區與基本互動狀態。
3. 第一版 landing shell 已存在，符合 `portal_landing_flow_mapping_spec.md` 的節點分層，至少包含可用主節點與 future nodes 的視覺分群。
4. workspace scripts 已能啟動 / build 這個 Portal app。
5. 這輪執行 evidence 必須包含：checklist 注入、Codex PTY 實作、Copilot PTY QA、strict PTY preflight pass。

### Edge Cases

- repo 尚無前端 app -> 本輪必須先建立 scaffold，而不是只補頁面檔案。
- landing page 對應模組目前多數未有前端頁 -> 第一版以 shell / placeholder / disabled node 呈現，不硬塞未完成流程。
- login page 尚未串正式 auth -> 只做 UI shell 與本地互動，不假裝已完成正式登入契約。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/plans/Idx-023_plan.md`
- `doc/architecture/modules/portal_ui_ux_baseline.md`
- `doc/architecture/flows/portal_landing_flow_mapping_spec.md`
- `.agent/workflows/AGENT_ENTRY.md`
- `.agent/workflows/dev-team.md`
- `.agent/workflows/references/coordinator_research_skill_trigger_checklist.md`
- `.agent/workflows/references/engineer_skill_trigger_checklist.md`

### Missing Inputs

- 正式 auth API contract 對前端 login 的最終串接方式（本輪列為 out of scope）

research_required: true

### Sources

- `doc/plans/Idx-023_plan.md`
- `doc/architecture/modules/portal_ui_ux_baseline.md`
- `doc/architecture/flows/portal_landing_flow_mapping_spec.md`
- `.agent/state/skills/INDEX.local.md`

### Assumptions

- VERIFIED - 目前 repo 只有 `apps/api`，前端 app scaffold 是本輪必要前置。
- VERIFIED - `Idx-026` 與 `Idx-027` 已就緒，可提供 UI/UX skill family 與 PTY formal execution workflow 基座。
- RISK: unverified - 當前 workspace 的 Node / Next.js 相依安裝在首次新增 workspace app 後仍可順利 build。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Portal
- Adjacent modules: root workspace scripts / package lock
- Out of scope modules: `apps/api/**`, `.agent/runtime/**`（除 workflow evidence 使用外不修改）

### File whitelist

- `package.json` - 新增 Portal workspace scripts
- `package-lock.json` - 相依更新
- `apps/portal/**` - 新建 Portal app scaffold、頁面、樣式與元件
- `doc/logs/Idx-028_log.md` - 執行記錄

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- Login page 僅做 UI shell，不引入新的正式 auth 狀態模型。
- Landing shell 僅反映第一版節點狀態：`available` / `coming-soon`。

#### RBAC IMPACT

- 不改後端 RBAC，只在 landing shell 預留 role highlight 視覺位置。

#### SHARED KEY / CROSS-MODULE IMPACT

- N/A

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- 本輪 evidence 重點在 PTY formal execution artifact 與前端 build / lint 結果。

### Done 定義

1. Portal app scaffold 已建立並可最小 build。
2. login page 與 landing shell 已實作且符合基線文件。
3. 本輪留下 Codex PTY / Copilot PTY / strict PTY preflight 的正式 evidence。

### Rollback 策略

- Level: L2
- 前置條件: 僅限 Portal 新增 app 與 root workspace script 變更
- 回滾動作: 移除 `apps/portal` 與對應 root scripts / lockfile 變更，保留 plan/log artifact

### Max rounds

- 估計: 3
- 超過處理: 若前端 bootstrap 或 PTY chain 任一面失敗超過 3 輪，停止並拆成更小切片

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-028-portal-slice-1-login-and-landing-shell
  goal: create the first minimal Portal frontend slice with app scaffold, login page, and landing shell, and leave it ready for external review
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - targeted-unit-tests
    - touched-file-lint
  file_scope:
    - package.json
    - package-lock.json
    - apps/portal/
    - doc/logs/Idx-028_log.md
  done_criteria:
    - portal app scaffold exists and can build
    - login page exists
    - landing shell exists
    - no file changes outside file_scope
    - engineer result is ready for external review
  escalation_conditions:
    - scope break
    - auth backend contract required to proceed
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `package.json` | 修改 | 新增 Portal workspace scripts |
| `package-lock.json` | 修改 | 記錄新 workspace 相依 |
| `apps/portal/**` | 新增 | 建立 Portal app 與 login / landing shell |
| `doc/logs/Idx-028_log.md` | 新增 | 留存這輪 formal execution evidence |

---

## 實作指引

### 1. App scaffold

- 建立 Next.js + React + TypeScript 的最小 Portal app。
- 使用 app router 與最少必要設定，不引入過多基礎設施。

### 2. Login page

- 依 `portal_ui_ux_baseline.md` 建立品牌化 login shell。
- 必須有品牌區、表單區、focus / error / loading state 的最小 UI。

### 3. Landing shell

- 依 `portal_landing_flow_mapping_spec.md` 建立流程導向首頁 shell。
- 第一版至少呈現：需求匯入、當日扣帳、生產規劃、盤點調整、主資料，以及 future nodes。

### 4. 驗證

- 至少執行一次 Portal build 或等價 targeted check。
- 本輪必須用 PTY command surface 注入 Codex 與 Copilot，不能由 chat direct-edit 代跑。

---

## 注意事項

- 風險提示: 這輪最容易 scope creep 到 auth、完整 dashboard、模組表單；全部禁止偷渡。
- 資安考量: 不得硬寫任何帳密、token 或假 secret。
- 相依性: 直接承接 `Idx-023`、`Idx-026`、`Idx-027`。
- 缺漏前提: 正式 auth contract 仍未串接，所以 login 僅為 UI shell。

---

## 相關資源

- `doc/plans/Idx-023_plan.md`
- `doc/architecture/modules/portal_ui_ux_baseline.md`
- `doc/architecture/flows/portal_landing_flow_mapping_spec.md`
- `.agent/state/skills/INDEX.local.md`

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: [2026-04-05 09:42:36]
plan_approved: [待用戶確認]
scope_policy: [strict]
expert_required: [false]
expert_conclusion: [N/A]
security_review_required: [false]
security_reviewer_tool: [N/A]
security_review_trigger_source: [none]
security_review_trigger_matches: []
security_review_start: [N/A]
security_review_end: [N/A]
security_review_result: [N/A]
security_review_conclusion: [N/A]
execution_backend_policy: [pty-primary-with-consented-fallback]
scope_exceptions: []

# Engineer 執行
executor_tool: [codex-cli]
executor_backend: [ivyhouse_terminal_pty]
monitor_backend: [pty_runtime_monitor]
log_file_path: [doc/logs/Idx-028_log.md]
executor_tool_version: [待填]
executor_user: [待填]
executor_start: [待填]
executor_end: [待填]
session_id: [待填]
last_change_tool: [待填]

# QA 執行
qa_tool: [copilot-cli]
qa_tool_version: [待填]
qa_user: [待填]
qa_start: [待填]
qa_end: [待填]
qa_result: [待填]
qa_compliance: [待填]
<!-- EXECUTION_BLOCK_END -->