#!/usr/bin/env bash
# run_codex_template.sh v3 - bounded work unit aware runner (VS Code native terminal; no tmux)
#
# Purpose:
#   - Parse executor_tool from the Plan EXECUTION_BLOCK
#   - Build a bounded work unit orchestration payload before execution
#   - If executor_tool=codex-cli, run `codex exec` with the bounded work unit prompt
#   - Record JSONL audit entries in `.workflow-core/state/execution_log.jsonl`
#   - Trigger L2 rollback on execution failure when the worktree was clean before execution
#
# Usage:
#   .github/workflow-core/scripts/run_codex_template.sh doc/plans/Idx-NNN_plan.md

set -euo pipefail

PLAN_FILE="${1:-}"
LOG_FILE=".workflow-core/state/execution_log.jsonl"
BACKUP_PATCH=".workflow-core/state/.pre_execution_backup.patch"
ORCHESTRATOR_FILE=".github/workflow-core/runtime/scripts/bounded_work_unit_orchestrator.py"
mkdir -p .workflow-core/state

PYTHON_BIN="${PYTHON_BIN:-}"
if [[ -z "$PYTHON_BIN" ]]; then
  if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="$(command -v python3)"
  elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="$(command -v python)"
  fi
fi

RUN_ID="$(date +%s%N 2>/dev/null || echo "$(date +%s)000000000")"
START_TIME="$(date -Iseconds 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S+00:00")"

EXECUTION_DECLARED=""
EXECUTION_EFFECTIVE=""
EXIT_CODE_VAL=""
STATUS=""
REASON=""
WORK_UNIT_ID=""
RETRY_BUDGET=""
RETRY_COUNT="0"
LOOP_EXIT_REASON=""
LAST_FAILURE_SIGNATURE=""
EFFECTIVE_FILE_SCOPE_JSON="[]"
ORCH_JSON_FILE=""
CODEX_PROMPT=""

json_escape() {
  local raw_value="${1:-}"
  raw_value="${raw_value//\\/\\\\}"
  raw_value="${raw_value//\"/\\\"}"
  raw_value="${raw_value//$'\n'/\\n}"
  printf '%s' "$raw_value"
}

json_str_or_null() {
  if [[ -n "${1:-}" ]]; then
    printf '"%s"' "$(json_escape "$1")"
  else
    printf 'null'
  fi
}

json_num_or_null() {
  [[ -n "${1:-}" && "${1:-}" =~ ^[0-9]+$ ]] && printf '%s' "$1" || printf 'null'
}

json_raw_or_null() {
  if [[ -n "${1:-}" ]]; then
    printf '%s' "$1"
  else
    printf 'null'
  fi
}

json_get() {
  local json_file="$1"
  local key_path="$2"

  "$PYTHON_BIN" - "$json_file" "$key_path" <<'PY'
import json
import sys

json_path = sys.argv[1]
key_path = sys.argv[2].split(".")

with open(json_path, encoding="utf-8") as handle:
    payload = json.load(handle)

value = payload
for part in key_path:
    if isinstance(value, dict):
        value = value.get(part)
    else:
        value = None
        break

if isinstance(value, (dict, list)):
    print(json.dumps(value, ensure_ascii=False))
elif value is None:
    print("")
else:
    print(value)
PY
}

log_jsonl() {
  local end_time
  end_time="$(date -Iseconds 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S+00:00")"

  printf '{"schema_version":3,"plan":%s,"execution_declared":%s,"execution_effective":%s,"work_unit_id":%s,"retry_budget":%s,"retry_count":%s,"loop_exit_reason":%s,"last_failure_signature":%s,"effective_file_scope":%s,"status":"%s","exit_code":%s,"reason":%s,"run_id":"%s","start":"%s","end":"%s"}\n' \
    "$(json_str_or_null "$PLAN_FILE")" \
    "$(json_str_or_null "$EXECUTION_DECLARED")" \
    "$(json_str_or_null "$EXECUTION_EFFECTIVE")" \
    "$(json_str_or_null "$WORK_UNIT_ID")" \
    "$(json_num_or_null "$RETRY_BUDGET")" \
    "$(json_num_or_null "$RETRY_COUNT")" \
    "$(json_str_or_null "$LOOP_EXIT_REASON")" \
    "$(json_str_or_null "$LAST_FAILURE_SIGNATURE")" \
    "$(json_raw_or_null "$EFFECTIVE_FILE_SCOPE_JSON")" \
    "$STATUS" \
    "$(json_num_or_null "$EXIT_CODE_VAL")" \
    "$(json_str_or_null "$REASON")" \
    "$RUN_ID" \
    "$START_TIME" \
    "$end_time" >> "$LOG_FILE"
}

fail_and_exit() {
  STATUS="FAILED"
  REASON="$1"
  log_jsonl
  echo "❌ 執行失敗: $REASON" >&2
  exit 1
}

