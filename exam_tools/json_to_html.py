#!/usr/bin/env python3
"""Convert exam_bank.de.v1-style JSON into a printable HTML study document."""

from __future__ import annotations

import html
import json
import sys
from pathlib import Path
from typing import Any


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def ensure_dirs(project_root: Path) -> Path:
    output_dir = project_root / "output" / "html"
    output_pdf_dir = project_root / "output" / "pdf"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_pdf_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def safe_text(value: Any) -> str:
    if value is None:
        return ""
    return html.escape(str(value))


def render_sub_question(subq: dict[str, Any]) -> str:
    qid = safe_text(subq.get("id", ""))
    question_de = safe_text(subq.get("question_de", ""))
    solution_de = safe_text(subq.get("solution_de", ""))
    explain_fa = safe_text(subq.get("explain_fa", ""))

    tips = subq.get("exam_tips_de", [])
    tip_items = ""
    if isinstance(tips, list):
        tip_items = "".join(f"<li>{safe_text(item)}</li>" for item in tips)

    return f"""
    <section class="sub-question">
      <h4>{qid}</h4>
      <div class="question"><span class="label">Question (DE):</span> {question_de}</div>
      <div class="solution"><span class="label">Solution (DE):</span> {solution_de}</div>
      <div class="fa-wrap">
        <div class="label">Explanation (FA):</div>
        <div class="fa">{explain_fa}</div>
      </div>
      <div class="exam-tips">
        <div class="label">Exam Tips (DE):</div>
        <ul>{tip_items}</ul>
      </div>
    </section>
    """


def render_task(task: dict[str, Any]) -> str:
    task_id = safe_text(task.get("task_id", ""))
    title = safe_text(task.get("title", ""))
    topic = safe_text(task.get("topic", ""))
    difficulty = safe_text(task.get("difficulty", ""))
    question_de = safe_text(task.get("question_de", ""))

    sub_questions = task.get("sub_questions", [])
    subq_html = ""
    if isinstance(sub_questions, list):
        subq_html = "".join(render_sub_question(subq) for subq in sub_questions if isinstance(subq, dict))

    return f"""
    <section class="task">
      <h2>{task_id} - {title}</h2>
      <div class="meta">
        <span><strong>Topic:</strong> {topic}</span>
        <span><strong>Difficulty:</strong> {difficulty}</span>
      </div>
      <div class="task-question">
        <span class="label">Task Question (DE):</span> {question_de}
      </div>
      {subq_html}
    </section>
    """


def render_html(exam_data: dict[str, Any], template_text: str) -> str:
    doc_title = safe_text(exam_data.get("doc_title", "Exam Study Document"))
    tasks = exam_data.get("tasks", [])
    tasks_html = ""
    if isinstance(tasks, list):
        tasks_html = "".join(render_task(task) for task in tasks if isinstance(task, dict))

    return (
        template_text.replace("{{doc_title}}", doc_title).replace("{{tasks_html}}", tasks_html)
    )


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python exam_tools/json_to_html.py <path-to-exam-json>")
        return 2

    exam_path = Path(sys.argv[1]).resolve()
    if not exam_path.exists():
        print(f"ERROR: file not found -> {exam_path}")
        return 1

    project_root = Path(__file__).resolve().parents[1]
    template_path = project_root / "exam_tools" / "templates" / "exam_template.html"
    if not template_path.exists():
        print(f"ERROR: template not found -> {template_path}")
        return 1

    try:
        exam_data = load_json(exam_path)
        template_text = template_path.read_text(encoding="utf-8")
    except json.JSONDecodeError as exc:
        print(f"ERROR: invalid JSON -> {exc}")
        return 1
    except OSError as exc:
        print(f"ERROR: cannot read input -> {exc}")
        return 1

    output_dir = ensure_dirs(project_root)
    output_path = output_dir / f"{exam_path.stem}.html"
    final_html = render_html(exam_data, template_text)

    try:
        output_path.write_text(final_html, encoding="utf-8")
    except OSError as exc:
        print(f"ERROR: cannot write HTML -> {exc}")
        return 1

    print(f"HTML generated: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
