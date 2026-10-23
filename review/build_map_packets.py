#!/usr/bin/env python3
"""Builds what each review persona sees for a review of the lessons' web maps.

Map review packets v1.0. For each persona and group of lessons, writes OUT_DIR/<persona>-<group>.md: the persona,
what to check, and for each lesson the student sheet (English, or Spanish for S2, both for T4), for teachers the
lesson page's About this map, front-of-class steps and answer notes, then the map as students meet it: one entry per
view captured on the live web map (picture path, what was done to get there, the legend and pop-up text exactly as
shown). Reviewers get only these packets and the pictures, never the lesson files, known issues or audit results.

Usage, from the repo root:
  python3 review/build_map_packets.py OUT_DIR TEXT_DIR RECORD_JSON VIEWS_DIR
TEXT_DIR is the output of review/build_packets.py (student sheets as text); RECORD_JSON and VIEWS_DIR come from
the capture of the live maps (each lesson's steps followed on its web map, with the legend open and features clicked).
"""
import json, os, re, sys

OUT, TEXT, RECORD, VIEWS = sys.argv[1:5]
os.makedirs(OUT, exist_ok=True)
index = json.load(open("resources/lessons/index.json"))["lessons"]
record = json.load(open(RECORD))
personas_md = open("review/personas.md", encoding="utf-8").read()

PERSONAS = {
    "T1": ("T1 Mark: the typical veteran", "T2 Dana: first-year teacher"),
    "T3": ("T3 Luis: shared devices and short periods",),
    "T4": ("T4 Ana: many English learners",),
    "T5": ("T5 Ruth: Texas teacher, careful about scrutiny",),
    "S1": ("S1 Jordan: reads below grade level",),
    "S2": ("S2 Sofía: English learner, Spanish speaker",),
}
GROUPS = {"A": index[:5], "B": index[5:]}


def persona_text(names):
    out = []
    for n in names:
        m = re.search(r"### " + re.escape(n) + r"\n(.*?)(?=\n### |\n## |\Z)", personas_md, re.S)
        out.append(f"### {n}\n{m.group(1).strip()}")
    return "\n\n".join(out)


def sheet(lid, lang):
    t = open(os.path.join(TEXT, f"student-{lang}-{lid}.txt"), encoding="utf-8").read()
    t = t.split("\n=== WHAT IS ON THE MAP")[0]
    return t.strip()


def app_note(lid):
    t = open(os.path.join(TEXT, f"student-en-{lid}.txt"), encoding="utf-8").read()
    m = re.search(r"The map opens in a web map app.*?in English\.", t, re.S)
    return m.group(0) if m else ""


def teacher_part(lesson):
    q = lesson["inquiry"]["questions"]
    lines = ["About this map (on the lesson page):", lesson["map"]["about"], ""]
    for l in lesson["map"]["layers"]:
        lines.append(f"- {l['name']}{' (off when the map opens)' if l.get('offAtStart') else ''}: {l.get('shows', '')}")
    for x in q:
        lines += ["", f"Question: {x['title']['en']} ({x.get('minutes', '?')} minutes)", "From the front (lesson page):"]
        lines += [f"  {i}. {s}" for i, s in enumerate(x.get("frontOfClass", []), 1)]
        a = x.get("answer", {})
        if a.get("where"): lines.append(f"Answer notes, where on the map: {a['where']}")
        if a.get("accept"): lines.append(f"Answer notes, what to accept: {a['accept']}")
    return "\n".join(lines)


