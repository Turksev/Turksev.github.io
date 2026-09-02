'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var KOK = path.resolve(__dirname, '..', '..');
var aliasKaynak = JSON.parse(fs.readFileSync(
  path.join(KOK, 'tools', 'aile-kart-aliaslari.json'), 'utf8'));
var retKaynak = JSON.parse(fs.readFileSync(
  path.join(KOK, 'tools', 'aile-kart-retleri.json'), 'utf8'));
var manifest = JSON.parse(fs.readFileSync(
  path.join(KOK, 'tools', 'aile-manifest.json'), 'utf8'));
var provenans = JSON.parse(fs.readFileSync(
  path.join(KOK, 'data', 'aile-kart-provenans.json'), 'utf8'));

var pencere = { YDS: {} };
var baglam = { window: pencere };
vm.createContext(baglam);
function yukle(dosya) {
  vm.runInContext(fs.readFileSync(path.join(KOK, dosya), 'utf8'), baglam, { filename: dosya });
}
yukle('data/kelime-aliaslari.js');
yukle('assets/js/esitleme-veri.js');
yukle('data/kelime-dizin.js');
for (var katman = 1; katman <= 7; katman++) {
  yukle('data/kelime-k' + katman + '.js');
  yukle('data/test-k' + katman + '.js');
}

assert.strictEqual(aliasKaynak.schemaVersion, 1, 'alias şema sürümü');
assert.strictEqual(retKaynak.schemaVersion, 1, 'ret şema sürümü');
assert.strictEqual(aliasKaynak.policy.canonicalCardOnly, true, 'tek kanonik kart kuralı');
assert.strictEqual(aliasKaynak.policy.preserveProgress, true, 'alias ilerleme koruma kuralı');
assert.strictEqual(retKaynak.policy.noCardOrTest, true, 'ret kart/test üretmeme kuralı');

var dizin = new Set(Array.from(pencere.KELIME_DIZIN, function (x) { return x.e; }));
var kartlar = new Set();
var testler = new Set();
for (katman = 1; katman <= 7; katman++) {
  Object.keys(pencere['KELIME_K' + katman] || {}).forEach(function (x) { kartlar.add(x); });
  Object.keys(pencere['TEST_K' + katman] || {}).forEach(function (x) { testler.add(x); });
}
var uretilenAliaslar = pencere.YDS_KELIME_ALIASES;
var Motor = pencere.YDS.EsitlemeMotoru;
var roller = new Set(['metin', 'soru_koku', 'dogru_secenek', 'celdirici']);
var kaynakAliaslar = new Map();

function refDogrula(ref, etiket) {
  assert.deepStrictEqual(Object.keys(ref).sort(),
    ['exam_id', 'page', 'question', 'role', 'surface'], etiket + ': ref şeması');
  assert.ok(typeof ref.exam_id === 'string' && ref.exam_id, etiket + ': exam_id');
  assert.ok(typeof ref.surface === 'string' && ref.surface, etiket + ': surface');
  assert.ok(roller.has(ref.role), etiket + ': role');
}

aliasKaynak.aliases.forEach(function (kayit) {
  assert.strictEqual(kayit.decision, 'alias', kayit.candidate + ': karar');
  assert.ok(Number.isFinite(kayit.p), kayit.candidate + ': görünen puan');
  assert.strictEqual(kayit.source_refs.length, kayit.exams,
    kayit.candidate + ': sınav/ref sayısı');
  assert.strictEqual(new Set(kayit.source_refs.map(function (x) { return x.exam_id; })).size,
    kayit.exams, kayit.candidate + ': benzersiz sınav refs');
  kayit.source_refs.forEach(function (ref) { refDogrula(ref, kayit.candidate); });

  var parcalar = [{
    alias: kayit.candidate,
    canonical: kayit.canonical,
    kind: 'base',
    partOfSpeech: kayit.tip,
    source_refs: kayit.source_refs,
    reason: kayit.reason
  }].concat(kayit.surfaceAliases.map(function (yuzey) {
    yuzey.source_refs.forEach(function (ref) { refDogrula(ref, yuzey.alias); });
    return {
      alias: yuzey.alias,
      canonical: yuzey.canonical,
      kind: 'surfaceAlias',
      partOfSpeech: yuzey.tip,
      source_refs: yuzey.source_refs,
      reason: yuzey.reason
    };
  }));

  parcalar.forEach(function (parca) {
    assert.ok(!kaynakAliaslar.has(parca.alias), parca.alias + ': yinelenen alias kaynağı');
    kaynakAliaslar.set(parca.alias, parca);
    assert.ok(!dizin.has(parca.alias), parca.alias + ': alias kaynağı kart olmuş');
    assert.ok(dizin.has(parca.canonical), parca.alias + ': alias hedef kartı yok');
    assert.strictEqual(uretilenAliaslar[parca.alias], parca.canonical,
      parca.alias + ': üretilen alias hedefi');
    assert.strictEqual(Motor.kelimeKimligi(parca.alias), parca.canonical,
      parca.alias + ': arama/senkron kanonik çözümü');
    assert.strictEqual(Motor.eskiIlerlemeKimligi(parca.alias), parca.canonical,
      parca.alias + ': eski ilerleme çözümü');
    assert.deepStrictEqual(manifest.reviewedDecisions.aliases[parca.alias], {
      decision: 'alias',
      canonical: parca.canonical,
      kind: parca.kind,
      partOfSpeech: parca.partOfSpeech,
      displayScore: kayit.p,
      source_score: kayit.source_score,
      exams: kayit.exams,
      freq: kayit.freq,
      source_refs: parca.source_refs,
      reason: parca.reason
    }, parca.alias + ': manifest alias kararı');
  });
});

