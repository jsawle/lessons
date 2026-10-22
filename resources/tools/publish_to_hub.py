# =====================================================================
# PUBLISH MAPMAKER LESSONS TO THE HUB (demo)          publisher v1.3
# Reads whatever bundle GitHub serves (any resource pages version).
#
# Run in an ArcGIS Notebook, signed in as the account that owns the
# site (GIS-4-Schools). Paste it all into one cell (or split it at the
# "# %% CELL" lines if you prefer).
#   1. Run it with DRY_RUN = True: it backs up the site and prints the
#      plan. Nothing is written.
#   2. If the plan looks right, set DRY_RUN = False and run it again to
#      publish. It then checks its own work.
#
# What it does
#   1. Backs up the site's data, and any unpublished draft from the
#      site editor.
#   2. Reads hub-bundle.json, built on GitHub from the lesson files.
#   3. Downloads every Word file first (student sheets in English and
#      Spanish, and the teacher notes), then uploads each one as a Word
#      item. If GitHub answers with a temporary
#      error, it waits and tries again; if it still can't download,
#      it stops before changing anything on the Hub.
#   4. Creates or updates two Hub Pages per lesson (the lesson page and
#      its answer page, /pages/<id>-teacher), plus the Lessons page and
#      the How these lessons work page.
#   5. Registers every page in the site's pages list. This is the step
#      that makes /pages/<slug> addresses and menu links work.
#   6. Sets the site's colours (header, menu bar, buttons, links) to the
#      Esri blue in the bundle, in the live site and in any editor draft.
#      Set SET_COLOURS = False to leave the colours alone.
#   7. Shares everything.
# Afterwards: republish the site in the site editor (the last lines of
# the output say how).
#
# Safe to run again: it updates the pages and Word items it made last
# time (it remembers them in mml_hub_state.json) instead of adding new
# ones.
# =====================================================================


# %% CELL 0 — Settings
SITE_ID    = "9c39add73ebf47068e1dac37f6353b8d"   # the demo Lessons site (hubDemo in core-lessons.json)
BUNDLE_URL = "https://jsawle.github.io/lessons/resources/dist/hub-bundle.json"
DRY_RUN    = True          # set to False when the plan looks right, then run again
SHARE_WITH = "everyone"    # "everyone" (public) or "org"
SET_COLOURS = True         # set the site's header, menu bar, button and link colours (Esri blue)

import os
HOME = "/arcgis/home" if os.path.isdir("/arcgis/home") else os.getcwd()
STATE_PATH = os.path.join(HOME, "mml_hub_state.json")
BACKUP_DIR = os.path.join(HOME, "mml_backups")
BUNDLE_URL = os.environ.get("MML_BUNDLE_URL", BUNDLE_URL)
print(f"DRY_RUN = {DRY_RUN}. Files go in {HOME}.")


# %% CELL 1 — Connect, read the site, BACK IT UP
from arcgis.gis import GIS
import json, datetime, tempfile, re, time, requests

gis = GIS("home")
me = gis.users.me.username
KEY = (gis.properties.get("urlKey") or "").lower()
REST = gis._url.rstrip("/") + "/sharing/rest"

site = gis.content.get(SITE_ID)
assert site is not None, "[ERR] Site not found. Check SITE_ID, and that you're signed in to the right organization."
sdata = site.get_data()
if isinstance(sdata, str):
    sdata = json.loads(sdata)
assert isinstance(sdata, dict) and "values" in sdata, "[ERR] The site's data doesn't look like a Hub site. STOP."
SITE_URL = (site.url or ("https://" + sdata["values"].get("defaultHostname", ""))).rstrip("/")

os.makedirs(BACKUP_DIR, exist_ok=True)
stamp = datetime.datetime.utcnow().strftime("%Y%m%d-%H%M%S")
BACKUP_PATH = os.path.join(BACKUP_DIR, f"site_{SITE_ID}_{stamp}.json")
with open(BACKUP_PATH, "w") as f:
    json.dump(sdata, f, indent=2)

# The site editor keeps unpublished changes in a draft file on the site item (draft-<number>.json, the name
# Esri's @esri/hub-sites code uses). Publishing in the editor copies the draft's layout and colours over the
# live site, so the colours are set in the draft too.
DRAFT_RE = re.compile(r"^draft-\d+\.json$")


