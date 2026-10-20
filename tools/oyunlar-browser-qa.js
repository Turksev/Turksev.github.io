'use strict';
// Oyunlar sayfası (oyunlar.html) tarayıcı denetimi. Geçici tarayıcı profili ve yerel sunucu
// kullanır; gerçek kullanıcı verisine, buluta veya yayındaki siteye dokunmaz. Depoyu olduğu
// gibi sunar: sayfa düz assets/… yollarıyla da, /releases/<sürüm>/… yollarıyla da çalışır.
// Beklenen kelimeler sabit yazılmaz; sayfanın kendi verisinden (YDS.Veri, YDS.OyunHesap,
// YDS.Ilerleme) türetilir. Deste senaryoları Kelimeler sayfasını (kelimeler.html) da açar: oyunda
// yanıtlanan kartın oradaki desteden düşmesi bu oyunla ulaşılabilir olduğu için burada sınanır.
// Bir senaryo gerçek eşitleme motorunu bellek içi sahte Firebase SDK'sıyla (tools/sahte-firebase.js) koşar.
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
// Açılıştaki bulut birleşimi sürerken bekletilen cevabın iletileri; bekleme bitmeden sayfa yeniden açılırsa
// yeni açılışta gösterilen not.
const BEKLE_KONTROL = 'Eşitleniyor; bitince kontrol edilecek.', BEKLE_PAS = 'Eşitleniyor; bitince cevap gösterilecek.';
// "Bir harf aç" yazılanı açılan harfin önünde kestiğinde iletinin sonuna eklenen, yalnız ekran okuyucunun okuduğu metin.
const KESILDI = ' Bu harften sonra yazdıkların silindi; buradan devam et.';
const YARIM_BEKLEME_NOTU = 'Eşitleme sırasında sayfa yenilendi; az önce verdiğin cevap işlenmedi.';
// Birleşim tam bekleyen kelimenin kaydını değiştirdiyse bekleme bittiğinde gösterilen ileti (cevap işlenmez).
const KAYIT_DEGISTI_NOTU = 'Eşitleme bu kelimenin kaydını değiştirdi; cevabın işlenmedi.';
// Bellek içi sahte Firebase SDK'sı (tools/sahte-firebase.js): gerçek eşitleme motoru onunla, yalıtılmış bağlamda koşar.
const SAHTE_FIREBASE = require('./sahte-firebase');
const BULUT_LEITNER_BELGESI = 'kullanicilar/qa-u1/alanlar/yds-leitner';
// Kelimeler sayfasında deste bitince liste sayacının (#sayac, role=status) okuduğu ileti.
const DESTE_BITTI = 'Bugünün destesi bitti. Yarın yeni tekrarlar açılacak.';
// Kelimenin rozeti: hiç çalışılmamış (0. kutu) ve 3. kutu. duzen: __oyun.duzen çıktısı; açık harf çıkmayan kısa
// kelimede rozet yüzde yerine "kısa kelime: harf yok" der.
const ROZET = {0: 'Seviye 1 · harflerin %50\'si açık', 3: 'Seviye 4 · harflerin %20\'si açık'};
const rozet = (kutu, duzen) => (duzen.acik.length ? ROZET[kutu] : 'Seviye ' + (kutu + 1) + ' · kısa kelime: harf yok');
// Duyuru bölgesi 80 ms gecikmeyle yazılır (oyunlar.js duyur()); "cevaptan sonra yazılmadı" demeden önce sayfanın
// saati bu kadar ilerletilir: daha geç (ör. 300 ms sonra) yazan bir kod da görülsün.
const DUYURU_SONRASI_MS = 1000;

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
    // Gizli kutuların harfleri, sırayla (kelimenin tamamı yazılır; bu yalnız gizli harfleri sayar ve seçer).
    eksik: w => T.hucreler().map((el, i) => (el.classList.contains('bos') ? w[i].toLowerCase() : '')).join(''),
    // Gizli kutuların harf sırası (kelimenin harfleri içinde, ayraçlar sayılmadan): yazılanın o konumu gizli harfe düşer.
    gizliSira: () => T.hucreler().filter(el => !el.classList.contains('ayrac')).map((el, i) => (el.classList.contains('bos') ? i : -1)).filter(i => i >= 0),
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
    },
    // Durum satırının sınıfı (ileti türü: boş, ok, uyari, err).
    durumSatiriSinifi: () => document.getElementById('oyunDurum').className,
    // Kelimenin depodaki (bellekteki kopya değil) Leitner kaydı.
    leitnerDepoKaydi: w => {
      const r = (Y().Depo.oku('yds-leitner', {}) || {})[Il().ilerlemeKimligi(w, 'kelime')];
      return r ? {k: r.k, g: r.g, c: r.c} : null;
    },
    // Sahte buluttaki Leitner belgesinden kelimenin kaydı: {v: değer, m: sürüm damgası "zaman:cihaz"}.
    bulutLeitnerKaydi: (yol, w) => {
      const belge = window.__qaBulut && window.__qaBulut.belge(yol);
      if (!belge) return null;
      const r = Y().EsitlemeMotoru.bulutAlaniniCoz('yds-leitner', JSON.parse(belge.json)).i[Il().ilerlemeKimligi(w, 'kelime')];
      return r ? {v: r.v || null, m: r.m} : null;
    },
    // Kelimeler sayfasının (kelimeler.html) görünen durumu; yalnız DOM'dan okunur. suzgec: arama, tür
    // ve durum alanları ekranda mı (deste açıkken gizlenir; olağan kart ve liste modunda görünür).
    desteGor: () => {
      const g = id => document.getElementById(id), gorunur = id => !!g(id) && g(id).getClientRects().length > 0;
      return {
        on: g('kartOn').textContent, kutu: g('kartKutu').textContent, sayac: g('kartSayac').textContent,
        alan: !g('kartAlan').hidden, arka: !g('kartArka').hidden, liste: !g('liste').hidden, mod: g('mod').textContent,
        durum: g('sayac').textContent, dugme: g('desteBasla').textContent, bilgi: g('desteBilgi').textContent,
        kutular: [...document.querySelectorAll('#kutular .kutu b')].map(b => Number(b.textContent)),
        not: g('bekleyenNot').hidden ? null : g('bekleyenNot').textContent, dagit: gorunur('yigiiniDagit'),
        suzgec: ['ara', 'tip', 'durum'].map(gorunur), geriAl: gorunur('geriAl')
      };
    },
    // Kelimeler'in havuzu: verilen katmanlardaki bütün kelimeler (oyun dışı olanlar da), dizin sırasıyla.
    desteHavuz: katmanlar => Y().Veri.dizin.filter(d => katmanlar.includes(d.k)).map(d => d.e),
    // Depodaki güncel kayıtlar, verilen kelimelerin sırasıyla ({k, g, c} ya da null). Bu sekmenin
    // bellekteki ilerleme kopyasına dokunmaz: olayı ulaşmamış başka sayfa yazımını da gösterir.
    desteDepo: kelimeler => {
      const L = Y().Depo.oku('yds-leitner', {});
      return kelimeler.map(w => { const r = L[Il().ilerlemeKimligi(w, 'kelime')]; return r ? {k: r.k, g: r.g, c: r.c} : null; });
    },
    // Depoya göre bugün tekrar vadesi gelmiş (1-4. kutu, günü gelmiş) kelimeler, dizin sırasıyla.
    desteVadeliler: katmanlar => {
      const b = Il().bugun(), ws = T.desteHavuz(katmanlar), kayit = T.desteDepo(ws);
      return ws.filter((w, i) => !!kayit[i] && kayit[i].k < 5 && kayit[i].g <= b);
    },
    // "Birikmiş tekrarları günlere dağıt" (Il.birikmisiYay) vadesi geçmiş kayıtları en eski vade önce,
    // eşitlikte deponun kayıt sırasıyla dizer ve ilk "tavan" kadarını bugünde bırakır. Verilen kelimelerden
    // bugünde KALMAYACAK olanları döndürür. Yalnız düzenek seçimi içindir: sonuç dağıtımdan sonra depodan doğrulanır.
    desteTasinacak: (kelimeler, tavan) => {
      const L = Y().Depo.oku('yds-leitner', {}), b = Il().bugun();
      const sirali = Object.keys(L).filter(id => L[id].k < 5 && L[id].g <= b).sort((x, y) => L[x].g - L[y].g);
      const kalacak = new Set(sirali.slice(0, tavan));
      return kelimeler.filter(w => !kalacak.has(Il().ilerlemeKimligi(w, 'kelime')));
    },
    // Deste özetinin beklenen hâli, bu sayfanın bellekteki ilerlemesinden (ilerlemeyi yazan sayfada
    // çağrılır: onun kopyası günceldir). Kelimeler sayfasının çizdiği üç yer: bilgi satırı, kutular, düğme.
    // Destede en az bir kart varken geçerlidir (boş destede düğmenin metni başkadır).
    desteOzet: katmanlar => {
      const ws = T.desteHavuz(katmanlar), o = Il().leitnerOzet(ws.map(w => ({en: w})), 'kelime');
      return {bilgi: o.calisilan + '/' + ws.length + ' kelimeye başlandı · ' + o.ogrenilen + ' öğrenildi',
        kutular: [o.k0, o.k1, o.k2, o.k3, o.k4, o.k5], dugme: 'Bugünü çalış (' + o.bugun + ' kart)',
        // Liste sayacının (#sayac) ilerlemeden gelen sonu.
        sayacSonu: ' · öğrenilen ' + o.ogrenilen + ' · bugün ' + o.gosterilecekTekrar + ' tekrar + ' + o.acilacakYeni + ' yeni'};
    },
    // Girdinin açıklaması (aria-describedby'ın gösterdiği öğeler) cevabı içeriyor mu? Her metin düğümüne
    // duyuruSizinti ile aynı kural uygulanır: bütün sözcük ya da sayfanın kendi maskesinin gizleyeceği yer.
    aciklamaSizinti: w => {
      const kimlikler = (document.getElementById('oyunGirdi').getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean), bulunan = [];
      const tam = new RegExp('(^|[^a-z])' + w.toLowerCase().replace(/[- ]/g, '[- ]?') + '($|[^a-z])');
      if (!kimlikler.length) bulunan.push('aria-describedby boş');
      kimlikler.forEach(kimlik => {
        const el = document.getElementById(kimlik);
        if (!el) { bulunan.push('açıklama öğesi yok: ' + kimlik); return; }
        const yuru = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let d; (d = yuru.nextNode());) {
          if (tam.test(d.data.toLowerCase())) bulunan.push(kimlik + ' sözcük: ' + d.data);
          if (O().maskele(d.data, w) !== d.data) bulunan.push(kimlik + ' maske: ' + O().maskele(d.data, w));
        }
      });
      return bulunan;
    },
    // Kelimenin kaydını depoya doğrudan yazar: başka sekmenin ya da cihazın yazımı gibi (sayfanın cevap
    // yolundan geçmez). Kutu verilen, vadesi bugün; bu belgenin bellekteki kopyası da yenilenir.
    kayitKoy: (w, kutu) => {
      const kayit = {};
      kayit[Il().ilerlemeKimligi(w, 'kelime')] = {k: kutu, g: Il().bugun(), c: Il().bugun() - 7, m: 0};
      const yazildi = Y().Depo.kayitlariYaz('yds-leitner', kayit);
      Il().tazele();
      return yazildi;
    },
    // Kelimenin verilen kutuda bugün açık gelen harf konumları, gizli harf sayısı (bos) ve bir üst kutuda açık harf sayısı.
    duzen: (w, kutu) => {
      const n = O().harfSayisi(w), acik = O().acikKonumlar(w, kutu, Il().bugun());
      return {acik, bos: n - acik.length, sonrakiAcik: O().acikSayisi(n, kutu + 1)};
    },
    // Kartın öznitelik değerlerinde cevap tam sözcük olarak geçiyor mu? sizinti, oyunlar.html'de baştan duran
    // öznitelikleri saymaz (başka kartlarda rastlantıyla tutarlar: class="q-head", enterkeyhint="done"); başlığı
    // arayüz metninde geçebilen kartta (enter) onlar da aranır: sabit bir placeholder ya da title cevabı söylerdi.
    oznitelikSizinti: w => {
      const tam = new RegExp('(^|[^a-z])' + w.toLowerCase().replace(/[- ]/g, '[- ]?') + '($|[^a-z])');
      return [...document.querySelectorAll('#oyunKart, #oyunKart *')].flatMap(el => [...el.attributes]
        .filter(a => tam.test(a.value.toLowerCase())).map(a => (el.id || el.tagName.toLowerCase()) + ' ' + a.name + '=' + a.value));
    },
    // Öğe ekranın (görünüm alanının) tamamen dışında mı; sayfanın kaydırma konumu.
    ekranDisi: kimlik => {
      const r = document.getElementById(kimlik).getBoundingClientRect();
      return {disarida: r.height > 0 && (r.top >= innerHeight || r.bottom <= 0), ust: Math.round(r.top), alt: Math.round(r.bottom), boy: innerHeight, kaydirma: scrollY};
    },
    // Bekleme yardımcılarının zaman aşımı iletisi için ekranın kısa özeti (bekleyerek). b beklenendir:
    // {w, taze} | {durum} | {duyuru} | {w, kutu}. Boş kutu "_" ile gösterilir. Oyun kartı olmayan sayfada
    // (kelimeler.html) yalnız adres ve sorulan kelimenin kutusu döner.
    beklemeOzeti: b => {
      const g = id => document.getElementById(id), yazi = id => JSON.stringify(g(id) ? g(id).textContent : null);
      const ayrac = c => c === '-' || c === ' ', out = [];
      if (b && b.w && 'kutu' in b) out.push(JSON.stringify(b.w) + ' şimdi ' + Il().kutu(b.w, 'kelime') + '. kutuda');
      if (!g('oyunKart')) return out.concat('sayfa ' + location.pathname + ' (oyun kartı yok)').join(' | ');
      if (b && b.w && b.taze) {
        const kutu = Il().kutu(b.w, 'kelime'), acik = O().acikKonumlar(b.w, kutu, Il().bugun());
        out.push('beklenen kutular ' + JSON.stringify([...b.w].map((c, i) => (ayrac(c) || acik.includes(i) ? c : '_')).join('')) + ' (' + kutu + '. kutu)');
      }
      out.push(g('oyunKart').hidden
        ? 'kart gizli' + (g('oyunBos').hidden ? '' : ', boş durum ' + yazi('oyunBos'))
        : 'kutular ' + JSON.stringify(T.hucreler().map(el => (el.classList.contains('ayrac') ? el.textContent.replace(String.fromCharCode(160), ' ') : el.textContent || '_')).join('')) +
          ' (' + g('oyunSeviye').textContent + ' / ' + g('oyunKutu').textContent + ')');
      out.push('#oyunDurum ' + yazi('oyunDurum'), '#oyunDuyuru ' + yazi('oyunDuyuru'), 'sıra ' + yazi('oyunSira'));
      return out.join(' | ');
    },
    // Yerleşim ölçüleri (senaryo 16). Sorular yazı tipinden bağımsızdır: tur düğmeleri aynı satırda mı ve yazıları
    // sığıyor mu, ara başlık yer tutuyor mu, giriş cümlesinin eki çiziliyor mu, sıra satırındaki bağlantı sıra
    // bilgisinin son satırına sığdığı hâlde alta inmiş mi; oyundaki düğmelerin boyu, kelime kartının ve sıradan bir
    // kartın (katman seçici) üst dolgusu.
    yerlesimOlcusu: () => {
      const q = s => document.querySelector(s), duz = s => s.replace(/\s+/g, ' ').trim();
      const kutu = el => { const r = el.getBoundingClientRect(); return {ust: Math.round(r.top), alt: Math.round(r.bottom), sol: Math.round(r.left), sag: Math.round(r.right)}; };
      const bolum = q('section.oyun'), baslik = q('#oyunBaslik'), mod = q('.oyun-mod'), ek = q('.oyun-giris-ek'), giris = ek.closest('p');
      const bilgi = q('.oyun-bilgi'), bag = bilgi.querySelector('a'), stil = getComputedStyle(bilgi), b = baslik.getBoundingClientRect();
      // Sıra bilgisinin satırları: metin aralığının kutuları (öge blok kutusu olsa da satır başına bir kutu verir).
      const aralik = document.createRange();
      aralik.selectNodeContents(q('#oyunSira'));
      const satirlar = [...aralik.getClientRects()].filter(r => r.width > 0), son = satirlar[satirlar.length - 1];
      // Bağlantının da kutusu değil yazısı ölçülür: bağlantı blok ya da ızgara ögesi yapılırsa kutusu paragraf kadar
      // genişler, "son satıra sığar mı" sorusu hep "hayır" çıkar ve kural hiçbir şey söylemezdi.
      const bagAralik = document.createRange();
      bagAralik.selectNodeContents(bag);
      const bagKutulari = [...bagAralik.getClientRects()].filter(r => r.width > 0), ilk = bagKutulari[0];
      const sagKenar = bilgi.getBoundingClientRect().right - parseFloat(stil.paddingRight) - parseFloat(stil.borderRightWidth);
      return {
        // en: yerleşim genişliği. Telefon benzetiminde yatay taşan içerik sayfayı küçültür ve innerWidth'i büyütür;
        // clientWidth değişmez. tasma: içeriğin o genişliği aşan kısmı.
        en: document.documentElement.clientWidth, tasma: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        // tasan: düğmenin yazısı (metin aralığının kutusu) düğmenin kutusundan dışarı çıkıyor.
        dugmeler: [...mod.querySelectorAll('[data-mod]')].map(d => {
          const r = d.getBoundingClientRect(), a = document.createRange();
          a.selectNodeContents(d);
          const m = a.getBoundingClientRect();
          return Object.assign(kutu(d), {tasan: m.left < r.left - 0.5 || m.right > r.right + 0.5 || m.top < r.top - 0.5 || m.bottom > r.bottom + 0.5});
        }),
        // modaKadar: bölümün başı ile tur düğmeleri arasındaki yer; başlık yer tutmuyorsa sıfırdır.
        baslik: {en: Math.round(b.width), boy: Math.round(b.height), yazi: parseFloat(getComputedStyle(baslik).fontSize), metin: duz(baslik.textContent),
          bolumAdi: bolum.getAttribute('aria-labelledby'), modaKadar: Math.round(mod.getBoundingClientRect().top - bolum.getBoundingClientRect().top)},
        // gorunen: çizilen metin (innerText display:none olanı saymaz); tam: kaynaktaki bütün cümle.
        giris: {ekCizildi: ek.getClientRects().length > 0, gorunen: duz(giris.innerText), tam: duz(giris.textContent), ek: duz(ek.textContent)},
        // sigar: bağlantı, sıra bilgisinin son satırının ardına bir harf boyu (1em) arayla bile sığıyor.
        // Sıra bilgisi ya da bağlantı çizilmiyorsa (yazısının kutusu yoksa) null.
        baglanti: ilk && son ? {satir: new Set(satirlar.map(r => Math.round(r.top))).size,
          ayniSatir: Math.abs((ilk.top + ilk.bottom) - (son.top + son.bottom)) / 2 < son.height / 2,
          sigar: son.right + parseFloat(stil.fontSize) + bagKutulari.reduce((t, r) => t + r.width, 0) <= sagKenar,
          sonSatirSag: Math.round(son.right), bagUst: Math.round(ilk.top), sonSatirUst: Math.round(son.top), sagKenar: Math.round(sagKenar)} : null,
        // Görünen düğmeler: cevaptan önce tur, kart ve katman düğmeleri; cevaptan sonra Dinle, katman inmeyince
        // "Yeniden dene" de listeye girer.
        dugmeBoylari: [...document.querySelectorAll('main button')].filter(d => d.getClientRects().length)
          .map(d => [d.id || duz(d.textContent).slice(0, 24), Math.round(d.getBoundingClientRect().height * 10) / 10]),
        kartDolgusu: parseFloat(getComputedStyle(q('#oyunKart')).paddingTop),
        siradanKartDolgusu: parseFloat(getComputedStyle(q('#katmanKart')).paddingTop)
      };
    },
  };
}

const T = (page, ad, ...arg) => page.evaluate(([ad, arg]) => window.__oyun[ad](...arg), [ad, arg]);
const hazir = page => page.waitForFunction(() => {
  const k = document.getElementById('oyunKart'), b = document.getElementById('oyunBos'), s = document.getElementById('oyunSira');
  return !!k && !!b && !!window.__oyun && (!k.hidden || !b.hidden) && !/yükleniyor/i.test(s.textContent);
});
const ac = async (page, base) => { await page.goto(base + '/oyunlar.html'); await hazir(page); };
// Dört bekleme yardımcısı zaman aşımında neyi beklediğini ve ekranda ne olduğunu söyler (bekleyerek, aşağıda).
const kelimeBekle = (page, w, taze = true) => bekleyerek(page, 'kelimeBekle', 'kelime ' + JSON.stringify(w) + (taze ? ' (dokunulmamış tur)' : ' (yarım ya da bitmiş tur da olur)'), {w, taze},
  page.waitForFunction(([w, taze]) => window.__oyun.uyuyor(w, taze), [w, taze]));
const durumBekle = (page, metin) => bekleyerek(page, 'durumBekle', '#oyunDurum ' + JSON.stringify(metin), {durum: metin},
  page.waitForFunction(m => document.getElementById('oyunDurum').textContent === m, metin));
// Duyuru bölgesi değişiklikten 80 ms sonra yazılır; beklenen metne ulaşması beklenir.
const duyuruBekle = (page, metin) => bekleyerek(page, 'duyuruBekle', '#oyunDuyuru ' + JSON.stringify(metin), {duyuru: metin},
  page.waitForFunction(m => document.getElementById('oyunDuyuru').textContent === m, metin));
// "N. harf açıldı" iletisindeki sıra: ayraçlar sayılmaz.
const harfSirasi = (w, konum) => w.slice(0, konum + 1).replace(/[^a-z]/gi, '').length;
const kutuBekle = (page, w, k) => bekleyerek(page, 'kutuBekle', JSON.stringify(w) + ' kelimesinin ' + k + '. kutuya gelmesi', {w, kutu: k},
  page.waitForFunction(([w, k]) => window.YDS.Ilerleme.kutu(w, 'kelime') === k, [w, k]));
// Animasyon (kutu zıplaması, sallanma) bitmeden ölçüm alınmaz.
const durgun = page => page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || a.effect.getComputedTiming().iterations === Infinity));
// Düzenek: sıranın başındaki, 0. kutuda istenenden az gizli harf bırakan kelimeleri yarına erteler (oturum sayımına
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
// Yazılan: kelimenin bütün harfleri, baştan sona (açık harfler dahil; tire ve boşluk yazılmaz).
const tam = w => w.toLowerCase().replace(/[^a-z]/g, '');
// Kelimenin tamamı, verilen harf sıralarındaki harfler yanlış yazılmış olarak.
const bozuk = (w, siralar) => [...tam(w)].map((c, i) => (siralar.includes(i) ? yanlisHarfler(c) : c)).join('');
async function coz(page, w) {
  await page.locator('#oyunGirdi').focus();
  await page.keyboard.type(tam(w));
  await page.keyboard.press('Enter');
}
// Sayfanın yüklediği oyunlar.js içindeki sayısal bir sabit (ör. ESITLEME_BEKLEME_MS); bulunamazsa null.
const betikSabiti = (page, ad) => page.evaluate(async ad => {
  const betik = document.querySelector('script[src*="assets/js/oyunlar.js"]');
  const m = (await (await fetch(betik.src)).text()).match(new RegExp('\\b' + ad + '\\s*=\\s*(\\d+)'));
  return m ? Number(m[1]) : null;
}, ad);
// Durum satırı: [ileti, sınıf]. Beklenen hâller: boş satır ve yarım bekleme notu.
const durumVeSinif = async page => [(await T(page, 'gorunum')).durum, await T(page, 'durumSatiriSinifi')];
const DURUM_BOS = ['', 'oyun-durum'], DURUM_NOTLU = [YARIM_BEKLEME_NOTU, 'oyun-durum uyari'];
// Enter'dan sonra saat ilerletilmeden görünen ileti (durum satırı boşken çağrılır): beklenen metni
// beklemek yerine ilk ileti okunur ki yanlış ileti zaman aşımıyla değil, kendi metniyle bildirilsin.
const ilkIleti = async page => {
  await page.waitForFunction(() => document.getElementById('oyunDurum').textContent !== '');
  return (await T(page, 'gorunum')).durum;
};
// Sayfa dışında beklenen bir olay (ör. ağ isteği) hiç gelmezse senaryo asılı kalmasın: süre dolunca iletiyle reddeder.
const sureli = (soz, ms, ileti) => {
  let zamanlayici;
  return Promise.race([soz, new Promise((coz, reddet) => { zamanlayici = setTimeout(() => reddet(new Error(ileti)), ms); })])
    .finally(() => clearTimeout(zamanlayici));
};
// Kelimeler sayfası (kelimeler.html): deste özeti çizilene kadar beklenir. Sayfa T(page, 'desteGor') ile
// yalnız DOM'dan okunur; düğme tıklamaları eşzamanlı işlendiği için tıklamadan sonra beklemeden bakılır.
const kelimelerHazir = page => page.waitForFunction(() => !!window.__oyun && !!window.YDS && !!window.YDS.Ilerleme &&
  /^Bugünü çalış \(\d+ kart\)$/.test(document.getElementById('desteBasla').textContent));
