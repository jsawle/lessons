#!/usr/bin/env python3
"""Data publish 1.0: puts a GeoJSON file built in this repository into ArcGIS Online as a hosted feature layer.

For data we assemble ourselves (a table of facts joined to outlines), where Data copy (copy_source.py) is for copying
someone else's layer. Same rules as Data copy and Map publish:
  - Without --go it only checks the file and reports what it would do (a dry run). No sign-in needed.
  - It refuses a file whose fingerprint differs from the one its builder recorded, a feature count other than the
    data spec's, or a failed known-value check.
  - It refuses the wrong organization, and a second copy of the same data version (versioned keyword).
  - It never shares: the layer is private until you share it yourself. It reads the layer back and counts features.

  python maps/tools/publish_data.py maps/data/<id>/data.json                      dry run
  python maps/tools/publish_data.py maps/data/<id>/data.json --profile NAME --go  create the private layer

The data spec (format "Data publish 1.0"):
  {"format", "id", "version", "file": "maps/data/build/<id>/<id>-v<version>.geojson", "expectFeatures": 24,
   "checks": [{"name", "where": {"Field": value}, "expect": {"Field": value}}],
   "item": {"title", "snippet", "description", "tags", "credits", "license"}, "publish": {"org", "orgLabel", "folder"}}
"""
import argparse, datetime, hashlib, json, sys
from pathlib import Path

VERSION = "1.0"
ROOT = Path(__file__).resolve().parents[2]


def main():
    ap = argparse.ArgumentParser(description="Data publish " + VERSION)
    ap.add_argument("spec"); ap.add_argument("--profile"); ap.add_argument("--go", action="store_true")
    args = ap.parse_args()
    spec = json.loads(Path(args.spec).read_text(encoding="utf-8"))
    gj = ROOT / spec["file"]
    print(f"Data publish {VERSION} | {spec['id']} {spec['version']} | {spec['file']}")
    if not gj.exists(): sys.exit("  REFUSED: the file isn't there. Run its builder first.")
    raw = gj.read_bytes(); feats = json.loads(raw)["features"]
    built = gj.with_suffix(".built.json")
    if not built.exists(): sys.exit("  REFUSED: no build record next to the file (" + built.name + ").")
    rec = json.loads(built.read_text(encoding="utf-8"))
    if rec.get("sha1") != hashlib.sha1(raw).hexdigest(): sys.exit("  REFUSED: the file changed after it was built. Build it again.")
    print(f"  built by {rec.get('tool')} on {rec.get('when')}; {len(feats)} features")
    problems = []
    if spec.get("expectFeatures") is not None and len(feats) != spec["expectFeatures"]:
        problems.append(f"{len(feats)} features, the spec expects {spec['expectFeatures']}")
    for c in spec.get("checks", []):
        hit = [f for f in feats if all(f["properties"].get(k) == v for k, v in c["where"].items())]
        ok = len(hit) == 1 and all(hit[0]["properties"].get(k) == v for k, v in c["expect"].items())
        print(f"  check {'PASS' if ok else 'FAIL'}: {c['name']}")
        if not ok: problems.append("check failed: " + c["name"])
    for p in problems: print("  REFUSED:", p)
    if problems: sys.exit(1)
    if not args.go:
        print("  dry run: nothing created online. Add --profile NAME --go to create the private layer."); return

    if not args.profile: sys.exit("  Choose a sign-in: --profile NAME")
    from arcgis.gis import GIS
    gis = GIS(profile=args.profile); me = gis.users.me; org = gis.properties.get("id"); pub = spec["publish"]
    print(f"  signed in as {me.username} ({getattr(me, 'role', '')}) in {gis.properties.get('name')} ({org})")
    if org != pub["org"]: sys.exit(f"  REFUSED: the spec is for {pub.get('orgLabel', '')} ({pub['org']}); you are signed in to {org}. Nothing changed.")
    kw = f"data:{spec['id']}@{spec['version']}"
    hits = [h for h in gis.content.search(query=f'owner:"{me.username}" AND typekeywords:"{kw}"', max_items=20) if kw in (h.typeKeywords or [])]
    if hits: sys.exit("  REFUSED: this data version already exists: " + ", ".join(f"{h.id} ({h.type})" for h in hits) + ". Nothing changed.")
    it = spec["item"]
    folders = gis.content.folders
    folder = folders.get(folder=pub["folder"]) or folders.create(folder=pub["folder"])
    src_item = folder.add(item_properties={"type": "GeoJson", "title": it["title"] + " (source file)", "tags": it["tags"] + [kw],
                                           "snippet": "GeoJSON the layer was made from"}, file=str(gj)).result()
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
    log = {"tool": f"Data publish {VERSION}", "when": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "user": me.username, "org": org, "spec": spec["id"], "specVersion": spec["version"], "item": layer_item.id, "sourceFileItem": src_item.id,
           "url": f"https://www.arcgis.com/home/item.html?id={layer_item.id}", "layerUrl": layer_item.layers[0].url, "features": n,
           "expected": len(feats), "access": layer_item.access}
    print(f"  created: {log['url']} (access: {layer_item.access})")
    print(f"  layer URL: {log['layerUrl']}")
    print(f"  read back: {n} features", "- matches" if n == len(feats) else f"- DIFFERS from the {len(feats)} sent: check the item before using it")
    with open(gj.parent / "publish-log.jsonl", "a", encoding="utf-8") as fh: fh.write(json.dumps(log, ensure_ascii=False) + "\n")
    if n != len(feats): sys.exit(1)


if __name__ == "__main__":
    main()
