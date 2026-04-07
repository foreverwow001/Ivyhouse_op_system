# 盤點與差異 API / DTO / Response 草案

更新日期：2026-04-01

Authoritative source：否（draft）

## 目的

本文件把 `inventory_count_adjustment_and_negative_stock_policy.md` 與 `inventory_variance_auto_calculation_spec.md` 往下落成 Phase 1 API / DTO / response 草案，作為後續 NestJS controller、response DTO、read model 與前後端整合的接口基線。

本版聚焦以下能力：

1. 建立盤點 session
2. 完成盤點 session 並自動產生差異調整事件
3. 建立手動調整事件
4. 查詢盤點 session 摘要與 line 明細
5. 查詢單一 SKU 的最近盤點摘要與 7 天 / 30 天滾動誤差指標
6. 查詢負庫存提醒與盤點提醒

## API 設計原則

### 1. 建立 / 完成 / 查詢分離

- `create session`、`complete session`、`manual adjustment` 都是不同責任節點
- 不把建立盤點與完成盤點包成同一個 endpoint

### 2. 差異衍生欄位走 response DTO

- Phase 1 先不新增 migration
- `differenceQty`、`errorPct`、`varianceDirection`、`zeroBaselineFlag`、`weightedErrorPct` 由 service / read model / response DTO 提供

### 3. 庫存主單位先正規化，再回傳差異

- request 可接受盤點當下輸入數量
- 實際差異欄位一律以 `庫存主單位` 語意回傳
- 若前端要顯示輔助單位，應額外顯示 `displayUnit` 或 `countInputUnit`，不能覆寫主計算欄位

### 4. Zero Baseline 必須顯式表達

- 不允許前端自己用 `beforeQty === 0` 臨時推導
- API 要直接回傳 `zeroBaselineFlag` 與 `varianceDirection = ZERO_BASELINE`

## 權限角色基線

本版先沿用目前文檔已知日常營運角色：

- `生產`
- `包裝`
- `會計`
- `主管`

其中：

- 建立與完成盤點：`生產 / 包裝 / 會計 / 主管`
- 手動調整：至少 `會計 / 主管`，或具等價覆核權限角色
- 差異摘要 / 提醒查詢：`生產 / 包裝 / 會計 / 主管`

Idx-021 第一個正式切片補充：

- `create session`、`complete session` 與 `manual adjustment` 的正式身份來源改為 Portal session principal。
- request headers 至少應提供：`x-portal-principal-id`、`x-portal-session-id`、`x-portal-role-codes`；可選補 `x-portal-display-name`、`x-portal-auth-source`。
- `create session` 允許角色：`生產 / 包裝 / 會計 / 主管`。
- `complete session` 與 `manual adjustment` 已收斂到 `主管` approval 邊界。
- 若同一 principal 同時承擔 maker 與 approver，response 與 persistence 必須留下 `singlePersonOverride` 或等價標記。

Phase 1 補充業務規則：

- `create session` 允許角色：`生產 / 包裝 / 會計 / 主管`。
- `cancel session` 與 `complete session` 只允許 `主管`。
- Phase 1 opening balance 目前只有單一倉別，因此不同 `countScope` 也不得平行存在 `IN_PROGRESS` session；若已有任何進行中的盤點窗口，API 應回傳拒絕。
- 同一 `countScope` 不得同時存在兩筆 `IN_PROGRESS` session；若尚未完成第一筆 session，API 應回傳拒絕。
- 首盤中斷一律不支援 resume；必須 `cancel` 後重新建立新 session。
- 已取消 session 不得參與差異歷史、滾動統計或 ledger 事件產生。

## Endpoint 一覽

