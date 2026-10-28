#!/usr/bin/env python3
"""Data copy 1.0: copies a public source layer into your ArcGIS Online organization as a hosted feature layer.

Why: a published map should not depend on a service we do not control (it can move or change fields), and Map test
runs where the agency's server may be out of reach. The copy keeps the source credited, keeps only the fields the map
needs, and adds simple fields (years, an era) so the map can filter without date arithmetic.

Runs on your own computer. Needs no password for a dry run. With --go it uses a saved ArcGIS API for Python profile
(the same one Map publish uses). It never shares anything: the copy is private until you share it yourself.

  python maps/tools/copy_source.py maps/data/<id>.json                      dry run: reads the source, saves a
                                                                            GeoJSON file and a summary, changes nothing online
  python maps/tools/copy_source.py maps/data/<id>.json --profile NAME --go  creates the private copy in the spec's folder
  --from-file FILE   use a saved GeoJSON response instead of asking the source (for testing)

What it refuses: the wrong organization; an item that already carries this data spec's keyword; a copy whose
known-value checks (spec "checks") do not all pass.
"""
import argparse, datetime, json, re, sys, urllib.parse, urllib.request
from collections import Counter
from pathlib import Path

VERSION = "1.0"
ROOT = Path(__file__).resolve().parents[2]
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
EPOCH = datetime.datetime(1970, 1, 1, tzinfo=datetime.timezone.utc)


def fetch(source):
    """All features from an ArcGIS REST layer as GeoJSON in WGS 84, paged."""
    url, feats, offset = source["url"].rstrip("/") + "/query", [], 0
    while True:
        q = {"where": "1=1", "outFields": "*", "outSR": 4326, "f": "geojson", "resultOffset": offset, "resultRecordCount": 2000}
        q = {k: v for k, v in q.items() if v != ""}
        req = urllib.request.Request(url + "?" + urllib.parse.urlencode(q), headers={"User-Agent": "map-data-copy/" + VERSION})
        with urllib.request.urlopen(req, timeout=120) as r: page = json.load(r)
        if "error" in page: sys.exit("  The source returned an error: " + json.dumps(page["error"]))
        got = page.get("features", [])
        feats += got
        if len(got) == 0 or not (len(got) >= 2000 or page.get("exceededTransferLimit") or page.get("properties", {}).get("exceededTransferLimit")): break
        offset += len(got)
    return feats


def resolver(keys):
    def find(name, soft=False):
        exact = [k for k in keys if k == name]
        if exact: return exact[0]
        hit = [k for k in keys if k.lower().endswith("." + name.lower()) or k.lower() == name.lower()]
        if soft and not hit: return None
        if len(hit) != 1:
            sys.exit(f"  Field '{name}' matches {len(hit)} source fields {hit}. Source fields are: {sorted(keys)}")
        return hit[0]
    return find


def to_date(ms):
    if ms is None or isinstance(ms, str): return None
    return EPOCH + datetime.timedelta(milliseconds=ms)


def round_coords(c, nd=5):
    return round(c, nd) if isinstance(c, (int, float)) else [round_coords(x, nd) for x in c]


def transform(feats, spec):
    find = resolver(set().union(*[f["properties"].keys() for f in feats[:50]]))
    stats = Counter(); out = []
    dcfg, ecfg = spec["dates"], spec.get("era")
    dsrc = [find(n) for n in dcfg["from"]]
    for f in feats:
        p, props = f["properties"], {}
        for fd in spec["fields"]:
            v = p.get(find(fd["from"]))
            v = v.strip() if isinstance(v, str) else v
            if isinstance(v, str) and len(v) > fd.get("maxLength", 250):
                v = v[: fd.get("maxLength", 250) - 1] + "…"; stats["truncated:" + fd["name"]] += 1
            props[fd["name"]] = v if v not in ("", None) else None
        for lk in spec.get("links", []):
            props[lk["name"]] = next((p.get(k) for k in (find(s, True) for s in lk["firstOf"]) if k and p.get(k)), None)
        ds = [to_date(p.get(s)) for s in dsrc]; ds = sorted(d for d in ds if d)
        for d in ds:
            if (d.hour, d.minute, d.second) != (0, 0, 0): stats["date not at midnight UTC"] += 1
        props[dcfg["listField"]] = "; ".join(f"{MONTHS[d.month-1]} {d.day}, {d.year}" for d in ds) or None
        props[dcfg["isoField"]] = "; ".join(d.strftime("%Y-%m-%d") for d in ds) or None
        props[dcfg["firstYear"]] = ds[0].year if ds else None
        props[dcfg["lastYear"]] = ds[-1].year if ds else None
        if ecfg:
            y = props[dcfg["firstYear"]]
            props[ecfg["field"]] = next((b["name"] for b in ecfg["bands"] if y is not None and y <= b["max"]), "No date")
        g = f.get("geometry")
        if not g: stats["no geometry (dropped)"] += 1; continue
        out.append({"type": "Feature", "properties": props, "geometry": {"type": g["type"], "coordinates": round_coords(g["coordinates"])}})
    return out, stats


def run_checks(feats, checks):
    results = []
    for c in checks:
        ok = any(c["has"].lower() in ((f["properties"].get(c["in"]) or "").lower()) and c["date"] in (f["properties"].get("DatesISO") or "") for f in feats)
        results.append((c["name"], ok))
    return results


