#!/usr/bin/env python3
"""Truman 1918 line trace 1.1: re-traces nine dated Western Front lines of June to October 1918 from the Truman
Library series "Length of front occupied by Belgian, French, British and American forces" (Map Room, G-3, General
Headquarters, American Expeditionary Forces; 1:600,000; public domain).

  WFL_1918_06_10  M557  June 10, 1918        WFL_1918_07_30  M562  July 30, 1918
  WFL_1918_06_28  M559  June 28, 1918        WFL_1918_08_20  M564  August 20, 1918
  WFL_1918_07_10  M560  July 10, 1918        WFL_1918_09_10  M566  September 10, 1918
  WFL_1918_07_20  M561  July 20, 1918        WFL_1918_09_20  M567  September 20, 1918 (1.1)
                                             WFL_1918_10_30  M571  October 30, 1918

How: all nine maps are drawn on the same printed base map. M562 is placed on the ground with an affine fit from 29
town control points (pixels below, positions from GeoNames in western-front-lines.json); each other map is matched to
M562 by SIFT features on the base map and a 2nd-order polynomial through the matches. On each map the front is a black
ink line along a coloured band; dark, grey pixels are masked as ink and a least-cost path follows the ink from the
line's top-left end to its bottom-right end. Simplified to 500 m in ETRS89-LAEA.

  python3 maps/data/ww1/trace_truman_1918.py DIR            print the result for each line
  python3 maps/data/ww1/trace_truman_1918.py DIR --write    also replace the nine lines' coordinates

DIR holds the images as M557.jpg ... M571.jpg (M557, M559, M560, M561, M562, M564, M566, M567, M571) (or .png), from
https://www.trumanlibrary.gov/sites/default/files/maps/M557.jpg (and so on). The script refuses an image of another size.
Needs: numpy, opencv-python (4.4 or later, for SIFT), scikit-image, shapely, pyproj.
"""
import json, sys
from pathlib import Path
import numpy as np, cv2
from skimage.graph import route_through_array
from shapely.geometry import LineString
from pyproj import Transformer

VERSION = "1.1"
HERE = Path(__file__).resolve().parent
REF = "M562"
MAPS = {"WFL_1918_06_10": ("M557", (2096, 1543)), "WFL_1918_06_28": ("M559", (2109, 1536)), "WFL_1918_07_10": ("M560", (1744, 1528)),
        "WFL_1918_07_20": ("M561", (2039, 1840)), "WFL_1918_07_30": ("M562", (2147, 2097)), "WFL_1918_08_20": ("M564", (1963, 2049)),
        "WFL_1918_09_10": ("M566", (1727, 1529)), "WFL_1918_09_20": ("M567", (1726, 1518)),
        "WFL_1918_10_30": ("M571", (1310, 1433))}


def load(d, mid, size):
    for ext in ("jpg", "png"):
        p = Path(d) / f"{mid}.{ext}"
        if p.exists():
            im = cv2.imread(str(p))
            if (im.shape[1], im.shape[0]) != size: sys.exit(f"Not traced: {p.name} must be {size[0]} x {size[1]} px.")
            return im
    sys.exit(f"Not traced: {mid}.jpg not found in {d}.")


def ink(im):
    c = im.astype(int); mx, mn = c.max(2), c.min(2)
    return ((mx < 95) & (mx - mn < 40)).astype(np.uint8)


def trace(im, off=40.0):
    m = ink(im)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = [i for i in range(1, n) if max(st[i, 2], st[i, 3]) > 120]  # long strokes: the line, not lettering
    ys, xs = np.nonzero(np.isin(lab, keep))
    a, b = np.argmin(xs + ys), np.argmax(xs + ys)
    p, _ = route_through_array(np.where(m > 0, 1.0, off), (ys[a], xs[a]), (ys[b], xs[b]), fully_connected=True, geometric=True)
    p = np.array(p); return p[:, ::-1].astype(float), m[p[:, 0], p[:, 1]].mean()


def P2(X):
    x, y = X[:, 0] / 1000, X[:, 1] / 1000; return np.c_[np.ones_like(x), x, y, x * x, x * y, y * y]


def to_ref(im, ref):
    sift = cv2.SIFT_create(nfeatures=20000)
    k1, d1 = sift.detectAndCompute(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), None)
    k2, d2 = sift.detectAndCompute(cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY), None)
    good = [a for a, b in cv2.BFMatcher().knnMatch(d1, d2, k=2) if a.distance < 0.75 * b.distance]
    s = np.float32([k1[g.queryIdx].pt for g in good]); t = np.float32([k2[g.trainIdx].pt for g in good])
    _, inl = cv2.estimateAffine2D(s, t, ransacReprojThreshold=4, maxIters=20000); inl = inl.ravel().astype(bool)
    c = np.linalg.lstsq(P2(s[inl]), t[inl], rcond=None)[0]
    r = np.linalg.norm(P2(s[inl]) @ c - t[inl], axis=1)
    return c, int(inl.sum()), float(np.sqrt((r ** 2).mean()))


def main():
    d = sys.argv[1]
    facts = json.loads((HERE / "western-front-lines.json").read_text(encoding="utf-8"))
    by_id = {l["id"]: l for l in facts["lines"]}
    cp = by_id["WFL_1918_07_30"]["controlPoints"]; names = list(cp["pixels"])
    to, back = Transformer.from_crs(4326, 3035, always_xy=True), Transformer.from_crs(3035, 4326, always_xy=True)
    X = np.array([cp["pixels"][n] for n in names], float); E = np.c_[to.transform(*np.array([cp["lonLat"][n] for n in names]).T)]
    A = np.c_[np.ones(len(X)), X]; C = np.linalg.lstsq(A, E, rcond=None)[0]
    res = np.linalg.norm(A @ C - E, axis=1) / 1000
    print(f"Truman 1918 line trace {VERSION} | {REF} control points: {len(names)}, RMS {np.sqrt((res ** 2).mean()):.2f} km")
    ref = load(d, REF, MAPS["WFL_1918_07_30"][1])
    for lid, (mid, size) in MAPS.items():
        im = ref if mid == REF else load(d, mid, size)
        xy, on = trace(im)
        if mid != REF:
            c, ninl, rms = to_ref(im, ref); xy = P2(xy) @ c
            print(f"  {mid} matched to {REF}: {ninl} features, RMS {rms:.2f} px")
        e = np.c_[np.ones(len(xy)), xy] @ C
        ls = LineString(e).simplify(500)
        ll = [[round(x, 5), round(y, 5)] for x, y in zip(*back.transform(*np.array(ls.coords).T))]
        print(f"  {lid} ({mid}): {len(ll)} points, {ls.length / 1000:.0f} km, {on:.1%} of the path on ink")
        if "--write" in sys.argv: by_id[lid]["coordinates"] = ll
    if "--write" in sys.argv:
        (HERE / "western-front-lines.json").write_text(json.dumps(facts, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print("  written to western-front-lines.json")


if __name__ == "__main__":
    main()
