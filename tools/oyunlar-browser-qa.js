'use strict';
// Oyunlar sayfası (oyunlar.html) tarayıcı denetimi. Geçici tarayıcı profili ve yerel sunucu
// kullanır; gerçek kullanıcı verisine, buluta veya yayındaki siteye dokunmaz. Depoyu olduğu
// gibi sunar: sayfa düz assets/… yollarıyla da, /releases/<sürüm>/… yollarıyla da çalışır.
// Beklenen kelimeler sabit yazılmaz; sayfanın kendi verisinden (YDS.Veri, YDS.OyunHesap,
// YDS.Ilerleme) türetilir. Son senaryo Kelimeler sayfasını (kelimeler.html) da açar: oyunda
// yanıtlanan kartın oradaki desteden düşmesi bu oyunla ulaşılabilir olduğu için burada sınanır.
// Çalıştırma: node tools/oyunlar-browser-qa.js
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

// Günü belirleyen senaryolar için sabit saatler: İstanbul'da 10:00, art arda günler.
const GUN = n => new Date(Date.UTC(2026, 9, 5 + n, 7, 0, 0));
const KATMAN_DOSYASI = /\/data\/kelime-k\d\.js(?:\?.*)?$/;
const BASKA_SEKME = 'Bu kelime başka bir sekmede ya da cihazda az önce yanıtlanmış; ilerleme değiştirilmedi.';
// Hiç çalışılmamış kelime ilk denemede bilinince (en az iki harfli kelimede 1. kutuda harf açık gelir).
const BILDINIZ_1 = 'Bildiniz! Kelime 1. kutuya çıktı; bir dahaki sefere harflerin %40\'ı açık gelecek.';
const yanlisHarfler = s => s.replace(/./g, c => (c === 'q' ? 'x' : 'q'));
// Boşluk ayracı kutuda bölünmez boşlukla durur (kaynakta görünmez karakter olmasın diye kodla).
const BOSLUK = String.fromCharCode(160);

/* Sayfa içi yardımcılar (her belgeye eklenir; YDS'e çağrı anında bakar). */
function sayfaIci() {
  // Sayfanın dinleyicilerinden önce kaydolur: bayrak açıkken başka sekmenin yazımı bu sekmeye
  // olay olarak ulaşmaz ("olay henüz gelmedi" durumunu kurmak için).
  window.addEventListener('storage', olay => { if (window.__depolamaOlayiYok) olay.stopImmediatePropagation(); }, true);
  // Eşitleme motorunun bildirdiği durumlar, sırayla (sayfanın dinleyicisinden bağımsız kayıt).
  window.__esitlemeDurumlari = [];
  window.addEventListener('yds-esitleme-durumu', olay => { window.__esitlemeDurumlari.push(olay.detail && olay.detail.durum); });
  const Y = () => window.YDS, O = () => window.YDS.OyunHesap, Il = () => window.YDS.Ilerleme;
  const T = window.__oyun = {
    secili: () => [...document.querySelectorAll('#katmanlar .katman[aria-pressed="true"]')].map(b => Number(b.dataset.k)),
    mod: () => document.querySelector('.oyun-mod [aria-pressed="true"]').dataset.mod,
    havuz: katmanlar => Y().Veri.dizin.filter(d => katmanlar.includes(d.k) && O().oynanabilir(d)),
    // Beklenen soru sırası: seçili katmanlar (ya da verilenler) ve güncel ilerlemeden, saf modülle.
    // İlerleme bu sekmenin bellekteki kopyasından okunur: olayı ulaşmamış başka sekme yazımını görmez.
    sira: (mod, adet, katmanlar) => O().sira(T.havuz(katmanlar || T.secili()), mod || T.mod(),
      {kayit: e => Il().kayit(e, 'kelime'), bugun: Il().bugun()}).slice(0, adet || 5).map(d => d.e),
    // Motorun durum olayı (yapay): 'yukleniyor' | 'yuklendi' | 'baglaniyor' sürüyor demektir.
    esitleme: durum => { window.dispatchEvent(new CustomEvent('yds-esitleme-durumu', {detail: {durum}})); },
    // Başka sekmenin ya da bulutun yazımından sonra gelen olay (yapay).
    depoDegisti: (anahtarlar, kaynak) => { window.dispatchEvent(new CustomEvent('yds-depo-degisti', {detail: {anahtarlar, kaynak: kaynak || 'sekme'}})); },
    // Her ilerleme yazımını "işlem:kelime" olarak kaydeder (kaç kez yazıldığını saymak için).
    yazimlariSay: () => {
      window.__yazilan = [];
      ['dogru', 'ipucuyla', 'yanlis'].forEach(ad => {
        const asil = Il()[ad];
        Il()[ad] = function (w, tur) { window.__yazilan.push(ad + ':' + w); return asil.call(this, w, tur); };
      });
    },
    yazilan: () => window.__yazilan,
    hucreler: () => [...document.querySelectorAll('#oyunHarfler .harf')],
    // Ekrandaki kutular bu kelimeyle bağdaşıyor mu? taze: henüz dokunulmamış tur; açık harfler
    // tam olarak modülün seçtiği konumlarda olmalı (biten önceki kelime böylece elenir).
    uyuyor: (w, taze) => {
      if (document.getElementById('oyunKart').hidden) return false;
      const h = T.hucreler();
      if (h.length !== w.length) return false;
      const acik = taze ? O().acikKonumlar(w, Il().kutu(w, 'kelime'), Il().bugun()) : null;
      return h.every((el, i) => {
        const c = w[i], ayrac = c === '-' || c === ' ';
        if (ayrac !== el.classList.contains('ayrac')) return false;
        if (ayrac) return el.textContent === (c === ' ' ? String.fromCharCode(160) : c);
        const bos = el.classList.contains('bos');
        if (acik && bos === acik.includes(i)) return false;
        return bos || el.textContent === c;
      });
    },
    // Boş kutulara sırayla yazılacak harfler.
    eksik: w => T.hucreler().map((el, i) => (el.classList.contains('bos') ? w[i].toLowerCase() : '')).join(''),
    gorunum: () => {
      const g = id => document.getElementById(id), girdi = g('oyunGirdi');
      return {
        kart: !g('oyunKart').hidden, bos: !g('oyunBos').hidden, bosMetin: g('oyunBos').textContent,
        seviye: g('oyunSeviye').textContent, kutu: g('oyunKutu').textContent,
        durum: g('oyunDurum').textContent, tarif: g('oyunTarif').textContent, siraMetni: g('oyunSira').textContent,
        hucreler: T.hucreler().map(el => ({c: el.textContent, s: el.className.replace(/^harf ?/, '')})),
        harfSinifi: g('oyunHarfler').className,
        deger: girdi.value, azami: girdi.getAttribute('maxlength'), gecersiz: girdi.getAttribute('aria-invalid'),
        odak: document.activeElement && (document.activeElement.id || document.activeElement.tagName),
        harfKapali: g('oyunHarf').disabled, pasKapali: g('oyunPas').disabled, gonder: g('oyunGonder').textContent,
        sonuc: !g('oyunSonuc').hidden, ornek: document.querySelectorAll('#oyunOrnek .oyun-cumle').length,
        kalip: document.querySelectorAll('#oyunOrnek .kalip span').length,
        modlar: [...document.querySelectorAll('.oyun-mod [data-mod]')].map(b => b.textContent),
        sayim: g('oyunSayim').textContent, gunluk: g('oyunGunluk').textContent, katmanBilgi: g('katmanBilgi').textContent,
        bilinen: [...document.querySelectorAll('#oyunBilinen li')].map(li => li.textContent),
        tekrar: [...document.querySelectorAll('#oyunTekrar li')].map(li => li.textContent),
        yukNotu: g('oyunYuk').hidden ? null : g('oyunYuk').textContent.replace(/\s+/g, ' ').trim(),
        duyuru: g('oyunDuyuru').textContent
      };
    },
    // Anlam satırları (tür satırı hariç) ile beklenen HTML aynı mı? Tarayıcının kendi
    // serileştirmesiyle karşılaştırılır. maskeli: tur bitmeden önceki hâl. Yıldızlar girdinin
    // açıklamasına (aria-describedby) girmesin diye aria-hidden bir sarmalayıcıdadır.
    anlam: (w, maskeli, dizinden) => {
      const d = Y().Veri.dizinKaydi(w), tam = Y().Veri.kayit(w), kacar = Y().kacar;
      const metin = m => kacar(maskeli ? O().maskele(m, w) : m);
      const yildizli = a => { const y = Y().yildiz(a); return y ? '<span aria-hidden="true">' + y + '</span>' : ''; };
      const beklenen = document.createElement('div');
      beklenen.innerHTML = dizinden ? metin(d.t) : tam.a.map(a => metin(a.tr) + yildizli(a)).join('<br>');
      const gorulen = document.getElementById('oyunAnlam').cloneNode(true);
      const tur = gorulen.querySelector('.oyun-tur');
      const turMetni = tur ? tur.textContent : null;
      if (tur) tur.remove();
      return {ayni: gorulen.innerHTML === beklenen.innerHTML, gorulen: gorulen.innerHTML, beklenen: beklenen.innerHTML,
        tur: turMetni, beklenenTur: d.y, metin: gorulen.textContent, yildiz: gorulen.querySelectorAll('.yildiz').length,
        okunanYildiz: gorulen.querySelectorAll('.yildiz').length - gorulen.querySelectorAll('[aria-hidden="true"] .yildiz').length};
    },
    // Yeni kelimenin duyurusu (#oyunDuyuru): maskeli anlamlar "; " ile, her ••• yerine " gizli sözcük ",
    // tür satırı ve harf düzeni (O.tarif). Anlamlar katman kaydından (katman inmediyse dizinden),
    // harf düzeni ekrandaki açıklamadan alınır; siraIle: başına sıra satırı eklenir (açılış, mod, katman).
    soru: (w, siraIle) => {
      const d = Y().Veri.dizinKaydi(w), tam = Y().Veri.kayit(w);
      const anlam = (tam && tam.a && tam.a.length ? tam.a : [{tr: d.t}]).map(a => O().maskele(a.tr, w))
        .join('; ').split('•••').join(' gizli sözcük ').replace(/\s+/g, ' ');
      return (siraIle ? document.getElementById('oyunSira').textContent + ' ' : '') +
        'Yeni kelime: ' + anlam + ' (' + d.y + '). ' + document.getElementById('oyunTarif').textContent;
    },
    // Duyuruda cevap: bütün sözcük olarak (alt dizgi değil) ya da sayfanın kendi maske kuralının
    // gizleyeceği bir yer olarak aranır. Bulunanları döndürür.
    duyuruSizinti: w => {
      const metin = document.getElementById('oyunDuyuru').textContent, bulunan = [];
      const tam = new RegExp('(^|[^a-z])' + w.toLowerCase().replace(/[- ]/g, '[- ]?') + '($|[^a-z])');
      if (tam.test(metin.toLowerCase())) bulunan.push('sözcük: ' + metin);
      if (O().maskele(metin, w) !== metin) bulunan.push('maske: ' + O().maskele(metin, w));
      if (metin.includes('•••')) bulunan.push('okunmayan maske işareti: ' + metin);
      return bulunan;
    },
    // Cevap sızıntısı: kartın metin düğümlerinde sayfanın kendi sözcük başı kuralıyla (O.maskele), kutu
    // satırında bütün olarak, özniteliklerde tam sözcük olarak aranır. Dokunulmamış oyunlar.html'de zaten
    // bulunan öznitelikler (enterkeyhint="done", class="q-head" …) sızıntı sayılmaz. Bulunan parçaları döndürür.
    sizinti: async (w, oznitelikKoku) => {
      const k = w.toLowerCase(), kart = document.getElementById('oyunKart'), bulunan = [];
      const ham = new DOMParser().parseFromString(await (await fetch(location.href)).text(), 'text/html');
      const ciftler = kok => (kok ? [kok, ...kok.querySelectorAll('*')] : []).flatMap(el => [...el.attributes].map(a => a.name + '=' + a.value.toLowerCase()));
      const sabit = new Set(ciftler(ham.querySelector(oznitelikKoku || '#oyunKart')));
      const tam = new RegExp('(^|[^a-z])' + k + '($|[^a-z])');
      ciftler(document.querySelector(oznitelikKoku || '#oyunKart')).forEach(c => { if (!sabit.has(c) && tam.test(c.slice(c.indexOf('=') + 1))) bulunan.push('öznitelik ' + c); });
      const yuru = document.createTreeWalker(kart, NodeFilter.SHOW_TEXT);
      for (let d; (d = yuru.nextNode());) if (!d.parentElement.closest('#oyunHarfler') && O().maskele(d.data, w) !== d.data) bulunan.push('metin ' + d.data.trim().slice(0, 60));
      const kutular = T.hucreler().map(el => el.textContent).join('').toLowerCase();
      if (kutular.includes(k.replace(/ /g, String.fromCharCode(160)))) bulunan.push('kutular ' + kutular);
      return bulunan;
    },
    bugunku: () => {
      const r = Il().gunlukKayitlar()[Il().bugun()] || {};
      return {t: r.t || 0, d: r.d || 0, y: r.y || 0};
    },
    kayit: w => { const r = Il().kayit(w, 'kelime'); return r ? {k: r.k, g: r.g, c: r.c} : null; },
    bugun: () => Il().bugun(),
    // Bu sayfada sayılan kullanım eylemleri. Üreteçler çalışmadan önce sayfada kullanım
    // betikleri yoktur: o durumda null döner ve denetim atlanır.
    kullanim: () => {
      const K = Y().Kullanim, toplam = {};
      if (!K) return null;
      K.yaz();
      K.oku().records.filter(r => r.p === 'oyunlar').forEach(r => Object.keys(r.f).forEach(k => { toplam[k] = (toplam[k] || 0) + r.f[k]; }));
      return toplam;
    }
  };
}

const T = (page, ad, ...arg) => page.evaluate(([ad, arg]) => window.__oyun[ad](...arg), [ad, arg]);
const hazir = page => page.waitForFunction(() => {
  const k = document.getElementById('oyunKart'), b = document.getElementById('oyunBos'), s = document.getElementById('oyunSira');
  return !!k && !!b && !!window.__oyun && (!k.hidden || !b.hidden) && !/yükleniyor/i.test(s.textContent);
});
const ac = async (page, base) => { await page.goto(base + '/oyunlar.html'); await hazir(page); };
const kelimeBekle = (page, w, taze = true) => page.waitForFunction(([w, taze]) => window.__oyun.uyuyor(w, taze), [w, taze]);
const durumBekle = (page, metin) => page.waitForFunction(m => document.getElementById('oyunDurum').textContent === m, metin);
// Duyuru bölgesi değişiklikten 80 ms sonra yazılır; beklenen metne ulaşması beklenir.
const duyuruBekle = (page, metin) => page.waitForFunction(m => document.getElementById('oyunDuyuru').textContent === m, metin);
// "N. harf açıldı" iletisindeki sıra: ayraçlar sayılmaz.
const harfSirasi = (w, konum) => w.slice(0, konum + 1).replace(/[^a-z]/gi, '').length;
const kutuBekle = (page, w, k) => page.waitForFunction(([w, k]) => window.YDS.Ilerleme.kutu(w, 'kelime') === k, [w, k]);
// Animasyon (kutu zıplaması, sallanma) bitmeden ölçüm alınmaz.
const durgun = page => page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || a.effect.getComputedTiming().iterations === Infinity));
// Düzenek: sıranın başındaki, 0. kutuda istenenden az boşluk bırakan kelimeleri yarına erteler (oturum sayımına
// ve günlük hedef dışındaki hiçbir beklentiye dokunmaz); sonra sayfayı yeniler.
async function enAzBosluk(page, adet) {
  const ertelenen = await page.evaluate(adet => {
    const O = window.YDS.OyunHesap, Il = window.YDS.Ilerleme, out = [];
    for (const d of window.__oyun.havuz(window.__oyun.secili())) {
      const n = O.harfSayisi(d.e);
      if (n - O.acikSayisi(n, 0) >= adet) break;
      Il.yanlis(d.e, 'kelime'); out.push(d.e);
    }
    return out;
  }, adet);
  if (ertelenen.length) { await page.reload(); await hazir(page); }
}
const odakla = async page => { await page.locator('.harf-alan').click(); assert.equal((await T(page, 'gorunum')).odak, 'oyunGirdi', 'Kutu satırına tıklamak gerçek girdiyi odaklar'); };
async function coz(page, w) {
  await page.locator('#oyunGirdi').focus();
  await page.keyboard.type(await T(page, 'eksik', w));
  await page.keyboard.press('Enter');
}

