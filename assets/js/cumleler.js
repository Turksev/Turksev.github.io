/* Cümleler — YDS kitapçıklarında geçmiş cümleler ve Türkçe çevirileri.
   Cümleye tıklanınca çeviri, hangi sınavda geçtiği ve sınavın hangi bölümünde
   sorulduğu açılır. Burada puanlama/tekrar yok; okuyarak çalışma bölümü. */
(function () {
  'use strict';

  var Il = window.YDS.Ilerleme;
  var ILERLEME_TURU = 'cumle';
  var KUTU_ADI = ['hiç çalışılmadı', '1. kutu', '2. kutu', '3. kutu', '4. kutu', '5. kutu'];

  var HEPSI = window.CUMLELER || [];
  var GOSTER = 60;                 // ilk yüklemede ve her "daha fazla"da
  var gosterilen = GOSTER;
  var suzulmus = HEPSI;

  function $(id) { return document.getElementById(id); }
  function kacar(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function say(n) { return n.toLocaleString('tr-TR'); }

  /* ---- filtre seçeneklerini veriden üret ---- */
  function secenekleriKur() {
    var bolum = {}, yil = {};
    HEPSI.forEach(function (c) {
      if (c.b) bolum[c.b] = (bolum[c.b] || 0) + 1;
      if (c.y) { var yk = String(c.y); yil[yk] = (yil[yk] || 0) + 1; }
    });
    var bs = Object.keys(bolum).sort(function (a, b) { return bolum[b] - bolum[a]; });
    $('bolum').innerHTML = '<option value="">Tüm bölümler</option>' +
      bs.map(function (b) {
        return '<option value="' + kacar(b) + '">' + kacar(b) + ' (' + say(bolum[b]) + ')</option>';
      }).join('');
    var ys = Object.keys(yil).sort();
    $('yil').innerHTML = '<option value="">Tüm yıllar</option>' +
      ys.map(function (y) {
        return '<option value="' + kacar(y) + '">' + kacar(y) + ' (' + say(yil[y]) + ')</option>';
      }).join('');
  }

  /* ---- bir cümle satırı ---- */
  function satir(c, i) {
    var alt = [];
    if (c.s) alt.push(kacar(c.s));
    if (c.b) alt.push(kacar(c.b) + (c.n ? ' · ' + c.n + '. soru' : ''));
    return '' +
      '<article class="cum" data-i="' + i + '">' +
        '<div class="cum-en" lang="en">' + kacar(c.e) + '</div>' +
        '<div class="cum-alt">' + alt.join(' · ') + '</div>' +
        '<div class="cum-tr" hidden>' +
          (c.t ? kacar(c.t)
               : '<i class="muted">Bu cümlenin çevirisi henüz hazırlanmadı.</i>') +
        '</div>' +
      '</article>';
  }

  /* ---- kart modu ---- */
  var kartModu = false;
  var kartIndex = 0;
  var kartAcik = false;

  /* Cümlenin kalıcı ilerleme kimliği. Cümle metnini anahtar yapmak depoyu
     megabaytlarca şişirirdi; onun yerine FNV-1a özeti + uzunluk kullanılıyor.
     "c:" öneki kimliği kelime ve öbek kimliklerinden ayırır — esitleme-veri.js
     bu önekten tanıyıp ham saklıyor. */
  function kimlik(c) {
    var t = String(c && c.e || ''), h = 2166136261;
    for (var i = 0; i < t.length; i++) {
      h ^= t.charCodeAt(i);
      h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    return 'c:' + h.toString(36) + '-' + t.length.toString(36);
  }

  /* ---- ses ---- */
  var sesDestegi = 'speechSynthesis' in window;

  function seslendir(metin) {
    if (!sesDestegi || !metin) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(metin);
      u.lang = 'en-GB';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) { /* geç */ }
  }

  function kaynakEtiketi(c) {
    var p = [];
    if (c.s) p.push(c.s);
    if (c.b) p.push(c.b + (c.n ? ' · ' + c.n + '. soru' : ''));
    return p.join(' · ') || '—';
  }

  function kartCiz() {
    if (!suzulmus.length) return;
    if (kartIndex >= suzulmus.length) kartIndex = 0;
    if (kartIndex < 0) kartIndex = suzulmus.length - 1;
    var c = suzulmus[kartIndex];
    $('kartOn').textContent = c.e;
    $('kartKaynak').textContent = kaynakEtiketi(c);
    $('kartTr').textContent = c.t || 'Bu cümlenin çevirisi henüz hazırlanmadı.';
    $('kartArka').hidden = !kartAcik;
    $('kart').setAttribute('aria-expanded', kartAcik ? 'true' : 'false');
    $('kartIpucu').hidden = kartAcik;
    $('kartSayac').textContent = say(kartIndex + 1) + ' / ' + say(suzulmus.length);
    kutuyuCiz(c);
  }

  /* Kelime kartındaki kutu rozetinin aynısı: cümle hangi Leitner kutusunda,
     tekrarı gelmiş mi. */
  function kutuyuCiz(c) {
    if (!Il) { $('kartKutu').hidden = true; return; }
    var id = kimlik(c);
    $('kartKutu').textContent = KUTU_ADI[Il.kutu(id, ILERLEME_TURU)] +
      (Il.vadesiGeldiMi(id, ILERLEME_TURU) ? ' · tekrar zamanı' : '');
  }

  /* ne: 'dogru' | 'yanlis' | 'zaten' */
  function kartCevap(ne) {
    var c = suzulmus[kartIndex];
    if (!c || !Il) return;
    var id = kimlik(c), sonuc;
    if (ne === 'zaten') sonuc = Il.zatenBiliyorum(id, ILERLEME_TURU);
    else if (ne === 'yanlis') sonuc = Il.yanlis(id, ILERLEME_TURU);
    else sonuc = Il.dogru(id, ILERLEME_TURU);
    if (sonuc === false) { window.YDS.depolamaUyarisi(); return; }
    kartGit(1);
  }

  function kartCevir() { kartAcik = !kartAcik; kartCiz(); }
  function kartGit(adim) { kartIndex += adim; kartAcik = false; kartCiz(); }

  function listeCiz() {
    var el = $('liste');
    if (!suzulmus.length) {
      el.innerHTML = '';
      $('bos').hidden = false;
      $('dahaFazla').hidden = true;
      $('sayac').textContent = 'Eşleşen cümle yok.';
      return;
    }
    $('bos').hidden = true;
    var dilim = suzulmus.slice(0, gosterilen);
    el.innerHTML = dilim.map(function (c) { return satir(c, HEPSI.indexOf(c)); }).join('');
    var kalan = suzulmus.length - dilim.length;
    $('dahaFazla').hidden = kalan <= 0;
    if (kalan > 0) $('dahaFazla').textContent = 'Daha fazla göster (' + say(kalan) + ' cümle daha)';
  }

  function ciz() {
    var bos = !suzulmus.length;
    $('kartAlan').hidden = !kartModu || bos;
    $('liste').hidden = kartModu;
    $('dahaFazla').hidden = kartModu || bos;
    if (bos) {
      $('bos').hidden = false;
      $('liste').innerHTML = '';
      $('sayac').textContent = 'Eşleşen cümle yok.';
      return;
    }
    $('bos').hidden = true;
    if (kartModu) kartCiz(); else listeCiz();
    var cevirili = suzulmus.filter(function (c) { return c.t; }).length;
    $('sayac').textContent = say(suzulmus.length) + ' cümle · ' +
      say(cevirili) + ' tanesinin çevirisi hazır';
  }

  function suz() {
    var q = ($('ara').value || '').trim().toLowerCase();
    var b = $('bolum').value;
    var y = $('yil').value;
    var sadeceCevirili = $('cevirili').checked;
    suzulmus = HEPSI.filter(function (c) {
      if (b && c.b !== b) return false;
      if (y && String(c.y) !== y) return false;
      if (sadeceCevirili && !c.t) return false;
      if (!q) return true;
      return c.e.toLowerCase().indexOf(q) >= 0 ||
             (c.t && c.t.toLowerCase().indexOf(q) >= 0);
    });
    gosterilen = GOSTER;
    kartIndex = 0;
    kartAcik = false;
    ciz();
  }

  /* ---- olaylar ---- */
  document.addEventListener('DOMContentLoaded', function () {
    if (!HEPSI.length) {
      $('sayac').textContent = 'Cümle verisi yüklenemedi.';
      return;
    }
    secenekleriKur();

    var zaman;
    $('ara').addEventListener('input', function () {
      clearTimeout(zaman); zaman = setTimeout(suz, 180);
    });
    $('bolum').addEventListener('change', suz);
    $('yil').addEventListener('change', suz);
    $('cevirili').addEventListener('change', suz);
    $('temizle').addEventListener('click', function () {
      $('ara').value = ''; $('bolum').value = ''; $('yil').value = '';
      $('cevirili').checked = false; suz();
    });
    $('dahaFazla').addEventListener('click', function () {
      gosterilen += GOSTER; ciz();
    });

    // cümleye tıkla -> çeviriyi aç/kapat
    $('liste').addEventListener('click', function (e) {
      var k = e.target.closest('.cum');
      if (!k) return;
      var tr = k.querySelector('.cum-tr');
      tr.hidden = !tr.hidden;
      k.classList.toggle('acik', !tr.hidden);
    });

    /* ---- kart modu olayları ---- */
    $('mod').addEventListener('click', function () {
      kartModu = !kartModu;
      kartAcik = false;
      $('mod').textContent = kartModu ? 'Liste moduna dön' : 'Kart moduna geç';
      ciz();
      if (kartModu) $('kart').focus();
    });

    $('kart').addEventListener('click', kartCevir);
    $('kart').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); kartCevir(); }
    });
    $('onceki').addEventListener('click', function () { kartGit(-1); });
    $('sonraki').addEventListener('click', function () { kartGit(1); });
    if (!sesDestegi) $('seslendir').hidden = true;
    $('seslendir').addEventListener('click', function (e) {
      e.stopPropagation();
      var c = suzulmus[kartIndex];
      if (c) seslendir(c.e);
    });
    $('bilmedim').addEventListener('click', function () { kartCevap('yanlis'); });
    $('bildim').addEventListener('click', function () { kartCevap('dogru'); });
    $('zatenBiliyorum').addEventListener('click', function () { kartCevap('zaten'); });

    $('karistir').addEventListener('click', function () {
      // Fisher-Yates: filtrelenmiş listeyi yerinde karıştır
      for (var i = suzulmus.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = suzulmus[i]; suzulmus[i] = suzulmus[j]; suzulmus[j] = t;
      }
      kartIndex = 0; kartAcik = false; ciz();
    });

    document.addEventListener('keydown', function (e) {
      if (!kartModu) return;
      var h = document.activeElement;
      if (h && /^(INPUT|SELECT|TEXTAREA)$/.test(h.tagName)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); kartGit(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); kartGit(-1); }
      else if (e.key === ' ') { e.preventDefault(); kartCevir(); }
      else if (e.key === '1') { e.preventDefault(); kartCevap('yanlis'); }
      else if (e.key === '2') { e.preventDefault(); kartCevap('dogru'); }
      else if (e.key === '3') { e.preventDefault(); kartCevap('zaten'); }
      else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        var c = suzulmus[kartIndex];
        if (c) seslendir(c.e);
      }
    });

    suz();
  });
})();
