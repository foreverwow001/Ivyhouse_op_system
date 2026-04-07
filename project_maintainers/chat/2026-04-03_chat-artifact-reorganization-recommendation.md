# project_maintainers/chat 檔案重整建議

更新日期：2026-04-03

## 目的

本文件分析 `project_maintainers/chat` 目前的 CSV、相關說明文檔、原始工作簿與 `sample/` 測試輸入，判斷它們更適合放在 repo 的哪一類資料夾中。這份文件**只提供重整建議，不直接搬動 active CSV 或 sample 檔案**，因為目前仍有大量 runtime、seed、plan/log 與權威文件直接引用既有路徑。

## 目前問題

`project_maintainers/chat` 現在同時混放了 5 種語意完全不同的檔案：

1. **active authoritative CSV 載體**
2. **draft / 草案 CSV 與草案說明**
3. **一次性分析摘要與欄位說明**
4. **原始 Excel / xlsm 工作簿**
5. **parser / mapping 測試輸入 sample**

這導致三個問題：

- 路徑語意混亂：`chat/` 明明是 supporting operational memory，卻承擔 active data carrier
- 測試輸入與治理載體混放：sample 屬測試素材，不該與主資料 CSV 混放
- 後續搬遷成本高：因為 code、seed、docs、plans、logs 已經大量硬引用這些路徑

## 重整原則

### 1. 先依語意分層，不依日期分層

- active data carrier 應集中到「資料載體」型目錄
- sample 應集中到「test fixture / source sample」型目錄
- handoff / archive 應留在 maintainer surface

### 2. active CSV 不應再長期停留在 `chat/`

若 CSV 已被 seed、runtime 或權威文件視為正式載體，它就已經超出「chat handoff / supporting memory」的定位。

### 3. sample 應靠近測試，而不是靠近 handoff

`project_maintainers/chat/sample` 目前更接近 `apps/api/test/fixtures` 的一部分。長期保留在 `chat/` 只會讓人誤以為它是人工交接附件，而不是測試輸入來源。

### 4. 必須採分階段搬遷

因為目前直接引用很多，建議採：

1. 先定新目標資料夾與命名規則
2. 再建立兼容層 / 引用盤點
3. 最後才搬 active CSV / sample

## 建議的最終資料夾結構

### A. active CSV / 工作載體

建議新建：

- `project_maintainers/data/active/master-data/`
- `project_maintainers/data/active/rules/`
- `project_maintainers/data/active/recipes/`
- `project_maintainers/data/active/supplies/`

用途：

- 放目前仍被 runtime、seed、權威文件直接引用的 CSV 載體

### B. draft / 草案與分析前置

建議新建：

- `project_maintainers/data/drafts/materials-and-recipes/`
- `project_maintainers/data/drafts/semifinished/`
- `project_maintainers/data/notes/`

用途：

- 放 2026-04-01 那批草案 CSV、草案說明、欄位模板、分析摘要

### C. 原始 Excel / xlsm 工作簿

建議新建：

- `project_maintainers/data/raw-workbooks/`

用途：

- 放 `食材清單.xlsx`、`成品商品清單.xlsx`、`出貨部耗材.xlsx`、`內包裝耗材.xlsx`、`20260325-生產統計表.xlsm`

### D. intake 測試輸入 sample

建議新建：

- `apps/api/test/fixtures/intake-source-documents/`

用途：

- 放 MOMO / 官網 / 蝦皮 / 橘點子 raw input sample
- 讓 sample 與 `apps/api/test/fixtures/*.json` 同層語意對齊

### E. chat 維持的內容

`project_maintainers/chat/` 長期應只保留：

- `handoff/`
- `archive/`
- `README.md`
- 少量尚未決定是否進 active data / draft data 的臨時交接說明

## 檔案分類建議

### 1. active authoritative CSV 載體

這一批檔案**不適合繼續放在 `chat/`**，因為 code / seed / authority docs 都已把它們當成正式資料載體。

建議移往：`project_maintainers/data/active/`

