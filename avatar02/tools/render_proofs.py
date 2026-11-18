from PIL import Image,ImageDraw,ImageFont
import json,pathlib
R=pathlib.Path(__file__).resolve().parents[1];m=json.loads((R/'manifest.json').read_text());font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',11)
from fit_glasses_occlusion import fit_glasses_occlusion
cache={}
def cell(path,r,c):
 if path not in cache:cache[path]=Image.open(R/path).convert('RGBA')
 return cache[path].crop((c*80,r*80,c*80+80,r*80+80))
def render(items,r=0,c=1,ac='walk',lens='charcoal'):
 out=Image.new('RGBA',(80,80));hat=next((i for i in items if i['slot']=='hat'),None);skin=next((i['id'] for i in items if i['slot']=='skin'),'base')
 def files(i):return i.get('hatVariants',{}).get(hat['id'],i) if hat and i['slot']=='hair' else i
 for i in items:
  f=files(i)
  if f.get('rearFiles') and r!=2:out.alpha_composite(cell(f['rearFiles'][ac],r,c))
 out.alpha_composite(cell(m['base'][ac],r,c));under=out.copy()
 for slot in m['layerOrder']:
  if slot in ['base','hairRear','hand']:continue
  if slot=='hair' and r==2:
   for i in items:
    f=files(i)
    if f.get('rearFiles'):out.alpha_composite(cell(f['rearFiles'][ac],r,c))
  if slot=='eyes' and any(i['slot']=='eyes' for i in items):out.alpha_composite(cell(m['eyeCover'][skin][ac],r,c))
  for i in items:
   if i['slot']==slot and i['id']!='body-headphones':
    f=files(i);path=f.get('paletteFiles',{}).get(lens,{}).get(ac,f['files'][ac]);layer=cell(path,r,c)
    if slot=='glasses':
     hair=next((j for j in items if j['slot']=='hair'),None)
     layer=fit_glasses_occlusion(layer,cell(files(hair)['files'][ac],r,c) if hair else None,cell(hat['files'][ac],r,c) if hat else None,r)
    out.alpha_composite(layer)
  if slot=='hair':
   for hp in items:
    if hp['id']=='body-headphones':out.alpha_composite(cell(hp['files'][ac],r,c))
  if slot in ['skin','bottom','top','shoes']:under=out.copy()
 mask=cell(m['handsMask'][ac],r,c).getchannel('A');out.paste(under,(0,0),mask)
 if r==2:
  for i in items:
   if i['slot']=='hair':
    f=files(i)
    if f.get('rearFiles'):out.alpha_composite(cell(f['rearFiles'][ac],r,c))
    out.alpha_composite(cell(f['files'][ac],r,c))
  for hp in items:
   if hp['id']=='body-headphones':out.alpha_composite(cell(hp['files'][ac],r,c))
  if hat:out.alpha_composite(cell(hat['files'][ac],r,c))
 if r!=2 and any(i['slot']=='hand' for i in items):
  for i in items:
   if i['slot']=='hand':out.alpha_composite(cell(i['files'][ac],r,c))
  grip=cell(m['gripMask'][ac],r,c).getchannel('A');out.paste(under,(0,0),grip)
 return out

allitems=m['items'];out=Image.new('RGB',(1400,((len(allitems)+6)//7)*220),'#fff7e9');d=ImageDraw.Draw(out)
for j,i in enumerate(allitems):
 x=j%7*200;y=j//7*220;s=render([i]).resize((176,176),Image.Resampling.NEAREST);out.paste(s,(x+12,y+8),s);d.text((x+8,y+190),i['id'],font=font,fill='#49382b')
out.save(R/'previews/catalogue-front.png')
for slot in sorted(set(i['slot'] for i in allitems)):
 subset=[i for i in allitems if i['slot']==slot];out=Image.new('RGB',(800,len(subset)*200),'#fff7e9');d=ImageDraw.Draw(out)
 for j,i in enumerate(subset):
  for r in range(4):
   s=render([i],r).resize((160,160),Image.Resampling.NEAREST);out.paste(s,(r*200+20,j*200),s)
  d.text((10,j*200+174),i['id'],font=font,fill='#49382b')
 out.save(R/f'previews/{slot}-directions.png')
combos=[['hair-curly-bob','top-tee-striped','bottom-skirt-coral','shoes-loafers'],['hair-long-straight','top-cardigan-rust','bottom-trousers-navy','glasses-square'],['hat-beret','top-overall-denim','bottom-overall-denim','shoes-boots'],['hair-pigtails','top-hoodie-lavender','body-mini-bag'],['hair-braid','top-shirt-blue','body-headphones'],['hair-pixie','top-vest-moss','hand-takeout-cup']]
for ac in m['motions']:
 source=m['motions'][ac]['source'];frames=[]
 for c in m['motions'][ac]['frames']:
  out=Image.new('RGB',(960,700),'#fff7e9');d=ImageDraw.Draw(out);d.text((15,12),ac.upper()+' / review candidate combinations',font=font,fill='#49382b')
  for j,ids in enumerate(combos):
   its=[i for i in allitems if i['id'] in ids]
   for r in range(4):
    s=render(its,r,c,source).resize((100,100),Image.Resampling.NEAREST);x=j%2*480+r*110;y=j//2*220+40;out.paste(s,(x,y),s)
   d.text((j%2*480+10,j//2*220+155),' / '.join(ids[:2]),font=font,fill='#49382b')
  frames.append(out)
 frames[0].save(R/f'previews/{ac}-combinations.gif',save_all=True,append_images=frames[1:],duration=m['motions'][ac]['durationMs'],loop=0,disposal=2)
print('proofs rendered')

qa=R/'previews/individual';qa.mkdir(exist_ok=True)
for i in allitems:
 for ac in m['base']:
  out=Image.new('RGB',(640,700),'#fff7e9');d=ImageDraw.Draw(out);d.text((10,8),i['id']+' / '+ac+' / rows F R B L; columns frames 0 1 2 3',font=font,fill='#49382b')
  for r in range(4):
   for c in range(4):
    z=render([i],r,c,ac).resize((152,152),Image.Resampling.NEAREST);out.paste(z,(c*160,r*164+30),z)
  out.save(qa/f"{i['id']}--{ac}.png")
print('individual proofs rendered')
