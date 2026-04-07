# Ivyhouse OP System Phase 1 MVP Scope

更新日期：2026-04-01

Authoritative source：是

## 目的

本文件正式凍結 Ivyhouse OP System Phase 1 MVP 的包含範圍、排除範圍、前置資料要求與驗收基線。

本文件用來回答三個問題：

1. Phase 1 這一版到底要做什麼。
2. 哪些重要能力明確不在本版內，避免範圍失控。
3. 哪些主資料與治理前置必須先備妥，才可以啟動受控範圍的日常營運 MVP。

本文件一旦與其他草稿衝突，以本文件為準。

## 採納狀態

- 本文件取代 `doc/architecture/phase1_mvp_scope_draft.md` 作為正式 MVP scope 依據。
- `phase1_mvp_scope_draft.md` 保留為背景分析草稿，不再作為範圍凍結或驗收判定依據。

## Phase 1 定位

Phase 1 不是整套 ERP 的全面落地。

Phase 1 是 Ivyhouse OP System 的第一個可工作版本，目標是先打通「日常營運主線」，讓每日需求匯入、正式扣帳、建議生產、BOM reservation、日終回填、盤點調整與審計追溯形成閉環。

本版的正式定位如下：

> 以日常營運主線為核心，建立受控範圍內可實際運作的 MVP，先取代目前 `picking-order-analyzer`、Excel 生產統計表與人工分散追蹤的核心決策作業。

## Phase 1 包含範圍

### A. 日常需求匯入與確認

必含：

- 多來源需求匯入
- 來源檔解析
- 商品映射
- 批次需求確認
- 來源追溯鏈

本版要求：

- 以 batch-first 模型承接每日可能多批的正式需求。
- 能保留來源檔、解析結果、映射結果、人工修正與確認紀錄。

### B. 需求扣庫存與日常營運決策

必含：

- 當日需求正式扣帳
- family 分流規則
- 雙桶 fallback 規則
- 負庫存警示
- 安全庫存 / 最低庫存概念

本版要求：

- 系統可以支援負庫存顯示與警示，但不以硬擋為 MVP 前提。
- 當日需求扣帳與扣後餘量，必須可追溯到來源批次與庫存事件。

### C. 生產計畫與 BOM reservation

必含：

- 隔日排工建立與修改
- 排工變更觸發 BOM 重算
- BOM reservation run 與 reservation line
- 組成表 / 內包裝耗材表 / 轉換規則表的 owner 邊界落地

本版要求：

- BOM reservation 必須至少能從正式 owner 規則展開 sellable 組成、內包裝耗材與轉換扣帳來源。
- 任何 BOM 重算不得覆寫歷史事件，必須產生新 run / line 與 ledger。

### D. 日終回填與盤點調整

必含：

- 日終回填 run
- 盤點 session
- 差異調整事件
- 一個月未盤點提醒

本版要求：

- opening balance 不使用假 seed；必須透過第一次正式盤點建立。
- 盤點差異與手工調整必須留下 ledger 與 audit。

### E. Master Data / Inventory / Audit 最小骨架

必含：

- 銷售商品主檔引用
- 內包裝完成品主檔引用
- 包材主檔引用
- 轉換規則引用
- 審計紀錄
- 庫存事件台帳

本版要求：

- 允許主資料 owner 暫時仍以 CSV authoritative source 運作。
- 但系統 runtime 不得自行發明平行 SKU、平行 BOM 或平行包材字典。

## Phase 1 明確排除範圍

以下能力明確不在本版內，不得偷渡進 MVP：

1. 完整財務 / 對帳 / 發票 / AR / AP 流程。
2. 採購下單、到貨、驗收與供應商績效管理。
3. 完整供應商主檔治理與供應商映射。
4. 完整門市、倉庫、客戶、配送與路線管理。
5. 完整帳號系統、細粒度 page/API/row-level RBAC。
6. 多工序、多產線、多設備產能最佳化排程。
7. 正式 recipe version schema 化與配方核定工作流全套上線。
8. 完整前端 portal、dashboard、通知中心與跨模組工作台。
9. 會計整合、成本歸集、關帳與財務審核流。
10. 旺季試算的完整產品化工作區。

## Phase 1 必備前置資料

### 先補齊，否則 MVP 會失真

以下資料在 Phase 1 啟動前必須至少達到最低可執行版本：

1. 銷售商品主檔
2. 內包裝完成品主檔
3. 包材主檔
4. 銷售商品組成對照表
5. 內包裝耗材用量對照表
6. 生產 / 分裝 / 轉換扣帳規則表
7. 原料主檔最低版本
8. 製作配方 / BOM 最低版本

### 可用最低版本，不必一次做到終版

對於 `原料主檔` 與 `製作配方 / BOM`，Phase 1 不要求一次做到完整 recipe governance 終版，但至少要有：

- 正式 key
- 名稱
- 單位
- 生效狀態
- 最低耗用明細
- 能支撐 reservation / 扣料的引用關係

也就是說，你現在問的「是不是應該先補製作配方、食材」答案是：**是，至少要補最低可執行版本**。否則目前的日常營運 MVP 雖可跑需求、扣帳、回填、盤點，但一進入真正的生產扣料與食材 reservation，就會在資料 owner 上失真。

### 可延後到後續階段

`供應商資訊` 在 Phase 1 可以不先做到完整。

原因：

- 日常營運 MVP 的主線重點是需求、庫存、生產、包裝、出貨，不是採購到應付。
- 供應商真正變成正式阻斷，多半發生在採購、到貨、驗收、價格條件、對帳與應付階段。
- 因此可以先保留原料主檔中的供應資訊欄位或待補欄位，但不要求在 MVP 前完成完整供應商主檔治理。

## Phase 1 正式驗收基線

Phase 1 只有在以下條件同時成立時，才視為 MVP 主線打通：

1. 需求可從多來源匯入並確認成正式 batch。
2. 已確認需求可觸發正式扣帳與 ledger。
3. 生產計畫可建立、修改，且會產生 BOM reservation run / line。
4. BOM reservation 至少可展開 sellable 組成、內包裝耗材與轉換規則來源。
5. 日終回填可形成正式事件。
6. 盤點與手工調整可形成正式事件與審計紀錄。
7. 全流程可回答：誰在何時，根據哪個來源批次、哪個 owner 規則、產生了哪些庫存事件。

## Phase 1 與後續階段的切分

### Phase 1

- 先打通日常營運主線
- 先讓需求、庫存、生產、包裝、出貨形成閉環
- 先以 CSV authoritative source + runtime validation 支撐主資料 owner

### Phase 2

- 正式化 recipe version schema、原料細節、替代料、產出率
- 擴充 Procurement 與更完整的 Master Data
- 補更完整的 RBAC、工作台與異常處理

### Phase 3

- 深化 Finance / Reconciliation
- 導入完整供應商、發票、付款、核銷、成本與關帳控制

## 關聯文件

- `doc/architecture/project_overview.md`
- `doc/architecture/modules/README.md`
- `doc/architecture/data/master_data_dictionary.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/flows/intake_demand_aggregation_spec.md`
- `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`
- `doc/architecture/flows/daily_ops_seed_bootstrap_strategy.md`
- `doc/architecture/phase1_mvp_scope_draft.md`