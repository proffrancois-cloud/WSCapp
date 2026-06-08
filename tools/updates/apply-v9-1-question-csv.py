#!/usr/bin/env python3
"""Apply the V9.1 question CSV as the 100/200/300 source of truth."""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
THEME_DIR = ROOT / "content" / "themes" / "2026"
SECTIONS_DIR = THEME_DIR / "sections"
REPORT_DIR = ROOT / "outputs" / "question_update"
DEFAULT_CSV = Path(
    "/Users/francoismo/Desktop/Pro/ILG - MORET FRANCOIS/FLE/2025-2026/WSC/May 9/"
    "WSC_2026_QUESTIONS_100_200_300_V9_1_DEDUPED_100_200_SAME_CONTENT_CHOICES.csv"
)


def clean(value: object) -> str:
    return str(value or "").replace("\r\n", "\n").replace("\r", "\n").strip()


def normalize(value: object) -> str:
    text = clean(value).lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def meaningful_feedback(value: object) -> bool:
    text = clean(value)
    if not text or text == ".":
        return False
    return normalize(text) not in {"that answer changes the point", "that answer changes the point"}


def read_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_window_json(path: Path, global_name: str) -> dict:
    text = path.read_text(encoding="utf-8")
    match = re.search(rf"window\.{re.escape(global_name)}\s*=\s*(\{{.*\}});\s*$", text, re.S)
    if not match:
        raise ValueError(f"Could not parse {global_name} from {path}")
    return json.loads(match.group(1))


def write_window_json(path: Path, global_name: str, data: object) -> None:
    path.write_text(
        f"window.{global_name} = {json.dumps(data, ensure_ascii=False, indent=2)};\n",
        encoding="utf-8",
    )


def question_key(question: dict) -> str:
    return clean(
        question.get("sourceQuestionId")
        or question.get("sourceId")
        or question.get("stableId")
        or question.get("id")
    )


def old_wrong_feedback(old_question: dict | None, wrong_answer: str) -> str:
    if not old_question:
        return ""
    target = normalize(wrong_answer)
    for item in old_question.get("visibleWrongExplanations") or []:
        if normalize(item.get("answer") or item.get("text")) == target:
            return clean(item.get("explanation"))
    return ""


def generated_source_id(section_id: str, level_key: str, sequence: int, entry_index: str = "") -> str:
    entry_part = entry_index or "section"
    return f"L{level_key}_{section_id}_{entry_part}_{sequence:03d}"


def build_visible_wrong(row: dict, wrong_answers: list[str], old_question: dict | None, correct: str) -> list[dict]:
    feedback_columns = [
        "visible_wrong_feedback_for_suggestion_B",
        "visible_wrong_feedback_for_suggestion_C",
        "visible_wrong_feedback_for_suggestion_D",
    ]
    visible = []
    for index, answer in enumerate(wrong_answers):
        csv_feedback = clean(row.get(feedback_columns[index], "")) if index < len(feedback_columns) else ""
        fallback = old_wrong_feedback(old_question, answer)
        explanation = (
            csv_feedback
            if meaningful_feedback(csv_feedback)
            else fallback
            or f"That answer changes the point: {correct}."
        )
        visible.append(
            {
                "label": chr(ord("B") + index),
                "answer": answer,
                "explanation": explanation,
            }
        )
    return visible


