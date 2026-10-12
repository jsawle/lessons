# =====================================================================
# PUBLISH MAPMAKER LESSONS TO THE HUB (demo)          publisher v1.0
# MapMaker resource pages 0.3.0. Created by Jason Sawle.
#
# Run in an ArcGIS Notebook, signed in as the account that owns the
# site (GIS-4-Schools). Run cell by cell. NOTHING is written until
# CELL 4, and CELL 4 only writes when DRY_RUN = False.
#
# What it does
#   1. Backs up the site's data (CELL 1).
#   2. Reads hub-bundle.json, built on GitHub from the lesson files.
#   3. Uploads each student sheet as a Word item (English, Spanish).
#   4. Creates or updates one Hub Page per lesson, plus a Lessons page.
#   5. Registers every page in the site's pages list. This is the step
#      that makes /pages/<slug> addresses and menu links work.
#   6. Shares everything.
# Afterwards: republish the site in the site editor (CELL 5 says how).
#
# Safe to run again: it updates the pages and Word items it made last
# time (it remembers them in mml_hub_state.json) instead of adding new
# ones.
# =====================================================================


# %% CELL 0 — Settings (run again after changing DRY_RUN)
SITE_ID    = "9c39add73ebf47068e1dac37f6353b8d"   # MapMaker Lessons, gis-4-schools.hub.arcgis.com
BUNDLE_URL = "https://jsawle.github.io/lessons/resources/dist/hub-bundle.json"
DRY_RUN    = True          # set to False when the plan in CELL 3 looks right
SHARE_WITH = "everyone"    # "everyone" (public) or "org"

import os
HOME = "/arcgis/home" if os.path.isdir("/arcgis/home") else os.getcwd()
STATE_PATH = os.path.join(HOME, "mml_hub_state.json")
BACKUP_DIR = os.path.join(HOME, "mml_backups")
BUNDLE_URL = os.environ.get("MML_BUNDLE_URL", BUNDLE_URL)
print(f"DRY_RUN = {DRY_RUN}. Files go in {HOME}.")


# %% CELL 1 — Connect, read the site, BACK IT UP
from arcgis.gis import GIS
import json, datetime, tempfile, re, requests

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

pages_now = sdata["values"].get("pages", [])
print(f"[ok] Signed in as {me}. Org URL key: {KEY}")
print(f"[ok] Site: {site.title} ({site.type}), owner {site.owner}")
print(f"[ok] Site address: {SITE_URL}")
print(f"[ok] Backup written: {BACKUP_PATH}  <- download it from the Files pane before CELL 4")
print(f"[ok] Pages registered now: {len(pages_now)}")
for p in pages_now:
    print(f"       /pages/{p.get('slug')} -> {p.get('id')}")
if site.owner != me:
    print("[WARN] You are not the site's owner, so saving the site in CELL 4 may fail.")
if not KEY:
    print("[WARN] No org URL key found; page slugs need it. STOP and check gis.properties.")


# %% CELL 2 — Read the lesson bundle from GitHub
r = requests.get(BUNDLE_URL, timeout=60)
r.raise_for_status()
bundle = r.json()
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


# %% CELL 3 — DRY RUN: work out what will be created, updated and registered. No writes.
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

print()
print(f"Plan: {sum(1 for e in sheet_plan if e['item'] is None)} Word items to create, {sum(1 for e in sheet_plan if e['item'])} to update; "
      f"{sum(1 for e in page_plan if e['item'] is None and not e['conflict'])} pages to create, "
      f"{sum(1 for e in page_plan if e['item'] and not e['conflict'])} to update; sharing with {SHARE_WITH}.")
if problems:
    print("\nPROBLEMS (pages with a conflict are skipped):")
    for x in problems:
        print("  [WARN]", x)
else:
    print("No conflicts.")


# %% CELL 4 — WRITE. Only when DRY_RUN = False, after CELL 3 looks right and the backup is downloaded.
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
    print("[skip] DRY_RUN is True, so nothing was written.")
    print("       When CELL 3 looks right: set DRY_RUN = False in CELL 0, run CELL 0, then run this cell.")
else:
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")
    work = tempfile.mkdtemp()
    sheet_urls, written = {}, []

    # 1. Word items
    for e in sheet_plan:
        s, it = e["sheet"], e["item"]
        local = os.path.join(work, s["fileName"])
        rr = requests.get(s["url"], timeout=60)
        rr.raise_for_status()
        with open(local, "wb") as f:
            f.write(rr.content)
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

    # 3. Register the pages on the site (re-read it first, so nothing else is lost)
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
    if changed:
        ok = site.update(data=fresh)
        if not ok:
            res = gis._con.post(f"{REST}/content/users/{site.owner}/items/{site.id}/update", {"f": "json", "text": json.dumps(fresh)})
            ok = bool(res.get("success"))
        print("[ok] saved the site's pages list" if ok else "[ERR] couldn't save the site's pages list")
    print("\nDone. Run CELL 5 to check, then republish the site.")


# %% CELL 5 — CHECK, then republish by hand
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

print("\nNEXT, by hand (a few minutes):")
print("  1. Republish the site: open it in your Hub workspace, choose Edit layout, then Save/Publish.")
print("     Republishing is what made /pages/ addresses work on the Support Hub in July.")
print("  2. Add a 'Lessons' link to the site's header menu, pointing to /pages/lessons.")
print("  3. In a private browser window, open:")
for p in bundle["pages"]:
    print(f"       {SITE_URL}/pages/{p['slug']}")
print("\nAll checks passed." if all_ok else "\nSome checks failed: see [ERR] lines above.")


# %% CELL 6 — UNDO (emergency only). Uncomment to use.
# Restores the site's data from the backup, and deletes the pages and Word items this script made.
#
# with open(BACKUP_PATH) as f:
#     site.update(data=json.load(f))
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
