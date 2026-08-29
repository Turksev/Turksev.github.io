/* Gizlilik, dışa/içe aktarma ve veri yönetimi. */
(function () {
  'use strict';

  var Y = window.YDS || {};
  var M = Y.EsitlemeMotoru;
  var EsitDepo = Y.EsitlemeDepo;
  var Il = Y.Ilerleme;
  if (!M || !EsitDepo || !Il) return;

  var MAKS_DOSYA = 5 * 1024 * 1024;
  var YEDEK_TURU = 'yds-ilerleme-yedegi';
  var KURTARMA_ANAHTARI = 'yds-ice-aktarma-kurtarma-v1';
  var UYGULAMA_SURUMU = 'yds-v142';
  var ALANLAR = Object.keys(M.TIPLER);
  var SIFIRLANAN_ALANLAR = [
    'yds-leitner', 'yds-yanlis', 'yds-kategori', 'yds-gecmis', 'yds-konular',
    'yds-test-yanlis', 'yds-rekor', 'yds-yeni-sayac'
  ];
  var ALAN_ADLARI = {
    'yds-leitner': 'Kelime ve öbek tekrar kutuları',
    'yds-yanlis': 'Soru yanlış defteri',
    'yds-kategori': 'Kategori performansı',
    'yds-gecmis': 'Deneme ve alıştırma geçmişi',
    'yds-konular': 'Konu haritası ölçümleri ve notları',
    'yds-rekor': 'En iyi alıştırma sonucu',
    'yds-yeni-sayac': 'Bugün açılan yeni kart sayısı',
    'yds-test-yanlis': 'Bağlam testi yanlışları',
    'yds-gunluk-yeni': 'Günlük yeni kart hedefi',
    'yds-gunluk-tavan': 'Günlük toplam kart sınırı',
    'yds-katmanlar': 'Seçili kelime katmanları',
    'yds-eksen': 'Seçili konu haritası ekseni'
  };

  function $(id) { return document.getElementById(id); }

  function durum(metin, tur) {
    var el = $('ayarDurum');
    if (!el) return;
    el.textContent = metin;
    el.className = 'status-kutu' + (tur ? ' ' + tur : '');
  }

  function kayitSayisi(v) {
    if (Array.isArray(v)) return v.length;
    if (v && typeof v === 'object') return Object.keys(v).length;
    return v === undefined ? 0 : 1;
  }

  function ozetCiz() {
    var paket = EsitDepo.paket();
    var toplam = ALANLAR.reduce(function (n, a) { return n + kayitSayisi(paket[a]); }, 0);
    $('yerelOzet').textContent = toplam
      ? toplam.toLocaleString('tr-TR') + ' yerel kayıt/ayar bulundu.'
      : 'Henüz kaydedilmiş çalışma ilerlemesi yok.';
    $('veriAlanlari').innerHTML = ALANLAR.map(function (a) {
      return '<li><span>' + Y.kacar(ALAN_ADLARI[a]) + '</span><b>' +
        kayitSayisi(paket[a]).toLocaleString('tr-TR') + '</b></li>';
    }).join('');
  }

  function tarihDamgasi() {
    var d = new Date();
    function iki(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + iki(d.getMonth() + 1) + '-' + iki(d.getDate()) +
      '_' + iki(d.getHours()) + '-' + iki(d.getMinutes());
  }

  function yedekNesnesi(paket) {
    return {
      tur: YEDEK_TURU,
      sema: 1,
      olusturuldu: new Date().toISOString(),
      uygulamaSurumu: UYGULAMA_SURUMU,
      veri: paket === undefined ? EsitDepo.paket() : paket
    };
  }

  function indir(nesne, ad) {
    var blob = new Blob([JSON.stringify(nesne, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = ad;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function yedekIndir(onEk) {
    indir(yedekNesnesi(), (onEk || 'yds-ilerleme') + '-' + tarihDamgasi() + '.json');
  }

  var KENDI = Object.prototype.hasOwnProperty;
  var MAKS_TAM_SAYI = Number.MAX_SAFE_INTEGER;
  var bekleyenAktarim = null;

  function kendi(o, k) { return !!o && KENDI.call(o, k); }

  function sadeNesne(v) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
    var p = Object.getPrototypeOf(v);
    return p === Object.prototype || p === null;
  }

  function kopyala(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

  function bosHarita() { return Object.create(null); }

  function ata(harita, anahtar, deger) {
    Object.defineProperty(harita, anahtar, {
      value: deger, enumerable: true, configurable: true, writable: true
    });
  }

  function tamSayi(v, enAz, enCok, ad) {
    if (!Number.isInteger(v) || v < enAz || v > enCok) {
      throw new Error(ad + ' geçerli aralıkta bir tam sayı değil.');
    }
    return v;
  }

  function sonluSayi(v, enAz, enCok, ad) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < enAz || v > enCok) {
      throw new Error(ad + ' geçerli aralıkta bir sayı değil.');
    }
    return v;
  }

  function metin(v, enAz, enCok, ad) {
    if (typeof v !== 'string' || v.length < enAz || v.length > enCok) {
      throw new Error(ad + ' geçerli uzunlukta bir metin değil.');
    }
    return v;
  }

  function alanlariDogrula(v, izinli, gerekli, ad) {
    if (!sadeNesne(v)) throw new Error(ad + ' nesne biçiminde değil.');
    var kume = bosHarita();
    izinli.forEach(function (k) { ata(kume, k, true); });
    Object.keys(v).forEach(function (k) {
      if (!kendi(kume, k)) throw new Error(ad + ' tanınmayan “' + k + '” alanını içeriyor.');
    });
    gerekli.forEach(function (k) {
      if (!kendi(v, k)) throw new Error(ad + ' için “' + k + '” alanı eksik.');
    });
  }

  function kimlik(id, ad) {
    metin(id, 1, 2000, ad);
    if (id === '__proto__') throw new Error(ad + ' güvenli olmayan __proto__ kimliğini içeriyor.');
    return id;
  }

  function guvenliJson(v, derinlik, sayac) {
    if (derinlik > 16) throw new Error('Yedek gereğinden fazla iç içe veri içeriyor.');
    sayac.n++;
    if (sayac.n > 150000) throw new Error('Yedekte izin verilenden fazla kayıt var.');
    if (v === null || typeof v === 'boolean') return;
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) throw new Error('Yedekte geçersiz sayı var.');
      return;
    }
    if (typeof v === 'string') {
      if (v.length > 200000) throw new Error('Yedekte izin verilenden uzun bir metin var.');
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(function (x) { guvenliJson(x, derinlik + 1, sayac); });
      return;
    }
    if (!sadeNesne(v)) throw new Error('Yedekte desteklenmeyen veri türü var.');
    Object.keys(v).forEach(function (k) {
      if (k === '__proto__') throw new Error('Yedekte güvenli olmayan __proto__ alan adı var.');
      if (k.length > 1000) throw new Error('Yedekte geçersiz uzunlukta alan adı var.');
      guvenliJson(v[k], derinlik + 1, sayac);
    });
  }

  function leitnerKaydi(v, ad) {
    alanlariDogrula(v, ['k', 'g', 'c', 'm'], ['k', 'g'], ad);
    var r = { k: tamSayi(v.k, 1, 5, ad + ' kutusu'), g: tamSayi(v.g, 0, 10000000, ad + ' tekrar günü') };
    if (kendi(v, 'c')) r.c = tamSayi(v.c, 0, 10000000, ad + ' çalışma günü');
    if (kendi(v, 'm')) r.m = tamSayi(v.m, 0, 1000, ad + ' bakım aşaması');
    return r;
  }

  function yanlisKaydi(v, ad) {
    alanlariDogrula(v, ['a', 'kat', 'n', 't', 'u', 'c', 'sd'], ['a', 'n', 't'], ad);
    var r = {
      a: metin(v.a, 1, 20000, ad + ' kimliği'),
      kat: kendi(v, 'kat') ? metin(v.kat, 0, 500, ad + ' kategorisi') : '',
      n: tamSayi(v.n, 1, 1000000, ad + ' yanlış sayısı'),
      t: tamSayi(v.t, 1, MAKS_TAM_SAYI, ad + ' zamanı'),
      u: kendi(v, 'u') ? tamSayi(v.u, 1, MAKS_TAM_SAYI, ad + ' güncelleme zamanı') : v.t,
      c: kendi(v, 'c') ? tamSayi(v.c, 0, 1, ad + ' doğru gün sayısı') : 0
    };
    if (kendi(v, 'sd')) r.sd = tamSayi(v.sd, 0, 10000000, ad + ' son doğru günü');
    return r;
  }

  function kategoriKaydi(v, ad) {
    alanlariDogrula(v, ['d', 'y', 'r'], ['d', 'y'], ad);
    var r = {
      d: tamSayi(v.d, 0, 1000000000, ad + ' doğru sayısı'),
      y: tamSayi(v.y, 0, 1000000000, ad + ' yanlış sayısı')
    };
    if (kendi(v, 'r')) {
      if (!Array.isArray(v.r) || v.r.length > 80) throw new Error(ad + ' son soru listesi en çok 80 kayıt içerebilir.');
      r.r = v.r.map(function (x, i) {
        var satir = ad + ' son soru ' + (i + 1);
        alanlariDogrula(x, ['id', 'd', 't'], ['id', 'd', 't'], satir);
        return {
          id: metin(x.id, 1, 5000, satir + ' kimliği'),
          d: tamSayi(x.d, 0, 1, satir + ' sonucu'),
          t: tamSayi(x.t, 1, MAKS_TAM_SAYI, satir + ' zamanı')
        };
      });
    }
    return r;
  }

  function gecmisKaydi(v, ad) {
    alanlariDogrula(v, ['t', 'd', 'n', 'y', 'm', 'f', 'a'], ['t', 'd', 'n', 'y'], ad);
    var n = tamSayi(v.n, 1, 10000, ad + ' toplamı');
    var d = tamSayi(v.d, 0, n, ad + ' doğru sayısı');
    var y = sonluSayi(v.y, 0, 100, ad + ' puanı/yüzdesi');
    var tamYuzde = Math.round(d / n * 100);
    var ydsPuani = Math.round(d / n * 10000) / 100;
    if (y !== tamYuzde && y !== ydsPuani) {
      throw new Error(ad + ' puanı doğru/toplam ile uyuşmuyor.');
    }
    return {
      t: tamSayi(v.t, 1, MAKS_TAM_SAYI, ad + ' zamanı'), d: d, n: n, y: y,
      m: kendi(v, 'm') ? metin(v.m, 0, 100, ad + ' modu') : '',
      f: kendi(v, 'f') ? metin(v.f, 0, 100, ad + ' formu') : '',
      a: kendi(v, 'a') ? metin(v.a, 0, 100, ad + ' türü') : ''
    };
  }

  function konuKaydi(v, ad) {
    alanlariDogrula(v, ['d', 't', 'g', 'n', 'ta', 'ga', 'u'], ['d'], ad);
    var r = {
      d: tamSayi(v.d, 0, 2, ad + ' durumu'),
      t: !kendi(v, 't') || v.t === null ? null : tamSayi(v.t, 0, 100, ad + ' tanı puanı'),
      g: !kendi(v, 'g') || v.g === null ? null : tamSayi(v.g, 0, 100, ad + ' gecikmeli puanı'),
      n: kendi(v, 'n') ? metin(v.n, 0, 200000, ad + ' notu') : ''
    };
    if (kendi(v, 'ta')) r.ta = tamSayi(v.ta, 0, 10000000, ad + ' tanı günü');
    if (kendi(v, 'ga')) r.ga = tamSayi(v.ga, 0, 10000000, ad + ' gecikmeli günü');
    if (kendi(v, 'u')) r.u = tamSayi(v.u, 1, MAKS_TAM_SAYI, ad + ' güncelleme zamanı');
    return r;
  }

  function rekorKaydi(v, ad) {
    alanlariDogrula(v, ['yuzde', 'dogru', 'toplam'], ['yuzde', 'dogru', 'toplam'], ad);
    var toplam = tamSayi(v.toplam, 1, 10000, ad + ' toplamı');
    var dogru = tamSayi(v.dogru, 0, toplam, ad + ' doğru sayısı');
    var yuzde = tamSayi(v.yuzde, 0, 100, ad + ' yüzdesi');
    if (Math.round(dogru / toplam * 100) !== yuzde) throw new Error(ad + ' yüzdesi doğru/toplam ile uyuşmuyor.');
    return { yuzde: yuzde, dogru: dogru, toplam: toplam };
  }

  function sayacKaydi(v, ad) {
    alanlariDogrula(v, ['g', 'n', 'ek'], ['g', 'n'], ad);
    return {
      g: tamSayi(v.g, 0, 10000000, ad + ' günü'),
      n: tamSayi(v.n, 0, 1000000, ad + ' yeni kart sayısı'),
      ek: kendi(v, 'ek') ? tamSayi(v.ek, 0, 1000000, ad + ' ek payı') : 0
    };
  }

  function testYanlisKaydi(v, ad) {
    alanlariDogrula(v, ['n', 't', 'u', 'c', 'sd'], ['n', 't'], ad);
    var r = {
      n: tamSayi(v.n, 1, 1000000, ad + ' yanlış sayısı'),
      t: tamSayi(v.t, 1, MAKS_TAM_SAYI, ad + ' zamanı'),
      u: kendi(v, 'u') ? tamSayi(v.u, 1, MAKS_TAM_SAYI, ad + ' güncelleme zamanı') : v.t,
      c: kendi(v, 'c') ? tamSayi(v.c, 0, 1, ad + ' doğru gün sayısı') : 0
    };
    if (kendi(v, 'sd')) r.sd = tamSayi(v.sd, 0, 10000000, ad + ' son doğru günü');
    return r;
  }

  function haritaDogrula(v, alan, kayitDogrula, kimligiNormallestir) {
    if (!sadeNesne(v)) throw new Error(ALAN_ADLARI[alan] + ' nesne biçiminde değil.');
    var sonuc = bosHarita();
    Object.keys(v).forEach(function (hamId) {
      kimlik(hamId, ALAN_ADLARI[alan] + ' kimliği');
      var id = kimligiNormallestir ? String(kimligiNormallestir(hamId)) : hamId;
      kimlik(id, ALAN_ADLARI[alan] + ' normalize kimliği');
      if (kendi(sonuc, id)) throw new Error(ALAN_ADLARI[alan] + ' aynı normalize kimliği birden fazla içeriyor: ' + id);
      ata(sonuc, id, kayitDogrula(v[hamId], ALAN_ADLARI[alan] + ' / ' + hamId));
    });
    return sonuc;
  }

  function alaniDogrula(alan, v) {
    if (alan === 'yds-leitner') return haritaDogrula(v, alan, leitnerKaydi, M.eskiIlerlemeKimligi);
    if (alan === 'yds-yanlis') {
      if (!Array.isArray(v) || v.length > 20000) throw new Error(ALAN_ADLARI[alan] + ' en çok 20.000 kayıtlık bir liste olmalı.');
      var gorulen = bosHarita();
      return v.map(function (x, i) {
        var r = yanlisKaydi(x, ALAN_ADLARI[alan] + ' / ' + (i + 1));
        kimlik(r.a, ALAN_ADLARI[alan] + ' soru kimliği');
        if (kendi(gorulen, r.a)) throw new Error(ALAN_ADLARI[alan] + ' yinelenen soru kimliği içeriyor: ' + r.a);
        ata(gorulen, r.a, true);
        return r;
      });
    }
    if (alan === 'yds-kategori') return haritaDogrula(v, alan, kategoriKaydi);
    if (alan === 'yds-gecmis') {
      if (!Array.isArray(v) || v.length > 50) throw new Error(ALAN_ADLARI[alan] + ' en çok 50 kayıtlık bir liste olmalı.');
      return v.map(function (x, i) { return gecmisKaydi(x, ALAN_ADLARI[alan] + ' / ' + (i + 1)); });
    }
    if (alan === 'yds-konular') return haritaDogrula(v, alan, konuKaydi);
    if (alan === 'yds-rekor') return rekorKaydi(v, ALAN_ADLARI[alan]);
    if (alan === 'yds-yeni-sayac') return sayacKaydi(v, ALAN_ADLARI[alan]);
    if (alan === 'yds-test-yanlis') return haritaDogrula(v, alan, testYanlisKaydi, M.eskiIlerlemeKimligi);
    if (alan === 'yds-gunluk-yeni') return tamSayi(v, 1, 9999, ALAN_ADLARI[alan]);
    if (alan === 'yds-gunluk-tavan') return tamSayi(v, 1, 9999, ALAN_ADLARI[alan]);
    if (alan === 'yds-katmanlar') {
      if (!Array.isArray(v) || v.length > 7) throw new Error(ALAN_ADLARI[alan] + ' 0–7 katman içeren bir liste olmalı.');
      var katmanlar = v.map(function (x) { return tamSayi(x, 1, 7, ALAN_ADLARI[alan]); });
      if (new Set(katmanlar).size !== katmanlar.length) throw new Error(ALAN_ADLARI[alan] + ' yinelenen katman içeriyor.');
      return katmanlar.sort(function (a, b) { return a - b; });
    }
    if (alan === 'yds-eksen') return tamSayi(v, 0, 1, ALAN_ADLARI[alan]);
    throw new Error('Tanınmayan veri alanı: ' + alan);
  }

  function yedegiDogrula(y) {
    if (M.eskiIlerlemeKimligi &&
        (M.eskiIlerlemeKimligi('prototype') !== 'prototype' ||
         M.eskiIlerlemeKimligi('constructor') !== 'constructor')) {
      throw new Error('Özel kelime kimlikleri bu tarayıcıda güvenle normalize edilemiyor; hiçbir veri değiştirilmedi.');
    }
    if (!sadeNesne(y) || y.tur !== YEDEK_TURU || y.sema !== 1 || !sadeNesne(y.veri)) {
      throw new Error('Bu dosya geçerli bir YDS ilerleme yedeği değil.');
    }
    alanlariDogrula(y, ['tur', 'sema', 'olusturuldu', 'uygulamaSurumu', 'veri'],
      ['tur', 'sema', 'olusturuldu', 'uygulamaSurumu', 'veri'], 'Yedek');
    metin(y.olusturuldu, 1, 100, 'Yedek oluşturulma zamanı');
    if (!Number.isFinite(Date.parse(y.olusturuldu))) throw new Error('Yedek oluşturulma zamanı geçersiz.');
    metin(y.uygulamaSurumu, 1, 100, 'Yedek uygulama sürümü');
    guvenliJson(y.veri, 0, { n: 0 });
    var anahtarlar = Object.keys(y.veri);
    if (!anahtarlar.length) throw new Error('Yedekte aktarılacak ilerleme alanı yok.');
    var sonuc = {};
    anahtarlar.forEach(function (a) {
      if (!kendi(M.TIPLER, a)) throw new Error('Yedek tanınmayan bir veri alanı içeriyor: ' + a);
      sonuc[a] = alaniDogrula(a, y.veri[a]);
    });
    return sonuc;
  }

  function haritaKopyala(v) {
    var sonuc = bosHarita();
    Object.keys(v || {}).forEach(function (k) { ata(sonuc, k, kopyala(v[k])); });
    return sonuc;
  }

  function sayisalMaks(a, b, ad) {
    var x = a && typeof a[ad] === 'number' ? a[ad] : undefined;
    var y = b && typeof b[ad] === 'number' ? b[ad] : undefined;
    if (x === undefined) return y;
    if (y === undefined) return x;
    return Math.max(x, y);
  }

  function leitnerBirlestir(eski, gelen) {
    if (!sadeNesne(eski)) return kopyala(gelen);
    if (gelen.k < eski.k) return kopyala(eski);
    if (gelen.k > eski.k) return kopyala(gelen);
    var temel = kopyala(eski);
    ['g', 'c', 'm'].forEach(function (a) {
      var n = sayisalMaks(eski, gelen, a);
      if (n !== undefined) temel[a] = n;
    });
    return temel;
  }

  function yanlisBirlestir(eski, gelen, kimlikli) {
    if (!sadeNesne(eski)) return kopyala(gelen);
    var temel = kopyala(eski);
    if (kimlikli) temel.a = eski.a || gelen.a;
    if (kimlikli && !temel.kat && gelen.kat) temel.kat = gelen.kat;
    ['n', 't', 'u', 'c', 'sd'].forEach(function (a) {
      var n = sayisalMaks(eski, gelen, a);
      if (n !== undefined) temel[a] = n;
    });
    return temel;
  }

  function sonSorulariBirlestir(eski, gelen) {
    var sonuc = Array.isArray(eski) ? kopyala(eski) : [];
    var ids = bosHarita();
    sonuc.forEach(function (r) { if (r && r.id) ata(ids, r.id, true); });
    (gelen || []).forEach(function (r) {
      if (sonuc.length >= 80 || kendi(ids, r.id)) return;
      sonuc.push(kopyala(r));
      ata(ids, r.id, true);
    });
    return sonuc;
  }

  function kategoriBirlestir(eski, gelen) {
    if (!sadeNesne(eski)) return kopyala(gelen);
    var temel = kopyala(eski);
    temel.d = Math.max(eski.d || 0, gelen.d || 0);
    temel.y = Math.max(eski.y || 0, gelen.y || 0);
    if (Array.isArray(eski.r) || Array.isArray(gelen.r)) temel.r = sonSorulariBirlestir(eski.r, gelen.r);
    return temel;
  }

  function konuBirlestir(eski, gelen) {
    if (!sadeNesne(eski)) return kopyala(gelen);
    var temel = kopyala(eski);
    temel.d = Math.max(eski.d || 0, gelen.d || 0);
    ['t', 'g', 'ta', 'ga', 'u'].forEach(function (a) {
      var n = sayisalMaks(eski, gelen, a);
      if (n !== undefined) temel[a] = n;
    });
    if (!temel.n && gelen.n) temel.n = gelen.n;
    return temel;
  }

  function haritaBirlestir(eski, gelen, birlestirici) {
    var sonuc = haritaKopyala(sadeNesne(eski) ? eski : {});
    Object.keys(gelen || {}).forEach(function (id) {
      ata(sonuc, id, kendi(sonuc, id) ? birlestirici(sonuc[id], gelen[id]) : kopyala(gelen[id]));
    });
    return sonuc;
  }

  function yanlisListesiBirlestir(eski, gelen) {
    if (!Array.isArray(eski)) return kopyala(gelen);
    var sonuc = kopyala(eski);
    var yerler = bosHarita();
    sonuc.forEach(function (r, i) { if (r && typeof r.a === 'string') ata(yerler, r.a, i); });
    gelen.forEach(function (r) {
      if (kendi(yerler, r.a)) sonuc[yerler[r.a]] = yanlisBirlestir(sonuc[yerler[r.a]], r, true);
      else { ata(yerler, r.a, sonuc.length); sonuc.push(kopyala(r)); }
    });
    return sonuc;
  }

  function gecmisBirlestir(eski, gelen) {
    if (!Array.isArray(eski)) return kopyala(gelen).slice(-50);
    var sonuc = kopyala(eski);
    var ids = bosHarita();
    function id(r) { return [r.t, r.m || '', r.d || 0, r.n || 0, r.y || 0].join('|'); }
    sonuc.forEach(function (r) { ata(ids, id(r), true); });
    gelen.slice().sort(function (a, b) { return b.t - a.t; }).some(function (r) {
      if (sonuc.length >= 50) return true;
      var k = id(r);
      if (!kendi(ids, k)) { sonuc.push(kopyala(r)); ata(ids, k, true); }
      return sonuc.length >= 50;
    });
    return sonuc.sort(function (a, b) { return a.t - b.t; });
  }

  function rekorBirlestir(eski, gelen) {
    if (!sadeNesne(eski)) return kopyala(gelen);
    if (gelen.yuzde !== eski.yuzde) return gelen.yuzde > eski.yuzde ? kopyala(gelen) : kopyala(eski);
    return gelen.dogru > eski.dogru ? kopyala(gelen) : kopyala(eski);
  }

  function sayacBirlestir(eski, gelen) {
    if (!sadeNesne(eski)) return kopyala(gelen);
    if (gelen.g !== eski.g) return gelen.g > eski.g ? kopyala(gelen) : kopyala(eski);
    return { g: eski.g, n: Math.max(eski.n || 0, gelen.n || 0), ek: Math.max(eski.ek || 0, gelen.ek || 0) };
  }

  function guvenliBirlestir(mevcut, gelen) {
    mevcut = sadeNesne(mevcut) ? mevcut : {};
    var sonuc = kopyala(mevcut);
    Object.keys(gelen).forEach(function (a) {
      if (!kendi(mevcut, a)) { sonuc[a] = kopyala(gelen[a]); return; }
      if (a === 'yds-leitner') sonuc[a] = haritaBirlestir(mevcut[a], gelen[a], leitnerBirlestir);
      else if (a === 'yds-yanlis') sonuc[a] = yanlisListesiBirlestir(mevcut[a], gelen[a]);
      else if (a === 'yds-kategori') sonuc[a] = haritaBirlestir(mevcut[a], gelen[a], kategoriBirlestir);
      else if (a === 'yds-gecmis') sonuc[a] = gecmisBirlestir(mevcut[a], gelen[a]);
      else if (a === 'yds-konular') sonuc[a] = haritaBirlestir(mevcut[a], gelen[a], konuBirlestir);
      else if (a === 'yds-rekor') sonuc[a] = rekorBirlestir(mevcut[a], gelen[a]);
      else if (a === 'yds-yeni-sayac') sonuc[a] = sayacBirlestir(mevcut[a], gelen[a]);
      else if (a === 'yds-test-yanlis') sonuc[a] = haritaBirlestir(mevcut[a], gelen[a], function (x, y) { return yanlisBirlestir(x, y, false); });
      // Çalışma tercihleri çakışırsa bu cihazdaki seçim korunur.
      else sonuc[a] = kopyala(mevcut[a]);
    });
    return sonuc;
  }

  function paketImzasi(paket) { return M.kararliJson ? M.kararliJson(paket) : JSON.stringify(paket); }

  function toplamKayit(paket) {
    return ALANLAR.reduce(function (n, a) { return n + (kendi(paket, a) ? kayitSayisi(paket[a]) : 0); }, 0);
  }

  function onizlemeCiz(gelen, mevcut, birlesmis) {
    var kutu = $('iceAktarOnizleme');
    var liste = $('iceAktarAlanlar');
    var degisen = Object.keys(gelen).filter(function (a) {
      return paketImzasi(mevcut[a]) !== paketImzasi(birlesmis[a]);
    });
    $('iceAktarOzet').textContent = 'Mevcut: ' + toplamKayit(mevcut).toLocaleString('tr-TR') +
      ' · Yedek: ' + toplamKayit(gelen).toLocaleString('tr-TR') +
      ' · Birleşim: ' + toplamKayit(birlesmis).toLocaleString('tr-TR') + ' kayıt/ayar.';
    liste.innerHTML = '';
    Object.keys(gelen).forEach(function (a) {
      var li = document.createElement('li');
      var span = document.createElement('span');
      var b = document.createElement('b');
      span.textContent = ALAN_ADLARI[a];
      b.textContent = degisen.indexOf(a) === -1 ? 'mevcut korunacak' :
        (kendi(mevcut, a) ? 'kayıpsız birleştirilecek' : 'eklenecek');
      li.appendChild(span); li.appendChild(b); liste.appendChild(li);
    });
    kutu.hidden = false;
    $('iceAktarOnay').focus();
  }

  function onizlemeyiKapat() {
    bekleyenAktarim = null;
    $('iceAktarOnizleme').hidden = true;
    $('iceAktarAlanlar').innerHTML = '';
  }

  function kurtarmaYaz(mevcut) {
    var ham = JSON.stringify(yedekNesnesi(mevcut));
    try {
      window.localStorage.setItem(KURTARMA_ANAHTARI, ham);
      if (window.localStorage.getItem(KURTARMA_ANAHTARI) !== ham) throw new Error('Kurtarma kopyası doğrulanamadı.');
    } catch (hata) {
      throw new Error('İçe aktarma öncesi yerel kurtarma kopyası yazılamadı; hiçbir veri değiştirilmedi. Tarayıcı depolama alanını denetleyip yeniden deneyin.');
    }
    return true;
  }

  function dosyaOku(dosya) {
    if (!dosya) return;
    if (dosya.size > MAKS_DOSYA) {
      durum('Dosya 5 MB sınırını aşıyor; içe aktarma yapılmadı.', 'err');
      return;
    }
    dosya.text().then(function (ham) {
      var yedek;
      try { yedek = JSON.parse(ham); }
      catch (e) { throw new Error('Dosya geçerli JSON değil.'); }
      var gelen = yedegiDogrula(yedek);
      var mevcut = EsitDepo.paket();
      var birlesmis = guvenliBirlestir(mevcut, gelen);
      bekleyenAktarim = { gelen: gelen, mevcutImza: paketImzasi(mevcut) };
      onizlemeCiz(gelen, mevcut, birlesmis);
      durum('Yedek doğrulandı. Aşağıdaki özeti inceleyip açıkça onaylamadan hiçbir veri yazılmayacak.');
    }).catch(function (hata) {
      onizlemeyiKapat();
      durum(hata && hata.message ? hata.message : 'Yedek içe aktarılamadı.', 'err');
    }).finally(function () { $('iceAktarDosya').value = ''; });
  }

  function resetOzeti(paket) {
    var satirlar = SIFIRLANAN_ALANLAR.map(function (a) {
      return '• ' + ALAN_ADLARI[a] + ': ' + (kendi(paket, a) ? kayitSayisi(paket[a]) : 0);
    });
    return 'Sıfırlanacak 8 ilerleme alanı:\n' + satirlar.join('\n') +
      '\n• Varsa eski sürüm uyumluluk kaydı\n\nKorunacak 4 çalışma tercihi:\n' +
      '• Günlük yeni kart hedefi\n• Günlük toplam kart sınırı\n• Seçili kelime katmanları\n• Seçili konu haritası ekseni';
  }

  function resetOnayi() {
    var ek = '';
    var api = esitApi();
    var s = api && api.oturumDurumu ? api.oturumDurumu() : {};
    if (s && s.bagli) ek = '\n\nBulut eşitleme bağlı: sıfırlama diğer cihazlara da yansıyabilir.';
    if (!window.confirm(resetOzeti(EsitDepo.paket()) +
      '\n\nÖnce 7 gün geri alınabilen yerel yedek oluşturulacak.' + ek + '\n\nDevam edilsin mi?')) return false;
    return window.confirm('SON ONAY\n\nYukarıdaki 8 ilerleme alanını sıfırlamak istediğinden emin misin? Dört çalışma tercihin korunacak.');
  }

  function esitApi() { return Y.Esitleme || null; }

  function bulutCiz(gelen) {
    var api = esitApi();
    var s = gelen && gelen.detail ? gelen.detail :
      (api && api.oturumDurumu ? api.oturumDurumu() : {});
    var bagli = !!(s && (s.bagli || s.kullanici));
    var silindi = !!(s && s.silindi);
    var silmeHazir = !!(s && s.silmeHazir);
    var eposta = s && (s.eposta || (s.kullanici && s.kullanici.email));
    $('bulutDurum').textContent = silindi
      ? 'Bu hesap için bulut eşitleme kilitli. Yerel verilerin korunuyor.'
      : (bagli ? 'Bağlı' + (eposta ? ': ' + eposta : '') : 'Bulut eşitleme bağlı değil.');
    $('bulutBaglan').hidden = bagli;
    $('bulutCik').disabled = !bagli;
    $('bulutSil').disabled = !bagli || !silmeHazir;
    $('bulutSilNot').hidden = silmeHazir;
    $('bulutYeniden').hidden = !(bagli && silindi);
    $('bulutYeniden').disabled = true;
    $('bulutYenidenNot').hidden = !(bagli && silindi);
  }

  function apiCagir(ad) {
    var api = esitApi();
    if (!api || typeof api[ad] !== 'function') return Promise.reject(new Error('Bulut eşitleme bu tarayıcıda kullanılamıyor.'));
    return Promise.resolve(api[ad]());
  }

  $('disaAktar').addEventListener('click', function () {
    yedekIndir('yds-ilerleme');
    durum('İlerleme yedeği indirildi.', 'ok');
  });
  $('iceAktarDosya').addEventListener('change', function () { dosyaOku(this.files && this.files[0]); });
  $('iceAktarIptal').addEventListener('click', function () {
    onizlemeyiKapat();
    durum('İçe aktarma iptal edildi; hiçbir veri değiştirilmedi.');
  });
  $('iceAktarOnay').addEventListener('click', function () {
    if (!bekleyenAktarim) return;
    var mevcut = EsitDepo.paket();
    var birlesmis = guvenliBirlestir(mevcut, bekleyenAktarim.gelen);
    if (paketImzasi(mevcut) !== bekleyenAktarim.mevcutImza) {
      bekleyenAktarim.mevcutImza = paketImzasi(mevcut);
      onizlemeCiz(bekleyenAktarim.gelen, mevcut, birlesmis);
      durum('İlerleme önizleme açıkken değişti. Güncel özet hazırlandı; lütfen yeniden inceleyip tekrar onayla.');
      return;
    }
    try {
      // Bu anahtar 12 eşitleme alanından biri değildir; yalnız bu tarayıcıda kalır.
      kurtarmaYaz(mevcut);
      if (EsitDepo.paketYaz(birlesmis, 'ice-aktar') === false) {
        throw new Error('Birleştirilen ilerleme tarayıcıya yazılamadı; mevcut veriler ve yerel kurtarma kopyası korundu.');
      }
      onizlemeyiKapat();
      ozetCiz();
      durum('Yedek kayıpsız birleştirildi. İçe aktarma öncesi kurtarma kopyası yalnız bu tarayıcıda saklandı.', 'ok');
    } catch (hata) {
      durum(hata && hata.message ? hata.message : 'Yedek içe aktarılamadı.', 'err');
    }
  });

  $('yerelSil').addEventListener('click', function () {
    if (!resetOnayi()) return;
    if (!Il.hepsiniSifirla()) { Y.depolamaUyarisi(); return; }
    ozetCiz();
    if (geriAlCiz) geriAlCiz();
    durum('Sekiz yerel ilerleme alanı sıfırlandı; dört çalışma tercihi korundu. Aşağıdaki “Geri al” düğmesi yedi gün kullanılabilir.', 'ok');
  });

  $('bulutBaglan').addEventListener('click', function () {
    durum('Google giriş penceresi hazırlanıyor…');
    apiCagir('girisYap').catch(function (hata) { durum(hata.message || 'Giriş başlatılamadı.', 'err'); });
  });
  $('bulutCik').addEventListener('click', function () {
    apiCagir('cikisYap').then(function () { durum('Bulut bağlantısı kesildi; bulut kopyası silinmedi.', 'ok'); })
      .catch(function (hata) { durum(hata.message || 'Çıkış yapılamadı.', 'err'); });
  });
  $('bulutSil').addEventListener('click', function () {
    if (!window.confirm('Buluttaki eşitleme kopyan silinecek. Bu tarayıcıdaki ilerlemen korunacak. Devam edilsin mi?')) return;
    if (window.prompt('Son onay için BULUTU SİL yaz:') !== 'BULUTU SİL') {
      durum('Bulut silme iptal edildi.');
      return;
    }
    yedekIndir('yds-bulut-silme-oncesi');
    durum('Bulut verisi siliniyor…');
    apiCagir('bulutVerisiniSil').then(function () {
      durum('Bulut kopyası silindi ve eski cihazların yeniden yüklemesini önleyen kilit etkinleştirildi. Yerel ilerleme korunuyor.', 'ok');
      bulutCiz();
    }).catch(function (hata) { durum(hata.message || 'Bulut verisi silinemedi.', 'err'); });
  });
  $('bulutYeniden').addEventListener('click', function () {
    if (!window.confirm('Bulut eşitleme yeniden açılacak ve bu tarayıcıdaki ilerleme hesaba yüklenebilecek. Devam edilsin mi?')) return;
    apiCagir('yenidenEtkinlestir').then(function () {
      durum('Bulut eşitleme yeniden etkinleştirildi.', 'ok');
      bulutCiz();
    }).catch(function (hata) { durum(hata.message || 'Eşitleme yeniden açılamadı.', 'err'); });
  });

  window.addEventListener('yds-esitleme-durumu', bulutCiz);
  window.addEventListener('yds-depo-degisti', ozetCiz);
  Y.AyarlarGuvenlik = {
    yedegiDogrula: yedegiDogrula,
    guvenliBirlestir: guvenliBirlestir,
    kurtarmaYaz: kurtarmaYaz,
    kurtarmaAnahtari: KURTARMA_ANAHTARI,
    resetOzeti: resetOzeti
  };
  var geriAlCiz = Y.geriAlKutusu(function () { ozetCiz(); durum('Son sıfırlama yedeği mevcut ilerlemeyle birleştirildi.', 'ok'); });
  ozetCiz();
  bulutCiz();
  durum('Verilerin hazır. Dışa aktarma mevcut ilerlemeyi değiştirmez.');
})();
