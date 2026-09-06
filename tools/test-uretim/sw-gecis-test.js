'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=process.argv[2]||path.resolve(__dirname,'../..'),origin='https://turksev.github.io';
function response(text,status=200){return {ok:status>=200&&status<300,status,type:'basic',body:text,clone(){return response(text,status);}};}
class Request{constructor(url,options={}){this.url=url;this.method=options.method||'GET';this.mode=options.mode||'cors';this.cache=options.cache;}}
class Response{constructor(text,{status=200}={}){return response(text,status);}}
const key=u=>new URL(typeof u==='string'?u:u.url,origin+'/sw.js').href;
function setup(){
 const maps=new Map(),network=new Map(),fail=new Set(),calls=[];
 const fetch=async req=>{const url=key(req);calls.push(url);if(fail.has(url))throw Error('offline');return response(network.has(url)?network.get(url):'current '+new URL(url).pathname);};
 const caches={keys:async()=>[...maps.keys()],delete:async name=>maps.delete(name),
  open:async name=>{if(!maps.has(name))maps.set(name,new Map());let m=maps.get(name);return {
   match:async url=>m.get(key(url)),put:async(url,r)=>m.set(key(url),r),
   add:async req=>m.set(key(req),await fetch(req)),
   addAll:async urls=>{const results=await Promise.all(urls.map(fetch));urls.forEach((u,i)=>m.set(key(u),results[i]));}
  };},
  match:async url=>{for(let m of maps.values())if(m.has(key(url)))return m.get(key(url));}
 };
 function worker(source){let events={},claimed=0,skipped=0;const self={location:{origin,href:origin+'/sw.js'},clients:{claim:async()=>claimed++},skipWaiting:()=>skipped++,addEventListener:(name,fn)=>events[name]=fn};
  vm.runInNewContext(source,{self,caches,fetch,Request,Response,URL,Promise,console});
  return {events,get claimed(){return claimed;},get skipped(){return skipped;},
   async lifecycle(name){let waits=[];events[name]({waitUntil:p=>waits.push(p)});await Promise.all(waits);},
   async request(url,mode='cors'){let p,waits=[];events.fetch({request:new Request(key(url),{mode}),respondWith:x=>p=x,waitUntil:x=>waits.push(x)});let result=await p;await Promise.all(waits);return {result,waits:waits.length};}
  };
 }
 return {maps,network,fail,calls,caches,worker};
}
(async()=>{
 const s=setup(),oldSource=fs.readFileSync(path.join(__dirname,'fixtures/sw-v181.js'),'utf8');
 const old=s.worker(oldSource);(await s.caches.open('yds-v181')).put('/assets/js/main.js',response('OLD MAIN'));
 s.network.set(origin+'/assets/js/main.js','NEW MAIN');
 const mixed=await old.request('/assets/js/main.js?v=release182');
 assert.strictEqual(mixed.result.body,'OLD MAIN','reproduce old worker stripping query cache buster');
 // A unique path is respected by the old worker on the very first fresh HTML visit.
 s.network.set(origin+'/releases/r182/assets/js/main.js','RELEASE 182 MAIN');
 assert.strictEqual((await old.request('/releases/r182/assets/js/main.js')).result.body,'RELEASE 182 MAIN');
 const required=['./','./index.html','./releases/r182/assets/js/main.js','./releases/r182/data/kelime-k1.js'];
 let proposed=fs.readFileSync(path.join(root,'sw.js'),'utf8').replace(/var SURUM = 'yds-v\d+';/,"var SURUM = 'yds-v182';").replace(/var TEMEL_DOSYALAR = \[[\s\S]*?\];/,'var TEMEL_DOSYALAR = '+JSON.stringify(required)+';');
 const next=s.worker(proposed);
 s.fail.add(key(required[3]));await assert.rejects(next.lifecycle('install'));assert.strictEqual(s.maps.get('yds-v182').size,0,'required precache is atomic');assert.strictEqual(next.claimed,0);
 s.fail.clear();await next.lifecycle('install');assert.strictEqual(s.maps.get('yds-v182').size,required.length);
 (await s.caches.open('unrelated-app-cache')).put('/other',response('OTHER'));
 await s.caches.open('yds-v179');await s.caches.open('yds-v180');await next.lifecycle('activate');
 assert.ok(s.maps.has('unrelated-app-cache'));assert.ok(s.maps.has('yds-v181'));assert.ok(!s.maps.has('yds-v180'));assert.ok(!s.maps.has('yds-v179'));
 s.network.set(key(required[2]),'WRONGLY MUTATED SERVER BYTES');
 let stable=await next.request(required[2]);assert.strictEqual(stable.result.body,'RELEASE 182 MAIN');assert.strictEqual(stable.waits,1);
 const lazy='/releases/r182/data/kelime-k2.js';s.network.set(key(lazy),'RELEASE 182 DATA');assert.strictEqual((await next.request(lazy)).result.body,'RELEASE 182 DATA');assert.ok(s.maps.get('yds-v182').has(key(lazy)));
 s.fail.add(key('/not-visited.html'));assert.strictEqual((await next.request('/not-visited.html','navigate')).result.status,503);
 let version;next.events.message({data:{type:'YDS_SURUM_SOR'},ports:[{postMessage:x=>version=x}]});assert.strictEqual(version.surum,'yds-v182');
 console.log('SW upgrade PASS: legacy query collision reproduced; path versioning, atomic install, immutable hit, lazy cache write, scoped cleanup, explicit offline miss and version reply verified');
})().catch(e=>{console.error(e);process.exitCode=1;});
