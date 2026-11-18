"""Pose-conforming trousers/shorts colour transfer onto baseline leg silhouette.
Keeps foot interiors separate. This sacrifices source pocket detail for reliable
leg motion; skirt is not supported by this fallback and should use its own fit.
"""
from PIL import Image
import numpy as np
from scipy import ndimage

def fit_bottoms(z0, basecell, directionIndex, action, frame, id='', handsmask=None):
    a=np.asarray(basecell.convert('RGBA')); rgb=a[:,:,:3].astype(int);alpha=a[:,:,3]>100
    out=np.zeros_like(a)
    yy,xx=np.where(alpha)
    if not len(yy):return Image.fromarray(out)
    bottom=yy.max()
    # Baseline navy trousers: dark but not black outlines, in lower body.
    m=(rgb[:,:,2]>rgb[:,:,0])&(rgb.mean(2)>22)&(rgb.mean(2)<110)&alpha
    m[:max(0,bottom-20)]=False
    lab,n=ndimage.label(m)
    for j in range(1,n+1):
        ys,xs=np.where(lab==j)
        if len(xs)<3:m[lab==j]=False
    # Explicit baseline sit knee ROIs: the supplied hands-mask also includes
    # knees and shirt, so it cannot be treated as a reliable hand-only mask.
    # Only these visually reviewed knee pixels override that broad mask.
    if action=='sit' and any(k in id for k in ('trousers','overall')):
        rois={
          0:[[(31,66,37,68),(42,64,48,67)],[(32,60,39,69),(42,60,50,69)],[(32,60,39,66),(42,60,50,66)],[(31,63,37,67),(41,64,47,67)]],
          1:[[(35,64,43,68)],[(43,65,49,69)],[(44,65,49,69)],[(35,64,43,68)]],
          2:[[(32,66,37,68),(43,65,49,68)],[],[],[(32,65,38,67),(41,64,47,67)]],
          3:[[(33,62,40,67)],[(32,64,37,69)],[(32,64,37,69)],[(37,62,44,67)]]}
        skin=(rgb[:,:,0]>145)&(rgb[:,:,0]-rgb[:,:,1]>12)&(rgb[:,:,1]-rgb[:,:,2]>10)&alpha
        for x0,y0,x1,y1 in rois[directionIndex][frame]:
            m[y0:y1,x0:x1] |= skin[y0:y1,x0:x1]
    # Transfer garment chroma while retaining baseline leg shading and shape.
    z=np.asarray(z0.convert('RGBA'));col=z[:,:,:3].astype(float)
    valid=(z[:,:,3]>160)&(col.mean(2)>35)&(col.mean(2)<220)
    if not valid.any():return Image.fromarray(out)
    c=np.median(col[valid],axis=0)
    lum=rgb.mean(2); source_lum=max(1,c.mean())
    # Two-tone source palette mapped to baseline shading; no standing-leg box.
    target=c[None,None,:]*(.78+.44*np.clip((lum-25)/65,0,1))[:,:,None]
    out[:,:,:3]=np.clip(target,0,255).astype('uint8');out[:,:,3]=np.where(m,255,0)
    return Image.fromarray(out)
