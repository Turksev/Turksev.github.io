/* ============================================================
   Günün testi — deste bittikten sonra boşluk doldurma sınavı

   Bugün çalışılan kelimeler (en çok 20) için, karttaki örnekten
   bağımsız, YDS düzeyinde özgün cümlelerle 5 şıklı boşluk doldurma.
   Cümleler data/test-k{n}.js dosyalarındadır: {kelime: {c, b, f, tr}}
     c  = boşluklu cümle ("----")
     b  = boşluğa gelen biçim (çekimli olabilir)
     f  = çekim türü ('', 's', 'past', 'pp', 'ing', 'pl')
     tr = cümlenin Türkçesi

   Çeldiriciler aynı türden, yakın katmandan, aynı çekimle üretilir
   (YDS.Cekim). Sonuç Leitner kutusunu DEĞİŞTİRMEZ; bilinemeyen
   kelime "testte bilemediklerim" defterine girer (Ilerleme.testYanlis),
   sonraki testte doğru bilinince düşer.
   ============================================================ */
(function () {
  'use strict';

  var Veri = window.YDS.Veri, Il = window.YDS.Ilerleme, Cekim = window.YDS.Cekim;
  var kacar = window.YDS.kacar;
  var DIZIN = window.KELIME_DIZIN || [];

  var EN_COK = 20;           // bir testte en çok soru
  var EN_AZ = 3;             // bundan az soru varsa test açılmaz
  var HARF = ['A', 'B', 'C', 'D', 'E'];
  var FIIL_ANLAM = /\S+m[ae]k\b/;   // "yönetmek", "sağlamak" — Türkçe mastar
  var $ = function (id) { return document.getElementById(id); };

  var sorular = [], sira = 0, dogru = 0, cevaplandi = false, yanlislar = [];
  var kapandiginda = null;

  /* ---------- yardımcılar ---------- */

  function karistir(dizi) {
    var a = dizi.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function turler(d) {
    return String(d.y || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function gerekliTur(f) {
    if (f === 'past' || f === 'pp' || f === 'ing' || f === 's') return 'fiil';
    if (f === 'pl') return 'isim';
    return null;
  }

  /* Aynı kökten mi? (prompt / promptly, economy / economic) */
  function ayniKok(a, b) {
    var n = Math.min(a.length, b.length, 5);
    if (n < 4) return a === b;
    return a.slice(0, n) === b.slice(0, n);
  }

  function cumledeGeciyorMu(cumle, kelime) {
    return new RegExp('\\b' + kelime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*\\b', 'i').test(cumle);
  }

  function bosluklu(c, icerik) {
    return kacar(c).replace('----', '<span class="blank">' + (icerik || '----') + '</span>');
  }

  function bastaMi(c) { return c.indexOf('----') === 0; }

  function busHarf(s, buyuk) { return buyuk ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* ---------- çeldiriciler ---------- */

  function celdiriciler(hedef, soru) {
    var f = soru.f || '';
    var gerekli = gerekliTur(f);
    var hedefTurler = turler(hedef);
    var tam = Veri.kayit(hedef.e);
    var esler = tam && tam.es ? String(tam.es).split(',').map(function (s) { return s.trim().toLowerCase(); }) : [];
    var cumle = soru.c.toLowerCase();

    function uygun(d, mesafe) {
      if (d.e === hedef.e || /[^a-z]/.test(d.e)) return false;
      if (Math.abs(d.k - hedef.k) > mesafe) return false;
      var t = turler(d);
      if (gerekli === 'fiil') {
        // Fiil çekimi isteniyorsa gerçekten fiil olarak kullanılan kelime: Türkçesinde -mak/-mek var
        if (t.indexOf('fiil') === -1 || !FIIL_ANLAM.test(d.t || '')) return false;
      } else if (gerekli === 'isim') {
        if (t[0] !== 'isim') return false;
      } else if (!t.some(function (x) { return hedefTurler.indexOf(x) !== -1; })) return false;
      if (ayniKok(d.e, hedef.e)) return false;
      if (esler.indexOf(d.e) !== -1) return false;
      if (cumledeGeciyorMu(cumle, d.e)) return false;
      var bicim = Cekim.cek(d.e, f);
      if (!bicim || bicim === soru.b) return false;
      return true;
    }

    var secilen = [], kume = {};
    var aday;
    // Önce baş türü aynı (ilk listelenen tür) ve komşu katman; yetmezse genişlet
    [[0, true], [1, true], [2, false], [7, false]].some(function (asama) {
      aday = karistir(DIZIN.filter(function (d) {
        if (kume[d.e] || !uygun(d, asama[0])) return false;
        return !asama[1] || turler(d)[0] === (gerekli || hedefTurler[0]);
      }));
      aday.forEach(function (d) {
        if (secilen.length < 4 && !kume[d.e]) { secilen.push(d); kume[d.e] = true; }
      });
      return secilen.length >= 4;
    });
    return secilen;
  }

  /* ---------- soru kurma ---------- */

  function bugunCalisilanlar(havuz) {
    var bugun = Il.bugun();
    var kayitlar = Il.tumKayitlar();
    var kume = {};
    Object.keys(kayitlar).forEach(function (en) {
      var r = kayitlar[en];
      if (r && r.k && r.g - Il.ARALIK[r.k] === bugun) kume[en] = true;
    });
    return havuz.filter(function (d) { return kume[d.e]; });
  }

  function testCumlesi(en) {
    var k = Veri.katmani(en);
    var tablo = k && window['TEST_K' + k];
    return (tablo && tablo[en]) || null;
  }

  function soruKur(d) {
    var s = testCumlesi(d.e);
    if (!s) return null;
    var celd = celdiriciler(d, s);
    if (celd.length < 4) return null;
    var buyuk = bastaMi(s.c);
    var secenekler = karistir([{ d: d, metin: s.b }].concat(celd.map(function (c) {
      return { d: c, metin: Cekim.cek(c.e, s.f || '') };
    }))).map(function (o) { o.metin = busHarf(o.metin, buyuk); return o; });
    var dogruIndex = -1;
    secenekler.forEach(function (o, i) { if (o.d.e === d.e) dogruIndex = i; });
    return { d: d, s: s, secenekler: secenekler, dogruIndex: dogruIndex };
  }

  /* Bugün çalışılanlardan test kur; ipucu: önce testte bilinemeyenler, sonra alt kutular. */
  function hazirla(havuz) {
    var adaylar = bugunCalisilanlar(havuz);
    var testteYanlis = Il.testYanlisKumesi();
    adaylar = karistir(adaylar).sort(function (a, b) {
      var ya = testteYanlis[a.e] ? 0 : 1, yb = testteYanlis[b.e] ? 0 : 1;
      if (ya !== yb) return ya - yb;
      return Il.kutu(a.e) - Il.kutu(b.e);
    });
    var liste = [];
    for (var i = 0; i < adaylar.length && liste.length < EN_COK; i++) {
      var q = soruKur(adaylar[i]);
      if (q) liste.push(q);
    }
    return { sorular: karistir(liste), calisilan: adaylar.length };
  }

  /* ---------- ekran ---------- */

  function soruCiz() {
    var q = sorular[sira];
    cevaplandi = false;
    $('tSayac').textContent = (sira + 1) + ' / ' + sorular.length;
    $('tBar').style.width = (sira / sorular.length * 100) + '%';
    $('tMetin').innerHTML = bosluklu(q.s.c);
    $('tSecenekler').innerHTML = q.secenekler.map(function (o, i) {
      return '<button class="opt" type="button" data-i="' + i + '">' +
               '<span class="key">' + HARF[i] + '</span><span>' + kacar(o.metin) + '</span></button>';
    }).join('');
    $('tAcik').hidden = true;
    $('tIleri').disabled = true;
    $('tIleri').textContent = (sira === sorular.length - 1) ? 'Sonucu gör' : 'Sonraki soru';
  }

  function cevapla(secim) {
    if (cevaplandi) return;
    cevaplandi = true;
    var q = sorular[sira];
    var butonlar = $('tSecenekler').querySelectorAll('.opt');
    butonlar.forEach(function (b, i) {
      b.disabled = true;
      if (i === q.dogruIndex) b.classList.add('correct');
      else if (i === secim) b.classList.add('wrong');
    });

    var dogruMu = secim === q.dogruIndex;
    if (dogruMu) { dogru++; Il.testDogru(q.d.e); }
    else {
      Il.testYanlis(q.d.e);
      yanlislar.push({ q: q, senin: q.secenekler[secim] });
    }

    var secilenD = q.secenekler[secim].d;
    var aciklama = '<p style="margin:0 0 8px">' + bosluklu(q.s.c, '<b>' + kacar(q.s.b) + '</b>') + '</p>' +
      '<p class="muted" style="margin:0 0 10px">' + kacar(q.s.tr) + '</p>' +
      '<p style="margin:0"><b>' + kacar(q.d.e) + '</b> <span class="muted">(' + kacar(q.d.y) + ')</span> — ' + kacar(q.d.t) + '</p>';
    if (!dogruMu) {
      aciklama += '<p style="margin:6px 0 0"><span class="badge err">senin seçimin</span> <b>' +
        kacar(secilenD.e) + '</b> — ' + kacar(secilenD.t) + '</p>';
    }
    var kutu = $('tAcik');
    kutu.innerHTML = (dogruMu ? '<b>Doğru.</b> ' : '<b>Yanlış.</b> ') + aciklama;
    kutu.hidden = false;
    $('tIleri').disabled = false;
    $('tIleri').focus();
  }

  function sonucCiz() {
    $('tSoru').hidden = true;
    var alan = $('tSonuc');
    alan.hidden = false;
    var yuzde = Math.round(dogru / sorular.length * 100);
    $('tSkor').textContent = dogru + ' / ' + sorular.length + ' doğru (%' + yuzde + ')';
    $('tSkorNot').textContent = yanlislar.length
      ? 'Bilemediklerin "testte bilemediklerim" listesine yazıldı; kutuları değişmedi. Bir sonraki testte yine sorulur.'
      : 'Hepsini bildin. Kutuların değişmedi; kelimeler bağlam içinde de oturmuş.';
    $('tInceleme').innerHTML = yanlislar.map(function (y) {
      return '<div class="review-item">' +
        '<p class="q" style="margin:0 0 6px">' + bosluklu(y.q.s.c, '<b>' + kacar(y.q.s.b) + '</b>') + '</p>' +
        '<p class="muted" style="margin:0 0 6px">' + kacar(y.q.s.tr) + '</p>' +
        '<p style="margin:0 0 4px"><span class="badge err">senin cevabın</span> ' + kacar(y.senin.metin) +
          ' <span class="muted">— ' + kacar(y.senin.d.t) + '</span></p>' +
        '<p style="margin:0"><span class="badge ok">doğru</span> ' + kacar(y.q.s.b) +
          ' <span class="muted">— ' + kacar(y.q.d.t) + '</span></p>' +
      '</div>';
    }).join('');
  }

  function kapat() {
    $('testAlan').hidden = true;
    if (kapandiginda) kapandiginda();
  }

  /* ---------- dış API ---------- */

  /* Bugün çalışılan ve seçili havuzdaki kelime sayısı (test düğmesi için). */
  function bugunSayisi(havuz) { return bugunCalisilanlar(havuz).length; }

  /* Testi başlat: gereken test dosyalarını indirir, soruları kurar, ekranı açar.
     Söz: {acildi: bool, soru: n, calisilan: n} */
  function baslat(havuz, secili, onKapat) {
    kapandiginda = onKapat || null;
    return Veri.testleriYukle(secili).then(function () {
      var h = hazirla(havuz);
      if (h.sorular.length < EN_AZ) return { acildi: false, soru: h.sorular.length, calisilan: h.calisilan };
      sorular = h.sorular; sira = 0; dogru = 0; yanlislar = [];
      $('testAlan').hidden = false;
      $('tSoru').hidden = false;
      $('tSonuc').hidden = true;
      soruCiz();
      $('testAlan').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return { acildi: true, soru: sorular.length, calisilan: h.calisilan };
    });
  }

  /* ---------- olaylar ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    if (!$('testAlan')) return;
    $('tSecenekler').addEventListener('click', function (e) {
      var b = e.target.closest('.opt');
      if (b) cevapla(Number(b.dataset.i));
    });
    $('tIleri').addEventListener('click', function () {
      if (sira < sorular.length - 1) { sira++; soruCiz(); } else sonucCiz();
    });
    $('tKapat').addEventListener('click', kapat);
    $('tBitir').addEventListener('click', kapat);
    document.addEventListener('keydown', function (e) {
      if ($('testAlan').hidden || $('tSoru').hidden) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      var i = HARF.indexOf(e.key.toUpperCase());
      if (i === -1 && /^[1-5]$/.test(e.key)) i = Number(e.key) - 1;
      if (i !== -1 && i < sorular[sira].secenekler.length && !cevaplandi) { e.preventDefault(); cevapla(i); }
      else if (e.key === 'Enter' && cevaplandi) { e.preventDefault(); $('tIleri').click(); }
    });
  });

  window.YDS.KelimeTesti = { baslat: baslat, bugunSayisi: bugunSayisi, EN_AZ: EN_AZ, EN_COK: EN_COK };
})();
