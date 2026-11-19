"""Real atlas helper parity only; NOT whole browser Canvas composition parity."""
from pathlib import Path
import json, subprocess
import numpy as np
from PIL import Image
from fit_glasses_occlusion import fit_glasses_occlusion
R=Path(__file__).resolve().parents[1];m=json.loads((R/'manifest.json').read_text());items={i['id']:i for i in m['items']};cache={}
def cell(path,r,c):
 if path not in cache:cache[path]=Image.open(R/path).convert('RGBA')
 return cache[path].crop((80*c,80*r,80*c+80,80*r+80))
node=r'''const readline=require('readline'),api=require(process.argv[1]);const rl=readline.createInterface({input:process.stdin});rl.on('line',line=>{const q=JSON.parse(line),arr=s=>s?new Uint8ClampedArray(Buffer.from(s,'base64')):null;const result=api.clipGlassesPixels(arr(q.g),arr(q.h),arr(q.t),80,q.d);console.log(Buffer.from(result).toString('base64'));});'''
p=subprocess.Popen(['node','-e',node,str(R/'viewer.js')],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True,bufsize=1)
import base64
enc=lambda im:base64.b64encode(im.tobytes()).decode() if im else None
count=0
for hairid in ['hair-short','hair-pigtails','hair-long-straight']:
 for hatid in [None,'hat-baseball','hat-beret']:
  hair=items[hairid];f=hair.get('hatVariants',{}).get(hatid,hair) if hatid else hair
  for glassesid in ['glasses-round','glasses-square']:
   for ac in m['base']:
    for r,d in enumerate(m['directions']):
     for c in range(4):
      g=cell(items[glassesid]['files'][ac],r,c);h=cell(f['files'][ac],r,c);t=cell(items[hatid]['files'][ac],r,c) if hatid else None
      expected=fit_glasses_occlusion(g,h,t,r).tobytes();q={'g':enc(g),'h':enc(h),'t':enc(t),'d':d}
      p.stdin.write(json.dumps(q)+'\n');p.stdin.flush();actual=base64.b64decode(p.stdout.readline())
      assert actual==expected,(hairid,hatid,glassesid,ac,d,c)
      count+=1
p.stdin.close();p.wait();assert p.returncode==0
print(f'PASS {count} actual-atlas RGBA clipping cases; 3 hair × 3 hat choices × 2 glasses × 7 actions × 4 directions × 4 frames. Full Canvas compositing not tested.')
