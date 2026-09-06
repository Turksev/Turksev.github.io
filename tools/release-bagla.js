'use strict';
// Apply a verified immutable release to static documents. Navigation stays at root.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'),'utf8'));
if(!/^[0-9a-f]{12}$/.test(manifest.surum)||manifest.kok!=='/releases/'+manifest.surum+'/')throw Error('Invalid release');
const runtime=new Set(manifest.dosyalar.map(f=>f.yol));
const pages=fs.readdirSync(root).filter(f=>f.endsWith('.html')).concat(fs.readdirSync(path.join(root,'konu')).filter(f=>f.endsWith('.html')).map(f=>'konu/'+f));
for(const file of pages){
 const target=path.join(root,file);let s=fs.readFileSync(target,'utf8');
 s=s.replace(/<script data-yds-release>[\s\S]*?<\/script>\s*/g,'');
 s=s.replace(/\b(src|href)="((?:\.\.\/|\.\/|\/)?(?:releases\/[0-9a-f]{12}\/)?(?:assets|data)\/[^"?#]+)"/g,(all,attr,url)=>{
   const original=url.replace(/^(\.\.\/|\.\/|\/)/,'').replace(/^releases\/[0-9a-f]{12}\//,'');
   if(!runtime.has(original))return all;
   return attr+'="'+manifest.kok+original+'"';
 });
 s=s.replace('<head>','<head>\n<script data-yds-release>window.YDS_SURUM='+JSON.stringify(manifest.surum)+';window.YDS_VARLIK_KOKU='+JSON.stringify(manifest.kok)+';</script>');
 fs.writeFileSync(target,s);
}
const worker=path.join(root,'sw.js');
let s=fs.readFileSync(worker,'utf8');
const list=manifest.temel.map(url=>'  '+JSON.stringify(url.startsWith('/')?'.'+url:url).replace(/^"|"$/g,"'"));
s=s.replace(/var TEMEL_DOSYALAR = \[[\s\S]*?\];/,'var TEMEL_DOSYALAR = [\n'+list.join(',\n')+'\n];');
fs.writeFileSync(worker,s);
console.log('Immutable release attached: '+manifest.surum+'; '+pages.length+' documents.');
