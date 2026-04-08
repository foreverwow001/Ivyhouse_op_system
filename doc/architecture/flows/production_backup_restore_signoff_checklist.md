# Production Backup / Restore Pre-Production Sign-off Checklist

本文件是 `Idx-024` 的 external infra sign-off surface，用於在正式 production cutover 前，讓 DBA / Platform owner、Backend owner 與 Release owner 共同回填 backup / restore 事實證據。

## 使用規則

- 本 checklist 未填完前，不得把 `Idx-024` 宣告為 `Completed`。
- 本 checklist 的內容必須來自正式 infra owner 與 rehearsal evidence，不得以聊天承諾或口頭描述代替。
- 若任一欄位為空、未知或待確認，production release 必須 fail-closed。
- 本輪僅做 docs/status consolidation；截至 2026-04-08，未取得新的 external infra evidence，因此本檔仍維持既有 `fail/pending` 判定。

## Sign-off Participants

| 角色 | 姓名 / 帳號 | 狀態 | 備註 |
|---|---|---|---|
| DBA / Platform owner | `ivyhousetw` | `assigned` | backup / restore 主責 |
| Backend owner | `ivyhousetw` | `assigned` | schema / application readback |
| Release owner | `foreverwow001` | `assigned` | release gate 最終確認 |

## Backup Tooling

| 欄位 | 值 | 證據位置 |
|---|---|---|
| backup 工具名稱 | `Supabase managed PostgreSQL backup capability` | `Supabase Dashboard > ivyhouse-op-system-staging > Project Overview readback (2026-04-08)` |
| backup 入口 / job 名稱 | `Supabase Dashboard > Project Overview / Database > Backups` | `Supabase Dashboard > ivyhouse-op-system-staging > Project Overview readback (2026-04-08)` |
| backup 頻率 | `not enabled or not available on current observed project plan` | `Supabase Dashboard > ivyhouse-op-system-staging > Project Overview shows Last Backup: No backups (2026-04-08)` |
| 最近一次成功備份時間點 | `none observed as of 2026-04-08` | `Supabase Dashboard > ivyhouse-op-system-staging > Project Overview shows Last Backup: No backups` |
| 備份保留策略 | `not confirmed - current observed project shows no backups` | `Supabase Dashboard > ivyhouse-op-system-staging > Project Overview readback (2026-04-08)` |

## Restore Readiness

| 欄位 | 值 | 證據位置 |
|---|---|---|
| restore 主要 owner | `foreverwow001` | `checklist participant assignment` |
| restore 替補 owner | `ivyhousetw` | `checklist participant assignment` |
| 預估 RTO | `pending` | `pending` |
| 預估 RPO | `pending` | `pending` |
| 最近一次 restore rehearsal 日期 | `not performed` | `pending` |
| 最近一次 restore rehearsal 結果 | `none - no rehearsal evidence` | `pending` |
| rehearsal report / runbook link | `no evidence provided` | `pending - Supabase restore runbook / drill record not supplied` |

## Pre-Production Decision

| 檢查項目 | 結果 | 備註 |
|---|---|---|
| backup 工具與入口已確認 | `fail` | provider 已收斂為 Supabase，但 current observed project shows `No backups` |
| 最新成功備份時間點可追溯 | `fail` | Supabase Dashboard readback 顯示 `Last Backup: No backups`，無可採信成功時間點 |
| restore owner / 替補已確認 | `pass` | `foreverwow001` / `ivyhousetw` 已正式指派 |
| RTO / RPO 已核定 | `fail` | 尚未提供正式值 |
| restore rehearsal evidence 已存檔 | `fail` | 使用者確認目前沒有 restore rehearsal |
| 可允許 production promote | `fail` | 任一欄位非 `pass` 即不得 promote |

## Repo-Native Guard Binding

- `Idx-037` 的 repo-native `release-preflight-guard` 會直接讀取本檔 `Pre-Production Decision` 中的 `可允許 production promote` 列。
- 只要該列不是 `pass`，production `release-preflight` 就會在 environment-bound preflight 前被技術性 fail-closed 擋下。
- 截至 2026-04-08，本輪未取得新的 external infra evidence，因此 guard 預期持續讀到 `fail`，這是刻意維持 truth-first blocker，不代表 external sign-off 已完成。

## 仍缺 external evidence / platform evidence

| 欄位 | 目前狀態 | 備註 |
|---|---|---|
| 最近一次成功備份時間 | `missing` | 目前僅有 `Last Backup: No backups` readback |
| 備份保留策略 | `missing` | 尚未取得正式 retention policy evidence |
| RTO | `missing` | 尚未由 owner 核定 |
| RPO | `missing` | 尚未由 owner 核定 |
| restore rehearsal 日期 | `missing` | 尚未提供最近一次 drill 日期 |
| restore rehearsal 結果 | `missing` | 尚未提供成功 / 失敗判定與 readback |
| restore rehearsal 證據 | `missing` | 尚未提供 report、runbook 或平台截圖/紀錄 |
| 三方 final sign-off | `missing` | DBA / Platform owner、Backend owner、Release owner 仍為 `pending` |
| branch protection / required reviewers 平台證據 | `conditional-missing` | 若被視為正式 production gate 一部分，仍需外部平台設定 readback；repo 內文件目前不持有可採信證據 |

## Final Sign-off

| 角色 | 簽核結果 | 日期 | 備註 |
|---|---|---|---|
| DBA / Platform owner | `pending` | `pending` | Supabase provider 已確認，但目前 readback 顯示 `No backups`，保留策略與 rehearsal evidence 尚未補齊 |
| Backend owner | `pending` | `pending` | staging preflight / migrate / seed / smoke 已通過，但 RTO / RPO 與 restore readback 仍未提供 |
| Release owner | `pending` | `pending` | production provider baseline 已收斂為 Supabase，但 Pre-Production Decision 目前仍為 fail-closed，不可 promote |

## Fail-Closed Note

若本檔仍保留任何 `pending`，或證據位置不可讀、不可追溯、未經 owner 簽核，則 production backup / restore sign-off 視為未完成，`Idx-024` 不得從 `QA` 推進到 `Completed`。

`Idx-037` 的 repo-native `release-preflight-guard` 目前已把上述 fail-closed 狀態接成 production technical block；在本檔 `可允許 production promote` 仍非 `pass` 前，production promote 不得放行。
