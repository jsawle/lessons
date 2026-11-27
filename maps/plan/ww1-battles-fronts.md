# First World War: battles and front lines (pilot)

Time-enabled layers for World History: where WWI was fought and how the Western Front moved, including the fighting in Africa that is often left out.

| Stage | Status on 27 November 2026 |
|---|---|
| Battles data | `maps/data/ww1/battles.json`: 62 records (23 Western Front, 39 Africa). **0.2.0** (WWI data builder 1.1, month display dates and Kind) published 26 Nov as Si_Claudius and shared publicly: `e8555557277a43d7aacb09f0dfcfe668` (`ww1_battles_v0_2_0`), 62 features, dates stored as date-only fields. 0.1.0 (`6599fa5ceb624192bfb255f1175f2b8a`) is superseded and can be deleted |
| Front lines data | `maps/data/ww1/western-front-lines.json`. 0.1.0 (Armistice only) published 26 Nov, public: `5669cf738dd24d6d9f4184e84c3516ad`. **0.2.0** (WWI data builder 1.2) adds three lines traced from Truman Library M1236 (`trace_m1236.py` 1.0): furthest German advance (Sep 1914), front late 1914 to Mar 1917, front Mar 1917 to Mar 1918; checked against Truman M549. Published 27 Nov as Si_Claudius, read-back matches, shared publicly: `7d675f82ed0b40418cf023ba021cdb2b` (`ww1_western_front_lines_v0_2_0`). 0.1.0 is superseded once the lab map moves to 0.2.0. **0.3.0** (27 Nov) adds eight lines from 10 June to 30 October 1918, traced from the Truman "Length of front occupied" series (M557 to M571; `trace_truman_1918.py` 1.0); published 27 Nov as Si_Claudius, read-back matches, shared publicly: `6f328de685ac4b40ab6b987c9c568898` (`ww1_western_front_lines_v0_3_0`). **0.4.0** (27 Nov) adds 20 Sep, 30 Sep, 10 Oct and 20 Oct 1918 (M567 to M570; `trace_truman_1918.py` 1.1); published 27 Nov, read-back matches, shared publicly: `fc8634c59e9145388546296f20ac0271` (`ww1_western_front_lines_v0_4_0`) |
| Open checks | `maps/data/ww1/SOURCES.md`: two unconfirmed dates (Naulila, El Herri), plus partly confirmed records |
| Map spec | `maps/specs/ww1-battles-fronts-lab.json`. 0.1.0 published private 26 Nov as Si_Claudius: `7f2606600450480d87a34d1ac6b26b74`; its read-back differed only in pop-up links (rewritten by ArcGIS Online's sanitizer). 0.1.1 (links fixed) was published over it with `--update`; its read-back showed `<small>` removed too. 0.1.2 drops `<small>`; built with Map builder 1.7 (no warnings), Map test 1.1 6 of 6 with SDK 5.2. Published over it with `--update` on 26 Nov: read-back matches the build. **0.2.0** (27 Nov): one "Western Front" layer from lines 0.2.0, symbol by Kind (solid front line, dashed furthest advance), pop-up gives the dates shown; 11 checks, Map test 11 of 11 with SDK 5.2 (Map builder 1.8). Published over it with `--update` on 27 Nov: read-back matches the build; the item is shared publicly. **0.3.0** (27 Nov): "Fighting this month" labelled with each name, left of the symbol (Map builder 1.9 adds left placement); Map test 11 of 11; published with `--update` on 27 Nov, read-back matches. **0.4.0** (27 Nov): each front line labelled with its name along the line; published with `--update` on 27 Nov, read-back matches. Not yet run: Map checker, persona review |
| Lessons | Not yet |

## To publish the data (your computer, signed in by you)

```
python3 maps/data/ww1/build.py
python maps/tools/publish_data.py maps/data/ww1/ww1-battles.data.json --profile g4s-publisher --go
```

Each run prints the item id and layer URL and writes them to `maps/data/build/ww1/publish-log.jsonl`. Those ids go into the lab map spec.

## Next

1. Delete the superseded data items: lines 0.1.0 (`5669cf738dd24d6d9f4184e84c3516ad`) and battles 0.1.0 (`6599fa5ceb624192bfb255f1175f2b8a`).
2. **Publish lab map 0.6.0** (front lines 0.4.0; Map test 14 of 14) with `--update`; then delete lines 0.2 (`7d675f82…`) and 0.3 (`6f328de6…`).
3. **Still missing in 1918:** 21 March to 9 June (German spring offensives: M556's date to check; M608 and M1236 have the furthest advances).
4. **Look at the lab map** (`7f2606600450480d87a34d1ac6b26b74`, public) in Map Viewer and the Atlas app, then run the Map checker and persona review.
5. Settle the open checks, then run the Map checker and persona review.
6. Later: other fronts (Eastern, Italian, Gallipoli, Middle East), and the Asia-Pacific colonies (Tsingtao, German New Guinea, Samoa).
