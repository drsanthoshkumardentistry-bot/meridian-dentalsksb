"""Parse MCQ question papers (text) into MeriDent Prep question objects.

Handles the common layouts of Indian dental question banks / PYQ compilations:
  12. Question text ...            Q12) / Q.12 / 12)
  (a) opt  (b) opt  A. opt  1) opt  - options on separate lines or on one line
  Ans: B / Answer: (c) / Correct answer – 2 / Key: b
  Explanation: ... / Exp: ... / Ref: ...
and a separate ANSWER KEY section such as "1. B  2. C  3-a" or "1 (b)".
"""
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field

Q_START = re.compile(r"^\s*(?:Q(?:uestion)?\s*\.?\s*)?(\d{1,4})\s*[.)\]:]\s+(.*\S)?\s*$", re.I)
OPT = re.compile(r"(?:^|\s)\(?([A-Da-d1-4])[.)\]]\s+")
ANS = re.compile(r"^\s*(?:ans(?:wer)?|correct\s+answer|key)\s*[:.\-–]?\s*\(?([A-Da-d1-4])\)?\b(.*)$", re.I)
EXP = re.compile(r"^\s*(?:exp(?:lanation)?|ref(?:erence)?|rationale)\s*[:.\-–]\s*(.*)$", re.I)
KEY_HEADER = re.compile(r"^\s*answer\s*key\b|^\s*answers\s*:?\s*$|^\s*key\s*:?\s*$", re.I)
KEY_PAIR = re.compile(r"(\d{1,4})\s*[.)\-:–]?\s*\(?([A-Da-d1-4])\)?(?=\s|,|;|$)")
SUBJECT_LINE = re.compile(r"^\s*(?:subject|section|topic)\s*[:\-–]\s*(.+)$", re.I)

LETTERS = "ABCD"


def _idx(token: str) -> int:
    token = token.strip().upper()
    return LETTERS.index(token) if token in LETTERS else int(token) - 1


@dataclass
class ParsedQ:
    number: int
    stem: list[str] = field(default_factory=list)
    options: list[str] = field(default_factory=list)
    answer: int | None = None
    explanation: list[str] = field(default_factory=list)
    subject: str | None = None
    _opt_open: bool = False

    @property
    def question(self) -> str:
        return " ".join(self.stem).strip()


def _split_options(line: str) -> list[tuple[int, str]] | None:
    """'(a) X (b) Y' or 'A. X' -> [(0,'X'), (1,'Y')]; None if the line isn't an option line."""
    matches = list(OPT.finditer(" " + line))
    if not matches or matches[0].start() > 1:
        return None
    s = " " + line
    out = []
    for k, m in enumerate(matches):
        end = matches[k + 1].start() if k + 1 < len(matches) else len(s)
        out.append((_idx(m.group(1)), s[m.end():end].strip()))
    return out


def parse_answer_key(lines: list[str]) -> dict[int, int]:
    key: dict[int, int] = {}
    for line in lines:
        for num, tok in KEY_PAIR.findall(line):
            key[int(num)] = _idx(tok)
    return key


def parse_mcqs(text: str, default_subject: str | None = None) -> list[ParsedQ]:
    lines = [l.rstrip() for l in text.splitlines()]
    # Split off an answer-key section, if any.
    key_lines: list[str] = []
    for i, l in enumerate(lines):
        if KEY_HEADER.match(l):
            key_lines, lines = lines[i + 1:], lines[:i]
            break

    qs: list[ParsedQ] = []
    cur: ParsedQ | None = None
    subject = default_subject
    mode = "stem"  # stem | options | explanation
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if (m := SUBJECT_LINE.match(line)):
            subject = m.group(1).strip().title()
            continue
        m = Q_START.match(line)
        # A new question starts with a number – but "1) option" inside a question is an option.
        opts_here = _split_options(line) if cur and mode in ("stem", "options") and len(cur.options) < 4 else None
        is_next_option = bool(opts_here) and opts_here[0][0] == len(cur.options)
        if m and not is_next_option:
            cur = ParsedQ(int(m.group(1)), [m.group(2) or ""], subject=subject)
            qs.append(cur)
            mode = "stem"
            continue
        if cur is None:
            continue
        if (a := ANS.match(line)):
            cur.answer = _idx(a.group(1))
            rest = a.group(2).strip(" .:-–")
            if rest:
                cur.explanation.append(rest)
            mode = "explanation"
            continue
        if (e := EXP.match(line)):
            cur.explanation.append(e.group(1))
            mode = "explanation"
            continue
        opts = _split_options(line) if mode != "explanation" else None
        if opts:
            for i, t in opts:
                while len(cur.options) < i:
                    cur.options.append("")
                if i < len(cur.options):
                    cur.options[i] = t
                else:
                    cur.options.append(t)
            mode = "options"
            continue
        # Continuation line.
        if mode == "stem":
            cur.stem.append(line)
        elif mode == "options" and cur.options:
            cur.options[-1] = f"{cur.options[-1]} {line}".strip()
        else:
            cur.explanation.append(line)

    if key_lines:
        key = parse_answer_key(key_lines)
        for q in qs:
            if q.answer is None and q.number in key:
                q.answer = key[q.number]
    return qs


def fingerprint(question: str) -> str:
    norm = re.sub(r"[^a-z0-9]+", " ", question.lower()).strip()
    return hashlib.sha1(norm.encode()).hexdigest()[:12]


def to_app_rows(qs: list[ParsedQ], *, exam: str, start_id: int, subject: str | None = None,
                is_pyq: bool = False, is_important: bool = False, source: str | None = None):
    """Convert to MeriDent Prep MCQ rows. Returns (valid_rows, needs_review)."""
    rows, review = [], []
    next_id = start_id
    for q in qs:
        problems = []
        if not q.question:
            problems.append("empty question")
        if len(q.options) != 4 or any(not o for o in q.options):
            problems.append(f"{len(q.options)} options found (need 4)")
        if q.answer is None or not (0 <= q.answer < 4):
            problems.append("no answer found")
        row = {
            "id": next_id,
            "exam": exam,
            "subject": q.subject or subject or "General",
            "question": q.question,
            "options": q.options[:4],
            "answer": q.answer,
            "explanation": " ".join(q.explanation).strip() or None,
            "is_pyq": is_pyq,
            "is_important": is_important,
            "source": f"{source} Q{q.number}" if source else f"Q{q.number}",
            "fingerprint": fingerprint(q.question),
        }
        if problems:
            review.append({**row, "problems": problems})
        else:
            rows.append(row)
            next_id += 1
    return rows, review
