'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var pencere = { YDS: {} };
var baglam = vm.createContext({ window: pencere });

function yukle(dosya) {
  vm.runInContext(fs.readFileSync(path.join(kok, dosya), 'utf8'), baglam,
    { filename: dosya, timeout: 5000 });
}

['data/kelime-dizin.js', 'data/kelime-k5.js', 'data/kelime-k7.js',
 'data/test-k5.js', 'data/test-k7.js', 'data/kelime-aliaslari.js',
 'assets/js/esitleme-veri.js'].forEach(yukle);

var dizin = new Map(pencere.KELIME_DIZIN.map(function (x) { return [x.e, x]; }));
var row = pencere.KELIME_K5.row;
var rowing = pencere.KELIME_K7.rowing;
var Motor = pencere.YDS.EsitlemeMotoru;

assert.ok(row && rowing, 'kanonik row veya ayrı rowing kartı eksik');
assert.strictEqual(row.a.length, 4, 'row kartında dört bağımsız anlam bulunmalı');
assert.ok(/sıra|satır/.test(row.a[0].tr), 'row sıra/satır anlamı eksik');
assert.ok(/kürek çekmek/.test(row.a[1].tr), 'row kürek çekmek anlamı eksik');
assert.ok(/kavga|ağız dalaşı/.test(row.a[2].tr), 'row kavga isim anlamı eksik');
assert.ok(/kavga etmek|tartışmak/.test(row.a[3].tr), 'row tartışmak fiil anlamı eksik');

assert.strictEqual(dizin.get('row').k, 5, 'mevcut row kartının katmanı değişmemeli');
assert.ok(!dizin.has('row /raʊ/'), 'eski telaffuz başlığı ayrı kart olmamalı');
assert.strictEqual(pencere.YDS_KELIME_ALIASES['row /raʊ/'], 'row',
  'eski telaffuz başlığı kanonik row kartına bağlanmalı');
assert.strictEqual(Motor.kelimeKimligi('row /raʊ/'), 'row',
  'row aliası aramada kanonik kimliğe çözülmeli');
assert.strictEqual(Motor.eskiIlerlemeKimligi('row /raʊ/'), 'row',
  'row aliası eski ilerlemeyi kanonik kimliğe taşımalı');
assert.strictEqual(dizin.get('rowing').p, 9.8, 'rowing gerçek puanı yanlış');
assert.strictEqual(dizin.get('rowing').k, 7, 'rowing son katmanda olmalı');
assert.ok(/art of rowing/.test(rowing.a[0].ex), '2013 YDS rowing bağlamı korunmalı');

assert.strictEqual(pencere.TEST_K5.row.b, 'row');
assert.ok(!pencere.TEST_K5['row /raʊ/'], 'eski alias için ikinci bir test kaydı üretilmemeli');
assert.strictEqual(pencere.TEST_K7.rowing.b, 'rowing');

console.log('row-kartları: dört anlamlı tek kanonik row + alias geçişi + ayrı rowing doğrulandı');
