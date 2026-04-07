# -*- coding: utf-8 -*-

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Dict, List


SHARED_IMPORT_ROOT = Path(__file__).resolve().parents[2]
if str(SHARED_IMPORT_ROOT) not in sys.path:
    sys.path.insert(0, str(SHARED_IMPORT_ROOT))

from _shared.frontmatter import (
    dedupe_preserve_order,
    ensure_list,
    list_note_files,
    now_iso,
    parse_frontmatter,
    render_frontmatter,
    slugify,
    today_iso,
)


DEFAULT_SOURCE_REPO = "agent-workflow-template"
DEFAULT_REVIEWED_BY = "human"
PAYLOAD_SCHEMA_VERSION = "reviewed-sync-candidate.v1"

REQUIRED_JSON_PAYLOAD_FIELDS = (
    "schema_version",
    "title",
    "source_repo",
    "source_path",
    "source_type",
    "summary_text",
    "target_reviewed_dir",
)

OPTIONAL_JSON_PAYLOAD_FIELDS = (
    "index_targets",
    "why_in_inbox",
    "reusability_check",
    "next_review_action",
    "source_notes",
    "source_excerpt",
    "tags",
    "related_topics",
    "related_projects",
    "candidate_source_mode",
    "candidate_key",
    "reviewed_key",
    "synced_on",
)

LIST_PAYLOAD_FIELDS = (
    "index_targets",
    "why_in_inbox",
    "reusability_check",
    "next_review_action",
    "source_notes",
    "tags",
    "related_topics",
    "related_projects",
)

STRING_PAYLOAD_FIELDS = (
    "schema_version",
    "title",
    "source_repo",
    "source_path",
    "source_type",
    "summary_text",
    "target_reviewed_dir",
    "source_excerpt",
    "candidate_source_mode",
    "candidate_key",
    "reviewed_key",
    "synced_on",
)

ALLOWED_PAYLOAD_FIELDS = set(REQUIRED_JSON_PAYLOAD_FIELDS) | set(OPTIONAL_JSON_PAYLOAD_FIELDS)


def validate_payload_keys(payload: Dict[str, Any]) -> None:
    unknown_fields = sorted(set(payload) - ALLOWED_PAYLOAD_FIELDS)
    if unknown_fields:
        joined = ", ".join(unknown_fields)
        raise ValueError(f"payload 含未支援欄位：{joined}")


def require_non_empty_string(value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"payload 欄位 `{field_name}` 必須是非空字串")
    return value.strip()


def normalize_payload_string_field(payload: Dict[str, Any], field_name: str, default: str = "") -> str:
    value = payload.get(field_name, default)
    if value is None:
        value = default
    if not isinstance(value, str):
        raise ValueError(f"payload 欄位 `{field_name}` 必須是字串")
    return value.strip()


def normalize_payload_list_field(payload: Dict[str, Any], field_name: str) -> List[str]:
    value = payload.get(field_name)
    if value is None:
        return []
    if not isinstance(value, list):
        raise ValueError(f"payload 欄位 `{field_name}` 必須是字串陣列")
    items = [str(item).strip() for item in value if str(item).strip()]
    return dedupe_preserve_order(items)


def validate_json_payload_contract(payload: Dict[str, Any]) -> None:
    validate_payload_keys(payload)

    for field_name in REQUIRED_JSON_PAYLOAD_FIELDS:
        require_non_empty_string(payload.get(field_name), field_name)

    if payload.get("schema_version") != PAYLOAD_SCHEMA_VERSION:
        raise ValueError(
            f"schema_version 必須是 `{PAYLOAD_SCHEMA_VERSION}`，目前收到 `{payload.get('schema_version')}`"
        )

    for field_name in STRING_PAYLOAD_FIELDS:
        if field_name in payload and payload[field_name] is not None and not isinstance(payload[field_name], str):
            raise ValueError(f"payload 欄位 `{field_name}` 必須是字串")

    for field_name in LIST_PAYLOAD_FIELDS:
        if field_name in payload and payload[field_name] is not None and not isinstance(payload[field_name], list):
            raise ValueError(f"payload 欄位 `{field_name}` 必須是字串陣列")


def format_bullet_section(values: Any, fallback: str) -> str:
    items = ensure_list(values)
    if not items:
        items = [fallback]
    return "\n".join(f"- {item}" for item in items)


def relative_to_repo(path: Path, repo_root: Path) -> str:
    return path.resolve().relative_to(repo_root.resolve()).as_posix()


def normalize_target_reviewed_dir(value: str) -> str:
    cleaned = value.strip().strip("/")
    if cleaned.startswith("20-reviewed/"):
        cleaned = cleaned[len("20-reviewed/") :]
    if not cleaned:
        raise ValueError("target_reviewed_dir 不可為空")
    if cleaned.startswith("../") or cleaned == "..":
        raise ValueError("target_reviewed_dir 不可跳出 20-reviewed")
    return cleaned


