#!/usr/bin/env python3
"""Map audit v1.1: reads each lesson's public web map and its layers from ArcGIS Online, without signing in,
and writes what it finds for checking against maps/checklist.md. It changes nothing.

Run from the repo root:  python3 maps/audit.py [lesson id ...]     (no ids: every lesson in resources/lessons/index.json)
Writes maps/audit/<lesson id>.json (everything read) and maps/audit/summary.md (the things to look at).
Standard library only, so it runs anywhere with Python 3.9+ and access to www.arcgis.com and the layers' hosts.
"""
import hashlib, json, math, re, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

VERSION = "1.1"
REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "maps" / "audit"
PORTAL = "https://www.arcgis.com/sharing/rest"
VIEW_WIDTH_PX = 1200            # the width the map pictures are taken at; the opening scale is worked out for it
DUP_LIMIT = 3000                # look for duplicate features only in layers this small
GEOM_LIMIT = 300                # lines and polygons without area/length fields: compare geometry only up to this many
CUT_MIN = 120                   # a text value this long that doesn't end like a sentence may be cut off
HEADERS = {"User-Agent": "lessons-map-audit/" + VERSION, "Referer": "https://www.arcgis.com/"}
hosts = set()


def get(url, params=None, tries=3):
    q = dict(params or {}); q.setdefault("f", "json")
    parts = urllib.parse.urlsplit(url)
    url = urllib.parse.urlunsplit(parts._replace(path=urllib.parse.quote(urllib.parse.unquote(parts.path), safe="/")))
    full = url + ("&" if "?" in url else "?") + urllib.parse.urlencode(q)
    hosts.add(urllib.parse.urlparse(full).hostname)
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(full, headers=HEADERS), timeout=45) as r:
                data = json.loads(r.read().decode("utf-8"))
            if isinstance(data, dict) and "error" in data:
                return {"_error": data["error"]}
            return data
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and i < tries - 1:
                time.sleep(2 * (i + 1)); continue
            return {"_error": {"code": e.code, "message": str(e)}}
        except Exception as e:  # network refused, timeout, bad JSON
            if i < tries - 1:
                time.sleep(2 * (i + 1)); continue
            return {"_error": {"message": f"{type(e).__name__}: {e}"}}


def item_info(item_id):
    it = get(f"{PORTAL}/content/items/{item_id}")
    if "_error" in it:
        return {"id": item_id, "error": it["_error"]}
    keep = ("id", "title", "type", "owner", "access", "snippet", "description", "tags", "accessInformation", "licenseInfo",
            "created", "modified", "numViews", "thumbnail", "contentStatus", "extent")
    out = {k: it.get(k) for k in keep}
    out["descriptionChars"] = len(re.sub(r"<[^>]+>", "", it.get("description") or ""))
    return out


def scale_of(extent):
    """Nominal scale of a Web Mercator extent shown VIEW_WIDTH_PX wide (same convention as layer min/max scales)."""
    try:
        w = abs(extent["xmax"] - extent["xmin"])
        wkid = (extent.get("spatialReference") or {}).get("latestWkid") or (extent.get("spatialReference") or {}).get("wkid")
        if wkid in (4326, 4269):
            w = w * 111319.49
        return round(w / VIEW_WIDTH_PX * 96 / 0.0254)
    except Exception:
        return None


def symbol_summary(sym):
    if not sym:
        return None
    s = {"type": sym.get("type"), "style": sym.get("style")}
    if sym.get("color"): s["color"] = sym["color"]
    if sym.get("size"): s["size"] = sym["size"]
    if sym.get("width"): s["width"] = sym["width"]
    if sym.get("outline"): s["outline"] = {k: sym["outline"].get(k) for k in ("color", "width", "style")}
    if sym.get("url"): s["picture"] = True
    if sym.get("type") == "CIMSymbolReference":
        s["cim"] = True
    return s


