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
const ordered=Object.fromEntries(Object.keys(output).sort().map(k=>[k,output[k].sort((a,b)=>a.b.localeCompare(b.b,'en'))]));
const text='/* Temel biçimler — tools/kelime-bicimleri-uret.js üretir. Etimolojik kök iddiası yoktur. */\nwindow.KELIME_BICIMLERI = '+JSON.stringify(ordered,null,0)+';\n';
const file=path.join(root,'data/kelime-bicimleri.js');
if(process.argv.includes('--check')){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==text)throw Error('Temel biçim verisi güncel değil');}
else fs.writeFileSync(file,text);
console.log('Temel biçimler: '+Object.keys(output).length+' kart; '+Object.values(output).flat().length+' bağ.');
module.exports=ordered;
