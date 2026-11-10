'use strict';
// Yalnız izole profil ve yerel sunucu; gerçek kullanıcı ilerlemesi okunmaz/değiştirilmez.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  let route=new URL(req.url,'http://localhost').pathname;
  if(process.env.YDS_QA_SOURCE==='1')route=route.replace(/^\/releases\/[a-f0-9]{12}\//,'/');
  const file=path.resolve(root,'.'+(route==='/'?'/index.html':route));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'}[path.extname(file)]||'application/octet-stream')+'; charset=utf-8'});
  fs.createReadStream(file).pipe(res);
});
async function main(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({args:['--explicitly-allowed-ports='+server.address().port]});
  const ctx=await browser.newContext({serviceWorkers:'block',timezoneId:'Europe/Istanbul',reducedMotion:'reduce'});
  await ctx.route(/^https:\/\//,r=>r.abort());
  const page=await ctx.newPage(),errors=[];
  ctx.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));page.on('pageerror',e=>errors.push(e.message));
  const edit=async(id,value)=>{await page.locator('#'+id).fill(value);await page.locator('#'+id).press('Tab');};
  const learning=()=>page.evaluate(()=>{
    const p=YDS.Depo;
    return Object.fromEntries(['yds-leitner','yds-yeni-sayac','yds-gunluk-kayit','yds-gunluk-sonuc','yds-gunluk-yeni','yds-gunluk-tavan'].map(k=>[k,p.oku(k,null)]));
  });
  try{
    await page.goto(base+'/kelimeler.html');
    const names=await page.evaluate(()=>{
      const names=YDS.Veri.dizin.filter(d=>d.k===2).slice(0,3).map(d=>d.e),rows={};
      for(const name of names)rows[YDS.Ilerleme.ilerlemeKimligi(name,'kelime')]={k:2,g:0,c:0};
      YDS.Depo.yaz('yds-leitner',rows);YDS.Depo.yaz('yds-katmanlar',[2]);YDS.Depo.yaz('yds-katman7',true);
      return names;
    });
    await page.reload();await page.getByText('Deste ayarları',{exact:true}).click();
    assert.equal(await page.locator('.deste-ayar #desteAyarAciklama').isVisible(),true);
    assert.equal(await page.locator('.deste-ayar #desteAyarMesaj').count(),1);
    assert.equal(await page.locator('#gunlukHedef').getAttribute('max'),null);
    assert.equal(await page.locator('#gunlukTavan').getAttribute('max'),null);
    await page.locator('#gunlukSinirsiz').check();
    await edit('gunlukHedef','0');
    assert.equal(await page.evaluate(()=>YDS.Ilerleme.gunlukHedef()),0);
    assert.match(await page.locator('#desteBasla').innerText(),/3 kart/);
    assert.doesNotMatch(await page.locator('#desteAciklama').innerText(),/Infinity|NaN|0 günde/);
    assert.match(await page.locator('#desteAciklama').innerText(),/Yeni kart hedefi 0/);
    await page.evaluate(()=>YDS.Ilerleme.kotaArtir(7));
    assert.equal(await page.evaluate(()=>YDS.Ilerleme.yeniKotasiKalan()),0,'0, eski ek kotayla aşılmaz');
    await edit('gunlukHedef','1000');
    assert.equal(await page.evaluate(()=>YDS.Ilerleme.gunlukHedef()),1000);
    await edit('gunlukHedef','10000');
    assert.equal(await page.evaluate(()=>YDS.Ilerleme.gunlukHedef()),10000);
    await page.locator('#gunlukSinirsiz').uncheck();
    await edit('gunlukTavan','0');
    assert.equal(await page.locator('#desteBasla').isDisabled(),true);
    assert.equal(await page.locator('#devamEt').isHidden(),true);
    assert.equal(await page.evaluate(()=>YDS.Ilerleme.destelik([{en:'audit-new'}],'kelime').length),0);
    await edit('gunlukTavan','1000');
    assert.equal(await page.evaluate(()=>YDS.Ilerleme.gunlukTavan()),1000);
    await edit('gunlukTavan','20000');
    assert.equal(await page.evaluate(()=>YDS.Ilerleme.gunlukTavan()),20000);
    await edit('gunlukHedef','-1');
    assert.equal(await page.locator('#gunlukHedef').getAttribute('aria-invalid'),'true');
    assert.equal(await page.evaluate(()=>YDS.Ilerleme.gunlukHedef()),10000,'Geçersiz sayı son ayarı bozmaz');
    await edit('gunlukHedef','');
    assert.equal(await page.evaluate(()=>YDS.Ilerleme.gunlukHedef()),10000,'Boş alan kendiliğinden 0 kaydedilmez');
    await edit('gunlukHedef','2');await page.locator('#gunlukSinirsiz').check();
    await page.locator('#desteBasla').click();
    await edit('gunlukHedef','0');
    assert.match(await page.locator('#kartKutu').innerText(),/2\. kutu/,'Açık deste yeni hedefe göre tekrar kartına geçer');
    await page.locator('#gunlukSinirsiz').uncheck();await edit('gunlukTavan','0');
    assert.equal(await page.locator('#kartAlan').isHidden(),true);
    await page.reload();
    assert.equal(await page.locator('#gunlukHedef').inputValue(),'0');
    assert.equal(await page.locator('#gunlukTavan').inputValue(),'0');
    await page.getByText('Deste ayarları',{exact:true}).click();
    await page.locator('#gunlukSinirsiz').check();
    const other=await ctx.newPage();await other.goto(base+'/obekler.html');
    await other.waitForFunction(()=>!!window.OBEKLER);
    assert.equal(await other.locator('#gunlukHedef').inputValue(),'0');
    assert.equal(await other.locator('#gunlukSinirsiz').isChecked(),true);
    await other.getByText('Deste ayarları',{exact:true}).click();
    await other.locator('#gunlukHedef').fill('37');await other.locator('#gunlukHedef').press('Tab');
    await page.waitForFunction(()=>document.getElementById('gunlukHedef').value==='37');
    await other.close();
    // Dar ekran: alanlar ve açık ayarlar taşmamalı, etiketler erişilebilir olmalı.
    await page.setViewportSize({width:320,height:812});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
    assert.deepEqual(await page.evaluate(async()=>(await axe.run('.deste-ayar',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id)),[]);
    if(process.env.YDS_QA_SCREENSHOT)await page.locator('.deste-ayar').screenshot({path:process.env.YDS_QA_SCREENSHOT});
    assert.equal(await page.locator('#sifirla').count(),0);
    assert.equal(await page.evaluate(()=>!!(document.getElementById('kartKlavye').compareDocumentPosition(document.getElementById('kartBicim'))&Node.DOCUMENT_POSITION_FOLLOWING)),true);
    // Kelime/öbek çakışması ve cümle kaydı dahil gerçek veri motoruyla sıfırlama.
    await page.evaluate(()=>{
      YDS.Ilerleme.zatenBiliyorum('used to','kelime');YDS.Ilerleme.zatenBiliyorum('used to','obek');
      YDS.Ilerleme.dogru('audit-sentence','cumle');
    });
    const before=await learning();
    await page.goto(base+'/istatistik.html');
    await page.locator('[data-stats-section="sifirlama"] summary').click();
    let choices=[],dialogs=[];
    page.on('dialog',async dialog=>{dialogs.push(dialog.message());const accept=choices.shift();if(accept)await dialog.accept();else await dialog.dismiss();});
    choices=[false];await page.locator('#kelimeSifirla').click();
    assert.equal(dialogs.length,1);assert.deepEqual(await learning(),before,'İlk onay iptali ilerlemeyi değiştirmez');
    choices=[true,false];dialogs=[];await page.locator('#kelimeSifirla').click();
    assert.equal(dialogs.length,2);assert.deepEqual(await learning(),before,'İkinci onay iptali ilerlemeyi değiştirmez');
    choices=[true,true];dialogs=[];await page.locator('#kelimeSifirla').click();
    assert.equal(dialogs.length,2);assert.match(dialogs[1],/SON UYARI/);
    const after=await learning();
    for(const key of Object.keys(before))if(key!=='yds-leitner')assert.deepEqual(after[key],before[key],key+' korunur');
    assert.deepEqual(await page.evaluate(names=>names.map(w=>YDS.Ilerleme.kutu(w,'kelime')),names),[0,0,0]);
    assert.deepEqual(await page.evaluate(()=>[YDS.Ilerleme.kutu('used to','kelime'),YDS.Ilerleme.kutu('used to','obek'),YDS.Ilerleme.kutu('audit-sentence','cumle')]),[0,5,1]);
    assert.equal(await page.locator('#geriAl').isVisible(),true);
    await page.locator('#geriAl').click();
    assert.deepEqual((await learning())['yds-leitner'],before['yds-leitner'],'Geri al kelime kutularını geri getirir');
    assert.equal(await page.locator('#geriAlKutu').isHidden(),true);
    assert.deepEqual(errors,[]);
    console.log('Deste ayarları: 0/1000/10000/sınırsız, geçersiz giriş, açık deste, kalıcılık ve sekme eşitlemesi; klavye sırası, iki onay/iptal, tür koruması ve geri alma geçti.');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1;});
