"""Render newly added actual overlays; no generative mockups in this catalogue."""
from PIL import Image,ImageDraw,ImageFont
import pathlib,json,sys
R=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(R/'tools'))
e={'__file__':str(R/'tools/render_proofs.py')};exec((R/'tools/render_proofs.py').read_text().split('\nallitems=')[0],e)
render=e['render'];m=e['m'];out=R/'previews/expansion50';out.mkdir(parents=True,exist_ok=True)
ids={s['id'] for p in (R/'source').glob('expansion50_*/sources.json') for s in json.loads(p.read_text()) if not s.get('rear')}
items=[i for i in m['items'] if i['id'] in ids]
assert len(items)==len(ids), 'Build the new assets first'
font=lambda n:ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',n)
groups=[]
for slot,title in [('hair','헤어'),('top','상의'),('bottom','하의'),('shoes','신발'),('hat','모자'),('glasses','안경'),('body','몸 소품'),('hand','손 소품')]:
 batch=[i for i in items if i['slot']==slot]
 for k in range(0,len(batch),4):groups.append((title,batch[k:k+4]))

number=0
for page,(title,batch) in enumerate(groups,1):
 n=number;im=Image.new('RGB',(800,156+len(batch)*256+50),'#f5f1e9');d=ImageDraw.Draw(im)
 d.text((28,20),'02 추가 파츠 · '+title,font=font(34),fill='#2e3530');d.text((28,72),'실제 애셋 착용 · 대기 포즈',font=font(23),fill='#667168')
 for col,t in enumerate(['앞','뒤','좌','우']):d.text((col*192+86,113),t,font=font(24),fill='#49564d')
 for j,i in enumerate(batch):
  y=156+j*256;d.rounded_rectangle((16,y,784,y+244),radius=14,fill='#fffdf7');d.text((32,y+11),f'{n+j+1:02}  '+i['label'],font=font(27),fill='#33453a')
  for col,r in enumerate([0,2,3,1]):
   z=render([i],r,1,'walk').resize((160,160),Image.Resampling.NEAREST);x=col*192+32;im.paste(z,(x,y+48),z)
   if r==2 and i['slot'] in ['hand','glasses']:d.text((x+12,y+210),'뒷면 비표시',font=font(21),fill='#65736a')
 d.text((28,im.height-36),f'{page:02} · 해당 파츠만 착용 / 기본 옷·몸체는 공통',font=font(20),fill='#667168');im.save(out/f'catalogue-{page:02}.png')
 number+=len(batch)
print('Expansion catalogue',len(items),'items;',len(items)*4,'views')
