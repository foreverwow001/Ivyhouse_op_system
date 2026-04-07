# Channel Intake Sample Acceptance Matrix

更新日期：2026-03-29

Authoritative source：否（draft）

## 目的

本文件把目前已收集的真實樣本檔，轉成 Ivyhouse OP System Phase 1 的 sample-based 驗收矩陣，讓 MOMO、蝦皮、官網、橘點子四條 intake 可以直接對照真實樣本驗收，而不是只用口頭描述或 generic test case。

本文件的用途：

1. 作為 parser 驗收基準
2. 作為 mapping / exception 驗收基準
3. 作為後續 API、DTO、service implementation 的回歸測試依據
4. 作為 UAT / domain review 的共同檢查表

## 驗收原則

### 1. 樣本優先

- 驗收以目前 `apps/api/test/fixtures/intake-source-documents` 內的真實檔案為優先依據
- 若程式行為與真實樣本不符，應優先檢討 parser / mapping / exception contract，而不是先懷疑樣本

### 2. 不用虛構精準數字

- 本文件允許使用 `應大於 0`、`應存在至少一筆`、`應成功辨識代表性語法` 等驗收語句
- 未經正式逐檔標註前，不應在矩陣中虛構精準行數、筆數或頁數

### 3. 驗收分層

每個樣本至少要分四層驗收：

1. 檔案接收與渠道辨識
2. parser 結構化輸出
3. mapping / exception 行為
4. 批次確認前置條件

## 樣本盤點

### MOMO / MO店+

- [momo-撿貨單-1.pdf](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/momo-撿貨單-1.pdf)
- [momo-撿貨單-2.pdf](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/momo-撿貨單-2.pdf)
- [momo-撿貨單-3.pdf](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/momo-撿貨單-3.pdf)
- [momo-撿貨單-4.pdf](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/momo-撿貨單-4.pdf)
- [momo-撿貨單-5.pdf](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/momo-撿貨單-5.pdf)
- [momo-撿貨單-6.pdf](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/momo-撿貨單-6.pdf)
- [momo-撿貨單-7.pdf](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/momo-撿貨單-7.pdf)

### 蝦皮

- [蝦皮-撿貨單-1.pdf](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/蝦皮-撿貨單-1.pdf)
- [蝦皮-撿貨單-2.pdf](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/蝦皮-撿貨單-2.pdf)
- [蝦皮-撿貨單-3.pdf](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/蝦皮-撿貨單-3.pdf)

### 官網

- [官網-撿貨單-1.xlsx](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/官網-撿貨單-1.xlsx)
- [官網-撿貨單-2.xlsx](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/官網-撿貨單-2.xlsx)
- [官網-撿貨單-3.xlsx](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/官網-撿貨單-3.xlsx)

### 橘點子

- [橘點子-0318到貨撿貨單.xls](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/橘點子-0318到貨撿貨單.xls)
- [橘點子-0319到貨撿貨單.xls](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/橘點子-0319到貨撿貨單.xls)
- [橘點子-0320到貨撿貨單.xls](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/橘點子-0320到貨撿貨單.xls)
- [橘點子-0325到貨撿貨單.xls](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/橘點子-0325到貨撿貨單.xls)
- [橘點子-0326到貨撿貨單.xls](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/橘點子-0326到貨撿貨單.xls)

## 共通驗收欄位

| 驗收面向 | 最低要求 |
|----------|----------|
| 檔案接收 | 檔案可被 intake API 接收並建立 `sourceFile` |
| 渠道辨識 | 系統能辨識正確渠道或由批次指定渠道正確套用 parser profile |
| parser 輸出 | 至少產生一筆 `parsedLine` 或明確例外，不得靜默成功但無結果 |
| 原始保留 | `rawProductText`、`rawQuantity`、`sourceRowRef` 應可追溯 |
| mapping 行為 | 已知商品應可映射；未知商品應進 exception queue |
| confirm 前置 | 尚有未處理例外時不得確認批次 |

## 渠道驗收矩陣

### A. MOMO / MO店+

