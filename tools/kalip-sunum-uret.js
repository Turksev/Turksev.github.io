'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const {readCollection} = require('./kalip-anlam-kaynagi');
const {ozet} = require('../assets/js/kalip-sunum');
const root = path.resolve(__dirname, '..'), folder = path.join(__dirname, 'kalip-sunum');
const sha = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function build() {
  const {rows} = readCollection();
  const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8'));
  const decisions = JSON.parse(fs.readFileSync(path.join(folder, 'decisions.json'), 'utf8'));
  assert.equal(manifest.schema_version, 1);
  assert.equal(manifest.words, rows.size);
  assert.equal(manifest.phrases_sha256, sha([...rows].map(([word, row]) => [word, row.replacement])), 'Phrase content changed: review presentation decisions before regenerating');
  assert.deepEqual(decisions.map(d => d.word), [...rows.keys()], 'Every card has a presentation decision');
  const words = {}, stats = { words: rows.size, pairs: 0, primary: 0, secondary: 0, expandable_cards: 0, individually_reviewed: 0 };
  for (const decision of decisions) {
    const pairs = rows.get(decision.word).replacement, indices = decision.secondary;
    assert.equal(decision.phrases_sha256, sha(pairs), decision.word + ': exact phrase identity');
    assert.ok(typeof decision.note === 'string' && decision.note.trim().length >= 10);
    assert.ok(['individual', 'all_visible'].includes(decision.review));
    assert.ok(Array.isArray(indices) && indices.length < pairs.length, decision.word + ': at least one visible use');
    assert.deepEqual(indices, [...new Set(indices)].sort((a,b) => a-b), decision.word + ': unique ordered indices');
    for (const i of indices) assert.ok(Number.isInteger(i) && i >= 0 && i < pairs.length);
    if (indices.length) {
      assert.equal(decision.review, 'individual', 'Only explicit editorial decisions collapse uses');
      words[decision.word] = { hash: ozet(pairs), count: pairs.length, secondary: indices };
      stats.expandable_cards++;
    }
    stats.pairs += pairs.length; stats.primary += pairs.length-indices.length; stats.secondary += indices.length;
    stats.individually_reviewed += Number(decision.review === 'individual');
  }
  assert.deepEqual(stats, manifest.stats);
  const data = {schema_version:1, words};
  const text = '/* tools/kalip-sunum-uret.js üretir. Kalıp metinleri özgün kartlarda korunur. */\nwindow.KALIP_SUNUM = ' + JSON.stringify(data) + ';\n';
  return {data, text, stats, decisions};
}
if (require.main === module) {
  const result = build(), destination = path.join(root, 'data/kalip-sunum.js');
  if (process.argv.includes('--write')) fs.writeFileSync(destination, result.text);
  else assert.equal(fs.readFileSync(destination, 'utf8'), result.text, 'Presentation data is stale; run with --write');
  console.log(JSON.stringify(result.stats));
}
module.exports = { build, sha };
