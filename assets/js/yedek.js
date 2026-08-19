/* ============================================================
   Yedekleme — ilerlemeyi dosyaya indir / dosyadan geri yükle

   İlerleme yalnız tarayıcının kendi deposunda (localStorage) durduğu
   için başka bir bilgisayara kendiliğinden geçmez. Bu modül iki yol
   açar: "Yedeği indir" bütün yds-* anahtarlarını tek bir .json
   dosyasına koyar; "Yedekten yükle" o dosyayı okuyup mevcut ilerlemeyle
   BİRLEŞTİRİR — silmez. İki bilgisayarda ayrı ayrı çalışılmışsa her
   kelime için en son çalışılan kayıt geçerli olur.
   ============================================================ */

(function () {
  'use strict';

  var Depo = window.YDS.Depo;
  var ARALIK = window.YDS.Ilerleme.ARALIK;

  var $ = function (id) { return document.getElementById(id); };
  var elDurum = $('yedekDurum');
  if (!$('yedekIndir')) return;

  /* Yedeğe giren anahtarlar. Tema bilerek dışarıda: cihaz tercihi,
     ilerleme değil. */
  var ANAHTARLAR = [
    'yds-leitner', 'yds-yanlis', 'yds-kategori', 'yds-gecmis',
    'yds-konular', 'yds-rekor', 'yds-yeni-sayac',
    'yds-gunluk-yeni', 'yds-katmanlar', 'yds-eksen'
  ];

  /* Yalnız yerelde YOKSA yedekten alınan tercihler; sayaç ve kayıtlar
     ise aşağıdaki kurallarla birleştirilir. */
  var TERCIHLER = { 'yds-gunluk-yeni': 1, 'yds-katmanlar': 1, 'yds-eksen': 1 };

  function bilgi(metin, hataMi) {
    if (!elDurum) return;
    elDurum.textContent = metin;
    elDurum.style.color = hataMi ? 'var(--err)' : '';
  }

  /* ---------- indir ---------- */

  function tarihEtiketi() {
    var d = new Date();
    var iki = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + iki(d.getMonth() + 1) + '-' + iki(d.getDate());
  }

  function indir() {
    var veriler = {};
    ANAHTARLAR.forEach(function (a) {
      var v = Depo.oku(a, undefined);
      if (v !== undefined) veriler[a] = v;
    });
    var kayitSayisi = Object.keys(veriler['yds-leitner'] || {}).length;

    var paket = { tur: 'yds-yedek', surum: 1, tarih: new Date().toISOString(), veriler: veriler };
    var kutu = new Blob([JSON.stringify(paket)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(kutu);
    a.download = 'yds-yedek-' + tarihEtiketi() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);

    bilgi('Yedek indirildi: ' + kayitSayisi + ' kelime/öbek kaydı. Dosyayı diğer ' +
      'bilgisayara taşıyıp orada "Yedekten yükle" ile aç.');
  }

  /* ---------- birleştirme kuralları ---------- */

  // Kayıttan "en son hangi gün çalışıldı"yı çıkarır: tekrar günü - aralık.
  function calisilanGun(r) { return (r.g || 0) - (ARALIK[r.k] || 0); }

  function leitnerBirlestir(yerel, gelen) {
    Object.keys(gelen).forEach(function (ad) {
      var g = gelen[ad];
      if (!g || typeof g.k !== 'number' || typeof g.g !== 'number') return;
      var m = yerel[ad];
      if (!m) { yerel[ad] = { k: g.k, g: g.g }; return; }
      var gunG = calisilanGun(g), gunM = calisilanGun(m);
      if (gunG > gunM || (gunG === gunM && g.k > m.k)) yerel[ad] = { k: g.k, g: g.g };
    });
    return yerel;
  }

  function yanlisBirlestir(yerel, gelen) {
    var harita = {};
    yerel.forEach(function (x) { if (x && x.a) harita[x.a] = x; });
    gelen.forEach(function (x) {
      if (!x || !x.a) return;
      var m = harita[x.a];
      if (!m) { harita[x.a] = x; return; }
      m.n = Math.max(m.n || 1, x.n || 1);
      m.t = Math.max(m.t || 0, x.t || 0);
    });
    return Object.keys(harita).map(function (a) { return harita[a]; });
  }

  function kategoriBirlestir(yerel, gelen) {
    // Sayaçları toplarsak aynı cevaplar iki kez sayılabilir; kategori
    // başına daha çok soru görmüş taraf geçerli olur.
    Object.keys(gelen).forEach(function (kat) {
      var g = gelen[kat], m = yerel[kat];
      if (!g || typeof g.d !== 'number') return;
      if (!m || (g.d + g.y) > (m.d + m.y)) yerel[kat] = g;
    });
    return yerel;
  }

  function gecmisBirlestir(yerel, gelen) {
    var gorulen = {};
    var hepsi = [];
    yerel.concat(gelen).forEach(function (x) {
      if (!x || !x.t || gorulen[x.t]) return;
      gorulen[x.t] = true;
      hepsi.push(x);
    });
    hepsi.sort(function (a, b) { return a.t - b.t; });
    return hepsi.slice(-50);
  }

  function konuBirlestir(yerel, gelen) {
    var puan = function (r) {
      return (r.d || 0) * 10 + (r.t != null ? 1 : 0) + (r.g != null ? 1 : 0) + (r.n ? 1 : 0);
    };
    Object.keys(gelen).forEach(function (kod) {
      var g = gelen[kod], m = yerel[kod];
      if (!g || typeof g !== 'object') return;
      if (!m || puan(g) > puan(m)) yerel[kod] = g;
    });
    return yerel;
  }

  function rekorBirlestir(yerel, gelen) {
    if (!gelen || typeof gelen.yuzde !== 'number') return yerel;
    if (!yerel || gelen.yuzde > yerel.yuzde ||
        (gelen.yuzde === yerel.yuzde && (gelen.dogru || 0) > (yerel.dogru || 0))) return gelen;
    return yerel;
  }

  function sayacBirlestir(yerel, gelen) {
    if (!gelen || typeof gelen.g !== 'number') return yerel;
    if (!yerel || gelen.g > yerel.g) return gelen;
    if (gelen.g === yerel.g) {
      return { g: yerel.g, n: Math.max(yerel.n || 0, gelen.n || 0),
               ek: Math.max(yerel.ek || 0, gelen.ek || 0) };
    }
    return yerel;
  }

  /* ---------- yükle ---------- */

  function paketiUygula(paket) {
    if (!paket || paket.tur !== 'yds-yedek' || !paket.veriler ||
        typeof paket.veriler !== 'object') {
      bilgi('Bu dosya bir YDS yedeği değil. "Yedeği indir" ile alınmış .json dosyasını seç.', true);
      return;
    }
    var v = paket.veriler;
    var onceki = Object.keys(Depo.oku('yds-leitner', {})).length;

    if (v['yds-leitner'] && typeof v['yds-leitner'] === 'object') {
      Depo.yaz('yds-leitner', leitnerBirlestir(Depo.oku('yds-leitner', {}), v['yds-leitner']));
    }
    if (Array.isArray(v['yds-yanlis'])) {
      Depo.yaz('yds-yanlis', yanlisBirlestir(Depo.oku('yds-yanlis', []), v['yds-yanlis']));
    }
    if (v['yds-kategori'] && typeof v['yds-kategori'] === 'object') {
      Depo.yaz('yds-kategori', kategoriBirlestir(Depo.oku('yds-kategori', {}), v['yds-kategori']));
    }
    if (Array.isArray(v['yds-gecmis'])) {
      Depo.yaz('yds-gecmis', gecmisBirlestir(Depo.oku('yds-gecmis', []), v['yds-gecmis']));
    }
    if (v['yds-konular'] && typeof v['yds-konular'] === 'object') {
      Depo.yaz('yds-konular', konuBirlestir(Depo.oku('yds-konular', {}), v['yds-konular']));
    }
    var rekor = rekorBirlestir(Depo.oku('yds-rekor', null), v['yds-rekor']);
    if (rekor) Depo.yaz('yds-rekor', rekor);
    var sayac = sayacBirlestir(Depo.oku('yds-yeni-sayac', null), v['yds-yeni-sayac']);
    if (sayac) Depo.yaz('yds-yeni-sayac', sayac);

    Object.keys(TERCIHLER).forEach(function (a) {
      if (v[a] !== undefined && Depo.oku(a, undefined) === undefined) Depo.yaz(a, v[a]);
    });

    var sonra = Object.keys(Depo.oku('yds-leitner', {})).length;
    bilgi('Yedek birleştirildi: ' + sonra + ' kelime/öbek kaydı (' +
      (sonra - onceki) + ' yeni eklendi). Sayfa yenileniyor…');
    setTimeout(function () { location.reload(); }, 1400);
  }

  function dosyaSecildi(e) {
    var dosya = e.target.files && e.target.files[0];
    e.target.value = '';                       // aynı dosya tekrar seçilebilsin
    if (!dosya) return;
    var okuyucu = new FileReader();
    okuyucu.onload = function () {
      var paket = null;
      try { paket = JSON.parse(okuyucu.result); }
      catch (err) {
        bilgi('Dosya okunamadı: geçerli bir yedek dosyası değil.', true);
        return;
      }
      paketiUygula(paket);
    };
    okuyucu.onerror = function () { bilgi('Dosya okunamadı.', true); };
    okuyucu.readAsText(dosya, 'utf-8');
  }

  /* ---------- bağla ---------- */

  $('yedekIndir').addEventListener('click', indir);
  $('yedekYukle').addEventListener('click', function () { $('yedekDosya').click(); });
  $('yedekDosya').addEventListener('change', dosyaSecildi);
})();
