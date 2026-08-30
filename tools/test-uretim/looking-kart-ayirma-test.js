'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var pencere = {};
var baglam = vm.createContext({ window: pencere });

function yukle(dosya) {
  vm.runInContext(fs.readFileSync(path.join(kok, dosya), 'utf8'), baglam,
    { filename: dosya, timeout: 5000 });
}

yukle('data/kelime-dizin.js');
yukle('data/kelime-k2.js');
yukle('data/obekler.js');
yukle('data/sayilar.js');

var dizin = pencere.KELIME_DIZIN.filter(function (x) { return x.e === 'looking'; })[0];
var looking = pencere.KELIME_K2.looking;
assert.ok(dizin && looking, 'looking kelime kartı bulunamadı');
assert.strictEqual(dizin.y, 'fiil', 'looking kartı yalnız çekimli fiil olarak kalmalı');
assert.strictEqual(looking.a.length, 1, 'looking kartında kalıp anlamları birikmemeli');
assert.ok(!looking.kl, 'looking kartında bağımsız öbeklere ait kalıp satırları kalmamalı');
assert.ok(/look fiilinin -ing biçimi/.test(looking.a[0].tr),
  'looking kartı biçimbilgisel açıklamasını korumalı');

var obekler = new Map(pencere.OBEKLER.map(function (x) { return [x.f, x]; }));
[
  ['look at', /bakmak|incelemek/],
  ['look for', /aramak/],
  ['look forward to', /dört gözle beklemek/],
  ['look like', /benzemek/],
  ['look + adjective', /görünmek/],
  ['-looking', /görünümlü/]
].forEach(function (beklenen) {
  var kart = obekler.get(beklenen[0]);
  assert.ok(kart, beklenen[0] + ': bağımsız öbek kartı yok');
  assert.ok(kart.a.some(function (a) { return beklenen[1].test(a.tr); }),
    beklenen[0] + ': beklenen anlam yok');
});

assert.strictEqual(pencere.OBEKLER.length, 1631, 'öbek kart sayısı güncel veriyle eşleşmeli');
assert.strictEqual(pencere.SAYILAR.obek, pencere.OBEKLER.length,
  'görünen öbek sayısı veriyle eşleşmiyor');

console.log('looking-kart-ayırma: sade kelime kartı + 6 bağımsız kullanım kartı başarılı');
