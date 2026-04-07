# Workflow-core Phase 2 Import Batches

更新日期：2026-04-07

Authoritative source：否（`Idx-029` Phase 2 的匯入批次清單；實際執行與完成判定仍以 `doc/plans/Idx-029_phase-2_plan.md` 與 `doc/logs/Idx-029_phase-2_log.md` 為準）

## 目的

本文件將 `Idx-029` Phase 2 要導入的 upstream canonical core，切成可直接執行的精準 import batches，降低下一輪 cutover 一次匯入過多 surface 所帶來的風險。

本批次清單固定以以下 upstream 基線為準：

- upstream repo: `foreverwow001/agent-workflow-template`
- fixed baseline SHA: `3f6be124ee718744e6fd32812cd0e9591da97319`

## 批次原則

1. 先導入 `core_ownership_manifest.yml`，確保 machine-readable source of truth 落地。
2. 再導入 contract/docs/roles/workflows，讓 canonical core 先可讀。
3. 再導入 runtime/scripts 與 skills，讓本地 helper 與 portable smoke 路徑齊備。
4. templates 屬 canonical transport artifact，也在 Phase 2 導入，但不在本輪啟用。
5. `.workflow-core/**` 不從 upstream 複製，而是依 manifest split target 與 upstream helper 預期建立 local mutable scaffold。

## Batch 0：Manifest

檔案數：1

- `core_ownership_manifest.yml`

## Batch 1：Contract / Docs / Roles / Workflows / VS Code System

檔案數：23

- `.github/workflow-core/AGENT_ENTRY.md`
- `.github/workflow-core/docs/downstream/PORTABLE_WORKFLOW.md`
- `.github/workflow-core/docs/downstream/ROLE_AGENT_EXTENSION_RULES.md`
- `.github/workflow-core/docs/maintainer/PR_PREPARATION.md`
- `.github/workflow-core/roles/coordinator.md`
- `.github/workflow-core/roles/domain_expert.md`
- `.github/workflow-core/roles/engineer.md`
- `.github/workflow-core/roles/engineer_pending_review_recorder.md`
- `.github/workflow-core/roles/planner.md`
- `.github/workflow-core/roles/qa.md`
- `.github/workflow-core/roles/qa_pending_review_recorder.md`
- `.github/workflow-core/roles/security.md`
- `.github/workflow-core/roles/security_pending_review_recorder.md`
- `.github/workflow-core/vscode_system/Ivy_Coordinator.md`
- `.github/workflow-core/vscode_system/prompt_dev.md`
- `.github/workflow-core/vscode_system/tool_sets.md`
- `.github/workflow-core/workflow_baseline_rules.md`
- `.github/workflow-core/workflows/dev.md`
- `.github/workflow-core/workflows/references/README.md`
- `.github/workflow-core/workflows/references/coordinator_research_skill_trigger_checklist.md`
- `.github/workflow-core/workflows/references/engineer_skill_trigger_checklist.md`
- `.github/workflow-core/workflows/references/workflow_skill_trigger_design_principles.md`
- `.github/workflow-core/workflows/references/workflow_skill_trigger_index.md`

## Batch 2：Runtime / Scripts

檔案數：24

- `.github/workflow-core/runtime/scripts/bounded_work_unit_orchestrator.py`
- `.github/workflow-core/runtime/scripts/devcontainer/post_create.sh`
- `.github/workflow-core/runtime/scripts/install_workflow_prereqs.sh`
- `.github/workflow-core/runtime/scripts/portable_smoke/workflow_core_smoke.py`
- `.github/workflow-core/runtime/scripts/vscode/install_terminal_orchestrator.sh`
- `.github/workflow-core/runtime/scripts/vscode/install_terminal_tooling.sh`
- `.github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py`
- `.github/workflow-core/runtime/scripts/workflow_core_contracts.py`
- `.github/workflow-core/runtime/scripts/workflow_core_export_landing_checklist.py`
- `.github/workflow-core/runtime/scripts/workflow_core_export_materialize.py`
- `.github/workflow-core/runtime/scripts/workflow_core_manifest.py`
- `.github/workflow-core/runtime/scripts/workflow_core_obsidian_restricted_mount.py`
- `.github/workflow-core/runtime/scripts/workflow_core_projection.py`
- `.github/workflow-core/runtime/scripts/workflow_core_release_create.py`
- `.github/workflow-core/runtime/scripts/workflow_core_release_precheck.py`
- `.github/workflow-core/runtime/scripts/workflow_core_release_publish_notes.py`
- `.github/workflow-core/runtime/scripts/workflow_core_sync_apply.py`
- `.github/workflow-core/runtime/scripts/workflow_core_sync_precheck.py`
- `.github/workflow-core/runtime/scripts/workflow_core_sync_stage.py`
- `.github/workflow-core/runtime/scripts/workflow_core_sync_update.py`
- `.github/workflow-core/runtime/scripts/workflow_core_sync_verify.py`
- `.github/workflow-core/scripts/run_codex_template.sh`
- `.github/workflow-core/scripts/setup_obsidian_surface.sh`
- `.github/workflow-core/scripts/setup_workflow.sh`

