'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const {readCollection} = require('./kalip-anlam-kaynagi');
const root = path.resolve(__dirname, '..');
const hash = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0,16);
const hosts = new Set(['dictionary.cambridge.org','www.oxfordlearnersdictionaries.com','www.merriam-webster.com','learnenglish.britishcouncil.org']);
function build() {
  const {rows} = readCollection(), ids = new Set(), contexts = new Set(), sorular = [];
  for (const tur of ['anlam','edat','yapi']) {
    const questions = JSON.parse(fs.readFileSync(path.join(__dirname,'kalip-calisma',tur+'.json'),'utf8'));
    assert.ok(Array.isArray(questions) && questions.length, tur + ': soru havuzu boş');
    for (const s of questions) {
      const fail = text => s.id + ': ' + text;
      assert.equal(s.tur,tur); assert.match(s.id,/^[a-z][a-z0-9-]+$/); assert.ok(!ids.has(s.id),fail('tekrarlı kimlik')); ids.add(s.id);
      for (const key of ['kelime','cumle','soru','aciklama','ceviri','tamamlanmis']) assert.ok(typeof s[key] === 'string' && s[key].trim(),fail(key));
      const row = rows.get(s.kelime); assert.ok(row,fail('kelime kartı yok: '+s.kelime));
      assert.ok(row.replacement.some(p=>p.en===s.kalip.en && p.tr===s.kalip.tr),fail('kalıp mevcut karttaki birebir EN/TR çifti olmalı'));
      assert.ok(Array.isArray(s.secenekler) && s.secenekler.length >= 2 && s.secenekler.length <= 4,fail('şık sayısı'));
      assert.ok(s.secenekler.every(x=>typeof x==='string' && x.trim()),fail('boş şık'));
      assert.equal(new Set(s.secenekler.map(x=>x.toLocaleLowerCase('en').trim())).size,s.secenekler.length,fail('tekrarlı şık'));
      assert.ok(Number.isInteger(s.cevap) && s.cevap>=0 && s.cevap<s.secenekler.length,fail('cevap'));
      if(tur==='anlam') assert.equal(s.tamamlanmis,s.cumle,fail('anlam sorusunda tam cümle aynı olmalı'));
      else { assert.equal((s.cumle.match(/____/g)||[]).length,1,fail('tek boşluk')); assert.equal(s.cumle.replace('____',s.secenekler[s.cevap]),s.tamamlanmis,fail('boşluk doğru şıkla tamamlanmalı')); }
      if(tur==='yapi') assert.ok(Array.isArray(s.karsilastirma)&&s.karsilastirma.length>=2,fail('yapı karşılaştırması yok'));
      if(s.karsilastirma) for(const p of s.karsilastirma) assert.ok(p.en && p.tr,fail('eksik karşılaştırma çifti'));
      assert.ok(Array.isArray(s.kaynaklar)&&s.kaynaklar.length,fail('kaynak yok'));
      for(const url of s.kaynaklar){const u=new URL(url);assert.ok(u.protocol==='https:'&&hosts.has(u.hostname),fail('resmi kaynak URL: '+url));}
      const context=tur+'\n'+s.cumle+'\n'+s.soru; assert.ok(!contexts.has(context),fail('aynı soru'));contexts.add(context);
      sorular.push({...s,ozet:hash(s)});
    }
  }
  const bank={sema:1,surum:hash(sorular),sorular};
  return {bank,text:'/* tools/kalip-calisma-uret.js üretir; özgün, kaynakları kontrol edilmiş alıştırmalar. */\nwindow.KALIP_CALISMA = '+JSON.stringify(bank)+';\n',
    stats:{sorular:sorular.length,kelimeler:new Set(sorular.map(s=>s.kelime)).size,turler:Object.fromEntries(['anlam','edat','yapi'].map(t=>[t,sorular.filter(s=>s.tur===t).length]))}};
}
if(require.main===module){const result=build(),out=path.join(root,'data/kalip-calisma.js');if(process.argv.includes('--write'))fs.writeFileSync(out,result.text);else assert.equal(fs.readFileSync(out,'utf8'),result.text,'Kalıp alıştırma verisi güncel değil');console.log(JSON.stringify(result.stats));}
module.exports={build};
