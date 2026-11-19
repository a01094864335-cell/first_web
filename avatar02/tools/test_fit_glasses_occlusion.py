from PIL import Image
import numpy as np
from fit_glasses_occlusion import fit_glasses_occlusion
raw=Image.new('RGBA',(8,1),(10,20,30,255));hair=Image.new('RGBA',(8,1),(0,0,0,255))
for direction,expected in [(0,[255]*8),(1,[0]*4+[255]*4),(2,[0]*8),(3,[255]*4+[0]*4)]:
 actual=np.asarray(fit_glasses_occlusion(raw,hair,direction=direction))[:,:,3].ravel().tolist();assert actual==expected,(direction,actual)
assert np.asarray(fit_glasses_occlusion(raw,None,hair,0))[:,:,3].max()==0
assert raw.getpixel((0,0))[3]==255
print('Glasses occlusion: directional stems/lens preservation, cap mask, rear hiding, nonmutation passed')
