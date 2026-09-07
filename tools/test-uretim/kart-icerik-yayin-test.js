'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {batches} = require('./kart-icerik-beklenen');
const root = path.resolve(__dirname, '../..'), w = {}, context = vm.createContext({window: w});
for (let k = 1; k <= 7; k++) vm.runInContext(fs.readFileSync(path.join(root, 'data/kelime-k' + k + '.js'), 'utf8'), context);
const cards = Object.assign({}, ...Array.from({length: 7}, (_, i) => w['KELIME_K' + (i + 1)]));
const plain = value => JSON.parse(JSON.stringify(value));
const seen = new Set(), variants = new Set(), expectedCounts = {corrections: 0, collocations: 0, alternatives: 0, removed_senses: 0};
assert.ok(batches.length, 'Reviewed editorial sources are required');
for (const batch of batches) {
  assert.equal(batch.schema_version, 1);
  for (const category of ['corrections', 'collocations', 'enrichments', 'removals']) {
    for (const row of batch[category] || []) {
      const key = [category, row.word, row.sense_index].join(':');
      assert.ok(!seen.has(key), 'Duplicate editorial operation: ' + key); seen.add(key);
      const card = cards[row.word]; assert.ok(card, key + ': missing headword');
      if (category === 'removals') {
        assert.ok(card.a.length >= 1, key + ': word card retained');
        assert.equal(row.sense_index, row.expected_count - 1, key + ': removed last sense only');
        assert.equal(card.a.length, row.expected_count - 1, key + ': exact retained sense count');
        assert.ok(!card.a.some(sense => sense.ex === row.expected.ex && sense.tr === row.expected.tr), key + ': invalid derived sense removed');
        expectedCounts.removed_senses++;
      } else if (category === 'collocations') {
        assert.deepEqual(plain(card.kl), row.replacement, key + ': exact reviewed collocations');
        expectedCounts.collocations++;
      } else {
        const sense = card.a[row.sense_index]; assert.ok(sense, key + ': missing sense');
        if (category === 'corrections') {
          for (const [field, value] of Object.entries(row.replacement)) assert.equal(sense[field], value, key + ': ' + field);
          expectedCounts.corrections++;
        } else {
          assert.deepEqual(plain(sense.exs), row.alternatives, key + ': exact English/Turkish pairs');
          for (const p of sense.exs) {
            assert.ok(p.ex && p.exTr, key + ': missing pair');
            assert.match(p.ex, /[.!?]$/, key + ': complete English sentence');
            assert.match(p.exTr, /[.!?]$/, key + ': complete Turkish sentence');
            const length = p.ex.split(/\s+/).length;
            assert.ok(length >= 12 && length <= 40, key + ': reviewed YDS-style length');
            assert.ok(!variants.has(p.ex.toLowerCase()), key + ': duplicated alternative');
            variants.add(p.ex.toLowerCase());
          }
          expectedCounts.alternatives += sense.exs.length;
        }
      }
    }
  }
}
let actualAlternatives = 0;
for (const [word, card] of Object.entries(cards)) {
  for (const sense of card.a) {
    const pairs = [sense, ...(sense.exs || [])];
    assert.equal(new Set(pairs.map(p => p.ex.trim().toLowerCase())).size, pairs.length, word + ': within-sense duplicate');
    actualAlternatives += (sense.exs || []).length;
  }
}
assert.equal(actualAlternatives, expectedCounts.alternatives, 'No unreviewed runtime alternatives');
console.log('Published editorial data exactly matches reviewed batches: ' + JSON.stringify(expectedCounts));
