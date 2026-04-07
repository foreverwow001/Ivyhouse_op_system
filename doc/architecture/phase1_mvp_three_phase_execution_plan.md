# Phase 1 MVP 三階段正式執行版

更新日期：2026-04-02

Authoritative source：否（execution roadmap；正式 task 狀態、啟動與完成判定仍以 `doc/implementation_plan_index.md` 為準）

## 目的

本文件把目前已完成的盤點差異契約落地、inventory-count backend 與 smoke 驗證，往下整理成一份可以直接接到 `Idx-*` work unit 的三階段執行版。

本文件回答四個問題：

1. 從目前基線到 Phase 1 MVP 可交付，建議拆成哪三個 phase。
2. 每個 phase 內要做哪些 task。
3. 每個 task 的依賴關係與先後順序是什麼。
4. 每個 phase 的驗收條件與建議 `Idx-*` work unit 是什麼。

## 目前基線

截至 2026-04-02，以下事項已具備可執行基線：

- `inventory_count_api_contract.md` 已落成 controller / service / response DTO 與 read-side 計算。
- inventory-count 已具備 focused metrics test 與獨立 DB smoke test。
- `原料直接分裝 / no_inner_stage` 的 CSV shared key 例外已寫回權威文件。
- `inventory-count` 已能提供 session、line、variance summary、history、negative stock alert、count reminder API。

但以下事項仍是 MVP 前的主要缺口：

- Prisma migration 衛生與正式 `migrate deploy` 路徑尚未收斂。
- opening balance runbook 與首盤演練尚未完成。
- 日常營運主線尚未完成端到端 evidence。
- 高風險操作的最小權限閘、cross-QA 與 go-live 收尾尚未完成。

## 三階段總覽

| Phase | 名稱 | 核心目標 | 完成後回答的問題 | 建議 work units |
|------|------|----------|------------------|-----------------|
| Phase A | Release Baseline | 清除上線 blocker，讓 schema、盤點、bootstrap 可以正式啟動 | 能不能 migrate、開帳、做第一次正式盤點 | `Idx-011` ~ `Idx-013` |
| Phase B | Mainline Closure | 打通日常營運 MVP 主線，建立端到端可驗收證據 | 能不能從需求一路走到盤點與審計閉環 | `Idx-014` ~ `Idx-016` |
| Phase C | Go-Live Hardening | 補齊部署、審查、回滾與驗收封板 | 能不能交付、上線、被審查與被營運團隊接手 | `Idx-017` ~ `Idx-018` |

## Phase A：Release Baseline

### 目標

先把會直接阻斷上線與驗收的前置條件清乾淨，避免後續主線實作建立在不穩定的 schema、seed 與盤點起跑點上。

### Task 清單

| Work Unit | 任務 | depends_on | 主要輸出 |
|-----------|------|------------|----------|
| `Idx-011` | Prisma migration 衛生與 release-safe schema path 收斂 | `Idx-004`, `Idx-007` | 可正式 `migrate deploy` 的 migration 路徑、測試 DB bootstrap 策略、migration hygiene 清單 |
| `Idx-012` | Opening balance bootstrap runbook 與首盤演練 | `Idx-004`, `Idx-006`, `Idx-011` | opening balance SOP、首盤前置條件、首盤 evidence、失敗補救步驟 |
| `Idx-013` | Inventory count 高風險操作最小權限閘與驗收硬化 | `Idx-004`, `Idx-005`, `Idx-011` | `complete session` / `manual adjustment` 最小 guard、API 驗收矩陣、風險邊界說明 |

### 驗收條件

1. 新環境可成功執行 `prisma migrate deploy`，不再受 draft migration 或目錄不一致阻斷。
2. `prisma seed`、測試 DB bootstrap 與 inventory smoke 路徑已文件化，且至少有一次成功 evidence。
3. opening balance 已有正式 runbook，且首盤流程可回答誰執行、何時執行、失敗如何補救。
4. `complete session`、`manual adjustment` 等高風險 inventory 操作已具最小權限閘或等價控制，不再完全裸露。

## Phase B：Mainline Closure

### 目標

把 Phase 1 MVP 真正要求的日常營運閉環打通，讓 daily ops 不再只是局部功能可用，而是可被整體驗收。

### Task 清單

