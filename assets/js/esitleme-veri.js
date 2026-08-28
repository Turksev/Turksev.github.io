/* ============================================================
   Eşitleme veri motoru — saf (depolamaya kendisi dokunmaz)

   Her kayıt bir değişiklik sürümüyle tutulur. Silinen kayıtlar da işaret
   olarak kaldığı için çevrimdışı bir cihaz onları yeniden canlandıramaz.
   Bu dosya yalnız dönüştürme/birleştirme yapar; localStorage ve Firestore
   bağlantıları main.js, esitleme-depo.js ve esitleme-v2.js tarafından kurulur.
   ============================================================ */

(function () {
  'use strict';

  window.YDS = window.YDS || {};

  var TIPLER = {
    'yds-leitner': 'nesne',
    'yds-yanlis': 'yanlis-dizi',
    'yds-kategori': 'nesne',
    'yds-gecmis': 'gecmis-dizi',
    'yds-konular': 'nesne',
    'yds-rekor': 'tek',
    'yds-yeni-sayac': 'tek',
    'yds-test-yanlis': 'nesne',
    'yds-gunluk-yeni': 'tek',
    'yds-gunluk-tavan': 'tek',
    'yds-katmanlar': 'tek',
    'yds-eksen': 'tek'
  };

  /* Üretim verisinde düzeltilen eski kelime başlıkları. Görünen kanonik başlık
     öbekle aynıysa yalnız KELİME kartı ayrı bir iç kimlik kullanır. Eski tireli
     alias bu kelime kimliğine taşınır; boşluklu eski/öbek kimliği ise yerinde
     kalır. Böylece kaynağı bilinen kayıtları ayırırken belirsiz ham kaydı başka
     bir desteye yanlışlıkla çoğaltmayız. */
  var KELIME_ALIASES = window.YDS_KELIME_ALIASES || {};
  var KELIME_ILERLEME_KIMLIKLERI = window.YDS_KELIME_ILERLEME_KIMLIKLERI || {};
  var KENDI = Object.prototype.hasOwnProperty;

  function kelimeKimligi(id) {
    var sonuc = String(id == null ? '' : id);
    var gorulen = Object.create(null);
    while (KELIME_ALIASES[sonuc] && !gorulen[sonuc]) {
      gorulen[sonuc] = true;
      sonuc = String(KELIME_ALIASES[sonuc]);
    }
    return sonuc;
  }

  /* Kelime sayfasının kullanacağı açık kimlik dönüşümü. Öbek tarafı bunu
     çağırmaz ve görünen boşluklu başlığı depolama kimliği olarak korur. */
  function kelimeIlerlemeKimligi(id) {
    var kanonik = kelimeKimligi(id);
    return KENDI.call(KELIME_ILERLEME_KIMLIKLERI, kanonik)
      ? String(KELIME_ILERLEME_KIMLIKLERI[kanonik]) : kanonik;
  }

  /* Kaynağı belirtilmemiş eski depolama kaydı için güvenli geçiş:
     - eski alias, kelime kaydı olduğu bilindiğinden kelime iç kimliğine gider;
     - zaten kanonik boşluklu ham kimlik, öbek kaydı olabileceği için korunur. */
  function eskiIlerlemeKimligi(id) {
    var ham = String(id == null ? '' : id);
    var kanonik = kelimeKimligi(ham);
    if (KENDI.call(KELIME_ALIASES, ham) &&
        KENDI.call(KELIME_ILERLEME_KIMLIKLERI, kanonik)) {
      return String(KELIME_ILERLEME_KIMLIKLERI[kanonik]);
    }
    return kanonik;
  }

  function ilerlemeKimligi(id, tur) {
    var ham = String(id == null ? '' : id);
    return tur === 'obek' ? ham : kelimeIlerlemeKimligi(ham);
  }

  function ilerlemeKimliginiCoz(id) {
    var ham = String(id == null ? '' : id);
    var bulunan = null;
    Object.keys(KELIME_ILERLEME_KIMLIKLERI).some(function (ad) {
      if (String(KELIME_ILERLEME_KIMLIKLERI[ad]) !== ham) return false;
      bulunan = { ad: ad, tur: 'kelime' };
      return true;
    });
    if (bulunan) return bulunan;
    if (KENDI.call(KELIME_ILERLEME_KIMLIKLERI, ham)) {
      return { ad: ham, tur: 'obek' };
    }
    return { ad: kelimeKimligi(ham), tur: '' };
  }

  function kayitKimliginiNormallestir(anahtar, id) {
    return (anahtar === 'yds-leitner' || anahtar === 'yds-test-yanlis')
      ? eskiIlerlemeKimligi(id) : id;
  }

  function kararliJson(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(kararliJson).join(',') + ']';
    return '{' + Object.keys(v).sort().map(function (k) {
      return JSON.stringify(k) + ':' + kararliJson(v[k]);
    }).join(',') + '}';
  }

  function kopyala(v) {
    if (v === undefined) return undefined;
    return JSON.parse(JSON.stringify(v));
  }

  function metaAyir(m) {
    if (typeof m === 'number') return { z: m, o: '' };
    if (typeof m !== 'string') return { z: 0, o: '' };
    var yer = m.indexOf(':');
    return {
      z: parseInt(yer < 0 ? m : m.slice(0, yer), 10) || 0,
      o: yer < 0 ? '' : m.slice(yer + 1)
    };
  }

  function metaKarsilastir(a, b) {
    var x = metaAyir(a), y = metaAyir(b);
    if (x.z !== y.z) return x.z > y.z ? 1 : -1;
    if (x.o === y.o) return 0;
    return x.o > y.o ? 1 : -1;
  }

  function bosZarf() { return { surum: 2, alanlar: {} }; }

  function kayitKimligi(anahtar, deger) {
    if (anahtar === 'yds-yanlis') return deger && deger.a ? String(deger.a) : '';
    if (anahtar === 'yds-gecmis') {
      if (!deger || !deger.t) return '';
      return [deger.t, deger.m || '', deger.d || 0, deger.n || 0, deger.y || 0].join('|');
    }
    return '$';
  }

  function degeriKayitlara(anahtar, deger) {
    var tip = TIPLER[anahtar];
    var sonuc = Object.create(null);
    if (tip === 'nesne') {
      if (!deger || typeof deger !== 'object' || Array.isArray(deger)) return sonuc;
      Object.keys(deger).forEach(function (id) {
        var yeniId = kayitKimliginiNormallestir(anahtar, id);
        var yeni = kopyala(deger[id]);
        if (sonuc[yeniId] === undefined) sonuc[yeniId] = yeni;
        else sonuc[yeniId] = eskiEsitSec(anahtar,
          { m: 0, v: sonuc[yeniId] }, { m: 0, v: yeni }).v;
      });
    } else if (tip === 'yanlis-dizi' || tip === 'gecmis-dizi') {
      if (!Array.isArray(deger)) return sonuc;
      deger.forEach(function (v) {
        var id = kayitKimligi(anahtar, v);
        if (id) sonuc[id] = kopyala(v);
      });
    } else if (tip === 'tek' && deger !== undefined) {
      sonuc.$ = kopyala(deger);
    }
    return sonuc;
  }

  function eskiEsitSec(anahtar, a, b) {
    var x = a && a.v, y = b && b.v;
    if (anahtar === 'yds-leitner') {
      var aralik = { 1: 1, 2: 3, 3: 7, 4: 15, 5: 30 };
      var cx = x && typeof x.c === 'number' ? x.c : ((x && x.g) || 0) - (aralik[(x && x.k) || 0] || 0);
      var cy = y && typeof y.c === 'number' ? y.c : ((y && y.g) || 0) - (aralik[(y && y.k) || 0] || 0);
      if (cx !== cy) return kopyala(cx > cy ? a : b);
      if (((x && x.k) || 0) !== ((y && y.k) || 0)) return kopyala(x.k > y.k ? a : b);
    } else if (anahtar === 'yds-yanlis') {
      var yanlis = kopyala(((x && x.t) || 0) >= ((y && y.t) || 0) ? x : y) || {};
      yanlis.n = Math.max((x && x.n) || 1, (y && y.n) || 1);
      yanlis.t = Math.max((x && x.t) || 0, (y && y.t) || 0);
      return { m: a.m || b.m || 0, v: yanlis };
    } else if (anahtar === 'yds-kategori') {
      var tx = ((x && x.d) || 0) + ((x && x.y) || 0);
      var ty = ((y && y.d) || 0) + ((y && y.y) || 0);
      if (tx !== ty) return kopyala(tx > ty ? a : b);
    } else if (anahtar === 'yds-konular') {
      var puan = function (r) {
        return ((r && r.d) || 0) * 10 + (r && r.t != null ? 1 : 0) +
          (r && r.g != null ? 1 : 0) + (r && r.n ? 1 : 0);
      };
      if (puan(x) !== puan(y)) return kopyala(puan(x) > puan(y) ? a : b);
    } else if (anahtar === 'yds-test-yanlis') {
      return { m: a.m || b.m || 0, v: {
        n: Math.max((x && x.n) || 1, (y && y.n) || 1),
        t: Math.max((x && x.t) || 0, (y && y.t) || 0)
      } };
    } else if (anahtar === 'yds-rekor') {
      if (((x && x.yuzde) || 0) !== ((y && y.yuzde) || 0))
        return kopyala(x.yuzde > y.yuzde ? a : b);
      if (((x && x.dogru) || 0) !== ((y && y.dogru) || 0))
        return kopyala(x.dogru > y.dogru ? a : b);
    } else if (anahtar === 'yds-yeni-sayac') {
      if (((x && x.g) || 0) !== ((y && y.g) || 0)) return kopyala(x.g > y.g ? a : b);
      return { m: a.m || b.m || 0, v: {
        g: (x && x.g) || (y && y.g),
        n: Math.max((x && x.n) || 0, (y && y.n) || 0),
        ek: Math.max((x && x.ek) || 0, (y && y.ek) || 0)
      } };
    }
    return kararliJson(a) >= kararliJson(b) ? kopyala(a) : kopyala(b);
  }

  function kaydiSec(anahtar, x, y) {
    if (!x) return kopyala(y);
    if (!y) return kopyala(x);
    var fark = metaKarsilastir(x.m, y.m);
    if (fark > 0) return kopyala(x);
    if (fark < 0) return kopyala(y);
    if (!!x.d !== !!y.d) return kopyala(x.d ? x : y);
    if (x.d && y.d) return kopyala(x);
    // Anlamsal seçim yalnız sürümsüz eski kayıtların geçişinde gerekir.
    // Aynı yeni sürüm iki tarafta da varsa bu aynı işlemin kopyasıdır.
    if (metaAyir(x.m).z === 0) return eskiEsitSec(anahtar, x, y);
    return kararliJson(x) >= kararliJson(y) ? kopyala(x) : kopyala(y);
  }

  function alaniNormallestir(anahtar, alan) {
    alan = alan || { i: {} };
    var sonuc = { i: {} };
    if (alan.r) sonuc.r = alan.r;
    Object.keys(alan.i || {}).forEach(function (id) {
      var yeniId = kayitKimliginiNormallestir(anahtar, id);
      sonuc.i[yeniId] = kaydiSec(anahtar, sonuc.i[yeniId], alan.i[id]);
    });
    return sonuc;
  }

  function alanBirlestir(anahtar, a, b) {
    a = alaniNormallestir(anahtar, a);
    b = alaniNormallestir(anahtar, b);
    var sonuc = { i: {} };
    if (a.r || b.r) sonuc.r = metaKarsilastir(a.r, b.r) >= 0 ? a.r : b.r;
    var ids = Object.create(null);
    Object.keys(a.i || {}).concat(Object.keys(b.i || {})).forEach(function (id) { ids[id] = 1; });
    Object.keys(ids).forEach(function (id) {
      var x = (a.i || {})[id], y = (b.i || {})[id];
      var secilen = kaydiSec(anahtar, x, y);
      if (!secilen || (sonuc.r && metaKarsilastir(secilen.m, sonuc.r) <= 0)) return;
      sonuc.i[id] = secilen;
    });
    return sonuc;
  }

  function birlestir(a, b) {
    var sonuc = bosZarf();
    a = a && a.alanlar ? a : bosZarf();
    b = b && b.alanlar ? b : bosZarf();
    Object.keys(TIPLER).forEach(function (anahtar) {
      var x = a.alanlar[anahtar], y = b.alanlar[anahtar];
      if (x || y) sonuc.alanlar[anahtar] = alanBirlestir(anahtar, x, y);
    });
    return sonuc;
  }

  function zarfaCevir(paket) {
    if (paket && paket.surum === 2 && paket.alanlar) return birlestir(paket, bosZarf());
    var zarf = bosZarf();
    paket = paket && typeof paket === 'object' ? paket : {};
    Object.keys(TIPLER).forEach(function (anahtar) {
      if (paket[anahtar] === undefined) return;
      var alan = { i: {} };
      var kayitlar = degeriKayitlara(anahtar, paket[anahtar]);
      Object.keys(kayitlar).forEach(function (id) { alan.i[id] = { m: 0, v: kayitlar[id] }; });
      zarf.alanlar[anahtar] = alan;
    });
    return zarf;
  }

  function alanDegeri(anahtar, alan) {
    if (!alan) return { var: false };
    alan = alaniNormallestir(anahtar, alan);
    var tip = TIPLER[anahtar];
    var aktif = Object.create(null);
    Object.keys(alan.i || {}).forEach(function (id) {
      var r = alan.i[id];
      if (!r || r.d || (alan.r && metaKarsilastir(r.m, alan.r) <= 0)) return;
      aktif[id] = kopyala(r.v);
    });
    var ids = Object.keys(aktif);
    if (!ids.length && alan.r) return { var: false };
    if (tip === 'tek') return ids.length ? { var: true, deger: aktif.$ } : { var: false };
    if (tip === 'yanlis-dizi') {
      return { var: true, deger: ids.map(function (id) { return aktif[id]; })
        .sort(function (x, y) { return ((x && x.t) || 0) - ((y && y.t) || 0); }) };
    }
    if (tip === 'gecmis-dizi') {
      return { var: true, deger: ids.map(function (id) { return aktif[id]; })
        .sort(function (x, y) { return ((x && x.t) || 0) - ((y && y.t) || 0); }).slice(-50) };
    }
    var nesne = {};
    ids.forEach(function (id) { nesne[id] = aktif[id]; });
    return { var: true, deger: nesne };
  }

  function paket(zarf) {
    var sonuc = {};
    Object.keys(TIPLER).forEach(function (anahtar) {
      var alan = alanDegeri(anahtar, zarf && zarf.alanlar && zarf.alanlar[anahtar]);
      if (alan.var) sonuc[anahtar] = alan.deger;
    });
    return sonuc;
  }

  function kayitlariYaz(zarf, anahtar, kayitlar, meta) {
    zarf = birlestir(zarf, bosZarf());
    var alan = zarf.alanlar[anahtar] || { i: {} };
    Object.keys(kayitlar || {}).forEach(function (id) {
      var yeniId = kayitKimliginiNormallestir(anahtar, id);
      var gelen = { m: meta(), v: kopyala(kayitlar[id]) };
      alan.i[yeniId] = kaydiSec(anahtar, alan.i[yeniId], gelen);
    });
    zarf.alanlar[anahtar] = alan;
    return zarf;
  }

  function kayitlariSil(zarf, anahtar, ids, meta) {
    zarf = birlestir(zarf, bosZarf());
    var alan = zarf.alanlar[anahtar] || { i: {} };
    (ids || []).forEach(function (id) {
      var yeniId = kayitKimliginiNormallestir(anahtar, id);
      alan.i[yeniId] = kaydiSec(anahtar, alan.i[yeniId], { m: meta(), d: 1 });
    });
    zarf.alanlar[anahtar] = alan;
    return zarf;
  }

  function anahtariSil(zarf, anahtar, meta) {
    zarf = birlestir(zarf, bosZarf());
    zarf.alanlar[anahtar] = { r: meta(), i: {} };
    return zarf;
  }

  window.YDS.EsitlemeMotoru = {
    SURUM: 2,
    TIPLER: TIPLER,
    kelimeKimligi: kelimeKimligi,
    kelimeIlerlemeKimligi: kelimeIlerlemeKimligi,
    eskiIlerlemeKimligi: eskiIlerlemeKimligi,
    ilerlemeKimligi: ilerlemeKimligi,
    ilerlemeKimliginiCoz: ilerlemeKimliginiCoz,
    kararliJson: kararliJson,
    metaKarsilastir: metaKarsilastir,
    zarfaCevir: zarfaCevir,
    birlestir: birlestir,
    paket: paket,
    kayitlariYaz: kayitlariYaz,
    kayitlariSil: kayitlariSil,
    anahtariSil: anahtariSil
  };
})();
