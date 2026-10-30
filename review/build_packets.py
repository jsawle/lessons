#!/usr/bin/env python3
"""Builds the text a review persona sees, from the published build.

For each lesson id given, writes into OUT_DIR:
  teacher-<id>.txt     the lesson page and answer page (Hub pages as text, with the prompt box's text),
                       the English and Spanish student sheets and the teacher notes (Word files as text)
  student-en-<id>.txt  the English student sheet and a plain description of what is on the map
  student-es-<id>.txt  the same with the Spanish sheet
and about-page.txt (How these lessons work, and the Lessons page).

Run from the repo root after building:  node resources/tools/build-dist.mjs
  python3 review/build_packets.py OUT_DIR <lesson id> [<lesson id> ...]
Needs python-docx (pip install python-docx). Reviewers get only these files, never the lesson files.
"""
import html, json, os, re, subprocess, sys

import docx
from docx.table import Table
from docx.text.paragraph import Paragraph

OUT, IDS = sys.argv[1], sys.argv[2:]
os.makedirs(OUT, exist_ok=True)
bundle = json.load(open("resources/dist/hub-bundle.json"))
PAGES = {p["slug"]: p for p in bundle["pages"]}


def page_text(page):
    parts = []
    for sec in page["layout"]["sections"]:
        for row in sec["rows"]:
            for card in row["cards"]:
                st = card["component"]["settings"]
                if card["component"]["name"] == "iframe-card":
                    parts.append(f"[Embedded box: {st.get('title')} (shows the prompt text, given further down, with a Copy button)]")
                    continue
                md = re.sub(r"<style>.*?</style>", "", st.get("markdown", ""))
                md = re.sub(r'<span class="mml-sr">[^<]*</span>', "", md)
                md = re.sub(r"<(h1|h2)[^>]*>", "\n\n## ", md)
                md = re.sub(r"<h3[^>]*>", "\n\n### ", md)
                md = re.sub(r"<h4[^>]*>", "\n#### ", md)
                md = re.sub(r"<li[^>]*>", "\n- ", md)
                md = re.sub(r"<(p|tr|div)[^>]*>", "\n", md)
                md = re.sub(r"</t[hd]>", " | ", md)
                md = re.sub(r'<a [^>]*class="mml-btn[^"]*"[^>]*>(.*?)</a>', r" [Button: \1] ", md)
                md = re.sub(r'<img [^>]*alt="([^"]*)"[^>]*>', r"[Image: \1]", md)
                md = re.sub(r"\{\{SHEET:[^}]+\}\}", "#", md)
                md = html.unescape(re.sub(r"<[^>]+>", "", md))
                parts.append(re.sub(r"\n\s*\n+", "\n\n", md).strip())
    return "\n\n".join(parts)


def docx_text(path):
    d = docx.Document(path)
    out = []
    for el in d.element.body.iterchildren():
        tag = el.tag.split("}")[1]
        if tag == "p":
            para = Paragraph(el, d)
            text = para.text.strip()
            style = ((para.style.name if para.style is not None else "") or "").replace(" ", "")
            if not text:
                if el.xpath(".//w:pBdr") and (not out or out[-1] != "____ (writing line)"):
                    out.append("____ (writing line)")
                continue
            numbered = " (numbered)" if el.xpath("./w:pPr/w:numPr") else ""
            prefix = "# " if "Heading1" in style else "## " if "Heading2" in style else ""
            out.append(prefix + text + numbered)
        elif tag == "tbl":
            for row in Table(el, d).rows:
                out.append(" | ".join(c.text.strip() for c in row.cells))
    for s in d.sections:
        footer = " ".join(p.text for p in s.footer.paragraphs).strip()
        if footer:
            out.append("[Footer on each page] " + footer)
    return "\n".join(out)


def ai_prompt(lesson_id):
    js = ('const M=require("./resources/assets/lesson-core.js"),fs=require("fs");'
          'const b=JSON.parse(fs.readFileSync("resources/site.json"));const n=M.defaultLessons(b);'
          'const s=M.mergeSite(b,JSON.parse(fs.readFileSync("resources/"+M.lessonsFileName(n))),n);'
          f'process.stdout.write(M.aiPrompt(s,JSON.parse(fs.readFileSync("resources/lessons/{lesson_id}.json"))))')
    return subprocess.run(["node", "-e", js], capture_output=True, text=True, check=True).stdout


for lid in IDS:
    lesson = json.load(open(f"resources/lessons/{lid}.json"))
    sheets = f"resources/dist/sheets/{lid}"
    teacher = "\n\n".join([
        "=== LESSON PAGE (Hub page; teachers may share it with students) ===\n" + page_text(PAGES[lid])
        + "\n\n--- Text inside the embedded prompt box ---\n" + ai_prompt(lid),
        "=== ANSWER PAGE (separate Hub page for teachers) ===\n" + page_text(PAGES[lid + "-teacher"]),
        "=== STUDENT SHEET, ENGLISH (Word file) ===\n" + docx_text(f"{sheets}-student-sheet-en.docx"),
    ] + ([
        "=== STUDENT SHEET, SPANISH (Word file) ===\n" + docx_text(f"{sheets}-student-sheet-es.docx"),
    ] if os.path.exists(f"{sheets}-student-sheet-es.docx") else []) + [
        "=== TEACHER NOTES (Word file) ===\n" + docx_text(f"{sheets}-teacher-notes-en.docx"),
    ])
    open(f"{OUT}/teacher-{lid}.txt", "w").write(teacher)
    m = lesson["map"]
    mapdesc = ("WHAT IS ON THE MAP (a plain description; the reviewer cannot open the live map)\n"
               "The map opens in a web map app in the browser. Tools along the side: Basemaps, Map layers (turn layers on and off), "
               "Legend, Measure (miles and feet), Sketch, 2D/3D, Bookmarks. Clicking a feature opens a pop-up. "
               "Layer and bookmark names, the legend and pop-ups are in English.\n"
               "Bookmarks: " + ("; ".join(m.get("bookmarks", [])) or "none") + "\nLayers:\n"
               + "\n".join(f"- {l['name']}{' (off when the map opens)' if l.get('offAtStart') else ''}: {l['shows']}" for l in m["layers"]))
    for lang, name in (("en", "ENGLISH"), ("es", "SPANISH")):
        if not os.path.exists(f"{sheets}-student-sheet-{lang}.docx"): continue
        open(f"{OUT}/student-{lang}-{lid}.txt", "w").write(
            f"=== STUDENT SHEET ({name}) ===\n" + docx_text(f"{sheets}-student-sheet-{lang}.docx") + "\n\n=== " + mapdesc)

open(f"{OUT}/about-page.txt", "w").write(
    '=== "HOW THESE LESSONS WORK" PAGE ===\n' + page_text(PAGES["how-these-lessons-work"])
    + "\n\n=== LESSONS PAGE (catalogue) ===\n" + page_text(PAGES["lessons"]))
for f in sorted(os.listdir(OUT)):
    print(os.path.getsize(f"{OUT}/{f}"), f)
