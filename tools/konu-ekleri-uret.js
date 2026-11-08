#!/usr/bin/env node
'use strict';
// Yerel ders kaynaklarını konu haritasına ve tarayıcı veri dosyasına aktarır.
// Eski konu kodları ve kullanıcı ilerlemesi değiştirilmez.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const entries = JSON.parse(fs.readFileSync(path.join(__dirname, 'konu-ekleri.json'), 'utf8'));
const codes = new Set(entries.map(x => x.k));
if (codes.size !== entries.length) throw new Error('Ek konu kodları benzersiz olmalı');
const cataloguePath = path.join(root, 'data/konular.js');
const source = fs.readFileSync(cataloguePath, 'utf8').replace(/\r\n/g, '\n');
const context = {window:{}};
vm.runInNewContext(source, context);
const axes = context.window.KONULAR;
const english = axes.find(x => x.e === 'en');
if (!english) throw new Error('İngilizce konu ekseni bulunamadı');
english.u = english.u.filter(x => !codes.has(x.k)).concat(entries);
const spaced = o => '{' + Object.entries(o).map(([k,v]) => JSON.stringify(k)+': '+JSON.stringify(v)).join(', ') + '}';
const total = axes.reduce((n,x) => n+x.u.length, 0);
const header = source.slice(0, source.indexOf('window.KONULAR'))
  .replace(/YDS konu haritaları — \d+ ünite \([^\n]+\)/, 'YDS konu haritaları — '+total+' ünite ('+axes.map(x=>x.ad+' '+x.u.length).join(' + ')+')')
  .replace('tools/konu-aktar.py ile üretilir; elle düzenleme.', 'tools/konu-aktar.py ve tools/konu-ekleri-uret.js üretir; elle düzenleme.');
const catalogue = header+'window.KONULAR = [\n'+axes.map(x=>'{e:'+JSON.stringify(x.e)+',ad:'+JSON.stringify(x.ad)+',aciklama:'+JSON.stringify(x.aciklama)+',u:[\n'+x.u.map(spaced).join(',\n')+'\n]}').join(',\n')+'\n];\n';
const lessons = {};
for (const entry of entries) {
  if (!/^E\d{2}$/.test(entry.k)) throw new Error('Geçersiz ek konu kodu');
  const html = fs.readFileSync(path.join(__dirname, 'konu-ekleri', entry.k+'.html'), 'utf8').replace(/\r\n/g, '\n').trim();
  const plain = html.replace(/<[^>]*>/g,' ').replace(/&[^;\s]+;/g,' ');
  const kelime = (plain.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[]).length;
  lessons[entry.k] = {baslik:entry.ad, ozet:entry.kapsam, html, kelime};
}
const data = '/* E69–E79: tools/konu-ekleri/*.html kaynaklarından üretilir. */\nwindow.KONU_METINLERI = Object.assign(window.KONU_METINLERI || {}, '+JSON.stringify(lessons,null,2)+');\n';
const outputs = [[cataloguePath,catalogue], [path.join(root,'data/konu-metinleri-e3-ek.js'),data]];
for (const [file,text] of outputs) {
  const old = fs.existsSync(file) ? fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n') : '';
  if (old === text) continue;
  if (process.argv.includes('--check')) throw new Error(path.relative(root,file)+': yeniden üretim gerekli');
  fs.writeFileSync(file,text,'utf8');
}
console.log(entries.length+' yerel ek anlatım; '+total+' konu. '+(process.argv.includes('--check')?'Kaynaklar güncel.':'Veriler üretildi.'));
