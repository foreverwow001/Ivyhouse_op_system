# 財務與對帳控制基線第一版

更新日期：2026-04-03

Authoritative source：是

## 目的

本文件定義 Ivyhouse OP System 在 Phase 0 的財務與對帳控制基線，先把發票、收付款、核銷、成本、結帳與對帳的正式邊界、控制點、不可逆規則與 maker-checker 需求收斂成可引用的權威文件。

這份基線的角色不是提前實作完整 Finance / Reconciliation 模組，而是避免後續 Production、Inventory、Order / Fulfillment 在沒有財務邊界的情況下，各自發明平行的發票、付款、成本或對帳語意。

## 範圍與定位

- 本文件屬 Phase 0 基線治理文件。
- 本文件定義 Finance / Reconciliation 模組的責任、控制點、事件追溯要求與正式不可逆節點。
- 本文件不等於 Phase 1 要立即上線完整財務功能。
- 本文件也不取代未來的 schema、API、UI、AR / AP、invoice、payment、settlement、close 子模組規格。

## Phase 1 邊界判定

### 對目前 Phase 1 MVP 的結論

- 完整財務 / 對帳 / 發票 / AR / AP 流程，明確不在 Phase 1 MVP 範圍內。
- 因此本文件對目前 Phase 1 的定位是：`受控 deferred` 的權威基線，而不是 Phase 1 必須一起交付的 runtime 功能。

### 對下一輪 implementation-ready 的結論

- 只要下一輪工作開始碰觸發票、付款、核銷、成本、關帳、供應商應付、客戶應收或正式對帳差異處理，本文件就立即升級為 implementation-ready gate。
- 換言之，本文件對「現行 Phase 1 MVP」是受控 deferred；對「任何 finance-bearing work unit」則是必備前置基線。

## 模組責任邊界

### Finance / Reconciliation owner 範圍

- 發票
- 收款 / 付款
- 核銷
- 成本歸集與成本差異分析
- 對帳結果
- 期間結帳 / 關帳

### 與相鄰模組的邊界

#### Order / Fulfillment

- Order / Fulfillment 是訂單、出貨、退貨等履約事實的 owner。
- Finance 只能讀取並引用這些正式事實，不得回頭修改出貨數量、客單內容或來源狀態來配平帳務。

#### Inventory

- Inventory 是庫存台帳、批次、盤點與調整事件的 owner。
- Finance 可讀取庫存事件作為成本與差異分析依據，但不得直接改寫 inventory ledger 或盤點事實。

#### Production

- Production 是工單、領料、完工與報廢事實的 owner。
- Finance 可依正式 production 事件進行成本彙整或差異分析，不得為了調成本而回寫工單或耗料來源。

#### Portal / Identity / Audit

- Portal / Identity / Audit 承接正式身份、角色、approval 與審計證據。
- Finance 高風險操作必須透過正式身份與審計鏈承接，不得以匿名腳本或無 actor 的批次修正實現。

## 核心控制原則

### 1. 財務結果必須追溯到交易事實

- 發票、收付款、核銷、成本與對帳結果，必須可回溯到正式交易事實。
- 不得先產生財務結果，再反向改寫訂單、出貨、工單、盤點或庫存事件來湊帳。

### 2. 業務節點與財務節點必須分離

- 訂單
- 出貨
- 發票
- 收款 / 付款
- 核銷
- 對帳
- 結帳

以上節點不得混成單一狀態欄位。

### 3. 不可逆節點必須以 reversal / 補償事件處理

- 已開立發票後不得直接刪除，只能作廢、沖回或建立補償事件。
- 已核銷結果不得直接覆寫，只能留下 reversal / adjustment 線索。
- 已關帳期間不得直接改原始事實；若需補正，必須透過 reopen policy 或下期調整事件處理。

### 4. maker-checker 與 approval 不可省略

- 已開票後修正
- 付款 / 退款
- 核銷差異調整
- 對帳差異確認
- 成本重算或結帳重開

以上操作預設屬高風險面，至少需 maker-checker 或等價人工覆核。

## 六大控制點

### 1. 發票（Invoice）

最低控制要求：

- 發票必須關聯來源訂單、出貨或等價履約事實。
- 狀態至少區分：`待開票`、`已開票`、`作廢 / 沖回待處理`。
- 已開票後的更正不得直接覆寫原發票事實。
- 開票人、開票時間、作廢 / 沖回原因與核定線索必須可追溯。

