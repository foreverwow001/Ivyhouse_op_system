# Engineer Skill Trigger 檢查表

這是 Engineer 在實作前判定是否載入 `refactor`、`typescript-expert`、`python-expert` 與 repo-local UI/UX skills 的唯一表格來源。

## 使用規則

- 逐列檢查
- 任一列命中即載入對應 skill
- 若同時命中多列，必須全部載入
- 這份表只處理「實作前的工程技能載入」，不取代 QA / Security / Research Gate
- 命中 repo-local UI/UX skill 時，先讀 `.workflow-core/state/skills/INDEX.local.md`，再載入命中的 skill package

## 觸發檢查表

| 檢查項目 | 如何判定 | 必載 Skill |
|---|---|---|
| refactor 任務 | User / Planner / Plan 明確要求 refactor、cleanup、重整結構，或主要工作是 behavior-preserving restructuring | `refactor` |
| TypeScript / JavaScript 檔案變更 | 新增或修改 `.ts`、`.tsx`、`.js`、`.jsx` | `typescript-expert` |
| Python 檔案變更 | 新增或修改 `.py` | `python-expert` |
| React / Node 實作 | 任務明確涉及 React component、hook、Node service、API handler、前端狀態邏輯 | `typescript-expert` |
| Python correctness / typing / documentation 強化 | 任務明確涉及 type hints、docstring、錯誤處理、Pythonic 重構 | `python-expert` |
| Portal / login / landing / theme 任務 | 任務明確涉及 Portal 頁面殼層、login page、landing page、品牌 token、卡片、背景、按鈕語言 | `brand-style-system`, `ops-entry-pages` |
| 流程導向 landing / 模組入口映射 | 任務涉及流程節點分群、入口卡片、模組映射、角色入口高亮 | `ops-flow-landing` |
| React UI state 任務 | 任務涉及 loading、error、empty、submit、disabled、success feedback、skeleton 或表單狀態 | `react-ui-state-patterns` |
| Icon / 插圖 / 視覺語言任務 | 任務涉及 iconography、2.5D icon、入口圖示、流程節點圖示或品牌插圖 | `iconography-2_5d` |
| 可達性 / 資訊密度 / 鍵盤操作任務 | 任務涉及 keyboard navigation、focus、live region、a11y、閱讀密度、營運頁掃描性 | `accessibility-density-review` |

## 對應載入命令

### refactor

```bash
cat .github/workflow-core/skills/refactor/SKILL.md
cat .github/workflow-core/skills/refactor/references/refactor-workflow.md
cat .github/workflow-core/skills/refactor/references/refactor-smells.md
```

### typescript-expert

```bash
cat .github/workflow-core/skills/typescript-expert/SKILL.md
cat .github/workflow-core/skills/typescript-expert/references/typescript-javascript-core.md
cat .github/workflow-core/skills/typescript-expert/references/typescript-react-patterns.md
cat .github/workflow-core/skills/typescript-expert/references/typescript-api-and-testing.md
```

### python-expert

```bash
cat .github/workflow-core/skills/python-expert/SKILL.md
cat .github/workflow-core/skills/python-expert/references/python-correctness.md
cat .github/workflow-core/skills/python-expert/references/python-type-safety.md
cat .github/workflow-core/skills/python-expert/references/python-performance.md
cat .github/workflow-core/skills/python-expert/references/python-style-and-documentation.md
```

### repo-local UI/UX skill family

先讀 local overlay catalog：

```bash
cat .workflow-core/state/skills/INDEX.local.md
```

#### brand-style-system

```bash
cat .workflow-core/skills_local/brand-style-system/SKILL.md
```

#### ops-entry-pages

```bash
cat .workflow-core/skills_local/ops-entry-pages/SKILL.md
```

#### ops-flow-landing

```bash
cat .workflow-core/skills_local/ops-flow-landing/SKILL.md
```

#### react-ui-state-patterns

```bash
cat .workflow-core/skills_local/react-ui-state-patterns/SKILL.md
```

#### iconography-2_5d

```bash
cat .workflow-core/skills_local/iconography-2_5d/SKILL.md
```

#### accessibility-density-review

```bash
cat .workflow-core/skills_local/accessibility-density-review/SKILL.md
```
