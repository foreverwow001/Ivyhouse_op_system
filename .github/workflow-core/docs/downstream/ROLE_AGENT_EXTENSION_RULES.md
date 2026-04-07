# Downstream Roles / Agents 擴充規則

> 本文件說明 downstream repo 在現行 root `.github/**` + `.github/workflow-core/**` 架構下，應如何安全擴充角色與 custom agent。

---

## 1. 先分清楚兩種 surface

### `.github/workflow-core/roles/`

這一層是 **canonical role contract**。

用途是定義某個角色：

- 應讀哪些規則與 skill
- 負責什麼工作
- 不能做什麼
- 完成時要輸出什麼

它是「角色規格」與「工作守則」，不是 root-level 的直接呼叫入口。

### `.github/agents/`

這一層是 **custom agent surface**。

用途是提供：

- 可直接被使用者或 Coordinator 指名的 agent 名稱
- agent 的 description / tools / user-invocable surface
- 讓 Copilot / custom agent runtime 能直接 dispatch 的入口

它是「可被叫上場的人」，不是角色規格本體。

### 實際 dispatch 是怎麼運作的

啟動 `/dev` 後：

1. root prompt `.github/prompts/dev.prompt.md` 會把 workflow 導向 `Ivy Coordinator`
2. `Ivy Coordinator` 本身是 root `.github/agents/ivy-coordinator.agent.md`
3. Coordinator 在 workflow 中要指派 Planner / Engineer / QA / Security Reviewer 時，真正可直接 dispatch 的目標是 root `.github/agents/*.agent.md`
4. 這些 agent 在執行時，再以 `.github/workflow-core/roles/*.md` 作為 canonical 行為契約

簡單說：

- `.github/agents/` = 可直接 dispatch 的 agent surface
- `.github/workflow-core/roles/` = 這些 agent 應遵守的角色契約

---

## 2. 何時只新增 `roles/`

只在下列情況新增 `.github/workflow-core/roles/<new-role>.md` 即可：

1. 你只是想補充一個新的角色規格或 reviewer overlay。
2. 這個角色不需要成為 root-level 的直接可呼叫 agent。
3. 這個角色只會作為既有 agent 的附加規則，由 Coordinator 在 handoff package 中要求既有 agent 讀取。
4. 你要做的是 project-specific domain overlay，而不是新增一個新的調度節點。

典型例子：

- `pricing_expert.md`
- `compliance_overlay.md`
- `migration_reviewer.md`
- 某個 triage recorder overlay role

這種情況下，Coordinator 可以把該 role 文件當成「必讀規格」注入既有 agent，但它本身不是獨立 dispatch target。

---

## 3. 何時要同步新增 `agents/`

若符合以下任一條件，就不應只新增 `roles/`，而應同步新增 root `.github/agents/<new-agent>.agent.md`：

1. 你希望 Coordinator 能直接 dispatch 到這個新角色。
2. 你希望這個角色有自己的名稱、description、工具限制與 custom agent surface。
3. 你希望使用者能直接選用或明確看到這個 agent。
4. 你希望它不是「既有 agent 讀一份補充說明」，而是 workflow 中獨立的一個執行 / review 節點。

典型例子：

- `Ivy Domain Expert`
- `Ivy Compliance Reviewer`
- `Ivy Data Migration Reviewer`

> 補充：若你的目標包含 agent 級別的獨立執行表面、工具限制或平台層模型選擇，這些都屬於 `.github/agents/*.agent.md` 這一層，不屬於 `roles/*.md`。

---

## 4. 新 agent 接入 workflow 時，最少要改哪些檔案

若你要把新角色正式接入 downstream workflow，最小修改集合通常如下。

### 必改

1. `.github/workflow-core/roles/<new-role>.md`
2. `.github/agents/<new-agent>.agent.md`

這兩個分別定義：

- 角色契約
- 可直接 dispatch 的 agent surface

### 依接入深度決定是否必改

3. `.github/workflow-core/roles/coordinator.md`

當新 agent 需要成為正式 orchestration 節點時，必須更新 Coordinator 的責任說明、handoff 邏輯或 decision boundary。

4. `.github/workflow-core/workflows/dev.md`

當新 agent 影響 stage 順序、phase handoff 或 workflow sequence summary 時，必須更新這份摘要。

5. `.github/workflow-core/AGENT_ENTRY.md`

只有在新 agent 會改變正式 gate、entry contract、required package、trigger 規則或 workflow 高層合約時，才需要更新。

6. `.github/instructions/workflow-navigation.instructions.md`

當你希望這個新 agent 成為 root navigation 中可見、可直接使用的正式入口時，應同步補上。

### 常見但非必改

7. `.github/prompts/*.prompt.md`

只有在你新增了新的 slash prompt 或 prompt-level 入口時才需要。

8. downstream 專案自己的 `project_rules.md`

若新 agent 對專案有額外規則、邊界或風險要求，應同步寫回 project-local rules。

---

## 5. 三種常見擴充模式

### 模式 A：只有新 role，沒有新 agent

