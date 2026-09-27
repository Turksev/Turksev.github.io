'use strict';
// Only an ephemeral browser profile and a localhost server are used. No saved
// user profile, production origin, cloud account or learning data is touched.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname,'..');
const prefix = 'yds-kullanim-v1:';
const screenshotDir = process.env.YDS_USAGE_SCREENSHOT_DIR ? path.resolve(process.env.YDS_USAGE_SCREENSHOT_DIR) : null;
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
async function ready(page) {
  await page.waitForFunction(()=>window.YDS && window.YDS.Kullanim);
}
async function report(page,range=30) {
  return page.evaluate(range=>window.YDS.KullanimHesap.rapor(window.YDS.Kullanim.oku(),range),range);
}
function visits(result,id) {return result.pages.find(row=>row.id===id)?.visits||0;}
function uses(result,id) {return result.features.find(row=>row.id===id)?.count||0;}
function seconds(result) {return result.pages.reduce((sum,row)=>sum+row.seconds,0);}
async function totals(page) {
  const snapshot=await page.evaluate(()=>window.YDS.Kullanim.oku());
  const pages=new Map(),features=new Map();
  for(const row of snapshot.records) {
    const entry=pages.get(row.p)||{id:row.p,visits:0,seconds:0};
    entry.visits+=row.a;entry.seconds+=row.s;pages.set(row.p,entry);
    for(const [id,count] of Object.entries(row.f)) features.set(id,(features.get(id)||0)+count);
  }
  return {pages:Array.from(pages.values()),features:Array.from(features,([id,count])=>({id,count}))};
}
async function learningSnapshot(page) {
  return page.evaluate(prefix=>Object.fromEntries(Object.keys(localStorage).filter(key=>!key.startsWith(prefix)).sort().map(key=>[key,localStorage.getItem(key)])),prefix);
}
async function checkpoint(page) {
  assert.equal(await page.evaluate(()=>window.YDS.Kullanim.yaz()),true,'Usage checkpoint succeeds');
}
async function action(page,id,count=1) {
  await page.evaluate(({id,count})=>{for(let i=0;i<count;i++) window.YDS.Kullanim.olay(id);},{id,count});
}
async function axeAndLayout(page,label) {
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const violations=await page.evaluate(async()=>{
    const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});
    return result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
  });
  assert.deepEqual(violations,[],label+': accessibility');
  const layout=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(layout.scroll<=layout.viewport+1,label+': horizontal overflow '+JSON.stringify(layout));
}
async function main() {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch();
  const errors=[];
  const contexts=[];
  async function freshContext(options={}) {
    const context=await browser.newContext({serviceWorkers:'block',timezoneId:'Europe/Istanbul',...options});
    context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
    contexts.push(context);
    return context;
  }
  try {
    // Real browser input must wake an idle collector. API olay() calls cannot
    // prove the DOM listeners work, so this scenario never calls that method.
    const inputContext=await freshContext({hasTouch:true});
    const inputPage=await inputContext.newPage();
    await inputPage.clock.install();
    await inputPage.goto(base+'/konu/E01.html');await ready(inputPage);
    await inputPage.evaluate(()=>{
      window.__qaTrustedInputs={};
      for(const type of ['pointerdown','pointermove','keydown','touchstart','scroll']) {
        document.addEventListener(type,event=>{
          if(event.isTrusted)window.__qaTrustedInputs[type]=(window.__qaTrustedInputs[type]||0)+1;
        },{capture:true,passive:true});
      }
    });
    const heading=await inputPage.locator('h1').boundingBox();
    const point={x:heading.x+Math.min(20,heading.width/2),y:heading.y+heading.height/2};
    await inputPage.mouse.move(point.x,point.y);
    await inputPage.clock.runFor(100000);await checkpoint(inputPage);
    const idleLimit=seconds(await totals(inputPage));
    assert.ok(idleLimit>=89&&idleLimit<=91,'No input is capped at the 90-second idle boundary: '+idleLimit);
    await inputPage.clock.runFor(15000);await checkpoint(inputPage);
    assert.equal(seconds(await totals(inputPage)),idleLimit,'Idle time never accrues indefinitely');
    const inputs=[
      ['pointerdown',async()=>{await inputPage.mouse.down();await inputPage.mouse.up();}],
      ['keydown',()=>inputPage.keyboard.press('Shift')],
      ['touchstart',()=>inputPage.touchscreen.tap(point.x,point.y)],
      ['pointermove',()=>inputPage.mouse.move(point.x+25,point.y+3)],
      ['scroll',async()=>{await inputPage.mouse.wheel(0,400);await inputPage.waitForFunction(()=>window.scrollY>0);}]
    ];
    for(const [type,interact] of inputs) {
      await inputPage.clock.runFor(100000);await checkpoint(inputPage);
      const before=seconds(await totals(inputPage));
      const received=await inputPage.evaluate(type=>window.__qaTrustedInputs[type]||0,type);
      await interact();
      await inputPage.clock.runFor(5000);await checkpoint(inputPage);
      assert.ok(await inputPage.evaluate(({type,received})=>(window.__qaTrustedInputs[type]||0)>received,{type,received}),type+': trusted DOM event was received');
      const delta=seconds(await totals(inputPage))-before;
      assert.ok(delta>=4&&delta<=6,type+': idle input resumes only the following five seconds, got '+delta);
    }

    // Exercise actual product handlers using clicks and keyboard shortcuts.
    const actionContext=await freshContext();
    const actionPage=await actionContext.newPage();
    await actionPage.goto(base+'/kelimeler.html');await ready(actionPage);
    await actionPage.locator('#desteBasla').click();
    await actionPage.locator('#kart').waitFor({state:'visible'});await checkpoint(actionPage);
    assert.equal(uses(await totals(actionPage),'deste-baslat'),1,'Clicking a real deck button reaches the collector');
    await actionPage.locator('#kart').focus();await actionPage.keyboard.press('2');await checkpoint(actionPage);
    assert.equal(uses(await totals(actionPage),'kart-cevap'),1,'Real answer keyboard shortcut reaches the collector');
    await actionPage.locator('#bildim').click();await checkpoint(actionPage);
    assert.equal(uses(await totals(actionPage),'kart-cevap'),2,'Real answer button reaches the collector');
    await actionPage.goto(base+'/quiz.html');await ready(actionPage);
    await actionPage.locator('#basla').click();await checkpoint(actionPage);
    assert.equal(uses(await totals(actionPage),'quiz-baslat'),1,'Real quiz start reaches the collector');
    await actionPage.locator('#qText').focus();await actionPage.keyboard.press('1');
    actionPage.once('dialog',dialog=>dialog.accept());
    await actionPage.locator('#bitir').click();await checkpoint(actionPage);
    assert.equal(uses(await totals(actionPage),'quiz-bitir'),1,'Answering and finishing the real quiz reaches the collector');

    // Headless Chromium keeps pages visible; this deterministic visibility
    // fixture tests a real exam timer expiring while the document reports hidden.
    // Input, exam setup and submission still run through the production handlers.
    const examContext=await freshContext();
    const examPage=await examContext.newPage();
    await examPage.addInitScript(()=>{
      window.__qaHidden=false;
      Object.defineProperty(document,'visibilityState',{get:()=>window.__qaHidden?'hidden':'visible'});
      Object.defineProperty(document,'hidden',{get:()=>window.__qaHidden});
    });
    await examPage.clock.install();
    await examPage.goto(base+'/deneme.html');await ready(examPage);
    await examPage.locator('#adet').selectOption('20');await examPage.locator('#basla').click();
    await examPage.evaluate(()=>{window.__qaHidden=true;document.dispatchEvent(new Event('visibilitychange'));});
    const examBefore=seconds(await totals(examPage));
    await examPage.clock.fastForward(45*60*1000+2000);
    await examPage.locator('#sonuc').waitFor({state:'visible'});await checkpoint(examPage);
    assert.equal(uses(await totals(examPage),'deneme-bitir'),1,'A real exam timer completion is saved while hidden');
    assert.equal(seconds(await totals(examPage)),examBefore,'Hidden exam wait adds no active time');

    // A usage checkpoint must not redraw learning charts or replace an unfinished
    // native date edit. Backspace leaves one date segment genuinely incomplete.
    const editingContext=await freshContext();
    const editingPage=await editingContext.newPage();
    await editingPage.clock.install();
    await editingPage.goto(base+'/istatistik.html');await ready(editingPage);
    await editingPage.clock.runFor(200);
    const date=editingPage.locator('#gunSec');await date.focus();await date.press('Backspace');
    const unfinishedDate=await date.inputValue();
    assert.equal(unfinishedDate,'','Test setup: native date input has an incomplete segment');
    const learningSvg=await editingPage.locator('#gunlukGrafik svg').elementHandle();
    await editingPage.clock.runFor(61000);
    assert.equal(await date.inputValue(),unfinishedDate,'Usage checkpoint preserves unfinished date typing');
    assert.equal(await date.evaluate(element=>document.activeElement===element),true,'Usage checkpoint preserves date focus');
    assert.equal(await learningSvg.evaluate(element=>element.isConnected),true,'Usage checkpoint does not redraw the learning graph');
    await learningSvg.dispose();
    await editingPage.locator('#kullanim details summary').click();
    const selectedCell=editingPage.locator('#kullanimOzellikler tr[data-feature="ipucu"] td').first();
    const selectedNode=await selectedCell.elementHandle();
    await selectedCell.evaluate(element=>{
      if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
      const selection=window.getSelection(),range=document.createRange();
      range.selectNodeContents(element);selection.removeAllRanges();selection.addRange(range);
    });
    const selectedText=await editingPage.evaluate(()=>window.getSelection().toString());
    await action(editingPage,'ipucu');await checkpoint(editingPage);await editingPage.clock.runFor(200);
    assert.equal(await editingPage.evaluate(()=>window.getSelection().toString()),selectedText,'Usage updates preserve selected text');
    assert.equal(await selectedNode.evaluate(element=>element.isConnected),true,'Selected usage cell is not replaced');
    await editingPage.evaluate(()=>window.getSelection().removeAllRanges());await editingPage.clock.runFor(200);
    assert.equal(await selectedCell.innerText(),'1','Deferred usage update appears after the selection clears');
    await selectedNode.dispose();

    // A reload preserves the current visit, while actually leaving and returning
    // records a new visit. Repeated same-document lifecycle signals are harmless.
    const reloadContext=await freshContext();
    const reloadPage=await reloadContext.newPage();
    await reloadPage.goto(base+'/kelimeler.html');await ready(reloadPage);await checkpoint(reloadPage);
    assert.equal(visits(await totals(reloadPage),'kelimeler'),1,'Initial navigation is one visit');
    await reloadPage.reload();await ready(reloadPage);await checkpoint(reloadPage);
    assert.equal(visits(await totals(reloadPage),'kelimeler'),1,'Reload does not double-count the current visit');
    await reloadPage.evaluate(()=>{
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:false}));
    });
    await checkpoint(reloadPage);
    assert.equal(visits(await totals(reloadPage),'kelimeler'),1,'Visible callbacks do not invent visits');
    await reloadPage.goto(base+'/obekler.html');await ready(reloadPage);
    await reloadPage.goto(base+'/kelimeler.html');await ready(reloadPage);await checkpoint(reloadPage);
    assert.equal(visits(await totals(reloadPage),'kelimeler'),2,'Returning by a new navigation is another visit');

    // Independent documents must not overwrite one another's events. Explicit
    // checkpoints make the cross-tab conflict test independent of OS close hooks.
    const shared=await freshContext();
    const observer=await shared.newPage();
    await observer.goto(base+'/istatistik.html#kullanim');await ready(observer);
    const left=await shared.newPage();
    await left.clock.install();
    await left.goto(base+'/kelimeler.html');await ready(left);
    await left.bringToFront();
    await left.clock.runFor(5000);
    await action(left,'kart-cevap',2);
    const right=await shared.newPage();
    await right.goto(base+'/kelimeler.html');await ready(right);
    await right.bringToFront();await action(right,'kart-cevap',3);
    await checkpoint(right);await checkpoint(left);
    await right.close();await left.close();
    let result=await report(observer);
    assert.equal(visits(result,'kelimeler'),2,'Two tabs keep both visit records after closing');
    assert.equal(uses(result,'kart-cevap'),5,'Two tabs keep both action totals after closing');
    assert.ok(result.pages.find(row=>row.id==='kelimeler').seconds>=4,'Visible elapsed time survives checkpoints');

    // A real navigation exercises the pagehide/hidden flush path without calling
    // yaz() from the departing document. A same-origin observer reads persisted data.
    const departing=await shared.newPage();
    await departing.goto(base+'/obekler.html');await ready(departing);
    await action(departing,'ipucu',4);
    await departing.goto(base+'/404.html');
    await departing.close();
    result=await report(observer);
    assert.equal(uses(result,'ipucu'),4,'Navigation saves pending actions');

    // Generated topic pages load the collector from their nested path and share
    // the topic category; individual topic IDs must not leak into the catalog.
    const topic=await shared.newPage();
    await topic.goto(base+'/konu/E01.html');await ready(topic);await checkpoint(topic);
    result=await report(observer);
    assert.equal(visits(result,'konu'),1,'Generated E01 topic page records a topic visit');
    assert.equal(result.pages.some(row=>row.id==='E01'||row.id==='konu/E01'),false,'Topics use the common catalog ID');
    await topic.close();

    // The learning area may still be empty while local usage is populated. Both
    // reports must remain visible and their period controls must be read-only.
    await observer.reload();await ready(observer);
    await observer.locator('#kullanim').waitFor({state:'visible'});
    await observer.locator('#kullanimPaylar .stats-usage-bar').first().waitFor({state:'visible'});
    assert.equal(await observer.locator('#bosDurum').isVisible(),true,'Usage does not fabricate learning activity');
    const before=await learningSnapshot(observer);
    for (const range of [7,90,30]) {
      await observer.locator('#aralik button[data-gun="'+range+'"]').click();
      assert.equal(await observer.locator('#aralik button[aria-pressed="true"]').count(),1);
      assert.equal(await observer.locator('#aralik button[data-gun="'+range+'"]').getAttribute('aria-pressed'),'true');
      const expected=await report(observer,range);
      assert.equal(await observer.locator('#kullanimSayfalar tr').count(),expected.pages.length,'Page catalog is complete');
      assert.equal(await observer.locator('#kullanimOzellikler tr').count(),expected.features.length,'Feature catalog is complete');
      assert.ok((await observer.locator('#kullanimOzet').innerText()).trim().length>0,'Usage summary is populated');
    }
    assert.deepEqual(await learningSnapshot(observer),before,'Usage period controls leave every non-usage key unchanged');
    await observer.locator('#kullanim details summary').click();
    for (const theme of ['light','dark']) for (const width of [320,375,1280]) {
      await observer.emulateMedia({colorScheme:theme});
      await observer.setViewportSize({width,height:812});
      await axeAndLayout(observer,'Usage populated '+theme+' '+width+'px');
      if(screenshotDir && width===375) {
        fs.mkdirSync(screenshotDir,{recursive:true});
        // A clipped element screenshot can move a sticky page header into the
        // middle of a tall capture. Capture the actual page from its top instead.
        await observer.evaluate(()=>{if(document.activeElement instanceof HTMLElement) document.activeElement.blur();window.scrollTo(0,0);});
        await observer.screenshot({path:path.join(screenshotDir,'usage-mobile-'+theme+'.png'),fullPage:true});
      }
      if(width===320) {
        const enlarged=await observer.evaluate(()=>{
          document.documentElement.style.fontSize='32px';document.querySelector('main').style.fontFamily='monospace';
          const result={viewport:innerWidth,scroll:document.documentElement.scrollWidth};
          document.documentElement.style.fontSize='';document.querySelector('main').style.fontFamily='';return result;
        });
        assert.ok(enlarged.scroll<=enlarged.viewport+1,'Usage 200% wide-font reflow: '+JSON.stringify(enlarged));
      }
    }

    // The separate local reset must preserve all learning/settings keys, support
    // cancellation, and prevent another pre-reset tab from reviving stale totals.
    const resetContext=await freshContext();
    const stale=await resetContext.newPage();
    await stale.goto(base+'/kelimeler.html');await ready(stale);
    // Seed before opening the second tab. Otherwise the existing learning-sync
    // transaction can still be normalizing its mirror during the reset snapshot.
    await stale.evaluate(()=>{
      const day=window.YDS.Ilerleme.bugun();
      window.YDS.Depo.paketYaz({
        'yds-leitner':{qa:{c:day,g:day,k:2,m:0}},
        'yds-gunluk-kayit':{[day]:{d:1,m:0,t:2,y:1,z:0}}
      },'usage-qa-fixture');
      localStorage.setItem('yds-kullanim-other','preserve exact-prefix neighbor');
    });
    await stale.reload();await ready(stale);
    await action(stale,'deste-baslat',2);await checkpoint(stale);
    const settings=await resetContext.newPage();
    await settings.goto(base+'/ayarlar.html');await ready(settings);
    const saved=await learningSnapshot(settings);
    settings.once('dialog',dialog=>dialog.dismiss());
    await settings.locator('#kullanimSil').click();
    assert.equal(uses(await totals(settings),'deste-baslat'),2,'Canceled reset preserves usage');
    assert.deepEqual(await learningSnapshot(settings),saved,'Canceled reset preserves learning/settings');
    settings.once('dialog',dialog=>dialog.accept());
    await settings.locator('#kullanimSil').click();
    await checkpoint(stale);
    assert.equal(uses(await totals(settings),'deste-baslat'),0,'Old tab cannot restore pre-reset usage');
    assert.deepEqual(await learningSnapshot(settings),saved,'Usage reset preserves every non-usage key');
    await stale.close();
    await settings.goto(base+'/istatistik.html#kullanim');await ready(settings);
    for(const theme of ['light','dark']) {
      await settings.emulateMedia({colorScheme:theme});await settings.setViewportSize({width:320,height:812});
      await axeAndLayout(settings,'Usage after reset '+theme+' 320px');
    }
    // Açılışta kullanım anahtarlarını okuyamayan sekme, başka sekmedeki sıfırlamadan
    // sonra eski sayaçlarını geri yazmaz. Gerçek Chromium'da dönem değişikliği olayı,
    // aynı anda yazılan diğer anahtarlardan önce görülebilir; sıralama bunu karşılar.
    for(let round=0;round<2;round++) {
      const raceContext=await freshContext();
      const resetter=await raceContext.newPage();
      await resetter.goto(base+'/ayarlar.html');await ready(resetter);await checkpoint(resetter);
      const late=await raceContext.newPage();
      await late.addInitScript(()=>{
        window.__blok=true;
        const P=Storage.prototype,orig={getItem:P.getItem,setItem:P.setItem,removeItem:P.removeItem};
        for(const name of ['getItem','setItem','removeItem'])P[name]=function(key,...rest){
          let local=false;try{local=this===window.localStorage;}catch(_){}
          if(window.__blok&&local&&String(key).startsWith('yds-kullanim-v1:'))throw new DOMException('blocked (test)','SecurityError');
          return orig[name].call(this,key,...rest);
        };
      });
      await late.goto(base+'/istatistik.html');await ready(late);
      await late.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(resolve,50)))));
      await action(late,'ipucu',2);
      assert.equal(await late.evaluate(()=>window.YDS.Kullanim.yaz()),false,'Blocked startup cannot write usage yet');
      await late.evaluate(()=>{window.__blok=false;});
      assert.equal(await resetter.evaluate(()=>window.YDS.Kullanim.sifirla()),true,'Other tab resets usage');
      await resetter.waitForTimeout(400);
      await late.evaluate(()=>window.YDS.Kullanim.yaz());
      await resetter.waitForTimeout(200);
      const afterRace=await totals(resetter);
      assert.equal(uses(afterRace,'ipucu'),0,'Blocked-start tab does not restore pre-reset actions after a reset');
      assert.equal(afterRace.pages.reduce((sum,row)=>sum+row.visits,0),0,'Blocked-start tab does not restore its pre-reset visit');
      await raceContext.close();
    }
    assert.deepEqual(errors,[],'Usage browser runtime errors');
    console.log('Usage Browser QA passed: real mouse/key/touch/scroll idle wake, real deck/answer/quiz actions, hidden exam completion, date edit preservation, reload visits, two tabs, navigation flush, topic collector, read-only periods, light/dark narrow axe, local reset, reset versus blocked-start tab.');
  } finally {
    for(const context of contexts) await context.close();
    await browser.close();await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{
  console.error(error);
  if(process.env.GITHUB_ACTIONS) {
    const detail=String(error.stack||error).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A');
    console.error('::error title=Usage Browser QA::'+detail);
  }
  server.close();process.exitCode=1;
});
