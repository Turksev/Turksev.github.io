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
    'yds-favoriler': 'nesne',
    'yds-rekor': 'tek',
    'yds-yeni-sayac': 'tek',
    'yds-test-yanlis': 'nesne',
    'yds-gunluk-yeni': 'tek',
    'yds-gunluk-tavan': 'tek',
    'yds-gunluk-kayit': 'nesne',
    'yds-gunluk-sonuc': 'nesne',
    'yds-katmanlar': 'tek',
    'yds-eksen': 'tek'
  };
  var KART_GECMISI_ALANLARI = [];
  for (var tarihceParca = 0; tarihceParca < 16; tarihceParca++) {
    var tarihceAnahtar = 'yds-kart-gecmisi-' + tarihceParca;
    KART_GECMISI_ALANLARI.push(tarihceAnahtar); TIPLER[tarihceAnahtar] = 'nesne';
  }

  // Immutable, compact answer events and per-page writer counters. Detail is
  // bounded independently of counters: 20 events/card and 1,250 events/shard.
  // The timestamp is encoded in the unique ID, never inferred from a due date.
  function kartGecmisiAlanMi(key) { return KART_GECMISI_ALANLARI.indexOf(key) !== -1; }
  function donemliAlanMi(key) { return kartGecmisiAlanMi(key)||key==='yds-gunluk-sonuc'; }
  function kartGecmisiAlani(id) {
    var h=2166136261;for(var i=0;i<id.length;i++){h^=id.charCodeAt(i);h=Math.imul(h,16777619);}
    return KART_GECMISI_ALANLARI[(h>>>0)%16];
  }
  function tarihceZamani(t) { return Number.isSafeInteger(t)&&t>0&&t<=8640000000000000; }
  function kartGecmisiOlayCoz(s) {
    if (typeof s !== 'string') return null;
    var a = s.split('|'), id = a[0], t = parseInt(id.split('-')[0], 36);
    if (a.length !== 8 || !/^[a-z0-9]+-[a-z0-9]{6,24}$/.test(id) || !tarihceZamani(t) || a.slice(1).some(function(x){return !/^[a-z0-9]*$/.test(x);})) return null;
    var n = a.slice(1).map(function (x) { return x === '' ? null : parseInt(x, 36); });
    if (n.some(function (x, i) { return (i !== 4 && i !== 5 && x === null) || (x !== null && (!Number.isSafeInteger(x) || x < 0)); }) ||
        n[0] > 10000000 || n[1] > 3 || n[2] > 5 || n[3] > 5 || n[6] > 3 ||
        (n[4] !== null && n[4] > t) || (n[5] !== null && n[5] > 10000000)) return null;
    return {id:id,at:t,day:n[0],result:['bildim','bilemedim','zaten','sifirla'][n[1]],
      from:n[2],to:n[3],previousAt:n[4],dueDay:n[5],source:['kart','oyun','gunun-testi','durum'][n[6]]};
  }
  function kartGecmisiOlayKodla(e) {
    return [e.id,e.day,['bildim','bilemedim','zaten','sifirla'].indexOf(e.result),e.from,e.to,e.previousAt,e.dueDay,
      Math.max(0,['kart','oyun','gunun-testi','durum'].indexOf(e.source))].map(function (x,i) {
      return i === 0 ? x : (x === null ? '' : x.toString(36));
    }).join('|');
  }
  function tarihceSirasi(a,b) {
    var ta = parseInt(a.split('-')[0],36), tb = parseInt(b.split('-')[0],36);
    return ta - tb || (a < b ? -1 : a > b ? 1 : 0);
  }
  function kartGecmisiKaydiGecerli(r) {
    if (!r || r.v !== 1 || !Number.isInteger(r.k) || r.k < 0 || r.k > 2 || !r.p || typeof r.p !== 'object' || Array.isArray(r.p) ||
        !tarihceZamani(r.f) || !Array.isArray(r.u) || r.u.length !== 2 ||
        typeof r.u[0] !== 'string' || !/^[a-z0-9]+-[a-z0-9]{6,24}$/.test(r.u[0]) ||
        !Number.isInteger(r.u[1]) || r.u[1] < 0 || r.u[1] > 3 || !Array.isArray(r.e) || r.e.length > 20) return false;
    if(!tarihceZamani(parseInt(r.u[0].split('-')[0],36))||parseInt(r.u[0].split('-')[0],36)<r.f)return false;
    if (!(r.q===0 || (typeof r.q==='string' && /^\d+:[a-z0-9]+$/.test(r.q) && r.q.length<=80)) ||
        Object.keys(r).some(function(k){return ['v','k','p','f','u','e','q'].indexOf(k)===-1;})) return false;
    if (Object.keys(r.p).some(function(c){var p=r.p[c];return !/^[a-z0-9*]{1,24}$/.test(c) || !Array.isArray(p) || p.length!==5 ||
      p.some(function(n){return !Number.isSafeInteger(n)||n<0;}) || p[0]+p[1]+p[2]>p[4] || p[3]>p[1];})) return false;
    var ids = Object.create(null);
    return r.e.every(function(s){var e=kartGecmisiOlayCoz(s);if(!e||ids[e.id])return false;ids[e.id]=true;return true;});
  }
  function kartGecmisiKaydiBirlestir(a,b) {
    if (!kartGecmisiKaydiGecerli(a)) return kopyala(b);
    if (!kartGecmisiKaydiGecerli(b)) return kopyala(a);
    if(metaKarsilastir(a.q,b.q)!==0)return kopyala(metaKarsilastir(a.q,b.q)>0?a:b);
    var r={v:1,q:a.q,k:a.k,p:Object.create(null),f:Math.min(a.f,b.f),u:tarihceSirasi(a.u[0],b.u[0])>=0?a.u.slice():b.u.slice(),e:[]};
    Object.keys(a.p).concat(Object.keys(b.p)).sort().forEach(function(c){
      if(r.p[c])return;r.p[c]=[];
      for(var i=0;i<5;i++)r.p[c][i]=Math.max(a.p[c]?a.p[c][i]:0,b.p[c]?b.p[c][i]:0);
      // Valid writers are unique per page. Preserve a valid lower bound even
      // for an imported fork that reused one actor with conflicting counters.
      r.p[c][4]=Math.max(r.p[c][4],r.p[c][0]+r.p[c][1]+r.p[c][2]);
    });
    var es=Object.create(null);
    a.e.concat(b.e).forEach(function(s){var id=s.split('|')[0];if(!es[id]||s>es[id])es[id]=s;});
    r.e=Object.keys(es).sort(tarihceSirasi).slice(-20).map(function(id){return es[id];});
    return r;
  }
  function kartGecmisiBuda(map) {
    var all=[];
    Object.keys(map||{}).forEach(function(card){var r=map[card];if(kartGecmisiKaydiGecerli(r))r.e.forEach(function(s){all.push(s.split('|')[0]);});});
    if(all.length<=1250)return map;
    all.sort(tarihceSirasi);var keep=Object.create(null);
    all.slice(-1250).forEach(function(id){keep[id]=true;});
    Object.keys(map).forEach(function(card){var r=map[card];if(kartGecmisiKaydiGecerli(r))r.e=r.e.filter(function(s){return keep[s.split('|')[0]];});});
    return map;
  }

  /* Üretim verisinde düzeltilen eski kelime başlıkları. Görünen kanonik başlık
     öbekle aynıysa yalnız KELİME kartı ayrı bir iç kimlik kullanır. Eski tireli
     alias bu kelime kimliğine taşınır; boşluklu eski/öbek kimliği ise yerinde
     kalır. Böylece kaynağı bilinen kayıtları ayırırken belirsiz ham kaydı başka
     bir desteye yanlışlıkla çoğaltmayız. */
  var KELIME_ALIASES = window.YDS_KELIME_ALIASES || {};
  var KELIME_ILERLEME_KIMLIKLERI = window.YDS_KELIME_ILERLEME_KIMLIKLERI || {};
  var KENDI = Object.prototype.hasOwnProperty;
  // OCR düzeltmesiyle birleşen cümleler: kalıcı kaynak tablosuyla test edilir.
  var CUMLE_ALIASES = {"c:cbbwc1-40":"c:1tfwl4d-41","c:1kb20zh-4c":"c:1uqcnid-4d","c:53r02l-4c":"c:18mhuk3-4d","c:gups05-2e":"c:1tnndcn-2f","c:709nq4-3k":"c:tlr274-3l","c:tvfkbn-7g":"c:1hrs3bp-7h"};
  function cumleTakmaCoz(ham) {
    var gorulen = Object.create(null);
    while (KENDI.call(CUMLE_ALIASES, ham) && !gorulen[ham]) {
      gorulen[ham] = true; ham = CUMLE_ALIASES[ham];
    }
    return ham;
  }
  // Bu, yalnız Firestore alan JSON'unun iç kodlama sürümüdür. Yerel zarfın
  // SURUM=2 sözleşmesinden ve dış Firestore belge sürümünden bağımsızdır.
  var BULUT_KODLAMA_SURUMU = 2;

  function kelimeKimligi(id) {
    var sonuc = String(id == null ? '' : id);
    var gorulen = Object.create(null);
    while (KENDI.call(KELIME_ALIASES, sonuc) && KELIME_ALIASES[sonuc] && !gorulen[sonuc]) {
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
    if (cumleKimligiMi(ham)) return cumleTakmaCoz(ham);
    var kanonik = kelimeKimligi(ham);
    if (KENDI.call(KELIME_ALIASES, ham) &&
        KENDI.call(KELIME_ILERLEME_KIMLIKLERI, kanonik)) {
      return String(KELIME_ILERLEME_KIMLIKLERI[kanonik]);
    }
    return kanonik;
  }

  /* Cümle ilerleme kimlikleri "c:" önekiyle üretilir (cumleler.js). Önek,
     kimliği hem kelime hem öbek adlarından ayırır; böylece üç tür aynı
     yds-leitner deposunda çakışmadan durur. */
  function cumleKimligiMi(ham) { return ham.slice(0, 2) === 'c:'; }

  /* Öbek anahtar standardı (06.09.2026): çekimli eski anahtarlar ("looking at")
     lemmaya ("look at") bağlanır. Tablo data/obekler.js sonunda yayımlanır;
     yüklü değilse ham kimlik olduğu gibi kalır. */
  function obekTakmaCoz(ham) {
    var takma = window.OBEK_TAKMA;
    return (takma && KENDI.call(takma, ham)) ? String(takma[ham]) : ham;
  }

  function ilerlemeKimligi(id, tur) {
    var ham = String(id == null ? '' : id);
    // Öbek ve cümle ham kimlikle saklanır; kelime iç kimliğe çevrilir.
    if (tur === 'obek') return obekTakmaCoz(ham);
    return tur === 'cumle' ? cumleTakmaCoz(ham) : kelimeIlerlemeKimligi(ham);
  }

  function ilerlemeKimliginiCoz(id) {
    var ham = String(id == null ? '' : id);
    if (cumleKimligiMi(ham)) return { ad: cumleTakmaCoz(ham), tur: 'cumle' };
    var bulunan = null;
    Object.keys(KELIME_ILERLEME_KIMLIKLERI).some(function (ad) {
      if (String(KELIME_ILERLEME_KIMLIKLERI[ad]) !== ham) return false;
      bulunan = { ad: ad, tur: 'kelime' };
      return true;
    });
    if (bulunan) return bulunan;
    if (window.OBEK_TAKMA && KENDI.call(window.OBEK_TAKMA, ham)) {
      return { ad: obekTakmaCoz(ham), tur: 'obek' };
    }
    if (KENDI.call(KELIME_ILERLEME_KIMLIKLERI, ham)) {
      return { ad: ham, tur: 'obek' };
    }
    return { ad: kelimeKimligi(ham), tur: '' };
  }

  function kayitKimliginiNormallestir(anahtar, id) {
    if (anahtar === 'yds-favoriler') return kelimeKimligi(id);
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
      var yanlis = kopyala(((x && (x.u || x.t)) || 0) >= ((y && (y.u || y.t)) || 0) ? x : y) || {};
      yanlis.n = Math.max((x && x.n) || 1, (y && y.n) || 1);
      yanlis.t = Math.max((x && x.t) || 0, (y && y.t) || 0);
      yanlis.u = Math.max((x && (x.u || x.t)) || 0, (y && (y.u || y.t)) || 0);
      return { m: a.m || b.m || 0, v: yanlis };
    } else if (anahtar === 'yds-kategori') {
      var tx = ((x && x.d) || 0) + ((x && x.y) || 0);
      var ty = ((y && y.d) || 0) + ((y && y.y) || 0);
      if (tx !== ty) return kopyala(tx > ty ? a : b);
    } else if (anahtar === 'yds-konular') {
      var puan = function (r) {
        return ((r && r.d) || 0) * 10 + (r && r.t != null ? 1 : 0) +
          (r && r.g != null ? 1 : 0) + (r && r.n ? 1 : 0) +
          (r && r.ta ? 1 : 0) + (r && r.ga ? 1 : 0);
      };
      var ux = (x && x.u) || 0, uy = (y && y.u) || 0;
      if (ux !== uy) return kopyala(ux > uy ? a : b);
      if (puan(x) !== puan(y)) return kopyala(puan(x) > puan(y) ? a : b);
    } else if (anahtar === 'yds-test-yanlis') {
      var testKaydi = kopyala(((x && (x.u || x.t)) || 0) >= ((y && (y.u || y.t)) || 0) ? x : y) || {};
      testKaydi.n = Math.max((x && x.n) || 1, (y && y.n) || 1);
      testKaydi.t = Math.max((x && x.t) || 0, (y && y.t) || 0);
      testKaydi.u = Math.max((x && (x.u || x.t)) || 0, (y && (y.u || y.t)) || 0);
      return { m: a.m || b.m || 0, v: testKaydi };
    } else if (anahtar === 'yds-gunluk-kayit') {
      return { m: a.m || b.m || 0, v: gunlukKaydiBirlestir(x, y) };
    } else if (anahtar === 'yds-rekor') {
      if (((x && x.yuzde) || 0) !== ((y && y.yuzde) || 0))
        return kopyala(x.yuzde > y.yuzde ? a : b);
      if (((x && x.dogru) || 0) !== ((y && y.dogru) || 0))
        return kopyala(x.dogru > y.dogru ? a : b);
    } else if (anahtar === 'yds-yeni-sayac') {
      if (((x && x.g) || 0) !== ((y && y.g) || 0)) return kopyala(x.g > y.g ? a : b);
      return { m: a.m || b.m || 0, v: yeniSayacBirlestir(x, y) };
    }
    return kararliJson(a) >= kararliJson(b) ? kopyala(a) : kopyala(b);
  }

  /* ---------- cihaz paylı sayaçlar ----------
     Günlük çalışma sayaçları ve bugün açılan yeni kart sayacı cihaz paylarıyla
     tutulur: p = { cihaz: {...} }; toplam alanlar payların toplamıdır. Her cihaz
     yalnız kendi payını artırdığı için paylar cihaz başına "büyük olan" ile
     birleşir: toplama yeniden sayma yapmaz, sıra bağımsız ve tekrar uygulanabilir.
     Pay bilgisi olmayan eski kayıt '*' payı sayılır. Bu kayıtlarda sürüm sırası
     belirleyici değildir: "son yazan kazanır" aynı gün başka cihazda yapılan
     çalışmayı siliyordu. */
  var GUNLUK_ALANLAR = ['t', 'y', 'd', 'm', 'z'];
  var PAY_KIMLIGI = /^[a-z0-9*]{1,24}$/;
  function sayacDegeri(v) { return (typeof v === 'number' && isFinite(v) && v > 0) ? Math.floor(v) : 0; }
  function paylar(v, alanlar) {
    var p = Object.create(null);
    if (v && v.p && typeof v.p === 'object' && !Array.isArray(v.p)) {
      Object.keys(v.p).forEach(function (c) {
        var pay = v.p[c], temiz = {}, dolu = false;
        if (!pay || typeof pay !== 'object' || !PAY_KIMLIGI.test(c)) return;
        alanlar.forEach(function (alan) { temiz[alan] = sayacDegeri(pay[alan]); if (temiz[alan]) dolu = true; });
        if (dolu) p[c] = temiz;
      });
    } else if (v && typeof v === 'object') {
      var eski = {}, eskiDolu = false;
      alanlar.forEach(function (alan) { eski[alan] = sayacDegeri(v[alan]); if (eski[alan]) eskiDolu = true; });
      if (eskiDolu) p['*'] = eski;
    }
    return p;
  }
  function paylariBirlestir(pa, pb, alanlar) {
    var p = Object.create(null);
    Object.keys(pa).concat(Object.keys(pb)).sort().forEach(function (c) {
      if (p[c]) return;
      p[c] = {};
      alanlar.forEach(function (alan) { p[c][alan] = Math.max(pa[c] ? pa[c][alan] : 0, pb[c] ? pb[c][alan] : 0); });
    });
    return p;
  }
  function payliMi(v) { return !!(v && v.p && typeof v.p === 'object' && !Array.isArray(v.p)); }
  function paylariTopla(p, alanlar, payli) {
    var v = {};
    alanlar.forEach(function (alan) {
      v[alan] = Object.keys(p).reduce(function (n, c) { return n + p[c][alan]; }, 0);
    });
    // İki taraf da eski biçimdeyse kayıt eski biçimde kalır (yalnız '*' payı olurdu).
    if (!payli) return v;
    v.p = {};
    Object.keys(p).sort().forEach(function (c) { v.p[c] = p[c]; });
    return v;
  }
  function gunlukKaydiBirlestir(a, b) {
    var p = paylariBirlestir(paylar(a, GUNLUK_ALANLAR), paylar(b, GUNLUK_ALANLAR), GUNLUK_ALANLAR);
    return paylariTopla(p, GUNLUK_ALANLAR, payliMi(a) || payliMi(b));
  }
  function gunlukSonucBirlestir(a,b) {
    if(metaKarsilastir(a&&a.q,b&&b.q)!==0)return kopyala(metaKarsilastir(a&&a.q,b&&b.q)>0?a:b);
    var p=paylariBirlestir(paylar(a,['n','b']),paylar(b,['n','b']),['n','b']);
    var r=paylariTopla(p,['n','b'],true);r.q=a&&a.q||b&&b.q||0;return r;
  }
  function yeniSayacBirlestir(a, b) {
    var ga = sayacDegeri(a && a.g), gb = sayacDegeri(b && b.g);
    if (ga !== gb) return kopyala(ga > gb ? a : b);
    var v = paylariTopla(paylariBirlestir(paylar(a, ['n']), paylar(b, ['n']), ['n']), ['n'], payliMi(a) || payliMi(b));
    var sonuc = { g: ga, n: v.n, ek: Math.max(sayacDegeri(a && a.ek), sayacDegeri(b && b.ek)) };
    if (v.p) sonuc.p = v.p;
    return sonuc;
  }
  function sayacKaydiBirlestir(anahtar, x, y) {
    var v = anahtar === 'yds-gunluk-kayit' ? gunlukKaydiBirlestir(x.v, y.v) : yeniSayacBirlestir(x.v, y.v);
    return { m: metaKarsilastir(x.m, y.m) >= 0 ? x.m : y.m, v: v };
  }

  function kaydiSec(anahtar, x, y) {
    if (!x) return kopyala(y);
    if (!y) return kopyala(x);
    if(anahtar==='yds-gunluk-sonuc'&&!x.d&&!y.d)return {m:metaKarsilastir(x.m,y.m)>=0?x.m:y.m,v:gunlukSonucBirlestir(x.v,y.v)};
    if (kartGecmisiAlanMi(anahtar) && !x.d && !y.d) {
      var merged=kartGecmisiKaydiBirlestir(x.v,y.v),order=metaKarsilastir(x.m,y.m);
      // Latest actual observation follows the logical write clock even when a
      // device's wall clock moves backwards. Its negative interval is omitted.
      if(order&&kartGecmisiKaydiGecerli(x.v)&&kartGecmisiKaydiGecerli(y.v)&&metaKarsilastir(x.v.q,y.v.q)===0)
        merged.u=(order>0?x.v.u:y.v.u).slice();
      return {m:order>=0?x.m:y.m,v:merged};
    }
    // Sayaç kayıtları sürüm sırasına değil cihaz paylarına göre birleşir; silme işareti
    // (sıfırlama) yine sürüm kuralıyla ele alınır.
    if ((anahtar === 'yds-gunluk-kayit' || anahtar === 'yds-yeni-sayac') && !x.d && !y.d) {
      return sayacKaydiBirlestir(anahtar, x, y);
    }
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
    var sonuc = { i: Object.create(null) };
    if (alan.r) sonuc.r = alan.r;
    Object.keys(alan.i || {}).forEach(function (id) {
      var yeniId = kayitKimliginiNormallestir(anahtar, id);
      sonuc.i[yeniId] = kaydiSec(anahtar, sonuc.i[yeniId], alan.i[id]);
    });
    if (kartGecmisiAlanMi(anahtar)) {
      var map=Object.create(null);
      Object.keys(sonuc.i).forEach(function(id){if(!sonuc.i[id].d)map[id]=sonuc.i[id].v;});
      kartGecmisiBuda(map);
    }
    return sonuc;
  }

  /* Leitner ve test-yanlış alanları, bütün kelime ve öbekler için kayıt
     tutulabildiği için buluttaki en büyük alanlardır. Yerelde kullanılan kayıt
     şemasını ve birleştirme davranışını değiştirmeden yalnız Firestore JSON'unu
     daha kısa bir dizi biçiminde taşırız. Eski nesne biçimi hâlâ okunur;
     böylece mevcut kullanıcı ilerlemesi ilk eşitlemede kayıpsız geçer. */
  function bulutMetasiniAyir(meta) {
    if (typeof meta !== 'string') return null;
    var yer = meta.indexOf(':');
    if (yer < 1) return null;
    var zamanMetni = meta.slice(0, yer);
    var zaman = Number(zamanMetni);
    if (!Number.isSafeInteger(zaman) || String(zaman) !== zamanMetni) return null;
    return { z: zaman, o: meta.slice(yer + 1) };
  }

  function bulutMetaKodla(meta, aktorler) {
    var ayrik = bulutMetasiniAyir(meta);
    if (ayrik) {
      var sira = aktorler.indexOf(ayrik.o);
      if (sira === 0) return ayrik.z;
      return [ayrik.z, sira];
    }
    if (typeof meta === 'number') return ['n', meta];
    return ['g', kopyala(meta)];
  }

  function bulutMetaCoz(kodlu, aktorler) {
    if (typeof kodlu === 'number') {
      if (!aktorler.length) throw new Error('bulut-alan-aktor-listesi-gecersiz');
      return String(kodlu) + ':' + aktorler[0];
    }
    if (!Array.isArray(kodlu) || kodlu.length !== 2) {
      throw new Error('bulut-alan-meta-kodlamasi-gecersiz');
    }
    if (typeof kodlu[0] === 'number') {
      if (!Number.isInteger(kodlu[1]) || kodlu[1] < 0 || kodlu[1] >= aktorler.length) {
        throw new Error('bulut-alan-aktor-kodu-gecersiz');
      }
      return String(kodlu[0]) + ':' + aktorler[kodlu[1]];
    }
    if (kodlu[0] === 'n') return kodlu[1];
    if (kodlu[0] === 'g') return kopyala(kodlu[1]);
    throw new Error('bulut-alan-meta-kodlamasi-gecersiz');
  }

  function kisaBulutAlaniMi(anahtar) {
    return anahtar === 'yds-leitner' || anahtar === 'yds-test-yanlis';
  }

  function standartAlanKaydi(anahtar, deger) {
    if (!deger || typeof deger !== 'object' || Array.isArray(deger)) return 0;
    var alanlar = Object.keys(deger).sort().join(',');
    if (anahtar === 'yds-test-yanlis') {
      var testTemeli = typeof deger.n === 'number' && Number.isFinite(deger.n) &&
        typeof deger.t === 'number' && Number.isFinite(deger.t);
      if (alanlar === 'n,t' && testTemeli) return 2;
      if (alanlar === 'n,t,u' && testTemeli &&
          typeof deger.u === 'number' && Number.isFinite(deger.u)) return 3;
    } else if (anahtar === 'yds-leitner') {
      var leitnerTemeli = typeof deger.k === 'number' && Number.isFinite(deger.k) &&
        typeof deger.g === 'number' && Number.isFinite(deger.g);
      if (alanlar === 'g,k' && leitnerTemeli) return 2;
      if (alanlar === 'c,g,k' && leitnerTemeli &&
          typeof deger.c === 'number' && Number.isFinite(deger.c)) return 3;
    }
    return 0;
  }

  function bulutAlaniniKodla(anahtar, alan) {
    alan = alaniNormallestir(anahtar, alan);
    if (!kisaBulutAlaniMi(anahtar)) return alan;

    var aktorSayilari = Object.create(null);
    Object.keys(alan.i || {}).forEach(function (id) {
      var ayrik = bulutMetasiniAyir(alan.i[id] && alan.i[id].m);
      if (ayrik) aktorSayilari[ayrik.o] = (aktorSayilari[ayrik.o] || 0) + 1;
    });
    var aktorler = Object.keys(aktorSayilari).sort(function (a, b) {
      return aktorSayilari[b] - aktorSayilari[a] || (a < b ? -1 : a > b ? 1 : 0);
    });
    var sonuc = { k: BULUT_KODLAMA_SURUMU, a: aktorler, i: [] };
    if (alan.r) sonuc.r = alan.r;
    Object.keys(alan.i || {}).sort().forEach(function (id) {
      var kayit = alan.i[id] || {};
      var meta = bulutMetaKodla(kayit.m === undefined ? 0 : kayit.m, aktorler);
      if (kayit.d) {
        sonuc.i.push([id, meta]);
        return;
      }
      var standart = standartAlanKaydi(anahtar, kayit.v);
      if (anahtar === 'yds-test-yanlis' && standart === 2) {
        sonuc.i.push([id, meta, kayit.v.n, kayit.v.t]);
      } else if (anahtar === 'yds-test-yanlis' && standart === 3) {
        sonuc.i.push([id, meta, kayit.v.n, kayit.v.t, kayit.v.u]);
      } else if (anahtar === 'yds-leitner' && standart === 2) {
        sonuc.i.push([id, meta, kayit.v.k, kayit.v.g]);
      } else if (anahtar === 'yds-leitner' && standart === 3) {
        sonuc.i.push([id, meta, kayit.v.k, kayit.v.g, kayit.v.c]);
      } else sonuc.i.push([id, meta, null, kopyala(kayit.v)]);
    });
    return sonuc;
  }

  function bulutAlaniniCoz(anahtar, kodlu) {
    if (!kisaBulutAlaniMi(anahtar) || !kodlu ||
        (kodlu.k !== 1 && kodlu.k !== BULUT_KODLAMA_SURUMU) || !Array.isArray(kodlu.i)) {
      return alaniNormallestir(anahtar, kodlu);
    }
    var alan = { i: Object.create(null) };
    if (kodlu.r) alan.r = kodlu.r;
    kodlu.i.forEach(function (satir) {
      if (!Array.isArray(satir)) throw new Error('bulut-alan-kodlamasi-gecersiz');
      var id = kayitKimliginiNormallestir(anahtar, String(satir[0]));
      var kayit;
      if (kodlu.k === 1) {
        if (satir.length < 3 || (satir[2] !== 0 && satir[2] !== 1) ||
            (satir[2] === 0 && satir.length < 4)) {
          throw new Error('bulut-alan-kodlamasi-gecersiz');
        }
        kayit = { m: satir[1] };
        if (satir[2] === 1) kayit.d = 1;
        else kayit.v = kopyala(satir[3]);
      } else {
        if (!Array.isArray(kodlu.a) || satir.length < 2) {
          throw new Error('bulut-alan-kodlamasi-gecersiz');
        }
        kayit = { m: bulutMetaCoz(satir[1], kodlu.a) };
        if (satir.length === 2) kayit.d = 1;
        else if (satir.length === 4 && satir[2] === null) kayit.v = kopyala(satir[3]);
        else if (anahtar === 'yds-test-yanlis' && satir.length === 4) {
          kayit.v = { n: satir[2], t: satir[3] };
        } else if (anahtar === 'yds-test-yanlis' && satir.length === 5) {
          kayit.v = { n: satir[2], t: satir[3], u: satir[4] };
        } else if (anahtar === 'yds-leitner' && satir.length === 4) {
          kayit.v = { k: satir[2], g: satir[3] };
        } else if (anahtar === 'yds-leitner' && satir.length === 5) {
          kayit.v = { k: satir[2], g: satir[3], c: satir[4] };
        }
        else throw new Error('bulut-alan-kodlamasi-gecersiz');
      }
      alan.i[id] = kaydiSec(anahtar, alan.i[id], kayit);
    });
    return alan;
  }

  function bulutAlanJson(anahtar, alan) {
    return kararliJson(bulutAlaniniKodla(anahtar, alan));
  }

  function alanBirlestir(anahtar, a, b) {
    a = alaniNormallestir(anahtar, a);
    b = alaniNormallestir(anahtar, b);
    var sonuc = { i: Object.create(null) };
    if (a.r || b.r) sonuc.r = metaKarsilastir(a.r, b.r) >= 0 ? a.r : b.r;
    var ids = Object.create(null);
    Object.keys(a.i || {}).concat(Object.keys(b.i || {})).forEach(function (id) { ids[id] = 1; });
    Object.keys(ids).forEach(function (id) {
      var x = (a.i || {})[id], y = (b.i || {})[id];
      // A post-reset history record must not absorb pre-reset counters/events.
      if (donemliAlanMi(anahtar) && sonuc.r) {
        if(x && (metaKarsilastir(x.m,sonuc.r)<=0 || (!x.d && metaKarsilastir(x.v&&x.v.q,sonuc.r)<0)))x=null;
        if(y && (metaKarsilastir(y.m,sonuc.r)<=0 || (!y.d && metaKarsilastir(y.v&&y.v.q,sonuc.r)<0)))y=null;
      }
      var secilen = kaydiSec(anahtar, x, y);
      if (!secilen || (sonuc.r && metaKarsilastir(secilen.m, sonuc.r) <= 0)) return;
      sonuc.i[id] = secilen;
    });
    return kartGecmisiAlanMi(anahtar) ? alaniNormallestir(anahtar,sonuc) : sonuc;
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
      var alan = { i: Object.create(null) };
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
      if (!r || r.d || (alan.r && (metaKarsilastir(r.m, alan.r) <= 0 ||
          (donemliAlanMi(anahtar) && metaKarsilastir(r.v&&r.v.q,alan.r)<0)))) return;
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
    var nesne = Object.create(null);
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
    var alan = zarf.alanlar[anahtar] || { i: Object.create(null) };
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
    var alan = zarf.alanlar[anahtar] || { i: Object.create(null) };
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
    CUMLE_ALIASES: CUMLE_ALIASES,
    cumleTakmaCoz: cumleTakmaCoz,
    BULUT_KODLAMA_SURUMU: BULUT_KODLAMA_SURUMU,
    TIPLER: TIPLER,
    KART_GECMISI_ALANLARI: KART_GECMISI_ALANLARI.slice(),
    kartGecmisiAlanMi: kartGecmisiAlanMi,
    kartGecmisiAlani: kartGecmisiAlani,
    kartGecmisiOlayCoz: kartGecmisiOlayCoz,
    kartGecmisiOlayKodla: kartGecmisiOlayKodla,
    kartGecmisiKaydiGecerli: kartGecmisiKaydiGecerli,
    kartGecmisiKaydiBirlestir: kartGecmisiKaydiBirlestir,
    kartGecmisiBuda: kartGecmisiBuda,
    gunlukSonucBirlestir: gunlukSonucBirlestir,
    kelimeKimligi: kelimeKimligi,
    kelimeIlerlemeKimligi: kelimeIlerlemeKimligi,
    eskiIlerlemeKimligi: eskiIlerlemeKimligi,
    ilerlemeKimligi: ilerlemeKimligi,
    ilerlemeKimliginiCoz: ilerlemeKimliginiCoz,
    kararliJson: kararliJson,
    metaKarsilastir: metaKarsilastir,
    bulutAlaniniKodla: bulutAlaniniKodla,
    bulutAlaniniCoz: bulutAlaniniCoz,
    bulutAlanJson: bulutAlanJson,
    zarfaCevir: zarfaCevir,
    birlestir: birlestir,
    gunlukKaydiBirlestir: gunlukKaydiBirlestir,
    yeniSayacBirlestir: yeniSayacBirlestir,
    paket: paket,
    kayitlariYaz: kayitlariYaz,
    kayitlariSil: kayitlariSil,
    anahtariSil: anahtariSil
  };
})();
