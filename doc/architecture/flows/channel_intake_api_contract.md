# Channel Intake API Contract

更新日期：2026-03-29

Authoritative source：否（draft）

## 目的

本文件把 Intake / Mapping / Exception 三份 spec 往下落成 Phase 1 API contract 草案，作為後續 NestJS controller、DTO、權限與前後端整合的接口基線。

本版採 REST 風格草案，聚焦以下能力：

1. 建立匯入批次
2. 上傳來源檔案
3. 觸發解析
4. 查詢解析與映射結果
5. 處理例外
6. 建立治理提案
7. 正式確認批次

## API 設計原則

### 1. parser / mapping / exception 分段暴露

- 不把所有處理包成單一黑箱 endpoint
- 需保留中間結果查詢與人工介入點

### 2. 正式確認單獨 endpoint

- `confirm` 屬高風險節點
- 不得與 `create batch` 或 `resolve exception` 混成同一動作

### 3. 單批接受與永久治理分離

- 單批接受走 exception resolution API
- 永久規則變更走 proposal API

## 權限角色基線

本版先沿用目前文檔已知角色：

- `行政`
- `會計`
- `主管`
- `主資料治理角色`

其中：

- intake 與單批決議由 `行政 / 會計 / 主管` 可操作
- 提案審核與正式發布屬 `主資料治理角色`

## Endpoint 一覽

| 方法 | 路徑 | 用途 |
|------|------|------|
| `POST` | `/api/intake/batches` | 建立匯入批次 |
| `POST` | `/api/intake/batches/{batchId}/source-files` | 上傳來源檔案 |
| `POST` | `/api/intake/batches/{batchId}/parse` | 觸發解析 |
| `GET` | `/api/intake/batches/{batchId}` | 查詢批次摘要 |
| `GET` | `/api/intake/batches/{batchId}/parsed-lines` | 查詢解析結果 |
| `GET` | `/api/intake/batches/{batchId}/mapping-results` | 查詢 bootstrap 映射結果 |
| `POST` | `/api/intake/batches/{batchId}/mapping/review` | 提交映射覆核 / 人工指定 |
| `GET` | `/api/intake/batches/{batchId}/exceptions` | 查詢例外佇列 |
| `POST` | `/api/intake/exceptions/{exceptionId}/resolve` | 單批處理例外 |
| `POST` | `/api/intake/mapping-rule-proposals` | 建立映射規則提案 |
| `POST` | `/api/intake/new-product-proposals` | 建立新商品提案 |
| `POST` | `/api/intake/batches/{batchId}/confirm` | 正式確認批次 |

## 1. 建立匯入批次

### `POST /api/intake/batches`

用途：建立 Intake 容器。

Request body：

```json
{
  "intakeTarget": "正式需求",
  "batchDate": "2026-03-29",
  "primaryChannelCode": "SHOPEE",
  "defaultDemandDate": "2026-03-29",
  "planningWindowId": null,
  "note": "下午批次"
}
```

Response：

```json
{
  "intakeBatchId": "uuid",
  "status": "草稿",
  "createdAt": "2026-03-29T10:00:00+08:00"
}
```

業務規則：

- `intakeTarget = 旺季試算` 時，`planningWindowId` 必填
- `intakeTarget = 正式需求` 時，`planningWindowId` 應為空白

## 2. 上傳來源檔案

### `POST /api/intake/batches/{batchId}/source-files`

用途：把 PDF / Excel 綁到既有批次。

Request：`multipart/form-data`

表單欄位：

- `file`
- `channelCode`
- `intakeTarget`

Response：

```json
{
  "sourceFileId": "uuid",
  "status": "已上傳",
  "channelCode": "ORANGEPOINT"
}
```

業務規則：

- `channelCode` 必須是正式渠道主資料已啟用值
- 同一檔案可重複上傳，但應保留新 `sourceFileId`

## 3. 觸發解析

### `POST /api/intake/batches/{batchId}/parse`

用途：對批次內檔案執行 parser。

Request body：

```json
{
  "sourceFileIds": ["uuid-1", "uuid-2"],
  "forceReparse": false
}
```

Response：

```json
{
  "batchId": "uuid",
  "status": "解析中"
}
```

