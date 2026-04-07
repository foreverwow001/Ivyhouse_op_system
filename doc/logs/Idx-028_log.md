# Idx-028: Portal app scaffold、login page 與 landing shell - Execution Log

> Historical note (`Idx-029` Phase 4): 本 log 內列出的 `.agent` mutable path 代表當時 artifact 路徑；現行 mutable authority 已切到 `.workflow-core/**`。

> 建立日期: 2026-04-05
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-028`
- plan_file_path: `doc/plans/Idx-028_plan.md`
- log_file_path: `doc/logs/Idx-028_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal
建立 `apps/portal` 的最小 Next.js + React + TypeScript workspace app，交付品牌化 `/login` 與流程導向 `/landing` 第一版殼層，並確認 `build:portal` 可成功執行。

### Scope
- 新增 `apps/portal/**` Next app scaffold 與 app router 路由
- 更新 root `package.json`，加入 Portal workspace scripts
- 更新 `package-lock.json` 以反映 portal workspace 相依
- 不觸及 `apps/api/**`、auth backend contract、RBAC、intake / daily ops 正式表單或 CI/CD

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | codex-cli |
| qa_tool | copilot-pty cross-QA（PASS；1 個 LOW 非 blocking observation） |
| last_change_tool | escalated shell fallback |
| validation_result | PASS |
| commit_hash | N/A（workspace 非 git repo） |
| completion_timestamp_utc | 2026-04-05T10:43:56Z |

## 🛠️ CHANGES_APPLIED

| Target | Status | Summary |
|-------|--------|---------|
| `package.json` | PASS | 新增 `build:portal`、`dev:portal`、`start:portal` root workspace scripts |
| `package-lock.json` | PASS | `npm install` 後納入 `@ivyhouse/portal` 與 Next / React 相依 |
| `apps/portal/package.json` | PASS | 建立 Portal workspace package 與最小 scripts |
| `apps/portal/app/login/page.tsx` | PASS | 實作品牌化 login shell，含清楚 label、本地 submit/loading/error 狀態與 `/landing` 導向；最小修正回合將 live region 改為 `role="status"` + `aria-live="polite"` |
| `apps/portal/app/landing/page.tsx` | PASS | 實作流程導向 landing shell，含主節點、治理節點、future nodes 與狀態展示 |
| `apps/portal/app/globals.css` | PASS | 以 Ivyhouse brand token 建立共用頁面樣式、卡片、按鈕、焦點與版面節奏 |
| `apps/portal/app/layout.tsx` | PASS | 建立 app router 根 layout 與 metadata |
| `apps/portal/app/page.tsx` | PASS | root route 轉導至 `/login` |
| `.gitignore` | PASS | 新增 `.next/` ignore 規則，覆蓋 Portal Next build artifacts |
| `doc/implementation_plan_index.md` | PASS | 將 Idx-028 狀態由 `Planning` 同步為 `Completed`，並修正下一階段說明與統計資訊 |

## 📈 VALIDATION

- Required pre-read completed before changes:
  - `.agent/state/skills/INDEX.local.md`
  - `.agent/skills/typescript-expert/SKILL.md`
  - `.agent/skills_local/brand-style-system/SKILL.md`
  - `.agent/skills_local/ops-entry-pages/SKILL.md`
  - `.agent/skills_local/ops-flow-landing/SKILL.md`
  - `.agent/skills_local/react-ui-state-patterns/SKILL.md`
  - `.agent/skills_local/accessibility-density-review/SKILL.md`
  - `doc/architecture/modules/portal_ui_ux_baseline.md`
  - `doc/architecture/flows/portal_landing_flow_mapping_spec.md`
  - `doc/plans/Idx-028_plan.md`
- `apply_patch` was unavailable in this workspace due `bwrap: No permissions to create a new namespace`; user explicitly approved a shell-based fallback limited to task file scope.
- Initial implementation validation:
  - `npm install` -> PASS
  - `npm run build:portal` -> PASS
- Minimal correction round validation:
  - `.gitignore` updated to ignore `.next/` so Portal build artifacts do not remain in the formal change surface.
  - Existing `apps/portal/.next` was removed before the validation build.
  - `npm run build:portal` -> PASS on 2026-04-05T10:43:56Z
  - Regenerated `apps/portal/.next` was removed again after validation.
  - Copilot PTY cross-QA fix round -> PASS; no blocking findings, with 1 LOW residual observation that `role="status"` for validation errors is acceptable for this UI shell slice but less urgent than `role="alert"`.
- Latest build result:
  - Next.js `14.2.35`
  - Compile, type-check, static page generation, and trace collection completed successfully.
  - Route summary:
    - `/`
    - `/_not-found`
    - `/landing`
    - `/login`

## ✅ RESULT_NOTES

- `/login` is a UI-only shell with explicit form labels, disabled/loading submit state, and visible local error feedback. It does not perform real auth integration.
- `/landing` is flow-first rather than KPI-first, centered on `需求匯入`、`當日扣帳`、`生產規劃`、`盤點調整`、`主資料`, with `採購 / 收貨`、`包裝 / 出貨`、`報表 / 分析`、`財務 / 對帳` preserved as future nodes.
- 最小修正回合未擴 scope，只處理 ignore 規則、`.next` 清理、login live-region 語意，以及 Idx-028 metadata 對齊。
- Cross-QA 結論為 PASS；唯一殘餘 observation 為 login 錯誤訊息若要對齊更強的輔助技術即時性，正式 auth 串接前可再評估回到單獨使用 `role="alert"`。

## 📎 EVIDENCE

- Validation commands:
  - `npm install`
  - `npm run build:portal`
  - `rm -rf apps/portal/.next`
- Build result excerpt:
  - `✓ Compiled successfully`
  - `✓ Generating static pages (6/6)`
  - `○ (Static) prerendered as static content`
