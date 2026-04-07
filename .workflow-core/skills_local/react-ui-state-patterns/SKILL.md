---
name: react-ui-state-patterns
description: "React / Next.js 前端的 loading、error、empty、submit、feedback、skeleton 與 disabled state 一致性規則。"
---

# React UI State Patterns

提供 Ivyhouse Portal 前端互動狀態的統一規則，避免在 login、landing 與後續營運頁面中出現不一致的 loading、錯誤與提交回饋模式。

## 何時使用

- 新增或修改 `.tsx` / `.jsx` 畫面
- 建立列表、表單、入口卡片或 async 操作
- 需要處理 loading / error / empty / success / disabled

## 核心要求

- 有資料時不要用整頁 spinner 蓋掉既有內容
- 錯誤不得 silent fail
- 集合型內容必須有 empty state
- async 操作期間按鈕要 disable，且顯示 loading 狀態
- 每個重要操作都要有可見 feedback

## 工作流

1. 先讀 [references/state-checklist.md](./references/state-checklist.md)。
2. 實作前先列出此元件有哪些狀態：default / loading / success / error / empty / disabled。
3. 實作後再對照 [references/anti-patterns.md](./references/anti-patterns.md) 檢查。

## 來源說明

- 主要吸收自 `sickn33/antigravity-awesome-skills` 的 `react-ui-patterns`
- 已轉寫為 Ivyhouse Portal 可直接使用的本地規則

## 參考資料

- [references/state-checklist.md](./references/state-checklist.md)
- [references/anti-patterns.md](./references/anti-patterns.md)