# Idx-016: 日常營運回歸 fixture matrix 與 failure-path 驗收 - Execution Log

> 建立日期: 2026-04-02
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-016`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-016_plan.md`
- log_file_path: `doc/logs/Idx-016_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

建立 daily ops 的 failure-path regression matrix，讓高風險例外可被重跑、比較與防回歸。

### Scope

- 整理 zero-baseline、negative stock、reminder、rerun、rollback 與拒絕路徑
- 建立固定 fixtures 與預期結果
- 留存完整 regression evidence

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
| Preflight | PASS | 已在 `Idx-015` 落 mainline 後，固定三組 regression scenario 作為最小矩陣 | 2026-04-02 |
| Research | PASS | 已確認 opening-balance、inventory-count、production-plan rerun / revision 可組成代表性 failure-path matrix | 2026-04-02 |
| Maintainability | PASS | regression suite 採獨立腳本與每 scenario 重建 DB，未污染 mainline fixture | 2026-04-02 |
| UI-UX | N/A | 非前端任務 | 2026-04-02 |
| Evidence | PASS | `test:daily-ops:regression` 已固定零基準、提醒 / 拒絕、rerun / revision regression 三組 evidence | 2026-04-02 |
| Security | PASS_WITH_RISK | regression suite 的 DB 隔離已成立，production-planning RBAC gap 已於修正輪補上；正式 destructive rollback API 仍不存在 | 2026-04-02 |
| Domain | PASS_WITH_RISK | zero-baseline、提醒 / 拒絕、rerun / revision regression 已固定，但 rollback 仍只是受控替代路徑 | 2026-04-02 |
| Plan Validator | PASS | regression suite、production-plan regression smoke 與對應文件範圍一致 | 2026-04-02 |

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| N/A | N/A | N/A | 已完成啟動前排程：待 015 穩定後，再把 failure-path 拉成 regression matrix | 2026-04-02 |

## 🆕 2026-04-02 Kickoff 摘要

- `Idx-016` 已進入正式排程狀態，但未開始實作。
- 直接阻斷為 `Idx-015` 主線 fixture 尚未固定。
- 啟動後的第一個驗證將是 regression suite，而不是再做新的主線 smoke。

## 🆕 2026-04-02 執行結果

- 已新增 `test/production-plan-rerun-regression-smoke.js`，覆蓋 `PLAN_CREATED`、`MANUAL_RERUN` 與 `PLAN_REVISED`。
- 已新增 `test/daily-ops-regression-suite.js`，串接 `inventory-opening-balance-api-smoke.js`、`inventory-count-api-smoke.js` 與 production-plan regression smoke。
- regression matrix 目前固定三組場景：
	- `zero-baseline-opening-balance`
	- `negative-stock-reminder-and-reject`
	- `rerun-and-revision-regression`
- focused validation：`node test/production-plan-rerun-regression-smoke.js` 回傳 `PASS`；整體 `npm run test:daily-ops:regression` 回傳 `PASS`。

## 🆕 2026-04-02 修正輪：production-planning RBAC

- 已新增 production-planning 過渡 guard，保護 `create plan`、`update plan` 與 `rerun bom` 三個高風險入口。
- 已擴充 production-plan regression smoke，驗證未授權 `supervisor` 角色會在 `create plan` 與 `rerun bom` 收到 `403`；授權 `production / packaging-shipping / admin` 可正常執行對應路徑。
- correction-round validation：`node test/production-plan-rerun-regression-smoke.js` 回傳 `PASS`；整體 `npm run test:daily-ops:regression` 回傳 `PASS`。

## ✅ QA_SUMMARY

- 結論：PASS_WITH_RISK
- 風險：regression suite 已固定，但正式 destructive rollback API 仍不存在；本輪以 `revision-as-rollback-guard` 誠實承接目前可驗證的替代路徑
- 後續事項：正式 rollback 能力保留為後續補強子任務，production-planning RBAC 仍需 fix round 承接

## 🔎 CROSS_QA_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：regression suite 會在每個 scenario 前重建測試 DB 並重新 deploy schema，資料前提確實隔離；opening-balance、inventory-count、production-plan rerun / revision 三組固定場景均可重跑
- 殘餘風險：各 smoke 內部 reset 粒度仍不完全一致，且目前還未覆蓋中斷恢復、並行衝突等進階邊界

## 🔐 SECURITY_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：inventory-count 與 production-planning 的高風險入口目前都已有最小 guard；regression suite 也已新增 production-planning 的 `403` 拒絕路徑驗證；但測試仍採 header-based 過渡認證
- 殘餘風險：正式 auth framework、maker-checker 與 destructive rollback API 仍未落地，因此 regression 通過仍屬 Phase 1 過渡安全證據

## 🧭 DOMAIN_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：zero-baseline、negative stock / reminder / reject、manual rerun 與 revision regression 已能形成最小 failure-path matrix；production-planning 的權限邊界已於修正輪對齊正式角色名稱；但 destructive rollback API 尚未存在，revision 只能作為受控替代，不等於正式 rollback
- 殘餘風險：若營運要求真正回滾庫存事件與帳面數量，仍需額外契約與 API 承接

## 🏁 COMPLETION_MARKERS

- `[ENGINEER_DONE]`: present
- `[QA_DONE]`: present
- `[FIX_DONE]`: not-required

## 📎 EVIDENCE

- PTY debug: pending
- PTY live: pending
- 其他 evidence: `npm run test:daily-ops:regression` 回傳 `PASS`，並包含 zero-baseline、negative stock / reminder / reject、rerun / revision regression 三組固定 scenario