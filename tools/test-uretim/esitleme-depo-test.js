'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var bellek = new Map();
var dinleyiciler = {};
var bildirilen = [];
var eskiPaket = {
  'yds-leitner': { base: { k: 1, g: 10 } },
  'yds-yanlis': [{ a: 'Kelime|Soru', kat: 'Kelime', n: 2, t: 8 }],
  'yds-kategori': { Kelime: { d: 7, y: 2 } },
  'yds-gecmis': [{ t: 7, d: 60, n: 80, y: 75, m: 'deneme' }],
  'yds-konular': { G01: { d: 2, t: 80, g: null, n: 'not' } },
  'yds-rekor': { yuzde: 75, dogru: 60, toplam: 80 },
  'yds-yeni-sayac': { g: 100, n: 4, ek: 2 },
  'yds-test-yanlis': { ability: { n: 3, t: 9 } },
  'yds-gunluk-yeni': 20,
  'yds-gunluk-tavan': 30,
  'yds-katmanlar': [1, 2, 3],
  'yds-eksen': 1
};
Object.keys(eskiPaket).forEach(function (a) { bellek.set(a, JSON.stringify(eskiPaket[a])); });

function CustomEvent(tur, ayar) { this.type = tur; this.detail = ayar && ayar.detail; }
var pencere = {
  YDS: { Depo: {
    oku: function (a, varsayilan) {
      if (!bellek.has(a)) return varsayilan;
      try { return JSON.parse(bellek.get(a)); } catch (e) { return varsayilan; }
    },
    yaz: function (a, v) { bellek.set(a, JSON.stringify(v)); return true; },
    sil: function (a) { bellek.delete(a); }
  } },
  crypto: { getRandomValues: function (d) { d[0] = 11; d[1] = 22; return d; } },
  CustomEvent: CustomEvent,
  addEventListener: function (tur, fn) { dinleyiciler[tur] = fn; },
  dispatchEvent: function (e) { bildirilen.push(e); }
};
var baglam = { window: pencere, CustomEvent: CustomEvent, Uint32Array: Uint32Array,
  JSON: JSON, Date: Date, Math: Math, Object: Object, String: String, parseInt: parseInt };
vm.createContext(baglam);
['esitleme-veri.js', 'esitleme-depo.js'].forEach(function (dosya) {
  vm.runInContext(fs.readFileSync(path.join(kok, 'assets', 'js', dosya), 'utf8'), baglam);
});

var Depo = pencere.YDS.Depo;
var D = pencere.YDS.EsitlemeDepo;
var M = pencere.YDS.EsitlemeMotoru;
function temiz(v) { return JSON.parse(JSON.stringify(v)); }

// Eski localStorage verisi otomatik zarf olur; görünür veri değişmez.
assert.deepStrictEqual(temiz(Depo.oku('yds-leitner', {})), { base: { k: 1, g: 10 } });
assert.strictEqual(JSON.parse(bellek.get(D.ANAHTAR)).surum, 2);
var normallesmisPaket = temiz(eskiPaket);
// Eski yanlış kayıtlarına, iki-gün kuralının sonraki birleşimlerde doğru
// çalışması için görünmeyen son-güncelleme alanı eklenir.
normallesmisPaket['yds-yanlis'][0].u = normallesmisPaket['yds-yanlis'][0].t;
normallesmisPaket['yds-test-yanlis'].ability.u = normallesmisPaket['yds-test-yanlis'].ability.t;
assert.strictEqual(M.kararliJson(D.paket()), M.kararliJson(normallesmisPaket));

// Geçişten önce alınan otomatik yedek bütün eski anahtarlarla birebir aynıdır.
var gecisYedegi = JSON.parse(bellek.get('yds-esitleme-gecis-yedegi'));
assert.strictEqual(M.kararliJson(gecisYedegi.veri), M.kararliJson(eskiPaket));

// Doğrudan kayıt yazımı da boş alan fallback'inde prototip adlarını yutmamalı;
// ardından K2 çözümü, görünür paket ve gerçek Depo.uygula yolu kayıpsız kalır.
var dogrudanOzelKayitlar = JSON.parse('{' +
  '"__proto__":{"n":2,"t":90,"u":90},' +
  '"constructor":{"n":3,"t":91,"u":91},' +
  '"normal":{"n":4,"t":92,"u":92}}');
var dogrudanMeta = 9999999999900;
var dogrudanOzelZarf = M.kayitlariYaz(M.zarfaCevir({}), 'yds-test-yanlis',
  dogrudanOzelKayitlar, function () { return String(dogrudanMeta++) + ':P'; });
