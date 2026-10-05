/* Açılış sayfası: yedi kelime katmanında ne var, ne kaldı; bugünün destesi.
   Veri: data/katman-uyelik.js (katman → kelime başlıkları, dizin sırasıyla) ve
   YDS.Ilerleme.leitnerOzet. Kelime dizini (716 KB) bu sayfada yüklenmez.
   Hesap işlevleri YDS.Acilis altında dışa açılır (birim testi); çizim yalnız
   #acilisKatmanlar varsa çalışır. */
(function () {
  'use strict';
  var Y = window.YDS = window.YDS || {};
  var Il = Y.Ilerleme, Veri = Y.Veri, Depo = Y.Depo;
  var UYELIK = window.KATMAN_UYELIK || {};
  var KATMANLAR = (Veri && Veri.KATMANLAR) || [1, 2, 3, 4, 5, 6, 7];
  var KATMAN_ANAHTAR = 'yds-katmanlar';

  function sayi(n) { return Number(n || 0).toLocaleString('tr-TR'); }

  /* kelimeler.js ile aynı okuma: varsayılan [2]; 'yds-katman7' bayrağı yoksa eski 6 seçimi 7 sayılır. */
  function seciliKatmanlar() {
    var s = Depo ? Depo.oku(KATMAN_ANAHTAR, [2]) : [2];
    if (!Array.isArray(s) || !s.length) s = [2];
    s = s.map(Number).filter(function (k, i, a) { return k >= 1 && k <= 7 && a.indexOf(k) === i; });
    if (Depo && !Depo.oku('yds-katman7', false) && s.indexOf(6) !== -1) {
      s = s.filter(function (k) { return k !== 6; }).concat([7]);
    }
    return s.length ? s : [2];
  }

  function liste(k) {
    return (UYELIK[k] || []).map(function (e) { return { en: e }; });
  }

  /* Katman başına: toplam, yeni (kayıt yok), öğreniliyor (1-4. kutu), zayıf (1-2),
     mezun (5. kutu), bugün vadesi gelen tekrar. Öbek ve cümle kayıtları listede
     olmadığı için yapısal olarak dışarıda kalır. */
  function katmanOzeti() {
    var secili = seciliKatmanlar();
    return KATMANLAR.map(function (k) {
      var l = liste(k), o = Il ? Il.leitnerOzet(l, 'kelime') : null;
      return {
        k: k,
        ad: Veri ? Veri.KATMAN_ADI[k] : String(k),
        aciklama: Veri ? Veri.KATMAN_ACIKLAMA[k] : '',
        puan: Veri && Veri.katmanPuanMetni ? Veri.katmanPuanMetni(k) : '',
        toplam: l.length,
        yeni: o ? o.k0 : l.length,
        ogreniliyor: o ? o.k1 + o.k2 + o.k3 + o.k4 : 0,
        zayif: o ? o.k1 + o.k2 : 0,
        mezun: o ? o.k5 : 0,
        tekrar: o ? o.tekrar : 0,
        secili: secili.indexOf(k) !== -1
      };
    });
  }

  /* Bugünün destesi: kelimeler.html ile aynı tanım — yalnız seçili katmanların
     birleşik listesi, tek çağrı (kota ve tavan geneldir, katman başına toplanmaz). */
  function bugunOzeti() {
    var havuz = [];
    seciliKatmanlar().forEach(function (k) { havuz = havuz.concat(liste(k)); });
    return Il ? Il.leitnerOzet(havuz, 'kelime') : { bugun: 0, tekrar: 0, acilacakYeni: 0, ogrenilen: 0, calisilan: 0 };
  }

  /* Art arda çalışılan gün sayısı; bugün henüz çalışılmadıysa dünden geriye sayılır. */
  function seri() {
    if (!Il) return 0;
    var kayitlar = Il.gunlukKayitlar(), g = Il.bugun(), n = 0;
    if (!(kayitlar[g] && kayitlar[g].t > 0)) g -= 1;
    while (kayitlar[g] && kayitlar[g].t > 0) { n++; g--; }
    return n;
  }

  /* Katmanın sıradaki kelimeleri: dizin (puan) sırasında henüz çalışılmamış ilk n;
     hepsi çalışıldıysa vadesi gelenler, o da yoksa ilk n. */
  function ornekler(k, n) {
    var l = UYELIK[k] || [], out = [], i;
    for (i = 0; i < l.length && out.length < n; i++) if (!Il || Il.yeniMi(l[i], 'kelime')) out.push(l[i]);
    for (i = 0; Il && i < l.length && out.length < n; i++) {
      if (Il.vadesiGeldiMi(l[i], 'kelime') && out.indexOf(l[i]) === -1) out.push(l[i]);
    }
    for (i = 0; i < l.length && out.length < n; i++) if (out.indexOf(l[i]) === -1) out.push(l[i]);
    return out;
  }

  function selam() {
    var saat = new Date().getHours();
    if (saat < 6) return 'İyi geceler';
    if (saat < 12) return 'Günaydın';
    if (saat < 18) return 'İyi günler';
    return 'İyi akşamlar';
  }

  Y.Acilis = { seciliKatmanlar: seciliKatmanlar, katmanOzeti: katmanOzeti, bugunOzeti: bugunOzeti, seri: seri, ornekler: ornekler, selam: selam };

  /* ---------- çizim ---------- */
  var kapsayici = typeof document !== 'undefined' && document.getElementById('acilisKatmanlar');
  if (!kapsayici) return;
  var $ = function (id) { return document.getElementById(id); };
  var kacar = Y.kacar || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var hareketli = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function halkaSvg(oran) {
    // r=20 → çevre 125.66; dolu kısım --dolu ile CSS geçişiyle gelir
    return '<svg class="halka" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<circle class="halka-arka" cx="24" cy="24" r="20"></circle>' +
      '<circle class="halka-dolu" cx="24" cy="24" r="20" style="--dolu:' + (125.66 * (1 - oran)).toFixed(2) + '"></circle>' +
      '<text class="halka-yuzde" x="24" y="24" text-anchor="middle" dominant-baseline="central">' + Math.round(oran * 100) + '%</text></svg>';
  }

  function kartHtml(o, i) {
    var toplam = o.toplam || 1;
    var mezunOran = o.mezun / toplam, ogrenOran = o.ogreniliyor / toplam;
    var kalan = o.toplam - o.mezun;
    var ornek = ornekler(o.k, 4);
    var durum = o.mezun === o.toplam ? 'Katman tamam' :
      (o.mezun + o.ogreniliyor === 0 ? 'Henüz başlanmadı' : sayi(kalan) + ' kelime kaldı');
    var aria = o.ad + ' katmanı: ' + sayi(o.toplam) + ' kelime, ' + sayi(o.mezun) + ' öğrenildi, ' +
      sayi(o.ogreniliyor) + ' çalışılıyor, ' + sayi(o.yeni) + ' yeni' + (o.tekrar ? ', bugün ' + sayi(o.tekrar) + ' tekrar' : '');
    return '<article class="kcard' + (o.secili ? ' secili' : '') + '" style="--i:' + i + '" data-k="' + o.k + '">' +
      '<div class="kcard-ust">' + halkaSvg(mezunOran) +
        '<div class="kcard-baslik"><h3>' + o.k + ' · ' + kacar(o.ad) + (o.secili ? ' <span class="badge accent">destende</span>' : '') + '</h3>' +
        '<p class="small muted">' + kacar(o.puan) + ' · ' + sayi(o.toplam) + ' kelime</p></div></div>' +
      '<div class="kcubuk" role="img" aria-label="' + kacar(aria) + '">' +
        '<i class="kc-mezun" style="--w:' + (mezunOran * 100).toFixed(2) + '%"></i>' +
        '<i class="kc-ogren" style="--w:' + (ogrenOran * 100).toFixed(2) + '%"></i></div>' +
      '<ul class="krakam" aria-hidden="true">' +
        '<li class="r-mezun"><b data-sayac="' + o.mezun + '">' + sayi(o.mezun) + '</b> öğrenildi</li>' +
        '<li class="r-ogren"><b data-sayac="' + o.ogreniliyor + '">' + sayi(o.ogreniliyor) + '</b> çalışılıyor</li>' +
        '<li class="r-yeni"><b data-sayac="' + o.yeni + '">' + sayi(o.yeni) + '</b> yeni</li>' +
        (o.tekrar ? '<li class="r-vade"><b data-sayac="' + o.tekrar + '">' + sayi(o.tekrar) + '</b> bugün tekrar</li>' : '') +
      '</ul>' +
      '<p class="kdurum">' + kacar(durum) + '</p>' +
      (ornek.length ? '<p class="kornek" lang="en"><span class="kornek-etiket" lang="tr">Sırada:</span> ' + ornek.map(kacar).join(' · ') + '</p>' : '') +
      '<div class="kcard-eylem">' +
        '<a class="btn sm" href="kelimeler.html?katman=' + o.k + '&amp;calis=1">Bu katmanı çalış</a>' +
        '<a class="btn ghost sm" href="kelimeler.html?katman=' + o.k + '">Listeyi aç</a></div>' +
    '</article>';
  }

  function sayaclariCanlandir(kok) {
    var hedefler = kok.querySelectorAll('[data-sayac]');
    if (!hareketli || !window.requestAnimationFrame) return;
    var sure = 900, baslangic = null;
    Array.prototype.forEach.call(hedefler, function (el) { el.textContent = '0'; });
    function adim(t) {
      if (baslangic === null) baslangic = t;
      var p = Math.min(1, (t - baslangic) / sure), e = 1 - Math.pow(1 - p, 3);
      Array.prototype.forEach.call(hedefler, function (el) {
        el.textContent = sayi(Math.round(Number(el.getAttribute('data-sayac')) * e));
      });
      if (p < 1) window.requestAnimationFrame(adim);
    }
    window.requestAnimationFrame(adim);
  }

  function ciz() {
    var ozet = katmanOzeti(), bugun = bugunOzeti();
    var statik = $('acilisStatik');
    if (statik) statik.hidden = true;
    kapsayici.innerHTML = ozet.map(kartHtml).join('');
    // Halka ve çubuklar CSS geçişiyle dolar: önce boş çizilir, bir kare sonra hedef değer.
    kapsayici.classList.remove('dolu');
    if (hareketli && window.requestAnimationFrame) {
      window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { kapsayici.classList.add('dolu'); }); });
    } else kapsayici.classList.add('dolu');
    sayaclariCanlandir(kapsayici);

    var toplamMezun = 0, toplamKelime = 0, toplamTekrar = 0, basladi = false;
    ozet.forEach(function (o) { toplamMezun += o.mezun; toplamKelime += o.toplam; toplamTekrar += o.tekrar; if (o.mezun + o.ogreniliyor) basladi = true; });
    var deste = $('acilisDeste');
    if (deste) deste.textContent = bugun.bugun > 0 ? 'Bugünün destesini çalış (' + sayi(bugun.bugun) + ' kart)' : 'Kelimelere göz at';
    var selamEl = $('acilisSelam');
    if (selamEl) selamEl.textContent = selam() + '.';
    var ozetEl = $('acilisOzet');
    if (ozetEl) {
      ozetEl.textContent = !basladi
        ? 'Henüz kelime çalışmadın. Çekirdek katmandan başlamak en verimlisi: destende ' + sayi(bugun.bugun) + ' kart hazır.'
        : (bugun.tekrar > 0 ? 'Bugün ' + sayi(bugun.tekrar) + ' tekrar bekliyor' : 'Bugün tekrar beklemiyor') +
          (bugun.acilacakYeni > 0 ? ', ' + sayi(bugun.acilacakYeni) + ' yeni kart açılacak.' : '.') +
          ' Toplam ' + sayi(toplamMezun) + ' kelime öğrenildi.';
    }
    var sayac = $('acilisSayaclar');
    if (sayac) {
      var gun = seri();
      sayac.innerHTML =
        '<div class="stat"><div class="n" data-sayac="' + bugun.bugun + '">' + sayi(bugun.bugun) + '</div><div class="l">bugünün destesi</div></div>' +
        '<div class="stat"><div class="n" data-sayac="' + toplamMezun + '">' + sayi(toplamMezun) + '</div><div class="l">öğrenilen kelime</div></div>' +
        '<div class="stat"><div class="n" data-sayac="' + (toplamKelime - toplamMezun) + '">' + sayi(toplamKelime - toplamMezun) + '</div><div class="l">kalan kelime</div></div>' +
        '<div class="stat"><div class="n" data-sayac="' + gun + '">' + sayi(gun) + '</div><div class="l">gün üst üste</div></div>';
      sayaclariCanlandir(sayac);
    }
    var kelimeler = $('acilisKelimeler');
    if (kelimeler && !kelimeler.childElementCount) {
      // Arka planda süzülen soluk kelimeler: her katmandan iki sıradaki kelime.
      var parcalar = [];
      ozet.forEach(function (o) { ornekler(o.k, 2).forEach(function (w) { parcalar.push(w); }); });
      kelimeler.innerHTML = parcalar.map(function (w, i) {
        return '<span style="--i:' + i + ';--x:' + ((i * 37) % 100) + '%;--d:' + (14 + (i % 5) * 3) + 's">' + kacar(w) + '</span>';
      }).join('');
    }
  }

  ciz();
  var zamanlayici = null;
  window.addEventListener('yds-depo-degisti', function (e) {
    var a = e && e.detail && e.detail.anahtarlar;
    if (a && a.indexOf('yds-leitner') === -1 && a.indexOf('yds-katmanlar') === -1 && a.indexOf('yds-gunluk-kayit') === -1) return;
    window.clearTimeout(zamanlayici);
    zamanlayici = window.setTimeout(ciz, 80);
  });
})();
