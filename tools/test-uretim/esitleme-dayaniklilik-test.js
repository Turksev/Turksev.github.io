'use strict';

/* Girişli (düğmede baş harf görünen) sayfa, elle tıklama ya da yeniden
   yükleme olmadan hem göndermeli hem almalı. Sahte saat ve zamanlayıcılarla
   gerçek gecikmeler sınanır: kesintisiz çalışmada gönderim üst sınırı,
   sayfaya dönüşte yakalama, kopan dinleyicinin onarımı, takılan işlem bekçisi,
   hata sonrası geri çekilme ve "şimdi eşitle" düğmesi. */

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');
var tarayiciAPIleri = require('./tarayici-vm');

var kok = path.resolve(__dirname, '..', '..');
var KAYNAKLAR = [
  path.join(kok, 'data', 'kelime-aliaslari.js'),
  path.join(kok, 'assets', 'js', 'esitleme-veri.js'),
  path.join(kok, 'assets', 'js', 'esitleme-depo.js'),
  path.join(kok, 'assets', 'js', 'esitleme-v2.js')
].map(function (dosya) { return { dosya: dosya, kod: fs.readFileSync(dosya, 'utf8') }; });

var KOK_YOL = 'kullanicilar/u1';
var ALAN_YOLU = KOK_YOL + '/alanlar/';
var YONETIM_YOLU = KOK_YOL + '/yonetim/durum';
var DAKIKA = 60 * 1000;
var KUYRUK_COKTU = 'FIRESTORE (10.14.1) INTERNAL ASSERTION FAILED: AsyncQueue is already failed: test';
// Firestore 10.14.1 TransactionRunner yalnız bu kodları tanır; FirebaseError adlı
// ama başka kodlu (ör. auth/network-request-failed) hata isPermanentError içinde
// fail() attırır ve işlemin sözü hiç sonuçlanmaz.
var FIRESTORE_KODLARI = ['cancelled', 'unknown', 'invalid-argument', 'deadline-exceeded', 'not-found',
  'already-exists', 'permission-denied', 'resource-exhausted', 'failed-precondition', 'aborted',
  'out-of-range', 'unimplemented', 'internal', 'unavailable', 'data-loss', 'unauthenticated'];

var saat = Date.UTC(2026, 9, 7, 8, 0, 0);

function SahteTarih() {
  if (!arguments.length) return new Date(saat);
  var a = [null].concat(Array.prototype.slice.call(arguments));
  return new (Function.prototype.bind.apply(Date, a))();
}
SahteTarih.now = function () { return saat; };
SahteTarih.UTC = Date.UTC;
SahteTarih.parse = Date.parse;
SahteTarih.prototype = Date.prototype;

function bosalt() {
  var p = Promise.resolve();
  for (var i = 0; i < 40; i++) {
    p = p.then(function () { return new Promise(function (coz) { setImmediate(coz); }); });
  }
  return p;
}

function CustomEvent(tur, ayar) { this.type = tur; this.detail = ayar && ayar.detail; }

