'use strict';
// Oyun yüklenemediğinde kurtarma ve yeniden denemeden sonra odak regresyonları.
// Yalıtılmış profiller kullanır. Sürüm URL'lerini çalışma ağacındaki dosyalara
// çözer; böylece sürüm üretmeden değiştirilen HTML/JS/CSS birlikte sınanır.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
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

const KATMAN = /\/data\/kelime-k\d\.js(?:\?.*)?$/;
const bosYazi = 'Seçili katmanlarda henüz öğrenilmiş (5. kutu) kelime yok.';

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless: true});
  const contexts = [], errors = [];
  let passed = 0;
  async function yeni() {
    const context = await browser.newContext({viewport: {width: 320, height: 720}, serviceWorkers: 'block', timezoneId: 'Europe/Istanbul'});
    contexts.push(context);
    await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    return {context, page};
  }
  async function dene(ad, govde) {
    await govde();
    passed++;
    console.log('OK ' + ad);
  }
  async function katmanHatasi() {
    const c = await yeni();
    let davranis = 'hata', birak, istekGeldi;
    const kapi = new Promise(resolve => { birak = resolve; });
    const istek = new Promise(resolve => { istekGeldi = resolve; });
    await c.context.route(KATMAN, async route => {
      if (davranis === 'hata') { await route.abort(); return; }
      istekGeldi();
      await kapi;
      await route.continue();
    });
    await c.page.goto(base + '/oyunlar.html');
    await c.page.locator('#oyunYuk').waitFor({state: 'visible'});
    await c.page.locator('#oyunKart').waitFor({state: 'visible'});
    return {...c, baslat: async () => {
      davranis = 'bekle';
      await c.page.locator('#oyunYukDene').focus();
      await c.page.keyboard.press('Enter');
      await istek;
    }, tamamla: async () => {
      birak();
      await c.page.locator('#oyunYuk').waitFor({state: 'hidden'});
    }};
  }
  const odak = page => page.evaluate(() => document.activeElement.id || document.activeElement.getAttribute('data-mod'));

  try {
    await dene('oyun betiği inmezse anlaşılır hata ve çalışan yeniden yükleme bağlantısı', async () => {
      const {context, page} = await yeni();
      let engel = true;
      await context.route(/\/assets\/js\/oyunlar\.js(?:\?.*)?$/, route => engel ? route.abort() : route.continue());
      await page.goto(base + '/oyunlar.html');
      await page.locator('#oyunBaslatHatasi').waitFor({state: 'visible'});
      assert.equal(await page.locator('#oyunSira').innerText(), 'Oyun yüklenemedi.');
      assert.equal(await page.locator('#oyunBaslatHatasi').getAttribute('role'), 'alert');
      assert.equal(await page.locator('#oyunKart').isVisible(), false);
      const link = page.locator('#oyunBaslatHatasi a');
      engel = false;
      await link.focus();
      await page.keyboard.press('Enter');
      await page.locator('#oyunKart').waitFor({state: 'visible'});
      assert.equal(await page.locator('#oyunBaslatHatasi').isVisible(), false);
      await context.close();
    });

    await dene('boş turda klavyeyle yeniden deneme bitince odak boş durumdadır', async () => {
      const f = await katmanHatasi();
      await f.page.locator('[data-mod="ogrenilen"]').click();
      await f.page.locator('#oyunBos').waitFor({state: 'visible'});
      assert.ok((await f.page.locator('#oyunBos').innerText()).startsWith(bosYazi));
      await f.baslat();
      await f.tamamla();
      assert.equal(await odak(f.page), 'oyunBos');
      assert.ok((await f.page.locator('#oyunBos').innerText()).startsWith(bosYazi));
      await f.context.close();
    });

    await dene('boş turda indirme beklenirken başka yere geçen odak korunur', async () => {
      const f = await katmanHatasi();
      await f.page.locator('[data-mod="ogrenilen"]').click();
      await f.page.locator('#oyunBos').waitFor({state: 'visible'});
      await f.baslat();
      await f.page.locator('[data-mod="sira"]').focus();
      await f.tamamla();
      assert.equal(await odak(f.page), 'sira');
      await f.context.close();
    });

    await dene('kartta yeniden deneme yazılan harfleri korur ve gizlenen düğmedeki odağı girdiye taşır', async () => {
      const f = await katmanHatasi();
      await f.page.locator('#oyunGirdi').fill('ab');
      await f.baslat();
      await f.tamamla();
      assert.equal(await odak(f.page), 'oyunGirdi');
      assert.equal(await f.page.locator('#oyunGirdi').inputValue(), 'ab');
      assert.equal(await f.page.locator('#oyunGonder').innerText(), 'Kontrol et');
      await f.context.close();
    });

    await dene('bitmiş kartın kalıpları sonradan gelir; sonuç ve başka yerdeki odak korunur', async () => {
      const f = await katmanHatasi();
      await f.page.locator('#oyunPas').click();
      const sonuc = await f.page.locator('#oyunDurum').innerText();
      await f.baslat();
      await f.page.locator('[data-mod="yeni"]').focus();
      await f.tamamla();
      assert.equal(await odak(f.page), 'yeni');
      assert.equal(await f.page.locator('#oyunDurum').innerText(), sonuc);
      assert.equal(await f.page.locator('#oyunGonder').innerText(), 'Sonraki kelime →');
      assert.ok(await f.page.locator('#oyunOrnek .kalip span').count() > 0);
      await f.context.close();
    });

    await dene('320 px ve %200 metinde varsayılan/Arial/Verdana açık-koyu logo, sonuç, Diğer kullanımlar ve klavye aç/kapa', async () => {
      const {context, page} = await yeni();
      await page.goto(base + '/oyunlar.html');
      await page.locator('#oyunKart').waitFor({state: 'visible'});
      await page.evaluate(() => {
        const Y = window.YDS, I = Y.Ilerleme, kayit = {};
        kayit[I.ilerlemeKimligi('take', 'kelime')] = {k: 4, g: I.bugun() - 1, c: I.bugun() - 10, m: 0};
        Y.Depo.yaz('yds-leitner', kayit);
        Y.Depo.yaz('yds-katmanlar', [Y.Veri.dizinKaydi('take').k]);
        Y.Depo.yaz('yds-katman7', true);
      });
      await page.reload();
      await page.locator('#oyunKart').waitFor({state: 'visible'});
      await page.locator('#oyunPas').click();
      assert.ok((await page.locator('#oyunDurum').innerText()).startsWith('Cevap: take.'));
      for (const font of ['', 'Arial', 'Verdana']) for (const theme of ['light', 'dark']) {
        await page.evaluate(({font, theme}) => {
          document.documentElement.style.fontSize = '200%';
          document.documentElement.dataset.theme = theme;
          document.body.style.fontFamily = font;
        }, {font, theme});
        const etiket = (font || 'varsayılan') + ' / ' + theme;
        const logo = await page.locator('.brand').evaluate(brand => {
          const dot = brand.querySelector('.dot'), logoMetni = document.createRange(), adMetni = document.createRange();
          logoMetni.selectNodeContents(dot);
          adMetni.selectNode(brand.lastChild);
          const r = el => { const b = el.getBoundingClientRect(); return {left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width}; };
          return {dot: r(dot), logo: r(logoMetni), ad: r(adMetni)};
        });
        assert.ok(logo.logo.left >= logo.dot.left - 1 && logo.logo.right <= logo.dot.right + 1,
          etiket + ': YDS yazısı logo kutusuna sığmalı: ' + JSON.stringify(logo));
        assert.ok(logo.logo.right <= logo.ad.left,
          etiket + ': YDS ile Hazırlık metni çakışmamalı: ' + JSON.stringify(logo));
        assert.ok(logo.logo.top >= logo.dot.top - 1 && logo.logo.bottom <= logo.dot.bottom + 1,
          etiket + ': YDS yazısı logo kutusuna dikey olarak sığmalı: ' + JSON.stringify(logo));
        if (process.env.YDS_OYUN_KENAR_EKRAN_DIR) {
          fs.mkdirSync(process.env.YDS_OYUN_KENAR_EKRAN_DIR, {recursive: true});
          await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
          await page.screenshot({path: path.join(process.env.YDS_OYUN_KENAR_EKRAN_DIR, 'header-flex-320-200-' + (font || 'default').toLowerCase() + '-' + theme + '.png')});
        }
        const summary = page.locator('#oyunSonuc details summary');
        await summary.focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#oyunSonuc details').evaluate(x => x.open), true);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
        const tasan = await page.locator('#oyunSonuc').evaluate(el => [...el.querySelectorAll('*')].filter(x => {
          const r = x.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && (r.left < -1 || r.right > innerWidth + 1);
        }).map(x => x.tagName + '.' + x.className));
        assert.deepEqual(tasan, []);
        await page.keyboard.press('Space');
        assert.equal(await page.locator('#oyunSonuc details').evaluate(x => x.open), false);
      }
      await context.close();
    });

    assert.deepEqual(errors, [], 'Yakalanmamış tarayıcı hatası olmamalı');
    console.log(passed + ' oyun kenar senaryosu geçti.');
  } finally {
    await Promise.all(contexts.map(c => c.close().catch(() => {})));
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => {
  console.error(error);
  if (process.env.GITHUB_ACTIONS) {
    // Yalıtılmış senaryo hatasını GitHub kontrol sonucunda görünür kıl.
    const detail = String(error.stack || error).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
    console.error('::error title=Oyunlar Kenar Browser QA::' + detail);
  }
  process.exitCode = 1; server.close();
});
