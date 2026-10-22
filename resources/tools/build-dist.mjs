#!/usr/bin/env node
// Builds everything the Hub publishing notebook and the AI assistant need, from the lesson files, into resources/dist:
//   hub-bundle.json             Hub page layouts (Lessons page, lesson pages, teacher pages) and the list of Word items
//   sheets/<id>-student-sheet-<lang>.docx   the Word student sheets (same builder as the page's download buttons)
//   sheets/<id>-teacher-notes-en.docx       the Word teacher notes (answers; linked from the teacher page only)
//   the assistant's knowledge file (assistant.knowledgeFile in the lessons settings; none if there is no assistant)
//   publish_to_hub.ipynb        the publishing notebook, made from tools/publish_to_hub.py (upload it to ArcGIS Notebooks)
// Settings: site.json merged with <name>-lessons.json. The default in site.json (lessonSettings.default) is built into
// resources/dist, with the publishing notebook; every other one into resources/dist/<name>.
// Without options only the default is built; --lessons <name> builds that one; --all builds every *-lessons.json.
// Only lesson files that pass the checker are included. GitHub runs this (with --all) on every change and commits the result.
// Run from the repo root:  npm install --no-save docx@9.7.1   then   node resources/tools/build-dist.mjs [--all | --lessons <name>]
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let docx;
try { docx = require("docx"); }
catch { console.error("The docx package isn't installed. Run: npm install --no-save docx@9.7.1"); process.exit(1); }
const MMR = require(join(root, "assets/lesson-core.js"));
const Sheet = require(join(root, "assets/sheet.js"));
const Hub = require(join(root, "assets/hub-page.js"));

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const base = JSON.parse(readFileSync(join(root, "site.json"), "utf8"));
const def = MMR.defaultLessons(base);
const at = process.argv.indexOf("--lessons");
const names = process.argv.includes("--all")
  ? readdirSync(root).filter((f) => /-lessons\.json$/.test(f)).map((f) => f.replace(/-lessons\.json$/, "")).filter((n) => NAME.test(n)).sort((a, b) => (a === def ? -1 : b === def ? 1 : a.localeCompare(b)))
  : [at > 1 ? process.argv[at + 1] : def];
const ids = JSON.parse(readFileSync(join(root, "lessons/index.json"), "utf8")).lessons;
let failed = false;

for (const name of names) {
  if (!NAME.test(name || "")) { console.error("--lessons needs a name: lower-case words joined by hyphens."); process.exit(1); }
  const site = MMR.mergeSite(base, JSON.parse(readFileSync(join(root, MMR.lessonsFileName(name)), "utf8")), name);
  const unfilled = MMR.unfilled(site);
  if (unfilled.length) { console.error("Names in braces with nothing to fill them (add them to names in " + MMR.lessonsFileName(name) + "):\n  - " + unfilled.join("\n  - ")); process.exit(1); }
  const out = name === def ? join(root, "dist") : join(root, "dist", name);

  const lessons = [];
  for (const id of ids) {
    const lesson = JSON.parse(readFileSync(join(root, "lessons", id + ".json"), "utf8"));
    const problems = MMR.check(site, lesson, id + ".json");
    if (problems.length) { console.error(`${name}: ${id}: left out, fix these first:\n  - ${problems.join("\n  - ")}`); failed = true; continue; }
    lessons.push(lesson);
  }

  mkdirSync(join(out, "sheets"), { recursive: true });
  // Remove sheets for lessons or languages that no longer exist.
  const keep = new Set(lessons.flatMap((l) => Object.keys(l.languages).map((lang) => Sheet.fileName(l, lang)).concat([Sheet.teacherFileName(l)])));
  for (const f of readdirSync(join(out, "sheets"))) if (!keep.has(f)) rmSync(join(out, "sheets", f));

  for (const l of lessons) {
    for (const lang of Object.keys(l.languages)) {
      writeFileSync(join(out, "sheets", Sheet.fileName(l, lang)), await docx.Packer.toBuffer(Sheet.build(docx, site, l, lang)));
    }
    writeFileSync(join(out, "sheets", Sheet.teacherFileName(l)), await docx.Packer.toBuffer(Sheet.buildTeacher(docx, site, l)));
  }

  const bundle = Hub.bundle(site, lessons, { sheetFileName: Sheet.fileName, teacherFileName: Sheet.teacherFileName });
  const pageProblems = Hub.checkBundle(bundle);
  if (pageProblems.length) { console.error(name + ": Hub pages have problems:\n  - " + pageProblems.join("\n  - ")); process.exit(1); }
  writeFileSync(join(out, "hub-bundle.json"), JSON.stringify(bundle, null, 1) + "\n");
  const kf = MMR.assistantFileName(site);
  if (kf) writeFileSync(join(out, kf), MMR.assistantFile(site, lessons, bundle.builtOn), "utf8");

  // The notebook (default only, since it reads resources/dist): the script's opening comment becomes a text cell,
  // each "# %% CELL" block a code cell.
  if (name === def) {
    const py = readFileSync(join(root, "tools/publish_to_hub.py"), "utf8");
    const [intro, ...blocks] = py.split(/^# %% /m);
    const lines = (t) => t.replace(/\s+$/, "").split("\n").map((l, i, a) => (i < a.length - 1 ? l + "\n" : l));
    const nb = {
      nbformat: 4, nbformat_minor: 5,
      metadata: { kernelspec: { name: "python3", display_name: "Python 3", language: "python" }, language_info: { name: "python" } },
      cells: [
        { cell_type: "markdown", id: "intro", metadata: {}, source: lines(intro.split("\n").filter((l) => !/^# =+$/.test(l)).map((l) => l.replace(/^# ?/, "")).join("\n").trim().replace(/^(.+)$/m, "# $1")) },
        ...blocks.map((b, i) => ({ cell_type: "code", id: "cell" + i, metadata: {}, execution_count: null, outputs: [], source: lines("# " + b) }))
      ]
    };
    writeFileSync(join(out, "publish_to_hub.ipynb"), JSON.stringify(nb, null, 1) + "\n");
  }

  console.log(`Built ${out.slice(root.length - "resources".length)} (${MMR.lessonsFileName(name)}): ${bundle.pages.length} Hub pages, ${bundle.sheets.length} Word files (student sheets and teacher notes)${kf ? ", " + kf : ""}${name === def ? " and the publishing notebook" : ""}, from ${lessons.length} lesson files.`);
}
process.exit(failed ? 1 : 0);
