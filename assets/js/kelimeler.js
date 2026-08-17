/* ============================================================
   Kelime listesi sayfası: arama, filtre, kart modu, "biliyorum" işareti
   ============================================================ */

(function () {
  'use strict';

  var Depo = window.YDS.Depo;
  var sadelestir = window.YDS.sadelestir;
  var kacar = window.YDS.kacar;

  var BILINEN_ANAHTAR = 'yds-bilinen';
  var TUM = window.KELIMELER || [];

  var bilinen = Depo.oku(BILINEN_ANAHTAR, []);
  if (!Array.isArray(bilinen)) bilinen = [];

  var suzulmus = [];
  var kartIndex = 0;
  var kartAcik = false;
  var kartModu = false;

  var $ = function (id) { return document.getElementById(id); };
  var elAra = $('ara'), elSeviye = $('seviye'), elTip = $('tip'), elDurum = $('durum');
  var elListe = $('liste'), elSayac = $('sayac'), elBos = $('bos');
  var elKartAlan = $('kartAlan'), elKart = $('kart');

  /* ---------- bilinen kelime yönetimi ---------- */

  function biliniyorMu(en) { return bilinen.indexOf(en) !== -1; }

  function isaretiCevir(en) {
    var i = bilinen.indexOf(en);
    if (i === -1) bilinen.push(en); else bilinen.splice(i, 1);
    Depo.yaz(BILINEN_ANAHTAR, bilinen);
  }

  /* ---------- filtreleme ---------- */

  function filtrele() {
    var q = sadelestir(elAra.value.trim());
    var sv = elSeviye.value;
    var tp = elTip.value;
    var dr = elDurum.value;

    suzulmus = TUM.filter(function (k) {
      if (sv && k.sv !== sv) return false;
      if (tp && k.tip.indexOf(tp) === -1) return false;
      if (dr === 'bilinen' && !biliniyorMu(k.en)) return false;
      if (dr === 'yeni' && biliniyorMu(k.en)) return false;
      if (q) {
        var havuz = sadelestir(k.en + ' ' + k.tr + ' ' + (k.es || ''));
        if (havuz.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (kartIndex >= suzulmus.length) kartIndex = 0;
    ciz();
  }

  /* ---------- liste görünümü ---------- */

  function satir(k) {
    var bilindi = biliniyorMu(k.en);
    return '' +
      '<article class="word' + (bilindi ? ' known' : '') + '" data-en="' + kacar(k.en) + '">' +
        '<div>' +
          '<div class="en">' + kacar(k.en) + '</div>' +
          '<div class="tr">' + kacar(k.tr) + '</div>' +
          '<div class="meta">' +
            '<span class="badge">' + kacar(k.tip) + '</span>' +
            '<span class="badge accent">' + kacar(k.sv) + '</span>' +
            (k.es ? '<span class="badge">≈ ' + kacar(k.es) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="act">' +
          '<button class="star" type="button" aria-pressed="' + bilindi + '" ' +
            'title="' + (bilindi ? 'Öğrendim işaretini kaldır' : 'Öğrendim olarak işaretle') + '">✓</button>' +
        '</div>' +
        '<div class="ex"><i>' + kacar(k.ex) + '</i><i class="tr-ex">' + kacar(k.exTr) + '</i></div>' +
      '</article>';
  }

  function listeCiz() {
    elListe.innerHTML = suzulmus.map(satir).join('');
  }

  /* ---------- kart görünümü ---------- */

  function kartCiz() {
    var k = suzulmus[kartIndex];
    if (!k) return;
    $('kartOn').textContent = k.en;
    $('kartTr').textContent = k.tr + '  (' + k.tip + ')';
    $('kartOrnek').innerHTML = kacar(k.ex) + '<br><span style="opacity:.8">' + kacar(k.exTr) + '</span>';
    $('kartArka').hidden = !kartAcik;
    $('kartIpucu').textContent = kartAcik
      ? 'Gizlemek için tekrar tıkla'
      : 'Çevirmek için karta tıkla · boşluk tuşu';
    $('kartSayac').textContent = (kartIndex + 1) + ' / ' + suzulmus.length;

    var btn = $('biliyorum');
    var bilindi = biliniyorMu(k.en);
    btn.textContent = bilindi ? '✓ Biliyorum (işaretli)' : '✓ Biliyorum';
    btn.className = bilindi ? 'btn ghost sm' : 'btn sm';
  }

  function kartGit(adim) {
    if (!suzulmus.length) return;
    kartIndex = (kartIndex + adim + suzulmus.length) % suzulmus.length;
    kartAcik = false;
    kartCiz();
  }

  /* ---------- ortak çizim ---------- */

  function ciz() {
    var n = suzulmus.length;
    var toplam = TUM.length;
    elSayac.textContent = n + ' kelime gösteriliyor · toplam ' + toplam +
      ' · öğrendiklerin: ' + bilinen.length;

    var bosMu = n === 0;
    elBos.hidden = !bosMu;
    elListe.hidden = bosMu || kartModu;
    elKartAlan.hidden = bosMu || !kartModu;

    if (bosMu) return;
    if (kartModu) kartCiz(); else listeCiz();
  }

  /* ---------- olaylar ---------- */

  [elAra, elSeviye, elTip, elDurum].forEach(function (el) {
    el.addEventListener('input', filtrele);
  });

  elListe.addEventListener('click', function (e) {
    var btn = e.target.closest('.star');
    if (!btn) return;
    var kutu = btn.closest('.word');
    var en = kutu.getAttribute('data-en');
    isaretiCevir(en);

    // Duruma göre filtreliyorsak satır listeden düşmeli; değilse yerinde güncelle.
    if (elDurum.value) {
      filtrele();
    } else {
      var bilindi = biliniyorMu(en);
      kutu.classList.toggle('known', bilindi);
      btn.setAttribute('aria-pressed', String(bilindi));
      btn.title = bilindi ? 'Öğrendim işaretini kaldır' : 'Öğrendim olarak işaretle';
      elSayac.textContent = suzulmus.length + ' kelime gösteriliyor · toplam ' + TUM.length +
        ' · öğrendiklerin: ' + bilinen.length;
    }
  });

  $('mod').addEventListener('click', function () {
    kartModu = !kartModu;
    kartAcik = false;
    this.textContent = kartModu ? 'Liste moduna dön' : 'Kart moduna geç';
    ciz();
  });

  elKart.addEventListener('click', function () {
    kartAcik = !kartAcik;
    kartCiz();
  });

  $('onceki').addEventListener('click', function () { kartGit(-1); });
  $('sonraki').addEventListener('click', function () { kartGit(1); });

  $('biliyorum').addEventListener('click', function () {
    var k = suzulmus[kartIndex];
    if (!k) return;
    isaretiCevir(k.en);
    if (elDurum.value) { filtrele(); return; }
    kartCiz();
    elSayac.textContent = suzulmus.length + ' kelime gösteriliyor · toplam ' + TUM.length +
      ' · öğrendiklerin: ' + bilinen.length;
  });

  $('temizle').addEventListener('click', function () {
    elAra.value = ''; elSeviye.value = ''; elTip.value = ''; elDurum.value = '';
    filtrele();
  });

  $('sifirla').addEventListener('click', function () {
    if (!bilinen.length) { alert('Henüz işaretlediğin kelime yok.'); return; }
    if (!confirm(bilinen.length + ' kelimedeki "öğrendim" işareti silinecek. Emin misin?')) return;
    bilinen = [];
    Depo.yaz(BILINEN_ANAHTAR, bilinen);
    filtrele();
  });

  document.addEventListener('keydown', function (e) {
    if (!kartModu || elKartAlan.hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;

    if (e.key === 'ArrowRight') { e.preventDefault(); kartGit(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); kartGit(-1); }
    else if (e.key === ' ') { e.preventDefault(); kartAcik = !kartAcik; kartCiz(); }
    else if (e.key === 'Enter') { e.preventDefault(); $('biliyorum').click(); }
  });

  /* ---------- başlat ---------- */
  filtrele();
})();
