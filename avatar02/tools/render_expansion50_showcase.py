from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import sys,json
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'tools'));e={'__file__':str(R/'tools/render_proofs.py')};exec((R/'tools/render_proofs.py').read_text().split('\nallitems=')[0],e);render=e['render'];m=e['m'];items={i['id']:i for i in m['items']}
sets=[['hair-twin-buns','hat-visor','top-sailor','bottom-skirt-wrap','shoes-mary-jane','glasses-cat-eye','body-satchel','hand-flower-pot'],['hair-mullet','hat-newsboy','top-denim-jacket','bottom-trousers-cuffed','shoes-high-tops','glasses-hexagon','body-backpack','hand-shopping-bag'],['hair-center-part','hat-straw','top-apron','bottom-skirt-tiered','shoes-clogs','glasses-aviator','body-scarf','hand-umbrella-folded'],['hair-spiky','hat-rain','top-puffer','bottom-shorts-athletic','shoes-rain-boots','glasses-sport-wrap','body-waist-pouch']]
out=R/'previews/expansion50';out.mkdir(exist_ok=True);font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',20);frames=[]
for ac in ['walk','greet','sit','celebrate']:
 for c in range(4):
  im=Image.new('RGB',(800,880),'#f5f1e9');d=ImageDraw.Draw(im);d.text((20,15),'실제 애셋 조합 · '+ac+' '+str(c),font=font,fill='#33453a')
  for row,ids in enumerate(sets):
   for col,r in enumerate([0,2,3,1]):
    z=render([items[id] for id in ids],r,c,ac).resize((180,180),Image.Resampling.NEAREST);im.paste(z,(col*200+10,row*205+65),z)
  frames.append(im)
  if c==1:im.save(out/f'outfits-{ac}.png')
frames[0].save(out/'four-outfits.gif',save_all=True,append_images=frames[1:],duration=300,loop=0)
(out/'showcase-items.json').write_text(json.dumps(sets,indent=2))
