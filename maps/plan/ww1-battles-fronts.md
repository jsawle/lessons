# First World War: battles and front lines (pilot)

Time-enabled layers for World History: where WWI was fought and how the Western Front moved, including the fighting in Africa that is often left out.

| Stage | Status on 26 November 2026 (evening) |
|---|---|
| Battles data | `maps/data/ww1/battles.json`: 62 records (23 Western Front, 39 Africa). 0.1.0 published private 26 Nov as Si_Claudius: `6599fa5ceb624192bfb255f1175f2b8a`, read-back 62. **0.2.0** (WWI data builder 1.1) adds month display dates for the time slider (ShowFrom, ShowTo, ShowToSoFar) and Kind; built, publish checks pass, not yet published. Once 0.2.0 is published, 0.1.0 can be deleted |
| Front lines data | `maps/data/ww1/western-front-lines.json`: the Armistice line. 0.1.0 published private 26 Nov as Si_Claudius: `5669cf738dd24d6d9f4184e84c3516ad` (`ww1_western_front_lines_v0_1_0`), read-back 1. Unchanged in 1.1 |
| Open checks | `maps/data/ww1/SOURCES.md`: two unconfirmed dates (Naulila, El Herri), plus partly confirmed records |
| Map spec | `maps/specs/ww1-battles-fronts-lab.json` 0.1.0: lab map; the slider steps a month at a time on the 11th, from August 1914 to 11 November 1918. Layers: Armistice line; fighting this month (circle, square or diamond by Kind); fighting in earlier months (grey). Six checks. Not built: it needs the battles 0.2.0 item id, and Map builder reads only public layers |
| Lessons | Not yet |

## To publish the data (your computer, signed in by you)

```
python3 maps/data/ww1/build.py
python maps/tools/publish_data.py maps/data/ww1/ww1-battles.data.json --profile g4s-publisher --go
```

Each run prints the item id and layer URL and writes them to `maps/data/build/ww1/publish-log.jsonl`. Those ids go into the lab map spec.

## Next

1. **More Western Front lines, each from a public-domain map.** Still to come: furthest German advance (September 1914), the stalemate line (1915 to February 1917), after the withdrawal to the Hindenburg Line (spring 1917), 20 March 1918, and furthest German advance (July 1918). Candidate sources: the AEF G-3 annotated "Major Offensive and Defensive Operations" map (Truman Library M608, 1920), ABMC 1938 plates, and the USMA WWI atlas (once its reprint terms are confirmed). The control-point method in `trace_armistice.py` should carry over.
2. **Build and test the lab map** once battles 0.2.0 is published and both layers are shared publicly: fill in the item id, then Map builder, Map test (SDK 5.2), Map publish.
3. Settle the open checks, then run the Map checker and persona review.
4. Later: other fronts (Eastern, Italian, Gallipoli, Middle East), and the Asia-Pacific colonies (Tsingtao, German New Guinea, Samoa).
