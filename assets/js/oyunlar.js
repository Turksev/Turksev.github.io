/* ============================================================
   Oyunlar sayfası — anlamdan kelimeyi yazma oyunu

   Kelimenin seviyesi Leitner kutusudur (YDS.Ilerleme, tür 'kelime'): kutu
   yükseldikçe daha az harf açık gelir. Kelimenin tamamı yazılır: açık harf
   kutusunda hazır durur, sırası gelince o da yazılır. Kelimeler seçili katmanlardan
   ('yds-katmanlar', Kelimeler sayfasıyla ortak) gelir. Bütün kurallar
   YDS.OyunHesap'tadır (assets/js/oyun-hesap.js); bu dosya yalnız çizer,
   girdiyi toplar ve sonucu ilerlemeye yazar.

   Cevap verilene kadar kelime sayfanın hiçbir yerine yazılmaz: kutularda,
   aria-label/title/data-* özniteliklerinde ve ekran okuyucu duyurusunda yoktur;
   anlam metninde geçtiği yer maskelenir.
   ============================================================ */

(function () {
  'use strict';

  function kullanimOlay(id) {
    try { if (window.YDS.Kullanim) window.YDS.Kullanim.olay(id); } catch (e) { /* Ölçüm çalışmayı engellemez. */ }
  }

  var Depo = window.YDS.Depo;
  var kacar = window.YDS.kacar;
  var yildiz = window.YDS.yildiz;
  var Il = window.YDS.Ilerleme;
  var Veri = window.YDS.Veri;
  var O = window.YDS.OyunHesap;
  var ILERLEME_TURU = 'kelime';

  var KATMAN_ANAHTAR = 'yds-katmanlar';
  var LEITNER_ANAHTAR = 'yds-leitner';
  var ESITLEME_BEKLEME_MS = 8000;   // bulut birleşimi bu kadar sürede bitmezse cevap yine de işlenir
  // Motorun birleşimi bitirdiğini (ya da hiç başlatmadığını) bildiren durumlar; ötekiler "sürüyor".
  var ESITLEME_SONUCLARI = ['kapali', 'hazir', 'hata', 'silindi'];
  var ERTELEME_IZI = 'yds-oyun-ertelenen';   // sessionStorage: bekletilen cevabın zamanı
  var ERTELEME_IZI_OMRU_MS = 20000;

  var $ = function (id) { return document.getElementById(id); };
  var elSira = $('oyunSira'), elKart = $('oyunKart'), elBos = $('oyunBos'), elDuyuru = $('oyunDuyuru');
  var elHarfler = $('oyunHarfler'), girdi = $('oyunGirdi'), elDurum = $('oyunDurum');
  var elHarf = $('oyunHarf'), elPas = $('oyunPas'), elGonder = $('oyunGonder');
  var elYuk = $('oyunYuk'), elYukDene = $('oyunYukDene');
  var modDugmeleri = [].slice.call(document.querySelectorAll('.oyun-mod [data-mod]'));

  // Betiklerden ya da kelime dizininden biri inmediyse (ağ koptu) sessizce boş kalma.
  if (!Il || !Veri || !O || !Veri.dizin.length) {
    elSira.textContent = 'Oyun yüklenemedi; sayfayı yenilemeyi dene.';
    elDuyuru.textContent = elSira.textContent;
    return;
  }

  var DIZIN = Veri.dizin;
  var MOD_ADI = { sira: 'Sıradakiler', yeni: 'Yalnız yeni kelimeler', ogrenilen: 'Öğrenilenler · harfsiz' };
  // "%40'ı açık": yüzdenin Türkçe eki sayıya göre değişir.
  var YUZDE_EKI = { 50: '\'si', 40: '\'ı', 30: '\'u', 20: '\'si', 10: '\'u' };
  var DAR_SATIR = 10, GENIS_SATIR = 18;     // bir satıra sığması istenen en çok kutu (oyunlar.css)

  var secili = katmanlariOku();
  var mod = 'sira';
  var havuz = [];            // seçili katmanlardaki oynanabilir kelimeler, dizin sırasıyla
  var kuyruk = [];           // bu modda sorulacaklar; kuyruk[0] ekrandaki kelimedir
  var adet = { sira: 0, yeni: 0, ogrenilen: 0 };
  var kuyrukTekrar = 0;      // 'sira' modunda kuyruğun başındaki vadesi gelmiş kelime sayısı
  var sayim = null;          // OyunHesap.sayilar çıktısı (bilgi satırı ve boş durum için)
  var sonBakis = null;       // sıranın kurulduğu andaki kayıt okuyucu (depodan taze)
  var simdi = null;          // ekrandaki kelime: {d, tur, anlik, ornekler}
  // Bitmemiş turlar: mod ya da katman değiştirip geri dönmek deneme hakkını tazelemesin.
  var yarim = Object.create(null);
  // Bu sayfa ömründe sorulan kelimeler; sıra yeniden kurulsa da geri gelmez.
  var soruldu = Object.create(null);
  var bekleyen = null;       // ekrana yazılmış ama ilerlemeye henüz yazılmamış sonuç
  var bayat = false;         // başka sekme ya da bulut ilerlemeyi değiştirdi: sıra yeniden kurulmalı
  var katmanBayat = false;   // katman seçimi başka yerde değişti
  var yukleniyor = false;
  var yukNo = 0;
  var gecici = false;        // durum satırındaki ileti ilk tuşta silinsin mi
  // Sıradaki duyuruya sıra bilgisi de eklensin (açılış, mod ve katman değişimi); "Sonraki
  // kelime"de yalnız soru okunur.
  var siraDuyur = true;
  var oturum = { dogru: 0, ipucuyla: 0, yanlis: 0 };

  /* ---------- katman seçimi (kelimeler.js ile aynı anahtar ve kural) ---------- */

  function katmanlariOku() {
    var s = Depo.oku(KATMAN_ANAHTAR, [2]);
    if (!Array.isArray(s) || !s.length) s = [2];
    s = s.map(Number).filter(function (k, i, a) {
      return k >= 1 && k <= 7 && Math.floor(k) === k && a.indexOf(k) === i;
    });
    // Aile üyeleri 6'dan 7'ye taşındı (Geniş+ araya girdi); eski seçimi bir kez taşı.
    // Bu sayfa seçimi yazabildiği için taşıma ilk yazımdan önce burada yapılır.
    if (!Depo.oku('yds-katman7', false)) {
      if (s.indexOf(6) !== -1) {
        s = s.filter(function (k) { return k !== 6; }).concat(s.indexOf(7) === -1 ? [7] : []);
        Depo.yaz(KATMAN_ANAHTAR, s);
      }
      Depo.yaz('yds-katman7', true);
    }
    if (!s.length) s = [2];
    return s.sort(function (a, b) { return a - b; });
  }

  /* Düğmeler bir kez kurulur, sonra yerinde güncellenir: yeniden çizilseydi basılan
     düğme silinir, klavye odağı sayfanın başına düşerdi. title yok: main.js onu
     aria-label yapar ve düğmenin görünen adı (katman, kelime sayısı) okunmaz olurdu. */
  function katmanlariCiz() {
    var sayilar = Veri.katmanSayilari(), kap = $('katmanlar');
    if (!kap.firstChild) {
      kap.innerHTML = Veri.KATMANLAR.filter(function (k) {
        return sayilar[k] > 0;
      }).map(function (k) {
        return '<button type="button" class="katman" data-k="' + k + '"' +
          ' data-puan="' + kacar(Veri.katmanPuanMetni(k)) + '" aria-pressed="false">' +
            '<b>' + Veri.KATMAN_ADI[k] + '</b>' +
            '<i>' + sayilar[k] + ' kelime</i>' +
            '<span class="onay" aria-hidden="true">+</span>' +
          '</button>';
      }).join('');
    }
    [].forEach.call(kap.querySelectorAll('.katman'), function (b) {
      var acik = secili.indexOf(parseInt(b.getAttribute('data-k'), 10)) !== -1;
      b.classList.toggle('acik', acik);
      b.setAttribute('aria-pressed', acik ? 'true' : 'false');
      b.querySelector('.onay').textContent = acik ? '✓' : '+';
    });

    var toplam = secili.reduce(function (t, k) { return t + (sayilar[k] || 0); }, 0);
    // Modal yapılar, "+ V3" kalıpları ve Türkçesi aynı yazılan kelimeler oyun dışıdır; fark varsa söyle.
    $('katmanBilgi').textContent = secili.length
      ? toplam + ' kelime seçili' + (havuz.length !== toplam ? ' · oyunda ' + havuz.length : '')
      : 'Hiç katman seçili değil';
  }

  function eksikKatmanlar() {
    return secili.filter(function (k) { return !Veri.katmanYukluMu(k); });
  }

  // Tek katman; hata yutulur (sonuç: indi mi). Oyun katmansız da dizindeki kısa anlamla sürer.
  function katmanDene(k) {
    return Veri.katmanYukle(k).then(function () { return true; }, function () { return false; });
  }

  function yukNotuCiz() {
    var eksik = eksikKatmanlar().length > 0;
    if (eksik && elYuk.hidden) {
      $('oyunYukMetin').textContent = 'Anlam ayrıntıları yüklenemedi (çevrimdışı olabilirsin). ';
    }
    elYuk.hidden = !eksik;
  }

  /* ---------- soru sırası ---------- */

  // Oynanabilirlik anlam maskesine bakar (ipucu kalıyor mu); başlık başına bir kez hesaplanır.
  var oynanirBellek = Object.create(null);
  function oynanir(d) {
    var b = oynanirBellek[d.e];
    if (b === undefined) b = oynanirBellek[d.e] = O.oynanabilir(d);
    return b;
  }

  function havuzKur() {
    havuz = DIZIN.filter(function (d) { return secili.indexOf(d.k) !== -1 && oynanir(d); });
  }

  /* Depodaki güncel Leitner kayıtları. Il.kayit bellekteki kopyayı okur; başka sekmenin
     yazımı bu sekmeye olay olarak henüz ulaşmamış (ya da hiç ulaşmayacak) olabilir. Sıra,
     kelimenin seviyesi ve yazım öncesi karşılaştırma bu yüzden depodan taze okunur. */
  function tazeHarita() {
    var tum = Depo.oku(LEITNER_ANAHTAR, {});
    return tum && typeof tum === 'object' && !Array.isArray(tum) ? tum : {};
  }

  // OyunHesap geri çağrıyı (başlık, dizin kaydı) sırasıyla çağırır. Bir kuruluşta her
  // kelimenin kaydı bir kez okunur: üç mod ve sayılar aynı okumayı paylaşır.
  function bakis() {
    var tum = tazeHarita(), onbellek = Object.create(null);
    return {
      bugun: Il.bugun(),
      kayit: function (e) {
        if (!(e in onbellek)) onbellek[e] = tum[Il.ilerlemeKimligi(e, ILERLEME_TURU)] || null;
        return onbellek[e];
      }
    };
  }

  function sorulmamis(d) { return !soruldu[d.e]; }

  /* Sıra her kelimede yeniden kurulur (bütün havuzda birkaç ms): başka sekmenin ya da
     cihazın yazdığı kayıt bu sekmeye olay olarak ulaşmasa da günü gelmemiş kelime
     sorulmaz, gün dönünce yeni günün sırası gelir. */
  function kuyrukKur() {
    var b = bakis();
    havuzKur();
    sayim = O.sayilar(havuz, b);
    var liste = {
      sira: O.sira(havuz, 'sira', b).filter(sorulmamis),
      yeni: O.sira(havuz, 'yeni', b).filter(sorulmamis),
      ogrenilen: O.sira(havuz, 'ogrenilen', b).filter(sorulmamis)
    };
    adet = { sira: liste.sira.length, yeni: liste.yeni.length, ogrenilen: liste.ogrenilen.length };
    kuyrukTekrar = liste.sira.length - liste.yeni.length;
    kuyruk = liste[mod];
    sonBakis = b;
    bayat = false;
  }

  function siraMetni() {
    if (!secili.length) return 'Hiç katman seçili değil.';
    var n = kuyruk.length;
    if (!n) return 'Bu turda sorulacak kelime yok.';
    if (mod === 'yeni') return 'Sırada ' + n + ' yeni kelime.';
    if (mod === 'ogrenilen') return 'Sırada ' + n + ' öğrenilmiş kelime; hepsi harfsiz sorulur.';
    return 'Sırada ' + n + ' kelime: ' + kuyrukTekrar + ' tekrar + ' + (n - kuyrukTekrar) + ' yeni.' +
      (sayim.bekleyen ? ' ' + sayim.bekleyen + ' kelime tekrar gününü bekliyor.' : '');
  }

  function sayilariYaz() {
    modDugmeleri.forEach(function (b) {
      var m = b.getAttribute('data-mod');
      b.textContent = MOD_ADI[m] + ' (' + adet[m] + ')';
      b.setAttribute('aria-pressed', m === mod ? 'true' : 'false');
    });
    var metin = siraMetni();
    if (elSira.textContent !== metin) elSira.textContent = metin;
  }

  function bosMetni() {
    if (!secili.length) return 'Hiç katman seçili değil. Aşağıdan en az bir katman seç.';
    if (mod === 'yeni') {
      return 'Seçili katmanlarda hiç çalışılmamış kelime kalmadı. “Sıradakiler” turuna dön ya da başka bir katman ekle.';
    }
    if (mod === 'ogrenilen') {
      return sayim.ogrenilenToplam
        ? 'Öğrendiğin kelimelerin hepsini bugün çalıştın; yarın yeniden sorulabilir. Şimdilik “Sıradakiler” turuna dön.'
        : 'Seçili katmanlarda henüz öğrenilmiş (5. kutu) kelime yok. Kelimeler kutularda yükseldikçe burada harfsiz sorulur; şimdilik “Sıradakiler” turunu seç.';
    }
    return 'Bugünlük bu kadar: seçili katmanlarda tekrar zamanı gelen ya da yeni kelime kalmadı.' +
      (sayim.bekleyen ? ' ' + sayim.bekleyen + ' kelime tekrar gününü bekliyor.' : '') +
      ' Başka bir katman ekleyebilir ya da “Öğrenilenler · harfsiz” turunu deneyebilirsin.';
  }

  /* ---------- kayıt karşılaştırma ---------- */

  function kayitOzeti(r) { return r ? { k: r.k, g: r.g, c: r.c } : null; }

  function ayniKayit(a, b) {
    if (!a || !b) return !a && !b;
    return a.k === b.k && a.g === b.g && a.c === b.c;
  }

  // Kelimenin depodaki güncel kaydı (gösterirken ve yazmadan hemen önce).
  function tazeKayit(en) {
    return kayitOzeti(tazeHarita()[Il.ilerlemeKimligi(en, ILERLEME_TURU)]);
  }

  /* ---------- çizim ---------- */

  var durumZamani = null, sonDurum = '';
  var beklemeIletisi = false;   // durum satırında "Eşitleniyor; bitince …" duruyor (ertele yazar, sonraki her ileti siler)

  /* Durum satırı (role=status). Yeni ileti hemen yazılır: sonuç, ilerleme yazımını
     beklemeden görünmeli. Aynı ileti art arda gelirse ekran okuyucu yeniden okusun diye
     önce boşaltılır, sonra yazılır (sozluk.js ile aynı). */
  function durumYaz(html, sinif) {
    window.clearTimeout(durumZamani);
    gecici = false;
    beklemeIletisi = false;
    elDurum.className = 'oyun-durum' + (sinif ? ' ' + sinif : '');
    if (html && html !== sonDurum) {
      sonDurum = html;
      elDurum.innerHTML = html;
      return;
    }
    sonDurum = '';
    elDurum.textContent = '';
    if (!html) return;
    durumZamani = window.setTimeout(function () {
      sonDurum = html;
      elDurum.innerHTML = html;
    }, 60);
  }

  var duyuruZamani = null;

  /* Görünmeyen duyuru bölgesi (role=status): yeni kelimenin sorusu, mod ya da katman
     değişince sıra bilgisi, yükleme durumu. Görünen sıra satırı her kelimede değiştiği
     için canlı bölge değildir. Metin bir an sonra yazılır: aynı anda değişen durum
     satırı önce okunsun, art arda gelen duyurulardan yalnız sonuncusu kalsın. */
  function duyur(metin) {
    window.clearTimeout(duyuruZamani);
    elDuyuru.textContent = '';
    if (!metin) return;
    duyuruZamani = window.setTimeout(function () { elDuyuru.textContent = metin; }, 80);
  }

  function ingilizce(kelime) { return '<b lang="en">' + kacar(kelime) + '</b>'; }

  function kutuAdi(k) { return k >= 5 ? 'öğrenildi' : k + '. kutu'; }

  // Kutusunda bu kelimenin kaç harfi açık gelir (kısa kelimede yüzde sıfıra yuvarlanabilir).
  function acikHarf(kelime, kutu) { return O.acikSayisi(O.harfSayisi(kelime), kutu); }

  function baslikCiz() {
    var k = simdi.tur.kutu, y = O.yuzde(k);
    $('oyunSeviye').textContent = 'Seviye ' + O.seviyeNo(k) + ' · ' +
      (!y ? 'harf yok' : (acikHarf(simdi.d.e, k) ? 'harflerin %' + y + YUZDE_EKI[y] + ' açık' : 'kısa kelime: harf yok'));
    $('oyunKutu').textContent = !k ? 'hiç çalışılmadı' : (k >= 5 ? 'öğrenildi' : k + '. kutu · tekrar zamanı');
  }

  // Kartın anlam metinleri; katman inmediyse dizindeki kısa anlam.
  function anlamMetinleri(d) {
    var tam = Veri.kayit(d.e);
    return tam && tam.a && tam.a.length ? tam.a : [{ tr: d.t }];
  }

  /* Anlamlar: kelime kartının arkasıyla aynı (anlam + yıldız, altında tür). Tur bitene
     kadar anlamın içinde cevabı ele veren yerler ••• olur. Yıldızlar girdinin
     açıklamasına (aria-describedby) girmesin diye ekran okuyucudan gizlenir. */
  function anlamCiz() {
    var d = simdi.d, bitti = !!simdi.tur.bitti;
    $('oyunAnlam').innerHTML = anlamMetinleri(d).map(function (a) {
      var y = yildiz(a);
      return kacar(bitti ? a.tr : O.maskele(a.tr, d.e)) + (y ? '<span aria-hidden="true">' + y + '</span>' : '');
    }).join('<br>') +
      '<div class="oyun-tur muted small">' + kacar(d.y) + '</div>';
  }

  // Sorunun sesli hâli: maskeli anlamlar, tür ve harf düzeni. Cevap içinde geçmez.
  function soruMetni() {
    var d = simdi.d;
    var anlam = anlamMetinleri(d).map(function (a) { return O.maskele(a.tr, d.e); })
      .join('; ').split('•••').join(' gizli sözcük ').replace(/\s+/g, ' ');
    return 'Yeni kelime: ' + anlam + ' (' + d.y + '). ' + O.tarif(simdi.tur);
  }

  // Tireli/çok sözcüklü başlıkta her parça ayracıyla birlikte tek blok: satır ayraçtan kırılır.
  function harfleriCiz() {
    var parca = '', html = '';
    O.hucreGorunumu(simdi.tur, girdi.value).forEach(function (h, i) {
      if (h.tur === 'ayrac') {
        html += '<span class="parca">' + parca +
          '<span class="harf ayrac">' + (h.c === ' ' ? '&nbsp;' : kacar(h.c)) + '</span></span>';
        parca = '';
        return;
      }
      // yazildi: sırası gelmiş, üzerine yazılmış kutu; farkli: açık harfin üzerine başka harf yazıldı.
      var sinif = h.tur === 'bos' ? 'bos' : (h.bulundu ? 'bulundu' : (h.ipucu ? 'ipucu' : 'sabit'));
      parca += '<span class="harf ' + sinif + (h.yazildi ? ' yazildi' : '') + (h.farkli ? ' farkli' : '') +
        (h.simdi ? ' simdi' : '') + '" style="--i:' + i + '">' +
        kacar(h.c) + '</span>';
    });
    elHarfler.innerHTML = html + '<span class="parca">' + parca + '</span>';
  }

  // Kutular, ekran okuyucu açıklaması, yazılabilecek harf sayısı ve düğmeler.
  function turCiz() {
    var t = simdi.tur, bos = O.bosSayisi(t);
    harfleriCiz();
    $('oyunTarif').textContent = O.tarif(t);
    // Ayraçlar da sayılır: tarayıcı sınırı temizlikten önce uygular; yapıştırılan ya da klavyenin
    // tek parça gönderdiği "well-being" son harfini yitirmesin. Harf sayısına girdiIsle kırpar.
    girdi.setAttribute('maxlength', t.bitti ? '0' : String(t.kelime.length));
    girdi.setAttribute('enterkeyhint', t.bitti ? 'next' : 'done');
    elHarf.disabled = !!t.bitti || bos < 2;
    elPas.disabled = !!t.bitti;
    elGonder.textContent = t.bitti ? 'Sonraki kelime →' : 'Kontrol et';
  }

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

  /* Cevaptan sonra: kullanım kalıpları ve örnek cümleler. İkisi de kelimenin kendisini
     içerir, o yüzden yalnız tur bitince çizilir. */
  function sonucCiz() {
    var d = simdi.d, tam = Veri.kayit(d.e), html = '';
    if (tam && tam.a) {
      // Örnek seçimi sırayı ilerletir (yan etki): biten kelime başına bir kez.
      if (!simdi.ornekler) simdi.ornekler = Veri.ornekleriSec(d.e, tam.a);
      if (tam.kl && tam.kl.length) {
        html += window.YDS.KalipSunum ? window.YDS.KalipSunum.html(d.e, tam.kl, { centered: true }) : '<div class="kalip ust">' + tam.kl.map(function (k) {
          return '<span><b lang="en">' + kacar(k.en) + '</b><i>' + kacar(k.tr) + '</i></span>';
        }).join('') + '</div>';
      }
      html += simdi.ornekler.filter(function (a) { return a.ex; }).map(function (a) {
        return '<div class="oyun-cumle"><p lang="en">' + kacar(a.ex) + '</p>' +
          '<p class="muted">' + kacar(a.exTr) + '</p></div>';
      }).join('');
    }
    $('oyunOrnek').innerHTML = html;
    $('oyunDinle').hidden = !sesDestegi;
    $('oyunSonuc').hidden = !html && !sesDestegi;
  }

  function dengeli(n, sigan) { return Math.ceil(n / Math.ceil(n / sigan)); }

  function kelimeKur(d) {
    // Seviye ve yazım öncesi karşılaştırmanın dayanağı: sıranın kurulduğu taze kayıt.
    var anlik = kayitOzeti(sonBakis ? sonBakis.kayit(d.e) : null);
    var kutu = O.kutuDuzelt(anlik ? anlik.k : 0), gun = Il.bugun();
    var tur = yarim[d.e];
    if (!tur || tur.kutu !== kutu || tur.gun !== gun) tur = yarim[d.e] = O.turBaslat(d.e, kutu, gun);
    simdi = { d: d, tur: tur, anlik: anlik, ornekler: null };
    ertelemeyiBirak();

    if (girdi.value !== '') girdi.value = '';
    girdi.removeAttribute('aria-invalid');
    elHarfler.className = 'harfler';
    // Kutu eni en uzun parçaya göre: satırlar dengeli bölünsün (11 harf → 6 + 5).
    // Son olmayan parça ayracını da taşır (.parca): o da sayılmazsa en uzun parça iki satıra bölünürdü.
    var parcalar = d.e.split(/[- ]/);
    var enUzun = parcalar.reduce(function (m, p, i) { return Math.max(m, p.length + (i < parcalar.length - 1 ? 1 : 0)); }, 1);
    elHarfler.style.setProperty('--nd', String(dengeli(enUzun, DAR_SATIR)));
    elHarfler.style.setProperty('--ng', String(dengeli(enUzun, GENIS_SATIR)));

    baslikCiz();
    anlamCiz();
    turCiz();
    $('oyunSonuc').hidden = true;
    $('oyunOrnek').innerHTML = '';
    durumYaz(tur.deneme ? 'Kaldığın yerden devam: ' + (O.DENEME_HAKKI - tur.deneme) + ' deneme hakkın kaldı.' : '', '');
  }

  /* Sıranın başındaki kelimeyi (yoksa boş durumu) gösterir. odak: kullanıcı işlemiyse
     true; depolama olayından gelen yenilemede girdiye dokunulmaz, odak da yalnız
     üzerinde durduğu öğe gizleniyorsa onun yerine geçene taşınır (yoksa sayfanın
     başına düşerdi). */
  function goster(odak, not) {
    var siraIle = siraDuyur, odaktaki = document.activeElement;
    siraDuyur = false;
    sayilariYaz();
    var d = kuyruk[0];
    if (!d) {
      var karttaydi = !elKart.hidden && elKart.contains(odaktaki);
      kelimesiz();
      elKart.hidden = true;
      elBos.textContent = bosMetni() + (not ? ' ' + not.metin : '');
      elBos.hidden = false;
      if (odak) elBos.focus();
      else if (karttaydi) odakla(elBos);
      else duyur(elBos.textContent);
      return;
    }
    var bostaydi = !elBos.hidden && odaktaki === elBos;
    elBos.hidden = true;
    // Aynı kelime, yarım ve kaydı değişmemişse olduğu gibi kalır (yazılan harfler de);
    // yalnız anlam yeniden çizilir: katmanı bu arada inmiş olabilir.
    var ayni = simdi && !elKart.hidden && simdi.d === d && !simdi.tur.bitti &&
      ayniKayit(simdi.anlik, kayitOzeti(sonBakis.kayit(d.e)));
    if (ayni) anlamCiz();
    else kelimeKur(d);
    elKart.hidden = false;
    if (not) durumYaz(kacar(not.metin), not.sinif);
    if (odak) girdi.focus();
    else if (bostaydi) odakla(girdi);
    if (!ayni) duyur((siraIle ? siraMetni() + ' ' : '') + soruMetni());
    // Kelime aynı kaldıysa soru yinelenmez; mod ya da katman değişiminin sıra bilgisi yine okunur.
    else if (siraIle) duyur(siraMetni());
  }

  // Ekranda kelime kalmadı (boş sıra ya da katman iniyor): bekletilen cevap da bırakılır.
  function kelimesiz() {
    simdi = null;
    ertelemeyiBirak();
  }

  // Kullanıcı işlemi olmadan taşınan odak sayfayı kaydırmasın.
  function odakla(el) {
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  /* Katmanları (gerekiyorsa) indirip sırayı kurar ve gösterir. sessiz: depolama
     olayından gelen yenileme; indirme sürerken kart yerinde kalır (gizlenseydi odak
     düşerdi) ve kullanıcı o arada yazmaya başladıysa sıra "Sonraki kelime"ye bırakılır. */
  function yukleVeKur(odak, not, sessiz) {
    var no = ++yukNo, eksik = eksikKatmanlar();
    havuzKur();
    katmanlariCiz();
    if (!eksik.length) {
      yukleniyor = false;
      yukNotuCiz();
      kuyrukKur();
      goster(odak, not);
      return;
    }
    yukleniyor = true;
    if (sessiz) {
      bayat = true;
    } else {
      kelimesiz();
      elKart.hidden = true;
      elBos.hidden = true;
      elSira.textContent = 'Katmanlar yükleniyor…';
      duyur(elSira.textContent);
    }
    Promise.all(eksik.map(katmanDene)).then(function () {
      if (no !== yukNo) return;
      yukleniyor = false;
      if (sessiz && mesgul()) return;
      // İndirme sürerken seçim başka yerde yeniden değiştiyse onu da al.
      if (katmanBayat) { yenile(odak, not, sessiz); return; }
      yukNotuCiz();
      kuyrukKur();
      goster(odak, not);
    }).catch(function () { /* katmanDene hata vermez; çizim hatası sayfayı düşürmesin */ });
  }

  // Başka yerde değişmiş olabilecek katman seçimini yeniden okuyup sırayı kurar.
  function yenile(odak, not, sessiz) {
    if (katmanBayat) {
      katmanBayat = false;
      secili = katmanlariOku();
    }
    yukleVeKur(odak, not, sessiz);
  }

  /* ---------- oturum özeti ---------- */

  function ozeteEkle(d, sonuc, kutu) {
    $('oyunSayim').textContent = 'Bu oturum: ✓ ' + oturum.dogru + ' bildin · 💡 ' + oturum.ipucuyla +
      ' ipuçlu · ✗ ' + oturum.yanlis + ' bilemedin';
    // İpucuyla bilinen ama öğrenilenlerde kalan kelime de "bilinen"dir: yarın tekrara gelmez.
    var bilinen = sonuc === 'dogru' || (sonuc === 'ipucuyla' && kutu >= 5);
    var li = document.createElement('li');
    li.className = 'cip ' + (sonuc === 'dogru' ? 'ogrenildi' : (sonuc === 'ipucuyla' ? 'baslandi' : 'yanlis'));
    li.innerHTML = (sonuc === 'dogru' ? '' : '<span aria-hidden="true">' + (sonuc === 'ipucuyla' ? '💡' : '✗') + '</span> ' +
        '<span class="visually-hidden">' + (sonuc === 'ipucuyla' ? 'ipuçlu: ' : 'bilemedin: ') + '</span>') +
      ingilizce(d.e) + ' · ' + kutuAdi(kutu);
    var liste = $(bilinen ? 'oyunBilinen' : 'oyunTekrar');
    liste.insertBefore(li, liste.firstChild);
    $(bilinen ? 'oyunBilinenKutu' : 'oyunTekrarKutu').hidden = false;
  }

  function gunlukCiz() {
    $('oyunGunluk').textContent = 'Bugün açılan yeni kelime: ' + Il.bugunAcilanYeni() +
      ' · günlük hedef ' + Il.gunlukHedef() + ' (Kelimeler destesiyle ortak sayaç)';
  }

  /* ---------- cevap ---------- */

  var kucukBasliklar = null;

  // Yazılan aday dizinde bir başlık mı? (öteki yazım ve eş anlamlı denetimi için)
  function baslikBul(aday) {
    if (!kucukBasliklar) {
      kucukBasliklar = Object.create(null);
      DIZIN.forEach(function (x) { kucukBasliklar[O.sade(x.e)] = x; });
    }
    return kucukBasliklar[aday] || null;
  }

  // Aday bu kartla ilişkili mi: 'yazim' (analyse/analyze), 'es' (almost/nearly) ya da boş.
  function adayBagi(aday) { return O.iliski(aday, simdi.d, baslikBul); }

  function sonucMetni(tur, d, kutu) {
    if (tur.bitti === 'yanlis') {
      return 'Cevap: ' + ingilizce(d.e) + '. Kelime ' + kutu + '. kutuda; yarın tekrar gelecek.';
    }
    var on = tur.yazim
      ? ingilizce(tur.yazim) + ' yazımı da doğru; bu karttaki yazım ' + ingilizce(d.e) + '. ' : '';
    if (tur.bitti === 'ipucuyla') {
      return on + (tur.ipucu ? 'Doğru, ama ipucuyla; ' : 'Doğru, ama ilk denemede değil; ') +
        (!tur.kutu ? 'kelime 1. kutuya girdi.'
          : (kutu >= 5 ? 'kelime öğrenilenlerde kalıyor.' : 'kelime ' + kutu + '. kutuda kalıyor.'));
    }
    if (tur.kutu >= 5) return on + 'Bildiniz! Harfsiz de doğru; kelime öğrenilenlerde kalıyor.';
    if (kutu >= 5) {
      return on + 'Bildiniz! Kelime öğrenildi (5. kutu). Bundan sonra “Öğrenilenler · harfsiz” turunda sorulur.';
    }
    var y = O.yuzde(kutu);
    return on + 'Bildiniz! Kelime ' + kutu + '. kutuya çıktı; ' + (acikHarf(d.e, kutu)
      ? 'bir dahaki sefere harflerin %' + y + YUZDE_EKI[y] + ' açık gelecek.'
      : 'bu kadar kısa kelimede bir dahaki sefere harf açılmayacak.');
  }

  /* Bekleyen sonucu ilerlemeye yazar; bekleyen yoksa hiçbir şey yapmaz (bir kelime en çok
     bir kez yazılır). Yazılamayan ya da atlanan sonucun iletisini döndürür: çağıran,
     kelime değişse de gösterebilsin. */
  function kaydet() {
    var is = bekleyen;
    if (!is) return null;
    bekleyen = null;
    var d = is.d, ekranda = !!simdi && simdi.d === d, not;

    var taze = tazeKayit(d.e);
    if (!ayniKayit(is.anlik, taze)) {
      bayat = true;
      not = { metin: 'Bu kelime başka bir sekmede ya da cihazda az önce yanıtlanmış; ilerleme değiştirilmedi.', sinif: 'uyari' };
      if (ekranda) {
        $('oyunKutu').textContent = taze && O.kutuDuzelt(taze.k) ? kutuAdi(O.kutuDuzelt(taze.k)) : 'hiç çalışılmadı';
        durumYaz(kacar(not.metin), not.sinif);
      }
      return not;
    }

    var kutu = is.sonuc === 'dogru' ? Il.dogru(d.e, ILERLEME_TURU)
      : (is.sonuc === 'ipucuyla' ? Il.ipucuyla(d.e, ILERLEME_TURU) : Il.yanlis(d.e, ILERLEME_TURU));
    if (kutu === false) {
      window.YDS.depolamaUyarisi();
      not = { metin: 'İlerleme kaydedilemedi; bu kelime sayılmadı.', sinif: 'err' };
      if (ekranda) durumYaz(kacar(not.metin), not.sinif);
      return not;
    }

    kullanimOlay('oyun-cevap');
    oturum[is.sonuc]++;
    ozeteEkle(d, is.sonuc, kutu);
    gunlukCiz();
    return null;
  }

  /* Önce sonuç çizilir, yazım bir kare sonraya kalır: yoğun kullanıcıda bir ilerleme
     yazımı 40-250 ms sürer ve "Bildiniz" o kadar geç görünürdü. Sonraki kelime, mod ve
     katman değişimi ile sayfa gizlenirken bekleyen yazım hemen yapılır. Sekme zaten
     gizliyse (bekletilen cevap arka planda işlendi) kare gelmez: yazım beklemez. */
  function yazmayiPlanla(is) {
    if (document.visibilityState === 'hidden') { kaydet(); return; }
    var yaz = function () { if (bekleyen === is) kaydet(); };
    var sonra = function () { window.setTimeout(yaz, 0); };
    if (window.requestAnimationFrame) window.requestAnimationFrame(sonra);
    else sonra();
  }

  function bitir() {
    var s = simdi, t = s.tur, d = s.d;
    var kutu = O.sonKutu(t.kutu, t.bitti);
    delete yarim[d.e];
    soruldu[d.e] = true;

    if (girdi.value !== '') girdi.value = '';
    girdi.removeAttribute('aria-invalid');
    elHarfler.className = 'harfler ' + (t.bitti === 'yanlis' ? 'acildi' : 'dogru');
    turCiz();
    anlamCiz();
    sonucCiz();
    $('oyunKutu').textContent = kutuAdi(kutu);
    durumYaz(sonucMetni(t, d, kutu), t.bitti === 'dogru' ? 'ok' : (t.bitti === 'ipucuyla' ? 'uyari' : 'err'));

    bekleyen = { d: d, sonuc: t.bitti, anlik: s.anlik };
    yazmayiPlanla(bekleyen);
  }

  // Kelimenin bütün harfleri yazılmış mı (açık harfler dahil)?
  function tamYazili() {
    var tam = O.harfSayisi(simdi.tur.kelime);
    return O.temizle(girdi.value, tam).length >= tam;
  }

  function kontrol() {
    var t = simdi.tur, once = O.bosSayisi(t);
    // Kelime tam yazıldıysa cevap işlenecek demektir; bulut birleşimi sürüyorsa bekletilir.
    if (tamYazili() && ertele('kontrol')) return;
    var r = O.dene(t, girdi.value, adayBagi);
    girdi.value = r.yazilan;
    if (r.durum === 'eksik') {
      harfleriCiz();
      durumYaz('Önce kelimenin tamamını yaz' + (once < O.harfSayisi(t.kelime) ? '; açık harfleri de yaz.' : '.'), '');
      gecici = true;
      return;
    }
    if (r.durum === 'es') {
      durumYaz(ingilizce(r.aday) + ' kelimesi de bu anlama gelir ama aranan kelime o değil; başka bir kelime dene.', 'uyari');
      gecici = true;
      return;
    }
    if (r.durum === 'farkli') {
      /* Tek hata açık harfin üzerine yazılan başka harf: deneme harcanmaz. Yazılan o harfin önünde
         kesildi (imleç hep sondadır; elle ancak oraya kadar silinerek düzeltilebilirdi): imleç
         yanlış yazılan harfin kutusunda, harf kutuda görünüyor. Kaçıncı harf olduğu söylenir
         (ayraçlar sayılmaz). */
      harfleriCiz();
      durumYaz(O.harfSayisi(t.kelime.slice(0, r.konum + 1)) + '. harf yanlış, ' + ingilizce(t.hucreler[r.konum].c) +
        ' olmalı. O harften devam et.', 'uyari');
      gecici = true;
      return;
    }
    if (t.bitti) { bitir(); return; }
    elHarfler.classList.add('yanlis');
    girdi.setAttribute('aria-invalid', 'true');
    turCiz();
    durumYaz('Olmadı' + (O.bosSayisi(t) < once ? '. Doğru harfler açıldı' : '') +
      '; baştan yaz. ' + (r.kalan === 1 ? 'Son hakkın.' : r.kalan + ' hakkın kaldı.'), 'err');
  }

  function harfAc() {
    var t = simdi.tur, ilk = !t.ipucu;
    var onceki = O.temizle(girdi.value, O.harfSayisi(t.kelime)), r = O.harfAc(t, girdi.value);
    if (!r) return;
    if (ilk) kullanimOlay('oyun-harf');
    girdi.value = r.yazilan;
    girdi.removeAttribute('aria-invalid');
    elHarfler.classList.remove('yanlis');
    turCiz();
    iziEsle();
    // Kaçıncı harf: ayraçlar sayılmaz. Yazılan kesildiyse kutuları görmeyene de söylenir (görünmeyen ek).
    var sira = O.harfSayisi(t.kelime.slice(0, r.konum + 1));
    durumYaz(sira + '. harf açıldı: ' + ingilizce(t.hucreler[r.konum].c) + '. Doğru bilirsen kelime ' +
      (t.kutu ? 'aynı kutuda kalır.' : '1. kutuya girer.') + (r.yazilan.length < onceki.length
      ? '<span class="visually-hidden"> Bu harften sonra yazdıkların silindi; buradan devam et.</span>' : ''), 'uyari');
  }

  // "Bilemedim, göster".
  function pasGec() {
    if (!simdi || simdi.tur.bitti || ertele('pas')) return;
    O.birak(simdi.tur);
    bitir();
  }

  function sonraki() {
    var not = kaydet();
    if (katmanBayat) { yenile(true, not); return; }
    kuyrukKur();
    goster(true, not);
  }

  /* ---------- eşitleme ---------- */

  /* Eşitleme açıksa açılıştaki bulut birleşimi bitmeden cevap işlenmez. Birleşim başka
     cihazdan yeni kayıt getirirse sayfa yeniden yüklenir (site geneli davranış); o ana
     kadar yanıtlanan kelime eski kutusuyla hesaplanıp buluttaki kaydın üzerine yazardı.
     Kelime hemen gösterilir ve yazılabilir; yalnız "Kontrol et" ile "Bilemedim, göster"
     birleşim bitene (bağlantı yavaşsa sayfa açılışından 8 saniye geçene) kadar bekletilir;
     bağlantı yoksa eşitleme hemen hata verir ve bekleme o an biter.
     Okuyup yazmak birleşimden uzun sürdüğü için bekleme çoğu zaman hiç görülmez.
     Eşitleme betiği bu dosyadan sonra yüklenir; durumu olaylarından izlenir. */
  var esitlemeDurumu = '', esitlemeBitti = false, ertelenen = null, izVar = false;

  /* Motor (esitleme-v2.js) sırayla kapali → yukleniyor → yuklendi → baglaniyor → hazir
     (ya da hata / silindi) bildirir. Sonuç bildiren dört ad dışındaki her durum "sürüyor"
     sayılır: motora yeni bir ara durum eklenirse kapı kendiliğinden kapanmaz (üst sınır
     yine 8 saniyedir). Adlar: tools/test-uretim/oyun-esitleme-sozlesme-test.js. */
  function esitlemeSuruyor() {
    return esitlemeDurumu !== '' && ESITLEME_SONUCLARI.indexOf(esitlemeDurumu) === -1;
  }

  /* Bekletilen cevap işlenemeden sayfa yeniden yüklenebilir: birleşim başka cihazdan kayıt
     getirdiyse motor sayfayı yeniler. Söz verilen kontrol yapılmadığı için yeni açılışta
     bir not gösterilir. İz yalnız bu sekmededir ve kısa ömürlüdür. */
  function izYaz(zaman) {
    izVar = !!zaman;
    try {
      if (zaman) window.sessionStorage.setItem(ERTELEME_IZI, String(zaman));
      else window.sessionStorage.removeItem(ERTELEME_IZI);
    } catch (e) { /* oturum deposu kapalıysa not gösterilmez */ }
  }

  function ertelemeyiBirak() {
    ertelenen = null;
    if (izVar) izYaz(0);
  }

  /* Bekleyen "Kontrol et"in izi sözle birlikte yürür: beklerken yazılan eksilirse söz düşmüştür
     (iz silinir; sayfa o sırada yenilenirse "cevabın işlenmedi" denmez), kelime yeniden
     tamamlanırsa geri yazılır. */
  function iziEsle() {
    if (ertelenen !== 'kontrol' || !simdi) return;
    var tam = tamYazili();
    if (tam !== izVar) izYaz(tam ? Date.now() : 0);
  }

  function acilisNotu() {
    var iz = 0, gecen;
    try { iz = Number(window.sessionStorage.getItem(ERTELEME_IZI)) || 0; } catch (e) { /* not yok */ }
    if (!iz) return null;
    izYaz(0);
    gecen = Date.now() - iz;
    if (!(gecen >= 0 && gecen < ERTELEME_IZI_OMRU_MS)) return null;
    // Ekrandaki kelime o kelime olmayabilir (birleşim sırayı değiştirdiyse): "yeniden yaz" denmez.
    return { metin: 'Eşitleme sırasında sayfa yenilendi; az önce verdiğin cevap işlenmedi.', sinif: 'uyari' };
  }

  // İşlem şimdi yapılamıyorsa hatırlanır ve true döner.
  function ertele(islem) {
    if (esitlemeBitti || !esitlemeSuruyor()) return false;
    ertelenen = islem;
    izYaz(Date.now());
    durumYaz('Eşitleniyor; bitince ' + (islem === 'pas' ? 'cevap gösterilecek.' : 'kontrol edilecek.'), '');
    beklemeIletisi = true;
    return true;
  }

  function esitlemeTamam() {
    if (esitlemeBitti) return;
    esitlemeBitti = true;
    var islem = ertelenen;
    /* Beklerken yazılan değişip kelime eksik kaldıysa (son harf silindi; "Bir harf aç" yazılanı
       açılan harfin önünde kesti) söz verilen kontrol düşer: kendiliğinden "eksik" uyarısı
       çıkmaz, kaydın değiştiği de söylenmez (işlenecek cevap yoktu). Bekleme iletisi hâlâ
       ekrandaysa kaldırılır; başka ileti (harf açıldı) kalır. */
    if (islem === 'kontrol' && simdi && !simdi.tur.bitti && !tamYazili()) {
      ertelemeyiBirak();
      if (beklemeIletisi) durumYaz('', '');
      return;
    }
    if (islem && simdi && !simdi.tur.bitti && !ayniKayit(simdi.anlik, tazeKayit(simdi.d.e))) {
      /* Birleşim tam bu kelimenin kaydını değiştirdi: cevap eski seviyeyle verilmişti,
         işlenmez. Motor sayfayı birazdan yeniler; iz yerinde kalır ki yeni açılış bunu
         söylesin (yenilenmezse sıradaki kelimede silinir). */
      ertelenen = null;
      bayat = true;
      durumYaz('Eşitleme bu kelimenin kaydını değiştirdi; cevabın işlenmedi.', 'uyari');
      return;
    }
    ertelemeyiBirak();
    if (!islem || !simdi || simdi.tur.bitti) return;
    if (islem === 'pas') pasGec(); else kontrol();
  }

  window.addEventListener('yds-esitleme-durumu', function (e) {
    var suruyordu = esitlemeSuruyor();
    esitlemeDurumu = (e && e.detail && e.detail.durum) || '';
    if (suruyordu && !esitlemeSuruyor()) esitlemeTamam();
  });
  window.setTimeout(esitlemeTamam, ESITLEME_BEKLEME_MS);

  /* ---------- olaylar ---------- */

  $('katmanlar').addEventListener('click', function (e) {
    var b = e.target.closest('.katman');
    if (!b) return;
    var k = parseInt(b.getAttribute('data-k'), 10);
    var i = secili.indexOf(k);
    if (i === -1) secili.push(k); else secili.splice(i, 1);
    secili.sort(function (x, y) { return x - y; });
    var not = kaydet();
    katmanBayat = false;
    if (Depo.yaz(KATMAN_ANAHTAR, secili) === false) window.YDS.depolamaUyarisi();
    siraDuyur = true;
    yukleVeKur(false, not);
  });

  modDugmeleri.forEach(function (b) {
    b.addEventListener('click', function () {
      var m = b.getAttribute('data-mod');
      if (m === mod) return;
      var not = kaydet();
      mod = m;
      siraDuyur = true;
      yenile(false, not);
    });
  });

  /* İmleç hep sonda: görünmez kutunun ortasına tıklanınca araya harf girmesin. Tek
     istisna Ctrl/Cmd+A: tümünü seçip yeniden yazmak yazılanı değiştirmeli. (Seçim
     görünmediği için başka yoldan oluşan seçim — Tab ile dönüş, çift tıklama —
     korunmaz; yoksa ilk tuş yazılanları sessizce silerdi.) */
  var tumuSecili = false;
  function sonaAl() {
    if (tumuSecili && girdi.value !== '') return;
    try { girdi.setSelectionRange(girdi.value.length, girdi.value.length); } catch (e) {}
  }
  girdi.addEventListener('keydown', function (e) {
    tumuSecili = (e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'a' || e.key === 'A');
  });
  ['blur', 'click', 'input'].forEach(function (olay) {
    girdi.addEventListener(olay, function () { tumuSecili = false; });
  });
  ['focus', 'click', 'keyup', 'select'].forEach(function (olay) { girdi.addEventListener(olay, sonaAl); });

  /* Harfler girdinin input olayından gelir (Android'de keydown güvenilmez). Tur bittiyse
     yazılan yok sayılır. Bileşim sürerken (Android klavyesi) değere dokunulmaz: harf
     çiftlenebilir; kutular temizlenmiş hâli gösterir, değer bileşim bitince düzeltilir. */
  function girdiIsle(e) {
    if (!simdi || simdi.tur.bitti) {
      if (girdi.value !== '') girdi.value = '';
      return;
    }
    var temiz = O.temizle(girdi.value, O.harfSayisi(simdi.tur.kelime));
    if (temiz !== girdi.value && !(e && e.isComposing)) girdi.value = temiz;
    elHarfler.classList.remove('yanlis');
    girdi.removeAttribute('aria-invalid');
    if (gecici) durumYaz('', '');
    harfleriCiz();
    iziEsle();
  }
  girdi.addEventListener('input', girdiIsle);
  girdi.addEventListener('compositionend', function () { girdiIsle(null); });

  // Enter: "Kontrol et"; biten kelimede sonraki kelime.
  $('oyunForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!simdi) return;
    if (simdi.tur.bitti) { sonraki(); return; }
    kontrol();
    girdi.focus();
  });

  /* Odak hiçbir öğede değilken (sayfa yeni açıldı ya da boş bir yere tıklandı) yazılan
     harf girdiye gider: kutulara tıklamadan yazmaya başlanabilsin; biten kelimede Enter
     sonraki kelimeye geçer. Bir düğme, bağlantı ya da başka bir alan odaktaysa dokunulmaz.
     Kısayol değildir: tuşun kendi işi (harfin yazılması) girdide sürer. */
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    var odaktaki = document.activeElement;
    if (odaktaki && odaktaki !== document.body && odaktaki !== document.documentElement && odaktaki.id !== 'icerik') return;
    if (!simdi || elKart.hidden || typeof e.key !== 'string') return;
    if (e.key === 'Enter') {
      if (simdi.tur.bitti) { e.preventDefault(); sonraki(); }
      return;
    }
    if (!simdi.tur.bitti && e.key.length === 1 && /[a-zİı]/i.test(e.key)) odakla(girdi);
  });

  elHarf.addEventListener('click', function () {
    if (simdi && !simdi.tur.bitti) harfAc();
    girdi.focus();
  });

  elPas.addEventListener('click', function () {
    pasGec();
    girdi.focus();
  });

  /* Dinle'den sonra odak girdiye döner ki Enter sonraki kelimeye geçsin; ama sayfa
     kaydırılmaz, dokunmatik ekranda da odak taşınmaz: klavye açılır, okunan örnek
     cümleler ekrandan çıkardı. */
  $('oyunDinle').addEventListener('click', function () {
    if (simdi && simdi.tur.bitti) seslendir(simdi.d.e);
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    try { girdi.focus({ preventScroll: true }); } catch (e) { girdi.focus(); }
  });

  var yukDeneniyor = false;
  elYukDene.addEventListener('click', function () {
    if (yukDeneniyor) return;
    yukDeneniyor = true;
    Promise.all(eksikKatmanlar().map(katmanDene)).then(function () {
      yukDeneniyor = false;
      yukNotuCiz();
      if (!elYuk.hidden) return;
      // Sıra aynı kalır; yalnız ekrandaki kelimenin anlamı ayrıntılı hâle gelir.
      if (simdi && !elKart.hidden) {
        anlamCiz();
        if (simdi.tur.bitti) sonucCiz();
        girdi.focus();
      }
    }).catch(function () { yukDeneniyor = false; });
  });

  /* Başka sekme ya da bulut ilerlemeyi / katman seçimini değiştirdi (sayfanın kendi
     yazımları 'yerel' ve 'kart' kaynaklıdır, yok sayılır). Sıra bayat işaretlenir;
     üzerinde çalışılan bir kelime yoksa hemen, varsa "Sonraki kelime"de yeniden kurulur.
     Bu yolda girdi değerine dokunulmaz. */
  function mesgul() {
    return !!simdi && !elKart.hidden &&
      (!!simdi.tur.bitti || girdi.value !== '' || simdi.tur.deneme > 0 || simdi.tur.ipucu);
  }

  var tazeleZamani = null;
  function bayatla() {
    window.clearTimeout(tazeleZamani);
    tazeleZamani = window.setTimeout(function () {
      gunlukCiz();
      if ((bayat || katmanBayat) && !yukleniyor && !mesgul()) yenile(false, null, true);
    }, 150);
  }

  window.addEventListener('yds-depo-degisti', function (e) {
    var d = e && e.detail;
    if (!d || (d.kaynak !== 'bulut' && d.kaynak !== 'sekme')) return;
    var a = d.anahtarlar;
    var katman = !a || a.indexOf(KATMAN_ANAHTAR) !== -1;
    var ilerleme = !a || a.indexOf(LEITNER_ANAHTAR) !== -1;
    if (katman) katmanBayat = true;
    if (katman || ilerleme) bayat = true;
    bayatla();
  });

  // Geri/ileri önbelleğinden dönen sayfa: arada başka sayfada (Kelimeler) çalışılmış olabilir.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    bayat = true;
    katmanBayat = true;
    bayatla();
  });

  // Sayfa kapanırken ya da arka plana geçerken bekleyen sonuç kaybolmasın.
  window.addEventListener('pagehide', function () { kaydet(); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') kaydet();
  });

  /* ---------- başlat ---------- */

  gunlukCiz();
  yukleVeKur(false, acilisNotu());
})();
