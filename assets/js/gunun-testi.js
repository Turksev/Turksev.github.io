/* ============================================================
   Günün testi — deste bittikten sonra boşluk doldurma sınavı

   Hem kelime hem öbek sayfasında çalışır (kaynak: 'kelime' | 'obek').
   Bugün çalışılanlar (en çok 20) için, karttaki örnekten bağımsız,
   YDS düzeyinde özgün cümlelerle 5 şıklı boşluk doldurma.
   Cümleler data/test-k{n}.js ve data/test-obek.js içindedir: {anahtar: {c, b, f, tr}}
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

  /* ---------- kaynaklar ----------
     Test iki havuzda çalışır. Her kaynak kendi dizinini, cümle tablosunu ve
     çeldirici ölçütünü verir; gerisi ortaktır. */

  var KAYNAKLAR = {
    kelime: {
      ad: 'kelime',
      tur: 'kelime',
      dizin: function () { return window.KELIME_DIZIN || []; },
      cumle: function (en) {
        var k = Veri.katmani(en);
        var t = k && window['TEST_K' + k];
        return (t && t[en]) || null;
      },
      yukle: function (secili) { return Veri.testleriYukle(secili); }
    },
    obek: {
      ad: 'öbek',
      tur: 'obek',
      dizin: function () {
        if (!obekDizin && window.OBEKLER) {
          obekDizin = window.OBEKLER.map(function (o) {
            return { e: o.f, t: (o.a[0] || {}).tr || '', y: o.y, k: 0 };
          });
        }
        return obekDizin || [];
      },
      cumle: function (f) { return (window.TEST_OBEK && window.TEST_OBEK[f]) || null; },
      yukle: function () { return Veri.obekTestleriniYukle(); }
    }
  };

  var obekDizin = null;
  var aktif = KAYNAKLAR.kelime;
  function DIZINI() { return aktif.dizin(); }

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

  /* Dizinde "parts", "used", "growing" gibi çekimli girdiler de var (v4 listesi
     çekimleri köke bağlamadan taşıyor). Bunları bir daha çekmek "partses",
     "useded" üretir; kökü dizinde varsa çeldirici olarak kullanma. */
  var sozlukOnbellek = {};
  function sozlukte(e) {
    var ad = aktif.ad;
    if (!sozlukOnbellek[ad]) {
      var s = {};
      DIZINI().forEach(function (d) { s[d.e] = 1; });
      sozlukOnbellek[ad] = s;
    }
    return e.length > 2 && sozlukOnbellek[ad][e];
  }

  function zatenCekimli(e, f) {
    if (!f) return false;
    if (f === 'pl' || f === 's') {
      if (!/s$/.test(e)) return false;
      return sozlukte(e.slice(0, -1)) || sozlukte(e.slice(0, -2)) ||
             (/ies$/.test(e) && sozlukte(e.slice(0, -3) + 'y'));
    }
    if (f === 'past' || f === 'pp') {
      if (!/ed$/.test(e)) return false;
      return sozlukte(e.slice(0, -2)) || sozlukte(e.slice(0, -1)) ||
             (/ied$/.test(e) && sozlukte(e.slice(0, -3) + 'y'));
    }
    if (f === 'ing') {
      if (!/ing$/.test(e)) return false;
      return sozlukte(e.slice(0, -3)) || sozlukte(e.slice(0, -3) + 'e');
    }
    return false;
  }

  /* Öbeklerin ilk kelimeleri — çekimli girdileri ayıklamak için. */
  var obekIlkler = null;
  function obekCekimli(ilk, f) {
    if (!f) return false;
    if (!obekIlkler) {
      obekIlkler = {};
      DIZINI().forEach(function (d) { obekIlkler[d.e.split(/[\s-]+/)[0]] = 1; });
    }
    function kok(x) { return x.length > 2 && obekIlkler[x]; }
    if (/ing$/.test(ilk)) {
      return kok(ilk.slice(0, -3)) || kok(ilk.slice(0, -3) + 'e') || kok(ilk.slice(0, -4));
    }
    if (/ed$/.test(ilk)) {
      return kok(ilk.slice(0, -2)) || kok(ilk.slice(0, -1)) ||
             (/ied$/.test(ilk) && kok(ilk.slice(0, -3) + 'y')) || kok(ilk.slice(0, -3));
    }
    if (/s$/.test(ilk)) {
      return kok(ilk.slice(0, -1)) || kok(ilk.slice(0, -2)) ||
             (/ies$/.test(ilk) && kok(ilk.slice(0, -3) + 'y'));
    }
    return false;
  }

  /* Aynı kökten mi? (prompt / promptly, economy / economic) */
  function ayniKok(a, b) {
    // Öbeklerde ilk kelime belirleyici: "give up" ile "give in" aynı kökten.
    if (/[\s-]/.test(a) || /[\s-]/.test(b)) {
      return a.split(/[\s-]+/)[0] === b.split(/[\s-]+/)[0];
    }
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
      if (d.e === hedef.e) return false;
      if (aktif === KAYNAKLAR.obek) {
        // Öbekte ölçüt: aynı tür (deyimsel fiil / edat kalıbı) ve aynı çekime girebilmek
        if (d.y !== hedef.y) return false;
        if (ayniKok(d.e, hedef.e)) return false;
        var ilk = d.e.split(/[\s-]+/)[0];
        // Dizinde "carrying out", "carried out in" gibi ZATEN çekilmiş biçimler var;
        // onları yeniden çekmek "carryinged out" üretir.
        if (obekCekimli(ilk, f)) return false;
        if (cumledeGeciyorMu(cumle, ilk)) return false;
        var ob = Cekim.cek(d.e, f);
        return !!ob && ob !== soru.b;
      }
      if (/[^a-z]/.test(d.e)) return false;
      if (Math.abs(d.k - hedef.k) > mesafe) return false;
      var t = turler(d);
      if (gerekli === 'fiil') {
        // Fiil çekimi isteniyorsa gerçekten fiil olarak kullanılan kelime: Türkçesinde -mak/-mek var
        if (t.indexOf('fiil') === -1 || !FIIL_ANLAM.test(d.t || '')) return false;
      } else if (gerekli === 'isim') {
        if (t[0] !== 'isim') return false;
      } else if (!t.some(function (x) { return hedefTurler.indexOf(x) !== -1; })) return false;
      if (zatenCekimli(d.e, f)) return false;
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
      aday = karistir(DIZINI().filter(function (d) {
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

  /* Bugün çalışılanlar. Dönen kayıtlar HER ZAMAN kaynağın dizin kayıtlarıdır
     (tür/katman alanları çeldirici için gerekir); havuz yalnız sınırlama içindir
     ve hem {e:…} hem {en:…} biçimini kabul eder. */
  function bugunCalisilanlar(havuz) {
    var bugun = Il.bugun();
    var sinir = null;
    if (havuz && havuz.length) {
      sinir = {};
      havuz.forEach(function (x) { sinir[x.e || x.en] = 1; });
    }
    return DIZINI().filter(function (d) {
      if (sinir && !sinir[d.e]) return false;
      var r = Il.kayit(d.e, aktif.tur);
      // 5. kutu tamamlanmıştır; kullanıcı ilerlemeyi sıfırlayana kadar
      // günlük deste gibi bağlam testine de yeniden girmez.
      if (!r || !r.k || r.k >= 5) return false;
      // Yeni kayıtlarda son çalışma günü doğrudan tutulur. c alanı olmayan
      // eski kayıtlarda önceki tekrar-tarihi hesabı geriye uyumluluk sağlar.
      return typeof r.c === 'number'
        ? r.c === bugun
        : r.g - Il.ARALIK[r.k] === bugun;
    });
  }

  function testCumlesi(en) { return aktif.cumle(en); }

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
    var testteYanlis = Il.testYanlisKumesi(aktif.tur);
    adaylar = karistir(adaylar).sort(function (a, b) {
      var ya = testteYanlis[a.e] ? 0 : 1, yb = testteYanlis[b.e] ? 0 : 1;
      if (ya !== yb) return ya - yb;
      return Il.kutu(a.e, aktif.tur) - Il.kutu(b.e, aktif.tur);
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
    var ilerleme = $('tIlerleme');
    if (ilerleme) {
      ilerleme.setAttribute('aria-valuemax', String(sorular.length));
      ilerleme.setAttribute('aria-valuenow', String(sira + 1));
      ilerleme.setAttribute('aria-valuetext', (sira + 1) + ' / ' + sorular.length + ' soru');
    }
    $('tMetin').innerHTML = bosluklu(q.s.c);
    $('tSecenekler').innerHTML = q.secenekler.map(function (o, i) {
      return '<button class="opt" type="button" data-i="' + i + '">' +
               '<span class="key">' + HARF[i] + '</span><span lang="en">' + kacar(o.metin) + '</span></button>';
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
    if (dogruMu) { dogru++; Il.testDogru(q.d.e, aktif.tur); }
    else {
      Il.testYanlis(q.d.e, aktif.tur);
      yanlislar.push({ q: q, senin: q.secenekler[secim] });
    }

    var secilenD = q.secenekler[secim].d;
    var aciklama = '<p lang="en" style="margin:0 0 8px">' +
      bosluklu(q.s.c, '<b>' + kacar(q.s.b) + '</b>') + '</p>' +
      '<p class="muted" style="margin:0 0 10px">' + kacar(q.s.tr) + '</p>' +
      '<p style="margin:0"><b lang="en">' + kacar(q.d.e) + '</b> <span class="muted">(' +
      kacar(q.d.y) + ')</span> — ' + kacar(q.d.t) + '</p>';
    if (!dogruMu) {
      aciklama += '<p style="margin:6px 0 0"><span class="badge err">senin seçimin</span> <b>' +
        '<span lang="en">' + kacar(secilenD.e) + '</span></b> — ' + kacar(secilenD.t) + '</p>';
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
      ? 'Bilemediklerin "testte bilemediklerim" listesine yazıldı ve bir kutu geri alındı. Bir sonraki testte yine sorulur.'
      : 'Hepsini bildin. Kelimeler bağlam içinde de oturmuş.';
    $('tInceleme').innerHTML = yanlislar.map(function (y) {
      return '<div class="review-item">' +
        '<p class="q" lang="en" style="margin:0 0 6px">' +
          bosluklu(y.q.s.c, '<b>' + kacar(y.q.s.b) + '</b>') + '</p>' +
        '<p class="muted" style="margin:0 0 6px">' + kacar(y.q.s.tr) + '</p>' +
        '<p style="margin:0 0 4px"><span class="badge err">senin cevabın</span> <span lang="en">' +
          kacar(y.senin.metin) + '</span>' +
          ' <span class="muted">— ' + kacar(y.senin.d.t) + '</span></p>' +
        '<p style="margin:0"><span class="badge ok">doğru</span> <span lang="en">' + kacar(y.q.s.b) + '</span>' +
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

  /* Sayfa açılışında hangi kaynağı kullanacağımızı bildir (düğme metni vb. için). */
  function kaynakSec(kaynak) { aktif = KAYNAKLAR[kaynak] || KAYNAKLAR.kelime; }

  /* Testi başlat: gereken test dosyalarını indirir, soruları kurar, ekranı açar.
     Söz: {acildi: bool, soru: n, calisilan: n} */
  function baslat(havuz, secili, onKapat, kaynak) {
    kapandiginda = onKapat || null;
    aktif = KAYNAKLAR[kaynak || 'kelime'] || KAYNAKLAR.kelime;
    return aktif.yukle(secili).then(function () {
      var h = hazirla(havuz);
      if (h.sorular.length < EN_AZ) return { acildi: false, soru: h.sorular.length, calisilan: h.calisilan };
      sorular = h.sorular; sira = 0; dogru = 0; yanlislar = [];
      $('testAlan').hidden = false;
      $('tSoru').hidden = false;
      $('tSonuc').hidden = true;
      soruCiz();
      $('testAlan').scrollIntoView({ behavior: window.YDS.hareket(), block: 'start' });
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

  window.YDS.GununTesti = {
    baslat: baslat, bugunSayisi: bugunSayisi, kaynakSec: kaynakSec,
    EN_AZ: EN_AZ, EN_COK: EN_COK
  };
  window.YDS.KelimeTesti = window.YDS.GununTesti;   // eski ad
})();
