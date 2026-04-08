# Plan: Idx-024 — Go-Live 後高風險補強：E2E 場景擴充、運維預案與用戶操作手冊

**Index**: Idx-024
**Created**: 2026-04-04
**Planner**: Copilot
**Phase**: Phase 1 → Post-Launch
**Primary Module**: 跨模組
**Work Type**: implementation / governance
**Track**: product-system

---

## 🎯 目標

把 `Idx-024` 從泛化 backlog 收斂成 post-launch 高風險補強計畫，優先順序固定為：

1. E2E 邊界場景與 failure-path executable evidence
2. 正式環境運維預案與 hosted preflight readback
3. 中文版操作手冊與排故指引

本任務不阻斷 go-live，但若沒有在 go-live 後 2 週內補齊，事故恢復成本、交接成本與 on-call 風險會持續放大。

---

## 📋 SPEC

### Goal

建立一個可直接派工的 post-launch hardening sequence，先把最容易在線上出事卻還缺 executable evidence 或 runbook 的面補齊，再處理手冊與常見排故文件。

### Business Context

- `Idx-023` 已完成 go-live blocker 與 GitHub-hosted `release-preflight` artifact，但 post-launch 支撐面仍是空窗
- 目前 happy path 已有 mainline smoke 與 regression evidence，真正高風險的是 cancel / rejection / unauthorized / idempotency / rollback 等邊界場景
- 正式環境已具備 staging `release-preflight` binding 與 artifact 路徑，但 backup / restore、health readback、on-call escalation 仍未收斂成正式 runbook
- Portal 已承接 intake / daily ops，營運團隊需要對應的操作與排故手冊，但手冊應建立在已凍結的流程與 runbook 上，而不是與高風險驗證並行發散

### Non-goals

- 新業務功能（採購、財務、報表、SSO、正式 observability stack vendor 導入）
- 效能與負載測試、前端 cross-browser、UI polish（`Idx-025` 承接）
- 直接在本任務內做 production schema / migration 變更

### Acceptance Criteria

1. **E2E 邊界場景矩陣**：至少收斂以下場景的 authority、測試面與缺口處置：opening balance cancel / guard、production-planning approve / reject / rerun、inventory-count unauthorized / dual-role boundary、intake confirm / exception unresolved、ledger / audit consistency under failure
2. **Executable evidence 優先**：每個 P1 邊界場景都要有 executable test、可重播 smoke、或明確標示為 manual drill 並附 reason；不得只留文字清單
3. **運維預案**：要落地 staging / production release-preflight readback、backup / restore responsibility matrix、health / readiness probe contract、事故 escalation / rollback 決策樹
4. **手冊分層**：中文版手冊只承接已凍結流程，至少包含 intake、daily ops 與 release-preflight / rollback readback；仍在變動的頁面不可先做假完整手冊
5. **Slice 化執行**：必須凍結 active slice，避免把 E2E、運維、手冊再次混成單一大包

### Edge Cases

- GitHub-hosted `release-preflight` 成功 artifact 可能顯示 `appliedMigrationCount=0` 與 `deploymentNeeded=true`，因為目前 staging binding 指向 ephemeral service DB；此結果可作為 read-only drift evidence，但不能誤判為 deploy failure
- production backup / restore 工具若與 staging / 本機不同，runbook 必須分開列，不得共用一份模糊 SOP
- 某些 maker-checker / unauthorized path 難以在 Portal UI 重播時，應優先以下層 API smoke 或 regression script 驗證，不得因 UI 缺入口就放棄測試

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `doc/logs/Idx-015_log.md`（mainline coverage baseline）
- `doc/logs/Idx-016_log.md`（regression / failure-path baseline）
- `doc/logs/Idx-017_log.md`（deploy / rollback runbook baseline）
- `doc/logs/Idx-020_log.md`（opening balance cancel-only recovery）
- `doc/logs/Idx-022_log.md`（approval persistence / approver boundary）
- `doc/logs/Idx-023_log.md`（hosted `release-preflight`、reviewer wrapper、CI/env governance evidence）
- `doc/architecture/decisions/ci_and_env_governance_baseline.md`
- 正式環境 infrastructure 規格（DB backup 工具、health probe 接線、monitoring stack）

### Missing Inputs

- production environment bindings / secrets 實值與 backup 工具規格
- 正式 monitoring stack / alerting channel owner
- 現場營運對中文版手冊的交付格式（畫面版、純文字版、值班版）

