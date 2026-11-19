from PIL import Image,ImageDraw,ImageFont
import pathlib,sys
R=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'tools'));e={'__file__':str(R/'tools/render_proofs.py')};exec((R/'tools/render_proofs.py').read_text().split('\nallitems=')[0],e)
render=e['render'];items={i['id']:i for i in e['m']['items']};O=R/'previews/expansion';O.mkdir(exist_ok=True)
combos=[['hair-buzz','top-bomber','bottom-trousers-cargo','shoes-boots','hand-camera'],['hair-afro','top-raglan','bottom-skirt-pleated','shoes-sneakers','body-tote'],['hair-high-bun','top-turtleneck','bottom-skirt-pleated','shoes-loafers','glasses-round'],['hair-side-ponytail','hat-bucket','top-raglan','bottom-trousers-cargo','body-tote']]
f=lambda n:ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',n);frames=[]
for ac,title in [('walk','걷기'),('greet','인사'),('sit','앉기'),('celebrate','기쁨')]:
 for c in range(4):
  im=Image.new('RGB',(800,920),'#f5f1e9');d=ImageDraw.Draw(im);d.text((24,15),'새 파츠 실제 조합 · '+title,font=f(28),fill='#35463c')
  for col,t in enumerate(['앞','뒤','좌','우']):d.text((col*192+88,58),t,font=f(22),fill='#667168')
  for j,ids in enumerate(combos):
   y=98+j*200;d.rounded_rectangle((12,y,788,y+192),radius=12,fill='#fffdf7');d.text((22,y+5),f'{j+1:02}',font=f(20),fill='#667168')
   for col,r in enumerate([0,2,3,1]):
    z=render([items[k] for k in ids],r,c,ac).resize((160,160),Image.Resampling.NEAREST);im.paste(z,(col*192+32,y+28),z)
  frames.append(im)
  if c==1:im.save(O/f'motion-{ac}.png')
frames[0].save(O/'new-outfits.gif',save_all=True,append_images=frames[1:],duration=400,loop=0,disposal=2)
print('four new outfits, four directions, four actions/16 frames')
