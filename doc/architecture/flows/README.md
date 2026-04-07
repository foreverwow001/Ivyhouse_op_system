# Flow Architecture

本文件是 Ivyhouse OP System 的流程與狀態權威入口。凡是涉及核心 workflow、狀態流、handoff、approval boundary、人工覆核、失敗回退或不可逆步驟的設計，都必須先對照本文件。

## 目標

- 定義烘焙營運系統的主營運主線。
- 明確說明各流程的 owner、handoff 與例外路徑。
- 避免前端、單一 service 或報表自行發明平行狀態機。

## 核心營運主線

Ivyhouse OP System 的主線不是單一 CRUD，而是以下閉環：

1. 訂單建立
2. 生產排程 / 工單建立
3. 領料 / 耗料 / 生產執行
4. 完工 / 入庫
5. 包裝 / 揀貨
6. 出貨 / 交付
7. 發票 / 付款 / 核銷 / 對帳

所有後續子流程都必須能映射回這條主線，不能產生獨立且不可追溯的平行流程。

## 流程設計原則

### 1. 單一正式狀態來源

- 每個核心交易實體都必須有單一正式狀態來源。
- UI 顯示可以做聚合或語意包裝，但不可與正式狀態脫鉤。

### 2. 狀態轉移必須可解釋

- 每個狀態必須有允許轉移與禁止轉移。
- 若流程存在不可逆節點，必須在規格中明寫。
- 回退與補救應優先透過新事件或補充流程，而不是直接覆寫歷史狀態。

### 3. Handoff 必須有 owner

- 流程跨模組、跨角色、跨責任邊界時，必須明確定義 handoff 條件與責任歸屬。
- 若存在 maker-checker 或人工覆核點，必須清楚標記。

### 4. 現況 SOP 與終版治理要分開寫

- 若現況 SOP 與專案治理規則存在落差，文件必須同時寫明「目前如何做」與「後續仍待補的治理要求」。
- 不得因為現況作業尚未覆核，就把 maker-checker 需求從權威文件移除。

## 主要流程分解

### 訂單到履約

建議正式節點：

- 草稿
- 已確認
- 已排程
- 生產中
- 待包裝
- 待出貨
- 部分出貨
- 已完成
- 已取消
- 已退回 / 退貨中

必須處理的例外：

- 部分完工
- 部分出貨
- 客戶取消
- 退貨或重送

### 生產工單

建議正式節點：

- 草稿
- 已排程
- 已開工
- 已領料
- 生產中
- 已完工
- 已取消
- 異常中

必須處理的例外：

- 替代料
- 報廢
- 重工
- 配方版本差異

### 採購與收貨

建議正式節點：

- 請購草稿
- 請購核准
- 採購已下單
- 部分到貨
- 全部到貨
- 驗收中
- 已入庫
- 已結案

### 財務與對帳

建議正式節點：

- 待開票
- 已開票
- 待付款 / 待收款
- 部分核銷
- 已核銷
- 對帳中
- 對帳完成
- 例外待處理

### 出貨用品與包裝耗材

建議治理原則：

- 出貨用品與包裝耗材必須進 ERP，作為正式主資料與庫存項目管理。
- 若營運決策是不在出貨時自動扣除，系統仍必須支援人工盤點、盤點差異與調整原因追蹤。
- 出貨用品不應混入配方耗料或出貨自動扣帳；它們屬於履約支援用品，扣減節點由盤點 / 調整流程承接。

### 包材扣帳邊界

- 內包裝包材與外包裝材料共用同一份包材主檔管理。
- 只要包材會成為生產、分裝、商品組成或正式包裝規則的一部分，就必須走正式扣帳或正式規則引用。
- 不得把需要正式扣帳的內包裝包材錯放到出貨用品人工盤點流程，以免庫存與成本失真。

## Approval boundary

以下操作預設需要人工覆核、maker-checker 或等價控制：

- 主資料停用或大幅修改
- 單位換算規則與轉換扣帳規則的新增、修改或停用
- 內外包材主檔的關鍵引用規則變更，或使包材從人工盤點型改為正式扣帳型
- 配方版本發布或停用
- 庫存調整、盤盈盤虧、報廢
- 已確認訂單取消
- 已開立發票後的修正
- 付款、退款、核銷與對帳差異調整

