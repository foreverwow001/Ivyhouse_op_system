# SESSION-HANDOFF — 日常營運流程收集 + SKU / 內包裝名稱對齊

> 建立日期：2026-03-31
> 涵蓋範圍：2026-03-30 ~ 2026-03-31 兩輪對話
> 前序 handoff：`2026-03-27_phase0-master-data-and-rbac_handoff.md`

---

## Current goal

本輪完成了三大塊工作：

1. **SKU 全面對齊**：將 sellable 主檔修正的 SKU（含提袋 `O00001`、A/B/H/K/M/P family 短碼）同步到組成表、bootstrap mapping runtime、fixture expectations、governance docs 與 repo memory。
2. **內包裝完成品椰棗名稱修正**：Y1-Y5 的內包裝完成品正式名稱從帶重量版（`★中東椰棗300g`、`椰棗豆子150g` 等）改為無重量版（`★中東椰棗`、`椰棗豆子` 等），並同步至組成對照表。
3. **日常營運流程收集**：透過多輪結構化問答，收集了從早上匯入訂單到下班前回填的完整日常流程，涵蓋庫存扣帳、排工計畫、食材扣除、回填、人工盤點與負庫存政策。

下一位接手者的優先目標：**把本 handoff 的流程規則整理成正式權威規格文件**，落到 `doc/architecture/flows/` 下。

---

## Current branch

- `main`

## Active environment

- Dev Container / Debian GNU/Linux 12 (bookworm)
- Node.js + npm workspaces / TypeScript / NestJS / Prisma
- 驗證命令：`npm run test:api:mapping:fixtures`（18/18 通過）、`npm run test:api:mapping:smoke`
- 已知良性警告：Node `buffer.File` experimental warning，不影響功能
- 注意：CSV 讀取偶有 editor cache/disk 差異，涉及 CSV 校驗時以 terminal `cat`/`sed` 為準

---

## Files touched

### SKU 對齊（2026-03-30）

| 檔案 | 變更摘要 |
|------|---------|
| `project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv` | 提袋 SKU `ADD0001` → `O00001`；68 筆 A/B/H/K/M/P family SKU 從長碼改短碼（如 `A100010` → `A10010`、`K000040` → `K00040`）；椰棗 Y1-Y5 內包裝名稱去重量 |
| `apps/api/src/intake/mapping/bootstrap-mapping.engine.ts` | 提袋直接映射 `O00001`；coffee lookup map 改短碼 |
| `apps/api/test/fixtures/intake-mapping-fixtures.json` | 提袋 expected SKU → `O00001`；coffee expected SKUs 改短碼 |
| `doc/logs/Idx-010_log.md` | 記錄 SKU 對齊決策與 bag family 新增 |
| `doc/architecture/data/bag_family_naming_and_alias_rules.md` | 新建：提袋 family 命名/alias/擴展規則 |
| `doc/architecture/data/bag_alias_inventory.md` | 新建：各渠道提袋 alias 正面清單與排除清單 |
| `doc/architecture/data/README.md` | 新增 bag 相關文件連結 |
| `doc/architecture/data/channel_intake_special_item_governance.md` | 補充 bag family naming layer 連結 |

### 內包裝椰棗名稱修正（2026-03-30）

| 檔案 | 變更摘要 |
|------|---------|
| `project_maintainers/data/active/master-data/2026-03-25_內包裝完成品主檔_template.csv` L36-40 | B 欄 + C 欄名稱去除重量：`★中東椰棗300g` → `★中東椰棗`、`椰棗豆子150g` → `椰棗豆子`、`椰棗腰果150g` → `椰棗腰果`、`椰棗杏仁150g` → `椰棗杏仁`、`椰棗核桃150g` → `椰棗核桃` |
| `project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv` L112-116 | 組成表中引用 Y1-Y5 的「內包裝完成品名稱」欄位同步去重量 |

### 未觸碰但仍在舊名稱的檔案（已知但不需要改）

