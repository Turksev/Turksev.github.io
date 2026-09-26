/* Yalnız bu tarayıcı: her belge kendi gün/kurulum/oturum ANAHTARINA yazar.
   Ortak JSON'a oku-değiştir-yaz yapılmaz. Firebase, Depo ve öğrenme yedeğine dokunmaz. */
(function () {
  'use strict';
  var Y = window.YDS = window.YDS || {}, H = Y.KullanimHesap;
  if (!H || Y.Kullanim) return;
  var PREFIX = 'yds-kullanim-v1:', EPOCH = PREFIX+'epoch', INSTALL = PREFIX+'kurulum';
  var IDLE = 90000, RETAIN = 180, BUDGET = 512*1024, store;
  var records = Object.create(null), dirty = false, failed = false, suspended = false;
  var epoch = 'ilk', installation, session = uid(), page = H.sayfa(window.location.pathname);
  var visible = false, started = false, leftPage = false, lastWall = Date.now(), lastMono = mono(), lastInput = lastMono;
  function uid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
  }
  function mono() { return window.performance && window.performance.now ? window.performance.now() : Date.now(); }
  function keys() { var list=[]; for(var i=0;i<store.length;i++) {var k=store.key(i);if(k && k.indexOf(PREFIX)===0)list.push(k);} return list; }
  function emit() { try { window.dispatchEvent(new window.CustomEvent('yds:kullanim-degisti')); } catch (_) {} }
  function fail() {
    failed=true;
    try {if(store)store.setItem(PREFIX+'gap:'+epoch+':'+session,String(H.gun(new Date())));}catch(_){}
  }
  try {
    store = window.localStorage;
    epoch = store.getItem(EPOCH) || 'ilk';
    if(!store.getItem(EPOCH))store.setItem(EPOCH,epoch);
    installation = store.getItem(INSTALL);
    if (!installation) { installation=uid(); store.setItem(INSTALL,installation); }
  } catch (_) { fail(); }
  function recordKey(g) { return PREFIX+'r:'+epoch+':'+g+':'+installation+':'+session; }
  function row(g) {
    if (!records[g]) records[g]={v:1,g:g,p:page,a:0,s:0,f:{},_ms:0};
    return records[g];
  }
  function resetMemory(next) {
    epoch=next; session=uid(); records=Object.create(null); dirty=false; started=false; failed=false;
    visible=false; suspended=true; lastWall=Date.now(); lastMono=mono(); lastInput=lastMono;
  }
  function current() {
    if (!store) return false;
    try {
      var next=store.getItem(EPOCH);
      if(!next) {
        next=uid();store.setItem(EPOCH,next);
        installation=uid();store.setItem(INSTALL,installation);
        resetMemory(next);return false;
      }
      if(next!==epoch) { resetMemory(next); return false; }
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
      suppress=reload && old && old.path===window.location.pathname && old.e===epoch && old.g===g && old.saved===true;
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
  // Değişmez gün işaretleri: en yeni işaret başka sekmenin eski yazısıyla ezilemez.
  // Özellik başına en son günü tutarız; günlük ayrıntıdan bağımsızdır.
  function marker(kind,id,g) {
    var base=PREFIX+kind+':'+epoch+':'+installation+':'+id+':', key=base+g;
    store.setItem(key,'1');
    var matches=keys().filter(function(k){return k.indexOf(base)===0;}), target=g;
    matches.forEach(function(k){var n=Number(k.slice(base.length));if(Number.isInteger(n))target=kind==='start'?Math.min(target,n):Math.max(target,n);});
    matches.forEach(function(k) {
      var old=Number(k.slice(base.length));
      if(Number.isInteger(old) && (kind==='start' ? old>target : old<target))store.removeItem(k);
    });
  }
  function prune() {
    var cutoff=H.gun(new Date())-RETAIN, prefix=PREFIX+'r:'+epoch+':';
    keys().forEach(function(k) {
      // Resetle yarışan eski bir yazıcı sonradan bitmiş olabilir. Yalnız hâlâ
      // geçerli epoch adına bakım yap; yeni dönemin kayıtlarını asla silme.
      if(store.getItem(EPOCH)!==epoch)return;
      var parts=k.slice(PREFIX.length).split(':');
      if(['r','start','last-p','last-f','gap'].indexOf(parts[0])>=0 && parts[1]!==epoch){store.removeItem(k);return;}
      if(k.indexOf(prefix)===0) {var g=Number(k.slice(prefix.length).split(':')[0]);if(g<cutoff)store.removeItem(k);}
      if(k.indexOf(PREFIX+'gap:'+epoch+':')===0 && Number(store.getItem(k))<cutoff)store.removeItem(k);
    });
  }
  function flush() {
    if (!current()) return !!store && !failed;
    closeInterval();
    if(!dirty)return !failed;
    try {
      prune();
      var bytes=keys().reduce(function(n,k){return n+2*(k.length+(store.getItem(k)||'').length);},0);
      Object.keys(records).forEach(function(g) {
        var r=records[g]; if(r.g<H.gun(new Date())-RETAIN){delete records[g];return;}
        var data={v:1,g:r.g,p:r.p,a:r.a,s:r.s,f:r.f}, key=recordKey(g), text=JSON.stringify(data), old=store.getItem(key);
        var extra=2*(text.length-(old||'').length+(old===null?key.length:0));
        if(bytes+extra>BUDGET)throw new Error('usage budget');
        store.setItem(key,text);bytes+=extra;
        // Ziyaret kaydı saklandıysa yardımcı özet yazısının hatası yenilemede
        // ikinci ziyaret oluşturmasın.
        try {window.sessionStorage.setItem(PREFIX+'visit',JSON.stringify({path:window.location.pathname,e:epoch,g:H.gun(new Date()),saved:true}));} catch (_) {}
        marker('start','all',r.g);
        if(r.a || r.s || Object.keys(r.f).length)marker('last-p',r.p,r.g);
        Object.keys(r.f).forEach(function(id){if(r.f[id])marker('last-f',id,r.g);});
      });
      if(!current())return !failed;
      dirty=false;
      try {window.sessionStorage.setItem(PREFIX+'visit',JSON.stringify({path:window.location.pathname,e:epoch,g:H.gun(new Date()),saved:true}));} catch (_) {}
      emit();return true;
    } catch (_) {fail();emit();return false;}
  }
  function read() {
    var out={records:[],startedDay:null,lastPages:{},lastFeatures:{},partial:failed};
    if(!store){out.partial=true;return out;}
    try {
      var active=store.getItem(EPOCH)||'ilk', cutoff=H.gun(new Date())-RETAIN;
      keys().forEach(function(k) {
        if(k.indexOf(PREFIX+'gap:'+active+':')===0 && Number(store.getItem(k))>=cutoff){out.partial=true;return;}
        if(k.indexOf(PREFIX+'r:'+active+':')===0) {
          var value=store.getItem(k);if(!value)return;
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
    activity();
    if(document.visibilityState==='hidden' || !started)return false;
    var r=row(H.gun(new Date()));r.f[id]=(r.f[id]||0)+1;dirty=true;return true;
  }
  function clear() {
    if(!store)return false;
    try {
      var next=uid(); store.setItem(EPOCH,next);resetMemory(next);
      keys().forEach(function(k){if(k!==EPOCH && k!==INSTALL)store.removeItem(k);});
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
  start(isReload());flush();
})();
