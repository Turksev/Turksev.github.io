/* Oyunlar — yazma oyununun saf mantığı: seviye ve açık harf hesabı, bir kelimenin
   turu (durum makinesi), anlamdaki sızıntıyı maskeleme, soru sırası ve sayılar.
   DOM, depolama, saat ve rastgelelik kullanmaz; başka betiğe bağlı değildir. Gün
   numarası ile ilerleme kayıtları çağırandan gelir. Birim testi:
   tools/test-uretim/oyun-hesap-test.js */
(function () {
  'use strict';
  var Y = window.YDS = window.YDS || {};

  // Kutu 0..5 → açık gelen harf yüzdesi (0 = hiç çalışılmadı, 5 = öğrenildi).
  var YUZDELER = [50, 40, 30, 20, 10, 0];
  var DENEME_HAKKI = 3;
  var MASKE = '•••';
  var HARF = /^[a-z]$/i;
  var OYNANIR = /^[a-z]+(?:[- ][a-z]+)*$/i;
  var TR_HARF = 'çğıöşüâîû';
  // İki yazımı da dizinde bulunan, -ise/-ize ve -re/-er kurallarına girmeyen çiftler.
  var YAZIM_CIFTLERI = ['grey/gray', 'defence/defense', 'artefact/artifact', 'practised/practiced',
    'practise/practice', 'licence/license', 'mom/mum', 'chile/chili'];
  // Maskeden sonra tek başına kalırsa ipucu sayılmayan yardımcı fiiller ("••• etmek").
  var ZAYIF_IPUCU = ['etmek', 'olmak', 'yapmak', 'edilmek'];
  // Anlamdaki İngilizce sözcüğü dil bilgisi notunun öznesi yapan devam: "mean fiilinin …", "taxi'nin çoğulu".
  var NOT_SONRASI = /^(?:'[a-zçğıöşü]+)?\s+(?:fiilinin|sözcüğünün|kelimesinin|sıfatının|isminin|zarfının)(?![a-zçğıöşü])|^'[a-zçğıöşü]+\s+(?:çoğulu|çoğul|karşılaştırma|üstünlük)(?![a-zçğıöşü])/;

  /* ---------- yazım ---------- */

  /* Küçük harf; I, İ (U+0130), ı (U+0131) ve "i + birleşen nokta" (U+0307) → i.
     Türkçe klavyeden gelen harf kutu sayısını bozmasın: 'İ'.toLowerCase() iki birimdir. */
  function sade(metin) {
    return String(metin == null ? '' : metin)
      .replace(/[I\u0130\u0131]/g, 'i').toLowerCase().replace(/i\u0307/g, 'i');
  }

  function temizle(metin, azami) {
    var s = sade(metin).replace(/[^a-z]/g, '');
    if (typeof azami !== 'number' || azami !== azami) return s;
    return s.slice(0, Math.max(0, Math.floor(azami)));
  }

  /* Yazılabilir başlık: yalnız harf, tek tire ya da tek boşlukla ayrılmış parçalar.
     Eğik çizgili, kesme işaretli, "+ V3" kalıpları ve modal yapılar oyun dışıdır.
     Türkçesi aynı yazılan kelimeler de (protein, robot) dışarıdadır: anlam maskelenince
     ipucu kalmaz, kart bilgiyle çözülemezdi. Karar dizindeki kısa anlama (d.t) göre verilir. */
  function oynanabilir(d) {
    return !!d && typeof d.e === 'string' && OYNANIR.test(d.e) &&
      String(d.y == null ? '' : d.y).indexOf('modal yapı') === -1 &&
      ipucuKalir(d.t, d.e);
  }

  /* a ile b aynı kelimenin iki yazımı mı? Yalnız biçime bakar:
       -ise/-ize, -yse/-yze  tek harf (s ↔ z), önceki harf i ya da y, en az 6 harf
       -re/-er               son iki harf yer değiştirmiş, en az 5 harf
       YAZIM_CIFTLERI        elle sayılan çiftler (grey/gray …)
     "surprize" gibi var olmayan yazımı elemek çağıranın işidir (bkz. iliski). */
  function yazimCesidi(a, b) { return ayniYazim(sade(a), sade(b)); }

  // İkisi de küçük harfli; anlam maskesi her sözcük için çağırdığından sade'siz.
  function ayniYazim(a, b) {
    if (a.length !== b.length || !a || a === b) return false;
    var fark = [], i, ikili, once, sa, sb;
    for (i = 0; i < a.length; i++) {
      if (a.charAt(i) !== b.charAt(i)) {
        if (fark.length === 2) return false;
        fark.push(i);
      }
    }
    if (fark.length === 1) {
      i = fark[0];
      ikili = a.charAt(i) + b.charAt(i);
      once = a.charAt(i - 1);
      if ((ikili === 'sz' || ikili === 'zs') && a.length >= 6 && (once === 'i' || once === 'y')) return true;
    }
    if (fark.length === 2 && a.length >= 5 && fark[0] === a.length - 2) {
      sa = a.slice(-2);
      sb = b.slice(-2);
      if ((sa === 're' && sb === 'er') || (sa === 'er' && sb === 're')) return true;
    }
    return YAZIM_CIFTLERI.indexOf(a + '/' + b) !== -1 || YAZIM_CIFTLERI.indexOf(b + '/' + a) !== -1;
  }

  /* Yazılan aday (küçük harf), d kartıyla ilişkili mi? bul(aday): dizinde o yazımla bir
     başlık varsa kaydı, yoksa boş değer. Dönen:
       'yazim'  aynı kelimenin öteki yazımı (analyze ↔ analyse): doğru sayılır
       'es'     kısa anlamı ve türü aynı başka bir başlık (almost ↔ nearly): deneme harcanmaz
       null     ilişkisiz */
  function iliski(aday, d, bul) {
    var o = d && typeof bul === 'function' ? bul(aday) : null;
    if (!o || o === d) return null;
    if (yazimCesidi(aday, d.e)) return 'yazim';
    return o.t === d.t && o.y === d.y ? 'es' : null;
  }

  /* ---------- seviye ---------- */

  // İçe aktarılmış bozuk kutu değeri dizin taşırmasın: tam sayı 0..5.
  function kutuDuzelt(k) {
    if (typeof k !== 'number' || k !== k || k <= 0) return 0;
    return k >= 5 ? 5 : Math.floor(k);
  }
  function yuzde(kutu) { return YUZDELER[kutuDuzelt(kutu)]; }
  function seviyeNo(kutu) { return kutuDuzelt(kutu) + 1; }

  function harfSayisi(kelime) {
    return String(kelime == null ? '' : kelime).replace(/[^a-z]/gi, '').length;
  }

  /* Yarım yukarı yuvarlanır (tam sayı aritmetiği); en az bir harf hep yazılır. */
  function acikSayisi(n, kutu) {
    n = Math.max(0, Math.floor(Number(n) || 0));
    var acik = Math.floor((n * yuzde(kutu) + 50) / 100);
    return Math.max(0, Math.min(acik, n - 1));
  }

  /* Tohumlu sözde rastgele: FNV-1a özeti → mulberry32. Aynı (kelime, kutu, gün)
     hep aynı harfleri açar; sayfa aynı gün yenilenince başka harf görünmez. */
  function ozet(metin) {
    var h = 0x811c9dc5, i;
    for (i = 0; i < metin.length; i++) {
      h ^= metin.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }
  function uretec(tohum) {
    var a = tohum >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Açık gelen harflerin başlık içindeki konumları (artan). Harf konumları
     üzerinde kısmi Fisher–Yates; tire ve boşluk seçime girmez. */
  function acikKonumlar(kelime, kutu, gun) {
    kelime = String(kelime == null ? '' : kelime);
    kutu = kutuDuzelt(kutu);
    var konum = [], i, j, t;
    for (i = 0; i < kelime.length; i++) if (HARF.test(kelime.charAt(i))) konum.push(i);
    var adet = acikSayisi(konum.length, kutu);
    var rastgele = uretec(ozet(kelime + '|' + kutu + '|' + gun));
    for (i = 0; i < adet; i++) {
      j = i + Math.floor(rastgele() * (konum.length - i));
      t = konum[i]; konum[i] = konum[j]; konum[j] = t;
    }
    return konum.slice(0, adet).sort(function (a, b) { return a - b; });
  }

  /* ---------- bir kelimenin turu ---------- */

  /* Tur nesnesi (işlevler bunu yerinde değiştirir):
       kelime    başlık, dizindeki yazımıyla ("Celsius", "well-being")
       kutu      kelime gösterildiği andaki kutu, 0..5
       gun       açık harflerin tohumundaki gün numarası
       hucreler  her karakter için {c, tur}; c başlığın kendi karakteri, tur:
                 'ayrac' (tire/boşluk; yazılmaz), 'acik' (görünür), 'bos' (yazılacak).
                 Sonradan açılan hücrede bulundu:true (kullanıcı doğru yazdı) ya da
                 ipucu:true ("Bir harf aç") bulunur. Tur bittiğinde 'bos' kalanlar
                 kullanıcının bulamadığı harflerdir.
       deneme    yanlış deneme sayısı (0..DENEME_HAKKI)
       ipucu     "Bir harf aç" kullanıldı mı
       bitti     null | 'dogru' | 'ipucuyla' | 'yanlis'
       yazim     kabul edilen öteki yazım ("analyse" kartında "analyze") ya da null */
  function turBaslat(kelime, kutu, gun) {
    kelime = String(kelime == null ? '' : kelime);
    kutu = kutuDuzelt(kutu);
    var acik = acikKonumlar(kelime, kutu, gun), hucreler = [], i, c;
    for (i = 0; i < kelime.length; i++) {
      c = kelime.charAt(i);
      hucreler.push({ c: c, tur: !HARF.test(c) ? 'ayrac' : (acik.indexOf(i) !== -1 ? 'acik' : 'bos') });
    }
    return { kelime: kelime, kutu: kutu, gun: gun, hucreler: hucreler,
      deneme: 0, ipucu: false, bitti: null, yazim: null };
  }

  // Yazılacak hücrelerin başlık içindeki konumları, sırayla.
  function bosKonumlar(tur) {
    var out = [], i;
    for (i = 0; i < tur.hucreler.length; i++) if (tur.hucreler[i].tur === 'bos') out.push(i);
    return out;
  }
  function bosSayisi(tur) { return bosKonumlar(tur).length; }

  /* Çizim için hücreler: {c, tur, bulundu, ipucu, simdi}. Boş hücrede c yazılan
     harftir (yoksa ''), simdi sıradaki boşluktur. Tur bittiyse her hücre kendi harfini gösterir. */
  function hucreGorunumu(tur, yazilan) {
    var y = temizle(yazilan, bosSayisi(tur)), sira = 0;
    return tur.hucreler.map(function (h) {
      var g = { c: h.c, tur: h.tur, bulundu: !!h.bulundu, ipucu: !!h.ipucu, simdi: false };
      if (h.tur === 'bos' && !tur.bitti) {
        g.c = y.charAt(sira);
        g.simdi = sira === y.length;
        sira++;
      }
      return g;
    });
  }

  function cevap(tur, durum, yazilan, aday) {
    return { durum: durum, kalan: Math.max(0, DENEME_HAKKI - tur.deneme), yazilan: yazilan, aday: aday };
  }

  /* "Kontrol et". yazilan: boşlukların harfleri, sırayla. bag(aday): yanlış adayın bu
     kartla ilişkisi (isteğe bağlı; aday küçük harflidir): 'yazim' aynı kelimenin öteki
     yazımıdır ve doğru sayılır, başka her doğru değer aynı anlamlı başka kelimedir.
     durum: 'eksik' (deneme harcanmaz) | 'dogru' (tur.bitti 'dogru' ya da 'ipucuyla';
     öteki yazım kabul edildiyse tur.yazim dolu) | 'es' (aynı anlamlı başka kelime;
     hiçbir şey değişmez) | 'yanlis' (doğru harfler kilitlenir) | 'bitti' (hak bitti
     ya da tur zaten bitmişti). */
  function dene(tur, yazilan, bag) {
    if (tur.bitti) return cevap(tur, 'bitti', '', '');
    var bos = bosKonumlar(tur), h = tur.hucreler, y = temizle(yazilan, bos.length);
    if (y.length < bos.length) return cevap(tur, 'eksik', y, '');

    var hedef = sade(tur.kelime), aday = '', sira = 0, yazim = null, baglanti, i;
    for (i = 0; i < h.length; i++) aday += h[i].tur === 'bos' ? y.charAt(sira++) : sade(h[i].c);

    if (aday !== hedef && typeof bag === 'function') {
      baglanti = bag(aday);
      if (baglanti === 'yazim') yazim = aday;
      else if (baglanti) return cevap(tur, 'es', y, aday);
    }
    if (aday === hedef || yazim) {
      for (i = 0; i < bos.length; i++) { h[bos[i]].tur = 'acik'; h[bos[i]].bulundu = true; }
      tur.yazim = yazim;
      tur.bitti = tur.deneme === 0 && !tur.ipucu ? 'dogru' : 'ipucuyla';
      return cevap(tur, 'dogru', '', aday);
    }

    tur.deneme++;
    for (i = 0; i < bos.length; i++) {
      if (y.charAt(i) === sade(h[bos[i]].c)) { h[bos[i]].tur = 'acik'; h[bos[i]].bulundu = true; }
    }
    if (tur.deneme >= DENEME_HAKKI) { tur.bitti = 'yanlis'; return cevap(tur, 'bitti', '', aday); }
    return cevap(tur, 'yanlis', '', aday);
  }

  /* "Bir harf aç": yazılanı eksik ya da yanlış olan ilk boşluk açılır; ondan sonra
     yazılanlar yerinde kalır. Hepsi doğru yazılmışsa ilk boşluk açılır. Deneme
     harcamaz, ipucu sayılır. Tek boşluk kaldıysa ya da tur bittiyse null. */
  function harfAc(tur, yazilan) {
    if (tur.bitti) return null;
    var bos = bosKonumlar(tur), i;
    if (bos.length < 2) return null;
    var y = temizle(yazilan, bos.length);
    for (i = 0; i < bos.length; i++) if (y.charAt(i) !== sade(tur.hucreler[bos[i]].c)) break;
    if (i === bos.length) i = 0;
    tur.hucreler[bos[i]].tur = 'acik';
    tur.hucreler[bos[i]].ipucu = true;
    tur.ipucu = true;
    return { yazilan: y.slice(0, i) + y.slice(i + 1), konum: bos[i] };
  }

  // "Bilemedim, göster".
  function birak(tur) {
    if (!tur.bitti) tur.bitti = 'yanlis';
    return tur.bitti;
  }

  /* Sonuçtan sonra beklenen kutu: Ilerleme.dogru / ipucuyla / yanlis ile aynı kural. */
  function sonKutu(kutu, sonuc) {
    var k = kutuDuzelt(kutu);
    if (sonuc === 'dogru') return Math.min(5, k + 1);
    if (sonuc === 'ipucuyla') return Math.max(1, k);
    if (sonuc === 'yanlis') return Math.max(1, k - 1);
    return k;
  }

  /* ---------- anlam ve ekran okuyucu metni ---------- */

  function harfMi(c) {
    return !!c && ((c >= 'a' && c <= 'z') || TR_HARF.indexOf(c) !== -1);
  }

  // Uzunluğu koruyan küçük harf: 'İ'.toLowerCase() iki birim olduğundan konumlar kayardı.
  function kucuk(metin) {
    var out = metin.toLowerCase(), i, c, k;
    if (out.length === metin.length) return out;
    out = '';
    for (i = 0; i < metin.length; i++) {
      c = metin.charAt(i);
      k = c === '\u0130' ? 'i' : c.toLowerCase();
      out += k.length === 1 ? k : c;
    }
    return out;
  }

  function asciiMi(t) { return /^[a-z]+$/.test(t); }

  // Sondaki e ya da y düşer: make → mak(ing), try → tr(ies), hostility → hostilit(ies).
  function govde(x) { return x.length >= 3 && /[ey]$/.test(x) ? x.slice(0, -1) : x; }

  // İki sözcük arasında en çok bir harf farkı (değişme, ekleme ya da silme).
  function birFark(a, b) {
    var i = 0;
    if (Math.abs(a.length - b.length) > 1) return false;
    while (i < a.length && i < b.length && a.charAt(i) === b.charAt(i)) i++;
    if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
    return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
  }

  /* Parantez içindeki İngilizce sözcük t, başlığın (harfleri h) kökü, çekimi ya da yakın
     yazımı mı? Dört harften kısa sözcüğe bakılmaz: parantezde "bir", "ile" gibi Türkçe
     sözcükler de geçer ("birch" kartında "(bir ağaç türü)"). */
  function ayniKok(t, h) {
    if (t === h) return true;
    if (t.length < 4) return false;
    if (h.length >= 4 && t.indexOf(h) !== -1) return true;                 // wright: playwright
    if (h.indexOf(t) === 0 && h.length - t.length <= 4) return true;       // means: mean
    // tie: tied (üç harfli başlıkta en çok iki harf uzun: hay, "hayvan"ı maskelemez)
    if (h.length >= 3 && t.indexOf(h) === 0 && (h.length >= 4 || t.length - h.length <= 2)) return true;
    var gt = govde(t), gh = govde(h);
    if (gt.length >= 3 && h.indexOf(gt) === 0 && h.length - gt.length <= 4) return true;   // making: make
    if (gh.length >= 3 && t.indexOf(gh) === 0 && t.length - gh.length <= 4) return true;                  // hostility: hostilities
    return Math.min(t.length, h.length) >= 5 && birFark(t, h);             // enrolment: enrollment
  }

  /* Anlamın içinde cevabı ele veren yerleri ••• yapar (düz metin döner; kaçış çağıranın işi).
     Harf sayılanlar: a-z ve çğıöşüâîû. Beş kural:
       A  Başlığın kendisi, sözcük başında. 4+ harfli başlıkta önek yeter ("absorbe" → "•••e"),
          daha kısasında sözcüğün tamamı tutmalı. Başlıktaki tire ya da boşluk metinde tire,
          boşluk ya da bitişik yazımla eşleşir ("bring-up" ↔ "(bring up)").
       B  Çok parçalı başlığın 4+ harfli her parçası, sözcük başında ("risk-free" → "•••siz").
       C  Parantez içindeki İngilizce sözcük, başlığın kökü ya da çekimiyse ("(be tied to)",
          "(çoğul: hostilities)", "(… playwright, shipwright)").
       D  Dil bilgisi notunun öznesi, her yerde ve kökü başlığa benzemese de ("mean fiilinin
          üçüncü tekil biçimi", "make fiilinin geçmiş biçimi", "mouse sözcüğünün çoğulu"):
          not zaten biçimi söyler, kökü kullanıcı bulur.
       E  Başlığın öteki yazımı, her yerde ("organise" kartında "organize etmek").
     C, D ve E sözcüğün tamamını gizler. Türkçe karşılıklar ("stres", "proje", "sistem")
     ipucunun kendisidir, açık kalır. */
  function maskele(metin, kelime) {
    metin = String(metin == null ? '' : metin);
    var aranan = kucuk(String(kelime == null ? '' : kelime)), h = aranan.replace(/[- ]/g, '');
    if (!h) return metin;
    var alt = kucuk(metin), n = alt.length, gizle = [], i, j, k, c, m, bitis;
    for (i = 0; i < n; i++) gizle.push(false);

    // A ve B
    var kaliplar = [{ govde: aranan, tam: harfSayisi(aranan) < 4 }], parcalar = aranan.split(/[- ]/), ifade, govdeIfade;
    if (parcalar.length > 1) {
      for (i = 0; i < parcalar.length; i++) if (parcalar[i].length >= 4) kaliplar.push({ govde: parcalar[i], tam: false });
    }
    for (k = 0; k < kaliplar.length; k++) {
      govdeIfade = '';
      for (i = 0; i < kaliplar[k].govde.length; i++) {
        c = kaliplar[k].govde.charAt(i);
        govdeIfade += c === '-' || c === ' ' ? '[- ]?' : c.replace(/[.*+?^${}()|[\]\\\/]/, '\\$&');
      }
      ifade = new RegExp(govdeIfade, 'g');
      while ((m = ifade.exec(alt))) {
        bitis = m.index + m[0].length;
        if (!harfMi(alt.charAt(m.index - 1)) && !(kaliplar[k].tam && harfMi(alt.charAt(bitis)))) {
          for (j = m.index; j < bitis; j++) gizle[j] = true;
        }
        ifade.lastIndex = m.index + 1;
      }
    }

    // C, D, E: sözcük sözcük
    var derinlik = 0, t, hepsi;
    i = 0;
    while (i < n) {
      c = alt.charAt(i);
      if (c === '(') derinlik++;
      else if (c === ')' && derinlik > 0) derinlik--;
      if (!harfMi(c)) { i++; continue; }
      j = i;
      while (j < n && harfMi(alt.charAt(j))) j++;
      t = alt.slice(i, j);
      hepsi = true;
      for (k = i; k < j; k++) if (!gizle[k]) hepsi = false;
      if (!hepsi && asciiMi(t) && (ayniYazim(t, h) ||
          (derinlik > 0 && ayniKok(t, h)) ||
          NOT_SONRASI.test(alt.slice(j)))) {
        for (k = i; k < j; k++) gizle[k] = true;
      }
      i = j;
    }

    var out = '';
    i = 0;
    while (i < n) {
      if (!gizle[i]) { out += metin.charAt(i); i++; continue; }
      out += MASKE;
      while (i < n && gizle[i]) i++;
    }
    return out;
  }

  /* Maskeden sonra anlamda işe yarar bir ipucu kalıyor mu? Baştaki tür kısaltması ("i.",
     "s./i."), maskeye bitişik ek ("•••lamak") ve tek başına yardımcı fiil ("••• etmek")
     ipucu sayılmaz. */
  function ipucuKalir(metin, kelime) {
    var alt = kucuk(String(metin == null ? '' : metin)), aranan = kucuk(String(kelime == null ? '' : kelime));
    var soz = alt.match(/[a-zçğıöşüâîû]+/g) || [], on = aranan.split(/[- ]/), i, j, p, acik;
    /* Hızlı yol (bütün dizin her açılışta süzülür): Türkçe harf taşıyan ve başlıkla ya da
       bir parçasıyla başlamayan sözcüğü hiçbir kural gizlemez (A ve B sözcük başı arar,
       C-E yalnız a-z sözcüklere bakar); böyle bir sözcük varsa maskelemeye gerek yok. */
    on.push(aranan.replace(/[- ]/g, ''));
    for (i = 0; i < soz.length; i++) {
      if (asciiMi(soz[i])) continue;
      acik = true;
      for (j = 0; j < on.length; j++) if (on[j] && soz[i].indexOf(on[j]) === 0) acik = false;
      if (acik) return true;
    }
    var s = kucuk(maskele(metin, kelime)).replace(/^[a-zçğıöşü]{1,3}\.(?:\/[a-zçğıöşü]{1,3}\.)*\s*/, '');
    var parca = s.split(MASKE);
    for (i = 0; i < parca.length; i++) {
      p = parca[i];
      if (i > 0) {
        j = 0;
        while (j < p.length && harfMi(p.charAt(j))) j++;
        p = p.slice(j);
      }
      soz = p.match(/[a-zçğıöşüâîû]+/g) || [];
      for (j = 0; j < soz.length; j++) if (ZAYIF_IPUCU.indexOf(soz[j]) === -1) return true;
    }
    return false;
  }

  /* Girdinin açıklaması (aria-describedby). Yazılan harfler katılmaz: metin her tuşta
     değişmesin. Tur bitene kadar boş hücrelerin harfi geçmez. */
  function tarif(tur) {
    var bos = bosSayisi(tur);
    var bas = harfSayisi(tur.kelime) + ' harfli İngilizce kelime: ' + tur.hucreler.map(function (h) {
      // "boşluk" denmez: yazılacak hücrenin adı olan "boş" ile karışır.
      if (h.tur === 'ayrac') return h.c === '-' ? 'tire' : (h.c === ' ' ? 'sözcük arası' : h.c);
      return h.tur === 'bos' && !tur.bitti ? 'boş' : h.c;
    }).join(', ') + '. ';
    if (tur.bitti) return bas + 'Kelime tamamlandı; Enter ile sonraki kelimeye geç.';
    return bas + (bos === 1 ? '1 eksik harfi yaz' : bos + ' eksik harfi sırayla yaz') + ', Enter ile kontrol et.';
  }

  /* ---------- soru sırası ---------- */

  function sayiMi(x) { return typeof x === 'number' && isFinite(x); }

  /* Kelimenin bugünkü grubu. bak = {kayit: function (kelime, dizinKaydi) → null | {k, g, c},
     bugun: gün numarası}. Kayıt bozuk olabilir (içe aktarma): kutu kırpılır ve 0 çıkarsa
     kelime yeni sayılır; 1-4. kutuda vadesi okunamayan kayıt vadesi gelmiş, 5. kutuda
     son çalışma günü okunamayan kayıt en eski sayılır.
       yeni      hiç çalışılmadı
       tekrar    1-4. kutu, vadesi geldi (g <= bugün)
       bekleyen  1-4. kutu, vadesi gelmedi: sorulmaz, yoksa erken yükselirdi
       ogrenilen 5. kutu, bugün çalışılmadı (c < bugün)
       bugunku   5. kutu, bugün çalışıldı: bugün yeniden sorulmaz */
  function grupla(d, bak) {
    var r = bak && typeof bak.kayit === 'function' ? bak.kayit(d.e, d) : null;
    var k = r ? kutuDuzelt(r.k) : 0, bugun = bak ? bak.bugun : NaN;
    if (!k) return { grup: 'yeni', olcu: 0 };
    if (k >= 5) {
      if (!sayiMi(r.c)) return { grup: 'ogrenilen', olcu: -Infinity };
      return { grup: r.c < bugun ? 'ogrenilen' : 'bugunku', olcu: r.c };
    }
    if (!sayiMi(r.g)) return { grup: 'tekrar', olcu: -Infinity };
    return { grup: r.g <= bugun ? 'tekrar' : 'bekleyen', olcu: r.g };
  }

  // Ölçüye göre artan; eşitlikte havuz sırası korunur (sort kararlılığına güvenilmez).
  function sirala(liste) {
    return liste.sort(function (a, b) {
      return a.olcu < b.olcu ? -1 : (a.olcu > b.olcu ? 1 : a.i - b.i);
    }).map(function (x) { return x.d; });
  }

  /* Sorulacak kelimeler (yeni dizi). havuz dizin sırasındadır ve yeniden sıralanmaz.
       'sira'      vadesi gelenler (en çok geciken önce), sonra yeni kelimeler
       'yeni'      yalnız yeni kelimeler
       'ogrenilen' 5. kutudakiler, en uzun süredir çalışılmayan önce */
  function sira(havuz, mod, bak) {
    var tekrar = [], yeni = [], ogrenilen = [], i, g;
    havuz = havuz || [];
    for (i = 0; i < havuz.length; i++) {
      g = grupla(havuz[i], bak);
      if (g.grup === 'yeni') yeni.push(havuz[i]);
      else if (g.grup === 'tekrar') tekrar.push({ d: havuz[i], olcu: g.olcu, i: i });
      else if (g.grup === 'ogrenilen') ogrenilen.push({ d: havuz[i], olcu: g.olcu, i: i });
    }
    if (mod === 'yeni') return yeni;
    if (mod === 'ogrenilen') return sirala(ogrenilen);
    return sirala(tekrar).concat(yeni);
  }

  /* Mod düğmeleri ve bilgi satırı için sayılar. ogrenilenToplam 5. kutunun tamamıdır;
     tekrar + yeni + bekleyen + ogrenilenToplam = toplam. */
  function sayilar(havuz, bak) {
    var s = { tekrar: 0, yeni: 0, ogrenilen: 0, ogrenilenToplam: 0, bekleyen: 0, toplam: 0 }, i, g;
    havuz = havuz || [];
    s.toplam = havuz.length;
    for (i = 0; i < havuz.length; i++) {
      g = grupla(havuz[i], bak).grup;
      if (g === 'bugunku') s.ogrenilenToplam++;
      else {
        s[g]++;
        if (g === 'ogrenilen') s.ogrenilenToplam++;
      }
    }
    return s;
  }

  Y.OyunHesap = {
    YUZDELER: YUZDELER.slice(), DENEME_HAKKI: DENEME_HAKKI,
    sade: sade, temizle: temizle, oynanabilir: oynanabilir, yazimCesidi: yazimCesidi, iliski: iliski,
    kutuDuzelt: kutuDuzelt, yuzde: yuzde, seviyeNo: seviyeNo,
    harfSayisi: harfSayisi, acikSayisi: acikSayisi, acikKonumlar: acikKonumlar,
    turBaslat: turBaslat, bosSayisi: bosSayisi, hucreGorunumu: hucreGorunumu,
    dene: dene, harfAc: harfAc, birak: birak, sonKutu: sonKutu,
    maskele: maskele, ipucuKalir: ipucuKalir, tarif: tarif, sira: sira, sayilar: sayilar
  };
})();
