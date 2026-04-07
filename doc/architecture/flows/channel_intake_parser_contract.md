# Channel Intake Parser Contract

更新日期：2026-03-29

Authoritative source：否（draft）

## 目的

本文件把「真實樣本分析」與 `picking-order-analyzer` 的既有行為整合成 Ivyhouse OP System Phase 1 可執行的 parser contract 草案，定義：

- 哪些渠道版型與語法已被真實樣本驗證，可直接沿用 legacy parser 思路
- 哪些屬於 parser code 應處理的固定結構
- 哪些屬於主資料 / 映射規則，應由系統內維護而不是每次改 code
- 哪些變更會觸發真正的 parser 開發

本文件聚焦 Intake 的「讀檔 / 解析 / 結構化輸出」邊界，不取代商品映射、BOM 拆解與例外處理規格。

## 分析結論

### 1. 四個已驗證渠道都可沿用 legacy parser 思路

| 渠道 | 真實樣本結論 | 對 legacy analyzer 的判斷 |
|------|--------------|---------------------------|
| MOMO / MO店+ | PDF 結構與既有辨識規則相符 | 可沿用 |
| 蝦皮 | PDF 欄位結構與 MOMO 高度接近 | 可沿用 |
| 官網 | Excel 前置 metadata + header row 與既有解析方向相符 | 可沿用 |
| 橘點子 | Excel 矩陣式版面與既有 cell-scan 思路相符 | 可沿用 |

### 2. 橘點子不應被判定為業務檔案損毀

- 使用者已實際驗證：sample 目錄中的橘點子撿貨單可直接開啟，legacy analyzer 也可正常解析與映射。
- 若某些開發期函式庫對 `.xls` 回報 workbook corruption，應先視為「讀檔工具相容性訊號」，不得直接把來源檔判定為不可用。
- Phase 1 的正式要求是：系統需支援現行橘點子下載檔 as-is 匯入。

### 3. `試吃:` 是正式支援語法，不是特例硬編碼

真實樣本已確認以下語意：

```text
試吃:艾薇-杏仁瓦片(原味)135g*1+艾薇-杏仁瓦片(巧克力)90g*1 98
```

其正確解讀為：

- 整組內容為 `原味 135g * 1 + 巧克力 90g * 1`
- 尾端 `98` 代表整組數量為 98 組
- 轉成結構化需求後，應得到：
  - `艾薇-杏仁瓦片(原味)135g` 需求 98
  - `艾薇-杏仁瓦片(巧克力)90g` 需求 98

因此 `試吃:` 的 parser contract 應支援「組合語法 + 尾端組數」這種通用句型，而不是只支援特定商品名稱。

## Parser Code 與資料治理邊界

### Parser code 必須負責的事

以下屬於固定檔案結構、版型或通用語法，應由 parser code 處理：

1. 平台辨識
2. PDF / Excel 檔案讀取與表格抽取
3. 欄位定位與 header 偵測
4. 固定句型語法解析，例如：
   - `試吃: A*1+B*1 98`
   - `贈品:滿額贈#商品名 1`
   - `商品名 數量`
5. 原始解析結果的結構化輸出
6. 無法解析時的錯誤與例外回報

### 不應預設用改 code 解決的事

以下屬於主資料或映射治理，應在系統內維護：

1. 新增銷售商品
2. 新增平台商品名稱別名
3. 新增同義規格名稱
4. 新增平台商品與正式 SKU 的映射規則
5. 新增禮盒 / 組合商品對應的 BOM 或組成定義
6. 調整映射優先序
7. 停用舊商品或舊映射規則

### 只有在下列情況才需要改 parser code

| 情況 | 是否需要改 code | 說明 |
|------|------------------|------|
| 新增商品名稱 | 否 | 應補主資料與映射規則 |
| 新增平台別名 | 否 | 應補平台別名 / 映射規則 |
| 新增禮盒內容 | 否 | 應補 BOM / 組成資料 |
| `試吃:` 中換成新商品 | 否 | 只要仍符合既有語法，應由資料治理承接 |
| 平台欄位名稱小幅異動但仍可透過可配置 header 對應處理 | 原則上否 | 應優先走 parser config |
| 全新檔案版型 | 是 | 例如欄位布局、header 語意、資料區位置全面改變 |
| 全新語法句型 | 是 | 例如不再是 `商品 + 數量` 或 `組合 + 尾端組數` |

## 渠道別 parser contract

### MOMO / MO店+

#### 識別基準

- PDF 文字可辨識 `MO店`、`MO 店`、`MO店+` 或等價標記
- 表頭核心欄位包含：`商品名稱`、`規格`、`出貨數量`

