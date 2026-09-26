'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'), source=f=>fs.readFileSync(path.join(root,f),'utf8');
const release=JSON.parse(source('release-manifest.json'));
for(const file of ['assets/css/istatistik.css','assets/js/istatistik-hesap.js','assets/js/istatistik.js']) {
  assert.ok(release.temel.includes(release.kok+file),'İstatistik çevrimdışı önbelleğinde eksik: '+file);
  assert.ok(source('istatistik.html').includes(release.kok+file),'İstatistik güncel yayın dosyasına bağlanmalı: '+file);
}
const window={YDS:{}}, context=vm.createContext({window,Date,console});
vm.runInContext(source('assets/js/istatistik-hesap.js'),context);
const H=window.YDS.IstatistikHesap, now=Date.UTC(2026,8,8)/86400000;
const row=(t,z=0)=>({t,y:0,d:t,m:0,z});
const traces=Object.fromEntries(Array.from({length:500},(_,i)=>['old'+i,{c:now-1}]));
let m=H.create({[now]:row(10,100)},traces,now),p=H.period(m,7);
assert.equal(p.speed,10,'Ayıklama ve eski izler hızı şişiremez');
assert.equal(p.total.t,10);assert.equal(p.total.z,100);assert.equal(p.observed,1);
assert.equal(p.delta,null);assert.equal(p.accuracy,100);assert.equal(H.streak(m).current,1);
assert.equal(m.traces[now-1],500);assert.equal(H.sum(m,now-7,now-1).t,0);
assert.equal(H.average(m,now-1,7),null);
m=H.create({},traces,now);p=H.period(m,30);
assert.equal(p.speed,null);assert.equal(p.observed,0);assert.equal(p.active,0);assert.equal(p.delta,null);
assert.equal(H.streak(m).longest,0,'Son çalışma izinden kesin seri çıkarılamaz');
const data={};for(let i=0;i<14;i++)data[now-i]=row(i<7?20:10);
m=H.create(data,{},now);p=H.period(m,7);
assert.equal(p.speed,20);assert.equal(p.delta,10);assert.equal(p.percent,100);
assert.equal(p.active,7);assert.equal(p.activeSpeed,20);assert.equal(H.streak(m).current,14);
assert.equal(H.average(m,now-6,7),80/7,'Grafiğin ilk günü görünümden önceki altı günü de kullanır');
assert.equal(H.average(m,now,7),20);
m=H.create({[now-13]:row(0),[now]:row(7)}, {},now);p=H.period(m,7);
assert.equal(p.speed,1);assert.equal(p.delta,1);assert.equal(p.percent,null,'Sıfır tabandan sonsuz yüzde yok');
m=H.create({[now]:{t:2,d:3,y:8,z:4,m:3}}, {},now);p=H.period(m,7);
assert.equal(p.accuracy,null);assert.equal(p.inconsistent,true,'Tutarsız veri sahte bir orana dönüşmez');
m=H.create({oops:row(50),[now+1]:row(500),'-1':row(10),[now]:row(4),[now-1]:null}, {},now);
assert.equal(Object.keys(m.days).length,1);assert.equal(H.period(m,7).speed,4);
const weekly={};for(let i=0;i<9;i++)weekly[now-i]=row(10);
m=H.create(weekly,{},now);const weeks=H.weeks(m);
assert.equal(H.weekday(now),1);assert.equal(weeks.elapsed,2);assert.equal(weeks.current,20);
assert.equal(weeks.previous,20,'Salı günü önceki tam haftanın 70 yanıtıyla kıyaslanamaz');
assert.equal(weeks.comparable,true);assert.equal(weeks.items.length,12);
assert.equal(H.weeks(H.create({[now]:row(10)}, {},now)).comparable,false);
assert.equal(H.plan(10,3),4);assert.equal(H.plan(0,10),0);
for(const pace of [0,-1,1.2,1001,NaN,Infinity])assert.equal(H.plan(10,pace),null);
const legacy={};for(let i=1;i<=4;i++)legacy[now-i]=row(10);
assert.equal(H.streak(H.create(legacy,{},now)).current,4,'Bugün boşken dünkü seri korunur');
assert.equal(H.period(H.create({[now-1]:row(10)}, {},now),7).speed,5,'Kayıt başlangıcından sonraki boş gün paydaya dahil');

