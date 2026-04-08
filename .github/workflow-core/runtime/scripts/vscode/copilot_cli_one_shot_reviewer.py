#!/usr/bin/env python3
"""檔案用途：以 fresh one-shot Copilot CLI session 執行 QA / Security Reviewer 固定輸入包。"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path


ROLE_PROMPTS = {
    "qa": """你現在是 Ivy QA Reviewer。\n請以 read-only reviewer 身分審查提供的 package。\n只輸出 QA 結論，不要修改檔案，不要要求進入長互動模式。\n輸出格式必須包含：Task Summary、Expected Behavior、Changed Files or Diff、Validation Evidence、Open Risks / Known Gaps、Decision。""",
    "security": """你現在是 Ivy Security Reviewer。\n請以 read-only reviewer 身分審查提供的 package。\n重點放在 trust boundary、攻擊面、可利用路徑與修補建議。\n不要修改檔案，不要要求進入長互動模式。\n輸出格式必須包含：Task Summary、Trust Boundary / Attack Surface、Changed Files or Diff、Validation Evidence、Secrets / Permissions Notes、Known Security Concerns、Decision。""",
    "domain": """你現在是 Ivy Domain Expert。\n請以 read-only reviewer 身分審查提供的 package。\n重點放在主資料治理、流程狀態、RBAC、共享資料與財務一致性。\n不要修改檔案，不要要求進入長互動模式。\n若本輪不涉及特定 domain hard review，請保守回覆 N/A。\n輸出格式必須包含：Domain Findings、Missing Preconditions or Docs、Recommendations、Contract Boundary、Domain Verdict。""",
}


REQUIRED_OUTPUT_SECTIONS = {
    "qa": [
        "Task Summary",
        "Expected Behavior",
        "Changed Files or Diff",
        "Validation Evidence",
        "Open Risks / Known Gaps",
        "Decision",
    ],
    "security": [
        "Task Summary",
        "Trust Boundary / Attack Surface",
        "Changed Files or Diff",
        "Validation Evidence",
        "Secrets / Permissions Notes",
        "Known Security Concerns",
        "Decision",
    ],
    "domain": [
        "Domain Findings",
        "Missing Preconditions or Docs",
        "Recommendations",
        "Contract Boundary",
        "Domain Verdict",
    ],
}

ALLOWED_COPILOT_COMMANDS = {"copilot"}
PINNED_COMMAND_PATH_ENV = "IVYHOUSE_REVIEWER_CLI_PINNED_COMMAND_PATH"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--role", choices=sorted(ROLE_PROMPTS.keys()), required=True, help="reviewer 角色：qa、security 或 domain")
    parser.add_argument("--package-file", type=Path, required=True, help="review package 檔案路徑")
    parser.add_argument("--repo-root", type=Path, default=Path.cwd(), help="repo 根目錄（預設：目前目錄）")
    parser.add_argument("--copilot-command", default="copilot", help="底層 Copilot CLI 指令（預設：copilot）")
    parser.add_argument("--model", default=None, help="可選：指定 reviewer model")
    parser.add_argument("--agent", default=None, help="可選：指定 reviewer agent")
    parser.add_argument("--output-file", type=Path, default=None, help="可選：將 reviewer 輸出寫入檔案")
    parser.add_argument("--output-format", choices=["text", "json"], default="text", help="輸出格式")
    parser.add_argument("--timeout-seconds", type=int, default=90, help="one-shot reviewer timeout 秒數（預設：90）")
    parser.add_argument("--dry-run", action="store_true", help="只輸出將執行的 prompt 與 command，不真正呼叫 Copilot CLI")
    return parser


def build_prompt(role: str, package_text: str) -> str:
    reviewer_header = ROLE_PROMPTS[role]
    return (
        f"{reviewer_header}\n\n"
        "以下是本次 one-shot review package。\n"
        "請直接根據 package 產出最終 reviewer output。\n"
        "若 package 已指出某些 validation blocked，請只根據現有證據評估，不要要求額外互動。\n\n"
        "=== REVIEW PACKAGE START ===\n"
        f"{package_text.strip()}\n"
        "=== REVIEW PACKAGE END ===\n"
    )


def build_command(resolved_copilot_command: str, args: argparse.Namespace, prompt: str) -> list[str]:
    command = [
        resolved_copilot_command,
        "--prompt",
        prompt,
        "--no-ask-user",
        "--silent",
        "--output-format",
        args.output_format,
    ]
    if args.model:
        command.extend(["--model", args.model])
    if args.agent:
        command.extend(["--agent", args.agent])
    return command


def collect_review_text_candidates(payload: object) -> list[str]:
    if isinstance(payload, str):
        return [payload]

    if isinstance(payload, list):
        fragments: list[str] = []
        for item in payload:
            fragments.extend(collect_review_text_candidates(item))
        return fragments

    if isinstance(payload, dict):
        fragments: list[str] = []
        for key in ("content", "text", "message", "output", "response", "result", "body", "final"):
            if key in payload:
                fragments.extend(collect_review_text_candidates(payload[key]))
        return fragments

    return []


def normalize_output_for_validation(raw_output: str) -> str:
    candidate = raw_output.strip()
    if not candidate:
        return ""

    try:
        payload = json.loads(candidate)
    except json.JSONDecodeError:
        return candidate

    fragments = collect_review_text_candidates(payload)
    if not fragments:
        return ""

    return "\n".join(fragment.strip() for fragment in fragments if fragment).strip()


def find_section_position(output_text: str, section: str, search_start: int) -> int:
    pattern = re.compile(
        rf"(?mi)^\s{{0,3}}(?:#+\s*)?{re.escape(section)}(?:\s*[:：])?\s*$"
    )
    match = pattern.search(output_text, search_start)
    return -1 if match is None else match.start()


def find_missing_sections(role: str, raw_output: str) -> list[str]:
    output_text = normalize_output_for_validation(raw_output)
    if not output_text:
        return REQUIRED_OUTPUT_SECTIONS[role]

    missing_sections: list[str] = []
    search_start = 0
    for section in REQUIRED_OUTPUT_SECTIONS[role]:
        position = find_section_position(output_text, section, search_start)
        if position == -1:
            missing_sections.append(section)
            continue
        search_start = position + len(section)
    return missing_sections


def path_is_within(parent: Path, candidate: Path) -> bool:
    try:
        candidate.relative_to(parent)
    except ValueError:
        return False
    return True


def resolve_repo_relative_path(path_value: Path, repo_root: Path) -> Path:
    candidate = path_value.expanduser()
    if not candidate.is_absolute():
        candidate = repo_root / candidate
    return candidate.resolve()


def resolve_pinned_command_path() -> Path | None:
    value = os.environ.get(PINNED_COMMAND_PATH_ENV)
    if not isinstance(value, str) or not value.strip():
        return None
    return Path(value.strip()).expanduser().resolve()


def validate_package_file(package_file: Path, repo_root: Path) -> tuple[Path | None, str | None]:
    resolved_package_file = resolve_repo_relative_path(package_file, repo_root)
    if not path_is_within(repo_root, resolved_package_file):
        return None, f"reviewer wrapper rejected package file outside repo root: {resolved_package_file}"
    if not resolved_package_file.exists():
        return None, f"reviewer wrapper package file does not exist: {resolved_package_file}"
    if not resolved_package_file.is_file():
        return None, f"reviewer wrapper package file is not a file: {resolved_package_file}"
    return resolved_package_file, None


def validate_output_file(output_file: Path | None, repo_root: Path) -> tuple[Path | None, str | None]:
    if output_file is None:
        return None, None

    resolved_output_file = resolve_repo_relative_path(output_file, repo_root)
    if not path_is_within(repo_root, resolved_output_file):
        return None, f"reviewer wrapper rejected output file outside repo root: {resolved_output_file}"
    if resolved_output_file.exists() and not resolved_output_file.is_file():
        return None, f"reviewer wrapper output file path is not a file: {resolved_output_file}"
    return resolved_output_file, None


def validate_copilot_command(command: str, repo_root: Path, pinned_command_path: Path | None) -> tuple[str | None, str | None]:
    command_name = Path(command).name
    if command_name not in ALLOWED_COPILOT_COMMANDS:
        return None, f"reviewer wrapper rejected unsupported copilot command: {command_name}"

    resolved_command = shutil.which(command)
    if not resolved_command:
        return None, f"reviewer wrapper could not resolve copilot command: {command}"

    resolved_path = Path(resolved_command).resolve()
    if path_is_within(repo_root.resolve(), resolved_path):
        return None, f"reviewer wrapper rejected workspace-local copilot command: {resolved_path}"

    if pinned_command_path and resolved_path != pinned_command_path:
        return None, (
            "reviewer wrapper rejected copilot command path mismatch: "
            f"resolved={resolved_path} pinned={pinned_command_path}"
        )

    return str(resolved_path), None


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    pinned_command_path = resolve_pinned_command_path()

    resolved_command_path, command_error = validate_copilot_command(args.copilot_command, repo_root, pinned_command_path)
    if command_error:
        print(command_error, file=sys.stderr)
        return 1

    package_file, package_file_error = validate_package_file(args.package_file, repo_root)
    if package_file_error:
        print(package_file_error, file=sys.stderr)
        return 1

    output_file, output_file_error = validate_output_file(args.output_file, repo_root)
    if output_file_error:
        print(output_file_error, file=sys.stderr)
        return 1

    package_text = package_file.read_text(encoding="utf-8")
    prompt = build_prompt(args.role, package_text)
    command = build_command(resolved_command_path, args, prompt)

    if args.dry_run:
        print(
            json.dumps(
                {
                    "status": "dry-run",
                    "role": args.role,
                    "package_file": str(package_file),
                    "repo_root": str(repo_root),
                    "output_file": str(output_file) if output_file else None,
                    "resolved_copilot_command": resolved_command_path,
                    "pinned_copilot_command": str(pinned_command_path) if pinned_command_path else None,
                    "command": command,
                    "prompt": prompt,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0

    try:
        result = subprocess.run(
            command,
            cwd=repo_root,
            text=True,
            capture_output=True,
            check=False,
            timeout=args.timeout_seconds,
        )
    except subprocess.TimeoutExpired as exc:
        timeout_stdout = exc.stdout or ""
        if output_file and timeout_stdout:
            output_file.parent.mkdir(parents=True, exist_ok=True)
            output_file.write_text(timeout_stdout, encoding="utf-8")
        if timeout_stdout:
            print(timeout_stdout, end="")
        print(f"reviewer wrapper timeout after {args.timeout_seconds}s", file=sys.stderr)
        return 1

    if output_file and result.stdout:
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_text(result.stdout, encoding="utf-8")

    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)

    if result.returncode != 0:
        return result.returncode

    if not result.stdout.strip():
        print("reviewer wrapper produced empty output", file=sys.stderr)
        return 1

    missing_sections = find_missing_sections(args.role, result.stdout)
    if missing_sections:
        joined_sections = ", ".join(missing_sections)
        print(f"reviewer wrapper output missing required sections: {joined_sections}", file=sys.stderr)
        return 1

    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
