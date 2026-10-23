# Web map fixes, 23 October 2026

From Map audit 1.2 (`maps/audit/`) and the lessons' known issues. Each was checked against the live layers, and the pop-ups by drawing the map and clicking the feature (ArcGIS Maps SDK for JavaScript 4.34, as the Atlas app uses). Ranked by what a student or teacher meets: wrong facts first, then anything that gets in the way of a question, then accessibility and tidying.

**GIS-4-Schools** is the sandbox for the US History pilot; it owns the five November web maps and their own layers. The **MapMaker** organization owns the other five web maps and most shared layers (accounts mm.atlas and mm.sappleton). Several shared layers are hosted by other organizations (NatGeo, Esri's Living Atlas, the National Park Service). For those, a web map's own settings (pop-up, legend label) are the only place to fix them.

## How the fixes are made

`maps/fix_maps.py` is pasted into one ArcGIS Notebook cell, in the organization the list is for. It runs as a dry run first, backs up everything it changes, and changes a thing only if it is still exactly as it was when the list was built (`maps/fixes/build.py`).

- **`maps/fixes/sandbox.json`**, run signed in to GIS-4-Schools: A5, A6, A8.
- **`maps/fixes/mapmaker.json`**, run as an administrator of the MapMaker organization: A1, A2, A4, B1, B3, B4, C1, C4.

Data edits (A1, A2, A8) change the layer wherever it is used. All the other fixes change only that lesson's web map.

## A. Wrong or doubtful facts students read

| # | Map | What's wrong | Fix | List |
|---|---|---|---|---|
| A1 | Revolutionary Battles | Turning Points circle 1 (Lexington and Concord) says "Victor: Britain". | "American colonists" | mapmaker |
| A2 | Revolutionary Battles | Turning Points spelling: "Amerian" (Bunker Hill), "outmanuevered Washinton's" (Battle for New York). | Corrected | mapmaker |
| A3 | US Slavery 1850 | West Virginia (a state from 1863) and "Oklahoma" (no such state or territory in 1850) are separate features. | Needs the 1850 source map checked first | later |
| A4 | US Slavery 1850 | Free-state pop-ups read "…against the enslavement of people 1780." (no "in"); New Jersey's ends "people ."; the wording claims a law for years that are often statehood. | "A free state: slavery was not allowed here. Year given on the source map: 1780." and no year line when there is none | mapmaker |
| A5 | War of 1812 | The Spanish Cession pop-up says the US agreed "to assume $5 million in damage caused by American citizens when they rebelled against Spain". The treaty (Article XI) says the US took on its own citizens' claims against Spain, up to $5 million. The State Department historian's page uses the pop-up's wording. | Pop-up written from the treaty | sandbox |
| A6 | War of 1812 | Legend and pop-up say "British Victory" / "British Side Victory" for every Side B battle, including Fort Mims (Red Stick Creeks). | "US victory" and "Victory for British or Native forces"; casualty labels to match | sandbox |
| A7 | Roads, Trails and Rails | The Oregon pop-up says travellers were "fleeing the American Civil War"; the Mormon Pioneer text stops mid-sentence. | Needs the source text | later |
| A8 | We the People | The layer item and its `Source` field cite Wikipedia for the 1790 figures. | Census Bureau, Return of the Whole Number of Persons (1791); item version 1.1 | sandbox |

## B. Gets in the way of a question

| # | Map | What's wrong | Fix | List |
|---|---|---|---|---|
| B1 | Revolutionary Battles | The winner of each battle is shown only by colour, but questions 1 and 4 ask who won (WCAG 2.1 1.4.1). | The pop-up adds "Result: American victory" (or British, or Inconclusive) | mapmaker |
| B3 | Revolutionary Battles | **Clicking a colony opens no pop-up** (its layer item turns pop-ups off), yet question 2 tells students to click the colony to read its name. Clicking a colony border opens raw fields (FID, LEFT_FID, RIGHT_FID, Shape__Length), because the map turns that pop-up back on. | Colonies show their name; borders have no pop-up | mapmaker |
| B4 | Civil War | Clicking a railroad opens a list of raw fields (Unique ID, Vertex Count…); the lesson says it has no pop-up. | Pop-up off | mapmaker |

## C. Accessibility and tidying

| # | Map | What | Fix | List |
|---|---|---|---|---|
| C1 | Revolutionary Battles | Battle pictures have no alt text. | "Picture for the battle of {Battle}" | mapmaker |
| C2 | US Slavery 1850 | Missouri is drawn twice (two legend groups), so its pop-up says 1 of 2. | With A3 | later |
| C4 | Vicksburg | "Miliken's Bend" (usually Milliken's Bend); the Vicksburg pin is titled "Point". | "Milliken's Bend"; "Vicksburg, Mississippi" | mapmaker |
| C5 | Revolutionary Battles | Turning Points `Notes` holds cut-off copies of other circles' text. Students never see it: the pop-up uses `Battle_details`. | None needed | — |
| C6 | Civil War, Vicksburg | Battle pictures have no alt text, and their layer items are shared by other maps. | Later, on the layer items | later |

## Checked and already fine (the lessons' known issues are out of date)

- **Port Gibson twice (Vicksburg):** the layer item already hides the copy, with `OBJECTID NOT IN (106,125,268)`; 125 and 268 are repeated Cabin Creek and Bentonville. A filter set in the web map would replace that one.
- **Civil War legend:** the web map's legend has been right since the MapMaker team edited it on 16 October 2026: Gettysburg, Antietam and Vicksburg show as Union victories. The layer item's own legend is still inverted, which matters only to a map that adds the item fresh.
- **Historic places name (Rights):** the pop-up shows the place's name.
- **Code number in the 1850 pop-up:** it shows the source map's category (for example "Original slave states"), not a number.
- **Union–Confederacy boundary (Civil War):** no pop-up.
- **Repeated Lewis and Clark campsites** are separate stays; **battles at one place** (two Winchesters, Kernstown, Memphis) are different battles.

## Sources
- Adams–Onís Treaty, 1819, Articles IX and XI: [text](https://ruhr-uni-bochum.de/gna/Quellensammlung/04/04_adamsonis_1819.htm); Office of the Historian, [Acquisition of Florida](https://history.state.gov/milestones/1801-1829/florida)
- US Census Bureau, [1790 Census: Return of the Whole Number of Persons](https://www.census.gov/library/publications/1793/dec/number-of-persons.html)
- [WCAG 2.1, 1.4.1 Use of Color](https://www.w3.org/TR/WCAG21/#use-of-color)
- Esri, [Manage hosted feature layer editing](https://doc.arcgis.com/en/arcgis-online/manage-data/manage-editing-hfl.htm) (owners and administrators can edit when editing is off)
