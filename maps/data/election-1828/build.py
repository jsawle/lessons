#!/usr/bin/env python3
"""Election 1828 data builder 1.0: joins the 1828 electoral votes (National Archives) and each state's voting rules
(voting-rules-1828.json, researched and fact-checked) to state outlines from Natural Earth, and writes the GeoJSON
that Data publish 1.0 puts into ArcGIS Online.

Outlines: today's state outlines from Natural Earth 1:50m admin-1 (public domain), with West Virginia shown as part of
Virginia, as it was in 1828. Only the 24 states of 1828; territories are not shown.

  python3 maps/data/election-1828/build.py path/to/ne_50m_admin_1_states_provinces.geojson
Writes maps/data/election-1828/election-1828-v<version>.geojson and a .built.json record next to it.
"""
import csv, datetime, hashlib, json, sys
from pathlib import Path
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

VERSION = "1.0"
HERE = Path(__file__).resolve().parent
DATA = json.loads((HERE / "data.json").read_text(encoding="utf-8"))
NE_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson"


def rnd(c, nd=4):
    return round(c, nd) if isinstance(c, float) else [rnd(x, nd) for x in c]


def main():
    ne_path = Path(sys.argv[1])
    ne_bytes = ne_path.read_bytes()
    ne = {f["properties"]["postal"]: f for f in json.loads(ne_bytes)["features"] if f["properties"].get("iso_a2") == "US"}
    votes = list(csv.DictReader(open(HERE / "electoral-votes-1828.csv", encoding="utf-8")))
    rules = {r["abbr"]: r for r in json.loads((HERE / "voting-rules-1828.json").read_text(encoding="utf-8"))["states"]}
    problems, feats = [], []
    for v in votes:
        ab = v["Abbr"]
        geom = shape(ne[ab]["geometry"])
        if ab == "VA": geom = unary_union([geom, shape(ne["WV"]["geometry"])])
        j, a, e = int(v["Jackson"]), int(v["Adams"]), int(v["Electors"])
        if j + a != e: problems.append(f"{ab}: votes don't add up to electors")
        r = rules.get(ab)
        if not r: problems.append(f"{ab}: no voting rules"); continue
        lead = "Jackson" if j > a else "Adams"
        votes_text = ", ".join(s for s in [f"Andrew Jackson {j}" if j else "", f"John Quincy Adams {a}" if a else ""] if s)
        props = {"State": v["State"], "Abbr": ab, "Electors": e, "Jackson1828": j, "Adams1828": a, "Votes1828": votes_text, "Lead1828": lead,
                 "Split1828": 1 if j and a else 0, "ElectorsChosenBy": r["electorsChosenBy"], "ElectorMethod": r["electorMethod"],
                 "WhiteMen": r["whiteMen"], "WhiteMenRule": r["whiteMenRule"], "BlackMen": r["blackMen"], "BlackMenRule": r["blackMenRule"],
                 "RulesSource": r["source"], "RulesSourceURL": r["sourceUrl"], "VotesSourceURL": "https://www.archives.gov/electoral-college/1828",
                 "Note": DATA["note"]}
        for k in ("WhiteMenRule", "BlackMenRule", "ElectorMethod", "RulesSource"):
            if len(props[k] or "") > 250: problems.append(f"{ab}: {k} is longer than 250 characters")
        g = mapping(geom.simplify(0.01, preserve_topology=True))
        feats.append({"type": "Feature", "properties": props, "geometry": {"type": g["type"], "coordinates": rnd(g["coordinates"])}})
    if problems: sys.exit("Not built:\n  " + "\n  ".join(problems))
    out = HERE / f"election-1828-v{DATA['version'].replace('.', '_')}.geojson"
    raw = json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    out.write_bytes(raw)
    rec = {"tool": f"Election 1828 data builder {VERSION}", "when": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "sha1": hashlib.sha1(raw).hexdigest(), "features": len(feats), "naturalEarth": {"url": NE_URL, "sha1": hashlib.sha1(ne_bytes).hexdigest()},
           "totals": {"Jackson": sum(f["properties"]["Jackson1828"] for f in feats), "Adams": sum(f["properties"]["Adams1828"] for f in feats)}}
    out.with_suffix(".built.json").write_text(json.dumps(rec, indent=1) + "\n", encoding="utf-8")
    print(f"Built {out.name}: {len(feats)} states, {len(raw)/1e3:.0f} kB; Jackson {rec['totals']['Jackson']}, Adams {rec['totals']['Adams']}")


if __name__ == "__main__":
    main()
