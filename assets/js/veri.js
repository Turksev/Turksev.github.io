/* ============================================================
   Veri katmanı — kelime dizini ve katman dosyalarının yüklenmesi

   Dizin (data/kelime-dizin.js) her sayfada yüklüdür: dizindeki bütün kelimelerin
   yazılışı, kısa anlamı, puanı, katmanı ve türü. Liste, arama, filtre
   ve tekrar özeti yalnız bunu kullanır.

   Örnek cümleler katman dosyalarındadır (data/kelime-k1..k7.js) ve
   ancak o katmandan çalışılmak istendiğinde indirilir. Böylece kelime
   sayfası 2,4 MB'ı bir kerede yüklemek zorunda kalmaz.
   ============================================================ */

(function () {
  'use strict';

  var KATMANLAR = [1, 2, 3, 4, 5, 6, 7];
  var KATMAN_ADI = {
    1: 'Temel', 2: 'Çekirdek', 3: 'Orta', 4: 'İleri', 5: 'Geniş', 6: 'Geniş+', 7: 'Aile üyeleri'
  };
  var KATMAN_ACIKLAMA = {
    1: 'Sınavın her yerinde geçen çok temel kelimeler — büyük olasılıkla zaten biliyorsun.',
    2: 'YDS çekirdeği. Buradan başlamak en verimlisi.',
    3: 'Orta sıklıkta, sınavda düzenli çıkan kelimeler.',
    4: 'Daha seyrek ama puan getiren ileri kelimeler.',
    5: 'Uzun kuyruk. Çekirdeği bitirdiysen buraya geç.',
    6: 'Seyrek kelimeler (10–15 puan). Okuma parçalarında rastlarsın; çok geniş bir havuz.',
    7: 'Kelime ailelerini tamamlayan türevler. Sınav kanıtı zayıf ama türetme sorusu için değerli.'
  };

  var dizin = window.KELIME_DIZIN || [];
  var yukluKatmanlar = {};        // {2: true, ...}
  var yukleniyor = {};            // katman -> Promise (aynı anda iki kez indirme)
  var kelimeKatmani = {};         // "abandon" -> 3

  dizin.forEach(function (d) { kelimeKatmani[d.e] = d.k; });

  /* ---------- katman yükleme ---------- */

  function dosyaYolu(k) { return 'data/kelime-k' + k + '.js'; }

  function katmanYukle(k) {
    if (yukluKatmanlar[k]) return Promise.resolve(k);
    if (yukleniyor[k]) return yukleniyor[k];

    yukleniyor[k] = new Promise(function (coz, reddet) {
      var s = document.createElement('script');
      s.src = dosyaYolu(k);
      s.async = true;
      s.onload = function () {
        yukluKatmanlar[k] = true;
        delete yukleniyor[k];
        coz(k);
      };
      s.onerror = function () {
        delete yukleniyor[k];
        reddet(new Error(k + '. katman yüklenemedi'));
      };
      document.head.appendChild(s);
    });
    return yukleniyor[k];
  }

  function katmanlariYukle(liste) {
    return Promise.all((liste || []).map(katmanYukle));
  }

  function katmanYukluMu(k) { return !!yukluKatmanlar[k]; }

  /* ---------- kayıt erişimi ---------- */

  /* Tam kayıt: {a:[{tr,ex,exTr}], es?}. Katman yüklü değilse null döner. */
  function kayit(en) {
    var k = kelimeKatmani[en];
    if (!k) return null;
    var tablo = window['KELIME_K' + k];
    return (tablo && tablo[en]) || null;
  }

  function katmani(en) { return kelimeKatmani[en] || 0; }

  /* Dizin kaydı (kısa bilgi) — her zaman erişilebilir. */
  var dizinHarita = {};
  dizin.forEach(function (d) { dizinHarita[d.e] = d; });
  function dizinKaydi(en) { return dizinHarita[en] || null; }

  /* ---------- öbekler ---------- */

  var obekYukleniyor = null;

  function obekleriYukle() {
    if (window.OBEKLER) return Promise.resolve(window.OBEKLER);
    if (obekYukleniyor) return obekYukleniyor;

    obekYukleniyor = new Promise(function (coz, reddet) {
      var s = document.createElement('script');
      s.src = 'data/obekler.js';
      s.async = true;
      s.onload = function () { coz(window.OBEKLER || []); };
      s.onerror = function () { obekYukleniyor = null; reddet(new Error('Öbekler yüklenemedi')); };
      document.head.appendChild(s);
    });
    return obekYukleniyor;
  }

  /* ---------- özet ---------- */

  function katmanSayilari() {
    var s = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    dizin.forEach(function (d) { s[d.k]++; });
    return s;
  }

  window.YDS.Veri = {
    KATMANLAR: KATMANLAR,
    KATMAN_ADI: KATMAN_ADI,
    KATMAN_ACIKLAMA: KATMAN_ACIKLAMA,
    dizin: dizin,
    dizinKaydi: dizinKaydi,
    kayit: kayit,
    katmani: katmani,
    katmanYukle: katmanYukle,
    katmanlariYukle: katmanlariYukle,
    katmanYukluMu: katmanYukluMu,
    katmanSayilari: katmanSayilari,
    obekleriYukle: obekleriYukle
  };
})();
