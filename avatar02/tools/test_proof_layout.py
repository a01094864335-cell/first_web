"""Regression: all current hair rows must fit in generated hat QA sheets."""
from pathlib import Path
from PIL import Image
import json
r=Path(__file__).resolve().parents[1];m=json.loads((r/'manifest.json').read_text())
hairs=[i for i in m['items'] if i['slot']=='hair'];hats=[i for i in m['items'] if i['slot']=='hat'];size=(1280,((len(hairs)+1)//2)*700);count=0
for h in hats:
 for a in m['base']:
  p=r/'previews/hat-combinations'/f"{h['id']}--{a}.png"
  with Image.open(p) as im:
   assert im.size==size,(p,im.size,size)
   last=im.convert('RGB').crop((0,size[1]-670,640,size[1]-20))
   assert len(last.getcolors(last.width*last.height) or [])>4,p
  count+=1
print(f'{count} hat proofs include all {len(hairs)} hair rows; size {size}')
