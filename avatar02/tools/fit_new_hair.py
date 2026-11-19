"""Anchor new hairstyle outlines to the existing head, not full silhouette center."""
from PIL import Image
import numpy as np
from scipy import ndimage
NEW_HAIR_IDS={'hair-buzz','hair-afro','hair-high-bun','hair-side-ponytail'}
def fit_new_hair(source,base,direction,action=None,frame=0,id='hair-buzz'):
 a=np.asarray(base.convert('RGBA'));rr,gg,bb=[a[:,:,i].astype(int) for i in range(3)];skin=(rr>145)&(rr-gg>12)&(gg-bb>10)&(a[:,:,3]>0);lab,n=ndimage.label(skin);sz=np.bincount(lab.ravel());sz[0]=0;yy,xx=np.where(lab==sz.argmax());ht=int(yy.min());cx=(xx.min()+xx.max())/2;hw=int(xx.max()-xx.min()+3)
 source=source.convert('RGBA');sa=np.array(source);sa[:,:,3]=np.where(sa[:,:,3]>160,255,0);source=Image.fromarray(sa);source=source.crop(source.getbbox());out=Image.new('RGBA',base.size)
 if id=='hair-high-bun':
  # Preserve scalp scale independently of tall bun; compress only upper bun
  # into spare headroom rather than squeezing the entire hairstyle onto face.
  split=round(source.height*.34);tw=round(hw*1.08);cap=source.crop((0,split,source.width,source.height));ch=round(tw*cap.height/cap.width);cap=cap.resize((tw,ch),Image.Resampling.NEAREST);top=max(0,ht-3);bh=min(10,max(1,top-1));bun=source.crop((0,0,source.width,split)).resize((tw,bh),Image.Resampling.NEAREST)
  x=round(cx-tw/2);out.alpha_composite(bun,(x,top-bh));out.alpha_composite(cap,(x,top));return out
 scale={'hair-buzz':1.04,'hair-afro':1.28,'hair-side-ponytail':1.32}[id];tw=round(hw*scale);th=round(tw*source.height/source.width);z=source.resize((tw,th),Image.Resampling.NEAREST);x=round(cx-tw/2);y=ht-4
 if id=='hair-side-ponytail':x+=(-5 if direction in [0,1] else 5)
 if id=='hair-afro':y=ht-7
 x=max(0,min(base.width-tw,x));y=max(0,min(base.height-th,y));out.alpha_composite(z,(x,y));return out
