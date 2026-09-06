'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const json=f=>JSON.parse(read(f));
const w={},ctx=vm.createContext({window:w});
const run=f=>vm.runInContext(read(f),ctx,{filename:f});
const plain=x=>JSON.parse(JSON.stringify(x));
run('assets/js/esitleme-veri.js');
const M=w.YDS.EsitlemeMotoru,table=json('tools/cumle/cumle-kalite-duzeltmeleri.json');
const aliases=Object.fromEntries(table.aliases.map(x=>[x.from,x.to]));
assert.strictEqual(Object.keys(aliases).length,6);
assert.deepStrictEqual(plain(M.CUMLE_ALIASES),aliases,'runtime / canonical aliases');
for(const [old,key]of Object.entries(aliases)){
 assert.strictEqual(M.ilerlemeKimligi(old,'cumle'),key);
 assert.strictEqual(M.ilerlemeKimliginiCoz(old).ad,key);
 // Latest study action, not blindly highest box: a later reset must survive.
 let z=M.zarfaCevir({'yds-leitner':{[old]:{k:5,c:100,g:130},[key]:{k:1,c:110,g:111}},'yds-test-yanlis':{[old]:{n:2,t:100},[key]:{n:3,t:110}}});
 let p=M.paket(z);
 assert.strictEqual(p['yds-leitner'][key].k,1);
 assert.ok(!(old in p['yds-leitner']));
 assert.strictEqual(p['yds-test-yanlis'][key].n,3);
 assert.ok(!(old in p['yds-test-yanlis']));
 z=M.kayitlariYaz(z,'yds-leitner',{[old]:{k:2,c:120,g:123}},()=> '120:device');
 assert.strictEqual(M.paket(z)['yds-leitner'][key].k,2);
 const encoded=M.bulutAlaniniKodla('yds-leitner',z.alanlar['yds-leitner']);
 const decoded=M.bulutAlaniniCoz('yds-leitner',plain(encoded));
 assert.deepStrictEqual(plain(decoded),plain(z.alanlar['yds-leitner']),'cloud roundtrip');
 const stale=plain(z);z=M.kayitlariSil(z,'yds-leitner',[old],()=> '130:device');
 assert.ok(!M.paket(M.birlestir(z,stale))['yds-leitner']?.[key],'tombstone beats stale');
 const mixed={surum:2,alanlar:{'yds-leitner':{i:{[old]:{m:'140:b',v:{k:1,c:140}},[key]:{m:'139:a',v:{k:5,c:139}}}}}};
 assert.strictEqual(M.paket(M.birlestir(mixed,{surum:2,alanlar:{}}))['yds-leitner'][key].k,1);
}
assert.strictEqual(M.ilerlemeKimligi('c:unknown-1','cumle'),'c:unknown-1');
assert.strictEqual(M.ilerlemeKimligi('ordinary','kelime'),'ordinary');

run('tools/ornek-duzeltmeleri.js');run('tools/tur-duzeltme.js');run('data/kelime-dizin.js');run('data/obekler.js');
let cards={};for(let i=1;i<=7;i++){run('data/kelime-k'+i+'.js');Object.assign(cards,w['KELIME_K'+i]);}
const qual=json('tools/icerik-kalite.json');
assert.strictEqual(qual.kelimeler.length,11);
for(const key of qual.kelimeler)assert.deepStrictEqual(plain(cards[key].a),plain(w.ORNEK_DUZELTMELERI[key]),'durable word '+key);
for(const [key,a]of Object.entries(qual.obekler))assert.deepStrictEqual(plain(w.OBEKLER.find(x=>x.f===key).a),a,'durable phrase '+key);
for(const key of ['despite','albeit','within','underneath','though','without','until'])assert.strictEqual(w.KELIME_DIZIN.find(x=>x.e===key).y,w.TUR_DUZELTME[key],'POS '+key);
assert.strictEqual(w.KELIME_DIZIN.find(x=>x.e==='off').t,'kapalı; -den uzakta; (kıyının) açığında');
assert.strictEqual(w.KELIME_DIZIN.find(x=>x.e==='build-up').t,'birikme, yığılma, artış; geliştirmek, artırmak, biriktirmek');
assert.strictEqual(w.OBEK_TAKMA['order to'],'in order to');
assert.strictEqual(json('tools/obek-lemma.json').takma['order to'],'in order to');
assert.ok(!w.OBEKLER.some(x=>x.f==='order to'));

const fn=read('assets/js/cumleler.js').match(/  function kimlik\(c\) \{[\s\S]*?\n  \}/);
assert.ok(fn,'production identity function');
vm.runInContext(fn[0]+'\nthis.__kimlik=kimlik;',ctx);
let sentences=[];for(const f of fs.readdirSync(path.join(root,'data/cumleler')).filter(x=>/\.js$/.test(x)))run('data/cumleler/'+f);
Object.values(w.CUMLELER_YIL).forEach(a=>sentences.push(...a));
for(const c of table.records){
 assert.strictEqual(ctx.__kimlik({e:c.eski}),c.sid,'old FNV identity retained');
 const rows=sentences.filter(r=>r.s===c.s&&r.e===c.e);
 assert.ok(rows.length,'corrected sentence exists');
 assert.ok(rows.some(r=>ctx.__kimlik(r)===(aliases[c.sid]||c.sid)),'runtime preserved reviewed or merged sid');
 if(c.n===null)assert.ok(rows.some(r=>r.n===undefined),'null clears question');
}
for(const h of table.incelemeler){const r=sentences.find(r=>r.s===h.s&&r.e===h.e);assert.ok(r);assert.strictEqual(r.inceleme,h.inceleme);assert.strictEqual(ctx.__kimlik(r),h.sid);}
assert.strictEqual(sentences.filter(r=>r.inceleme).length,14);
assert.strictEqual(sentences.length,8065,'six reviewed duplicates must be normalized');
assert.strictEqual(new Set(sentences.map(r=>r.s+'\u0000'+r.e.trim().replace(/\s+/g,' ').toLowerCase())).size,sentences.length,'no duplicate text within the same source');
assert.strictEqual(ctx.__kimlik({e:'Fallback.',sid:'not-valid'}),ctx.__kimlik({e:'Fallback.'}));
assert.strictEqual(ctx.__kimlik({e:'New text.',sid:'c:old-1'}),'c:old-1');
console.log('icerik-kalite: 11 kelime, 7 tür, 3 öbek, 172 cümle, 14 inceleme, 6 alias; legacy/v2/cloud/tombstone ve kalıcı kimlik başarılı');
