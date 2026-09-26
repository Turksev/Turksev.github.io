/* Yerel kullanımın salt okunur modeli. Öğrenme verisine bağımlılığı yoktur. */
(function () {
  'use strict';
  var Y = window.YDS = window.YDS || {}, DAY = 86400000;
  var pages = [
    ['index','Ana sayfa'],['kelimeler','Kelimeler'],['obekler','Öbekler'],['cumleler','Cümleler'],
    ['aileler','Kelime aileleri'],['quiz','Quiz'],['deneme','Deneme'],['gramer','Gramer'],
    ['baglaclar','Bağlaçlar'],['konular','Konu haritası'],['konu','Konu üniteleri'],
    ['ara','Arama'],['durum','Çalışma durumu'],['istatistik','İstatistik'],['ayarlar','Ayarlar'],
    ['yontem','Yöntem'],['404','Bulunamayan sayfa']
  ];
  var features = [
    ['deste-baslat','Deste başlatma'],['kart-cevap','Kart yanıtlama'],['quiz-baslat','Quiz başlatma'],
    ['quiz-bitir','Quiz tamamlama'],['deneme-bitir','Deneme tamamlama'],['ipucu','İpucu kullanma'],
    ['gunun-testi-baslat','Günün testini başlatma'],['gunun-testi-bitir','Günün testini tamamlama']
  ];
  function member(list, id) { return list.some(function (r) { return r[0] === id; }); }
  function integer(n) { return Number.isSafeInteger(n) && n >= 0; }
  function day(d) { return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY; }
  function pageId(path) {
    if (/\/konu\/[ET]\d+\.html$/.test(path)) return 'konu';
    var id = path.replace(/\/$/, '/index.html').split('/').pop().replace(/\.html$/, '');
    return member(pages, id) ? id : '404';
  }
  function valid(row) {
    return !!row && row.v === 1 && integer(row.g) && member(pages, row.p) &&
      integer(row.a) && integer(row.s) && row.s <= 172800 && row.f &&
      typeof row.f === 'object' && !Array.isArray(row.f) &&
      Object.keys(row.f).every(function (id) { return member(features, id) && integer(row.f[id]); });
  }
  // Aralık, yeni etkileşim zamanını kaydetmeden ÖNCE kapatılır.
  function active(start, end, lastInput, visible, idle) {
    if (!visible || end < start) return 0;
    return Math.max(0, Math.min(end, lastInput + idle) - start);
  }
  function split(start, end) {
    var out = [];
    while (start < end) {
      var d = new Date(start), next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
      var stop = Math.min(end, next);
      if (stop <= start) break;
      out.push({g:day(d), ms:stop-start}); start = stop;
    }
    return out;
  }
  function report(snapshot, range, today) {
    snapshot = snapshot || {};
    if ([7,30,90].indexOf(range) < 0) range = 30;
    if (!integer(today)) today = day(new Date());
    var start = today-range+1, pageMap = Object.create(null), featureMap = Object.create(null), seenDays = {};
    var result = {start:start,end:today,startedDay:integer(snapshot.startedDay)?snapshot.startedDay:null,
      pages:[],features:[],emptyPages:[],emptyFeatures:[],seconds:0,observedDays:0,partial:!!snapshot.partial};
    function latest(map, id) { var v = (map || {})[id]; return integer(v) && v<=today ? v : null; }
    pages.forEach(function (item) {
      var row = {id:item[0],label:item[1],visits:0,seconds:0,lastDay:latest(snapshot.lastPages,item[0]),days:0,_days:{}};
      result.pages.push(row); pageMap[row.id] = row;
    });
    features.forEach(function (item) {
      var row = {id:item[0],label:item[1],count:0,lastDay:latest(snapshot.lastFeatures,item[0]),days:0,_days:{}};
      result.features.push(row); featureMap[row.id] = row;
    });
    (Array.isArray(snapshot.records) ? snapshot.records : []).forEach(function (row) {
      if (!valid(row)) { result.partial = true; return; }
      if (row.g > today) return;
      var p = pageMap[row.p], used = row.a>0 || row.s>0 || Object.keys(row.f).some(function (id) {return row.f[id]>0;});
      if (used) p.lastDay = p.lastDay===null ? row.g : Math.max(p.lastDay,row.g);
      if (result.startedDay === null || row.g < result.startedDay) result.startedDay = row.g;
      Object.keys(row.f).forEach(function (id) {
        var f = featureMap[id];
        if (row.f[id]>0) f.lastDay = f.lastDay===null ? row.g : Math.max(f.lastDay,row.g);
      });
      if (row.g < start) return;
      seenDays[row.g] = true;
      p.visits += row.a; p.seconds += row.s;
      if (used) p._days[row.g] = true;
      Object.keys(row.f).forEach(function (id) {
        var f = featureMap[id]; f.count += row.f[id]; if (row.f[id]>0) f._days[row.g] = true;
      });
    });
    result.pages.forEach(function (r) {
      r.days = Object.keys(r._days).length; delete r._days; result.seconds += r.seconds;
      if (!r.days) result.emptyPages.push(r.id);
    });
    result.features.forEach(function (r) {
      r.days = Object.keys(r._days).length; delete r._days;
      if (!r.count) result.emptyFeatures.push(r.id);
    });
    result.observedDays = Object.keys(seenDays).length;
    result.pages.sort(function (a,b) {return b.seconds-a.seconds || b.visits-a.visits;});
    return result;
  }
  Y.KullanimHesap = {sayfalar:pages,ozellikler:features,gun:day,sayfa:pageId,gecerli:valid,
    aktifAralik:active,gunlereBol:split,rapor:report,
    ozellikMi:function (id) { return member(features,id); },sayfaMi:function (id) { return member(pages,id); }};
})();
