# 日常扣帳與隔日排工規格

更新日期：2026-03-31

Authoritative source：是

## 目的

本文件定義 Ivyhouse OP System 日常營運主線中，從早上匯入訂單到下班前排定隔日工作之間的正式扣帳、分桶與規劃規則。

本文件要解決三個問題：

- 匯入當天需求後，哪些庫存桶要先被扣減。
- 不同 family 的扣帳邏輯如何分流。
- 隔日排工確定後，何時觸發 BOM 扣帳與回沖重算。

## 適用範圍

- 電商、LINE / 電話 / 人工、企業大單 / 團購、門市等來源的當日撿貨單與訂單。
- 可銷售成品庫存。
- 內包裝完成品庫存。
- 正式入表、入扣帳的外包裝材料與內包裝耗材。

本文件不直接定義：

- 試算型需求規劃。
- 財務開票與對帳流程。
- 採購入庫流程。

## 核心視圖

### 表 1：包裝部庫存表

包裝部每日查看可銷售成品與內包裝完成品餘量，用於判斷當天缺口與隔日工作安排。

### 表 2：出貨部當天訂單需求表

出貨部查看當日所有訂單彙總後的需求量，用於撿貨、組裝與履約。

### 表 3：包材 / 出貨耗材盤點表

用於管理正式入表的包材耗材與人工盤點型出貨 / 行政耗材。

## 當日匯入與正式扣帳時點

### 匯入範圍

- 每日早上匯入所有當天要處理的撿貨單與訂單。
- 匯入後只扣當天訂單，不提前扣未來日期需求。

### 匯入後立即扣帳的桶別

- 可銷售成品庫存。
- 內包裝完成品庫存。
- 正式入表、入扣帳的外包裝材料庫存。
- 正式入表、入扣帳的提袋 / 加購品包材庫存。

## family 扣帳分流

### 只扣內包裝完成品

這些品項在可銷售成品現貨桶中不一定有存量，出貨時主要由內包裝完成品或單包零件組裝：

- 夏威夷豆塔
- 堅果塔
- 塔類-綜合
- 雪花餅
- 瑪德蓮

### 先扣 sellable，不夠再 1:1 扣 inner-pack

- 奶油曲奇
- 西點餅乾
- 杏仁瓦片
- 糖果
- 椰棗

此分流是固定系統規則，不提供人工選擇扣哪個桶。

### 只扣 sellable

- 無調味堅果
- 千層餅乾

### 特殊 family

- 鐵盒禮盒：出貨端現場組裝，通常不做日終回填。
- 紙盒禮盒：出貨端現場組裝，通常不做日終回填。
- 濾掛咖啡：不做日製作回填，只靠既有庫存出貨；走採購 / 入庫。
- 提袋等加購品：不做日製作回填；走採購 / 入庫，並於匯入時正式扣包材庫存。

## 隔日排工規則

- 每天下班前，依當天扣帳後的庫存餘量，安排明天工作。
- 排程單位分兩層：
  - 可銷售成品 level：無調味堅果、千層餅乾。
  - 內包裝完成品 level：堅果塔、夏威夷豆塔、椰棗、糖果、雪花餅、瑪德蓮、奶油曲奇、西點餅乾、杏仁瓦片。

### BOM 扣帳觸發

- 隔日工作建立或 revision 後，先進入 `PENDING_APPROVAL`；只有 `主管` 完成 approval 後，才可正式扣除對應食材 / 原料與半成品。
- 任何排程數量變更都必須先形成新的 revision request，再由 approval 成立後觸發 BOM 重算。
- production plan revision 鏈在 Phase 1 不設硬性上限；所有 revision 都必須保留完整歷史與 `revised_from_id` 關聯，不得為了限制鏈長而覆寫或截斷既有版本鏈。
- 若營運認定某條 revision 鏈已失控，處理方式應為人工覆核與建立新的 plan 起點，而不是刪除或改寫既有 revision 歷史。
- 回沖 / 重算屬正式庫存事件，不得以覆寫舊值取代歷史。

## Idx-021 / Idx-022 Formal Identity 與 Approval 補充

- production-planning 的 `create / revise / rerun` 正式身份來源已改為 Portal session principal，不再把 request body `createdBy` / `revisedBy` / `executedBy` 視為正式 actor。
- request headers 至少應提供：`x-portal-principal-id`、`x-portal-session-id`、`x-portal-role-codes`；可選補 `x-portal-display-name`、`x-portal-auth-source`。
- `create / revise / rerun` 的 request 角色仍沿用 `生產 / 包裝及出貨 / 會計 / 管理員`，但最終 approval 僅允許 `主管`；`管理員` 若未同時具備 `主管`，不得完成高風險業務最終 approver 決策。
- 若同一 principal 同時具有 `主管 + 管理員`，高風險業務 approval 仍只以 `主管` 邊界判定；`管理員` 身分不得放寬 approver 資格，也不得作為單人 override 的合法性來源。
- production-planning 已正式落 `approvalStatus`、`approverPrincipalId`、`approvalDecidedAt`、`singlePersonOverride` 等 persistence；rejection 不得寫入 ledger。

## 三張表的正式 owner 邊界

### 銷售商品組成對照表 owner

檔案：`project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv`

管理內容：

- sellable 商品扣哪些內包裝完成品。
- sellable 商品扣哪些外包裝材料。
- sellable 商品是否需要外包裝組裝。

### 內包裝耗材用量對照表 owner

檔案：`project_maintainers/data/active/rules/2026-03-31_內包裝耗材用量對照表_template.csv`

管理內容：

- 內包裝完成品本身要消耗哪些袋材、膜材、單片袋等耗材。
- 例如塔類 / 雪花餅 / 鳳梨酥的膠捲封膜、瑪德蓮的蛋糕袋、椰棗 / 糖果的袋裝耗材。

### 生產 / 分裝 / 轉換扣帳規則表 owner

檔案：`project_maintainers/data/active/rules/2026-03-25_生產_分裝_轉換扣帳規則表_template.csv`

管理內容：

- 拆包轉重量中介。
- 秤重轉單片。
- 秤重分裝。
- 任何完成品、重量中介、單片、分裝包之間的數量或單位轉換。

### 本輪檢查結論

- `Q1-Q5`、`G1-G5`、`C1-C7` 主體屬轉換規則 owner，不再於內包裝耗材表重複定義整包 / 秤重主體的包材扣帳。
- `Q1001-Q5001`、`G1001-G5001`、`C1001-C7001` 單片內容物的單片袋耗材，屬內包裝耗材表 owner。
- `K1001-K4001` 濾掛咖啡單包目前不建立額外內包裝耗材規則。

## 例外與風險

- 若同一個耗材同時出現在 sellable 組成規則與內包裝耗材規則，必須先判斷是不同層級包裝，還是重複扣帳。
- 若某品項同時需要轉換規則與耗材扣帳，兩者可並存，但不得由同一張表重複表述。

## 關聯文件

- `doc/architecture/flows/end_of_day_replenishment_spec.md`
- `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`
- `doc/architecture/flows/shipping_supply_inventory_policy.md`
- `project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv`
- `project_maintainers/data/active/rules/2026-03-31_內包裝耗材用量對照表_template.csv`
- `project_maintainers/data/active/rules/2026-03-25_生產_分裝_轉換扣帳規則表_template.csv`