# 提袋 Family 命名與 Alias 規則

> 狀態：Adopted Draft
> 最後更新：2026-03-30

## 目的

本文件用於定義 `提袋加購` family 的正式命名方式、alias 治理原則與 future expansion 規則，避免未來新增不同尺寸或袋型時，需要回頭重構 intake mapping。

## 適用範圍

- `銷售商品主檔` 中屬於提袋附加購 family 的正式 `銷售商品SKU_正式`
- intake bootstrap 與後續 channel mapping rule 對提袋相關字樣的自動命中規則
- `提袋加購` 與底層 `出貨用品 / 包裝耗材` 主資料之間的關聯治理

## 當前有效基線

### 單一 active SKU

- 目前只有一款 active 對客提袋附加購商品
- 正式 SKU：`O00001`
- 正式銷售商品名稱：`提袋加購`
- 正式販售規格：`單入提袋`
- 底層引用包材：`PK0014 手提夾鏈袋`

### 單一 active SKU 的 runtime 規則

1. 當 family 內只有一筆 active SKU 時，intake 可將受控 alias 直接 lookup 到該 SKU。
2. 目前 `提袋加購` family 的 direct lookup 目標固定為 `O00001`。
3. 若未來 family 內出現第二筆 active SKU，generic alias 不可再直接命中單一 SKU，必須改成 alias 分流或進例外。

## 命名規則

### 規則 1：family 名稱與 variant 名稱分離

1. family 基底名稱固定使用 `提袋加購`。
2. 當只有單一 active SKU 時，可直接使用 `提袋加購` 作為 `銷售商品名稱`。
3. 當存在多個 active variant 時，`銷售商品名稱` 必須改成 `提袋加購-<variant識別詞>`。

### 規則 2：variant 識別詞的選擇原則

1. 優先使用能穩定區分履約與計價差異的識別詞，例如尺寸、袋型、材質。
2. 不得使用促銷文案、暫時備註、平台活動字串作為 variant 識別詞。
3. 不得把底層包材 key 直接嵌入 sellable 名稱。

### 規則 3：販售規格欄位

1. 目前單一 active 提袋商品的正式 `販售規格` 固定為 `單入提袋`。
2. 若未來仍是單件販售但有不同尺寸，優先保持 `販售規格 = 單入提袋`，由 `銷售商品名稱` 承接 variant 識別。
3. 只有在計價單位或販售包裝方式改變時，才應調整 `販售規格`，例如多入包或組合裝。

## Alias 規則

alias 的具體 inventory 與渠道觀察樣本，另見 `bag_alias_inventory.md`。

### 可直接歸一的 alias

以下字樣在目前單一 active SKU 前提下，可歸一為 `提袋加購 / 單入提袋`：

- `提袋加購`
- `提袋加購 1只`
- `提袋加購1只`
- 去除品牌前綴後的 `提袋加購`

### 可做 normalization，但不可單獨視為 variant 的噪音

- 品牌前綴，例如 `【艾薇手工坊】`
- 空白與全形半形差異
- 單件數量噪音，例如 `1只`

### 不得直接當成 `提袋加購` sellable alias 的字樣

- `提袋`
- `提袋-鐵盒-禮盒`
- `免費提袋`
- `附贈提袋`
- 任一只表示包裝耗材、不表示對客收費商品的字樣

## 多尺寸 / 多袋型擴充規則

### 何時必須新建 SKU

以下任一成立，應新建新的 `銷售商品SKU_正式`：

1. 對客售價不同
2. 實際履約袋型不同
3. 尺寸不同且會影響客戶選購語意
4. 底層對應包材不同，且不可視為同一 sellable 商品的可忽略替代

### 新 variant 建檔要求

1. 先在 `銷售商品主檔` 建立新的正式 SKU。
2. 再在組成 / 引用層補對應的包材關聯。
3. 同步補 channel alias 規則，明確列出哪些文案應命中該 variant。
4. 更新 intake fixture 與 smoke 驗證。

### 何時必須進例外

1. family 內存在多筆 active SKU，但來源文字只有 `提袋加購`。
2. 來源文字不足以判斷尺寸、袋型或材質。
3. 渠道出現未建檔的新提袋命名。

## Intake Mapping 約束

1. runtime 不得直接以 `PK0014` 或其他包材 key 作為 `sellableProductSku`。
2. single-SKU direct lookup 只在 `O00001` 是唯一 active family member 時成立。
3. 若未來 family 擴充，優先新增 alias inventory 與 lookup table，不得以硬編碼 if-else 疊加不受控特殊字串。

## 維護責任

1. Master Data owner：維護正式 SKU、名稱、規格、狀態與底層引用關係。
2. Channel mapping owner：維護 alias inventory、direct lookup 條件與例外判準。
3. Runtime owner：只消費已核定的正式 SKU 與 alias 規則，不自行創造新提袋代碼。

## 與既有文件關係

- 本文件補的是提袋 family 的命名與 alias 治理細則。
- `channel_intake_special_item_governance.md` 負責定義提袋屬正式附加購商品。
- `sellable_product_master_spec.md` 負責正式 sellable SKU contract。
- `shared_key_contract.md` 負責 shared key 不可變與 consumer 義務。