## Batch 3：Skills Core

檔案數：71

- `.github/workflow-core/skills/INDEX.md`
- `.github/workflow-core/skills/RESTRUCTURE_BLUEPRINT.md`
- `.github/workflow-core/skills/__init__.py`
- `.github/workflow-core/skills/_shared/__init__.py`
- `.github/workflow-core/skills/_shared/frontmatter.py`
- `.github/workflow-core/skills/_shared/skill_manifest.json`
- `.github/workflow-core/skills/_shared/skill_whitelist.json`
- `.github/workflow-core/skills/code-reviewer/SKILL.md`
- `.github/workflow-core/skills/code-reviewer/references/review_checklist.md`
- `.github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py`
- `.github/workflow-core/skills/code-reviewer/scripts/code_reviewer_rules.py`
- `.github/workflow-core/skills/codex-collaboration-bridge/SKILL.md`
- `.github/workflow-core/skills/deep-research/SKILL.md`
- `.github/workflow-core/skills/deep-research/references/research-process.md`
- `.github/workflow-core/skills/deep-research/references/source-policy-and-output.md`
- `.github/workflow-core/skills/doc-generator/SKILL.md`
- `.github/workflow-core/skills/doc-generator/scripts/doc_generator.py`
- `.github/workflow-core/skills/explore-cli-tool/SKILL.md`
- `.github/workflow-core/skills/fact-checker/SKILL.md`
- `.github/workflow-core/skills/fact-checker/references/verdict-and-context.md`
- `.github/workflow-core/skills/fact-checker/references/verification-process.md`
- `.github/workflow-core/skills/git-stats-reporter/SKILL.md`
- `.github/workflow-core/skills/git-stats-reporter/scripts/git_stats_reporter.py`
- `.github/workflow-core/skills/github-explorer/SKILL.md`
- `.github/workflow-core/skills/github-explorer/scripts/github_explorer.py`
- `.github/workflow-core/skills/github-explorer/scripts/github_explorer_resolver.py`
- `.github/workflow-core/skills/manifest-updater/SKILL.md`
- `.github/workflow-core/skills/manifest-updater/scripts/manifest_updater.py`
- `.github/workflow-core/skills/pending-review-recorder/SKILL.md`
- `.github/workflow-core/skills/pending-review-recorder/scripts/pending_review_recorder.py`
- `.github/workflow-core/skills/persistent-terminal/SKILL.md`
- `.github/workflow-core/skills/plan-validator/SKILL.md`
- `.github/workflow-core/skills/plan-validator/scripts/plan_validator.py`
- `.github/workflow-core/skills/project-planner/SKILL.md`
- `.github/workflow-core/skills/project-planner/references/estimation-and-risk.md`
- `.github/workflow-core/skills/project-planner/references/planning-framework.md`
- `.github/workflow-core/skills/project-planner/references/task-sizing-and-dependencies.md`
- `.github/workflow-core/skills/python-expert/SKILL.md`
- `.github/workflow-core/skills/python-expert/references/python-correctness.md`
- `.github/workflow-core/skills/python-expert/references/python-performance.md`
- `.github/workflow-core/skills/python-expert/references/python-style-and-documentation.md`
- `.github/workflow-core/skills/python-expert/references/python-type-safety.md`
- `.github/workflow-core/skills/refactor/SKILL.md`
- `.github/workflow-core/skills/refactor/references/refactor-python.md`
- `.github/workflow-core/skills/refactor/references/refactor-smells.md`
- `.github/workflow-core/skills/refactor/references/refactor-typescript-javascript.md`
- `.github/workflow-core/skills/refactor/references/refactor-workflow.md`
- `.github/workflow-core/skills/reviewed-sync-manager/SKILL.md`
- `.github/workflow-core/skills/reviewed-sync-manager/scripts/reviewed_sync_manager.py`
- `.github/workflow-core/skills/reviewed-sync-manager/scripts/reviewed_sync_support.py`
- `.github/workflow-core/skills/schema-review-helper/SKILL.md`
- `.github/workflow-core/skills/schema-review-helper/references/schema_checklist.md`
- `.github/workflow-core/skills/schemas/code_reviewer_output.schema.json`
- `.github/workflow-core/skills/schemas/git_stats_reporter_output.schema.json`
- `.github/workflow-core/skills/schemas/github_explorer_output.schema.json`
- `.github/workflow-core/skills/schemas/manifest_updater_output.schema.json`
- `.github/workflow-core/skills/schemas/plan_validator_output.schema.json`
- `.github/workflow-core/skills/schemas/skills_evaluator_output.schema.json`
- `.github/workflow-core/skills/schemas/test_runner_output.schema.json`
- `.github/workflow-core/skills/security-review-helper/SKILL.md`
- `.github/workflow-core/skills/security-review-helper/references/security_checklist.md`
- `.github/workflow-core/skills/skill-converter/README.md`
- `.github/workflow-core/skills/skill-converter/scripts/skill_converter.py`
- `.github/workflow-core/skills/skills-evaluator/SKILL.md`
- `.github/workflow-core/skills/skills-evaluator/scripts/skills_evaluator.py`
- `.github/workflow-core/skills/test-runner/SKILL.md`
- `.github/workflow-core/skills/test-runner/scripts/test_runner.py`
- `.github/workflow-core/skills/typescript-expert/SKILL.md`
- `.github/workflow-core/skills/typescript-expert/references/typescript-api-and-testing.md`
- `.github/workflow-core/skills/typescript-expert/references/typescript-javascript-core.md`
- `.github/workflow-core/skills/typescript-expert/references/typescript-react-patterns.md`

