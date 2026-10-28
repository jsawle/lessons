// Map test 1.0: draws a built web map (maps/build/<id>/webmap.json) with the ArcGIS Maps SDK for JavaScript 4.34 in
// headless Chromium, set to US Central time, follows the spec's checks (bookmarks, layers on and off, zoom, clicks)
// and tests what a student would see: pop-up text, legend text, which layers draw. Optionally runs the MapMaker Web
// Map Auditor on the same build. Writes maps/build/<id>/test/ (pictures, results.json, checker.json) and records the result,
// with the fingerprint of the build it tested, in report.json; the publish script refuses a build without a pass.
//
//   node maps/tools/test_map.mjs maps/build/<id> [--checker path/to/mapchecker/index.html] [--tz America/Chicago]
// Needs playwright (npm i playwright); uses the Chromium at PLAYWRIGHT_BROWSERS_PATH.
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { chromium } from "playwright";

const VERSION = "1.0";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const buildDir = resolve(args[0]);
const tz = opt("--tz", "America/Chicago");
const checkerHtml = opt("--checker", null);

const report = JSON.parse(readFileSync(join(buildDir, "report.json"), "utf8"));
const webmap = JSON.parse(readFileSync(join(buildDir, "webmap.json"), "utf8"));
const item = JSON.parse(readFileSync(join(buildDir, "item.json"), "utf8"));
const spec = JSON.parse(readFileSync(join(root, report.spec), "utf8"));
const fp = createHash("sha1").update(readFileSync(join(buildDir, "webmap.json"))).digest("hex");
if (fp !== report.webmapFingerprint) { console.error("webmap.json has changed since it was built; build it again first"); process.exit(1); }
const outDir = join(buildDir, "test");
mkdirSync(outDir, { recursive: true });

const page_html = readFileSync(join(here, "test_map.html"), "utf8").replace("__WMJSON__", JSON.stringify(webmap).replace(/<\//g, "<\\/"));
const server = createServer((q, r) => { r.writeHead(200, { "content-type": "text/html; charset=utf-8" }); r.end(q.url.startsWith("/checker") ? readFileSync(checkerHtml) : page_html); });
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, timezoneId: tz });
const fakeId = fp.slice(0, 32);
await ctx.route("**/*", (route) => {
  const u = route.request().url();
  if (u.includes(`/content/items/${fakeId}/data`)) return route.fulfill({ contentType: "application/json", body: JSON.stringify(webmap) });
  if (u.includes(`/content/items/${fakeId}?`)) {
    const it = { ...item, id: fakeId, owner: "build", access: "public", tags: item.tags.split(","), typeKeywords: item.typeKeywords.split(","),
                 extent: [[...item.extent.split(",").slice(0, 2).map(Number)], [...item.extent.split(",").slice(2).map(Number)]], thumbnail: null };
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(it) });
  }
  if (/arcgis\.com|arcgisonline\.com/.test(u)) return route.continue({ headers: { ...route.request().headers(), referer: "https://www.arcgis.com/" } });
  return route.continue();
});

