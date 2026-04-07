---
name: ops-entry-pages
description: "Ivyhouse Portal 的 login page、landing page、首頁入口卡片與首頁內容層次守則。"
---

# Ops Entry Pages

提供 Ivyhouse Portal login page、landing page 與模組入口頁的結構規則，確保入口體驗清楚、品牌一致，並避免首頁過早退化成雜亂 dashboard。

## 何時使用

- 建立 login page
- 建立 landing page / Portal home
- 建立模組入口卡片
- 建立角色導向首頁或第一層導航

## 不應負責的事

- 不定義每個業務模組的深層表單欄位
- 不處理流程節點之間的正式 business state machine
- 不取代 `ops-flow-landing` 對流程節點映射的責任

## 核心要求

- login page 要先建立品牌信任感與清楚登入行為
- landing page 第一版必須是流程導向入口頁，不是 KPI-first dashboard
- 入口卡片使用大卡片、居中 icon、標題、短說明、單一 CTA
- 首頁應先服務找入口與理解主線，而不是展示大量雜訊

## 工作流

1. 先讀 `../../../doc/architecture/modules/portal_ui_ux_baseline.md`。
2. 建 login page 時再讀 `references/login-page-spec.md`。
3. 建 landing page 時再讀 `references/landing-page-checklist.md`。
4. 若頁面含流程節點，搭配 `ops-flow-landing` 一起使用。

## 參考資料

- [references/login-page-spec.md](./references/login-page-spec.md)
- [references/landing-page-checklist.md](./references/landing-page-checklist.md)