'use strict';

/* Katman seçicideki puan baloncuğu (assets/js/veri.js → KATMAN_PUAN) ile
   üretimdeki gerçek bantların (tools/listeyi-aktar.py → KATMANLAR) aynı
   olduğunu doğrular. İkisi ayrı dosyada durduğu için eşik bir yerde
   değişip diğerinde unutulursa kullanıcıya yanlış aralık gösterilirdi. */

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var pencere = { YDS: {} };
var baglam = vm.createContext({ window: pencere, document: { head: {} } });
['data/kelime-dizin.js', 'assets/js/veri.js'].forEach(function (dosya) {
  vm.runInContext(fs.readFileSync(path.join(kok, dosya), 'utf8'), baglam, { filename: dosya });
});
var Veri = pencere.YDS.Veri;

// --- üretim tarafındaki bantlar
var py = fs.readFileSync(path.join(kok, 'tools/listeyi-aktar.py'), 'utf8');
var blok = py.match(/KATMANLAR = \[([\s\S]*?)\]/);
assert.ok(blok, 'listeyi-aktar.py içinde KATMANLAR tablosu bulunamadı');
var uretim = {};
blok[1].replace(/\((\d),\s*'[^']*',\s*([-\d.e+]+),\s*([-\d.e+]+)\)/g, function (_, k, alt, ust) {
  // -1 ve 1e9 "sınır yok" demektir; JS tarafında null ile gösterilir.
  uretim[Number(k)] = [Number(alt) < 0 ? null : Number(alt), Number(ust) >= 1e9 ? null : Number(ust)];
  return _;
});
assert.strictEqual(Object.keys(uretim).length, 7, 'KATMANLAR yedi katman içermiyor');

Object.keys(uretim).forEach(function (k) {
  // Array.from: vm bağlamındaki dizinin prototipi test alanınınkinden farklı,
  // deepStrictEqual prototipi de karşılaştırıyor.
  assert.deepStrictEqual(Array.from(Veri.KATMAN_PUAN[k]), uretim[k],
    k + '. katmanın puan bandı veri.js ile listeyi-aktar.py arasında farklı');
  var metin = Veri.katmanPuanMetni(Number(k));
  assert.ok(metin && /\d/.test(metin), k + '. katman için puan metni boş');
  var sinir = uretim[k][0] === null ? uretim[k][1] : uretim[k][0];
  assert.ok(metin.indexOf(String(sinir)) >= 0,
    k + '. katman puan metni bant sınırını göstermiyor: ' + metin);
});

// Baloncuk bütün katmanlar için ayrı bir metin üretmeli (kopyala-yapıştır hatası).
var metinler = Veri.KATMANLAR.map(function (k) { return Veri.katmanPuanMetni(k); });
assert.strictEqual(new Set(metinler).size, metinler.length, 'iki katman aynı puan metnini gösteriyor');

/* Bantlar bitişik olmalı: bir katmanın üst sınırı bir üstünün alt sınırıdır.
   Aksi hâlde arada puanı hiçbir katmana düşmeyen kelime kalırdı. */
for (var k = 2; k <= 7; k++) {
  assert.strictEqual(Veri.KATMAN_PUAN[k][1], Veri.KATMAN_PUAN[k - 1][0],
    k + '. katmanın üst sınırı ' + (k - 1) + '. katmanın alt sınırıyla bitişik değil');
}

/* Katmanı elle sabitlenen kartlar (aile üyeleri, sınav kanıtlı ekler) bandın
   dışında kalabilir; bu bilinçlidir. Yine de her katmanın büyük çoğunluğu
   kendi bandında olmalı — olmazsa baloncuk kullanıcıyı yanıltır. */
var sayac = {};
pencere.KELIME_DIZIN.forEach(function (d) {
  if (typeof d.p !== 'number') return;
  var bant = Veri.KATMAN_PUAN[d.k];
  if (!bant) return;
  var icinde = (bant[0] === null || d.p >= bant[0]) && (bant[1] === null || d.p < bant[1]);
  var s = sayac[d.k] || (sayac[d.k] = { icinde: 0, toplam: 0 });
  s.toplam++;
  if (icinde) s.icinde++;
});
[1, 2, 3, 4, 5].forEach(function (k) {
  var s = sayac[k];
  assert.ok(s && s.toplam > 0, k + '. katmanda puanlı kelime yok');
  var oran = s.icinde / s.toplam;
  assert.ok(oran >= 0.9,
    k + '. katman kelimelerinin yalnız %' + Math.round(oran * 100) + "'i kendi puan bandında");
});

console.log('katman-puan-aralığı: 7 bant veri.js ↔ listeyi-aktar.py eşleşti, baloncuk metinleri benzersiz');
