# -*- coding: utf-8 -*-
"""
.github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py
=====================================
用途：代碼品質審查工具
職責：靜態分析 Python 檔案，檢查 API Key 洩漏、檔案長度、中文註釋等
=====================================

使用方式：
    python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <file_path>
    python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <directory_path>
    python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <diff_file> [project_root]
    python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py git diff --staged [project_root]
    python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py git diff --cached [project_root]
    python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py git diff <base>..<head> [project_root]
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List


SKILLS_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from code_reviewer_rules import (
    build_issue,
    build_summary,
    build_target_status,
    build_target_summary,
    check_api_key_leak,
    check_ast_quality,
    check_chinese_comments,
    check_file_length,
    check_line_style,
)

CRITICAL_ISSUE_TYPES = {"api_key_leak", "syntax_error"}
GIT_DIFF_RANGE_PATTERN = re.compile(r"^[A-Za-z0-9._/@:^~-]+\.\.\.?[A-Za-z0-9._/@:^~-]+$")


def validate_output_schema(result: Dict[str, Any], skill_name: str) -> Dict[str, Any]:
    """可選 JSON Schema 驗證（graceful degradation）"""
    try:
        import jsonschema
    except ImportError:
        return result

    schema_path = SKILLS_ROOT / "schemas" / f"{skill_name}_output.schema.json"
    if not schema_path.exists():
        return result

    try:
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        jsonschema.validate(result, schema)
        return result
    except jsonschema.ValidationError as exc:
        result["validation_errors"] = [
            {
                "message": exc.message,
                "path": list(exc.path),
                "schema_path": list(exc.schema_path),
            }
        ]
        result.setdefault(
            "suggestion",
            f"輸出格式不符合 schema 規範。請檢查 {skill_name}_output.schema.json 並確認欄位正確性。",
        )
        return result
    except Exception:
        return result


def find_similar_files(target_path: str, project_root: str = ".") -> List[str]:
    """找出與目標檔名相似的檔案（用於錯誤建議）"""
    import difflib

    target_name = Path(target_path).name
    root = Path(project_root)
    all_py_files = [str(p) for p in root.rglob("*.py")]
    all_file_names = [Path(p).name for p in all_py_files]

    similar = difflib.get_close_matches(target_name, all_file_names, n=5, cutoff=0.6)
    similar_paths = [p for p in all_py_files if Path(p).name in similar]
    return similar_paths[:5]




def validate_git_diff_range(diff_range: str) -> bool:
    return bool(GIT_DIFF_RANGE_PATTERN.fullmatch(diff_range.strip()))


def list_python_files(directory_path: str) -> List[str]:
    directory = Path(directory_path)
    if not directory.exists() or not directory.is_dir():
        return []
    return [str(path) for path in sorted(directory.rglob("*.py")) if path.is_file()]


def review_diff_text(diff_text: str, target_label: str, project_root: str = ".", diff_source: str = "file") -> Dict[str, Any]:
    extracted = extract_python_files_from_diff(diff_text, project_root)
    python_files = extracted["files"]
    if not python_files:
        return {
            "status": "error",
            "target": target_label,
            "target_type": "diff",
            "project_root": str(Path(project_root).resolve()),
            "diff_source": diff_source,
            "message": "diff 中找不到可審查的 Python 檔案",
            "issues": [],
            "results": [],
            "skipped_targets": extracted["skipped"],
            "usage": "python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <diff_file> [project_root]",
        }

    results = [review_file(file_path) for file_path in python_files]
    return {
        "status": build_target_status(results),
        "target": target_label,
        "target_type": "diff",
        "project_root": str(Path(project_root).resolve()),
        "diff_source": diff_source,
        "files_reviewed": len(results),
        "files_with_issues": sum(1 for result in results if result.get("issues")),
        "results": results,
        "summary": build_target_summary(results),
        "skipped_targets": extracted["skipped"],
    }


def run_git_diff_command(git_diff_args: List[str], project_root: str = ".") -> Dict[str, Any]:
    root = Path(project_root).resolve()
    if not root.exists() or not root.is_dir():
        return {
            "status": "error",
            "target": "git diff",
            "target_type": "diff",
            "project_root": str(root),
            "message": f"project_root 不存在或不是目錄：{project_root}",
            "issues": [],
            "results": [],
        }

    target_label = f"git diff {' '.join(git_diff_args)}".strip()
    try:
        completed = subprocess.run(
            ["git", "--no-pager", "diff", "--no-color", *git_diff_args],
            cwd=root,
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "target": target_label,
            "target_type": "diff",
            "project_root": str(root),
            "message": "git diff 執行逾時",
            "issues": [],
            "results": [],
        }
    except Exception as exc:
        return {
            "status": "error",
            "target": target_label,
            "target_type": "diff",
            "project_root": str(root),
            "message": f"git diff 執行失敗：{exc}",
            "issues": [],
            "results": [],
        }

    if completed.returncode != 0:
        message = completed.stderr.strip() or completed.stdout.strip() or f"git diff 失敗，exit code={completed.returncode}"
        return {
            "status": "error",
            "target": target_label,
            "target_type": "diff",
            "project_root": str(root),
            "message": message,
            "issues": [],
            "results": [],
        }

    return {
        "status": "success",
        "target": target_label,
        "target_type": "diff",
        "project_root": str(root),
        "diff_text": completed.stdout,
    }


def review_staged_diff(project_root: str = ".") -> Dict[str, Any]:
    diff_result = run_git_diff_command(["--staged"], project_root)
    if diff_result.get("status") != "success":
        return diff_result
    return review_diff_text(
        diff_result["diff_text"],
        target_label="git diff --staged",
        project_root=project_root,
        diff_source="git-command",
    )


def review_cached_diff(project_root: str = ".") -> Dict[str, Any]:
    diff_result = run_git_diff_command(["--cached"], project_root)
    if diff_result.get("status") != "success":
        return diff_result
    return review_diff_text(
        diff_result["diff_text"],
        target_label="git diff --cached",
        project_root=project_root,
        diff_source="git-command",
    )


def review_git_diff_range(diff_range: str, project_root: str = ".") -> Dict[str, Any]:
    if not validate_git_diff_range(diff_range):
        return {
            "status": "error",
            "target": f"git diff {diff_range}",
            "target_type": "diff",
            "project_root": str(Path(project_root).resolve()),
            "message": f"不支援的 git diff 範圍格式：{diff_range}",
            "issues": [],
            "results": [],
            "usage": "python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py git diff <base>..<head> [project_root]",
        }

    diff_result = run_git_diff_command([diff_range], project_root)
    if diff_result.get("status") != "success":
        return diff_result
    return review_diff_text(
        diff_result["diff_text"],
        target_label=f"git diff {diff_range}",
        project_root=project_root,
        diff_source="git-command",
    )


def extract_python_files_from_diff(diff_text: str, project_root: str = ".") -> Dict[str, List[str]]:
    root = Path(project_root).resolve()
    candidates: List[str] = []
    skipped: List[str] = []

    for line in diff_text.splitlines():
        if not line.startswith("+++ "):
            continue

        raw_path = line[4:].strip()
        if raw_path == "/dev/null":
            continue
        if raw_path.startswith("b/"):
            raw_path = raw_path[2:]
        if not raw_path.endswith(".py"):
            continue

        resolved = (root / raw_path).resolve()
        if not resolved.is_relative_to(root) or not resolved.exists() or not resolved.is_file():
            skipped.append(raw_path)
            continue
        candidates.append(str(resolved))

    unique_candidates = list(dict.fromkeys(candidates))
    unique_skipped = list(dict.fromkeys(skipped))
    return {"files": unique_candidates, "skipped": unique_skipped}


def review_directory(directory_path: str) -> Dict[str, Any]:
    python_files = list_python_files(directory_path)
    if not python_files:
        return {
            "status": "error",
            "target": directory_path,
            "target_type": "directory",
            "message": f"目錄中找不到 Python 檔案：{directory_path}",
            "issues": [],
            "results": [],
            "usage": "python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <directory_path>",
        }

    results = [review_file(file_path) for file_path in python_files]
    return {
        "status": build_target_status(results),
        "target": directory_path,
        "target_type": "directory",
        "files_reviewed": len(results),
        "files_with_issues": sum(1 for result in results if result.get("issues")),
        "results": results,
        "summary": build_target_summary(results),
    }


def review_diff(diff_path: str, project_root: str = ".") -> Dict[str, Any]:
    diff_file = Path(diff_path)
    if not diff_file.exists() or not diff_file.is_file():
        return {
            "status": "error",
            "target": diff_path,
            "target_type": "diff",
            "message": f"diff 檔案不存在：{diff_path}",
            "issues": [],
            "results": [],
            "usage": "python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <diff_file> [project_root]",
        }

    try:
        diff_text = diff_file.read_text(encoding="utf-8")
    except Exception as exc:
        return {
            "status": "error",
            "target": diff_path,
            "target_type": "diff",
            "message": f"讀取 diff 檔案失敗：{exc}",
            "issues": [],
            "results": [],
        }

    return review_diff_text(diff_text, target_label=diff_path, project_root=project_root, diff_source="file")


def review_target(target_path: str, project_root: str = ".") -> Dict[str, Any]:
    path = Path(target_path)
    if path.is_dir():
        return review_directory(target_path)

    if path.is_file():
        lowered = path.name.lower()
        if lowered.endswith((".diff", ".patch")):
            return review_diff(target_path, project_root)

        try:
            preview = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            preview = ""
        if preview.startswith("diff --git ") or "\n+++ b/" in preview:
            return review_diff(target_path, project_root)

        return review_file(target_path)

    return review_file(target_path)


def parse_cli_args(args: List[str]) -> Dict[str, str]:
    if len(args) < 2:
        return {"mode": "missing"}

    if len(args) >= 4 and args[1] == "git" and args[2] == "diff":
        if args[3] == "--staged":
            return {
                "mode": "git-staged",
                "project_root": args[4] if len(args) > 4 else ".",
            }
        if args[3] == "--cached":
            return {
                "mode": "git-cached",
                "project_root": args[4] if len(args) > 4 else ".",
            }
        return {
            "mode": "git-range",
            "diff_range": args[3],
            "project_root": args[4] if len(args) > 4 else ".",
        }

    return {
        "mode": "target",
        "target_path": args[1],
        "project_root": args[2] if len(args) > 2 else ".",
    }


def review_file(file_path: str) -> Dict[str, Any]:
    """執行完整的代碼審查"""
    path = Path(file_path)

    if not path.exists():
        similar = find_similar_files(file_path)
        suggestion = "請確認路徑是否正確。"
        if similar:
            suggestion += "\n可能是以下檔案：\n- " + "\n- ".join(similar)
        return {
            "status": "error",
            "file": file_path,
            "message": f"檔案不存在：{file_path}",
            "suggestion": suggestion,
            "usage": "python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <file_path>",
            "issues": [],
        }

    try:
        content = path.read_text(encoding="utf-8")
        lines = content.splitlines()
    except Exception as exc:
        return {
            "status": "error",
            "file": file_path,
            "message": f"讀取檔案失敗：{str(exc)}",
            "suggestion": "請確認檔案是否為 UTF-8 編碼，且具有讀取權限。",
            "usage": "python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <file_path>",
            "issues": [],
        }

    all_issues = []
    all_issues.extend(check_api_key_leak(content, lines))
    all_issues.extend(check_file_length(lines))
    all_issues.extend(check_line_style(lines))
    all_issues.extend(check_ast_quality(content))
    all_issues.extend(check_chinese_comments(lines))

    has_critical = any(issue["type"] in CRITICAL_ISSUE_TYPES for issue in all_issues)
    status = "fail" if has_critical else ("warning" if all_issues else "pass")

    return {
        "status": status,
        "file": file_path,
        "line_count": len(lines),
        "issues": all_issues,
        "summary": build_summary(all_issues),
    }


def main(argv: List[str] | None = None) -> int:
    """主程式入口"""
    args = argv or sys.argv
    parsed = parse_cli_args(args)
    if parsed["mode"] == "missing":
        result = {
            "status": "error",
            "file": "",
            "message": "缺少檔案路徑參數",
            "issues": [],
            "usage": "python .github/workflow-core/skills/code-reviewer/scripts/code_reviewer.py <file_or_directory_or_diff> [project_root] | git diff --staged [project_root] | git diff <base>..<head> [project_root]",
            "suggestion": "請提供欲審查的檔案、目錄、diff 路徑，或直接使用 git diff 模式。",
        }
        result = validate_output_schema(result, "code_reviewer")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 1

    if parsed["mode"] == "git-staged":
        result = review_staged_diff(parsed["project_root"])
    elif parsed["mode"] == "git-cached":
        result = review_cached_diff(parsed["project_root"])
    elif parsed["mode"] == "git-range":
        result = review_git_diff_range(parsed["diff_range"], parsed["project_root"])
    else:
        result = review_target(parsed["target_path"], parsed["project_root"])
    result = validate_output_schema(result, "code_reviewer")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 1 if result["status"] == "fail" else 0


__all__ = [
    "validate_output_schema",
    "find_similar_files",
    "check_api_key_leak",
    "check_file_length",
    "check_line_style",
    "check_ast_quality",
    "check_chinese_comments",
    "build_summary",
    "build_target_summary",
    "build_target_status",
    "validate_git_diff_range",
    "list_python_files",
    "extract_python_files_from_diff",
    "review_diff_text",
    "run_git_diff_command",
    "review_staged_diff",
    "review_cached_diff",
    "review_git_diff_range",
    "review_directory",
    "review_diff",
    "review_target",
    "parse_cli_args",
    "review_file",
    "main",
]


if __name__ == "__main__":
    raise SystemExit(main())
