'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {readCollection,canonical}=require('../kalip-anlam-kaynagi');
const directory=path.join(__dirname,'..','kalip-sozluk-ilk-tur-denetimi');
const read=name=>JSON.parse(fs.readFileSync(path.join(directory,name),'utf8'));
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const audit=read('manifest.json'),{manifest,rows}=readCollection();
const prior=JSON.parse(fs.readFileSync(path.join(directory,'..','kalip-sozluk-denetimi/manifest.json'),'utf8'));
assert.equal(audit.schema_version,1);
assert.equal(audit.target_words.length,4638);
assert.equal(new Set(audit.target_words).size,4638);
assert.equal(audit.batches.length,47);
assert.equal(new Set(audit.batches).size,47);
assert.equal(audit.protected_sha256,manifest.protected_sha256);
assert.equal(audit.prior_review,'kalip-sozluk-denetimi');
assert.equal(audit.unchanged_non_target_words,4741);
const targets=new Set(audit.target_words),priorTargets=new Set(prior.target_words);
assert.ok([...targets].every(word=>!priorTargets.has(word)),'Review inventories are disjoint');
assert.deepEqual([...new Set([...targets,...priorTargets])].sort(),[...rows.keys()].sort(),'All 9,379 words have dictionary review records');
const retained=Object.fromEntries([...rows].filter(([word])=>!targets.has(word)));
assert.equal(digest(retained),audit.non_target_sha256,'Previously reviewed 4,741 rows are unchanged');
const seen=[],beforeRows={};
let changed=0,additions=0,revisions=0,before=0,after=0,web=0;
for(const file of audit.batches){
  assert.match(file,/^review-\d{3}\.json$/);
  const batch=read(file);assert.equal(batch.schema_version,1);
  for(const item of batch.words){
    seen.push(item.word);beforeRows[item.word]=item.before_canonical;
    assert.ok(item.note.trim().length>=20);
    assert.equal(item.before_canonical.word,item.word);
    assert.deepEqual(item.before,item.before_canonical.replacement);
    assert.ok(item.sources.oewn.length||item.sources.gcide.length||item.sources.web.length);
    for(const kind of ['oewn','gcide']){
      assert.ok(Array.isArray(item.sources.candidate_refs[kind]));
      for(const candidate of item.sources.candidate_refs[kind]){
        assert.ok(candidate.match&&candidate.entry.lemma);
        if(kind==='oewn')assert.ok(candidate.entry.id&&candidate.entry.pos&&candidate.entry.sense_ids.length);
        else assert.ok(candidate.entry.archive_member&&Number.isInteger(candidate.entry.entry_number));
      }
    }
    for(const source of item.sources.web){assert.match(source.url,/^https:\/\//);assert.ok(source.note.trim());}
    const pairs=item.before.map(pair=>({...pair})),indices=new Set();
    for(const edit of item.revisions){
      assert.ok(Number.isInteger(edit.index)&&edit.index>=0&&edit.index<pairs.length&&!indices.has(edit.index));
      indices.add(edit.index);pairs[edit.index]={en:edit.en,tr:edit.tr};
    }
    pairs.push(...item.additions);assert.deepEqual(pairs,item.after);
    const differs=JSON.stringify(item.before)!==JSON.stringify(item.after);
    assert.equal(item.changed,differs);
    const expected=JSON.parse(JSON.stringify(item.before_canonical));
    if(differs){expected.previous_replacement=item.before;expected.replacement=item.after;expected.sense_coverage.push(...item.additions.map(()=>[]));}
    assert.deepEqual(rows.get(item.word),expected,item.word+': only reviewed usage changes reach canonical records');
    changed+=Number(differs);additions+=item.additions.length;revisions+=item.revisions.length;
    before+=item.before.length;after+=item.after.length;web+=Number(item.sources.web.length>0);
  }
}
assert.deepEqual(seen,audit.target_words);
assert.equal(digest(beforeRows),audit.before_target_sha256);
assert.equal(audit.before_target_sha256,prior.non_target_sha256,'The two reviews share the same preserved boundary');
assert.deepEqual(audit.stats,{reviewed_words:seen.length,changed_words:changed,unchanged_words:seen.length-changed,
  new_pairs:additions,revised_pairs:revisions,before_pairs:before,after_pairs:after,web_checked_words:web,
  total_site_pairs:[...rows.values()].reduce((n,row)=>n+row.replacement.length,0)});
console.log('4,638-word dictionary review: complete inventory, historical baseline, bilingual changes and prior 4,741-word preservation passed');
