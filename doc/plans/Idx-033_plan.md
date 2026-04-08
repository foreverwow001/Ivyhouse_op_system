# Plan: Idx-033 — 營運模式與正式資料庫 provider 治理基線

**Index**: Idx-033
**Created**: 2026-04-08
**Planner**: GitHub Copilot
**Phase**: Phase 1 → Governance
**Primary Module**: Architecture governance
**Work Type**: governance / specification
**Operating Mode**: cross-mode-governance

> 本輪同時覆蓋 `內部測試模式` 與 `單人營運正式層`，目的是把既有決策落成 repo-native authority 與最小引用點，不包含 runtime implementation。`cross-mode-governance` 只是文件治理用 meta marker，不是第三種正式 operating mode。

---

## 🎯 目標

把「內部測試模式 / 單人營運正式層 / Supabase 為中短期正式資料庫首選」三項已確認決策，收斂成 repo-native authority 文檔、入口引用點與 plan template 最小 workflow 錨點，避免後續 task 忘記這些正式前提。

---

## 📋 SPEC

### Goal

建立一份可被後續 plan / log / decision 直接引用的權威文件，並把 operating mode 與 provider baseline 掛進既有 architecture / baseline 導覽。

### Business Context

- 專案已進入同時需要內部驗證與單人正式營運的階段，不能再用單一模糊的 production 假設描述所有工作。
- 目前已確認 Supabase 是中短期 3-5 年正式資料庫 provider 首選，但此結論尚未形成 repo-native authority。
- 若不把 operating mode 與 provider baseline 落成正式文檔，後續 plan / log / decision 很容易在 deploy、backup、sign-off 與環境治理上失去一致性。

### Non-goals

- 不修改 API、Portal、CI workflow 或任何 runtime code。
- 不在本任務內執行資料庫 provider 遷移、Cloud Run deploy 實作或 secrets wiring。
- 不把單人營運正式層包裝成多管理員企業 production 治理。

### Acceptance Criteria

1. `doc/architecture/decisions/` 內新增正式 authority 文檔，明確定義兩種 operating mode、最低控制、provider 決策、重評條件與引用規則。
2. `project_overview.md`、技術基線、CI / 環境治理與 README 導覽都出現最小引用點，後續讀者可自然找到 authority 文檔。
3. `Idx-000_plan.template.md` 新增 `operating_mode` 欄位，至少可表達 `internal-testing` 與 `single-operator-production`。
4. `Idx-033_plan.md` 與 `Idx-033_log.md` 誠實記錄本輪為文件治理工作，未假裝完成 runtime implementation。

### Edge Cases

