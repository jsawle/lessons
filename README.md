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

## Privacy
There are no accounts or logins, and no student data is collected or stored by Esri. Results stay on the student's device and can be downloaded or copied to hand in through the school's own systems.

Created by Jason Sawle · © Esri 2026
