# Channel Intake Entity Field Contract

更新日期：2026-03-29

Authoritative source：否（draft）

## 目的

本文件把下列三份 spec 往下落成 Phase 1 可實作的實體欄位契約：

- `doc/architecture/flows/channel_intake_parser_contract.md`
- `doc/architecture/data/channel_product_mapping_governance.md`
- `doc/architecture/flows/channel_intake_exception_resolution_spec.md`

本文件的定位是：

- 不取代 `transaction_working_entity_dictionary.md` 的實體語意定義
- 在既有實體字典基礎上，補齊欄位、型別、enum、關聯與最低必要不可空白條件
- 作為後續 Prisma schema、DTO、validation、API payload 與審計欄位設計的資料契約草案

## 範圍

本版聚焦 Intake / Mapping / Exception 主線需要的 8 類實體：

1. 來源檔案
2. 匯入批次
3. 解析結果行
4. 映射結果行
5. Intake 例外事件
6. 單批處理決議
7. 映射規則提案
8. 新商品提案

本版先不展開正式主資料表、正式商品組成表、正式 BOM 表與正式規則發布表；那些仍以主資料治理文件為準。

## 命名與型別基線

### 命名基線

- 對外 API 欄位命名建議採 `camelCase`
- 資料表 / schema 欄位命名建議採 `snake_case`
- 本文件為易讀性起見，以「中文欄位名 + 英文建議名」並列

### 建議型別基線

| 型別 | 用途 |
|------|------|
| `uuid` | 正式不可變識別碼 |
| `string` | 一般文字欄位 |
| `text` | 長備註、原始文字、錯誤訊息 |
| `integer` | 數量、優先序、版本序號 |
| `boolean` | 條件旗標 |
| `date` | 業務日期 |
| `datetime` | 系統時間戳 |
| `enum` | 狀態、類型、目標類別 |
| `json` | parser meta、擴充欄位、審計快照 |

## 共通 enum

### 匯入目標 `intakeTarget`

- `正式需求`
- `旺季試算`

### 來源建立方式 `creationSource`

- `檔案上傳`
- `手動輸入`
- `系統產生`
- `例外回寫`

### 解析類型 `parseKind`

- `普通列`
- `贈品`
- `試吃組合`
- `手動輸入`
- `未知`

### 映射方式 `mappingMethod`

- `規則命中`
- `人工指定`
- `單批接受`
- `未映射`

### 例外類型 `exceptionType`

- `平台辨識失敗`
- `解析失敗`
- `低信心解析`
- `未映射`
- `規則衝突`
- `需新grammar`

## 實體欄位契約

### 1. 來源檔案 Source File

| 欄位 | 英文建議名 | 型別 | 必填 | 說明 |
|------|------------|------|------|------|
| 來源檔案ID | `sourceFileId` | `uuid` | 是 | 正式 key |
| 匯入批次ID | `intakeBatchId` | `uuid` | 是 | 關聯所屬批次 |
| 原始檔名 | `originalFileName` | `string` | 是 | 使用者上傳檔名 |
| 檔案副檔名 | `fileExtension` | `string` | 是 | `pdf` / `xls` / `xlsx` |
| MIME 類型 | `mimeType` | `string` | 是 | 檔案技術類型 |
| 檔案雜湊值 | `fileHash` | `string` | 是 | 去重與追溯用途 |
| 檔案大小 | `fileSizeBytes` | `integer` | 是 | byte 數 |
| 來源渠道代碼 | `channelCode` | `string` | 是 | 正式渠道 key |
| 匯入目標 | `intakeTarget` | `enum` | 是 | `正式需求` / `旺季試算` |
| 儲存位置 | `storagePath` | `string` | 是 | 內部儲存引用 |
| parser 識別結果 | `parserProfile` | `string` | 否 | 如 `momo_pdf_v1` |
| 解析錯誤訊息 | `parseErrorMessage` | `text` | 否 | 解析失敗時保留 |
| 狀態 | `status` | `enum` | 是 | 見狀態機文件 |
| 上傳時間 | `uploadedAt` | `datetime` | 是 | 審計用途 |
| 上傳者 | `uploadedBy` | `string` | 是 | 帳號或角色 |
| 建立時間 | `createdAt` | `datetime` | 是 | 系統欄位 |
| 最後更新時間 | `updatedAt` | `datetime` | 是 | 系統欄位 |