def normalize_index_target(value: str) -> str:
    cleaned = value.strip().strip("/")
    if cleaned.startswith("00-indexes/"):
        cleaned = cleaned[len("00-indexes/") :]
    if not cleaned:
        raise ValueError("index target 不可為空")
    if not cleaned.endswith(".md"):
        cleaned = f"{cleaned}.md"
    return cleaned


def default_index_targets(target_reviewed_dir: str) -> List[str]:
    if target_reviewed_dir.startswith("agent-workflow-template/workflow-knowledge"):
        return ["workflows.md"]
    if target_reviewed_dir.startswith("agent-workflow-template/maintainer-sops"):
        return ["workflows.md"]
    if target_reviewed_dir.startswith("lessons-learned"):
        return ["topics.md"]
    return ["projects.md"]


def build_candidate_key(payload: Dict[str, Any]) -> str:
    return "|".join(
        [
            str(payload.get("source_repo", DEFAULT_SOURCE_REPO)).strip(),
            str(payload.get("source_path", "manual-summary")).strip(),
            str(payload.get("source_type", "manual-summary")).strip(),
            str(payload.get("target_reviewed_dir", "")).strip(),
            str(payload.get("title", "")).strip(),
        ]
    )


def build_reviewed_key(payload: Dict[str, Any]) -> str:
    return "|".join(
        [
            str(payload.get("source_repo", DEFAULT_SOURCE_REPO)).strip(),
            str(payload.get("source_path", "manual-summary")).strip(),
            str(payload.get("target_reviewed_dir", "")).strip(),
            str(payload.get("title", "")).strip(),
        ]
    )


def build_candidate_filename(payload: Dict[str, Any], candidates_dir: Path) -> str:
    base = f"{today_iso()}-candidate-{slugify(str(payload.get('title', 'candidate')))}"
    candidate = f"{base}.md"
    counter = 2
    while (candidates_dir / candidate).exists():
        candidate = f"{base}-{counter}.md"
        counter += 1
    return candidate


def build_reviewed_filename(frontmatter: Dict[str, Any], target_dir: Path) -> str:
    base = f"{today_iso()}-{slugify(str(frontmatter.get('title', 'reviewed-note')))}"
    candidate = f"{base}.md"
    counter = 2
    while (target_dir / candidate).exists():
        candidate = f"{base}-{counter}.md"
        counter += 1
    return candidate


def find_note_by_key(root_dir: Path, key_name: str, key_value: str, note_kind: str | None = None) -> List[Dict[str, Any]]:
    matches: List[Dict[str, Any]] = []
    for note_path in list_note_files(root_dir):
        frontmatter, body = parse_frontmatter(note_path.read_text(encoding="utf-8"))
        if not frontmatter:
            continue
        if note_kind and frontmatter.get("note_kind") != note_kind:
            continue
        if str(frontmatter.get(key_name, "")).strip() == key_value:
            matches.append({"path": note_path, "frontmatter": frontmatter, "body": body})
    return sorted(matches, key=lambda item: str(item["path"]))


def create_index_file(index_path: Path) -> None:
    title = index_path.stem.replace("-", " ")
    frontmatter = {
        "title": title,
        "source_repo": "none",
        "source_path": "none",
        "source_type": "index",
        "review_status": "approved",
        "promotion_status": "reviewed",
        "synced_on": today_iso(),
        "tags": ["index", "workflow", "knowledge-map"],
    }
    body = f"# {title.title()}\n\n## Reviewed Sync Entries\n\n"
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(f"{render_frontmatter(frontmatter)}\n\n{body}", encoding="utf-8")


def update_index_file(index_path: Path, note_path: Path, vault_root: Path, title: str) -> bool:
    if not index_path.exists():
        create_index_file(index_path)

    rel_note = note_path.relative_to(vault_root).with_suffix("").as_posix()
    wiki_link = f"[[{rel_note}|{title}]]"

    content = index_path.read_text(encoding="utf-8")
    if wiki_link in content:
        return False

    marker = "## Reviewed Sync Entries"
    addition = f"- {wiki_link}\n"
    if marker in content:
        content = content.rstrip() + "\n" + addition
    else:
        content = content.rstrip() + f"\n\n{marker}\n\n{addition}"
    index_path.write_text(content, encoding="utf-8")
    return True


def archive_candidate(candidate_path: Path, archive_dir: Path) -> Path:
    archive_dir.mkdir(parents=True, exist_ok=True)
    target = archive_dir / candidate_path.name
    counter = 2
    while target.exists():
        target = archive_dir / f"{candidate_path.stem}-{counter}{candidate_path.suffix}"
        counter += 1
    candidate_path.replace(target)
    return target


