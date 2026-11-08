'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm');
const {review,baselineCards,transformCard,projected}=require('../ceviri-kaynagi');
const {loadCards}=require('../kalip-anlam-uygula');
const root=path.resolve(__dirname,'../..'),cards=Object.assign({},...loadCards().map(f=>f.cards));
const before=baselineCards(cards),audit=JSON.parse(fs.readFileSync(path.join(root,'tools/ceviri-denetimi/2026-11-08-inceleme.json'),'utf8'));
const notes=[...audit.remaining,...audit.previous.filter(x=>x.group==='E')];
assert.equal(notes.length,663);assert.equal(new Set(notes.map(x=>x.id)).size,663);
assert.equal(audit.remaining.length,641);assert.equal(review.counts.raw_notes_unreviewed,0);
assert.equal(audit.remaining.filter(x=>x.decision==='fix').length,327);
const reviewedIds=new Set(review.rows.flatMap(r=>r.source_ids));
for(const note of audit.remaining.filter(x=>x.decision==='fix'))assert.ok(reviewedIds.has(note.id),'Reviewed fix applied: '+note.id);
const indexWindow={};vm.runInNewContext(fs.readFileSync(path.join(root,'data/kelime-dizin.js'),'utf8'),{window:indexWindow});
for(const row of review.short_meanings)assert.equal(indexWindow.KELIME_DIZIN.find(x=>x.e===row.word).t,row.replacement,row.word+': searchable short meaning');
assert.equal(Object.keys(cards).length,9379);
let examples=0;
for(const [word,card] of Object.entries(cards)){
  assert.equal(card.a.length,before[word].a.length,word+': sense positions preserved');
  assert.deepEqual(card.kl,before[word].kl,word+': no phrase removed');
  for(let i=0;i<card.a.length;i++){
    assert.equal(card.a[i].yz,before[word].a[i].yz,word+': ratings preserved');
    assert.equal((card.a[i].exs||[]).length,(before[word].a[i].exs||[]).length,word+': alternatives preserved');
    examples+=1+(card.a[i].exs||[]).length;
  }
  assert.deepEqual(transformCard(word,before[word]),card,word+': complete exact reviewed result');
}
assert.equal(examples,22366);
for(const row of review.rows)assert.deepEqual(projected(cards[row.word].a[row.sense_index]),row.replacement);
assert.ok(cards.expectation.a.some(s=>s.exTr.includes('rekor kâr')),'Profit is not revenue');
assert.ok(cards.imply.a.some(s=>s.exTr.includes('hastaneye yatış')),'Admission is not an application');
assert.ok(cards.leopard.a.every(s=>!s.ex.includes('snow leopard')),'Headword species matches the example');
assert.ok(cards.individuality.a.some(s=>s.ex.startsWith('School uniform policies')),'Source ambiguity resolved');
const changed=structuredClone(cards[review.rows[0].word]);changed.a[review.rows[0].sense_index].exTr+=' Changed.';
assert.throws(()=>transformCard(review.rows[0].word,changed),/stale translation/);
// Independently exercise the Python importer on all actual reviewed senses.
const pythonCards=Object.fromEntries([...new Set(review.rows.map(r=>r.word))].map(w=>[w,{anlamlar:before[w].a,kalip:before[w].kl,puan:42}]));
const script=`import json,sys,copy
sys.path.insert(0,'tools')
from ceviri_duzeltmeleri import uygula
data=json.load(sys.stdin); original=copy.deepcopy(data['cards']); result=copy.deepcopy(original)
count=uygula(result,data['review'])
for mode in ('stale','duplicate','missing_pair','positions'):
    broken=copy.deepcopy(data['review']); row=broken['rows'][-1]
    if mode=='stale': row['expected']['exTr']+=' bad'
    elif mode=='duplicate': broken['rows'].append(copy.deepcopy(row))
    elif mode=='missing_pair': del row['replacement']['exTr']
    else: row['sense_count']+=1
    target=copy.deepcopy(original)
    try: uygula(target,broken)
    except ValueError: pass
    else: raise AssertionError(mode+' guard did not reject')
    assert target==original, mode+' partially mutated source'
json.dump({'count':count,'cards':result},sys.stdout,ensure_ascii=False)
`;
const run=cp.spawnSync('python',['-X','utf8','-c',script],{cwd:root,input:JSON.stringify({cards:pythonCards,review}),encoding:'utf8',maxBuffer:16*1024*1024});
assert.equal(run.status,0,run.stderr);const actual=JSON.parse(run.stdout);
assert.equal(actual.count,review.rows.length);
for(const [word,card] of Object.entries(actual.cards)){
  assert.deepEqual(card.anlamlar,cards[word].a,word+': Python/JavaScript final meanings agree');
  assert.deepEqual(card.kalip,cards[word].kl);assert.equal(card.puan,42);
}
console.log('663 notes resolved; exact final EN/TR pairs, preserved cards/positions/ratings, and atomic importer guards passed.');
