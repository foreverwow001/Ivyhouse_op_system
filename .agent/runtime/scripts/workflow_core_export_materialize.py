#!/usr/bin/env python3
"""Legacy compatibility shim for workflow_core_export_materialize."""
from __future__ import annotations
import sys
from pathlib import Path
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))
from _compat_exec import exec_canonical
if __name__ == "__main__":
    raise SystemExit(exec_canonical("workflow_core_export_materialize.py"))
