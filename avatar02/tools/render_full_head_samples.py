import sys,json
from pathlib import Path
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'tools'))
# Load renderer definitions only: importing normal module writes unrelated previews.
s=(R/'tools/render_proofs.py').read_text();scope={'__file__':str(R/'tools/render_proofs.py')};exec(s.split('allitems=m[\'items\']')[0],scope)
m=scope['m'];render=scope['render'];font=scope['font'];items=m['items'];hs=[i for i in items if i['slot']=='hair'];hats=[i for i in items if i['slot']=='hat'];head=[i for i in items if i['slot'] in ['hair','hat','glasses']]
outdir=R/'previews/full-head';outdir.mkdir(exist_ok=True)
for hat in hats:
 for ac,c in [('walk',1),('examine',2)]:
  im=Image.new('RGB',(800,1000),'#fff7e9');d=ImageDraw.Draw(im)
  for j,h in enumerate(hs):
   x=j%2*400;y=j//2*200;d.text((x+5,y+5),h['id']+' '+hat['id'],font=font,fill='black')
   for dr in range(4):
    z=render([h,hat],dr,c,ac).resize((96,96),Image.Resampling.NEAREST);im.paste(z,(x+dr*100,y+35),z)
  im.save(outdir/f'{hat["id"]}-{ac}-f{c}.png')
idle=m['motions']['idle'];print('idle',idle)
for part in range(2):
 im=Image.new('RGB',(800,800),'#fff7e9');d=ImageDraw.Draw(im)
 for j,i in enumerate(head[part*8:part*8+8]):
  x=j%2*400;y=j//2*200;d.text((x+5,y+5),i['id'],font=font,fill='black')
  for dr in range(4):
   z=render([i],dr,idle['frames'][0],idle['source']).resize((96,96),Image.Resampling.NEAREST);im.paste(z,(x+dr*100,y+35),z)
 im.save(outdir/f'idle-{part}.png')
print('Done')