function ortamKur(secenek) {
  secenek = secenek || {};

  /* ---------- sahte zamanlayıcılar (bu ortama özel) ---------- */
  var zamanlayicilar = new Map();
  var siradaki = 1;
  function zt(fn, ms) {
    var no = siradaki++;
    zamanlayicilar.set(no, { no: no, fn: fn, zaman: saat + Math.max(0, Number(ms) || 0) });
    return no;
  }
  function ztIptal(no) { zamanlayicilar.delete(no); }
  function aralik(fn, ms) {
    var no = siradaki++;
    zamanlayicilar.set(no, { no: no, fn: fn, zaman: saat + ms, aralik: ms });
    return no;
  }
  function ilerlet(ms) {
    var hedef = saat + ms;
    function adim() {
      var sirada = null;
      zamanlayicilar.forEach(function (z) {
        if (z.zaman > hedef) return;
        if (!sirada || z.zaman < sirada.zaman || (z.zaman === sirada.zaman && z.no < sirada.no)) sirada = z;
      });
      if (!sirada) {
        if (hedef > saat) saat = hedef;
        return bosalt();
      }
      if (sirada.zaman > saat) saat = sirada.zaman;
      // Tarayıcı gibi: kaçırılan aralık tikleri birikmez, bir kez çalışır.
      if (sirada.aralik) sirada.zaman = saat + sirada.aralik;
      else zamanlayicilar.delete(sirada.no);
      sirada.fn();
      return bosalt().then(adim);
    }
    return bosalt().then(adim);
  }
  // Bilgisayar uyur: saat ilerler, zamanlayıcılar çalışmaz; uyanınca gecikenler çalışır.
  function uyu(ms) {
    saat += ms;
    return ilerlet(0);
  }
  function sonrakiZamanlayici() {
    var en = Infinity;
    zamanlayicilar.forEach(function (z) { if (!z.aralik) en = Math.min(en, z.zaman - saat); });
    return en;
  }

  /* ---------- sahte Firestore ---------- */
  var belgeler = new Map();
  var surumler = new Map();
  var dinleyiciler = [];
  var bulut = { akisOlu: false, islemSayisi: 0, islemler: [], kanca: null, asililar: [], abonelikSayisi: 0,
    belirtecCagri: 0, belirtecHata: false, okumaBelirtecHatasi: false, askidaKalan: 0,
    belirtecKalan: 50 * 60 * 1000, zorlaYenileme: 0, belirtecArgumanlari: [],
    onbellekten: false, ilkGoruntuGec: false };

  function foto(yol) {
    var v = belgeler.get(yol);
    return { exists: !!v, data: function () { return v; }, metadata: { fromCache: !!bulut.onbellekten } };
  }
  function bildir(yol) {
    if (bulut.akisOlu) return;
    var anlik = foto(yol);
    // Gerçek SDK'da işlemin yazdığı belge dinleyiciye ağdan, işlem sözü
    // çözüldükten sonra gelir; aynı mikro görevde değil.
    setImmediate(function () {
      if (bulut.akisOlu) return;
      dinleyiciler.slice().forEach(function (d) {
        if (d.aktif && d.yol === yol) d.basarili(anlik);
      });
    });
  }
  function belgeYaz(yol, v) {
    belgeler.set(yol, v);
    surumler.set(yol, (surumler.get(yol) || 0) + 1);
    bildir(yol);
  }
  function ref(yol) {
    return {
      path: yol,
      collection: function (ad) {
        return { doc: function (id) { return ref(yol + '/' + ad + '/' + id); } };
      },
      onSnapshot: function (basarili, hata) {
        if (bulut.abonelikAtsin) throw new Error(KUYRUK_COKTU);
        bulut.abonelikSayisi++;
        var d = { yol: yol, basarili: basarili, hata: hata, aktif: true };
        dinleyiciler.push(d);
        // İlk görüntü ya hemen (mikro görev) ya da ağdan, bekleyen işlemlerden sonra gelir.
        (bulut.ilkGoruntuGec ? function (f) { setImmediate(f); } : function (f) { Promise.resolve().then(f); })(function () {
          if (!d.aktif) return;
          if (bulut.dinlemeReddet) {
            d.aktif = false;
            hata({ code: 'permission-denied', message: 'Missing or insufficient permissions.' });
          } else if (!bulut.akisOlu) basarili(foto(yol));
        });
        // Gerçek SDK önce dinleyiciyi susturur, sonra bozuk kuyrukta eşzamanlı atar.
        return function () {
          d.aktif = false;
          if (bulut.abonelikAtsin) throw new Error(KUYRUK_COKTU);
        };
      }
    };
  }
  // Firestore hata verdiği dinleyiciyi kalıcı olarak kapatır.
  bulut.dinleyiciHatasi = function (yolSonu, e) {
    dinleyiciler.forEach(function (d) {
      if (d.aktif && d.yol.slice(-yolSonu.length) === yolSonu) {
        d.aktif = false;
        d.hata(e);
      }
    });
  };
  var db = {
    collection: function (ad) {
      return { doc: function (id) { return ref(ad + '/' + id); } };
    },
    runTransaction: function (calistir) {
      bulut.islemSayisi++;
      var kayit = { okunan: [], yazilan: [] };
      bulut.islemler.push(kayit);
      function dene(kalan) {
        var okunan = new Map();
        var yazilan = [];
        var islem = {
          get: function (r) {
            okunan.set(r.path, surumler.get(r.path) || 0);
            kayit.okunan.push(r.path);
            if (bulut.okumaBelirtecHatasi) {
              // Belirteç işlemin içinde yenilenirken ağ yüzünden düştü.
              var ah = new Error('Firebase: Error (auth/network-request-failed).');
              ah.name = 'FirebaseError';
              ah.code = 'auth/network-request-failed';
              return Promise.reject(ah);
            }
            return Promise.resolve(foto(r.path));
          },
          set: function (r, v) { yazilan.push({ yol: r.path, v: v }); }
        };
        return Promise.resolve(calistir(islem)).then(function (sonuc) {
          // Okumalar alındıktan sonra, kayıt kesinleşmeden önce olan yerel olay.
          if (bulut.islemSonrasi) {
            var kanca = bulut.islemSonrasi;
            bulut.islemSonrasi = null;
            kanca();
          }
          var cakisti = false;
          okunan.forEach(function (s, yol) { if ((surumler.get(yol) || 0) !== s) cakisti = true; });
          if (cakisti) {
            if (!kalan) throw new Error('transaction-retry-tukendi');
            return dene(kalan - 1);
          }
          yazilan.forEach(function (y) { kayit.yazilan.push(y.yol); belgeYaz(y.yol, y.v); });
          return sonuc;
        }, function (e) {
          if (e && e.name === 'FirebaseError' && FIRESTORE_KODLARI.indexOf(e.code) === -1) {
            bulut.askidaKalan++;
            return new Promise(function () {});
          }
          throw e;
        });
      }
      var tur = bulut.kanca ? bulut.kanca(kayit) : null;
      if (tur === 'asili') {
        return new Promise(function (coz, reddet) {
          bulut.asililar.push(function () { dene(4).then(coz, reddet); });
        });
      }
      if (tur === 'asiliHata') {
        return new Promise(function (coz, reddet) {
          bulut.asililar.push(function () {
            var he = new Error('unavailable');
            he.code = 'unavailable';
            reddet(he);
          });
        });
      }
      if (tur === 'hata') {
        var e = new Error('unavailable');
        e.code = 'unavailable';
        return Promise.reject(e);
      }
      // Firestore'un iç kuyruğu çökünce runTransaction söz döndürmeden atar.
      if (tur === 'atis') throw new Error(KUYRUK_COKTU);
      return dene(4);
    }
  };
  if (secenek.ilkHata) {
    bulut.kanca = function () { bulut.kanca = null; return 'hata'; };
  }

  /* ---------- sahte Auth ---------- */
  var kisi = {
    uid: 'u1', email: 'tr@example.com', displayName: 'Türksev',
    // Uykudan sonra süresi dolmuş belirteç ağ yokken yenilenemez.
    getIdTokenResult: function () {
      bulut.belirtecCagri++;
      if (bulut.belirtecHata) return kisi.getIdToken();
      return Promise.resolve({ expirationTime: new Date(saat + bulut.belirtecKalan).toUTCString() });
    },
    getIdToken: function (zorla) {
      bulut.belirtecCagri++;
      bulut.belirtecArgumanlari.push(zorla);
      if (zorla) { bulut.zorlaYenileme++; bulut.belirtecKalan = 60 * 60 * 1000; }
      if (!bulut.belirtecHata) return Promise.resolve('belirtec');
      var e = new Error('Firebase: Error (auth/network-request-failed).');
      e.name = 'FirebaseError';
      e.code = 'auth/network-request-failed';
      return Promise.reject(e);
    }
  };
  var sayac = { cikis: 0, onay: 0 };
  var auth = {
    currentUser: null,
    onAuthStateChanged: function (fn) {
      oturumDinleyen = fn;
      Promise.resolve().then(function () { auth.currentUser = kisi; fn(kisi); });
    },
    getRedirectResult: function () { return Promise.resolve(); },
    signInWithPopup: function () { return Promise.resolve(); },
    signInWithRedirect: function () { return Promise.resolve(); },
    // Gerçek SDK gibi: çıkış, oturum dinleyicisine null bildirir.
    signOut: function () {
      sayac.cikis++;
      auth.currentUser = null;
      Promise.resolve().then(function () { if (oturumDinleyen) oturumDinleyen(null); });
      return Promise.resolve();
    }
  };
  var oturumDinleyen = null;

  /* ---------- sahte DOM ---------- */
  var pencereOlay = {};
  var belgeOlay = {};
  function dinle(tablo) {
    return function (tur, fn) { (tablo[tur] = tablo[tur] || []).push(fn); };
  }
  function yay(tablo, tur, e) {
    (tablo[tur] || []).slice().forEach(function (fn) { fn(e || { type: tur }); });
  }
  function eleman(etiket) {
    var siniflar = new Set();
    var oz = {};
    var el = {
      etiket: etiket, parentNode: null, textContent: '', title: '', disabled: false,
      className: '', olaylar: {},
      classList: {
        add: function (c) { siniflar.add(c); },
        remove: function (c) { siniflar.delete(c); },
        contains: function (c) { return siniflar.has(c); }
      },
      setAttribute: function (a, v) { oz[a] = String(v); },
      getAttribute: function (a) { return Object.prototype.hasOwnProperty.call(oz, a) ? oz[a] : null; },
      removeAttribute: function (a) { delete oz[a]; },
      addEventListener: function (t, fn) { el.olaylar[t] = fn; },
      querySelector: function (s) { return s === 'span' ? el.yazi : (s === 'button' ? el.kapat : null); }
    };
    Object.defineProperty(el, 'innerHTML', {
      set: function () { el.yazi = eleman('span'); el.kapat = eleman('button'); }
    });
    return el;
  }
  var govde = {
    cocuklar: [],
    appendChild: function (el) { el.parentNode = govde; govde.cocuklar.push(el); },
    removeChild: function (el) {
      govde.cocuklar = govde.cocuklar.filter(function (x) { return x !== el; });
      el.parentNode = null;
    }
  };
  var dugme = null;
  var tema = eleman('button');
  tema.parentNode = { insertBefore: function (el) { el.parentNode = tema.parentNode; dugme = el; } };
  var belge = {
    body: govde,
    head: {
      appendChild: function (s) {
        Promise.resolve().then(function () {
          if (bulut.sdkYok) { s.onerror(); return; }
          pencere.firebase = fb;
          s.onload();
        });
      }
    },
    visibilityState: 'visible',
    createElement: eleman,
    querySelector: function (s) { return s === '.theme-toggle:not(.esit-dugme)' ? tema : null; },
    querySelectorAll: function () { return []; },
    addEventListener: dinle(belgeOlay)
  };

  /* ---------- pencere ---------- */
  var bellek = new Map();
  bellek.set('yds-bulut-etkin', 'true');
  var oturum = new Map();
  var olaylar = [];
  var yenidenYukleme = [];
  var pencere = {
    YDS: {
      yenidenYukle: function (neden) { yenidenYukleme.push(neden); return true; },
      Depo: {
        oku: function (a, varsayilan) {
          if (!bellek.has(a)) return varsayilan;
          try { return JSON.parse(bellek.get(a)); } catch (e) { return varsayilan; }
        },
        yaz: function (a, v) { bellek.set(a, JSON.stringify(v)); return true; },
        sil: function (a) { bellek.delete(a); return true; }
      }
    },
    FIREBASE_AYAR: { projectId: 'test' },
    crypto: { getRandomValues: function (d) { d[0] = 33; d[1] = 44; return d; } },
    CustomEvent: CustomEvent,
    addEventListener: dinle(pencereOlay),
    dispatchEvent: function (e) { olaylar.push(e); yay(pencereOlay, e.type, e); return true; },
    confirm: function () { sayac.onay++; return false; }
  };
  var fb = {
    apps: [],
    initializeApp: function () {},
    auth: function () { return auth; },
    firestore: function () { return db; }
  };
  fb.auth.GoogleAuthProvider = function () {};
  // SDK önceden yüklü sayılır; sdkYok seçeneğinde betik yüklemesi başarısız olur.
  bulut.sdkYok = !!secenek.sdkYok;
  if (!secenek.sdkYok) pencere.firebase = fb;

  var baglam = {
    window: pencere,
    document: belge,
    location: { protocol: 'https:', hostname: 'test', reload: function () {} },
    sessionStorage: {
      getItem: function (a) { return oturum.has(a) ? oturum.get(a) : null; },
      setItem: function (a, v) { oturum.set(a, String(v)); },
      removeItem: function (a) { oturum.delete(a); }
    },
    CustomEvent: CustomEvent,
    Uint32Array: Uint32Array,
    JSON: JSON, Date: SahteTarih, Math: Math, Object: Object, String: String, Promise: Promise,
    Error: Error, parseInt: parseInt, setTimeout: zt, clearTimeout: ztIptal,
    setInterval: aralik, clearInterval: ztIptal,
    navigator: { onLine: true }
  };
  vm.createContext(tarayiciAPIleri(baglam));
  KAYNAKLAR.forEach(function (k) { vm.runInContext(k.kod, baglam, { filename: k.dosya }); });

  function M() { return pencere.YDS.EsitlemeMotoru; }
  function bulutAlanZarfi(anahtar) {
    var v = belgeler.get(ALAN_YOLU + anahtar);
    var z = { surum: 2, alanlar: {} };
    if (v) z.alanlar[anahtar] = M().bulutAlaniniCoz(anahtar, JSON.parse(v.json));
    return z;
  }

  return {
    bulut: bulut,
    sayac: sayac,
    olaylar: olaylar,
    yenidenYukleme: yenidenYukleme,
    ilerlet: ilerlet,
    uyu: uyu,
    sonrakiZamanlayici: sonrakiZamanlayici,
    dugme: function () { return dugme; },
    uyari: function () {
      return govde.cocuklar.filter(function (el) {
        return String(el.className).indexOf('esit-uyari') === 0;
      })[0] || null;
    },
    durum: function () { return pencere.YDS.Esitleme.oturumDurumu(); },
    api: function () { return pencere.YDS.Esitleme; },
    yerelYaz: function (kayitlar) { pencere.YDS.Depo.kayitlariYaz('yds-leitner', kayitlar); },
    yerelAlanYaz: function (anahtar, deger) { pencere.YDS.Depo.yaz(anahtar, deger); },
    yerelLeitner: function () { return pencere.YDS.EsitlemeDepo.paket()['yds-leitner'] || {}; },
    bulutLeitner: function () { return M().paket(bulutAlanZarfi('yds-leitner'))['yds-leitner'] || {}; },
    // Öbür cihaz: bulut alanını okuyup kendi kaydını ekler ve geri yazar.
    uzaktanYaz: function (kayitlar) {
      var zarf = M().kayitlariYaz(bulutAlanZarfi('yds-leitner'), 'yds-leitner', kayitlar,
        function () { return String(saat + 7) + ':uzak'; });
      belgeYaz(ALAN_YOLU + 'yds-leitner', {
        surum: 3,
        anahtar: 'yds-leitner',
        zaman: saat,
        json: M().bulutAlanJson('yds-leitner', zarf.alanlar['yds-leitner'])
      });
    },
    aktifDinleyici: function () {
      return dinleyiciler.filter(function (d) { return d.aktif; }).length;
    },
    gorunurluk: function (durum) {
      belge.visibilityState = durum;
      yay(belgeOlay, 'visibilitychange');
    },
    pencereYay: function (tur, e) { yay(pencereOlay, tur, e); },
    cevrimici: function (acik) { baglam.navigator.onLine = acik; },
    belgeYay: function (tur, e) { yay(belgeOlay, tur, e); },
    tamOkumaMi: function (kayit) {
      var alanlar = kayit.okunan.filter(function (y) { return y.indexOf(ALAN_YOLU) === 0; });
      return new Set(alanlar).size === Object.keys(M().TIPLER).length &&
        kayit.okunan.indexOf(YONETIM_YOLU) !== -1;
    },
    kapat: function () {
      zamanlayicilar.clear();
      dinleyiciler.forEach(function (d) { d.aktif = false; });
    }
  };
}

