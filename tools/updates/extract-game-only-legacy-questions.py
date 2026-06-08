#!/usr/bin/env python3
"""Extract old level 400/500 questions into a game-only compatibility file."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
RAW_BANK_PATH = ROOT / "app" / "raw-content-bank.js"
OUT_PATH = ROOT / "content" / "themes" / "2026" / "compat" / "game-only-legacy-questions.json"


def load_raw_bank() -> dict:
    text = RAW_BANK_PATH.read_text(encoding="utf-8")
    match = re.match(r"\s*window\.WSC_RAW_CONTENT_BANK\s*=\s*(.*);\s*\Z", text, re.S)
    if not match:
        raise ValueError(f"Could not parse {RAW_BANK_PATH}")
    return json.loads(match.group(1))


def normalized_question(question: dict, section_id: str, entry_index: int, question_index: int) -> dict:
    level = int(question.get("level") or 0)
    return {
        "id": question.get("id") or f"legacy-game-{section_id}-{entry_index + 1:03d}-{level}-{question_index + 1:03d}",
        "level": level,
        "displayLevel": int(question.get("displayLevel") or level * 100),
        "prompt": question.get("prompt") or question.get("question") or "",
        "correctAnswer": question.get("correctAnswer") or "",
        "wrongAnswers": question.get("wrongAnswers") or [],
        "explanation": question.get("explanation") or question.get("visibleCorrectExplanation") or "",
        "visibleCorrectExplanation": question.get("visibleCorrectExplanation") or question.get("explanation") or "",
        "visibleWrongExplanations": question.get("visibleWrongExplanations") or [],
        "sourceType": "gameOnly.legacy400500",
    }


def main() -> int:
    raw_bank = load_raw_bank()
    sections = {}
    total = 0

    for section_id, section in raw_bank.get("sections", {}).items():
        entries = []
        for entry_index, entry in enumerate(section.get("entries", [])):
            questions = []
            for question_index, question in enumerate(entry.get("legacyQuizQuestions", [])):
                if int(question.get("level") or 0) not in {4, 5}:
                    continue;
                normalized = normalized_question(question, section_id, entry_index, question_index)
                if not normalized["prompt"] or not normalized["correctAnswer"] or len(normalized["wrongAnswers"]) < 3:
                    continue
                questions.append(normalized)

            if questions:
                entries.append({
                    "entryTitle": entry.get("title", ""),
                    "questions": questions,
                })
                total += len(questions)

        if entries:
            sections[section_id] = {"entries": entries}

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": str(RAW_BANK_PATH.relative_to(ROOT)),
        "purpose": "Game-only restoration of legacy level 400/500 questions. These are not raw-content display questions and not guide questions.",
        "sections": sections,
    }

    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(OUT_PATH.relative_to(ROOT)), "questions": total}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