def renderer_summary(r):
    if not r:
        return None
    out = {"type": r.get("type"), "field": r.get("field1") or r.get("field"), "valueExpression": bool(r.get("valueExpression"))}
    if r.get("type") == "simple":
        out["symbol"] = symbol_summary(r.get("symbol")); out["label"] = r.get("label")
    elif r.get("type") == "uniqueValue":
        out["classes"] = [{"value": v.get("value"), "label": v.get("label"), "symbol": symbol_summary(v.get("symbol"))} for v in r.get("uniqueValueInfos", [])]
        out["default"] = r.get("defaultLabel")
    elif r.get("type") == "classBreaks":
        out["classes"] = [{"max": b.get("classMaxValue"), "label": b.get("label"), "symbol": symbol_summary(b.get("symbol"))} for b in r.get("classBreakInfos", [])]
    vv = r.get("visualVariables") or []
    if vv: out["visualVariables"] = [v.get("type") for v in vv]
    if r.get("authoringInfo", {}).get("type"): out["authoring"] = r["authoringInfo"]["type"]
    return out


def colour_only(rs):
    """True when every class in a unique-value or class-breaks renderer differs only by colour."""
    if not rs or rs.get("type") not in ("uniqueValue", "classBreaks"):
        return False
    syms = [c.get("symbol") or {} for c in rs.get("classes", [])]
    if len(syms) < 2 or any(s.get("picture") or s.get("cim") for s in syms):
        return False
    shapes = {(s.get("type"), s.get("style"), s.get("size"), s.get("width")) for s in syms}
    colours = {json.dumps(s.get("color")) for s in syms}
    return len(shapes) == 1 and len(colours) > 1


def popup_summary(p):
    if p is None:
        return None
    out = {"title": p.get("title")}
    els = p.get("popupElements") or []
    # A field list shows only from a "fields" element, or in an older pop-up with no elements and no custom text.
    lists = [e for e in els if e.get("type") == "fields"]
    if lists:
        shown = [f for e in lists for f in (e.get("fieldInfos") or [x for x in p.get("fieldInfos", []) if x.get("visible")])]
    elif not els and not (p.get("description") or "").strip():
        shown = [f for f in p.get("fieldInfos", []) if f.get("visible")]
    else:
        shown = []
    out["fieldsShown"] = [{"field": f.get("fieldName"), "label": f.get("label")} for f in shown]
    out["fieldLabelsAreNames"] = [f.get("fieldName") for f in shown if f.get("label") in (None, "", f.get("fieldName")) and not str(f.get("fieldName", "")).startswith("expression/")]
    out["elements"] = [e.get("type") for e in els]
    media = [m for e in els if e.get("type") == "media" for m in e.get("mediaInfos", [])] + (p.get("mediaInfos") or [])
    out["images"] = [{"title": m.get("title"), "altText": m.get("altText"), "source": (m.get("value") or {}).get("sourceURL")} for m in media if m.get("type") == "image"]
    out["expressions"] = [e.get("title") or e.get("name") for e in p.get("expressionInfos", [])]
    text = " ".join(e.get("text", "") for e in els if e.get("type") == "text") + (p.get("description") or "")
    out["fieldsInText"] = sorted(set(re.findall(r"\{([^}]+)\}", text)))
    return out


def geom_key(g):
    if not g:
        return None
    def rnd(o):
        if isinstance(o, list): return [rnd(x) for x in o]
        if isinstance(o, float): return round(o, 5)
        return o
    g = {k: rnd(v) for k, v in g.items() if k != "spatialReference"}
    return hashlib.sha1(json.dumps(g, sort_keys=True).encode()).hexdigest()


SHAPE_FIELDS = re.compile(r"^(shape__area|shape__length|shape_area|shape_length|shape\.starea\(\)|shape\.stlength\(\))$", re.I)
URLISH = re.compile(r"(https?://|www\.|\.(jpe?g|png|gif|pdf|html?)\b|\?itok=)", re.I)


