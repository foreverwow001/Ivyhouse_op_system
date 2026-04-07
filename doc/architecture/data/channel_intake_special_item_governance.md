# 四渠道 Intake 特殊項治理規則

更新日期：2026-03-30

Authoritative source：是

## 目的

本文件針對四渠道 intake 中最容易被 legacy mapping 誤判或誤過濾的三類特殊項，建立正式治理規則：

- `補寄商品專用/勿下單`
- 咖啡 / `濾掛咖啡` / `濾掛式咖啡`
- `提袋加購`

本文件要回答的不是「字串怎麼 match」，而是：

1. 這個項目在 Ivyhouse 應屬哪一種正式實體？
2. 它應否升成 `銷售商品SKU_正式`？
3. 若不應升成商品，應落到哪種例外或哪種底層主資料？
4. 下一步 `matchedProductName -> SKU` 接線時，哪些可以自動 lookup，哪些絕對不行？

## 決策摘要

| 特殊項 | 正式分類 | 是否升成正式銷售商品 | 底層 owner / 關聯 | intake 路徑 |
|------|----------|----------------------|-------------------|-------------|
| `補寄商品專用/勿下單` | 作業標記 / 例外標記 | 否 | 後續應建模於補寄或人工處理流程，不屬商品主資料 | 一律走例外，不做 SKU lookup |
| 咖啡 / `濾掛咖啡` | 正式銷售商品家族 | 是 | `銷售商品主檔` + `內包裝完成品主檔` + `外包裝材料主檔` | 可做正式 SKU lookup；資訊不足時走例外 |
| `提袋加購` | 正式附加購銷售商品 | 是 | `銷售商品主檔` 對應 `出貨用品 / 包裝耗材` 主資料 | 可做正式 SKU lookup；若袋型不明則走例外 |

## 核心原則

### 原則 1：不得把作業標記當商品

- 凡是只表達作業意圖、人工提醒、補寄背景或禁止直接下單語意的字串，不得升成正式銷售商品。
- 這類文字應保留在 intake / exception 流程中，供人工判斷與後續補寄流程建模使用。

### 原則 2：不得把底層物料 key 直接當 sellable SKU

- 內包裝完成品 key、外包裝材料 key、出貨用品 key 都有自己的 owner 與用途。
- 即使某個對客販售商品以包材或提袋為主體，也必須先建立正式 `銷售商品SKU_正式`，再由組成或引用關係連到底層主資料。

### 原則 3：不得為了提高命中率而靜默忽略

- analyzer repo 過去對部分咖啡與 `提袋加購` 採略過策略，但 Ivyhouse 不接受這種做法。
- 若系統尚未準備好正式承接，正確行為是進未映射例外，而不是丟掉該需求。

## 規則 A：`補寄商品專用/勿下單`

### 正式分類

- 分類：作業標記 / 例外標記
- 是否為正式銷售商品：否
- 是否為可治理 mapping target：否

### 判斷理由

1. 此字串描述的是作業情境，不是穩定對客販售商品。
2. 它不具備正式商品最小條件：穩定名稱、規格、組成與履約內容。
3. `勿下單` 語意與正式接單商品直接衝突，不能透過主資料正規化把它洗成有效商品。

### Intake 規則

1. 命中此類字串時，必須保留原始文字與來源列位。
2. 不得直接指派任何 `銷售商品SKU_正式`。
3. 必須進入例外處理，並標記為「作業標記型例外」或等價類型。
4. 若實際需要補寄商品，必須另有真正的商品明細行，或由人工在例外流程中補全，不得從此標記字串反推商品。

### 後續建模方向

- 若未來要支援正式補寄流程，應建立補寄原因、補寄單或訂單補寄標記等正式交易 / 作業模型。
- 不得以建立一個名為 `補寄商品專用/勿下單` 的 sellable SKU 取代流程建模。

## 規則 B：咖啡 / `濾掛咖啡` / `濾掛式咖啡`

### 正式分類

- 分類：正式銷售商品家族
- 是否為正式銷售商品：是
- 底層關聯：
  - 銷售商品層：單包、40 包盒裝、60 包盒裝、綜合盒裝等 sellable SKU
  - 內包裝層：`K1001-K4001` 等單包內包裝完成品
  - 外包裝層：咖啡盒裝對應 `PK0002/PK0003/PK0005/PK0006/PK0009/PK0010` 等包材

### 判斷理由

1. `銷售商品主檔權威規格` 已明確把咖啡 40 / 60 包盒裝納入正式 sellable scope。
2. 既有主資料樣板已存在咖啡單包內包裝、盒裝組成與包材引用，表示這不是暫時文案，而是已可治理的商品家族。
3. intake 真實樣本已出現咖啡需求，若不升成正式商品，將破壞訂單、履約與庫存追溯的一致性。

### Intake 規則

