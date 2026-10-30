# Map 1 data check: cession dates against Royce's schedule (30 Oct 2026)

Layer checked: Indian land cessions copy v1.1 in GIS for Schools (item fbefc5d9f79242d9a6b866b93f5a5af5, 717 polygons), read from its public FeatureServer on 30 Oct 2026.

Reference: Charles C. Royce, *Schedule of Indian Land Cessions*, in *Indian Land Cessions in the United States*, Bureau of American Ethnology, 18th Annual Report, part 2 (1899), the Internet Archive copy (annualreportofbu218smit) that the layer's ScheduleURL field links to. Read through the Internet Archive's OCR text in the browser on Jason's computer.

Sample: the five 1830s Southeast treaties the lesson uses (Choctaw 1830, Creek 1832, Chickasaw 1832, Cherokee 1835, Seminole 1832), plus 20 cessions drawn at random (seed 20261030) from the other 712.

Method: for each cession, the schedule page that the layer links to (and the facing page) was searched for the first date, the tribe and the cession number. The OCR text loses the table's rows, so a match means the date, tribe and number are on the same two-page spread, not that they were read off one row. Where the OCR was unclear, the entry's text or the remarks column was read instead.

**Result: 25 of 25 consistent with Royce. No mismatches found.**

| Cession | Tribe (layer) | Dates (layer) | Royce page | What the schedule shows |
|---|---|---|---|---|
| 2 | Six Nations | October 22, 1784 | 648 | 1784 Oct. 22, Fort Stanwix, Six Nations |
| 13 | Chippewa; Delaware; Eel River; Kaskaskia; Kickapoo; Miami; O | August 3, 1795 | 654 | 1795 Aug. 3, Greenville; Wyandot, Delaware, Shawnee, Ottawa, Chippewa and others |
| 14 | Chippewa; Delaware; Eel River; Kaskaskia; Kickapoo; Miami; O | August 3, 1795 | 654 | 1795 Aug. 3, Greenville (same entry as 13) |
| 157 | Choctaw | November 16, 1805; September 27, 1830 | 672 | 1805 Nov. 16 on the linked page; also checked: 1830 Sept. 27, Dancing Rabbit Creek, Choctaw, whose remarks column gives 156 (Alabama, Mississippi) and 157 (Alabama) |
| 101 | Cherokee | February 27, 1819 | 696 | 1819 Feb. 27, Cherokee |
| 241 | Chippewa, Saginaw tribe | September 24, 1819; January 14, 1837 | 700 | 1819 Sept. 24, Saginaw, Michigan territory |
| 173 | Seminole | September 18, 1823; May 9, 1832 | 704 | 1823 Sept. 18, Camp on Moultrie creek, Florida territory; Royce names the tribe "Florida tribes" (the Forest Service field says Seminole); the second date, the Seminole treaty of May 9, 1832, is in the schedule |
| 172 | Creek | March 24, 1832 | 734 | 1832 Mar. 24, Creek |
| 178 | Chickasaw | October 20, 1832 | 738 | 1832 Oct. 20, Chickasaw |
| 221 | Potawatomi, Masac's band | October 27, 1832; September 20, 1836; September 22, 1836 | 742 | 1832 Oct. 27, Tippecanoe river, Potawatomi of Indiana and Michigan |
| 501 | Kaskaskia; Mixed Seneka; Ottawa of Blanehard's fork and Roch | December 29, 1832; February 23, 1867; February 23, 1867 | 744 | 1832 Dec. 29, Kaskaskia and others |
| 490 | Cherokee | December 29, 1835; July 19, 1866; April 27, 1868 | 754 | 1835 Dec. 29, New Echota, Cherokee |
| 203 | Cherokee | December 29, 1835 | 754 | 1835 Dec. 29, New Echota, Cherokee |
| 298 | Cha; Cham-et-ko; Co-ha-ma; Co-lu; Doc-duc; Tat-nah; Toc-de;  | September 9, 1851 | 786 | 1851, the first of three September entries (Camp Colus treaty: Co-lu, Wi-lay, Co-ha-ma, Tat-nah, Cha and others); the day is unreadable in the OCR, so 9 is consistent but not confirmed |
| 621 | Arikara; Gros Ventre; Mandan | September 17, 1851; April 12, 1870; July 13, 1880 | 786 | 1851 Sept. 17, Fort Laramie; Sioux ... Mandan and Arikara |
| 322 | Menomini | May 12, 1854 | 792 | 1854 May 12, Falls of Wolf river, Menomini |
| 449 | Uta | May 5, 1864; June 18, 1878 | 830 | Act of May 5, 1864; the remarks cite "act of May 5, 1864" for Nos. 449 to 452 |
| 466 | Colorado River | March 3, 1865; November 16, 1874 | 834 | 1865 Mar. 3, Colorado River |
| 481 | Seminole | March 21, 1866 | 840 | 1866 Mar. 21, Seminole |
| 516 | Sioux | April 29, 1868 | 848 | 1868 Apr. 29, Sioux |
| 520 | Bannock; Shoshoni | July 3, 1868 | 850 | 1868 July 3, Bannock and Shoshoni |
| 547 | King's River; Owen's river; Tule River | October 3, 1873 | 864 | 1873 Oct. 3, King's River and others |
| 642 | Nez Percé (Moses' band) | April 19, 1879; February 23, 1883 | 894 | Executive order of Apr. 19, 1879, Chief Moses's reservation |
| 695 | Indians of Blackfoot agency | May 1, 1888 | 926 | 1888 May 1, act of Congress (Blackfoot) |
| 694 | Indians of Fort Belknap agency | May 1, 1888 | 926 | 1888 May 1, act of Congress (Fort Belknap) |

Limits:

- First dates only, except cessions 157 and 173, whose 1830s dates (the ones that put them in the 1830s layer) were also checked. Second and third dates of the other multi-date cessions were not.
- Spread-level, not row-level (see Method). Cession 298's day is consistent but not confirmed.
- Boundaries were not checked. The Forest Service georeferenced Royce's maps against 1:2,000,000 base data; a boundary check means comparing the polygons with Royce's plates.
- Tribe names follow the Forest Service's field, which can differ from Royce's wording (cession 173: Royce "Florida tribes", layer "Seminole"). The lesson should not treat the layer's name as Royce's.
