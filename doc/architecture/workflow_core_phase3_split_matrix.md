# Workflow Core Phase 3 Split Matrix

## 目的

本表將 `.agent/**` 中屬於 local overlay 的 surface，明確標記為 `keep`、`move`、`shim` 或 `retire`，作為 `Idx-029` Phase 3 的實作基線。

判定原則：

1. Phase 3 只搬 local overlay 與 mutable state/config surface，不提前把 `.agent/**` 全面 shim 化。
2. 仍屬 live authority 的 `.agent/workflows/**` 與 `.agent/roles/**`，本 phase 先保留可執行責任，再抽出 overlay 去向。
3. `core_ownership_manifest.yml` 已宣告的 mutable target，優先搬到 `.workflow-core/**`。
4. downstream 專案特化角色內容，優先收斂到 `.github/workflow-core/roles/**` 的 overlay files；不直接覆蓋 upstream canonical role contract，唯一例外是 manifest 已明列為 downstream overlay 的 `domain_expert.md`。

## Surface Matrix

| Legacy surface | Phase 3 action | Target / outcome | 理由 |
|---|---|---|---|
| `.agent/skills_local/**` | `move` | `.workflow-core/skills_local/**` | local skills 屬 mutable root，不應繼續留在舊 `.agent` surface |
| `.agent/state/skills/INDEX.local.md` | `move` | `.workflow-core/state/skills/INDEX.local.md` | local skill catalog 屬 mutable state，manifest 已定義 target |
| `.agent/config/skills/skill_whitelist.json` | `move` | `.workflow-core/config/skills/skill_whitelist.json` | whitelist 屬 mutable config，manifest 已定義 target |
| `.agent/roles/domain_expert.md` | `move` | `.github/workflow-core/roles/domain_expert.md` | manifest 已將此檔列為 downstream overlay-project-local，允許直接承接到 canonical root |
| `.agent/roles/coordinator.md` | `keep` | 先保留 live authority；另抽出 `.github/workflow-core/roles/ivyhouse_coordinator_overlay.md` | 仍承擔 PTY-primary live contract，Phase 4 前不能直接退場 |
| `.agent/roles/engineer.md` | `keep` | 先保留 live authority；另抽出 `.github/workflow-core/roles/ivyhouse_engineer_overlay.md` | 仍是 live engineer handoff 入口，但專案特化內容需先移出 `.agent` |
| `.agent/roles/qa.md` | `keep` | 先保留 live authority；另抽出 `.github/workflow-core/roles/ivyhouse_qa_overlay.md` | 仍是 live QA handoff 入口，但專案特化內容需先移出 `.agent` |
| `.agent/roles/planner.md` | `keep` | 先保留 live authority；另抽出 `.github/workflow-core/roles/ivyhouse_planner_overlay.md` | planner 仍被 live workflow 直接引用 |
| `.agent/roles/security.md` | `keep` | 先保留 live authority；另抽出 `.github/workflow-core/roles/ivyhouse_security_overlay.md` | security 仍被 live workflow 直接引用 |
| `.agent/roles/engineer_pending_review_recorder.md` | `keep` | 先保留 live authority；另抽出 `.github/workflow-core/roles/ivyhouse_engineer_pending_review_overlay.md` | 屬 project-local triage overlay，Phase 4 再做 shim |
| `.agent/roles/qa_pending_review_recorder.md` | `keep` | 先保留 live authority；另抽出 `.github/workflow-core/roles/ivyhouse_qa_pending_review_overlay.md` | 屬 project-local triage overlay，Phase 4 再做 shim |
| `.agent/roles/security_pending_review_recorder.md` | `keep` | 先保留 live authority；另抽出 `.github/workflow-core/roles/ivyhouse_security_pending_review_overlay.md` | 屬 project-local triage overlay，Phase 4 再做 shim |
| `.agent/workflows/**` | `keep` | Phase 4 才轉為 shim / forwarding docs | 目前仍是 live workflow authority |
| `.agent/runtime/**` | `keep` | Phase 4 才決定 shim / retire | 仍承擔 PTY-primary live runtime |
| `.agent/skills/**` builtin core packages | `keep` | 先保留 live path；本 phase 僅把 mutable path 與 local install target 改指向新 root | 仍提供 live workflow skill scripts，不在 Phase 3 整體搬移 |
| `.agent/state/skills/skill_manifest.json` | `retire` | 本 repo 現況無 live file；以 `.workflow-core/state/skills/skill_manifest.json` 為唯一 canonical state | 不建立第二份 legacy mutable state |
| `.agent/state/skills/audit.log` | `retire` | 本 repo 現況無 live file；以 `.workflow-core/state/skills/audit.log` 為唯一 canonical state | 不建立第二份 legacy mutable state |

## Phase 3 實作順序

1. 先搬 `.agent/skills_local/**`、`.agent/state/skills/INDEX.local.md`、`.agent/config/skills/skill_whitelist.json` 到 `.workflow-core/**`。
2. 同步更新 live `.agent/workflows/**`、`.agent/roles/**`、`.agent/skills/**` 中對 mutable path 的引用鏈。
3. 將 project-local roles 差異抽出到 `.github/workflow-core/roles/ivyhouse_*_overlay.md`。
4. 保留 `.agent/roles/**` 作為 Phase 4 cutover 前的 live authority，不在本 phase 先做 shim。

## 風險註記

- 若 live `.agent/**` 還殘留 `.agent/skills_local/**` 或 `.agent/state/skills/**` 的硬編碼引用，會在 Phase 3 造成讀取失敗；因此搬移與引用鏈更新必須同輪完成。
- `.agent/roles/**` 目前全部與 upstream canonical roles 有差異；若在 Phase 3 直接覆蓋 canonical core，會把 upstream 可升級面與 project-local overlay 混在一起，因此本 phase 只允許 `domain_expert.md` 直接承接，其餘一律拆成 overlay docs。