/* ============================================================
   İlerleme modülü — tüm sayfaların paylaştığı öğrenme durumu

   Sakladıkları (localStorage):
     yds-leitner   { "abandon": {k: kutu 1-5, g: sonraki tekrar günü}, ... }
     yds-yanlis    yanlış cevaplanan soruların defteri
     yds-kategori  { "Kelime": {d: doğru, y: yanlış}, ... }
     yds-gecmis    son 50 test sonucu
     yds-bilinen   (eski sürüm) ilk açılışta Leitner'a taşınır

   Gün hesabı: yerel saat diliminde gün numarası. Saat farkı sorunları
   olmasın diye tarih değil, "epoch'tan bu yana kaçıncı gün" saklanır.
   ============================================================ */

(function () {
  'use strict';

  var Depo = window.YDS.Depo;

  var K_LEITNER = 'yds-leitner';
  var K_YANLIS = 'yds-yanlis';
  var K_KATEGORI = 'yds-kategori';
  var K_GECMIS = 'yds-gecmis';
  var K_BILINEN = 'yds-bilinen';

  /* Kutu numarasına göre tekrar aralığı (gün). */
  var ARALIK = { 1: 1, 2: 3, 3: 7, 4: 15, 5: 30 };
  var EN_UST_KUTU = 5;
  var GECMIS_SINIRI = 50;

  // Yerel gece yarısına göre gün numarası. Tüm karşılaştırmalar aynı
  // referansı kullandığı için saat dilimi kayması sorun çıkarmaz.
  function bugun() {
    var d = new Date();
    var geceYarisi = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return Math.floor(geceYarisi / 86400000);
  }

  /* ---------- Leitner ---------- */

  var leitner = Depo.oku(K_LEITNER, null);

  // Eski "bilinen kelimeler" listesini bir kez Leitner'a taşı.
  if (!leitner) {
    leitner = {};
    var eski = Depo.oku(K_BILINEN, []);
    if (Array.isArray(eski)) {
      eski.forEach(function (en) {
        leitner[en] = { k: 4, g: bugun() + ARALIK[4] };
      });
    }
    Depo.yaz(K_LEITNER, leitner);
  }

  function kaydet() { Depo.yaz(K_LEITNER, leitner); }

  function kutu(en) {
    return leitner[en] ? leitner[en].k : 0;
  }

  function vadesiGeldiMi(en) {
    var kayit = leitner[en];
    if (!kayit) return true;              // hiç çalışılmamış → bugünün destesinde
    return kayit.g <= bugun();
  }

  function kalanGun(en) {
    var kayit = leitner[en];
    if (!kayit) return 0;
    return Math.max(0, kayit.g - bugun());
  }

  /* Doğru bilindi: bir üst kutuya çık, tekrarı ilerlet. */
  function dogru(en) {
    var k = Math.min(EN_UST_KUTU, kutu(en) + 1);
    leitner[en] = { k: k, g: bugun() + ARALIK[k] };
    kaydet();
    return k;
  }

  /* İpucuyla bilindi: terfi ettirme, aynı kutuda bırak ve yeniden zamanla.
     Hiç çalışılmamış bir kelime bu yolla en fazla 1. kutuya girer. */
  function ipucuyla(en) {
    var k = Math.max(1, kutu(en));
    leitner[en] = { k: k, g: bugun() + ARALIK[k] };
    kaydet();
    return k;
  }

  /* Yanlış bilindi: birinci kutuya dön, yarın tekrar sor. */
  function yanlis(en) {
    leitner[en] = { k: 1, g: bugun() + ARALIK[1] };
    kaydet();
    return 1;
  }

  function sifirlaKelime(en) {
    delete leitner[en];
    kaydet();
  }

  function leitnerSifirla() {
    leitner = {};
    Depo.yaz(K_LEITNER, leitner);
    Depo.sil(K_BILINEN);
  }

  /* Kutu dağılımı ve bugün tekrarı gelen kelime sayısı. */
  function leitnerOzet(tumKelimeler) {
    var o = { k0: 0, k1: 0, k2: 0, k3: 0, k4: 0, k5: 0, bugun: 0, ogrenilen: 0, calisilan: 0 };
    (tumKelimeler || []).forEach(function (kel) {
      var k = kutu(kel.en);
      o['k' + k]++;
      if (k > 0) o.calisilan++;
      if (k >= 4) o.ogrenilen++;
      if (vadesiGeldiMi(kel.en)) o.bugun++;
    });
    return o;
  }

  /* ---------- yanlış defteri ---------- */

  function yanlisAnahtar(soru) {
    return (soru.kat || '') + '|' + (soru.soru || soru.s || '');
  }

  function yanlisEkle(kayit) {
    var defter = Depo.oku(K_YANLIS, []);
    if (!Array.isArray(defter)) defter = [];
    var anahtar = yanlisAnahtar(kayit);
    var mevcut = defter.filter(function (y) { return y.a === anahtar; })[0];
    if (mevcut) {
      mevcut.n = (mevcut.n || 1) + 1;      // kaç kez yanlış yapıldı
      mevcut.t = Date.now();
    } else {
      defter.push({ a: anahtar, kat: kayit.kat, n: 1, t: Date.now() });
    }
    Depo.yaz(K_YANLIS, defter);
  }

  /* Doğru cevaplanınca defterden düş. */
  function yanlisCoz(kayit) {
    var defter = Depo.oku(K_YANLIS, []);
    if (!Array.isArray(defter)) return;
    var anahtar = yanlisAnahtar(kayit);
    var kalan = defter.filter(function (y) { return y.a !== anahtar; });
    if (kalan.length !== defter.length) Depo.yaz(K_YANLIS, kalan);
  }

  function yanlisDefter() {
    var d = Depo.oku(K_YANLIS, []);
    return Array.isArray(d) ? d : [];
  }

  function yanlisAnahtarlari() {
    var kume = {};
    yanlisDefter().forEach(function (y) { kume[y.a] = true; });
    return kume;
  }

  function yanlisTemizle() { Depo.sil(K_YANLIS); }

  /* ---------- kategori istatistiği ---------- */

  function kategoriKaydet(kat, dogruMu) {
    var s = Depo.oku(K_KATEGORI, {});
    if (!s || typeof s !== 'object') s = {};
    if (!s[kat]) s[kat] = { d: 0, y: 0 };
    if (dogruMu) s[kat].d++; else s[kat].y++;
    Depo.yaz(K_KATEGORI, s);
  }

  function kategoriOzet() {
    var s = Depo.oku(K_KATEGORI, {});
    if (!s || typeof s !== 'object') return [];
    return Object.keys(s).map(function (kat) {
      var toplam = s[kat].d + s[kat].y;
      return {
        kat: kat,
        dogru: s[kat].d,
        yanlis: s[kat].y,
        toplam: toplam,
        yuzde: toplam ? Math.round(s[kat].d / toplam * 100) : 0
      };
    }).sort(function (a, b) { return a.yuzde - b.yuzde; });   // en zayıf önce
  }

  function kategoriSifirla() { Depo.sil(K_KATEGORI); }

  /* ---------- test geçmişi ---------- */

  function sonucEkle(kayit) {
    var g = Depo.oku(K_GECMIS, []);
    if (!Array.isArray(g)) g = [];
    g.push({
      t: Date.now(),
      d: kayit.dogru,
      n: kayit.toplam,
      y: kayit.yuzde,
      m: kayit.mod || 'alistirma'
    });
    if (g.length > GECMIS_SINIRI) g = g.slice(-GECMIS_SINIRI);
    Depo.yaz(K_GECMIS, g);
  }

  function gecmis() {
    var g = Depo.oku(K_GECMIS, []);
    return Array.isArray(g) ? g : [];
  }

  function gecmisSifirla() { Depo.sil(K_GECMIS); }

  /* ---------- hepsini sıfırla ---------- */

  function hepsiniSifirla() {
    leitnerSifirla();
    yanlisTemizle();
    kategoriSifirla();
    gecmisSifirla();
    Depo.sil('yds-rekor');
  }

  window.YDS.Ilerleme = {
    ARALIK: ARALIK,
    bugun: bugun,
    kutu: kutu,
    vadesiGeldiMi: vadesiGeldiMi,
    kalanGun: kalanGun,
    dogru: dogru,
    ipucuyla: ipucuyla,
    yanlis: yanlis,
    sifirlaKelime: sifirlaKelime,
    leitnerSifirla: leitnerSifirla,
    leitnerOzet: leitnerOzet,
    yanlisAnahtar: yanlisAnahtar,
    yanlisEkle: yanlisEkle,
    yanlisCoz: yanlisCoz,
    yanlisDefter: yanlisDefter,
    yanlisAnahtarlari: yanlisAnahtarlari,
    yanlisTemizle: yanlisTemizle,
    kategoriKaydet: kategoriKaydet,
    kategoriOzet: kategoriOzet,
    kategoriSifirla: kategoriSifirla,
    sonucEkle: sonucEkle,
    gecmis: gecmis,
    gecmisSifirla: gecmisSifirla,
    hepsiniSifirla: hepsiniSifirla
  };
})();
