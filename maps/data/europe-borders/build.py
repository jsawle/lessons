#!/usr/bin/env python3
"""Europe borders data builder 1.3: cuts four snapshots of Europe's country boundaries out of CShapes 2.0 (ETH Zurich)
and writes the GeoJSON files that Data publish puts into ArcGIS Online.

Snapshots (snapshots.json): 1 July 1914, 1 June 1925, 1 January 1938 and 31 December 1947: before and after each world
war's settlement. Each keeps the countries whose borders were in force on that day, clipped to Europe.

Source: CShapes 2.0, Schvitz, Girardin, Ruegger, Weidmann, Cederman and Gleditsch (2022), "Mapping the International
System, 1886-2019", Journal of Conflict Resolution 66(1). Licence CC BY-NC-SA 4.0. The source file and the files built
from it are NOT kept in this repository: the builder downloads the source, checks its fingerprint, and writes to
maps/data/build/ (ignored by git). See LICENCE.md in this folder before publishing or sharing anything built here.

  python3 maps/data/europe-borders/build.py                  downloads the source
  python3 maps/data/europe-borders/build.py path/to/cshapes_2_gw.topojson.xz
Writes maps/data/build/europe-borders/europe-<year>-v<version>.geojson and a .built.json record next to each.

1.1 also writes the timeline file (snapshots.json "timeline"): one feature for every border period in the source that
overlaps 1914 to 1947, with the dates each was in force, for the time slider. A LAB layer: see maps/plan/europe-borders.md.
1.2 also writes the changes file (snapshots.json "changes"): the land that went from one country to another at each
border change, to flash on the map for a year after the change.
1.3 thins the outlines of the timeline and changes files (snapshots.json "timeline" "simplifyDegrees") so they draw
faster. Each shared border is one line in the source and is thinned once, so neighbours still meet. Islands too small
to keep a shape at that tolerance are dropped. The four snapshot files are not thinned and do not change.
1.4 keeps the countries in snapshots.json "keepWhole" whole in the timeline and changes files instead of clipping them to
Europe, so the Russian Empire and the Soviet Union show to the Pacific. The snapshot files are still clipped. Stretches of
line outside the Europe extent are thinned more ("simplifyOutsideDegrees"), so whole Russia doesn't make the layers slow to load.
"""
import datetime, hashlib, json, lzma, sys, urllib.request
import pyproj, shapely
from pathlib import Path
from shapely.geometry import LineString, Polygon, MultiPolygon, box, mapping
from shapely.validation import make_valid

VERSION = "1.4"
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CFG = json.loads((HERE / "snapshots.json").read_text(encoding="utf-8"))
SRC_URL = "https://raw.githubusercontent.com/cran/cshapes/" + CFG["source"]["commit"] + "/inst/extdata/cshapes_2_gw.topojson.xz"


def rnd(c, nd=4):
    return round(c, nd) if isinstance(c, float) else [rnd(x, nd) for x in c]


def polygons(g):
    """Polygons only: clipping and repair can leave stray lines or points."""
    if g.is_empty: return None
    if g.geom_type == "Polygon": return g
    parts = [p for p in getattr(g, "geoms", []) if p.geom_type in ("Polygon", "MultiPolygon")]
    flat = [q for p in parts for q in (p.geoms if p.geom_type == "MultiPolygon" else [p])]
    return MultiPolygon(flat) if flat else None


def thin_line(pts, tol, tol_out=None, extent=None):
    """Simplify one line; the stretches wholly outside the extent get the coarser tolerance. Each stretch keeps its end
    points, so the line still starts and ends where it did and neighbours sharing it still meet."""
    if not (tol_out and extent): return list(LineString(pts).simplify(tol, preserve_topology=False).coords)
    inside = [extent[0] <= x <= extent[2] and extent[1] <= y <= extent[3] for x, y in pts]
    runs, start = [], 0
    for i in range(1, len(pts)):
        if inside[i] != inside[i - 1]: runs.append((start, i, inside[i - 1])); start = i
    runs.append((start, len(pts), inside[-1]))
    out = []
    for a, b, ins in runs:
        seg = pts[max(a - 1, 0):b]  # overlap one point so stretches join
        seg = list(LineString(seg).simplify(tol if ins else tol_out, preserve_topology=False).coords) if len(seg) > 2 else seg
        out.extend(seg if not out else seg[1:])
    return out


