# Portal Landing Flow Mapping Spec

更新日期：2026-04-04

Authoritative source：是

## 目的

本文件定義 Ivyhouse OP System 第一版 login 後 landing page 的流程節點、分群、模組映射、角色入口與第一版範圍限制，供 `Idx-023` 前端 Portal 進入實作前使用。

本文件回答的是：

1. 第一版 landing page 要展示哪些節點。
2. 每個節點對應哪個正式模組與哪種入口行為。
3. 哪些節點在第一版是可點入口，哪些只是流程認知節點。
4. 哪些內容屬於後續版本，不應偷渡進第一版。

## 設計背景

根據 `portal_ui_ux_baseline.md`，第一版 landing page 定位為「流程導向入口頁」，而非 KPI dashboard。

因此 landing page 的首要任務不是展示數字，而是：

- 幫使用者快速理解系統主線
- 讓不同角色找到自己的入口
- 把當前 Phase 1 MVP 已有與即將落地的能力清楚分層

## 與產品主線的對齊

Landing page 的流程圖必須映射到 `project_overview.md` 定義的正式主線：

`訂單 -> 生產排程 -> 原料扣料 / 領料 -> 生產完成 -> 包裝 -> 出貨 -> 發票 / 收付款 / 核銷 / 對帳`

但第一版 landing page 不要求把所有終局能力都做成可操作入口；必須依 Phase 1 scope 與 `Idx-023` blocker 現況分層。

## 第一版節點分層原則

### A. 可直接進入的第一層節點

這些節點應成為第一版可點入口，因為它們要嘛已存在後端能力，要嘛是 `Idx-023` 明確要補的前端主入口。

1. 需求匯入 / Intake
2. 當日扣帳 / Daily Ops
3. 生產規劃 / Production Planning
4. 盤點調整 / Inventory Count
5. 主資料 / Master Data

### B. 需在流程上可見，但第一版不一定可點的第二層節點

1. 採購 / 收貨
2. 包裝 / 出貨
3. 報表 / 分析
4. 財務 / 對帳

這些節點可在 landing page 上保留流程定位，但第一版可先標示為 `coming soon`、`phase 2` 或僅作認知節點。

### C. 不應在第一版放成主節點的內容

1. 細部 KPI 儀表板
2. 大量近期活動 feed
3. 高複雜度自訂快捷工作台
4. 完整通知中心

## 第一版節點規格

| 節點 | 類型 | 對應正式模組 | 第一版狀態 | 點擊後行為 | 主要角色 |
|---|---|---|---|---|---|
| 需求匯入 | 主節點 | Portal / Intake | 可點 | 進入 batch upload / parse / review / confirm 首頁 | 會計、主管、行政 |
| 當日扣帳 | 主節點 | Daily Ops / Inventory | 可點 | 進入正式扣帳與日常營運操作頁 | 生產、包裝及出貨、會計、主管 |
| 生產規劃 | 主節點 | Production | 可點 | 進入排工、BOM 重算、reservation 相關頁面 | 生產、包裝及出貨、會計、主管 |
| 盤點調整 | 主節點 | Inventory | 可點 | 進入盤點 session / adjustment 入口 | 生產、包裝及出貨、會計、主管 |
| 主資料 | 主節點 | Master Data | 可點 | 進入原料、配方、門市/倉庫、對照表管理入口 | owner 角色、主管 |
| 採購 / 收貨 | 認知節點 | Procurement | 顯示但不優先進入 | 第一版可為 disabled / future node | 採購 |
| 包裝 / 出貨 | 認知節點 | Order / Fulfillment | 顯示，可視情況進入 | 若 `Idx-023` 有實作則可點，否則 phase marker | 包裝及出貨、會計、主管 |
| 報表 / 分析 | 認知節點 | Analytics / Reporting | 顯示但非主入口 | 可導向 placeholder 或 future page | 主管、會計、稽核 |
| 財務 / 對帳 | 認知節點 | Finance / Reconciliation | 顯示但先不實作主入口 | future node | 會計、主管 |

## 節點文案規則

每個節點在 landing page 上至少需包含：

