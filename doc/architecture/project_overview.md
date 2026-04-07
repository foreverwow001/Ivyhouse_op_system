# Ivyhouse OP System 專案總覽

更新日期：2026-04-01

Authoritative source：是

## 目的

本文件是 Ivyhouse OP System 的 repo-native 專案總覽。它用來正式定義本專案要建構的產品全貌、核心營運主線、模組邊界、分期策略與實作優先順序，讓後續的架構文件、Plan、Log、Spec 與程式碼實作都能引用同一份專案級北極星文件。

本文件回答的是「這個系統最終要成為什麼」與「應以什麼順序落地」，不取代主資料字典、流程細規、RBAC matrix、shared key contract 或 implementation roadmap。

## 專案定位

Ivyhouse OP System 是一套烘焙營運管理系統的 web application。

它不是展示型網站，不是單一報表工具，也不是只處理記帳、庫存或生產其中一段的局部工具。它的目標是以單一系統支撐門市營運、採購、庫存、生產、包裝、出貨、財務與管理決策，並把跨部門資料流收斂到同一套正式主資料、流程狀態與權限邊界之上。

## 最終目標

本專案的正式產品目標如下：

> 從接單到生產、包裝、出貨、對帳，所有資料一次輸入、全流程可追蹤、庫存與成本即時可見，並透過單一系統支撐各部門協作與營運決策。

這個目標包含四個不可偏離的核心要求：

1. 一次輸入
2. 全流程可追蹤
3. 庫存與成本即時可見
4. 支撐跨部門協作

若後續功能、畫面、API 或資料模型無法支撐上述四點，應視為偏離專案主線。

## 成功指標

若本系統做對，理想狀態應該是：

1. 訂單建立後，可以一路追到生產、包裝、出貨與帳務。
2. 庫存與耗料不需要靠人工補記才能成立。
3. 各部門對同一筆資料的理解一致。
4. 管理者可以快速回答「今天做了什麼、出了什麼、缺什麼、收了多少、還欠多少」。

這四項場景是最終目標的具體驗收參照，後續 Phase 1 MVP、功能驗收與上線判定都應回看這些場景。

## 產品範圍

本系統的正式產品範圍包含以下能力：

1. 訂單與履約管理
2. 主資料治理
3. 採購與供應
4. 庫存與批次追溯
5. 生產排程與製作執行
6. 包裝與出貨
7. 財務與對帳
8. Portal、RBAC、審計與營運分析

本系統不應被拆解成互相獨立開發後再硬整合的多套工具；它必須是一套共享主資料、共享流程語意與共享審計邊界的完整 web application。

## 架構方向

本專案採模組化單體作為正式架構方向，而不是一開始就拆成多服務。

採用理由如下：

1. 目前最關鍵的風險是主資料、流程狀態、RBAC、shared key 與財務追溯的一致性，而不是部署切分。
2. 對中小型團隊而言，單一部署面、單一資料一致性模型與較低維運成本比早期微服務更重要。
3. 本系統的模組天然高度耦合，需要的是有邊界的共享資料，而不是彼此完全孤立。

### 明確不採的做法

以下做法在本專案中明確不採用，風險高於收益：

- ERP 一套、會計一套、生產一套、出貨一套，各自獨立開發後再整合。
- 一開始就做多服務架構。
- 還沒定義主資料就先大量做畫面與報表。
- 先做完整會計系統，再回頭接交易資料。

正式技術基線以 [project_rules.md](/workspaces/Ivyhouse_op_system/project_rules.md) 為準，目前採：TypeScript + NestJS、Next.js + React + TypeScript、PostgreSQL、Prisma、Prisma Migrate、容器化部署。

## 正式模組地圖

本專案以以下模組作為正式系統切分基準：

1. Portal / Identity / Audit
2. Master Data
3. Procurement
4. Inventory
5. Production
6. Order / Fulfillment
7. Finance / Reconciliation
8. Analytics / Reporting

上述 8 個正式模組是藍圖原始五大塊的細化拆分。對應關係如下：

- 藍圖「Portal 與共用基礎層」→ Portal / Identity / Audit
- 藍圖「ERP / 營運核心模組」→ Master Data + Procurement + Inventory + Order / Fulfillment
- 藍圖「生產管理模組」→ Production
- 藍圖「包裝與出貨模組」→ 併入 Order / Fulfillment（包裝、揀貨、出貨）
- 藍圖「會計與對帳模組」→ Finance / Reconciliation
- Analytics / Reporting 為藍圖未獨立列出、但本 repo 正式新增的模組

