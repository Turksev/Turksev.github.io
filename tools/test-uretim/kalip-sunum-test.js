'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {build}=require('../kalip-sunum-uret');
const {readCollection,protectedDigest}=require('../kalip-anlam-kaynagi');
const {loadCards}=require('../kalip-anlam-uygula');
const {ayir,ozet}=require('../../assets/js/kalip-sunum');
const root=path.resolve(__dirname,'../..'),result=build(),{rows,manifest}=readCollection();
assert.equal(fs.readFileSync(path.join(root,'data/kalip-sunum.js'),'utf8'),result.text);
const cards=Object.assign({},...loadCards().map(file=>file.cards));
assert.equal(protectedDigest(cards),manifest.protected_sha256,'Card identities, meanings and examples stay intact');
let count=0;
for(const decision of result.decisions){
  const pairs=rows.get(decision.word).replacement,original=JSON.stringify(pairs);
  const groups=ayir(decision.word,pairs,result.data);
  assert.deepEqual(groups.temel,pairs.filter((_,i)=>!decision.secondary.includes(i)));
  assert.deepEqual(groups.diger,pairs.filter((_,i)=>decision.secondary.includes(i)));
  assert.deepEqual(cards[decision.word].kl,pairs,'All existing EN/TR text stays unchanged: '+decision.word);
  assert.equal(groups.temel.length+groups.diger.length,pairs.length);
  assert.ok(groups.temel.length>0);
  assert.equal(JSON.stringify(pairs),original,'Presentation never mutates content');
  count+=pairs.length;
}
assert.equal(count,45833);
assert.equal(result.stats.words,9379);
const establish=ayir('establish',cards.establish.kl,result.data).temel.map(p=>p.en);
for(const phrase of ['establish a company','establish a system','establish the cause','establish the facts'])assert.ok(establish.includes(phrase),phrase+' stays visible');
assert.ok(establish.some(p=>/^establish that/.test(p)));
assert.ok(establish.some(p=>/^establish whether/.test(p)));
const pairs=[{en:'<img src=x onerror="alert(1)">',tr:'A & B'},{en:'other',tr:'diğer'},{en:'third',tr:'üçüncü'}];
const rule={count:3,hash:ozet(pairs),secondary:[1]};
const data=r=>({schema_version:1,words:{test:r}});
assert.deepEqual(ayir('test',pairs,data(rule)),{temel:[pairs[0],pairs[2]],diger:[pairs[1]]});
for(const invalid of [null,{}, {...rule,hash:'stale'}, {...rule,count:4}, {...rule,secondary:[-1]}, {...rule,secondary:[1,1]}, {...rule,secondary:[3]}, {...rule,secondary:[0,1,2]}, {...rule,secondary:[1.5]}]){
  assert.deepEqual(ayir('test',pairs,data(invalid)),{temel:pairs,diger:[]},'Malformed or stale metadata must keep every use visible');
}
for(const invalid of [{},{schema_version:2,words:{test:rule}},{schema_version:1,words:{}}])assert.deepEqual(ayir('test',pairs,invalid),{temel:pairs,diger:[]});
const c={window:{KALIP_SUNUM:data(rule)}};vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/kalip-sunum.js'),'utf8'),c);
const html=c.window.YDS.KalipSunum.html('test',pairs);
assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
assert.match(html,/A &amp; B/);
assert.doesNotMatch(html,/<img|<details[^>]*\bopen\b/);
assert.match(html,/<summary>Diğer kullanımlar .*\(1\)/);
assert.doesNotMatch(c.window.YDS.KalipSunum.html('unknown',pairs),/<details/);
assert.doesNotMatch(c.window.YDS.KalipSunum.html('test',pairs,{part:'primary'}),/<details/);
assert.doesNotMatch(c.window.YDS.KalipSunum.html('test',pairs,{part:'secondary'}),/kalip-temel/);
for(const page of ['kelimeler','ara','oyunlar','obekler','cumleler']){
  const html=fs.readFileSync(path.join(root,page+'.html'),'utf8');
  const a=html.indexOf('data/kalip-sunum.js'),b=html.indexOf('assets/js/kalip-sunum.js');
  const consumer=html.search(/assets\/js\/(?:sozluk|ara|oyunlar)\.js/);
  assert.ok(a>0&&a<b&&b<consumer,page+': data and shared renderer load before use');
}
console.log('9,379 cards / 45,833 pairs preserved; editorial partition, safe fallbacks, escaping and shared page integration passed');