## 失敗與回退原則

- 優先建立補償事件或例外流程，不直接抹除歷史。
- 若流程中斷，必須保留當下狀態、錯誤原因、操作者與時間。
- 若存在自動重試，必須定義重試上限與人工介入點。

## Phase 0 必補文件

本 README 提供總體流程治理基線。進入正式實作前，應陸續補齊：

- 統一狀態語意基線
- 訂單狀態機定義
- 工單狀態機定義
- 庫存異動事件字典
- 出貨用品人工盤點與調整規則
- 財務 / 對帳例外處理規則
- 角色 handoff 與 approval matrix

目前已補的基線文件：

- `doc/architecture/flows/unified_status_semantics.md`：統一整理主資料／高風險參照的生命週期狀態、核定狀態與欄位語意，作為後續各流程 state machine 的共同底座
- `doc/architecture/flows/shipping_supply_inventory_policy.md`：定義出貨用品 / 包裝耗材進 ERP 的管理方式，以及人工盤點、不自動扣除的流程基線
- `doc/architecture/roles/README.md`：第一版 RBAC 與 approval matrix，先定義四表直連高風險操作的角色邊界、maker-checker 與正式核定角色
- `doc/architecture/flows/intake_demand_aggregation_spec.md`：定義需求匯入、需求彙總、BOM 拆分與正式 / 試算分流主線
- `doc/architecture/flows/channel_intake_parser_contract.md`：定義各渠道 parser 的正式邊界、可資料化範圍與需改 code 的條件
- `doc/architecture/flows/channel_intake_exception_resolution_spec.md`：定義 intake 中解析失敗、低信心、未映射與規則衝突的正式例外處理流程
- `doc/architecture/flows/channel_intake_state_machine.md`：把 intake / mapping / exception 主線落成正式狀態機草案
- `doc/architecture/flows/channel_intake_api_contract.md`：定義建立批次、解析、覆核、例外處理與確認的 REST API 契約草案
- `doc/architecture/flows/channel_intake_sample_acceptance_matrix.md`：以真實樣本檔建立 MOMO、蝦皮、官網、橘點子四條 intake 的驗收矩陣與代表場景覆蓋清單
- `doc/architecture/flows/channel_intake_golden_expected_output.md`：以 18 份真實樣本逐檔定義 `parsedLine`、`mappingResult`、`exception` 的第一版 golden 摘要基線
- `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`：定義早上匯入後的正式扣帳分桶、隔日排工與三張表的 owner 邊界
- `doc/architecture/flows/end_of_day_replenishment_spec.md`：定義下班前回填的目標桶、雙桶 family 的回填原則與不回填 family
- `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`：定義盤點頻率、差異調整欄位最小集合、負庫存政策與提醒機制
- `doc/architecture/flows/inventory_variance_auto_calculation_spec.md`：定義原料、半成品與包材在盤點流程中的差異量、差異率與誤差率自動計算規則
- `doc/architecture/flows/inventory_count_api_contract.md`：把盤點 session、差異調整、差異摘要與 7 天 / 30 天滾動誤差率落成 API / DTO / response 草案
- `doc/architecture/flows/daily_ops_engineering_breakdown.md`：把日常扣帳、回填、盤點與三張表 owner 邊界拆成工程可落地的資料表 / API / 狀態事件清單
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`：定義日常營運 MVP 的 migration 套用、seed 邊界、開帳庫存 bootstrap 與第一批正式資料進場策略
- `doc/architecture/flows/migration_governance_and_deployment_replay.md`：定義 migration 命名 / promotion / review 規則、deployment replay evidence 與 hotfix rollback 停等點
- `doc/architecture/flows/finance_reconciliation_control_baseline.md`：定義發票、收付款、核銷、成本、對帳、關帳的控制邊界、高風險審核點，以及對現行 Phase 1 的 deferred / future gate 判定

補充說明：

- 目前日常營運四角色 `生產 / 包裝 / 會計 / 主管` 的現況操作邊界已回寫到 `doc/architecture/roles/README.md`。
- 該矩陣描述目前 SOP，不等於終版 approval boundary；與治理規則的落差仍需保留。

在這些文件尚未獨立成冊前，本文件就是流程與狀態的最低權威來源。