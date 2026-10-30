# Map specs

A map spec describes one web map in plain JSON: its item details, basemap, opening view, bookmarks and layers, with each layer's symbols, labels, pop-up and visible range, plus the checks a student's steps must pass. The same spec, builder, test and publish script work for any subject.

| Step | Tool | Where it runs | What it does |
|---|---|---|---|
| 1. Write | `maps/specs/<id>.json` (Map spec 1.0) | here | Describe the map; `checks` lists what students do and must see |
| 2. Build | `python3 maps/tools/build_map.py maps/specs/<id>.json` (Map builder 1.2) | anywhere | Checks the spec against its lesson, the layers' fields and the basemap (no CARTO, public sources); writes `maps/build/<id>/webmap.json`, `item.json`, `report.json` |
| 3. Test | `node maps/tools/test_map.mjs maps/build/<id> --checker <mapchecker>/index.html` (Map test 1.0) | anywhere with Chromium | Draws the build with the Maps SDK 4.34 in US Central time, runs every check, flags long decimals and dates with times, runs the MapMaker Web Map Auditor; records a pass in `report.json` |
| 4. Publish | `python maps/tools/publish_map.py maps/build/<id> --profile NAME [--go]` (Map publish 1.2) | your computer, signed in by you | Dry run first; refuses a changed or untested build or the wrong organization; creates the item in the spec's folder (or `--update` replaces it, with a backup); never shares; reads the item back to check it |
| 5. Release | ArcGIS Online | you | Look at it in Map Viewer and the Atlas app, then share it |

## The spec

```jsonc
{
  "format": "Map spec 1.0",
  "id": "presidential-elections-1796-1800",       // file name and build folder
  "version": "1.0.0",                              // this map's version; bump it on every change
  "lesson": "resources/lessons/<id>.json",         // optional: the builder checks layer names, start visibility and bookmarks against it
  "item": {"title", "snippet", "description", "tags", "credits", "license"},
  "basemap": {"title", "layers": [{"type": "tile" | "vectorTile", "title", "itemId", "url" | "styleUrl", "blendMode"?, "reference"?}]},  // reference: true draws the layer above the map's own layers (labels)
  "view": {"extent": [west, south, east, north]},  // degrees
  "bookmarks": [{"name", "extent": [west, south, east, north]}],
  "layers": [                                      // top of the layer list first
    {"title", "source": {"itemId", "url"}, "visible", "filter"?, "visibleRange"?: {"minScale", "maxScale"},
     "symbol": {"type": "marker" | "line" | "fill" | "pieChart" | "raw", ...},
     "labels"?: {"expression", "placement", "font", "color", "halo", "overlap"?},
     "popup": {"title", "html", "fields"?: {"Field": {"places": 1}}, "expressions"?: {"name": {"title", "arcade"}}} | "popupOff": true}
  ],
  "checks": [{"name", "question", "do": {bookmark, on, off, goTo, legend, open, click}, "expect": {popupHas, legendHas, drawnAtScale, hiddenAtScale}}],
  "publish": {"org", "orgLabel", "folder", "thumbnail"}
}
```

Maps that build up over time open with only the first layer on (`"visible": false` on the rest), and their `checks` follow each reveal in order, so the lesson can ask students to notice, predict, reveal and then ask why (see `maps/plan/age-of-jackson.md`, "How students meet each map"). The layer list's order is the legend's order.

Colours are `#RRGGBB` or `#RRGGBBAA`. `"symbol": {"type": "raw", "renderer": {...}}` takes any ArcGIS renderer as it is. Date fields go in pop-ups through Arcade (`Text(ChangeTimeZone($feature.Date, 'UTC'), 'MMMM D, Y')`), so they read the same in every time zone; the builder warns otherwise.

## Signing in on your computer

The publish script never takes a password. Set up a sign-in once, in a terminal, as the account you publish with (for the pilot, a GIS-4-Schools user):

```
pip install arcgis
python -c "from arcgis.gis import GIS; GIS('https://www.arcgis.com', 'YOUR_USERNAME', profile='gis4schools')"
```

It asks for the password and keeps it in Keychain (Mac) or Credential Manager (Windows). After that, `--profile gis4schools` uses it. On Windows with ArcGIS Pro signed in and running, `--pro` uses Pro's sign-in instead. This works for ArcGIS accounts with a username and password; an account that signs in through an organization's single sign-on needs the OAuth route instead (an application registered in the organization).

## Specs

| Spec | Version | Lesson | Notes |
|---|---|---|---|
| `presidential-elections-1796-1800.json` | 1.0.0 | Presidential Elections, 1796 and 1800 | Pilot: the lesson's map with fixes B8 and B9 and 10 pt case labels. Published private 28 Oct (2ba7a7dc315a4d65a3f4b4cb879e4e2a) with Map publish 1.0, whose read-back flagged whole-number floats; 1.1 compares those by value |
| `land-cessions-1784-1894.json` | 0.5.0 | `maps/lessons/land-cessions-1784-1894.json` (draft 0.3.0) | Published private 30 Oct (fd8f742aec1c4a8a9648cd20dafffe11); opens on cessions before 1830 so students reveal the later periods; read-back matches |
| `election-1828-right-to-vote.json` | 0.3.0 | none yet (Age of Jackson, Map 3) | Data: election-1828 1.0.0 (2da7379e3fdb41d396c6ad49b6f73fef, public), built with Data publish 1.0; published private 30 Oct (1bd912453059450dac83074ea42e5424; a duplicate, 4776bebd81924a3b9f0fb183ac5be160, was created by a second run and is to be deleted; Map publish 1.2 now refuses that), read-back matches |