assert.strictEqual(uretilenAliaslar.categorized, 'categorised',
  'categorized sınav yüzeyi korunmuyor');
assert.strictEqual(uretilenAliaslar.colonized, 'colonise',
  'colonized sınav yüzeyi korunmuyor');
assert.strictEqual(uretilenAliaslar.favourably, 'favorably',
  'favourably kanonik karta bağlanmıyor');
assert.strictEqual(uretilenAliaslar.advisor, 'adviser',
  'advisor kanonik adviser kartına bağlanmıyor');
assert.strictEqual(uretilenAliaslar.offence, 'offense',
  'offence kanonik offense kartına bağlanmıyor');
assert.strictEqual(uretilenAliaslar.honorable, 'honourable',
  'honorable kanonik honourable kartına bağlanmıyor');
assert.strictEqual(uretilenAliaslar.optimization, 'optimisation',
  'optimization kanonik optimisation kartına bağlanmıyor');

Object.keys(uretilenAliaslar).forEach(function (baslangic) {
  var etkin = baslangic;
  var yol = new Set();
  while (Object.prototype.hasOwnProperty.call(uretilenAliaslar, etkin)) {
    assert.ok(!yol.has(etkin), baslangic + ': alias döngüsü');
    yol.add(etkin);
    etkin = uretilenAliaslar[etkin];
  }
});

var retler = new Map();
retKaynak.rejections.forEach(function (kayit) {
  assert.strictEqual(kayit.decision, 'reject', kayit.candidate + ': ret kararı');
  assert.ok(!retler.has(kayit.candidate), kayit.candidate + ': yinelenen ret');
  retler.set(kayit.candidate, kayit);
  assert.ok(Number.isFinite(kayit.p), kayit.candidate + ': ret görünen puan');
  assert.strictEqual(kayit.source_refs.length, kayit.exams,
    kayit.candidate + ': ret sınav/ref sayısı');
  kayit.source_refs.forEach(function (ref) { refDogrula(ref, kayit.candidate); });
  assert.ok(!dizin.has(kayit.candidate), kayit.candidate + ': reddedilen dizinde');
  assert.ok(!kartlar.has(kayit.candidate), kayit.candidate + ': reddedilen kart üretmiş');
  assert.ok(!testler.has(kayit.candidate), kayit.candidate + ': reddedilen test üretmiş');
  assert.deepStrictEqual(manifest.reviewedDecisions.rejectedCards[kayit.candidate], kayit,
    kayit.candidate + ': manifest ret kararı');
});

assert.deepStrictEqual(provenans.aliases, aliasKaynak.aliases,
  'alias provenansı kalıcı kaynakla farklı');
assert.deepStrictEqual(provenans.rejections, retKaynak.rejections,
  'ret provenansı kalıcı kaynakla farklı');
assert.strictEqual(Object.keys(manifest.reviewedDecisions.aliases).length, kaynakAliaslar.size,
  'manifestte fazladan/eksik alias kararı');
assert.strictEqual(Object.keys(manifest.reviewedDecisions.rejectedCards).length, retler.size,
  'manifestte fazladan/eksik ret kararı');
assert.strictEqual(aliasKaynak.aliases.length, 7, 'yedi temel yazım aliası korunmalı');
assert.strictEqual(kaynakAliaslar.size, 9, 'yedi temel ve iki yüzey aliası bulunmalı');
assert.strictEqual(retler.size, 17, 'üç önceki ve on dört medium ret korunmalı');

console.log('aile-kart-kararları: ' + kaynakAliaslar.size + ' alias (2 surface), ' +
  retler.size + ' ret; arama/senkron/provenans başarılı');
