#!/usr/bin/env python3
"""Map publish 1.0: puts a built, tested web map (maps/build/<id>/) into ArcGIS Online, signed in as you.

Runs on your own computer with the ArcGIS API for Python (pip install arcgis). It never asks for or takes a password:
it uses a sign-in you set up yourself, one of
  --profile NAME   a saved ArcGIS API for Python profile (password kept in Keychain / Credential Manager), made once with
                   python -c "from arcgis.gis import GIS; GIS('https://www.arcgis.com', 'YOUR_USERNAME', profile='NAME')"
  --pro            the account signed in to ArcGIS Pro on this machine (Windows; Pro usually has to be running)

What it does, and won't do:
  - Without --go it only reports what it would do (a dry run).
  - It refuses a build whose files changed after building, or that hasn't passed Map test.
  - It refuses to run if you're signed in to a different organization from the one the spec names.
  - It creates the web map in the spec's folder, or (with --update) replaces the one it made before, after saving a
    backup of that item's data and details in maps/build/<id>/backup/.
  - It never shares: the item stays private until you share it yourself.
  - After writing, it reads the item back and checks it matches the build.

Usage, from the repo root:
  python maps/tools/publish_map.py maps/build/<id> --profile NAME [--title-suffix " (pilot)"] [--update] [--go]
"""
import argparse, datetime, hashlib, json, sys
from pathlib import Path

VERSION = "1.0"
ROOT = Path(__file__).resolve().parents[2]


