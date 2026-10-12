#!/usr/bin/env node
// Makes the Word student sheets for upload to ArcGIS Online, using the same builder as the page's download button.
// Run from the repo root:  node resources/tools/build-sheets.mjs [lesson-id ...] [--out folder]
// Needs the docx package once:  npm install docx@9.7.1
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let docx;
try { docx = require("docx"); }
catch { console.error("The docx package isn't installed. Run: npm install docx@9.7.1"); process.exit(1); }
const MMR = require(join(root, "assets/lesson-core.js"));
const Sheet = require(join(root, "assets/sheet.js"));

const args = process.argv.slice(2);
const outAt = args.indexOf("--out");
const out = resolve(outAt >= 0 ? args.splice(outAt, 2)[1] : "sheets-out");
const site = JSON.parse(readFileSync(join(root, "site.json"), "utf8"));
const ids = args.length ? args : JSON.parse(readFileSync(join(root, "lessons/index.json"), "utf8")).lessons;

mkdirSync(out, { recursive: true });
let failed = false;
for (const id of ids) {
  const lesson = JSON.parse(readFileSync(join(root, "lessons", id + ".json"), "utf8"));
  const problems = MMR.check(site, lesson, id + ".json");
  if (problems.length) { console.error(`${id}: skipped, fix these first:\n  - ${problems.join("\n  - ")}`); failed = true; continue; }
  for (const lang of Object.keys(lesson.languages)) {
    const buf = await docx.Packer.toBuffer(Sheet.build(docx, site, lesson, lang));
    const file = join(out, Sheet.fileName(lesson, lang));
    writeFileSync(file, buf);
    console.log(`Wrote ${file} (version ${lesson.contentVersion}${lesson.languages[lang].status === "draft" ? ", draft translation" : ""})`);
  }
}
process.exit(failed ? 1 : 0);
