#!/usr/bin/env python3
"""Civil War 1863 data builder 1.0: joins each state's side and group in the Civil War (states-1863.json) to state
outlines from Natural Earth, and writes the GeoJSON that Data publish puts into ArcGIS Online.

Outlines: today's state outlines from Natural Earth 1:50m admin-1 (public domain). The 35 states of mid-1863, with West
Virginia as its own state. Territories, and Nevada (a state from 1864), are not shown.

  python3 maps/data/civil-war-1863/build.py path/to/ne_50m_admin_1_states_provinces.geojson
Writes maps/data/civil-war-1863/civil-war-1863-v<version>.geojson and a .built.json record next to it.
"""
import datetime, hashlib, json, sys
from collections import Counter
from pathlib import Path
from shapely.geometry import shape, mapping

VERSION = "1.0"
HERE = Path(__file__).resolve().parent
DATA = json.loads((HERE / "data.json").read_text(encoding="utf-8"))
FACTS = json.loads((HERE / "states-1863.json").read_text(encoding="utf-8"))
NE_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson"


def rnd(c, nd=4):
    return round(c, nd) if isinstance(c, float) else [rnd(x, nd) for x in c]


def main():
    ne_bytes = Path(sys.argv[1]).read_bytes()
    ne = {f["properties"]["postal"]: f for f in json.loads(ne_bytes)["features"] if f["properties"].get("iso_a2") == "US"}
    problems, feats = [], []
    for s in FACTS["states"]:
        ab = s["abbr"]
        if ab not in ne: problems.append(f"{ab}: no outline"); continue
        if (s["side"] == "Confederacy") != bool(s["seceded"]): problems.append(f"{ab}: side and secession date disagree")
        if (s["group"] in (3, 4)) != (s["side"] == "Confederacy"): problems.append(f"{ab}: group and side disagree")
        props = {"State": ne[ab]["properties"]["name"], "Abbr": ab, "Side": s["side"], "GroupName": FACTS["groups"][str(s["group"])], "GroupOrder": s["group"],
                 "Seceded": s["seceded"], "Note": s.get("note")}
        g = mapping(shape(ne[ab]["geometry"]).simplify(0.01, preserve_topology=True))
        feats.append({"type": "Feature", "properties": props, "geometry": {"type": g["type"], "coordinates": rnd(g["coordinates"])}})
    if len({f["properties"]["Abbr"] for f in feats}) != len(feats): problems.append("a state appears twice")
    counts = Counter(f["properties"]["GroupOrder"] for f in feats)
    if dict(counts) != {1: 19, 2: 5, 3: 7, 4: 4}: problems.append(f"group counts are {dict(counts)}, expected 19 free, 5 border, 7 before and 4 after Fort Sumter")
    if problems: sys.exit("Not built:\n  " + "\n  ".join(problems))
    out = HERE / f"civil-war-1863-v{DATA['version'].replace('.', '_')}.geojson"
    raw = json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    out.write_bytes(raw)
    rec = {"tool": f"Civil War 1863 data builder {VERSION}", "when": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "sha1": hashlib.sha1(raw).hexdigest(), "features": len(feats), "naturalEarth": {"url": NE_URL, "sha1": hashlib.sha1(ne_bytes).hexdigest()},
           "groups": {FACTS["groups"][str(k)]: v for k, v in sorted(counts.items())}}
    out.with_suffix(".built.json").write_text(json.dumps(rec, indent=1) + "\n", encoding="utf-8")
    print(f"Built {out.name}: {len(feats)} states, {len(raw)/1e3:.0f} kB; {rec['groups']}")


if __name__ == "__main__":
    main()