| 目前檔案 | 建議目標資料夾 | 理由 |
|------|------|------|
| `1-2026-03-24_銷售商品組成對照表_template.csv` | `project_maintainers/data/active/master-data/` | 已被 runtime、seed、flows、plan/log 與 shared key docs 直接引用 |
| `2026-03-25_內包裝完成品主檔_template.csv` | `project_maintainers/data/active/master-data/` | 屬 active owner 載體 |
| `2026-03-25_外包裝材料主檔_template.csv` | `project_maintainers/data/active/master-data/` | 屬 active owner 載體 |
| `2026-03-25_單位換算規則表_template.csv` | `project_maintainers/data/active/rules/` | 屬 active rule carrier |
| `2026-03-25_生產_分裝_轉換扣帳規則表_template.csv` | `project_maintainers/data/active/rules/` | 屬 active rule carrier |
| `2026-03-26_銷售商品主檔_template.csv` | `project_maintainers/data/active/master-data/` | seed 與 runtime 直接使用 |
| `2026-03-31_內包裝耗材用量對照表_template.csv` | `project_maintainers/data/active/rules/` | 屬日常營運正式對照載體 |
| `2026-03-31_出貨及行政耗材總表_template.csv` | `project_maintainers/data/active/supplies/` | 屬 active shipping supply carrier |

### 2. draft / 草案 CSV 與草案說明

這一批檔案**不適合與 active carrier 混放**，但也不應直接進 `doc/architecture/`，因為它們仍是 working draft。

建議移往：`project_maintainers/data/drafts/`

| 目前檔案 | 建議目標資料夾 | 理由 |
|------|------|------|
| `2026-04-01_半成品主檔第一版草案.csv` | `project_maintainers/data/drafts/semifinished/` | 草案載體 |
| `2026-04-01_半成品配方明細草案.csv` | `project_maintainers/data/drafts/semifinished/` | 草案載體 |
| `2026-04-01_半成品配方版本草案.csv` | `project_maintainers/data/drafts/semifinished/` | 草案載體 |
| `2026-04-01_半成品與自製混合料_owner草案說明.md` | `project_maintainers/data/drafts/semifinished/` | 草案說明 |
| `2026-04-01_原料主檔最低版本欄位模板.csv` | `project_maintainers/data/drafts/materials-and-recipes/` | 欄位模板 |
| `2026-04-01_原料主檔最低版本草案.csv` | `project_maintainers/data/drafts/materials-and-recipes/` | 草案載體 |
| `2026-04-01_原料單位換算表草案.csv` | `project_maintainers/data/drafts/materials-and-recipes/` | 草案規則 |
| `2026-04-01_食材清單_分類mapping草案.csv` | `project_maintainers/data/drafts/materials-and-recipes/` | 草案 mapping |
| `2026-04-01_原料正式代碼規則草案.md` | `project_maintainers/data/drafts/materials-and-recipes/` | 草案說明 |
| `2026-04-01_原料正式化說明.md` | `project_maintainers/data/drafts/materials-and-recipes/` | 草案說明 |
| `2026-04-01_食材待補資訊總清單.md` | `project_maintainers/data/drafts/materials-and-recipes/` | 缺口清單 |
| `2026-04-01_食材清單轉換分析.md` | `project_maintainers/data/drafts/materials-and-recipes/` | 分析摘要 |

### 3. 說明 / 摘要型文檔

這一批檔案是「active carrier 的配套說明」，比起 `chat/`，更適合進 `project_maintainers/data/notes/`。

| 目前檔案 | 建議目標資料夾 | 理由 |
|------|------|------|
| `2026-03-24_銷售商品組成對照表_template_README.md` | `project_maintainers/data/notes/` | active carrier 配套說明 |
| `2026-03-25_六張CSV最終版欄位對照摘要.md` | `project_maintainers/data/notes/` | 跨 CSV 摘要說明 |
| `2026-03-25_四張主資料工作表說明.md` | `project_maintainers/data/notes/` | 主資料工作表補充說明 |

