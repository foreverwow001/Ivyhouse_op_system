# Plan: Idx-021

**Index**: Idx-021
**Created**: 2026-04-02
**Planner**: @GitHubCopilot
**Phase**: Phase 1
**Primary Module**: Identity / Approval / Daily Ops
**Work Type**: implementation

---

## 目標

把 inventory-count 與 production-planning 從 Phase 1 header-based 過渡 guard 收斂到正式身份承接與 maker-checker approval skeleton，避免高風險庫存 / 排工操作長期停留在可偽造 header 與無覆核狀態。

---

## SPEC

### Goal

建立正式 auth / approval 的第一輪可落地切片，至少覆蓋：

1. inventory-count 的 create / complete / manual adjustment
2. production-planning 的 create / revise / rerun
3. maker-checker 所需的 approval skeleton、角色邊界與審計欄位

### Business Context

- `Idx-013` 已以 request header 落最小 guard，但 reviewer 已確認這只是過渡控制，不是正式身份驗證。
- `Idx-015` 與 `Idx-016` 已補 production-planning 最小 guard，但同樣仍是 header-based 過渡模型。
- `project_rules.md` 與角色文件要求：影響庫存、配方、權限與關帳結果的操作，長期必須具備 maker-checker 或等價控制。
- 若不先建立正式身份來源、approval contract 與最小 schema，後續 deploy / go-live 無法自證高風險操作具備可稽核權限邊界。
- 2026-04-03 已完成第一輪決策收斂：正式身份來源先接內部 Portal session principal；`主管` 與 `管理員` 分開建模，但同一個使用者可同時持有兩種角色。

### Non-goals

- 不在本輪完成全系統登入、SSO、密碼治理與使用者後台。
- 不在本輪把所有 daily ops / intake / master-data 一次全部切到正式 auth。
- 不在本輪完成 row-level security、ABAC 或完整 permission DSL。
- 不在本輪直接完成最終 production-ready approval UI。

### Acceptance Criteria

1. inventory-count 與 production-planning 不再依賴可任意偽造的 `x-ivyhouse-role` / `x-ivyhouse-roles` 作為正式身份來源。
2. 高風險操作的 request / event / audit 至少可追溯 `actor`、`maker`、`checker/approver` 與對應狀態節點。
3. maker-checker skeleton 至少能表達 submit / pending approval / approved / rejected 或等價狀態；單人營運期間若 maker 與 checker 為同一人，必須保留 `single_person_override` 或等價 audit 標記。
4. RBAC / approval 邊界已與 [doc/architecture/roles/README.md](doc/architecture/roles/README.md) 對齊，並明確處理 `主管` 與 `管理員` 的分工：`管理員` 只能管理權限設定與系統維運，不得作為高風險業務最終 approver。
5. 若需新增 schema / migration，必須有 focused validation 與回滾策略。

### Edge Cases

- 目前 inventory-count 與 production-planning 的 performedBy 欄位都由 request body 提供，正式身份承接後需避免與 actor / maker / approver 欄位語意衝突。
- `管理員` 已被過渡 guard 納入 production-planning allowed role，但角色文件同時規定其不得作為高風險業務最終 approver；approval skeleton 必須顯式處理這個限制。
- `主管` 為新增的正式業務角色；同一 principal 可同時具有 `主管 + 管理員`，但高風險業務核准只能依 `主管` 邊界判定，不得因 `管理員` 身分繞過。
- 若 approval skeleton 需要 persistence，需決定是共用 approval table、掛在既有 aggregate 上，還是以事件方式暫行承接。
- inventory-count 與 production-planning 的核准粒度不一定相同：前者可能是 session / adjustment 級，後者可能是 plan revision / rerun 級。

---

## RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/roles/README.md`
- `doc/architecture/flows/inventory_count_api_contract.md`
- `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`
- `doc/architecture/flows/daily_ops_engineering_breakdown.md`
- `doc/plans/Idx-013_plan.md`
- `doc/logs/Idx-013_log.md`
- `doc/plans/Idx-015_plan.md`
- `doc/logs/Idx-015_log.md`
- `doc/plans/Idx-016_plan.md`
- `doc/logs/Idx-016_log.md`
- `apps/api/src/daily-ops/inventory-count/**`
- `apps/api/src/daily-ops/production-planning/**`
- `apps/api/src/intake/**`
- `apps/api/prisma/schema.prisma`

### Missing Inputs