const results = [];
const page = await ctx.newPage();
page.setDefaultTimeout(240000);
await page.goto(`http://localhost:${port}/?json=1&cap=90000`);
await page.waitForFunction(() => window.H && (window.H.ready || window.H.error), null, { timeout: 240000 });
const loadError = await page.evaluate(() => window.H.error || null);
if (loadError) results.push({ name: "load", pass: false, failures: [`the map didn't load: ${loadError}`] });
for (const c of loadError ? [] : spec.checks || []) {
  const d = c.do || {}, e = c.expect || {}, failures = [];
  let popup = null, legend = null;
  try {
    await page.evaluate(() => H.closePopup());
    if (d.bookmark) await page.evaluate((b) => H.bookmark(b), d.bookmark);
    for (const t of d.off || []) await page.evaluate((t) => H.visible(t, false), t);
    for (const t of d.on || []) await page.evaluate((t) => H.visible(t, true), t);
    if (d.goTo) await page.evaluate((g) => H.goTo(g[0], g[1], g[2]), d.goTo);
    await page.evaluate((on) => H.legend(on), !!(d.legend || e.legendHas));
    if (d.open) await page.evaluate((o) => H.openFeature(o.layer, o.where, o.at), d.open);
    if (d.click) {
      const p = await page.evaluate((k) => H.point(k.layer, k.where, k.inside, k.scale), d.click);
      await page.evaluate(() => H.legend(false));
      await page.mouse.click(p.x, p.y); await page.waitForTimeout(8000);
    }
    if (d.open || d.click) {
      const pops = page.locator(".esri-popup");
      for (let i = 0; i < await pops.count(); i++) { const el = pops.nth(i); if (await el.isVisible()) { popup = await el.innerText({ timeout: 5000 }); break; } }
      if (popup === null) failures.push("no pop-up opened");
    }
    if (e.legendHas) legend = await page.evaluate(() => H.legendText());
    for (const s of e.popupHas || []) if (!(popup || "").includes(s)) failures.push(`pop-up lacks "${s}"`);
    for (const s of e.legendHas || []) if (!(legend || "").includes(s)) failures.push(`legend lacks "${s}"`);
    for (const t of e.drawnAtScale || []) { const s = await page.evaluate((t) => H.drawn(t), t); if (!(s.on && s.inRange)) failures.push(`"${t}" doesn't draw at 1:${s.scale.toLocaleString("en-US")}`); }
    for (const t of e.hiddenAtScale || []) { const s = await page.evaluate((t) => H.drawn(t), t); if (s.on && s.inRange) failures.push(`"${t}" draws at 1:${s.scale.toLocaleString("en-US")}`); }
    if (/\d\.\d{6,}/.test(popup || "")) failures.push("pop-up shows a number with many decimal places");
    if (/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2} [AP]M/.test(popup || "")) failures.push("pop-up shows a date with a time");
  } catch (err) { failures.push(`error: ${String(err.message || err).slice(0, 300)}`); }
  await page.screenshot({ path: join(outDir, `${c.name}.jpg`), type: "jpeg", quality: 80 });
  results.push({ name: c.name, question: c.question || null, pass: failures.length === 0, failures, popup, legend });
  console.log(failures.length ? "FAIL" : "pass", c.name, failures.join("; "));
}
await page.close();

let checker = null;
if (checkerHtml) {
  const cp = await ctx.newPage();
  await cp.goto(`http://localhost:${port}/checker?ids=${fakeId}&run=1`);
  await cp.waitForFunction(() => /map\(s\) audited/.test((document.getElementById("status") || {}).textContent || ""), null, { timeout: 600000 });
  checker = await cp.evaluate(() => ({ rubricVersion: RUBRIC.version, maps: Object.values(BATCH.audits).map(exportJSON) }));
  writeFileSync(join(outDir, "checker.json"), JSON.stringify(checker, null, 1));
  const m = checker.maps[0] || {};
  console.log("checker:", JSON.stringify({ score: m.score ?? m.total ?? null, grade: m.grade ?? null, verdict: m.verdict ?? null }));
  await cp.close();
}
await browser.close(); server.close();

const pass = results.length > 0 && results.every((r) => r.pass);
writeFileSync(join(outDir, "results.json"), JSON.stringify({ tool: `Map test ${VERSION}`, timeZone: tz, sdk: "ArcGIS Maps SDK for JavaScript 4.34", webmapFingerprint: fp, results }, null, 1));
report.tested = { tool: `Map test ${VERSION}`, when: new Date().toISOString().replace(/\.\d+Z$/, "Z"), timeZone: tz, webmapFingerprint: fp, pass,
                  checks: results.map((r) => ({ name: r.name, pass: r.pass, failures: r.failures })), checker: checker ? "test/checker.json" : null };
writeFileSync(join(buildDir, "report.json"), JSON.stringify(report, null, 1) + "\n");
console.log(pass ? `PASS: ${results.length} checks` : `FAIL: ${results.filter((r) => !r.pass).length} of ${results.length} checks failed`);
process.exit(pass ? 0 : 1);
