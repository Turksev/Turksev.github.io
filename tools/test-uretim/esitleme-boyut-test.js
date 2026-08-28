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
    surum: M.SURUM,
    anahtar: anahtar,
    zaman: 9999999999999,
    json: M.kararliJson(zarf.alanlar[anahtar])
  };
  var bayt = Buffer.byteLength(JSON.stringify(doc), 'utf8');
  alanBaytlari[anahtar] = bayt;
  assert.ok(bayt < 900 * 1024,
    anahtar + ' alan belgesi 900 KiB güvenli sınırını aşıyor: ' + bayt);
});

var bulutKodu = fs.readFileSync(path.join(kok, 'assets/js/esitleme-v2.js'), 'utf8');
assert.ok(bulutKodu.indexOf("collection('alanlar')") >= 0,
  'üretim kodu alan başına Firestore belgesi kullanmıyor');
assert.ok(bulutKodu.indexOf('BELGE_GUVENLI_BAYT = 900 * 1024') >= 0,
  'üretim kodunda istemci tarafı 900 KiB koruması yok');

console.log('esitleme-boyut: eski tek belge ' + eskiTekBelgeBayt +
  ' bayt; leitner ' + alanBaytlari['yds-leitner'] +
  ', test-yanlış ' + alanBaytlari['yds-test-yanlis'] + ' bayt');
