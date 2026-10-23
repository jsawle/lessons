// Checker runner 1.0. node review/tools/run-mapchecker.mjs <checker html> <out.json> id1,id2,...  -> runs Jason's MapMaker Web Map Auditor headless and saves its batch export
import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
const [html, out, ids] = process.argv.slice(2);
const server = createServer((q, r) => { r.writeHead(200, { "content-type": "text/html; charset=utf-8" }); r.end(readFileSync(html)); });
await new Promise((r) => server.listen(8778, r));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
await ctx.route("**/*", (route) => {
  const u = route.request().url();
  if (/arcgis\.com|arcgisonline\.com/.test(u)) return route.continue({ headers: { ...route.request().headers(), referer: "https://www.arcgis.com/" } });
  return route.continue();
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(`http://localhost:8778/?ids=${ids}&run=1`);
await page.waitForFunction(() => /map\(s\) audited/.test((document.getElementById("status") || {}).textContent || ""), null, { timeout: 600000 });
const res = await page.evaluate(() => ({
  status: document.getElementById("status").textContent,
  rubricVersion: RUBRIC.version,
  rows: BATCH.rows.map((r) => ({ id: r.id, title: r.title, err: r.err || null })),
  maps: Object.values(BATCH.audits).map(exportJSON),
}));
res.pageErrors = errors;
writeFileSync(out, JSON.stringify(res, null, 1));
await page.screenshot({ path: out.replace(/\.json$/, ".png"), fullPage: true });
console.log(res.status, "| maps:", res.maps.length, "| errors:", errors.length);
await browser.close(); server.close();
