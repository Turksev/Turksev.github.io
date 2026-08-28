/* ============================================================
   Bağlaç bankası: arama, ilişki/yapı/düzey filtresi, içindekiler vurgusu
   ============================================================ */

(function () {
  'use strict';

  var sadelestir = window.YDS.sadelestir;
  var kacar = window.YDS.kacar;
  var TUM = window.BAGLACLAR || [];

  var $ = function (id) { return document.getElementById(id); };
  var elAra = $('ara'), elIliski = $('iliski'), elYapi = $('yapiFiltre'), elDuzey = $('duzey');
  var elListe = $('liste'), elSayac = $('sayac'), elBos = $('bos');

  var YAPI_ETIKET = {
    'cümle': '+ cümle',
    'isim': '+ isim / V-ing',
    'zarf': 'cümle zarfı',
    'eş': 'eş bağlaç',
    'ikili': 'ikili çift'
  };

  function iliskiler(b) {
    return Array.isArray(b.ils) && b.ils.length ? b.ils : [b.il];
  }

  function yapilar(b) {
    return Array.isArray(b.yps) && b.yps.length ? b.yps : [b.yp];
  }

  /* ---------- ilişki menüsünü veriden doldur ---------- */

  function iliskileriDoldur() {
    var sirali = [];
    TUM.forEach(function (b) {
      iliskiler(b).forEach(function (il) {
        if (sirali.indexOf(il) === -1) sirali.push(il);
      });
    });
    sirali.forEach(function (il) {
      var n = TUM.filter(function (b) { return iliskiler(b).indexOf(il) !== -1; }).length;
      var o = document.createElement('option');
      o.value = il;
      o.textContent = il + ' (' + n + ')';
      elIliski.appendChild(o);
    });
  }

  /* ---------- çizim ---------- */

  function ornekler(b) {
    return b.or.map(function (o) {
      var baslik = o.et
        ? '<b style="color:var(--accent)">' + kacar(o.et) + '</b> — ' + kacar(o.kr) + '<br>'
        : '';
      return '<div class="ex" style="margin-top:8px">' + baslik +
             '<i>' + kacar(o.en) + '</i>' +
             '<i class="tr-ex">' + kacar(o.tr) + '</i></div>';
    }).join('');
  }

  function satir(b, sira) {
    return '' +
      '<article class="word">' +
        '<div>' +
          '<div class="en"><span class="sira">' + sira + '.</span> ' + kacar(b.f) + '</div>' +
          '<div class="tr">' + kacar(b.tr) + '</div>' +
          '<div class="meta">' +
            iliskiler(b).map(function (il) {
              return '<span class="badge accent">' + kacar(il) + '</span>';
            }).join('') +
            yapilar(b).map(function (yp) {
              return '<span class="badge">' + kacar(YAPI_ETIKET[yp] || yp) + '</span>';
            }).join('') +
            (b.dz === 'ileri' ? '<span class="badge warn">ileri / resmî</span>' : '') +
            (b.or.length > 1 ? '<span class="badge">' + b.or.length + ' anlam</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="act"></div>' +
        '<div style="grid-column:1 / -1">' +
          ornekler(b) +
          (b.nt ? '<div class="tip" style="margin:10px 0 0">' + b.nt + '</div>' : '') +
          (b.es && b.es.length
            ? '<div class="esanlam">≈ Yakın anlamlılar: ' +
              b.es.map(function (x) { return '<b>' + kacar(x) + '</b>'; }).join(' · ') +
              '</div>'
            : '') +
        '</div>' +
      '</article>';
  }

  function filtrele() {
    var q = sadelestir(elAra.value.trim());
    var il = elIliski.value, yp = elYapi.value, dz = elDuzey.value;

    var suzulmus = TUM.filter(function (b) {
      if (il && iliskiler(b).indexOf(il) === -1) return false;
      if (yp && yapilar(b).indexOf(yp) === -1) return false;
      if (dz && b.dz !== dz) return false;
      if (q) {
        var havuz = b.f + ' ' + b.tr + ' ' + b.or.map(function (o) {
          return o.en + ' ' + o.tr + ' ' + (o.et || '');
        }).join(' ');
        if (sadelestir(havuz).indexOf(q) === -1) return false;
      }
      return true;
    });

    elSayac.textContent = suzulmus.length + ' bağlaç numaralandırıldı (1–' + suzulmus.length +
      ') · toplam ' + TUM.length;

    var bosMu = suzulmus.length === 0;
    elBos.hidden = !bosMu;
    elListe.hidden = bosMu;
    if (!bosMu) {
      elListe.innerHTML = suzulmus.map(function (b, i) { return satir(b, i + 1); }).join('');
    }
  }

  /* ---------- olaylar ---------- */

  [elAra, elIliski, elYapi, elDuzey].forEach(function (el) {
    el.addEventListener('input', filtrele);
  });

  $('temizle').addEventListener('click', function () {
    elAra.value = ''; elIliski.value = ''; elYapi.value = ''; elDuzey.value = '';
    filtrele();
  });

  /* ---------- içindekiler vurgusu ---------- */

  (function icindekiler() {
    var baglantilar = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
    var bolumler = baglantilar
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);
    if (!('IntersectionObserver' in window) || !bolumler.length) return;

    var gozlemci = new IntersectionObserver(function (girisler) {
      girisler.forEach(function (g) {
        if (!g.isIntersecting) return;
        var i = bolumler.indexOf(g.target);
        baglantilar.forEach(function (a, j) { a.classList.toggle('active', i === j); });
      });
    }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });

    bolumler.forEach(function (b) { gozlemci.observe(b); });
  })();

  /* ---------- başlat ---------- */
  iliskileriDoldur();
  filtrele();
})();
