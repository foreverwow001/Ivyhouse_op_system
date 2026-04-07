# Transaction / Working Entity Dictionary

更新日期：2026-03-29

Authoritative source：否（draft）

## 目的

本文件定義 Ivyhouse OP System Phase 1 第一批交易 / 作業實體字典，補上目前已經在 scope 與 flow spec 中出現、但尚未有獨立字典的核心實體。

本版聚焦以下 9 類實體：

- 來源檔案
- 匯入批次
- 解析結果
- 映射結果
- 批次需求彙總
- 規劃期間
- 規劃版本
- 規劃異動
- 規劃庫存推演

## 範圍說明

- 本文件處理的是交易 / 作業實體，不是傳統主資料。
- 本文件定義 owner、正式識別碼、最低必要欄位、主要 consumer 與治理邊界，供後續 schema、state machine、service boundary 與審計設計使用。
- 本版先不展開更細的子實體字典，例如 `匯入批次明細`、`規劃需求行`、`來源行附件`、`批次修正關聯表`。這些屬第二版細化範圍。
- 本文件不替代 `master_data_dictionary.md`；凡涉及渠道、SKU、映射規則、BOM、單位換算與 cutoff 規則，仍以主資料 / 正式規則 owner 為準。

## 共通基線

### 1. 交易 / 作業實體共通欄位

| 欄位 | 用途 | 規則 |
|------|------|------|
| `狀態` | 表示該實體目前處於哪個作業節點 | 必須對應流程 / state machine；不得只用 UI 標籤取代 |
| `建立時間` | 保留建立時點 | 不可空白 |
| `建立者` | 保留建立責任 | 不可空白；先記角色 / 帳號，後續可再細化到人員 |
| `最後更新時間` | 保留最近一次修改時點 | 不可空白 |
| `最後更新者` | 保留最近一次修改責任 | 不可空白 |
| `來源建立方式` | 區分自動解析、半結構化輸入、純手動、系統產生 | 不可空白 |

### 2. 不可物理覆寫原則

- 來源檔案、已確認批次需求、規劃版本、規劃庫存推演都屬高追溯要求資料，不得用覆寫歷史的方式更新。
- 若業務上需要修正，應透過新版本、新異動或修正批次承接，而不是直接改掉歷史內容。

### 3. surrogate key / business reference 分離原則

- 交易 / 作業實體應優先採用系統產生的不可變識別碼作為正式 key。
- 與主資料互動時，引用正式 shared key，例如 `渠道代碼`、`銷售商品SKU_正式`、`內包裝完成品SKU_正式`、`映射規則代碼`。
- 不得把原始商品名稱、原始檔名、Excel 列號、手動備註當成正式跨模組識別碼。

### 4. 批次處理權限與主資料治理權限分離原則

- 日常訂單處理角色可操作匯入、覆核、單筆手動指定 SKU、修正批次與旺季試算。
- 但這不等於可以直接新增、修改或停用正式 `商品映射規則`、`銷售渠道` 或 `渠道時效 / cutoff 規則`。
- 交易實體中的手動覆核只影響當次處理，不應反向視為主資料 owner 已核定的新正式值。

## 實體字典

### 1. 來源檔案

| 項目 | 定義 |
|------|------|
| 實體名稱 | 來源檔案 |
| Owner module | Order / Fulfillment |
| Authoritative source | 本文件第一版定義；後續應落地到正式上傳檔案模型 |
| 正式 key | `來源檔案ID` |
| 主要 consumer | 匯入批次、解析結果、審計追溯 |
| 最低必要欄位 | `來源檔案ID`、`原始檔名`、`渠道代碼`、`匯入目標`、`檔案雜湊值`、`MIME類型`、`上傳時間`、`上傳者`、`狀態`、`來源建立方式` |
| 補充規格 | `doc/architecture/flows/intake_demand_aggregation_spec.md` |

治理重點：

- 來源檔案是追溯鏈的起點，不得在重新上傳時覆寫既有檔案內容。
- 同一檔案若因重試再次上傳，應產生新 `來源檔案ID`，但可用雜湊值辨識是否重複。
- 來源檔案可對應正式需求或旺季試算，但 `匯入目標` 必須明確，不得模糊共用。

### 2. 匯入批次

