'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var kaynak = JSON.parse(fs.readFileSync(
  path.join(kok, 'tools', 'pdf-anlam-duzeltmeleri.json'), 'utf8'));
var pencere = {};
var baglam = vm.createContext({ window: pencere });

function yukle(dosya) {
  vm.runInContext(fs.readFileSync(path.join(kok, dosya), 'utf8'), baglam,
    { filename: dosya, timeout: 5000 });
}

yukle('data/kelime-dizin.js');
for (var katman = 1; katman <= 7; katman++) yukle('data/kelime-k' + katman + '.js');

assert.strictEqual(kaynak.schema_version, 1, 'beklenmeyen düzeltme şeması');
assert.ok(Array.isArray(kaynak.corrections) && kaynak.corrections.length,
  'anlam düzeltmesi yok');

var dizin = new Map(pencere.KELIME_DIZIN.map(function (kayit) {
  return [kayit.e, kayit];
}));
var kartlar = new Map();
for (katman = 1; katman <= 7; katman++) {
  var katmanKartlari = pencere['KELIME_K' + katman] || {};
  Object.keys(katmanKartlari).forEach(function (en) {
    kartlar.set(en, katmanKartlari[en]);
  });
}

var gorulen = new Set();
var izinliTurler = new Set(['fiil', 'isim', 'sıfat', 'zarf', 'edat', 'bağlaç']);
kaynak.corrections.forEach(function (duzeltme, sira) {
  assert.ok(typeof duzeltme.e === 'string' && duzeltme.e,
    'corrections[' + sira + '].e eksik');
  assert.ok(!gorulen.has(duzeltme.e), duzeltme.e + ': yinelenen düzeltme');
  gorulen.add(duzeltme.e);
  assert.ok(['prepend', 'replace', 'type'].indexOf(duzeltme.operation) >= 0,
    duzeltme.e + ': geçersiz işlem');
  duzeltme.type.split(',').map(function (x) { return x.trim(); }).forEach(function (tur) {
    assert.ok(izinliTurler.has(tur), duzeltme.e + ': geçersiz tür ' + tur);
  });

  var dizinKaydi = dizin.get(duzeltme.e);
  var kart = kartlar.get(duzeltme.e);
  assert.ok(dizinKaydi, duzeltme.e + ': dizinde yok');
  assert.ok(kart, duzeltme.e + ': kart verisinde yok');
  assert.strictEqual(dizinKaydi.y, duzeltme.type, duzeltme.e + ': tür uygulanmadı');

  var anlamlar = Array.isArray(duzeltme.meanings) ? duzeltme.meanings : [];
  if (duzeltme.operation === 'type') {
    assert.strictEqual(anlamlar.length, 0, duzeltme.e + ': type işlemi anlam taşıyor');
    return;
  }
  assert.ok(anlamlar.length, duzeltme.e + ': yeni anlam yok');
  if (duzeltme.operation === 'replace') {
    assert.strictEqual(kart.a.length, anlamlar.length,
      duzeltme.e + ': replace eski anlam bıraktı');
  }

  anlamlar.forEach(function (anlam) {
    assert.ok(Number.isInteger(anlam.yz) && anlam.yz >= 1 && anlam.yz <= 4,
      duzeltme.e + ': geçersiz önem yıldızı');
    assert.ok(anlam.ex.toLocaleLowerCase('en').indexOf(
      duzeltme.e.toLocaleLowerCase('en')) >= 0,
    duzeltme.e + ': örnek hedef yüzey biçimini içermiyor');
    var uygulanan = kart.a.filter(function (aday) {
      return aday.tr === anlam.tr && aday.ex === anlam.ex &&
        aday.exTr === anlam.exTr && aday.yz === anlam.yz;
    });
    assert.strictEqual(uygulanan.length, 1,
      duzeltme.e + ': denetlenmiş anlam tam ve tekil uygulanmadı');
  });
});

var rapor = kaynak.report_only || {};
['proper_name_contamination', 'source_extraction_contamination'].forEach(function (alan) {
  assert.ok(Array.isArray(rapor[alan]), 'report_only.' + alan + ' dizi değil');
  rapor[alan].forEach(function (kayit) {
    assert.ok(!gorulen.has(kayit.e), kayit.e + ': rapor kaydı otomatik düzeltmeye karıştı');
  });
});

console.log('PDF anlam düzeltme: ' + kaynak.corrections.length +
  ' kayıt veri ve örnekleriyle doğrulandı');
