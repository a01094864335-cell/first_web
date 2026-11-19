"""Fit generated footwear independently to visible base feet, not a fixed pair.
Designed for the neutral-grey shoes in this catalogue's baseline. No gait is
invented: where the base has a single visible foot, only one shoe is rendered.
"""
from PIL import Image
import numpy as np
from scipy import ndimage

def fit_shoes(z0, basecell, directionIndex, action, frame):
    a=np.asarray(basecell.convert('RGBA')); rgb=a[:,:,:3].astype(int)
    opaque=a[:,:,3]>100
    ys,xs=np.where(opaque)
    out=Image.new('RGBA',(80,80))
    if not len(ys): return out
    bottom=int(ys.max())
    # Grey shoe interiors, excluding dark trouser/outline and warm skin.
    mask=(rgb.max(2)-rgb.min(2)<25)&(rgb.mean(2)>90)&opaque
    mask[:max(0,bottom-9),:]=False
    labs,n=ndimage.label(mask)
    feet=[]
    for j in range(1,n+1):
        yy,xx=np.where(labs==j)
        if len(xx)>=3: feet.append((int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)))
    feet=sorted(feet,key=lambda b:b[0])
    # Source front/back has two separated shoes; side source is one profile.
    z0=z0.convert('RGBA'); za=np.asarray(z0); cols=(za[:,:,3]>100).sum(0)
    pieces=[]
    if directionIndex in (0,2):
        mid=z0.width//2
        split=min(range(max(1,mid-z0.width//5),min(z0.width-1,mid+z0.width//5+1)),key=lambda x:cols[x])
        for box in [(0,0,split,z0.height),(split,0,z0.width,z0.height)]:
            p=z0.crop(box); bb=p.getbbox()
            if bb:pieces.append(p.crop(bb))
    else:
        # Directional source contains an overlapped pair. Keep only the
        # foreground profile; do not miniaturize both shoes onto each foot.
        w,h=z0.size
        box=(round(w*.34),round(h*.12),w,h) if directionIndex==1 else (0,round(h*.12),round(w*.66),h)
        p=z0.crop(box);pieces=[p.crop(p.getbbox())]
    if not pieces:return out
    for i,(x0,y0,x1,y1) in enumerate(feet):
        p=pieces[min(i,len(pieces)-1)]
        width=x1-x0+2
        # Preserve boot shaft via source aspect, but avoid covering knee.
        height=min(12,max(y1-y0+2,round(width*p.height/p.width)))
        p=p.resize((width,height),Image.Resampling.NEAREST)
        x=max(0,x0-1);y=max(0,y1+1-height)
        # Opaque outsole underlay covers residual light baseline pixels;
        # use the source's darkest opaque color, not a borrowed garment color.
        pa=np.asarray(p); valid=pa[:,:,3]>100
        if valid.any():
            colors=pa[valid]; dark=tuple(colors[np.argmin(colors[:,:3].sum(1))][:3])+(255,)
            cover=Image.new('RGBA',(x1-x0,y1-y0),dark)
            out.alpha_composite(cover,(x0,y0))
        out.alpha_composite(p,(x,y))
    return out