function kayit(k) { return { k: k || 1, g: 30, c: 20 }; }

async function acilis(secenek) {
  var o = ortamKur(secenek);
  await o.ilerlet(0);
  return o;
}

/* 1. Kesintisiz çalışmada gönderim ertelenip durmaz. */
async function azamiBekleme() {
  var o = await acilis();
  assert.strictEqual(o.durum().hazir, true, 'ilk eşitleme tamamlanmadı');
  var once = o.bulut.islemSayisi;
  var ilkGonderim = null;
  for (var i = 0; i < 10; i++) {
    var yeni = {};
    yeni['surekli' + i] = kayit(1);
    o.yerelYaz(yeni);
    await o.ilerlet(2000);
    if (ilkGonderim === null && o.bulut.islemSayisi > once) ilkGonderim = (i + 1) * 2000;
  }
  assert.ok(ilkGonderim !== null && ilkGonderim <= 16000,
    '2 sn arayla süren cevaplarda ilk gönderim 15 sn içinde yapılmadı: ' + ilkGonderim);
  assert.ok(o.bulutLeitner().surekli0, 'ilk değişiklik çalışma sürerken buluta gitmedi');
  var gonderimler = o.bulut.islemSayisi - once;
  assert.ok(gonderimler <= 3, '20 sn kesintisiz çalışmada gereğinden sık gönderim: ' + gonderimler);
  await o.ilerlet(2500);
  assert.ok(o.bulutLeitner().surekli9, 'çalışma bitince kalan kuyruk 2,5 sn içinde gitmedi');
  // Seyrek değişiklik eski davranışla 2,5 sn sonra gider, daha erken değil.
  var n = o.bulut.islemSayisi;
  o.yerelYaz({ seyrek: kayit(2) });
  await o.ilerlet(2400);
  assert.strictEqual(o.bulut.islemSayisi, n, 'tek değişiklik 2,5 sn dolmadan gönderildi');
  await o.ilerlet(100);
  assert.strictEqual(o.bulut.islemSayisi, n + 1);
  o.kapat();
}

/* 2. Akış sessizce öldüyse sayfaya dönüş tam birleşimle kaçanı getirir. */
async function sayfayaDonus() {
  var o = await acilis();
  o.bulut.akisOlu = true;
  o.uzaktanYaz({ isyerinde: kayit(4) });
  await o.ilerlet(1000);
  assert.strictEqual(o.yerelLeitner().isyerinde, undefined, 'önkoşul: ölü akış kaydı getirmemeli');
  var n = o.bulut.islemSayisi;
  o.gorunurluk('hidden');
  o.gorunurluk('visible');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n, 'yakın zamanda doğrulanmış bağlantıda gereksiz tam okuma');
  o.gorunurluk('hidden');
  await o.ilerlet(10 * DAKIKA);
  o.gorunurluk('visible');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 1, 'uzun aradan sonra sayfaya dönüş tam birleşim yapmadı');
  assert.ok(o.tamOkumaMi(o.bulut.islemler[o.bulut.islemler.length - 1]),
    'yakalama bütün alanları ve yönetim işaretçisini okumadı');
  assert.strictEqual(o.yerelLeitner().isyerinde.k, 4, 'öbür cihazın kaydı sayfaya dönüşte gelmedi');
  assert.deepStrictEqual(o.yenidenYukleme, [], 'yakalama sayfayı yeniden yükledi');
  assert.ok(o.olaylar.some(function (e) {
    return e.type === 'yds-depo-degisti' && e.detail.kaynak === 'bulut' &&
      e.detail.anahtarlar.indexOf('yds-leitner') !== -1;
  }), 'yakalama ekranların dinlediği değişiklik olayını yaymadı');
  o.kapat();
}

/* 3. bfcache dönüşü, ağın gelmesi, donmadan çözülme ve uyku eşiği beklemez
      (üst üste gelenler tek birleşime iner); odak eşiğe uyar; gizli sayfa
      hiçbir şey okumaz. */
async function uyanmaOlaylari() {
  var o = await acilis();
  // Açılıştaki tam birleşimin hemen ardından gelen dönüş olayı yeniden okumaz.
  o.pencereYay('pageshow', { type: 'pageshow', persisted: true });
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, 1, 'taze tam birleşimin ardından bfcache dönüşü yeniden okudu');
  await o.ilerlet(61000);
  var n = o.bulut.islemSayisi;
  o.pencereYay('pageshow', { type: 'pageshow', persisted: false });
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n, 'normal pageshow ek okuma yaptı');
  o.pencereYay('pageshow', { type: 'pageshow', persisted: true });
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 1, 'geri/ileri önbellekten dönüş tam birleşim yapmadı');
  o.pencereYay('online');
  o.belgeYay('resume');
  o.pencereYay('online');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 1, 'üst üste gelen uyanma olayları ayrı ayrı tam birleşim yaptı');
  await o.ilerlet(61000);
  o.pencereYay('online');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 1, 'sağlıklı sayfada her ağ dönüşü tam birleşim yaptı');
  await o.ilerlet(60000);
  o.pencereYay('online');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 2, '2 dk temassızlıktan sonra ağ dönüşü tam birleşim yapmadı');
  await o.ilerlet(61000);
  o.belgeYay('resume');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 3, 'dondurulan sayfa çözülünce tam birleşim yapılmadı');
  await o.ilerlet(61000);
  o.pencereYay('focus');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 3, '5 dk dolmadan odak tam birleşim yaptı');
  // Görünür sekmede bilgisayar uyur: hiçbir sayfa olayı gelmez, nabız yakalar.
  o.bulut.akisOlu = true;
  o.uzaktanYaz({ uykuda: kayit(3) });
  await o.uyu(10 * DAKIKA);
  assert.strictEqual(o.bulut.islemSayisi, n + 4, 'uykudan uyanan görünür sekme tam birleşim yapmadı');
  assert.strictEqual(o.yerelLeitner().uykuda.k, 3, 'uyku sırasında yazılan kayıt gelmedi');
  // Sekmeye dönüş 2 dk, pencere odağı 5 dk temassızlıktan sonra yakalar.
  await o.ilerlet(3 * DAKIKA);
  o.pencereYay('focus');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 4, 'odak 5 dk dolmadan tam birleşim yaptı');
  o.gorunurluk('hidden');
  o.gorunurluk('visible');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 5, 'sekmeye 2 dk sonra dönüş tam birleşim yapmadı');
  await o.ilerlet(10 * DAKIKA);
  assert.strictEqual(o.bulut.islemSayisi, n + 5, 'uyanık geçen zaman nabzı tetikledi');
  o.pencereYay('focus');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 6, 'uzun temassızlıktan sonra odak tam birleşim yapmadı');
  o.gorunurluk('hidden');
  await o.uyu(10 * DAKIKA);
  await o.ilerlet(61000);
  o.pencereYay('online');
  o.pencereYay('focus');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 6, 'gizli sayfa bulutu okudu');
  o.kapat();
}

