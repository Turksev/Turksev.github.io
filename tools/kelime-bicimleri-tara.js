'use strict';
// Review candidates only. This scanner never publishes a morphological claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
for(const f of ['data/kelime-dizin.js','data/kelime-bicimleri.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const words=ctx.window.KELIME_DIZIN,catalog=new Map(words.map(w=>[w.e,w]));
const baselinePath=path.join(__dirname,'kelime-bicimleri-tarama-baslangic.json');
if(!fs.existsSync(baselinePath)){
  if(process.argv.includes('--check'))throw Error('Review baseline missing');
  fs.writeFileSync(baselinePath,JSON.stringify({date:'2026-11-08',words:Object.keys(ctx.window.KELIME_BICIMLERI).sort()},null,2)+'\n');
}
const baseline=new Set(JSON.parse(fs.readFileSync(baselinePath,'utf8')).words);
const suffixes={ly:['','e','le'],ness:['','e','y'],ity:['','e','ous'],ility:['le','il'],ation:['e','','ate'],ition:['e',''],tion:['te','t',''],sion:['de','d','s',''],ment:['','e'],ance:['','e','ant'],ence:['','e','ent'],ancy:['ant','','e'],ency:['ent','','e'],able:['','e','y'],ible:['','e'],ive:['e','','ion'],ous:['','e','y'],ful:['','e'],less:['','e'],ical:['','e','y','ic'],ial:['','e','y'],al:['','e','y'],ic:['','e','y'],isation:['e',''],ization:['e',''],ise:['','e'],ize:['','e'],er:['','e'],or:['','e'],ist:['','e','y'],ism:['','e'],ant:['','e','ate'],ent:['','e'],ary:['','e'],ory:['','e'],ate:['','e'],ify:['','e','y'],ship:[''],hood:[''],dom:[''],age:['','e'],en:['','e'],ish:['']};
const prefixes=['un','in','im','ir','il','dis','non','re','pre','mis','over','under','out','de','anti','inter','sub','super','trans','co','counter','post','fore','self','multi','semi','bi','tri','mono','micro','macro','auto','pseudo'];
const rows=words.filter(w=>!baseline.has(w.e)).sort((a,b)=>a.e.localeCompare(b.e,'en')).map(w=>{
  const candidates=[],seen=new Set();
  function add(b,kind,a,f){const target=catalog.get(b),key=[b,kind,a,f].join('|');if(!target||b===w.e||seen.has(key))return;seen.add(key);candidates.push({b,kind,...(a?{a}:{}),...(f?{f:[f]}:{}),meaning:target.t,pos:target.y});}
  for(const [suffix,endings] of Object.entries(suffixes))if(w.e.endsWith(suffix)){
    const stem=w.e.slice(0,-suffix.length),stems=[stem];if(stem.endsWith('i'))stems.push(stem.slice(0,-1)+'y');if(/(.)\1$/.test(stem))stems.push(stem.slice(0,-1));
    for(const s of stems)for(const end of endings)if(s.length>=2)add(s+end,'derivation',suffix);
  }
  for(const prefix of prefixes)if(w.e.startsWith(prefix)){const b=w.e.slice(prefix.length).replace(/^-/,'');if(b.length>=2)add(b,'prefix',prefix);}
  for(const [suffix,form] of [['ing','ing'],['ed','past'],['s','pl'],['es','pl']])if(w.e.endsWith(suffix)){
    const s=w.e.slice(0,-suffix.length);for(const b of [s,s+'e',s.replace(/(.)\1$/,'$1'),s.endsWith('i')?s.slice(0,-1)+'y':s,s.endsWith('y')?s.slice(0,-1)+'ie':s])add(b,'inflection',null,form);
  }
  for(const suffix of ['er','est'])if(w.e.endsWith(suffix)){const s=w.e.slice(0,-suffix.length);for(const b of [s,s+'e',s.replace(/(.)\1$/,'$1'),s.endsWith('i')?s.slice(0,-1)+'y':s])if(catalog.has(b)&&/sıfat|zarf/.test(catalog.get(b).y))add(b,'comparison',suffix==='er'?'comparative':'superlative');}
  return {word:w.e,meaning:w.t,pos:w.y,candidates,affixLooking:/(ing|ed|ies|ly|ness|ment|tion|sion|ity|able|ible|ful|less|ous|ive|ism|ist|ship|hood|dom|est)$/.test(w.e),compound:/[ -]/.test(w.e)};
});
const report={schemaVersion:1,policy:'Candidates require lexical review; spelling alone is not evidence.',catalogSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'data/kelime-dizin.js'),'utf8').replace(/\r\n/g,'\n')).digest('hex'),catalogCount:words.length,baselineCount:baseline.size,reviewCount:rows.length,rows};
const file=path.join(__dirname,'kelime-bicimleri-adaylar.json'),text=JSON.stringify(report,null,2)+'\n';
if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==text)throw Error('Candidate inventory is stale');}else fs.writeFileSync(file,text);
console.log(JSON.stringify({catalog:words.length,baseline:baseline.size,remaining:rows.length,candidates:rows.filter(r=>r.candidates.length).length,affixLooking:rows.filter(r=>r.affixLooking).length}));
