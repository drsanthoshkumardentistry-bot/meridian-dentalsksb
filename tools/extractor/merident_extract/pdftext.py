"""Page-level text extraction with header/footer cleanup and an optional OCR fallback."""
from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass

import pdfplumber

BULLETS = re.compile(r"^[\s]*[•●▪■◦○\-–—*➢➤►✓✔]+\s*")
PAGE_NO = re.compile(r"^\s*(page\s*)?\d{1,4}(\s*(/|of)\s*\d{1,4})?\s*$", re.I)


@dataclass
class Page:
    number: int          # 1-based
    text: str
    ocr: bool = False


def _ocr(page) -> str:
    try:
        import pytesseract  # optional dependency
    except ImportError:
        return ""
    try:
        img = page.to_image(resolution=300).original
        return pytesseract.image_to_string(img)
    except Exception:  # tesseract missing or render failure – degrade gracefully
        return ""


def _norm_line(line: str) -> str:
    line = line.replace(" ", " ").replace("ﬁ", "fi").replace("ﬂ", "fl")
    line = re.sub(r"[ \t]+", " ", line).strip()
    return line


def extract_pages(path: str, ocr: str = "auto", min_chars: int = 25) -> list[Page]:
    """Extract text per page.

    ocr: "auto" – OCR only pages with almost no text layer; "always"; "never".
    """
    pages: list[Page] = []
    with pdfplumber.open(path) as pdf:
        for i, p in enumerate(pdf.pages, start=1):
            text = p.extract_text(x_tolerance=1.5, y_tolerance=3) or ""
            used_ocr = False
            if ocr == "always" or (ocr == "auto" and len(text.strip()) < min_chars):
                o = _ocr(p)
                if len(o.strip()) > len(text.strip()):
                    text, used_ocr = o, True
            pages.append(Page(i, text, used_ocr))
    return pages


def clean_pages(pages: list[Page], repeat_ratio: float = 0.5) -> list[Page]:
    """Remove running headers/footers, page numbers and bullet glyphs; join hyphenated words."""
    lines_per_page = [[_norm_line(l) for l in p.text.splitlines()] for p in pages]
    lines_per_page = [[l for l in ls if l] for ls in lines_per_page]

    # A line that appears on more than `repeat_ratio` of pages (first/last 2 lines) is a header/footer.
    edge = Counter()
    for ls in lines_per_page:
        for l in set(ls[:2] + ls[-2:]):
            edge[l.lower()] += 1
    n = max(1, len(pages))
    running = {l for l, c in edge.items() if c >= 2 and c / n > repeat_ratio}

    out: list[Page] = []
    for p, ls in zip(pages, lines_per_page):
        kept = []
        for l in ls:
            if l.lower() in running or PAGE_NO.match(l):
                continue
            l = BULLETS.sub("", l)
            if not l:
                continue
            if kept and kept[-1].endswith("-") and l[:1].islower():
                kept[-1] = kept[-1][:-1] + l       # re-join hyphenated word
            else:
                kept.append(l)
        out.append(Page(p.number, "\n".join(kept), p.ocr))
    return out


def extract_clean(path: str, ocr: str = "auto") -> list[Page]:
    return clean_pages(extract_pages(path, ocr=ocr))
