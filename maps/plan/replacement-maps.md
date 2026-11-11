# Replacement maps: Civil War and Slavery 1850 (draft 0.2, 11 Nov 2026)

Purpose: replace the two MapMaker-owned lesson maps whose defects block core questions with maps built in GIS for Schools through the usual route (data, spec, build, test, dry run, your OK, you run `--go`, never shared by the tool). From the curriculum review of 9 November 2026.

Where this stands: the data for the layers that had the errors is built and passes its dry run. Nothing is online. The map specs come next and need the layers' item ids, so they wait for you to publish the data.

## What the source layers turned out to be

**US States and Territories 1850** is Esri's digitization of a plate in Harper's Atlas of American History (1920), a public-domain map in the Library of Congress. The plate classes each area by the law that made it free or slave, in 16 classes. That explains most of what the lesson logged as errors:

- Missouri "drawn twice" is the state of 1821 and its northwest corner, added in 1837, in two classes. The two areas do not overlap.
- The pop-up's year is the year of that law, not of statehood, which is why Illinois reads 1848 and Maine 1783.
- West Virginia (1863) and "Oklahoma" are real anachronisms: today's outlines on an 1850 map.
- Three small areas in today's Colorado and Wyoming are named "Unidentified". The fact-check worked out what they were: two are land Texas gave up in 1850, left outside any territory, and one was the eastern edge of Utah Territory (an inference from the Utah act's boundary; the digitized patch sits too far east).

So the layer is a fair copy of its source, but the source answers a different question from the lesson's. The replacement keeps the outlines and gives each area one of four plain groups.

**Civil War**: the states layer and the Union and Confederacy boundary are copyright National Geographic Society, and the battle points (the layer with the inverted victory legend) are copyright American Battlefield Trust. None of the three can go into an unbranded set, so they are replaced or left out, not copied.

## Data built (dry run passed, not published)

| Data | Version | Features | Made from | Check before 1.0 |
|---|---|---|---|---|
| `maps/data/civil-war-1863` | 0.2.0 | 35 states: 19 Union free, 5 Union slave (border), 7 seceded before Fort Sumter, 4 after | Natural Earth outlines and `states-1863.json` | Each secession date against the ordinance; West Virginia (June 20, 1863) and Kansas (January 29, 1861) |
| `maps/data/slavery-1850` (`data.json`) | 0.2.0 | 39 areas: 16 free states, 15 slave states, the District of Columbia, 7 territory areas | The saved source layer and `units-1850.json` | Every status and admission year; the wording for Utah, New Mexico and Indian Territory; what the three "Unidentified" areas were |
| `maps/data/slavery-1850` (`routes.data.json`) | 0.2.0 | 4 routes: overland, sea, La Amistad (1839), the Creole (1841), each with a direction and a short account | The saved source layer and `routes-1850.json` | The two ship accounts; the wording for the overland and sea routes |

Known limits: the 1863 layer uses today's outlines and leaves out the territories and Nevada (a state from 1864); the 1850 layer keeps the source's outlines, so Texas has its later boundary and western territory lines are approximate.

## Your steps

1. Done on 11 November 2026: the three tables had an independent fact-check (`maps/data/checks/replacement-maps-factcheck-2026-11-11.md`). No date, year, status, group or count was wrong. Ten wording corrections were applied in version 0.2.0, the small area the source left unnamed on Utah Territory's eastern edge was joined to Utah Territory, and two sentences that could not be verified were dropped.
2. Done on 11 November 2026: the three layers were created in GIS for Schools (folder Map data), private, and each read-back count matches: Civil War 1863 `e28b1b1b617c47bd9ca3c0baa628186c` (35), Slavery 1850 states `0fbb64de0f874d349b12da7ff37ded9e` (39), Slavery 1850 routes `2ed6e68901a141b8908a1350461b9fb4` (4). The commands were:
   ```
   python maps/tools/publish_data.py maps/data/civil-war-1863/data.json --profile g4s-publisher --go
   python maps/tools/publish_data.py maps/data/slavery-1850/data.json --profile g4s-publisher --go
   python maps/tools/publish_data.py maps/data/slavery-1850/routes.data.json --profile g4s-publisher --go
   ```
3. Done on 11 November 2026: the three layers are shared publicly, and both map specs are written, built and tested.

