/* ============================================================
   Cihazlar arası eşitleme — Google girişi + Firestore

   İlerleme localStorage'da yaşamaya devam eder; burası onun bulut
   kopyasını tutar. Açılışta bulut ile yerel BİRLEŞTİRİLİR (her
   kelimede en son çalışılan kayıt kazanır, hiçbir şey silinmez),
   sonrasında her değişiklik kısa bir gecikmeyle buluta yazılır.

   esitleme-ayar.js içindeki FIREBASE_AYAR boşsa bu dosya hiçbir şey
   yapmaz; site eskisi gibi çalışır.

   Bulutta kullanıcı başına tek belge durur:
     kullanicilar/{uid} = { surum, zaman, json }
   json = bütün yds-* anahtarlarının tek JSON metni. Alan alan değil
   tek metin: Firestore alan adları nokta/eğik çizgi kaldırmıyor,
   kelime anahtarlarında ise her karakter olabilir. Karşılaştırmalar
   anahtarları sıralayan kararlı JSON ile yapılır ki iki cihaz aynı
   veriyi farklı sırayla yazıp durmadan birbirinin üstüne çıkmasın.
   ============================================================ */

(function () {
  'use strict';

  var AYAR = window.FIREBASE_AYAR;
  if (!AYAR) return;
  // Google girişi yalnız http(s) üzerinde çalışır; file:// açılışta sessizce kapalı.
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  if (!window.YDS || !window.YDS.Depo) return;

  var Depo = window.YDS.Depo;
  var ARALIK = (window.YDS.Ilerleme && window.YDS.Ilerleme.ARALIK) ||
               { 1: 1, 2: 3, 3: 7, 4: 15, 5: 30 };

  var SDK_KOK = 'https://www.gstatic.com/firebasejs/10.14.1/';
  var GECIKME = 2500;                      // değişiklikten kaç ms sonra buluta yazılır
  var YENILEME_ISARETI = 'yds-esit-yenileme';

  /* Eşitlenen anahtarlar. Tema bilerek dışarıda: cihaz tercihi. */
  var ANAHTARLAR = [
    'yds-leitner', 'yds-yanlis', 'yds-kategori', 'yds-gecmis',
    'yds-konular', 'yds-rekor', 'yds-yeni-sayac', 'yds-test-yanlis',
    'yds-gunluk-yeni', 'yds-gunluk-tavan', 'yds-katmanlar', 'yds-eksen'
  ];
  var ANAHTAR_KUMESI = {};
  ANAHTARLAR.forEach(function (a) { ANAHTAR_KUMESI[a] = 1; });

  /* Yalnız yerelde YOKSA buluttan alınan tercihler. */
  var TERCIHLER = { 'yds-gunluk-yeni': 1, 'yds-gunluk-tavan': 1, 'yds-katmanlar': 1, 'yds-eksen': 1 };

  var auth = null, db = null;
  var kullanici = null;
  var hazir = false;          // ilk birleştirme bitti mi? bitmeden buluta yazılmaz
  var birikti = false;        // ilk birleştirme sürerken yerel değişiklik oldu mu?
  var sonGonderilen = null;
  var zamanlayici = null;
  var dugme = null;
  var altyaziEl = null, altyaziAsli = '';

  /* ---------- yardımcılar ---------- */

  // Anahtarları sıralayarak yazan JSON: aynı veri her cihazda aynı metni üretir.
  function kararliJson(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(kararliJson).join(',') + ']';
    return '{' + Object.keys(v).sort().map(function (k) {
      return JSON.stringify(k) + ':' + kararliJson(v[k]);
    }).join(',') + '}';
  }

  function yerelPaket() {
    var p = {};
    ANAHTARLAR.forEach(function (a) {
      var v = Depo.oku(a, undefined);
      if (v !== undefined) p[a] = v;
    });
    return p;
  }

  function belge() {
    return db.collection('kullanicilar').doc(kullanici.uid);
  }

  function saat() {
    try {
      return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }

  /* ---------- birleştirme kuralları ----------
     (Kutu ve tekrar günü ilerleme.js'teki Leitner alanlarıdır.) */

  // Kayıttan "en son hangi gün çalışıldı"yı çıkarır: tekrar günü - aralık.
  function calisilanGun(r) { return (r.g || 0) - (ARALIK[r.k] || 0); }

  function leitnerBirlestir(yerel, gelen) {
    Object.keys(gelen).forEach(function (ad) {
      var g = gelen[ad];
      if (!g || typeof g.k !== 'number' || typeof g.g !== 'number') return;
      var m = yerel[ad];
      if (!m) { yerel[ad] = { k: g.k, g: g.g }; return; }
      var gunG = calisilanGun(g), gunM = calisilanGun(m);
      if (gunG > gunM || (gunG === gunM && g.k > m.k)) yerel[ad] = { k: g.k, g: g.g };
    });
    return yerel;
  }

  function yanlisBirlestir(yerel, gelen) {
    var harita = {};
    yerel.forEach(function (x) { if (x && x.a) harita[x.a] = x; });
    gelen.forEach(function (x) {
      if (!x || !x.a) return;
      var m = harita[x.a];
      if (!m) { harita[x.a] = x; return; }
      m.n = Math.max(m.n || 1, x.n || 1);
      m.t = Math.max(m.t || 0, x.t || 0);
    });
    return Object.keys(harita).map(function (a) { return harita[a]; });
  }

  function kategoriBirlestir(yerel, gelen) {
    // Sayaçları toplarsak aynı cevaplar iki kez sayılabilir; kategori
    // başına daha çok soru görmüş taraf geçerli olur.
    Object.keys(gelen).forEach(function (kat) {
      var g = gelen[kat], m = yerel[kat];
      if (!g || typeof g.d !== 'number') return;
      if (!m || (g.d + g.y) > (m.d + m.y)) yerel[kat] = g;
    });
    return yerel;
  }

  function gecmisBirlestir(yerel, gelen) {
    var gorulen = {};
    var hepsi = [];
    yerel.concat(gelen).forEach(function (x) {
      if (!x || !x.t || gorulen[x.t]) return;
      gorulen[x.t] = true;
      hepsi.push(x);
    });
    hepsi.sort(function (a, b) { return a.t - b.t; });
    return hepsi.slice(-50);
  }

  function konuBirlestir(yerel, gelen) {
    var puan = function (r) {
      return (r.d || 0) * 10 + (r.t != null ? 1 : 0) + (r.g != null ? 1 : 0) + (r.n ? 1 : 0);
    };
    Object.keys(gelen).forEach(function (kod) {
      var g = gelen[kod], m = yerel[kod];
      if (!g || typeof g !== 'object') return;
      if (!m || puan(g) > puan(m)) yerel[kod] = g;
    });
    return yerel;
  }

  function rekorBirlestir(yerel, gelen) {
    if (!gelen || typeof gelen.yuzde !== 'number') return yerel;
    if (!yerel || gelen.yuzde > yerel.yuzde ||
        (gelen.yuzde === yerel.yuzde && (gelen.dogru || 0) > (yerel.dogru || 0))) return gelen;
    return yerel;
  }

  function sayacBirlestir(yerel, gelen) {
    if (!gelen || typeof gelen.g !== 'number') return yerel;
    if (!yerel || gelen.g > yerel.g) return gelen;
    if (gelen.g === yerel.g) {
      return { g: yerel.g, n: Math.max(yerel.n || 0, gelen.n || 0),
               ek: Math.max(yerel.ek || 0, gelen.ek || 0) };
    }
    return yerel;
  }

  /* Testte bilinemeyenler: birlik; aynı kelimede yüksek sayı ve son zaman. */
  function testYanlisBirlestir(yerel, gelen) {
    var s = {};
    [yerel, gelen].forEach(function (kaynak) {
      Object.keys(kaynak).forEach(function (en) {
        var k = kaynak[en] || {};
        var m = s[en] || { n: 0, t: 0 };
        s[en] = { n: Math.max(m.n, k.n || 1), t: Math.max(m.t, k.t || 0) };
      });
    });
    return s;
  }

  /* Yerel paketi (yerinde değiştirerek) bulutla birleştirir. */
  function paketBirlestir(y, g) {
    var nesne = function (v) { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : null; };
    var dizi = function (v) { return Array.isArray(v) ? v : null; };

    if (nesne(y['yds-leitner']) || nesne(g['yds-leitner'])) {
      y['yds-leitner'] = leitnerBirlestir(nesne(y['yds-leitner']) || {}, nesne(g['yds-leitner']) || {});
    }
    if (dizi(y['yds-yanlis']) || dizi(g['yds-yanlis'])) {
      y['yds-yanlis'] = yanlisBirlestir(dizi(y['yds-yanlis']) || [], dizi(g['yds-yanlis']) || []);
    }
    if (nesne(y['yds-kategori']) || nesne(g['yds-kategori'])) {
      y['yds-kategori'] = kategoriBirlestir(nesne(y['yds-kategori']) || {}, nesne(g['yds-kategori']) || {});
    }
    if (dizi(y['yds-gecmis']) || dizi(g['yds-gecmis'])) {
      y['yds-gecmis'] = gecmisBirlestir(dizi(y['yds-gecmis']) || [], dizi(g['yds-gecmis']) || []);
    }
    if (nesne(y['yds-konular']) || nesne(g['yds-konular'])) {
      y['yds-konular'] = konuBirlestir(nesne(y['yds-konular']) || {}, nesne(g['yds-konular']) || {});
    }
    if (nesne(y['yds-test-yanlis']) || nesne(g['yds-test-yanlis'])) {
      y['yds-test-yanlis'] = testYanlisBirlestir(nesne(y['yds-test-yanlis']) || {}, nesne(g['yds-test-yanlis']) || {});
    }
    var rekor = rekorBirlestir(y['yds-rekor'] || null, g['yds-rekor'] || null);
    if (rekor) y['yds-rekor'] = rekor;
    var sayac = sayacBirlestir(y['yds-yeni-sayac'] || null, g['yds-yeni-sayac'] || null);
    if (sayac) y['yds-yeni-sayac'] = sayac;

    Object.keys(TERCIHLER).forEach(function (a) {
      if (y[a] === undefined && g[a] !== undefined) y[a] = g[a];
    });
    return y;
  }

  /* ---------- açılıştaki ilk eşitleme ---------- */

  function ilkEsitle() {
    var benimki = kullanici;
    belge().get().then(function (foto) {
      if (kullanici !== benimki) return;         // bu arada çıkış yapıldıysa bırak

      var gelen = {};
      var bulutJson = '';
      if (foto && foto.exists) {
        bulutJson = foto.data().json || '';
        try { gelen = JSON.parse(bulutJson) || {}; } catch (e) { gelen = {}; }
      }

      var yerel = yerelPaket();
      var once = kararliJson(yerel);
      var paket = paketBirlestir(yerel, gelen);
      var simdi = kararliJson(paket);
      var yerelDegisti = simdi !== once;

      if (yerelDegisti) {
        Object.keys(paket).forEach(function (a) { Depo.yaz(a, paket[a]); });
      }

      var yazma = (simdi !== bulutJson)
        ? belge().set({ surum: 1, zaman: Date.now(), json: simdi })
        : Promise.resolve();

      return yazma.then(function () {
        if (kullanici !== benimki) return;
        sonGonderilen = simdi;
        hazir = true;
        durumuYaz('Eşitlendi ' + saat());

        if (yerelDegisti) {
          // Sayfa betikleri veriyi açılışta belleğe aldı; birleşen veriyi
          // görmeleri için bir kez yenile. İşaret, yenileme döngüsünü keser.
          var yenilendiMi = false;
          try { yenilendiMi = sessionStorage.getItem(YENILEME_ISARETI) === '1'; } catch (e) {}
          if (!yenilendiMi) {
            try { sessionStorage.setItem(YENILEME_ISARETI, '1'); } catch (e) {}
            location.reload();
            return;
          }
        }
        try { sessionStorage.removeItem(YENILEME_ISARETI); } catch (e) {}
        if (birikti) { birikti = false; gonder(); }
      });
    }).catch(function (e) {
      durumuYaz('Bulut şu an ulaşılamıyor; ilerleme yerelde birikiyor (' + hataKodu(e) + ')');
      // Bağlantı gelince ilk değişiklik yeniden dener; hazir=false kaldığı
      // için birleştirilmemiş veri bulutun üstüne yazılmaz.
    });
  }

  /* ---------- değişiklikleri buluta yazma ---------- */

  function planla() {
    if (!kullanici) return;
    if (!hazir) { birikti = true; return; }
    if (zamanlayici) clearTimeout(zamanlayici);
    zamanlayici = setTimeout(gonder, GECIKME);
  }

  function gonder() {
    if (zamanlayici) { clearTimeout(zamanlayici); zamanlayici = null; }
    if (!kullanici || !hazir) return;
    var json = kararliJson(yerelPaket());
    if (json === sonGonderilen) return;
    belge().set({ surum: 1, zaman: Date.now(), json: json })
      .then(function () {
        sonGonderilen = json;
        durumuYaz('Eşitlendi ' + saat());
      })
      .catch(function (e) {
        durumuYaz('Yazılamadı, yeniden denenecek (' + hataKodu(e) + ')');
        zamanlayici = setTimeout(gonder, 15000);
      });
  }

  // Depo üzerinden geçen her ilerleme yazımını yakala.
  var eskiYaz = Depo.yaz, eskiSil = Depo.sil;
  Depo.yaz = function (a, v) {
    var sonuc = eskiYaz(a, v);
    if (ANAHTAR_KUMESI[a]) planla();
    return sonuc;
  };
  Depo.sil = function (a) {
    eskiSil(a);
    if (ANAHTAR_KUMESI[a]) planla();
  };

  // Sekme kapanırken / arka plana düşerken bekletmeden yaz.
  window.addEventListener('pagehide', gonder);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') gonder();
  });

  /* ---------- arayüz: başlıktaki düğme + alt yazı ---------- */

  function dugmeKur() {
    var tetik = document.querySelector('.theme-toggle');
    if (!tetik || !tetik.parentNode) return;
    dugme = document.createElement('button');
    dugme.type = 'button';
    dugme.className = 'theme-toggle esit-dugme';
    dugme.textContent = '⇅';
    dugme.title = 'Bağlanıyor…';
    dugme.setAttribute('aria-label', 'Cihazlar arası eşitleme');
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

  function hataKodu(e) {
    if (!e) return 'bilinmiyor';
    return String(e.code || e.message || e).slice(0, 120);
  }

  function durumuYaz(metin) {
    if (!dugme || !kullanici) return;
    dugme.title = 'Eşitleme açık: ' + (kullanici.email || '') + '\n' + metin +
      '\nÇıkmak için tıkla';
  }

  function altyaziGuncelle() {
    if (!altyaziEl) {
      var adaylar = document.querySelectorAll('.site-footer span');
      for (var i = 0; i < adaylar.length; i++) {
        if (adaylar[i].textContent.indexOf('tarayıcında saklanır') !== -1) {
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
      s.src = url;
      s.onload = coz;
      s.onerror = reddet;
      document.head.appendChild(s);
    });
  }

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

      dugmeKur();
      auth.onAuthStateChanged(function (u) {
        kullanici = u || null;
        hazir = false;
        birikti = false;
        sonGonderilen = null;
        dugmeGuncelle();
        altyaziGuncelle();
        if (kullanici) ilkEsitle();
      });
      // Açılır pencere engellenmişse girişi yönlendirmeyle tamamla.
      auth.getRedirectResult().catch(function () {});
    })
    .catch(function () {
      // Çevrimdışı ya da SDK inmedi: bu oturumda eşitleme yok, site normal çalışır.
    });
})();
