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
assert.strictEqual(kartlar.length, 72, 'denetlenen modal başlık sayısı');
assert.strictEqual(new Set(kartlar.map(function (x) { return x.e; })).size, 72,
  'modal kaynakta yinelenen başlık');

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
  if (x.p < 10) assert.strictEqual(d.k, 6, x.e + ': 10 puan altı son grupta değil');
});

var testli = kartlar.filter(function (x) { return x.test; }).map(function (x) { return x.e; }).sort();
assert.strictEqual(testli.length, 62, 'yalnız yeni kartların modal test kaydı olmalı');
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

console.log('modal-kartlar: 72 başlık, 62 yeni test ve 9 düşük puanlı K6 kartı başarılı');
