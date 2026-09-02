'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var baglam = { window: { YDS: {} } };
vm.createContext(baglam);
vm.runInContext(fs.readFileSync(path.join(kok, 'assets', 'js', 'esitleme-veri.js'), 'utf8'), baglam);

var M = baglam.window.YDS.EsitlemeMotoru;
var j = M.kararliJson;
assert.strictEqual(M.SURUM, 2, 'yerel zarf sürümü değişmemeli');
assert.strictEqual(M.BULUT_KODLAMA_SURUMU, 2, 'kısa bulut iç kodlama sürümü');
function meta(z, aktor) { return function () { return String(z++) + ':' + aktor; }; }

// Eski biçim kayıpsız taşınır ve iki cihazın farklı kelimeleri birleşir.
var a = M.zarfaCevir({ 'yds-leitner': { abandon: { k: 2, g: 100 } } });
var b = M.zarfaCevir({ 'yds-leitner': { ability: { k: 3, g: 110 } } });
var ab = M.birlestir(a, b);
assert.deepStrictEqual(JSON.parse(JSON.stringify(M.paket(ab)['yds-leitner'])), {
  abandon: { k: 2, g: 100 }, ability: { k: 3, g: 110 }
});

// Eski kayıtlarda aynı kelimenin gerçekten daha sonra çalışılanı kazanır.
a = M.zarfaCevir({ 'yds-leitner': { abandon: { k: 4, g: 200, c: 40 } } });
b = M.zarfaCevir({ 'yds-leitner': { abandon: { k: 1, g: 50, c: 45 } } });
assert.strictEqual(M.paket(M.birlestir(a, b))['yds-leitner'].abandon.k, 1);

// Aynı tabandan iki sekmenin farklı kart güncellemeleri kaybolmaz.
var taban = M.zarfaCevir({ 'yds-leitner': { base: { k: 1, g: 10 } } });
var sekmeA = M.kayitlariYaz(taban, 'yds-leitner', { alpha: { k: 2, g: 20, c: 15 } }, meta(100, 'A'));
var sekmeB = M.kayitlariYaz(taban, 'yds-leitner', { beta: { k: 3, g: 30, c: 16 } }, meta(100, 'B'));
var birlesik = M.birlestir(sekmeA, sekmeB);
assert.deepStrictEqual(Object.keys(M.paket(birlesik)['yds-leitner']).sort(), ['alpha', 'base', 'beta']);

// Birleştirme sıra bağımsız ve tekrar uygulanabilir olmalıdır.
assert.strictEqual(j(M.birlestir(sekmeA, sekmeB)), j(M.birlestir(sekmeB, sekmeA)));
assert.strictEqual(j(birlesik), j(M.birlestir(birlesik, sekmeA)));

// Yeni silme işareti çevrimdışı kalmış eski kaydı bastırır.
var silinmis = M.kayitlariSil(sekmeA, 'yds-leitner', ['alpha'], meta(200, 'A'));
var diriltmeDenemesi = M.birlestir(silinmis, sekmeA);
assert.strictEqual(M.paket(diriltmeDenemesi)['yds-leitner'].alpha, undefined);

// Bölüm sıfırlaması, cihazda bilinmeyen eski kayıtları da geri getirmez.
var sifir = M.anahtariSil(birlesik, 'yds-leitner', meta(300, 'A'));
assert.strictEqual(M.paket(M.birlestir(sifir, sekmeB))['yds-leitner'], undefined);

// Sıfırlamadan sonra yapılan gerçek yeni çalışma korunur.
var yeniden = M.kayitlariYaz(sifir, 'yds-leitner', { gamma: { k: 1, g: 40, c: 35 } }, meta(301, 'B'));
assert.deepStrictEqual(JSON.parse(JSON.stringify(M.paket(yeniden)['yds-leitner'])),
  { gamma: { k: 1, g: 40, c: 35 } });

// Yanlış defterindeki çözülmüş soru da eski cihazdan dirilmez.
var yanlis = M.zarfaCevir({ 'yds-yanlis': [{ a: 'K|S', kat: 'K', n: 2, t: 10 }] });
yanlis = M.kayitlariSil(yanlis, 'yds-yanlis', ['K|S'], meta(400, 'A'));
assert.deepStrictEqual(JSON.parse(JSON.stringify(M.paket(M.birlestir(yanlis,
  M.zarfaCevir({ 'yds-yanlis': [{ a: 'K|S', kat: 'K', n: 1, t: 5 }] })))['yds-yanlis'])), []);

// Geçmiş birleşir, aynı sonuç çoğalmaz ve son 50 kayıt gösterilir.
var g1 = [], g2 = [];
for (var i = 1; i <= 40; i++) g1.push({ t: i, d: i, n: 80, y: i, m: 'deneme' });
for (i = 31; i <= 70; i++) g2.push({ t: i, d: i, n: 80, y: i, m: 'deneme' });
var gp = M.paket(M.birlestir(M.zarfaCevir({ 'yds-gecmis': g1 }),
  M.zarfaCevir({ 'yds-gecmis': g2 })))['yds-gecmis'];
assert.strictEqual(gp.length, 50);
assert.strictEqual(gp[0].t, 21);
assert.strictEqual(gp[49].t, 70);

