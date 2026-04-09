# Ivyhouse OP System Implementation Plan Index

本文件是 Ivyhouse OP System 的實作計畫總索引。此版本先建立 Phase 0 與基礎建設工作的排序、依賴與狀態，讓團隊可以依 index 直接啟動正式 work unit，而不是再回到模板階段。

## 任務索引

`Track` 只用來區分任務工作焦點，enum 僅允許 `product-system` 與 `workflow-core`；它不代表營運層級，也不取代 plan 內的 `Operating Mode`。

| Task ID | 名稱 | 階段 | Track | 狀態 | depends_on | 主要輸出 | 啟動說明 |
|---------|------|------|-------|------|------------|----------|----------|
| Idx-001 | Phase 0 權威文件盤點與責任界定 | Phase 0 | product-system | Completed | - | 權威文件清單、文件 owner、文件優先順序 | 已以 `project_rules.md`、`doc/architecture/README.md` 與各 README 入口建立權威文件層級與責任邊界，並補建正式 plan/log artifact |
| Idx-002 | 架構骨架與模組地圖第一版 | Phase 0 | product-system | Completed | Idx-001 | 模組清單、責任分工、依賴方向、禁止耦合清單 | 已以 `project_overview.md` 與 `modules/README.md` 落正式模組地圖與依賴方向，並補建正式 plan/log artifact |
| Idx-003 | 主資料字典第一版 | Phase 0 | product-system | Completed | Idx-001, Idx-002 | 門市、產品、配方、原料、供應商、倉庫、工單、訂單、發票、付款等核心實體定義 | 已完成第一版主資料字典，正式收斂既有 CSV 主資料與原料 / 配方版本 / 出貨用品的最低治理結構；其餘核心實體留待後續擴版 |
| Idx-004 | 工作流程與狀態模型第一版 | Phase 0 | product-system | Completed | Idx-002, Idx-003 | 採購到入庫、生產到完工、訂單到出貨、發票到對帳的狀態模型 | 已完成統一狀態語意、出貨用品人工盤點細則、日常營運 flows 規格與工程拆解；完整全域 state machine 留待後續 work unit |
| Idx-005 | RBAC 矩陣第一版 | Phase 0 | product-system | Completed | Idx-002, Idx-004 | 角色清單、可見性、操作權限、核准責任、maker-checker 邊界 | 已完成四表直連高風險操作與規則核定角色第一版；residual risks 已由 `Idx-021`、`Idx-022` 與後續治理 work units 承接 |
| Idx-006 | 共用鍵與跨模組契約第一版 | Phase 0 | product-system | Completed | Idx-003, Idx-004 | key owner、引用規則、shared contract、禁止直接耦合清單 | 已完成六張 CSV shared key contract 第一版、lifecycle / audit 欄位與正式核定語意收斂；其他模組 contract 留待後續 work unit |
| Idx-007 | 技術基線與專案 bootstrap 第一版 | Phase 0 | product-system | Completed | Idx-001, Idx-002 | 後端、前端、資料庫、migration、部署、可觀測性與本機開發策略 | 已完成技術基線與 project bootstrap 第一版治理收斂；frontend / infra / observability 實作留待後續 work unit |
| Idx-008 | 財務與對帳控制基線第一版 | Phase 0 | product-system | Completed | Idx-003, Idx-004, Idx-005, Idx-006 | 發票、付款、核銷、成本、結帳、對帳邊界與審核點 | 已完成財務 / 對帳控制基線 authority doc、artifact 鏈與 deferred / gate 判定；對現行 Phase 1 屬受控 deferred，對 future finance-bearing work unit 屬 implementation-ready gate |
| Idx-009 | 四渠道 intake mapping bootstrap 第一版 | Phase 1 | product-system | Completed | Idx-003, Idx-004, Idx-006 | analyzer rule inventory、最小 mapping engine、四渠道 sample mapping fixtures | 已完成四渠道 bootstrap mapping engine、rule inventory、18 筆 fixture 與 API smoke evidence；正式 SKU bridge 留待後續 work unit |
| Idx-010 | 四渠道特殊項治理基線第一版 | Phase 1 | product-system | Completed | Idx-003, Idx-006, Idx-009 | 特殊項治理規則、SKU 接線前置條件、例外邊界 | 已完成 `補寄商品專用/勿下單`、咖啡、`提袋加購` 的正式治理分類與 SKU bridge 前置條件；補寄流程模型與提袋多粒度擴張留待後續 work unit |
| Idx-011 | Prisma migration 衛生與 release-safe schema path 收斂 | Phase 1 | product-system | Completed | Idx-004, Idx-007 | 可正式 `migrate deploy` 的 migration 路徑、測試 DB bootstrap 策略、migration hygiene 清單 | 已恢復正式 `migrate deploy` 路徑並完成 review/evidence；deployment replay 與 governance 殘餘風險轉交 `Idx-019` |
| Idx-012 | Opening balance bootstrap runbook 與首盤演練 | Phase 1 | product-system | Completed | Idx-004, Idx-006, Idx-011 | opening balance SOP、首盤前置條件、首盤 evidence、失敗補救步驟 | 已完成 opening balance runbook、rehearsal 與窗口鎖定 evidence；多窗口 / 中斷補救殘餘風險轉交 `Idx-020` |
| Idx-013 | Inventory count 高風險操作最小權限閘與驗收硬化 | Phase 1 | product-system | Completed | Idx-004, Idx-005, Idx-011 | 盤點完成 / 手動調整最小 guard、API 驗收矩陣、風險邊界說明 | 已完成 inventory-count 最小權限閘與 review/evidence；正式 auth 與 maker-checker 殘餘風險轉交 `Idx-021` |
| Idx-014 | CSV owner 例外正規化與 runtime validation 收斂 | Phase 1 | product-system | Completed | Idx-003, Idx-004, Idx-006 | `compositionInputType + compositionInputSku` 正規化策略、CSV owner validation、shared key 例外 runtime 規則 | 已完成 direct-pack runtime normalization 與 focused review/evidence；後續 schema 正規化由共享鍵 / workflow 權威文件持續承接 |
| Idx-015 | 日常營運主線 E2E smoke 與 evidence | Phase 1 | product-system | Completed | Idx-009, Idx-010, Idx-011, Idx-012, Idx-013, Idx-014 | demand → deduction → plan → BOM → replenishment → count → adjustment → audit 的端到端 smoke 與 evidence | 已完成 mainline E2E smoke 與 re-review；deploy runbook、sign-off 與正式 auth 殘餘風險由 `Idx-017`、`Idx-018`、`Idx-021` 承接 |
| Idx-016 | 日常營運回歸 fixture matrix 與 failure-path 驗收 | Phase 1 | product-system | Completed | Idx-013, Idx-014, Idx-015 | regression fixtures、failure-path 驗收矩陣、rerun / rollback / reminder / zero-baseline 例外覆蓋 | 已完成 regression suite 與 re-review；rollback runbook、sign-off 與正式 auth 殘餘風險由 `Idx-017`、`Idx-018`、`Idx-021` 承接 |
| Idx-017 | 部署、bootstrap 與 rollback runbook | Phase 1 | product-system | Completed | Idx-011, Idx-012, Idx-015 | migrate / seed / opening balance / first batch / rollback 的操作手冊與環境前置 | 已完成 rehearsal、readback、Security / Domain review 與風險收口；殘餘風險轉交 `Idx-018` sign-off 管理 |
| Idx-018 | Phase 1 MVP review pack 與 go-live sign-off | Phase 1 | product-system | Completed | Idx-015, Idx-016, Idx-017 | cross-QA、domain/security review evidence、MVP 驗收清單、go-live sign-off 套件 | 已完成最終 sign-off 判定；結論為 `PASS_WITH_RISK`，允許在受控 operating envelope 下 go-live，殘餘風險與 deferred 已正式列管 |
| Idx-019 | Migration governance 與 deployment replay 補強 | Phase 1 | product-system | Completed | Idx-011, Idx-017 | migration governance 規則、deployment replay evidence、正式環境前置檢查清單 | 已完成治理文件、最小 deployment replay、Security / Domain review 與風險收口；正式環境差異風險轉交 `Idx-018` sign-off 管理 |
| Idx-020 | Opening balance 多窗口 / 中斷補救治理補強 | Phase 1 | product-system | Completed | Idx-012, Idx-017 | 首盤中斷補救、跨倉 / 多窗口規則、取消 / 恢復策略 | 已完成單倉 opening balance 的 cancel-only recovery、不同 countScope 不可平行、禁止 live ops during opening balance、runbook / policy / API contract 與 focused smoke evidence；多倉與 resume 保留後續擴張 |
| Idx-021 | Inventory-count / Production-planning 正式 auth 與 maker-checker 補強 | Phase 1 | product-system | Completed | Idx-013, Idx-015, Idx-016, Idx-017 | 正式身份驗證承接、inventory-count / production-planning 角色邊界終版、approval skeleton、maker-checker 路徑 | 已完成第一個正式實作切片：Portal session principal 已取代過渡身份來源，inventory-count approval skeleton 已落地，production-planning 已切至 principal 驅動；殘餘角色邊界風險轉交 sign-off 管理 |
| Idx-022 | Production-planning 完整 approval persistence 與 approver boundary 收斂 | Phase 1 | product-system | Completed | Idx-018, Idx-021 | production-planning approval persistence、plan/rerun 決策端點、`管理員` 最終 approver 邊界收斂、deploy preflight evidence | 已完成 production-planning maker-checker persistence、admin-only approver 邊界收斂、本機 / 測試叢集 deploy preflight 與 readback evidence；殘餘 revision 鏈長與 admin+supervisor 交集政策列為後續治理 |
| Idx-023 | Go-Live Blocker 收斂：前端骨架、CI/CD、環境治理、主資料完整化與正式環境 Preflight | Phase 1 → Go-Live | product-system | Completed | Idx-018, Idx-022 | 前端 Portal UI、CI/CD Pipeline、環境變數與密鑰治理、主資料升格、正式環境 migration preflight、production-planning approval 完化 | 已完成 Slice 1-7：Portal workbench、CI/env governance、主資料 active surface、read-only migration preflight、scratch DB replay drill、QA/security review、one-shot reviewer wrapper，並補齊 GitHub-hosted `release-preflight` artifact evidence |
| Idx-024 | Go-Live 後高風險補強：E2E 場景擴充、運維預案與用戶操作手冊 | Phase 1 → Post-Launch | product-system | QA | Idx-023, Idx-032 | E2E 邊界場景測試、正式環境運維預案、中文版用戶操作手冊 | 三個 slices 與最小 executable evidence 已交付；QA、Security 與 Domain review 已完成條件通過，但 external infra backup/restore blocker 仍在，且 `Idx-037` 已以 repo-native guard 技術性維持 production fail-closed |
| Idx-025 | 漸進補強：測試深化、Observability、Opening Balance 擴張與效能基準 | Phase 2 | product-system | Planning | Idx-023, Idx-024 | 後端單元測試、Logging & Observability、多窗口/多倉 opening balance、效能基準、前端品質 | 將 Phase 1 MVP 從「可用」推進到「可持續維護與擴張」；承接 Idx-020 deferred |
| Idx-026 | Repo-local UI/UX skill family 建置：品牌 style、入口頁、流程 landing、2.5D icon 與前端互動狀態 | Phase 1 → Go-Live Support | workflow-core | Completed | Idx-023 | `.agent/skills_local/` UI/UX skills、local overlay catalog、skill references、Portal 前端實作 guardrail | 已完成 repo-local UI/UX skill family 第一版與 overlay catalog，供 `Idx-023` 的 login / landing / theme / icon / UI states 前端切片直接使用 |
| Idx-027 | Workflow 修正切片：UI/UX local skills 自動載入鏈與 PTY formal execution 強制收斂 | Phase 1 → Go-Live Support | workflow-core | Completed | Idx-026 | skills trigger checklist、Coordinator/Engineer 注入規則、PTY execution enforcement、最小 smoke 驗證 | 已補建 project-local authoritative trigger checklist、Coordinator PTY contract 與 formal execution 後驗證條文；preflight 與 strict PTY evidence check 皆通過，可作為 `Idx-023` 前端切片的 workflow 基座 |
| Idx-028 | Idx-023 Slice 1：Portal app scaffold、login page 與 landing shell | Phase 1 → Go-Live | product-system | Completed | Idx-026, Idx-027 | Next.js Portal app skeleton、login page、landing shell、workspace scripts、PTY formal execution evidence | 已完成最小前端切片：Portal workspace app、品牌化 login shell、流程導向 landing shell 與 `build:portal` 驗證均已落地；後續由 `Idx-023` 承接其餘 go-live blocker 面 |
| Idx-029 | Workflow-core 升版與 cutover 計畫：由 `.agent` PTY-primary 遷移到 `.github/workflow-core` Chat-primary | Phase 1 → Workflow Upgrade | workflow-core | Completed | Idx-027, Idx-028 | phased cutover plan、bootstrap refresh checklist、檔案 ownership migration matrix、驗證與 rollback gates | 已完成主計畫、Phase 0-5 supporting plans、Phase 0 ownership/inventory、Phase 1 staged root `.github` bootstrap refresh、Phase 2 canonical core + mutable root scaffold、Phase 3 local overlay split/move、Phase 4 live authority cutover + `.agent/**` shim 收斂，以及 Phase 5 verify / smoke / sign-off；最終結論已收斂為 `PASS`，完整證據與 `.agent/` 後續刪除判定記錄於 `doc/logs/Idx-029_phase-5_log.md` |
| Idx-030 | `.agent` 刪除前置作業：legacy surface 退役、canonical 去耦與刪除前驗證 | Phase 1 → Workflow Upgrade Follow-up | workflow-core | Completed | Idx-029 | pre-delete inventory、canonical de-coupling、legacy retirement prep、delete-readiness evidence | 已完成 `.agent` 刪除前置盤點、canonical/live surface 去耦、root `.github/**` compatibility promise 收斂、`.agent/` 實體刪除，以及刪除後原 workspace 與 no-agent 臨時副本的 reviewer preflight、portable smoke、sync precheck / verify、guard、build 與 API smoke；最終結論為 `.agent/` 已完成安全退場 |
| Idx-031 | AskQuestions-first fail-closed workflow hardening | Phase 1 → Workflow Hardening | workflow-core | Completed | Idx-029, Idx-030 | `#askQuestions` fail-closed gate contract、batched confirmation rules、downstream template sync | 已修正 live authority 與 downstream bootstrap template，正式禁止以一般聊天收集 formal gate 決策；若 askQuestions surface 缺失，視為 workflow environment blocker |
| Idx-032 | Reviewer CLI behavioral hardening 與 Domain reviewer contract 補強 | Phase 1 → Workflow Hardening | workflow-core | Completed | Idx-029, Idx-031 | reviewer wrapper behavioral fail-closed、preflight behavioral smoke、Domain reviewer role/package contract、Domain reviewer 可採信輸出 | 已完成 reviewer wrapper / preflight hardening、Domain package contract 與 independent QA/Security reviewer 收口；`Idx-024` 的 repo 內 Domain blocker 已解除，殘餘風險以 host-level copilot supply chain 與 external infra sign-off 為主 |
| Idx-033 | 營運模式與正式資料庫 provider 治理基線 | Phase 1 → Governance | product-system | Completed | Idx-007, Idx-023 | operating mode authority 文檔、provider baseline、入口引用點、plan template `operating_mode` 欄位 | 已完成 repo-native authority 文檔與最小引用點，正式採納 `內部測試模式` / `單人營運正式層`，並收斂 Supabase 為中短期正式資料庫首選；不含 runtime implementation |
| Idx-034 | 單人營運正式層最小 deploy / backup / rollback contract | Phase 1 → Governance | product-system | Completed | Idx-024, Idx-033 | formal contract authority、plan / log artifact、flows navigation | 已完成單人營運正式層最小正式層 contract 單一入口，authority 位於 `doc/architecture/flows/single_operator_formal_deploy_backup_rollback_contract.md`，收斂固定 deploy path、provider-managed backup / restore fail-closed 與 rollback 停等點；不含 deploy automation、restore drill、RTO / RPO 回填或 production sign-off，且不解除 `Idx-024` external infra blocker |
| Idx-035 | 單人營運正式層 release-preflight 觸發者身份與角色邊界 | Phase 1 → Governance | product-system | QA | Idx-024, Idx-033, Idx-034 | release-preflight authorized actor boundary、release assignment label 語意、authority cross-reference | 已完成 docs-only governance 收斂：staging 僅限被指派 `Release operator` 觸發並由 `Backend owner` 協助判讀，production 僅限被指派 `Release owner` 觸發且 backup / restore checklist 未完整時 fail-closed；`Release owner` / `Release operator` 明定為 release assignment label，不是新 RBAC 角色，且不含 GitHub 權限 enforcement 或 production sign-off |
| Idx-036 | 任務 Track 欄位治理補強：系統任務與 workflow 任務分流 | Phase 1 → Governance | workflow-core | QA | Idx-033 | Track 欄位治理規則、implementation index Track 回填、plan template `track` 錨點、主 plan 回補、README 說明 | 雖影響 product-system artifacts，但本輪主要修改對象是 planning / workflow governance metadata，因此 Track 明確歸為 `workflow-core` |
| Idx-037 | release-preflight authorized actor boundary repo-native enforcement | Phase 1 → Governance | product-system | QA | Idx-024, Idx-033, Idx-034, Idx-035 | workflow guard job、repo-native validation script、plan / log artifact、governance cross-reference | 已將 authorized actor boundary 從 docs-only 收斂推進到 repo-native fail-closed guard：`workflow_dispatch` 新增 `assignment_ref` reference gate、新增獨立 `release-preflight-guard` job，並由 environment-bound `release-preflight` 以 `needs` 依賴它；`quality-gate` 不承接 guard 是本輪刻意 scope 切割，不把一般 CI 成功與否混進 release authority decision；staging 與 production allowlist 暫只允許 `foreverwow001`；production 因 backup / restore checklist 仍為 `fail`，技術 guard 會穩定阻擋 production release-preflight，required reviewers / team membership / external sign-off 仍屬 repo 外 follow-up |
| Idx-038 | internal-testing deferred external/platform evidence 治理 authority 補位 | Phase 1 → Governance | product-system | QA | Idx-024, Idx-033, Idx-037 | defer policy authority、cross-reference、plan / log artifact | 以 docs-only governance authority 補位，正式明文化 `internal-testing` 可暫緩 external infra facts 與 platform control evidence，但必須在 plan / log 誠實標記 `deferred`；一旦要敘述成 `single-operator-production`，仍必須先補齊 evidence，故本輪不暗示 external blocker 已解除。`cross-mode-governance` 只作 governance meta marker，不是第三種正式 operating mode |

