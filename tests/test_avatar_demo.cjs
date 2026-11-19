const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});
 const store=new Map();global.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
 global.fetch=()=>{throw Error('No network allowed in demo API tests');};
 const {demoApi:api}=await import('../demo-api.js');let sequence=0;
 const call=(p,d)=>api(p,d,d===undefined?undefined:`avatar-${++sequence}`);
 const manifest=JSON.parse(fs.readFileSync(new URL('../avatar02/manifest.json','file://'+__filename)));
 const legacy=JSON.parse(fs.readFileSync(new URL('./avatar-legacy51.json','file://'+__filename)));
 for(const [id,slot] of Object.entries(legacy))assert(manifest.items.some(i=>i.id===id&&i.slot===slot),`Existing saved part removed: ${id}`);
 await call('demo/reset',{});let s=await call('guest',{nickname:'avatar'});
 assert.deepEqual(s.user.appearance.avatar02,{selection:{},lens:'charcoal'});
 const first=s.user.id,balance=s.user.coins;
 for(const item of manifest.items){const payload={selection:{[item.slot]:item.id},lens:'blue'};s=await call('avatar',payload);assert.deepEqual(s.user.appearance.avatar02,payload);assert.equal(s.user.coins,balance);}
 for(const invalid of [{selection:{hair:'hat-bucket'}},{selection:{arbitrary:'hair-short'}},{selection:{hair:'missing'}},{selection:[]},{selection:null},{lens:null},{lens:'red'},{coins:10000},null])await assert.rejects(()=>call('avatar',invalid),/데모/);
 await call('buy',{id:'item3'});await call('equip',{id:'item3'});
 const selected={selection:{hair:'hair-long-straight',eyes:'eyes-dot',body:'body-tote'},lens:'green'};
 s=await call('avatar',selected);assert(s.user.appearance.equipped.includes('item3'));
 await call('privacy',{visible:true});await call('demo/role',{role:'staff'});
 s=await call('state');const publicGuest=s.guests.find(g=>g.id===first);assert.deepEqual(publicGuest.appearance.avatar02,selected);assert(!('coins' in publicGuest));
 await call('demo/role',{role:'customer'});s=await call('demo/kakao',{mode:'new'});assert.deepEqual(s.user.appearance.avatar02,selected);
 await call('logout',{});s=await call('demo/kakao',{mode:'restore'});assert.deepEqual(s.user.appearance.avatar02,selected);
 // Existing-account merge preserves the destination avatar rather than overwriting it.
 s=await call('demo/kakao',{mode:'existing'});assert.equal(s.user.id,'demo-account');assert.deepEqual(s.user.appearance.avatar02,{selection:{},lens:'charcoal'});assert(s.items.find(i=>i.id==='item3').owned);
 // Old persisted demo accounts remain legacy until an explicit avatar save.
 const db=JSON.parse(store.get('cafe-quest-demo-v1'));delete db.users[db.current].appearance.avatar02;store.set('cafe-quest-demo-v1',JSON.stringify(db));
 s=await call('state');assert(!Object.hasOwn(s.user.appearance,'avatar02'));
 s=await call('avatar',{selection:{skin:null,hat:''},lens:'charcoal'});assert.deepEqual(s.user.appearance.avatar02,{selection:{},lens:'charcoal'});
 console.log(`PASS avatar02 demo: ${manifest.items.length} free parts, validation, legacy preservation, inventory, remote projection, mock link/restore/merge`);
})().catch(e=>{console.error(e);process.exitCode=1;});
