# 單人營運正式層最小 Deploy / Backup / Rollback Contract

更新日期：2026-04-08

Authoritative source：是

## 目的

本文件把 Ivyhouse OP System 在 `單人營運正式層` 的最小正式 deploy / backup / rollback contract 收斂成單一入口，供後續 plan、log、review package 與值班文檔直接引用。

它的責任是定義最低正式層 contract，不是建立新的操作 runbook，也不是宣稱 repo 已達 full production ready。

## 適用範圍

- 只適用 `單人營運正式層`
- 只定義最小正式層 contract 與 fail-closed 邊界
- 供 GitHub、GitHub Actions gate、Cloud Run / Cloudflare 既有正式方向的 release path 使用

## 不適用範圍

- 不等同於 full production、多人輪值或企業級 DR / SRE 體系
- 不取代 `post_launch_ops_runbook.md` 的值班操作入口
- 不取代 `production_backup_restore_signoff_checklist.md` 的 external infra sign-off 欄位回填
- 不取代 `migration_governance_and_deployment_replay.md` 的 migration promotion / replay / hotfix 規則

## 核心結論

### 1. 本 contract 可以先完成，但不代表 `Idx-024` 已完成

本文件完成，只代表單人營運正式層的最小 formal contract authority 已存在，後續文件不必再從零散 authority 自行拼裝 deploy / backup / rollback 要求。

這不代表：

- `Idx-024` 的 external infra backup / restore sign-off 已完成
- production backup tooling、restore rehearsal、RTO / RPO 已補齊
- repo 已具備 full production sign-off 或 enterprise-grade DR capability

只要 external infra owner 尚未在 sign-off checklist 補齊必填欄位，production release 仍必須 fail-closed。

### 2. 固定 deploy path 是正式最低線

單人營運正式層只允許以下固定正式路徑：

1. 變更來源在 GitHub 管理與留痕
2. 先通過 GitHub Actions `release-preflight`
3. 執行 repo-native formal env preflight 與 binding readback
4. 再進入 Cloud Run / Cloudflare 的既有正式交付方向

這條路徑的正式意義是：

- deploy gate 必須先驗證 environment bindings 與 migration preflight
- deploy readback 必須可從 GitHub Actions artifact / log 追溯
- 任何正式 release 都必須沿用同一條治理路徑，而不是臨時換成 ad-hoc shell

以下做法一律不符合本 contract：

- 從本機或臨時 VM 直接做 ad-hoc shell deploy
- 直接對正式資料庫執行 `prisma db push`
- 以 `psql` 或手動 SQL 改寫 migration history，卻不回到正式 migration governance
- 跳過 `release-preflight` 或 formal env preflight 直接 promote

### 3. Backup / Restore 的最小 contract 是 provider-managed + external owner fail-closed

在單人營運正式層，正式備份能力允許依賴 provider-managed backup，不要求 repo 先自建完整 backup orchestration。

但允許依賴 managed capability，不等於可以不寫清楚責任與證據。production release 前，external infra owner 至少必須回填以下欄位：

- backup 工具名稱
- backup 入口 / job 名稱
- 最近一次成功備份時間點
- restore 主要 owner
- restore 替補 owner
- 預估 RTO
- 預估 RPO
- 最近一次 restore rehearsal 日期
- 最近一次 restore rehearsal 結果
- rehearsal report 或證據位置

若上述任一欄位缺失、未知、只有口頭描述、或證據不可追溯，處置原則只有一個：fail-closed。

fail-closed 的最低效果如下：

- 不得把 production release 視為可 promote
- 不得把 `Idx-024` 從 `QA` 視為已解除 external infra blocker
- 不得以「provider 應該有備份」取代實際 readback 與 owner sign-off

### 4. Rollback 的最小 contract 是「停等、回退應用版本、修正後重跑」，不是資料通用回滾

目前 Phase 1 沒有通用 destructive rollback API。這是正式限制，不得在任何 plan / log / runbook 中被淡化。

因此，單人營運正式層允許的回退方式只有以下幾類：

- 在流量切換前停在 `release-preflight` / formal env preflight，不繼續 promote
- 在應用層異常時，回退到前一個已知良好的 Cloud Run revision / Cloudflare 既有正式配置方向
- migration / seed / replay 失敗時，停止部署，修正 migration path 或 bootstrap path 後重新 preflight / replay
- 營運流程層異常時，依既有 runbook 走 revision、rerun、重新開窗或例外補償流程

以下做法不屬於允許的 rollback：

- 直接刪改正式 ledger、audit 或 migration history 來湊成「回滾」
- 把 application revision 回退誤寫成資料庫已完成回復
- 在沒有 rehearsal evidence 與 owner sign-off 前，假設 destructive restore 可即時執行

### 5. 停等點必須與既有 authority 對齊

正式 release 或事故處置至少要遵守以下停等點：

| 停等點 | 何時停 | 正式處置 |
|---|---|---|
| environment bindings 缺失 | `release-preflight` 前或過程中 | 停止 release，先補 bindings，再重跑 preflight |
| migration preflight 有 pending / unexpected / failed 狀態 | formal env preflight readback 時 | 停在 migration governance，修正後再 replay / promote |
| backup / restore 必填欄位未補齊 | production promote 前 | 停止 production release，維持 external infra blocker |
| 應用 deploy 後 smoke / readiness 不成立 | promote 後、切流前 | 回到前一個已知良好的 app revision，保留 evidence 後修正 |
| 營運窗口已開啟但資料流程失敗 | opening balance / intake / rerun 執行中 | 依既有 runbook cancel window、保留原因、重新開窗或 rerun |

## Secrets 與 Audit 的最低關係

### Secrets

- 正式環境 credential 只能來自 environment-scoped secrets / vars 或等價 secret manager
- 不得把正式 credential 寫進 repo、plan / log、聊天輸出或 ad-hoc script
- `NEXT_PUBLIC_PORTAL_API_BASE_URL` 雖非 secret，仍屬正式環境 binding contract 的一部分，不得任意 hard-code

### Audit

- 正式 release 至少要留下 GitHub Actions `release-preflight` 的 artifact / log readback
- 若進入正式 promote，應可追溯 target environment、操作者、時間點與對應 release 載體
- 若因 backup / restore 或 rollback 停等而中止，必須保留中止原因與對應 evidence 位置
- 任何 hotfix、replay、revision 或 rerun 若影響正式層，都必須回指既有 migration governance 或 ops runbook，不得只留口頭描述

## Authority Chain

本文件是單人營運正式層 deploy / backup / rollback 的最小 contract authority。細部責任分工如下：

- operating mode 與 provider baseline：`../decisions/operating_mode_and_database_provider_baseline.md`
- CI / env gate 與 secrets handling 最低線：`../decisions/ci_and_env_governance_baseline.md`
- 值班 readback、health、escalation 與操作順序：`post_launch_ops_runbook.md`
- external infra backup / restore 必填欄位與最終 sign-off：`production_backup_restore_signoff_checklist.md`
- migration / replay / hotfix / rollback 停等治理：`migration_governance_and_deployment_replay.md`

若未來要擴張到 multi-operator、full production、DR 演練制度或企業級分權維運，必須新增或升級 authority 文檔，而不是直接把本文件硬改成全面 production runbook。