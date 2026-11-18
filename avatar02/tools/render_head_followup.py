from pathlib import Path
from PIL import Image,ImageDraw
import sys
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'tools'));ns={'__file__':str(R/'tools/render_proofs.py')};exec((R/'tools/render_proofs.py').read_text().split('allitems=m[')[0],ns);m=ns['m'];render=ns['render'];items={x['id']:x for x in m['items']};hairs=['hair-short','hair-curly-bob','hair-pixie','hair-pigtails','hair-long-straight','hair-braid']
P=R/'previews/head-followup';P.mkdir(exist_ok=True)
for ac in m['base']:
 for gear in ['glasses-round','glasses-square','body-headphones']:
  out=Image.new('RGB',(640,1050),'#fff7e9');d=ImageDraw.Draw(out)
  for j,h in enumerate(hairs):
   x=j%2*320;y=j//2*350;d.text((x,y),h+' '+gear+' '+ac,fill='black')
   for r in range(4):
    for c in range(4):
     im=render([items[h],items[gear]],r,c,ac);out.paste(im,(x+c*80,y+20+r*80),im)
  out.save(P/f'{gear}--{ac}.png')
