/* ============================================================
   Sözlük paneli — kelime, öbek ve cümle kartlarının yanında açılan
   bağımsız arama. Çalışılan desteyi, kartı ve ilerlemeyi değiştirmez.

   - Geniş ekranda sağda sabit bir sütundur. Sayfa içeriği panel kadar
     daralır; kart panelin altında kalmaz.
   - Dar ekranda alttan açılır. Yüksekliği ekran klavyesine uyar ve
     "Büyüt" ile artırılabilir. Sonuçlar panelin içinde kayar.
   - Odak paneldeyken tuş olayları sayfaya ulaşmaz: arkadaki kart 1/2/3
     tuşlarıyla yanıtlanamaz.
   - Çevrilmemiş kartın kendi kelimesi panelde görünürse sayfaya bildirilir;
     sayfa o kartın "Bildim" cevabını ipucuyla sayar.
   - Seçilen bir kelime "Sözlükte ara" düğmesiyle doğrudan aratılır.
   - Sabitlenen sonuçlar aramalar arasında kalır; benzer kelimeler yan yana
     karşılaştırılır. Sabitler yalnız bu sekmede (sessionStorage) tutulur.

   Veri: Kelimeler sayfasında dizin zaten yüklüdür. Öbekler ve Cümleler
   sayfalarında dizin panel ilk açıldığında, öbekler ilk aramada, tam kayıtlar
   (örnek cümleler) ayrıntı açıldığında indirilir.
   ============================================================ */