def read_json_reply(x):
    """gis._con.get returns a dict, a JSON string or a downloaded file's path, depending on the API version."""
    if isinstance(x, str) and os.path.isfile(x):
        with open(x) as f:
            return json.load(f)
    return json.loads(x) if isinstance(x, str) else x


def site_drafts():
    try:
        res = read_json_reply(gis._con.get(f"{REST}/content/items/{site.id}/resources", {"f": "json", "num": 100}))
        names = [r.get("resource", "") for r in (res or {}).get("resources", [])]
    except Exception as e:
        print(f"[WARN] Couldn't list the site's files, so couldn't check for an editor draft: {e}")
        return None
    out = {}
    for name in names:
        if DRAFT_RE.match(name):
            try:
                out[name] = read_json_reply(gis._con.get(f"{REST}/content/items/{site.id}/resources/{name}", {}))
            except Exception as e:
                print(f"[WARN] Couldn't read the editor draft {name}: {e}")
    return out


def colours(theme):
    th = theme if isinstance(theme, dict) else {}
    return {part: {k: v for k, v in (th.get(part) or {}).items() if k in ("background", "text", "link")}
            for part in ("header", "globalNav", "button", "body")}


drafts = site_drafts()
drafts_checked = drafts is not None
drafts = drafts or {}
for name, d in drafts.items():
    with open(os.path.join(BACKUP_DIR, f"site_{SITE_ID}_{stamp}_{name}"), "w") as f:
        json.dump(d, f, indent=2)

pages_now = sdata["values"].get("pages", [])
print(f"[ok] Signed in as {me}. Org URL key: {KEY}")
print(f"[ok] Site: {site.title} ({site.type}), owner {site.owner}")
print(f"[ok] Site address: {SITE_URL}")
print(f"[ok] Backup written: {BACKUP_PATH}  <- download it from the Files pane before publishing")
print(f"[ok] Pages registered now: {len(pages_now)}")
for p in pages_now:
    print(f"       /pages/{p.get('slug')} -> {p.get('id')}")
print(f"[ok] Site colours now: {json.dumps(colours(sdata['values'].get('theme')))}")
hdr = (((sdata["values"].get("layout") or {}).get("header") or {}).get("component") or {}).get("settings") or {}
print(f"       Header type: {hdr.get('headerType', 'not set')}" + ("; the site also has its own header CSS, which can override colours" if sdata["values"].get("headerCss") else ""))
if drafts:
    print(f"[ok] The site editor has an unpublished draft: {', '.join(drafts)} (backed up next to the site backup)")
    for name, d in drafts.items():
        print(f"       draft colours: {json.dumps(colours(((d.get('data') or {}).get('values') or {}).get('theme')))}")
elif drafts_checked:
    print("[ok] No unpublished draft in the site editor")
else:
    print("[WARN] If you open the site editor and it shows the old colours, don't publish there; send this output instead.")
if site.owner != me:
    print("[WARN] You are not the site's owner, so saving the site may fail.")
if not KEY:
    print("[WARN] No org URL key found; page slugs need it. STOP and check gis.properties.")


# %% CELL 2 — Read the lesson bundle from GitHub
def fetch(url, what):
    """Download from GitHub Pages, trying again after a temporary error (a 5xx or 429 answer, a dropped
    connection or a timeout). GitHub Pages sometimes answers 503 for a moment, e.g. just after it republishes."""
    waits = [5, 15, 45]
    for attempt in range(len(waits) + 1):
        try:
            r = requests.get(url, timeout=60)
            if r.status_code < 500 and r.status_code != 429:
                r.raise_for_status()   # 404 and other permanent errors stop at once
                return r
            err = f"{r.status_code} {r.reason}"
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            err = type(e).__name__
        if attempt < len(waits):
            print(f"[WARN] {what}: GitHub answered {err}. Trying again in {waits[attempt]} s...")
            time.sleep(waits[attempt])
    raise RuntimeError(f"[ERR] Couldn't download {what} from GitHub after {len(waits) + 1} tries ({err}). "
                       "Nothing on the Hub was changed in this run. Run the cell again in a few minutes.")