- Portal session principal 的正式欄位 contract 尚未定義完成，例如 `principalId`、`displayName`、`roleCodes`、`sessionId`、`authSource`。
- maker-checker 的共用 schema / state model 尚未定義。
- approver / checker 與 actor / maker 的欄位責任尚未寫成 authority contract。

research_required: true

### Assumptions

- VERIFIED - inventory-count 與 production-planning 的 header-based guard 只能視為過渡控制，不可作為正式 auth 終版。
- VERIFIED - intake 的 review flow 已有 `reviewedBy / reviewedAt` 等可借鏡欄位語意，但尚未構成通用 approval skeleton。
- VERIFIED - 第一輪正式身份來源先接內部 Portal session principal，而不是直接採 service principal-only 模型。
- VERIFIED - `主管` 與 `管理員` 必須分開建模，但同一使用者可同時持有兩種角色。
- VERIFIED - 第一輪需先把 `inventory-count complete session` 與 `manual adjustment` 納入 `主管` 核准邊界。
- RISK: unverified - 正式身份來源是否已有 repo 內既存 abstraction 可重用，仍待實作前確認。
- RISK: unverified - maker-checker 是否需要新增共用 approval table / enum / migration，仍待第一輪設計確認。

---

## SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Identity / Approval / Daily Ops
- Adjacent modules: Audit、Prisma Schema、Inventory、Portal / Intake
- Out of scope modules: 全系統使用者管理、財務 approval 全量落地、前端 approval console 完整版

### File whitelist

- `apps/api/src/daily-ops/inventory-count/**`
- `apps/api/src/daily-ops/production-planning/**`
- `apps/api/src/audit/**`
- `apps/api/src/intake/**`
- `apps/api/prisma/**`
- `apps/api/test/**`
- `doc/architecture/roles/README.md`
- `doc/architecture/flows/inventory_count_api_contract.md`
- `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`
- `doc/architecture/flows/daily_ops_engineering_breakdown.md`
- `doc/plans/Idx-021_plan.md`
- `doc/logs/Idx-021_log.md`

### Done 定義

1. `Idx-021` 的正式身份承接與 approval skeleton 規格已足以啟動第一輪實作。
2. inventory-count 與 production-planning 的 actor / maker / checker 邊界已明確，且 `主管 / 管理員` 分工已定錨。
3. 若需 schema / migration，已先在 plan 中明寫風險、驗證與回滾條件。

### Rollback 策略

