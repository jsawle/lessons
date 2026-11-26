#!/usr/bin/env python3
"""M1236 line trace 1.0: re-traces three Western Front lines from Truman Library map M1236, "The Western Theatre of
the European War" (B. Barrecchia, Société Editrice Géographique, Paris, 1918 edition, 1:500,000; public domain).

  WFL_1914_09    solid red    "Extreme limit of the German invasion in 1914": from the map's west edge north-east of
                              Paris along the Marne limit to the Swiss border (the part north of Paris runs off the map)
  WFL_1914_1917  dashed blue  "First line of retreat after the battle of the Marne" from Lens to the Aisne, joined to
                              the solid blue line north and east of it
  WFL_1917_1918  solid blue   "Second line after the campaigns in Flanders, Artois, Picardy, etc. Front line, February 1918"

How: the line's ink colour is masked, a least-cost path follows the ink through waypoints set on the line (below, in
image pixels), and a 2nd-order polynomial fitted to the 23 town control points in western-front-lines.json places it
on the ground. Simplified to 500 m in ETRS89-LAEA.

  python3 maps/data/ww1/trace_m1236.py M1236.jpg            print the result for each line
  python3 maps/data/ww1/trace_m1236.py M1236.jpg --write    also replace the three lines' coordinates

The image: https://www.trumanlibrary.gov/sites/default/files/maps/M1236.jpg . The waypoints and control points are in
the pixels of a 3036 x 3401 copy; the script refuses an image of another size.
Needs: numpy, opencv-python, scikit-image, shapely, pyproj.
"""
import json, sys
from pathlib import Path
import numpy as np, cv2
from skimage.graph import route_through_array
from shapely.geometry import LineString
from pyproj import Transformer

VERSION = "1.0"
HERE = Path(__file__).resolve().parent
SIZE = (3036, 3401)
WAYPOINTS = {  # (x, y) pixels on the line's ink, in order from north (or west) to the Swiss border
    "WFL_1917_1918": ("blue", [(330, 700), (410, 1340), (585, 1600), (900, 1890), (1600, 1995), (2505, 3205)]),
    "WFL_1914_1917": ("blue", [(330, 700), (395, 1000), (345, 1185), (345, 1250), (300, 1370), (290, 1450), (325, 1505), (372, 1555),
                               (368, 1640), (330, 1715), (370, 1770), (430, 1850), (500, 1870), (600, 1945), (700, 1950), (800, 1925),
                               (900, 1920), (955, 1935), (1600, 1995), (2505, 3205)]),
    "WFL_1914_09": ("red", [(82, 2160), (300, 2300), (600, 2390), (2455, 3215)]),
}


def masks(im):
    R, G, B = [im[:, :, i].astype(int) for i in (2, 1, 0)]
    out = {}
    for name, m in {"blue": (B - R > 15) & (B - G > 3) & (B < 150), "red": (R - G > 45) & (R - B > 45)}.items():
        m = cv2.morphologyEx(m.astype(np.uint8) * 255, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        out[name] = cv2.dilate((m > 0).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    return out


def snap(md, p, r=40):
    x, y = p; ys, xs = np.nonzero(md[y - r:y + r, x - r:x + r])
    i = ((xs - r) ** 2 + (ys - r) ** 2).argmin(); return (x - r + xs[i], y - r + ys[i])


def route(md, wps, gap=60.0, pad=150):
    pts, out = [snap(md, p) for p in wps], []
    for a, b in zip(pts, pts[1:]):
        x0, x1 = max(min(a[0], b[0]) - pad, 0), max(a[0], b[0]) + pad; y0, y1 = max(min(a[1], b[1]) - pad, 0), max(a[1], b[1]) + pad
        p, _ = route_through_array(np.where(md[y0:y1, x0:x1], 1.0, gap), (a[1] - y0, a[0] - x0), (b[1] - y0, b[0] - x0), fully_connected=True, geometric=True)
        p = (np.array(p)[:, ::-1] + [x0, y0]).tolist(); out.extend(p if not out else p[1:])
    return np.array(out, float)


def F(X):
    return np.c_[X[:, 0], X[:, 1], np.ones(len(X)), X[:, 0] ** 2, X[:, 0] * X[:, 1], X[:, 1] ** 2]


def main():
    im = cv2.imread(sys.argv[1])
    if im is None or (im.shape[1], im.shape[0]) != SIZE: sys.exit(f"Not traced: the image must be {SIZE[0]} x {SIZE[1]} px.")
    facts = json.loads((HERE / "western-front-lines.json").read_text(encoding="utf-8"))
    by_id = {l["id"]: l for l in facts["lines"]}
    cp = by_id["WFL_1917_1918"]["controlPoints"]; names = list(cp["pixels"])
    X = np.array([cp["pixels"][n] for n in names], float); P = np.array([cp["lonLat"][n] for n in names])
    clo = np.linalg.lstsq(F(X), P[:, 0], rcond=None)[0]; cla = np.linalg.lstsq(F(X), P[:, 1], rcond=None)[0]
    to, back = Transformer.from_crs(4326, 3035, always_xy=True), Transformer.from_crs(3035, 4326, always_xy=True)
    mk = masks(im)
    for lid, (ink, wps) in WAYPOINTS.items():
        xy = route(mk[ink], wps)
        ls = LineString(np.c_[to.transform(F(xy) @ clo, F(xy) @ cla)]).simplify(500)
        coords = [[round(a, 5), round(b, 5)] for a, b in zip(*back.transform(*zip(*ls.coords)))]
        print(f"M1236 line trace {VERSION}: {lid} {len(coords)} points, {ls.length / 1000:.0f} km")
        if "--write" in sys.argv: by_id[lid]["coordinates"] = coords
    if "--write" in sys.argv:
        (HERE / "western-front-lines.json").write_text(json.dumps(facts, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print("  written to western-front-lines.json")


if __name__ == "__main__":
    main()
