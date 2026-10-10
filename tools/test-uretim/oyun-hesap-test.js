'use strict';
/* Oyunlar — saf oyun mantığı (assets/js/oyun-hesap.js): oynanabilir kelimeler, seviye
   tablosu, açık harf seçimi (gerçek dizinin tamamında), tur durum makinesi, yazım
   çeşitleri, anlam maskesi, soru sırası ve gerçek Ilerleme ile aynı gün dışlaması.

   İçerik düzenlemeleri bu testi kırmamalı: kurallar elle yazılmış metinlerle sınanır,
   gerçek veri yalnız değişmezler (hiçbir kartta cevap açıkta kalmaz, her kartta ipucu
   kalır) ve README'de adı geçen örnekler için kullanılır. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const esit = (a, b, mesaj) => assert.equal(JSON.stringify(a), JSON.stringify(b), mesaj);

const kok = path.resolve(__dirname, '..', '..');
const oku = f => fs.readFileSync(path.join(kok, f), 'utf8');
const MODUL = 'assets/js/oyun-hesap.js';
const KAYNAK = oku(MODUL);

/* ---------- 0) Kaynak: saf, ES5 biçemi, LF ---------- */
assert.ok(!KAYNAK.includes('\r') && KAYNAK.charCodeAt(0) !== 0xFEFF, 'LF satır sonu, BOM yok');
// Birleşen işaret ve sıfır genişlikli karakter kaynakta düz yazılmaz (görünmez); kaçış dizisi kullanılır.
const gorunmez = k => (k >= 0x300 && k <= 0x36F) || (k >= 0x200B && k <= 0x200F) || k === 0xFEFF || (k < 0x20 && k !== 10);
assert.ok(![...KAYNAK].some(c => gorunmez(c.codePointAt(0))), 'kaynakta görünmez karakter yok');
const kod = KAYNAK.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
for (const yasak of [/\b(?:document|localStorage|sessionStorage|navigator|Date|fetch|setTimeout|setInterval|require)\b/, /Math\.random/, /=>/, /`/, /\b(?:let|const|class)\s/, /\.\.\./]) {
  assert.ok(!yasak.test(kod), 'saf ve ES5 biçeminde olmalı: ' + yasak);
}
esit(kod.match(/window\.\w+/g), ['window.YDS', 'window.YDS'], 'window üzerinde yalnız YDS');

// Saat ve rastgelelik zehirli, DOM ve depolama tanımsız bir bağlamda yüklenir.
function yukle() {
  const pencere = { YDS: { Onceki: 1 } };
  const baglam = vm.createContext({ window: pencere });
  vm.runInContext('Date = function () { throw new Error("saat yasak"); }; Math.random = function () { throw new Error("rastgelelik yasak"); };', baglam);
  vm.runInContext(KAYNAK, baglam, { filename: MODUL });
  assert.equal(pencere.YDS.Onceki, 1, 'var olan YDS nesnesi korunur');
  return pencere.YDS.OyunHesap;
}
const O = yukle();
for (const ad of ['sade', 'temizle', 'oynanabilir', 'yazimCesidi', 'iliski', 'kutuDuzelt', 'yuzde', 'seviyeNo', 'harfSayisi', 'acikSayisi', 'acikKonumlar',
  'turBaslat', 'bosSayisi', 'hucreGorunumu', 'dene', 'harfAc', 'birak', 'sonKutu', 'maskele', 'ipucuKalir', 'tarif', 'sira', 'sayilar']) {
  assert.equal(typeof O[ad], 'function', 'dışa açık işlev: ' + ad);
}
esit(O.YUZDELER, [50, 40, 30, 20, 10, 0]);
assert.equal(O.DENEME_HAKKI, 3);

/* ---------- gerçek veri ---------- */
const veri = {};
const veriBaglami = vm.createContext({ window: veri });
for (const f of ['data/kelime-dizin.js'].concat([1, 2, 3, 4, 5, 6, 7].map(k => 'data/kelime-k' + k + '.js'))) {
  vm.runInContext(oku(f), veriBaglami, { filename: f });
}
const DIZIN = veri.KELIME_DIZIN;
const dz = e => { const d = DIZIN.find(x => x.e === e); assert.ok(d, e + ' dizinde yok; örneği güncelle'); return d; };
const anlamlar = e => veri['KELIME_K' + dz(e).k][e].a.map(a => a.tr);
const G = 20735;   // 2026-10-10'un gün numarası

/* ---------- 1) sade / temizle ---------- */
assert.equal(O.sade('İIıi\u0307'), 'iiii', 'İ, I, ı ve i + birleşen nokta tek i olur');
assert.equal(O.sade('BLİGHT'), 'blight');
assert.equal(O.sade('I\u0307x'), 'ix', 'ayrışık İ');
assert.equal(O.sade('Well-Being 3/4'), 'well-being 3/4', 'sade yalnız harf büyüklüğünü değiştirir');
assert.equal(O.sade('ŞĞÜ'), 'şğü');
esit([O.sade(null), O.sade(undefined), O.sade(42), typeof O.sade(null)], ['', '', '42', 'string']);
assert.equal(O.temizle('İ I ı i\u0307', 9), 'iiii');
assert.equal(O.temizle('g/ -t9', 3), 'gt', 'eğik çizgi, boşluk, tire ve rakam atılır');
assert.equal(O.temizle('BLİGHT!!', 6), 'blight');
assert.equal(O.temizle('şağıöüç', 9), 'ai', 'Türkçe harf a-z sayılmaz (ı hariç: i olur)');
assert.equal(O.temizle('abcdef', 3), 'abc', 'azami uzunluğa kırpılır');
assert.equal(O.temizle('ab', 5), 'ab');
assert.equal(O.temizle('a b c'), 'abc', 'azami verilmezse kırpılmaz');
esit([O.temizle('abc', 0), O.temizle('abc', -2), O.temizle('abc', 2.9), O.temizle('abc', NaN), O.temizle(null, 3)], ['', '', 'ab', 'abc', '']);

/* ---------- 2) oynanabilir: yazılabilir biçim + maskeden sonra ipucu ---------- */
const yalnizHarf = p => p.length > 0 && [...p].every(c => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'));
// Biçim kuralı modülden bağımsız hesaplanır; ipucu kuralı aşağıda ayrıca sınanır.
const bicimUygun = d => d.e.split(/[- ]/).every(yalnizHarf) && !d.y.includes('modal yapı');
const BICIM = DIZIN.filter(bicimUygun);
const OYNANAN = DIZIN.filter(d => O.oynanabilir(d));
const IPUCSUZ = BICIM.filter(d => !O.oynanabilir(d));
assert.ok(OYNANAN.every(bicimUygun), 'oynanabilir her başlık yazılabilir biçimdedir');
esit(OYNANAN.map(d => d.e), BICIM.filter(d => O.ipucuKalir(d.t, d.e)).map(d => d.e), 'oynanabilir = biçim uygun ve ipucu kalıyor');
assert.ok(DIZIN.filter(d => d.y.includes('modal yapı')).length > 50 && DIZIN.every(d => !d.y.includes('modal yapı') || !O.oynanabilir(d)), 'bütün modal yapılar dışarıda');
// Biçimi tutmayanlar: modal yapılar dışında yalnız kesme işaretli başlıklar olmalı.
for (const d of DIZIN.filter(d => !bicimUygun(d) && !d.y.includes('modal yapı'))) {
  assert.ok(/'/.test(d.e), d.e + ': modal yapı da değil, kesme işaretli de değil ama yazılabilir biçimde sayılmadı; ' +
    'oynanabilir kuralını (assets/js/oyun-hesap.js) bu başlığa göre gözden geçir');
}
// Türkçesi aynı yazılan kelimeler ipuçsuz kalır ve oyun dışıdır; sayıları az olmalı.
assert.ok(IPUCSUZ.length >= 5 && IPUCSUZ.length <= DIZIN.length / 100,
  'ipucu kalmadığı için oyun dışı kalan başlık sayısı beklenen aralıkta değil: ' + IPUCSUZ.length + ' (' + IPUCSUZ.slice(0, 40).map(d => d.e).join(', ') + ')');
// Karar dizindeki kısa anlamla verilir (katman dosyası inmeden); kartın tam anlamlarıyla aynı sonucu vermeli.
for (const d of BICIM) {
  const kart = veri['KELIME_K' + d.k][d.e].a.map(a => a.tr);
  assert.equal(O.ipucuKalir(d.t, d.e), kart.some(m => O.ipucuKalir(m, d.e)),
    d.e + ': dizindeki kısa anlam ile kart anlamları ipucu konusunda ayrışıyor (kısa anlam ' + JSON.stringify(d.t) + ', kart ' +
    JSON.stringify(kart) + '). Kart oyunda ipuçsuz kalır ya da boşuna dışlanır: dizini yeniden üret ya da ipucuKalir kuralını gözden geçir.');
}
for (const e of ['blight', 'go', 'well-being', 'first-come-first-served', 'hand down', 'for years to come', 'Celsius', 'analyse']) {
  assert.equal(O.oynanabilir(dz(e)), true, e + ' oynanabilir');
}
for (const e of ['may/might/could have + V3', "don't-know", "light-o'-love", 'fail/failed to', 'be able to', 'used to', 'had to']) {
  assert.equal(O.oynanabilir(dz(e)), false, e + ' oyun dışı');
}
const yapay = (e, t, y) => O.oynanabilir({ e, t, y: y === undefined ? 'isim' : y });
esit([yapay('ab cd-ef', 'anlam'), yapay('abc', 'anlam'), yapay('a--b', 'anlam'), yapay('-ab', 'anlam'), yapay('ab-', 'anlam'), yapay('a  b', 'anlam'),
  yapay('ıslak', 'anlam'), yapay('İzmir', 'anlam'), yapay('naïve', 'anlam'), yapay('v3', 'anlam'), yapay('', 'anlam'), yapay('abc', 'anlam', 'isim, modal yapı'),
  yapay(7, 'anlam'), O.oynanabilir(null), O.oynanabilir(undefined)],
  [true, true, false, false, false, false, false, false, false, false, false, false, false, false, false], 'yapay başlıklar');
// İpucu: anlamı kendisiyle aynı yazılan kelime oyun dışı; kısa da olsa Türkçe karşılık ipucudur.
esit([yapay('protein', 'protein'), yapay('park', 'park; park etmek'), yapay('bomb', 'bomba; bombalamak'), yapay('kilo', 'kilo, kilogram'),
  yapay('liter', 'litre'), yapay('abc', ''), yapay('abc', undefined), yapay('abc', null)],
  [false, false, false, false, false, false, false, false], 'ipucu kalmayan başlık oynanmaz');
esit([yapay('three', 'üç'), yapay('meat', 'et'), yapay('ten', 'on'), yapay('nor', 'ne de, ve ne'), yapay('blog', 'blog; blog yazmak'),
  yapay('problem', 'sorun, problem'), yapay('system', 'sistem, düzen'), yapay('stress', 'stres')],
  [true, true, true, true, true, true, true, true], 'kısa Türkçe karşılık ve yakın yazılı karşılık ipucudur');
esit([O.ipucuKalir('i. protein', 'protein'), O.ipucuKalir('s./i. feminist', 'feminist'), O.ipucuKalir('f. park etmek', 'park'),
  O.ipucuKalir('f. protesto etmek', 'protest'), O.ipucuKalir('f. bombalamak', 'bomb'), O.ipucuKalir('i. kilo, kilogram', 'kilo')],
  [false, false, false, false, false, false], 'tür kısaltması, maskeye bitişik ek ve yardımcı fiil ipucu değildir');
esit([O.ipucuKalir('i. sorun, problem', 'problem'), O.ipucuKalir('s./i. üç', 'three'), O.ipucuKalir('i. et', 'meat'),
  O.ipucuKalir('f. yazmak', 'write'), O.ipucuKalir('s. yüksek riskli', 'high-risk'), O.ipucuKalir('f. olmak', 'be')],
  [true, true, true, true, true, false]);
esit([O.ipucuKalir('', 'x'), O.ipucuKalir(null, 'x'), O.ipucuKalir('anlam', ''), O.ipucuKalir('anlam', null)], [false, false, true, true]);

/* ---------- 3) seviye tablosu ---------- */
const TABLO = {
  2: [1, 1, 1, 0, 0, 0], 3: [2, 1, 1, 1, 0, 0], 4: [2, 2, 1, 1, 0, 0], 5: [3, 2, 2, 1, 1, 0],
  6: [3, 2, 2, 1, 1, 0], 7: [4, 3, 2, 1, 1, 0], 8: [4, 3, 2, 2, 1, 0], 9: [5, 4, 3, 2, 1, 0],
  10: [5, 4, 3, 2, 1, 0], 11: [6, 4, 3, 2, 1, 0], 12: [6, 5, 4, 2, 1, 0]
};
for (const n of Object.keys(TABLO)) {
  esit([0, 1, 2, 3, 4, 5].map(k => O.acikSayisi(Number(n), k)), TABLO[n], n + ' harfli kelimede açık harf sayıları');
}
esit([0, 1, 2, 3, 4, 5].map(k => O.acikSayisi(1, k)), [0, 0, 0, 0, 0, 0], 'tek harfli kelimede harf açılmaz: en az bir harf yazılır');
esit([0, 1, 2, 3, 4, 5].map(k => O.acikSayisi(0, k)), [0, 0, 0, 0, 0, 0]);
esit([O.acikSayisi(20, 0), O.acikSayisi(20, 4), O.acikSayisi(17, 1), O.acikSayisi(-3, 0), O.acikSayisi(NaN, 0)], [10, 2, 7, 0, 0]);
const BOZUK_KUTULAR = [-1, 0, 0.9, 1, 2.7, 4.999, 5, 6, 99, Infinity, -Infinity, NaN, undefined, null, '3', {}, true];
esit(BOZUK_KUTULAR.map(k => O.kutuDuzelt(k)), [0, 0, 0, 1, 2, 4, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0], 'kutu 0..5 tam sayıya kırpılır');
esit([0, 1, 2, 3, 4, 5, -4, 9, NaN].map(k => O.yuzde(k)), [50, 40, 30, 20, 10, 0, 50, 0, 50]);
esit([0, 1, 2, 3, 4, 5, -4, 9, NaN].map(k => O.seviyeNo(k)), [1, 2, 3, 4, 5, 6, 1, 6, 1]);
esit([O.acikSayisi(6, -1), O.acikSayisi(6, 9), O.acikSayisi(6, 2.7), O.acikSayisi(6, NaN)], [3, 0, 2, 3], 'bozuk kutu kırpılarak kullanılır');
esit([0, 1, 2, 3, 4, 5].map(k => O.sonKutu(k, 'dogru')), [1, 2, 3, 4, 5, 5]);
esit([0, 1, 2, 3, 4, 5].map(k => O.sonKutu(k, 'ipucuyla')), [1, 1, 2, 3, 4, 5]);
esit([0, 1, 2, 3, 4, 5].map(k => O.sonKutu(k, 'yanlis')), [1, 1, 1, 2, 3, 4]);
esit([O.sonKutu(9, 'yanlis'), O.sonKutu(NaN, 'dogru'), O.sonKutu(3, 'baska')], [4, 1, 3]);
esit(['blight', 'well-being', 'hand down', 'Celsius', 'first-come-first-served', 'aıİşb3', '', null].map(e => O.harfSayisi(e)), [6, 9, 8, 7, 20, 2, 0, 0],
  'harf yalnız a-z (büyük ya da küçük); tire, boşluk, rakam ve Türkçe harf sayılmaz');

/* ---------- 4) açık harfler: oynanabilir HER başlık × altı kutu ---------- */
const harfKonumlari = e => [...e].map((c, i) => /[a-zA-Z]/.test(c) ? i : -1).filter(i => i >= 0);
const beklenenAdet = (n, k) => Math.min(n - 1, Math.round(n * [50, 40, 30, 20, 10, 0][k] / 100));
const bosHarfler = t => t.hucreler.filter(h => h.tur === 'bos').map(h => h.c.toLowerCase()).join('');
const baskaHarf = c => c === 'q' ? 'x' : 'q';
let denenenTur = 0;
for (const d of OYNANAN) {
  const harfler = harfKonumlari(d.e), n = harfler.length;
  assert.equal(O.harfSayisi(d.e), n, d.e);
  for (let k = 0; k <= 5; k++) {
    const acik = O.acikKonumlar(d.e, k, G);
    const etiket = d.e + ' / kutu ' + k;
    assert.equal(acik.length, O.acikSayisi(n, k), etiket + ': adet acikSayisi ile aynı');
    assert.equal(acik.length, beklenenAdet(n, k), etiket + ': adet bağımsız formülle aynı');
    assert.ok(acik.length < n, etiket + ': en az bir boşluk kalır');
    acik.forEach((konum, i) => {
      assert.ok(harfler.includes(konum), etiket + ': açık konum harf üzerinde');
      assert.ok(i === 0 || acik[i - 1] < konum, etiket + ': artan ve yinelenmesiz');
    });
    esit(O.acikKonumlar(d.e, k, G), acik, etiket + ': aynı gün aynı harfler');

    // Tur hücreleri bu konumlarla kurulur; doğru harflerle ilk denemede biter.
    const t = O.turBaslat(d.e, k, G);
    esit(t.hucreler.map(h => h.c).join(''), d.e, etiket + ': hücreler başlığın kendi karakterleri');
    esit(t.hucreler.map((h, i) => h.tur === 'acik' ? i : -1).filter(i => i >= 0), acik, etiket + ': açık hücreler');
    esit(t.hucreler.map((h, i) => h.tur === 'ayrac' ? i : -1).filter(i => i >= 0),
      [...d.e].map((c, i) => harfler.includes(i) ? -1 : i).filter(i => i >= 0), etiket + ': ayraç hücreleri');
    assert.equal(O.bosSayisi(t), n - acik.length, etiket);
    const liste = O.tarif(t).split(': ')[1].split('. ')[0].split(', ');
    assert.equal(liste.length, d.e.length, etiket + ': tarif her karakteri sayar');
    assert.equal(liste.filter(x => x === 'boş').length, n - acik.length, etiket + ': tarif boşlukların harfini vermez');
    const dogru = bosHarfler(t);
    if (k === 0 || k === 5) {
      // Yanlış ilk harf: yalnız o boşluk kalır, tek boşlukta harf açılmaz, sonra ipucuyla biter.
      const y = O.turBaslat(d.e, k, G);
      assert.equal(O.dene(y, baskaHarf(dogru[0]) + dogru.slice(1)).durum, 'yanlis', etiket);
      esit([O.bosSayisi(y), y.deneme, O.harfAc(y, ''), y.ipucu], [1, 1, null, false], etiket + ': doğru harfler kilitlenir');
      esit([O.dene(y, dogru[0]).durum, y.bitti], ['dogru', 'ipucuyla'], etiket);
    }
    esit(O.dene(t, dogru), { durum: 'dogru', kalan: 3, yazilan: '', aday: d.e.toLowerCase() }, etiket + ': doğru harfler');
    esit([t.bitti, O.bosSayisi(t), O.hucreGorunumu(t, '').map(h => h.c).join('')], ['dogru', 0, d.e], etiket);
    denenenTur++;
  }
}
// Sabitlenmiş örnekler: algoritma değişirse aynı gün içinde açık harfler de değişir; bilerek yapılmalı.
esit([O.acikKonumlar('blight', 0, G), O.acikKonumlar('environment', 2, G), O.acikKonumlar('well-being', 0, 1)],
  [[0, 2, 5], [6, 7, 9], [1, 3, 6, 7, 9]], 'sabitlenmiş açık harf konumları');
esit(O.acikKonumlar('blight', 9, G), [], 'kırpılmış kutu 5: harf yok');
esit(O.acikKonumlar('blight', -2, G), O.acikKonumlar('blight', 0, G));
esit([O.acikKonumlar('a', 0, G), O.acikKonumlar('', 0, G), O.acikKonumlar('-', 0, G)], [[], [], []]);
// Gün değişince seçim de değişir (uzun kelimelerde neredeyse her zaman).
const uzunlar = OYNANAN.filter(d => O.harfSayisi(d.e) >= 8);
const gunFarki = uzunlar.filter(d => JSON.stringify(O.acikKonumlar(d.e, 0, G)) !== JSON.stringify(O.acikKonumlar(d.e, 0, G + 1))).length;
assert.ok(uzunlar.length > 3000 && gunFarki / uzunlar.length > 0.95, 'ertesi gün başka harfler açılır: ' + gunFarki + '/' + uzunlar.length);
// Kutu da tohuma girer: 5. seviyede açılan tek harf, 1. seviyede açılanların alt kümesi olmak zorunda değildir.
const altKume = uzunlar.filter(d => { const ilk = O.acikKonumlar(d.e, 0, G); return O.acikKonumlar(d.e, 4, G).every(i => ilk.includes(i)); }).length;
assert.ok(altKume / uzunlar.length > 0.3 && altKume / uzunlar.length < 0.7, 'seviyeler ayrı ayrı çekilir: ' + altKume + '/' + uzunlar.length);
// Seçim yansız: altı harfli kelimelerde her konum yaklaşık yarı yarıya açılır.
const altilar = OYNANAN.filter(d => /^[a-z]{6}$/.test(d.e)), konumSayaci = [0, 0, 0, 0, 0, 0];
altilar.forEach(d => O.acikKonumlar(d.e, 0, G).forEach(i => { konumSayaci[i]++; }));
konumSayaci.forEach((s, i) => assert.ok(altilar.length > 1000 && s / altilar.length > 0.4 && s / altilar.length < 0.6,
  'altı harflilerde ' + i + '. konum oranı ' + (s / altilar.length).toFixed(3)));

/* ---------- 5) tur durum makinesi (elle kurulan desenlerle) ---------- */
// desen: '_' yazılacak harf, başka her şey açık harf ya da ayraç.
function tur(kelime, desen, kutu) {
  assert.equal(desen.length, kelime.length);
  return {
    kelime, kutu: kutu || 0, gun: G,
    hucreler: [...kelime].map((c, i) => ({ c, tur: /[a-z]/i.test(c) ? (desen[i] === '_' ? 'bos' : 'acik') : 'ayrac' })),
    deneme: 0, ipucu: false, bitti: null, yazim: null
  };
}
const gorunum = (t, y) => O.hucreGorunumu(t, y).map(h => h.c || '_').join('');
const isaret = (t, y, alan) => O.hucreGorunumu(t, y).map((h, i) => h[alan] ? i : -1).filter(i => i >= 0);
const durum = t => [t.bitti, t.deneme, t.ipucu, t.yazim, O.bosSayisi(t)];
// Elle kurulan tur, turBaslat'ın ürettiği biçimin aynısıdır.
const gercek = O.turBaslat('blight', 0, G);
esit(gercek, tur('blight', gercek.hucreler.map(h => h.tur === 'bos' ? '_' : h.c).join('')), 'tur nesnesinin alanları');
esit(O.turBaslat('blight', 7.5, G).kutu, 5, 'tur kutusu kırpılır');

// Görünüm: yazılan harfler boşluklara sırayla oturur; sıradaki boşluk işaretlidir.
let t = tur('blight', 'b_i_h_');
esit([gorunum(t, ''), gorunum(t, 'l'), gorunum(t, 'lg'), gorunum(t, 'lgt'), gorunum(t, 'LĞ-g t99zz')], ['b_i_h_', 'bli_h_', 'bligh_', 'blight', 'blight']);
esit([isaret(t, '', 'simdi'), isaret(t, 'l', 'simdi'), isaret(t, 'lg', 'simdi'), isaret(t, 'lgt', 'simdi')], [[1], [3], [5], []]);
esit(O.hucreGorunumu(t, 'x')[0], { c: 'b', tur: 'acik', bulundu: false, ipucu: false, simdi: false });
esit(O.hucreGorunumu(t, 'x')[1], { c: 'x', tur: 'bos', bulundu: false, ipucu: false, simdi: false });
esit(O.hucreGorunumu(t, 'x')[3], { c: '', tur: 'bos', bulundu: false, ipucu: false, simdi: true });

// İlk denemede doğru.
esit(O.dene(t, 'lgt'), { durum: 'dogru', kalan: 3, yazilan: '', aday: 'blight' });
esit(durum(t), ['dogru', 0, false, null, 0]);
esit([gorunum(t, ''), isaret(t, '', 'bulundu'), isaret(t, '', 'simdi')], ['blight', [1, 3, 5], []]);

// Eksik harf: deneme harcanmaz, hiçbir şey değişmez; fazlası kırpılır.
t = tur('blight', 'b_i_h_');
let once = JSON.stringify(t);
esit(O.dene(t, 'lg'), { durum: 'eksik', kalan: 3, yazilan: 'lg', aday: '' });
esit(O.dene(t, ' L-g! '), { durum: 'eksik', kalan: 3, yazilan: 'lg', aday: '' });
esit(O.dene(t, ''), { durum: 'eksik', kalan: 3, yazilan: '', aday: '' });
assert.equal(JSON.stringify(t), once, 'eksik denemede tur değişmez');
esit(O.dene(t, 'LGTZZZ'), { durum: 'dogru', kalan: 3, yazilan: '', aday: 'blight' }, 'fazla harf boşluk sayısına kırpılır');
assert.equal(t.bitti, 'dogru', 'eksik denemeler ilk deneme hakkını yemez');

// Yanlış, sonra doğru: doğru harfler kilitlenir, yanlışlar silinir, sonuç ipucuyla.
t = tur('blight', 'b_i_h_');
esit(O.dene(t, 'lxt'), { durum: 'yanlis', kalan: 2, yazilan: '', aday: 'blixht' });
esit(durum(t), [null, 1, false, null, 1]);
esit(t.hucreler.map(h => h.tur + (h.bulundu ? '+' : '')), ['acik', 'acik+', 'acik', 'bos', 'acik', 'acik+']);
esit([gorunum(t, ''), isaret(t, '', 'bulundu'), isaret(t, '', 'simdi'), gorunum(t, 'q')], ['bli_ht', [1, 5], [3], 'bliqht']);
esit(O.dene(t, 'g'), { durum: 'dogru', kalan: 2, yazilan: '', aday: 'blight' });
esit(durum(t), ['ipucuyla', 1, false, null, 0]);

// Üç yanlış: kelime açılır; son denemede tutan harf yine bulunmuş sayılır.
t = tur('blight', 'b_i_h_');
esit(O.dene(t, 'xxx'), { durum: 'yanlis', kalan: 2, yazilan: '', aday: 'bxixhx' });
esit(O.dene(t, 'qqq'), { durum: 'yanlis', kalan: 1, yazilan: '', aday: 'bqiqhq' });
esit(durum(t), [null, 2, false, null, 3]);
esit(O.dene(t, 'lxx'), { durum: 'bitti', kalan: 0, yazilan: '', aday: 'blixhx' });
esit(durum(t), ['yanlis', 3, false, null, 2]);
esit([gorunum(t, ''), gorunum(t, 'zz'), isaret(t, '', 'bulundu'), isaret(t, '', 'simdi')], ['blight', 'blight', [1], []], 'biten turda her hücre kendi harfini gösterir');
esit(O.hucreGorunumu(t, '').map(h => h.tur), ['acik', 'acik', 'acik', 'bos', 'acik', 'bos'], 'bulunamayan harfler bos kalır');
// Biten tur etkisizdir.
once = JSON.stringify(t);
esit(O.dene(t, 'gt'), { durum: 'bitti', kalan: 0, yazilan: '', aday: '' });
esit([O.harfAc(t, ''), O.birak(t)], [null, 'yanlis']);
assert.equal(JSON.stringify(t), once, 'biten tur değişmez');
t = tur('blight', 'b_i_h_');
O.dene(t, 'lgt');
once = JSON.stringify(t);
esit([O.dene(t, 'xxx').durum, O.harfAc(t, 'x'), O.birak(t), O.dene(t, 'xxx', () => true).durum], ['bitti', null, 'dogru', 'bitti']);
assert.equal(JSON.stringify(t), once, 'doğru biten tur sonradan yanlışa dönmez');

// Bir harf aç.
const ac = (y, desen) => { const x = tur('blight', desen || 'b_i_h_'); return [O.harfAc(x, y), x]; };
let [s, x] = ac('');
esit(s, { yazilan: '', konum: 1 }, 'hiç yazılmadıysa ilk boşluk açılır');
esit(durum(x), [null, 0, true, null, 2]);
esit(x.hucreler[1], { c: 'l', tur: 'acik', ipucu: true });
esit([gorunum(x, ''), isaret(x, '', 'ipucu'), isaret(x, '', 'bulundu'), isaret(x, '', 'simdi')], ['bli_h_', [1], [], [3]]);
esit(O.dene(x, 'g'), { durum: 'eksik', kalan: 3, yazilan: 'g', aday: '' }, 'harf açmak deneme harcamaz');
esit([O.dene(x, 'gt').durum, x.bitti], ['dogru', 'ipucuyla'], 'ipucundan sonra doğru: ipucuyla');
[s, x] = ac('l');
esit(s, { yazilan: 'l', konum: 3 }, 'doğru yazılanlardan sonraki ilk eksik boşluk');
[s, x] = ac('lxt');
esit(s, { yazilan: 'lt', konum: 3 }, 'yanlış harfin boşluğu açılır, ondan sonra yazılan kalır');
esit([gorunum(x, s.yazilan), O.dene(x, s.yazilan).durum, x.bitti], ['blight', 'dogru', 'ipucuyla']);
[s, x] = ac('xgt');
esit([s, gorunum(x, s.yazilan)], [{ yazilan: 'gt', konum: 1 }, 'blight']);
[s, x] = ac('xg');
esit([s, gorunum(x, s.yazilan)], [{ yazilan: 'g', konum: 1 }, 'bligh_']);
[s, x] = ac('lgx');
esit(s, { yazilan: 'lg', konum: 5 });
[s, x] = ac('lgt');
esit([s, x.ipucu, O.dene(x, s.yazilan).durum, x.bitti], [{ yazilan: 'gt', konum: 1 }, true, 'dogru', 'ipucuyla'], 'hepsi doğru yazılmışken istenirse ilk boşluk açılır ve ipucu sayılır');
[s, x] = ac('XĞ-gtzzz');
esit(s, { yazilan: 'gt', konum: 1 }, 'girdi temizlenip kırpılır');
[s, x] = ac('', 'bli_ht');
esit([s, x.ipucu, JSON.stringify(x) === JSON.stringify(tur('blight', 'bli_ht'))], [null, false, true], 'tek boşluk kaldıysa harf açılmaz');
x = tur('blight', 'b_i_h_');
esit([O.harfAc(x, ''), O.harfAc(x, ''), O.harfAc(x, ''), O.bosSayisi(x)], [{ yazilan: '', konum: 1 }, { yazilan: '', konum: 3 }, null, 1]);
esit(O.dene(x, 'q'), { durum: 'yanlis', kalan: 2, yazilan: '', aday: 'blighq' }, 'ipucundan sonra yanlış deneme sayılır');
esit([O.dene(x, 'q').durum, O.dene(x, 'q').durum, x.bitti], ['yanlis', 'bitti', 'yanlis']);
// Yanlış denemeden sonra harf açma: kilitlenenler boşluk sayılmaz.
x = tur('counter', '_______', 5);
esit([O.dene(x, 'cxuxtxr').durum, gorunum(x, ''), O.harfAc(x, 'on'), gorunum(x, 'on')], ['yanlis', 'c_u_t_r', { yazilan: 'on', konum: 5 }, 'counter']);

// Bilemedim.
t = tur('blight', 'b_i_h_');
esit([O.birak(t), durum(t), gorunum(t, 'l'), isaret(t, '', 'simdi')], ['yanlis', ['yanlis', 0, false, null, 3], 'blight', []]);

// Büyük harfli başlık: karşılaştırma harf büyüklüğüne bakmaz, hücre başlığın kendi harfini gösterir.
t = tur('Celsius', '_______', 5);
esit([O.dene(t, 'CELSİUS'), gorunum(t, ''), t.bitti], [{ durum: 'dogru', kalan: 3, yazilan: '', aday: 'celsius' }, 'Celsius', 'dogru']);
t = tur('Celsius', '_el_ius');
esit([gorunum(t, ''), gorunum(t, 'cx'), O.dene(t, 'CX').durum, gorunum(t, ''), isaret(t, '', 'bulundu')], ['_el_ius', 'celxius', 'yanlis', 'Cel_ius', [0]]);
esit([O.harfAc(tur('Celsius', '_el_ius'), 'C'), O.harfAc(tur('Celsius', '_el_ius'), 'ı')], [{ yazilan: 'c', konum: 3 }, { yazilan: '', konum: 0 }]);

// Tire ve boşluk: sabit ayraç; yazılmaz, yazılırsa atılır.
t = tur('well-being', '____-_____', 5);
esit([gorunum(t, ''), gorunum(t, 'well'), isaret(t, 'well', 'simdi'), O.bosSayisi(t)], ['____-_____', 'well-_____', [5], 9]);
esit(O.hucreGorunumu(t, '')[4], { c: '-', tur: 'ayrac', bulundu: false, ipucu: false, simdi: false });
esit(O.dene(t, 'well-bein'), { durum: 'eksik', kalan: 3, yazilan: 'wellbein', aday: '' });
esit(O.dene(t, 'well-being'), { durum: 'dogru', kalan: 3, yazilan: '', aday: 'well-being' });
t = tur('hand down', 'h_nd _ow_');
esit([gorunum(t, 'a'), O.harfAc(t, 'ax'), gorunum(t, 'a')], ['hand _ow_', { yazilan: 'a', konum: 5 }, 'hand dow_']);
esit([O.dene(t, 'A N'), t.bitti], [{ durum: 'dogru', kalan: 3, yazilan: '', aday: 'hand down' }, 'ipucuyla']);

// Kısa kelimeler ve "en az bir harf yazılır".
esit([0, 1, 2, 3, 4, 5].map(k => O.bosSayisi(O.turBaslat('go', k, G))), [1, 1, 1, 2, 2, 2]);
esit([0, 1, 2, 3, 4, 5].map(k => O.bosSayisi(O.turBaslat('can', k, G))), [1, 2, 2, 2, 3, 3]);
esit([0, 5].map(k => O.bosSayisi(O.turBaslat('a', k, G))), [1, 1], 'tek harfli başlıkta harf açılmaz');
esit([O.harfAc(tur('go', 'g_'), ''), O.harfAc(tur('go', '__', 5), ''), O.harfAc(tur('go', '__', 5), 'g')], [null, { yazilan: '', konum: 0 }, { yazilan: 'g', konum: 1 }]);

// Ekran okuyucu cümlesi.
t = tur('blight', 'b_i_h_');
assert.equal(O.tarif(t, ''), '6 harfli İngilizce kelime: b, boş, i, boş, h, boş. 3 eksik harfi sırayla yaz, Enter ile kontrol et.');
assert.equal(O.tarif(t, 'lg'), O.tarif(t, ''), 'yazılan harfler tarife girmez');
O.dene(t, 'lxx');
assert.equal(O.tarif(t), '6 harfli İngilizce kelime: b, l, i, boş, h, boş. 2 eksik harfi sırayla yaz, Enter ile kontrol et.');
O.harfAc(t, '');
assert.equal(O.tarif(t), '6 harfli İngilizce kelime: b, l, i, g, h, boş. 1 eksik harfi yaz, Enter ile kontrol et.');
O.birak(t);
assert.equal(O.tarif(t), '6 harfli İngilizce kelime: b, l, i, g, h, t. Kelime tamamlandı; Enter ile sonraki kelimeye geç.');
assert.equal(O.tarif(tur('well-being', 'w_ll-_e_ng')), '9 harfli İngilizce kelime: w, boş, l, l, tire, boş, e, boş, n, g. 3 eksik harfi sırayla yaz, Enter ile kontrol et.');
assert.equal(O.tarif(tur('hand down', '____ ____', 5)), '8 harfli İngilizce kelime: boş, boş, boş, boş, sözcük arası, boş, boş, boş, boş. 8 eksik harfi sırayla yaz, Enter ile kontrol et.',
  'ayraç "boşluk" diye okunmaz: "boş" ile karışır');

/* ---------- 6) öteki yazım ve aynı anlamlı kelime ---------- */
// Biçim kuralı.
for (const [a, b] of [['analyse', 'analyze'], ['organisation', 'organization'], ['recognise', 'recognize'], ['realise', 'realize'],
  ['centre', 'center'], ['litre', 'liter'], ['kilometre', 'kilometer'], ['theatre', 'theater'],
  ['grey', 'gray'], ['defence', 'defense'], ['artefact', 'artifact'], ['practised', 'practiced'], ['licence', 'license'], ['mom', 'mum']]) {
  esit([O.yazimCesidi(a, b), O.yazimCesidi(b, a), O.yazimCesidi(a.toUpperCase(), b)], [true, true, true], a + ' / ' + b + ' aynı kelimenin iki yazımı');
}
for (const [a, b] of [['analyse', 'analyse'], ['prise', 'prize'], ['raise', 'raize'], ['seal', 'zeal'], ['dose', 'doze'], ['close', 'cloze'],
  ['there', 'three'], ['acre', 'acer'], ['alter', 'later'], ['colour', 'color'], ['judgement', 'judgment'], ['dependant', 'dependent'],
  ['ensure', 'insure'], ['lead', 'head'], ['clear', 'clean'], ['almost', 'nearly'], ['', ''], ['abc', '']]) {
  esit([O.yazimCesidi(a, b), O.yazimCesidi(b, a)], [false, false], a + ' / ' + b + ' yazım çeşidi değil');
}
esit([O.yazimCesidi(null, 'x'), O.yazimCesidi(undefined, undefined), O.yazimCesidi('grey', null)], [false, false, false]);

// İlişki: aday dizinde bir başlık olmalı; biçim tutuyorsa 'yazim', kısa anlam ve tür aynıysa 'es'.
const KUCUK_DIZIN = new Map([
  { e: 'surprise', t: 'şaşırtmak', y: 'fiil' }, { e: 'analyse', t: 'incelemek', y: 'fiil' },
  { e: 'analyze', t: 'incelemek, çözümlemek', y: 'fiil' },       // kısa anlamlar farklı yazılmış: yine de aynı kelime
  { e: 'almost', t: 'neredeyse', y: 'zarf' }, { e: 'nearly', t: 'neredeyse', y: 'zarf' }, { e: 'Barely', t: 'neredeyse', y: 'sıfat' }
].map(d => [O.sade(d.e), d]));
const kucukBul = aday => KUCUK_DIZIN.get(aday) || null;
const kd = e => KUCUK_DIZIN.get(e);
esit([O.iliski('analyze', kd('analyse'), kucukBul), O.iliski('analyse', kd('analyze'), kucukBul)], ['yazim', 'yazim'], 'öteki yazım kısa anlamların aynı yazılmasına bağlı değil');
esit([O.iliski('surprize', kd('surprise'), kucukBul), O.iliski('surprise', kd('surprise'), kucukBul)], [null, null], 'dizinde olmayan yazım ve kartın kendisi ilişki değil');
esit([O.iliski('nearly', kd('almost'), kucukBul), O.iliski('almost', kd('nearly'), kucukBul), O.iliski('barely', kd('almost'), kucukBul)], ['es', 'es', null], 'aynı kısa anlam ve tür: eş anlamlı; tür farklıysa değil');
esit([O.iliski('nearly', kd('almost')), O.iliski('nearly', kd('almost'), null), O.iliski('nearly', null, kucukBul), O.iliski('', kd('almost'), kucukBul)], [null, null, null, null]);

// Gerçek dizin: sayfanın kullandığı yüklemin aynısı.
const GERCEK_DIZIN = new Map(DIZIN.map(d => [O.sade(d.e), d]));
const gercekBul = aday => GERCEK_DIZIN.get(aday) || null;
const bag = e => { const d = dz(e); return aday => O.iliski(aday, d, gercekBul); };
// README'de adı geçen örnekler dizinde durmalı.
assert.ok(dz('almost').t === dz('nearly').t && dz('almost').y === dz('nearly').y,
  'almost / nearly dizinde artık aynı kısa anlam ve türde değil; README ve bu testteki eş anlamlı örneğini başka bir çiftle değiştir');
// İki yazımı da dizinde olan her -ise/-ize ve -re/-er çifti iki yönde kabul edilir.
const ciftler = [];
for (const d of DIZIN) {
  if (!O.oynanabilir(d)) continue;
  const a = O.sade(d.e);
  for (const b of [a.replace(/([iy])s(e[sd]?|ation|ational|ing)$/, '$1z$2'), a.replace(/re$/, 'er')]) {
    const o = b !== a && GERCEK_DIZIN.get(b);
    if (o && O.oynanabilir(o)) ciftler.push([d, o]);
  }
}
assert.ok(ciftler.length >= 5, 'dizinde yazım çifti bulunamadı: ' + ciftler.length);
for (const [d, o] of ciftler) {
  for (const [kart, yazilan] of [[d, o], [o, d]]) {
    const x = O.turBaslat(kart.e, 5, G);
    esit([O.dene(x, yazilan.e, bag(kart.e)).durum, x.bitti, x.yazim], ['dogru', 'dogru', O.sade(yazilan.e)], kart.e + ' kartında ' + yazilan.e + ' yazımı kabul edilir');
  }
}

// Öteki yazım: doğru sayılır, hücreler kartın yazımını gösterir.
t = O.turBaslat('analyse', 5, G);
esit(O.dene(t, 'analyze', bag('analyse')), { durum: 'dogru', kalan: 3, yazilan: '', aday: 'analyze' });
esit([durum(t), gorunum(t, '')], [['dogru', 0, false, 'analyze', 0], 'analyse']);
t = O.turBaslat('analyze', 5, G);
esit([O.dene(t, 'ANALYSE', bag('analyze')).durum, t.bitti, t.yazim, gorunum(t, '')], ['dogru', 'dogru', 'analyse', 'analyze']);
// Yanlış denemeden ya da ipucundan sonra öteki yazım da ipucuyla sayılır.
t = O.turBaslat('analyse', 5, G);
esit([O.dene(t, 'qqqqqqq', bag('analyse')).durum, O.dene(t, 'analyze', bag('analyse')).durum, t.bitti, t.yazim], ['yanlis', 'dogru', 'ipucuyla', 'analyze']);
t = tur('analyse', '_______', 5);
s = O.harfAc(t, '');
esit([s, O.dene(t, 'nalyze', bag('analyse')).durum, t.bitti, t.yazim], [{ yazilan: '', konum: 0 }, 'dogru', 'ipucuyla', 'analyze']);
// Yüklem verilmezse ya da ilişki bulmazsa öteki yazım düz yanlıştır: z dışındaki harfler kilitlenir.
for (const yuklem of [undefined, null, () => false, () => null, () => '', 'analyze']) {
  t = O.turBaslat('analyse', 5, G);
  esit(O.dene(t, 'analyze', yuklem), { durum: 'yanlis', kalan: 2, yazilan: '', aday: 'analyze' }, 'yüklem: ' + yuklem);
  esit([durum(t), gorunum(t, '')], [[null, 1, false, null, 1], 'analy_e']);
}
// Farklı harfi açık gelen kartta öteki yazım kurulamaz; yüklem doğru cevapta ve eksikte çağrılmaz.
let cagri = [];
const sayan = aday => { cagri.push(aday); return 'es'; };
t = tur('analyse', '_____s_');
esit([O.dene(t, 'analy', sayan).durum, O.dene(t, 'analye', sayan).durum, cagri], ['eksik', 'dogru', []]);
// Son iki harfi yer değiştirmiş yazım (litre / liter) ve elle sayılan çift (grey / gray).
t = tur('litre', 'li___');
esit([O.dene(t, 'ter', bag('litre')), t.yazim, t.bitti, gorunum(t, '')], [{ durum: 'dogru', kalan: 3, yazilan: '', aday: 'liter' }, 'liter', 'dogru', 'litre']);
t = tur('grey', 'g__y');
esit([O.dene(t, 'ra', bag('grey')), t.yazim, gorunum(t, '')], [{ durum: 'dogru', kalan: 3, yazilan: '', aday: 'gray' }, 'gray', 'grey']);
// Dizinde olmayan "yazım" kabul edilmez.
t = tur('surprise', '________', 5);
esit([O.dene(t, 'surprize', aday => O.iliski(aday, kd('surprise'), kucukBul)).durum, t.deneme, gorunum(t, '')], ['yanlis', 1, 'surpri_e']);

// Aynı anlamlı başka kelime: hak harcanmaz, hiçbir şey kilitlenmez, girdi yerinde kalır.
t = O.turBaslat('almost', 5, G);
once = JSON.stringify(t);
esit(O.dene(t, 'Nearly', bag('almost')), { durum: 'es', kalan: 3, yazilan: 'nearly', aday: 'nearly' });
esit(O.dene(t, ' NEAR-ly zz', bag('almost')), { durum: 'es', kalan: 3, yazilan: 'nearly', aday: 'nearly' }, 'geri verilen girdi temizlenmiş ve kırpılmıştır');
assert.equal(JSON.stringify(t), once, 'eş anlamlıda tur değişmez');
esit([O.dene(t, 'almost', bag('almost')).durum, t.bitti], ['dogru', 'dogru'], 'eş anlamlı deneme ilk deneme hakkını yemez');
t = O.turBaslat('almost', 5, G);
esit([O.dene(t, 'nearly'), durum(t)], [{ durum: 'yanlis', kalan: 2, yazilan: '', aday: 'nearly' }, [null, 1, false, null, 6]], 'yüklem yokken eş anlamlı düz yanlıştır');
// Açık harflerle kurulan aday yükleme gider; 'yazim' dışındaki her doğru değer eş anlamlı sayılır.
cagri = [];
t = tur('litre', 'li___');
esit([O.dene(t, 'ter', sayan), cagri, durum(t)], [{ durum: 'es', kalan: 3, yazilan: 'ter', aday: 'liter' }, ['liter'], [null, 0, false, null, 3]]);
t = tur('litre', 'li___');
esit([O.dene(t, 'ter', () => true).durum, O.dene(t, 'ter', () => 'baska').durum, O.dene(t, 'ter', () => 'yazim').durum, t.yazim], ['es', 'es', 'dogru', 'liter']);

/* ---------- 7) anlam maskesi ---------- */
const maske = (girdi, e, cikti, mesaj) => assert.equal(O.maskele(girdi, e), cikti, mesaj || e + ': ' + girdi);
// README'deki iki örnek gerçek kartta durmalı; ötekiler kuralın örnekleridir, kart metnine bağlı değildir.
for (const [e, girdi] of [['problem', 'i. sorun, problem'], ['absorb', 'f. emmek, soğurmak, absorbe etmek']]) {
  assert.ok(anlamlar(e).includes(girdi), e + ' kartının anlam metni değişmiş (' + JSON.stringify(anlamlar(e)) +
    '); README\'deki maske örneğini ve bu satırı güncelle');
}
// A: başlığın kendisi.
maske('i. sorun, problem', 'problem', 'i. sorun, •••');
maske('i. risk, tehlike', 'risk', 'i. •••, tehlike');
maske('f. riske atmak', 'risk', 'f. •••e atmak');
maske('f. (lead to) yol açmak, neden olmak; yönetmek, öncülük etmek', 'lead', 'f. (••• to) yol açmak, neden olmak; yönetmek, öncülük etmek');
maske('i. kurşun', 'lead', 'i. kurşun');
maske('f. emmek, soğurmak, absorbe etmek', 'absorb', 'f. emmek, soğurmak, •••e etmek');
maske('f. teşekkür etmek', 'thank', 'f. teşekkür etmek');
maske('s. (due to) nedeniyle', 'due', 's. (••• to) nedeniyle');
maske('s. (a few) birkaç', 'few', 's. (a •••) birkaç');
maske('i. Celsius, santigrat (sıcaklık ölçeği ve birimi)', 'Celsius', 'i. •••, santigrat (sıcaklık ölçeği ve birimi)');
maske('f. (make peace with) barışmak; kabullenmek', 'make peace', 'f. (••• with) barışmak; kabullenmek');
// Başlıktaki tire anlamda boşlukla ya da bitişik yazılmış olabilir.
maske('f. (bring up) gündeme getirmek', 'bring-up', 'f. (•••) gündeme getirmek');
maske('s. çevrimiçi, online', 'on-line', 's. çevrimiçi, •••');
maske('i. rock and roll (müzik türü)', 'rock-and-roll', 'i. ••• (müzik türü)');
maske('i. bitki hastalığı, afet', 'blight', 'i. bitki hastalığı, afet');
// B: çok parçalı başlığın 4+ harfli parçası.
maske('s. risksiz, tehlikesiz', 'risk-free', 's. •••siz, tehlikesiz');
maske('s. yüksek riskli', 'high-risk', 's. yüksek •••li');
maske('f. çift sıra park etmek', 'double-park', 'f. çift sıra ••• etmek');
maske('s. çevrim içi; on numara', 'on-line', 's. çevrim içi; on numara', 'dörtten kısa parça maskelenmez');
maske('i. yürüme mesafesi', 'walking distance', 'i. yürüme mesafesi');
// C: parantez içindeki kök, çekim ya da bileşik.
maske('i. (thanks) teşekkür', 'thank', 'i. (•••) teşekkür');
maske('f. bağlamak; (be tied to) bağlı kılmak', 'tie', 'f. bağlamak; (be ••• to) bağlı kılmak');
maske('i. (çoğul: hostilities) çatışmalar', 'hostility', 'i. (çoğul: •••) çatışmalar');
maske('f. (pave the way/path) yolunu açtı', 'paved', 'f. (••• the way/path) yolunu açtı');
maske('i. usta, yapımcı (genellikle bileşik sözcüklerde: playwright, shipwright)', 'wright', 'i. usta, yapımcı (genellikle bileşik sözcüklerde: •••, •••)');
maske("f. temin etmek (Amerikan İngilizcesi, 'ensure' anlamında)", 'insure', "f. temin etmek (Amerikan İngilizcesi, '•••' anlamında)");
maske('i. kuru ot, saman (hayvan yemi)', 'hay', 'i. kuru ot, saman (hayvan yemi)', 'üç harfli başlık uzun Türkçe sözcüğü maskelemez');
maske('i. huş ağacı (bir ağaç türü)', 'birch', 'i. huş ağacı (bir ağaç türü)', 'parantezdeki kısa Türkçe sözcük maskelenmez');
maske('i. poliçe (sigorta)', 'policy', 'i. poliçe (sigorta)');
maske('i. playwright, oyun yazarı', 'wright', 'i. playwright, oyun yazarı', 'parantez dışında yalnız sözcük başı');
// D: dil bilgisi notunun öznesi, parantez içinde ya da dışında.
maske('f. anlamına gelir, demektir (mean fiilinin üçüncü tekil biçimi)', 'means', 'f. anlamına gelir, demektir (••• fiilinin üçüncü tekil biçimi)');
maske('f. look fiilinin -ing biçimi; bakıyor, bakmakta', 'looking', 'f. ••• fiilinin -ing biçimi; bakıyor, bakmakta');
maske('f. yapmak; yaparak (make fiilinin -ing biçimi)', 'making', 'f. yapmak; yaparak (••• fiilinin -ing biçimi)');
maske('f. kullanmak; kullanarak (use fiilinin -ing biçimi)', 'using', 'f. kullanmak; kullanarak (••• fiilinin -ing biçimi)');
maske('f. yapılmış (do fiilinin V3 biçimi)', 'done', 'f. yapılmış (••• fiilinin V3 biçimi)');
maske('f. olmak (be fiilinin -ing biçimi)', 'being', 'f. olmak (••• fiilinin -ing biçimi)');
maske('f. dedi, söyledi (say fiilinin geçmiş biçimi)', 'said', 'f. dedi, söyledi (••• fiilinin geçmiş biçimi)');
maske("i. taksiler (taxi'nin çoğulu)", 'taxis', "i. taksiler (•••'nin çoğulu)");
maske("s. daha temiz (clean'in karşılaştırma biçimi)", 'cleaner', "s. daha temiz (•••'in karşılaştırma biçimi)");
maske('f. kaydolmak (enrol sözcüğünün Amerikan yazımı)', 'enroll', 'f. kaydolmak (••• sözcüğünün Amerikan yazımı)');
maske('i. kayıt (enrollment sözcüğünün İngiliz yazımı)', 'enrolment', 'i. kayıt (••• sözcüğünün İngiliz yazımı)');
// Not öznesi başlığa hiç benzemese de (düzensiz biçim) gizlenir: düzenli ve düzensiz kartlar aynı zorlukta olsun.
maske('f. gitti (go fiilinin geçmiş biçimi)', 'went', 'f. gitti (••• fiilinin geçmiş biçimi)');
maske("s. daha iyi (good'un karşılaştırma biçimi)", 'better', "s. daha iyi (•••'un karşılaştırma biçimi)");
maske('f. buldu (find fiilinin geçmiş biçimi)', 'found', 'f. buldu (••• fiilinin geçmiş biçimi)');
maske('i. fareler (mouse sözcüğünün çoğulu)', 'mice', 'i. fareler (••• sözcüğünün çoğulu)');
maske('f. yükseldi, arttı; rise fiilinin geçmiş biçimi', 'rose', 'f. yükseldi, arttı; ••• fiilinin geçmiş biçimi');
maske('f. (seek fiilinin geçmişi) aradı', 'sought', 'f. (••• fiilinin geçmişi) aradı');
// Not kalıbı yoksa ilgisiz İngilizce sözcük açık kalır.
maske('f. gitti (go)', 'went', 'f. gitti (go)');
maske('f. fiilinin; fiil', 'verb', 'f. fiilinin; fiil', 'kalıbın kendisi özne değildir');
// E: başlığın öteki yazımı; yakın yazılı Türkçe karşılık ipucudur, açık kalır.
maske('f. düzenlemek, organize etmek, örgütlemek', 'organise', 'f. düzenlemek, ••• etmek, örgütlemek');
maske('i. litre', 'liter', 'i. •••');
maske('i. gri', 'grey', 'i. gri');
maske('i. sistem, düzen', 'system', 'i. sistem, düzen');
maske('i. stres, gerilim, baskı', 'stress', 'i. stres, gerilim, baskı');
maske('i. proje', 'project', 'i. proje');

// Sözcük sınırı Türkçe harfleri de harf sayar; kısa başlıkta sözcüğün tamamı tutmalı.
assert.equal(O.maskele('şart, art, sanat (art); artı', 'art'), 'şart, •••, sanat (•••); artı');
assert.equal(O.maskele('ıform; form; reform; formül; Form2', 'form'), 'ıform; •••; reform; •••ül; •••2');
assert.equal(O.maskele('adet, ad, adı, ad.', 'ad'), 'adet, •••, adı, •••.');
assert.equal(O.maskele('kâr, âkar, kar', 'kar'), 'kâr, âkar, •••');
assert.equal(O.maskele('Problem; PROBLEM; problemli', 'problem'), '•••; •••; •••li', 'harf büyüklüğüne bakmaz');
assert.equal(O.maskele('İyi form; İNTERNET', 'form'), 'İyi •••; İNTERNET', 'İ konumları kaydırmaz');
assert.equal(O.maskele('İnternet ağı', 'internet'), '••• ağı');
assert.equal(O.maskele('risk risk; riskrisk', 'risk'), '••• •••; •••risk');
assert.equal(O.maskele('(hand down to) devretmek; hand-down; Handdown; hand  down; hand, down; el', 'hand down'),
  '(••• to) devretmek; •••; •••; •••  •••; •••, •••; el', 'çok sözcüklü başlık: ayraç boşluk, tire ya da bitişik; 4+ harfli parçalar tek başına da');
assert.equal(O.maskele('iyi olma (well-being); wellbeing; well being; swell-being; wellbeingler', 'well-being'),
  'iyi olma (•••); •••; •••; swell-•••; •••ler');
assert.equal(O.maskele('yapılacak (to do), todo; todolist; auto-do', 'to-do'), 'yapılacak (•••), •••; •••list; auto-do');
esit([O.maskele('a - b', '-'), O.maskele('a b', ' '), O.maskele('a - b', ' - ')], ['a - b', 'a b', 'a - b'], 'yalnız ayraçtan oluşan başlık hiçbir şeyi maskelemez');
// Düzenli ifade özel karakterleri düz metin gibi aranır.
assert.equal(O.maskele('a.b ve axb (a.b)', 'a.b'), '••• ve axb (•••)');
assert.equal(O.maskele('c++ dili, c++; c+++', 'c++'), '••• dili, •••; •••+');
assert.equal(O.maskele('fiyat $5.00 (USD) [x]*', '$5.00'), 'fiyat ••• (USD) [x]*');
assert.equal(O.maskele('abc 123 \\d+ (.*)', '\\d+'), 'abc 123 ••• (.*)');
assert.equal(O.maskele('x (.*) y', '(.*)'), 'x ••• y');
assert.equal(O.maskele('a^b', '^b'), 'a^b', 'harften sonra gelen eşleşme sözcük başı değildir');
assert.equal(O.maskele('<b>risk</b> & "tehlike"', 'risk'), '<b>•••</b> & "tehlike"', 'düz metin döner; kaçış çağıranın işidir');
esit([O.maskele('', 'x'), O.maskele('abc', ''), O.maskele(null, 'x'), O.maskele('abc', null), O.maskele(undefined, undefined)], ['', 'abc', '', 'abc', '']);

/* Gerçek veri: bütün oynanabilir kartların bütün anlamları. A kuralı bağımsız bir uygulamayla
   (geriye bakışlı düzenli ifade) karşılaştırılır; modül ondan yalnız DAHA ÇOK gizleyebilir
   (B-E kuralları), başka hiçbir yeri değiştiremez. */
const TR = 'a-zçğıöşüâîû';
const duzKacis = x => x.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
function bagimsizMaske(metin, kelime) {
  const alt = metin.replace(/İ/g, 'i').toLowerCase();
  assert.equal(alt.length, metin.length);
  // Başlıktaki her ayraç için üç yazım (tire, boşluk, bitişik) ayrı ayrı aranır.
  const cesitler = kelime.toLowerCase().split(/[- ]/).reduce((sol, p) => sol.length ? sol.flatMap(c => ['-', ' ', ''].map(a => c + a + p)) : [p], []);
  const son = kelime.replace(/[^a-z]/gi, '').length >= 4 ? '' : '(?![' + TR + '])';
  const ifade = new RegExp('(?<![' + TR + '])(?:' + cesitler.join('|') + ')' + son, 'g');
  let out = '', i = 0;
  for (const m of alt.matchAll(ifade)) { out += metin.slice(i, m.index) + '•••'; i = m.index + m[0].length; }
  return out + metin.slice(i);
}
// "maskeli", "taban"dan yalnız maske ekleyerek elde edilebilir mi (her ••• bir ya da daha çok karakteri örter)?
const yalnizMaskeEkler = (maskeli, taban) => new RegExp('^' + maskeli.split('•••').map(duzKacis).join('[\\s\\S]+?') + '$').test(taban);
assert.ok(yalnizMaskeEkler('i. (•••) teşekkür', 'i. (•••s) teşekkür') && yalnizMaskeEkler('a •••', 'a b c') && !yalnizMaskeEkler('a ••• d', 'a b c') && !yalnizMaskeEkler('x', 'y'));
let anlamSayisi = 0, maskelenen = 0, maskelenenKelime = 0, fazladan = 0;
function taramaDenetle(d, metin, yer) {
  const m = O.maskele(metin, d.e), taban = bagimsizMaske(metin, d.e), harfler = d.e.toLowerCase().replace(/[- ]/g, '');
  assert.ok(yalnizMaskeEkler(m, taban), d.e + ' (' + yer + '): maske başlığın sözcük başındaki bir geçişini açıkta bırakıyor ya da metni değiştiriyor: ' +
    JSON.stringify(metin) + ' → ' + JSON.stringify(m) + ' (beklenen en az: ' + JSON.stringify(taban) + ')');
  assert.ok(yalnizMaskeEkler(m, metin), d.e + ' (' + yer + '): maske dışında metin değişmiş: ' + JSON.stringify(m));
  // 4+ harfli başlık, maskeli metinde Latin harfli hiçbir sözcüğün içinde bütün hâlinde geçmez (sözcük başında).
  if (harfler.length >= 4) {
    assert.ok(!new RegExp('(?<![' + TR + '])' + duzKacis(harfler)).test(m.toLowerCase()), d.e + ' (' + yer + '): cevap maskeli metinde okunuyor: ' + JSON.stringify(m));
  }
  assert.equal(O.maskele(m, d.e), m, d.e + ' (' + yer + '): maske ikinci kez uygulanınca değişmemeli');
  if (m !== taban) fazladan++;
  return m;
}
for (const d of OYNANAN) {
  let kelimeSizdi = false, ipucu = false;
  for (const a of veri['KELIME_K' + d.k][d.e].a) {
    const m = taramaDenetle(d, a.tr, 'kart');
    anlamSayisi++;
    if (m !== a.tr) { maskelenen++; kelimeSizdi = true; }
    if (O.ipucuKalir(a.tr, d.e)) ipucu = true;
  }
  if (kelimeSizdi) maskelenenKelime++;
  assert.ok(ipucu, d.e + ': oynanabilir sayılan kartın hiçbir anlamında maskeden sonra ipucu kalmıyor');
  taramaDenetle(d, d.t, 'dizin anlamı');
}
assert.ok(anlamSayisi > 12000 && maskelenen > 300, 'maske gerçek veride çalışıyor: ' + maskelenen + '/' + anlamSayisi);
assert.ok(fazladan > 20, 'B-E kuralları gerçek veride çalışıyor: ' + fazladan);

/* ---------- 8) soru sırası ve sayılar (elle kurulan kayıtlar) ---------- */
const KAYITLAR = {
  // a: yok
  b: { k: 1, g: G - 3, c: G - 4 },        // vadesi geçmiş
  c: { k: 2, g: G, c: G - 3 },            // vadesi bugün
  d: { k: 3, g: G + 1, c: G - 6 },        // bekliyor
  e: { k: 4, g: G - 10, c: G - 25 },      // en çok geciken
  f: { k: 5, g: G - 40, c: G - 40 },      // öğrenildi
  g: { k: 5, g: G, c: G },                // öğrenildi, bugün çalışıldı
  // h: yok
  i: { k: 2, g: G - 3, c: G - 6 },        // b ile aynı vade: havuz sırası korunur
  j: { k: 5, g: G - 2 },                  // öğrenildi, son çalışma günü yok
  k: { k: 5, g: G - 100, c: G - 100 },    // öğrenildi, en eski
  l: { k: 1, g: G + 1, c: G },            // bugün yanlış yanıtlandı
  m: { k: 9, g: 'x', c: null },           // bozuk: 5. kutu sayılır, günü yok
  n: { k: NaN, g: G - 9, c: G - 9 },      // bozuk kutu: yeni sayılır
  o: { k: 2 },                            // vadesi yok: gelmiş sayılır
  p: { k: -4, g: G - 5 },                 // bozuk kutu: yeni sayılır
  q: { k: 3, g: NaN, c: G },              // vadesi okunamıyor: gelmiş sayılır
  r: { k: 2.9, g: G + 5 },                // 2. kutu, bekliyor
  s: { k: 5, c: G + 3 },                  // gelecekte çalışılmış görünüyor: sorulmaz
  t: {}                                   // boş kayıt: yeni sayılır
};
const HAVUZ = 'abcdefghijklmnopqrst'.split('').map(e => ({ e, t: e + ' anlamı', p: 1, k: 2, y: 'isim' }));
const bakilan = [];
const bak = { kayit: (e, d) => { bakilan.push([e, d]); return KAYITLAR[e] || null; }, bugun: G };
const adlar = liste => liste.map(d => d.e).join('');
const havuzKopyasi = JSON.stringify(HAVUZ);
const sirali = O.sira(HAVUZ, 'sira', bak);
assert.equal(adlar(sirali), 'oqebic' + 'ahnpt', 'vadesi gelenler en çok gecikenden başlar (eşitlikte havuz sırası), sonra yeniler havuz sırasıyla');
assert.equal(adlar(O.sira(HAVUZ, 'yeni', bak)), 'ahnpt');
assert.equal(adlar(O.sira(HAVUZ, 'ogrenilen', bak)), 'jmkf', 'öğrenilenlerde günü olmayan önce, sonra en eski');
assert.equal(adlar(O.sira(HAVUZ, 'bilinmeyen-mod', bak)), 'oqebicahnpt', 'tanınmayan mod sıradakiler gibi');
assert.ok(sirali[0] === HAVUZ[14] && sirali !== HAVUZ, 'aynı dizin kayıtları, yeni dizi');
assert.equal(JSON.stringify(HAVUZ), havuzKopyasi, 'havuz değişmez');
assert.ok(bakilan.every(([e, d]) => typeof e === 'string' && d.e === e), 'kayit(başlık, dizin kaydı) biçiminde çağrılır');
esit(O.sayilar(HAVUZ, bak), { tekrar: 6, yeni: 5, ogrenilen: 4, ogrenilenToplam: 6, bekleyen: 3, toplam: 20 });
// Kararlılık: havuz ters çevrilince eşit vadeliler de ters gelir.
const ters = HAVUZ.slice().reverse();
assert.equal(adlar(O.sira(ters, 'sira', bak)), 'qoeibc' + 'tpnha');
assert.equal(adlar(O.sira(ters, 'ogrenilen', bak)), 'mjkf');
// Ertesi gün: bekleyenlerden vadesi gelenler ve bugün çalışılan öğrenilen kelime sıraya girer.
const yarin = { kayit: bak.kayit, bugun: G + 1 };
assert.equal(adlar(O.sira(HAVUZ, 'sira', yarin)), 'oqebicdl' + 'ahnpt');
assert.equal(adlar(O.sira(HAVUZ, 'ogrenilen', yarin)), 'jmkfg');
esit(O.sayilar(HAVUZ, yarin), { tekrar: 8, yeni: 5, ogrenilen: 5, ogrenilenToplam: 6, bekleyen: 1, toplam: 20 });
// Kayıt okuyucu yoksa hepsi yenidir; boş havuz.
assert.equal(adlar(O.sira(HAVUZ, 'sira', { bugun: G })), 'abcdefghijklmnopqrst');
esit(O.sayilar(HAVUZ, null), { tekrar: 0, yeni: 20, ogrenilen: 0, ogrenilenToplam: 0, bekleyen: 0, toplam: 20 });
esit([O.sira([], 'sira', bak), O.sira(null, 'yeni', bak), O.sayilar(undefined, bak).toplam], [[], [], 0]);
// Gerçek havuz, kayıt yok: dizin sırası aynen korunur (puana göre yeniden sıralanmaz).
const bosBak = { kayit: () => null, bugun: G };
const tumSira = O.sira(OYNANAN, 'sira', bosBak);
assert.ok(tumSira.length === OYNANAN.length && tumSira.every((d, i) => d === OYNANAN[i]), 'yeni kelimeler dizin sırasında');
esit([O.sira(OYNANAN, 'ogrenilen', bosBak).length, O.sayilar(OYNANAN, bosBak).yeni], [0, OYNANAN.length]);

/* ---------- 9) gerçek Ilerleme: her sonuç kelimeyi o gün bütün modlardan çıkarır ---------- */
const bugunTarih = new Date(2026, 9, 10, 12).getTime();
class SahteDate extends Date {
  constructor(...a) { if (a.length) super(...a); else super(bugunTarih); }
  static now() { return bugunTarih; }
}
function ilerlemeOrtami(leitner) {
  const bellek = new Map([['yds-leitner', leitner]]);
  const kopya = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const Depo = {
    oku: (a, v) => bellek.has(a) ? kopya(bellek.get(a)) : v,
    yaz: (a, v) => { bellek.set(a, kopya(v)); return true; },
    sil: a => bellek.delete(a), anahtarlariSil: l => l.forEach(a => bellek.delete(a))
  };
  const pencere = { YDS: { Depo }, addEventListener() {} };
  const baglam = vm.createContext({ window: pencere, Date: SahteDate, console, Math, JSON, Object, Array, String, Number, parseInt, Set, Map });
  for (const f of ['data/kelime-aliaslari.js', 'assets/js/esitleme-veri.js', 'assets/js/ilerleme.js', MODUL]) {
    vm.runInContext(oku(f), baglam, { filename: f });
  }
  return pencere.YDS;
}
const SORU_HAVUZU = OYNANAN.filter(d => d.k === 2).slice(0, 40);
const hedefKelime = SORU_HAVUZU[7].e;
const ILK = ilerlemeOrtami({}).Ilerleme, ILK_BUGUN = ILK.bugun();
const kimlik = e => ILK.ilerlemeKimligi(e, 'kelime');   // depodaki anahtar ('@kelime:…' olabilir)
let gercekSenaryo = 0;
for (let kutu = 0; kutu <= 5; kutu++) {
  for (const sonuc of ['dogru', 'ipucuyla', 'yanlis', 'zatenBiliyorum']) {
    const baslangic = {}, bugun = ILK_BUGUN;
    // Komşu kelimeler: biri daha çok gecikmiş, biri bekliyor; hedef kelime istenen kutuda ve sorulabilir durumda.
    baslangic[kimlik(SORU_HAVUZU[3].e)] = { k: 2, g: bugun - 9, c: bugun - 12, m: 0 };
    baslangic[kimlik(SORU_HAVUZU[5].e)] = { k: 3, g: bugun + 4, c: bugun - 3, m: 0 };
    if (kutu) baslangic[kimlik(hedefKelime)] = kutu === 5 ? { k: 5, g: bugun - 30, c: bugun - 30, m: 0 } : { k: kutu, g: bugun - 1, c: bugun - 5, m: 0 };
    const Y2 = ilerlemeOrtami(baslangic), I2 = Y2.Ilerleme, Oy = Y2.OyunHesap;
    assert.equal(I2.bugun(), bugun);
    const gercekBak = { kayit: e => I2.kayit(e, 'kelime'), bugun: I2.bugun() };
    const mod = kutu === 5 ? 'ogrenilen' : 'sira';
    const etiket = 'kutu ' + kutu + ' / ' + sonuc;
    assert.ok(Oy.sira(SORU_HAVUZU, mod, gercekBak).some(d => d.e === hedefKelime), etiket + ': yanıttan önce sırada');
    assert.equal(Oy.kutuDuzelt(I2.kutu(hedefKelime, 'kelime')), kutu);
    const yeniKutu = I2[sonuc](hedefKelime, 'kelime');
    if (sonuc !== 'zatenBiliyorum') assert.equal(yeniKutu, Oy.sonKutu(kutu, sonuc), etiket + ': sonKutu gerçek Ilerleme ile aynı');
    for (const m of ['sira', 'yeni', 'ogrenilen']) {
      assert.ok(!Oy.sira(SORU_HAVUZU, m, gercekBak).some(d => d.e === hedefKelime), etiket + ': aynı gün ' + m + ' modunda yeniden sorulmaz');
    }
    const say = Oy.sayilar(SORU_HAVUZU, gercekBak);
    assert.equal(say.tekrar + say.yeni + say.bekleyen + say.ogrenilenToplam, say.toplam, etiket + ': sayılar toplamı tutar');
    esit([say.tekrar, say.yeni, say.ogrenilen], [1, 37, 0], etiket + ': yanıtlanan kelime sayılardan düşer');
    // Ertesi gün: yanlış yanıt yeniden sırada, 5. kutuya ulaşan ya da orada kalan kelime harfsiz turda.
    const ertesi = { kayit: gercekBak.kayit, bugun: gercekBak.bugun + 1 };
    assert.equal(Oy.sira(SORU_HAVUZU, 'sira', ertesi).some(d => d.e === hedefKelime), yeniKutu === 1 || sonuc === 'yanlis', etiket + ': ertesi gün sıradakiler');
    assert.equal(Oy.sira(SORU_HAVUZU, 'ogrenilen', ertesi).some(d => d.e === hedefKelime), yeniKutu === 5, etiket + ': ertesi gün öğrenilenler');
    gercekSenaryo++;
  }
}

console.log('oyun-hesap: ' + OYNANAN.length + '/' + DIZIN.length + ' oynanabilir başlık (' + IPUCSUZ.length + ' başlık ipuçsuz kaldığı için dışarıda), ' +
  denenenTur + ' tur (başlık × kutu), ' + anlamSayisi + ' anlamda maske (' + maskelenen + ' anlam, ' + maskelenenKelime + ' kelime maskelendi; ' +
  fazladan + ' yerde kök/çekim/öteki yazım da gizlendi), ' + ciftler.length + ' yazım çifti, durum makinesi, sıra/sayılar ve ' +
  gercekSenaryo + ' gerçek Ilerleme senaryosu geçti.');
