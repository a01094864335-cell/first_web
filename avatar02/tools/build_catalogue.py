"""Compile reviewed source overlays into deterministic action atlases. Pillow, numpy, scipy required."""
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,pathlib,shutil
from scipy import ndimage
from functools import lru_cache
from fit_shoes import fit_shoes
from fit_bottoms import fit_bottoms
from fit_hand_props import fit_hand_prop, grip_mask
from fit_eyes import fit_eyes
from fit_hat_hair import fit_hat_hair_atlas
from fit_mini_bag import fit_mini_bag
from fit_clothes import fit_top, fit_skirt
ROOT=pathlib.Path(__file__).resolve().parents[1]
V3=ROOT/'source/baseline'
ACTIONS=['walk','greet','drink','examine','sit','celebrate','dress']
items=[];base={};hands={};grips={};eyeCover={k:{} for k in ['base','skin-warm','skin-deep']};meta={}
def save(im,action,id):
 p=ROOT/'assets'/action/f'{id}.png';p.parent.mkdir(parents=True,exist_ok=True);im.save(p);return str(p.relative_to(ROOT))
@lru_cache(maxsize=256)
def crop(source,col,row,rows):
 im=Image.open(source).convert('RGBA');w,h=im.size;s=im.crop((round(col*w/4),round(row*h/rows),round((col+1)*w/4),round((row+1)*h/rows)));a=np.array(s);lab,n=ndimage.label(a[:,:,3]>160);sz=np.bincount(lab.ravel());sz[0]=0
 if not sz.max():return Image.new('RGBA',(1,1))
 keep=sz>max(6,sz.max()*.12);keep[0]=False;a[:,:,3]=np.where(keep[lab],255,0);s=Image.fromarray(a);return s.crop(s.getbbox())
def add_existing(id,slot,sourceid,label):
 files={}
 for ac in ACTIONS:
  im=Image.open(V3/ac/'assets'/f'{sourceid}.png').convert('RGBA')
  if slot=='hat':
   fixed=Image.new('RGBA',(320,320))
   for r in range(4):
    for c in range(4):
     z=im.crop((c*80,r*80,c*80+80,r*80+80));box=z.getbbox();dy=1 if box and box[1]==0 else 0;fixed.alpha_composite(z,(c*80,r*80+dy))
   im=fixed
  if slot=='glasses':
   fixed=Image.new('RGBA',(320,320))
   for r in range(4):
    for c in range(4):
     z=im.crop((c*80,r*80,c*80+80,r*80+80));box=z.getbbox()
     if box and r in [1,3]:
      piece=z.crop(box).transpose(Image.Transpose.FLIP_LEFT_RIGHT);z=Image.new('RGBA',(80,80));z.alpha_composite(piece,(box[0],box[1]))
     if box and r!=2:
      mm=meta[ac,r,c];dy=round(np.mean(mm.get('eyeYs',[mm['headtop']+24]))-(box[1]+box[3])/2);fixed.alpha_composite(z,(c*80,r*80+dy))
     elif r!=2:fixed.alpha_composite(z,(c*80,r*80))
   im=fixed
  if slot=='skin':
   ar=np.array(im);bb=np.array(Image.open(V3/ac/'assets/base.png'));rr=bb[:,:,0].astype(int);gg=bb[:,:,1].astype(int);bl=bb[:,:,2].astype(int);valid=(rr-gg>22)&(gg-bl>20);ar[:,:,3]=np.where(valid,ar[:,:,3],0);im=Image.fromarray(ar)
  files[ac]=save(im,ac,id)
 items.append({'id':id,'slot':slot,'label':label,'files':files,'status':'review-candidate','notes':['Inherited v3 overlay, reviewed alongside fitted catalogue; see category QA records.']})
