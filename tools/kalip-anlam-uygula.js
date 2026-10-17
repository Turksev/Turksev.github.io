'use strict';
// Regenerate only usage phrases from the final guarded editorial collection.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const {readCollection, expectedPhrases, protectedDigest} = require('./kalip-anlam-kaynagi');
const root = path.resolve(__dirname, '..');
function loadCards() {
  const w = {}, ctx = vm.createContext({window: w}), files = [];
  for (let k = 1; k <= 7; k++) {
    const filename = path.join(root, `data/kelime-k${k}.js`), text = fs.readFileSync(filename, 'utf8');
    vm.runInContext(text, ctx);
    files.push({filename, text, cards: JSON.parse(JSON.stringify(w[`KELIME_K${k}`]))});
  }
  return files;
}
function main() {
  const write = process.argv.includes('--write');
  if (!write && !process.argv.includes('--check')) throw new Error('Use --write or --check');
  const {manifest, rows} = readCollection(), files = loadCards();
  const cards = Object.assign({}, ...files.map(file => file.cards));
  assert.equal(Object.keys(cards).length, rows.size, 'Exact reviewed vocabulary');
  assert.equal(protectedDigest(cards), manifest.protected_sha256, 'Meanings, examples and other card fields stay unchanged');
  for (const [word, card] of Object.entries(cards)) {
    const expected = expectedPhrases(word, card, rows, true);
    if (!write) assert.deepEqual(card.kl, expected, word + ': published usage collection');
  }
  const pending = [];
  for (const file of files) {
    const next = file.text.split(/\r?\n/).map(line => {
      const match = line.match(/^("(?:[^"\\]|\\.)+"):\{/);
      if (!match) return line;
      const word = JSON.parse(match[1]);
      if (!rows.has(word)) throw new Error('Unknown word line: ' + word);
      // These generated files have a final kl array. Preserve every other byte
      // of the card record, including main and alternating example formatting.
      const start = line.lastIndexOf(',kl:[');
      assert.ok(start >= 0 && /\]\},?$/.test(line), word + ': generated phrase field layout');
      const pairs = rows.get(word).replacement.map(p => '{en:' + JSON.stringify(p.en) + ',tr:' + JSON.stringify(p.tr) + '}').join(',');
      return line.slice(0, start) + ',kl:[' + pairs + ']}' + (line.endsWith(',') ? ',' : '');
    }).join('\n');
    // Parse staged output and verify complete non-phrase preservation before any write.
    const w = {}; vm.runInNewContext(next, {window: w});
    const staged = Object.values(w)[0];
    assert.equal(protectedDigest(staged), protectedDigest(file.cards));
    for (const [word, card] of Object.entries(staged)) assert.equal(JSON.stringify(card.kl), JSON.stringify(rows.get(word).replacement));
    if (next !== file.text) pending.push({filename: file.filename, text: next});
  }
  if (write) {
    // Complete every temporary file before replacing any generated file. An
    // interrupted rename sequence can be resumed: guards accept both states.
    const temporary = pending.map(file => ({...file, temp: file.filename + '.usage-' + process.pid + '.tmp'}));
    try {
      for (const file of temporary) fs.writeFileSync(file.temp, file.text, {flag: 'wx'});
      for (const file of temporary) fs.renameSync(file.temp, file.filename);
    } finally {
      for (const file of temporary) if (fs.existsSync(file.temp)) fs.unlinkSync(file.temp);
    }
  }
  console.log(`${rows.size} words; ${[...rows.values()].reduce((n, r) => n + r.replacement.length, 0)} usage phrases; ${write ? pending.length + ' files updated' : 'verified'}`);
}
if (require.main === module) main();
module.exports = {loadCards};
