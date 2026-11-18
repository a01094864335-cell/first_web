/* No external runtime dependencies. Pure helpers are also exported for Node tests. */
(function (root) {
  'use strict';
  const DEFAULT_ORDER = ['hairRear', 'base', 'skin', 'eyes', 'bottom', 'shoes', 'top', 'body', 'hair', 'hat', 'glasses', 'hand'];
  function motionSpec(manifest, name) {
    const m = manifest.motions && manifest.motions[name];
    if (!m || !Array.isArray(m.frames) || !m.frames.length) throw new Error('Unknown/empty motion: ' + name);
    return { source: m.source || name, frames: m.frames, durationMs: Math.max(1, Number(m.durationMs) || 180) };
  }
  function frameAt(manifest, name, elapsedMs) {
    const m = motionSpec(manifest, name);
    return m.frames[Math.floor(Math.max(0, elapsedMs) / m.durationMs) % m.frames.length];
  }
  function stepFrame(manifest, name, current) {
    const frames = motionSpec(manifest, name).frames;
    return frames[(Math.max(-1, frames.indexOf(current)) + 1) % frames.length];
  }
  function fileFor(item, source, lens) {
    return (lens && item.paletteFiles && item.paletteFiles[lens] && item.paletteFiles[lens][source]) || (item.files && item.files[source]) || null;
  }
  function layerPlan(manifest, state, direction) {
    const source = motionSpec(manifest, state.motion).source;
    const selection = state.selection || {};
    const byId = new Map((manifest.items || []).map(i => [i.id, i]));
    const chosen = Object.entries(selection).map(([slot,id]) => byId.get(id)).filter(Boolean);
    const hat = chosen.find(i => i.slot === 'hat');
    const hairFiles = item => hat ? (item.hatVariants && item.hatVariants[hat.id]) : item;
    const order = manifest.layerOrder || DEFAULT_ORDER;
    const plan = [];
    function add(slot, path, item) { if (path) plan.push({slot, path, item: item ? item.id : null}); }
    for (const slot of order) {
      if (slot === 'base') { add(slot, manifest.base && manifest.base[source]); continue; }
      if (slot === 'hairRear') {
        if (direction !== 'back') for (const item of chosen.filter(i => i.slot === 'hair')) {const v=hairFiles(item);if(v)add(slot,(v.rearFiles&&v.rearFiles[source])||(item.layer==='rear'&&fileFor(v,source,state.lens)),item);}
        continue;
      }

      if (slot === 'hair' && direction === 'back') for (const item of chosen.filter(i => i.slot === 'hair')) {const v=hairFiles(item);if(v)add('hairRearCover',(v.rearFiles&&v.rearFiles[source])||(item.layer==='rear'&&fileFor(v,source,state.lens)),item);}
      if (slot === 'hand' && direction === 'back') continue;
      if (slot === 'eyes' && chosen.some(i => i.slot === 'eyes')) {
        const covers = manifest.eyeCover || {};
        const cover = covers[selection.skin] || covers.base;
        add('eyeCover', cover && cover[source]);
      }
      for (const item of chosen.filter(i => i.slot === slot)) {
        if ((item.layer === 'rear' && slot === 'hair') || item.id==='body-headphones') continue;
        const v=slot==='hair'?hairFiles(item):item;if(v)add(slot, fileFor(v, source, state.lens), item);
      }
    }
    const hp=chosen.find(i=>i.id==='body-headphones');
    if(hp){const entry={slot:'headphones',path:fileFor(hp,source,state.lens),item:hp.id};const at=plan.findIndex(l=>['hat','glasses','hand'].includes(l.slot));plan.splice(at<0?plan.length:at,0,entry);}
    return { source, layers: plan, handsMask: manifest.handsMask && manifest.handsMask[source], gripMask: manifest.gripMask && manifest.gripMask[source] };
  }
  function foregroundProtectionLayers(plan, direction) {
    // From behind, long hair covers the upper back. Hand restoration must not
    // repaint the original shirt/skin through that opaque hair. Repaint only
    // these visible hair layers after restoring hands; other slots keep order.
    if (direction !== 'back') return [];
    const hair = plan.layers.filter(l => l.slot === 'hairRearCover' || l.slot === 'hair');
    // Repainting hair after hands must not hide a hat's rear strap or brim.
    return hair.length ? [...hair, ...plan.layers.filter(l => l.slot === 'headphones'), ...plan.layers.filter(l => l.slot === 'hat')] : [];
  }
  function clipGlassesPixels(data,hair,hat,width,direction) {
    const out=new Uint8ClampedArray(data);let min=width,max=-1;
    for(let p=0;p<out.length;p+=4)if(out[p+3]){const x=(p/4)%width;min=Math.min(min,x);max=Math.max(max,x);}
    const mid=(min+max)/2;
    for(let p=0;p<out.length;p+=4){const x=(p/4)%width,stem=direction==='right'?x<mid:direction==='left'?x>mid:false;
      if(direction==='back'||(hat&&hat[p+3]>=128)||(stem&&hair&&hair[p+3]>=128))out[p+3]=0;
    }return out;
  }
  const API = {clipGlassesPixels, motionSpec, frameAt, stepFrame, fileFor, layerPlan, foregroundProtectionLayers};
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.AvatarViewer = API;
  if (typeof document === 'undefined') return;

  async function boot() {
    const $ = id => document.getElementById(id);
    const status = $('status'), issues = $('issues');
    let manifest;
    try {
      const response = await fetch('manifest.json');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      manifest = await response.json();
    } catch (e) {
      status.textContent = '목록을 읽지 못했습니다.';
      issues.textContent = 'manifest.json 로드 실패: ' + e.message + '. file:// 대신 같은 폴더의 로컬 HTTP 서버로 여세요.';
      return;
    }
    const motions = Object.keys(manifest.motions || {});
    if (!motions.length) throw new Error('manifest.motions is empty');
    const state = {motion: motions.includes('walk') ? 'walk' : motions[0], direction:'all', selection:{}, lens:'charcoal', paused:false, frame:0, grid:false};
    let origin = performance.now(), lastStatus = '', revision = 0;
    const imageCache = new Map(), failures = new Set();
    function img(path) {
      if (!imageCache.has(path)) {
        const image = new Image();
        image.onload = () => { revision++; };
        image.onerror = () => { failures.add(path); revision++; };
        image.src = path;
        imageCache.set(path,image);
      }
      return imageCache.get(path);
    }
    const options = (select, values) => {
      select.replaceChildren(...values.map(v => { const option = document.createElement('option'); option.value=v.value; option.textContent=v.label; return option; }));
    };
    options($('motion'), motions.map(v => ({value:v,label:v})));
    $('motion').value=state.motion;
    options($('direction'), [{value:'all',label:'전후좌우 모두'},...manifest.directions.map(v=>({value:v,label:v}))]);
    options($('lens'), (manifest.lensColors || ['charcoal','green','blue']).map(v=>({value:v,label:v})));
    const slots = [...new Set(manifest.items.map(i=>i.slot))];
    for (const slot of slots) {
      const label=document.createElement('label'); label.textContent=slot;
      const select=document.createElement('select'); select.setAttribute('aria-label',slot); select.dataset.slot=slot;
      options(select,[{value:'',label:'기본 / 없음'},...manifest.items.filter(i=>i.slot===slot).map(i=>({value:i.id,label:(i.label||i.id)}))]);
      select.addEventListener('change',()=>{state.selection[slot]=select.value; revision++; notes();});
      label.append(select); $('parts').append(label);
    }
    function notes() {
      const selected=manifest.items.filter(i=>Object.values(state.selection).includes(i.id));
      $('itemNotes').replaceChildren(...selected.flatMap(i=>(i.notes||[]).map(note=>{const li=document.createElement('li');li.textContent=(i.label||i.id)+': '+note;return li;})));
      if (state.selection.hat && state.selection.hair) {const li=document.createElement('li');li.textContent='모자에 맞춘 헤어 변형을 사용합니다. 해당 조합 파일이 없는 경우 헤어는 숨겨집니다.';$('itemNotes').prepend(li);}
    }
    function pause(value) {state.paused=value;$('pause').textContent=value?'재생':'일시정지';$('pause').setAttribute('aria-pressed',String(value));if(!value)origin=performance.now()-motionSpec(manifest,state.motion).frames.indexOf(state.frame)*motionSpec(manifest,state.motion).durationMs;revision++;}
    $('pause').addEventListener('click',()=>pause(!state.paused));
    $('step').addEventListener('click',()=>{pause(true);state.frame=stepFrame(manifest,state.motion,state.frame);revision++;});
    $('motion').addEventListener('change',()=>{state.motion=$('motion').value;origin=performance.now();state.frame=motionSpec(manifest,state.motion).frames[0];revision++;});
    $('direction').addEventListener('change',()=>{state.direction=$('direction').value;revision++;});
    $('lens').addEventListener('change',()=>{state.lens=$('lens').value;revision++;});
    $('grid').addEventListener('change',()=>{state.grid=$('grid').checked;revision++;});
    $('reset').addEventListener('click',()=>{state.selection={};for(const s of $('parts').querySelectorAll('select'))s.value='';notes();revision++;});
    const canvas=$('stage'),ctx=canvas.getContext('2d');
    if(!ctx){issues.textContent='Canvas 2D를 사용할 수 없습니다.';return;}
    const [cw,ch]=manifest.cell||[80,80];
    const tile=document.createElement('canvas'), before=document.createElement('canvas'), restored=document.createElement('canvas');tile.width=before.width=restored.width=cw;tile.height=before.height=restored.height=ch;
    const tc=tile.getContext('2d'),bc=before.getContext('2d'),rc=restored.getContext('2d');
    const preSlots=new Set(['hairRear','base','skin','eyeCover','eyes','bottom','shoes','top']);
    function paint(context,path,row,frame) { const image=img(path);if(image.complete&&image.naturalWidth)context.drawImage(image,frame*cw,row*ch,cw,ch,0,0,cw,ch); }
    function paintGlasses(path,row,frame,plan,dir) {
      const off=document.createElement('canvas');off.width=cw;off.height=ch;const oc=off.getContext('2d');
      const pixels=p=>{oc.clearRect(0,0,cw,ch);if(p)paint(oc,p,row,frame);return oc.getImageData(0,0,cw,ch).data;};
      const raw=pixels(path),hair=plan.layers.find(l=>l.slot==='hair'),hat=plan.layers.find(l=>l.slot==='hat');
      const out=oc.createImageData(cw,ch);out.data.set(clipGlassesPixels(raw,hair?pixels(hair.path):null,hat?pixels(hat.path):null,cw,dir));oc.putImageData(out,0,0);tc.drawImage(off,0,0);
    }
    let lastPaint='';
    function render(now) {
      if (!state.paused) state.frame=frameAt(manifest,state.motion,now-origin);
      const token=[state.motion,state.frame,state.direction,state.grid,revision].join('|');
      if(token!==lastPaint){
        lastPaint=token;
        const dirs=state.direction==='all'?manifest.directions:[state.direction];
        canvas.width=dirs.length*240;canvas.height=280;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#eaddc7';ctx.fillRect(0,0,canvas.width,canvas.height);
        dirs.forEach((dir,index)=>{
          const row=manifest.directions.indexOf(dir),plan=layerPlan(manifest,state,dir);
          tc.clearRect(0,0,cw,ch);bc.clearRect(0,0,cw,ch);tc.imageSmoothingEnabled=bc.imageSmoothingEnabled=false;
          const restore = path => {if(!path)return;const mask=img(path);if(mask.complete&&mask.naturalWidth){rc.clearRect(0,0,cw,ch);rc.globalCompositeOperation='source-over';rc.drawImage(before,0,0);rc.globalCompositeOperation='destination-in';paint(rc,path,row,state.frame);rc.globalCompositeOperation='source-over';tc.drawImage(restored,0,0);}};
          let hasHand=false;
          for(const l of plan.layers){if(l.slot==='hand'){restore(plan.handsMask);hasHand=true;}if(l.slot==='glasses')paintGlasses(l.path,row,state.frame,plan,dir);else paint(tc,l.path,row,state.frame);if(preSlots.has(l.slot))paint(bc,l.path,row,state.frame);}
          restore(hasHand?plan.gripMask:plan.handsMask);
          for (const l of foregroundProtectionLayers(plan,dir)) paint(tc,l.path,row,state.frame);
          const x=index*240+20,y=10,scale=2.5;
          ctx.drawImage(tile,x,y,200,200);
          if(state.grid){ctx.strokeStyle='#8b796160';ctx.lineWidth=1;for(let n=0;n<=80;n+=10){ctx.beginPath();ctx.moveTo(x+n*scale,y);ctx.lineTo(x+n*scale,y+200);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y+n*scale);ctx.lineTo(x+200,y+n*scale);ctx.stroke();}const [px,py]=manifest.pivot||[40,74];ctx.strokeStyle='#dc3244';ctx.beginPath();ctx.moveTo(x+px*scale-8,y+py*scale);ctx.lineTo(x+px*scale+8,y+py*scale);ctx.moveTo(x+px*scale,y+py*scale-8);ctx.lineTo(x+px*scale,y+py*scale+8);ctx.stroke();}
          ctx.fillStyle='#493b2d';ctx.font='15px system-ui';ctx.fillText(dir+' · frame '+state.frame,index*240+22,240);
        });
        const loaded=[...imageCache.values()].filter(i=>i.complete&&i.naturalWidth).length;
        const text=state.motion+' / '+(state.paused?'정지':'재생')+' / frame '+state.frame+' · 이미지 '+loaded+'/'+imageCache.size+' 로드 · manifest '+(manifest.version||'');
        if(text!==lastStatus){status.textContent=text;lastStatus=text;}
        issues.textContent=failures.size?'읽지 못한 이미지: '+[...failures].join(', '):'';
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }
  boot().catch(e=>{const el=document.getElementById('issues');if(el)el.textContent='미리보기 오류: '+e.message;});
})(typeof globalThis !== 'undefined' ? globalThis : this);
