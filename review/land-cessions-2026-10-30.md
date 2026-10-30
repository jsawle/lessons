# Persona review: Land Cessions and Indian Removal, 1784–1894 (30 October 2026)

Lesson draft 0.2.0 (English) and map spec 0.4.0, reviewed by five personas chosen with the guide in [personas.md](personas.md) for a grade 8 US History lesson with a colour-coded map: T3 Luis (shared devices, projector), T4 Ana (English learners), T5 Ruth (Texas standards, scrutiny), S1 Jordan (reads below grade level), S3 Eli (red-green colour vision deficiency). Each worked only from the packets a teacher or student would see: the lesson and answer pages and the Word sheet and teacher notes as text, built in a scratch copy (the lesson is not yet in the catalogue), plus pictures of the map at each step, the pop-up text where students are told to click, and, for Eli, deuteranopia simulations of the pictures (Machado 2009). This adds the map pictures and pop-up text the October pilot said were missing.

52 findings: 2 "stops the lesson", 32 "slows it down", 18 minor. Raw findings: [land-cessions-2026-10-30/](land-cessions-2026-10-30/). Every finding was checked against the lesson file and, where it needed the live map, against Map test pictures of the build.

## Verified and fixed (lesson 0.3.0, map spec 0.5.0, Map builder 1.2)

| Finding | Who | Check | Fix |
|---|---|---|---|
| No state lines or place names, so students can't find the towns the steps name | S1, T3, T4, T5 | Confirmed: the basemap is "Modern Antique (no Labels)", copied from the pilot | World Terrain Reference added above the layers (state names, cities, rivers); builder 1.2 supports reference layers; click steps use labeled cities and states (north-east of Jackson; north of Montgomery near the Georgia line; the north-west corner of Georgia), each tested against the polygons |
| Q3 refers to "empty pockets" Q1 never asked for; "empty" lets students answer Canada | S1, T4 | Confirmed | Q1 adds The Southeast bookmark and asks for the gaps; "gaps" used throughout |
| Steps and asks name areas by colour only | S3 | Confirmed | Each layer is named by its date as well as its colour |
| Overlapping layers mix colours | S1, S3 | Confirmed (Iowa, Kansas, Oklahoma, Michigan) | Reading the map: where layers overlap, click to read the dates |
| "The kind of document the link names"; the pop-up has no "nation" label | S1, T4 | Confirmed | "the nation (the title of the pop-up), the date, and the words on the first link (for example Treaty text). You don't need to open the link"; fill-in line per state |
| Pop-up note cut off, needs scrolling | S1, T3, T4, T5 | At 1200 × 800 it fits; on a smaller screen it needs scrolling | Q6 step says scroll to the end; Reading the map says pop-ups scroll |
| "Not listed in the Forest Service data": a second record-keeper the sheet never explains | S1 | Confirmed | Pop-up now reads "Not listed in this map's data." |
| States as postal codes | T4 | Confirmed | Pop-up spells out state names (Arcade) |
| Multi-part asks on one writing line; only Q2 has a frame | S1, T3, T4 | Confirmed | Asks split into (a), (b), (c); Q4 fill-in per state |
| Reading the map and Before you start too dense; "treaty" not defined; hard words (compiled, approximate, transactions) | S1, T4 | Confirmed | Shorter sentences; treaty and cession defined; transactions removed from the asks |
| Q6 asks what the nations "might say" with no source from the nations; the model answer rewards "forced rather than agreed" | T5 | Confirmed | Q6 quotes the 1836 Cherokee petition ("without any authority from the council or people of the Nation", DocsTeach transcription); accept line and model answer use it |
| TX 8.5(H) claims "the reasons" but students get only the Act | T5 | Confirmed | Before you start quotes Jackson's December 1830 message ("opening the whole territory between Tennessee on the north and Louisiana on the south to the settlement of the whites", DocsTeach transcription); partial note says what is and isn't covered |
| "Ceded the last of their land" contradicts the nations the pop-ups list in the Southeast | T5 | Confirmed | "remaining homelands"; notes the Mississippi Band of Choctaw, the Eastern Band of Cherokee and the Poarch Band of Creek |
| Texas note contradicts the map (green covers central and western Texas) | T5 | Confirmed: 5 Texas cessions, Comanche, Kiowa and Apache, 1865 to 1886 | Note rewritten from the data; annexation claim and link removed |
| "The Trail of Tears is the next map", but no such lesson exists | T5 | Confirmed | "planned for a later map" |
| Core question 12 minutes but the page says about 15; questions total 47 minutes before the big question | T3 | Confirmed | Q4 is 15 minutes; time "About 60 minutes, or two parts" |
| Big question not repeated at the final task | S1 | Confirmed | Repeated |
| "The Old Northwest" sounds like Washington and Oregon; the Mississippi River isn't located | S1 | Confirmed | Glossed in the steps |
| Key words "sovereignty" never used | T4 | Confirmed | Replaced by petition |

## Decisions for Jason

| # | Finding | Who | Options |
|---|---|---|---|
| A | No web address or QR code on the printed sheet (all lessons; pilot item G) | T3 | Add a QR code and short link by "Open the map" in the sheet builder |
| B | No paper fallback if the map is blocked or slow | T3 | An optional printed page of the three map pictures and the three pop-ups |
| C | Colour alone separates the layers in the legend and where they overlap | S3 | Keep (text now names each layer by date), or add a hatch to one layer |
| D | On-screen names (layers, bookmarks, pop-up fields) aren't marked in the steps (all lessons) | T4 | Quotes or bold in the sheet builder for names in steps |
| E | Tools are icons in the app; the sheet names them only in words (all lessons) | T4 | A small tools strip with icons on the sheet |
| F | The lesson page, said to be shareable with students, includes the accept summaries and misconception answers (all lessons; pilot item A) | T5 | Move them to the answer page |
| G | Spanish is promised by the shared text but this lesson has only English | T3, T4, T5 | Make the Spanish sheet before publishing (planned); Ana's 13 notes are in T4.json |
| H | The shared rubric's Accuracy row says "winners" | T5 | Reword the rubric in site.json for all lessons |
| I | TX codes don't say which TEKS (new grade 8 TEKS adopted June 2026, from 2032–33) | T5 | Add "(§113.20, 2022)" to TX standards |
| J | Optional Texas link: the Republic of Texas forcing the Cherokee out of East Texas in 1839 (Texas GLO) | T5 | Add as a teacher note with source, or leave |

## To fix later

- Eastern Band of Cherokee Indians listed twice in Nations today: a data fix in the next Data copy version.
- The catalogue intro says "Ten lessons": update when this lesson joins the catalogue.