bundle = fetch(BUNDLE_URL, "hub-bundle.json").json()
assert bundle.get("format") == "mml-hub-bundle/1", f"[ERR] Unexpected bundle format: {bundle.get('format')}"
print(f"[ok] Bundle built {bundle['builtOn']}, MapMaker resource pages {bundle['app']['version']}")
for name, ver in bundle["app"]["parts"].items():
    print(f"       {name}: {ver}")
print(f"[ok] {len(bundle['pages'])} pages, {len(bundle['sheets'])} Word sheets")
if bundle["hub"].get("siteId") != SITE_ID:
    print(f"[WARN] The bundle was built for site {bundle['hub'].get('siteId')}, not {SITE_ID}.")

try:
    with open(STATE_PATH) as f:
        state = json.load(f)
    print(f"[ok] Found {STATE_PATH}: {len(state.get('pages', {}))} pages, {len(state.get('sheets', {}))} Word items from earlier runs")
except FileNotFoundError:
    state = {}
    print("[ok] First run: no state file yet")
state.setdefault("siteId", SITE_ID)
state.setdefault("pages", {})
state.setdefault("sheets", {})


def save_state():
    with open(STATE_PATH, "w") as f:
        json.dump(state, f, indent=2)


# %% CELL 3 — PLAN: work out what will be created, updated and registered. No writes.
def owned(item_id):
    """The item, if it exists and belongs to you."""
    if not item_id:
        return None
    try:
        it = gis.content.get(item_id)
    except Exception:
        return None
    return it if (it is not None and it.owner == me) else None


def by_keyword(keyword, item_type, anyone=False):
    """Items carrying a type keyword. Search can lag a few minutes behind new items."""
    q = f'typekeywords:"{keyword}"' + ("" if anyone else f' owner:"{me}"')
    try:
        found = gis.content.search(q, item_type=item_type, max_items=50)
    except Exception as e:
        print(f"[WARN] Search failed for {keyword}: {e}")
        return []
    return [x for x in found if keyword.lower() in [k.lower() for k in (x.typeKeywords or [])]]


registered = {p.get("slug"): p for p in sdata["values"].get("pages", [])}
sheet_plan, page_plan, problems = [], [], []

for s in bundle["sheets"]:
    it = owned(state["sheets"].get(s["key"]))
    if it is None:
        hits = by_keyword(s["keyword"], "Microsoft Word")
        if len(hits) > 1:
            problems.append(f"{len(hits)} Word items carry {s['keyword']}: {[h.id for h in hits]}. Using the first.")
        it = hits[0] if hits else None
    sheet_plan.append({"sheet": s, "item": it})
    print(f"[plan] {'update' if it else 'create'} Word item: {s['title']}" + (f"  ({it.id})" if it else ""))

for p in bundle["pages"]:
    slug = p["slug"]
    reg = registered.get(slug)
    it = owned(state["pages"].get(slug)) or (owned(reg.get("id")) if reg else None)
    if it is None:
        mine = by_keyword("mmlPage-" + slug, "Hub Page")
        it = mine[0] if mine else None
    conflict = None
    if reg and (it is None or reg.get("id") != it.id):
        conflict = f"/pages/{slug} is already registered on this site to item {reg.get('id')}, which this script didn't make."
    else:
        for other in by_keyword(f"slug|{KEY}|{slug}", "Hub Page", anyone=True):
            if it is None or other.id != it.id:
                conflict = f"Another Hub page in the organization already uses the slug {slug}: {other.id} ({other.title}, owner {other.owner})."
                break
    page_plan.append({"page": p, "item": it, "conflict": conflict})
    if conflict:
        problems.append(conflict)
        print(f"[skip] /pages/{slug}: {conflict}")
    else:
        print(f"[plan] {'update' if it else 'create'} Hub page /pages/{slug}: {p['title']}" + (f"  ({it.id})" if it else ""))
        print(f"[plan] {'already registered' if reg else 'register'}: /pages/{slug}")

# Site colours: only the keys in the bundle change; everything else in the theme (fonts, logo...) stays.
WANT_THEME = (bundle["hub"].get("theme") or {}) if SET_COLOURS else {}
# Hub's own default theme (DEFAULT_THEME in Esri's hub.js), used only if the site has no theme saved at all.
HUB_DEFAULT_THEME = {"header": {"background": "#fff", "text": "#4c4c4c"}, "body": {"background": "#fff", "text": "#4c4c4c", "link": "#0079c1"},
                     "button": {"background": "#0079c1", "text": "#fff"}, "logo": {"small": ""},
                     "fonts": {"base": {"url": "", "family": "Avenir Next"}, "heading": {"url": "", "family": "Avenir Next"}}}


