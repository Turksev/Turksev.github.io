'use strict';
// Ortak arama eşleştirmesi: arama sayfası ve sözlük paneli aynı kuralı kullanır.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const kok = path.resolve(__dirname, '../..');
const oku = dosya => fs.readFileSync(path.join(kok, dosya), 'utf8');

// Gerçek sadeleştirme fonksiyonu main.js'ten alınır; main.js DOM gerektirdiği için
// yalnız bu fonksiyon çalıştırılır.
const main = oku('assets/js/main.js');
const bas = main.indexOf('  function sadelestir(s) {');
assert.ok(bas >= 0, 'main.js sadelestir bulunamadı');
const son = main.indexOf('\n  }', bas);
const baglam = vm.createContext({ window: { YDS: {} } });
vm.runInContext(main.slice(bas, son + 4) + '\nwindow.YDS.sadelestir = sadelestir;', baglam);
vm.runInContext(oku('assets/js/arama-ortak.js'), baglam, { filename: 'arama-ortak.js' });
const A0 = baglam.window.YDS.AramaOrtak;
// vm içinde kurulan diziler başka bir Array prototipi taşır; karşılaştırma için ana bağlama kopyala.
const A = Object.assign({}, A0, {
  kelimeler: (dizin, q) => Array.from(A0.kelimeler(dizin, q)),
  obekler: (liste, q) => Array.from(A0.obekler(liste, q))
});
const sade = baglam.window.YDS.sadelestir;

const dizin = [
  { e: 'evidently', t: 'açıkça, belli ki', y: 'zarf' },
  { e: 'evidence', t: 'kanıt, delil', y: 'isim' },
  { e: 'self-evident', t: 'apaçık', y: 'sıfat' },
  { e: 'proof', t: 'kanıt, ispat', y: 'isim' },
  { e: 'cat', t: 'kedi', y: 'isim' }
];
let sonuc = A.kelimeler(dizin, sade('evidence'));
assert.deepEqual(sonuc.map(d => d.e), ['evidence'], 'Tam eşleşme');
sonuc = A.kelimeler(dizin, sade('evid'));
assert.deepEqual(sonuc.map(d => d.e), ['evidently', 'evidence', 'self-evident'],
  'Başlık başı eşleşmeler başlık içi eşleşmeden önce gelir');
sonuc = A.kelimeler(dizin, sade('KANIT'));
assert.deepEqual(sonuc.map(d => d.e).sort(), ['evidence', 'proof'], 'Türkçe anlam büyük harf ve ı/i farkıyla bulunur');
assert.equal(A.kelimeler(null, 'x').length, 0, 'Dizin yokken boş sonuç');

const obekler = [
  { f: 'cope with', y: 'deyimsel fiil', a: [{ tr: 'başa çıkmak', ex: 'They cope with stress.', exTr: 'Stresle başa çıkarlar.' }] },
  { f: 'deal with', y: 'deyimsel fiil', a: [{ tr: 'ilgilenmek, başa çıkmak', ex: 'We deal with it.', exTr: 'Onunla ilgileniriz.' }] },
  { f: 'as well', y: 'sabit ifade', a: [{ tr: 'de, dahi', ex: 'It helps them cope as well.', exTr: 'Onlara da yardım eder.' }] }
];
const o = A.obekler(obekler, sade('cope'));
assert.deepEqual(o.map(x => [x.o.f, x.p]), [['cope with', 1], ['as well', 4]], 'Başlık 1, örnek cümle 4 puan');
assert.deepEqual(A.obekler(obekler, sade('basa cikmak')).map(x => x.o.f), ['cope with', 'deal with'], 'Anlamda arama');

assert.equal(A.vurgula('<b>evidence</b>', 'evid'), '&lt;b&gt;<mark>evid</mark>ence&lt;/b&gt;', 'Vurgu HTML kaçırır');
assert.equal(A.vurgula('Kanıt', sade('kanit')), '<mark>Kanıt</mark>', 'Türkçe harf vurgusu özgün metni korur');
assert.match(A.kesit('a'.repeat(200) + 'hedef' + 'b'.repeat(200), 'hedef', 10), /^…a{10}<mark>hedef<\/mark>b{10}…$/);

// Gerçek dizinde temel bir arama.
const dizinBaglam = vm.createContext({ window: {} });
vm.runInContext(oku('data/kelime-dizin.js'), dizinBaglam);
const gercek = A.kelimeler(dizinBaglam.window.KELIME_DIZIN, sade('evidence'));
assert.equal(gercek[0].e, 'evidence', 'Gerçek dizinde tam başlık ilk sırada');

// Hızlandırılmış eşleştirme, ara.js'teki eski algoritmayla birebir aynı sırayı verir.
const eskiKelimeler = (dizin, q) => dizin.filter(d => A.eslesir(d.e + ' ' + d.t + ' ' + d.y, q))
  .sort((a, b) => A.eslesmePuani(a.e, a.t, a.y, q) - A.eslesmePuani(b.e, b.t, b.y, q));
const eskiObekler = (liste, q) => liste.map(o => ({
  o, p: A.eslesmePuani(o.f, o.y + ' ' + o.a.map(a => a.tr).join(' '), o.a.map(a => a.ex + ' ' + a.exTr).join(' '), q)
})).filter(x => x.p < 9).sort((a, b) => a.p - b.p);
vm.runInContext(oku('data/obekler.js'), dizinBaglam);
const D = dizinBaglam.window.KELIME_DIZIN, O = dizinBaglam.window.OBEKLER;
for (const ham of ['an', 'ma', 'in', 'evid', 'kanıt', 'cope', 'başa', 'take', 'used to', 'zz']) {
  const q = sade(ham);
  // JSON metni üzerinden karşılaştır: veri dizileri ayrı bir vm bağlamında kurulu.
  assert.equal(JSON.stringify(A.kelimeler(D, q).map(d => d.e)), JSON.stringify(eskiKelimeler(D, q).map(d => d.e)),
    'Kelime sırası aynı: ' + ham);
  assert.equal(JSON.stringify(A.obekler(O, q).map(x => x.o.f + ':' + x.p)), JSON.stringify(eskiObekler(O, q).map(x => x.o.f + ':' + x.p)),
    'Öbek sırası aynı: ' + ham);
}
// Önbellek aynı diziyle tekrar aramada yeniden kullanılır ve sonuç değişmez.
assert.deepEqual(A.kelimeler(D, sade('an')).length, eskiKelimeler(D, sade('an')).length);

// Arama sayfası kuralı kopyalamaz, ortak modülü kullanır.
const ara = oku('assets/js/ara.js');
assert.doesNotMatch(ara, /function eslesmePuani|function vurgula|function kesit|function eslesir/,
  'ara.js eşleştirme kuralını yeniden tanımlamamalı');
assert.match(ara, /Ortak\.kelimeler\(Veri\.dizin, q\)/);
assert.match(ara, /Ortak\.obekler\(window\.OBEKLER, q\)/);
const araHtml = oku('ara.html');
const ortakYer = araHtml.search(/assets\/js\/arama-ortak\.js"/);
const araYer = araHtml.search(/assets\/js\/ara\.js"/);
assert.ok(ortakYer > 0 && ortakYer < araYer, 'ara.html ortak modülü ara.js öncesinde yükler');

console.log('Ortak arama: sıralama, Türkçe eşleşme, öbek puanı, güvenli vurgu ve arama sayfası bağlantısı geçti.');
