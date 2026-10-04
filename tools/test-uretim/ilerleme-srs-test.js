'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var GercekDate = Date;
var simdi = new GercekDate(2026, 0, 10, 12, 0, 0).getTime();

class SahteDate extends GercekDate {
  constructor() {
    var args = Array.prototype.slice.call(arguments);
    if (!args.length) super(simdi);
    else super(...args);
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
var baglam = vm.createContext({
  window: pencere, Date: SahteDate, JSON: JSON, Object: Object, Array: Array,
  Math: Math, String: String, Number: Number, parseInt: parseInt, console: console
});
vm.runInContext(fs.readFileSync(path.join(kok, 'assets/js/ilerleme.js'), 'utf8'), baglam,
  { filename: 'assets/js/ilerleme.js' });

var Il = pencere.YDS.Ilerleme;
function gunIlerle(n) { simdi += n * 86400000; }

assert.strictEqual(Il.dogru('alpha', 'kelime'), 1);
assert.deepStrictEqual(kopya(Il.kayit('alpha', 'kelime')),
  { k: 1, g: Il.bugun() + 1, c: Il.bugun(), m: 0, kalan: 1 });

gunIlerle(1); Il.dogru('alpha', 'kelime');
assert.strictEqual(Il.kayit('alpha', 'kelime').k, 2);
assert.strictEqual(Il.kayit('alpha', 'kelime').kalan, 3);
gunIlerle(3); Il.dogru('alpha', 'kelime');
gunIlerle(7); Il.dogru('alpha', 'kelime');
gunIlerle(15); Il.dogru('alpha', 'kelime');
assert.strictEqual(Il.kayit('alpha', 'kelime').k, 5);
assert.strictEqual(Il.kayit('alpha', 'kelime').kalan, 0);
assert.strictEqual(Il.kayit('alpha', 'kelime').m, 0);

gunIlerle(30);
assert.strictEqual(Il.vadesiGeldiMi('alpha', 'kelime'), false, '5. kutu yeniden vadesi gelmemeli');
assert.strictEqual(Il.yanlis('alpha', 'kelime'), 4, 'yanlış yalnız bir kutu geri almalı');
assert.strictEqual(Il.kayit('alpha', 'kelime').kalan, 1);

Il.zatenBiliyorum('beta', 'kelime');
assert.strictEqual(Il.kayit('beta', 'kelime').k, 5);
assert.strictEqual(Il.kayit('beta', 'kelime').kalan, 0, 'zaten bilinen kart tamamlanmış sayılmalı');
assert.strictEqual(Il.vadesiGeldiMi('beta', 'kelime'), false, 'zaten bilinen kart yeniden sorulmamalı');
var sonKutuDestesi = Il.destelik([{ en: 'beta' }], 'kelime');
assert.strictEqual(sonKutuDestesi.length, 0, '5. kutu günlük desteye yeniden girmemeli');

var kelimeKodu = fs.readFileSync(path.join(kok, 'assets/js/kelimeler.js'), 'utf8');
var obekKodu = fs.readFileSync(path.join(kok, 'assets/js/obekler.js'), 'utf8');
[['kelime', kelimeKodu], ['öbek', obekKodu]].forEach(function (girdi) {
  var ad = girdi[0];
  var kod = girdi[1];
  ['bildim', 'bilmedim', 'zatenBiliyorum'].forEach(function (dugme) {
    assert.ok(new RegExp("\\$\\('" + dugme + "'\\)\\.disabled = false").test(kod),
      ad + ' kartında ' + dugme + ' her durumda etkin kalmalı');
  });
  assert.ok(!/ne !== 'zaten' && !kartAcik/.test(kod),
    ad + ' kartı kapalıyken bildim/bilemedim engellenmemeli');
  assert.ok(!/ne === 'zaten' && \(kartAcik \|\| ipucuAcik\)/.test(kod),
    ad + ' kartı açıkken zaten biliyorum engellenmemeli');
  assert.ok(!/e\.key === '[12]' &&/.test(kod),
    ad + ' kartının 1/2 kısayolları kart yüzüne bağlı olmamalı');
});

var gununTestiKodu = fs.readFileSync(path.join(kok, 'assets/js/gunun-testi.js'), 'utf8');
assert.ok(/r\.k >= 5/.test(gununTestiKodu), '5. kutu günün kelime testine yeniden girmemeli');

['r1', 'r2', 'r3'].forEach(function (ad) { Il.dogru(ad, 'kelime'); });
gunIlerle(1);
Il.gunlukTavanAyarla(2);
var havuz = ['r1', 'r2', 'r3', 'yeni'].map(function (en) { return { en: en }; });
var deste = Il.destelik(havuz, 'kelime');
assert.strictEqual(deste.length, 2);
assert.ok(deste.every(function (x) { return /^r/.test(x.en); }), 'tekrar borcu varken yeni kart öne geçmemeli');
Il.gunlukTavanAyarla(4);
deste = Il.destelik(havuz, 'kelime');
assert.deepStrictEqual(deste.map(function (x) { return x.en; }).sort(), ['r1', 'r2', 'r3', 'yeni']);

var soru = { kat: 'Kelime', soru: 'Aynı soru' };
Il.yanlisEkle(soru);
Il.yanlisCoz(soru);
Il.yanlisCoz(soru);
assert.strictEqual(Il.yanlisDefter().length, 1, 'aynı gün iki doğru defteri temizlememeli');
gunIlerle(1);
Il.yanlisCoz(soru);
assert.strictEqual(Il.yanlisDefter().length, 0, 'iki farklı gündeki doğrular defteri temizlemeli');

Il.kategoriKaydet('Okuma', true, 'q-1');
Il.kategoriKaydet('Okuma', false, 'q-1');
var okuma = Il.kategoriOzet().filter(function (x) { return x.kat === 'Okuma'; })[0];
assert.strictEqual(okuma.toplam, 1, 'aynı soru kategori kapsamını şişirmemeli');
assert.strictEqual(okuma.dogru, 0, 'aynı sorunun son cevabı esas alınmalı');

// Günlük sayaçlar cihaz paylarıyla yazılır: toplam payların toplamı, pay bu cihaza ait.
Il.dogru('pay-ilk-kelime', 'kelime');
var gunAnahtari = String(Il.bugun());
var hamGun = bellek.get('yds-gunluk-kayit')[gunAnahtari];
assert.ok(hamGun && hamGun.p && hamGun.p.yerel, 'Depo cihaz kimliği vermiyorsa pay "yerel" adıyla yazılır');
assert.strictEqual(hamGun.t, hamGun.p.yerel.t, 'tek cihazda toplam kendi payına eşittir');
Depo.cihaz = 'ikinci';
var oncekiT = hamGun.t;
Il.dogru('pay-kelimesi', 'kelime');
hamGun = bellek.get('yds-gunluk-kayit')[gunAnahtari];
assert.strictEqual(hamGun.p.ikinci.t, 1, 'ikinci cihaz yalnız kendi payını artırır');
assert.strictEqual(hamGun.p.yerel.t, oncekiT, 'diğer cihazın payı korunur');
assert.strictEqual(hamGun.t, oncekiT + 1, 'toplam payların toplamıdır');
assert.strictEqual(Il.gunlukKayitlar()[gunAnahtari].t, oncekiT + 1, 'okuyucular yalnız toplamı görür');
assert.strictEqual(Il.gunlukKayitlar()[gunAnahtari].p, undefined);
var hamSayac = bellek.get('yds-yeni-sayac');
assert.ok(hamSayac.p && hamSayac.p.ikinci && hamSayac.p.ikinci.n >= 1, 'yeni kart sayacı da cihaz payı taşır');
assert.strictEqual(hamSayac.n, Object.keys(hamSayac.p).reduce(function (n, c) { return n + hamSayac.p[c].n; }, 0));
delete Depo.cihaz;

/* "Birikmişi yay": yalnız vadesi geçmiş, mezun OLMAYAN kartlar dağıtılır. Mezunlar
   (5. kutu) desteye girmediği için kontenjanı tüketmemeli; gerçek tekrarlar bugünde kalmalı. */
(function () {
  var bellek2 = new Map(), leitner = {}, adlar = [];
  var gun = Il.bugun();
  for (var i = 0; i < 50; i++) { leitner['mezun' + i] = { k: 5, g: gun - 60 - i, c: gun - 60 - i, m: 0 }; adlar.push('mezun' + i); }
  for (var j = 0; j < 40; j++) { leitner['gecikmis' + j] = { k: 2, g: gun - 10 - (j % 5), c: gun - 13, m: 0 }; adlar.push('gecikmis' + j); }
  bellek2.set('yds-leitner', leitner);
  var Depo2 = {
    oku: function (a, v) { return bellek2.has(a) ? kopya(bellek2.get(a)) : v; },
    yaz: function (a, v) { bellek2.set(a, kopya(v)); return true; },
    sil: function (a) { bellek2.delete(a); return true; },
    anahtarlariSil: function (x) { x.forEach(function (a) { bellek2.delete(a); }); return true; }
  };
  var pencere2 = { YDS: { Depo: Depo2 }, addEventListener: function () {} };
  var baglam2 = vm.createContext({
    window: pencere2, Date: SahteDate, JSON: JSON, Object: Object, Array: Array,
    Math: Math, String: String, Number: Number, parseInt: parseInt, console: console
  });
  vm.runInContext(fs.readFileSync(path.join(kok, 'assets/js/ilerleme.js'), 'utf8'), baglam2, { filename: 'assets/js/ilerleme.js' });
  var Il2 = pencere2.YDS.Ilerleme;
  var sonuc = Il2.birikmisiYay(adlar, 30, 'kelime');
  assert.deepStrictEqual({ tasinan: sonuc.tasinan, gun: sonuc.gun }, { tasinan: 10, gun: 2 },
    'yalnız 40 gecikmiş kart dağıtılır: 30 bugün, 10 yarın');
  var yeni = bellek2.get('yds-leitner');
  var bugunKalan = adlar.filter(function (ad) { return yeni[ad].k < 5 && yeni[ad].g <= gun; }).length;
  assert.strictEqual(bugunKalan, 30, 'bugünün payı gerçek tekrarlarla dolu');
  for (var m = 0; m < 50; m++) assert.strictEqual(yeni['mezun' + m].g, gun - 60 - m, 'mezun kartın tarihi değişmez');
})();

console.log('ilerleme-SRS: son kutu, tekrar önceliği, yanlış defteri, farklı-soru özeti, cihaz paylı sayaçlar ve birikmiş dağıtımı başarılı');
