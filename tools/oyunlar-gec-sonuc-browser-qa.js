'use strict';
// Geç katman yüklemesi: hazır sonuç yeniden kurulmaz; açık kalıplar, odak,
// yazılmış cevap ve sonuç korunur. Başka eksik katman, hazır kartı bekletmez.
// Geçici profiller ve yalnız yerel sunucu kullanılır. Sürüm URL'leri kanonik
// çalışma ağacına çözülür; sürüm üretmeden HTML/JS/CSS birlikte sınanır.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const veri = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/kelime-dizin.js'), 'utf8'), {window: veri});
const hedef = veri.KELIME_DIZIN.find(d => d.e === 'take');
assert.ok(hedef, 'Düzenekte açık ikincil kalıpları olan take kartı gerekli');
const diger = hedef.k === 1 ? 2 : 1;
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png'};
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  pathname = pathname.replace(/^\/releases\/[a-f0-9]+\//, '/');
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end(); return;
  }
  res.writeHead(200, {'Content-Type': (mime[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control': 'no-store'});
  fs.createReadStream(file).pipe(res);
});

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless: true});
  const contexts = [], kapilar = [], errors = [];
  let passed = 0;
  async function dene(ad, govde) {
    await govde(); passed++; console.log('OK ' + ad);
  }
  async function duzen(hedefGec) {
    const context = await browser.newContext({serviceWorkers: 'block', timezoneId: 'Europe/Istanbul'});
    contexts.push(context);
    await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    const page = await context.newPage(), serbest = {};
    page.on('pageerror', e => errors.push(e.message));
    for (const katman of hedefGec ? [hedef.k, diger] : [diger]) {
      const kapi = new Promise(resolve => { serbest[katman] = resolve; kapilar.push(resolve); });
      await page.route(new RegExp('/data/kelime-k' + katman + '\\.js(?:\\?.*)?$'), async route => {
        await kapi; await route.continue();
      });
    }
    await page.addInitScript(({katman, diger}) => {
      localStorage.setItem('yds-katmanlar', JSON.stringify([katman, diger]));
      localStorage.setItem('yds-katman7', 'true');
      localStorage.setItem('yds-leitner', JSON.stringify({take: {k: 4, g: 1, c: 1, m: 0}}));
    }, {katman: hedef.k, diger});
    await page.clock.install({time: new Date('2026-10-21T10:00:00+03:00')});
    await page.goto(base + '/oyunlar.html', {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => document.getElementById('oyunSira').textContent === 'Katmanlar yükleniyor…');
    if (!hedefGec) await page.waitForFunction(k => window.YDS.Veri.katmanYukluMu(k), hedef.k);
    await page.clock.runFor(8100);
    await page.locator('#oyunKart').waitFor({state: 'visible'});
    assert.equal(await page.locator('#oyunYuk').isVisible(), true);
    const tamamla = async k => {
      serbest[k]();
      await page.waitForFunction(k => window.YDS.Veri.katmanYukluMu(k), k);
    };
    return {context, page, tamamla};
  }
  async function sonucuAc(page) {
    await page.locator('#oyunPas').click();
    assert.ok((await page.locator('#oyunDurum').innerText()).startsWith('Cevap: take.'));
    // Bekleyen ilerleme yazımı da tamamlansın; sonraki veri gelmesiyle karışmasın.
    await page.clock.runFor(100);
  }
  async function kaliplariAc(page) {
    await page.locator('#oyunSonuc details summary').focus();
    await page.keyboard.press('Enter');
    await page.evaluate(() => {
      window.__sonucDetails = document.querySelector('#oyunSonuc details');
      window.__sonucOdak = document.activeElement;
    });
    assert.equal(await page.locator('#oyunSonuc details').evaluate(el => el.open), true);
  }
  const durum = page => page.evaluate(() => ({
    sonuc: document.getElementById('oyunDurum').innerText,
    sayim: document.getElementById('oyunSayim').innerText,
    girdi: document.getElementById('oyunGirdi').value,
    harfler: document.getElementById('oyunHarfler').innerHTML,
    ilerleme: localStorage.getItem('yds-leitner')
  }));
  async function acikSonucKorundu(page) {
    assert.deepEqual(await page.evaluate(() => ({
      ayni: window.__sonucDetails === document.querySelector('#oyunSonuc details'),
      acik: window.__sonucDetails.open,
      odak: window.__sonucOdak === document.activeElement
    })), {ayni: true, acik: true, odak: true});
  }
  try {
    await dene('başka katmanın geç gelişi açık sonuç bölümünü ve summary odağını değiştirmez', async () => {
      const f = await duzen(false);
      await sonucuAc(f.page); await kaliplariAc(f.page);
      const once = await durum(f.page);
      await f.tamamla(diger);
      await f.page.locator('#oyunYuk').waitFor({state: 'hidden'});
      await acikSonucKorundu(f.page);
      assert.deepEqual(await durum(f.page), once);
      await f.context.close();
    });

    await dene('kart ayrıntısı diğer katman beklerken gelir; canlı cevap ve uyarıdaki odak korunur', async () => {
      const f = await duzen(true);
      const kisa = await f.page.locator('#oyunAnlam').innerHTML();
      await f.page.locator('#oyunGirdi').fill('ab');
      await f.page.locator('#oyunYukDene').focus();
      const once = await durum(f.page);
      await f.tamamla(hedef.k);
      assert.notEqual(await f.page.locator('#oyunAnlam').innerHTML(), kisa, 'Bu kartın ayrıntısı diğer katmanı beklemez');
      assert.equal(await f.page.locator('#oyunYuk').isVisible(), true);
      assert.equal(await f.page.evaluate(() => document.activeElement.id), 'oyunYukDene', 'Görünür uyarıdaki odak yerinde');
      assert.deepEqual(await durum(f.page), once);
      await f.tamamla(diger);
      await f.page.locator('#oyunYuk').waitFor({state: 'hidden'});
      assert.equal(await f.page.evaluate(() => document.activeElement.id), 'oyunGirdi', 'Ancak gizlenen uyarının odağı taşınır');
      assert.deepEqual(await durum(f.page), once);
      await f.context.close();
    });

    await dene('bitmiş kartın yeni kalıpları hemen gelir; sonraki katman aynı sonucu yeniden çizmez', async () => {
      const f = await duzen(true);
      await sonucuAc(f.page);
      const once = await durum(f.page);
      assert.equal(await f.page.locator('#oyunSonuc details').count(), 0);
      await f.tamamla(hedef.k);
      assert.equal(await f.page.locator('#oyunYuk').isVisible(), true);
      assert.equal(await f.page.locator('#oyunSonuc details').count(), 1, 'Kalıplar diğer katman beklerken görünür');
      assert.deepEqual(await durum(f.page), once);
      await kaliplariAc(f.page);
      await f.tamamla(diger);
      await f.page.locator('#oyunYuk').waitFor({state: 'hidden'});
      await acikSonucKorundu(f.page);
      assert.deepEqual(await durum(f.page), once);
      await f.context.close();
    });
    assert.deepEqual(errors, [], 'Yakalanmamış tarayıcı hatası olmamalı');
    console.log(passed + ' geç sonuç senaryosu geçti.');
  } finally {
    kapilar.forEach(birak => birak());
    await Promise.all(contexts.map(c => c.close().catch(() => {})));
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
