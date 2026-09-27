'use strict';
// Sözlük paneli tarayıcı denetimi. Geçici tarayıcı profili ve yerel sunucu kullanır;
// gerçek kullanıcı verisine, buluta veya yayındaki siteye dokunmaz.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  let file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  if (file === root || (fs.existsSync(file) && fs.statSync(file).isDirectory())) file = path.join(file, 'index.html');
  let status = 200;
  if (!fs.existsSync(file)) { file = path.join(root, '404.html'); status = 404; }
  res.writeHead(status, {'Content-Type': (mime[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control': 'no-store'});
  fs.createReadStream(file).pipe(res);
});

async function axeAndLayout(page, label) {
  await page.addScriptTag({path: require.resolve('axe-core/axe.min.js')});
  const violations = await page.evaluate(async () => {
    const result = await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}});
    return result.violations.map(v => ({id: v.id, nodes: v.nodes.map(n => n.target)}));
  });
  assert.deepEqual(violations, [], label + ': accessibility');
  const layout = await page.evaluate(() => ({viewport: innerWidth, scroll: document.documentElement.scrollWidth}));
  assert.ok(layout.scroll <= layout.viewport + 1, label + ': horizontal overflow ' + JSON.stringify(layout));
}
// Kartı ekranın ortasına anında getirir ve orada olduğunu doğrular. Site yumuşak
// kaydırma kullanır; ölçüm kaydırma bitmeden alınırsa kart ekran dışında görünür.
async function centerCard(page) {
  await page.evaluate(() => {
    const kok = document.documentElement, eski = kok.style.scrollBehavior;
    kok.style.scrollBehavior = 'auto';
    document.getElementById('kart').scrollIntoView({block: 'center'});
    kok.style.scrollBehavior = eski;
  });
  await page.waitForFunction(() => {
    const r = document.getElementById('kart').getBoundingClientRect();
    return r.top >= 0 && r.top < innerHeight;
  });
  return (await page.locator('#kart').boundingBox()).y;
}
// Panel kayarak girer; konum ölçümünden önce giriş animasyonu bitmeli.
const settled = page => page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'));
// Yumuşak kaydırma bir Web Animation değildir: sayfa konumu art arda 10 karede
// değişmeyene kadar bekler. Yavaş CI'da deste başlangıcının kaydırması sürebiliyor.
const scrollStill = page => page.evaluate(() => new Promise(resolve => {
  let last = -1, same = 0;
  (function tick() {
    const y = window.scrollY;
    if (y === last) { if (++same >= 10) { resolve(y); return; } } else { same = 0; last = y; }
    requestAnimationFrame(tick);
  })();
}));
const today = page => page.evaluate(() => {
  const Il = window.YDS.Ilerleme, row = Il.gunlukKayitlar()[Il.bugun()] || {};
  return {t: row.t || 0, d: row.d || 0};
});
const nonUsageStorage = page => page.evaluate(() => Object.fromEntries(Object.keys(localStorage)
  .filter(k => !k.startsWith('yds-kullanim-v1:')).sort().map(k => [k, localStorage.getItem(k)])));

