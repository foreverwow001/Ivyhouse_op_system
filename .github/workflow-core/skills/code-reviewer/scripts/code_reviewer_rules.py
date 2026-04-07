# -*- coding: utf-8 -*-
"""Shared rule-engine helpers for the code reviewer skill."""

from __future__ import annotations

import ast
import re
from typing import Any, Dict, List


API_KEY_PATTERNS = [
    r"sk-[a-zA-Z0-9]{20,}",
    r"api[_-]?key\s*=\s*['\"][^'\"]+['\"]",
    r"ANTHROPIC_API_KEY\s*=\s*['\"][^'\"]+['\"]",
    r"GOOGLE_API_KEY\s*=\s*['\"][^'\"]+['\"]",
    r"secret[_-]?key\s*=\s*['\"][^'\"]+['\"]",
]

MAX_FILE_LINES = 500
MIN_CHINESE_LINES = 5
MAX_LINE_LENGTH = 100
MAX_FUNCTION_LINES = 50

SUMMARY_KEYS = [
    "api_key_leak",
    "syntax_error",
    "shell_true",
    "dynamic_code_execution",
    "file_too_long",
    "function_too_long",
    "line_too_long",
    "trailing_whitespace",
    "bare_except",
    "missing_chinese_comment",
]


def build_issue(issue_type: str, line: int, message: str, severity: str = "warning") -> Dict[str, Any]:
    return {
        "type": issue_type,
        "line": line,
        "message": message,
        "severity": severity,
    }


def check_api_key_leak(content: str, lines: List[str]) -> List[Dict[str, Any]]:
    issues = []
    for index, line in enumerate(lines, start=1):
        stripped = line.strip()
        if stripped.startswith("#"):
            continue
        for pattern in API_KEY_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                issues.append(
                    build_issue(
                        "api_key_leak",
                        index,
                        f"偵測到可能的 API Key 洩漏：{stripped[:50]}...",
                        severity="critical",
                    )
                )
                break
    return issues


def check_file_length(lines: List[str]) -> List[Dict[str, Any]]:
    issues = []
    line_count = len(lines)
    if line_count > MAX_FILE_LINES:
        issues.append(
            build_issue(
                "file_too_long",
                line_count,
                f"檔案共 {line_count} 行，超過 {MAX_FILE_LINES} 行限制，建議拆分模組",
            )
        )
    return issues


def check_line_style(lines: List[str]) -> List[Dict[str, Any]]:
    issues = []
    for index, line in enumerate(lines, start=1):
        if len(line) > MAX_LINE_LENGTH:
            issues.append(
                build_issue(
                    "line_too_long",
                    index,
                    f"第 {index} 行長度為 {len(line)}，超過 {MAX_LINE_LENGTH} 字元，建議換行或抽 helper。",
                )
            )
        if line != line.rstrip(" \t"):
            issues.append(
                build_issue(
                    "trailing_whitespace",
                    index,
                    "偵測到尾端空白，建議移除以避免不必要 diff。",
                )
            )
    return issues


def check_ast_quality(content: str) -> List[Dict[str, Any]]:
    try:
        tree = ast.parse(content)
    except SyntaxError as exc:
        line = exc.lineno or 1
        message = exc.msg or "未知語法錯誤"
        return [build_issue("syntax_error", line, f"Python 語法錯誤：{message}", severity="critical")]

    issues: List[Dict[str, Any]] = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            end_lineno = getattr(node, "end_lineno", node.lineno)
            function_length = end_lineno - node.lineno + 1
            if function_length > MAX_FUNCTION_LINES:
                issues.append(
                    build_issue(
                        "function_too_long",
                        node.lineno,
                        f"函式 `{node.name}` 共 {function_length} 行，超過 {MAX_FUNCTION_LINES} 行，建議拆分責任。",
                    )
                )

        if isinstance(node, ast.ExceptHandler) and node.type is None:
            issues.append(
                build_issue(
                    "bare_except",
                    node.lineno,
                    "偵測到 bare except，建議改為捕捉具體例外型別。",
                )
            )

        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in {"eval", "exec"}:
                issues.append(
                    build_issue(
                        "dynamic_code_execution",
                        node.lineno,
                        f"偵測到 `{node.func.id}`，請確認是否真的需要動態執行程式碼。",
                    )
                )

            if isinstance(node.func, ast.Attribute) and node.func.attr in {
                "run",
                "Popen",
                "call",
                "check_call",
                "check_output",
            }:
                for keyword in node.keywords:
                    if keyword.arg == "shell" and isinstance(keyword.value, ast.Constant) and keyword.value.value is True:
                        issues.append(
                            build_issue(
                                "shell_true",
                                node.lineno,
                                "偵測到 subprocess 使用 shell=True，請確認是否有命令注入風險。",
                            )
                        )
                        break

    return issues


def check_chinese_comments(lines: List[str]) -> List[Dict[str, Any]]:
    issues = []
    has_chinese = False
    check_range = min(len(lines), MIN_CHINESE_LINES)
    chinese_pattern = re.compile(r"[\u4e00-\u9fff]")

    for line in lines[:check_range]:
        if chinese_pattern.search(line):
            has_chinese = True
            break

    if not has_chinese:
        issues.append(
            build_issue(
                "missing_chinese_comment",
                1,
                f"前 {check_range} 行未發現中文註釋，請在檔案開頭加入繁體中文用途說明",
            )
        )
    return issues


def build_summary(issues: List[Dict[str, Any]]) -> Dict[str, int]:
    return {
        issue_type: sum(1 for issue in issues if issue["type"] == issue_type)
        for issue_type in SUMMARY_KEYS
    }


def build_target_summary(results: List[Dict[str, Any]]) -> Dict[str, int]:
    combined_issues = [issue for result in results for issue in result.get("issues", [])]
    summary = build_summary(combined_issues)
    summary["total_files"] = len(results)
    summary["clean_files"] = sum(1 for result in results if result.get("status") == "pass")
    summary["files_with_issues"] = sum(1 for result in results if result.get("issues"))
    summary["files_failed"] = sum(1 for result in results if result.get("status") == "fail")
    return summary


def build_target_status(results: List[Dict[str, Any]]) -> str:
    if any(result.get("status") == "fail" for result in results):
        return "fail"
    if any(result.get("status") == "warning" for result in results):
        return "warning"
    return "pass"


__all__ = [
    "build_issue",
    "build_summary",
    "build_target_status",
    "build_target_summary",
    "check_api_key_leak",
    "check_ast_quality",
    "check_chinese_comments",
    "check_file_length",
    "check_line_style",
]
