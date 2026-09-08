'use strict';
// Real legacy day encoder + model + controller, in independent process timezones.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),assert=require('node:assert/strict');
if(!process.argv.includes('--zone-child')){
  for(const zone of ['Europe/Istanbul','UTC','America/New_York','Europe/Berlin','Pacific/Kiritimati','Europe/London']){
    const r=cp.spawnSync(process.execPath,[__filename,'--zone-child'],{env:{...process.env,TZ:zone},encoding:'utf8',windowsHide:true});
    assert.equal(r.status,0,zone+'\n'+r.stdout+r.stderr);console.log('OK local calendar '+zone);
  }
}else{
  const root=path.resolve(__dirname,'../..'),source=f=>fs.readFileSync(path.join(root,f),'utf8'),DAY=86400000,RealDate=Date;
  let clock=new RealDate(2026,8,8,12).getTime(),writes=0;
  class LocalDate extends RealDate{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
  const legacy=d=>Math.floor(new RealDate(d.getFullYear(),d.getMonth(),d.getDate()).getTime()/DAY);
  const localISO=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const todayKey=legacy(new RealDate(clock)),log={};
  for(let i=0;i<40;i++){const d=new RealDate(2026,8,8-i,12);log[legacy(d)]={t:10,d:5,y:1,z:2,m:0};}
  const saved={'yds-gunluk-kayit':log,'yds-leitner':{alpha:{k:3,g:todayKey+3,c:todayKey,m:0}}};
  const original=JSON.stringify(saved),handlers={},timers=new Map(),elements=new Map();let sequence=0;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const Depo={oku:(k,fallback)=>Object.hasOwn(saved,k)?clone(saved[k]):fallback};
  for(const op of ['yaz','sil','paketYaz','kayitlariYaz','anahtarlariSil'])Depo[op]=()=>{writes++;throw Error('Stats changed stored progress');};
  function element(id){
    if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,attrs:{},events:{},scrollLeft:0,scrollWidth:680,clientWidth:300,
      setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},addEventListener(k,fn){this.events[k]=fn;},classList:{toggle(){}},querySelectorAll(){return buttons;}});
    return elements.get(id);
  }
  const buttons=[7,30,90].map(g=>{const e=element('button'+g);e.attrs['data-gun']=String(g);return e;});
  const window={YDS:{Depo,Veri:{dizin:[{e:'alpha',k:2},{e:'beta',k:2}]},kacar:v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))},
    addEventListener:(k,fn)=>{(handlers[k]||(handlers[k]=[])).push(fn);},setTimeout:fn=>{timers.set(++sequence,fn);return sequence;},clearTimeout:id=>timers.delete(id),setInterval:()=>0};
  const context=vm.createContext({window,Date:LocalDate,console,document:{getElementById:element,hidden:false,addEventListener(){}}});
  vm.runInContext(source('assets/js/ilerleme.js'),context);
  vm.runInContext(source('assets/js/istatistik-hesap.js'),context);
  const Il=window.YDS.Ilerleme,H=window.YDS.IstatistikHesap;
  assert.equal(Il.bugun(),todayKey,'Legacy persisted key must not change');
  assert.equal(localISO(Il.gunTarihi(todayKey)),'2026-09-08');
  const model=()=>H.create(Il.gunlukKayitlar(),Il.tumKayitlar(),Il.bugun(),{decode:Il.gunTarihi,encode:Il.tarihGunu,today:new LocalDate()});
  let m=model();assert.equal(m.today,Date.UTC(2026,8,8)/DAY);assert.equal(H.weekday(m.today),1);
  assert.equal(H.weeks(m).elapsed,2);assert.equal(H.weeks(m).current,20);assert.equal(H.weeks(m).previous,20);
  assert.equal(H.weeks(m).items.at(-1).start,Date.UTC(2026,8,7)/DAY);
  assert.equal(H.period(m,7).speed,10);assert.equal(m.unresolved,0);
  vm.runInContext(source('assets/js/istatistik.js'),context);
  assert.equal(element('gunSec').max,'2026-09-08');assert.equal(element('gunSec').value,'2026-09-08');
  assert.match(element('donemTarih').textContent,/8 Eyl$/);assert.match(element('gunDetay').innerHTML,/8 Eylül 2026/);
  assert.match(element('haftalikOzet').textContent,/aynı 2 gününde/);
  assert.match(element('isiGrafik').innerHTML,/y="51\.00"[^>]*class="s2 today-cell"/,'Today must be in Tuesday row');
  element('gunSec').value='2026-09-07';element('gunSec').events.change.call(element('gunSec'));
  assert.match(element('gunDetay').innerHTML,/7 Eylül 2026/);assert.match(element('gunDetay').innerHTML,/10 yanıt/);
  const scenarios=[[2026,8,7],[2024,1,29],[2026,11,31],[2027,0,1],[2026,2,8],[2026,2,9],[2026,10,1],[2026,10,2],[2026,2,29],[2026,2,30],[2026,9,25],[2026,9,26]];
  for(const parts of scenarios){
    const d=new RealDate(...parts,12),key=Il.tarihGunu(d),back=Il.gunTarihi(key);
    assert.equal(key,legacy(d));
    if(process.env.TZ==='Europe/London'&&key===20541){assert.equal(back,null);continue;}
    assert.ok(back,'Unique local date expected: '+localISO(d));assert.equal(localISO(back),localISO(d));
  }
  clock=new RealDate(2026,8,9,12).getTime();for(const fn of handlers.focus)fn();for(const fn of timers.values())fn();timers.clear();
  assert.equal(element('gunSec').max,'2026-09-09');
  clock=new RealDate(2026,8,7,12).getTime();m=model();assert.equal(H.weeks(m).elapsed,1);assert.equal(H.weeks(m).current,10);
  if(process.env.TZ==='Europe/London'){
    assert.equal(Il.gunTarihi(20541),null,'Two local dates share an old key');assert.equal(Il.gunTarihi(20751),null,'Skipped DST key has no local date');
    const logs={};for(const [day,t] of [[27,10],[29,999],[31,10]])logs[legacy(new RealDate(2026,2,day,12))]={t,d:0,y:0,z:0,m:0};
    const d=new RealDate(2026,2,31,12);m=H.create(logs,{},Il.tarihGunu(d),{decode:Il.gunTarihi,encode:Il.tarihGunu,today:d});
    assert.equal(m.unresolved,1);assert.equal(H.period(m,7).total.t,20);assert.equal(H.period(m,7).observed,3);
    assert.equal(H.known(m,Date.UTC(2026,2,29)/DAY),false);assert.equal(H.known(m,Date.UTC(2026,2,30)/DAY),false);
    for(const day of [23,24])logs[legacy(new RealDate(2026,2,day,12))]={t:10,d:0,y:0,z:0,m:0};
    m=H.create(logs,{},Il.tarihGunu(d),{decode:Il.gunTarihi,encode:Il.tarihGunu,today:d});
    assert.equal(H.weeks(m).elapsed,2);assert.equal(H.weeks(m).previous,20);assert.equal(H.weeks(m).current,10);
    assert.equal(H.weeks(m).comparable,false,'A partial current week must not be compared with a fully observed previous week');
  }
  assert.equal(writes,0);assert.equal(JSON.stringify(saved),original,'Persisted day keys and progress remain identical');
}
