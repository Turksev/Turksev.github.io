'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var bellek = new Map();
var olaylar = {};
var gercekSetTimeout = setTimeout;
var yenidenYukleme = 0;
var yenidenYuklemeNedenleri = [];
var islemSayisi = 0;
var islemDenemesi = 0;
var kokYazma = 0;
var alanYazma = 0;
var cakismaKancasi = null;
var durumOlaylari = [];

var yerelEski = {
  'yds-leitner': {
    local: { k: 2, g: 20 },
    'hand-down': { k: 2, g: 40, c: 10 }
  },
  'yds-kategori': { Kelime: { d: 4, y: 1 } }
};
Object.keys(yerelEski).forEach(function (a) { bellek.set(a, JSON.stringify(yerelEski[a])); });
bellek.set('yds-bulut-etkin', 'true');

var kokBelge = {
  surum: 1,
  zaman: 100,
  json: JSON.stringify({
    'yds-leitner': {
      cloud: { k: 3, g: 30 },
      'handed-down': { k: 4, g: 80, c: 20 },
      'hand down': { k: 3, g: 70, c: 15 }
    },
    'yds-yanlis': [{ a: 'K|S', kat: 'K', n: 2, t: 9 }]
  })
};
var kokBelgeIlk = JSON.stringify(kokBelge);
var alanBelgeleri = new Map();
var yonetimBelgesi = null;
var surumler = new Map();
var dinleyiciler = new Map();

function refYap(tip, anahtar) {
  var ref = {
    tip: tip,
    anahtar: anahtar || null,
    path: tip === 'kok' ? 'kullanicilar/u1' :
      (tip === 'yonetim' ? 'kullanicilar/u1/yonetim/durum' : 'kullanicilar/u1/alanlar/' + anahtar),
    onSnapshot: function (basarili) {
      var liste = dinleyiciler.get(ref.path) || [];
      liste.push(basarili);
      dinleyiciler.set(ref.path, liste);
      gercekSetTimeout(function () { basarili(foto(ref)); }, 0);
      return function () {
        dinleyiciler.set(ref.path, (dinleyiciler.get(ref.path) || []).filter(function (x) {
          return x !== basarili;
        }));
      };
    }
  };
  if (tip === 'kok') {
    ref.collection = function (ad) {
      assert.ok(ad === 'alanlar' || ad === 'yonetim');
      return { doc: function (alan) {
        if (ad === 'yonetim') {
          assert.strictEqual(alan, 'durum');
          return refYap('yonetim', alan);
        }
        return refYap('alan', alan);
      } };
    };
  }
  if (tip === 'yonetim') {
    ref.delete = function () { yonetimBelgesi = null; return Promise.resolve(); };
  }
  return ref;
}

function veri(ref) {
  if (ref.tip === 'kok') return kokBelge;
  if (ref.tip === 'yonetim') return yonetimBelgesi;
  return alanBelgeleri.get(ref.anahtar);
}

function foto(ref) {
  var v = veri(ref);
  return { exists: !!v, data: function () { return v; } };
}

function bildir(ref) {
  (dinleyiciler.get(ref.path) || []).slice().forEach(function (fn) { fn(foto(ref)); });
}

function surum(ref) { return surumler.get(ref.path) || 0; }

function disaridanYaz(ref, v) {
  if (ref.tip === 'kok') kokBelge = v;
  else if (ref.tip === 'yonetim') yonetimBelgesi = v;
  else alanBelgeleri.set(ref.anahtar, v);
  surumler.set(ref.path, surum(ref) + 1);
  bildir(ref);
}

