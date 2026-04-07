# Architecture Docs

> 這個目錄是 downstream business-system 專案的 repo-native 架構文件位置。
> template repo 只提供結構與約定，不預填特定產業的模組、資料流、狀態流或整合內容。

## 目錄定位

- `doc/architecture/` 是 Planner、Domain Expert、Engineer、QA 在需要架構上下文時的優先查閱位置。
- 這裡應保存對專案有效、可維護、可審計的 architecture docs，而不是一次性的聊天摘要。
- 若專案尚未補齊正式內容，可先保留 skeleton，但必須在 Plan / Review 中明確記錄缺口。

## 目前已採納的總覽入口

- `project_overview.md`：專案級總覽，定義最終產品目標、核心營運主線、模組地圖與分期策略
- `phase1_mvp_scope.md`：正式採納的 Phase 1 MVP 範圍、包含 / 排除項與驗收基線
- `phase1_mvp_three_phase_execution_plan.md`：把目前 MVP 收尾工作拆成三個 phase 與 `Idx-011` ~ `Idx-018` work unit 的正式執行版
- `project_blueprint_alignment_draft.md`：藍圖與現況對照草案，用於追蹤產品藍圖缺口，不取代正式總覽文件

## 建議子目錄

- `modules/`：模組邊界、責任分工、依賴方向
- `data/`：master data、shared key、schema contract、integration mapping
- `flows/`：核心 workflow、狀態流、handoff、approval path
- `roles/`：RBAC、資料可見性、approval matrix、maker-checker 邊界
- `decisions/`：ADR、重要架構決策、取捨與已拒絕方案

## 維護原則

- 不要把 bakery 或其他 downstream 專案的具體內容直接回寫到 template skeleton。
- 每份文檔都應標明它是否為 authoritative source，避免同一主題有兩份互相矛盾的版本。
- 若某份架構文件已被專案採納為 authoritative source，相關 Plan / Review 應引用它，而不是重新發明一份平行規格。

## 最低期待

至少應逐步補齊：

1. 模組邊界圖或文字說明
2. 共享資料 / 主資料與 key owner 說明
3. 主要流程與狀態流轉說明
4. 重要架構決策與限制
