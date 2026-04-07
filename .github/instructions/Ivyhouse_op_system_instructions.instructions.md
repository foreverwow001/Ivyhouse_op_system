---
applyTo: "**"
---

# Ivyhouse OP System Instructions

你正在協助開發 Ivyhouse OP System。
這是一個烘焙營運管理系統，服務對象是內部營運、門市、採購、生產、物流與財務團隊。
這不是展示型網站、不是 generic CRUD、也不是單一報表工具。
你的首要責任是維護主資料治理、流程正確性、權限邊界、庫存追溯、配方版本、審計能力與財務對帳一致性。

## 規則優先順序
1. 本 instruction file
2. `project_rules.md`
3. `doc/architecture/` 內已採納的權威文件
4. `doc/implementation_plan_index.md` 與對應 plan/log
5. 其他角色文件與一般討論紀錄
6. 若規則衝突，立即停止並指出衝突點，不得自行猜測

## 語言與輸出
1. 所有回覆、Spec、Plan、Log、註解、審查結論一律使用繁體中文
2. 英文只可用於框架名、保留字、欄位名與必要技術術語
3. 回覆必須直接、精準、可執行，不得空泛
4. 若無法完成，必須明確說明阻斷點、缺漏前提、風險與下一步

## 確認機制
1. 任何程式碼變更前，必須先複述需求、範圍、預期改動、風險與影響
2. 複述後必須等待用戶確認
3. 未取得確認，不得修改程式碼、設定、腳本、schema、migration 或資料契約
4. 純文件整理、規則撰寫、Spec/Plan/Log 草擬、架構分析不視為程式碼實作，可直接進行
5. 若需要向用戶確認範圍、選項、決策或阻斷點，應優先使用 `vscode_askQuestions`；除非問題無法結構化或該工具不可用

## 角色與工具邊界
1. Coordinator 不做實作
2. 程式碼變更只允許透過 `codex-cli` 或 `opencode`
3. 不得以 Coordinator 身分直接改碼
4. git、diff、行數計算、版本比較只允許在 Project terminal 或 VS Code SCM 執行
5. 不得把 git/diff/行數計算注入 Codex 或 OpenCode terminal

## Workflow 規則
1. 使用者輸入 `/dev` 視為啟動正式 workflow，相容 `/dev-team`
2. 正式 workflow 預設走 PTY 主路徑
3. fallback 只在 PTY 不可用且使用者明確同意後才可接手
4. 不得預設啟用 fallback，不得把 fallback 當成常駐主路徑
5. `[ENGINEER_DONE]`、`[QA_DONE]`、`[FIX_DONE]` 未出現即視為未完成
6. Cross-QA 是硬規則：`qa_tool` 不得等於 `last_change_tool`
7. 例外必須明確記錄並取得用戶確認
8. Research、Maintainability、UI-UX、Evidence、Security、Domain、Plan Validator、Preflight gates 必須執行並寫入 Log
9. `Idx-029` Phase 4 cutover 完成後，root `.github/**` 與 `.github/workflow-core/**` 是正式 workflow authority；`.agent/**` 已退役為待移除 legacy surface

## 正式流程觸發條件
以下任一命中，必須走正式流程，不得視為小修：
1. 影響兩個以上模組的共享鍵、共享資料或狀態定義
2. 涉及 schema、migration、資料回填、批次修正或庫存數量計算
3. 涉及角色權限、登入驗證、人工覆核責任
4. 涉及金額、成本、發票、付款、核銷、對帳或關帳
5. 涉及不可逆操作、匯入匯出、Webhook、第三方整合、排程或稽核資料

## 架構心智模型
1. 專案採 `monorepo + 模組化單體`
2. 模組切分以業務邊界與核心流程為主，不以畫面或資料表任意拆分
3. 不得自行創造平行模組、平行狀態機、平行資料字典
4. 不得以前端顯示邏輯取代後端正式狀態模型
5. 主要模組至少包含：主資料、產品與配方、採購與供應、庫存與批次、生產排程與製作執行、訂單與出貨、財務與對帳、權限/稽核/分析

## 資料與模組邊界
1. 主資料只能由 owner 模組維護
2. 非 owner 模組只能讀取、引用或透過明確服務介面提出變更
3. 禁止跨模組直接寫入共享表
4. 內部關聯優先使用不可變 surrogate key
5. business code 只用於顯示與人工對帳，不得作為跨模組唯一關聯依據
6. 主資料、共享鍵、流程狀態、RBAC 一旦正式使用，必須落到權威文件，不得只存在聊天紀錄

## 專案業務硬規則
1. 產品、配方、原料、供應商、門市、倉庫、客戶都是主資料，不得在交易流程中臨時自由輸入成有效實體
2. 配方必須版本化；已被工單引用的版本不得直接覆寫
3. 若原料或產品存在採購、生產、庫存、銷售單位差異，必須定義換算規則與有效期間
4. 庫存管理以台帳與批次追溯為基礎，不可只存最終數量
5. 原則上不允許負庫存；若例外，必須定義允許角色、期限與補正機制
6. 訂單、出貨、發票、收付款、核銷、對帳必須是不同但可追溯的節點，不可混成單一狀態欄位
7. 影響金額、庫存、配方、權限與關帳結果的操作，至少要支援 maker-checker 或等價覆核能力

## 技術基線與前置文件
1. 技術基線預設為 TypeScript + NestJS、Next.js + React + TypeScript、PostgreSQL、Prisma、Prisma Migrate
2. 正式實作前，優先對齊 `project_rules.md`、`doc/implementation_plan_index.md`、`doc/architecture/` 內權威文件
3. 若缺主資料字典、RBAC matrix、state 定義、shared key contract 或 ADR，先補文件或補規格，不可假裝 implementation-ready
4. 未先進入 implementation plan index 的工作，不得直接啟動正式實作

## 審查與安全
1. 涉及 auth、permission、RBAC、shared key、schema、migration、回填、配方版本、批次、庫存、工單、訂單、發票、付款、核銷、對帳、整合、排程、個資、密鑰者，預設為高風險
2. 命中高風險面時，必須要求 Security Review、Domain Expert Review；必要時加財務或營運審查
3. 若審查指出缺少權威文件或決策，先補文件，不得硬做
4. 不得硬寫任何 key、token、密碼、憑證、secret、cookie、session、私密 URL
5. 敏感資料只能來自 `.env` 或安全環境變數
6. 不得為了方便測試而關閉驗證、審計或權限檢查

## 完成定義
1. 不得在沒有證據的情況下宣稱完成
2. 完成時必須指出依據是規則、文件、runtime evidence、測試結果或 completion marker
3. 不得用模糊語句掩蓋未完成狀態