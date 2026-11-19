"""18 additive wardrobe garments. Existing 51 atlases are never rewritten here.
Generated four-direction source art supplies structure; baseline supplies pose.
"""
from PIL import Image
import numpy as np
from scipy import ndimage
from fit_clothes import fit_top,fit_skirt,anatomy,palette
from fit_bottoms import fit_bottoms
from fit_expansion_clothes import preserve_feet

def fit_expansion50_clothes(z0,basecell,directionIndex,action,frame,id='',handsmask=None,meta=None):
    if id.startswith('top-'):
        if id=='top-capelet':
            a,v,op,skin,head,hb,cx,bottom=anatomy(basecell)
            side=directionIndex in (1,3);w=19 if side else 27
            h=12 if action=='sit' and frame in (1,2) else 15
            out=Image.new('RGBA',(80,80));out.alpha_composite(z0.resize((w,h),Image.Resampling.NEAREST),(round(cx-w/2),hb+1))
            ar=np.array(out);ar[skin&~head]=0
            return preserve_feet(Image.fromarray(ar),basecell)
        return preserve_feet(fit_top(z0,basecell,directionIndex,action,frame,id=id,handsmask=handsmask),basecell)
    if 'skirt' in id:
        out=fit_skirt(z0,basecell,directionIndex,action,frame,id=id,handsmask=handsmask)
        if not(action=='sit' and frame in (1,2)):
            lifted=Image.new('RGBA',(80,80));lifted.alpha_composite(out,(0,-2));out=lifted
        return preserve_feet(out,basecell)
    out=fit_bottoms(z0,basecell,directionIndex,action,frame,id=id,handsmask=handsmask)
    ar=np.array(out);mask=ar[:,:,3]>0
    ys,xs=np.where(mask)
    if not len(xs):return out
    # Sample generated front/back tailoring into each moving body row rather
    # than pasting a static pair of legs. Source alpha never creates extra legs.
    src=np.asarray(z0.convert('RGBA'));H,W=src.shape[:2];y0,y1=int(ys.min()),int(ys.max())
    for y in range(y0,y1+1):
        xx=np.where(mask[y])[0]
        if not len(xx):continue
        sy=min(H-1,round((y-y0)/max(1,y1-y0)*(H-1)))
        valid=np.where(src[sy,:,3]>100)[0]
        if not len(valid):continue
        for x in xx:
            sx=round(valid.min()+(x-xx.min())/max(1,int(xx.max()-xx.min()))*(valid.max()-valid.min()))
            if src[sy,sx,3]>100:ar[y,x,:3]=src[sy,sx,:3]
    # Pose-relative extra readable structure at the tiny final pixel scale.
    col=palette(z0);light=np.clip(col*1.4+15,0,255).astype('uint8');dark=np.clip(col*.5,0,255).astype('uint8')
    for y in range(y0,y1+1):
        xx=np.where(mask[y])[0]
        if not len(xx):continue
        if id=='bottom-trousers-pinstripe':
            for x in xx:
                if (x-int(xs.min()))%3==1:ar[y,x,:3]=light
        if id=='bottom-trousers-cuffed' and y>=y1-1:ar[y,xx,:3]=light
        if id=='bottom-shorts-athletic':
            ar[y,xx[0],:3]=light;ar[y,xx[-1],:3]=light
        if id=='bottom-shorts-scallop' and y==y1:
            # Scallop alternating tiny hem steps inside the original silhouette.
            ar[y,xx[::3],:3]=dark
        if id=='bottom-trousers-patchwork' and y0+3<=y<=y0+5 and directionIndex!=2:
            # Take the actual ochre knee-patch colour from the source.
            rgb=src[:,:,:3].astype(int);p=(src[:,:,3]>100)&(rgb[:,:,0]>rgb[:,:,2]*1.5)&(rgb[:,:,1]>rgb[:,:,2]*1.3)&(rgb[:,:,0]>90)
            patch=np.median(rgb[p],axis=0).astype('uint8') if p.any() else np.array([175,127,55],dtype='uint8')
            for x in xx:
                if (x-int(xx.min()))%6<3:ar[y,x,:3]=patch
    return preserve_feet(Image.fromarray(ar),basecell)
