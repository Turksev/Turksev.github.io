#!/usr/bin/env node
'use strict';
// Katman üyeliği: her katman için kelime başlıkları, dizin sırasıyla (puan azalan).
// Açılış sayfası katman başına ilerlemeyi 716 KB'lik dizini yüklemeden bununla hesaplar.
// Başlıklar olduğu gibi yazılır; kimlik dönüşümü (alias, '@kelime:') çalışma anında
// YDS.Ilerleme.leitnerOzet → ilerlemeKimligi yolunda yapılır.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const c = { window: {} }; vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(root, 'data', 'kelime-dizin.js'), 'utf8'), c, { filename: 'kelime-dizin.js' });
const words = c.window.KELIME_DIZIN;
if (!Array.isArray(words) || !words.length) throw new Error('Kelime dizini bulunamadı');
const uyelik = {};
for (const d of words) {
  if (!Number.isInteger(d.k) || d.k < 1 || d.k > 7) throw new Error('Geçersiz katman: ' + JSON.stringify(d));
  (uyelik[d.k] = uyelik[d.k] || []).push(d.e);
}
const source = '/* Katman üyeliği — tools/katman-uyelik-uret.js üretir (data/kelime-dizin.js sırasıyla); elle düzenleme. */\n' +
  'window.KATMAN_UYELIK = ' + JSON.stringify(uyelik) + ';\n';
const target = path.join(root, 'data/katman-uyelik.js');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== source) {
    throw new Error('katman-uyelik.js güncel değil: node tools/katman-uyelik-uret.js');
  }
} else fs.writeFileSync(target, source);
console.log(JSON.stringify(Object.fromEntries(Object.keys(uyelik).map(k => [k, uyelik[k].length]))));
