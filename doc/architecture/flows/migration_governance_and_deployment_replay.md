# Migration Governance 與 Deployment Replay

更新日期：2026-04-03

Authoritative source：是

## 目的

本文件定義 Ivyhouse OP System 在 Phase 1 的 migration governance、deployment replay evidence 與 hotfix / rollback 停等規則。它不取代 `Idx-017` 的操作 runbook，而是提供 migration 專屬的正式治理基線。

## 適用範圍

- Prisma schema 變更
- Prisma migration 新增、整理、promotion 與 replay
- 部署前 migration preflight
- migration 失敗、hotfix migration 與 rollback 停等點

## 核心原則

1. `prisma migrate deploy` 是正式 release path，不得以 `db push` 取代。
2. migration 不只要在本機可跑，還要可 replay、可審查、可追溯。
3. deployment replay evidence 至少要同時包含 migration history、bootstrap seed 與最小 smoke readback。
4. 若正式 rollback API 或 destructive rollback 流程尚未存在，文件必須誠實標示限制，不得假裝 ready。

## Naming 與 Promotion Rules

### Naming

- migration 目錄命名必須可追溯其目的，不得保留空目錄、draft 目錄或無 `migration.sql` 的殘留物。
- migration 名稱應反映主要變更面，例如 persistence、contract、backfill、governance，而不是模糊的 `temp`、`draft`、`fix2`。

### Promotion

- 只有在乾淨資料庫上成功執行 `npm run prisma:migrate:deploy` 的 migration，才可進入 deployment 候選。
- 若 migration 需要額外前置表、extension 或資料回填，必須在 promotion 前把前置條件寫入 runbook 與本文件。
- 任何 migration 缺口若需手動 DBA 動作，必須先停在 preflight，不得直接混入 release 流程。

### Review

- 命中 schema、migration、inventory、deploy、rollback 任一高風險面時，必須做 Security Review 與 Domain Review。
- migration 若會影響 shared key、跨模組欄位或高風險交易表，Plan 必須同步標示 `SHARED KEY / CROSS-MODULE IMPACT`。

## Deployment Replay Evidence Format

每次 deployment replay 至少保留以下證據：

1. replay 環境識別：DB host、DB name、schema、執行時間
2. migration 執行命令與結果
3. `_prisma_migrations` readback
4. bootstrap seed 執行命令與 `AuditLog` readback
5. 至少一條最小 smoke evidence

### 最小 replay 命令組合

```bash
cd /workspaces/Ivyhouse_op_system/apps/api

DATABASE_URL='<target-database-url>' npm run prisma:migrate:deploy
DATABASE_URL='<target-database-url>' npm run prisma:seed
DATABASE_URL='<target-database-url>' node test/inventory-opening-balance-api-smoke.js
DATABASE_URL='<target-database-url>' npm run test:daily-ops:mainline
```

### 最小 readback 命令組合

```bash
psql '<target-database-url>' -c 'SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 5;'

psql '<target-database-url>' -c 'SELECT action, "createdAt" FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 5;'

psql '<target-database-url>' -c 'SELECT "eventType", "sourceType", "sourceId", "performedAt" FROM "InventoryEventLedger" ORDER BY "performedAt" DESC LIMIT 10;'
```

## Preflight Checklist

在任何 deployment replay 或正式 deploy 前，至少確認：

1. `DATABASE_URL` 指向正確環境，且連線帳號具備 migration 所需最小權限。
2. 目標環境不存在未受控 migration history 或手動 hotfix 未回掛情形。
3. `project_maintainers/chat/**` 的 owner 載體版本與 bootstrap seed 預期一致。
4. 若需要 opening balance 或 first batch 驗證，對應營運窗口與責任角色已排定。
5. 若 migration 會影響共享契約或高風險交易表，對應 review 與停等點已完成。

## Rollback 與 Hotfix Policy

### 核心限制

- 目前 Phase 1 沒有通用 destructive rollback API。
- 因此 migration 失敗時，優先策略是停在切流前、修正 migration path，再重新 replay。
- 若已進入流程層失敗，應以受控 revision / rerun / 重新開窗處理，不得直接改寫歷史表湊成回滾。

### 停等點

| 節點 | 可否繼續 | 正式處置 |
|------|----------|----------|
| migration 執行失敗 | 否 | 停止部署，修復 migration path，重跑 replay |
| seed 失敗或 `AuditLog` 缺失 | 否 | 修正 seed / owner 載體版本後重跑 |
| opening balance rehearsal 失敗 | 否 | 取消窗口、保留證據、重新開窗 |
| mainline smoke 失敗 | 視情況 | 保留批次與 audit 證據，修正後重跑 |

### Hotfix Migration

- hotfix migration 不得只存在正式環境；必須事後回掛 repo、補 replay 證據與 review 紀錄。
- 若 hotfix 無法在乾淨資料庫重播，視為未完成治理，不得進入 sign-off。

## 已驗證的第一輪 replay 基線

2026-04-03 已在本機 PostgreSQL 測試叢集完成最小 replay：

1. 重建乾淨測試 DB
2. `npm run prisma:migrate:deploy` 成功套用 `20260401183000_daily_ops_persistence`
3. `npm run prisma:seed` 成功
4. `node test/inventory-opening-balance-api-smoke.js` 回傳 `PASS`
5. `npm run test:daily-ops:mainline` 回傳 `PASS`
6. `_prisma_migrations`、`AuditLog`、`InventoryEventLedger`、`InventoryCountSession` readback 成功

這個 evidence 代表 migration path 已可 replay，但不等於正式環境已無風險；正式環境 history、extension 與手動補丁仍需後續 review。

## 關聯文件

- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/plans/Idx-011_plan.md`
- `doc/logs/Idx-011_log.md`
- `doc/plans/Idx-017_plan.md`
- `doc/logs/Idx-017_log.md`
- `doc/plans/Idx-019_plan.md`
- `doc/logs/Idx-019_log.md`
