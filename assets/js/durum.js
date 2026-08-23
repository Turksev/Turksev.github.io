/* ============================================================
   Durum sayfası — çalışılmış her şey tek listede

   Kelime sayfası yalnız SEÇİLİ katmanları gösterir; burası göstermez.
   Leitner tablosundaki her anahtar listelenir, hangi katmandan ya da
   hangi türden (kelime / öbek) olduğuna bakılmaksızın. Gereken katman
   dosyaları ve öbek dosyası, hangi kayıtlar varsa ona göre indirilir.
   ============================================================ */

(function () {
  'use strict';

  var sadelestir = window.YDS.sadelestir;
  var kacar = window.YDS.kacar;
  var Il = window.YDS.Ilerleme;
  var Veri = window.YDS.Veri;

  var SAYFA_BOYU = 60;

  var KUTU_BILGI = {
    1: { ad: '1. kutu', not: 'bilemediklerin — yarın tekrar', sinif: 'err' },
    2: { ad: '2. kutu', not: 'henüz oturmadı — 3 günde bir', sinif: 'warn' },
    3: { ad: '3. kutu', not: 'oturuyor — haftada bir', sinif: '' },
    4: { ad: '4. kutu', not: 'neredeyse tamam — 15 günde bir', sinif: 'ok' },
    5: { ad: '5. kutu', not: 'öğrenildi — artık tekrara gelmiyor', sinif: 'ok' }
  };

  var kayitlar = [];        // {ad, tur, kutu, kalan, tr, y, p}
  var suzulmus = [];
  var gosterilen = SAYFA_BOYU;
  var seciliKutu = 0;       // 0 = hepsi

  var $ = function (id) { return document.getElementById(id); };
  var elAra = $('ara'), elTur = $('tur'), elSirala = $('sirala');
  var elListe = $('liste'), elSayac = $('sayac'), elBos = $('bos');

  /* ---------- veriyi topla ---------- */

  function kayitlariKur() {
    var ham = Il.tumKayitlar();
    var obekHarita = {};
    (window.OBEKLER || []).forEach(function (o) { obekHarita[o.f] = o; });

    kayitlar = Object.keys(ham).map(function (ad) {
      var d = Veri.dizinKaydi(ad);
      if (d) {
        return { ad: ad, tur: 'kelime', kutu: ham[ad].k, kalan: ham[ad].kalan,
                 tr: d.t, y: d.y, p: d.p, katman: d.k };
      }
      var o = obekHarita[ad];
      if (o) {
        return { ad: ad, tur: 'obek', kutu: ham[ad].k, kalan: ham[ad].kalan,
                 tr: o.a.map(function (a) { return a.tr; }).join('; '), y: o.y, sinav: o.s };
      }
      // Veri henüz yüklenmemiş ya da kayıt artık listede yok
      return { ad: ad, tur: ad.indexOf(' ') === -1 ? 'kelime' : 'obek',
               kutu: ham[ad].k, kalan: ham[ad].kalan, tr: '', y: '' };
    });
  }

  /* Kelimelerin kısa anlamı zaten dizinde; katman dosyalarını indirmeye
     gerek yok. Yalnız öbek çalışılmışsa öbek dosyası gerekir. */
  function obekGerekliMi() {
    var ham = Il.tumKayitlar();
    return Object.keys(ham).some(function (ad) {
      return !Veri.dizinKaydi(ad) && ad.indexOf(' ') !== -1;
    });
  }

  /* ---------- sekmeler ---------- */

  function sekmeleriCiz() {
    var say = { 0: kayitlar.length, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    kayitlar.forEach(function (k) { say[k.kutu] = (say[k.kutu] || 0) + 1; });

    // Mezunlar (5. kutu) tekrara gelmez; sayaca girmesin.
    var vadesi = kayitlar.filter(function (k) { return k.kalan === 0 && k.kutu < 5; }).length;

    var html = '<button type="button" class="ks' + (seciliKutu === 0 ? ' acik' : '') +
      '" data-k="0"><b>' + say[0] + '</b><i>hepsi</i></button>';

    [1, 2, 3, 4, 5].forEach(function (k) {
      var b = KUTU_BILGI[k];
      html += '<button type="button" class="ks ' + b.sinif +
        (seciliKutu === k ? ' acik' : '') + '" data-k="' + k + '" title="' + b.not + '">' +
        '<b>' + (say[k] || 0) + '</b><i>' + b.ad + '</i></button>';
    });

    $('sekmeler').innerHTML = html +
      '<span class="ks-not">Bugün tekrarı gelen: <b>' + vadesi + '</b></span>';
  }

  /* ---------- filtre ve çizim ---------- */

  function filtrele() {
    var q = sadelestir(elAra.value.trim());
    var tur = elTur.value;

    suzulmus = kayitlar.filter(function (k) {
      if (seciliKutu && k.kutu !== seciliKutu) return false;
      if (tur && k.tur !== tur) return false;
      if (q && sadelestir(k.ad + ' ' + k.tr + ' ' + k.y).indexOf(q) === -1) return false;
      return true;
    });

    var s = elSirala.value;
    suzulmus.sort(function (a, b) {
      if (s === 'alfabe') return a.ad.localeCompare(b.ad, 'en');
      if (s === 'kutu') return a.kutu - b.kutu || a.ad.localeCompare(b.ad, 'en');
      if (s === 'puan') return (b.p || 0) - (a.p || 0);
      return a.kalan - b.kalan || a.kutu - b.kutu;      // vade
    });

    gosterilen = SAYFA_BOYU;
    ciz();
  }

  function satir(k) {
    var b = KUTU_BILGI[k.kutu] || { ad: k.kutu + '. kutu', sinif: '' };
    var vade = k.kutu >= 5 ? 'tekrar yok'
             : (k.kalan === 0 ? 'bugün tekrar' : k.kalan + ' gün sonra');

    return '<article class="word" data-ad="' + kacar(k.ad) + '">' +
        '<div>' +
          '<div class="en">' + kacar(k.ad) + '</div>' +
          (k.tr ? '<div class="tr">' + kacar(k.tr) + '</div>' : '') +
          '<div class="meta">' +
            '<span class="badge ' + b.sinif + '">' + b.ad + ' · ' + vade + '</span>' +
            '<span class="badge">' + (k.tur === 'obek' ? 'öbek' : 'kelime') + '</span>' +
            (Il.testYanlisSayisi && Il.testYanlisSayisi(k.en)
              ? '<span class="badge err" title="Günün testinde bilinemedi">testte ✗' +
                (Il.testYanlisSayisi(k.en) > 1 ? ' ×' + Il.testYanlisSayisi(k.en) : '') + '</span>' : '') +
            (k.y ? '<span class="badge">' + kacar(k.y) + '</span>' : '') +
            (k.p !== undefined && k.p !== null
              ? '<span class="badge accent" title="YDS öncelik puanı">' + k.p + ' p</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="act">' +
          '<button class="star" type="button" data-ne="bilmedim" title="Bilemedim — bir kutu geri düşer, yarın tekrar gelir">✗</button>' +
          '<button class="star" type="button" data-ne="bildim" title="Bildim — bir üst kutuya çıkar">✓</button>' +
          '<button class="star" type="button" data-ne="zaten" title="Zaten biliyorum — en üst kutuya at">✓✓</button>' +
          '<button class="star" type="button" data-ne="sil" title="Listeden çıkar (hiç çalışılmamış say)">⌫</button>' +
        '</div>' +
      '</article>';
  }

  function ciz() {
    sekmeleriCiz();

    var bosMu = suzulmus.length === 0;
    elBos.hidden = !bosMu;
    elListe.hidden = bosMu;

    if (bosMu) {
      $('bosMetin').textContent = kayitlar.length === 0
        ? 'Henüz hiçbir kelime ya da öbek çalışmadın. Kelimeler sayfasından başlayabilirsin.'
        : 'Bu filtrelerle eşleşen kayıt yok.';
      elListe.innerHTML = '';
      $('dahaFazla').hidden = true;
      elSayac.textContent = kayitlar.length + ' kayıt çalışıldı';
      return;
    }

    elSayac.textContent = suzulmus.length + ' kayıt gösteriliyor · toplam çalışılan ' + kayitlar.length;
    elListe.innerHTML = suzulmus.slice(0, gosterilen).map(satir).join('');

    var kalan = suzulmus.length - gosterilen;
    $('dahaFazla').hidden = kalan <= 0;
    $('dahaFazla').textContent = 'Daha fazla göster (' + kalan + ' kaldı)';
  }

  /* ---------- olaylar ---------- */

  $('sekmeler').addEventListener('click', function (e) {
    var b = e.target.closest('.ks');
    if (!b) return;
    seciliKutu = parseInt(b.getAttribute('data-k'), 10);
    filtrele();
  });

  elListe.addEventListener('click', function (e) {
    var btn = e.target.closest('.star');
    if (!btn) return;
    var ad = btn.closest('.word').getAttribute('data-ad');
    var ne = btn.getAttribute('data-ne');

    if (ne === 'sil') Il.listeyiSifirla([ad]);
    else if (ne === 'zaten') Il.zatenBiliyorum(ad);
    else if (ne === 'bilmedim') Il.yanlis(ad);
    else Il.dogru(ad);

    kayitlariKur();
    filtrele();
  });

  [elAra, elTur, elSirala].forEach(function (el) {
    el.addEventListener('input', filtrele);
  });

  $('dahaFazla').addEventListener('click', function () {
    gosterilen += SAYFA_BOYU;
    ciz();
  });

  $('temizle').addEventListener('click', function () {
    elAra.value = ''; elTur.value = ''; seciliKutu = 0;
    filtrele();
  });

  /* ---------- başlat ---------- */

  kayitlariKur();
  filtrele();

  // Öbek anlamları ayrı dosyada; yalnız öbek çalışılmışsa indirilir.
  if (obekGerekliMi()) {
    Veri.obekleriYukle()
      .then(function () { kayitlariKur(); filtrele(); })
      .catch(function () { /* anlamlar boş kalır, liste yine çalışır */ });
  }
})();
