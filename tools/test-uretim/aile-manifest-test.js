'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var KOK = path.resolve(__dirname, '..', '..');
var manifest = JSON.parse(fs.readFileSync(path.join(KOK, 'tools', 'aile-manifest.json'), 'utf8'));
var pencere = {};
var baglam = { window: pencere };
vm.createContext(baglam);

function yukle(dosya) {
  vm.runInContext(fs.readFileSync(path.join(KOK, dosya), 'utf8'), baglam, { filename: dosya });
}

yukle('data/kelime-dizin.js');
yukle('data/aileler.js');

var dizinKayitlari = Array.from(pencere.KELIME_DIZIN);
var dizin = new Set(dizinKayitlari.map(function (x) { return x.e; }));
var turler = new Map(dizinKayitlari.map(function (x) { return [x.e, x.y]; }));
var aileler = Array.from(pencere.AILELER);
var uyeAilesi = new Map();
var kokler = new Set();

assert.strictEqual(manifest.schemaVersion, 1, 'manifest şema sürümü');
assert.strictEqual(manifest.policy.source, 'migrated-baseline',
  'temel manifestin taşınmış kökeni dürüstçe belirtilmeli');
assert.strictEqual(manifest.policy.reviewStatus.approvedFamilies, 'migrated-not-fully-reviewed',
  'taşınmış temel aileler tümüyle incelenmiş gibi gösterilmemeli');
assert.strictEqual(manifest.policy.reviewStatus.requiredFamilies, 'human-reviewed',
  'zorunlu bağlar insan denetimli olmalı');
assert.strictEqual(manifest.policy.reviewStatus.forbiddenPairs, 'human-reviewed',
  'yasak bağlar insan denetimli olmalı');
assert.strictEqual(manifest.policy.automaticRules, 'candidate-only',
  'otomatik kurallar yayımlayıcı olmamalı');

var kararlar = manifest.reviewedDecisions;
assert.ok(kararlar && typeof kararlar === 'object', 'reviewedDecisions zorunlu');
assert.strictEqual(kararlar.posSource, 'data/kelime-dizin.js:y', 'POS kanıt kaynağı');
assert.strictEqual(kararlar.partsOfSpeechOrder, 'matches-target-member-order',
  'POS sırası hedef üye sırasını izlemeli');

function kararDogrula(etiket, karar, uyeler, beklenenKarar) {
  assert.ok(karar && typeof karar === 'object', etiket + ': karar kaydı yok');
  assert.strictEqual(karar.decision, beklenenKarar, etiket + ': karar türü');
  assert.ok(kararlar.evidenceCatalog[karar.evidence], etiket + ': kanıt kodu katalogda yok');
  assert.ok(kararlar.reasonCatalog[karar.reason], etiket + ': gerekçe kodu katalogda yok');
  assert.strictEqual(karar.partsOfSpeech.length, uyeler.length,
    etiket + ': POS sayısı üye sayısıyla eşleşmiyor');
  uyeler.forEach(function (uye, i) {
    assert.ok(typeof karar.partsOfSpeech[i] === 'string' && karar.partsOfSpeech[i],
      etiket + ': boş POS kanıtı (' + uye + ')');
    if (dizin.has(uye)) assert.strictEqual(karar.partsOfSpeech[i], turler.get(uye),
      etiket + ': POS kanıtı kart diziniyle eşleşmiyor (' + uye + ')');
  });
}

assert.deepStrictEqual(Object.keys(kararlar.requiredFamilies).sort(),
  Object.keys(manifest.requiredFamilies).sort(),
  'zorunlu aile karar metadatası bire bir eşleşmeli');
Object.keys(manifest.requiredFamilies).forEach(function (kok) {
  kararDogrula('requiredFamilies/' + kok, kararlar.requiredFamilies[kok],
    manifest.requiredFamilies[kok], 'same-family');
});

var yasakKararAnahtarlari = manifest.forbiddenPairs.map(function (cift) {
  return cift.join('|');
});
assert.deepStrictEqual(Object.keys(kararlar.forbiddenPairs).sort(), yasakKararAnahtarlari.sort(),
  'yasak bağ karar metadatası bire bir eşleşmeli');