1. 中文主標題
2. 一句動作導向短說明
3. 2.5D icon
4. 狀態標記：`available` / `phase 1` / `future`

文案要描述「進去可以做什麼」，不是只寫模組名。

### 文案範例方向

- `需求匯入`：上傳並確認每日需求批次
- `當日扣帳`：查看正式扣帳與當前庫存影響
- `生產規劃`：建立隔日排工並重算 BOM reservation
- `盤點調整`：建立盤點並追蹤差異調整
- `主資料`：維護原料、配方與對照規則

## 第一版視覺分群規則

### 群組 A：今日營運主線

- 需求匯入
- 當日扣帳
- 生產規劃
- 盤點調整

這組應是 landing page 視覺中心，因為它們最貼近 Phase 1 MVP 主線與目前後端現況。

### 群組 B：治理與設定

- 主資料
- 權限 / 系統設定（若第一版有）

這組不應比主線更搶眼，但需存在清楚入口。

### 群組 C：延伸流程與後續能力

- 採購 / 收貨
- 包裝 / 出貨
- 報表 / 分析
- 財務 / 對帳

這組應明確區分出「已可用」與「後續階段」的差異，避免使用者誤認為所有模組都已完成。

## 角色入口規則

Landing page 不應一開始就做成複雜的角色專屬首頁，但需支援角色導向提示。

### 基本規則

- 所有使用者看到的是同一張流程地圖。
- 但可依角色高亮常用節點，或在節點下標示「你最常使用」。

### 建議角色高亮

| 角色 | 優先高亮節點 |
|---|---|
| 生產 | 當日扣帳、生產規劃、盤點調整 |
| 包裝及出貨 | 當日扣帳、生產規劃、包裝 / 出貨 |
| 會計 | 需求匯入、當日扣帳、財務 / 對帳 |
| 主管 | 需求匯入、生產規劃、主資料、報表 / 分析 |

## 第一版 page behavior 規格

### 1. 節點狀態

每個節點需定義以下至少一種狀態：

- `available`
- `coming-soon`
- `disabled-by-role`

### 2. 點擊行為

- `available`：導向該模組首頁或工作台首頁
- `coming-soon`：顯示標記，不導向正式空頁迷宮
- `disabled-by-role`：顯示不可進入原因，不隱藏整個節點

### 3. 視覺層級

- 可用節點視覺權重最高
- 未完成節點應明顯較淡，但不能像消失
- 關聯線與流程箭頭只作導覽，不可變成主要視覺噪音

## 第一版與實際 backend 現況的對齊

截至目前程式碼樹，`apps/api/src/app.module.ts` 已接上的主模組是：

- `IntakeModule`
- `DailyOpsModule`

因此 landing 第一切片的 UI 實作優先順序應與 runtime 現況一致：

1. 需求匯入
2. 當日扣帳 / Daily Ops
3. 生產規劃 / 盤點調整（承接 daily-ops 範圍）
4. 主資料入口

不應先把財務、採購或大型報表做成 landing 的主互動中心。

## 第一版不做的事

- 不做完整 KPI dashboard
- 不做可自訂拖拉式首頁
- 不做複雜個人化推薦模組
- 不做跨模組深層待辦整合
- 不做完整通知中心

## 實作前需先確認的最小事項

1. 第一版節點最終名稱是否採本文件命名
2. 哪些節點為 `available`，哪些為 `coming-soon`
3. 每個節點的導向 path 或 placeholder strategy
4. 是否要在第一版加入角色高亮
5. 是否要在 landing page 加入少量「最近任務 / 待處理」區塊，若有也只能是次要區

## Done 定義

本文件視為 ready for implementation 的條件：

1. 前端可直接依此畫出 landing page 第一版資訊架構
2. Planner / Engineer / QA 對第一版哪些節點要能點、哪些只顯示有共同理解
3. 不會在實作中臨時擴張出與 Phase 1 無關的首頁 scope

## 關聯文件

- `doc/architecture/project_overview.md`
- `doc/architecture/phase1_mvp_scope.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/modules/portal_ui_ux_baseline.md`
- `doc/plans/Idx-023_plan.md`