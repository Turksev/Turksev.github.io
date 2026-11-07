'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),c={window:{}};
for(const f of ['data/kelime-dizin.js','assets/js/cekim.js','data/kelime-bicimleri.js','assets/js/kelime-bicimleri.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const api=c.window.YDS.KelimeBicimleri, data=c.window.KELIME_BICIMLERI, catalog=new Map(c.window.KELIME_DIZIN.map(w=>[w.e,w]));
const base=w=>Array.from(api.entries(w),r=>r.base);
assert.deepEqual(base('protected'),['protect']);assert.match(api.entries('protected')[0].pattern,/protect \+ -ed/);
assert.deepEqual(base('running'),['run']);assert.deepEqual(base('words'),['word']);
assert.deepEqual(base('written'),['write']);assert.match(api.entries('written')[0].pattern,/düzensiz/);
assert.deepEqual(base('lying'),['lie']);assert.match(api.entries('lying')[0].note,/yalan/);
assert.deepEqual(base('putting'),['put','putt']);assert.match(api.entries('putting')[0].note,/golf/);
assert.deepEqual(base('singing'),['sing']);
for(const w of ['evening','thing','feed','bore','ground','physics','mechanics','riches'])assert.deepEqual(base(w),[],w+' must not receive a guessed stem');
assert.deepEqual(base('building'),['build']);assert.deepEqual(base('meaning'),['mean']);
assert.match(api.entries('found')[0].note,/ayrı bir temel fiil/);
assert.deepEqual(base('useful'),['use']);assert.match(api.entries('useful')[0].description,/-ful yapım eki/);
assert.deepEqual(base('larger'),['large']);assert.match(api.entries('larger')[0].description,/daha/);
assert.deepEqual(base('teeth'),['tooth']);assert.match(api.entries('teeth')[0].pattern,/düzensiz/);
assert.deepEqual(base('establishing'),[],'No fabricated entry for a heading absent from the dictionary');
for(const [word,rows] of Object.entries(data))for(const r of rows){
  assert.ok(catalog.has(word)&&catalog.has(r.b));assert.notEqual(word,r.b);
  if(r.kind==='inflection')for(const f of r.f)assert.equal(c.window.YDS.Cekim.cek(r.b,f),word,word+' matches forward inflection');
  for(const rendered of api.entries(word))assert.ok(rendered.meaning&&rendered.pattern&&rendered.description);
}
assert.equal(cp.spawnSync(process.execPath,['tools/kelime-bicimleri-uret.js','--check'],{cwd:root,encoding:'utf8'}).status,0,'Generated data remains deterministic');
console.log('Word base forms: '+Object.keys(data).length+' dictionary cards; lexical collisions, ambiguity, irregulars and derivation PASS.');
