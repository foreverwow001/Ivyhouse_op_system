# Idx-029 Phase 3: Local Overlay Split 與 Mutable Surface 搬移 - Execution Log

> Historical note (`Idx-029` Phase 4): 本 log 中保留 `.agent` mutable path 作為搬移前後的歷史證據；cutover 完成後，現行 mutable authority 以 `.workflow-core/**` 為準。

> 建立日期: 2026-04-07
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-029 Phase 3`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-029_phase-3_plan.md`
- log_file_path: `doc/logs/Idx-029_phase-3_log.md`
- split_matrix_path: `doc/architecture/workflow_core_phase3_split_matrix.md`

## 🎯 WORKFLOW_SUMMARY

### Goal
將 `.agent/**` 中屬於 Ivyhouse local overlay 的 `skills_local`、mutable state/config 與 role-specific wording 從舊 surface 分離出來，正式搬到 `.workflow-core/**` 與 `.github/workflow-core/roles/**`，同時保留 `.agent/roles/**` 作為 Phase 4 cutover 前的 live authority。

### Scope
- 建立 Phase 3 precise split matrix
- 搬移 `.agent/skills_local/**` 到 `.workflow-core/skills_local/**`
- 搬移 local skill catalog / whitelist 到 `.workflow-core/state/**` 與 `.workflow-core/config/**`
- 建立 Ivyhouse role overlay docs
- 更新 live `.agent/workflows/**`、`.agent/roles/**`、`.agent/skills/**` 的 mutable path 引用鏈
- 移除已搬家的舊 `.agent` mutable copies

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | codex-cli |
| security_reviewer_tool | N/A |
| qa_tool | N/A |
| last_change_tool | codex-cli |
| qa_result | PASS |
| commit_hash | pending |

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| split-matrix | `doc/architecture/workflow_core_phase3_split_matrix.md` | done | 將 `.agent` 各 surface 明確標記為 `keep` / `move` / `retire`，並給出 Phase 3 target | 2026-04-07 |
| overlay-move | `.workflow-core/skills_local/**` | done | 將 6 個 repo-local UI/UX skill packages 複製到 new mutable root | 2026-04-07 |
| state-config-move | `.workflow-core/state/**`, `.workflow-core/config/**` | done | 將 local skill catalog 與 whitelist 正式切到 `.workflow-core/**` | 2026-04-07 |
| role-split | `.github/workflow-core/roles/**` | done | 建立 `ivyhouse_*_overlay.md` 系列 role overlay docs，並將 `domain_expert.md` 直接承接到 canonical root | 2026-04-07 |
| live-ref-update | `.agent/workflows/**`, `.agent/roles/**`, `.agent/skills/**` | done | 將 live workflow 對 local skills/state/config 的引用鏈切到 `.workflow-core/**` | 2026-04-07 |
| legacy-cleanup | `.agent/skills_local/**`, `.agent/state/**`, `.agent/config/**` | done | 移除已搬移的 legacy mutable copies，降低 stale divergence 風險 | 2026-04-07 |

## 📈 SKILLS_EVALUATION

Phase 3 已把 mutable/local overlay 從舊 `.agent` root 拆出。live workflow 仍可透過 `.agent/workflows/**` 與 `.agent/roles/**` 運作，但真正被讀取的 local skills/state/config 已改由 `.workflow-core/**` 提供。role 客製差異已收斂到 `.github/workflow-core/roles/ivyhouse_*_overlay.md`，為 Phase 4 shim cutover 預先鋪路。

## ✅ QA_SUMMARY

- 結論：PASS
- 風險：`.agent/skills/RESTRUCTURE_BLUEPRINT.md`、`.agent/skills/skill-converter/README.md` 等歷史或補充文件仍保留舊路徑敘述，未納入本輪 live authority 修正範圍
- 後續事項：Phase 4 應將 `.agent/roles/**`、`.agent/workflows/**`、`.agent/runtime/**` 轉為 shim / forwarding surface，並把 root `.github/**` 切成正式 live authority

## 📎 EVIDENCE

- mutable root artifacts:
  - `.workflow-core/skills_local/**`
  - `.workflow-core/state/skills/INDEX.local.md`
  - `.workflow-core/config/skills/skill_whitelist.json`
- role overlay artifacts:
  - `.github/workflow-core/roles/domain_expert.md`
  - `.github/workflow-core/roles/ivyhouse_coordinator_overlay.md`
  - `.github/workflow-core/roles/ivyhouse_engineer_overlay.md`
  - `.github/workflow-core/roles/ivyhouse_planner_overlay.md`
  - `.github/workflow-core/roles/ivyhouse_qa_overlay.md`
  - `.github/workflow-core/roles/ivyhouse_security_overlay.md`
  - `.github/workflow-core/roles/ivyhouse_engineer_pending_review_overlay.md`
  - `.github/workflow-core/roles/ivyhouse_qa_pending_review_overlay.md`
  - `.github/workflow-core/roles/ivyhouse_security_pending_review_overlay.md`
- validation evidence:
  - `get_errors` on `.agent/skills/_shared/__init__.py`, `.agent/skills/github-explorer/scripts/github_explorer.py`, `.agent/skills/skill-converter/scripts/skill_converter.py` -> No errors found
  - `grep_search` on `.agent/workflows/**` and `.agent/roles/**` for legacy mutable paths -> No matches found
  - `list_dir` on `.agent/` -> `config/`, `state/`, `skills_local/` 已不存在