"""Split cleaned lecture pages into overlapping, page-cited chunks for StudySync (RAG)."""
from __future__ import annotations

import re

from .pdftext import Page

SENT = re.compile(r"(?<=[.!?;:])\s+|\n+")


def approx_tokens(text: str) -> int:
    return max(1, round(len(text.split()) * 1.33))


def chunk_pages(pages: list[Page], max_words: int = 350, overlap_words: int = 40) -> list[dict]:
    """Greedy sentence packing across pages; each chunk records the page range it covers."""
    units: list[tuple[int, str]] = []
    for p in pages:
        for s in SENT.split(p.text):
            s = s.strip()
            if s:
                units.append((p.number, s))

    chunks: list[dict] = []
    buf: list[tuple[int, str]] = []
    words = 0

    def flush():
        nonlocal buf, words
        if not buf:
            return
        text = " ".join(s for _, s in buf)
        chunks.append({
            "ordinal": len(chunks),
            "page_from": buf[0][0],
            "page_to": buf[-1][0],
            "content": text,
            "token_count": approx_tokens(text),
        })
        # keep a tail for overlap
        tail, n = [], 0
        for u in reversed(buf):
            n += len(u[1].split())
            tail.insert(0, u)
            if n >= overlap_words:
                break
        buf = tail if overlap_words else []
        words = sum(len(s.split()) for _, s in buf)

    for u in units:
        w = len(u[1].split())
        if words + w > max_words and words > overlap_words:
            flush()
        buf.append(u)
        words += w
    # final flush without re-emitting pure overlap
    if buf and (not chunks or " ".join(s for _, s in buf) not in chunks[-1]["content"]):
        text = " ".join(s for _, s in buf)
        chunks.append({"ordinal": len(chunks), "page_from": buf[0][0], "page_to": buf[-1][0],
                       "content": text, "token_count": approx_tokens(text)})
    return chunks