BRIEF = """You are reviewing the **web maps** that ten Grade 8 US History lessons use, as the person described below. Each lesson has a student sheet that sends students to one web map in a browser app, where they turn layers on and off, open bookmarks, read the legend and click features to read pop-ups. This review is about the maps: whether this person can find, read, tell apart and use on the map what the sheet asks for. The sheets were reviewed before; comment on a sheet only where its words and the map don't match.

What you have for each lesson: the student sheet{teacher} and, under "The map as students meet it", pictures of the live web map taken by following the sheet's steps. Each entry says what was done (bookmark, layers turned on or off, zoom, a click on a feature), the picture file, the legend text when the legend was open, and the pop-up text exactly as it appeared. Open every picture with your file-reading tool and look at it; the pictures are the map. They were taken with the same mapping library the app uses, at a laptop size (1200 x 800 pixels), with the legend in a panel on the right; the app's own buttons and panels look a little different. A pop-up longer than its box scrolls, and the pop-up text given is the whole of it. "No pop-up opened" means the click opened nothing. Some clicks open a different feature from the one named, because something else sits at that spot: judge what a student would get.

Stay in role. Use only these packets and pictures: don't open other files or websites. Where you suspect a fact is wrong, say what you'd check rather than looking it up.

For each finding give:
- "lesson": the lesson id (as in the section heading)
- "where": the map view or picture, the layer, and the sheet question and step it affects
- "what": what this person meets, in their words
- "why": why it matters to this person
- "severity": "stops the lesson" | "slows it down" | "minor"
- "suggestion": a concrete change to the map (or the sheet's wording, if that's the fix)
- "evidence": the picture file(s) or pop-up text that show it
- "fromPicture": true if you saw it in a picture or pop-up text, false if you're inferring what the live map might do

Also give, for each lesson, "works": one or two sentences on what works well on this map for this person.

Write your result as JSON to {out} with this shape, and nothing else in the file:
{{"persona": "{pid}", "group": "{group}", "lessons": {{"<lesson id>": {{"works": "...", "findings": [ ... ]}}}}}}
Be specific and honest: if a map works for this person, say so and list few findings."""


def views(lid):
    r = record.get(lid, {})
    out = []
    for s in r.get("shots", []):
        path = os.path.abspath(os.path.join(VIEWS, s["file"]))
        out.append(f"#### {s['name']}: {s['what']}\nPicture: {path}")
        if s.get("legend"): out.append("Legend text:\n" + s["legend"].strip())
        if "click" in s["what"].lower() or s.get("popup") is not None:
            out.append("Pop-up text:\n" + (s["popup"].strip() if s.get("popup") else "(no pop-up opened)"))
    if r.get("bookmarks"): out.insert(0, "Bookmarks in the app: " + ", ".join(r["bookmarks"]))
    lay = r.get("layers", [])
    if lay:
        out.insert(1 if r.get("bookmarks") else 0, "Map layers list (as the app lists them, top first; on/off when the map opens):\n" +
                   "\n".join(f"{'  ' * l['depth']}- {l['title']} ({'on' if l['visible'] else 'off'})" for l in lay if l["depth"] < 3))
    return "\n\n".join(out)


for pid, names in PERSONAS.items():
    for g, ids in GROUPS.items():
        teacher = pid.startswith("T")
        parts = [f"# Map review: {pid}, lessons group {g}", "", BRIEF.format(teacher=", the lesson page's About this map, its From the front steps and the answer notes" if teacher else "",
                 out=os.path.abspath(os.path.join(OUT, f"{pid}-{g}.json")), pid=pid, group=g), "", "## Who you are", persona_text(names)]
        for lid in ids:
            lesson = json.load(open(f"resources/lessons/{lid}.json"))
            parts += ["", "---", f"## Lesson: {lid}", f"Title: {lesson['title']}", "", app_note(lid)]
            langs = ["es"] if pid == "S2" else (["en", "es"] if pid == "T4" else ["en"])
            for lang in langs:
                parts += ["", f"### Student sheet ({'Spanish' if lang == 'es' else 'English'})", sheet(lid, lang)]
            if teacher:
                parts += ["", "### Lesson page and answer notes (teachers only)", teacher_part(lesson)]
            parts += ["", "### The map as students meet it", views(lid)]
        open(os.path.join(OUT, f"{pid}-{g}.md"), "w", encoding="utf-8").write("\n".join(parts) + "\n")
        print(pid, g, sum(1 for _ in ids), "lessons")