// Actual controller runs against a minimal DOM, without reading/writing real user storage.
const elements=new Map(), handlers={}, timeouts=new Map();let timer=0,today=now,log={},cards={},writes=0,usageData=null,learningReads=0,selection=null;
const usageRanges=[];
function element(id){if(!elements.has(id)){
  const el={hidden:false,attrs:{},events:{},mutations:{innerHTML:0,textContent:0,value:0},
  setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},addEventListener(k,fn){this.events[k]=fn;},
  contains(node){while(node){if(node===this)return true;node=node.parentNode;}return false;},
  classList:{toggle(){}},querySelectorAll(){return buttons;}};
  for(const key of ['innerHTML','textContent','value']){let value='';Object.defineProperty(el,key,{get(){return value;},set(next){value=next;this.mutations[key]++;}});}
  elements.set(id,el);
}return elements.get(id);}
const buttons=[7,30,90].map(g=>{const e=element('button'+g);e.attrs['data-gun']=String(g);return e;});
window.YDS.Depo={oku(){return [2,2,'2','bad'];},yaz(){writes++;throw Error('Statistics must not write');}};
window.YDS.Veri={dizin:[{e:'alpha',k:2},{e:'beta',k:2},{e:'outside',k:1}]};
window.YDS.Ilerleme={bugun:()=>today,gunlukKayitlar(){learningReads++;return log;},tumKayitlar:()=>cards,kutu:e=>e==='alpha'?5:0,gunlukHedef:()=>10};
window.YDS.Kullanim={oku:()=>usageData,sifirla(){throw Error('Statistics must not reset usage');}};
window.YDS.KullanimHesap={rapor(snapshot,range){usageRanges.push(range);return snapshot?snapshot[range]:{startedDay:null,pages:[],features:[],emptyPages:[],emptyFeatures:[],seconds:0,partial:false};}};
window.YDS.kacar=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.addEventListener=(k,fn)=>{handlers[k]=fn;};window.setTimeout=fn=>{timeouts.set(++timer,fn);return timer;};
window.clearTimeout=id=>timeouts.delete(id);window.setInterval=()=>0;
window.getSelection=()=>selection;
context.document={getElementById:element,hidden:false,activeElement:null,addEventListener:(k,fn)=>{handlers[k]=fn;}};
vm.runInContext(source('assets/js/istatistik.js'),context);
const flush=()=>{for(const fn of timeouts.values())fn();timeouts.clear();};
assert.equal(element('bosDurum').hidden,false);assert.equal(element('hizDeger').textContent,'—');
assert.match(element('kullanimOzet').textContent,/henüz başlamadı/);
assert.equal(element('kullanimBos').hidden,false);
assert.match(element('kullanimBosSayfalar').textContent,/henüz ölçüm yok/);
assert.match(element('tahminMetin').textContent,/1 kelimeye/,'Yinelenen seçili katman havuzu şişirmez');
log={[now]:row(10,100)};handlers['yds-depo-degisti']({detail:{anahtarlar:['yds-gunluk-kayit']}});flush();
assert.equal(element('hizDeger').textContent,'10,0');assert.equal(element('bosDurum').hidden,true);
assert.match(element('gunDetay').innerHTML,/100 ayıklama/);
element('aralik').events.click.call(element('aralik'),{target:{closest:()=>buttons[0]}});
assert.equal(buttons[0].attrs['aria-pressed'],'true');assert.equal(buttons[1].attrs['aria-pressed'],'false');
assert.equal((element('gunlukTablo').innerHTML.match(/<tr>/g)||[]).length,7);
assert.match(element('hizKiyas').textContent,/Önceki 7 gün/);
element('planHiz').value='0';element('planHiz').events.input();assert.equal(element('planHiz').attrs['aria-invalid'],'true');
element('planHiz').value='3';element('planHiz').events.input();assert.equal(element('planHiz').attrs['aria-invalid'],'false');
log={};cards={};handlers['yds-depo-degisti']({detail:{anahtarlar:['yds-leitner','yds-gunluk-kayit']}});flush();
assert.equal(element('bosDurum').hidden,false);assert.equal(element('hizDeger').textContent,'—');
today++;handlers.focus();flush();assert.equal(element('gunSec').max,'2026-09-09');assert.equal(writes,0);
usageData=Object.fromEntries([7,30,90].map(range=>[range,{
  startedDay:now-200,observedDays:2,seconds:range*60,partial:false,
  pages:[{id:'kel',label:'Kelimeler',visits:range,seconds:range*60,days:2,lastDay:now},{id:'ara',label:'<img src=x>',visits:0,seconds:0,days:0,lastDay:now-190}],
  features:[{id:'kart',label:'Kart çalışması',count:range*2,days:2,lastDay:now},{id:'ses',label:'Ses',count:0,days:0,lastDay:null}],
  emptyPages:['ara'],emptyFeatures:['ses']
}]));
const usageBefore=JSON.stringify(usageData);
handlers['yds:kullanim-degisti']();flush();
assert.equal(element('kullanimBos').hidden,true);
assert.match(element('kullanimOzet').textContent,/Son 7 günde 7,0 dakika/,'Mevcut dönem kullanım bölümünü de yönetir');
assert.match(element('kullanimSayfalar').innerHTML,/data-page="kel"/);
assert.match(element('kullanimSayfalar').innerHTML,/&lt;img src=x&gt;/,'Katalog etiketi HTML olarak işlenmez');
assert.match(element('kullanimOzellikler').innerHTML,/<td>14<\/td>/);
assert.match(element('kullanimBosSayfalar').textContent,/Bu dönemde kullanım kaydı olmayan/);
assert.match(element('kullanimKapsam').textContent,/son kullanım ise eldeki tüm geçmişe/);
assert.match(element('kullanimPaylar').innerHTML,/100,0%/);
for(const index of [2,1]){
  element('aralik').events.click.call(element('aralik'),{target:{closest:()=>buttons[index]}});
  assert.equal(usageRanges.at(-1),Number(buttons[index].attrs['data-gun']));
  assert.match(element('kullanimOzet').textContent,new RegExp('Son '+buttons[index].attrs['data-gun']+' günde'));
}
assert.equal(JSON.stringify(usageData),usageBefore,'Görünüm kullanım anlığını değiştirmez');

