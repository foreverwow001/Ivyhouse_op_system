# `.agent` 刪除前置作業盤點

> 建立日期: 2026-04-07
> 對應任務: `Idx-030`
> 目的: 在真正刪除 `.agent/` 前，明確列出必須先清掉的 active / legacy surface，避免刪除後才發現 live workflow 或維運入口斷鏈。

## 1. Active Blockers

以下項目若不先處理，刪除 `.agent/` 後會留下 canonical/live surface 的邏輯分支、隱性 fallback 或錯誤治理訊號。

1. `/.github/workflow-core/runtime/scripts/bounded_work_unit_orchestrator.py`
   - repo root discovery 仍接受舊 `.agent/workflows/AGENT_ENTRY.md`
   - `WORKFLOW_CORE_ROOT` 仍保留 canonical / legacy 二選一路徑
2. `/.github/workflow-core/skills/_shared/__init__.py`
   - repo root discovery 與 static root 仍保留 `.agent` fallback 概念
   - shared metadata 常數仍暗示 legacy static root 可作為可接受來源
3. `/.github/workflow-core/skills/reviewed-sync-manager/scripts/reviewed_sync_manager.py`
   - template repo marker 仍把 `.agent/workflow_baseline_rules.md` 視為可接受訊號
4. `/.github/workflow-core/scripts/run_codex_template.sh`
   - 仍會 `mkdir -p .agent`，等同在 canonical runner 內保留 legacy root 再生行為
5. root `.github/**` live docs / prompts / custom agents
   - 仍宣告 `.agent/**` 是「保留中的 compatibility shim」
   - 若不先收斂，刪除 `.agent/` 會與現行治理敘述衝突

## 2. Legacy Surfaces To Retire

以下 surface 已不承擔 live authority，但仍代表 repo 對舊入口的相容承諾；真正刪除 `.agent/` 前，需先撤銷這個承諾或將其退役為歷史檔。

1. `/.agent/workflows/**`
   - forwarding docs，明示舊 workflow 入口仍可導航到新 root
2. `/.agent/roles/**`
   - legacy role navigation docs
3. `/.agent/runtime/scripts/**`
   - compatibility wrappers 與 retired stubs
4. `/.agent/runtime/tools/vscode_terminal_pty/README.md`
   - legacy PTY/fallback surface 歷史說明
5. `/.agent/runtime/tools/vscode_terminal_fallback/README.md`
   - legacy fallback surface 歷史說明
6. `/.agent/scripts/run_codex_template.sh`
   - 舊 bounded execution 入口
7. `/.agent/scripts/setup_obsidian_surface.sh`
   - 舊 restricted Obsidian surface 入口
8. `/.agent/skills/**`
   - legacy builtin skill package surface；刪除前須確認 canonical `.github/workflow-core/skills/**` 與 mutable `.workflow-core/**` 已足夠承接

## 3. Historical References

以下屬歷史 plan / log / architecture 證據，可保留，不構成刪除 `.agent/` 的直接 blocker；但若要做最終 archive，可後續再統一加註 historical note。

1. `doc/plans/Idx-026_plan.md`
2. `doc/plans/Idx-027_plan.md`
3. `doc/plans/Idx-029*_plan.md`
4. `doc/logs/Idx-029*_log.md`
5. `doc/architecture/workflow_core_*`
6. `project_maintainers/improvement_candidates/2026-04-04-ui-ux-skill-family-candidate.md`

## 4. Pre-delete Checklist

1. canonical code 不再以 `.agent/` 作 repo root、static root、runtime surface 或 template marker fallback
2. root `.github/**` 不再承諾 `.agent/**` 是保留中的 compatibility shim，而是明示其已退役、待移除
3. canonical runner / tooling 不再主動建立 `.agent/` 目錄
4. `.agent` 的唯一剩餘價值只限於「待刪 legacy tree」，而不是 workflow contract 的一部分
5. 在不刪原 workspace 的前提下，以不含 `.agent/` 的臨時副本跑完整驗證矩陣，證明 live workflow 可獨立運作

## 5. 本輪實作範圍

1. 先處理 Active Blockers
2. 再收斂 root `.github/**` 的 compatibility promise
3. 保留歷史 plan / log / architecture，不做大規模改寫
4. 不在本輪直接刪除 `.agent/`，只完成 delete-readiness pre-work 與驗證