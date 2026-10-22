#!/usr/bin/env node
// Checks every lesson file with the same checker the page uses, checks the Hub pages built from them,
// and checks the versions table matches the code. Exits 1 if anything is wrong.
// Each lessons settings file (resources/<name>-lessons.json) is checked merged over site.json; --lessons <name> checks one.
// Run from the repo root:  node resources/tools/validate.mjs [--lessons <name>]
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MMR = require(join(root, "assets/lesson-core.js"));
const Sheet = require(join(root, "assets/sheet.js"));
const Hub = require(join(root, "assets/hub-page.js"));

const problems = [];
let checked = 0;
function readJSON(rel) {
  try { return JSON.parse(readFileSync(join(root, rel), "utf8")); }
  catch (e) { problems.push(`${rel}: ${e.code === "ENOENT" ? "file not found" : "not valid JSON: " + e.message}`); return null; }
}

const base = readJSON("site.json");
const index = readJSON("lessons/index.json");
if (!base || !index) { report(); }

// The lessons settings files, merged over site.json one at a time.
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const all = readdirSync(root).filter((f) => /-lessons\.json$/.test(f)).map((f) => f.replace(/-lessons\.json$/, "")).filter((n) => NAME.test(n));
const def = MMR.defaultLessons(base);
if (!all.includes(def)) problems.push(`site.json lessonSettings.default is "${def}", but ${MMR.lessonsFileName(def)} doesn't exist.`);
const at = process.argv.indexOf("--lessons");
const names = at > 1 ? [process.argv[at + 1]] : all;

const files = readdirSync(join(root, "lessons")).filter((f) => f.endsWith(".json") && f !== "index.json" && !f.startsWith("_"));
const listed = new Set(index.lessons);
for (const f of files) if (!listed.has(f.replace(/\.json$/, ""))) problems.push(`lessons/${f}: not listed in lessons/index.json, so it won't appear in the catalogue.`);
for (const id of index.lessons) if (!files.includes(id + ".json")) problems.push(`lessons/index.json lists "${id}" but lessons/${id}.json doesn't exist.`);

const lessons = [];
for (const f of files) {
  const lesson = readJSON("lessons/" + f);
  if (lesson) { checked++; lessons.push([f, lesson]); }
}

// A map picture served from this repository's GitHub Pages site must be in the repository.
const PAGES = "https://jsawle.github.io/lessons/";
for (const [f, lesson] of lessons) {
  const url = (lesson.map && lesson.map.image && lesson.map.image.url) || "";
  if (url.startsWith(PAGES) && !existsSync(join(root, "..", url.slice(PAGES.length)))) problems.push(`lessons/${f}: map.image ${url} is not in the repository (take it with the Map pictures workflow).`);
}

for (const name of names) {
  const file = MMR.lessonsFileName(name), tag = names.length > 1 ? `[${file}] ` : "";
  const own = readJSON(file);
  if (!own) continue;
  const site = MMR.mergeSite(base, own, name);
  for (const u of MMR.unfilled(site)) problems.push(`${tag}${u} has nothing to fill it in: add it to names in ${file}.`);
  const good = [];
  for (const [f, lesson] of lessons) {
    const found = MMR.check(site, lesson, f);
    for (const p of found) problems.push(`${tag}lessons/${f}: ${p}`);
    if (!found.length && listed.has(lesson.id)) good.push(lesson);
    const hub = site.hub || {};
    if (lesson.subject && !(hub.subjectPaths || {})[lesson.subject]) problems.push(`${tag}lessons/${f}: subject "${lesson.subject}" has no Hub page in ${file} (hub.subjectPaths).`);
    if (lesson.course && !(hub.coursePaths || {})[lesson.course]) problems.push(`${tag}lessons/${f}: course "${lesson.course}" has no Hub page in ${file} (hub.coursePaths).`);
  }
  // The Hub pages built from the lesson files must only use HTML that Hub keeps.
  if (good.length) {
    const bundle = Hub.bundle(site, index.lessons.map((id) => good.find((l) => l.id === id)).filter(Boolean), { sheetFileName: Sheet.fileName, teacherFileName: Sheet.teacherFileName });
    for (const p of Hub.checkBundle(bundle)) problems.push(`${tag}Hub: ${p}`);
  }
}

// The versions table in site.json must match the code it describes.
const parts = (base.app && base.app.parts) || {};
const codeVersions = { "Page renderer": MMR.VERSION.renderer, "Lesson file format": MMR.VERSION.format, "Checker": MMR.VERSION.checker,
  "Assistant knowledge builder": MMR.VERSION.knowledge, "AI prompt builder": MMR.VERSION.prompt, "Word sheet builder": Sheet.VERSION, "Hub page builder": Hub.VERSION };
for (const [k, v] of Object.entries(codeVersions)) if (parts[k] !== v) problems.push(`site.json app.parts["${k}"] is ${parts[k]} but the code says ${v}.`);
report();

function report() {
  if (problems.length) {
    console.error(`Found ${problems.length} problem${problems.length === 1 ? "" : "s"}:`);
    for (const p of problems) console.error("  - " + p);
    process.exit(1);
  }
  console.log(`All ${checked} lesson file${checked === 1 ? "" : "s"} passed (lessons settings: ${names.join(", ")}).`);
  process.exit(0);
}
