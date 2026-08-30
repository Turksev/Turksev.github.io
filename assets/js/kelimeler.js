/* ============================================================
   Kelime sayfası — katman seçimi, aralıklı tekrar (Leitner),
   arama/filtre, kart modu, ipucu ve sesli okuma

   Dizin (7.910 kelime ve yapı) her zaman bellektedir; örnek cümleler yalnız
   seçili katmanlar için indirilir. Bu yüzden liste ve deste hep
   "seçili katmanlar" üzerinde çalışır.
   ============================================================ */

(function () {
  'use strict';

  var Depo = window.YDS.Depo;
  var sadelestir = window.YDS.sadelestir;
  var kacar = window.YDS.kacar;
  var yildiz = window.YDS.yildiz;
  var karistir = window.YDS.karistir;
  var Il = window.YDS.Ilerleme;
  var Veri = window.YDS.Veri;
  var ILERLEME_TURU = 'kelime';

  var KATMAN_ANAHTAR = 'yds-katmanlar';
  var SAYFA_BOYU = 20;                 // telefonda aşırı uzun sayfa oluşturmadan parça parça göster

  var DIZIN = Veri.dizin;
  var seciliKutu = null;          // kutu süzgeci: null | 0..5
  var secili = Depo.oku(KATMAN_ANAHTAR, [2]);
  if (!Array.isArray(secili) || !secili.length) secili = [2];
  // Aile üyeleri 6'dan 7'ye taşındı (Geniş+ araya girdi); eski seçimi bir kez taşı.
  if (!Depo.oku('yds-katman7', false)) {
    if (secili.indexOf(6) !== -1) { secili = secili.filter(function (k) { return k !== 6; }).concat([7]); Depo.yaz(KATMAN_ANAHTAR, secili); }
    Depo.yaz('yds-katman7', true);
  }

  var havuz = [];          // seçili katmanlardaki kelimeler (dizin kaydı)
  var suzulmus = [];
  var gosterilen = SAYFA_BOYU;
  var kartIndex = 0;
  var kartAcik = false;
  var kartModu = false;
  var desteModu = false;
  var ipucuAcik = false;

  var $ = function (id) { return document.getElementById(id); };
  var elAra = $('ara'), elTip = $('tip'), elDurum = $('durum');
  var elListe = $('liste'), elSayac = $('sayac'), elBos = $('bos');
  var elKartAlan = $('kartAlan'), elKart = $('kart');

  var KUTU_ADI = ['hiç çalışılmadı', '1. kutu', '2. kutu', '3. kutu', '4. kutu', '5. kutu (öğrenildi)'];

  /* Olumsuz karşılık: sufficient → insufficient. Veri data/olumsuzlar.js'de. */
  function olumsuzSatiri(en) {
    var liste = (window.OLUMSUZLAR || {})[en];
    if (!liste || !liste.length) return '';
    return '<div class="olumsuz">⊘ Olumsuzu: ' + liste.map(function (o) {
      return '<b lang="en">' + kacar(o.f) + '</b> — ' + kacar(o.tr);
    }).join(' · ') + '</div>';
  }

  /* ---------- katman seçici ---------- */

  function katmanlariCiz() {
    var sayilar = Veri.katmanSayilari();
    // Henüz içeriği olmayan katmanı seçim arayüzünde göstermeyelim. Kayıtlı
    // seçime dokunulmaz; katman ileride dolduğunda yeniden görünür olur.
    $('katmanlar').innerHTML = Veri.KATMANLAR.filter(function (k) {
      return sayilar[k] > 0;
    }).map(function (k) {
      var acik = secili.indexOf(k) !== -1;
      return '<button type="button" class="katman' + (acik ? ' acik' : '') + '" data-k="' + k + '"' +
        ' title="' + kacar(Veri.KATMAN_ACIKLAMA[k]) + '" aria-pressed="' + (acik ? 'true' : 'false') + '">' +
          '<b>' + Veri.KATMAN_ADI[k] + '</b>' +
          '<i>' + sayilar[k] + ' kelime</i>' +
          '<span class="onay">' + (acik ? '✓' : '+') + '</span>' +
        '</button>';
    }).join('');

    var toplam = secili.reduce(function (t, k) { return t + sayilar[k]; }, 0);
    $('katmanBilgi').textContent = secili.length
      ? toplam + ' kelime seçili'
      : 'Hiç katman seçili değil';
  }

  function katmanlariUygula() {
    Depo.yaz(KATMAN_ANAHTAR, secili);
    katmanlariCiz();
    elSayac.textContent = 'Katmanlar yükleniyor…';

    return Veri.katmanlariYukle(secili).then(function () {
      havuz = DIZIN.filter(function (d) { return secili.indexOf(d.k) !== -1; });
      desteyiCiz();
      filtrele();
    }).catch(function (e) {
      elSayac.textContent = 'Katman yüklenemedi: ' + e.message;
    });
  }

  /* ---------- bugünün destesi ---------- */

  function desteyiCiz() {
    var o = Il.leitnerOzet(havuz.map(function (d) { return { en: d.e }; }), ILERLEME_TURU);

    $('desteBilgi').textContent = havuz.length
      ? o.calisilan + '/' + havuz.length + ' kelimeye başlandı · ' + o.ogrenilen + ' öğrenildi'
      : 'Önce bir katman seç';

    // Çubuk genel ilerlemeyi gösterir: öğrenilen / seçili havuz
    $('desteBar').style.width = (havuz.length ? o.ogrenilen / havuz.length * 100 : 0) + '%';
    var ilerleme = $('desteIlerleme');
    ilerleme.setAttribute('aria-valuemax', String(Math.max(1, havuz.length)));
    ilerleme.setAttribute('aria-valuenow', String(o.ogrenilen));
    ilerleme.setAttribute('aria-valuetext', havuz.length
      ? o.ogrenilen + ' / ' + havuz.length + ' kelime öğrenildi'
      : 'Henüz bir katman seçilmedi');

    // Kutular tıklanabilir: bir kutuya basınca liste yalnız o kutuyu gösterir.
    $('kutular').innerHTML = [0, 1, 2, 3, 4, 5].map(function (k) {
      var ad = k === 0 ? 'yeni' : (k === 5 ? 'öğrenildi' : k + '. kutu');
      return '<button type="button" class="kutu' + (seciliKutu === k ? ' acik' : '') +
        '" data-k="' + k + '" title="' + (k === 0 ? 'Hiç çalışılmamış kelimeler'
          : (k === 5 ? 'Öğrenilmiş: çalışma destesine yeniden gelmez' : k + '. kutudaki kelimeler')) +
        ' — göstermek için tıkla" aria-pressed="' + (seciliKutu === k ? 'true' : 'false') +
        '" aria-label="' + ad + ', ' + o['k' + k] + ' kelime">' +
        '<b>' + o['k' + k] + '</b><i>' + ad + '</i></button>';
    }).join('');

    $('bekleyenNot').hidden = !o.bekleyen;
    if (o.bekleyen) {
      $('bekleyenNot').innerHTML = '<b>' + o.bekleyen + '</b> tekrar bugünkü sınıra sığmadı, ' +
        'sıradaki günlere kaldı. Daha hızlı eritmek istersen üstteki <b>toplam kart</b> sayısını artır.' +
        (o.bekleyen >= 40 ? ' <button class="btn ghost sm" type="button" id="yigiiniDagit">Birikmiş tekrarları günlere dağıt</button>' : '');
    }
    $('desteBasla').disabled = o.bugun === 0;
    testDugmesiGuncelle();
    $('desteBasla').textContent = o.bugun === 0
      ? (havuz.length ? 'Bugünlük bitti 🎉' : 'Katman seç')
      : 'Bugünü çalış (' + o.bugun + ' kart)';

    // Kota dolduysa ama havuzda yeni kelime kaldıysa devam edebilsin.
    var devam = $('devamEt');
    devam.hidden = !(o.bugun === 0 && o.yeni > 0);
    devam.textContent = 'Devam et (' + Math.min(o.yeni, o.hedef) + ' kelime daha aç)';

    // Destenin neyden oluştuğunu açıkça yaz: tekrar ≠ yeni
    var parcalar = [];
    if (o.gosterilecekTekrar) parcalar.push('<b>' + o.gosterilecekTekrar + '</b> tekrar');
    if (o.acilacakYeni) parcalar.push('<b>' + o.acilacakYeni + '</b> yeni kelime');

    var metin;
    if (!havuz.length) {
      metin = '';
    } else if (!o.bugun) {
      metin = o.yeni
        ? 'Bugünkü kota doldu (' + o.hedef + ' yeni kelime). Havuzda <b>' + o.yeni +
          '</b> kelime bekliyor — yarın açılır ya da <b>Devam et</b> ile bugün devam edersin.'
        : 'Seçili katmandaki bütün kelimelere başladın. Tekrarlar geldikçe burada görünecek.';
    } else {
      metin = 'Deste: ' + parcalar.join(' + ') + '.';
      if (o.yeni > o.acilacakYeni) {
        metin += ' Havuzda <b>' + o.yeni + '</b> yeni kelime var; günde ' + o.hedef +
          ' tanesi açılıyor, hepsi ' + Math.ceil(o.yeni / o.hedef) + ' günde biter.';
      }
    }
    $('desteAciklama').innerHTML = metin;
  }

  /* ---------- günün testi ---------- */

  var Test = window.YDS.KelimeTesti;

  function testDugmesiGuncelle() {
    var b = $('testBasla');
    if (!Test) { b.hidden = true; return; }
    var n = Test.bugunSayisi(havuz);
    b.hidden = n < Test.EN_AZ;
    b.textContent = 'Günün testi (' + Math.min(n, Test.EN_COK) + ' soru)';
  }

  function testiBaslat() {
    if (!Test) return;
    var b = $('testBasla');
    b.disabled = true;
    Test.baslat(havuz, secili, function () { listeyeDon(); }).then(function (r) {
      b.disabled = false;
      if (r.acildi) {
        kartModu = false; desteModu = false;
        elListe.hidden = true; elKartAlan.hidden = true; elBos.hidden = true;
        $('dahaFazla').hidden = true;
        $('testDavet').hidden = true;
      } else {
        $('desteAciklama').innerHTML = r.calisilan
          ? 'Bugün çalıştığın ' + r.calisilan + ' kelimeden yalnız ' + r.soru + ' tanesinin test cümlesi hazır; test için en az ' + Test.EN_AZ + ' gerekiyor.'
          : 'Bugün henüz kelime çalışmadın; önce desteyi bitir.';
      }
    }).catch(function () { b.disabled = false; });
  }

  function listeyeDon() {
    $('testDavet').hidden = true;
    filtrele();
    desteyiCiz();
    $('deste').scrollIntoView({ behavior: window.YDS.hareket(), block: 'start' });
  }

  /* ---------- filtreleme ---------- */

  function esles(d, q) {
    return sadelestir(d.e + ' ' + d.t + ' ' + d.y).indexOf(q) !== -1;
  }

  function filtrele(sirala) {
    var q = sadelestir(elAra.value.trim());
    var tp = elTip.value, dr = elDurum.value;

    suzulmus = havuz.filter(function (d) {
      if (tp && d.y.indexOf(tp) === -1) return false;
      var kutu = Il.kutu(d.e, ILERLEME_TURU);
      if (seciliKutu !== null && kutu !== seciliKutu) return false;
      if (dr === 'vadesi' && !Il.vadesiGeldiMi(d.e, ILERLEME_TURU)) return false;
      if (dr === 'yeni' && kutu !== 0) return false;
      if (dr === 'ogrenilen' && kutu < 5) return false;    // mezun olanlar
      if (dr === 'zayif' && !(kutu === 1 || kutu === 2)) return false;
      if (q && !esles(d, q)) return false;
      return true;
    });

    if (sirala) suzulmus = karistir(suzulmus);
    if (kartIndex >= suzulmus.length) kartIndex = 0;
    gosterilen = SAYFA_BOYU;
    ipucuAcik = false;
    disKatmanUyarisi(q);
    ciz();
  }

  /* Aranan kelime seçili olmayan bir katmandaysa kullanıcıya söyle. */
  function disKatmanUyarisi(q) {
    var kutu = $('disKatman');
    if (!q) { kutu.hidden = true; return; }

    var disarida = DIZIN.filter(function (d) {
      return secili.indexOf(d.k) === -1 && esles(d, q);
    });
    if (!disarida.length) { kutu.hidden = true; return; }

    var katmanlar = [];
    disarida.forEach(function (d) { if (katmanlar.indexOf(d.k) === -1) katmanlar.push(d.k); });
    katmanlar.sort();

    kutu.innerHTML = 'Seçili olmayan katmanlarda <b>' + disarida.length + '</b> eşleşme daha var (' +
      katmanlar.map(function (k) { return Veri.KATMAN_ADI[k]; }).join(', ') + '). ' +
      '<button class="btn ghost sm" type="button" id="disKatmanEkle" style="margin-left:6px">' +
      'O katmanları da aç</button>';
    kutu.hidden = false;

    $('disKatmanEkle').addEventListener('click', function () {
      katmanlar.forEach(function (k) { if (secili.indexOf(k) === -1) secili.push(k); });
      secili.sort();
      katmanlariUygula();
    });
  }

  /* ---------- liste ---------- */

  function kutuRozeti(en) {
    var k = Il.kutu(en, ILERLEME_TURU);
    if (k === 0) return '<span class="badge">yeni</span>';
    if (Il.mezunMu(en, ILERLEME_TURU)) return '<span class="badge ok" title="Öğrenildi — çalışma destesine yeniden gelmez">öğrenildi ✓</span>';
    var gun = Il.kalanGun(en, ILERLEME_TURU);
    var sinif = k >= 4 ? 'badge ok' : (k <= 2 ? 'badge warn' : 'badge');
    return '<span class="' + sinif + '">' + k + '. kutu · ' + (gun === 0 ? 'bugün' : gun + ' gün') + '</span>';
  }

  /* Kullanım kalıpları: kelimenin anlamı değil, nasıl kullanıldığı.
     "comply" için: comply with the rules — kurallara uymak.
     Örnek cümlelerin ÜSTÜNDE, ortalanmış bir şerit olarak durur ("üst"
     sınıfı); arama kartındaki başlıklı bölümde ise sola yaslı kalır. */
  function kaliplar(tam) {
    if (!tam || !tam.kl || !tam.kl.length) return '';
    return '<div class="kalip ust">' + tam.kl.map(function (k) {
      return '<span><b lang="en">' + kacar(k.en) + '</b><i>' + kacar(k.tr) + '</i></span>';
    }).join('') + '</div>';
  }

  function testRozeti(en) {
    var n = Il.testYanlisSayisi(en, ILERLEME_TURU);
    return n ? '<span class="badge err" title="Günün testinde bilinemedi">testte ✗' + (n > 1 ? ' ×' + n : '') + '</span>' : '';
  }

  function satir(d) {
    var tam = Veri.kayit(d.e);
    var kutu = Il.kutu(d.e, ILERLEME_TURU);
    var anlamlar = tam
      ? tam.a.map(function (a) {
          return '<div class="ex"><b>' + kacar(a.tr) + '</b>' + yildiz(a) +
                 '<i lang="en">' + kacar(a.ex) + '</i>' +
                 '<i class="tr-ex">' + kacar(a.exTr) + '</i></div>';
        }).join('')
      : '<div class="ex"><i>' + kacar(d.t) + '</i></div>';

    // Tam kayıt yüklüyse anlamlar aşağıda kalın olarak zaten yazılıyor;
    // dizindeki kısa anlamı tekrar göstermeyelim.
    var kisaAnlam = tam ? '' : '<div class="tr">' + kacar(d.t) + '</div>';

    return '' +
      '<article class="word' + (kutu >= 5 ? ' known' : '') + '" data-en="' + kacar(d.e) + '">' +
        '<div>' +
          '<div class="en" lang="en">' + kacar(d.e) + '</div>' +
          kisaAnlam +
          '<div class="meta">' +
            '<span class="badge">' + kacar(d.y) + '</span>' +
            '<span class="badge accent">' + Veri.KATMAN_ADI[d.k] + '</span>' +
            (d.p !== undefined ? '<span class="badge" title="YDS öncelik puanı">' + d.p + ' p</span>' : '') +
            kutuRozeti(d.e) +
            testRozeti(d.e) +
            (tam && tam.es ? '<span class="badge" lang="en">≈ ' + kacar(tam.es) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="act">' +
          '<button class="btn ghost sm" type="button" data-ne="calis" aria-label="' + kacar(d.e) +
            ' kelimesini kartta çalış">Kartta çalış</button>' +
          '<button class="star" type="button" data-ne="ses" title="Telaffuzu dinle" aria-label="' +
            kacar(d.e) + ' kelimesinin telaffuzunu dinle">🔊</button>' +
        '</div>' +
        kaliplar(tam) +
        anlamlar +
        olumsuzSatiri(d.e) +
      '</article>';
  }

  function listeCiz() {
    elListe.innerHTML = suzulmus.slice(0, gosterilen).map(satir).join('');
    var kalan = suzulmus.length - gosterilen;
    var btn = $('dahaFazla');
    btn.hidden = kalan <= 0;
    btn.textContent = 'Daha fazla göster (' + Math.min(kalan, SAYFA_BOYU) + ' / ' + kalan + ' kaldı)';
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

  function bosluklaCumle(kelime, cumle) {
    var kacir = function (x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
    var kok = String(kelime).toLowerCase().replace(/(e|y)$/, '');
    if (kok.length < 3) kok = String(kelime).toLowerCase();

    /* Kök eşleşmesi düzenli türevleri yakalar (govern → governing). Düzensiz
       biçimler (woman → women, undertake → undertook) köke benzemediği için
       ipucu hiç boşluk açamıyordu; onları çekim motorundan alıp ekliyoruz. */
    var desenler = [kacir(kok) + '[a-z]*'];
    if (window.YDS.Cekim) {
      ['s', 'past', 'pp', 'ing', 'pl'].forEach(function (f) {
        var b = window.YDS.Cekim.cek(kelime, f);
        if (b && b.indexOf(kok) !== 0) desenler.push(kacir(b));
      });
    }

    var kalip = new RegExp('\\b(?:' + desenler.join('|') + ')\\b', 'gi');
    if (!kalip.test(cumle)) return null;
    kalip.lastIndex = 0;
    return cumle.replace(kalip, '----');
  }

  /* ---------- kart ---------- */

  function kartCiz() {
    var d = suzulmus[kartIndex];
    if (!d) return;
    var tam = Veri.kayit(d.e) || { a: [{ tr: d.t, ex: '', exTr: '' }] };

    $('kartOn').textContent = d.e;
    $('kartKutu').innerHTML = KUTU_ADI[Il.kutu(d.e, ILERLEME_TURU)] +
      (Il.mezunMu(d.e, ILERLEME_TURU) ? ' · öğrenildi, yeniden sorulmaz'
                       : (Il.vadesiGeldiMi(d.e, ILERLEME_TURU) ? ' · tekrar zamanı' : ''));

    $('kartTr').innerHTML = tam.a.map(function (a) {
      return kacar(a.tr) + yildiz(a);
    }).join('<br>') +
      '<div class="muted small" style="font-weight:400;margin-top:4px">' + kacar(d.y) + '</div>';
    $('kartOrnek').innerHTML = kaliplar(tam) +
      tam.a.filter(function (a) { return a.ex; }).map(function (a) {
        return '<span lang="en">' + kacar(a.ex) + '</span><br><span style="opacity:.8">' +
          kacar(a.exTr) + '</span>';
      }).join('<br><br>') + olumsuzSatiri(d.e);

    $('kartArka').hidden = !kartAcik;
    $('kartSayac').textContent = (kartIndex + 1) + ' / ' + suzulmus.length;
    $('seslendir').hidden = !sesDestegi;

    var bosluklu = tam.a[0].ex ? bosluklaCumle(d.e, tam.a[0].ex) : null;
    var sunulabilir = !kartAcik && bosluklu !== null;
    $('ipucuBtn').hidden = !sunulabilir || ipucuAcik;
    $('ipucuAlan').hidden = !(sunulabilir && ipucuAcik);
    if (sunulabilir && ipucuAcik) {
      $('ipucuAlan').innerHTML = kacar(bosluklu).replace(/----/g, '<span class="blank">----</span>');
    }

    $('kartIpucu').textContent = kartAcik
      ? (ipucuAcik ? 'İpucu kullandın — "Bildim" dersen kelime aynı kutuda kalır.'
                   : 'Bildin mi? Aşağıdan işaretle.')
      : 'Çevirmek için karta tıkla · istersen cevabı görmeden işaretle';

    // Kullanıcı cevabı zihninden verdiyse kartı çevirmek zorunda değildir.
    // Üç değerlendirme de kartın önü/arkası ve ipucu durumundan bağımsızdır.
    $('bildim').disabled = false;
    $('bilmedim').disabled = false;
    $('zatenBiliyorum').disabled = false;
    elKart.setAttribute('aria-expanded', kartAcik ? 'true' : 'false');
    elKart.setAttribute('aria-label', d.e + ' kelimesinin cevabını ' + (kartAcik ? 'gizle' : 'göster'));
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
    var d = suzulmus[kartIndex];
    if (!d) return;

    var sonuc;
    if (ne === 'zaten') sonuc = Il.zatenBiliyorum(d.e, ILERLEME_TURU);
    else if (ne === 'yanlis') sonuc = Il.yanlis(d.e, ILERLEME_TURU);
    else if (ipucuAcik) sonuc = Il.ipucuyla(d.e, ILERLEME_TURU);
    else sonuc = Il.dogru(d.e, ILERLEME_TURU);
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
    elSayac.textContent = 'Bugünün destesi bitti. Yarın yeni tekrarlar açılacak.';

    // Deste bitince test daveti: bugün çalışılanlar yeterliyse göster.
    var davet = $('testDavet');
    var n = Test ? Test.bugunSayisi(havuz) : 0;
    davet.hidden = n < (Test ? Test.EN_AZ : 99);
    if (!davet.hidden) {
      $('testDavetMetin').textContent = 'Bugünkü desteni bitirdin 🎉 Şimdi bu kelimeleri cümle içinde gör: ' +
        Math.min(n, Test.EN_COK) + ' soruluk boşluk doldurma testi.';
      davet.scrollIntoView({ behavior: window.YDS.hareket(), block: 'center' });
    }
  }

  /* ---------- ortak ---------- */

  function guncelleSayac() {
    var o = Il.leitnerOzet(havuz.map(function (x) { return { en: x.e }; }), ILERLEME_TURU);
    if (seciliKutu !== null) {
      elSayac.textContent = suzulmus.length + ' kelime · ' +
        (seciliKutu === 0 ? 'hiç çalışılmamışlar'
          : (seciliKutu === 5 ? 'öğrenilenler (5. kutu)' : seciliKutu + '. kutu')) +
        ' · süzgeci kaldırmak için kutuya yeniden tıkla';
      return;
    }
    elSayac.textContent = suzulmus.length + ' kelime · seçili katmanlarda ' + havuz.length +
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

  $('katmanlar').addEventListener('click', function (e) {
    var b = e.target.closest('.katman');
    if (!b) return;
    var k = parseInt(b.getAttribute('data-k'), 10);
    var i = secili.indexOf(k);
    if (i === -1) secili.push(k); else secili.splice(i, 1);
    secili.sort();
    katmanlariUygula();
  });

  [elAra, elTip, elDurum].forEach(function (el) {
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
    var en = kutu.getAttribute('data-en');
    var ne = btn.getAttribute('data-ne');

    if (ne === 'ses') { seslendir(en); return; }
    if (ne !== 'calis') return;
    kartIndex = suzulmus.findIndex(function (d) { return d.e === en; });
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

  $('desteBasla').addEventListener('click', function () {
    // Deste filtreden değil, doğrudan Ilerleme'den kurulur: tekrarı gelenlerin
    // tamamı + günlük kotaya sığan yeni kelimeler.
    var destelik = Il.destelik(havuz.map(function (d) { return { en: d.e }; }), ILERLEME_TURU);
    var kume = {};
    destelik.forEach(function (x) { kume[x.en] = true; });

    elAra.value = ''; elTip.value = ''; elDurum.value = '';
    suzulmus = karistir(havuz.filter(function (d) { return kume[d.e]; }));

    desteModu = true;
    kartModu = true;
    kartIndex = 0;
    kartAcik = false;
    ipucuAcik = false;
    gosterilen = SAYFA_BOYU;
    $('mod').textContent = 'Liste moduna dön';
    $('disKatman').hidden = true;
    ciz();
    elKartAlan.scrollIntoView({ behavior: window.YDS.hareket(), block: 'center' });
  });

  $('gunlukHedef').addEventListener('change', function () {
    Il.gunlukHedefAyarla(this.value);
    desteyiCiz();
  });

  /* Kutuya tıkla: yalnız o kutudaki kelimeler. Aynı kutuya yeniden basmak süzgeci kaldırır. */
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

  /* Birikmiş tekrarları takvime yay (tek seferlik düzeltme). */
  $('deste').addEventListener('click', function (e) {
    if (!e.target.closest('#yigiiniDagit')) return;
    var o = Il.leitnerOzet(havuz.map(function (d) { return { en: d.e }; }), ILERLEME_TURU);
    var soru = 'Vadesi geçmiş ' + (o.tekrar) + ' tekrar, günde ' + Il.gunlukTavan() +
               ' karta göre önümüzdeki günlere dağıtılsın mı? Hiçbir kayıt silinmez, ' +
               'yalnız tekrar tarihleri ileri alınır.';
    if (!window.confirm(soru)) return;
    var s = Il.birikmisiYay(havuz.map(function (d) { return d.e; }), Il.gunlukTavan(), ILERLEME_TURU);
    if (s.basarili === false) { window.YDS.depolamaUyarisi(); return; }
    desteyiCiz();
    $('bekleyenNot').innerHTML = s.tasinan
      ? '<b>' + s.tasinan + '</b> tekrar ileriki günlere yayıldı; yığın ' + s.gun + ' günde erir.'
      : 'Dağıtılacak birikmiş tekrar yoktu.';
    $('bekleyenNot').hidden = false;
  });

  /* Kotayı bugünlük genişletip desteyi yeniden aç. Günlük hedef değişmez. */
  $('testBasla').addEventListener('click', testiBaslat);
  $('testDavetBasla').addEventListener('click', testiBaslat);
  $('testDavetKapat').addEventListener('click', function () { $('testDavet').hidden = true; });

  $('devamEt').addEventListener('click', function () {
    Il.kotaArtir();
    desteyiCiz();
    $('desteBasla').click();
  });

  elKart.addEventListener('click', function () {
    kartAcik = !kartAcik;
    kartCiz();
  });
  elKart.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); kartAcik = !kartAcik; kartCiz(); }
  });

  $('ipucuBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    ipucuAcik = true;
    kartCiz();
  });
  $('ipucuAlan').addEventListener('click', function (e) { e.stopPropagation(); });

  $('onceki').addEventListener('click', function () { kartGit(-1); });
  $('sonraki').addEventListener('click', function () { kartGit(1); });
  $('bildim').addEventListener('click', function () { kartCevap('dogru'); });
  $('bilmedim').addEventListener('click', function () { kartCevap('yanlis'); });
  $('zatenBiliyorum').addEventListener('click', function () { kartCevap('zaten'); });
  $('seslendir').addEventListener('click', function (e) {
    e.stopPropagation();
    var d = suzulmus[kartIndex];
    if (d) seslendir(d.e);
  });

  $('temizle').addEventListener('click', function () {
    elAra.value = ''; elTip.value = ''; elDurum.value = '';
    desteModu = false;
    filtrele();
  });

  $('sifirla').addEventListener('click', function () {
    var kelimeAdlari = DIZIN.map(function (d) { return d.e; });
    var n = kelimeAdlari.filter(function (ad) { return Il.kutu(ad, ILERLEME_TURU) > 0; }).length;
    if (!window.YDS.ikiKereSor(
        'Tüm kelime tekrar ilerlemen silinecek. Öbek ilerlemene dokunulmaz.', n)) return;
    if (!Il.yedekAl('kelime kutuları', n)) { window.YDS.depolamaUyarisi(); return; }
    if (!Il.listeyiSifirla(kelimeAdlari, ILERLEME_TURU)) { window.YDS.depolamaUyarisi(); return; }
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
      var d = suzulmus[kartIndex];
      if (d) seslendir(d.e);
    }
  });

  /* ---------- başlat ---------- */
  $('toplamKelime').textContent = DIZIN.length.toLocaleString('tr-TR');
  $('gunlukHedef').value = String(Il.gunlukHedef());
  $('gunlukTavan').value = String(Il.gunlukTavan());
  // Arama sayfasından "Kelime sayfasında aç" ile gelen ?q=... sorgusu
  var gelenQ = new URLSearchParams(location.search).get('q');
  if (gelenQ) elAra.value = gelenQ;
  var dogrudanDeste = new URLSearchParams(location.search).get('calis') === '1';

  var geriAlCiz = window.YDS.geriAlKutusu(function () { desteyiCiz(); filtrele(); });

  katmanlariCiz();
  katmanlariUygula().then(function () {
    if (dogrudanDeste && !$('desteBasla').disabled) $('desteBasla').click();
  });
})();
