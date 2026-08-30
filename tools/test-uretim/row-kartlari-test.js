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

['data/kelime-dizin.js', 'data/kelime-k5.js', 'data/kelime-k7.js',
 'data/test-k5.js', 'data/test-k7.js'].forEach(yukle);

var dizin = new Map(pencere.KELIME_DIZIN.map(function (x) { return [x.e, x]; }));
var temel = pencere.KELIME_K5.row;
var kavga = pencere.KELIME_K5['row /raʊ/'];
var rowing = pencere.KELIME_K7.rowing;

assert.ok(temel && kavga && rowing, 'üç ayrı row/rowing kartından biri eksik');
assert.strictEqual(temel.a.length, 2, 'row /roʊ/ kartı sıra ve kürek anlamlarıyla sınırlı olmalı');
assert.ok(temel.a.every(function (a) { return /\/roʊ\//.test(a.tr); }),
  'row ana kartında /roʊ/ telaffuzu belirtilmeli');
assert.ok(!temel.a.some(function (a) { return /kavga|ağız dalaşı/.test(a.tr); }),
  '/raʊ/ anlamı row ana kartında kalmamalı');
assert.strictEqual(kavga.a.length, 2, 'row /raʊ/ isim ve fiil anlamları ayrı satırlar olmalı');
assert.ok(kavga.a.some(function (a) { return /kavga|ağız dalaşı/.test(a.tr); }));
assert.ok(kavga.a.some(function (a) { return /tartışmak/.test(a.tr); }));

assert.strictEqual(dizin.get('row').k, 5, 'mevcut row kartının katmanı değişmemeli');
assert.strictEqual(dizin.get('row /raʊ/').p, 16.9, 'row /raʊ/ puanı yanlış');
assert.strictEqual(dizin.get('rowing').p, 9.8, 'rowing gerçek puanı yanlış');
assert.strictEqual(dizin.get('rowing').k, 7, 'rowing son katmanda olmalı');
assert.ok(/art of rowing/.test(rowing.a[0].ex), '2013 YDS rowing bağlamı korunmalı');

assert.strictEqual(pencere.TEST_K5.row.b, 'row');
assert.strictEqual(pencere.TEST_K5['row /raʊ/'].b, 'row');
assert.strictEqual(pencere.TEST_K7.rowing.b, 'rowing');

console.log('row-kartları: /roʊ/, /raʊ/ ve rowing ayrı kartlarda doğrulandı');
