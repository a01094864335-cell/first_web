import sys
sys.path.insert(0,str(__import__("pathlib").Path(__file__).resolve().parent))
from pathlib import Path
from PIL import Image,ImageDraw
import json
import argparse
p=argparse.ArgumentParser();p.add_argument('--output',required=True);args=p.parse_args()
R=Path(__file__).resolve().parents[1];ns={'__file__':str(R/'tools/render_proofs.py')};exec((R/'tools/render_proofs.py').read_text().split("allitems=m['items']")[0],ns);m=ns['m'];render=ns['render'];items={i['id']:i for i in m['items']};legacy=json.loads((R/'tools/baseline-item-slots.json').read_text());dest=Path(args.output);dest.mkdir(exist_ok=True)
for id in [i for i in items if i not in legacy]:
 slot=items[id]['slot'];ids=['skin-deep','eyes-dot']
 if slot!='top':ids+=['top-tee-striped']
 if slot!='bottom':ids+=['bottom-trousers-navy']
 if slot=='hat':ids+=['hair-side-ponytail']
 ids+=[id];out=Image.new('RGB',(1280,725),'#fff7e9');d=ImageDraw.Draw(out);d.text((4,3),' + '.join(ids)+' | F R B L; frame 0..3',fill='black')
 for ai,ac in enumerate(m['base']):
  d.text((4,25+ai*100),ac,fill='black')
  for dr in range(4):
   for f in range(4):
    z=render([items[x] for x in ids],dr,f,ac);out.paste(z,((dr*4+f)*80,ai*100+43),z)
 out.save(dest/f'{id}.png')