def build_source_excerpt(source_file: Path, max_lines: int) -> str:
    lines = source_file.read_text(encoding="utf-8").splitlines()
    excerpt = lines[:max_lines]
    if len(lines) > max_lines:
        excerpt.append("...")
    return "\n".join(excerpt)


def summarize_title_from_text(text: str) -> str:
    line = next((line.strip() for line in text.splitlines() if line.strip()), "manual summary")
    return line[:80]


def normalize_candidate_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    validate_payload_keys(payload)

    normalized: Dict[str, Any] = {}
    normalized["schema_version"] = normalize_payload_string_field(payload, "schema_version", PAYLOAD_SCHEMA_VERSION) or PAYLOAD_SCHEMA_VERSION
    if normalized["schema_version"] != PAYLOAD_SCHEMA_VERSION:
        raise ValueError(f"schema_version 不支援：{normalized['schema_version']}")

    normalized["source_repo"] = normalize_payload_string_field(payload, "source_repo", DEFAULT_SOURCE_REPO) or DEFAULT_SOURCE_REPO
    normalized["source_path"] = normalize_payload_string_field(payload, "source_path", "manual-summary") or "manual-summary"
    normalized["source_type"] = normalize_payload_string_field(payload, "source_type", "manual-summary") or "manual-summary"
    normalized["summary_text"] = normalize_payload_string_field(payload, "summary_text", "")
    normalized["title"] = normalize_payload_string_field(
        payload,
        "title",
        summarize_title_from_text(normalized["summary_text"] or "manual summary"),
    )
    target_reviewed_dir = payload.get("target_reviewed_dir")
    if not target_reviewed_dir:
        raise ValueError("缺少 target_reviewed_dir")
    normalized["target_reviewed_dir"] = normalize_target_reviewed_dir(str(target_reviewed_dir))
    index_targets = normalize_payload_list_field(payload, "index_targets") or default_index_targets(normalized["target_reviewed_dir"])
    normalized["index_targets"] = dedupe_preserve_order(normalize_index_target(item) for item in index_targets)
    normalized["why_in_inbox"] = normalize_payload_list_field(payload, "why_in_inbox")
    normalized["reusability_check"] = normalize_payload_list_field(payload, "reusability_check")
    normalized["next_review_action"] = normalize_payload_list_field(payload, "next_review_action")
    normalized["source_notes"] = normalize_payload_list_field(payload, "source_notes")
    normalized["source_excerpt"] = normalize_payload_string_field(payload, "source_excerpt", "")
    normalized["tags"] = normalize_payload_list_field(payload, "tags") or ["inbox", "candidate", "reviewed-sync"]
    normalized["related_topics"] = normalize_payload_list_field(payload, "related_topics")
    normalized["related_projects"] = normalize_payload_list_field(payload, "related_projects") or [DEFAULT_SOURCE_REPO]
    normalized["candidate_source_mode"] = normalize_payload_string_field(
        payload,
        "candidate_source_mode",
        normalized["source_type"],
    ) or normalized["source_type"]
    normalized["candidate_key"] = normalize_payload_string_field(payload, "candidate_key", build_candidate_key(normalized)) or build_candidate_key(normalized)
    normalized["reviewed_key"] = normalize_payload_string_field(payload, "reviewed_key", build_reviewed_key(normalized)) or build_reviewed_key(normalized)
    normalized["synced_on"] = normalize_payload_string_field(payload, "synced_on", today_iso()) or today_iso()
    return normalized


def build_candidate_body(payload: Dict[str, Any]) -> str:
    body = (
        "# Summary\n\n"
        f"{payload['summary_text']}\n\n"
        "# Why This Is In Inbox\n\n"
        f"{format_bullet_section(payload.get('why_in_inbox'), '待人工 review 後決定是否晉升。')}\n\n"
        "# Reusability Check\n\n"
        f"{format_bullet_section(payload.get('reusability_check'), '待補 reusable assessment。')}\n\n"
        "# Target Reviewed Path\n\n"
        f"- 20-reviewed/{payload['target_reviewed_dir']}\n\n"
        "# Source Notes\n\n"
        f"{format_bullet_section(payload.get('source_notes'), '待補來源說明。')}\n"
    )
    if payload.get("source_excerpt"):
        body += f"\n# Source Excerpt\n\n```markdown\n{payload['source_excerpt']}\n```\n"
    body += (
        "\n# Next Review Action\n\n"
        f"{format_bullet_section(payload.get('next_review_action'), '待決定是否 promotion。')}\n"
    )
    return body


