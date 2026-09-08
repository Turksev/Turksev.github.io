/* ============================================================
   Öbekler sayfası — kelimelerden ayrı bir Leitner destesi

   Öbek verisi (630 KB) sayfa açılınca indirilir; kelime katmanları
   gibi seçmeli değil, çünkü öbek sayısı tek dosyada taşınabilir
   büyüklükte.

   Leitner tablosu kelimelerle ortaktır. Aynı başlığa sahip bir kelime
   bulunduğunda iç kimlikler ayrılır; "Sıfırla" düğmesi yalnız öbek
   kayıtlarını siler.
   ============================================================ */

(function () {
  'use strict';

  var sadelestir = window.YDS.sadelestir;
  var kacar = window.YDS.kacar;
  var yildiz = window.YDS.yildiz;
  var karistir = window.YDS.karistir;
  var Il = window.YDS.Ilerleme;
  var Veri = window.YDS.Veri;
  var ILERLEME_TURU = 'obek';

  var SAYFA_BOYU = 20;

  var TUM = [];
  var suzulmus = [];
  var gosterilen = SAYFA_BOYU;
  var kartIndex = 0;
  var kartAcik = false;
  var kartModu = false;
  var desteModu = false;
  var ipucuAcik = false;

  var $ = function (id) { return document.getElementById(id); };
  var elAra = $('ara'), elTur = $('tur'), elSinav = $('sinav'), elDurum = $('durum');
  var seciliKutu = null;          // kutu süzgeci: null | 0..5
  var elListe = $('liste'), elSayac = $('sayac'), elBos = $('bos');
  var elKartAlan = $('kartAlan'), elKart = $('kart');

  var KUTU_ADI = ['hiç çalışılmadı', '1. kutu', '2. kutu', '3. kutu', '4. kutu', '5. kutu'];

  function adlar() { return TUM.map(function (o) { return o.f; }); }
  function leitnerListesi() { return TUM.map(function (o) { return { en: o.f }; }); }

  /* ---------- deste özeti ---------- */

  function desteyiCiz() {
    var o = Il.leitnerOzet(leitnerListesi(), ILERLEME_TURU);

    $('desteBilgi').textContent = o.calisilan + '/' + TUM.length + ' öbeğe başlandı · ' +
      o.ogrenilen + ' öğrenildi';
    $('desteBar').style.width = (TUM.length ? o.ogrenilen / TUM.length * 100 : 0) + '%';
    var ilerleme = $('desteIlerleme');
    ilerleme.setAttribute('aria-valuemax', String(Math.max(1, TUM.length)));
    ilerleme.setAttribute('aria-valuenow', String(o.ogrenilen));
    ilerleme.setAttribute('aria-valuetext', o.ogrenilen + ' / ' + TUM.length + ' öbek öğrenildi');

    // Kutular tıklanabilir: bir kutuya basınca liste yalnız o kutuyu gösterir.
    $('kutular').innerHTML = [0, 1, 2, 3, 4, 5].map(function (k) {
      var ad = k === 0 ? 'yeni' : (k === 5 ? 'öğrenildi' : k + '. kutu');
      return '<button type="button" class="kutu' + (seciliKutu === k ? ' acik' : '') +
        '" data-k="' + k + '" title="' + (k === 0 ? 'Hiç çalışılmamış öbekler'
          : (k === 5 ? 'Öğrenilmiş: seyrek bakım tekrarları sürer' : k + '. kutudaki öbekler')) +
        ' — göstermek için tıkla" aria-pressed="' + (seciliKutu === k ? 'true' : 'false') +
        '" aria-label="' + ad + ', ' + o['k' + k] + ' öbek">' +
        '<b>' + o['k' + k] + '</b><i>' + ad + '</i></button>';
    }).join('');

    $('bekleyenNot').hidden = !o.bekleyen;
    if (o.bekleyen) {
      $('bekleyenNot').innerHTML = '<b>' + o.bekleyen + '</b> tekrar bugünkü sınıra sığmadı, ' +
        'sıradaki günlere kaldı. Daha hızlı eritmek istersen üstteki <b>toplam kart</b> sayısını artır.';
    }
    testDugmesiGuncelle();
    $('desteBasla').disabled = o.bugun === 0;
    $('desteBasla').textContent = o.bugun === 0
      ? 'Bugünlük bitti 🎉'
      : 'Bugünü çalış (' + o.bugun + ' kart)';

    var devam = $('devamEt');
    devam.hidden = !(o.bugun === 0 && o.yeni > 0);
    devam.textContent = 'Devam et (' + Math.min(o.yeni, o.hedef) + ' öbek daha aç)';

    var parcalar = [];
    if (o.tekrar) parcalar.push('<b>' + o.tekrar + '</b> tekrarı gelen');
    if (o.acilacakYeni) parcalar.push('<b>' + o.acilacakYeni + '</b> yeni öbek');

    var metin;
    if (!o.bugun) {
      metin = o.yeni
        ? 'Bugünkü kota doldu (' + o.hedef + ' yeni öbek). Havuzda <b>' + o.yeni +
          '</b> öbek bekliyor — yarın açılır ya da <b>Devam et</b> ile bugün devam edersin.'
        : 'Bütün öbeklere başladın. Tekrarlar geldikçe burada görünecek.';
    } else {
      metin = 'Deste: ' + parcalar.join(' + ') + '.';
      if (o.yeni > o.acilacakYeni) {
        metin += ' Havuzda <b>' + o.yeni + '</b> yeni öbek var; günde ' + o.hedef +
          ' tanesi açılıyor, hepsi ' + Math.ceil(o.yeni / o.hedef) + ' günde biter.';
      }
    }
    $('desteAciklama').innerHTML = metin;
  }

  /* ---------- filtreleme ---------- */

  function filtrele(sirala) {
    var q = sadelestir(elAra.value.trim());
    var tur = elTur.value;
    var esik = parseInt(elSinav.value, 10) || 0;
    var dr = elDurum.value;

    suzulmus = TUM.filter(function (o) {
      if (tur && o.y !== tur) return false;
      if (esik && o.s < esik) return false;

      var kutu = Il.kutu(o.f, ILERLEME_TURU);
      if (seciliKutu !== null && kutu !== seciliKutu) return false;
      if (dr === 'vadesi' && !Il.vadesiGeldiMi(o.f, ILERLEME_TURU)) return false;
      if (dr === 'yeni' && kutu !== 0) return false;
      if (dr === 'ogrenilen' && kutu < 5) return false;    // mezun olanlar
      if (dr === 'zayif' && !(kutu === 1 || kutu === 2)) return false;

      if (q) {
        var havuz = o.f + ' ' + o.y + ' ' +
          o.a.map(function (a) { return a.tr + ' ' + a.ex; }).join(' ');
        if (sadelestir(havuz).indexOf(q) === -1) return false;
      }
      return true;
    });

    if (sirala) suzulmus = karistir(suzulmus);
    if (kartIndex >= suzulmus.length) kartIndex = 0;
    gosterilen = SAYFA_BOYU;
    ipucuAcik = false;
    ciz();
  }

  /* ---------- liste ---------- */

  function kutuRozeti(f) {
    var k = Il.kutu(f, ILERLEME_TURU);
    if (k === 0) return '<span class="badge">yeni</span>';
    var gun = Il.kalanGun(f, ILERLEME_TURU);
    var sinif = k >= 4 ? 'badge ok' : (k <= 2 ? 'badge warn' : 'badge');
    return '<span class="' + sinif + '">' + k + '. kutu · ' + (gun === 0 ? 'bugün' : gun + ' gün') + '</span>';
  }

  function satir(o) {
    var kutu = Il.kutu(o.f, ILERLEME_TURU);
    var anlamlar = o.a.map(function (a) {
      return '<div class="ex"><b>' + kacar(a.tr) + '</b>' + yildiz(a) +
             '<i lang="en">' + kacar(a.ex) + '</i>' +
             '<i class="tr-ex">' + kacar(a.exTr) + '</i></div>';
    }).join('');

    return '' +
      '<article class="word' + (kutu >= 5 ? ' known' : '') + '" data-f="' + kacar(o.f) + '">' +
        '<div>' +
          '<div class="en" lang="en">' + kacar(o.f) + '</div>' +
          '<div class="meta">' +
            '<span class="badge">' + kacar(o.y) + '</span>' +
            (o.s ? '<span class="badge accent" title="Kaç farklı sınavda geçti">' +
                   o.s + ' sınav</span>' : '') +
            kutuRozeti(o.f) +
          '</div>' +
        '</div>' +
        '<div class="act">' +
          '<button class="btn ghost sm" type="button" data-ne="calis" aria-label="' + kacar(o.f) +
            ' öbeğini kartta çalış">Kartta çalış</button>' +
          '<button class="star" type="button" data-ne="ses" title="Telaffuzu dinle" aria-label="' +
            kacar(o.f) + ' öbeğinin telaffuzunu dinle">🔊</button>' +
        '</div>' +
        anlamlar +
      '</article>';
  }

  function listeCiz() {
    elListe.innerHTML = suzulmus.slice(0, gosterilen).map(satir).join('');
    var kalan = suzulmus.length - gosterilen;
    var btn = $('dahaFazla');
    btn.hidden = kalan <= 0;
    btn.textContent = 'Daha fazla göster (' + Math.min(kalan, SAYFA_BOYU) + ' / ' + kalan + ' kaldı)';
  }

  /* ---------- ses ---------- */

  var sesDestegi = 'speechSynthesis' in window;

  function seslendir(metin) {
    if (!sesDestegi) return;
    try {
      window.speechSynthesis.cancel();
      var s = new SpeechSynthesisUtterance(metin);
      s.lang = 'en-GB';
      s.rate = 0.9;
      window.speechSynthesis.speak(s);
    } catch (e) { /* geç */ }
  }

  /* ---------- ipucu ---------- */

  /* Öbeğin ilk sözcüğünü cümlede bulup öbeği gizle. Çekim öbeğin herhangi
     bir parçasında olabildiği için (stem from → stems from) her sözcüğün
     kökü ayrı ayrı aranır. */
  function bosluklaCumle(obek, cumle) {
    var sonuc = cumle;
    var bulundu = false;
    obek.toLowerCase().split(/\s+/).forEach(function (parca) {
      var kok = parca.replace(/(e|y)$/, '');
      if (kok.length < 2) kok = parca;
      var kacisli = kok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var kalip = new RegExp('\\b' + kacisli + '[a-z]*\\b', 'gi');
      if (kalip.test(sonuc)) {
        kalip.lastIndex = 0;
        sonuc = sonuc.replace(kalip, '----');
        bulundu = true;
      }
    });
    return bulundu ? sonuc.replace(/(-{4}\s+)+-{4}/g, '----') : null;
  }

  /* ---------- kart ---------- */

  function kartCiz() {
    var o = suzulmus[kartIndex];
    if (!o) return;

    $('kartOn').textContent = o.f;
    $('kartKutu').innerHTML = KUTU_ADI[Il.kutu(o.f, ILERLEME_TURU)] +
      (Il.vadesiGeldiMi(o.f, ILERLEME_TURU) ? ' · tekrar zamanı' : '');
    $('kartTr').innerHTML = o.a.map(function (a) {
      return kacar(a.tr) + yildiz(a);
    }).join('<br>') +
      '<div class="muted small" style="font-weight:400;margin-top:4px">' + kacar(o.y) + '</div>';
    $('kartOrnek').innerHTML = o.a.map(function (a) {
      return '<span lang="en">' + kacar(a.ex) + '</span><br><span style="opacity:.8">' +
        kacar(a.exTr) + '</span>';
    }).join('<br><br>');

    $('kartArka').hidden = !kartAcik;
    $('kartSayac').textContent = (kartIndex + 1) + ' / ' + suzulmus.length;
    $('seslendir').hidden = !sesDestegi;

    var bosluklu = bosluklaCumle(o.f, o.a[0].ex);
    var sunulabilir = !kartAcik && bosluklu !== null;
    $('ipucuBtn').hidden = !sunulabilir || ipucuAcik;
    $('ipucuAlan').hidden = !(sunulabilir && ipucuAcik);
    if (sunulabilir && ipucuAcik) {
      $('ipucuAlan').innerHTML = kacar(bosluklu).replace(/----/g, '<span class="blank">----</span>');
    }

    $('kartIpucu').textContent = kartAcik
      ? (ipucuAcik ? 'İpucu kullandın — "Bildim" dersen öbek aynı kutuda kalır.'
                   : 'Bildin mi? Aşağıdan işaretle.')
      : 'Çevirmek için karta tıkla · istersen cevabı görmeden işaretle';

    $('bildim').disabled = false;
    $('bilmedim').disabled = false;
    $('zatenBiliyorum').disabled = false;
    elKart.setAttribute('aria-expanded', kartAcik ? 'true' : 'false');
    elKart.setAttribute('aria-label', o.f + ' öbeğinin cevabını ' + (kartAcik ? 'gizle' : 'göster'));
  }

  function kartGit(adim) {
    if (!suzulmus.length) return;
    kartIndex = (kartIndex + adim + suzulmus.length) % suzulmus.length;
    kartAcik = false;
    ipucuAcik = false;
    kartCiz();
  }

  /* ne: 'dogru' | 'yanlis' | 'zaten' */
  function kartCevap(ne) {
    var o = suzulmus[kartIndex];
    if (!o) return;

    var sonuc;
    if (ne === 'zaten') sonuc = Il.zatenBiliyorum(o.f, ILERLEME_TURU);
    else if (ne === 'yanlis') sonuc = Il.yanlis(o.f, ILERLEME_TURU);
    else if (ipucuAcik) sonuc = Il.ipucuyla(o.f, ILERLEME_TURU);
    else sonuc = Il.dogru(o.f, ILERLEME_TURU);
    if (sonuc === false) { window.YDS.depolamaUyarisi(); return; }

    desteyiCiz();

    if (desteModu) {
      suzulmus.splice(kartIndex, 1);
      if (!suzulmus.length) { desteBitti(); return; }
      if (kartIndex >= suzulmus.length) kartIndex = 0;
      kartAcik = false;
      ipucuAcik = false;
      kartCiz();
      guncelleSayac();
    } else {
      kartGit(1);
    }
  }

  function desteBitti() {
    desteModu = false;
    kartModu = false;
    $('mod').textContent = 'Kart moduna geç';
    elDurum.value = '';
    filtrele();
    elSayac.textContent = 'Bugünün öbek destesi bitti. Yarın yeni tekrarlar açılacak.';

    var davet = $('testDavet');
    var n = Test ? Test.bugunSayisi(leitnerListesi()) : 0;
    davet.hidden = n < (Test ? Test.EN_AZ : 99);
    if (!davet.hidden) {
      $('testDavetMetin').textContent = 'Bugünkü desteni bitirdin 🎉 Şimdi bu öbekleri cümle içinde gör: ' +
        Math.min(n, Test.EN_COK) + ' soruluk boşluk doldurma testi.';
      davet.scrollIntoView({ behavior: window.YDS.hareket(), block: 'center' });
    }
  }

  /* ---------- günün testi ---------- */

  var Test = window.YDS.GununTesti;
  var geriAlCiz = null;

  function testDugmesiGuncelle() {
    var b = $('testBasla');
    if (!Test) { b.hidden = true; return; }
    Test.kaynakSec('obek');
    var n = Test.bugunSayisi(leitnerListesi());
    b.hidden = n < Test.EN_AZ;
    b.textContent = 'Günün testi (' + Math.min(n, Test.EN_COK) + ' soru)';
  }

  function testiBaslat() {
    if (!Test) return;
    var b = $('testBasla');
    b.disabled = true;
    Test.baslat(leitnerListesi(), null, function () {
      $('testDavet').hidden = true;
      filtrele();
      desteyiCiz();
      $('deste').scrollIntoView({ behavior: window.YDS.hareket(), block: 'start' });
    }, 'obek').then(function (r) {
      b.disabled = false;
      if (r.acildi) {
        kartModu = false; desteModu = false;
        elListe.hidden = true; elKartAlan.hidden = true; elBos.hidden = true;
        $('dahaFazla').hidden = true;
        $('testDavet').hidden = true;
      } else {
        $('desteAciklama').innerHTML = r.calisilan
          ? 'Bugün çalıştığın ' + r.calisilan + ' öbekten yalnız ' + r.soru +
            ' tanesinin test cümlesi hazır; test için en az ' + Test.EN_AZ + ' gerekiyor.'
          : 'Bugün henüz öbek çalışmadın; önce desteyi bitir.';
      }
    }).catch(function () { b.disabled = false; });
  }

  /* ---------- ortak ---------- */

  function guncelleSayac() {
    var o = Il.leitnerOzet(leitnerListesi(), ILERLEME_TURU);
    if (seciliKutu !== null) {
      elSayac.textContent = suzulmus.length + ' öbek · ' +
        (seciliKutu === 0 ? 'hiç çalışılmamışlar'
          : (seciliKutu === 5 ? 'öğrenilenler (5. kutu)' : seciliKutu + '. kutu')) +
        ' · süzgeci kaldırmak için kutuya yeniden tıkla';
      return;
    }
    elSayac.textContent = suzulmus.length + ' öbek gösteriliyor · toplam ' + TUM.length +
      ' · öğrenilen ' + o.ogrenilen + ' · bugün ' + o.gosterilecekTekrar +
      ' tekrar + ' + o.acilacakYeni + ' yeni';
  }

  function ciz() {
    guncelleSayac();
    var bosMu = suzulmus.length === 0;
    elBos.hidden = !bosMu;
    elListe.hidden = bosMu || kartModu;
    elKartAlan.hidden = bosMu || !kartModu;
    $('dahaFazla').hidden = bosMu || kartModu || suzulmus.length <= gosterilen;
    if (bosMu) return;
    if (kartModu) kartCiz(); else listeCiz();
  }

  /* ---------- olaylar ---------- */

  [elAra, elTur, elSinav, elDurum].forEach(function (el) {
    el.addEventListener('input', function () {
      desteModu = false;
      seciliKutu = null;
      desteyiCiz();
      filtrele();
    });
  });

  $('dahaFazla').addEventListener('click', function () {
    gosterilen += SAYFA_BOYU;
    listeCiz();
  });

  elListe.addEventListener('click', function (e) {
    var btn = e.target.closest('.star');
    if (!btn) return;
    var kutu = btn.closest('.word');
    var f = kutu.getAttribute('data-f');
    var ne = btn.getAttribute('data-ne');

    if (ne === 'ses') { seslendir(f); return; }
    if (ne !== 'calis') return;
    kartIndex = suzulmus.findIndex(function (o) { return o.f === f; });
    if (kartIndex < 0) return;
    kartModu = true;
    desteModu = false;
    kartAcik = false;
    ipucuAcik = false;
    $('mod').textContent = 'Liste moduna dön';
    ciz();
    elKartAlan.scrollIntoView({ behavior: window.YDS.hareket(), block: 'center' });
  });

  $('mod').addEventListener('click', function () {
    kartModu = !kartModu;
    kartAcik = false;
    ipucuAcik = false;
    desteModu = false;
    this.textContent = kartModu ? 'Liste moduna dön' : 'Kart moduna geç';
    ciz();
  });

  $('testBasla').addEventListener('click', testiBaslat);
  $('testDavetBasla').addEventListener('click', testiBaslat);
  $('testDavetKapat').addEventListener('click', function () { $('testDavet').hidden = true; });

  $('desteBasla').addEventListener('click', function () {
    var destelik = Il.destelik(leitnerListesi(), ILERLEME_TURU);
    var kume = {};
    destelik.forEach(function (x) { kume[x.en] = true; });

    elAra.value = ''; elTur.value = ''; elSinav.value = ''; elDurum.value = '';
    suzulmus = karistir(TUM.filter(function (o) { return kume[o.f]; }));

    desteModu = true;
    kartModu = true;
    kartIndex = 0;
    kartAcik = false;
    ipucuAcik = false;
    gosterilen = SAYFA_BOYU;
    $('mod').textContent = 'Liste moduna dön';
    ciz();
    elKartAlan.scrollIntoView({ behavior: window.YDS.hareket(), block: 'center' });
  });

  /* Kutuya tıkla: yalnız o kutudaki öbekler. Yeniden tıklamak süzgeci kaldırır. */
  $('kutular').addEventListener('click', function (e) {
    var b = e.target.closest('.kutu');
    if (!b) return;
    var k = Number(b.dataset.k);
    seciliKutu = (seciliKutu === k) ? null : k;
    desteModu = false;
    if (seciliKutu !== null) { elAra.value = ''; elDurum.value = ''; }
    filtrele();
    desteyiCiz();
    elSayac.scrollIntoView({ behavior: window.YDS.hareket(), block: 'nearest' });
  });

  $('gunlukTavan').addEventListener('change', function () {
    Il.gunlukTavanAyarla(this.value);
    desteyiCiz();
  });

  $('gunlukHedef').addEventListener('change', function () {
    Il.gunlukHedefAyarla(this.value);
    desteyiCiz();
  });

  $('devamEt').addEventListener('click', function () {
    Il.kotaArtir();
    desteyiCiz();
    $('desteBasla').click();
  });

  elKart.addEventListener('click', function () {
    if (window.YDS.metinSecildi(elKart)) return;
    kartAcik = !kartAcik;
    kartCiz();
  });
  elKart.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); kartAcik = !kartAcik; kartCiz(); }
  });
  $('ipucuBtn').addEventListener('click', function (e) { e.stopPropagation(); ipucuAcik = true; kartCiz(); });
  $('ipucuAlan').addEventListener('click', function (e) { e.stopPropagation(); });
  $('onceki').addEventListener('click', function () { kartGit(-1); });
  $('sonraki').addEventListener('click', function () { kartGit(1); });
  $('bildim').addEventListener('click', function () { kartCevap('dogru'); });
  $('bilmedim').addEventListener('click', function () { kartCevap('yanlis'); });
  $('zatenBiliyorum').addEventListener('click', function () { kartCevap('zaten'); });
  $('seslendir').addEventListener('click', function (e) {
    e.stopPropagation();
    var o = suzulmus[kartIndex];
    if (o) seslendir(o.f);
  });

  $('temizle').addEventListener('click', function () {
    elAra.value = ''; elTur.value = ''; elSinav.value = ''; elDurum.value = '';
    desteModu = false;
    filtrele();
  });

  $('sifirla').addEventListener('click', function () {
    var n = adlar().filter(function (a) { return Il.kutu(a, ILERLEME_TURU) > 0; }).length;
    if (!window.YDS.ikiKereSor(
        'Öbek tekrar ilerlemen silinecek. Kelime ilerlemene dokunulmaz.', n)) return;
    if (!Il.yedekAl('öbek kutuları', n)) { window.YDS.depolamaUyarisi(); return; }
    if (!Il.listeyiSifirla(adlar(), ILERLEME_TURU)) { window.YDS.depolamaUyarisi(); return; }
    desteyiCiz();
    filtrele();
    if (geriAlCiz) geriAlCiz();
  });

  document.addEventListener('keydown', function (e) {
    if (!kartModu || elKartAlan.hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;

    if (e.key === 'ArrowRight') { e.preventDefault(); kartGit(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); kartGit(-1); }
    else if (e.key === ' ') { e.preventDefault(); kartAcik = !kartAcik; kartCiz(); }
    else if (e.key.toLowerCase() === 'h') {
      e.preventDefault();
      if (!$('ipucuBtn').hidden) { ipucuAcik = true; kartCiz(); }
    }
    else if (e.key === '1') { e.preventDefault(); kartCevap('yanlis'); }
    else if (e.key === '2') { e.preventDefault(); kartCevap('dogru'); }
    else if (e.key === '3') { e.preventDefault(); kartCevap('zaten'); }
    else if (e.key.toLowerCase() === 's') {
      e.preventDefault();
      var o = suzulmus[kartIndex];
      if (o) seslendir(o.f);
    }
  });

  /* ---------- başlat ---------- */

  if (window.SAYILAR) $('toplamObek').textContent = window.SAYILAR.obek.toLocaleString('tr-TR');
  $('gunlukHedef').value = String(Il.gunlukHedef());
  $('gunlukTavan').value = String(Il.gunlukTavan());

  elSayac.textContent = 'Öbekler yükleniyor…';
  Veri.obekleriYukle().then(function (liste) {
    TUM = liste;

    var turler = [];
    TUM.forEach(function (o) { if (o.y && turler.indexOf(o.y) === -1) turler.push(o.y); });
    turler.sort().forEach(function (t) {
      var n = TUM.filter(function (o) { return o.y === t; }).length;
      var opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t + ' (' + n + ')';
      elTur.appendChild(opt);
    });

    desteyiCiz();
    filtrele();
    geriAlCiz = window.YDS.geriAlKutusu(function () { desteyiCiz(); filtrele(); });
  }).catch(function (e) {
    elSayac.textContent = 'Öbekler yüklenemedi: ' + e.message;
  });
})();
