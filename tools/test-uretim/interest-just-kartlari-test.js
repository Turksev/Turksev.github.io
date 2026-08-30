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

['data/kelime-dizin.js', 'data/kelime-k1.js', 'data/test-k1.js',
 'data/obekler.js', 'data/sayilar.js'].forEach(yukle);

var dizin = new Map(pencere.KELIME_DIZIN.map(function (x) { return [x.e, x]; }));
var interest = pencere.KELIME_K1.interest;
var just = pencere.KELIME_K1.just;

assert.ok(interest && just, 'interest veya just kelime kartı eksik');
assert.strictEqual(interest.a.length, 5, 'interest beş kaynak anlamını taşımalı');
[
  /ilgi, merak/,
  /çıkar, menfaat/,
  /faiz/,
  /ilgilendirmek, ilgisini çekmek/,
  /çekicilik, ilginçlik/
].forEach(function (beklenen) {
  assert.ok(interest.a.some(function (a) { return beklenen.test(a.tr); }),
    'interest anlamı eksik: ' + beklenen);
});
assert.ok(/faiz/.test(dizin.get('interest').t), 'interest kısa anlamında faiz yok');

assert.strictEqual(just.a.length, 4, 'just dört temel kullanımı taşımalı');
[
  /sadece, yalnızca/,
  /az önce, daha yeni/,
  /tam, tam da; hemen/,
  /adil, hakkaniyetli/
].forEach(function (beklenen) {
  assert.ok(just.a.some(function (a) { return beklenen.test(a.tr); }),
    'just anlamı eksik: ' + beklenen);
});
assert.ok(!just.a.some(function (a) { return /henüz/.test(a.tr); }),
  'just kartında yanıltıcı henüz karşılığı kalmamalı');
assert.strictEqual(just.a.filter(function (a) { return /adil/.test(a.tr); })[0].yz, 1,
  'just=adil düşük YDS önceliğinde kalmalı');

assert.ok(/mortgages/.test(pencere.TEST_K1.interest.c));
assert.ok(/faizi/.test(pencere.TEST_K1.interest.tr));
assert.ok(/statistical effect/.test(pencere.TEST_K1.just.c));
assert.ok(/yalnızca/.test(pencere.TEST_K1.just.tr));

var obekler = new Map(pencere.OBEKLER.map(function (x) { return [x.f, x]; }));
[
  ['interest rate', /faiz oranı/],
  ["in someone's interest", /yararına, çıkarına/],
  ['take/show an interest in', /ilgi duymak, ilgi göstermek/],
  ['not just ... but also', /yalnızca .* değil, aynı zamanda/],
  ['just because', /sırf .* diye/],
  ['just like', /tıpkı .* gibi/],
  ['just as', /tıpkı .* gibi/]
].forEach(function (beklenen) {
  var kart = obekler.get(beklenen[0]);
  assert.ok(kart, beklenen[0] + ': bağımsız öbek kartı yok');
  assert.ok(kart.a.some(function (a) { return beklenen[1].test(a.tr); }),
    beklenen[0] + ': beklenen anlam yok');
});

assert.strictEqual(pencere.OBEKLER.length, 1631, 'öbek kart sayısı yanlış');
assert.strictEqual(pencere.SAYILAR.obek, pencere.OBEKLER.length,
  'görünen öbek sayısı veriyle eşleşmiyor');

console.log('interest/just: 9 kelime anlamı, 7 öbek ve baskın test kullanımları doğrulandı');