| 方法 | 路徑 | 用途 |
|------|------|------|
| `POST` | `/api/daily-ops/inventory-counts` | 建立盤點 session |
| `POST` | `/api/daily-ops/inventory-counts/{sessionId}/cancel` | 取消進行中的盤點 session |
| `GET` | `/api/daily-ops/inventory-counts/{sessionId}` | 查詢盤點 session 摘要 |
| `GET` | `/api/daily-ops/inventory-counts/{sessionId}/lines` | 查詢盤點 line 明細 |
| `POST` | `/api/daily-ops/inventory-counts/{sessionId}/complete` | 完成盤點 session |
| `POST` | `/api/daily-ops/inventory-adjustments` | 建立手動調整事件 |
| `GET` | `/api/daily-ops/inventory-variance/items/{bucketType}/{itemSku}` | 查詢單一 SKU 最近盤點摘要 |
| `GET` | `/api/daily-ops/inventory-variance/items/{bucketType}/{itemSku}/history` | 查詢單一 SKU 歷史盤點結果 |
| `GET` | `/api/daily-ops/inventory-alerts/negative-stock` | 查詢負庫存提醒 |
| `GET` | `/api/daily-ops/inventory-alerts/count-reminder` | 查詢盤點提醒 |

## 列舉值基線

### `CountScope`

- `DAILY_OPS`
- `PACKAGING_MATERIAL`
- `SHIPPING_SUPPLY`
- `FULL_WAREHOUSE`

### `InventoryBucketType`

- `SELLABLE`
- `INNER_PACK_FINISHED`
- `PACKAGING_MATERIAL`
- `SHIPPING_SUPPLY_MANUAL`

### `InventoryCountSessionStatus`

- `DRAFT`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

### `AdjustmentSourceType`

- `COUNT_SESSION`
- `MANUAL`
- `REPLENISHMENT`

### `VarianceDirection`

- `MATCHED`
- `OVER`
- `SHORT`
- `ZERO_BASELINE`

## 1. 建立盤點 Session

### `POST /api/daily-ops/inventory-counts`

用途：建立盤點 session 與 line 初始資料。

Request DTO：`CreateInventoryCountRequestDto`

```ts
interface CreateInventoryCountRequestDto {
  countScope: 'DAILY_OPS' | 'PACKAGING_MATERIAL' | 'SHIPPING_SUPPLY' | 'FULL_WAREHOUSE';
  lines: Array<{
    bucketType: 'SELLABLE' | 'INNER_PACK_FINISHED' | 'PACKAGING_MATERIAL' | 'SHIPPING_SUPPLY_MANUAL';
    itemSku: string;
    beforeQty: number;
    countedQty: number;
    note?: string;
  }>;
}
```

Request body 範例：

```json
{
  "countScope": "PACKAGING_MATERIAL",
  "lines": [
    {
      "bucketType": "PACKAGING_MATERIAL",
      "itemSku": "PK0038",
      "beforeQty": 1.5,
      "countedQty": 1,
      "note": "開卷後剩餘量重估"
    },
    {
      "bucketType": "PACKAGING_MATERIAL",
      "itemSku": "PK0039",
      "beforeQty": 0,
      "countedQty": 0.25
    }
  ]
}
```

Response DTO：`InventoryCountSessionResponseDto`

```ts
interface InventoryCountSessionResponseDto {
  sessionId: string;
  countScope: CountScope;
  status: 'IN_PROGRESS';
  performedBy: string;
  startedAt: string;
  cancelledAt: string | null;
  cancelledByPrincipalId: string | null;
  cancelReason: string | null;
  completedAt: string | null;
  completedByPrincipalId: string | null;
  lineCount: number;
  summary: InventoryVarianceSummaryDto;
  completionApproval: {
    status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
    approverPrincipalId: string | null;
    approvedAt: string | null;
    singlePersonOverride: boolean;
  } | null;
  lines: InventoryCountLineResponseDto[];
}
```

## 1.5 取消盤點 Session

### `POST /api/daily-ops/inventory-counts/{sessionId}/cancel`

用途：取消進行中的 opening balance / 盤點 session，解除窗口鎖定，並要求以新 session 重開。

Request DTO：`CancelInventoryCountDto`

