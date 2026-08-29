'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var bellek = new Map();
var sessionStorage = {
  getItem: function (k) { return bellek.has(k) ? bellek.get(k) : null; },
  setItem: function (k, v) { bellek.set(k, String(v)); },
  removeItem: function (k) { bellek.delete(k); }
};
var pencere = { YDS: {} };
var baglam = {
  window: pencere,
  sessionStorage: sessionStorage,
  JSON: JSON,
  Date: Date,
  Math: Math,
  Number: Number,
  Object: Object,
  Array: Array,
  String: String
};
vm.createContext(baglam);
vm.runInContext(fs.readFileSync(path.join(kok, 'assets', 'js', 'deneme-oturum.js'), 'utf8'), baglam);

var O = pencere.YDS.DenemeOturum;
var simdi = Date.now();

function soru(i) {
  return {
    id: 'q' + i,
    kat: i < 6 ? 'Kelime' : 'Okuma',
    konu: 'T01',
    kaynak: 'test',
    s: 'Question ' + i,
    se: ['Option ' + i + '-0', 'Option ' + i + '-1', 'Option ' + i + '-2', 'Option ' + i + '-3', 'Option ' + i + '-4'],
    d: i % 5,
    ac: 'Explanation ' + i
  };
}

function hazirla(s, duzen, cevap, isaret) {
  return {
    id: s.id,
    secenekler: duzen.map(function (i) { return s.se[i]; }),
    hamDizinler: duzen.slice(),
    oturumImzasi: O.soruImzasi(s),
    cevap: cevap,
    isaret: !!isaret
  };
}

var havuz20 = [];
for (var i = 0; i < 20; i++) havuz20.push(soru(i));
var duzen = [2, 0, 4, 1, 3];
var test20 = havuz20.map(function (s, i) { return hazirla(s, duzen, i === 3 ? 2 : null, i === 4); });
var baslangic = simdi - 1000;
var bitis = baslangic + 20 * 135 * 1000;

assert.strictEqual(O.kaydet(test20, {
  sira: 4, tur: 'karma', form: '', baslangic: baslangic, bitis: bitis
}), true);
var hamKayit = bellek.get(O.anahtar);
assert.ok(hamKayit && hamKayit.indexOf('Question ') < 0 && hamKayit.indexOf('Option ') < 0,
  'oturum soru veya şık metnini saklıyor');
assert.strictEqual(hamKayit.indexOf('dogruIndex'), -1, 'doğru cevap doğrudan saklanıyor');

var geri = O.geriYukle(havuz20, {}, []);
assert.ok(geri && geri.test.length === 20);
assert.strictEqual(geri.sira, 4);
assert.strictEqual(geri.test[3].cevap, 2);
assert.strictEqual(geri.test[4].isaret, true);
assert.strictEqual(geri.test[3].dogruIndex, duzen.indexOf(havuz20[3].d));
assert.strictEqual(geri.test[3].secenekler[0], havuz20[3].se[2]);

// Bankadaki soru/cevap/şık değişirse eski oturum yanlış anahtarla puanlanmaz.
var degismis = havuz20.map(function (s) { return Object.assign({}, s, { se: s.se.slice() }); });
degismis[3].se[0] = 'Changed option';
assert.strictEqual(O.geriYukle(degismis, {}, []), null);
assert.strictEqual(bellek.has(O.anahtar), false);

// Sabit form yalnız güncel form kimlikleri ve üreticinin şık kaydırmalarıyla açılır.
var havuz80 = [];
for (i = 0; i < 80; i++) havuz80.push(soru(100 + i));
var form = {
  id: 'A',
  sorular: havuz80.map(function (s) { return s.id; }),
  sikKaydirma: havuz80.map(function (_, n) { return n % 5; })
};
var test80 = havuz80.map(function (s, n) {
  var temel = [0, 1, 2, 3, 4], r = form.sikKaydirma[n];
  return hazirla(s, temel.slice(r).concat(temel.slice(0, r)), n === 12 ? 1 : null, false);
});
baslangic = simdi - 5000;
bitis = baslangic + 80 * 135 * 1000;
assert.strictEqual(O.kaydet(test80, {
  sira: 12, tur: 'tam', form: 'A', baslangic: baslangic, bitis: bitis
}), true);
geri = O.geriYukle(havuz80, {}, [form]);
assert.ok(geri && geri.aktifForm === 'A' && geri.test[12].cevap === 1);

var bozuk = JSON.parse(bellek.get(O.anahtar));
bozuk.sorular[0].duzen = [0, 0, 1, 2, 3];
bellek.set(O.anahtar, JSON.stringify(bozuk));
assert.strictEqual(O.geriYukle(havuz80, {}, [form]), null, 'yinelenen şık indisi kabul edildi');
assert.strictEqual(bellek.has(O.anahtar), false, 'bozuk oturum temizlenmedi');

// Geçmiş bitiş zamanı korunur; süre yenilemeyle yeniden başlamaz.
baslangic = simdi - 80 * 135 * 1000 - 5000;
bitis = baslangic + 80 * 135 * 1000;
assert.strictEqual(O.kaydet(test80, {
  sira: 0, tur: 'tam', form: 'A', baslangic: baslangic, bitis: bitis
}), true);
geri = O.geriYukle(havuz80, {}, [form]);
assert.ok(geri && geri.kalanSaniye === 0, 'süresi dolmuş oturum yeniden süre kazandı');

assert.strictEqual(O.kaydet(test20, {
  sira: 0, tur: 'karma', form: '', baslangic: simdi, bitis: simdi + 1234
}), false, 'geçersiz süre kabul edildi');

console.log('deneme-oturum: güvenli kayıt, banka doğrulama ve mutlak süre başarılı');
