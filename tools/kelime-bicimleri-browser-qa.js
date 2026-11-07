'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':(mime[path.extname(file)]||'application/octet-stream')+'; charset=utf-8'});
  if(process.env.YDS_QA_SOURCE==='1'&&path.extname(file)==='.html')res.end(fs.readFileSync(file,'utf8').replace(/\/releases\/[0-9a-f]{12}\//g,'/'));
  else fs.createReadStream(file).pipe(res);
});
async function main(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({args:['--explicitly-allowed-ports='+server.address().port]});
  const context=await browser.newContext({serviceWorkers:'block',timezoneId:'Europe/Istanbul'});
  await context.route(/^https:\/\//,r=>r.abort());
  await context.addInitScript(()=>{
    window.__spoken=[];window.SpeechSynthesisUtterance=function(text){this.text=text;};
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},speak(s){window.__spoken.push(s.text);}}});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:'+server.address().port;
  async function card(word){
    await page.goto(base+'/kelimeler.html?q='+encodeURIComponent(word)+'&katman=1,2,3,4,5,6,7');
    const row=page.locator('#liste .word[data-en="'+word+'"]');await row.locator('[data-ne="calis"]').click();
    await page.waitForFunction(w=>document.getElementById('kartOn').textContent===w,word);
    assert.equal(await page.locator('#kartBicim').isHidden(),true,'Meaning and base are revealed together');
    await page.locator('#kart').click();await page.locator('#kartArka').waitFor({state:'visible'});
  }
  try{
    await card('protected');await page.locator('#kartBicim').waitFor({state:'visible'});
    assert.match(await page.locator('#kartBicim').innerText(),/protect \+ -ed → protected/);
    assert.match(await page.locator('#kartBicim').innerText(),/korumak/);
    const before=await page.evaluate(()=>JSON.stringify(window.YDS.EsitlemeDepo.paket()));
    assert.deepEqual(await page.evaluate(()=>window.__spoken),[],'No unsolicited audio');
    const audio=page.getByRole('button',{name:'protect temel biçiminin telaffuzunu dinle'});
    await audio.click();await audio.press('Space');
    assert.deepEqual(await page.evaluate(()=>window.__spoken),['protect','protect'],'Pointer and keyboard read the base');
    assert.equal(await page.evaluate(()=>JSON.stringify(window.YDS.EsitlemeDepo.paket())),before,'Listening changes no learning records');
    for(const theme of ['light','dark'])for(const width of [320,375,1280]){
      await page.emulateMedia({colorScheme:theme});await page.setViewportSize({width,height:850});
      await page.evaluate(()=>document.documentElement.style.fontSize='20px');
      const layout=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
      assert.ok(layout.scroll<=layout.viewport+1,theme+' '+width+' no overflow');
      await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
      const violations=await page.evaluate(async()=> (await axe.run('#kartBicim',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations);
      assert.deepEqual(violations,[],theme+' '+width+' base panel accessibility');
    }
    for(const [word,expected] of [['written','write'],['words','word'],['lying','lie'],['putting','putt'],['useful','use'],['building','build']]){
      await card(word);assert.ok((await page.locator('#kartBicim').innerText()).includes(expected));
    }
    await card('evening');assert.equal(await page.locator('#kartBicim').isHidden(),true,'No even root invented for evening');
    assert.equal(await page.locator('#kartBicimIcerik').innerText(),'','No stale base details');
    assert.deepEqual(errors,[]);console.log('Word base browser QA PASS: visible forms, ambiguity, optional speech, no progress writes, 320–1280 light/dark at 125% text.');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;server.close();});