```ts
interface CancelInventoryCountDto {
  reason: string;
}
```

業務規則：

1. 只允許 `IN_PROGRESS` session 被取消。
2. 只允許 `主管` 執行取消。
3. `reason` 必填。
4. 已取消 session 不得產生調整事件或 ledger 寫入。
5. 已取消 session 不得出現在 variance history / rolling metrics 中。

`summary` 與 `lines` 欄位見下方共用 DTO。

業務規則：

1. `itemSku` 必須先通過正式主檔存在性檢查
2. `beforeQty` 與 `countedQty` 以該 SKU 的庫存主單位語意儲存
3. `variancePct` 若 `beforeQty = 0` 且 `countedQty != 0`，response 應回傳 `null`
4. 建立當下即可回傳衍生欄位，不必等到 session 完成

## 2. 查詢盤點 Session 摘要

### `GET /api/daily-ops/inventory-counts/{sessionId}`

用途：查詢 session header 與 summary，不強制回全部 line。

Response 範例：

```json
{
  "sessionId": "ics_01JZ...",
  "countScope": "PACKAGING_MATERIAL",
  "status": "IN_PROGRESS",
  "performedBy": "u-finance-001",
  "startedAt": "2026-04-01T09:00:00+08:00",
  "completedAt": null,
  "lineCount": 24,
  "summary": {
    "matchedLineCount": 18,
    "varianceLineCount": 6,
    "zeroBaselineLineCount": 1,
    "totalAbsDifferenceQty": 3.5,
    "weightedErrorPct": 4.21
  }
}
```

## 3. 查詢盤點 Line 明細

### `GET /api/daily-ops/inventory-counts/{sessionId}/lines`

Query params：

- `bucketType`
- `varianceOnly`
- `page`
- `pageSize`

Response DTO：`InventoryCountLineListResponseDto`

```ts
interface InventoryCountLineListResponseDto {
  items: InventoryCountLineResponseDto[];
  page: number;
  pageSize: number;
  total: number;
}
```

`InventoryCountLineResponseDto`：

```ts
interface InventoryCountLineResponseDto {
  lineId: string;
  sessionId: string;
  bucketType: InventoryBucketType;
  itemSku: string;
  itemName: string;
  inventoryPrimaryUnit: string;
  beforeQty: number;
  countedQty: number;
  differenceQty: number;
  variancePct: number | null;
  errorPct: number | null;
  varianceDirection: 'MATCHED' | 'OVER' | 'SHORT' | 'ZERO_BASELINE';
  zeroBaselineFlag: boolean;
  note: string | null;
  countedAt: string | null;
  countScope: CountScope;
}
```

Response 範例：

```json
{
  "items": [
    {
      "lineId": "icl_01JZ...",
      "sessionId": "ics_01JZ...",
      "bucketType": "PACKAGING_MATERIAL",
      "itemSku": "PK0038",
      "itemName": "膠捲500m - 紅色",
      "inventoryPrimaryUnit": "卷",
      "beforeQty": 1.5,
      "countedQty": 1,
      "differenceQty": -0.5,
      "variancePct": -33.33,
      "errorPct": 33.33,
      "varianceDirection": "SHORT",
      "zeroBaselineFlag": false,
      "note": "開卷後剩餘量重估",
      "countedAt": null,
      "countScope": "PACKAGING_MATERIAL"
    },
    {
      "lineId": "icl_01KA...",
      "sessionId": "ics_01JZ...",
      "bucketType": "PACKAGING_MATERIAL",
      "itemSku": "PK0039",
      "itemName": "膠捲230m - 紅色",
      "inventoryPrimaryUnit": "卷",
      "beforeQty": 0,
      "countedQty": 0.25,
      "differenceQty": 0.25,
      "variancePct": null,
      "errorPct": null,
      "varianceDirection": "ZERO_BASELINE",
      "zeroBaselineFlag": true,
      "note": null,
      "countedAt": null,
      "countScope": "PACKAGING_MATERIAL"
    }
  ],
  "page": 1,
  "pageSize": 50,
  "total": 2
}
```

