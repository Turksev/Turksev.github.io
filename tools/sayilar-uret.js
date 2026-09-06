#!/usr/bin/env node
'use strict';
// Tek sayaç kaynağı: daima yayımlanacak son veri dosyalarından hesaplanır.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const c = { window: {} }; vm.createContext(c);
for (const f of ['kelime-dizin.js', 'obekler.js', 'aileler.js', 'baglaclar.js', 'sorular.js', 'sorular-ek.js', 'konular.js', 'cumleler-dizin.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'data', f), 'utf8'), c, {filename:f});
}
const w = c.window;
const words = w.KELIME_DIZIN || w.KELIMELER_DIZIN;
if (!Array.isArray(words)) throw new Error('Kelime dizini bulunamadı');
const counts = {katman:{}, kelime:words.length, obek:w.OBEKLER.length, soru:w.SORULAR.length,
  aile:w.AILELER.length, aileUye:w.AILELER.reduce((n,a)=>n+a.u.length,0), baglac:w.BAGLACLAR.length, konu:w.KONULAR.reduce((n,a)=>n+a.u.length,0),
  cumle:w.CUMLELER_DIZIN.toplam, obekTur:{}};
for (const d of words) counts.katman[d.k] = (counts.katman[d.k] || 0) + 1;
for (const o of w.OBEKLER) counts.obekTur[o.y] = (counts.obekTur[o.y] || 0) + 1;
const source = '/* Site sayıları — tools/sayilar-uret.js üretir; son yayımlanan veri esas alınır. */\nwindow.SAYILAR = ' + JSON.stringify(counts) + ';\n';
const target = path.join(root, 'data/sayilar.js');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(target, 'utf8') !== source) throw new Error('sayilar.js güncel değil: node tools/sayilar-uret.js');
} else fs.writeFileSync(target, source);
console.log(JSON.stringify(counts));
