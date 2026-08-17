/* ============================================================
   Kelime aileleri sayfası

   Liste, her sayfada yüklü olan dizinden kurulur (kelime + kısa anlam +
   kutu durumu). Bir aile açıldığında üyelerinin örnek cümleleri gerekir;
   bunlar katman dosyalarında olduğu için o katmanlar o an indirilir.
   ============================================================ */

(function () {
  'use strict';

  var sadelestir = window.YDS.sadelestir;
  var kacar = window.YDS.kacar;
  var Il = window.YDS.Ilerleme;
  var Veri = window.YDS.Veri;

  var SAYFA_BOYU = 40;

  var AILELER = (window.AILELER || []).filter(function (a) {
    // Dizinde karşılığı olmayan üye kalmasın (veri sürümleri kaymışsa)
    a.u = a.u.filter(function (w) { return Veri.dizinKaydi(w); });
    return a.u.length > 1;
  });

  var suzulmus = [];
  var gosterilen = SAYFA_BOYU;
  var acik = {};              // kök -> true

  var $ = function (id) { return document.getElementById(id); };
  var elAra = $('ara'), elBoyut = $('boyut'), elDurum = $('durum');
  var elListe = $('liste'), elSayac = $('sayac'), elBos = $('bos');

  /* ---------- yardımcılar ---------- */

  /* Olumsuz karşılık: sufficient → insufficient */
  function olumsuzSatiri(en) {
    var liste = (window.OLUMSUZLAR || {})[en];
    if (!liste || !liste.length) return '';
    return '<div class="olumsuz">⊘ Olumsuzu: ' + liste.map(function (o) {
      return '<b>' + kacar(o.f) + '</b> — ' + kacar(o.tr);
    }).join(' · ') + '</div>';
  }

  function kutuRozeti(w) {
    var k = Il.kutu(w);
    if (k === 0) return '<span class="badge">yeni</span>';
    var sinif = k >= 4 ? 'badge ok' : (k <= 2 ? 'badge warn' : 'badge');
    return '<span class="' + sinif + '">' + k + '. kutu</span>';
  }

  function aileDurumu(a) {
    var ogrenilen = 0, baslanan = 0;
    a.u.forEach(function (w) {
      var k = Il.kutu(w);
      if (k > 0) baslanan++;
      if (k >= 4) ogrenilen++;
    });
    return { ogrenilen: ogrenilen, baslanan: baslanan, toplam: a.u.length };
  }

  function eslesir(a, q) {
    if (!q) return true;
    var havuz = a.u.join(' ');
    a.u.forEach(function (w) {
      var d = Veri.dizinKaydi(w);
      if (d) havuz += ' ' + d.t + ' ' + d.y;
    });
    return sadelestir(havuz).indexOf(q) !== -1;
  }

  /* ---------- filtreleme ---------- */

  function filtrele() {
    var q = sadelestir(elAra.value.trim());
    var boyut = parseInt(elBoyut.value, 10) || 0;
    var dr = elDurum.value;

    suzulmus = AILELER.filter(function (a) {
      if (elBoyut.value === '2' && a.u.length !== 2) return false;
      if (boyut > 2 && a.u.length < boyut) return false;

      if (dr) {
        var d = aileDurumu(a);
        if (dr === 'tam' && d.ogrenilen !== d.toplam) return false;
        if (dr === 'eksik' && !(d.baslanan > 0 && d.ogrenilen < d.toplam)) return false;
        if (dr === 'yeni' && d.baslanan !== 0) return false;
      }
      return eslesir(a, q);
    });

    gosterilen = SAYFA_BOYU;
    ciz();
  }

  /* ---------- çizim ---------- */

  function uyeSatiri(w, kokMu, tamKayit) {
    var d = Veri.dizinKaydi(w);
    if (!d) return '';

    var ornekler = '';
    if (tamKayit) {
      ornekler = tamKayit.a.map(function (x) {
        return '<div class="uye-ornek">' +
                 '<b>' + kacar(x.tr) + '</b>' +
                 '<i>' + kacar(x.ex) + '</i>' +
                 '<i class="tr-ex">' + kacar(x.exTr) + '</i>' +
               '</div>';
      }).join('');
    }

    return '<div class="uye' + (kokMu ? ' kok' : '') + '" data-w="' + kacar(w) + '">' +
        '<div class="uye-bas">' +
          '<span class="uye-en">' + kacar(w) + '</span>' +
          '<span class="badge">' + kacar(d.y) + '</span>' +
          (d.p !== undefined ? '<span class="badge accent" title="YDS öncelik puanı">' +
                               d.p + ' p</span>' : '') +
          kutuRozeti(w) +
          '<span class="uye-act">' +
            '<button class="star" type="button" data-ne="bilmedim" title="Bilemedim — 1. kutuya döner">✗</button>' +
            '<button class="star" type="button" data-ne="bildim" title="Bildim — bir üst kutuya çıkar">✓</button>' +
            '<button class="star" type="button" data-ne="zaten" title="Zaten biliyorum — en üst kutuya at">✓✓</button>' +
          '</span>' +
        '</div>' +
        // Tam kayıt açıldıysa anlamlar örneklerin başında kalın yazılıyor;
        // dizindeki kısa anlamı tekrarlamayalım.
        (tamKayit ? '' : '<div class="uye-tr">' + kacar(d.t) + '</div>') +
        ornekler +
        olumsuzSatiri(w) +
      '</div>';
  }

  function aileKarti(a) {
    var d = aileDurumu(a);
    var acikMi = !!acik[a.k];
    var yuzde = Math.round(d.ogrenilen / d.toplam * 100);
    var renk = yuzde === 100 ? 'var(--ok)' : (yuzde > 0 ? 'var(--warn)' : 'var(--border)');

    var govde;
    if (acikMi) {
      govde = '<div class="aile-uyeler">' + a.u.map(function (w) {
        return uyeSatiri(w, w === a.k, Veri.kayit(w));
      }).join('') + '</div>';
    } else {
      govde = '<div class="aile-ozet">' + a.u.map(function (w) {
        var kk = Il.kutu(w);
        return '<span class="cip' + (w === a.k ? ' kok' : '') +
               (kk >= 4 ? ' ogrenildi' : (kk > 0 ? ' baslandi' : '')) + '">' +
               kacar(w) + '</span>';
      }).join('') + '</div>';
    }

    /* Aileyi topluca işaretlemek, listede aşağı inebilmenin en hızlı yolu:
       bildiğin aileyi tek dokunuşla kapatıp "eksik olanlar" filtresinden düşürürsün. */
    var topluca = acikMi
      ? '<div class="aile-toplu">' +
          '<button class="btn ghost sm" type="button" data-toplu="zaten">' +
            '✓✓ Bu ailenin tamamını biliyorum</button>' +
          '<button class="btn ghost sm" type="button" data-toplu="bilmedim">' +
            '✗ Tamamını tekrara al</button>' +
        '</div>'
      : '';

    return '<article class="aile' + (acikMi ? ' acik' : '') + '" data-kok="' + kacar(a.k) + '">' +
        '<button class="aile-baslik" type="button">' +
          '<span class="aile-kok">' + kacar(a.k) + '</span>' +
          '<span class="aile-sayi">' + d.ogrenilen + '/' + d.toplam + ' tür</span>' +
          '<span class="aile-ilerleme" title="' + d.ogrenilen + '/' + d.toplam + ' öğrenildi">' +
            '<i style="width:' + yuzde + '%;background:' + renk + '"></i>' +
          '</span>' +
          '<span class="aile-ok">' + (acikMi ? '▲' : '▼') + '</span>' +
        '</button>' +
        govde +
        topluca +
      '</article>';
  }

  function ciz() {
    var bosMu = suzulmus.length === 0;
    elBos.hidden = !bosMu;
    elListe.hidden = bosMu;

    var toplamUye = suzulmus.reduce(function (t, a) { return t + a.u.length; }, 0);
    elSayac.textContent = suzulmus.length + ' aile · ' + toplamUye + ' kelime' +
      (suzulmus.length < AILELER.length ? ' (toplam ' + AILELER.length + ' aile)' : '');

    if (bosMu) { elListe.innerHTML = ''; $('dahaFazla').hidden = true; return; }

    elListe.innerHTML = suzulmus.slice(0, gosterilen).map(aileKarti).join('');

    var kalan = suzulmus.length - gosterilen;
    $('dahaFazla').hidden = kalan <= 0;
    $('dahaFazla').textContent = 'Daha fazla göster (' + kalan + ' aile kaldı)';
  }

  /* ---------- aile açma: gerekli katmanları indir ---------- */

  function aileAc(kok) {
    var aile = suzulmus.filter(function (a) { return a.k === kok; })[0];
    if (!aile) return;

    var katmanlar = [];
    aile.u.forEach(function (w) {
      var k = Veri.katmani(w);
      if (k && !Veri.katmanYukluMu(k) && katmanlar.indexOf(k) === -1) katmanlar.push(k);
    });

    acik[kok] = true;
    if (!katmanlar.length) { ciz(); return; }

    ciz();
    Veri.katmanlariYukle(katmanlar).then(ciz).catch(function () { ciz(); });
  }

  /* ---------- olaylar ---------- */

  function isaretle(w, ne) {
    if (ne === 'zaten') Il.zatenBiliyorum(w);
    else if (ne === 'bilmedim') Il.yanlis(w);
    else Il.dogru(w);
  }

  elListe.addEventListener('click', function (e) {
    /* Tek üye işaretleme */
    var yildiz = e.target.closest('.star');
    if (yildiz) {
      e.stopPropagation();
      isaretle(yildiz.closest('.uye').getAttribute('data-w'),
               yildiz.getAttribute('data-ne'));
      ciz();
      return;
    }

    /* Ailenin tamamını işaretleme */
    var toplu = e.target.closest('[data-toplu]');
    if (toplu) {
      e.stopPropagation();
      var kokAdi = toplu.closest('.aile').getAttribute('data-kok');
      var aile = AILELER.filter(function (a) { return a.k === kokAdi; })[0];
      if (aile) {
        aile.u.forEach(function (w) { isaretle(w, toplu.getAttribute('data-toplu')); });
      }
      ciz();
      return;
    }

    /* Aileyi aç / kapat */
    var bas = e.target.closest('.aile-baslik');
    if (!bas) return;
    var kok = bas.closest('.aile').getAttribute('data-kok');
    if (acik[kok]) { delete acik[kok]; ciz(); } else { aileAc(kok); }
  });

  [elAra, elBoyut, elDurum].forEach(function (el) {
    el.addEventListener('input', filtrele);
  });

  $('dahaFazla').addEventListener('click', function () {
    gosterilen += SAYFA_BOYU;
    ciz();
  });

  $('temizle').addEventListener('click', function () {
    elAra.value = ''; elBoyut.value = ''; elDurum.value = '';
    filtrele();
  });

  /* Görünen ailelerin hepsini aç — gereken bütün katmanları indirir. */
  $('hepsiniAc').addEventListener('click', function () {
    var gorunen = suzulmus.slice(0, gosterilen);
    var hepsiAcik = gorunen.every(function (a) { return acik[a.k]; });

    if (hepsiAcik) {
      gorunen.forEach(function (a) { delete acik[a.k]; });
      this.textContent = 'Hepsini aç';
      ciz();
      return;
    }

    var katmanlar = [];
    gorunen.forEach(function (a) {
      acik[a.k] = true;
      a.u.forEach(function (w) {
        var k = Veri.katmani(w);
        if (k && !Veri.katmanYukluMu(k) && katmanlar.indexOf(k) === -1) katmanlar.push(k);
      });
    });
    this.textContent = 'Hepsini kapat';
    ciz();
    if (katmanlar.length) Veri.katmanlariYukle(katmanlar).then(ciz).catch(function () { ciz(); });
  });

  /* ---------- başlat ---------- */

  $('toplamAile').textContent = AILELER.length.toLocaleString('tr-TR');
  $('toplamUye').textContent = AILELER
    .reduce(function (t, a) { return t + a.u.length; }, 0).toLocaleString('tr-TR');
  filtrele();
})();