skip_and_exit() {
  STATUS="SKIPPED"
  REASON="$1"
  log_jsonl
  echo "⏭️  跳過執行: $REASON"
  exit 0
}

if [[ -z "$PLAN_FILE" ]]; then
  PLAN_FILE="(missing)"
  fail_and_exit "missing_plan_arg"
fi

[[ -f "$PLAN_FILE" ]] || fail_and_exit "plan_file_not_found"
[[ -r "$PLAN_FILE" ]] || fail_and_exit "plan_file_unreadable"

command -v git >/dev/null 2>&1 || fail_and_exit "git_missing"
command -v codex >/dev/null 2>&1 || fail_and_exit "codex_cli_missing"
[[ -n "$PYTHON_BIN" ]] || fail_and_exit "python_missing"
[[ -f "$ORCHESTRATOR_FILE" ]] || fail_and_exit "bounded_work_unit_orchestrator_missing"

EXECUTION_DECLARED="$(awk '
  /<!-- EXECUTION_BLOCK_START -->/ {inside=1; next}
  /<!-- EXECUTION_BLOCK_END -->/ {inside=0}
  inside && /^[[:space:]]*executor_tool:/ {
    sub(/^[[:space:]]*executor_tool:[[:space:]]*/, "")
    print
    exit
  }
' "$PLAN_FILE" | xargs)"

[[ -n "$EXECUTION_DECLARED" ]] || skip_and_exit "missing_executor_tool_field"
[[ "$EXECUTION_DECLARED" == "codex-cli" || "$EXECUTION_DECLARED" == "copilot-cli" ]] || skip_and_exit "invalid_executor_tool_field"
[[ "$EXECUTION_DECLARED" == "codex-cli" ]] || skip_and_exit "execution_tool_not_codex_cli"

ORCH_JSON_FILE="$(mktemp)"
if ! PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ORCHESTRATOR_FILE" "$PLAN_FILE" > "$ORCH_JSON_FILE"; then
  REASON="bounded_work_unit_payload_invalid"
  if [[ -s "$ORCH_JSON_FILE" ]]; then
    REASON="$(json_get "$ORCH_JSON_FILE" summary)"
  fi
  fail_and_exit "$REASON"
fi

WORK_UNIT_ID="$(json_get "$ORCH_JSON_FILE" work_unit.work_unit_id)"
RETRY_BUDGET="$(json_get "$ORCH_JSON_FILE" work_unit.retry_budget)"
EFFECTIVE_FILE_SCOPE_JSON="$(json_get "$ORCH_JSON_FILE" orchestration_state.effective_file_scope)"
CODEX_PROMPT="$(json_get "$ORCH_JSON_FILE" engineer_prompt)"

[[ -n "$WORK_UNIT_ID" ]] || fail_and_exit "missing_work_unit_id"
[[ -n "$RETRY_BUDGET" ]] || fail_and_exit "missing_retry_budget"
[[ -n "$CODEX_PROMPT" ]] || fail_and_exit "missing_engineer_prompt"

if [[ -n "$(git status --porcelain 2>/dev/null || true)" ]]; then
  skip_and_exit "dirty_worktree"
fi

PRE_HEAD="$(git rev-parse HEAD 2>/dev/null || echo "")"
git diff > "$BACKUP_PATCH" 2>/dev/null || true

echo "🚀 執行 Codex CLI: $PLAN_FILE"

set +e
cat "$PLAN_FILE" | codex exec "$CODEX_PROMPT"
EXIT_CODE_VAL=$?
set -e

EXECUTION_EFFECTIVE="codex-cli"

if [[ "$EXIT_CODE_VAL" -ne 0 ]]; then
  echo "❌ Codex CLI 執行失敗 (exit code: $EXIT_CODE_VAL)"
  REASON="codex_nonzero"
  LOOP_EXIT_REASON="executor_nonzero_exit"
  LAST_FAILURE_SIGNATURE="codex_exit_code_${EXIT_CODE_VAL}"

  echo "🔄 觸發 L2 Rollback..."
  POST_HEAD="$(git rev-parse HEAD 2>/dev/null || echo "")"

  if [[ -n "$PRE_HEAD" && -n "$POST_HEAD" && "$POST_HEAD" != "$PRE_HEAD" ]]; then
    git reset --hard "$PRE_HEAD" 2>/dev/null || true
  fi

  git restore --worktree --staged -- . 2>/dev/null || true
  git ls-files --others --exclude-standard -z 2>/dev/null | \
    grep -zv '^\.workflow-core/' | \
    xargs -0 rm -rf -- 2>/dev/null || true

  STATUS="FAILED"
  log_jsonl
  exit 1
fi

echo "✅ 執行成功"
LOOP_EXIT_REASON="await_external_review"
STATUS="SUCCESS"
log_jsonl
