# Channel Mapping Rule Inventory Bootstrap

更新日期：2026-03-30

Authoritative source：否（bootstrap inventory draft）

## 目的

本文件把 `foreverjojo/picking-order-analyzer` 目前對 MOMO / 官網 / 蝦皮 / 橘點子的 mapping 邏輯，整理成 Ivyhouse 可審查的 rule inventory。它的用途是提供 Phase 1 bootstrap engine 的規則邊界與測試依據，不是直接把 analyzer 的 if/else 宣告成 Ivyhouse 長期正式規則來源。

## 使用原則

1. analyzer repo 是 bootstrap reference，不是 authoritative source。
2. inventory 只整理「規則家族、匹配訊號、輸出欄位、已知偏差」，不把 legacy 寫死行為直接視為正式政策。
3. 凡與 Ivyhouse 治理文件衝突者，以 Ivyhouse 文件為準。

## analyzer runtime 共通輸出模型

analyzer 各平台 mapping 函數共同輸出：

- `templateProduct`
- `templateColumn`
- `templateSpec`
- `multiplier`
- `mappedQuantity`
- `confidence`

Ivyhouse bootstrap 期同樣保留這六類語意，但會改寫成較適合 API / review 的 `mappingResult` 欄位。

## 平台分派規則

analyzer `MappingEngine` 的平台分派如下：

- `momo` 與 `official` 共用 `MomoMapping`
- `shopee` 使用 `ShopeeMapping`
- `orangepoint` 使用 `OrangePointMapping`

此外還有兩類平台前置規則：

- `活動拆分` 直接映到 `瑪德蓮-*` + `單顆`
- `組合拆分` 直接映到 `豆塔-*` + `10入袋裝`

## 共通 rule family

### 1. 商品家族辨識

四平台核心都不是先找 SKU，而是先判斷商品家族，再抽出口味與規格：

- 禮盒
- 瑪德蓮
- 瓦片 / 杏仁瓦片
- 夏威夷豆塔 / 豆塔
- 堅果塔
- 雪花餅
- 奶油曲奇 / 奶油餅乾
- 西點餅乾
- 千層小酥條
- 無調味堅果
- 椰棗
- 牛奶糖
- 土鳳梨酥
- 雙塔
- 南棗核桃糕
- 鳳凰酥

### 2. 口味 / 子類型訊號

analyzer 大量使用 flavor keyword，主要包含：

- `蔓越莓`
- `焦糖`
- `巧克力`
- `抹茶`
- `椒麻`
- `綜合`
- `蜂蜜`
- `原味`
- `紅茶`
- `海苔`
- `黑糖`
- `青花椒`
- `金沙`
- `肉鬆`
- `檸檬`
- `柑橘`
- `咖哩`

### 3. 規格家族

analyzer 會從 `spec` 優先，其次回退到 `name` 擷取規格，主要規格家族如下：

- 克重：`300g / 280g / 200g / 150g / 135g / 120g / 90g / 60g / 50g / 45g`
- 入數：`15入袋裝 / 12入袋裝 / 10入袋裝 / 8入袋裝`
- 單顆：`單顆 / 活動專用 / 活動`
- 禮盒：`禮盒`
- 小包裝：`小酥條`

### 4. 倍率規則

MOMO / 官網與蝦皮都有倍數語意，但來源不同：

- `x2袋 / x1袋 / x2包` 類累加或選項字串
- `2包組 / 3袋組`
- `2盒`
- `活動專用 6入` 這類以 `入數` 作為 multiplier
- OrangePoint 預設 `multiplier = 1`

### 5. 規格欄位優先序

- MOMO / 官網：先用 `spec`，若 `spec` 無有效克重 / 入數，再回退 `name`
- 蝦皮：同樣是 `spec` 優先，並會先去掉平台前綴
- OrangePoint：大多直接從單一品名字串辨識，不依賴獨立 spec 欄

## 平台差異 inventory

### MOMO / 官網

主要規則家族：

1. 禮盒關鍵字優先，命中後直接落 `禮盒` 規格。
2. 針對瓦片 / 瑪德蓮 / 雪花餅 / 豆塔 / 堅果塔 / 奶油 / 西點等家族用 flavor keyword 決定標準商品。
3. 倍數邏輯最複雜，會特別處理：
   - 多段 `xN`
   - 單包與多包組混寫
   - 口味段落重複導致的 PDF 誤算風險
4. `45g 原味瓦片` 被視為獨立特例。
5. `小酥條` 直接映到 `小包裝`。

### 蝦皮

主要規則家族：

1. 先移除平台前綴如 `【艾薇手工坊】`。
2. 口味辨識偏向從 `spec` 先找，再回頭讀 `name`。
3. 對禮盒、瓦片、瑪德蓮、無調味堅果、西點、豆塔、堅果塔、奶油餅乾有獨立分支。
4. 規格與倍率相對簡化，但仍處理 `xN包` 與 `活動 / 單顆`。
5. 成功映射前會先清掉欄位 / 規格，避免產生半套 mapping。

### 橘點子

主要規則家族：

1. 幾乎全部從單一 `productName` 解析，不讀獨立 spec。
2. 瓦片、豆塔、堅果塔常依 `[]` 或 `()` 中的 flavor 文字決定標準商品。
3. 禮盒直接落 `禮盒` 規格。
4. `小酥條` 直接落 `小包裝`。
5. `mappedQuantity` 直接等於 quantity，不另外乘倍率。

## analyzer legacy behavior 與 Ivyhouse 偏差

### 1. `提袋加購`

analyzer 在 MOMO / 蝦皮有直接忽略 `提袋加購` 的 legacy 邏輯。

Ivyhouse 偏差：

- 不可靜默忽略
- bootstrap engine 應顯式輸出 `mappingResult`
- 若尚未接上正式主資料，也必須保留為可見的治理對象

### 2. 非禮盒咖啡

analyzer 在 MOMO / 蝦皮對大部分 `咖啡` 會直接忽略，只保留 `咖啡小花` 或禮盒相關情境。

Ivyhouse 偏差：

- `濾掛式咖啡` 與其他正式履約項不得靜默忽略
- 需明確映射或顯式未映射，不可消失

### 3. 贈品與試吃子項

analyzer 與原始 parser 流程對 gift / trial 的界線較偏工具性。

Ivyhouse 偏差：

- `贈品`、`試吃:` 展開後子項都屬可追溯 intake 結果
- bootstrap engine 應對展開後子項做正常 mapping，而非依舊視為 parser 雜訊

## Phase 1 bootstrap engine 收斂策略

本輪 engine 只實作以下最小能力：

1. 依渠道選擇對應 rule family。
2. 輸出命中商品名、規格、倍率、對應數量、信心與規則代碼。
3. 對 Ivyhouse 明確不接受靜默忽略的項目，輸出顯式 mapping 或顯式未映射。
4. 不處理正式主資料發布、例外升級與 BOM 爆炸。

## 後續治理缺口

以下仍屬後續正式化工作，不在 bootstrap inventory 內完成：

1. `sellableProductSku` 正式主鍵接線
2. mapping rule master data 與版本 / 生效日管理
3. proposal / review / publish workflow
4. 與 BOM / 組成規則的正式串接

## 關聯文件

- `doc/architecture/data/channel_product_mapping_governance.md`
- `doc/architecture/flows/channel_intake_parser_contract.md`
- `doc/architecture/flows/channel_intake_api_contract.md`
- `doc/architecture/flows/channel_intake_state_machine.md`