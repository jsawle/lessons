# Map fixes v1.1: applies a fix list from the lessons repository (maps/fixes/<list>.json, built by maps/fixes/build.py)
# to ArcGIS Online. Paste this whole file into one ArcGIS Notebook cell.
#   1. In the organization the list is for, open a new notebook (signed in as the owner or an administrator).
#   2. Set FIX_LIST below, leave DRY_RUN = True, run the cell and read the report.
#   3. Set DRY_RUN = False and run it again. Every web map, item and feature it changes is saved first to
#      /arcgis/home/map-fixes-backup/..., and RESTORE_FROM (at the bottom) puts a backup back.
# A change is made only if the thing it changes is still exactly as it was when the list was built; anything edited
# since then is left alone and reported. Running it again after it has worked changes nothing.

FIX_LIST = "sandbox"        # "sandbox" (GIS-4-Schools) or "mapmaker" (the MapMaker organization)
DRY_RUN = True
RESTORE_FROM = ""           # a backup folder printed by an earlier run, to undo that run (leave empty otherwise)

SOURCE = "https://jsawle.github.io/lessons/maps/fixes/{}.json"
EXPECT = {"sandbox": "d835768181e0f3232039d1d3211afd2b716d3c19", "mapmaker": "e5fdfae40c189eb82a659ccee0af7ae0753c46c2"}  # fingerprints of the reviewed lists

import copy, datetime, hashlib, json, os, urllib.request


