import render_proofs as p
from PIL import Image,ImageDraw
r=p.R/'previews/eye-palettes';r.mkdir(exist_ok=True)
for skin in [None,*[i for i in p.allitems if i['slot']=='skin']]:
 for eye in [i for i in p.allitems if i['slot']=='eyes']:
  o=Image.new('RGB',(640,1510),'#fff7e9');d=ImageDraw.Draw(o)
  for l,lens in enumerate(['charcoal','green','blue']):
   for a,ac in enumerate(['walk','drink','celebrate']):
    y=(l*3+a)*166;d.text((5,y+2),lens+' / '+ac,font=p.font,fill='#49382b')
    for dr in range(4):
     z=p.render([eye]+([skin] if skin else []),dr,2 if ac!='celebrate' else 1,ac,lens).resize((144,144),Image.Resampling.NEAREST);o.paste(z,(dr*160+8,y+18),z)
  o.save(r/f"{skin['id'] if skin else 'skin-base'}--{eye['id']}.png")
print('9 palette proof sheets generated')
