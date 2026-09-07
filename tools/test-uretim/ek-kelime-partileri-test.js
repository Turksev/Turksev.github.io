'use strict';

// Ek kelime partileri (tools/ek-kelime-partileri/*.json): xlsx'te olmayan,
// denetimli kelime/öbek kayıtlarının şeması ve yayımlanan veriyle birebirliği.
//
// Denetlenenler:
//   1. Şema: sema_surumu, parti_id = dosya adı, aciklama/gerekce/kaynak,
//      kurallar {xlsx_catisma:"hata", katman_korunur:true, mevcut_kaydi_ezme:false},
//      gruplar, kayıt alanları (e, y, t, p, k, g, a, kl, es, gerekce, kanit),
//      öbek alanları (f, y, s, kn, g, a, kanit).
//   2. Çakışma: bir parti kaydı, betiğin okunabilir diğer kaynaklarında
//      (ek-kelimeler, ek-aile-uyeleri, aile-kart-partileri, modal-kartlar,
//      kelime-duzeltmeleri, aile alias/ret kayıtları, kelime-eleme, ek-obekler)
//      bulunamaz. xlsx CI'da yoktur; xlsx ile çakışma listeyi-aktar.py'de
//      üretim anında hata olarak yakalanır ve burada dizin karşılaştırmasına
//      yansır (xlsx kaydı kazanırsa parti ile dizin ayrışır).
//   3. Birebirlik: her kayıt dizinde vardır ve t/p/k/y aynıdır; kart tam olarak
//      partideki k katman dosyasındadır ve a/kl/es aynıdır (k aynen korunur,
//      puan bandına göre yeniden hesaplanmaz); her öbek obekler.js'de aynıdır.

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');
var beklenenKart = require('./kart-icerik-beklenen').beklenenKart;

var KOK = path.resolve(__dirname, '..', '..');
var pencere = {};
var baglam = { window: pencere };
vm.createContext(baglam);

function yukle(dosya) {
  vm.runInContext(fs.readFileSync(path.join(KOK, dosya), 'utf8'), baglam, { filename: dosya });
}
function metin(dosya) { return fs.readFileSync(path.join(KOK, dosya), 'utf8'); }
function okuJson(dosya) { return JSON.parse(metin(dosya)); }
function sade(x) { return JSON.parse(JSON.stringify(x)); }
function doluMetin(x) { return typeof x === 'string' && x.trim().length > 0; }
function jsDize(ham) { return JSON.parse('"' + ham + '"'); }

var KAYIT_ALANLARI = ['e', 'y', 't', 'p', 'k', 'g', 'a', 'kl', 'es', 'gerekce', 'kanit'];
var OBEK_ALANLARI = ['f', 'y', 's', 'kn', 'g', 'a', 'kanit'];

yukle('tools/tur-duzeltme.js');
yukle('data/kelime-dizin.js');
for (var katman = 1; katman <= 7; katman++) yukle('data/kelime-k' + katman + '.js');
yukle('data/obekler.js');

var dizin = new Map(Array.from(pencere.KELIME_DIZIN, function (x) { return [x.e, sade(x)]; }));
var kartlar = new Map();
for (katman = 1; katman <= 7; katman++) {
  Object.keys(pencere['KELIME_K' + katman] || {}).forEach(function (kelime) {
    assert.ok(!kartlar.has(kelime), kelime + ': iki katman dosyasında');
    kartlar.set(kelime, { layer: katman, card: sade(pencere['KELIME_K' + katman][kelime]) });
  });
}
var obekler = new Map(Array.from(pencere.OBEKLER, function (x) { return [x.f, sade(x)]; }));

// --- Betiğin diğer (okunabilir) kaynakları: ek parti bunları ezemez.
var digerKaynaklar = new Map();
function kaynakEkle(ad, dosya) { if (!digerKaynaklar.has(ad)) digerKaynaklar.set(ad, dosya); }
var m;
var ekKelimeler = metin('tools/ek-kelimeler.js');
var reEn = /\{en:"((?:[^"\\]|\\.)*)"/g;
while ((m = reEn.exec(ekKelimeler))) kaynakEkle(jsDize(m[1]), 'tools/ek-kelimeler.js');