#### 解析輸出

- `原始商品名稱`
- `原始規格`
- `原始數量`
- `來源渠道 = MOMO`
- `來源列識別`

#### Phase 1 結論

- 既有 parser 思路可沿用
- `活動專用`、`xN 包 / 袋`、`幾入` 等語意應保留到結構化輸出，供後續映射層使用

### 蝦皮

#### 識別基準

- PDF 表頭與 MOMO 相近，但不以 `MO店+` 作為平台標記
- 表頭核心欄位包含：`商品名稱`、`規格`、`出貨數量`

#### 解析輸出

- `原始商品名稱`
- `原始規格`
- `原始數量`
- `來源渠道 = 蝦皮`
- `來源列識別`

#### Phase 1 結論

- parser 可沿用 legacy 方向
- 但後續 mapping 不得再預設忽略 `提袋加購` 或非 `咖啡小花` 的咖啡品項；這是映射治理問題，不是 parser 應直接過濾的問題

### 官網

#### 識別基準

- Excel 含前置 metadata，例如：`揀貨單`、`篩選條件`、`建表日期`
- 正式 header row 可辨識：`商品名稱`、`規格`、`數量`

#### 解析輸出

- `原始商品名稱`
- `原始規格`
- `原始數量`
- `來源渠道 = 官網`
- `來源列識別`

#### Phase 1 結論

- 現有 Excel parser 思路可沿用
- 正式實作需避免把固定 row offset 寫死成唯一判斷方式，應允許以 header 偵測為主

### 橘點子

#### 識別基準

- Excel 為矩陣式版面，不是逐列交易明細
- 單一儲存格可能同時承載「品名 + 數量」或「組合句型 + 組數」

#### 正式支援語法

1. 普通格式：`商品名稱 數量`
2. `贈品:` 格式
3. `試吃:` 格式
4. 數量為 0 或 `Total` 類值應由 parser 排除

#### `試吃:` contract

`試吃:` 至少需支援下列語法：

```text
試吃:商品A*1+商品B*1 98
```

解析規則：

1. 冒號後到尾端組數前的區段為組合內容
2. `+` 代表組內多個子品項
3. `*N` 代表組內該子品項倍率
4. 最尾端數字代表整組數量
5. 每個子品項的結構化需求量 = 組內倍率 × 整組數量

#### Phase 1 結論

- 橘點子 parser 可沿用 legacy 的 cell-scan 方向
- 但正式實作需把 `試吃:` 語法定義成可重用 parser grammar，而不是只針對某個已知商品名稱做字串特判

## Parser 輸出 contract

所有 parser 最低都應輸出下列欄位：

| 欄位 | 說明 |
|------|------|
| `匯入批次ID` | 關聯本次 intake |
| `來源檔案ID` | 關聯原始檔 |
| `來源渠道` | 正式渠道代碼 |
| `原始列識別` | PDF 行號、Excel sheet/cell 座標或等價定位資訊 |
| `原始商品文字` | 原始文字，不可覆寫 |
| `原始規格文字` | 若有規格欄則保留 |
| `原始數量` | parser 推得的正式數量 |
| `解析類型` | 例如 `普通列`、`試吃組合`、`贈品` |
| `解析信心` | `高`、`中`、`低` |
| `parser警示碼` | 可空白，用於標示疑似異常 |

## 驗收基準

### 驗收 1：既有四渠道樣本可穩定產生結構化輸出

- MOMO / 蝦皮 PDF
- 官網 Excel
- 橘點子 Excel

### 驗收 2：新增商品不需改 parser code

- 只要檔案版型與句型不變，新商品、新口味、新平台命名應透過主資料與映射規則承接

### 驗收 3：例外需顯式輸出，不得靜默丟棄

- 無法辨識的平台
- 無法解析的欄位
- 低信心解析
- 不符合既有 grammar 的新句型

## 關聯文件

- `doc/architecture/flows/intake_demand_aggregation_spec.md`
- `doc/architecture/flows/channel_intake_exception_resolution_spec.md`
- `doc/architecture/data/channel_product_mapping_governance.md`
- `doc/architecture/data/master_data_dictionary.md`
- `doc/architecture/data/channel_intake_entity_field_contract.md`
- `doc/architecture/flows/channel_intake_state_machine.md`
- `doc/architecture/flows/channel_intake_api_contract.md`
- `doc/architecture/flows/channel_intake_sample_acceptance_matrix.md`
- `doc/architecture/flows/channel_intake_golden_expected_output.md`