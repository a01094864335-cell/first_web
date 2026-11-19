"""Clip eyewear hidden by opaque fringe/caps instead of drawing stems on hair.
Call on the selected pose after hat-compatible hairstyle variants are chosen.
The original glasses atlas is not mutated. Rear-facing glasses are hidden.
"""
from PIL import Image
import numpy as np

def fit_glasses_occlusion(glasses, hair=None, hat=None, direction=0):
    result=glasses.convert('RGBA').copy()
    if direction == 2:
        return Image.new('RGBA',result.size)
    alpha=np.asarray(result.getchannel('A')).copy()
    box=result.getbbox(); xx=np.arange(result.width)[None,:]
    stem=np.zeros(alpha.shape,dtype=bool)
    if box and direction in (1,3):
        mid=(box[0]+box[2]-1)/2
        stem[:]=xx<mid if direction==1 else xx>mid
    for layer in (hair,hat):
        if layer is None: continue
        if layer.size != result.size:raise ValueError('Occluder and glasses grids differ')
        cover=np.asarray(layer.convert('RGBA').getchannel('A'))
        alpha[(cover>=128) & (stem if layer is hair else True)]=0
    result.putalpha(Image.fromarray(alpha))
    return result
