# Data Architecture

本文件是 Ivyhouse OP System 在 Phase 0 與後續實作中的資料權威入口。凡是涉及主資料、shared key、schema contract、資料同步、migration、回填、批次追溯或 cross-module data ownership 的設計，都必須先以本文件為準，再進一步拆出細部字典或 ADR。

## 目標

- 定義 Ivyhouse OP System 的資料治理基線。
- 明確指出哪些資料是主資料、哪些資料是交易事實、哪些資料只能作為投影或報表快取。
- 建立 shared key、owner、同步邊界與 migration 原則。

## 資料分層原則

### 1. Master Data

主資料是跨模組共用、需要穩定識別與生命週期管理的資料。這些資料必須有明確 owner、有效期間、停用規則與審計線索。

目前 Phase 0 應優先建立的主資料群：

- 門市
- 倉庫
- 產品
- 配方
- 原料
- 出貨用品 / 包裝耗材
- 供應商
- 客戶
- 單位與換算規則
- 稅別與計價基礎

### 2. Transactional Facts

交易事實是營運事件的正式紀錄，不可用報表快取或人工摘要取代。這些資料一旦形成，通常只能追加後續事件，不應直接覆寫歷史。

核心交易事實包含：

- 採購單、到貨、驗收
- 庫存異動台帳、批次、效期
- 工單、領料、完工、報廢、重工
- 訂單、包裝、出貨、退貨
- 發票、付款、核銷、對帳事件

### 3. Derived / Reporting Views

報表、摘要、查詢優化表、同步投影都屬於衍生資料。它們可以重建，不能成為唯一真相來源，也不能反向覆寫交易事實。

## 資料 owner 原則

### Owner module write rule

- 每個資料實體都必須有唯一 owner module。
- 非 owner module 可以讀取、查詢、訂閱或引用，但不得直接改寫對方資料。
- 若單體初期共用同一個資料庫，也不能因此忽略 owner module write rule。

### 目前建議 owner 對應

| 實體 / 資料群 | Owner module | 說明 |
|------|------|------|
| 門市、倉庫、產品、配方、原料、供應商、客戶、單位、稅別 | Master Data | 供其他模組引用的正式主資料 |
| 採購單、到貨、驗收 | Procurement | 採購與收貨正式來源 |
| 庫存台帳、批次、轉倉、盤點、調整 | Inventory | 庫存正式事實來源 |
| 工單、領料、完工、報廢、重工 | Production | 生產正式事實來源 |
| 訂單、包裝、出貨、退貨 | Order / Fulfillment | 客單履約正式事實來源 |
| 發票、付款、核銷、成本、對帳結果 | Finance / Reconciliation | 財務與對帳正式事實來源 |
| 認證、角色、審計 | Portal / Identity / Audit | 身分與審計正式來源 |

## Shared key 原則

### 核心規則

- 模組內部關聯一律優先使用不可變 surrogate key。
- 顯示、查找、人工溝通與對帳可以使用 business code，但 business code 不可直接取代內部主鍵。
- shared key 名稱、語意與格式必須由 owner module 定義，其他模組只能引用，不得私自延伸語意。

### 建議 key 類型

| 類型 | 用途 | 規則 |
|------|------|------|
| `id` 類 surrogate key | 系統內部關聯 | 不可變，更換需視為高風險遷移 |
| `code` 類 business key | 顯示、搜尋、人工對帳 | 可有格式規則，但不可作為唯一關聯依據 |
| `external_ref` | 外部整合對應 | 僅用於整合映射，不取代內部 key |
| `version` | 配方與規格版本 | 與實體 key 並存，不以覆寫方式更新歷史 |

## 主資料治理要求

### 產品

- 產品必須有穩定識別碼、顯示名稱、品類、有效狀態與可販售 / 可生產屬性。
- 若產品與配方、生產、成本或稅別有關聯，必須以正式 relation 表達，不可只存文字。

### 配方

- 配方必須版本化。
- 已被工單、生產或成本計算引用的配方版本不得直接覆寫。
- 配方變更需保留生效時間與停用規則。

### 原料

- 原料必須明確定義庫存單位、採購單位、生產單位與必要換算規則。
- 若原料需要批次或效期追蹤，該屬性必須是正式欄位，而非依流程默認。

### 出貨用品 / 包裝耗材

