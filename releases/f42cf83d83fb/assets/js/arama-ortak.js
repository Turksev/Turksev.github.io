/* ============================================================
   Ortak arama eşleştirmesi

   Site geneli arama sayfası (ara.js) ile çalışma sayfalarındaki sözlük
   paneli (sozluk.js) aynı eşleştirme ve sıralama kuralını kullanır. Kural
   burada tek yerde durur; iki arama zamanla birbirinden ayrışmaz.

   Sorgu (q) çağırandan sadeleştirilmiş gelir: küçük harf, Türkçe harfler
   ASCII karşılıklarına indirilmiş (window.YDS.sadelestir).
   ============================================================ */

(function () {
  'use strict';

  var Y = window.YDS = window.YDS || {};

  function sade(s) {
    return Y.sadelestir ? Y.sadelestir(s) : String(s || '').toLowerCase();
  }

  function kac(s) {
    return Y.kacar ? Y.kacar(s) : String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Eşleşen parçayı kalın göster. */
  function vurgula(metin, q) {
    var ham = String(metin == null ? '' : metin);
    var yer = sade(ham).indexOf(q);
    if (yer === -1) return kac(ham);
    return kac(ham.slice(0, yer)) + '<mark>' + kac(ham.slice(yer, yer + q.length)) +
           '</mark>' + kac(ham.slice(yer + q.length));
  }

  /* Uzun metinde eşleşmenin çevresinden kısa bir kesit al. */
  function kesit(metin, q, cevre) {
    var ham = String(metin == null ? '' : metin);
    var yer = sade(ham).indexOf(q);
    if (yer === -1) return kac(ham.slice(0, cevre * 2)) + (ham.length > cevre * 2 ? '…' : '');
    var bas = Math.max(0, yer - cevre);
    var son = Math.min(ham.length, yer + q.length + cevre);
    return (bas > 0 ? '…' : '') +
      kac(ham.slice(bas, yer)) + '<mark>' + kac(ham.slice(yer, yer + q.length)) + '</mark>' +
      kac(ham.slice(yer + q.length, son)) + (son < ham.length ? '…' : '');
  }

  function eslesir(havuz, q) { return sade(havuz).indexOf(q) !== -1; }

  /* 0 tam başlık · 1 başlık başı · 2 başlık içi · 3 anlam · 4 örnek · 9 yok */
  function eslesmePuani(baslik, anlam, ornek, q) {
    var b = sade(baslik);
    if (b === q) return 0;
    if (b.indexOf(q) === 0) return 1;
    if (b.indexOf(q) !== -1) return 2;
    if (eslesir(anlam, q)) return 3;
    return eslesir(ornek, q) ? 4 : 9;
  }

  /* Aynı dizi her aramada yeniden sadeleştirilmesin: dizi başına bir kez hazırlanır.
     Sıralama eskisiyle birebir aynıdır; puan eşleşme başına bir kez hesaplanır ve
     Array.prototype.sort kararlıdır. */
  var hazirlar = typeof WeakMap === 'function' ? new WeakMap() : null;
  function hazirla(liste, uret) {
    var k = hazirlar && hazirlar.get(liste);
    if (!k || k.length !== liste.length) {
      k = liste.map(uret);
      if (hazirlar) hazirlar.set(liste, k);
    }
    return k;
  }
  function puan(b, a, o, q) {
    if (b === q) return 0;
    if (b.indexOf(q) === 0) return 1;
    if (b.indexOf(q) !== -1) return 2;
    if (a.indexOf(q) !== -1) return 3;
    return o.indexOf(q) !== -1 ? 4 : 9;
  }
  function puanaGore(x, y) { return x.p - y.p; }

  /* Dizin kayıtları ({e, t, y}) içinde başlık, kısa anlam veya türde geçenler,
     en iyi eşleşme önce. */
  function kelimeler(dizin, q) {
    dizin = dizin || [];
    var on = hazirla(dizin, function (d) {
      return { h: sade(d.e + ' ' + d.t + ' ' + d.y), b: sade(d.e), a: sade(d.t), o: sade(d.y) };
    });
    var eslesen = [];
    for (var i = 0; i < dizin.length; i++) {
      if (on[i].h.indexOf(q) === -1) continue;
      eslesen.push({ d: dizin[i], p: puan(on[i].b, on[i].a, on[i].o, q) });
    }
    return eslesen.sort(puanaGore).map(function (x) { return x.d; });
  }

  /* Öbekler için puanlı eşleşmeler: [{o, p}], p < 9. p === 4 yalnız örnek
     cümlede geçen öbektir; çağıran bunları ayrı gösterebilir. */
  function obekler(liste, q) {
    liste = liste || [];
    var on = hazirla(liste, function (o) {
      return {
        b: sade(o.f),
        a: sade(o.y + ' ' + o.a.map(function (a) { return a.tr; }).join(' ')),
        o: sade(o.a.map(function (a) { return a.ex + ' ' + a.exTr; }).join(' '))
      };
    });
    var sonuc = [];
    for (var i = 0; i < liste.length; i++) {
      var p = puan(on[i].b, on[i].a, on[i].o, q);
      if (p < 9) sonuc.push({ o: liste[i], p: p });
    }
    return sonuc.sort(puanaGore);
  }

  Y.AramaOrtak = {
    vurgula: vurgula,
    kesit: kesit,
    eslesir: eslesir,
    eslesmePuani: eslesmePuani,
    kelimeler: kelimeler,
    obekler: obekler
  };
})();
