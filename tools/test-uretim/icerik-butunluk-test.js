'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var pencere = {};
var baglam = { window: pencere };
vm.createContext(baglam);

function yukle(dosya) {
  vm.runInContext(fs.readFileSync(path.join(kok, dosya), 'utf8'), baglam, { filename: dosya });
}

['data/sayilar.js', 'data/kelime-dizin.js', 'data/kelime-aliaslari.js',
 'data/olumsuzlar.js', 'data/baglaclar.js', 'data/sorular.js'].forEach(yukle);
for (var katman = 1; katman <= 7; katman++) yukle('data/kelime-k' + katman + '.js');
for (katman = 1; katman <= 6; katman++) yukle('data/test-k' + katman + '.js');
yukle('data/test-modal.js');

var dizin = pencere.KELIME_DIZIN;
var dizinAdlari = Array.from(dizin, function (x) { return x.e; });
var dizinKumesi = new Set(dizinAdlari);
assert.strictEqual(dizin.length, 7910);
assert.strictEqual(dizinKumesi.size, 7910, 'dizinde yinelenen başlık');
assert.strictEqual(pencere.SAYILAR.kelime, 7910);
assert.strictEqual(pencere.SAYILAR.katman['5'], 2050);
dizin.forEach(function (x) {
  assert.ok(typeof x.p === 'number' && Number.isFinite(x.p), x.e + ': öncelik puanı eksik');
  assert.ok(x.k >= 1 && x.k <= 6, x.e + ': geçersiz katman');
});

var kartAdlari = [];
var testAdlari = [];
var cokAnlamli = 0;
var ornekler = new Map();
for (katman = 1; katman <= 7; katman++) {
  var kartlar = pencere['KELIME_K' + katman] || {};
  Object.keys(kartlar).forEach(function (en) {
    kartAdlari.push(en);
    var kayit = kartlar[en];
    assert.ok(Array.isArray(kayit.a) && kayit.a.length, en + ': anlam yok');
    if (kayit.a.length > 1) {
      cokAnlamli++;
      kayit.a.forEach(function (a) {
        assert.ok(Number.isInteger(a.yz) && a.yz >= 1 && a.yz <= 4,
          en + ': çok anlamlı kayıtta yıldız eksik');
      });
    }
    kayit.a.forEach(function (a) {
      if (!a.ex) return;
      var anahtar = a.ex.trim().toLocaleLowerCase('en');
      assert.ok(!ornekler.has(anahtar), en + ': yinelenen kart örneği (' + ornekler.get(anahtar) + ')');
      ornekler.set(anahtar, en);
    });
  });
  if (katman <= 6) testAdlari = testAdlari.concat(Object.keys(pencere['TEST_K' + katman] || {}));
}
testAdlari = testAdlari.concat(Object.keys(pencere.TEST_MODAL || {}));
assert.strictEqual(cokAnlamli, 2667);
assert.deepStrictEqual(kartAdlari.slice().sort(), dizinAdlari.slice().sort(),
  'kart katmanları ile dizin farklı');
assert.deepStrictEqual(testAdlari.slice().sort(), dizinAdlari.slice().sort(),
  'test havuzu ile dizin farklı');

var kolay = pencere.KELIME_K1.easy.a;
var beyaz = pencere.KELIME_K2.white.a;
assert.ok(kolay.length > 1 && kolay[1].yz, 'easy ikinci anlam yıldızı eksik');
assert.ok(beyaz.length > 2 && beyaz[2].yz, 'white üçüncü anlam yıldızı eksik');

Object.keys(pencere.YDS_KELIME_ALIASES).forEach(function (eski) {
  assert.ok(!dizinKumesi.has(eski), eski + ': eski başlık dizinde kaldı');
  assert.ok(dizinKumesi.has(pencere.YDS_KELIME_ALIASES[eski]), eski + ': alias hedefi yok');
});

var olumsuzAna = Object.keys(pencere.OLUMSUZLAR);
var olumsuzForm = 0;
olumsuzAna.forEach(function (ana) {
  pencere.OLUMSUZLAR[ana].forEach(function (x) {
    olumsuzForm++;
    assert.strictEqual(!!x.s, dizinKumesi.has(x.f), ana + ' → ' + x.f + ': s:1 sözleşmesi yanlış');
  });
});
assert.strictEqual(olumsuzAna.length, 248);
assert.strictEqual(olumsuzForm, 253);

var cokIslev = {
  since: ['Neden', 'Zaman'],
  as: ['Neden', 'Zaman', 'Diğer'],
  for: ['Neden', 'Amaç', 'Zaman'],
  while: ['Karşıtlık', 'Zaman'],
  yet: ['Karşıtlık', 'Zaman', 'Ekleme']
};
Object.keys(cokIslev).forEach(function (ad) {
  var kayit = pencere.BAGLACLAR.filter(function (x) { return x.f === ad; })[0];
  assert.ok(kayit, ad + ': bağlaç yok');
  assert.deepStrictEqual(Array.from(kayit.ils), cokIslev[ad], ad + ': işlev etiketleri eksik');
});

assert.strictEqual(pencere.BAGLACLAR.length, 155);
assert.strictEqual(pencere.SORULAR.length, 125);
assert.strictEqual(Object.keys(pencere.PARCALAR).length, 4);
pencere.SORULAR.forEach(function (soru, i) {
  assert.ok(Array.isArray(soru.se) && soru.se.length === 5, 'soru ' + i + ': 5 seçenek yok');
  assert.strictEqual(new Set(Array.from(soru.se)).size, 5, 'soru ' + i + ': yinelenen seçenek');
  assert.ok(Number.isInteger(soru.d) && soru.d >= 0 && soru.d < 5, 'soru ' + i + ': cevap anahtarı');
  if (soru.pid) assert.ok(pencere.PARCALAR[soru.pid], 'soru ' + i + ': okuma parçası yok');
});

console.log('içerik-bütünlük: 7.910 kelime-yapı/test, 2.667 çok anlam, 253 olumsuz form, ' +
  '155 bağlaç ve 125 soru başarılı');