| 測試ID | 樣本範圍 | 驗收目標 | 驗收條件 |
|--------|----------|----------|----------|
| `MOMO-AC-001` | 全部 7 份 PDF | 渠道辨識 | 系統應辨識為 `MOMO` 或等價正式渠道代碼，不得誤判為蝦皮 |
| `MOMO-AC-002` | 全部 7 份 PDF | 表格解析 | 應能抽出 `商品名稱 / 規格 / 出貨數量` 對應的結構化結果 |
| `MOMO-AC-003` | 具多包組語意的樣本 | 倍數保留 | `10入x2袋`、`3包-共30入` 這類語意應保留到 `rawSpecText` 或 `parserMeta`，不得在 parser 階段丟失 |
| `MOMO-AC-004` | 含 `活動專用` 樣本 | 特殊規格保留 | `活動專用` 應被保留供 mapping 層判讀，不得被 parser 直接濾掉 |
| `MOMO-AC-005` | 全部 7 份 PDF | 例外處理 | 若某列無法映射，應建立 exception，不得直接略過 |

#### MOMO 代表性驗收重點

- 至少一份樣本需覆蓋多頁 PDF 情境
- 至少一份樣本需覆蓋 `活動專用`
- 至少一份樣本需覆蓋 `xN` 或 `幾包組`

### B. 蝦皮

| 測試ID | 樣本範圍 | 驗收目標 | 驗收條件 |
|--------|----------|----------|----------|
| `SHOPEE-AC-001` | 全部 3 份 PDF | 渠道辨識 | 系統應辨識為 `SHOPEE`，不得被 `MO店+` 規則誤吸收成 MOMO |
| `SHOPEE-AC-002` | 全部 3 份 PDF | PDF 表格解析 | 應成功抽出 `商品名稱 / 規格 / 出貨數量` |
| `SHOPEE-AC-003` | 含加購與咖啡相關樣本 | 不得靜默過濾 | `提袋加購` 與非 `咖啡小花` 咖啡品項，不得在 parser 或 mapping 預設被直接丟棄 |
| `SHOPEE-AC-004` | 含禮盒 / 活動價 / 單顆類樣本 | mapping 前原始保留 | 活動文案、禮盒名稱與單顆語意應保留供 mapping 使用 |
| `SHOPEE-AC-005` | 全部 3 份 PDF | 例外進隊列 | 未建檔或未映射商品應進 exception queue |

#### 蝦皮 代表性驗收重點

- 至少一份樣本需覆蓋 `提袋加購`
- 至少一份樣本需覆蓋咖啡相關品項
- 至少一份樣本需覆蓋禮盒或活動文案

### C. 官網

| 測試ID | 樣本範圍 | 驗收目標 | 驗收條件 |
|--------|----------|----------|----------|
| `OFFICIAL-AC-001` | 全部 3 份 XLSX | 渠道辨識 | 應辨識為 `OFFICIAL` 或等價正式渠道代碼 |
| `OFFICIAL-AC-002` | 全部 3 份 XLSX | metadata + header 偵測 | 應能跨過前置 metadata，正確找到 `商品名稱 / 規格 / 數量` header row |
| `OFFICIAL-AC-003` | 全部 3 份 XLSX | 結構化輸出 | 應建立 `parsedLine`，且 `sourceRowRef` 能追到實際 sheet row |
| `OFFICIAL-AC-004` | 全部 3 份 XLSX | row offset 韌性 | 不應只因固定 row offset 改變就整批失敗；應以 header 偵測優先 |
| `OFFICIAL-AC-005` | 全部 3 份 XLSX | 批次確認前置 | 若有未映射商品，批次需停在 `例外處理中` 或 `待人工確認`，不得直接 `已確認` |

#### 官網代表性驗收重點

- 至少一份樣本需覆蓋 `建表日期`
- 三份樣本都應成功跨過 metadata 區

### D. 橘點子

