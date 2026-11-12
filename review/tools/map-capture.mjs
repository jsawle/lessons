// Map capture 1.1. node review/tools/map-capture.mjs plans.json outdir [port] [timeZone]
// Follows each lesson's steps on its live web map (ArcGIS Maps SDK for JavaScript 4.34, headless Chromium, 1200 x 800)
// and records a picture, the legend text and the pop-up text for each step in outdir/record.json.
// 1.1: the browser runs in a United States time zone (America/Chicago unless a fourth argument or MAP_CAPTURE_TZ says otherwise),
// because a date stored as midnight UTC shows as the evening before there, which a capture in UTC misses. The time zone used
// is written to record.json under "_capture". A step that takes longer than 180 s is logged and skipped, and record.json is
// written after every step. After a click it waits until a pop-up shows, clicking the same point again
// if nothing opens (up to three clicks, about 30 s in all), so a slow pop-up is recorded with its own step.
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const here = dirname(fileURLToPath(import.meta.url));
const [planFile, outDir, portArg, tzArg] = process.argv.slice(2);
const TIME_ZONE = tzArg || process.env.MAP_CAPTURE_TZ || "America/Chicago";
const PORT = Number(portArg || 8779);
const plans = JSON.parse(readFileSync(planFile, "utf8"));
mkdirSync(outDir, { recursive: true });
const server = createServer((q, r) => { r.writeHead(200, { "content-type": "text/html" }); r.end(readFileSync(join(here, "map-capture.html"))); });
await new Promise((r) => server.listen(PORT, r));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, timezoneId: TIME_ZONE });
await ctx.route("**/*", (route) => {
  const u = route.request().url();
  if (/arcgis\.com|arcgisonline\.com/.test(u)) return route.continue({ headers: { ...route.request().headers(), referer: "https://www.arcgis.com/" } });
  return route.continue();
});
const record = { _capture: { tool: "Map capture 1.1", timeZone: TIME_ZONE, when: new Date().toISOString(), viewport: "1200 x 800" } };
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
      try { await Promise.race([(async () => {
        page.setDefaultTimeout(120000);
        await page.evaluate(() => H.closePopup());
        for (let i = 0; i < 10; i++) {  // make sure the last step's pop-up has gone before this step starts
          const open = await page.evaluate(() => [...document.querySelectorAll(".esri-popup")].some((e) => e.offsetParent !== null && e.innerText.trim().length > 0));
          if (!open) break;
          await page.evaluate(() => H.closePopup()); await page.waitForTimeout(400);
        }
        if (st.home) await page.evaluate(() => H.home());
        if (st.bookmark) await page.evaluate((b) => H.bookmark(b), st.bookmark);
        for (const t of st.on || []) await page.evaluate((t) => H.visible(t, true), t);
        for (const t of st.off || []) await page.evaluate((t) => H.visible(t, false), t);
        if (st.goTo) await page.evaluate((g) => H.goTo(g[0], g[1], g[2]), st.goTo);
        await page.evaluate((on) => H.legend(on), !!st.legend);
        let popup = null; var fetched = null; let opened = false;
        if (st.click) {
          await page.evaluate((f) => { window.__frac = f; }, st.click.frac == null ? 0.5 : st.click.frac);
          const p = await page.evaluate((c) => H.point(c.layer, c.where, c.inside, c.scale), st.click);
          await page.evaluate((on) => H.legend(on), !!st.legend);
          fetched = null;
          if (st.fetch) { fetched = await page.evaluate((q) => H.fetchAt(q.x, q.y), p); }
          else {
            // Click, then wait for the pop-up to appear instead of waiting a fixed time. On a slow machine a click made while a
            // layer is still drawing can open nothing, or open so late that it is recorded against the next step. So: wait
            // until the view has stopped drawing (up to 20 s), close anything left open, click, and wait up to 12 s; click the
            // same point once more if nothing opened. If there is still nothing, and the layer has a pop-up, the pop-up is
            // opened directly for the feature the step names and the step is marked "opened": true in record.json.
            const shownNow = () => page.evaluate(() => [...document.querySelectorAll(".esri-popup")].some((e) => e.offsetParent !== null && e.innerText.trim().length > 0));
            const idle = async (ms) => { const t = Date.now(); while (Date.now() - t < ms && (await page.evaluate(() => H.stillUpdating))) await page.waitForTimeout(500); };
            await idle(20000);
            await page.evaluate(() => H.closePopup()); await page.waitForTimeout(600);
            if (await shownNow()) { await page.evaluate(() => H.closePopup()); await page.waitForTimeout(1500); }
            for (let attempt = 0; attempt < 2; attempt++) {
              await page.mouse.click(p.x, p.y);
              const t0 = Date.now();
              while (Date.now() - t0 < (st.wait || 12000) && !(await shownNow())) await page.waitForTimeout(500);
              if (await shownNow()) break;
              await idle(8000);
            }
            if (!(await shownNow())) {
              const info = (await page.evaluate(() => H.layers())).find((l) => l.title === st.click.layer);
              if (info && info.popupEnabled !== false && info.hasPopup) {
                await page.evaluate((c) => H.openFeature(c.layer, c.where, c.inside), st.click);
                opened = true;
              }
            }
            await page.waitForTimeout(2500);
          }
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
        rec.shots.push({ name: st.name, file, what: st.what, popup, legend, stillDrawing: !!still, opened, fetched: typeof fetched === "undefined" ? null : fetched });
        if (st.click) await page.evaluate(() => H.closePopup());
      })(), new Promise((_, rej) => setTimeout(() => rej(new Error("step timed out after 180 s")), 180000))]);
      } catch (e) { rec.log.push(`${st.name}: ${e.message || e}`); }
      writeFileSync(join(outDir, "record.json"), JSON.stringify(record, null, 1));  // after every step, so a stuck step loses nothing
    }
  } catch (e) { rec.log.push("load: " + (e.message || e)); }
  console.log(plan.lesson, rec.shots.length, "shots", rec.log.length ? rec.log : "");
  writeFileSync(join(outDir, "record.json"), JSON.stringify(record, null, 1));
  await page.close();
}
writeFileSync(join(outDir, "record.json"), JSON.stringify(record, null, 1));
await browser.close(); server.close();
