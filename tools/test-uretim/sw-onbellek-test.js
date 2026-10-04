'use strict';
/* sw.js: eski bir sürümün açık sekmesi, saklanan önceki önbellekten okunabilir;
   activate yalnız bir önceki YDS önbelleğini tutar ve başka uygulamalara dokunmaz. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const kok = path.resolve(__dirname, '..', '..');
const kaynak = fs.readFileSync(path.join(kok, 'sw.js'), 'utf8');
const surum = /var SURUM = '(yds-v\d+)'/.exec(kaynak)[1];
const n = Number(surum.slice(5));
const guncel = surum, onceki = 'yds-v' + (n - 1), dahaEski = 'yds-v' + (n - 2);

const depo = new Map();
function onbellek(ad) {
  if (!depo.has(ad)) depo.set(ad, new Map());
  const m = depo.get(ad);
  return {
    match: key => Promise.resolve(m.get(typeof key === 'string' ? key : key.url)),
    put: (key, res) => { m.set(typeof key === 'string' ? key : key.url, res); return Promise.resolve(); },
    addAll: () => Promise.resolve()
  };
}
const caches = {
  open: ad => Promise.resolve(onbellek(ad)),
  keys: () => Promise.resolve(Array.from(depo.keys())),
  delete: ad => Promise.resolve(depo.delete(ad))
};
const olaylar = {};
function agYaniti(metin) { return { ok: true, status: 200, type: 'basic', clone() { return agYaniti(metin); }, text: () => Promise.resolve(metin) }; }
let agCagrisi = 0, agCevrimdisi = false;
const self = {
  location: { origin: 'https://ornek.test', href: 'https://ornek.test/sw.js' },
  addEventListener: (tur, fn) => { olaylar[tur] = fn; },
  skipWaiting: () => {}, clients: { claim: () => Promise.resolve() }
};
const baglam = vm.createContext({
  self, caches, URL, Response, Request, Promise, console,
  // Gerçek tarayıcıda aynı kökten gelen yanıtın türü 'basic'tir; Node'un Response'u bunu vermez.
  fetch: req => { agCagrisi++; return agCevrimdisi ? Promise.reject(new TypeError('offline')) : Promise.resolve(agYaniti('ağdan')); }
});
vm.runInContext(kaynak, baglam, { filename: 'sw.js' });

function getir(url, mode) {
  return new Promise((coz, reddet) => {
    olaylar.fetch({
      request: { method: 'GET', url, mode: mode || 'no-cors' },
      respondWith: p => Promise.resolve(p).then(coz, reddet),
      waitUntil: () => {}
    });
  });
}

(async () => {
  const veri = 'https://ornek.test/releases/eskisurum000/data/kelime-k4.js';
  depo.set(guncel, new Map());
  depo.set(onceki, new Map([[veri, new Response('eski önbellekten', { status: 200 })]]));
  depo.set('baska-uygulama', new Map([[veri, new Response('yabancı', { status: 200 })]]));
  agCevrimdisi = true;
  assert.equal(await (await getir(veri)).text(), 'eski önbellekten', 'güncel önbellekte olmayan dosya önceki YDS önbelleğinden gelir');
  assert.equal(agCagrisi, 0, 'önbellekte bulunan dosya için ağa çıkılmaz');
  const bilinmeyen = 'https://ornek.test/releases/eskisurum000/data/kelime-k5.js';
  await assert.rejects(getir(bilinmeyen), 'hiçbir YDS önbelleğinde olmayan dosya çevrimdışıyken ağ hatası verir');
  assert.equal(agCagrisi, 1, 'yabancı uygulamanın önbelleği YDS için kaynak sayılmaz');
  agCevrimdisi = false;
  assert.equal(await (await getir(bilinmeyen)).text(), 'ağdan');
  assert.ok(depo.get(guncel).has(bilinmeyen), 'ağdan gelen yanıt güncel önbelleğe yazılır');
  // Gezinme: ağ yoksa önceki önbellekteki belge de verilir.
  const belge = 'https://ornek.test/kelimeler.html';
  depo.get(onceki).set(belge, new Response('<html>eski belge</html>', { status: 200 }));
  agCevrimdisi = true;
  assert.equal(await (await getir(belge, 'navigate')).text(), '<html>eski belge</html>');
  // activate: yalnız bir önceki YDS önbelleği kalır, başka uygulamanın önbelleği silinmez.
  depo.set(dahaEski, new Map());
  await new Promise(coz => olaylar.activate({ waitUntil: p => p.then(coz) }));
  assert.deepEqual(Array.from(depo.keys()).sort(), ['baska-uygulama', guncel, onceki].sort(), 'activate sonrası önbellekler');
  console.log('sw-onbellek: önceki sürümün önbelleği okunur, yabancı önbellek kullanılmaz, activate bir öncekini tutar.');
})().catch(e => { console.error(e); process.exit(1); });