def build_candidate_frontmatter(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "title": payload["title"],
        "note_kind": "reviewed-sync-candidate",
        "payload_schema_version": payload["schema_version"],
        "source_repo": payload["source_repo"],
        "source_path": payload["source_path"],
        "source_type": payload["source_type"],
        "review_status": "pending",
        "promotion_status": "promotion-candidate",
        "synced_on": payload.get("synced_on") or today_iso(),
        "target_reviewed_dir": payload["target_reviewed_dir"],
        "index_targets": payload["index_targets"],
        "candidate_key": payload["candidate_key"],
        "reviewed_key": payload["reviewed_key"],
        "candidate_source_mode": payload["candidate_source_mode"],
        "tags": payload["tags"],
        "related_topics": payload["related_topics"],
        "related_projects": payload["related_projects"],
    }


def merge_candidate_frontmatter(existing: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
    merged = dict(existing)
    merged["title"] = payload["title"]
    merged["payload_schema_version"] = payload["schema_version"]
    merged["source_repo"] = payload["source_repo"]
    merged["source_path"] = payload["source_path"]
    merged["source_type"] = payload["source_type"]
    merged["review_status"] = "pending"
    merged["promotion_status"] = "promotion-candidate"
    merged["synced_on"] = today_iso()
    merged["target_reviewed_dir"] = payload["target_reviewed_dir"]
    merged["index_targets"] = dedupe_preserve_order(ensure_list(existing.get("index_targets")) + payload["index_targets"])
    merged["candidate_key"] = payload["candidate_key"]
    merged["reviewed_key"] = payload["reviewed_key"]
    merged["candidate_source_mode"] = payload["candidate_source_mode"]
    merged["tags"] = dedupe_preserve_order(ensure_list(existing.get("tags")) + payload["tags"])
    merged["related_topics"] = dedupe_preserve_order(ensure_list(existing.get("related_topics")) + payload["related_topics"])
    merged["related_projects"] = dedupe_preserve_order(ensure_list(existing.get("related_projects")) + payload["related_projects"])
    return merged


def build_reviewed_frontmatter(candidate_frontmatter: Dict[str, Any], reviewed_by: str) -> Dict[str, Any]:
    return {
        "title": candidate_frontmatter["title"],
        "note_kind": "reviewed-note",
        "payload_schema_version": candidate_frontmatter.get("payload_schema_version", PAYLOAD_SCHEMA_VERSION),
        "source_repo": candidate_frontmatter["source_repo"],
        "source_path": candidate_frontmatter["source_path"],
        "source_type": candidate_frontmatter["source_type"],
        "review_status": "approved",
        "promotion_status": "reviewed",
        "synced_on": today_iso(),
        "source_date": candidate_frontmatter.get("synced_on") or today_iso(),
        "reviewed_by": reviewed_by,
        "reviewed_key": candidate_frontmatter["reviewed_key"],
        "index_targets": dedupe_preserve_order(ensure_list(candidate_frontmatter.get("index_targets"))),
        "tags": dedupe_preserve_order(ensure_list(candidate_frontmatter.get("tags"))),
        "related_topics": dedupe_preserve_order(ensure_list(candidate_frontmatter.get("related_topics"))),
        "related_projects": dedupe_preserve_order(ensure_list(candidate_frontmatter.get("related_projects"))),
    }


def merge_reviewed_frontmatter(existing: Dict[str, Any], candidate: Dict[str, Any], reviewed_by: str) -> Dict[str, Any]:
    merged = dict(existing)
    merged["payload_schema_version"] = candidate.get("payload_schema_version", PAYLOAD_SCHEMA_VERSION)
    merged["review_status"] = "approved"
    merged["promotion_status"] = "reviewed"
    merged["synced_on"] = today_iso()
    merged["reviewed_by"] = reviewed_by
    merged["reviewed_key"] = candidate["reviewed_key"]
    merged["index_targets"] = dedupe_preserve_order(ensure_list(existing.get("index_targets")) + ensure_list(candidate.get("index_targets")))
    merged["tags"] = dedupe_preserve_order(ensure_list(existing.get("tags")) + ensure_list(candidate.get("tags")))
    merged["related_topics"] = dedupe_preserve_order(ensure_list(existing.get("related_topics")) + ensure_list(candidate.get("related_topics")))
    merged["related_projects"] = dedupe_preserve_order(ensure_list(existing.get("related_projects")) + ensure_list(candidate.get("related_projects")))
    return merged


def merge_reviewed_body(existing_body: str, candidate_body: str) -> str:
    cleaned_existing = existing_body.rstrip()
    cleaned_candidate = candidate_body.rstrip()
    if cleaned_candidate in cleaned_existing:
        return cleaned_existing + "\n"
    marker = "## Promotion Updates"
    addition = f"- {now_iso()}: merged candidate update\n"
    if marker not in cleaned_existing:
        return f"{cleaned_existing}\n\n{marker}\n\n{addition}"
    return f"{cleaned_existing}\n{addition}"
