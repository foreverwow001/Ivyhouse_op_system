# 營運模式與正式資料庫 Provider 基線

更新日期：2026-04-08

Authoritative source：是

## 目的

本文件正式採納 Ivyhouse OP System 的兩種 operating mode，以及中短期正式資料庫 provider 基線，避免這些結論只停留在單一計畫、聊天紀錄或零散文檔中。

後續若有 plan、log、decision、deploy baseline 或環境治理文件涉及營運層級、正式 deploy 假設或資料庫 provider 選型，應以本文件為共同引用起點。

## 採納結論

### 1. 為何區分兩種 operating mode

Ivyhouse OP System 目前面對的是內部驗證與單人正式營運並存的階段。如果不明確區分 operating mode，後續文件與任務很容易在兩個方向上同時失真：

1. 把內部測試需求誤寫成正式 production 要求，造成不必要的流程負擔。
2. 把單人正式營運誤降成「只是測試」或「先簡單上線再說」，導致 backup、rollback、audit 與 secrets 管理缺位。

因此，本專案正式採納以下兩種 operating mode，並要求後續 work unit 明示自己適用哪一種模式。

### 2. 內部測試模式

#### 目標

- 支援內部驗證、流程演練、fixture / smoke 測試與受控資料操作。
- 讓團隊可以在不承擔正式營運承諾的前提下，驗證流程、畫面、腳本與治理文件是否成立。

#### 允許簡化

- 不綁 production sign-off，也不要求等同正式環境的 release approval 流程。
- 可使用測試資料、可重建資料集或受控重置環境。
- 可接受為了驗證主線而存在的短期人工操作，但必須在 plan / log 中誠實記錄。

#### 非目標

- 不作為正式營收、正式對帳或正式庫存責任的最終依據。
- 不可拿來替代正式備份、正式 rollback 準備或正式 audit trail 要求。
- 不可因為屬於測試模式，就把 secrets 管理與基本治理邊界視為可忽略。

### 3. 單人營運正式層

#### 目標

- 支援只有一位管理者的正式營運情境，讓系統能承接真實日常作業、正式 deploy 與正式資料責任。
- 在人力有限的前提下，仍維持可恢復、可追溯、可管理的正式系統最低線。

#### 最低控制

- provider-managed backup
- 固定 deploy 路徑
- 可執行 rollback
- audit trail
- secrets 管理

#### 允許簡化

- 允許只有一位管理者，不要求多管理員輪值或企業級值班配置。
- 允許依賴 managed service 提供的備份、託管資料庫與平台能力，而非一開始自建完整 SRE / DBA 體系。
- 不要求在現階段就達成多區域 active-active、企業級分權維運或大型組織的多層核決流程。

#### 非目標

- 不等同於多管理員企業 production 的完整治理模型。
- 不代表可以取消既有高風險操作的審計、approval boundary 或 rollback 準備。
- 不代表可以把單人營運的現實限制，包裝成長期缺少備份、固定 deploy 路徑或 secrets 管理的理由。

### 4. 正式資料庫 provider 決策

- 中短期 3-5 年正式資料庫 provider 首選為 Supabase PostgreSQL。
- Cloud SQL 保留為未來條件式重評選項，不是當前首選，也不是現階段技術基線。

採用 Supabase 作為中短期首選的理由是：

1. 它在目前團隊規模下，較容易滿足單人營運正式層所需的 managed backup、託管 PostgreSQL、連線治理與正式 deploy 速度。
2. 它能與現有 PostgreSQL + Prisma 基線保持一致，減少因 provider 切換而產生的 schema / migration 偏移。
3. 它更符合目前「先把正式營運最低線做穩」的策略，而不是過早為未來多管理員企業 production 預先複雜化。

### 5. Provider 重評條件

若出現以下任一條件，應啟動正式重評，而不是私下在個別任務中改寫 baseline：

1. Supabase 無法滿足實際 RPO / RTO、backup restore drill 或正式 audit 需求。
2. 出現明確的法遵、資料駐留、私網整合或權限隔離要求，超出現行 provider 能力。
3. 成本、效能、連線限制或 PostgreSQL 能力需求，已顯著偏離目前單人營運正式層與中短期規模。
4. 正式 deploy 架構從 GitHub + Cloud Run + Cloudflare 的現行方向，擴張到需要與 Cloud SQL 有更強耦合的 infra 拓樸。
5. 組織型態從單人營運正式層，明確升級為多管理員、多人分權、企業級 production 治理。

### 6. 後續引用規則

- 後續 plan 應填寫 `operating_mode`，並在涉及正式 deploy、資料庫 provider 或環境治理時引用本文件。
- 後續 log 應明確記錄本輪任務適用的 operating mode，以及是否沿用本文件的 provider baseline。
- 後續 decision 若要推翻、例外化或擴充本文件，必須先新增或更新 authority 文檔，再回寫其他基線文件。
- 若某份文件同時覆蓋兩種模式，必須明寫「兩種模式皆適用」或等價描述，不得讓讀者自行猜測。
- `cross-mode-governance` 只允許作為 plan / log / governance artifact 的 meta marker，用來表示單一文件同時覆蓋 `內部測試模式` 與 `單人營運正式層`；它不是第三種正式 operating mode，也不得被用來建立新的 deploy、sign-off 或 provider baseline。

## 反向引用鏈與關聯文件

- `../project_overview.md`：高層產品 / 營運定位以本文件作為正式 operating mode 與 provider baseline 引用起點。
- `../README.md`：architecture 總覽入口把本文件列為專案級已採納導覽之一。
- `README.md`：decisions 導覽明定涉及 operating mode、正式 deploy 層級或資料庫 provider 選型時，應先引用本文件。
- `technical_baseline_and_project_bootstrap.md`：正式 deploy 與資料庫 provider 的短結論回指本文件。
- `ci_and_env_governance_baseline.md`：環境治理最低線與 provider / deploy 升級限制回指本文件。
- `../../plans/Idx-000_plan.template.md`：以 `operating_mode` 欄位要求後續 plan 對齊本文件定義。
- `../../plans/Idx-033_plan.md`：本輪 plan 使用 `cross-mode-governance` meta marker，並明確說明它不是第三種正式 operating mode。
- `../../logs/Idx-033_log.md`：本輪 log 記錄本文件的採納、QA reviewer follow-up 與 focused validation 留痕。