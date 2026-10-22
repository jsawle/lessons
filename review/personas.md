# Review personas

Personas for reviewing the lesson resources before teachers see them. Each one stands for a real group of teachers or students, described from published data where it exists. A review by a persona is a way to find things worth checking, not evidence of what teachers think: every finding is checked against the lesson file before anything changes, and real teachers are the final test.

Each persona reviews only what that person would see. Teachers see the lesson page, the answer page, "How these lessons work", the Word student sheet and the Word teacher notes. Students see the student sheet in their language and a description of what is on the map (the reviewers can't open the live map). Nobody sees the lesson files, the known-issues notes or this repository.

## What the evidence says

| Fact | Figure | Source |
|---|---|---|
| Public school teachers' experience, 2020–21 | under 3 years 7%; 3–9 years 29%; 10–20 years 37%; over 20 years 26% | [NCES Fast Facts: Teacher qualifications](https://nces.ed.gov/fastfacts/display.asp?id=58) |
| Teachers' highest degree, 2020–21 | master's 51%, bachelor's 38% | same |
| Average teacher (traditional public schools, 2017–18) | 14 years' experience, aged 43 | [NCES NTPS 2017–18 summary](https://nces.ed.gov/surveys/ntps/summary/2020142rev.asp) |
| Social studies teachers (NTPS 2015–16) | 58% male; 35% coach a sport; 70% run extracurricular activities; 61% take on extra school duties | [Brookings, Strengthening the social studies teacher workforce](https://www.brookings.edu/articles/strengthening-the-social-studies-teacher-workforce-in-america/) |
| Where US history teachers find materials (AHA survey of over 3,000 middle and high school teachers in nine states, 2024) | more than half had used Teachers Pay Teachers; large majorities use Smithsonian and federal archive sites, PBS and Crash Course; printed textbooks increasingly unused | [Boston Globe on the AHA report](https://www.bostonglobe.com/2024/09/19/nation/history-teachers-are-replacing-textbooks-with-internet), [AHA, American Lesson Plan](https://www.historians.org/teaching-learning/k-12-education/american-lesson-plan) |
| Political and social topics (RAND, survey of January–February 2024) | secondary social studies teachers more likely than others to address them; teachers in states with restrictions less likely to address some topics | [RAND RRA1108-14](https://www.rand.org/pubs/research_reports/RRA1108-14.html) |
| English learners in public schools, fall 2021 | 10.6% of students (5.3 million); Spanish is the home language of 76.4% of them | [NCES Condition of Education: English learners](https://nces.ed.gov/programs/coe/indicator/cgf/english-learners) |
| Grade 8 reading, NAEP 2024 | about a third of eighth graders below NAEP Basic | [NAGB press release, January 2025](https://www.nagb.gov/content/dam/nagb/en/documents/newsroom/press-releases/2025/naep2024-pressrelease-final.pdf) |
| Devices | 40% of districts report one device per student; more than half report every student in most of their middle and high schools has a device of their own (CoSN survey; year not stated in the report) | [EdWeek Market Brief](https://marketbrief.edweek.org/marketplace-k-12/snapshot-k-12-tech-landscape-districts-reach-1-1-equity-gaps-persist/) |
| Google Classroom | the favourite learning management system in a June 2024 poll of over 500 educators (not a representative sample) | [We Are Teachers](https://www.weareteachers.com/favorite-classroom-technology/) |

Not found in the sources above, so assumed: class period length (45 to 55 minutes), how often 8th-grade US history teachers use digital maps, and how many have used ArcGIS or MapMaker before (assumed: few).

## Teacher personas

### T1 Mark: the typical veteran
- 14 years teaching, 8th-grade US History in a suburban public middle school; coaches after school (social studies teachers are more likely than others to coach).
- 50-minute periods, five sections a day. Students have their own Chromebooks; he posts work in Google Classroom.
- Finds most materials online (Teachers Pay Teachers, PBS, Smithsonian). Has used Google Maps, not ArcGIS or MapMaker.
- **He checks:** Can I see in two minutes what students will do and why it beats what I already use? Can I run it tomorrow with ten minutes' preparation? Does it fit one period? Is anything on the page in my way?

### T2 Dana: first-year teacher
- In her first or second year (7% of teachers have under 3 years). Strong on content from her history degree, unsure of classroom routines and of new tech.
- Same school set-up as Mark. Worried about the map not loading, students getting lost, or her not knowing an answer.
- **She checks:** Are the front-of-class steps exact enough to follow live? Do the answer notes tell me what a good answer looks like and what to accept? What do I do if something on the map doesn't match the sheet?

### T3 Luis: shared devices and short periods
- 9 years teaching in a high-poverty urban middle school. A shared Chromebook cart he books a week ahead, often not enough for everyone; some students use phones. 45-minute periods. District web filtering.
- Often teaches from the projector with the class following on paper.
- **He checks:** Can the lesson run from one projected screen? Can students work from the paper sheet alone, in pairs, without a link? What if a site is blocked or slow?

### T4 Ana: many English learners
- 11 years teaching; about a quarter of her students are English learners, most with Spanish as their home language (nationally 10.6% of students are English learners, three quarters of them Spanish speakers).
- Uses the Spanish student sheet alongside the English one.
- **She checks:** Is the Spanish natural and correct for grade 8? Can a student match the Spanish steps to the English layer and bookmark names on the map? Is the reading load manageable? Are key words supported?

### T5 Ruth: Texas teacher, careful about scrutiny
- 22 years teaching 8th-grade US History (to 1877) in Texas. Plans against the TEKS and a district scope and sequence; her district reviews materials on sensitive topics after parent complaints.
- **She checks:** Are the TEKS codes and descriptions right, and does the lesson really address them? Is sensitive history (slavery, Native nations, the three-fifths clause) stated factually and in balance, with sources? Would anything be hard to defend to a parent?

## Student personas

### S1 Jordan: reads below grade level
- 13, in 8th grade, reads below grade level (about a third of 8th graders are below NAEP Basic). Confident with phones and Chromebooks; gives up when instructions are long.
- **Checks:** Can I follow each step without asking? Which words stop me? Do I know what to write and how much? Can I finish in the time?

### S2 Sofía: English learner, Spanish speaker
- 13, two years in a US school, intermediate English, reads Spanish well. Uses the Spanish sheet; the map's layer names, legend and pop-ups are in English.
- **Checks:** Can I find on the map what the Spanish sheet tells me to click? Which English words on the map stop me? Is the Spanish clear?

## How a review is run

1. Build the materials a persona would see from the published build (the Hub pages as text, the Word files as text) for the lessons under review. Students get their sheet and a plain description of the map's layers.
2. Give each persona to a separate reviewer that has not seen the lesson files, with only those materials.
3. Each finding names the lesson, the exact place (page and section, or sheet and question), what happened, why it matters to this person, how serious it is (stops the lesson / slows it down / minor) and a suggested change. Anything that depends on seeing the live map is marked as such.
4. Every finding is checked against the lesson file before any change: kept, merged with others, or dropped with a reason.