manifest.forbiddenPairs.forEach(function (cift) {
  kararDogrula('forbiddenPairs/' + cift.join('|'), kararlar.forbiddenPairs[cift.join('|')],
    cift, 'keep-separate');
});

var partiDizini = path.join(KOK, 'tools', 'aile-kart-partileri');
var partiKartlari = new Map();
fs.readdirSync(partiDizini).filter(function (ad) { return /\.json$/i.test(ad); }).sort()
  .forEach(function (ad) {
    var parti = JSON.parse(fs.readFileSync(path.join(partiDizini, ad), 'utf8'));
    assert.strictEqual(parti.schemaVersion, 1, ad + ': parti şema sürümü');
    parti.cards.forEach(function (kart) {
      assert.ok(!partiKartlari.has(kart.candidate), kart.candidate + ': iki partide yineleniyor');
      partiKartlari.set(kart.candidate, { batchId: parti.batchId, card: kart });
    });
  });

var eklenenKararlar = kararlar.addedCards;
assert.ok(eklenenKararlar && typeof eklenenKararlar === 'object',
  'reviewedDecisions.addedCards zorunlu');
assert.deepStrictEqual(Object.keys(eklenenKararlar).sort(), Array.from(partiKartlari.keys()).sort(),
  'parti kartları ile addedCards kararları bire bir eşleşmeli');
partiKartlari.forEach(function (kaynak, kelime) {
  var kart = kaynak.card;
  var karar = eklenenKararlar[kelime];
  assert.strictEqual(karar.decision, 'add', kelime + ': ekleme kararı');
  assert.strictEqual(karar.batchId, kaynak.batchId, kelime + ': batchId');
  assert.ok(manifest.requiredFamilies[karar.familyRoot], kelime + ': aile kökü yok');
  assert.ok(manifest.requiredFamilies[karar.familyRoot].indexOf(kelime) !== -1,
    kelime + ': zorunlu ailede değil');
  assert.deepStrictEqual(karar.familyMembers, kart.family_members,
    kelime + ': familyMembers kaynak partiyle farklı');
  assert.strictEqual(karar.partOfSpeech, kart.tip, kelime + ': POS kaynak partiyle farklı');
  assert.strictEqual(karar.partOfSpeech, turler.get(kelime), kelime + ': POS dizinle farklı');
  assert.strictEqual(karar.displayScore, kart.p,
    kelime + ': görünen puan Python üreticisinin batch p alanıyla eşleşmeli');
  assert.strictEqual(karar.source_score, kart.source_score, kelime + ': source_score');
  assert.strictEqual(karar.exams, kart.exams, kelime + ': exams');
  assert.strictEqual(karar.freq, kart.freq, kelime + ': freq');
  assert.deepStrictEqual(karar.source_refs, kart.source_refs, kelime + ': source_refs');
  assert.deepStrictEqual(karar.lexical_refs || [], kart.oewn_refs || [], kelime + ': lexical_refs');
  assert.strictEqual(karar.reason, kart.reason, kelime + ': reason');
});
assert.strictEqual(turler.get('identity'), 'isim', 'identity yalnız isim olmalı');
assert.strictEqual(turler.get('injury'), 'isim', 'injury yalnız isim olmalı');

aileler.forEach(function (aile, i) {
  var uyeler = Array.from(aile.u);
  assert.ok(uyeler.length > 1, aile.k + ': tek üyeli aile yayımlanmış');
  assert.ok(uyeler.indexOf(aile.k) !== -1, aile.k + ': kök üyeler arasında değil');
  assert.ok(!kokler.has(aile.k), aile.k + ': yinelenen aile kökü');
  kokler.add(aile.k);
  uyeler.forEach(function (uye) {
    assert.ok(dizin.has(uye), uye + ': aile üyesinin kelime kartı yok');
    assert.ok(!uyeAilesi.has(uye), uye + ': birden fazla yayımlanmış ailede');
    uyeAilesi.set(uye, i);
  });
});

