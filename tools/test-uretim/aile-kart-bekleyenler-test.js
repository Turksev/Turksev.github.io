'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var KOK = path.resolve(__dirname, '..', '..');
var belge = JSON.parse(fs.readFileSync(
  path.join(KOK, 'tools', 'aile-kart-bekleyenler.json'), 'utf8'));
var manifest = JSON.parse(fs.readFileSync(
  path.join(KOK, 'tools', 'aile-manifest.json'), 'utf8'));
var aliaslar = JSON.parse(fs.readFileSync(
  path.join(KOK, 'tools', 'aile-kart-aliaslari.json'), 'utf8'));
var retler = JSON.parse(fs.readFileSync(
  path.join(KOK, 'tools', 'aile-kart-retleri.json'), 'utf8'));

var pencere = {};
var baglam = { window: pencere };
vm.createContext(baglam);
vm.runInContext(fs.readFileSync(path.join(KOK, 'data', 'kelime-dizin.js'), 'utf8'),
  baglam, { filename: 'data/kelime-dizin.js' });
for (var katman = 1; katman <= 7; katman++) {
  vm.runInContext(fs.readFileSync(path.join(KOK, 'data', 'test-k' + katman + '.js'), 'utf8'),
    baglam, { filename: 'data/test-k' + katman + '.js' });
}

assert.strictEqual(belge.schemaVersion, 1, 'bekleyen şema sürümü');
assert.strictEqual(belge.policy.status, 'manual-review-pending', 'bekleyen statüsü');
assert.strictEqual(belge.policy.noCardOrTest, true, 'bekleyen kart/test üretmeme kuralı');
assert.deepStrictEqual(belge.policy.filter,
  { confidence: 'medium', exams: 0, zipf: '< 3.5' }, 'bekleyen kaynak filtresi');
assert.ok(/^[0-9A-F]{64}$/.test(belge.policy.sourceSha256), 'kaynak CSV SHA-256');
assert.strictEqual(belge.summary.eligible, 478, 'düşük-Zipf orta aday toplamı');
assert.strictEqual(belge.summary.pending, 425, 'gerçek bekleyen toplamı');
assert.strictEqual(belge.summary.preExistingReviewed, 1, 'önceden incelenmiş istisna toplamı');
// 05.09.2026: tam kitapçıklar açılınca 52 adayın gerçek sınav kanıtı ortaya çıktı;
// bekleme gerekçesi (YDS kanıtı yok) ortadan kalktığı için karta dönüştürüldüler.
assert.strictEqual(belge.summary.examEvidenceAdd, 52, 'sınav kanıtıyla eklenen toplamı');
assert.strictEqual(belge.candidates.length, 478, 'ledger aday sayısı');

var site = new Set(Array.from(pencere.KELIME_DIZIN, function (x) { return x.e; }));
var testler = new Set();
for (katman = 1; katman <= 7; katman++) {
  Object.keys(pencere['TEST_K' + katman] || {}).forEach(function (word) { testler.add(word); });
}
var eklenen = new Set(Object.keys(manifest.reviewedDecisions.addedCards));
var aliasAdaylari = new Set(aliaslar.aliases.map(function (x) { return x.candidate; }));
var retAdaylari = new Set(retler.rejections.map(function (x) { return x.candidate; }));
var gorulen = new Set();
var onceki = '';
var istisnalar = [];

belge.candidates.forEach(function (kayit) {
  assert.ok(typeof kayit.candidate === 'string' && kayit.candidate,
    'bekleyen aday başlığı');
  assert.ok(!gorulen.has(kayit.candidate), kayit.candidate + ': ledgerda yineleniyor');
  gorulen.add(kayit.candidate);
  assert.ok(onceki < kayit.candidate, kayit.candidate + ': adaylar alfabetik değil');
  onceki = kayit.candidate;
  assert.strictEqual(kayit.confidence, 'medium', kayit.candidate + ': güven düzeyi');
  assert.ok(Number.isFinite(kayit.zipf) && kayit.zipf < 3.5,
    kayit.candidate + ': Zipf eşiği');
  assert.ok(!aliasAdaylari.has(kayit.candidate), kayit.candidate + ': alias kararıyla çakışıyor');
  assert.ok(!retAdaylari.has(kayit.candidate), kayit.candidate + ': ret kararıyla çakışıyor');
  if (kayit.decision === 'pending') {
    // Bekleme gerekçesi kanıt yokluğu; kanıt çıkarsa aday bu daldan çıkar.
    assert.strictEqual(kayit.exams, 0, kayit.candidate + ': bekleyen adayda sınav kanıtı');
    assert.strictEqual(kayit.reason, 'medium-below-zipf-threshold',
      kayit.candidate + ': bekleme gerekçesi');
    assert.ok(!site.has(kayit.candidate), kayit.candidate + ': bekleyen aday kart olmuş');
    assert.ok(!testler.has(kayit.candidate), kayit.candidate + ': bekleyen aday test olmuş');
    assert.ok(!eklenen.has(kayit.candidate), kayit.candidate + ': bekleyen aday add kararı almış');
  } else if (kayit.decision === 'exam-evidence-add') {
    // Ledger kurulduğunda kanıt yoktu; tam kitapçıklar açılınca ortaya çıktı.
    assert.strictEqual(kayit.reason, 'attested-in-newly-opened-full-booklets',
      kayit.candidate + ': sınav kanıtı gerekçesi');
    assert.ok(kayit.exams > 0, kayit.candidate + ': sınav kanıtı sayısı sıfır');
    assert.ok(typeof kayit.examYears === 'string' && kayit.examYears,
      kayit.candidate + ': sınav yılları eksik');
    assert.ok(site.has(kayit.candidate), kayit.candidate + ': kanıtlı aday sitede yok');
    istisnalar.push(kayit.candidate);
  } else {
    assert.strictEqual(kayit.decision, 'already-reviewed-add',
      kayit.candidate + ': bilinmeyen ledger kararı');
    assert.strictEqual(kayit.reason, 'pre-existing-human-reviewed-root-card',
      kayit.candidate + ': önceden incelenmiş gerekçe');
    assert.ok(site.has(kayit.candidate) && eklenen.has(kayit.candidate),
      kayit.candidate + ': belgelenen eski kart yok');
    istisnalar.push(kayit.candidate);
  }
});

// designate: tarihsel kök-kart istisnası. Kalan 52: tam kitapçıklar açılınca
// sınav kanıtı ortaya çıkanlar.
assert.ok(istisnalar.indexOf('designate') !== -1,
  'tarihsel kök-kart istisnası designate ledgerda yok');
assert.strictEqual(istisnalar.length, 53, 'ledger istisna toplamı');
console.log('aile-kart-bekleyenler: 478 uygun aday; 425 bekleyen, ' +
  '52 sınav kanıtıyla eklendi, designate tarihsel istisna');