### 2. 匯入批次 Intake Batch

| 欄位 | 英文建議名 | 型別 | 必填 | 說明 |
|------|------------|------|------|------|
| 匯入批次ID | `intakeBatchId` | `uuid` | 是 | 正式 key |
| 匯入目標 | `intakeTarget` | `enum` | 是 | `正式需求` / `旺季試算` |
| 主渠道代碼 | `primaryChannelCode` | `string` | 否 | 單渠道批次可填；多來源批次可空白 |
| 批次日期 | `batchDate` | `date` | 是 | 業務歸屬日期 |
| 規劃期間ID | `planningWindowId` | `uuid` | 否 | 只有試算批次使用 |
| 指定需求日期 | `defaultDemandDate` | `date` | 否 | 無指定出貨日時的預設日 |
| 來源檔案數 | `sourceFileCount` | `integer` | 是 | 快取統計 |
| 解析結果數 | `parsedLineCount` | `integer` | 是 | 快取統計 |
| 未映射數 | `unmappedCount` | `integer` | 是 | 快取統計 |
| 待人工確認數 | `pendingReviewCount` | `integer` | 是 | 快取統計 |
| 確認時間 | `confirmedAt` | `datetime` | 否 | 正式確認才有值 |
| 確認者 | `confirmedBy` | `string` | 否 | 正式確認責任 |
| 狀態 | `status` | `enum` | 是 | 見狀態機文件 |
| 建立時間 | `createdAt` | `datetime` | 是 | 系統欄位 |
| 建立者 | `createdBy` | `string` | 是 | 系統欄位 |
| 最後更新時間 | `updatedAt` | `datetime` | 是 | 系統欄位 |
| 最後更新者 | `updatedBy` | `string` | 是 | 系統欄位 |

### 3. 解析結果行 Parsed Line

| 欄位 | 英文建議名 | 型別 | 必填 | 說明 |
|------|------------|------|------|------|
| 解析結果行ID | `parsedLineId` | `uuid` | 是 | 正式 key |
| 匯入批次ID | `intakeBatchId` | `uuid` | 是 | 關聯批次 |
| 來源檔案ID | `sourceFileId` | `uuid` | 否 | 手動輸入時可空白 |
| 來源渠道代碼 | `channelCode` | `string` | 是 | 正式渠道 key |
| 原始列識別 | `sourceRowRef` | `string` | 是 | PDF 行號 / Excel cell 座標 / 手動列序號 |
| 原始商品文字 | `rawProductText` | `text` | 是 | 不可覆寫 |
| 原始規格文字 | `rawSpecText` | `text` | 否 | 若有則保留 |
| 原始數量 | `rawQuantity` | `integer` | 是 | parser 推得數量 |
| 解析類型 | `parseKind` | `enum` | 是 | 普通列 / 試吃組合等 |
| 解析信心 | `parseConfidence` | `enum` | 是 | `高` / `中` / `低` |
| parser 警示碼 | `parserWarningCode` | `string` | 否 | 疑似異常標記 |
| parser meta | `parserMeta` | `json` | 否 | 子品項倍率、欄位定位資訊等 |
| 狀態 | `status` | `enum` | 是 | 見狀態機文件 |
| 建立時間 | `createdAt` | `datetime` | 是 | 系統欄位 |
| 建立者 | `createdBy` | `string` | 是 | 系統欄位 |

### 4. 映射結果行 Mapping Result

