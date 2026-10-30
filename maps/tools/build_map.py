#!/usr/bin/env python3
"""Map builder 1.2: turns a map spec (maps/specs/<id>.json, Map spec 1.0) into the web map ArcGIS Online stores.

Reads only public ArcGIS Online content; signs in to nothing. For each spec it:
  - checks the spec against its lesson (layer names, which layers start off, bookmarks),
  - reads every source layer and checks that each field the spec uses exists (pop-ups, labels, symbols, filters),
  - refuses CARTO basemaps and non-public sources, warns about anything a student couldn't open,
  - writes maps/build/<id>/webmap.json (the item's data), item.json (title, summary, tags...) and report.json,
    with a fingerprint of webmap.json that the publish script checks before it changes anything.

Usage, from the repo root:  python3 maps/tools/build_map.py maps/specs/<id>.json [more specs...]
Exit code 1 if any spec has errors (nothing is written for that spec).
"""
import copy, datetime, hashlib, json, math, re, sys, urllib.parse, urllib.request
from pathlib import Path

VERSION = "1.2"
SPEC_FORMAT = "Map spec 1.0"
PORTAL = "https://www.arcgis.com/sharing/rest"
ROOT = Path(__file__).resolve().parents[2]
R = 6378137.0
TYPE_KEYWORDS = ["ArcGIS Online", "Explorer Web Map", "Map", "Online Map", "Web Map"]
SHAPES = {"circle": "esriSMSCircle", "square": "esriSMSSquare", "diamond": "esriSMSDiamond", "cross": "esriSMSCross", "x": "esriSMSX", "triangle": "esriSMSTriangle"}
PLACEMENT = {"above": "esriServerPointLabelPlacementAboveCenter", "below": "esriServerPointLabelPlacementBelowCenter",
             "center": "esriServerPointLabelPlacementCenterCenter", "right": "esriServerPointLabelPlacementCenterRight",
             "polygon": "esriServerPolygonPlacementAlwaysHorizontal", "line": "esriServerLinePlacementAboveAlong"}
SQL_WORDS = {"AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE", "BETWEEN", "TRUE", "FALSE", "DATE", "TIMESTAMP", "UPPER", "LOWER", "CAST", "AS", "INT", "FLOAT", "CHAR", "VARCHAR"}


def get(url, **p):
    p.setdefault("f", "json")
    s = urllib.parse.urlsplit(url)
    url = urllib.parse.urlunsplit(s._replace(path=urllib.parse.quote(urllib.parse.unquote(s.path), safe="/")))
    req = urllib.request.Request(url + ("&" if "?" in url else "?") + urllib.parse.urlencode(p), headers={"Referer": "https://www.arcgis.com/"})
    d = json.loads(urllib.request.urlopen(req, timeout=60).read() or b"null")
    if isinstance(d, dict) and "error" in d:
        raise RuntimeError(f"{url}: {d['error'].get('message', d['error'])}")
    return d


def fp(obj):
    return hashlib.sha1(json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


def color(hexstr):
    h = hexstr.lstrip("#")
    if len(h) not in (6, 8): raise ValueError(f"colour {hexstr!r}: use #RRGGBB or #RRGGBBAA")
    v = [int(h[i:i + 2], 16) for i in range(0, len(h), 2)]
    return v + [255] if len(v) == 3 else v


def mercator(ext):
    xmin, ymin, xmax, ymax = ext
    fx = lambda lon: round(math.radians(lon) * R, 1)
    fy = lambda lat: round(R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)), 1)
    return {"xmin": fx(xmin), "ymin": fy(ymin), "xmax": fx(xmax), "ymax": fy(ymax), "spatialReference": {"wkid": 102100, "latestWkid": 3857}}


def line(o):
    return {"type": "esriSLS", "style": "esriSLSSolid", "color": color(o["color"]), "width": o.get("width", 1)}


