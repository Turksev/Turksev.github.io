/* Süreli çalışma ve sabit 80 soruluk YDS formları. */
(function () {
  'use strict';

  var karistir = window.YDS.karistir;
  var kacar = window.YDS.kacar;
  var Il = window.YDS.Ilerleme;
  var SoruKonu = window.YDS.SoruKonu;
  var Oturum = window.YDS.DenemeOturum || {
    kaydet: function () { return false; },
    geriYukle: function () { return null; },
    temizle: function () { return false; },
    soruImzasi: function () { return ''; }
  };
  var HAVUZ = window.SORULAR || [];
  var PARCALAR = window.PARCALAR || {};
  var FORMLAR = window.DENEME_FORMLARI || [];
  var HARF = ['A', 'B', 'C', 'D', 'E'];
  var SANIYE_SORU = 135;
  var AGIRLIK = {
    'Kelime': 6, 'Dil Bilgisi': 4, 'Bağlaç': 4, 'Preposition': 2,
    'Cloze Test': 10, 'Cümle Tamamlama': 10, 'Çeviri': 6, 'Okuma': 20,
    'Diyalog': 5, 'Restatement': 4, 'Paragraf Tamamlama': 4, 'Anlamı Bozan Cümle': 5
  };

  var $ = function (id) { return document.getElementById(id); };
  var test = [], sira = 0, kalanSaniye = 0, sayacId = null, bitti = false;
  var aktifForm = '', aktifTur = 'karma', kritikDuyuruldu = false;
  var baslangicZamani = 0, bitisZamani = 0, bekleyenOturum = null;

  function soruMetni(s) { return s.metin || (s.pid ? PARCALAR[s.pid] : '') || ''; }

  function bolumAdi(i, toplam) {
    if (toplam !== 80) return test[i] ? test[i].kat : '';
    if (i < 6) return 'Kelime';
    if (i < 16) return 'Dil bilgisi ve yapılar';
    if (i < 26) return 'Cloze test';
    if (i < 36) return 'Cümle tamamlama';
    if (i < 42) return 'Çeviri';
    if (i < 62) return 'Okuma';
    if (i < 67) return 'Diyalog';
    if (i < 71) return 'Restatement';
    if (i < 75) return 'Paragraf tamamlama';
    return 'Anlamı bozan cümle';
  }

  function kategoriHavuzu() {
    var h = {};
    HAVUZ.forEach(function (s) { (h[s.kat] = h[s.kat] || []).push(s); });
    return h;
  }

  function dagilimHesapla(hedef) {
    var havuz = kategoriHavuzu(), plan = {}, toplam = 0;
    Object.keys(AGIRLIK).forEach(function (k) {
      if (!havuz[k]) return;
      plan[k] = Math.min(havuz[k].length, Math.floor(hedef * AGIRLIK[k] / 80));
      toplam += plan[k];
    });
    var kalan = hedef - toplam;
    var oncelik = Object.keys(AGIRLIK).sort(function (a, b) { return AGIRLIK[b] - AGIRLIK[a]; });
    while (kalan > 0) {
      var eklendi = false;
      oncelik.some(function (k) {
        if (havuz[k] && plan[k] < havuz[k].length) {
          plan[k]++; kalan--; eklendi = true; return true;
        }
        return false;
      });
      if (!eklendi) break;
      oncelik.push(oncelik.shift());
    }
    return plan;
  }

  function formuBul(id) {
    return FORMLAR.filter(function (f) { return f.id === id; })[0] || null;
  }

  function siradakiForm() {
    var biten = Object.create(null);
    Il.gecmis().forEach(function (g) { if (g.m === 'deneme' && g.f) biten[g.f] = true; });
    return (FORMLAR.filter(function (f) { return !biten[f.id]; })[0] || FORMLAR[0] || {}).id || '';
  }

  function formlariDoldur() {
    $('form').innerHTML = FORMLAR.map(function (f) {
      return '<option value="' + kacar(f.id) + '">' + kacar(f.ad) + ' · 80 soru</option>';
    }).join('');
    $('form').value = siradakiForm();
  }

  function dagilimBilgisi() {
    var hedef = parseInt($('adet').value, 10), tam = hedef === 80;
    $('formSatir').hidden = !tam;
    if (tam) {
      $('dagilimBilgi').innerHTML = '<b>80 soru · 180 dakika · sabit Form ' + kacar($('form').value) + '</b><br>' +
        '<span class="muted">Kelime 6 · Dil bilgisi ve yapılar 10 · Cloze 10 · Cümle tamamlama 10 · ' +
        'Çeviri 6 · Okuma 20 · Diyalog 5 · Restatement 4 · Paragraf tamamlama 4 · Anlamı bozan 5</span>';
      $('basla').textContent = 'Tam denemeyi başlat';
      return;
    }
    var plan = dagilimHesapla(hedef);
    var parcalar = Object.keys(plan).filter(function (k) { return plan[k] > 0; })
      .map(function (k) { return k + ' ' + plan[k]; });
    $('dagilimBilgi').innerHTML = '<b>' + hedef + ' soru · ' + Math.round(hedef * SANIYE_SORU / 60) +
      ' dakika · karma süreli çalışma</b><br><span class="muted">' + parcalar.join(' · ') + '</span><br>' +
      '<span class="small muted">Sorular her turda değişir; bu seçenek karşılaştırmalı tam deneme değildir.</span>';
    $('basla').textContent = 'Karma çalışmayı başlat';
  }

  function hamSoruyuHazirla(s, secenekKaristir, sikKaydirma) {
    var esli = s.se.map(function (m, i) { return { m: m, d: i === s.d, ham: i }; });
    if (secenekKaristir) esli = karistir(esli);
    else if (Number.isInteger(sikKaydirma) && sikKaydirma > 0) {
      esli = esli.slice(sikKaydirma).concat(esli.slice(0, sikKaydirma));
    }
    return {
      id: s.id, kat: s.kat, konu: s.konu, kaynak: s.kaynak,
      metin: soruMetni(s), soru: s.s, ac: s.ac,
      secenekler: esli.map(function (x) { return x.m; }),
      hamDizinler: esli.map(function (x) { return x.ham; }),
      oturumImzasi: Oturum.soruImzasi(s),
      dogruIndex: esli.findIndex(function (x) { return x.d; }),
      cevap: null, isaret: false
    };
  }

  function sabitFormHazirla() {
    var form = formuBul($('form').value);
    if (!form) throw new Error('Seçilen sabit form bulunamadı.');
    var harita = Object.create(null);
    HAVUZ.forEach(function (s) { harita[s.id] = s; });
    var eksik = form.sorular.filter(function (id) { return !harita[id]; });
    if (eksik.length) throw new Error('Formdaki ' + eksik.length + ' soru bankada bulunamadı.');
    aktifForm = form.id; aktifTur = 'tam';
    if (!Array.isArray(form.sikKaydirma) || form.sikKaydirma.length !== form.sorular.length) {
      throw new Error('Formun şık yerleşimi eksik veya geçersiz.');
    }
    return form.sorular.map(function (id, i) {
      return hamSoruyuHazirla(harita[id], false, form.sikKaydirma[i]);
    });
  }

  function karmaHazirla(hedef) {
    var plan = dagilimHesapla(hedef), havuz = kategoriHavuzu(), secilen = [];
    Object.keys(plan).forEach(function (k) {
      secilen = secilen.concat(karistir(havuz[k]).slice(0, plan[k]));
    });
    aktifForm = ''; aktifTur = 'karma';
    return karistir(secilen).map(function (s) { return hamSoruyuHazirla(s, true); });
  }

  function testHazirla() {
    var hedef = parseInt($('adet').value, 10);
    test = hedef === 80 ? sabitFormHazirla() : karmaHazirla(hedef);
    sira = 0; bitti = false; kritikDuyuruldu = false;
    kalanSaniye = hedef === 80 ? 180 * 60 : test.length * SANIYE_SORU;
    baslangicZamani = Date.now();
    bitisZamani = baslangicZamani + kalanSaniye * 1000;
  }

  function oturumKaydet() {
    if (!test.length || bitti) return false;
    return Oturum.kaydet(test, {
      sira: sira,
      tur: aktifTur,
      form: aktifForm,
      baslangic: baslangicZamani,
      bitis: bitisZamani
    });
  }

  function oturumKartiniCiz() {
    bekleyenOturum = Oturum.geriYukle(HAVUZ, PARCALAR, FORMLAR);
    $('oturumKarti').hidden = !bekleyenOturum;
    $('kurulumSecenekleri').hidden = !!bekleyenOturum;
    if (!bekleyenOturum) return;
    var cevapli = bekleyenOturum.test.filter(function (s) { return s.cevap !== null; }).length;
    var isaretli = bekleyenOturum.test.filter(function (s) { return s.isaret; }).length;
    var tur = bekleyenOturum.aktifForm ? 'Form ' + bekleyenOturum.aktifForm :
      bekleyenOturum.test.length + ' soruluk karma çalışma';
    var sure = bekleyenOturum.kalanSaniye > 0
      ? Math.ceil(bekleyenOturum.kalanSaniye / 60) + ' dakika kaldı'
      : 'süresi doldu; devam edildiğinde otomatik teslim edilecek';
    $('oturumOzeti').textContent = tur + ' · ' + cevapli + '/' + bekleyenOturum.test.length +
      ' soru cevaplandı' + (isaretli ? ' · ' + isaretli + ' soru işaretli' : '') + ' · ' + sure + '.';
  }

  function oturumaDevamEt() {
    if (!bekleyenOturum) return;
    test = bekleyenOturum.test;
    sira = bekleyenOturum.sira;
    aktifForm = bekleyenOturum.aktifForm;
    aktifTur = bekleyenOturum.aktifTur;
    baslangicZamani = bekleyenOturum.baslangic;
    bitisZamani = bekleyenOturum.bitis;
    kalanSaniye = bekleyenOturum.kalanSaniye;
    bitti = false; kritikDuyuruldu = false;
    $('adet').value = String(test.length);
    if (aktifForm) $('form').value = aktifForm;
    $('kurulum').hidden = true; $('sonuc').hidden = true; $('sinav').hidden = false;
    soruyuGoster();
    $('qText').focus();
    $('sureUyari').textContent = 'Yarım kalan çalışma kaldığın yerden geri yüklendi.';
    bekleyenOturum = null;
    if (kalanSaniye <= 0) sonucuGoster(true);
    else sayacBaslat();
  }

  function oturumuBirak() {
    sayacDurdur();
    Oturum.temizle();
    test = []; sira = 0; bitti = true; aktifForm = ''; aktifTur = 'karma';
    baslangicZamani = 0; bitisZamani = 0; bekleyenOturum = null;
    $('sinav').hidden = true; $('sonuc').hidden = true; $('kurulum').hidden = false;
    $('oturumKarti').hidden = true; $('kurulumSecenekleri').hidden = false;
    $('birak').removeAttribute('data-onay');
    $('birak').textContent = 'Kaydetmeden bırak';
    $('sureUyari').textContent = 'Yarım kalan oturum bırakıldı; tamamlanmış ilerlemen değişmedi.';
    formlariDoldur(); dagilimBilgisi(); gecmisiCiz();
    $('basla').focus();
    window.scrollTo({ top: 0, behavior: window.YDS.hareket() });
  }

  function sureYaz() {
    var dk = Math.floor(kalanSaniye / 60), sn = kalanSaniye % 60, el = $('sure');
    el.textContent = (dk < 10 ? '0' : '') + dk + ':' + (sn < 10 ? '0' : '') + sn;
    el.classList.toggle('kritik', kalanSaniye <= 300);
    if (!kritikDuyuruldu && kalanSaniye > 0 && kalanSaniye <= 300) {
      kritikDuyuruldu = true;
      $('sureUyari').textContent = 'Sınavın bitmesine 5 dakika kaldı.';
    }
  }

  function sayacBaslat() {
    sayacDurdur();
    kalanSaniye = Math.max(0, Math.ceil((bitisZamani - Date.now()) / 1000));
    sureYaz();
    if (kalanSaniye <= 0) {
      $('sureUyari').textContent = 'Süre doldu; çalışma otomatik teslim edildi.';
      sonucuGoster(true);
      return;
    }
    sayacId = setInterval(function () {
      kalanSaniye = Math.max(0, Math.ceil((bitisZamani - Date.now()) / 1000));
      sureYaz();
      if (kalanSaniye <= 0) {
        sayacDurdur();
        $('sureUyari').textContent = 'Süre doldu; çalışma otomatik teslim edildi.';
        sonucuGoster(true);
      }
    }, 1000);
  }

  function sayacDurdur() { if (sayacId) { clearInterval(sayacId); sayacId = null; } }
  function bosluklu(metin) { return kacar(metin).replace(/----/g, '<span class="blank">----</span>'); }

  function ilerlemeGuncelle() {
    var p = $('qBar').parentNode, yuzde = Math.round((sira + 1) / test.length * 100);
    $('qBar').style.width = yuzde + '%';
    p.setAttribute('aria-valuenow', String(sira + 1));
    p.setAttribute('aria-valuemax', String(test.length));
    p.setAttribute('aria-valuetext', (sira + 1) + ' / ' + test.length + ' soru');
  }

  function soruyuGoster() {
    var s = test[sira];
    $('qKat').textContent = bolumAdi(sira, test.length) + (aktifForm ? ' · Form ' + aktifForm : '');
    $('qSayac').textContent = (sira + 1) + ' / ' + test.length;
    ilerlemeGuncelle();
    if (s.metin) {
      $('qMetin').innerHTML = bosluklu(s.metin);
      $('qMetin').setAttribute('lang', 'en');
      $('qMetin').hidden = false;
    } else $('qMetin').hidden = true;
    $('qText').innerHTML = bosluklu(s.soru);
    $('qText').setAttribute('lang', 'en');
    $('qSecenekler').innerHTML = s.secenekler.map(function (se, i) {
      return '<button class="opt' + (s.cevap === i ? ' secili' : '') + '" type="button" data-i="' + i +
        '" aria-pressed="' + (s.cevap === i ? 'true' : 'false') + '"><span class="key">' + HARF[i] +
        '</span><span lang="en">' + kacar(se) + '</span></button>';
    }).join('');
    $('isaretle').textContent = s.isaret ? '⚑ İşareti kaldır' : '⚑ İşaretle';
    $('isaretle').classList.toggle('ghost', !s.isaret);
    $('isaretle').setAttribute('aria-pressed', s.isaret ? 'true' : 'false');
    $('geri').disabled = sira === 0;
    $('ileri').textContent = sira === test.length - 1 ? 'Son soru' : 'Sonraki ›';
    $('ileri').disabled = sira === test.length - 1;
    izgaraCiz();
  }

  function izgaraCiz() {
    $('izgara').innerHTML = test.map(function (s, i) {
      var durum = s.isaret ? 'işaretli' : (s.cevap !== null ? 'cevaplandı' : 'boş');
      var sinif = 'ig' + (i === sira ? ' aktif' : '') + (s.isaret ? ' isaretli' : (s.cevap !== null ? ' cevapli' : ''));
      return '<button type="button" class="' + sinif + '" data-i="' + i + '" aria-label="Soru ' + (i + 1) +
        ', ' + durum + '"' + (i === sira ? ' aria-current="step"' : '') + '>' + (i + 1) + '</button>';
    }).join('');
  }

  function git(i) {
    if (i < 0 || i >= test.length) return;
    sira = i; oturumKaydet(); soruyuGoster();
    $('qText').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: window.YDS.hareket() });
  }
  function cevapla(i) { test[sira].cevap = i; oturumKaydet(); soruyuGoster(); }
  function ydsPuani(dogru, toplam) { return toplam ? Math.round(dogru / toplam * 10000) / 100 : 0; }

  function celdiriciNotu(s) {
    if (s.cevap === null || s.cevap === s.dogruIndex) return '';
    var notlar = {
      'Okuma': 'Seçtiğin çeldirici metinde doğrudan kanıt bulmuyor ya da ayrıntının kapsamını değiştiriyor. Açıklamadaki kanıtı pasajda yeniden işaretle.',
      'Çeviri': 'Seçtiğin çeldiricide özne, zaman, kip veya bağlaç ilişkilerinden en az biri korunmuyor. Doğru seçeneği bu dört unsur üzerinden karşılaştır.',
      'Cloze Test': 'Boşluğun iki yanındaki dil bilgisi kadar paragrafın mantıksal akışını da kontrol et.',
      'Cümle Tamamlama': 'İki yarının özne, zaman, gönderim ve mantıksal bağını birlikte sınamadan yalnız kelime benzerliğine güvenme.'
    };
    return notlar[s.kat] || 'Seçtiğin çeldiriciyi doğru seçenekle anlam, yapı ve kapsam bakımından karşılaştır.';
  }

  function sonucuGoster(sureDoldu) {
    if (bitti) return;
    bitti = true; sayacDurdur();
    Oturum.temizle();
    var dogru = 0, yanlis = 0, bos = 0, katOzet = {};
    test.forEach(function (s) {
      if (!katOzet[s.kat]) katOzet[s.kat] = { d: 0, y: 0, b: 0, n: 0 };
      katOzet[s.kat].n++;
      if (s.cevap === null) { bos++; katOzet[s.kat].b++; }
      else if (s.cevap === s.dogruIndex) {
        dogru++; katOzet[s.kat].d++;
        Il.kategoriKaydet(s.kat, true, s.id);
        Il.yanlisCoz({ kat: s.kat, soru: s.soru });
      } else {
        yanlis++; katOzet[s.kat].y++;
        Il.kategoriKaydet(s.kat, false, s.id);
        Il.yanlisEkle({ kat: s.kat, soru: s.soru });
      }
    });
    var puan = ydsPuani(dogru, test.length);
    var puanYazisi = puan.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
    $('sinav').hidden = true; $('sonuc').hidden = false;
    $('sBaslik').textContent = sureDoldu ? 'Süre doldu — sonucun' : (aktifTur === 'tam' ? 'Tam deneme sonucun' : 'Karma çalışma sonucun');
    $('sPuan').textContent = puanYazisi;
    $('sOzet').textContent = (aktifForm ? 'Form ' + aktifForm + ' · ' : '') + test.length + ' soruda ' + dogru +
      ' doğru, ' + yanlis + ' yanlış, ' + bos + ' boş · puan ' + puanYazisi + '/100 · kalan süre ' +
      Math.floor(kalanSaniye / 60) + ' dk';
    Il.sonucEkle({ dogru: dogru, toplam: test.length, yuzde: puan, mod: 'deneme', form: aktifForm, tur: aktifTur });

    $('sKarne').innerHTML = Object.keys(katOzet).map(function (k) {
      var o = katOzet[k], p = o.n ? Math.round(o.d / o.n * 100) : 0;
      var renk = p >= 75 ? 'var(--ok)' : (p >= 50 ? 'var(--warn)' : 'var(--err)');
      return '<div class="karne-satir"><span class="karne-ad">' + kacar(k) + '</span>' +
        '<span class="karne-cubuk"><i style="width:' + p + '%;background:' + renk + '"></i></span>' +
        '<span class="karne-sayi">' + o.d + '/' + o.n + (o.b ? ' <span class="muted">(' + o.b + ' boş)</span>' : '') + '</span></div>';
    }).join('');

    $('sInceleme').innerHTML = test.map(function (s, i) {
      var durum = s.cevap === null ? '<span class="badge warn">boş</span>' :
        (s.cevap === s.dogruIndex ? '<span class="badge ok">doğru</span>' : '<span class="badge err">yanlış</span>');
      var konu = s.konu ? '<a class="btn ghost sm" href="konular.html#' + encodeURIComponent(s.konu) + '">' +
        kacar(s.konu) + ' konusunu çalış</a>' : '';
      return '<div class="review-item"><span class="badge">' + (i + 1) + '</span> <span class="badge">' +
        kacar(s.kat) + '</span> ' + durum + '<p class="q" lang="en" style="margin:8px 0 6px">' +
        bosluklu(s.soru) + '</p>' +
        (s.cevap !== null && s.cevap !== s.dogruIndex ? '<p style="margin:0 0 4px"><span class="badge err">senin</span> <span lang="en">' + kacar(s.secenekler[s.cevap]) + '</span></p>' : '') +
        '<p style="margin:0 0 8px"><span class="badge ok">doğru</span> <span lang="en">' + kacar(s.secenekler[s.dogruIndex]) + '</span></p>' +
        '<p class="muted" style="margin:0 0 8px">' + s.ac + '</p>' +
        (celdiriciNotu(s) ? '<p class="small muted" style="margin:0 0 8px"><b>Çeldirici notu:</b> ' + kacar(celdiriciNotu(s)) + '</p>' : '') +
        '<div class="review-actions">' + konu + '<span class="badge">' + kacar(SoruKonu.kaynakEtiketi(s)) + '</span></div></div>';
    }).join('');
    gecmisiCiz();
    window.scrollTo({ top: 0, behavior: window.YDS.hareket() });
  }

  function gecmisiCiz() {
    var kayitlar = Il.gecmis().filter(function (g) { return g.m === 'deneme'; }).slice(-10).reverse();
    if (!kayitlar.length) { $('gecmisAlan').innerHTML = ''; return; }
    $('gecmisAlan').innerHTML = '<h2>Son çalışmaların</h2><div class="card">' + kayitlar.map(function (g) {
      var t = new Date(g.t), puan = g.n ? ydsPuani(g.d, g.n) : (Number(g.y) || 0);
      var tarih = t.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' +
        t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      var renk = puan >= 75 ? 'var(--ok)' : (puan >= 50 ? 'var(--warn)' : 'var(--err)');
      var tur = g.f ? 'Form ' + g.f : (g.a === 'karma' ? 'karma' : g.n + ' soru');
      return '<div class="karne-satir"><span class="karne-ad small muted">' + tarih + ' · ' + kacar(tur) + '</span>' +
        '<span class="karne-cubuk"><i style="width:' + puan + '%;background:' + renk + '"></i></span>' +
        '<span class="karne-sayi">' + puan.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) +
        ' puan <span class="muted">(' + g.d + '/' + g.n + ')</span></span></div>';
    }).join('') + '</div>';
  }

  $('adet').addEventListener('change', dagilimBilgisi);
  $('form').addEventListener('change', dagilimBilgisi);
  $('basla').addEventListener('click', function () {
    try { testHazirla(); } catch (e) { alert(e.message); return; }
    if (!test.length) { alert('Soru havuzu boş.'); return; }
    Oturum.temizle();
    $('kurulum').hidden = true; $('sonuc').hidden = true; $('sinav').hidden = false;
    soruyuGoster(); $('qText').focus(); oturumKaydet(); sayacBaslat();
  });
  $('oturumDevam').addEventListener('click', oturumaDevamEt);
  $('oturumVazgec').addEventListener('click', function () {
    if (!window.confirm('Bu yarım kalan oturum bırakılsın mı? Kaydedilmiş cevaplar silinir; tamamlanmış ilerlemen etkilenmez.')) return;
    Oturum.temizle(); bekleyenOturum = null;
    $('oturumKarti').hidden = true; $('kurulumSecenekleri').hidden = false;
    $('basla').focus();
  });
  $('qSecenekler').addEventListener('click', function (e) {
    var b = e.target.closest('.opt'); if (b) cevapla(parseInt(b.getAttribute('data-i'), 10));
  });
  $('izgara').addEventListener('click', function (e) {
    var b = e.target.closest('.ig'); if (b) git(parseInt(b.getAttribute('data-i'), 10));
  });
  $('geri').addEventListener('click', function () { git(sira - 1); });
  $('ileri').addEventListener('click', function () { git(sira + 1); });
  $('isaretle').addEventListener('click', function () {
    test[sira].isaret = !test[sira].isaret; oturumKaydet(); soruyuGoster();
  });
  $('bitir').addEventListener('click', function () {
    var bosSayi = test.filter(function (s) { return s.cevap === null; }).length;
    var isaretli = test.filter(function (s) { return s.isaret; }).length;
    var uyari = 'Çalışmayı bitirmek istediğine emin misin?';
    if (bosSayi) uyari += '\n\n' + bosSayi + ' soru boş.';
    if (isaretli) uyari += '\n' + isaretli + ' soru işaretli.';
    if (confirm(uyari)) sonucuGoster(false);
  });
  $('birak').addEventListener('click', function () {
    if (this.getAttribute('data-onay') !== 'true') {
      this.setAttribute('data-onay', 'true');
      this.textContent = 'Oturumu bırakmayı onayla';
      $('sureUyari').textContent = 'Tamamlanmamış cevaplar silinecek; bırakmak için düğmeye yeniden bas.';
      return;
    }
    oturumuBirak();
  });
  $('tekrar').addEventListener('click', function () {
    $('sonuc').hidden = true; $('kurulum').hidden = false;
    formlariDoldur(); dagilimBilgisi(); gecmisiCiz(); oturumKartiniCiz();
    window.scrollTo({ top: 0, behavior: window.YDS.hareket() });
  });
  document.addEventListener('keydown', function (e) {
    if ($('sinav').hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); git(sira + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); git(sira - 1); }
    else if (e.key === 'Escape') {
      e.preventDefault(); test[sira].cevap = null; oturumKaydet(); soruyuGoster();
    }
    else if (e.key.toLowerCase() === 'm') { e.preventDefault(); $('isaretle').click(); }
    else if (/^[1-5]$/.test(e.key)) {
      var i = parseInt(e.key, 10) - 1;
      if (i < test[sira].secenekler.length) { e.preventDefault(); cevapla(i); }
    }
  });
  window.addEventListener('beforeunload', function (e) {
    if (sayacId && !bitti) { e.preventDefault(); e.returnValue = ''; }
  });
  window.addEventListener('pagehide', oturumKaydet);

  formlariDoldur(); dagilimBilgisi(); gecmisiCiz(); oturumKartiniCiz();
})();
