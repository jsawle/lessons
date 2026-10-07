# MapMaker Lesson Player (Lab)

A reusable player for MapMaker lessons. Each lesson is a small data spec: web map, layers, clues and places. The player reads the answers directly from the map data, so nobody has to type up answer keys.

**Live:** https://jsawle.github.io/lessons/

## Games
- **Mystery Place** (v1.0.1): students get climate clues and use the map layers to find the place. They score points for distance and for how well their place's data matches the clues.

## Layer access check
Before the map loads, the player tests each web map layer from this website. Any layer that refuses access (for example a service proxy limited to arcgis.com referrers) is skipped, so students never see a sign-in box. Teachers can see the list of skipped layers under Teacher tools (`?teacher=1`).

## Changelog
- **1.0.1**: Layer access check v1.0 added. Data reader v1.1: elevation stays readable when its map layer is skipped.
- **1.0.0**: First lab release.

## URL options
| Parameter | Effect |
|---|---|
| `?teacher=1` | Shows teacher tools: the answer key, and a check of the Teacher Guide figures against the live data |
| `?seed=7B` | Gives the whole class the same game |
| `?lesson=specs/<file>.json` | Loads a different lesson spec (merged over the built-in default) |

## Lessons
| Spec | Lesson | Web map |
|---|---|---|
| `specs/climate-regions-uncovered.json` | Climate Regions Uncovered (grades 6–8) | `ba213b54efd74fdb9cf13086fa570ccf` |

## Privacy
There are no accounts or logins, and no student data is collected or stored by Esri. Results stay on the student's device and can be downloaded as a CSV to hand in through the school's own systems.

Created by Jason Sawle · © Esri 2026