var db = {
  collection: function (ad) {
    assert.strictEqual(ad, 'kullanicilar');
    return { doc: function (uid) { assert.strictEqual(uid, 'u1'); return refYap('kok'); } };
  },
  runTransaction: function (calistir) {
    islemSayisi++;
    function dene(kalan) {
      islemDenemesi++;
      var okunan = new Map();
      var yazilan = [];
      var islem = {
        get: function (ref) {
          okunan.set(ref.path, { ref: ref, surum: surum(ref) });
          return Promise.resolve(foto(ref));
        },
        set: function (ref, v) { yazilan.push({ ref: ref, veri: v }); }
      };
      return Promise.resolve(calistir(islem)).then(function (sonuc) {
        if (cakismaKancasi) {
          var kanca = cakismaKancasi;
          cakismaKancasi = null;
          kanca();
        }
        var cakisti = false;
        okunan.forEach(function (o) {
          if (surum(o.ref) !== o.surum) cakisti = true;
        });
        if (cakisti) {
          if (!kalan) throw new Error('transaction-retry-tukendi');
          return dene(kalan - 1);
        }
        yazilan.forEach(function (y) {
          if (y.ref.tip === 'kok') kokYazma++;
          else alanYazma++;
          disaridanYaz(y.ref, y.veri);
        });
        return sonuc;
      });
    }
    return dene(4);
  }
};

var auth = {
  onAuthStateChanged: function (fn) {
    gercekSetTimeout(function () { fn({ uid: 'u1', email: 'test@example.com' }); }, 0);
  },
  getRedirectResult: function () { return Promise.resolve(); },
  signInWithPopup: function () { return Promise.resolve(); },
  signInWithRedirect: function () { return Promise.resolve(); },
  signOut: function () { return Promise.resolve(); }
};

