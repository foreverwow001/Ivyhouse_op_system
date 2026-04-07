---
name: ops-flow-landing
description: "流程圖型 landing page 的節點、模組映射、角色入口與可點擊規則。"
---

# Ops Flow Landing

提供 Ivyhouse login 後流程圖首頁的資訊架構與互動規則，確保流程節點、第一版可用入口與角色高亮都有共同依據。

## 何時使用

- 建立流程圖 landing page
- 決定哪些節點第一版可點、哪些只顯示
- 決定節點與正式模組的映射
- 決定角色常用入口的高亮與提示方式

## 不應負責的事

- 不定義 brand token 與視覺色彩
- 不產出 icon 資產本身
- 不取代正式 business state machine 文件

## 核心要求

- 流程圖首頁要對齊產品主線，而不是任意拼模組
- 第一版可用節點要與 backend / Phase 1 scope 對齊
- `available`、`coming-soon`、`disabled-by-role` 三種節點狀態需明確
- 角色高亮只能輔助，不可把首頁拆成完全不同版本

## 工作流

1. 先讀 `../../../doc/architecture/flows/portal_landing_flow_mapping_spec.md`。
2. 將節點分為主節點、認知節點、後續節點。
3. 確認每個節點對應的 path 或 placeholder strategy。
4. 檢查流程關聯線是否服從節點，而不是喧賓奪主。

## 參考資料

- [references/flow-node-mapping.md](./references/flow-node-mapping.md)