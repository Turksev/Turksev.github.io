'use strict';
// Exercise the actual released word cards in an isolated browser profile.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const {readCollection}=require('./kalip-anlam-kaynagi');
const {build}=require('./kalip-sunum-uret');
const {ayir}=require('../assets/js/kalip-sunum');
const root=path.resolve(__dirname,'..'),{rows}=readCollection();
const metadata=build().data;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  let file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':(mime[path.extname(file)]||'application/octet-stream')+'; charset=utf-8','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
});
const pairsOf=locator=>locator.evaluateAll(els=>els.map(el=>({en:el.querySelector('b').textContent,tr:el.querySelector('i').textContent})));
const savedProgress=page=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>!k.startsWith('yds-kullanim-v1:')).sort().map(k=>[k,localStorage.getItem(k)])));
async function groupsMatch(primary,secondary,word){
  const groups=ayir(word,rows.get(word).replacement,metadata);
  assert.deepEqual(await pairsOf(primary),groups.temel,word+': primary meanings and structures');
  assert.deepEqual(await pairsOf(secondary),groups.diger,word+': all secondary pairs retained');
  return groups;
}
async function layout(page,container,label){
  for(const size of [16,20]){
    await page.evaluate(n=>{document.documentElement.style.fontSize=n+'px';},size);
    const overflow=await container.evaluate(el=>Array.from(el.querySelectorAll('.kalip,.kalip > span,.kalip b,.kalip i,summary')).filter(n=>{
      if(!n.checkVisibility())return false;
      const r=n.getBoundingClientRect();return r.left < -1 || r.right > innerWidth+1 || n.scrollWidth>n.clientWidth+1;
    }).map(n=>({text:n.textContent,scroll:n.scrollWidth,width:n.clientWidth})));
    assert.deepEqual(overflow,[],label+': fits at '+size+'px font');
  }
  await page.evaluate(()=>{document.documentElement.style.fontSize='';});
}
async function axe(page,label){
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const violations=await page.evaluate(async()=>{
    const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});
    return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
  });
  assert.deepEqual(violations,[],label+': accessibility');
}
async function screenshot(page,name){
  if(!process.env.YDS_QA_SCREENSHOTS)return;
  fs.mkdirSync(process.env.YDS_QA_SCREENSHOTS,{recursive:true});
  await page.locator('#kartAlan').screenshot({path:path.join(process.env.YDS_QA_SCREENSHOTS,name+'.png')});
}
async function main(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port,base='http://127.0.0.1:'+port;
  const browser=await chromium.launch({args:['--explicitly-allowed-ports='+port]});
  const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const largest=[...rows.values()].sort((a,b)=>b.replacement.length-a.replacement.length)[0].word;
  const longest=[...rows.values()].sort((a,b)=>Math.max(...b.replacement.map(p=>p.tr.length))-Math.max(...a.replacement.map(p=>p.tr.length)))[0].word;
  const words=[...new Set(['establish','remember','provide','soap','turn-over','readership',largest,longest])];
  try{
    for(const width of [320,390,1280]){
      await page.setViewportSize({width,height:900});
      for(const word of words){
        await page.goto(base+'/kelimeler.html?katman=1,2,3,4,5,6,7&q='+encodeURIComponent(word));
        const card=page.locator('#liste .word').filter({has:page.locator('.en',{hasText:new RegExp('^'+word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')})}).first();
        await card.locator('.kalip b').first().waitFor();
        const groups=await groupsMatch(card.locator('.kalip-temel > span'),card.locator('.kalip-diger .kalip > span'),word);
        await layout(page,card,word+' list '+width);
        if(groups.diger.length){
          const details=card.locator('.kalip-diger');
          assert.equal(await details.evaluate(el=>el.open),false,'List starts collapsed');
          assert.equal(await details.locator('.kalip').isVisible(),false);
          await details.locator('summary').press('Enter');
          assert.equal(await details.evaluate(el=>el.open),true);
          await layout(page,card,word+' expanded list '+width);
        }
        if(['establish','soap','turn-over',largest,longest].includes(word)){
          await card.locator('[data-ne="calis"]').click();
          assert.equal(await page.locator('#kartDiger').isVisible(),false,'No answer leaks on front');
          await page.locator('#kart').click();
          await page.locator('#kartOrnek .kalip b').first().waitFor();
          await groupsMatch(page.locator('#kartOrnek .kalip-temel > span'),page.locator('#kartDiger .kalip > span'),word);
          await layout(page,page.locator('#kartAlan'),word+' study '+width);
          await screenshot(page,word+'-'+width+'-closed');
          if(groups.diger.length){
            const details=page.locator('#kartDiger .kalip-diger'),summary=details.locator('summary');
            assert.equal(await details.evaluate(el=>el.open),false,'Study starts collapsed');
            assert.equal(await details.evaluate(el=>!!el.closest('[role="button"]')),false,'Disclosure is outside the flip button');
            const before=await savedProgress(page),title=await page.locator('#kartOn').textContent();
            await summary.press('Space');
            assert.equal(await details.evaluate(el=>el.open),true);
            for(const key of ['1','2','3','4','ArrowRight','ArrowLeft'])await summary.press(key);
            assert.equal(await page.locator('#kartOn').textContent(),title,'Disclosure keys cannot advance or grade the card');
            assert.equal(await page.locator('#kart').getAttribute('aria-expanded'),'true');
            assert.deepEqual(await savedProgress(page),before,'Disclosure never writes learning state');
            if(await page.locator('#ipucuBtn').isVisible()){
              await page.locator('#ipucuBtn').click();
              assert.equal(await details.evaluate(el=>el.open),true,'Same-card redraw preserves the open disclosure');
            }
            await layout(page,page.locator('#kartAlan'),word+' expanded study '+width);
            await screenshot(page,word+'-'+width+'-expanded');
            if(word===largest&&width===390)await axe(page,'Expanded mobile study card');
            await summary.press('Enter');
            assert.equal(await details.evaluate(el=>el.open),false);
          }
        }
      }
    }
    // Search and dictionary panels use the same priorities as list/study cards.
    await page.setViewportSize({width:390,height:900});
    await page.goto(base+'/ara.html');
    await page.locator('#tur').selectOption('kelime');
    await page.locator('#ara').fill(largest);
    await page.locator('#sonuclar [data-tip="kelime"][data-anahtar="'+largest+'"]').click();
    await page.locator('#kartIcerik .kalip-temel').waitFor();
    await groupsMatch(page.locator('#kartIcerik .kalip-temel > span'),page.locator('#kartIcerik .kalip-diger .kalip > span'),largest);
    await page.locator('#kartIcerik summary').press('Enter');
    await layout(page,page.locator('#kartIcerik'),'Search dialog');
    await axe(page,'Search dialog');
    for(const route of ['kelimeler','obekler','cumleler']){
      await page.goto(base+'/'+route+'.html');
      await page.locator('[data-sozluk-ac]:visible').first().click();
      await page.locator('#sozlukAra').fill(largest);
      const row=page.locator('#sozlukSonuclar .sozluk-sonuc[data-tur="kelime"][data-anahtar="'+largest+'"]');
      await row.locator('[data-is="ayrinti"]').click();
      await row.locator('.kalip-temel').waitFor();
      const groups=ayir(largest,rows.get(largest).replacement,metadata);
      for(const [selector,expected] of [['.kalip-temel li',groups.temel],['.kalip-diger li',groups.diger]]){
        assert.deepEqual(await row.locator(selector).evaluateAll(els=>els.map(el=>({en:el.querySelector('b').textContent,tr:el.textContent.slice(el.querySelector('b').textContent.length).trim()}))),expected,route+': dictionary keeps all pairs');
      }
      await row.locator('summary').press('Enter');
      assert.equal(await row.locator('.kalip-diger').evaluate(el=>el.open),true);
      await layout(page,row,route+' dictionary');
      if(route==='kelimeler')await axe(page,'Expanded dictionary');
    }
    // Only the word inventory is narrowed in this isolated test; the production
    // game, answer handler and card data remain intact. Exercise the shared renderer.
    await page.route(/\/data\/kelime-dizin\.js(?:\?.*)?$/,async route=>{
      const response=await route.fetch();
      await route.fulfill({response,body:await response.text()+'\nwindow.KELIME_DIZIN=window.KELIME_DIZIN.filter(d=>d.e==='+JSON.stringify(largest)+');'});
    });
    await page.goto(base+'/oyunlar.html');
    await page.locator('#oyunPas').click();
    await page.locator('#oyunOrnek .kalip-temel').waitFor();
    await groupsMatch(page.locator('#oyunOrnek .kalip-temel > span'),page.locator('#oyunOrnek .kalip-diger .kalip > span'),largest);
    const beforeGame=await savedProgress(page),gameCounter=await page.locator('#oyunSira').textContent();
    await page.locator('#oyunOrnek summary').press('Enter');
    assert.equal(await page.locator('#oyunOrnek details').evaluate(el=>el.open),true);
    assert.deepEqual(await savedProgress(page),beforeGame,'Game disclosure never grades again');
    assert.equal(await page.locator('#oyunSira').textContent(),gameCounter,'Disclosure never advances the game');
    await layout(page,page.locator('#oyunOrnek'),'Expanded game result');
    await axe(page,'Expanded game result');
    assert.deepEqual(errors,[],'No runtime errors');
    console.log('Usage cards: every pair preserved across list, study, search, dictionary and game; safe keyboard disclosure, mobile/accessibility and enlarged text passed');
  }finally{await context.close();await browser.close();server.close();}
}
main().catch(error=>{console.error(error);server.close();process.exitCode=1;});
