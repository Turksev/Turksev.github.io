/* Süreli denemeyi yalnız aynı sekmenin geçici oturumunda güvenle saklar. */
(function () {
  'use strict';

  var Y = window.YDS = window.YDS || {};
  var ANAHTAR = 'yds-deneme-oturum-v1';
  var SURUM = 1;
  var SANIYE_SORU = 135;

  function tamSayi(v, alt, ust) {
    return Number.isInteger(v) && v >= alt && v <= ust;
  }

  function temizle() {
    try { sessionStorage.removeItem(ANAHTAR); return true; } catch (e) { return false; }
  }

  function permutasyonMu(dizi, uzunluk) {
    if (!Array.isArray(dizi) || dizi.length !== uzunluk) return false;
    var gorulen = Object.create(null);
    for (var i = 0; i < dizi.length; i++) {
      if (!tamSayi(dizi[i], 0, uzunluk - 1) || gorulen[dizi[i]]) return false;
      gorulen[dizi[i]] = true;
    }
    return true;
  }

  function esitDizi(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function soruImzasi(s) {
    var metin = JSON.stringify([s.id, s.s, s.se, s.d, s.metin || '', s.pid || '', s.ac || '']);
    var karmas = 2166136261;
    for (var i = 0; i < metin.length; i++) {
      karmas ^= metin.charCodeAt(i);
      karmas = Math.imul(karmas, 16777619);
    }
    return ('00000000' + (karmas >>> 0).toString(16)).slice(-8);
  }

  function sabitDuzen(form, i, uzunluk) {
    if (!form || !Array.isArray(form.sikKaydirma) || !tamSayi(form.sikKaydirma[i], 0, uzunluk - 1)) return null;
    var dizi = [];
    for (var j = 0; j < uzunluk; j++) dizi.push(j);
    var kaydirma = form.sikKaydirma[i];
    return dizi.slice(kaydirma).concat(dizi.slice(0, kaydirma));
  }

  function kaydet(test, bilgi) {
    if (!Array.isArray(test) || !bilgi || [20, 40, 80].indexOf(test.length) < 0) return false;
    if (!tamSayi(bilgi.sira, 0, test.length - 1) || !Number.isFinite(bilgi.baslangic) ||
        !Number.isFinite(bilgi.bitis) || bilgi.bitis - bilgi.baslangic !== test.length * SANIYE_SORU * 1000) return false;
    if (bilgi.tur !== 'tam' && bilgi.tur !== 'karma') return false;
    if ((bilgi.tur === 'tam') !== (test.length === 80 && typeof bilgi.form === 'string' && !!bilgi.form)) return false;

    var sorular = [];
    for (var i = 0; i < test.length; i++) {
      var s = test[i];
      if (!s || typeof s.id !== 'string' || !Array.isArray(s.secenekler) ||
          !permutasyonMu(s.hamDizinler, s.secenekler.length) ||
          typeof s.oturumImzasi !== 'string' || !s.oturumImzasi ||
          !(s.cevap === null || tamSayi(s.cevap, 0, s.secenekler.length - 1))) return false;
      sorular.push({
        id: s.id,
        imza: s.oturumImzasi,
        duzen: s.hamDizinler.slice(),
        cevap: s.cevap,
        isaret: !!s.isaret
      });
    }

    var paket = {
      surum: SURUM,
      kayit: Date.now(),
      baslangic: bilgi.baslangic,
      bitis: bilgi.bitis,
      tur: bilgi.tur,
      form: bilgi.tur === 'tam' ? bilgi.form : '',
      sira: bilgi.sira,
      sorular: sorular
    };
    try { sessionStorage.setItem(ANAHTAR, JSON.stringify(paket)); return true; } catch (e) { return false; }
  }

  function geriYukle(havuz, parcalar, formlar) {
    var paket;
    try {
      var ham = sessionStorage.getItem(ANAHTAR);
      if (!ham) return null;
      paket = JSON.parse(ham);
    } catch (e) { temizle(); return null; }

    var adet = paket && Array.isArray(paket.sorular) ? paket.sorular.length : 0;
    var sure = adet * SANIYE_SORU * 1000;
    if (!paket || paket.surum !== SURUM || [20, 40, 80].indexOf(adet) < 0 ||
        !tamSayi(paket.sira, 0, adet - 1) || !Number.isFinite(paket.baslangic) ||
        !Number.isFinite(paket.bitis) || paket.bitis - paket.baslangic !== sure ||
        paket.baslangic > Date.now() + 60000 ||
        (paket.tur !== 'tam' && paket.tur !== 'karma')) {
      temizle(); return null;
    }

    var tam = paket.tur === 'tam';
    if (tam !== (adet === 80 && typeof paket.form === 'string' && !!paket.form)) {
      temizle(); return null;
    }
    if (!tam && paket.form !== '') { temizle(); return null; }

    var soruHaritasi = Object.create(null);
    (Array.isArray(havuz) ? havuz : []).forEach(function (s) {
      if (s && typeof s.id === 'string') soruHaritasi[s.id] = s;
    });
    var form = null;
    if (tam) {
      (Array.isArray(formlar) ? formlar : []).some(function (f) {
        if (f && f.id === paket.form) { form = f; return true; }
        return false;
      });
      if (!form || !Array.isArray(form.sorular) || form.sorular.length !== adet) {
        temizle(); return null;
      }
    }

    var gorulen = Object.create(null), test = [];
    for (var i = 0; i < adet; i++) {
      var kayit = paket.sorular[i], hamSoru = kayit && soruHaritasi[kayit.id];
      if (!kayit || !hamSoru || gorulen[kayit.id] || !Array.isArray(hamSoru.se) ||
          kayit.imza !== soruImzasi(hamSoru) ||
          !tamSayi(hamSoru.d, 0, hamSoru.se.length - 1) ||
          !permutasyonMu(kayit.duzen, hamSoru.se.length) ||
          !(kayit.cevap === null || tamSayi(kayit.cevap, 0, hamSoru.se.length - 1)) ||
          typeof kayit.isaret !== 'boolean') {
        temizle(); return null;
      }
      gorulen[kayit.id] = true;
      if (tam) {
        var beklenen = sabitDuzen(form, i, hamSoru.se.length);
        if (form.sorular[i] !== kayit.id || !esitDizi(beklenen, kayit.duzen)) {
          temizle(); return null;
        }
      }
      test.push({
        id: hamSoru.id,
        kat: hamSoru.kat,
        konu: hamSoru.konu,
        kaynak: hamSoru.kaynak,
        metin: hamSoru.metin || (hamSoru.pid && parcalar ? parcalar[hamSoru.pid] : '') || '',
        soru: hamSoru.s,
        ac: hamSoru.ac,
        secenekler: kayit.duzen.map(function (d) { return hamSoru.se[d]; }),
        hamDizinler: kayit.duzen.slice(),
        oturumImzasi: kayit.imza,
        dogruIndex: kayit.duzen.indexOf(hamSoru.d),
        cevap: kayit.cevap,
        isaret: kayit.isaret
      });
    }

    return {
      test: test,
      sira: paket.sira,
      aktifForm: paket.form,
      aktifTur: paket.tur,
      baslangic: paket.baslangic,
      bitis: paket.bitis,
      kalanSaniye: Math.max(0, Math.ceil((paket.bitis - Date.now()) / 1000))
    };
  }

  Y.DenemeOturum = {
    kaydet: kaydet,
    geriYukle: geriYukle,
    temizle: temizle,
    soruImzasi: soruImzasi,
    anahtar: ANAHTAR
  };
})();
