// Map capture 1.0. node review/tools/map-capture.mjs plans.json outdir [port]
// Follows each lesson's steps on its live web map (ArcGIS Maps SDK for JavaScript 4.34, headless Chromium, 1200 x 800)
// and records a picture, the legend text and the pop-up text for each step in outdir/record.json.
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const here = dirname(fileURLToPath(import.meta.url));
const [planFile, outDir, portArg] = process.argv.slice(2);
const PORT = Number(portArg || 8779);
const plans = JSON.parse(readFileSync(planFile, "utf8"));
mkdirSync(outDir, { recursive: true });
const server = createServer((q, r) => { r.writeHead(200, { "content-type": "text/html" }); r.end(readFileSync(join(here, "map-capture.html"))); });
await new Promise((r) => server.listen(PORT, r));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
await ctx.route("**/*", (route) => {
  const u = route.request().url();
  if (/arcgis\.com|arcgisonline\.com/.test(u)) return route.continue({ headers: { ...route.request().headers(), referer: "https://www.arcgis.com/" } });
  return route.continue();
});
const record = {};
for (const plan of plans) {
  const page = await ctx.newPage();
  const rec = { webmap: plan.webmap, shots: [], log: [] };
  record[plan.lesson] = rec;
  try {
    await page.goto(`http://localhost:${PORT}/?webmap=${plan.webmap}`);
    await page.waitForFunction(() => window.H && (window.H.ready || window.H.error), null, { timeout: 120000 });
    rec.layers = await page.evaluate(() => H.layers());
    rec.bookmarks = await page.evaluate(() => H.bookmarks());
    for (const st of plan.steps) {
      try {
        page.setDefaultTimeout(120000);
        await page.evaluate(() => H.closePopup());
        if (st.home) await page.evaluate(() => H.home());
        if (st.bookmark) await page.evaluate((b) => H.bookmark(b), st.bookmark);
        for (const t of st.on || []) await page.evaluate((t) => H.visible(t, true), t);
        for (const t of st.off || []) await page.evaluate((t) => H.visible(t, false), t);
        if (st.goTo) await page.evaluate((g) => H.goTo(g[0], g[1], g[2]), st.goTo);
        await page.evaluate((on) => H.legend(on), !!st.legend);
        let popup = null; var fetched = null;
        if (st.click) {
          await page.evaluate((f) => { window.__frac = f; }, st.click.frac == null ? 0.5 : st.click.frac);
          const p = await page.evaluate((c) => H.point(c.layer, c.where, c.inside, c.scale), st.click);
          await page.evaluate((on) => H.legend(on), !!st.legend);
          fetched = null;
          if (st.fetch) { fetched = await page.evaluate((q) => H.fetchAt(q.x, q.y), p); }
          else { await page.mouse.click(p.x, p.y); await page.waitForTimeout(st.wait || 9000); }
          popup = null;
          const pops = page.locator(".esri-popup");
          for (let i = 0; i < await pops.count(); i++) {
            const el = pops.nth(i);
            if (await el.isVisible()) { popup = await el.innerText({ timeout: 5000 }); break; }
          }
        }
        const file = `${plan.lesson}--${st.name}.png`;
        await page.screenshot({ path: join(outDir, file) });
        const legend = st.legend ? await page.evaluate(() => H.legendText()) : null;
        const still = await page.evaluate(() => H.stillUpdating);
        rec.shots.push({ name: st.name, file, what: st.what, popup, legend, stillDrawing: !!still, fetched: typeof fetched === "undefined" ? null : fetched });
        if (st.click) await page.evaluate(() => H.closePopup());
      } catch (e) { rec.log.push(`${st.name}: ${e.message || e}`); }
    }
  } catch (e) { rec.log.push("load: " + (e.message || e)); }
  console.log(plan.lesson, rec.shots.length, "shots", rec.log.length ? rec.log : "");
  writeFileSync(join(outDir, "record.json"), JSON.stringify(record, null, 1));
  await page.close();
}
writeFileSync(join(outDir, "record.json"), JSON.stringify(record, null, 1));
await browser.close(); server.close();