def text_checks(features, fields, title_field=None):
    """Duplicates (same place and attributes, or same place), and long text values that may be cut off.
    "Same place" is the geometry, or for lines and polygons read without geometry, their area and length."""
    seen_full, seen_geom, dup_full, dup_geom, cut = {}, {}, [], [], []
    names = [f["name"] for f in fields]
    name_field = (title_field if title_field in names else None) or next((n for n in names if re.search(r"name|title|battle|place", n, re.I)), None)
    oid = next((f["name"] for f in fields if f.get("type") == "esriFieldTypeOID"), None)
    shape = [n for n in names if SHAPE_FIELDS.match(n)]
    for ft in features:
        a = dict(ft.get("attributes") or {}); fid = a.pop(oid, None) if oid else None
        a.pop("GlobalID", None); a.pop("globalid", None)
        label = (a.get(name_field) if name_field else None) or f"feature {fid}"
        if ft.get("geometry"):
            gk = geom_key(ft["geometry"])
        elif shape and all(a.get(s) is not None for s in shape):
            gk = "|".join(f"{float(a[s]):.6g}" for s in shape)
        else:
            gk = None
        full = (gk, json.dumps(a, sort_keys=True, default=str))
        if gk and full in seen_full:
            dup_full.append([seen_full[full], label])
        else:
            if gk and gk in seen_geom: dup_geom.append([seen_geom[gk], label])
            seen_full[full] = label
        seen_geom.setdefault(gk, label)
        for k, v in a.items():
            if isinstance(v, str):
                t = re.sub(r"<[^>]+>", "", v).strip()
                last = t.split()[-1] if t.split() else ""
                if len(t) >= CUT_MIN and re.search(r"[A-Za-z,;:–-]$", t) and not URLISH.search(last):
                    cut.append({"feature": label, "field": k, "ends": t[-60:]})
    return {"duplicates": dup_full[:20], "sameGeometry": dup_geom[:20], "maybeCutOff": cut[:20], "nameField": name_field}


def query_all(url, count, with_geometry, where="1=1"):
    """Every feature's attributes, with point geometry to about 10 cm when asked for."""
    feats, offset = [], 0
    while offset < count:
        r = get(url + "/query", {"where": where, "outFields": "*", "returnGeometry": "true" if with_geometry else "false",
                                 "outSR": 4326, "geometryPrecision": 6, "resultOffset": offset, "resultRecordCount": 1000})
        if "_error" in r or not r.get("features"):
            break
        feats += r["features"]; offset += len(r["features"])
        if not r.get("exceededTransferLimit"):
            break
    print(f"    {url.rsplit('/', 3)[-3]}: {len(feats)} of {count} features read", flush=True)
    return feats


def service_layer(url, title_field=None, where=None):
    info = get(url)
    if "_error" in info:
        return {"url": url, "error": info["_error"]}
    out = {"url": url, "name": info.get("name"), "type": info.get("type"), "geometryType": info.get("geometryType"),
           "minScale": info.get("minScale"), "maxScale": info.get("maxScale"), "copyrightText": info.get("copyrightText"),
           "maxRecordCount": info.get("maxRecordCount"), "renderer": renderer_summary((info.get("drawingInfo") or {}).get("renderer")),
           "labels": bool((info.get("drawingInfo") or {}).get("labelingInfo")),
           "fields": [{"name": f["name"], "alias": f.get("alias"), "type": f.get("type"), "domain": bool(f.get("domain"))} for f in info.get("fields") or []],
           "serviceItemId": info.get("serviceItemId")}
    if info.get("type") in ("Feature Layer", "Table"):
        where = where or "1=1"
        c = get(url + "/query", {"where": where, "returnCountOnly": "true"})
        if where != "1=1": out["filter"] = where
        out["count"] = c.get("count") if "_error" not in c else None
        n, gt = out["count"], info.get("geometryType")
        has_shape = any(SHAPE_FIELDS.match(f["name"]) for f in info.get("fields") or [])
        if n is not None and n <= DUP_LIMIT:
            geom = gt in ("esriGeometryPoint", "esriGeometryMultipoint") or (not has_shape and n <= GEOM_LIMIT)
            t0 = time.time()
            out["checks"] = text_checks(query_all(url, n, geom, where), info.get("fields") or [], title_field)
            out["checks"]["geometryCompared"] = "geometry" if geom else ("area and length" if has_shape else "attributes only")
            out["seconds"] = round(time.time() - t0, 1)
    return out