for ac in ACTIONS:
 b=Image.open(V3/ac/'assets/base.png').convert('RGBA');base[ac]=save(b,ac,'base');hands[ac]=save(Image.open(V3/ac/'assets/hands-mask.png'),ac,'hands-mask')
 for r in range(4):
  for c in range(4):
   box=(c*80,r*80,c*80+80,r*80+80);cell=b.crop(box);ar=np.array(cell);rr,gg,bb=[ar[:,:,i].astype(int) for i in range(3)];skin=(rr>145)&(rr-gg>12)&(gg-bb>10)&(ar[:,:,3]>0);lab,n=ndimage.label(skin);sz=np.bincount(lab.ravel());sz[0]=0;head=lab==sz.argmax();hy,hx=np.where(head)
   meta[ac,r,c]={'headtop':int(hy.min()),'headbottom':int(hy.max()),'cx':float((hx.min()+hx.max())/2),'headwidth':int(hx.max()-hx.min()+3),'bottom':cell.getbbox()[3],'cell':cell}
 grip=Image.new('RGBA',(320,320));hm=Image.open(V3/ac/'assets/hands-mask.png').convert('RGBA')
 for r in range(4):
  for c in range(4):
   grip.alpha_composite(grip_mask(meta[ac,r,c]['cell'],hm.crop((c*80,r*80,c*80+80,r*80+80))),(c*80,r*80))
 grips[ac]=save(grip,ac,'hand-grip-mask')
 # Cover original eyes using adjacent face color, including closed-eye pose.
 covers={k:Image.new('RGBA',(320,320)) for k in eyeCover}
 for r in [0,1,3]:
  for c in range(4):
   mm=meta[ac,r,c];ar=np.array(mm['cell']);dark=(ar[:,:,0]<90)&(ar[:,:,3]>0);ll,nn=ndimage.label(dark);cover=np.zeros_like(ar)
   for j in range(1,nn+1):
    yy,xx=np.where(ll==j)
    # Eyes are compact interior components on the forward half of profiles.
    # Do not mistake disconnected ear/jaw outline fragments for eyes.
    interior=ndimage.distance_transform_edt(ar[:,:,3]>0)
    forward=(r==0 or (r==1 and xx.mean()>mm['cx']+4) or (r==3 and xx.mean()<mm['cx']-4))
    if (2<=len(xx)<=65 and yy.max()-yy.min()<=10 and xx.max()-xx.min()<=12
        and yy.min()>mm['headtop']+12 and yy.max()<mm['headbottom']-3
        and xx.min()>mm['cx']-17 and xx.max()<mm['cx']+17
        and forward and interior[yy,xx].min()>=3):
     meta[ac,r,c].setdefault('eyeYs',[]).extend([int(yy.min()),int(yy.max())])
     region=ndimage.binary_dilation(ll==j,iterations=1)&(interior>=3);ry,rx=np.where(region)
     for y,x in zip(ry,rx):
      # nearest non-dark skin on same scanline
      choices=[ar[y,tx] for tx in range(max(0,x-5),min(80,x+6)) if ar[y,tx,0]>145 and int(ar[y,tx,0])-int(ar[y,tx,1])>12]
      if choices:cover[y,x]=np.median(choices,axis=0).astype('uint8');cover[y,x,3]=255
   for name in covers:
    arr=cover.copy();mask=arr[:,:,3]>0
    if name!='base':
     col=np.array([232,175,127] if name=='skin-warm' else [139,84,54]);arr[mask,:3]=col
    covers[name].alpha_composite(Image.fromarray(arr),(c*80,r*80))
 for name,s in covers.items():eyeCover[name][ac]=save(s,ac,'eye-cover-'+name)
add_existing('skin-warm','skin','skin-warm','피부 · 따뜻한 톤')
add_existing('skin-deep','skin','skin-deep','피부 · 깊은 톤')
add_existing('hair-short','hair','hair-crop-brown','짧은 머리')
add_existing('top-plain','top','shirt-mint','무지 티')
add_existing('top-vest','top','vest-teal','조끼')
add_existing('bottom-shorts','bottom','pants-navy','반바지')
add_existing('hat-baseball','hat','cap-blue','야구모자')
add_existing('glasses-round','glasses','glasses-round','동그란 안경')
add_existing('body-crossbody','body','bag-mustard','크로스백')
# Hand mug: position for all actions, drink has contact fitted source.
add_existing('hand-mug','hand','cup-white','머그컵')
for ac in ACTIONS:
 s=Image.new('RGBA',(320,320));src=Image.open(V3/'drink/assets/cup-white.png').convert('RGBA');hm=Image.open(V3/ac/'assets/hands-mask.png').convert('RGBA')
 for r in range(4):
  if r==2:continue
  z=src.crop((0,r*80,80,r*80+80));z=z.crop(z.getbbox())
  for c in range(4):
   mm=meta[ac,r,c];mask=hm.crop((c*80,r*80,c*80+80,r*80+80));fit=fit_hand_prop(z,mm['cell'],mask,r,ac,c,'hand-mug');s.alpha_composite(fit,(c*80,r*80))
 save(s,ac,'hand-mug')
