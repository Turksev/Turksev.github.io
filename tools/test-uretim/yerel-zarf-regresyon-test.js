'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=process.argv[2]||path.resolve(__dirname,'../..');
const NEW='yds-esitleme-yerel-v3',OLD='yds-esitleme-v2',MIRROR='yds-esitleme-son-ayna-v1',GOC='yds-esitleme-gecis-yedegi';
const plain=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
function storage(seed={},limit=Infinity){
 const data=new Map(Object.entries(seed).map(([k,v])=>[k,JSON.stringify(v)]));
 return {data,limit,fail:null,peak:0,failures:0,
  bytes(){return [...data].reduce((n,[k,v])=>n+2*(k.length+v.length),0);},
  get(k,d){return data.has(k)?JSON.parse(data.get(k)):d;},
  set(k,v){let raw=JSON.stringify(v),after=this.bytes()+2*(k.length+raw.length)-(data.has(k)?2*(k.length+data.get(k).length):0);
   if((this.fail&&this.fail(k,v))||after>this.limit){this.failures++;return false;}
   data.set(k,raw);this.peak=Math.max(this.peak,after);return true;},
  del(k){data.delete(k);return true;}
 };
}
let actor=0;
function environment(s){
 const listeners={},warnings=[];
 function CE(type,{detail}={}){this.type=type;this.detail=detail;}
 const win={YDS:{Depo:{oku:(k,d)=>s.get(k,d),yaz:(k,v)=>s.set(k,v),sil:k=>s.del(k)},depolamaUyarisi:key=>warnings.push(key)},
   crypto:{getRandomValues:a=>{a[0]=++actor;a[1]=actor*17;return a;}},CustomEvent:CE,
   addEventListener:(type,fn)=>(listeners[type]||(listeners[type]=[])).push(fn),
   dispatchEvent:event=>(listeners[event.type]||[]).forEach(fn=>fn(event))};
 const context={window:win,CustomEvent:CE,TextEncoder,TextDecoder,console};vm.createContext(context);
 ['data/kelime-aliaslari.js','assets/js/esitleme-veri.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context));
 vm.runInContext(fs.readFileSync(path.join(root,'assets/js/esitleme-depo.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(root,'assets/js/ilerleme.js'),'utf8'),context);
 return {w:win,M:win.YDS.EsitlemeMotoru,D:win.YDS.Depo,E:win.YDS.EsitlemeDepo,I:win.YDS.Ilerleme,warnings,
   event(k,old,value){win.dispatchEvent({type:'storage',key:k,oldValue:old===undefined?null:JSON.stringify(old),newValue:value===undefined?null:JSON.stringify(value)});}};
}
let first=environment(storage());const M=first.M;
const seed={'yds-leitner':{base:{k:4,g:400,c:300},beta:{k:2,g:410,c:350}},'yds-gunluk-yeni':20};
function legacySeed(packet=seed){const z=M.zarfaCevir(packet);return {...packet,[OLD]:z,[MIRROR]:{surum:1,veri:plain(M.paket(z))},[GOC]:{zaman:1,veri:packet}};}
// Legacy migration and reload preserve all packet data and consume only duplicate snapshots.
let s=storage(legacySeed()),a=environment(s);
assert.ok(s.get(NEW));assert.strictEqual(s.get(OLD),undefined);assert.strictEqual(s.get(MIRROR),undefined);assert.strictEqual(s.get(GOC),undefined);
assert.deepStrictEqual(plain(a.E.paket()),plain(M.paket(M.zarfaCevir(seed))));
let before=s.data.get(NEW),beforePacket=plain(a.E.paket());s.fail=k=>k===NEW;
assert.strictEqual(a.D.yaz('yds-gunluk-yeni',45),false);assert.strictEqual(s.data.get(NEW),before);
assert.deepStrictEqual(plain(a.E.paket()),beforePacket);assert.ok(a.warnings.length);
s.fail=null;
// Old tab writes only classics while new tab is closed: add/update differences, never inferred deletion.
s.set('yds-leitner',{base:{k:3,g:500,c:499},gamma:{k:1,g:500,c:499}});
a=environment(s);assert.deepStrictEqual(plain(a.D.oku('yds-leitner')),{base:{k:3,g:500,c:499},beta:{k:2,g:410,c:350},gamma:{k:1,g:500,c:499}});
// Old v2 writer remains supported after migration, including reset/tombstone metadata.
let oldWritten=M.kayitlariYaz(M.zarfaCevir({}),'yds-leitner',{delta:{k:4,g:600,c:599}},()=> '2999999999999:old-tab');
s.set(OLD,oldWritten);a.event(OLD,undefined,oldWritten);assert.strictEqual(a.D.oku('yds-leitner').delta.k,4);assert.ok(a.D.oku('yds-leitner').beta);assert.strictEqual(s.get(OLD),undefined);
// Crash after main commit but before mirroring/finalizing: durable candidate recovers on reload.
let committed=a.D.oku('yds-leitner');s.fail=k=>k==='yds-leitner';
assert.strictEqual(a.D.kayitlariYaz('yds-leitner',{epsilon:{k:2,g:701,c:700}}),true);
assert.ok(s.get(NEW).b,'incomplete mirror baseline persisted');assert.strictEqual(s.get('yds-leitner').epsilon,undefined);
s.fail=null;a=environment(s);assert.strictEqual(a.D.oku('yds-leitner').epsilon.k,2);assert.strictEqual(s.get('yds-leitner').epsilon.k,2);assert.strictEqual(s.get(NEW).b,undefined);
// Corrupt primary must remain intact; legacy data must not overwrite it.
let bad={surum:3,z:{k:2,b:'broken'}},broken=storage({[NEW]:bad,...seed});let b=environment(broken);
assert.strictEqual(b.D.yaz('yds-gunluk-yeni',50),false);assert.deepStrictEqual(broken.get(NEW),bad);assert.ok(b.warnings.length);
[null,false,0,''].forEach(value=>{let corrupt=storage({[NEW]:value,...seed}),c=environment(corrupt);assert.strictEqual(c.D.yaz('yds-gunluk-yeni',45),false);assert.strictEqual(corrupt.get(NEW),value);});
// Bootstrap is readable if the tab closes before the new key can be created.
let boot=storage(legacySeed());boot.fail=k=>k===NEW;let booted=environment(boot);
assert.strictEqual(boot.get(OLD).surum,3);assert.strictEqual(boot.get(NEW),undefined);
boot.fail=null;booted=environment(boot);assert.deepStrictEqual(plain(booted.D.oku('yds-leitner')),seed['yds-leitner']);
// Every public write reports a persistent failure, and related card/counter
// changes commit together instead of leaving half a learning result.
let apiStore=storage(),api=environment(apiStore);
api.I.yanlisEkle({kat:'Kelime',soru:'probe'});api.I.testYanlis('probe');api.I.konuYaz('T01',{d:1});
let savedApi=plain(api.E.paket());apiStore.fail=k=>k===NEW;
[
 ()=>api.I.gunlukHedefAyarla(44),()=>api.I.gunlukTavanAyarla(55),()=>api.I.kotaArtir(10),
 ()=>api.I.yanlisEkle({kat:'Kelime',soru:'probe'}),()=>api.I.yanlisCoz({kat:'Kelime',soru:'probe'}),
 ()=>api.I.kategoriKaydet('Kelime',true,'id'),()=>api.I.sonucEkle({dogru:1,toplam:1,yuzde:100}),
 ()=>api.I.konuYaz('T01',{d:2}),()=>api.I.testYanlis('failed'),()=>api.I.testDogru('probe'),
 ()=>api.I.yanlisTemizle(),()=>api.I.kategoriSifirla(),()=>api.I.gecmisSifirla(),()=>api.I.testTemizle(),()=>api.I.konuSifirla(),
 ()=>api.I.dogru('new-failed')
].forEach((operation,index)=>{assert.strictEqual(operation(),false,'public write '+index);assert.deepStrictEqual(plain(api.E.paket()),savedApi);});
apiStore.fail=null;let oldCount=api.I.bugunAcilanYeni();
assert.strictEqual(api.I.dogru('new-success'),1);assert.strictEqual(api.I.bugunAcilanYeni(),oldCount+1);
assert.strictEqual(api.I.testYanlis('new-test'),true);assert.strictEqual(api.I.bugunAcilanYeni(),oldCount+2);assert.strictEqual(api.I.testYanlisSayisi('new-test'),1);
// Storage events are queued for OTHER tabs, as in the browser. Each setItem
// producing a different byte string emits one event; unchanged writes do not.
let shared=storage(),tabs=[],queue=[],owner=null,baseSet=shared.set.bind(shared),baseDel=shared.del.bind(shared);
shared.set=(key,value)=>{let old=shared.get(key),rawBefore=shared.data.get(key),ok=baseSet(key,value);if(ok&&rawBefore!==shared.data.get(key))tabs.forEach(t=>{if(t!==owner)queue.push([t,key,old,value]);});return ok;};
shared.del=key=>{let old=shared.get(key),had=shared.data.has(key),ok=baseDel(key);if(had)tabs.forEach(t=>{if(t!==owner)queue.push([t,key,old,undefined]);});return ok;};
function flush(){let delivered=0;while(queue.length){assert.ok(delivered++<100,'cross-tab events must converge, never ping-pong');let [t,key,old,value]=queue.shift();owner=t;t.event(key,old,value);owner=null;}return delivered;}
let tabA=environment(shared);tabs.push(tabA);let tabB=environment(shared);tabs.push(tabB);flush();
owner=tabA;assert.strictEqual(tabA.I.dogru('tab-a'),1);owner=null;flush();
owner=tabB;assert.strictEqual(tabB.I.dogru('tab-b'),1);owner=null;const events=flush();
assert.strictEqual(tabA.I.kutu('tab-b'),1);assert.strictEqual(tabB.I.kutu('tab-a'),1);assert.deepStrictEqual(plain(tabA.E.paket()),plain(tabB.E.paket()));
let stable=shared.data.get(NEW);owner=tabA;tabA.event(NEW,undefined,shared.get(NEW));owner=null;assert.strictEqual(queue.length,0);assert.strictEqual(shared.data.get(NEW),stable);
console.log('cross-tab event convergence PASS: last operation '+events+' deliveries');
// Full corpus fixture: max-scope progression, varying clocks and wrong counters.
const c={window:{YDS:{}},TextEncoder,TextDecoder};vm.createContext(c);
['data/kelime-dizin.js','data/obekler.js','data/cumleler-dizin.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c));
let ids=c.window.KELIME_DIZIN.map(k=>k.e).concat(c.window.OBEKLER.map(o=>o.f));
let packet={'yds-leitner':{},'yds-test-yanlis':{}};
ids.forEach((id,i)=>{packet['yds-leitner'][id]={k:i%5+1,g:25000+i%35,c:24970+i%7,m:0};packet['yds-test-yanlis'][id]={n:i%999+1,t:1999999999999+i,u:1999999999999+i,c:i%2};});
for(let i=0;i<c.window.CUMLELER_DIZIN.toplam;i++)packet['yds-leitner']['c:synthetic-'+i.toString(36)]={k:i%5+1,g:25000+i%35,c:24970+i%7,m:0};
let z=M.zarfaCevir({}),clock=1999999999999;Object.keys(packet).forEach(k=>z=M.kayitlariYaz(z,k,packet[k],()=>String(clock++)+':actor-alpha'));
packet=plain(M.paket(z));
let stress=storage({...packet,[OLD]:z,[MIRROR]:{surum:1,veri:packet},[GOC]:{zaman:1,veri:packet}},5*1024*1024);
let bootStart=Date.now(),full=environment(stress),bootMs=Date.now()-bootStart;assert.ok(stress.get(NEW),'overlarge legacy fixture migrated');assert.strictEqual(stress.get(OLD),undefined);
assert.deepStrictEqual(plain(full.E.paket()),packet);assert.ok(stress.bytes()<4*1024*1024);
assert.strictEqual(full.I.yedekAl('stress'),true);assert.ok(stress.get('yds-son-yedek').__ydsKisaYedek===1);
let writeStart=Date.now();assert.strictEqual(full.D.yaz('yds-gunluk-yeni',45),true);let writeMs=Date.now()-writeStart;assert.ok(stress.peak<5*1024*1024);
let reload=environment(stress);assert.deepStrictEqual(plain(reload.I.yedekBilgisi()).kapsam,'stress');
console.log(JSON.stringify({status:'PASS',cases:10,wordsPhrases:ids.length,sentences:c.window.CUMLELER_DIZIN.toplam,finalBytes:stress.bytes(),peakBytes:stress.peak,quota:stress.limit,writeFailures:stress.failures,bootMs,writeMs},null,2));
