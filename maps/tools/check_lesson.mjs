#!/usr/bin/env node
// Lesson check 1.0: runs the lesson checker (resources/assets/lesson-core.js) on a draft lesson file that is not yet in the
// catalogue (maps/lessons/<id>.json), with every lessons settings file merged over site.json, as validate.mjs does.
//   node maps/tools/check_lesson.mjs maps/lessons/<id>.json
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const res = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "resources");
const MMR = require(join(res, "assets/lesson-core.js"));
const file = resolve(process.argv[2]);
const lesson = JSON.parse(readFileSync(file, "utf8"));
const base = JSON.parse(readFileSync(join(res, "site.json"), "utf8"));
const names = readdirSync(res).filter((f) => /-lessons\.json$/.test(f)).map((f) => f.replace(/-lessons\.json$/, ""));
let bad = 0;
for (const n of names) {
  const site = MMR.mergeSite(base, JSON.parse(readFileSync(join(res, MMR.lessonsFileName(n)), "utf8")), n);
  const found = MMR.check(site, lesson, basename(file));
  for (const p of found) console.error(`[${n}] ${p}`);
  bad += found.length;
}
console.log(bad ? `${bad} problem(s)` : `Lesson check 1.0: ${basename(file)} passed (${names.join(", ")}; checker ${MMR.VERSION.checker}).`);
process.exit(bad ? 1 : 0);
