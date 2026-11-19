import assert from 'node:assert/strict';
import {demoApi as api} from '../demo-api.js';
import {loadMapLayout,normalizePosition,route} from '../public/assets/cafe-map/map-geometry.js';
Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});
const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
globalThis.fetch=()=>{throw Error('No live demo network');};
const d=await loadMapLayout();
await api('demo/reset',{});let state=await api('guest',{nickname:'map-test'});
assert.deepEqual({x:state.session.x,y:state.session.y},d.spawn);
const saved=JSON.parse(data.get('cafe-quest-demo-v1'));
saved.users[saved.current].session.x=-3;saved.users[saved.current].session.y=3;
data.set('cafe-quest-demo-v1',JSON.stringify(saved));
state=await api('state');assert.deepEqual({x:state.session.x,y:state.session.y},normalizePosition(d,{x:-3,y:3}));
for(const o of d.objects)if(o.interaction){const end=o.interaction.anchor,expected=route(d,state.session,end);state=await api('move',end);assert.deepEqual(state.path,expected);}
console.log('PASS demo map spawn migration and all interaction paths');
