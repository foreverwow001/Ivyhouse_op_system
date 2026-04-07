# 提袋 Alias Inventory

> 狀態：Adopted Draft
> 最後更新：2026-03-30

## 目的

本文件用於把目前各渠道已觀察到的提袋相關文案，逐條收斂成可治理的 alias inventory，作為 `提袋加購` family 在 intake bootstrap 與後續 mapping rule 的直接依據。

## 適用範圍

- `提袋加購` family 的渠道別名
- `提袋加購` 與非 sellable 提袋字樣的分流邏輯
- `bag_family_naming_and_alias_rules.md` 中所稱的受控 alias 清單

## 當前 active target

| 欄位 | 值 |
|------|----|
| 正式 SKU | `O00001` |
| 正式銷售商品名稱 | `提袋加購` |
| 正式販售規格 | `單入提袋` |
| 底層包材 | `PK0014 手提夾鏈袋` |
| 生效前提 | bag family 目前只有單一 active SKU |

## 正向 Alias Inventory

以下 alias 在 bag family 僅有單一 active SKU `O00001` 的前提下，可直接歸一到 `提袋加購 / 單入提袋`。

| Alias ID | 渠道 | 觀察來源 | 原始文案 | 正規化後文案 | Alias 類型 | 對應正式 SKU | 對應正式名稱 | 對應規格 | 狀態 | 備註 |
|----------|------|----------|----------|--------------|------------|----------------|--------------|----------|------|------|
| `BAG-ALIAS-001` | `OFFICIAL` | `官網-撿貨單-2.xlsx` / `官網-撿貨單-3.xlsx` mapping fixture | `提袋加購` | `提袋加購` | exact alias | `O00001` | `提袋加購` | `單入提袋` | 啟用 | 目前官網直接命中單一 active bag SKU |
| `BAG-ALIAS-002` | `SHOPEE` | `蝦皮-撿貨單-2.pdf` parser fixture | `提袋加購 1只` | `提袋加購` | normalized alias | `O00001` | `提袋加購` | `單入提袋` | 啟用 | `1只` 視為單件數量噪音，不承載 variant 語意 |
| `BAG-ALIAS-003` | `SHOPEE` | parser 正規化後字串 | `【艾薇手工坊】提袋加購 1只` | `提袋加購` | normalized alias | `O00001` | `提袋加購` | `單入提袋` | 啟用 | 品牌前綴由 parser 去除後再進 bag lookup |

## 排除 Alias Inventory

以下字樣雖與提袋有關，但不得直接當成 `提袋加購` sellable alias。

| Alias ID | 類型 | 觀察來源 | 原始文案 | 排除原因 | 正確去向 |
|----------|------|----------|----------|----------|----------|
| `BAG-NONSELLABLE-001` | 包材主資料字樣 | 外包裝材料主檔 / 組成表 | `手提夾鏈袋` | 只代表底層包材，不代表對客收費商品 | `PK0014` 包材主資料 |
| `BAG-NONSELLABLE-002` | 禮盒包材字樣 | 組成表 | `提袋-鐵盒-禮盒` | 屬禮盒包材列，不能洗成附加購商品 | `PK0013` 包材主資料 |
| `BAG-NONSELLABLE-003` | generic bag string | 規則排除 | `提袋` | family 若未提供更多語意，無法區分收費 add-on 與一般包材 | 進例外或依包材脈絡處理 |
| `BAG-NONSELLABLE-004` | freebie / 包裝字樣 | 規則排除 | `免費提袋` / `附贈提袋` | 不屬對客收費 sellable line | 不建立 sellable mapping |

## 正規化規則

### 允許的 normalization

1. 去除品牌前綴，例如 `【艾薇手工坊】`。
2. 去除空白與全半形差異。
3. 去除單件數量噪音，例如 `1只`。

### 禁止的 normalization

1. 不得把 `提袋-鐵盒-禮盒`、`手提夾鏈袋` 正規化成 `提袋加購`。
2. 不得因名稱中含有 `提袋` 就自動歸一到 `O00001`。
3. bag family 一旦出現多筆 active SKU，不得再把 generic `提袋加購` 直接映射單一 SKU。

## 擴充規則

### 新 alias 可直接加入 inventory 的條件

1. 能唯一歸一到當前 active `提袋加購` SKU。
2. 不會與既有禮盒包材或出貨耗材字樣混淆。
3. 經人工覆核後，可證明屬對客收費附加購商品。

### 必須先進例外，再決定是否納入 inventory 的條件

1. 渠道出現 `大提袋`、`小提袋`、`禮盒提袋` 等新尺寸 / 新袋型字樣。
2. bag family 已不只一筆 active SKU，但來源文案仍只有 `提袋加購`。
3. 新字樣可能同時指向包材與 sellable 商品。

## 維護責任

1. Channel mapping owner：新增、停用與覆核 alias inventory。
2. Master Data owner：維護 alias 對應的正式 SKU 是否仍為 active。
3. Runtime owner：只消費本 inventory 中 `啟用` 的 alias，不自行擴充硬編碼字串。

## 關聯文件

- `doc/architecture/data/bag_family_naming_and_alias_rules.md`
- `doc/architecture/data/channel_intake_special_item_governance.md`
- `doc/architecture/data/channel_product_mapping_governance.md`