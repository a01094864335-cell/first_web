"""Isolated expansion-50 head fitting. Existing source/assets and fitters untouched."""
from PIL import Image
import numpy as np
from scipy import ndimage
HAIR_SCALES={'hair-bowl':1.08,'hair-center-part':1.10,'hair-spiky':1.15,'hair-wavy-lob':1.20,'hair-twin-buns':1.30,'hair-low-ponytail':1.08,'hair-swept-undercut':1.10,'hair-dread-bob':1.12,'hair-curtain-bob':1.10,'hair-mullet':1.22}
HAT_SCALES={'hat-straw':1.42,'hat-newsboy':1.18,'hat-visor':1.18,'hat-chef':1.18,'hat-rain':1.22,'hat-earflap':1.17}
def fit_expansion50_head(z0,base,direction,action=None,frame=0,id='',handsmask=None,meta=None):
 a=np.asarray(base.convert('RGBA'));rr,gg,bb=[a[:,:,i].astype(int) for i in range(3)];skin=(rr>145)&(rr-gg>12)&(gg-bb>10)&(a[:,:,3]>0);lab,n=ndimage.label(skin);sz=np.bincount(lab.ravel());sz[0]=0;yy,xx=np.where(lab==sz.argmax());ht=int(yy.min());cx=(xx.min()+xx.max())/2;hw=int(xx.max()-xx.min()+3)
 src=z0.convert('RGBA');ar=np.array(src);ar[:,:,3]=np.where(ar[:,:,3]>160,255,0);src=Image.fromarray(ar);src=src.crop(src.getbbox())
 # The front ponytail island belongs behind the neck, not over the chin.
 if id=='hair-low-ponytail' and direction==0:
  az=np.array(src);lab,n=ndimage.label(az[:,:,3]>0);sz=np.bincount(lab.ravel());sz[0]=0;az[:,:,3]=np.where(lab==sz.argmax(),az[:,:,3],0);src=Image.fromarray(az);src=src.crop(src.getbbox())
 # Remove the generated underside oval from straw front/profiles; it is
 # hidden by the wearer's head, not a visible face-outline accessory.
 if id=='hat-straw' and direction!=2:src=src.crop((0,0,src.width,round(src.height*.64)))
 hair=id in HAIR_SCALES;scale=(HAIR_SCALES if hair else HAT_SCALES)[id];tw=round(hw*scale);th=round(tw*src.height/src.width)
 if hair:
  # Shoulder-reaching styles capped; prevent frame bounds collision without moving scalp.
  th=min(th,46 if id=='hair-wavy-lob' else 43)
  y=ht-4
  if id in ['hair-spiky','hair-swept-undercut']:y=ht-7
  if id=='hair-twin-buns':y=ht-5
 else:
  if id=='hat-visor':th=min(th,12);y=ht+4
  elif id=='hat-earflap':th=min(th,38);y=ht-4
  elif id=='hat-rain':th=min(th,35);y=ht-7
  else:
   # Brim/band sits above brows; tall crowns compress rather than shift eyes.
   bottom=ht+14;th=min(th,max(10,bottom-1));y=bottom-th
 z=src.resize((tw,th),Image.Resampling.NEAREST);x=round(cx-tw/2);y=max(1,y);x=max(1,min(base.width-tw-1,x))
 # Front neck flap is behind the face, not an opaque yellow face mask.
 if id=='hat-rain' and direction==0:
  az=np.array(z);az[round(th*.52):,round(tw*.22):round(tw*.78),3]=0;z=Image.fromarray(az)
 out=Image.new('RGBA',base.size);out.alpha_composite(z,(x,y));return out
