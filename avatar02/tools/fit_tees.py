"""Short-sleeve tee colour/pattern layers following the baseline garment pixels.
No resized torso rectangles; original collar, sleeves, hands and hem preserved.
"""
from PIL import Image
import numpy as np
from scipy import ndimage

def fit_tee(z0,basecell,directionIndex,action,frame,id='',handsmask=None):
    a=np.asarray(basecell.convert('RGBA'));v=a[:,:,:3].astype(int);op=a[:,:,3]>100
    skin=(v[:,:,0]>145)&(v[:,:,0]-v[:,:,1]>25)&(v[:,:,1]-v[:,:,2]>16)&op
    labs,n=ndimage.label(skin);sz=np.bincount(labs.ravel());sz[0]=0
    head=labs==sz.argmax();hy,hx=np.where(head);hb=int(hy.max())
    # The garment's ivory palette is distinct from peach skin. Preserve its
    # original pixel boundary, including sleeves bent by the current gesture.
    cream=(v[:,:,0]>150)&(v[:,:,1]>140)&(v[:,:,2]>110)&(v[:,:,0]-v[:,:,1]>5)&(v[:,:,0]-v[:,:,1]<26)&(v[:,:,1]-v[:,:,2]>7)&(v[:,:,1]-v[:,:,2]<35)&op
    cream[:hb+1]=False
    ll,n=ndimage.label(cream)
    mask=np.zeros((80,80),bool)
    for j in range(1,n+1):
        yy,xx=np.where(ll==j)
        if len(xx)>=3 and yy.min()<hb+18:mask |= ll==j
    out=np.zeros_like(a)
    if not mask.any():return Image.fromarray(out)
    colors={'top-plain':np.array([130.,179.,156.]),'top-tee-plain':np.array([230.,226.,210.]),'top-tee-striped':np.array([238.,233.,217.])}
    color=colors.get(id,colors['top-tee-plain'])
    luminance=v.mean(2)
    shade=np.clip(luminance/231.,.73,1.08)
    out[:,:,:3]=np.clip(color[None,None,:]*shade[:,:,None],0,255).astype('uint8')
    if id=='top-tee-striped':
        yy,xx=np.where(mask);top=int(yy.min())
        # Two narrow navy stripes follow the actual visible fabric and never
        # extend over the neck, arms or trousers. Pattern phase follows torso.
        stripes=((np.indices((80,80))[0]-top)%6>=3)&mask
        navy=np.array([60.,76.,101.]);out[stripes,:3]=np.clip(navy[None,:]*shade[stripes,None],0,255).astype('uint8')
    out[:,:,3]=np.where(mask,255,0)
    return Image.fromarray(out)
