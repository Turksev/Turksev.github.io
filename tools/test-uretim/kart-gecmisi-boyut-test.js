'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var kit=require('./kart-gecmisi-test'),root=path.resolve(__dirname,'../..'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'data/kelime-dizin.js'),'utf8'),ctx);
['data/obekler.js','data/cumleler-dizin.js'].forEach(f=>vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),ctx));
var words=ctx.window.KELIME_DIZIN||ctx.KELIME_DIZIN;
var env=kit.client(),M=env.M,base=1792900000000,packet={'yds-leitner':{}},serial=0;
var randomState=123456789;
function randomId(){randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;var a=randomState.toString(36);randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return (a+randomState.toString(36)).padEnd(13,'0');}
var writers=Array.from({length:Math.ceil(words.length/30)*5},randomId);
M.KART_GECMISI_ALANLARI.forEach(k=>{packet[k]={};});
words.forEach((word,index)=>{
  var name=typeof word==='string'?word:word.e,card='kelime:'+name;
  assert.ok(name,'dictionary heading available');var shard=M.kartGecmisiAlani(card),r={v:1,q:0,k:0,p:{},f:base+index,u:null,e:[]};
  for(var j=0;j<5;j++)r.p[writers[Math.floor(index/30)*5+j]]=[4,0,0,0,4];
  for(var n=0;n<20;n++){var at=base+index*1000+n,writer=writers[Math.floor(index/30)*5+Math.floor(n/4)],id=at.toString(36)+'-'+(++serial).toString(36).padStart(6,'0')+writer;
    var e={id,day:20751,result:'bildim',from:Math.min(n,5),to:Math.min(n+1,5),previousAt:n?at-1:null,dueDay:20751,source:'kart'};
    r.e.push(M.kartGecmisiOlayKodla(e));r.u=[id,0];}
  packet[shard][card]=r;packet['yds-leitner'][name]={k:5,g:20751,c:20751,m:0};
});
M.KART_GECMISI_ALANLARI.forEach(k=>M.kartGecmisiBuda(packet[k]));
// Ordinary word-history baseline includes a sizeable wrong-answer notebook.
packet['yds-test-yanlis']={};
words.map(w=>w.e).forEach((name,i)=>{
  if(i<1000)packet['yds-test-yanlis'][name]={n:i%999+1,t:base+i,u:base+i,c:i%2};
});
function measure(p,expectResetQuota){
  var z=M.zarfaCevir(p),local=env.w.YDS.YerelZarfKodlama.kodla(z,true);
  var cloudMax=Math.max(...M.KART_GECMISI_ALANLARI.map(k=>Buffer.byteLength(M.bulutAlanJson(k,z.alanlar[k]))));
  var backup=Buffer.byteLength(JSON.stringify({tur:'yds-ilerleme-yedegi',sema:1,olusturuldu:new Date().toISOString(),veri:p}));
  var quota=5*1024*1024,c=kit.client(new Map(),null,quota);
  assert.strictEqual(c.D.paketYaz(p),true,'whole history saves under 5 MiB');
  assert.deepStrictEqual(c.rejected,[],'all recovery mirrors fit the same quota');
  var localBytes=c.bytes();assert.ok(localBytes<quota);
  var reloaded=kit.client(c.store,null,quota);
  assert.strictEqual(M.kararliJson(reloaded.E.paket()),M.kararliJson(p),'compressed mirrors/envelope reload exactly');
  var v=kit.settings(reloaded);assert.strictEqual(M.kararliJson(v.validate(p)),M.kararliJson(p),'full export passes the real import validator');
  var beforeReset=M.kararliJson(reloaded.E.paket()),resetOk=reloaded.Il.hepsiniSifirla();
  if(expectResetQuota){
    assert.strictEqual(resetOk,false,'max-scope reset fails safely when its extra backup exceeds quota');
    assert.strictEqual(M.kararliJson(reloaded.E.paket()),beforeReset,'refused reset leaves every progress/history byte unchanged');
    assert.ok(reloaded.rejected.length&&reloaded.rejected.every(r=>r.key==='yds-son-yedek'));
    assert.strictEqual(M.kararliJson(v.validate(reloaded.E.paket())),beforeReset,'complete data remains exportable and importable after refusal');
  }else{
    assert.strictEqual(resetOk,true,'full reset saves its automatic backup within quota: '+JSON.stringify({localBytes,rejected:reloaded.rejected}));
    assert.strictEqual(reloaded.Il.yedegiGeriAl(),true,'full reset undo remains within quota');
    assert.deepStrictEqual(reloaded.rejected,[],'reset and restore also preserve complete recovery mirrors');
  }
  var restored=reloaded.snapshot();assert.strictEqual(restored.cards.length,words.length);
  assert.strictEqual(restored.cards.reduce((s,r)=>s+r.total,0),Object.values(p).reduce((s,map)=>s+Object.values(map).filter(r=>r.v===1).reduce((t,r)=>t+Object.values(r.p).reduce((u,c)=>u+c[4],0),0),0));
  return {words:words.length,srsCards:Object.keys(p['yds-leitner']).length,wrongNotebook:Object.keys(p['yds-test-yanlis']).length,retained:M.KART_GECMISI_ALANLARI.reduce((n,k)=>n+Object.values(p[k]).reduce((s,r)=>s+r.e.length,0),0),maxShardUtf8:cloudMax,compactBackupUtf8:backup,totalLocalUtf16:localBytes,peakResetUndoUtf16:Math.max(c.peak(),reloaded.peak()),resetOk};
}
var normal=measure(packet);assert.strictEqual(normal.retained,20000);assert.ok(normal.maxShardUtf8<900*1024);console.log('Normal '+JSON.stringify(normal));
var maximumScope=kit.clone(packet);
ctx.window.OBEKLER.forEach((w,i)=>{if(!maximumScope['yds-leitner'][w.f])maximumScope['yds-leitner'][w.f]={k:i%5+1,g:20751+i%35,c:20751,m:0};});
for(var ci=0;ci<ctx.window.CUMLELER_DIZIN.toplam;ci++)maximumScope['yds-leitner']['c:synthetic-'+ci.toString(36)]={k:ci%5+1,g:20751+ci%35,c:20751,m:0};
var maxScope=measure(maximumScope,true);console.log('Max scope '+JSON.stringify(maxScope));
// A minority of heavily practised cards may span many page actors. Never prune
// cumulative actor counts to satisfy a detail/history presentation limit.
Object.values(packet).filter(x=>x&&typeof x==='object').forEach(map=>Object.values(map).forEach(r=>{
  if(r.v===1&&r.f<base+100)for(var i=5;i<100;i++)r.p[randomId()]=[1,0,0,0,1];
}));
var stress=measure(packet,true);assert.ok(stress.maxShardUtf8<900*1024);assert.ok(stress.compactBackupUtf8<16*1024*1024);
console.log(JSON.stringify({normal,stress100ActorsOn100Cards:stress,maxScope},null,2));
