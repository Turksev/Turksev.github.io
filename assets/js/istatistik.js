/* ============================================================
   İstatistik sayfası — çalışma hızın ve ivmen

   İki kaynaktan beslenir:
     yds-gunluk-kayit  günlük sayaçlar (ilerleme.js yazar) {t, y, d, m, z}
     yds-leitner       kart başına kutu (k) ve son çalışma günü (c)

   Günlük sayaç 07.09.2026'da eklendi. Ondan ÖNCEKİ günler için elde yalnız her
   kartın SON çalışıldığı gün var; o günler "tahmini" olarak açık renkte çizilir
   ve gerçekte daha yüksektir (bir kart iki kez çalışıldıysa yalnız son günü
   sayılır, önceki günlerin yükü kaydın içinde kalmaz).

   Grafikler dışarıdan kütüphane kullanmaz: hepsi satır içi SVG. Renkler CSS
   değişkenlerinden gelir, böylece koyu tema kendiliğinden doğru çalışır.
   ============================================================ */

(function () {
  'use strict';

  var Il = window.YDS.Ilerleme;
  var Veri = window.YDS.Veri;
  var Depo = window.YDS.Depo;
  var kacar = window.YDS.kacar;
  var $ = function (id) { return document.getElementById(id); };

  var GUN_MS = 86400000;
  var HAFTA_SAYISI = 26;          // ısı haritası genişliği
  var HAFTALIK_SAYISI = 12;       // haftalık ritim grafiği

  var bugun = Il.bugun();
  var gunAdlari = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  function gunTarihi(g) { return new Date(g * GUN_MS); }

  /* Gün numarası yerel gece yarısından üretilir; biçimlendirmeyi UTC'ye
     sabitlemek negatif saat dilimlerinde bir gün kaymasını önler. */
  function tarihKisa(g) {
    return gunTarihi(g).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  }
  function tarihUzun(g) {
    return gunTarihi(g).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  function haftaninGunu(g) { return (gunTarihi(g).getUTCDay() + 6) % 7; }   // 0 = Pazartesi

  function sayi(n, basamak) {
    return Number(n || 0).toLocaleString('tr-TR', {
      minimumFractionDigits: basamak || 0, maximumFractionDigits: basamak || 0
    });
  }

  /* ---------- veri ---------- */

  var kayitlar = Il.tumKayitlar();
  var gunluk = Il.gunlukKayitlar();

  /* Günlük kayıt hangi günde başladı? Ondan öncesi leitner'daki son çalışma
     gününden tahmin edilir; ikisi asla aynı günü iki kez saymaz. */
  var gercekGunler = Object.keys(gunluk).map(Number).filter(function (g) { return isFinite(g); });
  var ilkGercek = gercekGunler.length ? Math.min.apply(null, gercekGunler) : bugun + 1;

  var seri = {};                  // gün -> {t, y, d, m, z, tahmin}
  function gun(g) {
    if (!seri[g]) seri[g] = { t: 0, y: 0, d: 0, m: 0, z: 0, tahmin: false };
    return seri[g];
  }
  Object.keys(gunluk).forEach(function (g) {
    var k = gunluk[g];
    var hedef = gun(Number(g));
    hedef.t = k.t; hedef.y = k.y; hedef.d = k.d; hedef.m = k.m; hedef.z = k.z;
  });
  Object.keys(kayitlar).forEach(function (id) {
    var c = kayitlar[id].c;
    if (typeof c !== 'number' || !isFinite(c) || c >= ilkGercek || c > bugun) return;
    var hedef = gun(c);
    hedef.t += 1;
    hedef.tahmin = true;
  });

  function gunDegeri(g, alan) { return (seri[g] && seri[g][alan]) || 0; }

  /* Bir gün "çalışıldı" sayılır: kart cevaplandı ya da kart ayıklandı. */
  function calisildiMi(g) { return gunDegeri(g, 't') + gunDegeri(g, 'z') > 0; }

  function pencere(bitis, uzunluk, alan) {
    var toplam = 0;
    for (var g = bitis - uzunluk + 1; g <= bitis; g++) toplam += gunDegeri(g, alan);
    return toplam;
  }

  var ilkGun = Object.keys(seri).map(Number);
  var enEski = ilkGun.length ? Math.min.apply(null, ilkGun) : bugun;
  var hicVeriYok = !ilkGun.length;

  /* ---------- SVG yardımcıları ---------- */

  function svg(w, h, etiket, govde) {
    return '<svg class="grafik" viewBox="0 0 ' + w + ' ' + h + '" role="img" ' +
      'aria-label="' + kacar(etiket) + '" preserveAspectRatio="xMidYMid meet">' + govde + '</svg>';
  }
  function dikdortgen(x, y, w, h, sinif, baslik) {
    return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(0.5, w).toFixed(1) +
      '" height="' + Math.max(0, h).toFixed(1) + '" class="' + sinif + '" rx="1.5">' +
      (baslik ? '<title>' + kacar(baslik) + '</title>' : '') + '</rect>';
  }
  function yazi(x, y, s, sinif, hiza) {
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '"' +
      (sinif ? ' class="' + sinif + '"' : '') +
      (hiza ? ' text-anchor="' + hiza + '"' : '') + '>' + kacar(s) + '</text>';
  }

  /* Y ekseni için okunaklı üst sınır. Yalnız 1-2-5 kullanmak 55'i 100'e
     çıkarıp grafiğin yarısını boş bırakıyordu; ara basamaklar da var. */
  var BASAMAK = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  function ustSinir(enBuyuk) {
    if (enBuyuk <= 5) return 5;
    var buyukluk = Math.pow(10, Math.floor(Math.log(enBuyuk) / Math.LN10));
    var oran = enBuyuk / buyukluk;
    for (var i = 0; i < BASAMAK.length; i++) {
      if (oran <= BASAMAK[i]) return BASAMAK[i] * buyukluk;
    }
    return 10 * buyukluk;
  }

  /* ---------- özet şeridi ---------- */

  function ozetCiz() {
    var bugunKart = gunDegeri(bugun, 't') + gunDegeri(bugun, 'z');
    var son7 = pencere(bugun, 7, 't') + pencere(bugun, 7, 'z');
    var onceki7 = pencere(bugun - 7, 7, 't') + pencere(bugun - 7, 7, 'z');
    var hiz = son7 / 7, oncekiHiz = onceki7 / 7;
    var ivme = hiz - oncekiHiz;
    var yuzde = oncekiHiz > 0 ? Math.round((ivme / oncekiHiz) * 100) : null;

    // Seri: bugünden (bugün boşsa dünden) geriye kesintisiz çalışılan gün sayısı.
    var seriBas = calisildiMi(bugun) ? bugun : bugun - 1;
    var suanki = 0;
    for (var g = seriBas; g >= enEski && calisildiMi(g); g--) suanki++;
    var enUzun = 0, sayac = 0;
    for (var t = enEski; t <= bugun; t++) {
      if (calisildiMi(t)) { sayac++; if (sayac > enUzun) enUzun = sayac; } else sayac = 0;
    }

    var ivmeSinif = ivme > 0.05 ? 'iyi' : ivme < -0.05 ? 'kotu' : 'notr';
    var ivmeMetin = (ivme > 0 ? '+' : ivme < 0 ? '−' : '±') + sayi(Math.abs(ivme), 1);
    var ivmeAlt = onceki7 === 0
      ? 'önceki hafta veri yok'
      : (yuzde === null ? '' : (yuzde > 0 ? '↑ %' : yuzde < 0 ? '↓ %' : '%') + Math.abs(yuzde)) +
        ' · önceki hafta ' + sayi(oncekiHiz, 1) + '/gün';

    $('ozet').innerHTML = [
      ['Bugün', sayi(bugunKart), 'kart', calisildiMi(bugun) ? 'bugün çalıştın' : 'henüz başlamadın', 'notr'],
      ['Son 7 gün', sayi(son7), 'kart', 'günlük ' + sayi(hiz, 1) + ' kart', 'notr'],
      ['Hız', sayi(hiz, 1), 'kart/gün', 'son 7 günün ortalaması', 'notr'],
      ['İvme', ivmeMetin, 'kart/gün', ivmeAlt, ivmeSinif],
      ['Seri', sayi(suanki), suanki === 1 ? 'gün' : 'gün', 'en uzun ' + sayi(enUzun) + ' gün', suanki > 0 ? 'iyi' : 'notr']
    ].map(function (k) {
      return '<div class="ist-kart ' + k[4] + '">' +
        '<span class="ist-ad">' + kacar(k[0]) + '</span>' +
        '<b class="ist-deger">' + kacar(k[1]) + ' <i>' + kacar(k[2]) + '</i></b>' +
        '<span class="ist-alt">' + kacar(k[3]) + '</span></div>';
    }).join('');
  }

  /* ---------- günlük çalışma grafiği ---------- */

  function gunlukCiz(gunSayisi) {
    var W = 720, H = 230, sol = 36, sag = 8, ust = 12, alt = 26;
    var bas = bugun - gunSayisi + 1;
    var degerler = [], enBuyuk = 0, tahminVar = false, toplam = 0;
    for (var g = bas; g <= bugun; g++) {
      var v = gunDegeri(g, 't') + gunDegeri(g, 'z');
      var tahmin = !!(seri[g] && seri[g].tahmin);
      if (tahmin) tahminVar = true;
      toplam += v;
      if (v > enBuyuk) enBuyuk = v;
      degerler.push({ g: g, v: v, y: gunDegeri(g, 'y'), tahmin: tahmin });
    }
    var tavan = ustSinir(enBuyuk);
    var alanG = W - sol - sag, alanY = H - ust - alt;
    var adim = alanG / gunSayisi;
    var barG = Math.max(1.5, adim * 0.72);
    var yOl = function (v) { return ust + alanY - (v / tavan) * alanY; };

    var govde = '';
    // yatay ızgara ve y etiketleri
    [0, 0.5, 1].forEach(function (oran) {
      var deger = tavan * oran, y = yOl(deger);
      govde += '<line x1="' + sol + '" y1="' + y.toFixed(1) + '" x2="' + (W - sag) + '" y2="' + y.toFixed(1) + '" class="izgara"/>';
      govde += yazi(sol - 6, y + 3.5, sayi(Math.round(deger)), 'eksen-yazi', 'end');
    });
    degerler.forEach(function (d, i) {
      var x = sol + i * adim + (adim - barG) / 2;
      var yy = yOl(d.v);
      govde += dikdortgen(x, yy, barG, ust + alanY - yy, d.tahmin ? 'bar tahmini' : 'bar',
        tarihUzun(d.g) + ': ' + d.v + ' kart' + (d.y ? ' (' + d.y + ' yeni)' : '') + (d.tahmin ? ' — tahmini' : ''));
    });
    // 7 günlük hareketli ortalama
    var nokta = [];
    degerler.forEach(function (d, i) {
      if (i < 6) return;
      var t = 0;
      for (var j = i - 6; j <= i; j++) t += degerler[j].v;
      nokta.push((sol + i * adim + adim / 2).toFixed(1) + ',' + yOl(t / 7).toFixed(1));
    });
    if (nokta.length > 1) govde += '<polyline points="' + nokta.join(' ') + '" class="ortalama"/>';
    // x etiketleri: baş, orta, son
    [0, Math.floor(gunSayisi / 2), gunSayisi - 1].forEach(function (i, sira) {
      var x = sol + i * adim + adim / 2;
      govde += yazi(x, H - 8, tarihKisa(bas + i), 'eksen-yazi', sira === 0 ? 'start' : sira === 2 ? 'end' : 'middle');
    });

    $('gunlukGrafik').innerHTML = svg(W, H,
      'Son ' + gunSayisi + ' günde çalışılan kart sayısı. Toplam ' + toplam +
      ' kart, günlük ortalama ' + sayi(toplam / gunSayisi, 1) + '.', govde);
    $('gunlukOzet').textContent = 'Son ' + gunSayisi + ' günde ' + sayi(toplam) + ' kart · günde ortalama ' +
      sayi(toplam / gunSayisi, 1) + ' kart';
    $('tahminNot').hidden = !tahminVar;
  }

  /* ---------- ısı haritası ---------- */

  function isiCiz() {
    var hucre = 13, bosluk = 3, solEtiket = 26, ustEtiket = 14;
    var sonPzt = bugun - haftaninGunu(bugun);
    var ilkPzt = sonPzt - (HAFTA_SAYISI - 1) * 7;
    var W = solEtiket + HAFTA_SAYISI * (hucre + bosluk), H = ustEtiket + 7 * (hucre + bosluk) + 4;

    var enBuyuk = 1;
    for (var g = ilkPzt; g <= bugun; g++) {
      var v = gunDegeri(g, 't') + gunDegeri(g, 'z');
      if (v > enBuyuk) enBuyuk = v;
    }

    var govde = '', toplam = 0, dolu = 0;
    for (var h = 0; h < HAFTA_SAYISI; h++) {
      for (var d = 0; d < 7; d++) {
        var gunNo = ilkPzt + h * 7 + d;
        if (gunNo > bugun) continue;
        var deger = gunDegeri(gunNo, 't') + gunDegeri(gunNo, 'z');
        toplam += deger;
        if (deger > 0) dolu++;
        var seviye = deger === 0 ? 0 : Math.min(4, 1 + Math.floor((deger / enBuyuk) * 3.999));
        var x = solEtiket + h * (hucre + bosluk);
        var y = ustEtiket + d * (hucre + bosluk);
        govde += '<rect x="' + x + '" y="' + y + '" width="' + hucre + '" height="' + hucre +
          '" rx="3" class="isi s' + seviye + (seri[gunNo] && seri[gunNo].tahmin ? ' tahmini' : '') + '">' +
          '<title>' + kacar(tarihUzun(gunNo) + ': ' + deger + ' kart') + '</title></rect>';
      }
    }
    [0, 2, 4, 6].forEach(function (d) {
      govde += yazi(solEtiket - 6, ustEtiket + d * (hucre + bosluk) + hucre - 3, gunAdlari[d], 'eksen-yazi', 'end');
    });
    govde += yazi(solEtiket, ustEtiket - 4, tarihKisa(ilkPzt), 'eksen-yazi', 'start');
    govde += yazi(W, ustEtiket - 4, tarihKisa(bugun), 'eksen-yazi', 'end');

    $('isiGrafik').innerHTML = svg(W, H,
      'Son ' + HAFTA_SAYISI + ' haftanın çalışma takvimi: ' + dolu + ' günde toplam ' + toplam + ' kart.', govde);
    $('isiOzet').textContent = 'Son ' + HAFTA_SAYISI + ' haftada ' + sayi(dolu) + ' gün çalışma · toplam ' +
      sayi(toplam) + ' kart';
  }

  /* ---------- haftalık ritim ve ivme ---------- */

  function haftalikCiz() {
    var W = 720, H = 210, sol = 36, sag = 8, ust = 22, alt = 30;
    var sonPzt = bugun - haftaninGunu(bugun);
    var haftalar = [];
    for (var i = HAFTALIK_SAYISI - 1; i >= 0; i--) {
      var bas = sonPzt - i * 7;
      var t = 0, yeni = 0;
      for (var g = bas; g < bas + 7 && g <= bugun; g++) {
        t += gunDegeri(g, 't') + gunDegeri(g, 'z');
        yeni += gunDegeri(g, 'y');
      }
      haftalar.push({ bas: bas, t: t, y: yeni, acik: i === 0 });
    }
    var tavan = ustSinir(haftalar.reduce(function (m, h) { return Math.max(m, h.t); }, 0));
    var alanG = W - sol - sag, alanY = H - ust - alt;
    var adim = alanG / HAFTALIK_SAYISI, barG = Math.min(38, adim * 0.6);
    var yOl = function (v) { return ust + alanY - (v / tavan) * alanY; };

    var govde = '';
    [0, 0.5, 1].forEach(function (oran) {
      var deger = tavan * oran, y = yOl(deger);
      govde += '<line x1="' + sol + '" y1="' + y.toFixed(1) + '" x2="' + (W - sag) + '" y2="' + y.toFixed(1) + '" class="izgara"/>';
      govde += yazi(sol - 6, y + 3.5, sayi(Math.round(deger)), 'eksen-yazi', 'end');
    });
    haftalar.forEach(function (h, i) {
      var x = sol + i * adim + (adim - barG) / 2;
      var y = yOl(h.t);
      govde += dikdortgen(x, y, barG, ust + alanY - y, h.acik ? 'bar suren' : 'bar',
        tarihUzun(h.bas) + ' haftası: ' + h.t + ' kart' + (h.acik ? ' (hafta sürüyor)' : ''));
      if (i > 0) {
        var fark = h.t - haftalar[i - 1].t;
        if (h.t > 0 || haftalar[i - 1].t > 0) {
          govde += yazi(x + barG / 2, Math.max(10, y - 5),
            (fark > 0 ? '▲' : fark < 0 ? '▼' : '•') + (fark === 0 ? '' : Math.abs(fark)),
            'fark ' + (fark > 0 ? 'iyi' : fark < 0 ? 'kotu' : 'notr'), 'middle');
        }
      }
      if (i % 2 === 0 || i === HAFTALIK_SAYISI - 1) {
        govde += yazi(x + barG / 2, H - 10, tarihKisa(h.bas), 'eksen-yazi', 'middle');
      }
    });

    var son = haftalar[HAFTALIK_SAYISI - 1], oncekiHafta = haftalar[HAFTALIK_SAYISI - 2];
    $('haftalikGrafik').innerHTML = svg(W, H,
      'Son ' + HAFTALIK_SAYISI + ' haftanın toplam kart sayısı ve haftadan haftaya değişim.', govde);
    $('haftalikOzet').textContent = 'Bu hafta (sürüyor) ' + sayi(son.t) + ' kart · geçen hafta ' +
      sayi(oncekiHafta.t) + ' kart · yeni kart ' + sayi(son.y);
  }

  /* ---------- öğrenme birikimi ---------- */

  function birikimCiz() {
    var toplamKelime = (window.SAYILAR && window.SAYILAR.kelime) || 0;
    var ozet = Il.leitnerOzetSayidan(toplamKelime, 'kelime');
    var kutular = [1, 2, 3, 4, 5].map(function (k) { return ozet['k' + k]; });
    var calisilan = ozet.calisilan;

    var W = 720, H = 54, sol = 0;
    var toplam = Math.max(1, toplamKelime);
    var x = sol, govde = '';
    kutular.forEach(function (n, i) {
      var w = (n / toplam) * W;
      if (w > 0) govde += dikdortgen(x, 8, w, 26, 'kutu-dilim k' + (i + 1),
        (i + 1) + '. kutu: ' + sayi(n) + ' kelime');
      x += w;
    });
    if (x < W) govde += dikdortgen(x, 8, W - x, 26, 'kutu-dilim k0',
      'Hiç çalışılmamış: ' + sayi(toplamKelime - calisilan) + ' kelime');
    $('kutuGrafik').innerHTML = svg(W, H,
      sayi(calisilan) + ' kelime çalışıldı, ' + sayi(ozet.ogrenilen) + ' tanesi son kutuda.', govde);
    $('kutuEfsane').innerHTML = [1, 2, 3, 4, 5].map(function (k) {
      return '<span class="efsane"><i class="orn k' + k + '"></i>' + k + '. kutu ' + sayi(kutular[k - 1]) + '</span>';
    }).join('') + '<span class="efsane"><i class="orn k0"></i>Başlanmamış ' + sayi(toplamKelime - calisilan) + '</span>';

    // Seçili katmanlara göre bitiş tahmini: yeni kart açma hızı belirleyicidir.
    var secili = Depo.oku('yds-katmanlar', [2]);
    if (!Array.isArray(secili) || !secili.length) secili = [2];
    var katmanSayilari = Veri.katmanSayilari();
    var havuz = secili.reduce(function (t, k) { return t + (katmanSayilari[k] || 0); }, 0);
    var havuzCalisilan = 0;
    var dizinKatman = {};
    Veri.dizin.forEach(function (d) { dizinKatman[d.e] = d.k; });
    Object.keys(kayitlar).forEach(function (id) {
      var coz = Il.kimlikCoz(id);
      if ((coz.tur || 'kelime') !== 'kelime') return;
      if (secili.indexOf(dizinKatman[coz.ad]) !== -1) havuzCalisilan++;
    });
    var kalan = Math.max(0, havuz - havuzCalisilan);
    var yeniHiz = pencere(bugun, 14, 'y') / 14;
    var tahmin;
    if (kalan === 0) {
      tahmin = 'Seçili katmanlardaki bütün kelimelere başladın. ✔';
    } else if (yeniHiz <= 0) {
      tahmin = 'Seçili katmanlarda ' + sayi(kalan) + ' kelimeye henüz başlamadın. Son iki haftada yeni kart ' +
        'açmadığın için bitiş tahmini hesaplanamıyor.';
    } else {
      var gunSayisi = Math.ceil(kalan / yeniHiz);
      var bitis = tarihUzun(bugun + gunSayisi);
      tahmin = 'Seçili katmanlarda ' + sayi(kalan) + ' kelime kaldı. Son iki haftanın hızıyla (günde ' +
        sayi(yeniHiz, 1) + ' yeni kart) yaklaşık ' + sayi(gunSayisi) + ' gün, yani ' + bitis + ' civarı.';
    }
    $('tahminMetin').textContent = tahmin;
    $('birikimOzet').textContent = sayi(calisilan) + ' / ' + sayi(toplamKelime) + ' kelimeye başlandı · ' +
      sayi(ozet.ogrenilen) + ' kelime son kutuda';

    // Öğrenme hızı, çalışma hızından ayrıdır: tekrar etmek yeni kart açmaz.
    var yeni7 = pencere(bugun, 7, 'y'), mezun7 = pencere(bugun, 7, 'm');
    $('ogrenmeHizi').textContent = 'Son 7 günde ' + sayi(yeni7) + ' yeni karta başladın (günde ' +
      sayi(yeni7 / 7, 1) + '), ' + sayi(mezun7) + ' kart son kutuya çıktı.';
  }

  /* ---------- çalıştır ---------- */

  if (hicVeriYok) {
    $('bosDurum').hidden = false;
    $('icerikBloklari').hidden = true;
    return;
  }

  var seciliAralik = 30;
  ozetCiz();
  gunlukCiz(seciliAralik);
  isiCiz();
  haftalikCiz();
  birikimCiz();

  $('aralik').addEventListener('click', function (e) {
    var dugme = e.target.closest('button[data-gun]');
    if (!dugme) return;
    seciliAralik = Number(dugme.getAttribute('data-gun'));
    Array.prototype.forEach.call(this.querySelectorAll('button[data-gun]'), function (b) {
      var acik = Number(b.getAttribute('data-gun')) === seciliAralik;
      b.classList.toggle('acik', acik);
      b.setAttribute('aria-pressed', acik ? 'true' : 'false');
    });
    gunlukCiz(seciliAralik);
  });
})();
