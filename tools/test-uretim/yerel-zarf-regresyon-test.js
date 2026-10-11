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
// Two-tab race (2026-10): an echo of an older state must never come back as a newer edit. The cases below pin
// the four rules of that fix. Same harness as above, as a function, so that every case starts from its own
// storage: the tabs share one synchronous store and each write that changes a key queues a storage event for
// the OTHER open tabs. t.writes counts the writes a tab attempted, t.notes collects its 'yds-depo-degisti'
// details, kill(t,n) closes tab t at its n-th write from now, disk() decodes what is on disk. A real browser
// also shows a tab another tab's transaction half done while that tab goes on; here a half-done transaction
// only arises through kill(). The schedule-level races run in iki-sekme-yarisi-test.js.
const LE='yds-leitner',GOAL='yds-gunluk-yeni',DAILY='yds-gunluk-kayit',codec=first.w.YDS.YerelZarfKodlama;
function world(seed={}){
 const s=storage(seed),tabs=[],queue=[],set=s.set.bind(s),del=s.del.bind(s);let owner=null;s.envWrites=0;
 const emit=(key,old,value)=>tabs.forEach(t=>{if(t!==owner&&!t.closed)queue.push([t,key,old,value]);});
 const count=()=>{if(!owner)return;owner.writes++;if(owner.dieAt&&--owner.dieAt===0){owner.closed=true;throw new Error('tab closed');}};
 s.set=(key,value)=>{count();if(key===NEW)s.envWrites++;const old=s.get(key),raw=s.data.get(key),ok=set(key,value);if(ok&&raw!==s.data.get(key))emit(key,old,value);return ok;};
 s.del=key=>{count();const old=s.get(key),had=s.data.has(key),ok=del(key);if(had)emit(key,old,undefined);return ok;};
 const act=(t,fn)=>{owner=t;try{return fn();}finally{owner=null;}};
 return {s,act,
  open(){const t={writes:0,notes:[],closed:false,dieAt:0};act(t,()=>Object.assign(t,environment(s)));t.w.addEventListener('yds-depo-degisti',e=>t.notes.push(plain(e.detail)));tabs.push(t);return t;},
  kill(t,n){t.dieAt=n;},
  flush(){let delivered=0;while(queue.length){assert.ok(delivered++<100,'cross-tab events must converge, never ping-pong');const [t,key,old,value]=queue.shift();if(!t.closed)act(t,()=>t.event(key,old,value));}return delivered;},
  disk(){const raw=s.get(NEW),zarf=codec.coz(raw.z),mirror={};Object.keys(M.TIPLER).forEach(key=>{if(s.data.has(key))mirror[key]=s.get(key);});
   return {open:Object.prototype.hasOwnProperty.call(raw,'b'),mirrored:M.kararliJson(M.paket(zarf))===M.kararliJson(mirror),rec:(key,id)=>plain(zarf.alanlar[key].i[id])};}};
}
// Rule 1: a classic-key storage event never mints a stamp. Its writer may be another CURRENT tab whose mirror
// comes from a state this tab has long overtaken (it completed a transaction from its own lagging view);
// importing the difference as a fresh edit reverted the newer answer and let the stale value win in the
// cloud. A stamped record, a tombstone and every record of a reset field keep the envelope's value; the
// envelope is not rewritten and the mirror is rebuilt from it.
{
 const w=world(),A=w.open(),B=w.open(),env=()=>w.s.envWrites+'#'+w.s.data.get(NEW),rec=(t,key,id)=>plain(t.E.zarf().alanlar[key].i[id]);w.flush();
 [['p',1],['q',1],['p',2]].forEach(([id,box])=>{w.act(A,()=>assert.strictEqual(A.I.dogru(id),box));w.flush();});
 const older=plain(w.s.get(LE));
 w.act(A,()=>assert.strictEqual(A.I.dogru('p'),3));w.flush();
 let newer=plain(w.s.get(LE)),stamp=rec(A,LE,'p').m,bytes=env();
 w.act(B,()=>w.s.set(LE,older));assert.strictEqual(w.s.get(LE).p.k,2);const echo=w.flush();   // B's late mirror lands on top of A's
 [A,B].forEach(t=>{assert.strictEqual(t.I.kutu('p'),3,'echo of an older mirror must not revert the answer');assert.strictEqual(rec(t,LE,'p').m,stamp,'no fresh stamp for an echo');});
 assert.strictEqual(env(),bytes,'envelope not rewritten for an echo');assert.deepStrictEqual(plain(w.s.get(LE)),newer,'mirror rebuilt from the envelope');
 // Late dispatch: no stale write at all, B merely handles the events of three answers after the last one is on disk.
 w.act(A,()=>{A.I.yanlis('p');A.I.dogru('p');assert.strictEqual(A.I.dogru('p'),4);});stamp=rec(A,LE,'p').m;bytes=env();newer=plain(w.s.get(LE));
 let late=0;assert.doesNotThrow(()=>{late=w.flush();},'events handled late must not be imported as edits (they ping-pong)');
 [A,B].forEach(t=>{assert.strictEqual(t.I.kutu('p'),4,'events handled late must not revert the answer');assert.strictEqual(rec(t,LE,'p').m,stamp,'no fresh stamp for an event handled late');});
 assert.strictEqual(env(),bytes,'envelope not rewritten for events handled late');assert.deepStrictEqual(plain(w.s.get(LE)),newer);
 // The same for a scalar setting, and for a late in-order mirror event of a value this tab knows to be superseded.
 w.act(A,()=>assert.strictEqual(A.I.gunlukHedefAyarla(25),true));w.flush();w.act(A,()=>assert.strictEqual(A.I.gunlukHedefAyarla(30),true));w.flush();
 stamp=rec(A,GOAL,'$').m;bytes=env();
 w.act(B,()=>w.s.set(GOAL,25));w.flush();w.act(B,()=>B.event(GOAL,undefined,25));w.flush();
 [A,B].forEach(t=>{assert.strictEqual(t.I.gunlukHedef(),30,'echo of an older mirror must not restore a superseded setting');assert.strictEqual(rec(t,GOAL,'$').m,stamp,'no fresh stamp for a setting echo');});
 assert.strictEqual(env(),bytes,'envelope not rewritten for a setting echo');assert.strictEqual(w.s.get(GOAL),30,'setting mirror rebuilt from the envelope');
 // A tombstoned card is not resurrected by a mirror written before the deletion...
 w.act(A,()=>assert.strictEqual(A.I.sifirlaKelime('q'),true));w.flush();
 const tombstone=rec(A,LE,'q');assert.ok(tombstone.d&&w.s.get(LE).q===undefined);bytes=env();
 w.act(B,()=>w.s.set(LE,newer));w.flush();
 [A,B].forEach(t=>{assert.strictEqual(t.I.kutu('q'),0,'a mirror written before the deletion must not resurrect the card');assert.deepStrictEqual(rec(t,LE,'q'),tombstone);});
 assert.strictEqual(env(),bytes,'envelope not rewritten for a deleted card');assert.strictEqual(w.s.get(LE).q,undefined,'mirror rebuilt without the deleted card');
 // ...and a reset field takes nothing from a mirror written before the reset.
 newer=plain(w.s.get(LE));w.act(A,()=>assert.strictEqual(A.I.leitnerSifirla(false),true));w.flush();
 assert.strictEqual(w.s.get(LE),undefined);bytes=env();
 w.act(B,()=>w.s.set(LE,newer));w.flush();
 [A,B].forEach(t=>{assert.strictEqual(t.I.kutu('p'),0,'a mirror written before a reset must not resurrect the field');assert.deepStrictEqual(Object.keys(t.E.paket()[LE]||{}),[]);});
 assert.strictEqual(env(),bytes,'envelope not rewritten for a reset field');assert.strictEqual(w.s.get(LE),undefined,'pre-reset mirror removed again');
 assert.deepStrictEqual(plain(A.E.zarf()),plain(B.E.zarf()));
 console.log('classic-key events mint no stamp PASS: echo settled in '+echo+' deliveries, three late answers in '+late);
}
// What a pre-envelope tab (code from before 2026-08-28, which writes classic keys only) still can do through
// a storage event: add a card the envelope has never seen and advance a card that is stampless since
// migration; both stay stampless. Given up on purpose: it can no longer change a stamped card. Its stale
// full object reverts nothing, an id missing from that object is not a deletion, and removing the classic
// key still deletes nothing.
{
 const w=world({[LE]:{old:{k:1,g:100,c:99},kept:{k:2,g:200,c:199},edited:{k:2,g:201,c:200},missing:{k:3,g:300,c:299}}}),cur=w.open();
 const rec=id=>plain(cur.E.zarf().alanlar[LE].i[id]);
 assert.strictEqual(rec('old').m,0);w.act(cur,()=>{assert.strictEqual(cur.I.dogru('kept'),3);assert.strictEqual(cur.I.dogru('edited'),3);});
 const stamps=[rec('kept').m,rec('edited').m];stamps.forEach(m=>assert.ok(M.metaKarsilastir(m,0)>0));
 const oldTab={old:{k:2,g:103,c:102},kept:{k:2,g:200,c:199},edited:{k:5,g:40000,c:39999},fresh:{k:1,g:101,c:100}};
 w.s.set(LE,oldTab);w.flush();                                                            // a writer that is none of the current tabs
 assert.strictEqual(cur.I.kutu('kept'),3,'the stale full object of a pre-envelope tab must not revert a stamped card');
 assert.strictEqual(cur.I.kutu('edited'),3,'stated narrowing: a pre-envelope tab cannot change a stamped card');
 assert.deepStrictEqual([cur.I.kutu('old'),cur.I.kutu('fresh'),cur.I.kutu('missing')],[2,1,3],'a pre-envelope tab still adds a new card and advances a stampless one; a missing id is not a deletion');
 assert.deepStrictEqual([rec('old').m,rec('fresh').m,rec('kept').m,rec('edited').m],[0,0].concat(stamps),'records imported from a classic key stay stampless');
 assert.deepStrictEqual([w.disk().open,w.disk().mirrored],[false,true],'mirror equals the merged envelope');
 const kept=plain(cur.E.paket()[LE]),bytes=w.s.data.get(NEW);w.s.del(LE);w.flush();
 assert.deepStrictEqual(plain(cur.E.paket()[LE]),kept,'removing a classic key deletes nothing');
 assert.deepStrictEqual([plain(w.s.get(LE)),w.s.data.get(NEW)],[kept,bytes],'mirror rebuilt after the removal, envelope untouched');
 const again=w.open();assert.deepStrictEqual(plain(again.D.oku(LE)),kept);assert.strictEqual(again.E.zarf().alanlar[LE].i.old.m,0);
}
// Rule 2: the same at page load. A mirror that differs from a committed envelope may be a current tab's
// late write of an older state (and then every tab was closed): it is no evidence of an edit. Stamped
// records, tombstones and reset fields stay as the envelope has them and nothing is minted. (Given up on
// purpose: a mirror NEWER than a committed envelope no longer heals a stamped record at page load.)
{
 const w=world(),A=w.open();
 w.act(A,()=>{A.I.dogru('p');A.I.dogru('q');A.I.dogru('p');A.I.gunlukHedefAyarla(25);});
 const stale={[LE]:plain(w.s.get(LE)),[GOAL]:w.s.get(GOAL)};
 w.act(A,()=>{assert.strictEqual(A.I.dogru('p'),3);assert.strictEqual(A.I.gunlukHedefAyarla(30),true);assert.strictEqual(A.I.sifirlaKelime('q'),true);});
 let committed=plain(A.E.zarf());A.closed=true;assert.strictEqual(w.disk().open,false);
 w.s.set(LE,stale[LE]);w.s.set(GOAL,stale[GOAL]);                                         // the late mirror writes of a tab that is gone too
 const C=w.open();
 assert.strictEqual(C.I.kutu('p'),3,'a stale mirror at page load must not revert the answer');
 assert.strictEqual(C.I.gunlukHedef(),30,'a stale mirror at page load must not restore a superseded setting');
 assert.strictEqual(C.I.kutu('q'),0,'a stale mirror at page load must not resurrect a deleted card');
 assert.deepStrictEqual(plain(C.E.zarf()),committed,'nothing is minted at page load');
 assert.deepStrictEqual([w.disk().open,w.s.get(LE).p.k,w.s.get(LE).q],[false,3,undefined],'card mirror rebuilt from the envelope at page load');
 // Every mirror follows, whatever its type: a plain number is "unchanged" for the write-only-what-changed
 // shortcut of aynala; unless kaydet verifies every key at page load it stays stale forever, with every later
 // page load rewriting the envelope (the code before the fix took the stale number into the envelope instead).
 assert.deepStrictEqual([w.disk().mirrored,w.s.get(GOAL)],[true,30],'every mirror is rebuilt from the envelope at page load, a number-valued setting too');
 let bytes=w.s.data.get(NEW),rewritten=0;const rawSet=w.s.set;w.s.set=(key,value)=>{if(key===NEW)rewritten++;return rawSet(key,value);};
 C.closed=true;const C2=w.open();
 assert.deepStrictEqual([rewritten,w.s.data.get(NEW)],[0,bytes],'a later page load of a settled profile does not rewrite the envelope');
 w.act(C2,()=>assert.strictEqual(C2.I.leitnerSifirla(false),true));committed=plain(C2.E.zarf());C2.closed=true;w.s.set(LE,stale[LE]);
 const D=w.open();
 assert.deepStrictEqual(Object.keys(D.D.oku(LE,{})),[],'a mirror written before a reset must not resurrect the field at page load');
 assert.deepStrictEqual(plain(D.E.zarf()),committed,'nothing is minted for a reset field at page load');
 assert.deepStrictEqual([w.disk().mirrored,w.s.get(LE)],[true,undefined],'the mirror of a reset field is removed again at page load');
}
// A pre-envelope tab that wrote classic keys while no current tab was open is still heard at the next page
// load, by the same rule: its new card, its change to a card that is stampless since migration and its
// change to a stampless setting are imported, stampless (a stampless scalar merges by the engine's legacy
// tie-break, which keeps 45 over 20). A stamped card keeps the envelope's value; a missing id is no deletion.
{
 const w=world({[LE]:{old:{k:1,g:100,c:99},kept:{k:2,g:200,c:199},missing:{k:3,g:300,c:299}},[GOAL]:20}),cur=w.open();
 w.act(cur,()=>assert.strictEqual(cur.I.dogru('kept'),3));const keptStamp=cur.E.zarf().alanlar[LE].i.kept.m;cur.closed=true;
 w.s.set(LE,{old:{k:2,g:103,c:102},kept:{k:2,g:200,c:199},fresh:{k:1,g:101,c:100}});w.s.set(GOAL,45);
 const next=w.open(),zarf=next.E.zarf().alanlar;
 assert.strictEqual(next.I.kutu('kept'),3,'the stale full object of a pre-envelope tab must not revert a stamped card at page load');
 assert.deepStrictEqual([next.I.kutu('old'),next.I.kutu('fresh'),next.I.kutu('missing'),next.I.gunlukHedef()],[2,1,3,45],'new and stampless records of a pre-envelope tab are imported at page load');
 assert.deepStrictEqual([zarf[LE].i.old.m,zarf[LE].i.fresh.m,zarf[GOAL].i.$.m,zarf[LE].i.kept.m],[0,0,0,keptStamp],'records imported at page load stay stampless');
 assert.deepStrictEqual([w.disk().open,w.disk().mirrored],[false,true]);
}
// Rule 3: a tab that brings nothing new does not write. A tab that only learned of a transaction (another
// tab's storage event, or a cloud snapshot the disk envelope already contains) adopts it in memory and
// tells the page, but neither mirrors nor closes it: in a browser its view lags behind the writer, and its
// completion used to land on top of the writer's NEXT transaction. If the writer died midway, the
// learner's next own write or the next page load completes the transaction, under the dead writer's stamp.
{
 const start=()=>{const w=world(),A=w.open();w.act(A,()=>['p','q'].forEach(id=>A.I.dogru(id)));const B=w.open();w.flush();return {w,A,B};};
 [[2,'write'],[2,'load'],[3,'write'],[3,'load']].forEach(([step,repair])=>{       // A dies before its 2nd write (the mirror) or its 3rd (the closing envelope)
  const {w,A,B}=start(),at=' (writer closed at write '+step+', repaired by '+repair+')';
  w.kill(A,step);assert.throws(()=>w.act(A,()=>A.I.dogru('p')),/tab closed/);
  const stamp=w.disk().rec(LE,'p').m,wrote=B.writes,told=B.notes.length,heard=()=>B.notes.slice(told).filter(n=>n.kaynak!=='yerel');
  assert.deepStrictEqual([w.disk().open,w.s.get(LE).p.k,B.I.kutu('p')],[true,step===2?1:2,1]);
  w.flush();
  assert.strictEqual(B.writes,wrote,'a tab that only learned of a transaction must not write'+at);
  assert.deepStrictEqual(heard(),[{anahtarlar:[LE],kaynak:'sekme'}],'the learner tells the page'+at);
  assert.strictEqual(B.I.kutu('p'),2,'the learner adopted the transaction in memory'+at);
  assert.deepStrictEqual([w.disk().open,w.s.get(LE).p.k],[true,step===2?1:2],'the dead writer\'s transaction is left as it is'+at);
  if(repair==='write')w.act(B,()=>assert.strictEqual(B.I.dogru('q'),2));else w.open();
  w.flush();
  assert.deepStrictEqual([w.disk().open,w.disk().mirrored,w.s.get(LE).p.k],[false,true,2],'transaction completed'+at);
  assert.strictEqual(w.disk().rec(LE,'p').m,stamp,'completed under the dead writer\'s stamp'+at);
  assert.strictEqual(heard().length,1,'the page is told once, not again when the transaction is completed'+at);
 });
 // A cloud snapshot without news is no reason to complete another tab's transaction either...
 const {w,A,B}=start(),cloud=B.E.zarf();
 w.kill(A,2);assert.throws(()=>w.act(A,()=>A.I.dogru('p')),/tab closed/);
 const stamp=w.disk().rec(LE,'p').m,wrote=B.writes;
 assert.strictEqual(w.act(B,()=>B.E.uygula(cloud,'bulut')).basarili,true);
 assert.strictEqual(B.writes,wrote,'a cloud snapshot without news must not write');
 assert.deepStrictEqual([w.disk().open,w.s.get(LE).p.k,B.D.oku(LE).p.k],[true,1,2]);
 // ...while a snapshot that does bring a record is persisted, and completes the open transaction on the way.
 const news=M.kayitlariYaz(B.E.zarf(),LE,{r:{k:5,g:900,c:899}},()=>'2999999999999:other-device');
 assert.strictEqual(w.act(B,()=>B.E.uygula(news,'bulut')).basarili,true);w.flush();
 assert.deepStrictEqual([w.disk().open,w.disk().mirrored,w.s.get(LE).r.k,w.s.get(LE).p.k,w.disk().rec(LE,'p').m],[false,true,5,2,stamp],'a cloud snapshot with news is persisted');
 // The other side of the rule. localStorage has no compare-and-swap: an envelope written from a lagging view can
 // replace a newer one (put on disk by hand here). A tab that knows better than the disk envelope does bring
 // something new, so it writes envelope and mirror back, under the stamp the answer already had.
 {
  const {w,A,B}=start();w.act(A,()=>A.I.dogru('p'));w.flush();const lagging=[w.s.get(NEW),plain(w.s.get(LE))];
  w.act(A,()=>assert.strictEqual(A.I.dogru('p'),3));w.flush();const stamp=w.disk().rec(LE,'p').m;
  w.act(B,()=>{w.s.set(NEW,lagging[0]);w.s.set(LE,lagging[1]);});assert.strictEqual(w.disk().rec(LE,'p').v.k,2);w.flush();
  assert.deepStrictEqual([w.disk().open,w.disk().mirrored,w.disk().rec(LE,'p').v.k,w.disk().rec(LE,'p').m],[false,true,3,stamp],'a tab that knows better than the disk envelope writes it back, under the original stamp');
  assert.deepStrictEqual([A.I.kutu('p'),B.I.kutu('p')],[3,3]);
 }
}
// Rule 4: a read can merge another tab's newer envelope before that tab's storage events are handled. The
// events then find nothing changed, and the page (which refreshes only on 'sekme'/'bulut' notifications)
// kept showing its stale copy. Fields merged silently are owed to the page: the next non-local
// notification carries them, exactly once; a local notification in between does not use the debt up.
{
 const start=()=>{const w=world(),A=w.open();w.act(A,()=>A.I.dogru('p'));const B=w.open();w.flush();
  w.act(A,()=>assert.strictEqual(A.I.dogru('p'),2));                                      // A's storage events are queued, not yet handled by B
  assert.strictEqual(B.I.kutu('p'),1);assert.strictEqual(B.D.oku(LE).p.k,2);               // B's read merges A's envelope silently
  return {w,A,B,from:B.notes.length};};
 const owed=(B,from)=>B.notes.slice(from).filter(n=>n.kaynak!=='yerel'&&n.anahtarlar.includes(LE));
 let {w,A,B,from}=start();w.flush();
 assert.strictEqual(B.I.kutu('p'),2,'a field merged silently by a read must reach the page');
 assert.deepStrictEqual(owed(B,from).map(n=>[n.kaynak,n.anahtarlar.includes(DAILY)]),[['sekme',true]],'silently merged fields are announced with the next sekme notification, exactly once');
 w.act(A,()=>A.I.gunlukHedefAyarla(31));w.flush();assert.strictEqual(owed(B,from).length,1,'the debt is paid once');
 // a local write between the silent merge and the events
 ({w,A,B,from}=start());w.act(B,()=>assert.strictEqual(B.I.gunlukHedefAyarla(33),true));w.flush();
 assert.deepStrictEqual(owed(B,from).map(n=>n.kaynak),['sekme'],'a local notification must not use the debt up');
 // a cloud snapshot without news before the events: the 'bulut' notification carries the debt
 ({w,A,B,from}=start());assert.strictEqual(w.act(B,()=>B.E.uygula(B.E.zarf(),'bulut')).basarili,true);
 assert.deepStrictEqual(owed(B,from).map(n=>n.kaynak),['bulut'],'a cloud notification carries the debt');assert.strictEqual(B.I.kutu('p'),2);
 w.flush();assert.strictEqual(owed(B,from).length,1,'the debt is paid once (cloud first)');
 // a cloud snapshot that brings a setting: the notification of that write carries the debt as well
 ({w,A,B,from}=start());const news=M.kayitlariYaz(B.E.zarf(),GOAL,{$:44},()=>'2999999999999:other-device');
 assert.strictEqual(w.act(B,()=>B.E.uygula(news,'bulut')).basarili,true);
 assert.deepStrictEqual(owed(B,from).map(n=>[n.kaynak,n.anahtarlar.includes(GOAL)]),[['bulut',true]],'the notification of a cloud write carries the debt');
 w.flush();assert.strictEqual(owed(B,from).length,1,'the debt is paid once (cloud write first)');
 // The two counter fields merge by device share, not by stamp: here another device's share reaches A through
 // the cloud and the day's record grows under an unchanged stamp. That is owed to the page all the same.
 ({w,A,B}=start());w.flush();const day=Object.keys(B.D.oku(DAILY)).pop(),share={t:7,y:0,d:7,m:0,z:0},dayStamp=B.E.zarf().alanlar[DAILY].i[day].m;
 assert.strictEqual(w.act(A,()=>A.E.uygula({surum:2,alanlar:{[DAILY]:{i:{[day]:{m:'1:other-device',v:{...share,p:{otherdevice:share}}}}}}},'bulut')).basarili,true);
 from=B.notes.length;assert.deepStrictEqual([B.D.oku(DAILY)[day].t,B.E.zarf().alanlar[DAILY].i[day].m],[9,dayStamp]);w.flush();
 assert.deepStrictEqual(B.notes.slice(from).filter(n=>n.anahtarlar.includes(DAILY)).map(n=>n.kaynak),['sekme'],'a counter that grew under an unchanged stamp is owed to the page as well');
 console.log('two-tab race rules PASS');
}
// A classic key that disagrees with a COMMITTED envelope is rebuilt whatever its type (number, string, a list the
// envelope no longer has), by one page load, without minting; and a classic-key event whose stampless import
// changes nothing (the legacy rule keeps the envelope's value) rebuilds the mirror too.
{
 let st=storage(),t=environment(st);
 assert.strictEqual(t.D.yaz('yds-gunluk-yeni',15),true);assert.strictEqual(t.D.yaz('yds-eksen','siklik'),true);
 assert.strictEqual(t.I.dogru('kept'),1);assert.strictEqual(t.I.yanlisEkle({kat:'Kelime',soru:'probe'}),true);
 const oldList=plain(st.get('yds-yanlis'));assert.strictEqual(t.I.yanlisTemizle(),true);assert.strictEqual(st.get('yds-yanlis'),undefined);
 st.set('yds-gunluk-yeni',89);st.set('yds-eksen','alfabe');st.set('yds-yanlis',oldList);    // a tab with an older view rewrote three mirrors; every tab is gone
 const committedBytes=st.data.get(NEW);
 t=environment(st);
 assert.deepStrictEqual([t.D.oku('yds-gunluk-yeni'),t.D.oku('yds-eksen'),t.I.yanlisDefter().length],[15,'siklik',0],'the envelope keeps its values');
 assert.deepStrictEqual([st.get('yds-gunluk-yeni'),st.get('yds-eksen'),st.get('yds-yanlis')],[15,'siklik',undefined],'every stale classic key is rebuilt at page load');
 assert.strictEqual(st.data.get(NEW),committedBytes,'no stamp minted, envelope bytes unchanged');
 let legacy=storage({'yds-gunluk-yeni':20,'yds-leitner':{old:{k:3,g:210,c:200}}}),cur=environment(legacy);
 assert.strictEqual(cur.E.zarf().alanlar['yds-leitner'].i.old.m,0);
 const before=plain(legacy.get('yds-leitner')),older={old:{k:2,g:203,c:200}};
 legacy.set('yds-leitner',older);cur.event('yds-leitner',before,older);
 assert.deepStrictEqual(plain(legacy.get('yds-leitner')),plain(cur.E.paket()['yds-leitner']),'mirror equals the envelope after an import that changed nothing');
 legacy.set('yds-gunluk-yeni',10);cur.event('yds-gunluk-yeni',20,10);
 assert.deepStrictEqual(legacy.get('yds-gunluk-yeni'),cur.E.paket()['yds-gunluk-yeni'],'scalar mirror equals the envelope after an import that changed nothing');
 assert.strictEqual(legacy.get(NEW).b,undefined);
}
// A local write that changes nothing is not a write. Pages do this while loading (Kelimeler stores the layer
// selection it has just read, a reset profile stores its empty Leitner object); written from the state the page
// booted with, such a write replaced a newer envelope another tab had committed meanwhile.
{
 const w=world(),A=w.open();
 w.act(A,()=>{A.I.dogru('p');assert.strictEqual(A.D.yaz('yds-katmanlar',[2,3]),true);});A.closed=true;
 const B=w.open(),bytes=w.s.data.get(NEW);
 let sets=0;const rawSet=w.s.set;w.s.set=(key,value)=>{sets++;return rawSet(key,value);};   // setItem calls (removing an absent key is not one)
 w.act(B,()=>{assert.strictEqual(B.D.yaz('yds-katmanlar',[2,3]),true);assert.strictEqual(B.D.yaz(LE,B.D.oku(LE)),true);});
 assert.deepStrictEqual([sets,w.s.data.get(NEW),B.notes],[0,bytes,[]],'a local write that changes nothing must not touch the storage or notify');
 w.act(B,()=>assert.strictEqual(B.D.yaz('yds-katmanlar',[2]),true));                      // a real change is still a transaction
 assert.deepStrictEqual([sets,plain(w.s.get('yds-katmanlar')),w.disk().open,w.disk().mirrored],[3,[2],false,true]);
 // ...but when the mirror is wrong, the same write repairs it (every key, also a number-valued one).
 w.s.set(GOAL,77);w.s.set('yds-katmanlar',[9]);
 w.act(B,()=>assert.strictEqual(B.D.yaz('yds-katmanlar',[2]),true));
 assert.deepStrictEqual([w.disk().mirrored,plain(w.s.get('yds-katmanlar')),w.s.get(GOAL)],[true,[2],undefined],'a no-op write still repairs a stale mirror');
}
// While another tab's transaction is open on disk (envelope with "b") a tab does not rebuild the classic mirror
// from a classic-key event: the writer is about to write its own mirror and a rebuild from here could land on
// top of it (with a tab still running the previous code as the writer, that reverted its own answers). The
// writer mirrors the keys of its own transaction and rebuilds the others when it handles the same event; the
// next write of any tab while the transaction is still open, or the next page load, rebuilds every key.
{
 const w=world(),A=w.open(),B=w.open();w.flush();
 w.act(A,()=>{A.I.dogru('p');A.I.dogru('q');});w.flush();
 const older=plain(w.s.get(LE));
 w.act(A,()=>assert.strictEqual(A.I.dogru('p'),2));w.flush();
 w.kill(A,2);assert.throws(()=>w.act(A,()=>A.I.dogru('q')),/tab closed/);                 // A dies right after its first write: the transaction is open
 assert.strictEqual(w.disk().open,true);
 const bytes=w.s.data.get(NEW);
 w.s.set(LE,older);                                                                       // a late, stale mirror lands (no owner: every open tab gets the event)
 let sets=0;const rawSet=w.s.set;w.s.set=(key,value)=>{sets++;return rawSet(key,value);};
 assert.ok(w.flush()<100);
 assert.deepStrictEqual([sets,w.s.data.get(NEW)],[0,bytes],'no mirror rebuild and no envelope write while another tab\'s transaction is open');
 w.s.del(LE);assert.ok(w.flush()<100);                                                    // the same for a classic key that was removed
 assert.deepStrictEqual([sets,w.s.data.get(NEW),w.s.get(LE)],[0,bytes,undefined],'a removed classic key is not rebuilt either while the transaction is open');
 assert.deepStrictEqual([B.I.kutu('p'),B.I.kutu('q')],[2,2],'the open transaction is adopted in memory, the stale mirror is not');
 w.act(B,()=>assert.strictEqual(B.I.dogru('r'),1));w.flush();                             // the next own write completes and mirrors everything
 assert.deepStrictEqual([w.disk().open,w.disk().mirrored,w.s.get(LE).p.k,w.s.get(LE).q.k],[false,true,2,2],'the next write closes the transaction and rebuilds the mirror');
 // The same state repaired by a page load instead.
 const v=world(),C=v.open(),D=v.open();v.flush();
 v.act(C,()=>{C.I.dogru('p');C.I.dogru('p');});v.flush();const stale=plain(v.s.get(LE));
 v.act(C,()=>assert.strictEqual(C.I.dogru('p'),3));v.flush();
 v.kill(C,2);assert.throws(()=>v.act(C,()=>C.I.dogru('p')),/tab closed/);v.s.set(LE,stale);v.flush();D.closed=true;
 const E=v.open();
 assert.deepStrictEqual([v.disk().open,v.disk().mirrored,E.I.kutu('p'),v.s.get(LE).p.k],[false,true,4,4],'a page load completes the dead writer\'s transaction over a stale mirror');
 console.log('mirror rules PASS: stale classic keys rebuilt at page load, no-op writes skipped, no rebuild during an open transaction');
}
// The stamped-record guards (surumlu) decide something only for the two counter fields: the engine merges those by
// device share whatever the stamp, so a stampless import would still raise a stamped day record, and a tab that only
// listens would answer a counter mirror with an envelope write of its own. For every other field the stampless
// import alone already keeps the stamped record.
{
 const w=world(),A=w.open(),B=w.open();w.flush();
 w.act(A,()=>{A.I.dogru('p');A.I.dogru('q');});w.flush();
 const day=Object.keys(B.D.oku(DAILY)).pop(),stamp=B.E.zarf().alanlar[DAILY].i[day].m,ahead=plain(w.s.get(DAILY)),dev=Object.keys(ahead[day].p)[0];
 ['t','d'].forEach(f=>{ahead[day][f]++;ahead[day].p[dev][f]++;});
 const before=w.s.envWrites;w.s.set(DAILY,ahead);w.flush();                                // a counter mirror one answer ahead (no owner: both tabs get the event)
 [A,B].forEach(t=>assert.deepStrictEqual([t.D.oku(DAILY)[day].t,t.E.zarf().alanlar[DAILY].i[day].m],[2,stamp],'a classic-key event must not raise a stamped counter record'));
 assert.deepStrictEqual([w.s.envWrites-before,w.disk().mirrored],[0,true],'a counter mirror is answered by a mirror rebuild, never by an envelope write');
 A.closed=B.closed=true;w.s.set(DAILY,ahead);const C=w.open();
 assert.deepStrictEqual([C.D.oku(DAILY)[day].t,C.E.zarf().alanlar[DAILY].i[day].m,w.disk().mirrored],[2,stamp,true],'a counter mirror beside a committed envelope is rebuilt at page load, the stamped day record stays');
}
// A page load that also CHANGES the envelope (here: a never-seen card in the classic key) still verifies every mirror;
// the envelope-equals-candidate test alone would leave the stale number for the load after this one.
{
 const st=storage();let t=environment(st);
 assert.strictEqual(t.D.yaz('yds-gunluk-yeni',15),true);assert.strictEqual(t.I.dogru('kept'),1);
 st.set('yds-gunluk-yeni',89);st.set('yds-leitner',{...st.get('yds-leitner'),fresh:{k:1,g:101,c:100}});
 t=environment(st);
 assert.deepStrictEqual([st.get('yds-gunluk-yeni'),t.I.kutu('fresh')],[15,1],'a page load that imports a record still rebuilds a stale number-valued mirror');
}
// Rule 4 for a record that is stampless on both sides: its stamp (0) says nothing, so the owed-field test has to
// compare the value. A imports a pre-envelope tab's change to a stampless card; B reads before A's events arrive.
{
 const w=world({[LE]:{old:{k:1,g:100,c:99}}}),A=w.open(),B=w.open();w.flush();
 const before=plain(w.s.get(LE)),older={old:{k:2,g:103,c:102}};
 w.s.data.set(LE,JSON.stringify(older));w.act(A,()=>A.event(LE,before,older));              // only A has handled the classic-key event so far
 assert.strictEqual(A.E.zarf().alanlar[LE].i.old.m,0);assert.strictEqual(B.I.kutu('old'),1);assert.strictEqual(B.D.oku(LE).old.k,2);   // B's read merges A's envelope silently
 const from=B.notes.length;w.flush();
 assert.deepStrictEqual([B.I.kutu('old'),B.notes.slice(from).filter(n=>n.kaynak==='sekme'&&n.anahtarlar.includes(LE)).length],[2,1],'a stampless record that changed value is owed to the page as well');
}
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
console.log(JSON.stringify({status:'PASS',wordsPhrases:ids.length,sentences:c.window.CUMLELER_DIZIN.toplam,finalBytes:stress.bytes(),peakBytes:stress.peak,quota:stress.limit,writeFailures:stress.failures,bootMs,writeMs},null,2));