var ekAile = metin('tools/ek-aile-uyeleri.js');
var aileBas = ekAile.indexOf('{', ekAile.indexOf('EK_AILE_UYELERI'));
var aileGovde = ekAile.slice(aileBas, ekAile.lastIndexOf('}') + 1).replace(/\/\*[\s\S]*?\*\//g, '');
Object.keys(JSON.parse(aileGovde)).forEach(function (ad) { kaynakEkle(ad, 'tools/ek-aile-uyeleri.js'); });

fs.readdirSync(path.join(KOK, 'tools', 'aile-kart-partileri'))
  .filter(function (ad) { return /\.json$/i.test(ad); }).sort().forEach(function (ad) {
    okuJson('tools/aile-kart-partileri/' + ad).cards.forEach(function (kart) {
      kaynakEkle(kart.candidate, 'tools/aile-kart-partileri/' + ad);
    });
  });
okuJson('tools/modal-kartlar.json').cards.forEach(function (kart) {
  kaynakEkle(kart.e, 'tools/modal-kartlar.json');
});
okuJson('tools/kelime-duzeltmeleri.json').duzeltmeler.forEach(function (d) {
  kaynakEkle(d.yeni, 'tools/kelime-duzeltmeleri.json');
  (d.eskiler || []).forEach(function (eski) { kaynakEkle(eski, 'tools/kelime-duzeltmeleri.json'); });
});
okuJson('tools/aile-kart-aliaslari.json').aliases.forEach(function (a) {
  kaynakEkle(a.candidate, 'tools/aile-kart-aliaslari.json');
  (a.surfaceAliases || []).forEach(function (y) { kaynakEkle(y.alias, 'tools/aile-kart-aliaslari.json'); });
});
okuJson('tools/aile-kart-retleri.json').rejections.forEach(function (r) {
  kaynakEkle(r.candidate, 'tools/aile-kart-retleri.json');
});
var eleme = metin('tools/kelime-eleme.js');
eleme = eleme.slice(eleme.indexOf('window.KELIME_ELEME'));
var reEleme = /"([a-z\-' ]+)"/g;
while ((m = reEleme.exec(eleme))) kaynakEkle(m[1], 'tools/kelime-eleme.js');

var obekKaynaklari = new Map();
var ekObekler = metin('tools/ek-obekler.js');
var reF = /\{f:"((?:[^"\\]|\\.)*)"/g;
while ((m = reF.exec(ekObekler))) obekKaynaklari.set(jsDize(m[1]), 'tools/ek-obekler.js');

// --- Partiler
var partiDizini = path.join(KOK, 'tools', 'ek-kelime-partileri');
var dosyalar = fs.readdirSync(partiDizini).filter(function (ad) { return /\.json$/i.test(ad); }).sort();
assert.ok(dosyalar.length >= 1, 'en az bir ek kelime partisi bekleniyor');

var gorulenKelime = new Map();
var gorulenObek = new Map();
var ozetler = new Map();

function anlamlariDogrula(etiket, anlamlar) {
  assert.ok(Array.isArray(anlamlar) && anlamlar.length, etiket + ': a (anlamlar) boş');
  anlamlar.forEach(function (anlam, j) {
    var yer = etiket + ' a[' + j + ']';
    Object.keys(anlam).forEach(function (alan) {
      assert.ok(['tr', 'ex', 'exTr', 'yz'].indexOf(alan) !== -1, yer + ': bilinmeyen alan ' + alan);
    });
    assert.ok(doluMetin(anlam.tr) && doluMetin(anlam.ex) && doluMetin(anlam.exTr), yer + ': tr/ex/exTr');
    if (anlam.yz !== undefined || anlamlar.length > 1) {
      assert.ok(Number.isInteger(anlam.yz) && anlam.yz >= 1 && anlam.yz <= 4, yer + ': yz 1-4 olmalı');
    }
  });
}