// Collector checkpoints update only usage, leaving a partially entered date and live learning UI intact.
const learningIds=['gunlukGrafik','isiGrafik','haftalikGrafik','ritimOzet','gunDetay','tahminMetin'];
const mutations=ids=>Object.fromEntries(ids.map(id=>[id,{...element(id).mutations}]));
const learningBefore=mutations(learningIds),readsBefore=learningReads;
element('gunSec').value='2026-09-';context.document.activeElement=element('gunSec');
const dateWrites=element('gunSec').mutations.value;
usageData[30].seconds+=60;usageData[30].pages[0].seconds+=60;
handlers['yds:kullanim-degisti']();handlers['yds:kullanim-degisti']();flush();
assert.equal(learningReads,readsBefore,'Kullanım kaydı öğrenme modelini yeniden okumaz');
assert.deepEqual(mutations(learningIds),learningBefore,'Grafikler ve aria-live öğrenme özetleri yeniden çizilmez');
assert.equal(element('gunSec').value,'2026-09-','Yazılmakta olan tarih kullanım kaydında sıfırlanmaz');
assert.equal(element('gunSec').mutations.value,dateWrites,'Tarih inputuna aynı değer bile tekrar yazılmaz');
assert.equal(context.document.activeElement,element('gunSec'),'Tarih alanındaki odak korunur');
assert.match(element('kullanimOzet').textContent,/31,0 dakika/);
const usageIds=['kullanimOzet','kullanimKapsam','kullanimPaylar','kullanimSayfalar','kullanimOzellikler','kullanimBosSayfalar','kullanimBosOzellikler'];
const unchanged=mutations(usageIds);
handlers['yds:kullanim-degisti']();flush();
assert.deepEqual(mutations(usageIds),unchanged,'Aynı kullanım verisi metin veya tablo düğümlerini tekrar yazmaz');