| 檔案 | 說明 |
|------|------|
| `project_maintainers/data/active/master-data/2026-03-26_銷售商品主檔_template.csv` | sellable 商品名如 `★中東椰棗300g` 保留不動，因為 sellable 名稱包含規格是正確的 |
| `project_maintainers/data/active/master-data/2026-03-25_外包裝材料主檔_template.csv` L16 | PK0015 的「適用對象」欄位引用 `★中東椰棗300g / 300g` 等，此處引用的是 sellable 商品名而非內包裝名稱 |
| `apps/api/src/intake/mapping/bootstrap-mapping.engine.ts` L510-514 | regex → 名稱 lookup 仍寫 `★中東椰棗300g` 等，此處映射的是 sellable matched name，不是內包裝名稱 |
| `apps/api/test/fixtures/intake-mapping-fixtures.json` | `expectedMappedProducts` 仍含 `★中東椰棗300g`，這是 sellable 商品名，正確 |
| `project_maintainers/chat/archive/2026-03-24_picking-order-analyzer-product-catalog.md` | archive 檔不改 |

---

## 日常營運流程 — 完整收集結果

### 一、訂單來源與接單

| 項目 | 結論 |
|------|------|
| 訂單來源 | 電商（MOMO/蝦皮/官網/橘點子）、LINE/電話/人工、企業大單/團購、門市 |
| 接單必填欄位 | 客戶/渠道、商品/規格/數量、出貨日/到貨日、收件人資訊、付款/對帳方式、備註 |
| 工單 vs 製作單 | 目前無正式區分，未來可能分離 |

### 二、三張表單 — 核心視圖

#### 表 1：包裝部庫存表單

包裝部每天使用此表確認各品項庫存，決定是否需要額外包裝作業。

**可銷售成品類別（sellable stock）：**

| # | 類別 |
|---|------|
| 1 | 無調味堅果 |
| 2 | 椰棗 |
| 3 | 糖果 |
| 4 | 杏仁瓦片 |
| 5 | 奶油曲奇 |
| 6 | 西點餅乾 |
| 7 | 千層餅乾 |

**內包裝完成品類別（inner-pack-finished stock）：**

| # | 品項 | 所屬分類 |
|---|------|---------|
| 1 | 堅果塔-蜂蜜 | 堅果塔 |
| 2 | 堅果塔-焦糖 | 堅果塔 |
| 3 | 堅果塔-巧克力 | 堅果塔 |
| 4 | 堅果塔-海苔 | 堅果塔 |
| 5 | 堅果塔-咖哩 | 堅果塔 |
| 6 | 豆塔-蔓越莓 | 夏威夷豆塔 |
| 7 | 豆塔-焦糖 | 夏威夷豆塔 |
| 8 | 豆塔-巧克力 | 夏威夷豆塔 |
| 9 | 豆塔-抹茶 | 夏威夷豆塔 |
| 10 | 豆塔-椒麻 | 夏威夷豆塔 |
| 11 | ★中東椰棗 | 椰棗 |
| 12 | 椰棗豆子 | 椰棗 |
| 13 | 椰棗腰果 | 椰棗 |
| 14 | 椰棗杏仁 | 椰棗 |
| 15 | 椰棗核桃 | 椰棗 |
| 16 | 牛奶糖 | 糖果 |
| 17 | 南棗核桃糕 | 糖果 |
| 18 | 雪花餅-蔓越莓 | 雪花餅 |
| 19 | 雪花餅-巧克力 | 雪花餅 |
| 20 | 雪花餅-金沙 | 雪花餅 |
| 21 | 雪花餅-抹茶 | 雪花餅 |
| 22 | 雪花餅-肉鬆 | 雪花餅 |
| 23 | 土鳳梨酥(紅點) | 西點餅乾 |
| 24 | 鳳凰酥 | 西點餅乾 |
| 25 | 瑪德蓮-蜂蜜 | 瑪德蓮 |
| 26 | 瑪德蓮-巧克力 | 瑪德蓮 |
| 27 | 瑪德蓮-紅茶 | 瑪德蓮 |
| 28 | 瑪德蓮-抹茶 | 瑪德蓮 |
| 29 | 瑪德蓮-柑橘 | 瑪德蓮 |
| 30 | 瑪德蓮-檸檬 | 瑪德蓮 |

#### 表 2：出貨部當天訂單需求表單

出貨部看的是當天所有訂單匯總後的需求量，用以決定撿貨與組裝。

