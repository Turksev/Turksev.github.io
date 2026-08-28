'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var bellek = new Map();
var olaylar = {};
var snapshotDinleyicileri = [];
var islemSayisi = 0;
var yenidenYukleme = 0;
var gercekSetTimeout = setTimeout;

var yerelEski = {
  'yds-leitner': { local: { k: 2, g: 20 } },
  'yds-kategori': { Kelime: { d: 4, y: 1 } }
};
Object.keys(yerelEski).forEach(function (a) { bellek.set(a, JSON.stringify(yerelEski[a])); });

var uzakBelge = {
  surum: 1,
  zaman: 100,
  json: JSON.stringify({
    'yds-leitner': { cloud: { k: 3, g: 30 } },
    'yds-yanlis': [{ a: 'K|S', kat: 'K', n: 2, t: 9 }]
  })
};

function foto() {
  return { exists: !!uzakBelge, data: function () { return uzakBelge; } };
}

var belgeRef = {
  onSnapshot: function (basarili) {
    snapshotDinleyicileri.push(basarili);
    gercekSetTimeout(function () { basarili(foto()); }, 0);
    return function () {
      snapshotDinleyicileri = snapshotDinleyicileri.filter(function (x) { return x !== basarili; });
    };
  }
};

var db = {
  collection: function () { return { doc: function () { return belgeRef; } }; },
  runTransaction: function (calistir) {
    islemSayisi++;
    var yazilan = null;
    var islem = {
      get: function () { return Promise.resolve(foto()); },
      set: function (ref, veri) { yazilan = veri; }
    };
    return Promise.resolve(calistir(islem)).then(function (sonuc) {
      if (yazilan) uzakBelge = yazilan;
      snapshotDinleyicileri.slice().forEach(function (fn) { fn(foto()); });
      return sonuc;
    });
  }
};

var auth = {
  onAuthStateChanged: function (fn) { gercekSetTimeout(function () { fn({ uid: 'u1', email: 'test@example.com' }); }, 0); },
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
  YDS: { Depo: {
    oku: function (a, varsayilan) {
      if (!bellek.has(a)) return varsayilan;
      try { return JSON.parse(bellek.get(a)); } catch (e) { return varsayilan; }
    },
    yaz: function (a, v) { bellek.set(a, JSON.stringify(v)); return true; },
    sil: function (a) { bellek.delete(a); }
  } },
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
  dispatchEvent: function (e) { (olaylar[e.type] || []).slice().forEach(function (fn) { fn(e); }); },
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
['esitleme-veri.js', 'esitleme-depo.js', 'esitleme-v2.js'].forEach(function (dosya) {
  vm.runInContext(fs.readFileSync(path.join(kok, 'assets', 'js', dosya), 'utf8'), baglam);
});

function bekle(ms) { return new Promise(function (coz) { gercekSetTimeout(coz, ms); }); }
function temiz(v) { return JSON.parse(JSON.stringify(v)); }

(async function () {
  await bekle(60);
  var M = pencere.YDS.EsitlemeMotoru;
  var D = pencere.YDS.EsitlemeDepo;

  // Eski surum:1 bulut belgesi işlem içinde v2'ye çevrilir; iki taraf da korunur.
  assert.strictEqual(uzakBelge.surum, 2);
  var bulutPaket = M.paket(JSON.parse(uzakBelge.json));
  assert.deepStrictEqual(Object.keys(temiz(bulutPaket['yds-leitner'])).sort(), ['cloud', 'local']);
  assert.strictEqual(bulutPaket['yds-kategori'].Kelime.d, 4);
  assert.strictEqual(bulutPaket['yds-yanlis'][0].a, 'K|S');
  assert.deepStrictEqual(Object.keys(temiz(D.paket()['yds-leitner'])).sort(), ['cloud', 'local']);
  assert.ok(islemSayisi >= 1);
  var bulutYedegi = JSON.parse(bellek.get('yds-esitleme-bulut-gecis-yedegi'));
  assert.strictEqual(bulutYedegi.veri['yds-leitner'].cloud.k, 3);

  // Sonraki yerel değişiklik gecikme sonunda işlemli olarak buluta gider.
  pencere.YDS.Depo.kayitlariYaz('yds-leitner', { after: { k: 1, g: 40, c: 35 } });
  await bekle(80);
  bulutPaket = M.paket(JSON.parse(uzakBelge.json));
  assert.strictEqual(bulutPaket['yds-leitner'].after.k, 1);

  // Başka cihazın canlı değişikliği snapshot ile otomatik yerel depoya alınır.
  var uzakZarf = M.kayitlariYaz(JSON.parse(uzakBelge.json), 'yds-leitner',
    { remoteAfter: { k: 4, g: 60, c: 45 } }, function () { return '9999999999999:R'; });
  uzakBelge = { surum: 2, zaman: 200, json: M.kararliJson(uzakZarf) };
  snapshotDinleyicileri.slice().forEach(function (fn) { fn(foto()); });
  await bekle(30);
  assert.strictEqual(D.paket()['yds-leitner'].remoteAfter.k, 4);

  // Silinen kayıt, eski cihaz görüntüsü yeniden gelse bile dirilmez.
  pencere.YDS.Depo.kayitlariSil('yds-leitner', ['after']);
  await bekle(80);
  uzakZarf = M.birlestir(JSON.parse(uzakBelge.json),
    M.zarfaCevir({ 'yds-leitner': { after: { k: 5, g: 99 } } }));
  uzakBelge = { surum: 2, zaman: 300, json: M.kararliJson(uzakZarf) };
  snapshotDinleyicileri.slice().forEach(function (fn) { fn(foto()); });
  await bekle(30);
  assert.strictEqual(D.paket()['yds-leitner'].after, undefined);

  assert.ok(yenidenYukleme <= 1);
  console.log('esitleme-bulut: 9 senaryo başarılı');
})().catch(function (e) {
  console.error(e);
  process.exitCode = 1;
});