def fp(obj):
    return hashlib.sha1(json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


def find_layer(data, layer_id):
    def walk(ls):
        for l in ls or []:
            yield l
            yield from walk(l.get("layers"))
    found = [l for l in walk(data.get("operationalLayers")) if l.get("id") == layer_id]
    return found[0] if len(found) == 1 else None


def plan_webmap(data, fixes):
    """Apply the web map fixes, in order, to a copy of the map's data. Returns (new data, [(fix, status)])."""
    new, out = copy.deepcopy(data), []
    for f in fixes:
        if f["kind"] == "webmap-key":
            now = new.get(f["key"])
            if fp(now) == fp(f["set"]): out.append((f, "already done")); continue
            if fp(now) != f["before"]: out.append((f, "skipped: changed since the list was built")); continue
            new[f["key"]] = copy.deepcopy(f["set"]); out.append((f, "change")); continue
        lyr = find_layer(new, f["layerId"])
        if lyr is None or lyr.get("title") != f["layerTitle"]:
            out.append((f, "skipped: layer not found")); continue
        now = {k: lyr.get(k) for k in f["set"]}
        if fp(now) == fp(f["set"]):
            out.append((f, "already done")); continue
        if fp(now) != f["before"]:
            out.append((f, "skipped: changed since the list was built")); continue
        for k, v in f["set"].items():
            if v is None: lyr.pop(k, None)
            else: lyr[k] = copy.deepcopy(v)
        out.append((f, "change"))
    return new, out


# ---------------------------------------------------------------- signed-in part (ArcGIS Notebook)
if __name__ == "__main__" and "ARCGIS_NOTEBOOK_TEST" not in os.environ:
    from arcgis.gis import GIS
    from arcgis.features import FeatureLayer

    gis = GIS("home")
    me = gis.users.me
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    print(f"Map fixes 1.1 | signed in as {me.username} ({getattr(me, 'role', '')}) in {gis.properties.name} ({gis.properties.id})")

    if RESTORE_FROM:
        print("Restoring from", RESTORE_FROM)
        for name in sorted(os.listdir(RESTORE_FROM)):
            path = os.path.join(RESTORE_FROM, name)
            saved = json.load(open(path, encoding="utf-8"))
            if name.startswith("webmap-"):
                it = gis.content.get(saved["item"])
                ok = it.update(item_properties={"text": json.dumps(saved["data"])})
                print(" web map", it.title, "restored" if ok else "FAILED")
            elif name.startswith("item-"):
                it = gis.content.get(saved["item"])
                ok = it.update(item_properties=saved["fields"])
                print(" item", it.title, "restored" if ok else "FAILED")
            elif name.startswith("features-"):
                res = FeatureLayer(saved["url"], gis).edit_features(updates=[{"attributes": a} for a in saved["attributes"]])
                good = sum(1 for r in res.get("updateResults", []) if r.get("success"))
                print(" features", saved["url"].rsplit("/", 3)[-3], f"{good} of {len(saved['attributes'])} restored")
        raise SystemExit("Restore finished.")

    raw = urllib.request.urlopen(SOURCE.format(FIX_LIST), timeout=60).read()
    if hashlib.sha1(raw).hexdigest() != EXPECT[FIX_LIST]:
        raise SystemExit(f"The {FIX_LIST} list online is not the one reviewed (fingerprint differs). Nothing changed.")
    plan = json.loads(raw)
    if plan["org"] != gis.properties.id:
        raise SystemExit(f"This list is for the {plan['orgLabel']} organization ({plan['org']}); you are signed in to {gis.properties.id}. Nothing changed.")
    print(f"{plan['tool']}, list read from ArcGIS Online at {plan['read']}: {len(plan['fixes'])} changes | {'DRY RUN, nothing will change' if DRY_RUN else 'CHANGING'}\n")

    backup = f"/arcgis/home/map-fixes-backup/{FIX_LIST}-{stamp}"
    if not DRY_RUN: os.makedirs(backup, exist_ok=True)
    def save(name, obj):
        if not DRY_RUN:
            with open(os.path.join(backup, name), "w", encoding="utf-8") as fh: json.dump(obj, fh, ensure_ascii=False, indent=1)

    report = []
    # Web maps: all of one map's fixes in one update.
    by_map = {}
    for f in plan["fixes"]:
        if f["kind"] in ("webmap-layer", "webmap-key"): by_map.setdefault(f["webmap"], []).append(f)
    for wid, fixes in by_map.items():
        it = gis.content.get(wid)
        if it is None:
            report += [(f, "skipped: web map not found") for f in fixes]; continue
        data = it.get_data()
        new, out = plan_webmap(data, fixes)
        if any(s == "change" for _, s in out) and not DRY_RUN:
            save(f"webmap-{wid}.json", {"item": wid, "title": it.title, "data": data})
            ok = it.update(item_properties={"text": json.dumps(new, ensure_ascii=False)})
            if not (ok and fp(gis.content.get(wid).get_data()) == fp(new)):
                out = [(f, "FAILED: web map not updated" if s == "change" else s) for f, s in out]
        report += out

    # Items
    for f in [f for f in plan["fixes"] if f["kind"] == "item-fields"]:
        it = gis.content.get(f["item"])
        now = {k: it[k] for k in f["fields"]}
        if all(now[k] == v[1] for k, v in f["fields"].items()):
            report.append((f, "already done")); continue
        if any(now[k] != v[0] for k, v in f["fields"].items()):
            report.append((f, "skipped: changed since the list was built")); continue
        if DRY_RUN:
            report.append((f, "change")); continue
        save(f"item-{f['item']}.json", {"item": f["item"], "fields": now})
        ok = it.update(item_properties={k: v[1] for k, v in f["fields"].items()})
        report.append((f, "changed" if ok else "FAILED: item not updated"))

    # Features: all of one layer's fixes in one edit.
    by_layer = {}
    for f in plan["fixes"]:
        if f["kind"] == "feature-value": by_layer.setdefault(f["url"], []).append(f)
    for url, fixes in by_layer.items():
        fl = FeatureLayer(url, gis)
        oid = fixes[0]["objectIdField"]
        fields = sorted({f["field"] for f in fixes})
        ids = ",".join(str(f["objectId"]) for f in fixes)
        rows = {r.attributes[oid]: r.attributes for r in fl.query(where=f"{oid} IN ({ids})", out_fields=",".join([oid] + fields), return_geometry=False).features}
        edits, backed, out = {}, {}, []
        for f in fixes:
            a = rows.get(f["objectId"])
            if a is None: out.append((f, "skipped: feature not found")); continue
            if a[f["field"]] == f["to"]: out.append((f, "already done")); continue
            if a[f["field"]] != f["from"]: out.append((f, "skipped: changed since the list was built")); continue
            edits.setdefault(f["objectId"], {oid: f["objectId"]})[f["field"]] = f["to"]
            backed.setdefault(f["objectId"], {oid: f["objectId"]})[f["field"]] = f["from"]
            out.append((f, "change"))
        if edits and not DRY_RUN:
            save(f"features-{hashlib.sha1(url.encode()).hexdigest()[:10]}.json", {"url": url, "attributes": list(backed.values())})
            res = fl.edit_features(updates=[{"attributes": a} for a in edits.values()])
            ok_ids = {r.get("objectId") for r in res.get("updateResults", []) if r.get("success")}
            for r in res.get("updateResults", []):
                if not r.get("success"): print("  feature edit problem:", r)
            out = [(f, "FAILED: feature not updated" if (s == "change" and f["objectId"] not in ok_ids) else s) for f, s in out]
        report += out

    for f, s in report:
        s = s if (DRY_RUN or s != "change") else "changed"
        print(f"[{f['id']}] {s:45} {f['what']}")
    print("\nBackup folder:", backup if not DRY_RUN else "(none in a dry run)")
    if DRY_RUN: print("Dry run: nothing changed. Set DRY_RUN = False to make the changes marked 'change'.")