dosyalar.forEach(function (ad) {
  var parti = okuJson('tools/ek-kelime-partileri/' + ad);
  assert.strictEqual(parti.sema_surumu, 1, ad + ': sema_surumu');
  assert.strictEqual(parti.parti_id, ad.replace(/\.json$/i, ''), ad + ': parti_id dosya adıyla aynı olmalı');
  assert.ok(doluMetin(parti.aciklama), ad + ': aciklama eksik');
  assert.ok(doluMetin(parti.gerekce), ad + ': gerekce eksik');
  assert.ok(parti.kaynak && typeof parti.kaynak === 'object' && Object.keys(parti.kaynak).length,
    ad + ': kaynak nesnesi eksik');
  assert.ok(parti.kurallar && typeof parti.kurallar === 'object', ad + ': kurallar eksik');
  assert.deepStrictEqual({
    xlsx_catisma: parti.kurallar.xlsx_catisma,
    katman_korunur: parti.kurallar.katman_korunur,
    mevcut_kaydi_ezme: parti.kurallar.mevcut_kaydi_ezme
  }, { xlsx_catisma: 'hata', katman_korunur: true, mevcut_kaydi_ezme: false }, ad + ': kurallar');
  var gruplar = parti.gruplar || {};
  Object.keys(gruplar).forEach(function (g) {
    assert.ok(doluMetin(gruplar[g].aciklama), ad + ' gruplar[' + g + ']: aciklama eksik');
  });
  var kayitlar = parti.kayitlar || [];
  var obekKayitlari = parti.obekler || [];
  assert.ok(Array.isArray(kayitlar) && Array.isArray(obekKayitlari) &&
    (kayitlar.length || obekKayitlari.length), ad + ': kayitlar ya da obekler gerekli');

  var grupSayisi = {};
  var katmanSayisi = {};
  kayitlar.forEach(function (kayit, i) {
    var etiket = ad + ' kayitlar[' + i + ']';
    Object.keys(kayit).forEach(function (alan) {
      assert.ok(KAYIT_ALANLARI.indexOf(alan) !== -1, etiket + ': bilinmeyen alan ' + alan);
    });
    var en = kayit.e;
    assert.ok(doluMetin(en) && en === en.trim(), etiket + ': e eksik ya da kenar boşluklu');
    assert.ok(!gorulenKelime.has(en), en + ': partilerde yineleniyor (' + gorulenKelime.get(en) + ')');
    gorulenKelime.set(en, ad);
    assert.ok(!digerKaynaklar.has(en),
      en + ': ana kaynakta zaten var (' + digerKaynaklar.get(en) + '); ek parti mevcut kaydı ezemez');
    assert.ok(doluMetin(kayit.y), en + ': y (tür) eksik');
    assert.ok(doluMetin(kayit.t), en + ': t (kısa anlam) eksik');
    if (kayit.p === null) {
      assert.ok(doluMetin(kayit.gerekce), en + ': puansız kayıt gerekçe ister');
    } else {
      assert.ok(typeof kayit.p === 'number' && kayit.p >= 0 && kayit.p <= 100 &&
        Math.abs(kayit.p * 10 - Math.round(kayit.p * 10)) < 1e-9, en + ': p bir ondalık puan olmalı');
    }
    assert.ok(Number.isInteger(kayit.k) && kayit.k >= 1 && kayit.k <= 7, en + ': k 1-7 olmalı');
    if (kayit.g !== undefined) assert.ok(gruplar[kayit.g], en + ': g tanımsız grup ' + kayit.g);
    grupSayisi[kayit.g] = (grupSayisi[kayit.g] || 0) + 1;
    katmanSayisi[kayit.k] = (katmanSayisi[kayit.k] || 0) + 1;
    anlamlariDogrula(en, kayit.a);
    if (kayit.kl !== undefined) {
      assert.ok(Array.isArray(kayit.kl) && kayit.kl.length, en + ': kl boş olamaz');
      kayit.kl.forEach(function (x, j) {
        assert.ok(x && Object.keys(x).length === 2 && doluMetin(x.en) && doluMetin(x.tr),
          en + ' kl[' + j + ']: {en, tr} dolu olmalı');
      });
    }
    if (kayit.es !== undefined) assert.ok(doluMetin(kayit.es), en + ': es boş olamaz');
    if (kayit.kanit !== undefined) {
      assert.ok(kayit.kanit && typeof kayit.kanit === 'object' && !Array.isArray(kayit.kanit),
        en + ': kanit nesne olmalı');
    }

    // Yayımlanan veriyle birebir: dizin alanları, katman dosyası ve kart.
    var d = dizin.get(en);
    assert.ok(d, en + ': dizinde yok');
    assert.deepStrictEqual({ t: d.t, p: d.p, k: d.k, y: d.y },
      { t: kayit.t, p: kayit.p === null ? undefined : kayit.p, k: kayit.k, y: pencere.TUR_DUZELTME[en] || kayit.y },
      en + ': dizin alanları parti + manuel tür düzeltmesiyle farklı');
    var kart = kartlar.get(en);
    assert.ok(kart, en + ': tam kart yok');
    assert.strictEqual(kart.layer, kayit.k, en + ': kart dosyası katmanı (partideki k aynen korunmalı)');
    var beklenen = { a: kayit.a };
    if (kayit.es) beklenen.es = kayit.es;
    if (kayit.kl) beklenen.kl = kayit.kl;
    assert.deepStrictEqual(kart.card, beklenenKart(en, beklenen), en + ': kart içeriği (a/kl/es) parti + korumalı editoryal düzeltmeyle farklı');
  });

  var obekGrupSayisi = {};
  obekKayitlari.forEach(function (obek, i) {
    var etiket = ad + ' obekler[' + i + ']';
    Object.keys(obek).forEach(function (alan) {
      assert.ok(OBEK_ALANLARI.indexOf(alan) !== -1, etiket + ': bilinmeyen alan ' + alan);
    });
    var f = obek.f;
    assert.ok(doluMetin(f) && f === f.trim(), etiket + ': f eksik ya da kenar boşluklu');
    assert.ok(!gorulenObek.has(f), f + ': partilerde yineleniyor (' + gorulenObek.get(f) + ')');
    gorulenObek.set(f, ad);
    assert.ok(!obekKaynaklari.has(f), f + ': ek-obekler.js kaynağında zaten var');
    assert.ok(doluMetin(obek.y), f + ': y (tür) eksik');
    assert.ok(Number.isInteger(obek.s) && obek.s >= 0, f + ': s negatif olmayan tam sayı olmalı');
    if (obek.kn !== undefined) assert.ok(doluMetin(obek.kn), f + ': kn boş olamaz');
    if (obek.g !== undefined) assert.ok(gruplar[obek.g], f + ': g tanımsız grup ' + obek.g);
    obekGrupSayisi[obek.g] = (obekGrupSayisi[obek.g] || 0) + 1;
    anlamlariDogrula(f, obek.a);
    var yayimlanan = obekler.get(f);
    assert.ok(yayimlanan, f + ': obekler.js içinde yok');
    assert.deepStrictEqual(yayimlanan,
      { f: f, y: obek.y, s: obek.s, kn: obek.kn === undefined ? 'sınav' : obek.kn, a: obek.a },
      f + ': yayımlanan öbek partiyle farklı');
  });

  ozetler.set(parti.parti_id, {
    kelime: kayitlar.length, obek: obekKayitlari.length,
    grup: grupSayisi, obekGrup: obekGrupSayisi, katman: katmanSayisi
  });
});

