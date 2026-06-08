#!/usr/bin/env python3
"""Build per-section packets for B1 guide rewrites."""

from __future__ import annotations

import html
import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
THEME_SECTIONS = ROOT / "content" / "themes" / "2026" / "sections"
SOURCE_TEXT_DIR = ROOT / "outputs" / "guide_rewrite" / "source_text"
OUT_DIR = ROOT / "outputs" / "guide_rewrite" / "section_source_packets"


STOPWORDS = {
    "the", "and", "with", "from", "that", "this", "what", "when", "where", "which", "why",
    "into", "your", "there", "their", "they", "them", "were", "will", "still", "need",
    "guiding", "section", "questions", "chapter", "official", "wsc", "entry", "entries",
}


def clean_text(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", str(value or ""))
    text = html.unescape(text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def keywords(*values: str) -> list[str]:
    tokens = []
    for value in values:
        for token in re.findall(r"[A-Za-z0-9][A-Za-z0-9'’.-]{2,}", value or ""):
            key = norm(token)
            if len(key) >= 4 and key not in STOPWORDS:
                tokens.append(key)
    seen = set()
    out = []
    for token in tokens:
        if token not in seen:
            seen.add(token)
            out.append(token)
    return out[:18]


def headings_from_guide(guide_html: str) -> list[dict]:
    heads = []
    for match in re.finditer(r"<h([234])[^>]*>(.*?)</h\1>", guide_html, re.S):
        heads.append({"level": int(match.group(1)), "text": clean_text(match.group(2))})
    return heads


def source_snippets_for_terms(terms: list[str], max_snippets: int = 10) -> list[dict]:
    snippets = []
    if not SOURCE_TEXT_DIR.exists():
        return snippets
    term_patterns = [re.compile(re.escape(term), re.I) for term in terms if len(term) >= 4]
    for source_path in sorted(SOURCE_TEXT_DIR.glob("*.txt")):
        text = source_path.read_text(encoding="utf-8", errors="replace")
        compact = re.sub(r"\s+", " ", text)
        for pattern in term_patterns:
            found = pattern.search(compact)
            if not found:
                continue
            start = max(0, found.start() - 420)
            end = min(len(compact), found.end() + 620)
            snippet = compact[start:end].strip()
            snippets.append(
                {
                    "source": str(source_path.relative_to(ROOT)),
                    "term": pattern.pattern,
                    "snippet": snippet,
                }
            )
            break
        if len(snippets) >= max_snippets:
            break
    return snippets


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    summary = {"builtAt": datetime.now(timezone.utc).isoformat(), "sections": {}}

    for section_dir in sorted(THEME_SECTIONS.iterdir()):
        if not section_dir.is_dir():
            continue
        raw_path = section_dir / "raw-content.json"
        guide_path = section_dir / "guide.html"
        section_path = section_dir / "section.json"
        if not raw_path.exists() or not guide_path.exists() or not section_path.exists():
            continue
        raw = json.loads(raw_path.read_text(encoding="utf-8"))
        section = json.loads(section_path.read_text(encoding="utf-8"))
        guide_html = guide_path.read_text(encoding="utf-8")
        heading_terms = keywords(section.get("title", ""), section.get("originalTitle", ""), guide_html)

        entries = []
        all_terms = heading_terms[:]
        for entry in raw.get("entries", []):
            entry_terms = keywords(
                entry.get("title", ""),
                entry.get("rawOfficialText", ""),
                entry.get("studentExplanation", ""),
                " ".join(link.get("label", "") for link in entry.get("links", []) if isinstance(link, dict)),
            )
            all_terms.extend(entry_terms[:6])
            entries.append(
                {
                    "id": entry.get("id"),
                    "title": entry.get("title"),
                    "officialText": clean_text(entry.get("rawOfficialText", "")),
                    "studentExplanation": clean_text(entry.get("studentExplanation", "")),
                    "whyItMatters": clean_text(entry.get("whyItMatters", "")),
                    "takeaway": clean_text(entry.get("takeaway", "")),
                    "subjects": entry.get("subjects", []),
                    "bigIdeas": entry.get("bigIdeas", []),
                    "examples": entry.get("examples", []),
                    "links": entry.get("links", []),
                    "keywords": entry_terms,
                }
            )

        deduped_terms = []
        seen = set()
        for term in all_terms:
            if term not in seen:
                seen.add(term)
                deduped_terms.append(term)

        packet = {
            "sectionId": section_dir.name,
            "title": section.get("title"),
            "originalTitle": section.get("originalTitle"),
            "guideHeadingsToPreserve": headings_from_guide(guide_html),
            "entries": entries,
            "sourceSnippets": source_snippets_for_terms(deduped_terms, max_snippets=14),
        }
        out_path = OUT_DIR / f"{section_dir.name}.json"
        out_path.write_text(json.dumps(packet, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        summary["sections"][section_dir.name] = {
            "entries": len(entries),
            "headings": len(packet["guideHeadingsToPreserve"]),
            "snippets": len(packet["sourceSnippets"]),
            "packet": str(out_path.relative_to(ROOT)),
        }

    (OUT_DIR / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
