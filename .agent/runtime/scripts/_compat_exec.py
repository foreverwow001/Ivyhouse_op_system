#!/usr/bin/env python3
"""Legacy runtime shim helper for Phase 4 compatibility wrappers."""

from __future__ import annotations

import json
import runpy
import sys
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve()
REPO_ROOT = SCRIPT_PATH.parents[3]
CANONICAL_RUNTIME_ROOT = REPO_ROOT / ".github" / "workflow-core" / "runtime" / "scripts"


def exec_canonical(relative_path: str) -> int:
    target = CANONICAL_RUNTIME_ROOT / relative_path
    if not target.exists():
        return retired(
            f"Legacy runtime shim target missing: {target}. 請改用 .github/workflow-core/runtime/scripts 下的正式入口。"
        )

    original_argv0 = sys.argv[0]
    inserted_path = False
    sys.argv[0] = str(target)
    target_parent = str(target.parent)
    if target_parent not in sys.path:
        sys.path.insert(0, target_parent)
        inserted_path = True
    try:
        runpy.run_path(str(target), run_name="__main__")
    except SystemExit as exc:
        code = exc.code
        if isinstance(code, int):
            return code
        if code is None:
            return 0
        print(code, file=sys.stderr)
        return 1
    finally:
        if inserted_path:
            try:
                sys.path.remove(target_parent)
            except ValueError:
                pass
        sys.argv[0] = original_argv0
    return 0


def retired(message: str, exit_code: int = 2) -> int:
    if "--json" in sys.argv:
        payload = {
            "status": "retired",
            "message": message,
            "canonical_runtime_root": ".github/workflow-core/runtime/scripts",
        }
        print(json.dumps(payload, ensure_ascii=False))
    else:
        print(message, file=sys.stderr)
    return exit_code