def read_source(raw, tol=None, tol_out=None, extent=None):
    t = json.loads(lzma.decompress(raw).decode("utf-8")); tr = t.get("transform"); arcs = []
    for a in t["arcs"]:
        pts, x, y = [], 0, 0
        for dx, dy in a:
            if tr: x += dx; y += dy; pts.append((x * tr["scale"][0] + tr["translate"][0], y * tr["scale"][1] + tr["translate"][1]))
            else: pts.append((dx, dy))
        if tol and len(pts) > 2:
            closed = pts[0] == pts[-1]; pts = thin_line(pts, tol, tol_out, extent)
            if closed and len(pts) < 4: pts = None  # an island too small to keep a shape
        arcs.append(pts)

    def ring(idx):
        out = []
        for i in idx:
            a = arcs[i] if i >= 0 else arcs[~i]
            if a is None: return None
            if i < 0: a = a[::-1]
            out.extend(a if not out else a[1:])
        return out if len(out) >= 4 else None

    def poly(p):
        e = ring(p[0])
        return None if e is None else Polygon(e, [h for h in (ring(r) for r in p[1:]) if h])

    feats = []
    for o in t["objects"][next(iter(t["objects"]))]["geometries"]:
        if o["type"] == "Polygon": ps = [poly(o["arcs"])]
        elif o["type"] == "MultiPolygon": ps = [poly(p) for p in o["arcs"]]
        else: continue
        ps = [q for q in ps if q is not None]
        if ps: feats.append((o["properties"], make_valid(ps[0] if o["type"] == "Polygon" else MultiPolygon(ps))))
    return feats


def cut(p, g, bb):
    """Clip to Europe, except a country listed in keepWhole (timeline and changes only)."""
    return g if p["country_name"] in CFG.get("keepWhole", []) else g.intersection(bb)


def display_name(n, year, status):
    for rule in CFG["names"].get(n, []):
        if (rule.get("before") is None or year < rule["before"]) and (rule.get("status") is None or status == rule["status"]):
            return rule["name"]
    return n


def main():
    if len(sys.argv) > 1: raw = Path(sys.argv[1]).read_bytes()
    else:
        print("Downloading", SRC_URL); raw = urllib.request.urlopen(SRC_URL, timeout=120).read()
    sha = hashlib.sha1(raw).hexdigest()
    if sha != CFG["source"]["sha1"]: sys.exit(f"Not built: the source file's fingerprint is {sha}, expected {CFG['source']['sha1']}.")
    src = read_source(raw)
    owners = {}
    for p, _ in sorted(src, key=lambda f: f[0]["start"]): owners[int(p["gwcode"])] = p["country_name"]
    bb = box(*CFG["extent"]); drop = set(CFG["notEurope"]); outdir = ROOT / "maps" / "data" / "build" / "europe-borders"; outdir.mkdir(parents=True, exist_ok=True)
    for snap in CFG["snapshots"]:
        day, year, feats, problems = snap["date"], int(snap["date"][:4]), [], []
        for p, g in src:
            if not (p["start"] <= day <= p["end"]) or p["country_name"] in drop or not g.intersects(bb): continue
            g = polygons(g.intersection(bb).buffer(0))
            if g is None: continue
            own, code = int(p["owner"]), int(p["gwcode"])
            by = "" if own == code else CFG["controllers"].get(str(own), owners.get(own, str(own)))
            props = {"Name": display_name(p["country_name"], year, p["status"]), "SourceName": p["country_name"], "Status": p["status"].capitalize(),
                     "ControlledBy": by, "BorderFrom": p["start"], "BorderTo": p["end"], "Snapshot": day}
            m = mapping(g); feats.append({"type": "Feature", "properties": props, "geometry": {"type": m["type"], "coordinates": rnd(m["coordinates"])}})
        names = [f["properties"]["Name"] for f in feats]
        if len(set(names)) != len(names): problems.append("a name appears twice: " + ", ".join(sorted({n for n in names if names.count(n) > 1})))
        if len(feats) != snap["expectFeatures"]: problems.append(f"{len(feats)} features, expected {snap['expectFeatures']}")
        for must in snap["mustHave"]:
            if must not in names: problems.append("missing: " + must)
        for never in snap.get("mustNotHave", []):
            if never in names: problems.append("should not be here: " + never)
        if problems: sys.exit(f"Not built ({day}):\n  " + "\n  ".join(problems))
        feats.sort(key=lambda f: f["properties"]["Name"])
        out = outdir / f"europe-{year}-v{CFG['version'].replace('.', '_')}.geojson"
        body = json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")).encode("utf-8"); out.write_bytes(body)
        rec = {"tool": f"Europe borders data builder {VERSION}", "when": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
               "sha1": hashlib.sha1(body).hexdigest(), "features": len(feats), "snapshot": day,
               "cshapes": {"url": SRC_URL, "sha1": sha, "licence": "CC BY-NC-SA 4.0"}}
        out.with_suffix(".built.json").write_text(json.dumps(rec, indent=1) + "\n", encoding="utf-8")
        print(f"Built {out.name}: {len(feats)} features, {len(body)/1e3:.0f} kB")
    thin = read_source(raw, CFG["timeline"].get("simplifyDegrees"), CFG["timeline"].get("simplifyOutsideDegrees"), CFG["extent"])
    timeline(thin, owners, bb, drop, outdir, sha)
    changes(thin, bb, drop, outdir, sha)