業務規則：

- `forceReparse = true` 時必須保留前次解析審計
- 不得因重新解析而抹除既有責任鏈

## 4. 查詢批次摘要

### `GET /api/intake/batches/{batchId}`

Response：

```json
{
  "intakeBatchId": "uuid",
  "status": "待人工確認",
  "intakeTarget": "正式需求",
  "batchDate": "2026-03-29",
  "sourceFileCount": 3,
  "parsedLineCount": 124,
  "pendingReviewCount": 4,
  "unmappedCount": 2
}
```

## 5. 查詢解析結果

### `GET /api/intake/batches/{batchId}/parsed-lines`

Query params：

- `status`
- `channelCode`
- `parseKind`
- `page`
- `pageSize`

Response 範例：

```json
{
  "items": [
    {
      "parsedLineId": "uuid",
      "sourceRowRef": "Sheet1!Y18",
      "rawProductText": "試吃:艾薇-杏仁瓦片(原味)135g*1+艾薇-杏仁瓦片(巧克力)90g*1 98",
      "rawQuantity": 98,
      "parseKind": "試吃組合",
      "parseConfidence": "高",
      "status": "待映射"
    }
  ],
  "page": 1,
  "pageSize": 50,
  "total": 1
}
```

## 5.1 查詢 bootstrap 映射結果

### `GET /api/intake/batches/{batchId}/mapping-results`

Query params：

- `status`
- `channelCode`
- `page`
- `pageSize`

Response 範例：

```json
{
  "items": [
    {
      "mappingResultId": "uuid",
      "parsedLineId": "uuid",
      "mappingRuleCode": "COMMON_WAFER_FLAVOR",
      "matchedProductName": "瓦片-原味",
      "matchedSpec": "90g",
      "multiplier": 1,
      "mappedQuantity": 3,
      "mappingMethod": "規則命中",
      "mappingConfidence": "高",
      "mappingConfidenceScore": 0.9,
      "status": "已映射",
      "ruleHitSummary": "瓦片家族與口味關鍵字命中",
      "parsedLine": {
        "parsedLineId": "uuid",
        "channelCode": "MOMO",
        "sourceRowRef": "momo-撿貨單-1.pdf#row-3",
        "rawProductText": "經典杏仁瓦片-原味",
        "rawSpecText": "90g",
        "rawQuantity": 3,
        "parseKind": "普通列"
      }
    }
  ],
  "page": 1,
  "pageSize": 50,
  "total": 1
}
```

業務規則：

- 本 endpoint 屬 bootstrap mapping 輸出，目的在於讓 parser 結果可被覆核與比對
- 本版 `matchedProductName` / `matchedSpec` 可先代表命中語意；若正式 `sellableProductSku` 尚未接線，不得假裝已完成正式主資料綁定
- `提袋加購`、咖啡、贈品等 Ivyhouse 明定不可靜默忽略之項，應以顯式 `mappingResult` 顯示，即使狀態為 `待人工覆核`

## 6. 提交映射覆核 / 人工指定

### `POST /api/intake/batches/{batchId}/mapping/review`

用途：一次提交多筆映射覆核決策。

Request body：

```json
{
  "items": [
    {
      "parsedLineId": "uuid-1",
      "action": "acceptRuleMatch"
    },
    {
      "parsedLineId": "uuid-2",
      "action": "assignSku",
      "sellableProductSku": "PKG-BAG-001"
    },
    {
      "parsedLineId": "uuid-3",
      "action": "createException",
      "reason": "平台新名稱，待治理"
    }
  ]
}
```

Response：

```json
{
  "batchId": "uuid",
  "processed": 3,
  "createdExceptionCount": 1
}
```

業務規則：

- `assignSku` 僅作用於本批次，不代表永久規則更新
- 若為 `createException`，需同步建立 `intakeException`

## 7. 查詢例外佇列

### `GET /api/intake/batches/{batchId}/exceptions`

Query params：

- `exceptionType`
- `status`

Response：

```json
{
  "items": [
    {
      "intakeExceptionId": "uuid",
      "exceptionType": "未映射",
      "rawProductText": "提袋加購",
      "suggestedAction": "提報新商品",
      "status": "待處理"
    }
  ]
}
```

