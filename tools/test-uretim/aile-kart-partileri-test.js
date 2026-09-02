'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var KOK = path.resolve(__dirname, '..', '..');
var pencere = {};
var baglam = { window: pencere };
vm.createContext(baglam);

function yukle(dosya) {
  vm.runInContext(fs.readFileSync(path.join(KOK, dosya), 'utf8'), baglam, { filename: dosya });
}

function sade(nesne) {
  return JSON.parse(JSON.stringify(nesne));
}

function katmanBul(puan) {
  if (puan >= 40) return 1;
  if (puan >= 30) return 2;
  if (puan >= 25) return 3;
  if (puan >= 17) return 4;
  if (puan >= 12) return 5;
  if (puan >= 10) return 6;
  return 7;
}

function kelimeDeseni(kelime) {
  return new RegExp('(^|[^A-Za-z])(' + kelime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    ')(?=$|[^A-Za-z])', 'gi');
}

yukle('data/kelime-dizin.js');
for (var katman = 1; katman <= 7; katman++) {
  yukle('data/kelime-k' + katman + '.js');
  yukle('data/test-k' + katman + '.js');
}

var dizin = new Map(Array.from(pencere.KELIME_DIZIN, function (x) { return [x.e, sade(x)]; }));
var kartlar = new Map();
var testler = new Map();
for (katman = 1; katman <= 7; katman++) {
  Object.keys(pencere['KELIME_K' + katman] || {}).forEach(function (kelime) {
    kartlar.set(kelime, { layer: katman, card: sade(pencere['KELIME_K' + katman][kelime]) });
  });
  Object.keys(pencere['TEST_K' + katman] || {}).forEach(function (kelime) {
    testler.set(kelime, { layer: katman, test: sade(pencere['TEST_K' + katman][kelime]) });
  });
}

var manifest = JSON.parse(fs.readFileSync(path.join(KOK, 'tools', 'aile-manifest.json'), 'utf8'));
var provenans = JSON.parse(fs.readFileSync(path.join(KOK, 'data', 'aile-kart-provenans.json'), 'utf8'));
assert.strictEqual(provenans.schemaVersion, 1, 'provenans şema sürümü');
var provenansPartileri = new Map(provenans.batches.map(function (x) { return [x.batchId, x]; }));