| 欄位 | 英文建議名 | 型別 | 必填 | 說明 |
|------|------------|------|------|------|
| 映射結果行ID | `mappingResultId` | `uuid` | 是 | 正式 key |
| 解析結果行ID | `parsedLineId` | `uuid` | 是 | 關聯解析結果 |
| 對應銷售商品SKU | `sellableProductSku` | `string` | 否 | 未映射可空白 |
| 對應組合商品SKU | `bundleProductSku` | `string` | 否 | 若原始列屬組合商品可填 |
| 映射規則代碼 | `mappingRuleCode` | `string` | 否 | 規則命中才有值 |
| 映射方式 | `mappingMethod` | `enum` | 是 | 規則命中 / 人工指定 / 單批接受 / 未映射 |
| 映射信心 | `mappingConfidence` | `enum` | 是 | `高` / `中` / `低` |
| 是否人工覆核 | `isHumanReviewed` | `boolean` | 是 | 覆核軌跡 |
| 覆核者 | `reviewedBy` | `string` | 否 | 只要人工介入就填 |
| 覆核時間 | `reviewedAt` | `datetime` | 否 | 只要人工介入就填 |
| 是否需 BOM 展開 | `requiresExplosion` | `boolean` | 是 | 組合商品判斷 |
| 狀態 | `status` | `enum` | 是 | 見狀態機文件 |
| 建立時間 | `createdAt` | `datetime` | 是 | 系統欄位 |
| 最後更新時間 | `updatedAt` | `datetime` | 是 | 系統欄位 |

### 5. Intake 例外事件 Exception Event

| 欄位 | 英文建議名 | 型別 | 必填 | 說明 |
|------|------------|------|------|------|
| 例外事件ID | `intakeExceptionId` | `uuid` | 是 | 正式 key |
| 匯入批次ID | `intakeBatchId` | `uuid` | 是 | 關聯批次 |
| 來源檔案ID | `sourceFileId` | `uuid` | 否 | 若來自檔案則必填 |
| 解析結果行ID | `parsedLineId` | `uuid` | 否 | 若來自解析行則填 |
| 映射結果行ID | `mappingResultId` | `uuid` | 否 | 若來自映射階段則填 |
| 例外類型 | `exceptionType` | `enum` | 是 | 平台辨識失敗 / 未映射等 |
| 來源列識別 | `sourceRowRef` | `string` | 否 | 關聯原始位置 |
| 原始商品文字 | `rawProductText` | `text` | 否 | 若有則保留 |
| 原始規格文字 | `rawSpecText` | `text` | 否 | 若有則保留 |
| 原始數量 | `rawQuantity` | `integer` | 否 | 若有則保留 |
| 錯誤訊息 | `errorMessage` | `text` | 否 | 解析 / 衝突內容 |
| 建議處理動作 | `suggestedAction` | `enum` | 是 | 見例外處理 spec |
| 狀態 | `status` | `enum` | 是 | 見狀態機文件 |
| 建立時間 | `createdAt` | `datetime` | 是 | 系統欄位 |
| 建立者 | `createdBy` | `string` | 是 | 系統欄位 |

### 6. 單批處理決議 Batch Resolution

| 欄位 | 英文建議名 | 型別 | 必填 | 說明 |
|------|------------|------|------|------|
| 單批決議ID | `batchResolutionId` | `uuid` | 是 | 正式 key |
| 例外事件ID | `intakeExceptionId` | `uuid` | 是 | 一筆決議對應一筆例外 |
| 決議類型 | `resolutionType` | `enum` | 是 | `單批接受` / `單批拒絕` / `改指定SKU` |
| 指定SKU | `resolvedSellableProductSku` | `string` | 否 | 若人工指定則填 |
| 修正數量 | `resolvedQuantity` | `integer` | 否 | 若需修正數量則填 |
| 決議原因 | `resolutionReason` | `text` | 否 | 決策說明 |
| 是否升級治理 | `shouldPromote` | `boolean` | 是 | 是否要轉提案 |
| 決議者 | `resolvedBy` | `string` | 是 | 責任人 |
| 決議時間 | `resolvedAt` | `datetime` | 是 | 決議時間 |

### 7. 映射規則提案 Mapping Rule Proposal

