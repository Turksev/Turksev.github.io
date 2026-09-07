'use strict';
// Full second-release contract. A partial content batch must not pass CI.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'), window = {}, context = vm.createContext({window});
const load = file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
load('data/kelime-dizin.js');
for (let layer = 1; layer <= 7; layer++) load(`data/kelime-k${layer}.js`);
const index = window.KELIME_DIZIN;
assert.equal(index.length, 9379, 'Vocabulary inventory is retained');
assert.equal(new Set(index.map(row => row.e)).size, index.length, 'No duplicated vocabulary cards');
let alternatives = 0, usagePairs = 0;
const seenExamples = new Map();
for (const entry of index) {
  const card = window[`KELIME_K${entry.k}`][entry.e];
  assert.ok(card?.a?.length, `Missing meaning: ${entry.e}`);
  assert.ok(card.a.flatMap(sense => sense.exs || []).length >= 1, `No rotating example: ${entry.e}`);
  assert.ok(card.kl?.length >= 1, `Empty usage panel: ${entry.e}`);
  for (const sense of card.a) {
    for (const example of sense.exs || []) {
      for (const field of ['ex', 'exTr']) {
        assert.equal(typeof example[field], 'string', `Missing ${field}: ${entry.e}`);
        assert.equal(example[field].trim(), example[field], `Whitespace: ${entry.e}`);
        assert.match(example[field], /[.!?]$/, `Incomplete ${field}: ${entry.e}`);
        assert.doesNotMatch(example[field], /[<>\uFFFD]/u, `Invalid ${field}: ${entry.e}`);
      }
      const key = example.ex.normalize('NFKC').toLowerCase();
      assert.notEqual(key, sense.ex.normalize('NFKC').toLowerCase(), `Primary duplicated: ${entry.e}`);
      assert.ok(!seenExamples.has(key), `Repeated alternative: ${entry.e} / ${seenExamples.get(key)}`);
      seenExamples.set(key, entry.e);
      alternatives++;
    }
  }
  for (const pair of card.kl) {
    assert.ok(typeof pair.en === 'string' && pair.en.trim(), `Missing EN usage: ${entry.e}`);
    assert.ok(typeof pair.tr === 'string' && pair.tr.trim(), `Missing TR usage: ${entry.e}`);
    usagePairs++;
  }
}
assert.equal(alternatives, 9473, '194 first-release alternatives plus 9279 completion alternatives');
console.log(`Full vocabulary coverage: ${index.length} cards, ${alternatives} distinct EN/TR alternatives, ${usagePairs} usage pairs.`);
