# -*- coding: utf-8 -*-
"""Package layout resolution helpers for github_explorer."""

from __future__ import annotations

import re
from pathlib import PurePosixPath
from typing import Dict

from _shared import skill_name_to_package_dir


PACKAGE_CONTAINER_DIRS = {"scripts", "resources", "assets", "docs", "examples", "prompts", "templates", "data"}
PACKAGE_TAXONOMY_DIRS = {"skills", ".curated", ".experimental", ".system", ".official", ".community"}
GENERIC_EXTERNAL_NAMES = {
    "skill",
    "readme",
    "index",
    "main",
    "__init__",
    "scripts",
    "resources",
    "assets",
    "docs",
    "examples",
    "prompts",
    "templates",
    "data",
}


def _normalize_external_skill_name(repo_full_name: str, candidate_name: str) -> str:
    base_name = candidate_name.strip()
    if not base_name or base_name.lower() in GENERIC_EXTERNAL_NAMES:
        base_name = repo_full_name.split("/")[-1]
    normalized = re.sub(r"[^a-z0-9]+", "_", base_name.lower().replace("-", "_"))
    normalized = re.sub(r"_+", "_", normalized).strip("_") or "external_skill"
    return normalized


def _resolve_external_package_layout(repo_full_name: str, remote_file_path: str) -> Dict[str, str]:
    remote_path = PurePosixPath(remote_file_path.strip("/"))
    parts = [part for part in remote_path.parts if part not in {"", "."}]
    if any(part == ".." for part in parts):
        raise ValueError(f"不支援的遠端路徑：{remote_file_path}")

    if not parts:
        skill_name = _normalize_external_skill_name(repo_full_name, repo_full_name.split("/")[-1])
        package_dir_name = skill_name_to_package_dir(skill_name)
        return {
            "skill_name": skill_name,
            "package_dir_name": package_dir_name,
            "package_relative_path": "README.md",
        }

    container_index = next(
        (index for index, part in enumerate(parts[:-1]) if part.lower() in PACKAGE_CONTAINER_DIRS and index > 0),
        None,
    )
    root_index = container_index - 1 if container_index is not None else max(len(parts) - 2, 0)

    while root_index > 0 and parts[root_index].lower() in PACKAGE_TAXONOMY_DIRS:
        root_index -= 1

    candidate_name = parts[root_index] if parts else repo_full_name.split("/")[-1]
    skill_name = _normalize_external_skill_name(repo_full_name, candidate_name)
    package_dir_name = skill_name_to_package_dir(skill_name)

    relative_parts = parts[root_index + 1 :] if root_index + 1 < len(parts) else [parts[-1]]
    if not relative_parts:
        relative_parts = [parts[-1]]

    file_name = relative_parts[-1]
    if file_name.lower() == "skill.md":
        relative_parts = ["SKILL.md"]
    elif file_name.lower() == "readme.md":
        relative_parts = ["README.md"]

    package_relative_path = PurePosixPath(*relative_parts).as_posix()
    return {
        "skill_name": skill_name,
        "package_dir_name": package_dir_name,
        "package_relative_path": package_relative_path,
    }


__all__ = [
    "GENERIC_EXTERNAL_NAMES",
    "PACKAGE_CONTAINER_DIRS",
    "PACKAGE_TAXONOMY_DIRS",
    "_normalize_external_skill_name",
    "_resolve_external_package_layout",
]