sources=[]
for p in (ROOT/'source').glob('*/sources.json'):
 for spec in json.loads(p.read_text()):
  spec['path']=str(ROOT/spec['path']);sources.append(spec)
for spec in sources:
 id=spec['id'];slot=spec['slot'];slot={'head':'hat','face':'glasses'}.get(slot,slot)
 if any(i['id']==id for i in items):continue
 files={};rearFiles={};notes=['Four directional source silhouettes fitted to seven action atlases. Not hand-redrawn for every pose.']
 for ac in ACTIONS:
  sheet=Image.new('RGBA',(320,320));rear=Image.new('RGBA',(320,320))
  for r in range(4):
   z0=crop(spec['path'],r,spec['row'],spec['rows'])
   if slot=='glasses' and r==2:continue
   if slot=='glasses' and r in [1,3]:z0=z0.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
   if ['front','right','back','left'][r] in spec.get('emptyDirections',[]):continue
   for c in range(4):
    mm=meta[ac,r,c];cx=mm['cx'];ht=mm['headtop'];hb=mm['headbottom'];bottom=mm['bottom']
    if id in ['top-shirt-blue','top-cardigan-rust','top-hoodie-lavender']:
     fitted=fit_top(z0,mm['cell'],r,ac,c,id=id);sheet.alpha_composite(fitted,(c*80,r*80));continue
    if slot=='bottom' and 'skirt' in id:
     fitted=fit_skirt(z0,mm['cell'],r,ac,c,id=id);sheet.alpha_composite(fitted,(c*80,r*80));continue
    if id=='body-mini-bag':
     fitted=fit_mini_bag(z0,mm['cell'],r,ac,c);sheet.alpha_composite(fitted,(c*80,r*80));continue
    if slot=='bottom' and 'skirt' not in id:
     fitted=fit_bottoms(z0,mm['cell'],r,ac,c,id=id);sheet.alpha_composite(fitted,(c*80,r*80));continue
    if slot=='hand':
     hm=Image.open(V3/ac/'assets/hands-mask.png').convert('RGBA').crop((c*80,r*80,c*80+80,r*80+80));fitted=fit_hand_prop(z0,mm['cell'],hm,r,ac,c,id);sheet.alpha_composite(fitted,(c*80,r*80));continue
    if slot=='shoes':
     fitted=fit_shoes(z0,mm['cell'],r,ac,c);sheet.alpha_composite(fitted,(c*80,r*80));continue
    if slot=='hair':
     tw=round(mm['headwidth']*spec.get('widthScale',1.1));th=round(tw*z0.height/z0.width);th=min(th,48 if id=='hair-long-straight-rear' else 57);x=round(cx-tw/2);y=ht-4-(2 if id=='hair-pigtails' else 0)
    elif slot=='hat':tw=48;th=26;x=round(cx-24);y=ht-5
    elif slot=='glasses':tw=35 if r in[0,2] else 27;th=max(4,round(tw*z0.height/z0.width));x=round(cx-tw/2);y=round(np.mean(mm.get('eyeYs',[ht+22,ht+26]))-th/2)
    elif slot=='top':tw=26 if r in[0,2] else 16;th=20;x=round(cx-tw/2);y=hb+1
    elif slot=='bottom':tw=24 if r in[0,2] else 17;th=12 if 'skirt' not in id else 13;x=round(cx-tw/2);y=bottom-th-3
    elif slot=='shoes':tw=25 if r in[0,2] else 23;th=8 if 'boots' not in id else 13;x=round(cx-tw/2);y=bottom-th
    elif slot=='body' and 'headphones' in id:
     tw=48 if r in [0,2] else 19;th=43 if r in [0,2] else 35;x=round(cx-tw/2+(-8 if r==1 else 8 if r==3 else 0));y=ht-5
    elif slot=='body':tw=24 if r in[0,2] else 14;th=23;x=round(cx-tw/2);y=hb+1
    elif slot=='hand':
     if r==2:continue
     tw=13 if 'book' not in id else 16;th=14;x=round(cx-tw/2+(10 if r in [0,1] else -10));y=hb+(0 if ac=='drink' and c in[1,2] else 7)
    else:raise ValueError((id,slot))
    z=z0.resize((tw,th),Image.Resampling.NEAREST)
    # Do not rotate accessories independently of the unrotated head base.
    # Clamp canvas, not anatomy. Preserve complete garment; reviewer sees fit constraints.
    x=max(1,min(79-z.width,x));y=max(0,min(79-z.height,y))
    sheet.alpha_composite(z,(c*80+x,r*80+y))
  files[ac]=save(sheet,ac,id)
 items.append({'id':id,'slot':slot,'label':spec.get('label',id),'files':files,'rearPair':spec.get('rearPair'),'isRear':spec.get('rear',False),'pair':spec.get('pair'),'status':'review-candidate','notes':notes+(['Footwear source separated and fitted to detected baseline feet; complex gait shading still needs art polish.'] if slot=='shoes' else [])})
