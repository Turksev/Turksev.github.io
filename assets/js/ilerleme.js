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
  var Motor = window.YDS.EsitlemeMotoru;

  function ilerlemeKimligi(en, tur) {
    return Motor && Motor.ilerlemeKimligi
      ? Motor.ilerlemeKimligi(en, tur || 'kelime')
      : String(en || '');
  }

  function kimlikCoz(id) {
    return Motor && Motor.ilerlemeKimliginiCoz
      ? Motor.ilerlemeKimliginiCoz(id)
      : { ad: String(id || ''), tur: '' };
  }

  function leitnerKaydiSec(a, b) {
    if (!a) return b;
    if (!b) return a;
    var ca = typeof a.c === 'number' ? a.c : (a.g || 0);
    var cb = typeof b.c === 'number' ? b.c : (b.g || 0);
    if (ca !== cb) return ca > cb ? a : b;
    return (a.k || 0) >= (b.k || 0) ? a : b;
  }

  var K_LEITNER = 'yds-leitner';
  var K_YANLIS = 'yds-yanlis';
  var K_KATEGORI = 'yds-kategori';
  var K_GECMIS = 'yds-gecmis';
  var K_BILINEN = 'yds-bilinen';
  var K_TEST_YANLIS = 'yds-test-yanlis';  // günün testinde bilinemeyen kelimeler {en: {n, t}}
  var K_YEDEK = 'yds-son-yedek';          // sıfırlamadan hemen önceki hal (geri almak için)
  var K_GUNLUK = 'yds-gunluk-yeni';     // günlük yeni kelime kotası
  var K_YENI_SAYAC = 'yds-yeni-sayac';  // {g: gün, n: bugün açılan yeni kelime}
  var K_TAVAN = 'yds-gunluk-tavan';     // günlük TOPLAM kart sınırı (yeni + tekrar)

  /* Kutu numarasına göre tekrar aralığı (gün). */
  var ARALIK = { 1: 1, 2: 3, 3: 7, 4: 15, 5: 30 };
  /* 5. kutu öğrenilmiş sayılır; fakat kalıcılığı ölçmek için 30, 90 ve
     ardından 180 günlük bakım tekrarları sürer. Eski 5. kutu kayıtları
     zaten bir sonraki günlerini `g` alanında taşıdığı için veri göçü gerekmez. */
  var BAKIM_ARALIK = [30, 90, 180];
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

  var okunanLeitner = Depo.oku(K_LEITNER, null);
  var leitner = (okunanLeitner && typeof okunanLeitner === 'object' &&
    !Array.isArray(okunanLeitner)) ? okunanLeitner : {};

  // Eski "bilinen kelimeler" listesini mevcut Leitner'a kayıpsız ekle.
  // Kaynak anahtar ancak yeni zarf gerçekten yazıldıktan sonra tüketilir;
  // kota/gizli mod hatasında sonraki açılış güvenle yeniden dener.
  var eskiBilinen = Depo.oku(K_BILINEN, null);
  if (Array.isArray(eskiBilinen)) {
    var gocAdayi = {};
    Object.keys(leitner).forEach(function (en) { gocAdayi[en] = leitner[en]; });
    eskiBilinen.forEach(function (en) {
      en = ilerlemeKimligi(en, 'kelime');
      // Eski liste yalnız eksik kartları tamamlar. Kaynak anahtarın silinmesi
      // ayrı bir nedenle başarısız olup göç yeniden denenirse, sonradan
      // çalışılmış mevcut kartı tekrar 4. kutuya yükseltmez.
      if (!gocAdayi[en]) gocAdayi[en] = { k: 4, g: bugun() + ARALIK[4] };
    });
    if (Depo.yaz(K_LEITNER, gocAdayi) !== false) {
      leitner = gocAdayi;
      Depo.sil(K_BILINEN);
    }
  } else if (!okunanLeitner) {
    // Boş başlangıcı da yalnız başarılı yazımdan sonra kalıcı kabul et.
    Depo.yaz(K_LEITNER, leitner);
  }

  function leitnerKopyasi() {
    var sonuc = {};
    Object.keys(leitner).forEach(function (en) { sonuc[en] = leitner[en]; });
    return sonuc;
  }

  function kaydet(aday) {
    var basarili = Depo.yaz(K_LEITNER, aday) !== false;
    if (basarili) leitner = aday;
    return basarili;
  }

  function leitneriTazele() {
    var guncel = Depo.oku(K_LEITNER, {});
    leitner = (guncel && typeof guncel === 'object' && !Array.isArray(guncel)) ? guncel : {};
  }

  function kayitYaz(en, kayit, tur) {
    en = ilerlemeKimligi(en, tur);
    var aday = leitnerKopyasi();
    aday[en] = kayit;
    var basarili;
    if (Depo.kayitlariYaz) {
      var degisiklik = {};
      degisiklik[en] = kayit;
      basarili = Depo.kayitlariYaz(K_LEITNER, degisiklik) !== false;
      if (basarili) leitneriTazele();
    } else basarili = kaydet(aday);
    return basarili;
  }

  function kayitlariYaz(degisiklikler, tur) {
    var duzeltilmis = {};
    var aday = leitnerKopyasi();
    Object.keys(degisiklikler || {}).forEach(function (en) {
      var yeni = tur === 'depo' ? en : ilerlemeKimligi(en, tur);
      duzeltilmis[yeni] = leitnerKaydiSec(duzeltilmis[yeni], degisiklikler[en]);
    });
    Object.keys(duzeltilmis).forEach(function (en) { aday[en] = duzeltilmis[en]; });
    var basarili;
    if (Depo.kayitlariYaz) {
      basarili = Depo.kayitlariYaz(K_LEITNER, duzeltilmis) !== false;
      if (basarili) leitneriTazele();
    } else basarili = kaydet(aday);
    return basarili;
  }

  function kayitlariSil(adlar, tur) {
    var duzeltilmis = (adlar || []).map(function (en) {
      return ilerlemeKimligi(en, tur);
    });
    var aday = leitnerKopyasi();
    duzeltilmis.forEach(function (en) { delete aday[en]; });
    var basarili;
    if (Depo.kayitlariSil) {
      basarili = Depo.kayitlariSil(K_LEITNER, duzeltilmis) !== false;
      if (basarili) leitneriTazele();
    } else basarili = kaydet(aday);
    return basarili;
  }

  // Başka sekme veya bulut yeni bir zarf uyguladığında bellekteki Leitner
  // kopyasını da yenile; sonraki kart eski anlık görüntüyü geri yazmasın.
  window.addEventListener('yds-depo-degisti', function (e) {
    var adlar = e && e.detail && e.detail.anahtarlar;
    if (adlar && adlar.indexOf(K_LEITNER) !== -1) leitneriTazele();
  });

  function kutu(en, tur) {
    en = ilerlemeKimligi(en, tur);
    return leitner[en] ? leitner[en].k : 0;
  }

  function kayit(en, tur) {
    en = ilerlemeKimligi(en, tur);
    var r = leitner[en];
    if (!r) return null;
    return {
      k: r.k,
      g: r.g,
      c: r.c,
      m: r.m || 0,
      kalan: Math.max(0, r.g - bugun())
    };
  }

  /* Calisilmis her sey: {"abandon": {k: kutu, g: tekrar gunu}, …}
     Durum sayfasi bunu kullanir — kelime, obek, aile uyesi hepsi ayni tabloda. */
  function tumKayitlar() {
    var kopya = {};
    Object.keys(leitner).forEach(function (a) {
      kopya[a] = {
        k: leitner[a].k,
        g: leitner[a].g,
        c: leitner[a].c,
        m: leitner[a].m || 0,
        kalan: Math.max(0, leitner[a].g - bugun())
      };
    });
    return kopya;
  }

  /* Yalnizca BASLANMIS kelimeler icin: tekrar gunu geldi mi?
     Hic calisilmamis kelime "vadesi gelmis" sayilmaz — o yeni kelimedir ve
     gunluk kotayla acilir. Ikisini ayirmazsak ilk gun 7.848 kart cikardi. */
  /* En üst kutuya çıkan kelime öğrenilmiş sayılır; düşük sıklıklı bakım
     tekrarları yine de gelir. Bu, uzun süre kullanılmayan kelimelerin sessizce
     unutulmasını önler. */
  function mezunMu(en, tur) { return kutu(en, tur) >= EN_UST_KUTU; }

  function vadesiGeldiMi(en, tur) {
    en = ilerlemeKimligi(en, tur);
    var kayit = leitner[en];
    if (!kayit) return false;
    return kayit.g <= bugun();
  }

  function yeniMi(en, tur) { return !leitner[ilerlemeKimligi(en, tur)]; }

  /* ---------- günlük yeni kelime kotası ---------- */

  function gunlukHedef() {
    var n = Depo.oku(K_GUNLUK, GUNLUK_VARSAYILAN);
    return (typeof n === 'number' && n > 0) ? n : GUNLUK_VARSAYILAN;
  }

  function gunlukHedefAyarla(n) {
    Depo.yaz(K_GUNLUK, Math.max(1, parseInt(n, 10) || GUNLUK_VARSAYILAN));
  }

  /* ---------- günlük toplam kart tavanı ----------
     Tekrarlar eskiden sınırsızdı: aylarca biriken vadeler tek destede karşına
     çıkıyordu. Tavan, destenin boyunu senin belirlediğin sayıda tutar.
     Vadesi gelmiş tekrarlar kapasiteyi önce kullanır; kalan yer yeni kartlara
     ayrılır. Böylece tekrar borcu büyürken yeni kart yükü otomatik azalır. */

  var TAVAN_VARSAYILAN = 30;

  function gunlukTavan() {
    var n = Depo.oku(K_TAVAN, TAVAN_VARSAYILAN);
    return (typeof n === 'number' && n > 0) ? n : TAVAN_VARSAYILAN;
  }

  function gunlukTavanAyarla(n) {
    Depo.yaz(K_TAVAN, Math.max(1, parseInt(n, 10) || TAVAN_VARSAYILAN));
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
    return Depo.yaz(K_YENI_SAYAC,
      { g: bugun(), n: s.n + 1, ek: s.ek }) !== false;
  }

  /* Ayıklama: "bunu zaten biliyorum". Kelimeyi en üst kutuya koyar, yani
     doğrudan mezun eder. Hızlıca "Bildim" demekten farkı, kelimenin 1. kutuya
     düşüp ertesi gün tekrara gelmemesidir — 4.760 kelimeyi elden geçirirken
     yarın 4.760 tekrarlık çığ oluşmasın diye. */
  function zatenBiliyorum(en, tur) {
    var ilk = yeniMi(en, tur);
    var onceki = kutu(en, tur);
    if (!kayitYaz(en,
      { k: EN_UST_KUTU, g: bugun() + BAKIM_ARALIK[0], c: bugun(), m: 0 }, tur)) return false;
    if (ilk) yeniAcildiSay();
    return EN_UST_KUTU;
  }

  function kalanGun(en, tur) {
    en = ilerlemeKimligi(en, tur);
    var kayit = leitner[en];
    if (!kayit) return 0;
    return Math.max(0, kayit.g - bugun());
  }

  /* Doğru bilindi: bir üst kutuya çık, tekrarı ilerlet. */
  function dogru(en, tur) {
    var ilk = yeniMi(en, tur);
    var onceki = kutu(en, tur);
    var k = Math.min(EN_UST_KUTU, onceki + 1);
    var eski = leitner[ilerlemeKimligi(en, tur)] || {};
    var m = k >= EN_UST_KUTU ? (onceki >= EN_UST_KUTU ? (eski.m || 0) + 1 : 0) : 0;
    var aralik = k >= EN_UST_KUTU
      ? BAKIM_ARALIK[Math.min(m, BAKIM_ARALIK.length - 1)]
      : ARALIK[k];
    if (!kayitYaz(en, { k: k, g: bugun() + aralik, c: bugun(), m: m }, tur)) return false;
    if (ilk) yeniAcildiSay();
    return k;
  }

  /* İpucuyla bilindi: terfi ettirme, aynı kutuda bırak ve yeniden zamanla.
     Hiç çalışılmamış bir kelime bu yolla en fazla 1. kutuya girer. */
  function ipucuyla(en, tur) {
    var ilk = yeniMi(en, tur);
    var onceki = kutu(en, tur);
    var k = Math.max(1, onceki);
    var eski = leitner[ilerlemeKimligi(en, tur)] || {};
    var aralik = k >= EN_UST_KUTU
      ? BAKIM_ARALIK[Math.min(eski.m || 0, BAKIM_ARALIK.length - 1)]
      : ARALIK[k];
    if (!kayitYaz(en, { k: k, g: bugun() + aralik, c: bugun(), m: eski.m || 0 }, tur)) return false;
    if (ilk) yeniAcildiSay();
    return k;
  }

  /* Yanlış bilindi: BİR kutu geri düş (sıfırlanma yok), yarın tekrar sor.
     Bir aydır bildiğin kelimeyi tek şaşırmada baştan başlatmak, tekrar yükünü
     katlıyordu; bir kutu geri düşmek hem cezayı hem yükü ölçülü tutar. */
  function yanlis(en, tur) {
    var ilk = yeniMi(en, tur);
    var onceki = kutu(en, tur);
    var k = Math.max(1, onceki - 1);
    // Hangi kutuya düşerse düşsün yarın sorulur.
    if (!kayitYaz(en, { k: k, g: bugun() + 1, c: bugun(), m: 0 }, tur)) return false;
    if (ilk) yeniAcildiSay();
    return k;
  }

  /* ---------- birikmiş tekrarları takvime yayma ----------
     Eski kurgu (her "Bilemedim" 1. kutuya atıyordu, tekrarlara tavan yoktu)
     yüzlerce kelimeyi aynı güne yığmış olabilir. Bu tek seferlik düzeltme
     kayıtları SİLMEZ: verilen havuzdaki vadesi geçmiş kelimeleri, en çok
     gecikmiş olan önce gelecek şekilde günlük tavana göre günlere dağıtır.
     Döndürdüğü değer: {tasinan, gun}. */

  function birikmisiYay(adlar, gunlukPay, tur) {
    var pay = Math.max(1, parseInt(gunlukPay, 10) || gunlukTavan());
    var b = bugun();
    var kapsam = Object.create(null);
    (adlar || []).forEach(function (ad) { kapsam[ilerlemeKimligi(ad, tur)] = true; });
    var gecikmis = Object.keys(leitner).filter(function (en) {
      var r = leitner[en];
      return kapsam[en] && r && r.k > 0 && r.g <= b;
    }).sort(function (x, y) { return leitner[x].g - leitner[y].g; });

    if (gecikmis.length <= pay) return { tasinan: 0, gun: 0 };

    var degisiklikler = {};
    gecikmis.forEach(function (en, i) {
      var kayit = {};
      Object.keys(leitner[en]).forEach(function (alan) { kayit[alan] = leitner[en][alan]; });
      kayit.g = b + Math.floor(i / pay);
      degisiklikler[en] = kayit;
    });
    if (!kayitlariYaz(degisiklikler, 'depo')) return { tasinan: 0, gun: 0, basarili: false };
    return { tasinan: gecikmis.length - pay, gun: Math.ceil(gecikmis.length / pay) };
  }

  /* ---------- sıfırlama öncesi yedek ----------
     Sıfırlama geri alınamaz bir işlem; yanlışlıkla basıldığında tek çare kalmasın
     diye silinen hal buraya kopyalanır. Yalnız SON sıfırlama saklanır. */

  var YEDEK_ALANLARI = [
    'yds-leitner', 'yds-yanlis', 'yds-kategori', 'yds-gecmis', 'yds-konular',
    'yds-test-yanlis', 'yds-rekor', 'yds-yeni-sayac'
  ];

  function yedekAl(kapsam, kayitSayisi) {
    var kopya = { z: Date.now(), kapsam: kapsam, veri: {} };
    if (typeof kayitSayisi === 'number') kopya.kayit = kayitSayisi;
    YEDEK_ALANLARI.forEach(function (a) {
      var v = Depo.oku(a, null);
      if (v !== null && v !== undefined) kopya.veri[a] = v;
    });
    return Depo.yaz(K_YEDEK, kopya) !== false;
  }

  function yedekBilgisi() {
    var y = Depo.oku(K_YEDEK, null);
    if (!y || !y.veri) return null;
    var n = typeof y.kayit === 'number'
      ? y.kayit
      : ((y.veri['yds-leitner'] && Object.keys(y.veri['yds-leitner']).length) || 0);
    return { zaman: y.z, kapsam: y.kapsam, kayit: n };
  }

  /* Yedeği geri yükler; mevcut kayıtların üzerine BİRLEŞTİRİR, silmez. */
  function yedegiGeriAl() {
    var y = Depo.oku(K_YEDEK, null);
    if (!y || !y.veri) return false;
    if (!Motor || !Depo.paketYaz) return false;

    var mevcut = {};
    YEDEK_ALANLARI.forEach(function (a) {
      var v = Depo.oku(a, undefined);
      if (v !== undefined) mevcut[a] = v;
    });
    // İki tarafı sürümsüz zarf olarak birleştirmek, veri motorundaki alan
    // semantiklerini devreye sokar: daha güçlü kategori/konu, en yüksek yanlış
    // sayısı, daha iyi rekor ve son 50 geçmiş; ayrık kayıtların tümü korunur.
    var birlesmis = Motor.paket(Motor.birlestir(
      Motor.zarfaCevir(mevcut), Motor.zarfaCevir(y.veri)));
    if (Depo.paketYaz(birlesmis, 'geri-al') === false) return false;
    leitneriTazele();
    // Yalnız bütün ilerleme alanları kalıcılaştıktan sonra yedeği tüket.
    return Depo.sil(K_YEDEK) !== false;
  }

  function sifirlaKelime(en, tur) {
    return kayitlariSil([en], tur);
  }

  function leitnerSifirla(yedekle) {
    if (yedekle !== false && !yedekAl('kelime ve öbek kutuları')) return false;
    // Eski kaynak yerinde kalırsa bir sonraki açılışta sıfırlanan kartları
    // yeniden göç ettirir. Önce bunu güvenle tüket, sonra Leitner'ı sıfırla.
    if (Depo.sil(K_BILINEN) === false) return false;
    if (Depo.sil(K_LEITNER) === false) return false;
    leitner = {};
    return true;
  }

  /* Yalnızca verilen türdeki kayıtları sil. Aynı görünen başlığa sahip
     kelime ve öbekler iç kimlikte ayrıldığı için biri diğerini silemez. */
  function listeyiSifirla(adlar, tur) {
    return kayitlariSil(adlar || [], tur);
  }

  /* Kutu dağılımı ve bugünün iş yükü.
       tekrar → tekrar günü gelmiş, başlanmış kelimeler (hepsi yapılmalı)
       yeni   → hiç çalışılmamış kelime havuzu
       acilacakYeni → bunlardan bugün kotaya sığan kadarı
       bugun  → destedeki toplam kart = tekrar + acilacakYeni            */
  function leitnerOzet(tumKelimeler, tur) {
    var o = {
      k0: 0, k1: 0, k2: 0, k3: 0, k4: 0, k5: 0,
      tekrar: 0, yeni: 0, acilacakYeni: 0, bugun: 0,
      ogrenilen: 0, calisilan: 0,
      hedef: gunlukHedef(), kotaKalan: yeniKotasiKalan(),
      tavan: gunlukTavan(), bekleyen: 0
    };
    (tumKelimeler || []).forEach(function (kel) {
      var k = kutu(kel.en, tur);
      o['k' + k]++;
      if (k > 0) o.calisilan++; else o.yeni++;
      if (k >= EN_UST_KUTU) o.ogrenilen++;
      if (vadesiGeldiMi(kel.en, tur)) o.tekrar++;
    });
    var kapasite = gunlukTavan() + bugunkuSayac().ek;
    // Vadesi gelmiş tekrarlar önce gelir; tekrar borcu kapasiteyi doldurursa
    // yeni kartlar o gün otomatik olarak azalır. Böylece birikme büyümez.
    o.gosterilecekTekrar = Math.min(o.tekrar, kapasite);
    o.acilacakYeni = Math.min(o.yeni, o.kotaKalan, Math.max(0, kapasite - o.gosterilecekTekrar));
    o.bekleyen = o.tekrar - o.gosterilecekTekrar;
    o.bugun = o.gosterilecekTekrar + o.acilacakYeni;
    return o;
  }

  /* Bugünün destesi: tekrarı gelen her kelime + kotaya sığan yeni kelimeler.
     Liste [{en:…}] biçiminde gelir, aynı biçimde döner. */
  function destelik(tumKelimeler, tur) {
    var liste = tumKelimeler || [];

    // Tekrarlar: en çok gecikmiş önce (vadesi en eski olan başta)
    var tekrarlar = liste.filter(function (k) { return vadesiGeldiMi(k.en, tur); })
                         .sort(function (a, b) {
                           return leitner[ilerlemeKimligi(a.en, tur)].g -
                             leitner[ilerlemeKimligi(b.en, tur)].g;
                         });

    var kapasite = gunlukTavan() + bugunkuSayac().ek;
    var seciliTekrar = tekrarlar.slice(0, kapasite);
    var yeniYeri = Math.max(0, kapasite - seciliTekrar.length);
    var yeniler = liste.filter(function (k) { return yeniMi(k.en, tur); })
                       .slice(0, Math.min(yeniKotasiKalan(), yeniYeri));
    return seciliTekrar.concat(yeniler);
  }

  /* Tavana sığmadığı için bugün gösterilmeyen tekrar sayısı. */
  function bekleyenTekrar(tumKelimeler, tur) {
    var liste = tumKelimeler || [];
    var vadesi = liste.filter(function (k) { return vadesiGeldiMi(k.en, tur); }).length;
    return Math.max(0, vadesi - (gunlukTavan() + bugunkuSayac().ek));
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
      mevcut.u = Date.now();
      mevcut.c = 0;
      delete mevcut.sd;
    } else {
      defter.push({ a: anahtar, kat: kayit.kat, n: 1, t: Date.now(), u: Date.now(), c: 0 });
    }
    Depo.yaz(K_YANLIS, defter);
  }

  /* Yanlış defteri tek tesadüfi doğruyla temizlenmez. Aynı sorunun iki ayrı
     günde doğru çözülmesi gerekir; aynı günkü tekrarlar bir kez sayılır. */
  function yanlisCoz(kayit) {
    var defter = Depo.oku(K_YANLIS, []);
    if (!Array.isArray(defter)) return;
    var anahtar = yanlisAnahtar(kayit);
    var mevcut = defter.filter(function (y) { return y.a === anahtar; })[0];
    if (!mevcut || mevcut.sd === bugun()) return;
    mevcut.c = (mevcut.c || 0) + 1;
    mevcut.sd = bugun();
    mevcut.u = Date.now();
    if (mevcut.c >= 2) defter = defter.filter(function (y) { return y.a !== anahtar; });
    if (defter.length) Depo.yaz(K_YANLIS, defter); else Depo.sil(K_YANLIS);
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

  function kategoriKaydet(kat, dogruMu, soruId) {
    var s = Depo.oku(K_KATEGORI, {});
    if (!s || typeof s !== 'object') s = {};
    if (!s[kat]) s[kat] = { d: 0, y: 0 };
    if (dogruMu) s[kat].d++; else s[kat].y++;
    if (!Array.isArray(s[kat].r)) s[kat].r = [];
    s[kat].r.push({ id: String(soruId || ('eski-' + Date.now() + '-' + s[kat].r.length)), d: dogruMu ? 1 : 0, t: Date.now() });
    if (s[kat].r.length > 80) s[kat].r = s[kat].r.slice(-80);
    Depo.yaz(K_KATEGORI, s);
  }

  function kategoriOzet() {
    var s = Depo.oku(K_KATEGORI, {});
    if (!s || typeof s !== 'object') return [];
    return Object.keys(s).map(function (kat) {
      var son = Array.isArray(s[kat].r) ? s[kat].r.slice().reverse() : [];
      var gorulen = Object.create(null);
      son = son.filter(function (x) {
        var id = String(x.id || '');
        if (!id || gorulen[id]) return false;
        gorulen[id] = true;
        return true;
      }).slice(0, 40);
      var toplam = son.length || (s[kat].d + s[kat].y);
      var dogru = son.length ? son.reduce(function (n, x) { return n + (x.d ? 1 : 0); }, 0) : s[kat].d;
      return {
        kat: kat,
        dogru: dogru,
        yanlis: toplam - dogru,
        toplam: toplam,
        yuzde: toplam ? Math.round(dogru / toplam * 100) : 0,
        kapsam: son.length ? 'son ' + toplam + ' farklı soru' : 'tüm geçmiş'
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
      m: kayit.mod || 'alistirma',
      f: kayit.form || '',
      a: kayit.tur || ''
    });
    if (g.length > GECMIS_SINIRI) g = g.slice(-GECMIS_SINIRI);
    Depo.yaz(K_GECMIS, g);
  }

  function gecmis() {
    var g = Depo.oku(K_GECMIS, []);
    return Array.isArray(g) ? g : [];
  }

  function gecmisSifirla() { Depo.sil(K_GECMIS); }

  /* ---------- günün testi: bilinemeyenler ----------
     Bağlamda bilinemeyen kelime tekrar programında bir kutu geri açılır.
     Defterden çıkması için iki ayrı günde doğru cevap gerekir. */

  function testDefteri() {
    var d = Depo.oku(K_TEST_YANLIS, {});
    return (d && typeof d === 'object' && !Array.isArray(d)) ? d : {};
  }

  function testYanlis(en, tur) {
    var ad = en;
    en = ilerlemeKimligi(ad, tur);
    var d = testDefteri();
    var k = d[en] || { n: 0 };
    k.n = (k.n || 0) + 1;
    k.t = Date.now();
    k.u = Date.now();
    k.c = 0;
    delete k.sd;
    d[en] = k;
    Depo.yaz(K_TEST_YANLIS, d);
    yanlis(ad, tur);
  }

  function testDogru(en, tur) {
    en = ilerlemeKimligi(en, tur);
    var d = testDefteri();
    if (!d[en]) return;
    if (d[en].sd === bugun()) return;
    d[en].c = (d[en].c || 0) + 1;
    d[en].sd = bugun();
    d[en].u = Date.now();
    if (d[en].c >= 2) delete d[en];
    if (Object.keys(d).length) Depo.yaz(K_TEST_YANLIS, d); else Depo.sil(K_TEST_YANLIS);
  }

  function testYanlisKumesi(tur) {
    var d = testDefteri();
    if (!tur) return d;
    var sonuc = {};
    Object.keys(d).forEach(function (id) {
      var cozum = kimlikCoz(id);
      if (cozum.tur && cozum.tur !== tur) return;
      sonuc[cozum.ad] = d[id];
    });
    return sonuc;
  }
  function testYanlisSayisi(en, tur) {
    var k = testDefteri()[ilerlemeKimligi(en, tur)];
    return k ? (k.n || 1) : 0;
  }
  function testTemizle() { Depo.sil(K_TEST_YANLIS); }

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
    mevcut.u = Date.now();

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
    if (!yedekAl('her şey')) return false;
    if (Depo.sil(K_BILINEN) === false) return false;
    if (!Depo.anahtarlariSil || Depo.anahtarlariSil(YEDEK_ALANLARI, 'sifirla') === false) {
      return false;
    }
    leitner = {};
    return true;
  }

  window.YDS.Ilerleme = {
    ARALIK: ARALIK,
    bugun: bugun,
    ilerlemeKimligi: ilerlemeKimligi,
    kimlikCoz: kimlikCoz,
    kayit: kayit,
    kutu: kutu,
    tumKayitlar: tumKayitlar,
    vadesiGeldiMi: vadesiGeldiMi,
    yeniMi: yeniMi,
    kalanGun: kalanGun,
    mezunMu: mezunMu,
    yedekAl: yedekAl,
    yedekBilgisi: yedekBilgisi,
    yedegiGeriAl: yedegiGeriAl,
    gunlukHedef: gunlukHedef,
    gunlukHedefAyarla: gunlukHedefAyarla,
    gunlukTavan: gunlukTavan,
    gunlukTavanAyarla: gunlukTavanAyarla,
    bekleyenTekrar: bekleyenTekrar,
    birikmisiYay: birikmisiYay,
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
    testYanlis: testYanlis,
    testDogru: testDogru,
    testYanlisKumesi: testYanlisKumesi,
    testYanlisSayisi: testYanlisSayisi,
    testTemizle: testTemizle,
    hepsiniSifirla: hepsiniSifirla
  };
})();
