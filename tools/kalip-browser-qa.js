'use strict';
// Exercise the actual released word cards in an isolated browser profile.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const {readCollection}=require('./kalip-anlam-kaynagi');
const root=path.resolve(__dirname,'..'),{rows}=readCollection();
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
async function main(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port,base='http://127.0.0.1:'+port;
  const browser=await chromium.launch({args:['--explicitly-allowed-ports='+port]});
  const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const largest=[...rows.values()].sort((a,b)=>b.replacement.length-a.replacement.length)[0].word;
  const longest=[...rows.values()].sort((a,b)=>Math.max(...b.replacement.map(p=>p.tr.length))-Math.max(...a.replacement.map(p=>p.tr.length)))[0].word;
  const words=[...new Set(['establish','remember','provide',largest,longest])];
  try{
    for(const width of [320,390,1280]){
      await page.setViewportSize({width,height:900});
      for(const word of words){
        await page.goto(base+'/kelimeler.html?katman=1,2,3,4,5,6,7&q='+encodeURIComponent(word));
        const card=page.locator('#liste .word').filter({has:page.locator('.en',{hasText:new RegExp('^'+word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')})}).first();
        await card.locator('.kalip b').first().waitFor();
        const expected=rows.get(word).replacement;
        assert.deepEqual(await card.locator('.kalip > span').evaluateAll(els=>els.map(el=>({en:el.querySelector('b').textContent,tr:el.querySelector('i').textContent}))),expected,word+': every bilingual phrase renders');
        for(const scale of [16,20]){
          await page.evaluate(size=>{document.documentElement.style.fontSize=size+'px';},scale);
          const overflow=await card.evaluate(el=>Array.from(el.querySelectorAll('.kalip,.kalip > span,.kalip b,.kalip i')).filter(n=>{
            const r=n.getBoundingClientRect();return r.left < -1 || r.right > innerWidth+1 || n.scrollWidth>n.clientWidth+1;
          }).map(n=>({text:n.textContent,scroll:n.scrollWidth,width:n.clientWidth})));
          assert.deepEqual(overflow,[],word+': phrases fit '+width+'px at '+scale+'px font');
        }
        await page.evaluate(()=>{document.documentElement.style.fontSize='';});
        if(word==='establish'){
          await card.locator('[data-ne="calis"]').click();
          await page.locator('#kart').click();
          await page.locator('#kartOrnek .kalip b').first().waitFor();
          assert.deepEqual(await page.locator('#kartOrnek .kalip b').allTextContents(),expected.map(p=>p.en),'Study card retains all establish uses');
          if(process.env.YDS_QA_SCREENSHOTS){
            fs.mkdirSync(process.env.YDS_QA_SCREENSHOTS,{recursive:true});
            await page.locator('#kartAlan').screenshot({path:path.join(process.env.YDS_QA_SCREENSHOTS,'establish-'+width+'.png')});
          }
        }
      }
    }
    assert.deepEqual(errors,[],'No runtime errors');
    console.log('Usage cards: all pairs, all establish uses, variable counts and long translations fit 320/390/1280px with enlarged text');
  }finally{await context.close();await browser.close();server.close();}
}
main().catch(error=>{console.error(error);server.close();process.exitCode=1;});
