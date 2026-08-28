'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var eklenenler = [];

function sinifListesi() {
  var degerler = new Set();
  return {
    add: function (x) { degerler.add(x); },
    remove: function (x) { degerler.delete(x); },
    contains: function (x) { return degerler.has(x); }
  };
}

function dugme() {
  return {
    classList: sinifListesi(),
    setAttribute: function () {},
    addEventListener: function () {}
  };
}

var kapat = dugme();
var uyariMetni = { textContent: '' };
var govde = {
  appendChild: function (el) { el.parentNode = govde; eklenenler.push(el); },
  removeChild: function (el) {
    eklenenler = eklenenler.filter(function (x) { return x !== el; });
    el.parentNode = null;
  }
};
var tema = dugme();
tema.parentNode = { insertBefore: function (el) { el.parentNode = tema.parentNode; } };
var olusanDugme = null;
var document = {
  body: govde,
  visibilityState: 'visible',
  head: {
    appendChild: function (s) { setTimeout(function () { s.onerror(); }, 0); }
  },
  querySelector: function (secici) {
    return secici === '.theme-toggle:not(.esit-dugme)' ? tema : null;
  },
  querySelectorAll: function () { return []; },
  addEventListener: function () {},
  createElement: function (tur) {
    if (tur === 'button') {
      olusanDugme = dugme();
      return olusanDugme;
    }
    if (tur === 'div') {
      var kutu = dugme();
      kutu.querySelector = function (secici) {
        return secici === 'button' ? kapat : uyariMetni;
      };
      return kutu;
    }
    return {};
  }
};
var pencere = {
  FIREBASE_AYAR: { projectId: 'test' },
  YDS: {
    Depo: {}, EsitlemeMotoru: { TIPLER: {} }, EsitlemeDepo: {},
    yenidenYukle: function () {}
  },
  addEventListener: function () {}
};
var baglam = {
  window: pencere,
  document: document,
  location: { protocol: 'https:', hostname: 'test' },
  Promise: Promise, Error: Error, Object: Object, String: String,
  setTimeout: setTimeout, clearTimeout: clearTimeout
};
vm.createContext(baglam);
vm.runInContext(fs.readFileSync(path.join(kok, 'assets', 'js', 'esitleme-v2.js'), 'utf8'), baglam);

setTimeout(function () {
  try {
    assert.strictEqual(eklenenler.length, 1, 'çevrimdışı uyarısı görünür değil');
    assert.ok(uyariMetni.textContent.indexOf('İlerlemen bu cihazda korunuyor') >= 0);
    assert.strictEqual(olusanDugme.disabled, true);
    assert.ok(olusanDugme.classList.contains('hata'));
    console.log('esitleme-cdn: yerel kullanım + görünür çevrimdışı uyarısı başarılı');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
}, 30);
