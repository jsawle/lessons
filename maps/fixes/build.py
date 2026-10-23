#!/usr/bin/env python3
"""Builds the fix lists that maps/fix_maps.py applies: maps/fixes/sandbox.json (GIS-4-Schools) and
maps/fixes/mapmaker.json (the MapMaker organization). Reads the live web maps, layer items and features without
signing in, makes each change on a copy, and records a fingerprint of what it read, so the notebook changes a
thing only if it is still exactly as it was when this ran. Run from the repo root: python3 maps/fixes/build.py
Each fix's id matches maps/fixes.md.
"""
import copy, datetime, hashlib, json, sys, urllib.parse, urllib.request
from pathlib import Path

VERSION = "1.0"
OUT = Path(__file__).resolve().parent
PORTAL = "https://www.arcgis.com/sharing/rest"


def get(url, **p):
    p.setdefault("f", "json")
    s = urllib.parse.urlsplit(url)
    url = urllib.parse.urlunsplit(s._replace(path=urllib.parse.quote(urllib.parse.unquote(s.path), safe="/")))
    req = urllib.request.Request(url + ("&" if "?" in url else "?") + urllib.parse.urlencode(p), headers={"Referer": "https://www.arcgis.com/"})
    d = json.loads(urllib.request.urlopen(req, timeout=60).read())
    if isinstance(d, dict) and "error" in d:
        raise RuntimeError(f"{url}: {d['error']}")
    return d


