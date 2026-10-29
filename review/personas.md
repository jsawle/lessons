# Review personas

Personas for reviewing the lesson resources before teachers see them. Each one stands for a real group of teachers or students, described from published data where it exists. A review by a persona is a way to find things worth checking, not evidence of what teachers think: every finding is checked against the lesson file before anything changes, and real teachers are the final test.

Each persona reviews only what that person would see. Teachers see the lesson page, the answer page, "How these lessons work", the Word student sheet and the Word teacher notes. Students see the student sheet in their language and a description of what is on the map (the reviewers can't open the live map). Nobody sees the lesson files, the known-issues notes or this repository.

This is a bank, not a set: a review uses three or four personas chosen for what is being reviewed (see "Choosing personas" below), never all of them. T1 to T5, S1 and S2 were written for the Grade 8 US History lessons and are the ones `build_map_packets.py` uses. T6 to T11, S3 and S4 were added on 29 October 2026 for other kinds of resource (Earth science apps, civics, elementary, AP Human Geography, tools with accounts, programmes outside the US, colour-blind and younger students). They have not yet been used in a review.

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
| Middle school science teachers, 2018 | 54% hold a degree in science, engineering or science education; 36% have five or fewer years' experience teaching science; of Earth and space science teachers, only 42% feel very well prepared to teach Earth's features and physical processes and 31% climate and weather; free websites such as PhET are used weekly in 31% of classes; projection devices are available in 99% of classes | [2018 NSSME: Status of Middle School Science](https://nssmedev.horizon-research.com/wp-content/uploads/2019/05/2018-NSSME-Status-of-Middle-School-Science.pdf) |
| Grade 8 civics, NAEP 2022 | 22% at or above Proficient; 69% at or above Basic (3 points lower than 2018) | [Nation's Report Card](https://www.nationsreportcard.gov/civics/results/achievement) |
| Elementary social studies (RAND, spring 2021–22: 745 teachers, about 1,600 principals) | about 3 hours a week; nearly 3 in 10 principals say no social studies curriculum adopted; 38% of teachers are the main decision-maker on materials; about half or more use Teachers Pay Teachers, BrainPOP or YouTube weekly; 52% of principals say social studies professional development is provided | [EdWeek on RAND RRA134-17, March 2023](https://www.edweek.org/teaching-learning/when-it-comes-to-social-studies-elementary-teachers-are-on-their-own/2023/03) |
| Grade 4 reading, NAEP 2024 | about 40% below NAEP Basic, the largest share since 2002 | [NAGB press release, January 2025](https://www.nagb.gov/content/dam/nagb/en/documents/newsroom/press-releases/2025/naep2024-pressrelease-final.pdf) |
| AP Human Geography, 2025 | 283,512 students took the exam; 64.7% scored 3 or higher; mean score 3.14 | [College Board score distributions](https://apcentral.collegeboard.org/media/pdf/ap25-human-geography-score-distributions.pdf) |
| Students with disabilities, 2022–23 | 15% of public school students (7.5 million) receive services under IDEA; of those, 32% have a specific learning disability; visual impairments are under 0.5%; 67% spend at least 80% of the day in general classes | [NCES Condition of Education](https://nces.ed.gov/programs/coe/indicator/cgg/students-with-disabilities/) |
| Colour vision deficiency | up to 8% of boys, under 1% of girls | [Montreal Children's Hospital](https://montrealchildrenshospital.ca/health-info/is-it-true-that-colour-blindness-only-affects-boys/) |
| Accessibility rule (ADA Title II) | state and local governments, which a law-firm summary says include public schools, must meet WCAG 2.1 Level AA for web content and mobile apps; after the Department of Justice's interim final rule of 20 April 2026 the dates are 26 April 2027 (population 50,000 or more) and 26 April 2028 (smaller entities and special districts). Which date applies to a given district was not checked | [Reed Smith](https://www.reedsmith.com/articles/doj-extends-digital-accessibility-compliance-dates-under-title-ii-of-the-ada/) |
| Student accounts and privacy | COPPA covers children under 13; a district can consent for parents when a tool is used only for education; districts typically require central approval, a privacy review and a data agreement before teachers use a tool with student accounts (an education-news summary, not the law itself) | [EdCircuit](https://edcircuit.com/coppa-in-schools-what-educators-must-know/) |
| South Africa, school internet | about two thirds of public schools estimated connected (around 2020); in 2019 about 20% had internet for teaching and learning; only 8% of connected schools (all schools, public and independent) have high-speed connections | [The Outlier, from Department of Basic Education data](https://theoutlier.co.za/education/undefined/80402/how-many-schools-in-south-africa-have-internet-access) |
| Jamaica, school internet (2020) | 725 of 975 primary and secondary schools had internet; 348 had reliable internet | [Ministry of Education and Youth, ICT in Education Policy 2022](https://planipolis.iiep.unesco.org/sites/default/files/ressources/ICT-in-Education-Policy-Jamaica-Ministry-of-Education-and-Youth-2022.pdf) |

Not found in the sources above, so assumed: class period length (45 to 55 minutes), how often 8th-grade US history teachers use digital maps, and how many have used ArcGIS or MapMaker before (assumed: few).

Also not found, so assumed for T6 to T11 and S3 and S4: which science standards T6's state follows (assumed to be based on the NGSS); how many districts require approval of each online tool (T10); the grade mix of AP Human Geography students (assumed mostly 9th and 10th graders, from one education blog that gives no figures); how often elementary teachers use digital maps; student-to-device ratios in South African and Jamaican schools; and how many teachers outside the US use US-made resources.

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

### T6 Grace: middle school Earth science
- 8 years teaching science in a public middle school (grades 6–8), with Earth science in her load; her degree is in general science education, not geoscience. Most middle school science teachers have a science or science-education degree (54%), but only 42% of Earth and space science teachers feel very well prepared to teach Earth's features and physical processes.
- One projector, a shared Chromebook cart, 50-minute periods. Uses free simulation sites weekly. Plans against her state's science standards (assumed to be based on the NGSS).
- **She checks:** Is the science right, and does the app say what is measured data and what is a simplified model? What misconception could it create (scale, timing, cause and effect)? Could I run it as a ten-minute projected demonstration, then have students explain what they saw? What would I need to know that I don't?

### T7 Dennis: civics and government
- 12 years teaching civics in a public middle school (grade 8) and one section of high-school government. Nationally 22% of 8th graders reached NAEP Proficient in civics in 2022, so he assumes students need the basics made concrete.
- Uses primary sources and current events. Secondary social studies teachers are more likely than others to address political topics, and in some states districts restrict some of them.
- **He checks:** Are the facts about institutions, laws and numbers correct and dated? Are contested questions presented evenly, with sources? Could a parent or school board member read this as taking a side? Does it ask students to use evidence, not only look things up?
- Overlaps with Ruth on sensitive topics: use Dennis for civics content, Ruth when Texas standards or parent scrutiny is the concern.

### T8 Beth: elementary generalist, grades 3–5
- 10 years teaching grade 4 in a public elementary school; teaches every subject. Social studies gets about three hours a week. Her school has no adopted social studies curriculum (nearly 3 in 10 elementary principals report that), so she picks materials herself, often from Teachers Pay Teachers, BrainPOP or YouTube.
- Little social studies training (about half of principals say none is provided). One Chromebook cart for the grade. Her students are under 13.
- **She checks:** Can I run it in a 30-minute slot without learning a new tool first? Can nine-year-olds read it and use it with little help? Is there anything about maps I'd have to know that I don't? Does anything need a student account?

### T9 Priya: AP Human Geography
- 7 years teaching AP Human Geography and world geography in a public high school; classes are mostly 9th and 10th graders (assumed; the course is often a first AP). In 2025, 283,512 students took the exam and 64.7% scored 3 or higher.
- Plans against the course's units and the skills the exam tests, including free-response questions. Students have their own devices.
- **She checks:** Which unit and skill does this serve, and would a student practise something the exam asks for? Is the data named, dated and sourced, and shown as rates or per-person figures where a raw count would mislead? Can a student build an argument from it with evidence? Is it more than a map to look at?

### T10 Hannah: the district approves every tool
- 6 years teaching grades 5–7 social studies and science in a district where every online tool used with students must be approved by the technology office after a privacy review. Her classes mix students under and over 13 (COPPA covers under 13).
- She won't ask students to create an account or sign in with personal details unless the tool is on the approved list.
- **She checks:** Does any step need an account, a sign-in or personal information? Where does student work end up and who can see it? What would I tell the technology office: who makes it and what data it collects? Can it be used with no sign-in at all? Does it send students to other sites that may not be approved?
- Overlaps with Luis only a little: Luis is about blocked sites and shared devices, Hannah about approval, accounts and data.

### T11 Thandi: teacher in a national programme outside the US
- 12 years teaching geography in a public secondary school in a country where a national programme has adopted these resources (for example South Africa or Jamaica). Teaches to her national curriculum, not US state standards, and uses metric units.
- Her school has internet but it is slow or drops out: about two thirds of South African public schools are estimated connected, and in Jamaica in 2020 348 of 975 schools had reliable internet. Devices are mixed: a computer room, a projector, learners' phones or tablets.
- **She checks:** What assumes the US (states, standards, holidays, miles, US-only examples)? Does it load and work on a slow connection? Could I match it to my own curriculum? Could it be translated or localised? Does it need an account I can't get?

## Student personas

### S1 Jordan: reads below grade level
- 13, in 8th grade, reads below grade level (about a third of 8th graders are below NAEP Basic). Confident with phones and Chromebooks; gives up when instructions are long.
- **Checks:** Can I follow each step without asking? Which words stop me? Do I know what to write and how much? Can I finish in the time?

### S2 Sofía: English learner, Spanish speaker
- 13, two years in a US school, intermediate English, reads Spanish well. Uses the Spanish sheet; the map's layer names, legend and pop-ups are in English.
- **Checks:** Can I find on the map what the Spanish sheet tells me to click? Which English words on the map stop me? Is the Spanish clear?

### S3 Eli: colour vision deficiency
- 13, in 8th grade, red-green colour vision deficiency (up to 8% of boys, under 1% of girls). Reads at grade level; uses a Chromebook. Teachers and classmates often say "the red one" or "the green layer".
- **Checks:** Can I tell the classes and layers apart without relying on red against green or similar hues? Do the legend and map use shapes, patterns, labels or lightness as well as colour? Does the sheet name things by colour only?
- Limit: a reviewer sees the pictures in full colour, so can judge whether colour alone carries the meaning but not how it looks to Eli. For a closer check, add colour-vision simulations of the same pictures to the packet (not yet done).

### S4 Aaliyah: grade 4 student
- 9, in 4th grade, reads at or a little below grade level (about 40% of 4th graders nationally were below NAEP Basic in reading in 2024). New to digital maps. Uses a school tablet or Chromebook with her teacher nearby; small buttons and long sentences are hard.
- **Checks:** Can I read every instruction on my own? Can I tap or click the right thing? Do I know what I'm meant to find and when I'm done? Which words are too hard?
- Pairs with Beth.

## Choosing personas

Pick three or four for each review, matched to what is being reviewed, and always include the persona whose constraint the resource is most likely to break.

| Reviewing | Start with | Add |
|---|---|---|
| Grade 8 US History lessons and maps | T3 Luis, T4 Ana, T5 Ruth, S1 Jordan | T1 Mark or T2 Dana, not both (they overlapped heavily in the October pilot); S2 Sofía when there is a Spanish sheet |
| Earth science and physical-process apps (grades 6–8) | T6 Grace, S1 Jordan | S3 Eli if colour carries meaning; T3 Luis if it will be projected or run on shared devices |
| Civics and government resources | T7 Dennis, S1 Jordan | S2 Sofía for text-heavy sheets; T5 Ruth only for a Texas standards or parent-scrutiny check |
| Elementary (grades 3–5) | T8 Beth, S4 Aaliyah | T10 Hannah if anything needs an account; S3 Eli for colour-coded maps |
| AP Human Geography and data-heavy maps | T9 Priya, S1 Jordan | S3 Eli; S2 Sofía for text-heavy resources |
| Anything with sign-in, saving or student accounts | T10 Hannah, T3 Luis | T2 Dana for a first-time user's view |
| Resources for partners outside the US | T11 Thandi | T4 Ana and S2 Sofía for language and translation |
| Any map with a legend or colour-coded layers | add S3 Eli to whichever set is chosen | |

Limits to keep in mind:
- A persona review sees only what is in its packet. Keyboard and screen-reader use, contrast and focus order can't be judged that way: use an automated accessibility checker and a keyboard-only run-through, and treat Eli's review as an addition to those, not a substitute.
- Ana and Sofía are a pair by design (teacher and student views of the same Spanish sheet); use both only when there is one.
- For apps rather than lessons there is no packet builder yet. The projection-lab review used a packet of screenshots and on-screen text; do the same, and show reviewers only what a teacher or student would see.

## How a review is run

1. Build the materials a persona would see from the published build (the Hub pages as text, the Word files as text) for the lessons under review. Students get their sheet and a plain description of the map's layers.
2. Give each persona to a separate reviewer that has not seen the lesson files, with only those materials.
3. Each finding names the lesson, the exact place (page and section, or sheet and question), what happened, why it matters to this person, how serious it is (stops the lesson / slows it down / minor) and a suggested change. Anything that depends on seeing the live map is marked as such.
4. Every finding is checked against the lesson file before any change: kept, merged with others, or dropped with a reason.
