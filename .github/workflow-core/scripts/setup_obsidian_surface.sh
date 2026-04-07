#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_NAME="$(basename "$0")"
DEFAULT_SURFACE_ROOT=".local/obsidian-surface"
DEFAULT_LINK_NAME="obsidian-vault"
DEFAULT_MODE="symlink"

usage() {
  cat <<'EOF'
Usage:
  setup_obsidian_surface.sh --vault-root /path/to/ObsidianVault [options]

Options:
  --repo-root PATH            Target repo root. Defaults to current directory.
  --vault-root PATH           Source Obsidian vault root. Can also use OBSIDIAN_VAULT_ROOT.
  --surface-root PATH         Repo-local restricted surface path.
                              Default: .local/obsidian-surface
  --link-name NAME            Explorer entry created in repo root.
                              Default: obsidian-vault
  --mode MODE                 One of: symlink, copy. Default: symlink
  --skip-pending-review       Do not expose 10-inbox/pending-review-notes
  --force                     Allow replacing managed symlinks or refreshing copy mode with --delete
  -h, --help                  Show this message

Examples:
  bash .github/workflow-core/scripts/setup_obsidian_surface.sh --vault-root ~/ObsidianVault
  bash .github/workflow-core/scripts/setup_obsidian_surface.sh --vault-root /shared/ObsidianVault --mode copy
EOF
}

fail() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

log() {
  printf '[obsidian-surface] %s\n' "$1"
}

resolve_path() {
  local repo_root="$1"
  local candidate="$2"

  if [[ "$candidate" = /* ]]; then
    printf '%s\n' "$candidate"
  else
    printf '%s/%s\n' "$repo_root" "$candidate"
  fi
}

ensure_gitignore_entry() {
  local gitignore_path="$1"
  local entry="$2"

  touch "$gitignore_path"
  if grep -Fqx "$entry" "$gitignore_path"; then
    return 0
  fi

  printf '%s\n' "$entry" >> "$gitignore_path"
}

ensure_parent_dir() {
  local path="$1"
  mkdir -p "$(dirname "$path")"
}

replace_path_if_allowed() {
  local path="$1"
  local force="$2"

  if [[ -L "$path" ]]; then
    rm -f "$path"
    return 0
  fi

  if [[ ! -e "$path" ]]; then
    return 0
  fi

  if [[ "$force" != "1" ]]; then
    fail "refusing to replace existing non-symlink path: $path"
  fi

  rm -rf "$path"
}

create_managed_symlink() {
  local source_path="$1"
  local link_path="$2"
  local force="$3"

  ensure_parent_dir "$link_path"

  if [[ -L "$link_path" ]]; then
    local current_target
    current_target="$(readlink "$link_path")"
    if [[ "$current_target" == "$source_path" ]]; then
      return 0
    fi
  fi

  replace_path_if_allowed "$link_path" "$force"
  ln -s "$source_path" "$link_path"
}

copy_directory_contents() {
  local source_path="$1"
  local target_path="$2"
  local force="$3"

  if [[ -L "$target_path" ]]; then
    replace_path_if_allowed "$target_path" "$force"
  fi

  mkdir -p "$target_path"

  if command -v rsync >/dev/null 2>&1; then
    local -a rsync_args
    rsync_args=(-a)
    if [[ "$force" == "1" ]]; then
      rsync_args+=(--delete)
    fi
    rsync "${rsync_args[@]}" "$source_path/" "$target_path/"
    return 0
  fi

  if [[ "$force" == "1" ]]; then
    find "$target_path" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  fi
  cp -a "$source_path/." "$target_path/"
}

validate_source_dir() {
  local path="$1"
  [[ -d "$path" ]] || fail "missing source directory: $path"
}

REPO_ROOT="$PWD"
VAULT_ROOT="${OBSIDIAN_VAULT_ROOT:-}"
SURFACE_ROOT="$DEFAULT_SURFACE_ROOT"
LINK_NAME="$DEFAULT_LINK_NAME"
MODE="$DEFAULT_MODE"
INCLUDE_PENDING_REVIEW=1
FORCE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-root)
      REPO_ROOT="$2"
      shift 2
      ;;
    --vault-root)
      VAULT_ROOT="$2"
      shift 2
      ;;
    --surface-root)
      SURFACE_ROOT="$2"
      shift 2
      ;;
    --link-name)
      LINK_NAME="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    --skip-pending-review)
      INCLUDE_PENDING_REVIEW=0
      shift
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "unknown argument: $1"
      ;;
  esac
done

case "$MODE" in
  symlink|copy)
    ;;
  *)
    fail "unsupported mode: $MODE"
    ;;
esac

[[ -n "$VAULT_ROOT" ]] || fail "missing --vault-root (or OBSIDIAN_VAULT_ROOT)"
[[ -d "$REPO_ROOT" ]] || fail "repo root does not exist: $REPO_ROOT"

REPO_ROOT="$(cd "$REPO_ROOT" && pwd)"
VAULT_ROOT="$(cd "$VAULT_ROOT" && pwd)"
SURFACE_ROOT="$(resolve_path "$REPO_ROOT" "$SURFACE_ROOT")"
LINK_PATH="$(resolve_path "$REPO_ROOT" "$LINK_NAME")"
GITIGNORE_PATH="$REPO_ROOT/.gitignore"

validate_source_dir "$VAULT_ROOT/00-indexes"
validate_source_dir "$VAULT_ROOT/20-reviewed"
if [[ "$INCLUDE_PENDING_REVIEW" == "1" ]]; then
  validate_source_dir "$VAULT_ROOT/10-inbox/pending-review-notes"
fi

mkdir -p "$SURFACE_ROOT"
mkdir -p "$SURFACE_ROOT/10-inbox"

if [[ "$MODE" == "symlink" ]]; then
  create_managed_symlink "$VAULT_ROOT/00-indexes" "$SURFACE_ROOT/00-indexes" "$FORCE"
  create_managed_symlink "$VAULT_ROOT/20-reviewed" "$SURFACE_ROOT/20-reviewed" "$FORCE"
  if [[ "$INCLUDE_PENDING_REVIEW" == "1" ]]; then
    create_managed_symlink \
      "$VAULT_ROOT/10-inbox/pending-review-notes" \
      "$SURFACE_ROOT/10-inbox/pending-review-notes" \
      "$FORCE"
  fi
else
  copy_directory_contents "$VAULT_ROOT/00-indexes" "$SURFACE_ROOT/00-indexes" "$FORCE"
  copy_directory_contents "$VAULT_ROOT/20-reviewed" "$SURFACE_ROOT/20-reviewed" "$FORCE"
  if [[ "$INCLUDE_PENDING_REVIEW" == "1" ]]; then
    copy_directory_contents \
      "$VAULT_ROOT/10-inbox/pending-review-notes" \
      "$SURFACE_ROOT/10-inbox/pending-review-notes" \
      "$FORCE"
  fi
fi

create_managed_symlink "$SURFACE_ROOT" "$LINK_PATH" "$FORCE"

ensure_gitignore_entry "$GITIGNORE_PATH" ".local/obsidian-surface/"
ensure_gitignore_entry "$GITIGNORE_PATH" "obsidian-vault"

log "repo_root=$REPO_ROOT"
log "vault_root=$VAULT_ROOT"
log "surface_root=$SURFACE_ROOT"
log "link_path=$LINK_PATH"
log "mode=$MODE"
if [[ "$INCLUDE_PENDING_REVIEW" == "1" ]]; then
  log "exposed=00-indexes,20-reviewed,10-inbox/pending-review-notes"
else
  log "exposed=00-indexes,20-reviewed"
fi