**可銷售成品類別：**

| # | 類別 | 備註 |
|---|------|------|
| 1 | 夏威夷豆塔 | 出貨端現場組裝 |
| 2 | 堅果塔 | 出貨端現場組裝 |
| 3 | 塔類-綜合 | 出貨端現場組裝 |
| 4 | 雪花餅 | 出貨端現場組裝 |
| 5 | 瑪德蓮 | 出貨端現場組裝 |
| 6 | 鐵盒禮盒 | 出貨端現場組裝，不做日終回填 |
| 7 | 紙盒禮盒 | 出貨端現場組裝，不做日終回填 |
| 8 | 濾掛咖啡 | 不做日製作回填，只靠既有庫存出貨 |
| 9 | 無調味堅果 | — |
| 10 | 椰棗 | — |
| 11 | 糖果 | — |
| 12 | 杏仁瓦片 | — |
| 13 | 奶油曲奇 | — |
| 14 | 西點餅乾 | — |
| 15 | 千層餅乾 | — |

**關鍵語意**：出貨部的「夏威夷豆塔、堅果塔、塔類-綜合、雪花餅、瑪德蓮、鐵盒禮盒、紙盒禮盒、濾掛咖啡」這 8 類在可銷售成品庫存中實際不一定有現貨，它們是由出貨人員從內包裝完成品或單包零件現場組裝出貨。因此這些品項在包裝部庫存表中不會出現在「可銷售成品」區塊。

#### 表 3：包材 / 出貨耗材盤點表

- 確認存在第三張盤點表，專門管理外包裝材料與出貨耗材。
- 提袋等加購品也納入此表。
- 此表用途為定期盤點與人工調整，不屬前兩張日常作業表。

### 三、早上匯入與庫存扣帳規則

#### 匯入範圍

- 早上匯入所有渠道的撿貨單/訂單。
- 匯入後**只扣當天訂單**的庫存。

#### 各 family 扣帳桶分類

**只扣內包裝完成品（inner-pack-finished）的 family：**

這些品類在可銷售成品庫存中實際沒有現貨，由出貨人員從 inner-pack 現場組裝出貨：

| Family | 說明 |
|--------|------|
| 夏威夷豆塔 | 出貨端組裝 |
| 堅果塔 | 出貨端組裝 |
| 塔類-綜合 | 出貨端組裝 |
| 雪花餅 | 出貨端組裝 |
| 瑪德蓮 | 出貨端組裝 |

**先扣可銷售成品，不夠再 1:1 扣內包裝完成品的 family（雙桶 fallback）：**

| Family | 說明 |
|--------|------|
| 奶油曲奇 | 雙桶 fallback |
| 西點餅乾 | 雙桶 fallback |
| 杏仁瓦片 | 雙桶 fallback |
| 糖果 | 雙桶 fallback |
| 椰棗 | 雙桶 fallback |

**只扣可銷售成品（sellable）的 family：**

| Family | 說明 |
|--------|------|
| 無調味堅果 | 直接扣 sellable |
| 千層餅乾 | 直接扣 sellable |

**特殊 family：**

| Family | 說明 |
|--------|------|
| 鐵盒禮盒 | 出貨端現場組裝，通常不做日終回填 |
| 紙盒禮盒 | 出貨端現場組裝，通常不做日終回填 |
| 濾掛咖啡 | 不做日製作回填，只靠既有庫存出貨（單包/盒裝）；走採購/入庫 |
| 提袋等加購品 | 不做回填，走採購/入庫；定期人工盤點調整 |

#### 其他扣帳桶

匯入訂單時還會扣除：
- 完全包裝可銷售成品庫存
- 外包裝材料庫存
- 提袋/加購品包材庫存

### 四、下班前排工計畫

- 每天下班前，依**當天扣帳後**的庫存餘量，為**明天**的工作做排程。
- 排程的計畫單位：
  - **可銷售成品 level**：無調味堅果、千層餅乾
  - **內包裝完成品 level**：堅果塔、夏威夷豆塔、椰棗、糖果、雪花餅、瑪德蓮、奶油曲奇、西點餅乾、杏仁瓦片
