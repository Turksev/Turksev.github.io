'use strict';
// Test-side interpretation of explicit editorial exceptions. Legacy source
// comparisons stay exact; no field is globally ignored to accommodate changes.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const folder = path.resolve(__dirname, '../kart-icerik-partileri');
const batches = fs.existsSync(folder) ? fs.readdirSync(folder).filter(f => f.endsWith('.json')).sort()
  .map(f => JSON.parse(fs.readFileSync(path.join(folder, f), 'utf8'))) : [];
const plain = value => JSON.parse(JSON.stringify(value));
function beklenenKart(word, record) {
  const original = plain(record), result = plain(record);
  for (const batch of batches) {
    for (const row of batch.collocations || []) {
      if (row.word !== word) continue;
      assert.deepEqual(original.kl || [], row.expected, word + ': original collocation guard');
      result.kl = plain(row.replacement);
    }
    for (const category of ['corrections', 'enrichments']) {
      for (const row of batch[category] || []) {
        if (row.word !== word) continue;
        const before = original.a[row.sense_index], after = result.a[row.sense_index];
        assert.ok(before && after, word + ': editorial sense index');
        for (const [key, value] of Object.entries(row.expected)) assert.equal(before[key], value, word + ': ' + key + ' guard');
        if (category === 'corrections') Object.assign(after, plain(row.replacement));
        else after.exs = plain(row.alternatives);
      }
    }
  }
  return result;
}
module.exports = {batches, beklenenKart};