def walk_layers(layers, path=""):
    for lyr in layers or []:
        title = lyr.get("title") or lyr.get("id")
        yield lyr, (path + " / " if path else "") + str(title)
        if lyr.get("layerType") == "GroupLayer":
            yield from walk_layers(lyr.get("layers"), (path + " / " if path else "") + str(title))


_item_data = {}


def from_item(lyr):
    """The pop-up and layer definition a layer takes from its item when the web map doesn't set them."""
    if not lyr.get("itemId"):
        return {}
    if lyr["itemId"] not in _item_data:
        d = get(f"{PORTAL}/content/items/{lyr['itemId']}/data")
        _item_data[lyr["itemId"]] = {} if "_error" in d else d
    d = _item_data[lyr["itemId"]] or {}
    m = re.search(r"/(\d+)/?$", lyr.get("url") or "")
    for sub in d.get("layers") or []:
        if m and str(sub.get("id")) == m.group(1):
            return sub
    return {}


def audit_layer(lyr, path, opening_scale):
    inherited = from_item(lyr) if lyr.get("layerType") == "ArcGISFeatureLayer" else {}
    ld = lyr.get("layerDefinition") or {}
    ild = inherited.get("layerDefinition") or {}
    popup = lyr.get("popupInfo") or inherited.get("popupInfo")
    out = {"path": path, "title": lyr.get("title"), "layerType": lyr.get("layerType"), "visible": lyr.get("visibility", True),
           "opacity": lyr.get("opacity"), "itemId": lyr.get("itemId"), "url": lyr.get("url"), "disablePopup": lyr.get("disablePopup", False),
           "popup": popup_summary(popup), "popupFrom": "map" if lyr.get("popupInfo") else ("layer item" if inherited.get("popupInfo") else None),
           "minScale": lyr.get("minScale", ld.get("minScale")),
           "maxScale": lyr.get("maxScale", ld.get("maxScale")), "showLegend": lyr.get("showLegend", True),
           "listMode": lyr.get("listMode"), "definitionExpression": ld.get("definitionExpression")}
    wm_r = (ld.get("drawingInfo") or {}).get("renderer") or (ild.get("drawingInfo") or {}).get("renderer")
    if wm_r: out["rendererInMap"] = renderer_summary(wm_r)
    if out["minScale"] is None and ild.get("minScale") is not None: out["minScale"] = ild.get("minScale")
    if out["maxScale"] is None and ild.get("maxScale") is not None: out["maxScale"] = ild.get("maxScale")
    if not out["definitionExpression"] and ild.get("definitionExpression"): out["definitionExpression"] = ild["definitionExpression"]
    title_field = (re.findall(r"\{([^}]+)\}", (popup or {}).get("title") or "") or [None])[0]
    if (ld.get("drawingInfo") or {}).get("labelingInfo"): out["labelsInMap"] = True
    if lyr.get("itemId"):
        out["item"] = item_info(lyr["itemId"])
    if lyr.get("layerType") == "ArcGISFeatureLayer" and lyr.get("url"):
        out["service"] = service_layer(lyr["url"], title_field, out["definitionExpression"])
    elif lyr.get("featureCollection"):
        fc = lyr["featureCollection"].get("layers") or []
        out["featureCollection"] = [{"count": len(l.get("featureSet", {}).get("features", [])),
                                     "renderer": renderer_summary((l.get("layerDefinition", {}).get("drawingInfo") or {}).get("renderer")),
                                     "popup": popup_summary(l.get("popupInfo")),
                                     "checks": text_checks(l.get("featureSet", {}).get("features", []), l.get("layerDefinition", {}).get("fields") or [], title_field)} for l in fc]
        fc_popups = [x["popup"] for x in out["featureCollection"] if x.get("popup")]
        if fc_popups and not out["popup"]:
            out["popup"], out["popupFrom"] = fc_popups[0], "map notes"
    elif lyr.get("url") and lyr.get("layerType") in ("ArcGISMapServiceLayer", "ArcGISTiledMapServiceLayer", "VectorTileLayer", "ArcGISImageServiceLayer"):
        info = get(lyr["url"].split("?")[0])
        out["service"] = {"url": lyr["url"], "error": info.get("_error")} if "_error" in info else {"url": lyr["url"], "copyrightText": info.get("copyrightText"), "minScale": info.get("minScale"), "maxScale": info.get("maxScale")}
    # Does it draw at the opening view?
    mn = out["minScale"] or (out.get("service") or {}).get("minScale") or 0
    mx = out["maxScale"] or (out.get("service") or {}).get("maxScale") or 0
    if opening_scale:
        out["drawsAtOpening"] = (mn == 0 or opening_scale <= mn) and (mx == 0 or opening_scale >= mx)
    out["rendererColourOnly"] = colour_only(out.get("rendererInMap") or (out.get("service") or {}).get("renderer"))
    return out


