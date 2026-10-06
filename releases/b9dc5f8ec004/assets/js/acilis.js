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

  /* Sayıdan sonra gelen 3. kişi iyelik eki ("1.482'si", "911'i", "100'ü"):
     son okunan sayı sözcüğüne göre ünlü uyumu. */
  function iyelik(n) {
    n = Math.abs(Math.floor(Number(n) || 0));
    if (n === 0) return '’ı';
    var son = n % 10, onlar = Math.floor(n / 10) % 10;
    if (son) return ['', '’i', '’si', '’ü', '’ü', '’i', '’sı', '’si', '’i', '’u'][son];
    if (onlar) return ['', '’u', '’si', '’u', '’ı', '’si', '’ı', '’i', '’i', '’ı'][onlar];
    if (n % 1000) return '’ü';
    if (n % 1000000) return '’i';
    return '’u';
  }

  Y.Acilis = { seciliKatmanlar: seciliKatmanlar, katmanOzeti: katmanOzeti, bugunOzeti: bugunOzeti, seri: seri, ornekler: ornekler, selam: selam, iyelik: iyelik };

  /* ---------- çizim ---------- */
  var kapsayici = typeof document !== 'undefined' && document.getElementById('acilisKatmanlar');
  if (!kapsayici) return;
  var $ = function (id) { return document.getElementById(id); };
  var kacar = Y.kacar || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var hareketli = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  /* Halka: r=20 → çevre 125.66; dolu yay --dolu ile CSS geçişiyle gelir. */
  function halkaSvg(oran, etiket) {
    var yuzde = Math.round(oran * 100);
    return '<svg class="halka" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<circle class="halka-arka" cx="24" cy="24" r="20"></circle>' +
      '<circle class="halka-dolu" cx="24" cy="24" r="20" style="--dolu:' + (125.66 * (1 - oran)).toFixed(2) + '"></circle>' +
      '<text class="halka-yuzde" x="24" y="' + (etiket ? 22 : 24) + '" text-anchor="middle" dominant-baseline="central">%' + yuzde + '</text>' +
      (etiket ? '<text class="halka-etiket" x="24" y="31" text-anchor="middle" dominant-baseline="central">' + etiket + '</text>' : '') +
      '</svg>';
  }

  function sayac(n) { return '<b data-sayac="' + n + '">' + sayi(n) + '</b>'; }

  function kartHtml(o, i) {
    var toplam = o.toplam || 1;
    var mezunOran = o.mezun / toplam, ogrenOran = o.ogreniliyor / toplam;
    var ornek = ornekler(o.k, 4);
    var daha = Math.max(0, o.yeni - ornek.length);
    var aria = o.ad + ' katmanı: ' + sayi(o.toplam) + ' kelime, ' + sayi(o.mezun) + ' öğrenildi, ' +
      sayi(o.ogreniliyor) + ' çalışılıyor, ' + sayi(o.yeni) + ' yeni' + (o.tekrar ? ', bugün ' + sayi(o.tekrar) + ' tekrar' : '');
    return '<article class="kcard card canli' + (o.secili ? ' secili' : '') + (o.k === 7 ? ' genis' : '') + '" style="--i:' + i + '" data-k="' + o.k + '" aria-labelledby="kcard-' + o.k + '">' +
      '<div class="kcard-bas">' +
        '<span class="kno" aria-hidden="true">' + o.k + '</span>' +
        '<div class="kad"><h3 id="kcard-' + o.k + '">' + kacar(o.ad) + (o.secili ? ' <span class="badge accent">destende</span>' : '') + '</h3>' +
          '<span class="ktoplam">' + sayi(o.toplam) + ' kelime · ' + kacar(o.puan) + '</span></div>' +
        (o.tekrar ? '<span class="pill"><b data-sayac="' + o.tekrar + '">' + sayi(o.tekrar) + '</b> bugün</span>' : '<span class="pill bos">bugün yok</span>') +
      '</div>' +
      '<div class="kcard-govde">' + halkaSvg(mezunOran) +
        '<div class="kveri">' +
          '<div class="kcubuk" role="img" aria-label="' + kacar(aria) + '">' +
            '<i class="kc-mezun" style="--w:' + (mezunOran * 100).toFixed(2) + '%"></i>' +
            '<i class="kc-ogren" style="--w:' + (ogrenOran * 100).toFixed(2) + '%"></i></div>' +
          '<ul class="krakam" aria-hidden="true">' +
            '<li class="r-mezun">' + sayac(o.mezun) + ' öğrenildi</li>' +
            '<li class="r-ogren">' + sayac(o.ogreniliyor) + ' çalışılıyor</li>' +
            '<li class="r-yeni">' + sayac(o.yeni) + ' yeni</li>' +
            (o.tekrar ? '<li class="r-vade">' + sayac(o.tekrar) + ' bugün tekrar</li>' : '') +
          '</ul>' +
        '</div>' +
      '</div>' +
      (ornek.length ? '<p class="kornek"><span class="kornek-etiket">Sırada:</span> ' +
        ornek.map(function (w) { return '<span class="cip" lang="en">' + kacar(w) + '</span>'; }).join('') +
        (daha ? '<span class="cip daha">+' + sayi(daha) + '</span>' : '') + '</p>' : '') +
      '<div class="kcard-eylem">' +
        '<a class="klink" href="kelimeler.html?katman=' + o.k + '&amp;calis=1">Katmanı çalış ' + OK + '</a>' +
        '<a class="klink ikincil" href="kelimeler.html?katman=' + o.k + '">Listeyi aç</a></div>' +
    '</article>';
  }

  function izHtml(ozet) {
    return '<ol class="iz" aria-label="Katman durumu">' + ozet.map(function (o, i) {
      var durum = o.mezun === o.toplam ? 'tamam' : (o.mezun + o.ogreniliyor > 0 ? 'basladi' : 'yeni');
      var metin = o.k + ' · ' + o.ad + ': ' + (durum === 'tamam' ? 'tamamlandı' : durum === 'basladi' ? sayi(o.mezun) + ' öğrenildi' : 'henüz başlanmadı') + (o.secili ? ', destende' : '');
      return '<li class="' + durum + (o.secili ? ' aktif' : '') + '" style="--i:' + i + '" title="' + kacar(metin) + '"><span class="visually-hidden">' + kacar(metin) + '</span><i aria-hidden="true">' + o.k + '</i></li>';
    }).join('') + '</ol>';
  }

  function sayaclariCanlandir(kok) {
    var hedefler = kok.querySelectorAll('[data-sayac]');
    if (!hareketli || !window.requestAnimationFrame) return;
    var sure = 900, baslangic = null;
    Array.prototype.forEach.call(hedefler, function (el) { el.style.minWidth = el.textContent.length + 'ch'; el.textContent = '0'; });
    function adim(t) {
      if (baslangic === null) baslangic = t;
      var p = Math.min(1, (t - baslangic) / sure), e = 1 - Math.pow(1 - p, 3);
      Array.prototype.forEach.call(hedefler, function (el) {
        el.textContent = sayi(Math.round(Number(el.getAttribute('data-sayac')) * e));
      });
      if (p < 1) window.requestAnimationFrame(adim);
      else Array.prototype.forEach.call(hedefler, function (el) { el.style.minWidth = ''; });
    }
    window.requestAnimationFrame(adim);
  }

  function tarihMetni() {
    var simdi = new Date();
    try {
      return simdi.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) + ', ' + simdi.toLocaleDateString('tr-TR', { weekday: 'long' });
    } catch (e) { return ''; }
  }

  function ciz() {
    var ozet = katmanOzeti(), bugun = bugunOzeti();
    var toplamMezun = 0, toplamOgren = 0, toplamKelime = 0;
    ozet.forEach(function (o) { toplamMezun += o.mezun; toplamOgren += o.ogreniliyor; toplamKelime += o.toplam; });
    var toplamYeni = toplamKelime - toplamMezun - toplamOgren;
    var basladi = toplamMezun + toplamOgren > 0;
    var gun = seri();

    var statik = $('acilisStatik');
    if (statik) statik.hidden = true;
    kapsayici.innerHTML = ozet.map(kartHtml).join('');

    var baslik = $('acilisBaslik');
    if (baslik) {
      baslik.innerHTML = !basladi ? 'Kelime haritana hoş geldin' :
        (bugun.tekrar > 0 ? 'Bugün ' + sayac(bugun.tekrar) + ' tekrar bekliyor' : 'Bugün tekrar beklemiyor');
    }
    var selamEl = $('acilisSelam');
    if (selamEl) selamEl.textContent = selam() + ' · ' + tarihMetni();
    var ozetEl = $('acilisOzet');
    if (ozetEl) {
      ozetEl.innerHTML = !basladi
        ? 'Yedi katmanda ' + sayac(toplamKelime) + ' kelime seni bekliyor. İlk deste Çekirdek katmandan ' +
          sayi(bugun.bugun) + ' yeni kelimeyle başlar; her kartta bir kelime ve bir örnek cümle.'
        : sayac(toplamKelime) + ' kelimenin ' + sayac(toplamMezun) + iyelik(toplamMezun) + ' öğrenildi, ' +
          sayac(toplamOgren) + iyelik(toplamOgren) + ' çalışılıyor; ' + sayac(toplamYeni) + ' kelimeye henüz bakmadın.' +
          (bugun.acilacakYeni > 0 ? ' Bugün ' + sayi(bugun.acilacakYeni) + ' yeni kart açılacak.' : '');
    }
    var deste = $('acilisDeste');
    if (deste) deste.textContent = bugun.bugun > 0 ? (basladi ? 'Bugünün destesini çalış (' + sayi(bugun.bugun) + ' kart)' : 'İlk desteyi çalış (' + sayi(bugun.bugun) + ' kart)') : 'Kelimelere göz at';

    var genel = $('acilisGenel');
    if (genel) {
      var oran = toplamKelime ? toplamMezun / toplamKelime : 0;
      genel.innerHTML =
        '<div class="genel-bas"><h2 id="genelBaslik">Genel ilerleme</h2>' +
          (bugun.tekrar > 0 ? '<span class="pill">' + sayac(bugun.tekrar) + ' bugün</span>' : '<span class="pill bos">bugün tekrar yok</span>') + '</div>' +
        '<div class="genel-govde">' +
          '<div class="genel-halka" role="img" aria-label="Tüm kelimelerin yüzde ' + Math.round(oran * 100) + '’i öğrenildi">' + halkaSvg(oran, 'öğrenildi') + '</div>' +
          '<ul class="genel-liste">' +
            '<li class="r-mezun">' + sayac(toplamMezun) + '<span>öğrenildi · 5. kutu</span></li>' +
            '<li class="r-ogren">' + sayac(toplamOgren) + '<span>çalışılıyor · 1–4. kutu</span></li>' +
            '<li class="r-yeni">' + sayac(toplamYeni) + '<span>yeni · hiç çalışılmadı</span></li>' +
          '</ul>' +
          '<div class="kcubuk genel-cubuk" aria-hidden="true"><i class="kc-mezun" style="--w:' + (oran * 100).toFixed(2) + '%"></i><i class="kc-ogren" style="--w:' + (toplamKelime ? toplamOgren / toplamKelime * 100 : 0).toFixed(2) + '%"></i></div>' +
          izHtml(ozet) +
          '<p class="genel-alt"><span>' + sayi(toplamKelime) + ' kelime · 7 katman</span>' +
            '<span>' + (gun > 0 ? sayac(gun) + ' gün üst üste' : 'Öğrenildi = 5. kutuya ulaşan kart') + '</span></p>' +
        '</div>';
    }

    // Halka ve çubuklar CSS geçişiyle dolar: önce boş çizilir, bir kare sonra hedef değer.
    var kokler = [kapsayici, genel].filter(Boolean);
    kokler.forEach(function (k) { k.classList.remove('dolu'); });
    if (hareketli && window.requestAnimationFrame) {
      window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { kokler.forEach(function (k) { k.classList.add('dolu'); }); }); });
    } else kokler.forEach(function (k) { k.classList.add('dolu'); });
    sayaclariCanlandir(document.getElementById('icerik') || document.body);
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