async function axeVeYerlesim(page, etiket) {
  if (!await page.evaluate(() => !!window.axe)) await page.addScriptTag({path: require.resolve('axe-core/axe.min.js')});
  await durgun(page);
  const ihlaller = await page.evaluate(async () => {
    const sonuc = await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}});
    return sonuc.violations.map(v => ({id: v.id, nodes: v.nodes.map(n => n.target)}));
  });
  assert.deepEqual(ihlaller, [], etiket + ': erişilebilirlik');
  const olcu = await page.evaluate(() => ({ekran: innerWidth, kaydirma: document.documentElement.scrollWidth}));
  assert.ok(olcu.kaydirma <= olcu.ekran + 1, etiket + ': yatay taşma ' + JSON.stringify(olcu));
  // Harf kutuları aria-hidden olduğu için axe karşıtlıklarına bakmaz; burada ölçülür:
  // harf/zemin en az 4,5:1, boş kutunun alt çizgisi/kart en az 3:1.
  const zayif = await page.evaluate(() => {
    if (document.getElementById('oyunKart').hidden) return [];
    const sayilar = s => (s.match(/[\d.]+/g) || []).map(Number);
    const parlaklik = ([r, g, b]) => {
      const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const oran = (a, b) => { const x = parlaklik(a), y = parlaklik(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const kart = sayilar(getComputedStyle(document.getElementById('oyunKart')).backgroundColor);
    return [...document.querySelectorAll('#oyunHarfler .harf')].map(h => {
      const s = getComputedStyle(h), zemin = sayilar(s.backgroundColor);
      const arka = zemin.length === 4 && zemin[3] === 0 ? kart : zemin;
      const dolu = h.textContent.trim() !== '';
      return {sinif: h.className, harf: dolu ? oran(sayilar(s.color), arka) : 9,
        cizgi: !dolu && h.classList.contains('bos') ? oran(sayilar(s.borderBottomColor), kart) : 9};
    }).filter(k => k.harf < 4.5 || k.cizgi < 3);
  });
  assert.deepEqual(zayif, [], etiket + ': harf kutusu karşıtlığı');
}
// Açık/koyu × 375/1280; 375'te ayrıca 20 px kök yazı boyutu (geniş yazı tipli platform).
async function dortluDenetim(page, etiket) {
  for (const tema of ['light', 'dark']) for (const en of [375, 1280]) {
    await page.emulateMedia({colorScheme: tema});
    await page.setViewportSize({width: en, height: 812});
    await axeVeYerlesim(page, etiket + ' ' + tema + ' ' + en);
    if (en === 375) {
      const buyuk = await page.evaluate(() => {
        document.documentElement.style.fontSize = '20px';
        const r = {ekran: innerWidth, kaydirma: document.documentElement.scrollWidth};
        document.documentElement.style.fontSize = '';
        return r;
      });
      assert.ok(buyuk.kaydirma <= buyuk.ekran + 1, etiket + ' ' + tema + ': 20 px kök yazıda yatay taşma ' + JSON.stringify(buyuk));
    }
  }
  await page.emulateMedia({colorScheme: 'light'});
  await page.setViewportSize({width: 1280, height: 900});
}

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch();
  const hatalar = [];          // pageerror ve yakalanmamış söz reddi: hiç olmamalı
  const basarisiz = [];
  let acikBaglamlar = [];
  // ek: bağlama özgü seçenekler (dokunmatik ekran için {hasTouch: true, isMobile: true}).
  async function yeni(viewport = {width: 1280, height: 900}, ek = {}) {
    const context = await browser.newContext({serviceWorkers: 'block', timezoneId: 'Europe/Istanbul', viewport, ...ek});
    context.setDefaultTimeout(15000);
    await context.exposeBinding('__oyunRet', (kaynak, mesaj) => { hatalar.push('unhandledrejection: ' + mesaj); });
    await context.addInitScript(() => {
      window.addEventListener('unhandledrejection', e => {
        const n = e.reason;
        window.__oyunRet(String((n && (n.stack || n.message)) || n));
      });
    });
    await context.addInitScript(sayfaIci);
    context.on('page', page => page.on('pageerror', hata => hatalar.push('pageerror: ' + hata.message)));
    acikBaglamlar.push(context);
    return context;
  }
  const yeniSayfa = async (viewport, ek) => (await yeni(viewport, ek)).newPage();

  const senaryolar = [];
  const senaryo = (ad, govde) => senaryolar.push({ad, govde});

  /* ---------- 1) Boş profil ---------- */
  senaryo('Boş profil: varsayılan katman, ilk kelime, seviye, açık harfler, anlam, axe', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    const b = await page.evaluate(() => {
      const Y = window.YDS, O = Y.OyunHesap, Il = Y.Ilerleme, T = window.__oyun;
      const havuz = Y.Veri.dizin.filter(d => d.k === 2 && O.oynanabilir(d)), w = havuz[0].e;
      const sayilar = Y.Veri.katmanSayilari();
      const kart = document.getElementById('oyunKart');
      const kimlikler = [...document.querySelectorAll('[id]')].map(e => e.id);
      const oznitelikler = [];
      document.querySelectorAll('main, main *').forEach(el => [...el.attributes].forEach(a => oznitelikler.push(a.value.toLowerCase())));
      return {
        w, oynanan: havuz.length, harf: O.harfSayisi(w),
        acikSayisi: O.acikSayisi(O.harfSayisi(w), 0), acik: O.acikKonumlar(w, 0, Il.bugun()),
        tarif: O.tarif(O.turBaslat(w, 0, Il.bugun())),
        depoKatman: localStorage.getItem('yds-katmanlar'), depoSecim: Y.Depo.oku('yds-katmanlar', null),
        basili: [...document.querySelectorAll('#katmanlar .katman[aria-pressed="true"]')].map(x => x.querySelector('b').textContent),
        katmanlar: [...document.querySelectorAll('#katmanlar .katman')].map(x => [Number(x.dataset.k), x.querySelector('i').textContent, x.hasAttribute('title')]),
        beklenenKatmanlar: Y.Veri.KATMANLAR.filter(k => sayilar[k] > 0).map(k => [k, sayilar[k] + ' kelime', false]),
        secimToplami: sayilar[2],
        kartHtml: kart.outerHTML.toLowerCase(),
        oznitelikte: oznitelikler.filter(v => new RegExp('(^|[^a-z])' + w.toLowerCase() + '($|[^a-z])').test(v)),
        h1: document.querySelectorAll('h1').length,
        yinelenenKimlik: kimlikler.filter((k, i) => kimlikler.indexOf(k) !== i),
        gizliOdaklanabilir: document.querySelectorAll('[aria-hidden="true"] :is(a, button, input, select, textarea, [tabindex])').length,
        baslikliDugme: [...document.querySelectorAll('main button[title]')].filter(x => x.textContent.trim()).length,
        kullanim: !!Y.Kullanim,
        // Sıra satırı canlı bölge değildir; soruyu ayrı, görünmeyen duyuru bölgesi okur.
        siraCanli: ['role', 'aria-live', 'aria-atomic'].map(a => document.getElementById('oyunSira').getAttribute(a)),
        duyuruBolgesi: ['role', 'aria-live', 'aria-atomic', 'class'].map(a => document.getElementById('oyunDuyuru').getAttribute(a)),
        canliBolgeIcinde: !!document.getElementById('oyunSira').closest('[role="status"], [aria-live]'),
        girdiAciklamasi: document.getElementById('oyunGirdi').getAttribute('aria-describedby'),
        // Katman seçici kartın altında, kendi kimliğiyle; sıra satırındaki bağlantı ona götürür.
        kartOnce: !!(kart.compareDocumentPosition(document.getElementById('katmanKart')) & Node.DOCUMENT_POSITION_FOLLOWING),
        katmanKart: [document.getElementById('katmanKart').className, !!document.querySelector('#katmanKart #katmanBilgi'), !!document.querySelector('#katmanKart #katmanlar')],
        baglanti: [...document.querySelectorAll('.oyun-bilgi a')].map(a => [a.textContent, a.getAttribute('href')])
      };
    });
    const g = await T(page, 'gorunum');
    assert.equal(b.depoKatman, null, 'Boş profilde katman seçimi yazılmaz');
    assert.equal(b.depoSecim, null);
    assert.deepEqual(b.basili, ['Çekirdek'], 'Varsayılan seçim Çekirdek (2. katman)');
    assert.deepEqual(b.katmanlar, b.beklenenKatmanlar, 'Katman düğmeleri Veri.katmanSayilari() sayılarını gösterir, title taşımaz');
    assert.ok(b.oynanan < b.secimToplami, 'Düzenek: Çekirdek katmanında oyun dışı kelime var (' + b.oynanan + '/' + b.secimToplami + ')');
    assert.equal(g.katmanBilgi, b.secimToplami + ' kelime seçili · oyunda ' + b.oynanan);
    assert.deepEqual(b.siraCanli, [null, null, null], 'Sıra satırı canlı bölge değil');
    assert.equal(b.canliBolgeIcinde, false, 'Sıra satırı bir canlı bölgenin içinde de değil');
    assert.deepEqual(b.duyuruBolgesi, ['status', 'polite', 'true', 'visually-hidden'], 'Duyuru bölgesi görünmez ve kibar');
    assert.equal(b.girdiAciklamasi, 'oyunAnlam oyunTarif', 'Girdinin açıklaması: anlam ve harf düzeni');
    assert.equal(b.kartOnce, true, 'Kelime kartı katman seçiciden önce gelir');
    assert.deepEqual(b.katmanKart, ['card oyun-katman', true, true]);
    assert.deepEqual(b.baglanti, [['Katmanları değiştir', '#katmanKart']], 'Sıra satırındaki bağlantı katman seçiciye götürür');
    assert.equal(g.kart, true); assert.equal(g.bos, false);
    assert.equal(g.seviye, 'Seviye 1 · harflerin %50\'si açık');
    assert.equal(g.kutu, 'hiç çalışılmadı');
    assert.equal(g.hucreler.length, b.w.length, 'Her karakter için bir kutu');
    const acik = g.hucreler.map((h, i) => (h.s.includes('sabit') ? i : -1)).filter(i => i >= 0);
    assert.deepEqual(acik, b.acik, 'Açık harfler modülün seçtiği konumlarda');
    assert.equal(acik.length, b.acikSayisi, 'Açık harf sayısı acikSayisi ile aynı');
    g.hucreler.forEach((h, i) => {
      if (acik.includes(i)) assert.equal(h.c, b.w[i], 'Açık kutu kendi harfini gösterir');
      else { assert.ok(h.s.includes('bos'), 'Kalan kutular boş: ' + h.s); assert.equal(h.c, '', 'Gizli harf kutuda yazmaz'); }
    });
    assert.equal(g.hucreler.filter(h => h.s.includes('simdi')).length, 1, 'Sıradaki boşluk işaretli');
    assert.equal(g.azami, String(b.harf - b.acikSayisi), 'maxlength boşluk sayısıdır');
    assert.equal(g.deger, '');
    assert.equal(g.tarif, b.tarif, 'Ekran okuyucu açıklaması modülden');
    assert.deepEqual(await T(page, 'sizinti', b.w, 'main'), [], 'Kartta ve <main> özniteliklerinde cevap yok');
    const anlam = await T(page, 'anlam', b.w, true, false);
    assert.equal(anlam.gorulen, anlam.beklenen, 'Anlamlar katman kaydıyla aynı (yıldızlarıyla)');
    assert.equal(anlam.tur, anlam.beklenenTur, 'Tür satırı dizinden');
    assert.ok(anlam.yildiz >= 1, 'Düzenek: ilk kelimenin anlamında yıldız var');
    assert.equal(anlam.okunanYildiz, 0, 'Yıldızlar ekran okuyucudan gizli sarmalayıcının içinde');
    assert.deepEqual(g.modlar, ['Sıradakiler (' + b.oynanan + ')', 'Yalnız yeni kelimeler (' + b.oynanan + ')', 'Öğrenilenler · harfsiz (0)']);
    assert.equal(await T(page, 'mod'), 'sira');
    assert.equal(g.siraMetni, 'Sırada ' + b.oynanan + ' kelime: 0 tekrar + ' + b.oynanan + ' yeni.');
    // Açılış duyurusu: sıra satırı, sonra soru (maskeli anlamlar, tür, harf düzeni). Cevap geçmez.
    const duyuru = await T(page, 'soru', b.w, true);
    await duyuruBekle(page, duyuru);
    assert.ok(duyuru.startsWith(g.siraMetni + ' Yeni kelime: '), 'Duyuru sıra satırıyla başlar, soruyla sürer: ' + duyuru);
    assert.ok(duyuru.endsWith('). ' + b.tarif), 'Duyuru harf düzeniyle biter: ' + duyuru);
    assert.ok(duyuru.includes('(' + anlam.beklenenTur + ')'), 'Duyuruda tür satırı var');
    assert.deepEqual(await T(page, 'duyuruSizinti', b.w), [], 'Duyuruda cevap yok');
    assert.equal(g.sonuc, false, 'Sonuç bölümü cevaptan önce kapalı');
    assert.equal(g.kalip + g.ornek, 0, 'Kalıp ve örnek cümle cevaptan önce çizilmez');
    assert.equal(await page.locator('#oyunDinle').isVisible(), false, 'Dinle düğmesi cevaptan önce görünmez');
    assert.equal(g.sayim, 'Bu oturum: ✓ 0 bildin · 💡 0 ipuçlu · ✗ 0 bilemedin');
    assert.match(g.gunluk, /^Bugün açılan yeni kelime: 0 · günlük hedef \d+ \(Kelimeler destesiyle ortak sayaç\)$/);
    assert.equal(g.yukNotu, null);
    assert.equal(b.h1, 1, 'Tek h1');
    assert.deepEqual(b.yinelenenKimlik, [], 'Kimlikler tekil');
    assert.equal(b.gizliOdaklanabilir, 0, 'aria-hidden içinde odaklanabilir öge yok');
    assert.equal(b.baslikliDugme, 0, 'Metinli düğmede title yok');
    assert.equal(await page.locator('.site-nav a[aria-current="page"]').innerText(), 'Oyunlar');
    await dortluDenetim(page, 'Yeni kelime');
    return 'ilk kelime ' + b.w.length + ' harf, ' + b.acikSayisi + ' açık; usage betikleri ' + (b.kullanim ? 'var' : 'yok');
  });

  /* ---------- 2) Doğru cevap ---------- */
  senaryo('Doğru harfler + Enter: Bildiniz, 1. kutu, oturum listesi, sonraki kelime, yenileme', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    const [w, w2] = await T(page, 'sira');
    await kelimeBekle(page, w);
    const once = await T(page, 'bugunku');
    await odakla(page);
    const e = await T(page, 'eksik', w);
    await page.keyboard.type(e);
    let g = await T(page, 'gorunum');
    assert.equal(g.deger, e);
    assert.equal(g.hucreler.map(h => h.c).join(''), w.toLowerCase(), 'Yazılan harfler kutularda görünür');
    assert.equal(await T(page, 'kayit', w), null, 'Tuşa basmak ilerleme yazmaz');
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Bildiniz! Kelime 1. kutuya çıktı; bir dahaki sefere harflerin %40\'ı açık gelecek.');
    await kutuBekle(page, w, 1);
    g = await T(page, 'gorunum');
    assert.match(g.harfSinifi, /\bdogru\b/);
    assert.equal(g.hucreler.map(h => h.c).join(''), w, 'Kutular kelimenin tamamını gösterir');
    const renk = await page.evaluate(() => {
      const ornek = document.createElement('span');
      ornek.style.cssText = 'background:var(--ok-soft);color:var(--ok)';
      document.body.appendChild(ornek);
      const b = getComputedStyle(ornek), h = getComputedStyle(document.querySelector('#oyunHarfler .harf'));
      const r = {beklenen: [b.backgroundColor, b.color], gorulen: [h.backgroundColor, h.color]};
      ornek.remove();
      return r;
    });
    assert.deepEqual(renk.gorulen, renk.beklenen, 'Kutular yeşil (ok tonları)');
    const kayit = await T(page, 'kayit', w), bugun = await T(page, 'bugun');
    assert.deepEqual(kayit, {k: 1, g: bugun + 1, c: bugun}, 'Il.dogru kaydı: 1. kutu, yarın');
    assert.deepEqual(await T(page, 'bugunku'), {t: once.t + 1, d: once.d + 1, y: once.y + 1}, 'Günlük sayaçlar: cevap, doğru, yeni');
    assert.deepEqual(g.bilinen, [w + ' · 1. kutu'], 'Oturum listesi kelimeyi yeni kutusuyla gösterir');
    assert.equal(await page.locator('#oyunBilinen li b[lang="en"]').innerText(), w);
    assert.deepEqual(g.tekrar, []);
    assert.equal(g.sayim, 'Bu oturum: ✓ 1 bildin · 💡 0 ipuçlu · ✗ 0 bilemedin');
    assert.match(g.gunluk, /^Bugün açılan yeni kelime: 1 /);
    const kullanim = await T(page, 'kullanim');
    if (kullanim) assert.deepEqual(kullanim, {'oyun-cevap': 1}, 'Kullanım sayacı: yazılan cevap bir kez');
    assert.equal(g.kutu, '1. kutu');
    assert.equal(g.gonder, 'Sonraki kelime →');
    assert.deepEqual([g.harfKapali, g.pasKapali], [true, true], 'Biten kelimede ipucu ve bırak düğmeleri kapalı');
    assert.equal(g.sonuc, true, 'Sonuç bölümü açıldı');
    assert.ok(g.ornek >= 1, 'Örnek cümle var');
    const anlam = await T(page, 'anlam', w, false, false);
    assert.equal(anlam.gorulen, anlam.beklenen, 'Cevaptan sonra anlam maskesiz');
    assert.equal(g.odak, 'oyunGirdi', 'Odak girdide kaldı');
    assert.deepEqual(await T(page, 'duyuruSizinti', w), [], 'Cevap duyuru bölgesine yazılmaz (sonucu durum satırı okur)');
    // Dinle: cevaptan sonra görünür, kelimeyi İngilizce okutur, odağı girdiye geri verir.
    await page.evaluate(() => {
      window.__okunan = [];
      // rate 32 bitlik kayan sayıdır (0,9 → 0,8999999761…): iki haneye yuvarlanır.
      if (window.speechSynthesis) window.speechSynthesis.speak = soz => { window.__okunan.push([soz.text, soz.lang, Math.round(soz.rate * 100) / 100]); };
    });
    if (await page.evaluate(() => 'speechSynthesis' in window)) {
      await page.locator('#oyunDinle').click();
      assert.deepEqual(await page.evaluate(() => window.__okunan), [[w, 'en-GB', 0.9]], 'Dinle kelimeyi en-GB ve 0,9 hızla okutur');
      assert.equal((await T(page, 'gorunum')).odak, 'oyunGirdi', 'Dinle sonrası odak girdide');
    } else {
      assert.equal(await page.locator('#oyunDinle').isVisible(), false, 'Ses desteği yoksa düğme gizli');
    }
    // Biten kelimede yazılan yok sayılır.
    await page.keyboard.type('abc');
    g = await T(page, 'gorunum');
    assert.equal(g.deger, '');
    assert.equal(g.hucreler.map(h => h.c).join(''), w);
    // Enter: sonraki kelime; odak girdide.
    await page.keyboard.press('Enter');
    await kelimeBekle(page, w2);
    g = await T(page, 'gorunum');
    assert.equal(g.odak, 'oyunGirdi', 'Sonraki kelimede odak girdide');
    assert.equal(g.durum, ''); assert.equal(g.sonuc, false); assert.equal(g.gonder, 'Kontrol et');
    assert.equal(g.seviye, 'Seviye 1 · harflerin %50\'si açık');
    assert.equal((await T(page, 'anlam', w2, true, false)).ayni, true, 'Yeni kelimenin anlamı');
    assert.deepEqual(await T(page, 'sizinti', w2), [], 'Yeni kartta cevap yok');
    // "Sonraki kelime" duyurusu yalnız yeni soruyu okur: sıra satırı eklenmez, önceki cevap da geçmez.
    const soru = await T(page, 'soru', w2, false);
    await duyuruBekle(page, soru);
    assert.ok(soru.startsWith('Yeni kelime: ') && soru.endsWith(g.tarif), 'Duyuru yeni soruyla başlar, harf düzeniyle biter: ' + soru);
    assert.equal(soru.includes(g.siraMetni), false, 'Sonraki kelimede sıra satırı okunmaz');
    assert.deepEqual(await T(page, 'duyuruSizinti', w2), [], 'Duyuruda yeni cevap yok');
    assert.deepEqual(await T(page, 'duyuruSizinti', w), [], 'Duyuruda önceki cevap da yok');
    // Yenilemeden sonra yanıtlanan kelime geri gelmez.
    await page.reload(); await hazir(page);
    assert.equal((await T(page, 'sira', 'sira', 2000)).includes(w), false);
    await kelimeBekle(page, w2);
    assert.equal((await T(page, 'gorunum')).sayim, 'Bu oturum: ✓ 0 bildin · 💡 0 ipuçlu · ✗ 0 bilemedin', 'Oturum sayımı sayfa ömrüyle sınırlı');
  });

  /* ---------- 3) Yanlış deneme, sonra doğru: ipucuyla ---------- */
  senaryo('Yanlış deneme: doğru harfler kilitlenir; sonra doğru = ipucuyla (d artmaz)', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    await enAzBosluk(page, 2);
    const [w] = await T(page, 'sira');
    await kelimeBekle(page, w);
    const once = await T(page, 'bugunku');
    const e = await T(page, 'eksik', w);
    assert.ok(e.length >= 2, 'Düzenek: en az iki boşluk gerekli (' + w + ', ' + e.length + ' boşluk)');
    await odakla(page);
    // Eksik harfle Enter: ileti çıkar, deneme harcanmaz (aşağıda kalan hak yine 2), hata işareti konmaz.
    await page.keyboard.type(e[0]);
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Önce bütün boşlukları doldur.');
    assert.equal((await T(page, 'gorunum')).gecersiz, null, 'Eksik harfle Enter hata işareti koymaz');
    await page.keyboard.type(yanlisHarfler(e.slice(1)));
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Olmadı. Doğru harfler yerinde kaldı; kalan deneme hakkı: 2.');
    let g = await T(page, 'gorunum');
    const bosluklar = g.hucreler.map((h, i) => i).filter(i => !g.hucreler[i].s.includes('sabit'));
    assert.equal(g.hucreler[bosluklar[0]].s, 'bulundu', 'Doğru yazılan harf kilitlendi');
    assert.equal(g.hucreler[bosluklar[0]].c, w[bosluklar[0]]);
    bosluklar.slice(1).forEach(i => { assert.match(g.hucreler[i].s, /^bos/); assert.equal(g.hucreler[i].c, '', 'Yanlış harf silindi'); });
    assert.equal(g.deger, ''); assert.equal(g.azami, String(e.length - 1));
    assert.equal(g.gecersiz, 'true'); assert.match(g.harfSinifi, /\byanlis\b/);
    assert.equal(g.odak, 'oyunGirdi');
    assert.equal(await T(page, 'kayit', w), null, 'Yanlış deneme ilerleme yazmaz');
    // Mod değişip dönünce deneme hakkı tazelenmez (öğrenilenler boş, kart gizlenir).
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    // Odak mod düğmesinde kaldığı için boş durumun metni duyurulur.
    await duyuruBekle(page, (await T(page, 'gorunum')).bosMetin);
    await page.locator('.oyun-mod [data-mod="sira"]').click();
    await kelimeBekle(page, w, false);
    await durumBekle(page, 'Kaldığın yerden devam: 2 deneme hakkın kaldı.');
    g = await T(page, 'gorunum');
    assert.equal(g.hucreler[bosluklar[0]].s, 'bulundu', 'Kilitli harf mod değişiminde korunur');
    // Mod değişiminin duyurusu sıra satırıyla başlar; kilitlenen harf açıklamada okunur, kalanı "boş".
    await duyuruBekle(page, await T(page, 'soru', w, true));
    assert.ok(g.siraMetni.startsWith('Sırada ') && (await T(page, 'gorunum')).duyuru.startsWith(g.siraMetni + ' Yeni kelime: '), 'Mod değişince sıra satırı da okunur');
    assert.deepEqual(await T(page, 'duyuruSizinti', w), [], 'Yarım kelimenin duyurusunda cevap yok');
    // Kalan harfler doğru: ipucuyla.
    await page.locator('#oyunGirdi').focus();
    await page.keyboard.type(e[1]);
    g = await T(page, 'gorunum');
    assert.equal(g.gecersiz, null, 'İlk tuşta hata işareti kalkar'); assert.doesNotMatch(g.harfSinifi, /yanlis/);
    await page.keyboard.type(e.slice(2));
    await page.keyboard.press('Enter');
    // İpucu kullanılmadı, ikinci denemede bilindi; hiç çalışılmamış kelime 1. kutuya girer.
    await durumBekle(page, 'Doğru, ama ilk denemede değil; kelime 1. kutuya girdi.');
    await kutuBekle(page, w, 1);
    const sonra = await T(page, 'bugunku');
    assert.equal(sonra.t, once.t + 1, 'Cevap sayıldı');
    assert.equal(sonra.d, once.d, 'İkinci denemede bilinen kelime "doğru" sayılmaz');
    g = await T(page, 'gorunum');
    assert.match(g.harfSinifi, /\bdogru\b/);
    assert.deepEqual(g.bilinen, []);
    assert.equal(g.tekrar.length, 1); assert.ok(g.tekrar[0].includes(w) && g.tekrar[0].includes('1. kutu'));
    assert.equal(g.sayim, 'Bu oturum: ✓ 0 bildin · 💡 1 ipuçlu · ✗ 0 bilemedin');
  });

  /* ---------- 4) Üç yanlış ve "Bilemedim, göster" ---------- */
  senaryo('Üç yanlış deneme kelimeyi açar; "Bilemedim, göster" aynı sonucu verir', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    const [w, w2] = await T(page, 'sira');
    await kelimeBekle(page, w);
    const once = await T(page, 'bugunku'), bugun = await T(page, 'bugun');
    const e = await T(page, 'eksik', w);
    await odakla(page);
    for (const kalan of [2, 1]) {
      await page.keyboard.type(yanlisHarfler(e));
      await page.keyboard.press('Enter');
      // Hiçbir harf tutmadı: "doğru harfler yerinde kaldı" denmez.
      await durumBekle(page, 'Olmadı; kalan deneme hakkı: ' + kalan + '.');
      const ara = await T(page, 'gorunum');
      assert.equal(ara.hucreler.filter(h => h.s === 'bulundu').length, 0, 'Hiçbir harf kilitlenmedi');
      assert.equal(ara.azami, String(e.length), 'Boşluk sayısı aynı');
    }
    await page.keyboard.type(yanlisHarfler(e));
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Cevap: ' + w + '. Kelime 1. kutuda; yarın tekrar gelecek.');
    await kutuBekle(page, w, 1);
    let g = await T(page, 'gorunum');
    assert.match(g.harfSinifi, /\bacildi\b/);
    assert.equal(g.hucreler.map(h => h.c).join(''), w, 'Kelime açıldı');
    assert.equal(g.hucreler.filter(h => h.s.startsWith('bos')).length, e.length, 'Bulunamayan harfler ayrı gösterilir');
    assert.deepEqual(await T(page, 'kayit', w), {k: 1, g: bugun + 1, c: bugun}, 'Il.yanlis kaydı: 1. kutu, yarın');
    assert.deepEqual(await T(page, 'bugunku'), {t: once.t + 1, d: once.d, y: once.y + 1});
    assert.equal(g.sonuc, true); assert.equal(g.gonder, 'Sonraki kelime →');
    assert.equal(await page.locator('#oyunDurum b[lang="en"]').innerText(), w, 'Cevap İngilizce olarak işaretli');
    // Açılan kelimede bulunamayan kutular "boş" kalır: yazılanın yok sayılması yalnız burada sınanabilir.
    await page.keyboard.type('abc');
    assert.equal((await T(page, 'gorunum')).deger, '', 'Açılan kelimede yazılan yok sayılır');
    await page.keyboard.press('Enter');
    await kelimeBekle(page, w2);
    await page.locator('#oyunPas').click();
    await durumBekle(page, 'Cevap: ' + w2 + '. Kelime 1. kutuda; yarın tekrar gelecek.');
    await kutuBekle(page, w2, 1);
    g = await T(page, 'gorunum');
    assert.equal(g.odak, 'oyunGirdi', 'Düğmeden sonra odak girdiye döner');
    assert.match(g.harfSinifi, /\bacildi\b/);
    assert.deepEqual(await T(page, 'kayit', w2), {k: 1, g: bugun + 1, c: bugun});
    assert.deepEqual(await T(page, 'bugunku'), {t: once.t + 2, d: once.d, y: once.y + 2});
    assert.equal(g.sayim, 'Bu oturum: ✓ 0 bildin · 💡 0 ipuçlu · ✗ 2 bilemedin');
    assert.equal(g.tekrar.length, 2);
  });

  /* ---------- 5) Bir harf aç ---------- */
  senaryo('"Bir harf aç": bir harf daha açılır, yazılanlar kalır, tek boşlukta kapanır, sonuç ipucuyla', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    // En az üç boşluklu kelimeye gelene kadar geç (bugünkü ilk kelime zaten uygundur).
    let w, e;
    for (let i = 0; i < 8; i++) {
      [w] = await T(page, 'sira');
      await kelimeBekle(page, w);
      e = await T(page, 'eksik', w);
      if (e.length >= 3) break;
      await page.locator('#oyunPas').click();
      await kutuBekle(page, w, 1);
      await page.locator('#oyunGonder').click();
    }
    assert.ok(e.length >= 3, 'Düzenek: üç boşluklu kelime bulunamadı');
    const once = await T(page, 'bugunku');
    await odakla(page);
    // İlk boşluk doğru, ikinci yanlış yazılı: ikinci açılır, ilk yazılan kalır.
    await page.keyboard.type(e[0] + yanlisHarfler(e[1]));
    await page.locator('#oyunHarf').click();
    let g = await T(page, 'gorunum');
    const bosluk = g.hucreler.map((h, i) => i).filter(i => !g.hucreler[i].s.includes('sabit'));
    assert.equal(g.hucreler[bosluk[1]].s, 'ipucu', 'Yanlış yazılan ilk boşluk açıldı');
    assert.equal(g.hucreler[bosluk[1]].c, w[bosluk[1]]);
    assert.equal(g.deger, e[0], 'Önce yazılan doğru harf yerinde');
    assert.equal(g.hucreler[bosluk[0]].c, e[0]);
    assert.equal(g.azami, String(e.length - 1));
    assert.equal(g.odak, 'oyunGirdi');
    assert.equal(g.harfKapali, e.length - 1 < 2);
    // Hiç çalışılmamış kelimede ipucu: doğru bilinirse kelime 1. kutuya girer.
    await durumBekle(page, harfSirasi(w, bosluk[1]) + '. harf açıldı: ' + w[bosluk[1]] + '. Doğru bilirsen kelime 1. kutuya girer.');
    assert.equal(await T(page, 'kayit', w), null, 'İpucu ilerleme yazmaz');
    // Tek boşluk kalana kadar aç.
    for (let kalan = e.length - 1; kalan > 1; kalan--) await page.locator('#oyunHarf').click();
    g = await T(page, 'gorunum');
    assert.equal(g.hucreler.filter(h => h.s.startsWith('bos')).length, 1);
    assert.equal(g.harfKapali, true, 'Tek boşluk kalınca düğme kapalı');
    assert.equal(g.azami, '1');
    const sonHarf = (await T(page, 'eksik', w));
    await page.locator('#oyunGirdi').fill('');
    await page.keyboard.type(sonHarf);
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Doğru, ama ipucuyla; kelime 1. kutuya girdi.');
    await kutuBekle(page, w, 1);
    const sonra = await T(page, 'bugunku');
    assert.deepEqual([sonra.t, sonra.d], [once.t + 1, once.d], 'İpucuyla bilinen kelime "doğru" sayılmaz');
    g = await T(page, 'gorunum');
    assert.match(g.sayim, /💡 1 ipuçlu/);
    // 1. kutuya giren ipuçlu kelime yarın tekrar gelir: "Tekrar gelecekler"de, 💡 işaretiyle.
    assert.deepEqual(g.bilinen, []);
    assert.equal(g.tekrar[0], '💡 ipuçlu: ' + w + ' · 1. kutu');
    const kullanim = await T(page, 'kullanim');
    if (kullanim) assert.equal(kullanim['oyun-harf'], 1, 'Harf açma kelime başına bir kez sayılır (' + (e.length - 1) + ' kez basıldı)');
  });

  /* ---------- 6) Seviyeler ve öğrenilenler modu ---------- */
  senaryo('Seviyeler: kutu = seviye (%30, %20), vadesi gelen önce, ipucuyla kutu aynı kalır; öğrenilenler harfsiz, aynı gün yeniden sorulmaz', async () => {
    const context = await yeni();
    const page = await context.newPage();
    await page.clock.setFixedTime(GUN(0));
    await ac(page, base);
    const f = await page.evaluate(() => {
      const Il = window.YDS.Ilerleme, havuz = window.__oyun.havuz([2]);
      // Dizinde ilk sırada olmayan, en az beş harfli kelimeler: A 3. kutuya, B 2. kutuya çıkar.
      const uzunlar = havuz.slice(8).filter(d => /^[a-z]{5,}$/.test(d.e));
      const A = uzunlar[0].e, B = uzunlar[1].e, Z1 = uzunlar[5].e, Z2 = uzunlar[6].e;
      for (let i = 0; i < 3; i++) Il.dogru(A, 'kelime');
      for (let i = 0; i < 2; i++) Il.dogru(B, 'kelime');
      Il.zatenBiliyorum(Z1, 'kelime'); Il.zatenBiliyorum(Z2, 'kelime');
      return {A, B, Z1, Z2, ilk: havuz[0].e, oynanan: havuz.length, bugun: Il.bugun(),
        a: Il.kayit(A, 'kelime'), b: Il.kayit(B, 'kelime')};
    });
    assert.deepEqual([f.a.k, f.a.g, f.b.k, f.b.g], [3, f.bugun + 7, 2, f.bugun + 3], 'Düzenek: 3. kutu 7 gün, 2. kutu 3 gün sonra');
    await page.clock.setFixedTime(GUN(7));
    await page.reload(); await hazir(page);
    assert.equal(await T(page, 'bugun'), f.bugun + 7, 'Saat yedi gün ileride');
    const acikSayisi = (w, kutu) => page.evaluate(([w, kutu]) => { const O = window.YDS.OyunHesap; return O.acikSayisi(O.harfSayisi(w), kutu); }, [w, kutu]);
    // En çok geciken önce: B (vadesi dört gün önce doldu), sonra A; ikisi de yeni kelimelerden önce.
    await kelimeBekle(page, f.B);
    let g = await T(page, 'gorunum');
    assert.equal(g.seviye, 'Seviye 3 · harflerin %30\'u açık');
    assert.equal(g.kutu, '2. kutu · tekrar zamanı');
    assert.equal(g.hucreler.filter(h => h.s.includes('sabit')).length, await acikSayisi(f.B, 2), '%30 açık harf sayısı');
    assert.equal(g.siraMetni, 'Sırada ' + (f.oynanan - 2) + ' kelime: 2 tekrar + ' + (f.oynanan - 4) + ' yeni.');
    assert.deepEqual(g.modlar, ['Sıradakiler (' + (f.oynanan - 2) + ')', 'Yalnız yeni kelimeler (' + (f.oynanan - 4) + ')', 'Öğrenilenler · harfsiz (2)']);
    // "Yalnız yeni kelimeler" vadesi gelen kelimeyi sormaz.
    await page.locator('.oyun-mod [data-mod="yeni"]').click();
    await kelimeBekle(page, f.ilk);
    assert.equal((await T(page, 'gorunum')).siraMetni, 'Sırada ' + (f.oynanan - 4) + ' yeni kelime.');
    // Mod değişimi duyurulur: yeni sıra satırı ve ilk soru.
    await duyuruBekle(page, 'Sırada ' + (f.oynanan - 4) + ' yeni kelime. ' + await T(page, 'soru', f.ilk, false));
    await page.locator('.oyun-mod [data-mod="sira"]').click();
    await kelimeBekle(page, f.B);
    // İpucuyla bilinen kelime kutusunda kalır (Il.ipucuyla), bir alt kutuya düşmez.
    const ilkBos = (await T(page, 'gorunum')).hucreler.findIndex(h => h.s.startsWith('bos'));
    await page.locator('#oyunHarf').click();
    await durumBekle(page, harfSirasi(f.B, ilkBos) + '. harf açıldı: ' + f.B[ilkBos] + '. Doğru bilirsen kelime aynı kutuda kalır.');
    await coz(page, f.B);
    await durumBekle(page, 'Doğru, ama ipucuyla; kelime 2. kutuda kalıyor.');
    await page.waitForFunction(([w, gun]) => window.__oyun.kayit(w).c === gun, [f.B, f.bugun + 7]);
    assert.deepEqual(await T(page, 'kayit', f.B), {k: 2, g: f.bugun + 10, c: f.bugun + 7}, 'Il.ipucuyla kaydı: aynı kutu, üç gün sonra');
    await page.keyboard.press('Enter');
    await kelimeBekle(page, f.A);
    g = await T(page, 'gorunum');
    assert.equal(g.seviye, 'Seviye 4 · harflerin %20\'si açık');
    assert.equal(g.kutu, '3. kutu · tekrar zamanı');
    assert.equal(g.hucreler.filter(h => h.s.includes('sabit')).length, await acikSayisi(f.A, 3), '%20 açık harf sayısı');
    assert.equal(g.siraMetni, 'Sırada ' + (f.oynanan - 3) + ' kelime: 1 tekrar + ' + (f.oynanan - 4) + ' yeni. 1 kelime tekrar gününü bekliyor.',
      'Yanıtlanan kelime tekrar gününü bekleyenlere geçti');
    await coz(page, f.A);
    await durumBekle(page, 'Bildiniz! Kelime 4. kutuya çıktı; bir dahaki sefere harflerin %10\'u açık gelecek.');
    await kutuBekle(page, f.A, 4);
    // Vadesi gelen kelime, dizinde ondan önce duran yeni kelimelerden önce soruldu.
    await page.keyboard.press('Enter');
    await kelimeBekle(page, f.ilk);
    g = await T(page, 'gorunum');
    assert.equal(g.seviye, 'Seviye 1 · harflerin %50\'si açık');
    assert.equal(g.siraMetni, 'Sırada ' + (f.oynanan - 4) + ' kelime: 0 tekrar + ' + (f.oynanan - 4) + ' yeni. 2 kelime tekrar gününü bekliyor.');
    // Öğrenilenler: harfsiz.
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    await kelimeBekle(page, f.Z1);
    g = await T(page, 'gorunum');
    assert.equal(g.seviye, 'Seviye 6 · harf yok');
    assert.equal(g.kutu, 'öğrenildi');
    assert.equal(g.hucreler.filter(h => !h.s.startsWith('bos')).length, 0, 'Hiç açık harf yok');
    assert.equal(g.hucreler.map(h => h.c).join(''), '');
    assert.equal(g.azami, String(f.Z1.length));
    assert.equal(g.siraMetni, 'Sırada 2 öğrenilmiş kelime; hepsi harfsiz sorulur.');
    assert.equal(await page.locator('.oyun-mod [data-mod="ogrenilen"]').getAttribute('aria-pressed'), 'true');
    // Bilemedim: 5. kutudan 4'e düşer.
    await page.locator('#oyunPas').click();
    await durumBekle(page, 'Cevap: ' + f.Z1 + '. Kelime 4. kutuda; yarın tekrar gelecek.');
    await kutuBekle(page, f.Z1, 4);
    assert.deepEqual(await T(page, 'kayit', f.Z1), {k: 4, g: f.bugun + 8, c: f.bugun + 7});
    await page.keyboard.press('Enter');
    await kelimeBekle(page, f.Z2);
    await page.keyboard.type(f.Z2);
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Bildiniz! Harfsiz de doğru; kelime öğrenilenlerde kalıyor.');
    await page.waitForFunction(([w, gun]) => window.__oyun.kayit(w).c === gun, [f.Z2, f.bugun + 7]);
    assert.equal((await T(page, 'kayit', f.Z2)).k, 5);
    assert.deepEqual((await T(page, 'gorunum')).bilinen, [f.Z2 + ' · öğrenildi', f.A + ' · 4. kutu']);
    // Sıra bitti: boş durum, odak oraya.
    await page.keyboard.press('Enter');
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    g = await T(page, 'gorunum');
    assert.equal(g.kart, false); assert.equal(g.odak, 'oyunBos');
    assert.match(g.bosMetin, /bugün çalıştın/);
    assert.equal(g.modlar[2], 'Öğrenilenler · harfsiz (0)');
    // Bugün yanıtlanan 5. kutu kelimesi yeniden kurulan sırada da yok.
    await page.locator('.oyun-mod [data-mod="sira"]').click();
    await kelimeBekle(page, f.ilk);
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    await page.reload(); await hazir(page);
    assert.deepEqual(await T(page, 'sira', 'ogrenilen'), [], 'Yenilemeden sonra da sorulmaz');
    assert.equal((await T(page, 'gorunum')).modlar[2], 'Öğrenilenler · harfsiz (0)');
    // Ertesi gün: öğrenilen kelime yeniden sorulabilir; düşen kelime 4. kutudan (Seviye 5) gelir.
    await page.clock.setFixedTime(GUN(8));
    await page.reload(); await hazir(page);
    await kelimeBekle(page, f.Z1);
    g = await T(page, 'gorunum');
    assert.equal(g.seviye, 'Seviye 5 · harflerin %10\'u açık');
    assert.equal(g.kutu, '4. kutu · tekrar zamanı');
    assert.equal(g.modlar[2], 'Öğrenilenler · harfsiz (1)');
    assert.deepEqual(await T(page, 'sira', 'ogrenilen'), [f.Z2]);
    // 4. kutudan ilk denemede bilinen kelime öğrenilir.
    await coz(page, f.Z1);
    await durumBekle(page, 'Bildiniz! Kelime öğrenildi (5. kutu). Bundan sonra “Öğrenilenler · harfsiz” turunda sorulur.');
    await kutuBekle(page, f.Z1, 5);
    // Sayfa açıkken gün dönerse "Sonraki kelime" sırayı yeniden kurar: B'nin vadesi (10. gün) gelmiştir.
    await page.clock.setFixedTime(GUN(10));
    await page.keyboard.press('Enter');
    await kelimeBekle(page, f.B);
    assert.equal((await T(page, 'gorunum')).kutu, '2. kutu · tekrar zamanı');
  });

  /* ---------- 7) Yazım sadeleştirme, tireli ve çok sözcüklü başlık ---------- */
  senaryo('Yazım: İ/I/ı, rakam, "/", boşluk, tire elenir; tireli, çok sözcüklü ve en uzun başlık yalnız harfle çözülür, dar ekrana sığar', async () => {
    const context = await yeni();
    const page = await context.newPage();
    await page.clock.setFixedTime(GUN(0));
    await ac(page, base);
    const f = await page.evaluate(() => {
      const Y = window.YDS, O = Y.OyunHesap, Il = Y.Ilerleme;
      const oynanan = Y.Veri.dizin.filter(d => O.oynanabilir(d));
      const yarin = Il.bugun() + 1;
      // 1. kutuda yarın boş kalacak harfleri arasında "i" olan, en az üç boşluklu Çekirdek kelimesi.
      const bosHarfler = w => { const acik = O.acikKonumlar(w, 1, yarin); return [...w].filter((c, i) => !acik.includes(i)).join(''); };
      const I = oynanan.find(d => d.k === 2 && /^[a-z]+$/.test(d.e) && bosHarfler(d.e).length >= 3 && bosHarfler(d.e).includes('i')).e;
      const tireli = oynanan.find(d => d.k === 6 && d.e.includes('-'));
      const bosluklu = oynanan.find(d => d.e.includes(' '));
      // Seçilen katmanlardaki en uzun başlık (kutu satırı birkaç satıra bölünür).
      const katmanlar = [...new Set([2, tireli.k, bosluklu.k])].sort();
      const uzun = oynanan.filter(d => katmanlar.includes(d.k) && d.e !== tireli.e && d.e !== bosluklu.e)
        .reduce((a, d) => (d.e.length > a.e.length ? d : a));
      [I, tireli.e, bosluklu.e, uzun.e].forEach(w => Il.yanlis(w, 'kelime'));
      Y.Depo.yaz('yds-katmanlar', katmanlar);
      return {I, tireli: tireli.e, bosluklu: bosluklu.e, uzun: uzun.e};
    });
    await page.clock.setFixedTime(GUN(1));
    await page.reload(); await hazir(page);
    const sira = await T(page, 'sira', 'sira', 4);
    assert.deepEqual([...sira].sort(), [f.I, f.tireli, f.bosluklu, f.uzun].sort(), 'Düzenek: vadesi gelen dört kelime sıranın başında');
    for (const w of sira) {
      await kelimeBekle(page, w);
      let g = await T(page, 'gorunum');
      assert.equal(g.seviye, 'Seviye 2 · harflerin %40\'ı açık');
      // Dar ekranda kutular kartın içinde kalır, sayfa yatay kaymaz.
      for (const en of [320, 375]) {
        await page.setViewportSize({width: en, height: 812});
        const sigma = await page.evaluate(() => {
          const alan = document.querySelector('.harf-alan').getBoundingClientRect();
          const disarida = [...document.querySelectorAll('#oyunHarfler .harf')].map(h => h.getBoundingClientRect())
            .filter(r => r.left < alan.left - 0.5 || r.right > alan.right + 0.5 || r.width < 12).length;
          return {disarida, ekran: innerWidth, kaydirma: document.documentElement.scrollWidth};
        });
        assert.deepEqual([sigma.disarida, sigma.kaydirma <= sigma.ekran + 1], [0, true], w.length + ' karakterli başlık ' + en + ' px: ' + JSON.stringify(sigma));
      }
      await page.setViewportSize({width: 1280, height: 900});
      const e = await T(page, 'eksik', w);
      assert.equal(g.azami, String(e.length), 'maxlength yalnız yazılacak harfleri sayar');
      await page.locator('#oyunGirdi').focus();
      if (w === f.I) {
        // Türkçe klavye harfleri tek "i" olur; rakam ve noktalama girmez; fazlası alınmaz.
        await page.keyboard.type('1/ -9.');
        assert.equal((await T(page, 'gorunum')).deger, '');
        await page.keyboard.type('Iıİ');
        assert.equal((await T(page, 'gorunum')).deger, 'iii');
        for (let i = 0; i < 3; i++) await page.keyboard.press('Backspace');
        const gurultulu = [...e].map((c, i) => (c === 'i' ? 'İ' : c.toUpperCase()) + ['/', ' ', '3', '-'][i % 4]).join('');
        await page.keyboard.type(gurultulu + 'zz');
        g = await T(page, 'gorunum');
        assert.equal(g.deger, e, 'Girdi sadeleşti: ' + JSON.stringify(gurultulu) + ' → ' + JSON.stringify(g.deger));
      } else {
        const ayrac = w.includes('-') ? '-' : (w.includes(' ') ? ' ' : '');
        [...w].forEach((c, i) => {
          if (c !== '-' && c !== ' ') { assert.doesNotMatch(g.hucreler[i].s, /ayrac/); return; }
          assert.equal(g.hucreler[i].s, 'ayrac', 'Ayraç sabit kutudur');
          assert.equal(g.hucreler[i].c, c === ' ' ? BOSLUK : '-');
        });
        // Boşluk ayracı "sözcük arası" diye okunur: "boşluk", yazılacak hücrenin adı olan "boş" ile karışırdı.
        if (ayrac) assert.ok(g.tarif.includes(ayrac === '-' ? ', tire, ' : ', sözcük arası, ') && !g.tarif.includes('boşluk'), 'Açıklama ayracı adıyla okur: ' + g.tarif);
        assert.doesNotMatch(e, /[- ]/);
        // Ayraç yazılsa da yok sayılır.
        await page.keyboard.type(e.slice(0, 1) + (ayrac || '-') + e.slice(1));
        assert.equal((await T(page, 'gorunum')).deger, e);
      }
      await page.keyboard.press('Enter');
      await durumBekle(page, 'Bildiniz! Kelime 2. kutuya çıktı; bir dahaki sefere harflerin %30\'u açık gelecek.');
      await kutuBekle(page, w, 2);
      assert.equal((await T(page, 'gorunum')).hucreler.map(h => h.c).join('').split(BOSLUK).join(' '), w);
      await page.keyboard.press('Enter');
    }
    return 'kelimeler: ' + f.I.length + ' harfli, tireli ' + f.tireli.length + ', boşluklu ' + f.bosluklu.length + ', en uzun ' + f.uzun.length + ' karakter';
  });

  /* ---------- 8) Katman seçimi ve inmeyen katman ---------- */
  senaryo('Katman: seçim yds-katmanlar\'a yazılır, sıra yeniden kurulur, boş seçim hatasız; inmeyen katmanda oyun sürer', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    const sayi = await page.evaluate(() => {
      const s = window.YDS.Veri.katmanSayilari(), T = window.__oyun;
      return {s2: s[2], s3: s[3], o2: T.havuz([2]).length, o3: T.havuz([3]).length, ilk3: T.havuz([3])[0].e};
    });
    const [w] = await T(page, 'sira');
    const depo = () => page.evaluate(() => window.YDS.Depo.oku('yds-katmanlar', null));
    const katman = k => page.locator('#katmanlar .katman[data-k="' + k + '"]');
    await katman(3).click();
    await page.waitForFunction(() => window.YDS.Veri.katmanYukluMu(3));
    await hazir(page);
    assert.deepEqual(await depo(), [2, 3], 'Seçim ortak anahtara yazıldı');
    assert.deepEqual(await T(page, 'secili'), [2, 3]);
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-k')), '3', 'Odak basılan katman düğmesinde kalır');
    let g = await T(page, 'gorunum');
    assert.equal(g.katmanBilgi, (sayi.s2 + sayi.s3) + ' kelime seçili · oyunda ' + (sayi.o2 + sayi.o3));
    assert.equal(g.modlar[0], 'Sıradakiler (' + (sayi.o2 + sayi.o3) + ')');
    await kelimeBekle(page, w);
    // Katman değişimi duyurulur: yeni sıra satırı ve soru.
    assert.equal(g.siraMetni, 'Sırada ' + (sayi.o2 + sayi.o3) + ' kelime: 0 tekrar + ' + (sayi.o2 + sayi.o3) + ' yeni.');
    await duyuruBekle(page, g.siraMetni + ' ' + await T(page, 'soru', w, false));
    // Çekirdek kapanınca sıra Orta'dan kurulur.
    await katman(2).click();
    await kelimeBekle(page, sayi.ilk3);
    assert.deepEqual(await depo(), [3]);
    assert.equal((await T(page, 'gorunum')).modlar[0], 'Sıradakiler (' + sayi.o3 + ')');
    // Yüklü katmanlar arasında geçişte yarım kelime ve yazılan harf korunur.
    await katman(2).click();
    await kelimeBekle(page, w);
    await page.locator('#oyunGirdi').focus();
    const e = await T(page, 'eksik', w);
    await page.keyboard.type(e[0]);
    await katman(3).click();
    await page.waitForFunction(() => window.__oyun.secili().join() === '2');
    assert.deepEqual(await depo(), [2]);
    g = await T(page, 'gorunum');
    assert.equal(g.deger, e[0], 'Aynı kelime sırada kaldıysa yazılan harf silinmez');
    assert.equal(await T(page, 'uyuyor', w, false), true);
    // Hiç katman yok: boş durum.
    await katman(2).click();
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    g = await T(page, 'gorunum');
    assert.deepEqual(await depo(), [], 'Boş seçim de yazılır');
    assert.equal(g.kart, false);
    assert.equal(g.bosMetin, 'Hiç katman seçili değil. Aşağıdan en az bir katman seç.', 'Boş seçim iletisi katman seçicinin yeni yerini söyler');
    assert.equal(g.katmanBilgi, 'Hiç katman seçili değil');
    assert.equal(g.siraMetni, 'Hiç katman seçili değil.');
    assert.deepEqual(g.modlar, ['Sıradakiler (0)', 'Yalnız yeni kelimeler (0)', 'Öğrenilenler · harfsiz (0)']);
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-k')), '2', 'Odak katman düğmesinde kalır');
    await duyuruBekle(page, g.bosMetin);
    await axeVeYerlesim(page, 'Katmansız boş durum');
    await katman(2).click();
    await kelimeBekle(page, w);

    // Katman dosyası inmiyor: dizindeki kısa anlamla oynanır, uyarı ve "Yeniden dene" çıkar.
    const cevrimdisi = await yeniSayfa();
    let engel = true;
    await cevrimdisi.route(KATMAN_DOSYASI, route => (engel ? route.abort() : route.continue()));
    await ac(cevrimdisi, base);
    const [k1, k2] = await T(cevrimdisi, 'sira');
    await kelimeBekle(cevrimdisi, k1);
    g = await T(cevrimdisi, 'gorunum');
    assert.equal(g.yukNotu, 'Anlam ayrıntıları yüklenemedi (çevrimdışı olabilirsin). Yeniden dene');
    let anlam = await T(cevrimdisi, 'anlam', k1, true, true);
    assert.equal(anlam.gorulen, anlam.beklenen, 'Dizindeki kısa anlam (maskeli)');
    assert.equal(anlam.yildiz, 0); assert.equal(anlam.tur, anlam.beklenenTur);
    await coz(cevrimdisi, k1);
    await durumBekle(cevrimdisi, 'Bildiniz! Kelime 1. kutuya çıktı; bir dahaki sefere harflerin %40\'ı açık gelecek.');
    await kutuBekle(cevrimdisi, k1, 1);
    g = await T(cevrimdisi, 'gorunum');
    assert.equal(g.ornek + g.kalip, 0, 'Katman yokken örnek cümle çizilemez');
    await cevrimdisi.keyboard.press('Enter');
    await kelimeBekle(cevrimdisi, k2);
    const e2 = await T(cevrimdisi, 'eksik', k2);
    await cevrimdisi.keyboard.type(e2[0]);
    // Hâlâ çevrimdışı: uyarı kalır, yazılan silinmez.
    const dustu = cevrimdisi.waitForEvent('requestfailed', r => KATMAN_DOSYASI.test(r.url()));
    await cevrimdisi.locator('#oyunYukDene').click();
    await dustu;
    await cevrimdisi.evaluate(() => new Promise(r => setTimeout(r, 0)));
    g = await T(cevrimdisi, 'gorunum');
    assert.ok(g.yukNotu, 'Başarısız yeniden denemede uyarı kalır'); assert.equal(g.deger, e2[0]);
    engel = false;
    await cevrimdisi.locator('#oyunYukDene').click();
    await cevrimdisi.locator('#oyunYuk').waitFor({state: 'hidden'});
    anlam = await T(cevrimdisi, 'anlam', k2, true, false);
    assert.equal(anlam.gorulen, anlam.beklenen, 'Katman inince anlam ayrıntılı hâle gelir');
    g = await T(cevrimdisi, 'gorunum');
    assert.equal(g.deger, e2[0], 'Yeniden deneme yazılanı silmez'); assert.equal(g.odak, 'oyunGirdi');
    await cevrimdisi.keyboard.type(e2.slice(1));
    await cevrimdisi.keyboard.press('Enter');
    await kutuBekle(cevrimdisi, k2, 1);
    assert.ok((await T(cevrimdisi, 'gorunum')).ornek >= 1, 'Katman inince örnek cümle gelir');

    // Katman dosyası yavaş: yüklenirken sayfa hatasız bekler, düğmeler zarar vermez.
    const yavas = await yeniSayfa();
    let birak;
    const kapi = new Promise(resolve => { birak = resolve; });
    await yavas.route(KATMAN_DOSYASI, async route => { await kapi; await route.continue(); });
    // Bekleyen katman betiği "load" olayını da bekletir; gezinme DOM hazır olunca döner.
    await yavas.goto(base + '/oyunlar.html', {waitUntil: 'domcontentloaded'});
    await yavas.waitForFunction(() => document.getElementById('oyunSira').textContent === 'Katmanlar yükleniyor…');
    await duyuruBekle(yavas, 'Katmanlar yükleniyor…');
    g = await T(yavas, 'gorunum');
    assert.deepEqual([g.kart, g.bos], [false, false], 'Yüklenirken kart da boş durum da gizli');
    await dortluDenetim(yavas, 'Yüklenirken');
    await yavas.locator('.oyun-mod [data-mod="yeni"]').click();
    await yavas.locator('#katmanlar .katman[data-k="3"]').click();
    await yavas.locator('#katmanlar .katman[data-k="3"]').click();
    await yavas.locator('.oyun-mod [data-mod="sira"]').click();
    assert.deepEqual(await yavas.evaluate(() => window.YDS.Depo.oku('yds-katmanlar', null)), [2]);
    assert.equal((await T(yavas, 'gorunum')).kart, false, 'Katman inmeden kelime gösterilmez');
    birak();
    await hazir(yavas);
    const [y1] = await T(yavas, 'sira');
    await kelimeBekle(yavas, y1);
    assert.equal((await T(yavas, 'anlam', y1, true, false)).ayni, true);

    // Eski seçim [2,6] (taşıma bayrağı yok) bu sayfada da bir kez [2,7]'ye taşınır; bozuk seçim süzülür.
    const eski = await yeniSayfa();
    await ac(eski, base);
    await eski.evaluate(() => { window.YDS.Depo.yaz('yds-katmanlar', [2, 6]); window.YDS.Depo.sil('yds-katman7'); });
    await eski.reload(); await hazir(eski);
    assert.deepEqual(await T(eski, 'secili'), [2, 7], 'Eski 6. katman seçimi 7\'ye taşındı');
    assert.deepEqual(await eski.evaluate(() => [window.YDS.Depo.oku('yds-katmanlar', null), window.YDS.Depo.oku('yds-katman7', null)]), [[2, 7], true]);
    await eski.evaluate(() => window.YDS.Depo.yaz('yds-katmanlar', [2, 2, 'x', 9, 2.5, 0]));
    await eski.reload(); await hazir(eski);
    g = await T(eski, 'gorunum');
    assert.deepEqual(await T(eski, 'secili'), [2]);
    assert.equal(g.yukNotu, null, 'Bozuk seçim katman yüklemeye çalışmaz');
    assert.equal(g.katmanBilgi, sayi.s2 + ' kelime seçili' + (sayi.o2 !== sayi.s2 ? ' · oyunda ' + sayi.o2 : ''), 'Yinelenen katman iki kez sayılmaz');
  });

  /* ---------- 9) Başka sekme ---------- */
  senaryo('Başka sekme: yanıtlanan kelime ikinci kez yazılmaz; dokunulmamış kelime ve katman seçimi yenilenir', async () => {
    const context = await yeni();
    const a = await context.newPage();
    await ac(a, base);
    const [w, w2, w3] = await T(a, 'sira');
    await kelimeBekle(a, w);
    await a.locator('#oyunGirdi').focus();
    const e = await T(a, 'eksik', w);
    await a.keyboard.type(e[0]);
    const b = await context.newPage();
    await ac(b, base);
    assert.equal(await b.evaluate(k => window.YDS.Ilerleme.dogru(k, 'kelime'), w), 1, 'Öbür sekme kelimeyi yanıtladı');
    await a.bringToFront();
    // Üzerinde çalışılan kelime yerinde kalır; girdi ve odak değişmez.
    await a.waitForTimeout(400);
    let g = await T(a, 'gorunum');
    assert.equal(g.deger, e[0]); assert.equal(g.odak, 'oyunGirdi');
    assert.equal(await T(a, 'uyuyor', w, false), true, 'Yarım kelime depolama olayıyla değişmez');
    await a.keyboard.type(e.slice(1));
    await a.keyboard.press('Enter');
    await durumBekle(a, BASKA_SEKME);
    await a.waitForTimeout(300);
    assert.equal((await T(a, 'kayit', w)).k, 1, 'Kelime ikinci kez yükseltilmedi');
    assert.deepEqual(await T(a, 'bugunku'), {t: 1, d: 1, y: 1}, 'Günlük sayaçta yalnız öbür sekmenin cevabı var');
    g = await T(a, 'gorunum');
    assert.equal(g.sayim, 'Bu oturum: ✓ 0 bildin · 💡 0 ipuçlu · ✗ 0 bilemedin', 'Yazılmayan cevap oturuma sayılmaz');
    assert.deepEqual(g.bilinen, []); assert.equal(g.kutu, '1. kutu');
    await a.keyboard.press('Enter');
    await kelimeBekle(a, w2);
    assert.equal((await T(a, 'gorunum')).odak, 'oyunGirdi');
    // Henüz dokunulmamış kelime öbür sekmede yanıtlanırsa sıradaki gelir; odak yerinde kalır.
    await b.evaluate(k => window.YDS.Ilerleme.dogru(k, 'kelime'), w2);
    await kelimeBekle(a, w3);
    g = await T(a, 'gorunum');
    assert.equal(g.odak, 'oyunGirdi', 'Depolama olayı odağı almaz'); assert.equal(g.deger, '');
    // Öbür sekmede değişen katman seçimi buraya da yansır.
    await b.evaluate(() => window.YDS.Depo.yaz('yds-katmanlar', [2, 3]));
    await a.waitForFunction(() => window.__oyun.secili().join() === '2,3' && window.YDS.Veri.katmanYukluMu(3) && /^Sıradakiler \(\d+\)$/.test(document.querySelector('.oyun-mod [data-mod="sira"]').textContent));
    const beklenen = await a.evaluate(() => window.__oyun.sira('sira', 100000).length);
    await a.waitForFunction(n => document.querySelector('.oyun-mod [data-mod="sira"]').textContent === 'Sıradakiler (' + n + ')', beklenen);
    await kelimeBekle(a, w3);
    assert.equal((await T(a, 'gorunum')).odak, 'oyunGirdi');
    // Öbür sekmenin yazımı bu sekmeye olay olarak hiç ulaşmasa da (ya da henüz ulaşmadıysa)
    // yazmadan önceki taze okuma onu görür.
    await a.evaluate(() => { window.__depolamaOlayiYok = true; });
    await b.evaluate(k => window.YDS.Ilerleme.dogru(k, 'kelime'), w3);
    await a.waitForTimeout(300);
    assert.equal(await T(a, 'kayit', w3), null, 'Düzenek: bu sekmenin bellekteki kopyası eski');
    await a.keyboard.type(await T(a, 'eksik', w3));
    await a.keyboard.press('Enter');
    await durumBekle(a, BASKA_SEKME);
    assert.equal(await a.evaluate(k => window.YDS.Depo.oku('yds-leitner', {})[window.YDS.Ilerleme.ilerlemeKimligi(k, 'kelime')].k, w3), 1,
      'Kelime yine tek kez yükseltildi');
    assert.equal((await T(a, 'gorunum')).sayim, 'Bu oturum: ✓ 0 bildin · 💡 0 ipuçlu · ✗ 0 bilemedin');
  });

  /* ---------- 10) Anlam maskesi ---------- */
  senaryo('Anlam maskesi: anlamda geçen başlık ve dil bilgisi notunun öznesi (düzensiz fiilin kökü de) cevaptan önce •••, sonra tam metin', async () => {
    const context = await yeni();
    const page = await context.newPage();
    await page.clock.setFixedTime(GUN(0));
    await ac(page, base);
    const f = await page.evaluate(() => {
      const Y = window.YDS, O = Y.OyunHesap, havuz = window.__oyun.havuz([2]);
      const anlamlar = d => Y.Veri.kayit(d.e).a.map(a => a.tr);
      const basta = (m, w) => new RegExp('(^|[^a-zçğıöşüâîû])' + w.toLowerCase()).test(m.toLowerCase());
      // Başlığın kendisi anlamda sözcük başında geçer ("(engage in)"): tam metinde başlık okunur.
      const baslik = havuz.find(d => /^[a-z]+$/.test(d.e) && anlamlar(d).some(m => basta(m, d.e) && !O.maskele(m, d.e).toLowerCase().includes(d.e.toLowerCase())));
      // Dil bilgisi notunun öznesi ("(require fiilinin geçmiş/V3 biçimi)"): başlık metinde aynen geçmez,
      // kökü geçer; cevaptan önce o da gizlenir. Kök başlığa benzesin benzemesin not kuralı gizler:
      //   benzer    kök, not olmadan parantez içinde yazılsa da gizlenir (kök/çekim kuralı): require → required
      //   kisa      üç harften kısa kök; kök/çekim kuralı bakmaz, yalnız not kuralı gizler: do → done
      //   duzensiz  dört harf ve uzun, başlığa benzemeyen kök (düzensiz fiil): hold → held
      const kok = m => (m.match(/([a-z]+) fiilinin/) || [])[1] || '';
      const benzer = (m, w) => O.maskele('(' + kok(m) + ')', w) !== '(' + kok(m) + ')';
      const turu = (m, w) => (benzer(m, w) ? 'benzer' : (kok(m).length <= 3 ? 'kisa' : 'duzensiz'));
      // Düzenek maskenin sonucuna göre değil, maskesiz metne göre seçilir: gizlenmeyen not burada elenmez,
      // aşağıdaki denetimde yakalanır.
      const notu = (d, tur) => anlamlar(d).find(m => kok(m) && !basta(m, d.e) && turu(m, d.e) === tur);
      const notlar = ['benzer', 'kisa', 'duzensiz'].map(tur => {
        const d = havuz.find(x => x !== baslik && notu(x, tur));
        return d ? {w: d.e, tur, not: notu(d, tur), kok: kok(notu(d, tur))} : null;
      });
      if (!baslik || notlar.includes(null) || new Set(notlar.map(n => n.w)).size !== notlar.length) return {eksik: [baslik ? null : 'başlık', ...notlar.map((n, i) => (n ? null : ['benzer', 'kisa', 'duzensiz'][i]))].filter(Boolean)};
      [baslik.e, ...notlar.map(n => n.w)].forEach(w => Y.Ilerleme.yanlis(w, 'kelime'));
      return {baslik: baslik.e, notlar};
    });
    assert.equal(f.eksik, undefined, 'Düzenek: Çekirdek katmanında şu türden oynanabilir kelime bulunamadı (ya da aynı kelime iki türe düştü): ' + (f.eksik || []).join(', ') +
      ' — başlık: anlamında başlığı geçen; benzer/kisa/duzensiz: "… fiilinin" notunun kökü başlığa benzeyen / üç harften kısa / benzemeyen');
    await page.clock.setFixedTime(GUN(1));
    await page.reload(); await hazir(page);
    const sira = await T(page, 'sira', 'sira', 4);
    assert.deepEqual([...sira].sort(), [f.baslik, ...f.notlar.map(n => n.w)].sort(), 'Düzenek: vadesi gelen dört kelime sıranın başında');
    for (const w of sira) {
      const notlu = f.notlar.find(n => n.w === w);
      await kelimeBekle(page, w);
      let anlam = await T(page, 'anlam', w, true, false);
      assert.equal(anlam.gorulen, anlam.beklenen);
      assert.ok(anlam.metin.includes('•••'), 'Maske görünür: ' + anlam.metin);
      assert.equal(anlam.metin.toLowerCase().includes(w.toLowerCase()), false, 'Anlamda cevap yok');
      if (notlu) {
        assert.ok(anlam.metin.includes('••• fiilinin '), notlu.tur + ': notun öznesi gizli: ' + anlam.metin);
        assert.equal(new RegExp('(^|[^a-z])' + notlu.kok + '($|[^a-z])').test(anlam.metin.toLowerCase()), false,
          notlu.tur + ': notun öznesi (' + notlu.kok + ') cevaptan önce okunmaz: ' + anlam.metin);
      }
      assert.deepEqual(await T(page, 'sizinti', w), [], 'Kartta cevap yok');
      // Duyuru maskeyi "gizli sözcük" diye okur; ne başlık ne kökü geçer. (İlk kelime açılış
      // duyurusudur, sıra satırıyla başlar; ikincisi "Sonraki kelime"den gelir.)
      const soru = await T(page, 'soru', w, w === sira[0]);
      await duyuruBekle(page, soru);
      assert.ok(soru.includes(' gizli sözcük '), 'Duyuruda maske sözle okunur: ' + soru);
      assert.deepEqual(await T(page, 'duyuruSizinti', w), [], 'Duyuruda cevap yok');
      await coz(page, w);
      await kutuBekle(page, w, 2);
      anlam = await T(page, 'anlam', w, false, false);
      assert.equal(anlam.gorulen, anlam.beklenen, 'Cevaptan sonra tam metin');
      assert.equal(anlam.metin.includes('•••'), false);
      // Tam metinde maskelenen yer açık: başlığın kendisi ya da (çekimli başlıkta) notun kökü.
      if (notlu) assert.ok(anlam.metin.includes(notlu.not) && anlam.metin.includes(notlu.kok + ' fiilinin'), 'Tam metinde not öznesiyle okunur: ' + anlam.metin);
      else assert.ok(anlam.metin.toLowerCase().includes(w.toLowerCase()), 'Tam metinde başlık geçer');
      assert.deepEqual(await T(page, 'duyuruSizinti', w), [], 'Cevaptan sonra da duyuruya cevap yazılmaz');
      await page.keyboard.press('Enter');
    }
    return 'başlık ' + f.baslik + ', notlar ' + f.notlar.map(n => n.tur + ' ' + n.w + ' (' + n.kok + ' fiilinin …)').join(', ');
  });

  /* ---------- 11) Yalnız klavye ve durum durum erişilebilirlik ---------- */
  senaryo('Klavye: Tab sırası üç düğmeye ulaşır, Enter gönderir; axe: yanlış, açılmış, doğru, boş sıra', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    await enAzBosluk(page, 2);
    let [w] = await T(page, 'sira');
    const odak = () => page.evaluate(() => document.activeElement && document.activeElement.id);
    // Sayfanın başından Tab ile girdiye ulaşılır.
    let adim = 0;
    while (await odak() !== 'oyunGirdi' && adim++ < 60) await page.keyboard.press('Tab');
    assert.equal(await odak(), 'oyunGirdi', 'Girdi Tab sırasında');
    // Girdiden sonra düğmeler sırayla gelir (kapalı düğme atlanır: tek boşluklu kelimede "Bir harf aç").
    const dugmeSirasi = async () => {
      const beklenen = (await T(page, 'gorunum')).harfKapali ? ['oyunPas', 'oyunGonder'] : ['oyunHarf', 'oyunPas', 'oyunGonder'];
      const duraklar = [];
      for (let i = 0; i < beklenen.length; i++) { await page.keyboard.press('Tab'); duraklar.push(await odak()); }
      assert.deepEqual(duraklar, beklenen, 'Girdiden sonra düğmeler sırayla');
      return beklenen.length;
    };
    let e = await T(page, 'eksik', w);
    assert.ok(e.length >= 2, 'Düzenek: ilk kelimede en az iki boşluk');
    assert.equal(await dugmeSirasi(), 3, 'Üç düğme de Tab sırasında');
    for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+Tab');
    assert.equal(await odak(), 'oyunGirdi');
    const cerceve = await page.evaluate(() => getComputedStyle(document.querySelector('.harf-alan')).outlineStyle);
    assert.notEqual(cerceve, 'none', 'Odak halkası sarmalayıcıda görünür');
    // Yazarken (bir harf yazılı, odak girdide), sonra yanlış deneme.
    await page.keyboard.type(yanlisHarfler(e[0]));
    await dortluDenetim(page, 'Yazarken');
    await page.locator('#oyunGirdi').focus();
    await page.keyboard.type(yanlisHarfler(e.slice(1)));
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Olmadı; kalan deneme hakkı: 2.');
    await dortluDenetim(page, 'Yanlış deneme');
    // Klavyeyle "Bilemedim, göster".
    await page.locator('#oyunGirdi').focus();
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    assert.equal(await odak(), 'oyunPas');
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Cevap: ' + w + '. Kelime 1. kutuda; yarın tekrar gelecek.');
    assert.equal(await odak(), 'oyunGirdi');
    await kutuBekle(page, w, 1);
    await dortluDenetim(page, 'Cevap gösterildi');
    // Sonraki kelime: harfler ve düğmeden gönderme (Enter düğmede de gönderir).
    await page.locator('#oyunGirdi').focus();
    await page.keyboard.press('Enter');
    [w] = await T(page, 'sira');
    await kelimeBekle(page, w);
    e = await T(page, 'eksik', w);
    await page.keyboard.type(e);
    await dugmeSirasi();
    assert.equal(await odak(), 'oyunGonder');
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Bildiniz! Kelime 1. kutuya çıktı; bir dahaki sefere harflerin %40\'ı açık gelecek.');
    assert.equal(await odak(), 'oyunGirdi', 'Düğmeyle göndermeden sonra odak girdide');
    await kutuBekle(page, w, 1);
    assert.equal((await T(page, 'gorunum')).sonuc, true);
    await dortluDenetim(page, 'Doğru ve sonuç bölümü');
    // Hareket: kutu canlandırması yalnız "azaltılmış hareket" istenmediğinde tanımlıdır.
    const canlandirma = () => page.evaluate(() => getComputedStyle(document.querySelector('#oyunHarfler .harf')).animationName);
    assert.equal(await canlandirma(), 'harf-ziplat');
    await page.emulateMedia({reducedMotion: 'reduce'});
    assert.equal(await canlandirma(), 'none', 'Azaltılmış harekette canlandırma yok');
    await page.emulateMedia({reducedMotion: 'no-preference'});
    // Boş sıra (öğrenilmiş kelime yok).
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    assert.match((await T(page, 'gorunum')).bosMetin, /henüz öğrenilmiş/);
    await dortluDenetim(page, 'Boş sıra');
  });

  /* ---------- 12) Yazılamayan ilerleme ---------- */
  senaryo('Depolama hatası: ileti değişir, kelime sayılmaz ve bu oturumda yeniden sorulmaz', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    const [w, w2] = await T(page, 'sira');
    await kelimeBekle(page, w);
    await page.evaluate(() => { window.YDS.Ilerleme.dogru = () => false; });
    await coz(page, w);
    await durumBekle(page, 'İlerleme kaydedilemedi; bu kelime sayılmadı.');
    assert.equal(await page.locator('#depolamaUyarisi').count(), 1, 'Depolama uyarısı gösterildi');
    let g = await T(page, 'gorunum');
    assert.equal(g.sayim, 'Bu oturum: ✓ 0 bildin · 💡 0 ipuçlu · ✗ 0 bilemedin');
    assert.deepEqual(g.bilinen, []);
    assert.equal(await T(page, 'kayit', w), null);
    const kullanim = await T(page, 'kullanim');
    if (kullanim) assert.deepEqual(kullanim, {}, 'Yazılamayan cevap kullanım sayacına da girmez');
    await page.locator('#oyunGirdi').focus();
    await page.keyboard.press('Enter');
    await kelimeBekle(page, w2);
    assert.equal((await T(page, 'sira'))[0], w, 'Düzenek: kelime hâlâ yeni');
    // Sıra yeniden kurulsa da geri gelmez.
    await page.locator('.oyun-mod [data-mod="yeni"]').click();
    await kelimeBekle(page, w2);
    // Bulut kaynaklı değişiklik de sırayı yeniler: dokunulmamış kelime başka cihazda yanıtlandıysa sıradaki gelir.
    await page.evaluate(k => window.YDS.Ilerleme.yanlis(k, 'kelime'), w2);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('yds-depo-degisti', {detail: {anahtarlar: ['yds-leitner'], kaynak: 'bulut'}})));
    await kelimeBekle(page, (await T(page, 'sira', 'yeni')).filter(x => x !== w)[0]);
  });

  /* ---------- 13) Aynı anlamlı kelime ve yazım çeşidi ---------- */
  senaryo('Öteki yazım (-ise/-ize, -re/-er) kısa anlamı farklı yazılmış olsa da kabul edilir; aynı anlamlı başka kelime (tek harf farklı olsa da) deneme harcamaz', async () => {
    const context = await yeni();
    const page = await context.newPage();
    await page.clock.setFixedTime(GUN(0));
    await ac(page, base);
    const f = await page.evaluate(() => {
      const Y = window.YDS, O = Y.OyunHesap, Il = Y.Ilerleme, dizin = Y.Veri.dizin;
      const bul = {};
      dizin.forEach(d => { bul[O.sade(d.e)] = d; });
      const duz = dizin.filter(d => O.oynanabilir(d) && /^[a-z]+$/.test(d.e));
      const fark = (a, b) => [...a].filter((c, i) => c !== b[i]).length;
      // Öteki yazımı da dizinde olan ve kısa anlamı ondan FARKLI yazılmış ilk kart: kabul, iki dizin
      // kaydının anlamının birebir aynı olmasına bağlı değildir.
      const ilkCift = adaylar => {
        for (const d of duz) for (const o of adaylar(d.e)) {
          if (bul[o] && bul[o] !== d && bul[o].t !== d.t && O.yazimCesidi(d.e, o)) return [d, bul[o]];
        }
        return null;
      };
      const sz = ilkCift(e => [...e].map((c, i) => (c === 's' || c === 'z' ? e.slice(0, i) + (c === 's' ? 'z' : 's') + e.slice(i + 1) : null)).filter(Boolean));
      const re = ilkCift(e => (/(re|er)$/.test(e) ? [e.slice(0, -2) + (e.endsWith('re') ? 'er' : 're')] : []));
      // Kısa anlamı ve türü aynı, aynı uzunlukta ama yazım çeşidi olmayan çiftler: eş anlamlıdır.
      // tek: yalnız bir harfi farklı (proved/proven gibi; eskiden yazım çeşidi sayılırdı), cok: en az üç harfi.
      const grup = {};
      duz.forEach(d => { (grup[d.t + '|' + d.y] = grup[d.t + '|' + d.y] || []).push(d); });
      let tek = null, cok = null;
      duz.forEach(a => grup[a.t + '|' + a.y].forEach(b => {
        if (a === b || a.e.length !== b.e.length || O.yazimCesidi(a.e, b.e)) return;
        if (!tek && fark(a.e, b.e) === 1) tek = [a, b];
        if (!cok && fark(a.e, b.e) >= 3) cok = [a, b];
      }));
      const eksik = Object.entries({sz, re, tek, cok}).filter(c => !c[1]).map(c => c[0]);
      if (eksik.length) return {eksik};
      const kartlar = [sz, re, tek, cok].map(c => c[0]);
      if (new Set(kartlar.map(d => d.e)).size !== 4) return {eksik: ['dört ayrı kart']};
      kartlar.forEach(d => Il.zatenBiliyorum(d.e, 'kelime'));
      Y.Depo.yaz('yds-katmanlar', [...new Set(kartlar.map(d => d.k))].sort());
      const cift = c => ({kart: c[0].e, aday: c[1].e, anlamAyni: c[0].t === c[1].t, bag: O.iliski(O.sade(c[1].e), c[0], x => bul[x])});
      return {sz: cift(sz), re: cift(re), tek: cift(tek), cok: cift(cok)};
    });
    assert.equal(f.eksik, undefined, 'Düzenek: dizinde şu çift kalmadı: ' + (f.eksik || []).join(', ') +
      ' (sz: -ise/-ize, re: -re/-er, kısa anlamları farklı; tek/cok: aynı anlamlı, yazım çeşidi olmayan). Bu adımı yeni veriye göre uyarlayın.');
    assert.deepEqual([f.sz.bag, f.re.bag, f.tek.bag, f.cok.bag], ['yazim', 'yazim', 'es', 'es'], 'Düzenek: modül çiftleri böyle sınıflar');
    assert.deepEqual([f.sz.anlamAyni, f.re.anlamAyni], [false, false], 'Düzenek: yazım çiftlerinin dizindeki kısa anlamı farklı');
    await page.clock.setFixedTime(GUN(1));
    await page.reload(); await hazir(page);
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    const sira = await T(page, 'sira', 'ogrenilen');
    const cifti = w => [f.sz, f.re, f.tek, f.cok].find(c => c.kart === w);
    assert.deepEqual([...sira].sort(), [f.sz.kart, f.re.kart, f.tek.kart, f.cok.kart].sort(), 'Düzenek: dört öğrenilmiş kelime');
    for (const w of sira) {
      await kelimeBekle(page, w);
      const once = await T(page, 'bugunku'), c = cifti(w);
      await page.locator('#oyunGirdi').focus();
      await page.keyboard.type(c.aday);
      await page.keyboard.press('Enter');
      if (c.bag === 'es') {
        await durumBekle(page, c.aday + ' kelimesi de bu anlama gelir ama aranan kelime o değil; başka bir kelime dene.');
        assert.equal(await page.locator('#oyunDurum b[lang="en"]').innerText(), c.aday, 'Yazılan kelime İngilizce olarak işaretli');
        const g = await T(page, 'gorunum');
        assert.equal(g.deger, c.aday, 'Yazılan yerinde kalır');
        assert.equal(g.gecersiz, null); assert.doesNotMatch(g.harfSinifi, /yanlis/);
        assert.equal(g.hucreler.filter(h => h.s.startsWith('bos')).length, w.length, 'Hiçbir harf kilitlenmedi');
        assert.equal(g.gonder, 'Kontrol et', 'Kelime bitmedi');
        for (let i = 0; i < w.length; i++) await page.keyboard.press('Backspace');
        assert.equal((await T(page, 'gorunum')).durum, '', 'Geçici ileti ilk tuşta silinir');
        await page.keyboard.type(w);
        await page.keyboard.press('Enter');
        // Deneme harcanmadı: sonuç hâlâ "ilk denemede doğru".
        await durumBekle(page, 'Bildiniz! Harfsiz de doğru; kelime öğrenilenlerde kalıyor.');
      } else {
        await durumBekle(page, c.aday + ' yazımı da doğru; bu karttaki yazım ' + w + '. Bildiniz! Harfsiz de doğru; kelime öğrenilenlerde kalıyor.');
        assert.equal((await T(page, 'gorunum')).hucreler.map(h => h.c).join(''), w, 'Kutular kartın kendi yazımını gösterir');
      }
      await page.waitForFunction(([t, d]) => { const b = window.__oyun.bugunku(); return b.t === t + 1 && b.d === d + 1; }, [once.t, once.d]);
      assert.equal((await T(page, 'kayit', w)).k, 5);
      await page.keyboard.press('Enter');
    }
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    assert.equal((await T(page, 'gorunum')).sayim, 'Bu oturum: ✓ 4 bildin · 💡 0 ipuçlu · ✗ 0 bilemedin', 'Dördü de ilk denemede doğru sayıldı');
    return 'yazım ' + f.sz.kart + '/' + f.sz.aday + ', ' + f.re.kart + '/' + f.re.aday + '; eş anlam ' + f.tek.kart + '/' + f.tek.aday + ', ' + f.cok.kart + '/' + f.cok.aday;
  });

  /* ---------- 14) Yazım zamanı ---------- */
  senaryo('Yazım zamanı: önce sonuç çizilir, yazım bir kare sonra; sonraki kelime, mod, katman, gizlenme ve kapanış bekletmez; çift yazım yok', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    // Her ilerleme yazımını say; çağrı anında ekranda ne olduğunu ve kaçıncı karede olunduğunu kaydet.
    await page.evaluate(() => {
      const Il = window.YDS.Ilerleme, kare = window.requestAnimationFrame.bind(window);
      window.__yazim = [];
      window.__kare = 0;
      (function say() { window.__kare++; kare(say); })();
      document.addEventListener('submit', () => { window.__gonderKare = window.__kare; }, true);
      ['dogru', 'ipucuyla', 'yanlis'].forEach(ad => {
        const asil = Il[ad];
        Il[ad] = function (w, tur) {
          window.__yazim.push({ad, w, kare: window.__kare, gonderKare: window.__gonderKare,
            durum: document.getElementById('oyunDurum').textContent,
            sinif: document.getElementById('oyunHarfler').className,
            gonder: document.getElementById('oyunGonder').textContent});
          return asil.call(Il, w, tur);
        };
      });
    });
    const yazimlar = () => page.evaluate(() => window.__yazim);
    const yanitla = async () => {
      const [w] = await T(page, 'sira');
      await kelimeBekle(page, w);
      await page.locator('#oyunGirdi').focus();
      await page.keyboard.type(await T(page, 'eksik', w));
      await page.keyboard.press('Enter');
      return w;
    };
    const BILDINIZ = 'Bildiniz! Kelime 1. kutuya çıktı; bir dahaki sefere harflerin %40\'ı açık gelecek.';

    // a) Olağan yol: yazım anında sonuç ekrandadır ve en az bir kare geçmiştir.
    const w1 = await yanitla();
    await kutuBekle(page, w1, 1);
    let y = await yazimlar();
    assert.equal(y.length, 1);
    assert.deepEqual([y[0].ad, y[0].w, y[0].durum, y[0].gonder], ['dogru', w1, BILDINIZ, 'Sonraki kelime →'], 'Yazımdan önce sonuç çizilmişti');
    assert.match(y[0].sinif, /\bdogru\b/);
    assert.ok(y[0].kare > y[0].gonderKare, 'Yazım göndermeyle aynı karede değil: ' + JSON.stringify(y[0]));
    await page.keyboard.press('Enter');

    // b) Cevap ve hemen ardından "sonraki": yazım o anda yapılır, bekleyen zamanlayıcı ikinci kez yazmaz.
    const [w2] = await T(page, 'sira');
    await kelimeBekle(page, w2);
    await page.keyboard.type(await T(page, 'eksik', w2));
    assert.equal(await page.evaluate(w => {
      const form = document.getElementById('oyunForm');
      form.requestSubmit(); form.requestSubmit();
      return window.YDS.Ilerleme.kutu(w, 'kelime');
    }, w2), 1, '"Sonraki kelime" bekleyen sonucu hemen yazar');
    await page.waitForTimeout(250);
    y = await yazimlar();
    assert.deepEqual(y.map(x => x.w), [w1, w2], 'Her kelime bir kez yazıldı');
    assert.equal((await T(page, 'kayit', w2)).k, 1);

    // c) Kare zamanlayıcısı hiç çalışmasa da (arka plandaki sekme) geçiş noktaları yazar.
    await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
    const bekliyor = async w => {
      await durumBekle(page, BILDINIZ);
      await page.waitForTimeout(120);
      assert.equal(await T(page, 'kayit', w), null, 'Düzenek: yazım bekliyor');
    };
    const hemenYazildi = async (w, neyle) => assert.equal((await T(page, 'kayit', w) || {}).k, 1, neyle + ' bekleyen sonucu yazar');
    const w3 = await yanitla(); await bekliyor(w3);
    await page.locator('.oyun-mod [data-mod="yeni"]').click();
    await hemenYazildi(w3, 'Mod değişimi');
    const w4 = await yanitla(); await bekliyor(w4);
    await page.locator('#katmanlar .katman[data-k="3"]').click();
    await hemenYazildi(w4, 'Katman değişimi');
    await hazir(page);
    const w5 = await yanitla(); await bekliyor(w5);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true});
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.visibilityState;
    });
    await hemenYazildi(w5, 'Sayfanın gizlenmesi');
    await page.locator('#oyunGirdi').focus();
    await page.keyboard.press('Enter');
    // pagehide tek başına da yazar (visibilitychange göndermeyen tarayıcılar için).
    const w6 = await yanitla(); await bekliyor(w6);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await hemenYazildi(w6, 'pagehide');
    await page.locator('#oyunGirdi').focus();
    await page.keyboard.press('Enter');
    const w7 = await yanitla(); await bekliyor(w7);
    y = await yazimlar();
    assert.deepEqual(y.map(x => x.w), [w1, w2, w3, w4, w5, w6], 'Buraya kadar her kelime tam bir kez yazıldı');
    await page.reload(); await hazir(page);
    assert.equal((await T(page, 'kayit', w7) || {}).k, 1, 'Sayfa gerçekten kapanırken bekleyen sonuç yazılır');
    assert.equal((await T(page, 'bugunku')).t, 7);
  });

  /* ---------- 15) Eksik betik ya da dizin ---------- */
  senaryo('Oyun betiği ya da kelime dizini inmezse sayfa hata vermeden bunu söyler', async () => {
    for (const dosya of [/\/assets\/js\/oyun-hesap\.js(?:\?.*)?$/, /\/data\/kelime-dizin\.js(?:\?.*)?$/]) {
      const page = await yeniSayfa();
      await page.route(dosya, route => route.abort());
      await page.goto(base + '/oyunlar.html');
      await page.waitForFunction(() => document.getElementById('oyunSira').textContent === 'Oyun yüklenemedi; sayfayı yenilemeyi dene.');
      assert.deepEqual(await page.evaluate(() => [document.getElementById('oyunKart').hidden, document.getElementById('oyunBos').hidden]), [true, true]);
      assert.equal(await page.evaluate(() => document.getElementById('oyunDuyuru').textContent), 'Oyun yüklenemedi; sayfayı yenilemeyi dene.',
        'Sıra satırı canlı bölge olmadığından ileti duyuru bölgesine de yazılır');
      await axeVeYerlesim(page, 'Oyun yüklenemedi');
    }
  });

  /* ---------- 16) Yerleşim: kelime ilk ekranda ---------- */
  senaryo('Yerleşim: kart katman seçiciden önce; 1366×768\'de harf kutuları, 375×667\'de anlam kaydırmadan ilk ekranda; bağlantı katman seçiciye götürür', async () => {
    for (const [en, boy, kimlik, ad] of [[1366, 768, 'oyunHarfler', 'harf kutuları'], [375, 667, 'oyunAnlam', 'anlam']]) {
      const page = await yeniSayfa({width: en, height: boy});
      await ac(page, base);
      const [w] = await T(page, 'sira');
      await kelimeBekle(page, w);
      await durgun(page);
      const y = await page.evaluate(kimlik => {
        const kutu = id => { const r = document.getElementById(id).getBoundingClientRect(); return {ust: Math.round(r.top), alt: Math.round(r.bottom), sol: Math.round(r.left), sag: Math.round(r.right)}; };
        return {hedef: kutu(kimlik), kart: kutu('oyunKart'), katman: kutu('katmanKart'), ekran: [innerWidth, innerHeight],
          kaydirma: [scrollX, scrollY], odakGovdede: document.activeElement === document.body};
      }, kimlik);
      const etiket = en + '×' + boy + ': ';
      assert.deepEqual(y.kaydirma, [0, 0], etiket + 'açılışta sayfa kaydırılmaz');
      assert.equal(y.odakGovdede, true, etiket + 'açılışta odak alınmaz');
      assert.ok(y.hedef.alt > y.hedef.ust && y.hedef.ust >= 0 && y.hedef.alt <= y.ekran[1] && y.hedef.sol >= 0 && y.hedef.sag <= y.ekran[0],
        etiket + ad + ' ilk ekranda, kaydırmadan: ' + JSON.stringify(y));
      assert.ok(y.katman.ust >= y.kart.alt, etiket + 'katman seçici kartın altında: ' + JSON.stringify(y));
      // Sıra satırındaki bağlantı katman seçiciyi ekrana getirir.
      await page.locator('.oyun-bilgi a[href="#katmanKart"]').click();
      await page.waitForFunction(() => {
        const r = document.querySelector('#katmanKart .katman').getBoundingClientRect();
        return location.hash === '#katmanKart' && r.top >= 0 && r.bottom <= innerHeight;
      });
    }
  });

  /* ---------- 17) Anlamı ipucu vermeyen kelime ---------- */
  senaryo('İpucu kalmayan kelime (Türkçesi aynı yazılan) oyunda yok: sayılmaz; vadesi gelse de, öğrenilmiş olsa da sorulmaz', async () => {
    const context = await yeni();
    const page = await context.newPage();
    await page.clock.setFixedTime(GUN(0));
    await ac(page, base);
    const f = await page.evaluate(() => {
      const Y = window.YDS, O = Y.OyunHesap, Il = Y.Ilerleme;
      const k2 = Y.Veri.dizin.filter(d => d.k === 2), oynanan = k2.filter(d => O.oynanabilir(d));
      // Biçimi yazmaya uygun olduğu hâlde (anlamı başka olsaydı oynanırdı) yalnız maskeden sonra
      // ipucu kalmadığı için dışarıda kalanlar.
      const bicimUygun = d => O.oynanabilir({e: d.e, y: d.y, k: d.k, t: 'başka bir anlam'});
      const ipucusuz = k2.filter(d => bicimUygun(d) && !O.ipucuKalir(d.t, d.e));
      const out = {ipucusuz: ipucusuz.map(d => d.e), toplam: Y.Veri.katmanSayilari()[2], oynanan: oynanan.length, ilk: oynanan[0].e,
        bicimDisi: k2.filter(d => !bicimUygun(d)).length, oyunda: ipucusuz.filter(d => oynanan.includes(d)).length};
      if (ipucusuz.length >= 2) {
        Il.yanlis(ipucusuz[0].e, 'kelime');          // 1. kutu: yarın vadesi gelir
        Il.zatenBiliyorum(ipucusuz[1].e, 'kelime');  // 5. kutu: yarın "öğrenilenler"de sorulabilir olurdu
      }
      return out;
    });
    assert.ok(f.ipucusuz.length >= 2, 'Düzenek: Çekirdek katmanında anlamı ipucu vermeyen en az iki kelime gerekli (bulunan: ' + f.ipucusuz.join(', ') + ')');
    assert.equal(f.oyunda, 0, 'İpucu kalmayan kelime oynanabilir sayılmaz');
    assert.equal(f.oynanan, f.toplam - f.bicimDisi - f.ipucusuz.length, 'Oyun dışı kalanlar: yazılamayan biçimler ve ipucu kalmayan kelimeler');
    await page.clock.setFixedTime(GUN(1));
    await page.reload(); await hazir(page);
    const kayitli = await page.evaluate(([a, b]) => { const Il = window.YDS.Ilerleme; return [Il.vadesiGeldiMi(a, 'kelime'), Il.kutu(b, 'kelime')]; }, f.ipucusuz);
    assert.deepEqual(kayitli, [true, 5], 'Düzenek: ilk kelimenin vadesi geldi, ikincisi öğrenildi');
    // Vadesi gelen kelime havuzda olsaydı sıranın başına geçer, "1 tekrar" sayılırdı.
    await kelimeBekle(page, f.ilk);
    let g = await T(page, 'gorunum');
    assert.equal(g.katmanBilgi, f.toplam + ' kelime seçili · oyunda ' + f.oynanan);
    assert.equal(g.siraMetni, 'Sırada ' + f.oynanan + ' kelime: 0 tekrar + ' + f.oynanan + ' yeni.');
    assert.deepEqual(g.modlar, ['Sıradakiler (' + f.oynanan + ')', 'Yalnız yeni kelimeler (' + f.oynanan + ')', 'Öğrenilenler · harfsiz (0)']);
    assert.equal(g.kutu, 'hiç çalışılmadı');
    const hepsi = await T(page, 'sira', 'sira', 100000);
    assert.equal(hepsi.length, f.oynanan);
    assert.deepEqual(f.ipucusuz.filter(w => hepsi.includes(w)), [], 'Modülün sırası da bu kelimeleri içermez');
    // Öğrenilmiş olan da "Öğrenilenler" turuna girmez.
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    g = await T(page, 'gorunum');
    assert.match(g.bosMetin, /henüz öğrenilmiş/);
    assert.equal(g.kart, false);
    return f.ipucusuz.length + ' ipucusuz kelime (' + f.ipucusuz.join(', ') + '), ' + f.bicimDisi + ' yazılamayan biçim';
  });

  /* ---------- 18) Kısa kelime ve öğrenilen kelimede ipucu ---------- */
  senaryo('Kısa kelime 4. kutuda harfsiz gelir (rozet ve yükselme iletisi söyler); öğrenilen kelime ipuçlu bilinirse "Bilinenler"de kalır', async () => {
    const context = await yeni();
    const page = await context.newPage();
    await page.clock.setFixedTime(GUN(0));
    await ac(page, base);
    const f = await page.evaluate(() => {
      const O = window.YDS.OyunHesap, Il = window.YDS.Ilerleme, havuz = window.__oyun.havuz([2]);
      const kisa = havuz.find(d => /^[a-z]{4}$/.test(d.e));
      const uzun = havuz.filter(d => /^[a-z]{5,}$/.test(d.e)).slice(10, 12);
      if (!kisa || uzun.length < 2) return null;
      for (let i = 0; i < 3; i++) Il.dogru(kisa.e, 'kelime');
      uzun.forEach(d => Il.zatenBiliyorum(d.e, 'kelime'));
      return {kisa: kisa.e, Z1: uzun[0].e, Z2: uzun[1].e, bugun: Il.bugun(), kayit: Il.kayit(kisa.e, 'kelime'),
        acik: [3, 4].map(k => O.acikSayisi(O.harfSayisi(kisa.e), k)), yuzde: O.yuzde(4)};
    });
    assert.ok(f, 'Düzenek: Çekirdek katmanında dört harfli ve en az beş harfli oynanabilir kelimeler gerekli');
    assert.deepEqual([f.acik, f.yuzde], [[1, 0], 10], 'Düzenek: dört harfli kelime 3. kutuda bir harf açık, 4. kutuda (%10) harfsiz gelir');
    assert.deepEqual([f.kayit.k, f.kayit.g], [3, f.bugun + 7], 'Düzenek: 3. kutu, 7 gün sonra');
    // 7. gün: 3. kutuda bir harf açık. İlk denemede bilinince ileti, 4. kutuda harf açılmayacağını söyler.
    await page.clock.setFixedTime(GUN(7));
    await page.reload(); await hazir(page);
    await kelimeBekle(page, f.kisa);
    let g = await T(page, 'gorunum');
    assert.equal(g.seviye, 'Seviye 4 · harflerin %20\'si açık');
    assert.equal(g.hucreler.filter(h => h.s.includes('sabit')).length, 1);
    await coz(page, f.kisa);
    await durumBekle(page, 'Bildiniz! Kelime 4. kutuya çıktı; bu kadar kısa kelimede bir dahaki sefere harf açılmayacak.');
    await kutuBekle(page, f.kisa, 4);
    assert.deepEqual(await T(page, 'kayit', f.kisa), {k: 4, g: f.bugun + 22, c: f.bugun + 7});
    // 22. gün: Seviye 5'in yüzdesi var ama bu kelimede yarım harften az tutar: rozet bunu söyler, açık kutu yok.
    await page.clock.setFixedTime(GUN(22));
    await page.reload(); await hazir(page);
    await kelimeBekle(page, f.kisa);
    g = await T(page, 'gorunum');
    assert.equal(g.seviye, 'Seviye 5 · kısa kelime: harf yok');
    assert.equal(g.kutu, '4. kutu · tekrar zamanı');
    assert.equal(g.hucreler.filter(h => !h.s.startsWith('bos')).length, 0, 'Hiç açık harf yok');
    assert.equal(g.hucreler.map(h => h.c).join(''), '');
    assert.equal(g.azami, '4');
    assert.equal(g.tarif, '4 harfli İngilizce kelime: boş, boş, boş, boş. 4 eksik harfi sırayla yaz, Enter ile kontrol et.');
    assert.deepEqual(await T(page, 'sizinti', f.kisa), [], 'Kartta cevap yok');
    await dortluDenetim(page, 'Kısa kelime rozeti');
    await coz(page, f.kisa);
    await durumBekle(page, 'Bildiniz! Kelime öğrenildi (5. kutu). Bundan sonra “Öğrenilenler · harfsiz” turunda sorulur.');
    await kutuBekle(page, f.kisa, 5);
    // Öğrenilenler turu: bugün öğrenilen kelime sorulmaz; ötekiler dünden kalmadır.
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    const sira = await T(page, 'sira', 'ogrenilen');
    assert.deepEqual(sira, [f.Z1, f.Z2], 'Düzenek: iki öğrenilmiş kelime sırada');
    // İpucuyla bilinen öğrenilmiş kelime kutusunda kalır ve yarın tekrara gelmez: "Bilinenler"de, 💡 işaretiyle.
    await kelimeBekle(page, f.Z1);
    await page.locator('#oyunHarf').click();
    await durumBekle(page, '1. harf açıldı: ' + f.Z1[0] + '. Doğru bilirsen kelime aynı kutuda kalır.');
    await coz(page, f.Z1);
    await durumBekle(page, 'Doğru, ama ipucuyla; kelime öğrenilenlerde kalıyor.');
    await page.waitForFunction(([w, gun]) => window.__oyun.kayit(w).c === gun, [f.Z1, f.bugun + 22]);
    assert.equal((await T(page, 'kayit', f.Z1)).k, 5);
    g = await T(page, 'gorunum');
    assert.equal(g.kutu, 'öğrenildi');
    assert.deepEqual(g.bilinen, ['💡 ipuçlu: ' + f.Z1 + ' · öğrenildi', f.kisa + ' · öğrenildi']);
    assert.deepEqual(g.tekrar, [], 'Öğrenilenlerde kalan ipuçlu kelime "Tekrar gelecekler"e yazılmaz');
    assert.deepEqual(await page.evaluate(() => [document.querySelector('#oyunBilinen li').className, document.getElementById('oyunTekrarKutu').hidden]), ['cip baslandi', true]);
    assert.equal(g.sayim, 'Bu oturum: ✓ 1 bildin · 💡 1 ipuçlu · ✗ 0 bilemedin');
    // İkinci denemede bilinen öğrenilmiş kelime: ipucu kullanılmadı, ileti bunu ayırır; yine "Bilinenler".
    await page.keyboard.press('Enter');
    await kelimeBekle(page, f.Z2);
    await page.keyboard.type(yanlisHarfler(f.Z2));
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Olmadı; kalan deneme hakkı: 2.');
    await page.keyboard.type(f.Z2);
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Doğru, ama ilk denemede değil; kelime öğrenilenlerde kalıyor.');
    await page.waitForFunction(([w, gun]) => window.__oyun.kayit(w).c === gun, [f.Z2, f.bugun + 22]);
    g = await T(page, 'gorunum');
    assert.equal(g.bilinen[0], '💡 ipuçlu: ' + f.Z2 + ' · öğrenildi');
    assert.deepEqual(g.tekrar, []);
    return 'kısa kelime ' + f.kisa;
  });

  /* ---------- 19) Sıra her kelimede depodan kurulur ---------- */
  senaryo('Sıra her "Sonraki kelime"de depodan kurulur: olayı ulaşmayan başka sekme cevabı atlanır, kutusu değişen kelime yeni seviyesiyle sorulur', async () => {
    const context = await yeni();
    const a = await context.newPage();
    await ac(a, base);
    const [w1, w2, w3, w4, w5, w6] = await T(a, 'sira', 'sira', 6);
    const oynanan = (await T(a, 'sira', 'sira', 100000)).length;
    await kelimeBekle(a, w1);
    const b = await context.newPage();
    await ac(b, base);
    await a.bringToFront();
    // Bundan sonra öbür sekmenin yazımları bu sekmeye olay olarak ulaşmaz.
    await a.evaluate(() => { window.__depolamaOlayiYok = true; });
    // (1) Sıradaki kelime (w2) öbür sekmede yanıtlanır; sonra bu sekme ekrandaki kelimeyi yanıtlar.
    await b.evaluate(k => window.YDS.Ilerleme.dogru(k, 'kelime'), w2);
    await a.waitForTimeout(300);
    assert.equal(await T(a, 'kayit', w2), null, 'Düzenek: bu sekmenin bellekteki kopyası eski');
    assert.equal(await T(a, 'uyuyor', w1, true), true, 'Olay ulaşmadığı için ekran değişmedi');
    await coz(a, w1);
    await kutuBekle(a, w1, 1);
    await a.keyboard.press('Enter');
    await kelimeBekle(a, w3);
    let g = await T(a, 'gorunum');
    assert.equal(g.siraMetni, 'Sırada ' + (oynanan - 2) + ' kelime: 0 tekrar + ' + (oynanan - 2) + ' yeni. 2 kelime tekrar gününü bekliyor.',
      'Öbür sekmede yanıtlanan kelime sırada yok, bekleyenlerde');
    assert.equal(g.modlar[0], 'Sıradakiler (' + (oynanan - 2) + ')');
    // (2) Bu sekme cevabını yazdıktan SONRA öbür sekme sıradakini yanıtlar: "Sonraki kelime" anında
    // bellekteki kopya da eskidir, kelimeyi yalnız depodan taze okuma eleyebilir.
    await coz(a, w3);
    await kutuBekle(a, w3, 1);
    await b.evaluate(k => window.YDS.Ilerleme.yanlis(k, 'kelime'), w4);
    await a.waitForTimeout(300);
    assert.equal(await T(a, 'kayit', w4), null, 'Düzenek: bellekteki kopya yine eski');
    await a.keyboard.press('Enter');
    await kelimeBekle(a, w5);
    // (3) Sıradaki kelimenin (w6) kutusu öbür sekmede değişir ama vadesi bugündür: sırada kalır,
    // gösterilirken seviyesi bellekteki eski kayıttan değil depodaki taze kayıttan gelir.
    await coz(a, w5);
    await kutuBekle(a, w5, 1);
    const bugun = await T(a, 'bugun');
    assert.equal(await b.evaluate(([k, gun]) => {
      const Il = window.YDS.Ilerleme, kayit = {};
      kayit[Il.ilerlemeKimligi(k, 'kelime')] = {k: 3, g: gun, c: gun - 7, m: 0};
      return window.YDS.Depo.kayitlariYaz('yds-leitner', kayit);
    }, [w6, bugun]), true, 'Düzenek: öbür sekme kaydı yazdı');
    await a.waitForTimeout(300);
    assert.equal(await T(a, 'kayit', w6), null, 'Düzenek: bellekte kelime hâlâ "hiç çalışılmadı"');
    await a.keyboard.press('Enter');
    await kelimeBekle(a, w6, false);
    g = await T(a, 'gorunum');
    assert.equal(g.seviye, 'Seviye 4 · harflerin %20\'si açık', 'Seviye depodaki taze kayıttan');
    assert.equal(g.kutu, '3. kutu · tekrar zamanı');
    const beklenen = await a.evaluate(([k, gun]) => {
      const O = window.YDS.OyunHesap;
      return {acik: O.acikKonumlar(k, 3, gun), sonrakiAcik: O.acikSayisi(O.harfSayisi(k), 4)};
    }, [w6, bugun]);
    assert.deepEqual(g.hucreler.map((h, i) => (h.s.includes('sabit') ? i : -1)).filter(i => i >= 0), beklenen.acik, 'Açık harfler 3. kutunun harfleri');
    // Cevap, gösterilirken alınan taze kayıtla karşılaştırılır: "başka sekmede yanıtlanmış" sayılmaz, 4. kutuya çıkar.
    await coz(a, w6);
    await durumBekle(a, 'Bildiniz! Kelime 4. kutuya çıktı; ' + (beklenen.sonrakiAcik
      ? 'bir dahaki sefere harflerin %10\'u açık gelecek.' : 'bu kadar kısa kelimede bir dahaki sefere harf açılmayacak.'));
    await kutuBekle(a, w6, 4);
    assert.deepEqual(await T(a, 'kayit', w6), {k: 4, g: bugun + 15, c: bugun});
    assert.equal((await T(a, 'gorunum')).sayim, 'Bu oturum: ✓ 4 bildin · 💡 0 ipuçlu · ✗ 0 bilemedin');
  });

  /* ---------- 20) Dışarıdan değişiklikte odak ---------- */
  senaryo('Dışarıdan değişiklik: kart odağın altından gizlenirse odak boş duruma, boş durum odaktayken kelime gelirse girdiye taşınır; odak başka yerdeyse dokunulmaz, değişiklik duyurulur', async () => {
    const context = await yeni();
    const page = await context.newPage();
    await page.clock.setFixedTime(GUN(0));
    await ac(page, base);
    const f = await page.evaluate(() => {
      const Il = window.YDS.Ilerleme, uzun = window.__oyun.havuz([2]).filter(d => /^[a-z]{5,}$/.test(d.e)).slice(10, 14).map(d => d.e);
      Il.zatenBiliyorum(uzun[0], 'kelime'); Il.zatenBiliyorum(uzun[1], 'kelime');
      return {Z1: uzun[0], Z2: uzun[1], Z3: uzun[2], Z4: uzun[3]};
    });
    await page.clock.setFixedTime(GUN(1));
    await page.reload(); await hazir(page);
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    assert.deepEqual(await T(page, 'sira', 'ogrenilen'), [f.Z1, f.Z2], 'Düzenek: iki öğrenilmiş kelime sırada');
    await kelimeBekle(page, f.Z1);
    // Başka sekmenin yazımı gibi: ilerleme değişir, ardından 'sekme' kaynaklı olay gelir.
    // bugun: kelime bugün çalışılmış olur (bugün yeniden sorulmaz); dun: dün öğrenilmiş olur (bugün sorulabilir).
    const disaridan = async (w, ne) => {
      if (ne === 'dun') await page.clock.setFixedTime(GUN(0));
      await page.evaluate(k => window.YDS.Ilerleme.zatenBiliyorum(k, 'kelime'), w);
      if (ne === 'dun') await page.clock.setFixedTime(GUN(1));
      await T(page, 'depoDegisti', ['yds-leitner'], 'sekme');
    };
    const modda = () => page.evaluate(() => document.activeElement.getAttribute('data-mod'));
    assert.equal(await modda(), 'ogrenilen', 'Mod düğmesine basınca odak düğmede kalır (kart odağı almaz)');
    // a) Odak kartın dışında: ekrandaki kelime başka yerde yanıtlanınca sıradaki gelir, odak alınmaz;
    //    duyuru yalnız yeni soruyu okur.
    await disaridan(f.Z1, 'bugun');
    await kelimeBekle(page, f.Z2);
    await duyuruBekle(page, await T(page, 'soru', f.Z2, false));
    assert.equal(await modda(), 'ogrenilen', 'Depolama olayı odağı almaz');
    // Sıra kullanıcı işlemi olmadan boşalır: odak yerinde kalır, boş durumun metni duyurulur.
    await disaridan(f.Z2, 'bugun');
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    let g = await T(page, 'gorunum');
    assert.equal(g.kart, false);
    assert.match(g.bosMetin, /bugün çalıştın/);
    assert.equal(await modda(), 'ogrenilen', 'Odak kartta değilken boş duruma taşınmaz');
    await duyuruBekle(page, g.bosMetin);
    // Kelime gelir: boş durum odakta değil, girdi odak almaz; yeni soru duyurulur.
    await disaridan(f.Z3, 'dun');
    await kelimeBekle(page, f.Z3);
    await duyuruBekle(page, await T(page, 'soru', f.Z3, false));
    assert.equal(await modda(), 'ogrenilen', 'Boş durum odakta değilken girdi odak almaz');
    // b) Odak girdide, hiçbir şey yazılmamış: kart gizlenince odak boş duruma geçer (sayfanın başına düşmez).
    await odakla(page);
    await disaridan(f.Z3, 'bugun');
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    g = await T(page, 'gorunum');
    assert.equal(g.kart, false);
    assert.equal(g.odak, 'oyunBos', 'Kart odağın altından gizlenince odak boş duruma taşınır');
    // c) Boş durum odaktayken kelime gelir: odak girdiye geçer, girdi boştur.
    await disaridan(f.Z4, 'dun');
    await kelimeBekle(page, f.Z4);
    g = await T(page, 'gorunum');
    assert.equal(g.bos, false);
    assert.equal(g.odak, 'oyunGirdi', 'Boş durum odaktayken gelen kelimede odak girdiye taşınır');
    assert.equal(g.deger, '');
    await page.keyboard.type(f.Z4);
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Bildiniz! Harfsiz de doğru; kelime öğrenilenlerde kalıyor.');
  });

  /* ---------- 21) Geri/ileri önbelleğinden dönüş ---------- */
  senaryo('Geri/ileri önbelleğinden dönüş (pageshow, persisted): boştaki sayfa sırayı ve katman seçimini depodan yeniler; yarım kelime "Sonraki kelime"yi bekler', async () => {
    const context = await yeni();
    const a = await context.newPage();
    await ac(a, base);
    const [w1, w2, w3, w4] = await T(a, 'sira');
    const oynanan = (await T(a, 'sira', 'sira', 100000)).length;
    await kelimeBekle(a, w1);
    // Sayfa önbellekte donmuşken ilerlemeyi değiştiren öbür sayfa (örn. Kelimeler). Donmuş sayfaya
    // depolama olayı ulaşmaz: bellekteki kopyası eski kalır.
    const b = await context.newPage();
    await ac(b, base);
    await a.bringToFront();
    await a.evaluate(() => { window.__depolamaOlayiYok = true; });
    const don = kalici => a.evaluate(k => { window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: k})); }, kalici);
    await b.evaluate(k => window.YDS.Ilerleme.dogru(k, 'kelime'), w1);
    // Olağan yüklemenin pageshow'u (persisted değil) sırayı yenilemez.
    await don(false);
    await a.waitForTimeout(400);
    assert.equal(await T(a, 'kayit', w1), null, 'Düzenek: bellekteki kopya eski');
    assert.equal(await T(a, 'uyuyor', w1, true), true, 'persisted olmayan pageshow bir şey değiştirmez');
    // Önbellekten dönüş: boştaki sayfa doğru kelimeye geçer; odak alınmaz, yeni soru duyurulur.
    await don(true);
    await kelimeBekle(a, w2);
    let g = await T(a, 'gorunum');
    assert.equal(g.siraMetni, 'Sırada ' + (oynanan - 1) + ' kelime: 0 tekrar + ' + (oynanan - 1) + ' yeni. 1 kelime tekrar gününü bekliyor.');
    assert.equal(g.odak, 'BODY', 'Dönüşte odak alınmaz');
    await duyuruBekle(a, await T(a, 'soru', w2, false));
    // Üzerinde çalışılan kelime dönüşte değişmez; sıra "Sonraki kelime"de yenilenir.
    await odakla(a);
    const e = await T(a, 'eksik', w2);
    await a.keyboard.type(e[0]);
    await b.evaluate(k => window.YDS.Ilerleme.dogru(k, 'kelime'), w3);
    await don(true);
    await a.waitForTimeout(400);
    g = await T(a, 'gorunum');
    assert.equal(g.deger, e[0], 'Yazılan harf yerinde');
    assert.equal(g.odak, 'oyunGirdi');
    assert.equal(await T(a, 'uyuyor', w2, false), true, 'Yarım kelime dönüşte değişmez');
    await a.keyboard.type(e.slice(1));
    await a.keyboard.press('Enter');
    await durumBekle(a, BILDINIZ_1);
    await kutuBekle(a, w2, 1);
    await a.keyboard.press('Enter');
    await kelimeBekle(a, w4);
    // Katman seçimi de dönüşte yeniden okunur.
    await b.evaluate(() => window.YDS.Depo.yaz('yds-katmanlar', [2, 3]));
    await a.waitForTimeout(300);
    assert.deepEqual(await T(a, 'secili'), [2], 'Düzenek: seçim değişikliği bu sekmeye ulaşmadı');
    await don(true);
    await a.waitForFunction(() => window.__oyun.secili().join() === '2,3' && window.YDS.Veri.katmanYukluMu(3));
    const [ilk] = await T(b, 'sira', 'sira', 1, [2, 3]);
    await kelimeBekle(a, ilk);
    const sayi = await a.evaluate(() => {
      const s = window.YDS.Veri.katmanSayilari();
      return {toplam: s[2] + s[3], oynanan: window.__oyun.havuz([2, 3]).length};
    });
    assert.equal((await T(a, 'gorunum')).katmanBilgi, sayi.toplam + ' kelime seçili · oyunda ' + sayi.oynanan);
  });

  /* ---------- 22) Dinle: dokunmatik ve masaüstü ---------- */
  senaryo('Dinle: dokunmatik ekranda odak ve kaydırma yerinde kalır; masaüstünde odak girdiye döner ama sayfa kaymaz', async () => {
    const notlar = [];
    for (const dokunmatik of [true, false]) {
      const page = dokunmatik
        ? await yeniSayfa({width: 375, height: 667}, {hasTouch: true, isMobile: true})
        : await yeniSayfa({width: 1280, height: 420});
      // Yumuşak kaydırma kapalı olsun (style.css azaltılmış harekette kapatır): ölçüm kaydırma
      // canlandırmasının ortasına denk gelmesin.
      await page.emulateMedia({reducedMotion: 'reduce'});
      await ac(page, base);
      assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), dokunmatik, 'Düzenek: işaretçi türü (dokunmatik: ' + dokunmatik + ')');
      const [w] = await T(page, 'sira');
      await kelimeBekle(page, w);
      await coz(page, w);
      await kutuBekle(page, w, 1);
      if (!await page.evaluate(() => 'speechSynthesis' in window)) {
        assert.equal(await page.locator('#oyunDinle').isVisible(), false, 'Ses desteği yoksa düğme gizli');
        notlar.push('ses desteği yok');
        continue;
      }
      await page.evaluate(() => {
        window.__okunan = [];
        window.speechSynthesis.speak = soz => { window.__okunan.push(soz.text); };
        // Düğme ekranın ortasında, girdi ekranın üstünde (görünmüyor) kalacak kadar aşağı in.
        document.getElementById('oyunDinle').scrollIntoView({block: 'center'});
      });
      const olc = () => page.evaluate(() => {
        const r = id => document.getElementById(id).getBoundingClientRect();
        return {kaydirma: scrollY, girdiAlt: Math.round(r('oyunGirdi').bottom), dinle: [Math.round(r('oyunDinle').top), Math.round(r('oyunDinle').bottom)], boy: innerHeight,
          odak: document.activeElement && (document.activeElement.id || document.activeElement.tagName), okunan: window.__okunan};
      });
      const once = await olc();
      assert.ok(once.kaydirma > 0 && once.girdiAlt < 0 && once.dinle[0] > 0 && once.dinle[1] < once.boy,
        'Düzenek: sayfa aşağı kaydırılmış, girdi ekranın dışında, Dinle ekranda: ' + JSON.stringify(once));
      if (dokunmatik) await page.locator('#oyunDinle').tap(); else await page.locator('#oyunDinle').click();
      await page.waitForFunction(() => window.__okunan.length === 1);
      const sonra = await olc();
      assert.deepEqual(sonra.okunan, [w], 'Dinle kelimeyi okutur');
      assert.equal(sonra.kaydirma, once.kaydirma, (dokunmatik ? 'Dokunmatik' : 'Masaüstü') + ': Dinle sayfayı kaydırmaz ' + JSON.stringify([once, sonra]));
      if (dokunmatik) assert.notEqual(sonra.odak, 'oyunGirdi', 'Dokunmatik ekranda odak girdiye taşınmaz (klavye açılmaz)');
      else assert.equal(sonra.odak, 'oyunGirdi', 'Masaüstünde odak girdiye döner (Enter sonraki kelimeye geçsin)');
      notlar.push((dokunmatik ? 'dokunmatik' : 'masaüstü') + ' kaydırma ' + once.kaydirma);
    }
    return notlar.join(', ');
  });

  /* ---------- 23) Ctrl/Cmd+A ---------- */
  senaryo('Ctrl/Cmd+A: tümünü seçip yazmak yazılanı değiştirir ve ilk denemede doğru sayılır; Tab ile dönüş ve çift tıklama yazılanı silmez', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    await enAzBosluk(page, 3);
    const [w] = await T(page, 'sira');
    await kelimeBekle(page, w);
    const e = await T(page, 'eksik', w);
    assert.ok(e.length >= 3, 'Düzenek: en az üç boşluk gerekli (' + w + ', ' + e.length + ' boşluk)');
    const once = await T(page, 'bugunku');
    // Seçim: tarayıcının sıraya koyduğu select olayı da işlensin diye bir kare ve bir görev sonra okunur.
    const secim = () => page.evaluate(() => new Promise(coz => requestAnimationFrame(() => setTimeout(() => {
      const g = document.getElementById('oyunGirdi');
      coz([g.selectionStart, g.selectionEnd]);
    }, 0))));
    const deger = async () => (await T(page, 'gorunum')).deger;
    await odakla(page);
    // Tab ile çıkıp dönünce tarayıcı alanın tamamını seçer; seçim sona toplanır, sonraki harf eklenir.
    await page.keyboard.type(e.slice(0, 2));
    await page.keyboard.press('Tab');
    assert.notEqual((await T(page, 'gorunum')).odak, 'oyunGirdi', 'Düzenek: Tab girdiden çıkardı');
    await page.keyboard.press('Shift+Tab');
    assert.equal((await T(page, 'gorunum')).odak, 'oyunGirdi');
    assert.deepEqual(await secim(), [2, 2], 'Tab ile dönüşte seçim sona toplanır');
    await page.keyboard.type(e[2]);
    assert.equal(await deger(), e.slice(0, 3), 'Tab ile dönüşten sonra yazılan harf öncekilere eklenir');
    // Çift tıklama da seçim bırakmaz.
    await page.keyboard.press('Backspace');
    await page.locator('.harf-alan').dblclick();
    assert.deepEqual(await secim(), [2, 2], 'Çift tıklamada seçim sona toplanır');
    await page.keyboard.type(e[2]);
    assert.equal(await deger(), e.slice(0, 3), 'Çift tıklamadan sonra yazılan harf öncekilere eklenir');
    // Ctrl/Cmd+A: seçim korunur (select olayından sonra da); yazılan, öncekilerin yerine geçer.
    await page.keyboard.press('ControlOrMeta+A');
    assert.deepEqual(await secim(), [0, 3], 'Ctrl/Cmd+A seçimi korunur');
    await page.keyboard.type(yanlisHarfler(e));
    assert.equal(await deger(), yanlisHarfler(e), 'Boşluklar yanlış harflerle dolu');
    await page.keyboard.press('ControlOrMeta+A');
    assert.deepEqual(await secim(), [0, e.length]);
    await page.keyboard.type(e);
    let g = await T(page, 'gorunum');
    assert.equal(g.deger, e, 'Tümünü seçip yazmak yazılanı değiştirir');
    assert.equal(g.hucreler.map(h => h.c).join(''), w.toLowerCase(), 'Kutular yeni harfleri gösterir');
    assert.equal(await T(page, 'kayit', w), null);
    // Hiç yanlış deneme yapılmadı: ilk denemede doğru, kutu yükselir.
    await page.keyboard.press('Enter');
    await durumBekle(page, BILDINIZ_1);
    await kutuBekle(page, w, 1);
    const sonra = await T(page, 'bugunku');
    assert.deepEqual([sonra.t, sonra.d], [once.t + 1, once.d + 1], 'İlk denemede doğru sayıldı');
    g = await T(page, 'gorunum');
    assert.equal(g.sayim, 'Bu oturum: ✓ 1 bildin · 💡 0 ipuçlu · ✗ 0 bilemedin');
  });

  /* ---------- 24) Açılıştaki bulut birleşimi sürerken ---------- */
  senaryo('Eşitleme sürerken "Kontrol et" ve "Bilemedim" bekletilir; birleşim bitince ya da süre dolunca bir kez işlenir, sonra hiç bekletilmez; yazmak ve harf açmak beklemez', async () => {
    const BEKLE_KONTROL = 'Eşitleniyor; bitince kontrol edilecek.', BEKLE_PAS = 'Eşitleniyor; bitince cevap gösterilecek.';
    // Beklemenin üst sınırı sayfa açılışından itibaren işler. Makinenin hızı sonucu değiştirmesin diye saat
    // baştan duraklatılır ve yalnız elle ilerletilir (page.clock; gerçek bekleme yok). Sınır sabit yazılmaz:
    // sayfanın yüklediği betikten okunur, (d) adımında davranışla ölçülür.
    let sinir = null;
    const kapiliSayfa = async () => {
      const page = await yeniSayfa();
      await page.clock.install({time: GUN(0)});
      await page.clock.pauseAt(GUN(0));
      await ac(page, base);
      // Motor her yüklemede önce "kapali" bildirir (eşitleme açık değilken başka olay gelmez); kapıyı bu bitirmez.
      await page.waitForFunction(() => window.__esitlemeDurumlari.length > 0);
      assert.deepEqual(await page.evaluate(() => window.__esitlemeDurumlari), ['kapali'], 'Düzenek: motorun açılıştaki tek olayı "kapali"');
      sinir = await page.evaluate(async () => {
        const betik = document.querySelector('script[src*="assets/js/oyunlar.js"]');
        const m = (await (await fetch(betik.src)).text()).match(/ESITLEME_BEKLEME_MS\s*=\s*(\d+)/);
        return m ? Number(m[1]) : null;
      });
      assert.ok(sinir >= 3000, 'Düzenek: oyunlar.js içindeki ESITLEME_BEKLEME_MS okunamadı ya da 3 sn\'den kısa (' + sinir +
        '); adı değiştiyse bu satırı, kısaldıysa aşağıdaki ara ilerletmeleri (toplam 1,5 sn\'den az) güncelleyin');
      await T(page, 'yazimlariSay');
      return page;
    };
    // Bekleyen zamanlayıcılar (sonucun bir kare sonraki yazımı, 60-150 ms'lik ertelemeler) çalışsın.
    const ilerlet = (page, ms) => page.clock.runFor(ms);

    // a) Durum değişimiyle biten bekleme; açılıştaki "kapali" kapıyı bitirmez; bittikten sonra bekletilmez.
    {
      const page = await kapiliSayfa();
      const [w1, w2, w3] = await T(page, 'sira');
      await kelimeBekle(page, w1);
      const once = await T(page, 'bugunku');
      await T(page, 'esitleme', 'kapali');
      await T(page, 'esitleme', 'yukleniyor');
      await odakla(page);
      const e = await T(page, 'eksik', w1);
      // Boşluk eksikken Enter bekletilmez: olağan ileti.
      await page.keyboard.type(e.slice(0, -1));
      await page.keyboard.press('Enter');
      await durumBekle(page, 'Önce bütün boşlukları doldur.');
      await page.keyboard.type(e.slice(-1));
      await page.keyboard.press('Enter');
      await durumBekle(page, BEKLE_KONTROL);
      const bekliyor = async etiket => {
        const g = await T(page, 'gorunum');
        assert.equal(g.durum, BEKLE_KONTROL, etiket);
        assert.equal(g.gonder, 'Kontrol et', etiket + ': kelime bitmedi');
        assert.equal(g.deger, e, etiket + ': yazılan yerinde');
        assert.equal(g.hucreler.map(h => h.c).join(''), w1.toLowerCase(), etiket + ': yazılan harfler kutularda');
        assert.equal(g.hucreler.filter(h => h.s.startsWith('bos')).length, e.length, etiket + ': hiçbir harf kilitlenmedi');
        assert.doesNotMatch(g.harfSinifi, /dogru|yanlis|acildi/, etiket);
        assert.deepEqual([g.sonuc, g.gecersiz, g.pasKapali, g.odak], [false, null, false, 'oyunGirdi'], etiket);
        assert.equal(await T(page, 'kayit', w1), null, etiket + ': ilerleme yazılmadı');
        assert.deepEqual(await T(page, 'yazilan'), [], etiket + ': hiçbir yazım çağrılmadı');
        assert.deepEqual(await T(page, 'bugunku'), once, etiket + ': günlük sayaç değişmedi');
      };
      await ilerlet(page, 300);
      await bekliyor('Eşitleme sürerken');
      // SDK'nın inmesi ve oturumun bağlanması da "sürüyor"dur.
      await T(page, 'esitleme', 'yuklendi');
      await T(page, 'esitleme', 'baglaniyor');
      await ilerlet(page, 200);
      await bekliyor('Ara durumlarda');
      // Yazmak bekletilmez; bekleyen cevap, birleşim bittiği andaki girdiyle işlenir.
      await page.keyboard.press('Backspace');
      assert.equal((await T(page, 'gorunum')).deger, e.slice(0, -1), 'Beklerken yazılan düzeltilebilir');
      await page.keyboard.type(e.slice(-1));
      await T(page, 'esitleme', 'hazir');
      await durumBekle(page, BILDINIZ_1);
      await ilerlet(page, 300);
      await kutuBekle(page, w1, 1);
      assert.deepEqual(await T(page, 'yazilan'), ['dogru:' + w1], 'Kayıt tam bir kez yazıldı');
      assert.deepEqual(await T(page, 'bugunku'), {t: once.t + 1, d: once.d + 1, y: once.y + 1});
      const g = await T(page, 'gorunum');
      assert.deepEqual(g.bilinen, [w1 + ' · 1. kutu']);
      assert.equal(g.odak, 'oyunGirdi');
      // Kapı bir kez bitti: yeni bir "yukleniyor" artık hiçbir şeyi bekletmez.
      await page.keyboard.press('Enter');
      await kelimeBekle(page, w2);
      await T(page, 'esitleme', 'yukleniyor');
      await page.keyboard.type(await T(page, 'eksik', w2));
      await page.keyboard.press('Enter');
      await durumBekle(page, BILDINIZ_1);
      await ilerlet(page, 200);
      await kutuBekle(page, w2, 1);
      await page.keyboard.press('Enter');
      await kelimeBekle(page, w3);
      await page.locator('#oyunPas').click();
      await durumBekle(page, 'Cevap: ' + w3 + '. Kelime 1. kutuda; yarın tekrar gelecek.');
      await ilerlet(page, 200);
      await kutuBekle(page, w3, 1);
      assert.deepEqual(await T(page, 'yazilan'), ['dogru:' + w1, 'dogru:' + w2, 'yanlis:' + w3]);
    }

    // b) "Bilemedim, göster" bekletilir, cevap açılmaz; "Bir harf aç" bekletilmez.
    {
      const page = await kapiliSayfa();
      const sira = await T(page, 'sira', 'sira', 40);
      // En az iki boşluklu ilk kelimeye kadar geç (bugünkü ilk kelime zaten uygundur).
      let w = null;
      for (const aday of sira) {
        await kelimeBekle(page, aday);
        if ((await T(page, 'eksik', aday)).length >= 2) { w = aday; break; }
        await page.locator('#oyunPas').click();
        await page.locator('#oyunGonder').click();
      }
      assert.ok(w, 'Düzenek: en az iki boşluklu kelime bulunamadı');
      const oncekiYazim = await T(page, 'yazilan');
      const once = await T(page, 'bugunku'), bugun = await T(page, 'bugun');
      await T(page, 'esitleme', 'yukleniyor');
      const ilkBos = (await T(page, 'gorunum')).hucreler.findIndex(h => h.s.startsWith('bos'));
      await page.locator('#oyunHarf').click();
      await durumBekle(page, harfSirasi(w, ilkBos) + '. harf açıldı: ' + w[ilkBos] + '. Doğru bilirsen kelime 1. kutuya girer.');
      assert.equal((await T(page, 'gorunum')).hucreler[ilkBos].s, 'ipucu', 'Harf açma bekletilmez');
      await page.locator('#oyunPas').click();
      await durumBekle(page, BEKLE_PAS);
      await ilerlet(page, 300);
      let g = await T(page, 'gorunum');
      assert.equal(g.durum, BEKLE_PAS);
      assert.deepEqual([g.gonder, g.sonuc, g.pasKapali, g.odak], ['Kontrol et', false, false, 'oyunGirdi'], 'Kelime bitmedi, düğme açık');
      assert.doesNotMatch(g.harfSinifi, /acildi|dogru/);
      assert.deepEqual(await T(page, 'sizinti', w), [], 'Cevap gösterilmedi');
      assert.equal(await T(page, 'kayit', w), null);
      assert.deepEqual(await T(page, 'yazilan'), oncekiYazim);
      await T(page, 'esitleme', 'hazir');
      await durumBekle(page, 'Cevap: ' + w + '. Kelime 1. kutuda; yarın tekrar gelecek.');
      await ilerlet(page, 300);
      await kutuBekle(page, w, 1);
      g = await T(page, 'gorunum');
      assert.match(g.harfSinifi, /\bacildi\b/);
      assert.equal(g.hucreler.map(h => h.c).join(''), w, 'Cevap açıldı');
      assert.deepEqual(await T(page, 'kayit', w), {k: 1, g: bugun + 1, c: bugun});
      assert.deepEqual(await T(page, 'bugunku'), {t: once.t + 1, d: once.d, y: once.y + 1});
      assert.deepEqual(await T(page, 'yazilan'), oncekiYazim.concat('yanlis:' + w), 'Bir kez, "bilemedim" olarak yazıldı');
    }

    // c) Kelime yeniden kurulursa (mod değişip dönülür) bekleyen işlem düşer; birleşim hatayla ya da
    //    bulut kopyası silinmiş olarak bitse de kapı açılır.
    for (const bitis of ['hata', 'silindi']) {
      const page = await kapiliSayfa();
      const [w] = await T(page, 'sira');
      await kelimeBekle(page, w);
      await T(page, 'esitleme', 'baglaniyor');
      await coz(page, w);
      await durumBekle(page, BEKLE_KONTROL);
      await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
      await page.locator('#oyunBos').waitFor({state: 'visible'});
      await page.locator('.oyun-mod [data-mod="sira"]').click();
      await kelimeBekle(page, w);
      let g = await T(page, 'gorunum');
      assert.deepEqual([g.durum, g.deger], ['', ''], 'Kelime yeniden kuruldu: ileti ve yazılan temizlendi');
      await T(page, 'esitleme', bitis);
      await ilerlet(page, 300);
      g = await T(page, 'gorunum');
      assert.deepEqual([g.durum, g.gonder, g.sonuc], ['', 'Kontrol et', false], bitis + ': düşen işlem sonradan çalışmaz');
      assert.deepEqual(await T(page, 'yazilan'), []);
      // Kapı açıldı: cevap artık hemen işlenir.
      await coz(page, w);
      await durumBekle(page, BILDINIZ_1);
      await ilerlet(page, 200);
      await kutuBekle(page, w, 1);
      assert.deepEqual(await T(page, 'yazilan'), ['dogru:' + w]);
    }

    // d) Birleşim hiç bitmezse: üst sınır dolunca bekleyen cevap işlenir. Sınırdan hemen önce cevap hâlâ
    //    bekler; süre adım adım ilerletilip işlendiği an ölçülür ve betikteki değerle karşılaştırılır.
    const page = await kapiliSayfa();
    const [w, w2] = await T(page, 'sira');
    await kelimeBekle(page, w);
    await T(page, 'esitleme', 'yukleniyor');
    await coz(page, w);
    await durumBekle(page, BEKLE_KONTROL);
    const ADIM = 250, durumMetni = async () => (await T(page, 'gorunum')).durum;
    let gecen = Math.floor((sinir - 1) / ADIM) * ADIM;
    await ilerlet(page, gecen);
    assert.equal(await durumMetni(), BEKLE_KONTROL, 'Sınırdan hemen önce (' + gecen + ' ms) cevap hâlâ bekliyor');
    assert.equal(await T(page, 'kayit', w), null);
    assert.deepEqual(await T(page, 'yazilan'), []);
    while (gecen < sinir + 20 * ADIM && await durumMetni() === BEKLE_KONTROL) { await ilerlet(page, ADIM); gecen += ADIM; }
    assert.equal(await durumMetni(), BILDINIZ_1, 'Birleşim bitmese de süre dolunca cevap işlenir');
    assert.equal(gecen, Math.ceil(sinir / ADIM) * ADIM, 'Bekleme betikteki üst sınır kadar sürer (' + sinir + ' ms)');
    // Yazım bir kare sonradır: saat biraz daha ilerletilir.
    await ilerlet(page, 200);
    await kutuBekle(page, w, 1);
    assert.deepEqual(await T(page, 'yazilan'), ['dogru:' + w]);
    // Süre dolduktan sonra durum hâlâ "yukleniyor" olsa da bir daha bekletilmez.
    await page.keyboard.press('Enter');
    await kelimeBekle(page, w2);
    await page.keyboard.type(await T(page, 'eksik', w2));
    await page.keyboard.press('Enter');
    await durumBekle(page, BILDINIZ_1);
    return 'üst sınır ' + sinir + ' ms (ölçülen ' + gecen + ')';
  });

  /* ---------- 25) Odak hiçbir öğede değilken yazma ---------- */
  senaryo('Odaksız yazma: sayfa açılır açılmaz yazılan harf girdiye gider, biten kelimede Enter sonrakine geçer; düğme odaktayken, rakamda ve değiştirici tuşla dokunulmaz', async () => {
    const page = await yeniSayfa({width: 1366, height: 768});
    await ac(page, base);
    const [w, w2] = await T(page, 'sira');
    await kelimeBekle(page, w);
    const e = await T(page, 'eksik', w);
    const kaydirma = () => page.evaluate(() => scrollY);
    const birak = () => page.evaluate(() => { document.activeElement.blur(); });
    // Yapay tuş: varsayılan işi (harfin yazılması) yoktur, yalnız dinleyicinin odağı taşıyıp taşımadığı görülür.
    const yapayTus = secenek => page.evaluate(s => { document.body.dispatchEvent(new KeyboardEvent('keydown', {bubbles: true, cancelable: true, ...s})); }, secenek);
    let g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.deger, await kaydirma()], ['BODY', '', 0], 'Düzenek: yeni açılan sayfada odak gövdede');
    // Bitmemiş kelimede odaksız Enter, rakam ve noktalama hiçbir şey yapmaz.
    await page.keyboard.press('Enter');
    await page.keyboard.press('5');
    await page.keyboard.press('.');
    g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.deger, g.durum, g.gonder], ['BODY', '', '', 'Kontrol et'], 'Enter, rakam ve nokta odağı taşımaz');
    // Tıklamadan yazılan harfler boşlukları doldurur.
    await page.keyboard.type(e);
    g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.deger], ['oyunGirdi', e], 'İlk harf odağı girdiye taşır ve yazılır');
    assert.equal(g.hucreler.map(h => h.c).join(''), w.toLowerCase());
    assert.equal(await kaydirma(), 0, 'Odak taşınırken sayfa kaymaz');
    await page.keyboard.press('Enter');
    await durumBekle(page, BILDINIZ_1);
    await kutuBekle(page, w, 1);
    g = await T(page, 'gorunum');
    assert.equal(g.odak, 'oyunGirdi');
    assert.equal(await kaydirma(), 0);
    // Biten kelimede odak bırakılır: harf dokunmaz, Enter sonraki kelimeye geçer.
    await birak();
    await page.keyboard.press('a');
    g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.gonder], ['BODY', 'Sonraki kelime →'], 'Biten kelimede harf odağı taşımaz');
    await page.keyboard.press('Enter');
    await kelimeBekle(page, w2);
    g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.deger], ['oyunGirdi', ''], 'Odaksız Enter sonraki kelimeye geçer, odak girdide');
    const e2 = await T(page, 'eksik', w2);
    // Bir düğme odaktayken harf ona aittir: girdi boş kalır, odak yerinde.
    await page.locator('.oyun-mod [data-mod="yeni"]').focus();
    await page.keyboard.press(e2[0]);
    g = await T(page, 'gorunum');
    assert.equal(g.deger, '', 'Düğme odaktayken yazılan harf girdiye gitmez');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-mod')), 'yeni', 'Odak düğmede kalır');
    assert.equal(await T(page, 'mod'), 'sira', 'Harf düğmeyi de çalıştırmaz');
    // Odak yokken rakam: odak gövdede kalır.
    await birak();
    await page.keyboard.press('7');
    g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.deger], ['BODY', '']);
    // Değiştirici tuşla (Ctrl/Cmd/Alt) dokunulmaz; Türkçe klavyenin ı ve İ harfleri de harf sayılır.
    for (const s of [{key: 'a', ctrlKey: true}, {key: 'a', metaKey: true}, {key: 'a', altKey: true}, {key: 'Tab'}, {key: ' '}]) {
      await yapayTus(s);
      assert.equal((await T(page, 'gorunum')).odak, 'BODY', JSON.stringify(s) + ' odağı taşımaz');
    }
    for (const key of ['ı', 'İ', 'A']) {
      await yapayTus({key});
      assert.equal((await T(page, 'gorunum')).odak, 'oyunGirdi', key + ' odağı girdiye taşır');
      await birak();
    }
    // <main> (atlama bağlantısının hedefi) odaktayken de yazılan harf girdiye gider; aşağı kaydırılmış
    // sayfada odak taşınırken sayfa kaymaz.
    await page.evaluate(() => { document.getElementById('icerik').focus({preventScroll: true}); window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'}); });
    const asagi = await kaydirma();
    assert.ok(asagi > 0, 'Düzenek: sayfa aşağı kaydırıldı');
    await yapayTus({key: e2[0]});
    assert.deepEqual([(await T(page, 'gorunum')).odak, await kaydirma()], ['oyunGirdi', asagi], 'Odak girdiye geçti, sayfa kaymadı');
    await page.evaluate(() => { document.getElementById('icerik').focus({preventScroll: true}); });
    await page.keyboard.press(e2[0]);
    g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.deger], ['oyunGirdi', e2[0]], '<main> odaktayken yazılan harf girdiye gider');
  });

  /* ---------- 26) Kelimeler destesi ---------- */
  senaryo('Kelimeler destesi: Oyunlar\'da ya da başka sekmede yanıtlanan kart desteden düşer ve ikinci kez yazılmaz (olay ulaşmasa da: önbellekten dönüşte, her kart çiziminde, cevap anında); özet güncel kalır, olağan cevap bozulmaz, boşalan deste biter', async () => {
    const context = await yeni();
    const page = await context.newPage();
    await page.goto(base + '/kelimeler.html');
    await page.waitForFunction(() => window.YDS && window.YDS.Ilerleme && /^Bugünü çalış \(\d+ kart\)$/.test(document.getElementById('desteBasla').textContent));
    await page.locator('#desteBasla').click();
    const kart = () => page.evaluate(() => {
      const g = id => document.getElementById(id);
      return {on: g('kartOn').textContent, sayac: g('kartSayac').textContent, alan: !g('kartAlan').hidden, arka: !g('kartArka').hidden,
        liste: g('sayac').textContent, dugme: g('desteBasla').textContent, aciklama: g('desteAciklama').textContent};
    });
    const sayacBekle = metin => page.waitForFunction(m => document.getElementById('kartSayac').textContent === m, metin);
    // Liste sayacı ve deste özeti güncel mi? Beklenen sayılar sayfada, depodaki güncel ilerlemeden
    // hesaplanır (Il.tazele + Il.leitnerOzet); kart sayısı kartın kendi sayacından alınır.
    const ozetGuncel = async (k, etiket) => {
      const b = await page.evaluate(adet => {
        const Y = window.YDS, Il = Y.Ilerleme, secili = Y.Depo.oku('yds-katmanlar', [2]);
        const havuz = Y.Veri.dizin.filter(d => secili.includes(d.k));
        Il.tazele();
        const o = Il.leitnerOzet(havuz.map(d => ({en: d.e})), 'kelime');
        return {bugun: o.bugun, dugme: 'Bugünü çalış (' + o.bugun + ' kart)',
          liste: adet + ' kelime · seçili katmanlarda ' + havuz.length + ' · öğrenilen ' + o.ogrenilen + ' · bugün ' + o.gosterilecekTekrar + ' tekrar + ' + o.acilacakYeni + ' yeni',
          aciklama: 'Deste: ' + [o.gosterilecekTekrar ? o.gosterilecekTekrar + ' tekrar' : '', o.acilacakYeni ? o.acilacakYeni + ' yeni kelime' : ''].filter(Boolean).join(' + ') + '.'};
      }, Number(k.sayac.split(' / ')[1]));
      assert.ok(b.bugun > 0, 'Düzenek: bugünün kotasında hâlâ kart var');
      assert.equal(k.liste, b.liste, etiket + ': liste sayacı güncel');
      assert.equal(k.dugme, b.dugme, etiket + ': deste düğmesi güncel');
      assert.ok(k.aciklama.startsWith(b.aciklama), etiket + ': deste açıklaması güncel: "' + k.aciklama + '" şununla başlamalı: "' + b.aciklama + '"');
    };
    let k = await kart();
    let n = Number(k.sayac.split(' / ')[1]);
    assert.ok(k.alan && k.sayac === '1 / ' + n && n >= 15, 'Düzenek: en az on beş kartlı deste açıldı (' + k.sayac + ')');
    // Deste karışık sıradadır: kelimeler ekrandan okunur. adet kez "Sonraki" tam bir tur atar.
    const dolas = async adet => {
      const out = [];
      for (let i = 0; i < adet; i++) { out.push((await kart()).on); await page.locator('#sonraki').click(); }
      return out;
    };
    let deste = await dolas(n);
    assert.equal(new Set(deste).size, n, 'Düzenek: destede ' + n + ' ayrı kelime');
    assert.equal((await kart()).on, deste[0], 'Düzenek: tam turdan sonra ilk karta dönüldü');
    const kutu = w => page.evaluate(w => window.YDS.Ilerleme.kutu(w, 'kelime'), w);

    // a) Oyunlar sayfası (aynı tarayıcı, öbür sekme) destedeki bir kelimeyi yanıtlar: depolama olayı
    //    kendiliğinden gelir, kart düşer, sayaç ve deste özeti güncellenir.
    const oyun = await context.newPage();
    await ac(oyun, base);
    const [oyunda] = await T(oyun, 'sira');
    assert.ok(deste.includes(oyunda), 'Düzenek: oyunun ilk kelimesi (' + oyunda + ') Kelimeler destesinde');
    await kelimeBekle(oyun, oyunda);
    await coz(oyun, oyunda);
    await kutuBekle(oyun, oyunda, 1);
    await page.bringToFront();
    deste = deste.filter(w => w !== oyunda);
    n -= 1;
    await sayacBekle('1 / ' + n);
    k = await kart();
    assert.equal(k.on, deste[0], 'Ekranda destenin (kalan) ilk kartı');
    assert.ok(k.liste.startsWith(n + ' kelime · '), 'Liste sayacı güncellendi: ' + k.liste);
    assert.equal(k.dugme, 'Bugünü çalış (' + n + ' kart)', 'Deste özeti güncellendi');
    assert.deepEqual(await dolas(n), deste, 'Kalan kartlar aynı sırada; oyunda yanıtlanan kelime yok');

    // Bundan sonrası için başka sekmenin yazımı sayfa içinden kurulur: ilerleme değişir, ardından 'sekme'
    // kaynaklı olay gelir.
    const disarida = (kelimeler, islem) => page.evaluate(([kelimeler, islem]) => {
      kelimeler.forEach(w => window.YDS.Ilerleme[islem](w, 'kelime'));
      window.dispatchEvent(new CustomEvent('yds-depo-degisti', {detail: {anahtarlar: ['yds-leitner'], kaynak: 'sekme'}}));
    }, [kelimeler, islem]);
    // b) Sonraki kartlardan biri başka yerde yanıtlanır: sayaç bir azalır, ekrandaki kart değişmez,
    //    deste dolaşılırken o kelime bir daha gelmez.
    const giden = deste[3];
    await disarida([giden], 'dogru');
    await sayacBekle('1 / ' + (n - 1));
    assert.equal((await kart()).on, deste[0], 'Ekrandaki kart yerinde');
    deste = deste.filter(w => w !== giden);
    assert.deepEqual(await dolas(n - 1), deste, 'Kalan kartlar aynı sırada; yanıtlanan kelime yok');
    // c) Ekrandaki karttan ÖNCEKİ bir kart düşer: ekrandaki kart aynı kalır, sırası bir geri kayar.
    await page.locator('#sonraki').click(); await page.locator('#sonraki').click();
    await sayacBekle('3 / ' + (n - 1));
    await disarida([deste[0]], 'yanlis');
    await sayacBekle('2 / ' + (n - 2));
    assert.equal((await kart()).on, deste[2], 'Önceki kart düşünce ekrandaki kart değişmez');
    deste = deste.slice(1);
    // d) Ekrandaki (çevrilmiş) kart düşer: yerine sıradaki gelir, cevabı kapalıdır.
    await page.locator('#kart').click();
    assert.equal((await kart()).arka, true, 'Düzenek: kart çevrildi');
    await disarida([deste[1]], 'ipucuyla');
    await sayacBekle('2 / ' + (n - 3));
    k = await kart();
    assert.deepEqual([k.on, k.arka], [deste[2], false], 'Düşen kartın yerine sıradaki gelir, çevrilmemiş');
    deste = deste.filter((w, i) => i !== 1);
    // e) Ekrandaki kartı olağan yoldan yanıtlamak yine çalışır.
    await page.locator('#bildim').click();
    await sayacBekle('2 / ' + (n - 4));
    assert.equal(await kutu(deste[1]), 1, '"Bildim" kelimeyi 1. kutuya çıkardı');
    deste = deste.filter((w, i) => i !== 1);
    assert.equal((await kart()).on, deste[1]);
    // f) Geri/ileri önbelleğinden dönüş: sayfa donmuşken öbür sayfa sonraki kartlardan birini yanıtlar.
    //    Donmuş sayfaya depolama olayı ulaşmaz, ilerlemenin bellekteki kopyası eski kalır; pageshow
    //    (persisted) desteyi yine de depodaki güncel kayıtla ayıklar.
    await page.evaluate(() => { window.__depolamaOlayiYok = true; });
    const bellekVeDepo = w => page.evaluate(w => {
      const Il = window.YDS.Ilerleme;
      return [Il.kutu(w, 'kelime'), (window.YDS.Depo.oku('yds-leitner', {})[Il.ilerlemeKimligi(w, 'kelime')] || {}).k || 0];
    }, w);
    const sonKart = deste[deste.length - 1];
    await oyun.evaluate(w => window.YDS.Ilerleme.dogru(w, 'kelime'), sonKart);
    await page.waitForTimeout(300);
    assert.deepEqual(await bellekVeDepo(sonKart), [0, 1], 'Düzenek: bellekteki kopya eski (0), depoda kelime 1. kutuda');
    assert.equal((await kart()).sayac, '2 / ' + (n - 4), 'Olay ulaşmadığı için deste henüz değişmedi');
    await page.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true})); });
    await sayacBekle('2 / ' + (n - 5));
    deste = deste.slice(0, -1);
    k = await kart();
    assert.ok(k.liste.startsWith((n - 5) + ' kelime · '), 'Dönüşte liste sayacı da güncellendi: ' + k.liste);
    assert.deepEqual(await dolas(n - 5), deste.slice(1).concat(deste[0]), 'Kalan deste aynı sırada; yanıtlanan kelime bir daha gelmez');
    // g) Hiçbir olay gelmese de: ayıklama her kart çiziminde depoya bakar. Sıradaki kart öbür sayfada
    //    yanıtlanır; "Sonraki" onu atlar, ondan sonraki kart gelir.
    const siradaki = deste[2];
    await oyun.evaluate(w => window.YDS.Ilerleme.yanlis(w, 'kelime'), siradaki);
    await page.waitForTimeout(300);
    assert.deepEqual(await bellekVeDepo(siradaki), [0, 1], 'Düzenek: bellekteki kopya yine eski');
    const atlamadanOnce = await kart();
    assert.deepEqual([atlamadanOnce.on, atlamadanOnce.sayac], [deste[1], '2 / ' + (n - 5)], 'Olay olmadan ekrandaki kart ve sayaç yerinde');
    await page.locator('#sonraki').click();
    await sayacBekle('3 / ' + (n - 6));
    k = await kart();
    assert.equal(k.on, deste[3], 'Başka yerde yanıtlanan sıradaki kart atlandı, ondan sonraki geldi');
    // Atlamayla birlikte liste sayacı ve deste özeti de yeni sayıları gösterir (yalnız kart sayacı değil).
    await ozetGuncel(k, 'Olaysız atlama');
    assert.ok(k.liste !== atlamadanOnce.liste && k.dugme !== atlamadanOnce.dugme && k.aciklama !== atlamadanOnce.aciklama,
      'Özet atlamadan önceki sayılarda kalmadı: ' + JSON.stringify([atlamadanOnce, k]));
    deste = deste.filter(w => w !== siradaki);
    assert.deepEqual(await dolas(n - 6), deste.slice(2).concat(deste.slice(0, 2)), 'Kalan deste aynı sırada; atlanan kelime bir daha gelmez');
    // h) Ekrandaki kart, çizildikten SONRA öbür sayfada yanıtlanır (olay yok) ve burada da cevaplanır:
    //    ikinci kez yazılmaz. Kayıt öbür sayfanın yazdığı gibi kalır, günlük sayaçlar oynamaz, kart
    //    desteden düşer ve sıradaki gelir. Üç düğme de böyledir.
    const depoKaydi = w => page.evaluate(w => {
      const r = window.YDS.Depo.oku('yds-leitner', {})[window.YDS.Ilerleme.ilerlemeKimligi(w, 'kelime')];
      return r ? {k: r.k, g: r.g, c: r.c} : null;
    }, w);
    const gunluk = () => page.evaluate(() => {
      const Il = window.YDS.Ilerleme;
      return {kayit: Il.gunlukKayitlar()[Il.bugun()] || null, yeni: Il.bugunAcilanYeni()};
    });
    const bugun = await page.evaluate(() => window.YDS.Ilerleme.bugun());
    const konum = 2, yazilmayan = [];
    for (const [dugme, oburSayfada] of [['bildim', 'dogru'], ['bilmedim', 'dogru'], ['zatenBiliyorum', 'yanlis']]) {
      const ekrandaki = deste[konum];
      assert.equal((await kart()).on, ekrandaki, 'Düzenek: beklenen kart ekranda');
      await oyun.evaluate(([w, islem]) => window.YDS.Ilerleme[islem](w, 'kelime'), [ekrandaki, oburSayfada]);
      await page.waitForTimeout(300);
      assert.deepEqual(await bellekVeDepo(ekrandaki), [0, 1], 'Düzenek: bellekteki kopya eski');
      assert.equal((await kart()).on, ekrandaki, 'Olay ulaşmadığı için kart hâlâ ekranda');
      const kayitOnce = await depoKaydi(ekrandaki), gunlukOnce = await gunluk();
      assert.deepEqual(kayitOnce, {k: 1, g: bugun + 1, c: bugun}, 'Düzenek: öbür sayfanın kaydı (1. kutu, yarın)');
      await page.locator('#' + dugme).click();
      deste = deste.filter(w => w !== ekrandaki);
      await sayacBekle((konum + 1) + ' / ' + deste.length);
      k = await kart();
      assert.equal(k.on, deste[konum], dugme + ': ekranda artık sıradaki kart');
      assert.deepEqual(await depoKaydi(ekrandaki), kayitOnce, dugme + ': kayıt öbür sayfanın yazdığı gibi kaldı');
      assert.deepEqual(await gunluk(), gunlukOnce, dugme + ': günlük sayaçlar değişmedi');
      await ozetGuncel(k, dugme + ' (yazılmayan cevap)');
      yazilmayan.push(ekrandaki);
    }
    // i) Dokunulmamış kartta aynı düğme olağan çalışır: kelime 1. kutuya yazılır, günlük sayaçlar artar.
    const olagan = deste[konum], olagandanOnce = await gunluk();
    assert.deepEqual([(await kart()).on, await depoKaydi(olagan)], [olagan, null], 'Düzenek: ekrandaki kart hiç yanıtlanmadı');
    await page.locator('#bildim').click();
    deste = deste.filter(w => w !== olagan);
    await sayacBekle((konum + 1) + ' / ' + deste.length);
    assert.deepEqual(await depoKaydi(olagan), {k: 1, g: bugun + 1, c: bugun}, 'Olağan "Bildim" kelimeyi 1. kutuya yazar');
    const olagandanSonra = await gunluk();
    assert.deepEqual([olagandanSonra.kayit.t, olagandanSonra.kayit.d, olagandanSonra.yeni], [olagandanOnce.kayit.t + 1, olagandanOnce.kayit.d + 1, olagandanOnce.yeni + 1],
      'Olağan cevap günlük sayaçları bir artırır');
    k = await kart();
    assert.equal(k.on, deste[konum]);
    await ozetGuncel(k, 'Olağan cevap');
    // Başka yerde yanıtlanan kelimeler aynı gün ikinci kez yazılmadı.
    for (const w of [oyunda, giden, sonKart, siradaki, ...yazilmayan]) assert.equal(await kutu(w), 1, w + ' bir kez yazıldı (1. kutu)');
    // j) Kalan kartların hepsi başka yerde yanıtlanır: deste biter, liste geri gelir.
    await disarida(deste, 'dogru');
    await page.waitForFunction(() => document.getElementById('sayac').textContent === 'Bugünün destesi bitti. Yarın yeni tekrarlar açılacak.');
    assert.deepEqual(await page.evaluate(() => [document.getElementById('kartAlan').hidden, document.getElementById('liste').hidden, document.getElementById('mod').textContent]),
      [true, false, 'Kart moduna geç'], 'Deste bitince liste görünümüne dönülür');
    return (n + 1) + ' kartlı deste; oyunda yanıtlanan: ' + oyunda;
  });

  try {
    for (let i = 0; i < senaryolar.length; i++) {
      const {ad, govde} = senaryolar[i], no = String(i + 1).padStart(2, ' '), basla = Date.now(), onceki = hatalar.length;
      let hata = null, not = '';
      try { not = await govde() || ''; } catch (h) { hata = h; }
      if (!hata && hatalar.length > onceki) hata = new Error('Sayfa hatası: ' + hatalar.slice(onceki).join(' | '));
      for (const context of acikBaglamlar) await context.close().catch(() => {});
      acikBaglamlar = [];
      const sure = ((Date.now() - basla) / 1000).toFixed(1) + ' sn';
      if (hata) {
        basarisiz.push({no: i + 1, ad, hata});
        console.log('HATA ' + no + '. ' + ad + ' (' + sure + ')');
        console.log(String(hata.stack || hata).split('\n').slice(0, 12).map(s => '        ' + s).join('\n'));
        if (hatalar.length > onceki) console.log('        sayfa hataları: ' + hatalar.slice(onceki).join(' | '));
      } else {
        console.log('ok   ' + no + '. ' + ad + ' (' + sure + ')' + (not ? ' — ' + not : ''));
      }
    }
  } finally {
    for (const context of acikBaglamlar) await context.close().catch(() => {});
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  if (basarisiz.length) {
    throw new Error(basarisiz.length + '/' + senaryolar.length + ' senaryo başarısız:\n' + basarisiz.map(b => b.no + '. ' + b.ad + '\n' +
      String(b.hata.stack || b.hata).split('\n').slice(0, 12).join('\n')).join('\n'));
  }
  assert.deepEqual(hatalar, [], 'Sayfa hatası');
  console.log('Oyunlar Browser QA passed: ' + senaryolar.length + ' senaryo — boş profil, cevap yolları (doğru, ipucuyla, bilemedim), seviyeler, ' +
    'yazım, katmanlar (inmeyen ve yavaş katman dahil), başka sekme, maske, klavye, depolama hatası, yazım çeşidi, yazım zamanı, ' +
    'yerleşim, ipucusuz ve kısa kelime, her kelimede taze sıra, dışarıdan değişiklikte odak ve duyurular, önbellekten dönüş, ' +
    'Dinle (dokunmatik/masaüstü), Ctrl+A, eşitleme beklemesi, odaksız yazma, Kelimeler destesi; ' +
    'axe ve taşma açık/koyu 375/1280, sayfa hatası yok.');
}
main().catch(error => {
  console.error(error.message || error);
  if (process.env.GITHUB_ACTIONS) {
    const detail = String(error.stack || error).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
    console.error('::error title=Oyunlar Browser QA::' + detail);
  }
  server.close(); process.exitCode = 1;
});
