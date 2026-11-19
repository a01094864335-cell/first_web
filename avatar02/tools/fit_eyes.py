"""Pose-aware eye overlay. Returns one transparent 80px cell, never edits base.
Only facial expression keyframes replace the selected cosmetic eye silhouette.
"""
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage
PALETTES={'charcoal':(45,37,30),'green':(40,91,48),'blue':(35,81,137)}
def _components(base,meta):
 a=np.array(base.convert('RGBA'));dark=(a[:,:,0]<90)&(a[:,:,3]>0);ll,n=ndimage.label(dark);dist=ndimage.distance_transform_edt(a[:,:,3]>0);out=[]
 for j in range(1,n+1):
  y,x=np.where(ll==j)
  if (2<=len(x)<=65 and y.max()-y.min()<=10 and x.max()-x.min()<=12 and y.min()>meta['headtop']+12 and y.max()<meta['headbottom']-3 and x.min()>meta['cx']-17 and x.max()<meta['cx']+17 and dist[y,x].min()>=3):out.append((x,y))
 return out

def fit_eyes(source,base_cell,direction,action,frame,eye_id,meta=None,palette='charcoal'):
 """source is the already tightly cropped directional cosmetic eye image.
 direction: 0 front,1 right,2 back,3 left. frame: atlas column 0..3.
 Blink/joy keys are semantic, not a claim of additional animation frames.
 """
 out=Image.new('RGBA',(80,80));r=direction
 if isinstance(r,str):r=['front','right','back','left'].index(r)
 if r==2:return out
 if meta is None:
  a=np.array(base_cell);rr,gg,bb=[a[:,:,k].astype(int) for k in range(3)];s=(rr>145)&(rr-gg>12)&(gg-bb>10)&(a[:,:,3]>0);l,n=ndimage.label(s);sz=np.bincount(l.ravel());sz[0]=0;y,x=np.where(l==sz.argmax());meta={'headtop':int(y.min()),'headbottom':int(y.max()),'cx':float((x.min()+x.max())/2)}
 comps=_components(base_cell,meta)
 if r==1:comps=[p for p in comps if p[0].mean()>meta['cx']+4]
 if r==3:comps=[p for p in comps if p[0].mean()<meta['cx']-4]
 comps=sorted(comps,key=lambda p:p[0].mean())[:2 if r==0 else 1]
 col=PALETTES[palette]+(255,)
 expression='closed' if action=='drink' and frame==2 else 'smile' if (action=='sit' and frame==2) or (action=='celebrate' and frame in [1,3]) else None
 if expression and comps:
  d=ImageDraw.Draw(out)
  for x,y in comps:
   if (action=='drink' and frame==2) or (action=='sit' and frame==2):
    # Preserve actual authored closed/smiling eye pixels from this base pose.
    for xx,yy in zip(x,y):out.putpixel((int(xx),int(yy)),col)
   else:
    cx=int(round(x.mean()));cy=int(round(y.mean()));d.line([(cx-3,cy+1),(cx-2,cy-1),(cx+1,cy-1),(cx+3,cy+1)],fill=col,width=1)
  return out
 tw=19 if r==0 else 5;th=4 if eye_id=='eyes-sleepy' else 6
 z=source.convert('RGBA').resize((tw,th),Image.Resampling.NEAREST)
 a=np.array(z)
 # Retain blush/highlight pixels instead of tinting every visible source pixel.
 mask=(a[:,:,3]>0)&(a[:,:,:3].max(axis=2)<150);a[mask,:3]=PALETTES[palette];z=Image.fromarray(a)
 ys=[int(v) for _,y in comps for v in [y.min(),y.max()]] or meta.get('eyeYs',[meta['headtop']+20,meta['headtop']+26])
 x=round(meta['cx']-tw/2+(9 if r==1 else -9 if r==3 else 0));y=round(float(np.mean(ys))-th/2)
 out.alpha_composite(z,(x,y));return out
