'use strict';

/* İstatistik sayfasının veri hattı:
   1) ilerleme.js her kart cevabında yds-gunluk-kayit sayaçlarını artırıyor mu?
   2) esitleme-veri.js iki cihazın aynı gününü alan alan MAKSİMUM ile
      birleştiriyor mu (toplamak her eşitlemede şişirirdi)?
   3) istatistik.js'in aradığı bütün kimlikler istatistik.html'de var mı? */

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');

/* ---------- 1) günlük sayaçlar ---------- */

var GercekDate = Date;
var simdi = new GercekDate(2026, 8, 7, 12, 0, 0).getTime();
class SahteDate extends GercekDate {
  constructor() {
    var args = Array.prototype.slice.call(arguments);
    if (!args.length) super(simdi); else super(...args);
  }
  static now() { return simdi; }
}

var bellek = new Map();
function kopya(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
var Depo = {
  oku: function (a, varsayilan) { return bellek.has(a) ? kopya(bellek.get(a)) : varsayilan; },
  yaz: function (a, v) { bellek.set(a, kopya(v)); return true; },
  sil: function (a) { bellek.delete(a); return true; },
  anahtarlariSil: function (adlar) { adlar.forEach(function (a) { bellek.delete(a); }); return true; }
};
var pencere = { YDS: { Depo: Depo }, addEventListener: function () {} };
vm.runInContext(fs.readFileSync(path.join(kok, 'assets/js/ilerleme.js'), 'utf8'),
  vm.createContext({ window: pencere, Date: SahteDate, console: console }),
  { filename: 'assets/js/ilerleme.js' });
var Il = pencere.YDS.Ilerleme;
function gunIlerle(n) { simdi += n * 86400000; }
// kopya(): vm bağlamındaki nesnelerin prototipi test alanınınkinden farklı,
// deepStrictEqual prototipi de karşılaştırıyor.
function bugunku() { return kopya(Il.gunlukKayitlar()[String(Il.bugun())]) || { t: 0, y: 0, d: 0, m: 0, z: 0 }; }

assert.deepStrictEqual(kopya(Il.gunlukKayitlar()), {}, 'boş depoda günlük kayıt boş olmalı');

Il.dogru('alpha', 'kelime');
assert.deepStrictEqual(bugunku(), { t: 1, y: 1, d: 1, m: 0, z: 0 },
  'ilk kez doğru bilinen kart: cevap + yeni + doğru sayılmalı');

Il.yanlis('beta', 'kelime');
assert.deepStrictEqual(bugunku(), { t: 2, y: 2, d: 1, m: 0, z: 0 },
  'yanlış cevap doğru sayacını artırmamalı');

Il.ipucuyla('gama', 'kelime');
assert.deepStrictEqual(bugunku(), { t: 3, y: 3, d: 1, m: 0, z: 0 },
  'ipucuyla bilinen kart doğru sayılmamalı');

Il.zatenBiliyorum('delta', 'kelime');
assert.deepStrictEqual(bugunku(), { t: 3, y: 4, d: 1, m: 1, z: 1 },
  '"zaten biliyorum" çalışma hacmine (t) değil ayıklamaya (z) yazılmalı');

// Aynı kart ikinci kez: yeni sayacı artmaz (m, delta'nın ayıklanmasından kalır).
Il.dogru('alpha', 'kelime');
assert.deepStrictEqual(bugunku(), { t: 4, y: 4, d: 2, m: 1, z: 1 },
  'ikinci kez çalışılan kart yeni sayılmamalı');

// 5. kutuya çıkış mezuniyet olarak bir kez sayılır.
gunIlerle(1); Il.dogru('alpha', 'kelime');
gunIlerle(3); Il.dogru('alpha', 'kelime');
gunIlerle(7); Il.dogru('alpha', 'kelime');
var mezunGunu = String(Il.bugun());
assert.strictEqual(Il.kutu('alpha', 'kelime'), 5, 'kart 5. kutuya çıkmalı');
assert.strictEqual(Il.gunlukKayitlar()[mezunGunu].m, 1, 'mezuniyet günü sayılmalı');
Il.dogru('alpha', 'kelime');
assert.strictEqual(Il.gunlukKayitlar()[mezunGunu].m, 1, '5. kutudaki kart yeniden mezun sayılmamalı');

var gunler = Object.keys(Il.gunlukKayitlar());
assert.strictEqual(gunler.length, 4, 'her çalışma günü ayrı kayıt olmalı');
gunler.forEach(function (g) { assert.ok(/^\d+$/.test(g), 'gün kimliği sayı değil: ' + g); });

// Bozuk kayıtlar okurken elenir; sayfa yine çalışır.
bellek.set('yds-gunluk-kayit', { '20000': { t: 3, y: 1, d: 2, m: 0, z: 0 },
  'abc': { t: 5 }, '20001': null, '20002': { t: -2, y: 'x' } });
var temiz = kopya(Il.gunlukKayitlar());
assert.deepStrictEqual(Object.keys(temiz).sort(), ['20000', '20002'], 'geçersiz gün kimlikleri elenmeli');
assert.deepStrictEqual(temiz['20002'], { t: 0, y: 0, d: 0, m: 0, z: 0 }, 'geçersiz sayaçlar sıfırlanmalı');

// Sıfırlama kapsamı: istatistik de yedeklenip silinmeli.
bellek.set('yds-gunluk-kayit', { '20000': { t: 3, y: 1, d: 2, m: 0, z: 0 } });
assert.strictEqual(Il.hepsiniSifirla(), true);
assert.deepStrictEqual(kopya(Il.gunlukKayitlar()), {}, 'hepsini sıfırla günlük sayaçları da silmeli');
assert.ok(bellek.get('yds-son-yedek').veri['yds-gunluk-kayit'],
  'sıfırlama yedeği günlük sayaçları içermeli');

/* ---------- 2) cihazlar arası birleşme ---------- */

var motorPencere = { YDS: {} };
vm.runInContext(fs.readFileSync(path.join(kok, 'assets/js/esitleme-veri.js'), 'utf8'),
  vm.createContext({ window: motorPencere, console: console }), { filename: 'esitleme-veri.js' });
var M = motorPencere.YDS.EsitlemeMotoru;
assert.strictEqual(M.TIPLER ? M.TIPLER['yds-gunluk-kayit'] : 'nesne', 'nesne');

/* Sürümsüz (eski/klasik) kayıtlar birleşirken sayaçlar alan alan MAKSİMUM
   alınır: ilk eşitlemede iki taraftaki günün büyük olanı korunur, toplamak ise
   her yeniden eşitlemede şişirirdi. */
function eskiZarf(veri) { return M.zarfaCevir({ 'yds-gunluk-kayit': veri }); }
var eskiA = eskiZarf({ '20340': { t: 30, y: 5, d: 20, m: 1, z: 0 } });
var eskiB = eskiZarf({ '20340': { t: 12, y: 9, d: 10, m: 0, z: 4 } });
var birlesik = M.paket(M.birlestir(eskiA, eskiB))['yds-gunluk-kayit']['20340'];
assert.deepStrictEqual(kopya(birlesik), { t: 30, y: 9, d: 20, m: 1, z: 4 },
  'sürümsüz kayıtlarda aynı günün sayaçları alan alan maksimumla birleşmeli');
var tersine = M.paket(M.birlestir(eskiB, eskiA))['yds-gunluk-kayit']['20340'];
assert.deepStrictEqual(kopya(tersine), kopya(birlesik), 'birleşme sıradan bağımsız olmalı');

/* Sürümlü kayıtlarda motorun genel kuralı geçerlidir: son yazan kazanır.
   İki cihazda aynı gün çevrimdışı çalışıldıysa sayılar toplanmaz; bu bilinçli
   bir ödün, çünkü toplama her yeniden eşitlemede aynı çalışmayı yeniden sayardı. */
function surumlu(veri, meta) {
  return M.kayitlariYaz(M.zarfaCevir({}), 'yds-gunluk-kayit', veri, function () { return meta; });
}
var sonYazan = M.paket(M.birlestir(
  surumlu({ '20341': { t: 30, y: 5, d: 20, m: 1, z: 0 } }, '100:aaa'),
  surumlu({ '20341': { t: 12, y: 9, d: 10, m: 0, z: 4 } }, '200:bbb')
))['yds-gunluk-kayit']['20341'];
assert.deepStrictEqual(kopya(sonYazan), { t: 12, y: 9, d: 10, m: 0, z: 4 },
  'sürümlü kayıtta son yazan kazanmalı');

/* ---------- 3) sayfa ile betik uyumu ---------- */

var html = fs.readFileSync(path.join(kok, 'istatistik.html'), 'utf8');
var betik = fs.readFileSync(path.join(kok, 'assets/js/istatistik.js'), 'utf8');
var kimlikler = {};
html.replace(/\bid="([^"]+)"/g, function (_, id) { kimlikler[id] = true; return _; });
var aranan = [];
betik.replace(/\$\('([^']+)'\)/g, function (_, id) { aranan.push(id); return _; });
assert.ok(aranan.length >= 8, 'istatistik.js beklenenden az kimlik kullanıyor');
aranan.forEach(function (id) {
  assert.ok(kimlikler[id], 'istatistik.js "' + id + '" kimliğini arıyor ama sayfada yok');
});
assert.ok(/id="icerik"/.test(html) && /class="skip-link"/.test(html),
  'istatistik.html erişilebilirlik iskeletini taşımıyor');
assert.ok(/role="img"/.test(betik), 'SVG grafikler role="img" ile etiketlenmiyor');

console.log('istatistik: günlük sayaçlar, maksimum birleşme ve ' + aranan.length +
  ' sayfa kimliği doğrulandı');
