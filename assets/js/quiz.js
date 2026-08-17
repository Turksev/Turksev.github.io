/* ============================================================
   Quiz sayfası: soru seçimi, anlık geri bildirim, sonuç ekranı
   ============================================================ */

(function () {
  'use strict';

  var Depo = window.YDS.Depo;
  var karistir = window.YDS.karistir;
  var kacar = window.YDS.kacar;
  var Il = window.YDS.Ilerleme;

  var REKOR_ANAHTAR = 'yds-rekor';
  var HAVUZ = window.SORULAR || [];
  var PARCALAR = window.PARCALAR || {};
  var HARF = ['A', 'B', 'C', 'D', 'E'];

  /* Sorunun uzun metni: ya soruya gömülü (cloze) ya da parça tablosunda (okuma). */
  function soruMetni(s) {
    return s.metin || (s.pid ? PARCALAR[s.pid] : '') || '';
  }

  var $ = function (id) { return document.getElementById(id); };

  var test = [];        // bu turdaki sorular
  var sira = 0;         // kaçıncı soru
  var dogru = 0;
  var cevaplandi = false;
  var yanlislar = [];

  /* ---------- kurulum ---------- */

  function kategorileriDoldur() {
    var sel = $('kategori');
    var gorulen = [];
    HAVUZ.forEach(function (s) {
      if (gorulen.indexOf(s.kat) === -1) gorulen.push(s.kat);
    });
    gorulen.forEach(function (k) {
      var sayi = HAVUZ.filter(function (s) { return s.kat === k; }).length;
      var o = document.createElement('option');
      o.value = k;
      o.textContent = k + ' (' + sayi + ')';
      sel.appendChild(o);
    });

    var y = document.createElement('option');
    y.value = '__yanlis';
    y.id = 'secYanlis';
    sel.appendChild(y);
    yanlisSecenegiGuncelle();
  }

  function yanlisSecenegiGuncelle() {
    var o = $('secYanlis');
    if (!o) return;
    var n = havuzSecSayisi('__yanlis');
    o.textContent = 'Yanlış defterim (' + n + ')';
    o.disabled = n === 0;
  }

  function havuzSecSayisi(kat) {
    if (kat === '__yanlis') {
      var defterde = Il.yanlisAnahtarlari();
      return HAVUZ.filter(function (s) {
        return defterde[Il.yanlisAnahtar({ kat: s.kat, s: s.s })];
      }).length;
    }
    return kat ? HAVUZ.filter(function (s) { return s.kat === kat; }).length : HAVUZ.length;
  }

  function havuzBilgisiniGuncelle() {
    var kat = $('kategori').value;
    var n = havuzSecSayisi(kat);
    $('havuzBilgi').textContent = kat === '__yanlis'
      ? n + ' soruyu daha önce yanlış yaptın. Doğru cevaplarsan defterden düşer.'
      : 'Bu seçimde ' + n + ' soru var. Sorular ve şıklar her turda karıştırılır.';
  }

  function rekoruGoster() {
    var r = Depo.oku(REKOR_ANAHTAR, null);
    var parcalar = [];
    if (r && r.yuzde != null) {
      parcalar.push('En iyi sonucun: %' + r.yuzde + ' (' + r.dogru + '/' + r.toplam + ')');
    }
    var zayif = Il.kategoriOzet().filter(function (k) { return k.toplam >= 3; })[0];
    if (zayif) {
      parcalar.push('En zayıf kategorin: ' + zayif.kat + ' (%' + zayif.yuzde + ')');
    }
    $('rekor').innerHTML = parcalar.join(' &nbsp;·&nbsp; ');
  }

  /* ---------- test hazırlama ---------- */

  function havuzSec() {
    var kat = $('kategori').value;

    if (kat === '__yanlis') {
      var defterde = Il.yanlisAnahtarlari();
      return HAVUZ.filter(function (s) {
        return defterde[Il.yanlisAnahtar({ kat: s.kat, s: s.s })];
      });
    }
    return kat ? HAVUZ.filter(function (s) { return s.kat === kat; }) : HAVUZ.slice();
  }

  function testHazirla() {
    var adet = parseInt($('adet').value, 10);

    var secilen = karistir(havuzSec());
    if (adet > 0) secilen = secilen.slice(0, adet);

    // Şıkları karıştır, doğru cevabın yeni yerini takip et.
    test = secilen.map(function (s) {
      var esli = s.se.map(function (metin, i) { return { metin: metin, dogruMu: i === s.d }; });
      esli = karistir(esli);
      return {
        kat: s.kat,
        metin: soruMetni(s),
        soru: s.s,
        ac: s.ac,
        secenekler: esli.map(function (x) { return x.metin; }),
        dogruIndex: esli.findIndex(function (x) { return x.dogruMu; })
      };
    });

    sira = 0; dogru = 0; yanlislar = [];
  }

  /* ---------- soru gösterimi ---------- */

  function bosluklu(metin) {
    return kacar(metin).replace(/----/g, '<span class="blank">----</span>');
  }

  function soruyuGoster() {
    var s = test[sira];
    cevaplandi = false;

    $('qKat').textContent = s.kat;
    $('qSayac').textContent = (sira + 1) + ' / ' + test.length;
    $('qBar').style.width = (sira / test.length * 100) + '%';

    var elMetin = $('qMetin');
    if (s.metin) {
      elMetin.innerHTML = bosluklu(s.metin);
      elMetin.hidden = false;
    } else {
      elMetin.hidden = true;
    }

    $('qText').innerHTML = bosluklu(s.soru);

    $('qSecenekler').innerHTML = s.secenekler.map(function (se, i) {
      return '<button class="opt" type="button" data-i="' + i + '">' +
               '<span class="key">' + HARF[i] + '</span>' +
               '<span>' + kacar(se) + '</span>' +
             '</button>';
    }).join('');

    $('qAcik').hidden = true;
    $('ileri').disabled = true;
    $('ileri').textContent = (sira === test.length - 1) ? 'Sonucu gör' : 'Sonraki soru';
  }

  function cevapla(secim) {
    if (cevaplandi) return;
    cevaplandi = true;

    var s = test[sira];
    var butonlar = $('qSecenekler').querySelectorAll('.opt');

    butonlar.forEach(function (b, i) {
      b.disabled = true;
      if (i === s.dogruIndex) b.classList.add('correct');
      else if (i === secim) b.classList.add('wrong');
    });

    var dogruMu = secim === s.dogruIndex;
    Il.kategoriKaydet(s.kat, dogruMu);

    if (dogruMu) {
      dogru++;
      Il.yanlisCoz({ kat: s.kat, soru: s.soru });   // defterden düş
    } else {
      Il.yanlisEkle({ kat: s.kat, soru: s.soru });
      yanlislar.push({
        soru: s.soru,
        kat: s.kat,
        senin: s.secenekler[secim],
        dogru: s.secenekler[s.dogruIndex],
        ac: s.ac
      });
    }

    var kutu = $('qAcik');
    kutu.innerHTML = (secim === s.dogruIndex ? '<b>Doğru.</b> ' : '<b>Doğru cevap: ' +
      kacar(s.secenekler[s.dogruIndex]) + '</b><br>') + s.ac;
    kutu.hidden = false;

    $('ileri').disabled = false;
    $('ileri').focus();
  }

  function ilerle() {
    if (sira < test.length - 1) {
      sira++;
      soruyuGoster();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      sonucuGoster();
    }
  }

  /* ---------- sonuç ---------- */

  function sonucuGoster() {
    var cozulen = dogru + yanlislar.length;
    var yuzde = cozulen ? Math.round(dogru / cozulen * 100) : 0;

    $('test').hidden = true;
    $('sonuc').hidden = false;
    $('sYuzde').textContent = '%' + yuzde;
    $('sOzet').textContent = cozulen + ' soruda ' + dogru + ' doğru, ' + yanlislar.length + ' yanlış.';

    Il.sonucEkle({ dogru: dogru, toplam: cozulen, yuzde: yuzde, mod: 'alistirma' });
    kategoriKarnesiCiz();
    yanlisSecenegiGuncelle();

    var inceleme = $('sInceleme');
    if (!yanlislar.length) {
      inceleme.innerHTML = '<p class="center muted" style="margin:0">Hiç yanlışın yok. 👏</p>';
    } else {
      inceleme.innerHTML = yanlislar.map(function (y) {
        return '<div class="review-item">' +
          '<span class="badge">' + kacar(y.kat) + '</span>' +
          '<p class="q" style="margin:8px 0 6px">' + bosluklu(y.soru) + '</p>' +
          '<p style="margin:0 0 4px"><span class="badge err">senin cevabın</span> ' + kacar(y.senin) + '</p>' +
          '<p style="margin:0 0 8px"><span class="badge ok">doğru</span> ' + kacar(y.dogru) + '</p>' +
          '<p class="muted" style="margin:0">' + y.ac + '</p>' +
        '</div>';
      }).join('');
    }

    var rekor = Depo.oku(REKOR_ANAHTAR, null);
    if (!rekor || yuzde > rekor.yuzde) {
      Depo.yaz(REKOR_ANAHTAR, { yuzde: yuzde, dogru: dogru, toplam: cozulen });
    }
    rekoruGoster();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* Tüm zamanların kategori başarısı — sonuç ekranında gösterilir. */
  function kategoriKarnesiCiz() {
    var kutu = $('sKarne');
    if (!kutu) return;
    var ozet = Il.kategoriOzet().filter(function (k) { return k.toplam > 0; });
    if (!ozet.length) { kutu.innerHTML = ''; return; }

    kutu.innerHTML = '<h2 style="margin-top:34px">Kategori karnen</h2>' +
      '<p class="small muted" style="margin-top:-6px">Bugüne kadar çözdüğün tüm sorular. En zayıf kategori üstte.</p>' +
      '<div class="card">' + ozet.map(function (k) {
        var renk = k.yuzde >= 75 ? 'var(--ok)' : (k.yuzde >= 50 ? 'var(--warn)' : 'var(--err)');
        return '<div class="karne-satir">' +
            '<span class="karne-ad">' + kacar(k.kat) + '</span>' +
            '<span class="karne-cubuk"><i style="width:' + k.yuzde + '%;background:' + renk + '"></i></span>' +
            '<span class="karne-sayi">%' + k.yuzde + ' <span class="muted">(' + k.dogru + '/' + k.toplam + ')</span></span>' +
          '</div>';
      }).join('') + '</div>';
  }

  function basaDon() {
    $('sonuc').hidden = true;
    $('test').hidden = true;
    $('kurulum').hidden = false;
    rekoruGoster();
    yanlisSecenegiGuncelle();
    havuzBilgisiniGuncelle();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- olaylar ---------- */

  $('kategori').addEventListener('change', havuzBilgisiniGuncelle);

  $('basla').addEventListener('click', function () {
    testHazirla();
    if (!test.length) { alert('Bu kategoride soru bulunamadı.'); return; }
    $('kurulum').hidden = true;
    $('sonuc').hidden = true;
    $('test').hidden = false;
    soruyuGoster();
  });

  $('qSecenekler').addEventListener('click', function (e) {
    var btn = e.target.closest('.opt');
    if (!btn) return;
    cevapla(parseInt(btn.getAttribute('data-i'), 10));
  });

  $('ileri').addEventListener('click', ilerle);

  $('bitir').addEventListener('click', function () {
    if (!dogru && !yanlislar.length) { basaDon(); return; }
    if (confirm('Testi burada bitirip sonucu görmek istiyor musun?')) sonucuGoster();
  });

  $('tekrar').addEventListener('click', basaDon);

  document.addEventListener('keydown', function (e) {
    if ($('test').hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;   // Ctrl+A gibi kısayolları bozma
    if (document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;

    if (e.key === 'Enter') {
      if (!$('ileri').disabled) { e.preventDefault(); ilerle(); }
      return;
    }

    var i = -1;
    if (/^[1-5]$/.test(e.key)) i = parseInt(e.key, 10) - 1;
    else {
      var h = HARF.indexOf(e.key.toUpperCase());
      if (h !== -1) i = h;
    }
    if (i >= 0 && i < test[sira].secenekler.length) {
      e.preventDefault();
      cevapla(i);
    }
  });

  /* ---------- başlat ---------- */
  kategorileriDoldur();
  havuzBilgisiniGuncelle();
  rekoruGoster();
})();
