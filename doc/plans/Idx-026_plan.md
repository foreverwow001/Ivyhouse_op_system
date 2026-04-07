# Plan: Idx-026 — Repo-local UI/UX skill family 建置：品牌 style、入口頁、流程 landing、2.5D icon 與前端互動狀態

> Historical note (`Idx-029` Phase 4): 本文件中出現的 `.agent/skills_local/**`、`.agent/state/skills/INDEX.local.md`、`.agent/config/skills/skill_whitelist.json` 與 `.agent/state/skills/skill_manifest.json` 僅代表當時的 mutable path。cutover 後的現行 authority 已改為 `.workflow-core/skills_local/**`、`.workflow-core/state/skills/INDEX.local.md`、`.workflow-core/config/skills/skill_whitelist.json` 與 `.workflow-core/state/skills/skill_manifest.json`。

**Index**: Idx-026
**Created**: 2026-04-04
**Planner**: Copilot
**Phase**: Phase 1 → Go-Live Support
**Primary Module**: Portal / Workflow Tooling
**Work Type**: governance / implementation

---

## 🎯 目標

在 `Idx-023` 前端 Portal 正式實作前，先建立一套 repo-local UI/UX skill family，讓 login page、landing page、品牌 token、2.5D icon 與前端互動狀態有共同的 skill contract，而不是在每輪實作中依賴臨時聊天指令重複解釋。

本計畫的成功條件不是直接交付前端畫面，而是把 UI/UX 規則正式落到 `.agent/skills_local/` 與 overlay catalog，供後續 Planner / Engineer / QA 在前端工作時一致引用。

---

## 📋 SPEC

### Goal

建立完整第一版 repo-local UI/UX skill family，支撐 `Idx-023` 的 login page、landing page 與 Portal 初版前端工作。

### Business Context

- `Idx-023` 已把前端 Portal UI 列為 go-live blocker。
- Ivyhouse 的前端需求同時要求品牌相似性、營運系統可用性、流程導向 landing page 與 2.5D icon 一致性。
- 現有 repo 只有 `UI/UX Gate`，沒有可重用的 UI/UX skill family；若直接進實作，畫面與交互規則高機率在多輪變更中漂移。

### Non-goals

- 不直接實作 Next.js app、login page 或 landing page 前端程式碼。
- 不建立新的專責 UI / UX agent。
- 不在本輪完成完整 design system runtime 或 icon 資產庫。

### Acceptance Criteria

1. `.agent/skills_local/` 已建立完整第一版 UI/UX skill family，至少覆蓋品牌 style、入口頁、流程 landing、2.5D icon 與 React UI states。
2. local overlay catalog 已能清楚列出這批 skills 的名稱、用途與來源。
3. 每個 skill 都有明確責任邊界、觸發條件、核心要求與對應 references。
4. skill family 與既有 `portal_ui_ux_baseline.md`、`portal_brand_token_and_icon_pre_spec.md`、`portal_landing_flow_mapping_spec.md` 對齊，不產生平行規格。
5. 已明確記錄哪些內容來自外部 repo 的拆分 / 吸收 / 參考，而非整包導入。

### Edge Cases

- `.agent/skills_local/` 與 `.agent/state/skills/INDEX.local.md` 尚不存在 -> 本輪需一併初始化最小 overlay 結構。
- 某些 skill 邊界與現有角色職責重疊 -> 以「skills 補角色，不新增平行角色」為原則收斂。
- 外部 repo 的 skill schema 與本 repo 不一致 -> 以本 repo 的 `SKILL.md + references/` 形式轉寫，不直接搬入外部 schema。

---

## 🔍 RESEARCH & ASSUMPTIONS

### Required Inputs

- `project_rules.md`
- `doc/implementation_plan_index.md`
- `doc/architecture/modules/portal_ui_ux_baseline.md`
- `doc/architecture/modules/portal_brand_token_and_icon_pre_spec.md`
- `doc/architecture/flows/portal_landing_flow_mapping_spec.md`
- `.agent/skills/INDEX.md`
- `.agent/skills/github-explorer/SKILL.md`
- `.agent/skills/skill-converter/scripts/skill_converter.py`
- `project_maintainers/improvement_candidates/2026-04-04-ui-ux-skill-family-candidate.md`

### Missing Inputs

- `N/A` 作為技能骨架前置；但若後續要自動化註冊 / 轉換，仍需再確認 local overlay index 的既有寫入流程是否要用 script 還是手動維護。

research_required: true

### Sources

- repo 內既有 UI/UX 基線文件與 `Idx-023` plan
- 外部 repo 研究結果：
  - `vibeforge1111/vibeship-spawner-skills`
  - `sickn33/antigravity-awesome-skills`
  - `anthropics/skills`
  - `nextlevelbuilder/ui-ux-pro-max-skill`

### Assumptions

- VERIFIED - 第一波 skills 應先採 project-local overlay，避免直接污染 builtin core catalog。
- VERIFIED - 現有 workflow 不需要先新增 agent；skills 足以承接本輪缺口。
- RISK: unverified - local overlay catalog 是否需要同步寫入 manifest 或 whitelist，需在實作前再確認最小必要寫入面。

---

## 🔒 SCOPE & CONSTRAINTS

### 模組影響範圍

- Primary module: Portal / Workflow Tooling
- Adjacent modules: `.agent/state/skills/`, `doc/architecture/modules/`, `doc/architecture/flows/`
- Out of scope modules: `apps/api/**`, `apps/web/**`（若存在）、資料庫 schema、runtime business modules

### File whitelist

