# Idx-020: Opening balance 多窗口 / 中斷補救治理補強 - Execution Log

> 建立日期: 2026-04-02
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-020`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-020_plan.md`
- log_file_path: `doc/logs/Idx-020_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal

補齊 opening balance 的多窗口、跨倉、中斷補救、取消與恢復治理，讓 `Idx-012` 的首盤主線能安全擴成正式上線操作。

### Scope

- 收斂首盤多窗口 / 跨倉規則
- 規劃中斷、部分完成、取消與恢復 SOP
- 對齊 `Idx-017` runbook 所需的停等點與責任分工

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | copilot-cli |
| security_reviewer_tool | Explore |
| qa_tool | Explore |
| last_change_tool | copilot-cli |
| qa_result | PASS_WITH_RISK |
| commit_hash | N/A (workspace-no-git) |

## 🚦 FORMAL_WORKFLOW_GATES

| Gate | Status | Summary | Timestamp |
|------|--------|---------|-----------|
| Preflight | PASS | 已確認 `Idx-012` 主線、單倉 operating envelope 與 cancel-only 治理切口一致，且 focused smoke 可作第一輪驗證 | 2026-04-03 |
| Research | PASS | 已確認現有 runtime 只有 create / complete 與同 `countScope` 鎖窗；本輪最小直接控制面為 cancel API、cancel persistence 與 cancelled session 歷史排除 | 2026-04-03 |
| Maintainability | PASS | 新治理沿既有 `InventoryCountSession` owner model 擴充 cancel 欄位與 runbook，不另開平行 opening balance 狀態機 | 2026-04-03 |
| UI-UX | N/A | 非前端任務 | 2026-04-02 |
| Evidence | PASS | `npx prisma generate`、`npm run build`、`node test/inventory-opening-balance-api-smoke.js` 已驗證 cancel 不寫 ledger、取消後可重新開窗、cancelled session 不進歷史 | 2026-04-03 |
| Security | PASS_WITH_RISK | Explore review 確認 cancel-only recovery 不會污染 ledger，live ops during opening balance 以文件層禁止；多倉治理因目前單倉 not-applicable 保留 | 2026-04-03 |
| Domain | PASS | 使用者已明確決策：單倉單窗口、不同 countScope 不可平行、首盤中斷一律 cancel、不支援 resume、首盤期間禁止 live ops | 2026-04-03 |
| Plan Validator | PASS | 本輪變更維持在 inventory-count、runbook、policy、API contract 與 `Idx-020` artifact 範圍，與 `Idx-017` / `Idx-021` 分工一致 | 2026-04-03 |

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| Explore | Idx-020 scope review | completed | 唯讀確認現有 runtime 缺口集中在 cancel / recovery 治理，最小實作為 cancel endpoint + cancelled session 排除 + focused smoke | 2026-04-03 |
| Explore | Idx-020 final cross-review | completed | 最終 review 無 blocking finding；確認 cancel 不寫 ledger、cancelled session 不進歷史、cross-countScope lock 只套 opening-balance 場景 | 2026-04-03 |

## 🆕 2026-04-02 Artifact 啟動摘要

- `Idx-020` 已從 implementation index 的 Planning 提升為 Approved，並建立正式 plan/log artifact。
- 本輪僅建立治理工作單，不直接修改 inventory-count runtime 或 API。
- 第一輪預計先補多窗口 / 跨倉規則、首盤中斷補救與 cancel / resume 邊界。

## ✅ QA_SUMMARY

- 結論：PASS_WITH_RISK
- 風險：單倉 opening balance 的 cancel-only recovery 已成立；多倉與 resume state machine 因目前 not-applicable / out-of-scope 未納入本輪，首盤期間 live ops 仍以文件層禁止為主
- 後續事項：若未來出現多倉、resume 或系統層 live-ops hard gate 需求，需另開新 work unit，不得直接沿用本輪單倉規則外推

## 🏁 COMPLETION_MARKERS

- `[ENGINEER_DONE]`: present
- `[QA_DONE]`: present
- `[FIX_DONE]`: present

## 📎 EVIDENCE

- PTY debug: `npx prisma generate --schema prisma/schema.prisma`、`npm run build`、`node test/inventory-opening-balance-api-smoke.js`
- PTY live: `npm run test:inventory:smoke`、`npm run test:daily-ops:mainline`、`npm run test:daily-ops:regression`
- 其他 evidence: cancel endpoint 已落地；focused smoke 已覆蓋「不同 countScope 不可平行」、「cancel 不寫 ledger」、「cancel 後可重新建同一 countScope session」、「cancelled session 不進 variance history」