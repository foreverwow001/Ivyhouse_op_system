# Shared Key Contract

更新日期：2026-04-03

Authoritative source：是

適用範圍：

- `doc/architecture/data/shared_key_matrix_six_csv.md` 所涵蓋的六張主資料治理 CSV
- Phase 0 期間所有引用內包裝、外包裝、銷售商品與轉換規則 key 的規格、Plan、Log、後續 schema 設計

## 目的

本文件定義 Ivyhouse OP System 目前可執行的 shared key contract，明確規範：

1. shared key 的正式 owner
2. key 的命名與格式規則
3. key 的不可變條件
4. consumer 可以做什麼、不可以做什麼
5. 變更 shared key 時的流程與前置條件

本文件的定位不是單純列欄位名稱，而是作為跨模組引用 shared key 時的正式資料契約。

## Idx-006 完成邊界

- Idx-006 第一版正式完成範圍，限於 `doc/architecture/data/shared_key_matrix_six_csv.md` 所定義的六張治理 CSV 與其直接延伸的 shared key owner / consumer 契約。
- 本文件後續若收錄與原料、配方、中介物、半成品有關的補充 contract，目的是避免 Phase 1 runtime 與權威文件出現 owner 語意斷裂；它們不代表 Procurement、Order / Fulfillment、Finance 的完整 integration contract 已完成。
- 其餘模組的專屬 integration contract 應由後續 work unit 補齊，不回灌到 Idx-006 第一版完成定義。

## 適用原則

### 1. owner 優先原則

- 每一類 shared key 必須有唯一 owner。
- 非 owner 文件、模組、CSV、流程或報表只可引用，不得自行產生平行 key。
- 若 consumer 發現 key 缺漏，只能提出新增需求，不可自行補碼後視為正式值。

### 2. surrogate key / business code 分離原則

- 本文件中整理的 shared key 皆屬目前業務上需跨表交換的 business key / domain key。
- 後續若進入正式資料庫 schema，模組內部關聯仍應優先使用 surrogate key。
- business key 主要用於：主資料治理、跨模組對接、人工對帳、CSV 匯入匯出與權威文件引用。

### 3. 不可變原則

- shared key 一旦正式發布並被 consumer 引用，不得就地改碼。
- 若命名規則改變，必須以「停用舊 key + 建立新 key + 維護映射與遷移計畫」方式處理。
- 不可在沒有回填、影響盤點與 consumer 盤點的情況下直接覆寫 key。

### 4. 提案與正式主檔分離原則

- 提案表可提出建議 key，但不構成正式 owner。
- 正式 owner 只能是對應主檔或正式規則表。
- 若提案表與正式主檔衝突，以正式主檔為準，提案表只能回補說明，不可反向覆寫主檔。

### 5. 生命週期與審計欄位原則

- 目前六張治理 CSV 中，`銷售商品主檔`、`內包裝完成品主檔`、`外包裝材料主檔`、`單位換算規則表`、`生產_分裝_轉換扣帳規則表` 都必須至少承載 `狀態`、`生效日`、`失效日`、`停用原因`、`來源建立方式`。
- 高風險規則表 `單位換算規則表` 與 `生產_分裝_轉換扣帳規則表` 另須承載 `核定狀態`、`核定人`、`核定日期`，用來區分歷史過渡核定與正式核定。
- `狀態` 管理資料是否可供 consumer 正式引用；`核定狀態` 管理高風險數量語意是否已完成 maker-checker 或正式核定，不可混成同一欄位。
- 2026-03-26 前已存在且經治理確認為可用的資料，仍可用 `生效日 = 2026/3/26` 作為初始化回填；但在 Idx-005 / Idx-021 / Idx-022 收斂後，正式可用規則已不應再缺正式核定資訊。
- 正式核定角色與 maker-checker 邊界以 `doc/architecture/roles/README.md` 為準；Phase 0 第一版的 `核定人` 欄位記錄最終核定角色名，而不是個人姓名。

## Shared Key 清單

本文件目前定義六類正式 shared key，與一類提案追蹤 key。

