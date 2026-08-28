/* ============================================================
   Cihazlar arası eşitleme — Google girişi + Firestore

   Yerel ilerleme kayıt düzeyinde sürümlenir. Bulutta kullanıcı başına aynı
   tek belge kullanılmaya devam eder:
     kullanicilar/{uid} = { surum: 2, zaman, json }

   Her gönderim Firestore işlemi içinde önce güncel bulutu okur, yerelle
   birleştirir ve birleşimi yazar. Böylece aynı anda çalışan iki cihaz son
   yazanın bütün veriyi ezmesine yol açmaz. Eski surum:1 belgeleri ilk
   eşitlemede otomatik ve kayıpsız olarak yeni zarfa çevrilir.
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
  var YENILEME_ISARETI = 'yds-esit-yenileme-v2';
  var BULUT_GECIS_YEDEGI = 'yds-esitleme-bulut-gecis-yedegi';

  var auth = null, db = null;
  var kullanici = null;
  var hazir = false;
  var birikti = false;
  var gonderiliyor = false;
  var sonGonderilen = null;
  var zamanlayici = null;
  var ilkZamanlayici = null;
  var dinlemeyiBirak = null;
  var dugme = null;
  var altyaziEl = null, altyaziAsli = '';

  function belge(kisi) {
    return db.collection('kullanicilar').doc((kisi || kullanici).uid);
  }

  function saat() {
    try {
      return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }

  function hataKodu(e) {
    if (!e) return 'bilinmiyor';
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

  /* Güncel bulutu işlem içinde okuyup yerelle birleştir. Firestore aynı belge
     başka cihazca değişirse işlemi yeni görüntüyle otomatik yeniden dener. */
  function bulutaBirlestir() {
    var benimki = kullanici;
    if (!benimki) return Promise.reject(new Error('oturum-yok'));
    var ref = belge(benimki);

    return db.runTransaction(function (islem) {
      return islem.get(ref).then(function (foto) {
        var yerel = EsitDepo.zarf();
        var eskiBulut = bulutPaketi(foto);
        var gelen = M.zarfaCevir(eskiBulut);
        var belgeVerisi = foto && foto.exists ? (foto.data() || {}) : {};
        if (foto && foto.exists && belgeVerisi.surum !== M.SURUM &&
            Depo.oku(BULUT_GECIS_YEDEGI, null) === null) {
          Depo.yaz(BULUT_GECIS_YEDEGI, { zaman: Date.now(), veri: eskiBulut });
        }
        var birlesmis = M.birlestir(yerel, gelen);
        var json = M.kararliJson(birlesmis);
        var bulutAyni = false;
        if (foto && foto.exists) {
          bulutAyni = belgeVerisi.surum === M.SURUM && belgeVerisi.json === json;
        }
        if (!bulutAyni) islem.set(ref, { surum: M.SURUM, zaman: Date.now(), json: json });
        return { zarf: birlesmis, json: json };
      });
    }).then(function (sonuc) {
      if (kullanici !== benimki) return sonuc;
      EsitDepo.uygula(sonuc.zarf, 'bulut');
      return sonuc;
    });
  }

  function dinlemeyeBasla() {
    if (dinlemeyiBirak) dinlemeyiBirak();
    var benimki = kullanici;
    dinlemeyiBirak = belge(benimki).onSnapshot(function (foto) {
      if (!hazir || kullanici !== benimki || !foto || !foto.exists) return;
      var gelen = bulutZarfi(foto);
      var gelenJson = M.kararliJson(gelen);
      var birlesmis = M.birlestir(EsitDepo.zarf(), gelen);
      var birlesmisJson = M.kararliJson(birlesmis);
      EsitDepo.uygula(birlesmis, 'bulut');
      sonGonderilen = gelenJson;
      durumuYaz('Eşitlendi ' + saat());
      if (birlesmisJson !== gelenJson) planla();
    }, function (e) {
      durumuYaz('Bulut dinlenemiyor; ilerleme yerelde birikiyor (' + hataKodu(e) + ')');
    });
  }

  /* ---------- açılıştaki ilk geçiş/eşitleme ---------- */

  function ilkEsitle() {
    if (!kullanici || gonderiliyor) return;
    var benimki = kullanici;
    var once = M.kararliJson(EsitDepo.paket());
    gonderiliyor = true;

    bulutaBirlestir().then(function (sonuc) {
      if (kullanici !== benimki) return;
      sonGonderilen = sonuc.json;
      hazir = true;
      gonderiliyor = false;
      dinlemeyeBasla();
      durumuYaz('Eşitlendi ' + saat());

      var yerelDegisti = M.kararliJson(EsitDepo.paket()) !== once;
      if (yerelDegisti) {
        var yenilendiMi = false;
        try { yenilendiMi = sessionStorage.getItem(YENILEME_ISARETI) === '1'; } catch (e) {}
        if (!yenilendiMi) {
          try { sessionStorage.setItem(YENILEME_ISARETI, '1'); } catch (e2) {}
          location.reload();
          return;
        }
      }
      try { sessionStorage.removeItem(YENILEME_ISARETI); } catch (e3) {}
      if (birikti) { birikti = false; planla(); }
    }).catch(function (e) {
      if (kullanici !== benimki) return;
      gonderiliyor = false;
      durumuYaz('Bulut şu an ulaşılamıyor; ilerleme yerelde birikiyor (' + hataKodu(e) + ')');
      if (ilkZamanlayici) clearTimeout(ilkZamanlayici);
      ilkZamanlayici = setTimeout(ilkEsitle, 15000);
    });
  }

  /* ---------- değişiklikleri buluta yazma ---------- */

  function planla() {
    if (!kullanici) return;
    if (!hazir || gonderiliyor) { birikti = true; return; }
    if (zamanlayici) clearTimeout(zamanlayici);
    zamanlayici = setTimeout(gonder, GECIKME);
  }

  function gonder() {
    if (zamanlayici) { clearTimeout(zamanlayici); zamanlayici = null; }
    if (!kullanici || !hazir) return;
    if (gonderiliyor) { birikti = true; return; }
    var yerelJson = M.kararliJson(EsitDepo.zarf());
    if (yerelJson === sonGonderilen) return;

    var benimki = kullanici;
    gonderiliyor = true;
    bulutaBirlestir().then(function (sonuc) {
      if (kullanici !== benimki) return;
      sonGonderilen = sonuc.json;
      durumuYaz('Eşitlendi ' + saat());
    }).catch(function (e) {
      if (kullanici !== benimki) return;
      birikti = true;
      durumuYaz('Yazılamadı, yeniden denenecek (' + hataKodu(e) + ')');
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
    if (kaynak !== 'bulut' && kaynak !== 'baslangic') planla();
  });
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

  function durumuYaz(metin) {
    if (!dugme || !kullanici) return;
    dugme.title = 'Eşitleme açık: ' + (kullanici.email || '') + '\n' + metin + '\nÇıkmak için tıkla';
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
        if (zamanlayici) clearTimeout(zamanlayici);
        if (ilkZamanlayici) clearTimeout(ilkZamanlayici);
        if (dinlemeyiBirak) { dinlemeyiBirak(); dinlemeyiBirak = null; }
        kullanici = u || null;
        hazir = false;
        birikti = false;
        gonderiliyor = false;
        sonGonderilen = null;
        dugmeGuncelle();
        altyaziGuncelle();
        if (kullanici) ilkEsitle();
      });
      auth.getRedirectResult().catch(function () {});
    })
    .catch(function () {
      // SDK inmezse ilerleme yerelde ve yeni güvenli zarf içinde çalışmayı sürdürür.
    });
})();
