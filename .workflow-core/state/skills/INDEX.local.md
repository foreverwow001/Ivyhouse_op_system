# Local Skills Overlay Index

> 本檔追蹤安裝在 `.workflow-core/skills_local/` 的 external/local skills。
> core builtin catalog 仍以 `.github/workflow-core/skills/INDEX.md` 為準；這裡只記錄 overlay additions。

## 📦 Local Skills

| 技能名稱 | 用途 | 調用指令 |
|----------|------|----------|
| `brand-style-system` | Ivyhouse Portal 品牌色、字體、卡片、按鈕、背景與 theme token 守則 | 閱讀 `.workflow-core/skills_local/brand-style-system/SKILL.md` |
| `ops-entry-pages` | login page、landing page、模組入口卡片與首頁結構守則 | 閱讀 `.workflow-core/skills_local/ops-entry-pages/SKILL.md` |
| `ops-flow-landing` | 流程圖 landing page、節點分群、模組映射、角色入口守則 | 閱讀 `.workflow-core/skills_local/ops-flow-landing/SKILL.md` |
| `react-ui-state-patterns` | React UI 的 loading、error、empty、submit、feedback 與 skeleton 模式 | 閱讀 `.workflow-core/skills_local/react-ui-state-patterns/SKILL.md` |
| `iconography-2_5d` | 可愛且典雅的 2.5D icon 視覺規範 | 閱讀 `.workflow-core/skills_local/iconography-2_5d/SKILL.md` |
| `accessibility-density-review` | 內部營運系統的可讀性、鍵盤可達性與資訊密度守則 | 閱讀 `.workflow-core/skills_local/accessibility-density-review/SKILL.md` |

---

## 🔍 技能詳細說明

### `brand-style-system`

- package: `.workflow-core/skills_local/brand-style-system/`
- 來源：Ivyhouse 官網風格需求 + `anthropics/skills/frontend-design` + `nextlevelbuilder/ui-ux-pro-max-skill`
- 主要作用：把官網品牌語言轉成 Portal 可用的 token、字體、按鈕、卡片與背景規則。

### `ops-entry-pages`

- package: `.workflow-core/skills_local/ops-entry-pages/`
- 來源：Ivyhouse login / landing 需求 + 內部工具入口卡片模式 + Portal baseline docs
- 主要作用：規範 login page、landing page 與入口卡片的頁面結構與內容層次。

### `ops-flow-landing`

- package: `.workflow-core/skills_local/ops-flow-landing/`
- 來源：Ivyhouse 流程圖首頁需求 + `vibeforge1111/vibeship-spawner-skills` 的 flow / UX 思路
- 主要作用：定義流程節點、節點關係、第一版可點入口與角色高亮規則。

### `react-ui-state-patterns`

- package: `.workflow-core/skills_local/react-ui-state-patterns/`
- 來源：`sickn33/antigravity-awesome-skills/react-ui-patterns`
- 主要作用：讓 Portal 前端在 loading、error、empty、submit、disabled、success feedback 上保持一致。

### `iconography-2_5d`

- package: `.workflow-core/skills_local/iconography-2_5d/`
- 來源：Ivyhouse 2.5D icon 要求 + `vibeforge` icon 設計思路 + `nextlevelbuilder` 視覺資料庫思路
- 主要作用：建立 landing page / 流程節點 / 入口卡片 icon 的一致視覺語言。

### `accessibility-density-review`

- package: `.workflow-core/skills_local/accessibility-density-review/`
- 來源：`vibeforge` accessibility / design-system 思路 + Ivyhouse 內部營運系統可讀性要求
- 主要作用：確保品牌化 UI 不犧牲可讀性、可掃描性、可點擊性與鍵盤可達性。