var dogrudanPaket = M.paket(dogrudanOzelZarf)['yds-test-yanlis'];
['__proto__', 'constructor', 'normal'].forEach(function (id) {
  assert.ok(Object.prototype.hasOwnProperty.call(dogrudanPaket, id),
    'kayitlariYaz -> paket kimliği kayboldu: ' + id);
});
var k2OzelZarf = { surum: M.SURUM, alanlar: {} };
k2OzelZarf.alanlar['yds-test-yanlis'] = M.bulutAlaniniCoz('yds-test-yanlis',
  M.bulutAlaniniKodla('yds-test-yanlis', dogrudanOzelZarf.alanlar['yds-test-yanlis']));
D.uygula(k2OzelZarf, 'bulut');
var k2Uygulanan = Depo.oku('yds-test-yanlis', {});
['__proto__', 'constructor', 'normal'].forEach(function (id) {
  assert.ok(Object.prototype.hasOwnProperty.call(k2Uygulanan, id),
    'k2 decode -> paket -> uygula kimliği kayboldu: ' + id);
});
assert.strictEqual(k2Uygulanan.__proto__.n, 2);
assert.strictEqual(k2Uygulanan.constructor.n, 3);
assert.strictEqual(k2Uygulanan.normal.n, 4);

// Boş alan fallback'inden oluşturulan __proto__ tombstone'u da K2 turunda
// own-property kalır ve uygulandığında yalnız hedef kaydı siler.
var ozelSilme = M.kayitlariSil(M.zarfaCevir({}), 'yds-test-yanlis', ['__proto__'],
  function () { return '9999999999990:P'; });
assert.ok(Object.prototype.hasOwnProperty.call(ozelSilme.alanlar['yds-test-yanlis'].i,
  '__proto__'), 'kayitlariSil tombstone kimliği kayboldu');
var ozelSilmeAlani = M.bulutAlaniniCoz('yds-test-yanlis',
  M.bulutAlaniniKodla('yds-test-yanlis', ozelSilme.alanlar['yds-test-yanlis']));
assert.ok(Object.prototype.hasOwnProperty.call(ozelSilmeAlani.i, '__proto__'),
  'tombstone K2 round-trip kimliği kayboldu');
assert.strictEqual(ozelSilmeAlani.i.__proto__.d, 1);
var ozelSilmeZarfi = { surum: M.SURUM, alanlar: {} };
ozelSilmeZarfi.alanlar['yds-test-yanlis'] = ozelSilmeAlani;
D.uygula(ozelSilmeZarfi, 'bulut');
var silmeUygulanan = Depo.oku('yds-test-yanlis', {});
assert.strictEqual(Object.prototype.hasOwnProperty.call(silmeUygulanan, '__proto__'), false);
assert.ok(Object.prototype.hasOwnProperty.call(silmeUygulanan, 'constructor'));
assert.ok(Object.prototype.hasOwnProperty.call(silmeUygulanan, 'normal'));

// Hassas kayıt yazımı mevcut kartı ezmeden yenisini ekler.
Depo.kayitlariYaz('yds-leitner', { alpha: { k: 2, g: 20, c: 15 } });
assert.deepStrictEqual(Object.keys(Depo.oku('yds-leitner', {})).sort(), ['alpha', 'base']);

// Diğer sekmeden gelen zarf otomatik birleşir ve klasik anahtara yansır.
var uzaktan = M.kayitlariYaz(M.zarfaCevir({ 'yds-leitner': { base: { k: 1, g: 10 } } }),
  'yds-leitner', { beta: { k: 3, g: 30, c: 16 } }, function () { return '9999999999999:B'; });
bellek.set(D.ANAHTAR, JSON.stringify(uzaktan));
dinleyiciler.storage({ key: D.ANAHTAR, newValue: JSON.stringify(uzaktan) });
assert.deepStrictEqual(Object.keys(Depo.oku('yds-leitner', {})).sort(), ['alpha', 'base', 'beta']);

// Kayıt silme işareti, eski bulut görüntüsü tekrar uygulanınca da korunur.
Depo.kayitlariSil('yds-leitner', ['alpha']);
D.uygula(M.zarfaCevir({ 'yds-leitner': { alpha: { k: 5, g: 99 } } }), 'bulut');
assert.strictEqual(Depo.oku('yds-leitner', {}).alpha, undefined);

// Anahtar sıfırlaması bilinmeyen eski cihaz kayıtlarını da bastırır.
Depo.sil('yds-leitner');
D.uygula(uzaktan, 'bulut');
assert.strictEqual(Depo.oku('yds-leitner', null), null);

// Klasik dizi yazımları da kayıt düzeyinde izlenir.
Depo.yaz('yds-yanlis', [{ a: 'K|S', kat: 'K', n: 1, t: 10 }]);
Depo.yaz('yds-yanlis', []);
D.uygula(M.zarfaCevir({ 'yds-yanlis': [{ a: 'K|S', kat: 'K', n: 1, t: 10 }] }), 'bulut');
assert.deepStrictEqual(temiz(Depo.oku('yds-yanlis', [])), []);

assert.ok(bildirilen.some(function (e) { return e.type === 'yds-depo-degisti'; }));
console.log('esitleme-depo: 9 senaryo başarılı');