def symbol(s, errors):
    t = s["type"]
    if t == "raw":
        return copy.deepcopy(s["renderer"])
    if t == "marker":
        sym = {"type": "esriSMS", "style": SHAPES[s.get("shape", "circle")], "color": color(s["color"]), "size": s.get("size", 8),
               "angle": 0, "xoffset": 0, "yoffset": 0}
        if s.get("outline"): sym["outline"] = line(s["outline"])
        r = {"type": "simple", "symbol": sym}
        if s.get("legendLabel"): r["label"] = s["legendLabel"]
        return r
    if t == "line":
        r = {"type": "simple", "symbol": {"type": "esriSLS", "style": {"solid": "esriSLSSolid", "dash": "esriSLSDash", "dot": "esriSLSDot"}[s.get("style", "solid")],
                                          "color": color(s["color"]), "width": s.get("width", 1)}}
        if s.get("legendLabel"): r["label"] = s["legendLabel"]
        return r
    if t == "fill":
        sym = {"type": "esriSFS", "style": "esriSFSSolid", "color": color(s["color"])}
        if s.get("outline"): sym["outline"] = line(s["outline"])
        r = {"type": "simple", "symbol": sym}
        if s.get("legendLabel"): r["label"] = s["legendLabel"]
        return r
    if t == "pieChart":
        z = s["size"]
        vv = {"type": "sizeInfo", "field": z["field"], "minDataValue": z["from"][0], "maxDataValue": z["to"][0], "minSize": z["from"][1], "maxSize": z["to"][1]}
        if z.get("legendTitle"): vv["legendOptions"] = {"title": z["legendTitle"]}
        other = s.get("other", {"label": "Other", "color": "#AAAAAA"})
        r = {"type": "pieChart",
             "attributes": [{"field": a["field"], "label": a["label"], "color": color(a["color"])} for a in s["slices"]],
             "defaultColor": color(other["color"]), "defaultLabel": other["label"], "holePercentage": s.get("hole", 0),
             "othersCategory": {"color": color(other["color"]), "label": other["label"], "threshold": 0},
             "outline": line(s.get("outline", {"color": "#FFFFFF", "width": 1})), "size": z["from"][1], "visualVariables": [vv]}
        if s.get("background"):
            b = s["background"]
            r["backgroundFillSymbol"] = {"type": "esriSFS", "style": "esriSFSSolid", "color": color(b["color"])}
            if b.get("outline"): r["backgroundFillSymbol"]["outline"] = line(b["outline"])
        return r
    errors.append(f"unknown symbol type {t!r}")
    return None


def labels(lb):
    out = {"labelExpressionInfo": {"expression": lb["expression"]}, "labelPlacement": PLACEMENT[lb.get("placement", "above")],
           "symbol": {"type": "esriTS", "color": color(lb.get("color", "#282828")),
                      "font": {"family": lb.get("font", {}).get("family", "Noto Sans"), "size": lb.get("font", {}).get("size", 9),
                               "weight": lb.get("font", {}).get("weight", "normal")},
                      "horizontalAlignment": "center", "verticalAlignment": "baseline"},
           "minScale": lb.get("minScale", 0), "maxScale": lb.get("maxScale", 0), "repeatLabel": False}
    if lb.get("halo"): out["symbol"].update({"haloColor": color(lb["halo"]["color"]), "haloSize": lb["halo"].get("size", 1)})
    if lb.get("overlap") is True: out["deconflictionStrategy"] = "none"
    return [out]


def popup(pp):
    p = {"title": pp.get("title", ""), "popupElements": [{"type": "text", "text": pp["html"]}], "showAttachments": False,
         "fieldInfos": [{"fieldName": f, "label": f, "visible": False, "format": fmt} for f, fmt in pp.get("fields", {}).items()]}
    ex = pp.get("expressions", {})
    if ex:
        p["expressionInfos"] = [{"name": n, "title": e.get("title", n), "returnType": e.get("returns", "string"), "expression": e["arcade"]} for n, e in ex.items()]
    return p


def fields_used(lyr):
    """(where, field) for every field name the layer's spec uses."""
    used = []
    pp = lyr.get("popup") or {}
    for part in (pp.get("title", ""), pp.get("html", "")):
        used += [("pop-up", f) for f in re.findall(r"\{([A-Za-z_][A-Za-z0-9_]*)\}", part)]
    for e in (pp.get("expressions") or {}).values():
        used += [("pop-up expression", f) for f in re.findall(r"\$feature\.([A-Za-z_][A-Za-z0-9_]*)", e["arcade"])]
    if lyr.get("labels"):
        used += [("labels", f) for f in re.findall(r"\$feature\.([A-Za-z_][A-Za-z0-9_]*)", lyr["labels"]["expression"])]
    s = lyr.get("symbol") or {}
    used += [("symbol", a["field"]) for a in s.get("slices", [])]
    if isinstance(s.get("size"), dict): used.append(("symbol size", s["size"]["field"]))
    if lyr.get("filter"):
        no_strings = re.sub(r"'[^']*'", "", lyr["filter"])
        used += [("filter", w) for w in re.findall(r"[A-Za-z_][A-Za-z0-9_]*", no_strings) if w.upper() not in SQL_WORDS]
    return used