1. 咖啡直售品項必須 lookup 到 `銷售商品SKU_正式`，不得停留在單純字串命中。
2. lookup 必須優先依味型、規格與包數判斷；若資訊不足以唯一決定 SKU，必須進例外。
3. 不得把咖啡 sellable line 直接接到內包裝 key；內包裝 key 只作為組成 / 扣帳依據。
4. 若來源文字其實是禮盒子項或組合內容，仍應遵守組成治理，不應額外創造新的 sellable identity。

### 例外條件

下列情況不得硬配，必須進例外：

1. 只有 `咖啡` 字樣，沒有味型或規格，且現行主檔不足以唯一解析。
2. 味型存在，但規格缺失，且同味型有多個 active sellable SKU。
3. 渠道文案指向尚未建檔的新咖啡口味或新包數。

## 規則 C：`提袋加購`

### 正式分類

- 分類：正式附加購銷售商品
- 是否為正式銷售商品：是
- 底層關聯：`銷售商品主檔` 對應 `出貨用品 / 包裝耗材` 主資料中的提袋 / 袋類物料

### 判斷理由

1. `提袋加購` 是對客收費項目時，已屬正式履約需求，而不是單純內部包材耗用。
2. `提袋` 底層物料仍屬 `出貨用品 / 包裝耗材` owner 範圍，不能直接把 `PK` 或袋類物料 key 當 sellable SKU。
3. 若不建立正式附加購商品，後續訂單、發票、營收與履約都會失去一致的商品維度。

### Intake 規則

1. `提袋加購` 應 lookup 到正式附加購 sellable SKU，而不是直接接到包材 key。
2. 若目前只允許一種 active 提袋加購商品，可由映射規則直接命中該 SKU。
3. 若已有多種袋型、尺寸或價位並存，而來源文字不足以判定，必須進例外，等待人工指定。
4. 免費附贈、預設包裝或內部出貨耗材，不得因名稱含有提袋就被當成 `提袋加購` sellable line。

### 主資料分層要求

1. 銷售商品層：定義 `提袋加購` 對客販售身分、價格與通路可見性。
2. 出貨用品層：定義實際提袋物料、袋型、庫存單位與停用規則。
3. 組成 / 引用層：定義某 sellable add-on 對應耗用哪個袋類主資料。
4. family 命名與 alias 層：詳見 `bag_family_naming_and_alias_rules.md`，用於控制單一 active SKU 直連與未來多尺寸擴充時的 alias 分流。

## `matchedProductName -> SKU` 接線規則

### 可以自動 lookup 的情況

1. 咖啡：`matchedProductName` 與規格足以唯一決定 active `銷售商品SKU_正式`。
2. `提袋加購`：active sellable add-on SKU 唯一，且 channel alias 規則能唯一命中。

### 絕對禁止自動 lookup 的情況

1. `補寄商品專用/勿下單`
2. 任何只代表作業標記、補寄背景、人工提醒或禁止下單語意的字串
3. 任一 `matchedProductName` 對到多筆 active sellable SKU，卻沒有足夠規格資訊時

### 必要前置條件

1. 咖啡對應的 sellable product master 必須是 active，且規格與口味資料完整。
2. `提袋加購` 必須先在 sellable product master 建立正式商品，並有對應袋類主資料關聯。
3. exception taxonomy 至少要能區分：
   - 作業標記型例外
   - 商品資訊不足型例外
   - 主資料未建檔型例外

## 與既有文件的關係

- 本文件補的是特殊項治理分類，並不取代：
  - `sellable_product_master_spec.md` 的正式 sellable contract
  - `shared_key_contract.md` 的 key owner / consumer 契約
  - `channel_product_mapping_governance.md` 的 parser / mapping / composition 分層原則
- 若後續發現 `提袋加購` 需要新的商品類型欄位或補寄流程需要新 state model，必須先補權威文件，再修改 runtime。

## 驗收基準

### 驗收 1：三類特殊項不再語意混用

- 補寄標記、咖啡 sellable、提袋附加購三者的 owner 與 downstream 路徑可清楚區分。

### 驗收 2：下一步 SKU 接線有明確禁止事項

- 系統不會把作業標記洗成商品，也不會把包材 key 直接當 sellable SKU。

### 驗收 3：無法唯一決定商品時走例外

- 系統在資訊不足時保留可追溯例外，而不是硬配或靜默忽略。

## 依據文件

- `doc/architecture/data/README.md`
- `doc/architecture/data/master_data_dictionary.md`
- `doc/architecture/data/shared_key_contract.md`
- `doc/architecture/data/sellable_product_master_spec.md`
- `doc/architecture/data/channel_product_mapping_governance.md`
- `doc/architecture/flows/channel_intake_exception_resolution_spec.md`
- `project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv`
- `project_maintainers/data/active/master-data/2026-03-25_內包裝完成品主檔_template.csv`
- `project_maintainers/data/active/master-data/2026-03-25_外包裝材料主檔_template.csv`