各模組責任與禁止耦合規則，以 [modules/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/modules/README.md) 為準。

## 核心營運主線

Ivyhouse OP System 的核心營運主線如下：

訂單 -> 生產排程 -> 原料扣料 / 領料 -> 生產完成 -> 包裝 -> 出貨 -> 發票 / 收付款 / 核銷 / 對帳

這條主線是整個系統的資料骨幹。後續任何子流程、例外處理、報表、權限或整合設計，都必須能回答自己位於這條主線的哪個節點，以及它依賴哪個正式交易事實。

## 產品設計原則

### 1. 主資料先行

- 產品、配方、原料、供應商、客戶、門市、倉庫、包材、出貨用品等必須先成為正式主資料。
- 非正式主資料不得在交易流程中被自由文字臨時創建成有效實體。

### 2. 交易事實優先於報表結果

- 採購、收貨、領料、完工、包裝、出貨、發票、付款、核銷與對帳都必須保留正式交易事實。
- 財務與管理結果必須建立在可追溯的來源事件上。

### 3. 配方、庫存與財務不可失真

- 配方必須版本化。
- 庫存必須保留台帳、來源單據、批次與效期治理。
- 財務結果不可反向覆寫交易原始事實來湊帳。

### 4. 權限與審計不是後補功能

- 影響主資料、庫存、配方、金額、關帳與權限的操作，必須保留 maker-checker 或等價控制。
- 角色邊界、可見性與審計能力必須在設計階段就被納入，而不是上線前再補。

## 分期策略

### Phase 0：治理與權威文件基線

目標：建立可支撐正式實作的權威文件與治理骨架。

本階段重點包括：

1. 模組邊界
2. 主資料字典
3. shared key contract
4. 共通流程與狀態語意
5. RBAC / approval matrix
6. 技術基線與 bootstrap 策略

### Phase 1：打通接單到出貨主線

目標：建立第一個可工作的產品主線，讓訂單、工單、耗料、包裝、出貨與基本庫存追溯形成閉環。

優先模組應集中在：

1. Master Data
2. Order / Fulfillment
3. Production
4. Inventory

Phase 1 不應先把財務、稅務、複雜排班最佳化或高度自動化成本模型做滿。

Phase 1 MVP 驗收基線以 `doc/architecture/phase1_mvp_scope.md` 為準。

在正式 scope 採納前的六項暫行參照如下，現已由正式 scope 承接：

1. 訂單能轉工單
2. 工單能扣料
3. 工單完成能進包裝
4. 包裝完成能進出貨
5. 出貨完成能回寫訂單狀態
6. 基本庫存變動可追溯

上述六項閉環成立，才視為 Phase 1 主線打通。

### Phase 2：補強營運管理與可視性

目標：在主線穩定後，補強採購、供應、進階排程、排班、儀表板與異常管理能力。

### Phase 3：深化財務整合

目標：在乾淨交易資料之上，逐步深化應收應付、發票、對帳、成本分析與更完整的財務控制。

## Phase 1 實作優先順序原則

在正式 implementation roadmap 建立前，先採以下優先順序原則：

1. 先做能打通訂單 -> 生產 -> 包裝 -> 出貨主線的能力。
2. 先做能支撐主線的主資料、shared key、流程狀態與 RBAC。
3. 會計與對帳依附於已穩定的交易事實逐步深化，不先獨立做深。
4. 不在主資料、流程與權限尚未穩定前，優先投入大量報表或多系統整合。

## 當前 repo 階段

截至 2026-03-28，本 repo 仍位於「Phase 0 後段，朝 Phase 1 implementation-ready 收斂」的階段。

目前已存在的正式基線包括：

1. 模組邊界與架構決策
2. 主資料字典第一版
3. shared key contract 第一版
4. 統一狀態語意
5. 出貨用品人工盤點基線
6. RBAC / approval matrix 第一版

### Phase 0 退出條件

#### 權威來源：project_rules.md §5.3

依 [project_rules.md](/workspaces/Ivyhouse_op_system/project_rules.md) §5.3（規則優先順序最高），Phase 0 前置條件為以下 7 項皆須有可執行初版：