業務規則：

1. `differenceQty = countedQty - beforeQty`
2. `errorPct` 只看幅度，不保留方向
3. `varianceOnly = true` 時，只回 `differenceQty != 0` 的 line
4. `itemName` 與 `inventoryPrimaryUnit` 應由主檔查詢層補入，不由前端拼裝

## 4. 完成盤點 Session

### `POST /api/daily-ops/inventory-counts/{sessionId}/complete`

用途：完成 session，對有差異的 line 自動建立 `COUNT_SESSION` 調整事件。

Request DTO：`CompleteInventoryCountRequestDto`

```ts
interface CompleteInventoryCountRequestDto {
}
```

Response DTO：`CompleteInventoryCountResponseDto`

```ts
interface CompleteInventoryCountResponseDto {
  session: InventoryCountSessionResponseDto;
  adjustments: InventoryAdjustmentResponseDto[];
}
```

`InventoryAdjustmentResponseDto`：

```ts
interface InventoryAdjustmentResponseDto {
  adjustmentId: string;
  sourceType: 'COUNT_SESSION' | 'MANUAL' | 'REPLENISHMENT';
  sourceSessionId: string | null;
  bucketType: InventoryBucketType;
  itemSku: string;
  itemName: string;
  qtyDelta: number;
  reason: string | null;
  performedBy: string;
  performedAt: string;
  approval: {
    status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
    approverPrincipalId: string | null;
    approvedAt: string | null;
    singlePersonOverride: boolean;
  } | null;
}
```

Response 範例：

```json
{
  "session": {
    "sessionId": "ics_01JZ...",
    "countScope": "PACKAGING_MATERIAL",
    "status": "COMPLETED",
    "performedBy": "u-finance-001",
    "startedAt": "2026-04-01T09:00:00+08:00",
    "completedAt": "2026-04-01T09:18:00+08:00",
    "completedByPrincipalId": "u-supervisor-001",
    "lineCount": 24,
    "completionApproval": {
      "status": "APPROVED",
      "approverPrincipalId": "u-supervisor-001",
      "approvedAt": "2026-04-01T09:18:00+08:00",
      "singlePersonOverride": false
    },
    "summary": {
      "matchedLineCount": 18,
      "varianceLineCount": 6,
      "zeroBaselineLineCount": 1,
      "totalAbsDifferenceQty": 3.5,
      "weightedErrorPct": 4.21
    },
    "lines": []
  },
  "adjustments": [
    {
      "adjustmentId": "iad_01JZ...",
      "sourceType": "COUNT_SESSION",
      "sourceSessionId": "ics_01JZ...",
      "bucketType": "PACKAGING_MATERIAL",
      "itemSku": "PK0038",
      "itemName": "膠捲500m - 紅色",
      "qtyDelta": -0.5,
      "reason": "盤點完成自動產生差異調整事件",
      "performedBy": "u-finance-001",
      "performedAt": "2026-04-01T09:18:00+08:00",
      "approval": {
        "status": "APPROVED",
        "approverPrincipalId": "u-supervisor-001",
        "approvedAt": "2026-04-01T09:18:00+08:00",
        "singlePersonOverride": false
      }
    }
  ]
}
```

業務規則：

1. 只有 `beforeQty != countedQty` 的 line 會建立 adjustment
2. `qtyDelta` 一律等於 `differenceQty`
3. ledger 事件類型沿用既有 `COUNT_ADJUSTMENT`
4. audit payload 至少要保留 `sessionId`、`adjustmentCount`、`performedBy` 與 principal snapshot / approval summary

## 5. 建立手動調整事件

### `POST /api/daily-ops/inventory-adjustments`

用途：建立非盤點觸發的手動調整。

Request DTO：`CreateInventoryAdjustmentRequestDto`

