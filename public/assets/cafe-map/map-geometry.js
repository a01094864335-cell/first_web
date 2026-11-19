/** Pure geometry shared by renderer and isolated demo. Positions are foot anchors. */
export const CLEARANCE=.015, SCALE=100;
let current, pending;
const cellsCache=new WeakMap();
const cell=p=>[Math.round(p.x*SCALE),Math.round(p.y*SCALE)];
const point=([x,y])=>({x:x/SCALE,y:y/SCALE});
const key=p=>p.join(',');
export const obstacles=d=>d.objects.filter(o=>o.collision).map(o=>o.collision);
export function blocked(d,x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y))return true;
 const [a,b,w,h]=d.bounds;
 return x<a||x>a+w||y<b||y>b+h||obstacles(d).some(([a,b,w,h])=>x>=a-CLEARANCE&&x<=a+w+CLEARANCE&&y>=b-CLEARANCE&&y<=b+h+CLEARANCE);
}
function search(d,start,goal){
 const queue=[start],parents=new Map([[key(start),null]]);
 for(let i=0;i<queue.length&&(!goal||!parents.has(key(goal)));i++){
  const [x,y]=queue[i];
  for(const n of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]])if(!parents.has(key(n))&&!blocked(d,n[0]/SCALE,n[1]/SCALE)){parents.set(key(n),queue[i]);queue.push(n);}
 }
 return parents;
}
export function reachable(d){
 if(!cellsCache.has(d)){
  const p=cell(d.spawn);if(blocked(d,p[0]/SCALE,p[1]/SCALE))throw Error('Map spawn is blocked');
  cellsCache.set(d,search(d,p));
 }
 return cellsCache.get(d);
}
export function normalizePosition(d,p){return blocked(d,p?.x,p?.y)||!reachable(d).has(key(cell(p)))?point(cell(d.spawn)):{x:p.x,y:p.y};}
export function route(d,start,end){
 if(blocked(d,end.x,end.y))throw Error('가구나 벽이 있는 곳은 이동할 수 없어요');
 const a=cell(normalizePosition(d,start)),b=cell(end);
 if(blocked(d,b[0]/SCALE,b[1]/SCALE))throw Error('가구나 벽이 있는 곳은 이동할 수 없어요');
 const parents=search(d,a,b);if(!parents.has(key(b)))throw Error('이곳으로 가는 길을 찾을 수 없어요');
 const out=[];for(let at=b;at;at=parents.get(key(at)))out.push(point(at));return out.reverse();
}
export function validateLayout(d){
 const rect=r=>{if(!Array.isArray(r)||r.length!==4||r.some(v=>!Number.isFinite(v)||v<0)||r[2]<=0||r[3]<=0||r[0]+r[2]>1.000001||r[1]+r[3]>1.000001)throw Error('Invalid map rectangle');};
 if(!d?.version||!Array.isArray(d.objects))throw Error('Invalid map layout');rect(d.bounds);
 const ids=new Set();for(const o of d.objects){if(ids.has(o.id))throw Error('Duplicate map object');ids.add(o.id);rect([o.x,o.y,o.width,o.height]);if(o.collision)rect(o.collision);}
 const cells=reachable(d);for(const o of d.objects)if(o.interaction){const p=o.interaction.anchor;if(blocked(d,p.x,p.y)||!cells.has(key(cell(p))))throw Error('Unreachable interaction: '+o.id);}return d;
}
export async function loadMapLayout(){
 if(current)return current;
 if(!pending)pending=(async()=>{
  const url=new URL('./layout.json',import.meta.url);
  let data;
  if(url.protocol==='file:'&&typeof process!=='undefined'&&process.versions?.node){const {readFile}=await import('node:fs/promises');data=JSON.parse(await readFile(url,'utf8'));}
  else{const response=await fetch(url);if(!response.ok)throw Error('카페 맵을 불러올 수 없어요');data=await response.json();}
  current=validateLayout(data);return current;
 })().catch(e=>{pending=null;throw e;});
 return pending;
}