## Batch 4：Templates / Transport Artifacts

檔案數：34

- `.github/workflow-core/templates/downstream_bootstrap/.devcontainer/devcontainer.json`
- `.github/workflow-core/templates/downstream_bootstrap/.github/agents/ivy-coordinator.agent.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/agents/ivy-domain-expert.agent.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/agents/ivy-engineer.agent.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/agents/ivy-planner.agent.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/agents/ivy-qa-reviewer.agent.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/agents/ivy-security-reviewer.agent.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/copilot-instructions.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/instructions/reviewer-packages.instructions.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/instructions/workflow-navigation.instructions.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/prompts/dev.prompt.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/AGENT_ENTRY.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/roles/coordinator.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/roles/domain_expert.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/roles/engineer.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/roles/engineer_pending_review_recorder.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/roles/planner.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/roles/qa.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/roles/qa_pending_review_recorder.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/roles/security.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/roles/security_pending_review_recorder.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/vscode_system/Ivy_Coordinator.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/vscode_system/prompt_dev.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/vscode_system/tool_sets.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/workflow_baseline_rules.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/workflows/dev.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/workflows/references/README.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/workflows/references/coordinator_research_skill_trigger_checklist.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/workflows/references/engineer_skill_trigger_checklist.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/workflows/references/workflow_skill_trigger_design_principles.md`
- `.github/workflow-core/templates/downstream_bootstrap/.github/workflow-core/workflows/references/workflow_skill_trigger_index.md`
- `.github/workflow-core/templates/downstream_bootstrap/.vscode/extensions.json`
- `.github/workflow-core/templates/downstream_bootstrap/.vscode/settings.json`
- `.github/workflow-core/templates/handoff_template.md`

## Batch 5：Local Mutable Root Scaffold

來源：本地建立，不從 upstream 直接拷貝

建立原則：依 `core_ownership_manifest.yml` 的 `split_required`、`skill_ownership.local_install_target` 與 upstream `.github/workflow-core/skills/_shared/__init__.py` 預期路徑建立。

預定建立檔案：

- `.workflow-core/README.md`
- `.workflow-core/state/execution_log.jsonl`
- `.workflow-core/state/skills/INDEX.local.md`
- `.workflow-core/state/skills/skill_manifest.json`
- `.workflow-core/state/skills/audit.log`
- `.workflow-core/config/skills/skill_whitelist.json`
- `.workflow-core/skills_local/README.md`
- `.workflow-core/staging/README.md`

## 本輪不處理

- `.agent/**` shim 化
- `.vscode/settings.json` cutover
- `.devcontainer/devcontainer.json` cutover
- `project_maintainers/**` starter skeleton 導入
- `doc/plans/Idx-000_plan.template.md` 與 `doc/logs/Idx-000_log.template.md` 的 upstream 版本導入

## 匯入順序建議

1. Batch 0
2. Batch 1
3. Batch 2
4. Batch 3
5. Batch 4
6. Batch 5

## 驗證重點

1. `core_ownership_manifest.yml` 已存在於 repo root。
2. `.github/workflow-core/AGENT_ENTRY.md`、`.github/workflow-core/workflows/dev.md`、`.github/workflow-core/runtime/scripts/workflow_core_manifest.py`、`.github/workflow-core/skills/_shared/__init__.py` 均已落地。
3. `.workflow-core/state/skills/skill_manifest.json`、`.workflow-core/config/skills/skill_whitelist.json`、`.workflow-core/skills_local/**` 與 `.workflow-core/state/execution_log.jsonl` 已存在。
4. 本輪不切換 `.agent/**` live authority。