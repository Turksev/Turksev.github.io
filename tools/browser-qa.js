'use strict';
// CI uses an isolated Chromium profile: no real user account or saved progress.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname,'..');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
const server = http.createServer((req,res)=>{
  let pathname;
  try {pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);} catch {res.writeHead(400).end();return;}
  let file=path.resolve(root,'.'+pathname);
  if (!file.startsWith(root+path.sep) && file!==root) {res.writeHead(403).end();return;}
  if (file===root || (fs.existsSync(file) && fs.statSync(file).isDirectory())) file=path.join(file,'index.html');
  let status=200;
  if (!fs.existsSync(file)) {file=path.join(root,'404.html');status=404;}
  res.writeHead(status,{'Content-Type':(mime[path.extname(file)]||'application/octet-stream')+'; charset=utf-8','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
});
async function main() {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch();
  const context=await browser.newContext({serviceWorkers:'block'});
  const errors=[];
  context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  const page=await context.newPage();
  try {
    const pages=fs.readdirSync(root).filter(f=>f.endsWith('.html')&&f!=='404.html');
    for (const route of pages) {
      await page.goto(base+'/'+route);
      assert.equal(await page.locator('h1').count(),1,route+': h1');
      assert.equal(await page.locator('.skip-link,.atla').count(),1,route+': skip');
      assert.equal(await page.locator('.footer-links a').count(),3,route+': footer');
    }
    const visualFailures=[];
    for (const theme of ['light','dark']) for (const width of [375,1280]) {
      await page.emulateMedia({colorScheme:theme});
      await page.setViewportSize({width,height:812});
      for (const route of ['index.html','kelimeler.html','obekler.html','aileler.html','cumleler.html','baglaclar.html','gramer.html','konular.html','deneme.html','ayarlar.html','istatistik.html','konu/T01.html','konu/E68.html']) {
        await page.goto(base+'/'+route);
        await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
        const result=await page.evaluate(async()=>{
          const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});
          return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));
        });
        if (result.length) visualFailures.push({theme,width,route,accessibility:result});
        const layout=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,
          elements:Array.from(document.querySelectorAll('body *')).filter(el=>{
            const r=el.getBoundingClientRect();let right=r.right;
            for(let parent=el.parentElement;parent;parent=parent.parentElement){
              if(/^(auto|scroll|hidden|clip)$/.test(getComputedStyle(parent).overflowX))right=Math.min(right,parent.getBoundingClientRect().right);
            }
            return r.width>0&&right>innerWidth+1;
          }).slice(0,8).map(el=>({tag:el.tagName,id:el.id,class:el.className,right:el.getBoundingClientRect().right,text:el.textContent.slice(0,100)}))}));
        if (layout.scroll>layout.viewport+1) visualFailures.push({theme,width,route,overflow:layout});
        // Genis yazi tipli platformda (CI Linux) ya da yaziyi buyuten kullanicida
        // tasma olmamali: 375 px'te kok yazi %25 buyutulerek de olculur. 07.09.2026'da
        // gizli bir ::after baloncugu tam bu kosulda sayfayi yatay kaydirilabilir
        // yapmisti ve dar yazi tipli Windows'ta gorunmuyordu.
        if (width===375) {
          const buyukYazi=await page.evaluate(()=>{
            document.documentElement.style.fontSize='20px';
            const olcum={viewport:innerWidth,scroll:document.documentElement.scrollWidth};
            document.documentElement.style.fontSize='';
            return olcum;});
          if (buyukYazi.scroll>buyukYazi.viewport+1) visualFailures.push({theme,width,route,buyukYazi});
        }
      }
    }
    assert.equal(visualFailures.length,0,'Visual regressions: '+JSON.stringify(visualFailures));
    await page.goto(base+'/cumleler.html');
    const sentence=page.locator('#liste .cum').first();
    await sentence.waitFor(); await sentence.focus(); await page.keyboard.press('Enter');
    assert.equal(await sentence.getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Space');
    assert.equal(await sentence.getAttribute('aria-expanded'),'true','An open sentence stays open after Space');
    await sentence.click();
    assert.equal(await sentence.getAttribute('aria-expanded'),'true','An open sentence stays open after another click');
    await page.goto(base+'/konular.html');
    assert.equal(await page.locator('.kat.acik').count(),1,'Initial topic expansion');
    await page.goto(base+'/ara.html?q=despite');
    await page.getByRole('button',{name:/despite/}).first().click();
    assert.match(await page.locator('#kartIcerik').innerText(),/edat/);
    await page.goto(base+'/deneme.html');
    await page.locator('#basla').click();
    const options=page.locator('#qSecenekler [role=radio]');
    await options.first().focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await options.nth(1).getAttribute('aria-checked'),'true');
    assert.match(await page.locator('#oturumKayitDurumu').innerText(),/kaydedildi/);
    const question=await page.locator('#qText').innerText();
    page.once('dialog',dialog=>dialog.accept());
    await page.reload();
    await page.locator('#oturumDevam').click();
    assert.equal(await page.locator('#qText').innerText(),question,'Resumed question');
    assert.equal(await page.locator('#qSecenekler [role=radio]').nth(1).getAttribute('aria-checked'),'true','Persisted answer after reload');
    // A fresh test page avoids interacting with the exam's real unload dialog.
    const notFound=await context.newPage();
    const response=await notFound.goto(base+'/missing/nested/route');
    assert.equal(response.status(),404);
    assert.equal(await notFound.getByRole('link',{name:'Ana sayfa',exact:true}).getAttribute('href'),'/index.html');
    assert.ok(await notFound.locator('main').evaluate(el=>getComputedStyle(el).maxWidth==='640px'));
    assert.ok(await notFound.locator('body').evaluate(el=>getComputedStyle(el).fontFamily.includes('system-ui')),'Nested 404 stylesheet loaded');
    assert.deepEqual(errors,[],'browser runtime errors');
    console.log('Browser QA passed: root routes, light/dark 375/1280px axe, keyboard, search, exam reload persistence, nested 404.');
  } finally {await browser.close(); await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{
  console.error(error);
  // Public test annotations expose only the isolated fixture's failure, never credentials.
  if (process.env.GITHUB_ACTIONS) {
    const detail=String(error.stack||error).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A');
    console.error('::error title=Browser QA::'+detail);
  }
  server.close();process.exitCode=1;
});