var temelUyeler = new Map();
Object.keys(manifest.approvedFamilies).forEach(function (kok) {
  var uyeler = manifest.approvedFamilies[kok];
  assert.ok(uyeler.indexOf(kok) !== -1, kok + ': temel kök üyeler arasında değil');
  var aileNo = uyeAilesi.get(uyeler[0]);
  assert.notStrictEqual(aileNo, undefined, kok + ': temel aile yayımlanmamış');
  uyeler.forEach(function (uye) {
    assert.ok(dizin.has(uye), kok + ': temel üye dizinde yok: ' + uye);
    assert.ok(!temelUyeler.has(uye), uye + ': iki temel manifest ailesinde');
    temelUyeler.set(uye, kok);
    assert.strictEqual(uyeAilesi.get(uye), aileNo,
      kok + ': temel aile yayında parçalanmış (' + uye + ')');
  });
});

Object.keys(manifest.requiredFamilies).forEach(function (kok) {
  var mevcut = manifest.requiredFamilies[kok].filter(function (uye) { return dizin.has(uye); });
  if (mevcut.length < 2) return;
  var aileNo = uyeAilesi.get(mevcut[0]);
  assert.notStrictEqual(aileNo, undefined, kok + ': zorunlu aile yayımlanmamış');
  mevcut.forEach(function (uye) {
    assert.strictEqual(uyeAilesi.get(uye), aileNo,
      kok + ': zorunlu aile yayında parçalanmış (' + uye + ')');
  });
  if (dizin.has(kok)) {
    var yayinKoku = aileler[aileNo].k;
    assert.ok(manifest.requiredFamilies[yayinKoku],
      kok + ': yayımlanan kök insan denetimli requiredFamilies kökü değil (' + yayinKoku + ')');
  }
});

var yasaklar = new Set();
manifest.forbiddenPairs.forEach(function (cift) {
  var anahtar = cift.slice().sort().join('\u0000');
  assert.ok(!yasaklar.has(anahtar), cift.join('/') + ': yinelenen yasak bağ');
  yasaklar.add(anahtar);
  if (!dizin.has(cift[0]) || !dizin.has(cift[1])) return;
  var sol = uyeAilesi.get(cift[0]);
  var sag = uyeAilesi.get(cift[1]);
  assert.ok(sol === undefined || sag === undefined || sol !== sag,
    cift.join('/') + ': yasak üyeler aynı ailede');
});

[
  ['more', 'moral'], ['jury', 'injury'], ['motion', 'motivate'], ['apple', 'apply'],
  ['polite', 'political'], ['numb', 'number'], ['cent', 'center'], ['fact', 'factory'],
  ['done', 'donate'], ['ration', 'rational'], ['cover', 'discover'], ['form', 'inform'],
  ['part', 'impart'], ['should', 'shoulder'], ['fact', 'factor'],
  ['formed', 'informed'], ['covered', 'discovered'], ['covered', 'undiscovered'],
  ['live', 'liver'], ['play', 'display'], ['process', 'procession'],
  ['tend', 'intend'], ['design', 'designation'],
  ['miss', 'mission'], ['miss', 'dismiss'], ['mission', 'dismiss'],
  ['plan', 'plane'], ['pass', 'passive'], ['habit', 'inhabit'],
  ['mine', 'minor'], ['infant', 'fancy'], ['colony', 'colon'],
  ['sale', 'salary'], ['sale', 'sally'], ['salary', 'sally'],
  ['sing', 'singe'], ['secret', 'secrete'], ['suit', 'suite'],
  ['tent', 'intent'], ['quest', 'question'],
  ['arch', 'archive'], ['archive', 'archer'],
  ['very', 'verify'], ['come', 'comic'], ['show', 'shower'],
  ['both', 'bother'], ['cope', 'copper'], ['version', 'inversion'],
  ['flow', 'flower'], ['empire', 'empirical'], ['core', 'coral'],
  ['ease', 'disease'], ['tale', 'talent'], ['sold', 'solder'],
  ['wine', 'winner'], ['mate', 'matter'], ['admire', 'admiral'],
  ['sent', 'sentence'], ['tail', 'tailor'], ['mole', 'molly'],
  ['patch', 'dispatch'], ['liter', 'literary'], ['mess', 'message'],
  ['corn', 'corner'], ['rend', 'render'], ['mute', 'mutation'],
  ['universe', 'university'],
  ['count', 'counter'], ['count', 'discount'], ['counter', 'discount'],
  ['prime', 'primate'], ['virtue', 'virtual'],
  ['stance', 'instance'], ['stance', 'instant'], ['instance', 'instant'],
  ['port', 'portion'], ['port', 'import'], ['port', 'portable'],
  ['portion', 'import'], ['portion', 'portable'], ['import', 'portable'],
  ['cape', 'capable'], ['instal', 'stall'], ['appoint', 'disappoint'],
  ['pose', 'position'], ['pose', 'impose'], ['pose', 'dispose'],
  ['position', 'impose'], ['position', 'dispose'], ['impose', 'dispose'],
  ['close', 'disclose'], ['prove', 'improve'], ['proved', 'improved'],
  ['like', 'likely'], ['like', 'unlike'], ['likely', 'unlike'],
  ['public', 'publication'], ['public', 'publish'],
  ['current', 'currency'], ['confident', 'confidential'],
  ['physical', 'physic'], ['mass', 'masse'], ['emerge', 'emergency'],
  ['regime', 'regiment'], ['bite', 'bitter']
].forEach(function (cift) {
  assert.ok(yasaklar.has(cift.slice().sort().join('\u0000')),
    cift.join('/') + ': zorunlu regresyon yasağı manifestte yok');
});

