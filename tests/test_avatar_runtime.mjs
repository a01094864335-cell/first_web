/** Structural adapter tests, NOT browser or pixel-quality tests.
 * Real avatar-runtime.js, real manifest and original viewer helpers; canvas,
 * Image, RAF, clock and network are deterministic test doubles. No network I/O.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('avatar02/manifest.json', root)));
const helperContext = { AVATAR_VIEWER_NO_BOOT: true };
vm.runInNewContext(fs.readFileSync(new URL('avatar02/viewer.js', root), 'utf8'), helperContext);
let now = 1000, reduced = false, calls = [], raf = [], imageFailure = false;
const elements = [];
function makeCanvas() {
  const node = {width:80,height:80,isConnected:true,dataset:{},title:'',parentElement:{querySelector:()=>null}};
  const ctx = {
    globalCompositeOperation:'source-over',clearRect(){},
    drawImage(source,...args){calls.push({target:node,source,args,op:this.globalCompositeOperation});},
    getImageData(){return {data:new Uint8ClampedArray(80*80*4)};},
    createImageData(){return {data:new Uint8ClampedArray(80*80*4)};},putImageData(){},
  };
  node.getContext=()=>ctx;elements.push(node);return node;
}
globalThis.document={hidden:false,createElement:tag=>tag==='canvas'?makeCanvas():{remove(){this.removed=true;}},head:{append(){}}};
globalThis.Image=class {
  set src(value){this._src=value;this.complete=true;this.naturalWidth=imageFailure?0:320;queueMicrotask(()=>imageFailure?this.onerror?.():this.onload?.());}
  get src(){return this._src;}
};
globalThis.AvatarViewer=helperContext.AvatarViewer;
globalThis.matchMedia=()=>({matches:reduced});
Object.defineProperty(globalThis,'performance',{value:{now:()=>now},configurable:true});
globalThis.requestAnimationFrame=fn=>{raf.push(fn);return raf.length;};
globalThis.fetch=async(url,options)=>{assert.equal(url,'/avatar02/manifest.json');assert.ok(options.signal);return {ok:true,json:async()=>manifest};};
const runtime=await import(new URL('avatar-runtime.js?structural-test',root));
await runtime.loadAvatarCatalogue();
async function step(time){now=time;calls=[];const queued=raf;raf=[];for(const fn of queued)fn(time);await Promise.resolve();}
function baseCalls(){return calls.filter(c=>c.source.src?.includes('/'+manifest.base.walk));}
const selection={hair:'hair-long-straight',hat:'hat-beret',glasses:'glasses-round',hand:'hand-mug',top:'top-shirt-blue'};
const nodes=[];
for(const direction of manifest.directions){const node=makeCanvas();nodes.push(node);runtime.attachAvatar(node,{selection,lens:'blue'},{motion:'walk',direction,timelineKey:direction});}
await step(1000);await step(1000);
for(let row=0;row<4;row++) assert.ok(baseCalls().some(c=>c.args[1]===row*80),`source row ${row}`);
assert.ok(calls.some(c=>c.op==='destination-in'&&c.source.src?.includes('mask')),'restoration mask draw');
assert.ok(nodes.every(n=>n.dataset.ready==='true'&&n.dataset.error==='false'));
const duration=manifest.motions.walk.durationMs;
await step(1000+duration);
assert.ok(baseCalls().some(c=>c.args[0]===manifest.motions.walk.frames[1]*80),'walk frame advances');
// DOM replacement must retain animation origin for the same person/key.
nodes[0].isConnected=false;now=1000+duration;
const replacement=makeCanvas();runtime.attachAvatar(replacement,{selection,lens:'blue'},{motion:'walk',direction:manifest.directions[0],timelineKey:manifest.directions[0]});
await step(1000+duration*2);
assert.ok(baseCalls().some(c=>c.args[0]===manifest.motions.walk.frames[2]*80),'same-key origin survives new DOM');
assert.equal(runtime.avatarDiagnostics().registered,4,'detached registration removed');
for(const n of [...nodes,replacement])n.isConnected=false;
await step(now);assert.equal(runtime.avatarDiagnostics().registered,0);assert.equal(raf.length,0,'RAF stops when empty');
const idle=makeCanvas();runtime.attachAvatar(idle,{}, {motion:'idle'});
await step(now);await step(now);await step(now+9999);
assert.equal(calls.length,0,'idle has one fixed frame and does not repaint on clock changes');
idle.isConnected=false;await step(now);
const still=makeCanvas();reduced=true;runtime.attachAvatar(still,{}, {motion:'walk'});
await step(now);await step(now);await step(now+9999);assert.equal(calls.length,0,'reduced-motion freezes frame');
still.isConnected=false;await step(now);reduced=false;
assert.deepEqual(runtime.normalizeAvatar({selection:{hat:'hair-short',hair:'hair-short'},lens:'invalid'}),{selection:{hair:'hair-short'},lens:'charcoal'});
assert.equal(runtime.directionBetween({x:0,y:0},{x:1,y:0}),'right');
assert.equal(runtime.directionBetween({x:0,y:0},{x:-1,y:0}),'left');
assert.equal(runtime.directionBetween({x:0,y:0},{x:0,y:1}),'front');
assert.equal(runtime.directionBetween({x:0,y:0},{x:0,y:-1}),'back');
// Real loader's script timeout is bounded; deterministic timer instead of 8s wait.
const originalTimer=globalThis.setTimeout,originalClear=globalThis.clearTimeout;
let timeout,delay,script;
delete globalThis.AvatarViewer;
globalThis.setTimeout=(fn,ms)=>{timeout=fn;delay=ms;return 1;};globalThis.clearTimeout=()=>{};
document.head.append=node=>{script=node;};
const failedRuntime=await import(new URL('avatar-runtime.js?loader-timeout-test',root));
const pending=failedRuntime.loadAvatarCatalogue();
assert.equal(delay,8000);timeout();await assert.rejects(pending,/지연/);assert.ok(script.removed);
globalThis.setTimeout=originalTimer;globalThis.clearTimeout=originalClear;
globalThis.AvatarViewer=helperContext.AvatarViewer;
// A failed loader is retryable; a failed image exposes diagnostic/fallback state.
await failedRuntime.loadAvatarCatalogue();imageFailure=true;
const broken=makeCanvas();failedRuntime.attachAvatar(broken,{}, {motion:'idle'});
await step(now);await step(now);
assert.equal(broken.dataset.error,'true');assert.equal(broken.dataset.ready,'false');assert.ok(failedRuntime.avatarDiagnostics().failed.length);
imageFailure=false;failedRuntime.retryAvatarImages();await step(now);await step(now);
assert.equal(broken.dataset.error,'false');assert.equal(broken.dataset.ready,'true');assert.equal(failedRuntime.avatarDiagnostics().failed.length,0,'retry replaces failed cached images');
broken.isConnected=false;await step(now);
console.log('PASS real adapter structural tests: directions, source frames/masks, idle/reduced motion, DOM timeline/cleanup, validation, bounded loader/retry, image diagnostics. No browser/pixel verification.');