1. 內包裝完成品SKU
2. 外包裝材料SKU
3. 規則代碼
4. 銷售商品SKU
5. 自製混合料SKU
6. 半成品SKU
7. 提案建議SKU（過渡性，不是正式 owner key）

---

## Contract A: 內包裝完成品SKU

### 契約名稱

`InnerPackSkuContract`

### 正式 owner

- owner module：Master Data
- owner 文件：`project_maintainers/data/active/master-data/2026-03-25_內包裝完成品主檔_template.csv`
- owner 欄位：`內包裝完成品SKU_正式`

### key 用途

- 作為銷售商品組成對照表引用的正式內包裝 key
- 作為單位換算規則表的適用對象 key
- 作為生產／分裝／轉換扣帳規則表的輸入與輸出 key
- 作為禮盒、單片、分裝、單包與整包之間的正式識別碼

### 目前格式規則

| 前綴 / 族群 | 語意 | 範例 | 說明 |
|------|------|------|------|
| `A` | 夏威夷豆塔顆粒完成品 | `A1` | 既有顆粒型完成品 |
| `B` | 堅果塔顆粒完成品 | `B1` | 既有顆粒型完成品 |
| `H` | 雪花餅顆粒完成品 | `H1` | 既有顆粒型完成品 |
| `M` | 瑪德蓮顆粒完成品 | `M1` | 既有顆粒型完成品 |
| `P` | 鳳梨酥顆粒完成品 | `P1` | 既有顆粒型完成品 |
| `Y` | 椰棗袋裝內包裝完成品 | `Y1` | 既有袋裝內包裝 |
| `Q1-Q5` | 奶油曲奇整包完成品 | `Q1` | 委外整包完成品 |
| `Q1001-Q5001` | 奶油曲奇單片內容物 | `Q1001` | 由整包拆分出的單片 key |
| `C1-C7` | 杏仁瓦片秤重完成品 | `C1` | 自製秤重完成品 |
| `C1001-C7001` | 杏仁瓦片單片內容物 | `C1001` | 由秤重完成品拆分出的單片 key |
| `G1-G5` | 西點餅乾整包完成品 | `G1` | 委外整包完成品 |
| `G1001-G5001` | 西點餅乾單片內容物 | `G1001` | 由整包完成品拆分出的單片 key |
| `K1001-K4001` | 濾掛咖啡單包內容物 | `K1001` | 委外單包完成品 |
| `S1-S2` | 糖果秤重完成品 | `S1` | 主體糖果完成品 |
| `S1010-S2010` | 糖果 100g 分裝完成品 | `S1010` | 由秤重完成品分裝 |

### 格式限制

- 前綴必須反映既有族群語意，不得混用。
- 單片／分裝／單包衍生型 key 必須與母項族群保持可追溯關係。
- 不得將不同類型產品硬塞入既有族群，只因為號段看似可用。

### 不可變條件

- 已被組成表、換算表、轉換規則表引用後，不得就地改碼。
- 可調整欄位僅限名稱、說明、用途摘要、狀態、備註；不得直接改 `內包裝完成品SKU_正式`。

### consumer 義務

- 銷售商品組成對照表的 `對應內包裝成品SKU` 欄位，預設只能引用主檔已存在的 `內包裝完成品SKU_正式`。
- 唯一例外是經治理核定的「原料直接分裝 / no_inner_stage」商品 family；此時同一欄位可暫作 `組成輸入項SKU` 使用，改引用原料主檔已存在的 `原料代碼`，但不得因此把 `原料代碼` 誤認為新的內包裝 shared key。
- 若 `對應內包裝成品SKU` 走原料直接分裝例外，consumer 必須同步滿足以下條件：引用的 `itemSku` 已存在原料主檔、名稱必須對齊原料主檔正式名稱、扣帳單位只能使用該原料的正式採購 / 庫存 / 生產單位，且備註或相對應權威文件必須明示 `原料直接分裝`。
- 除已明確核定的例外 family 外，不得把 `對應內包裝成品SKU` 欄位泛化為任意原料欄位，也不得讓 consumer 自行決定哪些 sellable 可跳過內包裝完成品層。
- 單位換算規則表不得為不存在於主檔的 key 建立換算率。
- 生產／分裝／轉換扣帳規則表不得產生未先在主檔註冊的輸出 key。

