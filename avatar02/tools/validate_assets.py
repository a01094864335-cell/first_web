from PIL import Image
import json,pathlib
r=pathlib.Path(__file__).resolve().parents[1];m=json.loads((r/'manifest.json').read_text())
files=list((r/'assets').glob('*/*.png'));edge=[]
for p in files:
 im=Image.open(p);assert im.size==(320,320),(p,im.size);assert im.mode=='RGBA',(p,im.mode)
 for row in range(4):
  for col in range(4):
   z=im.crop((col*80,row*80,col*80+80,row*80+80));b=z.getbbox()
   if b and (b[0]==0 or b[1]==0 or b[2]==80 or b[3]==80):edge.append((str(p.relative_to(r)),row,col,b))
assert not edge,edge
assert len(m['items'])==39
assert all(len(i['files'])==7 for i in m['items'])
print(f'{len(files)} RGBA atlases, dimensions, transparent cell margins and 39-item motion mappings passed.')
print('Geometric validity is NOT visual quality approval.')
