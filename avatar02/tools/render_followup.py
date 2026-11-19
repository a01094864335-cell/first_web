import render_proofs as p
from PIL import Image,ImageDraw
combos=[['hair-pigtails','hat-baseball','top-hoodie-lavender','bottom-trousers-navy','hand-mug','eyes-dot'],['hair-long-straight','hat-beret','top-cardigan-rust','bottom-skirt-coral','body-mini-bag','eyes-sleepy'],['hair-braid','hat-beanie','top-shirt-blue','bottom-overall-denim','shoes-boots','hand-takeout-cup','eyes-smile']]
frames=[]
for ac in ['greet','drink','sit','celebrate']:
 for c in range(4):
  o=Image.new('RGB',(960,680),'#fff7e9');d=ImageDraw.Draw(o);d.text((18,12),'POSE-AWARE FOLLOW-UP / '+ac+' / frame '+str(c),font=p.font,fill='#49382b')
  for n,ids in enumerate(combos):
   items=[i for i in p.allitems if i['id'] in ids]
   for r in range(4):
    z=p.render(items,r,c,ac).resize((200,200),Image.Resampling.NEAREST);o.paste(z,(r*240+20,n*210+40),z)
  frames.append(o)
frames[0].save(p.R/'previews/pose-aware-followup.gif',save_all=True,append_images=frames[1:],duration=450,loop=0,disposal=2)
for n,f in enumerate(frames):
 if n in[1,6,10,13]:f.save(p.R/f'previews/followup-frame-{n:02}.png')
print('followup motion montage ready')
