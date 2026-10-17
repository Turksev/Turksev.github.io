'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const crypto = require('node:crypto');
const folder = path.join(__dirname, 'kalip-anlam-partileri');
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
function protectedDigest(cards) {
  const withoutPhrases = Object.fromEntries(Object.entries(cards).map(([word, card]) => {
    const {kl, ...retained} = card;
    return [word, retained];
  }));
  return crypto.createHash('sha256').update(JSON.stringify(canonical(withoutPhrases))).digest('hex');
}
function readCollection(directory = folder) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  assert.equal(manifest.schema_version, 1);
  assert.ok(Array.isArray(manifest.batches) && manifest.batches.length);
  assert.equal(new Set(manifest.batches).size, manifest.batches.length);
  const rows = new Map();
  for (const name of manifest.batches) {
    assert.ok(typeof name === 'string' && path.basename(name) === name && name.endsWith('.json'));
    const batch = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
    assert.equal(batch.schema_version, 1);
    assert.ok(Array.isArray(batch.words));
    for (const row of batch.words) {
      assert.ok(typeof row.word === 'string' && !rows.has(row.word), 'Duplicate usage headword');
      validateRow(row);
      rows.set(row.word, row);
    }
  }
  assert.equal(rows.size, manifest.word_count, 'Every declared word has a reviewed usage row');
  return {manifest, rows};
}
function validateRow(row) {
  assert.ok(Array.isArray(row.expected_senses) && row.expected_senses.length, row.word + ': meanings');
  assert.ok(row.expected_senses.every(x => typeof x === 'string' && x.trim()), row.word + ': meaning text');
  assert.ok(Array.isArray(row.expected), row.word + ': source phrases');
  assert.ok(Array.isArray(row.replacement) && row.replacement.length, row.word + ': replacement phrases');
  for (const pairs of [row.replacement, ...(Object.hasOwn(row, 'previous_replacement') ? [row.previous_replacement] : [])]) {
   assert.ok(Array.isArray(pairs) && pairs.length, row.word + ': explicit phrase transition');
   const seen = new Set();
   for (const pair of pairs) {
    assert.deepEqual(Object.keys(pair).sort(), ['en', 'tr']);
    for (const value of Object.values(pair)) assert.ok(typeof value === 'string' && value.trim() === value && value.length && !/[<>]/.test(value), row.word + ': plain text pair');
    assert.ok(!seen.has(pair.en.toLowerCase()), row.word + ': duplicate phrase');
    seen.add(pair.en.toLowerCase());
   }
  }
  assert.ok(Array.isArray(row.sense_coverage), row.word + ': coverage');
  assert.equal(row.sense_coverage.length, row.replacement.length, row.word + ': coverage alignment');
  const covered = new Set();
  for (const indices of row.sense_coverage) {
    assert.ok(Array.isArray(indices), row.word + ': sense list');
    assert.equal(new Set(indices).size, indices.length, row.word + ': duplicate sense');
    for (const i of indices) {
      assert.ok(Number.isInteger(i) && i >= 0 && i < row.expected_senses.length, row.word + ': valid sense index');
      covered.add(i);
    }
  }
  assert.equal(covered.size, row.expected_senses.length, row.word + ': every meaning represented');
}
function expectedPhrases(word, card, rows, acceptApplied = false) {
  const row = rows.get(word);
  assert.ok(row, word + ': missing reviewed usage');
  assert.deepEqual(card.a.map(a => a.tr), row.expected_senses, word + ': sense guard');
  const actual = JSON.stringify(card.kl || []);
  assert.ok(actual === JSON.stringify(row.expected) || (acceptApplied &&
    (actual === JSON.stringify(row.replacement) || (row.previous_replacement && actual === JSON.stringify(row.previous_replacement)))), word + ': phrase guard');
  return row.replacement;
}
module.exports = {readCollection, validateRow, expectedPhrases, canonical, protectedDigest};
