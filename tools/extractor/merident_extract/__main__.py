"""CLI:  python -m merident_extract {mcq,lecture,text} FILE.pdf [options]"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import appbank
from .chunker import chunk_pages
from .mcq import parse_mcqs, to_app_rows
from .pdftext import extract_clean


def _read_text(path: str, ocr: str):
    if path.lower().endswith((".txt", ".md")):
        from .pdftext import Page, clean_pages
        return clean_pages([Page(1, Path(path).read_text(encoding="utf-8"))])
    return extract_clean(path, ocr=ocr)


def cmd_mcq(a) -> int:
    pages = _read_text(a.file, a.ocr)
    text = "\n".join(p.text for p in pages)
    qs = parse_mcqs(text, default_subject=a.subject)
    rows, review = to_app_rows(qs, exam=a.exam, start_id=appbank.FIRST_ID, subject=a.subject,
                               is_pyq=a.pyq, is_important=a.important, source=a.source or Path(a.file).stem)
    out = Path(a.out or Path(a.file).with_suffix(".mcq.json"))
    out.write_text(json.dumps({"questions": rows, "needs_review": review}, indent=1, ensure_ascii=False), encoding="utf-8")
    ocr_pages = [p.number for p in pages if p.ocr]
    print(f"✓ {len(rows)} questions ready, {len(review)} need review → {out}")
    if ocr_pages:
        print(f"  OCR used on pages: {ocr_pages}")
    for r in review[:10]:
        print(f"  ⚠ {r['source']}: {', '.join(r['problems'])} – “{r['question'][:60]}”")
    if a.merge:
        added, skipped = appbank.merge(rows)
        print(f"✓ merged into the app bank: {added} added, {skipped} duplicates skipped ({appbank.DEFAULT_PATH})")
    return 0 if rows else 1


def cmd_lecture(a) -> int:
    pages = _read_text(a.file, a.ocr)
    chunks = chunk_pages(pages, max_words=a.max_words, overlap_words=a.overlap)
    empty = [p.number for p in pages if not p.text.strip()]
    out = Path(a.out or Path(a.file).with_suffix(".chunks.json"))
    out.write_text(json.dumps({"source": Path(a.file).name, "page_count": len(pages), "empty_pages": empty,
                               "chunks": chunks}, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"✓ {len(pages)} pages → {len(chunks)} chunks → {out}")
    if empty:
        print(f"  ⚠ no text on pages {empty} (scanned? install tesseract and use --ocr auto)")
    return 0


def cmd_text(a) -> int:
    for p in _read_text(a.file, a.ocr):
        print(f"----- page {p.number}{' (OCR)' if p.ocr else ''} -----\n{p.text}")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="merident_extract", description="MeriDent Prep PDF extraction tool")
    sub = ap.add_subparsers(dest="cmd", required=True)
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("file", help="PDF (or .txt) to read")
    common.add_argument("--ocr", choices=["auto", "always", "never"], default="auto", help="OCR scanned pages (default: auto)")
    common.add_argument("--out", help="output JSON path")

    m = sub.add_parser("mcq", parents=[common], help="question paper → MeriDent Prep MCQs")
    m.add_argument("--exam", choices=["NEET MDS", "ADC"], default="NEET MDS")
    m.add_argument("--subject", help="subject for every question (else read from 'Subject:' lines)")
    m.add_argument("--pyq", action="store_true", help="mark as PYQ")
    m.add_argument("--important", action="store_true", help="mark as Most Important")
    m.add_argument("--source", help="source label stored with each question")
    m.add_argument("--merge", action="store_true", help="add valid questions to src/data/imported.js")
    m.set_defaults(fn=cmd_mcq)

    l = sub.add_parser("lecture", parents=[common], help="lecture slides → page-cited chunks (StudySync)")
    l.add_argument("--max-words", type=int, default=350)
    l.add_argument("--overlap", type=int, default=40)
    l.set_defaults(fn=cmd_lecture)

    t = sub.add_parser("text", parents=[common], help="print cleaned text per page")
    t.set_defaults(fn=cmd_text)

    a = ap.parse_args(argv)
    return a.fn(a)


if __name__ == "__main__":
    sys.exit(main())
