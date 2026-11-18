import render_proofs as p
from PIL import Image,ImageDraw
r=p.R/'previews/hat-combinations';r.mkdir(exist_ok=True)
hairs=[i for i in p.allitems if i['slot']=='hair'];hats=[i for i in p.allitems if i['slot']=='hat']
for hat in hats:
 for ac in p.m['base']:
  o=Image.new('RGB',(1280,2100),'#fff7e9');d=ImageDraw.Draw(o)
  for h,hair in enumerate(hairs):
   d.text((h%2*640+6,h//2*700+6),hair['id']+' + '+hat['id']+' / '+ac,font=p.font,fill='#49382b')
   for dr in range(4):
    for c in range(4):
     z=p.render([hair,hat],dr,c,ac).resize((152,152),Image.Resampling.NEAREST);o.paste(z,(h%2*640+c*160,h//2*700+dr*164+30),z)
  o.save(r/f"{hat['id']}--{ac}.png")
print('21 hat combination contact sheets ready')
