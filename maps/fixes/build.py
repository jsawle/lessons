#!/usr/bin/env python3
"""Builds the fix lists that maps/fix_maps.py applies: maps/fixes/sandbox.json (GIS-4-Schools) and
maps/fixes/mapmaker.json (the MapMaker organization). Reads the live web maps, layer items and features without
signing in, makes each change on a copy, and records a fingerprint of what it read, so the notebook changes a
thing only if it is still exactly as it was when this ran. Fixes to the same web map are built in order, each on the
result of the ones before, as the notebook applies them.
Run from the repo root: python3 maps/fixes/build.py [sandbox] [mapmaker]   (no argument: both lists)
Each fix's id matches maps/fixes.md.
"""
import copy, datetime, hashlib, json, sys, urllib.parse, urllib.request
from pathlib import Path

VERSION = "1.1"
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
    for k, v in changes.items():
        if v is None: lyr.pop(k, None)
        else: lyr[k] = copy.deepcopy(v)
    return {"id": fid, "what": what, "kind": "webmap-layer", "webmap": webmap_id, "layerId": lyr["id"], "layerTitle": title,
            "before": fp(before), "set": changes}


def webmap_key_fix(fid, what, webmap_id, data, key, value):
    """Set a top-level key of a web map's data (for example its bookmarks)."""
    before = data.get(key)
    data[key] = copy.deepcopy(value)
    return {"id": fid, "what": what, "kind": "webmap-key", "webmap": webmap_id, "key": key, "before": fp(before), "set": value}


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
    # The legend reads its labels from uniqueValueGroups when the renderer has them (this one does).
    for g in ld["drawingInfo"]["renderer"].get("uniqueValueGroups", []):
        for c in g["classes"]:
            assert len(c["values"]) == 1 and len(c["values"][0]) == 1
            c["label"] = labels[c["values"][0][0]]
    # C7: the casualty size legend ran from "< 0" to "> 2,628"; it now runs from "< 10" to "> 2,500".
    vv = ld["drawingInfo"]["renderer"]["visualVariables"][0]
    assert vv["type"] == "sizeInfo" and vv["field"] == "Total_Casualties" and vv["minDataValue"] == 0 and vv["maxDataValue"] == 2628
    vv["minDataValue"], vv["maxDataValue"] = 10, 2500
    item = get(f"{PORTAL}/content/items/{lyr['itemId']}/data")
    p = copy.deepcopy(item["layers"][0]["popupInfo"])
    t = p["popupElements"][0]["text"]
    assert t.count("<span>{Victor}</span>") == 1
    p["popupElements"][0]["text"] = t.replace("<span>{Victor}</span>", "<span>{expression/result}</span>")
    if p.get("description"): p["description"] = p["description"].replace("<span>{Victor}</span>", "<span>{expression/result}</span>")
    # B14: the pop-up says where the battle was (the lesson page asks for the state; the layer has it).
    dates = "<p style='text-align:center;'><span style='font-size:14px;'><span>{Dates}</span>&nbsp;</span></p>"
    where = "<p style='text-align:center;'><span style='font-size:14px;'>Where: {State} (today's name)</span></p>"
    for k in ("text",):
        assert p["popupElements"][0][k].count(dates) == 1
        p["popupElements"][0][k] = p["popupElements"][0][k].replace(dates, dates + where)
    if p.get("description") and p["description"].count(dates) == 1: p["description"] = p["description"].replace(dates, dates + where)
    p.setdefault("expressionInfos", []).append({"name": "result", "title": "Result", "returnType": "string",
        "expression": "When($feature.Victor == 'Side A Victory', 'US victory', $feature.Victor == 'Side B Victory', "
                      "'Victory for British or Native forces', $feature.Victor == 'Inconclusive', 'Inconclusive', '')"})
    names = {"Casualties_Side_A": "US casualties", "Casualties_Side_B": "Casualties of British or Native forces"}
    have = {f["fieldName"] for f in p.get("fieldInfos", [])}
    for f in p.get("fieldInfos", []):
        if f["fieldName"] in names: f["label"] = names[f["fieldName"]]
    for k, v in names.items():
        if k not in have: p.setdefault("fieldInfos", []).append({"fieldName": k, "label": v, "visible": False})
    fixes.append(webmap_fix("A6+B14+C7", "War of 1812: legend and pop-up say 'US victory' and 'Victory for British or Native forces'; the pop-up says where; casualty sizes from '< 10'.", w, d,
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
    # War of 1812, continued (same web map data d, after A5 and A6).
    # A10: the recognition date is shown as a date in UTC, as stored. Shown in the browser's time zone, it read
    # "12/11/1822, 6:09 PM" in US Central time for 12 December 1822.
    lyr = layer(d, "Latin American independence and US recognition")
    p = copy.deepcopy(lyr["popupInfo"])
    t = p["popupElements"][0]["text"]
    assert t.count("{USRecognized}") == 1 and not p.get("expressionInfos")
    p["popupElements"][0]["text"] = t.replace("{USRecognized}", "{expression/recognized}")
    p["expressionInfos"] = [{"name": "recognized", "title": "Recognized by the United States", "returnType": "string",
                             "expression": "Text(ChangeTimeZone($feature.USRecognized, 'UTC'), 'MMMM D, Y')"}]
    fixes.append(webmap_fix("A10", "War of 1812: recognition dates read as dates (December 12, 1822), the same in every time zone.", w, d,
                            "Latin American independence and US recognition", {"popupInfo": p}))
    # B11: the labels sit under their symbols instead of above and to the right, where they landed on the next one.
    ld = copy.deepcopy(lyr["layerDefinition"])
    li = ld["drawingInfo"]["labelingInfo"]
    assert len(li) == 1 and li[0]["labelPlacement"] == "esriServerPointLabelPlacementAboveRight"
    li[0]["labelPlacement"] = "esriServerPointLabelPlacementBelowCenter"
    li[0]["deconflictionStrategy"] = "none"
    fixes.append(webmap_fix("B11", "War of 1812: Latin American labels sit under their own symbols.", w, d,
                            "Latin American independence and US recognition", {"layerDefinition": ld}))
    # B10: The 1819 boundary bookmark takes in Florida and the Sabine, with room on the right for the legend.
    bm = copy.deepcopy(d["bookmarks"])
    b = [x for x in bm if x["name"] == "The 1819 boundary"]
    assert len(b) == 1 and round(b[0]["extent"]["xmax"]) == -9350837
    b[0]["extent"].update({"xmin": -14150000.0, "ymin": 2000000.0, "xmax": -6550000.0, "ymax": 7000000.0})
    fixes.append(webmap_key_fix("B10", "War of 1812: The 1819 boundary bookmark shows Florida and the whole treaty line.", w, d, "bookmarks", bm))

    # We the People web map
    w = "eba1ea7488624f3c88ef094167ed03ca"; d = get(f"{PORTAL}/content/items/{w}/data")
    # B5: the percentage enslaved to one decimal place ("39.1%", not "39.099998474121094%").
    for title in ("Population in 1790: free and enslaved", "House seats in 1793"):
        p = copy.deepcopy(layer(d, title)["popupInfo"])
        assert "({PctEnslaved}%)" in p["popupElements"][0]["text"]
        assert not any(f["fieldName"] == "PctEnslaved" for f in p["fieldInfos"])
        p["fieldInfos"].append({"fieldName": "PctEnslaved", "label": "Percent enslaved", "visible": False, "format": {"places": 1, "digitSeparator": True}})
        fixes.append(webmap_fix("B5", f"We the People ({title}): percentage enslaved to one decimal place.", w, d, title, {"popupInfo": p}))
    # C8: legend headings in words (they were the field names Total1790, HouseSeats and Total).
    ld = copy.deepcopy(layer(d, "Population in 1790: free and enslaved")["layerDefinition"])
    vv = ld["drawingInfo"]["renderer"]["visualVariables"][0]; assert vv["field"] == "Total1790"
    vv["legendOptions"] = {"title": "People in 1790"}
    fixes.append(webmap_fix("C8", "We the People: population legend headed 'People in 1790'.", w, d, "Population in 1790: free and enslaved", {"layerDefinition": ld}))
    # B7 and C8: every state's House seats label draws (NH, RI and DE were dropped where labels crowd), legend in words.
    ld = copy.deepcopy(layer(d, "House seats in 1793")["layerDefinition"])
    r = ld["drawingInfo"]["renderer"]; assert r["type"] == "classBreaks" and r["field"] == "HouseSeats"
    r["legendOptions"] = {"title": "Seats in the House"}
    li = ld["drawingInfo"]["labelingInfo"]; assert len(li) == 1 and "deconflictionStrategy" not in li[0]
    li[0]["deconflictionStrategy"] = "none"
    fixes.append(webmap_fix("B7+C8", "We the People: every state's House seats label shows; legend headed 'Seats in the House'.", w, d, "House seats in 1793", {"layerDefinition": ld}))
    # A10: ratification dates in UTC, as stored ("December 7, 1787"; in US time zones it read "12/6/1787, 6:09 PM").
    rt = "Ratifying the Constitution, 1787–1791"
    p = copy.deepcopy(layer(d, rt)["popupInfo"])
    t = p["popupElements"][0]["text"]
    assert t.count("{VoteDate}") == 1 and not p.get("expressionInfos")
    p["popupElements"][0]["text"] = t.replace("{VoteDate}", "{expression/votedate}")
    p["expressionInfos"] = [{"name": "votedate", "title": "Date of the vote", "returnType": "string",
                             "expression": "Text(ChangeTimeZone($feature.VoteDate, 'UTC'), 'MMMM D, Y')"}]
    fixes.append(webmap_fix("A10", "We the People: ratification dates read as dates (November 21, 1789), the same in every time zone.", w, d, rt, {"popupInfo": p}))
    # B6 and C8: ratification labels under their own pies (above-right put them on the next pie); legend in words.
    ld = copy.deepcopy(layer(d, rt)["layerDefinition"])
    li = ld["drawingInfo"]["labelingInfo"]; assert len(li) == 1 and li[0]["labelPlacement"] == "esriServerPointLabelPlacementAboveRight"
    li[0]["labelPlacement"] = "esriServerPointLabelPlacementBelowCenter"
    vv = ld["drawingInfo"]["renderer"]["visualVariables"][0]; assert vv["field"] == "Total"
    vv["legendOptions"] = {"title": "Delegates voting"}
    fixes.append(webmap_fix("B6+C8", "We the People: ratification labels under their own pies; legend headed 'Delegates voting'.", w, d, rt, {"layerDefinition": ld}))
    # A9: North Carolina's first convention (Hillsborough, 1788) voted 184 to 84 to neither ratify nor reject.
    url = "https://services4.arcgis.com/HNLEA4GfnbCFQZGa/arcgis/rest/services/MM_US_Ratification_1787_1791/FeatureServer/0"
    fixes.append(feature_fix("A9", "Ratification: North Carolina's note gives the Hillsborough vote as 184 to 84, to neither ratify nor reject.", url, "ObjectId", 12, "Note",
                             replace=[("voted 184 to 83 against ratifying.", "voted 184 to 84 to neither ratify nor reject the Constitution.")]))
    fixes.append(feature_fix("A9", "Ratification: the Hillsborough pie's note says what the vote was on.", url, "ObjectId", 15, "Note",
                             new="This first convention voted 184 to 84 to neither ratify nor reject the Constitution, and asked for a bill of rights "
                                 "and amendments; a second convention at Fayetteville ratified in November 1789."))
    fixes.append(feature_fix("A9", "Ratification: Hillsborough pie, 84 delegates against the motion.", url, "ObjectId", 15, "Yes", new=84))
    fixes.append(feature_fix("A9", "Ratification: Hillsborough pie, 268 delegates in all.", url, "ObjectId", 15, "Total", new=268))
    fixes.append(feature_fix("A9", "Ratification: Hillsborough vote text.", url, "ObjectId", 15, "Vote", new="84–184"))

    # Presidential Elections web map
    w = "6173219d9cd84812bcd4fed859b2c182"; d = get(f"{PORTAL}/content/items/{w}/data")
    # B8: the Supreme Court squares draw only when zoomed in past 1:6,000,000, so they no longer cover Maryland's pie
    # in the sixteen-states view. Question 4 then starts "Zoom in on Washington, D.C., until two pink squares appear."
    ct = "Landmark Supreme Court cases, 1803 and 1819"
    ld = copy.deepcopy(layer(d, ct)["layerDefinition"])
    assert ld.get("minScale") in (None, 0) and layer(d, ct).get("minScale") in (None, 0)
    ld["minScale"] = 6000000  # a feature layer's visible range lives in its layerDefinition
    fixes.append(webmap_fix("B8", "Presidential: Supreme Court squares show only when zoomed in near Washington.", w, d, ct, {"layerDefinition": ld}))
    # B9: the pop-up says which year, puts the two pie numbers first, and says "1 vote".
    for year in ("1796", "1800"):
        title = f"Election of {year}: electors' votes"
        p = copy.deepcopy(layer(d, title)["popupInfo"])
        assert p["title"] == "{State}: {Electors} electors" and not p.get("expressionInfos")
        t = p["popupElements"][0]["text"]
        old_open = (f"<p>Electors' votes in {year}: {{Votes{year}}}.</p><p>Each elector cast two votes for president, so the votes add up to twice "
                    f"the number of electors. In the pie: John Adams (Federalist), {{Adams{year}}} votes; Thomas Jefferson (Democratic-Republican), "
                    f"{{Jefferson{year}}} votes.</p>")
        assert t.count(old_open) == 1
        t = t.replace(old_open, f"<p>In the pie: John Adams (Federalist), {{expression/adams}}; Thomas Jefferson (Democratic-Republican), {{expression/jefferson}}.</p>"
                                f"<p>All electors' votes in {year}: {{Votes{year}}}. Each elector cast two votes for president, so the votes add up to twice the number of electors.</p>")
        p["popupElements"][0]["text"] = t
        p["title"] = f"{{State}} in {year}: {{Electors}} electors"
        p["expressionInfos"] = [{"name": n, "title": f"{n.capitalize()} votes", "returnType": "string",
                                 "expression": f"var v = $feature.{n.capitalize()}{year};\nreturn v + IIf(v == 1, ' vote', ' votes');"} for n in ("adams", "jefferson")]
        fixes.append(webmap_fix("B9", f"Presidential ({year}): pop-up title gives the year; pie numbers first; '1 vote'.", w, d, title, {"popupInfo": p}))

    # Rights web map
    w = "59467ac7d7c64542acaa6a3e9c19ebf4"; d = get(f"{PORTAL}/content/items/{w}/data")
    # B12: the district pop-up gives the number of districts in the state (Q1 asked students to count outlines that
    # look the same as state lines), names at-large seats and delegates, and says which Congress.
    dt = "Congressional districts (119th Congress)"; lyr = layer(d, dt)
    assert "popupInfo" not in lyr
    item = get(f"{PORTAL}/content/items/{lyr['itemId']}/data")
    p = copy.deepcopy(item["layers"][0]["popupInfo"])
    assert "{STATE_NAME} Congressional District {CDFIPS}" in p["popupElements"][0]["text"]
    big = "<p style='text-align:center;'><span style='font-size:18px;'>{}</span></p>"
    text = big.format("{expression/who}") + big.format("{expression/district}") + "<p style='text-align:center;'>{expression/count}</p>"
    p["popupElements"][0]["text"] = text; p["description"] = text
    p["expressionInfos"] = [
        {"name": "who", "title": "Representative", "returnType": "string", "expression":
            "IIf($feature.PARTY == 'Vacant' || IsEmpty($feature.NAME), 'This seat was vacant when the layer was last updated:', "
            "$feature.NAME + ' (' + $feature.PARTY + ') represents')"},
        {"name": "district", "title": "District", "returnType": "string", "expression":
            "var cd = $feature.CDFIPS;\nreturn When(cd == '00', $feature.STATE_NAME + ', the whole state (one at-large seat)', "
            "cd == '98', $feature.STATE_NAME + ', as a delegate who cannot vote on final passage of bills', "
            "$feature.STATE_NAME + ' Congressional District ' + Number(cd));"},
        {"name": "count", "title": "Districts in the state", "returnType": "string", "expression":
            "var st = $feature.STATE_ABBR;\nvar n = Count(Filter(FeatureSetById($map, '" + lyr["id"] + "', ['STATE_ABBR'], false), 'STATE_ABBR = @st'));\n"
            "return When($feature.CDFIPS == '98', '119th Congress, 2025 to 2027.', n == 1, $feature.STATE_NAME + ' has one seat in the House (119th Congress, 2025 to 2027).', "
            "$feature.STATE_NAME + ' has ' + n + ' districts (119th Congress, 2025 to 2027).');"}]
    fixes.append(webmap_fix("B12", "Rights: the district pop-up gives the state's number of districts, at-large seats and the Congress.", w, d, dt, {"popupInfo": p}))

    # Louisiana Purchase web map
    w = "f8af7269e5c14e69b060d6184d04ff85"; d = get(f"{PORTAL}/content/items/{w}/data")
    # B13: a wider purple trail and small campsite dots, so the trail shows between them (both layers drew from
    # their services: a 1 px line under large red spheres).
    tl, cl = "Lewis and Clark National Historic Trail", "Lewis and Clark campsites (approximate)"
    assert "layerDefinition" not in layer(d, tl) and "layerDefinition" not in layer(d, cl)
    fixes.append(webmap_fix("B13", "Louisiana Purchase: Lewis and Clark trail drawn 3 pt wide.", w, d, tl, {"layerDefinition": {"drawingInfo": {"renderer": {
        "type": "simple", "label": "Lewis and Clark National Historic Trail",
        "symbol": {"type": "esriSLS", "style": "esriSLSSolid", "color": [128, 50, 160, 255], "width": 3}}}}}))
    fixes.append(webmap_fix("B13", "Louisiana Purchase: campsites drawn as small orange dots.", w, d, cl, {"layerDefinition": {"drawingInfo": {"renderer": {
        "type": "simple", "label": "Campsite",
        "symbol": {"type": "esriSMS", "style": "esriSMSCircle", "color": [230, 85, 13, 255], "size": 4.5,
                   "outline": {"type": "esriSLS", "style": "esriSLSSolid", "color": [255, 255, 255, 255], "width": 0.5}}}}}}))
    # C9: the Biomes pop-up shows the biome, realm and ecoregion, without the conservation fields.
    lyr = layer(d, "Biomes"); assert "popupInfo" not in lyr
    item = get(f"{PORTAL}/content/items/{lyr['itemId']}/data")
    p = copy.deepcopy(item["layers"][0]["popupInfo"])
    t = p["popupElements"][0]["text"]
    cut = "<br /><span style='font-size:large;'>&nbsp;</span><br /><span style='color:#808080;font-size:medium;'>{NNH_NAME}&nbsp;</span><br /><span style='font-size:small;'>{expression/expr0}&nbsp;</span>"
    assert t.count(cut) == 1
    p["popupElements"][0]["text"] = t.replace(cut, "")
    if p.get("description"): p["description"] = p["description"].replace(cut, "")
    p["expressionInfos"] = []
    p["fieldInfos"] = [f for f in p["fieldInfos"] if f["fieldName"] != "expression/expr0"]
    fixes.append(webmap_fix("C9", "Louisiana Purchase: Biomes pop-up shows biome, realm and ecoregion only.", w, d, "Biomes", {"popupInfo": p}))
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
    wanted = sys.argv[1:] or ["sandbox", "mapmaker"]
    for name, fn in (("sandbox", build_sandbox), ("mapmaker", build_mapmaker)):
        if name not in wanted: continue
        out = {"tool": "Map fixes " + VERSION, "read": stamp, **fn()}
        (OUT / f"{name}.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
        print(name, len(out["fixes"]), "changes")