- 排工確定後，應立即扣除對應食材/原料（BOM 扣帳），含半成品。
- **任何排程數量的變更都必須觸發 BOM 重新計算**，回沖舊扣除、重算新扣除。

### 五、下班前回填

- **所有回填動作一律由內包裝人員執行**，無論回填目標是內包裝完成品或可銷售成品。
- 內包裝完成品**不會自動轉成可銷售成品**；都是手工回填。

#### 回填目標桶

**回填到內包裝完成品桶的 family：**

| 品項分類 | 說明 |
|---------|------|
| 堅果塔 | 回填 inner-pack-finished |
| 夏威夷豆塔 | 回填 inner-pack-finished |
| 椰棗（部分） | 回填 inner-pack-finished |
| 糖果（部分） | 回填 inner-pack-finished |
| 雪花餅 | 回填 inner-pack-finished |
| 瑪德蓮 | 回填 inner-pack-finished |

**回填到可銷售成品桶的 family：**

| 品項分類 | 說明 |
|---------|------|
| 奶油曲奇 | 回填 sellable |
| 西點餅乾 | 回填 sellable |
| 杏仁瓦片 | 回填 sellable |
| 千層餅乾 | 回填 sellable |
| 無調味堅果 | 回填 sellable |
| 椰棗（部分） | 部分也回填 sellable |
| 糖果（部分） | 部分也回填 sellable |

**不做日終回填的 family：**

| 品項分類 | 補貨方式 |
|---------|---------|
| 鐵盒禮盒 | 現場組裝出貨 |
| 紙盒禮盒 | 現場組裝出貨 |
| 濾掛咖啡 | 採購/入庫 |
| 提袋等加購品 | 採購/入庫 |

### 六、雙桶 family 的完整生命週期

以奶油曲奇、西點餅乾、杏仁瓦片、糖果、椰棗為例：

```
早上匯入 → 先扣可銷售成品桶
         → 可銷售成品不夠的缺口 → 1:1 扣內包裝完成品桶
         → 可能產生暫時負庫存

下班前   → 內包裝人員手工回填可銷售成品數量
         → 內包裝人員手工回填內包裝完成品數量
         → 內包裝完成品不會自動轉成可銷售成品

定期盤點 → 人工實盤 → 手工調整庫存
```

**重要**：系統上「先扣可銷售成品 → 不夠再扣內包裝完成品」是固定規則（1:1），不是人工選擇。

### 七、人工盤點

| 項目 | 結論 |
|------|------|
| 盤點頻率（系統初期） | 每週一次 |
| 盤點頻率（系統穩定後） | 每月一次 |
| 盤點範圍 | 可銷售成品、內包裝完成品、包材/出貨耗材（三張表都盤） |
| 盤點人員 | 營運人員/主管覆核（現行月底盤點） |
| 差異原因欄位 | 可保留但非必填 |
| 差異調整 | 視為一般操作，不需要額外覆核 |

### 八、負庫存政策

| 項目 | 結論 |
|------|------|
| 允許範圍 | 所有庫存桶（可銷售成品、內包裝完成品、包材等） |
| 誰可接受 | 所有角色（生產、包裝、會計、主管） |
| 補正時點 | 透過人工安排工作 / 下班前回填 / 定期盤點調整 |
| 原因欄位 | 可保留但非必填 |
| 系統行為 | 顯示但標記警告，不硬擋 |

### 九、角色與權限

#### 四個角色

| 角色 | 主要職責 |
|------|---------|
| 生產 | 生產/製作相關作業 |
| 包裝 | 內包裝完成品包裝 + 所有回填作業 |
| 會計 | 財務對帳相關（未來會有權限分離需求） |
| 主管 | 管理覆核（目前未啟用覆核） |

#### 操作權限矩陣（目前全部視為一般操作，無覆核）

