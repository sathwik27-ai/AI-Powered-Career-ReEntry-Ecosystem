"""Generate the FICTIONAL demo resume for "Priya" as PDF and DOCX.

Run from backend/:  python scripts/generate_sample_resumes.py
Outputs: backend/sample_data/priya_resume.pdf and priya_resume.docx
Priya is a fictional persona; employers are deliberately generic placeholders.
"""
from __future__ import annotations

from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "sample_data"

LINES = [
    ("title", "Priya Raman"),
    ("text", "priya.demo@example.com | +91 90000 00000 | Chennai, India"),
    ("text", "(Fictional demo persona for ReStartHer – not a real person)"),
    ("heading", "Professional Summary"),
    ("text", "Software developer with five years of experience building Java and Spring Boot services, REST APIs and SQL-backed applications. Known for problem solving, clear communication and mentoring junior developers."),
    ("heading", "Work Experience"),
    ("text", "Software Developer | Illustrative IT Services Company | Jun 2019 - Jul 2022"),
    ("bullet", "Built REST APIs with Spring Boot and MySQL for a retail-banking client"),
    ("bullet", "Wrote JUnit tests and reviewed code through Git pull requests"),
    ("bullet", "Mentored two junior developers and collaborated with business analysts on requirements gathering"),
    ("text", "Associate Software Engineer | Illustrative Product Company | Jun 2017 - May 2019"),
    ("bullet", "Developed Java modules and SQL reports for an inventory system"),
    ("bullet", "Automated data clean-up scripts in Python"),
    ("heading", "Career Break"),
    ("text", "Jul 2022 - Present: Planned career break for maternity and caregiving."),
    ("heading", "Education"),
    ("text", "B.E. Computer Science, Anna University, 2017"),
    ("heading", "Skills"),
    ("text", "Java, Spring Boot, SQL, Python, Git, JUnit, problem solving, communication, teamwork"),
    ("heading", "Projects"),
    ("bullet", "Library inventory tracker (Java, MySQL) – college final-year project"),
]


def make_pdf(path: Path) -> None:
    import pymupdf

    doc = pymupdf.open()
    page = doc.new_page()
    y = 60
    for kind, text in LINES:
        size = {"title": 18, "heading": 13, "text": 10.5, "bullet": 10.5}[kind]
        if kind == "heading":
            y += 8
        content = f"- {text}" if kind == "bullet" else text
        rect = pymupdf.Rect(56, y, 540, y + 60)
        page.insert_textbox(rect, content, fontsize=size, fontname="helv" if kind != "title" else "hebo")
        lines = max(1, int(len(content) * size * 0.5 / 484) + 1)
        y += lines * size * 1.35 + 4
    doc.save(path)
    doc.close()


def make_docx(path: Path) -> None:
    import docx

    d = docx.Document()
    for kind, text in LINES:
        if kind == "title":
            d.add_heading(text, level=0)
        elif kind == "heading":
            d.add_heading(text, level=1)
        elif kind == "bullet":
            d.add_paragraph(text, style="List Bullet")
        else:
            d.add_paragraph(text)
    d.save(path)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    make_pdf(OUT / "priya_resume.pdf")
    make_docx(OUT / "priya_resume.docx")
    print(f"Wrote {OUT / 'priya_resume.pdf'} and {OUT / 'priya_resume.docx'}")
