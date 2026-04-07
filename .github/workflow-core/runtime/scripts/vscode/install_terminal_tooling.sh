#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

can_use_passwordless_sudo() {
  command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1
}

global_npm_prefix_is_writable() {
  local prefix
  prefix="$(npm prefix -g 2>/dev/null || true)"
  [[ -n "$prefix" && -w "$prefix" ]]
}

install_missing_cli() {
  local label="$1"
  local command_name="$2"
  local package_name="$3"

  if command -v "$command_name" >/dev/null 2>&1; then
    echo "[reviewer-tooling] ${label} CLI already available: $(command -v "$command_name")"
    return 0
  fi

  if ! command -v npm >/dev/null 2>&1; then
    echo "[WARN] npm not found; cannot install ${label} CLI package ${package_name}." >&2
    return 0
  fi

  echo "[reviewer-tooling] ${label} CLI not found; installing ${package_name}..."

  if [[ "$(id -u)" -eq 0 ]] || global_npm_prefix_is_writable; then
    if npm install -g "$package_name"; then
      return 0
    fi
    echo "[WARN] direct npm install failed for ${package_name}." >&2
  fi

  if can_use_passwordless_sudo; then
    if sudo -n npm install -g "$package_name"; then
      return 0
    fi
    echo "[WARN] sudo npm install failed for ${package_name}." >&2
    return 0
  fi

  echo "[WARN] unable to auto-install ${label} CLI; no writable global npm prefix and passwordless sudo unavailable." >&2
  return 0
}

install_missing_cli "Copilot" "copilot" "@github/copilot"

echo
echo "Installed reviewer CLI tooling."
echo "Next step 1: run 'python .github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py --json' to confirm base command + wrapper readiness."
echo "Next step 2: run 'python .github/workflow-core/runtime/scripts/vscode/copilot_cli_one_shot_reviewer.py --help' to verify one-shot reviewer wrapper."
