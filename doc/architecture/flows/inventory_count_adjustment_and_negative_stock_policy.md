# 人工盤點、差異調整與負庫存政策

更新日期：2026-03-31

Authoritative source：是

## 目的

本文件定義 Ivyhouse OP System 對日常人工盤點、盤點差異調整與負庫存容忍政策的正式流程基線。

## 盤點範圍

- 可銷售成品。
- 內包裝完成品。
- 正式入表、入扣帳的外包裝材料與內包裝耗材。
- 人工管理但不入正式扣帳的出貨 / 行政耗材。

## 盤點頻率

- 系統初期：每週一次。
- 系統穩定後：每月一次。
- 不做系統參數切換。
- 若超過 1 個月未盤點，系統登入時應顯示提醒。

## 盤點紀錄最少欄位

- 調整前數量。
- 實盤數量。
- 操作人。
- 盤點日期。
- 備註。
- 誤差率 %：系統自動計算。

說明：

- `實盤數量` 即為調整後數量，因此不再另存一個重複欄位。

## 差異調整原則

- 盤點差異調整目前視為一般操作。
- 原因欄可保留，但非必填。
- 每次調整都必須保留操作者與日期。

## opening balance 特例

- opening balance 只允許由第一次正式盤點建立，不得由 seed、手動 SQL 或平行假資料直接灌入。
- 第一次盤點若 `beforeQty = 0` 且 `countedQty > 0`，應視為 `ZERO_BASELINE`，但仍必須透過正式 `InventoryAdjustmentEvent` / `InventoryEventLedger` 建立可追溯基線。
- opening balance 完成後，後續盤點即回到一般差異調整規則，不再沿用 bootstrap 特例。
- 若首盤失敗或中斷，應重開 session 或以新事件補正，不得覆寫既有 ledger 歷史。
- Phase 1 目前只有單一倉別；首盤期間不得讓不同 `countScope` 平行進行，必須在同一營運窗口依序完成。
- 首盤期間同一 `countScope` 不得同時開第二筆 `IN_PROGRESS` session。
- 若已有其他 `countScope` 的 `IN_PROGRESS` session，也不得建立新 session。
- 首盤中斷時一律不支援 resume；必須由 `主管` 取消當前 session，並在同一營運窗口重新建立新 session。
- 已取消的首盤 session 不得產生任何 inventory ledger 事件，也不得進入差異歷史統計。
- 首盤期間禁止插入實際營運流量；若發生，視為窗口失敗並重新開窗。

## 負庫存政策

### 允許範圍

- 所有庫存桶皆可暫時出現負庫存。

### 可接受角色

- 生產
- 包裝
- 會計
- 主管

### 系統行為

- 顯示負庫存警告。
- 不硬擋作業。
- 後續由人工安排工作、日終回填或盤點調整補正。

## 包材 / 出貨耗材邊界

### 正式入表、入扣帳項

- 外包裝材料主檔中的正式包材與內包裝耗材。
- 其中部分 `出貨及行政耗材` 類別，例如禮盒姓名貼，仍屬正式入表、入扣帳。

### 人工盤點型項

- `2026-03-31_出貨及行政耗材總表_template.csv` 中的紙箱、膠帶、感熱紙、氣泡紙等。
- 這些項目進 ERP 管理，但不在出貨或包裝時自動扣除。

## 與出貨用品政策的關係

- `shipping_supply_inventory_policy.md` 定義人工盤點型出貨用品的總體治理原則。
- 本文件進一步補足盤點頻率、欄位最小集合、負庫存容忍與提醒機制。

## 關聯文件

- `doc/architecture/flows/shipping_supply_inventory_policy.md`
- `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`
- `doc/architecture/flows/end_of_day_replenishment_spec.md`
- `doc/architecture/flows/inventory_variance_auto_calculation_spec.md`