def fp(obj):
    return hashlib.sha1(json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


def load_build(build_dir):
    b = Path(build_dir).resolve()
    report = json.loads((b / "report.json").read_text(encoding="utf-8"))
    wm_bytes, it_bytes = (b / "webmap.json").read_bytes(), (b / "item.json").read_bytes()
    problems = []
    if hashlib.sha1(wm_bytes).hexdigest() != report["webmapFingerprint"]: problems.append("webmap.json changed after it was built")
    if hashlib.sha1(it_bytes).hexdigest() != report["itemFingerprint"]: problems.append("item.json changed after it was built")
    t = report.get("tested") or {}
    if not t.get("pass"): problems.append("the build hasn't passed Map test")
    elif t.get("webmapFingerprint") != report["webmapFingerprint"]: problems.append("Map test ran on a different build")
    spec = json.loads((ROOT / report["spec"]).read_text(encoding="utf-8"))
    return b, report, json.loads(wm_bytes), json.loads(it_bytes), spec, problems


def sign_in(args):
    from arcgis.gis import GIS
    if args.pro: return GIS("pro")
    if args.profile: return GIS(profile=args.profile)
    sys.exit("Choose a sign-in: --profile NAME or --pro (see the top of this file).")


def find_existing(gis, spec_id):
    me = gis.users.me
    hits = gis.content.search(query=f'owner:"{me.username}" AND type:"Web Map" AND typekeywords:"spec:{spec_id}"', max_items=20)
    return [h for h in hits if f"spec:{spec_id}" in (h.typeKeywords or [])]


def create(gis, props, thumbnail, folder):
    """Create the web map item with the folder API of the ArcGIS API for Python 2.3 and later."""
    folders = gis.content.folders
    f = folders.get(folder=folder) or folders.create(folder=folder)
    p = dict(props)
    if thumbnail: p["thumbnail"] = thumbnail  # Folder.add takes the thumbnail as a file path in the item properties
    return f.add(item_properties=p, text=p.pop("text")).result()


def main():
    ap = argparse.ArgumentParser(description="Map publish " + VERSION)
    ap.add_argument("build"); ap.add_argument("--profile"); ap.add_argument("--pro", action="store_true")
    ap.add_argument("--title-suffix", default=""); ap.add_argument("--update", action="store_true"); ap.add_argument("--go", action="store_true")
    args = ap.parse_args()

    b, report, webmap, item, spec, problems = load_build(args.build)
    pub = spec.get("publish") or {}
    print(f"Map publish {VERSION} | {report['specId']} spec {report['specVersion']} | build {report['webmapFingerprint'][:12]} | "
          f"tested {report['tested']['when'] if report.get('tested') else 'no'}")
    for p in problems: print("  REFUSED:", p)
    if problems: sys.exit(1)
    if not pub.get("org") or not pub.get("folder"): sys.exit("  REFUSED: the spec has no publish.org and publish.folder")

    import arcgis
    major_minor = tuple(int(x) for x in arcgis.__version__.split(".")[:2])
    if major_minor < (2, 3): sys.exit(f"  REFUSED: needs the ArcGIS API for Python 2.3 or later (this is {arcgis.__version__})")
    gis = sign_in(args)
    me = gis.users.me
    org = gis.properties.get("id")
    print(f"  ArcGIS API for Python {arcgis.__version__}")
    print(f"  signed in as {me.username} ({getattr(me, 'role', '')}) in {gis.properties.get('name')} ({org})")
    if org != pub["org"]:
        sys.exit(f"  REFUSED: the spec is for {pub.get('orgLabel', '')} ({pub['org']}); you are signed in to {org}. Nothing changed.")

    props = dict(item)
    props["title"] = item["title"] + args.title_suffix
    props["text"] = json.dumps(webmap, ensure_ascii=False)
    thumb = ROOT / pub["thumbnail"] if pub.get("thumbnail") else None
    if thumb and not thumb.exists(): print("  note: thumbnail file not found, the default will show:", thumb); thumb = None

    existing = find_existing(gis, report["specId"])
    if args.update and len(existing) > 1:
        sys.exit("  REFUSED: more than one item carries this spec's keyword; delete or retag the extra ones first: " + ", ".join(e.id for e in existing))
    target = existing[0] if (args.update and existing) else None
    action = f"replace item {target.id} ({target.title})" if target else f"create a new web map in folder '{pub['folder']}'"
    print(f"  would {action}: '{props['title']}', {len(webmap['operationalLayers'])} layers, not shared")
    if existing and not args.update:
        print(f"  note: {len(existing)} item(s) from this spec already exist ({', '.join(e.id for e in existing)}); --update replaces the first")
    if not args.go:
        print("  dry run: nothing changed. Add --go to do it."); return

    log = {"tool": f"Map publish {VERSION}", "when": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "user": me.username, "org": org, "build": report["webmapFingerprint"], "action": action}
    if target:
        bdir = b / "backup"; bdir.mkdir(exist_ok=True)
        stamp = log["when"].replace(":", "")
        (bdir / f"{target.id}-{stamp}.json").write_text(json.dumps({"item": target.id, "properties": {k: target[k] for k in
            ("title", "snippet", "description", "tags", "accessInformation", "licenseInfo", "typeKeywords", "extent")}, "data": target.get_data()},
            ensure_ascii=False, indent=1), encoding="utf-8")
        upd = {k: v for k, v in props.items() if k != "type"}
        ok = target.update(item_properties=upd, thumbnail=str(thumb) if thumb else None)
        if not ok: sys.exit("  FAILED: the item wasn't updated (the backup is in maps/build/<id>/backup/)")
        new = gis.content.get(target.id)
    else:
        new = create(gis, props, str(thumb) if thumb else None, pub["folder"])
    back = new.get_data()
    same = fp(back) == fp(webmap)
    log.update({"item": new.id, "url": f"https://www.arcgis.com/home/item.html?id={new.id}", "readBackMatches": same, "access": new.access})
    print(f"  {'updated' if target else 'created'}: {log['url']} (access: {new.access})")
    print("  read back:", "matches the build" if same else "DIFFERS from the build - check the item before sharing it")
    with open(b / "publish-log.jsonl", "a", encoding="utf-8") as fh: fh.write(json.dumps(log, ensure_ascii=False) + "\n")
    if not same: sys.exit(1)


if __name__ == "__main__":
    main()
