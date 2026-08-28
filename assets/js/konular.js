/* ============================================================
   Konu haritası sayfası

   İki eksen (Türkçe / İngilizce), kategoriye göre gruplanmış üniteler,
   ünite başına durum + tanı % + gecikmeli % takibi. Anlatımı yazılmış
   konular sayfa içinde açılır.
   ============================================================ */

(function () {
  'use strict';

  var sadelestir = window.YDS.sadelestir;
  var kacar = window.YDS.kacar;
  var Depo = window.YDS.Depo;
  var Il = window.YDS.Ilerleme;

  var EKSENLER = window.KONULAR || [];
  var METINLER = window.KONU_METINLERI || {};
  var EKSEN_ANAHTAR = 'yds-eksen';

  var eksenIndex = Depo.oku(EKSEN_ANAHTAR, 0);
  if (typeof eksenIndex !== 'number' || !EKSENLER[eksenIndex]) eksenIndex = 0;

  var acikKategori = {};

  var $ = function (id) { return document.getElementById(id); };
  var elAra = $('ara'), elKatman = $('katman'), elEtki = $('etki'), elDurum = $('durum');
  var elListe = $('liste'), elSayac = $('sayac');

  var DURUM_ADI = ['başlamadım', 'çalışıyorum', 'tamamladım'];

  /* ---------- eksen sekmeleri ---------- */

  function eksenleriCiz() {
    $('eksenler').innerHTML = EKSENLER.map(function (e, i) {
      var tamam = e.u.filter(function (u) { return Il.konu(u.k).d === 2; }).length;
      return '<button type="button" class="es' + (i === eksenIndex ? ' acik' : '') +
        '" data-i="' + i + '">' +
          '<b>' + kacar(e.ad) + '</b>' +
          '<i>' + tamam + ' / ' + e.u.length + ' ünite</i>' +
        '</button>';
    }).join('');

    var e = EKSENLER[eksenIndex];
    var metinli = e.u.filter(function (u) { return METINLER[u.k]; }).length;
    $('eksenAciklama').innerHTML = kacar(e.aciklama) +
      '<br><b>' + metinli + '/' + e.u.length + '</b> ünitenin anlatımı hazır' +
      (metinli < e.u.length
        ? '; kalanlar için harita, kapsam ve takip alanları çalışıyor.'
        : '.');
  }

  /* ---------- filtre ---------- */

  function suzulmusUniteler() {
    var q = sadelestir(elAra.value.trim());
    var katman = elKatman.value, etki = elEtki.value, durum = elDurum.value;

    return EKSENLER[eksenIndex].u.filter(function (u) {
      if (katman && u.katman !== katman) return false;
      if (etki && u.etki !== etki) return false;

      if (durum === 'metinli') { if (!METINLER[u.k]) return false; }
      else if (durum !== '') { if (Il.konu(u.k).d !== parseInt(durum, 10)) return false; }

      if (q && sadelestir(u.k + ' ' + u.ad + ' ' + u.kapsam + ' ' + u.kat).indexOf(q) === -1) {
        return false;
      }
      return true;
    });
  }

  /* ---------- çizim ---------- */

  function uniteSatiri(u) {
    var d = Il.konu(u.k);
    var metinVar = !!METINLER[u.k];

    var yuzde = function (deger, etiket, alan) {
      return '<label class="yuz"><span>' + etiket + '</span>' +
        '<input type="number" min="0" max="100" step="1" data-alan="' + alan + '" ' +
        'value="' + (deger == null ? '' : deger) + '" placeholder="—"></label>';
    };

    return '<div class="unite d' + d.d + '" data-k="' + kacar(u.k) + '">' +
        '<div class="unite-bas">' +
          '<button class="unite-durum" type="button" title="Durumu değiştir">' +
            (d.d === 2 ? '✓' : (d.d === 1 ? '◐' : '□')) + '</button>' +
          '<span class="unite-kod">' + kacar(u.k) + '</span>' +
          '<span class="unite-ad">' + kacar(u.ad) + '</span>' +
          (metinVar
            ? '<button class="btn sm unite-ac" type="button">Konuyu aç</button>'
            : '<span class="badge" title="Bu ünitenin anlatımı henüz yazılmadı; ' +
              'harita bilgisi ve takip alanları yine de kullanılabilir">anlatım hazırlanıyor</span>') +
        '</div>' +

        '<div class="unite-kapsam">' + kacar(u.kapsam) + '</div>' +

        '<div class="meta">' +
          '<span class="badge' + (u.katman === 'Çekirdek 1' ? ' accent' : '') + '">' +
            kacar(u.katman) + '</span>' +
          '<span class="badge' + (u.etki === 'Doğrudan' ? ' ok' : '') + '">' +
            kacar(u.etki) + '</span>' +
          '<span class="badge' + (u.zor === 'Zor' ? ' err' : '') + '">' + kacar(u.zor) + '</span>' +
          '<span class="badge' + (u.risk === 'Yüksek' ? ' warn' : '') + '">TR riski: ' +
            kacar(u.risk) + '</span>' +
          '<span class="badge">' + kacar(u.soru) + '</span>' +
          (u.on && u.on !== '—'
            ? '<span class="badge" title="Ön koşullar">önce: ' + kacar(u.on) + '</span>' : '') +
        '</div>' +

        '<div class="unite-takip">' +
          yuzde(d.t, 'Tanı %', 't') +
          yuzde(d.g, 'Gecikmeli %', 'g') +
          '<span class="small muted unite-durumadi">' + DURUM_ADI[d.d] + '</span>' +
        '</div>' +
      '</div>';
  }

  function ciz() {
    var uniteler = suzulmusUniteler();
    var eksen = EKSENLER[eksenIndex];

    var tamam = eksen.u.filter(function (u) { return Il.konu(u.k).d === 2; }).length;
    var baslanan = eksen.u.filter(function (u) { return Il.konu(u.k).d > 0; }).length;
    elSayac.textContent = uniteler.length + ' ünite gösteriliyor · bu eksende ' +
      baslanan + ' başlandı, ' + tamam + ' tamamlandı (toplam ' + eksen.u.length + ')';

    if (!uniteler.length) {
      elListe.innerHTML = '<div class="empty">Bu filtrelerle eşleşen ünite yok.</div>';
      return;
    }

    /* kategoriye göre grupla, harita sırasını koru */
    var sira = [], grup = {};
    uniteler.forEach(function (u) {
      if (!grup[u.kat]) { grup[u.kat] = []; sira.push(u.kat); }
      grup[u.kat].push(u);
    });

    elListe.innerHTML = sira.map(function (kat) {
      var liste = grup[kat];
      var bitti = liste.filter(function (u) { return Il.konu(u.k).d === 2; }).length;
      var oran = Math.round(bitti / liste.length * 100);
      var acikMi = acikKategori[kat] !== false;      // varsayılan açık

      return '<section class="kat' + (acikMi ? ' acik' : '') + '" data-kat="' + kacar(kat) + '">' +
          '<button class="kat-bas" type="button">' +
            '<span class="kat-ad">' + kacar(kat) + '</span>' +
            '<span class="kat-sayi">' + bitti + '/' + liste.length + '</span>' +
            '<span class="aile-ilerleme"><i style="width:' + oran + '%;background:' +
              (oran === 100 ? 'var(--ok)' : (oran ? 'var(--warn)' : 'var(--border)')) +
              '"></i></span>' +
            '<span class="aile-ok">' + (acikMi ? '▲' : '▼') + '</span>' +
          '</button>' +
          (acikMi ? '<div class="kat-govde">' + liste.map(uniteSatiri).join('') + '</div>' : '') +
        '</section>';
    }).join('');
  }

  /* ---------- konu anlatımı ---------- */

  function konuAc(kod) {
    var m = METINLER[kod];
    if (!m) return;
    var u = null;
    var hedefEksen = -1;
    EKSENLER.forEach(function (e, i) {
      e.u.forEach(function (x) {
        if (x.k === kod) { u = x; hedefEksen = i; }
      });
    });
    if (!u) return;
    if (hedefEksen !== eksenIndex) {
      eksenIndex = hedefEksen;
      Depo.yaz(EKSEN_ANAHTAR, eksenIndex);
      eksenleriCiz();
      ciz();
    }

    $('konuBaslik').innerHTML =
      '<span class="badge accent">' + kacar(kod) + '</span>' +
      '<h1 style="margin-top:8px">' + kacar(m.baslik) + '</h1>' +
      (m.ozet ? '<p class="lead muted">' + kacar(m.ozet) + '</p>' : '') +
      (u ? '<div class="meta">' +
             '<span class="badge">' + kacar(u.kat) + '</span>' +
             '<span class="badge accent">' + kacar(u.katman) + '</span>' +
             '<span class="badge">' + kacar(u.zor) + '</span>' +
             '<span class="badge">' + kacar(u.soru) + '</span>' +
           '</div>' : '');

    $('konuGovde').innerHTML = m.html;

    /* bölüm başlıklarından içindekiler kur */
    var basliklar = $('konuGovde').querySelectorAll('h2');
    $('konuToc').innerHTML = '<ol>' + Array.prototype.map.call(basliklar, function (h, i) {
      h.id = 'b' + i;
      h.classList.add('topic');
      return '<li><a href="#b' + i + '">' + kacar(h.textContent) + '</a></li>';
    }).join('') + '</ol>';

    $('harita').hidden = true;
    $('konu').hidden = false;
    $('kap').classList.add('okuma');      // okurken kenar boşluklarını içeriğe ver
    window.scrollTo({ top: 0, behavior: 'smooth' });
    location.hash = kod;
  }

  function haritayaDon() {
    $('konu').hidden = true;
    $('harita').hidden = false;
    $('kap').classList.remove('okuma');
    if (location.hash) history.replaceState(null, '', location.pathname);
    eksenleriCiz();
    ciz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- olaylar ---------- */

  $('eksenler').addEventListener('click', function (e) {
    var b = e.target.closest('.es');
    if (!b) return;
    eksenIndex = parseInt(b.getAttribute('data-i'), 10);
    Depo.yaz(EKSEN_ANAHTAR, eksenIndex);
    eksenleriCiz();
    ciz();
  });

  elListe.addEventListener('click', function (e) {
    var ac = e.target.closest('.unite-ac');
    if (ac) { konuAc(ac.closest('.unite').getAttribute('data-k')); return; }

    var durumBtn = e.target.closest('.unite-durum');
    if (durumBtn) {
      var kod = durumBtn.closest('.unite').getAttribute('data-k');
      Il.konuYaz(kod, { d: (Il.konu(kod).d + 1) % 3 });
      eksenleriCiz();
      ciz();
      return;
    }

    var katBas = e.target.closest('.kat-bas');
    if (katBas) {
      var kat = katBas.closest('.kat').getAttribute('data-kat');
      acikKategori[kat] = acikKategori[kat] === false;
      ciz();
    }
  });

  /* Tanı / gecikmeli yüzdeleri */
  elListe.addEventListener('change', function (e) {
    var alan = e.target.getAttribute && e.target.getAttribute('data-alan');
    if (!alan) return;
    var kod = e.target.closest('.unite').getAttribute('data-k');
    var ham = e.target.value.trim();
    var deger = ham === '' ? null : Math.max(0, Math.min(100, parseInt(ham, 10) || 0));
    Il.konuYaz(kod, JSON.parse('{"' + alan + '":' + JSON.stringify(deger) + '}'));

    // Gecikmeli test %90 ve üzeriyse konuyu tamamlandı say (protokoldeki kural)
    if (alan === 'g' && deger !== null && deger >= 90 && Il.konu(kod).d !== 2) {
      Il.konuYaz(kod, { d: 2 });
      eksenleriCiz();
      ciz();
    }
  });

  [elAra, elKatman, elEtki, elDurum].forEach(function (el) {
    el.addEventListener('input', ciz);
  });

  $('temizle').addEventListener('click', function () {
    elAra.value = ''; elKatman.value = ''; elEtki.value = ''; elDurum.value = '';
    ciz();
  });

  $('geri').addEventListener('click', haritayaDon);
  $('geri2').addEventListener('click', haritayaDon);

  /* ---------- başlat ---------- */

  $('toplamUnite').textContent = EKSENLER.reduce(function (t, e) { return t + e.u.length; }, 0);
  eksenleriCiz();
  ciz();

  // Adres çubuğunda #T01 varsa doğrudan o konuyu aç
  var hash = (location.hash || '').replace('#', '');
  if (hash && METINLER[hash]) konuAc(hash);
})();