def build_question(
    row: dict,
    section_id: str,
    section_title: str,
    level_key: str,
    sequence: int,
    old_question: dict | None,
    entry_id: str | None = None,
) -> tuple[dict, dict]:
    prompt = clean(row.get("question_in_app_or_guide")) or clean(row.get("updated_question"))
    suggestions = [clean(row.get(f"suggestion_{letter}")) for letter in "ABCD"]
    stats = {
        "blank_choices_filled_from_current": False,
        "expected_answer_not_in_choices": False,
    }

    if all(suggestions):
        correct = suggestions[0]
        wrong_answers = suggestions[1:4]
    elif old_question and old_question.get("correctAnswer") and len(old_question.get("wrongAnswers") or []) >= 3:
        correct = clean(old_question["correctAnswer"])
        wrong_answers = [clean(item) for item in old_question["wrongAnswers"][:3]]
        stats["blank_choices_filled_from_current"] = True
    else:
        correct = clean(row.get("expected_answer")) or suggestions[0]
        wrong_answers = [item for item in suggestions[1:] if item]

    if clean(row.get("expected_answer")) and clean(row.get("expected_answer")) not in suggestions:
        stats["expected_answer_not_in_choices"] = True

    if not prompt or not correct or len(wrong_answers) < 3:
        raise ValueError(
            f"Incomplete question row {row.get('_row_number')} for {section_id} level {level_key}: "
            f"prompt={bool(prompt)} correct={bool(correct)} wrong={len(wrong_answers)}"
        )

    display_level = int(level_key)
    numeric_level = display_level // 100
    base = dict(old_question or {})
    source_id = clean(row.get("source_question_id")) or question_key(base) or generated_source_id(
        section_id, level_key, sequence, clean(row.get("entry_index"))
    )
    question_id = clean(base.get("id")) or f"question.{section_id}.{level_key}.{sequence:03d}"
    visible_correct = clean(row.get("visible_correct_feedback"))
    if not meaningful_feedback(visible_correct):
        visible_correct = clean(base.get("visibleCorrectExplanation")) or clean(base.get("explanation")) or f"{correct}."

    source_type = "entry.quizQuestions" if level_key in {"100", "200"} else "section.guideQuestions"
    question_scope = "Raw Content" if source_type == "entry.quizQuestions" else "Section Journey"
    source_note = clean(row.get("review_note_v9")) or "Direct from V9.1 final question CSV."
    source_url = clean(row.get("source_url_or_file")) or str(row.get("_csv_path", ""))

    base.update(
        {
            "id": question_id,
            "level": numeric_level,
            "displayLevel": display_level,
            "prompt": prompt,
            "correctAnswer": correct,
            "wrongAnswers": wrong_answers,
            "explanation": visible_correct,
            "visibleCorrectExplanation": visible_correct,
            "visibleWrongExplanations": build_visible_wrong(row, wrong_answers, old_question, correct),
            "sourceBank": "V9.1 final CSV kept 100/200/300",
            "questionScope": question_scope,
            "sourceQuestionId": source_id,
            "sourceUrl": source_url,
            "sourceNote": source_note,
            "sectionId": section_id,
            "sectionIds": [section_id],
            "guidingSectionPrimary": clean(row.get("guiding_section")) or section_title,
            "sectionInferenceNote": "Direct from V9.1 final CSV source file.",
            "sourceId": source_id,
            "sourceType": source_type,
        }
    )

    if entry_id:
        base["entryId"] = entry_id
    else:
        base.pop("entryId", None)

    for generated_field in ("stableId", "distractors", "placements", "sectionPlacementIds"):
        base.pop(generated_field, None)

    return base, stats


def compat_question(question: dict) -> dict:
    stripped = dict(question)
    for key in ("sourceId", "sourceType", "entryId", "stableId", "distractors", "placements", "sectionPlacementIds"):
        stripped.pop(key, None)
    stripped["id"] = stripped.get("sourceQuestionId") or stripped.get("id")
    return stripped


