# Europe's borders before and after the world wars

Four foundation layers for World History maps: Europe's country borders in July 1914, 1925, January 1938 and at the end of 1947, so students can compare before and after each war's settlement.

| Stage | Status on 19 November 2026 |
|---|---|
| Source chosen | CShapes 2.0 (ETH Zurich). A trial tracing borders from a public-domain 1925 wall map came out 1 to 7 km from CShapes on average, so CShapes replaced it |
| Licence | CC BY-NC-SA 4.0. Permission for MapMaker not confirmed: see `maps/data/europe-borders/LICENCE.md` |
| Data builder | `maps/data/europe-borders/build.py` (Europe borders data builder 1.0), data version 0.3.0, four files, dry runs of Data publish pass |
| Data in ArcGIS Online | Not yet: run on your computer (below). Private |
| Map specs | Not yet: they need the four layers' item ids and URLs |
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

## Open decisions

- Whether to add the missing small states and territories from other sources.
- One map with four layers, or four maps.