- 後續 task 同時覆蓋兩種模式 -> 允許用 `cross-mode-governance`，但它只是一個 meta marker；正式 operating mode 仍只有 `internal-testing` 與 `single-operator-production`，且計畫內必須明示適用範圍。
- 後續 task 想直接改寫 Cloud SQL 為當前 baseline -> 必須先更新 authority 文檔，不可只改單一 baseline 檔。
- 內部測試模式被誤用成正式營運依據 -> 應回引用本文件，說明其非目標與限制。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/project_overview.md`
- `doc/architecture/README.md`
- `doc/architecture/decisions/README.md`
- `doc/architecture/decisions/technical_baseline_and_project_bootstrap.md`
- `doc/architecture/decisions/ci_and_env_governance_baseline.md`
- `doc/plans/Idx-000_plan.template.md`

### Missing Inputs

- 無。使用者已明確確認 operating mode 與 provider 決策，本輪只負責把結論落成 authority 文檔與引用點。

research_required: false

### Sources

- 使用者本輪已確認的治理決策
- repo 既有 architecture / baseline / template 文檔

### Assumptions

- VERIFIED - 本輪是 docs-only governance 任務，不需修改任何 runtime code。
- VERIFIED - `Idx-033` 是下一個可用正式 task 編號。
- VERIFIED - Supabase provider 決策是中短期 baseline，Cloud SQL 僅保留為未來重評選項。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Architecture governance
- Adjacent modules: implementation planning、baseline navigation、environment governance
- Out of scope modules: API runtime、Portal runtime、CI workflow implementation、schema / migration、infra provisioning

### File whitelist

- `doc/implementation_plan_index.md` - 新增 Idx-033 與更新統計
- `doc/plans/Idx-033_plan.md` - 建立正式 plan artifact
- `doc/logs/Idx-033_log.md` - 建立正式 log artifact
- `doc/architecture/decisions/operating_mode_and_database_provider_baseline.md` - 建立 authority 文檔
- `doc/architecture/project_overview.md` - 補高層產品 / 營運定位引用
- `doc/architecture/decisions/technical_baseline_and_project_bootstrap.md` - 補正式 deploy 與 provider baseline 結論
- `doc/architecture/decisions/ci_and_env_governance_baseline.md` - 補 operating mode 的環境治理最低線
- `doc/architecture/README.md` - 新增導覽入口
- `doc/architecture/decisions/README.md` - 新增 decisions 導覽入口與使用指引
- `doc/plans/Idx-000_plan.template.md` - 增加 `operating_mode` 欄位與說明

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 本輪只新增 plan template 的 `operating_mode` workflow 錨點。
- 不修改業務狀態機、approval flow 或 runtime workflow。

#### RBAC IMPACT

- N/A

#### SHARED KEY / CROSS-MODULE IMPACT

- N/A

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- 本輪只在 authority 文檔中明文化單人營運正式層最低必備的 audit trail 要求。

### Done 定義

1. authority 文檔、入口引用點與 plan template 錨點都已落地。
2. `Idx-033` 的 plan / log 已建立，且誠實記錄本輪是 docs-only governance 工作。
3. 受影響 markdown 檔通過窄驗證，且 `operating_mode` 與 authority 文檔引用可被 grep 找到。

### Rollback 策略

- Level: L1
- 前置條件: 本輪僅改動白名單內 markdown 文檔
- 回滾動作: 若 authority 文檔命名或引用位置被判定不合適，可回退本輪文檔變更並重新收斂導覽與模板欄位；不涉及 runtime rollback

### Max rounds

- 估計: 2
- 超過處理: 若 markdown validation 或引用路徑出現爭議，只修白名單內文件，不擴大到 runtime 或其他治理面

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-033-operating-mode-and-provider-governance-baseline
  goal: land the operating mode and database provider decisions as repo-native authority docs and minimal reference anchors without changing runtime code
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - touched-file-lint
    - targeted-grep
  file_scope:
    - doc/implementation_plan_index.md
    - doc/plans/Idx-033_plan.md
    - doc/logs/Idx-033_log.md
    - doc/architecture/decisions/operating_mode_and_database_provider_baseline.md
    - doc/architecture/project_overview.md
    - doc/architecture/decisions/technical_baseline_and_project_bootstrap.md
    - doc/architecture/decisions/ci_and_env_governance_baseline.md
    - doc/architecture/README.md
    - doc/architecture/decisions/README.md
    - doc/plans/Idx-000_plan.template.md
  done_criteria:
    - authority doc exists and is linked from architecture entry points
    - technical baseline and ci governance docs reflect the adopted conclusions
    - plan template includes operating_mode
    - no file changes outside file_scope
    - engineer result is ready for external review
  escalation_conditions:
    - new request expands into runtime implementation
    - authority conflicts with existing higher-priority governance docs
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `doc/implementation_plan_index.md` | 修改 | 新增 Idx-033 與更新統計 |
| `doc/plans/Idx-033_plan.md` | 新增 | 建立本輪正式計畫 |
| `doc/logs/Idx-033_log.md` | 新增 | 建立本輪執行紀錄 |
| `doc/architecture/decisions/operating_mode_and_database_provider_baseline.md` | 新增 | 建立 authority 文檔 |
| `doc/architecture/project_overview.md` | 修改 | 補高層營運定位與 authority 引用 |
| `doc/architecture/decisions/technical_baseline_and_project_bootstrap.md` | 修改 | 補正式 deploy 與 provider baseline 結論 |
| `doc/architecture/decisions/ci_and_env_governance_baseline.md` | 修改 | 補 operating mode 的環境治理最低線 |
| `doc/architecture/README.md` | 修改 | 導覽新增 authority 文檔入口 |
| `doc/architecture/decisions/README.md` | 修改 | 導覽與使用方式新增 authority 文檔入口 |
| `doc/plans/Idx-000_plan.template.md` | 修改 | 增加 `operating_mode` 欄位與說明 |

---

## 實作指引

### 1. 文件與權威邊界

- 以 decisions authority 文檔承接 operating mode 與 provider baseline。
- 其他檔案只補最小引用點與短結論，不在多處複製完整規格。

### 2. workflow 錨點

- plan template 只新增最小必要的 `operating_mode` 欄位與說明。
- 不在本輪擴充其他 template、script 或 reviewer tooling。

### 3. 驗證

- 針對受影響 markdown 檔執行窄範圍 problems / errors 檢查。
- 以 grep 驗證 `operating_mode` 與 authority 文檔引用已存在。

---

## 注意事項

- 風險提示: 若後續文件只引用局部短結論而不回指 authority 文檔，仍可能再次發生治理漂移。
- 資安考量: 本輪只補治理結論，不新增 secret、credential 或 deploy 指令。
- 相依性: 本輪結論會被後續 deploy、provider、環境治理與 plan / log 引用。
- 缺漏前提: N/A

---

## 相關資源

- `doc/architecture/decisions/technical_baseline_and_project_bootstrap.md`
- `doc/architecture/decisions/ci_and_env_governance_baseline.md`
- `doc/architecture/project_overview.md`

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
operating_mode: [cross-mode-governance]
plan_created: [2026-04-08 00:00:00]
plan_approved: [2026-04-08 via askQuestions docs-only governance gate; user confirmed direct white-list doc edits may proceed]
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
execution_backend_policy: [chat-primary-with-one-shot-reviewers]
scope_exceptions: []

# Engineer 執行
executor_tool: [GitHub Copilot]
executor_backend: [copilot-chat-agent]
monitor_backend: [checkpoint-first-targeted-validation]
executor_tool_version: [GPT-5.4]
executor_user: [GitHub Copilot]
executor_start: [2026-04-08 00:00:00]
executor_end: [2026-04-08 00:00:00]
session_id: [N/A]
last_change_tool: [GitHub Copilot]

# QA 執行
qa_tool: [Ivy QA Reviewer]
qa_tool_version: [GPT-5.4]
qa_user: [GitHub Copilot]
qa_start: [2026-04-08]
qa_end: [2026-04-08]
qa_result: [PASS_WITH_RISK]
qa_compliance: [PASS - cross-QA satisfied；QA reviewer 已執行，findings 限於 artifacts 的 QA 留痕、meta marker 定位與引用鏈追溯性，已由本輪 docs-only follow-up 補修]

# 收尾
log_file_path: [doc/logs/Idx-033_log.md]
commit_hash: [pending]
rollback_at: [N/A]
rollback_reason: [N/A]
rollback_files: [N/A]
<!-- EXECUTION_BLOCK_END -->