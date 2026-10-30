# Age of Jackson: three-map slice (draft 0.3, 30 Oct 2026)

Purpose: run three new maps through the whole process (map first, then the inquiry lesson written from the built map, then the link back to the standards) to find out what the process still lacks before building a full year. Map 1 is built, tested and published (private); Maps 2 and 3 are not started. Every map follows the usual route: spec, build, test, dry run, your OK, you run `--go`, never shared by the tool.

Unit: The Age of Jackson (grade 8 US History). Standards confirmed so far: TX 8.5(G) (election of Jackson, expanded suffrage) and TX 8.5(H) (Cherokee removal: Indian Removal Act, Worcester v. Georgia, Trail of Tears). Florida and C3 codes for this unit are not yet confirmed and are not listed.

Open decision: whether maps point at the agencies' own services or at copies in the GIS for Schools organization. Recommendation: copies (a service we do not control can move or change fields under a published map), with the source and licence credited in the layer and the item.

## Map 1. Land cessions, 1784–1894

Question for students: When did the United States gain the most land through treaties and cessions, and where?

| | |
|---|---|
| Standards | TX 8.5(H) (context for removal) |
| Layers (existing) | "Indian Land Cessions in the United States", US Forest Service, MapServer/0 (apps.fs.usda.gov/arcx/rest/services/EDW/EDW_TribalCessionLands_01), 718 polygons from Royce's maps (the Forest Service's metadata also quotes 752 and 718; the live layer has 718, one of them with no attributes), up to five schedule dates each, no use constraints in the metadata and CC BY 4.0 on the data.gov record |
| Layers (new, small) | Era filter or three visible-range groups (before 1829, 1829–1837, after 1837) built from the date fields; a states layer for orientation |
| What students use | Time filter or era groups, pop-ups (Arcade formats the dates so they read the same in every time zone), bookmarks (Southeast, Old Northwest, Plains) |
| Data caveats | Boundaries are coarse; there is no acreage field, so students compare where and when, not how many acres; Royce compiled the maps in the 1890s from the federal government's viewpoint |
| To fact-check | The date fields against the treaty record for the Southeast cessions; wording of any statement that a cession was "by treaty" (several were disputed or signed under pressure) |
| Sensitive framing | Say who recorded the data and from whose viewpoint; use "cession" as the dataset's term and note that it hides disagreement |

## Map 2. Cherokee removal, 1828–1839

Question for students: Why were the Cherokee removed from the Southeast, and how did the law, the land and the route fit together?

| | |
|---|---|
| Standards | TX 8.5(H) |
| Layers (existing) | The Cherokee cession polygons from Map 1 (filtered); National Park Service Trail of Tears National Historic Trail (TRTE_NHT FeatureServer, designated alignment); "Landmark Supreme Court cases" in our own organization, which already holds Cherokee Nation v. Georgia (1831) and Worcester v. Georgia (1832) |
| Layers (new, small) | Key places (for example New Echota, Red Clay, the start and end points of the removal): no source layer found, so this would be a small hand-built point layer with each place and coordinate sourced from the National Park Service or the Cherokee Nation |
| What students use | Layer toggles, pop-ups (case rulings, place notes), bookmarks (Georgia and Tennessee; the route to Indian Territory) |
| Data caveats | The trail layer is the designated alignment, an approximation; the detachments took several routes and did not all follow it |
| To fact-check | Indian Removal Act date and vote; Treaty of New Echota (1835): who signed and the objections to it; dates and place names for the key-places layer; the loss-of-life figure, if the lesson uses one (give the source and the range) |
| Sensitive framing | Cherokee voices and sources stay central; the lesson does not treat removal as inevitable |

## Map 3. The election of 1828 and the right to vote

Question for students: What changed between the elections of 1800 and 1828, and did "more voters" mean "more voters everywhere"?