| 項目 | 定義 |
|------|------|
| 實體名稱 | 匯入批次 |
| Owner module | Order / Fulfillment |
| Authoritative source | 本文件第一版定義；後續應落地到 Batch Intake 模型 |
| 正式 key | `匯入批次ID` |
| 主要 consumer | 解析結果、映射結果、批次需求彙總、規劃期間 |
| 最低必要欄位 | `匯入批次ID`、`匯入目標`、`渠道代碼`、`批次日期`、`操作者`、`確認時間`、`狀態`、`來源建立方式` |
| 補充規格 | `doc/architecture/flows/intake_demand_aggregation_spec.md` |

治理重點：

- 一天可存在多個匯入批次，不得假設每日只有一批。
- `匯入目標` 至少區分 `正式需求` 與 `旺季試算`，兩者生命週期不同。
- 批次一旦確認，不得整批直接撤回；若需更正，應透過修正批次承接。

### 3. 解析結果

| 項目 | 定義 |
|------|------|
| 實體名稱 | 解析結果 |
| Owner module | Order / Fulfillment |
| Authoritative source | 本文件第一版定義；後續應落地到 parser output 模型 |
| 正式 key | `解析結果行ID` |
| 主要 consumer | 映射結果、來源追溯、解析品質檢查 |
| 最低必要欄位 | `解析結果行ID`、`匯入批次ID`、`來源檔案ID`、`原始商品文字`、`原始數量`、`原始備註`、`解析信心等級`、`狀態`、`建立時間`、`建立者` |
| 補充規格 | `doc/architecture/flows/intake_demand_aggregation_spec.md` |

治理重點：

- 解析結果保留原始文字與數量，不得在映射階段直接覆寫原始值。
- 若 parser 失敗或信心不足，應以狀態標記並交由人工處理，不得自動丟棄。
- 解析結果是原始輸入的結構化快照，不等於正式需求。

### 4. 映射結果

| 項目 | 定義 |
|------|------|
| 實體名稱 | 映射結果 |
| Owner module | Order / Fulfillment |
| Authoritative source | 本文件第一版定義；後續應落地到 mapping result 模型 |
| 正式 key | `映射結果行ID` |
| 主要 consumer | 批次需求彙總、旺季試算、來源追溯 |
| 最低必要欄位 | `映射結果行ID`、`解析結果行ID`、`銷售商品SKU_正式`、`映射方式`、`映射規則代碼`、`是否人工覆核`、`覆核者`、`覆核時間`、`狀態` |
| 補充規格 | `doc/architecture/flows/intake_demand_aggregation_spec.md` |

治理重點：

- `映射規則代碼` 若存在，代表引用正式主資料規則；若為單筆手動指定 SKU，必須能區分，不得假裝是永久規則。
- 人工覆核只確認本批次結果是否可接受，不等於正式主資料 owner 已發布新的映射規則。
- 已覆核的映射結果可進入後續彙總；未覆核或待處理的映射結果不得自動進正式需求。

### 5. 批次需求彙總

| 項目 | 定義 |
|------|------|
| 實體名稱 | 批次需求彙總 |
| Owner module | Order / Fulfillment |
| Authoritative source | 本文件第一版定義；後續應落地到正式需求模型 |
| 正式 key | `批次需求行ID` |
| 主要 consumer | 需求扣庫存、生產建議、出貨狀態回寫、修正批次 |
| 最低必要欄位 | `批次需求行ID`、`匯入批次ID`、`需求日期`、`渠道代碼`、`急單標記`、`庫存計算粒度`、`銷售商品SKU_正式`、`內包裝完成品SKU_正式`、`需求數量`、`確認者`、`確認時間`、`狀態` |
| 補充規格 | `doc/architecture/flows/intake_demand_aggregation_spec.md`、`doc/architecture/phase1_mvp_scope.md` |

治理重點：

- `批次需求彙總` 是正式需求入口，不是 parser 中間結果。
- 此實體已承接 BOM 拆分後語意，因此可同時保留銷售商品層與內包裝完成品層引用，但必須明確標示 `庫存計算粒度`。
- 已確認需求若需變更，應透過修正批次或取消標記承接，不得直接抹除歷史需求行。

### 6. 規劃期間

| 項目 | 定義 |
|------|------|
| 實體名稱 | 規劃期間 |
| Owner module | Production / Planning |
| Authoritative source | 本文件第一版定義；後續應落地到旺季試算工作區模型 |
| 正式 key | `規劃期間ID` |
| 主要 consumer | 規劃版本、規劃異動、規劃庫存推演 |
| 最低必要欄位 | `規劃期間ID`、`規劃名稱`、`起始日`、`結束日`、`建立者`、`封存時間`、`狀態`、`來源建立方式` |
| 補充規格 | `doc/architecture/flows/demand_planning_spec.md` |

