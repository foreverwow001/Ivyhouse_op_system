#!/usr/bin/env python3
"""檔案用途：檢查 one-shot reviewer CLI 是否可作為預設 QA / Security Review 路徑使用。"""

from __future__ import annotations

import argparse
import json
import os
import shutil
from pathlib import Path
from typing import Any


SCRIPT_PATH = Path(__file__).resolve()


def detect_runtime_surface() -> str:
    parts = SCRIPT_PATH.parts
    if ".github" in parts and "workflow-core" in parts:
        return "canonical"
    return "unknown"


def load_workspace_settings(repo_root: Path) -> dict[str, Any]:
    settings_file = repo_root / ".vscode" / "settings.json"
    if not settings_file.exists():
        return {}

    cleaned_lines: list[str] = []
    for line in settings_file.read_text(encoding="utf-8", errors="ignore").splitlines():
        if line.lstrip().startswith("//"):
            continue
        cleaned_lines.append(line)

    try:
        payload = json.loads("\n".join(cleaned_lines))
    except json.JSONDecodeError:
        return {}
    return payload if isinstance(payload, dict) else {}


def resolve_reviewer_command(repo_root: Path) -> str:
    settings = load_workspace_settings(repo_root)
    value = settings.get("ivyhouseReviewerCli.command")
    if isinstance(value, str) and value.strip():
        return value.strip()
    return "copilot"


def resolve_allowed_commands(repo_root: Path) -> list[str]:
    settings = load_workspace_settings(repo_root)
    raw_value = settings.get("ivyhouseReviewerCli.allowedCommands")
    if isinstance(raw_value, list):
        normalized = [str(item).strip() for item in raw_value if str(item).strip()]
        if normalized:
            return normalized
    return ["copilot"]


def resolve_pinned_command_path(repo_root: Path) -> str | None:
    settings = load_workspace_settings(repo_root)
    value = settings.get("ivyhouseReviewerCli.pinnedCommandPath")
    if isinstance(value, str) and value.strip():
        return str(Path(value.strip()).expanduser())
    return None


def run_reviewer_cli_preflight(repo_root: Path) -> dict[str, Any]:
    command = resolve_reviewer_command(repo_root)
    allowed_commands = resolve_allowed_commands(repo_root)
    pinned_command_path = resolve_pinned_command_path(repo_root)
    command_path = shutil.which(command)
    command_available = command_path is not None
    runtime_surface = detect_runtime_surface()

    command_allowed = command in allowed_commands
    resolved_command_path = str(Path(command_path).resolve()) if command_path else None
    pinned_path_matches = True
    normalized_pinned_path = None
    if pinned_command_path:
        normalized_pinned_path = str(Path(pinned_command_path).resolve())
        pinned_path_matches = resolved_command_path == normalized_pinned_path

    status = "ready" if command_available and command_allowed and pinned_path_matches else "failed"
    warnings: list[str] = []
    if not command_available:
        warnings.append("reviewer_cli_command_missing")
    if not command_allowed:
        warnings.append("reviewer_cli_command_not_allowlisted")
    if pinned_command_path and not pinned_path_matches:
        warnings.append("reviewer_cli_command_path_mismatch")

    return {
        "status": status,
        "repo_root": str(repo_root),
        "command": command,
        "allowed_commands": allowed_commands,
        "command_available": command_available,
        "command_path": command_path,
        "resolved_command_path": resolved_command_path,
        "command_allowed": command_allowed,
        "pinned_command_path": normalized_pinned_path,
        "pinned_path_matches": pinned_path_matches,
        "runtime_surface": runtime_surface,
        "script_path": str(SCRIPT_PATH),
        "warnings": warnings,
        "notes": [
            "預設 reviewer 路徑要求 fresh one-shot session；請勿重用長互動 session。",
            "若 QA / Security Review 需要不同模型家族，請在 Copilot CLI 或對應 wrapper 設定中切換，而不是沿用 Engineer 的聊天上下文。",
            "hardening 啟用後，reviewer command 必須同時通過 allowlist 與 pinned path 驗證。",
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