| | |
|---|---|
| Standards | TX 8.5(G) |
| Layers (existing pattern) | Our "Election of 1796 / 1800" layer (MM_US_Electoral_Votes_1796_1800, 16 states, same fields and notes) |
| Layers (new) | An 1828 version of that layer with all 24 states (adds AL, IL, IN, LA, MS, MO, OH and Maine as its own state). Electoral votes by state: Jackson 178, Adams 83; National Archives, archives.gov/electoral-college/1828, matches Wikipedia's table. Split states (Maine 1/8, Maryland 5/6, New York 20/16) shown as split pies as in the pilot |
| Layers (new, needs research) | How electors were chosen in 1828 (popular vote in 22 states; legislature in Delaware and South Carolina) and which states still had property or taxpaying requirements for white men. The tables found (Keyssar, reproduced by the University of Wisconsin) give 1820 and 1830, not 1828, and list their own counts inconsistently (8 states with a requirement in 1830, 7 in the list). This layer must come from state constitutions and primary sources, not from those tables alone |
| What students use | Pies and legend (as in the pilot), a comparison against the 1800 map, pop-ups with the state's rule on electors and voting |
| Data caveats | Modern state outlines, with Maine shown as its own state and West Virginia still part of Virginia; popular-vote totals by state are a later addition (a possible source is the Tufts "A New Nation Votes" collection, not yet checked); the right to vote excluded women, most free Black men in many states, and enslaved people, and the map has to show that, not only "expanded suffrage" |
| To fact-check | Every state's elector method and voting rule in 1828; the claim "expanded suffrage" against what each state's law actually allowed; Maryland's and New York's district counts |
| Sensitive framing | "Expanded suffrage" applied to white men; the map should let students see who was still left out |

## How students meet each map: reveal, then ask why

Agreed 30 Oct 2026, from Map 1. A map opens with only the earliest layer on, and students turn on the next period themselves, so they watch the pattern build rather than read it finished. Each step leaves room for the question the map can't answer on its own: why there, why then. Every map spec and every inquiry lesson in this slice follows the same sequence:

1. **Notice.** One layer on. What is there, and where?
2. **Predict.** Before turning on the next layer: where do you expect the next change, and why?
3. **Reveal.** Turn it on. What changed? How does it compare with your prediction?
4. **Explain why.** What else was happening at that time that might explain it? Students use evidence the map links to (pop-ups, treaty and statute texts) and sources the lesson provides; the map itself shows what, where and when, not why.
5. **Question the source.** Who made this map, when, and from whose records? Whose view is missing?
6. **Their own question.** Each student writes one "why" question the map raised for them.

What this means for the tools: the spec's `visible` settings open the map on the first layer only; the spec's `checks` follow the steps (one check per reveal); the lesson's questions follow steps 1 to 6, with `map.about` saying which layers are off when the map opens. A map that has no sequence in time or space (a single snapshot) skips steps 2 and 3.

Map 1 draft sequence (questions only; answers and sources come with the lesson and its fact-check):

| Step | Layers on | Question |
|---|---|---|
| Notice | Before 1830 | Where had the United States gained land through cessions before 1830? Which parts of the map are still empty? |
| Predict | Before 1830 | Where do you expect the cessions of the 1830s to be? Why there? |
| Reveal | + 1830 to 1839 | Where were the cessions of the 1830s? Was your prediction right? |
| Explain why | + 1830 to 1839 | Open a cession in the Southeast dated in the 1830s. Which nation, which year, and what kind of document? What was happening in the United States around 1830 that might explain the pattern? |
| Reveal | + 1840 to 1894 | How did the pattern change after 1840? |
| Question the source | All | Who recorded these cessions, and when? What might the nations named in the pop-ups say about the same transactions? |
| Their own question | All | Write one "why" question this map raises for you. |

## Process gaps this slice is meant to expose

1. Map first: choose the map, check the data and licence, then write the spec. No lesson text exists until the map has been built and has passed Map test.
2. The lesson is then written from the map (what students can see and do), with its standards linked back into the lesson file and the spec's `lesson` field, and Map test re-run.
3. A fact-check step sits between the lesson draft and the final test. It is not drawn in the workflow graphic yet, and it has no tool; for now it is a checklist per map (the "To fact-check" rows above).
4. Persona review is still not wired to Map test output.
5. The map list (unit, candidate standards, data status, build status) does not exist yet beyond this file.

## Status

| Map | Data check | Spec | Build | Test | Lesson | Published |
|---|---|---|---|---|---|---|
| 1. Land cessions | done; data copied to GIS for Schools (v1.1, item fbefc5d9f79242d9a6b866b93f5a5af5, public, 717 polygons, four known dates match) | 0.2.0 | 942abfa36ef4 | pass, 3 checks, Web Map Auditor 97.4 (28 Oct) | not written | 30 Oct, Map publish 1.1, item fd8f742aec1c4a8a9648cd20dafffe11, private, read-back matches |
| 2. Cherokee removal | done (key places layer open) | – | – | – | – | – |
| 3. Election of 1828 and suffrage | electoral votes done; suffrage layer open | – | – | – | – | – |
