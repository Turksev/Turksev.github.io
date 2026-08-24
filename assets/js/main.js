/* ============================================================
   Ortak yardımcılar: tema, menü, localStorage
   Her sayfada <head> içinde yüklenir (defer'siz kısmı tema için).
   ============================================================ */

(function () {
  'use strict';

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
    var btn = document.querySelector('.theme-toggle');
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
      try { localStorage.removeItem(anahtar); } catch (e) {}
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

  /* ---------- gezinme: aktif bağlantı ---------- */

  function aktifBaglanti() {
    var yol = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      var hedef = a.getAttribute('href');
      if (hedef === yol || (yol === 'index.html' && hedef === './')) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- çevrimdışı çalışma ---------- */

  function servisCalisaniniKaydet() {
    // file:// üzerinde ve HTTPS olmayan sunucularda çalışmaz; sessizce geç.
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

    /* Yeni sürüm yayımlandığında sayfa ESKİ kodla çalışmaya devam ediyordu:
       servis çalışanı dosyaları arka planda tazeliyor, sayfa ancak BİR SONRAKİ
       açılışta yeni kodu görüyordu. Bu yüzden bir düzeltme (ör. sıfırlamada çift
       onay) kullanıcıya bir tur geç ulaşıyordu. Yeni sürüm devralır almaz sayfayı
       bir kez tazeliyoruz; bayrak, tazeleme döngüsünü keser. */
    var tazelendi = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (tazelendi) return;
      tazelendi = true;
      location.reload();
    });

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (kayit) {
        kayit.update();                                  // her açılışta yeni sürümü sor
        setInterval(function () { kayit.update(); }, 30 * 60 * 1000);
      }).catch(function () { /* önemli değil */ });
    });
  }

  /* ---------- depo kullanımı ----------
     GitHub Pages'in yumuşak sınırı 1 GB. Yayımlanan dosyaların toplamı
     data/depo.js içinde (tools/depo-olcu.py üretir); burada yalnız gösteririz. */

  function boyut(bayt) {
    if (bayt >= 1048576) return (bayt / 1048576).toFixed(1).replace('.', ',') + ' MB';
    if (bayt >= 1024) return Math.round(bayt / 1024) + ' KB';
    return bayt + ' B';
  }

  function depoCubugu() {
    var d = window.DEPO;
    var alt = document.querySelector('.site-footer .wrap');
    if (!d || !d.bayt || !alt) return;

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
      '<span class="depo-yazi">Depo: <b>' + boyut(d.bayt) + '</b> / 1 GB (%' + yazi + ')</span>' +
      '<span class="depo-bar"><i style="width:' + Math.max(0.6, Math.min(100, yuzde)) + '%"></i></span>';
    alt.appendChild(el);
  }

  /* ---------- başlat ---------- */

  function baslat() {
    servisCalisaniniKaydet();
    var btn = document.querySelector('.theme-toggle');
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
      if (!Il.yedegiGeriAl()) return;
      kutu.hidden = true;
      if (sonra) sonra();
    });

    ciz();
    return ciz;
  }

  window.YDS = {
    Depo: Depo, sadelestir: sadelestir, karistir: karistir, kacar: kacar,
    ikiKereSor: ikiKereSor, geriAlKutusu: geriAlKutusu
  };
})();