## 依賴語意

- `depends_on` 只記錄直接阻斷本任務啟動或完成的上游任務。
- 若任務需要多個上游條件同時就緒，使用逗號分隔直接依賴。
- 依賴調整時，必須同步更新本索引與對應 plan/log artifact。
- 若任務已進入執行，但上游內容發生結構性變更，應回到 Planning 或 On Hold，而不是繼續帶著失效前提實作。

## 建議執行順序

### 已完成階段

1. Phase 0（Idx-001 ~ Idx-008）：權威文件、模組地圖、主資料字典、狀態模型、RBAC、共享鍵、技術基線、財務基線。
2. Phase 1 MVP（Idx-009 ~ Idx-022）：四渠道 intake / mapping、migration 衛生、opening balance、inventory count、日常營運 E2E、regression、deploy runbook、sign-off、migration governance、auth / maker-checker、approval persistence。

### 下一階段

3. **Idx-023（Tier 1 Blocker）**：go-live 前必須完成。關鍵路徑為前端 Portal UI；`Idx-028` 已交付其第一個最小切片，後續再擴到 intake / daily ops / CI/CD / env / master data 等 blocker 面。
4. **Idx-024（Tier 2 High Risk）**：review 收口中。三個 slices 已完成；剩餘阻斷為 production backup/restore 外部 sign-off，且 `Idx-037` 已把 checklist 狀態接成 repo-native fail-closed technical block。
5. **Idx-032（Tier 2 Workflow Hardening）**：已完成。reviewer wrapper / preflight 的 behavioral fail-closed 與 Domain contract 已收口，`Idx-024` 的 repo 內 reviewer blocker 已解除；剩餘仍是 external infra sign-off。
6. **Idx-025（Tier 3 Progressive）**：待 `Idx-024` 收斂後再啟動。測試深化、Observability、多窗口 opening balance、效能基準。