# Link separately generated rear hair to the selectable front item.
for item in items:
 if item.get('rearPair'):
  item['rearFiles']=next(x['files'] for x in items if x['id']==item['rearPair'])
items=[x for x in items if not x.get('isRear')]
# Hat-specific clipped front/rear hair preserves fringe instead of hiding hair.
for item in [i for i in items if i['slot']=='hair']:
 item['hatVariants']={}
 for hat in [i for i in items if i['slot']=='hat']:
  ff={};rr={}
  for ac in ACTIONS:
   front=Image.open(ROOT/item['files'][ac]).convert('RGBA');rear=Image.open(ROOT/item['rearFiles'][ac]).convert('RGBA') if item.get('rearFiles') else None
   fitted=fit_hat_hair_atlas(front,Image.open(ROOT/hat['files'][ac]).convert('RGBA'),rear)
   ff[ac]=save(fitted['front'],ac,item['id']+'--'+hat['id']);rr[ac]=save(fitted['rear'],ac,item['id']+'--'+hat['id']+'-rear')
  item['hatVariants'][hat['id']]={'files':ff,'rearFiles':rr}
# Pose-aware eye overlays and lens palettes.
eyeSource=ROOT/'source/eyes.png'
for row,(id,label) in enumerate([('eyes-dot','점 눈'),('eyes-sleepy','졸린 눈'),('eyes-smile','웃는 눈')]):
 files={};pals={'green':{},'blue':{}}
 for ac in ACTIONS:
  sheets={k:Image.new('RGBA',(320,320)) for k in ['charcoal','green','blue']}
  for r in range(4):
   z0=crop(eyeSource,r,row,3)
   for c in range(4):
    mm=meta[ac,r,c]
    for palette in sheets:
     sheets[palette].alpha_composite(fit_eyes(z0,mm['cell'],r,ac,c,id,meta=mm,palette=palette),(c*80,r*80))
  files[ac]=save(sheets['charcoal'],ac,id)
  for palette in pals:pals[palette][ac]=save(sheets[palette],ac,id+'-'+palette)
 items.append({'id':id,'slot':'eyes','label':label,'files':files,'paletteFiles':pals,'status':'review-candidate','notes':['Pose expressions override cosmetic shape during drinking, smiling and celebration; rear eyes hidden.']})
for item in items:
 if item['id']=='hand-book':item['notes'].append('Book stowed during drink; held/read-like pose during examine.')
motions={a:{'source':a,'frames':[0,1,2,3],'durationMs':180 if a=='walk' else 400} for a in ACTIONS};motions={'idle':{'source':'walk','frames':[1],'durationMs':600},**motions}
manifest={'version':'0.5-pose-aware-catalogue','cell':[80,80],'pivot':[40,74],'directions':['front','right','back','left'],'motions':motions,'items':items,'base':base,'handsMask':hands,'gripMask':grips,'eyeCover':eyeCover,'lensColors':['charcoal','green','blue'],'layerOrder':['hairRear','base','skin','eyes','bottom','shoes','top','body','hair','hat','glasses','hand'],'warnings':['All requested named silhouettes are represented; final production QA is not complete.','Accessory/clothing transforms are deterministic fitting, not frame-by-frame drawn articulation.','Motion-specific sleeves, seated skirt, prop grip and hat-hair variants fitted; final game runtime validation still required.']}
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print('ITEMS',len(items),[(s,len([i for i in items if i['slot']==s])) for s in sorted({i['slot'] for i in items})])