- 紙箱、氣泡紙、膠帶、提袋等出貨用品屬正式主資料，不得只存在人工盤點表。
- 若營運規則是不在出貨時自動扣除，必須明確記錄其庫存管理方式為人工盤點 / 盤點調整，而不是放任系統與實務脫節。
- 這類用品仍需具備採購、入庫、盤點、調整與停用規則，只是扣帳觸發點不同於原料或生產耗材。

### 包材主檔邊界

- 內包裝包材與外包裝材料應併入同一份包材主檔管理，不再拆成兩份平行主資料。
- 若包材會在生產、分裝、組成或正式包裝規則中被耗用，必須走正式扣帳或正式規則引用。
- 只有明確不進正式扣帳、改採人工盤點維護的出貨支援用品，才歸入出貨用品 / 包裝耗材類別。

### 組織實體

- 門市與倉庫分屬不同營運角色，但都屬正式主資料。
- 組織層級、可用範圍與停用規則必須可審計。

## 交易資料治理要求

### 庫存台帳優先

- 庫存不能只存「目前數量」。
- 必須保有每次異動的來源單據、操作者、時間、異動量、批次與原因。

### 財務追溯要求

- 發票、付款、核銷、成本與對帳結果，必須能回溯到來源交易事件。
- 不允許先算出財務結果，再回頭硬改交易事件來配平。

## Schema contract 原則

- API payload、domain DTO、batch file、報表輸出與外部整合 mapping 都屬 schema contract。
- schema contract 一旦被多模組或外部系統引用，就視為 shared contract。
- 任何 shared contract 變更都必須在 Plan 的 `SHARED KEY / CROSS-MODULE IMPACT` 明確標示。

## Migration / backfill / rollback 原則

- migration 必須與 schema contract 變更一起評估，不可只改資料表結構。
- backfill 需說明資料來源、覆蓋範圍、可重跑性與失敗回滾方式。
- 涉及配方、批次、庫存、發票、付款、對帳的 migration，預設視為高風險。
- 若無安全 rollback 策略，Plan 必須明寫限制與人工補救方式。

## Phase 0 必補文件

本 README 是目前的總入口。進入正式實作前，應逐步補齊以下文件：

- master data dictionary
- shared key contract
- schema / integration mapping
- unit conversion rules
- finance reference entities

目前已補的六張 CSV shared key 盤點文件：

- `doc/architecture/data/master_data_dictionary.md`：第一版主資料與高風險參照字典，先收斂目前已治理的銷售商品、內外包裝、單位換算與轉換規則，並補上原料、配方版本、出貨用品 / 包裝耗材的最低必要治理定義
- `doc/architecture/data/shared_key_matrix_six_csv.md`：六張主資料治理 CSV 的 shared key 關係矩陣與 owner / consumer 對照
- `doc/architecture/data/shared_key_contract.md`：正式 shared key contract，定義 owner、格式規則、不可變條件、consumer 義務與變更流程
- `doc/architecture/data/sellable_product_master_spec.md`：銷售商品主檔權威規格，正式定義 `銷售商品SKU_正式` 的 owner、欄位與 consumer 邊界
- `doc/architecture/data/transaction_working_entity_dictionary.md`：第一版交易 / 作業實體字典，先定義匯入批次、解析結果、映射結果、批次需求與旺季試算相關實體
- `doc/architecture/data/channel_product_mapping_governance.md`：定義新增商品、平台名稱別名、映射規則與組合商品應以資料治理承接，而非預設每次改 code
- `doc/architecture/data/channel_intake_special_item_governance.md`：針對 `補寄商品專用/勿下單`、咖啡與 `提袋加購` 明確切開正式銷售商品、底層包材主資料與例外標記邊界
- `doc/architecture/data/bag_family_naming_and_alias_rules.md`：定義 `提袋加購` family 的正式命名、alias 歸一與多尺寸 / 多袋型擴充規則
- `doc/architecture/data/bag_alias_inventory.md`：收斂各渠道已觀察到的提袋文案，區分可直連 `O00001` 的正向 alias 與不得洗成 sellable 的排除字樣
- `doc/architecture/data/channel_intake_entity_field_contract.md`：把 intake / mapping / exception 主線落成實體欄位、型別、enum 與關聯契約草案
- `doc/architecture/data/maintainer_data_surface_governance.md`：正式定義 `project_maintainers/data/` 與 `project_maintainers/chat/` 的邊界、分類規則、搬遷流程與 repo guard

在這些文件尚未建立前，任何規格與實作都必須引用本 README 作為最低資料治理基線。