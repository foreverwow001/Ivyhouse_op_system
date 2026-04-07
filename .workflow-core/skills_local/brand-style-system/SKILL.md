---
name: brand-style-system
description: "Ivyhouse Portal 的品牌風格與 theme token 守則。用於 login page、landing page、入口卡片、按鈕、背景、字體與品牌對齊任務。"
---

# Brand Style System

提供 Ivyhouse Portal 的品牌視覺落地規則，讓前端實作在接近官網風格的同時，仍保持營運系統的清晰度與可用性。

## 何時使用

當任務符合任一條件時，應載入本 skill：

- 建立或重做 login page
- 建立或重做 landing page / Portal 入口頁
- 建立 theme token、色票、字體、按鈕、卡片或背景規則
- 需要確認某個頁面是否仍符合 Ivyhouse 品牌風格

## 不應負責的事

- 不定義 business workflow 狀態機
- 不處理 API、RBAC、session contract
- 不負責 React loading / error / empty state 細節

## 核心要求

- 品牌相似，但不複製官網電商結構
- 以 semantic token 落地，不直接散用色碼
- display 字體與 UI 字體分流
- 卡片、按鈕、背景、分隔 accent 必須共享同一語言
- 不得把 Portal 做成冷藍 generic SaaS dashboard

## 工作流

1. 先讀 `../../../doc/architecture/modules/portal_ui_ux_baseline.md`。
2. 再讀 `../../../doc/architecture/modules/portal_brand_token_and_icon_pre_spec.md`。
3. 先定 token，再定元件樣式，不要反過來。
4. 實作後依 reference checklist 檢查品牌對齊與可讀性。

## 參考資料

- [references/brand-token-rules.md](./references/brand-token-rules.md)
- [references/brand-alignment-checklist.md](./references/brand-alignment-checklist.md)