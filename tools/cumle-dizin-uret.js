'use strict';
// Recompute counts from final published records, including unverified sections.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),window={};
for(const f of fs.readdirSync(path.join(root,'data/cumleler')).filter(f=>/^\d{4}\.js$/.test(f)).sort())vm.runInNewContext(fs.readFileSync(path.join(root,'data/cumleler',f),'utf8'),{window});
const years=Object.entries(window.CUMLELER_YIL).sort(([a],[b])=>a.localeCompare(b));
const all=years.flatMap(([,rows])=>rows),counts=new Map();
for(const c of all){const b=c.b||'';counts.set(b,(counts.get(b)||0)+1);}
const index={toplam:all.length,cevirili:all.filter(c=>c.t).length,yillar:years.map(([y,r])=>({y,n:r.length})),
 bolumler:[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'tr')).map(([b,n])=>({b,n}))};
const text='/* YDS cümleleri dizini — final yayımlanan yıl dosyalarından türetilir. */\nwindow.CUMLELER_DIZIN = '+JSON.stringify(index)+';\n';
const file=path.join(root,'data/cumleler-dizin.js');
if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')!==text)throw Error('Stale sentence index; node tools/cumle-dizin-uret.js');}
else fs.writeFileSync(file,text);
console.log('Sentence index: '+all.length+' records, '+(counts.get('')||0)+' unverified section labels.');
