"""Actual new atlas composites, one complete 16-pose contact sheet per item/action."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import sys,json
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'tools'))
e={'__file__':str(R/'tools/render_proofs.py')}
exec((R/'tools/render_proofs.py').read_text().split('\nallitems=')[0],e)
render=e['render'];m=e['m']
ids={s['id'] for p in (R/'source').glob('expansion50_*/sources.json') for s in json.loads(p.read_text())}
out=R/'previews/expansion50-motion';out.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',20)
index=[]
for item in m['items']:
 if item['id'] not in ids:continue
 for action in m['base']:
  image=Image.new('RGB',(800,880),'#eee6d6');d=ImageDraw.Draw(image)
  d.text((15,10),item['id']+' · '+action,font=font,fill='#302820')
  for row in range(4):
   for frame in range(4):
    z=render([item],row,frame,action).resize((160,160),Image.Resampling.NEAREST)
    x=frame*200+20;y=row*205+60;image.paste(z,(x,y),z)
    d.text((x,y-22),m['directions'][row]+' '+str(frame),font=font,fill='#302820')
  name=item['id']+'--'+action+'.png';image.save(out/name)
  index.append({'item':item['id'],'action':action,'path':str((out/name).relative_to(R)),'poses':16})
(out/'index.json').write_text(json.dumps(index,indent=2))
print(len(index),'sheets',len(index)*16,'poses; rendering is not evidence of visual review.')
