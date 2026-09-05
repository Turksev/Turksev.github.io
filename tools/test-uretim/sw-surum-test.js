'use strict';

/* Service worker sürüm bekçisi.

   sw.js JS/veri dosyalarını önbellek-öncelikli sunar; SURUM artmazsa kullanıcı
   her yayından sonraki ilk ziyarette yeni HTML + eski JS/veri görür. Bu test,
   yayımlanan dosyaların özetini tools/sw-surum.py ile birebir aynı yöntemle
   hesaplar ve sw.js'teki ICERIK_OZETI ile karşılaştırır: dosya değişip betik
   çalıştırılmamışsa (dolayısıyla sürüm artmamışsa) burada kırmızıya döner. */

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var UZANTILAR = ['.html', '.js', '.css', '.json', '.webmanifest', '.svg', '.txt', '.xml'];
var KLASORLER = ['assets', 'data', 'konu'];
var DISLA = ['.git', '.github', 'tools', 'tmp', 'node_modules'];

function fnv1a(bytes) {
  var h = 0x811C9DC5;
  for (var i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function hex8(n) { return ('00000000' + n.toString(16)).slice(-8); }

function uzantiUygun(ad) {
  var nokta = ad.lastIndexOf('.');
  return nokta >= 0 && UZANTILAR.indexOf(ad.slice(nokta)) !== -1;
}

function dizinMi(tam) {
  try { return fs.statSync(tam).isDirectory(); } catch (e) { return false; }
}

function gez(gorece, topla) {
  var tam = path.join(kok, gorece);
  var adlar = fs.readdirSync(tam).map(function (a) { return String(a); }).sort();
  adlar.forEach(function (ad) {
    if (DISLA.indexOf(ad) !== -1) return;
    var alt = gorece ? gorece + '/' + ad : ad;
    if (dizinMi(path.join(kok, alt))) gez(alt, topla);
    else if (uzantiUygun(ad)) topla.push(alt);
  });
}

function yayimlananDosyalar() {
  var yollar = [];
  fs.readdirSync(kok).map(function (a) { return String(a); }).forEach(function (ad) {
    if (ad === 'sw.js' || dizinMi(path.join(kok, ad))) return;
    if (/\.html$/.test(ad) || ad === 'manifest.webmanifest') yollar.push(ad);
  });
  KLASORLER.forEach(function (k) { gez(k, yollar); });
  return yollar.sort();
}

var kodlayici = new TextEncoder();
function icerikOzeti() {
  var yollar = yayimlananDosyalar();
  var parcalar = yollar.map(function (yol) {
    var metin = String(fs.readFileSync(path.join(kok, yol), 'utf8')).replace(/\r\n/g, '\n');
    return yol + '\n' + hex8(fnv1a(kodlayici.encode(metin))) + '\n';
  });
  return { ozet: hex8(fnv1a(kodlayici.encode(parcalar.join('')))), sayi: yollar.length, yollar: yollar };
}

var sw = String(fs.readFileSync(path.join(kok, 'sw.js'), 'utf8'));
var surum = /var SURUM = 'yds-v(\d+)';/.exec(sw);
var ozetSatiri = /var ICERIK_OZETI = '([0-9a-f]{8})';/.exec(sw);
assert.ok(surum, "sw.js: var SURUM = 'yds-vN' satırı yok");
assert.ok(ozetSatiri, "sw.js: var ICERIK_OZETI = '…' satırı yok (tools/sw-surum.py çalıştır)");

var hesap = icerikOzeti();
if (hesap.ozet !== ozetSatiri[1]) {
  // Hangi tarafın listesi farklı, görülebilsin diye yalnız hata durumunda dökülür.
  console.error('sw-surum dosya listesi (' + hesap.sayi + '): ' + hesap.yollar.join('|'));
}
assert.strictEqual(hesap.ozet, ozetSatiri[1],
  'yayımlanan dosyalar değişti ama sw.js sürümü artırılmadı: özet ' + ozetSatiri[1] +
  ' → ' + hesap.ozet + ' (' + hesap.sayi + ' dosya). Yayından önce "python tools/sw-surum.py" çalıştır.');

// Kökteki her sayfa çevrimdışı listede olsun (404 ve konu/ alt sayfaları hariç, bilerek).
var liste = /var TEMEL_DOSYALAR = \[([\s\S]*?)\];/.exec(sw);
assert.ok(liste, 'sw.js: TEMEL_DOSYALAR listesi yok');
var listede = {};
liste[1].replace(/'\.\/([^']+)'/g, function (_, p) { listede[p] = true; return _; });
hesap.yollar.filter(function (y) { return /^[^/]+\.html$/.test(y) && y !== '404.html'; })
  .forEach(function (sayfa) {
    assert.ok(listede[sayfa], 'sw.js TEMEL_DOSYALAR: ' + sayfa + ' çevrimdışı listede değil');
  });
['assets/js/cumleler.js', 'assets/js/kelime-bilgi.js'].forEach(function (d) {
  assert.ok(listede[d], 'sw.js TEMEL_DOSYALAR: ' + d + ' listede değil');
});

console.log('sw-surum: yds-v' + surum[1] + ', özet ' + hesap.ozet + ' güncel (' + hesap.sayi + ' dosya), kök sayfalar çevrimdışı listede');
