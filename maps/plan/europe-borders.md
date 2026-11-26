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

### Time slider lab: what the tests found (19 November 2026)

- Published: timeline layer item `3d3baeaaca124de3bdb223281eb0c13c`. Jason's hand-made test map: `44aa93bb65d94cf7b066991ce8fb10d8`.
- Map Viewer stores time in the map in three places: the layer's `layerDefinition.timeInfo` (start field, end field, extent) with `timeAnimation: true`; `widgets.timeSlider.properties` (start, end, current date, one handle, step, speed, loop); and the map's `timeZone`. Dates are milliseconds since 1970 at midnight UTC, negative before 1970. Map builder 1.5 writes all three (`"time"` on the spec and on a layer).
- SDK 4.34 ignores time fields set in the map: all 108 features draw. SDK 5.2 reads them. The Atlas app loads 5.2 (its page links js.arcgis.com/5.2), so Map test 1.1 can run on 5.2 (`"test": {"sdk": "5.2"}` in the spec, or `--sdk`).
- With 5.2, in US Central time and map time zone UTC: the day boundaries are right. Austria-Hungary draws on 2 November 1918 and not on 3 November; counts on the snapshot days match the snapshot layers (24, 33, 30).
- Not yet tested: the Atlas app itself, a monthly step, loading speed.

### Colour and the changes layer

- Lab map `europe-borders-through-time-lab` 0.1.0: each country keeps one of eight colours for the whole period (by the source's country name, so the Russian Empire and the Soviet Union share one). Colours only tell neighbours apart; names are on the map, and the legend is off for this layer.
- Data `europe-borders-changes` 0.1.0 (builder 1.2): 47 areas that went from one country to another, each shown for 365 days after the change. Rules are in `snapshots.json` under `changes`.
- A source oddity to raise with ETH Zurich: the Free City of Danzig ends on 31 August 1938 and is inside Germany from 30 September 1938. It was annexed on 1 September 1939.
- Lab map 0.2.0 adds the changes layer (item `d41979c819334fe99199fe4530657fcf`): hatched with a heavy outline, labelled "from <country>", pop-up with both countries, the date and the size. Map test 11 of 11 on SDK 5.2. One run failed the Poland pop-up check with an empty pop-up and passed on the next run unchanged: a timing fault in the test, to watch.

### Lighter outlines (19 November 2026)

Jason found the lab map slow to load in the Atlas app; the slider and the hatched areas worked. Measured: the two layers download as about 380 kB, but the borders layer had 150,600 outline points against 31,100 for a snapshot layer. Builder 1.3 thins shared borders in the source's own lines (tolerance 0.03 degrees, about 3 km), so neighbours still meet: timeline 0.2.0 has 46,200 points and changes 0.2.0 has 4,800 (31% of before together). File sizes: 852 kB and 96 kB. The four snapshot files are unchanged byte for byte. Whether this fixes the slowness is not yet tested.

### Split into two eras (19 November 2026)

Jason's call: one slider from 1914 to 1947 spends most of its run on 1925 to 1937, when almost nothing changes, and students should stay on the era they are studying. So the lab map becomes two maps on the same two data layers. No new data items, no extra copies of the CShapes data.

- What the data shows: of the 47 changes of hands, 30 fall in 1914 to 1921 and 17 in 1938 to 1947; none in 1922 to 1937. Between 1925 and 1937 the only new border periods are two renames (Yugoslavia 1929, Ireland 1937).
- `europe-borders-ww1-era-lab` 0.1.0: 1 January 1914 to 31 December 1924, so it includes Lausanne (Turkey, 14 October 1923) and the Polish-Lithuanian border of April 1922.
- `europe-borders-ww2-era-lab` 0.1.0: 1 January 1938 to 31 December 1947, from before Munich to the Paris peace treaties (10 February 1947).
- Each layer carries a filter to its era (`ShowFrom <= DATE '<end>' AND ShowTo >= DATE '<start>'`), and the slider's range, the layers' time extent and the opening date are set to the era.
- Step: three months (44 stops for the WWI era, 40 for the WWII era), at one second a step. Yearly steps on 1 January missed 18 of the 139 border periods; three-monthly steps miss 4, all shorter than a month (Hungary, November 1918; two Soviet borders in February and March 1918; a Soviet border in June 1940). Monthly steps would miss 3 but take 132 stops.
- Checks: the old map's checks split by era (1925 ones moved to 31 December 1924), plus Brest-Litovsk (1 April 1918), before Munich (1 January 1938) and the Munich changes (1 January 1939).
- Not yet tested: whether MapMaker (the Atlas app) keeps the slider to the era's range set in the map, or falls back to the layer's own 1914 to 1947 range.
- Era maps 0.2.0 (19 November 2026): both moved to the lighter layers, timeline 0.2.0 (item `f4f81ee402b842c793eba54768f6106f`) and changes 0.2.0 (item `dbeffe7848234bbc908e4cdab514f323`), public in the sandbox. Map test on SDK 5.2: WWI era 8 of 8, WWII era 5 of 5. Not yet published; loading speed in the Atlas app not yet compared.

## Whole Russia (26 November 2026, builder 1.4, timeline and changes 0.3.0)

The Russian Empire and the Soviet Union were cut at 60 degrees east, so half the country was missing. `keepWhole` in
`snapshots.json` keeps them whole in the timeline and changes layers (the snapshot layers are still clipped). The
stretches of line outside the Europe extent are thinned at 0.25 degrees instead of 0.03, so the timeline layer is 1,045 kB
instead of 852 kB rather than about 1,965 kB. Feature counts are unchanged (108 and 47). The changes layer's areas are the
same; four Soviet ones (the Baltic states 1940, East Prussia 1945) have slightly different outlines from the new thinning.
Changes in Asia (none of the Soviet Union's Asian neighbours are in the layers) are not included.

Outside Europe, CShapes 2.0 also records in these years: the Ottoman Empire's Arab lands becoming British and French
mandates (1920 to 1923), Germany's colonies becoming mandates (1919 to 1922), Egypt (1922), Afghanistan (1919) and Mongolia
(1921); and in 1938 to 1947 Korea's division (1945), Indonesia (1945), the Philippines, Syria, Lebanon and Jordan (1946),
and India and Pakistan (1947). It does not record: wartime occupation or puppet states (Manchukuo, Italian Ethiopia
1936 to 1941, Japan's conquests); Ukraine, Belarus, Georgia, Armenia and Azerbaijan's independence 1917 to 1921; Tuva.
