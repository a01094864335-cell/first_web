"""Hat-compatible hair layers. Input/output RGBA cells share the same pixel grid.
Render rear behind base in front/profile, above base at back; front before hat.
Does not repaint, move or replace the selected hairstyle. Crown is concealed,
while existing fringe, sideburns, pigtails and rear length remain visible.
"""
from PIL import Image
import numpy as np

def fit_hat_hair(hair, hat, direction=0, rear=None):
    """Return {'front': RGBA, 'rear': RGBA, 'mask': L} for one 80px cell.

    direction: 0/front, 1/right, 2/back, 3/left. The same geometry is used for
    all directions; actual per-direction hat alpha determines the cut line.
    Hat must be composited AFTER both returned visible hair layers.
    """
    hair=hair.convert('RGBA'); hat=hat.convert('RGBA')
    if hair.size != hat.size: raise ValueError('Hair/hat cell grids differ')
    mask=Image.new('L',hair.size,255)
    bbox=hat.getbbox()
    if bbox:
        x0,y0,x1,y1=bbox
        # Crown cannot protrude through a fitted cap. Keep the lowest quarter
        # under the brim; the hat alpha naturally occludes covered strands.
        cut=y0+round((y1-y0)*.70)
        a=np.full((hair.height,hair.width),255,dtype=np.uint8);a[:cut,:]=0
        mask=Image.fromarray(a)
    def masked(im):
        if im is None:return Image.new('RGBA',hair.size)
        im=im.convert('RGBA').copy()
        if im.size != hair.size:raise ValueError('Rear cell grid differs')
        im.putalpha(Image.fromarray(np.minimum(np.asarray(im.getchannel('A')),np.asarray(mask))))
        return im
    return {'front':masked(hair),'rear':masked(rear),'mask':mask}

def fit_hat_hair_atlas(hair, hat, rear=None, cell_size=80):
    """Same return keys for a four-direction by four-frame RGBA atlas."""
    result={'front':Image.new('RGBA',hair.size),'rear':Image.new('RGBA',hair.size),'mask':Image.new('L',hair.size)}
    for r in range(4):
        for c in range(4):
            b=(c*cell_size,r*cell_size,(c+1)*cell_size,(r+1)*cell_size)
            part=fit_hat_hair(hair.crop(b),hat.crop(b),r,rear.crop(b) if rear else None)
            for k in result:result[k].paste(part[k],b[:2])
    return result
