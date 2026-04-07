# -*- coding: utf-8 -*-
"""
runtime/scripts/bounded_work_unit_orchestrator.py
=====================================================
用途：解析 Plan 中的 bounded work unit contract，產生 Coordinator 可用的 orchestration payload
職責：
  - 驗證單一 work_unit 是否可進入 bounded Engineer loop
  - 將 allowed_checks 轉成 canonical command mapping
  - 產生初始 loop state 與 Engineer 注入 prompt
=====================================================

使用方式：
    python .github/workflow-core/runtime/scripts/bounded_work_unit_orchestrator.py <plan_file_path>
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List


RUNTIME_SCRIPTS_DIR = Path(__file__).resolve().parent


def _discover_repo_root(start_dir: Path) -> Path:
    for candidate in [start_dir, *start_dir.parents]:
        if (candidate / ".github" / "workflow-core" / "AGENT_ENTRY.md").exists():
            return candidate
        if (candidate / ".agent" / "workflows" / "AGENT_ENTRY.md").exists():
            return candidate
    raise RuntimeError(f"無法從 bounded orchestrator 推導 repo root: {start_dir}")


REPO_ROOT = _discover_repo_root(RUNTIME_SCRIPTS_DIR)
CANONICAL_STATIC_ROOT = REPO_ROOT / ".github" / "workflow-core"
LEGACY_STATIC_ROOT = REPO_ROOT / ".agent"
WORKFLOW_CORE_ROOT = CANONICAL_STATIC_ROOT if CANONICAL_STATIC_ROOT.exists() else LEGACY_STATIC_ROOT
SHARED_FILE = WORKFLOW_CORE_ROOT / "skills" / "_shared" / "__init__.py"

WORK_UNIT_HEADING = "### Bounded work unit contract"
EXECUTION_BLOCK_START = "<!-- EXECUTION_BLOCK_START -->"
EXECUTION_BLOCK_END = "<!-- EXECUTION_BLOCK_END -->"


def _load_shared_module():
    spec = importlib.util.spec_from_file_location("bounded_work_unit_shared", SHARED_FILE)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"無法載入 shared module: {SHARED_FILE}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


SHARED = _load_shared_module()
ALLOWED_CHECKS = SHARED.BOUNDED_WORK_UNIT_ALLOWED_CHECKS
BLOCKED_CHECKS = SHARED.BOUNDED_WORK_UNIT_BLOCKED_CHECKS

PASS_RESULTS = {"PASS", "PASS_WITH_RISK"}


def _coerce_int(value: Any, default: int = 0) -> int:
    if isinstance(value, int):
        return value
    if isinstance(value, str) and re.fullmatch(r"\d+", value.strip()):
        return int(value.strip())
    return default


def _is_placeholder(value: str) -> bool:
    stripped = value.strip()
    return stripped.startswith("[") and stripped.endswith("]")


def _extract_execution_block(content: str) -> str | None:
    if EXECUTION_BLOCK_START not in content or EXECUTION_BLOCK_END not in content:
        return None
    return content.split(EXECUTION_BLOCK_START, 1)[1].split(EXECUTION_BLOCK_END, 1)[0]


def _extract_field(block: str | None, field_name: str) -> str | None:
    if block is None:
        return None
    match = re.search(rf"^\s*{re.escape(field_name)}\s*(.+)$", block, flags=re.MULTILINE)
    if not match:
        return None
    return match.group(1).strip()


def _extract_markdown_section(content: str, heading: str, next_headings: List[str]) -> str:
    if heading not in content:
        return ""
    section = content.split(heading, 1)[1]
    end_positions = [section.find(next_heading) for next_heading in next_headings if next_heading in section]
    if end_positions:
        section = section[: min(position for position in end_positions if position >= 0)]
    return section


def _extract_list_items(section: str) -> List[str]:
    items: List[str] = []
    for raw_line in section.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        backtick_match = re.search(r"`([^`]+)`", line)
        if backtick_match:
            items.append(backtick_match.group(1).strip())
            continue
        bullet_match = re.match(r"^(?:-|\d+\.)\s+(.+)$", line)
        if bullet_match:
            items.append(bullet_match.group(1).strip())
    return items


def _extract_work_unit_yaml(content: str) -> str | None:
    if WORK_UNIT_HEADING not in content:
        return None
    following = content.split(WORK_UNIT_HEADING, 1)[1]
    match = re.search(r"```yaml\s*(.*?)```", following, flags=re.DOTALL)
    if match is None:
        return None
    return match.group(1).strip()


def _parse_work_unit_yaml(block: str) -> Dict[str, Any]:
    lines = [line.rstrip() for line in block.splitlines() if line.strip()]
    if not lines or lines[0].strip() != "work_unit:":
        raise ValueError("work_unit yaml block 必須以 work_unit: 開始")

    parsed: Dict[str, Any] = {}
    current_list_key: str | None = None
    key_indent: int | None = None
    list_indent: int | None = None

    for raw_line in lines[1:]:
        stripped = raw_line.lstrip()
        indent = len(raw_line) - len(stripped)

        if key_indent is None and ":" in stripped and not stripped.startswith("- "):
            key_indent = indent
            list_indent = indent + 2

        if key_indent is not None and indent == key_indent and ":" in stripped:
            key, value = stripped.split(":", 1)
            key = key.strip()
            value = value.strip()
            if value:
                parsed[key] = value
                current_list_key = None
            else:
                parsed[key] = []
                current_list_key = key
            continue

        if list_indent is not None and indent >= list_indent and stripped.startswith("- "):
            if current_list_key is None:
                raise ValueError("work_unit list item 缺少對應 key")
            parsed.setdefault(current_list_key, []).append(stripped[2:].strip())
            continue

        raise ValueError(f"無法解析 work_unit 行：{raw_line}")

    return parsed


def _parse_retry_budget(raw_value: str) -> int | None:
    if _is_placeholder(raw_value):
        return None
    if not re.fullmatch(r"\d+", raw_value):
        return None
    return int(raw_value)


def evaluate_loop_stop_conditions(
    work_unit: Dict[str, Any],
    orchestration_state: Dict[str, Any],
    *,
    modified_files: List[str] | None = None,
    new_security_trigger: bool = False,
    failure_signature: str | None = None,
) -> Dict[str, Any]:
    effective_scope = orchestration_state.get("effective_file_scope") or work_unit.get("file_scope", [])
    retry_budget = _coerce_int(work_unit.get("retry_budget"))
    retry_count = _coerce_int(orchestration_state.get("retry_count"))
    last_failure_signature = orchestration_state.get("last_failure_signature")
    modified_files = modified_files or []

    scope_break_files = [path for path in modified_files if path not in effective_scope]
    if scope_break_files:
        return {
            "action": "stop",
            "loop_exit_reason": "scope_break",
            "handoff": "coordinator",
            "scope_break_files": scope_break_files,
            "summary": "file_scope 外檔案被修改，必須 fail-closed 跳回外層",
        }

    if new_security_trigger:
        return {
            "action": "stop",
            "loop_exit_reason": "new_security_trigger",
            "handoff": "security_review",
            "scope_break_files": [],
            "summary": "命中新 security trigger，必須立即升級到外層 Security Review",
        }

    if retry_count >= retry_budget:
        return {
            "action": "stop",
            "loop_exit_reason": "retry_budget_exhausted",
            "handoff": "coordinator",
            "scope_break_files": [],
            "summary": "retry_budget 已用盡，不得再自動重跑",
        }

    if (
        failure_signature
        and last_failure_signature
        and failure_signature != last_failure_signature
    ):
        return {
            "action": "stop",
            "loop_exit_reason": "failure_signature_drift",
            "handoff": "coordinator",
            "scope_break_files": [],
            "summary": "failure signature drift，必須交回外層裁決",
        }

    return {
        "action": "continue",
        "loop_exit_reason": None,
        "handoff": None,
        "scope_break_files": [],
        "summary": "bounded loop 可在既有 contract 下繼續",
    }


def evaluate_reentry_policy(
    review_stage: str,
    review_result: str,
    work_unit: Dict[str, Any],
    orchestration_state: Dict[str, Any],
    *,
    findings_within_file_scope: bool,
    new_security_trigger: bool = False,
    failure_signature_drift: bool = False,
) -> Dict[str, Any]:
    normalized_stage = review_stage.strip().lower()
    normalized_result = review_result.strip().upper()
    retry_budget = _coerce_int(work_unit.get("retry_budget"))
    retry_count = _coerce_int(orchestration_state.get("retry_count"))
    budget_remaining = max(retry_budget - retry_count, 0)

    if normalized_stage not in {"qa", "security"}:
        raise ValueError(f"unsupported review stage: {review_stage}")
    if normalized_result not in PASS_RESULTS | {"FAIL"}:
        raise ValueError(f"unsupported review result: {review_result}")

    if normalized_result in PASS_RESULTS:
        return {
            "review_stage": normalized_stage,
            "review_result": normalized_result,
            "auto_rerun_allowed": False,
            "coordinator_redispatch_required": False,
            "same_work_unit_allowed": False,
            "carry_retry_budget": True,
            "requires_plan_gate": False,
            "must_create_new_work_unit": False,
            "budget_remaining": budget_remaining,
            "loop_exit_reason": "external_review_passed",
            "next_action": "proceed_to_next_external_gate",
        }

    decision = {
        "review_stage": normalized_stage,
        "review_result": normalized_result,
        "auto_rerun_allowed": False,
        "coordinator_redispatch_required": True,
        "same_work_unit_allowed": False,
        "carry_retry_budget": False,
        "requires_plan_gate": False,
        "must_create_new_work_unit": False,
        "budget_remaining": budget_remaining,
        "loop_exit_reason": None,
        "next_action": "return_to_coordinator",
    }

    if budget_remaining <= 0:
        decision.update(
            {
                "requires_plan_gate": True,
                "must_create_new_work_unit": True,
                "loop_exit_reason": "retry_budget_exhausted",
                "next_action": "return_to_plan_gate",
            }
        )
        return decision

    if not findings_within_file_scope:
        decision.update(
            {
                "requires_plan_gate": True,
                "must_create_new_work_unit": True,
                "loop_exit_reason": "scope_break",
                "next_action": "return_to_plan_gate",
            }
        )
        return decision

    if new_security_trigger:
        decision.update(
            {
                "requires_plan_gate": True,
                "must_create_new_work_unit": normalized_stage == "security",
                "loop_exit_reason": "new_security_trigger",
                "next_action": "return_to_security_review_gate" if normalized_stage == "qa" else "return_to_plan_gate",
            }
        )
        return decision

    if failure_signature_drift:
        decision.update(
            {
                "requires_plan_gate": True,
                "must_create_new_work_unit": True,
                "loop_exit_reason": "failure_signature_drift",
                "next_action": "return_to_plan_gate",
            }
        )
        return decision

    decision.update(
        {
            "same_work_unit_allowed": True,
            "carry_retry_budget": True,
            "loop_exit_reason": f"{normalized_stage}_fail_requires_coordinator_redispatch",
            "next_action": "coordinator_may_redispatch_same_work_unit",
        }
    )
    return decision


def build_orchestration_payload(plan_path: Path) -> Dict[str, Any]:
    result: Dict[str, Any] = {
        "status": "pass",
        "plan_path": str(plan_path),
        "format_errors": [],
        "summary": "bounded work unit orchestration payload ready",
    }

    if not plan_path.exists():
        return {
            "status": "error",
            "plan_path": str(plan_path),
            "format_errors": [f"plan file not found: {plan_path}"],
            "summary": "plan file not found",
        }

    content = plan_path.read_text(encoding="utf-8")
    if content.count("work_unit:") != 1:
        result["format_errors"].append("Plan 必須存在且僅存在一個 work_unit")

    execution_block = _extract_execution_block(content)
    executor_tool = _extract_field(execution_block, "executor_tool:")
    if executor_tool is None:
        result["format_errors"].append("EXECUTION_BLOCK 缺少 executor_tool")
    elif _is_placeholder(executor_tool):
        result["format_errors"].append("executor_tool 仍為 placeholder，尚未可執行")

    work_unit_yaml = _extract_work_unit_yaml(content)
    if work_unit_yaml is None:
        result["format_errors"].append("缺少可解析的 bounded work unit yaml block")
        result["status"] = "fail"
        result["summary"] = "bounded work unit orchestration payload invalid"
        return result

    try:
        work_unit = _parse_work_unit_yaml(work_unit_yaml)
    except ValueError as exc:
        result["format_errors"].append(str(exc))
        result["status"] = "fail"
        result["summary"] = "bounded work unit orchestration payload invalid"
        return result

    required_scalar_fields = ["work_unit_id", "goal", "retry_budget"]
    required_list_fields = ["allowed_checks", "file_scope", "done_criteria", "escalation_conditions"]

    for field_name in required_scalar_fields:
        value = work_unit.get(field_name)
        if not isinstance(value, str) or not value.strip() or _is_placeholder(value):
            result["format_errors"].append(f"work_unit scalar field invalid: {field_name}")

    for field_name in required_list_fields:
        value = work_unit.get(field_name)
        if not isinstance(value, list) or not value:
            result["format_errors"].append(f"work_unit list field invalid: {field_name}")
            continue
        if any(not isinstance(item, str) or not item.strip() or _is_placeholder(item) for item in value):
            result["format_errors"].append(f"work_unit list field contains placeholder or empty item: {field_name}")

    retry_budget = _parse_retry_budget(str(work_unit.get("retry_budget", "")))
    if retry_budget is None:
        result["format_errors"].append("retry_budget 必須是可執行的整數")
    elif retry_budget != 5:
        result["format_errors"].append("V1 retry_budget 必須固定為 5")

    file_whitelist = _extract_list_items(
        _extract_markdown_section(content, "### File whitelist", ["### Done 定義"])
    )
    if file_whitelist:
        for path in work_unit.get("file_scope", []):
            if path not in file_whitelist:
                result["format_errors"].append(f"file_scope 不在 File whitelist 中：{path}")

    max_rounds_section = _extract_markdown_section(content, "### Max rounds", ["---"])
    max_rounds_match = re.search(r"\*\*估計\*\*:\s*(\d+)", max_rounds_section)
    if max_rounds_match and retry_budget is not None and int(max_rounds_match.group(1)) != retry_budget:
        result["format_errors"].append("retry_budget 與 Max rounds 不一致")

    done_criteria = work_unit.get("done_criteria", [])
    if isinstance(done_criteria, list):
        lowered_done_criteria = [criterion.lower() for criterion in done_criteria]
        if not any("external review" in criterion for criterion in lowered_done_criteria):
            result["format_errors"].append("done_criteria 必須包含 ready for external review 語意")
        if not any("file_scope" in criterion or "outside file_scope" in criterion for criterion in lowered_done_criteria):
            result["format_errors"].append("done_criteria 必須包含 no file changes outside file_scope 語意")

    escalation_conditions = work_unit.get("escalation_conditions", [])
    if isinstance(escalation_conditions, list):
        lowered_escalations = [condition.lower() for condition in escalation_conditions]
        required_markers = ["scope break", "retry budget exhausted"]
        for marker in required_markers:
            if not any(marker in condition for condition in lowered_escalations):
                result["format_errors"].append(f"escalation_conditions 必須包含：{marker}")

    allowed_checks = work_unit.get("allowed_checks", [])
    allowed_check_commands: Dict[str, str] = {}
    if isinstance(allowed_checks, list):
        for token in allowed_checks:
            if token in BLOCKED_CHECKS:
                result["format_errors"].append(f"allowed_checks 命中 V1 blocked token: {token}")
                continue
            registry_meta = ALLOWED_CHECKS.get(token)
            if registry_meta is None:
                result["format_errors"].append(f"allowed_checks token 未登錄：{token}")
                continue
            if registry_meta.get("default_status") != "allowed":
                result["format_errors"].append(f"allowed_checks token 尚未在 V1 預設啟用：{token}")
                continue
            allowed_check_commands[token] = registry_meta["command"]

    if result["format_errors"]:
        result["status"] = "fail"
        result["summary"] = "bounded work unit orchestration payload invalid"
        return result

    orchestration_state = {
        "retry_count": 0,
        "last_failure_signature": None,
        "loop_exit_reason": None,
        "effective_file_scope": work_unit["file_scope"],
        "allowed_checks_ran": [],
    }

    engineer_prompt = "\n".join(
        [
            "Execute exactly one approved bounded work unit.",
            f"WORK_UNIT_ID={work_unit['work_unit_id']}",
            f"GOAL={work_unit['goal']}",
            f"RETRY_BUDGET={retry_budget}",
            f"ALLOWED_CHECKS={', '.join(work_unit['allowed_checks'])}",
            "FILE_SCOPE=",
            *[f"- {path}" for path in work_unit["file_scope"]],
            "DONE_CRITERIA=",
            *[f"- {criterion}" for criterion in work_unit["done_criteria"]],
            "ESCALATION_CONDITIONS=",
            *[f"- {condition}" for condition in work_unit["escalation_conditions"]],
            "Only modify files inside FILE_SCOPE.",
            "Only run canonical checks mapped from ALLOWED_CHECKS.",
            "If retry budget is exhausted, a new security trigger appears, file_scope is exceeded, or failure signature drifts, stop and return control to Coordinator.",
            "If DONE_CRITERIA is met, stop and hand off to external Security Review / QA.",
        ]
    )

    result.update(
        {
            "executor_tool": executor_tool,
            "bounded_loop_enabled": True,
            "work_unit": {
                **work_unit,
                "retry_budget": retry_budget,
            },
            "allowed_check_commands": allowed_check_commands,
            "orchestration_state": orchestration_state,
            "engineer_prompt": engineer_prompt,
        }
    )
    return result


def main(argv: List[str] | None = None) -> int:
    args = argv or sys.argv
    if len(args) < 2:
        print(
            json.dumps(
                {
                    "status": "error",
                    "plan_path": "",
                    "format_errors": ["missing_plan_path"],
                    "summary": "缺少 Plan 檔案路徑參數",
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 2

    result = build_orchestration_payload(Path(args[1]))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result["status"] == "pass":
        return 0
    if result["status"] == "fail":
        return 1
    return 2


__all__ = [
    "build_orchestration_payload",
    "evaluate_loop_stop_conditions",
    "evaluate_reentry_policy",
    "main",
]


if __name__ == "__main__":
    raise SystemExit(main())
