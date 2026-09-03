'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var kaynak = JSON.parse(fs.readFileSync(path.join(kok, 'tools', 'modal-kartlar.json'), 'utf8'));
var pencere = {};
var baglam = { window: pencere };
vm.createContext(baglam);

function yukle(dosya) {
  vm.runInContext(fs.readFileSync(path.join(kok, dosya), 'utf8'), baglam, { filename: dosya });
}

yukle('data/kelime-dizin.js');
for (var k = 1; k <= 6; k++) yukle('data/kelime-k' + k + '.js');
yukle('data/test-modal.js');

var kartlar = kaynak.cards;
assert.strictEqual(kartlar.length, 75, 'denetlenen özel kart başlık sayısı');
assert.strictEqual(new Set(kartlar.map(function (x) { return x.e; })).size, 75,
  'özel kart kaynağında yinelenen başlık');

var dizin = new Map(pencere.KELIME_DIZIN.map(function (x) { return [x.e, x]; }));
kartlar.forEach(function (x) {
  var d = dizin.get(x.e);
  assert.ok(d, x.e + ': dizinde yok');
  assert.strictEqual(d.k, x.k, x.e + ': puan katmanı yanlış');
  var tam = pencere['KELIME_K' + d.k][x.e];
  assert.ok(tam && tam.a.length, x.e + ': kart içeriği yok');
  tam.a.forEach(function (a) {
    assert.ok(a.tr && a.ex && a.exTr, x.e + ': anlam/örnek/çeviri eksik');
  });
  if (x.p === null) {
    assert.strictEqual(d.k, 6, x.e + ': puansız kart Geniş+ katmanında değil');
    assert.ok(x.reason && x.reason.length > 40, x.e + ': puansız kabul gerekçesi eksik');
    assert.ok(!Object.prototype.hasOwnProperty.call(d, 'p'),
      x.e + ': puansız kart dizinde yapay puan taşıyor');
  } else if (x.p < 10) {
    assert.strictEqual(d.k, 6, x.e + ': 10 puan altı son grupta değil');
  }
});

var testli = kartlar.filter(function (x) { return x.test; }).map(function (x) { return x.e; }).sort();
assert.strictEqual(testli.length, 65, 'yeni özel kartların test kaydı olmalı');
assert.deepStrictEqual(Object.keys(pencere.TEST_MODAL).sort(), testli,
  'modal Günün Testi kayıtları kart kaynağıyla farklı');

function anlamlar(en) {
  var d = dizin.get(en);
  return pencere['KELIME_K' + d.k][en].a.map(function (a) { return a.tr; }).join(' ');
}
assert.ok(/izin/.test(anlamlar('can')) && /olasılık/.test(anlamlar('can')), 'can işlevleri eksik');
assert.ok(/çıkarım/.test(anlamlar('must')), 'must çıkarım anlamı eksik');
assert.ok(/isteklilik/.test(anlamlar('will')), 'will isteklilik anlamı eksik');
assert.ok(/modal/.test(anlamlar('need')), 'need modal anlamı eksik');
assert.ok(/modal/.test(anlamlar('dare')), 'dare modal anlamı eksik');
assert.ok(/gelecek yıllar boyunca/.test(anlamlar('for years to come')),
  'for years to come anlamı eksik');
assert.ok(/gelecek yıllar/.test(anlamlar('years to come')),
  'years to come anlamı eksik');
assert.ok(/ardında/.test(anlamlar('in its wake')) && /sonucunda/.test(anlamlar('in its wake')),
  'in its wake anlamı eksik');

console.log('özel kartlar: 75 başlık, 65 yeni test, 9 düşük puanlı ve 3 puansız K6 kartı başarılı');
