"""Keep inherited crossbody pouch above sole level when crouching/leaning.
Input is the already aligned full 80px baseline overlay, not raw source art.
"""
from PIL import Image

def fit_crossbody(overlay,basecell,directionIndex,action,frame):
    overlay=overlay.convert('RGBA');bb=overlay.getbbox();body=basecell.getbbox()
    if bb is None or body is None:return overlay
    x0,y0,x1,y1=bb
    # Do not lift shoulder strap away from shoulder. Compress only its
    # hanging extent on poses where generated pouch extends under feet.
    bottom=body[3]-1
    if y1<=bottom:return overlay
    out=Image.new('RGBA',(80,80));h=max(8,bottom-y0)
    z=overlay.crop(bb).resize((x1-x0,h),Image.Resampling.NEAREST)
    out.alpha_composite(z,(x0,y0));return out
