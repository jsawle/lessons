# Web map fixes, 23 October 2026

From Map audit 1.2 (`maps/audit/`), the lessons' known issues and the web map review (`review/maps-2026-10-23.md`, which added A9, A10, B5 to B14 and C7 to C10). Each was checked against the live layers, and the pop-ups by drawing the map and clicking the feature (ArcGIS Maps SDK for JavaScript 4.34, as the Atlas app uses). Ranked by what a student or teacher meets: wrong facts first, then anything that gets in the way of a question, then accessibility and tidying.

**GIS-4-Schools** is the sandbox for the US History pilot; it owns the five November web maps and their own layers. The **MapMaker** organization owns the other five web maps and most shared layers (accounts mm.atlas and mm.sappleton). Several shared layers are hosted by other organizations (NatGeo, Esri's Living Atlas, the National Park Service). For those, a web map's own settings (pop-up, legend label) are the only place to fix them.

## How the fixes are made

`maps/fix_maps.py` is pasted into one ArcGIS Notebook cell, in the organization the list is for. It runs as a dry run first, backs up everything it changes, and changes a thing only if it is still exactly as it was when the list was built (`maps/fixes/build.py`).

- **`maps/fixes/sandbox.json`**, run signed in to GIS-4-Schools: A5, A6, A8, A9, A10, B5 to B14, C7 to C9 (39 changes in five web maps, one layer item and two layers). Map fixes 1.1 also changes bookmarks (B10). C10 is done by hand.
- **MapMaker organization** (A1, A2, A4, B1, B3, B4, C1, C4, and the layer problems marked "later"): passed to the MapMaker team as a document, "MapMaker web map fixes: Grade 8 US History lessons" (23 October 2026). `maps/fixes/mapmaker.json` holds the same changes, so the team can run the notebook if they prefer.

Data edits (A1, A2, A8, A9) change the layer wherever it is used. All the other fixes change only that lesson's web map. Where two fixes change the same setting of one layer they are one change in the list, named for both (for example B6+C8).

The sandbox fixes were tested before they went in the list: each web map was changed as the notebook would change it and drawn with the ArcGIS Maps SDK for JavaScript 4.34 in a browser set to US Central time, and the pop-ups, labels, legends and bookmarks below were read off the drawn map (`review/tools/fix-test.mjs`, Fix test 1.0; cases and results in `maps/fixes/test/`).

## A. Wrong or doubtful facts students read

| # | Map | What's wrong | Fix | List |
|---|---|---|---|---|
| A1 | Revolutionary Battles | Turning Points circle 1 (Lexington and Concord) says "Victor: Britain". | "American colonists" | mapmaker |
| A2 | Revolutionary Battles | Turning Points spelling: "Amerian" (Bunker Hill), "outmanuevered Washinton's" (Battle for New York). | Corrected | mapmaker |
| A3 | US Slavery 1850 | West Virginia (a state from 1863) and "Oklahoma" (no such state or territory in 1850) are separate features. | Needs the 1850 source map checked first | later |
| A4 | US Slavery 1850 | Free-state pop-ups read "…against the enslavement of people 1780." (no "in"); New Jersey's ends "people ."; the wording claims a law for years that are often statehood. | "A free state: slavery was not allowed here. Year given on the source map: 1780." and no year line when there is none | mapmaker |
| A5 | War of 1812 | The Spanish Cession pop-up says the US agreed "to assume $5 million in damage caused by American citizens when they rebelled against Spain". The treaty (Article XI) says the US took on its own citizens' claims against Spain, up to $5 million. The State Department historian's page uses the pop-up's wording. | Pop-up written from the treaty | sandbox |
| A6 | War of 1812 | Legend and pop-up say "British Victory" / "British Side Victory" for every Side B battle, including Fort Mims (Red Stick Creeks). | "US victory" and "Victory for British or Native forces"; casualty labels to match. The legend reads its labels from the renderer's groups, which the first list left unchanged; fixed in this one. | sandbox |
| A7 | Roads, Trails and Rails | The Oregon pop-up says travellers were "fleeing the American Civil War"; the Mormon Pioneer text stops mid-sentence. | Needs the source text | later |
| A8 | We the People | The layer item and its `Source` field cite Wikipedia for the 1790 figures. | Census Bureau, Return of the Whole Number of Persons (1791); item version 1.1 | sandbox |
| A9 | We the People | North Carolina's note says the Hillsborough convention (1788) "voted 184 to 83 against ratifying", and its pie stores 83–184. NCpedia and the NC Department of Natural and Cultural Resources give 184 to 84, to neither ratify nor reject. | Note: "voted 184 to 84 to neither ratify nor reject the Constitution"; pie 84–184 (268 delegates), with a note on what the vote was on. The layer's date (2 August) differs from NCpedia's 1 August: left as it is, to check against the CSAC table. | sandbox |
| A10 | We the People, War of 1812 | **Every date is a day early in US time zones.** The dates are stored as midnight UTC and shown in the browser's time zone: in US Central time Delaware "Ratified on 12/6/1787, 6:09 PM" (it was 7 December) and Mexico "Recognized by the United States: 12/11/1822, 6:09 PM" (12 December). | The pop-ups show the date in UTC, as a date: "December 7, 1787", "December 12, 1822" | sandbox |

## B. Gets in the way of a question

| # | Map | What's wrong | Fix | List |
|---|---|---|---|---|
| B1 | Revolutionary Battles | The winner of each battle is shown only by colour, but questions 1 and 4 ask who won (WCAG 2.1 1.4.1). | The pop-up adds "Result: American victory" (or British, or Inconclusive) | mapmaker |
| B3 | Revolutionary Battles | **Clicking a colony opens no pop-up** (its layer item turns pop-ups off), yet question 2 tells students to click the colony to read its name. Clicking a colony border opens raw fields (FID, LEFT_FID, RIGHT_FID, Shape__Length), because the map turns that pop-up back on. | Colonies show their name; borders have no pop-up | mapmaker |
| B4 | Civil War | Clicking a railroad opens a list of raw fields (Unique ID, Vertex Count…); the lesson says it has no pop-up. | Pop-up off | mapmaker |
| B5 | We the People | The pop-up reads "(39.099998474121094%)" (Q1). | One decimal place: "(39.1%)" | sandbox |
| B6 | We the People | Ratification labels sit above and to the right of their pies and land on the next one: "NC (1788)" on Virginia's pie (Q4). | Labels under their own pies | sandbox |
| B7 | We the People | At The states in 1790 bookmark the House seats labels for New Hampshire, Rhode Island and Delaware don't draw (Q2). | All fifteen labels draw | sandbox |
| B8 | Presidential | The two Supreme Court squares cover Maryland's pie at the opening view, the one split state Adams won (Q1). | Squares show only when zoomed in past 1:6,000,000 near Washington. Q4 step 1 then needs: "Zoom in on Washington, D.C., until two pink squares appear." | sandbox |
| B9 | Presidential | The pop-up title doesn't say which election, so a pop-up left open reads the same in 1796 and 1800; it names four candidates before saying which two are in the pie; "1 votes". | "Pennsylvania in 1796: 15 electors"; "In the pie: John Adams (Federalist), 1 vote; Thomas Jefferson (Democratic-Republican), 14 votes." first | sandbox |
| B10 | War of 1812 | The 1819 boundary bookmark ends at Florida's west coast, so the land students click is at the edge, behind the legend at laptop size (Q3). | The bookmark takes in Florida and the whole treaty line, with the Atlantic on the right for the legend | sandbox |
| B11 | War of 1812 | Latin American labels sit above and to the right: "Paraguay 1811" lands on Brazil's circle, and Brazil has no label (Q4). | Labels under their own symbols, all drawn | sandbox |
| B12 | Rights | Q1 asks how many districts the state has, but state lines look the same as district lines. At-large seats read "Wyoming Congressional District 00"; vacant seats read " (Vacant) represents"; nothing says which Congress. | The pop-up adds "Ohio has 15 districts (119th Congress, 2025 to 2027)." and reads "Wyoming, the whole state (one at-large seat)", "This seat was vacant when the layer was last updated", and "as a delegate who cannot vote on final passage of bills" for DC and the territories | sandbox |
| B13 | Louisiana Purchase | Large red campsite spheres hide the 1 px purple trail that Q3 and Q4 ask students to follow. | Trail 3 pt wide; campsites small orange dots | sandbox |
| B14 | War of 1812 | The battle pop-up doesn't say where the battle was; the lesson page asks for the state (Q1). | "Where: Louisiana (today's name)" under the dates | sandbox |