治理重點：

- 規劃期間可重疊存在，但系統預設不自動把多個期間合併成單一全域總量。
- 規劃期間是試算工作區容器，不得視為正式訂單或正式排程單位。
- 封存後不得再接受異動，但仍須保留歷史查閱能力。

### 7. 規劃版本

| 項目 | 定義 |
|------|------|
| 實體名稱 | 規劃版本 |
| Owner module | Production / Planning |
| Authoritative source | 本文件第一版定義；後續應落地到試算版本模型 |
| 正式 key | 組合鍵：`規劃期間ID + 版本號` |
| 主要 consumer | 規劃異動、規劃庫存推演、版本比對 |
| 最低必要欄位 | `規劃期間ID`、`版本號`、`版本觸發類型`、`前一版本號`、`建立時間`、`建立者`、`狀態` |
| 補充規格 | `doc/architecture/flows/demand_planning_spec.md` |

治理重點：

- 規劃版本一旦建立，不得就地修改內容；任何實質變更都應產生新版本。
- `版本觸發類型` 至少要能區分新增、追加、扣減、修改與系統重算。
- 版本號只在同一規劃期間內遞增，不做跨期間共用流水號。

### 8. 規劃異動

| 項目 | 定義 |
|------|------|
| 實體名稱 | 規劃異動 |
| Owner module | Production / Planning |
| Authoritative source | 本文件第一版定義；後續應落地到試算異動模型 |
| 正式 key | `規劃異動ID` |
| 主要 consumer | 規劃版本、異動追溯、差異比對 |
| 最低必要欄位 | `規劃異動ID`、`規劃期間ID`、`異動類型`、`異動前版本號`、`異動後版本號`、`異動摘要`、`操作者`、`異動時間`、`狀態` |
| 補充規格 | `doc/architecture/flows/demand_planning_spec.md` |

治理重點：

- 每次實質異動都應有對應的 `規劃異動` 紀錄，不能只有新版本號而沒有異動說明。
- 異動摘要至少要能回答改了哪些日期、哪些商品、哪些數量。
- `規劃異動` 是追溯單位，不等於需求明細本身。

### 9. 規劃庫存推演

| 項目 | 定義 |
|------|------|
| 實體名稱 | 規劃庫存推演 |
| Owner module | Production / Planning |
| Authoritative source | 本文件第一版定義；後續應落地到試算推演快照模型 |
| 正式 key | `規劃庫存推演ID` |
| 主要 consumer | 規劃視圖、缺口警示、人工排產判斷 |
| 最低必要欄位 | `規劃庫存推演ID`、`規劃期間ID`、`版本號`、`需求日期`、`庫存計算粒度`、`銷售商品SKU_正式`、`內包裝完成品SKU_正式`、`起始可用庫存`、`試算需求量`、`正式需求參考量`、`預估庫存餘量`、`低於安全庫存標記`、`缺口數量`、`狀態` |
| 補充規格 | `doc/architecture/flows/demand_planning_spec.md` |

治理重點：

- 規劃庫存推演是推導結果快照，不是正式庫存台帳事件。
- 推演結果不得回寫正式庫存餘量，也不得直接觸發正式工單。
- `正式需求參考量` 只作為疊加參考，不等於與試算自動對沖。

## 待補第二版細化項目

- `匯入批次明細` 子實體字典
- `規劃需求行` 子實體字典
- 修正批次與原批次的關聯模型
- 解析錯誤、映射待處理、BOM 警告等例外事件字典
- `批次需求彙總` 與工單 / 出貨的正式狀態機欄位對照

## 關聯文件

- `doc/architecture/data/master_data_dictionary.md`
- `doc/architecture/data/shared_key_contract.md`
- `doc/architecture/flows/intake_demand_aggregation_spec.md`
- `doc/architecture/flows/demand_planning_spec.md`
- `doc/architecture/phase1_mvp_scope.md`
- `doc/architecture/data/channel_intake_entity_field_contract.md`
- `doc/architecture/flows/channel_intake_state_machine.md`
- `doc/architecture/flows/channel_intake_api_contract.md`