def findings(lesson, wm_item, data, layers):
    """Plain-language list of things to look at; each is checked by hand before anything changes."""
    f = []
    def add(where, what): f.append({"where": where, "what": what})
    if wm_item.get("error"): add("web map item", f"could not be read: {wm_item['error']}"); return f
    if wm_item.get("access") != "public": add("web map item", f"shared as {wm_item.get('access')}, not with Everyone")
    for k, label in (("snippet", "summary"), ("accessInformation", "credits"), ("licenseInfo", "terms of use")):
        if not (wm_item.get(k) or "").strip(): add("web map item", f"no {label}")
    if wm_item.get("descriptionChars", 0) < 100: add("web map item", "description is short or empty")
    for b in (data.get("baseMap") or {}).get("baseMapLayers", []):
        u = (b.get("url") or b.get("styleUrl") or "").lower()
        if "carto" in u: add("basemap", f"{b.get('title')}: CARTO content ({u})")
    names = {l.get("name") for l in lesson["map"].get("layers", [])}
    for L in layers:
        t, where = L.get("title") or "", "layer " + L["path"]
        if L.get("item", {}).get("access") not in (None, "public"): add(where, f"layer item shared as {L['item'].get('access')}")
        if (L.get("item") or {}).get("error"): add(where, f"layer item could not be read: {L['item']['error']}")
        if (L.get("service") or {}).get("error"): add(where, f"service could not be read: {L['service']['error']}")
        if re.match(r"copy of", t, re.I): add(where, "title starts with \"Copy of\"")
        if L["layerType"] in ("ArcGISFeatureLayer",) and not L.get("disablePopup") and not L.get("popup") and t in names:
            add(where, "no pop-up set in the map or its layer item, so the default list of every field shows")
        p = L.get("popup") or {}
        if p.get("fieldLabelsAreNames"): add(where, f"pop-up shows field names as labels: {', '.join(p['fieldLabelsAreNames'][:6])}")
        for im in p.get("images", []):
            if not (im.get("altText") or "").strip(): add(where, "pop-up image has no alt text")
        if L.get("rendererColourOnly"): add(where, "symbols differ by colour only (WCAG 1.4.1 if a question depends on telling them apart)")
        if L.get("visible") and L.get("drawsAtOpening") is False: add(where, "on at the start but doesn't draw at the opening scale")
        for src in ([L["service"]] if isinstance(L.get("service"), dict) else []) + (L.get("featureCollection") or []):
            c = src.get("checks") or {}
            for d in c.get("duplicates", []): add(where, f"duplicate feature: {d[1]}")
            for d in c.get("sameGeometry", []): add(where, f"two features at the same place: {d[0]} and {d[1]}")
            for d in c.get("maybeCutOff", []): add(where, f"text may be cut off in {d['field']} ({d['feature']}): …{d['ends']}")
    titles = {L.get("title") for L in layers}
    for n in sorted(names - titles): add("lesson file", f"layer \"{n}\" is not in the web map")
    return f


