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
  var K_GUNLUK = 'yds-gunluk-yeni';     // günlük yeni kelime kotası
  var K_YENI_SAYAC = 'yds-yeni-sayac';  // {g: gün, n: bugün açılan yeni kelime}

  /* Kutu numarasına göre tekrar aralığı (gün). */
  var ARALIK = { 1: 1, 2: 3, 3: 7, 4: 15, 5: 30 };
  var EN_UST_KUTU = 5;
  var GECMIS_SINIRI = 50;

  /* Günde kaç YENİ kelime açılacağı. Tekrarı gelenler bu kotaya dahil
     değildir — onlar zaten başlanmış kelimelerdir ve ertelenirse birikir. */
  var GUNLUK_VARSAYILAN = 20;

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

  /* Calisilmis her sey: {"abandon": {k: kutu, g: tekrar gunu}, …}
     Durum sayfasi bunu kullanir — kelime, obek, aile uyesi hepsi ayni tabloda. */
  function tumKayitlar() {
    var kopya = {};
    Object.keys(leitner).forEach(function (a) {
      kopya[a] = { k: leitner[a].k, g: leitner[a].g, kalan: Math.max(0, leitner[a].g - bugun()) };
    });
    return kopya;
  }

  /* Yalnizca BASLANMIS kelimeler icin: tekrar gunu geldi mi?
     Hic calisilmamis kelime "vadesi gelmis" sayilmaz — o yeni kelimedir ve
     gunluk kotayla acilir. Ikisini ayirmazsak ilk gun 7.859 kart cikardi. */
  function vadesiGeldiMi(en) {
    var kayit = leitner[en];
    if (!kayit) return false;
    return kayit.g <= bugun();
  }

  function yeniMi(en) { return !leitner[en]; }

  /* ---------- günlük yeni kelime kotası ---------- */

  function gunlukHedef() {
    var n = Depo.oku(K_GUNLUK, GUNLUK_VARSAYILAN);
    return (typeof n === 'number' && n > 0) ? n : GUNLUK_VARSAYILAN;
  }

  function gunlukHedefAyarla(n) {
    Depo.yaz(K_GUNLUK, Math.max(1, parseInt(n, 10) || GUNLUK_VARSAYILAN));
  }

  function bugunkuSayac() {
    var s = Depo.oku(K_YENI_SAYAC, null);
    return (s && s.g === bugun()) ? { n: s.n || 0, ek: s.ek || 0 } : { n: 0, ek: 0 };
  }

  function bugunAcilanYeni() { return bugunkuSayac().n; }

  /* Bugünün kotası = günlük hedef + kullanıcının elle eklediği pay. */
  function yeniKotasiKalan() {
    var s = bugunkuSayac();
    return Math.max(0, gunlukHedef() + s.ek - s.n);
  }

  /* "Devam et": kotayı bugünlük genişletir. Hedefi kalıcı değiştirmez. */
  function kotaArtir(n) {
    var s = bugunkuSayac();
    Depo.yaz(K_YENI_SAYAC, { g: bugun(), n: s.n, ek: s.ek + (parseInt(n, 10) || gunlukHedef()) });
  }

  function yeniAcildiSay() {
    var s = bugunkuSayac();
    Depo.yaz(K_YENI_SAYAC, { g: bugun(), n: s.n + 1, ek: s.ek });
  }

  /* Ayıklama: "bunu zaten biliyorum". Kelimeyi en üst kutuya koyar, yani
     30 gün sonraya atar. Hızlıca "Bildim" demekten farkı, kelimenin 1. kutuya
     düşüp ertesi gün tekrara gelmemesidir — 4.760 kelimeyi elden geçirirken
     yarın 4.760 tekrarlık çığ oluşmasın diye. */
  function zatenBiliyorum(en) {
    ilkKezIse(en);
    leitner[en] = { k: EN_UST_KUTU, g: bugun() + ARALIK[EN_UST_KUTU] };
    kaydet();
    return EN_UST_KUTU;
  }

  function kalanGun(en) {
    var kayit = leitner[en];
    if (!kayit) return 0;
    return Math.max(0, kayit.g - bugun());
  }

  /* Bir kelime ilk kez cevaplandığında günlük yeni sayacı artar. */
  function ilkKezIse(en) {
    if (yeniMi(en)) yeniAcildiSay();
  }

  /* Doğru bilindi: bir üst kutuya çık, tekrarı ilerlet. */
  function dogru(en) {
    ilkKezIse(en);
    var k = Math.min(EN_UST_KUTU, kutu(en) + 1);
    leitner[en] = { k: k, g: bugun() + ARALIK[k] };
    kaydet();
    return k;
  }

  /* İpucuyla bilindi: terfi ettirme, aynı kutuda bırak ve yeniden zamanla.
     Hiç çalışılmamış bir kelime bu yolla en fazla 1. kutuya girer. */
  function ipucuyla(en) {
    ilkKezIse(en);
    var k = Math.max(1, kutu(en));
    leitner[en] = { k: k, g: bugun() + ARALIK[k] };
    kaydet();
    return k;
  }

  /* Yanlış bilindi: birinci kutuya dön, yarın tekrar sor. */
  function yanlis(en) {
    ilkKezIse(en);
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

  /* Yalnizca verilen kayitlari sil. Kelimeler ve obekler ayni tabloyu
     paylastigi icin, bir sayfanin "sifirla" dugmesi digerini silmesin diye. */
  function listeyiSifirla(adlar) {
    (adlar || []).forEach(function (a) { delete leitner[a]; });
    kaydet();
  }

  /* Kutu dağılımı ve bugünün iş yükü.
       tekrar → tekrar günü gelmiş, başlanmış kelimeler (hepsi yapılmalı)
       yeni   → hiç çalışılmamış kelime havuzu
       acilacakYeni → bunlardan bugün kotaya sığan kadarı
       bugun  → destedeki toplam kart = tekrar + acilacakYeni            */
  function leitnerOzet(tumKelimeler) {
    var o = {
      k0: 0, k1: 0, k2: 0, k3: 0, k4: 0, k5: 0,
      tekrar: 0, yeni: 0, acilacakYeni: 0, bugun: 0,
      ogrenilen: 0, calisilan: 0,
      hedef: gunlukHedef(), kotaKalan: yeniKotasiKalan()
    };
    (tumKelimeler || []).forEach(function (kel) {
      var k = kutu(kel.en);
      o['k' + k]++;
      if (k > 0) o.calisilan++; else o.yeni++;
      if (k >= 4) o.ogrenilen++;
      if (vadesiGeldiMi(kel.en)) o.tekrar++;
    });
    o.acilacakYeni = Math.min(o.yeni, o.kotaKalan);
    o.bugun = o.tekrar + o.acilacakYeni;
    return o;
  }

  /* Bugünün destesi: tekrarı gelen her kelime + kotaya sığan yeni kelimeler.
     Liste [{en:…}] biçiminde gelir, aynı biçimde döner. */
  function destelik(tumKelimeler) {
    var liste = tumKelimeler || [];
    var tekrarlar = liste.filter(function (k) { return vadesiGeldiMi(k.en); });
    var yeniler = liste.filter(function (k) { return yeniMi(k.en); })
                       .slice(0, yeniKotasiKalan());
    return tekrarlar.concat(yeniler);
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

  /* ---------- konu takibi ---------- */

  /* Kaynak Excel'de her ünite için Durum / Tanı % / Gecikmeli % / Not
     sütunları vardı; onları burada tutuyoruz.
       d → 0 başlamadı · 1 çalışılıyor · 2 tamamlandı
       t → ilk çalışmadan sonraki test yüzdesi
       g → bir hafta sonraki gecikmeli test yüzdesi
       n → hata / örnek notu                                        */
  var K_KONU = 'yds-konular';

  function konuKayitlari() {
    var s = Depo.oku(K_KONU, {});
    return (s && typeof s === 'object') ? s : {};
  }

  function konu(kod) {
    return konuKayitlari()[kod] || { d: 0, t: null, g: null, n: '' };
  }

  function konuYaz(kod, alanlar) {
    var hepsi = konuKayitlari();
    var mevcut = hepsi[kod] || { d: 0, t: null, g: null, n: '' };
    Object.keys(alanlar).forEach(function (a) { mevcut[a] = alanlar[a]; });

    // Tamamen boş kayıt tutmaya gerek yok
    if (!mevcut.d && mevcut.t == null && mevcut.g == null && !mevcut.n) {
      delete hepsi[kod];
    } else {
      hepsi[kod] = mevcut;
    }
    Depo.yaz(K_KONU, hepsi);
    return mevcut;
  }

  function konuSifirla() { Depo.sil(K_KONU); }

  /* ---------- hepsini sıfırla ---------- */

  function hepsiniSifirla() {
    leitnerSifirla();
    yanlisTemizle();
    konuSifirla();
    kategoriSifirla();
    gecmisSifirla();
    Depo.sil('yds-rekor');
  }

  window.YDS.Ilerleme = {
    ARALIK: ARALIK,
    bugun: bugun,
    kutu: kutu,
    tumKayitlar: tumKayitlar,
    vadesiGeldiMi: vadesiGeldiMi,
    yeniMi: yeniMi,
    kalanGun: kalanGun,
    gunlukHedef: gunlukHedef,
    gunlukHedefAyarla: gunlukHedefAyarla,
    bugunAcilanYeni: bugunAcilanYeni,
    yeniKotasiKalan: yeniKotasiKalan,
    kotaArtir: kotaArtir,
    zatenBiliyorum: zatenBiliyorum,
    destelik: destelik,
    dogru: dogru,
    ipucuyla: ipucuyla,
    yanlis: yanlis,
    sifirlaKelime: sifirlaKelime,
    leitnerSifirla: leitnerSifirla,
    listeyiSifirla: listeyiSifirla,
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
    konu: konu,
    konuYaz: konuYaz,
    konuKayitlari: konuKayitlari,
    konuSifirla: konuSifirla,
    sonucEkle: sonucEkle,
    gecmis: gecmis,
    gecmisSifirla: gecmisSifirla,
    hepsiniSifirla: hepsiniSifirla
  };
})();