/* 4. Firestore hata verip kapattığı dinleyici kendini onarır. */
async function dinleyiciOnarimi() {
  var o = await acilis();
  var n = o.bulut.islemSayisi;
  var aktif = o.aktifDinleyici();
  assert.strictEqual(aktif, 15, 'kök + 13 alan + yönetim dinleyicisi kurulmadı');
  o.bulut.dinleyiciHatasi('/alanlar/yds-leitner', { code: 'internal', message: 'internal' });
  await o.ilerlet(0);
  assert.strictEqual(o.aktifDinleyici(), aktif - 1);
  assert.ok(o.uyari() && /^Öbür cihazlardaki değişiklikler şu an alınamıyor; yeniden bağlanılıyor/.test(o.uyari().yazi.textContent),
    'kopan dinleyici görünür ve doğru uyarı vermedi');
  assert.ok(o.olaylar.some(function (e) {
    return e.type === 'yds-esitleme-durumu' && e.detail.durum === 'hata';
  }), 'kopan dinleyici Ayarlar için hata durumu yaymadı');
  o.uzaktanYaz({ onarim: kayit(3) });
  await o.ilerlet(1000);
  assert.strictEqual(o.yerelLeitner().onarim, undefined, 'önkoşul: kapalı dinleyici kaydı getirmemeli');
  await o.ilerlet(15000);
  assert.strictEqual(o.aktifDinleyici(), aktif, 'dinleyiciler yeniden kurulmadı');
  assert.ok(o.bulut.islemSayisi > n, 'onarım tam birleşim yapmadı');
  assert.strictEqual(o.yerelLeitner().onarim.k, 3, 'kopukluk sırasında gelen kayıt alınmadı');
  o.uzaktanYaz({ canli: kayit(2) });
  await o.ilerlet(0);
  assert.strictEqual(o.yerelLeitner().canli.k, 2, 'onarılan dinleyici canlı değişikliği getirmedi');
  assert.strictEqual(o.uyari(), null, 'onarımdan sonra uyarı kapanmadı');
  o.kapat();
}

/* 5. Hiç sonuçlanmayan işlem kuyruğu kalıcı olarak kilitlemez. */
async function takilmaBekcisi() {
  var o = await acilis();
  o.bulut.kanca = function () { o.bulut.kanca = null; return 'asili'; };
  o.yerelYaz({ takili: kayit(1) });
  await o.ilerlet(2500);
  var n = o.bulut.islemSayisi;
  assert.strictEqual(o.bulut.asililar.length, 1, 'önkoşul: askıda işlem yok');
  o.yerelYaz({ sonra: kayit(1) });
  await o.ilerlet(30000);
  assert.strictEqual(o.bulut.islemSayisi, n, 'askıdaki işlem sürerken ikinci işlem başladı');
  assert.strictEqual(o.bulutLeitner().takili, undefined);
  // Kullanıcı hiçbir şey yapmasa da nabız işlemi terk edip (geri çekilmeyle) kuyruğu gönderir.
  await o.ilerlet(2 * DAKIKA + 20000);
  var b = o.bulutLeitner();
  assert.ok(b.takili && b.sonra, 'takılan işlemden sonra kuyruk kendiliğinden buluta gitmedi');
  assert.ok(o.olaylar.some(function (e) {
    return e.type === 'yds-esitleme-durumu' && e.detail.durum === 'hata' &&
      /Bulut yanıt vermiyor/.test(e.detail.mesaj);
  }), 'takılma bekçisi devreye girdiğini bildirmedi');
  assert.strictEqual(o.uyari(), null, 'başarılı yeniden denemeden sonra takılma uyarısı kapanmadı');
  assert.ok(o.tamOkumaMi(o.bulut.islemler[o.bulut.islemler.length - 1]),
    'terk edilen işlemin alanları bilinmediği hâlde tam birleşim yapılmadı');
  o.yerelYaz({ ucuncu: kayit(1) });
  await o.ilerlet(2500);
  assert.ok(o.bulutLeitner().ucuncu, 'terk sonrası yeni değişiklik gitmedi');
  // Terk edilen işlem geç sonuçlanırsa durumu bozmaz.
  o.bulut.asililar.shift()();
  await o.ilerlet(0);
  assert.strictEqual(o.durum().mesgul, false, 'geç sonuç meşgul durumunu bozdu');
  assert.strictEqual(o.uyari(), null);
  o.yerelYaz({ dorduncu: kayit(1) });
  await o.ilerlet(2500);
  assert.ok(o.bulutLeitner().dorduncu, 'geç sonuç kuyruğu kilitledi');
  // Yeniden deneme de takılırsa ikinci terk sayfayı yenilemeyi önerir.
  var askida = 2;
  o.bulut.kanca = function () { if (askida > 0) { askida--; return 'asili'; } return null; };
  o.yerelYaz({ ikiKez: kayit(1) });
  // İki takılma (2 dk + 2 dk) ve aralarındaki geri çekilme (15 sn, 30 sn).
  await o.ilerlet(7 * DAKIKA);
  assert.ok(o.olaylar.some(function (e) {
    return e.type === 'yds-esitleme-durumu' && /sayfayı yenilemek düzeltebilir/.test(e.detail.mesaj);
  }), 'üst üste takılmada yenileme önerilmedi');
  assert.ok(o.bulutLeitner().ikiKez, 'iki takılmadan sonra kuyruk gitmedi');
  assert.strictEqual(o.uyari(), null);
  var sonHata = function () {
    var h = o.olaylar.filter(function (e) { return e.type === 'yds-esitleme-durumu' && e.detail.durum === 'hata'; });
    return h.length ? h[h.length - 1].detail.mesaj : '';
  };
  o.bulut.kanca = function () { o.bulut.kanca = null; return 'asili'; };
  o.yerelYaz({ tekTakilma: kayit(1) });
  await o.ilerlet(3 * DAKIKA);
  assert.ok(/yeniden deneniyor/.test(sonHata()), 'düzelmiş takılmadan sonraki tek takılma yenileme önerdi: ' + sonHata());
  assert.ok(o.bulutLeitner().tekTakilma);
  o.kapat();
}

/* 6. Art arda hatada geri çekilme; zorlamasız uyanma ona uyar, ağın gelmesi beklemez. */
async function geriCekilme() {
  var o = await acilis();
  var kalanHata = 3;
  o.bulut.kanca = function () {
    if (kalanHata > 0) { kalanHata--; return 'hata'; }
    return null;
  };
  var n = o.bulut.islemSayisi;
  o.yerelYaz({ geri: kayit(2) });
  await o.ilerlet(2500);
  assert.strictEqual(o.bulut.islemSayisi, n + 1);
  assert.ok(o.uyari() && /Yazılamadı/.test(o.uyari().yazi.textContent), 'hata görünür değil');
  assert.strictEqual(o.sonrakiZamanlayici(), 15000, 'ilk yeniden deneme 15 sn sonra değil');
  assert.ok(/tr@example\.com/.test(o.dugme().title) && /Şimdi eşitlemek için tıkla/.test(o.dugme().title),
    'uyarıdayken düğme ipucu hesabı ve tıklama ipucunu kaybetti');
  await o.ilerlet(15000);
  assert.strictEqual(o.bulut.islemSayisi, n + 2);
  assert.strictEqual(o.sonrakiZamanlayici(), 30000, 'ikinci hatada bekleme iki katına çıkmadı');
  o.yerelYaz({ arada: kayit(1) });
  await o.ilerlet(2500);
  assert.strictEqual(o.bulut.islemSayisi, n + 2, 'yeni değişiklik geri çekilmeyi deldi');
  o.pencereYay('online');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 3, 'ağ geri gelince beklemeden denenmedi');
  assert.strictEqual(o.sonrakiZamanlayici(), 60000, 'üçüncü hatada bekleme 60 sn değil');
  await o.ilerlet(60000);
  assert.strictEqual(o.bulut.islemSayisi, n + 4);
  assert.ok(o.bulutLeitner().geri && o.bulutLeitner().arada, 'hata geçince kuyruk gitmedi');
  assert.strictEqual(o.uyari(), null, 'başarıdan sonra uyarı kapanmadı');
  o.yerelYaz({ sonra: kayit(1) });
  await o.ilerlet(2500);
  assert.strictEqual(o.bulut.islemSayisi, n + 5, 'başarıdan sonra normal 2,5 sn gecikmesine dönülmedi');
  o.kapat();
}

