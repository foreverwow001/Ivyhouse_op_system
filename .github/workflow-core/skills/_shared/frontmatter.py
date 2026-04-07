# -*- coding: utf-8 -*-

from __future__ import annotations

import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple


def today_iso() -> str:
    return datetime.now(UTC).date().isoformat()


def now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def slugify(value: str, max_length: int = 80, empty_slug: str = "note") -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    slug = re.sub(r"-+", "-", slug).strip("-")
    if not slug:
        slug = empty_slug
    return slug[:max_length].rstrip("-")


def parse_scalar(value: str) -> Any:
    stripped = value.strip()
    if stripped in {"true", "True"}:
        return True
    if stripped in {"false", "False"}:
        return False
    if re.fullmatch(r"-?\d+", stripped):
        return int(stripped)
    if (stripped.startswith('"') and stripped.endswith('"')) or (stripped.startswith("'") and stripped.endswith("'")):
        return stripped[1:-1]
    return stripped


def parse_frontmatter(text: str) -> Tuple[Dict[str, Any], str]:
    if not text.startswith("---\n"):
        return {}, text

    lines = text.splitlines()
    try:
        closing_index = lines[1:].index("---") + 1
    except ValueError:
        return {}, text

    frontmatter_lines = lines[1:closing_index]
    body = "\n".join(lines[closing_index + 1 :]).lstrip("\n")

    data: Dict[str, Any] = {}
    index = 0
    while index < len(frontmatter_lines):
        line = frontmatter_lines[index]
        if not line.strip() or ":" not in line:
            index += 1
            continue
        key, raw_value = line.split(":", 1)
        key = key.strip()
        raw_value = raw_value.strip()
        if raw_value:
            data[key] = parse_scalar(raw_value)
            index += 1
            continue

        list_values: List[Any] = []
        nested_index = index + 1
        while nested_index < len(frontmatter_lines):
            nested = frontmatter_lines[nested_index]
            if nested.startswith("  - "):
                list_values.append(parse_scalar(nested[4:]))
                nested_index += 1
                continue
            if not nested.strip():
                nested_index += 1
                continue
            break
        data[key] = list_values
        index = nested_index

    return data, body


def render_scalar(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def render_frontmatter(frontmatter: Dict[str, Any]) -> str:
    lines = ["---"]
    for key, value in frontmatter.items():
        if isinstance(value, list):
            lines.append(f"{key}:")
            for item in value:
                lines.append(f"  - {item}")
        else:
            lines.append(f"{key}: {render_scalar(value)}")
    lines.append("---")
    return "\n".join(lines)


def ensure_list(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if isinstance(value, str):
        return [value] if value.strip() else []
    return [str(value)]


def dedupe_preserve_order(values: Iterable[str]) -> List[str]:
    seen: set[str] = set()
    ordered: List[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def list_note_files(root_dir: Path) -> List[Path]:
    if not root_dir.exists():
        return []
    return sorted(path for path in root_dir.rglob("*.md") if path.is_file())


__all__ = [
    "dedupe_preserve_order",
    "ensure_list",
    "list_note_files",
    "now_iso",
    "parse_frontmatter",
    "parse_scalar",
    "render_frontmatter",
    "render_scalar",
    "slugify",
    "today_iso",
]
