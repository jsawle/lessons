#!/usr/bin/env node
// Checks every lesson file with the same checker the page uses. Exits 1 if anything is wrong.
// Run from the repo root:  node resources/tools/validate.mjs
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MMR = require(join(root, "assets/lesson-core.js"));

const problems = [];
let checked = 0;
function readJSON(rel) {
  try { return JSON.parse(readFileSync(join(root, rel), "utf8")); }
  catch (e) { problems.push(`${rel}: ${e.code === "ENOENT" ? "file not found" : "not valid JSON: " + e.message}`); return null; }
}

const site = readJSON("site.json");
const index = readJSON("lessons/index.json");
if (!site || !index) { report(); }

const files = readdirSync(join(root, "lessons")).filter((f) => f.endsWith(".json") && f !== "index.json" && !f.startsWith("_"));
const listed = new Set(index.lessons);
for (const f of files) if (!listed.has(f.replace(/\.json$/, ""))) problems.push(`lessons/${f}: not listed in lessons/index.json, so it won't appear in the catalogue.`);
for (const id of index.lessons) if (!files.includes(id + ".json")) problems.push(`lessons/index.json lists "${id}" but lessons/${id}.json doesn't exist.`);

for (const f of files) {
  const lesson = readJSON("lessons/" + f);
  if (!lesson) continue;
  checked++;
  for (const p of MMR.check(site, lesson, f)) problems.push(`lessons/${f}: ${p}`);
  if (lesson.subject && !site.hub.subjectPaths[lesson.subject]) problems.push(`lessons/${f}: subject "${lesson.subject}" has no Hub page in site.json (hub.subjectPaths).`);
  if (lesson.course && !site.hub.coursePaths[lesson.course]) problems.push(`lessons/${f}: course "${lesson.course}" has no Hub page in site.json (hub.coursePaths).`);
}
report();

function report() {
  if (problems.length) {
    console.error(`Found ${problems.length} problem${problems.length === 1 ? "" : "s"}:`);
    for (const p of problems) console.error("  - " + p);
    process.exit(1);
  }
  console.log(`All ${checked} lesson file${checked === 1 ? "" : "s"} passed.`);
  process.exit(0);
}
