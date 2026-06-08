#!/usr/bin/env python3
"""Validate exam_bank.de.v1-style JSON files."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

ROOT_REQUIRED = ("schema_name", "version", "lang", "doc_title", "tasks")
TASK_REQUIRED = ("task_id", "title", "topic", "sub_questions")
SUBQ_REQUIRED = ("id", "question_de", "solution_de", "explain_fa")


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_exam_structure(data: Any) -> list[str]:
    """Return a list of missing-key error paths."""
    errors: list[str] = []

    if not isinstance(data, dict):
        return ["root (must be an object)"]

    for key in ROOT_REQUIRED:
        if key not in data:
            errors.append(key)

    tasks = data.get("tasks")
    if tasks is None:
        return errors
    if not isinstance(tasks, list):
        errors.append("tasks (must be a list)")
        return errors

    for i, task in enumerate(tasks):
        task_path = f"tasks[{i}]"
        if not isinstance(task, dict):
            errors.append(f"{task_path} (must be an object)")
            continue

        for key in TASK_REQUIRED:
            if key not in task:
                errors.append(f"{task_path}.{key}")

        sub_questions = task.get("sub_questions")
        if sub_questions is None:
            continue
        if not isinstance(sub_questions, list):
            errors.append(f"{task_path}.sub_questions (must be a list)")
            continue

        for j, subq in enumerate(sub_questions):
            subq_path = f"{task_path}.sub_questions[{j}]"
            if not isinstance(subq, dict):
                errors.append(f"{subq_path} (must be an object)")
                continue
            for key in SUBQ_REQUIRED:
                if key not in subq:
                    errors.append(f"{subq_path}.{key}")

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python exam_tools/validate_exam_json.py <path-to-exam-json>")
        return 2

    exam_path = Path(sys.argv[1])
    if not exam_path.exists():
        print(f"ERROR: file not found -> {exam_path}")
        return 1

    try:
        data = load_json(exam_path)
    except json.JSONDecodeError as exc:
        print(f"ERROR: invalid JSON -> {exc}")
        return 1
    except OSError as exc:
        print(f"ERROR: cannot read file -> {exc}")
        return 1

    errors = validate_exam_structure(data)
    if errors:
        for err in errors:
            print(f"ERROR: missing key -> {err}")
        return 1

    print("VALID: exam structure OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
