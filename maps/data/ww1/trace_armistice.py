#!/usr/bin/env python3
"""Armistice line trace 1.0: re-traces the Western Front line of 11 November 1918 from the Library of Congress scan of
the US Army (AEF GHQ G-3) "Order of Battle on Western Front, 11 A.M., Nov. 11, 1918" (g5701s.ct004277).

  1. downloads the scan at half resolution (5225 px wide) through the LOC IIIF image service
  2. masks the red ink and follows it with a least-cost path from the Dutch border to the Swiss border
  3. places it on the ground with a 2nd-order polynomial fitted to the control points in western-front-lines.json
  4. simplifies to 500 m (ETRS89-LAEA) and prints the control-point error

  python3 maps/data/ww1/trace_armistice.py            print the result
  python3 maps/data/ww1/trace_armistice.py --write    also replace the line's coordinates in western-front-lines.json

Needs: numpy, opencv-python, scikit-image, shapely, pyproj. The scan download is about 10 MB.
"""
import json, sys, urllib.request
from pathlib import Path
import numpy as np, cv2
from skimage.graph import route_through_array
from shapely.geometry import LineString
from pyproj import Transformer

VERSION = "1.0"
HERE = Path(__file__).resolve().parent
IIIF = "https://tile.loc.gov/image-services/iiif/service:gmd:gmd5:g5701:g5701s:ct004277"
START, END = (1632, 1975), (5551, 4427)   # (row, col) at half resolution: the line's Dutch-border and Swiss-border ends


def F(X):
    return np.c_[X[:, 0], X[:, 1], np.ones(len(X)), X[:, 0] ** 2, X[:, 0] * X[:, 1], X[:, 1] ** 2]


def main():
    facts = json.loads((HERE / "western-front-lines.json").read_text(encoding="utf-8"))
    ln = next(l for l in facts["lines"] if l["id"] == "WFL_1918_11_11")
    req = urllib.request.Request(f"{IIIF}/full/5225,/0/default.jpg", headers={"User-Agent": "curl/8 (lessons WWI trace)"})
    raw = urllib.request.urlopen(req, timeout=300).read()
    im = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    b, g, r = [im[:, :, i].astype(int) for i in range(3)]
    ink = ((r > 140) & (g < 110) & (b < 110) & (r - g > 70)).astype(np.uint8)
    md = cv2.dilate(ink, np.ones((7, 7), np.uint8)) > 0
    r0, c0 = min(START[0], END[0]) - 200, 1500
    cost = np.where(md[r0:max(START[0], END[0]) + 200, c0:4800], 1.0, 80.0)
    path, _ = route_through_array(cost, (START[0] - r0, START[1] - c0), (END[0] - r0, END[1] - c0), fully_connected=True, geometric=True)
    xy = (np.array(path) + [r0, c0])[:, ::-1].astype(float)

    cp = ln["controlPoints"]; names = list(cp["pixelsHalfRes"])
    X = np.array([cp["pixelsHalfRes"][n] for n in names], float); P = np.array([cp["lonLat"][n] for n in names])
    clo = np.linalg.lstsq(F(X), P[:, 0], rcond=None)[0]; cla = np.linalg.lstsq(F(X), P[:, 1], rcond=None)[0]
    res = np.c_[(F(X) @ clo - P[:, 0]) * 111.32 * np.cos(np.radians(P[:, 1])), (F(X) @ cla - P[:, 1]) * 110.6]
    rms = float(np.sqrt((res ** 2).sum(1).mean()))
    lon, lat = F(xy) @ clo, F(xy) @ cla
    to, back = Transformer.from_crs(4326, 3035, always_xy=True), Transformer.from_crs(3035, 4326, always_xy=True)
    ls = LineString(np.c_[to.transform(lon, lat)]).simplify(500)
    coords = [[round(a, 5), round(b_, 5)] for a, b_ in zip(*back.transform(*zip(*ls.coords)))]
    print(f"Armistice line trace {VERSION}: {len(coords)} points, {ls.length / 1000:.0f} km, control-point RMS {rms:.1f} km")
    if "--write" in sys.argv:
        ln["coordinates"] = coords; ln["accuracy"]["rmsKm"] = round(rms, 1)
        (HERE / "western-front-lines.json").write_text(json.dumps(facts, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print("  written to western-front-lines.json")


if __name__ == "__main__":
    main()
