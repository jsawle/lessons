#!/usr/bin/env python3
"""Builds what each review persona sees for a review of the lessons' web maps.

Map review packets v1.1. For each persona and group of lessons, writes OUT_DIR/<persona>-<group>.md: the persona,
what to check, and for each lesson the student sheet (English, or Spanish for S2, both for T4 where there is a Spanish
sheet), for teachers the lesson page's About this map, front-of-class steps and answer notes, then the map as students
meet it: one entry per view captured on the live web map (picture path, what was done to get there, the legend and
pop-up text exactly as shown). Reviewers get only these packets and the pictures, never the lesson files, known issues
or audit results.

1.1: every lesson in the index, in groups of four (A, B, C, ...); S3 Eli added, with a second copy of every picture
simulating red-green colour vision deficiency (deuteranopia, Machado, Oliveira and Fernandes 2009, severity 1.0),
written to SIM_DIR; S2 gets only the lessons that have a Spanish sheet, in two groups; reviewers write their findings to
FINDINGS_DIR/<persona>-<group>.json; the capture's time zone is stated in the packet.

Usage, from the repo root:
  python3 review/build_map_packets.py OUT_DIR TEXT_DIR RECORD_JSON VIEWS_DIR [FINDINGS_DIR [SIM_DIR]]
TEXT_DIR is the output of review/build_packets.py (student sheets as text); RECORD_JSON and VIEWS_DIR come from
the capture of the live maps (each lesson's steps followed on its web map, with the legend open and features clicked).
FINDINGS_DIR defaults to OUT_DIR/../findings and SIM_DIR to VIEWS_DIR/../views-deuteranopia. Needs Pillow and numpy for S3.
"""
import json, os, re, sys

OUT, TEXT, RECORD, VIEWS = sys.argv[1:5]
FINDINGS = sys.argv[5] if len(sys.argv) > 5 else os.path.join(OUT, "..", "findings")
SIM = sys.argv[6] if len(sys.argv) > 6 else os.path.join(VIEWS, "..", "views-deuteranopia")
for d in (OUT, FINDINGS): os.makedirs(d, exist_ok=True)
index = json.load(open("resources/lessons/index.json"))["lessons"]
record = json.load(open(RECORD))
capture = record.get("_capture", {})
personas_md = open("review/personas.md", encoding="utf-8").read()

PERSONAS = {
    "T3": ("T3 Luis: shared devices and short periods",),
    "T4": ("T4 Ana: many English learners",),
    "T5": ("T5 Ruth: Texas teacher, careful about scrutiny",),
    "S1": ("S1 Jordan: reads below grade level",),
    "S2": ("S2 Sofía: English learner, Spanish speaker",),
    "S3": ("S3 Eli: colour vision deficiency",),
}


def has_spanish(lid):
    return os.path.exists(os.path.join(TEXT, f"student-es-{lid}.txt"))