### 組成輸入槽位例外

- `project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv` 的 `對應內包裝成品SKU` 欄位名稱屬既有歷史命名，Phase 1 不另改欄名。
- 當 sellable 的庫存扣帳語意屬「由散裝原料直接秤重 / 分裝後販售，且不建立獨立內包裝完成品主檔」時，該欄位可依前述例外改承載正式 `原料代碼`。
- 此例外不改變 owner 邊界：`內包裝完成品SKU_正式` 的 owner 仍是內包裝完成品主檔，`原料代碼` 的 owner 仍是原料主檔；組成表只是被核准的 consumer 槽位，不是新 owner。
- 後續若進入正式 schema / API，應把這個欄位語意正規化為 `compositionInputType + compositionInputSku`，而不是讓後端長期以欄位名推測實體型別。
- Phase 1 runtime 目前由 `MasterDataService.resolveCompositionInputType()` 依正式 owner 主檔 membership 判定 `compositionInputType`：內包裝 / 半成品輸出 `INNER_PACK_PRODUCT`，已核定原料直分裝輸出 `MATERIAL`；未知 SKU 必須直接拒絕，不得再靠欄位名或 SKU 前綴猜型別。

### 變更流程

1. 先在提案表提出新增或調整理由。
2. 更新內包裝完成品主檔，建立正式 key 與分類。
3. 必要時補單位換算規則表。
4. 必要時補生產／分裝／轉換扣帳規則表。
5. 最後才允許組成表引用。
6. 若走原料直接分裝例外，則必須先補原料主檔、必要原料換算與例外治理依據，再允許組成表以 `原料代碼` 進入 `對應內包裝成品SKU` 槽位。

### 狀態治理

- `內包裝完成品主檔_template.csv` 的 `狀態` 至少應區分 `草稿`、`啟用`、`停用`。
- `草稿` 代表內包裝 key 已註冊，但欄位品質、換算依據或轉換鏈仍未完成正式確認。
- `啟用` 代表主檔欄位、必要換算規則與必要轉換規則都已確認，可供組成表、換算表與轉換規則表正式引用。
- `停用` 代表保留歷史追溯能力，但不得再供新組成、新換算或新轉換規則引用。

### 草稿轉正式

1. `草稿` 轉 `啟用` 前，至少必須已具備正式 `內包裝完成品SKU_正式`、正式名稱、分類、類型、來源類型與庫存主單位。
2. 若主檔標記 `是否需要生產_分裝_轉換規則 = 是`，則至少要存在一條可對應該內包裝 SKU 的正式轉換規則。
3. 若內包裝存在輔助單位，或其轉換規則依賴換算率，則單位換算規則表中必須已有對應換算設定。
4. 若備註僅承載過渡說明，但正式名稱、提案表與 consumer 引用已一致，不得讓過時備註持續阻斷正式發布。
5. 內包裝主檔正式欄位除 `狀態` 外，還必須維護 `生效日`、`失效日`、`停用原因`、`來源建立方式`；若後續有覆核責任分工，再依 RBAC / approval matrix 擴充審計欄位。

### 發布與同步原則

1. 內包裝完成品主檔應先於單位換算規則表、轉換規則表與組成表完成正式註冊。
2. 若內包裝主檔欄位或名稱調整會影響換算或轉換語意，應視為同一變更單位同步更新相關規則。
3. 未正式啟用的內包裝 SKU，不得作為新增 consumer 引用的正式基準。

### 停用規則

1. 已被組成表、換算表或轉換規則表引用的內包裝 SKU，不得物理刪除。
2. 停用內包裝 SKU 應先確認是否需要建立替代 SKU，並完成 consumer 切換計畫。
3. 若現行 CSV 結構尚未承載完整有效期間，至少要保留可追溯的文件化停用依據。

