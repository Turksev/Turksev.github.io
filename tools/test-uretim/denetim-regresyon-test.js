'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const c={window:{}};vm.createContext(c);
for(const f of ['kelime-dizin.js','obekler.js','aileler.js','baglaclar.js','sayilar.js']) vm.runInContext(read('data/'+f),c);
const w=c.window;
assert.equal(w.SAYILAR.kelime,w.KELIME_DIZIN.length);
assert.equal(w.SAYILAR.obek,w.OBEKLER.length);
assert.equal(w.SAYILAR.aile,w.AILELER.length);
assert.equal(w.SAYILAR.baglac,w.BAGLACLAR.length);
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))) {
  const s=read(file);
  assert.equal((s.match(/class="(?:skip-link|atla)"/g)||[]).length,1,file+': one skip link');
  if(file!=='404.html') assert.match(s,/class="footer-links"/,file+': data settings discoverable');
}
assert.ok(!read('assets/css/style.css').includes('var(--line)'));
assert.ok(!/position:\s*fixed/.test(read('assets/css/style.css').match(/\.surum-bildirimi\s*\{([^}]+)/)[1]));
const missing=read('404.html');
for(const m of missing.matchAll(/(?:href|src)="([^\"]+)"/g)) assert.ok(/^(?:\/|#|data:|https:)/.test(m[1]),m[1]);
assert.ok(!missing.includes('og:url" content="https://turksev.github.io/yontem.html'));
for(const utility of ['ara','ayarlar','durum']) {
  assert.match(read(utility+'.html'),/noindex, follow/);
  assert.ok(!read('sitemap.xml').includes('/'+utility+'.html'));
}
const topic=read('konu/T01.html').replace(/<[^>]+>/g,' ');
assert.ok(topic.split(/\s+/).length>1000,'Full topic lesson should be statically available');
console.log('Audit regressions: counts, access links, nested 404, CSS, sitemap, full lessons passed.');