```ts
interface CreateInventoryAdjustmentRequestDto {
  sourceType: 'COUNT_SESSION' | 'MANUAL' | 'REPLENISHMENT';
  sourceSessionId?: string;
  bucketType: InventoryBucketType;
  itemSku: string;
  qtyDelta: number;
  reason?: string;
}
```

業務規則：

1. 若 `sourceType = MANUAL`，`reason` 必填
2. `qtyDelta > 0` 代表盤盈 / 補正入庫，`qtyDelta < 0` 代表盤虧 / 補正出庫
3. 手動調整與盤點完成自動調整必須保留不同 `sourceType`

## 6. 查詢單一 SKU 最近盤點摘要

### `GET /api/daily-ops/inventory-variance/items/{bucketType}/{itemSku}`

用途：提供原料頁、半成品頁、包材頁共用的最近盤點摘要卡片。

Response DTO：`InventoryItemVarianceSummaryResponseDto`

```ts
interface InventoryItemVarianceSummaryResponseDto {
  bucketType: InventoryBucketType;
  itemSku: string;
  itemName: string;
  inventoryPrimaryUnit: string;
  latestCount: {
    sessionId: string;
    countScope: CountScope;
    countedAt: string;
    beforeQty: number;
    countedQty: number;
    differenceQty: number;
    variancePct: number | null;
    errorPct: number | null;
    varianceDirection: 'MATCHED' | 'OVER' | 'SHORT' | 'ZERO_BASELINE';
    zeroBaselineFlag: boolean;
  } | null;
  rollingMetrics: {
    last7Days: InventoryRollingMetricDto;
    last30Days: InventoryRollingMetricDto;
  };
  uiHints: {
    showZeroBaselineHint: boolean;
    showSemiFinishedVarianceDisclaimer: boolean;
    varianceDisclaimer: string | null;
  };
}
```

`InventoryRollingMetricDto`：

```ts
interface InventoryRollingMetricDto {
  countSessionCount: number;
  totalAbsDifferenceQty: number;
  weightedErrorPct: number | null;
  zeroBaselineCount: number;
  lastCountedAt: string | null;
}
```

Response 範例：

```json
{
  "bucketType": "INNER_PACK_FINISHED",
  "itemSku": "SF0002",
  "itemName": "熟塔皮",
  "inventoryPrimaryUnit": "片",
  "latestCount": {
    "sessionId": "ics_01KB...",
    "countScope": "DAILY_OPS",
    "countedAt": "2026-04-01T18:05:00+08:00",
    "beforeQty": 380,
    "countedQty": 365,
    "differenceQty": -15,
    "variancePct": -3.95,
    "errorPct": 3.95,
    "varianceDirection": "SHORT",
    "zeroBaselineFlag": false
  },
  "rollingMetrics": {
    "last7Days": {
      "countSessionCount": 5,
      "totalAbsDifferenceQty": 32,
      "weightedErrorPct": 2.84,
      "zeroBaselineCount": 0,
      "lastCountedAt": "2026-04-01T18:05:00+08:00"
    },
    "last30Days": {
      "countSessionCount": 11,
      "totalAbsDifferenceQty": 77,
      "weightedErrorPct": 3.12,
      "zeroBaselineCount": 0,
      "lastCountedAt": "2026-04-01T18:05:00+08:00"
    }
  },
  "uiHints": {
    "showZeroBaselineHint": false,
    "showSemiFinishedVarianceDisclaimer": true,
    "varianceDisclaimer": "本差異率為庫存差異，不代表固定耗損率"
  }
}
```

業務規則：

1. `SF0002 熟塔皮` 與其他轉製型半成品，`showSemiFinishedVarianceDisclaimer = true`
2. `weightedErrorPct` 若期間內全部都是 `beforeQty = 0`，回傳 `null`
3. 原料頁、半成品頁、包材頁必須共用此 DTO 語意，不得各自發明欄位

## 7. 查詢單一 SKU 歷史盤點結果

