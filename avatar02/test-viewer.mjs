import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const api=require('./viewer.js');
const fixture={cell:[80,80],directions:['front','right','back','left'],motions:{idle:{source:'walk',frames:[1],durationMs:600},walk:{source:'walk',frames:[0,1,2,3],durationMs:180},drink:{source:'drink',frames:[0,1,2,3],durationMs:400}},base:{walk:'base-w.png',drink:'base-d.png'},handsMask:{walk:'mask-w.png',drink:'mask-d.png'},eyeCover:{base:{walk:'face.png'},'skin-deep':{walk:'face-deep.png'}},items:[{id:'hair-long',slot:'hair',files:{walk:'hair.png'},rearFiles:{walk:'rear.png'}},{id:'cap',slot:'hat',files:{walk:'cap.png'}},{id:'mug',slot:'hand',files:{walk:'mug.png'}},{id:'skin-deep',slot:'skin',files:{walk:'skin.png'}},{id:'smile',slot:'eyes',files:{walk:'smile.png'},paletteFiles:{green:{walk:'smile-green.png'}}}]};
assert.equal(api.frameAt(fixture,'walk',0),0);
assert.equal(api.frameAt(fixture,'walk',179),0);
assert.equal(api.frameAt(fixture,'walk',180),1);
assert.equal(api.frameAt(fixture,'walk',720),0);
assert.equal(api.frameAt(fixture,'walk',-500),0);
assert.equal(api.frameAt(fixture,'idle',99999),1);
assert.equal(api.stepFrame(fixture,'walk',3),0);
assert.equal(api.stepFrame(fixture,'idle',1),1);
assert.equal(api.stepFrame(fixture,'walk',99),0);
assert.throws(()=>api.motionSpec(fixture,'missing'));
let state={motion:'idle',selection:{hair:'hair-long',hand:'mug'},lens:'charcoal'};
let plan=api.layerPlan(fixture,state,'front');
assert.equal(plan.source,'walk');
assert.deepEqual(plan.layers.map(l=>l.path),['rear.png','base-w.png','hair.png','mug.png']);
assert.equal(plan.handsMask,'mask-w.png');
assert.ok(!api.layerPlan(fixture,state,'back').layers.some(l=>l.slot==='hand'));
assert.deepEqual(api.layerPlan(fixture,state,'back').layers.map(l=>l.path),['base-w.png','rear.png','hair.png'],'rear scalp hair must be above base in back view');
assert.deepEqual(api.foregroundProtectionLayers(api.layerPlan(fixture,state,'back'),'back').map(l=>l.path),['rear.png','hair.png'],'back hair must be protected after hand restoration');
assert.deepEqual(api.foregroundProtectionLayers(api.layerPlan(fixture,state,'front'),'front'),[],'front hair must not change regular hand/prop occlusion');
state.selection.hat='cap';plan=api.layerPlan(fixture,state,'front');
assert.ok(!plan.layers.some(l=>['hair','hairRear'].includes(l.slot)));
assert.ok(plan.layers.some(l=>l.path==='cap.png'));
assert.deepEqual(api.foregroundProtectionLayers(api.layerPlan(fixture,state,'back'),'back'),[],'hat-hidden hair must never be repainted');
state={motion:'walk',selection:{skin:'skin-deep',eyes:'smile'},lens:'green'};
plan=api.layerPlan(fixture,state,'front');
assert.deepEqual(plan.layers.map(l=>l.path),['base-w.png','skin.png','face-deep.png','smile-green.png']);
state.selection.skin='not-in-manifest';
assert.ok(api.layerPlan(fixture,state,'front').layers.some(l=>l.path==='face.png'));
assert.equal(api.fileFor(fixture.items.at(-1),'walk','unsupported'),'smile.png');
const dir=path.dirname(fileURLToPath(import.meta.url));
const manifestPath=path.join(dir,'manifest.json');
let files=0,combinations=0;
if(existsSync(manifestPath)){
 const m=JSON.parse(readFileSync(manifestPath,'utf8'));
 assert.equal(new Set(m.items.map(i=>i.id)).size,m.items.length,'duplicate item ID');
 for(const name of Object.keys(m.motions)){
  const motion=api.motionSpec(m,name);assert.ok(motion.frames.every(f=>Number.isInteger(f)&&f>=0&&f<4));
  for(const item of m.items){
   for(const direction of m.directions){
    const p=api.layerPlan(m,{motion:name,selection:{[item.slot]:item.id},lens:'charcoal'},direction);
    assert.ok(p.layers.some(l=>l.slot==='base'));
    for(const l of p.layers){assert.ok(existsSync(path.resolve(dir,l.path)),`Missing ${l.path}`);files++;}
    if(p.handsMask)assert.ok(existsSync(path.resolve(dir,p.handsMask)));
    combinations++;
   }
  }
 }
 console.log(`Real manifest: ${m.items.length} items, ${Object.keys(m.motions).length} motions; ${combinations} item/direction/motion layer plans; ${files} file references passed.`);
}else console.log('Real manifest not yet available; fixture tests only.');
console.log('Viewer helper tests passed: frame timing, pause-step mapping, hat/rear hair rule, rear hand occlusion, eye cover and palette fallback.');

