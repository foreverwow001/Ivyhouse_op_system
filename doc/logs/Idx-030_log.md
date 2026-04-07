# Idx-030: `.agent` 刪除前置作業：legacy surface 退役、canonical 去耦與刪除前驗證 - Execution Log

> 建立日期: 2026-04-07
> 狀態: Completed

---

## 🔗 ARTIFACT_CHAIN

- task_id: `Idx-030`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-030_plan.md`
- log_file_path: `doc/logs/Idx-030_log.md`
- prior_log_path: `doc/logs/Idx-029_phase-5_log.md`

## 🎯 WORKFLOW_SUMMARY

### Goal
完成 `.agent/` 刪除前的 canonical 去耦、legacy 退役準備與 delete-readiness 驗證。

### Scope
- 建立 `.agent` 刪除前置作業盤點
- 清除 canonical/live surface 對 `.agent/` 的依賴與 compatibility promise
- 跑完整驗證，並以不含 `.agent/` 的臨時副本再驗一次

## 🧾 EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | GitHub Copilot |
| security_reviewer_tool | N/A |
| qa_tool | N/A |
| last_change_tool | GitHub Copilot |
| qa_result | N/A |
| commit_hash | working-tree-uncommitted |

## 🛠️ SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|-------|--------|--------|---------|-----------|
| inventory | `.agent` pre-delete surface | success | 建立 active blockers / legacy surface / historical references 清單 | 2026-04-07 |
| validation | current workspace | success-with-known-dirty | reviewer/portable smoke/guard/build/smoke 通過；sync verify 因 managed divergence 對 `origin/main` 屬預期失敗 | 2026-04-07 |
| validation | no-agent temp clone | success | 在不含 `.agent/` 的副本中完成完整 delete-readiness 驗證 | 2026-04-07 |

## 📈 SKILLS_EVALUATION

本輪未使用額外 skills runner；以 canonical scripts、workspace validation 與 no-agent temp clone 直接完成 evidence 收斂。

## ✅ QA_SUMMARY

- 結論：PASS
- 風險：current workspace 因本輪未提交變更，對 `origin/main` 的 sync verify 仍會顯示 managed divergence；這是工作樹狀態，不是 `.agent` 刪除阻斷
- 後續事項：下一輪即可執行 `.agent/` 實體刪除與殘留歷史 surface archive / cleanup

## 📎 EVIDENCE

- `doc/architecture/agent_retirement_predelete_inventory.md`
- current workspace:
	- `python .github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py --repo-root . --json` -> `status=ready`
	- `python .github/workflow-core/runtime/scripts/portable_smoke/workflow_core_smoke.py --repo-root . --json` -> `status=pass`
	- `python .github/workflow-core/runtime/scripts/workflow_core_sync_verify.py --repo-root . --release-ref origin/main --json` -> `status=fail`，原因為本輪 canonical managed paths 尚未提交到 `origin/main`
	- `npm run guard:maintainer-paths` -> pass
	- `npm run build:api` -> pass
	- `npm run build:portal` -> pass
	- `npm run test:api:smoke` -> pass
	- `npm run test:api:mapping:smoke` -> pass
- no-agent temp clone (`/tmp/idx030_noagent_work`):
	- reviewer preflight -> `status=ready`
	- portable smoke -> `status=pass`
	- sync precheck -> `status=pass`
	- sync verify -> `status=pass`
	- `npm run guard:maintainer-paths` -> pass
	- `npm run build:api` -> pass
	- `npm run build:portal` -> pass
	- `npm run test:api:smoke` -> pass
	- `npm run test:api:mapping:smoke` -> pass

## 🧾 EXECUTION_NOTES

1. canonical 去耦重點如下：
	 - `bounded_work_unit_orchestrator.py` 不再接受 `.agent/workflows/AGENT_ENTRY.md` 作為 repo root fallback
	 - `skills/_shared/__init__.py` 不再保留 legacy static root / audit log fallback
	 - `reviewed_sync_manager.py` 不再接受 `.agent/workflow_baseline_rules.md` 作為 template repo marker
	 - `run_codex_template.sh` 不再建立 `.agent` 目錄
2. root `.github/**` 已將 `.agent/**` 的描述從「compatibility shim」收斂為「已退役、待移除的 legacy surface」。
3. delete-readiness 驗證採非破壞式方式：建立臨時副本、移除 `.agent/`、補齊 working tree、在副本內做臨時 commit 後重跑完整驗證。

## 🏁 FINAL_SIGNOFF

- 結論：PASS
- 判定：`.agent/` 刪除前置作業已完成，現在已可安全進入 `.agent/` 實體刪除 work step
- 依據：no-agent temp clone 在完整驗證矩陣下通過 reviewer preflight、portable smoke、sync precheck / verify、guard、build 與 API smoke