def day_before(d): return (datetime.date.fromisoformat(d) - datetime.timedelta(days=1)).isoformat()


def timeline(src, owners, bb, drop, outdir, sha):
    """Every border period overlapping the window, as one layer. Checked day by day: no name twice on any day, and on
    each snapshot day exactly the names the snapshot layers have."""
    T = CFG["timeline"]; lo, hi, feats = T["from"], T["to"], []
    for p, g in src:
        if p["end"] < lo or p["start"] > hi or p["country_name"] in drop or not g.intersects(bb): continue
        g = polygons(cut(p, g, bb).buffer(0))
        if g is None: continue
        m = mapping(g); geom = {"type": m["type"], "coordinates": rnd(m["coordinates"])}
        own, code = int(p["owner"]), int(p["gwcode"])
        by = "" if own == code else CFG["controllers"].get(str(own), owners.get(own, str(own)))
        cuts = [d for d in T["renamed"].get(p["country_name"], []) if p["start"] < d <= p["end"]]
        edges = [p["start"]] + cuts + [None]
        for a, b in zip(edges, edges[1:]):
            z = p["end"] if b is None else day_before(b)
            if z < lo or a > hi: continue
            feats.append({"type": "Feature", "geometry": geom, "properties": {
                "Name": display_name(p["country_name"], int(a[:4]), p["status"]), "SourceName": p["country_name"], "Status": p["status"].capitalize(),
                "ControlledBy": by, "BorderFrom": p["start"], "BorderTo": p["end"], "ShowFrom": max(a, lo), "ShowTo": min(z, hi)}})
    problems = []
    if len(feats) != T["expectFeatures"]: problems.append(f"{len(feats)} features, expected {T['expectFeatures']}")
    d, end, snaps = datetime.date.fromisoformat(lo), datetime.date.fromisoformat(hi), {s["date"]: s for s in CFG["snapshots"]}
    while d <= end:
        day = d.isoformat(); names = [f["properties"]["Name"] for f in feats if f["properties"]["ShowFrom"] <= day <= f["properties"]["ShowTo"]]
        if len(set(names)) != len(names): problems.append(f"{day}: a name appears twice: " + ", ".join(sorted({n for n in names if names.count(n) > 1})))
        if day in snaps:
            s = snaps[day]
            if len(names) != s["expectFeatures"]: problems.append(f"{day}: {len(names)} features, the snapshot layer has {s['expectFeatures']}")
            problems += [f"{day}: missing {n}" for n in s["mustHave"] if n not in names] + [f"{day}: should not be here: {n}" for n in s.get("mustNotHave", []) if n in names]
        d += datetime.timedelta(days=1)
    if problems: sys.exit("Not built (timeline):\n  " + "\n  ".join(problems[:20]))
    feats.sort(key=lambda f: (f["properties"]["Name"], f["properties"]["ShowFrom"]))
    out = outdir / f"{T['id']}-v{T['version'].replace('.', '_')}.geojson"
    body = json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")).encode("utf-8"); out.write_bytes(body)
    rec = {"tool": f"Europe borders data builder {VERSION}", "when": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "sha1": hashlib.sha1(body).hexdigest(), "features": len(feats), "window": [lo, hi],
           "cshapes": {"url": SRC_URL, "sha1": sha, "licence": "CC BY-NC-SA 4.0"}}
    out.with_suffix(".built.json").write_text(json.dumps(rec, indent=1) + "\n", encoding="utf-8")
    print(f"Built {out.name}: {len(feats)} features, {len(body)/1e3:.0f} kB")