var aileRegresyonlari = {
  diagnosis: ['diagnosis', 'diagnose', 'diagnostic'],
  identify: ['identify', 'identification', 'identity'],
  use: ['use', 'usage', 'user', 'used', 'useful', 'useless'],
  live: ['live', 'lively'], play: ['play', 'player'],
  process: ['process', 'processor'], tend: ['tend', 'tendency'],
  design: ['design', 'designer'], designate: ['designate', 'designation'],
  plan: ['plan', 'planner'], pass: ['pass', 'passage'],
  inhabit: ['inhabit', 'habitable'], minor: ['minor', 'minority'],
  infant: ['infant', 'infancy'], colony: ['colony', 'colonial'],
  sing: ['sing', 'singer'], secret: ['secret', 'secretly'],
  suit: ['suit', 'suitable'], intent: ['intent', 'intention'],
  question: ['question', 'questionable'], arch: ['arch', 'archer'],
  universe: ['universe', 'universal', 'universally'],
  count: ['count', 'countless'], prime: ['prime', 'primary', 'primarily'],
  virtue: ['virtue', 'virtuous'], virtual: ['virtual', 'virtually'],
  instant: ['instant', 'instantly'], capable: ['capable', 'capability', 'incapable'],
  instal: ['instal', 'install', 'installation'],
  appoint: ['appoint', 'appointment'], disappoint: ['disappoint', 'disappointment'],
  dispose: ['dispose', 'disposal'], close: ['close', 'closely', 'closer'],
  prove: ['prove', 'disprove', 'proved'],
  improve: ['improve', 'improvement', 'improved'],
  like: ['like', 'dislike'], likely: ['likely', 'likelihood', 'unlikely'],
  public: ['public', 'publicly'], publish: ['publish', 'publisher', 'publication'],
  current: ['current', 'currently'],
  confident: ['confident', 'confidence', 'confidently'],
  physical: ['physical', 'physically', 'physicist'],
  mass: ['mass', 'massive'], emerge: ['emerge', 'emergence']
};

Object.keys(aileRegresyonlari).forEach(function (kok) {
  assert.ok(manifest.requiredFamilies[kok], kok + ': zorunlu regresyon ailesi yok');
  aileRegresyonlari[kok].forEach(function (uye) {
    assert.ok(manifest.requiredFamilies[kok].indexOf(uye) !== -1,
      kok + ': zorunlu regresyon üyesi yok (' + uye + ')');
  });
});

console.log('aile-manifest: ' + aileler.length + ' aile, ' + uyeAilesi.size +
  ' üye, ' + Object.keys(manifest.requiredFamilies).length + ' zorunlu aile ve ' +
  manifest.forbiddenPairs.length + ' yasak bağ; ' + partiKartlari.size +
  ' denetimli ek kart başarılı');