| 動作 | 生產 | 包裝 | 會計 | 主管 | 覆核需求 |
|------|------|------|------|------|---------|
| 匯入訂單 | ✓ | ✓ | ✓ | ✓ | 無 |
| 手動改排程 | ✓ | ✓ | ✓ | ✓ | 無 |
| 先扣食材（BOM 扣帳） | ✓ | ✓ | ✓ | ✓ | 無 |
| 回沖重算 | ✓ | ✓ | ✓ | ✓ | 無 |
| 接受負庫存 | ✓ | ✓ | ✓ | ✓ | 無 |
| 月底/週盤點差異調整 | ✓ | ✓ | ✓ | ✓ | 無 |
| 庫存回填 | — | ✓ | — | — | 無（僅限包裝角色執行） |

> **注意**：未來在採購、會計模組上線後，會需要正式的權限分離與覆核。

---

## What has been confirmed

### SKU 對齊

- ✅ 提袋加購 sellable SKU 正式確定為 `O00001`（舊 `ADD0001` 已全面替換）
- ✅ A/B/H/K/M/P family SKU 改為短碼格式，所有 consumer 已同步
- ✅ `2026-03-26_銷售商品主檔_template.csv` 是唯一 sellable SKU 權威來源
- ✅ bootstrap mapping runtime、fixture、governance docs 全面對齊
- ✅ 驗證：`npm run test:api:mapping:fixtures` 18/18 通過
- ✅ 驗證：`npm run test:api:mapping:smoke` 通過
- ✅ 驗證：stale-SKU 全 repo 掃描 `STALE_FILE_COUNT = 0`

### 內包裝椰棗名稱修正

- ✅ 內包裝主檔 Y1-Y5 名稱已去重量（B 欄 + C 欄）
- ✅ 組成對照表 L112-116 的內包裝名稱引用已同步
- ✅ 驗證：`npm run test:api:mapping:fixtures` 18/18 通過（改名不影響 mapping）
- ✅ 驗證：chat 主資料目錄掃描確認無殘留舊名

### Governance docs

- ✅ `doc/architecture/data/bag_family_naming_and_alias_rules.md` — 提袋命名/alias/擴展規則
- ✅ `doc/architecture/data/bag_alias_inventory.md` — 各渠道提袋 alias 實例清單
- ✅ 上述兩份已連結到 `doc/architecture/data/README.md` 與 `channel_intake_special_item_governance.md`

### 流程收集

- ✅ 三張表單定義完成（包裝部庫存表、出貨部需求表、包材耗材盤點表）
- ✅ 各 family 扣帳桶分類完成
- ✅ 雙桶 fallback 規則確認：先扣 sellable → 不夠 1:1 扣 inner-pack-finished
- ✅ 回填歸屬確認：一律由包裝（內包裝）人員操作
- ✅ 盤點節奏確認：初期每週，穩定後每月
- ✅ 負庫存政策確認：全桶允許、全角色可接受、原因非必填
- ✅ 角色定義：生產/包裝/會計/主管四級，當前全部一般操作無覆核

---

## Current stage

- 流程收集已完成到足以起草第一版「日常扣帳/排工/回填/盤點調整」規格。
- SKU 與內包裝名稱對齊已完成，mapping tests 全綠。
- **尚未產出正式流程規格文件**——本 handoff 是唯一完整記錄。
- 下一步應立即把上方的流程內容寫成 `doc/architecture/flows/` 下的正式文件。

---

## What was rejected

- **不採用**把內包裝完成品自動轉換為可銷售成品的做法；目前手工回填。
- **不採用**出貨時自動扣除出貨耗材的假設；耗材走人工盤點。
- **不採用**覆核機制用於當前這批一般操作；覆核只在未來採購/會計模組啟用。
- **不採用**把 sellable 商品名也去除重量的做法；sellable 名稱包含規格是正確的。
- **不採用**讓系統在「先扣 sellable → 再扣 inner-pack」過程中由人工選擇扣哪個桶；這是固定規則。

---

## Risks

