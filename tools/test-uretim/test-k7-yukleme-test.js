'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var eklenenBetikler = [];
var pencere = { KELIME_DIZIN: [], YDS: {} };
var baglam = {
  window: pencere,
  document: {
    createElement: function () { return {}; },
    head: { appendChild: function (betik) {
      eklenenBetikler.push(betik.src);
      if (betik.src === 'data/test-k7.js') pencere.TEST_K7 = { rowing: {} };
      if (betik.src === 'data/test-modal.js') pencere.TEST_MODAL = {};
      betik.onload();
    } }
  },
  Promise: Promise, Error: Error, Object: Object
};
vm.createContext(baglam);
vm.runInContext(fs.readFileSync(path.join(kok, 'assets', 'js', 'veri.js'), 'utf8'), baglam);

pencere.YDS.Veri.testleriYukle([7]).then(function () {
  assert.strictEqual(Object.keys(pencere.TEST_K7).length, 1);
  assert.deepStrictEqual(eklenenBetikler.sort(), ['data/test-k7.js', 'data/test-modal.js'],
    '7. katman veya modal test dosyası yüklenmedi');
  console.log('test-k7-yukleme: 7. katman testi yüklendi');
}).catch(function (e) {
  console.error(e);
  process.exitCode = 1;
});
