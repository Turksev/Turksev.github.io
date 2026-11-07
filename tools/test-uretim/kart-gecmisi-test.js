'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var api=require('./tarayici-vm'),root=path.resolve(__dirname,'../..');
var RealDate=Date,now=new Date(2026,9,25,12).getTime(),seed=100;
class Clock extends RealDate {constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}}
var clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
function client(store,legacy,quota){
  store=store||new Map();var listeners={},fail=false,peak=0,rejected=[];
  function bytes(){return Array.from(store).reduce((n,p)=>n+2*(p[0].length+p[1].length),0);}
  function CE(type,options){this.type=type;this.detail=options&&options.detail;}
  var w={YDS:{Depo:{oku:(k,d)=>store.has(k)?JSON.parse(store.get(k)):d,
    yaz:(k,v)=>{if(fail&&k==='yds-esitleme-yerel-v3')return false;var raw=JSON.stringify(v),size=bytes()+2*(k.length+raw.length)-(store.has(k)?2*(k.length+store.get(k).length):0);
      if(quota&&size>quota){rejected.push({key:k,bytes:size});return false;}peak=Math.max(peak,size);store.set(k,raw);return true;},
    sil:k=>{store.delete(k);return true;}}},crypto:{getRandomValues:a=>{a[0]=++seed;a[1]=++seed;return a;}},
    localStorage:{getItem:k=>store.has(k)?store.get(k):null},CustomEvent:CE,
    addEventListener:(k,f)=>{(listeners[k]||(listeners[k]=[])).push(f);},
    dispatchEvent:e=>(listeners[e.type]||[]).forEach(f=>f(e))};
  var c=vm.createContext(api({window:w,CustomEvent:CE,Date:Clock,console,Uint32Array}));
  ['esitleme-veri.js','esitleme-depo.js','ilerleme.js'].forEach(f=>{
    var source=legacy&&legacy[f]||fs.readFileSync(path.join(root,'assets/js',f),'utf8');vm.runInContext(source,c,{filename:f});
  });
  return {w,context:c,store,Il:w.YDS.Ilerleme,D:w.YDS.Depo,M:w.YDS.EsitlemeMotoru,E:w.YDS.EsitlemeDepo,
    fail:v=>{fail=v;},bytes,rejected,peak:()=>peak,snapshot:()=>clone(w.YDS.Ilerleme.kartGecmisi())};
}
function settings(c){
  var els={};function el(){return {textContent:'',className:'',innerHTML:'',hidden:false,value:'',files:null,children:[],events:{},addEventListener(k,f){this.events[k]=f;},appendChild(){},remove(){},click(){},focus(){}};}
  var document={body:el(),getElementById:id=>els[id]||(els[id]=el()),createElement:el};
  c.w.document=document;c.w.YDS.kacar=String;c.w.YDS.geriAlKutusu=function(){};
  c.w.confirm=()=>true;c.w.prompt=()=>'';c.context.document=document;c.context.Blob=Blob;
  c.context.URL={createObjectURL:()=>'',revokeObjectURL(){}};c.context.setTimeout=function(){};
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js/ayarlar.js'),'utf8'),c.context,{filename:'ayarlar.js'});
  return {els,validate(p){c.context.testBackup=JSON.stringify({tur:'yds-ilerleme-yedegi',sema:1,olusturuldu:new Date().toISOString(),uygulamaSurumu:'test',veri:p});
    return vm.runInContext('window.YDS.AyarlarGuvenlik.yedegiDogrula(JSON.parse(testBackup))',c.context);}};
}
var a=client();a.Il.dogru('establish','kelime');now+=86400000;
assert.strictEqual(a.Il.ipucuyla('establish','kelime'),1,'hint preserves box');
var h=a.snapshot();assert.strictEqual(h.events[1].result,'bildim');
assert.strictEqual(h.events[1].previousAt,h.events[0].at);assert.strictEqual(h.cards[0].known,2);
var day=String(a.Il.bugun()),daily=clone(a.Il.gunlukKayitlar()[day]);
assert.strictEqual(daily.b,1);assert.strictEqual(daily.n,1);assert.strictEqual(daily.d,1);
assert.strictEqual(a.D.oku('yds-gunluk-sonuc',{})[day].b,1);
now+=86400000;a.Il.dogru('establish','kelime','oyun');now+=86400000;a.Il.yanlis('establish','kelime');
h=a.snapshot();assert.strictEqual(h.cards[0].drops,1);assert.strictEqual(h.events[2].source,'oyun');
assert.strictEqual(h.events[3].from,2);assert.strictEqual(h.events[3].to,1);
a.Il.sifirlaKelime('establish','kelime');now+=86400000;a.Il.dogru('establish','kelime');
h=a.snapshot();assert.strictEqual(h.events[h.events.length-2].result,'sifirla');assert.strictEqual(h.events.at(-1).previousAt,null);
a.Il.zatenBiliyorum('establish','kelime');assert.strictEqual(a.Il.kutu('establish','kelime'),5);
assert.strictEqual(a.Il.vadesiGeldiMi('establish','kelime'),false);
var inclusiveDay=String(a.Il.bugun()),inclusive=a.Il.gunlukKayitlar()[inclusiveDay];
assert.strictEqual(inclusive.t,2);assert.strictEqual(inclusive.n,2);assert.strictEqual(inclusive.b,2);
assert.strictEqual(inclusive.z,1,'already-known remains available as a detail');
var inclusiveStorage=JSON.stringify(a.E.paket());
for(var read=0;read<3;read++)assert.strictEqual(a.Il.gunlukKayitlar()[inclusiveDay].b,2);
assert.strictEqual(JSON.stringify(a.E.paket()),inclusiveStorage,'inclusive counts are read-only and never written back');
var legacyKnown=client(),legacyDay=String(legacyKnown.Il.bugun());
legacyKnown.D.yaz('yds-gunluk-kayit',{[legacyDay]:{t:10,d:4,y:0,m:3,z:3}});
var legacyCounts=legacyKnown.Il.gunlukKayitlar()[legacyDay];
assert.strictEqual(legacyCounts.t,13);assert.strictEqual(legacyCounts.n,3);assert.strictEqual(legacyCounts.b,3);
assert.strictEqual(legacyCounts.t-legacyCounts.n,10,'older ambiguous answers stay outside assessed success');
legacyKnown.Il.dogru('new-answer','kelime');
assert.strictEqual(legacyKnown.Il.gunlukKayitlar()[legacyDay].b,4,'a new answer does not recount legacy already-known choices');
var savedKnown=clone(legacyKnown.E.paket()),importedKnown=client();
assert.deepStrictEqual(clone(settings(legacyKnown).validate(savedKnown)),savedKnown,'backup retains raw counts');
importedKnown.D.paketYaz(savedKnown);
assert.deepStrictEqual(clone(importedKnown.Il.gunlukKayitlar()),clone(legacyKnown.Il.gunlukKayitlar()),'backup roundtrip counts already-known exactly once');
var alreadyKnownAt=now;
now+=86400000;a.Il.testDogru('establish','kelime');assert.strictEqual(a.snapshot().events.at(-1).previousAt,alreadyKnownAt,
  'already-known is a real successful observation for the following answer');
