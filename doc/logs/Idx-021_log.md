# Idx-021: Inventory-count / Production-planning 正式 auth 與 maker-checker 補強 - Execution Log

> 建立日期: 2026-04-02
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-021`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-021_plan.md`
- log_file_path: `doc/logs/Idx-021_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

為 inventory-count 與 production-planning 建立正式身份承接與 maker-checker approval skeleton，逐步替換 Phase 1 header-based 過渡 guard。

### Scope

- 收斂 actor / maker / checker / approver 欄位責任
- 定錨正式身份來源與 principal 注入切口
- 規劃 approval skeleton 與必要 schema / migration 風險

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
| Preflight | PASS | 已確認第一個正式實作切片只涵蓋 Portal principal、inventory-count approval skeleton 與 production-planning principal 接入 | 2026-04-03 |
| Research | PASS | 已完成 guard / service / schema / smoke surface 盤點，確認 repo 內無既存 principal abstraction 可重用 | 2026-04-03 |
| Maintainability | PASS | approval skeleton 直接掛在既有 inventory aggregate，未額外引入平行 approval table 或平行 auth 模型 | 2026-04-03 |
| UI-UX | N/A | 本輪先處理 backend identity / approval contract | 2026-04-02 |
| Evidence | PASS | `test:inventory:smoke`、production rerun regression、`test:daily-ops:mainline` 與 `test:daily-ops:regression` 均已通過 | 2026-04-03 |
| Security | PASS_WITH_RISK | 正式身份來源與 inventory approval skeleton 已成立；production-planning 的 admin 最終 approver 邊界仍屬殘餘風險 | 2026-04-03 |
| Domain | PASS_WITH_RISK | inventory-count 高風險動作已切入 `主管` approval 邊界；production-planning approval persistence 仍待後續切片補齊 | 2026-04-03 |
| Plan Validator | PASS | 實作範圍與 `Idx-021` 第一個正式切片一致，未越界擴張到全系統 auth 或完整 production approval console | 2026-04-03 |

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| Explore | Idx-021 implementation review | completed | 唯讀確認 principal 掛點、inventory approval skeleton 與 production-planning principal 接入是否符合 plan 與 roles 決策 | 2026-04-03 |
| Explore | Idx-018 sign-off readiness input | completed | 唯讀提供 `Idx-021` 實作完成後的 sign-off 風險與可交付判定依據 | 2026-04-03 |

## 🆕 2026-04-02 Artifact 啟動摘要

- `Idx-021` 已從 implementation index 的 Planning 提升為 Approved，並建立正式 plan/log artifact。
- 使用者已確認本輪先建 artifact，不直接進入程式實作。
- 第一輪預設切口為 inventory-count + production-planning 的正式身份承接與 approval skeleton。
- 若第一輪需要 schema / migration，已取得使用者同意可納入範圍。

## 🆕 2026-04-03 第一個正式實作切片摘要

- 已建立共用 Portal session principal contract，要求 `x-portal-principal-id`、`x-portal-session-id`、`x-portal-role-codes`，並保留 `displayName` 與 `authSource`。
- inventory-count 的 create / complete / manual adjustment 已改由 Portal principal 驅動；`complete session` 與 `manual adjustment` 已收斂到 `主管` 邊界。
- inventory-count approval skeleton 已落地到 persistence 與 response DTO，能追溯 `completedByPrincipalId`、`completionApprovalStatus`、`completionApproverPrincipalId`、`completionApprovedAt`、`singlePersonOverride`。
- production-planning 的 create / revise / rerun 已改由 Portal principal 驅動，不再依賴 request body actor；本輪不擴張到完整 approval persistence。

## 🔐 SECURITY_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：`x-ivyhouse-role / x-ivyhouse-roles` 已退出 formal identity source；Portal principal 已成為 inventory-count / production-planning 的第一信任來源，且 inventory approval skeleton 已有 persistence 與 audit trace
- 殘餘風險：production-planning 仍允許 `管理員` 走 create / revise / rerun，最終 approver 邊界需於後續 approval persistence 切片再明確收斂

## 🧭 DOMAIN_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：inventory-count 高風險動作已進入 `主管` approval 邊界，且單人營運例外已能留下 `single_person_override` audit 線索；production-planning 本輪只做 principal hardening，符合原先切片決策
- 殘餘風險：production-planning 尚未具備與 inventory-count 對等的 approval persistence，需以後續治理任務補齊

## ✅ QA_SUMMARY

- 結論：PASS_WITH_RISK
- 風險：production-planning admin 最終 approver 邊界與完整 approval persistence 仍未落地，但不阻斷本輪正式 principal 切片完成
- 後續事項：殘餘角色邊界風險轉交 `Idx-018` sign-off 與後續 production-planning approval 切片追蹤

## 🏁 COMPLETION_MARKERS

- `[ENGINEER_DONE]`: present
- `[QA_DONE]`: present
- `[FIX_DONE]`: present

## 📎 EVIDENCE

- PTY debug: `npm run prisma:generate`、`npm run test:inventory:smoke`
- PTY live: `npm run build`、`node test/production-plan-rerun-regression-smoke.js`、`npm run test:daily-ops:mainline`、`npm run test:daily-ops:regression`
- 其他 evidence: `20260403122000_idx021_inventory_principal_approval_skeleton` migration、Portal principal contract、inventory approval response assertions、mainline / regression suite pass