def main():
    ap = argparse.ArgumentParser(description="Data copy " + VERSION)
    ap.add_argument("spec"); ap.add_argument("--profile"); ap.add_argument("--go", action="store_true"); ap.add_argument("--from-file")
    args = ap.parse_args()
    spec = json.loads(Path(args.spec).read_text(encoding="utf-8"))
    print(f"Data copy {VERSION} | {spec['id']} {spec['version']} | source {spec['source']['url']}")

    raw = json.loads(Path(args.from_file).read_text(encoding="utf-8"))["features"] if args.from_file else fetch(spec["source"])
    print(f"  source returned {len(raw)} features")
    if not raw: sys.exit("  REFUSED: the source returned nothing.")
    feats, stats = transform(raw, spec)
    out_dir = ROOT / "maps" / "data" / "build" / spec["id"]; out_dir.mkdir(parents=True, exist_ok=True)
    gj = out_dir / (spec["id"] + ".geojson")
    gj.write_text(json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    ecfg = spec.get("era"); d = spec["dates"]
    summary = {"features": len(feats), "bytes": gj.stat().st_size,
               "firstYear": [min(f["properties"][d["firstYear"]] for f in feats if f["properties"][d["firstYear"]]),
                             max(f["properties"][d["firstYear"]] for f in feats if f["properties"][d["firstYear"]])],
               "noDate": sum(1 for f in feats if f["properties"][d["firstYear"]] is None),
               "era": dict(Counter(f["properties"][ecfg["field"]] for f in feats)) if ecfg else None,
               "distinctCessions": len({f["properties"].get("CessNum") for f in feats}),
               "emptyByField": {fd["name"]: sum(1 for f in feats if f["properties"][fd["name"]] is None) for fd in spec["fields"]},
               "notes": dict(stats), "sample": [f["properties"] for f in feats[:3]]}
    (out_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  kept {len(feats)} features, {gj.stat().st_size/1e6:.1f} MB GeoJSON, {summary['distinctCessions']} distinct cessions")
    print(f"  first year of each cession: {summary['firstYear'][0]} to {summary['firstYear'][1]}; {summary['noDate']} without a date")
    if ecfg: print("  eras:", summary["era"])
    print("  empty values per field:", {k: v for k, v in summary["emptyByField"].items() if v})
    for k, v in stats.items(): print(f"  note: {k} x{v}")
    print("  sample:", json.dumps(summary["sample"][0], ensure_ascii=False)[:600])
    results = run_checks(feats, spec.get("checks", []))
    for n, ok in results: print(f"  check {'PASS' if ok else 'FAIL'}: {n}")
    print(f"  saved {gj.relative_to(ROOT)} and summary.json")
    if not all(ok for _, ok in results): sys.exit("  REFUSED: a known-value check failed, so the dates or fields may be wrong. Nothing was created. Send this output back.")
    if not args.go:
        print("  dry run: nothing created online. Add --profile NAME --go to create the private copy."); return

    if not args.profile: sys.exit("  Choose a sign-in: --profile NAME")
    from arcgis.gis import GIS
    gis = GIS(profile=args.profile); me = gis.users.me; org = gis.properties.get("id"); pub = spec["publish"]
    print(f"  signed in as {me.username} ({getattr(me, 'role', '')}) in {gis.properties.get('name')} ({org})")
    if org != pub["org"]: sys.exit(f"  REFUSED: the spec is for {pub.get('orgLabel', '')} ({pub['org']}); you are signed in to {org}. Nothing changed.")
    kw = f"data:{spec['id']}"
    hits = [h for h in gis.content.search(query=f'owner:"{me.username}" AND typekeywords:"{kw}"', max_items=20) if kw in (h.typeKeywords or [])]
    if hits: sys.exit("  REFUSED: a copy already exists: " + ", ".join(f"{h.id} ({h.type})" for h in hits) + ". Nothing changed.")

    it = spec["item"]
    folders = gis.content.folders
    folder = folders.get(folder=pub["folder"]) or folders.create(folder=pub["folder"])
    src_item = folder.add(item_properties={"type": "GeoJson", "title": it["title"] + " (source file)", "tags": it["tags"] + [kw],
                                           "snippet": "GeoJSON the copy was made from"}, file=str(gj)).result()
    layer_item = src_item.publish(publish_parameters={"name": spec["id"].replace("-", "_") + "_v" + spec["version"].replace(".", "_")})
    layer_item.move(folder=pub["folder"])
    layer_item.update(item_properties={"title": it["title"], "snippet": it["snippet"], "description": it["description"], "tags": it["tags"],
                                       "accessInformation": it["credits"], "licenseInfo": it["license"],
                                       "typeKeywords": list(layer_item.typeKeywords or []) + [kw]})
    try:
        layer_item.layers[0].manager.update_definition({"capabilities": "Query"})
    except Exception as e:
        print("  note: could not set the layer to query-only:", e)
    n = layer_item.layers[0].query(return_count_only=True)
    log = {"tool": f"Data copy {VERSION}", "when": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "user": me.username, "org": org, "spec": spec["id"], "specVersion": spec["version"], "item": layer_item.id, "sourceFileItem": src_item.id,
           "url": f"https://www.arcgis.com/home/item.html?id={layer_item.id}", "layerUrl": layer_item.layers[0].url, "features": n,
           "expected": len(feats), "access": layer_item.access}
    print(f"  created: {log['url']} (access: {layer_item.access})")
    print(f"  layer URL: {log['layerUrl']}")
    print(f"  read back: {n} features", "- matches" if n == len(feats) else f"- DIFFERS from the {len(feats)} sent: check the item before using it")
    with open(out_dir / "copy-log.jsonl", "a", encoding="utf-8") as fh: fh.write(json.dumps(log, ensure_ascii=False) + "\n")
    if n != len(feats): sys.exit(1)


if __name__ == "__main__":
    main()