/* 7. Girişliyken düğme bağlantıyı kesmez, hemen eşitler. */
async function simdiEsitle() {
  var o = await acilis();
  var d = o.dugme();
  assert.strictEqual(d.textContent, 'T');
  assert.ok(d.title.indexOf('Şimdi eşitlemek için tıkla') !== -1, 'düğme ipucu yeni davranışı anlatmıyor');
  o.bulut.akisOlu = true;
  o.uzaktanYaz({ tiklama: kayit(5) });
  var n = o.bulut.islemSayisi;
  o.yerelYaz({ bekleyen: kayit(1) });
  d.olaylar.click();
  d.olaylar.click();
  assert.ok(d.classList.contains('esitleniyor'));
  assert.strictEqual(d.getAttribute('aria-busy'), 'true');
  assert.ok(o.uyari() && o.uyari().yazi.textContent === 'Eşitleniyor…', 'elle eşitleme sürerken geri bildirim yok');
  assert.strictEqual(o.uyari().kapat.getAttribute('aria-label'), 'Bildirimi kapat');
  await o.ilerlet(0);
  assert.strictEqual(o.sayac.onay, 0, 'tıklama hâlâ çıkış onayı soruyor');
  assert.strictEqual(o.sayac.cikis, 0, 'tıklama oturumu kapattı');
  assert.strictEqual(o.bulut.islemSayisi, n + 1, 'çift tıklama tek tam birleşime inmedi');
  assert.ok(o.tamOkumaMi(o.bulut.islemler[o.bulut.islemler.length - 1]));
  assert.strictEqual(o.yerelLeitner().tiklama.k, 5, 'elle eşitleme öbür cihazın kaydını getirmedi');
  assert.ok(!d.classList.contains('esitleniyor'));
  assert.strictEqual(d.getAttribute('aria-busy'), null);
  assert.strictEqual(o.durum().bagli, true);
  var bilgi = o.uyari();
  assert.ok(bilgi && bilgi.className === 'esit-uyari bilgi', 'elle eşitleme onayı görünmedi');
  assert.ok(/^Eşitlendi /.test(bilgi.yazi.textContent));
  assert.strictEqual(bilgi.getAttribute('role'), 'status');
  assert.ok(o.bulutLeitner().bekleyen, 'elle eşitleme bekleyen yerel değişikliği göndermedi');
  await o.ilerlet(1000);
  assert.ok(o.uyari() && /^Eşitlendi /.test(o.uyari().yazi.textContent),
    'gönderimin buluttan dönen yankısı onayı hemen kapattı');
  await o.ilerlet(2000);
  assert.strictEqual(o.uyari(), null, 'onay kendiliğinden kapanmadı');
  // Hata uyarısı açıkken elle eşitleme başarılı olursa uyarı kapanır, onay görünür.
  o.bulut.kanca = function () { o.bulut.kanca = null; return 'hata'; };
  d.olaylar.click();
  await o.ilerlet(0);
  assert.ok(o.uyari() && o.uyari().className === 'esit-uyari', 'başarısız elle eşitleme uyarı vermedi');
  assert.ok(d.classList.contains('hata'));
  d.olaylar.click();
  await o.ilerlet(0);
  assert.ok(o.uyari() && o.uyari().className === 'esit-uyari bilgi', 'yeniden deneme başarı onayı vermedi');
  assert.ok(!d.classList.contains('hata'));
  o.kapat();
}

/* 9. Çökmüş Firestore kuyruğunun eşzamanlı atışı gönderimi ya da dinlemeyi kilitlemez. */
async function eszamanliAtis() {
  var o = await acilis();
  o.bulut.kanca = function () { o.bulut.kanca = null; return 'atis'; };
  o.yerelYaz({ atis: kayit(1) });
  await o.ilerlet(2500);
  assert.strictEqual(o.durum().mesgul, false, 'eşzamanlı atış gönderim bayrağını takılı bıraktı');
  assert.ok(o.uyari() && /^Bulut bağlantısı bozuldu; sayfayı yenile\./.test(o.uyari().yazi.textContent),
    'çökmüş kuyruk anlaşılır uyarı vermedi');
  await o.ilerlet(15000);
  assert.ok(o.bulutLeitner().atis, 'atıştan sonra yeniden deneme göndermedi');
  // Dinleyiciler yeniden kurulurken atış: hata yayılmaz, bekleme büyür, sonra toparlanır.
  o.bulut.abonelikAtsin = true;
  o.bulut.dinleyiciHatasi('/alanlar/yds-leitner', { code: 'internal' });
  await o.ilerlet(15000);
  assert.strictEqual(o.aktifDinleyici(), 0, 'önkoşul: atan abonelikler kurulmamalı');
  assert.strictEqual(o.sonrakiZamanlayici(), 30000, 'yinelenen dinleme hatası beklemeyi büyütmedi');
  o.bulut.abonelikAtsin = false;
  await o.ilerlet(30000);
  assert.strictEqual(o.aktifDinleyici(), 15, 'kuyruk düzelince dinleyiciler kurulmadı');
  // Bozuk kuyrukta aboneliği bırakmak da atar: Ayarlar'dan çıkış yine tamamlanır.
  o.bulut.abonelikAtsin = true;
  await o.api().cikisYap();
  assert.strictEqual(o.sayac.cikis, 1, 'bozuk kuyrukta çıkış oturumu kapatamadı');
  o.kapat();
}

/* 11. Kalıcı dinleme hatası (ör. okuma izni) sınırsız yeniden kurma döngüsü
       yaratmaz; düğme dinleyicileri yeniden kurar. */
async function kaliciDinlemeHatasi() {
  var o = await acilis();
  var once = o.bulut.abonelikSayisi;
  o.bulut.dinlemeReddet = true;
  o.bulut.dinleyiciHatasi('/alanlar/yds-leitner', { code: 'permission-denied' });
  await o.ilerlet(60 * DAKIKA);
  var kurulus = (o.bulut.abonelikSayisi - once) / 15;
  assert.strictEqual(kurulus, 6, 'kalıcı hatada yeniden kurma sınırsız sürdü: ' + kurulus);
  assert.strictEqual(o.sonrakiZamanlayici(), Infinity, 'vazgeçilen onarım için zamanlayıcı kaldı');
  assert.ok(o.uyari() && /okuma izni reddedildi/.test(o.uyari().yazi.textContent),
    'kalıcı okuma hatası görünür değil ya da yanlış etiketli');
  assert.ok(/Yeniden denemek için eşitleme düğmesine tıkla/.test(o.uyari().yazi.textContent) &&
    !/yeniden bağlanılıyor/.test(o.uyari().yazi.textContent),
    'vazgeçilen onarımda uyarı hâlâ "yeniden bağlanılıyor" diyor');
  o.bulut.dinlemeReddet = false;
  o.dugme().olaylar.click();
  await o.ilerlet(0);
  assert.strictEqual(o.aktifDinleyici(), 15, 'düğme vazgeçilmiş dinleyicileri yeniden kurmadı');
  assert.strictEqual(o.uyari() && o.uyari().className, 'esit-uyari bilgi',
    'dinleyiciler kurulunca kalıcı uyarı kapanmadı');

  // Kota dolup saatlerce sürse de, sorun geçince sayfaya dönüş dinleyicileri kurar.
  o.bulut.dinlemeReddet = true;
  o.bulut.dinleyiciHatasi('/alanlar/yds-leitner', { code: 'resource-exhausted' });
  await o.ilerlet(60 * DAKIKA);
  assert.strictEqual(o.aktifDinleyici(), 0, 'önkoşul: onarımdan yeniden vazgeçilmeli');
  o.bulut.dinlemeReddet = false;
  o.gorunurluk('hidden');
  await o.ilerlet(3 * DAKIKA);
  o.gorunurluk('visible');
  await o.ilerlet(0);
  assert.strictEqual(o.aktifDinleyici(), 15, 'sayfaya dönüş vazgeçilmiş dinleyicileri kurmadı');
  o.kapat();
}

