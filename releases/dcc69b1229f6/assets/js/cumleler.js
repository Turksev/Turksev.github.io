/* Cümleler — YDS kitapçıklarında geçmiş cümleler ve Türkçe çevirileri.
   Cümleye tıklanınca çeviri, hangi sınavda geçtiği ve sınavın hangi bölümünde
   sorulduğu açılır. Kart modunda kelime kartındaki kutu (Leitner) mantığı vardır.

   Veri yıl dosyalarına bölünmüştür (data/cumleler/<yıl>.js, ~100-300 KB) ve
   yeniden eskiye doğru sırayla, sayfa açıkken yüklenir: ilk yıl gelir gelmez
   liste görünür, diğerleri geldikçe eklenir. Tek dosya (2,7 MB) ilk açılışı
   mobilde saniyelerce bekletiyordu (denetim B8, 5 Eylül 2026). Filtre
   seçenekleri ve sayılar data/cumleler-dizin.js'ten gelir; böylece hiçbir yıl
   yüklenmeden de tam liste görülür. */
(function () {
  'use strict';

  var Il = window.YDS.Ilerleme;
  var ILERLEME_TURU = 'cumle';
  var KUTU_ADI = ['hiç çalışılmadı', '1. kutu', '2. kutu', '3. kutu', '4. kutu', '5. kutu'];

  var DIZIN = window.CUMLELER_DIZIN || { yillar: [], bolumler: [], toplam: 0 };
  var HEPSI = [];                  // yüklenen yıllar sırayla eklenir (yeniden eskiye)
  var GOSTER = 60;                 // ilk yüklemede ve her "daha fazla"da
  var gosterilen = GOSTER;
  var suzulmus = HEPSI;
  var yuklu = {};                  // yıl -> true
  var yukleniyor = {};             // yıl -> Promise
  var yuklemeHatalari = {};

  function $(id) { return document.getElementById(id); }
  function kacar(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function say(n) { return n.toLocaleString('tr-TR'); }

  /* ---- yıl dosyalarını yükle ---- */
  function yilYukle(y) {
    y = String(y);
    if (yuklu[y]) return Promise.resolve();
    if (yukleniyor[y]) return yukleniyor[y];
    yukleniyor[y] = new Promise(function (coz) {
      var s = document.createElement('script');
      s.src = window.YDS.varlikYolu('data/cumleler/' + y + '.js');
      s.onload = function () {
        var kayitlar = (window.CUMLELER_YIL && window.CUMLELER_YIL[y]) || [];
        kayitlar.forEach(function (c) { HEPSI.push(c); });
        yuklu[y] = true; delete yukleniyor[y];
        delete yuklemeHatalari[y];
        coz();
      };
      s.onerror = function () { yuklemeHatalari[y] = true; delete yukleniyor[y]; s.remove(); coz(); };
      document.head.appendChild(s);
    });
    return yukleniyor[y];
  }

  function yillar() {
    return DIZIN.yillar.map(function (x) { return String(x.y); })
      .sort(function (a, b) { return b < a ? -1 : b > a ? 1 : 0; });   // yeniden eskiye
  }

  function hepsiniYukle() {
    var sira = yillar();
    (function sonraki() {
      var y = sira.shift();
      if (!y) { durumuYaz(); return; }
      yilYukle(y).then(function () { suz(true); sonraki(); });
    })();
  }

  function yuklenenSayi() {
    return Object.keys(yuklu).length;
  }

  /* ---- filtre seçeneklerini dizinden üret ---- */
  function secenekleriKur() {
    var bs = DIZIN.bolumler.slice().sort(function (a, b) { return b.n - a.n; });
    $('bolum').innerHTML = '<option value="">Tüm bölümler</option>' +
      bs.map(function (b) {
        return '<option value="' + kacar(b.b || '__diger') + '">' + kacar(b.b || 'Diğer / kaynak bölümü doğrulanmadı') + ' (' + say(b.n) + ')</option>';
      }).join('');
    var ys = DIZIN.yillar.slice().sort(function (a, b) { return String(a.y) < String(b.y) ? -1 : 1; });
    $('yil').innerHTML = '<option value="">Tüm yıllar</option>' +
      ys.map(function (y) {
        return '<option value="' + kacar(String(y.y)) + '">' + kacar(String(y.y)) + ' (' + say(y.n) + ')</option>';
      }).join('');
  }

  /* ---- bir cümle satırı ---- */
  function satir(c, i, acik) {
    var alt = [];
    if (c.s) alt.push(kacar(c.s));
    if (c.b) alt.push(kacar(c.b) + (c.n ? ' · ' + c.n + '. soru' : ''));
    else alt.push('Diğer / kaynak bölümü doğrulanmadı');
    if (c.s === '2026 İlkbahar YDS') alt.push('Yeniden oluşturulmuş / resmî olmayan kaynak');
    if (c.inceleme) alt.push('Kaynak incelemesi: ' + kacar(c.inceleme));
    return '' +
      '<article class="cum' + (acik ? ' acik' : '') + '" data-i="' + i + '" data-sid="' + kimlik(c) + '" role="button" tabindex="0" aria-expanded="' + !!acik + '" aria-label="' + (acik ? 'Çeviri açık: ' : 'Çeviriyi göster: ') + kacar(c.e) + '">' +
        '<div class="cum-en" lang="en">' + kacar(c.e) + '</div>' +
        '<div class="cum-alt">' + alt.join(' · ') + '</div>' +
        '<div class="cum-tr"' + (acik ? '' : ' hidden') + '>' +
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
    if (c && typeof c.sid === 'string' && /^c:[a-z0-9]+-[a-z0-9]+$/.test(c.sid)) return c.sid;
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
    else p.push('Diğer / kaynak bölümü doğrulanmadı');
    if (c.s === '2026 İlkbahar YDS') p.push('Yeniden oluşturulmuş / resmî olmayan kaynak');
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
    $('kart').setAttribute('aria-label', kartAcik ? 'Cümlenin çevirisi açık' : 'Cümlenin çevirisini göster');
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

  function kartCevir(e) {
    if (e && e.target && e.target !== $('kart') &&
        e.target.closest('button, a, input, select, textarea, [contenteditable="true"]')) return;
    if (kartAcik || window.YDS.metinSecildi($('kart'))) return;
    kartAcik = true;
    kartCiz();
  }
  function kartGit(adim) { kartIndex += adim; kartAcik = false; kartCiz(); }

  function listeCiz() {
    var el = $('liste');
    // Yeni yıl verisi veya "daha fazla" mevcut çeviriyi ve odağı kaybettirmesin.
    var aciklar = new Set(Array.from(el.querySelectorAll('.cum.acik')).map(function (n) { return n.getAttribute('data-sid'); }));
    var odak = document.activeElement;
    var odakKimligi = odak && el.contains(odak) ? odak.getAttribute('data-sid') : null;
    if (!suzulmus.length) {
      el.innerHTML = '';
      $('bos').hidden = false;
      $('dahaFazla').hidden = true;
      return;
    }
    $('bos').hidden = true;
    var dilim = suzulmus.slice(0, gosterilen);
    el.innerHTML = dilim.map(function (c) { return satir(c, HEPSI.indexOf(c), aciklar.has(kimlik(c))); }).join('');
    if (odakKimligi) {
      var yeniOdak = Array.from(el.querySelectorAll('.cum')).find(function (n) { return n.getAttribute('data-sid') === odakKimligi; });
      if (yeniOdak) yeniOdak.focus({preventScroll:true});
    }
    var kalan = suzulmus.length - dilim.length;
    $('dahaFazla').hidden = kalan <= 0;
    if (kalan > 0) $('dahaFazla').textContent = 'Daha fazla göster (' + say(kalan) + ' cümle daha)';
  }

  function durumuYaz() {
    var toplamYil = DIZIN.yillar.length;
    var yuklenen = yuklenenSayi();
    var eksik = suzulmus.length - suzulmus.filter(function (c) { return c.t; }).length;
    var metin = say(suzulmus.length) + ' cümle' +
      (eksik ? ' · ' + say(eksik) + ' tanesinin çevirisi henüz yok' : '');
    var hatalar = Object.keys(yuklemeHatalari);
    if (yuklenen + hatalar.length < toplamYil) {
      metin += ' · yükleniyor (' + yuklenen + '/' + toplamYil + ' yıl)';
    }
    if (hatalar.length) metin += ' · ' + hatalar.join(', ') + ' yüklenemedi; liste eksik.';
    $('yenidenYukle').hidden = !hatalar.length;
    if (kartModu) metin += ' · kaynak incelemesindeki kayıtlar kart destesine alınmaz';
    $('sayac').textContent = metin;
  }

  function ciz() {
    var bos = !suzulmus.length;
    var bekliyor = yuklenenSayi() + Object.keys(yuklemeHatalari).length < DIZIN.yillar.length;
    $('kartAlan').hidden = !kartModu || bos;
    $('liste').hidden = kartModu;
    $('dahaFazla').hidden = kartModu || bos;
    if (bos) {
      $('bos').hidden = bekliyor;     // yıl henüz gelmediyse "eşleşen yok" deme
      $('liste').innerHTML = '';
      $('sayac').textContent = bekliyor ? 'Cümleler yükleniyor…' : 'Eşleşen cümle yok.';
      if (Object.keys(yuklemeHatalari).length) durumuYaz();
      return;
    }
    $('bos').hidden = true;
    if (kartModu) kartCiz(); else listeCiz();
    durumuYaz();
  }

  /* koru=true: bir yıl daha yüklendiğinde çağrılır; kart konumu ve "daha
     fazla" sayısı korunur, yalnız liste tazelenir. */
  function suz(koru) {
    var onceki = koru && kartModu ? suzulmus[kartIndex] : null;
    var q = ($('ara').value || '').trim().toLowerCase();
    var b = $('bolum').value;
    var y = $('yil').value;
    suzulmus = HEPSI.filter(function (c) {
      if (kartModu && c.inceleme) return false;
      if (b === '__diger' ? !!c.b : b && c.b !== b) return false;
      if (y && String(c.y) !== y) return false;
      if (!q) return true;
      return c.e.toLowerCase().indexOf(q) >= 0 ||
             (c.t && c.t.toLowerCase().indexOf(q) >= 0);
    });
    if (!koru) {
      gosterilen = GOSTER;
      kartIndex = 0;
      kartAcik = false;
    }
    if (onceki) { var yeniIndex = suzulmus.indexOf(onceki); if (yeniIndex >= 0) kartIndex = yeniIndex; }
    ciz();
  }

  /* ---- olaylar ---- */
  document.addEventListener('DOMContentLoaded', function () {
    if (!DIZIN.yillar.length) {
      $('sayac').textContent = 'Cümle verisi yüklenemedi.';
      return;
    }
    secenekleriKur();
    $('yenidenYukle').addEventListener('click', function () { hepsiniYukle(); });

    var zaman;
    $('ara').addEventListener('input', function () {
      clearTimeout(zaman); zaman = setTimeout(function () { suz(); }, 180);
    });
    $('bolum').addEventListener('change', function () { suz(); });
    $('yil').addEventListener('change', function () {
      var y = $('yil').value;
      // Seçilen yıl henüz gelmediyse önce onu getir; kullanıcı beklemesin.
      if (y && !yuklu[y]) yilYukle(y).then(function () { suz(); });
      else suz();
    });
    $('temizle').addEventListener('click', function () {
      $('ara').value = ''; $('bolum').value = ''; $('yil').value = '';
      suz();
    });
    $('dahaFazla').addEventListener('click', function () {
      gosterilen += GOSTER; ciz();
    });

    // Cümleye bir kez tıklayınca çeviri açılır; tekrar tıklamak kapatmaz.
    function listeCevir(e) {
      var k = e.target.closest('.cum');
      if (!k) return;
      if (window.YDS.metinSecildi(k)) return;
      var tr = k.querySelector('.cum-tr');
      if (!tr.hidden) return;
      tr.hidden = false;
      k.classList.add('acik');
      k.setAttribute('aria-expanded', 'true');
      k.setAttribute('aria-label', 'Çeviri açık');
    }
    $('liste').addEventListener('click', listeCevir);
    $('liste').addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.repeat || e.isComposing) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); listeCevir(e); }
    });

    /* ---- kart modu olayları ---- */
    $('mod').addEventListener('click', function () {
      kartModu = !kartModu;
      kartAcik = false;
      $('mod').textContent = kartModu ? 'Liste moduna dön' : 'Kart moduna geç';
      suz();
      if (kartModu) $('kart').focus();
    });

    $('kart').addEventListener('click', kartCevir);
    $('kart').addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.repeat || e.isComposing) return;
      if (e.target === $('kart') && e.key === 'Enter') { e.preventDefault(); kartCevir(); }
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
      if (e.defaultPrevented || e.repeat || e.isComposing) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var h = document.activeElement;
      if (h && h.isContentEditable) return;
      if (h && /^(INPUT|SELECT|TEXTAREA)$/.test(h.tagName)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); kartGit(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); kartGit(-1); }
      else if (e.key === ' ') {
        if (h && /^(BUTTON|A)$/.test(h.tagName)) return;
        e.preventDefault(); kartCevir();
      }
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
    hepsiniYukle();
  });
})();
