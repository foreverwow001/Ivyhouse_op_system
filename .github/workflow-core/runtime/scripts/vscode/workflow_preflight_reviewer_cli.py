#!/usr/bin/env python3
"""檔案用途：檢查 one-shot reviewer CLI 是否可作為預設 QA / Security / Domain Review 路徑使用。"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


SCRIPT_PATH = Path(__file__).resolve()
CANONICAL_WRAPPER_RELATIVE_PATH = Path(".github") / "workflow-core" / "runtime" / "scripts" / "vscode" / "copilot_cli_one_shot_reviewer.py"
DEFAULT_REVIEWER_COMMAND = "copilot"
ALLOWED_REVIEWER_COMMANDS = [DEFAULT_REVIEWER_COMMAND]
PINNED_COMMAND_PATH_ENV = "IVYHOUSE_REVIEWER_CLI_PINNED_COMMAND_PATH"
REVIEWER_COMMAND_ENV = "IVYHOUSE_REVIEWER_CLI_COMMAND"
SMOKE_ROLE = "domain"
SMOKE_TIMEOUT_SECONDS = 90
SMOKE_SUBPROCESS_GRACE_SECONDS = 10


def truncate_text(raw_value: str | None, limit: int = 800) -> str | None:
    if raw_value is None:
        return None
    collapsed = raw_value.strip()
    if len(collapsed) <= limit:
        return collapsed
    return f"{collapsed[:limit]}...<truncated>"


def detect_runtime_surface() -> str:
    parts = SCRIPT_PATH.parts
    if ".github" in parts and "workflow-core" in parts:
        return "canonical"
    return "unknown"


def path_is_within(parent: Path, candidate: Path) -> bool:
    try:
        candidate.relative_to(parent)
    except ValueError:
        return False
    return True


def resolve_reviewer_command() -> str:
    value = os.environ.get(REVIEWER_COMMAND_ENV, DEFAULT_REVIEWER_COMMAND).strip()
    return value or DEFAULT_REVIEWER_COMMAND


def resolve_allowed_commands() -> list[str]:
    return list(ALLOWED_REVIEWER_COMMANDS)


def resolve_pinned_command_path() -> str | None:
    value = os.environ.get(PINNED_COMMAND_PATH_ENV)
    if isinstance(value, str) and value.strip():
        return str(Path(value.strip()).expanduser())
    return None


def resolve_wrapper_path(repo_root: Path) -> Path:
    return (repo_root / CANONICAL_WRAPPER_RELATIVE_PATH).resolve()


def build_behavioral_smoke_package() -> str:
    return """## Task Summary

- reviewer behavioral smoke for one-shot domain surface

## Domain Scope

- verify repo-native reviewer wrapper can return a complete domain review in one fresh session

## Authoritative Inputs

- .github/instructions/reviewer-packages.instructions.md
- .github/agents/ivy-domain-expert.agent.md

## Spec or Plan Summary