def changes(src, bb, drop, outdir, sha):
    """Land that changed hands. For each border that starts inside the window: the parts held by a different country
    the day before, or by the last different holder within lookBackDays where the source leaves a gap."""
    T, C = CFG["timeline"], CFG["changes"]; lo, hi = T["from"], T["to"]
    ea = pyproj.Transformer.from_crs(4326, 3035, always_xy=True)  # equal-area, for square kilometres
    km2 = lambda g: shapely.transform(g, lambda xy: __import__("numpy").column_stack(ea.transform(xy[:, 0], xy[:, 1]))).area / 1e6
    S = [(p, cut(p, g, bb).buffer(0)) for p, g in src if g.intersects(bb)]
    add = lambda d, n: (datetime.date.fromisoformat(d) + datetime.timedelta(days=n)).isoformat()
    feats = []
    for pn, gn in S:
        D = pn["start"]
        if not (lo < D <= hi) or pn["country_name"] in drop: continue
        back = add(D, -C["lookBackDays"])
        # most recent first; the country's own earlier land comes off first, so only land new to it is left
        before = [(p, g) for p, g in S if p["start"] < D and back <= p["end"]]
        own = [g for p, g in before if p["gwcode"] == pn["gwcode"]]
        left = gn.difference(shapely.union_all(own)) if own else gn
        others = sorted([(p, g) for p, g in before if p["gwcode"] != pn["gwcode"]], key=lambda f: f[0]["end"], reverse=True)
        for po, go in others:
            if left.is_empty: break
            x = polygons(left.intersection(go).buffer(0))
            if x is None: continue
            left = left.difference(go)
            a = km2(x)
            if a < C["minKm2"] or po["country_name"] in drop: continue
            m = mapping(x); prev = add(D, -1)
            feats.append({"type": "Feature", "geometry": {"type": m["type"], "coordinates": rnd(m["coordinates"])}, "properties": {
                "FromName": display_name(po["country_name"], int(max(po["start"], lo)[:4]), po["status"]), "ToName": display_name(pn["country_name"], int(D[:4]), pn["status"]),
                "ChangeDate": D, "AreaKm2": int(round(a, -2 if a >= 1000 else -1)), "ShowFrom": D, "ShowTo": min(add(D, C["showDays"] - 1), hi)}})
    feats.sort(key=lambda f: (f["properties"]["ChangeDate"], f["properties"]["ToName"], f["properties"]["FromName"]))
    if len(feats) != C["expectFeatures"]: sys.exit(f"Not built (changes): {len(feats)} features, expected {C['expectFeatures']}\n  " + "\n  ".join(
        f"{f['properties']['ChangeDate']} {f['properties']['FromName']} -> {f['properties']['ToName']} {f['properties']['AreaKm2']}" for f in feats))
    out = outdir / f"{C['id']}-v{C['version'].replace('.', '_')}.geojson"
    body = json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")).encode("utf-8"); out.write_bytes(body)
    rec = {"tool": f"Europe borders data builder {VERSION}", "when": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "sha1": hashlib.sha1(body).hexdigest(), "features": len(feats), "window": [lo, hi],
           "cshapes": {"url": SRC_URL, "sha1": sha, "licence": "CC BY-NC-SA 4.0"}}
    out.with_suffix(".built.json").write_text(json.dumps(rec, indent=1) + "\n", encoding="utf-8")
    print(f"Built {out.name}: {len(feats)} features, {len(body)/1e3:.0f} kB")


if __name__ == "__main__":
    main()