def load_csv(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        rows = []
        for row_number, row in enumerate(csv.DictReader(handle), start=2):
            row["_row_number"] = row_number
            row["_csv_path"] = str(path)
            rows.append(row)
    return rows


def old_question_indexes(section_questions: dict) -> tuple[dict, dict, list]:
    by_entry_level = {}
    guide_by_prompt = {}
    guide_in_order = []
    for level_key, questions in (section_questions.get("levels") or {}).items():
        for question in questions or []:
            if question.get("sourceType") == "entry.quizQuestions" and question.get("entryId"):
                by_entry_level[(str(level_key), question["entryId"])] = question
            elif question.get("sourceType") == "section.guideQuestions" or str(level_key) == "300":
                guide_in_order.append(question)
                guide_by_prompt[(str(level_key), normalize(question.get("prompt")))] = question
    return by_entry_level, guide_by_prompt, guide_in_order


def update_theme_from_csv(csv_rows: list[dict]) -> dict:
    by_section = defaultdict(list)
    for row in csv_rows:
        by_section[clean(row.get("guiding_section_id"))].append(row)

    report = {
        "csvRows": len(csv_rows),
        "levels": dict(Counter(clean(row.get("level")) for row in csv_rows)),
        "sections": {},
        "blankChoicesFilledFromCurrent": 0,
        "expectedAnswerNotInChoices": 0,
        "entryTitleMismatches": [],
    }

    built_by_section = {}
    for section_id, rows in sorted(by_section.items()):
        section_dir = SECTIONS_DIR / section_id
        questions_path = section_dir / "questions.json"
        raw_path = section_dir / "raw-content.json"
        section_path = section_dir / "section.json"
        if not questions_path.exists() or not raw_path.exists() or not section_path.exists():
            raise FileNotFoundError(f"Missing section files for {section_id}")

        old_questions = read_json(questions_path)
        raw_content = read_json(raw_path)
        section_data = read_json(section_path)
        by_entry_level, guide_by_prompt, guide_in_order = old_question_indexes(old_questions)
        raw_entries = raw_content.get("entries") or []
        new_levels = {"100": [], "200": [], "300": []}
        entry_questions = defaultdict(list)
        entry_questions_by_index = defaultdict(list)
        guide_sequence = 0
        guide_cursor = 0

        for level_key in ("100", "200"):
            level_rows = [row for row in rows if clean(row.get("level")) == level_key]
            level_rows.sort(key=lambda item: (int(clean(item.get("entry_index")) or 0), int(item["_row_number"])))
            for sequence, row in enumerate(level_rows, start=1):
                entry_index = int(clean(row.get("entry_index")) or "0")
                if entry_index < 1 or entry_index > len(raw_entries):
                    raise IndexError(f"Entry index {entry_index} out of range for {section_id}")
                entry = raw_entries[entry_index - 1]
                csv_title = normalize(row.get("entry_title"))
                if csv_title and csv_title != normalize(entry.get("title")):
                    report["entryTitleMismatches"].append(
                        {
                            "sectionId": section_id,
                            "entryIndex": entry_index,
                            "csvTitle": clean(row.get("entry_title")),
                            "rawTitle": clean(entry.get("title")),
                        }
                    )
                old_question = by_entry_level.get((level_key, entry["id"]))
                question, stats = build_question(
                    row,
                    section_id,
                    clean(section_data.get("originalTitle") or section_data.get("title")),
                    level_key,
                    sequence,
                    old_question,
                    entry["id"],
                )
                new_levels[level_key].append(question)
                entry_questions[entry["id"]].append(question["id"])
                entry_questions_by_index[entry_index - 1].append(question)
                report["blankChoicesFilledFromCurrent"] += int(stats["blank_choices_filled_from_current"])
                report["expectedAnswerNotInChoices"] += int(stats["expected_answer_not_in_choices"])

        guide_rows = [row for row in rows if clean(row.get("level")) == "300"]
        guide_rows.sort(key=lambda item: int(item["_row_number"]))
        for row in guide_rows:
            guide_sequence += 1
            old_question = guide_by_prompt.get(("300", normalize(row.get("question_in_app_or_guide") or row.get("updated_question"))))
            if old_question is None and guide_cursor < len(guide_in_order):
                old_question = guide_in_order[guide_cursor]
            guide_cursor += 1
            question, stats = build_question(
                row,
                section_id,
                clean(section_data.get("originalTitle") or section_data.get("title")),
                "300",
                guide_sequence,
                old_question,
                None,
            )
            new_levels["300"].append(question)
            report["blankChoicesFilledFromCurrent"] += int(stats["blank_choices_filled_from_current"])
            report["expectedAnswerNotInChoices"] += int(stats["expected_answer_not_in_choices"])

        raw_entries_by_id = {entry["id"]: entry for entry in raw_entries}
        for entry_id, ids in entry_questions.items():
            raw_entries_by_id[entry_id]["questionIds"] = ids
        for entry in raw_entries:
            if entry["id"] not in entry_questions:
                entry["questionIds"] = []

        section_questions = {
            "id": f"questions.{section_id}",
            "sectionId": section_id,
            "levels": new_levels,
        }
        write_json(questions_path, section_questions)
        write_json(raw_path, raw_content)
        built_by_section[section_id] = {
            "entryQuestions": dict(entry_questions),
            "entryQuestionsByIndex": {
                str(index): questions
                for index, questions in entry_questions_by_index.items()
            },
            "guideQuestions": new_levels["300"],
            "levels": new_levels,
        }
        report["sections"][section_id] = {
            "100": len(new_levels["100"]),
            "200": len(new_levels["200"]),
            "300": len(new_levels["300"]),
        }

    metadata_path = THEME_DIR / "compat" / "raw-content-metadata.json"
    metadata = read_json(metadata_path)
    now = datetime.now(timezone.utc).isoformat()
    metadata["questionsUpdatedFrom"] = str(Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_CSV)
    metadata["questionsUpdatedAt"] = now
    metadata["finalQuestionBankUpdatedFrom"] = metadata["questionsUpdatedFrom"]
    metadata["finalQuestionBankUpdatedAt"] = now
    metadata["questionLevelPolicy"] = (
        "Final V9.1 CSV source of truth: levels 100/200 live on raw-content entries; "
        "level 300 lives on section guideQuestions; games draw only levels 100/200/300. "
        "Levels 400/500 and fullVoyageQuestions are removed from the active runtime."
    )
    write_json(metadata_path, metadata)
    write_json(THEME_DIR / "compat" / "full-voyage-order.json", [])

    return {"report": report, "builtBySection": built_by_section}


def update_window_raw_bank(path: Path, built_by_section: dict, csv_path: Path) -> dict:
    if not path.exists():
        return {"path": str(path), "updated": False}
    bank = read_window_json(path, "WSC_RAW_CONTENT_BANK")
    for section_id, built in built_by_section.items():
        section = (bank.get("sections") or {}).get(section_id)
        if not section:
            continue
        entry_questions_by_id = defaultdict(list)
        entry_questions_by_index = {
            int(index): [compat_question(question) for question in questions]
            for index, questions in (built.get("entryQuestionsByIndex") or {}).items()
        }
        for level_key in ("100", "200"):
            for question in built["levels"][level_key]:
                entry_questions_by_id[question["entryId"]].append(compat_question(question))
        for index, entry in enumerate(section.get("entries") or []):
            entry["quizQuestions"] = entry_questions_by_id.get(entry.get("id")) or entry_questions_by_index.get(index, [])
        section["guideQuestions"] = [compat_question(question) for question in built["guideQuestions"]]

    now = datetime.now(timezone.utc).isoformat()
    bank["fullVoyageQuestions"] = []
    bank["questionsUpdatedFrom"] = str(csv_path)
    bank["questionsUpdatedAt"] = now
    bank["finalQuestionBankUpdatedFrom"] = str(csv_path)
    bank["finalQuestionBankUpdatedAt"] = now
    bank["questionLevelPolicy"] = (
        "Final V9.1 CSV source of truth: levels 100/200 live on raw-content entries; "
        "level 300 lives on section guideQuestions; games draw only levels 100/200/300. "
        "Levels 400/500 and fullVoyageQuestions are removed from the active runtime."
    )
    write_window_json(path, "WSC_RAW_CONTENT_BANK", bank)
    return {"path": str(path), "updated": True}


def main() -> int:
    csv_path = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_CSV
    if not csv_path.exists():
        raise FileNotFoundError(csv_path)

    rows = load_csv(csv_path)
    levels = Counter(clean(row.get("level")) for row in rows)
    if set(levels) != {"100", "200", "300"}:
        raise ValueError(f"Unexpected levels in CSV: {dict(levels)}")

    result = update_theme_from_csv(rows)
    window_updates = [
        update_window_raw_bank(ROOT / "app" / "raw-content-bank.js", result["builtBySection"], csv_path),
        update_window_raw_bank(ROOT / "app" / "generated" / "current-runtime" / "raw-content-bank.js", result["builtBySection"], csv_path),
    ]
    result["report"]["windowUpdates"] = window_updates

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORT_DIR / "v9_1_question_csv_apply_report.json"
    write_json(report_path, result["report"])
    print(json.dumps({"report": str(report_path), **result["report"]}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
