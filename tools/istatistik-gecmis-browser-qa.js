'use strict';
// Isolated browser profile: actual answer APIs, no user account or saved data.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  let file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':(mime[path.extname(file)]||'application/octet-stream')+'; charset=utf-8','Cache-Control':'no-store'});
  if(process.env.YDS_QA_SOURCE==='1'&&path.extname(file)==='.html')res.end(fs.readFileSync(file,'utf8').replace(/\/releases\/[0-9a-f]{12}\//g,'/'));
  else fs.createReadStream(file).pipe(res);
});
async function main(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({args:['--explicitly-allowed-ports='+server.address().port]});
  const context=await browser.newContext({serviceWorkers:'block',timezoneId:'Europe/Istanbul'});
  // Only local application assets are used; authentication is outside this test.
  await context.route(/^https:\/\//,route=>route.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:'+server.address().port;
  const time=day=>new Date('2026-10-'+String(day).padStart(2,'0')+'T12:00:00Z');
  try{
    await page.clock.setFixedTime(time(1));await page.goto(base+'/istatistik.html');
    await page.waitForFunction(()=>window.YDS&&typeof window.YDS.Ilerleme.kartGecmisi==='function');
    assert.match(await page.locator('#tekrarKapsam').innerText(),/henüz|Henüz/,'empty history is explained');
    const results=[];
    for(const [day,method] of [[1,'dogru'],[2,'dogru'],[5,'ipucuyla'],[6,'yanlis'],[7,'dogru'],[10,'yanlis'],[11,'dogru'],[14,'dogru'],[21,'dogru'],[22,'testDogru'],[23,'testYanlis'],[24,'dogru'],[25,'dogru']]){
      await page.clock.setFixedTime(time(day));
      results.push(await page.evaluate(({method})=>{
        const Y=window.YDS,Il=Y.Ilerleme;const value=Il[method]('establish','kelime');
        return {method,value,box:Il.kutu('establish','kelime'),daily:Il.gunlukKayitlar()[Il.bugun()]};
      },{method}));
    }
    assert.equal(results[2].box,2,'a hinted success preserves its existing scheduling rule');
    assert.equal(results[2].daily.b,1,'hinted known counts as known');assert.equal(results[2].daily.n,1);
    assert.equal(results[9].box,4,'daily test success does not promote');
    assert.equal(results[10].box,3,'daily test failure demotes');
    assert.equal(results.at(-1).box,5);
    const fixture=await page.evaluate(()=>{
      const Y=window.YDS,Il=Y.Ilerleme;
      Il.dogru('look at','obek');Il.yanlis('look at','obek');
      const word=Y.Veri.dizin.find(w=>w.e!=='establish'&&w.e!=='look at').e;
      Il.zatenBiliyorum(word,'kelime');Il.sifirlaKelime(word,'kelime');
      const h=Il.kartGecmisi();return {history:h,completed:Il.kutu('establish','kelime'),due:Il.vadesiGeldiMi('establish','kelime'),word};
    });
    assert.equal(fixture.completed,5);assert.equal(fixture.due,false,'box5 remains outside automatic review');
    assert.equal(fixture.history.events.filter(e=>e.card==='establish').length,13,'every completed answer has one history entry');
    await page.waitForFunction(()=>document.querySelectorAll('#tekrarDusmeler button').length>0);
    await page.locator('#tekrarDusmeler button[data-history-word="establish"]').click();
    await page.waitForFunction(()=>document.querySelectorAll('#tekrarGecmis tr').length===13);
    assert.equal(await page.locator('#kelimeGecmisBaslik').evaluate(e=>e===document.activeElement),true,'list selection focuses history heading');
    const timeline=await page.locator('#tekrarGecmis').innerText();
    assert.match(timeline,/Bildim/);assert.match(timeline,/Bilemedim/);assert.match(timeline,/5/);
    assert.equal(await page.locator('#tekrarDusmeler button').count(),1,'phrases and resets are not repeated word failures');
    assert.ok(await page.locator('#tekrarAraliklar tr').count()>0,'real elapsed review outcomes are shown');
    await page.locator('#tekrarKelimeAra').fill('ESTABLISH');await page.locator('#tekrarKelimeAra').press('Enter');
    assert.equal(await page.locator('#tekrarGecmis tr').count(),13,'case-insensitive search');
    await page.locator('#tekrarKelimeAra').fill('not-a-dictionary-word');await page.locator('#tekrarKelimeAra').press('Enter');
    assert.equal(await page.locator('#tekrarGecmisKutu').isHidden(),true,'unknown word does not display stale history');
    await page.locator('#tekrarKelimeAra').fill('establish');await page.locator('#tekrarKelimeAra').press('Enter');
    const before=await page.evaluate(()=>JSON.stringify(window.YDS.EsitlemeDepo.paket()));
    for(const days of [7,90,30])await page.locator('#aralik button[data-gun="'+days+'"]').click();
    assert.equal(await page.evaluate(()=>JSON.stringify(window.YDS.EsitlemeDepo.paket())),before,'statistics filters never rewrite learning data');
    const checks=[];
    for(const theme of ['light','dark'])for(const width of [320,375,1280]){
      await page.emulateMedia({colorScheme:theme});await page.setViewportSize({width,height:900});
      await page.waitForFunction(()=>document.getAnimations().every(a=>a.playState!=='running'||a.effect.getTiming().iterations===Infinity));
      for(const font of ['Arial','Verdana']){
        await page.addStyleTag({content:'body{font-family:'+font+',sans-serif!important}'});
        const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
        assert.ok(layout.scroll<=layout.width+1,'history layout '+JSON.stringify({theme,width,font,layout}));
        const dateColumn=await page.locator('#tekrarGecmis tr:first-child th').evaluate(e=>({width:e.getBoundingClientRect().width,whiteSpace:getComputedStyle(e).whiteSpace}));
        assert.ok(dateColumn.width>=130&&dateColumn.whiteSpace==='nowrap','date column remains readable while table scrolls: '+JSON.stringify(dateColumn));
      }
      await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
      const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
      assert.deepEqual(violations,[],'history accessibility '+theme+'/'+width);checks.push({theme,width});
      if(process.env.YDS_STATS_SCREENSHOTS&&theme==='light'&&[375,1280].includes(width)){
        await page.locator('#kelimeTekrar').screenshot({path:path.join(process.env.YDS_STATS_SCREENSHOTS,'history-'+width+'.png'),style:'.site-header,.skip-link{visibility:hidden!important}'});
      }
    }
    // Old totals cannot reveal whether past non-Bildim answers were hinted successes.
    const legacyContext=await browser.newContext({serviceWorkers:'block',timezoneId:'Europe/Istanbul'});
    await legacyContext.route(/^https:\/\//,route=>route.abort());
    const legacy=await legacyContext.newPage();await legacy.clock.setFixedTime(time(25));await legacy.goto(base+'/istatistik.html');
    await legacy.evaluate(()=>{
      const Y=window.YDS,empty={};Object.keys(Y.EsitlemeMotoru.TIPLER).filter(k=>k.startsWith('yds-kart-gecmisi-')).forEach(k=>empty[k]={});
      empty['yds-gunluk-kayit']={[Y.Ilerleme.bugun()]:{t:10,d:6,y:2,m:0,z:0}};
      Y.Depo.paketYaz(empty,'qa-legacy');
    });
    await legacy.waitForFunction(()=>document.getElementById('yanitDengesi').textContent.includes('10'));
    assert.match(await legacy.locator('#yanitDengesi').innerText(),/eski|önceki|öncesi/i,'legacy scope is visible');
    assert.doesNotMatch(await legacy.locator('#yanitDengesi').innerText(),/60\s*%/,'legacy unknown hint counts do not become new-rule accuracy');
    await legacyContext.close();
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:true,answers:13,box5Unchanged:true,layouts:checks,legacyCoverage:true}));
  }finally{await context.close();await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e.stack||e);server.close();process.exitCode=1;});
