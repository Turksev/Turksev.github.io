/* Yalnız bu tarayıcı: her belge kendi gün/kurulum/oturum ANAHTARINA yazar.
   Ortak JSON'a oku-değiştir-yaz yapılmaz. Firebase, Depo ve öğrenme yedeğine dokunmaz. */
(function () {
  'use strict';
  var Y = window.YDS = window.YDS || {}, H = Y.KullanimHesap;
  if (!H || Y.Kullanim) return;
  var PREFIX = 'yds-kullanim-v1:', EPOCH = PREFIX+'epoch', INSTALL = PREFIX+'kurulum';
  // Son kullanıcı sıfırlamasının zamanı: açılışta depoyu okuyamayan sekme, sonradan
  // benimsediği dönemin kendi kayıtlarından sonra sıfırlanıp sıfırlanmadığını buradan anlar.
  var SIFIRLAMA = PREFIX+'sifirlama';
  // Sınır: karşılaştırma duvar saatine dayanır; böyle bir sekme açıkken sistem saati
  // geri alınırsa sonraki sıfırlama kaçırılabilir (README'de belgelendi).
  var IDLE = 90000, RETAIN = 180, BUDGET = 512*1024, RESERVE = 4096, TARGET = 384*1024, store;
  var records = Object.create(null), dirty = false, failed = false, suspended = false;
  // Dönem ve kurulum kimliği açılışta depodan okunup yazılabildi mi? Okunamadıysa
  // o sırada tutulan kayıtlar, depo düzelince silinmeden benimsenir.
  var baslatildi = false;
  // Açılışta okunan dönem (yoksa null) ve belgenin başlama anı.
  var okunanDonem = null, belgeBaslangic = Date.now();
  // Dönem bilinmeden bastırılan yenileme ziyareti: benimsenen dönem farklıysa geri eklenir.
  var bastirilanZiyaret = null;
  // Bu sekmenin depoya yazdığı son bugünkü kayıt anahtarı (dışarıdan silmeyi fark etmek için).
  var sonKayit = null;
  var epoch = 'ilk', installation, session = uid(), page = H.sayfa(window.location.pathname);
  var visible = false, started = false, leftPage = false, lastWall = Date.now(), lastMono = mono(), lastInput = lastMono;
  function uid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
  }
  function mono() { return window.performance && window.performance.now ? window.performance.now() : Date.now(); }
  function keys() { var list=[]; for(var i=0;i<store.length;i++) {var k=store.key(i);if(k && k.indexOf(PREFIX)===0)list.push(k);} return list; }
  function emit() { try { window.dispatchEvent(new window.CustomEvent('yds:kullanim-degisti')); } catch (_) {} }
  // Başarısız yazım yeni disk kaydı yaratmaz. Bekleyen mutlak sayaç bellekte
  // kalır; yeniden yazılabildiğinde geçici hata da kaldırılır.
  function fail() { failed=true; }
  try {
    store = window.localStorage;
    var okunan = store.getItem(EPOCH);
    // Dönem anahtarı yoksa ilk kurulum dönemi 'ilk'tir. Dönem ancak depoda
    // kesinleştiyse (okundu ya da yazılabildi) bilinen sayılır.
    epoch = okunan || 'ilk';
    if(!okunan)store.setItem(EPOCH,epoch);
    okunanDonem = epoch;
    installation = store.getItem(INSTALL);
    if (!installation) { installation=uid(); store.setItem(INSTALL,installation); }
    baslatildi = true;
  } catch (_) { fail(); }
  function recordKey(g) { return PREFIX+'r:'+epoch+':'+g+':'+installation+':'+session; }
  function row(g) {
    if (!records[g]) records[g]={v:1,g:g,p:page,a:0,s:0,f:{},_ms:0};
    return records[g];
  }
  function resetMemory(next) {
    sonKayit=null; bastirilanZiyaret=null;
    epoch=next; session=uid(); records=Object.create(null); dirty=false; started=false; failed=false;
    visible=false; suspended=true; lastWall=Date.now(); lastMono=mono(); lastInput=lastMono;
  }
  function current() {
    if (!store) return false;
    try {
      var next=store.getItem(EPOCH);
      if(!baslatildi) {
        // Açılışta depo okunamamıştı; bellekteki kayıtlar bu belgenin kendi
        // kayıtlarıdır. Arada başka sekme kullanımı sıfırladıysa bu kayıtlar
        // sıfırlama öncesine aittir ve yeni döneme taşınmaz. Açılışta dönem
        // okunduysa değişmiş olması, okunamadıysa sıfırlama zamanının bu
        // belgeden sonra olması sıfırlamanın kanıtıdır.
        var sifirlamaZamani=Number(store.getItem(SIFIRLAMA))||0;
        var sifirlandi=okunanDonem!==null ? (next||'ilk')!==okunanDonem : sifirlamaZamani>=belgeBaslangic;
        // Dönem yoksa herkes aynı 'ilk' değerini yazar: aynı anda toparlanan
        // sekmeler farklı dönem üretip birbirinin kayıtlarını eski dönem saymaz.
        if(!next){next='ilk';store.setItem(EPOCH,next);}
        var kurulum=store.getItem(INSTALL);
        if(!kurulum){kurulum=uid();store.setItem(INSTALL,kurulum);}
        installation=kurulum;baslatildi=true;
        var bastirilan=bastirilanZiyaret;bastirilanZiyaret=null;
        if(sifirlandi){resetMemory(next);return false;}
        epoch=next;
        // Bastırılan ziyaretin kaydı başka dönemdeydi (arada sıfırlandı): bu yenileme yeni ziyarettir.
        if(bastirilan && bastirilan.e!==next){row(bastirilan.g).a++;dirty=true;}
        return true;
      }
      if(!next) {
        // Depo dışarıdan silinmiş: bu sekmenin sayaçları silinmiş veriye aittir.
        // Herkes aynı 'ilk' dönemini ve (yoksa) tek bir kurulum kimliğini kullanır;
        // aynı anda toparlanan sekmeler birbirinin kaydını eski dönem saymaz.
        next='ilk';store.setItem(EPOCH,next);
        var yeniKurulum=store.getItem(INSTALL);
        if(!yeniKurulum){yeniKurulum=uid();store.setItem(INSTALL,yeniKurulum);}
        installation=yeniKurulum;resetMemory(next);return false;
      }
      if(next!==epoch) { resetMemory(next); return false; }
      // Dönem aynı görünse de (silmeden sonra başka sekme 'ilk' yazmış olabilir)
      // kurulum kimliği değişmiş ve bu sekmenin son kaydı yoksa depo silinmiştir:
      // eski sayaçlar geri yazılmaz.
      if(sonKayit){
        var kurulumSimdi=store.getItem(INSTALL);
        if(kurulumSimdi!==installation && store.getItem(sonKayit)===null){
          if(!kurulumSimdi){kurulumSimdi=uid();store.setItem(INSTALL,kurulumSimdi);}
          installation=kurulumSimdi;resetMemory(next);return false;
        }
      }
      return true;
    } catch (_) {fail();return false;}
  }
  function closeInterval() {
    var nowWall=Date.now(), nowMono=mono(), elapsed=nowMono-lastMono, wallElapsed=nowWall-lastWall;
    // Uyku veya sistem saati sıçraması, kanıtlanmış etkin süre değildir.
    if (visible && !suspended && elapsed>=0 && wallElapsed>=0 && Math.abs(elapsed-wallElapsed)<2000) {
      var ms=H.aktifAralik(lastMono,nowMono,lastInput,true,IDLE);
      H.gunlereBol(lastWall,lastWall+ms).forEach(function (part) {
        var r=row(part.g);r._ms+=part.ms;r.s=Math.floor(r._ms/1000);dirty=true;
      });
    }
    lastWall=nowWall;lastMono=nowMono;
  }
  function visit(reload) {
    var g=H.gun(new Date()), suppress=false;
    try {
      var old=JSON.parse(window.sessionStorage.getItem(PREFIX+'visit')||'null');
      // Açılışta dönem okunamadıysa geçici dönemle karşılaştırılamaz; aynı yol ve
      // gün yeterlidir (yoksa hatalı açılışla yenileme ziyareti iki kez sayılırdı).
      var donemBilinmiyor=okunanDonem===null;
      suppress=reload && old && old.path===window.location.pathname && (old.e===epoch || donemBilinmiyor) && old.g===g && old.saved===true;
      // Dönem bilinmeden verilen karar geçicidir; depo düzelince yeniden değerlendirilir.
      if(suppress && donemBilinmiyor)bastirilanZiyaret={g:g,e:old.e};
    } catch (_) {}
    if (!suppress) row(g).a++;
    else row(g); // Yenilenen belge süreyi kendi kaydına yazar; ziyaret artmaz.
    started=true;dirty=true;
  }
  function isReload() {
    try { var n=window.performance.getEntriesByType('navigation')[0];return n && n.type==='reload'; } catch (_) {return false;}
  }
  function start(reload) {
    if (document.visibilityState==='hidden' || suspended) return;
    visible=true;lastWall=Date.now();lastMono=mono();lastInput=lastMono;
    if(!started)visit(reload);
  }
  function size(key,value) { return value===null || value===undefined ? 0 : 2*(key.length+value.length); }
  // Bir checkpoint'te depoyu yalnız bir kez tara. Bütün boyut/özet/budama
  // işlemleri bu envanteri kullanır; her özellik için localStorage taranmaz.
  function inventory() {
    var state={items:Object.create(null),bytes:0,changed:false};
    keys().forEach(function(k){var value=store.getItem(k);if(value!==null){state.items[k]=value;state.bytes+=size(k,value);}});
    return state;
  }
  function put(state,key,value,recoveryCutoff) {
    if(state.items[key]===value)return;
    var next=state.bytes-size(key,state.items[key])+size(key,value);
    // Önceki sürüm veya eşzamanlı sekmeler yumuşak sınırı aşmış olabilir.
    // Yalnız küçültmeyi başlatan küçük kesim işareti bu sınırı aşabilir;
    // tarayıcının gerçek kotası yine setItem tarafından denetlenir.
    if(next>BUDGET && !recoveryCutoff)throw new Error('usage budget');
    store.setItem(key,value);state.items[key]=value;state.bytes=next;state.changed=true;
  }
  function remove(state,key) {
    store.removeItem(key);state.bytes-=size(key,state.items[key]);delete state.items[key];state.changed=true;
  }
  function capacityCutoff(items,active) {
    var base=PREFIX+'cutoff:'+active+':', result=null;
    Object.keys(items).forEach(function(k){if(k.indexOf(base)===0){var g=Number(k.slice(base.length));if(Number.isSafeInteger(g)&&g>=0)result=Math.max(result===null?g:result,g);}});
    return result;
  }
  function recordDay(k,active) {
    var base=PREFIX+'r:'+active+':';
    return k.indexOf(base)===0?Number(k.slice(base.length).split(':')[0]):NaN;
  }
  function floor(items,active) { return Math.max(H.gun(new Date())-RETAIN,capacityCutoff(items,active)||0); }
  function prune(state) {
    var cutoff=floor(state.items,epoch), groups=Object.create(null);
    Object.keys(state.items).forEach(function(k){
      if(store.getItem(EPOCH)!==epoch)return;
      var parts=k.slice(PREFIX.length).split(':'),kind=parts[0],g=Number(parts[parts.length-1]);
      if(['r','start','last-p','last-f','gap','cutoff'].indexOf(kind)<0)return;
      // Eski hata işaretleri artık yazılmaz; okunmuş geçmişi 180 gün boyunca
      // geçici bir yazım hatası gibi sunan eski formatın işaretleri kaldırılır.
      if(parts[1]!==epoch || kind==='gap' || (kind==='r' && recordDay(k,epoch)<cutoff)){remove(state,k);return;}
      if(kind==='r' || !Number.isSafeInteger(g))return;
      var base=k.slice(0,k.lastIndexOf(':')+1),old=groups[base];
      if(!old || (kind==='start'?g<old.g:g>old.g))groups[base]={key:k,g:g};
    });
    Object.keys(state.items).forEach(function(k){
      var parts=k.slice(PREFIX.length).split(':');
      if(['start','last-p','last-f','cutoff'].indexOf(parts[0])<0 || parts[1]!==epoch)return;
      var best=groups[k.slice(0,k.lastIndexOf(':')+1)];
      if(best && k!==best.key && store.getItem(EPOCH)===epoch)remove(state,k);
    });
  }
  function marker(updates,state,kind,id,g) {
    var base=PREFIX+kind+':'+epoch+':'+installation+':'+id+':', target=g;
    Object.keys(state.items).concat(Object.keys(updates)).forEach(function(k){
      if(k.indexOf(base)!==0)return;
      var n=Number(k.slice(base.length));if(Number.isSafeInteger(n))target=kind==='start'?Math.min(target,n):Math.max(target,n);
    });
    updates[base+target]='1';
  }
  function extraBytes(state,updates) {
    return Object.keys(updates).reduce(function(n,k){return n+size(k,updates[k])-size(k,state.items[k]);},0);
  }
  function makeRoom(state,updates) {
    if(state.bytes+extraBytes(state,updates)<=BUDGET-RESERVE)return;
    var today=H.gun(new Date()),days=Object.create(null);
    Object.keys(state.items).forEach(function(k){var g=recordDay(k,epoch);if(Number.isSafeInteger(g)&&g<today)days[g]=true;});
    var oldest=Object.keys(days).map(Number).sort(function(a,b){return a-b;});
    for(var i=0;i<oldest.length && state.bytes+extraBytes(state,updates)>TARGET;i++){
      if(store.getItem(EPOCH)!==epoch)return;
      var cutoff=oldest[i]+1;
      // Önce kalıcı ve monoton kesim: uyuyan veya geç yazan bir sekme atılan
      // günleri geri getiremez. Ayrı anahtarlar daha düşük kesimin kazanmasını önler.
      put(state,PREFIX+'cutoff:'+epoch+':'+cutoff,'1',true);
      Object.keys(state.items).forEach(function(k){if(recordDay(k,epoch)<cutoff)remove(state,k);});
      Object.keys(updates).forEach(function(k){if(recordDay(k,epoch)<cutoff)delete updates[k];});
      Object.keys(records).forEach(function(g){if(Number(g)<cutoff)delete records[g];});
    }
    // Aynı günün tek başına bütçeyi doldurduğu uç durumda bellek korunur,
    // yeni hata anahtarı üretilmez; sonraki checkpoint/gün yeniden dener.
    if(state.bytes+extraBytes(state,updates)>BUDGET-RESERVE)throw new Error('usage budget');
  }
  function flush() {
    if (!current()) return !!store && !failed;
    closeInterval();
    // Bekleyen kayıt yok ve depo yeniden okunabiliyor: geçici hatadan kaybolan veri
    // olmadığı için hata göstergesi kalkar (bekleyen kayıt olsaydı dirty true kalırdı).
    if(!dirty){if(failed){failed=false;emit();}return true;}
    try {
      var state=inventory(),updates=Object.create(null),wasFailed=failed;
      prune(state);
      var cutoff=floor(state.items,epoch);
      Object.keys(records).forEach(function(g) {
        var r=records[g]; if(r.g<cutoff){delete records[g];return;}
        updates[recordKey(g)]=JSON.stringify({v:1,g:r.g,p:r.p,a:r.a,s:r.s,f:r.f});
        marker(updates,state,'start','all',r.g);
        if(r.a || r.s || Object.keys(r.f).length)marker(updates,state,'last-p',r.p,r.g);
        Object.keys(r.f).forEach(function(id){if(r.f[id])marker(updates,state,'last-f',id,r.g);});
      });
      makeRoom(state,updates);
      if(!current())return !failed;
      Object.keys(updates).forEach(function(key){
        put(state,key,updates[key]);
        // Yalnız gerçekten ziyaret içeren gün doğrulanır; gece yarısından
        // sonraki süre/arka plan eylemi yeni bir ziyaretin kanıtı değildir.
        // Yardımcı özet hatası kaydedilmiş ziyareti yenilemede çoğaltmasın.
        var g=recordDay(key,epoch);
        if(Number.isSafeInteger(g) && records[g] && records[g].a>0)try {window.sessionStorage.setItem(PREFIX+'visit',JSON.stringify({path:window.location.pathname,e:epoch,g:g,saved:true}));} catch (_) {}
      });
      if(!current())return !failed;
      prune(state);dirty=false;failed=false;
      var bugunG=H.gun(new Date());
      if(records[bugunG])sonKayit=recordKey(bugunG);
      if(state.changed || wasFailed)emit();return true;
    } catch (_) {fail();emit();return false;}
  }
  function read() {
    var out={records:[],startedDay:null,lastPages:{},lastFeatures:{},partial:failed,retainedFromDay:null};
    if(!store){out.partial=true;return out;}
    try {
      var active=store.getItem(EPOCH)||'ilk',state=inventory(),cutoff=floor(state.items,active);
      out.retainedFromDay=capacityCutoff(state.items,active);
      Object.keys(state.items).forEach(function(k) {
        if(k.indexOf(PREFIX+'r:'+active+':')===0) {
          var value=state.items[k];if(!value)return;
          if(value.length>16000){out.partial=true;return;}
          try {var r=JSON.parse(value);if(H.gecerli(r)){if(r.g>=cutoff)out.records.push(r);}else out.partial=true;}catch(_){out.partial=true;}
          return;
        }
        ['start','last-p','last-f'].forEach(function(kind) {
          var base=PREFIX+kind+':'+active+':';if(k.indexOf(base)!==0)return;
          var parts=k.slice(base.length).split(':'),g=Number(parts[parts.length-1]),id=parts[parts.length-2];
          if(!Number.isSafeInteger(g) || g<0 || g>H.gun(new Date()))return;
          if(kind==='start') {out.startedDay=out.startedDay===null?g:Math.min(out.startedDay,g);return;}
          var map=kind==='last-p'?out.lastPages:out.lastFeatures;
          if(!(kind==='last-p'?H.sayfaMi(id):H.ozellikMi(id)))return;
          map[id]=Math.max(map[id]===undefined?g:map[id],g);
        });
      });
    } catch (_) {out.partial=true;}
    return out;
  }
  function activity() {
    if(document.visibilityState==='hidden')return;
    current();closeInterval();
    if(suspended){suspended=false;start(false);}
    if(!started)start(isReload());
    lastInput=mono();
  }
  function event(id) {
    if(!H.ozellikMi(id))return false;
    current();
    var hidden=document.visibilityState==='hidden';
    if(hidden){closeInterval();suspended=false;}else activity();
    var r=row(H.gun(new Date()));r.f[id]=(r.f[id]||0)+1;dirty=true;
    // Arka planda timer ile tamamlanan deneme gibi iş eylemleri gerçektir.
    // Görünürlük yalnız süreyi sınırlar; donmadan önce eylemi hemen kaydet.
    if(hidden)flush();
    return true;
  }
  function clear() {
    if(!store)return false;
    try {
      // Yeni dönemi gören başka sekmenin taze kaydını silme: silinecek
      // anahtarların envanterini dönem değişmeden önce al.
      var previousKeys=keys(),next=uid();
      // Önce zaman damgası: dönem değişikliği olayını alan sekme damgayı da güncel görür;
      // damga yazılamazsa dönem hiç değişmez.
      store.setItem(SIFIRLAMA,String(Date.now()));store.setItem(EPOCH,next);resetMemory(next);
      previousKeys.forEach(function(k){if(k!==EPOCH && k!==INSTALL && k!==SIFIRLAMA)store.removeItem(k);});
      failed=false;emit();return true;
    } catch (_) {fail();emit();return false;}
  }
  Y.Kullanim={oku:read,olay:event,yaz:flush,sifirla:clear,onek:PREFIX};
  document.addEventListener('visibilitychange',function() {
    if(document.visibilityState==='hidden'){flush();visible=false;}
    else {current();start(isReload());flush();}
  });
  window.addEventListener('pagehide',function(){flush();visible=false;leftPage=true;});
  window.addEventListener('pageshow',function(e) {
    current();
    if(e.persisted && leftPage) {started=false;leftPage=false;start(false);flush();}
  });
  document.addEventListener('freeze',function(){flush();visible=false;});
  document.addEventListener('resume',function(){current();start(false);});
  window.addEventListener('storage',function(e) {
    if(e.key===null || e.key===EPOCH)current();
    if(e.key===null || (e.key && e.key.indexOf(PREFIX)===0))emit();
  });
  ['pointerdown','keydown','touchstart','scroll'].forEach(function(type){document.addEventListener(type,activity,{passive:true,capture:true});});
  var lastMove=-Infinity;
  document.addEventListener('pointermove',function(){var t=mono();if(t-lastMove>=1000){lastMove=t;activity();}},{passive:true});
  window.setInterval(function(){if(!suspended)flush();},60000);
  start(isReload());
  // Head içindeki kurulum yalnız iki küçük metadata anahtarına dokunur.
  // İlk envanter taramasını ilk çizim sonrasına bırak; pagehide acil flush'ı korur.
  if(window.requestAnimationFrame)window.requestAnimationFrame(function(){window.requestAnimationFrame(flush);});
  else flush();
})();
