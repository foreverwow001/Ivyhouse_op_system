# Idx-015: 日常營運主線 E2E smoke 與 evidence - Execution Log

> 建立日期: 2026-04-02
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-015`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-015_plan.md`
- log_file_path: `doc/logs/Idx-015_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

建立 daily ops MVP 主線的端到端 smoke 與 evidence，讓 demand 到 audit 追溯鏈可以被重跑、被審查、被交付。

### Scope

- 串接 demand、deduction、plan、BOM、replenishment、count、adjustment、audit
- 建立 mainline orchestration 與 evidence matrix
- 誠實記錄 stub、斷點與已知缺口

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | copilot-cli |
| security_reviewer_tool | Explore |
| qa_tool | Explore |
| last_change_tool | copilot-cli |
| qa_result | PASS_WITH_RISK |
| commit_hash | pending |

## 🚦 FORMAL_WORKFLOW_GATES

| Gate | Status | Summary | Timestamp |
|------|--------|---------|-----------|
| Preflight | PASS | 已在 `Idx-014` 完成後，以單一 scenario 串起 demand、plan、replenishment、count 與 audit | 2026-04-02 |
| Research | PASS | 已確認 audit 需走 Prisma readback，且現有 controller 足以承接 mainline API chain | 2026-04-02 |
| Maintainability | PASS | mainline smoke 以單一腳本獨立落地，未改寫既有 focused smoke 或 fixture | 2026-04-02 |
| UI-UX | N/A | 本輪以 API / service / evidence 為主 | 2026-04-02 |
| Evidence | PASS | `test:daily-ops:mainline` 已留下 demand -> audit action chain 與 inventory ledger event chain | 2026-04-02 |
| Security | PASS_WITH_RISK | production-planning create / revise / rerun 端點的 RBAC guard 已於修正輪補上；mainline audit payload 的 before/after 證據仍待補強 | 2026-04-02 |
| Domain | PASS_WITH_RISK | demand -> audit 主線已成立，但 raw-material replenishment / count 尚未獨立建模 | 2026-04-02 |
| Plan Validator | PASS | 實際變更維持在 daily-ops、inventory、audit、test 與對應文件範圍內 | 2026-04-02 |

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| N/A | N/A | N/A | 已完成啟動前排程：待 014 完成後，以單一 mainline scenario 串 demand → audit | 2026-04-02 |

## 🆕 2026-04-02 Kickoff 摘要

- `Idx-015` 已進入正式排程狀態，但未開始實作。
- 直接阻斷為 `Idx-014` 尚未完成 direct-pack runtime normalization。
- 啟動後的第一個驗證將是單一 mainline E2E smoke，而不是先擴 regression matrix。

## 🆕 2026-04-02 執行結果

- 已新增 `test/daily-ops-mainline-e2e-smoke.js`。
- mainline scenario 以 `N10120` demand / production plan 驗證 direct-pack BOM，並以 `PK0016` 驗證 replenishment、inventory count、adjustment 與 audit / ledger evidence。
- 已用 Prisma readback 驗證 audit action chain：`daily-demand-batch.created -> confirmed -> production-plan.created -> replenishment-run.created -> committed -> inventory-count.started -> completed`。
- 已用 Prisma readback 驗證 inventory ledger event chain 包含 `DEDUCTION`、`BOM_RESERVATION`、`REPLENISHMENT`、`COUNT_ADJUSTMENT`。
- focused validation：`npm run test:daily-ops:mainline` 回傳 `PASS`。

## 🆕 2026-04-02 修正輪：production-planning RBAC

- 已新增 production-planning 過渡 guard，保護 `create plan`、`update plan` 與 `rerun bom` 三個高風險入口。
- 已將本修正輪正式角色名稱對齊為 `生產 / 包裝及出貨 / 會計 / 管理員`，並保留 `packaging`、`packaging-shipping`、`admin` 與舊稱正規化 alias。
- 已擴充 mainline E2E smoke，驗證未授權 `supervisor` 角色建立 production plan 會回傳 `403`，授權 `production` 角色可正常建立。
- correction-round validation：重建測試 DB 後，`npm run test:daily-ops:mainline` 回傳 `PASS`。

## ✅ QA_SUMMARY

- 結論：PASS_WITH_RISK
- 風險：mainline E2E 已成立，但 raw-material replenishment / count 尚未獨立建模，且 production-planning 端點仍缺 RBAC guard
- 後續事項：production-planning RBAC 需由後續 fix round / Idx-021 承接，raw-material inventory owner 模型成熟後再擴主線 coverage

## 🔎 CROSS_QA_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：mainline smoke 確實覆蓋 demand、deduction、plan、BOM、replenishment、count、adjustment 與 audit；Prisma readback 也已留下 action chain 與 inventory ledger event chain
- 殘餘風險：目前 event 驗證偏向 existence check，尚未做到更嚴格的前後序列與 before/after state evidence

## 🔐 SECURITY_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：production-planning create / revise / rerun 端點的 RBAC guard 已於修正輪補上，negative test 已證明未授權 `supervisor` 角色會被 `403` 拒絕；audit payload 目前仍只證明事件存在，缺少更豐富的 before/after 證據可供高風險對帳
- 殘餘風險：正式 auth framework 與 maker-checker 仍未落地，audit payload enrichment 也仍待後續補強

## 🧭 DOMAIN_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：demand 到 adjustment 的主線閉環已建立，且 direct-pack BOM evidence 與 packaging material reconciliation 一致；production-planning 的權限邊界也已對齊本修正輪正式角色名稱；但 raw-material replenishment / count 尚未獨立建模
- 殘餘風險：若後續要把 raw material 納入同一條主線對帳，仍需補 raw-material inventory owner / bucket 模型與對應 smoke

## 🏁 COMPLETION_MARKERS

- `[ENGINEER_DONE]`: present
- `[QA_DONE]`: present
- `[FIX_DONE]`: not-required

## 📎 EVIDENCE

- PTY debug: pending
- PTY live: pending
- 其他 evidence: `npm run test:daily-ops:mainline` 回傳 `PASS`；主線 evidence matrix 覆蓋 demand、deduction、BOM reservation、replenishment、count、adjustment、audit