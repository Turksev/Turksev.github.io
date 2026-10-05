'use strict';
/* data/katman-uyelik.js: dizinle birebir (sıra dâhil), toplamlar sayilar.js ile aynı, üretici --check geçer. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const esit = (a, b, mesaj) => assert.equal(JSON.stringify(a), JSON.stringify(b), mesaj);
const { spawnSync } = require('node:child_process');

const kok = path.resolve(__dirname, '..', '..');
const c = { window: {} }; vm.createContext(c);
for (const f of ['kelime-dizin.js', 'katman-uyelik.js', 'sayilar.js']) {
  vm.runInContext(fs.readFileSync(path.join(kok, 'data', f), 'utf8'), c, { filename: f });
}
const dizin = c.window.KELIME_DIZIN, uyelik = c.window.KATMAN_UYELIK, sayilar = c.window.SAYILAR;
esit(Object.keys(uyelik).map(Number).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7], 'yedi katman');
let toplam = 0;
for (const k of [1, 2, 3, 4, 5, 6, 7]) {
  const beklenen = dizin.filter(d => d.k === k).map(d => d.e);
  esit(Array.from(uyelik[k]), beklenen, 'katman ' + k + ' dizin sırasıyla aynı');
  assert.equal(uyelik[k].length, sayilar.katman[k], 'katman ' + k + ' toplamı sayilar.js ile aynı');
  assert.equal(new Set(uyelik[k]).size, uyelik[k].length, 'katman ' + k + ' içinde yinelenen başlık yok');
  toplam += uyelik[k].length;
}
assert.equal(toplam, sayilar.kelime, 'üyelik toplamı kelime sayısı');
const tum = new Set([].concat(...Object.values(uyelik)));
assert.equal(tum.size, toplam, 'bir kelime tek katmanda');
const kontrol = spawnSync(process.execPath, [path.join(kok, 'tools/katman-uyelik-uret.js'), '--check'], { encoding: 'utf8' });
assert.equal(kontrol.status, 0, 'üretici --check geçmeli: ' + kontrol.stderr);
console.log('katman-uyelik: 7 katman, ' + toplam + ' kelime, dizinle birebir, --check geçti.');