def build(spec_path):
    spec = json.loads(Path(spec_path).read_text(encoding="utf-8"))
    errors, warnings, checked = [], [], []
    if spec.get("format") != SPEC_FORMAT: errors.append(f"format is {spec.get('format')!r}, expected {SPEC_FORMAT!r}")
    for k in ("id", "version", "item", "basemap", "view", "layers"):
        if k not in spec: errors.append(f"missing {k}")
    if errors: return spec, None, None, errors, warnings, checked

    # Lesson cross-check
    if spec.get("lesson"):
        lesson = json.loads((ROOT / spec["lesson"]).read_text(encoding="utf-8"))
        names = [l["title"] for l in spec["layers"]]
        for ll in lesson["map"]["layers"]:
            if ll["name"] not in names: errors.append(f"the lesson names layer {ll['name']!r}, which the spec doesn't have")
            else:
                sl = spec["layers"][names.index(ll["name"])]
                if bool(ll.get("offAtStart")) == bool(sl.get("visible", True)):
                    errors.append(f"{ll['name']!r}: the lesson says it is {'off' if ll.get('offAtStart') else 'on'} when the map opens; the spec disagrees")
        for b in lesson["map"].get("bookmarks", []):
            if b not in [x["name"] for x in spec.get("bookmarks", [])]: errors.append(f"the lesson names bookmark {b!r}, which the spec doesn't have")
        checked.append("layers, start visibility and bookmarks match the lesson")

    # Basemap: no CARTO, sources must be public
    for b in spec["basemap"]["layers"]:
        text = " ".join(str(b.get(k, "")) for k in ("title", "url", "styleUrl"))
        if b.get("itemId"):
            it = get(f"{PORTAL}/content/items/{b['itemId']}")
            text += " " + " ".join(str(it.get(k, "")) for k in ("title", "owner", "accessInformation", "url"))
            if it.get("access") != "public": errors.append(f"basemap layer {b['title']!r} is not public ({it.get('access')})")
        if "carto" in text.lower(): errors.append(f"basemap layer {b['title']!r} uses CARTO content")
    checked.append("basemap is public and not CARTO")

    # Layers: sources public, fields exist
    op = []
    for i, lyr in enumerate(reversed(spec["layers"])):  # spec lists top first; web maps store bottom first
        src = lyr["source"]
        try:
            it = get(f"{PORTAL}/content/items/{src['itemId']}")
            if it.get("access") != "public": warnings.append(f"{lyr['title']!r}: source item is {it.get('access')}, so students outside the organization can't open it")
            svc = get(src["url"])
        except Exception as e:
            errors.append(f"{lyr['title']!r}: can't read its source ({e})"); continue
        have = {f["name"] for f in svc.get("fields", [])}
        dates = {f["name"] for f in svc.get("fields", []) if f["type"] == "esriFieldTypeDate"}
        for where, f in fields_used(lyr):
            if f not in have: errors.append(f"{lyr['title']!r}: {where} uses field {f!r}, which the layer doesn't have")
        for f in dates:
            if "{" + f + "}" in (lyr.get("popup") or {}).get("html", ""):
                warnings.append(f"{lyr['title']!r}: the pop-up shows date field {f!r} directly, so it shows in the viewer's time zone (a day early in the US for UTC dates); use an Arcade expression")
        if not (lyr.get("popup") or {}).get("title") and not lyr.get("popupOff"):
            warnings.append(f"{lyr['title']!r}: the pop-up has no title")
        layer = {"id": "lyr" + hashlib.sha1((spec["id"] + lyr["title"]).encode()).hexdigest()[:11], "title": lyr["title"], "url": src["url"],
                 "itemId": src["itemId"], "layerType": "ArcGISFeatureLayer", "visibility": lyr.get("visible", True), "opacity": lyr.get("opacity", 1)}
        ld = {"drawingInfo": {"renderer": symbol(lyr["symbol"], errors)}}
        if lyr.get("labels"):
            ld["drawingInfo"]["labelingInfo"] = labels(lyr["labels"]); layer["showLabels"] = True
        if lyr.get("filter"): ld["definitionExpression"] = lyr["filter"]
        vr = lyr.get("visibleRange") or {}
        # A key that is present is written even when it is 0, so a spec can lift a scale limit set on the service itself.
        if "minScale" in vr: ld["minScale"] = vr["minScale"]
        if "maxScale" in vr: ld["maxScale"] = vr["maxScale"]
        layer["layerDefinition"] = ld
        if lyr.get("popupOff"): layer["disablePopup"] = True
        else: layer["popupInfo"] = popup(lyr["popup"])
        op.append(layer)
    checked.append("every source layer is readable and every field the spec uses exists")

    base = {"title": spec["basemap"]["title"], "baseMapLayers": []}
    for b in spec["basemap"]["layers"]:
        bl = {"id": "base" + hashlib.sha1(b["title"].encode()).hexdigest()[:8], "title": b["title"], "opacity": b.get("opacity", 1), "visibility": True}
        if b["type"] == "tile": bl.update({"layerType": "ArcGISTiledMapServiceLayer", "url": b["url"]})
        elif b["type"] == "vectorTile": bl.update({"layerType": "VectorTileLayer", "styleUrl": b["styleUrl"]})
        else: errors.append(f"basemap layer type {b['type']!r}")
        if b.get("itemId"): bl["itemId"] = b["itemId"]
        if b.get("blendMode"): bl["blendMode"] = b["blendMode"]
        if b.get("reference"): bl["isReference"] = True  # drawn above the map's own layers (labels, boundaries)
        base["baseMapLayers"].append(bl)

    webmap = {"operationalLayers": op, "baseMap": base, "spatialReference": {"wkid": 102100, "latestWkid": 3857},
              "authoringApp": "Map builder", "authoringAppVersion": VERSION, "version": "2.31",
              "initialState": {"viewpoint": {"targetGeometry": mercator(spec["view"]["extent"])}},
              "bookmarks": [{"name": b["name"], "extent": mercator(b["extent"])} for b in spec.get("bookmarks", [])]}
    it = spec["item"]
    x = spec["view"]["extent"]
    item = {"type": "Web Map", "title": it["title"], "snippet": it.get("snippet", ""), "description": it.get("description", ""),
            "tags": ",".join(it.get("tags", [])), "accessInformation": it.get("credits", ""), "licenseInfo": it.get("license", ""),
            "typeKeywords": ",".join(TYPE_KEYWORDS + [f"spec:{spec['id']}", f"specVersion:{spec['version']}"]),
            "extent": f"{x[0]},{x[1]},{x[2]},{x[3]}"}
    if len(it.get("snippet", "")) > 2048: errors.append("summary is longer than 2,048 characters")
    if not it.get("credits"): warnings.append("the item has no credits (accessInformation)")
    return spec, webmap, item, errors, warnings, checked


