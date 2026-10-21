'use strict';
// Yalıtılmış Chromium profilleri ve yalnız localhost: gerçek kullanıcı verisine dokunmaz.
// Varsayılan: HTML'deki gerçek release varlıkları. Yayın üretmeden kaynak denetimi:
// YDS_KALIP_CANONICAL=1 node tools/kalip-calisma-browser-qa.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const canonical = process.env.YDS_KALIP_CANONICAL === '1';
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server = http.createServer((req, res) => {
  let url;
  try { url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  if (canonical) url = url.replace(/^\/releases\/[a-f0-9]+\//, '/');
  const file = path.resolve(root, '.' + url);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, {'Content-Type':(mime[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
});
const SESSION = 'yds-kalip-tur-v1';
const PREFIX = 'yds-kalip-calisma-v1:';
const odak = page => page.evaluate(() => document.activeElement.id || document.activeElement.tagName);
const tur = page => page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), SESSION);
const soru = page => page.evaluate(key => {
  const t = JSON.parse(sessionStorage.getItem(key));
  return window.KALIP_CALISMA.sorular.find(s => s.id === t.ids[t.sira]);
}, SESSION);

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true,args:['--explicitly-allowed-ports='+server.address().port]});
  const contexts = [], errors = [], failures = [];
  let passed = 0, inspected = 0;
  async function yeni(options = {}) {
    const context = await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',timezoneId:'Europe/Istanbul'});
    contexts.push(context);
    await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    if (options.block) await context.route(options.block, route => route.abort());
    await context.addInitScript(() => {
      window.addEventListener('storage', e => { if (window.__qaStorageEventBlocked) e.stopImmediatePropagation(); }, true);
      const set = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
      Storage.prototype.setItem = function (k, v) {
        if ((this === localStorage && window.__qaFailLocal && k.startsWith('yds-kalip-')) ||
            (this === sessionStorage && window.__qaFailSession && k === 'yds-kalip-tur-v1')) throw new DOMException('QA quota', 'QuotaExceededError');
        return set.call(this, k, v);
      };
      Storage.prototype.removeItem = function (k) {
        if (this === sessionStorage && window.__qaFailSession && k === 'yds-kalip-tur-v1') throw new DOMException('QA quota', 'QuotaExceededError');
        return remove.call(this, k);
      };
    });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/oyunlar.html' + (options.hash === false ? '' : '#kalip'));
    if (!options.block) await page.waitForFunction(() => !document.getElementById('kalipHazir').hidden);
    return {context,page};
  }
  async function dene(name, fn) {
    if(process.env.YDS_KALIP_TEST && !name.includes(process.env.YDS_KALIP_TEST)) return;
    try { await fn(); passed++; console.log('OK ' + name); }
    catch (e) {
      failures.push({name,error:e.stack || String(e)}); console.error('FAIL ' + name + '\n' + (e.stack || e));
      if(process.env.GITHUB_ACTIONS) {
        const escape=s=>String(s).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A');
        console.error('::error title='+escape(name).replace(/,/g,'%2C').replace(/:/g,'%3A')+'::'+escape(e.stack || e));
      }
    }
  }
  async function baslat(page, type = 'karma', count = '5', word = '') {
    await page.locator('#kalipTur').selectOption(type);
    await page.locator('#kalipKapsam').selectOption('hepsi');
    await page.locator('#kalipAdet').selectOption(count);
    await page.locator('#kalipAra').fill(word);
    await page.locator('#kalipBaslat').click();
    await page.locator('#kalipTurAlani').waitFor({state:'visible'});
  }
  async function yanit(page, s, correct = true) {
    const choice = correct ? s.cevap : (s.cevap + 1) % s.secenekler.length;
    await page.locator('#kalipSiklar input[value="' + choice + '"]').check();
    await page.locator('#kalipKontrol').click();
    assert.equal(await page.locator('#kalipSonuc').innerText(), correct ? 'Doğru.' : 'Bu cevap uygun değil. Doğru cevap: ' + s.secenekler[s.cevap]);
    assert.equal(await odak(page), 'kalipSonuc');
  }
  async function odakGorunur(page,id,label) {
    const r=await page.locator('#'+id).evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:innerHeight};});
    assert.ok(r.top >= -1 && r.bottom <= r.height + 1,label+': odaklanan başlık ekranda olmalı '+JSON.stringify(r));
  }
  async function durum(page, label, axe = false) {
    const geometry = await page.evaluate(() => {
      const panel = document.getElementById('kalipPaneli');
      const escaped = [...panel.querySelectorAll('*')].filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.left < -1 || r.right > innerWidth + 1);
      }).map(el => el.id || el.tagName + '.' + el.className);
      return {width:innerWidth,scroll:document.documentElement.scrollWidth,escaped};
    });
    assert.ok(geometry.scroll <= geometry.width + 1, label + ': yatay taşma ' + JSON.stringify(geometry));
    assert.deepEqual(geometry.escaped, [], label + ': panel dışına taşan içerik');
    if (axe) {
      if (!await page.evaluate(() => !!window.axe)) await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
      const violations = await page.evaluate(async () => (await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v => ({id:v.id,nodes:v.nodes.map(n => n.target)})));
      assert.deepEqual(violations, [], label + ': erişilebilirlik');
    }
  }
  try {
    await dene('ayrı bölüm seçimi, bağlantı ve kelime oyununun yazılı cevabı korunur', async () => {
      const {context,page} = await yeni({hash:false});
      // Hazır alıştırma öğesi üst bölüm gizliyken de DOM'dadır.
      await page.locator('#oyunKart').waitFor({state:'visible'});
      await page.locator('#oyunGirdi').fill('ab');
      const old = await page.locator('#oyunHarfler').innerText();
      await page.locator('#kalipAc').focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('#kalipAc').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#yazmaPaneli').isVisible(), false);
      assert.ok(page.url().endsWith('#kalip'));
      await baslat(page, 'anlam'); await yanit(page, await soru(page));
      await page.locator('#yazmaAc').click();
      assert.equal(await page.locator('#oyunGirdi').inputValue(), 'ab');
      assert.equal(await page.locator('#oyunHarfler').innerText(), old);
      await page.locator('#kalipAc').click();
      assert.equal(await page.locator('#kalipSonuc').innerText(), 'Doğru.');
      await context.close();
    });

    await dene('160 soru: üç türün tüm metni, seçenekleri, yanıtı, karşılaştırması ve tur sonucu', async () => {
      const {context,page} = await yeni();
      const counts = await page.evaluate(() => Object.fromEntries(['anlam','edat','yapi'].map(t => [t,KALIP_CALISMA.sorular.filter(s => s.tur === t).length])));
      assert.deepEqual(counts, {anlam:50,edat:60,yapi:50});
      for (const type of ['anlam','edat','yapi']) {
        await baslat(page, type, 'hepsi');
        const state = await tur(page), seen = new Set();
        assert.equal(state.ids.length, counts[type]);
        for (let i = 0; i < state.ids.length; i++) {
          const s = await soru(page); assert.equal(s.tur,type); assert.ok(!seen.has(s.id)); seen.add(s.id);
          assert.equal(await page.locator('#kalipCumle').innerText(),s.cumle);
          assert.equal(await page.locator('#kalipSoru').innerText(),s.soru);
          const texts = await page.locator('#kalipSiklar label > span').allTextContents();
          assert.deepEqual(texts.slice().sort(),s.secenekler.slice().sort());
          await yanit(page,s);
          assert.equal(await page.locator('#kalipSiklar input').first().isDisabled(),true);
          assert.equal(await page.locator('#kalipTamCumle').innerText(),s.tamamlanmis);
          assert.equal(await page.locator('#kalipCeviri').innerText(),s.ceviri);
          assert.equal(await page.locator('#kalipAciklama').innerText(),s.aciklama);
          assert.equal(await page.locator('#kalipDogruKalip b').innerText(),s.kalip.en);
          assert.equal(await page.locator('#kalipDogruKalip i').innerText(),s.kalip.tr);
          if (type === 'yapi') assert.equal(await page.locator('.kalip-karsilastir > div').count(),s.karsilastirma.length);
          assert.equal(await page.locator('#kalipKaynaklar a').count(),s.kaynaklar.length + 1);
          await page.locator('#kalipSonraki').click(); inspected++;
        }
        assert.equal(await page.locator('#kalipBitisOzet').innerText(),counts[type] + ' soruda ' + counts[type] + ' doğru, 0 tekrar edilecek soru.');
        assert.equal(await odak(page),'kalipBitisBaslik');
        await page.locator('#kalipYeniTur').click();
      }
      assert.match(await page.locator('#kalipIlerleme').innerText(),/160 çalışıldı · 0 tekrar gerekiyor/);
      await context.close();
    });

    await dene('boş seçim ve büyük harfli kelime araması; tur uzunluğu havuzla sınırlıdır', async () => {
      const {context,page} = await yeni();
      await page.locator('#kalipKapsam').selectOption('tekrar');
      assert.equal(await page.locator('#kalipBaslat').isDisabled(),true);
      assert.match(await page.locator('#kalipHavuz').innerText(),/tekrar gereken soru yok/);
      await page.locator('#kalipKapsam').selectOption('hepsi');
      await page.locator('#kalipAra').fill('olmayan-qa-kelime');
      assert.equal(await page.locator('#kalipBaslat').isDisabled(),true);
      await baslat(page,'anlam','20','ESTABLISH');
      const t = await tur(page); assert.equal(t.ids.length,2);
      assert.ok(t.ids.every(id => id.startsWith('anlam-establish-')));
      await context.close();
    });

    await dene('kelime kaynak bağlantısı doğru arama ve ayrıntıyı açar; katman/Leitner kaydına yazmaz', async () => {
      const {context,page}=await yeni();
      await page.evaluate(()=>{
        const Y=YDS,k=Y.Veri.dizinKaydi('establish').k;
        Y.Depo.yaz('yds-katmanlar',[k===1?2:1]);
        Y.Ilerleme.dogru('establish','kelime');
      });
      await page.reload(); await page.locator('#kalipHazir').waitFor({state:'visible'});
      await baslat(page,'anlam','hepsi','establish'); await yanit(page,await soru(page));
      const keys=['yds-katmanlar','yds-katman7','yds-leitner'];
      const saved=await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),keys);
      await context.addInitScript(keys=>{
        window.__qaReadonlyWrites=[];
        const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
        Storage.prototype.setItem=function(k,v){if(this===localStorage&&keys.includes(k))window.__qaReadonlyWrites.push(k);return set.call(this,k,v);};
        Storage.prototype.removeItem=function(k){if(this===localStorage&&keys.includes(k))window.__qaReadonlyWrites.push(k);return remove.call(this,k);};
      },keys);
      await page.locator('#kalipCozum summary').click();
      const link=page.getByRole('link',{name:'Kelimeyi sitede ara',exact:true});
      assert.equal(await link.getAttribute('href'),'ara.html?q=establish');
      const opened=page.waitForEvent('popup'); await link.click(); const popup=await opened;
      popup.on('pageerror',e=>errors.push(e.message)); await popup.waitForLoadState('domcontentloaded');
      const url=new URL(popup.url()); assert.equal(url.pathname,'/ara.html'); assert.equal(url.searchParams.get('q'),'establish');
      assert.equal(await popup.locator('#ara').inputValue(),'establish');
      const target=popup.locator('#sonuclar [data-tip="kelime"][data-anahtar="establish"]');
      await target.waitFor({state:'visible'}); await target.click();
      await popup.locator('#kartPerde').waitFor({state:'visible'});
      assert.equal(await popup.locator('#kartIcerik h3').innerText(),'establish');
      assert.deepEqual(await popup.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),keys),saved);
      assert.deepEqual(await popup.evaluate(()=>window.__qaReadonlyWrites),[]);
      await context.close();
    });

    await dene('klavyeyle boş yanıt uyarısı, radyo, gönderim, kaynak açma ve sonraki soru', async () => {
      const {context,page} = await yeni(); await baslat(page,'yapi');
      assert.equal(await odak(page),'kalipSoruBaslik');
      await page.locator('#kalipKontrol').focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('#kalipSecUyari').isVisible(),true);
      assert.equal(await page.evaluate(() => document.activeElement.type),'radio');
      await page.keyboard.press('Space');
      await page.locator('#kalipKontrol').focus(); await page.keyboard.press('Enter');
      assert.equal(await odak(page),'kalipSonuc');
      assert.equal((await tur(page)).cevaplar.length,1);
      const summary = page.locator('#kalipCozum summary');
      await summary.focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('#kalipCozum details').evaluate(el => el.open),true);
      await page.keyboard.press('Space');
      assert.equal(await page.locator('#kalipCozum details').evaluate(el => el.open),false);
      await page.locator('#kalipSonraki').focus(); await page.keyboard.press('Enter');
      assert.equal(await odak(page),'kalipSoruBaslik');
      assert.equal((await tur(page)).sira,1);
      await context.close();
    });

    await dene('yanlış ve gösterilen cevap tekrar listesine girer; doğru çözülünce çıkar', async () => {
      const {context,page} = await yeni(); await baslat(page);
      const ids = (await tur(page)).ids;
      for (let i=0;i<ids.length;i++) {
        if (i === 1) await page.locator('#kalipGoster').click();
        else await yanit(page,await soru(page),i !== 0);
        await page.locator('#kalipSonraki').click();
      }
      assert.equal(await page.locator('#kalipBitisOzet').innerText(),'5 soruda 3 doğru, 2 tekrar edilecek soru.');
      await page.locator('#kalipYanlisTekrar').click();
      assert.deepEqual((await tur(page)).ids.slice().sort(),ids.slice(0,2).sort());
      for(let i=0;i<2;i++){await yanit(page,await soru(page));await page.locator('#kalipSonraki').click();}
      assert.match(await page.locator('#kalipIlerleme').innerText(),/0 tekrar gerekiyor/);
      await page.locator('#kalipYeniTur').click(); await page.locator('#kalipKapsam').selectOption('tekrar');
      assert.equal(await page.locator('#kalipBaslat').isDisabled(),true);
      await context.close();
    });

    await dene('ara ver, devam ve yenileme: sıra/şık düzeni/işlenmiş cevap korunur', async () => {
      const {context,page} = await yeni(); await baslat(page,'edat');
      const initial = await tur(page);
      await page.locator('#kalipAraVer').click();
      assert.equal(await odak(page),'kalipDevam');
      await page.locator('#kalipDevam').click();
      assert.deepEqual(await tur(page),initial);
      await yanit(page,await soru(page),false);
      const answered = await tur(page), result = await page.locator('#kalipSonuc').innerText();
      await page.reload(); await page.locator('#kalipCozum').waitFor({state:'visible'});
      assert.deepEqual(await tur(page),answered);
      assert.equal(await page.locator('#kalipSonuc').innerText(),result);
      assert.equal(await page.locator('#kalipSiklar input').first().isDisabled(),true);
      await page.locator('#kalipSonraki').click();
      const next = await tur(page); await page.reload();
      await page.locator('#kalipTurAlani').waitFor({state:'visible'});
      assert.deepEqual(await tur(page),next);
      assert.equal(await page.locator('#kalipCozum').isVisible(),false);
      await context.close();
    });

    await dene('bozuk/eski banka ait yarım tur güvenle atlanır', async () => {
      const {context,page} = await yeni();
      for(const value of ['{bozuk',JSON.stringify({v:1,bank:'eski',ids:['yok'],sira:0})]) {
        await page.evaluate(({key,value})=>sessionStorage.setItem(key,value),{key:SESSION,value});
        await page.reload(); await page.locator('#kalipAyar').waitFor({state:'visible'});
        assert.equal(await page.locator('#kalipDevam').isVisible(),false);
      }
      await context.close();
    });

    await dene('yerel saklama hatası görünür; oturumdaki sonuç korunur ve sonra yazılır', async () => {
      const {context,page} = await yeni(); await baslat(page,'anlam');
      const s = await soru(page);
      await page.evaluate(()=>{window.__qaFailLocal=true;}); await yanit(page,s,false);
      assert.match(await page.locator('#kalipKayitUyari').innerText(),/yalnız bu oturumda/);
      assert.equal(await page.evaluate(id=>YDS.KalipCalismaKayit.oku(KALIP_CALISMA)[id].sonuc,s.id),'yanlis');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),PREFIX+s.id),null);
      await page.evaluate(()=>{window.__qaFailLocal=false;});
      await page.locator('#kalipAraVer').click(); await baslat(page,'edat');
      assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).sonuc,PREFIX+s.id),'yanlis');
      assert.equal(await page.locator('#kalipKayitUyari').isVisible(),false);
      await context.close();
    });

    await dene('yarım tur saklanamazsa uyarı verilir; mevcut soru yine tamamlanabilir', async () => {
      const {context,page} = await yeni(); await baslat(page);
      const s=await soru(page); await page.evaluate(()=>{window.__qaFailSession=true;});
      await yanit(page,s);
      assert.match(await page.locator('#kalipKayitUyari').innerText(),/Yarım tur saklanamadı/);
      await page.locator('#kalipSonraki').click();
      assert.equal(await page.locator('#kalipSayac').innerText(),'Soru 2 / 5');
      await page.evaluate(()=>{window.__qaFailSession=false;});
      await page.locator('#kalipAraVer').click();
      assert.equal(await page.locator('#kalipKayitUyari').isVisible(),false);
      assert.equal((await tur(page)).sira,1);
      await context.close();
    });

    await dene('yerel kayıt hatası sonrası reload ilk cevabı sonraki başarıda sessizce kaybetmez', async () => {
      const {context,page}=await yeni(); await baslat(page,'anlam');
      const first=await soru(page);
      await page.evaluate(()=>{window.__qaFailLocal=true;}); await yanit(page,first,false);
      await page.reload(); await page.locator('#kalipCozum').waitFor({state:'visible'});
      await page.locator('#kalipSonraki').click(); await yanit(page,await soru(page));
      const records=await page.evaluate(()=>YDS.KalipCalismaKayit.oku(KALIP_CALISMA));
      assert.equal(records[first.id]?.sonuc,'yanlis','Oturumdan geri gelen ilk cevap kalıcı yazma düzeldiğinde kaybolmamalı');
      assert.equal(Object.keys(records).length,2);
      await context.close();
    });

    await dene('sıfırlama iptali ve depolama hatası mevcut turu/cevabı silmez', async () => {
      const {context,page} = await yeni(); await baslat(page); await yanit(page,await soru(page));
      const previous=await tur(page);
      await page.locator('.kalip-bilgi summary').click();
      page.once('dialog',d=>d.dismiss()); await page.locator('#kalipSifirla').click();
      assert.deepEqual(await tur(page),previous);
      await page.evaluate(()=>{window.__qaFailLocal=true;});
      page.once('dialog',d=>d.accept()); await page.locator('#kalipSifirla').click();
      assert.deepEqual(await tur(page),previous);
      assert.equal(await page.locator('#kalipKayitUyari').isVisible(),true);
      await context.close();
    });

    await dene('gerçek iki sekme: ayrı cevaplar birleşir, reset açık tur ve odağı temizler', async () => {
      const {context,page} = await yeni(); await baslat(page,'anlam','20','establish');
      const second=await context.newPage(); second.on('pageerror',e=>errors.push(e.message));
      await second.goto(base+'/oyunlar.html#kalip'); await second.locator('#kalipHazir').waitFor({state:'visible'});
      await baslat(second,'edat');
      await yanit(page,await soru(page),false); await yanit(second,await soru(second));
      await page.waitForFunction(()=>Object.keys(YDS.KalipCalismaKayit.oku(KALIP_CALISMA)).length===2);
      assert.match(await page.locator('#kalipIlerleme').innerText(),/2 çalışıldı/);
      await page.locator('#kalipSonraki').focus();
      await second.locator('.kalip-bilgi summary').click();
      second.once('dialog',d=>d.accept()); await second.locator('#kalipSifirla').click();
      await page.locator('#kalipAyar').waitFor({state:'visible'});
      assert.equal(await odak(page),'kalipTur');
      assert.equal(await tur(page),null);
      assert.match(await page.locator('#kalipIlerleme').innerText(),/0 çalışıldı/);
      await context.close();
    });

    await dene('reset olayı gecikse bile eski tur cevap yazarak kaydı geri getirmez', async () => {
      const {context,page} = await yeni(); await baslat(page);
      const s=await soru(page); await page.evaluate(()=>{window.__qaStorageEventBlocked=true;});
      const second=await context.newPage(); await second.goto(base+'/oyunlar.html#kalip');
      await second.locator('#kalipHazir').waitFor({state:'visible'});
      await second.evaluate(()=>YDS.KalipCalismaKayit.sifirla());
      await page.locator('#kalipSiklar input[value="'+s.cevap+'"]').check(); await page.locator('#kalipKontrol').click();
      assert.equal(await page.locator('#kalipAyar').isVisible(),true);
      assert.equal(await page.evaluate(()=>Object.keys(YDS.KalipCalismaKayit.oku(KALIP_CALISMA)).length),0);
      assert.equal(await tur(page),null);
      await context.close();
    });

    for(const seeded of [false,true]) await dene('bekleyen eski yanlış başka sekmenin '+(seeded?'tekrar ':'')+'doğrusunu ezmez'+(seeded?' (reload)':''), async () => {
      const {context,page}=await yeni(); await baslat(page,'anlam');
      const s=await soru(page);
      if(seeded) await page.evaluate(id=>YDS.KalipCalismaKayit.yaz(KALIP_CALISMA.sorular.find(s=>s.id===id),true),s.id);
      const second=await context.newPage(); second.on('pageerror',e=>errors.push(e.message));
      await second.goto(base+'/oyunlar.html#kalip'); await second.locator('#kalipHazir').waitFor({state:'visible'});
      // Aynı soruyu açmak için geçerli tek soruluk tur; cevaplar gerçek formdan verilir.
      await second.evaluate(id=>{
        const Y=YDS,s=KALIP_CALISMA.sorular.find(s=>s.id===id);
        sessionStorage.setItem(Y.KalipCalismaKayit.sessionKey,JSON.stringify(Y.KalipCalismaHesap.kur(KALIP_CALISMA,[s],1,Y.KalipCalismaKayit.epoch())));
      },s.id);
      await second.reload(); await second.locator('#kalipTurAlani').waitFor({state:'visible'});
      await page.evaluate(()=>{window.__qaFailLocal=true;window.__qaStorageEventBlocked=true;}); await yanit(page,s,false);
      await yanit(second,s,true);
      const newer=await second.evaluate(key=>localStorage.getItem(key),PREFIX+s.id);
      if(seeded) { await page.reload(); await page.locator('#kalipCozum').waitFor({state:'visible'}); }
      await page.evaluate(()=>{window.__qaFailLocal=false;YDS.KalipCalismaKayit.tekrarYaz();});
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),PREFIX+s.id),newer,'Bekleyen eski yanlış sonraki doğru işlemini değiştirmemeli');
      assert.equal(await page.evaluate(id=>YDS.KalipCalismaKayit.oku(KALIP_CALISMA)[id].sonuc,s.id),'dogru');
      await context.close();
    });

    await dene('kalıp cevabı ve sıfırlama kelime kutusu/günlük oyun verisini değiştirmez', async () => {
      const {context,page} = await yeni();
      await page.waitForFunction(()=>!document.getElementById('oyunKart').hidden);
      const previous=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>/leitner|oyun|katman/.test(k)).map(k=>[k,localStorage.getItem(k)])));
      await baslat(page); await yanit(page,await soru(page),false);
      await page.locator('.kalip-bilgi summary').click(); page.once('dialog',d=>d.accept()); await page.locator('#kalipSifirla').click();
      assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>/leitner|oyun|katman/.test(k)).map(k=>[k,localStorage.getItem(k)]))),previous);
      await context.close();
    });

    for(const blocked of [false,true]) await dene('ayarlar genel sıfırlama: '+(blocked?'kayıt modülü yoksa sahte başarı bildirilmez':'kalıp cevapları ve tur temizlenir'),async()=>{
      const {context,page}=await yeni(); await baslat(page); const s=await soru(page); await yanit(page,s,false);
      const saved=await page.evaluate(key=>localStorage.getItem(key),PREFIX+s.id);
      if(blocked) await context.route(/\/assets\/js\/kalip-calisma-kayit\.js(?:\?.*)?$/,route=>route.abort());
      await page.goto(base+'/ayarlar.html');
      let confirmations=0; page.on('dialog',d=>{confirmations++;d.accept();});
      await page.locator('#yerelSil').click();
      assert.equal(confirmations,2);
      const text=await page.locator('#ayarDurum').innerText();
      if(blocked) {
        assert.match(text,/Kalıp kayıtları silinemedi/);
        assert.doesNotMatch(text,/Kalıp çalışma kayıtları da sıfırlandı/);
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),PREFIX+s.id),saved);
      } else {
        assert.match(text,/Kalıp çalışma kayıtları da sıfırlandı/);
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),PREFIX+s.id),null);
        assert.equal(await tur(page),null);
      }
      await context.close();
    });

    for (const asset of ['data/kalip-calisma.js','assets/js/kalip-calisma.js','assets/js/kalip-calisma-hesap.js']) {
      await dene(asset+' yüklenmese de hata ve kelime bölümü kullanılabilir', async () => {
        const block=new RegExp('/'+asset.replace(/[.]/g,'\\.')+'(?:\\?.*)?$');
        const {context,page}=await yeni({block});
        await page.locator('#kalipYukHata').waitFor({state:'visible'});
        assert.equal(await page.locator('#kalipYuk').isVisible(),false);
        await page.locator('#yazmaAc').click(); await page.locator('#oyunKart').waitFor({state:'visible'});
        assert.equal(await page.locator('#kalipPaneli').isVisible(),false);
        await context.close();
      });
    }

    await dene('320/390/1280 px × açık/koyu × normal/%200 metin: ayar, soru, sonuç ve kaynaklar', async () => {
      const {context,page}=await yeni();
      for(const width of [320,390,1280]) for(const theme of ['light','dark']) for(const scale of [100,200]) {
        const label=width+' '+theme+' '+scale+'%';
        await page.setViewportSize({width,height:844});
        await page.evaluate(({theme,scale})=>{document.documentElement.dataset.theme=theme;document.documentElement.style.fontSize=scale+'%';},{theme,scale});
        await durum(page,label+' ayar',true);
        await baslat(page,'yapi','hepsi','remember');
        await odakGorunur(page,'kalipSoruBaslik',label+' başlat');
        await durum(page,label+' soru');
        await yanit(page,await soru(page),false);
        await odakGorunur(page,'kalipSonuc',label+' cevap');
        await page.locator('#kalipCozum summary').click();
        await durum(page,label+' cevap',true);
        if(process.env.YDS_KALIP_EKRAN_DIR) {
          fs.mkdirSync(process.env.YDS_KALIP_EKRAN_DIR,{recursive:true});
          await page.screenshot({path:path.join(process.env.YDS_KALIP_EKRAN_DIR,'kalip-'+width+'-'+theme+'-'+scale+'.png'),fullPage:true});
        }
        await page.locator('#kalipSonraki').click();
        await odakGorunur(page,'kalipSoruBaslik',label+' sonraki soru');
        await page.locator('#kalipAraVer').click();
      }
      await context.close();
    });
    assert.deepEqual(errors,[],'Yakalanmamış sayfa hataları');
    console.log(JSON.stringify({mode:canonical?'canonical':'release',passed,failed:failures.length,questions:inspected}));
    if(failures.length) throw new Error(failures.length+' kalıp tarayıcı senaryosu başarısız.');
  } finally {
    await Promise.all(contexts.map(c=>c.close().catch(()=>{})));
    await browser.close(); await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;server.close();});
