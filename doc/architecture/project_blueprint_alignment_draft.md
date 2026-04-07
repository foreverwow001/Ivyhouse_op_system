## Ivyhouse OP System 藍圖對照表草案

更新日期：2026-03-28

Authoritative source：否（draft）

## 目的

本文件把專案藍圖、目前 repo 已落地的權威文件，以及仍未補齊的產品缺口放在同一張對照表中，作為後續專案總覽文件與 implementation roadmap 的前置草案。

本文件只處理產品藍圖缺口，不處理 workflow / template 治理缺口。後者應回看 workflow 決策文檔與 downstream customization execution plan。

## 使用方式

- 若要判斷某個藍圖目標是否已在 repo 內正式落地，先看 `已落地文件` 欄。
- 若 `當前判定` 是 `部分落地` 或 `未落地`，應直接看 `尚未補齊缺口`，而不是只看藍圖原文。
- 本文件是草案，不取代 `project_rules.md`、`doc/implementation_plan_index.md` 或 `doc/architecture/` 既有權威文件。

## 對照總表

| 藍圖面向 | 藍圖要求 | 已落地文件 | 當前判定 | 尚未補齊缺口 |
|------|------|------|------|------|
| 專案總目標 | 建立一套從接單到生產、包裝、出貨、對帳的完整 web application，達成一次輸入、全流程追蹤、庫存與成本即時可見 | [project_rules.md](/workspaces/Ivyhouse_op_system/project_rules.md)、[doc/implementation_plan_index.md](/workspaces/Ivyhouse_op_system/doc/implementation_plan_index.md)、[project_overview.md](/workspaces/Ivyhouse_op_system/doc/architecture/project_overview.md) | 部分落地 | repo-native 專案總覽已建立（`project_overview.md`），系統定位、模組地圖與分期策略已正式落地；但產品應用程式碼本體尚未開始 |
| 架構方向 | 採模組化單體、共享資料庫、單一入口、統一認證與權限，不先拆微服務 | [doc/architecture/modules/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/modules/README.md)、[doc/architecture/decisions/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/decisions/README.md)、[project_rules.md](/workspaces/Ivyhouse_op_system/project_rules.md) | 已落地 | 尚未把架構方向落成實際 NestJS / Next.js 應用目錄、模組 package 與 runtime contract |
| 系統模組地圖 | Portal、ERP / 營運核心、生產管理、包裝與出貨、會計與對帳等模組邊界 | [doc/architecture/modules/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/modules/README.md) | 部分落地 | 已有模組邊界 spec，但尚未把藍圖中的 ERP / 生產 / 出貨 / 財務模組拆成可實作的 app/module 結構與正式 API / schema 介面 |
| Portal / 共用基礎層 | 登入、權限、待辦、通知、跨模組導覽、個人工作台 | [doc/architecture/modules/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/modules/README.md)、[doc/architecture/roles/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/roles/README.md) | 部分落地 | 目前只有責任定義，尚未有 Portal 資訊架構、頁面藍圖、auth / session / dashboard / notification 設計與實作骨架 |
| 核心營運主線 | 訂單 -> 生產排程 -> 扣料 -> 完工 -> 包裝 -> 出貨 -> 帳務 / 對帳 | [doc/architecture/flows/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/flows/README.md) | 部分落地 | 已有主線定義，但尚缺可直接實作的 core operating flow spec、正式流程圖、跨模組 handoff 條件與真實作業流程驗證 |
| 統一狀態語意 | 主資料與高風險規則需有統一生命週期與核定語意 | [doc/architecture/flows/unified_status_semantics.md](/workspaces/Ivyhouse_op_system/doc/architecture/flows/unified_status_semantics.md) | 已落地 | 尚未擴展為訂單、工單、採購、庫存、出貨、發票、付款、對帳等完整 state machine definitions |
| 共享主資料模型 | Product、BOM、Material、Customer、Supplier、Employee、Shift、Sales Order、Inventory、Delivery、Invoice / AR / AP 等要有正式主資料與 owner | [doc/architecture/data/master_data_dictionary.md](/workspaces/Ivyhouse_op_system/doc/architecture/data/master_data_dictionary.md)、[doc/architecture/data/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/data/README.md) | 部分落地 | 已補商品、包材、內包裝、換算規則、轉換規則、原料、配方版本、出貨用品，但 Customer、Supplier、Employee、Shift、Store、Warehouse、Sales Order、Delivery、Invoice / AR / AP 等仍未 formalize |
| Shared key / cross-module contract | 共用鍵、owner、consumer 義務、不可變規則、跨模組契約要先明確 | [doc/architecture/data/shared_key_contract.md](/workspaces/Ivyhouse_op_system/doc/architecture/data/shared_key_contract.md)、[doc/architecture/data/shared_key_matrix_six_csv.md](/workspaces/Ivyhouse_op_system/doc/architecture/data/shared_key_matrix_six_csv.md)、[doc/architecture/data/sellable_product_master_spec.md](/workspaces/Ivyhouse_op_system/doc/architecture/data/sellable_product_master_spec.md) | 部分落地 | 目前只覆蓋六張 CSV 與其直接 consumer，尚未擴到全系統 order / production / inventory / finance 的 integration contract |
| 配方 / BOM 與原料治理 | 配方版本化、原料換算、耗料、保存條件、批次與效期需可追溯 | [doc/architecture/data/master_data_dictionary.md](/workspaces/Ivyhouse_op_system/doc/architecture/data/master_data_dictionary.md)、[doc/architecture/data/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/data/README.md)、銷售商品組成對照表（`project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv`，仍為 CSV 工作載體） | 部分落地 | 目前只有最低骨架與 CSV 工作載體層的組成對照，尚缺 BOM 明細、產出率、替代料、配方核定流程、原料採購條件、供應商映射、批次 / 效期細則；組成對照表尚未從 CSV 升格為正式 schema |
| 包裝與出貨用品治理 | 包材、出貨用品、內外包材邊界、正式扣帳與人工盤點邊界要清楚 | [doc/architecture/data/master_data_dictionary.md](/workspaces/Ivyhouse_op_system/doc/architecture/data/master_data_dictionary.md)、[doc/architecture/flows/shipping_supply_inventory_policy.md](/workspaces/Ivyhouse_op_system/doc/architecture/flows/shipping_supply_inventory_policy.md) | 部分落地 | 已釐清內包裝包材與出貨用品邊界，但尚缺包材分類細則、正式扣帳情境細化、盤點週期、調整原因字典與角色邊界 |
| RBAC 與 approval matrix | 至少區分部門角色、可見性、可改 / 可核准 / 可查敏感資料邊界 | [doc/architecture/roles/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/roles/README.md) | 部分落地 | 目前只覆蓋四表直連高風險治理，尚未擴張到全系統角色、人員層級指派、頁面 / API / row-level security 與交易流程 approval |
| 財務與對帳 | 發票、應收應付、成本、對帳建立在乾淨交易事件之上，不先獨立做深 | [project_rules.md](/workspaces/Ivyhouse_op_system/project_rules.md)、[doc/architecture/flows/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/flows/README.md)、[doc/architecture/decisions/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/decisions/README.md) | 部分落地 | 原則已採納，但尚未有 finance / reconciliation 專屬權威文件、正式資料模型、控制點與 Phase 0 任務輸出；[doc/implementation_plan_index.md](/workspaces/Ivyhouse_op_system/doc/implementation_plan_index.md) 中 Idx-008 仍在 Planning |
| Phase 1 MVP | 優先做訂單 / 產品主資料、生產工單與排程、包裝與出貨、庫存與耗料 | [doc/architecture/phase1_mvp_scope.md](/workspaces/Ivyhouse_op_system/doc/architecture/phase1_mvp_scope.md) | 部分落地 | 已有正式採納的 Phase 1 MVP scope；但 bounded implementation roadmap、完整模組交付順序與排除範圍對應的 task breakdown 仍待補 |
| Phase roadmap | Phase 1 打通主線，Phase 2 補強營運管理，Phase 3 深化財務整合 | [doc/implementation_plan_index.md](/workspaces/Ivyhouse_op_system/doc/implementation_plan_index.md) | 部分落地 | 目前只有 Phase 0 任務索引，尚未建立正式的產品 implementation roadmap，Phase 1 / 2 / 3 仍停留在藍圖層 |
| 專案術語一致性 | Product、BOM、Material、Sales Order、Inventory、Delivery、Invoice 等需要顯式 glossary | [project_rules.md](/workspaces/Ivyhouse_op_system/project_rules.md)、[doc/architecture/data/README.md](/workspaces/Ivyhouse_op_system/doc/architecture/data/README.md) | 部分落地 | 目前只有暫定術語來源，尚未建立顯式 domain glossary reference doc |
| 完整 web application 實作面 | 最終要有可用的 web app，而不是只停留在文件與治理 | [project_rules.md](/workspaces/Ivyhouse_op_system/project_rules.md)、[.devcontainer/devcontainer.json](/workspaces/Ivyhouse_op_system/.devcontainer/devcontainer.json) | 未落地 | 技術棧與開發容器已定，但 repo 內尚未建立正式後端、前端、資料庫 schema、migration、API、頁面與測試骨架 |
| 成功指標 / 驗收場景 | 訂單可追到帳務、庫存不靠人工補記、跨部門資料理解一致、管理者能快速回答營運現況 | [project_overview.md](/workspaces/Ivyhouse_op_system/doc/architecture/project_overview.md) | 已落地 | 已納入 `project_overview.md` 成功指標區塊；後續應在 Phase 1 MVP scope 中細化為可測試的驗收條件 |
| 開放問題（業務待確認） | 訂單來源、產品變體、多工序 / 產線、批號效期冷藏、出貨方式差異、會計深度、角色層級等 7 項 | [project_overview.md](/workspaces/Ivyhouse_op_system/doc/architecture/project_overview.md) | 部分落地 | 已納入 `project_overview.md` 待決策開放問題區塊；但 7 項中尚無任何一項經使用者正式確認解答 |

