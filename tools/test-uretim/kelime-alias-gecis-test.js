'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var araKodu = fs.readFileSync(path.join(kok, 'assets', 'js', 'ara.js'), 'utf8');
assert.ok(araKodu.indexOf('Motor.kelimeKimligi(ham)') >= 0,
  'arama eski başlıkları kanonik kelimeye yönlendirmiyor');
var pencere = { YDS: {}, addEventListener: function () {} };
var baglam = {
  window: pencere,
  JSON: JSON,
  Date: Date,
  Math: Math,
  Object: Object,
  String: String,
  Array: Array,
  parseInt: parseInt
};
vm.createContext(baglam);

['data/kelime-aliaslari.js', 'assets/js/esitleme-veri.js'].forEach(function (dosya) {
  vm.runInContext(fs.readFileSync(path.join(kok, dosya), 'utf8'), baglam, { filename: dosya });
});

var M = pencere.YDS.EsitlemeMotoru;
var aliaslar = pencere.YDS_KELIME_ALIASES;
var ilerlemeKimlikleri = pencere.YDS_KELIME_ILERLEME_KIMLIKLERI;
var sade = function (v) { return JSON.parse(JSON.stringify(v)); };

assert.strictEqual(Object.keys(aliaslar).length, 9, 'beklenen alias sayısı');
Object.keys(aliaslar).forEach(function (eski) {
  assert.strictEqual(M.kelimeKimligi(eski), aliaslar[eski], eski + ' eşlenemedi');
  assert.strictEqual(M.kelimeKimligi(aliaslar[eski]), aliaslar[eski], 'hedef kararsız');
});
assert.deepStrictEqual(sade(ilerlemeKimlikleri), {
  'be bound to': '@kelime:be bound to',
  'be liable to': '@kelime:be liable to',
  'be prone to': '@kelime:be prone to',
  'hand down': '@kelime:hand down',
  'make peace': '@kelime:make peace',
  'used to': '@kelime:used to'
});
assert.strictEqual(M.kelimeIlerlemeKimligi('hand down'), '@kelime:hand down');
assert.strictEqual(M.kelimeIlerlemeKimligi('hand-down'), '@kelime:hand down');
assert.strictEqual(M.kelimeIlerlemeKimligi('make peace'), '@kelime:make peace');
assert.strictEqual(M.eskiIlerlemeKimligi('hand-down'), '@kelime:hand down');
assert.strictEqual(M.eskiIlerlemeKimligi('handed-down'), '@kelime:hand down');
assert.strictEqual(M.eskiIlerlemeKimligi('hand down'), 'hand down',
  'ham kanonik kimlik öbek kaydı olarak korunmalı');
assert.strictEqual(M.ilerlemeKimligi('hand down', 'kelime'), '@kelime:hand down');
assert.strictEqual(M.ilerlemeKimligi('hand down', 'obek'), 'hand down');
assert.deepStrictEqual(sade(M.ilerlemeKimliginiCoz('@kelime:hand down')),
  { ad: 'hand down', tur: 'kelime' });
assert.deepStrictEqual(sade(M.ilerlemeKimliginiCoz('hand down')),
  { ad: 'hand down', tur: 'obek' });

['data/kelime-dizin.js', 'data/obekler.js'].forEach(function (dosya) {
  vm.runInContext(fs.readFileSync(path.join(kok, dosya), 'utf8'), baglam, { filename: dosya });
});
var obekAdlari = new Set(pencere.OBEKLER.map(function (o) { return o.f; }));
var gercekCakismalar = pencere.KELIME_DIZIN.map(function (d) { return d.e; })
  .filter(function (ad) { return obekAdlari.has(ad); }).sort();
assert.deepStrictEqual(sade(gercekCakismalar), Object.keys(ilerlemeKimlikleri).sort(),
  'kelime–öbek kesişimi ile ayrık kimlik tablosu aynı olmalı');
gercekCakismalar.forEach(function (ad) {
  assert.strictEqual(ilerlemeKimlikleri[ad], '@kelime:' + ad,
    ad + ' için beklenmeyen iç kimlik');
});

var duzeltmeBelgesi = JSON.parse(fs.readFileSync(
  path.join(kok, 'tools', 'kelime-duzeltmeleri.json'), 'utf8'));
var kaynaktakiKimlikler = {};
duzeltmeBelgesi.duzeltmeler.forEach(function (d) {
  if (d.ilerleme_kimligi) kaynaktakiKimlikler[d.yeni] = d.ilerleme_kimligi;
});
var modalBelgesi = JSON.parse(fs.readFileSync(
  path.join(kok, 'tools', 'modal-kartlar.json'), 'utf8'));
modalBelgesi.cards.forEach(function (d) {
  if (d.progress_id) kaynaktakiKimlikler[d.e] = d.progress_id;
});
assert.deepStrictEqual(kaynaktakiKimlikler, sade(ilerlemeKimlikleri),
  'üretilen ilerleme kimlikleri kaynak belgelerden koptu');