- `.agent/skills_local/` - 新增 repo-local UI/UX skills
- `.agent/state/skills/INDEX.local.md` - 建立或更新 local overlay catalog
- `.agent/state/skills/skill_manifest.json` - 僅在驗證後確認必要時更新
- `.agent/config/skills/skill_whitelist.json` - 僅在驗證後確認必要時更新
- `project_maintainers/improvement_candidates/2026-04-04-ui-ux-skill-family-candidate.md` - 若需回填已實作結果
- `doc/implementation_plan_index.md` - 記錄任務狀態
- `doc/plans/Idx-026_plan.md` - 本計畫
- `doc/logs/Idx-026_log.md` - 啟動後建立 log

### Conditional impact blocks

#### MASTER DATA IMPACT

- N/A

#### STATE / WORKFLOW IMPACT

- 不變更 business workflow 狀態機。
- 變更的是 workflow tooling 層：讓前端任務可正式載入 UI/UX skills，而非只有空的 `UI/UX Gate`。

#### RBAC IMPACT

- N/A
- 明確維持「不新增 UI / UX agent」原則，避免新增平行責任鏈。

#### SHARED KEY / CROSS-MODULE IMPACT

- 不變更業務 shared key。
- 可能影響 skill catalog / overlay catalog 結構與引用方式。

#### FINANCE / RECONCILIATION IMPACT

- N/A

#### OBSERVABILITY / AUDIT IMPACT

- 需保留 skills 來源、用途與 references，方便後續審查與 promotion。

### Done 定義

1. UI/UX skill family 已完整建立為 repo-local overlay。
2. local overlay catalog 可清楚列出 skills 與用途。
3. skill family 已能直接支援 `Idx-023` 的 login / landing / theme / icon / UI states 前端切片。

### Rollback 策略

- Level: L2
- 前置條件: 僅限本輪新增的 local skill files 與 overlay catalog 改動
- 回滾動作: 移除新增的 `.agent/skills_local/` 內容與對應 local index / manifest 變更，保留分析文件與 architecture docs

### Max rounds

- 估計: 2-3
- 超過處理: 若 overlay catalog / manifest 寫入規則不清楚，先停在 local docs-only skeleton，再補確認

### Bounded work unit contract

```yaml
work_unit:
  work_unit_id: idx-026-ui-ux-skill-family-bootstrap
  goal: build repo-local UI/UX skill family skeleton and local overlay catalog for Portal pre-implementation use
  retry_budget: 5
  allowed_checks:
    - plan-validator
    - touched-file-lint
  file_scope:
    - .agent/skills_local/
    - .agent/state/skills/INDEX.local.md
    - .agent/state/skills/skill_manifest.json
    - .agent/config/skills/skill_whitelist.json
    - doc/logs/Idx-026_log.md
  done_criteria:
    - repo-local UI/UX skills exist under .agent/skills_local/
    - local overlay catalog documents the added skills
    - no file changes outside file_scope except approved plan/index updates
    - engineer result is ready for external review
  escalation_conditions:
    - scope break
    - manifest or whitelist semantics unclear
    - retry budget exhausted
```

---

## 📁 檔案變更

| 檔案 | 動作 | 說明 |
|------|------|------|
| `.agent/skills_local/` | 新增 | 建立 repo-local UI/UX skill family |
| `.agent/state/skills/INDEX.local.md` | 新增 / 修改 | 記錄 local overlay skills |
| `.agent/state/skills/skill_manifest.json` | 條件式修改 | 若 local overlay 需要登記 manifest |
| `.agent/config/skills/skill_whitelist.json` | 條件式修改 | 若 local overlay 需要白名單配置 |
| `doc/logs/Idx-026_log.md` | 新增 | 記錄建置、驗證與來源證據 |

---

## 實作指引

### 1. skill family 結構

- 第一版預計建立以下 skills：
  - `brand-style-system`
  - `ops-entry-pages`
  - `ops-flow-landing`
  - `react-ui-state-patterns`
  - `iconography-2_5d`
  - `accessibility-density-review`
- 每個 skill 至少應包含：
  - `SKILL.md`
  - 必要的 `references/` 文件

### 2. 來源轉寫原則

- `vibeforge1111/vibeship-spawner-skills`：吸收 skill family 架構與 patterns / anti-patterns 思路
- `sickn33/antigravity-awesome-skills`：吸收 React UI states 主體
- `anthropics/skills`：吸收品牌視覺品質 guardrail
- `nextlevelbuilder/ui-ux-pro-max-skill`：吸收 style / color / typography / UX checklist 概念

### 3. workflow 邊界

- skills 服務現有角色，不新增 agent。
- 若 local overlay catalog 或 manifest 有多種可行寫法，優先採最小變更面。

---

## 注意事項

- 風險提示: 若 skill family 做得過重，會延誤 `Idx-023` 前端切片啟動；需避免把第一版做成完整 design platform。
- 資安考量: skills 不得引入外部 script、遠端 installer 或不明執行碼。
- 相依性: 本輪依賴既有 UI/UX baseline 文件與 `Idx-023` 的 Portal 範圍。
- 缺漏前提: local overlay manifest / whitelist 是否必須同步更新，需在實作前再做一次最小確認。

---

## 相關資源

- `doc/plans/Idx-023_plan.md`
- `doc/architecture/modules/portal_ui_ux_baseline.md`
- `doc/architecture/modules/portal_brand_token_and_icon_pre_spec.md`
- `doc/architecture/flows/portal_landing_flow_mapping_spec.md`
- `project_maintainers/improvement_candidates/2026-04-04-ui-ux-skill-family-candidate.md`

---

## 執行資訊

<!-- EXECUTION_BLOCK_START -->
# Plan 狀態
plan_created: [2026-04-04 19:13:39]
plan_approved: [2026-04-04 19:13:39]
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
log_file_path: [doc/logs/Idx-026_log.md]
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