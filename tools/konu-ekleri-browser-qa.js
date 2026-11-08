'use strict';
// Yalnız izole profil: yeni dersler, eski kayıtlar ve gecikmeli ölçüm.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname,'..');
const topics = require('./konu-ekleri.json');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const server = http.createServer((req,res)=>{
  const file = path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if (!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()) {res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':(mime[path.extname(file)]||'application/octet-stream')+'; charset=utf-8'});
  fs.createReadStream(file).pipe(res);
});
async function main() {
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser = await chromium.launch({args:['--explicitly-allowed-ports='+server.address().port]});
  const context = await browser.newContext({serviceWorkers:'block',timezoneId:'Europe/Istanbul'});
  await context.route(/^https:\/\//,r=>r.abort());
  const errors=[], badResponses=[];
  const page=await context.newPage(), base='http://127.0.0.1:'+server.address().port;
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)badResponses.push(r.url());});
  try {
    await page.clock.setFixedTime(new Date('2026-11-08T09:00:00Z'));
    await page.goto(base+'/konular.html');
    await page.evaluate(()=>{
      YDS.Ilerleme.konuYaz('T01',{d:2,t:90,g:100,n:'Eski not'});
      YDS.Ilerleme.konuYaz('E68',{d:1,t:80,n:'Eski İngilizce konusu'});
    });
    const old=await page.evaluate(()=>[YDS.Ilerleme.konu('T01'),YDS.Ilerleme.konu('E68')]);
    assert.equal(await page.locator('#toplamUnite').innerText(),'140');
    let questions=0;
    for(const topic of topics) {
      await page.goto(base+'/konular.html?konu='+topic.k);
      assert.equal(await page.locator('#acikKonuBasligi').innerText(),topic.ad);
      assert.equal(await page.locator('.tani-cevap').isVisible(),false);
      const count=await page.locator('.tani-cevap ol > li').count();
      assert.ok(count>=5,topic.k+': answer count');
      questions+=count;
      await page.locator('.tani-ac').press('Enter');
      assert.equal(await page.locator('.tani-oy').count(),count);
      assert.equal(await page.locator('.tani-kaydet').isDisabled(),true);
      for(let i=0;i<count;i++) {
        const value=topic.k==='E69'&&i===8?'0.5':topic.k==='E69'&&i===9?'0':'1';
        await page.locator('.tani-oy').nth(i).locator('[data-p="'+value+'"]').click();
      }
      await page.locator('.tani-kaydet').click();
      await page.reload();
      assert.equal(await page.evaluate(k=>YDS.Ilerleme.konu(k).t,topic.k),topic.k==='E69'?85:100);
      assert.equal(await page.evaluate(k=>YDS.Ilerleme.konu(k).g,topic.k),null);
      // Both the interactive lesson and the shareable page must fit mobile.
      for(const route of ['/konular.html?konu='+topic.k,'/konu/'+topic.k+'.html']) {
        await page.goto(base+route);
        for(const theme of ['light','dark']) for(const width of [320,375,1280]) {
          await page.emulateMedia({colorScheme:theme});
          await page.setViewportSize({width,height:900});
          const layout=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
          assert.ok(layout.scroll<=layout.viewport+1,topic.k+' '+route+' '+theme+' '+width+': '+JSON.stringify(layout));
        }
        if(topic.k==='E69'||topic.k==='E74') {
          await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
          const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
          assert.deepEqual(violations,[],route+': accessibility');
        }
        if(route.startsWith('/konu/')) {
          const answers=page.locator('details').filter({has:page.locator('summary', {hasText:'Cevap ve gerekçe'})});
          assert.equal(await answers.evaluate(el=>el.open),false);
          await answers.locator('summary').press('Enter');
          assert.equal(await answers.locator('ol > li').count(),count);
        }
      }
    }
    assert.equal(questions,61);
    await page.goto(base+'/konular.html?konu=E69');
    assert.deepEqual(await page.evaluate(()=>[YDS.Ilerleme.konu('T01'),YDS.Ilerleme.konu('E68')]),old,'Old progress preserved');
    await page.clock.setFixedTime(new Date('2026-11-15T09:00:00Z'));
    await page.reload();
    assert.match(await page.locator('.tani-ac').innerText(),/gecikmeli/);
    await page.locator('.tani-ac').click();
    for(const radio of await page.locator('.tani-oy [data-p="1"]').all()) await radio.click();
    await page.locator('.tani-kaydet').click();
    assert.deepEqual(await page.evaluate(()=>{const d=YDS.Ilerleme.konu('E69');return [d.t,d.g,d.d];}),[85,100,2]);
    await page.goto(base+'/ara.html?q=E79');
    await page.locator('a.ara-satir[href="konular.html#E79"]').click();
    assert.equal(await page.locator('#acikKonuBasligi').innerText(),topics.at(-1).ad);
    await page.goto(base+'/konular.html?konu=E69');
    await page.locator('#konuGovde a[href="konular.html?konu=E70"]').click();
    assert.equal(await page.locator('#acikKonuBasligi').innerText(),topics[1].ad);
    if(process.env.YDS_QA_SCREENSHOTS) {
      await page.goto(base+'/konular.html?konu=E69');
      await page.setViewportSize({width:1280,height:900});
      await page.screenshot({path:path.resolve(process.env.YDS_QA_SCREENSHOTS,'konu-E69-desktop.png')});
      await page.setViewportSize({width:375,height:900});
      await page.screenshot({path:path.resolve(process.env.YDS_QA_SCREENSHOTS,'konu-E69-mobile.png')});
    }
    assert.deepEqual(errors,[],'Browser errors');
    assert.deepEqual(badResponses,[],'Missing local resources');
    console.log('11 ders, 61 alıştırma, iki görünüm, mobil/masaüstü, erişilebilirlik, arama ve ilerleme kayıtları geçti.');
  } finally { await browser.close(); await new Promise(r=>server.close(r)); }
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1;});
