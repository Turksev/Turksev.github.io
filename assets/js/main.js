/* ============================================================
   Ortak yardımcılar: tema, menü, localStorage
   Her sayfada <head> içinde yüklenir (defer'siz kısmı tema için).
   ============================================================ */

(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ---------- tema ---------- */

  var THEME_KEY = 'yds-tema';

  function kayitliTema() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function temaUygula(t) {
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  // Sayfa boyanmadan önce çalışsın diye script <head>'de, senkron duruyor.
  temaUygula(kayitliTema());

  function temaDegistir() {
    var suan = document.documentElement.getAttribute('data-theme');
    if (!suan) {
      // Sistem tercihinin tersine geç.
      var karanlikMi = window.matchMedia('(prefers-color-scheme: dark)').matches;
      suan = karanlikMi ? 'dark' : 'light';
    }
    var yeni = suan === 'dark' ? 'light' : 'dark';
    temaUygula(yeni);
    try { localStorage.setItem(THEME_KEY, yeni); } catch (e) {}
    butonuGuncelle();
  }

  function butonuGuncelle() {
    var btn = document.querySelector('.theme-toggle:not(.esit-dugme)');
    if (!btn) return;
    var karanlik = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    btn.textContent = karanlik ? '☀' : '☾';
    btn.setAttribute('title', karanlik ? 'Aydınlık temaya geç' : 'Karanlık temaya geç');
    btn.setAttribute('aria-label', btn.getAttribute('title'));
  }

  /* ---------- depolama yardımcıları ---------- */

  var Depo = {
    oku: function (anahtar, varsayilan) {
      try {
        var ham = localStorage.getItem(anahtar);
        return ham === null ? varsayilan : JSON.parse(ham);
      } catch (e) {
        return varsayilan;
      }
    },
    yaz: function (anahtar, deger) {
      try { localStorage.setItem(anahtar, JSON.stringify(deger)); return true; }
      catch (e) { return false; }
    },
    sil: function (anahtar) {
      try { localStorage.removeItem(anahtar); return true; }
      catch (e) { return false; }
    }
  };

  /* ---------- küçük araçlar ---------- */

  // Türkçe'ye duyarlı, aksansız karşılaştırma için sadeleştirme.
  function sadelestir(s) {
    return (s || '')
      .toLocaleLowerCase('tr')
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');
  }

  function karistir(dizi) {
    var d = dizi.slice();
    for (var i = d.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = d[i]; d[i] = d[j]; d[j] = t;
    }
    return d;
  }

  function kacar(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function hareket() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto' : 'smooth';
  }

  /* ---------- güvenli yeniden yükleme koordinatörü ----------
     Servis çalışanı ve ilk bulut birleşimi aynı açılışta yenileme
     isteyebilir. Bütün teknik yenilemeler bu tek kapıdan geçer; aynı belge
     yaşamında kaç istek gelirse gelsin yalnız bir kez yeniden yüklenir. */

  var yenidenYuklemePlanlandi = false;
  var yenidenYuklemeNedenleri = Object.create(null);

  function yenidenYukle(neden) {
    yenidenYuklemeNedenleri[String(neden || 'bilinmiyor')] = true;
    if (yenidenYuklemePlanlandi) return false;
    yenidenYuklemePlanlandi = true;

    // Aynı olay turunda gelen SW + bulut isteklerinin birleşmesine fırsat ver.
    setTimeout(function () {
      try {
        sessionStorage.setItem('yds-son-yeniden-yukleme', JSON.stringify({
          zaman: Date.now(),
          yol: location.pathname,
          nedenler: Object.keys(yenidenYuklemeNedenleri)
        }));
      } catch (e) {}
      location.reload();
    }, 100);
    return true;
  }

  /* ---------- gezinme: aktif bağlantı ---------- */

  function aktifBaglanti() {
    var yol = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      var hedef = a.getAttribute('href');
      if (hedef === yol || (yol === 'index.html' && hedef === './')) {
        a.setAttribute('aria-current', 'page');
        /* Bağlantı açılır bir grubun içindeyse grup başlığı da vurgulanır.
           Grup bilerek açılmıyor: yoksa o sayfa her açıldığında panel açık gelirdi. */
        var grup = a.closest ? a.closest('.nav-grup') : null;
        if (grup) grup.classList.add('etkin');
      }
    });
  }

  /* ---------- ortak erişilebilir gezinme ---------- */

  function sayfaIskeleti() {
    var ana = document.querySelector('main');
    if (ana) {
      if (!ana.id) ana.id = 'anaIcerik';
      if (!ana.hasAttribute('tabindex')) ana.setAttribute('tabindex', '-1');
      if (!document.querySelector('.skip-link')) {
        var atla = document.createElement('a');
        atla.className = 'skip-link';
        atla.href = '#' + ana.id;
        atla.textContent = 'Ana içeriğe geç';
        document.body.insertBefore(atla, document.body.firstChild);
      }
    }

    var nav = document.querySelector('.site-nav');
    if (nav) {
      nav.id = nav.id || 'anaMenu';
      nav.setAttribute('aria-label', 'Ana menü');

      var dugme = document.createElement('button');
      dugme.type = 'button';
      dugme.className = 'menu-toggle';
      dugme.setAttribute('aria-controls', nav.id);
      dugme.setAttribute('aria-expanded', 'false');
      dugme.setAttribute('aria-label', 'Ana menüyü aç');
      dugme.innerHTML = '<span aria-hidden="true">☰</span><span>Menü</span>';
      nav.parentNode.insertBefore(dugme, nav);

      function menuDurumu(acik) {
        nav.classList.toggle('acik', acik);
        dugme.setAttribute('aria-expanded', acik ? 'true' : 'false');
        dugme.setAttribute('aria-label', acik ? 'Ana menüyü kapat' : 'Ana menüyü aç');
      }
      dugme.addEventListener('click', function () {
        menuDurumu(dugme.getAttribute('aria-expanded') !== 'true');
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) menuDurumu(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && dugme.getAttribute('aria-expanded') === 'true') {
          menuDurumu(false);
          dugme.focus();
        }
      });
      document.addEventListener('click', function (e) {
        if (dugme.getAttribute('aria-expanded') === 'true' &&
            !nav.contains(e.target) && !dugme.contains(e.target)) menuDurumu(false);
      });

      /* Açılır gruplar (Gramer, Sorular). Açıp kapama işini <details> kendi
         yapıyor; burada yalnızca aynı anda tek panelin açık kalmasını, dışarıya
         tıklayınca ve Esc ile kapanmasını sağlıyoruz. */
      var gruplar = [].slice.call(nav.querySelectorAll('.nav-grup'));
      gruplar.forEach(function (g) {
        g.addEventListener('toggle', function () {
          if (!g.open) return;
          gruplar.forEach(function (o) { if (o !== g) o.open = false; });
        });
      });
      if (gruplar.length) {
        document.addEventListener('click', function (e) {
          gruplar.forEach(function (g) { if (g.open && !g.contains(e.target)) g.open = false; });
        });
        document.addEventListener('keydown', function (e) {
          if (e.key !== 'Escape') return;
          gruplar.forEach(function (g) {
            if (!g.open) return;
            g.open = false;
            var baslik = g.querySelector('summary');
            if (baslik) baslik.focus();
          });
        });
      }
    }

    document.querySelectorAll('button[title]:not([aria-label])').forEach(function (b) {
      b.setAttribute('aria-label', b.getAttribute('title'));
    });
    document.querySelectorAll('.progress').forEach(function (p) {
      if (!p.hasAttribute('role')) p.setAttribute('role', 'progressbar');
      if (!p.hasAttribute('aria-valuemin')) p.setAttribute('aria-valuemin', '0');
      if (!p.hasAttribute('aria-valuemax')) p.setAttribute('aria-valuemax', '100');
      if (!p.hasAttribute('aria-valuenow')) p.setAttribute('aria-valuenow', '0');
    });

  }

  /* ---------- çevrimdışı çalışma ---------- */

  function servisCalisaniniKaydet() {
    // file:// üzerinde ve HTTPS olmayan sunucularda çalışmaz; sessizce geç.
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

    function guncellemeBildir(kayit) {
      if (!kayit.waiting || document.getElementById('surumBildirimi')) return;
      var kutu = document.createElement('div');
      kutu.id = 'surumBildirimi';
      kutu.className = 'surum-bildirimi';
      kutu.setAttribute('role', 'status');
      kutu.innerHTML = '<span>Yeni sürüm hazır.</span>' +
        '<button class="btn sm" type="button">Şimdi güncelle</button>' +
        '<button class="btn ghost sm" type="button">Sonra</button>';
      var dugmeler = kutu.querySelectorAll('button');
      dugmeler[0].addEventListener('click', function () {
        try { sessionStorage.setItem('yds-sw-yenile', '1'); } catch (e) {}
        kayit.waiting.postMessage({ type: 'YENI_SURUMU_ETKINLESTIR' });
      });
      dugmeler[1].addEventListener('click', function () { kutu.remove(); });
      document.body.appendChild(kutu);
    }

    navigator.serviceWorker.addEventListener('controllerchange', function () {
      var onayli = false;
      try {
        onayli = sessionStorage.getItem('yds-sw-yenile') === '1';
        sessionStorage.removeItem('yds-sw-yenile');
      } catch (e) {}
      if (onayli) yenidenYukle('servis-calisani');
    });

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (kayit) {
        guncellemeBildir(kayit);
        kayit.addEventListener('updatefound', function () {
          var yeni = kayit.installing;
          if (!yeni) return;
          yeni.addEventListener('statechange', function () {
            if (yeni.state === 'installed' && navigator.serviceWorker.controller) {
              guncellemeBildir(kayit);
            }
          });
        });
        kayit.update();
        setInterval(function () { kayit.update(); }, 30 * 60 * 1000);
      }).catch(function () { /* önemli değil */ });
    });
  }

  /* ---------- depo kullanımı ----------
     GitHub Pages'in yumuşak sınırı 1 GB. Yayımlanan dosyaların toplamı
     data/depo.js içinde (tools/depo-olcu.py üretir); burada yalnız gösteririz.
     30.08.2026: alt bilgideki bağlantı üçlüsünün yerini aldı ve her sayfada
     görünür oldu (önce yalnız localhost/?debug=depo ile açılıyordu). */

  function boyut(bayt) {
    if (bayt >= 1048576) return (bayt / 1048576).toFixed(1).replace('.', ',') + ' MB';
    if (bayt >= 1024) return Math.round(bayt / 1024) + ' KB';
    return bayt + ' B';
  }

  function depoCubugu() {
    var d = window.DEPO;
    var alt = document.querySelector('.site-footer .wrap');
    if (!d || !d.bayt || !alt || alt.querySelector('.depo')) return;

    var yuzde = d.bayt / d.sinir * 100;
    var sinif = yuzde >= 90 ? 'dolu' : (yuzde >= 70 ? 'yarim' : '');
    var yazi = yuzde < 10 ? yuzde.toFixed(1).replace('.', ',') : Math.round(yuzde);

    var ayrinti = (d.klasor || []).map(function (k) {
      return k.ad + ' ' + boyut(k.bayt);
    }).join(' · ');

    var el = document.createElement('span');
    el.className = 'depo' + (sinif ? ' ' + sinif : '');
    el.title = d.dosya + ' dosya · ' + ayrinti +
      '\nSon ölçüm: ' + d.zaman + ' · GitHub Pages yumuşak sınırı 1 GB';
    el.innerHTML =
      '<span class="depo-yazi">Depo <b>%' + yazi + '</b> dolu · ' + boyut(d.bayt) + ' / 1 GB</span>' +
      '<span class="depo-bar"><i style="width:' + Math.max(0.6, Math.min(100, yuzde)) + '%"></i></span>';
    alt.appendChild(el);
  }

  /* ---------- başlat ---------- */

  function baslat() {
    sayfaIskeleti();
    servisCalisaniniKaydet();
    var btn = document.querySelector('.theme-toggle:not(.esit-dugme)');
    if (btn) btn.addEventListener('click', temaDegistir);
    butonuGuncelle();
    aktifBaglanti();

    depoCubugu();

    var yil = document.querySelector('[data-yil]');
    if (yil) yil.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }

  /* ---------- geri alınamaz işlemler için iki aşamalı onay ----------
     Sıfırlama düğmeleri tek tıkla ilerlemeyi siliyordu. Artık iki ayrı soru
     sorulur: ilki ne silineceğini sayısıyla söyler, ikincisi son uyarıdır.
     Eşitleme açıksa silme diğer cihazlara da gider — bunu da yazarız. */

  function ikiKereSor(ne, sayi) {
    var esitli = !!(window.FIREBASE_AYAR);
    var ilk = ne + '\n\n' +
      (sayi ? sayi + ' kayıt silinecek.\n' : '') +
      'Bu işlem geri alınamaz.' +
      (esitli ? '\nEşitleme açıksa silme diğer cihazlarına da yansır.' : '') +
      '\n\nDevam edilsin mi?';
    if (!window.confirm(ilk)) return false;
    return window.confirm('SON UYARI\n\n' +
      (sayi ? sayi + ' kayıt' : 'İlerlemen') + ' kalıcı olarak silinecek. Gerçekten emin misin?');
  }

  function depolamaUyarisi() {
    window.alert('İlerleme tarayıcıya kaydedilemedi. Depolama alanını kontrol edip tekrar dene. Mevcut ilerlemen korundu; bu işlem uygulanmadı.');
  }

  /* Sıfırlamadan sonra "Geri al" kutusunu yönetir. Yedek Ilerleme modülünde
     tutulur; burada yalnız gösterim ve tıklama vardır. */
  function geriAlKutusu(sonra) {
    var kutu = document.getElementById('geriAlKutu');
    if (!kutu || !window.YDS.Ilerleme || !window.YDS.Ilerleme.yedekBilgisi) return function () {};
    var Il = window.YDS.Ilerleme;

    function ciz() {
      var y = Il.yedekBilgisi();
      // Yedek yalnız 7 gün sunulur; sonrası kullanıcıyı yanıltır.
      if (!y || Date.now() - y.zaman > 7 * 86400000) { kutu.hidden = true; return; }
      kutu.hidden = false;
      var d = new Date(y.zaman);
      document.getElementById('geriAlMetin').textContent =
        'Son sıfırlama (' + d.toLocaleDateString('tr-TR') + ' ' +
        d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ', ' +
        y.kayit + ' kayıt) geri alınabilir.';
    }

    document.getElementById('geriAl').addEventListener('click', function () {
      if (!Il.yedegiGeriAl()) { depolamaUyarisi(); return; }
      kutu.hidden = true;
      if (sonra) sonra();
    });

    ciz();
    return ciz;
  }

  /* Anlam yıldızı: çok anlamlı kelimelerde bu anlamın YDS önemi (1-4).
     Dolu yıldız kadar önemli; boşlar ölçeği görünür kılar (★★★☆). */
  var YILDIZ_BASLIK = {
    4: 'YDS\'de asıl sorulan anlam',
    3: 'Sık geçer, bilinmeli',
    2: 'Ara sıra geçer',
    1: 'Nadir, ikincil anlam'
  };

  function yildiz(a) {
    var n = a && a.yz;
    if (!n) return '';
    return '<span class="yildiz" title="' + YILDIZ_BASLIK[n] + '">' +
           '<b>' + Array(n + 1).join('★') + '</b>' +
           Array(5 - n).join('☆') + '</span>';
  }

  /* Kartın içinde metin seçili mi? Kartın her yeri tıklanınca çevrilir; ama
     kullanıcı örnek cümleyi kopyalamak için sürüklediyse ya da bir kelimeye
     çift tıkladıysa kart çevrilmemeli — yoksa seçim anında kaybolur.
     Seçim ucu kartın dışındaysa (sayfanın başka yerinden sürüklenmişse)
     tıklama normal davranır. */
  function metinSecildi(el) {
    var s = window.getSelection ? window.getSelection() : null;
    if (!s || s.isCollapsed || !s.rangeCount) return false;
    // Metin Selection'dan değil Range'den okunuyor: Selection.toString()
    // odaklanmamış belgede (başsız tarayıcı, test koşumu) boş dönebiliyor,
    // Range.toString() her durumda seçili metni veriyor.
    if (!String(s.getRangeAt(0)).trim()) return false;
    return el.contains(s.anchorNode) || el.contains(s.focusNode);
  }

  window.YDS = {
    Depo: Depo, sadelestir: sadelestir, karistir: karistir, kacar: kacar,
    ikiKereSor: ikiKereSor, geriAlKutusu: geriAlKutusu, yildiz: yildiz,
    yenidenYukle: yenidenYukle, depolamaUyarisi: depolamaUyarisi,
    hareket: hareket, metinSecildi: metinSecildi
  };
})();
