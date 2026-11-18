"""Directional side-shoulder mini bag, kept distinct from waist crossbody bag."""
from PIL import Image
import numpy as np
from scipy import ndimage

def fit_mini_bag(z0,basecell,directionIndex,action,frame):
    out=Image.new('RGBA',(80,80));box=z0.getbbox()
    if box is None:return out
    b=np.array(basecell.convert('RGBA'));r,g,bl=[b[:,:,i].astype(int) for i in range(3)]
    skin=(b[:,:,3]>0)&(r-g>12)&(g-bl>10)&(r>100)
    lab,n=ndimage.label(skin);sz=np.bincount(lab.ravel());sz[0]=0
    head=lab==sz.argmax(); yy,xx=np.where(head)
    # A raised hand can touch the chin and join the head component. Derive
    # shoulder from wide face scanlines, never the lowest skin pixel.
    counts=head.sum(axis=1); broad=np.where(counts>=counts.max()*.60)[0]
    hb=int(broad.max())+2
    yy,xx=np.where(head & (np.indices(head.shape)[0]<=hb))
    cx=(xx.min()+xx.max())/2
    w=16 if directionIndex in(0,2) else 10;h=24
    z=z0.crop(box).resize((w,h),Image.Resampling.NEAREST)
    if directionIndex in (0,2):z=z.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    # The purse is at the same anatomical side, which switches screen side
    # when viewed from behind. Narrow profile silhouette is not waist-wide.
    x=round(cx+6 if directionIndex==0 else cx-22 if directionIndex==2 else cx-6)
    y=int(hb)-1
    if action=='sit':y-=2
    x=max(1,min(79-w,x));y=max(1,min(79-h,y));out.alpha_composite(z,(x,y))
    return out
