# Project Maintainers Data Surface

這個目錄保存 downstream 專案仍需在 repo 內維護的資料載體，但它不是 workflow authoritative rule source。

建議結構：

- `active/`：目前已被 runtime、seed、權威文件直接引用的 CSV 載體
- `drafts/`：尚未正式升格的草案 CSV 與草案說明
- `notes/`：CSV / 工作載體的配套摘要與欄位說明
- `raw-workbooks/`：Excel / xlsm 原始工作底稿

治理原則：

- active CSV 雖是 repo 內正式資料載體，但 owner 定義與治理規則仍以 `doc/architecture/**` 為準
- drafts 不應被 runtime 當成正式權威來源，除非已有明確文件與實作接受其用途
- 若未來資料載體再演進成 schema / migration / UI owner surface，應由新的 implementation index 項處理，而不是直接在這裡自由擴張

正式分類規則、邊界與 repo guard 要求，以 `doc/architecture/data/maintainer_data_surface_governance.md` 為準。