---

## Contract B: 外包裝材料SKU

### 契約名稱

`OuterPackSkuContract`

### 正式 owner

- owner module：Master Data
- owner 文件：`project_maintainers/data/active/master-data/2026-03-25_外包裝材料主檔_template.csv`
- owner 欄位：`外包裝材料SKU_正式`

### key 用途

- 作為銷售商品組成對照表外包裝組裝扣帳的正式 key
- 作為外包裝相關轉換規則的輸入或輸出 key

### 目前格式規則

- 前綴固定為 `PK`
- 目前已核定範圍為 `PK0001` 至 `PK0019`
- 命名應以「材料類型-適用情境」表示，不得只有泛稱

### 已核定命名原則

| 類型 | 範例 | 說明 |
|------|------|------|
| 紙盒 | `PK0001 紙盒-禮盒` | 指定適用情境 |
| 鐵盒 | `PK0004 鐵盒-禮盒` | 不用泛稱 `鐵盒` 作正式主檔名 |
| 大底板 | `PK0005 大底板-紙盒-咖啡40` | 必須標明容器與情境 |
| 隔板 | `PK0011 隔板-紙盒-禮盒` | 必須標明容器與情境 |
| 封套 | `PK0019 封套鐵盒-禮盒` | 必須標明容器與適用情境 |
| 袋類 | `PK0014 手提夾鏈袋` | 通用袋類仍需唯一正式名稱 |

### 不可變條件

- 正式 `PK` 代碼一旦被組成表或轉換規則引用，不得直接改碼。
- 不得以泛稱 `紙盒`、`鐵盒`、`大底板`、`隔板` 取代正式 key 與正式名稱。

### consumer 義務

- 銷售商品組成對照表若 `是否需要外包裝組裝 = 是`，就必須引用有效的 `外包裝材料SKU`。
- 不得在 consumer 表內自行創建 `PK` 代碼。
- 提案表中的 `建議SKU` 不可視為已正式可用，除非主檔已落地。

### 變更流程

1. 先在提案表提出新外包裝或命名調整。
2. 更新外包裝材料主檔。
3. 若影響組成或規則，再同步更新組成表與轉換規則表。

### 狀態治理

- `外包裝材料主檔_template.csv` 的 `狀態` 至少應區分 `草稿`、`啟用`、`停用`。
- `草稿` 代表 PK 已註冊，但尚未可供銷售商品組成或轉換規則正式引用。
- `啟用` 代表 PK 命名、適用情境與 consumer 引用已完成確認，可作為正式外包裝 owner key 使用。
- `停用` 代表保留歷史追溯能力，但不得再供新組成或新規則引用。

### 草稿轉正式

1. `草稿` 轉 `啟用` 前，至少必須已具備正式 `外包裝材料SKU_正式`、正式名稱、材料類型、庫存單位與主要適用情境摘要。
2. 若 PK 已被銷售商品組成對照表引用，主檔中的正式名稱與適用情境必須能支持現行 consumer 引用，不得存在 consumer 引用不存在 PK 的情況。
3. 若 PK 未被任何 consumer 引用，仍需有明確的預定用途與核定依據，否則不得僅因已編碼就直接轉 `啟用`。
4. PK 主檔正式欄位除 `狀態` 外，還必須維護 `生效日`、`失效日`、`停用原因`、`來源建立方式`；若後續有覆核責任分工，再依 RBAC / approval matrix 擴充審計欄位。

### 發布與同步原則

1. 新增 PK 或調整 PK 命名時，一律先更新外包裝材料主檔，再同步組成表或轉換規則表。
2. 若某 PK 要由 `草稿` 轉 `啟用`，至少要確認所有既有 consumer 引用都對得上正式 PK key 與正式名稱。
3. 若某 PK 已 `停用`，組成表與轉換規則表不得再新增對該 PK 的新引用；若需替代，應先建立並啟用新 PK，再完成 consumer 切換。

### 停用規則

