# Click-through check of eight lessons against their live maps (11 November 2026)

The eight catalogue lessons reworded on 9 November were checked against the live web maps they use: every layer name, start visibility, bookmark, legend label, pop-up phrase, value and measured distance in the lesson text was compared with the web map JSON, each layer item's settings and the feature data. Nothing was drawn in a browser, so findings that depend on rendering (overlaps, how a date displays) are inferred from the stored values and agree with the drawn review of 23 October (`review/maps-2026-10-23.md`). The lessons were corrected the same day; the maps were not changed.

Not covered here: Civil War Battlefields and US Slavery and the Slave Trade, 1850 (being rewritten from new maps), and the two Age of Jackson lessons (covered by their map tests).

## Summary

| Lesson | Blocker | Mismatch | Note | Lesson version after fixes |
|---|---|---|---|---|
| revolutionary-battles-1775-1776 | 2 | 3 | 3 | 0.10.1 |
| roads-trails-and-rails-west | 0 | 2 | 2 | 0.8.1 |
| the-battle-of-vicksburg | 0 | 4 | 2 | 0.8.1 |
| we-the-people-1787-1791 | 0 | 4 | 0 | 0.8.1 |
| rights-and-responsibilities-where-we-live | 0 | 1 | 1 | 0.7.1 |
| presidential-elections-1796-1800 | 0 | 1 | 1 | 0.8.1 |
| louisiana-purchase-1803-1806 | 1 | 1 | 2 | 0.8.1 |
| war-of-1812-and-monroe-doctrine | 1 | 3 | 4 | 0.7.1 |
| Total | 4 | 19 | 15 | |

In all eight lessons every layer name, off-at-start flag and bookmark matched the live map.

## Findings and what changed

Revolutionary Battles
- R1, blocker: colonies have no pop-up (names are printed on the map; Quebec is not labeled). Question 2 step, answer note and layer note reworded; known issue added.
- R2, blocker: the battle diamonds disappear when zoomed out past about 1:16 million, before all 21 fit on a small screen. Question 2 now says zoom out one step and drag the map; known issue added. A wider visible range or an "All battles" bookmark needs a map change.
- R3, mismatch: Key Port Cities is a top-level layer and has a pop-up with the port's name. Question 3 steps, answer notes, layer note and Reading the map corrected.
- R4, mismatch: Boston to Lexington and Concord measures about 17 miles, not 16. Answer note corrected; the pop-up's "20 miles" is accepted.
- R5, mismatch: Turning Points circles sit on four battle diamonds. Question 4 steps and front-of-class steps explain the second pop-up and zooming out for the color; known issue added.
- R6, note: New York to Trenton is 52 miles from the Brooklyn diamond and about 61 from Fort Washington or Fort Lee. Question 4 now names the Brooklyn diamond; both accepted.
- R7, note: a click on a colony border opens raw data fields. Added to the question 2 answer notes.
- R8, note: the map has a "New York/New Jersey" bookmark the lesson does not use. Lesson unchanged (whether the Turning Points draw at that bookmark was not checked).
- Known issue "Turning Points circles 1 and 3 to 5": still true; kept.

Roads, Trails, and Rails West
- T1, mismatch: Indigenous Territories has a pop-up with the nation's name. Layer note, question 3 step and Reading the map corrected.
- T2, mismatch: the layer has no "Lakota" label (it reads Očhéthi Šakówiŋ) and the Oregon Trail does not cross Nez Perce land. Answer note and model answer corrected.
- T3, note: the "thin gray" railroad lines are black at half opacity. Lesson unchanged; the step works.
- T4, note: several trails share the Platte route, so another trail can open first. Question 2 step and front-of-class step now say to check the title or click in Idaho or Oregon.
- Both known issues still true; kept.

The Battle of Vicksburg
- K1, mismatch: the duplicate Port Gibson is filtered out on the live map. "1 of 2" wording removed; known issue closed and removed.
- K2, mismatch: clicking a railroad opens a list of data fields. Layer note corrected.
- K3, mismatch: the railroads already draw at the bookmark. Question 1 step, task, front-of-class steps, answer note, map overview and Reading the map corrected.
- K4, mismatch: the map label reads "Miliken's Bend". Question 2 now gives the map's spelling at first mention.
- K5, note: Jackson is just past the bookmark's east edge and the Milliken's Bend pin is at its top edge. Question 1 step now says to drag the map east; question 2 says where the pin is.
- K6, note: the Vicksburg point titled "Point" could not be confirmed as visible to students. Lesson unchanged; known issue kept.