- Level: L3
- 前置條件: 若正式 auth / approval skeleton 造成既有 daily ops smoke 全面失效，需可回退到 header-based guard 的 Phase 1 過渡狀態。
- 回滾動作: 回退新增 schema、approval 狀態、guard / principal 注入與對應 smoke；保留權威文件與風險紀錄。

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-021-formal-auth-maker-checker-skeleton
  goal: 為 inventory-count / production-planning 建立正式身份承接與 maker-checker skeleton
  retry_budget: 5
  allowed_checks:
    - targeted-auth-tests
    - approval-flow-tests
    - touched-slice-build
    - schema-validation
  file_scope:
    - apps/api/src/daily-ops/inventory-count/**
    - apps/api/src/daily-ops/production-planning/**
    - apps/api/src/audit/**
    - apps/api/src/intake/**
    - apps/api/prisma/**
    - apps/api/test/**
    - doc/architecture/roles/README.md
    - doc/architecture/flows/inventory_count_api_contract.md
    - doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md
    - doc/architecture/flows/daily_ops_engineering_breakdown.md
    - doc/plans/Idx-021_plan.md
    - doc/logs/Idx-021_log.md
  done_criteria:
    - 正式身份來源已取代 header-based guard 作為第一信任來源
    - maker / checker 狀態節點與欄位責任已落地
    - 單人營運時，同人兼任 maker / checker 必須留下例外 audit 標記，且可驗證
    - no file changes outside file_scope
  escalation_conditions:
    - 缺少正式身份來源決策導致無法定錨
    - 需跨多模組新增 approval schema 但 authority contract 尚未完成
    - retry budget exhausted
```

---

## 注意事項

- 本任務命中 auth、permission、RBAC、inventory、approval 與 schema 高風險面，正式執行必須補 Security Review、Domain Review，必要時加營運 review。
- `管理員` 不得因為是系統管理角色就被視為高風險業務最終 approver；若保留其操作能力，必須明示其僅限於系統或緊急維運責任。
- 不得把 request body 的 `performedBy` 直接當成正式身份；至少要明確區分 actor identity 與業務表單欄位。
- maker-checker 若先落 skeleton，也必須具備可退出條件，避免半套 approval 模型長期殘留。

## 2026-04-02 Artifact 啟動結論

### 本輪確認結果

- 使用者已確認：本輪先建立 `Idx-021` 正式 artifact，不直接進入程式實作。
- 第一輪實作切口預設為：inventory-count + production-planning 的正式身份承接與 approval skeleton。
- 若第一輪需要新增 schema / migration，使用者已明確同意可納入範圍。

### 下一步預計切口

1. 先確認正式身份來源與 principal 注入切口。
2. 再確認 approval skeleton 是共用 aggregate 還是嵌入既有 aggregate。
3. 最後才進入第一個最小實作切片。

## 2026-04-03 正式身份與角色決策

### Principal 模型

- 第一輪正式身份來源採內部 Portal session principal。
- principal contract 至少應保留：`principalId`、`displayName`、`roleCodes`、`sessionId`、`authSource`。
- 本輪不以 service principal 作為 daily-ops 人員操作的第一信任來源，但 contract 應保留未來擴成 hybrid principal 的空間。

### 角色與核准邊界

- 新增 `主管` 作為正式業務角色，與 `管理員` 分開建模。
- 同一個使用者帳號可同時持有 `主管` 與 `管理員`。
- `管理員` 僅處理系統治理、權限設定與維運，不得作為高風險業務最終 approver。
- 第一輪先納入 `主管` 邊界的高風險動作：
  1. `inventory-count complete session`
  2. `inventory-count manual adjustment`
- `production-planning` 的 create / revise / rerun 是否全部進入 `主管` 核准清單，延後到下一輪再定。

### 單人營運例外

- 單人營運期間允許 maker 與 checker 為同一人。
- 但不得無痕通過；至少必須留下 `single_person_override` 或等價 audit 標記，供後續 review pack 與 sign-off 辨識。

## 2026-04-03 第一個正式實作切片完成結論

### 本輪落地內容

1. 建立共用 Portal session principal contract：`principalId`、`displayName`、`roleCodes`、`sessionId`、`authSource`。
2. inventory-count 改為由 Portal principal 驅動 create / complete / manual adjustment，不再把 request body `performedBy` 當成正式身份來源。
3. inventory-count 新增 approval skeleton persistence：`completedByPrincipalId`、`completionApprovalStatus`、`completionApproverPrincipalId`、`completionApprovedAt`、`completionSinglePersonOverride`，以及 adjustment 對應 approval 欄位。
4. production-planning 的 create / revise / rerun 改為由 Portal principal 驅動，並把 actor snapshot 納入 audit payload。
5. focused validation 與 mainline / regression evidence 已完成，可回送 `Idx-018` 做最終 sign-off 判定。

### 本輪未擴張範圍

- production-planning 尚未落完整 approval persistence；本輪僅完成 formal principal 接入與 audit 可追溯。
- `管理員` 在 production-planning 的最終 approver 邊界仍需於後續 approval persistence 切片中進一步收斂。

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: 2026-04-02 00:00:00
plan_approved: 2026-04-02 00:00:00
scope_policy: strict
expert_required: true
expert_conclusion: 正式 auth / maker-checker 若不先定錨 actor、maker、checker 與 approval state，就無法安全替換既有 header-based guard
security_review_required: true
security_reviewer_tool: Explore
security_review_trigger_source: path-rule
security_review_trigger_matches:
  - auth
  - permission
  - inventory
  - schema
security_review_start: 2026-04-03 15:00:00
security_review_end: 2026-04-03 15:07:56
security_review_result: PASS_WITH_RISK
security_review_conclusion: Portal session principal 與 inventory-count approval skeleton 已落地並通過 focused / regression evidence；production-planning 管理員最終 approver 邊界仍屬後續風險
execution_backend_policy: pty-primary-with-consented-fallback
scope_exceptions: []

# Engineer 執行
executor_tool: copilot-cli
executor_backend: pty-primary
monitor_backend: manual_confirmation
executor_tool_version: GPT-5.4
executor_user: GitHub Copilot
executor_start: 2026-04-03 12:30:00
executor_end: 2026-04-03 15:07:56
session_id: idx-021-formal-principal-slice
last_change_tool: copilot-cli

# QA 執行
qa_tool: Explore
qa_tool_version: GPT-5.4
qa_user: GitHub Copilot
qa_start: 2026-04-03 15:00:00
qa_end: 2026-04-03 15:07:56
qa_result: PASS_WITH_RISK
qa_compliance: PASS

# 收尾
log_file_path: doc/logs/Idx-021_log.md
<!-- EXECUTION_BLOCK_END -->