## 從三份文檔彙整出的產品藍圖真實缺口

以下缺口同時出現在藍圖、2026-03-23 決策 / 執行文檔或 2026-03-27 handoff 中，且到 2026-03-28 仍未完全落地：

1. ~~缺正式的 repo-native 專案總覽文件~~ — **已解決**（2026-03-28）。`project_overview.md` 已建立並納入 `doc/architecture/`。
2. ~~缺正式採納的 Phase 1 MVP scope 文件，導致「哪些 web app 模組先做、哪些先不做」仍未固定。~~ — **已解決**（2026-04-01）。
3. 缺完整 core operating flow spec 與真實作業流程驗證，目前只有主線與共通語意，還不足以直接設計系統流程與 UI。
4. 缺顯式 state machine definitions，尤其是訂單、工單、採購、庫存、包裝、出貨、發票、付款、對帳。
5. 缺完整主資料覆蓋：Customer、Supplier、Employee、Shift、Store、Warehouse、Sales Order、Delivery、Invoice / AR / AP 等尚未 formalize。
6. 缺原料、配方、包材、出貨用品的細部欄位與例外規格，尚不足以直接進入 schema / migration 設計。
7. 缺產品應用程式碼骨架；目前仍以治理、文件與 workflow 基礎設施為主。

## 藍圖建議 7 份正式文件落地追蹤

