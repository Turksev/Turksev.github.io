'use strict';
const assert=require('node:assert/strict');
const {Storage,browser}=require('./kullanim-fixture');
const PREFIX='yds-kullanim-v1:',BUDGET=512*1024,DAY=86400000;
const bytes=store=>Array.from(store.map).filter(([k])=>k.startsWith(PREFIX)).reduce((n,[k,v])=>n+2*(k.length+v.length),0);
const firstDate=new Date(2026,0,1,12).getTime();
for(const visits of [6,12,25]){
  const store=new Storage();store.setItem('yds-leitner','learning data must survive pressure');
  let tab,firstTab,trimmed=false;
  for(let day=0;day<190;day++){
    for(let visit=0;visit<visits;visit++){
      tab=browser({storage:store,now:firstDate+day*DAY+visit*60000});
      if(!firstTab)firstTab=tab;
      tab.K.olay('deste-baslat');tab.advance(30000);tab.K.olay('kart-cevap');tab.advance(10000);
      assert.equal(tab.checkpoint(),true,visits+'/day stopped at day '+(day+1));
    }
    assert.ok(bytes(store)<=BUDGET,'All records and metadata share the budget');
    const snapshot=tab.K.oku();
    const today=tab.H.gun(new Date(firstDate+day*DAY));
    assert.equal(snapshot.records.filter(r=>r.g===today).reduce((n,r)=>n+r.a,0),visits,'Current day visits are all retained');
    assert.equal(snapshot.records.filter(r=>r.g===today).reduce((n,r)=>n+(r.f['kart-cevap']||0),0),visits,'Current day actions are all retained');
    if(snapshot.retainedFromDay!==null){trimmed=true;assert.ok(snapshot.records.every(r=>r.g>=snapshot.retainedFromDay));}
  }
  assert.equal(store.getItem('yds-leitner'),'learning data must survive pressure');
  assert.equal(Array.from(store.map.keys()).some(k=>k.startsWith(PREFIX+'gap:')),false,'Pressure cannot create unbounded error keys');
  const snapshot=tab.K.oku(),cutoff=snapshot.retainedFromDay;
  assert.equal(snapshot.startedDay,tab.H.gun(new Date(firstDate)),'Start summary survives capacity eviction');
  assert.equal(snapshot.lastFeatures['kart-cevap'],tab.H.gun(new Date(firstDate+189*DAY)));
  if(visits>=12)assert.equal(trimmed,true,'Simulation must exercise capacity eviction');
  if(cutoff!==null){
    const ninety=tab.H.rapor(snapshot,90,tab.H.gun(new Date(firstDate+189*DAY)));
    assert.equal(ninety.capacityLimited,ninety.start<cutoff,'Capacity warning follows the selected period');
    // A still-open writer from the removed first day cannot restore it.
    firstTab.advance(189*DAY);firstTab.K.olay('ipucu');assert.equal(firstTab.checkpoint(),true);
    assert.ok(firstTab.K.oku().records.every(r=>r.g>=cutoff));
  }
  console.log('Capacity: '+visits+' visits/day for 190 days, writes continued; '+bytes(store)+' bytes, trimmed='+trimmed);
}

// Recovery clears the error after pending absolute counts really persist.
const store=new Storage(),tab=browser({storage:store});
tab.K.olay('ipucu');store.blocked=true;
assert.equal(tab.checkpoint(),false);assert.equal(tab.K.oku().partial,true);
const count=store.map.size;for(let i=0;i<30;i++)assert.equal(tab.checkpoint(),false);
assert.equal(store.map.size,count,'Repeated failures do not consume storage');
store.blocked=false;assert.equal(tab.checkpoint(),true);assert.equal(tab.K.oku().partial,false);
assert.equal(tab.report().features.find(r=>r.id==='ipucu').count,1);

// Semantic background actions count without creating visible visits or seconds.
const hidden=browser({hidden:true});hidden.advance(120000);assert.equal(hidden.K.olay('deneme-bitir'),true);
let result=hidden.report();assert.equal(result.features.find(r=>r.id==='deneme-bitir').count,1);
assert.equal(result.seconds,0);assert.equal(result.pages.reduce((n,r)=>n+r.visits,0),0);
hidden.K.olay('deste-baslat');assert.equal(hidden.report().features.find(r=>r.id==='deste-baslat').count,1);
hidden.visibility(false);assert.equal(hidden.report().pages.reduce((n,r)=>n+r.visits,0),1);

// A background business event is not proof that a visible visit was saved.
// This reload has no preceding saved visit; its first visible activation counts.
const hiddenReload=browser({hidden:true,reload:true,path:'/deneme.html'});
hiddenReload.K.olay('deneme-bitir');
assert.equal(hiddenReload.report().features.find(r=>r.id==='deneme-bitir').count,1);
assert.equal(hiddenReload.report().pages.find(r=>r.id==='deneme').visits,0);
hiddenReload.visibility(false);hiddenReload.checkpoint();
assert.equal(hiddenReload.report().pages.find(r=>r.id==='deneme').visits,1,
  'A hidden event cannot suppress the first visible visit of a reload');
