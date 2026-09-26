'use strict';
const assert=require('node:assert/strict');
const {Storage,browser}=require('./kullanim-fixture');
const page=(b,id='kelimeler')=>b.report().pages.find(r=>r.id===id);
const feature=(b,id='kart-cevap')=>b.report().features.find(r=>r.id===id);
let b=browser();assert.equal(page(b).visits,1);assert.equal(b.K.olay('unknown'),false);
b.advance(60000);b.tick();assert.equal(page(b).seconds,60);
b.advance(240000);b.tick();assert.equal(page(b).seconds,90,'Idle cutoff closes at last interaction +90s');
b.K.olay('kart-cevap');b.advance(10000);b.checkpoint();assert.equal(page(b).seconds,100,'New event never credits the idle gap');
assert.equal(feature(b).count,1);assert.equal(feature(b).days,1);
b.visibility(true);b.emit('pagehide');b.emit('freeze');b.checkpoint();assert.equal(page(b).seconds,100,'Repeated lifecycle checkpoints are idempotent');
b.advance(3600000);b.visibility(false);b.advance(10000);b.checkpoint();assert.equal(page(b).seconds,110);assert.equal(page(b).visits,1,'Tab visibility does not add visits');

// Closing tab B cannot erase A's final save: physical keys have independent owners.
const storage=new Storage(),a=browser({storage}),c=browser({storage});
a.K.olay('kart-cevap');a.K.olay('kart-cevap');c.K.olay('kart-cevap');
a.checkpoint();c.checkpoint();a.emit('pagehide');c.emit('pagehide');
assert.equal(feature(a).count,3);assert.equal(page(a).visits,2);
for(let i=0;i<5;i++){a.checkpoint();c.checkpoint();}assert.equal(feature(a).count,3,'Absolute snapshots are never summed twice');
const recordKeys=Array.from(storage.map.keys()).filter(k=>k.includes(':r:'));assert.equal(recordKeys.length,2);

// Reload retains one visit, with a fresh writer for the new document.
const reload=browser({storage:a.storage,sessionStorage:a.sessionStorage,reload:true});
assert.equal(page(reload).visits,2);reload.advance(5000);reload.checkpoint();assert.equal(page(reload).seconds,5);
const navigate=browser({storage:a.storage,sessionStorage:a.sessionStorage});assert.equal(page(navigate).visits,3);

b=browser();b.advance(12000);b.visibility(true);b.emit('pagehide',{persisted:true});b.advance(300000);
b.document.visibilityState='visible';b.emit('pageshow',{persisted:true});b.advance(8000);b.checkpoint();
assert.equal(page(b).seconds,20,'BFCache wait is excluded');assert.equal(page(b).visits,2);
b.emit('pageshow',{persisted:true});b.checkpoint();assert.equal(page(b).visits,2,'Repeated pageshow does not duplicate a return');

b=browser({hidden:true});assert.equal(page(b).visits,0);b.advance(600000);b.visibility(false);b.advance(5000);b.checkpoint();
assert.equal(page(b).visits,1);assert.equal(page(b).seconds,5,'Initially hidden tab starts only when visible');
b=browser();b.advance(3600000,10);b.checkpoint();assert.equal(page(b).seconds,0,'OS sleep / clock mismatch is not active time');
b.advance(-10000,5000);b.checkpoint();assert.equal(page(b).seconds,0,'Backward wall clock cannot produce negative or huge duration');

const resetStore=new Storage(),old=browser({storage:resetStore}),settings=browser({storage:resetStore,path:'/ayarlar.html'});
resetStore.setItem('yds-leitner','learning');resetStore.setItem('yds-kullanim-other','neighbor');
old.K.olay('ipucu');old.checkpoint();old.K.olay('kart-cevap');assert.equal(settings.K.sifirla(),true);
old.advance(60000);old.checkpoint();assert.equal(settings.K.oku().records.length,0,'An old tab cannot revive pre-reset memory');
assert.equal(resetStore.getItem('yds-leitner'),'learning');assert.equal(resetStore.getItem('yds-kullanim-other'),'neighbor');
old.K.olay('kart-cevap');old.checkpoint();assert.equal(feature(old).count,1,'Only new post-reset interaction is counted');
assert.equal(feature(old,'ipucu').count,0);

// External site-data deletion also invalidates in-memory totals.
const erased=browser();erased.K.olay('kart-cevap');erased.checkpoint();erased.storage.map.clear();
erased.emit('storage',{key:null});erased.K.olay('ipucu');erased.checkpoint();
assert.equal(feature(erased).count,0);assert.equal(feature(erased,'ipucu').count,1);

