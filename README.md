# MapMaker Lesson Player (Lab)

A reusable player for MapMaker lessons. Each lesson is a small data spec: web map, layers, clues and places. The player reads the answers directly from the map data, so nobody has to type up answer keys.

**Live:** https://jsawle.github.io/lessons/

## Games
- **Mystery Place** (v1.0.0): students get climate clues and use the map layers to find the place. They score points for distance and for how well their place's data matches the clues.

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