| 欄位 | 英文建議名 | 型別 | 必填 | 說明 |
|------|------------|------|------|------|
| 提案ID | `mappingRuleProposalId` | `uuid` | 是 | 正式 key |
| 來源例外事件ID | `sourceExceptionId` | `uuid` | 否 | 從例外回寫可填 |
| 渠道代碼 | `channelCode` | `string` | 是 | 平台來源 |
| 原始品名字串 | `rawProductPattern` | `text` | 是 | 提議匹配文字 |
| 原始規格字串 | `rawSpecPattern` | `text` | 否 | 提議規格匹配 |
| 建議對應SKU | `proposedSellableProductSku` | `string` | 是 | 正式商品鍵 |
| 提案理由 | `proposalReason` | `text` | 否 | 說明來源 |
| 狀態 | `status` | `enum` | 是 | 見狀態機文件 |
| 提案者 | `proposedBy` | `string` | 是 | 建立責任 |
| 提案時間 | `proposedAt` | `datetime` | 是 | 建立時間 |
| 審核者 | `reviewedBy` | `string` | 否 | 核定角色 |
| 審核時間 | `reviewedAt` | `datetime` | 否 | 核定時間 |

### 8. 新商品提案 New Product Proposal

| 欄位 | 英文建議名 | 型別 | 必填 | 說明 |
|------|------------|------|------|------|
| 提案ID | `newProductProposalId` | `uuid` | 是 | 正式 key |
| 來源例外事件ID | `sourceExceptionId` | `uuid` | 否 | 從例外回寫可填 |
| 建議商品名稱 | `proposedProductName` | `string` | 是 | 業務顯示名稱 |
| 商品類型 | `proposedProductType` | `string` | 是 | 單品 / 禮盒 / 加購品等 |
| 建議規格摘要 | `proposedSpecSummary` | `text` | 否 | 規格與包裝資訊 |
| 是否組合商品 | `isBundleProduct` | `boolean` | 是 | 是否需 BOM |
| 建議渠道範圍 | `proposedChannelScope` | `json` | 否 | 哪些渠道會用到 |
| 狀態 | `status` | `enum` | 是 | 見狀態機文件 |
| 提案者 | `proposedBy` | `string` | 是 | 建立責任 |
| 提案時間 | `proposedAt` | `datetime` | 是 | 建立時間 |
| 審核者 | `reviewedBy` | `string` | 否 | 核定角色 |
| 審核時間 | `reviewedAt` | `datetime` | 否 | 核定時間 |

## 關聯約束

### 1. 檔案與批次

- 一個 `匯入批次` 可包含多個 `來源檔案`
- 一個 `來源檔案` 只屬於一個 `匯入批次`

### 2. 解析與映射

- 一個 `解析結果行` 最多對應一筆當前有效的 `映射結果行`
- 若人工重做映射，應保留歷史審計，不直接覆寫掉責任鏈

### 3. 例外與決議

- 一個 `例外事件` 可有零或一筆最終 `單批處理決議`
- 若需重新處理，應以新決議事件或審計紀錄追加，不抹除原決議

### 4. 例外與提案

- 一筆例外事件可轉成：
  - 零或一筆 `映射規則提案`
  - 零或一筆 `新商品提案`
- 不得在沒有來源例外或明確人工建立原因下憑空生成提案

## 與既有文件的關係

- `transaction_working_entity_dictionary.md` 定義實體語意與 owner
- 本文件定義實作層欄位與關聯細節
- `channel_intake_state_machine.md` 會補上各實體的狀態欄位允許值與轉移規則
- `channel_intake_api_contract.md` 會補上對外 API payload 與 endpoint

## 關聯文件

- `doc/architecture/data/transaction_working_entity_dictionary.md`
- `doc/architecture/flows/channel_intake_parser_contract.md`
- `doc/architecture/data/channel_product_mapping_governance.md`
- `doc/architecture/flows/channel_intake_exception_resolution_spec.md`
- `doc/architecture/flows/channel_intake_state_machine.md`
- `doc/architecture/flows/channel_intake_api_contract.md`