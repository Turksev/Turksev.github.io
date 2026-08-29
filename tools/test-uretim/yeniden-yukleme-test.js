'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var swOlaylari = {};
var pencereOlaylari = {};
var oturum = new Map();
var yenidenYukleme = 0;

var document = {
  readyState: 'complete',
  documentElement: {
    classList: { add: function () {} },
    setAttribute: function () {},
    removeAttribute: function () {},
    getAttribute: function () { return null; }
  },
  querySelector: function () { return null; },
  querySelectorAll: function () { return []; },
  addEventListener: function () {}
};
var pencere = {
  matchMedia: function () { return { matches: false }; },
  addEventListener: function (tur, fn) { pencereOlaylari[tur] = fn; }
};
var baglam = {
  window: pencere,
  document: document,
  navigator: {
    serviceWorker: {
      addEventListener: function (tur, fn) { swOlaylari[tur] = fn; },
      register: function () { return Promise.resolve({ update: function () {} }); }
    }
  },
  location: {
    protocol: 'https:', hostname: 'test', pathname: '/kelimeler.html',
    reload: function () { yenidenYukleme++; }
  },
  localStorage: {
    getItem: function () { return null; },
    setItem: function () {},
    removeItem: function () {}
  },
  sessionStorage: {
    getItem: function (a) { return oturum.has(a) ? oturum.get(a) : null; },
    setItem: function (a, v) { oturum.set(a, String(v)); },
    removeItem: function (a) { oturum.delete(a); }
  },
  JSON: JSON, Object: Object, String: String, Date: Date, Math: Math,
  setTimeout: setTimeout, clearTimeout: clearTimeout, setInterval: function () {}
};
pencere.window = pencere;
vm.createContext(baglam);
vm.runInContext(fs.readFileSync(path.join(kok, 'assets', 'js', 'main.js'), 'utf8'), baglam);

assert.strictEqual(typeof swOlaylari.controllerchange, 'function');
oturum.set('yds-sw-yenile', '1');
swOlaylari.controllerchange();
pencere.YDS.yenidenYukle('bulut-ilk-birlesim');
pencere.YDS.yenidenYukle('baska-istek');

setTimeout(function () {
  try {
    assert.strictEqual(yenidenYukleme, 1, 'eşzamanlı istekler birden çok kez yeniledi');
    var kayit = JSON.parse(oturum.get('yds-son-yeniden-yukleme'));
    assert.deepStrictEqual(kayit.nedenler.sort(),
      ['baska-istek', 'bulut-ilk-birlesim', 'servis-calisani'].sort());
    console.log('yeniden-yukleme: tek koordinatör başarılı');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
}, 160);