// Sürüm 1 yerel/bulut verisinde eski tireli kelime aliasları kendi kelime
// kimliğinde birleşir; aynı görünen boşluklu öbek kaydı bağımsız kalır.
var eski = M.zarfaCevir({
  'yds-leitner': {
    'hand-down': { k: 2, g: 100, c: 40 },
    'handed-down': { k: 4, g: 180, c: 60 },
    'hand down': { k: 3, g: 140, c: 50 },
    'make-peace': { k: 2, g: 120, c: 45 },
    'make peace': { k: 5, g: 300, c: 80 }
  },
  'yds-test-yanlis': {
    'hand-down': { n: 2, t: 20 },
    'hand down': { n: 5, t: 10 },
    'shape-up': { n: 2, t: 20 },
    'shake-up': { n: 5, t: 10 }
  }
});
var paket = sade(M.paket(eski));
assert.deepStrictEqual(Object.keys(paket['yds-leitner']).sort(),
  ['@kelime:hand down', '@kelime:make peace', 'hand down', 'make peace']);
assert.deepStrictEqual(paket['yds-leitner']['@kelime:hand down'], { k: 4, g: 180, c: 60 });
assert.deepStrictEqual(paket['yds-leitner']['hand down'], { k: 3, g: 140, c: 50 });
assert.deepStrictEqual(paket['yds-leitner']['@kelime:make peace'], { k: 2, g: 120, c: 45 });
assert.deepStrictEqual(paket['yds-leitner']['make peace'], { k: 5, g: 300, c: 80 });
assert.deepStrictEqual(Object.keys(paket['yds-test-yanlis']).sort(),
  ['@kelime:hand down', 'hand down', 'shake-up']);
assert.deepStrictEqual(paket['yds-test-yanlis']['@kelime:hand down'], { n: 2, t: 20 });
assert.deepStrictEqual(paket['yds-test-yanlis']['hand down'], { n: 5, t: 10 });
assert.deepStrictEqual(paket['yds-test-yanlis']['shake-up'], { n: 5, t: 20, u: 20 });

// Sürüm 2 zarfındaki alias silme taşı yalnız kelime kartını siler; aynı görünen
// ham öbek kaydını silmez ve eski cihaz kelimeyi yeniden diriltemez.
var silinmis = {
  surum: 2,
  alanlar: {
    'yds-leitner': { i: {
      'make peace': { m: '100:A', v: { k: 3, g: 200, c: 90 } },
      'make-peace': { m: '200:B', d: 1 }
    } }
  }
};
paket = sade(M.paket(silinmis));
assert.deepStrictEqual(Object.keys(paket['yds-leitner']), ['make peace']);
assert.deepStrictEqual(paket['yds-leitner']['make peace'], { k: 3, g: 200, c: 90 });
var eskiCihaz = M.zarfaCevir({ 'yds-leitner': { 'make-peace': { k: 5, g: 999 } } });
paket = sade(M.paket(M.birlestir(silinmis, eskiCihaz)));
assert.deepStrictEqual(Object.keys(paket['yds-leitner']), ['make peace']);
assert.strictEqual(paket['yds-leitner']['@kelime:make peace'], undefined);

// Yeni yazma ve silme çağrıları da eski ad alsa bile yalnız doğru kimliği üretir.
var sira = 300;
var meta = function () { sira++; return sira + ':T'; };
var zarf = M.kayitlariYaz(M.zarfaCevir({}), 'yds-leitner',
  { 'film-make': { k: 2, g: 50, c: 45 } }, meta);
paket = sade(M.paket(zarf));
assert.deepStrictEqual(Object.keys(paket['yds-leitner']), ['filmmaking']);
zarf = M.kayitlariSil(zarf, 'yds-leitner', ['film-make'], meta);
assert.deepStrictEqual(Object.keys(M.paket(zarf)['yds-leitner']), []);

var kelimeId = M.kelimeIlerlemeKimligi('hand down');
zarf = M.kayitlariYaz(M.zarfaCevir({}), 'yds-leitner',
  (function () { var x = {}; x[kelimeId] = { k: 2, g: 70, c: 60 }; return x; })(), meta);
zarf = M.kayitlariYaz(zarf, 'yds-leitner',
  { 'hand down': { k: 4, g: 170, c: 160 } }, meta);
paket = sade(M.paket(zarf));
assert.deepStrictEqual(Object.keys(paket['yds-leitner']).sort(),
  ['@kelime:hand down', 'hand down']);
assert.strictEqual(paket['yds-leitner']['@kelime:hand down'].k, 2);
assert.strictEqual(paket['yds-leitner']['hand down'].k, 4);