def with_colours(theme):
    """A copy of the theme with the bundle's colours set."""
    out = json.loads(json.dumps(theme if isinstance(theme, dict) and theme else HUB_DEFAULT_THEME))
    for part, vals in WANT_THEME.items():
        if isinstance(vals, dict):
            if not isinstance(out.get(part), dict):
                out[part] = {}
            out[part].update(vals)
    return out


colour_changes = []
if WANT_THEME:
    now_theme = sdata["values"].get("theme") if isinstance(sdata["values"].get("theme"), dict) else {}
    for part, vals in WANT_THEME.items():
        for k, v in vals.items():
            old = (now_theme.get(part) or {}).get(k)
            if str(old).lower() != str(v).lower():
                colour_changes.append(f"{part} {k}: {old} -> {v}")
                print(f"[plan] site colour, {part} {k}: {old} -> {v}")
    if not colour_changes:
        print("[plan] site colours already match the bundle")
    for name, d in drafts.items():
        dt = ((d.get("data") or {}).get("values") or {}).get("theme")
        if isinstance(dt, dict) and with_colours(dt) != dt:
            print(f"[plan] set the same colours in the editor draft {name}, so publishing it later keeps them")
elif SET_COLOURS:
    print("[skip] This bundle has no site colours (it was built before resource pages 0.5.0)")
else:
    print("[skip] SET_COLOURS is False: the site's colours are left as they are")

print()
print(f"Plan: {sum(1 for e in sheet_plan if e['item'] is None)} Word items to create, {sum(1 for e in sheet_plan if e['item'])} to update; "
      f"{sum(1 for e in page_plan if e['item'] is None and not e['conflict'])} pages to create, "
      f"{sum(1 for e in page_plan if e['item'] and not e['conflict'])} to update; {len(colour_changes)} site colours to change; sharing with {SHARE_WITH}.")
if problems:
    print("\nPROBLEMS (pages with a conflict are skipped):")
    for x in problems:
        print("  [WARN]", x)
else:
    print("No conflicts.")


# %% CELL 4 — WRITE. Only when DRY_RUN = False, after the plan looks right and the backup is downloaded.
def share(item):
    """Share an item with everyone or the organization. Works with old and new ArcGIS API for Python."""
    level = "EVERYONE" if SHARE_WITH == "everyone" else "ORGANIZATION"
    try:
        item.sharing.sharing_level = level
        return True
    except Exception:
        pass
    try:
        item.share(everyone=(SHARE_WITH == "everyone"), org=True)
        return True
    except Exception as e:
        print(f"[WARN] Couldn't share {item.id}: {e}")
        return False


def add_file_item(props, path):
    """Add an item with a file. Uses the older call first, then the newer folder call."""
    try:
        return gis.content.add(item_properties=props, data=path)
    except Exception as first:
        try:
            return gis.content.folders.get().add(item_properties=props, file=path).result()
        except Exception as second:
            raise RuntimeError(f"Couldn't add {props.get('title')}: {first} / {second}")


def data_url(item_id):
    return f"{gis.url.rstrip('/')}/sharing/rest/content/items/{item_id}/data"


if DRY_RUN:
    print("\n[skip] DRY_RUN is True, so nothing was written.")
    print("       If the plan above looks right, set DRY_RUN = False at the top and run it again.")