hiddenReload.visibility(true);hiddenReload.visibility(false);hiddenReload.checkpoint();
assert.equal(hiddenReload.report().pages.find(r=>r.id==='deneme').visits,1,
  'Later visibility changes still preserve the same visit');

// A concurrent tab may accept the new epoch immediately after reset publishes
// it. The reset must delete only old data, preserving this post-reset action.
const resetStore=new Storage(),active=browser({storage:resetStore}),settings=browser({storage:resetStore,path:'/ayarlar.html'});
active.K.olay('kart-cevap');active.checkpoint();
const resetSet=resetStore.setItem.bind(resetStore);let resetIntercepted=false,duringReset=0;
resetStore.setItem=(key,value)=>{
  resetSet(key,value);
  if(!resetIntercepted && key===PREFIX+'epoch'){
    resetIntercepted=true;
    active.K.olay('ipucu');assert.equal(active.checkpoint(),true);
    duringReset=active.report().features.find(r=>r.id==='ipucu').count;
  }
};
assert.equal(settings.K.sifirla(),true);resetStore.setItem=resetSet;
assert.equal(resetIntercepted,true,'Test must interleave a write after the new epoch is published');
assert.equal(duringReset,1,'The concurrent new-epoch action really persisted');
assert.equal(settings.report().features.find(r=>r.id==='ipucu').count,1,
  'Reset deletion preserves a concurrently saved action from the new epoch');
assert.equal(settings.report().features.find(r=>r.id==='kart-cevap').count,0,
  'The old-epoch action is still cleared');

// Old versions or concurrent inventories can leave the soft budget exceeded.
// The small immutable cutoff must still be writable so older days can be
// removed; its normal size guard must not deadlock recovery above the limit.
const oversized=new Storage(),seed=browser({storage:oversized});
oversized.setItem('yds-leitner','learning data survives over-budget recovery');
const yesterday=seed.H.gun(new Date(2026,8,25));
const historical=JSON.stringify({v:1,g:yesterday,p:'kelimeler',a:1,s:60,f:{'kart-cevap':10}});
let oversizedBytes=bytes(oversized),serial=0;
while(oversizedBytes<=BUDGET+2048){
  const key=PREFIX+'r:ilk:'+yesterday+':00000000-0000-4000-8000-111111111111:'+String(serial++).padStart(36,'0');
  oversized.setItem(key,historical);oversizedBytes+=2*(key.length+historical.length);
}
assert.ok(bytes(oversized)>BUDGET,'Recovery fixture begins beyond the whole-prefix budget');
const recovered=browser({storage:oversized,path:'/quiz.html'});
assert.equal(recovered.checkpoint(),true,'Over-budget storage with older days must recover');
const recoveredSnapshot=recovered.K.oku();
assert.equal(recoveredSnapshot.partial,false);
assert.ok(recoveredSnapshot.retainedFromDay>yesterday,'Recovery publishes the persistent cutoff');
assert.ok(recoveredSnapshot.records.every(row=>row.g>=recoveredSnapshot.retainedFromDay));
assert.ok(bytes(oversized)<=BUDGET,'Recovery includes its control metadata in the resulting budget');
assert.equal(recovered.report().pages.find(r=>r.id==='quiz').visits,1);
recovered.K.olay('quiz-baslat');assert.equal(recovered.checkpoint(),true);
assert.equal(recovered.report().features.find(r=>r.id==='quiz-baslat').count,1,'New writes continue after recovery');
assert.equal(oversized.getItem('yds-leitner'),'learning data survives over-budget recovery');

// Storage traversal is deferred until after initial paint, then done once per flush.
const deferredStore=new Storage(),frames=[],deferred=browser({storage:deferredStore,animationFrames:frames});
assert.equal(deferredStore.enumerations,0,'Head startup must not scan localStorage');
frames.shift()();assert.equal(deferredStore.enumerations,0,'First frame only schedules persistence');
frames.shift()();assert.equal(deferredStore.enumerations,1);
for(const id of ['deste-baslat','kart-cevap','quiz-baslat','quiz-bitir','deneme-bitir','ipucu','gunun-testi-baslat','gunun-testi-bitir'])deferred.K.olay(id);
const scans=deferredStore.enumerations;deferred.checkpoint();assert.equal(deferredStore.enumerations-scans,1,'All feature markers reuse the single inventory');
console.log('Capacity and collector regressions: recovery, bounded failure, hidden reload, concurrent reset, oversized storage, startup and checkpoint scans passed.');
