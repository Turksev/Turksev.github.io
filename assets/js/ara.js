/* ============================================================
   Site geneli arama: kelimeler, öbekler, bağlaçlar, sorular, gramer konuları,
   YDS konu haritası üniteleri ve kelime aileleri.

   Bir sonuca çift tıklamak ayrıntı kartını açar: kaydın tamamı (bütün anlamlar,
   örnek cümleler, ailesi, tekrar kutusu) sayfadan ayrılmadan görünür.
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

  /* Konu haritasındaki bütün üniteler (iki eksenin birleşimi). */
  var uniteOnbellek = null;
  function tumUniteler() {
    if (uniteOnbellek) return uniteOnbellek;
    uniteOnbellek = [];
    (window.KONULAR || []).forEach(function (eksen) {
      (eksen.u || []).forEach(function (u) {
        uniteOnbellek.push({
          k: u.k, ad: u.ad, kapsam: u.kapsam || '', kat: u.kat || '',
          etki: u.etki, zor: u.zor, soru: u.soru, risk: u.risk, on: u.on,
          eksen: eksen.ad
        });
      });
    });
    return uniteOnbellek;
  }

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
            rozet: Veri.KATMAN_ADI[d.k],
            tip: 'kelime', anahtar: d.e
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
            rozet: o.y,
            tip: 'obek', anahtar: o.f
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
            rozet: b.il,
            tip: 'baglac', anahtar: b.f
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
        satirlar: sorular.slice(0, SINIR).map(function (s, i) {
          return {
            bas: kesit(s.s, q, 60),
            alt: '',
            ek: kesit(String(s.ac).replace(/<[^>]+>/g, ''), q, 55),
            rozet: s.kat,
            tip: 'soru', anahtar: String(i)
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

    if (!tur || tur === 'unite') {
      var uniteler = tumUniteler().filter(function (u) {
        return eslesir(u.ad + ' ' + u.kapsam + ' ' + u.kat + ' ' + (u.soru || ''), q);
      });
      gruplar.push({
        ad: 'YDS konu haritası', url: 'konular.html', n: uniteler.length,
        satirlar: uniteler.slice(0, SINIR).map(function (u) {
          return {
            bas: vurgula(u.ad, q),
            alt: vurgula(u.kapsam, q),
            ek: u.kat,
            rozet: u.k,
            link: 'konular.html#' + u.k,
            tip: 'unite', anahtar: u.k
          };
        })
      });
    }

    if (!tur || tur === 'aile') {
      var aileler = (window.AILELER || []).filter(function (a) {
        return eslesir(a.k + ' ' + a.u.join(' '), q);
      });
      gruplar.push({
        ad: 'Kelime aileleri', url: 'aileler.html', n: aileler.length,
        satirlar: aileler.slice(0, SINIR).map(function (a) {
          return {
            bas: vurgula(a.k, q),
            alt: a.u.map(function (x) { return vurgula(x, q); }).join(' · '),
            ek: '',
            rozet: a.u.length + ' tür',
            link: 'aileler.html?a=' + encodeURIComponent(a.k),
            tip: 'aile', anahtar: a.k
          };
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
          var nitelik = r.tip
            ? ' data-tip="' + r.tip + '" data-anahtar="' + kacar(r.anahtar) + '"' +
              ' title="Ayrıntı kartı için çift tıkla"'
            : '';
          return r.link
            ? '<a class="ara-satir" href="' + r.link + '"' + nitelik + '>' + ic + '</a>'
            : '<div class="ara-satir"' + nitelik + '>' + ic + '</div>';
        }).join('') + fazla + '</div>';
    }).join('');
  }

  /* ---------- ayrıntı kartı (çift tıklama) ---------- */

  var Il = window.YDS.Ilerleme;
  var KUTU_ADI = ['hiç çalışılmadı', '1. kutu', '2. kutu', '3. kutu', '4. kutu', '5. kutu (öğrenildi)'];

  function rozet(metin, sinif) {
    return metin ? '<span class="badge ' + (sinif || '') + '">' + kacar(metin) + '</span>' : '';
  }

  function bolum(baslik, govde) {
    return govde ? '<div class="kart-bolum"><h4>' + baslik + '</h4>' + govde + '</div>' : '';
  }

  function anlamlar(liste) {
    return liste.map(function (a) {
      return '<div class="kart-anlam"><b>' + kacar(a.tr) + '</b>' +
        (a.ex ? '<i>' + kacar(a.ex) + '</i>' : '') +
        (a.exTr ? '<span>' + kacar(a.exTr) + '</span>' : '') + '</div>';
    }).join('');
  }

  function git(url, metin) {
    return '<p class="kart-git"><a class="btn ghost sm" href="' + url + '">' + metin + '</a></p>';
  }

  function kelimeKarti(en) {
    var Veri = window.YDS.Veri;
    var d = Veri.dizinKaydi(en);
    if (!d) return null;
    var tam = Veri.kayit(en);
    var kutu = Il ? Il.kutu(en) : 0;
    var aile = (window.AILELER || []).filter(function (a) { return a.u.indexOf(en) !== -1; })[0];
    var olumsuz = (window.OLUMSUZLAR || {})[en];

    var bas = '<h3>' + kacar(d.e) + '</h3>' +
      '<div class="kart-rozetler">' + rozet(d.y) + rozet(Veri.KATMAN_ADI[d.k], 'accent') +
      (d.p !== undefined ? rozet(d.p + ' puan') : '') +
      rozet(Il && Il.mezunMu(en) ? 'öğrenildi ✓' : KUTU_ADI[kutu], kutu >= 4 ? 'ok' : (kutu ? 'warn' : '')) +
      '</div>';

    var govde = tam
      ? bolum('Anlamlar ve örnekler', anlamlar(tam.a))
      : bolum('Anlamı', '<p style="margin:0">' + kacar(d.t) + '</p>' +
              '<p class="small muted" style="margin:6px 0 0">Örnek cümleler yükleniyor…</p>');

    if (tam && tam.kl && tam.kl.length) {
      govde += bolum('Kullanım kalıpları', '<div class="kalip">' + tam.kl.map(function (k) {
        return '<span><b>' + kacar(k.en) + '</b><i>' + kacar(k.tr) + '</i></span>';
      }).join('') + '</div>');
    }
    if (tam && tam.es) govde += bolum('Yakın anlamlılar', '<p style="margin:0">' + kacar(tam.es) + '</p>');
    if (olumsuz) {
      govde += bolum('Olumsuzu', '<p style="margin:0">' + olumsuz.map(function (o) {
        return '<b>' + kacar(o.f) + '</b> — ' + kacar(o.tr);
      }).join('<br>') + '</p>');
    }
    if (aile) {
      govde += bolum('Kelime ailesi', '<p style="margin:0">' + aile.u.map(function (x) {
        return x === en ? '<b>' + kacar(x) + '</b>' : kacar(x);
      }).join(' · ') + '</p>');
    }
    var test = window['TEST_K' + d.k] && window['TEST_K' + d.k][en];
    if (test) {
      govde += bolum('Günün testi cümlesi',
        '<p style="margin:0 0 4px">' + kacar(test.c).replace('----', '<b>' + kacar(test.b) + '</b>') + '</p>' +
        '<p class="small muted" style="margin:0">' + kacar(test.tr) + '</p>');
    }
    return bas + govde + git('kelimeler.html?q=' + encodeURIComponent(en), 'Kelime sayfasında aç');
  }

  function obekKarti(f) {
    var o = (window.OBEKLER || []).filter(function (x) { return x.f === f; })[0];
    if (!o) return null;
    return '<h3>' + kacar(o.f) + '</h3>' +
      '<div class="kart-rozetler">' + rozet(o.y) + rozet(o.s + ' sınavda', 'accent') + rozet(o.kn) + '</div>' +
      bolum('Anlamlar ve örnekler', anlamlar(o.a)) +
      git('obekler.html', 'Öbekler sayfasında aç');
  }

  function baglacKarti(f) {
    var b = (window.BAGLACLAR || []).filter(function (x) { return x.f === f; })[0];
    if (!b) return null;
    return '<h3>' + kacar(b.f) + '</h3>' +
      '<div class="kart-rozetler">' + rozet(b.il, 'accent') + rozet(b.yp) + rozet(b.dz) + '</div>' +
      bolum('Türkçesi', '<p style="margin:0">' + kacar(b.tr) + '</p>') +
      bolum('Örnekler', b.or.map(function (o) {
        return '<div class="kart-anlam"><i>' + kacar(o.en) + '</i><span>' + kacar(o.tr) + '</span></div>';
      }).join('')) +
      (b.es && b.es.length ? bolum('Yakın kullanım', '<p style="margin:0">' + kacar(b.es.join(', ')) + '</p>') : '') +
      git('baglaclar.html#banka', 'Bağlaçlar sayfasında aç');
  }

  function soruKarti(i) {
    var s = (window.SORULAR || [])[Number(i)];
    if (!s) return null;
    var harf = ['A', 'B', 'C', 'D', 'E'];
    return '<h3 style="font-size:1.15rem">' + kacar(s.s) + '</h3>' +
      '<div class="kart-rozetler">' + rozet(s.kat, 'accent') + '</div>' +
      bolum('Şıklar', '<p style="margin:0">' + s.se.map(function (x, j) {
        return (j === s.d ? '<b>' + harf[j] + ') ' + kacar(x) + ' ✓</b>' : harf[j] + ') ' + kacar(x));
      }).join('<br>') + '</p>') +
      bolum('Açıklama', '<p style="margin:0">' + s.ac + '</p>') +
      git('quiz.html', 'Quiz sayfasında çöz');
  }

  function uniteKarti(kod) {
    var u = tumUniteler().filter(function (x) { return x.k === kod; })[0];
    if (!u) return null;
    var metin = (window.KONU_METINLERI || {})[kod];
    return '<h3 style="font-size:1.25rem">' + kacar(u.ad) + '</h3>' +
      '<div class="kart-rozetler">' + rozet(u.k, 'accent') + rozet(u.eksen) + rozet(u.kat) +
      (u.etki ? rozet('YDS etkisi: ' + u.etki) : '') + (u.zor ? rozet('zorluk: ' + u.zor) : '') + '</div>' +
      bolum('Kapsam', '<p style="margin:0">' + kacar(u.kapsam) + '</p>') +
      (u.soru ? bolum('Soru türleri', '<p style="margin:0">' + kacar(u.soru) + '</p>') : '') +
      (u.risk ? bolum('Türkçe kaynaklı hata riski', '<p style="margin:0">' + kacar(u.risk) + '</p>') : '') +
      (metin ? bolum('Anlatım özeti', '<p style="margin:0">' + kacar(metin.ozet) + '</p>') : '') +
      git('konular.html#' + u.k, metin ? 'Konu anlatımını aç' : 'Konu haritasında aç');
  }

  function aileKarti(kok) {
    var a = (window.AILELER || []).filter(function (x) { return x.k === kok; })[0];
    if (!a) return null;
    var Veri = window.YDS.Veri;
    return '<h3>' + kacar(a.k) + ' ailesi</h3>' +
      '<div class="kart-rozetler">' + rozet(a.u.length + ' tür', 'accent') + '</div>' +
      bolum('Üyeler', '<p style="margin:0">' + a.u.map(function (x) {
        var d = Veri.dizinKaydi(x);
        return '<b>' + kacar(x) + '</b>' + (d ? ' <span class="muted">— ' + kacar(d.t) + '</span>' : '');
      }).join('<br>') + '</p>') +
      git('aileler.html', 'Aileler sayfasında aç');
  }

  function kartiKapat() {
    $('kartPerde').hidden = true;
    document.body.style.overflow = '';
  }

  function kartiAc(tip, anahtar) {
    var ic = null;
    if (tip === 'kelime') ic = kelimeKarti(anahtar);
    else if (tip === 'obek') ic = obekKarti(anahtar);
    else if (tip === 'baglac') ic = baglacKarti(anahtar);
    else if (tip === 'soru') ic = soruKarti(anahtar);
    else if (tip === 'unite') ic = uniteKarti(anahtar);
    else if (tip === 'aile') ic = aileKarti(anahtar);
    if (!ic) return;

    $('kartIcerik').innerHTML = ic;
    $('kartPerde').hidden = false;
    document.body.style.overflow = 'hidden';
    $('kartKapat').focus();

    // Kelimenin tam kaydı (örnek cümleler) o katman dosyasındadır; gerekirse indir.
    if (tip === 'kelime') {
      var Veri = window.YDS.Veri;
      var k = Veri.katmani(anahtar);
      if (k && !Veri.katmanYukluMu(k)) {
        Veri.katmanYukle(k).then(function () {
          if ($('kartPerde').hidden) return;
          var yeni = kelimeKarti(anahtar);
          if (yeni) $('kartIcerik').innerHTML = yeni;
        }).catch(function () {});
      }
    }
  }

  elSonuc.addEventListener('dblclick', function (e) {
    var satir = e.target.closest('.ara-satir[data-tip]');
    if (!satir) return;
    e.preventDefault();
    kartiAc(satir.getAttribute('data-tip'), satir.getAttribute('data-anahtar'));
  });

  $('kartKapat').addEventListener('click', kartiKapat);
  $('kartPerde').addEventListener('click', function (e) {
    if (e.target === $('kartPerde')) kartiKapat();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('kartPerde').hidden) kartiKapat();
  });

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
