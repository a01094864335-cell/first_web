"""New gear only. Anchored fitting; existing catalogue files remain untouched."""
from PIL import Image
from pathlib import Path
import numpy as np
from scipy import ndimage
from fit_shoes import fit_shoes

def fit_expansion50_gear(z0,basecell,directionIndex,action,frame,id='',handsmask=None,meta=None):
    r=directionIndex;out=Image.new('RGBA',(80,80));box=z0.getbbox()
    if not box:return out
    z=z0.crop(box)
    if id.startswith('shoes-'):return fit_shoes(z,basecell,r,action,frame)
    b=np.array(basecell.convert('RGBA'));rr,gg,bb=[b[:,:,i].astype(int) for i in range(3)]
    skin=(b[:,:,3]>0)&(rr-gg>12)&(gg-bb>10)&(rr>100)
    lab,n=ndimage.label(skin);sz=np.bincount(lab.ravel());sz[0]=0;head=lab==sz.argmax()
    counts=head.sum(1);broad=np.where(counts>=counts.max()*.6)[0];hb=int(broad.max())+2
    yy,xx=np.where(head&(np.indices(head.shape)[0]<=hb));cx=(xx.min()+xx.max())/2;ht=yy.min()
    if id.startswith('glasses-'):
        if r==2:return out
        if id=='glasses-hexagon':
            # Generated pale lens fill must not erase the wearer's eyes.
            za=np.array(z);rgb=za[:,:,:3].astype(int)
            lens=(rgb.min(2)>145)&(rgb.max(2)-rgb.min(2)<85)&(za[:,:,3]>0)
            za[:,:,3]=np.where(lens,np.minimum(za[:,:,3],45),za[:,:,3]);z=Image.fromarray(za)
        w=33 if r==0 else 22;h=11 if 'sport' not in id else 13
        eyes=(meta or {}).get('eyeYs',[ht+24]);ey=float(np.mean(eyes))
        x=round(cx-w/2+(5 if r==1 else -5 if r==3 else 0));y=round(ey-h/2)
    elif id.startswith('hand-'):
        if r==2 or action=='drink' or handsmask is None:return out
        lab,n=ndimage.label(skin&(np.array(handsmask)[:,:,3]>0));choices=[]
        for k in range(1,n+1):
            yy,xx=np.where(lab==k)
            if len(xx)>=3:choices.append((xx.mean(),yy.mean()))
        if not choices:return out
        hx,hy=(min if r==3 else max)(choices,key=lambda q:q[0])
        if 'umbrella' in id:w,h=7,24;gx,gy=w/2,3
        elif 'flower' in id:w,h=13,18;gx,gy=(w-2 if r==3 else 2),h*.72
        else:w,h=(13 if r==0 else 9),20;gx,gy=w/2,2
        x=round(hx-gx);y=round(hy-gy)
    elif id=='body-satchel':
        w,h=(21 if r in (0,2) else 11),25
        x=round(cx-w/2+(4 if r==0 else -4 if r==2 else 0));y=hb-1
    elif id=='body-waist-pouch':
        w,h=(25 if r in (0,2) else 15),11;x=round(cx-w/2);y=hb+10-(3 if action=='sit' else 0)
    elif id=='body-scarf':
        w,h=(25 if r in (0,2) else 19),19;x=round(cx-w/2);y=hb-4
    elif id=='body-backpack':
        w,h=(24 if r in (0,2) else 13),24
        if r==2:
            src=Image.open(Path(__file__).resolve().parents[1]/'source/expansion50_gear/body-backpack.png').convert('RGBA')
            z=src.crop((0,0,src.width//4,src.height));z=z.crop(z.getbbox())
        if r in (1,3):z=z.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        x=round(cx-w/2+(-10 if r==1 else 10 if r==3 else 0));y=hb-1
        # Generated backpack object front is the rear-facing outside pocket.
        # Front wearing silhouette: retain just shoulder straps, not bag face.
        if r==0:
            z=z.resize((w,h),Image.Resampling.NEAREST)
            a=np.array(z);a[12:,:,3]=0;a[:,7:17,3]=0;z=Image.fromarray(a)
    else:return out
    if id.startswith('hand-') and y+h>79:
        h=max(4,79-y) # shorten below fixed grip, never slide the hand anchor
    z=z.resize((w,h),Image.Resampling.NEAREST);x=max(1,min(79-w,x));y=max(1,min(79-h,y));out.alpha_composite(z,(x,y));return out
