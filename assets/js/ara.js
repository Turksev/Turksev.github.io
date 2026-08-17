/* ============================================================
   Site geneli arama: kelimeler, bağlaçlar, sorular ve gramer konuları
   ============================================================ */

(function () {
  'use strict';

  var sadelestir = window.YDS.sadelestir;
  var kacar = window.YDS.kacar;

  var SINIR = 40;              // tür başına gösterilecek en fazla sonuç

  /* Gramer konularının el yapımı dizini — sayfa metnini indirmeden arayabilmek için. */
  var KONULAR = [
    { b: 'Zamanlar', u: 'gramer.html#zamanlar', a: 'tense present perfect past continuous future simple by the time since for ago zaman' },
    { b: 'Edilgen Yapı (Passive)', u: 'gramer.html#edilgen', a: 'passive edilgen be V3 is said to believed thought pasif' },
    { b: 'Modals ve Perfect Modals', u: 'gramer.html#modals', a: 'modal must have should needn\'t could might may kip perfect modal' },
    { b: 'Koşul Cümleleri (If Clauses)', u: 'gramer.html#kosul', a: 'if clause koşul type 1 2 3 unless but for provided wish would have' },
    { b: 'Sıfat Cümlecikleri (Relative Clauses)', u: 'gramer.html#sifat', a: 'relative clause who whom which that whose where sıfat cümleciği defining' },
    { b: 'İsim Cümlecikleri (Noun Clauses)', u: 'gramer.html#isim', a: 'noun clause what whether if that isim cümleciği soru sırası' },
    { b: 'Bağlaçlar ve Geçişler', u: 'gramer.html#baglac', a: 'bağlaç conjunction however despite although because of therefore geçiş' },
    { b: 'Gerund ve Infinitive', u: 'gramer.html#gerund', a: 'gerund infinitive ing to V1 remember forget stop try regret edat' },
    { b: 'Devrik Yapılar (Inversion)', u: 'gramer.html#devrik', a: 'inversion devrik hardly scarcely no sooner not only never rarely little' },
    { b: 'Preposition Kalıpları', u: 'gramer.html#preposition', a: 'preposition edat accused of prone to consistent with exempt from result in' },
    { b: 'Bağlaç: çözüm yöntemi', u: 'baglaclar.html#yontem', a: 'bağlaç soru çözme yöntem adım anlam ilişkisi' },
    { b: 'Bağlaç: sonrasında ne gelir?', u: 'baglaclar.html#yapi', a: 'bağlaç yapı cümle isim gerund cümle zarfı eş ikili' },
    { b: 'Bağlaç: üç dilbilgisi grubu', u: 'baglaclar.html#gruplar', a: 'coordinating subordinating correlative fanboys paralellik' },
    { b: 'Bağlaç: karıştırılan çiftler', u: 'baglaclar.html#nuans', a: 'because because of although despite so so that while whereas even if even though' }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var elAra = $('ara'), elTur = $('tur'), elSayac = $('sayac'), elSonuc = $('sonuclar');

  /* Eşleşen parçayı kalın göster. */
  function vurgula(metin, q) {
    var ham = String(metin == null ? '' : metin);
    var sade = sadelestir(ham);
    var yer = sade.indexOf(q);
    if (yer === -1) return kacar(ham);
    return kacar(ham.slice(0, yer)) + '<mark>' + kacar(ham.slice(yer, yer + q.length)) +
           '</mark>' + kacar(ham.slice(yer + q.length));
  }

  /* Uzun metinde eşleşmenin çevresinden kısa bir kesit al. */
  function kesit(metin, q, cevre) {
    var ham = String(metin == null ? '' : metin);
    var yer = sadelestir(ham).indexOf(q);
    if (yer === -1) return kacar(ham.slice(0, cevre * 2)) + (ham.length > cevre * 2 ? '…' : '');
    var bas = Math.max(0, yer - cevre);
    var son = Math.min(ham.length, yer + q.length + cevre);
    return (bas > 0 ? '…' : '') +
      kacar(ham.slice(bas, yer)) + '<mark>' + kacar(ham.slice(yer, yer + q.length)) + '</mark>' +
      kacar(ham.slice(yer + q.length, son)) + (son < ham.length ? '…' : '');
  }

  function eslesir(havuz, q) { return sadelestir(havuz).indexOf(q) !== -1; }

  /* ---------- arama ---------- */

  function ara(q) {
    var tur = elTur.value;
    var gruplar = [];

    if (!tur || tur === 'kelime') {
      var Veri = window.YDS.Veri;
      var kelimeler = Veri.dizin.filter(function (d) {
        return eslesir(d.e + ' ' + d.t + ' ' + d.y, q);
      });
      gruplar.push({
        ad: 'Kelimeler', url: 'kelimeler.html', n: kelimeler.length,
        satirlar: kelimeler.slice(0, SINIR).map(function (d) {
          return {
            bas: vurgula(d.e, q),
            alt: vurgula(d.t, q),
            ek: '',
            rozet: Veri.KATMAN_ADI[d.k]
          };
        })
      });
    }

    if (!tur || tur === 'obek') {
      var obekler = (window.OBEKLER || []).filter(function (o) {
        var havuz = o.f + ' ' + o.y + ' ' + o.a.map(function (a) { return a.tr + ' ' + a.ex; }).join(' ');
        return eslesir(havuz, q);
      });
      gruplar.push({
        ad: 'Öbekler', url: 'obekler.html', n: obekler.length,
        satirlar: obekler.slice(0, SINIR).map(function (o) {
          return {
            bas: vurgula(o.f, q),
            alt: vurgula(o.a[0].tr, q),
            ek: kesit(o.a[0].ex, q, 45),
            rozet: o.y
          };
        })
      });
    }

    if (!tur || tur === 'baglac') {
      var baglaclar = (window.BAGLACLAR || []).filter(function (b) {
        var ornek = b.or.map(function (o) { return o.en + ' ' + o.tr; }).join(' ');
        return eslesir(b.f + ' ' + b.tr + ' ' + b.il + ' ' + ornek, q);
      });
      gruplar.push({
        ad: 'Bağlaçlar', url: 'baglaclar.html#banka', n: baglaclar.length,
        satirlar: baglaclar.slice(0, SINIR).map(function (b) {
          return {
            bas: vurgula(b.f, q),
            alt: vurgula(b.tr, q),
            ek: kesit(b.or[0] ? b.or[0].en : '', q, 45),
            rozet: b.il
          };
        })
      });
    }

    if (!tur || tur === 'soru') {
      var sorular = (window.SORULAR || []).filter(function (s) {
        return eslesir(s.s + ' ' + s.se.join(' ') + ' ' + s.ac, q);
      });
      gruplar.push({
        ad: 'Sorular', url: 'quiz.html', n: sorular.length,
        satirlar: sorular.slice(0, SINIR).map(function (s) {
          return {
            bas: kesit(s.s, q, 60),
            alt: '',
            ek: kesit(String(s.ac).replace(/<[^>]+>/g, ''), q, 55),
            rozet: s.kat
          };
        })
      });
    }

    if (!tur || tur === 'konu') {
      var konular = KONULAR.filter(function (k) { return eslesir(k.b + ' ' + k.a, q); });
      gruplar.push({
        ad: 'Gramer konuları', url: 'gramer.html', n: konular.length,
        satirlar: konular.map(function (k) {
          return { bas: vurgula(k.b, q), alt: '', ek: '', rozet: '', link: k.u };
        })
      });
    }

    return gruplar.filter(function (g) { return g.n > 0; });
  }

  /* ---------- çizim ---------- */

  function ciz() {
    var ham = elAra.value.trim();
    var q = sadelestir(ham);

    if (q.length < 2) {
      elSayac.textContent = 'Aramak için en az iki harf yaz.';
      elSonuc.innerHTML = '';
      return;
    }

    var gruplar = ara(q);
    var toplam = gruplar.reduce(function (t, g) { return t + g.n; }, 0);

    if (!toplam) {
      elSayac.textContent = '"' + ham + '" için sonuç bulunamadı.';
      elSonuc.innerHTML = '<div class="empty">Farklı bir yazım ya da Türkçe karşılığını dene.</div>';
      return;
    }

    elSayac.textContent = toplam + ' sonuç bulundu.';
    elSonuc.innerHTML = gruplar.map(function (g) {
      var fazla = g.n > g.satirlar.length
        ? '<p class="small muted" style="margin:10px 0 0">… ve ' + (g.n - g.satirlar.length) +
          ' sonuç daha. <a href="' + g.url + '">Tümünü ' + g.ad.toLowerCase() + ' sayfasında gör</a>.</p>'
        : '';
      return '<h2 style="margin-top:28px">' + g.ad +
          ' <span class="badge">' + g.n + '</span></h2>' +
        '<div class="card">' + g.satirlar.map(function (r) {
          var ic =
            '<div class="ara-bas">' + r.bas + (r.rozet ? ' <span class="badge">' + kacar(r.rozet) + '</span>' : '') + '</div>' +
            (r.alt ? '<div class="ara-alt">' + r.alt + '</div>' : '') +
            (r.ek ? '<div class="ara-ek">' + r.ek + '</div>' : '');
          return r.link
            ? '<a class="ara-satir" href="' + r.link + '">' + ic + '</a>'
            : '<div class="ara-satir">' + ic + '</div>';
        }).join('') + fazla + '</div>';
    }).join('');
  }

  /* ---------- öbekler: ilk aramada arka planda yükle ---------- */

  /* Öbek dosyası 630 KB; sayfa açılır açılmaz indirmenin anlamı yok.
     Kullanıcı ilk kez arama yapınca getirilir, gelince sonuçlar tazelenir. */
  var obekIstendi = false;

  function obekleriGerekirseYukle() {
    if (obekIstendi || window.OBEKLER) return;
    obekIstendi = true;
    window.YDS.Veri.obekleriYukle().then(function () { ciz(); }).catch(function () { });
  }

  /* ---------- olaylar ---------- */

  elAra.addEventListener('input', function () { obekleriGerekirseYukle(); ciz(); });
  elTur.addEventListener('change', function () { obekleriGerekirseYukle(); ciz(); });

  // Adres çubuğundan gelen ?q=... aramasını uygula (arama motoru bağlantıları için).
  var q0 = new URLSearchParams(location.search).get('q');
  if (q0) { elAra.value = q0; obekleriGerekirseYukle(); }
  ciz();
})();
