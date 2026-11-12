import sys
from pathlib import Path

import pytest
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def make_pdf(path: Path, pages: list[list[str]], header: str | None = None, footer_numbers: bool = False):
    c = canvas.Canvas(str(path), pagesize=A4)
    w, h = A4
    for n, lines in enumerate(pages, start=1):
        y = h - 50
        if header:
            c.setFont("Helvetica", 9); c.drawString(50, y, header); y -= 30
        c.setFont("Helvetica", 11)
        for line in lines:
            c.drawString(50, y, line); y -= 16
        if footer_numbers:
            c.setFont("Helvetica", 9); c.drawString(w / 2, 30, str(n))
        c.showPage()
    c.save()
    return path


@pytest.fixture
def pdf_factory(tmp_path):
    def _make(name, pages, **kw):
        return make_pdf(tmp_path / name, pages, **kw)
    return _make
