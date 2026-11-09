'use strict';
// İzole profilde aynı kayıtları bütün sayaçlara uygular; gerçek kullanıcı verisine dokunmaz.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'), data={window:{}};
for(const f of ['kelime-dizin.js','katman-uyelik.js','kelime-aliaslari.js','obekler.js','aileler.js'])
  vm.runInNewContext(fs.readFileSync(path.join(root,'data',f),'utf8'),data);
const D=data.window.KELIME_DIZIN, O=data.window.OBEKLER, F=data.window.AILELER;
const ids=data.window.YDS_KELIME_ILERLEME_KIMLIKLERI;
const rows={}, wordBoxes={}, phraseBoxes={};
function word(w,k){wordBoxes[w]=k;rows[ids[w]||w]={k,g:1,c:1,...(k===0?{s:1}:{})};}
function phrase(w,k){phraseBoxes[w]=k;rows[w]={k,g:1,c:1};}
for(let layer=1;layer<=7;layer++) D.filter(d=>d.k===layer).slice(0,6).forEach((d,k)=>word(d.e,k));
const family=F.find(f=>f.u.length===2&&f.u.every(w=>D.some(d=>d.e===w)));
word(family.u[0],4);word(family.u[1],5);
word('used to',5);phrase('used to',2);
O.slice(0,5).forEach((o,i)=>phrase(o.f,i+1));
phrase('look at',5);
rows['audit-retired-word']={k:5,g:1,c:1};
rows['audit retired phrase']={k:3,g:1,c:1};
rows['c:audit-sentence']={k:4,g:1,c:1};
function expectedWords(layers=[1,2,3,4,5,6,7]) {
  const a=[0,0,0,0,0,0];D.filter(d=>layers.includes(d.k)).forEach(d=>a[wordBoxes[d.e]||0]++);return a;
}
function expectedPhrases(){const a=[0,0,0,0,0,0];O.forEach(o=>a[phraseBoxes[o.f]||0]++);return a;}
const n=x=>Number(String(x).replace(/\./g,'')), total=a=>a.reduce((s,x)=>s+x,0);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{
  let route=new URL(req.url,'http://localhost').pathname;
  if(process.env.YDS_QA_SOURCE==='1')route=route.replace(/^\/releases\/[a-f0-9]{12}\//,'/');
  const file=path.resolve(root,'.'+(route==='/'?'/index.html':route));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':(mime[path.extname(file)]||'application/octet-stream')+'; charset=utf-8'});
  fs.createReadStream(file).pipe(res);
});
async function main(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({args:['--explicitly-allowed-ports='+server.address().port]});
  const ctx=await browser.newContext({serviceWorkers:'block',timezoneId:'Europe/Istanbul',reducedMotion:'reduce'});
  await ctx.route(/^https:\/\//,r=>r.abort());
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(base+'/kelimeler.html');
    await page.evaluate(r=>{
      const p=YDS.Depo;
      p.yaz('yds-leitner',r);p.yaz('yds-katmanlar',[1,2,3,4,5,6,7]);p.yaz('yds-katman7',true);
      p.yaz('yds-gunluk-yeni',5);p.yaz('yds-gunluk-tavan',20);
    },rows);
    const words=expectedWords(),phrases=expectedPhrases();
    const wordCounts=()=>page.locator('#kutular [data-k] b').allTextContents().then(a=>a.map(n));
    const statusCounts=()=>page.locator('#sekmeler .ks b').allTextContents().then(a=>a.map(n));
    await page.reload();
    await page.waitForFunction(()=>document.querySelectorAll('#kutular [data-k]').length===6);
    assert.deepEqual(await wordCounts(),words,'Kelimeler: tüm katalog kutuları');
    for(let k=0;k<=5;k++){
      await page.locator('#kutular [data-k="'+k+'"]').click();
      assert.ok((await page.locator('#sayac').innerText()).startsWith(String(words[k])+' '),'Kutu filtresi liste adedi '+k);
    }
    await page.goto(base+'/istatistik.html');
    assert.deepEqual((await page.locator('#kutuEfsane b').allTextContents()).map(n),words,'İstatistik: tüm kelimeler');
    const planText=(remaining,pace)=>'Toplam 9.379 kelimenin '+remaining.toLocaleString('tr-TR')+' tanesine henüz başlanmamış. Günde '+pace+' yeni kelimeyle ilk tur için '+Math.ceil(remaining/pace).toLocaleString('tr-TR')+' gün planlayabilirsin.';
    assert.equal(await page.locator('#tahminMetin').innerText(),planText(words[0],5));
    await page.locator('#planHiz').fill('40');
    assert.equal(await page.locator('#tahminMetin').innerText(),planText(words[0],40));
    assert.equal(await page.evaluate(()=>YDS.Ilerleme.gunlukHedef()),5,'Plan hesabı gerçek günlük hedefi değiştirmez');
    await page.goto(base+'/index.html');
    assert.equal(n(await page.locator('#acilisGenel .r-mezun [data-sayac]').innerText()),words[5],'Açılış: yalnız 5. kutu');
    assert.equal(n(await page.locator('#acilisGenel .r-ogren [data-sayac]').innerText()),total(words.slice(1,5)),'Açılış: 1–4. kutu');
    await page.goto(base+'/ana-sayfa.html');
    assert.equal(n(await page.locator('#p-ogrenilen').innerText()),words[5],'Ana sayfa: öbek ve eski kayıt karışmaz');
    assert.match(await page.locator('#p-kelimeOzet').innerText(),new RegExp((D.length-words[0])+'/'+D.length+' kelimeye başlandı'));
    await page.goto(base+'/obekler.html');
    assert.deepEqual(await wordCounts(),phrases,'Öbekler: kelime kaydı karışmaz');
    await page.goto(base+'/durum.html');
    await page.waitForFunction(()=>!!window.OBEKLER);
    const combined=words.slice(1).map((v,i)=>v+phrases[i+1]);
    await page.waitForFunction(n=>Number(document.querySelector('#sekmeler [data-k="0"] b').textContent.replace(/\./g,''))===n,total(combined));
    assert.deepEqual(await statusCounts(),[total(combined),...combined],'Durum: yalnız güncel kelime + öbek');
    await page.locator('#tur').selectOption('kelime');
    assert.deepEqual(await statusCounts(),[total(words.slice(1)),...words.slice(1)],'Durum: kelime filtresi bütün kutu sayılarını değiştirir');
    assert.match(await page.locator('#sistemToplam').innerText(),/9\.379 kelime/);
    await page.locator('#tur').selectOption('obek');
    assert.deepEqual(await statusCounts(),[total(phrases.slice(1)),...phrases.slice(1)],'Durum: öbek filtresi');
    await page.locator('#tur').selectOption('arsiv');
    assert.deepEqual(await statusCounts(),[2,0,0,1,0,1],'Eski kayıtlar ayrı ve korunmuş');
    assert.match(await page.locator('#liste').innerText(),/tamamlandı · yeniden sorulmaz/);
    assert.doesNotMatch(await page.locator('#liste .word').filter({hasText:'audit-retired-word'}).innerText(),/bugün tekrar/);
    await page.goto(base+'/aileler.html?a='+encodeURIComponent(family.k));
    const card=page.locator('.aile[data-kok="'+family.k+'"]');
    assert.equal(await card.locator('[role="progressbar"]').getAttribute('aria-valuenow'),'1','4. kutu ailede öğrenildi sayılmaz');
    await page.locator('#durum').selectOption('tam');
    assert.equal(await card.count(),0,'4. kutu aileyi tamamlanmış yapmaz');
    // Başka sekmeden gelen yükseliş, açık filtrelenmiş listeyi de yeniler.
    await page.evaluate(w=>{YDS.Ilerleme.zatenBiliyorum(w,'kelime');window.dispatchEvent(new CustomEvent('yds-depo-degisti',{detail:{kaynak:'sekme',anahtarlar:['yds-leitner']}}));},family.u[0]);
    wordBoxes[family.u[0]]=5;
    assert.equal(await card.locator('[role="progressbar"]').getAttribute('aria-valuenow'),'2');
    // Seçili kapsam toplam istatistiği değiştirmez, günlük deste ekranları aynı kalır.
    await page.evaluate(()=>YDS.Depo.yaz('yds-katmanlar',[2]));
    await page.goto(base+'/kelimeler.html');
    assert.deepEqual(await wordCounts(),expectedWords([2]));
    const deck=await page.locator('#desteBasla').innerText();
    const expectedDeck=Number(deck.match(/\d+/)?.[0]||0);
    await page.goto(base+'/ana-sayfa.html');
    assert.equal(n(await page.locator('#p-bugun').innerText()),expectedDeck,'Ana sayfadaki deste seçili katmanlara ait');
    await page.goto(base+'/istatistik.html');
    assert.deepEqual((await page.locator('#kutuEfsane b').allTextContents()).map(n),expectedWords());
    assert.equal(await page.locator('#tahminMetin').innerText(),planText(expectedWords()[0],5),'Tek katman seçimi tüm kelimeler planını daraltmaz');
    // Eski katman seçimi de planı daraltmamalı; istatistik salt okunur kalır.
    await page.evaluate(()=>{YDS.Depo.yaz('yds-katmanlar',[6]);YDS.Depo.sil('yds-katman7');});
    await page.reload();
    assert.equal(await page.locator('#tahminMetin').innerText(),planText(expectedWords()[0],5));
    assert.equal(await page.evaluate(()=>YDS.Depo.oku('yds-katman7',false)),false,'İstatistik tercih göçünü yazmaz');
    await page.goto(base+'/kelimeler.html');
    assert.deepEqual(await wordCounts(),expectedWords([7]));
    // Boş seçim tüm sayfalarda boş kalır; gizlice Çekirdek'e geri dönülmez.
    await page.evaluate(()=>YDS.Depo.yaz('yds-katmanlar',[]));
    await page.reload();
    assert.deepEqual(await wordCounts(),[0,0,0,0,0,0]);
    await page.goto(base+'/istatistik.html');
    assert.equal(await page.locator('#tahminMetin').innerText(),planText(expectedWords()[0],5),'Katman seçilmeden de tüm kelimeler için plan yapılır');
    await page.goto(base+'/oyunlar.html');
    assert.equal(await page.locator('#katmanlar [aria-pressed="true"]').count(),0);
    assert.ok(await page.evaluate(()=>!!YDS.Depo.oku('yds-leitner',{})['audit-retired-word']),'Eski kayıt silinmedi');
    // Tek sözcüklü bir öbek de öbek dosyasını yükletmeli; boşlukla tür tahmini yapılmaz.
    await page.evaluate(()=>YDS.Depo.yaz('yds-leitner',{'-looking':{k:3,g:1,c:1}}));
    await page.goto(base+'/durum.html');
    await page.waitForFunction(()=>!!window.OBEKLER);
    await page.locator('#tur').selectOption('obek');
    assert.deepEqual(await statusCounts(),[1,0,0,1,0,0],'Tek sözcüklü öbek arşive karışmaz');
    assert.deepEqual(errors,[],'Sayfalarda JavaScript hatası yok');
    console.log('Kutu dağılımı: 9.379 kelime, 1.854 öbek; 7 ekran, 0–5 kutu, tür/katman filtreleri, eski kayıtlar, 5. kutu ve eşitleme geçti.');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1;});