1. 已被組成表或轉換規則表引用的 PK，不得物理刪除。
2. 停用 PK 應以 `狀態 = 停用` 管理，並在備註或相對應變更證據中說明停用原因與替代關係。
3. 若現行 CSV 結構尚未承載完整有效期間，至少要保留可追溯的文件化變更依據，不得以口頭決策取代。

---

## Contract C: 規則代碼

### 契約名稱

`TransformationRuleCodeContract`

### 正式 owner

- owner module：Production
- owner 文件：`project_maintainers/data/active/rules/2026-03-25_生產_分裝_轉換扣帳規則表_template.csv`
- owner 欄位：`規則代碼_正式`

### key 用途

- 作為 RTW、RTP、RPK 等正式轉換規則的唯一識別碼
- 未來供工單執行、分裝紀錄、批次處理、審計 log 直接引用

### 目前格式規則

| 前綴 | 語意 | 範例 |
|------|------|------|
| `RTW` | 拆包轉重量中介 | `RTW-001` |
| `RTP` | 拆包 / 分裝至內包裝或單片 | `RTP-001` |
| `RPK` | 外包裝材料組裝或相關規則 | `RPK-001` |

### 不可變條件

- 規則一旦被正式採用，不得直接改 `規則代碼_正式`。
- 若規則邏輯有結構性改變，應新建規則代碼，並停用舊代碼。

### consumer 義務

- 其他表目前雖未直接持有規則代碼欄位，但所有說明文件、Plan、Log 若要引用規則，必須使用 `規則代碼_正式`。
- 未來若新增 execution log / batch log，必須直接引用此代碼，不可只存規則名稱。

### 變更流程

1. 新規則先確認輸入輸出 key 都已存在正式 owner 表。
2. 補齊換算依據與適用情境。
3. 再建立新的 `規則代碼_正式`。

### 狀態治理

- `生產_分裝_轉換扣帳規則表_template.csv` 的 `狀態` 至少應區分 `草稿`、`啟用`、`停用`。
- `草稿` 代表規則代碼已建立，但輸入輸出 key、換算依據或適用情境仍未完成正式確認。
- `啟用` 代表規則的輸入輸出 key 已存在正式 owner 表、換算邏輯可追溯、可供正式扣帳流程引用。
- `停用` 代表規則保留歷史審計用途，但不得再作為新流程或新主檔的正式依據。
- 規則表除生命週期欄位外，另需維護 `核定狀態`、`核定人`、`核定日期`；正式值必須對得上 `doc/architecture/roles/README.md` 的 approval matrix，不得再保留待補角色字串。
- `核定人` 目前記錄正式核定角色名；若與 `doc/architecture/roles/README.md` 不一致，該規則不得視為正式可用規則。

### 草稿轉正式

1. 規則 `草稿` 轉 `啟用` 前，輸入項目 SKU 與輸出項目 SKU 必須都已存在正式 owner 表。
2. 若規則數量語意依賴單位換算，則對應換算率必須已正式存在且與規則敘述一致。
3. 規則名稱、規則類型、適用情境與來源依據必須足以支撐審計與後續 execution log 引用。
4. 規則若要正式供 production / inventory 扣帳使用，至少須存在一組可追溯的 `核定狀態`、`核定日期` 與對應 approval matrix 的 `核定人`；`核定人` 記錄正式核定角色名。

### 發布與停用原則

1. 新規則啟用前，不得只靠備註或口頭說明補足數量邏輯。
2. 若既有規則邏輯變更已構成新流程，應新建規則代碼並停用舊規則，不得直接覆寫既有正式規則。
3. 停用規則時，至少應在備註或對應變更證據中說明停用原因與替代規則。
4. 規則新增、修改或停用屬高風險 approval boundary，必須符合 `doc/architecture/roles/README.md` 定義的 maker-checker 與正式核定角色。

---

## Contract D: 銷售商品SKU

### 契約名稱

`SellableSkuContract`

### 目前狀態

狀態：owner contract 已建立，正式主檔資料載體已建立，consumer 轉接治理待持續收斂

### 正式 owner

