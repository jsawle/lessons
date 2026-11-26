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

## Western Front lines (`western-front-lines.json`, data 0.1.0)

| Line | Source | Rights | Accuracy |
|---|---|---|---|
| WFL_1918_11_11, the Armistice | Order of Battle on Western Front, 11 A.M., Nov. 11, 1918, G-3, GHQ, AEF. LOC g5701s.ct004277 | US government work: public domain in the US | Control-point RMS 3.6 km; worst leave-one-out about 11 km |

`trace_armistice.py` (1.0) re-traces the line from the LOC scan and reproduces the stored coordinates: 111 points, 551 km.
