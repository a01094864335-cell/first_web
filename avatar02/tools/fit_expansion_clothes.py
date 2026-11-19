"""Five generated-source clothing extensions, fitted to the existing posed body."""
from PIL import Image
import numpy as np
from scipy import ndimage
from fit_tees import fit_tee
from fit_clothes import fit_top,fit_skirt,palette,anatomy
from fit_bottoms import fit_bottoms

def preserve_feet(overlay,basecell):
    a=np.asarray(basecell.convert('RGBA'));v=a[:,:,:3].astype(int);op=a[:,:,3]>100
    ys=np.where(op)[0]
    if not len(ys):return overlay
    foot=(v.max(2)-v.min(2)<25)&(v.mean(2)>90)&op
    foot[:max(0,int(ys.max())-10)]=False
    # Include baseline shoe outlines and the one-pixel extension used by
    # replacement footwear; neither skirt hem nor cargo flap may cover this.
    foot=ndimage.binary_dilation(foot,iterations=1)
    out=np.array(overlay);out[foot]=0
    return Image.fromarray(out)

def fit_new_clothes(z0,basecell,directionIndex,action,frame,id='',handsmask=None):
    if id=='top-raglan':
        out=fit_tee(z0,basecell,directionIndex,action,frame,id='top-tee-plain');ar=np.array(out);m=ar[:,:,3]>0
        src=np.array(z0);rgb=src[:,:,:3].astype(float);blue=(src[:,:,3]>160)&(rgb[:,:,2]>rgb[:,:,0]*1.4)&(rgb[:,:,2]>70);ivory=(src[:,:,3]>160)&(rgb.min(2)>150)
        b=np.median(rgb[blue],axis=0) if blue.any() else np.array([40,75,160]);iv=np.median(rgb[ivory],axis=0) if ivory.any() else np.array([242,230,200])
        yy,xx=np.where(m)
        if len(xx):
            top=int(yy.min());cx=(xx.min()+xx.max())/2
            for y,x in zip(yy,xx):
                # Raglan diagonal shoulder panels plus blue crew-neck band.
                edge=abs(x-cx)>max(3,7-(y-top)*.7) and y<top+7
                collar=y==top
                c=b if edge or collar else iv
                ar[y,x,:3]=np.clip(c*(.93 if y%4==3 else 1),0,255)
        return Image.fromarray(ar)
    if id in ('top-turtleneck','top-bomber'):
        return fit_top(z0,basecell,directionIndex,action,frame,id=id,handsmask=handsmask)
    if id=='bottom-skirt-pleated':
        skirt=fit_skirt(z0,basecell,directionIndex,action,frame,id=id,handsmask=handsmask)
        if not (action=='sit' and frame in (1,2)):
            # Raise whole standing hem rather than cut two shoe-shaped holes.
            lifted=Image.new('RGBA',(80,80));lifted.alpha_composite(skirt,(0,-2));skirt=lifted
        return preserve_feet(skirt,basecell)
    if id=='bottom-trousers-cargo':
        out=fit_bottoms(z0,basecell,directionIndex,action,frame,id=id,handsmask=handsmask);ar=np.array(out);m=ar[:,:,3]>0
        yy,xx=np.where(m)
        if not len(xx):return out
        w,h=z0.size;side=directionIndex in (1,3)
        # Extract the generated side-pocket flap detail, not a recolored label.
        box=(int(w*.15),int(h*.37),int(w*.78),int(h*.70)) if side else (0,int(h*.38),int(w*.30),int(h*.70))
        pocket=z0.crop(box).resize((7 if side else 5,5),Image.Resampling.NEAREST)
        waist=int(yy.min());py=min(int(yy.max())-4,waist+3)
        rowxs=np.where(m[max(0,py)])[0]
        if not len(rowxs):rowxs=xx
        positions=[int(rowxs.min())-1,int(rowxs.max())-3] if not side else [round((rowxs.min()+rowxs.max())/2)-3]
        for x in positions:out.alpha_composite(pocket,(max(0,x),max(0,py)))
        return preserve_feet(out,basecell)
    raise ValueError(id)
