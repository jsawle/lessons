# Persona review of the 12 lessons and their maps, 12 November 2026

Tools: Map capture 1.1, Map review packets 1.1. Capture time zone America/Chicago.

## What was run

- 17 reviews: teachers T3 Luis, T4 Ana, T5 Ruth and students S1 Jordan, S3 Eli on all 12 lessons; S2 Sofía on the 8 lessons with a Spanish sheet.
- Each reviewer saw only its packet: the lesson text and 157 pictures of the live maps taken by following the sheets. S3 also saw each picture in simulated deuteranopia (Machado 2009).
- 506 findings (`findings.json`): 8 "stops the lesson", 307 "slows it down", 191 "minor".

## Limits of this run

- About 50 of 66 click steps were captured by opening the named feature's pop-up directly, so reviewers judged what a pop-up says, not whether a click reaches it.
- Vicksburg question 4's full view was not captured; three pictures were taken while the map was still drawing.
- Status of this record: findings are grouped below. Each group is checked against the lesson file and live map when its fix is made; groups not yet checked are marked "to check".

## Findings raised across several lessons

1. English-only lessons (cessions, 1828, slavery, Civil War): Word teacher notes say "student sheet in English and Spanish". Fix the generator wording. (T3, T4, T5)
2. Dates a day early with a clock time ("12/6/1787, 6:09 PM"): We the People ratification, War of 1812 recognition. Map fix. (all personas)
3. Unrounded percentages ("39.099998474121094%"): We the People. Map fix.
4. Raw legend headings and a gray "Other" entry: We the People, Presidential Elections, War of 1812 ("< 0" class).
5. Sheets name things only by color; S3 cannot follow "green", "pink", "purple", "orange-red". Pair every color word with the legend's words or a shape.
6. Places the sheet names are not named on the map (Boston, Concord, Independence, Port Hudson, Pittsburgh, rivers, several states). Give a visible clue on the sheet, or label on the map.
7. Answer prompts pack several questions into one line with one blank (S1, T4). Split into (a), (b), (c).
8. Reading the map is one long paragraph (S1, T4). Set out as a short key.
9. No printable map page for a class working from paper (T3, every lesson). New feature, not a correction.
10. No suggested split for 45-minute periods on the lessons over one period (T3).
11. Key words are a bare list in the teacher notes only (T4).
12. Texas standards: T5 questions the letter or coverage of 8.5(G), 8.5(H), 8.5(E)/(F), 8.6(B)/(C), 8.17(A), and asks for history codes on the Civil War, Vicksburg and slavery lessons. To check against the TEA text.
13. Spanish sheets: tool names not given consistently in English; "sitio" for siege; "electores" unexplained; "marcador" used for both bookmark and pin (S2, T4).

## By lesson

### revolutionary-battles-1775-1776 (4 stop)
- Circle 2 covers the Boston diamond at the Massachusetts bookmark; the click opens "Battle of Bunker Hill". The sheet warns only in question 4.
- "(2 of 2)" is wrong: pop-ups say 1 of 3 to 1 of 5.
- "Not the winner in words" is wrong for circle pop-ups, which end "Victor: ...".
- Question 2 asks for all 21 diamonds; they overlap at New York and Boston. Massachusetts label sits over Maine.
- Question 4 should use the New York/New Jersey bookmark; the page lists one bookmark.
- 16 miles (model answer) against 17 miles (answer notes). Discussion question 2 says ports have no pop-ups; they do.
- Map: "Amerian" typo, unlabeled legend rows.

### roads-trails-and-rails-west (3 stop)
- Clicking the Oregon Trail opens Pony Express Trail, also at the sheet's fallback place.
- Independence is not named on the basemap at the Kansas City zoom.
- Railroads on: a black mass over the East; the sheet says "thin gray lines". S3 cannot tell the transcontinental lines apart.
- Missouri River and state names do not show at the opening view.
- Indigenous Territories names on the map differ from the answer notes.
- Oregon and California trail colors are near-identical.

### us-slavery-and-slave-trade-1850 (our map)
- Opening bookmark too wide. "Unorganized land given up by Texas" label sits on the Missouri Compromise line.
- State pop-ups read "Slave state (and Washington, D.C.)".
- Ship pop-ups headed "Direction people were moved".
- Legend "Territory open to slavery" against pop-up wording for Utah and New Mexico.
- Sheet: "green lines" and "purple" (S3 sees olive and blue); Missouri unlabeled at question 2; St. Lawrence and Great Lakes not named; question 5 should turn the trade routes off; no city names for question 4(c).
- One trade route runs through free states north of the Ohio (T5). To check against the source.
- Missouri Compromise line pop-up is one 40-word sentence (MapMaker layer).