### 4. 原始 Excel / xlsm 工作簿

這些檔案既不是 handoff，也不是正式權威 doc；它們更像原始工作底稿或來源材料。

建議移往：`project_maintainers/data/raw-workbooks/`

| 目前檔案 | 建議目標資料夾 | 理由 |
|------|------|------|
| `20260325-生產統計表.xlsm` | `project_maintainers/data/raw-workbooks/` | 分析來源工作簿 |
| `內包裝耗材.xlsx` | `project_maintainers/data/raw-workbooks/` | 原始工作底稿 |
| `出貨部耗材.xlsx` | `project_maintainers/data/raw-workbooks/` | 原始工作底稿 |
| `成品商品清單.xlsx` | `project_maintainers/data/raw-workbooks/` | 原始工作底稿 |
| `食材清單.xlsx` | `project_maintainers/data/raw-workbooks/` | 原始工作底稿 |

### 5. sample 測試輸入

`project_maintainers/chat/sample` 這批檔案更適合成為測試 fixture 的 raw source documents。

建議移往：`apps/api/test/fixtures/intake-source-documents/`

| 目前檔案群 | 建議目標資料夾 | 理由 |
|------|------|------|
| `momo-撿貨單-*.pdf` | `apps/api/test/fixtures/intake-source-documents/` | parser / mapping fixture 原始輸入 |
| `官網-撿貨單-*.xlsx` | `apps/api/test/fixtures/intake-source-documents/` | parser / mapping fixture 原始輸入 |
| `蝦皮-撿貨單-*.pdf` | `apps/api/test/fixtures/intake-source-documents/` | parser / mapping fixture 原始輸入 |
| `橘點子-*.xls` | `apps/api/test/fixtures/intake-source-documents/` | parser / mapping fixture 原始輸入 |

## 為什麼現在不建議直接搬動

### 1. active CSV 已有大量直接引用

目前至少有以下面向直接引用 `project_maintainers/chat/**`：

- `apps/api/prisma/seed.ts`
- `apps/api/src/master-data/master-data.service.ts`
- `apps/api/src/master-data/recipe-owner.service.ts`
- 多份 `doc/architecture/**`
- 多份 `doc/plans/**` / `doc/logs/**`

### 2. sample 也被權威驗收文件直接連結

- `doc/architecture/flows/channel_intake_sample_acceptance_matrix.md` 目前已改連到 `apps/api/test/fixtures/intake-source-documents/**`

### 3. 直接移動會形成兩種風險

- runtime / seed 斷路
- authority docs 與 plan/log 大量失效

## 建議的實際搬遷順序

### Stage 1：已完成

- handoff 與 archive 先整理乾淨

### Stage 2：建立新目標資料夾與命名規則

- 建立 `project_maintainers/data/active/**`
- 建立 `project_maintainers/data/drafts/**`
- 建立 `project_maintainers/data/raw-workbooks/`
- 建立 `apps/api/test/fixtures/intake-source-documents/`

### Stage 3：先搬 sample，再修引用

- 因 sample 的語意最清楚，也最接近測試夾
- 先更新 test helper 與 acceptance docs，再搬 sample

### Stage 4：搬 active CSV 載體

- 先盤點 code / seed / docs / plans / logs 的直接引用
- 再做一次有計畫的全 repo rename / path migration

### Stage 5：搬 draft / notes / raw workbooks

- 這一批風險最低，可在 active CSV 安定後再整理

## 總結

最終應維持的語意是：

- `project_maintainers/chat/`：交接與 supporting memory
- `project_maintainers/data/active/`：active CSV / owner 載體
- `project_maintainers/data/drafts/`：草案與分析前置
- `project_maintainers/data/raw-workbooks/`：原始 Excel / xlsm
- `apps/api/test/fixtures/intake-source-documents/`：parser / mapping raw sample

本輪已完成 sample、active CSV、draft、notes 與 raw workbook 的實際搬遷；下一步不再是「是否搬」，而是補齊殘留引用掃描、自動化驗證與新的資料載體治理規則。