- owner module：Master Data
- owner 規格文件：`doc/architecture/data/sellable_product_master_spec.md`
- shared key：`銷售商品SKU_正式`

### 目前操作來源

- 正式主檔資料載體已建立於 `project_maintainers/data/active/master-data/2026-03-26_銷售商品主檔_template.csv`
- `project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv` 仍保留 `銷售商品SKU_正式` 欄位作為組成 consumer 對接鍵，但不再是唯一操作來源

### owner 補齊後的治理結論

- `銷售商品SKU_正式` 屬主資料 shared key，owner 已明確歸屬於 Master Data
- `銷售商品組成對照表` 的責任應回到「組成與扣帳對照」，而不是長期兼任銷售商品主檔
- 後續若要讓訂單、出貨、報表、財務直接引用銷售商品 key，應以正式銷售商品主檔資料載體為引用基準

### 暫時治理規則

- 在新增商品流程與下游 consumer 轉接尚未完全文件化前，`銷售商品SKU_正式` 應先更新銷售商品主檔，再同步更新組成表。
- 其他文件或模組若要引用銷售商品 key，不得自行創建第二份清單。
- 任何新銷售商品若尚未有正式 `銷售商品SKU_正式`，不得先在訂單、出貨或報表側自建代碼。

### 正式化前限制

- 不得把「資料載體已建立」誤寫成「下游 consumer 與發布治理已全部完成」。
- 若後續要接到訂單、出貨、財務、報表，必須先明確定義以銷售商品主檔為唯一 owner 的同步與引用流程。

### 權威規格入口

- 欄位集合、版本化、consumer 邊界與主檔責任，以 `doc/architecture/data/sellable_product_master_spec.md` 為準

### 變更流程

1. 在正式主檔資料載體未建立前，組成表是暫時唯一操作來源。
2. 一旦正式主檔資料載體建立，組成表應降為 consumer，不再兼任操作來源。
3. 屆時需做一次 owner 落地與 consumer 轉接文件化，並同步更新所有引用規格。

---

## Contract E: 提案建議SKU

### 契約名稱

`SkuProposalContract`

### owner

- owner 文件：`project_maintainers/chat/2026-03-25_內包裝新增項與外包裝材料_SKU編碼提案表.csv`
- owner 欄位：`建議SKU`

### 定位

- 這是提案階段的決策追蹤 key，不是正式 master owner key。
- 它只用於說明「新增的正式 key 從何而來」，不可作為長期引用基礎。

### consumer 義務

- 所有 consumer 一旦已改用正式主檔中的 key，就不得再以提案表作為權威來源。
- 若提案與主檔不一致，必須修正提案紀錄，不得回改主檔配合提案。

---

## Consumer 通用義務

所有 shared key consumer 都必須遵守以下規則：

1. 不得自行創造未被 owner 發布的 key
2. 不得以名稱文字比對取代正式 key 引用
3. 不得直接覆寫 owner key 來達成資料修正
4. 若引用失敗，應回到 owner 文件補主資料，不得在 consumer 表補假資料
5. shared key 一旦進入流程、對帳、轉換或審計環節，任何異動都視為高風險變更

## Shared Key 變更控制

### 必要前置條件

shared key 變更前，至少要補齊：

1. 變更理由
2. owner 確認
3. consumer 盤點
4. 回填 / 遷移方式
5. 不可逆風險與回滾策略

### 需要同步更新的文件

至少應同步檢查：

- `doc/architecture/data/shared_key_matrix_six_csv.md`
- `doc/architecture/data/shared_key_contract.md`
- 對應 owner 主檔 CSV
- 對應 consumer CSV
- 若已進入正式工作項，需同步更新相關 Plan / Log 的 `SHARED KEY / CROSS-MODULE IMPACT`

### 高風險觸發條件

下列情況預設需要 domain review，必要時升級 security / finance review：

1. 改變 shared key owner
2. 改變 key 格式規則
3. 對已被流程或對帳使用的 key 就地改碼
4. 讓 consumer 在 owner 尚未落地前先引用暫存 key
5. 涉及匯入匯出、批次作業、財務對帳、稽核 log 的 shared key 變更

