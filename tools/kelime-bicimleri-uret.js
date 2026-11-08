'use strict';
// Contemporary base forms, not etymological roots. Forward inflection is checked
// against actual dictionary headings/POS; derivation needs a reviewed family.
// Grammar references: https://dictionary.cambridge.org/grammar/british-grammar/word-formation_2
// https://dictionary.cambridge.org/grammar/british-grammar/-ing-and-ed-adjectives
// Lexical exclusions include https://dictionary.cambridge.org/dictionary/english/evening
// and https://www.oxfordlearnersdictionaries.com/definition/english/riches .
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
for(const file of ['data/kelime-dizin.js','assets/js/cekim.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const words=ctx.window.KELIME_DIZIN, C=ctx.window.YDS.Cekim, catalog=new Map(words.map(w=>[w.e,w]));
const families=Object.values(JSON.parse(fs.readFileSync(path.join(root,'tools/aile-manifest.json'),'utf8')).requiredFamilies);
// These spellings are independent lexemes in this dictionary, not the apparent
// inflection. In particular singe retains e in singeing; never publish singing.
const blocked=new Set(['evening|even','feed|fee','singing|singe','bore|bear','bit|bite','ground|grind',
  'physics|physic','mechanics|mechanic','aesthetics|aesthetic','ethics|ethic','ceramics|ceramic','riches|rich']);
const notes={
  found:'“Buldu/bulunmuş” anlamında find ile ilişkilidir. “Kurmak” anlamındaki found ayrı bir temel fiildir.',
  left:'“Ayrıldı/bıraktı” anlamında leave ile ilişkilidir. “Sol” anlamı ayrı bir kullanımdır.',
  saw:'“Gördü” anlamında see ile ilişkilidir. “Testere/kesmek” anlamları ayrı kullanımlardır.',
  rose:'“Yükseldi” anlamında rise ile ilişkilidir. “Gül” anlamı ayrı bir kullanımdır.',
  fell:'“Düştü” anlamında fall ile ilişkilidir. “Ağaç kesmek” anlamındaki fell ayrı bir fiildir.',
  lay:'“Yatıyordu” anlamında lie ile ilişkilidir. “Koymak/sermek” anlamındaki lay ayrı bir fiildir.',
  wound:'“Sardı/sarılmış” anlamında wind ile ilişkilidir. “Yara/yaralamak” anlamları ayrı kullanımlardır; telaffuzları da farklıdır.',
  bound:'“Bağlı/bağlanmış” anlamında bind ile ilişkilidir. “Bir yere giden” gibi kullanımları ayrıca öğren.',
  shot:'shoot fiilinin geçmiş/V3 biçimidir. “Atış/iğne” gibi isim anlamları da vardır.',
  putting:'Bağlama göre put (koymak) veya putt (golfte topu deliğe yuvarlamak) fiilinin -ing biçimidir.',
  lying:'lie, hem “yatmak/uzanmak” hem “yalan söylemek” anlamında lying biçimini alır.',
  data:'datum sözcüğünün çoğul biçimidir; güncel kullanımda topluluk/kütle adı olarak da kullanılabilir.',
  people:'person için çoğul kullanımdır. “Halk” ve “nüfuslandırmak” anlamlarını ayrıca öğren.'
};
const output={};
function add(word,base,forms,extra){
  if(!catalog.has(word)||!catalog.has(base)||word===base||blocked.has(word+'|'+base))return;
  const list=output[word]||(output[word]=[]), old=list.find(r=>r.b===base&&r.kind===(extra&&extra.kind||'inflection'));
  if(old){forms.forEach(f=>{if(!old.f.includes(f))old.f.push(f);});return;}
  list.push(Object.assign({b:base,f:forms,kind:'inflection'},notes[word]?{n:notes[word]}:{},extra||{}));
}
for(const base of words){
  if(!/^[a-z]+$/.test(base.e))continue;
  const forms=[];if(base.y.includes('fiil'))forms.push('s','past','pp','ing');if(base.y.includes('isim'))forms.push('pl');
  for(const f of forms){const name=C.cek(base.e,f),target=catalog.get(name);if(!target)continue;
    if(f==='s'&&!target.y.includes('fiil'))continue;
    if(f==='pl'&&!target.y.includes('isim'))continue;
    add(name,base.e,[f]);
  }
}
// Direct, productive suffixes only, with an already reviewed semantic family.
// Complex changes such as relate/relative are deliberately not guessed here.
for(const family of families)for(const base of family){const b=catalog.get(base);if(!b||!/^[a-z]+$/.test(base))continue;
  for(const suffix of ['ly','ness','ful','less','ment']){
    if(suffix==='ly'&&!b.y.includes('sıfat'))continue;
    if(suffix==='ness'&&!b.y.includes('sıfat'))continue;
    if(suffix==='ment'&&!b.y.includes('fiil'))continue;
    const stem=/[^aeiou]y$/.test(base)?base.slice(0,-1)+'i':base;
    const candidates=[base+suffix,stem+suffix];
    if(suffix==='ly'&&base.endsWith('le'))candidates.push(base.slice(0,-1)+'y');
    for(const name of candidates){const t=catalog.get(name);if(!t||!family.includes(name)||output[name])continue;
      if(suffix==='ly'&&!t.y.includes('zarf'))continue;
      add(name,base,[],{kind:'derivation',a:suffix});
    }
  }
}
const comparisons={better:['good','well'],best:['good','well'],worse:['bad'],worst:['bad'],larger:['large'],largest:['large'],higher:['high'],smaller:['small'],older:['old'],younger:['young']};
for(const [word,bases] of Object.entries(comparisons))for(const b of bases)add(word,b,[],{kind:'comparison',a:['best','worst','largest'].includes(word)?'superlative':'comparative',n:'Burada sıfat/zarf olarak karşılaştırma anlamı gösterilir; varsa ayrı fiil veya isim anlamlarını karttan öğren.'});
// Publication accepts reviewed decisions, never scanner candidates. These files
// also retain rejected collisions and the complete set of examined headings.
const reviewFiles=['a-h','i-p','q-z'].map(part=>'kelime-bicimleri-inceleme-'+part+'.json');
const examined=new Set(),additions=new Set(),rejected={},references=new Set();
const baseline=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'kelime-bicimleri-tarama-baslangic.json'),'utf8')).words);
for(const name of reviewFiles){
  const review=JSON.parse(fs.readFileSync(path.join(__dirname,name),'utf8'));
  if(review.schemaVersion!==1||!Array.isArray(review.reviewedWords)||!review.entries)throw Error('Invalid review '+name);
  for(const word of review.reviewedWords){
    if(!catalog.has(word)||baseline.has(word)||examined.has(word))throw Error('Invalid or duplicate review heading '+word);
    examined.add(word);
  }
  for(const url of review.sources||[])references.add(url);
  for(const [word,reason] of Object.entries(review.rejected||{})){
    if(!review.reviewedWords.includes(word)||typeof reason!=='string'||!reason.trim())throw Error('Invalid rejection '+word);
    rejected[word]=reason;
  }
  for(const [word,rows] of Object.entries(review.entries)){
    if(!review.reviewedWords.includes(word)||!Array.isArray(rows)||!rows.length||rejected[word])throw Error('Invalid reviewed entry '+word);
    const seen=new Set();output[word]=[];additions.add(word);
    for(const row of rows){
      if(typeof row.b!=='string'||row.b===word||!row.b.trim()||!['inflection','derivation','prefix','comparison','family'].includes(row.kind))throw Error('Invalid base '+word);
      if(!catalog.has(row.b)&&!(typeof row.m==='string'&&row.m.trim()))throw Error('Missing base translation '+word+' / '+row.b);
      if(!Array.isArray(row.f)||row.f.some(f=>!['s','past','pp','ing','pl','present'].includes(f)))throw Error('Invalid forms '+word);
      if(row.kind==='inflection'&&!row.f.length)throw Error('No inflection '+word);
      if(['derivation','prefix','comparison'].includes(row.kind)&&!(typeof row.a==='string'&&row.a.trim()))throw Error('No affix '+word);
      if(row.kind!=='inflection'&&row.f.length)throw Error('Unexpected inflection tags '+word);
      if(row.kind==='family'&&(row.a||!row.p||!row.n))throw Error('Family link needs explanation, not an affix '+word);
      for(const field of ['m','n','p'])if(row[field]!==undefined&&typeof row[field]!=='string')throw Error('Invalid description '+word);
      const key=[row.b,row.kind,row.a||'',row.f.join(',')].join('|');if(seen.has(key))throw Error('Duplicate relation '+word);seen.add(key);
      const clean={b:row.b,f:row.f,kind:row.kind};for(const field of ['a','m','n','p'])if(row[field])clean[field]=row[field];
      output[word].push(clean);for(const url of row.sources||[])references.add(url);
    }
  }
}
const missing=words.filter(w=>!baseline.has(w.e)&&!examined.has(w.e));if(missing.length)throw Error('Unreviewed headings: '+missing.map(w=>w.e).join(', '));
for(const word of baseline)if(!output[word]||!output[word].length)throw Error('Previously supported heading lost: '+word);
const inventory=JSON.parse(fs.readFileSync(path.join(__dirname,'kelime-bicimleri-adaylar.json'),'utf8'));
for(const row of inventory.rows)if(row.candidates.length&&!additions.has(row.word)&&!rejected[row.word])throw Error('Candidate needs a decision: '+row.word);
// These headings also have independent senses (found = establish, saw = tool,
// might = strength, etc.). Their inflection may be shown on their own card with
// its note, but must not be inferred from another word such as founder/sawing.
for(const word of ['found','left','saw','rose','fell','lay','wound','bound','shot','lying','putting','might','people']){
  for(const row of output[word]||[])row.contextual=true;
}
// New derivatives also expose these existing base cards through a chain. Keep
// their intended sense instead of inheriting the catalogue's first translation.
for(const row of output.willing||[]){row.m='istemek, arzulamak; iradeyle yönlendirmek';row.n='Buradaki will isteme/irade anlamındadır; gelecek zamanı bildiren modal will değildir. Willing çoğunlukla istekli/gönüllü anlamında sıfattır.';}
for(const row of output.peoples||[]){row.m='halk; topluluk';row.n='Halklar anlamında people isminin çoğuludur; person → people insan/insanlar ilişkisiyle karıştırma.';}
references.add('https://dictionary.cambridge.org/dictionary/english/will');
const audit={schemaVersion:1,baseline:baseline.size,total:words.length,reviewed:examined.size,added:additions.size,
  withBase:Object.keys(output).length,relationships:Object.values(output).reduce((n,rows)=>n+rows.length,0),
  relationshipKinds:Object.values(output).flat().reduce((counts,row)=>{counts[row.kind]=(counts[row.kind]||0)+1;return counts;},{}),
  withoutAdditionalBase:words.length-Object.keys(output).length,rejectedCandidates:Object.keys(rejected).length,
  policy:'Every remaining heading was inspected. Only accepted contemporary relationships are published; no additional base is invented for other headings.',
  externalBases:[...new Set(Object.values(output).flat().filter(r=>!catalog.has(r.b)).map(r=>r.b))].sort(),
  sources:[...references].sort(),reviewFiles};
const auditFile=path.join(__dirname,'kelime-bicimleri-kapsam.json'),auditText=JSON.stringify(audit,null,2)+'\n';
if(process.argv.includes('--check')){if(!fs.existsSync(auditFile)||fs.readFileSync(auditFile,'utf8')!==auditText)throw Error('Coverage audit is stale');}else fs.writeFileSync(auditFile,auditText);
const ordered=Object.fromEntries(Object.keys(output).sort().map(k=>[k,output[k].sort((a,b)=>a.b.localeCompare(b.b,'en'))]));
const text='/* Temel biçimler — tools/kelime-bicimleri-uret.js üretir. Etimolojik kök iddiası yoktur. */\nwindow.KELIME_BICIMLERI = '+JSON.stringify(ordered,null,0)+';\n';
const file=path.join(root,'data/kelime-bicimleri.js');
if(process.argv.includes('--check')){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==text)throw Error('Temel biçim verisi güncel değil');}
else fs.writeFileSync(file,text);
console.log('Temel biçimler: '+Object.keys(output).length+' kart; '+Object.values(output).flat().length+' bağ.');
module.exports=ordered;