const kelimelerAc = async (page, base) => { await page.goto(base + '/kelimeler.html'); await kelimelerHazir(page); };
// Deste önce günlük hedef kadar yeni kelimeyle başlar (17 Ekim 2026). Yalnız tekrar destesini sınayan
// senaryolar günün yeni kotasını başka kelimelerle doldurur: hedef en küçük seçeneğe çekilir, o kadar hiç
// çalışılmamış kelime (havuzun 60. kelimesinden itibaren; senaryo kümeleri daha öndedir) bugün bilinir.
// Bunlar yarın vadeli olur; bugünün destesi yalnız tekrarlardan kurulur. Özet yeniden yüklemeyle tazelenir.
const yeniKotasiniDoldur = async (page, katman) => {
  const d = await page.evaluate(k => {
    const Il = window.YDS.Ilerleme;
    Il.gunlukHedefAyarla(Math.min(...[...document.getElementById('gunlukHedef').options].map(o => Number(o.value))));
    const ws = window.__oyun.desteHavuz([k]).slice(60).filter(w => Il.yeniMi(w, 'kelime')).slice(0, Il.yeniKotasiKalan());
    ws.forEach(w => Il.dogru(w, 'kelime'));
    return {ws, kota: Il.yeniKotasiKalan()};
  }, katman);
  assert.equal(d.kota, 0, 'Düzenek: günün yeni kotası dolduruldu (' + d.ws.length + ' kelime)');
  await page.reload(); await kelimelerHazir(page);
  return d.ws;
};
// Deste karışık sıradadır: kelimeler ekrandan okunur. adet kez "Sonraki" tam bir tur atar. Kart alanı
// kapanmışsa (deste bitmiş ya da hiç açılmamışsa) tıklama beklenmez, ne görüldüğü söylenir.
async function desteKart(page, neIcin) {
  const g = await T(page, 'desteGor');
  assert.ok(g.alan, neIcin + ': kart alanı açık olmalı (liste sayacı: "' + g.durum + '")');
  return g;
}
async function desteDolas(page, adet) {
  const out = [];
  for (let i = 0; i < adet; i++) { out.push((await desteKart(page, 'Deste dolaşılırken, ' + (i + 1) + '. kartta')).on); await page.locator('#sonraki').click(); }
  return out;
}
// İstenen kelime ekrana gelene kadar "Sonraki"ye basılır (en çok bir tur).
async function desteKartaGit(page, w) {
  const tur = Number((await desteKart(page, '"' + w + '" kartı aranırken')).sayac.split(' / ')[1]);
  for (let i = 0; i < tur && (await desteKart(page, '"' + w + '" kartı aranırken')).on !== w; i++) await page.locator('#sonraki').click();
  assert.equal((await T(page, 'desteGor')).on, w, 'Düzenek: "' + w + '" kartı destede, ekrana getirildi');
}
// Öbür sayfanın (yazan) kayıtları bu sayfanın (okuyan) deposunda görünene kadar beklenir. Olay beklenmez,
// depo okunur: depolama olayı bastırılmış sayfada da çalışır. Yazılan kayıtları döndürür.
async function desteDepoBekle(yazan, okuyan, kelimeler) {
  const kayitlar = await T(yazan, 'desteDepo', kelimeler);
  await okuyan.waitForFunction(([ws, beklenen]) => JSON.stringify(window.__oyun.desteDepo(ws)) === beklenen, [kelimeler, JSON.stringify(kayitlar)]);
  return kayitlar;
}
const desteSirali = dizi => dizi.slice().sort();
// Bir beklemenin süresi dolarsa "Timeout … exceeded" yerine neyin beklendiğini söyleyen hatayla düşer.
const desteBeklenen = (bekleme, ileti) => bekleme.catch(h => assert.fail(ileti + ' (' + String(h && h.message).split('\n')[0] + ')'));
// "Duyuru bölgesine bir şey yazılmadı" demeden önce: duyuru gecikmeli yazılır (duyur(), 80 ms), o yüzden sayfanın
// saati ilerletilir ve o süre içinde vadesi gelen bütün zamanlayıcılar çalıştırılır (gerçek bekleme yok, makinenin
// hızına bağlı değil). Sayfa saati kurulmuş olmalıdır: senaryo sayfayı açmadan önce page.clock.install ya da
// setFixedTime çağırır; sonradan kurulan saat, daha önce kurulmuş zamanlayıcıları yönetmez.
const duyuruDurulsun = page => page.clock.runFor(DUYURU_SONRASI_MS);
// Durum satırına (öncekinden farklı) bir ileti yazılmasını bekler ve metni döndürür. Beklenen iletiyle
// assert.equal ile karşılaştırılır: yanlış ileti zaman aşımı yerine iki metni gösteren bir hata verir.
const durumOku = async (page, onceki = '') => {
  await page.waitForFunction(o => { const m = document.getElementById('oyunDurum').textContent; return m !== '' && m !== o; }, onceki);
  return page.evaluate(() => document.getElementById('oyunDurum').textContent);
};
// Duyuru bölgesine yazılan metni bekler ve döndürür. Bölge her değişiklikte önce boşaltıldığı için değişiklikten
// sonra çağrılınca yeni duyuruyu verir; beklenen metinle assert.equal ile karşılaştırılır.
const duyuruOku = async page => {
  await page.waitForFunction(() => document.getElementById('oyunDuyuru').textContent !== '');
  return page.evaluate(() => document.getElementById('oyunDuyuru').textContent);
};
// Bekleyen ilerleme yazımı varsa yapılmış olsun: sayfa yazımı bir kare + bir zamanlayıcı sonraya bırakır
// (yazmayiPlanla); aynı sırayla kurulan bu bekleme ondan sonra biter.
const yazimDurulsun = page => page.evaluate(() => new Promise(bitti => requestAnimationFrame(() => setTimeout(bitti, 0))));
// Girdinin açıklamasının (#oyunTarif) cevaptan önce beklenen metni; modülden değil, ekrandaki kutulardan kurulur:
// gizli kutu "boş", açık ya da açılmış harf kendisi, ayraç adıyla okunur. sizinti ve duyuruSizinti cevabı
// bitişik sözcük olarak arar; harf harf ("r, e, q, …") sayılan cevabı yalnız bu karşılaştırma görür.
// g: gorunum çıktısı; tus: yönergedeki tuşun adı.
const beklenenAciklama = (g, tus = 'Enter') => {
  const harfler = g.hucreler.filter(h => h.s !== 'ayrac'), bos = harfler.filter(h => h.s.startsWith('bos')).length;
  return harfler.length + ' harfli İngilizce kelime: ' +
    g.hucreler.map(h => (h.s === 'ayrac' ? (h.c === '-' ? 'tire' : 'sözcük arası') : (h.s.startsWith('bos') ? 'boş' : h.c))).join(', ') + '. ' +
    (bos < harfler.length ? 'Açık harfler dahil kelimenin tamamını baştan sona yaz' : 'Kelimenin tamamını yaz') + ', ' + tus + ' ile kontrol et.';
};
// kelimeBekle, durumBekle, duyuruBekle ve kutuBekle bununla sarılır: bekleme başarısız olursa çıplak
// "page.waitForFunction: Timeout 15000ms exceeded." yerine neyin beklendiğini ve o an ekranda ne olduğunu
// (durum satırı, duyuru, kutu düzeni) söyleyen bir hata atılır. Başarıda hiçbir şey değişmez: dönen değer
// waitForFunction'ın kendi sonucudur, sayfaya ek soru gitmez. Asıl hata `cause` olarak, çağrı yeri yığında kalır.
function bekleyerek(page, ad, ne, beklenen, soz) {
  return soz.catch(async asil => {
    let ekran, sure;
    try {
      // Sayfa kilitlendiyse özet de dönmez: iki saniyeden fazla beklenmez.
      ekran = await Promise.race([
        page.evaluate(b => (window.__oyun && window.__oyun.beklemeOzeti ? window.__oyun.beklemeOzeti(b) : 'sayfa ' + location.href + ' (sayfa içi yardımcılar yok)'), beklenen),
        new Promise((_, ret) => { sure = setTimeout(() => ret(new Error('sayfa 2 sn içinde yanıt vermedi')), 2000); })
      ]);
    } catch (h) {
      ekran = '(okunamadı: ' + String((h && h.message) || h).split('\n')[0] + ')';
    } finally {
      clearTimeout(sure);
    }
    const hata = new Error(ad + ': ' + ne + ' beklenirken ' + String((asil && asil.message) || asil).split('\n')[0] + '\n    ekranda: ' + ekran, {cause: asil});
    if (asil && asil.name) hata.name = asil.name;
    // Yığın: Playwright'ın çağrı anında aldığı çerçeveler (yardımcı, senaryo satırı) korunur.
    hata.stack = hata.message + String((asil && asil.stack) || '').split('\n').filter(s => /^\s+at /.test(s)).map(s => '\n' + s).join('');
    throw hata;
  });
}
// Görünen alanı değiştirir ve sayfanın yeni genişlikte yerleştiğini bekler (ölçüm eski yerleşime denk gelmesin).
// Yalnız innerWidth'e bakılmaz: telefon benzetiminde yatay taşan içerik onu büyütür (clientWidth değişmez).
// Kaydırma çubuğu yer tutan (başlıklı) tarayıcıda ise clientWidth daha küçüktür, innerWidth tutar.
async function boyutla(page, en, boy) {
  await page.setViewportSize({width: en, height: boy});
  await page.waitForFunction(en => document.documentElement.clientWidth === en || innerWidth === en, en);
}
// Sıra bilgisi satıra bölünmüş ve son satırında yer kalmışsa bağlantı o satırda durur; kendi satırına inmez.
function bagKurali(o, etiket) {
  assert.ok(o.baglanti, etiket + 'sıra bilgisi ve "Katmanları değiştir" bağlantısı çizilir');
  assert.ok(o.baglanti.ayniSatir || !o.baglanti.sigar, etiket + '"Katmanları değiştir" sıra bilgisinin son satırına sığdığı hâlde kendi satırına inmiş: ' + JSON.stringify(o.baglanti));
}
// Senaryo 16: 480 px ve altındaki (telefon) yerleşimin yazı tipinden bağımsız kuralları. Ölçüleri döndürür.
async function telefonYapisi(page, etiket) {
  const o = await T(page, 'yerlesimOlcusu'), d = o.dugmeler, ustler = d.map(x => x.ust), kanit = parca => ': ' + JSON.stringify(parca);
  assert.ok(o.tasma <= 1, etiket + 'yatay taşma yok' + kanit({en: o.en, tasma: o.tasma}));
  assert.equal(d.length, 3, etiket + 'üç tur düğmesi var');
  assert.ok(Math.max(...ustler) - Math.min(...ustler) <= 1, etiket + 'üç tur düğmesi tek satırda (üst kenarları aynı)' + kanit(d));
  assert.ok(d[0].sol >= 0 && d[0].sag <= d[1].sol && d[1].sag <= d[2].sol && d[2].sag <= o.en, etiket + 'tur düğmeleri yan yana, üst üste binmeden, ekranın içinde' + kanit(d));
  assert.deepEqual(d.map(x => x.tasan), [false, false, false], etiket + 'tur düğmelerinin yazısı düğmesine sığar' + kanit(d));
  // Ara başlık görünmez ve yer tutmaz, ama silinmemiştir: bölümün adı odur, ekran okuyucu başlık olarak bulur.
  assert.ok(o.baslik.en <= 1 && o.baslik.boy <= 1 && o.baslik.modaKadar <= 1, etiket + 'ara başlık yer tutmaz (tur düğmeleri bölümün başında)' + kanit(o.baslik));
  assert.equal(await page.getByRole('heading', {name: o.baslik.metin, exact: true}).count(), 1, etiket + 'ara başlık ekran okuyucu için yerinde (görünmez, ama gizlenmemiş)' + kanit(o.baslik));
  assert.equal(await page.getByRole('region', {name: o.baslik.metin, exact: true}).count(), 1, etiket + 'bölümün erişilebilir adı ara başlığın metni (aria-labelledby)' + kanit(o.baslik));
  assert.equal(o.giris.ekCizildi, false, etiket + 'giriş cümlesinin eki (.oyun-giris-ek) çizilmez' + kanit(o.giris));
  assert.ok(o.giris.gorunen && !o.giris.gorunen.includes(o.giris.ek), etiket + 'giriş cümlesinin ilk yarısı görünür, eki görünmez' + kanit(o.giris));
  bagKurali(o, etiket);
  return o;
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
  // Windows'ta boş bağlantı noktası Chromium'un yasak listesinden (6666, 6000, 10080…) gelebilir: izin ver.
  const browser = await chromium.launch({args: ['--explicitly-allowed-ports=' + server.address().port]});
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
  senaryo('Boş profil: varsayılan katman, ilk kelime, seviye, açık harfler, etiket ve yönerge (kelimenin tamamı yazılır), imleç ilk harfte (açık olsa da), anlam, axe', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    const b = await page.evaluate(() => {
      const Y = window.YDS, O = Y.OyunHesap, Il = Y.Ilerleme, T = window.__oyun;
      const havuz = Y.Veri.dizin.filter(d => d.k === 2 && O.oynanabilir(d)), w = havuz[0].e;
      const sayilar = Y.Veri.katmanSayilari();
      const kart = document.getElementById('oyunKart');
      const kimlikler = [...document.querySelectorAll('[id]')].map(e => e.id);
      return {
        w, oynanan: havuz.length, harf: O.harfSayisi(w),
        acikSayisi: O.acikSayisi(O.harfSayisi(w), 0), acik: O.acikKonumlar(w, 0, Il.bugun()),
        tarif: O.tarif(O.turBaslat(w, 0, Il.bugun())),
        depoKatman: localStorage.getItem('yds-katmanlar'), depoSecim: Y.Depo.oku('yds-katmanlar', null),
        basili: [...document.querySelectorAll('#katmanlar .katman[aria-pressed="true"]')].map(x => x.querySelector('b').textContent),
        katmanlar: [...document.querySelectorAll('#katmanlar .katman')].map(x => [Number(x.dataset.k), x.querySelector('i').textContent, x.hasAttribute('title')]),
        beklenenKatmanlar: Y.Veri.KATMANLAR.filter(k => sayilar[k] > 0).map(k => [k, sayilar[k] + ' kelime', false]),
        secimToplami: sayilar[2],
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
        // Girdinin görünen etiketi; erişilebilir adı da odur (aşağıda rolüyle aranır).
        etiket: document.querySelector('label[for="oyunGirdi"]').textContent,
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
    assert.equal(b.etiket, 'Kelimeyi baştan sona yaz', 'Etiket kelimenin tamamını ister (yalnız eksik harfleri değil)');
    assert.equal(await page.getByRole('textbox', {name: 'Kelimeyi baştan sona yaz', exact: true}).count(), 1, 'Girdinin erişilebilir adı etiketin metnidir');
    // "Nasıl oynanır?" metni yeni kuralı anlatır; eski kuralın cümleleri kalmamıştır.
    const nasil = (await page.locator('.oyun-nasil').evaluate(el => el.textContent)).replace(/\s+/g, ' ');
    for (const parca of ['İngilizce kelimeyi baştan sona yaz', 'sırası gelince onları da yazarsın', 'Gizli harflerin hepsi doğruysa bu yazım hatası deneme hakkını götürmez', 'yazdıkların o harfe kadar silinir ve oradan devam edersin',
      'doğru yazdığın gizli harfler açılır, kelimeyi yeniden baştan yazarsın']) {
      assert.ok(nasil.includes(parca), '"Nasıl oynanır?" yeni kuralı anlatır: ' + JSON.stringify(parca));
    }
    for (const eski of ['eksik harflerini sırayla yaz', 'harfler yerinde kalır']) assert.ok(!nasil.includes(eski), '"Nasıl oynanır?" eski kuralı anlatmaz: ' + JSON.stringify(eski));
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
    // Kelimenin tamamı yazılır: imleç kelimenin ilk harfindedir (o harf açık gelmiş olsa da), girdi bütün harfleri alır.
    const ilkKutu = g.hucreler.findIndex(h => h.s !== 'ayrac');
    assert.deepEqual(g.hucreler.map((h, i) => (h.s.includes('simdi') ? i : -1)).filter(i => i >= 0), [ilkKutu], 'Sıradaki kutu işaretli: kelimenin ilk harfi, başka kutu değil');
    assert.equal(g.hucreler[ilkKutu].s, (acik.includes(ilkKutu) ? 'sabit' : 'bos') + ' simdi', 'İmlecin durduğu kutu türünü korur (açık harf açık, gizli harf gizli)');
    assert.equal(g.azami, String(b.w.length), 'maxlength başlığın uzunluğudur: açık harfler de yazılır');
    assert.equal(g.deger, '');
    assert.equal(g.tarif, b.tarif, 'Ekran okuyucu açıklaması modülden');
    // Modülün metni ekrandaki kutulardan kurulan beklentiyle de aynıdır: açık harf kendisi, gizli harf "boş" okunur,
    // yönerge açık harflerin de yazılacağını söyler.
    assert.equal(g.tarif, beklenenAciklama(g), 'Açıklama ekrandaki kutuları ve yönergeyi okur');
    assert.ok(g.tarif.endsWith('. Açık harfler dahil kelimenin tamamını baştan sona yaz, Enter ile kontrol et.'), 'Yönerge kelimenin tamamını ister: ' + g.tarif);
    assert.deepEqual(await T(page, 'sizinti', b.w, 'main'), [], 'Kartta ve <main> özniteliklerinde cevap yok');
    const anlam = await T(page, 'anlam', b.w, true, false);
    assert.equal(anlam.gorulen, anlam.beklenen, 'Anlamlar katman kaydıyla aynı (yıldızlarıyla)');
    assert.equal(anlam.tur, anlam.beklenenTur, 'Tür satırı dizinden');
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
    // Yıldızlar: ilk kelimenin yıldızlı anlamı olmayabilir (Çekirdek'in yarısında yok). Denetim, yıldızlı anlamı
    // olan ilk kelimede yapılır; önündeki yıldızsız kelimeler yarına ertelenir. Boş profil beklentileri bozulmasın
    // diye senaryonun sonundadır. Saat o an dondurulur: erteleme "yarın"a yazılır, yeniden yüklemeden önce gece yarısı
    // geçerse ertelenen kelimelerin vadesi yeniden gelmiş olurdu.
    await page.clock.setFixedTime(new Date());
    const yildizli = await page.evaluate(() => {
      const Y = window.YDS, havuz = window.__oyun.havuz(window.__oyun.secili());
      const sira = havuz.findIndex(d => { const tam = Y.Veri.kayit(d.e); return !!tam && tam.a.some(a => Y.yildiz(a)); });
      if (sira < 0) return null;
      havuz.slice(0, sira).forEach(d => Y.Ilerleme.yanlis(d.e, 'kelime'));
      return {w: havuz[sira].e, ertelenen: sira};
    });
    assert.ok(yildizli, 'Düzenek: seçili katmanda yıldızlı anlamı olan oynanabilir kelime kalmadı');
    if (yildizli.ertelenen) { await page.reload(); await hazir(page); }
    await kelimeBekle(page, yildizli.w);
    const yildizAnlam = await T(page, 'anlam', yildizli.w, true, false);
    assert.ok(yildizAnlam.yildiz >= 1, 'Yıldızlı anlamın yıldızları çizilir (' + yildizli.w + '): ' + yildizAnlam.gorulen);
    assert.equal(yildizAnlam.okunanYildiz, 0, 'Yıldızlar ekran okuyucudan gizli sarmalayıcının (aria-hidden) içinde (' + yildizli.w + '): ' + yildizAnlam.gorulen);
    assert.equal(yildizAnlam.gorulen, yildizAnlam.beklenen, 'Yıldızlı kelimenin anlamı katman kaydıyla aynı (' + yildizli.w + ')');
    // İmleç açık harfte de durur. Bugünkü ilk kelimenin ilk harfi gizli gelmiş olabilir (açık harfler günün tohumuyla
    // seçilir); denetim, ilk harfi açık gelen ilk kelimede yapılır, önündekiler yukarıdaki gibi yarına ertelenir.
    const ilkAcik = await page.evaluate(() => {
      const O = window.YDS.OyunHesap, Il = window.YDS.Ilerleme, sira = window.__oyun.sira('sira', 200);
      const n = sira.findIndex(w => O.acikKonumlar(w, Il.kutu(w, 'kelime'), Il.bugun())[0] === 0);
      if (n < 0) return null;
      sira.slice(0, n).forEach(w => Il.yanlis(w, 'kelime'));
      return {w: sira[n], ertelenen: n};
    });
    assert.ok(ilkAcik, 'Düzenek: sıranın ilk 200 kelimesinde ilk harfi açık gelen kelime yok');
    if (ilkAcik.ertelenen) { await page.reload(); await hazir(page); }
    await kelimeBekle(page, ilkAcik.w);
    const imlec = (await T(page, 'gorunum')).hucreler;
    assert.deepEqual(imlec[0], {c: ilkAcik.w[0], s: 'sabit simdi'}, 'İlk harfi açık gelen kelimede imleç o açık harftedir, harf kutusunda durur (' + ilkAcik.w + '): ' + JSON.stringify(imlec.map(h => h.s)));
    assert.equal(imlec.filter(h => h.s.includes('simdi')).length, 1, 'Tek kutu işaretli (' + ilkAcik.w + ')');
    return 'ilk kelime ' + b.w.length + ' harf, ' + b.acikSayisi + ' açık; yıldız denetimi ' + yildizli.w +
      (yildizli.ertelenen ? ' (önündeki ' + yildizli.ertelenen + ' yıldızsız kelime ertelendi)' : '') +
      '; imleç denetimi ' + ilkAcik.w + (ilkAcik.ertelenen ? ' (önündeki ' + ilkAcik.ertelenen + ' kelime ertelendi)' : '') +
      '; usage betikleri ' + (b.kullanim ? 'var' : 'yok');
  });

  /* ---------- 2) Doğru cevap ---------- */
  senaryo('Kelimenin tamamı + Enter: Bildiniz, 1. kutu, oturum listesi, sonraki kelime, yenileme; yalnız gizli harfleri yazmak eksik sayılır (deneme harcamaz), harfler baştan sırayla kutulara oturur, açık harfin üzerine yazılan başka harf işaretlenir', async () => {
    const page = await yeniSayfa();
    // Sayfa saati kurulur (gerçek saatle, akar durumda): cevaptan sonraki duyuru denetimi saati ilerletir.
    await page.clock.install();
    await ac(page, base);
    const [w, w2] = await T(page, 'sira');
    await kelimeBekle(page, w);
    const once = await T(page, 'bugunku');
    // Açılış duyurusu yazıldıktan sonra cevap verilir: bölgenin cevaptan sonra da bu hâliyle kaldığı aşağıda görülür.
    const acilisDuyurusu = await T(page, 'soru', w, true);
    await duyuruBekle(page, acilisDuyurusu);
    await odakla(page);
    const e = await T(page, 'eksik', w), acilis = await T(page, 'gorunum');
    // Harf kutuları (ayraçsız), kelimenin harf sırasıyla; ilk açık harfin sırası.
    const kutular = acilis.hucreler.map((h, i) => i).filter(i => acilis.hucreler[i].s !== 'ayrac');
    const acikSira = kutular.findIndex(i => acilis.hucreler[i].s.startsWith('sabit'));
    assert.ok(e.length >= 1 && acikSira >= 0, 'Düzenek: ilk kelimede hem gizli hem açık harf var (' + w + ')');
    // Yazılan metne göre beklenen kutular, açılıştaki görünümden (modülden değil): harfler baştan sırayla oturur,
    // açık harf atlanmaz. Yazılmış kutu "yazildi"; açık kutu kendi harfini aldıysa harfi kalır, başka harf aldıysa
    // yazılanı gösterir ve "farkli" olur; gizli kutu yazılanı gösterir (hiç işaretlenmez); imleç sıradaki kutudadır.
    const beklenenKutular = yazilan => {
      let sira = 0;
      return acilis.hucreler.map(h => {
        if (h.s === 'ayrac') return h;
        const taban = h.s.replace(' simdi', ''), acik = taban !== 'bos', y = yazilan[sira], imlec = sira++ === yazilan.length;
        if (y === undefined) return {c: acik ? h.c : '', s: taban + (imlec ? ' simdi' : '')};
        const farkli = acik && y !== h.c.toLowerCase();
        return {c: acik && !farkli ? h.c : y, s: taban + ' yazildi' + (farkli ? ' farkli' : '')};
      });
    };
    // Yalnız gizli harfler + Enter: kelimenin tamamı değildir. Deneme harcanmaz (aşağıda kelime yine "ilk denemede"
    // bilinir), hata işareti konmaz, yazılan girdide kalır ve kelimenin başından sırayla kutulara oturmuş görünür.
    await page.keyboard.type(e);
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Önce kelimenin tamamını yaz; açık harfleri de yaz.');
    let g = await T(page, 'gorunum');
    assert.deepEqual([g.deger, g.gecersiz, g.azami], [e, null, String(w.length)], 'Eksik kelime: yazılan yerinde, hata işareti yok, maxlength başlığın uzunluğu');
    assert.deepEqual(g.hucreler, beklenenKutular(e), 'Yalnız gizli harfler yazılınca harfler kelimenin BAŞINDAN oturur; açık kutuya düşen başka harf "farkli"');
    assert.equal(await T(page, 'kayit', w), null, 'Eksik kelimeyle Enter ilerleme yazmaz');
    // Silmek: ilk tuşta ileti kalkar; sonunda kutular açılıştaki hâline döner (açık harfler yerinde, imleç ilk harfte).
    await page.keyboard.press('Backspace');
    assert.equal((await T(page, 'gorunum')).durum, '', 'Eksik iletisi ilk tuşta silinir');
    for (let i = 1; i < e.length; i++) await page.keyboard.press('Backspace');
    g = await T(page, 'gorunum');
    assert.equal(g.deger, '');
    assert.deepEqual(g.hucreler, acilis.hucreler, 'Yazılan silinince kutular açılıştaki hâline döner');
    // İlk açık harfe kadar doğru, açık harfin yerine başka harf: kutu yazılanı gösterir ve işaretlenir (harf zaten
    // ekrandaydı, işaret bir şey ele vermez); silinince kendi harfi geri gelir ve imleç ona döner.
    const acikKutu = kutular[acikSira], hatali = bozuk(w, [acikSira]).slice(0, acikSira + 1);
    await page.keyboard.type(hatali);
    g = await T(page, 'gorunum');
    assert.deepEqual(g.hucreler[acikKutu], {c: yanlisHarfler(tam(w)[acikSira]), s: 'sabit yazildi farkli'}, 'Açık harfin üzerine yazılan başka harf kutuda görünür ve "farkli" olur');
    assert.deepEqual(g.hucreler, beklenenKutular(hatali), 'Öteki kutular: önündekiler yazılmış, işaretsiz; sonrakiler dokunulmamış');
    await page.keyboard.press('Backspace');
    g = await T(page, 'gorunum');
    assert.deepEqual(g.hucreler[acikKutu], {c: w[acikKutu], s: 'sabit simdi'}, 'Hatalı harf silinince açık kutu kendi harfine döner');
    // Açık harfin kendisi: kutu "yazildi" olur, harfi kalır; imleç bir sonraki harfe geçer (açık harf atlanmadı, yazıldı).
    await page.keyboard.type(tam(w)[acikSira]);
    g = await T(page, 'gorunum');
    assert.deepEqual(g.hucreler[acikKutu], {c: w[acikKutu], s: 'sabit yazildi'}, 'Açık harf yazılınca kutusu "yazildi" olur ve harfini korur');
    assert.equal(g.deger, tam(w).slice(0, acikSira + 1), 'Açık harf de girdiye yazılır');
    assert.deepEqual(g.hucreler, beklenenKutular(g.deger), 'İmleç açık harften sonraki kutuda');
    // Kelimenin kalanı.
    await page.keyboard.type(tam(w).slice(acikSira + 1));
    g = await T(page, 'gorunum');
    assert.equal(g.deger, tam(w), 'Girdinin değeri kelimenin bütün harfleri');
    assert.equal(g.hucreler.map(h => h.c).join('').toLowerCase(), w.toLowerCase(), 'Yazılan harfler kutularda görünür');
    kutular.forEach(i => assert.deepEqual(g.hucreler[i], acilis.hucreler[i].s.startsWith('sabit') ? {c: w[i], s: 'sabit yazildi'} : {c: w[i].toLowerCase(), s: 'bos yazildi'},
      'Kelime bitince her harf kutusu yazılmış: açık harf kendi harfiyle, gizli harf yazılanla; imleç ve "farkli" yok (' + i + '. kutu)'));
    // Yazılmış kutu, açık da gelse gizli de gelse aynı görünür (açık harfin gri zemini kalkar): zemin, harf rengi ve
    // çerçeve tema değişkenlerinden okunan yazılmış kutu tonlarıdır.
    const yazilmis = await page.evaluate(() => {
      const olc = el => { const s = getComputedStyle(el); return [s.backgroundColor, s.color, s.borderTopColor, s.borderBottomColor].join(' | '); };
      const ornek = document.createElement('span');
      ornek.style.cssText = 'border:1px solid;background:var(--surface);color:var(--accent);border-color:var(--border);border-bottom-color:var(--muted)';
      document.body.appendChild(ornek);
      const r = {beklenen: olc(ornek), gorulen: [...document.querySelectorAll('#oyunHarfler .harf:not(.ayrac)')].map(el => el.className + ': ' + olc(el))};
      ornek.remove();
      return r;
    });
    assert.ok(yazilmis.gorulen.some(k => k.startsWith('harf sabit yazildi: ')), 'Düzenek: yazılmış açık kutu var');
    assert.deepEqual(yazilmis.gorulen.filter(k => !k.endsWith(': ' + yazilmis.beklenen)), [],
      'Yazılmış her kutu (açık gelen de) yazılmış kutu tonlarında: zemin --surface, harf --accent, çerçeve --border, alt çizgi --muted (' + yazilmis.beklenen + ')');
    assert.equal(g.tarif, acilis.tarif, 'Yazılan harfler ekran okuyucu açıklamasına girmez');
    assert.equal(await T(page, 'kayit', w), null, 'Tuşa basmak ilerleme yazmaz');
    await page.keyboard.press('Enter');
    // "Bildiniz": ilk deneme sayıldı; yukarıdaki eksik Enter deneme harcamadı.
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
    assert.equal(g.azami, '0', 'Biten kelimede girdi harf almaz: maxlength 0');
    assert.equal(g.sonuc, true, 'Sonuç bölümü açıldı');
    assert.ok(g.ornek >= 1, 'Örnek cümle var');
    const anlam = await T(page, 'anlam', w, false, false);
    assert.equal(anlam.gorulen, anlam.beklenen, 'Cevaptan sonra anlam maskesiz');
    assert.equal(g.odak, 'oyunGirdi', 'Odak girdide kaldı');
    // Sonuç duyuru bölgesine yazılmaz. Duyuru gecikmeli yazıldığı için önce sayfanın saati ilerletilir; sonra bölgede
    // cevap aranır ve bölgenin açılıştaki soruyla durduğu görülür (sonuç iki kez okunmasın: onu yalnız durum satırı okur).
    await duyuruDurulsun(page);
    assert.deepEqual(await T(page, 'duyuruSizinti', w), [], 'Cevap duyuru bölgesine yazılmaz (sonucu durum satırı okur)');
    assert.equal((await T(page, 'gorunum')).duyuru, acilisDuyurusu, 'Cevaptan sonra duyuru bölgesi sorudaki hâliyle durur (sonuç oraya da yazılmaz)');
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
  senaryo('Yanlış deneme: doğru yazılan gizli harfler açılır, girdi boşalır, kelime yeniden baştan yazılır (yalnız kalan harfler eksik sayılır); sonra doğru = ipucuyla (d artmaz); kutusu değişen ya da günü dönen kelimenin yarım turu atılır; yalnız açık harfteki yazım hatası deneme harcamaz (hangi harfin ne olması gerektiği söylenir, yazılan o harfin önünde kesilir, oradan devam edilince ilk denemede doğru)', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    await enAzBosluk(page, 2);
    const [w] = await T(page, 'sira');
    await kelimeBekle(page, w);
    const once = await T(page, 'bugunku');
    const e = await T(page, 'eksik', w), gizli = await T(page, 'gizliSira'), acilis = await T(page, 'gorunum');
    assert.ok(e.length >= 2, 'Düzenek: en az iki gizli harf gerekli (' + w + ', ' + e.length + ' gizli harf)');
    // Harf kutuları (ayraçsız), kelimenin harf sırasıyla; içlerinden gizli gelenler. Boş girdide imleç ilk harf kutusundadır.
    const kutular = acilis.hucreler.map((h, i) => i).filter(i => acilis.hucreler[i].s !== 'ayrac');
    const gizliKutular = kutular.filter(i => acilis.hucreler[i].s.startsWith('bos'));
    const imlec = i => (i === kutular[0] ? ' simdi' : '');
    await odakla(page);
    // Yarım kelimeyle Enter: ileti çıkar, deneme harcanmaz (aşağıda kalan hak yine 2), hata işareti konmaz.
    await page.keyboard.type(tam(w)[0]);
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Önce kelimenin tamamını yaz; açık harfleri de yaz.');
    assert.equal((await T(page, 'gorunum')).gecersiz, null, 'Yarım kelimeyle Enter hata işareti koymaz');
    // Kelimenin kalanı: açık harfler ve ilk gizli harf doğru, öteki gizli harfler yanlış.
    await page.keyboard.type(bozuk(w, gizli.slice(1)).slice(1));
    // Gizli kutu yazılanı gösterir ama yanlış harfte de işaretlenmez: işaret hangi harfin tutmadığını söylerdi.
    let g = await T(page, 'gorunum');
    gizliKutular.slice(1).forEach(i => assert.deepEqual(g.hucreler[i], {c: yanlisHarfler(w[i].toLowerCase()), s: 'bos yazildi'}, 'Gizli kutu yazılan (yanlış) harfi gösterir, "farkli" olmaz'));
    assert.equal(g.hucreler.filter(h => h.s.includes('farkli')).length, 0, 'Hiçbir kutu "farkli" değil (açık harfler doğru yazıldı)');
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Olmadı. Doğru harfler açıldı; baştan yaz. 2 hakkın kaldı.');
    g = await T(page, 'gorunum');
    // Girdi boşaldı ve imleç başa döndü: kelime yeniden baştan yazılır, maxlength yine başlığın uzunluğudur.
    assert.equal(g.deger, '', 'Yanlış denemede girdi boşalır'); assert.equal(g.azami, String(w.length), 'maxlength başlığın uzunluğu: açılan harf de yeniden yazılır');
    assert.deepEqual(g.hucreler.map((h, i) => (h.s.includes('simdi') ? i : -1)).filter(i => i >= 0), [kutular[0]], 'İmleç kelimenin ilk harfine döndü');
    assert.equal(g.hucreler[gizliKutular[0]].s, 'bulundu' + imlec(gizliKutular[0]), 'Doğru yazılan gizli harf açıldı');
    assert.equal(g.hucreler[gizliKutular[0]].c, w[gizliKutular[0]]);
    gizliKutular.slice(1).forEach(i => assert.deepEqual(g.hucreler[i], {c: '', s: 'bos'}, 'Yanlış yazılan gizli harf gizli kaldı, yazılan silindi'));
    kutular.filter(i => !gizliKutular.includes(i)).forEach(i => assert.deepEqual(g.hucreler[i], {c: w[i], s: 'sabit' + imlec(i)}, 'Açık harf yerinde'));
    assert.equal(g.gecersiz, 'true'); assert.match(g.harfSinifi, /\byanlis\b/);
    assert.equal(g.odak, 'oyunGirdi');
    assert.equal(await T(page, 'kayit', w), null, 'Yanlış deneme ilerleme yazmaz');
    // Yalnız kalan gizli harfleri yazmak yetmez. İlk tuşta hata işareti kalkar; harfler kalan gizli kutulara atlamaz,
    // kelimenin başından oturur; Enter "eksik" der ve deneme harcamaz (mod değişiminden sonra kalan hak yine 2).
    const kalan = await T(page, 'eksik', w);
    assert.equal(kalan, e.slice(1), 'Düzenek: ilk gizli harf açıldı, ötekiler gizli');
    await page.keyboard.type(kalan[0]);
    g = await T(page, 'gorunum');
    assert.equal(g.gecersiz, null, 'İlk tuşta hata işareti kalkar'); assert.doesNotMatch(g.harfSinifi, /yanlis/);
    await page.keyboard.type(kalan.slice(1));
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Önce kelimenin tamamını yaz; açık harfleri de yaz.');
    g = await T(page, 'gorunum');
    assert.deepEqual([g.deger, g.gecersiz, g.azami], [kalan, null, String(w.length)], 'Yalnız kalan gizli harfler eksik kelimedir: yazılan yerinde, hata işareti yok');
    assert.deepEqual(kutular.map(i => g.hucreler[i].s.includes('yazildi')), kutular.map((i, n) => n < kalan.length), 'Yazılan harfler kelimenin başından sırayla oturur (kalan gizli kutulara atlamaz)');
    assert.equal(await T(page, 'kayit', w), null, 'Eksik kelimeyle Enter ilerleme yazmaz');
    // Mod değişip dönünce deneme hakkı tazelenmez (öğrenilenler boş, kart gizlenir).
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    // Odak mod düğmesinde kaldığı için boş durumun metni duyurulur.
    await duyuruBekle(page, (await T(page, 'gorunum')).bosMetin);
    await page.locator('.oyun-mod [data-mod="sira"]').click();
    await kelimeBekle(page, w, false);
    await durumBekle(page, 'Kaldığın yerden devam: 2 deneme hakkın kaldı.');
    g = await T(page, 'gorunum');
    assert.equal(g.hucreler[gizliKutular[0]].s, 'bulundu' + imlec(gizliKutular[0]), 'Açılan harf mod değişiminde korunur');
    assert.deepEqual([g.deger, g.azami, g.gecersiz], ['', String(w.length), null], 'Dönüşte girdi boş, hata işareti yok: kelime yine baştan yazılır');
    // Mod değişiminin duyurusu sıra satırıyla başlar; açılan harf açıklamada okunur, kalanı "boş".
    assert.equal(g.tarif, beklenenAciklama(g), 'Yarım kelimenin açıklaması: açılan harf kendisi, gizli kalanlar "boş", yönerge kelimenin tamamını ister');
    await duyuruBekle(page, await T(page, 'soru', w, true));
    assert.ok(g.siraMetni.startsWith('Sırada ') && (await T(page, 'gorunum')).duyuru.startsWith(g.siraMetni + ' Yeni kelime: '), 'Mod değişince sıra satırı da okunur');
    assert.deepEqual(await T(page, 'duyuruSizinti', w), [], 'Yarım kelimenin duyurusunda cevap yok');
    // Kelimenin tamamı, bu kez doğru (açılan harf de yeniden yazılır): ipucuyla.
    await page.locator('#oyunGirdi').focus();
    // Yanlış denemede açılan (bulundu) harf de açık harftir: üzerine başka harf yazılınca kutu yazılanı gösterir ve
    // "farkli" olur; öteki harfler doğruysa "Kontrol et" deneme harcamaz, o harfin düzeltilmesini ister.
    const bulunduBozuk = bozuk(w, [gizli[0]]);
    await page.keyboard.type(bulunduBozuk);
    g = await T(page, 'gorunum');
    assert.deepEqual(g.hucreler[gizliKutular[0]], {c: yanlisHarfler(tam(w)[gizli[0]]), s: 'bulundu yazildi farkli'},
      'Açılmış (bulundu) harfin üzerine yazılan başka harf kutuda görünür ve "farkli" olur');
    await page.keyboard.press('Enter');
    assert.equal(await durumOku(page, g.durum), (gizli[0] + 1) + '. harf yanlış, ' + w[gizliKutular[0]] + ' olmalı. O harften devam et.',
      'Açılmış harfteki yazım hatası deneme harcamaz: hangi harf olduğu söylenir');
    g = await T(page, 'gorunum');
    assert.deepEqual([g.deger, g.gecersiz], [bulunduBozuk.slice(0, gizli[0]), null], 'Yazılan, yanlış yazılan harfin önünde kesildi; hata işareti yok');
    assert.deepEqual(g.hucreler[gizliKutular[0]], {c: w[gizliKutular[0]], s: 'bulundu simdi'}, 'İmleç yanlış yazılan harfin kutusunda; kutu yine kendi harfini gösterir');
    await page.keyboard.type(tam(w).slice(gizli[0]));
    g = await T(page, 'gorunum');
    assert.deepEqual(g.hucreler[gizliKutular[0]], {c: w[gizliKutular[0]], s: 'bulundu yazildi'}, 'Açılmış harf de yazılır: kutusu "yazildi" olur, harfi kalır');
    assert.equal(g.deger, tam(w), 'Girdide kelimenin bütün harfleri');
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
    // Yarım tur, kelimenin kutusu arada değiştiyse atılır. Sıradaki kelimede bir yanlış deneme yapılır, moddan
    // çıkılır, kayıt başka yerde 3. kutuya (vadesi bugün) alınır, geri dönülür: kelime yeni seviyesiyle ve tam
    // deneme hakkıyla gelir; "Kaldığın yerden devam" denmez.
    await page.keyboard.press('Enter');
    const [w2] = await T(page, 'sira');
    await kelimeBekle(page, w2);
    // Kelimenin tamamı, gizli harflerin hepsi yanlış: hiçbir harf açılmaz.
    await page.keyboard.type(bozuk(w2, await T(page, 'gizliSira')));
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Olmadı; baştan yaz. 2 hakkın kaldı.');
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    assert.equal(await T(page, 'kayitKoy', w2, 3), true, 'Düzenek: kelimenin kaydı 3. kutuya yazıldı');
    await page.locator('.oyun-mod [data-mod="sira"]').click();
    // Kart, kelime çizildikten sonra görünür olur (aynı görevde); beklenen seviye buna göre okunur.
    await page.locator('#oyunKart').waitFor({state: 'visible'});
    const yeniDuzen = await T(page, 'duzen', w2, 3), bugun = await T(page, 'bugun');
    g = await T(page, 'gorunum');
    assert.deepEqual([g.seviye, g.kutu, g.durum], [rozet(3, yeniDuzen), '3. kutu · tekrar zamanı', ''],
      'Kutusu arada değişen kelimenin yarım turu atılır: yeni seviye, "Kaldığın yerden devam" iletisi yok');
    assert.deepEqual(g.hucreler.map((h, i) => (h.s.includes('sabit') ? i : -1)).filter(i => i >= 0), yeniDuzen.acik, 'Açık harfler 3. kutunun harfleri');
    assert.deepEqual([g.hucreler.filter(h => h.s.startsWith('bulundu')).length, g.hucreler.filter(h => h.s.startsWith('bos')).length, g.azami, g.gecersiz],
      [0, yeniDuzen.bos, String(w2.length), null], 'Yeni turda açılmış harf ve hata işareti yok; gizli harf sayısı 3. kutunun düzeninde');
    // Deneme hakkı da tazelendi: kelime ilk denemede bilinmiş sayılır ve 4. kutuya çıkar.
    await coz(page, w2);
    assert.equal(await durumOku(page), 'Bildiniz! Kelime 4. kutuya çıktı; ' + (yeniDuzen.sonrakiAcik
      ? 'bir dahaki sefere harflerin %10\'u açık gelecek.' : 'bu kadar kısa kelimede bir dahaki sefere harf açılmayacak.'),
    'Yeni turun ilk denemesi "ilk denemede doğru" sayılır (eski turun yanlış denemesi taşınmaz)');
    await kutuBekle(page, w2, 4);
    assert.deepEqual(await T(page, 'kayit', w2), {k: 4, g: bugun + 15, c: bugun}, 'Il.dogru kaydı: 3. kutudan 4. kutuya, 15 gün sonra');
    assert.equal((await T(page, 'gorunum')).sayim, 'Bu oturum: ✓ 1 bildin · 💡 1 ipuçlu · ✗ 0 bilemedin');
    // Gün dönerse de yarım tur atılır (açık harfler günün tohumuyla seçilir): sıradaki kelimede bir yanlış deneme,
    // moddan çıkış, saat bir gün ileri, dönüş → kelime yeni günün harfleriyle ve tam deneme hakkıyla gelir.
    // Dönüş "Yalnız yeni kelimeler" moduna yapılır: enAzBosluk'un yarına ertelediği kısa kelimelerin vadesi yeni
    // günde gelir ve "Sıradaki" modunda başa geçerler; kaydı olmayan bu kelime ise yeni kelimelerin ilkidir.
    await page.keyboard.press('Enter');
    const [w3] = await T(page, 'sira');
    await kelimeBekle(page, w3);
    await page.keyboard.type(bozuk(w3, await T(page, 'gizliSira')));
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Olmadı; baştan yaz. 2 hakkın kaldı.');
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    await page.clock.setFixedTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
    assert.equal(await T(page, 'bugun'), bugun + 1, 'Düzenek: sayfanın saati bir gün ileride');
    await page.locator('.oyun-mod [data-mod="yeni"]').click();
    await page.locator('#oyunKart').waitFor({state: 'visible'});
    const yarinDuzen = await T(page, 'duzen', w3, 0);
    g = await T(page, 'gorunum');
    assert.deepEqual([g.seviye, g.durum], [rozet(0, yarinDuzen), ''], 'Gün dönünce yarım tur atılır: "Kaldığın yerden devam" iletisi yok');
    assert.equal(await T(page, 'uyuyor', w3, true), true, 'Ekrandaki kelime aynı; açık harfler yeni günün harfleri');
    assert.deepEqual([g.hucreler.filter(h => h.s.startsWith('bos')).length, g.azami, g.gecersiz], [yarinDuzen.bos, String(w3.length), null],
      'Yeni turda gizli harfler yeni günün düzeninde, hata işareti yok');
    await coz(page, w3);
    assert.equal(await durumOku(page), 'Bildiniz! Kelime 1. kutuya çıktı; ' + (yarinDuzen.sonrakiAcik
      ? 'bir dahaki sefere harflerin %40\'ı açık gelecek.' : 'bu kadar kısa kelimede bir dahaki sefere harf açılmayacak.'),
    'Yeni günün turunda ilk deneme "ilk denemede doğru" sayılır');
    await kutuBekle(page, w3, 1);
    // Yalnız açık harfteki yazım hatası yanlış deneme DEĞİLDİR: harf zaten ekrandaydı. Gizli harflerin hepsi doğruyken
    // "Kontrol et" deneme harcamaz, hiçbir harfi açmaz; kaçıncı harfin ne olması gerektiğini söyler ve yazılanı o harfin
    // önünde keser (imleç hep sondadır: elle ancak oraya kadar silinerek düzeltilebilirdi). Oradan devam edilince kelime
    // ilk denemede bilinmiş sayılır. En az iki gizli ve bir açık harfi olan kelimede bakılır ("Bir harf aç" açık
    // kalsın); kısa kelimeler geçilir.
    await page.keyboard.press('Enter');
    let w4, e4;
    for (let i = 0; i < 8; i++) {
      [w4] = await T(page, 'sira');
      await kelimeBekle(page, w4);
      e4 = await T(page, 'eksik', w4);
      if (e4.length >= 2 && e4.length < tam(w4).length) break;
      await page.locator('#oyunPas').click();
      await kutuBekle(page, w4, 1);
      await page.locator('#oyunGonder').click();
    }
    assert.ok(e4.length >= 2 && e4.length < tam(w4).length, 'Düzenek: en az iki gizli ve bir açık harfli kelime bulunamadı');
    const acilis4 = await T(page, 'gorunum'), once4 = await T(page, 'bugunku');
    const kutular4 = acilis4.hucreler.map((h, i) => i).filter(i => acilis4.hucreler[i].s !== 'ayrac');
    const acikSira = kutular4.findIndex(i => acilis4.hucreler[i].s.startsWith('sabit'));
    assert.equal(acilis4.harfKapali, false, 'Düzenek: iki gizli harf varken "Bir harf aç" açık');
    await page.locator('#oyunGirdi').focus();
    const hatali = bozuk(w4, [acikSira]);
    await page.keyboard.type(hatali);
    g = await T(page, 'gorunum');
    assert.deepEqual(g.hucreler[kutular4[acikSira]], {c: yanlisHarfler(tam(w4)[acikSira]), s: 'sabit yazildi farkli'}, 'Açık harfin üzerine yazılan başka harf kutuda görünür ve "farkli" olur');
    assert.deepEqual(g.hucreler.map((h, i) => (h.s.includes('farkli') ? i : -1)).filter(i => i >= 0), [kutular4[acikSira]], 'Başka hiçbir kutu "farkli" değil');
    await page.keyboard.press('Enter');
    const DUZELT = (acikSira + 1) + '. harf yanlış, ' + w4[kutular4[acikSira]] + ' olmalı. O harften devam et.';
    assert.equal(await durumOku(page), DUZELT, 'Yalnız açık harfteki yazım hatası: kaçıncı harfin ne olması gerektiği söylenir');
    assert.equal(await T(page, 'durumSatiriSinifi'), 'oyun-durum uyari', 'Açık harfteki yazım hatasının iletisi uyarı rengindedir (hata rengi değil: deneme harcanmadı)');
    assert.equal(await page.evaluate(() => { const b = document.querySelector('#oyunDurum b[lang="en"]'); return b ? b.textContent : null; }), w4[kutular4[acikSira]],
      'Olması gereken harf iletide İngilizce olarak işaretli (<b lang="en">)');
    let sonraki = await T(page, 'gorunum');
    const kesik = hatali.slice(0, acikSira);
    assert.deepEqual([sonraki.deger, sonraki.gecersiz, sonraki.harfKapali, sonraki.pasKapali, sonraki.gonder, sonraki.sonuc], [kesik, null, false, false, 'Kontrol et', false],
      'Deneme harcanmadı: yazılan yanlış harfin önünde kesildi, hata işareti yok, "Bir harf aç" açık, tur sürüyor');
    assert.doesNotMatch(sonraki.harfSinifi, /yanlis/);
    // Kutular: kesilen yere kadar yazılmış, imleç yanlış yazılan açık harfin kutusunda (harf yine görünür), işaret kalktı;
    // hiçbir gizli harf açılmadı.
    assert.deepEqual(kutular4.map(i => sonraki.hucreler[i]), kutular4.map((i, n) => {
      const taban = acilis4.hucreler[i].s.split(' ')[0], gizliMi = taban === 'bos';
      if (n < acikSira) return {c: gizliMi ? tam(w4)[n] : w4[i], s: taban + ' yazildi'};
      return {c: gizliMi ? '' : w4[i], s: taban + (n === acikSira ? ' simdi' : '')};
    }), 'Kutular: yazılan kesildi, imleç yanlış yazılan harfte; hiçbir gizli harf açılmadı, "farkli" işareti kalktı');
    assert.equal(sonraki.tarif, acilis4.tarif, 'Açıklama değişmedi');
    assert.equal(await T(page, 'kayit', w4), null, 'İlerleme yazılmadı');
    // Kelime artık eksik: yeniden Enter "eksik" der, yine hak harcanmaz.
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Önce kelimenin tamamını yaz; açık harfleri de yaz.');
    sonraki = await T(page, 'gorunum');
    assert.deepEqual([sonraki.deger, sonraki.gonder, sonraki.sonuc, sonraki.gecersiz], [kesik, 'Kontrol et', false, null], 'Yinelenen Enter deneme harcamaz');
    // O harften devam edilir (ilk tuşta ileti kalkar): ilk denemede bilindi.
    await page.keyboard.type(tam(w4)[acikSira]);
    g = await T(page, 'gorunum');
    assert.deepEqual([g.durum, g.deger, g.hucreler.filter(h => h.s.includes('farkli')).length], ['', tam(w4).slice(0, acikSira + 1), 0], 'İlk tuşta ileti kalkar; harf doğru yazıldı');
    await page.keyboard.type(tam(w4).slice(acikSira + 1));
    await page.keyboard.press('Enter');
    assert.match(await durumOku(page), /^Bildiniz! Kelime 1\. kutuya çıktı; /, 'Açık harfteki yazım hatası ilk deneme hakkını yemez: düzeltilen kelime ilk denemede bilinmiş sayılır');
    await kutuBekle(page, w4, 1);
    const sonra4 = await T(page, 'bugunku');
    assert.deepEqual([sonra4.t, sonra4.d], [once4.t + 1, once4.d + 1], 'Cevap sayıldı ve "doğru" sayıldı');
    g = await T(page, 'gorunum');
    assert.match(g.harfSinifi, /\bdogru\b/);
    const bildin = sayim => Number(sayim.match(/✓ (\d+) bildin/)[1]);
    assert.equal(bildin(g.sayim), bildin(acilis4.sayim) + 1, 'Oturum sayımında bilinen bir arttı: ' + g.sayim);
  });

  /* ---------- 4) Üç yanlış ve "Bilemedim, göster" ---------- */
  senaryo('Üç yanlış deneme kelimeyi açar; "Bilemedim, göster" aynı sonucu verir', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    const [w, w2] = await T(page, 'sira');
    await kelimeBekle(page, w);
    const once = await T(page, 'bugunku'), bugun = await T(page, 'bugun');
    const e = await T(page, 'eksik', w), gizli = await T(page, 'gizliSira'), ilk = await T(page, 'gorunum');
    assert.equal(ilk.azami, String(w.length), 'maxlength başlığın uzunluğudur (açık harfler de yazılır)');
    await odakla(page);
    // Her denemede kelimenin tamamı yazılır, gizli harflerin hepsi yanlıştır; ikinci denemede açık harfler de yanlış yazılır.
    const denemeler = [bozuk(w, gizli), yanlisHarfler(tam(w)), bozuk(w, gizli)];
    for (const kalan of [2, 1]) {
      await page.keyboard.type(denemeler[2 - kalan]);
      await page.keyboard.press('Enter');
      // Hiçbir gizli harf tutmadı: "Doğru harfler açıldı" denmez.
      await durumBekle(page, 'Olmadı; baştan yaz. ' + (kalan === 1 ? 'Son hakkın.' : kalan + ' hakkın kaldı.'));
      const ara = await T(page, 'gorunum');
      assert.equal(ara.hucreler.filter(h => h.s.startsWith('bulundu')).length, 0, 'Hiçbir gizli harf açılmadı');
      assert.deepEqual([ara.deger, ara.azami], ['', ilk.azami], 'Yazılan silinir (kelime yeniden baştan yazılır), maxlength aynı');
      // Açık harf doğru da yanlış da yazılsa açık, gizli harf gizli kalır; sıradaki kutu yine ilk kutudur.
      assert.deepEqual(ara.hucreler, ilk.hucreler, 'Yanlış denemeden sonra kutular baştaki gibi: gizli harf sayısı aynı, açık harfler yerinde (' + (3 - kalan) + '. deneme)');
    }
    await page.keyboard.type(denemeler[2]);
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Cevap: ' + w + '. Kelime 1. kutuda; yarın tekrar gelecek.');
    await kutuBekle(page, w, 1);
    let g = await T(page, 'gorunum');
    assert.match(g.harfSinifi, /\bacildi\b/);
    assert.equal(g.hucreler.map(h => h.c).join(''), w, 'Kelime açıldı');
    assert.equal(g.hucreler.filter(h => h.s.startsWith('bos')).length, e.length, 'Bulunamayan harfler ayrı gösterilir');
    assert.deepEqual(g.hucreler.map(h => h.s), ilk.hucreler.map(h => h.s.split(' ')[0]), 'Biten turda kutularda yazım işareti (yazildi, farkli, simdi) kalmaz');
    assert.deepEqual(await T(page, 'kayit', w), {k: 1, g: bugun + 1, c: bugun}, 'Il.yanlis kaydı: 1. kutu, yarın');
    assert.deepEqual(await T(page, 'bugunku'), {t: once.t + 1, d: once.d, y: once.y + 1});
    assert.equal(g.sonuc, true); assert.equal(g.gonder, 'Sonraki kelime →');
    assert.equal(await page.locator('#oyunDurum b[lang="en"]').innerText(), w, 'Cevap İngilizce olarak işaretli');
    // Açılan kelimede bulunamayan harflerin kutuları "bos" sınıfıyla kalır; biten turda yazılan burada da yok sayılır.
    await page.keyboard.type('abc');
    assert.equal((await T(page, 'gorunum')).deger, '', 'Açılan kelimede yazılan yok sayılır');
    await page.keyboard.press('Enter');
    await kelimeBekle(page, w2);
    // Kelime yarım (baştan iki harf, ikisi de yanlış) yazılmışken "Bilemedim": yazılan silinir, kutular kelimeyi gösterir.
    await page.keyboard.type(yanlisHarfler(tam(w2)).slice(0, 2));
    await page.locator('#oyunPas').click();
    await durumBekle(page, 'Cevap: ' + w2 + '. Kelime 1. kutuda; yarın tekrar gelecek.');
    await kutuBekle(page, w2, 1);
    g = await T(page, 'gorunum');
    assert.equal(g.odak, 'oyunGirdi', 'Düğmeden sonra odak girdiye döner');
    assert.match(g.harfSinifi, /\bacildi\b/);
    assert.deepEqual([g.deger, g.hucreler.map(h => h.c).join('').split(BOSLUK).join(' ')], ['', w2], 'Yarım yazılan silinir, kutular kelimenin kendisini gösterir');
    assert.deepEqual(g.hucreler.filter(h => /yazildi|farkli|simdi/.test(h.s)), [], 'Bırakılan kelimede de yazım işareti kalmaz');
    assert.deepEqual(await T(page, 'kayit', w2), {k: 1, g: bugun + 1, c: bugun});
    assert.deepEqual(await T(page, 'bugunku'), {t: once.t + 2, d: once.d, y: once.y + 2});
    assert.equal(g.sayim, 'Bu oturum: ✓ 0 bildin · 💡 0 ipuçlu · ✗ 2 bilemedin');
    assert.equal(g.tekrar.length, 2);
  });

  /* ---------- 5) Bir harf aç ---------- */
  senaryo('"Bir harf aç": yazılanı eksik ya da yanlış olan ilk gizli harf açılır, yazılan onun önünde kesilir; gizli harflerin hepsi doğruysa ilki açılır, yazılan kalır; açılan harf de yazılır; tek gizli harf kalınca düğme kapanır, sonuç ipucuyla', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    // Dört açma durumu ve (g) adımı aynı kelimede sınanır: en az altı gizli harf gerekir (dördüncü açmadan sonra da
    // ikisi kalmalı: (g) bir harf daha açar, düğme ancak o zaman kapanır).
    await enAzBosluk(page, 6);
    const [w] = await T(page, 'sira');
    assert.ok(w, 'Düzenek: seçili katmanda altı gizli harfli kelime bulunamadı');
    await kelimeBekle(page, w);
    const e = await T(page, 'eksik', w), gizli = await T(page, 'gizliSira');
    assert.ok(e.length >= 6, 'Düzenek: en az altı gizli harf gerekli (' + w + ', ' + e.length + ' gizli harf)');
    const once = await T(page, 'bugunku');
    // yazi: yazılacak metin (kelimenin bütün harfleri); baslik: aynı harfler başlıktaki büyüklüğüyle. Harf kutuları
    // (g.harf) ayraçsız dizilir: dizideki yer harf sırasıdır, yazılan metnin o sıradaki harfi o kutuya düşer.
    const yazi = tam(w), baslik = [...w].filter(c => /[a-z]/i.test(c));
    const bak = async () => { const g = await T(page, 'gorunum'); g.harf = g.hucreler.filter(h => h.s !== 'ayrac'); return g; };
    const sil = async () => { for (let n = (await T(page, 'gorunum')).deger.length; n > 0; n--) await page.keyboard.press('Backspace'); };
    // Her açmadan sonraki ortak denetim. acilan: o ana kadar açılan harf sıraları (sonuncusu şimdi açılan);
    // kalanYazi: girdide kalması gereken metin; kesildi: yazılan kısaldı (ileti bunu ekran okuyucuya da söyler).
    const acildi = async (acilan, kalanYazi, neden, yaziNedeni, kesildi) => {
      const g = await bak(), s = acilan[acilan.length - 1], kalan = g.harf.filter(h => h.s.startsWith('bos')).length;
      assert.deepEqual(g.harf.map((h, i) => (h.s.startsWith('ipucu') ? i : -1)).filter(i => i >= 0), [...acilan].sort((a, b) => a - b), neden);
      assert.equal(g.deger, kalanYazi, yaziNedeni);
      assert.equal(g.harf[s].c, baslik[s], 'Açılan kutu kendi harfini gösterir');
      assert.equal(kalan, e.length - acilan.length, 'Her basışta bir gizli harf açılır');
      assert.equal(g.azami, String(w.length), 'Harf açılınca maxlength değişmez: başlığın uzunluğu');
      assert.equal(g.odak, 'oyunGirdi', 'Düğmeden sonra odak girdiye döner');
      assert.equal(g.harfKapali, kalan < 2, 'Düğme yalnız ikiden az gizli harf kalınca kapanır (kalan gizli harf: ' + kalan + ')');
      // Hiç çalışılmamış kelimede ipucu: doğru bilinirse kelime 1. kutuya girer.
      await durumBekle(page, (s + 1) + '. harf açıldı: ' + baslik[s] + '. Doğru bilirsen kelime 1. kutuya girer.' + (kesildi ? KESILDI : ''));
      // Ek yalnız ekran okuyucu içindir (görünmez); yazılan kesilmediyse hiç yoktur.
      assert.equal(await page.evaluate(() => { const ek = document.querySelector('#oyunDurum .visually-hidden'); return ek ? ek.textContent : ''; }), kesildi ? KESILDI : '',
        kesildi ? 'Yazılanın kesildiği, görünmeyen bir ekle söylenir' : 'Yazılan kesilmediyse iletide ek yok');
      return g;
    };
    await odakla(page);
    // (a) Hiçbir şey yazılmadan: ilk gizli harf açılır, girdi boş kalır.
    await page.locator('#oyunHarf').click();
    let g = await acildi([gizli[0]], '', 'Hiçbir şey yazılmadıysa ilk gizli harf açılır', 'Hiçbir şey yazılmadıysa girdi boş kalır');
    assert.match(g.harf[0].s, / simdi$/, 'Sıradaki kutu yine ilk kutudur');
    assert.equal(await T(page, 'kayit', w), null, 'İpucu ilerleme yazmaz');
    // (f) Açılan harf de yazılır: o atlanıp geri kalan bütün harfler yazılırsa kelime eksik sayılır.
    await page.keyboard.type(yazi.slice(0, gizli[0]) + yazi.slice(gizli[0] + 1));
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Önce kelimenin tamamını yaz; açık harfleri de yaz.');
    await sil();
    // (b) Kelime baştan, sıradaki gizli harfe kadar doğru yazılır (arada açılan harf ve doğru yazılan bir gizli harf
    // var): yazılmamış ilk gizli harf açılır, yazılan olduğu gibi kalır, sıradaki kutu açılan kutudur.
    await page.keyboard.type(yazi.slice(0, gizli[2]));
    assert.equal((await bak()).harf[gizli[0]].s, 'ipucu yazildi', 'Açılan harfin üzerine yazılınca kutusu yazılmış görünür');
    await page.locator('#oyunHarf').click();
    g = await acildi([gizli[0], gizli[2]], yazi.slice(0, gizli[2]),
      'Doğru yazılan gizli harf atlanır, yazılmamış ilk gizli harf açılır', 'Açılan harfe kadar yazılan olduğu gibi kalır');
    assert.equal(g.harf[gizli[2]].s, 'ipucu simdi', 'Sıradaki kutu açılan kutudur (açılan harf atlanmaz)');
    assert.deepEqual([g.harf[gizli[1]].s, g.harf[gizli[1]].c], ['bos yazildi', yazi[gizli[1]]], 'Doğru yazılan gizli harf yerinde durur, gizli sayılmayı sürdürür');
    // (f) Sıradaki tuş açılan kutuya düşer, bir sonrakine geçmez.
    await page.keyboard.type(yazi[gizli[2]]);
    g = await bak();
    assert.deepEqual([g.deger, g.harf[gizli[2]].s, g.harf[gizli[2]].c], [yazi.slice(0, gizli[2] + 1), 'ipucu yazildi', baslik[gizli[2]]], 'Açılan harf yazılınca kendi kutusuna oturur');
    assert.match(g.harf[gizli[2] + 1].s, / simdi$/, 'Sıra bir sonraki kutuya geçer');
    // (c) + (e) Kelimenin tamamı yazılı; açık bir harfte (ilk açılan) yazım hatası var, ilk gizli harf doğru, ondan
    // sonraki gizli harf yanlış: yanlış yazılan gizli harf açılır ve yazılan onun önünde kesilir; açık harfteki
    // yazım hatası buna karışmaz, yerinde ve işaretli kalır.
    await sil();
    await page.keyboard.type(bozuk(w, [gizli[0], gizli[3]]));
    await page.locator('#oyunHarf').click();
    g = await acildi([gizli[0], gizli[2], gizli[3]], bozuk(w, [gizli[0]]).slice(0, gizli[3]),
      'Yanlış yazılan ilk gizli harf açılır (açık harfteki yazım hatası ve doğru yazılan gizli harf atlanır)',
      'Yazılan, açılan harfin önünde kesilir (ardına yazılanlar silinir); oraya kadar yazılan, açık harfteki yazım hatasıyla birlikte aynen kalır', true);
    assert.equal(g.harf[gizli[3]].s, 'ipucu simdi', 'Açılan harften devam edilir');
    assert.deepEqual(g.harf.slice(gizli[3] + 1).filter(h => h.s.includes('yazildi')), [], 'Açılan harften sonraki kutular yazılmamış görünür');
    assert.deepEqual([g.harf[gizli[0]].s, g.harf[gizli[0]].c], ['ipucu yazildi farkli', yanlisHarfler(yazi[gizli[0]])], 'Açık harfteki yazım hatası kutusunda işaretli kalır');
    // (d) Gizli harflerin hepsi doğru yazılmış (kelime baştan sona doğru yazılı): ilk gizli harf açılır, yazılan kalır.
    await sil();
    await page.keyboard.type(yazi);
    await page.locator('#oyunHarf').click();
    const acilan = [gizli[0], gizli[2], gizli[3], gizli[1]];
    g = await acildi(acilan, yazi, 'Gizli harflerin hepsi doğru yazıldıysa ilk gizli harf açılır', 'Gizli harflerin hepsi doğruysa yazılan olduğu gibi kalır');
    assert.equal(g.harf[gizli[1]].s, 'ipucu yazildi', 'Üzerine yazılmış harf açılınca da yazılmış görünür');
    // (g) Tek gizli harf kalana kadar aç (yazılan yerinde durur); iki gizli harf varken açık olan düğme o zaman kapanır.
    for (const s of gizli.slice(4, -1)) {
      await page.locator('#oyunHarf').click();
      acilan.push(s);
      g = await acildi(acilan, yazi, 'Kelime doğru yazılıyken her basış sıradaki ilk gizli harfi açar', 'Yazılan yerinde kalır');
    }
    assert.equal(g.harf.filter(h => h.s.startsWith('bos')).length, 1);
    assert.equal(g.harfKapali, true, 'Tek gizli harf kalınca düğme kapalı');
    assert.deepEqual([g.deger, g.azami], [yazi, String(w.length)], 'Tek gizli harf kalınca da yazılan yerinde, maxlength başlığın uzunluğu');
    // Kelime baştan sona yazılı (açılan harfler de): Enter ile kontrol edilir.
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
  senaryo('Seviyeler: kutu = seviye (%30, %20), vadesi gelen önce, ipucuyla kutu aynı kalır; kelime aynı kalan tur değişiminde yalnız sıra satırı duyurulur, yazılan harfler ve odak kalır; öğrenilenler harfsiz, aynı gün yeniden sorulmaz', async () => {
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
    // Vadesi gelen kelime kalmadı: "Yalnız yeni kelimeler"e geçince de, geri dönünce de ilk kelime aynıdır. Soru
    // yinelenmez ama yeni sıra satırı duyurulur (duyuru bölgesi tam olarak o satır olur); yazılmış harflere dokunulmaz.
    // Kelime baştan yazılır: ilk gizli harfe kadar, o da dahil (en az iki harf).
    const uzunSira = g.siraMetni, yazilanlar = tam(f.ilk).slice(0, Math.max(2, (await T(page, 'gizliSira'))[0] + 1));
    await page.locator('#oyunGirdi').focus();
    await page.keyboard.type(yazilanlar);
    const yaziliKutular = (await T(page, 'gorunum')).hucreler;
    assert.equal(yaziliKutular.filter(h => h.s.includes('yazildi')).length, yazilanlar.length, 'Düzenek: yazılan harfler kutulara baştan oturdu');
    for (const [mod, satir] of [['yeni', 'Sırada ' + (f.oynanan - 4) + ' yeni kelime.'], ['sira', uzunSira]]) {
      await page.locator('.oyun-mod [data-mod="' + mod + '"]').click();
      await duyuruBekle(page, satir);
      // Soru geriden gelip sıra satırının yerine geçmez: sayfa saati bir saniye ileri sürülür (beklemeden; bekleyen
      // zamanlayıcılar o an çalışır), duyuru bölgesi aynı kalır.
      await page.clock.runFor(1000);
      assert.equal(await page.evaluate(() => document.getElementById('oyunDuyuru').textContent), satir, 'Sıra satırı duyurulduktan sonra duyuru bölgesi değişmez: soru geriden gelip yerine geçmez (' + mod + ')');
      g = await T(page, 'gorunum');
      assert.deepEqual([await T(page, 'mod'), g.siraMetni], [mod, satir], 'Basılı tur düğmesi ve görünen sıra satırı duyurulanla aynı');
      assert.equal(g.deger, yazilanlar, 'Aynı kelime ekranda kaldıysa mod değişimi yazılan harfleri silmez (' + mod + ')');
      assert.deepEqual(g.hucreler, yaziliKutular, 'Kutular da yazıldığı gibi kalır: yazılmış kutular ve sıradaki kutu aynı (' + mod + ')');
      assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-mod')), mod, 'Aynı kelime ekranda kaldıysa odak basılan tur düğmesinde kalır, girdiye taşınmaz (' + mod + ')');
    }
    // Öğrenilenler: harfsiz.
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    await kelimeBekle(page, f.Z1);
    g = await T(page, 'gorunum');
    assert.equal(g.seviye, 'Seviye 6 · harf yok');
    assert.equal(g.kutu, 'öğrenildi');
    assert.equal(g.hucreler.filter(h => !h.s.startsWith('bos')).length, 0, 'Hiç açık harf yok');
    assert.equal(g.hucreler.map(h => h.c).join(''), '');
    assert.equal(g.azami, String(f.Z1.length));
    // Hiç açık harf yok: açıklama "açık harfler dahil" demez.
    assert.equal(g.tarif, beklenenAciklama(g), 'Harfsiz kartın açıklaması');
    assert.ok(g.tarif.endsWith('. Kelimenin tamamını yaz, Enter ile kontrol et.'), 'Harfsiz kartta yönerge açık harften söz etmez: ' + g.tarif);
    assert.equal(g.siraMetni, 'Sırada 2 öğrenilmiş kelime; hepsi harfsiz sorulur.');
    assert.equal(await page.locator('.oyun-mod [data-mod="ogrenilen"]').getAttribute('aria-pressed'), 'true');
    // Bilemedim: 5. kutudan 4'e düşer.
    await page.locator('#oyunPas').click();
    await durumBekle(page, 'Cevap: ' + f.Z1 + '. Kelime 4. kutuda; yarın tekrar gelecek.');
    await kutuBekle(page, f.Z1, 4);
    assert.deepEqual(await T(page, 'kayit', f.Z1), {k: 4, g: f.bugun + 8, c: f.bugun + 7});
    await page.keyboard.press('Enter');
    await kelimeBekle(page, f.Z2);
    // Son harfi eksik yazılan harfsiz kelimede ileti de açık harften söz etmez; yazılan yerinde kalır, deneme harcanmaz
    // (ardından gelen "Bildiniz" ilk denemenin iletisidir).
    await page.keyboard.type(f.Z2.slice(0, -1));
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Önce kelimenin tamamını yaz.');
    assert.equal((await T(page, 'gorunum')).deger, f.Z2.slice(0, -1), 'Eksik yazılan yerinde kalır');
    await page.keyboard.type(f.Z2.slice(-1));
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

  /* ---------- 6b) Açık sayfada yeni gün ve değişmiş kayıt ---------- */
  senaryo('Açık sayfada gün dönüşü ve başka sekmede sıfırlama: tamamlanan öğrenilmiş kart yeni gün yeniden gelir; sıfırlanan veya yeniden vadesi gelen kayıt oturum filtresine takılmaz', async () => {
    const context = await yeni(), page = await context.newPage();
    await page.clock.setFixedTime(GUN(0));
    await ac(page, base);
    const [w] = await T(page, 'sira');
    assert.equal(await T(page, 'kayitKoy', w, 5), true, 'Düzenek: ilk kart öğrenildi');
    await page.reload(); await hazir(page);
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    await kelimeBekle(page, w);
    await coz(page, w);
    await durumBekle(page, 'Bildiniz! Harfsiz de doğru; kelime öğrenilenlerde kalıyor.');
    const ilkGun = await T(page, 'bugun');
    await page.waitForFunction(([w, gun]) => window.__oyun.kayit(w).c === gun, [w, ilkGun]);
    await page.locator('#oyunGonder').click();
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    // Gün aynıyken mod değiştirerek yeniden sorulamaz.
    await page.locator('.oyun-mod [data-mod="sira"]').click();
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    // Reload yok: önceki cevabın oturum işareti hâlâ bu belgededir.
    await page.clock.setFixedTime(GUN(1));
    await page.locator('.oyun-mod [data-mod="sira"]').click();
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    assert.deepEqual(await T(page, 'sira', 'ogrenilen'), [w], 'Yeni günün uygun öğrenilmiş kartı');
    await kelimeBekle(page, w);
    assert.equal((await T(page, 'gorunum')).siraMetni, 'Sırada 1 öğrenilmiş kelime; hepsi harfsiz sorulur.');
    await coz(page, w);
    await page.waitForFunction(([w, gun]) => window.__oyun.kayit(w).c === gun, [w, ilkGun + 1]);
    assert.deepEqual(await T(page, 'bugunku'), {t: 1, d: 1, y: 0}, 'Yeni günün cevabı yalnız bir kez sayıldı');
    await page.locator('#oyunGonder').click();
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    // Başka sekmeden sıfırlama: aynı gün bu oturumda tamamlanmış kart yeniden yenidir.
    const other = await context.newPage();
    await other.clock.setFixedTime(GUN(1));
    await ac(other, base);
    assert.equal(await other.evaluate(w => window.YDS.Ilerleme.sifirlaKelime(w, 'kelime'), w), true);
    await page.waitForFunction(w => window.__oyun.kayit(w) === null, w);
    await page.locator('.oyun-mod [data-mod="yeni"]').click();
    await kelimeBekle(page, w);
    assert.equal((await T(page, 'gorunum')).kutu, 'hiç çalışılmadı', 'Sıfırlanan kart yenilemesiz açılır');
    await coz(page, w); await kutuBekle(page, w, 1);
    await page.locator('#oyunGonder').click();
    // Yalnız silme değil: aynı gün farklı bir kutuda tekrar vadesi verilen kayıt da oynanabilir.
    assert.equal(await T(other, 'kayitKoy', w, 3), true);
    await page.waitForFunction(w => window.__oyun.kayit(w).k === 3, w);
    await page.locator('.oyun-mod [data-mod="sira"]').click();
    await kelimeBekle(page, w);
    assert.equal((await T(page, 'gorunum')).kutu, '3. kutu · tekrar zamanı');
    await coz(page, w); await kutuBekle(page, w, 4);
    assert.deepEqual(await T(page, 'bugunku'), {t: 3, d: 3, y: 1}, 'Üç doğru cevap ve sıfırlama sonrası bir yeni açılış sayıldı; önceki yazımlar yinelenmedi');
  });

  /* ---------- 6c) Kart değişmeden yeni gün ---------- */
  senaryo('Aynı kartta gün dönüşü: mod değişiminde eski yanlış deneme ve harf düzeni sıfırlanır, yeni günün ilk doğru cevabı ipuçlu sayılmaz', async () => {
    const page = await yeniSayfa();
    await page.clock.setFixedTime(GUN(0));
    await ac(page, base); await enAzBosluk(page, 2);
    const [w] = await T(page, 'sira');
    await kelimeBekle(page, w);
    await page.locator('#oyunGirdi').fill(bozuk(w, await T(page, 'gizliSira')));
    await page.locator('#oyunGonder').click();
    await durumBekle(page, 'Olmadı; baştan yaz. 2 hakkın kaldı.');
    // Aynı günün aynı kartı: mod geçişi hak kazandırmaz.
    await page.locator('.oyun-mod [data-mod="yeni"]').click();
    assert.equal((await T(page, 'gorunum')).durum, 'Olmadı; baştan yaz. 2 hakkın kaldı.');
    await page.locator('.oyun-mod [data-mod="sira"]').click();
    await page.clock.setFixedTime(GUN(1));
    // Boş moda geçilmez, simdi temizlenmez: iki sıranın başı aynı karttır.
    await page.locator('.oyun-mod [data-mod="yeni"]').click();
    await kelimeBekle(page, w);
    const g = await T(page, 'gorunum');
    assert.deepEqual([g.durum, g.deger, g.gecersiz], ['', '', null], 'Yeni günün tam hakkı ve temiz girdisi');
    const once = await T(page, 'bugunku');
    await coz(page, w); await kutuBekle(page, w, 1);
    assert.match((await T(page, 'gorunum')).durum, /^Bildiniz!/, 'Dünkü yanlış yeni günün ilk doğru cevabını ipuçlu yapmaz');
    const sonra = await T(page, 'bugunku');
    assert.deepEqual([sonra.t - once.t, sonra.d - once.d, sonra.y - once.y], [1, 1, 1], 'Yeni günün ilk doğru cevabı doğru sayılır; kart ilk kez açılır');
  });

  /* ---------- 7) Yazım sadeleştirme, tireli ve çok sözcüklü başlık ---------- */
  senaryo('Yazım: İ/I/ı tek "i" olur (açık "i" kutusunda farklı sayılmaz); rakam, "/", boşluk, tire elenir ve harfleri kaydırmaz, fazlası kesilir; açık büyük harf başlıktaki hâliyle kalır; tireli, çok sözcüklü ve en uzun başlık baştan sona yalnız harfle çözülür, dar ekrana sığar', async () => {
    const context = await yeni();
    const page = await context.newPage();
    await page.clock.setFixedTime(GUN(0));
    await ac(page, base);
    const f = await page.evaluate(() => {
      const Y = window.YDS, O = Y.OyunHesap, Il = Y.Ilerleme;
      const oynanan = Y.Veri.dizin.filter(d => O.oynanabilir(d));
      const yarin = Il.bugun() + 1;
      // 1. kutuda yarın gizli kalacak harfleri arasında da açık gelecek harfleri arasında da "i" olan, en az üç
      // gizli harfli Çekirdek kelimesi.
      const harfler = (w, acikMi) => { const acik = O.acikKonumlar(w, 1, yarin); return [...w].filter((c, i) => acik.includes(i) === acikMi).join(''); };
      const I = oynanan.find(d => d.k === 2 && /^[a-z]+$/.test(d.e) && harfler(d.e, false).length >= 3 && harfler(d.e, false).includes('i') && harfler(d.e, true).includes('i')).e;
      const tireli = oynanan.find(d => d.k === 6 && d.e.includes('-'));
      const bosluklu = oynanan.find(d => d.e.includes(' '));
      // Büyük harfle başlayan başlık (Celsius): büyük harfi 1. kutuda yarın açık gelen.
      const buyuk = oynanan.find(d => /^[A-Z][a-z]+$/.test(d.e) && O.acikKonumlar(d.e, 1, yarin).includes(0));
      if (!buyuk) return {eksik: true};
      // Seçilen katmanlardaki en uzun başlık (kutu satırı birkaç satıra bölünür).
      const katmanlar = [...new Set([2, tireli.k, bosluklu.k, buyuk.k])].sort();
      const uzun = oynanan.filter(d => katmanlar.includes(d.k) && d.e !== tireli.e && d.e !== bosluklu.e && d.e !== buyuk.e)
        .reduce((a, d) => (d.e.length > a.e.length ? d : a));
      [I, tireli.e, bosluklu.e, uzun.e, buyuk.e].forEach(w => Il.yanlis(w, 'kelime'));
      Y.Depo.yaz('yds-katmanlar', katmanlar);
      return {I, tireli: tireli.e, bosluklu: bosluklu.e, uzun: uzun.e, buyuk: buyuk.e};
    });
    assert.equal(f.eksik, undefined, 'Düzenek: büyük harfle başlayan, büyük harfi 1. kutuda (yarının tohumuyla) açık gelen oynanabilir başlık bulunamadı (Celsius gibi)');
    await page.clock.setFixedTime(GUN(1));
    await page.reload(); await hazir(page);
    const sira = await T(page, 'sira', 'sira', 5);
    assert.deepEqual([...sira].sort(), [f.I, f.tireli, f.bosluklu, f.uzun, f.buyuk].sort(), 'Düzenek: vadesi gelen beş kelime sıranın başında');
    // Kelime baştan sona yazıldıktan sonra (Enter'dan önce): her harf kutusu yazılmış, hiçbiri "farklı" değil, sıradaki
    // kutu kalmamış; kutularda başlık okunur (gizli harf yazıldığı gibi, açık harf başlıktaki büyüklüğüyle). Atılan bir
    // karakter ya da ayraç kutusu harfleri kaydırsaydı açık kutular "farklı" olur, son kutular boş kalırdı.
    // ilk: kelimenin dokunulmamış kutuları.
    // Tireli ya da çok sözcüklü başlıkta her parça (ayracıyla birlikte) tek satırda durur: satır yalnız ayraçtan kırılır.
    // Bir satıra sığmayacak kadar uzun parça (dar ekranda 10, geniş ekranda 18 kutudan uzun) bilerek bölünür; bu
    // senaryonun başlıklarında öyle parça yoktur. Dönen: birden çok satıra yayılan parçaların metinleri.
    const bolunenParcalar = () => page.evaluate(() => [...document.querySelectorAll('#oyunHarfler .parca')]
      .filter(p => new Set([...p.querySelectorAll('.harf')].map(h => Math.round(h.getBoundingClientRect().top))).size > 1)
      .map(p => p.querySelectorAll('.harf').length + ' kutu'));
    const yerinde = (ilk, g, w) => {
      assert.deepEqual(g.hucreler.map(h => h.s), ilk.map(h => (h.s === 'ayrac' ? 'ayrac' : h.s.split(' ')[0] + ' yazildi')),
        JSON.stringify(w) + ': yazılan her harf sırayla bir harf kutusuna oturur, hiçbir açık kutu "farklı" olmaz');
      assert.equal(g.hucreler.map(h => h.c).join('').split(BOSLUK).join(' '), w, JSON.stringify(w) + ': kutularda başlığın kendisi okunur');
    };
    // Ayraçtan sonraki açık harfinde yazım hatası denenen başlıklar (aşağıda).
    const ayracSonrasi = [];
    for (const w of sira) {
      await kelimeBekle(page, w);
      let g = await T(page, 'gorunum');
      const ilk = g.hucreler;
      assert.equal(g.seviye, 'Seviye 2 · harflerin %40\'ı açık');
      // Dar ekranda kutular kartın içinde kalır, sayfa yatay kaymaz. Tek parçalı uzun başlık satıra sığmazsa dengeli
      // bölünür; çok parçalı başlıkta satır yalnız ayraçtan kırılır.
      const cokParcali = /[- ]/.test(w);
      for (const en of [320, 375]) {
        await page.setViewportSize({width: en, height: 812});
        const sigma = await page.evaluate(() => {
          const alan = document.querySelector('.harf-alan').getBoundingClientRect();
          const disarida = [...document.querySelectorAll('#oyunHarfler .harf')].map(h => h.getBoundingClientRect())
            .filter(r => r.left < alan.left - 0.5 || r.right > alan.right + 0.5 || r.width < 12).length;
          return {disarida, ekran: innerWidth, kaydirma: document.documentElement.scrollWidth};
        });
        assert.deepEqual([sigma.disarida, sigma.kaydirma <= sigma.ekran + 1], [0, true], w.length + ' karakterli başlık ' + en + ' px: ' + JSON.stringify(sigma));
        if (cokParcali) assert.deepEqual(await bolunenParcalar(), [], JSON.stringify(w) + ' ' + en + ' px: hiçbir parça iki satıra bölünmez (imleç satırlar arasında gidip gelmesin)');
      }
      await page.setViewportSize({width: 1280, height: 900});
      if (cokParcali) assert.deepEqual(await bolunenParcalar(), [], JSON.stringify(w) + ' 1280 px: hiçbir parça iki satıra bölünmez');
      const e = await T(page, 'eksik', w), y = tam(w);
      assert.ok(e.length < y.length, 'Düzenek: kelimede açık harf var');
      // Tarayıcı sınırı sayfanın temizliğinden önce uygular: ayraçlar da sayılmasaydı tek parça gelen "well-being" son harfini yitirirdi.
      assert.equal(g.azami, String(w.length), 'maxlength başlığın uzunluğudur: açık harfler de yazılır, ayraçlara da yer vardır');
      await page.locator('#oyunGirdi').focus();
      if (w === f.I) {
        // Rakam, noktalama, boşluk ve tire girmez.
        await page.keyboard.type('1/ -9.');
        assert.equal((await T(page, 'gorunum')).deger, '', 'Harf olmayan karakter girdiye girmez');
        // Türkçe klavye harfleri (I, ı, İ) tek "i" olur: açık "i" kutusunun üzerine yazılınca kutu "farklı" sayılmaz
        // (başka harf yazılınca sayılır). Gizli "i" kutusu yanlış harfte de "farklı" olmaz: işaret cevabı ele verirdi.
        const acikI = ilk.findIndex(h => h.s.startsWith('sabit') && h.c === 'i'), gizliI = ilk.findIndex((h, i) => h.s.startsWith('bos') && w[i] === 'i');
        for (const [konum, taban] of [[acikI, 'sabit'], [gizliI, 'bos']]) {
          await page.keyboard.type(y.slice(0, konum));
          for (const tus of ['I', 'ı', 'İ', 'q']) {
            await page.keyboard.type(tus);
            const harf = tus === 'q' ? 'q' : 'i', gi = await T(page, 'gorunum');
            assert.deepEqual([gi.deger, gi.hucreler[konum]], [y.slice(0, konum) + harf, {c: harf, s: taban + ' yazildi' + (tus === 'q' && taban === 'sabit' ? ' farkli' : '')}],
              (taban === 'sabit' ? 'Açık' : 'Gizli') + ' "i" kutusuna ' + JSON.stringify(tus) + ' yazıldı');
            await page.keyboard.press('Backspace');
          }
          for (let i = 0; i < konum; i++) await page.keyboard.press('Backspace');
        }
        // Telefon klavyesi harfi bileşimle yazar: bileşim sürerken girdi değerine dokunulmaz ("İ" olduğu gibi durur),
        // kutular yine sadeleşmiş hâli gösterir (açık "i" kutusu "farklı" olmaz); bileşim bitince değer de sadeleşir.
        const klavye = await context.newCDPSession(page);
        await page.keyboard.type(y.slice(0, acikI));
        await klavye.send('Input.imeSetComposition', {text: 'İ', selectionStart: 1, selectionEnd: 1});
        g = await T(page, 'gorunum');
        assert.deepEqual([g.deger, g.hucreler[acikI]], [y.slice(0, acikI) + 'İ', {c: 'i', s: 'sabit yazildi'}], 'Bileşim sürerken açık "i" kutusuna "İ" yazıldı');
        await klavye.send('Input.insertText', {text: 'İ'});
        assert.equal((await T(page, 'gorunum')).deger, y.slice(0, acikI + 1), 'Bileşim bitince girdi değeri de sadeleşir');
        for (let i = 0; i <= acikI; i++) await page.keyboard.press('Backspace');
        // Kelimenin tamamı gürültüyle yazılır: araya giren "/", boşluk, rakam ve tire atılır; fazlası alınmaz.
        const gurultulu = [...y].map((c, i) => (c === 'i' ? 'İ' : c.toUpperCase()) + ['/', ' ', '3', '-'][i % 4]).join('');
        await page.keyboard.type(gurultulu + 'zz');
        g = await T(page, 'gorunum');
        assert.equal(g.deger, y, 'Girdi sadeleşti: ' + JSON.stringify(gurultulu) + ' → ' + JSON.stringify(g.deger));
        // Tuşla yazılan fazlalığı tarayıcı maxlength ile durdurur; sınırı aşan bir değer başka yoldan gelirse (betik,
        // bileşimle yazan klavye) sayfa kendisi keser.
        await page.evaluate(v => { const girdi = document.getElementById('oyunGirdi'); girdi.value = v; girdi.dispatchEvent(new Event('input', {bubbles: true})); }, y + 'zz');
        g = await T(page, 'gorunum');
        assert.equal(g.deger, y, 'Kelimenin harf sayısını aşan harfler kesilir');
      } else if (w === f.buyuk) {
        // Açık büyük harf küçük de büyük de yazılsa "farklı" sayılmaz, kutuda başlıktaki büyüklüğüyle kalır.
        for (const tus of [y[0], w[0]]) {
          await page.keyboard.type(tus);
          const gb = await T(page, 'gorunum');
          assert.deepEqual([gb.deger, gb.hucreler[0]], [y[0], {c: w[0], s: 'sabit yazildi'}], 'Açık ' + JSON.stringify(w[0]) + ' kutusuna ' + JSON.stringify(tus) + ' yazıldı');
          await page.keyboard.press('Backspace');
        }
        // Açık büyük harfin üzerine başka harf, kelimenin kalanı doğru: deneme harcanmaz; iletide harf başlıktaki
        // büyüklüğüyle söylenir (Celsius → C).
        await page.keyboard.type(bozuk(w, [0]));
        await page.keyboard.press('Enter');
        assert.equal(await durumOku(page), '1. harf yanlış, ' + w[0] + ' olmalı. O harften devam et.',
          'Açık büyük harfteki yazım hatası: olması gereken harf başlıktaki büyüklüğüyle söylenir (' + w + ')');
        for (let i = 0; i < y.length; i++) await page.keyboard.press('Backspace');
        // Açık büyük harf küçük yazılıp SONRAKİ bir açık harfe başka harf yazılınca bildirilen o harftir: büyük harf
        // küçük yazıldı diye "farklı" sayılmaz.
        const baskaAcik = ilk.findIndex((h, i) => i > 0 && h.s.startsWith('sabit'));
        assert.ok(baskaAcik > 0, 'Düzenek: büyük harfli başlıkta ikinci bir açık harf var (' + w + ')');
        await page.keyboard.type(bozuk(w, [baskaAcik]));
        await page.keyboard.press('Enter');
        assert.equal(await durumOku(page), (baskaAcik + 1) + '. harf yanlış, ' + w[baskaAcik] + ' olmalı. O harften devam et.',
          'Büyük harfli başlıkta sonraki açık harfteki yazım hatası: o harf bildirilir, küçük yazılan açık büyük harf değil (' + w + ')');
        for (let i = 0; i < y.length; i++) await page.keyboard.press('Backspace');
        await page.keyboard.type(y);
        g = await T(page, 'gorunum');
        assert.equal(g.deger, y);
      } else {
        const ayrac = w.includes('-') ? '-' : (w.includes(' ') ? ' ' : '');
        [...w].forEach((c, i) => {
          if (c !== '-' && c !== ' ') { assert.doesNotMatch(g.hucreler[i].s, /ayrac/); return; }
          assert.equal(g.hucreler[i].s, 'ayrac', 'Ayraç sabit kutudur');
          assert.equal(g.hucreler[i].c, c === ' ' ? BOSLUK : '-');
        });
        // Boşluk ayracı "sözcük arası" diye okunur: "boşluk", gizli hücrenin adı olan "boş" ile karışırdı.
        if (ayrac) assert.ok(g.tarif.includes(ayrac === '-' ? ', tire, ' : ', sözcük arası, ') && !g.tarif.includes('boşluk'), 'Açıklama ayracı adıyla okur: ' + g.tarif);
        assert.doesNotMatch(e, /[- ]/);
        // Yapıştırılan ya da klavyenin tek parça gönderdiği başlık (ayracıyla birlikte) son harfini yitirmez.
        if (ayrac) {
          await page.keyboard.insertText(w);
          assert.equal((await T(page, 'gorunum')).deger, y, 'Tek parça gelen başlık: ayraç atılır, bütün harfler kalır (' + JSON.stringify(w) + ')');
          for (let i = 0; i < y.length; i++) await page.keyboard.press('Backspace');
          assert.equal((await T(page, 'gorunum')).deger, '');
        }
        // Başlık yazıldığı gibi, tiresi ve boşluğuyla yazılır (ayraçsız başlıkta araya tire sokulur): ayraç yok sayılır.
        const yazilan = ayrac ? w : y.slice(0, 1) + '-' + y.slice(1);
        await page.keyboard.type(yazilan);
        g = await T(page, 'gorunum');
        assert.equal(g.deger, y, 'Ayraç girdiye girmez: ' + JSON.stringify(yazilan) + ' → ' + JSON.stringify(g.deger));
        if (ayrac) {
          // maxlength ayraçlara da yer bırakır: harf sayısını aşan harfi tarayıcı durdurmaz, sayfa kendisi keser (kesmeseydi
          // fazladan harf kutularda görünmeden girdide kalır, ilk Backspace yalnız onu silerdi).
          await page.keyboard.type('z');
          assert.equal((await T(page, 'gorunum')).deger, y, 'Ayraçlı başlıkta harf sayısını aşan harf girdiye girmez (' + JSON.stringify(w) + ')');
          // Ayraçtan SONRAKİ açık harfte yazım hatası: iletideki harf sırası ayraçları saymaz, harf o kutunun harfidir.
          const harfKutulari = ilk.map((h, i) => i).filter(i => ilk[i].s !== 'ayrac');
          const sonraki = harfKutulari.findIndex(i => i > w.indexOf(ayrac) && ilk[i].s.startsWith('sabit'));
          if (sonraki >= 0) {
            for (let i = 0; i < y.length; i++) await page.keyboard.press('Backspace');
            await page.keyboard.type(bozuk(w, [sonraki]));
            await page.keyboard.press('Enter');
            assert.equal(await durumOku(page), (sonraki + 1) + '. harf yanlış, ' + w[harfKutulari[sonraki]] + ' olmalı. O harften devam et.',
              'Ayraçtan sonraki açık harfte yazım hatası: harf sırası ayraçları saymaz (' + JSON.stringify(w) + ')');
            for (let i = 0; i < y.length; i++) await page.keyboard.press('Backspace');
            await page.keyboard.type(y);
            g = await T(page, 'gorunum');
            ayracSonrasi.push(w);
          }
        }
      }
      yerinde(ilk, g, w);
      await page.keyboard.press('Enter');
      await durumBekle(page, 'Bildiniz! Kelime 2. kutuya çıktı; bir dahaki sefere harflerin %30\'u açık gelecek.');
      await kutuBekle(page, w, 2);
      assert.equal((await T(page, 'gorunum')).hucreler.map(h => h.c).join('').split(BOSLUK).join(' '), w);
      await page.keyboard.press('Enter');
    }
    assert.ok(ayracSonrasi.length, 'Düzenek: tireli ya da çok sözcüklü başlıklardan en az birinde ayraçtan SONRA açık gelen harf olmalı (iletideki harf sırası ayraçları saymaz)');
    assert.ok(sira.filter(w => /[- ]/.test(w)).every(w => w.split(/[- ]/).every(p => p.length + 1 <= 10)),
      'Düzenek: çok parçalı başlıkların her parçası (ayracıyla) dar ekranın bir satırına sığar; sığmayan parça bilerek bölünür, o zaman bolunenParcalar beklentisini daraltın');
    return 'kelimeler: ' + f.I.length + ' harfli, tireli ' + f.tireli.length + ', boşluklu ' + f.bosluklu.length + ', en uzun ' + f.uzun.length + ' karakter, büyük harfli ' + f.buyuk;
  });

  /* ---------- 8) Katman seçimi ve inmeyen katman ---------- */
  senaryo('Katman: seçim yds-katmanlar\'a yazılır, sıra yeniden kurulur, boş seçim hatasız; yüklü katman kapanınca sıra satırı duyurulur; inmeyen katmanda oyun sürer', async () => {
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
    // Yüklü katmanlar arasında geçişte yarım kelime ve yazılan harfler korunur (kelime baştan, ilk gizli harfine
    // kadar yazılır: yazılanlar kutularında da durur).
    await katman(2).click();
    await kelimeBekle(page, w);
    await page.locator('#oyunGirdi').focus();
    const bas = tam(w).slice(0, (await T(page, 'gizliSira'))[0] + 1);
    await page.keyboard.type(bas);
    const yazili = (await T(page, 'gorunum')).hucreler;
    assert.equal(yazili.filter(h => h.s.includes('yazildi')).length, bas.length, 'Düzenek: yazılan her harf bir kutuya oturdu');
    await katman(3).click();
    await page.waitForFunction(() => window.__oyun.secili().join() === '2');
    assert.deepEqual(await depo(), [2]);
    g = await T(page, 'gorunum');
    assert.equal(g.deger, bas, 'Aynı kelime sırada kaldıysa yazılan harfler silinmez');
    assert.deepEqual(g.hucreler, yazili, 'Yazılan harfler kutularında da olduğu gibi kalır');
    assert.equal(await T(page, 'uyuyor', w, false), true);
    // İlk kelimenin sahibi olmayan (yüklü) katman kapandı: soru yinelenmez ama yeni sıra satırı duyurulur
    // (duyuru bölgesi tam olarak o satır olur).
    assert.equal(g.siraMetni, 'Sırada ' + sayi.o2 + ' kelime: 0 tekrar + ' + sayi.o2 + ' yeni.', 'Kapanan katmanın kelimeleri sıradan çıktı');
    await duyuruBekle(page, g.siraMetni);
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
    // Kelimenin ilk harfi yazılır; kalanı katman indikten sonra.
    const y2 = tam(k2);
    await cevrimdisi.keyboard.type(y2[0]);
    const yazili2 = (await T(cevrimdisi, 'gorunum')).hucreler;
    // Hâlâ çevrimdışı: uyarı kalır, yazılan silinmez.
    const dustu = cevrimdisi.waitForEvent('requestfailed', r => KATMAN_DOSYASI.test(r.url()));
    await cevrimdisi.locator('#oyunYukDene').click();
    await dustu;
    await cevrimdisi.evaluate(() => new Promise(r => setTimeout(r, 0)));
    g = await T(cevrimdisi, 'gorunum');
    assert.ok(g.yukNotu, 'Başarısız yeniden denemede uyarı kalır'); assert.equal(g.deger, y2[0]);
    engel = false;
    await cevrimdisi.locator('#oyunYukDene').click();
    await cevrimdisi.locator('#oyunYuk').waitFor({state: 'hidden'});
    anlam = await T(cevrimdisi, 'anlam', k2, true, false);
    assert.equal(anlam.gorulen, anlam.beklenen, 'Katman inince anlam ayrıntılı hâle gelir');
    g = await T(cevrimdisi, 'gorunum');
    assert.equal(g.deger, y2[0], 'Yeniden deneme yazılanı silmez'); assert.equal(g.odak, 'oyunGirdi');
    assert.deepEqual(g.hucreler, yazili2, 'Yazılan harf kutusunda da kalır');
    await cevrimdisi.keyboard.type(y2.slice(1));
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
  senaryo('Başka sekme: yanıtlanan kelime ikinci kez yazılmaz; dokunulmamış kelime ve katman seçimi yenilenir; kaydı değişen dokunulmamış kelime yeni seviyesiyle çizilir ve cevabı yazılır', async () => {
    const context = await yeni();
    const a = await context.newPage();
    await ac(a, base);
    const [w, w2, w3] = await T(a, 'sira');
    await kelimeBekle(a, w);
    await a.locator('#oyunGirdi').focus();
    // Kelime baştan, ilk gizli harfine kadar yazılır (yarım kelime); kalanı öbür sekmenin cevabından sonra.
    const y = tam(w), bas = y.slice(0, (await T(a, 'gizliSira'))[0] + 1);
    await a.keyboard.type(bas);
    const yazili = (await T(a, 'gorunum')).hucreler;
    assert.equal(yazili.filter(h => h.s.includes('yazildi')).length, bas.length, 'Düzenek: yazılan her harf bir kutuya oturdu');
    const b = await context.newPage();
    await ac(b, base);
    assert.equal(await b.evaluate(k => window.YDS.Ilerleme.dogru(k, 'kelime'), w), 1, 'Öbür sekme kelimeyi yanıtladı');
    await a.bringToFront();
    // Üzerinde çalışılan kelime yerinde kalır; girdi, yazılan harflerin kutuları ve odak değişmez.
    await a.waitForTimeout(400);
    let g = await T(a, 'gorunum');
    assert.equal(g.deger, bas); assert.equal(g.odak, 'oyunGirdi');
    assert.deepEqual(g.hucreler, yazili, 'Yazılan harfler kutularında durur');
    assert.equal(await T(a, 'uyuyor', w, false), true, 'Yarım kelime depolama olayıyla değişmez');
    await a.keyboard.type(y.slice(bas.length));
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
    await a.keyboard.type(tam(w3));
    await a.keyboard.press('Enter');
    await durumBekle(a, BASKA_SEKME);
    assert.equal(await a.evaluate(k => window.YDS.Depo.oku('yds-leitner', {})[window.YDS.Ilerleme.ilerlemeKimligi(k, 'kelime')].k, w3), 1,
      'Kelime yine tek kez yükseltildi');
    assert.equal((await T(a, 'gorunum')).sayim, 'Bu oturum: ✓ 0 bildin · 💡 0 ipuçlu · ✗ 0 bilemedin');
    // Ekrandaki dokunulmamış kelimenin kaydı öbür sekmede değişir (3. kutu, vadesi bugün) ve olay ulaşır: kelime
    // sıranın başında kalır ama yeni seviyesiyle yeniden çizilir; cevabı da o taze kayıtla karşılaştırılıp yazılır,
    // "başka sekmede yanıtlanmış" diye geri çevrilmez.
    await a.keyboard.press('Enter');
    // Sıradaki kelime öbür sekmenin belleğinden okunur (bu sekmeninki olaysız yazım yüzünden eski).
    const [w4] = await T(b, 'sira', 'sira', 1, [2, 3]);
    await kelimeBekle(a, w4);
    await a.evaluate(() => { window.__depolamaOlayiYok = false; });
    assert.equal(await T(b, 'kayitKoy', w4, 3), true, 'Düzenek: öbür sekme kaydı yazdı');
    // Sıra satırı tekrarı gösterdiğinde kart da çizilmiştir (aynı görevde); seviye bundan sonra okunur.
    await a.waitForFunction(() => /: 1 tekrar \+ /.test(document.getElementById('oyunSira').textContent));
    const duzen4 = await T(a, 'duzen', w4, 3), bugun = await T(a, 'bugun');
    g = await T(a, 'gorunum');
    assert.deepEqual([g.seviye, g.kutu], [rozet(3, duzen4), '3. kutu · tekrar zamanı'],
      'Ekrandaki dokunulmamış kelime, kaydı başka sekmede değişince yeni seviyesiyle yeniden çizilir');
    assert.deepEqual(g.hucreler.map((h, i) => (h.s.includes('sabit') ? i : -1)).filter(i => i >= 0), duzen4.acik, 'Açık harfler 3. kutunun harfleri');
    assert.deepEqual([g.odak, g.deger, g.durum], ['oyunGirdi', '', ''], 'Yeniden çizim odağı ve girdiyi değiştirmez, ileti yazmaz');
    await a.keyboard.type(tam(w4));
    await a.keyboard.press('Enter');
    // Sonuç önce çizilir, yazım bir kare sonra yapılır; geri çevrilseydi durum satırı o zaman değişirdi.
    await durumOku(a);
    await yazimDurulsun(a);
    assert.equal((await T(a, 'gorunum')).durum, 'Bildiniz! Kelime 4. kutuya çıktı; ' + (duzen4.sonrakiAcik
      ? 'bir dahaki sefere harflerin %10\'u açık gelecek.' : 'bu kadar kısa kelimede bir dahaki sefere harf açılmayacak.'),
    'Yeniden çizilen kelimenin cevabı kabul edilir ("başka sekmede yanıtlanmış" sayılmaz)');
    assert.deepEqual(await T(a, 'kayit', w4), {k: 4, g: bugun + 15, c: bugun}, 'Cevap yazıldı: 4. kutu, 15 gün sonra');
    assert.equal((await T(a, 'gorunum')).sayim, 'Bu oturum: ✓ 1 bildin · 💡 0 ipuçlu · ✗ 0 bilemedin');
  });

  /* ---------- 10) Anlam maskesi ---------- */
  senaryo('Anlam maskesi: anlamda geçen başlık ve dil bilgisi notunun öznesi (düzensiz fiilin kökü de) cevaptan önce •••, sonra tam metin; yanlış deneme, yarım bırakıp dönme ve harf açmadan sonra da maskeli', async () => {
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
    // Maske ve sızıntı denetimi yalnız dokunulmamış kartta değil, turun sonraki hâllerinde de yapılır (yanlış
    // deneme, kelimeden ayrılıp dönme, "Bir harf aç"). Bu hâller tek kelimede sınanır: "Bir harf aç" en az iki
    // gizli harf ister; öteki üç kelime eskisi gibi ilk denemede çözülür.
    const bugun = await T(page, 'bugun');
    let yarim = null;
    for (const w of sira) if (!yarim && (await T(page, 'duzen', w, 1)).bos >= 2) yarim = w;
    assert.ok(yarim, 'Düzenek: dört kelimeden hiçbirinin 1. kutuda iki gizli harfi yok (' + sira.join(', ') + ')');
    const [yeniIlk] = await T(page, 'sira', 'yeni', 1);
    assert.ok(yeniIlk, 'Düzenek: "Yalnız yeni kelimeler" turunda kelime var');
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
      // Cevaptan önce duyuru bölgesine en son yazılan metin (yarım kelimede: moda dönüşün duyurusu).
      let sonDuyuru = soru;
      if (w === yarim) {
        const hala = async hal => {
          const ara = await T(page, 'anlam', w, true, false);
          assert.equal(ara.gorulen, ara.beklenen, hal + ': anlam hâlâ maskeli');
          assert.deepEqual(await T(page, 'sizinti', w), [], hal + ': kartta cevap yok');
          // Girdinin açıklaması gizli kutuları hâlâ "boş" diye okur. (Dönüşün duyurusu bu açıklamayla biter;
          // aşağıdaki duyuru eşitliği onu ekrandaki açıklamadan kurar, o yüzden açıklama burada ayrıca doğrulanır.)
          const gh = await T(page, 'gorunum');
          assert.equal(gh.tarif, beklenenAciklama(gh), hal + ': açıklama gizli kutuların harfini söylemez ("boş" der)');
        };
        // 1) Yanlış deneme: kelimenin tamamı yazılır, gizli harflerin hiçbiri tutmaz (açık harfler doğru yazılır).
        await page.locator('#oyunGirdi').focus();
        await page.keyboard.type(bozuk(w, await T(page, 'gizliSira')));
        await page.keyboard.press('Enter');
        await durumBekle(page, 'Olmadı; baştan yaz. 2 hakkın kaldı.');
        await hala('Yanlış denemeden sonra');
        // 2) Kelime yarım bırakılır (öbür modda başka kelime gelir), sonra geri dönülür.
        await page.locator('.oyun-mod [data-mod="yeni"]').click();
        await page.locator('.oyun-mod [data-mod="yeni"][aria-pressed="true"]').waitFor();
        await kelimeBekle(page, yeniIlk);
        await page.locator('.oyun-mod [data-mod="sira"]').click();
        await kelimeBekle(page, w, false);
        await durumBekle(page, 'Kaldığın yerden devam: 2 deneme hakkın kaldı.');
        await hala('Yarım kelimeye dönünce');
        sonDuyuru = await duyuruOku(page);
        assert.deepEqual(await T(page, 'duyuruSizinti', w), [], 'Yarım kelimeye dönüşün duyurusunda cevap yok');
        assert.equal(sonDuyuru, await T(page, 'soru', w, true), 'Yarım kelimeye dönüş sıra satırı ve maskeli soruyla duyurulur');
        // 3) "Bir harf aç": girdi boşken ilk gizli harf açılır.
        const ilkBos = (await T(page, 'gorunum')).hucreler.findIndex(h => h.s.startsWith('bos'));
        await page.locator('#oyunHarf').click();
        await durumBekle(page, harfSirasi(w, ilkBos) + '. harf açıldı: ' + w[ilkBos] + '. Doğru bilirsen kelime aynı kutuda kalır.');
        await hala('"Bir harf aç"tan sonra');
      }
      await coz(page, w);
      if (w === yarim) {
        // Yanlış deneme ve ipucundan sonra bilinen kelime 2. kutuya çıkmaz: 1. kutuda kalır, yarın yeniden sorulur.
        await durumBekle(page, 'Doğru, ama ipucuyla; kelime 1. kutuda kalıyor.');
        await page.waitForFunction(([w, gun]) => window.__oyun.kayit(w).c === gun, [w, bugun]);
        assert.deepEqual(await T(page, 'kayit', w), {k: 1, g: bugun + 1, c: bugun}, 'Il.ipucuyla kaydı: aynı kutu, yarın');
      } else await kutuBekle(page, w, 2);
      anlam = await T(page, 'anlam', w, false, false);
      assert.equal(anlam.gorulen, anlam.beklenen, 'Cevaptan sonra tam metin');
      assert.equal(anlam.metin.includes('•••'), false);
      // Tam metinde maskelenen yer açık: başlığın kendisi ya da (çekimli başlıkta) notun kökü.
      if (notlu) assert.ok(anlam.metin.includes(notlu.not) && anlam.metin.includes(notlu.kok + ' fiilinin'), 'Tam metinde not öznesiyle okunur: ' + anlam.metin);
      else assert.ok(anlam.metin.toLowerCase().includes(w.toLowerCase()), 'Tam metinde başlık geçer');
      // Duyuru gecikmeli yazıldığı için önce sayfanın saati ilerletilir; sonra bölgede cevap aranır ve bölgenin
      // cevaptan önceki soruyla durduğu görülür.
      await duyuruDurulsun(page);
      assert.deepEqual(await T(page, 'duyuruSizinti', w), [], 'Cevaptan sonra da duyuruya cevap yazılmaz');
      assert.equal((await T(page, 'gorunum')).duyuru, sonDuyuru, 'Cevaptan sonra duyuru bölgesi sorudaki hâliyle durur (sonuç oraya da yazılmaz)');
      await page.keyboard.press('Enter');
    }
    return 'başlık ' + f.baslik + ', notlar ' + f.notlar.map(n => n.tur + ' ' + n.w + ' (' + n.kok + ' fiilinin …)').join(', ') + '; yarım hâller ' + yarim;
  });

  /* ---------- 11) Yalnız klavye ve durum durum erişilebilirlik ---------- */
  senaryo('Klavye: Tab sırası üç düğmeye ulaşır, Enter gönderir; axe ve harf karşıtlığı: yazarken (yazılmış kutular, açık harfin üzerine farklı harf), yanlış, açılmış, doğru, boş sıra', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    await enAzBosluk(page, 2);
    let [w] = await T(page, 'sira');
    const odak = () => page.evaluate(() => document.activeElement && document.activeElement.id);
    // Sayfanın başından Tab ile girdiye ulaşılır.
    let adim = 0;
    while (await odak() !== 'oyunGirdi' && adim++ < 60) await page.keyboard.press('Tab');
    assert.equal(await odak(), 'oyunGirdi', 'Girdi Tab sırasında');
    // Girdiden sonra düğmeler sırayla gelir (kapalı düğme atlanır: tek gizli harfli kelimede "Bir harf aç").
    const dugmeSirasi = async () => {
      const beklenen = (await T(page, 'gorunum')).harfKapali ? ['oyunPas', 'oyunGonder'] : ['oyunHarf', 'oyunPas', 'oyunGonder'];
      const duraklar = [];
      for (let i = 0; i < beklenen.length; i++) { await page.keyboard.press('Tab'); duraklar.push(await odak()); }
      assert.deepEqual(duraklar, beklenen, 'Girdiden sonra düğmeler sırayla');
      return beklenen.length;
    };
    const e = await T(page, 'eksik', w);
    assert.ok(e.length >= 2, 'Düzenek: ilk kelimede en az iki gizli harf');
    assert.equal(await dugmeSirasi(), 3, 'Üç düğme de Tab sırasında');
    for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+Tab');
    assert.equal(await odak(), 'oyunGirdi');
    const cerceve = await page.evaluate(() => getComputedStyle(document.querySelector('.harf-alan')).outlineStyle);
    assert.notEqual(cerceve, 'none', 'Odak halkası sarmalayıcıda görünür');
    // Yazarken (son harf dışında kelime yazılı, odak girdide), sonra yanlış deneme. Gizli harflerin hepsi ve ilk açık
    // harf yanlış yazılır: yazılmış kutunun ve "farklı" kutunun renkleri de ölçülür (harf kutuları aria-hidden olduğu
    // için axe onlara bakmaz; karşıtlığı axeVeYerlesim kendisi ölçer).
    const gizli = await T(page, 'gizliSira'), harfler = [...w].filter(c => c !== '-' && c !== ' ');
    const ilkAcik = harfler.findIndex((c, i) => !gizli.includes(i)), son = harfler.length - 1;
    assert.ok(ilkAcik >= 0 && ilkAcik < son, 'Düzenek: ilk kelimenin son harfinden önce açık harfi var');
    const yanlisi = bozuk(w, [...gizli, ilkAcik]);
    await page.keyboard.type(yanlisi.slice(0, -1));
    assert.deepEqual((await T(page, 'gorunum')).hucreler.filter(h => h.s !== 'ayrac'), harfler.map((c, i) => {
      if (i === son) return gizli.includes(i) ? {c: '', s: 'bos simdi'} : {c, s: 'sabit simdi'};
      if (gizli.includes(i)) return {c: yanlisi[i], s: 'bos yazildi'};
      return i === ilkAcik ? {c: yanlisi[i], s: 'sabit yazildi farkli'} : {c, s: 'sabit yazildi'};
    }), 'Yazarken: yazılan kutular yazılmış; yalnız üzerine başka harf yazılan açık kutu "farklı" (yanlış yazılan gizli kutu değil); son kutu sırada');
    // "Farklı" kutu yalnız renkle ayrılmaz: köşesinde çarpı (::after) vardır; başka hiçbir kutuda yoktur.
    const carpilar = await page.evaluate(() => [...document.querySelectorAll('#oyunHarfler .harf:not(.ayrac)')].map(el => {
      const s = getComputedStyle(el, '::after');
      return s.content === 'none' || s.content === 'normal' ? '' : s.content + ' ' + s.position;
    }));
    assert.deepEqual(carpilar, harfler.map((c, i) => (i === ilkAcik ? '"×" absolute' : '')), '"Farklı" kutunun renk dışı işareti: köşede çarpı (yalnız o kutuda)');
    // "Farklı" kutu hata tonlarındadır (zemin, harf, çerçeve); renkler tema değişkenlerinden okunur.
    const farkliRenk = await page.evaluate(() => {
      const olc = el => { const s = getComputedStyle(el); return [s.backgroundColor, s.color, s.borderTopColor, s.borderBottomColor].join(' | '); };
      const ornek = document.createElement('span');
      ornek.style.cssText = 'border:1px solid;background:var(--err-soft);color:var(--err);border-color:var(--err)';
      document.body.appendChild(ornek);
      const r = {beklenen: olc(ornek), gorulen: [...document.querySelectorAll('#oyunHarfler .harf.farkli')].map(olc)};
      ornek.remove();
      return r;
    });
    assert.deepEqual(farkliRenk.gorulen, [farkliRenk.beklenen], '"Farklı" kutu hata tonlarında: zemin --err-soft, harf ve çerçeve --err');
    await dortluDenetim(page, 'Yazarken');
    await page.locator('#oyunGirdi').focus();
    await page.keyboard.type(yanlisi.slice(-1));
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Olmadı; baştan yaz. 2 hakkın kaldı.');
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
    await page.keyboard.type(tam(w));
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
  senaryo('Öteki yazım (-ise/-ize, -re/-er) kısa anlamı farklı yazılmış olsa da kabul edilir; aynı anlamlı başka kelime (tek harf farklı olsa da) deneme harcamaz; farklı harfi açık gelen kartta ikisi de açık harfin üzerine yazılır', async () => {
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
        assert.equal(g.hucreler.filter(h => h.s.startsWith('bos')).length, w.length, 'Hiçbir harf açılmadı');
        assert.equal(g.hucreler.map(h => h.c).join(''), c.aday, 'Kutular da yazılanı göstermeyi sürdürür');
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
    // Farklı harfi AÇIK gelen kart: kelimenin tamamı yazıldığı için öteki yazım da, aynı anlamlı kelime de orada
    // yazılabilir; harf açık harfin üzerine yazılır, kutu yazılanı gösterir ve işaretlenir (farkli). İki kart 1. kutuya
    // (%40) alınır; açık harfler kelimeye, kutuya ve güne bağlı olduğundan farklı harfin ikisinde de açık geldiği ilk
    // gün seçilir.
    const acikta = await page.evaluate(ciftler => {
      const O = window.YDS.OyunHesap, bugun = window.YDS.Ilerleme.bugun();
      const fark = ciftler.map(c => [...c.kart].findIndex((h, i) => h !== c.aday[i]));
      for (let n = 1; n <= 400; n++) if (ciftler.every((c, i) => O.acikKonumlar(c.kart, 1, bugun + n).includes(fark[i]))) return {n, fark};
      return null;
    }, [f.sz, f.tek]);
    assert.ok(acikta, 'Düzenek: ' + f.sz.kart + ' ve ' + f.tek.kart + ' kartlarında farklı harfin 1. kutuda birlikte açık geldiği bir gün bulunamadı');
    await page.clock.setFixedTime(GUN(1 + acikta.n));
    for (const c of [f.sz, f.tek]) assert.equal(await T(page, 'kayitKoy', c.kart, 1), true, 'Düzenek: ' + c.kart + ' 1. kutuya yazıldı, vadesi bugün');
    await page.reload(); await hazir(page);
    const aciklar = await T(page, 'sira', 'sira', 2);
    assert.deepEqual([...aciklar].sort(), [f.sz.kart, f.tek.kart].sort(), 'Düzenek: vadesi gelen iki kart sıranın başında');
    const BILDINIZ_2 = 'Bildiniz! Kelime 2. kutuya çıktı; bir dahaki sefere harflerin %30\'u açık gelecek.';
    for (const w of aciklar) {
      await kelimeBekle(page, w);
      const c = cifti(w), i = acikta.fark[c === f.sz ? 0 : 1], uzerine = {c: c.aday[i], s: 'sabit yazildi farkli'};
      let g = await T(page, 'gorunum');
      assert.ok(g.hucreler[i].c === w[i] && g.hucreler[i].s.startsWith('sabit'), 'Düzenek: ' + w + ' kartında farklı harf (' + w[i] + ') açık geldi: ' + JSON.stringify(g.hucreler[i]));
      await page.locator('#oyunGirdi').focus();
      await page.keyboard.type(c.aday);
      g = await T(page, 'gorunum');
      assert.equal(g.deger, c.aday, 'Açık harf de yazılır: girdi kelimenin bütün harflerini alır');
      assert.deepEqual(g.hucreler[i], uzerine, 'Açık harfin üzerine yazılan başka harf kutuda görünür ve işaretlenir');
      assert.equal(g.hucreler.filter(h => h.s.includes('farkli')).length, 1, 'Yalnız o kutu işaretlenir: ' + JSON.stringify(g.hucreler));
      await page.keyboard.press('Enter');
      if (c.bag === 'es') {
        assert.equal(await durumOku(page), c.aday + ' kelimesi de bu anlama gelir ama aranan kelime o değil; başka bir kelime dene.',
          'Açık harfin üzerine yazılan aynı anlamlı kelime de tanınır');
        g = await T(page, 'gorunum');
        assert.equal(g.deger, c.aday, 'Yazılan yerinde kalır');
        assert.deepEqual(g.hucreler[i], uzerine, 'Kutu da yazılanı göstermeyi sürdürür');
        assert.equal(g.gecersiz, null); assert.doesNotMatch(g.harfSinifi, /yanlis/);
        assert.equal(g.hucreler.filter(h => h.s.startsWith('bulundu')).length, 0, 'Hiçbir gizli harf açılmadı');
        for (let k = 0; k < w.length; k++) await page.keyboard.press('Backspace');
        await page.keyboard.type(w);
        await page.keyboard.press('Enter');
        // Deneme harcanmadı: sonuç hâlâ "ilk denemede doğru".
        assert.equal(await durumOku(page), BILDINIZ_2, 'Aynı anlamlı kelime açık harfli kartta da deneme harcamaz');
      } else {
        assert.equal(await durumOku(page), c.aday + ' yazımı da doğru; bu karttaki yazım ' + w + '. ' + BILDINIZ_2,
          'Farklı harfi açık gelen kartta öteki yazım kabul edilir');
        assert.equal((await T(page, 'gorunum')).hucreler.map(h => h.c).join(''), w, 'Kutular kartın kendi yazımını gösterir');
      }
      await kutuBekle(page, w, 2);
      await page.keyboard.press('Enter');
    }
    assert.equal((await T(page, 'gorunum')).sayim, 'Bu oturum: ✓ 2 bildin · 💡 0 ipuçlu · ✗ 0 bilemedin', 'Açık harfli iki kart da ilk denemede doğru sayıldı');
    return 'yazım ' + f.sz.kart + '/' + f.sz.aday + ', ' + f.re.kart + '/' + f.re.aday + '; eş anlam ' + f.tek.kart + '/' + f.tek.aday + ', ' + f.cok.kart + '/' + f.cok.aday +
      '; farklı harfi açık: ' + f.sz.kart + ', ' + f.tek.kart + ' (' + acikta.n + ' gün sonra)';
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
      await page.keyboard.type(tam(w));
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
    await page.keyboard.type(tam(w2));
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
  senaryo('Yerleşim: kart katman seçiciden önce; 1366×768\'de harf kutuları, telefonda (375×667, dokunmatik, tekrarı bekleyen profil) anlam ve harf kutuları kaydırmadan ilk ekranda; 375 ve 360 px\'te tur düğmeleri tek satırda, ara başlık ve giriş eki yer tutmaz, bağlantı sıra bilgisinin ardından akar (dar pencerede ince işaretçiyle de); dokunmatik ekranda her düğme (Dinle ve "Yeniden dene" de) en az 44 px; bağlantı katman seçiciye götürür', async () => {
    const notlar = [], kartDolgusu = {};
    let genis;
    const olc = (page, kimlikler) => page.evaluate(kimlikler => {
      const kutu = id => { const r = document.getElementById(id).getBoundingClientRect(); return {ust: Math.round(r.top), alt: Math.round(r.bottom), sol: Math.round(r.left), sag: Math.round(r.right)}; };
      return {hedef: kimlikler.map(kutu), kart: kutu('oyunKart'), katman: kutu('katmanKart'), ekran: [innerWidth, innerHeight],
        kaydirma: [scrollX, scrollY], odakGovdede: document.activeElement === document.body};
    }, kimlikler);
    const ilkEkranda = (y, i) => { const h = y.hedef[i]; return h.alt > h.ust && h.ust >= 0 && h.alt <= y.ekran[1] && h.sol >= 0 && h.sag <= y.ekran[0]; };
    for (const [en, boy, hedefler] of [[1366, 768, [['oyunHarfler', 'harf kutuları']]], [375, 667, [['oyunAnlam', 'anlam'], ['oyunHarfler', 'harf kutuları']]]]) {
      const telefon = en <= 480, etiket = en + '×' + boy + ': ';
      // Telefon gerçek telefon gibi açılır: kaba işaretçide her düğme en az 44 px'tir, yerleşim ince işaretçidekinden uzundur.
      const page = telefon ? await yeniSayfa({width: en, height: boy}, {hasTouch: true, isMobile: true}) : await yeniSayfa({width: en, height: boy});
      // Saat sabit: ekilen profil "bugün"e göre yazılır; ekimle yeniden yükleme arasına gece yarısı girerse yarını
      // bekleyen kelimelerin de vadesi gelmiş olur.
      await page.clock.setFixedTime(GUN(0));
      await ac(page, base);
      let [w] = await T(page, 'sira');
      if (telefon) {
        assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true, 'Düzenek: telefon benzetiminde işaretçi kaba');
        // Boş profilde ilk açılış: sayfa kaydırılmaz, odak alınmaz, anlam ilk ekrandadır.
        await kelimeBekle(page, w);
        await durgun(page);
        const bos = await olc(page, ['oyunAnlam']);
        assert.deepEqual(bos.ekran, [en, boy], etiket + 'boş profilde görünen alan istenen boyutta (telefonda yatay taşan içerik sayfayı küçültür, görünen alan büyür)');
        assert.deepEqual(bos.kaydirma, [0, 0], etiket + 'boş profilde açılışta sayfa kaydırılmaz');
        assert.equal(bos.odakGovdede, true, etiket + 'boş profilde açılışta odak alınmaz');
        assert.ok(ilkEkranda(bos, 0), etiket + 'boş profilde anlam ilk ekranda, kaydırmadan: ' + JSON.stringify(bos));
        // İlk günden sonraki olağan profil: vadesi gelmiş iki, tekrar gününü bekleyen üç kelime. Sıra satırı en uzun
        // hâlini alır, ilk kelime "K. kutu · tekrar zamanı" rozetiyle gelir. Ekrana gelecek kelime ölçüyü yazı tipinden
        // bağımsız kılacak biçimde seçilir: tek satır kutu (5-10 harf, ayraçsız), her biri tek satıra sığan iki anlam.
        // Dizinin ilk sekiz kelimesi atlanır: vadesi gelen kelime, dizinde önünde duran yeni kelimelerden önce sorulur.
        const tohum = await page.evaluate(() => {
          const Y = window.YDS, Il = Y.Ilerleme, bugun = Il.bugun(), havuz = window.__oyun.havuz([2]), kayit = {};
          const vadeli = havuz.slice(8).find(d => {
            const tam = Y.Veri.kayit(d.e);
            return /^[a-z]{5,10}$/.test(d.e) && d.y.length <= 24 && !!tam && tam.a.length === 2 && tam.a.every(a => a.tr.length <= 20);
          });
          const [vadeli2, ...bekleyen] = havuz.slice(8).filter(d => d !== vadeli).slice(0, 4);
          if (!vadeli || bekleyen.length !== 3) return null;
          kayit[Il.ilerlemeKimligi(vadeli.e, 'kelime')] = {k: 2, g: bugun - 2, c: bugun - 5, m: 0};
          kayit[Il.ilerlemeKimligi(vadeli2.e, 'kelime')] = {k: 1, g: bugun, c: bugun - 1, m: 0};
          bekleyen.forEach(d => { kayit[Il.ilerlemeKimligi(d.e, 'kelime')] = {k: 1, g: bugun + 1, c: bugun, m: 0}; });
          return {w: vadeli.e, oynanan: havuz.length, yazildi: Y.Depo.kayitlariYaz('yds-leitner', kayit)};
        });
        assert.ok(tohum, 'Düzenek: Çekirdek katmanında 5-10 harfli, iki kısa anlamlı (en çok 20 karakter) kelime ya da yanına ekilecek dört kelime kalmadı');
        assert.equal(tohum.yazildi, true, 'Düzenek: profil yazıldı');
        await page.reload(); await hazir(page);
        w = tohum.w;
        const g = await T(page, 'gorunum');
        assert.equal(g.siraMetni, 'Sırada ' + (tohum.oynanan - 3) + ' kelime: 2 tekrar + ' + (tohum.oynanan - 5) + ' yeni. 3 kelime tekrar gününü bekliyor.', 'Düzenek: sıra satırı en uzun hâlinde');
        assert.equal(g.kutu, '2. kutu · tekrar zamanı', 'Düzenek: ilk kelime vadesi gelmiş kelime');
      }
      await kelimeBekle(page, w);
      await durgun(page);
      const y = await olc(page, hedefler.map(h => h[0]));
      assert.deepEqual(y.ekran, [en, boy], etiket + 'görünen alan istenen boyutta (telefonda yatay taşan içerik sayfayı küçültür, görünen alan büyür)');
      assert.deepEqual(y.kaydirma, [0, 0], etiket + 'açılışta sayfa kaydırılmaz');
      assert.equal(y.odakGovdede, true, etiket + 'açılışta odak alınmaz');
      if (telefon) {
        // Yazı tipinden bağımsız kurallar, iki telefon genişliğinde. (360×640'ta harf satırı pikselle sınanmaz:
        // geniş yazı tipinde oraya sığmaz.) Kaba işaretçide oyunun her düğmesi en az 44 px yüksektir: burada cevaptan
        // önce görünenler (tur, kart, katman), senaryonun sonunda Dinle ve "Yeniden dene" ölçülür.
        const ayirt = [];
        for (const [e2, b2] of [[en, boy], [360, 640]]) {
          await boyutla(page, e2, b2);
          const o = await telefonYapisi(page, e2 + ' px: ');
          assert.ok(o.dugmeBoylari.length >= 6, 'Düzenek: ' + e2 + ' px: tur, kart ve katman düğmeleri ölçüldü: ' + JSON.stringify(o.dugmeBoylari));
          assert.deepEqual(o.dugmeBoylari.filter(d => d[1] < 44), [], e2 + ' px: dokunmatik ekranda cevaptan önce görünen her düğme (tur, kart, katman) en az 44 px yüksek: ' + JSON.stringify(o.dugmeBoylari));
          if (o.baglanti.satir > 1 && o.baglanti.sigar) ayirt.push(e2);
          if (e2 === en) { kartDolgusu[en] = o.kartDolgusu; kartDolgusu.siradan375 = o.siradanKartDolgusu; }
        }
        // Bağlantı kuralı ancak sıra bilgisi satıra bölünüp son satırında bağlantıya yer kaldığında bir şey söyler; bunun
        // hangi genişlikte olduğu yazı tipine bağlıdır (geniş yazı tipinde 375 ve 360'ta bağlantı haklı olarak alt satıra
        // iner). O iki genişlikte olmadıysa 480 px'e kadarki öteki telefon genişlikleri denenir.
        for (const e2 of [390, 412, 430, 344, 320, 400, 420, 440, 460, 480]) {
          if (ayirt.length) break;
          await boyutla(page, e2, boy);
          const o = await T(page, 'yerlesimOlcusu');
          bagKurali(o, e2 + ' px: ');
          if (o.baglanti.satir > 1 && o.baglanti.sigar) ayirt.push(e2);
        }
        assert.ok(ayirt.length, 'Düzenek: 320-480 px arasında sıra bilgisinin bölünüp son satırında bağlantıya yer kaldığı bir genişlik bulunamadı');
        await boyutla(page, en, boy);
        notlar.push('telefonda harf satırının altı ' + y.hedef[1].alt + '/' + boy + ' px (' + w + '); bağlantı kuralı ' + ayirt.join(' ve ') + ' px\'te ayırt edici');
      } else {
        // Geniş ekranda ara başlık görünür ve yer tutar, giriş cümlesi eksiksizdir.
        const o = await T(page, 'yerlesimOlcusu');
        assert.ok(o.baslik.boy >= o.baslik.yazi && o.baslik.en > o.baslik.yazi && o.baslik.modaKadar >= o.baslik.boy, etiket + 'ara başlık görünür ve yer tutar: ' + JSON.stringify(o.baslik));
        assert.equal(await page.getByRole('heading', {name: o.baslik.metin, exact: true}).count(), 1, etiket + 'ara başlık başlık olarak yerinde');
        assert.ok(o.giris.ekCizildi && o.giris.ek && o.giris.gorunen === o.giris.tam, etiket + 'giriş cümlesi eksiksiz görünür: ' + JSON.stringify(o.giris));
        kartDolgusu[en] = o.kartDolgusu;
      }
      // İlk ekran: açılışta alınan ölçüyle (kaydırma 0). Telefonda harf satırının altı yazı tipine bağlıdır; seçilen
      // kelime biçimiyle ölçülen: sayfanın yazı tipi 567, Tahoma 583, Verdana 606, Courier New 632 px (667'ye en az
      // 35 px pay). Düzeltmeden önceki CSS ile aynı ölçü 704 px idi.
      hedefler.forEach(([, ad], i) => assert.ok(ilkEkranda(y, i), etiket + ad + ' ilk ekranda, kaydırmadan: ' + JSON.stringify(y)));
      assert.ok(y.katman.ust >= y.kart.alt, etiket + 'katman seçici kartın altında: ' + JSON.stringify(y));
      // Sıra satırındaki bağlantı katman seçiciyi ekrana getirir.
      const baglanti = page.locator('.oyun-bilgi a[href="#katmanKart"]');
      if (telefon) await baglanti.tap(); else await baglanti.click();
      await page.waitForFunction(() => {
        const r = document.querySelector('#katmanKart .katman').getBoundingClientRect();
        return location.hash === '#katmanKart' && r.top >= 0 && r.bottom <= innerHeight;
      });
      if (telefon) {
        // 44 px kuralı baştan görünmeyen düğmeleri de kapsar. Dinle cevaptan sonra çıkar: kelime çözülür
        // (vadesi gelmiş 2. kutu kelimesi 3. kutuya çıkar), düğmeler yeniden ölçülür.
        await coz(page, w);
        await kutuBekle(page, w, 3);
        const sonra = (await T(page, 'yerlesimOlcusu')).dugmeBoylari;
        if (await page.evaluate(() => 'speechSynthesis' in window)) assert.ok(sonra.some(d => d[0] === 'oyunDinle'), 'Düzenek: cevaptan sonra Dinle düğmesi ölçüldü: ' + JSON.stringify(sonra));
        else notlar.push('ses desteği yok, Dinle ölçülmedi');
        assert.deepEqual(sonra.filter(d => d[1] < 44), [], en + ' px: dokunmatik ekranda cevaptan sonra görünen düğmeler (Dinle) de en az 44 px yüksek: ' + JSON.stringify(sonra));
        // "Yeniden dene" yalnız katman dosyası inmeyince çıkar: dosya engellenir, sayfa yeniden açılır.
        await page.route(KATMAN_DOSYASI, route => route.abort());
        await page.reload(); await hazir(page);
        await page.locator('#oyunYukDene').waitFor({state: 'visible'});
        const inmeyince = (await T(page, 'yerlesimOlcusu')).dugmeBoylari;
        assert.ok(inmeyince.some(d => d[0] === 'oyunYukDene'), 'Düzenek: katman inmeyince "Yeniden dene" düğmesi ölçüldü: ' + JSON.stringify(inmeyince));
        assert.deepEqual(inmeyince.filter(d => d[1] < 44), [], en + ' px: dokunmatik ekranda katman inmeyince çıkan "Yeniden dene" de en az 44 px yüksek: ' + JSON.stringify(inmeyince));
      } else genis = page;
    }
    // Telefon kuralları işaretçi türüne değil genişliğe bağlıdır: daraltılmış masaüstü penceresinde (ince işaretçi)
    // de geçerlidir. Geniş ekran ayağının sayfası daraltılır; dokunmatik telefon ayağından sonra bakılır ki bozulan
    // kuralı önce o söylesin.
    assert.equal(await genis.evaluate(() => matchMedia('(pointer: coarse)').matches), false, 'Düzenek: geniş ekran ayağında işaretçi ince');
    await boyutla(genis, 375, 667);
    await telefonYapisi(genis, '375 px, ince işaretçi: ');
    // "Kart sıkışır", piksel değeri sabitlenmeden iki bağıntıyla: telefonda kelime kartının üst dolgusu geniş
    // ekrandakinden küçüktür (kural silinirse fark edilir; düzeltmeden önceki dolgu da geniş ekrandakinden küçüktü,
    // onu ikinci bağıntı ayırır) ve aynı sayfadaki sıradan bir kartınkini (katman seçici) aşmaz: geniş ekranda kelime
    // kartı sıradan karttan ferahtır, telefonda bu fazlalıktan vazgeçer.
    assert.ok(kartDolgusu[375] < kartDolgusu[1366], 'Kart telefonda geniş ekrandakinden sıkı (üst dolgu, px): ' + JSON.stringify(kartDolgusu));
    assert.ok(kartDolgusu[375] <= kartDolgusu.siradan375, 'Kelime kartının üst dolgusu telefonda sıradan bir kartınkini (katman seçici) aşmaz (px): ' + JSON.stringify(kartDolgusu));
    return notlar.join('; ');
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
  senaryo('Kısa kelime 4. kutuda harfsiz gelir (rozet ve yükselme iletisi söyler); girdinin açıklaması ve eksik yazım iletisi açık harf varken onu da yazdırır, harfsiz kelimede açık harften söz etmez; öğrenilen kelime ipuçlu bilinirse "Bilinenler"de kalır', async () => {
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
    // Bir harf açıkken de dört harfin dördü yazılır: girdi dört harf alır, açıklama açık harfi de yazdırır.
    assert.equal(g.azami, String(f.kisa.length), 'maxlength başlığın uzunluğudur (gizli harf sayısı değil): açık harf de yazılır');
    assert.equal(g.tarif, '4 harfli İngilizce kelime: ' + g.hucreler.map(h => (h.s.startsWith('bos') ? 'boş' : h.c)).join(', ') +
      '. Açık harfler dahil kelimenin tamamını baştan sona yaz, Enter ile kontrol et.', 'Açık harf varken açıklama onu da yazdırır');
    // Yalnız gizli üç harfi yazmak kelimeyi bitirmez: deneme harcanmaz, yazılan kalır, ileti açık harfi hatırlatır.
    const gizliler = await T(page, 'eksik', f.kisa);
    await page.locator('#oyunGirdi').focus();
    await page.keyboard.type(gizliler);
    await page.keyboard.press('Enter');
    assert.equal(await durumOku(page), 'Önce kelimenin tamamını yaz; açık harfleri de yaz.');
    g = await T(page, 'gorunum');
    assert.deepEqual([g.deger, g.gecersiz, g.gonder], [gizliler, null, 'Kontrol et'], 'Eksik yazılan kelime yanlış sayılmaz, yazılan yerinde kalır');
    for (let i = 0; i < gizliler.length; i++) await page.keyboard.press('Backspace');
    // Deneme harcanmadı: sonuç "ilk denemede doğru".
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
    assert.equal(g.tarif, '4 harfli İngilizce kelime: boş, boş, boş, boş. Kelimenin tamamını yaz, Enter ile kontrol et.', 'Açık harf yokken açıklama "açık harfler dahil" demez');
    assert.deepEqual(await T(page, 'sizinti', f.kisa), [], 'Kartta cevap yok');
    await dortluDenetim(page, 'Kısa kelime rozeti');
    // Harfsiz kelimede eksik yazım iletisi de açık harften söz etmez; deneme harcanmaz, kalan harf yazılıp bitirilir.
    await page.locator('#oyunGirdi').focus();
    await page.keyboard.type(f.kisa.slice(0, 3));
    await page.keyboard.press('Enter');
    assert.equal(await durumOku(page), 'Önce kelimenin tamamını yaz.');
    g = await T(page, 'gorunum');
    assert.deepEqual([g.deger, g.hucreler.map(h => h.s)], [f.kisa.slice(0, 3), ['bos yazildi', 'bos yazildi', 'bos yazildi', 'bos simdi']], 'Yazılan üç harf yerinde, sıra dördüncü kutuda');
    await page.keyboard.type(f.kisa.slice(3));
    await page.keyboard.press('Enter');
    await durumBekle(page, 'Bildiniz! Kelime öğrenildi (5. kutu). Bundan sonra “Öğrenilenler · harfsiz” turunda sorulur.');
    await kutuBekle(page, f.kisa, 5);
    // Öğrenilenler turu: bugün öğrenilen kelime sorulmaz; ötekiler dünden kalmadır.
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    const sira = await T(page, 'sira', 'ogrenilen');
    assert.deepEqual(sira, [f.Z1, f.Z2], 'Düzenek: iki öğrenilmiş kelime sırada');
    // İpucuyla bilinen öğrenilmiş kelime kutusunda kalır ve yarın tekrara gelmez: "Bilinenler"de, 💡 işaretiyle.
    await kelimeBekle(page, f.Z1);
    const hepsiBos = [...f.Z1].map(() => 'boş');
    assert.equal((await T(page, 'gorunum')).tarif, f.Z1.length + ' harfli İngilizce kelime: ' + hepsiBos.join(', ') + '. Kelimenin tamamını yaz, Enter ile kontrol et.');
    await page.locator('#oyunHarf').click();
    await durumBekle(page, '1. harf açıldı: ' + f.Z1[0] + '. Doğru bilirsen kelime aynı kutuda kalır.');
    // Açılan harf de yazılır: harfsiz kelimenin açıklaması artık açık harfi sayar, sıra açılan kutudadır.
    g = await T(page, 'gorunum');
    assert.equal(g.tarif, f.Z1.length + ' harfli İngilizce kelime: ' + [f.Z1[0], ...hepsiBos.slice(1)].join(', ') +
      '. Açık harfler dahil kelimenin tamamını baştan sona yaz, Enter ile kontrol et.', 'Harf açılınca açıklama açık harfi de yazdırır');
    assert.deepEqual(g.hucreler[0], {c: f.Z1[0], s: 'ipucu simdi'}, 'Açılan ilk harf yazılmayı bekler');
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
    await durumBekle(page, 'Olmadı; baştan yaz. 2 hakkın kaldı.');
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
  senaryo('Dışarıdan değişiklik: kart odağın altından gizlenirse odak boş duruma, boş durum odaktayken kelime gelirse girdiye taşınır; odak başka yerdeyse dokunulmaz, değişiklik duyurulur; odak taşınırken sayfa kaymaz', async () => {
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
    // Odak kullanıcı işlemi olmadan taşınırken sayfa kaymamalı. Ölçüm için ekran, kart ilk ekranın altında kalacak
    // kadar kısaltılır ve sayfa baştan 30 px aşağıya alınır (odak girdide kalır): hedef ekranın 30 px altında başlar.
    // Kaydırarak odaklayan bir focus() sayfayı aşağı çeker, sayfayı başa alan bir kaydırma da 30'u 0 yapar. Yerleşim
    // değişikliği (kart ↔ boş durum) ekranın altında olur, konumu kendiliğinden oynatmaz. Yumuşak kaydırma kapatılır:
    // ölçüm kaydırma canlandırmasının ortasına denk gelmesin.
    await page.emulateMedia({reducedMotion: 'reduce'});
    const kartUst = await page.evaluate(() => Math.floor(document.getElementById('oyunKart').getBoundingClientRect().top + scrollY));
    await page.setViewportSize({width: 1280, height: Math.max(120, kartUst - 60)});
    await page.evaluate(() => { window.scrollTo({top: 30, behavior: 'instant'}); });
    let konum = await T(page, 'ekranDisi', 'oyunKart');
    assert.deepEqual([konum.kaydirma, konum.disarida, (await T(page, 'gorunum')).odak], [30, true, 'oyunGirdi'],
      'Düzenek: sayfa 30 px kaydırılmış, kart (odaktaki girdiyle) ekranın altında: ' + JSON.stringify(konum));
    await disaridan(f.Z3, 'bugun');
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    g = await T(page, 'gorunum');
    assert.equal(g.kart, false);
    assert.equal(g.odak, 'oyunBos', 'Kart odağın altından gizlenince odak boş duruma taşınır');
    konum = await T(page, 'ekranDisi', 'oyunBos');
    assert.deepEqual([konum.kaydirma, konum.disarida], [30, true], 'Odak boş duruma taşınırken sayfa kaymaz (boş durum ekranın dışında kalır): ' + JSON.stringify(konum));
    // c) Boş durum odaktayken kelime gelir: odak girdiye geçer, girdi boştur; sayfa yine kaymaz.
    await disaridan(f.Z4, 'dun');
    await kelimeBekle(page, f.Z4);
    g = await T(page, 'gorunum');
    assert.equal(g.bos, false);
    assert.equal(g.odak, 'oyunGirdi', 'Boş durum odaktayken gelen kelimede odak girdiye taşınır');
    assert.equal(g.deger, '');
    konum = await T(page, 'ekranDisi', 'oyunKart');
    assert.deepEqual([konum.kaydirma, konum.disarida], [30, true], 'Odak girdiye taşınırken sayfa kaymaz (kart ekranın dışında kalır): ' + JSON.stringify(konum));
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
    const y = tam(w2);
    await a.keyboard.type(y[0]);
    await b.evaluate(k => window.YDS.Ilerleme.dogru(k, 'kelime'), w3);
    await don(true);
    await a.waitForTimeout(400);
    g = await T(a, 'gorunum');
    assert.equal(g.deger, y[0], 'Yazılan harf yerinde');
    assert.equal(g.odak, 'oyunGirdi');
    assert.equal(await T(a, 'uyuyor', w2, false), true, 'Yarım kelime dönüşte değişmez');
    // Kelimenin kalanı da (açık harfler dahil) yazılır.
    await a.keyboard.type(y.slice(1));
    assert.equal((await T(a, 'gorunum')).deger, y, 'Kelimenin tamamı yazıldı');
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
  senaryo('Ctrl/Cmd+A: tümünü seçip yazmak yazılan kelimenin tamamını (açık harflerin üzerine yazılanı da) değiştirir ve ilk denemede doğru sayılır; Tab ile dönüş ve çift tıklama yazılanı silmez', async () => {
    const page = await yeniSayfa();
    await ac(page, base);
    await enAzBosluk(page, 3);
    const [w] = await T(page, 'sira');
    await kelimeBekle(page, w);
    // Yazılan kelimenin tamamıdır: açık harfler de yazılır. En az üç gizli harf bırakan kelime (0. kutuda) en az
    // altı harflidir; açık harfi de vardır.
    const y = tam(w), gizli = await T(page, 'gizliSira');
    assert.ok(gizli.length >= 3 && gizli.length < y.length, 'Düzenek: en az üç gizli ve en az bir açık harf gerekli (' + w + ', ' + gizli.length + ' gizli, ' + (y.length - gizli.length) + ' açık harf)');
    const once = await T(page, 'bugunku');
    // Seçim: tarayıcının sıraya koyduğu select olayı da işlensin diye bir kare ve bir görev sonra okunur.
    const secim = () => page.evaluate(() => new Promise(coz => requestAnimationFrame(() => setTimeout(() => {
      const g = document.getElementById('oyunGirdi');
      coz([g.selectionStart, g.selectionEnd]);
    }, 0))));
    const deger = async () => (await T(page, 'gorunum')).deger;
    // Harf kutularının sınıfları (ayraçlar hariç) ve kelime tam yazılmışken beklenen hâl: her kutu yazılmış; açık
    // kutu, üzerine başka harf yazıldıysa işaretli (farkli). Gizli kutu hiç işaretlenmez.
    const siniflar = g => g.hucreler.filter(h => h.s !== 'ayrac').map(h => h.s);
    const tamYazili = farkli => [...y].map((c, i) => (gizli.includes(i) ? 'bos yazildi' : 'sabit yazildi' + (farkli ? ' farkli' : '')));
    await odakla(page);
    // Tab ile çıkıp dönünce tarayıcı alanın tamamını seçer; seçim sona toplanır, sonraki harf eklenir.
    await page.keyboard.type(y.slice(0, 2));
    await page.keyboard.press('Tab');
    assert.notEqual((await T(page, 'gorunum')).odak, 'oyunGirdi', 'Düzenek: Tab girdiden çıkardı');
    await page.keyboard.press('Shift+Tab');
    assert.equal((await T(page, 'gorunum')).odak, 'oyunGirdi');
    assert.deepEqual(await secim(), [2, 2], 'Tab ile dönüşte seçim sona toplanır');
    await page.keyboard.type(y[2]);
    assert.equal(await deger(), y.slice(0, 3), 'Tab ile dönüşten sonra yazılan harf öncekilere eklenir');
    // Çift tıklama da seçim bırakmaz.
    await page.keyboard.press('Backspace');
    await page.locator('.harf-alan').dblclick();
    assert.deepEqual(await secim(), [2, 2], 'Çift tıklamada seçim sona toplanır');
    await page.keyboard.type(y[2]);
    assert.equal(await deger(), y.slice(0, 3), 'Çift tıklamadan sonra yazılan harf öncekilere eklenir');
    // Ctrl/Cmd+A: seçim korunur (select olayından sonra da); yazılan, öncekilerin yerine geçer.
    await page.keyboard.press('ControlOrMeta+A');
    assert.deepEqual(await secim(), [0, 3], 'Ctrl/Cmd+A seçimi korunur');
    await page.keyboard.type(yanlisHarfler(y));
    let g = await T(page, 'gorunum');
    assert.equal(g.deger, yanlisHarfler(y), 'Seçilen üç harfin yerine kelimenin tamamı (açık harflerin yeri dahil) yanlış harflerle yazıldı');
    assert.deepEqual(siniflar(g), tamYazili(true), 'Yanlış harflerle yazılan kelime: her kutu yazılmış, açık kutuların hepsi işaretli');
    await page.keyboard.press('ControlOrMeta+A');
    assert.deepEqual(await secim(), [0, y.length], 'Ctrl/Cmd+A yazılan kelimenin tamamını seçer');
    await page.keyboard.type(y);
    g = await T(page, 'gorunum');
    assert.equal(g.deger, y, 'Tümünü seçip yazmak yazılan kelimenin tamamını değiştirir');
    assert.equal(g.hucreler.map(h => h.c).join(''), w.toLowerCase(), 'Kutular yeni harfleri gösterir');
    assert.deepEqual(siniflar(g), tamYazili(false), 'Yeniden yazılan kelime: her kutu yazılmış, açık kutularda işaret kalmadı');
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
  senaryo('Eşitleme sürerken "Kontrol et" ve "Bilemedim" bekletilir; birleşim bitince ya da süre dolunca bir kez işlenir, sonra hiç bekletilmez; yazmak, harf açmak ve tamamı yazılmamış kelimede "Kontrol et" beklemez; beklerken eksik kalan kelimenin (harf açma, silme) bekleyen kontrolü düşer; eşitleme kapalıyken bekleme yok, bilinmeyen ara durum da bekletir, gizli sekmede sonuç hemen yazılır, yarıda kalan bekleme yeni açılışta bir kez notla bildirilir; birleşimin kaydını değiştirdiği kelimenin cevabı işlenmez', async () => {
    // Beklemenin üst sınırı sayfa açılışından itibaren işler. Makinenin hızı sonucu değiştirmesin diye saat
    // baştan duraklatılır ve yalnız elle ilerletilir (page.clock; gerçek bekleme yok). Sınır sabit yazılmaz:
    // sayfanın yüklediği betikten okunur, (i) adımında davranışla ölçülür.
    let sinir = null;
    // Kelime bitmeden basılan "Kontrol et"in olağan iletisi (kelimede açık harf varken). Bekletilen cevabın iletisi
    // değildir: eksik kelime hiç bekletilmez.
    const EKSIK_ACIK_HARFLI = 'Önce kelimenin tamamını yaz; açık harfleri de yaz.';
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
    // Aynı sekmede yeniden açılan belge de durmuş saatle başlar; saati o ana dek ilerletilen süre kadar ileridedir.
    // Açılış, kelime (ya da boş durum) göründüğünde ve motor ilk olayını ("kapali") bildirdiğinde tamamdır.
    const acilisiBekle = async page => {
      await hazir(page);
      await page.waitForFunction(() => window.__esitlemeDurumlari.length > 0);
    };
    // Aşağıdaki adımlar buna dayanır; sayfa saati beklenen yerde değilse sebep ürün değil page.clock'tur.
    const saat = page => page.evaluate(() => Date.now());
    const SAAT_SURMUYOR = 'Düzenek: yeniden açılan belgenin saati kaldığı yerden sürmüyor (page.clock davranışı değişmiş olabilir)';
    const yenile = async page => {
      const once = await saat(page);
      await page.reload();
      await acilisiBekle(page);
      assert.equal(await saat(page), once, SAAT_SURMUYOR);
    };
    // Sayfadan çıkılır, saat ilerletilir, oyun yeniden açılır: arada oyun belgesi yoktur, zamanlayıcıları çalışmaz
    // (atılıp sonradan geri yüklenen sekme gibi).
    const araVerVeAc = async (page, ms) => {
      const once = await saat(page);
      await page.goto('about:blank');
      await ilerlet(page, ms);
      await page.goto(base + '/oyunlar.html');
      await acilisiBekle(page);
      assert.equal(await saat(page), once + ms, SAAT_SURMUYOR);
    };

    // a) Durum değişimiyle biten bekleme; açılıştaki "kapali" kapıyı bitirmez; bittikten sonra bekletilmez.
    {
      const page = await kapiliSayfa();
      const [w1, w2, w3] = await T(page, 'sira');
      await kelimeBekle(page, w1);
      const once = await T(page, 'bugunku');
      await T(page, 'esitleme', 'kapali');
      await T(page, 'esitleme', 'yukleniyor');
      await odakla(page);
      // Yazılan kelimenin tamamıdır (açık harfler dahil); gizli: harfi gizli kutu sayısı.
      const y = tam(w1), gizli = (await T(page, 'gizliSira')).length;
      assert.ok(gizli >= 1 && gizli < y.length, 'Düzenek: kelimenin hem gizli hem açık harfi var (' + w1 + ', ' + gizli + ' gizli, ' + (y.length - gizli) + ' açık harf)');
      // Kelime bitmeden Enter bekletilmez: olağan ileti, o anda. Bekletmenin eşiği kelimenin harf sayısıdır, gizli
      // harf sayısı değil: gizli kutu sayısı kadar harf yazılmışken de (açık harfler de yazılır), yalnız son harf
      // eksikken de kelime eksiktir.
      for (const adet of [...new Set([gizli, y.length - 1])]) {
        const etiket = adet === gizli ? 'Gizli kutu sayısı kadar (' + adet + ') harf yazılmışken' : 'Yalnız son harf eksikken';
        await page.keyboard.type(y.slice((await T(page, 'gorunum')).deger.length, adet));
        assert.equal((await T(page, 'gorunum')).durum, '', 'Düzenek: durum satırı boş (yazmak geçici iletiyi siler)');
        await page.keyboard.press('Enter');
        assert.equal(await ilkIleti(page), EKSIK_ACIK_HARFLI, etiket + ' kelime eksiktir: Enter bekletilmez, olağan ileti hemen yazılır');
        const g = await T(page, 'gorunum');
        assert.deepEqual([g.deger, g.gonder, g.gecersiz, g.odak], [y.slice(0, adet), 'Kontrol et', null, 'oyunGirdi'], etiket + ': yazılan yerinde, deneme harcanmadı');
        assert.equal(g.hucreler.filter(h => h.s.startsWith('bos')).length, gizli, etiket + ': hiçbir gizli harf açılmadı');
      }
      // Bileşim sürerken (telefon klavyesi) girdide henüz temizlenmemiş, harf olmayan bir karakter durabilir: bekletmenin
      // eşiği ham uzunluk değil temizlenmiş harf sayısıdır; kelime yine eksiktir, Enter bekletilmez.
      {
        const klavye = await page.context().newCDPSession(page);
        await klavye.send('Input.imeSetComposition', {text: '-', selectionStart: 1, selectionEnd: 1});
        const gb = await T(page, 'gorunum');
        assert.deepEqual([gb.deger, gb.durum], [y.slice(0, -1) + '-', ''], 'Düzenek: bileşim sürerken tire girdide duruyor, geçici ileti silindi');
        await page.keyboard.press('Enter');
        assert.equal(await ilkIleti(page), EKSIK_ACIK_HARFLI, 'Bileşimdeki harf olmayan karakter kelimeyi tamamlamaz: Enter bekletilmez');
        await klavye.send('Input.imeSetComposition', {text: '', selectionStart: 0, selectionEnd: 0});
        assert.equal((await T(page, 'gorunum')).deger, y.slice(0, -1), 'Düzenek: girdi temizlenmiş hâliyle kaldı');
        await klavye.detach();
      }
      await page.keyboard.type(y.slice(-1));
      await page.keyboard.press('Enter');
      await durumBekle(page, BEKLE_KONTROL);
      const bekliyor = async etiket => {
        const g = await T(page, 'gorunum');
        assert.equal(g.durum, BEKLE_KONTROL, etiket);
        assert.equal(g.gonder, 'Kontrol et', etiket + ': kelime bitmedi');
        assert.equal(g.deger, y, etiket + ': yazılan yerinde');
        assert.equal(g.hucreler.map(h => h.c).join(''), w1.toLowerCase(), etiket + ': yazılan harfler kutularda');
        assert.equal(g.hucreler.filter(h => h.s.startsWith('bos')).length, gizli, etiket + ': hiçbir gizli harf açılmadı (cevap işlenmedi)');
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
      assert.equal((await T(page, 'gorunum')).deger, y.slice(0, -1), 'Beklerken yazılan düzeltilebilir');
      await page.keyboard.type(y.slice(-1));
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
      await page.keyboard.type(tam(w2));
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

    // a2) Ayraçlı başlık: bekletmenin ve bekleyen kontrolün eşiği harf sayısıdır (tire sayılmaz). Tireli bir kelime
    //     1. kutuya, vadesi bugüne yazılır ve sıranın başına gelir; tamamı yazılınca Enter bekletilir, birleşim bitince
    //     bekleyen kontrol işlenir (kelime eksik sayılıp düşmez).
    {
      const page = await kapiliSayfa();
      const tireli = await page.evaluate(() => {
        const Y = window.YDS, d = Y.Veri.dizin.find(x => x.e.includes('-') && Y.OyunHesap.oynanabilir(x));
        Y.Depo.yaz('yds-katmanlar', [d.k]);
        return d.e;
      });
      assert.equal(await T(page, 'kayitKoy', tireli, 1), true, 'Düzenek: tireli kelime 1. kutuya yazıldı, vadesi bugün');
      await yenile(page);
      assert.equal((await T(page, 'sira', 'sira', 1))[0], tireli, 'Düzenek: tireli kelime sıranın başında');
      await kelimeBekle(page, tireli);
      await T(page, 'esitleme', 'yukleniyor');
      await odakla(page);
      await page.keyboard.type(tam(tireli));
      await page.keyboard.press('Enter');
      assert.equal(await ilkIleti(page), BEKLE_KONTROL, 'Tireli kelimenin tamamı yazılınca Enter bekletilir: eşik harf sayısıdır, tire sayılmaz (' + tireli + ')');
      await T(page, 'esitleme', 'hazir');
      assert.match((await T(page, 'gorunum')).durum, /^Bildiniz! Kelime 2\. kutuya çıktı; /, 'Birleşim bitince tireli kelimenin bekleyen kontrolü işlenir (eksik sayılıp düşmez)');
      await ilerlet(page, 300);
      await kutuBekle(page, tireli, 2);
    }

    // b) "Bilemedim, göster" bekletilir, cevap açılmaz; "Bir harf aç" bekletilmez.
    {
      const page = await kapiliSayfa();
      const sira = await T(page, 'sira', 'sira', 40);
      // En az iki gizli harfli ilk kelimeye kadar geç (bugünkü ilk kelime zaten uygundur).
      let w = null;
      for (const aday of sira) {
        await kelimeBekle(page, aday);
        if ((await T(page, 'gizliSira')).length >= 2) { w = aday; break; }
        await page.locator('#oyunPas').click();
        await page.locator('#oyunGonder').click();
      }
      assert.ok(w, 'Düzenek: en az iki gizli harfli kelime bulunamadı');
      const oncekiYazim = await T(page, 'yazilan');
      const once = await T(page, 'bugunku'), bugun = await T(page, 'bugun');
      await T(page, 'esitleme', 'yukleniyor');
      const ilkBos = (await T(page, 'gorunum')).hucreler.findIndex(h => h.s.startsWith('bos'));
      await page.locator('#oyunHarf').click();
      await durumBekle(page, harfSirasi(w, ilkBos) + '. harf açıldı: ' + w[ilkBos] + '. Doğru bilirsen kelime 1. kutuya girer.');
      // Girdi boş: sıra işareti ("simdi") kelimenin ilk harf kutusundadır; açılan harf o kutuysa ikisini de taşır.
      const acilanlar = (await T(page, 'gorunum')).hucreler;
      assert.equal(acilanlar[ilkBos].s, 'ipucu' + (ilkBos === acilanlar.findIndex(h => h.s !== 'ayrac') ? ' simdi' : ''), 'Harf açma bekletilmez');
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

    // d) Eşitleme kapalıyken (motorun tek olayı "kapali") hiçbir şey bekletilmez: saat durduğu için üst sınır
    //    kurtaramaz, cevap o anda işlenmelidir. Kapı belirli durum adlarına da bağlı değildir: motorun
    //    bilinmeyen bir ara durumu da "sürüyor" sayılır, bekleyen cevap "hazir" gelince işlenir.
    {
      const page = await kapiliSayfa();
      const [w1, w2, w3] = await T(page, 'sira');
      await kelimeBekle(page, w1);
      assert.deepEqual(await durumVeSinif(page), DURUM_BOS, 'Olağan ilk açılışta durum satırı boş (yarım bekleme notu yok)');
      await coz(page, w1);
      assert.equal(await ilkIleti(page), BILDINIZ_1, 'Eşitleme kapalıyken (motor yalnız "kapali" bildirdi) cevap bekletilmeden işlenir');
      await ilerlet(page, 200);
      await kutuBekle(page, w1, 1);
      await page.keyboard.press('Enter');
      await kelimeBekle(page, w2);
      await page.locator('#oyunPas').click();
      assert.equal(await ilkIleti(page), 'Cevap: ' + w2 + '. Kelime 1. kutuda; yarın tekrar gelecek.', 'Eşitleme kapalıyken "Bilemedim, göster" bekletilmez');
      await ilerlet(page, 200);
      await kutuBekle(page, w2, 1);
      await page.keyboard.press('Enter');
      await kelimeBekle(page, w3);
      // Buraya kadar hiçbir cevap bekletilmedi, bekleme de bitmiş sayılmadı; şimdi motor tanınmayan bir ara durum bildiriyor.
      await T(page, 'esitleme', 'yeni-ara-durum');
      await coz(page, w3);
      assert.equal(await ilkIleti(page), BEKLE_KONTROL, 'Bilinmeyen ara durumda da cevap bekletilir (kapı durum adlarına bağlı değil)');
      await T(page, 'esitleme', 'baska-ara-durum');
      await ilerlet(page, 300);
      assert.equal((await T(page, 'gorunum')).durum, BEKLE_KONTROL, 'Bilinmeyen bir durumdan ötekine geçiş beklemeyi bitirmez');
      assert.equal(await T(page, 'kayit', w3), null, 'Bilinmeyen ara durumda ilerleme yazılmadı');
      await T(page, 'esitleme', 'hazir');
      assert.equal((await T(page, 'gorunum')).durum, BILDINIZ_1, 'Bilinmeyen ara durumda bekleyen cevap "hazir" gelince işlenir');
      await ilerlet(page, 300);
      await kutuBekle(page, w3, 1);
      assert.deepEqual(await T(page, 'yazilan'), ['dogru:' + w1, 'yanlis:' + w2, 'dogru:' + w3], 'Her kelime bir kez yazıldı');
    }

    // e) Üst sınır ilk bekletmeden değil sayfa açılışından sayılır: açılıştan (sınır − 1 sn) sonra bekletilen
    //    cevap 1 sn sonra işlenir. Üst sınırla işlenen cevap da izini siler: sonra yeniden açılan sayfada not yok.
    {
      const page = await kapiliSayfa();
      const [w, w2] = await T(page, 'sira');
      await kelimeBekle(page, w);
      await T(page, 'esitleme', 'yukleniyor');
      await ilerlet(page, sinir - 1000);
      await coz(page, w);
      assert.equal(await ilkIleti(page), BEKLE_KONTROL, 'Sınırdan 1 sn önce verilen cevap bekletilir');
      await ilerlet(page, 900);
      assert.equal((await T(page, 'gorunum')).durum, BEKLE_KONTROL, 'Açılıştan ' + (sinir - 100) + ' ms sonra cevap hâlâ bekliyor');
      assert.deepEqual([await T(page, 'kayit', w), await T(page, 'yazilan')], [null, []], 'Beklerken ilerleme yazılmadı');
      await ilerlet(page, 100);
      assert.equal((await T(page, 'gorunum')).durum, BILDINIZ_1,
        'Üst sınır sayfa açılışından sayılır: ' + (sinir - 1000) + '. ms\'de bekletilen cevap açılıştan ' + sinir + ' ms sonra işlenir (ilk bekletmeden ' + sinir + ' ms sonra değil)');
      await ilerlet(page, 200);
      await kutuBekle(page, w, 1);
      assert.deepEqual(await T(page, 'yazilan'), ['dogru:' + w]);
      // Yavaş bağlantıda sıra budur: üst sınır cevabı işler ve yazar, birleşim birkaç saniye sonra bitip sayfayı
      // yeniler. Cevap kaydedildiği için "son cevabın işlenmedi" notu çıkmamalıdır.
      await yenile(page);
      await kelimeBekle(page, w2);
      assert.deepEqual(await durumVeSinif(page), DURUM_BOS, 'Üst sınır dolunca işlenen cevaptan sonra yeniden açılan sayfada not yok');
    }

    // e2) Bekleme, o ana dek hiçbir cevap bekletilmemiş olsa da biter ve bir daha başlamaz: üst sınır dolduktan
    //     sonra verilen ilk cevap, motor hâlâ "yukleniyor" dese de bekletilmez; bekleyen cevap yokken biten
    //     birleşimden sonra gelen yeni bir "yukleniyor" da (motor SDK'yı yeniden dener) bekletmez.
    {
      const page = await kapiliSayfa();
      const [w, w2] = await T(page, 'sira');
      await kelimeBekle(page, w);
      await T(page, 'esitleme', 'yukleniyor');
      await ilerlet(page, sinir);
      await coz(page, w);
      assert.equal(await ilkIleti(page), BILDINIZ_1, 'Üst sınır dolduktan sonra verilen ilk cevap bekletilmez (o ana dek bekleyen cevap olmasa da bekleme biter)');
      await ilerlet(page, 200);
      await kutuBekle(page, w, 1);
      // Yeni belgede bekleme baştan başlar; bu kez onu, bekleyen cevap yokken gelen "hata" bitirir.
      await yenile(page);
      await kelimeBekle(page, w2);
      await T(page, 'esitleme', 'yukleniyor');
      await T(page, 'esitleme', 'hata');
      await T(page, 'esitleme', 'yukleniyor');
      await coz(page, w2);
      assert.equal(await ilkIleti(page), BILDINIZ_1, 'Bekleyen cevap yokken biten birleşimden sonra yeni bir "yukleniyor" cevabı bekletmez');
    }

    // f) Bekleyen YANLIŞ cevap birleşim bitince bir kez işlenir; sonra süre dolunca kendiliğinden ikinci kez
    //    işlenmez: yeniden yazılan harfler yerinde kalır, deneme hakkı harcanmaz.
    {
      const page = await kapiliSayfa();
      const [w] = await T(page, 'sira');
      await kelimeBekle(page, w);
      await T(page, 'esitleme', 'yukleniyor');
      // Kelimenin tamamı, bütün harfleri yanlış: hiçbir gizli harf açılmaz, ileti yalnız kalan hakkı söyler.
      const yanlis = yanlisHarfler(tam(w));
      await page.locator('#oyunGirdi').focus();
      await page.keyboard.type(yanlis);
      await page.keyboard.press('Enter');
      assert.equal(await ilkIleti(page), BEKLE_KONTROL, 'Düzenek: birleşim sürerken verilen cevap bekletildi');
      await T(page, 'esitleme', 'hazir');
      let g = await T(page, 'gorunum');
      assert.deepEqual([g.durum, g.deger, g.gecersiz], ['Olmadı; baştan yaz. 2 hakkın kaldı.', '', 'true'], 'Bekleyen yanlış cevap birleşim bitince işlenir: bir deneme harcandı');
      await page.keyboard.type(yanlis);
      await ilerlet(page, sinir + 500);
      g = await T(page, 'gorunum');
      assert.deepEqual([g.durum, g.deger, g.gonder], ['Olmadı; baştan yaz. 2 hakkın kaldı.', yanlis, 'Kontrol et'],
        'Birleşimle işlenen cevap süre dolunca Enter\'sız ikinci kez işlenmez: ileti ve yazılan yerinde');
      // Harcanan deneme tek: kullanıcının Enter'ı ikinci denemedir.
      await page.keyboard.press('Enter');
      await durumBekle(page, 'Olmadı; baştan yaz. Son hakkın.');
      assert.deepEqual([await T(page, 'kayit', w), await T(page, 'yazilan')], [null, []], 'Yanlış denemeler ilerlemeye yazılmaz');
    }

    // g) Bekleme sekme gizliyken biterse (kullanıcı başka sekmeye geçti) sonuç işlendiği anda yazılır: gizli
    //    sekmede kare zamanlayıcısı çalışmaz, sekme geri gelmeden atılırsa cevap kaybolurdu. Başsız tarayıcı
    //    sayfayı hep görünür tuttuğu için 14. senaryodaki gibi benzetilir.
    {
      const page = await kapiliSayfa();
      const [w] = await T(page, 'sira');
      await kelimeBekle(page, w);
      const once = await T(page, 'bugunku'), bugun = await T(page, 'bugun');
      await T(page, 'esitleme', 'yukleniyor');
      await coz(page, w);
      assert.equal(await ilkIleti(page), BEKLE_KONTROL, 'Düzenek: birleşim sürerken verilen cevap bekletildi');
      await page.evaluate(() => {
        window.requestAnimationFrame = () => 0;
        Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true});
        document.dispatchEvent(new Event('visibilitychange'));
      });
      assert.deepEqual([(await T(page, 'gorunum')).durum, await T(page, 'yazilan')], [BEKLE_KONTROL, []], 'Sekme gizlenirken bekleyen cevap işlenmez');
      await T(page, 'esitleme', 'hazir');
      // Saat ilerletilmeden, sekme hâlâ gizliyken:
      const g = await T(page, 'gorunum');
      assert.deepEqual([g.durum, g.gonder], [BILDINIZ_1, 'Sonraki kelime →'], 'Gizli sekmede de bekleyen cevap birleşim bitince işlenir');
      assert.deepEqual(await T(page, 'kayit', w), {k: 1, g: bugun + 1, c: bugun}, 'Gizli sekmede işlenen cevap kare beklemeden, o anda yazılır');
      assert.deepEqual(await T(page, 'yazilan'), ['dogru:' + w], 'Bir kez, "doğru" olarak yazıldı');
      assert.deepEqual([g.sayim, g.bilinen], ['Bu oturum: ✓ 1 bildin · 💡 0 ipuçlu · ✗ 0 bilemedin', [w + ' · 1. kutu']], 'Oturum sayımı da o anda güncellenir');
      assert.deepEqual(await T(page, 'bugunku'), {t: once.t + 1, d: once.d + 1, y: once.y + 1}, 'Günlük sayaç da o anda yazıldı');
    }

    // h) Bekletilen cevap işlenemeden sayfa yeniden açılırsa (birleşim başka cihazdan kayıt getirince motor
    //    sayfayı yeniler) söz verilen kontrol yapılmamıştır: yeni açılış bunu bir kez, notla bildirir.
    //    Cevap işlendiyse, bekleme kelime değiştiği için düştüyse ya da iz ömrünü doldurduysa not yoktur.
    {
      const page = await kapiliSayfa();
      const omur = await betikSabiti(page, 'ERTELEME_IZI_OMRU_MS');
      assert.ok(omur >= 1000, 'Düzenek: oyunlar.js içindeki ERTELEME_IZI_OMRU_MS okunamadı ya da 1 sn\'den kısa (' + omur + ')');
      const [w, w2] = await T(page, 'sira');
      const once = await T(page, 'bugunku');
      // Ekrandaki kelimeyi birleşim sürerken yanıtlar: cevap bekletilir.
      const beklet = async (kelime, pas) => {
        await kelimeBekle(page, kelime);
        await T(page, 'esitleme', 'yukleniyor');
        if (pas) await page.locator('#oyunPas').click(); else await coz(page, kelime);
        await durumBekle(page, pas ? BEKLE_PAS : BEKLE_KONTROL);
      };
      // Kelime bitmeden basılan Enter bekletilmediği için iz de bırakmaz (gizli kutu sayısı kadar harf yazılmış
      // olsa da): birleşim sürerken yeniden açılan sayfada not yok.
      await kelimeBekle(page, w);
      await T(page, 'esitleme', 'yukleniyor');
      await page.locator('#oyunGirdi').focus();
      await page.keyboard.type(tam(w).slice(0, (await T(page, 'gizliSira')).length));
      await page.keyboard.press('Enter');
      assert.equal(await ilkIleti(page), EKSIK_ACIK_HARFLI, 'Düzenek: gizli kutu sayısı kadar harfle basılan Enter olağan iletiyi verdi');
      await yenile(page);
      await kelimeBekle(page, w);
      assert.deepEqual(await durumVeSinif(page), DURUM_BOS, 'Eksik kelimede basılan Enter bekletilmedi, iz bırakmadı: yeniden açılan sayfada not yok');
      // Bekleme sürerken yenileme: not, aynı kelime taze, hiçbir şey yazılmadı.
      await beklet(w);
      await yenile(page);
      assert.deepEqual([await T(page, 'kayit', w), await T(page, 'bugunku')], [null, once], 'Yarıda kalan cevap sayfa kapanırken de işlenmedi: ilerlemeye ve günlük sayaca yazılmadı');
      await kelimeBekle(page, w);
      assert.deepEqual(await durumVeSinif(page), DURUM_NOTLU, 'Bekletilen cevap işlenmeden yeniden açılan sayfa bunu notla bildirir');
      const g = await T(page, 'gorunum');
      assert.deepEqual([g.deger, g.gonder, g.sonuc, g.gecersiz], ['', 'Kontrol et', false, null], 'Notla açılan kelime taze: yazılan yok, kelime bitmedi');
      // Not bir kez gösterilir.
      await yenile(page);
      await kelimeBekle(page, w);
      assert.deepEqual(await durumVeSinif(page), DURUM_BOS, 'İkinci yenilemede not yinelenmez');
      // Bekleyen cevap işlendiyse (birleşim bitti) sonraki açılışta not yok.
      await beklet(w);
      await T(page, 'esitleme', 'hazir');
      assert.equal((await T(page, 'gorunum')).durum, BILDINIZ_1, 'Düzenek: bekleyen cevap birleşim bitince işlendi');
      await ilerlet(page, 300);
      await kutuBekle(page, w, 1);
      await yenile(page);
      await kelimeBekle(page, w2);
      assert.deepEqual(await durumVeSinif(page), DURUM_BOS, 'Bekletilen cevap işlendikten sonra yeniden açılan sayfada not yok');
      // Motor sayfayı beklemenin üst sınırına 100 ms kala yenilese de iz hâlâ tazedir (iz üst sınırdan uzun yaşar).
      await beklet(w2);
      await ilerlet(page, sinir - 100);
      assert.equal((await T(page, 'gorunum')).durum, BEKLE_KONTROL, 'Düzenek: üst sınıra 100 ms kala cevap hâlâ bekliyor');
      await yenile(page);
      await kelimeBekle(page, w2);
      assert.deepEqual(await durumVeSinif(page), DURUM_NOTLU, 'Üst sınıra 100 ms kala yenilenen sayfa da notla açılır (iz, beklemenin üst sınırından uzun yaşar)');
      // Not yalnız taze iz için gösterilir: sayfa ömründen 1 ms önce açılırsa var, tam ömründe açılırsa yok.
      // (Bekletilen "Bilemedim, göster" de aynı izi bırakır.)
      await beklet(w2, true);
      await araVerVeAc(page, omur - 1);
      await kelimeBekle(page, w2);
      assert.deepEqual(await durumVeSinif(page), DURUM_NOTLU, 'Bekletmeden ' + (omur - 1) + ' ms sonra açılan sayfada not var ("Bilemedim" bekletilmişti)');
      await beklet(w2);
      await araVerVeAc(page, omur);
      await kelimeBekle(page, w2);
      assert.deepEqual(await durumVeSinif(page), DURUM_BOS, 'Bekletmeden ' + omur + ' ms sonra (izin ömrü doldu) açılan sayfada not yok');
      // Kelime değişince düşen bekleme iz bırakmaz. Ertesi gün w'nin tekrar zamanı gelir: "Sıradakiler" w ile,
      // "Yalnız yeni kelimeler" w2 ile başlar; mod değişimi ekrana başka kelime getirir.
      await araVerVeAc(page, 24 * 60 * 60 * 1000);
      assert.deepEqual([(await T(page, 'sira', 'sira'))[0], (await T(page, 'sira', 'yeni'))[0]], [w, w2], 'Düzenek: ertesi gün sıra tekrar kelimesiyle, "yalnız yeni" başka kelimeyle başlar');
      await beklet(w);
      await page.locator('.oyun-mod [data-mod="yeni"]').click();
      await kelimeBekle(page, w2);
      assert.deepEqual(await durumVeSinif(page), DURUM_BOS, 'Mod değişimi başka kelime getirdi: bekleme iletisi silindi');
      await yenile(page);
      await kelimeBekle(page, w);
      assert.deepEqual(await durumVeSinif(page), DURUM_BOS, 'Kelime değiştiği için düşen beklemeden sonra yeniden açılan sayfada not yok');
      assert.deepEqual([(await T(page, 'kayit', w) || {}).k, await T(page, 'kayit', w2)], [1, null], 'Düşen bekleme işlenmedi: w ilk günkü kutusunda, w2 kayıtsız');
      // Bekletilen "Bilemedim, göster" de birleşim bitince işlenir ve izini siler.
      await beklet(w, true);
      await T(page, 'esitleme', 'hazir');
      assert.equal((await T(page, 'gorunum')).gonder, 'Sonraki kelime →', 'Düzenek: bekleyen "Bilemedim" birleşim bitince işlendi, kelime bitti');
      await ilerlet(page, 300);
      await yenile(page);
      await kelimeBekle(page, w2);
      assert.deepEqual(await durumVeSinif(page), DURUM_BOS, 'Bekletilen "Bilemedim" işlendikten sonra yeniden açılan sayfada not yok');
    }

    // h2) Birleşim tam bekleyen kelimenin kaydını değiştirdiyse (kelime başka cihazda yanıtlanmış) cevap eski
    //     seviyeyle verilmiştir: bekleme bitince işlenmez, sonuç iletisi bir an bile görünmez; motorun
    //     yenilediği sayfa bunu notla bildirir. Yenileme gelmezse iz, ekrana başka kelime gelince silinir.
    //     Ekran boş duruma düşerse bekleyen cevap da izi de bırakılır.
    {
      const page = await kapiliSayfa();
      const [w, w2] = await T(page, 'sira');
      const once = await T(page, 'bugunku'), bugun = await T(page, 'bugun');
      const beklet = async () => {
        await kelimeBekle(page, w);
        await T(page, 'esitleme', 'yukleniyor');
        await coz(page, w);
        assert.equal(await ilkIleti(page), BEKLE_KONTROL, 'Düzenek: birleşim sürerken verilen cevap bekletildi');
        return (await T(page, 'gorunum')).deger;
      };
      // Birleşim kelimenin kaydını getirir (3. kutu), ardından biter.
      let yazili = await beklet();
      assert.equal(await T(page, 'kayitKoy', w, 3), true, 'Düzenek: birleşim kelimenin kaydını yazdı');
      await T(page, 'esitleme', 'hazir');
      let g = await T(page, 'gorunum');
      assert.deepEqual([await durumVeSinif(page), g.gonder, g.deger, g.sonuc], [[KAYIT_DEGISTI_NOTU, 'oyun-durum uyari'], 'Kontrol et', yazili, false],
        'Birleşim bekleyen kelimenin kaydını değiştirdiyse cevap işlenmez: ileti bunu söyler, kelime bitmez, yazılan yerinde kalır');
      await ilerlet(page, 300);
      assert.deepEqual([await T(page, 'yazilan'), await T(page, 'leitnerDepoKaydi', w), await T(page, 'bugunku'), (await T(page, 'gorunum')).durum],
        [[], {k: 3, g: bugun, c: bugun - 7}, once, KAYIT_DEGISTI_NOTU], 'İşlenmeyen cevap birleşimin getirdiği kaydın üzerine yazmaz; günlük sayaç ve ileti yerinde');
      // Motor sayfayı yeniler: yeni açılış, verilen cevabın işlenmediğini söyler (kelime artık 3. kutuda, vadesi bugün).
      await yenile(page);
      await kelimeBekle(page, w);
      assert.deepEqual(await durumVeSinif(page), DURUM_NOTLU, 'Kaydı birleşimle değiştiği için işlenmeyen cevaptan sonra yeniden açılan sayfa bunu notla bildirir');
      // Yenileme gelmezse: ekrana başka kelime gelince iz silinir, sonraki açılışta not çıkmaz.
      yazili = await beklet();
      assert.equal(await T(page, 'kayitKoy', w, 4), true, 'Düzenek: birleşim kelimenin kaydını yeniden değiştirdi');
      await T(page, 'esitleme', 'hazir');
      assert.equal((await T(page, 'gorunum')).durum, KAYIT_DEGISTI_NOTU, 'Düzenek: cevap yine işlenmedi');
      await page.locator('.oyun-mod [data-mod="yeni"]').click();
      await kelimeBekle(page, w2);
      await yenile(page);
      await kelimeBekle(page, w);
      assert.deepEqual(await durumVeSinif(page), DURUM_BOS, 'İşlenmeyen cevaptan sonra ekrana başka kelime geldiyse yeniden açılan sayfada not yok');
      // Bekleme sürerken ekran boş duruma düşer ("Öğrenilenler"de kelime yok): bekleyen cevap ve izi bırakılır.
      await beklet();
      await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
      await page.locator('#oyunBos').waitFor({state: 'visible'});
      await yenile(page);
      await kelimeBekle(page, w);
      assert.deepEqual(await durumVeSinif(page), DURUM_BOS, 'Bekleme sürerken ekran boş duruma düştüyse yeniden açılan sayfada not yok');
      assert.deepEqual([await T(page, 'leitnerDepoKaydi', w), await T(page, 'bugunku')], [{k: 4, g: bugun, c: bugun - 7}, once], 'Bırakılan beklemeler hiçbir şey yazmadı');
    }

    // h3) Beklerken yazılan değişip kelime eksik kaldıysa söz verilen kontrol düşer: birleşim bitince kendiliğinden
    //     "eksik" uyarısı çıkmaz, deneme harcanmaz. "Bir harf aç" yazılanı açılan harfin önünde keser; silmek de
    //     kelimeyi eksik bırakır. (Yeniden tamamlanan kelime bekleyen kontrolle işlenir: a adımı.)
    {
      const izi = sayfa => sayfa.evaluate(() => sessionStorage.getItem('yds-oyun-ertelenen'));
      const page = await kapiliSayfa();
      const [w1] = await T(page, 'sira');
      await kelimeBekle(page, w1);
      const gizli = await T(page, 'gizliSira'), y = tam(w1);
      assert.ok(gizli.length >= 2, 'Düzenek: ilk kelimede en az iki gizli harf (' + w1 + ')');
      await T(page, 'esitleme', 'yukleniyor');
      await odakla(page);
      // İkinci gizli harf yanlış yazılır, Enter bekletilir; "Bir harf aç" o harfi açar ve yazılanı önünde keser.
      await page.keyboard.type(bozuk(w1, [gizli[1]]));
      await page.keyboard.press('Enter');
      await durumBekle(page, BEKLE_KONTROL);
      assert.notEqual(await izi(page), null, 'Düzenek: bekleyen cevabın izi yazıldı');
      await page.locator('#oyunHarf').click();
      const ACILDI = (gizli[1] + 1) + '. harf açıldı: ' + y[gizli[1]] + '. Doğru bilirsen kelime 1. kutuya girer.' + KESILDI;
      await durumBekle(page, ACILDI);
      assert.equal((await T(page, 'gorunum')).deger, y.slice(0, gizli[1]), 'Düzenek: harf açmak yazılanı açılan harfin önünde kesti');
      // İz sözle birlikte yürür: kelime eksik kaldığı anda silinir (motor sayfayı şimdi yenilese "cevabın işlenmedi" denmez).
      assert.equal(await izi(page), null, 'Kelime eksik kaldı: bekleyen kontrolün izi hemen silindi');
      await T(page, 'esitleme', 'hazir');
      await ilerlet(page, 300);
      let g = await T(page, 'gorunum');
      assert.deepEqual([g.durum, g.deger, g.gonder, g.gecersiz], [ACILDI, y.slice(0, gizli[1]), 'Kontrol et', null],
        'Birleşim bitti, kelime eksik: bekleyen kontrol düştü ("eksik" uyarısı çıkmadı, harf açma iletisi yerinde, deneme harcanmadı)');
      assert.doesNotMatch(g.harfSinifi, /yanlis/);
      assert.equal(await izi(page), null, 'Bekleme izi silindi');
      assert.deepEqual(await T(page, 'yazilan'), [], 'Hiçbir şey yazılmadı');
      // Kalanı yazılır: artık bekletilmez; deneme harcanmamıştı, sonuç yalnız ipucu yüzünden "ipucuyla"dır.
      await page.keyboard.type(y.slice(gizli[1]));
      await page.keyboard.press('Enter');
      await durumBekle(page, 'Doğru, ama ipucuyla; kelime 1. kutuya girdi.');
      await ilerlet(page, 300);
      await kutuBekle(page, w1, 1);
      // Silme: tam kelime + Enter bekletilir, son harf silinir. Birleşim bitince bekleme iletisi kalkar, uyarı çıkmaz.
      const page2 = await kapiliSayfa();
      const [v] = await T(page2, 'sira');
      await kelimeBekle(page2, v);
      await T(page2, 'esitleme', 'yukleniyor');
      await odakla(page2);
      await page2.keyboard.type(tam(v));
      await page2.keyboard.press('Enter');
      await durumBekle(page2, BEKLE_KONTROL);
      await page2.keyboard.press('Backspace');
      assert.equal((await T(page2, 'gorunum')).durum, BEKLE_KONTROL, 'Düzenek: silmek bekleme iletisini kaldırmaz (kelime yeniden tamamlanırsa kontrol yapılacak)');
      // İz: kelime eksikken yok, yeniden tamamlanınca geri gelir, yine eksilince yine silinir.
      assert.equal(await izi(page2), null, 'Son harf silindi: bekleyen kontrolün izi silindi');
      await page2.keyboard.type(tam(v).slice(-1));
      assert.notEqual(await izi(page2), null, 'Kelime yeniden tamamlandı: iz geri yazıldı (kontrol yine bekliyor)');
      await page2.keyboard.press('Backspace');
      assert.equal(await izi(page2), null, 'Yeniden eksildi: iz yine silindi');
      await T(page2, 'esitleme', 'hazir');
      await ilerlet(page2, 300);
      g = await T(page2, 'gorunum');
      assert.deepEqual([g.durum, g.deger, g.gonder, g.gecersiz], ['', tam(v).slice(0, -1), 'Kontrol et', null],
        'Birleşim bitti, kelime eksik: bekleme iletisi kalktı, "eksik" uyarısı çıkmadı, deneme harcanmadı');
      assert.equal(await izi(page2), null, 'Bekleme izi silindi');
      assert.deepEqual(await T(page2, 'yazilan'), [], 'Hiçbir şey yazılmadı');
      await page2.keyboard.type(tam(v).slice(-1));
      await page2.keyboard.press('Enter');
      await durumBekle(page2, BILDINIZ_1);
      // Kelime eksikken birleşim kelimenin kaydını da değiştirse söylenecek bir şey yoktur (işlenecek cevap kalmamıştı):
      // "kaydını değiştirdi" notu çıkmaz, motorun yenilediği sayfada da "cevabın işlenmedi" denmez.
      const page3 = await kapiliSayfa();
      const [u] = await T(page3, 'sira');
      await kelimeBekle(page3, u);
      await T(page3, 'esitleme', 'yukleniyor');
      await odakla(page3);
      await page3.keyboard.type(tam(u));
      await page3.keyboard.press('Enter');
      await durumBekle(page3, BEKLE_KONTROL);
      await page3.keyboard.press('Backspace');
      assert.equal(await T(page3, 'kayitKoy', u, 3), true, 'Düzenek: birleşim kelimenin kaydını yazdı');
      await T(page3, 'esitleme', 'hazir');
      await ilerlet(page3, 300);
      g = await T(page3, 'gorunum');
      assert.deepEqual([await durumVeSinif(page3), g.deger, g.gonder], [DURUM_BOS, tam(u).slice(0, -1), 'Kontrol et'],
        'Eksik kalan kelimede kayıt değişse de "kaydını değiştirdi" denmez: bekleme iletisi kalkar, yazılan yerinde');
      assert.deepEqual([await izi(page3), await T(page3, 'yazilan')], [null, []], 'İz yok, hiçbir şey yazılmadı');
      await yenile(page3);
      assert.deepEqual(await durumVeSinif(page3), DURUM_BOS, 'Yeniden açılan sayfada "cevabın işlenmedi" notu yok');
    }

    // i) Birleşim hiç bitmezse: üst sınır dolunca bekleyen cevap işlenir. Sınırdan hemen önce cevap hâlâ
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
    await page.keyboard.type(tam(w2));
    await page.keyboard.press('Enter');
    await durumBekle(page, BILDINIZ_1);
    return 'üst sınır ' + sinir + ' ms (ölçülen ' + gecen + ')';
  });

  /* ---------- 25) Odak hiçbir öğede değilken yazma ---------- */
  senaryo('Odaksız yazma: sayfa açılır açılmaz yazılan harf girdiye gider ve kelimenin ilk kutusuna yazılır (kutu açık gelmiş olsa da), biten kelimede Enter sonrakine geçer; düğme odaktayken, rakamda ve değiştirici tuşla dokunulmaz; Shift ile yazılan büyük harf de girdiye gider', async () => {
    const page = await yeniSayfa({width: 1366, height: 768});
    await ac(page, base);
    // Düzenek: açık harfler güne göre değişir. Sıra, ilk kutusu açık gelen bir kelimeyle başlasın (yazılan ilk harf
    // o kutuya gitmeli), ardından ilk kutusu gizli gelen bir kelime gelsin: öndeki ve aradaki kelimeler yarına
    // ertelenir (enAzBosluk gibi), sonra sayfa yenilenir. Yeni açılan sayfada odak yine gövdededir.
    const ertelenen = await page.evaluate(() => {
      const O = window.YDS.OyunHesap, Il = window.YDS.Ilerleme, sira = window.__oyun.sira('sira', 60);
      const acikBaslar = w => O.acikKonumlar(w, 0, Il.bugun()).includes(0);
      const i = sira.findIndex(acikBaslar), j = sira.findIndex((w, k) => k > i && !acikBaslar(w));
      if (i < 0 || j < 0) return null;
      const out = sira.filter((w, k) => k < j && k !== i);
      out.forEach(w => Il.yanlis(w, 'kelime'));
      return out;
    });
    assert.ok(ertelenen, 'Düzenek: sıranın ilk 60 kelimesinde ilk kutusu açık gelen bir kelime ve ardından ilk kutusu gizli gelen bir kelime bulunamadı');
    if (ertelenen.length) { await page.reload(); await hazir(page); }
    const [w, w2] = await T(page, 'sira');
    await kelimeBekle(page, w);
    const y = tam(w);
    const kaydirma = () => page.evaluate(() => scrollY);
    const birak = () => page.evaluate(() => { document.activeElement.blur(); });
    // Yapay tuş: varsayılan işi (harfin yazılması) yoktur, yalnız dinleyicinin odağı taşıyıp taşımadığı görülür.
    const yapayTus = secenek => page.evaluate(s => { document.body.dispatchEvent(new KeyboardEvent('keydown', {bubbles: true, cancelable: true, ...s})); }, secenek);
    // Harf kutuları (ayraçlar hariç): [taban sınıf ve ekleri, metin].
    const kutular = g => g.hucreler.filter(h => h.s !== 'ayrac').map(h => [h.s, h.c]);
    let g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.deger, await kaydirma()], ['BODY', '', 0], 'Düzenek: yeni açılan sayfada odak gövdede');
    const taze = kutular(g);
    assert.ok(taze[0][0].startsWith('sabit') && taze.some(k => k[0].startsWith('bos')), 'Düzenek: kelimenin ilk kutusu açık geldi, gizli harfi de var (' + w + ': ' + JSON.stringify(taze) + ')');
    // Bitmemiş kelimede odaksız Enter, rakam ve noktalama hiçbir şey yapmaz.
    await page.keyboard.press('Enter');
    await page.keyboard.press('5');
    await page.keyboard.press('.');
    g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.deger, g.durum, g.gonder], ['BODY', '', '', 'Kontrol et'], 'Enter, rakam ve nokta odağı taşımaz');
    // Tıklamadan yazılan ilk harf kelimenin ilk kutusuna gider: kutu açık gelmiş olsa da atlanmaz, harf ilk gizli
    // kutuya düşmez. Açık kutu kendi harfiyle yazılmış görünür, sıra ikinci kutuya geçer, gizli kutular boş kalır.
    await page.keyboard.press(y[0]);
    g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.deger], ['oyunGirdi', y[0]], 'İlk harf odağı girdiye taşır ve yazılır');
    assert.deepEqual(kutular(g), taze.map(([s, c], i) => [s.split(' ')[0] + (i === 0 ? ' yazildi' : '') + (i === 1 ? ' simdi' : ''), c]),
      'Odaksız yazılan ilk harf kelimenin ilk kutusunda (açık kutu atlanmaz); sıra ikinci kutuda, gizli kutular boş');
    assert.equal(await kaydirma(), 0, 'Odak taşınırken sayfa kaymaz');
    // Kelimenin kalanı (açık harfler dahil) aynı yoldan yazılır.
    await page.keyboard.type(y.slice(1));
    g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.deger], ['oyunGirdi', y], 'Kelimenin tamamı girdiye yazıldı');
    assert.equal(g.hucreler.map(h => h.c).join(''), w.toLowerCase());
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
    const y2 = tam(w2);
    assert.ok(g.hucreler[0].s.startsWith('bos'), 'Düzenek: bu kelimenin ilk kutusu gizli (' + w2 + ': ' + JSON.stringify(kutular(g)) + ')');
    // Bir düğme odaktayken harf ona aittir: girdi boş kalır, odak yerinde.
    await page.locator('.oyun-mod [data-mod="yeni"]').focus();
    await page.keyboard.press(y2[0]);
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
    // Shift değiştirici sayılmaz, büyük harf de harftir: gerçek Shift+harf odağı girdiye taşır ve harf yazılır
    // (küçük harfe çevrilir). Sonra girdi boşaltılır, odak bırakılır.
    g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.deger], ['BODY', ''], 'Düzenek: odak gövdede, girdi boş');
    await page.keyboard.press('Shift+' + y2[0].toUpperCase());
    g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.deger], ['oyunGirdi', y2[0]], 'Odak yokken Shift ile yazılan büyük harf girdiye gider');
    assert.deepEqual(kutular(g)[0], ['bos yazildi', y2[0]], 'Yazılan harf kelimenin ilk kutusunda (gizli kutu), küçük harfle görünür');
    await page.keyboard.press('Backspace');
    assert.equal((await T(page, 'gorunum')).deger, '', 'Düzenek: girdi yeniden boş');
    await birak();
    // <main> (atlama bağlantısının hedefi) odaktayken de yazılan harf girdiye gider; aşağı kaydırılmış
    // sayfada odak taşınırken sayfa kaymaz.
    await page.evaluate(() => { document.getElementById('icerik').focus({preventScroll: true}); window.scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'}); });
    const asagi = await kaydirma();
    assert.ok(asagi > 0, 'Düzenek: sayfa aşağı kaydırıldı');
    await yapayTus({key: y2[0]});
    assert.deepEqual([(await T(page, 'gorunum')).odak, await kaydirma()], ['oyunGirdi', asagi], 'Odak girdiye geçti, sayfa kaymadı');
    await page.evaluate(() => { document.getElementById('icerik').focus({preventScroll: true}); });
    await page.keyboard.press(y2[0]);
    g = await T(page, 'gorunum');
    assert.deepEqual([g.odak, g.deger], ['oyunGirdi', y2[0]], '<main> odaktayken yazılan harf girdiye gider');
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
    // (ya da istenirse 'bulut': eşitlemenin indirdiği değişiklik) kaynaklı olay gelir.
    const disarida = (kelimeler, islem, kaynak = 'sekme') => page.evaluate(([kelimeler, islem, kaynak]) => {
      kelimeler.forEach(w => window.YDS.Ilerleme[islem](w, 'kelime'));
      window.dispatchEvent(new CustomEvent('yds-depo-degisti', {detail: {anahtarlar: ['yds-leitner'], kaynak}}));
    }, [kelimeler, islem, kaynak]);
    // b) Sonraki kartlardan biri başka yerde yanıtlanır: sayaç bir azalır, ekrandaki kart değişmez,
    //    deste dolaşılırken o kelime bir daha gelmez.
    const giden = deste[3];
    await disarida([giden], 'dogru');
    await sayacBekle('1 / ' + (n - 1));
    assert.equal((await kart()).on, deste[0], 'Ekrandaki kart yerinde');
    deste = deste.filter(w => w !== giden);
    assert.deepEqual(await dolas(n - 1), deste, 'Kalan kartlar aynı sırada; yanıtlanan kelime yok');
    // c) Ekrandaki karttan ÖNCEKİ bir kart düşer: ekrandaki kart aynı kalır, sırası bir geri kayar.
    //    Değişiklik bu kez buluttan gelir (kaynak 'bulut'): deste onu da başka sekmeninki gibi işler.
    await page.locator('#sonraki').click(); await page.locator('#sonraki').click();
    await sayacBekle('3 / ' + (n - 1));
    await disarida([deste[0]], 'yanlis', 'bulut');
    await desteBeklenen(sayacBekle('2 / ' + (n - 2)), 'Buluttan gelen değişiklik (kaynak "bulut") de kartı desteden düşürür: sayaç 2 / ' + (n - 2) + ' olmalı');
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

  /* ---------- Gerçek eşitleme motoruyla açılış birleşimi ---------- */
  senaryo('Gerçek eşitleme motoru: SDK inerken verilen cevap birleşim işlemi bitene dek bekletilir; başka cihazın yazdığı kayıt birleşimden sonra yerelde de bulutta da olduğu gibi kalır, cevap işlenmez ve yeni açılışta notla bildirilir, sayfa bir kez yenilenir', async () => {
    // Gerçek esitleme-v2.js, depodaki sahte Firebase SDK'sıyla koşar; saat gerçektir (motor ve sahte SDK
    // zamanlayıcılarla çalışır). Bulutta sıranın ilk kelimesini başka bir cihaz ("telefon") 3. kutuya yazmıştır,
    // yerel profil boştur. Kelime birleşimden önce işlenseydi boş ilerlemeyle hesaplanan cevap daha yeni
    // damgayla telefonun kaydını ezerdi. Makineyle yarışılmaz: önce SDK isteği, sonra birleşim işlemi açık
    // tutulur; her biri ancak "cevap hâlâ bekliyor, hiçbir şey yazılmadı" görüldükten sonra bırakılır.
    const BIRLESIM_BITTI = '(birleşim işlemi bitti)';
    const context = await yeni();
    await context.addInitScript(birlesimBitti => {
      if (!/\/oyunlar\.html$/.test(location.pathname)) return;
      try { localStorage.setItem('yds-bulut-etkin', 'true'); } catch (e) { /* depo kapalıysa motor kapalı kalır */ }
      // Birleşim kayıt getirince motor sayfayı yeniler. Yükleme sayısı ile her yüklemenin motor durumları,
      // durum satırı iletileri ve ömrü oturum deposunda tutulur (yenilemeden sonra da okunabilsin).
      const oku = () => { try { return JSON.parse(sessionStorage.getItem('__kapiIz')) || {}; } catch (e) { return {}; } };
      const yaz = iz => sessionStorage.setItem('__kapiIz', JSON.stringify(iz));
      const ilk = oku(), no = window.__kapiYukleme = (ilk.yukleme || 0) + 1;
      ilk.yukleme = no;
      // Motor sayfayı yenilerken oturum deposuna bir iz yazar (main.js, yenidenYukle): yüklemenin başındaki hâli.
      ilk['yenilemeIzi' + no] = sessionStorage.getItem('yds-son-yeniden-yukleme');
      yaz(ilk);
      const ekle = (alan, deger) => { const iz = oku(); (iz[alan + no] = iz[alan + no] || []).push(deger); yaz(iz); };
      window.addEventListener('yds-esitleme-durumu', olay => ekle('durumlar', olay.detail && olay.detail.durum));
      // Sahte bulut, açılış birleşiminin işlemi bittiği anda durum dizisine bu işareti koyar (aşağıda, bulutEki).
      window.__kapiBirlesimBitti = () => ekle('durumlar', birlesimBitti);
      document.addEventListener('DOMContentLoaded', () => {
        const el = document.getElementById('oyunDurum');
        let son = '';
        new MutationObserver(() => {
          if (el.textContent === son) return;
          son = el.textContent;
          ekle('iletiler', son);
        }).observe(el, {childList: true, characterData: true, subtree: true});
      });
      window.addEventListener('pagehide', () => { const iz = oku(); iz['omur' + no] = Math.round(performance.now()); yaz(iz); });
    }, BIRLESIM_BITTI);
    // Sahte bulut bellektedir, her belgeyle yeniden doğar. Gerçek bulut gibi kalıcı olsun diye her işlemden sonra
    // oturum deposuna kopyalanır ve sonraki yüklemede oradan kurulur; ilk yüklemede telefonun kayıtları konur
    // (belge biçimi tools/browser-qa.js'teki "uzaktanYaz" ile aynı). Sahte SDK betiğinin sonuna eklenir.
    const bulutEki = tohum => '\n;(' + String(function (tohum, yol) {
      var q = window.__qaBulut, M = window.YDS.EsitlemeMotoru, db = window.firebase.firestore(), asil = db.runTransaction;
      var onceki = sessionStorage.getItem('__kapiBulut'), tutulacak = !onceki;
      function sakla() {
        var yollar = {}, belgeler = {};
        yollar[yol] = 1;
        q.islemler.forEach(function (i) { i.okunan.forEach(function (y) { yollar[y] = 1; }); });
        Object.keys(yollar).forEach(function (y) { if (q.belge(y) !== undefined) belgeler[y] = q.belge(y); });
        sessionStorage.setItem('__kapiBulut', JSON.stringify(belgeler));
      }
      // Gerçek Firestore işlemi ağ kadar sürer; sahtesi mikro görevde biter ve birleşimden önce açılan bir kapının
      // yazdığı bayat cevap (yazım bir kare sonradır) birleşime yetişemez, hata görünmez kalırdı. İlk yüklemenin
      // birleşim işlemi bu yüzden senaryo bırakana dek açık tutulur; bittiği an durum dizisine işaretlenir.
      db.runTransaction = function (calistir) {
        var kapak = Promise.resolve(), ilkBirlesim = tutulacak;
        tutulacak = false;
        if (ilkBirlesim) kapak = new Promise(function (coz) { window.__kapiBirlesimiBirak = coz; });
        return kapak.then(function () { return asil.call(db, calistir); }).then(function (s) {
          sakla();
          if (ilkBirlesim) window.__kapiBirlesimBitti();
          return s;
        });
      };
      if (onceki) {
        onceki = JSON.parse(onceki);
        Object.keys(onceki).forEach(function (y) { q.yaz(y, onceki[y]); });
        return;
      }
      var zarf = M.kayitlariYaz({surum: 2, alanlar: {}}, 'yds-leitner', tohum.kayitlar, function () { return tohum.damga; });
      q.yaz(yol, {surum: 3, anahtar: 'yds-leitner', zaman: tohum.zaman, json: M.bulutAlanJson('yds-leitner', zarf.alanlar['yds-leitner'])});
      sakla();
    }) + ')(' + JSON.stringify(tohum) + ', ' + JSON.stringify(BULUT_LEITNER_BELGESI) + ');';
    let tohum = null, birak, istendi;
    const kapak = new Promise(coz => { birak = coz; }), ilkIstek = new Promise(coz => { istendi = coz; });
    await context.route('https://www.gstatic.com/firebasejs/**', async route => {
      const ad = route.request().url().split('/').pop();
      istendi(ad);
      await kapak;
      await route.fulfill({contentType: 'text/javascript',
        body: (SAHTE_FIREBASE[ad] || 'throw new Error("beklenmeyen Firebase dosyası")') + (ad === 'firebase-firestore-compat.js' ? bulutEki(tohum) : '')}).catch(() => {});
    });
    const page = await context.newPage();
    // "load" olayı açık tutulan SDK isteğini beklerdi; sayfa, DOM hazır olunca kullanılır.
    await page.goto(base + '/oyunlar.html', {waitUntil: 'domcontentloaded'});
    await hazir(page);
    assert.equal(await sureli(ilkIstek, 15000, 'Düzenek: eşitleme açıkken motor 15 sn içinde Firebase SDK\'sını istemedi'), 'firebase-app-compat.js',
      'Düzenek: motor SDK\'yı indirmeye başladı, ilk dosyanın isteği açık bekliyor');
    const sinir = await betikSabiti(page, 'ESITLEME_BEKLEME_MS');
    assert.ok(sinir >= 3000, 'Düzenek: oyunlar.js içindeki ESITLEME_BEKLEME_MS okunamadı ya da 3 sn\'den kısa (' + sinir + ')');
    const [w1, w2, w3] = await T(page, 'sira');
    await kelimeBekle(page, w1);
    // Telefon bir saat önce yazdı: ilk kelime 3. kutuda (iki gün önce çalışıldı, beş gün sonra sorulacak),
    // sonraki iki kelime 1. kutuda.
    tohum = await page.evaluate(kelimeler => {
      const Il = window.YDS.Ilerleme, b = Il.bugun(), zaman = Date.now() - 60 * 60 * 1000, kayitlar = {};
      kelimeler.forEach((w, i) => { kayitlar[Il.ilerlemeKimligi(w, 'kelime')] = i ? {k: 1, g: b + 1, c: b - 1} : {k: 3, g: b + 5, c: b - 2}; });
      return {kayitlar, zaman, damga: zaman + ':telefon', ilk: {k: 3, g: b + 5, c: b - 2}};
    }, [w1, w2, w3]);
    await T(page, 'yazimlariSay');
    await coz(page, w1);
    const ileti = await ilkIleti(page);
    const once = await page.evaluate(w => ({
      gecen: Math.round(performance.now()), durumlar: window.__esitlemeDurumlari.slice(),
      kayit: window.__oyun.leitnerDepoKaydi(w), yazilan: window.__oyun.yazilan(), bugunku: window.__oyun.bugunku()
    }), w1);
    // Bekleme sayfa açılışından sınır kadar sonra kendiliğinden biter; o kadar yavaş bir makinede senaryo bir şey söylemez.
    assert.ok(once.gecen < sinir, 'Düzenek: sayfa açılışından cevaba ' + once.gecen + ' ms geçti, bekleme üst sınırı (' + sinir + ' ms) doldu; makine bu senaryo için fazla yavaş');
    assert.equal(ileti, BEKLE_KONTROL, 'SDK inerken verilen cevap bekletilir (eski ilerlemeyle hemen işlenmez)');
    assert.deepEqual([once.kayit, once.yazilan, once.bugunku], [null, [], {t: 0, d: 0, y: 0}], 'Beklerken ilerlemeye ve günlük sayaca hiçbir şey yazılmadı');
    assert.deepEqual(once.durumlar, ['kapali', 'yukleniyor'], 'SDK inerken motor önce "kapali", sonra "yukleniyor" bildirmiştir');
    // Beklenen an hiç gelmezse zaman aşımı, neyin beklendiğini söyleyen iletiyle bildirilir.
    const bekle = (kosul, ileti) => page.waitForFunction(kosul).catch(h => { throw new Error(ileti + ' (' + String(h && h.message).split('\n')[0] + ')'); });
    // SDK iner, oturum bağlanır, motor birleşim işlemini başlatır; işlem sahte bulutta açık bekler (gerçek
    // Firestore'daki ağ gecikmesi). Kapı bu sırada da kapalıdır: cevap hâlâ bekler.
    birak();
    await bekle(() => !!window.__kapiBirlesimiBirak, 'SDK indi ama motor açılış birleşimini başlatmadı');
    const arada = await page.evaluate(w => ({
      gecen: Math.round(performance.now()), durumlar: window.__esitlemeDurumlari.slice(),
      durum: document.getElementById('oyunDurum').textContent, kayit: window.__oyun.leitnerDepoKaydi(w), yazilan: window.__oyun.yazilan()
    }), w1);
    assert.ok(arada.gecen < sinir, 'Düzenek: sayfa açılışından birleşim işlemine ' + arada.gecen + ' ms geçti, bekleme üst sınırı (' + sinir + ' ms) doldu; makine bu senaryo için fazla yavaş');
    assert.deepEqual([arada.durum, arada.kayit, arada.yazilan], [BEKLE_KONTROL, null, []],
      'Oturum bağlandı, birleşim işlemi sürüyor: cevap hâlâ bekliyor, ilerlemeye yazılmadı (motorun o ana dek bildirdikleri: ' + arada.durumlar.join(', ') + ')');
    // Kapı yine de erken açılmış olsaydı işlenen cevabın yazımı bir kare sonraya kurulmuş olurdu. Birleşim, gerçek
    // Firestore'daki gibi o yazımdan sonra bitsin diye işlem bir kare daha tutulup bırakılır: aşağıdaki kayıt
    // denetimleri erken açılan kapıyı kendi başlarına da yakalar.
    await page.evaluate(() => new Promise(coz => requestAnimationFrame(() => setTimeout(() => { window.__kapiBirlesimiBirak(); coz(); }, 0))));
    // Birleşim telefonun kayıtlarını getirir: motor sayfayı yeniler.
    await bekle(() => window.__kapiYukleme >= 2, 'Birleşim buluttan kayıt getirdi ama sayfa yeniden yüklenmedi');
    await hazir(page);
    await page.waitForFunction(() => !!window.__qaBulut && window.YDS.Esitleme.oturumDurumu().hazir);
    const son = await page.evaluate(([w, yol]) => ({
      iz: JSON.parse(sessionStorage.getItem('__kapiIz')),
      yerel: window.__oyun.leitnerDepoKaydi(w), bulut: window.__oyun.bulutLeitnerKaydi(yol, w), bugunku: window.__oyun.bugunku(),
      kart: !document.getElementById('oyunKart').hidden, durum: document.getElementById('oyunDurum').textContent
    }), [w1, BULUT_LEITNER_BELGESI]);
    assert.ok(son.iz.omur1 < sinir, 'Düzenek: ilk yükleme ' + son.iz.omur1 + ' ms sürdü, bekleme üst sınırı (' + sinir + ' ms) doldu; makine bu senaryo için fazla yavaş');
    assert.deepEqual(son.yerel, tohum.ilk, 'Başka cihazın yazdığı kayıt (3. kutu) yerelde korunur: birleşimden önce verilen cevap üzerine yazmadı');
    assert.deepEqual(son.bulut, {v: tohum.ilk, m: tohum.damga}, 'Buluttaki kayıt başka cihazın yazdığı gibi kaldı (3. kutu, onun damgası)');
    assert.deepEqual(son.bugunku, {t: 0, d: 0, y: 0}, 'Bekletilen cevap günlük sayaca da yazılmadı');
    // İlk yüklemenin bütün durumları: "kapali", sonra "yukleniyor" ile başlayan kesintisiz bir "sürüyor" dizisi.
    // Birleşim işlemi bitene dek bitiş anlamına gelen hiçbir durum (kapı o anda açılırdı) bildirilmez; işlem
    // bittikten sonra yalnız "hazir" gelebilir (dinleyicinin ilk görüntüsü yenilemeden önce ulaşırsa).
    const BITIS = ['kapali', 'hazir', 'hata', 'silindi'], ilkDurumlar = son.iz.durumlar1 || [], bitis = ilkDurumlar.indexOf(BIRLESIM_BITTI);
    assert.ok(bitis > 0, 'Düzenek: ilk yüklemede birleşim işleminin bittiği an kaydedilmedi: ' + JSON.stringify(ilkDurumlar));
    assert.deepEqual([ilkDurumlar.slice(0, 2), ilkDurumlar.slice(1, bitis).filter(d => BITIS.includes(d)), ilkDurumlar.slice(bitis + 1).filter(d => d !== 'hazir')], [['kapali', 'yukleniyor'], [], []],
      'İlk yüklemede motor "kapali", "yukleniyor" ile başlar, birleşim işlemi bitene dek bitiş durumu bildirmez, sonra yalnız "hazir" bildirir: ' + JSON.stringify(ilkDurumlar));
    // Birleşim tam bekleyen kelimenin kaydını değiştirdi: cevap, olaylar hangi sırayla gelirse gelsin işlenmez.
    // "hazir" yenilemeden önce ulaşırsa ilk yükleme bunu kendi iletisiyle söyler (sonuç iletisi bir an bile
    // görünmez); ulaşmazsa bekleme iletisi yenilemeye dek kalır. Her iki sırada yeni açılış notla bildirir.
    const iletiler = son.iz.iletiler1 || [];
    assert.deepEqual([iletiler[0], iletiler.filter(m => m !== BEKLE_KONTROL && m !== KAYIT_DEGISTI_NOTU)], [BEKLE_KONTROL, []],
      'İlk yüklemede bekletilen cevap işlenmiş gibi gösterilmez (sonuç iletisi bir an bile görünmez): ' + JSON.stringify(iletiler));
    assert.deepEqual([son.kart, son.durum], [true, YARIM_BEKLEME_NOTU],
      'Bekletilen cevap işlenmedi: yeni açılış bunu notla bildirir (ilk yüklemenin iletileri: ' + JSON.stringify(iletiler) + ')');
    const hazirOnce = iletiler.includes(KAYIT_DEGISTI_NOTU);
    // Sayfa tam bir kez yenilenir: ikinci yüklemenin birleşimi yeni bir şey getirmez. Motor yenilemeyi istedikten
    // 100 ms sonra yapar ve o anda oturum deposundaki yenileme izini yazar (main.js). İkinci yüklemenin birleşimi
    // bittiğine göre (oturum hazır) yeni bir yenileme istenmişse zamanlayıcısı çoktan kuruludur ve sayfada şimdi
    // kurulan daha uzun zamanlayıcıdan önce çalışır; bu yüzden sonuç makinenin hızına bağlı değildir.
    assert.ok(son.iz.yenilemeIzi2, 'Düzenek: ikinci yükleme motorun yenileme iziyle (oturum deposunda "yds-son-yeniden-yukleme") başlamadı; izin adı değiştiyse aşağıdaki denetim güncellenmeli');
    const sonra = await page.evaluate(() => new Promise(coz => setTimeout(() => coz({
      yukleme: window.__kapiYukleme,
      yeniYenileme: sessionStorage.getItem('yds-son-yeniden-yukleme') !== JSON.parse(sessionStorage.getItem('__kapiIz')).yenilemeIzi2
    }), 150))).catch(() => ({yukleme: 'beklerken sayfa yeniden yüklendi', yeniYenileme: true}));
    assert.deepEqual(sonra, {yukleme: 2, yeniYenileme: false}, 'Birleşim buluttan kayıt getirdi: sayfa tam bir kez yeniden yüklendi (ikinci yüklemede yeni yenileme istenmedi)');
    return 'ilk kelime ' + w1 + '; bekletilen cevap işlenmedi, yeni açılışta not gösterildi (' +
      (hazirOnce ? '"hazir" yenilemeden önce ulaştı' : 'yenileme "hazir"dan önce geldi') + '); ilk yükleme ' + son.iz.omur1 + ' ms';
  });

  /* ---------- Kelimeler destesi: tekrar kartları ---------- */
  senaryo('Kelimeler destesi, tekrar kartlarıyla: vadesi gelen kart destededir (vadesi gelmeyen ve öğrenilen değildir), oyunda yanıtlanınca düşer, "Bildim" ile yazılır ve 2. kutuya çıkar; son cevap kalan kartları başka yerde yanıtlanmış bulursa (olay ulaşmadan) bitiş iletisi kalır', async () => {
    const context = await yeni();
    const oyun = await context.newPage();
    await oyun.clock.setFixedTime(GUN(0));
    await ac(oyun, base);
    // Düzenek (0. gün): günlük yeni kart hedefi 5 (seçeneklerin en küçüğü: deste kısa olur). Oyunda sorulan
    // Çekirdek kelimelerinden üçü bir kez bilindi (1. kutu, vadesi yarın), biri iki kez (2. kutu, vadesi
    // üç gün sonra), biri öğrenildi (5. kutu).
    const f = await oyun.evaluate(() => {
      const Il = window.YDS.Ilerleme, ws = window.__oyun.havuz([2]).slice(0, 5).map(d => d.e);
      Il.gunlukHedefAyarla(5);
      ws.slice(0, 4).forEach(w => Il.dogru(w, 'kelime'));
      Il.dogru(ws[3], 'kelime');
      Il.zatenBiliyorum(ws[4], 'kelime');
      return {vadeli: ws.slice(0, 3), erken: ws[3], ogrenilen: ws[4], hedef: Il.gunlukHedef(), tavan: Il.gunlukTavan(),
        aralik: Il.ARALIK[2], kutular: ws.map(w => Il.kutu(w, 'kelime'))};
    });
    assert.deepEqual(f.kutular, [1, 1, 1, 2, 5], 'Düzenek: üç kelime 1. kutuda, biri 2. kutuda, biri öğrenildi');
    await oyun.clock.setFixedTime(GUN(1));
    const page = await context.newPage();
    await kelimelerAc(page, base);
    const bugun = await T(page, 'bugun');
    await page.locator('#desteBasla').click();
    let k = await T(page, 'desteGor');
    const n = Number(k.sayac.split(' / ')[1]);
    assert.ok(k.alan && k.sayac === '1 / ' + n, 'Düzenek: deste açıldı (' + k.sayac + ')');
    // a) Destenin içeriği: vadesi gelen üç kelime var; vadesi gelmeyen ve öğrenilen yok.
    let deste = await desteDolas(page, n);
    assert.equal(new Set(deste).size, n, 'Düzenek: destede ' + n + ' ayrı kelime');
    assert.deepEqual(f.vadeli.filter(w => !deste.includes(w)), [], 'Vadesi gelen kartlar destede (' + n + ' kartlı deste: ' + deste.join(', ') + ')');
    assert.deepEqual([f.erken, f.ogrenilen].filter(w => deste.includes(w)), [], 'Vadesi gelmeyen (2. kutu) ve öğrenilen kelime destede yok');
    assert.equal(n, 3 + Math.min(f.hedef, f.tavan - 3), 'Düzenek: deste üç tekrar ve günlük hedef kadar yeni karttan oluşur');
    // b) Oyun (öbür sekme) vadesi gelen kelimelerden birini sorar; orada bilinir, 2. kutuya çıkar. Depolama
    //    olayı kendiliğinden gelir: kart desteden düşer, kalanlar aynı sırada durur.
    await oyun.reload(); await hazir(oyun);
    const [oyunda] = await T(oyun, 'sira');
    assert.ok(f.vadeli.includes(oyunda), 'Düzenek: oyunun 1. gündeki ilk kelimesi (' + oyunda + ') vadesi gelenlerden');
    await kelimeBekle(oyun, oyunda);
    await coz(oyun, oyunda);
    await kutuBekle(oyun, oyunda, 2);
    await page.bringToFront();
    deste = deste.filter(w => w !== oyunda);
    await desteBeklenen(page.waitForFunction(m => document.getElementById('kartSayac').textContent === m, '1 / ' + (n - 1)),
      'Oyunda bilinen (2. kutuya çıkan) tekrar kartı desteden düşer: sayaç 1 / ' + (n - 1) + ' olmalı');
    assert.deepEqual(await desteDolas(page, n - 1), deste, 'Oyunda yanıtlanan tekrar kartı desteden düştü; kalanlar aynı sırada');
    // c) Ekrandaki tekrar kartı olağan yoldan yanıtlanır: yazılır, 2. kutuya çıkar, yeni kelime sayılmaz.
    const [bildimKarti, sonKart] = f.vadeli.filter(w => w !== oyunda);
    await desteKartaGit(page, bildimKarti);
    assert.equal((await T(page, 'desteGor')).kutu, '1. kutu · tekrar zamanı', 'Düzenek: ekranda vadesi gelmiş bir tekrar kartı');
    const gunlukOnce = await T(page, 'bugunku');
    await page.locator('#bildim').click();
    k = await T(page, 'desteGor');
    deste = deste.filter(w => w !== bildimKarti);
    assert.equal(k.sayac.split(' / ')[1], String(n - 2), 'Vadesi gelen kart "Bildim" ile yanıtlanır ve desteden çıkar (sayaç: ' + k.sayac + ')');
    assert.deepEqual(await T(page, 'desteDepo', [bildimKarti]), [{k: 2, g: bugun + f.aralik, c: bugun}], 'Tekrar kartı 2. kutuya çıktı; sonraki tekrar ' + f.aralik + ' gün sonra');
    const gunlukSonra = await T(page, 'bugunku');
    assert.deepEqual([gunlukSonra.t, gunlukSonra.d, gunlukSonra.y], [gunlukOnce.t + 1, gunlukOnce.d + 1, gunlukOnce.y], 'Tekrar cevabı günlük sayaçlara yazıldı; yeni kelime sayılmadı');
    // d) Son tekrar kartı ekrandayken destenin geri kalanı öbür sayfada yanıtlanır; depolama olayı bu sayfaya
    //    ulaşmaz. Ekrandaki kartın cevabı yazılır, ardından gelen kart çizimi kalanların hepsini düşürür:
    //    deste cevabın içinde biter ve bitiş iletisi yerinde kalır (liste sayacı üzerine yazılmaz).
    await desteKartaGit(page, sonKart);
    await page.evaluate(() => { window.__depolamaOlayiYok = true; });
    const kalanlar = deste.filter(w => w !== sonKart);
    await oyun.evaluate(ws => ws.forEach(w => window.YDS.Ilerleme.dogru(w, 'kelime')), kalanlar);
    await desteDepoBekle(oyun, page, kalanlar);
    k = await T(page, 'desteGor');
    const bellekteGuncel = await page.evaluate(ws => ws.filter(w => window.YDS.Ilerleme.kutu(w, 'kelime') !== 0), kalanlar);
    assert.deepEqual([k.on, k.sayac.split(' / ')[1], bellekteGuncel], [sonKart, String(n - 2), []],
      'Düzenek: olay ulaşmadı; kart ve sayaç yerinde, öbür sayfada yanıtlanan ' + kalanlar.length + ' kart bellekteki kopyada hâlâ "hiç çalışılmadı"');
    await page.locator('#bildim').click();
    k = await T(page, 'desteGor');
    assert.deepEqual(await T(page, 'desteDepo', [sonKart]), [{k: 2, g: bugun + f.aralik, c: bugun}], 'Ekrandaki son kartın cevabı yazılır (öbür kartların başka yerde yanıtlanması onu engellemez)');
    assert.deepEqual([k.alan, k.liste, k.mod], [false, true, 'Kart moduna geç'], 'Son cevapla deste biter, liste görünümüne dönülür');
    assert.equal(k.durum, DESTE_BITTI, 'Deste cevabın içinde boşalınca bitiş iletisi kalır (liste sayacı üzerine yazılmaz)');
    // Bitiş iletisi dururken gelen dışarıdan değişiklik deste özetini yeniler ama liste sayacını iletinin yerine yazmaz.
    await page.evaluate(() => { window.__depolamaOlayiYok = false; window.__oyun.depoDegisti(['yds-leitner'], 'sekme'); });
    assert.equal((await T(page, 'desteGor')).durum, DESTE_BITTI, 'Bitiş iletisi dururken gelen dışarıdan değişiklik liste sayacını onun yerine yazmaz');
    return n + ' kartlı deste (3 tekrar); oyunda yanıtlanan tekrar: ' + oyunda;
  });

  /* ---------- Kelimeler destesi: birikmiş tekrarları dağıtma ---------- */
  senaryo('Kelimeler destesi açıkken "Birikmiş tekrarları günlere dağıt": sonuç notu görünür, deste bugünün vadesinden yeniden kurulur (sayaç tavanı gösterir), ekrandaki kartın cevabı yazılır', async () => {
    const context = await yeni();
    const page = await context.newPage();
    const onaylar = [];
    page.on('dialog', async d => { onaylar.push(d.type()); await d.accept(); });
    await page.clock.setFixedTime(GUN(0));
    await kelimelerAc(page, base);
    // Düzenek (0. gün): günlük toplam kart tavanı en küçük seçenekte; tavandan 45 fazla Çekirdek kelimesi bir
    // kez bilindi. İki gün sonra hepsinin vadesi geçmiştir; tavana sığmayan 45 tekrar "günlere dağıt"
    // düğmesini getirir (düğme 40 ve üstünde çıkar).
    const f = await page.evaluate(() => {
      const Il = window.YDS.Ilerleme;
      const tavan = Math.min(...[...document.getElementById('gunlukTavan').options].map(o => Number(o.value)));
      Il.gunlukTavanAyarla(tavan);
      const ws = window.__oyun.desteHavuz([2]).slice(0, tavan + 45);
      ws.forEach(w => Il.dogru(w, 'kelime'));
      return {tavan, adet: ws.length, aralik: Il.ARALIK[2]};
    });
    await page.clock.setFixedTime(GUN(2));
    await page.reload(); await kelimelerHazir(page);
    await yeniKotasiniDoldur(page, 2);
    const bugun = await T(page, 'bugun');
    let k = await T(page, 'desteGor');
    assert.ok(k.dagit && k.dugme === 'Bugünü çalış (' + f.tavan + ' kart)',
      'Düzenek: ' + f.adet + ' gecikmiş tekrar ve ' + f.tavan + ' kartlık tavanla "günlere dağıt" düğmesi görünür (' + k.dugme + '; ' + k.not + ')');
    await page.locator('#desteBasla').click();
    const eski = await desteDolas(page, f.tavan);
    k = await T(page, 'desteGor');
    assert.ok(k.alan && k.sayac === '1 / ' + f.tavan && new Set(eski).size === f.tavan, 'Düzenek: tavan kadar kartlı tekrar destesi açıldı (' + k.sayac + ')');
    // Dağıtımın bugünde bırakmayacağı bir kart ekrana getirilir ve çevrilir: kullanıcı cevabına bakmıştır.
    const [tasinacak] = await T(page, 'desteTasinacak', eski, f.tavan);
    assert.ok(tasinacak, 'Düzenek: açık destede, dağıtımın ileri bir güne alacağı kart yok (dağıtımın sırası değişmiş olabilir)');
    await desteKartaGit(page, tasinacak);
    await page.locator('#kart').click();
    assert.equal((await T(page, 'desteGor')).arka, true, 'Düzenek: kart çevrildi');
    await page.locator('#yigiiniDagit').click();
    assert.deepEqual(onaylar, ['confirm'], 'Düzenek: dağıtım bir kez onay sordu');
    const vadeliler = await T(page, 'desteVadeliler', [2]);
    assert.deepEqual([vadeliler.length, vadeliler.includes(tasinacak)], [f.tavan, false],
      'Düzenek: dağıtım bugüne tavan kadar tekrar bıraktı, çevrilen kartı (' + tasinacak + ') ileri bir güne aldı');
    k = await T(page, 'desteGor');
    assert.equal(k.not, (f.adet - f.tavan) + ' tekrar ileriki günlere yayıldı; yığın ' + Math.ceil(f.adet / f.tavan) + ' günde erir.', 'Dağıtımdan sonra sonuç notu görünür');
    assert.deepEqual([k.alan, Number(k.sayac.split(' / ')[1])], [true, f.tavan], 'Dağıtımdan sonra deste açık kalır; sayaç tavanı gösterir, eski desteden kalanı değil (' + k.sayac + ')');
    // Ekrandaki kart "Bildim" ile yanıtlanır: cevap yazılır (deste yeniden kurulmasaydı ekranda, tarihi ileri
    // alınmış eski kart kalır, cevabı sessizce atlanırdı).
    const ekrandaki = k.on, [kayitOnce] = await T(page, 'desteDepo', [ekrandaki]), gunlukOnce = await T(page, 'bugunku');
    assert.ok(kayitOnce, 'Dağıtımdan sonra ekrandaki kart (' + ekrandaki + ') daha önce çalışılmış bir tekrar kartıdır (hiç çalışılmamış kart değil)');
    await page.locator('#bildim').click();
    assert.equal((await T(page, 'bugunku')).t, gunlukOnce.t + 1, 'Dağıtımdan sonra ekrandaki kartın (' + ekrandaki + ') "Bildim" cevabı yazılır: günlük toplam bir artar');
    assert.deepEqual(await T(page, 'desteDepo', [ekrandaki]), [{k: kayitOnce.k + 1, g: bugun + f.aralik, c: bugun}], 'Yanıtlanan kelime bir üst kutuya çıkar');
    // Yeniden kurulan deste bugün vadesi gelen kartlardır: yanıtlanan kart ve kalanlar, depodaki bugünün
    // vadelileriyle aynı kümedir; turda hiçbir kart düşmez.
    k = await T(page, 'desteGor');
    assert.equal(k.sayac, '1 / ' + (f.tavan - 1), 'Cevaptan sonra destede tavanın bir eksiği kadar kart kalır');
    const kalan = await desteDolas(page, f.tavan - 1);
    assert.deepEqual(desteSirali([ekrandaki, ...kalan]), desteSirali(vadeliler), 'Deste dağıtımdan sonra bugün vadesi gelen kartlardan kuruldu');
    assert.equal((await T(page, 'desteGor')).sayac, '1 / ' + (f.tavan - 1), 'Tam turda hiçbir kart düşmedi');
    return f.adet + ' gecikmiş tekrar, tavan ' + f.tavan + '; çevrilen kart: ' + tasinacak + ', yanıtlanan: ' + ekrandaki;
  });

  /* ---------- Kelimeler destesi: dağıtım, ekrandaki kart bugünde kalırken ---------- */
  senaryo('Kelimeler destesi açıkken "Birikmiş tekrarları günlere dağıt", ekrandaki kart bugünde kalsa da: deste bugünün vadesinden yeniden kurulur (tavan kadar kart, hiçbiri düşmez); kartların hepsi yanıtlanınca deste biter', async () => {
    const context = await yeni();
    const page = await context.newPage();
    page.on('dialog', async d => { await d.accept(); });
    // Düzenek: bir Çekirdek kelimesi bir gün önce bilinir; vadesi hepsinden eskidir, eşit vadeliler hangi
    // sırayla dizilirse dizilsin hem destenin hem dağıtımın ilk sırasındadır. Ertesi gün tavandan 45 fazla
    // kelime daha bilinir. İki gün sonra hepsinin vadesi geçmiştir; "günlere dağıt" düğmesi görünür.
    await page.clock.setFixedTime(GUN(-1));
    await kelimelerAc(page, base);
    const f = await page.evaluate(() => {
      const Il = window.YDS.Ilerleme;
      const tavan = Math.min(...[...document.getElementById('gunlukTavan').options].map(o => Number(o.value)));
      Il.gunlukTavanAyarla(tavan);
      const sonrakiler = window.__oyun.desteHavuz([2]).slice(0, tavan + 46), enEski = sonrakiler.pop();
      Il.dogru(enEski, 'kelime');
      return {tavan, enEski, sonrakiler};
    });
    await page.clock.setFixedTime(GUN(0));
    await page.evaluate(ws => ws.forEach(w => window.YDS.Ilerleme.dogru(w, 'kelime')), f.sonrakiler);
    await page.clock.setFixedTime(GUN(2));
    await page.reload(); await kelimelerHazir(page);
    await yeniKotasiniDoldur(page, 2);
    let k = await T(page, 'desteGor');
    assert.ok(k.dagit, 'Düzenek: ' + (f.sonrakiler.length + 1) + ' gecikmiş tekrar ve ' + f.tavan + ' kartlık tavanla "günlere dağıt" düğmesi görünür (' + k.dugme + '; ' + k.not + ')');
    await page.locator('#desteBasla').click();
    const eski = await desteDolas(page, f.tavan);
    assert.ok(eski.includes(f.enEski), 'En çok gecikmiş tekrar (' + f.enEski + ') destededir: tavana sığmayan tekrarlardan önce en eski vadeliler alınır (deste: ' + eski.join(', ') + ')');
    // Bugünde kalacak kart ekrandayken dağıtılır.
    await desteKartaGit(page, f.enEski);
    await page.locator('#yigiiniDagit').click();
    const vadeliler = await T(page, 'desteVadeliler', [2]);
    const ileriAlinan = eski.filter(w => !vadeliler.includes(w));
    assert.deepEqual([vadeliler.length, vadeliler.includes(f.enEski), ileriAlinan.length > 0], [f.tavan, true, true],
      'Düzenek: dağıtım bugüne tavan kadar tekrar bıraktı; ekrandaki kart (' + f.enEski + ') bugünde kaldı, eski destenin ' + ileriAlinan.length + ' kartı ileri bir güne alındı');
    // Deste yeniden kurulmasaydı ileri alınan kartlar ilk çizimde düşer, deste sessizce kısalırdı.
    const tur = await desteDolas(page, f.tavan);
    assert.deepEqual([desteSirali(tur), (await T(page, 'desteGor')).sayac], [desteSirali(vadeliler), '1 / ' + f.tavan],
      'Ekrandaki kart bugünde kalsa da deste bugünün vadesinden yeniden kurulur: tavan kadar kart, turda hiçbiri düşmez (tur: ' + tur.join(', ') + ')');
    // Yeniden kurulan destenin bütün kartları olağan yoldan yanıtlanır: her cevap yazılır, son kartın
    // cevabıyla deste biter.
    const gunlukOnce = await T(page, 'bugunku');
    for (let i = 0; i < f.tavan; i++) { await desteKart(page, 'Yeniden kurulan deste yanıtlanırken, ' + (i + 1) + '. kartta'); await page.locator('#bildim').click(); }
    assert.equal((await T(page, 'bugunku')).t, gunlukOnce.t + f.tavan,'Yeniden kurulan destenin ' + f.tavan + ' kartının cevabı da yazılır (günlük toplam)');
    k = await T(page, 'desteGor');
    assert.deepEqual([k.alan, k.liste, k.mod, k.durum], [false, true, 'Kart moduna geç', DESTE_BITTI], 'Son kart olağan yoldan yanıtlanınca deste biter: bitiş iletisi görünür, liste görünümüne dönülür');
    return (f.sonrakiler.length + 1) + ' gecikmiş tekrar, tavan ' + f.tavan + '; ekranda kalan kart: ' + f.enEski + ', eski desteden ileri alınan: ' + ileriAlinan.length;
  });

  /* ---------- Kelimeler destesi: katman değişimi, sıfırlama, geri alma ---------- */
  senaryo('Kelimeler destesi açıkken katman değişimi, sıfırlama ve geri alma desteyi olağan kart moduna çözer: süzgeçler geri gelir, sayaç bütün havuzu gösterir, cevap kartı listeden çıkarmaz', async () => {
    const context = await yeni();
    const page = await context.newPage();
    const onaylar = [];
    page.on('dialog', async d => { onaylar.push(d.type()); await d.accept(); });
    await page.clock.setFixedTime(GUN(0));
    await kelimelerAc(page, base);
    // Eklenecek katman: seçili olmayanların en az kelimelisi (indirmesi kısa sürer).
    const ek = await page.evaluate(() => {
      const V = window.YDS.Veri, s = V.katmanSayilari();
      return V.KATMANLAR.filter(k => k !== 2 && s[k] > 0).sort((a, b) => s[a] - s[b])[0];
    });
    // Çözülen destenin yerine gelen liste: iki katmanın bütün kelimeleri.
    const havuzBoyu = (await T(page, 'desteHavuz', [2, ek])).length;
    const desteAc = async etiket => {
      await page.locator('#desteBasla').click();
      const g = await T(page, 'desteGor');
      assert.deepEqual([g.alan, g.sayac.split(' / ')[0], g.suzgec], [true, '1', [false, false, false]], 'Düzenek: ' + etiket + ' deste açık, süzgeç alanları gizli');
      return g;
    };
    // Deste çözüldü mü? Olağan kart modu: süzgeçler görünür, kart ve liste sayacı bütün havuzu gösterir.
    // Yalnız DOM'a bakılır.
    const cozuldu = async (sira, etiket) => {
      const g = await T(page, 'desteGor');
      assert.deepEqual(g.suzgec, [true, true, true], etiket + ': süzgeç alanları yeniden görünür (deste çözüldü)');
      assert.deepEqual([g.alan, g.sayac], [true, sira + ' / ' + havuzBoyu], etiket + ': kart modu sürer, kart sayacı bütün havuzu gösterir');
      assert.ok(g.durum.startsWith(havuzBoyu + ' kelime · seçili katmanlarda ' + havuzBoyu + ' · '), etiket + ': liste sayacı bütün havuzu gösterir: ' + g.durum);
    };
    // Olağan modda cevap sıradaki karta geçirir, listeyi kısaltmaz (deste modu kartı listeden çıkarırdı);
    // yanıtlanan kart yerinde durur: "Önceki" ile ona dönülür.
    const cevapKisaltmaz = async (sira, etiket) => {
      const once = await T(page, 'desteGor');
      assert.equal(once.kutu, 'hiç çalışılmadı', 'Düzenek: ' + etiket + ' ekrandaki kart (' + once.on + ') hiç çalışılmamış');
      await page.locator('#bildim').click();
      let g = await T(page, 'desteGor');
      assert.ok(g.sayac === (sira + 1) + ' / ' + havuzBoyu && g.on !== once.on, etiket + ': cevap sıradaki karta geçirir, liste kısalmaz (sayaç ' + g.sayac + ', kart ' + g.on + ')');
      await page.locator('#onceki').click();
      g = await T(page, 'desteGor');
      assert.deepEqual([g.sayac, g.on, g.kutu], [sira + ' / ' + havuzBoyu, once.on, '1. kutu'], etiket + ': yanıtlanan kart listede durur');
      return once.on;
    };
    // a) Katman değişimi. Önce destede bir kart yanıtlanır: bugün yanıtlanmış bir kayıt olsun (deste modu
    //    sürseydi o kelime yeni listeden ayıklanır, sayaç havuzdan bir eksik kalırdı). Yanıtlanan kart
    //    destenin dizin sırasındaki son kelimesidir: çözülen listenin başındaki, sonraki adımlarda
    //    yanıtlanacak kartlardan biri olmasın.
    let k = await desteAc('ilk');
    const n = Number(k.sayac.split(' / ')[1]);
    assert.ok(n >= 3, 'Düzenek: destede en az üç kart var (' + k.sayac + ')');
    const ilkCevap = (await T(page, 'desteHavuz', [2]))[n - 1];
    await desteKartaGit(page, ilkCevap);
    await page.locator('#bildim').click();
    k = await T(page, 'desteGor');
    assert.equal(k.sayac.split(' / ')[1], String(n - 1), 'Düzenek: destede bir kart yanıtlandı');
    for (let i = Number(k.sayac.split(' / ')[0]); i > 1; i--) await page.locator('#onceki').click();
    assert.equal((await T(page, 'desteGor')).sayac, '1 / ' + (n - 1), 'Düzenek: destenin ilk kartına dönüldü');
    await page.locator('#katmanlar .katman[data-k="' + ek + '"]').click();
    await desteBeklenen(page.waitForFunction(m => document.getElementById('sayac').textContent.includes(m), 'seçili katmanlarda ' + havuzBoyu + ' '),
      'Düzenek: ' + ek + '. katman yüklendi, liste sayacı iki katmanın ' + havuzBoyu + ' kelimesini gösteriyor');
    await cozuldu(1, 'Katman değişimi');
    const ikinciCevap = await cevapKisaltmaz(1, 'Katman değişimi');
    // b) Sıfırlama (iki aşamalı onay kabul edilir): yeniden açılan deste sürerken basılır.
    await desteAc('sıfırlamadan önce');
    await page.locator('#sifirla').click();
    assert.deepEqual(onaylar, ['confirm', 'confirm'], 'Düzenek: sıfırlama iki kez onay sordu');
    assert.deepEqual([await T(page, 'desteDepo', [ilkCevap, ikinciCevap]), (await T(page, 'desteGor')).geriAl], [[null, null], true], 'Düzenek: sıfırlama kayıtları sildi, "Geri al" göründü');
    await cozuldu(1, 'Sıfırlama');
    await cevapKisaltmaz(1, 'Sıfırlama');
    // c) Geri alma: yeniden açılan deste sürerken "Geri al"a basılır; silinen kayıtlar geri gelir.
    await desteAc('geri almadan önce');
    await page.locator('#geriAl').click();
    assert.deepEqual([(await T(page, 'desteDepo', [ilkCevap])).map(r => r && r.k), (await T(page, 'desteGor')).geriAl], [[1], false], 'Düzenek: geri alma silinen kaydı geri getirdi, kutusu kapandı');
    await cozuldu(1, 'Geri alma');
    await page.locator('#sonraki').click();
    await cevapKisaltmaz(2, 'Geri alma');
    return 'eklenen katman ' + ek + ', havuz ' + havuzBoyu + ' kelime; destede yanıtlanan: ' + ilkCevap;
  });

  /* ---------- Kelimeler: deste kapalıyken özet ve deste kurulumu ---------- */
  senaryo('Kelimeler, deste kapalıyken: olay ulaşmasa da "Bugünü çalış" desteyi depodaki güncel kayıtlardan kurar; önbellekten dönüşte (pageshow, persisted) ve başka sekme olayında (liste modunda da olağan kart modunda da) deste özeti (bilgi satırı, kutular, düğme) ve liste sayacının ilerlemeden gelen sonu yenilenir; "Bugünü çalış" özeti de kurduğu kayıtlarla çizer', async () => {
    const context = await yeni();
    const page = await context.newPage();
    await page.clock.setFixedTime(GUN(0));
    await kelimelerAc(page, base);
    // Düzenek (0. gün): toplam kart tavanı ve yeni kart hedefi en küçük seçeneklerinde; tavandan iki fazla
    // Çekirdek kelimesi bir kez bilindi (ertesi gün hepsinin vadesi gelir, ikisi tavana sığmaz).
    const f = await page.evaluate(() => {
      const Il = window.YDS.Ilerleme, enKucuk = id => Math.min(...[...document.getElementById(id).options].map(o => Number(o.value)));
      const tavan = enKucuk('gunlukTavan'), hedef = enKucuk('gunlukHedef');
      Il.gunlukTavanAyarla(tavan); Il.gunlukHedefAyarla(hedef);
      const havuz = window.__oyun.desteHavuz([2]), vadeli = havuz.slice(0, tavan + 2);
      vadeli.forEach(w => Il.dogru(w, 'kelime'));
      return {tavan, hedef, vadeli, yeni: havuz[tavan + 2], yeni2: havuz[tavan + 3]};
    });
    assert.ok(f.tavan >= 8 && f.hedef < f.tavan - 3, 'Düzenek: tavan (' + f.tavan + ') ve yeni kart hedefi (' + f.hedef + ') bu adımların sayılarına uygun');
    await page.clock.setFixedTime(GUN(1));
    await page.reload(); await kelimelerHazir(page);
    const oyun = await context.newPage();
    await ac(oyun, base);
    await page.bringToFront();
    // Deste özetinin üç yeri: ekrandaki hâli ve depodan beklenen hâli (ilerlemeyi yazan oyun sayfasından).
    const ozet = g => ({bilgi: g.bilgi, kutular: g.kutular, dugme: g.dugme});
    const beklenenOzet = async () => ozet(await T(oyun, 'desteOzet', [2]));
    const beklenenSayacSonu = async () => (await T(oyun, 'desteOzet', [2])).sayacSonu;
    const farkli = (a, b) => a.bilgi !== b.bilgi && String(a.kutular) !== String(b.kutular) && a.dugme !== b.dugme;
    const oyundaBil = async kelimeler => {
      await oyun.evaluate(ws => ws.forEach(w => window.YDS.Ilerleme.dogru(w, 'kelime')), kelimeler);
      return beklenenOzet();
    };
    let k = await T(page, 'desteGor');
    const ilkOzet = ozet(k);
    assert.deepEqual([ilkOzet, k.liste, k.alan], [await beklenenOzet(), true, false], 'Düzenek: liste modu; özet ' + f.vadeli.length + ' tekrarı gösteriyor');
    assert.equal(ilkOzet.dugme, 'Bugünü çalış (' + f.tavan + ' kart)', 'Düzenek: deste tavan kadar tekrar kartıyla dolu');
    // a) Depolama olayı bu sayfaya ulaşmaz; oyun sayfası destenin ilk iki tekrarını yanıtlar. "Bugünü çalış"a
    //    hiçbir olay gelmeden basılır: deste bellekteki bayat kopyadan değil depodan kurulur. Yanıtlananlar
    //    girmez; deste yine tavan kadardır: günlük hedef kadar yeni kelime + kalan yere sıradaki tekrarlar
    //    (17 Ekim 2026 kuralı: önce yeni, sonra tekrar).
    await page.evaluate(() => { window.__depolamaOlayiYok = true; });
    const ilkIki = f.vadeli.slice(0, 2);
    await oyundaBil(ilkIki);
    await desteDepoBekle(oyun, page, ilkIki);
    assert.deepEqual([await page.evaluate(ws => ws.map(w => window.YDS.Ilerleme.kutu(w, 'kelime')), ilkIki), ozet(await T(page, 'desteGor'))], [[1, 1], ilkOzet],
      'Düzenek: olay ulaşmadı; bellekteki kopya ve ekrandaki özet eski');
    await page.locator('#desteBasla').click();
    k = await T(page, 'desteGor');
    assert.deepEqual([k.alan, k.sayac], [true, '1 / ' + f.tavan],
      'Olay gelmeden basılan "Bugünü çalış" desteyi depodan kurar: tavan kadar kart (bayat kopyadan kurulsa yanıtlananlar ayıklanır, deste eksik kalırdı)');
    assert.ok(String(ilkOzet.kutular) !== String((await beklenenOzet()).kutular), 'Düzenek: öbür sayfadaki iki cevap kutu sayılarını değiştirdi');
    assert.deepEqual(ozet(k), await beklenenOzet(), 'Olay gelmeden basılan "Bugünü çalış" deste özetini de desteyi kurduğu güncel kayıtlarla çizer (kutular bayat kalmaz)');
    const desteA = await desteDolas(page, f.tavan);
    const tekrarYeri = f.tavan - f.hedef;
    assert.deepEqual(desteSirali(desteA.filter(w => f.vadeli.includes(w))), desteSirali(f.vadeli.slice(2, 2 + tekrarYeri)),
      'Destede öbür sayfada yanıtlanan iki kelime yok; tekrar yeri (' + tekrarYeri + ') sıradaki vadelilerle (eşit vadede dizin sırası) dolar');
    const yeniBlok = desteA.filter(w => !f.vadeli.includes(w));
    assert.deepEqual([yeniBlok.length, await T(page, 'desteDepo', yeniBlok)], [f.hedef, yeniBlok.map(() => null)],
      'Destenin kalanı günlük hedef kadar hiç çalışılmamış kelime');
    // b) Listeye dönülür. Oyun sayfası kalan tekrarların dördü dışındakileri ve bir yeni kelimeyi yanıtlar;
    //    olay yine ulaşmaz, özet eski kalır. Önbellekten dönüş (pageshow, persisted) özeti depodan yeniler.
    await page.locator('#mod').click();
    const dahaSonra = [...f.vadeli.slice(2, f.tavan - 2), f.yeni];
    const beklenen = await oyundaBil(dahaSonra);
    await desteDepoBekle(oyun, page, dahaSonra);
    k = await T(page, 'desteGor');
    assert.ok(k.liste && !k.alan && farkli(ozet(k), beklenen), 'Düzenek: liste modu; olay ulaşmadığı için özetin üç yeri de depodakinden farklı: ' + JSON.stringify([ozet(k), beklenen]));
    const sayacSonu = await beklenenSayacSonu();
    assert.ok(/ · öğrenilen \d+ · bugün \d+ tekrar \+ \d+ yeni$/.test(k.durum) && !k.durum.endsWith(sayacSonu),
      'Düzenek: liste sayacı ilerleme özetiyle bitiyor ve olay ulaşmadığı için depodakinden farklı: ' + JSON.stringify([k.durum, sayacSonu]));
    const sayacBasi = k.durum.slice(0, k.durum.indexOf(' · öğrenilen '));
    await page.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true})); });
    k = await T(page, 'desteGor');
    assert.deepEqual(ozet(k), beklenen, 'Önbellekten dönüşte deste özeti (bilgi satırı, kutular, düğme) depodaki ilerlemeyi gösterir');
    assert.equal(k.durum, sayacBasi + sayacSonu, 'Önbellekten dönüşte liste sayacının ilerlemeden gelen sonu da yenilenir; liste (kelime sayısı) yerinde kalır');
    assert.ok(k.liste && !k.alan, 'Önbellekten dönüş liste modunu bozmaz');
    // c) Özet yenilendikten sonra kurulan deste: boyu düğmedeki sayı kadardır, öbür sayfada yanıtlanan
    //    kelimelerin hiçbiri yoktur, kalan dört tekrar içindedir.
    await page.locator('#desteBasla').click();
    k = await T(page, 'desteGor');
    const boy = Number(k.sayac.split(' / ')[1]);
    assert.equal('Bugünü çalış (' + boy + ' kart)', beklenen.dugme, 'Deste boyu düğmedeki sayıyla aynı (kart sayacı: ' + k.sayac + ')');
    const deste = await desteDolas(page, boy);
    assert.deepEqual(deste.filter(w => ilkIki.includes(w) || dahaSonra.includes(w)), [], 'Destede öbür sayfada yanıtlanan kelime yok');
    assert.deepEqual(f.vadeli.slice(f.tavan - 2).filter(w => !deste.includes(w)), [], 'Kalan dört tekrar destede');
    // d) Olaylar yeniden ulaşır. Liste modunda, başka sekmenin (oyunun) cevabı özeti kendiliğinden yeniler.
    //    Oyun hiç çalışılmamış bir kelimeyi bilir: tek yazım özetin üç yerini de değiştirir (başlanan kelime
    //    sayısı, kutular, kalan yeni kart kotası). Sayfada yalnız DOM beklenir: depo okunmaz.
    await page.locator('#mod').click();
    await page.evaluate(() => { window.__depolamaOlayiYok = false; });
    const sonOzet = await oyundaBil([f.yeni2]);
    assert.ok(farkli(sonOzet, beklenen), 'Düzenek: yeni cevap özetin üç yerini de değiştirir: ' + JSON.stringify([beklenen, sonOzet]));
    await desteBeklenen(page.waitForFunction(m => document.getElementById('desteBasla').textContent === m, sonOzet.dugme),
      'Liste modunda başka sekmenin cevabı deste özetini yeniler: düğme "' + sonOzet.dugme + '" olmalı');
    k = await T(page, 'desteGor');
    assert.deepEqual([ozet(k), k.liste], [sonOzet, true], 'Liste modunda başka sekmenin cevabı deste özetini (bilgi satırı, kutular, düğme) yeniler');
    assert.ok(k.durum.endsWith(await beklenenSayacSonu()), 'Liste modunda başka sekmenin cevabı liste sayacının sonunu da yeniler: ' + JSON.stringify([k.durum, await beklenenSayacSonu()]));
    // e) Olağan kart modunda da (deste kapalı: süzgeçler görünür) dışarıdan gelen değişiklik deste özetini
    //    yeniler; kart modu ve süzgeçler yerinde kalır. Değişiklik sayfa içinden, tek adımda kurulur: kalan
    //    tekrarlardan biri bilinir (sayfanın kendi yazımı özeti çizmez), ardından 'sekme' kaynaklı olay gelir.
    await page.locator('#mod').click();
    k = await T(page, 'desteGor');
    assert.deepEqual([k.alan, k.suzgec, ozet(k)], [true, [true, true, true], sonOzet], 'Düzenek: olağan kart modu (deste kapalı), özet yerinde');
    const e = await page.evaluate(([w, katmanlar]) => {
      const T = window.__oyun, oz = g => ({bilgi: g.bilgi, kutular: g.kutular, dugme: g.dugme});
      window.YDS.Ilerleme.dogru(w, 'kelime');
      const olaydanOnce = oz(T.desteGor());
      T.depoDegisti(['yds-leitner'], 'sekme');
      return {olaydanOnce, beklenen: T.desteOzet(katmanlar), sonra: T.desteGor()};
    }, [f.vadeli[f.tavan - 2], [2]]);
    assert.ok(JSON.stringify(e.olaydanOnce) === JSON.stringify(sonOzet) && String(e.beklenen.kutular) !== String(sonOzet.kutular) && e.beklenen.dugme !== sonOzet.dugme,
      'Düzenek: olay gelmeden özet eski; bilinen tekrar kutuları ve düğmedeki sayıyı değiştirir: ' + JSON.stringify([sonOzet, e.olaydanOnce, e.beklenen]));
    assert.deepEqual([ozet(e.sonra), e.sonra.alan, e.sonra.suzgec], [ozet(e.beklenen), true, [true, true, true]],
      'Olağan kart modunda (deste kapalı) dışarıdan gelen değişiklik deste özetini yeniler; kart modu ve süzgeçler yerinde kalır');
    assert.ok(e.sonra.durum.endsWith(e.beklenen.sayacSonu), 'Olağan kart modunda dışarıdan gelen değişiklik sayacın sonunu da yeniler: ' + JSON.stringify([e.sonra.durum, e.beklenen.sayacSonu]));
    return 'tavan ' + f.tavan + ', yeni kart hedefi ' + f.hedef + '; düğme sırayla: ' + [ilkOzet.dugme, beklenen.dugme, sonOzet.dugme, e.beklenen.dugme].join(' / ');
  });

  /* ---------- Dizinde olmayan yazım ---------- */
  senaryo('Dizinde olmayan yazım: biçimi -re/-er ya da s/z kuralına uysa da başlık olmayan yazım kabul edilmez; ayrıldığı harf gizliyse yanlış deneme sayılır; açık gelip üzerine yazıldıysa (kutu "farkli" olur) deneme harcanmaz, yazılan o harfin önünde kesilir; kabul edilmeyen yazım hiçbir şey yazmaz', async () => {
    const context = await yeni();
    const page = await context.newPage();
    await page.clock.setFixedTime(GUN(0));
    await ac(page, base);
    const f = await page.evaluate(() => {
      const Y = window.YDS, O = Y.OyunHesap, Il = Y.Ilerleme, bul = {};
      Y.Veri.dizin.forEach(d => { bul[O.sade(d.e)] = d; });
      const kurallar = {
        're': e => (/(re|er)$/.test(e) ? [e.slice(0, -2) + (e.endsWith('re') ? 'er' : 're')] : []),
        'sz': e => [...e].map((c, i) => (c === 's' || c === 'z' ? e.slice(0, i) + (c === 's' ? 'z' : 's') + e.slice(i + 1) : null)).filter(Boolean)
      };
      // Her biçim kuralı için iki Çekirdek kelimesi; ikisinin de kurala uyan (O.yazimCesidi) ama dizinde başlık olmayan bir yazımı var.
      //   harfsiz: böyle ilk kelime. Öğrenilmiş sayılır: yarın harfsiz sorulur, yazımın ayrıldığı harfler gizlidir.
      //   acik:    yazımın ayrıldığı harflerin hepsi yarın 1. kutuda AÇIK gelen ilk kelime. Bugün bir kez bilinir (1. kutu, vadesi yarın).
      const yarin = Il.bugun() + 1, ciftler = [];
      Object.keys(kurallar).forEach(kural => ['harfsiz', 'acik'].forEach(hal => {
        for (const d of window.__oyun.havuz([2])) {
          if (!/^[a-z]+$/.test(d.e) || ciftler.some(c => c.kart === d.e)) continue;
          const aday = kurallar[kural](d.e).find(x => O.yazimCesidi(d.e, x) && !Y.Veri.dizinKaydi(x) && !bul[x]);
          if (!aday) continue;
          const fark = [...d.e].map((h, i) => i).filter(i => aday[i] !== d.e[i]);
          if (hal === 'acik' && !fark.every(i => O.acikKonumlar(d.e, 1, yarin).includes(i))) continue;
          ciftler.push({kural, hal, kart: d.e, aday, fark, bag: O.iliski(aday, d, x => bul[x] || null)});
          break;
        }
      }));
      ciftler.forEach(c => (c.hal === 'acik' ? Il.dogru(c.kart, 'kelime') : Il.zatenBiliyorum(c.kart, 'kelime')));
      return {ciftler, yarin, kutular: ciftler.map(c => Il.kutu(c.kart, 'kelime'))};
    });
    const harfsiz = f.ciftler.filter(c => c.hal === 'harfsiz'), acik = f.ciftler.filter(c => c.hal === 'acik');
    assert.ok(harfsiz.length, 'Düzenek: Çekirdek katmanında, biçim kuralına (-re/-er ya da s/z) uyan ama dizinde başlık olmayan yazımı bulunan oynanabilir kelime kalmadı');
    assert.ok(acik.length, 'Düzenek: Çekirdek katmanında, dizinde başlık olmayan yazımının ayrıldığı harfler 1. kutuda (' + f.yarin + '. gün) açık gelen kelime yok; ' +
      'açık harfli ayağı başka bir kutu ya da günle kurun');
    assert.deepEqual(f.ciftler.map(c => c.bag), f.ciftler.map(() => null), 'Modül (O.iliski) dizinde başlığı olmayan yazımı kartla ilişkili saymaz: ' + f.ciftler.map(c => c.aday).join(', '));
    assert.deepEqual(f.kutular, f.ciftler.map(c => (c.hal === 'acik' ? 1 : 5)), 'Düzenek: harfsiz kartlar öğrenildi (5. kutu), açık harfli kartlar 1. kutuda');
    await page.clock.setFixedTime(GUN(1));
    await page.reload(); await hazir(page);
    const bugun = await T(page, 'bugun');
    assert.equal(bugun, f.yarin, 'Düzenek: gün döndü (açık harfler bu günün tohumuyla seçildi)');
    await T(page, 'yazimlariSay');
    const OLMADI = 'Olmadı. Doğru harfler açıldı; baştan yaz. 2 hakkın kaldı.';
    // Ekrandaki kart: önce dizinde olmayan yazım yazılır (kabul edilmez), sonra kartın kendi yazımı. kutu: kartın kutusu.
    const kartiOyna = async (w, kutu) => {
      const c = f.ciftler.find(x => x.kart === w);
      await kelimeBekle(page, w);
      const once = {kayit: await T(page, 'kayit', w), gunluk: await T(page, 'bugunku'), yazilan: (await T(page, 'yazilan')).length};
      // Kartın yazımıyla aynı konumdaki harfler tutar, farklı olanlar tutmaz. gizli: harfi gizli kutular (5. kutuda hepsi).
      const tutan = [...w].map((h, i) => i).filter(i => c.aday[i] === w[i]), gizli = await T(page, 'gizliSira');
      assert.ok(tutan.length > 0 && tutan.length < w.length, 'Düzenek: ' + c.aday + ' yazımı ' + w + ' ile kısmen örtüşür');
      assert.deepEqual(c.fark.filter(i => gizli.includes(i)), c.hal === 'acik' ? [] : c.fark,
        'Düzenek: ' + w + ' kartında yazımın ayrıldığı harfler ' + (c.hal === 'acik' ? 'açık kutularda' : 'gizli') + ' (gizli kutular: ' + gizli.join(', ') + ')');
      await page.locator('#oyunGirdi').focus();
      await page.keyboard.type(c.aday);
      // Kelimenin tamamı yazılır: öteki yazımın ayrılan harfi açık kutunun da üzerine yazılır. O kutu yazılanı gösterir ve
      // "farkli" olur (harf zaten ekrandaydı); gizli kutuda tutmayan harf işaretlenmez (cevabı ele verirdi).
      let g = await T(page, 'gorunum');
      assert.equal(g.deger, c.aday, 'Öteki yazımın tamamı girdiye yazılır (açık harfler dahil)');
      assert.deepEqual(g.hucreler, [...w].map((h, i) => ({c: c.aday[i], s: (gizli.includes(i) ? 'bos' : 'sabit') + ' yazildi' + (!gizli.includes(i) && c.aday[i] !== h ? ' farkli' : '')})),
        'Yazarken her kutu yazılan harfi gösterir; yalnız üzerine başka harf yazılan açık kutu "farkli" olur (gizli kutu hiç olmaz)');
      await page.keyboard.press('Enter');
      if (c.hal === 'acik') {
        // Ayrılan harfler açık kutularda, gizli harflerin hepsi doğru: dizinde olmayan yazım kabul edilmez ama yanlış deneme de
        // sayılmaz (harf zaten ekrandaydı). Deneme harcanmaz, hiçbir harf açılmaz; ilk farklı harfin ne olması gerektiği söylenir
        // ve yazılan o harfin önünde kesilir.
        const DUZELT = (c.fark[0] + 1) + '. harf yanlış, ' + w[c.fark[0]] + ' olmalı. O harften devam et.';
        assert.equal(await durumOku(page), DUZELT, 'Dizinde başlık olmayan yazım (' + c.aday + ') "yazımı da doğru" sayılmaz; ayrılan harf açık kutuda olduğu için düzeltilmesi istenir');
        const sonra = await T(page, 'gorunum');
        assert.deepEqual([sonra.gonder, sonra.sonuc, sonra.gecersiz, sonra.deger], ['Kontrol et', false, null, c.aday.slice(0, c.fark[0])],
          'Kelime bitmedi, deneme harcanmadı: hata işareti yok, yazılan ayrılan ilk harfin önünde kesildi');
        assert.deepEqual(sonra.hucreler, [...w].map((h, i) => {
          const taban = gizli.includes(i) ? 'bos' : 'sabit';
          if (i < c.fark[0]) return {c: h, s: taban + ' yazildi'};
          return {c: taban === 'bos' ? '' : h, s: taban + (i === c.fark[0] ? ' simdi' : '')};
        }), 'Kutular: yazılan kesildi, imleç ayrılan ilk açık harfte (harf kutuda görünür); hiçbir gizli harf açılmadı, "farkli" işareti kalktı');
        await yazimDurulsun(page);
        assert.deepEqual({kayit: await T(page, 'kayit', w), gunluk: await T(page, 'bugunku'), yazilan: (await T(page, 'yazilan')).length}, once,
          'Kabul edilmeyen yazım ilerleme ve günlük sayaç yazmaz');
        // O harften kartın kendi yazımıyla devam edilir: deneme harcanmadığı için ilk denemede doğrudur, kutu yükselir.
        await page.keyboard.type(tam(w).slice(c.fark[0]));
        await page.keyboard.press('Enter');
        assert.match(await durumOku(page, DUZELT), new RegExp('^Bildiniz! Kelime ' + (kutu + 1) + '\\. kutuya çıktı; '),
          'Açık harfin üzerine yazılan (kabul edilmeyen) yazım deneme harcamaz: kartın kendi yazımı ilk denemede doğru sayılır');
        await page.waitForFunction(([w, gun]) => window.__oyun.kayit(w).c === gun, [w, bugun]);
        assert.equal((await T(page, 'kayit', w)).k, kutu + 1);
        await page.keyboard.press('Enter');
        return;
      }
      assert.equal(await durumOku(page), OLMADI, 'Dizinde başlık olmayan yazım (' + c.aday + ') "yazımı da doğru" sayılmaz: ayrılan harf gizliyse yanlış denemedir');
      g = await T(page, 'gorunum');
      assert.deepEqual([g.gonder, g.sonuc, g.gecersiz, g.deger], ['Kontrol et', false, 'true', ''], 'Kelime bitmedi: düğme, sonuç bölümü, hata işareti; yazılan silindi');
      // Harfsiz kartta yanlış deneme harf açtı: açılan (bulundu) harf de açık harftir ve yazılır; açıklama öbür biçime döner.
      assert.ok(g.tarif.endsWith('. Açık harfler dahil kelimenin tamamını baştan sona yaz, Enter ile kontrol et.') && g.tarif === beklenenAciklama(g),
        'Yanlış denemede harf açılan harfsiz kartın açıklaması açık harfleri de yazdırır: ' + g.tarif);
      // Gizli harflerden yalnız kartın kendi yazımıyla tutanlar açıldı; tutmayan gizli kalır ve boş görünür. İmleç yine ilk kutudadır.
      assert.deepEqual(g.hucreler, [...w].map((h, i) => {
        const acildi = tutan.includes(i), s = !gizli.includes(i) ? 'sabit' : (acildi ? 'bulundu' : 'bos');
        return {c: s === 'bos' ? '' : h, s: s + (i ? '' : ' simdi')};
      }), 'Yanlış denemeden sonra: doğru yazılan gizli harfler açıldı, tutmayanlar gizli; açık harfler kendi harfiyle yerinde');
      assert.equal(g.azami, String(w.length), 'Kelime yeniden baştan yazılacak: girdi yine kelimenin bütün harflerini alır');
      // Bir yanlış deneme ilerlemeye hiçbir şey yazmaz (bekleyen yazım olsaydı şimdiye yapılmış olurdu).
      await yazimDurulsun(page);
      assert.deepEqual({kayit: await T(page, 'kayit', w), gunluk: await T(page, 'bugunku'), yazilan: (await T(page, 'yazilan')).length}, once,
        'Kabul edilmeyen yazım ilerleme ve günlük sayaç yazmaz');
      // Deneme harcandı: kartın kendi yazımı (baştan sona) artık "ilk denemede doğru" değildir.
      await page.keyboard.type(tam(w));
      await page.keyboard.press('Enter');
      assert.equal(await durumOku(page, OLMADI), 'Doğru, ama ilk denemede değil; ' + (kutu >= 5 ? 'kelime öğrenilenlerde kalıyor.' : 'kelime ' + kutu + '. kutuda kalıyor.'),
        'Ayrıldığı harf gizli olan dizin dışı yazım bir deneme harcar (aynı anlamlı kelime gibi bağışlanmaz)');
      await page.waitForFunction(([w, gun]) => window.__oyun.kayit(w).c === gun, [w, bugun]);
      assert.equal((await T(page, 'kayit', w)).k, kutu);
      await page.keyboard.press('Enter');
    };
    // a) Harfsiz kartlar ("Öğrenilenler" turu): yazımın ayrıldığı harfler gizlidir.
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    const sira = await T(page, 'sira', 'ogrenilen');
    assert.deepEqual([...sira].sort(), harfsiz.map(c => c.kart).sort(), 'Düzenek: öğrenilmiş kelimeler sırada');
    for (const w of sira) await kartiOyna(w, 5);
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    // b) Açık harfli kartlar ("Sıradakiler" turu, 1. kutu): yazımın ayrıldığı harfler kutusunda açık durur; öteki yazım
    //    onların üzerine yazılabilir. Dizinde başlık olmadığı için kabul edilmez; ama gizli harflerin hepsi doğru, fark
    //    yalnız açık harfte olduğu için yanlış deneme de sayılmaz: düzeltilince kart ilk denemede bilinmiş olur.
    await page.locator('.oyun-mod [data-mod="sira"]').click();
    const acikSira = (await T(page, 'sira', 'sira')).slice(0, acik.length);
    assert.deepEqual([...acikSira].sort(), acik.map(c => c.kart).sort(), 'Düzenek: açık harfli kartlar (1. kutu, vadesi bugün) sıranın başında');
    for (const w of acikSira) await kartiOyna(w, 1);
    assert.deepEqual(await T(page, 'yazilan'), [...sira.map(w => 'ipucuyla:' + w), ...acikSira.map(w => 'dogru:' + w)],
      'Her kelime bir kez yazıldı: harfsiz kartlar ikinci denemedeki doğru cevapla, açık harfli kartlar ilk denemede');
    assert.equal((await T(page, 'gorunum')).sayim, 'Bu oturum: ✓ ' + acikSira.length + ' bildin · 💡 ' + sira.length + ' ipuçlu · ✗ 0 bilemedin');
    return f.ciftler.map(c => c.kart + ' kartında ' + c.aday + ' (' + c.kural + ', ' + (c.hal === 'acik' ? 'ayrılan harf açık' : 'harfsiz') + ')').join(', ');
  });

  /* ---------- "enter" kartı ---------- */
  senaryo('"enter" kartı: tuşun adı cevabın kendisidir (re-enter kartında bir parçası); açıklama, duyuru ve girdinin açıklaması cevaptan önce onu içermez: açık harfli kartta da harfsiz kartta da "onay tuşu ile kontrol et"', async () => {
    // Kartlar: başlığı tuşun adı olan (enter) ve başlığının bir parçası tuşun adı olan (re-enter gibi) ilk kelime.
    const sonuclar = [];
    for (const tur of ['tam', 'parca']) sonuclar.push(await enterKarti(tur));
    return sonuclar.join('; ');
  });
  async function enterKarti(tur) {
    const context = await yeni();
    const page = await context.newPage();
    await page.clock.setFixedTime(GUN(0));
    await ac(page, base);
    const f = await page.evaluate(tur => {
      const Y = window.YDS, O = Y.OyunHesap, Il = Y.Ilerleme;
      const d = Y.Veri.dizin.find(x => (tur === 'tam' ? x.e.toLowerCase() === 'enter' : /[- ]/.test(x.e) && x.e.toLowerCase().split(/[- ]/).includes('enter')) && O.oynanabilir(x));
      if (!d) return {yok: true};
      // Vadesi yarın gelen tek kelime olur: yarın sıranın başındadır. Katmanı seçili değilse seçilir.
      Il.yanlis(d.e, 'kelime');
      if (d.k !== 2) Y.Depo.yaz('yds-katmanlar', [d.k]);
      return {w: d.e};
    }, tur);
    assert.equal(f.yok, undefined, 'Düzenek: ' + (tur === 'tam' ? '"enter"' : 'bir parçası "enter" olan çok parçalı başlık (re-enter gibi)') + ' artık oynanabilir değil. ' +
      'Bu senaryo, başlığı sabit yönerge metnindeki tuş adını içeren kartı sınar; kelime kalktıysa senaryonun bu ayağını (ikisi de kalktıysa ' +
      'oyun-hesap.js tarif() içindeki özel durumu da) kaldırın.');
    await page.clock.setFixedTime(GUN(1));
    await page.reload(); await hazir(page);
    const w = f.w;
    assert.equal((await T(page, 'sira', 'sira', 1))[0], w, 'Düzenek: vadesi gelen tek kelime sıranın başında');
    await kelimeBekle(page, w);
    // Yönergenin iki biçimi: en az bir harf açıkken (açık harfler de yazılır) ve hiç açık harf yokken. İkisi de tuşun adını söylemez.
    const YONERGE = {acikli: 'Açık harfler dahil kelimenin tamamını baştan sona yaz, onay tuşu ile kontrol et.', harfsiz: 'Kelimenin tamamını yaz, onay tuşu ile kontrol et.'};
    // Cevaptan önceki her hâlde: açıklama tuşun adını söylemez; kartta (sayfada baştan duran öznitelikler dahil),
    // girdinin açıklamasında ve (soru yeniden duyurulduysa) duyuruda cevap yoktur. bicim: yönergenin beklenen biçimi;
    // duyuru: beklenen duyuru metni ya da null. Gizli harf sayısını döndürür.
    const gizli = async (hal, bicim, duyuru) => {
      const g = await T(page, 'gorunum'), bos = g.hucreler.filter(h => h.s.startsWith('bos')).length;
      assert.ok(g.tarif.endsWith('. ' + YONERGE[bicim]), hal + ': açıklama "' + YONERGE[bicim] + '" yönergesiyle biter (tuşun adı, yani cevap geçmez): ' + g.tarif);
      assert.equal(g.tarif, beklenenAciklama(g, 'onay tuşu'), hal + ': açıklama tuşun adını (cevabı) söylemez');
      assert.deepEqual(await T(page, 'sizinti', w), [], hal + ': kartta cevap yok');
      assert.deepEqual(await T(page, 'oznitelikSizinti', w), [], hal + ': kartın özniteliklerinde (sayfada baştan duranlar dahil) cevap yok');
      assert.deepEqual(await T(page, 'aciklamaSizinti', w), [], hal + ': girdinin açıklamasında (aria-describedby) cevap yok');
      if (duyuru) {
        const okunan = await duyuruOku(page);
        assert.deepEqual(await T(page, 'duyuruSizinti', w), [], hal + ': duyuruda cevap yok');
        assert.equal(okunan, duyuru, hal + ': duyuru sıra satırı, maskeli anlam, tür ve açıklamadan oluşur');
      }
      return bos;
    };
    const harf = tam(w).length;
    let bos = await gizli('Yeni kart', 'acikli', await T(page, 'soru', w, true));
    assert.ok(bos >= 2 && bos < harf, 'Düzenek: 1. kutuda en az iki gizli, en az bir açık harf (' + harf + ' harfin ' + bos + ' tanesi gizli)');
    // Moddan çıkıp dönünce soru yeniden duyurulur (aynı kelime, yeniden kurulan kart).
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    await page.locator('#oyunBos').waitFor({state: 'visible'});
    await page.locator('.oyun-mod [data-mod="sira"]').click();
    await kelimeBekle(page, w);
    await gizli('Moda dönünce', 'acikli', await T(page, 'soru', w, true));
    // Tek gizli harf kalana kadar harf açılır: açılan harfler açıklamaya girer, yönerge yine tuşun adını söylemez.
    // Her açmanın iletisi de doğrulanır: harf sırası ayraçları saymaz (re-enter kartında tireden sonraki harfler).
    let sonAcma = (await T(page, 'gorunum')).durum;
    for (; bos > 1; bos--) {
      const ilkBos = (await T(page, 'gorunum')).hucreler.findIndex(h => h.s.startsWith('bos'));
      await page.locator('#oyunHarf').click();
      sonAcma = await durumOku(page, sonAcma);
      assert.equal(sonAcma, harfSirasi(w, ilkBos) + '. harf açıldı: ' + w[ilkBos] + '. Doğru bilirsen kelime aynı kutuda kalır.', 'Açma iletisindeki harf sırası ayraçları saymaz (' + w + ')');
    }
    assert.equal(await gizli('Tek gizli harf kalınca', 'acikli', null), 1, 'Düzenek: tek gizli harf kaldı');
    await coz(page, w);
    await durumBekle(page, 'Doğru, ama ipucuyla; kelime 1. kutuda kalıyor.');
    // Özel durum yalnız bu karta aittir: sonraki kartta yönerge tuşun adını söyler.
    await page.keyboard.press('Enter');
    const [w2] = await T(page, 'sira', 'sira', 1);
    await kelimeBekle(page, w2);
    const sonraki = await T(page, 'gorunum');
    assert.ok(sonraki.tarif.endsWith(', Enter ile kontrol et.'), 'Başka kartta yönerge tuşun adını söyler: ' + sonraki.tarif);
    assert.equal(sonraki.tarif, beklenenAciklama(sonraki), 'Başka kartta açıklamanın geri kalanı aynı kurala uyar (kutular, kelimenin tamamını yazdıran yönerge)');
    // Açıklamanın öbür biçimi: hiç açık harf yokken yönerge açık harflerden söz etmez; tuşun adını yine söylemez.
    // Kart öğrenilmiş (5. kutu) olarak yeniden kurulur: kaydı doğrudan yazılır, sayfa yenilenir, harfsiz turda sorulur.
    assert.equal(await T(page, 'kayitKoy', w, 5), true, 'Düzenek: kelimenin kaydı 5. kutuya yazıldı');
    await page.reload(); await hazir(page);
    await page.locator('.oyun-mod [data-mod="ogrenilen"]').click();
    await kelimeBekle(page, w);
    bos = await gizli('Harfsiz kart', 'harfsiz', await T(page, 'soru', w, true));
    assert.equal(bos, harf, 'Düzenek: 5. kutuda hiç açık harf yok');
    // Harfsiz kartta eksik kelime iletisi açık harften söz etmez; harf sayısı ayraçları saymaz (re-enter: tire harf değildir).
    await page.locator('#oyunGirdi').focus();
    await page.keyboard.type(tam(w)[0]);
    await page.keyboard.press('Enter');
    assert.equal(await durumOku(page), 'Önce kelimenin tamamını yaz.', 'Harfsiz kartta eksik kelime iletisi açık harften söz etmez (' + w + ')');
    await page.keyboard.press('Backspace');
    // İlk harf açılınca açıklama öbür biçime döner ("Bir harf aç" ile açılan harf de açık harftir ve yazılır).
    await page.locator('#oyunHarf').click();
    assert.equal(await gizli('Harfsiz kartta bir harf açılınca', 'acikli', null), harf - 1, 'Düzenek: bir harf açıldı');
    return w + ' kartı (sonraki ' + w2 + ')';
  }

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
    'Dinle (dokunmatik/masaüstü), Ctrl+A, eşitleme beklemesi (yapay olaylarla ve gerçek motorla), odaksız yazma, ' +
    'Kelimeler destesi (tekrar kartları, yığını dağıtma, katman/sıfırlama/geri alma, deste kapalıyken özet), ' +
    'dizinde olmayan yazım, "enter" kartı; ' +
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
