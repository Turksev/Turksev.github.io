'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var eklenenler = [];
var betikSayisi = 0;
var durumlar = [];

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
    olaylar: {},
    addEventListener: function (tur, fn) { this.olaylar[tur] = fn; }
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
    appendChild: function (s) {
      betikSayisi++;
      setTimeout(function () { s.onerror(); }, 0);
    }
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
    Depo: {
      oku: function (_, varsayilan) { return varsayilan; },
      yaz: function () { return true; },
      sil: function () { return true; }
    },
    EsitlemeMotoru: { TIPLER: {} }, EsitlemeDepo: {},
    yenidenYukle: function () {}
  },
  CustomEvent: function (tur, ayar) { this.type = tur; this.detail = ayar && ayar.detail; },
  addEventListener: function () {},
  dispatchEvent: function (e) { if (e.type === 'yds-esitleme-durumu') durumlar.push(e.detail); }
};
var baglam = {
  window: pencere,
  document: document,
  location: { protocol: 'https:', hostname: 'test' },
  localStorage: { length: 0, key: function () { return null; } },
  sessionStorage: {
    getItem: function () { return null; }, setItem: function () {}, removeItem: function () {}
  },
  CustomEvent: pencere.CustomEvent,
  Promise: Promise, Error: Error, Object: Object, String: String,
  setTimeout: setTimeout, clearTimeout: clearTimeout
};
vm.createContext(baglam);
vm.runInContext(fs.readFileSync(path.join(kok, 'assets', 'js', 'esitleme-v2.js'), 'utf8'), baglam);

assert.strictEqual(betikSayisi, 0, 'önceden etkin olmayan kullanıcıda SDK açılışta yüklendi');
assert.strictEqual(olusanDugme.disabled, false, 'eşitleme düğmesi lazy-load öncesi kullanılamıyor');
assert.ok(pencere.YDS.Esitleme && typeof pencere.YDS.Esitleme.sdkYukle === 'function');
assert.strictEqual(pencere.YDS.Esitleme.oturumDurumu().silmeHazir, false,
  'uygulanmamış kalıcı silme Ayarlar arayüzüne hazır bildirildi');
olusanDugme.olaylar.click();

setTimeout(function () {
  try {
    assert.strictEqual(betikSayisi, 1, 'açık kullanıcı tıklaması SDK yüklemesini başlatmadı');
    assert.strictEqual(eklenenler.length, 1, 'çevrimdışı uyarısı görünür değil');
    assert.ok(uyariMetni.textContent.indexOf('İlerlemen bu cihazda korunuyor') >= 0);
    assert.strictEqual(olusanDugme.disabled, false, 'CDN hatasından sonra yeniden deneme kapandı');
    assert.ok(olusanDugme.classList.contains('hata'));
    assert.ok(durumlar.some(function (d) { return d.durum === 'hata'; }));
    assert.ok(durumlar.every(function (d) { return d.silmeHazir === false; }));
    console.log('esitleme-cdn: lazy-load + yerel kullanım + görünür çevrimdışı uyarısı başarılı');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
}, 30);
