"""Hand anchored equipment fitting. Returns isolated 80px overlay; redraw hands last.
This is fitting, not a substitute for hand-drawn item-specific acting.
"""
from PIL import Image
import numpy as np
from scipy import ndimage

def fit_hand_prop(z0, basecell, handsmask, directionIndex, action, frame, id):
    out=Image.new('RGBA',(80,80))
    if 'book' in id and action=='drink':return out # stow book rather than pretend to drink it
    if directionIndex==2:return out # held ahead of torso, occluded from rear
    b=np.asarray(basecell.convert('RGBA')); m=np.asarray(handsmask.convert('RGBA'))[:,:,3]>0
    r,g,bl=[b[:,:,i].astype(int) for i in range(3)]
    skin=m&(b[:,:,3]>0)&(r-g>12)&(g-bl>10)&(r>100)
    lab,n=ndimage.label(skin)
    candidates=[]
    for i in range(1,n+1):
        y,x=np.where(lab==i)
        if len(x)>=3:candidates.append((x.mean(),y.mean(),x,y))
    if not candidates:return out
    # Selected near hand: screen right in front/right, screen left in left view.
    chosen=(min if directionIndex==3 else max)(candidates,key=lambda q:q[0])
    hx,hy,xx,yy=chosen
    box=z0.getbbox()
    if box is None:return out
    z=z0.crop(box).convert('RGBA')
    if 'book' in id:
        # Normalize the generated left-facing brown cover to the same teal
        # family; preserve black outlines and cream paper edges.
        a=np.array(z); rr,gg,bb=[a[:,:,i].astype(int) for i in range(3)]
        cover=(a[:,:,3]>0)&(rr>55)&(rr<195)&(rr>gg*1.15)&(rr>bb*1.2)
        value=np.maximum(0.40,np.minimum(1.35,rr/115.0))
        for channel,color in enumerate((35,112,108)):
            a[:,:,channel]=np.where(cover,np.minimum(255,color*value).astype('uint8'),a[:,:,channel])
        z=Image.fromarray(a)
    w,h=(13,13) if 'book' in id else (11,12)
    z=z.resize((w,h),Image.Resampling.NEAREST)
    # A cupped hand covers upper/side edge, not the entirety of the prop.
    if directionIndex==0:
        x=round(hx-w/2);y=round(hy-2)
    elif directionIndex==1:
        x=round(hx-2);y=round(hy-3)
    else:
        x=round(hx-w+2);y=round(hy-3)
    # During drinking raise rim toward lips while leaving hand on cup side.
    if action=='drink' and frame in (1,2) and 'book' not in id:y-=2
    x=max(1,min(79-w,x));y=max(1,min(79-h,y))
    out.alpha_composite(z,(x,y))
    return out