else:
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")
    work = tempfile.mkdtemp()
    sheet_urls, written = {}, []

    # 0. Download every Word sheet first, so a download problem stops the run before anything on the Hub changes
    for e in sheet_plan:
        s = e["sheet"]
        with open(os.path.join(work, s["fileName"]), "wb") as f:
            f.write(fetch(s["url"], s["fileName"]).content)
    print(f"[ok] downloaded {len(sheet_plan)} Word sheets from GitHub")

    # 1. Word items
    for e in sheet_plan:
        s, it = e["sheet"], e["item"]
        local = os.path.join(work, s["fileName"])
        props = {"title": s["title"], "snippet": s["snippet"], "description": s["description"], "tags": ",".join(s["tags"])}
        if it is None:
            props.update({"type": "Microsoft Word", "typeKeywords": s["keyword"]})
            it = add_file_item(props, local)
            print(f"[ok] created Word item {it.id}: {s['title']}")
        else:
            props["typeKeywords"] = ",".join(sorted(set((it.typeKeywords or []) + [s["keyword"]])))
            ok = it.update(item_properties=props, data=local)
            print(f"[ok] updated Word item {it.id}: {s['title']}" if ok else f"[ERR] couldn't update Word item {it.id}")
        share(it)
        state["sheets"][s["key"]] = it.id
        sheet_urls[s["key"]] = data_url(it.id)
        save_state()

    # 2. Hub pages
    for e in page_plan:
        p, it = e["page"], e["item"]
        if e["conflict"]:
            print(f"[skip] /pages/{p['slug']}: {e['conflict']}")
            continue
        text = json.dumps(p["layout"])
        for k, u in sheet_urls.items():
            text = text.replace("{{SHEET:" + k + "}}", u)
        left = sorted(set(re.findall(r"\{\{SHEET:[^}]+\}\}", text)))
        if left:
            print(f"[WARN] /pages/{p['slug']}: no Word item for {left}")
        data = {"values": {"layout": json.loads(text), "title": p["title"],
                           "sites": [{"id": SITE_ID, "title": site.title}],
                           "slug": p["slug"], "updatedAt": now, "updatedBy": me}}
        kws = ["Hub", "hubPage", "OpenData", f"slug|{KEY}|{p['slug']}", "mmlPage-" + p["slug"]]
        pprops = {"slug": f"{KEY}|{p['slug']}", "schemaVersion": 1.1, "orgUrlKey": KEY}
        common = {"f": "json", "title": p["title"], "snippet": p["summary"][:250], "tags": ",".join(p["tags"]), "text": json.dumps(data)}
        if it is None:
            res = gis._con.post(f"{REST}/content/users/{me}/addItem",
                                dict(common, type="Hub Page", typeKeywords=",".join(kws), properties=json.dumps(pprops)))
            if not res.get("success"):
                print(f"[ERR] couldn't create /pages/{p['slug']}: {res}")
                continue
            it = gis.content.get(res["id"])
            print(f"[ok] created Hub page {it.id}: /pages/{p['slug']}")
        else:
            keep = [k for k in (it.typeKeywords or []) if not k.lower().startswith("slug|")]
            merged = dict(it.properties or {})
            merged.update(pprops)
            res = gis._con.post(f"{REST}/content/users/{it.owner}/items/{it.id}/update",
                                dict(common, typeKeywords=",".join(sorted(set(keep + kws))), properties=json.dumps(merged)))
            if not res.get("success"):
                print(f"[ERR] couldn't update /pages/{p['slug']}: {res}")
                continue
            print(f"[ok] updated Hub page {it.id}: /pages/{p['slug']}")
        share(it)
        state["pages"][p["slug"]] = it.id
        save_state()
        written.append((p["slug"], it.id, p["title"]))

    # 3. Register the pages and set the colours on the site (re-read it first, so nothing else is lost)
    fresh = site.get_data()
    if isinstance(fresh, str):
        fresh = json.loads(fresh)
    reg_pages = fresh.setdefault("values", {}).setdefault("pages", [])
    changed = False
    for slug, pid, title in written:
        entry = next((x for x in reg_pages if x.get("slug") == slug), None)
        if entry is None:
            reg_pages.append({"id": pid, "title": title, "slug": slug})
            changed = True
            print(f"[ok] registered /pages/{slug}")
        elif entry.get("id") != pid:
            print(f"[WARN] /pages/{slug} is registered to another item ({entry.get('id')}); left as it is.")
        else:
            if entry.get("title") != title:
                entry["title"] = title
                changed = True
            print(f"[skip] /pages/{slug} already registered")
    if WANT_THEME:
        new_theme = with_colours(fresh["values"].get("theme"))
        if new_theme != fresh["values"].get("theme"):
            fresh["values"]["theme"] = new_theme
            changed = True
            print("[ok] set the site colours: header, menu bar, buttons, links")
    if changed:
        ok = site.update(data=fresh)
        if not ok:
            res = gis._con.post(f"{REST}/content/users/{site.owner}/items/{site.id}/update", {"f": "json", "text": json.dumps(fresh)})
            ok = bool(res.get("success"))
        print("[ok] saved the site's pages list and colours" if ok else "[ERR] couldn't save the site's pages list and colours")

    # 4. The same colours in the editor's draft, if there is one (only a draft that already holds colours)
    for name, d in drafts.items():
        vals = (d.get("data") or {}).get("values") or {}
        if not WANT_THEME or not isinstance(vals.get("theme"), dict):
            continue
        new_theme = with_colours(vals["theme"])
        if new_theme == vals["theme"]:
            print(f"[skip] the editor draft {name} already has the colours")
            continue
        vals["theme"] = new_theme
        res = gis._con.post(f"{REST}/content/users/{site.owner}/items/{site.id}/updateResources",
                            {"f": "json", "fileName": name, "text": json.dumps(d)})
        print(f"[ok] set the colours in the editor draft {name}" if res.get("success") else f"[ERR] couldn't update the editor draft {name}: {res}")
    print("\nPublished. Checking...")


