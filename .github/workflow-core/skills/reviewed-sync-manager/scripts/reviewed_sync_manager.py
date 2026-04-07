# -*- coding: utf-8 -*-
"""
.github/workflow-core/skills/reviewed-sync-manager/scripts/reviewed_sync_manager.py
====================================================================
用途：在 workflow template repo 中管理 Obsidian reviewed-sync candidate writer 與 promotion 流程。
職責：
  - 將候選整理稿寫入 reviewed-sync-candidates
  - 將已確認 candidate promotion 到 20-reviewed
  - promotion 時補齊 frontmatter、更新 index 與做 dedupe
  - 明確阻擋 downstream project repo 使用本工具
====================================================================
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List


SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import reviewed_sync_support as support


CANDIDATES_REL = Path("10-inbox") / "reviewed-sync-candidates"
REVIEWED_REL = Path("20-reviewed")
ARCHIVE_REL = Path("30-archives") / "superseded"
INDEXES_REL = Path("00-indexes")

DEFAULT_SOURCE_REPO = "agent-workflow-template"
DEFAULT_REVIEWED_BY = support.DEFAULT_REVIEWED_BY
PAYLOAD_SCHEMA_VERSION = support.PAYLOAD_SCHEMA_VERSION

validate_json_payload_contract = support.validate_json_payload_contract
parse_frontmatter = support.parse_frontmatter
render_frontmatter = support.render_frontmatter
relative_to_repo = support.relative_to_repo
normalize_target_reviewed_dir = support.normalize_target_reviewed_dir
normalize_index_target = support.normalize_index_target
default_index_targets = support.default_index_targets
build_candidate_key = support.build_candidate_key
build_reviewed_key = support.build_reviewed_key
build_candidate_filename = support.build_candidate_filename
build_reviewed_filename = support.build_reviewed_filename
find_note_by_key = support.find_note_by_key
create_index_file = support.create_index_file
update_index_file = support.update_index_file
archive_candidate = support.archive_candidate
build_candidate_body = support.build_candidate_body
build_candidate_frontmatter = support.build_candidate_frontmatter
merge_candidate_frontmatter = support.merge_candidate_frontmatter
build_reviewed_frontmatter = support.build_reviewed_frontmatter
merge_reviewed_frontmatter = support.merge_reviewed_frontmatter
merge_reviewed_body = support.merge_reviewed_body
normalize_candidate_payload = support.normalize_candidate_payload
ensure_list = support.ensure_list


def is_workflow_template_repo(repo_root: Path) -> bool:
    # Use stable template-owned markers instead of a dated maintainer doc path,
    # because active reviewed-sync docs may be reorganized or archived over time.
    return (
        (
            (repo_root / ".github" / "workflow-core" / "workflow_baseline_rules.md").exists()
            or (repo_root / ".agent" / "workflow_baseline_rules.md").exists()
        )
        and (repo_root / "maintainers" / "chat" / "README.md").exists()
    )


def detect_repo_root(script_path: Path) -> Path:
    for candidate in [script_path.parent, *script_path.parents]:
        if is_workflow_template_repo(candidate):
            return candidate
    return script_path.parents[4]


REPO_ROOT = detect_repo_root(Path(__file__).resolve())


def ensure_workflow_template_repo(repo_root: Path) -> None:
    if not is_workflow_template_repo(repo_root):
        raise RuntimeError("reviewed-sync-manager 只能在 workflow template repo 中執行")


def resolve_vault_root(vault_root: str | None, repo_root: Path) -> Path:
    if vault_root:
        return Path(vault_root)
    env_value = os.environ.get("OBSIDIAN_VAULT_ROOT")
    if env_value:
        return Path(env_value)
    fallback = repo_root / "obsidian-vault"
    if fallback.exists():
        return fallback
    raise RuntimeError("找不到 vault root；請提供 --vault-root 或設定 OBSIDIAN_VAULT_ROOT")


def load_json_payload(payload_file: str | None, use_stdin: bool = False) -> Dict[str, Any]:
    if payload_file:
        return json.loads(Path(payload_file).read_text(encoding="utf-8"))
    if use_stdin:
        return json.loads(sys.stdin.read())
    raise ValueError("缺少 JSON payload 來源")


def build_payload_from_source_file(args: argparse.Namespace, repo_root: Path) -> Dict[str, Any]:
    source_file = Path(args.source_file)
    if not source_file.is_absolute():
        source_file = repo_root / source_file
    if not source_file.exists():
        raise FileNotFoundError(f"source file 不存在：{source_file}")

    summary_text = str(args.summary_text or "")
    if args.summary_file:
        summary_text = Path(args.summary_file).read_text(encoding="utf-8")
    if not summary_text.strip():
        summary_text = f"整理 `{relative_to_repo(source_file, repo_root)}` 的 reviewed-sync 候選摘要。"

    return {
        "schema_version": PAYLOAD_SCHEMA_VERSION,
        "title": args.title or source_file.stem.replace("-", " "),
        "source_repo": args.source_repo,
        "source_path": relative_to_repo(source_file, repo_root),
        "source_type": args.source_type or "repo-file",
        "summary_text": summary_text,
        "target_reviewed_dir": args.target_reviewed_dir,
        "index_targets": args.index_target,
        "why_in_inbox": args.why_in_inbox,
        "reusability_check": args.reusability_check,
        "next_review_action": args.next_review_action,
        "source_notes": [f"repo file: {relative_to_repo(source_file, repo_root)}"],
        "source_excerpt": support.build_source_excerpt(source_file, args.source_excerpt_max_lines),
        "tags": args.tag,
        "related_topics": args.related_topic,
        "related_projects": args.related_project,
        "candidate_source_mode": "repo-file",
    }


def build_payload_from_summary(args: argparse.Namespace) -> Dict[str, Any]:
    summary_text = str(args.summary_text or "")
    if args.summary_file:
        summary_text = Path(args.summary_file).read_text(encoding="utf-8")
    if not summary_text.strip():
        raise ValueError("manual summary 不可為空")

    return {
        "schema_version": PAYLOAD_SCHEMA_VERSION,
        "title": args.title or support.summarize_title_from_text(summary_text),
        "source_repo": args.source_repo,
        "source_path": args.source_path or "manual-summary",
        "source_type": args.source_type or "manual-summary",
        "summary_text": summary_text,
        "target_reviewed_dir": args.target_reviewed_dir,
        "index_targets": args.index_target,
        "why_in_inbox": args.why_in_inbox,
        "reusability_check": args.reusability_check,
        "next_review_action": args.next_review_action,
        "source_notes": args.source_note,
        "tags": args.tag,
        "related_topics": args.related_topic,
        "related_projects": args.related_project,
        "candidate_source_mode": "manual-summary",
    }


def write_candidate(vault_root: Path, payload: Dict[str, Any], repo_root: Path | None = None) -> Dict[str, Any]:
    repo_root = repo_root or REPO_ROOT
    ensure_workflow_template_repo(repo_root)
    normalized = normalize_candidate_payload(payload)
    candidates_dir = vault_root / CANDIDATES_REL
    candidates_dir.mkdir(parents=True, exist_ok=True)

    matches = find_note_by_key(candidates_dir, "candidate_key", normalized["candidate_key"], note_kind="reviewed-sync-candidate")
    body = build_candidate_body(normalized)

    if matches:
        chosen = matches[0]
        merged = merge_candidate_frontmatter(chosen["frontmatter"], normalized)
        chosen["path"].write_text(f"{render_frontmatter(merged)}\n\n{body.rstrip()}\n", encoding="utf-8")
        return {
            "status": "ok",
            "action": "update",
            "target_note": str(chosen["path"]),
            "candidate_key": normalized["candidate_key"],
            "reviewed_key": normalized["reviewed_key"],
        }

    filename = build_candidate_filename(normalized, candidates_dir)
    note_path = candidates_dir / filename
    frontmatter = build_candidate_frontmatter(normalized)
    note_path.write_text(f"{render_frontmatter(frontmatter)}\n\n{body.rstrip()}\n", encoding="utf-8")
    return {
        "status": "ok",
        "action": "create",
        "target_note": str(note_path),
        "candidate_key": normalized["candidate_key"],
        "reviewed_key": normalized["reviewed_key"],
    }


def promote_candidate(vault_root: Path, candidate_file: Path, reviewed_by: str = DEFAULT_REVIEWED_BY, repo_root: Path | None = None) -> Dict[str, Any]:
    repo_root = repo_root or REPO_ROOT
    ensure_workflow_template_repo(repo_root)

    candidate_path = candidate_file if candidate_file.is_absolute() else repo_root / candidate_file
    if not candidate_path.exists():
        raise FileNotFoundError(f"candidate file 不存在：{candidate_path}")

    frontmatter, body = parse_frontmatter(candidate_path.read_text(encoding="utf-8"))
    if frontmatter.get("note_kind") != "reviewed-sync-candidate":
        raise ValueError("candidate file 必須是 reviewed-sync-candidate")

    target_reviewed_dir = normalize_target_reviewed_dir(str(frontmatter.get("target_reviewed_dir", "")))
    reviewed_root = vault_root / REVIEWED_REL
    target_dir = reviewed_root / target_reviewed_dir
    target_dir.mkdir(parents=True, exist_ok=True)

    reviewed_key = str(frontmatter.get("reviewed_key") or build_reviewed_key(frontmatter))
    matches = find_note_by_key(reviewed_root, "reviewed_key", reviewed_key)
    updated_indexes: List[str] = []

    if matches:
        chosen = matches[0]
        merged_frontmatter = merge_reviewed_frontmatter(chosen["frontmatter"], frontmatter, reviewed_by)
        merged_body = merge_reviewed_body(chosen["body"], body)
        chosen["path"].write_text(
            f"{render_frontmatter(merged_frontmatter)}\n\n{merged_body.rstrip()}\n",
            encoding="utf-8",
        )
        archived = archive_candidate(candidate_path, vault_root / ARCHIVE_REL)
        for target in ensure_list(merged_frontmatter.get("index_targets")):
            index_path = vault_root / INDEXES_REL / normalize_index_target(target)
            if update_index_file(index_path, chosen["path"], vault_root, merged_frontmatter["title"]):
                updated_indexes.append(str(index_path))
        return {
            "status": "ok",
            "action": "merge",
            "target_note": str(chosen["path"]),
            "archived_candidate": str(archived),
            "updated_indexes": updated_indexes,
            "reviewed_key": reviewed_key,
        }

    filename = build_reviewed_filename(frontmatter, target_dir)
    target_path = target_dir / filename
    reviewed_frontmatter = build_reviewed_frontmatter(frontmatter, reviewed_by)
    candidate_path.replace(target_path)
    target_path.write_text(
        f"{render_frontmatter(reviewed_frontmatter)}\n\n{body.rstrip()}\n",
        encoding="utf-8",
    )

    for target in ensure_list(reviewed_frontmatter.get("index_targets")):
        index_path = vault_root / INDEXES_REL / normalize_index_target(target)
        if update_index_file(index_path, target_path, vault_root, reviewed_frontmatter["title"]):
            updated_indexes.append(str(index_path))

    return {
        "status": "ok",
        "action": "promote",
        "target_note": str(target_path),
        "archived_candidate": None,
        "updated_indexes": updated_indexes,
        "reviewed_key": reviewed_key,
    }


def handle_write_candidate(args: argparse.Namespace) -> Dict[str, Any]:
    repo_root = REPO_ROOT
    vault_root = resolve_vault_root(args.vault_root, repo_root)

    if args.payload_file or args.payload_stdin:
        payload = load_json_payload(args.payload_file, use_stdin=args.payload_stdin)
        validate_json_payload_contract(payload)
    elif args.source_file:
        payload = build_payload_from_source_file(args, repo_root)
    else:
        payload = build_payload_from_summary(args)

    return write_candidate(vault_root, payload, repo_root=repo_root)


def handle_promote_candidate(args: argparse.Namespace) -> Dict[str, Any]:
    repo_root = REPO_ROOT
    vault_root = resolve_vault_root(args.vault_root, repo_root)
    return promote_candidate(vault_root, Path(args.candidate_file), reviewed_by=args.reviewed_by, repo_root=repo_root)


def parse_args(argv: List[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Manage reviewed-sync candidate writing and promotion in workflow template repo.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    write_parser = subparsers.add_parser("write-candidate", help="Write or update a reviewed-sync candidate note")
    write_parser.add_argument("--vault-root", help="Obsidian vault root; defaults to OBSIDIAN_VAULT_ROOT")
    input_group = write_parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("--payload-file", help="Structured JSON payload file")
    input_group.add_argument("--payload-stdin", action="store_true", help="Read structured JSON payload from stdin")
    input_group.add_argument("--source-file", help="Source file inside the workflow template repo")
    input_group.add_argument("--summary-file", help="Manual summary text file")
    input_group.add_argument("--summary-text", help="Manual summary text")
    write_parser.add_argument("--title", help="Candidate title")
    write_parser.add_argument("--source-repo", default=DEFAULT_SOURCE_REPO)
    write_parser.add_argument("--source-type", help="Source type, e.g. repo-file / manual-summary / maintainer-policy")
    write_parser.add_argument("--source-path", help="Optional logical source path for manual summary mode")
    write_parser.add_argument("--target-reviewed-dir", help="Relative target dir under 20-reviewed")
    write_parser.add_argument("--index-target", action="append", default=[], help="Relative file under 00-indexes, repeatable")
    write_parser.add_argument("--tag", action="append", default=[])
    write_parser.add_argument("--related-topic", action="append", default=[])
    write_parser.add_argument("--related-project", action="append", default=[])
    write_parser.add_argument("--why-in-inbox", action="append", default=[])
    write_parser.add_argument("--reusability-check", action="append", default=[])
    write_parser.add_argument("--next-review-action", action="append", default=[])
    write_parser.add_argument("--source-note", action="append", default=[])
    write_parser.add_argument("--source-excerpt-max-lines", type=int, default=40)

    promote_parser = subparsers.add_parser("promote-candidate", help="Promote a reviewed-sync candidate into 20-reviewed")
    promote_parser.add_argument("--vault-root", help="Obsidian vault root; defaults to OBSIDIAN_VAULT_ROOT")
    promote_parser.add_argument("--candidate-file", required=True, help="Candidate markdown path")
    promote_parser.add_argument("--reviewed-by", default=DEFAULT_REVIEWED_BY)

    return parser.parse_args(argv)


def main(argv: List[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        if args.command == "write-candidate":
            result = handle_write_candidate(args)
        else:
            result = handle_promote_candidate(args)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except Exception as exc:
        print(
            json.dumps(
                {
                    "status": "error",
                    "action": args.command,
                    "reason": str(exc),
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 1


__all__ = [
    "ARCHIVE_REL",
    "CANDIDATES_REL",
    "DEFAULT_SOURCE_REPO",
    "PAYLOAD_SCHEMA_VERSION",
    "INDEXES_REL",
    "REPO_ROOT",
    "REVIEWED_REL",
    "archive_candidate",
    "build_candidate_body",
    "build_candidate_frontmatter",
    "build_candidate_key",
    "build_payload_from_source_file",
    "build_payload_from_summary",
    "build_reviewed_filename",
    "build_reviewed_frontmatter",
    "build_reviewed_key",
    "create_index_file",
    "default_index_targets",
    "ensure_workflow_template_repo",
    "find_note_by_key",
    "is_workflow_template_repo",
    "merge_candidate_frontmatter",
    "merge_reviewed_frontmatter",
    "normalize_candidate_payload",
    "parse_frontmatter",
    "promote_candidate",
    "render_frontmatter",
    "resolve_vault_root",
    "update_index_file",
    "validate_json_payload_contract",
    "write_candidate",
]


if __name__ == "__main__":
    raise SystemExit(main())
