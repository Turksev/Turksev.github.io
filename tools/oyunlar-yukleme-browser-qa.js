'use strict';
// Yanıt vermeyen ayrıntı isteği oyunu engellememeli; geç gelen veri turu sıfırlamamalı.
// Yalıtılmış profillerde, çalışma ağacını sunan geçici HTTP sunucusuyla çalışır.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png'};
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/releases\/[a-f0-9]+\//, '/'); }
  catch { res.writeHead(400).end(); return; }
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, {'Content-Type': (mime[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
});

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true});
  let passed = 0;
  try {
    for (const answered of [false, true]) {
      const context = await browser.newContext({serviceWorkers:'block', timezoneId:'Europe/Istanbul'});
      const page = await context.newPage(), errors = [];
      let release, requested;
      const gate = new Promise(resolve => { release = resolve; });
      const request = new Promise(resolve => { requested = resolve; });
      page.on('pageerror', e => errors.push(e.message));
      try {
        await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
        await context.route(/\/data\/kelime-k\d\.js(?:\?.*)?$/, async route => { requested(); await gate; await route.continue(); });
        await page.clock.install({time:new Date('2026-10-21T09:00:00+03:00')});
        await page.goto(base + '/oyunlar.html', {waitUntil:'domcontentloaded'});
        await request;
        assert.equal(await page.locator('#oyunKart').isVisible(), false);
        await page.clock.runFor(9000);
        await page.locator('#oyunKart').waitFor({state:'visible'});
        assert.equal(await page.locator('#oyunYuk').isVisible(), true);
        const word = await page.evaluate(() => {
          const Y = window.YDS, selected = [...document.querySelectorAll('#katmanlar [aria-pressed="true"]')].map(b => Number(b.dataset.k));
          return Y.OyunHesap.sira(Y.Veri.dizin.filter(d => selected.includes(d.k) && Y.OyunHesap.oynanabilir(d)), 'sira',
            {kayit:e => Y.Ilerleme.kayit(e, 'kelime'), bugun:Y.Ilerleme.bugun()})[0].e;
        });
        if (answered) {
          await page.locator('#oyunPas').click();
          assert.equal(await page.locator('#oyunOrnek .kalip span').count(), 0);
          await page.waitForFunction(w => !!window.YDS.Ilerleme.kayit(w, 'kelime'), word);
        } else {
          await page.locator('#oyunGirdi').fill(word.replace(/[a-z]/gi, c => c.toLowerCase() === 'q' ? 'x' : 'q'));
          await page.locator('#oyunGonder').click();
          await page.locator('#oyunGirdi').fill('ab');
        }
        const snapshot = () => page.evaluate(w => {
          const el = id => document.getElementById(id);
          return {value:el('oyunGirdi').value, letters:el('oyunHarfler').innerHTML, status:el('oyunDurum').textContent,
            queue:el('oyunSira').textContent, button:el('oyunGonder').textContent,
            record:window.YDS.Ilerleme.kayit(w, 'kelime'), daily:window.YDS.Ilerleme.gunlukKayitlar(),
            focus:document.activeElement.id};
        }, word);
        const before = await snapshot();
        release();
        await page.locator('#oyunYuk').waitFor({state:'hidden'});
        assert.deepEqual(await snapshot(), before, 'geç gelen ayrıntı turu, harfleri, odağı veya ilerlemeyi değiştirdi');
        assert.ok(await page.evaluate(w => !!window.YDS.Veri.kayit(w), word));
        if (answered) assert.ok(await page.locator('#oyunOrnek .kalip span').count() > 0);
        assert.deepEqual(errors, []);
        passed++;
        console.log('OK geciken katmanda 8 sn sonra oyun; geç ayrıntı ' + (answered ? 'biten sonucu tamamlar, tekrar puanlamaz' : 'yazılmış harfleri ve yanlış denemeyi korur'));
      } finally { release(); await context.close(); }
    }
    console.log('Oyunlar yükleme QA: ' + passed + ' senaryo geçti.');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => {
  console.error(error);
  if (process.env.GITHUB_ACTIONS) {
    // Yalıtılmış senaryo hatasını GitHub kontrol sonucunda görünür kıl.
    const detail = String(error.stack || error).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
    console.error('::error title=Oyunlar Yukleme Browser QA::' + detail);
  }
  process.exitCode = 1; server.close();
});
