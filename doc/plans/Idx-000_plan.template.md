# Plan: Idx-NNN

**Index**: Idx-NNN
**Created**: YYYY-MM-DD
**Planner**: @AgentName
**Phase**: [Phase 0 | Phase 1 | Phase 2 | ...]
**Primary Module**: [Portal | Master Data | Procurement | Inventory | Production | Order / Fulfillment | Finance / Reconciliation | Analytics]
**Work Type**: [governance | specification | implementation | bugfix | migration | integration]
**Operating Mode**: [internal-testing | single-operator-production | cross-mode-governance]
**Track**: [product-system | workflow-core]

> `Operating Mode` 用來標示本輪任務適用的正式營運層級。若文件同時覆蓋兩種模式，應使用 `cross-mode-governance`，並在目標段落寫清楚適用範圍。
>
> `Track` 只用來區分任務工作焦點；`product-system` 表示產品 / 營運系統與治理面，`workflow-core` 表示 repo workflow、agent、prompt、reviewer 與 local skills surface。`Track` 不是營運層級，不可取代 `Operating Mode`。

---

## 🎯 目標

[用 2 到 4 句說清楚這份計畫要解決什麼問題、為什麼現在要做、成功後會對哪段營運主線產生效果。]

---

## 📋 SPEC

### Goal

[一句話描述本輪唯一主要目標。]

### Business Context

- [這次需求屬於哪段營運主線]
- [使用角色是誰]
- [為什麼這件事現在需要被處理]

### Non-goals

- [明確排除項目 1]
- [明確排除項目 2]

### Acceptance Criteria

1. [可驗收條件 1]
2. [可驗收條件 2]
3. [若有情境驗收，說明主線或例外路徑]

### Edge Cases

- [邊界情境 1] -> [預期處理方式]
- [邊界情境 2] -> [預期處理方式]

---

## 🔍 RESEARCH & ASSUMPTIONS

> 本區塊同時承載 authoritative inputs、研究來源與假設。若需要的文件不存在，必須在此寫 `缺漏`，並在後續 impact blocks 與注意事項重複標記。

### Required Inputs

- `project_rules.md` 或等價規則來源
- `doc/implementation_plan_index.md`
- `doc/architecture/data/README.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/modules/README.md`
- `doc/architecture/decisions/README.md`
- [其他本輪必需文件]

### Missing Inputs

- [N/A | 缺少的主資料字典、state 定義、RBAC matrix、ADR、外部規格]

> Planner 必須明確標記是否需要額外研究。若 `research_required: true`，Sources 與 Assumptions 不可空白。

research_required: [true|false]

### Sources

- [user 提供的官方文件或 repo 內權威文件]
- [若是 reviewed Obsidian surface，需標明其在本輪扮演的角色]

### Assumptions

- [N/A | VERIFIED - 已由權威文件確認的前提]
- [N/A | RISK: unverified - 尚未被正式文件驗證的假設]

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: [本輪主要模組]
- Adjacent modules: [N/A | 受影響的相鄰模組]
- Out of scope modules: [明確不觸及的模組]

### File whitelist

- [path/to/file_or_directory] - [變更原因]
- [path/to/file_or_directory] - [變更原因]

### Conditional impact blocks

#### MASTER DATA IMPACT

- [N/A | 涉及的主資料實體]
- [N/A | authoritative owner / 字典欄位 / 有效期間 / 停用規則]

#### STATE / WORKFLOW IMPACT

- [N/A | 涉及的流程、狀態、轉移條件]
- [N/A | 失敗回退、例外路徑、不可逆節點]

#### RBAC IMPACT

- [N/A | 涉及的角色、權限、approval boundary]
- [N/A | 可見性、操作限制、maker-checker 或人工覆核要求]

#### SHARED KEY / CROSS-MODULE IMPACT

- [N/A | shared key、integration contract、event payload、schema contract]
- [N/A | 受影響的相鄰模組、同步邊界、報表或外部整合]

#### FINANCE / RECONCILIATION IMPACT

- [N/A | 是否影響發票、付款、核銷、成本、對帳]
- [N/A | 是否需要保留審計、追溯與人工覆核]

#### OBSERVABILITY / AUDIT IMPACT

- [N/A | log、trace、audit、exception evidence 需求]

### Done 定義

1. [完成條件 1]
2. [完成條件 2]
3. [完成條件 3]

### Rollback 策略

- Level: [L1|L2|L3|L4]
- 前置條件: [執行回滾前必須成立的條件]
- 回滾動作: [具體回滾方式或保守替代方案]

### Max rounds

- 估計: [預估執行回合數]
- 超過處理: [超過後要怎麼升級或停手]

### Bounded work unit contract

> 若本次任務要使用 bounded Engineer loop，必須提供且只提供一個 machine-readable `work_unit`。`file_scope` 應與 `File whitelist` 對齊，`done_criteria` 應與 `Done 定義` 對齊。