## 目前結論

1. `內包裝完成品SKU` 已具備正式 owner、consumer 與可執行變更流程
2. `外包裝材料SKU` 已具備正式 owner、consumer 與可執行變更流程
3. `規則代碼_正式` 已具備正式 owner，但後續仍需更多 consumer 落地
4. `銷售商品SKU_正式` 的 owner 已由 `sellable_product_master_spec.md` 正式定義，且正式主檔資料載體已建立
5. `自製混合料SKU` 已決議升格為正式 shared key，owner 掛在半成品主檔，並與半成品SKU分開治理
6. `半成品SKU` 已決議升格為正式 shared key，owner 掛在半成品主檔
7. 下一個應補的重點不再是建立主檔資料載體，而是補齊主檔發布治理、同步流程與下游 consumer 對接規則

---

## Contract F: 自製混合料SKU

### 契約名稱

`MixedIntermediateSkuContract`

### 正式 owner

- owner module：Production
- owner 文件：`project_maintainers/data/active/master-data/2026-04-01_半成品主檔第一版草案.csv`
- owner 欄位：`半成品SKU_草案`

### key 用途

- 作為自製混合料主檔與 recipe version 的正式識別碼
- 作為 production planning、BOM reservation 與轉製規則引用的正式中間產物 key
- 作為後續 inventory ledger 與 audit log 追蹤自製混合料的正式 domain key

### 目前格式規則

- 前綴固定為 `MX`
- 目前已核定範圍為 `MX0001-MX0004`
- 現有號段直接凍結為正式碼，不重編

### 分開治理理由

- 自製混合料必然依賴 recipe version 與配方明細
- 其 consumer 主要是 production planning、配方治理與耗料扣帳，不等同於純外購半成品
- 即使 owner 文件相同，仍應與半成品SKU分成不同 contract，避免發布條件混淆

### consumer 義務

- recipe version 與 recipe line 只能引用 owner 主檔已註冊的 `MX` key
- 非 owner 文件不得自行建立新的 `MX` 編碼
- 若自製混合料尚未具備正式 recipe，不得在 production consumer 中視為正式可用 key

### 草稿轉正式

1. 主檔已註冊正式名稱、類型、來源類型、庫存主單位與生效日
2. 必要單位換算已齊
3. 必須存在對應 recipe version 與 recipe line
4. 若 recipe 仍含待補原料或待補規格，不得轉為正式可引用

---

## Contract G: 半成品SKU

### 契約名稱

`SemiFinishedSkuContract`

### 正式 owner

- owner module：Production
- owner 文件：`project_maintainers/data/active/master-data/2026-04-01_半成品主檔第一版草案.csv`
- owner 欄位：`半成品SKU_草案`

### key 用途

- 作為半成品主檔、外購規格、轉製規則與後續工單 / 庫存流程引用的正式識別碼
- 作為後續 inventory ledger 與 audit log 追蹤半成品的正式 domain key

### 目前格式規則

- 前綴固定為 `SF`
- 目前已核定範圍為 `SF0001-SF0005`
- 現有號段直接凍結為正式碼，不重編

### 分開治理理由

- 半成品同時涵蓋外購半成品與轉製半成品
- 其發布條件不一定依賴 recipe；純外購半成品可只憑主檔與換算規則發布
- 若與 `MX` 混成同一 contract，會把 recipe 必填條件錯套到純外購半成品

### consumer 義務

- 轉製規則、外購規格與後續工單 / inventory consumer 只能引用 owner 主檔已註冊的 `SF` key
- 非 owner 文件不得自行建立新的 `SF` 編碼
- 若半成品狀態仍為草稿，不得在新增 consumer 中視為正式發布 key

### 草稿轉正式

1. 主檔已註冊正式名稱、類型、來源類型、庫存主單位與生效日
2. 必要單位換算已齊
3. 若是自製或轉製半成品，必須存在對應 recipe 或轉製規則
4. 若是純外購半成品，可免 recipe，但必須具備可追溯的外購規格與換算依據