async function startDeck(page, url) {
  await page.goto(url);
  // Deste düğmesi baştan etkin; havuz ancak veri yüklenince dolar. Sayaç bunu gösterir.
  await page.waitForFunction(() => window.YDS && window.YDS.Sozluk &&
    /\d/.test(document.getElementById('sayac').textContent) &&
    !/yükleniyor/i.test(document.getElementById('sayac').textContent));
  await page.locator('#desteBasla').click();
  await page.locator('#kart').waitFor({state: 'visible'});
}
// Kartın kendi başlığı dışındaki gerçek sözlük kelimeleri (dizinden seçilir).
async function otherWords(page) {
  return page.evaluate(() => {
    const card = document.getElementById('kartOn').textContent.trim();
    const pool = window.KELIME_DIZIN.filter(d => /^[a-z]{6,}$/.test(d.e) && d.e !== card);
    return [pool[0].e, pool[1].e];
  });
}

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch();
  const errors = [];
  const contexts = [];
  async function fresh(viewport) {
    const context = await browser.newContext({serviceWorkers: 'block', timezoneId: 'Europe/Istanbul', viewport});
    context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    contexts.push(context);
    return context.newPage();
  }
  try {
    /* ---------- Masaüstü: kelime destesi ---------- */
    const page = await fresh({width: 1280, height: 900});
    await startDeck(page, base + '/kelimeler.html');
    assert.equal(await page.locator('#ara').isVisible(), false, 'Deck hides the list filter that would reshuffle it');
    const card = (await page.locator('#kartOn').innerText()).trim();
    const counter = await page.locator('#kartSayac').innerText();
    const before = await today(page);

    const opener = page.locator('#kartAlan [data-sozluk-ac]');
    assert.equal(await opener.getAttribute('aria-label'), 'Sözlük', 'Accessible name keeps the visible label');
    await opener.click();
    await page.locator('#sozlukPanel').waitFor({state: 'visible'});
    await settled(page);
    assert.equal(await opener.getAttribute('aria-expanded'), 'true');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'sozlukAra', 'Focus moves into the search box');
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('sozluk-yan')), true);
    const panelBox = await page.locator('#sozlukPanel').boundingBox();
    const cardBox = await page.locator('#kart').boundingBox();
    assert.ok(panelBox.width >= 320 && panelBox.width <= 421, 'Side panel width ' + panelBox.width);
    assert.ok(Math.round(panelBox.x + panelBox.width) >= 1279, 'Panel sits on the right edge');
    assert.ok(cardBox.x + cardBox.width <= panelBox.x + 1, 'Card is not covered by the panel');

    const storageBefore = await nonUsageStorage(page);
    const [word, word2] = await otherWords(page);
    await page.locator('#sozlukAra').fill(word);
    const row = page.locator('#sozlukSonuclar .sozluk-sonuc[data-tur="kelime"][data-anahtar="' + word + '"]');
    await row.first().waitFor();
    assert.equal((await page.locator('#kartOn').innerText()).trim(), card, 'Searching never changes the card');
    assert.equal(await page.locator('#kartSayac').innerText(), counter, 'Deck position is preserved');
    assert.match(await page.locator('#sozlukDurum').innerText(), /kelime/);

    // Kart kısayolları panelde çalışmaz: sonuç düğmesinde ve arama kutusunda.
    await row.first().locator('[data-is="ayrinti"]').focus();
    await page.keyboard.press('2');
    await page.keyboard.press('1');
    await page.keyboard.press('3');
    await page.keyboard.press('ArrowRight');
    assert.deepEqual(await today(page), before, 'Keys on a panel button never answer the card');
    assert.equal((await page.locator('#kartOn').innerText()).trim(), card, 'Arrow keys in the panel do not move the deck');
    // Panelin odaklanamayan bir yerine (durum satırı) tıklamak odağı sayfaya düşürmez.
    await page.locator('#sozlukDurum').click({position: {x: 5, y: 5}});
    assert.equal(await page.evaluate(() => document.getElementById('sozlukPanel').contains(document.activeElement)), true,
      'Clicking panel chrome keeps focus in the panel');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('2');
    assert.equal((await page.locator('#kartOn').innerText()).trim(), card, 'Keys after clicking panel chrome do not move the card');
    assert.deepEqual(await today(page), before);
    assert.match(await row.first().locator('[data-is="ayrinti"]').getAttribute('aria-label'), new RegExp('^Anlamlar ve örnekler: ' + word + '$'),
      'Result buttons name their headword');
    await page.locator('#sozlukAra').focus();
    await page.keyboard.press('2');
    assert.deepEqual(await today(page), before, 'Typing in the search box never answers the card');
    await page.locator('#sozlukAra').fill(word);
    await row.first().waitFor();

    await row.first().locator('[data-is="ayrinti"]').click();
    await row.first().locator('.sozluk-anlamlar li').first().waitFor();
    assert.equal(await row.first().locator('[data-is="ayrinti"]').getAttribute('aria-expanded'), 'true');
    assert.ok(await row.first().locator('.sozluk-ornek').count() > 0, 'Details show example sentences');

    await row.first().locator('[data-is="sabitle"]').click();
    await page.locator('#sozlukSabitler .sozluk-sonuc[data-anahtar="' + word + '"]').waitFor();
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-is')), 'sabitle', 'Focus stays on the pin button after re-render');
    await page.locator('#sozlukAra').fill(word2);
    await page.locator('#sozlukSonuclar .sozluk-sonuc[data-anahtar="' + word2 + '"]').first().waitFor();
    assert.equal(await page.locator('#sozlukSabitler .sozluk-sonuc[data-anahtar="' + word + '"]').count(), 1, 'Pinned word stays for comparison');
    const links = page.locator('#sozlukDis a');
    assert.equal(await links.count(), 2);
    for (let i = 0; i < 2; i++) {
      assert.equal(await links.nth(i).getAttribute('target'), '_blank');
      assert.equal(await links.nth(i).getAttribute('rel'), 'noopener noreferrer');
    }
    assert.match(await links.nth(0).getAttribute('href'), new RegExp('^https://translate\\.google\\.com/\\?sl=en&tl=tr&text=' + word2 + '&op=translate$'),
      'Ad-free Google Translate comes first, English to Turkish');
    assert.match(await links.nth(1).getAttribute('href'), new RegExp('^https://tureng\\.com/tr/turkce-ingilizce/' + word2 + '$'));
    assert.equal(await page.locator('#sozlukDis a', {hasText: 'Cambridge'}).count(), 0, 'Cambridge link removed');
    await page.locator('#sozlukAra').fill('kanıt');
    await page.waitForFunction(() => /sl=tr&tl=en/.test(document.getElementById('sozlukGoogle').href));
    await page.locator('#sozlukAra').fill(word2);
    await page.locator('#sozlukSonuclar .sozluk-sonuc[data-anahtar="' + word2 + '"]').first().waitFor();
    // Çok sonuçlu aramada da dış sözlük satırı kaydırmadan görünür.
    await page.locator('#sozlukAra').fill('take');
    await page.waitForFunction(() => /take/.test(document.getElementById('sozlukDurum').textContent));
    assert.equal(await page.locator('#sozlukDis a', {hasText: 'Tureng'}).isVisible(), true, 'Tureng link visible without scrolling');
    const linkBox = await page.locator('#sozlukDis a', {hasText: 'Tureng'}).boundingBox();
    assert.ok(linkBox.y + linkBox.height <= 900, 'External links sit above the fold: ' + linkBox.y);
    await page.locator('#sozlukAra').fill(word2);
    await page.locator('#sozlukSonuclar .sozluk-sonuc[data-anahtar="' + word2 + '"]').first().waitFor();
    assert.deepEqual(await nonUsageStorage(page), storageBefore, 'Search, details and pins write no learning data');

    for (const theme of ['light', 'dark']) {
      await page.emulateMedia({colorScheme: theme});
      await axeAndLayout(page, 'Dictionary desktop ' + theme);
    }

    // Sabitlenen kelimenin açık ayrıntısı sonuçları aşağı iter; ipucu adımı için kaldır.
    await page.locator('#sozlukSabitler .sozluk-sonuc[data-anahtar="' + word + '"] [data-is="sabitle"]').click();
    await page.waitForFunction(() => !document.querySelector('#sozlukSabitler .sozluk-sonuc'));

    // Kartın kendi kelimesi görünürse "Bildim" ipucuyla sayılır.
    await page.locator('#sozlukAra').fill(card);
    await page.locator('#sozlukUyari').waitFor({state: 'visible'});
    assert.match(await page.locator('#kartIpucu').innerText(), /sözlükte gördün/);
    await page.keyboard.press('Escape');
    await page.locator('#sozlukPanel').waitFor({state: 'hidden'});
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('sozluk-yan')), false);
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-sozluk-ac')), true,
      'Escape returns focus to the opener');
    await page.locator('#bildim').click();
    let after = await today(page);
    assert.equal(after.t, before.t + 1, 'Answer recorded');
    assert.equal(after.d, before.d, 'Looked-up card counts as hinted, not as a clean "Bildim"');
    assert.notEqual((await page.locator('#kartOn').innerText()).trim(), card, 'Deck moved to the next card');

    // Panel kapalıyken kısayollar yine çalışır ve temiz cevap doğru sayılır.
    await page.locator('#kart').focus();
    await page.keyboard.press('2');
    const clean = await today(page);
    assert.equal(clean.d, after.d + 1, 'Card shortcuts work again after closing the panel');

    // Birden fazla karta bakılabilir: yeni bakış önceki kartın işaretini silmez.
    const cardA = (await page.locator('#kartOn').innerText()).trim();
    await page.keyboard.press('/');
    await page.locator('#sozlukAra').fill(cardA);
    await page.locator('#sozlukUyari').waitFor({state: 'visible'});
    await page.locator('#sonraki').click();
    const cardB = (await page.locator('#kartOn').innerText()).trim();
    assert.notEqual(cardB, cardA);
    await page.locator('#sozlukAra').fill(cardB);
    await page.locator('#sozlukUyari').waitFor({state: 'visible'});
    await page.locator('#onceki').click();
    assert.equal((await page.locator('#kartOn').innerText()).trim(), cardA);
    assert.match(await page.locator('#kartIpucu').innerText(), /sözlükte gördün/, 'First looked-up card keeps its mark');
    const multi = await today(page);
    await page.locator('#bildim').click();
    const multiA = await today(page);
    assert.equal(multiA.t, multi.t + 1);
    assert.equal(multiA.d, multi.d, 'First looked-up card is hinted after looking up a second card');
    assert.equal((await page.locator('#kartOn').innerText()).trim(), cardB, 'Deck continues with the second card');
    await page.locator('#bildim').click();
    const multiB = await today(page);
    assert.equal(multiB.d, multi.d, 'Second looked-up card is hinted too');
    await page.locator('#sozlukKapat').click();
    await page.locator('#sozlukPanel').waitFor({state: 'hidden'});
    await page.locator('#kart').focus();

    // "/" paneli açar; seçilen kelime "Sözlükte ara" ile aratılır.
    await page.keyboard.press('/');
    await page.locator('#sozlukPanel').waitFor({state: 'visible'});
    await page.keyboard.press('Escape');
    await page.locator('#kart').click();
    await page.locator('#kartArka').waitFor({state: 'visible'});
    const selected = await page.evaluate(() => {
      // Örnek cümle yoksa kartın başlığı seçilir; ikisi de gerçek kullanım yolu.
      const span = document.querySelector('#kartOrnek span[lang="en"]') || document.getElementById('kartOn');
      const text = span.firstChild, match = /[A-Za-z]{4,}/.exec(text.data);
      const range = document.createRange();
      range.setStart(text, match.index); range.setEnd(text, match.index + match[0].length);
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
      return match[0];
    });
    await page.locator('.sozluk-secim').waitFor({state: 'visible'});
    const cardBeforeSelect = (await page.locator('#kartOn').innerText()).trim();
    await page.locator('.sozluk-secim').click();
    await page.locator('#sozlukPanel').waitFor({state: 'visible'});
    assert.equal(await page.locator('#sozlukAra').inputValue(), selected, 'Selected word is searched');
    assert.equal((await page.locator('#kartOn').innerText()).trim(), cardBeforeSelect);
    await page.keyboard.press('Escape');

    // Deste bitmeden liste moduna dönmek filtreyi geri getirir.
    await page.locator('#mod').click();
    assert.equal(await page.locator('#ara').isVisible(), true, 'List mode shows the list filter again');

    // Tek kartlık listede aynı kart yanıttan sonra geri gelir: panel hâlâ gösteriyorsa
    // ikinci "Bildim" de ipucuyla sayılır; kart modundan çıkınca uyarı kalkar.
    // Seçili katmanda (varsayılan 2) liste filtresiyle tam bir kayıt bulan kelime.
    const single = await page.evaluate(() => {
      const sade = window.YDS.sadelestir, havuz = window.KELIME_DIZIN.filter(d => d.k === 2);
      const metin = havuz.map(d => sade(d.e + ' ' + d.t + ' ' + d.y));
      const aday = havuz.find(d => /^[a-z]{7,}$/.test(d.e) &&
        metin.filter(m => m.indexOf(sade(d.e)) !== -1).length === 1);
      return aday.e;
    });
    await page.locator('#ara').fill(single);
    await page.waitForFunction(w => document.querySelectorAll('#liste .word').length === 1 &&
      document.querySelector('#liste .word').getAttribute('data-en') === w, single);
    await page.locator('#mod').click();
    await page.locator('#kart').waitFor({state: 'visible'});
    await page.keyboard.press('/');
    await page.locator('#sozlukAra').fill(single);
    await page.locator('#sozlukUyari').waitFor({state: 'visible'});
    const once = await today(page);
    await page.locator('#bildim').click();
    await page.locator('#bildim').click();
    const twice = await today(page);
    assert.equal(twice.t, once.t + 2, 'Both answers recorded');
    assert.equal(twice.d, once.d, 'A card that comes back while its meaning is still shown stays hinted');
    assert.match(await page.locator('#kartIpucu').innerText(), /sözlükte gördün/);
    await page.locator('#mod').click();
    assert.equal(await page.locator('#sozlukUyari').isVisible(), false, 'Leaving card mode clears the panel warning');
    await page.keyboard.press('Escape');

    /* ---------- Dar masaüstü: panel açıkken menü dar ekran biçimine geçer ---------- */
    const narrow = await fresh({width: 1024, height: 700});
    await narrow.goto(base + '/kelimeler.html');
    await narrow.waitForFunction(() => window.YDS && window.YDS.Sozluk);
    const headerClosed = (await narrow.locator('.site-header').boundingBox()).height;
    await narrow.keyboard.press('/');
    await narrow.locator('#sozlukPanel').waitFor({state: 'visible'});
    await settled(narrow);
    const headerOpen = (await narrow.locator('.site-header').boundingBox()).height;
    assert.ok(headerOpen <= Math.max(headerClosed, 80), 'Header stays compact with the side panel: ' + headerClosed + ' -> ' + headerOpen);
    assert.equal(await narrow.locator('.menu-toggle').isVisible(), true, 'Menu button replaces the wrapped navigation');
    await axeAndLayout(narrow, 'Dictionary narrow desktop');

    /* ---------- Telefon: alttan açılan panel ---------- */
    const phone = await fresh({width: 375, height: 740});
    await startDeck(phone, base + '/kelimeler.html');
    await phone.locator('#kartAlan [data-sozluk-ac]').click();
    await phone.locator('#sozlukPanel').waitFor({state: 'visible'});
    await settled(phone);
    assert.equal(await phone.evaluate(() => document.documentElement.classList.contains('sozluk-alt')), true);
    let sheet = await phone.locator('#sozlukPanel').boundingBox();
    assert.ok(Math.abs(sheet.y + sheet.height - 740) <= 1, 'Sheet is anchored to the bottom');
    assert.ok(sheet.height > 740 * 0.45 && sheet.height < 740 * 0.65, 'Default sheet height ' + sheet.height);
    assert.ok(sheet.width >= 374, 'Sheet spans the width');
    const phoneCard = await phone.locator('#kart').boundingBox();
    assert.ok(phoneCard.y < sheet.y, 'Card starts above the sheet');
    await phone.locator('#sozlukAra').fill('evidence');
    await phone.locator('#sozlukSonuclar .sozluk-sonuc').first().waitFor();
    for (const theme of ['light', 'dark']) {
      await phone.emulateMedia({colorScheme: theme});
      await axeAndLayout(phone, 'Dictionary sheet ' + theme);
    }
    await phone.locator('#sozlukBoy').click();
    assert.equal((await phone.locator('#sozlukBoy').innerText()).trim(), 'Küçült', 'Size button names the next action');
    await settled(phone);
    const tall = await phone.locator('#sozlukPanel').boundingBox();
    assert.ok(tall.height > sheet.height + 100, 'Expanded sheet is taller');
    const scrollable = await phone.evaluate(() => {
      const el = document.getElementById('sozlukGovde');
      return getComputedStyle(el).overflowY;
    });
    assert.equal(scrollable, 'auto', 'Results scroll inside the sheet');
    const enlarged = await phone.evaluate(() => {
      document.documentElement.style.fontSize = '32px';
      const result = {viewport: innerWidth, scroll: document.documentElement.scrollWidth};
      document.documentElement.style.fontSize = '';
      return result;
    });
    assert.ok(enlarged.scroll <= enlarged.viewport + 1, 'Sheet reflows at 200% text: ' + JSON.stringify(enlarged));
    // Odaktaki "Büyüt" düğmesi yerleşim yan sütuna geçince gizlenir; odak panelde kalır.
    await phone.locator('#sozlukBoy').focus();
    const phoneBefore = await today(phone);
    await phone.setViewportSize({width: 1280, height: 900});
    await settled(phone);
    assert.equal(await phone.evaluate(() => document.getElementById('sozlukPanel').contains(document.activeElement)), true,
      'Focus stays in the panel when the focused size button disappears');
    await phone.keyboard.press('2');
    assert.deepEqual(await today(phone), phoneBefore, 'Key after the layout switch does not answer the card');
    await phone.setViewportSize({width: 375, height: 740});
    await settled(phone);
    await phone.locator('#sozlukKapat').click();
    assert.equal(await phone.evaluate(() => getComputedStyle(document.body).paddingBottom), '0px', 'Closing removes the sheet padding');

    /* ---------- Geç gelen veri odaktaki bağlantıyı silmez, tuş karta gitmez ---------- */
    const gated = await fresh({width: 1280, height: 900});
    let releaseGate;
    const gate = new Promise(resolve => { releaseGate = resolve; });
    await gated.route(/\/data\/obekler\.js$/, async route => { await gate; await route.continue(); });
    await startDeck(gated, base + '/kelimeler.html');
    const gatedCard = (await gated.locator('#kartOn').innerText()).trim();
    const gatedBefore = await today(gated);
    await gated.keyboard.press('/');
    await gated.locator('#sozlukAra').fill('evidence');
    await gated.locator('#sozlukSonuclar .sozluk-sonuc[data-anahtar="evidence"]').first().waitFor();
    await gated.locator('#sozlukGoogle').focus();
    releaseGate();
    await gated.waitForFunction(() => /öbek/.test(document.getElementById('sozlukDurum').textContent));
    assert.equal(await gated.evaluate(() => document.activeElement && document.activeElement.id), 'sozlukGoogle',
      'The focused external link survives the late re-render');
    await gated.keyboard.press('2');
    await gated.keyboard.press('ArrowRight');
    assert.deepEqual(await today(gated), gatedBefore, 'A key after late data never answers the card');
    assert.equal((await gated.locator('#kartOn').innerText()).trim(), gatedCard);

    /* ---------- Görülmeyen sonuç ipucu sayılmaz; kaydırıp görünce sayılır ---------- */
    const unseen = await fresh({width: 1280, height: 560});
    await unseen.goto(base + '/kelimeler.html');
    await unseen.waitForFunction(() => window.YDS && window.YDS.Sozluk &&
      /\d/.test(document.getElementById('sayac').textContent) && !/yükleniyor/i.test(document.getElementById('sayac').textContent));
    const hidden = await unseen.evaluate(() => {
      const sade = window.YDS.sadelestir, havuz = window.KELIME_DIZIN.filter(d => d.k === 2);
      const metin = havuz.map(d => sade(d.e + ' ' + d.t + ' ' + d.y));
      const tek = havuz.filter(d => /^[a-z]{7,}$/.test(d.e) && metin.filter(m => m.indexOf(sade(d.e)) !== -1).length === 1);
      return {kart: tek[0].e, sabit: tek.slice(1, 5).map(d => d.e)};
    });
    await unseen.locator('#ara').fill(hidden.kart);
    await unseen.waitForFunction(w => document.querySelectorAll('#liste .word').length === 1, hidden.kart);
    await unseen.locator('#mod').click();
    await unseen.locator('#kart').waitFor({state: 'visible'});
    await unseen.keyboard.press('/');
    // Dört sabit, aranan kartın satırını panelin görünen alanının altına iter.
    for (const w of hidden.sabit) {
      await unseen.locator('#sozlukAra').fill(w);
      const r = unseen.locator('#sozlukSonuclar .sozluk-sonuc[data-anahtar="' + w + '"]').first();
      await r.waitFor();
      await r.locator('[data-is="sabitle"]').click();
      await unseen.locator('#sozlukSabitler .sozluk-sonuc[data-anahtar="' + w + '"]').waitFor();
    }
    await unseen.locator('#sozlukAra').fill(hidden.kart);
    const hiddenRow = unseen.locator('#sozlukSonuclar .sozluk-sonuc[data-anahtar="' + hidden.kart + '"]').first();
    await hiddenRow.waitFor();
    await unseen.waitForTimeout(500);
    const hiddenBox = await hiddenRow.locator('.sozluk-anlam').boundingBox();
    assert.ok(hiddenBox.y > 560, 'Fixture keeps the answer below the fold: ' + hiddenBox.y);
    assert.equal(await unseen.locator('#sozlukUyari').isVisible(), false, 'An answer below the fold is not counted as seen');
    assert.doesNotMatch(await unseen.locator('#kartIpucu').innerText(), /sözlükte gördün/);
    await hiddenRow.scrollIntoViewIfNeeded();
    await unseen.locator('#sozlukUyari').waitFor({state: 'attached'});
    await unseen.waitForFunction(() => !document.getElementById('sozlukUyari').hidden);
    assert.match(await unseen.locator('#kartIpucu').innerText(), /sözlükte gördün/, 'Scrolling the answer into view counts it');

    /* ---------- Küçük telefon, %200 yazı: arama ve sonuçlara erişilir ---------- */
    const tiny = await fresh({width: 320, height: 568});
    await startDeck(tiny, base + '/kelimeler.html');
    await tiny.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await tiny.locator('#kartAlan [data-sozluk-ac]').click();
    await tiny.locator('#sozlukPanel').waitFor({state: 'visible'});
    await settled(tiny);
    const tinyInput = await tiny.locator('#sozlukAra').boundingBox();
    assert.ok(tinyInput.y >= 0 && tinyInput.y + tinyInput.height <= 568, 'Search box visible with large text: ' + JSON.stringify(tinyInput));
    await tiny.locator('#sozlukAra').fill('evidence');
    const tinyRow = tiny.locator('#sozlukSonuclar .sozluk-sonuc').first();
    await tinyRow.waitFor();
    const tinyStatus = await tiny.locator('#sozlukDurum').boundingBox(), tinyLinks = await tiny.locator('#sozlukDis').boundingBox();
    assert.ok(tinyStatus.y + tinyStatus.height <= tinyLinks.y + 1, 'Status and external links do not overlap');
    // Tek parça kayan panelde bir sonucun düğmesine basmak kaydırmayı sıfırlamaz.
    assert.equal(await tiny.evaluate(() => document.getElementById('sozlukPanel').classList.contains('sozluk-tek-kaydirma')), true,
      'Large text uses whole-panel scrolling');
    const pinButton = tinyRow.locator('[data-is="sabitle"]');
    await pinButton.scrollIntoViewIfNeeded();
    const scrollBefore = await tiny.evaluate(() => document.getElementById('sozlukPanel').scrollTop);
    assert.ok(scrollBefore > 0, 'Panel scrolled to reach the button: ' + scrollBefore);
    await pinButton.click();
    await tiny.locator('#sozlukSabitler .sozluk-sonuc').first().waitFor();
    await settled(tiny);
    const afterPin = await tiny.evaluate(() => {
      const p = document.getElementById('sozlukPanel');
      return {tek: p.classList.contains('sozluk-tek-kaydirma'), top: p.scrollTop};
    });
    assert.equal(afterPin.tek, true, 'Pressing a result button keeps whole-panel scrolling');
    assert.ok(afterPin.top > 0, 'Pressing a result button does not reset the panel scroll: ' + JSON.stringify(afterPin));
    await tiny.locator('#sozlukSabitler [data-is="sabitle"]').first().click();
    await tiny.waitForFunction(() => !document.querySelector('#sozlukSabitler .sozluk-sonuc'));
    for (const size of ['normal', 'büyük']) {
      if (size === 'büyük') { await tiny.locator('#sozlukBoy').click(); await settled(tiny); }
      await tinyRow.scrollIntoViewIfNeeded();
      const rowBox = await tinyRow.locator('.sozluk-anlam').boundingBox(), sheetBox = await tiny.locator('#sozlukPanel').boundingBox();
      assert.ok(rowBox.y >= sheetBox.y - 1 && rowBox.y + rowBox.height <= 568 + 1,
        'First result reachable inside the ' + size + ' sheet: ' + JSON.stringify({rowBox, sheetBox}));
    }
    const tinyLayout = await tiny.evaluate(() => ({viewport: innerWidth, scroll: document.documentElement.scrollWidth}));
    assert.ok(tinyLayout.scroll <= tinyLayout.viewport + 1, 'No horizontal overflow at 200% text: ' + JSON.stringify(tinyLayout));
    // Kaydırılmış panel yeniden açılınca başa döner: arama kutusu görünür.
    await tiny.locator('#sozlukKapat').click();
    await tiny.locator('#sozlukPanel').waitFor({state: 'hidden'});
    await tiny.locator('#kartAlan [data-sozluk-ac]').click();
    await tiny.locator('#sozlukPanel').waitFor({state: 'visible'});
    await settled(tiny);
    const reopened = await tiny.locator('#sozlukAra').boundingBox();
    assert.ok(reopened.y >= 0 && reopened.y + reopened.height <= 568, 'Search box visible after reopening: ' + JSON.stringify(reopened));
    await tiny.locator('#sozlukKapat').click();
    await tiny.locator('#sozlukPanel').waitFor({state: 'hidden'});

    /* ---------- Seçim düğmesinde Esc odağı sayfaya düşürmez ---------- */
    const sel = await fresh({width: 1280, height: 900});
    await startDeck(sel, base + '/kelimeler.html');
    const selCard = (await sel.locator('#kartOn').innerText()).trim();
    const selBefore = await today(sel);
    await sel.keyboard.press('/');
    await sel.locator('#sozlukAra').fill('evidence');
    await sel.locator('#sozlukSonuclar .sozluk-sonuc[data-anahtar="evidence"]').first().waitFor();
    const selectIn = selector => sel.evaluate(s => {
      const el = document.querySelector(s), r = document.createRange();
      r.selectNodeContents(el);
      const g = getSelection(); g.removeAllRanges(); g.addRange(r);
    }, selector);
    await selectIn('#sozlukSonuclar .sozluk-sonuc[data-anahtar="evidence"] .sozluk-anlam');
    await sel.locator('.sozluk-secim').waitFor({state: 'visible'});
    await sel.locator('.sozluk-secim').focus();
    await sel.keyboard.press('Escape');
    await sel.locator('.sozluk-secim').waitFor({state: 'hidden'});
    assert.equal(await sel.evaluate(() => document.getElementById('sozlukPanel').contains(document.activeElement)), true,
      'Escape on the selection button keeps focus in the open panel');
    await sel.keyboard.press('2');
    assert.deepEqual(await today(sel), selBefore, 'Key after Escape on the selection button does not answer the card');
    assert.equal((await sel.locator('#kartOn').innerText()).trim(), selCard);
    // Panel kapalıyken: odak karta döner, <body>'ye düşmez.
    await sel.locator('#sozlukKapat').click();
    await sel.locator('#sozlukPanel').waitFor({state: 'hidden'});
    await selectIn('#kartOn');
    await sel.locator('.sozluk-secim').waitFor({state: 'visible'});
    await sel.locator('.sozluk-secim').focus();
    await sel.keyboard.press('Escape');
    await sel.locator('.sozluk-secim').waitFor({state: 'hidden'});
    assert.equal(await sel.evaluate(() => document.activeElement && document.activeElement.id), 'kart',
      'Escape with the panel closed returns focus to the card');

    /* ---------- Kartsız liste: seçim düğmesi ekran dışında gizlenir, panel kapanınca
       odak <main>'e değil görünen Sözlük düğmesine döner ---------- */
    const list = await fresh({width: 1280, height: 900});
    await list.goto(base + '/kelimeler.html');
    await list.waitForFunction(() => window.YDS && window.YDS.Sozluk &&
      document.querySelectorAll('article.word .en').length >= 10);
    // Seçili satırın ekrandan çıkabilmesi için liste uzatılır.
    for (let i = 0; i < 3 && await list.locator('#dahaFazla').isVisible(); i++) await list.locator('#dahaFazla').click();
    const listWord = await list.evaluate(() => {
      const el = document.querySelector('article.word .en'), r = document.createRange();
      el.scrollIntoView({block: 'center', behavior: 'instant'});
      r.selectNodeContents(el);
      const g = getSelection(); g.removeAllRanges(); g.addRange(r);
      return el.textContent.trim();
    });
    await list.locator('.sozluk-secim').waitFor({state: 'visible'});
    await list.evaluate(() => window.scrollBy({top: 3000, behavior: 'instant'}));
    assert.ok(await list.evaluate(() => document.querySelector('article.word .en').getBoundingClientRect().bottom < 0),
      'Precondition: the selected word scrolled above the viewport');
    await list.locator('.sozluk-secim').waitFor({state: 'hidden'});
    assert.equal(await list.evaluate(() => getSelection().isCollapsed), false, 'Selection itself is kept while the button hides');
    await list.evaluate(() => {
      const el = document.querySelector('article.word .en');
      el.scrollIntoView({block: 'center', behavior: 'instant'});
    });
    await list.locator('.sozluk-secim').waitFor({state: 'visible'});
    await list.locator('.sozluk-secim').focus();
    await list.keyboard.press('Enter');
    await list.locator('#sozlukPanel').waitFor({state: 'visible'});
    assert.equal(await list.locator('#sozlukAra').inputValue(), listWord, 'Selection button searches the selected word');
    await list.keyboard.press('Escape');
    await list.locator('#sozlukPanel').waitFor({state: 'hidden'});
    assert.equal(await list.evaluate(() => {
      const a = document.activeElement;
      return !!a && a.hasAttribute('data-sozluk-ac') && a.getClientRects().length > 0;
    }), true, 'Without a card, closing returns focus to a visible dictionary button, not <main>');

    /* ---------- "Büyüt" ile görünür olan cevap ipucu sayılır ---------- */
    const grow = await fresh({width: 390, height: 844});
    await grow.goto(base + '/kelimeler.html');
    await grow.waitForFunction(() => window.YDS && window.YDS.Sozluk &&
      /\d/.test(document.getElementById('sayac').textContent) && !/yükleniyor/i.test(document.getElementById('sayac').textContent));
    const growWords = await grow.evaluate(() => {
      const sade = window.YDS.sadelestir, havuz = window.KELIME_DIZIN.filter(d => d.k === 2);
      const metin = havuz.map(d => sade(d.e + ' ' + d.t + ' ' + d.y));
      const tek = havuz.filter(d => /^[a-z]{7,}$/.test(d.e) && metin.filter(m => m.indexOf(sade(d.e)) !== -1).length === 1);
      return {kart: tek[0].e, sabit: tek.slice(1, 7).map(d => d.e)};
    });
    await grow.locator('#ara').fill(growWords.kart);
    await grow.waitForFunction(() => document.querySelectorAll('#liste .word').length === 1);
    await grow.locator('#mod').click();
    await grow.locator('#kartAlan [data-sozluk-ac]').click();
    await grow.locator('#sozlukPanel').waitFor({state: 'visible'});
    await settled(grow);
    // Kartın satırı alt panelin görünen alanının hemen altına inene kadar sabitle.
    let growBox = null;
    const growRow = grow.locator('#sozlukSonuclar .sozluk-sonuc[data-anahtar="' + growWords.kart + '"] .sozluk-anlam').first();
    for (const w of growWords.sabit) {
      await grow.locator('#sozlukAra').fill(w);
      const r = grow.locator('#sozlukSonuclar .sozluk-sonuc[data-anahtar="' + w + '"]').first();
      await r.waitFor();
      await r.locator('[data-is="sabitle"]').click();
      await grow.locator('#sozlukSabitler .sozluk-sonuc[data-anahtar="' + w + '"]').waitFor();
      await grow.locator('#sozlukAra').fill(growWords.kart);
      await growRow.waitFor();
      growBox = await growRow.boundingBox();
      // Yazı tipi farklarına karşı pay: satır görünen alanın en az 30 px altında olmalı.
      if (growBox.y > 874) break;
    }
    assert.ok(growBox.y > 874, 'Fixture keeps the answer clearly below the default sheet: ' + growBox.y);
    await grow.waitForTimeout(300);
    assert.equal(await grow.locator('#sozlukUyari').isHidden(), true, 'Answer below the fold is not yet counted');
    await grow.locator('#sozlukBoy').click();
    await settled(grow);
    const grownBox = await growRow.boundingBox();
    assert.ok(grownBox.y + grownBox.height <= 844, 'Enlarged sheet reveals the answer: ' + JSON.stringify(grownBox));
    await grow.waitForFunction(() => !document.getElementById('sozlukUyari').hidden);
    assert.match(await grow.locator('#kartIpucu').innerText(), /sözlükte gördün/, 'Answer revealed by "Büyüt" counts as seen');

    /* ---------- Dikey telefon: ekran dışındaki karta kaydırılmaz ---------- */
    const port = await fresh({width: 375, height: 740});
    await startDeck(port, base + '/kelimeler.html');
    // Deste başlangıcının karta yumuşak kaydırması bitsin; yoksa açılıştan sonra da sürer.
    await scrollStill(port);
    await port.evaluate(() => {
      // Kartın ekran altında başlaması yazı tipine bırakılmaz (Linux yazı tipleri daha
      // sıkı, kart 740 px içine sığabiliyor): kartın önüne sabit boşluk konur.
      const bosluk = document.createElement('div');
      bosluk.style.height = '1200px';
      const alan = document.getElementById('kartAlan');
      alan.parentNode.insertBefore(bosluk, alan);
      const k = document.documentElement, e = k.style.scrollBehavior;
      k.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); k.style.scrollBehavior = e;
    });
    assert.equal(await scrollStill(port), 0, 'Fixture: page rests at the top before opening');
    assert.equal(await port.evaluate(() => document.getElementById('kart').getBoundingClientRect().top > innerHeight), true,
      'Fixture: card starts below the fold');
    await port.keyboard.press('/');
    await port.locator('#sozlukPanel').waitFor({state: 'visible'});
    await settled(port);
    assert.equal(await scrollStill(port), 0, 'Opening the sheet with the card off-screen does not scroll the page');

    /* ---------- Yatay telefon: kart ekrandaki yerini korur ---------- */
    const land = await fresh({width: 640, height: 360});
    await startDeck(land, base + '/kelimeler.html');
    const landBefore = await centerCard(land);
    await land.keyboard.press('/');
    await land.locator('#sozlukPanel').waitFor({state: 'visible'});
    await settled(land);
    assert.equal(await land.evaluate(() => document.documentElement.classList.contains('sozluk-yan')), true, 'Short landscape uses the side column');
    const landOpen = (await land.locator('#kart').boundingBox()).y;
    assert.ok(Math.abs(landOpen - landBefore) <= 5 && landOpen >= 0 && landOpen < 360,
      'Card stays in place when the side panel opens: ' + landBefore + ' -> ' + landOpen);
    await land.keyboard.press('Escape');
    await land.locator('#sozlukPanel').waitFor({state: 'hidden'});
    const landClosed = (await land.locator('#kart').boundingBox()).y;
    assert.ok(Math.abs(landClosed - landBefore) <= 5, 'Card stays in place when the panel closes: ' + landBefore + ' -> ' + landClosed);
    // Ekran döndürme panel açıkken: kart görünür kalır (iki yönde).
    await land.keyboard.press('/');
    await land.locator('#sozlukPanel').waitFor({state: 'visible'});
    for (const [w, h] of [[360, 640], [640, 360], [390, 844], [844, 390]]) {
      await land.setViewportSize({width: w, height: h});
      await settled(land);
      await land.waitForTimeout(150);
      const box = await land.locator('#kart').boundingBox();
      assert.ok(box.y + box.height > 0 && box.y < h, 'Card visible after rotating to ' + w + 'x' + h + ': ' + JSON.stringify(box));
    }
    await land.keyboard.press('Escape');

    // Azaltılmış hareket ayarında da kart yerinde kalır.
    const calm = await browser.newContext({serviceWorkers: 'block', timezoneId: 'Europe/Istanbul', viewport: {width: 640, height: 360}, reducedMotion: 'reduce'});
    contexts.push(calm);
    calm.on('page', p => p.on('pageerror', error => errors.push(error.message)));
    const calmPage = await calm.newPage();
    await startDeck(calmPage, base + '/kelimeler.html');
    const calmBefore = await centerCard(calmPage);
    await calmPage.keyboard.press('/');
    await calmPage.locator('#sozlukPanel').waitFor({state: 'visible'});
    await calmPage.waitForTimeout(200);
    const calmOpen = (await calmPage.locator('#kart').boundingBox()).y;
    assert.ok(Math.abs(calmOpen - calmBefore) <= 5, 'Reduced motion: card stays in place: ' + calmBefore + ' -> ' + calmOpen);

    // Kart ekrandayken değil de sayfa başındayken açmak sayfayı kaydırmaz.
    await land.setViewportSize({width: 640, height: 360});
    await land.evaluate(() => window.scrollTo(0, 0));
    await land.keyboard.press('/');
    await land.locator('#sozlukPanel').waitFor({state: 'visible'});
    await settled(land);
    assert.equal(await land.evaluate(() => window.scrollY), 0, 'Opening with the card off-screen does not scroll the page');
    await land.keyboard.press('Escape');

    /* ---------- Öbek listesi: "Kartta çalış" kartı açar ---------- */
    const phraseList = await fresh({width: 1280, height: 900});
    await phraseList.goto(base + '/obekler.html');
    await phraseList.waitForFunction(() => document.querySelector('#liste .word [data-ne="calis"]'));
    const listPhrase = await phraseList.locator('#liste .word').first().getAttribute('data-f');
    await phraseList.locator('#liste .word [data-ne="calis"]').first().click();
    await phraseList.locator('#kart').waitFor({state: 'visible'});
    assert.equal((await phraseList.locator('#kartOn').innerText()).trim(), listPhrase, '"Kartta çalış" opens that phrase as a card');

    /* ---------- Öbek destesi: aynı ipucu kuralı ---------- */
    const phrases = await fresh({width: 1280, height: 900});
    await startDeck(phrases, base + '/obekler.html');
    const phraseCard = (await phrases.locator('#kartOn').innerText()).trim();
    const phraseBefore = await today(phrases);
    await phrases.keyboard.press('/');
    await phrases.locator('#sozlukAra').fill(phraseCard);
    await phrases.locator('#sozlukUyari').waitFor({state: 'visible'});
    assert.equal(await phrases.evaluate(() => typeof window.KELIME_DIZIN), 'object', 'Word index is loaded on demand on the phrases page');
    await phrases.keyboard.press('Escape');
    await phrases.locator('#bildim').click();
    const phraseAfter = await today(phrases);
    assert.equal(phraseAfter.t, phraseBefore.t + 1);
    assert.equal(phraseAfter.d, phraseBefore.d, 'Looked-up phrase card counts as hinted');

    /* ---------- Cümleler: dizin ve katman isteğe bağlı yüklenir ---------- */
    const sentences = await fresh({width: 1280, height: 900});
    await sentences.goto(base + '/cumleler.html');
    await sentences.waitForFunction(() => window.YDS && window.YDS.Sozluk);
    assert.equal(await sentences.evaluate(() => typeof window.KELIME_DIZIN), 'undefined', 'Sentences page does not preload the word index');
    await sentences.locator('.toolbar [data-sozluk-ac]').click();
    await sentences.locator('#sozlukAra').fill('evidence');
    const sentenceRow = sentences.locator('#sozlukSonuclar .sozluk-sonuc[data-anahtar="evidence"]');
    await sentenceRow.waitFor();
    await sentenceRow.locator('[data-is="ayrinti"]').click();
    await sentenceRow.locator('.sozluk-ornek').first().waitFor();
    await sentences.locator('#sozlukAra').fill('cope with');
    await sentences.locator('#sozlukSonuclar .sozluk-sonuc[data-tur="obek"]').first().waitFor();
    await axeAndLayout(sentences, 'Dictionary on sentences page');

    /* ---------- Yükleme hataları kalıcı değildir ---------- */
    const flaky = await fresh({width: 1280, height: 900});
    // Sabitlenmiş bir öbek varken öbek dosyası ve kelime katmanı ilk seferde inmez.
    await flaky.addInitScript(() => sessionStorage.setItem('yds-sozluk-sabit-v1', JSON.stringify([{tur: 'obek', anahtar: 'cope with'}])));
    let blockPhrases = true, blockLayers = true;
    await flaky.route(/\/data\/obekler\.js$/, route => blockPhrases ? route.abort() : route.continue());
    await flaky.route(/\/data\/kelime-k\d\.js$/, route => blockLayers ? route.abort() : route.continue());
    await flaky.goto(base + '/cumleler.html');
    await flaky.waitForFunction(() => window.YDS && window.YDS.Sozluk);
    await flaky.locator('.toolbar [data-sozluk-ac]').click();
    const pinned = flaky.locator('#sozlukSabitler .sozluk-sonuc[data-anahtar="cope with"]');
    await pinned.locator('.sozluk-kutu', {hasText: 'yüklenemedi'}).waitFor();
    assert.equal(await pinned.locator('[data-is="sabitle"]').count(), 1, 'An unresolved pin can still be removed');
    blockPhrases = false;
    await pinned.locator('[data-is="yeniden"]').click();
    await pinned.locator('.sozluk-anlam').waitFor();
    await flaky.locator('#sozlukAra').fill('evidence');
    const detail = flaky.locator('#sozlukSonuclar .sozluk-sonuc[data-anahtar="evidence"]');
    await detail.locator('[data-is="ayrinti"]').click();
    await detail.locator('.sozluk-ayrinti', {hasText: 'yüklenemedi'}).waitFor();
    blockLayers = false;
    await detail.locator('[data-is="ayrinti"]').click();
    await detail.locator('[data-is="ayrinti"]').click();
    await detail.locator('.sozluk-ornek').first().waitFor();
    await flaky.locator('#sozlukSabitler [data-is="sabitle"]').first().click();
    assert.equal(await flaky.locator('#sozlukSabitler .sozluk-sonuc').count(), 0, 'Unpinning removes the pin');

    /* ---------- Arama sayfası ortak kuralla aynı sonucu verir ---------- */
    const search = await fresh({width: 1280, height: 900});
    await search.goto(base + '/ara.html?q=evidence');
    await search.locator('.ara-satir[data-tip="kelime"][data-anahtar="evidence"]').waitFor();
    assert.match(await search.locator('#sayac').innerText(), /sonuç bulundu/);

    assert.deepEqual(errors, [], 'Dictionary runtime errors');
    console.log('Dictionary Browser QA passed: deck-safe search, side and bottom layouts, key isolation, honest hint, selection search, pins, lazy data, axe light/dark.');
  } finally {
    for (const context of contexts) await context.close();
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => {
  console.error(error);
  if (process.env.GITHUB_ACTIONS) {
    const detail = String(error.stack || error).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
    console.error('::error title=Dictionary Browser QA::' + detail);
  }
  server.close(); process.exitCode = 1;
});