We the People
- W1, mismatch: ratification dates show as a date and time in the viewer's time zone, a day early in the United States. Answer note and known issue added. Map change needed (date format).
- W2, mismatch: some percentages show with many decimal places. Answer note and known issue added. Map change needed (number format).
- W3, mismatch: the senators sentence is in the pop-up's second paragraph, not its third line. Corrected.
- W4, mismatch: the two what-if seat counts are in one paragraph, not the last two lines. Question 3 task, step, front-of-class step and answer note corrected.
- Both earlier known issues still true; kept.

Rights and Responsibilities Where We Live
- G1, mismatch: the National Register pop-up does show the place's name. Question 4 task, steps, front-of-class steps, answer notes, layer note, Reading the map and teacher notes corrected; the basemap-label workaround and the known issue removed.
- G2, note: vacant seats, an empty party and district numbers 00 and 98. Added to the question 1 answer notes.

The First Political Parties, 1796–1800
- E1, mismatch: the Supreme Court squares sit on Maryland's pie. Question 1 now starts by turning that layer off; Reading the map updated; known issue added. Map change needed (layer off at start or a visible range).
- E2, note: Jefferson's 73 is in every 1800 pop-up; only Adams's 65 is missing. Answer notes and a front-of-class step corrected.

The Louisiana Purchase
- L1, blocker: Biomes, left on from question 3, hides the yellow purchase. Question 4 now starts by turning Biomes off; known issue added.
- L2, mismatch: the pop-up does not show the area. Answer note corrected.
- L3, note: the biome stays grassland along the Missouri through Montana. Answer note corrected.
- L4, note: campsite symbols cover parts of the trail line. Reading the map reworded; a smaller symbol needs a map change.

The War of 1812 and the Monroe Doctrine
- X1, blocker: the battle pop-up does not show the state, and the basemap has no place names. Questions 1 and 2 (steps, front-of-class steps, answer notes, table caption) now have students place battles from the map and the account; known issue added. Map change needed (add the state to the pop-up).
- X2, mismatch: recognition dates show a day early in the United States. Answer note and known issue added. Map change needed (date format).
- X3, mismatch: the pop-up does not show the leaders. Layer note, Reading the map and the stretch task corrected.
- X4, mismatch: only "Total Casualties" is labeled in the pop-up. Answer notes, front-of-class steps, support note and assessment evidence reworded.
- X5, note: battlefield land draws only at close zoom; the "1 of 2" at the bookmark is the boundaries layer. Answer note, layer note, overview and Reading the map corrected.
- X6, note: most of East Florida is off screen at the 1819 bookmark. Question 3 step now says to drag the map east. A wider bookmark needs a map change.
- X7, note: the pop-up describes the $5 million as damage caused by American citizens. Answer note now gives the pop-up's wording and the treaty's.
- X8, note: three large diamonds sit close together on the Niagara River. Question 2 step now says to zoom in there.
- Both earlier known issues still true; kept.

## Could not check

- Anything that needs the map drawn: how the dates and long percentages display (W1, W2, X2), and the overlaps (R5, E1, L4, X8, T4). These are inferred from stored values, field types, coordinates and symbol sizes.
- Basemap labels (vector tiles were not read): whether Topographic names public buildings at close zoom (Rights, questions 2 and 4); whether Independence and Portland are labeled (Roads, question 2); whether Jackson and the state names show at the zooms used (Vicksburg); whether the rivers are clear enough to follow to New Orleans (Louisiana Purchase, question 2).
- Whether the NH, RI and DE House seats labels draw at The states in 1790 bookmark, and whether ratification labels land on neighboring pies.
- Clicks on transparent fills (watershed regions, congressional districts).
- Sketch-layer pop-ups on the Vicksburg key places (K6).
- Results that depend on screen size (R2, K3).
- The "about 4,900 miles" length of the Lewis and Clark trail, which is not on the map.
