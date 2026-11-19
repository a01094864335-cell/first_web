from pathlib import Path
from PIL import Image,ImageDraw
import argparse
p=argparse.ArgumentParser();p.add_argument('--output',required=True);args=p.parse_args()
R=Path(__file__).resolve().parents[1];ns={'__file__':str(R/'tools/render_proofs.py')};s=(R/'tools/render_proofs.py').read_text().split('allitems=m[\'items\']')[0];exec(s,ns)
m=ns['m'];render=ns['render'];items={i['id']:i for i in m['items']};dest=Path(args.output);dest.mkdir(exist_ok=True)
tops=['top-vest','top-shirt-blue','top-cardigan-rust','top-hoodie-lavender','top-vest-moss','top-overall-denim'];bottoms=['bottom-shorts','bottom-shorts-charcoal','bottom-trousers-navy','bottom-skirt-coral','bottom-overall-denim'];acts=list(m['base'])
for id in tops+bottoms:
 ids=[id,'skin-deep','eyes-dot', 'bottom-trousers-navy' if id in tops else 'top-shirt-blue'];out=Image.new('RGB',(1280,7*100+25),'#fff7e9');d=ImageDraw.Draw(out);d.text((4,3),' + '.join(ids)+' | groups F R B L each frame0..3',fill='black')
 for ai,ac in enumerate(acts):
  d.text((4,25+ai*100),ac,fill='black')
  for dr in range(4):
   for f in range(4):
    z=render([items[x] for x in ids],dr,f,ac);out.paste(z,((dr*4+f)*80,ai*100+43),z)
 out.save(dest/f'{id}.png')
print('11 sheets complete')
