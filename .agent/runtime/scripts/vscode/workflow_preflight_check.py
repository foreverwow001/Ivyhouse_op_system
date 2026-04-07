#!/usr/bin/env python3
"""Legacy compatibility stub for retired PTY preflight check."""

from __future__ import annotations

import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _compat_exec import retired

if __name__ == "__main__":
    raise SystemExit(
        retired(
            "workflow_preflight_check.py 屬舊 PTY-primary surface，已於 Phase 4 退休；請改用 python .github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py --json。"
        )
    )