(function () {
  'use strict';

  var Y = window.YDS = window.YDS || {};
  var Ortak = Y.AramaOrtak;
  if (!Ortak || Y.Sozluk || !document.body) return;

  var kacar = Y.kacar;
  var sadelestir = Y.sadelestir;
  var Il = Y.Ilerleme || null;

  var SINIR = 30;                                 // tür başına gösterilen sonuç
  var SABIT_SINIRI = 6;
  var SABIT_ANAHTAR = 'yds-sozluk-sabit-v1';      // sessionStorage: yalnız bu sekme
  // Kısa yatay ekranda (yan çevrilmiş telefon) alt panel kartı örterdi; orada da yan sütun.
  var YAN_SORGU = '(min-width: 900px), (min-width: 640px) and (max-height: 500px)';
  var KATMAN_ADI = (Y.Veri && Y.Veri.KATMAN_ADI) ||
    { 1: 'Temel', 2: 'Çekirdek', 3: 'Orta', 4: 'İleri', 5: 'Geniş', 6: 'Geniş+', 7: 'Aile üyeleri' };
  var KUTU_ADI = ['hiç çalışılmadı', '1. kutu', '2. kutu', '3. kutu', '4. kutu', '5. kutu'];

  function $(id) { return document.getElementById(id); }
  function kimlik(tur, anahtar) { return tur + '\u0000' + anahtar; }
  function guvenli(fn) { try { return fn(); } catch (e) { return null; } }

  /* ---------- veri ---------- */

  var bekleyen = {};
  function betikYukle(yol, hazir) {
    if (hazir()) return Promise.resolve();
    if (bekleyen[yol]) return bekleyen[yol];
    bekleyen[yol] = new Promise(function (coz, reddet) {
      var s = document.createElement('script');
      s.src = Y.varlikYolu ? Y.varlikYolu(yol) : yol;
      s.async = true;
      s.onload = function () {
        if (hazir()) { coz(); return; }
        delete bekleyen[yol];
        reddet(new Error(yol + ' beklenen veriyi içermiyor'));
      };
      s.onerror = function () { delete bekleyen[yol]; reddet(new Error(yol + ' yüklenemedi')); };
      document.head.appendChild(s);
    });
    return bekleyen[yol];
  }

  function dizin() { return window.KELIME_DIZIN || []; }
  function dizinHazir() { return dizin().length > 0; }
  function dizinYukle() { return betikYukle('data/kelime-dizin.js', dizinHazir); }

  var haritaKaynak = null, harita = Object.create(null);
  function dizinKaydi(e) {
    var d = dizin();
    if (haritaKaynak !== d) {
      harita = Object.create(null);
      d.forEach(function (x) { harita[x.e] = x; });
      haritaKaynak = d;
    }
    return harita[e] || null;
  }

  var obekHatasi = false;
  function obekYukle() {
    if (window.OBEKLER) return Promise.resolve();
    if (Y.Veri && Y.Veri.obekleriYukle) return Y.Veri.obekleriYukle();
    return betikYukle('data/obekler.js', function () { return !!window.OBEKLER; }).then(function () {
      // Öbekler sayfasındaki göçün aynısı: eski çekimli anahtarları lemmaya taşır.
      if (Il && Il.obekTakmaGocu) guvenli(function () { Il.obekTakmaGocu(); });
    });
  }
  function obekBul(f) {
    var liste = window.OBEKLER || [];
    for (var i = 0; i < liste.length; i++) if (liste[i].f === f) return liste[i];
    return null;
  }

  var katmanHatasi = {};
  function katmanYukle(k) {
    if (window['KELIME_K' + k]) return Promise.resolve();
    if (Y.Veri && Y.Veri.katmanYukle) return Y.Veri.katmanYukle(k);
    return betikYukle('data/kelime-k' + k + '.js', function () { return !!window['KELIME_K' + k]; });
  }
  function tamKayit(e) {
    var d = dizinKaydi(e);
    if (!d) return null;
    var tablo = window['KELIME_K' + d.k];
    return (tablo && tablo[e]) || null;
  }

  /* ---------- sabitlenenler (yalnız bu sekme) ---------- */

  function sabitleriOku() {
    var ham = guvenli(function () { return JSON.parse(window.sessionStorage.getItem(SABIT_ANAHTAR) || '[]'); });
    if (!Array.isArray(ham)) return [];
    return ham.filter(function (s) {
      return s && (s.tur === 'kelime' || s.tur === 'obek') &&
        typeof s.anahtar === 'string' && s.anahtar.length > 0 && s.anahtar.length <= 80;
    }).slice(0, SABIT_SINIRI);
  }
  function sabitleriYaz() {
    guvenli(function () { window.sessionStorage.setItem(SABIT_ANAHTAR, JSON.stringify(sabitler)); });
  }
  function sabitIndeks(tur, anahtar) {
    for (var i = 0; i < sabitler.length; i++) {
      if (sabitler[i].tur === tur && sabitler[i].anahtar === anahtar) return i;
    }
    return -1;
  }

  /* ---------- iskelet ---------- */

  var panel = document.createElement('aside');
  panel.id = 'sozlukPanel';
  panel.className = 'sozluk-panel';
  panel.hidden = true;
  panel.setAttribute('aria-labelledby', 'sozlukBaslik');
  // Panelin boş bir yerine tıklamak odağı <body>'ye düşürmesin; düşerse
  // tuşlar arkadaki karta giderdi.
  panel.tabIndex = -1;
  panel.innerHTML =
    '<div class="sozluk-bas">' +
      '<h2 id="sozlukBaslik" tabindex="-1"><span aria-hidden="true">📖</span> Sözlük</h2>' +
      '<button type="button" class="btn ghost sm" id="sozlukBoy" hidden>Büyüt</button>' +
      '<button type="button" class="btn ghost sm" id="sozlukKapat" aria-label="Sözlüğü kapat">✕</button>' +
    '</div>' +
    '<form class="sozluk-form" id="sozlukForm" role="search" aria-label="Sözlükte ara">' +
      '<label class="visually-hidden" for="sozlukAra">İngilizce ya da Türkçe kelime</label>' +
      '<input type="search" id="sozlukAra" autocomplete="off" autocapitalize="none" spellcheck="false"' +
        ' enterkeyhint="search" placeholder="İngilizce ya da Türkçe yaz…">' +
    '</form>' +
    '<div class="sozluk-govde" id="sozlukGovde" tabindex="0" role="region" aria-label="Sözlük sonuçları">' +
      '<p class="sozluk-durum" id="sozlukDurum" role="status" aria-live="polite" aria-atomic="true"></p>' +
      '<p class="sozluk-dis" id="sozlukDis" hidden><span class="sozluk-dis-etiket">Dış kaynak:</span> ' +
        '<a class="btn ghost sm" id="sozlukGoogle" href="https://translate.google.com/"' +
          ' target="_blank" rel="noopener noreferrer">Google Çeviri ↗</a> ' +
        '<a class="btn ghost sm" id="sozlukTureng" href="https://tureng.com/"' +
          ' target="_blank" rel="noopener noreferrer">Tureng ↗</a></p>' +
      '<p class="sozluk-uyari" id="sozlukUyari" role="note" hidden>Çalıştığın kartın anlamı sözlükte göründü. ' +
        '“Bildim” dersen cevap ipucuyla sayılır.</p>' +
      '<p class="visually-hidden" id="sozlukDuyuru" role="status" aria-live="polite"></p>' +
      '<div id="sozlukSabitler"></div><div id="sozlukSonuclar"></div>' +
    '</div>';
  document.body.appendChild(panel);

  var secimDugme = document.createElement('button');
  secimDugme.type = 'button';
  secimDugme.className = 'btn sm sozluk-secim';
  secimDugme.hidden = true;
  secimDugme.innerHTML = '<span aria-hidden="true">📖</span> Sözlükte ara';
  document.body.appendChild(secimDugme);

  var elAra = $('sozlukAra'), elGovde = $('sozlukGovde');

  /* ---------- durum ---------- */

  var acik = false;
  var acan = null;                 // paneli açan öğe; kapanınca odak ona döner
  var kaynak = null;               // sayfanın kart bağlantısı (kaynakBagla)
  var gorunenler = Object.create(null);
  var acikAyrinti = Object.create(null);
  var sabitler = sabitleriOku();
  var buyuk = false;
  var istek = 0;
  var bekleme = null;
  var dizinHatasi = false;
  var aktifQ = '';
  var sonSorgu = { q: '', ham: '' };
  var satirNo = 0;
  var yanMedya = window.matchMedia ? window.matchMedia(YAN_SORGU) : null;

  function yandaMi() { return !yanMedya || yanMedya.matches; }

  function durum(metin) { $('sozlukDurum').textContent = metin; }

  /* ---------- yerleşim ---------- */

  function yerlesim() {
    var kok = document.documentElement;
    var yan = yandaMi();
    kok.classList.toggle('sozluk-yan', acik && yan);
    kok.classList.toggle('sozluk-alt', acik && !yan);
    // Odaktaki "Büyüt" gizlenirse odak <body>'ye düşmesin.
    if (yan && document.activeElement === $('sozlukBoy')) $('sozlukBaslik').focus({ preventScroll: true });
    $('sozlukBoy').hidden = yan;
    if (!acik || yan) {
      kok.style.removeProperty('--sozluk-yuk');
      kok.style.removeProperty('--sozluk-alt');
      tekKaydirmaAyarla();
      return;
    }
    // Ekran klavyesi açıkken görsel alan küçülür; panel onun üstünde durur.
    // Parmakla yakınlaştırma da görsel alanı küçültür; onu klavye sanmamak için
    // ölçek 1 olmalı ve odak arama kutusunda olmalı.
    var vv = window.visualViewport;
    var olcek = vv && vv.scale ? vv.scale : 1;
    var klavye = vv && Math.abs(olcek - 1) < 0.05 && document.activeElement === elAra
      ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
    var gorunur = klavye ? vv.height : window.innerHeight;
    var oran = (buyuk || klavye > 80) ? 0.88 : 0.55;
    var yukseklik = Math.round(Math.max(Math.min(gorunur * oran, gorunur - 48), Math.min(220, gorunur)));
    kok.style.setProperty('--sozluk-yuk', yukseklik + 'px');
    kok.style.setProperty('--sozluk-alt', Math.round(klavye) + 'px');
    tekKaydirmaAyarla();
  }

  /* Başlık ve arama kutusu panelin %40'ından fazlasını kaplıyorsa (küçük ekran,
     büyük yazı) panelin tamamı tek parça kayar; yoksa yalnız sonuç alanı kayar. */
  function tekKaydirmaAyarla() {
    var tek = false;
    if (acik) {
      // Formun panel içindeki yeri (offsetParent sabit konumlu paneldir): panel
      // kaydırılmış olsa da değişmez. Ekran koordinatı kaydırmayla küçülürdü.
      var form = $('sozlukForm'), ph = panel.clientHeight;
      tek = ph > 0 && form.offsetTop + form.offsetHeight > ph * 0.4;
    }
    if (tek === panel.classList.contains('sozluk-tek-kaydirma')) return;
    // Kip değişince kaydıran kutu değişir; kullanıcının baktığı sonuç yerinde kalsın.
    var capa = bakilanSonuc(), once = capa ? capa.getBoundingClientRect().top : 0;
    panel.classList.toggle('sozluk-tek-kaydirma', tek);
    if (capa && capa.isConnected) {
      var fark = capa.getBoundingClientRect().top - once;
      if (Math.abs(fark) > 1) (tek ? panel : elGovde).scrollTop += fark;
    }
  }
  function bakilanSonuc() {
    var satirlar = elGovde.querySelectorAll('.sozluk-sonuc');
    var ust = Math.max(panel.getBoundingClientRect().top, elGovde.getBoundingClientRect().top);
    for (var i = 0; i < satirlar.length; i++) {
      if (satirlar[i].getBoundingClientRect().bottom > ust + 1) return satirlar[i];
    }
    return null;
  }

  function dugmeleriGuncelle() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-sozluk-ac]'), function (b) {
      b.hidden = false;
      b.setAttribute('aria-controls', 'sozlukPanel');
      b.setAttribute('aria-expanded', acik ? 'true' : 'false');
    });
  }

  function gorunurMu(el) {
    return !!el && document.contains(el) && !el.closest('[hidden]') && el.getClientRects().length > 0;
  }
  function kartOgesi() {
    var k = $('kart');
    return gorunurMu(k) ? k : null;
  }
  function gorunurSozlukDugmesi() {
    var dugmeler = document.querySelectorAll('[data-sozluk-ac]');
    for (var i = 0; i < dugmeler.length; i++) if (gorunurMu(dugmeler[i])) return dugmeler[i];
    return null;
  }
  /* Panel kapanınca odak kaybolmasın: açan öğe, kart, görünen bir Sözlük
     düğmesi, en son sayfanın ana bölgesi. */
  function donusOdagi() {
    if (gorunurMu(acan) && !panel.contains(acan)) return acan;
    var k = kartOgesi();
    if (k) return k;
    var d = gorunurSozlukDugmesi();
    if (d) return d;
    var ana = document.querySelector('main');
    if (ana && !ana.hasAttribute('tabindex')) ana.setAttribute('tabindex', '-1');
    return ana;
  }

  /* Panel açılıp kapanırken sayfa daralır ya da genişler. Çalışılan kart ekrandaki
     yerini korusun; yan çevrilmiş telefonda aksi hâlde ekran dışına kayıyordu. */
  function kartEkrandaMi(k) {
    if (!k) return false;
    var r = k.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }
  /* Sitenin yumuşak kaydırmasını devralmadan anında kaydır; yoksa kart bir an
     ekran dışına uçup geri gelir. */
  function aniKaydir(fark) {
    var kok = document.documentElement, eski = kok.style.scrollBehavior;
    kok.style.scrollBehavior = 'auto';
    window.scrollBy(0, fark);
    kok.style.scrollBehavior = eski;
  }
  /* Azaltılmış hareket ayarında sitenin genel kuralı her özelliğe çok kısa bir
     geçiş verir; gövde dolgusu da geçişle değişir. Ölçmeden önce geçişleri bitir. */
  function gecisleriBitir() {
    if (!document.getAnimations || typeof window.CSSTransition !== 'function') return;
    document.getAnimations().forEach(function (a) {
      if (a instanceof window.CSSTransition) guvenli(function () { a.finish(); });
    });
  }
  function kartiYerindeTut(fn) {
    var k = kartOgesi();
    // Ekranda olmayan karta göre kaydırmak kullanıcının baktığı yeri kaçırırdı.
    var once = kartEkrandaMi(k) ? k.getBoundingClientRect().top : null;
    fn();
    gecisleriBitir();
    if (once === null || !gorunurMu(k)) return;
    var fark = k.getBoundingClientRect().top - once;
    // Birkaç piksellik kayma düzeltilmez: sayfa başındayken açıp kapamak sayfayı kaydırmasın.
    if (Math.abs(fark) > 4) aniKaydir(fark);
  }
  /* Ekran döndürme ya da pencere boyutu: yerleşim değişmeden önce görünen kart
     sonra da görünür kalsın. Durum kaydırmada ve açılışta güncellenir. */
  var kartGorunurdu = false;
  function kartDurumunuKaydet() { kartGorunurdu = acik && kartEkrandaMi(kartOgesi()); }
  function kartiEkranaGetir() {
    var k = kartOgesi();
    if (!k) return;
    var baslik = document.querySelector('.site-header');
    var ust = (baslik ? baslik.getBoundingClientRect().bottom : 0) + 8;
    aniKaydir(k.getBoundingClientRect().top - ust);
  }
  function boyutDegisti() {
    if (!acik) return;
    var gorunurdu = kartGorunurdu;
    yerlesim();
    gecisleriBitir();
    if (gorunurdu && !kartEkrandaMi(kartOgesi())) kartiEkranaGetir();
    kartDurumunuKaydet();
    denetimiPlanla();
  }

  /* Dar ekranda alt panel kartın üstüne binmesin: kartı görünür alana al. */
  function kartiGorunurYap() {
    var k = kartOgesi();
    if (!k) return;
    var baslik = document.querySelector('.site-header');
    var ust = (baslik ? baslik.getBoundingClientRect().bottom : 0) + 8;
    var fark = k.getBoundingClientRect().top - ust;
    if (Math.abs(fark) > 4) window.scrollBy({ top: fark, behavior: Y.hareket ? Y.hareket() : 'auto' });
  }

  /* ---------- aç / kapat ---------- */

  function ac(sorgu, secenek) {
    secenek = secenek || {};
    var ilk = !acik;
    var kartEkrandaydi = false;
    if (ilk) {
      var o = document.activeElement;
      acan = secenek.acan ||
        (o && o !== document.body && o.tagName !== 'MAIN' && !panel.contains(o) ? o : null);
      kartEkrandaydi = kartEkrandaMi(kartOgesi());
      kartiYerindeTut(function () {
        acik = true;
        panel.hidden = false;
        yerlesim();
      });
      dugmeleriGuncelle();
      guvenli(function () { if (Y.Kullanim) Y.Kullanim.olay('sozluk-ac'); });
    }
    var yeniSorgu = typeof sorgu === 'string' && sorgu.trim();
    if (yeniSorgu) { elAra.value = sorgu.trim(); elGovde.scrollTop = 0; }
    // Tek parça kayan küçük ekranda odaklanan kutu görünür olsun.
    if (ilk || yeniSorgu) panel.scrollTop = 0;
    if (secenek.odak === 'baslik') $('sozlukBaslik').focus({ preventScroll: true });
    else elAra.focus({ preventScroll: true });
    ara();
    // Alt panel ekrandaki kartın üstüne binmesin; ekranda olmayan karta ise gidilmez.
    if (ilk && !yandaMi() && kartEkrandaydi) kartiGorunurYap();
    kartDurumunuKaydet();
  }

  function kapat() {
    if (!acik) return;
    kartiYerindeTut(function () {
      acik = false;
      panel.hidden = true;
      yerlesim();
    });
    secimGizle();
    gorunenler = Object.create(null);
    kartGorunurdu = false;
    dugmeleriGuncelle();
    denetle();
    var hedef = donusOdagi();
    acan = null;
    if (hedef && hedef.focus) hedef.focus({ preventScroll: true });
  }

  /* ---------- arama ---------- */

  function sorguHali(ham) {
    var Motor = Y.EsitlemeMotoru;
    // Düzeltilen eski başlığı yazan kullanıcıyı kanonik kayda götür (ara.js ile aynı).
    var kanonik = Motor && Motor.kelimeKimligi ? guvenli(function () { return Motor.kelimeKimligi(ham); }) || ham : ham;
    return sadelestir(kanonik);
  }

  function hesapla(q) {
    return {
      q: q,
      kelime: Ortak.kelimeler(dizin(), q),
      obek: window.OBEKLER
        ? Ortak.obekler(window.OBEKLER, q).filter(function (x) { return x.p < 4; })
            .map(function (x) { return x.o; })
        : null
    };
  }

  function planla() {
    window.clearTimeout(bekleme);
    bekleme = window.setTimeout(ara, 120);
  }

  function ara() {
    window.clearTimeout(bekleme);
    if (!acik) return;
    var benim = ++istek;
    var ham = elAra.value.trim();
    var q = sorguHali(ham);
    // Yeni sorguda sonuçlar baştan gösterilir.
    if (ham !== sonSorgu.ham) { elGovde.scrollTop = 0; panel.scrollTop = 0; }
    sonSorgu = { q: q, ham: ham };
    if (!dizinHazir()) {
      if (dizinHatasi) { hataCiz(); return; }
      durum('Sözlük yükleniyor…');
      dizinYukle().then(function () {
        if (benim === istek && acik) ara();
      }).catch(function () {
        dizinHatasi = true;
        if (benim === istek && acik) hataCiz();
      });
      ciz(null, ham, true);
      return;
    }
    if (q.length >= 2 && !window.OBEKLER && !obekHatasi) {
      obekYukle().then(function () { if (acik) yenidenCiz(); })
        .catch(function () { obekHatasi = true; if (acik) yenidenCiz(); });
    }
    ciz(q.length >= 2 ? hesapla(q) : null, ham, false);
  }

  function yenidenCiz() {
    if (!acik) return;
    var q = sonSorgu.q;
    ciz(q.length >= 2 && dizinHazir() ? hesapla(q) : null, sonSorgu.ham, !dizinHazir());
  }

  /* ---------- çizim ---------- */

  function rozet(metin, sinif) {
    return metin ? ' <span class="badge' + (sinif ? ' ' + sinif : '') + '">' + kacar(metin) + '</span>' : '';
  }

  function isaretle(metin) { return aktifQ ? Ortak.vurgula(metin, aktifQ) : kacar(metin); }

  function kutuMetni(tur, anahtar) {
    if (!Il || !Il.kutu) return '';
    return guvenli(function () {
      if (Il.mezunMu && Il.mezunMu(anahtar, tur)) return 'Senin durumun: öğrenildi';
      var k = Il.kutu(anahtar, tur);
      return 'Senin durumun: ' + (KUTU_ADI[k] || KUTU_ADI[0]);
    }) || '';
  }

  function anlamlarHtml(liste) {
    return '<ol class="sozluk-anlamlar">' + (liste || []).map(function (a) {
      return '<li><b>' + kacar(a.tr) + '</b>' +
        (a.ex ? '<span class="sozluk-ornek" lang="en">' + kacar(a.ex) + '</span>' : '') +
        (a.exTr ? '<span class="sozluk-ceviri">' + kacar(a.exTr) + '</span>' : '') + '</li>';
    }).join('') + '</ol>';
  }

  function katmaniGetir(k) {
    if (!k || katmanHatasi[k]) return;
    katmanYukle(k).then(function () {
      if (!window['KELIME_K' + k]) katmanHatasi[k] = true;
      ayrintilariTazele();
    }).catch(function () { katmanHatasi[k] = true; ayrintilariTazele(); });
  }

  function ayrintiHtml(tur, anahtar) {
    if (tur === 'obek') {
      var o = obekBul(anahtar);
      return o ? anlamlarHtml(o.a) : '<p class="small muted">Öbek bilgisi yükleniyor…</p>';
    }
    var tam = tamKayit(anahtar);
    if (!tam) {
      var d = dizinKaydi(anahtar);
      if (!d) return '<p class="small muted">Bu kelime sözlükte bulunamadı.</p>';
      if (window['KELIME_K' + d.k]) return '<p class="small muted">Bu kelimenin örnek cümlesi yok.</p>';
      if (katmanHatasi[d.k]) return '<p class="small muted">Örnek cümleler yüklenemedi. Ayrıntıyı kapatıp yeniden açınca tekrar denenir.</p>';
      katmaniGetir(d.k);
      return '<p class="small muted">Örnek cümleler yükleniyor…</p>';
    }
    var h = anlamlarHtml(tam.a);
    if (tam.kl && tam.kl.length) {
      h += '<p class="sozluk-alt-baslik">Kullanım kalıpları</p><ul class="sozluk-kalip">' +
        tam.kl.map(function (k) {
          return '<li><b lang="en">' + kacar(k.en) + '</b> ' + kacar(k.tr) + '</li>';
        }).join('') + '</ul>';
    }
    if (tam.es) h += '<p class="sozluk-alt-baslik">Yakın anlamlılar</p><p class="sozluk-es" lang="en">' + kacar(tam.es) + '</p>';
    return h;
  }

  /* Sabitlenen ama verisi henüz yok ya da yüklenemeyen öğe: kaldırılabilir kalır. */
  function eksikSatir(tur, anahtar) {
    var hazir = tur === 'obek' ? !!window.OBEKLER : dizinHazir();
    var hata = tur === 'obek' ? obekHatasi : dizinHatasi;
    var durumMetni = hazir ? 'Sözlükte bulunamadı.' : (hata ? 'Bilgisi yüklenemedi.' : 'Yükleniyor…');
    return '<li class="sozluk-sonuc" data-bolum="sabit" data-tur="' + tur + '" data-anahtar="' + kacar(anahtar) + '">' +
      '<div class="sozluk-sonuc-bas"><b class="sozluk-baslik" lang="en">' + kacar(anahtar) + '</b></div>' +
      '<div class="sozluk-kutu">' + durumMetni + '</div>' +
      '<div class="sozluk-dugmeler">' +
        '<button type="button" class="btn ghost sm sozluk-sabitle" data-is="sabitle" aria-pressed="true"' +
          ' aria-label="Sabitle: ' + kacar(anahtar) + '"><span aria-hidden="true">📌</span> Sabitle</button>' +
        (hata && !hazir ? '<button type="button" class="btn ghost sm" data-is="yeniden">Yeniden dene</button>' : '') +
      '</div></li>';
  }

  function satir(bolum, tur, anahtar) {
    var baslik, anlam, rozetler = '';
    if (tur === 'kelime') {
      var d = dizinKaydi(anahtar);
      if (!d) return bolum === 'sabit' ? eksikSatir(tur, anahtar) : '';
      baslik = d.e; anlam = d.t;
      rozetler = rozet(d.y) + rozet(KATMAN_ADI[d.k], 'accent');
    } else {
      var o = obekBul(anahtar);
      if (!o) return bolum === 'sabit' ? eksikSatir(tur, anahtar) : '';
      baslik = o.f;
      anlam = o.a.map(function (a) { return a.tr; }).join('; ');
      rozetler = rozet(o.y) + rozet('öbek', 'accent');
    }
    var id = kimlik(tur, anahtar);
    gorunenler[id] = true;
    var acikMi = !!acikAyrinti[id];
    var sabitMi = sabitIndeks(tur, anahtar) !== -1;
    var no = ++satirNo;
    return '<li class="sozluk-sonuc" data-bolum="' + bolum + '" data-tur="' + tur + '" data-anahtar="' + kacar(anahtar) + '">' +
      '<div class="sozluk-sonuc-bas"><b class="sozluk-baslik" lang="en">' + isaretle(baslik) + '</b>' + rozetler + '</div>' +
      '<div class="sozluk-anlam">' + isaretle(anlam) + '</div>' +
      '<div class="sozluk-kutu">' + kacar(kutuMetni(tur, anahtar)) + '</div>' +
      '<div class="sozluk-dugmeler">' +
        '<button type="button" class="btn ghost sm" data-is="ayrinti" aria-expanded="' + acikMi +
          '" aria-controls="sozlukAyrinti' + no + '" aria-label="Anlamlar ve örnekler: ' + kacar(baslik) + '">' +
          'Anlamlar ve örnekler</button>' +
        '<button type="button" class="btn ghost sm sozluk-sabitle" data-is="sabitle" aria-pressed="' + sabitMi +
          '" aria-label="Sabitle: ' + kacar(baslik) + '"><span aria-hidden="true">📌</span> Sabitle</button>' +
      '</div>' +
      '<div class="sozluk-ayrinti" id="sozlukAyrinti' + no + '"' + (acikMi ? '' : ' hidden') + '>' +
        (acikMi ? ayrintiHtml(tur, anahtar) : '') + '</div>' +
    '</li>';
  }

  function grupHtml(baslik, bolum, tur, liste, anahtarAl) {
    if (!liste.length) return '';
    var gosterilen = liste.slice(0, SINIR);
    return '<h3 class="sozluk-grup-baslik">' + baslik + rozet(String(liste.length)) + '</h3>' +
      '<ul class="sozluk-liste">' + gosterilen.map(function (x) { return satir(bolum, tur, anahtarAl(x)); }).join('') + '</ul>' +
      (liste.length > SINIR
        ? '<p class="small muted">İlk ' + SINIR + ' sonuç gösteriliyor. Aramayı daraltarak diğerlerine ulaşabilirsin.</p>'
        : '');
  }

  function sabitlerHtml() {
    if (!sabitler.length) return '';
    var eksikObek = false;
    var satirlar = sabitler.map(function (s) {
      if (s.tur === 'obek' && !window.OBEKLER) eksikObek = true;
      return satir('sabit', s.tur, s.anahtar);
    }).join('');
    if (eksikObek && !obekHatasi) {
      obekYukle().then(function () { if (acik) yenidenCiz(); })
        .catch(function () { obekHatasi = true; if (acik) yenidenCiz(); });
    }
    return '<section class="sozluk-sabitler" aria-labelledby="sozlukSabitBaslik">' +
      '<h3 class="sozluk-grup-baslik" id="sozlukSabitBaslik">Karşılaştırma için sabitlenenler</h3>' +
      '<ul class="sozluk-liste">' + satirlar + '</ul>' +
      '</section>';
  }

  /* Dış kaynaklar (Google Çeviri, Tureng) başka sitenin içinde gösterilmeyi reddeder
     (X-Frame-Options: SAMEORIGIN); bu yüzden yalnız tıklanınca yeni sekmede açılır.
     Google Çeviri reklamsız olduğu için önce gelir. Bağlantılar kalıcı öğelerdir:
     yalnız adresleri değişir, odaktaki bağlantı yeniden çizimde silinmez. */
  function disGuncelle(ham, turkceMi) {
    var satir = $('sozlukDis');
    ham = String(ham || '').trim();
    if (ham.length < 2) {
      // Odaktaki bağlantı gizlenirse odak sonuç alanına geçer, <body>'ye düşmez.
      if (satir.contains(document.activeElement)) elGovde.focus({ preventScroll: true });
      satir.hidden = true;
      return;
    }
    var t = encodeURIComponent(ham);
    // Türkçe harf varsa ya da eşleşmeler yalnız Türkçe anlamdan geldiyse Türkçeden
    // İngilizceye, yoksa İngilizceden Türkçeye.
    var yon = turkceMi || /[çğıöşüâîûÇĞİÖŞÜ]/.test(ham) ? 'sl=tr&tl=en' : 'sl=en&tl=tr';
    var google = $('sozlukGoogle'), tureng = $('sozlukTureng');
    google.href = 'https://translate.google.com/?' + yon + '&text=' + t + '&op=translate';
    google.setAttribute('aria-label', 'Google Çeviri: ' + ham + ' (yeni sekmede açılır)');
    tureng.href = 'https://tureng.com/tr/turkce-ingilizce/' + t;
    tureng.setAttribute('aria-label', 'Tureng: ' + ham + ' (yeni sekmede açılır)');
    satir.hidden = false;
  }

  function yonergeHtml() {
    return '<div class="sozluk-yonerge">' +
      '<p>İngilizce ya da Türkçe en az iki harf yaz.</p>' +
      '<p>Kartta ya da örnek cümlede bir kelimeyi seçip <b>Sözlükte ara</b> düğmesine basarak da aratabilirsin.</p>' +
      '<p>Benzer kelimeleri karşılaştırmak için sonuçları <b>Sabitle</b>. Sabitlenenler aramalar arasında burada kalır.</p>' +
      '<p class="small muted">Klavye: <kbd>/</kbd> sözlüğü açar, <kbd>Esc</kbd> kapatır. Odak sözlükteyken kart kısayolları çalışmaz.</p>' +
      '</div>';
  }

  /* Yeniden çizimden önce odak paneldeyse sonra da panelde kalmalı. Silinen bir
     öğenin odağı <body>'ye düşerse bir sonraki 1/2/3 tuşu arkadaki kartı yanıtlar. */
  function odakPaneldeKalsin(fn) {
    var o = document.activeElement;
    var icerde = acik && !!o && panel.contains(o);
    fn();
    var s = document.activeElement;
    // Gizlenen bir öğe bir süre daha odakta görünebilir; onu da kayıp say.
    if (icerde && (!s || s === document.body || !panel.contains(s) || s.closest('[hidden]'))) {
      panel.focus({ preventScroll: true });
    }
  }

  /* Tam yeniden çizimde odak panelin içinde kalmalı. Aksi hâlde odak sayfaya
     düşer ve bir sonraki 1/2/3 tuşu arkadaki kartı yanıtlar. */
  function odagiKaydet() {
    var o = document.activeElement;
    if (!o || !elGovde.contains(o)) return null;
    // Yalnız yeniden çizilen bölümlerdeki öğeler silinir; durum satırı ve dış
    // bağlantılar kalıcıdır, odakları olduğu yerde kalır.
    if (!$('sozlukSabitler').contains(o) && !$('sozlukSonuclar').contains(o)) return null;
    var li = o.closest('.sozluk-sonuc');
    if (!li) return { govde: true };
    return {
      bolum: li.getAttribute('data-bolum'), tur: li.getAttribute('data-tur'),
      anahtar: li.getAttribute('data-anahtar'), is: o.getAttribute('data-is')
    };
  }
  function odagiGeriYukle(k) {
    if (!k) return;
    if (!k.govde) {
      var liler = elGovde.querySelectorAll('.sozluk-sonuc');
      for (var i = 0; i < liler.length; i++) {
        var li = liler[i];
        if (li.getAttribute('data-tur') !== k.tur || li.getAttribute('data-anahtar') !== k.anahtar) continue;
        if (li.getAttribute('data-bolum') !== k.bolum) continue;
        var b = k.is ? li.querySelector('[data-is="' + k.is + '"]') : null;
        if (b) { b.focus({ preventScroll: true }); return; }
      }
    }
    elGovde.focus({ preventScroll: true });
  }

  function ciz(sonuc, ham, yukleniyor) {
    odakPaneldeKalsin(function () { cizIc(sonuc, ham, yukleniyor); });
  }

  function cizIc(sonuc, ham, yukleniyor) {
    var odak = odagiKaydet();
    gorunenler = Object.create(null);
    aktifQ = '';
    $('sozlukSabitler').innerHTML = dizinHazir() ? sabitlerHtml() : '';
    aktifQ = sonuc ? sonuc.q : '';
    var html = '';
    if (yukleniyor) {
      html = '<p class="small muted">Sözlük hazırlanıyor…</p>';
    } else if (!sonuc) {
      durum(ham ? 'Aramak için en az iki harf yaz.' : '');
      html = yonergeHtml();
    } else {
      var nK = sonuc.kelime.length, nO = sonuc.obek ? sonuc.obek.length : 0;
      if (nK + nO) {
        durum('“' + ham + '”: ' + nK + ' kelime' + (sonuc.obek ? ', ' + nO + ' öbek' : '') + ' bulundu.');
      } else if (sonuc.obek || obekHatasi) {
        durum('“' + ham + '” sitenin sözlüğünde bulunamadı.');
      } else {
        durum('“' + ham + '” kelimelerde bulunamadı; öbeklere bakılıyor…');
      }
      // Öbek çalışırken öbekler önce gelir: kartın cevabı listenin altında kalmasın.
      var kelimeGrubu = grupHtml('Kelimeler', 'sonuc', 'kelime', sonuc.kelime, function (d) { return d.e; });
      var obekGrubu = sonuc.obek ? grupHtml('Öbekler', 'sonuc', 'obek', sonuc.obek, function (o) { return o.f; }) : '';
      html = (kaynak && kaynak.once === 'obek' ? obekGrubu + kelimeGrubu : kelimeGrubu + obekGrubu) +
        (!sonuc.obek && !obekHatasi ? '<p class="small muted">Öbekler yükleniyor…</p>' : '') +
        (obekHatasi ? '<p class="small muted">Öbekler yüklenemedi; yalnız kelimeler gösteriliyor. ' +
          '<button type="button" class="btn ghost sm" data-is="yeniden">Yeniden dene</button></p>' : '') +
        (nK + nO ? '' : '<p>Farklı bir yazım, Türkçe karşılığını ya da yukarıdaki Google Çeviri ve Tureng bağlantılarını dene.</p>');
    }
    $('sozlukSonuclar').innerHTML = html;
    disGuncelle(ham, sonuc ? turkceSonucMu(sonuc) : false);
    odagiGeriYukle(odak);
    denetle();
  }

  function hataCiz() {
    odakPaneldeKalsin(hataCizIc);
  }

  function hataCizIc() {
    durum('Sözlük yüklenemedi.');
    $('sozlukSabitler').innerHTML = '';
    $('sozlukSonuclar').innerHTML = '<p>Kelime dizini indirilemedi. Bağlantını kontrol edip yeniden dene.</p>' +
      '<p><button type="button" class="btn ghost sm" data-is="yeniden">Yeniden dene</button></p>';
    disGuncelle(elAra.value);
    denetle();
  }

  function ayrintilariTazele(sadeceId) {
    odakPaneldeKalsin(function () { ayrintilariTazeleIc(sadeceId); });
  }

  function ayrintilariTazeleIc(sadeceId) {
    Array.prototype.forEach.call(elGovde.querySelectorAll('.sozluk-sonuc'), function (li) {
      var tur = li.getAttribute('data-tur'), anahtar = li.getAttribute('data-anahtar');
      var id = kimlik(tur, anahtar);
      if (sadeceId && id !== sadeceId) return;
      var acikMi = !!acikAyrinti[id];
      var dugme = li.querySelector('[data-is="ayrinti"]');
      var kutu = li.querySelector('.sozluk-ayrinti');
      if (!dugme || !kutu) return;
      dugme.setAttribute('aria-expanded', acikMi ? 'true' : 'false');
      kutu.hidden = !acikMi;
      kutu.innerHTML = acikMi ? ayrintiHtml(tur, anahtar) : '';
    });
    denetimiPlanla();
  }

  /* ---------- kartın cevabı görüldü mü? ---------- */

  /* Cevap ancak gerçekten ekranda görünürse ipucu sayılır: aşağıda kalan, hiç
     kaydırılıp bakılmamış satır sayılmaz. Ölçüm geometriktir; her çizimde, panel ya
     da sonuç alanı kaydırıldığında ve pencere boyutu değiştiğinde yeniden yapılır.
     Anlam satırının %60'ı ya da en az 24 pikseli (açılmış ayrıntıda da) görünmeli. */
  function gorunenYukseklik(el) {
    var r = el.getBoundingClientRect();
    if (!r.height) return { gorunen: 0, yukseklik: 0 };
    var p = panel.getBoundingClientRect(), g = elGovde.getBoundingClientRect();
    // Yapışık uyarı çıkarılmaz: uyarı yalnız bu kartın cevabı görülmüşse görünür;
    // yeni kart için gizlenir ve altındaki satır zaten açığa çıkar.
    var ust = Math.max(r.top, p.top, g.top, 0);
    var alt = Math.min(r.bottom, p.bottom, g.bottom, window.innerHeight);
    return { gorunen: Math.max(0, alt - ust), yukseklik: r.height };
  }

  /* Aynı başlık hem kelime hem öbek olabilir; ikisinin satırı da cevabı gösterir. */
  function gorundu(anahtar) {
    if (!acik || document.hidden) return false;
    var liler = elGovde.querySelectorAll('.sozluk-sonuc');
    for (var i = 0; i < liler.length; i++) {
      if (liler[i].getAttribute('data-anahtar') !== anahtar) continue;
      // Ayrıntıda "yükleniyor" metni değil, gerçek anlam listesi ölçülür.
      var parcalar = liler[i].querySelectorAll('.sozluk-anlam, .sozluk-ayrinti .sozluk-anlamlar');
      for (var j = 0; j < parcalar.length; j++) {
        if (parcalar[j].closest('[hidden]')) continue;
        var o = gorunenYukseklik(parcalar[j]);
        if (o.gorunen > 0 && o.gorunen >= Math.min(24, o.yukseklik * 0.6)) return true;
      }
    }
    return false;
  }

  var denetimBekliyor = false;
  function denetimiPlanla() {
    if (denetimBekliyor || !acik) return;
    denetimBekliyor = true;
    window.requestAnimationFrame(function () { denetimBekliyor = false; denetle(); });
  }

  /* Sonuçlar Türkçe bir sorgudan mı geldi? İngilizce başlıkla eşleşme yoksa ve
     yalnız Türkçe anlamlar eşleştiyse evet. */
  function turkceSonucMu(sonuc) {
    var q = sonuc.q;
    var baslikta = sonuc.kelime.some(function (d) { return sadelestir(d.e).indexOf(q) !== -1; }) ||
      (sonuc.obek || []).some(function (o) { return sadelestir(o.f).indexOf(q) !== -1; });
    return !baslikta && (sonuc.kelime.length > 0 || !!(sonuc.obek && sonuc.obek.length));
  }

  function duyur(metin) {
    var d = $('sozlukDuyuru');
    d.textContent = '';
    window.setTimeout(function () { d.textContent = metin; }, 60);
  }

  function denetle() {
    var uyari = $('sozlukUyari');
    var a = acik && kaynak && typeof kaynak.aktif === 'function' ? guvenli(kaynak.aktif) : null;
    if (!a || !a.anahtar) { uyari.hidden = true; return; }
    var isaretli = function () {
      return typeof kaynak.isaretli === 'function' &&
        !!guvenli(function () { return kaynak.isaretli(a.anahtar); });
    };
    var once = isaretli();
    var simdi = gorundu(a.anahtar);
    // Sayfanın goruldu() işlevi tekrar çağrılmaya dayanıklıdır. Her görünüşte
    // bildirmek, cevaplanan kart yeniden geldiğinde de kuralı korur.
    if (simdi && typeof kaynak.goruldu === 'function') {
      guvenli(function () { kaynak.goruldu(a.anahtar, a.tur); });
    }
    var sonra = simdi || isaretli();
    uyari.hidden = !sonra;
    if (sonra && !once) duyur('Çalıştığın kartın anlamı sözlükte göründü. “Bildim” dersen cevap ipucuyla sayılır.');
  }

  /* ---------- olaylar ---------- */

  // Odak paneldeyken tuşlar sayfaya ulaşmaz: kart ve günün testi kısayolları
  // belge düzeyinde dinlediği için bu tek yerde durdurmak yeterlidir.
  panel.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !e.isComposing) { e.preventDefault(); kapat(); }
    e.stopPropagation();
  });

  $('sozlukForm').addEventListener('submit', function (e) { e.preventDefault(); ara(); });
  elAra.addEventListener('input', planla);
  $('sozlukKapat').addEventListener('click', kapat);
  $('sozlukBoy').addEventListener('click', function () {
    buyuk = !buyuk;
    this.textContent = buyuk ? 'Küçült' : 'Büyüt';
    yerlesim();
    denetimiPlanla();
  });
  // Panel ya da sonuçların boyutu değişince (Büyüt, ayrıntı, geç gelen veri, yazı
  // boyutu) görünürlük yeniden ölçülür.
  if (typeof window.ResizeObserver === 'function') {
    var boyutGozcusu = new window.ResizeObserver(function () { denetimiPlanla(); });
    [panel, $('sozlukSabitler'), $('sozlukSonuclar')].forEach(function (el) { boyutGozcusu.observe(el); });
  }
  // Ekran klavyesi arama kutusuyla açılıp kapanır.
  elAra.addEventListener('focus', function () { if (acik) yerlesim(); });
  elAra.addEventListener('blur', function () { if (acik) yerlesim(); });

  elGovde.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-is]');
    if (!b || !elGovde.contains(b)) return;
    var is = b.getAttribute('data-is');
    if (is === 'yeniden') {
      dizinHatasi = false; obekHatasi = false; katmanHatasi = {};
      ara();
      return;
    }
    var li = b.closest('.sozluk-sonuc');
    if (!li) return;
    var tur = li.getAttribute('data-tur'), anahtar = li.getAttribute('data-anahtar');
    var id = kimlik(tur, anahtar);
    if (is === 'ayrinti') {
      if (acikAyrinti[id]) delete acikAyrinti[id];
      else {
        acikAyrinti[id] = true;
        // Önceki yükleme hatası kalıcı olmasın: açınca yeniden denenir.
        var dk = tur === 'kelime' ? dizinKaydi(anahtar) : null;
        if (dk) delete katmanHatasi[dk.k];
      }
      ayrintilariTazele(id);
    } else if (is === 'sabitle') {
      var i = sabitIndeks(tur, anahtar);
      if (i >= 0) sabitler.splice(i, 1);
      else {
        sabitler.unshift({ tur: tur, anahtar: anahtar });
        if (sabitler.length > SABIT_SINIRI) sabitler.length = SABIT_SINIRI;
      }
      sabitleriYaz();
      yenidenCiz();
      durum(i >= 0 ? anahtar + ' sabitlerden çıkarıldı.' : anahtar + ' karşılaştırma için sabitlendi.');
    }
  });

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-sozluk-ac]');
    if (!b) return;
    e.preventDefault();
    if (acik) kapat(); else ac('', { acan: b });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || e.isComposing) return;
    var h = document.activeElement;
    if (h && (h.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(h.tagName))) return;
    e.preventDefault();
    ac('', { acan: h && h !== document.body ? h : null });
  });

  if (yanMedya) {
    // Ekran döndürme ya da eşik geçişi: görünen kart görünür kalsın.
    var degisti = function () { if (acik) boyutDegisti(); else yerlesim(); };
    if (yanMedya.addEventListener) yanMedya.addEventListener('change', degisti);
    else if (yanMedya.addListener) yanMedya.addListener(degisti);
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function () { if (acik) { yerlesim(); denetimiPlanla(); } });
    window.visualViewport.addEventListener('scroll', function () { if (acik) yerlesim(); });
  }
  window.addEventListener('resize', boyutDegisti);
  // Kaydırınca görünürlük yeniden ölçülür; kartın ekranda olup olmadığı kaydedilir.
  elGovde.addEventListener('scroll', denetimiPlanla, { passive: true });
  panel.addEventListener('scroll', denetimiPlanla, { passive: true });
  window.addEventListener('scroll', function () { if (acik) kartDurumunuKaydet(); }, { passive: true });
  document.addEventListener('visibilitychange', denetimiPlanla);

  /* ---------- seçili metni aratma ---------- */

  var secimMetni = '';
  var secimBekleme = null;
  // Seçim yalnız ekran dışına kaydığı için gizlendiyse geri kaydırılınca düğme yeniden görünür.
  var secimDisarida = false;

  function secimGizle() {
    // Odaktaki düğme gizlenirse odak <body>'ye düşer ve sonraki 1/2/3 tuşu kartı
    // yanıtlar. Panel açıksa başlığa, değilse karta ya da ana bölgeye dön.
    if (document.activeElement === secimDugme) {
      var hedef = acik ? $('sozlukBaslik') : (kartOgesi() || document.querySelector('main'));
      if (hedef && hedef.tagName === 'MAIN' && !hedef.hasAttribute('tabindex')) hedef.setAttribute('tabindex', '-1');
      if (hedef) hedef.focus({ preventScroll: true });
    }
    secimDugme.hidden = true;
    secimMetni = '';
    secimDisarida = false;
  }

  function secimiDenetle() {
    var s = window.getSelection ? window.getSelection() : null;
    if (!s || s.isCollapsed || !s.rangeCount) { secimGizle(); return; }
    var r = s.getRangeAt(0);
    var metin = String(r).replace(/\s+/g, ' ').trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (metin.length < 2 || metin.length > 60 || metin.split(' ').length > 5) { secimGizle(); return; }
    var kap = r.commonAncestorContainer;
    if (kap && kap.nodeType !== 1) kap = kap.parentNode;
    if (!kap || !kap.closest || !kap.closest('main, #sozlukPanel') ||
        kap.closest('input, textarea, select, [contenteditable="true"]')) { secimGizle(); return; }
    var kutu = r.getBoundingClientRect();
    if (!kutu.width && !kutu.height) { secimGizle(); return; }
    if (kutu.bottom < 0 || kutu.top > window.innerHeight) { secimGizle(); secimDisarida = true; return; }
    secimMetni = metin;
    secimDugme.hidden = false;
    var gen = secimDugme.offsetWidth, yuk = secimDugme.offsetHeight;
    var ust = kutu.bottom + 8;
    if (ust + yuk > window.innerHeight - 8) ust = Math.max(8, kutu.top - yuk - 8);
    var sol = Math.min(Math.max(8, kutu.left + kutu.width / 2 - gen / 2),
      document.documentElement.clientWidth - gen - 8);
    secimDugme.style.top = Math.round(ust) + 'px';
    secimDugme.style.left = Math.round(Math.max(8, sol)) + 'px';
  }

  document.addEventListener('selectionchange', function () {
    window.clearTimeout(secimBekleme);
    secimBekleme = window.setTimeout(secimiDenetle, 180);
  });
  window.addEventListener('scroll', function () { if (!secimDugme.hidden || secimDisarida) secimiDenetle(); },
    { passive: true, capture: true });
  // Düğmeye basmak seçimi ve odağı bozmasın.
  secimDugme.addEventListener('mousedown', function (e) { e.preventDefault(); });
  // Klavyeyle bu düğmeye gelinirse de kart kısayolları tetiklenmesin.
  secimDugme.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); secimGizle(); }
    e.stopPropagation();
  });
  secimDugme.addEventListener('click', function () {
    var metin = secimMetni;
    var donus = acik ? null : kartOgesi();
    secimGizle();
    if (!metin) return;
    guvenli(function () { window.getSelection().removeAllRanges(); });
    ac(metin, { odak: 'baslik', acan: donus });
  });

  /* ---------- dışa açılan ---------- */

  dugmeleriGuncelle();

  Y.Sozluk = {
    ac: ac,
    kapat: kapat,
    acikMi: function () { return acik; },
    /* Sayfanın kart bağlantısı:
       aktif()  → çevrilmemiş kart varsa {tur: 'kelime'|'obek', anahtar}, yoksa null
       goruldu(anahtar, tur) → o kartın anlamı panelde göründü; tekrar çağrılabilir
       isaretli(anahtar) → sayfa bu kartı ipucuyla sayacak mı
       once: 'obek' → sonuçlarda öbekler kelimelerden önce gelsin */
    kaynakBagla: function (k) { kaynak = k || null; denetle(); },
    /* Kart değişince sayfa çağırır: yeni kartın cevabı zaten panelde mi? */
    denetle: denetle
  };
})();
