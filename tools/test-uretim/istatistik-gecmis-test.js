'use strict';
// Salt okunur model: eski günlük sayaçlar ile yeni olayların sınırları ayrı doğrulanır.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),window={YDS:{}},context=vm.createContext({window,Date,console});
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/istatistik-hesap.js'),'utf8'),context);
const H=window.YDS.IstatistikHesap,DAY=86400000,base=Date.UTC(2026,9,20),today=H.calendarDay(new Date(base+5*DAY));
const plain=x=>JSON.parse(JSON.stringify(x));

// d eski ipucusuz doğruyu, n/b yalnız yeni kuralın tam sınıflandırılmış cevaplarını tutar.
let m=H.create({[today]:{t:10,d:7,y:0,m:0,z:0}}, {},today),p=H.period(m,7);
assert.equal(p.accuracy,null);assert.equal(p.legacy,10);assert.equal(p.total.d,7);
m=H.create({[today]:{t:14,d:10,n:4,b:3,y:0,m:0,z:0}}, {},today);p=H.period(m,7);
assert.equal(p.accuracy,75,'Eski 10 cevabın ipucu sayısı tahmin edilmez');assert.equal(p.legacy,10);
assert.equal(p.total.t,14,'Geçmiş çalışma hacmi korunur');
assert.equal(H.period(H.create({[today]:{t:4,n:4,b:5}},{},today),7).accuracy,null);
assert.equal(H.period(H.create({[today]:{t:1,d:1,n:2,b:1}},{},today),7).accuracy,50,
  'Eski cihaz sayacı yarışta eksilse de bağımsız yeni sonuçların paydası korunur');
assert.equal(H.period(H.create({[today]:{t:1,d:3,n:2,b:1}},{},today),7).accuracy,50,
  'Eski d/t tutarsızlığı yeni b/n ölçümünü geçersiz kılmaz');

function event(id,offset,result,from,to,previous,word='establish',extra={}){
  return {id,card:word,kind:'kelime',at:base+offset*DAY,day:999999,result,from,to,
    previousAt:previous===null?null:base+previous*DAY,dueDay:999999,source:'kart',...extra};
}
const input={available:true,retainedLimit:20000,perCardLimit:20,truncated:true,events:[
  event('first',0,'bildim',0,1,null),
  event('hint-is-known',1,'bildim',1,1,0),
  event('wrong-after-delay',4,'bilemedim',4,3,1),
  event('wrong-again',5,'bilemedim',3,2,4),
  event('same-day',5.1,'bildim',2,3,5,'establish',{source:'gunun-testi'}),
  event('already-known',5.2,'zaten',3,5,null),
  event('reset',5.3,'sifirla',5,0,null),
  event('first-after-reset',5.4,'bildim',0,1,null),
  event('legacy-no-previous-time',3,'bilemedim',3,2,null,'maintain'),
  event('phrase',2,'bilemedim',4,3,1,'establish',{kind:'obek'}),
  event('sentence',2,'bildim',1,2,1,'establish',{kind:'cumle'}),
  event('not-in-dictionary',2,'bildim',1,2,1,'not-a-card'),
  event('future',30,'bildim',1,2,29)
],cards:[{card:'establish',kind:'kelime',known:20,unknown:9,sorted:2,drops:7,total:32,firstAt:base-50*DAY,lastAt:base+5.4*DAY,retained:8,pruned:24}]};
const before=JSON.stringify(input),dictionary=[{e:'establish'},{e:'maintain'}];
const h=H.history(input,dictionary,today),r=H.recallPeriod(h,7);
assert.equal(h.events.length,9,'Sadece sözlük kelimeleri; öbek/cümle/future yok');
assert.equal(r.total,4);assert.equal(r.known,2);assert.equal(r.unknown,2);assert.equal(r.accuracy,50);
assert.equal(r.excluded,5,'İlk karşılaşma, ayıklama, sıfırlama ve bilinmeyen aralık paydada yok');
assert.equal(r.drops,3,'Önceki zaman bilinmese de gerçek kutu düşüşü sayılır');
assert.deepEqual(plain(r.intervals.map(g=>[g.days,g.known,g.unknown,g.total])),[[0,1,0,1],[1,1,1,2],[3,0,1,1]],'DueDay veya eski day anahtarı süreyi değiştiremez');
assert.equal(r.repeatedDrops.length,1);assert.equal(r.repeatedDrops[0].drops,7,'Budanan ayrıntılara rağmen birikimli düşüşler korunur');
assert.equal(h.words.establish.events.length,8);assert.equal(h.words.establish.total,32);assert.equal(h.words.establish.pruned,24);
assert.equal(h.firstAt,base-50*DAY);assert.equal(h.truncated,true);assert.equal(JSON.stringify(input),before,'Okuma kaynak veriyi değiştiremez');
assert.equal(H.recallPeriod(h,30).total,4,'Dönem uzayınca hayali geçmiş üretilemez');
const onlyTests=H.history({available:true,events:[event('test-first',0,'bildim',0,0,null,'establish',{source:'gunun-testi'}),event('test-repeat',1,'bildim',0,0,0,'establish',{source:'gunun-testi'})]},dictionary,today);
assert.equal(H.recallPeriod(onlyTests,7).total,1,'Günlük testte gerçek önceki yanıt varsa 0. kutu tekrar hesabını dışlamaz');

