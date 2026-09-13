#!/usr/bin/env python3
"""Apply the approved WSCapp visual reskin to the complete regular-guide PDFs."""

from __future__ import annotations

import argparse
import re
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject, NameObject
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[2]
ARCHIVE_DIR = ROOT / "output/pdf/source-before-wscapp-style"
OUTPUT_DIR = ROOT / "output/pdf"
GUIDE_MASCOT = ROOT / "app/assets/mascot/library/final-pack/Guide.png"

GUIDES = {
    "call": {
        "source": "call-of-duty-free.pdf",
        "output": "call-of-duty-free-wscapp.pdf",
    },
    "draft": {
        "source": "theres-a-draft-in-here.pdf",
        "output": "theres-a-draft-in-here-wscapp.pdf",
    },
}


# Exact PDF color operators from the current source documents, mapped to the
# current WSCapp palette. Typography, geometry, copy, tables, tags, outlines,
# and annotations remain unchanged.
COLOR_REPLACEMENTS = {
    # Navy headings and table headers -> WSCapp olive-brown.
    b"0.0901960784 0.1960784314 0.3019607843 rg":
        b"0.4196078431 0.3058823529 0.0862745098 rg",
    # Body ink -> WSCapp cocoa ink.
    b"0.1254901961 0.168627451 0.2039215686 rg":
        b"0.2549019608 0.1647058824 0.0901960784 rg",
    # Secondary text -> warm muted brown.
    b"0.3725490196 0.4235294118 0.462745098 rg":
        b"0.4274509804 0.3215686275 0.2196078431 rg",
    # Both link blues -> WSCapp dark gold.
    b"0.137254902 0.4156862745 0.5803921569 rg":
        b"0.5098039216 0.3725490196 0.1215686275 rg",
    b"0.137254902 0.4156862745 0.5803921569 RG":
        b"0.5098039216 0.3725490196 0.1215686275 RG",
    b"0.0196078431 0.3882352941 0.7568627451 rg":
        b"0.5098039216 0.3725490196 0.1215686275 rg",
    b"0.0196078431 0.3882352941 0.7568627451 RG":
        b"0.5098039216 0.3725490196 0.1215686275 RG",
    # White table cells and header text -> warm white.
    b"1 1 1 rg": b"1 0.9803921569 0.9490196078 rg",
    # Cool alternating rows -> WSCapp cream.
    b"0.9529411765 0.9607843137 0.9647058824 rg":
        b"0.968627451 0.9176470588 0.8 rg",
    # Blue title rule -> WSCapp gold.
    b"0.3098039216 0.5058823529 0.7411764706 RG":
        b"0.7843137255 0.6117647059 0.2666666667 RG",
    # Black table grid -> warm brown.
    b"0 0 0 RG": b"0.5411764706 0.3882352941 0.2196078431 RG",
}


def artifact_stream(data: bytes) -> bytes:
    return b"/Artifact BMC\n" + data + b"\nEMC\n"


def make_mascot_overlay(width: float, height: float) -> object:
    buffer = BytesIO()
    overlay = canvas.Canvas(buffer, pagesize=(width, height), pageCompression=1)
    overlay.drawImage(
        ImageReader(str(GUIDE_MASCOT)),
        width - 110.3,
        height - 90.9,
        width=52,
        height=46,
        preserveAspectRatio=True,
        mask="auto",
        anchor="c",
    )
    overlay.showPage()
    overlay.save()
    buffer.seek(0)

    page = PdfReader(buffer).pages[0]
    overlay_data = page.get_contents().get_data()
    overlay_data = re.sub(
        rb"BT\s+/F\d+\s+12\s+Tf\s+14\.4\s+TL\s+ET\s*",
        b"",
        overlay_data,
    )
    resources = page[NameObject("/Resources")].get_object()
    if NameObject("/Font") in resources:
        del resources[NameObject("/Font")]

    stream = DecodedStreamObject()
    stream.set_data(artifact_stream(overlay_data))
    page[NameObject("/Contents")] = stream
    return page


def reskin_page_content(page: object, writer: PdfWriter) -> int:
    original = page.get_contents().get_data()
    recolored = original
    replacements = 0
    for source, target in COLOR_REPLACEMENTS.items():
        count = recolored.count(source)
        if count:
            replacements += count
            recolored = recolored.replace(source, target)

    width = float(page.mediabox.width)
    height = float(page.mediabox.height)
    background = artifact_stream(
        (
            b"q\n"
            b"1 0.9803921569 0.9490196078 rg\n"
            + f"0 0 {width:.3f} {height:.3f} re f\n".encode("ascii")
            + b"Q\n"
        )
    )
    stream = DecodedStreamObject()
    stream.set_data(background + recolored)
    page[NameObject("/Contents")] = writer._add_object(stream)
    return replacements


def build_guide(source: Path, output: Path) -> tuple[int, int]:
    reader = PdfReader(str(source))
    writer = PdfWriter(clone_from=reader)
    # ``clone_from`` preserves the document structure but pypdf otherwise
    # falls back to a PDF 1.3 header. Keep the source's 1.7 declaration so
    # the mascot's soft-mask transparency and the tagged structure are valid.
    writer.pdf_header = reader.pdf_header
    replacements = 0

    for index, page in enumerate(writer.pages):
        replacements += reskin_page_content(page, writer)
        if index == 0:
            page.merge_page(
                make_mascot_overlay(
                    float(page.mediabox.width),
                    float(page.mediabox.height),
                ),
                over=True,
            )

    writer.add_metadata(
        {
            "/WSCappReskin": "2026-07-14-v1",
            "/WSCappReskinNote": "Approved full-content cream-cocoa-gold visual treatment",
        }
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as handle:
        writer.write(handle)
    return len(writer.pages), replacements


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--guide", choices=("call", "draft", "all"), default="all")
    parser.add_argument("--source-dir", type=Path, default=ARCHIVE_DIR)
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    args = parser.parse_args()

    if not GUIDE_MASCOT.exists():
        raise FileNotFoundError(GUIDE_MASCOT)

    selected = GUIDES if args.guide == "all" else {args.guide: GUIDES[args.guide]}
    for key, config in selected.items():
        source = (args.source_dir / config["source"]).resolve()
        output = (args.output_dir / config["output"]).resolve()
        if not source.exists():
            raise FileNotFoundError(source)
        pages, replacements = build_guide(source, output)
        print(f"{key}: {pages} pages, {replacements} color replacements -> {output}")


if __name__ == "__main__":
    main()
