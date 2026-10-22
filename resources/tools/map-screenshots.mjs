#!/usr/bin/env node
// Map pictures v1.0: takes a picture of each lesson's web map at its opening view, for map.image on the lesson pages.
// Run by the "Map pictures" workflow on GitHub (it needs a browser and the open internet), from the repo root:
//   npm install --no-save playwright   then   npx playwright install --with-deps chromium
//   node resources/tools/map-screenshots.mjs [lesson id ...]      (no ids: every lesson in resources/lessons/index.json)
// Writes resources/assets/screenshots/<lesson id>.jpg (1200 x 675) and report.json, which lists the layers that drew
// and any that failed, so a picture can be checked against the lesson file before it is used.
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const res = join(repo, "resources");
const out = join(res, "assets", "screenshots");
const WIDTH = 1200, HEIGHT = 675, QUALITY = 82, TIMEOUT_MS = 120000;
mkdirSync(out, { recursive: true });

const ids = process.argv.slice(2).length ? process.argv.slice(2) : JSON.parse(readFileSync(join(res, "lessons/index.json"), "utf8")).lessons;

// A small static server, so the map page is served over http like any other page.
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".css": "text/css" };
const server = createServer((req, rsp) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const file = join(repo, path);
  if (!file.startsWith(repo) || !existsSync(file)) { rsp.writeHead(404); rsp.end(); return; }
  rsp.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  rsp.end(readFileSync(file));
});
await new Promise((r) => server.listen(8765, r));

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
// Some MapMaker layers come through service proxies that only answer pages on arcgis.com, as the map does inside the
// Atlas app; send that referrer so they draw here too.
await context.route("**/*", (route) => {
  const req = route.request();
  if (/(^|\.)(arcgis\.com|arcgisonline\.com|arcgis\.net)(:\d+)?\//.test(req.url().replace(/^https?:\/\//, ""))) {
    return route.continue({ headers: { ...req.headers(), referer: "https://www.arcgis.com/" } });
  }
  return route.continue();
});

const report = { tool: "Map pictures 1.0", width: WIDTH, height: HEIGHT, lessons: {} };
let failed = 0;
for (const id of ids) {
  const lesson = JSON.parse(readFileSync(join(res, "lessons", id + ".json"), "utf8"));
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300)); });
  const entry = { webmapId: lesson.map.webmapId, file: id + ".jpg" };
  try {
    await page.goto(`http://localhost:8765/resources/tools/map-shot.html?webmap=${lesson.map.webmapId}`, { waitUntil: "load" });
    await page.waitForFunction(() => window.__mapStatus && window.__mapStatus.state !== "loading", null, { timeout: TIMEOUT_MS });
    const status = await page.evaluate(() => window.__mapStatus);
    Object.assign(entry, status);
    if (status.state === "ready") {
      await page.screenshot({ path: join(out, id + ".jpg"), type: "jpeg", quality: QUALITY });
    } else failed++;
  } catch (e) {
    entry.state = "error"; entry.message = String(e.message || e).slice(0, 300); failed++;
  }
  entry.consoleErrors = consoleErrors.slice(0, 10);
  report.lessons[id] = entry;
  const bad = (entry.layers || []).filter((l) => l.loadStatus === "failed");
  console.log(`${id}: ${entry.state}${bad.length ? `, ${bad.length} layer(s) failed: ${bad.map((l) => l.title).join("; ")}` : ""}`);
  await page.close();
}
writeFileSync(join(out, "report.json"), JSON.stringify(report, null, 1) + "\n");
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
