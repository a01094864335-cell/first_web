from PIL import Image,ImageDraw,ImageFont
import pathlib,json,sys
R=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'tools'));e={'__file__':str(R/'tools/render_proofs.py')};exec((R/'tools/render_proofs.py').read_text().split('\nallitems=')[0],e)
render=e['render'];m=e['m'];items={i['id']:i for i in m['items']};O=pathlib.Path(sys.argv[1]);O.mkdir(exist_ok=True,parents=True)
combos=[(['hair-braid','hat-beanie','eyes-smile','skin-deep','top-hoodie-lavender','bottom-trousers-cargo','shoes-boots','body-headphones','hand-mug'],'blue'),(['hair-long-straight','hat-baseball','eyes-sleepy','skin-warm','top-cardigan-rust','bottom-skirt-pleated','shoes-loafers','body-tote','hand-book'],'green'),(['hair-afro','hat-bucket','eyes-dot','skin-deep','top-raglan','bottom-skirt-coral','shoes-sneakers','body-crossbody','hand-takeout-cup'],'blue'),(['hair-side-ponytail','hat-beret','eyes-smile','skin-warm','top-bomber','bottom-overall-denim','shoes-boots','body-mini-bag','hand-camera'],'green'),(['hair-high-bun','eyes-dot','top-turtleneck','bottom-trousers-navy','shoes-loafers','body-headphones','hand-mug'],'charcoal'),(['hair-buzz','hat-baseball','eyes-sleepy','skin-deep','top-vest-moss','bottom-shorts-charcoal','shoes-sneakers','body-tote','hand-book'],'blue')]
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
for ac in m['base']:
 for start in range(0,6,2):
  im=Image.new('RGB',(1280,700),'#fff7e9');d=ImageDraw.Draw(im)
  for col,(ids,lens) in enumerate(combos[start:start+2]):
   d.text((col*640+8,8),f'Outfit {start+col+1} / {ac} / F R B L rows; frames 0-3',font=f,fill='#3c3930')
   for r in range(4):
    for c in range(4):
     z=render([items[i] for i in ids],r,c,ac,lens).resize((152,152),Image.Resampling.NEAREST);im.paste(z,(col*640+c*160,r*164+32),z)
  im.save(O/f'{ac}-{start//2+1}.png')
(O/'combos.json').write_text(json.dumps(combos,indent=2));print('672 posed outfit composites in 21 sheets')