/* 10. Başarısız yakalama doğru uyarı verir, geri çekilmeyle yeniden dener;
       çevrimdışıyken otomatik uyanma denemez. */
async function basarisizYakalama() {
  var o = await acilis();
  await o.ilerlet(61000);
  o.bulut.akisOlu = true;
  o.uzaktanYaz({ gelecek: kayit(2) });
  var kalanHata = 2;
  o.bulut.kanca = function () {
    if (kalanHata > 0) { kalanHata--; return 'hata'; }
    return null;
  };
  var n = o.bulut.islemSayisi;
  o.pencereYay('pageshow', { type: 'pageshow', persisted: true });
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 1);
  assert.strictEqual(o.uyari(), null, 'bekleyen değişiklik yokken ilk geçici hata uyarı çubuğu açtı');
  assert.ok(/Bulutla eşitlenemedi; yeniden denenecek/.test(o.dugme().title),
    'ilk hata düğme ipucunda görünmüyor');
  assert.strictEqual(o.sonrakiZamanlayici(), 15000, 'başarısız yakalama geri çekilmeyle yeniden denenmiyor');
  await o.ilerlet(15000);
  assert.strictEqual(o.bulut.islemSayisi, n + 2);
  assert.ok(o.uyari() && /^Bulutla eşitlenemedi; yeniden denenecek/.test(o.uyari().yazi.textContent),
    'yinelenen hata görünür değil ya da yanlışlıkla "yazılamadı" diyor');
  assert.strictEqual(o.sonrakiZamanlayici(), 30000);
  await o.ilerlet(30000);
  n++;
  assert.strictEqual(o.bulut.islemSayisi, n + 2);
  assert.ok(o.tamOkumaMi(o.bulut.islemler[o.bulut.islemler.length - 1]), 'yeniden deneme tam birleşim değil');
  assert.strictEqual(o.yerelLeitner().gelecek.k, 2, 'yeniden deneme kaçanı getirmedi');
  assert.strictEqual(o.uyari(), null);
  assert.strictEqual(o.sonrakiZamanlayici(), Infinity, 'başarıdan sonra yeniden deneme sürüyor');
  o.cevrimici(false);
  await o.ilerlet(3 * DAKIKA);
  o.gorunurluk('hidden');
  o.gorunurluk('visible');
  o.pencereYay('focus');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 2, 'çevrimdışıyken otomatik tam birleşim denendi');
  o.cevrimici(true);
  o.pencereYay('online');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 3, 'ağ gelince tam birleşim yapılmadı');
  o.kapat();
}

/* 12. Açılış birleşimi sırasında kart cevaplamak sayfayı yenilemez; yalnız
       bulut yeni bir şey getirdiyse yenilenir. Değişiklik yine de gönderilir. */
async function acilistaYenileme() {
  var o = ortamKur();
  o.bulut.islemSonrasi = function () { o.yerelYaz({ hizli: kayit(1) }); };
  await o.ilerlet(0);
  assert.strictEqual(o.durum().hazir, true);
  assert.deepStrictEqual(o.yenidenYukleme, [], 'açılışta cevaplanan kart sayfayı yeniden yükletti');
  await o.ilerlet(2500);
  assert.ok(o.bulutLeitner().hizli, 'açılış sırasında yapılan değişiklik gönderilmedi');
  o.kapat();

  // Bulutta yerelde olmayan kayıt varsa açılış yine yeniler (ekran güncel veriyle kurulsun).
  var b = ortamKur();
  b.uzaktanYaz({ bulutta: kayit(4) });
  b.bulut.islemSonrasi = function () { b.yerelYaz({ hizli2: kayit(1) }); };
  await b.ilerlet(0);
  assert.deepStrictEqual(b.yenidenYukleme, ['bulut-ilk-birlesim'],
    'buluttan yeni kayıt gelince açılış sayfayı yenilemedi');
  b.kapat();
}

/* 13. Açılışta ağ yokken SDK yüklenemediyse ağ gelince kendiliğinden yeniden denenir. */
async function sdkYenidenYukleme() {
  var o = await acilis({ sdkYok: true });
  assert.strictEqual(o.dugme().textContent, '⇅', 'önkoşul: SDK yüklenemedi');
  assert.ok(o.uyari() && /yüklenemedi|çevrimdışı/.test(o.uyari().yazi.textContent));
  o.uyari().kapat.olaylar.click();
  assert.strictEqual(o.uyari(), null);
  o.gorunurluk('hidden');
  o.gorunurluk('visible');
  await o.ilerlet(0);
  assert.strictEqual(o.uyari(), null, 'kendiliğinden SDK denemesi kapatılan uyarıyı geri getirdi');
  assert.ok(/yüklenemedi/.test(o.dugme().title), 'başarısız deneme düğme ipucuna yazılmadı');
  await o.ilerlet(61000);
  o.bulut.sdkYok = false;
  o.pencereYay('online');
  await o.ilerlet(0);
  assert.strictEqual(o.dugme().textContent, 'T', 'ağ gelince SDK yeniden yüklenmedi');
  assert.strictEqual(o.durum().hazir, true, 'SDK yüklendikten sonra ilk eşitleme yapılmadı');
  assert.strictEqual(o.uyari(), null);
  o.kapat();
}

/* 14. Uykudan sonra süresi dolmuş belirteç ağ yokken yenilenemezse bu, Firestore
       işlemine girmeden sıradan bir hata olur: takılma yok, görünür uyarı,
       geri çekilmeyle yeniden deneme. */
async function belirtecYenileme() {
  var o = await acilis();
  assert.ok(o.bulut.belirtecCagri >= 1, 'belirteç işlemden önce hazırlanmadı');
  var n = o.bulut.islemSayisi;
  o.bulut.belirtecHata = true;
  o.yerelYaz({ uyanis: kayit(1) });
  await o.ilerlet(2500);
  assert.strictEqual(o.bulut.islemSayisi, n, 'belirteç yenilenemeden Firestore işlemine girildi');
  assert.strictEqual(o.durum().mesgul, false, 'belirteç hatası gönderimi takılı bıraktı');
  assert.ok(o.uyari() && /ağ bağlantısı hazır değil/.test(o.uyari().yazi.textContent),
    'belirteç hatası anlaşılır uyarı vermedi');
  o.bulut.belirtecHata = false;
  await o.ilerlet(15000);
  assert.ok(o.bulutLeitner().uyanis, 'ağ gelince yeniden deneme göndermedi');
  assert.strictEqual(o.uyari(), null);
  assert.ok(o.bulut.belirtecArgumanlari.every(function (a) { return !a; }),
    'süresi dolmamış belirteç her işlemde zorla yenileniyor');
  o.bulut.belirtecKalan = 3 * DAKIKA;
  o.yerelYaz({ payli: kayit(1) });
  await o.ilerlet(2500);
  assert.strictEqual(o.bulut.zorlaYenileme, 1, 'süresine 3 dk kalan belirteç işlemden önce yenilenmedi');
  assert.ok(o.bulutLeitner().payli);
  o.kapat();
}

/* 16. Belirteç işlemin içindeki okumada düşerse (ön yenilemeden sonra süresi
       doldu) Firestore'un tanımadığı auth hatası düz hataya çevrilir: işlem
       askıda kalmaz, hemen uyarı ve geri çekilmeyle yeniden deneme olur. */
async function islemIciBelirtec() {
  var o = await acilis();
  o.bulut.okumaBelirtecHatasi = true;
  o.yerelYaz({ icerde: kayit(1) });
  await o.ilerlet(2500);
  assert.strictEqual(o.bulut.askidaKalan, 0, 'auth hatası işlemi askıda bıraktı');
  assert.strictEqual(o.durum().mesgul, false);
  assert.ok(o.uyari() && /ağ bağlantısı hazır değil/.test(o.uyari().yazi.textContent),
    'işlem içi belirteç hatası anlaşılır uyarı vermedi');
  // Öbür cihazdan gelen veri, bu cihazın gönderim sorununu "Eşitlendi" diye örtmez.
  o.uzaktanYaz({ evden: kayit(2) });
  await o.ilerlet(0);
  assert.strictEqual(o.yerelLeitner().evden.k, 2, 'canlı akış veriyi getirmedi');
  assert.ok(o.uyari() && /Yazılamadı/.test(o.uyari().yazi.textContent),
    'gelen veri gönderim hatası uyarısını kapattı');
  assert.ok(!/Eşitlendi/.test(o.dugme().title), 'gönderim hatalıyken düğme "Eşitlendi" diyor');
  o.bulut.okumaBelirtecHatasi = false;
  await o.ilerlet(15000);
  assert.ok(o.bulutLeitner().icerde, 'yeniden deneme göndermedi');
  assert.strictEqual(o.uyari(), null);
  o.kapat();
}

