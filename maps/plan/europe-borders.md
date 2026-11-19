# Europe's borders before and after the world wars

Four foundation layers for World History maps: Europe's country borders in July 1914, 1925, January 1938 and at the end of 1947, so students can compare before and after each war's settlement.

| Stage | Status on 19 November 2026 |
|---|---|
| Source chosen | CShapes 2.0 (ETH Zurich). A trial tracing borders from a public-domain 1925 wall map came out 1 to 7 km from CShapes on average, so CShapes replaced it |
| Licence | CC BY-NC-SA 4.0. Permission for MapMaker not confirmed: see `maps/data/europe-borders/LICENCE.md` |
| Data builder | `maps/data/europe-borders/build.py` (Europe borders data builder 1.0), data version 0.3.0, four files, dry runs of Data publish pass |
| Data in ArcGIS Online | Published 19 November in GIS for Schools, shared publicly the same day (Jason's decision, before ETH's answer), read-back matches: 1914 `fc1aca7d48924b56b1c9a41ccbeedc7c` (24), 1925 `6b9991857f034833a442110b83cb984b` (33), 1938 `e339eea036fc40068540112a13092c52` (33), 1947 `eda451464bc745cda162ba7e886c8399` (30) |
| Map spec | `maps/specs/europe-borders-1914-1947.json` 0.1.0: one map, four layers, opens on 1914. Fields and check targets verified against the built data. Built with Map builder (no warnings) and passed Map test 1.0, 10 of 10 checks, on 19 November. Published private 19 November with Map publish 1.2: item `54918986a3b44053a777d6c4b609b98a`, read-back matches the build. Not yet run: Map checker, persona review |
| Lessons | Not yet |

## To publish the data (your computer, signed in by you)

```
python3 maps/data/europe-borders/build.py
python maps/tools/publish_data.py maps/data/europe-borders/europe-1914.data.json --profile NAME --go
python maps/tools/publish_data.py maps/data/europe-borders/europe-1925.data.json --profile NAME --go
python maps/tools/publish_data.py maps/data/europe-borders/europe-1938.data.json --profile NAME --go
python maps/tools/publish_data.py maps/data/europe-borders/europe-1947.data.json --profile NAME --go
```

Each run prints the item id and layer URL and writes them to `maps/data/build/europe-borders/publish-log.jsonl`. Those go into the map specs.

## Known limits of the source

- No Andorra, Monaco, San Marino or Liechtenstein.
- The Saar is not separate in 1925 or 1938.
- 1947: Germany is two occupied areas (western zones, Soviet zone); no Free Territory of Trieste, Saar or Berlin sectors.
- The Soviet Union is one area; the Baltic states are absent in 1947 (shown as annexed).
- 1914: Cyprus is missing.
- Coastlines are simplified.

## Next

Look at the map in Map Viewer and the Atlas app, then run the Map checker and persona review. Known cosmetic point: the layers are cut at 60 degrees east, which shows as a straight edge through Russia.

## Open decisions

- Whether to add the missing small states and territories from other sources.
- Decided 19 November: one map with all four layers.

## Time slider lab (19 November 2026)

A separate test, so the working map isn't touched. Data id `europe-borders-timeline`, version 0.1.0, built by the builder (1.1) alongside the snapshots: 108 features, one for each border period in the source between 1 January 1914 and 31 December 1947.

- `ShowFrom` and `ShowTo`: the dates the border was in force, cut to the window. These are the start and end fields for the time slider.
- `BorderFrom` and `BorderTo`: the source's own dates.
- Two periods are cut in two on the day the country's name changed: Irish Free State to Ireland (29 December 1937) and Kingdom of Serbs, Croats and Slovenes to Yugoslavia (3 October 1929).
- The builder checks every day in the window: no name twice, and on the four snapshot days the same count as the snapshot layers.

Publish: `python maps\tools\publish_data.py maps\data\europe-borders\europe-borders-timeline.data.json --profile NAME --go`

To test, in this order:
1. In Map Viewer, add the layer to a new map, switch time on with `ShowFrom` and `ShowTo`, save.
2. Read the saved map back, to see how the time settings are stored (the Map builder can't write them yet).
3. Open the map in the Atlas app. Does a border disappear after its end date? Do dates before 1970 work?

Limits that matter for an animation:
- The source records recognised borders, not wartime occupation. Poland, Czechoslovakia and Austria stay on the map through 1939 to 1945; Germany only gains the Sudetenland (30 September 1938).
- The Free City of Danzig ends on 31 August 1938 in the source.
- Estonia, Latvia and Lithuania end on 1 June 1940 and the Soviet Union's border changes on 2 June 1940.
- Most change is in 1918 to 1921 (49 of the 84 changes) and in 1940 and 1945.
- The file is 2.7 MB, five times a snapshot layer. Loading speed in a classroom is not tested.
