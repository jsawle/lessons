// Map capture 1.0, direct pop-ups: opens the pop-up a student gets for a named feature (H.openFeature) and records its text.
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
const [planFile, outDir] = process.argv.slice(2); mkdirSync(outDir, { recursive: true });
const plans = JSON.parse(readFileSync(planFile, "utf8"));
const server = createServer((q, r) => { r.writeHead(200, { "content-type": "text/html" }); r.end(readFileSync(new URL("./map-capture.html", import.meta.url))); });
await new Promise((r) => server.listen(Number(process.argv[4]||8796), r));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
await ctx.route("**/*", (route) => { const u = route.request().url(); if (/arcgis\.com|arcgisonline\.com/.test(u)) return route.continue({ headers: { ...route.request().headers(), referer: "https://www.arcgis.com/" } }); return route.continue(); });
const out = {};
for (const p of plans) {
  const page = await ctx.newPage(); page.setDefaultTimeout(120000);
  await page.goto(`http://localhost:${process.argv[4]||8796}/?webmap=${p.webmap}`);
  await page.waitForFunction(() => window.H && (window.H.ready || window.H.error), null, { timeout: 120000 });
  for (const f of p.features) {
    try {
      for (const t of f.on || []) await page.evaluate((t) => H.visible(t, true), t);
      if (f.bookmark) await page.evaluate((b) => H.bookmark(b), f.bookmark);
      await page.evaluate((x) => H.openFeature(x.layer, x.where, x.at), f);
      let text = null; const pops = page.locator(".esri-popup");
      for (let i = 0; i < await pops.count(); i++) { if (await pops.nth(i).isVisible()) { text = await pops.nth(i).innerText({ timeout: 5000 }); break; } }
      const file = `${p.lesson}--${f.name}.png`; await page.screenshot({ path: join(outDir, file) });
      (out[p.lesson] = out[p.lesson] || []).push({ name: f.name, what: f.what, file, popup: text });
      console.log(p.lesson, f.name, (text || "(none)").slice(0, 80).replace(/\n/g, " "));
      await page.evaluate(() => H.closePopup());
    } catch (e) { console.log(p.lesson, f.name, "ERROR", String(e.message || e).slice(0, 150)); }
  }
  await page.close();
}
writeFileSync(join(outDir, "direct.json"), JSON.stringify(out, null, 1));
await browser.close(); server.close();