| Map | Spec | Build | Map test | Published |
|---|---|---|---|---|
| The Civil War, 1863 | `maps/specs/civil-war-1863.json` 0.1.1 (Sand Creek and Bear River pop-ups say they were massacres, not battles; built and tested, the published item is still 0.1.0) | ae45b7d10add | pass, 11 checks, Web Map Auditor 98.8 (11 Nov) | item `a93738b1850a48308dc797a1cc8352be`, private, 11 Nov, read-back matches |
| Slavery and the slave trade, 1850 | `maps/specs/slavery-1850.json` 0.1.0 | 877538a856f7 | pass, 9 checks, Web Map Auditor 97.6 (11 Nov) | item `cbee648b1f43455daae038b4bc64d6f4`, private, 11 Nov, read-back matches |

Built as proposed below, with these differences: both maps open on the states layer only (plus the Missouri Compromise line), so students reveal the other layers; the battlefield core areas layer is left out; the routes have no arrowheads, because the digitized lines do not run in a consistent direction, so the pop-up gives the direction; the Civil War map keeps a reference label layer for cities and rivers, and the 1850 map names its states and territories from the data.

Found in testing: ArcGIS Online stored the secession dates as a date field when the GeoJSON was published. The pop-up reads the date in UTC so that US time zones do not show the day before. Data publish should check field types after publishing (to do).

## Proposed maps

### The Civil War, 1863

| Layer | Source | Notes |
|---|---|---|
| The states in the Civil War, 1863 | New (`civil-war-1863`) | Four groups; pop-up gives the side, the group and the secession date. Opens on. |
| Civil War battlefields | National Park Service, American Battlefield Protection Program boundaries (public) | Pop-up gives the battle name, acres and state, which question 4 already uses. Replaces the battle points, so no victory legend. |
| Railroads to 1863 | Jeremy Atack's historical railroads database (free to use with the citation) | Filtered to lines in operation by 1863; visible at the regional view (the current map hides them above 1:2,800,000). Off when the map opens, so students reveal it. |

Not included: the Union and Confederacy boundary line (the shading shows it) and the battle points.

### Slavery and the slave trade, 1850

| Layer | Source | Notes |
|---|---|---|
| Free and slave states and territories, 1850 | New (`slavery-1850-states`) | Four groups; counts can be marked: 16 free states, 15 slave states. |
| Missouri Compromise Line | Esri's digitization (public-domain source) | Pop-up on. |
| Routes of the slave trade | New (`slavery-1850-routes`) | Arrowheads and a pop-up with the direction. The two ship routes off when the map opens. |
| Underground Railroad routes and cities | Esri's digitization (public-domain source) | As now. |

The current map uses an Albers basemap and river tiles owned by the MapMaker organization. The replacement would use the same basemap as the other GIS for Schools maps.

## Open decisions

1. **Copies or the MapMaker items.** Decided on 11 November 2026: the layers that need no correction (battlefield boundaries `8b2e2d492c124d1cacba0599d20639ae`, railroads `300106342f0f456381bac735c7962572`, Missouri Compromise Line `d68c728f32c4479b9bcd15a67db78b20`, Underground Railroad routes and cities `d8a604eef63e469189db303419718b5c`) are already public items in the MapMaker organization, so the replacement maps use them as they are, without copying.
2. **Licence for the Esri digitizations.** Not needed while the maps use the MapMaker items. It comes back only if copies are made for other Atlas apps.
3. **Territories on the 1863 map.** Left out for now, as on the 1828 map. The current lesson has a Territories group in its legend but no question uses it.
4. **The lessons.** Done on 11 November 2026: Civil War Battlefields (0.8.0) and US Slavery and the Slave Trade, 1850 (0.9.0) were rewritten from the new maps, seven questions each, English only. An independent fact-check (`maps/data/checks/replacement-lessons-factcheck-2026-11-11.md`) found 7 wrong and 15 misleading statements out of 102; all were corrected. Not yet done: a persona review, the Spanish text, and opening two Civil War resource links in a browser (they could not be fetched from here).
5. **Indian Territory pop-up.** The data says nations were "moved here in the 1830s"; the fact-check suggests "forced to move here". It is in the data layer, so it waits for the next data version.
