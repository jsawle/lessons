# make_lab_portfolio.py  ·  v1.0
# Run in an ArcGIS Notebook (Python 3, ArcGIS API for Python) signed in as yourself.
#
# Makes a LAB COPY of a lesson Portfolio Instant App with a new tab that opens the
# Lesson Player game. The original Portfolio is only READ, never changed.
# The copy is created PRIVATE in your own content; share it yourself when ready.
#
# Created by Jason Sawle

import copy, json, time, warnings
from arcgis.gis import GIS

# ---------------- settings ----------------
SOURCE_PORTFOLIO_ID = "e49c168414614b6bad44180061110845"   # Climate Regions Uncovered (original, read-only)
GAME_URL            = "https://jsawle.github.io/lessons/"  # Lesson Player (student view)
TAB_TITLE           = "Mystery Place"
TAB_TEXT            = ("Play Mystery Place: use the climate clues and the map layers to track down the mystery place. "
                       "When you finish a round, open MapMaker to keep investigating.")
INSERT_AFTER_TITLE  = "Inquiry 4"   # new tab goes after this tab; if not found, it goes before "Teacher Guide" or at the end
LAB_SUFFIX          = " (LAB – Mystery Place)"
DRY_RUN             = False         # True = only print the new tab order, create nothing
# ------------------------------------------

gis = GIS("home")
src = gis.content.get(SOURCE_PORTFOLIO_ID)
if src is None:
    raise SystemExit("Source Portfolio not found or not shared with you: " + SOURCE_PORTFOLIO_ID)
data = src.get_data()
if not isinstance(data, dict) or "values" not in data or "itemCollection" not in data["values"]:
    raise SystemExit("That item does not look like a Portfolio Instant App config.")

cfg = copy.deepcopy(data)
items = cfg["values"]["itemCollection"]

# Model the new tab on an existing tab that was added as a URL, so it has every key the builder writes.
template = next((t for t in items if t.get("addType") == "url" and str(t.get("id", "")).endswith("-url")), None) \
        or next((t for t in items if t.get("addType") == "url"), None)
if template is None:
    raise SystemExit("No URL tab to model the new tab on. Add the tab by hand in the Portfolio builder instead (Add item > URL).")

stamp = str(int(time.time() * 1000))
tab = copy.deepcopy(template)
tab.update({
    "_uid": stamp[-11:],
    "editorID": stamp,
    "id": stamp + "-url",
    "title": TAB_TITLE,
    "url": GAME_URL,
    "description": ('<h2><span style="color:hsl(0, 0%, 100%);"><strong>' + TAB_TEXT + '</strong></span></h2>'),
    "visible": True,
    "hideDescription": False,
    "customThumbnail": False,
})

titles = [t.get("title") for t in items]
if TAB_TITLE in titles:
    raise SystemExit("A tab called '" + TAB_TITLE + "' already exists in the source. Nothing done.")
if INSERT_AFTER_TITLE in titles:
    pos = titles.index(INSERT_AFTER_TITLE) + 1
elif "Teacher Guide" in titles:
    pos = titles.index("Teacher Guide")
else:
    pos = len(items)
items.insert(pos, tab)

cfg["values"]["title"] = (cfg["values"].get("title") or src.title).strip() + " (LAB)"

print("Tab order in the lab copy:")
for i, t in enumerate(items, 1):
    print(f"  {i}. {t.get('title')}" + ("   <-- new" if t is tab else ""))
print("New tab modelled on:", template.get("title"), "| type:", tab.get("type"))

if DRY_RUN:
    raise SystemExit("DRY_RUN is True: nothing created.")

props = {
    "type": "Web Mapping Application",
    "title": src.title + LAB_SUFFIX,
    "snippet": "LAB copy of '" + src.title + "' with a Mystery Place game tab. Original: " + SOURCE_PORTFOLIO_ID,
    "description": "<p>Lab copy for testing the Lesson Player game inside the lesson Portfolio. "
                   "Original Portfolio item: " + SOURCE_PORTFOLIO_ID + ". Do not use with classes yet.</p>",
    "tags": list(dict.fromkeys((src.tags or []) + ["lab", "lesson player"])),
    "typeKeywords": list(src.typeKeywords or []),
    "accessInformation": src.accessInformation or "",
    "licenseInfo": src.licenseInfo or "",
    "text": json.dumps(cfg),
}
with warnings.catch_warnings():
    warnings.simplefilter("ignore")      # gis.content.add is deprecated in newer API versions but still works
    new = gis.content.add(item_properties=props)

host = "https://" + gis.properties.urlKey + "." + gis.properties.customBaseUrl
new.update(item_properties={"url": host + "/apps/instant/portfolio/index.html?appid=" + new.id})

try:   # copy the thumbnail if there is one
    thumb = src.download_thumbnail()
    if thumb:
        new.update(thumbnail=thumb)
except Exception as e:
    print("Thumbnail not copied:", e)

print()
print("Created (private):", new.title)
print("Item page:", host + "/home/item.html?id=" + new.id)
print("Open app: ", host + "/apps/instant/portfolio/index.html?appid=" + new.id)
print("The original Portfolio was not changed.")
