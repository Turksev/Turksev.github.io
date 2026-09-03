// Katman 2-4 kelimelerini 70'lik paketlere böl: agent girdileri
const fs = require('fs'), path = require('path'), vm = require('vm');
const SITE = 'C:/Users/Trk/Desktop/YDS/04_uygulama';
const OUT = __dirname + '/girdi';
fs.mkdirSync(OUT, { recursive: true });
const ctx = { window: {} }; ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(SITE + '/data/kelime-dizin.js', 'utf8'), ctx);
const katmanlar = (process.argv[2] || '2,3,4').split(',').map(Number);
let toplam = 0, paketNo = 0;
for (const k of katmanlar) {
  vm.runInContext(fs.readFileSync(SITE + `/data/kelime-k${k}.js`, 'utf8'), ctx);
  const tablo = ctx['KELIME_K' + k];
  const kelimeler = ctx.KELIME_DIZIN.filter(d => d.k === k).map(d => ({
    e: d.e, y: d.y, t: d.t,
    ornek: (tablo[d.e] ? tablo[d.e].a : []).map(a => a.ex).filter(Boolean),
    anlamlar: (tablo[d.e] ? tablo[d.e].a : []).map(a => a.tr),
  }));
  for (let i = 0; i < kelimeler.length; i += 70) {
    paketNo++;
    const ad = `k${k}-p${String(paketNo).padStart(2, '0')}.json`;
    fs.writeFileSync(path.join(OUT, ad), JSON.stringify(kelimeler.slice(i, i + 70), null, 1), 'utf8');
    toplam += Math.min(70, kelimeler.length - i);
  }
}
console.log('paket', paketNo, 'kelime', toplam);