## 狀態說明

| 狀態 | 說明 |
|------|------|
| Planning | 規劃中，尚未啟動實作或正式文件撰寫 |
| Approved | 已核准，可進入對應 plan 建立與執行 |
| In Progress | 正在執行，已有對應 plan / log artifact |
| QA | 執行完成，正在做驗證或審查 |
| Completed | 已完成且通過驗證 |
| On Hold | 暫停，等待外部決策或上游任務解除阻斷 |
| Cancelled | 已取消，不再繼續 |

## Plan / Log 使用規則

- 本索引先定義 Phase 0 工作排序；當任務從 Approved 或 Planning 轉入 In Progress 前，必須建立對應 `doc/plans/Idx-NNN_plan.md` 與 `doc/logs/Idx-NNN_log.md`。
- Plan 必須引用其 `depends_on` 任務，並說明本輪範圍、風險與驗收條件。
- Log 必須記錄決策、執行結果、驗證證據與未解風險。
- 若任務涉及高風險面，plan 建立時應同步標示需要的 domain review、security review 或財務審查。

## 統計資訊

總任務數：38
- Approved：0
- Planning：1
- In Progress：0
- QA：5
- Completed：32

## 任務編號規則

- 格式為 `Idx-NNN`，NNN 為三位數流水號。
- 編號只增不減，即使任務取消也不重複使用。
- Phase 0 任務從 `Idx-001` 起算，後續功能或整合工作延續相同編號規則。

## 相關文件

- `../project_rules.md`
- `architecture/README.md`
- `architecture/modules/README.md`
- `architecture/data/README.md`
- `architecture/flows/README.md`
- `architecture/decisions/README.md`
- `architecture/phase1_mvp_three_phase_execution_plan.md`

最後更新：2026-04-09
