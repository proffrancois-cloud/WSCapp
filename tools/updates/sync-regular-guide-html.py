#!/usr/bin/env python3
"""Sync rebuilt guide HTML into compatibility metadata and legacy raw bank."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
THEME_DIR = ROOT / "content" / "themes" / "2026"
MANIFEST_PATH = THEME_DIR / "manifest.json"
METADATA_PATH = THEME_DIR / "compat" / "raw-content-metadata.json"
RAW_BANK_PATH = ROOT / "app" / "raw-content-bank.js"


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def theme_path(relative_path: str) -> Path:
    return THEME_DIR / relative_path.lstrip("./")


def build_regular_guides() -> list[dict]:
    manifest = read_json(MANIFEST_PATH)
    regular_guides = []

    for manifest_section in manifest["sections"]:
        section_path = theme_path(manifest_section["path"])
        guide_path = theme_path(manifest_section["content"]["guide"])
        section = read_json(section_path)
        guide = read_json(guide_path)
        guide_html_path = guide_path.parent / guide.get("htmlPath", "./guide.html")
        guide_html = guide_html_path.read_text(encoding="utf-8")

        regular_guides.append(
            {
                "id": guide.get("id") or f"guide.{section['id']}",
                "sectionId": section["id"],
                "title": guide.get("title") or section.get("title") or section["id"],
                "href": guide.get("href", ""),
                "pdfHref": guide.get("pdfHref", ""),
                "docxHref": guide.get("docxHref", ""),
                "htmlContent": guide_html,
                "renderMode": "inline-html",
            }
        )

    return regular_guides


def sync_metadata(regular_guides: list[dict], timestamp: str) -> None:
    metadata = read_json(METADATA_PATH)
    metadata["regularGuides"] = regular_guides
    metadata["regularGuidesB1RewriteSyncedAt"] = timestamp
    metadata["regularGuidesB1RewriteSections"] = [guide["sectionId"] for guide in regular_guides]
    METADATA_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_raw_bank(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    match = re.match(r"\s*window\.WSC_RAW_CONTENT_BANK\s*=\s*(.*);\s*\Z", text, re.S)
    if not match:
        raise ValueError(f"Could not parse {path}")
    return json.loads(match.group(1))


def sync_legacy_raw_bank(regular_guides: list[dict], timestamp: str) -> None:
    raw_bank = load_raw_bank(RAW_BANK_PATH)
    by_section = {guide["sectionId"]: guide for guide in regular_guides}

    for section_id, section in raw_bank.get("sections", {}).items():
        if section_id in by_section:
            section["regularGuide"] = by_section[section_id]

    raw_bank["regularGuides"] = regular_guides
    raw_bank["regularGuidesB1RewriteSyncedAt"] = timestamp
    raw_bank["regularGuidesB1RewriteSections"] = [guide["sectionId"] for guide in regular_guides]
    RAW_BANK_PATH.write_text(
        "window.WSC_RAW_CONTENT_BANK = "
        + json.dumps(raw_bank, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )


def main() -> int:
    timestamp = datetime.now(timezone.utc).isoformat()
    regular_guides = build_regular_guides()
    sync_metadata(regular_guides, timestamp)
    sync_legacy_raw_bank(regular_guides, timestamp)
    print(
        json.dumps(
            {
                "syncedAt": timestamp,
                "sections": len(regular_guides),
                "metadata": str(METADATA_PATH.relative_to(ROOT)),
                "legacyRawBank": str(RAW_BANK_PATH.relative_to(ROOT)),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