// Daha önce v2'ye geçmiş yerel zarf da açılışta hemen kalıcı olarak düzelir;
// yalnız eski alias kayıtları küçük bir güvenlik yedeğinde tutulur.
var eskiV2 = {
  surum: 2,
  alanlar: {
    'yds-leitner': { i: {
      'hand-down': { m: '500:O', v: { k: 3, g: 250, c: 200 } }
    } }
  }
};
var disk = new Map([['yds-esitleme-v2', JSON.stringify(eskiV2)]]);
var olayDinleyicileri = {};
function Olay(tur, ayar) { this.type = tur; this.detail = ayar && ayar.detail; }
var pencere2 = {
  YDS: { Depo: {
    oku: function (anahtar, varsayilan) {
      return disk.has(anahtar) ? JSON.parse(disk.get(anahtar)) : varsayilan;
    },
    yaz: function (anahtar, deger) { disk.set(anahtar, JSON.stringify(deger)); return true; },
    sil: function (anahtar) { disk.delete(anahtar); }
  } },
  crypto: { getRandomValues: function (d) { d[0] = 7; d[1] = 9; return d; } },
  CustomEvent: Olay,
  addEventListener: function (tur, fn) { olayDinleyicileri[tur] = fn; },
  dispatchEvent: function () {}
};
var baglam2 = {
  window: pencere2, CustomEvent: Olay, Uint32Array: Uint32Array,
  JSON: JSON, Date: Date, Math: Math, Object: Object, String: String, Array: Array,
  parseInt: parseInt
};
vm.createContext(baglam2);
['data/kelime-aliaslari.js', 'assets/js/esitleme-veri.js', 'assets/js/esitleme-depo.js']
  .forEach(function (dosya) {
    vm.runInContext(fs.readFileSync(path.join(kok, dosya), 'utf8'), baglam2, { filename: dosya });
  });
var kaliciZarf = JSON.parse(disk.get('yds-esitleme-v2'));
assert.deepStrictEqual(Object.keys(kaliciZarf.alanlar['yds-leitner'].i), ['@kelime:hand down']);
assert.ok(JSON.parse(disk.get('yds-kelime-alias-gecis-yedegi'))
  .alanlar['yds-leitner']['hand-down']);
assert.ok(JSON.parse(disk.get('yds-leitner'))['@kelime:hand down']);

// Çalışma API'si aynı görünen kelime ve öbeği bağımsız kutularda ve bağımsız
// test-yanlış kayıtlarında tutar; iki yöndeki bölüm sıfırlaması karşı tarafı silmez.
var bellek = Object.create(null);
pencere.YDS.Depo = {
  oku: function (anahtar, varsayilan) {
    return Object.prototype.hasOwnProperty.call(bellek, anahtar)
      ? JSON.parse(bellek[anahtar]) : varsayilan;
  },
  yaz: function (anahtar, deger) {
    bellek[anahtar] = JSON.stringify(deger);
    return true;
  },
  sil: function (anahtar) {
    delete bellek[anahtar];
    return true;
  }
};
vm.runInContext(fs.readFileSync(path.join(kok, 'assets/js/ilerleme.js'), 'utf8'), baglam,
  { filename: 'assets/js/ilerleme.js' });
var I = pencere.YDS.Ilerleme;

I.dogru('hand-down', 'kelime');
I.dogru('hand down', 'obek');
I.dogru('hand down', 'obek');
assert.strictEqual(I.kutu('hand down', 'kelime'), 1);
assert.strictEqual(I.kutu('hand down', 'obek'), 2);
assert.deepStrictEqual(Object.keys(JSON.parse(bellek['yds-leitner'])).sort(),
  ['@kelime:hand down', 'hand down']);

I.testYanlis('hand down', 'kelime');
I.testYanlis('hand down', 'kelime');
I.testYanlis('hand down', 'obek');
assert.strictEqual(I.testYanlisSayisi('hand down', 'kelime'), 2);
assert.strictEqual(I.testYanlisSayisi('hand down', 'obek'), 1);
I.testDogru('hand down', 'obek');
assert.strictEqual(I.testYanlisSayisi('hand down', 'kelime'), 2);
assert.strictEqual(I.testYanlisSayisi('hand down', 'obek'), 1,
  'yanlış kaydı ilk doğru günde silinmemeli; iki ayrı doğru gün gerektirir');

assert.strictEqual(I.listeyiSifirla(['hand down'], 'kelime'), true);
assert.strictEqual(I.kutu('hand down', 'kelime'), 0);
assert.strictEqual(I.kutu('hand down', 'obek'), 1,
  'bağlam sorusundaki yanlış yalnız öbek kartını bir kutu düşürmeli');
I.dogru('hand down', 'kelime');
assert.strictEqual(I.listeyiSifirla(['hand down'], 'obek'), true);
assert.strictEqual(I.kutu('hand down', 'kelime'), 1);
assert.strictEqual(I.kutu('hand down', 'obek'), 0);

I.dogru('walk-to');
assert.ok(JSON.parse(bellek['yds-leitner'])['walking distance']);

console.log('kelime-alias-geçiş: 9 alias, 6 ayrık kelime kimliği ve kayıpsız göç başarılı');
