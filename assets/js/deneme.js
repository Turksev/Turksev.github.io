/* ============================================================
   Süreli deneme sınavı: geri sayım, soru arası gezinme,
   işaretleme, otomatik teslim, kategori karnesi
   ============================================================ */

(function () {
  'use strict';

  var karistir = window.YDS.karistir;
  var kacar = window.YDS.kacar;
  var Il = window.YDS.Ilerleme;

  var HAVUZ = window.SORULAR || [];
  var PARCALAR = window.PARCALAR || {};
  var HARF = ['A', 'B', 'C', 'D', 'E'];
  var SANIYE_SORU = 135;          // soru başına 2 dk 15 sn (YDS temposu)

  /* YDS'nin bölüm ağırlıklarına yakın dağılım. Havuzda yetmeyen
     kategoriden eksik kalan pay, en büyük havuzlardan tamamlanır. */
  var AGIRLIK = {
    'Kelime': 8, 'Dil Bilgisi': 12, 'Bağlaç': 8, 'Preposition': 4,
    'Cloze Test': 10, 'Çeviri': 8, 'Cümle Tamamlama': 12, 'Restatement': 8,
    'Paragraf Tamamlama': 6, 'Anlamı Bozan Cümle': 6, 'Diyalog': 6, 'Okuma': 12
  };

  var $ = function (id) { return document.getElementById(id); };

  var test = [];
  var sira = 0;
  var kalanSaniye = 0;
  var sayacId = null;
  var bitti = false;

  function soruMetni(s) {
    return s.metin || (s.pid ? PARCALAR[s.pid] : '') || '';
  }

  /* ---------- test kurulumu ---------- */

  function kategoriHavuzu() {
    var h = {};
    HAVUZ.forEach(function (s) { (h[s.kat] = h[s.kat] || []).push(s); });
    return h;
  }

  function dagilimHesapla(hedef) {
    var havuz = kategoriHavuzu();
    var toplamAgirlik = 0;
    Object.keys(AGIRLIK).forEach(function (k) {
      if (havuz[k]) toplamAgirlik += AGIRLIK[k];
    });

    var plan = {}, secilenToplam = 0;
    Object.keys(AGIRLIK).forEach(function (k) {
      if (!havuz[k]) return;
      var pay = Math.round(hedef * AGIRLIK[k] / toplamAgirlik);
      plan[k] = Math.min(pay, havuz[k].length);
      secilenToplam += plan[k];
    });

    // Eksik kalanı, hâlâ soru kalan kategorilerden sırayla tamamla.
    var eksik = hedef - secilenToplam;
    var adaylar = Object.keys(plan).sort(function (a, b) {
      return (havuz[b].length - plan[b]) - (havuz[a].length - plan[a]);
    });
    var i = 0;
    while (eksik > 0 && adaylar.length) {
      var k = adaylar[i % adaylar.length];
      if (plan[k] < havuz[k].length) { plan[k]++; eksik--; }
      else if (adaylar.every(function (a) { return plan[a] >= havuz[a].length; })) break;
      i++;
    }
    return plan;
  }

  function dagilimBilgisi() {
    var hedef = parseInt($('adet').value, 10);
    var plan = dagilimHesapla(hedef);
    var toplam = Object.keys(plan).reduce(function (t, k) { return t + plan[k]; }, 0);
    var parcalar = Object.keys(plan)
      .filter(function (k) { return plan[k] > 0; })
      .map(function (k) { return k + ' ' + plan[k]; });
    $('dagilimBilgi').innerHTML =
      '<b>' + toplam + ' soru</b> · ' + Math.round(toplam * SANIYE_SORU / 60) + ' dakika<br>' +
      '<span class="muted">' + parcalar.join(' · ') + '</span>' +
      (toplam < hedef ? '<br><span class="badge warn" style="margin-top:6px">Havuzda ' +
        hedef + ' soru yok; sınav ' + toplam + ' soruyla kurulacak.</span>' : '');
  }

  function testHazirla() {
    var hedef = parseInt($('adet').value, 10);
    var plan = dagilimHesapla(hedef);
    var havuz = kategoriHavuzu();

    var secilen = [];
    Object.keys(plan).forEach(function (k) {
      secilen = secilen.concat(karistir(havuz[k]).slice(0, plan[k]));
    });

    // Aynı okuma parçasının soruları arka arkaya gelsin, gerisi karışsın.
    secilen = karistir(secilen).sort(function (a, b) {
      if (a.pid && b.pid) return a.pid < b.pid ? -1 : (a.pid > b.pid ? 1 : 0);
      if (a.pid) return 1;
      if (b.pid) return -1;
      return 0;
    });

    test = secilen.map(function (s) {
      var esli = karistir(s.se.map(function (m, i) { return { m: m, d: i === s.d }; }));
      return {
        kat: s.kat,
        metin: soruMetni(s),
        soru: s.s,
        ac: s.ac,
        secenekler: esli.map(function (x) { return x.m; }),
        dogruIndex: esli.findIndex(function (x) { return x.d; }),
        cevap: null,
        isaret: false
      };
    });

    sira = 0;
    bitti = false;
    kalanSaniye = test.length * SANIYE_SORU;
  }

  /* ---------- geri sayım ---------- */

  function sureYaz() {
    var dk = Math.floor(kalanSaniye / 60);
    var sn = kalanSaniye % 60;
    var el = $('sure');
    el.textContent = (dk < 10 ? '0' : '') + dk + ':' + (sn < 10 ? '0' : '') + sn;
    el.classList.toggle('kritik', kalanSaniye <= 300);
  }

  function sayacBaslat() {
    sureYaz();
    sayacId = setInterval(function () {
      kalanSaniye--;
      sureYaz();
      if (kalanSaniye <= 0) {
        sayacDurdur();
        alert('Süre doldu. Sınav otomatik olarak teslim edildi.');
        sonucuGoster(true);
      }
    }, 1000);
  }

  function sayacDurdur() {
    if (sayacId) { clearInterval(sayacId); sayacId = null; }
  }

  /* ---------- soru gösterimi ---------- */

  function bosluklu(metin) {
    return kacar(metin).replace(/----/g, '<span class="blank">----</span>');
  }

  function soruyuGoster() {
    var s = test[sira];

    $('qKat').textContent = s.kat;
    $('qSayac').textContent = (sira + 1) + ' / ' + test.length;
    $('qBar').style.width = ((sira + 1) / test.length * 100) + '%';

    var elMetin = $('qMetin');
    if (s.metin) {
      elMetin.innerHTML = bosluklu(s.metin);
      elMetin.hidden = false;
    } else {
      elMetin.hidden = true;
    }

    $('qText').innerHTML = bosluklu(s.soru);
    $('qSecenekler').innerHTML = s.secenekler.map(function (se, i) {
      return '<button class="opt' + (s.cevap === i ? ' secili' : '') + '" type="button" data-i="' + i + '">' +
               '<span class="key">' + HARF[i] + '</span><span>' + kacar(se) + '</span>' +
             '</button>';
    }).join('');

    var bIsaret = $('isaretle');
    bIsaret.textContent = s.isaret ? '⚑ İşareti kaldır' : '⚑ İşaretle';
    bIsaret.classList.toggle('ghost', !s.isaret);

    $('geri').disabled = sira === 0;
    $('ileri').textContent = sira === test.length - 1 ? 'Son soru' : 'Sonraki ›';
    $('ileri').disabled = sira === test.length - 1;

    izgaraCiz();
  }

  function izgaraCiz() {
    $('izgara').innerHTML = test.map(function (s, i) {
      var sinif = 'ig';
      if (i === sira) sinif += ' aktif';
      if (s.isaret) sinif += ' isaretli';
      else if (s.cevap !== null) sinif += ' cevapli';
      return '<button type="button" class="' + sinif + '" data-i="' + i + '">' + (i + 1) + '</button>';
    }).join('');
  }

  function git(i) {
    if (i < 0 || i >= test.length) return;
    sira = i;
    soruyuGoster();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cevapla(i) {
    test[sira].cevap = i;
    soruyuGoster();
  }

  /* ---------- sonuç ---------- */

  function sonucuGoster(sureDoldu) {
    if (bitti) return;
    bitti = true;
    sayacDurdur();

    var dogru = 0, yanlis = 0, bos = 0;
    var katOzet = {};

    test.forEach(function (s) {
      if (!katOzet[s.kat]) katOzet[s.kat] = { d: 0, y: 0, b: 0, n: 0 };
      katOzet[s.kat].n++;

      if (s.cevap === null) {
        bos++; katOzet[s.kat].b++;
      } else if (s.cevap === s.dogruIndex) {
        dogru++; katOzet[s.kat].d++;
        Il.kategoriKaydet(s.kat, true);
        Il.yanlisCoz({ kat: s.kat, soru: s.soru });
      } else {
        yanlis++; katOzet[s.kat].y++;
        Il.kategoriKaydet(s.kat, false);
        Il.yanlisEkle({ kat: s.kat, soru: s.soru });
      }
    });

    var net = Math.max(0, dogru - yanlis / 4);
    var yuzde = test.length ? Math.round(dogru / test.length * 100) : 0;

    $('sinav').hidden = true;
    $('sonuc').hidden = false;
    $('ustBar').hidden = false;

    $('sBaslik').textContent = sureDoldu ? 'Süre doldu — deneme sonucun' : 'Deneme sonucun';
    $('sNet').textContent = (Math.round(net * 100) / 100).toString().replace('.', ',');
    $('sOzet').textContent = test.length + ' soruda ' + dogru + ' doğru, ' + yanlis +
      ' yanlış, ' + bos + ' boş · başarı %' + yuzde +
      ' · kalan süre ' + Math.floor(kalanSaniye / 60) + ' dk';

    Il.sonucEkle({ dogru: dogru, toplam: test.length, yuzde: yuzde, mod: 'deneme' });

    $('sKarne').innerHTML = Object.keys(katOzet).map(function (k) {
      var o = katOzet[k];
      var p = o.n ? Math.round(o.d / o.n * 100) : 0;
      var renk = p >= 75 ? 'var(--ok)' : (p >= 50 ? 'var(--warn)' : 'var(--err)');
      return '<div class="karne-satir">' +
          '<span class="karne-ad">' + kacar(k) + '</span>' +
          '<span class="karne-cubuk"><i style="width:' + p + '%;background:' + renk + '"></i></span>' +
          '<span class="karne-sayi">' + o.d + '/' + o.n +
            (o.b ? ' <span class="muted">(' + o.b + ' boş)</span>' : '') + '</span>' +
        '</div>';
    }).join('');

    $('sInceleme').innerHTML = test.map(function (s, i) {
      var durum = s.cevap === null
        ? '<span class="badge warn">boş</span>'
        : (s.cevap === s.dogruIndex ? '<span class="badge ok">doğru</span>' : '<span class="badge err">yanlış</span>');
      return '<div class="review-item">' +
          '<span class="badge">' + (i + 1) + '</span> ' +
          '<span class="badge">' + kacar(s.kat) + '</span> ' + durum +
          '<p class="q" style="margin:8px 0 6px">' + bosluklu(s.soru) + '</p>' +
          (s.cevap !== null && s.cevap !== s.dogruIndex
            ? '<p style="margin:0 0 4px"><span class="badge err">senin</span> ' + kacar(s.secenekler[s.cevap]) + '</p>'
            : '') +
          '<p style="margin:0 0 8px"><span class="badge ok">doğru</span> ' + kacar(s.secenekler[s.dogruIndex]) + '</p>' +
          '<p class="muted" style="margin:0">' + s.ac + '</p>' +
        '</div>';
    }).join('');

    gecmisiCiz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- geçmiş denemeler ---------- */

  function gecmisiCiz() {
    var kayitlar = Il.gecmis().filter(function (g) { return g.m === 'deneme'; }).slice(-10).reverse();
    var alan = $('gecmisAlan');
    if (!kayitlar.length) { alan.innerHTML = ''; return; }

    alan.innerHTML = '<h2>Son denemelerin</h2><div class="card">' +
      kayitlar.map(function (g) {
        var t = new Date(g.t);
        var tarih = t.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' +
          t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        var renk = g.y >= 75 ? 'var(--ok)' : (g.y >= 50 ? 'var(--warn)' : 'var(--err)');
        return '<div class="karne-satir">' +
            '<span class="karne-ad small muted">' + tarih + '</span>' +
            '<span class="karne-cubuk"><i style="width:' + g.y + '%;background:' + renk + '"></i></span>' +
            '<span class="karne-sayi">%' + g.y + ' <span class="muted">(' + g.d + '/' + g.n + ')</span></span>' +
          '</div>';
      }).join('') + '</div>';
  }

  /* ---------- olaylar ---------- */

  $('adet').addEventListener('change', dagilimBilgisi);

  $('basla').addEventListener('click', function () {
    testHazirla();
    if (!test.length) { alert('Soru havuzu boş.'); return; }
    $('kurulum').hidden = true;
    $('sonuc').hidden = true;
    $('sinav').hidden = false;
    soruyuGoster();
    sayacBaslat();
  });

  $('qSecenekler').addEventListener('click', function (e) {
    var b = e.target.closest('.opt');
    if (b) cevapla(parseInt(b.getAttribute('data-i'), 10));
  });

  $('izgara').addEventListener('click', function (e) {
    var b = e.target.closest('.ig');
    if (b) git(parseInt(b.getAttribute('data-i'), 10));
  });

  $('geri').addEventListener('click', function () { git(sira - 1); });
  $('ileri').addEventListener('click', function () { git(sira + 1); });

  $('isaretle').addEventListener('click', function () {
    test[sira].isaret = !test[sira].isaret;
    soruyuGoster();
  });

  $('bitir').addEventListener('click', function () {
    var bosSayi = test.filter(function (s) { return s.cevap === null; }).length;
    var isaretli = test.filter(function (s) { return s.isaret; }).length;
    var uyari = 'Sınavı bitirmek istediğine emin misin?';
    if (bosSayi) uyari += '\n\n' + bosSayi + ' soru boş.';
    if (isaretli) uyari += '\n' + isaretli + ' soru işaretli.';
    if (confirm(uyari)) sonucuGoster(false);
  });

  $('tekrar').addEventListener('click', function () {
    $('sonuc').hidden = true;
    $('kurulum').hidden = false;
    dagilimBilgisi();
    gecmisiCiz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.addEventListener('keydown', function (e) {
    if ($('sinav').hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;

    if (e.key === 'ArrowRight') { e.preventDefault(); git(sira + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); git(sira - 1); }
    else if (e.key === 'Escape') { e.preventDefault(); test[sira].cevap = null; soruyuGoster(); }
    else if (e.key.toLowerCase() === 'm') { e.preventDefault(); $('isaretle').click(); }
    else if (/^[1-5]$/.test(e.key)) {
      var i = parseInt(e.key, 10) - 1;
      if (i < test[sira].secenekler.length) { e.preventDefault(); cevapla(i); }
    }
  });

  // Sınav sırasında sekmeyi kapatmaya çalışırsa uyar.
  window.addEventListener('beforeunload', function (e) {
    if (sayacId && !bitti) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------- başlat ---------- */
  dagilimBilgisi();
  gecmisiCiz();
})();
