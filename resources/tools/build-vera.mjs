#!/usr/bin/env node
// Makes Vera's knowledge file from every lesson file, using the same builder as the catalogue page's download button.
// Run from the repo root:  node resources/tools/build-vera.mjs [--out folder]
// Then upload the .txt in Copilot Studio (Knowledge), wait for it to finish indexing, and only then delete the old copy.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MMR = require(join(root, "assets/lesson-core.js"));

const args = process.argv.slice(2);
const outAt = args.indexOf("--out");
const out = resolve(outAt >= 0 ? args[outAt + 1] : "vera-out");
const site = JSON.parse(readFileSync(join(root, "site.json"), "utf8"));
const ids = JSON.parse(readFileSync(join(root, "lessons/index.json"), "utf8")).lessons;

const lessons = [];
let failed = false;
for (const id of ids) {
  const lesson = JSON.parse(readFileSync(join(root, "lessons", id + ".json"), "utf8"));
  const problems = MMR.check(site, lesson, id + ".json");
  if (problems.length) { console.error(`${id}: left out, fix these first:\n  - ${problems.join("\n  - ")}`); failed = true; continue; }
  lessons.push(lesson);
}
mkdirSync(out, { recursive: true });
const file = join(out, MMR.veraFileName());
writeFileSync(file, MMR.veraFile(site, lessons, new Date().toISOString().slice(0, 10)), "utf8");
console.log(`Wrote ${file} with ${lessons.length} lesson${lessons.length === 1 ? "" : "s"}.`);
process.exit(failed ? 1 : 0);
