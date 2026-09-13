#!/usr/bin/env python3
"""Validate the 15 long-form 2026 guide sources before document export."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

from lxml import html
from lxml.html import HtmlElement


ROOT = Path(__file__).resolve().parents[2]
SECTIONS_ROOT = ROOT / "content/themes/2026/sections"
CURRICULUM_GRAPH = (
    ROOT / "tmp/curriculum_2026_audit/official_curriculum_graph.json"
)
FORBIDDEN_DASHES = {"\u2011", "\u2013", "\u2014"}
WORD_PATTERN = re.compile(r"\b[\w'’]+(?:-[\w'’]+)*\b", re.UNICODE)
PLACEHOLDER_PATTERN = re.compile(
    r"\b(?:TODO|TBD|FIXME|PLACEHOLDER|INSERT SOURCE|LOREM IPSUM)\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Section:
    slug: str
    title: str
    order: int


@dataclass(frozen=True)
class OfficialLink:
    id: str
    label: str
    url: str


def _words(text: str) -> int:
    return len(WORD_PATTERN.findall(text))


def _load_sections() -> list[Section]:
    sections: list[Section] = []
    for metadata_path in SECTIONS_ROOT.glob("*/section.json"):
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        if metadata.get("themeId") != "wsc-2026":
            continue
        sections.append(
            Section(
                slug=metadata["id"],
                title=metadata["title"],
                order=int(metadata["order"]),
            )
        )
    return sorted(sections, key=lambda section: section.order)


def _official_links_by_order() -> dict[int, list[OfficialLink]]:
    graph = json.loads(CURRICULUM_GRAPH.read_text(encoding="utf-8"))
    links_by_order: dict[int, list[OfficialLink]] = {}
    for graph_section in graph["sections"]:
        links: list[OfficialLink] = []
        for item in graph_section.get("items", []):
            for link in item.get("links", []):
                links.append(
                    OfficialLink(
                        id=link["id"],
                        label=link["label"],
                        url=link["url"],
                    )
                )
        links_by_order[int(graph_section["index"])] = links
    return links_by_order


def _class_tokens(element: HtmlElement) -> set[str]:
    return set((element.get("class") or "").split())


def _chapter_metrics(
    article: HtmlElement, official_links: list[OfficialLink]
) -> list[tuple[str, int, list[str]]]:
    metrics: list[tuple[str, int, list[str]]] = []
    children = list(article)
    for index, element in enumerate(children):
        if element.tag != "h3" or "book-conclusion" in _class_tokens(element):
            continue
        heading = " ".join(element.text_content().split())
        if not heading.lower().startswith("chapter "):
            continue
        text_parts: list[str] = []
        for sibling in children[index + 1 :]:
            if sibling.tag == "h3":
                break
            text_parts.append(sibling.text_content())
        chapter_text = " ".join(text_parts)
        link_ids = [link.id for link in official_links if link.id in chapter_text]
        metrics.append((heading, _words(chapter_text), link_ids))
    return metrics


def _validate_section(
    section: Section,
    official_links: list[OfficialLink],
    *,
    minimum_chapter_words: int,
    minimum_words_per_official_link: int,
) -> tuple[list[str], dict[str, object]]:
    guide_path = SECTIONS_ROOT / section.slug / "guide.html"
    errors: list[str] = []
    source = guide_path.read_text(encoding="utf-8")
    root = html.fragment_fromstring(source, create_parent="div")
    articles = root.xpath("./article")
    article = articles[0] if len(articles) == 1 else None

    if article is None:
        errors.append("expected exactly one top-level article")
        article = root
    elif "regular-guide-book" not in _class_tokens(article):
        errors.append("top-level article is missing regular-guide-book")

    if len(article.xpath("./h2")) != 1:
        errors.append("expected exactly one direct h2 title")
    if len(article.xpath("./p[contains(concat(' ', normalize-space(@class), ' '), ' book-deck ')]")) != 1:
        errors.append("expected exactly one direct p.book-deck")
    if article.xpath(".//table"):
        errors.append("tables are not allowed in book guides")

    conclusions = article.xpath(
        ".//h3[contains(concat(' ', normalize-space(@class), ' '), ' book-conclusion ')]"
    )
    if len(conclusions) != 1:
        errors.append("expected exactly one h3.book-conclusion")

    chapter_metrics = _chapter_metrics(article, official_links)
    if not chapter_metrics:
        errors.append("no numbered Chapter h3 headings found")
    for heading, word_count, link_ids in chapter_metrics:
        required_words = max(
            minimum_chapter_words,
            minimum_words_per_official_link * len(link_ids),
        )
        if word_count < required_words:
            errors.append(
                f"{heading!r} has {word_count} words; minimum is "
                f"{required_words} for {len(link_ids)} official link(s)"
            )

    source_notes = article.xpath(
        ".//*[contains(concat(' ', normalize-space(@class), ' '), ' book-source-note ') "
        "or contains(concat(' ', normalize-space(@class), ' '), ' source-note ')]"
    )
    if len(source_notes) < len(chapter_metrics):
        errors.append(
            f"only {len(source_notes)} source notes for {len(chapter_metrics)} chapters"
        )

    for dash in sorted(FORBIDDEN_DASHES):
        if dash in source:
            errors.append(f"contains forbidden typographic dash U+{ord(dash):04X}")
    if PLACEHOLDER_PATTERN.search(source):
        errors.append("contains an editorial placeholder")

    anchors = article.xpath(".//a[@href]")
    hrefs = {anchor.get("href") for anchor in anchors}
    visible_text = " ".join(article.text_content().split())
    for anchor in anchors:
        if anchor.get("target") != "_blank":
            errors.append(f"link missing target=_blank: {anchor.get('href')}")
        rel_tokens = set((anchor.get("rel") or "").split())
        if not {"noopener", "noreferrer"}.issubset(rel_tokens):
            errors.append(f"link missing safe rel tokens: {anchor.get('href')}")

    missing_link_ids = [link.id for link in official_links if link.id not in visible_text]
    if missing_link_ids:
        errors.append("missing official link IDs: " + ", ".join(missing_link_ids))

    exact_official_urls = sum(link.url in hrefs for link in official_links)
    metrics = {
        "slug": section.slug,
        "words": _words(article.text_content()),
        "chapters": len(chapter_metrics),
        "chapterWords": {
            heading: word_count for heading, word_count, _ in chapter_metrics
        },
        "chapterOfficialLinks": {
            heading: link_ids for heading, _, link_ids in chapter_metrics
        },
        "sourceNotes": len(source_notes),
        "links": len(anchors),
        "officialLinkIds": len(official_links),
        "exactOfficialUrls": exact_official_urls,
    }
    return errors, metrics


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--section",
        action="append",
        help="Validate only this slug; repeat to select several sections.",
    )
    parser.add_argument(
        "--minimum-chapter-words",
        type=int,
        default=850,
        help="Minimum narrative words between a Chapter heading and the next h3.",
    )
    parser.add_argument(
        "--minimum-words-per-official-link",
        type=int,
        default=95,
        help="Raise the chapter floor when many official links share a chapter.",
    )
    parser.add_argument("--json", action="store_true", help="Print JSON metrics.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    sections = _load_sections()
    if args.section:
        wanted = set(args.section)
        sections = [section for section in sections if section.slug in wanted]
        unknown = wanted - {section.slug for section in sections}
        if unknown:
            print("Unknown section slug(s): " + ", ".join(sorted(unknown)), file=sys.stderr)
            return 2

    links_by_order = _official_links_by_order()
    all_errors: list[tuple[str, str]] = []
    all_metrics: list[dict[str, object]] = []
    for section in sections:
        errors, metrics = _validate_section(
            section,
            links_by_order.get(section.order, []),
            minimum_chapter_words=args.minimum_chapter_words,
            minimum_words_per_official_link=args.minimum_words_per_official_link,
        )
        all_metrics.append(metrics)
        for error in errors:
            all_errors.append((section.slug, error))

    if args.json:
        print(json.dumps({"guides": all_metrics, "errors": all_errors}, indent=2))
    else:
        for metrics in all_metrics:
            exact = f"{metrics['exactOfficialUrls']}/{metrics['officialLinkIds']}"
            print(
                f"{metrics['slug']}: {metrics['words']} words, "
                f"{metrics['chapters']} chapters, {metrics['sourceNotes']} source notes, "
                f"{metrics['links']} links, {exact} exact official URLs"
            )
        for slug, error in all_errors:
            print(f"ERROR {slug}: {error}", file=sys.stderr)

    if all_errors:
        print(f"Validation failed with {len(all_errors)} error(s).", file=sys.stderr)
        return 1
    if not args.json:
        print(f"Validated {len(all_metrics)} long-form guide(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
