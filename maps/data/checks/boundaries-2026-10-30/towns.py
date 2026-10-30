import json,sys,urllib.parse,urllib.request,time
from shapely.geometry import shape, Point
g=json.load(open(sys.argv[1]))
polys={}
for f in g['features']:
    polys.setdefault(f['properties']['CessNum'],[]).append(shape(f['geometry']))
cache={}
try: cache=json.load(open('geocache.json'))
except: pass
def geo(t):
    if t in cache: return cache[t]
    u="https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine="+urllib.parse.quote(t)+"&maxLocations=1&f=json"
    c=json.load(urllib.request.urlopen(u,timeout=20))['candidates'][0]
    cache[t]=[c['location']['x'],c['location']['y'],c['address']]; json.dump(cache,open('geocache.json','w')); return cache[t]
for line in open(sys.argv[2]):
    line=line.strip()
    if not line or line.startswith('#'): continue
    town,expect=[s.strip() for s in line.split('|')]
    x,y,addr=geo(town)
    inside=[n for n,ps in polys.items() if any(p.contains(Point(x,y)) for p in ps)]
    ok = expect in inside if expect!='-' else None
    print(f"{town:28s} plate:{expect:5s} layer:{','.join(sorted(inside,key=int)) or 'none':18s} {'OK' if ok else ('--' if ok is None else 'DIFF')}  ({addr}, {x:.3f},{y:.3f})")
