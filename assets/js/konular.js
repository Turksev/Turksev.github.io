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
  var sonKonuKod = '';

  var $ = function (id) { return document.getElementById(id); };
  var elAra = $('ara'), elKatman = $('katman'), elEtki = $('etki'), elDurum = $('durum');
  var elListe = $('liste'), elSayac = $('sayac');

  var DURUM_ADI = ['başlamadım', 'çalışıyorum', 'tamamladım'];

  /* ---------- eksen sekmeleri ---------- */

  function eksenleriCiz() {
    $('eksenler').innerHTML = EKSENLER.map(function (e, i) {
      var tamam = e.u.filter(function (u) { return Il.konu(u.k).d === 2; }).length;
      return '<button type="button" class="es' + (i === eksenIndex ? ' acik' : '') +
        '" data-i="' + i + '" aria-pressed="' + (i === eksenIndex ? 'true' : 'false') + '">' +
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

    var gecikme = 'henüz yok';
    if (d.g != null) gecikme = '%' + d.g;
    else if (d.t != null) {
      var kalan = d.ta ? Math.max(0, 7 - (Il.bugun() - d.ta)) : 0;
      gecikme = kalan ? kalan + ' gün sonra' : 'hazır';
    }

    return '<div class="unite d' + d.d + '" data-k="' + kacar(u.k) + '">' +
        '<div class="unite-bas">' +
          '<button class="unite-durum" type="button" title="Durumu değiştir" aria-label="' + kacar(u.k) +
            ' durumunu değiştir: ' + kacar(DURUM_ADI[d.d]) + '">' +
            (d.d === 2 ? '✓' : (d.d === 1 ? '◐' : '□')) + '</button>' +
          '<span class="unite-kod">' + kacar(u.k) + '</span>' +
          '<span class="unite-ad">' + kacar(u.ad) + '</span>' +
          (metinVar
            ? '<a class="btn sm unite-ac" href="konu/' + kacar(u.k) + '.html">Konuyu aç</a>'
            : '<a class="badge" href="konu/' + kacar(u.k) + '.html" title="Bu ünitenin anlatımı hazırlanırken ' +
              'konu bilgilerini ve çalışma kapsamını aç">konu bilgisi</a>') +
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
          '<span class="badge' + (d.t != null ? ' accent' : '') + '">Tanı: ' +
            (d.t == null ? 'henüz yok' : '%' + d.t) + '</span>' +
          '<span class="badge' + (d.g != null && d.g >= 90 ? ' ok' : '') + '">Gecikmeli: ' +
            gecikme + '</span>' +
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

    elListe.innerHTML = sira.map(function (kat, katIndex) {
      var liste = grup[kat];
      var bitti = liste.filter(function (u) { return Il.konu(u.k).d === 2; }).length;
      var oran = Math.round(bitti / liste.length * 100);
      var acikMi = acikKategori[kat] !== false;      // varsayılan açık
      var govdeId = 'kat-govde-' + eksenIndex + '-' + katIndex;

      return '<section class="kat' + (acikMi ? ' acik' : '') + '" data-kat="' + kacar(kat) + '">' +
          '<button class="kat-bas" type="button" aria-expanded="' + (acikMi ? 'true' : 'false') +
            '" aria-controls="' + govdeId + '">' +
            '<span class="kat-ad">' + kacar(kat) + '</span>' +
            '<span class="kat-sayi">' + bitti + '/' + liste.length + '</span>' +
            '<span class="aile-ilerleme" aria-hidden="true"><i style="width:' + oran + '%;background:' +
              (oran === 100 ? 'var(--ok)' : (oran ? 'var(--warn)' : 'var(--border)')) +
              '"></i></span>' +
            '<span class="aile-ok">' + (acikMi ? '▲' : '▼') + '</span>' +
          '</button>' +
          '<div class="kat-govde" id="' + govdeId + '"' + (acikMi ? '' : ' hidden') + '>' +
            liste.map(uniteSatiri).join('') + '</div>' +
        '</section>';
    }).join('');
  }

  /* ---------- konu anlatımı ---------- */

  function taniBolumunuKur(kod) {
    var govde = $('konuGovde');
    var basliklar = Array.prototype.slice.call(govde.querySelectorAll('h2'));
    var cevapBasligi = basliklar.filter(function (h) {
      return /cevap|anahtar/i.test(h.textContent || '');
    })[0];
    if (!cevapBasligi) return;

    var taniBasligi = basliklar.filter(function (h) {
      return /mini\s*tanı|uygulama/i.test(h.textContent || '') &&
        !!(h.compareDocumentPosition(cevapBasligi) & Node.DOCUMENT_POSITION_FOLLOWING);
    })[0];
    if (!taniBasligi) return;

    var soruSayisi = 0;
    var n = taniBasligi.nextElementSibling;
    while (n && n !== cevapBasligi) {
      if (n.matches('ol,ul')) soruSayisi += n.children.length;
      else soruSayisi += n.querySelectorAll ? n.querySelectorAll(':scope > ol > li, :scope > ul > li').length : 0;
      n = n.nextElementSibling;
    }
    soruSayisi = Math.max(1, soruSayisi);

    var cevapKutu = document.createElement('div');
    cevapKutu.className = 'tani-cevap';
    cevapKutu.hidden = true;
    cevapKutu.tabIndex = -1;
    cevapKutu.setAttribute('aria-label', 'Cevap anahtarı');
    cevapBasligi.parentNode.insertBefore(cevapKutu, cevapBasligi);
    n = cevapBasligi;
    while (n) {
      var sonraki = n.nextElementSibling;
      if (n !== cevapBasligi && n.tagName === 'H2') break;
      cevapKutu.appendChild(n);
      n = sonraki;
    }

    var panel = document.createElement('section');
    panel.className = 'tani-panel tip';
    cevapKutu.parentNode.insertBefore(panel, cevapKutu);

    function durumuCiz() {
      var d = Il.konu(kod);
      var gecikmeliHazir = d.t != null && d.g == null && (!d.ta || Il.bugun() - d.ta >= 7);
      var mod = d.t == null ? 't' : (gecikmeliHazir ? 'g' : 'bak');
      var metin = d.t == null
        ? 'Soruları önce cevap anahtarına bakmadan çöz. Ardından her yanıtını değerlendir; tanı puanın otomatik hesaplanır.'
        : (gecikmeliHazir
          ? 'İlk tanının üzerinden en az 7 gün geçti. Soruları yeniden çöz; bu kez gecikmeli puanın hesaplanacak.'
          : (d.g != null
            ? 'Tanı %' + d.t + ' · gecikmeli %' + d.g + '. Cevap anahtarını istediğin zaman inceleyebilirsin.'
            : 'Tanı %' + d.t + '. Gecikmeli ölçüm ' + Math.max(1, 7 - (Il.bugun() - d.ta)) + ' gün sonra açılacak.'));
      panel.innerHTML = '<h2 style="margin:0 0 6px">Ölçme</h2><p class="small" style="margin:0 0 10px">' +
        kacar(metin) + '</p><button class="btn sm tani-ac" type="button">' +
        (mod === 't' ? 'Cevapları aç ve tanıyı değerlendir' :
          (mod === 'g' ? 'Cevapları aç ve gecikmeli testi değerlendir' : 'Cevap anahtarını göster')) +
        '</button><div class="tani-sonuc" role="status" aria-live="polite" tabindex="-1"></div>';

      panel.querySelector('.tani-ac').addEventListener('click', function () {
        cevapKutu.hidden = false;
        this.hidden = true;
        if (mod === 'bak') { cevapKutu.focus(); return; }
        var oylar = document.createElement('div');
        oylar.className = 'tani-oylar';
        oylar.innerHTML = '<p class="small muted">Her maddeyi dürüstçe değerlendir:</p>' +
          Array.apply(null, { length: soruSayisi }).map(function (_, i) {
            var etiket = 'tani-madde-' + kod + '-' + i;
            return '<div class="tani-oy" data-i="' + i + '" role="group" aria-labelledby="' + etiket + '">' +
              '<b id="' + etiket + '">' + (i + 1) + '. madde</b>' +
              '<button type="button" data-p="1" aria-pressed="false">Buldum</button>' +
              '<button type="button" data-p="0.5" aria-pressed="false">Kısmen</button>' +
              '<button type="button" data-p="0" aria-pressed="false">Bilemedim</button></div>';
          }).join('') + '<button class="btn tani-kaydet" type="button" disabled>Puanı kaydet</button>';
        panel.appendChild(oylar);
        oylar.querySelector('button[data-p]').focus();
        var puanlar = {};
        oylar.addEventListener('click', function (e) {
          var b = e.target.closest('button[data-p]');
          if (!b) return;
          var satir = b.closest('.tani-oy');
          puanlar[satir.getAttribute('data-i')] = Number(b.getAttribute('data-p'));
          satir.querySelectorAll('button').forEach(function (x) {
            var secili = x === b;
            x.classList.toggle('secili', secili);
            x.setAttribute('aria-pressed', secili ? 'true' : 'false');
          });
          oylar.querySelector('.tani-kaydet').disabled = Object.keys(puanlar).length !== soruSayisi;
        });
        oylar.querySelector('.tani-kaydet').addEventListener('click', function () {
          var toplam = Object.keys(puanlar).reduce(function (t, i) { return t + puanlar[i]; }, 0);
          var yuzde = Math.round(toplam / soruSayisi * 100);
          var yazildi = mod === 't'
            ? Il.konuYaz(kod, { t: yuzde, ta: Il.bugun(), d: 1 })
            : Il.konuYaz(kod, { g: yuzde, ga: Il.bugun(), d: yuzde >= 90 ? 2 : 1 });
          if (yazildi === false) { window.YDS.depolamaUyarisi(); return; }
          oylar.remove();
          var sonuc = panel.querySelector('.tani-sonuc');
          sonuc.innerHTML = '<p style="margin:0"><b>' +
            (mod === 't' ? 'Tanı' : 'Gecikmeli') + ' puanın: %' + yuzde + '</b>' +
            (mod === 't' ? ' · Gecikmeli ölçüm 7 gün sonra açılacak.' :
              (yuzde >= 90 ? ' · Konu tamamlandı.' : ' · Konu çalışılıyor olarak kaldı.')) + '</p>';
          sonuc.focus();
        });
      });
    }

    durumuCiz();
  }

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
      '<h1 id="acikKonuBasligi" tabindex="-1" style="margin-top:8px">' + kacar(m.baslik) + '</h1>' +
      (m.ozet ? '<p class="lead muted">' + kacar(m.ozet) + '</p>' : '') +
      (u ? '<div class="meta">' +
             '<span class="badge">' + kacar(u.kat) + '</span>' +
             '<span class="badge accent">' + kacar(u.katman) + '</span>' +
             '<span class="badge">' + kacar(u.zor) + '</span>' +
             '<span class="badge">' + kacar(u.soru) + '</span>' +
           '</div>' : '');

    $('konuGovde').innerHTML = m.html;
    taniBolumunuKur(kod);

    /* bölüm başlıklarından içindekiler kur */
    var basliklar = $('konuGovde').querySelectorAll('h2');
    $('konuToc').innerHTML = '<ol>' + Array.prototype.map.call(basliklar, function (h, i) {
      h.id = 'b' + i;
      h.classList.add('topic');
      return '<li><a href="#b' + i + '">' + kacar(h.textContent) + '</a></li>';
    }).join('') + '</ol>';

    $('harita').hidden = true;
    $('konu').hidden = false;
    sonKonuKod = kod;
    $('kap').classList.add('okuma');      // okurken kenar boşluklarını içeriğe ver
    // location.hash ataması tarayıcı odağını BODY'ye geri taşıyabildiği için
    // adresi gezinme oluşturmadan güncelle, ardından görünür başlığa odaklan.
    history.replaceState(null, '', location.pathname + location.search + '#' + encodeURIComponent(kod));
    $('acikKonuBasligi').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: window.YDS.hareket() });
  }

  function haritayaDon() {
    $('konu').hidden = true;
    $('harita').hidden = false;
    $('kap').classList.remove('okuma');
    if (location.hash) history.replaceState(null, '', location.pathname);
    eksenleriCiz();
    ciz();
    var geriOdak = Array.prototype.find.call(elListe.querySelectorAll('.unite'), function (el) {
      return el.getAttribute('data-k') === sonKonuKod;
    });
    if (geriOdak) (geriOdak.querySelector('.unite-ac') || geriOdak.querySelector('a')).focus();
    window.scrollTo({ top: 0, behavior: window.YDS.hareket() });
  }

  /* ---------- olaylar ---------- */

  $('eksenler').addEventListener('click', function (e) {
    var b = e.target.closest('.es');
    if (!b) return;
    eksenIndex = parseInt(b.getAttribute('data-i'), 10);
    Depo.yaz(EKSEN_ANAHTAR, eksenIndex);
    eksenleriCiz();
    ciz();
    $('eksenler').querySelector('[data-i="' + eksenIndex + '"]').focus();
  });

  elListe.addEventListener('click', function (e) {
    var ac = e.target.closest('.unite-ac');
    if (ac) { e.preventDefault(); konuAc(ac.closest('.unite').getAttribute('data-k')); return; }

    var durumBtn = e.target.closest('.unite-durum');
    if (durumBtn) {
      var kod = durumBtn.closest('.unite').getAttribute('data-k');
      Il.konuYaz(kod, { d: (Il.konu(kod).d + 1) % 3 });
      eksenleriCiz();
      ciz();
      var yeniDurum = Array.prototype.find.call(elListe.querySelectorAll('.unite'), function (el) {
        return el.getAttribute('data-k') === kod;
      });
      if (yeniDurum) yeniDurum.querySelector('.unite-durum').focus();
      return;
    }

    var katBas = e.target.closest('.kat-bas');
    if (katBas) {
      var kat = katBas.closest('.kat').getAttribute('data-kat');
      acikKategori[kat] = acikKategori[kat] === false;
      ciz();
      var yeniKatBas = Array.prototype.find.call(elListe.querySelectorAll('.kat-bas'), function (btn) {
        return btn.closest('.kat').getAttribute('data-kat') === kat;
      });
      if (yeniKatBas) yeniKatBas.focus();
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

  // #T01 ve statik konu sayfalarının kullandığı ?konu=T01 bağlantıları
  // ilgili üniteyi doğrudan açar.
  var hash = (location.hash || '').replace('#', '');
  var sorgu = '';
  try { sorgu = new URLSearchParams(location.search).get('konu') || ''; } catch (e) {}
  var dogrudan = (sorgu || hash).toUpperCase();
  if (dogrudan && METINLER[dogrudan]) konuAc(dogrudan);
})();
