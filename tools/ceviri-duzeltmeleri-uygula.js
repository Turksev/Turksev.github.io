'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {review,transformCard}=require('./ceviri-kaynagi');
const root=path.resolve(__dirname,'..');
const q=JSON.stringify;
function senseText(a){return '{tr:'+q(a.tr)+',ex:'+q(a.ex)+',exTr:'+q(a.exTr)+(a.yz?',yz:'+a.yz:'')+(a.exs?.length?',exs:'+q(a.exs):'')+'}';}
function arrayEnd(line,start){
  let depth=0,quoted=false,escaped=false;
  for(let i=start;i<line.length;i++){
    const c=line[i];
    if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
    if(c==='"')quoted=true;else if(c==='[')depth++;else if(c===']'&&--depth===0)return i+1;
  }
  throw Error('Unclosed generated meaning array');
}
function main(){
  const write=process.argv.includes('--write');
  assert.ok(write||process.argv.includes('--check'),'Use --write or --check');
  const pending=[],found=new Set();
  for(let k=1;k<=7;k++){
    const file=path.join(root,`data/kelime-k${k}.js`),text=fs.readFileSync(file,'utf8'),w={};
    vm.runInNewContext(text,{window:w});const cards=w[`KELIME_K${k}`];
    const next=text.split(/\r?\n/).map(line=>{
      const m=line.match(/^("(?:[^"\\]|\\.)+"):\{a:\[/);if(!m)return line;
      const word=JSON.parse(m[1]);found.add(word);
      const after=transformCard(word,cards[word]);
      if(!write){assert.deepEqual(JSON.parse(q(cards[word])),after,word+': published translation');return line;}
      if(q(cards[word].a)===q(after.a))return line;
      const start=m[0].length-1,end=arrayEnd(line,start);
      return line.slice(0,start)+'['+after.a.map(senseText).join(',')+']'+line.slice(end);
    }).join('\n');
    const staged={};vm.runInNewContext(next,{window:staged});
    for(const [word,card] of Object.entries(cards))assert.deepEqual(JSON.parse(q(staged[`KELIME_K${k}`][word])),transformCard(word,card));
    if(next!==text)pending.push({file,text:next});
  }
  for(const r of review.rows)assert.ok(found.has(r.word),'Every approved correction is applied');
  const file=path.join(root,'data/kelime-dizin.js'),text=fs.readFileSync(file,'utf8');
  const shorts=new Map(review.short_meanings.map(r=>[r.word,r]));let hits=0;
  const next=text.split(/\r?\n/).map(line=>{
    const m=line.match(/^\{e:("(?:[^"\\]|\\.)+"),t:("(?:[^"\\]|\\.)*")/);if(!m)return line;
    const r=shorts.get(JSON.parse(m[1]));if(!r)return line;hits++;
    const current=JSON.parse(m[2]);assert.ok(current===r.expected||current===r.replacement,r.word+': short meaning guard');
    if(!write)assert.equal(current,r.replacement);
    return line.replace(',t:'+m[2],',t:'+q(r.replacement));
  }).join('\n');
  assert.equal(hits,shorts.size);if(next!==text)pending.push({file,text:next});
  if(write)for(const p of pending)fs.writeFileSync(p.file,p.text);
  console.log(JSON.stringify({...review.counts,files_updated:write?pending.length:0}));
}
if(require.main===module)main();
