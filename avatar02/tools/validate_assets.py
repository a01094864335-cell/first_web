"""Schema/atlas regression checks, independent of catalogue item count.
Use --expected-items 51 to enforce the planned expansion count explicitly.
"""
from PIL import Image
import argparse,json,pathlib
parser=argparse.ArgumentParser();parser.add_argument('--expected-items',type=int);args=parser.parse_args()
r=pathlib.Path(__file__).resolve().parents[1];m=json.loads((r/'manifest.json').read_text())
assert m['cell']==[80,80] and m['directions']==['front','right','back','left']
sources={v.get('source',k) for k,v in m['motions'].items()}
assert sources==set(m['base']),('motion/base mismatch',sources,set(m['base']))
for motion in m['motions'].values():
 assert motion['frames'] and all(isinstance(f,int) and 0<=f<4 for f in motion['frames'])
 assert motion['durationMs']>0
items={i['id']:i for i in m['items']};assert len(items)==len(m['items']),'Duplicate item IDs'
if args.expected_items is not None:assert len(items)==args.expected_items,(len(items),args.expected_items)
baseline=json.loads((r/'tools/baseline-item-slots.json').read_text())
for id,slot in baseline.items():assert id in items and items[id]['slot']==slot,('Legacy item removed/re-slotted',id)
refs=set()
def mappings(files,label):
 assert set(files)==sources,('Incomplete action mapping',label,set(files),sources)
 for path in files.values():
  resolved=(r/path).resolve();assert resolved.is_relative_to(r.resolve()),('Outside asset root',path)
  assert resolved.is_file(),('Missing file',label,path);refs.add(resolved)
for key in ['base','handsMask','gripMask']:mappings(m[key],key)
for skin,covers in m['eyeCover'].items():mappings(covers,'eyeCover/'+skin)
for skin in ['base']+[i['id'] for i in items.values() if i['slot']=='skin']:
 assert skin in m['eyeCover'],('Missing skin eye cover',skin)
hats={i['id'] for i in items.values() if i['slot']=='hat'}
for i in items.values():
 assert i['slot'] in m['layerOrder'],('Unknown slot',i['id'],i['slot'])
 mappings(i['files'],i['id'])
 if i.get('rearFiles'):mappings(i['rearFiles'],i['id']+'/rear')
 for palette,files in i.get('paletteFiles',{}).items():mappings(files,i['id']+'/'+palette)
 if i['slot']=='eyes':
  assert set(m.get('lensColors',[]))-{'charcoal'}<=set(i.get('paletteFiles',{})),('Missing eye palette',i['id'])
 if i['slot']=='hair':
  assert set(i.get('hatVariants',{}))==hats,('Missing/unknown hair-hat variants',i['id'],hats-set(i.get('hatVariants',{})))
 for hat,v in i.get('hatVariants',{}).items():
  assert hat in hats
  mappings(v['files'],i['id']+'/'+hat)
  if v.get('rearFiles'):mappings(v['rearFiles'],i['id']+'/'+hat+'/rear')
edge=[]
for p in sorted(refs):
 im=Image.open(p);assert im.size==(320,320),(p,im.size);assert im.mode=='RGBA',(p,im.mode)
 for row in range(4):
  for col in range(4):
   z=im.crop((col*80,row*80,col*80+80,row*80+80));b=z.getbbox()
   if b and (b[0]==0 or b[1]==0 or b[2]==80 or b[3]==80):edge.append((str(p.relative_to(r)),row,col,b))
assert not edge,edge
print(f'{len(refs)} referenced RGBA atlases, dimensions, transparent margins; {len(items)} items/{len(sources)} source motions; all palettes/hair-hat mappings and {len(baseline)} legacy item slots passed.')
print('Geometric validity is NOT visual quality approval.')
