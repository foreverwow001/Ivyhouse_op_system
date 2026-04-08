# Plan: Idx-023 — Go-Live Blocker 收斂：Portal、CI/CD、環境治理、主資料完整化與正式環境 Preflight

**Index**: Idx-023
**Created**: 2026-04-04
**Planner**: Copilot
**Phase**: Phase 1 → Go-Live
**Primary Module**: Portal / Intake / Infra
**Work Type**: implementation
**Track**: product-system

---

## 🎯 目標

將 `Idx-023` 從「過大的 blocker 清單」收斂成可逐 slice 執行的 go-live plan，並凍結下一個可正式派工的 active slice。`Idx-028` 已完成 Portal app scaffold、login page 與 landing shell，因此本輪不再重做前端起步，而是以現有承接面為基礎，把後續 go-live blocker 切成可控順序。

本 plan 的成功標準有兩層：

1. `Idx-023` 的剩餘 blocker 已被拆成清楚的 slice sequence 與依賴順序。
2. 下一個 active slice 已具備單一 `work_unit`、明確 file whitelist、done criteria、reviewer requirement 與 escalation 條件，可直接進 formal Approve Gate。

---

## 📋 SPEC

### Goal

把 `Idx-023` 收斂成「一個總 plan + 一個當前 active slice」，避免再以跨模組大包形式直接投入 Engineer。

### Business Context

- `Idx-018` 已給出 `PASS_WITH_RISK` 的 go-live sign-off，代表 Phase 1 主線已可在受控 operating envelope 下運作，但仍有 blocker 級缺口待收口。
- `Idx-028` 已交付 Portal shell，因此真正的關鍵路徑不再是「有沒有前端 app」，而是「Portal 能否承接 session 與 intake / daily ops 實際工作流」。
- 後端目前已存在 `IntakeModule`、`DailyOpsModule` 與 `PortalSessionPrincipal` header-based bridge，適合先推進前端 session boundary + intake workbench，再逐步補 daily ops、CI/CD、環境治理與正式環境 preflight。

### Non-goals

- 本輪不直接執行任何 Portal、API、CI/CD、schema 或 deployment 實作。
- 本輪不把 `Idx-024`、`Idx-025` 的 post-launch / Phase 2 項目偷渡回 `Idx-023`。
- 本輪不定義正式 credential auth、SSO、完整 RBAC framework 終版。

### Acceptance Criteria

1. `Idx-023` 已明確拆成 slice sequence，至少涵蓋：Portal 承接、daily ops UI、CI/CD、環境治理、主資料升格、approval / preflight 收口。
2. `Idx-028` 已被明確標記為 slice 1 completed，不再與未完成 blocker 混在一起。
3. 下一個 active slice 已凍結為單一 `work_unit`，其 file whitelist、done criteria、allowed checks 與 escalation conditions 均可直接交給 Engineer。
4. 會觸發 Domain Review 與 Security Review 的理由已寫進 plan，而不是到 execute 階段才臨時補判定。
5. 缺漏前提與外部依賴已被分離到後續 slices，不再阻斷當前 active slice 啟動。

### Edge Cases

