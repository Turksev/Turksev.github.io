'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var eklenenBetik = 0;
var pencere = { KELIME_DIZIN: [], YDS: {} };
var baglam = {
  window: pencere,
  document: {
    createElement: function () { return {}; },
    head: { appendChild: function () { eklenenBetik++; } }
  },
  Promise: Promise, Error: Error, Object: Object
};
vm.createContext(baglam);
vm.runInContext(fs.readFileSync(path.join(kok, 'assets', 'js', 'veri.js'), 'utf8'), baglam);

pencere.YDS.Veri.testleriYukle([7]).then(function () {
  assert.strictEqual(Object.keys(pencere.TEST_K7).length, 0);
  assert.strictEqual(eklenenBetik, 0, 'olmayan test-k7.js için ağ isteği üretildi');
  console.log('test-k7-yukleme: 404 yok');
}).catch(function (e) {
  console.error(e);
  process.exitCode = 1;
});
