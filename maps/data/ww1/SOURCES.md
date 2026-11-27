# WWI data: sources, licences and open checks

## Battles (`battles.json`, data 0.1.0)

- **Facts** (dates, sides, places) come from the sources named in each record: National Army Museum, American Battle Monuments Commission (US federal), The National Archives (UK), 1914-1918-online, London Gazette despatches, newspapers of the time (Papers Past), Western Front Association, SA Military History Society and published research. The full list with links is under `sources` in `battles.json`.
- **Summaries** are written for this layer; nothing is copied from a source.
- **Coordinates** come from GeoNames (CC BY 4.0), so the item credits must name GeoNames.
- **Not used:** Wikipedia or Wikidata, Britannica, CARTO, Google Earth Engine, McMaster trench maps (non-commercial licence) and World History Encyclopedia maps (no derivatives).

### Open checks before this goes beyond the lab

| Record | Issue |
|---|---|
| AF10 Naulila (18 Dec 1914) | Date found only in Wikipedia. Confirm from a better source or drop |
| AF36 El Herri (13 Nov 1914) | Date only from a weak site. Confirm or drop |
| AF31 Kasama | Sources differ: WFA gives 9 Nov 1918, NAM teachers' notes give 13 Nov. The record spans both |
| AF03, AF06, AF20, AF22, AF25, AF27, AF30, AF35, AF37, AF38, AF39 | Event confirmed; exact days from secondary literature, or month-level only (see `DateCheck`) |
| AF15 Khorab, AF34 Agagia, AF35 Beringia | Place not in GeoNames; plotted at the nearest gazetteer town (see `LocationBasis`) |
| AF37 Volta-Bani War | A region-level point at Dédougou |

Left out: the attack on Namema (June 1916), because its location couldn't be confirmed.

## Western Front lines (`western-front-lines.json`, data 0.2.0)

| Line | Shows (time slider) | Source | Rights | Accuracy |
|---|---|---|---|---|
| WFL_1914_09, furthest German advance | 5 to 13 Sep 1914 | Truman Library M1236, solid red ("Extreme limit of the German invasion in 1914") | Public domain (Truman: unrestricted; 1918 publication) | Control-point RMS 2.5 km; worst leave-one-out 7.1 km |
| WFL_1914_1917, front late 1914 to March 1917 | 14 Sep 1914 to 15 Mar 1917 | M1236, dashed blue (after the Marne) from Lens to the Aisne, solid blue elsewhere | as above | as above |
| WFL_1917_1918, front March 1917 to March 1918 | 16 Mar 1917 to 20 Mar 1918 | M1236, solid blue ("Front line, February 1918") | as above | as above; checked against Truman M549 (G-3, GHQ, AEF, front on 21 Mar 1918): median 3.2 km, 90% within 5.4 km |
| WFL_1918_11_11, the Armistice | 11 Nov 1918 | Order of Battle on Western Front, 11 A.M., Nov. 11, 1918, G-3, GHQ, AEF. LOC g5701s.ct004277 | US government work: public domain in the US | Control-point RMS 3.6 km; worst leave-one-out about 11 km |

M1236: "The Western Theatre of the European War", 1918 edition, Prof. B. Barrecchia, Société Editrice Géographique, Paris, 1:500,000. Image: https://www.trumanlibrary.gov/sites/default/files/maps/M1236.jpg (the M608 and M549 record pages are no longer on the Truman site, but their images are, at the same address with M608.jpg and M549.jpg).

Dates: the switch from WFL_1914_1917 to WFL_1917_1918 is 16 March 1917, when the main withdrawal to the Hindenburg Line began (1914-1918-online, Operation Alberich, IWM map caption). The National Army Museum gives the whole retreat as 23 February to 5 April 1917.

Known limits:
- WFL_1914_09: the source's line runs off its western edge north-east of Paris, so the part to the sea isn't shown. Around Verdun the source line also takes in the 1916 advance.
- WFL_1914_1917: near Ypres the source shows only the later line, so this line runs about 10 km east of Ypres (the 1917 Passchendaele gains), where the 1915–16 front was 3 to 4 km away. Ypres 1915, Verdun 1916 and Somme 1916 changes are not shown.
- WFL_1917_1918: for spring to December 1917 it is approximate; Arras, Messines, Passchendaele and Cambrai moved parts of it.
- Not yet traced: the German offensives of 21 March to July 1918 and the Allied advance of August to November 1918 (M608 and M1236 have them; see the plan).

`trace_armistice.py` (1.0) and `trace_m1236.py` (1.0) re-trace the lines from the source images and reproduce the stored coordinates.