/* 15. Açılıştaki ilk eşitleme takılırsa (hazır olmadan) nabız onu da terk edip
       yeniden başlatır; dinleyiciler kurulur, açılışta yapılan çalışma gider. */
async function ilkTakilma() {
  var o = ortamKur();
  o.bulut.kanca = function () { o.bulut.kanca = null; return 'asili'; };
  await o.ilerlet(0);
  assert.strictEqual(o.durum().hazir, false, 'önkoşul: ilk eşitleme askıda olmalı');
  assert.strictEqual(o.durum().mesgul, true);
  o.yerelYaz({ acilista: kayit(1) });
  o.uzaktanYaz({ evden: kayit(3) });
  await o.ilerlet(3 * DAKIKA);
  assert.strictEqual(o.durum().hazir, true, 'takılan ilk eşitleme kendiliğinden yeniden başlamadı');
  assert.strictEqual(o.aktifDinleyici(), 15, 'takılan açılıştan sonra dinleyiciler kurulmadı');
  assert.ok(o.bulutLeitner().acilista, 'takılan açılış sırasında yapılan çalışma gitmedi');
  assert.deepStrictEqual(o.yenidenYukleme, ['bulut-ilk-birlesim'],
    'buluttaki kayıt gelince ekran yenilenmedi');
  // Terk edilen açılış işlemi geç biterse ikinci kez yenileme ya da dinleyici kurmaz.
  o.bulut.asililar.shift()();
  await o.ilerlet(0);
  assert.deepStrictEqual(o.yenidenYukleme, ['bulut-ilk-birlesim'], 'geç biten açılış yeniden yükletti');
  assert.strictEqual(o.aktifDinleyici(), 15);
  o.kapat();
}

/* 17. Düğme askıdaki işlemi (kara delik istek) 2 dk beklemez: 10 sn'den eskiyse
       terk edip yeni tam birleşim başlatır; dinleyici onarımı da beklemeden yapılır. */
async function elleKesme() {
  var o = await acilis();
  o.bulut.kanca = function () { o.bulut.kanca = null; return 'asili'; };
  o.yerelYaz({ askida: kayit(1) });
  await o.ilerlet(2500);
  assert.strictEqual(o.bulut.asililar.length, 1, 'önkoşul: işlem askıda');
  await o.ilerlet(11000);
  o.dugme().olaylar.click();
  await o.ilerlet(0);
  assert.ok(o.bulutLeitner().askida, 'düğme askıdaki işlemi kesip yeniden göndermedi');
  assert.ok(!o.dugme().classList.contains('esitleniyor'), 'düğme meşgul kaldı');
  assert.ok(o.uyari() && /^Eşitlendi /.test(o.uyari().yazi.textContent));
  // Dinleyici onarımı geri çekilme beklerken düğme onu hemen kurar.
  o.bulut.dinleyiciHatasi('/alanlar/yds-leitner', { code: 'internal' });
  await o.ilerlet(0);
  assert.strictEqual(o.aktifDinleyici(), 14);
  await o.ilerlet(3000);
  o.dugme().olaylar.click();
  await o.ilerlet(0);
  assert.strictEqual(o.aktifDinleyici(), 15, 'düğme kopan dinleyiciyi beklemeden kurmadı');
  o.bulut.asililar.length = 0;
  o.kapat();
}

/* 18. Terk edilen işlemin geç sonucu, yerine başlayan ve hâlâ uçuştaki işlemin
       durumunu bozmaz (gönderimde ve açılışta). */
async function gecSonucUcusta() {
  var o = await acilis();
  var askida = 2;
  o.bulut.kanca = function () { if (askida > 0) { askida--; return 'asili'; } return null; };
  o.yerelYaz({ birinci: kayit(1) });
  await o.ilerlet(2500);
  await o.ilerlet(3 * DAKIKA);
  assert.strictEqual(o.bulut.asililar.length, 2, 'önkoşul: iki işlem askıda');
  assert.strictEqual(o.durum().mesgul, true);
  o.bulut.asililar.shift()();
  await o.ilerlet(0);
  assert.strictEqual(o.durum().mesgul, true, 'terk edilen işlemin geç sonucu uçuştaki işlemin meşgul bayrağını sildi');
  var n = o.bulut.islemSayisi;
  o.yerelYaz({ ikinci: kayit(1) });
  await o.ilerlet(2500);
  assert.strictEqual(o.bulut.islemSayisi, n, 'geç sonuçtan sonra uçuştaki işlemle örtüşen yeni işlem başladı');
  o.bulut.asililar.shift()();
  await o.ilerlet(3000);
  assert.strictEqual(o.durum().mesgul, false);
  assert.ok(o.bulutLeitner().birinci && o.bulutLeitner().ikinci);
  o.kapat();

  var a = ortamKur();
  var askidaA = 2;
  a.bulut.kanca = function () { if (askidaA > 0) { askidaA--; return 'asili'; } return null; };
  await a.ilerlet(0);
  await a.ilerlet(3 * DAKIKA);
  assert.strictEqual(a.bulut.asililar.length, 2, 'önkoşul: iki açılış işlemi askıda');
  var abone = a.bulut.abonelikSayisi;
  a.bulut.asililar.shift()();
  await a.ilerlet(0);
  assert.strictEqual(a.durum().hazir, false, 'terk edilen açılışın geç sonucu sayfayı hazır yaptı');
  assert.strictEqual(a.bulut.abonelikSayisi, abone, 'terk edilen açılışın geç sonucu dinleyici kurdu');
  a.bulut.asililar.shift()();
  await a.ilerlet(0);
  assert.strictEqual(a.durum().hazir, true);
  assert.strictEqual(a.bulut.abonelikSayisi, abone + 15);
  a.kapat();
}

/* 19. Sekme gizlenince ya da kapanırken bekleyen değişiklik hemen gönderilir;
       ilk eşitleme hatası hiçbir olay olmadan da 15 sn sonra yeniden denenir. */
async function gizlenincePush() {
  var o = await acilis();
  var n = o.bulut.islemSayisi;
  o.yerelYaz({ gizlenince: kayit(1) });
  o.gorunurluk('hidden');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 1, 'sekme gizlenince bekleyen değişiklik hemen gönderilmedi');
  o.gorunurluk('visible');
  o.yerelYaz({ kapanirken: kayit(1) });
  o.pencereYay('pagehide', { type: 'pagehide', persisted: false });
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 2, 'sayfa kapanırken bekleyen değişiklik hemen gönderilmedi');
  o.kapat();

  var b = await acilis({ ilkHata: true });
  assert.strictEqual(b.sonrakiZamanlayici(), 15000, 'ilk eşitleme hatası için yeniden deneme zamanlanmadı');
  await b.ilerlet(15000);
  assert.strictEqual(b.durum().hazir, true, 'ilk eşitleme olay olmadan yeniden denenmedi');
  b.kapat();
}

/* 20. Önbellekten gelen görüntü sunucu teması sayılmaz: kopuk dinleyici uyarısını
       kapatmaz, sayfaya dönüş yakalamasını bastırmaz. */
async function onbellekGoruntusu() {
  var o = await acilis();
  o.bulut.dinleyiciHatasi('/alanlar/yds-leitner', { code: 'internal' });
  o.bulut.onbellekten = true;
  await o.ilerlet(15000);
  assert.strictEqual(o.aktifDinleyici(), 15, 'önkoşul: dinleyiciler yeniden kuruldu');
  assert.ok(o.uyari() && /alınamıyor/.test(o.uyari().yazi.textContent),
    'önbellek görüntüsü kopuk dinleyici uyarısını kapattı');
  await o.ilerlet(3 * DAKIKA);
  var n = o.bulut.islemSayisi;
  o.gorunurluk('hidden');
  o.gorunurluk('visible');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 1, 'önbellek görüntüsü sunucu teması sayıldı, dönüş yakalaması yapılmadı');
  o.bulut.onbellekten = false;
  o.uzaktanYaz({ sunucudan: kayit(2) });
  await o.ilerlet(0);
  assert.strictEqual(o.uyari(), null, 'sunucu görüntüsü gelince uyarı kapanmadı');
  o.kapat();
}

/* 21. Seyrek dinleyici hataları (her biri 10 dk sağlıklı çalışmadan sonra) onarım
       sınırını tüketmez; bozuk bir dinleyici varken kardeş dinleyicinin görüntüsü
       ve başka alana gönderim uyarıyı kapatmaz. */