// Exercise event wiring with a minimal DOM/Canvas test double. This is not browser QA.
import vm from 'node:vm';
const canvasCalls=[];
const drawing={clearRect(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(){},drawImage(...args){canvasCalls.push(args);}};
class Element {
 constructor(tag='div'){this.tagName=tag;this.children=[];this.listeners={};this.attributes={};this.dataset={};this.value='';this.checked=false;this.textContent='';}
 append(...els){this.children.push(...els);} prepend(...els){this.children.unshift(...els);}
 replaceChildren(...els){this.children=[...els];}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(k,fn){this.listeners[k]=fn;}
 querySelectorAll(tag){return this.children.flatMap(c=>[...(c.tagName===tag?[c]:[]),...c.querySelectorAll(tag)]);}
 getContext(){return Object.create(drawing);}
}
const html=readFileSync(path.join(dir,'preview.html'),'utf8');
const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element(m[1]==='stage'?'canvas':'div')]));
const raf=[];
const m=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')):fixture;
class FakeImage{set src(v){this._src=v;this.complete=true;this.naturalWidth=320;queueMicrotask(()=>this.onload?.());}}
const sandbox={document:{getElementById:id=>elements[id],createElement:tag=>new Element(tag)},fetch:async()=>({ok:true,json:async()=>m}),Image:FakeImage,performance:{now:()=>0},requestAnimationFrame:fn=>raf.push(fn),console};
vm.runInNewContext(readFileSync(path.join(dir,'viewer.js'),'utf8'),sandbox);
await new Promise(resolve=>setImmediate(resolve));
assert.ok(raf.length,'render loop scheduled');
raf.shift()(0);
await new Promise(resolve=>setImmediate(resolve));
raf.shift()(0);
assert.ok(canvasCalls.length,'canvas draw calls made');
assert.equal(elements.stage.width,960,'all four directions visible');
elements.pause.listeners.click();assert.equal(elements.pause.attributes['aria-pressed'],'true');
elements.step.listeners.click();raf.shift()(100);assert.match(elements.status.textContent,/정지/);
elements.direction.value='right';elements.direction.listeners.change();raf.shift()(200);assert.equal(elements.stage.width,240);
const selectors=elements.parts.querySelectorAll('select');
assert.equal(selectors.length,new Set(m.items.map(i=>i.slot)).size);
for(const select of selectors){const item=m.items.find(i=>i.slot===select.dataset.slot);select.value=item.id;select.listeners.change();}
raf.shift()(300);
elements.grid.checked=true;elements.grid.listeners.change();raf.shift()(400);
elements.motion.value='idle';elements.motion.listeners.change();raf.shift()(500);assert.match(elements.status.textContent,/frame 1/);
elements.reset.listeners.click();assert.ok(selectors.every(s=>s.value===''));
assert.equal(elements.issues.textContent,'');
console.log('DOM/Canvas test-double integration passed: boot, render, pause, step, direction, every slot change, grid, idle, reset. This is not a real browser test.');