research_required: true

### Sources

- Idx-015 / Idx-016 test coverage 現狀
- Idx-017 deploy runbook

### Assumptions

- VERIFIED - mainline E2E smoke 與 regression suite 已涵蓋 happy path
- VERIFIED - `Idx-023` 已補 GitHub-hosted `release-preflight` artifact，可作為 post-launch runbook 的基線證據
- RISK: unverified - production backup / restore 與 monitoring stack 尚未正式收斂

---

## 🧩 SLICE SEQUENCE

| Slice | 狀態 | 目標 | 主要輸出 | 備註 |
|---|---|---|---|---|
| Slice 1 | Active | E2E 邊界場景矩陣與 executable gap closure plan | scenario matrix、owner mapping、active checks、missing checks backlog | 本輪優先處理 |
| Slice 2 | Planned | 正式環境運維預案與 hosted preflight readback | release-preflight operator guide、backup / restore matrix、health / escalation runbook | 依賴 Slice 1 對高風險場景的 readback 結論 |
| Slice 3 | Planned | 中文版操作手冊與排故指引 | intake / daily ops / rollback / preflight 手冊 | 只承接已凍結流程 |

### Active Slice

- `work_unit_id`: `idx-024-slice-1-edge-e2e-and-ops-readback`
- 目標：收斂 post-launch 第一優先高風險面，先定義 executable evidence 與運維 readback 所需最小權威文件
- 範圍：scenario inventory、測試面映射、manual drill 缺口、runbook dependency matrix
- 不含：正式 backup job 實作、monitoring vendor 導入、Portal UI 教學素材製作

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Cross-module hardening / operations readiness
- Adjacent modules: `apps/api/src/daily-ops`, `apps/api/src/intake`, `apps/api/test`, `doc/architecture/decisions`, `doc/architecture/flows`
- Out of scope modules: Procurement、Finance runtime、Observability vendor implementation、new Portal feature work

### File whitelist

- `doc/plans/Idx-024_plan.md`
- `doc/logs/Idx-024_log.md`
- `doc/implementation_plan_index.md`
- `doc/logs/Idx-023_log.md`
- `doc/architecture/flows/**`
- `doc/architecture/decisions/**`
- `apps/api/test/**`
- `apps/api/scripts/**`
- `.github/workflows/ci.yml`

### Conditional impact blocks

#### MASTER DATA IMPACT

- 本任務不新增或改寫主資料 owner surface。
- 若某個 E2E 邊界場景需要依賴主資料異常資料，應用 fixture / test data 模擬，不得直接擴張 runtime owner contract。

#### STATE / WORKFLOW IMPACT

- 只驗證既有 opening balance、intake、inventory-count、production-planning、release-preflight workflow 的邊界路徑。
- 不在 `Idx-024` 內發明新的狀態欄位或平行 workflow。

#### RBAC IMPACT

- 允許補 role-boundary test、manual drill 與 runbook readback。
- 不在本任務直接重寫 RBAC model；若發現政策缺口，應回寫成權威文件與後續 work item。

#### SHARED KEY / CROSS-MODULE IMPACT

- 只讀取與驗證既有 shared keys / ids 的跨模組一致性。
- 不新增 shared key contract owner，不直接把測試需求擴張成 schema change。

### Done 定義

1. `Idx-024` 已有 slice sequence 與 active slice contract。
2. Hosted `release-preflight` evidence 已被納入 post-launch runbook 基線。
3. 下一輪 Engineer 可直接依 active slice 啟動場景矩陣與 gap inventory，不需再回頭重做規劃。

### Rollback 策略

- Level: L1
- 前置條件: 本輪僅更新 plan / log / index 類 artifact
- 回滾動作: 若 planning refinement 與 index / upstream evidence 衝突，回退本次文檔變更並保留 `Idx-024` 編號與依賴關係

### Max rounds

