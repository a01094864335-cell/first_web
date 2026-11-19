import sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from fit_eyes import fit_eyes
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[1];src=Image.open(root/'source/eyes.png').convert('RGBA')
count=0
for row,id in enumerate(['eyes-dot','eyes-sleepy','eyes-smile']):
 for ac in ['walk','greet','drink','examine','sit','celebrate','dress']:
  atlas=Image.open(root/f'assets/{ac}/base.png').convert('RGBA')
  for r in range(4):
   for c in range(4):
    cell=atlas.crop((c*80,r*80,c*80+80,r*80+80))
    for pal in ['charcoal','green','blue']:
     z=src.crop((round(r*src.width/4),round(row*src.height/3),round((r+1)*src.width/4),round((row+1)*src.height/3)));z=z.crop(z.getbbox());im=fit_eyes(z,cell,r,ac,c,id,palette=pal)
     assert im.size==(80,80)
     assert bool(im.getbbox())==(r!=2),(id,ac,r,c)
     count+=1
print(count,'pose/palette outputs valid dimensions and rear visibility')
for action,frame in [('drink',2),('sit',2),('celebrate',1),('celebrate',3)]:
 atlas=Image.open(root/f'assets/{action}/base.png').convert('RGBA')
 for r in [0,1,3]:
  cell=atlas.crop((frame*80,r*80,frame*80+80,r*80+80))
  variants=[fit_eyes(src,cell,r,action,frame,id).tobytes() for id in ['eyes-dot','eyes-sleepy','eyes-smile']]
  assert len(set(variants))==1,(action,r,frame,'expression should override cosmetic selection')
print('12 expression key poses consistently override all 3 cosmetic shapes')