### civil-war-battlefields (our map)
- No state names at the national bookmark; the sheet says "Click South Carolina".
- Counting 35 states by color is not workable; small states are a few pixels.
- Railroads vanish on dark blue and under the black battlefield shapes.
- Question 6 should turn railroads off; the river is hard to follow.
- Question 7: answer notes say every pop-up ends "does not say who won"; Sand Creek and Bear River do not.
- Pop-ups: two-letter state codes, "Glorietta Pass", acres with no comparison.

### the-battle-of-vicksburg
- Milliken's Bend is not in the bookmark view; the sheet says "at the top edge".
- Port Hudson is not named anywhere; diamonds are unlabeled.
- Railroad is a hair-thin pale line beside modern roads; its legend lists western railroads.
- Broken picture in battle pop-ups; "Miliken's Bend" spelling.
- "When did Port Hudson end?" wording.

### we-the-people-1787-1791
- Items 2, 3, 4 above.
- No labels for Delaware, Rhode Island, New Hampshire in House seats; Massachusetts pie and label sit over Maine.
- Ratification layer alone has no state outlines; New England pies pile up; the bookmark is not used.
- Question 3 has a fill-in line for Virginia only.
- T5: 8.17(A) not earned; counting of Native people not mentioned; "22 seats / 13 seats" wording.

### rights-and-responsibilities-where-we-live
- The basemap does not name courthouses, city halls or polling places as the sheet expects.
- District lines and state borders look the same; no district numbers; the map opens on a mesh of lines.
- Sketch steps do not name the buttons; sketches are not saved.
- "Citizens" wording for classes with non-citizen students (T4); responsibilities list against TEKS 8.19(C) (T5).
- Ohio Statehouse point looks misplaced. To check.

### presidential-elections-1796-1800
- Court cases layer is on at opening and sits on Maryland's pie.
- Maryland 1796: "10 electors" against 7 + 4. Needs a sentence.
- Question 4 needs a step to read New York in 1796.
- Pies overlap at Maryland, Delaware, New Jersey; no state names on the map.
- "1 votes"; "electors" unexplained.

### louisiana-purchase-1803-1806 (1 stop)
- Question 2: about twenty brown outlines and no names; students cannot tell which two to click. Rivers are not visible to follow.
- "Green" 1783 land reads gray-teal; "purple line" is hidden under campsite dots.
- Pittsburgh not named; stray dots east of the line's end.
- Biomes legend unusable; the pop-up first line works.
- About this map says watershed pop-ups list states; they do not.
- Spanish sheet lacks one Reading the map sentence.

### war-of-1812-and-monroe-doctrine
- Item 2 above (recognition dates).
- "The map has no place names" is wrong: it prints 1800 country names.
- The 1819 boundary bookmark does not show Florida.
- Latin America labels do not sit with their symbols; label year is independence, not recognition.
- "$5 million in damage" pop-up wording; "< 0" legend class.
- Battle pop-ups have no "where" line; accounts run to nine paragraphs.

### land-cessions-1784-1894 (our map)
- The United States bookmark shows no state names; question 1 asks for three states.
- Choctaw click: pop-up shows two dates and "Today's states: Alabama"; answer notes expect one.
- Question 6: "last sentence" is "The boundary is approximate."
- Data: Eastern Band listed twice; Creek "Nations today: Not listed".
- Question 4 fill-in asks for "the words on the first link", the same for all three.
- S3: 1840 to 1894 layer reads gray; overlaps read as mud.

### election-1828-right-to-vote (our map)
- Lightest green reads as cream against the basemap (T3, T4, S3).
- Alabama, Maryland, New Hampshire, Rhode Island have no label at the main bookmark; Maryland is one of the split states.
- Both rule layers use the same greens; with both on, one hides the other (T3, T5, S1, S3). The single-color choice was Jason's on 11 November; raised with him.
- Rule-layer legend sits below the pie key.
- Question 5 step order (Georgia off screen); question 6 "end of any pop-up".
- T5: the lesson gives no evidence for the expansion side of the big question; check New York's 1824 electors.
