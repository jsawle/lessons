// Fix test 1.0. node review/tools/fix-test.mjs cases.json outdir [time zone]: draws each web map, live by id or from a changed copy (JSON file), follows the steps and records pictures, pop-ups and legend text
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const here = dirname(fileURLToPath(import.meta.url));
const [caseFile, outDir, tz] = process.argv.slice(2);
const cases = JSON.parse(readFileSync(caseFile, "utf8"));
mkdirSync(outDir, { recursive: true });
let current = "";
const tpl = readFileSync(join(here, "fix-test.html"), "utf8");
const server = createServer((q, r) => { r.writeHead(200, { "content-type": "text/html; charset=utf-8" }); r.end(tpl.replace("__WMJSON__", current)); });
await new Promise((r) => server.listen(8793, r));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, timezoneId: tz || "UTC" });
await ctx.route("**/*", (route) => { const u = route.request().url(); if (/arcgis\.com|arcgisonline\.com/.test(u)) return route.continue({ headers: { ...route.request().headers(), referer: "https://www.arcgis.com/" } }); return route.continue(); });
const out = [];
for (const c of cases) {
  current = c.json ? readFileSync(c.json, "utf8").replace(/<\//g, "<\\/") : "{}";
  const page = await ctx.newPage(); page.setDefaultTimeout(240000);
  page.on("console", (m) => { if (m.type() === "error") console.log("  console:", m.text().slice(0, 200)); });
  await page.goto(`http://localhost:8793/?webmap=${c.webmap || ""}${c.json ? "&json=1" : ""}&cap=90000`);
  await page.waitForFunction(() => window.H && (window.H.ready || window.H.error), null, { timeout: 240000 });
  const err = await page.evaluate(() => H.error || null); if (err) { console.log(c.name, "LOAD ERROR", err); out.push({ case: c.name, error: err }); await page.close(); continue; }
  for (const st of c.steps) {
    try {
      await page.evaluate(() => H.closePopup());
      if (st.bookmark) await page.evaluate((b) => H.bookmark(b), st.bookmark);
      for (const t of st.off || []) await page.evaluate((t) => H.visible(t, false), t);
      for (const t of st.on || []) await page.evaluate((t) => H.visible(t, true), t);
      if (st.goTo) await page.evaluate((g) => H.goTo(g[0], g[1], g[2]), st.goTo);
      if (st.scale) await page.evaluate(async (s) => { await window.H.goTo(...s); }, st.scale);
      await page.evaluate((on) => H.legend(on), !!st.legend);
      let popup = null;
      if (st.open) { await page.evaluate((o) => H.openFeature(o.layer, o.where, o.at), st.open); }
      if (st.click) { const p = await page.evaluate((c) => H.point(c.layer, c.where, c.inside, c.scale), st.click); await page.mouse.click(p.x, p.y); await page.waitForTimeout(10000); }
      if (st.open || st.click) {
        const pops = page.locator(".esri-popup");
        for (let i = 0; i < await pops.count(); i++) { const el = pops.nth(i); if (await el.isVisible()) { popup = await el.innerText({ timeout: 5000 }); break; } }
      }
      const file = `${c.name}--${st.name}.png`;
      await page.screenshot({ path: join(outDir, file) });
      const legend = st.legend ? await page.evaluate(() => H.legendText()) : null;
      out.push({ case: c.name, step: st.name, popup, legend, scale: await page.evaluate(() => Math.round(window.__view_scale || 0)) });
      console.log(c.name, st.name, popup ? "| " + popup.replace(/\n+/g, " / ").slice(0, 400) : "");
    } catch (e) { console.log(c.name, st.name, "ERROR", (e.message || String(e)).slice(0, 300)); out.push({ case: c.name, step: st.name, error: String(e) }); }
  }
  await page.close();
}
writeFileSync(join(outDir, "result.json"), JSON.stringify(out, null, 1));
await browser.close(); server.close();