- this is a tooling smoke test; if no domain-specific risk is implied, return `N/A` conservatively while preserving all required sections
"""


def run_behavioral_smoke(repo_root: Path, wrapper_path: Path, command: str) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix=".ivy-reviewer-smoke-", dir=repo_root) as temp_dir:
        package_file = Path(temp_dir) / "domain-review-package.md"
        package_file.write_text(build_behavioral_smoke_package(), encoding="utf-8")

        smoke_command = [
            sys.executable,
            str(wrapper_path),
            "--role",
            SMOKE_ROLE,
            "--package-file",
            str(package_file),
            "--repo-root",
            str(repo_root),
            "--copilot-command",
            command,
            "--timeout-seconds",
            str(SMOKE_TIMEOUT_SECONDS),
        ]

        try:
            result = subprocess.run(
                smoke_command,
                cwd=repo_root,
                text=True,
                capture_output=True,
                check=False,
                timeout=SMOKE_TIMEOUT_SECONDS + SMOKE_SUBPROCESS_GRACE_SECONDS,
            )
        except subprocess.TimeoutExpired as exc:
            return {
                "status": "failed",
                "role": SMOKE_ROLE,
                "timeout_seconds": SMOKE_TIMEOUT_SECONDS,
                "reason": "behavioral_smoke_timeout",
                "command": smoke_command,
                "stdout_excerpt": truncate_text(exc.stdout),
                "stderr_excerpt": truncate_text(exc.stderr),
            }

    return {
        "status": "passed" if result.returncode == 0 else "failed",
        "role": SMOKE_ROLE,
        "timeout_seconds": SMOKE_TIMEOUT_SECONDS,
        "reason": None if result.returncode == 0 else "behavioral_smoke_failed",
        "command": smoke_command,
        "exit_code": result.returncode,
        "stdout_excerpt": truncate_text(result.stdout),
        "stderr_excerpt": truncate_text(result.stderr),
    }


def run_reviewer_cli_preflight(repo_root: Path) -> dict[str, Any]:
    command = resolve_reviewer_command()
    allowed_commands = resolve_allowed_commands()
    pinned_command_path = resolve_pinned_command_path()
    wrapper_path = resolve_wrapper_path(repo_root)
    command_path = shutil.which(command)
    command_available = command_path is not None
    wrapper_exists = wrapper_path.exists()
    wrapper_is_file = wrapper_path.is_file()
    wrapper_is_symlink = wrapper_path.is_symlink()
    runtime_surface = detect_runtime_surface()

    command_allowed = Path(command).name in allowed_commands
    resolved_command_path = str(Path(command_path).resolve()) if command_path else None
    command_outside_workspace = bool(resolved_command_path) and not path_is_within(repo_root, Path(resolved_command_path))
    pinned_path_matches = True
    normalized_pinned_path = None
    if pinned_command_path:
        normalized_pinned_path = str(Path(pinned_command_path).resolve())
        pinned_path_matches = resolved_command_path == normalized_pinned_path

    behavioral_smoke: dict[str, Any] | None = None
    behavioral_smoke_passed = False
    if command_available and command_allowed and command_outside_workspace and pinned_path_matches and wrapper_exists and wrapper_is_file and not wrapper_is_symlink:
        behavioral_smoke = run_behavioral_smoke(repo_root, wrapper_path, command)
        behavioral_smoke_passed = behavioral_smoke["status"] == "passed"

    status = "ready" if command_available and command_allowed and command_outside_workspace and pinned_path_matches and wrapper_exists and wrapper_is_file and not wrapper_is_symlink and behavioral_smoke_passed else "failed"
    warnings: list[str] = []
    if not command_available:
        warnings.append("reviewer_cli_command_missing")
    if not command_allowed:
        warnings.append("reviewer_cli_command_not_allowlisted")
    if command_available and not command_outside_workspace:
        warnings.append("reviewer_cli_command_in_workspace")
    if pinned_command_path and not pinned_path_matches:
        warnings.append("reviewer_cli_command_path_mismatch")
    if not wrapper_exists:
        warnings.append("reviewer_wrapper_missing")
    if wrapper_exists and not wrapper_is_file:
        warnings.append("reviewer_wrapper_not_a_file")
    if wrapper_is_symlink:
        warnings.append("reviewer_wrapper_symlink_rejected")
    if behavioral_smoke and not behavioral_smoke_passed:
        warnings.append(str(behavioral_smoke.get("reason") or "behavioral_smoke_failed"))

    return {
        "status": status,
        "repo_root": str(repo_root),
        "command": command,
        "allowed_commands": allowed_commands,
        "command_available": command_available,
        "command_path": command_path,
        "resolved_command_path": resolved_command_path,
        "command_outside_workspace": command_outside_workspace,
        "wrapper_path": str(wrapper_path),
        "wrapper_exists": wrapper_exists,
        "wrapper_is_file": wrapper_is_file,
        "wrapper_is_symlink": wrapper_is_symlink,
        "command_allowed": command_allowed,
        "pinned_command_path": normalized_pinned_path,
        "pinned_path_matches": pinned_path_matches,
        "behavioral_smoke": behavioral_smoke,
        "runtime_surface": runtime_surface,
        "script_path": str(SCRIPT_PATH),
        "configuration_source": "env_or_safe_defaults",
        "warnings": warnings,
        "notes": [
            "預設 reviewer 路徑要求 fresh one-shot session；請勿重用長互動 session。",
            "若 QA / Security Review 需要不同模型家族，請在 Copilot CLI 或對應 wrapper 設定中切換，而不是沿用 Engineer 的聊天上下文。",
            "hardening 啟用後，reviewer command 必須同時通過 allowlist、workspace 外部路徑、pinned path 與 behavioral smoke 驗證。",
            "workspace 內的 .vscode/settings.json 不再作為 reviewer command 或 wrapper path 的信任來源。",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path.cwd(), help="Repo 根目錄（預設：目前目錄）")
    parser.add_argument("--json", action="store_true", help="輸出 JSON")
    args = parser.parse_args()

    result = run_reviewer_cli_preflight(args.repo_root.resolve())
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"reviewer_cli_preflight: {result['status']}")
        print(f"command: {result['command']}")
        print(f"command_path: {result['command_path']}")
        for note in result["notes"]:
            print(f"- {note}")
    return 0 if result["status"] == "ready" else 1


if __name__ == "__main__":
    raise SystemExit(main())
