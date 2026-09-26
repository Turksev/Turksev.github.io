'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process');
if(!process.argv.includes('--child')){
  for(const zone of ['Europe/Istanbul','UTC','America/New_York','Europe/Berlin','Pacific/Kiritimati','Europe/London']){
    const r=cp.spawnSync(process.execPath,[__filename,'--child'],{env:{...process.env,TZ:zone},encoding:'utf8',windowsHide:true});
    assert.equal(r.status,0,zone+'\n'+r.stdout+r.stderr);console.log('Usage calendar OK '+zone);
  }
}else{
  const {browser}=require('./kullanim-fixture');
  for(const [y,m,d] of [[2026,8,26],[2026,2,28],[2026,9,24],[2026,11,31],[2024,1,29]]){
    const b=browser({now:new Date(y,m,d,23,59,50).getTime()});b.advance(20000);b.checkpoint();
    const rows=b.K.oku().records.sort((a,c)=>a.g-c.g);
    assert.equal(rows.length,2);assert.equal(rows[0].g,Date.UTC(y,m,d)/86400000);assert.equal(rows[1].g,rows[0].g+1);
    assert.equal(rows[0].s,10);assert.equal(rows[1].s,10);assert.equal(rows[0].a,1);assert.equal(rows[1].a,0);
    const reloaded=browser({storage:b.storage,sessionStorage:b.sessionStorage,reload:true,now:new Date(y,m,d+1,0,0,10).getTime()});
    assert.equal(reloaded.K.oku().records.reduce((n,r)=>n+r.a,0),2,'Next-day reload counts even after a midnight duration checkpoint');
    const again=browser({storage:b.storage,sessionStorage:b.sessionStorage,reload:true,now:new Date(y,m,d+1,0,0,20).getTime()});
    assert.equal(again.K.oku().records.reduce((n,r)=>n+r.a,0),2,'Another reload on that calendar day preserves the new visit');
  }
  const b=browser();
  for(const [y,m,d] of [[2026,2,8],[2026,10,1],[2026,2,29],[2026,9,25]]){
    const start=new Date(y,m,d).getTime(),end=new Date(y,m,d+1).getTime(),parts=b.H.gunlereBol(start,end);
    assert.equal(parts.length,1);assert.equal(parts[0].g,Date.UTC(y,m,d)/86400000);assert.equal(parts[0].ms,end-start);
  }
}
