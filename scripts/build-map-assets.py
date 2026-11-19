"""Build web-only individual sprite derivatives from the authoring layout; never flatten the scene.
Usage: python scripts/build-map-assets.py ../cafe-rebuild-assets
Requires Pillow only for authoring, not app runtime.
"""
import copy,hashlib,json,sys
from pathlib import Path
from PIL import Image
source=Path(sys.argv[1]).resolve(); target=Path(__file__).resolve().parents[1]/'public/assets/cafe-map'
layout=json.loads((source/'layout.json').read_text());canvas=layout['canvas'];provenance={};variants={}
for o in layout['objects']:
 path=source/o['asset'];img=Image.open(path).convert('RGBA');rect=o.get('sourceRect',[0,0,*img.size]);key=(o['asset'],tuple(rect))
 variants.setdefault(key,[]).append(o)
for (name,rect),objects in variants.items():
 path=source/name;img=Image.open(path).convert('RGBA');x,y,w,h=rect;img=img.crop((x,y,x+w,y+h))
 # Native authored scene size already covers >2x pixels for the compact phone map.
 maxw=max(o.get('tileSize',{}).get('width',o['width'])*canvas['width'] for o in objects)
 maxh=max(o.get('tileSize',{}).get('height',o['height'])*canvas['height'] for o in objects)
 scale=min(1,max(maxw/img.width,maxh/img.height));img=img.resize((max(1,round(img.width*scale)),max(1,round(img.height*scale))),Image.Resampling.NEAREST)
 suffix=hashlib.sha256((name+str(rect)).encode()).hexdigest()[:8];dest='sprites/'+Path(name).stem+'-'+suffix+'.webp';(target/'sprites').mkdir(exist_ok=True,parents=True);img.save(target/dest,'WEBP',lossless=True,method=6)
 provenance[dest]={'source':name,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sourceRect':rect,'outputSize':list(img.size)}
 for o in objects:o['asset']=dest;o.pop('sourceRect',None);o.pop('sourceSize',None)
layout['version']='1.0-modular';(target/'layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n')
(target/'asset-provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')
print(len(layout['objects']),'independent objects;',len(provenance),'sprite derivatives;',sum((target/p).stat().st_size for p in provenance),'bytes')
