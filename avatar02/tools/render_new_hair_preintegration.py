from PIL import Image,ImageDraw
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'tools'));from fit_new_hair import fit_new_hair
from fit_hat_hair import fit_hat_hair
m=json.loads((R/'manifest.json').read_text());P=R/'previews/new-hair';P.mkdir(exist_ok=True);spec=json.loads((R/'source/new_hair/sources.json').read_text())
for ac in m['base']:
 out=Image.new('RGB',(1280,700),'#fff7e9');d=ImageDraw.Draw(out)
 for j,s in enumerate(spec):
  src=Image.open(R/s['path']).convert('RGBA');b=Image.open(R/m['base'][ac]).convert('RGBA')
  for r in range(4):
   z=src.crop((r*src.width//4,0,(r+1)*src.width//4,src.height));z=z.crop(z.getbbox())
   for c in range(4):
    base=b.crop((c*80,r*80,c*80+80,r*80+80));layer=fit_new_hair(z,base,r,ac,c,s['id']);im=base.copy();im.alpha_composite(layer);x=j%2*640+c*160;y=j//2*350+r*80+20;out.paste(im,(x,y),im)
  d.text((j%2*640,j//2*350),s['id']+' '+ac,fill='black')
 out.save(P/f'{ac}.png')
for hatid in ['hat-baseball','hat-beanie','hat-beret']:
 out=Image.new('RGB',(640,720),'#fff7e9');d=ImageDraw.Draw(out);hatitem=next(i for i in m['items'] if i['id']==hatid);hatatlas=Image.open(R/hatitem['files']['walk']).convert('RGBA')
 for j,s in enumerate(spec):
  src=Image.open(R/s['path']).convert('RGBA');b=Image.open(R/m['base']['walk']).convert('RGBA')
  for r in range(4):
   z=src.crop((r*src.width//4,0,(r+1)*src.width//4,src.height));base=b.crop((80,r*80,160,r*80+80));layer=fit_new_hair(z,base,r,'walk',1,s['id']);hat=hatatlas.crop((80,r*80,160,r*80+80));fit=fit_hat_hair(layer,hat,r);im=base.copy();im.alpha_composite(fit['front']);im.alpha_composite(hat);im=im.resize((160,160),Image.Resampling.NEAREST);out.paste(im,(r*160,j*180+20),im)
  d.text((0,j*180),s['id']+' '+hatid,fill='black')
 out.save(P/f'{hatid}.png')