適用：

- 只是補一份 project-local 審查規格
- 由既有 Planner / Engineer / QA / Security Reviewer 讀取後執行

最少改動：

1. `.github/workflow-core/roles/<new-role>.md`
2. 必要時在 `.github/workflow-core/roles/coordinator.md` 或 `project_rules.md` 補一行，說明何時要讀這份 role

### 模式 B：新 role + 新 agent，但不改 workflow stage

適用：

- 你需要一個可直接呼叫的新 custom agent
- 但它不一定成為 `/dev` 的固定階段，只是條件式派發節點

最少改動：

1. `.github/workflow-core/roles/<new-role>.md`
2. `.github/agents/<new-agent>.agent.md`
3. `.github/instructions/workflow-navigation.instructions.md`
4. 必要時在 `.github/workflow-core/roles/coordinator.md` 補一段條件式 dispatch 規則

### 模式 C：新 role + 新 agent + 正式進入 workflow

適用：

- 它是 `/dev` 的正式新階段，或會改變既有階段順序

最少改動：

1. `.github/workflow-core/roles/<new-role>.md`
2. `.github/agents/<new-agent>.agent.md`
3. `.github/workflow-core/roles/coordinator.md`
4. `.github/workflow-core/workflows/dev.md`
5. 視合約影響程度決定是否更新 `.github/workflow-core/AGENT_ENTRY.md`
6. `.github/instructions/workflow-navigation.instructions.md`

---

## 6. downstream 擴充時的判斷原則

新增前先問三個問題：

1. 我需要的是「一份角色規格」，還是「一個可直接 dispatch 的 agent」？
2. 這個新角色只是 project-local overlay，還是 workflow 的正式新節點？
3. 它會不會改變 gate、stage 順序、review package 或 entry contract？

對應判斷：

- 只需要規格，不需要直接 dispatch：只加 `roles/`
- 需要直接 dispatch，但不改 stage：加 `roles/` + `.github/agents/`
- 需要正式納入 workflow：加 `roles/` + `.github/agents/` + workflow/coordinator 對應文件

---

## 7. 建議做法

對 downstream repo，預設採以下策略：

1. 先把 project-specific knowledge 收斂成 `roles/` 文件。
2. 只有當它真的需要成為可直接調度的獨立節點時，再新增 `.github/agents/`。
3. 只有當它會改變 workflow 的正式順序或 gate 時，才去碰 `dev.md` 或 `AGENT_ENTRY.md`。

這樣可以避免把 project-local 擴充過早升級成整套 workflow contract 變更。

---

## 8. 相關文件

- `./PORTABLE_WORKFLOW.md`
- `../../roles/coordinator.md`
- `../../workflows/dev.md`
- `../../AGENT_ENTRY.md`
- `../../../instructions/workflow-navigation.instructions.md`

---

## 9. 最小接線範例：`Ivy Domain Expert`

以下示範一個「新 role + 新 agent + Coordinator 條件式 dispatch」的最小接線範例。

### 情境

downstream 專案除了保留 `roles/domain_expert.md` 的領域審核規格外，還希望在命中特定條件時，讓 Coordinator 直接 dispatch 到 `Ivy Domain Expert` 這個 custom agent。

### 最少需要存在的檔案

1. `.github/workflow-core/roles/domain_expert.md`
2. `.github/agents/ivy-domain-expert.agent.md`

第一個定義角色契約；第二個提供可直接 dispatch 的 agent surface。

### 最小條件式 dispatch 規則

可在 `.github/workflow-core/roles/coordinator.md` 增加一小段 project-local 規則，例如：

```markdown
### Domain Expert 條件式 dispatch（project-local example）

若本輪 Plan 命中以下任一條件，Coordinator 應 dispatch `Ivy Domain Expert`：

- `MASTER DATA IMPACT != N/A`
- `RBAC IMPACT != N/A`
- 檔案白名單命中 `schemas/`、`models/`、`permissions/`
- user 明確要求 domain review
```

### 最小 workflow 接線建議

若你不想改 stage 順序，只要在 `dev.md` 或 coordinator handoff package 補一句條件式說明即可，例如：

```markdown
當 Domain Expert trigger 命中時，在 Planner 完成、Engineer 開始前，插入一輪 `Ivy Domain Expert` advisory review。
```

這樣屬於「條件式派發節點」，不一定要把它升格成固定 Step。

### 何時還要再改更多檔案

若你要把 `Ivy Domain Expert` 從條件式 advisory review 升格成 `/dev` 的正式固定階段，才需要再更新：

1. `.github/workflow-core/workflows/dev.md`
2. 視 gate / contract 影響程度決定是否更新 `.github/workflow-core/AGENT_ENTRY.md`
3. `.github/instructions/workflow-navigation.instructions.md`

### 這個範例的重點

- `roles/domain_expert.md` 負責「怎麼審」
- `.github/agents/ivy-domain-expert.agent.md` 負責「可以 dispatch 給誰」
- `coordinator.md` / `dev.md` 負責「什麼時候 dispatch」
