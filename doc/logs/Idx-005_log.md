# Idx-005: RBAC 矩陣第一版 - Execution Log

> 建立日期: 2026-03-26
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-005`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-005_plan.md`
- log_file_path: `doc/logs/Idx-005_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

建立四表直連高風險治理的第一版 RBAC / approval matrix，並把規則表過渡核定值回收為正式角色值。

### Scope

- 建立 `doc/architecture/roles/README.md`
- 對齊 flows / data 權威文件中的核定角色語意
- 建立 Idx-005 plan/log artifact
- 回寫兩張規則表的正式核定角色

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | copilot-cli |
| security_reviewer_tool | Explore |
| qa_tool | Explore |
| last_change_tool | copilot-cli |
| qa_result | PASS_WITH_RISK |
| commit_hash | pending |

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| N/A | N/A | N/A | 本輪未使用額外 skill | 2026-03-26 18:47:25 |

## 📈 SKILLS_EVALUATION

本輪先把四表直連高風險治理的 RBAC / approval 邊界補成可執行文件，並完成 Security Review 與 cross-QA 的第一輪收斂。

2026-04-01 補充：已把日常營運 flows 規格對回 roles 文件，補上 `生產 / 包裝 / 會計 / 主管` 四角色在日常扣帳、排工、回沖、盤點與回填上的現況操作邊界。

## 🔐 SECURITY_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- 阻斷 findings：無
- 已補強項目：系統管理不得任高風險核定角色、maker-checker 單次變更綁定、`核定人` 驗證規則、過渡治理結束條件、flows 高風險清單補列規則表異動
- 殘餘風險：全系統 RBAC 尚未完成、人員層級指派未落地、歷史有效期間與版本化仍待後續治理

## ✅ QA_SUMMARY

- 結論：PASS_WITH_RISK
- 風險：全系統 RBAC / approval matrix 仍未建立；人員層級指派、完整 workflow state machine 與歷史有效期間治理仍缺
- 後續事項：下一輪擴張到配方發布、庫存調整、已確認訂單取消等高風險操作，並補人員層級指派

## ⚠️ RESIDUAL_RISKS

- 目前 `核定人` 記錄的是正式角色名，不是實際人員姓名。
- `2026/3/26` 是 Phase 0 治理初始化日，不等於歷史上的首次生效日。
- 門市營運與財務的查閱範圍仍停留在文件層定義，尚未落到系統層權限控制。
- 全系統 RBAC、API 保護、登入授權與 row-level security 仍待後續版本補齊。
- 目前日常營運四角色的操作矩陣仍屬現況 SOP，尚未轉成終版 maker-checker 控制。

## 🔗 RESIDUAL_RISKS_DEFERRED_TRACKING

下列 residual risks 已由後續 work unit 或權威文件明確承接：

| Risk | 承接者 | 狀態 | 說明 |
|------|--------|------|------|
| 系統層權限控制與正式身份來源 | `Idx-021` | Completed | Portal session principal、inventory-count approval skeleton 與正式 actor contract 已落地 |
| production-planning 的高風險 approval 邊界 | `Idx-022` | Completed | production-planning approval persistence 與 approver boundary 已補齊 |
| `管理員` 不得放寬高風險業務 approver | `doc/architecture/roles/README.md` + `Idx-022` | Completed | 角色交集政策與 single-person override 邊界已明文化 |
| 全系統 RBAC / row-level security / API 保護擴張 | 後續 RBAC v2 / auth work units | Deferred | 不屬 Idx-005 第一版完成定義 |
| 人員層級指派、歷史有效期間與版本化 | 後續治理 work units | Deferred | 仍列為 Phase 0 / Phase 1 之後的擴張治理 |

## ✅ COMPLETION_DECISION

- 關帳判定：可由 `QA` 轉為 `Completed`
- 理由：Idx-005 的完成定義已滿足，且原 residual risks 已被 `Idx-021`、`Idx-022` 與現行 roles 權威文件明確承接
- 保留風險：本 work unit 只完成第一版 RBAC / approval matrix，不代表全系統 RBAC、row-level security 與人員指派已完成

## 📎 EVIDENCE

- PTY debug: None
- PTY live: None
- 其他 evidence: Explore Security Review 與 cross-QA 結果、terminal 實際磁碟驗證兩張規則表皆含 `核定狀態/核定人/核定日期` 並已回寫為 `正式核定/倉管/2026/3/26`

### 2026-04-01 evidence 補充

- `doc/architecture/roles/README.md` 已新增「現行日常營運四角色補充」段落與操作矩陣
- `doc/architecture/flows/README.md` 已補「現況 SOP 與終版治理要分開寫」原則，並引用工程拆解文件
- markdown 檢查：`doc/architecture/roles/README.md` 與 `doc/architecture/flows/README.md` 無錯誤