'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'),'utf8'));
assert.match(manifest.surum,/^[0-9a-f]{12}$/);assert.equal(manifest.kok,'/releases/'+manifest.surum+'/');
const digest=crypto.createHash('sha256');
const textExt=new Set(['.js','.css','.json','.svg']);
for(const f of manifest.dosyalar){
 assert.match(f.yol,/^(assets|data)\//);assert.ok(!f.yol.includes('..'));
 let raw=fs.readFileSync(path.join(root,f.yol));
 if(textExt.has(path.extname(f.yol)))raw=Buffer.from(raw.toString('utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n'));
 digest.update(f.yol);digest.update('\0');digest.update(raw);digest.update('\0');
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),f.sha256,f.yol+': source digest');
 assert.equal(raw.length,f.bayt);assert.deepEqual(fs.readFileSync(path.join(root,manifest.kok.slice(1),f.yol)),raw,f.yol+': immutable release bytes');
}
assert.equal(digest.digest('hex').slice(0,12),manifest.surum);
const pages=fs.readdirSync(root).filter(f=>f.endsWith('.html')).concat(fs.readdirSync(path.join(root,'konu')).filter(f=>f.endsWith('.html')).map(f=>'konu/'+f));
for(const file of pages){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 assert.equal((html.match(/<script data-yds-release>/g)||[]).length,1,file+': release bootstrap');
 assert.ok(html.includes('window.YDS_VARLIK_KOKU='+JSON.stringify(manifest.kok)),file+': release prefix');
 for(const m of html.matchAll(/\b(?:src|href)="([^"?#]+)"/g)){
  if(/(?:^|\/)(assets|data)\//.test(m[1]))assert.ok(m[1].startsWith(manifest.kok),file+': unversioned runtime '+m[1]);
 }
}
for(const file of ['assets/js/cumleler.js','assets/js/kelime-bilgi.js'])assert.match(fs.readFileSync(path.join(root,file),'utf8'),/s\.src = window\.YDS\.varlikYolu\(/);
assert.match(fs.readFileSync(path.join(root,'assets/js/veri.js'),'utf8'),/function varlik\(yol\)/);
assert.ok(!manifest.dosyalar.some(f=>f.yol==='data/depo.js'));
console.log('Release integrity: '+manifest.surum+', '+manifest.dosyalar.length+' runtime files, '+pages.length+' pinned documents.');
