import json
from pathlib import Path

from merident_extract import appbank
from merident_extract.__main__ import main
from merident_extract.chunker import chunk_pages
from merident_extract.mcq import parse_mcqs, to_app_rows
from merident_extract.pdftext import extract_clean

INLINE = [
    [
        "Subject: Oral Pathology",
        "1. The most common odontogenic cyst is:",
        "(a) Dentigerous cyst (b) Radicular cyst",
        "(c) Odontogenic keratocyst (d) Lateral periodontal cyst",
        "Ans: B",
        "Explanation: Radicular cyst is the most common odontogenic cyst.",
        "2. Ghost cells are characteristic of",
        "A. Calcifying odontogenic cyst",
        "B. Adenomatoid odontogenic tumour",
        "C. Pindborg tumour",
        "D. Odontogenic myxoma",
        "Answer: (a)",
    ],
    [
        "Subject: Pharmacology",
        "Q3) Antidote for heparin overdose is",
        "a) Vitamin K b) Protamine sulfate c) Fresh frozen plasma d) Tranexamic acid",
        "Correct answer - b",
        "4. Incomplete question with three options",
        "(a) One (b) Two (c) Three",
        "Ans: a",
    ],
]


def test_inline_answers_and_review(pdf_factory):
    pdf = pdf_factory("inline.pdf", INLINE, header="NEET MDS Revision Series 2026", footer_numbers=True)
    text = "\n".join(p.text for p in extract_clean(str(pdf), ocr="never"))
    assert "Revision Series" not in text            # running header removed
    qs = parse_mcqs(text)
    assert [q.number for q in qs] == [1, 2, 3, 4]
    assert qs[0].answer == 1 and qs[0].subject == "Oral Pathology"
    assert qs[0].options[2] == "Odontogenic keratocyst"
    assert "most common" in " ".join(qs[0].explanation)
    assert qs[1].answer == 0 and len(qs[1].options) == 4
    assert qs[2].answer == 1 and qs[2].options[1] == "Protamine sulfate" and qs[2].subject == "Pharmacology"
    rows, review = to_app_rows(qs, exam="NEET MDS", start_id=5001)
    assert len(rows) == 3 and [r["id"] for r in rows] == [5001, 5002, 5003]
    assert review[0]["problems"] == ["3 options found (need 4)"]


def test_answer_key_section_and_numeric_options():
    text = """
1. Muscles of mastication are supplied by
1) Facial nerve
2) Maxillary nerve
3) Mandibular nerve
4) Hypoglossal nerve
2. Pacemaker of the heart is the
1) AV node 2) SA node 3) Bundle of His 4) Purkinje fibres
ANSWER KEY
1. 3   2. 2
"""
    qs = parse_mcqs(text, default_subject="Anatomy")
    assert len(qs) == 2
    assert qs[0].options == ["Facial nerve", "Maxillary nerve", "Mandibular nerve", "Hypoglossal nerve"]
    assert qs[0].answer == 2 and qs[1].answer == 1


def test_multiline_stem_and_option_wrap():
    text = """
5. A 35-year-old man has a painless swelling of the posterior mandible
with a multilocular radiolucency. The most likely diagnosis is
(a) Ameloblastoma
(b) Radicular cyst
(c) Central giant cell
granuloma
(d) Odontoma
Ans: a
"""
    q = parse_mcqs(text)[0]
    assert q.question.endswith("The most likely diagnosis is")
    assert q.options[2] == "Central giant cell granuloma"


def test_lecture_chunks_have_page_citations(pdf_factory):
    body = [f"Ameloblastoma point {i}. It is a benign but locally aggressive tumour." for i in range(30)]
    pdf = pdf_factory("lecture.pdf", [body, body, body, body], header="Dept of Oral Pathology - SRDCH", footer_numbers=True)
    pages = extract_clean(str(pdf), ocr="never")
    assert all("Dept of Oral Pathology" not in p.text for p in pages)
    chunks = chunk_pages(pages, max_words=120, overlap_words=20)
    assert len(chunks) > 4
    assert chunks[0]["page_from"] == 1 and chunks[-1]["page_to"] == 4
    assert all(c["token_count"] > 0 for c in chunks)
    assert all(len(c["content"].split()) <= 140 for c in chunks)


def test_ocr_fallback_on_scanned_page(tmp_path):
    from PIL import Image, ImageDraw, ImageFont
    img = Image.new("RGB", (1700, 400), "white")
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 56)
    except OSError:
        font = ImageFont.load_default()
    d.text((60, 150), "Odontogenic keratocyst recurrence", fill="black", font=font)
    pdf = tmp_path / "scan.pdf"
    img.save(pdf, "PDF", resolution=200)
    pages = extract_clean(str(pdf), ocr="auto")
    assert pages[0].ocr is True
    assert "keratocyst" in pages[0].text.lower()


def test_cli_merge_dedupes(pdf_factory, tmp_path, monkeypatch):
    bank = tmp_path / "imported.js"
    monkeypatch.setattr(appbank, "DEFAULT_PATH", bank)
    pdf = pdf_factory("paper.pdf", INLINE)
    out = tmp_path / "out.json"
    assert main(["mcq", str(pdf), "--exam", "NEET MDS", "--pyq", "--out", str(out), "--merge", "--ocr", "never"]) == 0
    data = json.loads(out.read_text())
    assert len(data["questions"]) == 3 and len(data["needs_review"]) == 1
    assert len(appbank.load(bank)) == 3
    main(["mcq", str(pdf), "--out", str(out), "--merge", "--ocr", "never"])   # second run: all duplicates
    rows = appbank.load(bank)
    assert len(rows) == 3 and [r["id"] for r in rows] == [5001, 5002, 5003]
    assert rows[0]["is_pyq"] is True and rows[0]["exam"] == "NEET MDS"
