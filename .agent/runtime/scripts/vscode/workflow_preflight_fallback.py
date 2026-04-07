#!/usr/bin/env python3
"""Legacy compatibility stub for retired fallback preflight."""

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
            "workflow_preflight_fallback.py 屬舊 PTY/fallback surface，已於 Phase 4 退休；如需 fallback，請依現行 workflow 經 user 明確同意後人工處理。"
        )
    )