def fp(obj):
    """Fingerprint of a JSON value: the same in this script and in the notebook."""
    return hashlib.sha1(json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


def all_layers(data):
    def walk(ls):
        for l in ls or []:
            yield l
            yield from walk(l.get("layers"))
    return list(walk(data.get("operationalLayers")))


def layer(data, title):
    found = [l for l in all_layers(data) if l.get("title") == title]
    assert len(found) == 1, f"{len(found)} layers titled {title}"
    return found[0]


def webmap_fix(fid, what, webmap_id, data, title, changes):
    """Set keys on one layer of a web map. `changes` maps key -> new value (None removes the key)."""
    lyr = layer(data, title)
    before = {k: lyr.get(k) for k in changes}
    return {"id": fid, "what": what, "kind": "webmap-layer", "webmap": webmap_id, "layerId": lyr["id"], "layerTitle": title,
            "before": fp(before), "set": changes}


def text_value(url, oid_field, oid, field):
    r = get(url + "/query", where=f"{oid_field}={oid}", outFields=f"{oid_field},{field}", returnGeometry="false")
    assert len(r["features"]) == 1
    return r["features"][0]["attributes"][field]


def feature_fix(fid, what, url, oid_field, oid, field, new=None, replace=None):
    old = text_value(url, oid_field, oid, field)
    if replace:
        new = old
        for a, b in replace:
            assert new.count(a) == 1, f"{a!r} occurs {new.count(a)} times in {field} {oid}"
            new = new.replace(a, b)
    assert new != old
    return {"id": fid, "what": what, "kind": "feature-value", "url": url, "objectIdField": oid_field, "objectId": oid,
            "field": field, "from": old, "to": new}


def build_sandbox():
    fixes = []
    # A5: War of 1812, the Spanish Cession pop-up, written from the treaty (Articles II, III and XI).
    w = "fad1cdb9d5704401a4e05c34f7ee693c"; d = get(f"{PORTAL}/content/items/{w}/data")
    p = copy.deepcopy(layer(d, "Land Spain gave up in 1819")["popupInfo"])
    text = ("<p>In the Adams–Onís Treaty of 1819, Spain gave East and West Florida to the United States, and the two countries "
            "agreed on a new border between their lands across North America. The United States did not pay Spain for the land. "
            "Instead it agreed to pay its own citizens' claims against Spain, up to $5 million.</p>")
    assert p["popupElements"][0]["text"] == "<p><span>{Notes}</span>&nbsp;</p>"
    p["popupElements"][0]["text"] = text; p["description"] = text
    fixes.append(webmap_fix("A5", "War of 1812: the Spanish Cession pop-up follows the treaty on the $5 million.", w, d, "Land Spain gave up in 1819", {"popupInfo": p}))

    # A6: War of 1812 battles: legend and pop-up name the sides without calling every opponent British.
    lyr = layer(d, "Battles of the War of 1812")
    ld = copy.deepcopy(lyr["layerDefinition"])
    labels = {"Side A Victory": "US victory", "Side B Victory": "Victory for British or Native forces", "Inconclusive": "Inconclusive"}
    for u in ld["drawingInfo"]["renderer"]["uniqueValueInfos"]:
        u["label"] = labels[u["value"]]
    item = get(f"{PORTAL}/content/items/{lyr['itemId']}/data")
    p = copy.deepcopy(item["layers"][0]["popupInfo"])
    t = p["popupElements"][0]["text"]
    assert t.count("<span>{Victor}</span>") == 1
    p["popupElements"][0]["text"] = t.replace("<span>{Victor}</span>", "<span>{expression/result}</span>")
    if p.get("description"): p["description"] = p["description"].replace("<span>{Victor}</span>", "<span>{expression/result}</span>")
    p.setdefault("expressionInfos", []).append({"name": "result", "title": "Result", "returnType": "string",
        "expression": "When($feature.Victor == 'Side A Victory', 'US victory', $feature.Victor == 'Side B Victory', "
                      "'Victory for British or Native forces', $feature.Victor == 'Inconclusive', 'Inconclusive', '')"})
    names = {"Casualties_Side_A": "US casualties", "Casualties_Side_B": "Casualties of British or Native forces"}
    have = {f["fieldName"] for f in p.get("fieldInfos", [])}
    for f in p.get("fieldInfos", []):
        if f["fieldName"] in names: f["label"] = names[f["fieldName"]]
    for k, v in names.items():
        if k not in have: p.setdefault("fieldInfos", []).append({"fieldName": k, "label": v, "visible": False})
    fixes.append(webmap_fix("A6", "War of 1812: legend and pop-up say 'US victory' and 'Victory for British or Native forces'.", w, d,
                            "Battles of the War of 1812", {"layerDefinition": ld, "popupInfo": p}))

    # A8: We the People: the layer item cites the Census Bureau's 1791 return instead of Wikipedia.
    iid = "43ae0255f8ed46d5973871603f5956dd"; it = get(f"{PORTAL}/content/items/{iid}")
    ret = "the Census Bureau's <i>Return of the Whole Number of Persons within the Several Districts of the United States</i> (1791)"
    old_d = it["description"]
    new_d = old_d.replace("The 1790 census figures are as tabulated in Wikipedia's article on the 1790 census, from the Census Bureau's <i>Heads of Families</i> volumes.",
                          f"The 1790 census figures are from {ret}.").replace("Version 1.0 (14 October 2026).", "Version 1.1 (23 October 2026).")
    assert new_d != old_d and "Wikipedia" not in new_d
    old_c = it["accessInformation"]
    new_c = old_c.replace("1790 census figures: Wikipedia (from Census Bureau volumes).", "1790 census figures: U.S. Census Bureau, Return of the Whole Number of Persons (1791).")
    assert new_c != old_c
    fixes.append({"id": "A8", "what": "We the People layer item: credits and description cite the Census Bureau's 1791 return.", "kind": "item-fields",
                  "item": iid, "fields": {"description": [old_d, new_d], "accessInformation": [old_c, new_c]}})
    url = "https://services4.arcgis.com/HNLEA4GfnbCFQZGa/arcgis/rest/services/MM_US_House_Seats_1793/FeatureServer/0"
    oid = get(url)["objectIdField"]
    r = get(url + "/query", where="1=1", outFields=f"{oid},Source", returnGeometry="false")
    for f in r["features"]:
        a = f["attributes"]
        fixes.append({"id": "A8", "what": "We the People: Source field cites the Census Bureau's 1791 return.", "kind": "feature-value", "url": url,
                      "objectIdField": oid, "objectId": a[oid], "field": "Source", "from": a["Source"],
                      "to": a["Source"].replace("https://en.wikipedia.org/wiki/1790_United_States_census", "https://www.census.gov/library/publications/1793/dec/number-of-persons.html")})
    return {"org": "HNLEA4GfnbCFQZGa", "orgLabel": "GIS-4-Schools sandbox", "fixes": fixes}


def build_mapmaker():
    fixes = []
    # Revolutionary Battles web map
    w = "bda07736a1b9425ea19fdde282088bd6"; d = get(f"{PORTAL}/content/items/{w}/data")
    # B3: the colonies give their name when clicked; their borders give nothing.
    fixes.append(webmap_fix("B3", "Revolutionary Battles: clicking a colony shows its name.", w, d, "Colony Area",
                            {"disablePopup": False, "popupInfo": {"title": "{Colony}", "popupElements": [], "showLastEditInfo": False,
                                                                  "fieldInfos": [{"fieldName": "Colony", "label": "Colony", "visible": False}]}}))
    fixes.append(webmap_fix("B3", "Revolutionary Battles: colony borders have no pop-up.", w, d, "Colony Boundary", {"disablePopup": True}))
    # B1 and C1: the battle pop-up states the result, and its picture has alt text.
    p = copy.deepcopy(layer(d, "Revolutionary War Battles")["popupInfo"])
    els = p["popupElements"]
    assert els[0]["type"] == "text" and "{Dates}" in els[0]["text"] and els[1]["type"] == "media"
    els[0]["text"] += "<p style='text-align:center;'><span style='font-size:18px;'>Result: {expression/result}</span></p>"
    p["expressionInfos"].append({"name": "result", "title": "Result", "returnType": "string",
        "expression": "When($feature.Victor == 'Side A Victory', 'American victory', $feature.Victor == 'Side B Victory', 'British victory', "
                      "$feature.Victor == 'Inconclusive', 'Inconclusive', '')"})
    for m in els[1]["mediaInfos"]:
        if m["type"] == "image": m["altText"] = "Picture for the battle of {Battle}"
    fixes.append(webmap_fix("B1", "Revolutionary Battles: the battle pop-up says who won, and its picture has alt text.", w, d,
                            "Revolutionary War Battles", {"popupInfo": p}))
    # A1 and A2: Turning Points data (a layer used only by this map).
    tp = "https://services7.arcgis.com/iFGeGXTAJXnjq0YN/arcgis/rest/services/Battle_Detailsv2_75_76/FeatureServer/0"
    fixes.append(feature_fix("A1", "Turning Points: Lexington and Concord was won by the colonists.", tp, "FID", 1, "Victor", new="American colonists"))
    fixes.append(feature_fix("A2", "Turning Points: spelling in the Bunker Hill text.", tp, "FID", 2, "Battle_details", replace=[("Amerian militia", "American militia")]))
    fixes.append(feature_fix("A2", "Turning Points: spelling in the Battle for New York text.", tp, "FID", 3, "Battle_details",
                             replace=[("outmanuevered Washinton's", "outmaneuvered Washington's")]))

    # Vicksburg web map
    w = "1ba8cd3fc75a49a497be1137fce4c032"; d = get(f"{PORTAL}/content/items/{w}/data")
    # B2 (Port Gibson twice) needs nothing: the layer item already hides feature 106 (and 125 and 268) with
    # OBJECTID NOT IN (106,125,268). A filter set in the map would replace that one.
    lyr = layer(d, "Key Places in the Union March to Vicksburg"); fc = copy.deepcopy(lyr["featureCollection"])
    done = 0
    for sub in fc["layers"]:
        for f in sub["featureSet"]["features"]:
            a, s = f["attributes"], f.get("symbol") or {}
            if a.get("title") == "Milikens Bend": a["title"] = "Milliken's Bend, Louisiana"; done += 1
            if a.get("title") == "Point": a["title"] = "Vicksburg, Mississippi"; done += 1
            if s.get("text") == "Miliken's Bend": s["text"] = "Milliken's Bend"; done += 1
    assert done == 3, done
    fixes.append(webmap_fix("C4", "Vicksburg: Milliken's Bend spelled as usual; the Vicksburg pin named.", w, d, "Key Places in the Union March to Vicksburg", {"featureCollection": fc}))

    # Civil War web map
    w = "7a06e8e2818941f99a3d40bb32e08118"; d = get(f"{PORTAL}/content/items/{w}/data")
    fixes.append(webmap_fix("B4", "Civil War: railroads have no pop-up (it listed raw fields).", w, d, "Railroads 1826 to 1863 (static)", {"disablePopup": True}))

    # US Slavery 1850 web map
    w = "819f60a5a3344d958d24f505849abaaa"; d = get(f"{PORTAL}/content/items/{w}/data")
    p = copy.deepcopy(layer(d, "US States and Territories 1850")["popupInfo"])
    assert [e["name"] for e in p["expressionInfos"]] == ["expr0"]
    p["expressionInfos"][0]["expression"] = "\n".join([
        "var free = $feature.FreeSlave12 == 1;",
        "var y = $feature.StateYear;",
        "var s = When(",
        "  $feature.Type == 'state', IIf(free, 'A free state: slavery was not allowed here.', 'A slave state: slavery was allowed here.'),",
        "  $feature.Type == 'territory', IIf(free, 'A territory where slavery was not allowed.', 'A territory where slavery was allowed.'),",
        "  IIf(free, 'Slavery was not allowed here.', 'Slavery was allowed here.'));",
        "return IIf(IsEmpty(y), s, s + ' Year given on the source map: ' + y + '.');"])
    old_t = p["popupElements"][0]["text"]
    new_t = old_t.replace("<p>It is recorded on the primary source as:</p><p>{Designation}", "<p>Category on the source map: {Designation}")
    assert new_t != old_t
    p["popupElements"][0]["text"] = new_t; p["description"] = new_t
    fixes.append(webmap_fix("A4", "US Slavery 1850: state pop-ups read correctly, with or without a year.", w, d, "US States and Territories 1850", {"popupInfo": p}))
    return {"org": "iFGeGXTAJXnjq0YN", "orgLabel": "MapMaker", "fixes": fixes}


if __name__ == "__main__":
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for name, fn in (("sandbox", build_sandbox), ("mapmaker", build_mapmaker)):
        out = {"tool": "Map fixes " + VERSION, "read": stamp, **fn()}
        (OUT / f"{name}.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
        print(name, len(out["fixes"]), "changes")
