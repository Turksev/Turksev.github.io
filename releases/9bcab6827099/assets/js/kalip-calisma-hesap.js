/* Kalıp çalışmasının DOM ve depolamadan bağımsız soru/tur kuralları. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) (root.YDS = root.YDS || {}).KalipCalismaHesap = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var ADLAR = {anlam:'Anlam seçme', edat:'Edat tamamlama', yapi:'Yapıları karşılaştırma'};
  function sade(s) { return String(s || '').toLocaleLowerCase('tr').replace(/ı/g, 'i'); }
  function karistir(list, rng) {
    var a = list.slice(); rng = rng || Math.random;
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function sec(bank, ayar, kayit) {
    var q = sade(ayar.ara).trim();
    return bank.sorular.filter(function (s) {
      return (ayar.tur === 'karma' || s.tur === ayar.tur) &&
        (ayar.kapsam !== 'tekrar' || (kayit[s.id] && kayit[s.id].sonuc === 'yanlis')) &&
        (!q || sade(s.kelime).indexOf(q) !== -1);
    });
  }
  function kur(bank, sorular, adet, epoch, rng) {
    var list = karistir(sorular, rng).slice(0, adet);
    return {v:1, bank:bank.surum, epoch:epoch, ids:list.map(function (s) { return s.id; }), sira:0,
      cevaplar:[], duzenler:list.map(function (s) { return karistir(s.secenekler.map(function (_, i) { return i; }), rng); })};
  }
  function gecerli(t, bank, epoch) {
    if (!t || t.v !== 1 || t.bank !== bank.surum || t.epoch !== epoch || !Array.isArray(t.ids) ||
        !t.ids.length || t.ids.length > bank.sorular.length || new Set(t.ids).size !== t.ids.length ||
        !Number.isInteger(t.sira) || t.sira < 0 || t.sira > t.ids.length || !Array.isArray(t.cevaplar) ||
        !Array.isArray(t.duzenler) || t.duzenler.length !== t.ids.length ||
        t.cevaplar.length < t.sira || t.cevaplar.length > Math.min(t.sira + 1, t.ids.length)) return false;
    var map = Object.create(null); bank.sorular.forEach(function (s) { map[s.id] = s; });
    return t.ids.every(function (id, i) {
      var s = map[id], d = t.duzenler[i], a = t.cevaplar[i];
      return !!s && Array.isArray(d) && d.length === s.secenekler.length && new Set(d).size === d.length &&
        d.every(function (n) { return Number.isInteger(n) && n >= 0 && n < d.length; }) &&
        (i >= t.cevaplar.length || (Number.isInteger(a) && a >= -1 && a < d.length));
    });
  }
  function cevapla(t, s, index) {
    if (!t || t.ids[t.sira] !== s.id || t.cevaplar.length !== t.sira || !Number.isInteger(index) || index < -1 || index >= s.secenekler.length) return false;
    t.cevaplar.push(index); return true;
  }
  function ozet(t, map) {
    var out = {dogru:0, yanlis:[], turler:{anlam:{dogru:0,toplam:0},edat:{dogru:0,toplam:0},yapi:{dogru:0,toplam:0}}};
    t.cevaplar.forEach(function (a, i) {
      var s = map[t.ids[i]], ok = a === s.cevap;
      out.turler[s.tur].toplam++;
      if (ok) { out.dogru++; out.turler[s.tur].dogru++; } else out.yanlis.push(s.id);
    });
    return out;
  }
  return {adlar:ADLAR, sec:sec, kur:kur, gecerli:gecerli, cevapla:cevapla, ozet:ozet};
});