var partiDizini = path.join(KOK, 'tools', 'aile-kart-partileri');
var dosyalar = fs.readdirSync(partiDizini).filter(function (ad) { return /\.json$/i.test(ad); }).sort();
var gorulen = new Set();
var refSayisi = 0;
var beklenenKartSayisi = 0;
var beklenenRefSayisi = 0;
var partiOzetleri = new Map();
dosyalar.forEach(function (ad) {
  var parti = JSON.parse(fs.readFileSync(path.join(partiDizini, ad), 'utf8'));
  assert.strictEqual(parti.schemaVersion, 1, ad + ': schemaVersion');
  assert.strictEqual(parti.policy.displayScoreDecimals, 1, ad + ': puan görünümü');
  assert.strictEqual(parti.policy.lowScoreLayerRule, 'source_score < 10 => K7', ad + ': K7 kuralı');
  assert.strictEqual(parti.policy.preserveExistingLexicalizedCards, true,
    ad + ': sözlükselleşmiş kartları koruma kuralı');
  beklenenKartSayisi += parti.cards.length;
  var partiRefSayisi = parti.cards.reduce(function (toplam, kart) {
    return toplam + kart.source_refs.length;
  }, 0);
  beklenenRefSayisi += partiRefSayisi;
  partiOzetleri.set(parti.batchId, { cards: parti.cards.length, refs: partiRefSayisi });
  var girdi = JSON.parse(fs.readFileSync(path.join(KOK, 'tools', 'test-uretim', 'girdi',
    parti.batchId + '.json'), 'utf8'));
  var cikti = JSON.parse(fs.readFileSync(path.join(KOK, 'tools', 'test-uretim', 'cikti',
    parti.batchId + '.json'), 'utf8'));
  var girdiMap = new Map(girdi.map(function (x) { return [x.e, x]; }));
  var ciktiMap = new Map(cikti.map(function (x) { return [x.e, x]; }));
  var provParti = provenansPartileri.get(parti.batchId);
  assert.ok(provParti, parti.batchId + ': provenans partisi yok');
  assert.strictEqual(provParti.source, 'tools/aile-kart-partileri/' + ad,
    parti.batchId + ': provenans kaynak yolu');
  var provMap = new Map(provParti.cards.map(function (x) { return [x.candidate, x]; }));

  assert.strictEqual(girdi.length, parti.cards.length, parti.batchId + ': girdi sayısı');
  assert.strictEqual(cikti.length, parti.cards.length, parti.batchId + ': çıktı sayısı');
  assert.strictEqual(provParti.cards.length, parti.cards.length, parti.batchId + ': provenans sayısı');

  parti.cards.forEach(function (kaynak) {
    var kelime = kaynak.candidate;
    assert.ok(!gorulen.has(kelime), kelime + ': partilerde yineleniyor');
    gorulen.add(kelime);
    assert.strictEqual(kaynak.decision, 'add', kelime + ': karar');
    // Görünen puanı Python üreticisi half-even round ile oluşturur (örn. 8.25 → 8.2).
    // JS toFixed farklı bağlayabildiği için burada otorite batch p alanıdır.
    assert.ok(Number.isFinite(kaynak.p) && Math.abs(kaynak.p * 10 -
      Math.round(kaynak.p * 10)) < 1e-9, kelime + ': görünen puan bir ondalık değil');
    var beklenenKatman = kaynak.source_score < 10 ? 7 : katmanBul(kaynak.source_score);
    var dizinKaydi = dizin.get(kelime);
    assert.ok(dizinKaydi, kelime + ': dizinde yok');
    assert.strictEqual(dizinKaydi.p, kaynak.p, kelime + ': dizin puanı');
    assert.strictEqual(dizinKaydi.k, beklenenKatman, kelime + ': tam puan katmanı');
    assert.strictEqual(dizinKaydi.y, kaynak.tip, kelime + ': dizin türü');

    var kart = kartlar.get(kelime);
    assert.ok(kart, kelime + ': tam kart yok');
    assert.strictEqual(kart.layer, beklenenKatman, kelime + ': kart dosyası katmanı');
    assert.strictEqual(kart.card.a.length, kaynak.meanings.length, kelime + ': anlam sayısı');
    kaynak.meanings.forEach(function (anlam, i) {
      assert.strictEqual(kart.card.a[i].tr, anlam.tr, kelime + ': anlam tr ' + i);
      assert.strictEqual(kart.card.a[i].ex, anlam.ex, kelime + ': anlam ex ' + i);
      assert.strictEqual(kart.card.a[i].exTr, anlam.exTr, kelime + ': anlam exTr ' + i);
      if (kaynak.meanings.length > 1) {
        var beklenenYildiz = i === 0 ? parti.policy.meaningStars.primary :
          parti.policy.meaningStars.secondary;
        assert.strictEqual(kart.card.a[i].yz, anlam.yz || beklenenYildiz,
          kelime + ': anlam yıldızı ' + i);
      }
    });

    var desen = kelimeDeseni(kelime);
    var eslesme = 0;
    var bosluklu = kaynak.test_sentence.replace(desen, function (_, oncesi) {
      eslesme++;
      return oncesi + '----';
    });
    assert.strictEqual(eslesme, 1, kelime + ': test aday sayısı');
    assert.strictEqual((bosluklu.match(/----/g) || []).length, 1, kelime + ': test boşluğu');
    var test = testler.get(kelime);
    assert.ok(test, kelime + ': Günün Testi kaydı yok');
    assert.strictEqual(test.layer, beklenenKatman, kelime + ': test katmanı');
    assert.deepStrictEqual(test.test, {
      c: bosluklu, b: kelime, f: '', tr: kaynak.test_sentence_tr
    }, kelime + ': Günün Testi kaynak cümleden üretilmedi');
    var ciktiKaydi = ciktiMap.get(kelime);
    assert.deepStrictEqual(ciktiKaydi, {
      e: kelime, c: bosluklu, b: kelime, f: '', tr: kaynak.test_sentence_tr
    }, kelime + ': kalıcı test çıktısı');
    var girdiKaydi = girdiMap.get(kelime);
    assert.ok(girdiKaydi && girdiKaydi.ornek.length === kaynak.meanings.length,
      kelime + ': kalıcı test girdisi');

    var karar = manifest.reviewedDecisions.addedCards[kelime];
    assert.ok(karar && karar.decision === 'add', kelime + ': manifest add kararı');
    assert.strictEqual(karar.source_score, kaynak.source_score, kelime + ': manifest source_score');
    var prov = provMap.get(kelime);
    assert.ok(prov, kelime + ': öğe provenansı yok');
    assert.strictEqual(prov.source_score, kaynak.source_score, kelime + ': provenans source_score');
    assert.strictEqual(prov.display_score, kaynak.p, kelime + ': provenans görünen puan');
    assert.strictEqual(prov.layer, beklenenKatman, kelime + ': provenans katmanı');
    assert.deepStrictEqual(prov.source_refs, kaynak.source_refs, kelime + ': provenans refs');
    assert.deepStrictEqual(prov.lexical_refs, kaynak.oewn_refs || [],
      kelime + ': provenans sözlüksel refs');
    prov.source_refs.forEach(function (ref) {
      assert.deepStrictEqual(Object.keys(ref).sort(),
        ['exam_id', 'page', 'question', 'role', 'surface'], kelime + ': telifsiz ref alanları');
      assert.ok(['metin', 'soru_koku', 'dogru_secenek', 'celdirici'].indexOf(ref.role) !== -1,
        kelime + ': ref rolü');
      refSayisi++;
    });
  });
});

assert.strictEqual(gorulen.size, beklenenKartSayisi,
  'tüm partilerin kart toplamı kadar benzersiz kart bulunmalı');
assert.strictEqual(refSayisi, beklenenRefSayisi,
  'tüm partilerin source_refs toplamı provenansta bulunmalı');
assert.deepStrictEqual(partiOzetleri.get('yds-high-01'), { cards: 61, refs: 71 },
  'yds-high-01 için 61 kart/71 referans regresyonu');
assert.deepStrictEqual(partiOzetleri.get('yds-medium-01'), { cards: 65, refs: 0 },
  'yds-medium-01 için 65 kart/0 referans regresyonu');
assert.deepStrictEqual(partiOzetleri.get('yds-medium-02'), { cards: 71, refs: 0 },
  'yds-medium-02 için 71 kart/0 referans regresyonu');
assert.deepStrictEqual(partiOzetleri.get('yds-medium-03'), { cards: 75, refs: 0 },
  'yds-medium-03 için 75 kart/0 referans regresyonu');
assert.strictEqual(gorulen.size, 498, 'tüm denetimli aile partilerinin kart toplamı');
assert.strictEqual(dizin.get('identity').y, 'isim', 'identity yalnız isim olmalı');
assert.strictEqual(dizin.get('injury').y, 'isim', 'injury yalnız isim olmalı');

console.log('aile-kart-partileri: ' + gorulen.size + ' kart, ' + refSayisi +
  ' telifsiz referans, katman/anlam/test/provenans başarılı');
