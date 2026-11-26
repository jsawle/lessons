# First World War: battles and front lines (pilot)

Time-enabled layers for World History: where WWI was fought and how the Western Front moved, including the fighting in Africa that is often left out.

| Stage | Status on 26 November 2026 (evening) |
|---|---|
| Battles data | `maps/data/ww1/battles.json`: 62 records (23 Western Front, 39 Africa). **0.2.0** (WWI data builder 1.1, month display dates and Kind) published 26 Nov as Si_Claudius and shared publicly: `e8555557277a43d7aacb09f0dfcfe668` (`ww1_battles_v0_2_0`), 62 features, dates stored as date-only fields. 0.1.0 (`6599fa5ceb624192bfb255f1175f2b8a`) is superseded and can be deleted |
| Front lines data | `maps/data/ww1/western-front-lines.json`: the Armistice line. 0.1.0 published 26 Nov and shared publicly: `5669cf738dd24d6d9f4184e84c3516ad` (`ww1_western_front_lines_v0_1_0`) |
| Open checks | `maps/data/ww1/SOURCES.md`: two unconfirmed dates (Naulila, El Herri), plus partly confirmed records |
| Map spec | `maps/specs/ww1-battles-fronts-lab.json`. 0.1.0 published private 26 Nov as Si_Claudius: `7f2606600450480d87a34d1ac6b26b74`; its read-back differed only in pop-up links (rewritten by ArcGIS Online's sanitizer). 0.1.1 writes the links that way; built with Map builder 1.6 (no warnings), Map test 1.1 6 of 6 with SDK 5.2. To do: publish 0.1.1 with `--update`. Not yet run: Map checker, persona review |
| Lessons | Not yet |

## To publish the data (your computer, signed in by you)

```
python3 maps/data/ww1/build.py
python maps/tools/publish_data.py maps/data/ww1/ww1-battles.data.json --profile g4s-publisher --go
```

Each run prints the item id and layer URL and writes them to `maps/data/build/ww1/publish-log.jsonl`. Those ids go into the lab map spec.

## Next

1. **More Western Front lines, each from a public-domain map.** Still to come: furthest German advance (September 1914), the stalemate line (1915 to February 1917), after the withdrawal to the Hindenburg Line (spring 1917), 20 March 1918, and furthest German advance (July 1918). Candidate sources: the AEF G-3 annotated "Major Offensive and Defensive Operations" map (Truman Library M608, 1920), ABMC 1938 plates, and the USMA WWI atlas (once its reprint terms are confirmed). The control-point method in `trace_armistice.py` should carry over.
2. **Update the lab map to 0.1.1** (your computer): `python maps/tools/publish_map.py maps/build/ww1-battles-fronts-lab --profile g4s-publisher --update --go`, then look at it in Map Viewer and the Atlas app.
3. Settle the open checks, then run the Map checker and persona review.
4. Later: other fronts (Eastern, Italian, Gallipoli, Middle East), and the Asia-Pacific colonies (Tsingtao, German New Guinea, Samoa).