function CustomEvent(tur, ayar) { this.type = tur; this.detail = ayar && ayar.detail; }
var document = {
  head: { appendChild: function (s) { gercekSetTimeout(function () { s.onload(); }, 0); } },
  createElement: function () { return {}; },
  querySelector: function () { return null; },
  querySelectorAll: function () { return []; },
  addEventListener: function (tur, fn) { olaylar['document:' + tur] = fn; },
  visibilityState: 'visible'
};
var session = new Map();
var pencere = {
  YDS: {
    yenidenYukle: function (neden) {
      yenidenYukleme++;
      yenidenYuklemeNedenleri.push(neden);
      return yenidenYukleme === 1;
    },
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
  firebase: {
    initializeApp: function () {},
    auth: function () { return auth; },
    firestore: function () { return db; }
  },
  crypto: { getRandomValues: function (d) { d[0] = 33; d[1] = 44; return d; } },
  CustomEvent: CustomEvent,
  addEventListener: function (tur, fn) {
    olaylar[tur] = olaylar[tur] || [];
    olaylar[tur].push(fn);
  },
  dispatchEvent: function (e) {
    if (e.type === 'yds-esitleme-durumu') durumOlaylari.push(e.detail);
    (olaylar[e.type] || []).slice().forEach(function (fn) { fn(e); });
  },
  confirm: function () { return false; }
};
pencere.firebase.auth.GoogleAuthProvider = function () {};

var hizliSetTimeout = function (fn, ms) { return gercekSetTimeout(fn, Math.min(ms || 0, 10)); };
var baglam = {
  window: pencere,
  document: document,
  location: { protocol: 'https:', hostname: 'test', reload: function () { yenidenYukleme++; } },
  sessionStorage: {
    getItem: function (a) { return session.has(a) ? session.get(a) : null; },
    setItem: function (a, v) { session.set(a, String(v)); },
    removeItem: function (a) { session.delete(a); }
  },
  CustomEvent: CustomEvent,
  Uint32Array: Uint32Array,
  JSON: JSON, Date: Date, Math: Math, Object: Object, String: String, Promise: Promise,
  Error: Error, parseInt: parseInt, setTimeout: hizliSetTimeout, clearTimeout: clearTimeout
};
vm.createContext(baglam);
vm.runInContext(fs.readFileSync(path.join(kok, 'data', 'kelime-aliaslari.js'), 'utf8'), baglam);
['esitleme-veri.js', 'esitleme-depo.js', 'esitleme-v2.js'].forEach(function (dosya) {
  vm.runInContext(fs.readFileSync(path.join(kok, 'assets', 'js', dosya), 'utf8'), baglam);
});

function bekle(ms) { return new Promise(function (coz) { gercekSetTimeout(coz, ms); }); }
function temiz(v) { return JSON.parse(JSON.stringify(v)); }

(async function () {
  await bekle(80);
  var M = pencere.YDS.EsitlemeMotoru;
  var D = pencere.YDS.EsitlemeDepo;

  function alanZarfi(anahtar) {
    var doc = alanBelgeleri.get(anahtar);
    assert.ok(doc, 'eksik alan belgesi: ' + anahtar);
    assert.strictEqual(doc.surum, 2);
    assert.strictEqual(doc.anahtar, anahtar);
    var z = { surum: 2, alanlar: {} };
    z.alanlar[anahtar] = JSON.parse(doc.json);
    return z;
  }

  function alanPaketi(anahtar) { return M.paket(alanZarfi(anahtar)); }

  function uzakAlanYaz(anahtar, zarf, zaman) {
    var ref = refYap('alan', anahtar);
    disaridanYaz(ref, {
      surum: 2,
      anahtar: anahtar,
      zaman: zaman,
      json: M.kararliJson(zarf.alanlar[anahtar])
    });
  }

  // Legacy kök belge yerinde kalır; yerel ve uzak kayıtlar ayrı alanlara taşınır.
  assert.strictEqual(JSON.stringify(kokBelge), kokBelgeIlk);
  assert.strictEqual(kokYazma, 0);
  var bulutPaket = alanPaketi('yds-leitner');
  assert.deepStrictEqual(Object.keys(temiz(bulutPaket['yds-leitner'])).sort(),
    ['@kelime:hand down', 'cloud', 'hand down', 'local']);
  assert.strictEqual(bulutPaket['yds-leitner']['@kelime:hand down'].k, 4);
  assert.strictEqual(bulutPaket['yds-leitner']['hand down'].k, 3);
  assert.strictEqual(bulutPaket['yds-leitner']['hand-down'], undefined);
  assert.strictEqual(bulutPaket['yds-leitner']['handed-down'], undefined);
  assert.strictEqual(alanPaketi('yds-kategori')['yds-kategori'].Kelime.d, 4);
  assert.strictEqual(alanPaketi('yds-yanlis')['yds-yanlis'][0].a, 'K|S');
  assert.deepStrictEqual(Object.keys(temiz(D.paket()['yds-leitner'])).sort(),
    ['@kelime:hand down', 'cloud', 'hand down', 'local']);
  assert.ok(islemSayisi >= 1 && alanYazma >= 3);
  var bulutYedegi = JSON.parse(bellek.get('yds-esitleme-bulut-gecis-yedegi'));
  assert.strictEqual(bulutYedegi.veri['yds-leitner'].cloud.k, 3);

  // Bir yerel Leitner değişikliği yalnız o alan belgesini günceller.
  var oncekiAlanYazma = alanYazma;
  pencere.YDS.Depo.kayitlariYaz('yds-leitner', { after: { k: 1, g: 40, c: 35 } });
  await bekle(100);
  bulutPaket = alanPaketi('yds-leitner');
  assert.strictEqual(bulutPaket['yds-leitner'].after.k, 1);
  assert.strictEqual(alanYazma, oncekiAlanYazma + 1);

  // İşlem okunurken başka istemci aynı alana yazarsa mock retry eder ve iki kayıt korunur.
  var denemeOnce = islemDenemesi;
  cakismaKancasi = function () {
    var uzak = M.kayitlariYaz(alanZarfi('yds-leitner'), 'yds-leitner',
      { beta: { k: 3, g: 70, c: 60 } }, function () { return '9999999999999:B'; });
    uzakAlanYaz('yds-leitner', uzak, 300);
  };
  pencere.YDS.Depo.kayitlariYaz('yds-leitner', { alpha: { k: 2, g: 60, c: 55 } });
  await bekle(120);
  bulutPaket = alanPaketi('yds-leitner');
  assert.strictEqual(bulutPaket['yds-leitner'].alpha.k, 2);
  assert.strictEqual(bulutPaket['yds-leitner'].beta.k, 3);
  assert.ok(islemDenemesi >= denemeOnce + 2, 'transaction çatışmada yeniden denenmedi');

  // Başka cihazın canlı değişikliği otomatik yerel depoya alınır.
  var uzakZarf = M.kayitlariYaz(alanZarfi('yds-leitner'), 'yds-leitner',
    { remoteAfter: { k: 4, g: 60, c: 45 } }, function () { return '9999999999999:R'; });
  uzakAlanYaz('yds-leitner', uzakZarf, 400);
  await bekle(40);
  assert.strictEqual(D.paket()['yds-leitner'].remoteAfter.k, 4);

  // Silinen kayıt, eski cihaz görüntüsü yeniden gelse bile dirilmez.
  pencere.YDS.Depo.kayitlariSil('yds-leitner', ['after']);
  await bekle(100);
  uzakZarf = M.birlestir(alanZarfi('yds-leitner'),
    M.zarfaCevir({ 'yds-leitner': { after: { k: 5, g: 99 } } }));
  uzakAlanYaz('yds-leitner', uzakZarf, 500);
  await bekle(40);
  assert.strictEqual(D.paket()['yds-leitner'].after, undefined);

  // Atomik silme işaretçisi başka cihazdan gelirse yazım anında durur; yerel
  // paket değişmez ve açık onay olmadan silme API'si hiçbir işlem yapmaz.
  var yerelOnce = M.kararliJson(D.paket());
  disaridanYaz(refYap('yonetim', 'durum'), { silindi: true, zaman: 600 });
  await bekle(30);
  assert.strictEqual(pencere.YDS.Esitleme.oturumDurumu().silindi, true);
  assert.strictEqual(M.kararliJson(D.paket()), yerelOnce, 'işaretçi yerel ilerlemeyi değiştirdi');
  var reddedildi = false;
  await pencere.YDS.Esitleme.bulutVerisiniSil().catch(function (e) {
    reddedildi = e && e.code === 'yds/acik-silme-onayi-gerekli';
  });
  assert.strictEqual(reddedildi, true, 'bulut silme API açık onay olmadan çalıştı');
  assert.strictEqual(M.kararliJson(D.paket()), yerelOnce, 'reddedilen silme yerel ilerlemeyi değiştirdi');

  pencere.YDS.Depo.kayitlariYaz('yds-leitner', { blockedLocal: { k: 1, g: 90, c: 80 } });
  await bekle(60);
  assert.strictEqual(alanPaketi('yds-leitner')['yds-leitner'].blockedLocal, undefined,
    'silme işaretçisi varken buluta yazıldı');

  var yenidenReddedildi = false;
  await pencere.YDS.Esitleme.yenidenEtkinlestir().catch(function (e) {
    yenidenReddedildi = e && e.code === 'yds/atomik-yeniden-etkinlestirme-gerekli';
  });
  await bekle(30);
  assert.strictEqual(yenidenReddedildi, true,
    'atomik nesil protokolü olmadan eşitleme kilidi kaldırıldı');
  assert.strictEqual(pencere.YDS.Esitleme.oturumDurumu().silindi, true);
  assert.strictEqual(alanPaketi('yds-leitner')['yds-leitner'].blockedLocal, undefined,
    'reddedilen yeniden etkinleştirme yerel kaydı buluta taşıdı');
  assert.ok(durumOlaylari.some(function (d) { return d.durum === 'silindi'; }),
    'ayarlar UI için silindi durum olayı yayınlanmadı');

  assert.strictEqual(JSON.stringify(kokBelge), kokBelgeIlk, 'legacy kök belge değiştirildi');
  assert.strictEqual(kokYazma, 0);
  assert.strictEqual(yenidenYukleme, 1);
  assert.deepStrictEqual(yenidenYuklemeNedenleri, ['bulut-ilk-birlesim']);
  console.log('esitleme-bulut: legacy geçiş + marker engeli + güvenli kapalı yönetim yolları başarılı');
})().catch(function (e) {
  console.error(e);
  process.exitCode = 1;
});