assert.strictEqual(a.Il.kutu('establish','kelime'),5,'daily correct never promotes/demotes');
var totalBefore=JSON.stringify(a.Il.gunlukKayitlar());a.Il.testDogru('onlytest','kelime');var first=now;
now+=3*86400000;a.Il.testDogru('onlytest','kelime');
assert.strictEqual(a.snapshot().events.filter(e=>e.card==='onlytest').at(-1).previousAt,first);
assert.strictEqual(a.Il.kutu('onlytest','kelime'),0);assert.strictEqual(JSON.stringify(a.Il.gunlukKayitlar()),totalBefore);
a.Il.sifirlaKelime('onlytest','kelime');now+=86400000;a.Il.testDogru('onlytest','kelime');
assert.strictEqual(a.snapshot().events.filter(e=>e.card==='onlytest').at(-1).previousAt,null,'manual reset also cuts daily-test-only history');
a.Il.testYanlis('establish','kelime');assert.strictEqual(a.Il.kutu('establish','kelime'),4);
assert.strictEqual(a.snapshot().events.at(-1).source,'gunun-testi');
// A legacy answer on a later calendar day invalidates the claimed previous time.
now+=86400000;a.D.kayitlariYaz('yds-leitner',{establish:{k:4,g:a.Il.bugun()+7,c:a.Il.bugun()}});
now+=86400000;a.Il.dogru('establish','kelime');assert.strictEqual(a.snapshot().events.at(-1).previousAt,null);
// One failed envelope write leaves every part of the answer unchanged.
var before=JSON.stringify(a.E.paket());a.fail(true);assert.strictEqual(a.Il.yanlis('neverwritten','kelime'),false);a.fail(false);
assert.strictEqual(JSON.stringify(a.E.paket()),before);
// Same-shard concurrent tab edits are patches; neither record is deleted.
var shared=new Map(),one=client(shared),two=client(shared),original=one.D.paketKayitlariYaz,hook=true;
assert.strictEqual(one.M.kartGecmisiAlani('kelime:alpha'),one.M.kartGecmisiAlani('kelime:beta28'));
one.D.paketKayitlariYaz=function(...args){if(hook){hook=false;two.Il.dogru('beta28','kelime');}return original(...args);};
one.Il.dogru('alpha','kelime');assert.ok(one.D.oku('yds-leitner',{}).beta28);
assert.deepStrictEqual(one.snapshot().cards.map(c=>c.card).sort(),['alpha','beta28']);
assert.strictEqual(one.Il.gunlukKayitlar()[String(one.Il.bugun())].n,2);
assert.strictEqual(one.Il.gunlukKayitlar()[String(one.Il.bugun())].b,2);
assert.strictEqual(one.Il.gunlukKayitlar()[String(one.Il.bugun())].t,2,'new counts are a proven lower bound on legacy activity');
// Per-page actors preserve concurrent answers to the same card.
var c1=client(),c2=client();c1.Il.dogru('same','kelime');c2.Il.yanlis('same','kelime');
var merged=c1.M.birlestir(c1.E.zarf(),c2.E.zarf());c1.E.uygula(merged,'bulut');
var counts=c1.snapshot().cards[0];assert.strictEqual(counts.known,1);assert.strictEqual(counts.unknown,1);assert.strictEqual(counts.total,2);
assert.strictEqual(c1.M.kararliJson(c1.M.birlestir(merged,merged)),c1.M.kararliJson(merged));
// Offline updates from an old reset epoch never resurrect old cumulative counts.
var reset=client(),offline=client();reset.Il.dogru('resetword','kelime');offline.E.uygula(reset.E.zarf(),'bulut');
assert.strictEqual(reset.Il.hepsiniSifirla(),true);now+=86400000;offline.Il.dogru('resetword','kelime');
reset.E.uygula(offline.E.zarf(),'bulut');assert.strictEqual(reset.snapshot().cards.length,0);
assert.strictEqual(Object.keys(reset.D.oku('yds-gunluk-sonuc',{})).length,0);
assert.strictEqual(reset.Il.yedegiGeriAl(),true);assert.strictEqual(reset.snapshot().cards[0].known,1,'explicit undo restores backed up history');
assert.strictEqual(Object.values(reset.D.oku('yds-gunluk-sonuc',{}))[0].b,1);
var resumed=client();resumed.Il.dogru('resumed','kelime');resumed.Il.hepsiniSifirla();
resumed.Il.dogru('resumed','kelime');resumed.Il.yedegiGeriAl();
assert.strictEqual(resumed.snapshot().cards[0].total,2,'reset epochs use distinct writer components even without a reload');
assert.strictEqual(resumed.Il.gunlukKayitlar()[String(resumed.Il.bugun())].n,2);
assert.strictEqual(resumed.Il.gunlukKayitlar()[String(resumed.Il.bugun())].b,2);
var racingStore=new Map(),racing=client(racingStore),resetter=client(racingStore);
racing.Il.dogru('race','kelime');var originalPatch=racing.D.paketKayitlariYaz;
racing.D.paketKayitlariYaz=function(...args){resetter.Il.hepsiniSifirla();return originalPatch(...args);};
assert.strictEqual(racing.Il.dogru('race','kelime'),false,'reset between preparation and commit rejects the entire answer');
assert.strictEqual(racing.snapshot().cards.length,0);assert.deepStrictEqual(clone(racing.D.oku('yds-leitner',{})),{});
// Bounded detail never truncates cumulative counts, including beyond 64 actors.
var cap=client();for(var i=0;i<25;i++){now+=1000;cap.Il.dogru('many','kelime');}
assert.strictEqual(cap.snapshot().cards[0].total,25);assert.strictEqual(cap.snapshot().events.length,20);assert.strictEqual(cap.snapshot().truncated,true);
var shard=cap.M.kartGecmisiAlani('kelime:many'),record=cap.D.oku(shard,{})['kelime:many'];
var invalid=clone(record);invalid.u[0]='z'.repeat(400)+'-testactor1';assert.strictEqual(cap.M.kartGecmisiKaydiGecerli(invalid),false);
// Reused-actor imports still produce a valid, conservative merged record.
var forkA=clone(record),forkB=clone(record);forkA.p={actor:[1,0,0,0,1]};forkB.p={actor:[0,1,0,1,1]};
assert.strictEqual(cap.M.kartGecmisiKaydiGecerli(cap.M.kartGecmisiKaydiBirlestir(forkA,forkB)),true);
var validator=settings(cap),roundtrip=validator.validate(cap.E.paket());assert.ok(roundtrip[shard]);
var badShard=clone(cap.E.paket()),other=cap.M.KART_GECMISI_ALANLARI.find(k=>k!==shard);badShard[other]=clone(badShard[shard]);
assert.throws(()=>validator.validate(badShard),/kimli/,'backup cannot duplicate a card in another shard');
var clockBack=client();clockBack.Il.dogru('clock','kelime');now-=86400000;clockBack.Il.dogru('clock','kelime');
assert.strictEqual(clockBack.snapshot().cards[0].total,2,'wall-clock rollback does not discard a successful answer');
assert.strictEqual(clockBack.snapshot().events[0].previousAt,null);
var rollbackAt=now;now+=2*86400000;clockBack.Il.dogru('clock','kelime');
assert.strictEqual(clockBack.snapshot().events.at(-1).previousAt,rollbackAt,'previous observation follows write order');
console.log('Kart history: hints, actual intervals, reset epochs, atomic failure, concurrent patches, totals and limits PASS');
module.exports={client,clone,settings,advance:n=>{now+=n;}};
