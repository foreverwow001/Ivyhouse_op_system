#!/usr/bin/env python3
"""Legacy compatibility stub for retired PTY smoke checks."""

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
            "legacy PTY portable smoke 已退休；Phase 4 後請改用 reviewer readiness check、targeted checks 與 one-shot reviewer evidence。"
        )
    )
