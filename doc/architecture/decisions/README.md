# Architecture Decisions

本文件是 Ivyhouse OP System 在 Phase 0 的架構決策總覽。正式 ADR 檔案尚未逐一建立前，本文件記錄目前已採納、暫不採納與明確拒絕的關鍵決策，供 Planner、Engineer、QA 與 Domain Expert 作為共同基線。

## 使用方式

- 若某項決策已在此文件明確採納，後續規格與實作不得自行推翻。
- 若本輪需求需要推翻、擴充或例外化既有決策，應先新增 ADR 或更新本文件，再進入實作。
- 若 repo 內其他文件與本文件衝突，以較新的正式 ADR 為準；若尚無 ADR，則以本文件為準。

## 已採納決策

### ADR-001 模組化單體優先

- Context:
  - 專案仍在 Phase 0，主資料、狀態流、RBAC 與共享契約尚未穩定。
- Adopted option:
  - 先採模組化單體，不先拆多服務。
- Why:
  - 現階段最大風險在領域邊界與資料治理，而非部署切分。
- Downstream implications:
  - 程式可共用同一資料庫，但必須維持 owner module write rule。

### ADR-002 PostgreSQL + Prisma 為主要資料實作基線

- Context:
  - 專案需要一致的交易資料、schema 管理與 migration 能力。
- Adopted option:
  - PostgreSQL 作為主要資料庫；Prisma 作為主要 ORM / migration 工具。
- Rejected alternatives:
  - 早期混用多資料庫
  - 先用無 schema 約束的資料存取模式
- Downstream implications:
  - schema 變更應優先透過 Prisma Migrate 管理；若需受控 SQL，必須在 Plan 中明寫。

### ADR-003 主資料與共享鍵先行治理

- Context:
  - 產品、配方、原料、倉庫、訂單、工單、發票與付款等資料會跨多模組流動。
- Adopted option:
  - 先建立主資料治理、shared key 規則與 owner 定義，再進行大規模功能實作。
- Downstream implications:
  - 缺主資料字典、shared key contract 或 state 定義時，Planner 應先補治理工作，而非硬推實作。

### ADR-004 配方版本與庫存追溯不可省略

- Context:
  - 烘焙營運系統的生產與成本計算依賴配方與耗料歷史。
- Adopted option:
  - 配方必須版本化；庫存必須保留異動台帳、批次與來源單據。
- Rejected alternatives:
  - 直接覆寫現行配方
  - 僅存當前庫存量，不保留異動事實
- Downstream implications:
  - 任何簡化方案都不得破壞追溯性。

### ADR-005 財務結果必須追溯到交易事實

- Context:
  - 發票、付款、核銷與對帳需面對營運與稽核要求。
- Adopted option:
  - 財務結果必須建立在正式交易事件上，不可反向改寫交易事實來配平。
- Downstream implications:
  - Finance / Reconciliation 與 Order、Inventory、Production 的資料耦合必須透過正式 contract 管理。

### ADR-006 Dev workflow 採 PTY 主路徑，fallback 僅在同意下啟用

- Context:
  - 目前 repo 的 agent workflow 依賴 PTY runtime 進行 prompt、submit、verify、monitor。
- Adopted option:
  - 以 PTY 為主路徑；fallback 僅在 PTY 不可用且使用者明確同意時啟用。
- Downstream implications:
  - Plan / Log 必須記錄 execution backend policy。

### ADR-007 Production-planning revision 鏈 Phase 1 不設硬性上限

- Context:
  - production-planning 已正式採用 `revised_from_id`、approval persistence 與 audit trace；`Idx-022` 收尾時確認 revision 鏈長治理需補正式決策。
- Adopted option:
  - Phase 1 不設 revision 鏈硬性上限，保留完整 revision 歷史與審計鏈。
- Why:
  - revision 屬高風險庫存與排程事實，不可為了限制鏈長而截斷歷史。
  - 現階段真正需要的控制點是 approval、audit 與人工覆核，而不是自動刪鏈。
- Downstream implications:
  - `ProductionPlanHeader.revisedFromId` 形成的版本鏈必須完整保留。
  - 若營運認定 revision 鏈過長，處理方式應為人工覆核並建立新的 plan 起點，不得刪改舊鏈。

### ADR-008 `admin + supervisor` 交集不得放寬高風險業務 approver 邊界

- Context:
  - roles 權威文件已定義 `主管` 為正式業務 approver、`管理員` 為系統治理角色；`Idx-022` 收尾時需把兩者交集政策正式明文化。
- Adopted option:
  - 當同一帳號同時具有 `管理員` 與 `主管` 時，高風險業務 approval 一律以 `主管` 身分認定。
- Why:
  - `管理員` 負責系統治理，不應因權限較大而放寬業務 maker-checker 邊界。
  - 這可維持 roles README 與 daily-ops approval flow 的一致性。
- Downstream implications:
  - service / guard / audit contract 必須依正式業務角色判定 approver 合法性，不能把 `管理員` 視為額外放行來源。
  - 單人營運期間若同一帳號同時帶有 `主管 + 管理員`，`singlePersonOverride` 仍只以 `主管` 邊界成立。
  - audit 應保留 approval 當下的完整 `roleCodes` 快照，但最終合法性只看 required business role 是否成立。

## 暫不採納決策

### 分散式微服務

- 理由:
  - 目前沒有證據顯示部署切分比資料與流程治理更急迫。

### Event sourcing 全面落地

- 理由:
  - 追溯性重要，但目前先建立清楚的交易事實、台帳與審計，未必需要全面 event sourcing。

### 允許模組自由共享資料表寫入

- 理由:
  - 這會直接破壞 owner module write rule 與資料責任邊界。

## 後續應拆出的正式 ADR 主題

- module package / app 結構落地方式
- Prisma schema 邊界與 migration policy
- RBAC matrix 與 approval boundary
- state machine definitions
- integration strategy
- observability baseline

## 已掛載補充文件

- `technical_baseline_and_project_bootstrap.md`：收斂正式技術棧、workspace / bootstrap 邊界、repo 現況骨架與 deferred 缺口，供 `Idx-007` 與後續 deploy / frontend / observability work unit 引用

在這些 ADR 尚未拆出前，本文件就是 Ivyhouse OP System 的架構決策最低權威來源。