// --- Regresyon: 5 Eylül 2026 A2 denetim partisi (4-5 Eylül sınav eklemeleri).
var a2 = ozetler.get('2026-09-05_denetim-A2_korunan');
assert.ok(a2, '2026-09-05_denetim-A2_korunan partisi yok');
assert.deepStrictEqual(a2, {
  kelime: 939, obek: 246,
  grup: { 'tam-kitapcik-2024-2026': 690, 'gorsel-transkript-2023': 181, 'aile-turevi-zipf': 68 },
  obekGrup: { 'tam-kitapcik-2024-2026': 184, 'gorsel-transkript-2023': 62 },
  katman: { 5: 70, 6: 801, 7: 68 }
}, 'A2 denetim partisi sayı regresyonu');

// Ledger'da sınav kanıtıyla eklendi denen 52 aday: kartlarının tek kaynağı bu partidir.
var kanitliAdaylar = okuJson('tools/aile-kart-bekleyenler.json').candidates
  .filter(function (c) { return c.decision === 'exam-evidence-add'; })
  .map(function (c) { return c.candidate; });
assert.strictEqual(kanitliAdaylar.length, 52, 'exam-evidence-add aday sayısı');
kanitliAdaylar.forEach(function (aday) {
  assert.ok(gorulenKelime.has(aday), aday + ': exam-evidence-add adayının kartı ek partide olmalı');
});

console.log('ek-kelime-partileri: ' + dosyalar.length + ' parti, ' + gorulenKelime.size +
  ' kelime, ' + gorulenObek.size + ' öbek; şema, kaynak çakışması ve yayımlanan veriyle birebirlik başarılı');
