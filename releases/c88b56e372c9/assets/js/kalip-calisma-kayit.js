/* Soru başına yerel kayıt: farklı sekmeler farklı soruların sonucunu ezmez.
   Bulut alanlarına ve kelime tekrar kutularına yazmaz. */
(function () {
  'use strict';
  var Y = window.YDS = window.YDS || {}, D = Y.Depo;
  var PREFIX = 'yds-kalip-calisma-v1:', EPOCH = 'yds-kalip-calisma-epoch-v1', SESSION = 'yds-kalip-tur-v1', PENDING = 'yds-kalip-bekleyen-v1';
  var bekleyen = Object.create(null), bellekEpoch = null;
  function bekleyenSakla() {
    try {
      if (Object.keys(bekleyen).length) sessionStorage.setItem(PENDING, JSON.stringify({v:1,epoch:bellekEpoch,kayitlar:bekleyen}));
      else sessionStorage.removeItem(PENDING);
    } catch (e) { /* Yazım hatası çağırana bildirilir; bellek içi sonuç korunur. */ }
  }
  function epoch() { var e = D.oku(EPOCH, 'ilk'); return typeof e === 'string' ? e : 'ilk'; }
  function esle() { var e = epoch(); if (bellekEpoch !== e) { bekleyen = Object.create(null); bellekEpoch = e; } return e; }
  function disk(id) { return D.oku(PREFIX + id, null); }
  function guncelBekleyen(id, mevcut) {
    var p = bekleyen[id];
    // Beklerken başka sekme bu soruyu yanıtladıysa eski sonucu yeniden yazma.
    if (p && JSON.stringify(mevcut) !== p.onceki) { delete bekleyen[id]; bekleyenSakla(); return null; }
    return p;
  }
  function geriYukle(bank) {
    var e = esle(), saved;
    try { saved = JSON.parse(sessionStorage.getItem(PENDING)); } catch (error) { saved = null; }
    if (saved && saved.v === 1 && saved.epoch === e && saved.kayitlar) {
      bank.sorular.forEach(function (s) {
        var p = saved.kayitlar[s.id], r = p && p.kayit;
        if (r && r.v === 1 && r.epoch === e && r.ozet === s.ozet &&
            typeof p.onceki === 'string' && ['dogru','yanlis'].indexOf(r.sonuc) !== -1) bekleyen[s.id] = p;
      });
    }
    return tekrarYaz();
  }
  function oku(bank) {
    var e = esle(), out = Object.create(null);
    bank.sorular.forEach(function (s) {
      var mevcut = disk(s.id), p = guncelBekleyen(s.id, mevcut), r = p ? p.kayit : mevcut;
      if (r && r.v === 1 && r.epoch === e && r.ozet === s.ozet && ['dogru','yanlis'].indexOf(r.sonuc) !== -1) out[s.id] = r;
    });
    return out;
  }
  function yaz(s, dogru) {
    var r = {v:1, epoch:esle(), ozet:s.ozet, sonuc:dogru ? 'dogru' : 'yanlis',
      islem:Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)};
    bekleyen[s.id] = {kayit:r, onceki:JSON.stringify(disk(s.id))};
    return tekrarYaz();
  }
  function tekrarYaz() {
    esle(); var ok = true;
    Object.keys(bekleyen).forEach(function (id) {
      var p = guncelBekleyen(id, disk(id));
      if (!p) return;
      if (D.yaz(PREFIX + id, p.kayit) === false) ok = false; else delete bekleyen[id];
    });
    bekleyenSakla();
    return ok;
  }
  function sifirla() {
    var e = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    if (D.yaz(EPOCH, e) === false) return false;
    bellekEpoch = e; bekleyen = Object.create(null);
    var ok = true;
    try {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(PREFIX) === 0) keys.push(k); }
      keys.forEach(function (k) { if (D.sil(k) === false) ok = false; });
      sessionStorage.removeItem(SESSION);
      sessionStorage.removeItem(PENDING);
    } catch (error) { ok = false; }
    window.dispatchEvent(new CustomEvent('yds-kalip-sifirlandi'));
    return ok;
  }
  window.addEventListener('storage', function (e) { if (e.key === null || e.key === EPOCH) { bekleyen = Object.create(null); bellekEpoch = null; bekleyenSakla(); } });
  Y.KalipCalismaKayit = {oku:oku, yaz:yaz, tekrarYaz:tekrarYaz, geriYukle:geriYukle, sifirla:sifirla, epoch:epoch, prefix:PREFIX, epochKey:EPOCH, sessionKey:SESSION};
})();
