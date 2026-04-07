# 盤點差異率 / 誤差率自動計算規格

更新日期：2026-04-01

Authoritative source：是

## 目的

本文件定義 Ivyhouse OP System 在盤點流程中，對原料、半成品與包材的差異量、差異率與誤差率自動計算規則。

本規格的目標不是重新定義盤點政策，而是把既有盤點 session、差異調整事件與 inventory ledger 的數量語意正式化，讓後續 API、頁面與報表可以用同一套公式與欄位解讀差異。

## 適用範圍

本規格適用於以下三類 inventory bucket：

1. 原料
2. 半成品
3. 包材

其中包材再分兩種治理模式：

1. 正式扣帳型包材：例如正式入表、入扣帳的外包裝材料與內包裝耗材
2. 人工盤點型用品：例如出貨 / 行政耗材，平時不自動扣除，但仍要用盤點與調整維護庫存

## 不在本規格處理的事項

以下內容不在本規格直接決定：

1. 負庫存是否允許：依 `inventory_count_adjustment_and_negative_stock_policy.md`
2. 出貨用品是否屬人工盤點型：依 `shipping_supply_inventory_policy.md`
3. 熟塔皮或其他轉製品的固定損耗率公式：本規格不預設固定耗損率
4. 差異門檻是否觸發 blocking 或 approval：本規格先定義計算，不定義硬擋規則

## 名詞定義

### 1. 帳面數量

- 欄位對應：`beforeQty`
- 語意：盤點開始時，系統依最新 ledger / baseline 算出的理論數量

### 2. 實盤數量

- 欄位對應：`countedQty`
- 語意：操作者實際盤點輸入的數量

### 3. 差異量

- 衍生欄位，不必先落 schema
- 公式：`差異量 = 實盤數量 - 帳面數量`
- 正值代表盤盈，負值代表盤虧

### 4. 差異率 %

- 現有欄位對應：`variancePct`
- 語意：保留正負號的偏差方向
- 公式：

`差異率% = ((實盤數量 - 帳面數量) / 帳面數量) * 100`

### 5. 誤差率 %

- 衍生欄位，不必先落 schema
- 語意：只看偏差幅度，不看方向
- 公式：

`誤差率% = (abs(實盤數量 - 帳面數量) / abs(帳面數量)) * 100`

## Zero Baseline 規則

若 `帳面數量 = 0`，則依下列規則處理：

1. `帳面數量 = 0` 且 `實盤數量 = 0`
   - 差異量 = 0
   - 差異率 % = 0
   - 誤差率 % = 0
2. `帳面數量 = 0` 且 `實盤數量 != 0`
   - 差異量 = `實盤數量`
   - 差異率 % = 不計算，回傳 `null`
   - 誤差率 % = 不計算，回傳 `null`
   - UI 必須標示 `Zero Baseline` 或等價訊息，提示「基準為 0，請看差異量，不看百分比」

理由：

- 當基準為 0 時，百分比沒有穩定數學意義
- 若硬算成 `100%`、`999%` 或無限大，會讓盤點報表失真

## 單位與換算原則

所有差異計算都必須先換算成該 SKU 的 `庫存主單位` 後再進行。

### 1. 原料

- 若庫存主單位是 `g` / `ml`，盤點輸入應先轉成 `g` / `ml`
- 若庫存主單位是 `袋` / `包` / `箱`，則先依正式換算表轉成主單位

### 2. 半成品

- 若庫存主單位是 `顆`，則所有 `箱 / 盒 / 顆` 盤點輸入都先換算成顆
- 若庫存主單位是 `箱`，但存在開箱後的輔助單位，例如 `片`，則先轉成箱的等值數量後再計算

例如：

- `SF0003 千層起酥皮`：`1 箱 = 36 片`
- 若未開封 2 箱、已開封剩 9 片，則帳面 / 實盤計算值可正規化為 `2 + 9/36 = 2.25 箱`

### 3. 包材

- 正式扣帳型包材與人工盤點型用品共用相同公式
- 差異只在帳面數量來源不同，不在公式不同

## 熟塔皮特例

`SF0002 熟塔皮` 目前已確認：

1. `生塔皮 -> 熟塔皮 = 1:1`
2. 不預設固定耗損率
3. 實際差異改由週盤點，後續穩定後改月盤點

因此本規格明確定義：

1. 熟塔皮的盤點差異，不得自動解釋成固定生產損耗率
2. 熟塔皮的差異率 / 誤差率，只代表「帳面與實盤的庫存差異」，不代表 recipe yield
3. 若未來要建立熟塔皮專用良率分析，必須另立 `production yield / loss` 規格，不得直接覆用本文件的盤點差異率

## 盤點 line 自動計算規則

建立或更新每一筆 `InventoryCountLine` 時，系統應自動計算下列欄位：

1. `differenceQty`
   - 公式：`countedQty - beforeQty`
2. `variancePct`
   - 沿用現有 schema 欄位
3. `errorPct`
   - 由服務層 / 查詢層即時計算，不要求 Phase 1 先落 schema