## C. Accessibility and tidying

| # | Map | What | Fix | List |
|---|---|---|---|---|
| C1 | Revolutionary Battles | Battle pictures have no alt text. | "Picture for the battle of {Battle}" | mapmaker |
| C2 | US Slavery 1850 | Missouri is drawn twice (two legend groups), so its pop-up says 1 of 2. | With A3 | later |
| C4 | Vicksburg | "Miliken's Bend" (usually Milliken's Bend); the Vicksburg pin is titled "Point". | "Milliken's Bend"; "Vicksburg, Mississippi" | mapmaker |
| C5 | Revolutionary Battles | Turning Points `Notes` holds cut-off copies of other circles' text. Students never see it: the pop-up uses `Battle_details`. | None needed | — |
| C6 | Civil War, Vicksburg | Battle pictures have no alt text, and their layer items are shared by other maps. | Later, on the layer items | later |
| C7 | War of 1812 | The casualty size legend runs from "< 0" to "> 2,628". | "< 10" to "> 2,500" | sandbox |
| C8 | We the People | Legend headings are field names: "Total1790", "HouseSeats", "Total". | "People in 1790", "Seats in the House", "Delegates voting" | sandbox |
| C9 | Louisiana Purchase | The Biomes pop-up adds "Nature Could Recover" and a conservation sentence below the biome (Q3 asks for the first line). | Biome, realm and ecoregion only | sandbox |
| C10 | All five sandbox maps | No custom thumbnail (map checker). | Upload each lesson's map picture (`resources/assets/screenshots/<lesson>.jpg`) as the web map's thumbnail, in the item's settings | by hand |

## Checked and already fine (the lessons' known issues are out of date)

- **Port Gibson twice (Vicksburg):** the layer item already hides the copy, with `OBJECTID NOT IN (106,125,268)`; 125 and 268 are repeated Cabin Creek and Bentonville. A filter set in the web map would replace that one.
- **Civil War legend:** the web map's legend has been right since the MapMaker team edited it on 16 October 2026: Gettysburg, Antietam and Vicksburg show as Union victories. The layer item's own legend is still inverted, which matters only to a map that adds the item fresh.
- **Historic places name (Rights):** the pop-up shows the place's name.
- **Code number in the 1850 pop-up:** it shows the source map's category (for example "Original slave states"), not a number.
- **Union–Confederacy boundary (Civil War):** no pop-up.
- **Repeated Lewis and Clark campsites** are separate stays; **battles at one place** (two Winchesters, Kernstown, Memphis) are different battles.

## Sources
- Adams–Onís Treaty, 1819, Articles IX and XI: [text](https://ruhr-uni-bochum.de/gna/Quellensammlung/04/04_adamsonis_1819.htm); Office of the Historian, [Acquisition of Florida](https://history.state.gov/milestones/1801-1829/florida)
- North Carolina's Hillsborough convention: NCpedia, [Convention of 1788](https://www.ncpedia.org/node/2246); NC Department of Natural and Cultural Resources, [Hillsborough Convention Fails to Ratify Constitution](https://www.dncr.nc.gov/blog/2016/07/21/hillsborough-convention-fails-ratify-constitution)
- US Census Bureau, [1790 Census: Return of the Whole Number of Persons](https://www.census.gov/library/publications/1793/dec/number-of-persons.html)
- [WCAG 2.1, 1.4.1 Use of Color](https://www.w3.org/TR/WCAG21/#use-of-color)
- Esri, [Manage hosted feature layer editing](https://doc.arcgis.com/en/arcgis-online/manage-data/manage-editing-hfl.htm) (owners and administrators can edit when editing is off)