### 2. 收款 / 付款（AR / AP Payment）

最低控制要求：

- 收款 / 付款必須關聯正式對象與來源單據。
- 允許部分收付，但不得因部分支付而抹除原應收 / 應付責任。
- 付款、退款、沖回與失敗重試都必須保留事件與責任線索。

### 3. 核銷（Settlement）

最低控制要求：

- 核銷是獨立節點，不等於已付款或已開票。
- 必須支援 `待核銷`、`部分核銷`、`已核銷` 與 `例外待處理` 的正式語意。
- 差異金額、折讓、手續費、短收短付與人工調整都必須保留原因與責任人。

### 4. 成本（Costing）

最低控制要求：

- 成本必須建立在正式配方、耗料、庫存與生產事實之上。
- Phase 0 先只定義「成本不可脫離交易與耗料事實」的邊界，不在本輪決定完整計價公式終版。
- 任何成本重算、成本調整或標準成本覆蓋，都不得無痕修改歷史結果。

### 5. 對帳（Reconciliation）

最低控制要求：

- 對帳至少區分：`待對帳`、`對帳中`、`對帳完成`、`例外待處理`。
- 對帳結果必須保留差異項、差異原因、責任單位、處理人與核定人。
- Finance 不得因對帳差異直接覆寫來源模組原始事實；只能建立差異事件、調整建議或補償事件。

### 6. 期間結帳 / 關帳（Period Close）

最低控制要求：

- 關帳屬高風險不可逆節點。
- 關帳前至少應確認：來源單據完整性、未結差異、未核銷項與必要盤點 / 成本前置條件。
- 關帳後若需補正，必須透過 reopen policy、下期 adjustment 或等價正式流程處理，不得直接改歷史來源資料。

## 建議正式節點

### 財務與對帳主線節點

- `待開票`
- `已開票`
- `待付款 / 待收款`
- `部分核銷`
- `已核銷`
- `對帳中`
- `對帳完成`
- `例外待處理`

### 關帳控制節點

- `待關帳檢查`
- `關帳中`
- `已關帳`
- `重開待核定`

這些節點目前只作為治理基線，不等於 schema 或 API 已正式落地。

## 審核點與高風險動作

以下動作預設需要 domain review、security review 或等價 approval control：

- 已開票後修正、作廢、沖回
- 付款、退款、沖回、短收短付調整
- 核銷差異調整
- 對帳完成後重開
- 成本重算、結帳重開、關帳結果補正
- 任何會回頭影響財務結果的 inventory / production / order 來源事實重整

## 對資料模型的最低要求

在未來正式 schema / API work unit 中，至少要保留以下能力：

- source document linkage：能追溯到來源訂單、出貨、工單、盤點或其他正式事件
- actor / approver trace：能保留操作者、核定人、時間與理由
- status separation：發票、付款、核銷、對帳、關帳分開建模
- reversal / adjustment trace：不可逆節點後的補正必須是新事件，不是覆寫
- close-period guard：已關帳期間的修改需受正式 guard 控制

## 與目前 Phase 1 的銜接方式

- Phase 1 daily ops 只需確保：交易事實、審計線索、actor identity 與 inventory / production / order source linkage 乾淨可追溯。
- 不要求在 Phase 1 內實作正式發票、付款、核銷、成本、關帳與對帳模組。
- 但後續若新增任何會直接輸出財務結果的功能，不得跳過本文件。

## Deferred 與 Gate 判定

### 受控 deferred

- 對現在的 Phase 1 MVP：`是`
- 理由：`phase1_mvp_scope.md` 已明確排除完整財務 / 對帳 / 發票 / AR / AP 流程

### 下一輪 implementation-ready gate

- 對任何 finance-bearing work unit：`是`
- 觸發條件：只要 work unit 開始處理發票、付款、核銷、成本、對帳、關帳、供應商應付或客戶應收，就必須先引用並遵守本文件

## 關聯文件

- `project_rules.md`
- `doc/architecture/project_overview.md`
- `doc/architecture/modules/README.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/flows/unified_status_semantics.md`
- `doc/architecture/roles/README.md`
- `doc/architecture/decisions/README.md`
- `doc/architecture/phase1_mvp_scope.md`