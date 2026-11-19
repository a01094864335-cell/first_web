"""Authoritative normalized café geometry, shared layout with browser/demo."""
import json, math
from pathlib import Path
from functools import lru_cache
from collections import deque
LAYOUT_PATH=Path(__file__).parent/'public/assets/cafe-map/layout.json'
CLEARANCE=.015
SCALE=100

def grid(p):return (math.floor(p['x']*SCALE+.5),math.floor(p['y']*SCALE+.5))
def point(p):return {'x':p[0]/SCALE,'y':p[1]/SCALE}
@lru_cache(maxsize=1)
def layout():
 data=json.loads(LAYOUT_PATH.read_text())
 validate(data)
 return data

def obstacles(data=None):return [o['collision'] for o in (data or layout())['objects'] if o.get('collision')]
def blocked(x,y,data=None):
 d=data or layout()
 if not all(isinstance(v,(float,int)) and math.isfinite(v) for v in (x,y)):return True
 a,b,w,h=d['bounds']
 return not (a<=x<=a+w and b<=y<=b+h) or any(a-CLEARANCE<=x<=a+w+CLEARANCE and b-CLEARANCE<=y<=b+h+CLEARANCE for a,b,w,h in obstacles(d))
def reachable(data=None):
 d=data or layout();start=grid(d['spawn']);parents={start:None};queue=deque([start])
 if blocked(*[v/SCALE for v in start],d):raise ValueError('Map spawn is blocked')
 while queue:
  x,y=queue.popleft()
  for p in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
   if p not in parents and not blocked(p[0]/SCALE,p[1]/SCALE,d):parents[p]=(x,y);queue.append(p)
 return parents
@lru_cache(maxsize=1)
def reachable_live():return reachable(layout())
def normalize_position(p,data=None):
 d=data or layout();cells=reachable(data) if data is not None else reachable_live()
 if blocked(p.get('x'),p.get('y'),d) or grid(p) not in cells:return point(grid(d['spawn']))
 return {'x':p['x'],'y':p['y']}
def route(start,end,data=None):
 d=data or layout()
 if blocked(end.get('x'),end.get('y'),d):raise ValueError('가구나 벽이 있는 곳은 이동할 수 없어요')
 start=grid(normalize_position(start,data));goal=grid(end)
 if blocked(goal[0]/SCALE,goal[1]/SCALE,d):raise ValueError('가구나 벽이 있는 곳은 이동할 수 없어요')
 parents={start:None};queue=deque([start])
 while queue and goal not in parents:
  x,y=queue.popleft()
  for p in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
   if p not in parents and not blocked(p[0]/SCALE,p[1]/SCALE,d):parents[p]=(x,y);queue.append(p)
 if goal not in parents:raise ValueError('이곳으로 가는 길을 찾을 수 없어요')
 out=[];p=goal
 while p is not None:out.append(point(p));p=parents[p]
 return out[::-1]
def validate(d):
 def rect(r):
  if not isinstance(r,list) or len(r)!=4 or not all(type(v) in (int,float) and math.isfinite(v) for v in r) or min(r)<0 or r[2]<=0 or r[3]<=0 or r[0]+r[2]>1.000001 or r[1]+r[3]>1.000001:raise ValueError('Invalid map rectangle')
 if not d.get('version') or not isinstance(d.get('objects'),list):raise ValueError('Invalid map layout')
 rect(d['bounds']);ids=set()
 for o in d['objects']:
  if o['id'] in ids:raise ValueError('Duplicate map object')
  ids.add(o['id']);rect([o[k] for k in ('x','y','width','height')])
  if o.get('collision'):rect(o['collision'])
 cells=reachable(d)
 for o in d['objects']:
  if o.get('interaction'):
   p=o['interaction']['anchor']
   if blocked(p['x'],p['y'],d) or grid(p) not in cells:raise ValueError('Unreachable interaction: '+o['id'])
 return d