- 估計: 1
- 超過處理: 若 active slice 無法維持單一 work unit，需停止並拆分，不得把 E2E、運維、手冊再次合併成單包

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-024-slice-1-edge-e2e-and-ops-readback
  goal: build a post-launch hardening scenario matrix for the highest-risk edge paths, map each path to executable evidence or controlled manual drill, and leave operations runbook dependencies explicit
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - targeted-unit-tests
    - targeted-smoke
    - touched-file-lint
  file_scope:
    - doc/plans/Idx-024_plan.md
    - doc/logs/Idx-024_log.md
    - doc/architecture/flows/
    - doc/architecture/decisions/
    - apps/api/test/
    - apps/api/scripts/
    - doc/implementation_plan_index.md
  done_criteria:
    - scenario matrix covers opening balance, intake, inventory-count, production-planning, and release-preflight edge paths
    - each P1 path is classified as executable test, smoke, or controlled manual drill with owner and evidence target
    - hosted release-preflight readback is incorporated into the operations baseline
    - no feature scope expansion into new runtime workflows or schema changes
    - result is ready for domain and security review
  escalation_conditions:
    - schema or migration change becomes required to proceed
    - production-only infra dependency blocks runbook definition
    - edge-path coverage expands beyond approved slice
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/plans/Idx-024_plan.md` | 修改 | 收斂 post-launch high-risk hardening plan 與 active slice |
| `doc/logs/Idx-024_log.md` | 修改 | 回填 planning refinement 與 hosted evidence readback |
| `doc/implementation_plan_index.md` | 修改 | 將 `Idx-024` 狀態調整為 `In Progress` |
| `doc/logs/Idx-023_log.md` | 修改 | 補 hosted `release-preflight` 與 artifact 證據 |

---

## 🧩 SUB-TASKS

| # | 子任務 | 優先順序 | 阻斷關係 | 預估工期 |
|---|--------|---------|---------|---------|
| 1 | E2E 邊界場景矩陣與 executable evidence inventory | P1 | 獨立 | 2-3 days |
| 2 | 缺漏場景的 regression / smoke / manual drill 分流與 owner 指派 | P1 | 依賴 #1 | 2-3 days |
| 3 | 正式環境運維預案（preflight readback、backup/restore、health、escalation） | P1 | 依賴 #1、production infra inputs | 3-5 days |
| 4 | 中文版用戶操作手冊（intake / daily ops / 排故） | P2 | 依賴 #2、#3 | 3-5 days |

---

## ⚠️ 風險

| 風險 | 嚴重性 | 緩解方式 |
|------|--------|---------|
| 邊界場景仍只有 happy-path evidence，線上事故時無法快速判定是否 ledger / audit 污染 | 高 | Slice 1 先把 executable / manual drill matrix 收斂 |
| staging hosted preflight 已成功，但 production runbook 與 backup / restore 還沒有正式責任矩陣 | 高 | Slice 2 優先補 operator readback、責任分工與 escalation tree |
| 手冊若先於流程凍結，會快速失效並誤導現場 | 中 | 手冊放到 Slice 3，僅承接已凍結與已驗證流程 |

---

## 🔒 審查需求

- Domain Review：場景矩陣、runbook 與營運實際流程對齊
- Security Review：health / readiness / backup readback 不可洩漏敏感資訊；production escalation 不可繞過 maker-checker 或審計要求

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
track: [product-system]
plan_created: [2026-04-04]
plan_approved: [2026-04-07 planning refinement started after Idx-023 hosted preflight evidence landed]
scope_policy: [strict]
expert_required: [true]
expert_conclusion: [post-launch 風險已收斂成 E2E 邊界場景、運維預案與手冊三個 slices；三個 slices 已完成並進入 review 收口]
security_review_required: [true]
security_reviewer_tool: [copilot-cli-reviewer（direct one-shot prompt）]
security_review_trigger_source: [mixed]
security_review_trigger_matches: [api, auth, permission, backup, health, rollback, preflight]
security_review_start: [2026-04-07]
security_review_end: [2026-04-07]
security_review_result: [PASS_WITH_RISK]
security_review_conclusion: [conditional pass；backup/restore rehearsal 為 production 前 P0 外部阻斷，intake fail-closed negative smoke 已有 PASS evidence]
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
qa_tool: [copilot-cli-reviewer（direct one-shot prompt） + targeted validation]
qa_tool_version: [workspace tooling + GPT-5.4]
qa_user: [GitHub Copilot]
qa_start: [2026-04-07]
qa_end: [2026-04-07]
qa_result: [PASS_WITH_RISK]
qa_compliance: [focused smoke PASS；QA reviewer 條件通過；remaining risk 已在 log 與 runbook fail-closed 標示]

# 收尾
log_file_path: [doc/logs/Idx-024_log.md]
commit_hash: [pending]
rollback_at: [N/A]
rollback_reason: [N/A]
rollback_files: [N/A]
<!-- EXECUTION_BLOCK_END -->
