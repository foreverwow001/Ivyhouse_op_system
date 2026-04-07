# Idx-012: Opening balance bootstrap runbook 與首盤演練 - Execution Log

> 建立日期: 2026-04-02
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-012`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-012_plan.md`
- log_file_path: `doc/logs/Idx-012_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

建立 opening balance 正式 runbook 與首盤 rehearsal evidence，讓 inventory-count 能以正式盤點建立開帳基線。

### Scope

- 收斂 opening balance 前置條件與首盤 SOP
- 建立首盤 / 常態盤點界線
- 補 rehearsal 與補救流程 evidence

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
| Preflight | PASS | 已確認 `Idx-011` 正式 migration path 可用，並沿用同一隔離測試 DB 進行 rehearsal | 2026-04-02 |
| Research | PASS | 已確認 `completeSession` 會建立 `InventoryAdjustmentEvent` 與 `InventoryEventLedger`，可直接承接 opening balance | 2026-04-02 |
| Maintainability | PASS | 已把首盤與常態盤點邊界寫回 runbook 與政策文件，避免 bootstrap 特例外溢 | 2026-04-02 |
| UI-UX | N/A | 非前端任務 | 2026-04-02 |
| Evidence | PASS | 乾淨測試 DB 上 opening-balance rehearsal smoke 已通過，證明首盤與第二次盤點可被區分 | 2026-04-02 |
| Security | PASS_WITH_RISK | opening balance rehearsal 已成立，但 createSession 權限閘與首盤窗口控制尚未正式實作 | 2026-04-02 |
| Domain | PASS_WITH_RISK | 首盤與常態盤點界線已文件化，但缺少窗口鎖定、取消與多窗口治理 | 2026-04-02 |
| Plan Validator | PASS | 實際變更維持在 runbook、政策文件與 `apps/api/test/**` 範圍內 | 2026-04-02 |

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| N/A | N/A | N/A | 已完成 opening balance rehearsal：首盤建立基線、第二次盤點回到常態差異 | 2026-04-02 |

## 🆕 2026-04-02 Kickoff 摘要

- `Idx-012` 已進入正式排程狀態，但未開始實作。
- 直接阻斷為 `Idx-011` 尚未完成正式 migration path 與測試 DB bootstrap。
- 啟動後的第一個驗證將是首盤 rehearsal fixture / smoke，而不是一般 metrics test。

## 🆕 2026-04-02 執行結果

- 已將 `daily_ops_seed_bootstrap_strategy.md` 擴成可執行的 opening balance runbook，補前置條件、成功判定與失敗補救。
- 已在 `inventory_count_adjustment_and_negative_stock_policy.md` 補 opening balance 特例邊界。
- 已新增 `apps/api/test/inventory-opening-balance-api-smoke.js`，在乾淨 DB 上演練首盤與第二次盤點。
- focused validation：重建測試 DB 後，`node test/inventory-opening-balance-api-smoke.js` 回傳 `PASS`。

## 🆕 2026-04-02 修正輪

- 已在 `createSession` 加入同 `countScope` 的窗口鎖定檢查。
- 已補 opening-balance smoke，驗證首盤未完成時再次建立同 `countScope` session 會回傳 `409`。

## ✅ QA_SUMMARY

- 結論：PASS_WITH_RISK
- 風險：runbook 仍屬 Phase 1 過渡版本，未覆蓋跨倉、多窗口首盤、部分完成與中斷補救的完整治理
- 後續事項：補 Security / Domain review，並在後續 deploy runbook 中掛入首盤窗口與責任角色

## 🔎 CROSS_QA_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：首盤 rehearsal 已可執行，且已補同 `countScope` 窗口鎖定；仍未涵蓋部分完成、中斷、多 bucket 與跨倉情境
- 殘餘風險：窗口鎖定已補，但 runbook 對中斷補救、跨倉與多窗口治理仍未完整覆蓋

## 🔐 SECURITY_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：opening balance 只能透過盤點建立的策略已成立，且同 `countScope` 鎖窗已落地；但 performedBy 仍是請求輸入值
- 殘餘風險：正式身份驗證尚未落地前，performedBy 與請求角色仍可能不一致

## 🧭 DOMAIN_REVIEW_SUMMARY

- 結論：PASS_WITH_RISK
- Findings：runbook、政策文件與 rehearsal 已對齊「首盤建立 opening balance、後續盤點回到常態」，且首盤窗口鎖定已實作；但系統仍無取消 API、跨倉與多窗口規則
- 殘餘風險：若首盤窗口被實際營運流量或中斷打斷，仍需更完整的恢復與治理機制

## 🔁 FOLLOW_UP_TASKS

- `Idx-020`：Opening balance 多窗口 / 中斷補救治理補強

## 🏁 COMPLETION_MARKERS

- `[ENGINEER_DONE]`: present
- `[QA_DONE]`: present
- `[FIX_DONE]`: present

## 📎 EVIDENCE

- PTY debug: pending
- PTY live: pending
- 其他 evidence: 乾淨測試 DB 上 `node test/inventory-opening-balance-api-smoke.js` 回傳 `PASS`，並覆蓋首盤建立 opening balance 與第二次常態盤點

### 2026-04-02 最終 QA rerun

- 乾淨測試 DB 上重新執行 `node test/inventory-opening-balance-api-smoke.js`，結果 `PASS`
- 已確認首盤窗口鎖定、首盤建立基線與第二次常態盤點在修正輪後仍可驗證通過