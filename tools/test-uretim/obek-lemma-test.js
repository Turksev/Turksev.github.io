'use strict';

/* Öbek anahtar standardı (06.09.2026, denetim B6): çekimli anahtarlar lemmaya
   birleşti. tools/obek-lemma.json tablosu data/obekler.js sonunda OBEK_TAKMA
   olarak yayımlanır; eski kimlikler esitleme-veri.js'de lemmaya çözülür. */

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

var tablo = JSON.parse(fs.readFileSync(path.join(kok, 'tools', 'obek-lemma.json'), 'utf8'));
assert.strictEqual(tablo.sema, 1);
var takma = tablo.takma;
assert.ok(Object.keys(takma).length >= 38, 'takma tablosu küçüldü');

['data/kelime-aliaslari.js', 'data/obekler.js', 'assets/js/esitleme-veri.js'].forEach(yukle);

assert.deepStrictEqual(pencere.OBEK_TAKMA, takma, 'obekler.js sonundaki OBEK_TAKMA tabloyla aynı olmalı');

var obekler = new Map(pencere.OBEKLER.map(function (x) { return [x.f, x]; }));
Object.keys(takma).forEach(function (eski) {
  var yeni = takma[eski];
  assert.ok(!obekler.has(eski), eski + ': çekimli anahtar hâlâ ayrı kart');
  var kart = obekler.get(yeni);
  assert.ok(kart, yeni + ': lemma kartı yok');
  assert.ok(Array.isArray(kart.b) && kart.b.indexOf(eski) >= 0, yeni + ': b alanı ' + eski + ' biçimini taşımalı');
  assert.ok(kart.a.length >= 1, yeni + ': anlamı yok');
});

// Birleşen çiftlerde anlam kaybı olmamalı: look at iki kaynaktan tek tr taşıyordu.
var lookAt = obekler.get('look at');
assert.ok(lookAt.a.some(function (a) { return /bakmak|incelemek/.test(a.tr); }));
assert.deepStrictEqual(lookAt.b, ['looking at']);

// İlerleme kimliği: eski anahtar lemmaya çözülür, lemma olduğu gibi kalır.
var Motor = pencere.YDS.EsitlemeMotoru;
assert.strictEqual(Motor.ilerlemeKimligi('looking at', 'obek'), 'look at');
assert.strictEqual(Motor.ilerlemeKimligi('look at', 'obek'), 'look at');
assert.strictEqual(Motor.ilerlemeKimligi('stems from', 'obek'), 'stem from');
assert.deepStrictEqual(Motor.ilerlemeKimliginiCoz('looking at'), { ad: 'look at', tur: 'obek' });
// Kelime kimlikleri etkilenmez.
assert.notStrictEqual(Motor.ilerlemeKimligi('looking', 'kelime'), 'look at');

console.log('obek-lemma: ' + Object.keys(takma).length + ' çekimli anahtar lemmaya bağlı, kimlik çözümü doğrulandı');
