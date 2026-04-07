# Maintainer Data Surface Governance

本文件定義 `project_maintainers/data/` 與 `project_maintainers/chat/` 的正式邊界，避免 active data carrier、測試 sample、raw workbook 與 handoff 再次混放。

## 目的

本治理文件解決兩個問題：

1. `project_maintainers/chat/` 原本是 supporting operational memory，但歷史上混入了 active CSV、sample 與 raw workbook，導致路徑語意失真。
2. runtime、seed、tests 與 authority docs 一旦直接引用 maintainer 載體，就需要穩定可維護的落點，不能再依賴臨時 chat 目錄。

## 正式邊界

### `project_maintainers/chat/`

只允許承載：

- `handoff/`
- `archive/`
- `README.md`
- 少量仍屬交接性質、尚未升格為正式治理文件的 supporting operational memory

明確禁止長期承載：

- active CSV / owner data carrier
- parser / mapping raw sample
- raw workbook
- 已成為權威入口的資料分類規則

### `project_maintainers/data/`

這是 repo 內 maintainer data carrier 的正式落點。結構如下：

- `active/`
  - `master-data/`：被 runtime、seed、權威文件直接引用的正式 CSV 載體
  - `rules/`：正式換算規則、轉換規則、耗材對照等 active rule carrier
  - `supplies/`：正式出貨 / 行政耗材載體
- `drafts/`
  - `semifinished/`：半成品、自製混合料與 recipe 草案
  - `materials-and-recipes/`：原料主檔最低版本、原料換算與分類 mapping 草案
- `notes/`：active carrier 的欄位說明、摘要與補充說明
- `raw-workbooks/`：Excel / xlsm 原始工作底稿

### `apps/api/test/fixtures/intake-source-documents/`

這是 channel intake parser / mapping raw sample 的正式位置，不得回放到 `project_maintainers/chat/sample/`。

## 分類規則

### Active carrier

若檔案符合以下任一條件，必須進 `project_maintainers/data/active/`：

- 被 `apps/api/src/**` runtime 直接讀取
- 被 `apps/api/prisma/seed.ts` 直接讀取
- 被 `doc/architecture/**` 明確列為 authoritative source / owner carrier

### Draft carrier

若檔案仍是草案、欄位模板、分類分析或待補資料清單，且尚未成為 runtime/seed 正式輸入，必須進 `project_maintainers/data/drafts/`。

### Notes

若檔案主要作用是解釋 CSV 欄位、摘要或補充規則，而不是直接被 runtime 當資料載體讀取，應進 `project_maintainers/data/notes/`。

### Raw workbook

若檔案是 xlsx / xls / xlsm 原始工作簿，且用途是分析來源或人工底稿，而不是 runtime 輸入，應進 `project_maintainers/data/raw-workbooks/`。

### Intake sample

若檔案是 parser / mapping 的 raw input sample，應進 `apps/api/test/fixtures/intake-source-documents/`，不得與 handoff 或 active CSV 混放。

## 變更流程

新增或搬動 maintainer data carrier 前，至少要完成以下檢查：

1. 判斷檔案屬 `active`、`drafts`、`notes`、`raw-workbooks` 或 `intake-source-documents` 哪一類。
2. 若屬 active carrier，先盤點 runtime、seed、tests、authority docs、plan/log 是否已有直接引用。
3. 若要搬動既有 carrier，必須同步更新引用，不得保留雙活路徑。
4. 若屬 parser / mapping sample，必須同步檢查 fixture tests 與 acceptance matrix。
5. 完成後必須執行 repo guard 與受影響測試。

## Repo Guard

repo 目前以 root script `guard:maintainer-paths` 做第一層硬性卡控：

- 禁止 code 與 docs 重新引用舊的 `project_maintainers/chat/sample/`
- 禁止 code 與 docs 重新引用已搬遷的 active CSV / draft / notes / raw workbook 舊路徑

這個 guard 是最小防呆，不取代人工設計審查；但若 guard 失敗，視為 maintainer data surface 邊界被破壞，必須先修正再合併。

## 不允許的退化方式

- 因為「暫時方便」就把新 active CSV 放回 `project_maintainers/chat/`
- 因為「只是測試檔」就把 parser sample 放回 `project_maintainers/chat/sample/`
- 在新位置建立檔案後，仍保留舊位置作長期相容層
- 先搬檔、後補引用，讓 runtime / seed / docs 在中間狀態失真

## 與權威文件的關係

- `project_maintainers/data/` 是資料載體 surface，不是 owner 規則本身。
- owner、shared key、欄位責任、consumer 邊界與治理要求，仍以 `doc/architecture/data/**` 為權威來源。
- 若未來 active CSV 被 schema / migration / UI owner surface 取代，應開新 work unit 收斂，不得在 maintainer surface 私自演化第二套正式系統。