def chunks(ids, n):
    return {chr(65 + i): ids[i * n:(i + 1) * n] for i in range((len(ids) + n - 1) // n)}


GROUPS = chunks(index, 4)                       # A, B, C: four lessons each, in index order
SPANISH = [l for l in index if has_spanish(l)]
GROUPS_S2 = chunks(SPANISH, (len(SPANISH) + 1) // 2)  # S2 reads only lessons with a Spanish sheet, in two groups


def simulate(src, dst):
    """A copy of a picture as it looks with deuteranopia (Machado et al. 2009, severity 1.0), applied in linear RGB."""
    import numpy as np
    from PIL import Image
    m = np.array([[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]])
    a = np.asarray(Image.open(src).convert("RGB")) / 255.0
    lin = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    lin = np.clip(lin @ m.T, 0, 1)
    out = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * lin ** (1 / 2.4) - 0.055)
    Image.fromarray((out * 255).round().astype("uint8")).save(dst)


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


BRIEF = """You are reviewing {n} Grade 8 US History lessons and the **web maps** they use, as the person described below. Each lesson has a student sheet that sends students to one web map in a browser app, where they turn layers on and off, open bookmarks, read the legend and click features to read pop-ups. The lesson wording was revised in November 2026, some lessons are new and some maps are new or redesigned, so review both: the lesson as this person meets it ({lessonparts}), and the map: whether this person can find, read, tell apart and use on the map what the sheet asks for, and whether the sheet's words and the map match.

What you have for each lesson: {have} and, under "The map as students meet it", pictures of the live web map taken by following the sheet's steps. Each entry says what was done (bookmark, layers turned on or off, zoom, a click on a feature), the picture file, the legend text when the legend was open, and the pop-up text exactly as it appeared. Open every picture with your file-reading tool and look at it; the pictures are the map. They were taken with the same mapping library the app uses, at a laptop size (1200 x 800 pixels), with the legend in a panel on the right; the app's own buttons and panels look a little different. {tz}A pop-up longer than its box scrolls, and the pop-up text given is the whole of it. "No pop-up opened" means the click opened nothing. Some clicks open a different feature from the one named, because something else sits at that spot: judge what a student would get.{sim}

Stay in role. Use only these packets, the files they name and the pictures: don't open other files or websites. Where you suspect a fact is wrong, say what you'd check rather than looking it up.

For each finding give:
- "lesson": the lesson id (as in the section heading)
- "about": "map" | "lesson" | "both"
- "where": the map view or picture and the layer, or the page, sheet or notes section, and the sheet question and step it affects
- "what": what this person meets, in their words
- "why": why it matters to this person
- "severity": "stops the lesson" | "slows it down" | "minor"
- "suggestion": a concrete change to the map or to the wording
- "evidence": the picture file(s), pop-up text or quoted wording that show it
- "fromPicture": true if you saw it in a picture, pop-up text or the lesson text, false if you're inferring what the live map might do

Also give, for each lesson, "works": one or two sentences on what works well for this person.

Write your result as JSON to {out} with this shape, and nothing else in the file:
{{"persona": "{pid}", "group": "{group}", "lessons": {{"<lesson id>": {{"works": "...", "findings": [ ... ]}}}}}}
Be specific and honest: if a lesson and its map work for this person, say so and list few findings."""


def views(lid, sim=False):
    r = record.get(lid, {})
    out = []
    for s in r.get("shots", []):
        path = os.path.abspath(os.path.join(VIEWS, s["file"]))
        if sim:
            spath = os.path.abspath(os.path.join(SIM, s["file"]))
            if not os.path.exists(spath) or os.path.getmtime(spath) < os.path.getmtime(path):
                os.makedirs(SIM, exist_ok=True); simulate(path, spath)
            out.append(f"#### {s['name']}: {s['what']}\nPicture as you see it (simulated red-green colour vision deficiency): {spath}\nPicture as most classmates see it: {path}")
        else:
            out.append(f"#### {s['name']}: {s['what']}\nPicture: {path}")
        if s.get("legend"): out.append("Legend text:\n" + s["legend"].strip())
        if "click" in s["what"].lower() or s.get("popup") is not None:
            out.append("Pop-up text:\n" + (s["popup"].strip() if s.get("popup") else "(no pop-up opened)"))
    for n in r.get("notes", []): out.insert(0, "Note on the capture: " + n)
    if r.get("bookmarks"): out.insert(0, "Bookmarks in the app: " + ", ".join(r["bookmarks"]))
    lay = r.get("layers", [])
    if lay:
        out.insert(1 if r.get("bookmarks") else 0, "Map layers list (as the app lists them, top first; on/off when the map opens):\n" +
                   "\n".join(f"{'  ' * l['depth']}- {l['title']} ({'on' if l['visible'] else 'off'})" for l in lay if l["depth"] < 3))
    return "\n\n".join(out)


tz_note = (f"The pictures were taken with the browser set to the {capture['timeZone']} time zone, as a student in the central United States would see dates and times. " if capture.get("timeZone") else "")
for pid, names in PERSONAS.items():
    groups = GROUPS_S2 if pid == "S2" else GROUPS
    for g, ids in groups.items():
        teacher = pid.startswith("T")
        have = ("the student sheet, the lesson page's About this map, its From the front steps and the answer notes, and a text file holding the whole lesson page, answer page, Word student sheets and Word teacher notes as a teacher sees them (its path is given in each lesson's section: read it)"
                if teacher else "the student sheet in the language you read")
        lessonparts = ("the lesson page, the answer notes, the student sheet and the teacher notes" if teacher else "the student sheet: its words, its steps and what it asks you to write")
        simnote = (" For every view you get two pictures: the first is a simulation of the map as someone with red-green colour vision deficiency (deuteranopia) sees it, and that is how you see the map; the second is the same view as most classmates see it. Look at the simulated picture first for every view, and open the other one when you need to know what the sheet's colour words refer to." if pid == "S3" else "")
        parts = [f"# Lesson and map review: {pid}, lessons group {g}", "",
                 BRIEF.format(n=len(ids), have=have, lessonparts=lessonparts, tz=tz_note, sim=simnote,
                              out=os.path.abspath(os.path.join(FINDINGS, f"{pid}-{g}.json")), pid=pid, group=g), "", "## Who you are", persona_text(names)]
        for lid in ids:
            lesson = json.load(open(f"resources/lessons/{lid}.json"))
            parts += ["", "---", f"## Lesson: {lid}", f"Title: {lesson['title']}", "", app_note(lid)]
            langs = ["es"] if pid == "S2" else (["en", "es"] if pid == "T4" and has_spanish(lid) else ["en"])
            if pid == "T4" and not has_spanish(lid): parts += ["", "(This lesson has no Spanish student sheet yet.)"]
            for lang in langs:
                parts += ["", f"### Student sheet ({'Spanish' if lang == 'es' else 'English'})", sheet(lid, lang)]
            if teacher:
                parts += ["", "### Lesson page and answer notes (teachers only)", teacher_part(lesson),
                          "", "Whole lesson page, answer page and Word files as text: " + os.path.abspath(os.path.join(TEXT, f"teacher-{lid}.txt"))]
            parts += ["", "### The map as students meet it", views(lid, sim=(pid == "S3"))]
        text = "\n".join(parts) + "\n"
        open(os.path.join(OUT, f"{pid}-{g}.md"), "w", encoding="utf-8").write(text)
        print(pid, g, len(ids), "lessons,", len(text), "characters,", text.count("\nPicture"), "picture paths")
