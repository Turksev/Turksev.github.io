'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');
var kok = path.resolve(__dirname, '..', '..');
var baglam = { window: { YDS: {} } };
vm.createContext(baglam);
['assets/js/esitleme-veri.js', 'data/kelime-dizin.js', 'data/obekler.js'].forEach(function (dosya) {
  vm.runInContext(fs.readFileSync(path.join(kok, dosya), 'utf8'), baglam);
});

var M = baglam.window.YDS.EsitlemeMotoru;
assert.strictEqual(M.SURUM, 2, 'yerel zarf sürümü değişmemeli');
assert.strictEqual(M.BULUT_KODLAMA_SURUMU, 2, 'kısa alan iç kodlama sürümü');
var leitner = {};
var testYanlislari = {};
baglam.window.KELIME_DIZIN.forEach(function (k) {
  leitner[k.e] = { k: 5, g: 25000, c: 24970 };
  testYanlislari[k.e] = { n: 999999, t: 9999999999999 };
});
baglam.window.OBEKLER.forEach(function (o) {
  leitner[o.f] = { k: 5, g: 25000, c: 24970 };
  testYanlislari[o.f] = { n: 999999, t: 9999999999999 };
});
var zarf = M.kayitlariYaz(M.zarfaCevir({}), 'yds-leitner', leitner,
  function () { return '9999999999999:abcdefghijklmno'; });
zarf = M.kayitlariYaz(zarf, 'yds-test-yanlis', testYanlislari,
  function () { return '9999999999999:abcdefghijklmno'; });

var eskiTekBelgeBayt = Buffer.byteLength(M.kararliJson(zarf), 'utf8');
assert.ok(eskiTekBelgeBayt > 1024 * 1024,
  'regresyon senaryosu eski tek-belge sınırını aşmıyor: ' + eskiTekBelgeBayt);

var alanBaytlari = {};
['yds-leitner', 'yds-test-yanlis'].forEach(function (anahtar) {
  var doc = {
    surum: 3,
    anahtar: anahtar,
    zaman: 9999999999999,
    json: M.bulutAlanJson(anahtar, zarf.alanlar[anahtar])
  };
  var bayt = Buffer.byteLength(JSON.stringify(doc), 'utf8');
  alanBaytlari[anahtar] = bayt;
  assert.ok(bayt < 900 * 1024,
    anahtar + ' alan belgesi 900 KiB güvenli sınırını aşıyor: ' + bayt);
});

var kodluTestAlani = JSON.parse(M.bulutAlanJson('yds-test-yanlis',
  zarf.alanlar['yds-test-yanlis']));
assert.strictEqual(kodluTestAlani.k, 2,
  'test yanlışları alanı kısa bulut biçiminde değil');
assert.ok(Array.isArray(kodluTestAlani.i),
  'test yanlışları kısa bulut biçimi kayıt dizisi taşımıyor');
var cozulmusTestAlani = M.bulutAlaniniCoz('yds-test-yanlis', kodluTestAlani);
assert.strictEqual(M.kararliJson(cozulmusTestAlani),
  M.kararliJson(zarf.alanlar['yds-test-yanlis']),
  'kısa bulut biçimi test yanlışlarını kayıpsız geri açmıyor');

var sentetikYanlislar = {};
var sentetikLeitner = {};
for (var sentetik = 0; sentetik < 10000; sentetik++) {
  var sentetikId = 'synthetic-card-' + String(sentetik).padStart(5, '0');
  sentetikYanlislar[sentetikId] = {
    n: 999999,
    t: 9999999999999
  };
  sentetikLeitner[sentetikId] = { k: 5, g: 25000, c: 24970 };
}
var sentetikZarf = M.kayitlariYaz(M.zarfaCevir({}), 'yds-leitner', sentetikLeitner,
  function () { return '9999999999999:abcdefghijklmno'; });
sentetikZarf = M.kayitlariYaz(sentetikZarf, 'yds-test-yanlis', sentetikYanlislar,
  function () { return '9999999999999:abcdefghijklmno'; });
var sentetikBaytlar = {};
['yds-leitner', 'yds-test-yanlis'].forEach(function (anahtar) {
  var sentetikDoc = {
    surum: 3,
    anahtar: anahtar,
    zaman: 9999999999999,
    json: M.bulutAlanJson(anahtar, sentetikZarf.alanlar[anahtar])
  };
  var bayt = Buffer.byteLength(JSON.stringify(sentetikDoc), 'utf8');
  sentetikBaytlar[anahtar] = bayt;
  assert.ok(bayt < 900 * 1024,
    '10.000 sentetik benzersiz kartın ' + anahtar + ' belgesi sınırı aşıyor: ' + bayt);
  assert.ok(bayt < 750 * 1024,
    '10.000 sentetik benzersiz kartın ' + anahtar +
    ' belgesi için büyüme payı 750 KiB altında değil: ' + bayt);
});

var bulutKodu = fs.readFileSync(path.join(kok, 'assets/js/esitleme-v2.js'), 'utf8');
assert.ok(bulutKodu.indexOf("collection('alanlar')") >= 0,
  'üretim kodu alan başına Firestore belgesi kullanmıyor');
assert.ok(bulutKodu.indexOf('BELGE_GUVENLI_BAYT = 900 * 1024') >= 0,
  'üretim kodunda istemci tarafı 900 KiB koruması yok');

console.log('esitleme-boyut: eski tek belge ' + eskiTekBelgeBayt +
  ' bayt; leitner ' + alanBaytlari['yds-leitner'] +
  ', test-yanlış ' + alanBaytlari['yds-test-yanlis'] +
  ', 10.000 sentetik leitner ' + sentetikBaytlar['yds-leitner'] +
  ', test-yanlış ' + sentetikBaytlar['yds-test-yanlis'] + ' bayt');