// A changing report waits until a text selection or focused report descendant is released.
selection={isCollapsed:false,rangeCount:1,getRangeAt(){return {intersectsNode:node=>node===element('kullanim')};}};
usageData[30].seconds+=60;usageData[30].pages[0].seconds+=60;
handlers['yds:kullanim-degisti']();flush();
assert.deepEqual(mutations(usageIds),unchanged,'Kullanım içindeki seçili metin yenilemeyle kaldırılmaz');
selection=null;handlers.selectionchange();flush();
assert.match(element('kullanimOzet').textContent,/32,0 dakika/,'Seçim bırakıldığında bekleyen kullanım verisi gösterilir');
const focused=element('usageFocusedChild');focused.parentNode=element('kullanimSayfalar');
context.document.activeElement=focused;
const focusedBefore=mutations(usageIds);
usageData[30].seconds+=60;usageData[30].pages[0].seconds+=60;
handlers['yds:kullanim-degisti']();flush();
assert.deepEqual(mutations(usageIds),focusedBefore,'Odaktaki kullanım alt öğesi DOM değiştirilerek kaldırılmaz');
assert.equal(context.document.activeElement,focused);
context.document.activeElement=null;handlers.focusout();flush();
assert.match(element('kullanimOzet').textContent,/33,0 dakika/,'Odak ayrılınca bekleyen kullanım güncellemesi uygulanır');
log={[today]:row(11)};handlers['yds-depo-degisti']({detail:{anahtarlar:['yds-gunluk-kayit']}});flush();
assert.ok(learningReads>readsBefore,'Gerçek ilerleme olayı öğrenme görünümünü yenilemeye devam eder');
assert.ok(element('gunlukGrafik').mutations.innerHTML>learningBefore.gunlukGrafik.innerHTML);
assert.equal(element('hizDeger').textContent,'11,0');
usageData[30].partial=true;handlers['yds:kullanim-degisti']();flush();
assert.match(element('kullanimKapsam').textContent,/toplamlar eksik olabilir/);
usageData[30].partial=false;usageData[30].capacityLimited=true;usageData[30].retainedFromDay=now-10;
handlers['yds:kullanim-degisti']();flush();
assert.match(element('kullanimKapsam').textContent,/Depolama sınırı nedeniyle 29 Ağustos 2026 tarihinden önceki günlük ayrıntılar kaldırıldı/);
assert.doesNotMatch(element('kullanimKapsam').textContent,/kaydedilemedi veya okunamadı/,'Kapasite budaması kayıt hatası gibi anlatılmaz');
usageData[30].partial=true;handlers['yds:kullanim-degisti']();flush();
assert.match(element('kullanimKapsam').textContent,/Depolama sınırı/);
assert.match(element('kullanimKapsam').textContent,/kaydedilemedi veya okunamadı/,'Kapasite ve yazma hatası aynı anda varsa ikisi de açıklanır');
usageData[30].partial=false;usageData[30].capacityLimited=false;
handlers['yds:kullanim-degisti']();flush();
assert.doesNotMatch(element('kullanimKapsam').textContent,/Depolama sınırı|kaydedilemedi veya okunamadı/,'Dönem etkilenmiyorsa veya hata düzelmişse eski uyarı kaldırılır');
usageData=null;handlers['yds:kullanim-degisti']();flush();
assert.equal(element('kullanimBos').hidden,false);assert.equal(element('kullanimSayfalar').innerHTML,'');
assert.equal(element('kullanimPaylar').innerHTML,'');assert.equal(writes,0);
console.log('İstatistik: öğrenme hesapları, ayrı kullanım yenilemesi, tarih/odak/seçim koruması, salt okunur kontroller ve eksik ölçüm geçti.');