// Force a reset between another writer's epoch check and physical write.
const racingStore=new Storage(),writer=browser({storage:racingStore}),resetter=browser({storage:racingStore,path:'/ayarlar.html'});
writer.K.olay('kart-cevap');const realSet=racingStore.setItem.bind(racingStore);let intercepted=false;
racingStore.setItem=(k,v)=>{if(!intercepted&&k.includes(':r:')){intercepted=true;resetter.K.sifirla();}realSet(k,v);};
writer.checkpoint();assert.equal(feature(resetter).count,0,'Late old-epoch save is invisible');
resetter.K.olay('ipucu');resetter.checkpoint();
assert.equal(Array.from(racingStore.map.keys()).some(k=>/:r:ilk:/.test(k)),false,'Maintenance removes stale epoch writes');

// A successful visit record followed by a failing summary must not double on reload.
const markerFailure=new Storage(),originalSet=markerFailure.setItem.bind(markerFailure);
markerFailure.setItem=(k,v)=>{if(k.includes(':start:'))throw Error('summary quota');originalSet(k,v);};
const markerTab=browser({storage:markerFailure});markerFailure.setItem=originalSet;
const markerReload=browser({storage:markerFailure,sessionStorage:markerTab.sessionStorage,reload:true});
assert.equal(page(markerReload).visits,1);

// Reader is genuinely read-only; retired details do not erase the last-use summary.
const retained=new Storage(),first=browser({storage:retained,now:new Date(2026,0,1,12).getTime()});
first.K.olay('ipucu');first.checkpoint();
const later=browser({storage:retained,now:new Date(2026,7,1,12).getTime(),path:'/quiz.html'});
const oldDay=first.H.gun(new Date(2026,0,1));
assert.equal(later.K.oku().records.some(r=>r.g===oldDay),false,'180-day detail is pruned');
assert.equal(feature(later,'ipucu').lastDay,oldDay,'Last-use summary survives pruning');
assert.equal(feature(later,'ipucu').count,0,'Lifetime summary does not invent period actions');
assert.equal(later.K.oku().startedDay,oldDay);
const before=JSON.stringify(Array.from(retained.map));later.K.oku();later.report(90);assert.equal(JSON.stringify(Array.from(retained.map)),before);
assert.ok(Array.from(retained.map.keys()).filter(k=>k.includes(':start:')).length===1,'Start markers remain bounded per installation');

const blocked=new Storage();blocked.blocked=true;const denied=browser({storage:blocked});
assert.equal(denied.K.yaz(),false);assert.equal(denied.K.oku().partial,true);assert.doesNotThrow(()=>denied.K.olay('ipucu'));
const partialStore=new Storage(),partial=browser({storage:partialStore});partial.K.olay('ipucu');partialStore.blocked=true;
assert.equal(partial.K.yaz(),false);partialStore.blocked=false;assert.equal(partial.K.yaz(),true);
assert.equal(feature(partial,'ipucu').count,1,'Failed save retains absolute pending record');
partialStore.setItem('yds-kullanim-v1:r:ilk:123:broken:broken','{"oops":true}');assert.equal(partial.K.oku().partial,true);

// Aggregation: used days are unique across tabs; future/invalid rows never inflate totals.
b=browser();const today=b.H.gun(new Date(2026,8,26));
const snapshot={records:[
  {v:1,g:today,p:'quiz',a:1,s:30,f:{'quiz-bitir':2}},
  {v:1,g:today,p:'quiz',a:1,s:30,f:{'quiz-bitir':3}},
  {v:1,g:today-8,p:'quiz',a:1,s:60,f:{'quiz-bitir':1}},
  {v:1,g:today+1,p:'quiz',a:999,s:1000,f:{'quiz-bitir':999}},
  {v:1,g:today,p:'quiz',a:-1,s:1000,f:{}}
],lastFeatures:{ipucu:today-190},startedDay:today-200};
let report=b.H.rapor(snapshot,7,today);assert.equal(report.seconds,60);assert.equal(report.partial,true);
assert.equal(report.features.find(r=>r.id==='quiz-bitir').days,1);assert.equal(report.features.find(r=>r.id==='quiz-bitir').count,5);
assert.equal(report.features.find(r=>r.id==='ipucu').lastDay,today-190);
assert.equal(b.H.rapor(snapshot,30,today).seconds,120);assert.equal(report.pages.length,b.H.sayfalar.length);
assert.equal(b.H.sayfa('/konu/E01.html'),'konu');assert.equal(b.H.sayfa('/konu/T61.html'),'konu');
console.log('Usage core: idle/lifecycle, per-writer persistence, reload, BFCache, hidden load, reset, retention, corruption and read-only report passed.');
