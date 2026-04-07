# Idx-029 Phase 2: Canonical Core 導入與 Mutable Root Scaffold - Execution Log

> Historical note (`Idx-029` Phase 4): 本 log 內若提到 `.agent/state/**`、`.agent/config/**` 或 `.agent/skills_local/**`，均屬 cutover 前的來源/待搬移路徑；現行 mutable authority 已改為 `.workflow-core/**`。

> 建立日期: 2026-04-07
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-029 Phase 2`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-029_phase-2_plan.md`
- log_file_path: `doc/logs/Idx-029_phase-2_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal
導入 `core_ownership_manifest.yml`、`.github/workflow-core/**` 與 `.workflow-core/**`，讓 repo 首次具備 manifest-backed canonical core 與 mutable/runtime companion root。

### Scope
- 導入 upstream canonical core（固定 baseline SHA）
- 建立 `.workflow-core/**` mutable scaffold
- 不切 `.agent/**` live authority
- 不改 `.vscode/**` 與 `.devcontainer/**`

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
| import-batching | canonical core tree | done | 建立 `doc/architecture/workflow_core_phase2_import_batches.md`，將 Phase 2 匯入切成 6 個精準 batches | 2026-04-07 |
| canonical-import | manifest + `.github/workflow-core/**` | done | 以 baseline SHA `3f6be124ee718744e6fd32812cd0e9591da97319` 導入 canonical core | 2026-04-07 |
| mutable-scaffold | `.workflow-core/**` | done | 建立 state/config/skills_local/staging scaffold 與預設 metadata files | 2026-04-07 |

## 📈 SKILLS_EVALUATION

Phase 2 主要檔案已落地並完成 focused validation：本地 helper 可讀取新 manifest，upstream shared helper 可解析 canonical root 與 mutable root，缺漏的 runtime log files 亦已補齊。

## ✅ QA_SUMMARY

- 結論：PASS
- 風險：目前 canonical core 已存在，但 `.agent/**` 仍是 live authority；若後續 Phase 3 / 4 未完成，repo 會持續處於雙根並存狀態
- 後續事項：進入 Phase 3 前，先盤點 `.agent/roles/**`、`.agent/state/**`、`.agent/config/**` 與 `.agent/skills_local/**` 的 local overlay split 清單

## 📎 EVIDENCE

- PTY debug: None
- PTY live: None
- 其他 evidence: `core_ownership_manifest.yml`、`.github/workflow-core/**`、`.workflow-core/**`、`doc/architecture/workflow_core_phase2_import_batches.md`、manifest/helper validation `missing []`