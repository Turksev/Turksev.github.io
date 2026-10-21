'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {build}=require('../kalip-calisma-uret');
const H=require('../../assets/js/kalip-calisma-hesap');
const {bank,text,stats}=build();
assert.equal(fs.readFileSync(path.resolve(__dirname,'../../data/kalip-calisma.js'),'utf8'),text);
const map=Object.fromEntries(bank.sorular.map(s=>[s.id,s]));
for(const mode of ['anlam','edat','yapi']) {
  const pool=H.sec(bank,{tur:mode,kapsam:'hepsi',ara:''},{});
  assert.ok(pool.length>0);assert.ok(pool.every(s=>s.tur===mode));
  const t=H.kur(bank,pool,pool.length,'fixture',()=>0.25);
  assert.equal(new Set(t.ids).size,pool.length);assert.ok(H.gecerli(t,bank,'fixture'));
  for(const id of t.ids){
    const s=map[id]; assert.equal(H.cevapla(t,s,99),false);
    assert.equal(H.cevapla(t,s,s.cevap),true);assert.equal(H.cevapla(t,s,s.cevap),false,'çift tıklama tek cevap');
    assert.ok(H.gecerli(t,bank,'fixture'));t.sira++;
  }
  assert.equal(H.ozet(t,map).dogru,pool.length);assert.ok(H.gecerli(t,bank,'fixture'));
  assert.equal(H.gecerli(t,bank,'reset'),false); assert.equal(H.gecerli({...t,bank:'eski'},bank,'fixture'),false);
}
const first=bank.sorular[0],second=bank.sorular[1];
const t=H.kur(bank,[first],10,'fixture',()=>0);
H.cevapla(t,first,-1);assert.deepEqual(H.ozet(t,map).yanlis,[first.id]);
assert.deepEqual(H.sec(bank,{tur:'karma',kapsam:'tekrar',ara:''},{[first.id]:{sonuc:'yanlis'},[second.id]:{sonuc:'dogru'}}).map(s=>s.id),[first.id]);
assert.ok(H.sec(bank,{tur:'karma',kapsam:'hepsi',ara:first.kelime.toUpperCase()},{}).every(s=>s.kelime.includes(first.kelime)));
for(const bad of [{}, {...t,sira:-1}, {...t,ids:[first.id,first.id]}, {...t,cevaplar:[100]}, {...t,duzenler:[[0,0]]}]) assert.equal(H.gecerli(bad,bank,'fixture'),false);

const storage=new Map([['yds-leitner',JSON.stringify({word:{k:3}})]]);
function tab(session=new Map()){
  const listeners={},control={fail:false};
  const local={get length(){return storage.size;},key:i=>[...storage.keys()][i],getItem:k=>storage.has(k)?storage.get(k):null,
    setItem:(k,v)=>{if(control.fail)throw Error('quota');storage.set(k,String(v));},removeItem:k=>{if(control.fail)throw Error('quota');storage.delete(k);}};
  const D={oku:(k,f)=>{try{return storage.has(k)?JSON.parse(storage.get(k)):f;}catch{return f;}},yaz:(k,v)=>{try{local.setItem(k,JSON.stringify(v));return true;}catch{return false;}},sil:k=>{try{local.removeItem(k);return true;}catch{return false;}}};
  const window={YDS:{Depo:D},addEventListener:(n,fn)=>{(listeners[n]||(listeners[n]=[])).push(fn);},dispatchEvent:e=>(listeners[e.type]||[]).forEach(fn=>fn(e))};
  const c=vm.createContext({window,localStorage:local,sessionStorage:{getItem:k=>session.get(k)||null,setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)},CustomEvent:class{constructor(type){this.type=type;}}});
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../assets/js/kalip-calisma-kayit.js'),'utf8'),c);
  return {K:window.YDS.KalipCalismaKayit,control,session};
}
const a=tab(),b=tab();a.K.yaz(first,false);b.K.yaz(second,true);
assert.equal(a.K.oku(bank)[second.id].sonuc,'dogru');assert.equal(b.K.oku(bank)[first.id].sonuc,'yanlis');
a.control.fail=true;assert.equal(a.K.yaz(first,true),false);assert.equal(a.K.oku(bank)[first.id].sonuc,'dogru');assert.equal(b.K.oku(bank)[first.id].sonuc,'yanlis');
a.control.fail=false;assert.equal(a.K.tekrarYaz(),true);assert.equal(b.K.oku(bank)[first.id].sonuc,'dogru');
// Bekleyen eski cevap, aynı soruya diğer sekmede verilen yeni cevabı ezmez.
for (const baseline of [false,true]) {
  b.K.yaz(first,baseline); a.control.fail=true; a.K.yaz(first,false); b.K.yaz(first,true);
  assert.equal(a.K.oku(bank)[first.id].sonuc,'dogru','diskteki yeni cevap eski bekleyenin önündedir');
  a.control.fail=false; assert.equal(a.K.tekrarYaz(),true); assert.equal(b.K.oku(bank)[first.id].sonuc,'dogru');
  a.control.fail=true; a.K.yaz(first,false); b.K.yaz(first,true); a.control.fail=false;
  a.K.tekrarYaz(); assert.equal(b.K.oku(bank)[first.id].sonuc,'dogru','oku çağrılmadan da yeni cevap korunur');
}
a.control.fail=true;a.K.yaz(first,false);const oldEpoch=a.K.epoch();assert.equal(b.K.sifirla(),true);
a.control.fail=false;assert.notEqual(a.K.epoch(),oldEpoch);assert.equal(a.K.tekrarYaz(),true);assert.equal(Object.keys(a.K.oku(bank)).length,0,'eski sekme sıfırlanan kayıtları geri getirmez');
assert.equal(storage.get('yds-leitner'),JSON.stringify({word:{k:3}}),'kelime kutuları değişmez');
// Yarım turdan bağımsız bekleyen kuyruk yenilemede kurtulur; eski sonuç dirilmez.
const c=tab(); c.control.fail=true; c.K.yaz(first,false);
const d=tab(c.session); assert.equal(d.K.geriYukle(bank),true); assert.equal(d.K.oku(bank)[first.id].sonuc,'yanlis');
c.K.yaz(first,false); b.K.yaz(first,true);
const e=tab(c.session); e.K.geriYukle(bank); assert.equal(e.K.oku(bank)[first.id].sonuc,'dogru');
c.K.yaz(first,false); b.K.sifirla();
const f=tab(c.session); f.K.geriYukle(bank); assert.equal(Object.keys(f.K.oku(bank)).length,0);
console.log('Kalıp çalışması: '+JSON.stringify(stats)+'; cevap, filtre, devam, çift yanıt, iki sekme, kayıt hatası ve sıfırlama korumaları geçti.');
