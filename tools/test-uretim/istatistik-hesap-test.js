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
const elements=new Map(), handlers={}, timeouts=new Map();let timer=0,today=now,log={},cards={},writes=0;
function element(id){if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,attrs:{},events:{},
  setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},addEventListener(k,fn){this.events[k]=fn;},
  classList:{toggle(){}},querySelectorAll(){return buttons;}});return elements.get(id);}
const buttons=[7,30,90].map(g=>{const e=element('button'+g);e.attrs['data-gun']=String(g);return e;});
window.YDS.Depo={oku(){return [2,2,'2','bad'];},yaz(){writes++;throw Error('Statistics must not write');}};
window.YDS.Veri={dizin:[{e:'alpha',k:2},{e:'beta',k:2},{e:'outside',k:1}]};
window.YDS.Ilerleme={bugun:()=>today,gunlukKayitlar:()=>log,tumKayitlar:()=>cards,kutu:e=>e==='alpha'?5:0,gunlukHedef:()=>10};
window.YDS.kacar=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.addEventListener=(k,fn)=>{handlers[k]=fn;};window.setTimeout=fn=>{timeouts.set(++timer,fn);return timer;};
window.clearTimeout=id=>timeouts.delete(id);window.setInterval=()=>0;
context.document={getElementById:element,hidden:false,addEventListener:(k,fn)=>{handlers[k]=fn;}};
vm.runInContext(source('assets/js/istatistik.js'),context);
const flush=()=>{for(const fn of timeouts.values())fn();timeouts.clear();};
assert.equal(element('bosDurum').hidden,false);assert.equal(element('hizDeger').textContent,'—');
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
console.log('İstatistik: doğru payda, ayıklama ayrımı, eksik geçmiş, eşit dönem, haftalık kıyas, plan, boş/dolu/silinen veri ve olayla yenileme geçti.');