4. `varianceDirection`
   - `MATCHED`：差異量 = 0
   - `OVER`：差異量 > 0
   - `SHORT`：差異量 < 0
   - `ZERO_BASELINE`：帳面數量 = 0 且實盤數量 != 0

## Session 完成時的系統行為

當 `InventoryCountSession` 完成時：

1. 逐 line 比對 `beforeQty` 與 `countedQty`
2. 若兩者不同，建立 `InventoryAdjustmentEvent`
3. `qtyDelta` 一律使用 `countedQty - beforeQty`
4. ledger 事件沿用既有 `COUNT_ADJUSTMENT`
5. audit 必須記錄調整筆數、session id、performedBy、performedAt

本規格不改變目前的調整事件主線，只補足自動計算語意。

## 週 / 月滾動指標

為了支援你現在的週盤點與未來月盤點，本規格要求系統提供兩層指標：

### 1. 單次盤點指標

每筆 item 顯示：

1. 帳面數量
2. 實盤數量
3. 差異量
4. 差異率 %
5. 誤差率 %
6. 盤點日期
7. 操作人

### 2. 滾動期間指標

系統應支援以最近 7 天與最近 30 天為窗口，對同一 SKU 計算：

1. `countSessionCount`
   - 該期間盤點次數
2. `totalAbsDifferenceQty`
   - `Σ abs(差異量)`
3. `weightedErrorPct`
   - `Σ abs(差異量) / Σ abs(帳面數量) * 100`
   - 僅納入 `帳面數量 != 0` 的 line
4. `zeroBaselineCount`
   - 該期間 `帳面數量 = 0 且 實盤數量 != 0` 的筆數
5. `lastCountedAt`
   - 最近一次盤點完成時間

說明：

- `weightedErrorPct` 用於看一段期間的整體準確度
- `差異率 %` 用於看單次方向性
- `誤差率 %` 用於看單次偏差幅度

## UI / API 呈現要求

### 1. 原料頁

原料頁面應新增或顯示：

1. 最近一次盤點帳面數量
2. 最近一次實盤數量
3. 差異量
4. 差異率 %
5. 誤差率 %
6. 最近 7 天 / 30 天滾動誤差率

### 2. 包材頁

包材頁面應與原料頁採同一組欄位與公式，不得再各自計算。

### 3. 熟塔皮 / 半成品頁

半成品頁面應與原料、包材共用同一組差異欄位；但若 item 類型為 `由半成品轉製`，UI 要額外提示：

- 「本差異率為庫存差異，不代表固定耗損率」

## 舊 / 新包裝並行規則

對於 `SF0004 土鳳梨酥`、`SF0005 鳳凰酥` 這種存在新舊包裝並行期的 item：

1. 正式庫存主單位以 `顆` 為主
2. 新包裝 `280 顆 / 箱` 自 `2026-04-15` 生效
3. 舊包裝 `15 入 / 盒、12 盒 / 箱` 可並行至庫存耗盡
4. 差異計算時，一律先轉成顆再比較
5. 舊包裝停用日屬 event-based 資訊，必須在實際耗盡時回填

## rounding 規則

1. 數量欄位
   - `g` / `ml` 可保留到小數第 3 位
   - `顆` / `片` / `袋` / `包` / `盒` / `箱` 若業務允許 partial count，可保留到小數第 3 位；若業務只允許整數，UI 再限制輸入
2. 百分比欄位
   - 差異率 % 與誤差率 % 一律四捨五入到小數第 2 位

## 欄位對應與工程落點

本規格與現有 schema / service 的對應如下：

### 已存在欄位

1. `InventoryCountLine.beforeQty`
2. `InventoryCountLine.countedQty`
3. `InventoryCountLine.variancePct`
4. `InventoryAdjustmentEvent.qtyDelta`

### 可直接由服務層或查詢層衍生，不必先加欄位

1. `differenceQty`
2. `errorPct`
3. `varianceDirection`
4. `zeroBaselineFlag`
5. `weightedErrorPct`

### Phase 1 建議

1. 先不新增 migration
2. 由 `InventoryCountService` 與 read model / response DTO 提供衍生欄位
3. 後續若報表或 dashboard 對效能有壓力，再考慮建立 summary table 或 materialized view

## 驗收條件

本規格完成後，後續實作至少要通過以下驗收：

## 關聯文件

後續 API / DTO / response 草案，依：

- `doc/architecture/flows/inventory_count_api_contract.md`

1. 同一組 `beforeQty / countedQty` 在原料頁、包材頁、半成品頁顯示的差異量 / 差異率 / 誤差率完全一致
2. `帳面數量 = 0` 且 `實盤數量 != 0` 時，不得顯示誤導性的百分比
3. 熟塔皮頁面不得把盤點差異率直接標示為固定耗損率
4. SF0004 / SF0005 新舊包裝並行期的實盤輸入，經換算後能正確產生顆數差異
5. 完成盤點 session 後，差異 line 會自動產生 adjustment 與 ledger

## 關聯文件

1. `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`
2. `doc/architecture/flows/shipping_supply_inventory_policy.md`
3. `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`
4. `doc/architecture/phase1_mvp_scope.md`