/* ============================================================
   Kelime sayfası: aralıklı tekrar (Leitner), arama/filtre,
   kart modu, sesli okuma
   ============================================================ */

(function () {
  'use strict';

  var sadelestir = window.YDS.sadelestir;
  var kacar = window.YDS.kacar;
  var karistir = window.YDS.karistir;
  var Il = window.YDS.Ilerleme;

  var TUM = window.KELIMELER || [];

  var suzulmus = [];
  var kartIndex = 0;
  var kartAcik = false;
  var kartModu = false;
  var desteModu = false;      // "bugünü çalış" ile girilen odaklı tekrar
  var ipucuAcik = false;      // bu kartta ipucu görüntülendi mi

  var $ = function (id) { return document.getElementById(id); };
  var elAra = $('ara'), elSeviye = $('seviye'), elTip = $('tip'), elDurum = $('durum');
  var elListe = $('liste'), elSayac = $('sayac'), elBos = $('bos');
  var elKartAlan = $('kartAlan'), elKart = $('kart');

  var KUTU_ADI = ['hiç çalışılmadı', '1. kutu', '2. kutu', '3. kutu', '4. kutu', '5. kutu'];

  /* ---------- bugünün destesi özeti ---------- */

  function desteyiCiz() {
    var o = Il.leitnerOzet(TUM);

    $('desteBilgi').textContent = o.bugun + ' kelime tekrarı bekliyor · ' +
      o.ogrenilen + ' öğrenildi · ' + o.calisilan + '/' + TUM.length + ' çalışıldı';

    var oran = TUM.length ? (TUM.length - o.bugun) / TUM.length * 100 : 0;
    $('desteBar').style.width = oran + '%';

    var kutular = [1, 2, 3, 4, 5].map(function (k) {
      return '<span class="kutu"><b>' + o['k' + k] + '</b><i>' + k + '. kutu</i></span>';
    }).join('');
    $('kutular').innerHTML =
      '<span class="kutu"><b>' + o.k0 + '</b><i>yeni</i></span>' + kutular;

    $('desteBasla').disabled = o.bugun === 0;
    $('desteBasla').textContent = o.bugun === 0
      ? 'Bugünlük bitti 🎉'
      : 'Bugünü çalış (' + o.bugun + ')';
  }

  /* ---------- filtreleme ---------- */

  function filtrele(sirala) {
    var q = sadelestir(elAra.value.trim());
    var sv = elSeviye.value, tp = elTip.value, dr = elDurum.value;

    suzulmus = TUM.filter(function (k) {
      if (sv && k.sv !== sv) return false;
      if (tp && k.tip.indexOf(tp) === -1) return false;

      var kutu = Il.kutu(k.en);
      if (dr === 'vadesi' && !Il.vadesiGeldiMi(k.en)) return false;
      if (dr === 'yeni' && kutu !== 0) return false;
      if (dr === 'ogrenilen' && kutu < 4) return false;
      if (dr === 'zayif' && !(kutu === 1 || kutu === 2)) return false;

      if (q) {
        var havuz = sadelestir(k.en + ' ' + k.tr + ' ' + (k.es || ''));
        if (havuz.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (sirala) suzulmus = karistir(suzulmus);
    if (kartIndex >= suzulmus.length) kartIndex = 0;
    ipucuAcik = false;      // liste değişti, gösterilen kart da değişmiş olabilir
    ciz();
  }

  /* ---------- liste görünümü ---------- */

  function kutuRozeti(en) {
    var k = Il.kutu(en);
    if (k === 0) return '<span class="badge">yeni</span>';
    var gun = Il.kalanGun(en);
    var sinif = k >= 4 ? 'badge ok' : (k <= 2 ? 'badge warn' : 'badge');
    var ne = gun === 0 ? 'bugün' : gun + ' gün sonra';
    return '<span class="' + sinif + '">' + k + '. kutu · ' + ne + '</span>';
  }

  function satir(k) {
    var kutu = Il.kutu(k.en);
    return '' +
      '<article class="word' + (kutu >= 4 ? ' known' : '') + '" data-en="' + kacar(k.en) + '">' +
        '<div>' +
          '<div class="en">' + kacar(k.en) + '</div>' +
          '<div class="tr">' + kacar(k.tr) + '</div>' +
          '<div class="meta">' +
            '<span class="badge">' + kacar(k.tip) + '</span>' +
            '<span class="badge accent">' + kacar(k.sv) + '</span>' +
            kutuRozeti(k.en) +
            (k.es ? '<span class="badge">≈ ' + kacar(k.es) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="act">' +
          '<button class="star" type="button" data-ne="bildim" title="Bildim — bir üst kutuya çıkar">✓</button>' +
          '<button class="star" type="button" data-ne="bilmedim" title="Bilemedim — 1. kutuya döner">✗</button>' +
          '<button class="star" type="button" data-ne="ses" title="Telaffuzu dinle">🔊</button>' +
        '</div>' +
        '<div class="ex"><i>' + kacar(k.ex) + '</i><i class="tr-ex">' + kacar(k.exTr) + '</i></div>' +
      '</article>';
  }

  function listeCiz() {
    elListe.innerHTML = suzulmus.map(satir).join('');
  }

  /* ---------- sesli okuma ---------- */

  var sesDestegi = 'speechSynthesis' in window;

  function seslendir(metin) {
    if (!sesDestegi) return;
    try {
      window.speechSynthesis.cancel();
      var s = new SpeechSynthesisUtterance(metin);
      s.lang = 'en-GB';
      s.rate = 0.9;
      window.speechSynthesis.speak(s);
    } catch (e) { /* tarayıcı izin vermiyorsa sessizce geç */ }
  }

  /* ---------- ipucu: kelimeyi kendi örnek cümlesinde gizle ---------- */

  /* Örnekler kelimeyi çekimli kullanabiliyor (accumulate → accumulated),
     bu yüzden düz arama yetmez: sondaki e/y atılıp kökle başlayan sözcük aranır.
     Eşleşme bulunamazsa null döner ve o kartta ipucu hiç sunulmaz. */
  function bosluklaCumle(kelime, cumle) {
    var kok = String(kelime).toLowerCase().replace(/(e|y)$/, '');
    if (kok.length < 3) kok = String(kelime).toLowerCase();
    var kacisli = kok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var kalip = new RegExp('\\b' + kacisli + '[a-z]*\\b', 'gi');
    if (!kalip.test(cumle)) return null;
    kalip.lastIndex = 0;
    return cumle.replace(kalip, '----');
  }

  /* ---------- kart görünümü ---------- */

  function kartCiz() {
    var k = suzulmus[kartIndex];
    if (!k) return;

    $('kartOn').textContent = k.en;
    $('kartKutu').innerHTML = KUTU_ADI[Il.kutu(k.en)] +
      (Il.vadesiGeldiMi(k.en) ? ' · tekrar zamanı' : '');
    $('kartTr').textContent = k.tr + '  (' + k.tip + ')';
    $('kartOrnek').innerHTML = kacar(k.ex) +
      '<br><span style="opacity:.8">' + kacar(k.exTr) + '</span>';
    $('kartArka').hidden = !kartAcik;
    $('kartSayac').textContent = (kartIndex + 1) + ' / ' + suzulmus.length;
    $('seslendir').hidden = !sesDestegi;

    // İpucu yalnızca kart kapalıyken ve cümle boşluklanabiliyorsa anlamlı.
    var bosluklu = bosluklaCumle(k.en, k.ex);
    var sunulabilir = !kartAcik && bosluklu !== null;

    $('ipucuBtn').hidden = !sunulabilir || ipucuAcik;
    $('ipucuAlan').hidden = !(sunulabilir && ipucuAcik);
    if (sunulabilir && ipucuAcik) {
      $('ipucuAlan').innerHTML = kacar(bosluklu).replace(/----/g, '<span class="blank">----</span>');
    }

    $('kartIpucu').textContent = kartAcik
      ? (ipucuAcik ? 'İpucu kullandın — "Bildim" dersen kelime aynı kutuda kalır.'
                   : 'Bildin mi? Aşağıdan işaretle.')
      : 'Çevirmek için karta tıkla · boşluk tuşu';
  }

  function kartGit(adim) {
    if (!suzulmus.length) return;
    kartIndex = (kartIndex + adim + suzulmus.length) % suzulmus.length;
    kartAcik = false;
    ipucuAcik = false;
    kartCiz();
  }

  /* Kartta cevap ver: kutuyu güncelle, deste modundaysa kartı listeden düşür.
     İpucuya bakıp bildiyse terfi yok — kelime aynı kutuda kalır. */
  function kartCevap(dogruMu) {
    var k = suzulmus[kartIndex];
    if (!k) return;

    if (!dogruMu) Il.yanlis(k.en);
    else if (ipucuAcik) Il.ipucuyla(k.en);
    else Il.dogru(k.en);

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
    elSayac.textContent = 'Bugünün destesi bitti. Yarın yeni tekrarlar açılacak.';
  }

  /* ---------- ortak çizim ---------- */

  function guncelleSayac() {
    var o = Il.leitnerOzet(TUM);
    elSayac.textContent = suzulmus.length + ' kelime gösteriliyor · toplam ' + TUM.length +
      ' · öğrenilen ' + o.ogrenilen + ' · bugün tekrar ' + o.bugun;
  }

  function ciz() {
    guncelleSayac();
    var bosMu = suzulmus.length === 0;
    elBos.hidden = !bosMu;
    elListe.hidden = bosMu || kartModu;
    elKartAlan.hidden = bosMu || !kartModu;
    if (bosMu) return;
    if (kartModu) kartCiz(); else listeCiz();
  }

  /* ---------- olaylar ---------- */

  [elAra, elSeviye, elTip, elDurum].forEach(function (el) {
    el.addEventListener('input', function () { desteModu = false; filtrele(); });
  });

  elListe.addEventListener('click', function (e) {
    var btn = e.target.closest('.star');
    if (!btn) return;
    var kutu = btn.closest('.word');
    var en = kutu.getAttribute('data-en');
    var ne = btn.getAttribute('data-ne');

    if (ne === 'ses') { seslendir(en); return; }

    if (ne === 'bildim') Il.dogru(en); else Il.yanlis(en);
    desteyiCiz();

    // Duruma göre filtreliyorsak satır listeden düşebilir; değilse yerinde yenile.
    if (elDurum.value) {
      filtrele();
    } else {
      var kel = TUM.filter(function (k) { return k.en === en; })[0];
      if (kel) {
        var yeni = document.createElement('div');
        yeni.innerHTML = satir(kel);
        kutu.replaceWith(yeni.firstChild);
      }
      guncelleSayac();
    }
  });

  $('mod').addEventListener('click', function () {
    kartModu = !kartModu;
    kartAcik = false;
    ipucuAcik = false;
    desteModu = false;
    this.textContent = kartModu ? 'Liste moduna dön' : 'Kart moduna geç';
    ciz();
  });

  $('desteBasla').addEventListener('click', function () {
    elAra.value = ''; elSeviye.value = ''; elTip.value = '';
    elDurum.value = 'vadesi';
    desteModu = true;
    kartModu = true;
    kartIndex = 0;
    kartAcik = false;
    ipucuAcik = false;
    $('mod').textContent = 'Liste moduna dön';
    filtrele(true);                       // deste karışık sırayla
    elKartAlan.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  elKart.addEventListener('click', function () {
    kartAcik = !kartAcik;
    kartCiz();
  });

  $('ipucuBtn').addEventListener('click', function (e) {
    e.stopPropagation();          // karta tıklama sayılıp çevirmesin
    ipucuAcik = true;
    kartCiz();
  });

  $('ipucuAlan').addEventListener('click', function (e) { e.stopPropagation(); });

  $('onceki').addEventListener('click', function () { kartGit(-1); });
  $('sonraki').addEventListener('click', function () { kartGit(1); });
  $('bildim').addEventListener('click', function () { kartCevap(true); });
  $('bilmedim').addEventListener('click', function () { kartCevap(false); });
  $('seslendir').addEventListener('click', function (e) {
    e.stopPropagation();
    var k = suzulmus[kartIndex];
    if (k) seslendir(k.en);
  });

  $('temizle').addEventListener('click', function () {
    elAra.value = ''; elSeviye.value = ''; elTip.value = ''; elDurum.value = '';
    desteModu = false;
    filtrele();
  });

  $('sifirla').addEventListener('click', function () {
    if (!confirm('Tüm kelime tekrar ilerlemen (kutular ve tekrar tarihleri) silinecek. Emin misin?')) return;
    Il.leitnerSifirla();
    desteyiCiz();
    filtrele();
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
    else if (e.key === '1') { e.preventDefault(); kartCevap(false); }
    else if (e.key === '2') { e.preventDefault(); kartCevap(true); }
    else if (e.key.toLowerCase() === 's') {
      e.preventDefault();
      var k = suzulmus[kartIndex];
      if (k) seslendir(k.en);
    }
  });

  /* ---------- başlat ---------- */
  desteyiCiz();
  filtrele();
})();
