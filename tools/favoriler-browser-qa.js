'use strict';
// Gerçek depo ve DOM, yalnız izole profil. Gerçek hesap veya kullanıcı kaydı kullanılmaz.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  let route=new URL(req.url,'http://localhost').pathname;
  if(process.env.YDS_QA_SOURCE==='1')route=route.replace(/^\/releases\/[a-f0-9]{12}\//,'/');
  const file=path.resolve(root,'.'+route);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'}[path.extname(file)]||'application/octet-stream')+'; charset=utf-8');
  fs.createReadStream(file).pipe(res);
});
const progress=p=>p.evaluate(()=>{const data=YDS.EsitlemeDepo.paket();delete data['yds-favoriler'];return data;});
async function main(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({args:['--explicitly-allowed-ports='+server.address().port]});
  const ctx=await browser.newContext({serviceWorkers:'block',timezoneId:'Europe/Istanbul',reducedMotion:'reduce'});
  await ctx.route(/^https:\/\//,r=>r.abort());const errors=[];
  ctx.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  try {
    const wordPage=await ctx.newPage();await wordPage.goto(base+'/kelimeler.html');
    await wordPage.locator('#liste [data-ne="calis"]').first().click();
    const word=await wordPage.locator('#kartOn').innerText(),star=wordPage.locator('#kartFavori');
    assert.equal(await star.getAttribute('aria-pressed'),'false');
    await star.click();assert.equal(await star.getAttribute('aria-pressed'),'true');
    assert.equal(await wordPage.locator('#kart').getAttribute('aria-expanded'),'false','star click does not reveal the card');
    await wordPage.waitForFunction(()=>getComputedStyle(document.querySelector('#kartFavori path')).fill==='rgb(247, 201, 72)');
    await star.press('Space');assert.equal(await star.getAttribute('aria-pressed'),'false');
    assert.equal(await wordPage.locator('#kart').getAttribute('aria-expanded'),'false','star keyboard activation does not reveal the card');
    await star.press('Enter');assert.equal(await star.getAttribute('aria-pressed'),'true');
    const fixtures=await wordPage.evaluate(word=>{
      const learned='necessarily',other=YDS.Veri.dizin.find(d=>d.k===3&&d.e!==word&&window.KALIP_SUNUM.words[d.e]).e;
      YDS.Ilerleme.zatenBiliyorum(learned,'kelime');
      YDS.Favoriler.ayarla(learned,true);YDS.Favoriler.ayarla(other,true);
      return {learned,other,layer:YDS.Veri.katmani(other)};
    },word);
    const baseline=await progress(wordPage);
    assert.equal(await wordPage.evaluate(()=>YDS.Favoriler.ayarla('__proto__',true)),false);
    // Failed storage must keep the star selected and report an error.
    await wordPage.evaluate(()=>{window.__remove=YDS.Depo.kayitlariSil;window.__warning=YDS.depolamaUyarisi;window.__warnings=0;YDS.Depo.kayitlariSil=()=>false;YDS.depolamaUyarisi=()=>window.__warnings++;});
    await star.click();assert.equal(await star.getAttribute('aria-pressed'),'true');
    assert.equal(await wordPage.evaluate(()=>window.__warnings),1);
    await wordPage.evaluate(()=>{YDS.Depo.kayitlariSil=window.__remove;YDS.depolamaUyarisi=window.__warning;});
    await wordPage.reload();
    assert.equal(await wordPage.locator('[data-favori-sayi]').innerText(),'3');
    await wordPage.locator('#liste [data-ne="calis"]').first().click();
    assert.equal(await star.getAttribute('aria-pressed'),'true','favorite survives reload');
    const fav=await ctx.newPage();await fav.goto(base+'/favoriler.html');
    assert.equal(await fav.locator('.favori-satir').count(),3);
    assert.deepEqual(await progress(fav),baseline,'opening the module does not change learning or layer settings');
    await fav.locator('#favoriAra').fill(fixtures.learned);
    assert.equal(await fav.locator('.favori-satir').count(),1);
    await fav.locator('#favoriAra').fill('no-such-word-123');
    assert.equal(await fav.locator('#favoriCalis').isDisabled(),true);
    await fav.locator('#favoriAra').fill('');await fav.locator('#favoriSirala').selectOption('az');
    assert.deepEqual(await fav.locator('.favori-sozcuk strong').allTextContents(),[word,fixtures.learned,fixtures.other].sort((a,b)=>a.localeCompare(b,'en')));
    await fav.locator('[data-favori-calis="'+fixtures.learned+'"]').click();
    assert.equal(await fav.locator('#favoriBildim').isDisabled(),true);
    assert.equal(await wordPage.evaluate(w=>YDS.Ilerleme.kutu(w,'kelime'),fixtures.learned),5,'learned favorites can be reviewed on request');
    await fav.waitForFunction(()=>document.getElementById('favoriYukleme').textContent==='');
    await fav.locator('#favoriKart').press('Space');
    assert.ok(await fav.locator('#favoriCevap [lang="en"]').count()>0,'full bilingual examples load');
    assert.ok(await fav.locator('#favoriCevap .kalip-temel').count()>0,'primary bilingual phrases accompany the answer');
    assert.equal(await fav.locator('#favoriTemel').isVisible(),true,'base forms accompany the answer');
    await fav.locator('#favoriZor').click();
    while(await fav.locator('#favoriCalisma').isVisible()){
      await fav.locator('#favoriKart').click();await fav.locator('#favoriBildim').click();
    }
    assert.match(await fav.locator('#favoriSonucMetin').innerText(),/3 kelime çalıştın: 2 kelimeyi hatırladın, 1 kelimeyi yeniden/);
    assert.deepEqual(await progress(fav),baseline,'practice, including a box-5 word, must not change boxes, quotas, history or counters');
    await fav.locator('#favoriZorlari').click();
    assert.equal(await fav.locator('#favoriKelime').innerText(),fixtures.learned);
    assert.match(await fav.locator('#favoriKartSayac').innerText(),/1 \/ 1/);
    await fav.waitForFunction(()=>document.getElementById('favoriYukleme').textContent==='');
    await fav.locator('#favoriKart').click();
    for(const theme of ['light','dark'])for(const width of [320,375,1280]){
      await fav.emulateMedia({colorScheme:theme});await fav.setViewportSize({width,height:900});
      assert.ok(await fav.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),theme+' '+width+': no overflow');
      await fav.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
      assert.deepEqual(await fav.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[]);
    }
    if(process.env.YDS_QA_SCREENSHOTS){
      await fav.setViewportSize({width:375,height:900});await fav.emulateMedia({colorScheme:'light'});
      await fav.screenshot({path:path.join(process.env.YDS_QA_SCREENSHOTS,'favoriler-mobile.png'),fullPage:true});
      await wordPage.setViewportSize({width:375,height:900});await wordPage.locator('#kart').scrollIntoViewIfNeeded();
      await wordPage.screenshot({path:path.join(process.env.YDS_QA_SCREENSHOTS,'kelime-favori-mobile.png')});
    }
    await fav.locator('#favoriKartYildiz').click();
    assert.equal(await fav.locator('#favoriListeBolum').isVisible(),true,'removing the only practice item ends that practice safely');
    assert.equal(await fav.locator('.favori-satir').count(),2);
    await fav.locator('[data-favori-kelime="'+word+'"]').click();
    await wordPage.waitForFunction(()=>document.getElementById('kartFavori').getAttribute('aria-pressed')==='false');
    assert.equal(await fav.locator('.favori-satir').count(),1,'cross-tab star removal is reflected without a reload');
    // A failed lazy load can be retried without losing favorites or progress.
    const layerRoute='**/data/kelime-k'+fixtures.layer+'.js';
    await ctx.route(layerRoute,r=>r.abort());await fav.reload();await fav.locator('#favoriCalis').click();
    await fav.locator('#favoriYenidenYukle').waitFor({state:'visible'});await fav.locator('#favoriKart').click();
    assert.match(await fav.locator('#favoriYukleme').innerText(),/Tam içerik yüklenemedi/);
    await ctx.unroute(layerRoute);await fav.locator('#favoriYenidenYukle').click();
    await fav.waitForFunction(()=>document.getElementById('favoriYukleme').textContent==='');
    assert.ok(await fav.locator('#favoriCevap [lang="en"]').count()>0);
    assert.equal(await fav.locator('#favoriDiger .kalip-diger').count(),1,'secondary phrases remain available under Diğer kullanımlar');
    await fav.locator('#favoriDiger summary').click();
    assert.ok(await fav.locator('#favoriDiger .kalip span').count()>0,'secondary phrases can be opened');
    assert.deepEqual(await progress(fav),baseline);
    // A slow previous card must not overwrite a newer one.
    await fav.evaluate(w=>YDS.Favoriler.ayarla(w,true),word);await fav.reload();
    const delayed='**/data/kelime-k2.js';await ctx.route(delayed,async r=>{await new Promise(resolve=>setTimeout(resolve,200));await r.continue();});
    await fav.locator('[data-favori-calis="'+word+'"]').click();await fav.locator('#favoriSonraki').click();
    await fav.waitForFunction(()=>document.getElementById('favoriYukleme').textContent==='');
    await fav.waitForTimeout(250);assert.equal(await fav.locator('#favoriKelime').innerText(),fixtures.other);
    await ctx.unroute(delayed);
    await fav.evaluate(()=>YDS.Favoriler.liste().forEach(w=>YDS.Favoriler.ayarla(w,false)));
    assert.equal(await fav.locator('#favoriBos').isVisible(),true);assert.equal(await fav.locator('#favoriCalis').isDisabled(),true);
    assert.deepEqual(await progress(fav),baseline);assert.deepEqual(errors,[]);
    console.log('Favoriler: yıldız/klavye, kalıcılık, iki sekme, arama, 5. kutu, bağımsız tur/tekrar, veri hatası/yeniden yükleme, eski isteğin yalıtımı, mobil/masaüstü axe geçti.');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1;});
