from pathlib import Path
import json,sys
import numpy as np
from scipy import ndimage
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'tools'));from fit_expansion50_head import fit_expansion50_head
m=json.loads((R/'manifest.json').read_text());specs=json.loads((R/'source/expansion50_head/sources.json').read_text());out=R/'source/expansion50_head/qc';out.mkdir(exist_ok=True)
for s in specs:
 source=Image.open(R/s['path']).convert('RGBA');w,h=source.size
 o=Image.new('RGBA',(1280,700),'#fff7e9');d=ImageDraw.Draw(o)
 for ai,ac in enumerate(m['base']):
  sheet=Image.open(R/m['base'][ac]).convert('RGBA');x0=ai%4*320;y0=ai//4*350;d.text((x0+2,y0+1),s['id']+' '+ac,fill='black')
  for r in range(4):
   z=source.crop((round(r*w/4),0,round((r+1)*w/4),h));a=np.array(z);lab,n=ndimage.label(a[:,:,3]>160);sz=np.bincount(lab.ravel());sz[0]=0;keep=sz>max(6,sz.max()*.12);keep[0]=False;a[:,:,3]=np.where(keep[lab],255,0);z=Image.fromarray(a);z=z.crop(z.getbbox())
   for c in range(4):
    base=sheet.crop((c*80,r*80,c*80+80,r*80+80));layer=fit_expansion50_head(z,base,r,ac,c,id=s['id']);base.alpha_composite(layer);o.alpha_composite(base,(x0+c*80,y0+r*80+25))
 o.save(out/(s['id']+'.png'))