def audit(lesson_id):
    print(lesson_id, flush=True)
    lesson = json.loads((REPO / "resources" / "lessons" / f"{lesson_id}.json").read_text())
    wid = lesson["map"]["webmapId"]
    wm_item = item_info(wid)
    data = get(f"{PORTAL}/content/items/{wid}/data")
    if "_error" in data:
        return {"lesson": lesson_id, "webmapId": wid, "item": wm_item, "error": data["_error"]}
    vp = ((data.get("initialState") or {}).get("viewpoint") or {})
    opening_extent = vp.get("targetGeometry")
    if not opening_extent and wm_item.get("extent"):  # older maps keep the opening view as the item extent, in degrees
        (x0, y0), (x1, y1) = wm_item["extent"]
        opening_extent = {"xmin": x0, "ymin": y0, "xmax": x1, "ymax": y1, "spatialReference": {"wkid": 4326}}
    opening_scale = vp.get("scale") or (scale_of(opening_extent) if opening_extent else None)
    layers = [audit_layer(l, p, opening_scale) for l, p in walk_layers(data.get("operationalLayers"))]
    rec = {"tool": "Map audit " + VERSION, "lesson": lesson_id, "webmapId": wid, "item": wm_item,
           "basemap": {"title": (data.get("baseMap") or {}).get("title"),
                       "layers": [{"title": b.get("title"), "type": b.get("layerType"), "url": b.get("url") or b.get("styleUrl"), "itemId": b.get("itemId")} for b in (data.get("baseMap") or {}).get("baseMapLayers", [])]},
           "opening": {"extent": opening_extent, "scale": opening_scale},
           "bookmarks": [b.get("name") for b in data.get("bookmarks") or []],
           "applicationProperties": data.get("applicationProperties"), "layers": layers}
    rec["findings"] = findings(lesson, wm_item, data, layers)
    return rec


def main():
    ids = sys.argv[1:] or json.loads((REPO / "resources" / "lessons" / "index.json").read_text())["lessons"]
    OUT.mkdir(parents=True, exist_ok=True)
    lines = [f"# Map audit {VERSION}", "", "Read without signing in. Each line is something to check by hand against maps/checklist.md; nothing here is a confirmed error.", ""]
    for lid in ids:
        rec = audit(lid)
        (OUT / f"{lid}.json").write_text(json.dumps(rec, indent=1, ensure_ascii=False) + "\n")
        it = rec.get("item") or {}
        lines += [f"## {lid}", f"Web map {rec['webmapId']}: {it.get('title')} (owner {it.get('owner')}, {it.get('access')})", ""]
        if rec.get("error"): lines.append(f"- Could not read the map: {rec['error']}")
        for f in rec.get("findings", []): lines.append(f"- **{f['where']}**: {f['what']}")
        owners = sorted({(L.get('item') or {}).get('owner') for L in rec.get('layers', []) if (L.get('item') or {}).get('owner')})
        if owners: lines.append(f"- Layer item owners: {', '.join(owners)}")
        lines.append("")
        print(lid, "error" if rec.get("error") else f"{len(rec.get('findings', []))} things to check", flush=True)
    lines += ["## Hosts the maps use", "", ", ".join(sorted(h for h in hosts if h)), ""]
    (OUT / "summary.md").write_text("\n".join(lines))


if __name__ == "__main__":
    main()