藍圖 "Authoritative Documentation Recommendation" 建議專案應先產出 7 份正式文件。以下為截至 2026-03-28 的落地狀態：

| # | 藍圖建議文件 | 落地狀態 | 對應 repo 文件 |
|---|------------|---------|---------------|
| 1 | 公司部門與流程地圖 | 未落地 | — |
| 2 | 系統模組地圖 | 已落地 | `doc/architecture/modules/README.md` |
| 3 | 共用主資料模型 | 部分落地 | `doc/architecture/data/master_data_dictionary.md`、`shared_key_contract.md` |
| 4 | 核心流程時序圖 | 部分落地 | `doc/architecture/flows/README.md`、`unified_status_semantics.md`（尚缺獨立流程圖） |
| 5 | 第一階段 MVP 與不做清單 | 部分落地 | `doc/architecture/project_overview.md`（已有暫行 MVP 驗收基線與明確不採做法，但尚未獨立成正式 scope 文件） |
| 6 | Phase 2、Phase 3 路線圖 | 部分落地 | `doc/architecture/project_overview.md`（已有 Phase 2 / Phase 3 分期方向，但尚未獨立成正式 roadmap 文件） |
| 7 | 角色與權限矩陣 | 部分落地 | `doc/architecture/roles/README.md`（僅覆蓋四表高風險治理） |

## 不納入本文件的缺口

以下屬 workflow / template 治理缺口，不列入產品藍圖對照表，應回看相關決策與 execution plan：

- 是否新增 top-level reviewer agents
- 是否擴張 queue governor / story orchestration / coding swarm
- Plan template、validator、PTY / fallback、Security Review trigger 等 workflow 契約演進
- template core 與 downstream customization 的切分原則

## 版本依賴

- 本文件依賴 [project_overview.md](/workspaces/Ivyhouse_op_system/doc/architecture/project_overview.md) 版本：2026-03-28

## 關聯文件

- [project_overview.md](/workspaces/Ivyhouse_op_system/doc/architecture/project_overview.md)
- [2026-03-22-bakery-operations-system-project-blueprint.md](/workspaces/Ivyhouse_op_system/obsidian-vault/20-reviewed/Ivyhouse_op_system/project-goals/2026-03-22-bakery-operations-system-project-blueprint.md)
- [2026-03-23-bakery-project-workflow-template-final-adopted-recommendation.md](/workspaces/Ivyhouse_op_system/obsidian-vault/20-reviewed/Ivyhouse_op_system/decision-records/2026-03-23-bakery-project-workflow-template-final-adopted-recommendation.md)
- [2026-03-23-bakery-project-downstream-customization-execution-plan.md](/workspaces/Ivyhouse_op_system/obsidian-vault/20-reviewed/Ivyhouse_op_system/development-reference/2026-03-23-bakery-project-downstream-customization-execution-plan.md)
- [2026-03-27_phase0-master-data-and-rbac_handoff.md](/workspaces/Ivyhouse_op_system/project_maintainers/chat/archive/handoff/2026-03-27_phase0-master-data-and-rbac_handoff.md)