| Work Unit | 任務 | depends_on | 主要輸出 |
|-----------|------|------------|----------|
| `Idx-014` | CSV owner 例外正規化與 runtime validation 收斂 | `Idx-003`, `Idx-004`, `Idx-006` | `compositionInputType + compositionInputSku` 正規化策略、CSV owner validation、shared key 例外對應 runtime 規則 |
| `Idx-015` | 日常營運主線 E2E smoke 與 evidence | `Idx-009`, `Idx-010`, `Idx-011`, `Idx-012`, `Idx-013`, `Idx-014` | demand → deduction → plan → BOM → replenishment → count → adjustment → audit 的端到端 smoke 與 evidence |
| `Idx-016` | 日常營運回歸 fixture matrix 與 failure-path 驗收 | `Idx-013`, `Idx-014`, `Idx-015` | 代表性 fixtures、zero baseline / negative stock / reminder / rollback / rerun 等例外路徑回歸矩陣 |

### 驗收條件

1. MVP 主線可從 demand batch 一路跑到 inventory adjustment 與 audit，不需人工補洞或平行 Excel 追蹤。
2. runtime 對 CSV authoritative source 的依賴已被明確正規化，不再用欄位名猜實體型別。
3. 至少有一套穩定的端到端 smoke 與一套 failure-path regression，可重複驗證主線與主要例外。
4. 整條主線可明確回答：使用哪個 owner 規則、在哪個節點建立事件、最後如何回到庫存與審計追溯鏈。

## Phase C：Go-Live Hardening

### 目標

在主線打通後，補齊實際交付所需的部署、審查、回滾與封板材料，避免 MVP 只有技術可跑、沒有營運與審查可交付性。

### Task 清單

| Work Unit | 任務 | depends_on | 主要輸出 |
|-----------|------|------------|----------|
| `Idx-017` | 部署、bootstrap 與 rollback runbook | `Idx-011`, `Idx-012`, `Idx-015` | migrate / seed / opening balance / demand batch / inventory-count 啟動步驟、rollback 與環境前置說明 |
| `Idx-018` | Phase 1 MVP review pack 與 go-live sign-off | `Idx-015`, `Idx-016`, `Idx-017` | cross-QA、domain/security review evidence、MVP 驗收清單、go-live sign-off 套件 |

### 驗收條件

1. 團隊可依 runbook 在新環境完成 migrate、bootstrap、opening balance 與第一輪營運驗收。
2. 高風險 inventory / daily-ops 流程已完成必要的 domain review、security review 與 cross-QA evidence。
3. MVP 驗收清單、已知風險、延後項與回滾策略已封板，不再靠口頭共識維持。

## 建議先後順序

建議依下列順序推進：

1. `Idx-011`
2. `Idx-012` 與 `Idx-013`
3. `Idx-014`
4. `Idx-015`
5. `Idx-016`
6. `Idx-017`
7. `Idx-018`

說明：

- `Idx-011` 是技術 blocker，應最先完成。
- `Idx-012` 與 `Idx-013` 都建立在可 deploy schema path 上，可平行推進。
- `Idx-014` 雖屬資料 / runtime 收斂，但若不先做，`Idx-015` 的 E2E evidence 很容易建立在曖昧欄位語意上。
- `Idx-016` 應建立在 `Idx-015` 已打通主線後，否則 regression matrix 會反覆重寫。
- `Idx-017` 與 `Idx-018` 屬交付硬化，應在主線與回歸證據成形後再做封板。

## 依賴圖（簡化）

```text
Idx-011
  ├─> Idx-012
  ├─> Idx-013
  └─> Idx-015

Idx-014 ───────────────┐
Idx-009, Idx-010 ─────┤
Idx-012, Idx-013 ─────┼─> Idx-015 ─> Idx-016 ─┐
                       │                       │
Idx-011 ───────────────┘                       │

Idx-011, Idx-012, Idx-015 ─> Idx-017 ─────────┤
Idx-015, Idx-016, Idx-017 ────────────────────┘-> Idx-018
```

## 與現有 Index 的關係

- `Idx-011` ~ `Idx-018` 屬本文件建議新增的正式 work unit。
- 正式狀態、depends_on 與啟動時點應同步維護於 `doc/implementation_plan_index.md`。
- 個別 work unit 一旦進入 `In Progress`，仍必須各自建立 `doc/plans/Idx-NNN_plan.md` 與 `doc/logs/Idx-NNN_log.md`。

## 關聯文件

- `doc/implementation_plan_index.md`
- `doc/architecture/phase1_mvp_scope.md`
- `doc/architecture/flows/daily_ops_engineering_breakdown.md`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/architecture/flows/inventory_count_api_contract.md`
- `doc/architecture/data/shared_key_contract.md`