const typed={available:true,events:[event('typed',1,'bildim',1,2,0,'@kelime:run'),event('badtype',1,'bildim',1,2,0,'@obek:run')]};
const names=id=>({ad:id.split(':')[1],tur:id.startsWith('@kelime:')?'kelime':'obek'});
assert.equal(H.history(typed,[{e:'run'}],today,names).events.length,1,'Aynı adlı öbek kelime geçmişine sızamaz');

const bad={available:true,events:[event('future-previous',2,'bildim',2,3,5),event('negative-previous',2,'bildim',2,3,null,'establish',{previousAt:-1}),
  event('bad-box',2,'bilemedim',8,1,1),event('same-id',2,'bildim',2,3,1),event('same-id',2,'bildim',2,3,1)]};
const badModel=H.history(bad,dictionary,today);
assert.equal(badModel.partial,true);assert.equal(badModel.events.length,3);assert.equal(H.recallPeriod(badModel,7).total,1);
assert.equal(H.history({available:false},dictionary,today).available,false);
assert.equal(H.recallPeriod(H.history({available:true,events:[]},dictionary,today),7).accuracy,null);
assert.equal(H.history({available:true,events:[event('html',2,'bildim',1,2,1,'<img src=x>')]},dictionary,today).events.length,0);
// One-day view compares today's calendar day with yesterday, not the last 24h.
const dailyModel=H.create({[today-1]:{t:10,n:10,b:6},[today]:{t:15,n:15,b:4}},{},today);
assert.equal(H.period(dailyModel,1).total.t,15);
assert.equal(H.period(dailyModel,1).previous.t,10);
assert.equal(H.period(dailyModel,1).delta,5);
assert.equal(H.period(dailyModel,1).percent,50);
assert.equal(H.period(H.create({[today]:{t:15,n:15,b:4}},{},today),1).delta,null,'Missing yesterday is unknown, not zero');
const review=H.dayReview(h,today);
assert.equal(review.total,4,'Reset is excluded from answers; already known is included');
assert.equal(review.words,1,'Repeated answers are not extra unique words');
assert.equal(review.known,3);assert.equal(review.unknown,1);assert.equal(review.already,1);
assert.equal(review.up,3);assert.equal(review.down,1);assert.equal(review.same,0);
assert.equal(review.partial,true,'Pruned detail is labelled incomplete');
assert.deepEqual(plain(review.rows[0].boxes),[3,2,3,5,null,0,1],'A reset gap cannot appear as a recorded 5→0 answer');
assert.equal(H.dayReview(h,today-1).total,1);
assert.equal(H.dayReview(H.history({available:true},dictionary,today),today).covered,false);
const alreadyAfterReview=H.history({available:true,events:[event('already-after-review',4,'zaten',3,5,1)]},dictionary,today);
assert.equal(H.recallPeriod(alreadyAfterReview,7).known,1,'Already known with a real prior answer counts as recalled');
assert.equal(H.recallPeriod(alreadyAfterReview,1).total,0,'One-day period excludes yesterday');
assert.equal(H.dayReview(alreadyAfterReview,today-1).known,1);
console.log('İstatistik geçmişi: eski/yeni oran, gerçek süre, ilk/reset/ayıklama ayrımı, kapsam, budama, kimlik ve salt okunur model geçti.');
