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
var kayitlar = {};
baglam.window.KELIME_DIZIN.forEach(function (k) {
  kayitlar[k.e] = { k: 5, g: 25000, c: 24970 };
});
baglam.window.OBEKLER.forEach(function (o) {
  kayitlar[o.f] = { k: 5, g: 25000, c: 24970 };
});

var zarf = M.kayitlariYaz(M.zarfaCevir({}), 'yds-leitner', kayitlar,
  function () { return '9999999999999:abcdefghijklmno'; });
var bayt = Buffer.byteLength(M.kararliJson(zarf), 'utf8');

// Firestore belge sınırı 1 MiB'dir; diğer küçük ilerleme alanları ve belge
// alan başlıkları için en az 100 KiB güvenlik payı bırak.
assert.ok(bayt < 924 * 1024, 'tam ilerleme zarfı güvenli sınırı aşıyor: ' + bayt + ' bayt');
console.log('esitleme-boyut: ' + Object.keys(kayitlar).length + ' kayıt, ' + bayt + ' bayt');