1. **流程規格尚未落到權威文件**：本 handoff 是唯一記錄，若不盡快轉成 `doc/architecture/flows/` 下的正式文件，可能在後續 session 中遺失細節或被重複詢問。
2. **BOM 扣帳尚未實作**：排工後立即扣食材的需求已明確，但系統尚無 BOM 結構來支撐。
3. **雙桶 family 的「部分回填 sellable / 部分回填 inner-pack」**：椰棗與糖果哪些品項回填到哪個桶，目前只到 family level 的粗粒度，若需精確到 SKU level 可能還要再問。
4. **包材盤點表的納管範圍未詳列**：已確認存在第三張表，但哪些耗材入表（提袋/外夾鏈袋/紙盒/鐵盒/咖啡外盒/宅配箱）vs 哪些不入系統（膠帶/緩衝材），尚未逐一列出。
5. **盤點紀錄欄位未定義**：是否需要 `調整前數量/實盤數量/調整後數量/操作人/時間/備註` 的最小集合，尚未確認。
6. **盤點頻率切換方式未定**：初期每週→穩定後每月，是系統參數持切換還是只在 SOP 紀錄。
7. **bootstrap mapping runtime 中椰棗 lookup 仍輸出舊的 sellable 名稱**（如 `★中東椰棗300g`）——這是正確的，因為這是 sellable 商品名，但需要確保後續系統不會把 sellable 名稱與 inner-pack 名稱搞混。

---

## Verification status

### 已驗證

- `npm run test:api:mapping:fixtures` — 18/18（2026-03-30 最後一次）
- `npm run test:api:mapping:smoke` — 通過（2026-03-30）
- Stale SKU repo-wide scan — 0 残留（2026-03-30）
- Y1-Y5 內包裝名稱 chat 目錄掃描 — 0 殘留（2026-03-30）

### 尚未驗證

- BOM 扣帳邏輯（尚未實作）
- 雙桶 fallback 扣帳邏輯（尚未實作，只有商業規則定義）
- 回填流程（尚未實作）
- 盤點調整流程（尚未實作）

---

## Next exact prompt

### 若要產出正式流程規格（建議優先）：

```
請根據 `project_maintainers/chat/handoff/2026-03-31_ops-workflow-and-sku-alignment_handoff.md` 中的「日常營運流程 — 完整收集結果」段落，起草正式的流程規格文件，落到 `doc/architecture/flows/` 下。

至少包含以下文件：
1. 日常扣帳與排工流程規格（含三張表的定義、各 family 扣帳桶分類、雙桶 fallback 規則、BOM 扣帳觸發條件）
2. 下班前回填規格（含回填執行角色、回填目標桶、不回填的 family 與補貨方式）
3. 人工盤點與差異調整規格（含頻率、範圍、負庫存政策、欄位建議）

請先列出文件大綱讓我確認，再進入正式撰寫。
```

### 若要繼續補充精化資訊：

```
請對 `project_maintainers/chat/handoff/2026-03-31_ops-workflow-and-sku-alignment_handoff.md` 中 Risks 段落的第 3-6 項，用 vscode_askQuestions 以結構化問答收集以下細節：
1. 椰棗與糖果哪些具體品項回填到 sellable vs inner-pack
2. 包材盤點表的完整納管清單
3. 盤點紀錄最少保留哪些欄位
4. 盤點頻率切換是系統參數還是 SOP 政策
```

---

## Appendix：關鍵跨文件引用

| 文件 | 用途 |
|------|------|
| `project_maintainers/data/active/master-data/2026-03-26_銷售商品主檔_template.csv` | sellable SKU 唯一權威 |
| `project_maintainers/data/active/master-data/2026-03-25_內包裝完成品主檔_template.csv` | 內包裝完成品 SKU + 名稱權威 |
| `project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv` | 組成表（引用 sellable + inner-pack） |
| `project_maintainers/data/active/master-data/2026-03-25_外包裝材料主檔_template.csv` | 外包裝材料主檔 |
| `apps/api/src/intake/mapping/bootstrap-mapping.engine.ts` | runtime mapping（sellable SKU lookup） |
| `apps/api/test/fixtures/intake-mapping-fixtures.json` | mapping test expectations |
| `doc/architecture/data/bag_family_naming_and_alias_rules.md` | 提袋 family 命名規則 |
| `doc/architecture/data/bag_alias_inventory.md` | 提袋 alias 實例清單 |
| `doc/architecture/data/channel_intake_special_item_governance.md` | 特殊項治理總則 |
| `doc/architecture/flows/shipping_supply_inventory_policy.md` | 出貨用品盤點規則 |
| `doc/logs/Idx-010_log.md` | 特殊項 + SKU 對齊 execution log |
