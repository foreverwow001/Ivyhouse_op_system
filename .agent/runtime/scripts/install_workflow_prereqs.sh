#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TARGET="$REPO_ROOT/.github/workflow-core/runtime/scripts/install_workflow_prereqs.sh"

echo "[compat] .agent/runtime/scripts/install_workflow_prereqs.sh 已降級為 shim；正式入口改為 $TARGET" >&2
exec bash "$TARGET" "$@"
