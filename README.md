# MapMaker Lesson Player (Lab)

A reusable player for MapMaker lessons. Each lesson is a small data spec: web map, layers, clues and places. The player reads the answers directly from the map data, so nobody has to type up answer keys.

**Live:** https://jsawle.github.io/lessons/

## Where it fits with MapMaker
The player is an entry point into MapMaker, not a replacement for it. It uses the same reviewed MapMaker web maps, and every round and the end screen hand students off to MapMaker ("Investigate … in MapMaker"), opened on the same web map. The game is designed to sit as a tab inside the lesson's Portfolio, next to the MapMaker tab.

## Games
- **Mystery Place** (v1.1.0): students get climate clues and use the map layers to find the place. They score points for distance and for how well their place's data matches the clues.

## Layer access check
Before the map loads, the player tests each web map layer from this website. Any layer that refuses access (for example a service proxy limited to arcgis.com referrers) is skipped, so students never see a sign-in box. Teachers can see the list of skipped layers under Teacher tools (`?teacher=1`).

## URL options
| Parameter | Effect |
|---|---|
| `?teacher=1` | Shows teacher tools: answer key, Teacher Guide check against live data, layer access check, MapMaker handoff test |
| `?seed=7B` | Gives the whole class the same game |
| `?lesson=specs/<file>.json` | Loads a different lesson spec (merged over the built-in default) |
| `?mapmakerApp=<appid>` | Sends the handoff links to a different MapMaker/Atlas app (for distributors, e.g. Esri South Africa) |

## Lesson spec: MapMaker handoff
```json
"mapmaker": { "appId": "0cd1cdee853c413a84bfe4b9a6931f0d", "portalUrl": "https://www.arcgis.com",
              "label": "National Geographic MapMaker", "passLocation": false }
```
`passLocation` adds `&center=lon,lat&level=n` so MapMaker opens at the mystery place. It is off until we've confirmed Atlas accepts those parameters. Use the test link under Teacher tools to check.

## Lessons
| Spec | Lesson | Web map |
|---|---|---|
| `specs/climate-regions-uncovered.json` | Climate Regions Uncovered (grades 6–8) | `ba213b54efd74fdb9cf13086fa570ccf` |

## Tools
- `tools/make_lab_portfolio.py`: run in an ArcGIS Notebook. It makes a private lab copy of a lesson Portfolio with a Mystery Place tab added. The original is only read, never changed.

## Changelog
- **1.1.0**: MapMaker handoff v1.0 adds "Open in MapMaker" (header), "Investigate … in MapMaker" (every round) and "Keep exploring in MapMaker" (end), set per lesson or with `?mapmakerApp=`. Also adds "Copy my results" with a fallback for when downloads are blocked inside a Portfolio tab, plus a handoff test under Teacher tools.
- **1.0.1**: Layer access check v1.0 added. Data reader v1.1: elevation stays readable when its map layer is skipped.
- **1.0.0**: First lab release.

## Resource pages (lab)
A mock-up of Support Hub lesson pages, at `resources/`. Live at https://jsawle.github.io/lessons/resources/

**One file per lesson.** Everything on a lesson page comes from `resources/lessons/<id>.json`: the page, the English and Spanish Word student sheets, the how-to video links and the lesson's entry in Vera's knowledge file. Change the file and all of them change together.

**To add a lesson**
1. Copy `resources/lessons/_template.json` to `resources/lessons/<id>.json`, where `<id>` is lower-case words joined by hyphens. Set `"id"` to match.
2. Fill it in. Editors that read JSON Schema (VS Code, for example) flag mistakes as you type, using `resources/schema/lesson.schema.json`.
3. Add the id to `resources/lessons/index.json`.
4. Open `resources/lesson.html?id=<id>`. Any problems show in a red banner at the top.

**To change a lesson**: edit its file, bump `contentVersion` (patch for typos, minor for changed questions, major for a new map) and set `updated`. When it has been checked, set `status` to `reviewed` and fill in `reviewed.by` and `reviewed.date`. Log map or answer problems under `knownIssues`.

**Shared settings** live once in `resources/site.json`: Hub address and menu, Hub pages for each subject and course, the MapMaker app, tool names and their how-to pages, sheet wording, and the versions table.

**Checks**: `node resources/tools/validate.mjs` runs the same checker as the page, confirms every file is listed in `index.json`, checks the Hub pages built from the files only use HTML that Hub keeps, and checks the versions table in `site.json` matches the code.

**Built files** (`resources/dist`, served by GitHub Pages): `hub-bundle.json` (the Hub pages), `sheets/*.docx` (Word student sheets), `vera_mapmaker_lessons.txt` (Vera's knowledge file) and `publish_to_hub.ipynb` (the publishing notebook). GitHub rebuilds and commits them after every change to `main`, so nobody builds them by hand. To build locally: `npm install --no-save docx@9.7.1`, then `node resources/tools/build-dist.mjs`.

**Publishing to the Hub demo site** (`hubDemo` in `site.json`: MapMaker Lessons, gis-4-schools.hub.arcgis.com)
1. Download `https://jsawle.github.io/lessons/resources/dist/publish_to_hub.ipynb` and add it to ArcGIS Online as a notebook, signed in as the site's owner.
2. Run CELL 0 to 3. CELL 1 backs up the site; CELL 3 prints the plan (dry run).
3. Set `DRY_RUN = False` in CELL 0, run CELL 0, then CELL 4. It uploads the Word sheets as Word items, creates or updates one Hub Page per lesson plus a Lessons page, registers each page in the site's pages list, and shares everything.
4. Run CELL 5 to check, then republish the site (Edit layout, then Save/Publish) and add a "Lessons" menu link to `/pages/lessons`.
Run it again after any lesson change: it updates the same pages and Word items. Edit the lesson file, not the Hub page; the page is rebuilt from the file. Preview any Hub page first at `resources/hub-preview.html?page=<slug>`.

**Vera**: each lesson page has "Open Vera with this lesson", which opens Vera's chat page (`vera.url` in `site.json`, currently the lab copy) with the lesson named in the message box. Vera answers from `vera_mapmaker_lessons.txt` in `resources/dist`. In Copilot Studio, upload it under Knowledge, wait for indexing to finish, then delete the old copy. List every bookmark in `map.bookmarks` and describe what each pop-up really shows in `shows`, because Vera writes questions only from those.

| File | Job | Version |
|---|---|---|
| `assets/render.js` | Page renderer (mock-up) | 1.2 |
| `assets/sheet.js` | Word sheet builder | 1.1 |
| `schema/lesson.schema.json` | Lesson file format | 1.1 |
| `assets/lesson-core.js` | Checker | 1.1 |
| `assets/lesson-core.js` | Vera knowledge builder | 1.0 |
| `assets/hub-page.js` | Hub page builder | 1.0 |
| `tools/publish_to_hub.py` | Hub publisher (notebook) | 1.0 |

Resource pages app version 0.3.0. 0.3.0: five Grade 8 US History lessons, Hub pages and the publishing notebook; long Word sheets get tighter writing lines so every sheet stays on one page. 0.2.0: Vera replaces the copy-and-paste AI summary; lesson format 1.1 adds bookmarks. Third-party code: `resources/vendor/docx` (docx 9.7.1, MIT licence).

## Privacy
There are no accounts or logins, and no student data is collected or stored by Esri. Results stay on the student's device and can be downloaded or copied to hand in through the school's own systems.

Created by Jason Sawle
