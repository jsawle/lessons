#!/usr/bin/env python3
"""WWI data builder 1.0: writes the WWI pilot layers that Data publish puts into ArcGIS Online.

  - ww1-battles: one point per battle or other fighting (Western Front and Africa), from battles.json
  - ww1-western-front-lines: dated Western Front lines, from western-front-lines.json (traced by trace_armistice.py)

Nothing is downloaded: the facts files hold everything. Checks each record (dates in order, coordinates inside the
theatre, sources named) and refuses to build if any fails.

  python3 maps/data/ww1/build.py
Writes maps/data/build/ww1/<id>-v<version>.geojson and a .built.json record next to each.
"""
import datetime, hashlib, json, re, sys
from pathlib import Path

VERSION = "1.0"
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
DAY = re.compile(r"^\d{4}-\d{2}-\d{2}$")
# rough boxes (west, south, east, north) to catch a coordinate typed into the wrong theatre
BOXES = {"Western Front": (1.0, 47.0, 7.5, 51.5), "Africa": (-20.0, -35.0, 52.0, 38.0)}


def spec(name):
    return json.loads((HERE / f"{name}.data.json").read_text(encoding="utf-8"))


def write(spec_, feats, extra):
    out = ROOT / spec_["file"]
    out.parent.mkdir(parents=True, exist_ok=True)
    body = json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    out.write_bytes(body)
    rec = {"tool": f"WWI data builder {VERSION}", "when": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "sha1": hashlib.sha1(body).hexdigest(), "features": len(feats), **extra}
    out.with_suffix(".built.json").write_text(json.dumps(rec, indent=1) + "\n", encoding="utf-8")
    print(f"  {spec_['id']} {spec_['version']}: {len(feats)} features -> {spec_['file']}")


def battles(problems):
    facts = json.loads((HERE / "battles.json").read_text(encoding="utf-8"))
    src, s, feats = facts["sources"], spec("ww1-battles"), []
    for b in facts["battles"]:
        bid = b["id"]
        if not (DAY.match(b["start"]) and DAY.match(b["end"])): problems.append(f"{bid}: dates must be YYYY-MM-DD")
        elif b["start"] > b["end"]: problems.append(f"{bid}: ends before it starts")
        if not ("1914-07-28" <= b["start"] <= "1918-12-31"): problems.append(f"{bid}: start outside the war")
        box = BOXES["Western Front" if b["theatre"] == "Western Front" else "Africa"]
        if not (box[0] <= b["lon"] <= box[2] and box[1] <= b["lat"] <= box[3]): problems.append(f"{bid}: point outside its theatre")
        missing = [k for k in b["sources"] if k not in src]
        if missing or not b["sources"]: problems.append(f"{bid}: source not listed: {missing}")
        s1 = src.get(b["sources"][0], {}) if b["sources"] else {}
        s2 = src.get(b["sources"][1], {}) if len(b["sources"]) > 1 else {}
        props = {"BattleId": bid, "Name": b["name"], "Theatre": b["theatre"],
                 "Region": "Western Front" if b["theatre"] == "Western Front" else "Africa",
                 "Campaign": b["campaign"], "EventType": b["type"], "StartDate": b["start"], "EndDate": b["end"],
                 "DatePrecision": b["precision"], "SideA": b["sideA"], "SideB": b["sideB"], "Summary": b["summary"],
                 "Place": b["place"], "LocationBasis": b["locBasis"], "LocationPrecision": b["locPrecision"],
                 "DateCheck": b["dateCheck"], "Source1": s1.get("title", ""), "Source1Url": s1.get("url", ""),
                 "Source2": s2.get("title", ""), "Source2Url": s2.get("url", ""), "DataVersion": s["version"]}
        feats.append({"type": "Feature", "properties": props, "geometry": {"type": "Point", "coordinates": [b["lon"], b["lat"]]}})
    if len({f["properties"]["BattleId"] for f in feats}) != len(feats): problems.append("a battle id appears twice")
    return s, feats


def lines(problems):
    facts = json.loads((HERE / "western-front-lines.json").read_text(encoding="utf-8"))
    s, feats = spec("ww1-western-front-lines"), []
    for ln in facts["lines"]:
        c = ln["coordinates"]
        if len(c) < 10: problems.append(f"{ln['id']}: too few points")
        if not all(1.0 <= x <= 8.5 and 47.0 <= y <= 51.6 for x, y in c): problems.append(f"{ln['id']}: point outside the Western Front")
        if ln["showFrom"] > ln["showTo"]: problems.append(f"{ln['id']}: dates out of order")
        props = {"LineId": ln["id"], "Name": ln["name"], "LineDate": ln["lineDate"], "ShowFrom": ln["showFrom"], "ShowTo": ln["showTo"],
                 "Description": ln["description"], "Source": ln["source"]["title"] + ". " + ln["source"]["holder"],
                 "SourceUrl": ln["source"]["url"], "SourceRights": ln["source"]["rights"],
                 "AccuracyKm": ln["accuracy"]["rmsKm"], "AccuracyNote": ln["accuracy"]["note"], "DataVersion": s["version"]}
        feats.append({"type": "Feature", "properties": props, "geometry": {"type": "LineString", "coordinates": c}})
    return s, feats


def main():
    print(f"WWI data builder {VERSION}")
    problems = []
    built = [battles(problems), lines(problems)]
    for p in problems: print("  NOT BUILT:", p)
    if problems: sys.exit(1)
    for s, feats in built: write(s, feats, {"facts": "maps/data/ww1"})


if __name__ == "__main__":
    main()
