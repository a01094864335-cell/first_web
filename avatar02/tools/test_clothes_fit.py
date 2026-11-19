"""Structural regression, not a replacement for visual clothing QC."""
from pathlib import Path
from PIL import Image
import numpy as np
from fit_clothes import fit_top, anatomy
R=Path(__file__).resolve().parents[1]
checks=0
for action in ['walk','greet','drink','examine','sit','celebrate','dress']:
 atlas=Image.open(R/f'assets/{action}/base.png').convert('RGBA')
 source=Image.open(R/f'source/baseline/{action}/assets/vest-teal.png').convert('RGBA')
 for direction in range(4):
  z=source.crop((80,direction*80,160,direction*80+80));z=z.crop(z.getbbox())
  for frame in range(4):
   base=atlas.crop((frame*80,direction*80,frame*80+80,direction*80+80));a,v,op,skin,head,hb,cx,bottom=anatomy(base)
   for id in ['top-vest','top-vest-moss','top-overall-denim']:
    output=np.array(fit_top(z,base,direction,action,frame,id=id));visible=output[:,:,3]>0
    assert not np.any(visible&skin),(action,direction,frame,id,'covers skin')
    assert not np.any(visible&~op),(action,direction,frame,id,'outside body')
    assert visible.any(),(action,direction,frame,id,'empty torso')
    checks+=1
print(checks,'sleeveless fit tests: no posed-skin covering, no body escape, nonempty torso')
