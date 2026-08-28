/* ============================================================
   Cihazlar arası eşitleme — Google girişi + Firestore

   Yerel ilerleme kayıt düzeyinde sürümlenir. Bulutta her eşitleme alanı ayrı
   belgede tutulur; böylece tüm kelime ve test ilerlemesi Firestore'un tek
   belge başına 1 MiB sınırına dayanmaz:
     kullanicilar/{uid}/alanlar/{anahtar} = { surum: 2, zaman, json }

   Her gönderim Firestore işlemi içinde önce güncel bulutu okur, yerelle
   birleştirir ve birleşimi yazar. Böylece aynı anda çalışan iki cihaz son
   yazanın bütün veriyi ezmesine yol açmaz. Eski surum:1 belgeleri ilk
   eşitlemede otomatik ve kayıpsız olarak alan belgelerine taşınır. Eski kök
   belge silinmez; eski açık sekmelerden gelebilecek son değişiklikler de
   okunup yeni düzene birleştirilir.
   ============================================================ */

(function () {
  'use strict';

  var AYAR = window.FIREBASE_AYAR;
  if (!AYAR) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  if (!window.YDS || !window.YDS.Depo || !window.YDS.EsitlemeMotoru || !window.YDS.EsitlemeDepo) return;

  var M = window.YDS.EsitlemeMotoru;
  var EsitDepo = window.YDS.EsitlemeDepo;
  var Depo = window.YDS.Depo;
  var SDK_KOK = 'https://www.gstatic.com/firebasejs/10.14.1/';
  var GECIKME = 2500;
  var BULUT_GECIS_YEDEGI = 'yds-esitleme-bulut-gecis-yedegi';
  var BELGE_GUVENLI_BAYT = 900 * 1024;
  var ALAN_ANAHTARLARI = Object.keys(M.TIPLER);

  var auth = null, db = null;
  var kullanici = null;
  var hazir = false;
  var birikti = false;
  var gonderiliyor = false;
  var sonGonderilen = null;
  var zamanlayici = null;
  var ilkZamanlayici = null;
  var dinlemeyiBirak = null;
  var kirliAlanlar = Object.create(null);
  var dugme = null;
  var uyari = null;
  var altyaziEl = null, altyaziAsli = '';

  function kokBelgesi(kisi) {
    return db.collection('kullanicilar').doc((kisi || kullanici).uid);
  }

  function alanBelgesi(kisi, anahtar) {
    return kokBelgesi(kisi).collection('alanlar').doc(anahtar);
  }

  function saat() {
    try {
      return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }

  function hataKodu(e) {
    if (!e) return 'bilinmiyor';
    if (e.code === 'yds/alan-cok-buyuk') {
      return e.alan + ' alanı güvenli bulut sınırına yaklaştı; veri bu cihazda korunuyor';
    }
    if (e.code === 'yds/bulut-json-gecersiz') {
      return 'bulut kaydı okunamadı; yerel veri değiştirilmedi';
    }
    if (e.code === 'permission-denied' || e.code === 'firestore/permission-denied') {
      return 'hesabın bulut kaydına erişim izni reddedildi';
    }
    return String(e.code || e.message || e).slice(0, 120);
  }

  function bulutPaketi(foto) {
    if (!foto || !foto.exists) return {};
    var veri = foto.data() || {};
    var paket = {};
    try { paket = JSON.parse(veri.json || '{}') || {}; } catch (e) { paket = {}; }
    return paket;
  }

  function bulutZarfi(foto) {
    return M.zarfaCevir(bulutPaketi(foto));
  }

  function bosZarf() {
    return M.zarfaCevir({});
  }

  function tekAlanZarfi(anahtar, alan) {
    var zarf = { surum: M.SURUM, alanlar: {} };
    if (alan) zarf.alanlar[anahtar] = alan;
    return M.birlestir(zarf, bosZarf());
  }

  function bulutAlanZarfi(foto, anahtar) {
    if (!foto || !foto.exists) return bosZarf();
    var veri = foto.data() || {};
    if (veri.surum !== M.SURUM || typeof veri.json !== 'string' ||
        (veri.anahtar !== undefined && veri.anahtar !== anahtar)) {
      var semaHatasi = new Error('bulut-alan-semasi-gecersiz');
      semaHatasi.code = 'yds/bulut-json-gecersiz';
      throw semaHatasi;
    }
    try {
      var cozulmus = JSON.parse(veri.json);
      // Erken geliştirme kopyalarındaki tam zarf biçimini de kayıpsız kabul et.
      if (cozulmus && cozulmus.surum === M.SURUM && cozulmus.alanlar) {
        return tekAlanZarfi(anahtar, cozulmus.alanlar[anahtar]);
      }
      return tekAlanZarfi(anahtar, cozulmus);
    } catch (e) {
      if (e && e.code === 'yds/bulut-json-gecersiz') throw e;
      var jsonHatasi = new Error('bulut-alan-json-gecersiz');
      jsonHatasi.code = 'yds/bulut-json-gecersiz';
      throw jsonHatasi;
    }
  }

  function alanJson(zarf, anahtar) {
    var alan = zarf && zarf.alanlar && zarf.alanlar[anahtar];
    return alan ? M.kararliJson(alan) : '';
  }

  function utf8Bayt(metin) {
    var toplam = 0;
    for (var i = 0; i < metin.length; i++) {
      var kod = metin.charCodeAt(i);
      if (kod < 0x80) toplam += 1;
      else if (kod < 0x800) toplam += 2;
      else if (kod >= 0xD800 && kod <= 0xDBFF &&
               i + 1 < metin.length && metin.charCodeAt(i + 1) >= 0xDC00 &&
               metin.charCodeAt(i + 1) <= 0xDFFF) {
        toplam += 4;
        i++;
      } else toplam += 3;
    }
    return toplam;
  }

  function alanBelgeVerisi(anahtar, json, zaman) {
    var veri = { surum: M.SURUM, anahtar: anahtar, zaman: zaman, json: json };
    var bayt = utf8Bayt(JSON.stringify(veri));
    if (bayt >= BELGE_GUVENLI_BAYT) {
      var hata = new Error('alan-cok-buyuk');
      hata.code = 'yds/alan-cok-buyuk';
      hata.alan = anahtar;
      hata.bayt = bayt;
      throw hata;
    }
    return veri;
  }

  function yereldeUygula(zarf, kaynak) {
    var sonuc = EsitDepo.uygula(zarf, kaynak);
    if (sonuc === false || (sonuc && sonuc.basarili === false)) {
      throw new Error('yerel-depo-yazilamadi');
    }
    return sonuc;
  }

  function alanlariIsaretle(anahtarlar) {
    (anahtarlar || ALAN_ANAHTARLARI).forEach(function (anahtar) {
      if (M.TIPLER[anahtar]) kirliAlanlar[anahtar] = true;
    });
  }

  function kirliAlanlariAl() {
    return Object.keys(kirliAlanlar).filter(function (anahtar) {
      return !!kirliAlanlar[anahtar];
    });
  }

  /* Kök geçiş belgesiyle bütün alan belgelerini aynı işlemde oku. Firestore
     bunlardan biri başka cihazca değişirse işlemi yeni görüntülerle yeniden
     dener; alanlar ayrı belgelerde kaldığı için hiçbiri tek başına 1 MiB'ye
     yaklaşan bütün zarfı taşımak zorunda kalmaz. */
  function bulutaBirlestir(hedefAlanlar, kokuOku) {
    var benimki = kullanici;
    if (!benimki) return Promise.reject(new Error('oturum-yok'));
    hedefAlanlar = (hedefAlanlar || ALAN_ANAHTARLARI).filter(function (anahtar) {
      return !!M.TIPLER[anahtar];
    });
    var kokRef = kokBelgesi(benimki);
    var alanRefleri = hedefAlanlar.map(function (anahtar) {
      return alanBelgesi(benimki, anahtar);
    });

    return db.runTransaction(function (islem) {
      var okumalar = (kokuOku ? [islem.get(kokRef)] : []).concat(alanRefleri.map(function (ref) {
        return islem.get(ref);
      }));
      return Promise.all(okumalar).then(function (fotolar) {
        var kokFoto = kokuOku ? fotolar[0] : null;
        var alanBaslangici = kokuOku ? 1 : 0;
        var eskiBulut = bulutPaketi(kokFoto);
        var birlesmis = M.birlestir(EsitDepo.zarf(), bulutZarfi(kokFoto));

        hedefAlanlar.forEach(function (anahtar, i) {
          birlesmis = M.birlestir(birlesmis,
            bulutAlanZarfi(fotolar[i + alanBaslangici], anahtar));
        });

        var simdi = Date.now();
        hedefAlanlar.forEach(function (anahtar, i) {
          var alan = birlesmis.alanlar && birlesmis.alanlar[anahtar];
          if (!alan) return;
          var json = M.kararliJson(alan);
          var foto = fotolar[i + alanBaslangici];
          var onceki = foto && foto.exists ? (foto.data() || {}) : {};
          if (onceki.surum === M.SURUM && onceki.anahtar === anahtar &&
              onceki.json === json) return;
          islem.set(alanRefleri[i], alanBelgeVerisi(anahtar, json, simdi));
        });

        return {
          zarf: birlesmis,
          json: M.kararliJson(birlesmis),
          eskiBulut: kokFoto && kokFoto.exists ? eskiBulut : null,
          hedefAlanlar: hedefAlanlar.slice()
        };
      });
    }).then(function (sonuc) {
      if (kullanici !== benimki) return sonuc;
      if (sonuc.eskiBulut && Depo.oku(BULUT_GECIS_YEDEGI, null) === null) {
        // Kök belge yerinde kalır; bu yedek ayrıca kolay geri dönüş sağlar.
        Depo.yaz(BULUT_GECIS_YEDEGI, { zaman: Date.now(), veri: sonuc.eskiBulut });
      }
      yereldeUygula(sonuc.zarf, 'bulut');
      return sonuc;
    });
  }

  function dinlemeyeBasla() {
    if (dinlemeyiBirak) dinlemeyiBirak();
    var benimki = kullanici;
    var kapaticilar = [];

    function dinlemeHatasi(e) {
      sonGonderilen = null;
      var metin = 'Bulut dinlenemiyor; ilerleme yerelde birikiyor (' + hataKodu(e) + ')';
      durumuYaz(metin);
      uyariGoster(metin, false);
    }

    function geleniUygula(gelen, anahtar, kokten) {
      if (!hazir || kullanici !== benimki) return;
      var once = EsitDepo.zarf();
      var birlesmis = M.birlestir(once, gelen);
      var onceJson = M.kararliJson(once);
      var birlesmisJson = M.kararliJson(birlesmis);
      var geriYazilacak = [];
      if (kokten) {
        ALAN_ANAHTARLARI.forEach(function (ad) {
          if (alanJson(birlesmis, ad) !== alanJson(once, ad)) geriYazilacak.push(ad);
        });
      } else if (alanJson(birlesmis, anahtar) !== alanJson(gelen, anahtar)) {
        geriYazilacak.push(anahtar);
      }
      try {
        yereldeUygula(birlesmis, 'bulut');
      } catch (e) {
        sonGonderilen = null;
        birikti = true;
        var metin = 'Bulut okundu fakat cihaz deposuna yazılamadı (' + hataKodu(e) + ')';
        durumuYaz(metin);
        uyariGoster(metin, false);
        planla();
        return;
      }
      if (geriYazilacak.length) {
        sonGonderilen = null;
        planla(geriYazilacak);
      } else if (!kokten) {
        sonGonderilen = birlesmisJson;
      }
      uyariyiKapat();
      durumuYaz('Eşitlendi ' + saat());
    }

    // Eski uygulama sürümünün kök belgeye yazdığı son değişiklikleri kaçırma.
    kapaticilar.push(kokBelgesi(benimki).onSnapshot(function (foto) {
      if (!foto || !foto.exists) return;
      geleniUygula(bulutZarfi(foto), null, true);
    }, dinlemeHatasi));

    ALAN_ANAHTARLARI.forEach(function (anahtar) {
      kapaticilar.push(alanBelgesi(benimki, anahtar).onSnapshot(function (foto) {
        if (!foto || !foto.exists) return;
        try {
          geleniUygula(bulutAlanZarfi(foto, anahtar), anahtar, false);
        } catch (e) {
          dinlemeHatasi(e);
        }
      }, dinlemeHatasi));
    });

    dinlemeyiBirak = function () {
      kapaticilar.forEach(function (kapat) { if (typeof kapat === 'function') kapat(); });
      kapaticilar = [];
    };
  }

  /* ---------- açılıştaki ilk geçiş/eşitleme ---------- */

  function ilkEsitle() {
    if (!kullanici || gonderiliyor) return;
    var benimki = kullanici;
    var once = M.kararliJson(EsitDepo.paket());
    gonderiliyor = true;

    bulutaBirlestir(ALAN_ANAHTARLARI, true).then(function (sonuc) {
      if (kullanici !== benimki) return;
      sonGonderilen = sonuc.json;
      hazir = true;
      gonderiliyor = false;
      dinlemeyeBasla();
      uyariyiKapat();
      durumuYaz('Eşitlendi ' + saat());

      var yerelDegisti = M.kararliJson(EsitDepo.paket()) !== once;
      if (yerelDegisti) {
        window.YDS.yenidenYukle('bulut-ilk-birlesim');
        return;
      }
      if (birikti || kirliAlanlariAl().length) { birikti = false; planla([]); }
    }).catch(function (e) {
      if (kullanici !== benimki) return;
      gonderiliyor = false;
      var metin = 'Bulut şu an ulaşılamıyor; ilerleme yerelde birikiyor (' + hataKodu(e) + ')';
      durumuYaz(metin);
      uyariGoster(metin, false);
      if (ilkZamanlayici) clearTimeout(ilkZamanlayici);
      ilkZamanlayici = setTimeout(ilkEsitle, 15000);
    });
  }

  /* ---------- değişiklikleri buluta yazma ---------- */

  function planla(anahtarlar) {
    if (!kullanici) return;
    alanlariIsaretle(anahtarlar);
    if (!hazir || gonderiliyor) { birikti = true; return; }
    if (zamanlayici) clearTimeout(zamanlayici);
    zamanlayici = setTimeout(gonder, GECIKME);
  }

  function gonder() {
    if (zamanlayici) { clearTimeout(zamanlayici); zamanlayici = null; }
    if (!kullanici || !hazir) return;
    if (gonderiliyor) { birikti = true; return; }
    var hedefAlanlar = kirliAlanlariAl();
    if (!hedefAlanlar.length) return;
    hedefAlanlar.forEach(function (anahtar) { delete kirliAlanlar[anahtar]; });

    var benimki = kullanici;
    gonderiliyor = true;
    bulutaBirlestir(hedefAlanlar, false).then(function (sonuc) {
      if (kullanici !== benimki) return;
      sonGonderilen = sonuc.json;
      uyariyiKapat();
      durumuYaz('Eşitlendi ' + saat());
    }).catch(function (e) {
      if (kullanici !== benimki) return;
      alanlariIsaretle(hedefAlanlar);
      birikti = true;
      var metin = 'Yazılamadı, yeniden denenecek (' + hataKodu(e) + ')';
      durumuYaz(metin);
      uyariGoster(metin, false);
    }).then(function () {
      if (kullanici !== benimki) return;
      gonderiliyor = false;
      if (birikti) {
        birikti = false;
        zamanlayici = setTimeout(gonder, 15000);
      }
    });
  }

  window.addEventListener('yds-depo-degisti', function (e) {
    var kaynak = e && e.detail && e.detail.kaynak;
    var anahtarlar = e && e.detail && e.detail.anahtarlar;
    if (kaynak !== 'bulut' && kaynak !== 'baslangic') planla(anahtarlar);
  });
  window.addEventListener('pagehide', gonder);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') gonder();
  });

  /* ---------- arayüz: başlıktaki düğme + alt yazı ---------- */

  function dugmeKur() {
    var tetik = document.querySelector('.theme-toggle:not(.esit-dugme)');
    if (!tetik || !tetik.parentNode) return;
    dugme = document.createElement('button');
    dugme.type = 'button';
    dugme.className = 'theme-toggle esit-dugme';
    dugme.textContent = '⇅';
    dugme.title = 'Bağlanıyor…';
    dugme.setAttribute('aria-label', 'Cihazlar arası eşitleme');
    dugme.disabled = true;
    dugme.addEventListener('click', tiklandi);
    tetik.parentNode.insertBefore(dugme, tetik);
  }

  function dugmeGuncelle() {
    if (!dugme) return;
    if (kullanici) {
      var ad = kullanici.displayName || kullanici.email || 'G';
      dugme.textContent = ad.charAt(0).toLocaleUpperCase('tr');
      dugme.classList.add('acik');
      dugme.title = 'Eşitleme açık: ' + (kullanici.email || '') + '\nÇıkmak için tıkla';
    } else {
      dugme.textContent = '⇅';
      dugme.classList.remove('acik');
      dugme.title = 'İlerlemeni cihazların arasında eşitle — Google ile giriş yap';
    }
  }

  function durumuYaz(metin) {
    if (!dugme || !kullanici) return;
    dugme.title = 'Eşitleme açık: ' + (kullanici.email || '') + '\n' + metin + '\nÇıkmak için tıkla';
  }

  function uyariyiKapat() {
    if (uyari && uyari.parentNode) uyari.parentNode.removeChild(uyari);
    uyari = null;
    if (dugme) {
      dugme.classList.remove('hata');
      if (auth) dugme.disabled = false;
    }
  }

  function uyariGoster(metin, devreDisi) {
    if (dugme) {
      dugme.classList.add('hata');
      if (devreDisi) dugme.disabled = true;
      dugme.title = metin;
    }
    if (!document.body) return;
    if (!uyari) {
      uyari = document.createElement('div');
      uyari.className = 'esit-uyari';
      uyari.setAttribute('role', 'status');
      uyari.innerHTML = '<span></span><button type="button" aria-label="Uyarıyı kapat">×</button>';
      uyari.querySelector('button').addEventListener('click', uyariyiKapat);
      document.body.appendChild(uyari);
    }
    uyari.querySelector('span').textContent = metin;
  }

  function cevirmdisiUyarisi() {
    uyariGoster('Bulut eşitleme çevrimdışı. İlerlemen bu cihazda korunuyor.', true);
  }

  function altyaziGuncelle() {
    if (!altyaziEl) {
      var adaylar = document.querySelectorAll('.site-footer span');
      for (var i = 0; i < adaylar.length; i++) {
        if (adaylar[i].textContent.indexOf('tarayıcıda saklanır') !== -1) {
          altyaziEl = adaylar[i];
          altyaziAsli = adaylar[i].textContent;
          break;
        }
      }
    }
    if (!altyaziEl) return;
    altyaziEl.textContent = kullanici
      ? 'İlerleme Google hesabınla cihazların arasında eşitleniyor.'
      : altyaziAsli;
  }

  function tiklandi() {
    if (!auth || !window.firebase) return;
    if (kullanici) {
      var soru = 'Eşitleme kapatılsın mı?\n\nİlerlemen bu tarayıcıda aynen kalır; ' +
        'yalnızca bulutla bağlantı kesilir.';
      if (window.confirm(soru)) auth.signOut().catch(function () {});
      return;
    }
    var saglayici = new window.firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(saglayici).catch(function (e) {
      var kod = e && e.code;
      if (kod === 'auth/popup-blocked' ||
          kod === 'auth/operation-not-supported-in-this-environment') {
        auth.signInWithRedirect(saglayici).catch(function () {});
      }
    });
  }

  /* ---------- başlat ---------- */

  function betikYukle(url) {
    return new Promise(function (coz, reddet) {
      var s = document.createElement('script');
      var bitti = false;
      var sure = setTimeout(function () {
        if (bitti) return;
        bitti = true;
        if (s.parentNode) s.parentNode.removeChild(s);
        reddet(new Error('Firebase SDK zaman aşımı'));
      }, 12000);
      s.src = url;
      s.onload = function () {
        if (bitti) return;
        bitti = true;
        clearTimeout(sure);
        coz();
      };
      s.onerror = function () {
        if (bitti) return;
        bitti = true;
        clearTimeout(sure);
        reddet(new Error('Firebase SDK yüklenemedi'));
      };
      document.head.appendChild(s);
    });
  }

  // Düğme SDK'dan bağımsız kurulur; CDN erişilemezse kullanıcı durumu görür.
  dugmeKur();
  dugmeGuncelle();
  if (dugme) dugme.title = 'Bulut eşitlemeye bağlanıyor…';

  betikYukle(SDK_KOK + 'firebase-app-compat.js')
    .then(function () {
      return Promise.all([
        betikYukle(SDK_KOK + 'firebase-auth-compat.js'),
        betikYukle(SDK_KOK + 'firebase-firestore-compat.js')
      ]);
    })
    .then(function () {
      window.firebase.initializeApp(AYAR);
      auth = window.firebase.auth();
      db = window.firebase.firestore();
      uyariyiKapat();
      if (dugme) dugme.disabled = false;
      auth.onAuthStateChanged(function (u) {
        if (zamanlayici) clearTimeout(zamanlayici);
        if (ilkZamanlayici) clearTimeout(ilkZamanlayici);
        if (dinlemeyiBirak) { dinlemeyiBirak(); dinlemeyiBirak = null; }
        kullanici = u || null;
        hazir = false;
        birikti = false;
        gonderiliyor = false;
        sonGonderilen = null;
        kirliAlanlar = Object.create(null);
        dugmeGuncelle();
        altyaziGuncelle();
        if (kullanici) ilkEsitle();
      });
      auth.getRedirectResult().catch(function () {});
    })
    .catch(function () {
      // SDK inmezse ilerleme yerelde ve yeni güvenli zarf içinde çalışmayı sürdürür.
      cevirmdisiUyarisi();
    });
})();
