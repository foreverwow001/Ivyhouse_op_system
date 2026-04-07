---
name: accessibility-density-review
description: "Ivyhouse 內部營運系統的可讀性、鍵盤可達性、視覺對比與資訊密度審查規則。"
---

# Accessibility Density Review

提供 Ivyhouse 內部營運系統在品牌化設計下仍保持高可讀性與高操作性的 review 規則，特別適用於 login、landing、卡片、表單、列表與後續資料密集頁面。

## 何時使用

- 設計或審查表單、資料列表、卡片網格、首頁入口頁
- 需要檢查對比、字級、焦點、觸控區域與鍵盤可達性
- 畫面開始走向資訊密集或多角色操作時

## 不應負責的事

- 不決定品牌視覺主調
- 不取代 `react-ui-state-patterns` 對 async state 的責任

## 核心要求

- 文字對比優先於裝飾感
- 焦點狀態必須可見
- 重要操作要有足夠點擊區域
- 表單與入口卡片的資訊密度要可掃描，不可堆成視覺噪音
- 使用者應能靠鍵盤完成主要動作路徑

## 工作流

1. 先讀 [references/a11y-density-checklist.md](./references/a11y-density-checklist.md)。
2. 若頁面為營運資料密集頁，再特別檢查字級、留白與分群是否足夠。
3. QA 時將不符合項目列為 must / should，不直接用品牌理由豁免。

## 參考資料

- [references/a11y-density-checklist.md](./references/a11y-density-checklist.md)