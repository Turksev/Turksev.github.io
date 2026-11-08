'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),c={window:{}};
for(const f of ['data/kelime-dizin.js','assets/js/cekim.js','data/kelime-bicimleri.js','assets/js/kelime-bicimleri.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const api=c.window.YDS.KelimeBicimleri, data=c.window.KELIME_BICIMLERI, catalog=new Map(c.window.KELIME_DIZIN.map(w=>[w.e,w]));
const reviews=['a-h','i-p','q-z'].map(part=>JSON.parse(fs.readFileSync(path.join(root,'tools/kelime-bicimleri-inceleme-'+part+'.json'),'utf8')));
const reviewed=Object.assign({},...reviews.map(r=>r.entries));
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
assert.ok(base('injury').includes('injure')&&!base('injury').includes('jury'));
assert.ok(!base('political').includes('polite'));
assert.deepEqual(base('unemployment'),['employment']);
for(const w of ['founder','boundary','mighty','peoples'])assert.equal(api.entries(w)[0].chain.length,0,w+' must not inherit a different sense’s base');
assert.match(api.entries('willing')[0].meaning,/istemek/);
for(const [word,rows] of Object.entries(data))for(const r of rows){
  assert.ok(catalog.has(word));assert.ok(catalog.has(r.b)||(typeof r.m==='string'&&r.m.trim()),word+' has a translated base');assert.notEqual(word,r.b);
  if(r.kind==='inflection')for(const f of r.f){
    const regular=c.window.YDS.Cekim.cek(r.b,f)===word;
    assert.ok(regular||(reviewed[word]||[]).some(v=>v.b===r.b&&v.f.includes(f)),word+' irregular/spelling variant must have an explicit reviewed decision');
  }
  for(const rendered of api.entries(word))assert.ok(rendered.meaning&&rendered.pattern&&rendered.description);
}
assert.equal(cp.spawnSync(process.execPath,['tools/kelime-bicimleri-uret.js','--check'],{cwd:root,encoding:'utf8'}).status,0,'Generated data remains deterministic');
console.log('Word base forms: '+Object.keys(data).length+' dictionary cards; lexical collisions, ambiguity, irregulars and derivation PASS.');
