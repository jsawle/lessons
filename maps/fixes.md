# Web map fixes, 23 October 2026

From Map audit 1.2 (`maps/audit/`) and the lessons' known issues, each checked against the live layers on 23 October 2026. Ranked by what a student or teacher meets: wrong facts first, then anything that gets in the way of a question, then accessibility, then tidying.

Owners: **GIS-4-Schools** owns the five November web maps (We the People, Rights, Presidential Elections, Louisiana Purchase, War of 1812) and their own layers. **mm.atlas** owns the other five web maps and most shared layers; **mm.sappleton**, **egoldfinger_natgeo** and **rmcooper@nps.gov_nps** own some layers. A setting stored in a web map (pop-up, legend label, filter) can be changed by whoever can edit that web map, even when someone else owns the layer.

## A. Wrong or doubtful facts students read

| # | Map | What's wrong | Evidence | Who can fix | Fix |
|---|---|---|---|---|---|
| A1 | Revolutionary Battles | Turning Points circle 1 (Lexington and Concord) says "Victor: Britain". | `Victor` = "Britain" on feature 1; the battle layer has it as Side A (American) victory | mm.atlas (layer) | Set to the same wording as the others, for example "United States" or "American forces". |
| A2 | Revolutionary Battles | Spelling in Turning Points pop-ups: "Amerian" (Bunker Hill), "outmanuevered Washinton's" (Battle for New York). | `Battle_details` | mm.atlas (layer) | Correct the spelling. |
| A3 | US Slavery 1850 | West Virginia (became a state in 1863) and "Oklahoma" (no such state or territory in 1850) are drawn as separate features. | features 50 and 20 | mm.atlas | Merge West Virginia into Virginia; rename "Oklahoma" to what the 1850 map shows (Indian Territory, unorganized) and check its legend group. |
| A4 | US Slavery 1850 | Free-state pop-ups read "passed legislation against the enslavement of people 1784." (no "in"); New Jersey and "Oklahoma" have no year, so theirs end "people ."; the years mix statehood with abolition laws (Michigan 1837 is statehood; Pennsylvania 1780 is its abolition act). | pop-up expression `expr0`; `StateYear` | mm.atlas (web map) | Reword, for example "Slavery not allowed. Year on the 1920 source map: 1784." and handle a missing year. |
| A5 | War of 1812 | The Spanish Cession pop-up says the US agreed "to assume $5 million in damage caused by American citizens when they rebelled against Spain". The treaty says the US took on its own citizens' claims against Spain, up to $5 million (Article XI). The State Department historian's page uses the wording in the pop-up, so the sources disagree. | `Notes` on the three Spanish Cession features | GIS-4-Schools (web map pop-up) | Write the pop-up text in the map from the treaty: "the United States agreed to pay its own citizens' claims against Spain, up to $5 million". |
| A6 | War of 1812 | The legend says "British Victory" for every Side B battle, including Fort Mims (Red Stick Creeks) and others fought against Native nations. Known issue. | map renderer labels; `Victor` = Side A / Side B | GIS-4-Schools (web map legend) | Relabel in the map, for example "US victory" and "Victory for Britain or Native forces". |
| A7 | Roads, Trails and Rails | The Oregon pop-up gives 1840 to 1860, then says travellers were "fleeing the American Civil War (1861-1865)". The Mormon Pioneer description stops mid-sentence. Known issues. | `Description` | mm.atlas (layer) | Correct the text. |
| A8 | We the People | The layer credits and `Source` field cite Wikipedia for the 1790 figures, which were checked against the Census Bureau's 1791 return. Known issue. | item credits, `Source` | GIS-4-Schools | Cite the Census Bureau's Return of the Whole Number of Persons (1791). |

## B. Gets in the way of a question

| # | Map | What's wrong | Evidence | Who can fix | Fix |
|---|---|---|---|---|---|
| B1 | Revolutionary Battles | The winner of each battle is shown only by the diamond's colour, and the pop-up never states it, but questions 1 and 4 ask who won. A student who can't tell red from blue has no other way to find out (WCAG 2.1 1.4.1). | pop-up shows the name, dates, picture and narrative; the title is coloured by `Victor` | mm.atlas (web map pop-up) | Add a line, for example "Result: American victory", from `Victor` with Arcade. |
| B2 | Vicksburg | Port Gibson (1 May 1863) is in the battle layer twice, about 2.6 km apart, with the same data. Question 3 asks students to list battles in date order. Known issue. | features 105 and 106 | mm.atlas (layer) | Delete one. |
| B3 | Revolutionary Battles | Clicking a colony border opens a pop-up of FID, LEFT_FID, RIGHT_FID and Shape__Length. Question 2 asks students to click the colonies. 19 border segments are also drawn twice. | Colony Boundary pop-up; 19 pairs of identical lines | mm.atlas (web map) | Turn off the Colony Boundary pop-up. Show only the name in the Colony Area pop-up, which also lists FID and the shape's area and length. |
| B4 | Civil War | The railroad and the Union–Confederacy boundary layers take the layer item's pop-up, a list of raw fields (FID, GISJOIN, Shape__Length…), but the lesson says neither has a pop-up. | no pop-up in the map, none disabled | mm.atlas (web map) | Turn off both pop-ups, or give them readable ones. Check on screen first. |
| B5 | Rights | The historic places pop-up shows an address but not the place's name (`RESNAME` hidden). Known issue. | layer item pop-up | mm.atlas (web map or layer) | Add the name as the pop-up title. |

## C. Accessibility and tidying

| # | Map | What | Who can fix |
|---|---|---|---|
| C1 | Revolutionary Battles, Civil War, Vicksburg | Battle pop-up pictures have no alt text. | mm.atlas |
| C2 | US Slavery 1850 | Missouri is drawn twice (two legend groups), so its pop-up says 1 of 2. Known issue. | mm.atlas |
| C3 | US Slavery 1850 | "It is recorded on the primary source as:" shows a code number. Known issue. | mm.atlas |
| C4 | Vicksburg | "Milikens Bend" is usually spelled Milliken's Bend; the Vicksburg note is titled "Point". | mm.atlas |
| C5 | Revolutionary Battles | Turning Points `Notes` holds cut-off copies of other circles' text; the pop-up uses `Battle_details`, which is complete, so students don't see it. | mm.atlas |

## Checked and not a problem

- **Civil War legend:** the web map's own legend is now right (Gettysburg, Antietam and Vicksburg show as Union victories), so the lesson's known issue can be closed. The layer item's legend is still inverted, which matters only to anyone adding that item to a new map.
- **Repeated Lewis and Clark campsites** (St. Louis, the White House, Old Kaskaskia and others) are separate stays at the same place.
- **Battles at the same place** (First and Second Winchester, Kernstown, Memphis, Charleston Harbor) are different battles.
- **Layers that draw only when zoomed in** (battlefield boundaries, Turning Points, the Underground Railroad cities, the railroads) match what the lessons say, apart from B4.

## Sources
- Adams–Onís Treaty, 1819, Articles IX and XI: [text](https://ruhr-uni-bochum.de/gna/Quellensammlung/04/04_adamsonis_1819.htm); State Department Office of the Historian, [Acquisition of Florida](https://history.state.gov/milestones/1801-1829/florida)
- [WCAG 2.1, 1.4.1 Use of Color](https://www.w3.org/TR/WCAG21/#use-of-color)