```yaml
work_unit:
  work_unit_id: [stable-id-for-single-approved-unit]
  goal: [smallest approved engineer goal]
  retry_budget: [5]
  allowed_checks:
    - [plan-validator]
    - [targeted-unit-tests]
    - [touched-file-lint]
  file_scope:
    - [path/to/source_file]
    - [path/to/test_file]
  done_criteria:
    - [criteria 1]
    - [criteria 2]
    - [no file changes outside file_scope]
    - [engineer result is ready for external review]
  escalation_conditions:
    - [scope break]
    - [new security-sensitive path or keyword triggered]
    - [retry budget exhausted]
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| path/to/file | 新增 / 修改 / 刪除 | 變更目的 |

---

## 實作指引

### 1. 模組與資料層

- [描述這次要在哪一層修改，不可直接跨模組寫資料]
- [描述資料來源、owner 與禁止捷徑]

### 2. 流程與權限

- [描述狀態轉移與角色限制]
- [描述例外情境與人工覆核點]

### 3. 介面與驗證

- [描述 API、UI、job、report 或 script 的預期行為]
- [描述要跑的 review / test / manual check]

---

## 注意事項

- 風險提示: [可能破壞的地方]
- 資安考量: [敏感資料、權限、審計與 secrets 原則]
- 相依性: [與其他檔案、模組或外部系統的關聯]
- 缺漏前提: [N/A | 仍缺哪些權威文件或決策]

---

## 相關資源

- [相關文件、Issue、ADR、reviewed notes]

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
operating_mode: [internal-testing|single-operator-production|cross-mode-governance]
track: [product-system|workflow-core]
plan_created: [YYYY-MM-DD HH:mm:ss]
plan_approved: [YYYY-MM-DD HH:mm:ss]
scope_policy: [strict|flexible]
expert_required: [true|false]
expert_conclusion: [N/A|結論摘要]
security_review_required: [true|false]
security_reviewer_tool: [N/A|待用戶確認: codex-cli|copilot-cli]
security_review_trigger_source: [none|user|coordinator|path-rule|keyword-rule|mixed]
security_review_trigger_matches: []
security_review_start: [N/A|YYYY-MM-DD HH:mm:ss]
security_review_end: [N/A|YYYY-MM-DD HH:mm:ss]
security_review_result: [N/A|PASS|PASS_WITH_RISK|FAIL]
security_review_conclusion: [N/A|結論摘要]
execution_backend_policy: [pty-primary-with-consented-fallback]
scope_exceptions: []

# Engineer 執行
executor_tool: [待用戶確認: codex-cli|copilot-cli]
executor_backend: [ivyhouse_terminal_pty|ivyhouse_terminal_fallback]
monitor_backend: [pty_runtime_monitor|fallback_runtime_monitor|manual_confirmation]
executor_tool_version: [version number]
executor_user: [github-account or email]
executor_start: [執行開始時間]
executor_end: [執行結束時間]
session_id: [terminal session ID if available]
last_change_tool: [codex-cli|copilot-cli]

# QA 執行
qa_tool: [待用戶確認: codex-cli|copilot-cli]
qa_tool_version: [version number]
qa_user: [github-account or email]
qa_start: [QA 開始時間]
qa_end: [QA 結束時間]
qa_result: [PASS|PASS_WITH_RISK|FAIL]
qa_compliance: [✅ 符合|⚠️ 例外：原因]

# 任務注入提醒（Coordinator 派發時不可省略）
# Security Reviewer：必須附上
#   cat .agent/skills/security-review-helper/SKILL.md
#   cat .agent/skills/security-review-helper/references/security_checklist.md
# QA：必須附上至少一條 code-reviewer 命令
#   python .agent/skills/code-reviewer/scripts/code_reviewer.py <file_path|directory|diff>
#   或 python .agent/skills/code-reviewer/scripts/code_reviewer.py git diff --staged|--cached|<base>..<head> .
# 若專案有測試，也必須附上
#   python .agent/skills/test-runner/scripts/test_runner.py [test_path]

# 收尾
log_file_path: [doc/logs/Idx-XXX_log.md]
commit_hash: [pending|hash]
rollback_at: [N/A|YYYY-MM-DD HH:mm:ss]
rollback_reason: [N/A|原因]
rollback_files: [N/A|檔案清單]
<!-- EXECUTION_BLOCK_END -->

> 注意：`last_change_tool` 只允許 `codex-cli` 或 `copilot-cli`；`GitHub Copilot Chat` 固定是 Coordinator，不做實作。

### 執行模式建議

| 工具 | 適用場景 | 優勢 | 限制 | 需要監控 |
|------|---------|------|------|----------|
| GitHub Copilot Chat（Coordinator） | 目標確認、分派、更新 Plan / Log | 協調能力強，掌握 PTY artifact | 不直接實作 / QA | 是 |
| Codex CLI（PTY-backed VS Code Terminal） | 批次檔案操作、重構、腳本執行 | 速度快，適合大範圍結構工作 | 需被監控 | 是 |
| Copilot CLI（PTY-backed VS Code Terminal） | 互動式終端操作、驗證、局部修正 | 對終端整合友善 | 需被監控 | 是 |

### QA 模式建議

| Executor Tool | 建議 QA Tool | 理由 |
|---------------|--------------|------|
| Codex CLI | Copilot CLI | 避免同工具自審 |
| Copilot CLI | Codex CLI | 避免同工具自審 |

---

## 用戶確認

> Planner 產出 Spec 後，必須等待用戶確認才能進入 Step 2。

- [ ] Spec 已確認，可進入 Step 2（Domain Expert）
- [ ] Security Review Policy 已確認，且已寫入 EXECUTION_BLOCK
- [ ] Engineer Tool 已選擇，且已寫入 EXECUTION_BLOCK
- [ ] QA Tool 已選擇，且已符合 Cross-QA 要求
- [ ] Execution Backend Policy 已確認
- [ ] Terminal 管理策略已確認

---

**Template Version**: 3.0.0
**Last Updated**: 2026-03-24
**Project**: Ivyhouse OP System