def main(paths):
    bad = False
    for p in paths:
        spec, webmap, item, errors, warnings, checked = build(p)
        sid = spec.get("id", Path(p).stem)
        print(f"== {sid} (spec {spec.get('version')})")
        for w in warnings: print("   warning:", w)
        for e in errors: print("   ERROR:", e)
        if errors:
            bad = True; print("   not built"); continue
        out = ROOT / "maps" / "build" / sid
        out.mkdir(parents=True, exist_ok=True)
        wm_bytes = (json.dumps(webmap, indent=1, ensure_ascii=False) + "\n").encode("utf-8")
        it_bytes = (json.dumps(item, indent=1, ensure_ascii=False) + "\n").encode("utf-8")
        (out / "webmap.json").write_bytes(wm_bytes)
        (out / "item.json").write_bytes(it_bytes)
        report = {"tool": f"Map builder {VERSION}", "spec": Path(p).resolve().relative_to(ROOT).as_posix(), "specId": sid, "specVersion": spec["version"],
                  "built": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                  # sha1 of the files' bytes: the test and the publish script check these before they use the build
                  "webmapFingerprint": hashlib.sha1(wm_bytes).hexdigest(), "itemFingerprint": hashlib.sha1(it_bytes).hexdigest(),
                  "checked": checked, "warnings": warnings, "tested": None}
        (out / "report.json").write_text(json.dumps(report, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"   built: {len(webmap['operationalLayers'])} layers, {len(webmap['bookmarks'])} bookmarks; fingerprint {report['webmapFingerprint']}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