| 測試ID | 樣本範圍 | 驗收目標 | 驗收條件 |
|--------|----------|----------|----------|
| `ORANGEPOINT-AC-001` | 全部 5 份 XLS | 檔案接收 | 現行 `.xls` 樣本應可直接匯入，不得預設視為壞檔 |
| `ORANGEPOINT-AC-002` | 全部 5 份 XLS | 矩陣式 cell-scan | 系統應能從矩陣式版面掃描出商品與數量，不要求逐列明細格式 |
| `ORANGEPOINT-AC-003` | 含 `贈送量`、`補寄量` 樣本 | 正式需求保留 | 這些列若被 parser 識別為有效需求，不得被靜默丟棄 |
| `ORANGEPOINT-AC-004` | [橘點子-0326到貨撿貨單.xls](/workspaces/Ivyhouse_op_system/apps/api/test/fixtures/intake-source-documents/橘點子-0326到貨撿貨單.xls) | `試吃:` grammar | `試吃:商品A*1+商品B*1 98` 應被解析為兩筆子品項需求，且各自需求量為 98 |
| `ORANGEPOINT-AC-005` | 含 `贈品:` 樣本 | 特殊語法支援 | `贈品:` 應能進入結構化輸出，不得在 parser 層靜默略過 |
| `ORANGEPOINT-AC-006` | 全部 5 份 XLS | mapping / exception 行為 | 已知商品應可映射；未知商品應進 exception queue |

#### 橘點子代表性驗收重點

- 至少一份樣本需覆蓋 `試吃:`
- 至少一份樣本需覆蓋 `贈送量` 或 `補寄量`
- 至少一份樣本需覆蓋 `贈品:`

## API 驗收矩陣

### 建議最小 API 驗收組合

| 測試ID | Endpoint | 驗收條件 |
|--------|----------|----------|
| `API-AC-001` | `POST /api/intake/batches` | 可建立 `正式需求` 批次與 `旺季試算` 批次 |
| `API-AC-002` | `POST /api/intake/batches/{batchId}/source-files` | 可成功上傳四類渠道真實樣本 |
| `API-AC-003` | `POST /api/intake/batches/{batchId}/parse` | 可觸發解析，並把結果反映到批次摘要 |
| `API-AC-004` | `GET /api/intake/batches/{batchId}/parsed-lines` | 可查到 `rawProductText`、`rawQuantity`、`parseKind`、`sourceRowRef` |
| `API-AC-005` | `POST /api/intake/batches/{batchId}/mapping/review` | 可對未映射列做人工指定或建立 exception |
| `API-AC-006` | `GET /api/intake/batches/{batchId}/exceptions` | 可查到 `未映射`、`低信心解析` 等例外 |
| `API-AC-007` | `POST /api/intake/exceptions/{exceptionId}/resolve` | 可做 `單批接受` 並選擇是否升級提案 |
| `API-AC-008` | `POST /api/intake/batches/{batchId}/confirm` | 若仍有 `待處理` 例外，應拒絕確認 |

## 執行方式

### 1. 開發驗收

- 以真實樣本建立固定 regression fixture
- 每次 parser / mapping / DTO 變更都跑一次四渠道矩陣

### 2. UAT 驗收

- 由業務使用者抽查四渠道至少各一份代表樣本
- 對照本矩陣確認 parser、mapping、exception 與 confirm 前置條件

### 3. 發版前最低門檻

- 四條渠道都至少有一份真實樣本跑通
- `試吃:`、`提袋加購` / 咖啡、官網 metadata、MOMO 倍數規格四種代表場景都必須被覆蓋

## 待補第二版

- 逐檔標出正式 `golden expected output`
- 每個樣本對應的 `parsedLine` 預期筆數
- 每個樣本對應的 `mappingResult` 預期摘要
- 每個樣本對應的 `exception` 預期數
- 對接自動化測試指令與 fixture loader

目前已補第一版逐檔 golden 摘要：

- `doc/architecture/flows/channel_intake_golden_expected_output.md`

## 關聯文件

- `doc/architecture/flows/channel_intake_parser_contract.md`
- `doc/architecture/flows/channel_intake_api_contract.md`
- `doc/architecture/flows/channel_intake_state_machine.md`
- `doc/architecture/flows/channel_intake_exception_resolution_spec.md`
- `doc/architecture/data/channel_intake_entity_field_contract.md`
- `doc/architecture/data/channel_product_mapping_governance.md`
- `doc/architecture/flows/intake_demand_aggregation_spec.md`
- `doc/architecture/flows/channel_intake_golden_expected_output.md`