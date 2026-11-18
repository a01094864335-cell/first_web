"""Pose-aware clothing overlays for the fixed Avatar02 baseline.
Torso keeps source garment identity; sleeve pixels follow baseline upper arms.
Skirt uses a compact lap silhouette in seated poses, not a standing rectangle.
"""
from PIL import Image
import numpy as np
from scipy import ndimage

def anatomy(basecell):
    a=np.asarray(basecell.convert('RGBA'));v=a[:,:,:3].astype(int);op=a[:,:,3]>100
    skin=(v[:,:,0]-v[:,:,1]>25)&(v[:,:,1]-v[:,:,2]>16)&(v[:,:,0]>145)&op
    ll,n=ndimage.label(skin);sz=np.bincount(ll.ravel());sz[0]=0;head=ll==sz.argmax()
    yy,xx=np.where(head); hb=int(yy.max());cx=float((xx.min()+xx.max())/2)
    bottom=int(np.where(op)[0].max())
    return a,v,op,skin,head,hb,cx,bottom

def palette(z):
    a=np.asarray(z.convert('RGBA'));v=a[:,:,:3].astype(float)
    m=(a[:,:,3]>160)&(v.mean(2)>45)&(v.mean(2)<220)
    return np.median(v[m],axis=0) if m.any() else np.array([100.,100.,100.])

def fit_top(z0,basecell,directionIndex,action,frame,id='',handsmask=None):
    a,v,op,skin,head,hb,cx,bottom=anatomy(basecell)
    out=Image.new('RGBA',(80,80));side=directionIndex in (1,3)
    # Source sleeves are removed instead of leaving phantom lowered arms.
    w,h=z0.size;trim=.20 if not side else .16
    core=z0.crop((round(w*trim),0,round(w*(1-trim)),h))
    tw=20 if not side else 12
    th=17 if not (action=='sit' and frame in (1,2)) else 13
    y=hb+1;x=round(cx-tw/2)
    core=core.resize((tw,th),Image.Resampling.NEAREST)
    out.alpha_composite(core,(x,y))
    # Repaint proximal skin in arm components. Distal 40% remains hand/skin.
    arms=skin&~head
    arms[max(hb+15,bottom-14):]=False
    ll,n=ndimage.label(arms)
    color=palette(z0);aa=np.asarray(out).copy()
    shoulders=[(cx-9,hb+3),(cx+9,hb+3)] if not side else [(cx,hb+4)]
    for j in range(1,n+1):
        yy,xx=np.where(ll==j)
        if len(xx)<3:continue
        # Reject spurious skin-coloured garment pixels close to central neck.
        if not side and np.max(np.abs(xx-cx))<7:continue
        dd=np.min([((xx-sx)**2+(yy-sy)**2) for sx,sy in shoulders],axis=0)
        cutoff=np.quantile(dd,.60)
        for py,px,d in zip(yy,xx,dd):
            if d<=cutoff:
                shade=.87 if (px+py)%4==0 else 1.
                aa[py,px,:3]=np.clip(color*shade,0,255);aa[py,px,3]=255
    # Keep original distal hand pixels that overlap the fitted torso edges.
    hand=arms&(aa[:,:,3]==0)
    return Image.fromarray(aa)

def fit_skirt(z0,basecell,directionIndex,action,frame,id='',handsmask=None):
    a,v,op,skin,head,hb,cx,bottom=anatomy(basecell)
    out=Image.new('RGBA',(80,80));side=directionIndex in (1,3)
    seated=action=='sit' and frame in (1,2)
    tw=(25 if not side else 23) if seated else (24 if not side else 17)
    th=9 if seated else 13
    # Lap shifts forward with bent knees in side views.
    shift=(3 if directionIndex==1 else -3 if directionIndex==3 else 0) if seated else 0
    x=round(cx-tw/2+shift);y=bottom-th-3
    z=z0.resize((tw,th),Image.Resampling.NEAREST)
    if seated:
        # Solid lap underlay covers bare knees through transparent source waist.
        fill=np.zeros((80,80,4),dtype='uint8');knee=skin.copy();knee[:y]=False;knee[y+th:]=False;knee[:,:max(0,x)]=False;knee[:,min(80,x+tw):]=False
        fill[knee,:3]=np.clip(palette(z0),0,255).astype('uint8');fill[knee,3]=255
        out.alpha_composite(Image.fromarray(fill))
    out.alpha_composite(z,(x,y))
    # Restore hand/forearm skin above lap, never restore knee skin under skirt.
    aa=np.asarray(out).copy();restore=skin&~head
    restore[max(0,y):]=False
    aa[restore]=0
    return Image.fromarray(aa)
