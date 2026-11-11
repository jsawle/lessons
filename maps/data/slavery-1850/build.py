#!/usr/bin/env python3
"""Slavery 1850 data builder 1.1: turns the saved source layers (source/*.geojson, Esri's digitization of the 1850 plate in
Harper's Atlas of American History, 1920) into two lesson layers, using the tables next to this file.

States and territories (units-1850.json): the source's 44 areas become 39. West Virginia is joined to Virginia, the two
parts of Missouri and of Minnesota Territory are joined, the small area on Utah Territory's eastern edge is joined to it, "Oklahoma" becomes Indian Territory, and the source's 16 legal
classes become four plain groups. Routes (routes-1850.json): the four route features get a name, a direction and a
short account.

  python3 maps/data/slavery-1850/build.py
Writes slavery-1850-states-v<version>.geojson and slavery-1850-routes-v<version>.geojson, each with a .built.json record.
"""
import datetime, hashlib, json, sys
from collections import Counter
from pathlib import Path
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

VERSION = "1.1"
HERE = Path(__file__).resolve().parent


def rnd(c, nd=4):
    return round(c, nd) if isinstance(c, float) else [rnd(x, nd) for x in c]


def write(name, spec_file, feats, extra):
    spec = json.loads((HERE / spec_file).read_text(encoding="utf-8"))
    out = HERE / f"{name}-v{spec['version'].replace('.', '_')}.geojson"
    raw = json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    out.write_bytes(raw)
    rec = {"tool": f"Slavery 1850 data builder {VERSION}", "when": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "sha1": hashlib.sha1(raw).hexdigest(), "features": len(feats)}
    rec.update(extra)
    out.with_suffix(".built.json").write_text(json.dumps(rec, indent=1) + "\n", encoding="utf-8")
    print(f"Built {out.name}: {len(feats)} features, {len(raw)/1e3:.0f} kB; {extra}")


def main():
    problems = []
    src_bytes = (HERE / "source/states-1850-harpers.geojson").read_bytes()
    src = json.loads(src_bytes)["features"]
    by_oid = {f["properties"]["OBJECTID"]: f for f in src}
    by_abbr = {}
    for f in src: by_abbr.setdefault(f["properties"]["STATE_ABBR"], []).append(f["properties"]["OBJECTID"])
    facts = json.loads((HERE / "units-1850.json").read_text(encoding="utf-8"))
    used, feats = set(), []
    for u in facts["units"]:
        oids = facts["sourceObjectIds"].get(u["key"]) or by_abbr.get(u["key"], [])
        if not oids: problems.append(f"{u['key']}: no source area"); continue
        if used & set(oids): problems.append(f"{u['key']}: a source area is used twice")
        used |= set(oids)
        geom = unary_union([shape(by_oid[o]["geometry"]).buffer(0) for o in oids])
        name = u.get("name") or by_oid[oids[0]]["properties"]["STATE_NAME"]
        props = {"Name": name, "Kind": u["kind"], "Status1850": facts["statuses"][str(u["status"])], "StatusOrder": u["status"],
                 "Admitted": u.get("admitted"), "Basis": u["basis"], "Note": u.get("note")}
        g = mapping(geom.simplify(0.005, preserve_topology=True))
        feats.append({"type": "Feature", "properties": props, "geometry": {"type": g["type"], "coordinates": rnd(g["coordinates"])}})
    left = set(by_oid) - used
    if left: problems.append("source areas not used: " + ", ".join(f"{o} ({by_oid[o]['properties']['STATE_NAME']})" for o in sorted(left)))
    states = Counter(f["properties"]["StatusOrder"] for f in feats if f["properties"]["Kind"] == "State")
    if dict(states) != {1: 16, 2: 15}: problems.append(f"state counts are {dict(states)}, expected 16 free and 15 slave")
    r_bytes = (HERE / "source/routes-1850-harpers.geojson").read_bytes()
    r_src = {f["properties"]["OBJECTID"]: f for f in json.loads(r_bytes)["features"]}
    routes = []
    for r in json.loads((HERE / "routes-1850.json").read_text(encoding="utf-8"))["routes"]:
        if r["oid"] not in r_src: problems.append(f"route {r['oid']}: not in the source"); continue
        routes.append({"type": "Feature", "properties": {"Name": r["name"], "Kind": r["kind"], "Direction": r["direction"], "About": r["text"]},
                       "geometry": {"type": r_src[r["oid"]]["geometry"]["type"], "coordinates": rnd(r_src[r["oid"]]["geometry"]["coordinates"])}})
        if len(r["text"]) > 250: problems.append(f"route {r['oid']}: text is longer than 250 characters")
    for f in feats:
        for k in ("Basis", "Note"):
            if len(f["properties"][k] or "") > 250: problems.append(f"{f['properties']['Name']}: {k} is longer than 250 characters")
    if problems: sys.exit("Not built:\n  " + "\n  ".join(problems))
    by_status = Counter(f["properties"]["Status1850"] for f in feats)
    write("slavery-1850-states", "data.json", feats, {"source": {"file": "source/states-1850-harpers.geojson", "sha1": hashlib.sha1(src_bytes).hexdigest()}, "byStatus": dict(by_status)})
    write("slavery-1850-routes", "routes.data.json", routes, {"source": {"file": "source/routes-1850-harpers.geojson", "sha1": hashlib.sha1(r_bytes).hexdigest()}})


if __name__ == "__main__":
    main()
