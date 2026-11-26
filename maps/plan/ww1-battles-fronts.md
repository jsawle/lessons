# First World War: battles and front lines (pilot)

Time-enabled layers for World History: where WWI was fought and how the Western Front moved, including the fighting in Africa that is often left out.

| Stage | Status on 26 November 2026 |
|---|---|
| Battles data | `maps/data/ww1/battles.json`: 62 records (23 Western Front, 39 Africa). Data 0.1.0, built with WWI data builder 1.0; publish checks pass locally (fingerprint, count, 5 known values). Not published |
| Front lines data | `maps/data/ww1/western-front-lines.json`: one line, the Armistice (11 Nov 1918), traced from a 1918 US Army map (LOC). Data 0.1.0; publish checks pass locally. Not published |
| Open checks | `maps/data/ww1/SOURCES.md`: two unconfirmed dates (Naulila, El Herri), plus partly confirmed records |
| Map spec | Not yet. It needs the published layer ids |
| Lessons | Not yet |

## To publish the data (your computer, signed in by you)

```
python3 maps/data/ww1/build.py
python maps/tools/publish_data.py maps/data/ww1/ww1-battles.data.json --profile NAME --go
python maps/tools/publish_data.py maps/data/ww1/ww1-western-front-lines.data.json --profile NAME --go
```

Each run prints the item id and layer URL and writes them to `maps/data/build/ww1/publish-log.jsonl`. Those ids go into the lab map spec.

## Next

1. **More Western Front lines, each from a public-domain map.** Still to come: furthest German advance (September 1914), the stalemate line (1915 to February 1917), after the withdrawal to the Hindenburg Line (spring 1917), 20 March 1918, and furthest German advance (July 1918). Candidate sources: the AEF G-3 annotated "Major Offensive and Defensive Operations" map (Truman Library M608, 1920), ABMC 1938 plates, and the USMA WWI atlas (once its reprint terms are confirmed). The control-point method in `trace_armistice.py` should carry over.
2. **A lab map spec** with the time slider. Battles use StartDate/EndDate; lines use ShowFrom/ShowTo. A single-day line (the Armistice) needs a slider step that lands on it, or a longer ShowTo.
3. Settle the open checks, then run the Map checker and persona review.
4. Later: other fronts (Eastern, Italian, Gallipoli, Middle East), and the Asia-Pacific colonies (Tsingtao, German New Guinea, Samoa).
