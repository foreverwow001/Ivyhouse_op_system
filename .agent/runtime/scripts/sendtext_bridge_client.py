#!/usr/bin/env python3
"""Legacy compatibility stub for the retired fallback bridge client."""

from __future__ import annotations

import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from _compat_exec import retired

if __name__ == "__main__":
    raise SystemExit(
        retired(
            "sendtext bridge client 屬舊 PTY/fallback compatibility surface，已不再是 live workflow path；請改用 chat-primary reviewer flow 或明確的人工 fallback 程序。"
        )
    )