# %% CELL 5 — CHECK, then republish by hand
if not DRY_RUN:
    check = site.get_data()
    if isinstance(check, str):
        check = json.loads(check)
    regs = {x.get("slug"): x.get("id") for x in check["values"].get("pages", [])}
    all_ok = True
    for p in bundle["pages"]:
        slug, pid = p["slug"], state["pages"].get(p["slug"])
        it = gis.content.get(pid) if pid else None
        if it is None:
            print(f"[ERR] /pages/{slug}: no page item"); all_ok = False; continue
        d = it.get_data()
        d = json.loads(d) if isinstance(d, str) else d
        linked = any(s.get("id") == SITE_ID for s in d.get("values", {}).get("sites", []))
        good = regs.get(slug) == pid and linked and it.access in ("public", "org")
        all_ok = all_ok and good
        print(f"[{'ok' if good else 'ERR'}] /pages/{slug}: registered={regs.get(slug) == pid}, linked to site={linked}, shared={it.access}")
    for key, sid in state["sheets"].items():
        it = gis.content.get(sid)
        print(f"[{'ok' if it is not None and it.access in ('public', 'org') else 'ERR'}] Word item {key}: {sid} ({it.access if it else 'missing'})")
    if WANT_THEME:
        th = check["values"].get("theme") or {}
        miss = [f"{part} {k}" for part, vals in WANT_THEME.items() for k, v in vals.items() if str((th.get(part) or {}).get(k)).lower() != str(v).lower()]
        all_ok = all_ok and not miss
        print(f"[{'ERR' if miss else 'ok'}] site colours: " + (f"not set: {', '.join(miss)}" if miss else json.dumps(colours(th))))

    print("\nNEXT, by hand (a few minutes):")
    print("  1. Republish the site: open it in your Hub workspace, choose Edit layout, then Save/Publish.")
    print("     Republishing is what made /pages/ addresses work on the Support Hub in July. The header")
    print("     should already be blue in the editor; if it isn't, don't publish, and send the output above.")
    print("  2. Add a 'Lessons' link to the site's header menu, pointing to /pages/lessons.")
    print("  3. In a private browser window, open:")
    for p in bundle["pages"]:
        print(f"       {SITE_URL}/pages/{p['slug']}")
    print("\nAll checks passed." if all_ok else "\nSome checks failed: see [ERR] lines above.")


# %% CELL 6 — UNDO (emergency only). Uncomment to use.
# Restores the site's data (pages list and colours) and any editor draft from this run's backups,
# and deletes the pages and Word items this script made.
#
# with open(BACKUP_PATH) as f:
#     site.update(data=json.load(f))
# for name in drafts:   # the editor draft, as it was before this run
#     with open(os.path.join(BACKUP_DIR, f"site_{SITE_ID}_{stamp}_{name}")) as f:
#         print("restoring draft", name, gis._con.post(f"{REST}/content/users/{site.owner}/items/{site.id}/updateResources",
#                                                      {"f": "json", "fileName": name, "text": f.read()}))
# for pid in state["pages"].values():
#     it = gis.content.get(pid)
#     if it is not None and it.owner == me:
#         print("deleting page", pid, it.delete())
# for sid in state["sheets"].values():
#     it = gis.content.get(sid)
#     if it is not None and it.owner == me:
#         print("deleting Word item", sid, it.delete())
# state = {"siteId": SITE_ID, "pages": {}, "sheets": {}}
# save_state()