- 正式 Portal credential / session persistence 尚未定版 -> active slice 只承接 `PortalSessionPrincipal` 現有 bridge，不假裝完成終版 auth。
- `channel_intake_api_contract.md` 仍是 draft -> 前端整合以現有 controller/runtime surface 為準，draft contract 只作補充參考。
- 正式環境 DB / secret manager 資訊未就緒 -> 明確保留給後續 slice，不得拿來阻斷 Portal intake 承接面。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/project_overview.md`
- `doc/architecture/phase1_mvp_scope.md`
- `doc/architecture/modules/portal_ui_ux_baseline.md`
- `doc/architecture/flows/portal_landing_flow_mapping_spec.md`
- `doc/architecture/flows/channel_intake_api_contract.md`
- `doc/logs/Idx-018_log.md`
- `doc/logs/Idx-022_log.md`
- `apps/api/src/intake/intake.controller.ts`
- `apps/api/src/daily-ops/daily-ops.controller.ts`
- `apps/api/src/common/auth/portal-session-principal.ts`

### Missing Inputs

- 正式 Portal credential auth / session persistence contract
- Secret Manager 最終選型與正式環境 secret 注入策略
- 正式環境 PostgreSQL 連線資訊、extension inventory 與 hotfix migration 差異
- 原料 / 配方 / 門市 / 倉庫主資料升格所需的 owner 最終欄位值

research_required: true

### Sources

- `doc/implementation_plan_index.md`
- `doc/plans/Idx-028_plan.md`
- `doc/logs/Idx-028_log.md`
- `doc/logs/Idx-018_log.md`
- `doc/logs/Idx-022_log.md`
- `apps/api/src/common/auth/portal-session-principal.ts`
- `apps/api/src/intake/intake.controller.ts`
- `apps/api/src/daily-ops/daily-ops.controller.ts`

### Assumptions

- VERIFIED - `Idx-028` 已完成 Portal shell，下一輪應承接實際工作流，而不是重做 app scaffold。
- VERIFIED - 後端 runtime 已存在 `PortalSessionPrincipal` bridge，可作為 Phase 1 Portal session boundary 的過渡承接面。
- VERIFIED - `IntakeController` 與 `DailyOpsController` 已提供前端可接的 REST surface。
- RISK: unverified - Portal 端目前尚無正式 session storage / refresh / logout contract。
- RISK: unverified - intake draft API contract 與 runtime controller 長期是否完全一致，仍需在實作 slice 內做局部核對。

---

## 🧩 SLICE SEQUENCE

| Slice | 狀態 | 目標 | 主要模組 | 依賴 | 備註 |
|---|---|---|---|---|---|
| Slice 1 | Completed | Portal app scaffold、login page、landing shell | Portal | `Idx-026`, `Idx-027` | 已由 `Idx-028` 交付 |
| Slice 2 | Completed | Portal session boundary + Intake workbench | Portal / Intake | Slice 1 | 已交付 Portal session bridge 與 intake workbench |
| Slice 3 | Completed | Daily Ops workbench（扣帳 / 生產規劃 / 盤點） | Portal / Daily Ops | Slice 2 | 已交付 daily ops workbench |
| Slice 4 | Completed | CI build / test / deploy gate | Infra | Slice 2 | 已建立 repo-native GitHub Actions quality gate 與 release preflight |
| Slice 5 | Completed | 環境變數與密鑰治理 | Infra / Security | Slice 4 | 已建立 `.env.example`、環境契約與 secret handling baseline |
| Slice 6 | Completed | 主資料升格 + production-planning approval 收口 | Master Data / Production | Slice 3 | raw / semi-finished owner surface 已升格到 active，approval audit evidence 已收口 |
| Slice 7 | Completed | 正式環境 migration preflight 與故障復原演練 | Infra / Database | Slice 4, Slice 5, Slice 6 | read-only preflight、scratch DB replay drill、release-preflight artifact 與本機 executable evidence 已建立 |

### 關鍵路徑

1. Slice 2 與 Slice 3 已完成，Portal 已能承接 intake 與 daily ops 主線。
2. Slice 4 與 Slice 5 已完成，repo 已具備最低 quality gate 與 env governance baseline。
3. Slice 6 已完成，主資料 active surface 與 production-planning approval residual evidence 已補齊。
4. `Idx-023` 的最後收口點已由 Slice 7 補齊，整體 go-live blocker 已完成 repo 內交付。

### Current Execution Snapshot

- Slice 2：已完成，Portal session boundary、header bridge 與 intake workbench 已落地。
- Slice 3：已完成，daily ops workbench 已承接 demand batch、production planning、inventory count 與 alerts。
- Slice 4：已完成，`.github/workflows/ci.yml` 已建立 build / test quality gate 與 release preflight。
- Slice 5：已完成，root 與 app-level `.env.example`、`.gitignore` 與 env governance baseline 已建立。
- Slice 6：已完成，半成品 / 原料 owner surface 已切到 active master-data，production-planning approval audit 已明確記錄 `approvalRoleBasis = 主管`。
- Slice 7：已完成，release-preflight 已可執行 read-only migration preflight；repo-native scratch DB replay drill 與本機 PostgreSQL executable evidence 已建立。
- `Idx-023` 狀態：Completed。下一個建議 work unit：`Idx-024`。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Portal / Intake
- Adjacent modules: `apps/api/src/common/auth`, `apps/api/src/intake`
- Out of scope modules: Procurement、Finance / Reconciliation、Observability Phase 2、Opening balance 多窗口擴張

### File whitelist

- `apps/portal/app/login/page.tsx` - 將既有 login shell 收斂為 session boundary 入口
- `apps/portal/app/landing/page.tsx` - 對齊 session-aware 導流與 intake 入口
- `apps/portal/app/intake/**` - 新增 intake workbench 頁面、路由與子元件
- `apps/portal/app/layout.tsx` - 佈局層承接 session-aware 導航或狀態區
- `apps/portal/app/page.tsx` - root redirect 與進站策略對齊
- `apps/portal/app/globals.css` - intake / session 元件樣式與狀態樣式
- `apps/portal/lib/**` - session bridge、API client、Portal principal helper
- `apps/portal/package.json` - Portal 端相依與 scripts 微調
- `package.json` - 若 Portal build / validation script 需最小調整
- `package-lock.json` - 若新增或調整 Portal 相依

### Conditional impact blocks

#### MASTER DATA IMPACT

- Active slice 不改主資料 owner 寫入流程。
- 只允許讀取已存在的 intake / mapping / batch runtime surface，不得在 Portal 端發明平行商品、SKU 或 mapping 字典。

#### STATE / WORKFLOW IMPACT

- Active slice 只承接 Portal 端最小 session state 與 Intake workbench workflow。
- `confirm batch` 仍屬高風險節點，正式確認邏輯以後端 endpoint 為 authority，不得在前端自行推導完成。

#### RBAC IMPACT

- 以 `PortalSessionPrincipal.roleCodes` 作為前端 role hint 與 disabled state 依據。
- 不在本 slice 新增 approver 決策或後端 RBAC 規則；若遇到 role boundary 不清，應回退到 disabled-by-role 呈現。

#### SHARED KEY / CROSS-MODULE IMPACT

- Active slice 只讀取既有 key 與 id：`intakeBatchId`、`sourceFileId`、`parsedLineId`、`mappingResultId`、`exceptionId`。
- 不變更 API contract owner，不直接修改 `apps/api/**`。

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- Portal API client 應保留 session / principal context 的傳遞位置與失敗狀態顯示。
- 本 slice 驗證 evidence 以 Portal build 與 targeted Portal checks 為主。

### Done 定義

1. `Idx-023` 的 slice sequence 與依賴順序已正式凍結。
2. Active slice 已具備可直接交給 Engineer 的單一 `work_unit`。
3. 後續 slices 的外部依賴與阻斷條件已獨立列出，不再與 active slice 混成單一大包。

### Rollback 策略

- Level: L1
- 前置條件: 本輪僅允許修改 `Idx-023` plan / log artifact
- 回滾動作: 若 slice 定義造成 authority 衝突或與 index 不一致，回退本次 plan / log 修訂，保留既有 `Idx-023` 任務編號與 index 位置

### Max rounds

- 估計: 1
- 超過處理: 若 active slice 仍無法收斂成單一 `work_unit`，必須停下並改由 askQuestions 補決策，不得繼續膨脹計畫

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-023-slice-2-portal-session-intake-workbench
  goal: implement the next go-live slice by adding a Portal session boundary and intake workbench on top of the existing Portal shell, and leave it ready for external review
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - targeted-unit-tests
    - touched-file-lint
  file_scope:
    - apps/portal/app/login/page.tsx
    - apps/portal/app/landing/page.tsx
    - apps/portal/app/intake/
    - apps/portal/app/layout.tsx
    - apps/portal/app/page.tsx
    - apps/portal/app/globals.css
    - apps/portal/lib/
    - apps/portal/package.json
    - package.json
    - package-lock.json
  done_criteria:
    - Portal can resolve a bounded session / principal shell without hard-coded secrets
    - Intake workbench can drive batch create, batch detail lookup, and review-stage navigation against the current runtime surface or controlled placeholders where the contract is still draft
    - Portal shows clear available, pending, and blocked states for parse, mapping, exception, and confirm steps
    - no file changes outside file_scope
    - engineer result is ready for external review
  escalation_conditions:
    - scope break
    - new backend contract or schema change is required to proceed
    - new security-sensitive path or keyword triggered outside the approved slice
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `apps/portal/app/login/page.tsx` | 修改 | 承接最小 session boundary 入口 |
| `apps/portal/app/landing/page.tsx` | 修改 | 對齊 intake 導流與 session-aware 狀態 |
| `apps/portal/app/intake/**` | 新增 / 修改 | 建立 intake workbench |
| `apps/portal/app/layout.tsx` | 修改 | Portal session-aware layout |
| `apps/portal/app/page.tsx` | 修改 | root 導向策略 |
| `apps/portal/app/globals.css` | 修改 | intake / session 樣式 |
| `apps/portal/lib/**` | 新增 / 修改 | session bridge 與 API client helper |
| `apps/portal/package.json` | 修改 | 前端 slice 所需依賴 / scripts |
| `package.json` | 視需要修改 | root workspace script 對齊 |
| `package-lock.json` | 視需要修改 | 相依鎖檔同步 |

---

## 實作指引

> Historical note: 下列 `Portal session boundary` 與 `Intake workbench` 指引屬於先前 Slice 2 的執行約束，保留作為已完成 slice 的 authority 記錄。下一個 active slice 將在後續 planning refinement 中補齊專屬 `work_unit` contract。

### 1. Portal session boundary

- 以 `PortalSessionPrincipal` 現有 header bridge 為 Phase 1 過渡承接面。
- 不做正式 credential auth，也不在前端硬寫帳密、token 或假 secret。
- 若 session contract 不足以支撐真實登入，應以 bounded placeholder / session bootstrap 呈現，而不是擴張到後端 auth 改造。

### 2. Intake workbench

- 優先承接現有 runtime controller surface：batch create、detail、parse、parsed-lines、mapping-results、exceptions、confirm。
- `channel_intake_api_contract.md` 只作補充參考；若與 runtime 不一致，以 controller / service 實際 surface 為準。
- intake workbench 的任務是把工作流可視化與可操作化，不是重做 mapping engine。

### 3. UI 邊界

- 延續 `Idx-028` 的品牌基線與 landing flow mapping spec。
- `available`、`coming-soon`、`disabled-by-role` 的狀態語意必須清楚。
- 不把 daily ops、approval、master data、CI/CD 項目偷渡進同一 slice。

### 4. 驗證

- 實作 slice 開始後，第一個 focused validation 優先是 Portal build 或等價 Portal targeted check。
- 若新增 portal-only test surface，可納入 targeted-unit-tests；否則至少要有 touched-file lint / build evidence。

---

## 注意事項

- 風險提示: 最容易 scope creep 到正式 auth、完整 dashboard、後端 contract 改造與 daily ops 頁面；一律禁止。
- 資安考量: 本 slice 命中 `session`、`login`、`api` 關鍵字，正式執行必須有 Security Review。
- 相依性: 直接承接 `Idx-018`、`Idx-021`、`Idx-022`、`Idx-028`。
- 缺漏前提: Portal 正式 credential auth 與正式環境 secret policy 仍未定案，只能作為後續 slice gate，不是本 slice 內圈工作。

---

## 相關資源

- `doc/plans/Idx-028_plan.md`
- `doc/logs/Idx-028_log.md`
- `doc/logs/Idx-018_log.md`
- `doc/logs/Idx-022_log.md`
- `doc/architecture/modules/portal_ui_ux_baseline.md`
- `doc/architecture/flows/portal_landing_flow_mapping_spec.md`
- `doc/architecture/flows/channel_intake_api_contract.md`
- `apps/api/src/common/auth/portal-session-principal.ts`
- `apps/api/src/intake/intake.controller.ts`

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: [2026-04-04]
plan_approved: [2026-04-07 user approved execute Slice 6 / Slice 7 continuation]
scope_policy: [strict]
expert_required: [true]
expert_conclusion: [高風險面已依既有權威文件與本輪 executable evidence 收斂；正式 production clone drill 仍需依 DBA / 受控視窗執行]
security_review_required: [true]
security_reviewer_tool: [substitute: reviewer-preflight + security checklist manual readback]
security_review_trigger_source: [mixed]
security_review_trigger_matches: [api, session, migration, deploy, rollback]
security_review_start: [2026-04-07]
security_review_end: [2026-04-07]
security_review_result: [PASS]
security_review_conclusion: [已補 production label fail-closed guard 與 same-server guard；未發現可成立 exploit path]
execution_backend_policy: [chat-primary-with-one-shot-reviewers]
scope_exceptions: []

# Engineer 執行
executor_tool: [GitHub Copilot]
executor_backend: [copilot-chat-agent]
monitor_backend: [checkpoint-first-reviewer-output]
executor_tool_version: [GPT-5.4]
executor_user: [GitHub Copilot]
executor_start: [2026-04-07]
executor_end: [2026-04-07]
session_id: [N/A]
last_change_tool: [GitHub Copilot]

# QA 執行
qa_tool: [substitute: get_errors + targeted checks + manual QA readback]
qa_tool_version: [workspace tooling]
qa_user: [GitHub Copilot]
qa_start: [2026-04-07]
qa_end: [2026-04-07]
qa_result: [PASS]
qa_compliance: [⚠️ tool substitute: workspace 無 one-shot reviewer tool，改以 reviewer preflight、get_errors、targeted checks 與人工 QA readback 留證]

# 收尾
log_file_path: [doc/logs/Idx-023_log.md]
commit_hash: [pending]
rollback_at: [N/A]
rollback_reason: [N/A]
rollback_files: [N/A]
<!-- EXECUTION_BLOCK_END -->

---

## 用戶確認

> 本 plan 已完成 slice planning；進入 execute 前，仍需 formal gate 確認 active slice。

- [x] `Idx-023` 應先拆 slice，不以整包 blocker 直接進 Engineer
- [ ] Active slice 規格已確認，可進入 Domain Expert / Approve Gate
- [ ] Security Review Policy 已確認，且已寫入 EXECUTION_BLOCK
- [ ] Engineer Tool 已選擇，且已寫入 EXECUTION_BLOCK
- [ ] QA Tool 已選擇，且已符合 Cross-QA 要求
- [ ] Execution Backend Policy 已確認
