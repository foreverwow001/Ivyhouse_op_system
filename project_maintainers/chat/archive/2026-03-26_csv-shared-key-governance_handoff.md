# SESSION-HANDOFF

## Current goal

- 本輪已完成六張 CSV 的資料治理收斂、表頭正規化、shared key 關係矩陣與正式 shared key contract 起草。
- 下一位接手者若延續本主題，優先目標是補上 `銷售商品SKU_正式` 的正式 owner 缺口，也就是起草銷售商品主檔或其 owner 規格。

## Current branch

- `main`

## Active environment

- Dev Container / Debian GNU/Linux 12
- 主要工作方式：以文件與 CSV 為主，未進入程式碼實作

## Files touched

- `project_maintainers/chat/2026-03-25_內包裝新增項與外包裝材料_SKU編碼提案表.csv`
- `project_maintainers/data/active/master-data/2026-03-25_內包裝完成品主檔_template.csv`
- `project_maintainers/data/active/master-data/2026-03-25_外包裝材料主檔_template.csv`
- `project_maintainers/data/active/rules/2026-03-25_單位換算規則表_template.csv`
- `project_maintainers/data/active/rules/2026-03-25_生產_分裝_轉換扣帳規則表_template.csv`
- `project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv`
- `project_maintainers/data/notes/2026-03-25_六張CSV最終版欄位對照摘要.md`
- `doc/architecture/data/shared_key_matrix_six_csv.md`
- `doc/architecture/data/shared_key_contract.md`
- `doc/architecture/data/README.md`

## What has been confirmed

- 六張 CSV 的資料列層級 placeholder 已清理完成，舊三碼 / 泛名包材殘留已移除。
- 三張 CSV 表頭中的歷史暫名已正規化：
  - `銷售商品SKU_待建立` -> `銷售商品SKU_正式`
  - `規則代碼_待建立` -> `規則代碼_正式`
  - `標準損耗率_待確認` -> `標準損耗率`
  - `標準包裝重量或數量_待確認` -> `標準包裝重量或數量`
- 已新增六張 CSV 的欄位對照摘要文件。
- 已新增六張 CSV 的 shared key 關係矩陣。
- 已新增正式 `shared key contract` 文件，並將其掛到 `doc/architecture/data/README.md`。
- 目前明確文件化的治理結論：
  - `內包裝完成品SKU` 已有正式 owner 與 consumer 契約
  - `外包裝材料SKU` 已有正式 owner 與 consumer 契約
  - `規則代碼_正式` 已有正式 owner，但後續仍需更多 consumer 落地
  - `銷售商品SKU_正式` 仍屬暫時 contract，尚缺正式 owner 主檔

## Current stage

- 目前處於 Phase 0 文件補齊階段中的「shared key contract 已建立，但銷售商品主檔缺口尚未補」狀態。
- 尚未建立新的 `doc/plans/Idx-NNN_plan.md` 或 `doc/logs/Idx-NNN_log.md` 來承接銷售商品主檔規格工作。

## What was rejected

- 不採用只把 shared key 規則留在 chat/handoff 或 repo memory，而不進入權威文件的做法。
- 不採用讓提案表長期充當正式 owner 的做法。
- 不採用讓 `銷售商品組成對照表` 長期同時兼任銷售商品主檔與組成對照權威來源的做法，這目前只被允許作為暫時過渡。

## Next exact prompt

- 請依 `doc/architecture/data/shared_key_contract.md` 與 `doc/architecture/data/shared_key_matrix_six_csv.md`，起草一份銷售商品主檔權威規格，明確定義 `銷售商品SKU_正式` 的 owner、欄位集合、與組成表的關係、是否版本化、以及未來如何被訂單 / 出貨 / 報表 / 財務引用；若需要我確認或補決策，請盡量使用 `vscode_askQuestions`。

## Risks

- `銷售商品SKU_正式` 目前只有暫時 contract，尚未進入正式主檔 owner 模式。
- 若在補銷售商品主檔前就讓訂單、出貨、報表或財務側直接依賴組成表，後續會放大 owner 轉移成本。
- `shared key contract` 雖已建立，但尚未綁定到 implementation plan index 的正式 work unit。

## Verification status

- 已驗證：
  - 六張 CSV 已無 `待建立`、`待確認` 類歷史暫名殘留
  - `shared_key_matrix_six_csv.md` 已掛入 `doc/architecture/data/README.md`
  - `shared_key_contract.md` 已掛入 `doc/architecture/data/README.md`
- 尚未驗證：
  - 銷售商品主檔的正式 owner 規格
  - implementation plan index 是否需要新增或掛接對應 work unit