1. 已確認 authoritative docs inventory 與文件責任邊界 — **已達成**
2. 已定義初版模組地圖與依賴方向 — **已達成**
3. 已建立初版主資料字典（至少涵蓋門市、產品、配方、原料、供應商、倉庫、工單、訂單、發票、付款） — **部分達成**（門市、供應商、倉庫、工單、訂單、發票、付款尚未 formalize）
4. 已建立核心流程與狀態模型（採購→入庫、生產→完工、訂單→出貨、發票→對帳） — **部分達成**（有主線定義與統一狀態語意，但尚缺獨立流程圖與 state machine definitions）
5. 已建立 RBAC 初版矩陣 — **部分達成**（僅覆蓋四表高風險治理）
6. 已列出共享鍵與跨模組契約 — **部分達成**（覆蓋六張 CSV 範圍，尚未擴及全系統）
7. 已確認技術基線與 bootstrap 方向 — **已達成**（技術棧已選定，dev container 已建；但 app 骨架尚未建立）

退出條件還要求：上述文件皆完成至少一次 domain review；若涉及高風險面，需同步完成 security review 或財務審查。

#### 補充來源：downstream customization execution plan

依 [downstream customization execution plan](/workspaces/Ivyhouse_op_system/obsidian-vault/20-reviewed/Ivyhouse_op_system/development-reference/2026-03-23-bakery-project-downstream-customization-execution-plan.md)，Phase 0 退出另須滿足：

1. 主資料字典已覆蓋 Phase 1 MVP 涉及實體 — **部分達成**
2. 核心流程圖已涵蓋訂單 → 生產 → 包裝 → 出貨主線 — **部分達成**
3. downstream `project_rules.md` 已完成客製化 — **已達成**
4. downstream `domain_expert.md` 已完成客製化 — **已達成**
5. Phase 1 MVP scope 已由決策者確認 — **已達成**

#### 結論

project_rules.md §5.3 有 7 項前置條件，目前為 3 項已達成、4 項部分達成；其中技術基線雖已達成，但實際 NestJS / Next.js / Prisma 應用程式骨架仍未建立。execution plan 有 5 項，目前為 2 項已達成、2 項部分達成、1 項未達成。兩組條件並存，以 project_rules.md 為優先。

尚未滿足全部退出條件，不應直接假設高風險業務功能已具備 implementation-ready 前提。

目前仍未完成、但屬於產品藍圖必要缺口的項目包括：

1. ~~repo-native 正式專案總覽之外的正式 Phase 1 MVP scope~~ — **已解決**（2026-04-01）。`phase1_mvp_scope.md` 已建立並採納。
2. core operating flow spec 與流程圖
3. 顯式 state machine definitions
4. 尚未 formalize 的其餘主資料實體
5. 原料、配方、包材、出貨用品的細部規格
6. 實際 NestJS / Next.js / Prisma 應用程式碼骨架

## 待決策的開放問題

以下來自藍圖的開放問題尚未完全確認，會直接影響 Phase 1 MVP scope 與資料模型設計：

1. 訂單來源有哪些，是否需要多通路匯入。
2. 產品是否有規格、口味、組合、禮盒等多層變體。
3. 生產流程是否存在多工序、多產線或設備限制。
4. 庫存是否需要批號、效期與冷藏管理。
5. 包裝與出貨是否區分自取、宅配、門市配送、批發出貨。
6. 會計整合深度要做到管理帳、財務帳，還是先做營運對帳層。
7. 角色是否只有部門別，或還要細到主管、審核者、行政助理等層級。

這些問題的解答應優先透過業務流程收集取得，再回寫到對應的權威文件。

## 與其他權威文件的關係

- 本文件定義專案級產品目標與分期原則。
- 模組責任與依賴方向，以 [modules/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/modules/README.md) 為準。
- 主資料與 shared key，以 [data/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/data/README.md) 與其子文件為準。
- 流程與狀態，以 [flows/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/flows/README.md) 與其子文件為準。
- RBAC 與 approval boundary，以 [roles/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/roles/README.md) 為準。
- 具體任務排序與狀態，以 [doc/implementation_plan_index.md](/workspaces/Ivyhouse_op_system/doc/implementation_plan_index.md) 為準。

## 關聯文件

- [project_blueprint_alignment_draft.md](/workspaces/Ivyhouse_op_system/doc/architecture/project_blueprint_alignment_draft.md)
- [project_rules.md](/workspaces/Ivyhouse_op_system/project_rules.md)
- [doc/implementation_plan_index.md](/workspaces/Ivyhouse_op_system/doc/implementation_plan_index.md)
- [modules/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/modules/README.md)
- [data/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/data/README.md)
- [flows/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/flows/README.md)
- [roles/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/roles/README.md)
- [decisions/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/decisions/README.md)