// Büyük test-yanlış alanı bulutta kısa taşınır; aktif kayıt, silme işareti ve
// sıfırlama metası kayıpsız açılır. Eski nesne biçimi de okunmaya devam eder.
var testAlani = M.kayitlariYaz(M.zarfaCevir({}), 'yds-test-yanlis', {
  ability: { n: 3, t: 90, u: 90 }, abandon: { n: 1, t: 80, u: 80 }
}, meta(500, 'A'));
testAlani = M.kayitlariSil(testAlani, 'yds-test-yanlis', ['abandon'], meta(600, 'A'));
var hamTestAlani = testAlani.alanlar['yds-test-yanlis'];
hamTestAlani.r = '450:A';
hamTestAlani.i['custom-null'] = {
  m: '650:B',
  v: { n: null, t: 'bilinmiyor', u: false }
};
var kodluTestAlani = M.bulutAlaniniKodla('yds-test-yanlis', hamTestAlani);
assert.strictEqual(kodluTestAlani.k, 2);
assert.ok(Array.isArray(kodluTestAlani.i));
assert.strictEqual(j(M.bulutAlaniniCoz('yds-test-yanlis', kodluTestAlani)), j(hamTestAlani));
assert.strictEqual(kodluTestAlani.i.filter(function (satir) {
  return satir[0] === 'custom-null';
})[0][2], null, 'sayısal olmayan n/t kaydı standart biçime sıkıştırıldı');
assert.strictEqual(j(M.bulutAlaniniCoz('yds-test-yanlis', hamTestAlani)), j(hamTestAlani));

// İlk kısa dizi biçimi de geriye uyumlu okunur ve başka cihaz kaydıyla birleşir.
var eskiKisaDizi = { k: 1, r: '699:A', i: [
  ['legacy-active', '700:A', 0, { n: 2, t: 70 }],
  ['legacy-deleted', '701:A', 1]
] };
var eskiKisaZarf = { surum: 2, alanlar: {
  'yds-test-yanlis': M.bulutAlaniniCoz('yds-test-yanlis', eskiKisaDizi)
} };
assert.strictEqual(eskiKisaZarf.alanlar['yds-test-yanlis'].r, '699:A',
  'k=1 sıfırlama metası kayboldu');
var baskaCihaz = M.kayitlariYaz(M.zarfaCevir({}), 'yds-test-yanlis', {
  remote: { n: 4, t: 72, u: 72 }
}, meta(702, 'B'));
var birlesmisTestler = M.birlestir(eskiKisaZarf, baskaCihaz);
assert.strictEqual(M.paket(birlesmisTestler)['yds-test-yanlis']['legacy-active'].n, 2);
assert.strictEqual(M.paket(birlesmisTestler)['yds-test-yanlis'].remote.n, 4);
assert.strictEqual(M.paket(birlesmisTestler)['yds-test-yanlis']['legacy-deleted'], undefined);

// Özel nesne anahtarları prototipe dönüşmeden gerçek kayıt olarak kalır.
var ozelAlan = { i: Object.create(null) };
ozelAlan.i.__proto__ = { m: '800:A', v: { n: 1, t: 80 } };
var ozelCozulmus = M.bulutAlaniniCoz('yds-test-yanlis',
  M.bulutAlaniniKodla('yds-test-yanlis', ozelAlan));
assert.strictEqual(Object.getPrototypeOf(ozelCozulmus.i), null);
assert.ok(Object.prototype.hasOwnProperty.call(ozelCozulmus.i, '__proto__'));
assert.strictEqual(ozelCozulmus.i.__proto__.v.n, 1);

// Legacy JSON'daki prototip adları, zarfa ve tekrar görünür pakete geçerken
// own-property kimliğini korur; düz nesne ataması __proto__ kaydını yutmamalıdır.
var legacyOzelPaket = JSON.parse('{"yds-test-yanlis":{' +
  '"__proto__":{"n":2,"t":81,"u":81},' +
  '"constructor":{"n":3,"t":82,"u":82},' +
  '"normal":{"n":4,"t":83,"u":83}}}');
var legacyOzelSonuc = M.paket(M.zarfaCevir(legacyOzelPaket))['yds-test-yanlis'];
assert.strictEqual(Object.getPrototypeOf(legacyOzelSonuc), null);
['__proto__', 'constructor', 'normal'].forEach(function (id) {
  assert.ok(Object.prototype.hasOwnProperty.call(legacyOzelSonuc, id),
    'legacy kimlik own-property olarak korunmadı: ' + id);
});
assert.strictEqual(legacyOzelSonuc.__proto__.n, 2);
assert.strictEqual(legacyOzelSonuc.constructor.n, 3);
assert.strictEqual(legacyOzelSonuc.normal.n, 4);

// Leitner alanı da yalnız bulut taşımasında kısalır ve yerel kayıt birebir kalır.
var leitnerKisa = M.bulutAlaniniKodla('yds-leitner', sekmeA.alanlar['yds-leitner']);
assert.strictEqual(leitnerKisa.k, 2);
assert.strictEqual(j(M.bulutAlaniniCoz('yds-leitner', leitnerKisa)),
  j(sekmeA.alanlar['yds-leitner']));

console.log('esitleme-veri: 15 senaryo başarılı');
