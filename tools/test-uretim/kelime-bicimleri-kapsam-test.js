'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,'tools',name),'utf8'));
const c={window:{}};
for(const f of ['data/kelime-dizin.js','data/kelime-bicimleri.js','assets/js/kelime-bicimleri.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const catalog=new Set(c.window.KELIME_DIZIN.map(w=>w.e)),baseline=new Set(read('kelime-bicimleri-tarama-baslangic.json').words),seen=new Set(),added=new Set();
const decisions={};
for(const range of ['a-h','i-p','q-z']){
  const r=read('kelime-bicimleri-inceleme-'+range+'.json');
  for(const w of r.reviewedWords){assert.ok(catalog.has(w)&&!baseline.has(w)&&!seen.has(w),w+' reviewed once');seen.add(w);}
  for(const [w,rows] of Object.entries(r.entries)){
    assert.ok(r.reviewedWords.includes(w)&&!r.rejected[w]);added.add(w);decisions[w]='accepted';
    assert.equal(c.window.YDS.KelimeBicimleri.entries(w).length,rows.length,w+' every reviewed base is visible, including absent catalogue bases');
    for(const row of rows)if(!catalog.has(row.b))assert.ok(row.m&&c.window.YDS.KelimeBicimleri.entries(w).some(v=>v.base===row.b&&v.meaning===row.m));
  }
  for(const [w,reason] of Object.entries(r.rejected)){assert.ok(reason&&r.reviewedWords.includes(w));decisions[w]='rejected';}
}
assert.equal(seen.size,catalog.size-baseline.size,'All remaining headings have been inspected');
for(const r of read('kelime-bicimleri-adaylar.json').rows)if(r.candidates.length)assert.ok(decisions[r.word],r.word+' has an explicit candidate decision');
const coverage=read('kelime-bicimleri-kapsam.json');assert.equal(coverage.reviewed,seen.size);assert.equal(coverage.added,added.size);
assert.equal(coverage.withBase,Object.keys(c.window.KELIME_BICIMLERI).length);assert.equal(coverage.withBase,baseline.size+added.size);
assert.equal(coverage.total,catalog.size);
assert.equal(cp.spawnSync(process.execPath,['tools/kelime-bicimleri-tara.js','--check'],{cwd:root,encoding:'utf8'}).status,0,'Inventory remains reproducible');
console.log('Complete base-form audit: '+seen.size+' remaining headings, '+added.size+' additions; reviewed-only publication and absent-base visibility PASS.');