### `GET /api/daily-ops/inventory-variance/items/{bucketType}/{itemSku}/history`

Query params：

- `from`
- `to`
- `page`
- `pageSize`

Response DTO：

```ts
interface InventoryItemVarianceHistoryResponseDto {
  items: Array<{
    sessionId: string;
    lineId: string;
    countScope: CountScope;
    countedAt: string;
    beforeQty: number;
    countedQty: number;
    differenceQty: number;
    variancePct: number | null;
    errorPct: number | null;
    varianceDirection: 'MATCHED' | 'OVER' | 'SHORT' | 'ZERO_BASELINE';
    zeroBaselineFlag: boolean;
    note: string | null;
    performedBy: string;
  }>;
  page: number;
  pageSize: number;
  total: number;
}
```

用途：提供 item detail page、variance drill-down 與未來 dashboard 明細抽屜共用。

## 8. 共用 Summary DTO

```ts
interface InventoryVarianceSummaryDto {
  matchedLineCount: number;
  varianceLineCount: number;
  zeroBaselineLineCount: number;
  totalAbsDifferenceQty: number;
  weightedErrorPct: number | null;
}
```

## 9. 負庫存提醒與盤點提醒

### `GET /api/daily-ops/inventory-alerts/negative-stock`

本版沿用現有 endpoint，但回傳格式應收斂為：

```ts
interface NegativeStockAlertResponseDto {
  bucketType: InventoryBucketType;
  itemSku: string;
  itemName: string;
  currentQty: number;
  inventoryPrimaryUnit: string;
  lastLedgerAt: string | null;
  alertReason: string;
}
```

### `GET /api/daily-ops/inventory-alerts/count-reminder`

本版沿用現有 endpoint，但回傳格式應收斂為：

```ts
interface CountReminderResponseDto {
  countScope: CountScope;
  sessionId: string | null;
  status: string;
  startedAt: string | null;
  lastCompletedAt: string | null;
  reminderReason: string;
}
```

## rounding 規則

1. `differenceQty` 依主單位規則保留到小數第 3 位
2. `variancePct`、`errorPct`、`weightedErrorPct` 一律四捨五入到小數第 2 位
3. `null` 與 `0` 不得混用

## 工程落點

### 現有程式已具備的最小基線

1. `POST /inventory-counts`
2. `POST /inventory-counts/{sessionId}/complete`
3. `POST /inventory-adjustments`
4. `GET /inventory-alerts/negative-stock`
5. `GET /inventory-alerts/count-reminder`
6. `InventoryCountLine.beforeQty`
7. `InventoryCountLine.countedQty`
8. `InventoryCountLine.variancePct`
9. `InventoryAdjustmentEvent.qtyDelta`

### Phase 1 建議直接補的項目

1. `GET /inventory-counts/{sessionId}`
2. `GET /inventory-counts/{sessionId}/lines`
3. `GET /inventory-variance/items/{bucketType}/{itemSku}`
4. `GET /inventory-variance/items/{bucketType}/{itemSku}/history`
5. response DTO mapping layer
6. `itemName` / `inventoryPrimaryUnit` 補值查詢

### Phase 1 不建議先做的項目

1. 不先加 `differenceQty`、`errorPct`、`weightedErrorPct` schema 欄位
2. 不先做 summary table 或 materialized view
3. 不先把熟塔皮差異率直接當 yield KPI

## 驗收條件

本草案後續若進入實作，至少要滿足：

1. `create session` response 與 `line list` response 對同一筆 line 算出的 `differenceQty / variancePct / errorPct` 一致
2. `complete session` 回傳的 adjustment `qtyDelta` 必須等於 line `differenceQty`
3. `beforeQty = 0` 且 `countedQty != 0` 時，`variancePct = null`、`errorPct = null`、`varianceDirection = ZERO_BASELINE`
4. 原料、半成品、包材三個頁面使用相同欄位語意
5. 熟塔皮頁面必須顯示「庫存差異不代表固定耗損率」提示
