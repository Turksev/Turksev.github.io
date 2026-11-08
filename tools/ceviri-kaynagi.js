'use strict';
// Later translation review is explicit and reversible for historical audits.
// Unlisted changes still fail the original content hashes and exact guards.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const review = JSON.parse(fs.readFileSync(path.join(__dirname, 'ceviri-denetimi/2026-11-08.json'), 'utf8'));
assert.equal(review.schema_version, 1);
const copy = value => JSON.parse(JSON.stringify(value));
const groups = new Map(), seen = new Set();
for (const row of review.rows) {
  const key = row.word + ':' + row.sense_index;
  assert.ok(!seen.has(key), 'Duplicate translation review: ' + key); seen.add(key);
  assert.ok(Number.isInteger(row.sense_index) && row.sense_index >= 0 && row.sense_index < row.sense_count);
  for (const sense of [row.expected, row.replacement]) {
    assert.ok(sense.tr && sense.ex && sense.exTr, key + ': complete meaning and pair');
    for (const p of [sense, ...(sense.exs || [])]) for (const k of ['ex','exTr'])
      assert.ok(typeof p[k] === 'string' && p[k].trim() === p[k] && !/[<>]/.test(p[k]), key + ': plain text');
  }
  if (!groups.has(row.word)) groups.set(row.word, []);
  groups.get(row.word).push(row);
}
function projected(sense) {
  return Object.fromEntries(['tr','ex','exTr','exs'].filter(k => Object.hasOwn(sense,k)).map(k => [k,copy(sense[k])]));
}
function transformCard(word, card, direction = 'forward', allowApplied = true) {
  const result = copy(card);
  for (const row of groups.get(word) || []) {
    assert.equal(result.a.length, row.sense_count, word + ': unchanged sense positions');
    const sense = result.a[row.sense_index], current = projected(sense);
    const from = direction === 'forward' ? row.expected : row.replacement;
    const to = direction === 'forward' ? row.replacement : row.expected;
    if (allowApplied && JSON.stringify(current) === JSON.stringify(to)) continue;
    assert.deepEqual(current, from, word + ': stale translation review guard');
    for (const k of ['tr','ex','exTr','exs']) delete sense[k];
    Object.assign(sense,copy(to));
  }
  return result;
}
function baselineCards(cards) {
  return Object.fromEntries(Object.entries(cards).map(([w,c]) => [w,transformCard(w,c,'reverse')]));
}
module.exports = {review, groups, projected, transformCard, baselineCards};