## 8. 單批處理例外

### `POST /api/intake/exceptions/{exceptionId}/resolve`

Request body：

```json
{
  "resolutionType": "單批接受",
  "resolvedSellableProductSku": "ADDON-BAG-001",
  "resolvedQuantity": 1,
  "resolutionReason": "本批次確認為正式加購品",
  "shouldPromote": true,
  "promoteTarget": "newProductProposal"
}
```

Response：

```json
{
  "intakeExceptionId": "uuid",
  "status": "單批已接受",
  "promotion": {
    "target": "newProductProposal",
    "created": true,
    "proposalId": "uuid"
  }
}
```

業務規則：

- `shouldPromote = true` 時，必須至少指定一個提案目標
- `單批接受` 與 `提案建立` 可同時成立，但語意必須分離

## 9. 建立映射規則提案

### `POST /api/intake/mapping-rule-proposals`

Request body：

```json
{
  "sourceExceptionId": "uuid",
  "channelCode": "SHOPEE",
  "rawProductPattern": "提袋加購",
  "rawSpecPattern": null,
  "proposedSellableProductSku": "ADDON-BAG-001",
  "proposalReason": "已連續三批出現，應轉正式規則"
}
```

Response：

```json
{
  "mappingRuleProposalId": "uuid",
  "status": "草稿"
}
```

## 10. 建立新商品提案

### `POST /api/intake/new-product-proposals`

Request body：

```json
{
  "sourceExceptionId": "uuid",
  "proposedProductName": "提袋加購",
  "proposedProductType": "加購品",
  "proposedSpecSummary": "單入提袋",
  "isBundleProduct": false,
  "proposedChannelScope": ["SHOPEE", "MOMO"]
}
```

Response：

```json
{
  "newProductProposalId": "uuid",
  "status": "草稿"
}
```

## 11. 正式確認批次

### `POST /api/intake/batches/{batchId}/confirm`

用途：把批次需求正式成立。

Request body：

```json
{
  "confirmationNote": "下午批次確認",
  "expectedExceptionCount": 0
}
```

Response：

```json
{
  "intakeBatchId": "uuid",
  "status": "已確認",
  "confirmedAt": "2026-03-29T15:30:00+08:00",
  "confirmedBy": "manager_01"
}
```

業務規則：

- 若仍存在 `待處理` 例外，不得確認
- `已確認` 後不得回退成 `草稿`
- 正式需求確認後，應可交付後續需求扣庫存 / 生產建議流程

## 錯誤回應基線

### 建議格式

```json
{
  "errorCode": "INTAKE_BATCH_HAS_OPEN_EXCEPTIONS",
  "message": "批次仍有待處理例外，無法確認",
  "details": {
    "openExceptionCount": 2
  }
}
```

### 建議錯誤碼

- `INTAKE_BATCH_NOT_FOUND`
- `SOURCE_FILE_NOT_FOUND`
- `CHANNEL_CODE_INVALID`
- `PARSER_PROFILE_NOT_SUPPORTED`
- `PARSED_LINE_NOT_FOUND`
- `MAPPING_RESULT_CONFLICT`
- `INTAKE_EXCEPTION_NOT_FOUND`
- `INTAKE_BATCH_HAS_OPEN_EXCEPTIONS`
- `INTAKE_BATCH_ALREADY_CONFIRMED`

## 非本版範圍

- 前端頁面設計
- WebSocket / 即時推播
- RBAC 細粒度 permission code
- 正式公開 API versioning 策略

這些應在後續 technical bootstrap 與 implementation plan 中再補。

## 關聯文件

- `doc/architecture/data/channel_intake_entity_field_contract.md`
- `doc/architecture/flows/channel_intake_state_machine.md`
- `doc/architecture/flows/channel_intake_parser_contract.md`
- `doc/architecture/data/channel_product_mapping_governance.md`
- `doc/architecture/flows/channel_intake_exception_resolution_spec.md`
- `doc/architecture/flows/intake_demand_aggregation_spec.md`
- `doc/architecture/flows/channel_intake_sample_acceptance_matrix.md`
- `doc/architecture/flows/channel_intake_golden_expected_output.md`