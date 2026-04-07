#!/usr/bin/env python3
"""檔案用途：以 fresh one-shot Copilot CLI session 執行 QA / Security Reviewer 固定輸入包。"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


ROLE_PROMPTS = {
    "qa": """你現在是 Ivy QA Reviewer。\n請以 read-only reviewer 身分審查提供的 package。\n只輸出 QA 結論，不要修改檔案，不要要求進入長互動模式。\n輸出格式必須包含：Task Summary、Expected Behavior、Changed Files or Diff、Validation Evidence、Open Risks / Known Gaps、Decision。""",
    "security": """你現在是 Ivy Security Reviewer。\n請以 read-only reviewer 身分審查提供的 package。\n重點放在 trust boundary、攻擊面、可利用路徑與修補建議。\n不要修改檔案，不要要求進入長互動模式。\n輸出格式必須包含：Task Summary、Trust Boundary / Attack Surface、Changed Files or Diff、Validation Evidence、Secrets / Permissions Notes、Known Security Concerns、Decision。""",
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--role", choices=sorted(ROLE_PROMPTS.keys()), required=True, help="reviewer 角色：qa 或 security")
    parser.add_argument("--package-file", type=Path, required=True, help="review package 檔案路徑")
    parser.add_argument("--repo-root", type=Path, default=Path.cwd(), help="repo 根目錄（預設：目前目錄）")
    parser.add_argument("--copilot-command", default="copilot", help="底層 Copilot CLI 指令（預設：copilot）")
    parser.add_argument("--model", default=None, help="可選：指定 reviewer model")
    parser.add_argument("--agent", default=None, help="可選：指定 reviewer agent")
    parser.add_argument("--output-file", type=Path, default=None, help="可選：將 reviewer 輸出寫入檔案")
    parser.add_argument("--output-format", choices=["text", "json"], default="text", help="輸出格式")
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


def build_command(args: argparse.Namespace, prompt: str) -> list[str]:
    command = [
        args.copilot_command,
        "--prompt",
        prompt,
        "--allow-all-tools",
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


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    package_file = args.package_file.resolve()
    package_text = package_file.read_text(encoding="utf-8")
    prompt = build_prompt(args.role, package_text)
    command = build_command(args, prompt)

    if args.dry_run:
        print(
            json.dumps(
                {
                    "status": "dry-run",
                    "role": args.role,
                    "package_file": str(package_file),
                    "repo_root": str(args.repo_root.resolve()),
                    "command": command,
                    "prompt": prompt,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0

    result = subprocess.run(
        command,
        cwd=args.repo_root.resolve(),
        text=True,
        capture_output=True,
        check=False,
    )

    if args.output_file:
        args.output_file.parent.mkdir(parents=True, exist_ok=True)
        args.output_file.write_text(result.stdout, encoding="utf-8")

    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
