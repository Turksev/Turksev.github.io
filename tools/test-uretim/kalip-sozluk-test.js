'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {readCollection, canonical} = require('../kalip-anlam-kaynagi');
const directory = path.join(__dirname, '..', 'kalip-sozluk-denetimi');
const read = name => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
const audit = read('manifest.json');
const {manifest, rows} = readCollection();
assert.equal(audit.schema_version, 1);
assert.equal(audit.batches.length, 48, 'All review batches must be present');
assert.equal(new Set(audit.batches).size, audit.batches.length);
assert.equal(audit.target_words.length, 4741, 'Frozen remaining-word inventory');
assert.equal(new Set(audit.target_words).size, 4741);
assert.equal(audit.unchanged_non_target_words, 4638);
assert.equal(audit.protected_sha256, manifest.protected_sha256);
const targets = new Set(audit.target_words);
const retained = Object.fromEntries([...rows].filter(([word]) => !targets.has(word)));
assert.equal(crypto.createHash('sha256').update(JSON.stringify(canonical(retained))).digest('hex'),
  audit.non_target_sha256, 'All 4,638 non-target editorial records are unchanged');
const seen = [];
let changed = 0, additions = 0, revisions = 0, before = 0, after = 0, web = 0;
for (const file of audit.batches) {
  assert.match(file, /^review-\d{3}\.json$/);
  const batch = read(file);
  assert.equal(batch.schema_version, 1);
  for (const item of batch.words) {
    seen.push(item.word);
    const canonical = rows.get(item.word);
    assert.ok(canonical, item.word + ': known word');
    assert.ok(item.note.trim().length >= 20, item.word + ': authored decision');
    assert.ok(item.sources.oewn.length || item.sources.gcide.length || item.sources.web.length,
      item.word + ': dictionary evidence');
    for (const source of ['oewn', 'gcide']) {
      assert.ok(Array.isArray(item.sources.candidate_refs[source]));
      for (const candidate of item.sources.candidate_refs[source]) {
        assert.ok(candidate.match && candidate.entry.lemma, item.word + ': candidate provenance');
        if (source === 'oewn') assert.ok(candidate.entry.id && candidate.entry.pos && candidate.entry.sense_ids.length);
        else assert.ok(candidate.entry.archive_member && Number.isInteger(candidate.entry.entry_number));
      }
    }
    for (const source of item.sources.web) {
      assert.match(source.url, /^https:\/\//);
      assert.ok(source.note.trim(), item.word + ': source scope');
    }
    const reconstructed = item.before.map(pair => ({...pair}));
    const indices = new Set();
    for (const edit of item.revisions) {
      assert.ok(Number.isInteger(edit.index) && edit.index >= 0 && edit.index < reconstructed.length);
      assert.ok(!indices.has(edit.index), item.word + ': repeated revision');
      indices.add(edit.index);
      reconstructed[edit.index] = {en:edit.en, tr:edit.tr};
    }
    reconstructed.push(...item.additions);
    assert.deepEqual(reconstructed, item.after, item.word + ': complete change record');
    assert.deepEqual(item.after, canonical.replacement, item.word + ': published editorial content');
    const differs = JSON.stringify(item.before) !== JSON.stringify(item.after);
    assert.equal(item.changed, differs, item.word + ': accurate change status');
    if (differs) assert.deepEqual(canonical.previous_replacement, item.before, item.word + ': previous-state guard');
    changed += Number(differs);
    additions += item.additions.length;
    revisions += item.revisions.length;
    before += item.before.length;
    after += item.after.length;
    web += Number(item.sources.web.length > 0);
  }
}
assert.deepEqual(seen, audit.target_words, 'No omitted, reordered or repeated words');
assert.deepEqual(audit.stats, {
  reviewed_words:seen.length, changed_words:changed, unchanged_words:seen.length-changed,
  new_pairs:additions, revised_pairs:revisions, before_pairs:before, after_pairs:after,
  web_checked_words:web,
  total_site_pairs:[...rows.values()].reduce((total,row) => total+row.replacement.length,0)
});
console.log('4,741-word dictionary review: exact inventory, provenance, changes and canonical output passed');