async function seyrekDinlemeHatasi() {
  var o = await acilis();
  for (var i = 0; i < 8; i++) {
    await o.ilerlet(30 * DAKIKA);
    o.bulut.dinleyiciHatasi('/alanlar/yds-leitner', { code: 'internal' });
    await o.ilerlet(20000);
    assert.strictEqual(o.aktifDinleyici(), 15, (i + 1) + '. seyrek hatadan sonra dinleyiciler kurulmadı');
  }
  o.bulut.dinleyiciHatasi('/alanlar/yds-leitner', { code: 'internal' });
  await o.ilerlet(0);
  o.yerelAlanYaz('yds-katmanlar', [1, 2]);
  await o.ilerlet(2500);
  assert.ok(o.uyari() && /alınamıyor/.test(o.uyari().yazi.textContent),
    'başka alana gönderim ya da kardeş dinleyici kopuk dinleyici uyarısını kapattı');
  // Bir önceki onarımın hemen ardından gelen hata beklemeyi 30 sn'ye çıkarır.
  await o.ilerlet(30000);
  assert.strictEqual(o.uyari(), null, 'onarımdan sonra uyarı kapanmadı');
  o.kapat();
}

/* 22. Dinleyicilerin ilk görüntüsü tam birleşimden sonra gelse de (ağdan) elle
       eşitleme onayı kaybolmaz ve kopukluk uyarısı kapanır. */
async function gecGoruntuOnayi() {
  var o = await acilis();
  o.bulut.dinlemeReddet = true;
  o.bulut.dinleyiciHatasi('/alanlar/yds-leitner', { code: 'permission-denied' });
  await o.ilerlet(60 * DAKIKA);
  assert.strictEqual(o.aktifDinleyici(), 0, 'önkoşul: onarımdan vazgeçildi');
  o.bulut.dinlemeReddet = false;
  o.bulut.ilkGoruntuGec = true;
  o.dugme().olaylar.click();
  await o.ilerlet(0);
  assert.strictEqual(o.aktifDinleyici(), 15);
  assert.ok(o.uyari() && o.uyari().className === 'esit-uyari bilgi' && /^Eşitlendi /.test(o.uyari().yazi.textContent),
    'ilk görüntü geç gelince elle eşitleme onayı kayboldu ya da uyarı kapanmadı');
  o.kapat();
}

/* 23. Düğme ya da ağın gelmesi, uçuştaki kısmi gönderimin ardından istenen tam
       birleşimi o gönderim başarısız olsa da geri çekilmeye bırakmaz. Kullanıcının
       kapattığı dinleyici uyarısı aynı sorun için geri açılmaz; çıkışta çubuk kapanır. */
async function ucustakiKismi() {
  var o = await acilis();
  o.bulut.kanca = function () { o.bulut.kanca = null; return 'asiliHata'; };
  o.yerelYaz({ kismi: kayit(1) });
  await o.ilerlet(2500);
  assert.strictEqual(o.bulut.asililar.length, 1, 'önkoşul: kısmi gönderim uçuşta');
  await o.ilerlet(500);
  o.dugme().olaylar.click();
  await o.ilerlet(0);
  assert.ok(o.dugme().classList.contains('esitleniyor'), 'önkoşul: düğme uçuştaki işlemi bekliyor');
  o.bulut.asililar.shift()();
  await o.ilerlet(0);
  assert.ok(!o.dugme().classList.contains('esitleniyor'),
    'kısmi gönderim düşünce elle istenen tam birleşim geri çekilmeyi bekledi');
  assert.ok(o.bulutLeitner().kismi, 'elle tam birleşim bekleyen kaydı göndermedi');
  assert.ok(o.uyari() && /^Eşitlendi /.test(o.uyari().yazi.textContent));
  o.kapat();

  var b = await acilis();
  await b.ilerlet(61000);
  b.bulut.kanca = function () { b.bulut.kanca = null; return 'asiliHata'; };
  b.yerelYaz({ agGelince: kayit(1) });
  await b.ilerlet(2500);
  b.pencereYay('online');
  await b.ilerlet(0);
  var n = b.bulut.islemSayisi;
  b.bulut.asililar.shift()();
  await b.ilerlet(0);
  assert.strictEqual(b.bulut.islemSayisi, n + 1, 'ağ gelince istenen tam birleşim geri çekilmeyi bekledi');
  assert.ok(b.bulutLeitner().agGelince);
  b.kapat();

  var c = await acilis();
  c.bulut.dinleyiciHatasi('/alanlar/yds-leitner', { code: 'internal' });
  await c.ilerlet(0);
  assert.ok(c.uyari() && /alınamıyor/.test(c.uyari().yazi.textContent));
  c.uyari().kapat.olaylar.click();
  c.yerelYaz({ kapattiktan: kayit(1) });
  await c.ilerlet(2500);
  assert.strictEqual(c.uyari(), null, 'kullanıcının kapattığı dinleyici uyarısı gönderimden sonra geri açıldı');
  c.bulut.dinleyiciHatasi('/alanlar/yds-katmanlar', { code: 'internal' });
  await c.ilerlet(0);
  await c.api().cikisYap();
  await c.ilerlet(0);
  assert.strictEqual(c.dugme().textContent, '⇅');
  assert.strictEqual(c.uyari(), null, 'çıkıştan sonra eşitleme uyarısı asılı kaldı');
  c.kapat();
}

/* 24. Ağ sekme gizliyken gelirse geri çekilme yine bırakılır: bekleyen gönderim
       sekme görünür olmayı ve uzun beklemeyi beklemez. */
async function gizliykenAg() {
  var o = await acilis();
  var agYok = true;
  o.bulut.kanca = function () { return agYok ? 'hata' : null; };
  o.yerelYaz({ gizli: kayit(1) });
  await o.ilerlet(2500);
  o.gorunurluk('hidden');
  await o.ilerlet(0);
  assert.ok(o.sonrakiZamanlayici() >= 30000, 'önkoşul: geri çekilme büyüdü');
  var n = o.bulut.islemSayisi;
  agYok = false;
  o.pencereYay('online');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 1, 'gizli sekmede ağ gelince geri çekilme beklendi');
  assert.ok(o.bulutLeitner().gizli);
  o.kapat();
}

/* 8. İlk eşitleme başarısızsa ağın gelmesi 15 sn beklemeden yeniden dener. */
async function ilkHata() {
  var o = await acilis({ ilkHata: true });
  assert.strictEqual(o.durum().hazir, false, 'önkoşul: ilk eşitleme başarısız olmalı');
  assert.ok(o.uyari(), 'ilk eşitleme hatası görünür değil');
  var n = o.bulut.islemSayisi;
  o.pencereYay('focus');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n, 'odak geri çekilmeyi deldi');
  o.pencereYay('online');
  await o.ilerlet(0);
  assert.strictEqual(o.bulut.islemSayisi, n + 1, 'ağ geri gelince ilk eşitleme beklemeden denenmedi');
  assert.strictEqual(o.durum().hazir, true);
  assert.strictEqual(o.aktifDinleyici(), 15);
  assert.strictEqual(o.uyari(), null);
  o.kapat();
}

// Bir söz hiç sonuçlanmazsa olay döngüsü boşalır ve süreç çıkar; bu, başarı sayılmasın.
process.exitCode = 1;
(async function () {
  var senaryolar = [azamiBekleme, sayfayaDonus, uyanmaOlaylari, dinleyiciOnarimi,
    takilmaBekcisi, geriCekilme, simdiEsitle, ilkHata, eszamanliAtis, basarisizYakalama,
    kaliciDinlemeHatasi, acilistaYenileme, sdkYenidenYukleme, belirtecYenileme, ilkTakilma,
    islemIciBelirtec, elleKesme, gecSonucUcusta, gizlenincePush, onbellekGoruntusu,
    seyrekDinlemeHatasi, gecGoruntuOnayi, ucustakiKismi, gizliykenAg];
  for (var i = 0; i < senaryolar.length; i++) {
    try {
      await senaryolar[i]();
    } catch (e) {
      e.message = senaryolar[i].name + ': ' + e.message;
      throw e;
    }
  }
  console.log('esitleme-dayaniklilik: ' + senaryolar.length +
    ' senaryo (gönderim üst sınırı, dönüşte/uykudan yakalama, dinleyici onarımı, takılma bekçisi,' +
    ' geri çekilme, şimdi eşitle, ilk hata, çökmüş kuyruk, başarısız yakalama, kalıcı dinleme hatası,' +
    ' açılışta gereksiz yenileme yok, SDK yeniden yükleme, belirteç yenileme, takılan açılış,' +
    ' işlem içi belirteç hatası, elle kesme, geç sonuç, gizlenince gönderim, önbellek görüntüsü,' +
    ' seyrek dinleyici hatası, geç ilk görüntü, uçuştaki kısmi gönderim, gizliyken ağ) başarılı');
  process.exitCode = 0;
})().catch(function (e) {
  console.error(e);
  process.exitCode = 1;
});
