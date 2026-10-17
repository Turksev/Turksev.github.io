'use strict';
const assert = require('node:assert/strict');
const {readCollection, expectedPhrases, protectedDigest} = require('../kalip-anlam-kaynagi');
const {loadCards} = require('../kalip-anlam-uygula');
const {manifest, rows} = readCollection();
const cards = Object.assign({}, ...loadCards().map(file => file.cards));
assert.equal(rows.size, 9379, 'Complete word inventory');
assert.equal(Object.keys(cards).length, rows.size);
assert.equal(protectedDigest(cards), manifest.protected_sha256, 'Only usage phrases change');
for (const [word, card] of Object.entries(cards)) {
  assert.deepEqual(card.kl, expectedPhrases(word, card, rows, true), word + ': exact editorial phrases');
}
const establish = cards.establish.kl;
for (const phrase of ['establish a company', 'establish a system', 'establish the cause', 'establish the facts']) {
  assert.ok(establish.some(p => p.en === phrase), 'Requested establish contrast: ' + phrase);
}
assert.ok(establish.some(p => /^establish that/.test(p.en)));
assert.ok(establish.some(p => /^establish whether/.test(p.en)));
assert.ok(new Set([...rows.values()].map(r => r.replacement.length)).size >= 3, 'Counts vary with lexical needs');
assert.ok([...rows.values()].some(r => r.replacement.length > 3), 'No former three-phrase cap');
console.log('All-word usage coverage, meanings, exact bilingual pairs and non-usage preservation passed');
