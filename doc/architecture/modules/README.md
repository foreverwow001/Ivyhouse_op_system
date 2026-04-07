# Modules Architecture

本文件是 Ivyhouse OP System 的模組邊界與依賴規則權威入口。任何新功能、重構、資料契約調整或資料表設計，只要牽涉模組責任與依賴方向，都必須先對照本文件。

## 目標

- 確立模組化單體的邊界。
- 避免以畫面、單一報表或臨時需求切出平行模組。
- 給 Planner、Engineer、QA 一套一致的判定標準，知道什麼是單模組修改、什麼是跨模組高風險變更。

## 採納的架構形態

目前採納模組化單體，而非一開始就拆成多服務。

原因：

- 主資料、流程狀態、RBAC、共享鍵與財務追溯仍在收斂期。
- 現階段先把資料與流程邊界做正確，比先拆部署邊界更重要。
- 單體不代表無邊界；模組責任仍必須在程式結構、service contract 與資料寫入規則上被強制維持。

## 正式模組清單

### 1. Portal / Identity / Audit

責任：

- 認證
- 使用者、角色、權限
- 工作台、通知
- 審計與操作追蹤

### 2. Master Data

責任：

- 門市
- 倉庫
- 產品
- 配方
- 原料
- 供應商
- 客戶
- 單位與換算
- 稅別與其他共用參照資料

### 3. Procurement

責任：

- 請購
- 採購下單
- 到貨
- 驗收

### 4. Inventory

責任：

- 庫存台帳
- 批次 / 效期
- 入出庫
- 轉倉
- 盤點
- 調整

### 5. Production

責任：

- 生產排程
- 工單
- 領料
- 完工
- 報廢
- 重工

### 6. Order / Fulfillment

責任：

- 訂單
- 包裝
- 揀貨
- 出貨
- 退貨

### 7. Finance / Reconciliation

責任：

- 發票
- 付款 / 收款
- 核銷
- 成本
- 對帳

### 8. Analytics / Reporting

責任：

- 營運儀表板
- 管理報表
- 例外追蹤與分析視圖

## 模組依賴原則

### 允許的依賴方向

- 業務模組可讀取 Master Data 的正式主資料。
- Procurement、Production、Order / Fulfillment、Finance 可透過正式 contract 使用 Inventory 事實資料。
- Analytics / Reporting 可讀取各模組正式輸出或受控投影，但不得成為反向寫入來源。
- Portal / Identity / Audit 可被所有模組引用於認證、授權與審計。

### 禁止的依賴方向

- Analytics / Reporting 不得直接改寫業務模組資料。
- 非 owner module 不得直接改寫他模組的主資料或交易事實。
- UI 不得自行聚合出一套未被 backend 正式定義的 workflow 狀態並回寫。
- Finance 不得為了配平對帳而直接覆寫 Inventory、Production 或 Order 的原始事實。

## Shared utility 與 shared contract

### Shared utility

僅允許放置真正跨模組且無業務語意偏向的能力，例如：

- logging
- tracing
- 時間 / ID / formatting helpers
- 基礎錯誤模型

若 utility 開始帶有特定業務語意，就應回歸 owner module，而不是留在 shared。

### Shared contract

以下屬 shared contract，變更時必須視為跨模組高風險：

- shared key 命名或型別
- API payload / DTO 被多模組共用的欄位
- event payload
- report extract schema
- migration 會影響多模組引用的欄位

## 跨模組高風險變更判定

符合下列任一條件，預設視為高風險：

- 變更 shared key 或 schema contract
- 變更配方、批次、庫存、發票、付款、對帳相關資料結構
- 變更核心 workflow 狀態名稱或轉移規則
- 變更 RBAC、approval boundary 或高風險操作權限
- 讓某模組直接寫入另一模組正式 owner 的資料

高風險變更在 Plan 中必須明確填寫：

- `MASTER DATA IMPACT`
- `STATE / WORKFLOW IMPACT`
- `RBAC IMPACT`
- `SHARED KEY / CROSS-MODULE IMPACT`

## Phase 0 程式結構落地原則

在正式程式碼樹尚未建立前，任何新目錄或新 app/module 設計，都要先映射到這份模組表。若無法映射，應先補 architecture decision，而不是直接創建新模組。