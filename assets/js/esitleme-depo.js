/* ============================================================
   Eşitleme deposu — localStorage ile saf veri motoru arasındaki köprü

   Eski yds-* anahtarları uygulamanın okuma biçimi olarak korunur. Asıl
   eşitleme zarfı tek localStorage yazımıyla güncellenir; diğer sekmeler bu
   zarfı birleştirip klasik anahtarları otomatik olarak yeniler.
   ============================================================ */

(function () {
  'use strict';

  if (!window.YDS || !window.YDS.Depo || !window.YDS.EsitlemeMotoru) return;

  var Depo = window.YDS.Depo;
  var M = window.YDS.EsitlemeMotoru;
  var TIPLER = M.TIPLER;
  var ZARF_ANAHTARI = 'yds-esitleme-v2';
  var GECIS_YEDEGI = 'yds-esitleme-gecis-yedegi';
  var hamOku = Depo.oku;
  var hamYaz = Depo.yaz;
  var hamSil = Depo.sil;

  function kopyala(v) {
    if (v === undefined) return undefined;
    return JSON.parse(JSON.stringify(v));
  }

  function esitMi(a, b) {
    if (a === undefined || b === undefined) return a === b;
    return M.kararliJson(a) === M.kararliJson(b);
  }

  function aktorKimligi() {
    try {
      var sayilar = new Uint32Array(2);
      window.crypto.getRandomValues(sayilar);
      return sayilar[0].toString(36) + sayilar[1].toString(36);
    } catch (e) {
      return Math.random().toString(36).slice(2, 12);
    }
  }

  var aktor = aktorKimligi();
  var mantikSaat = Date.now();

  function saatiGozle(zarf) {
    Object.keys((zarf && zarf.alanlar) || {}).forEach(function (anahtar) {
      var alan = zarf.alanlar[anahtar] || {};
      var metalar = alan.r ? [alan.r] : [];
      Object.keys(alan.i || {}).forEach(function (id) { metalar.push(alan.i[id].m); });
      metalar.forEach(function (m) {
        var z = parseInt(String(m || 0).split(':')[0], 10) || 0;
        if (z > mantikSaat) mantikSaat = z;
      });
    });
  }

  function yeniMeta() {
    mantikSaat = Math.max(Date.now(), mantikSaat + 1);
    return String(mantikSaat) + ':' + aktor;
  }

  function hamPaket() {
    var paket = {};
    Object.keys(TIPLER).forEach(function (anahtar) {
      var v = hamOku(anahtar, undefined);
      if (v !== undefined) paket[anahtar] = v;
    });
    return paket;
  }

  function kayitHaritasi(anahtar, deger) {
    var paket = {};
    paket[anahtar] = deger;
    var alan = M.zarfaCevir(paket).alanlar[anahtar];
    var sonuc = Object.create(null);
    Object.keys((alan && alan.i) || {}).forEach(function (id) { sonuc[id] = alan.i[id].v; });
    return sonuc;
  }

  var durum = hamOku(ZARF_ANAHTARI, null);
  if (!durum || durum.surum !== M.SURUM || !durum.alanlar) {
    var eskiPaket = hamPaket();
    // İlk geçişin ham görüntüsünü yerelde bir kez sakla. Kullanıcıdan işlem
    // istemez; beklenmedik bir sorun olursa eski anahtarlar geri kurulabilir.
    if (Object.keys(eskiPaket).length && hamOku(GECIS_YEDEGI, null) === null) {
      hamYaz(GECIS_YEDEGI, { zaman: Date.now(), veri: eskiPaket });
    }
    durum = M.zarfaCevir(eskiPaket);
    hamYaz(ZARF_ANAHTARI, durum);
  } else {
    durum = M.birlestir(durum, { surum: M.SURUM, alanlar: {} });
  }
  saatiGozle(durum);

  function bildir(anahtarlar, kaynak) {
    if (!anahtarlar.length || typeof window.CustomEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent('yds-depo-degisti', {
      detail: { anahtarlar: anahtarlar, kaynak: kaynak || 'yerel' }
    }));
  }

  function aynala(paket, oncekiPaket) {
    var degisen = [];
    Object.keys(TIPLER).forEach(function (anahtar) {
      var varMi = Object.prototype.hasOwnProperty.call(paket, anahtar);
      var onceVardi = Object.prototype.hasOwnProperty.call(oncekiPaket || {}, anahtar);
      if (varMi) {
        if (!esitMi(hamOku(anahtar, undefined), paket[anahtar])) hamYaz(anahtar, paket[anahtar]);
      } else if (hamOku(anahtar, undefined) !== undefined) {
        hamSil(anahtar);
      }
      if (varMi !== onceVardi || (varMi && !esitMi(paket[anahtar], oncekiPaket[anahtar]))) degisen.push(anahtar);
    });
    return degisen;
  }

  function kaydet(zarf, kaynak, dokunulanlar) {
    var oncekiZarf = durum;
    var oncekiPaket = M.paket(oncekiZarf);
    durum = M.birlestir(zarf, { surum: M.SURUM, alanlar: {} });
    saatiGozle(durum);
    if (!esitMi(hamOku(ZARF_ANAHTARI, null), durum)) hamYaz(ZARF_ANAHTARI, durum);
    var degisen = aynala(M.paket(durum), oncekiPaket);
    var kume = Object.create(null);
    degisen.concat(dokunulanlar || []).forEach(function (a) { if (TIPLER[a]) kume[a] = 1; });
    Object.keys(TIPLER).forEach(function (a) {
      var x = oncekiZarf.alanlar[a], y = durum.alanlar[a];
      if (!esitMi(x, y)) kume[a] = 1;
    });
    var liste = Object.keys(kume);
    bildir(liste, kaynak);
    return { degisti: degisen.length > 0, anahtarlar: liste };
  }

  // Zarfı, sayfanın diğer betikleri yds-* anahtarlarını okumadan önce yansıt.
  aynala(M.paket(durum), {});

  function guncelZarf() {
    var diskte = hamOku(ZARF_ANAHTARI, null);
    if (diskte && diskte.surum === M.SURUM) durum = M.birlestir(durum, diskte);
    saatiGozle(durum);
    return durum;
  }

  function veriYaz(anahtar, deger, kaynak, eskiDeger) {
    if (!TIPLER[anahtar]) return hamYaz(anahtar, deger);
    var zarf = guncelZarf();
    var eski = kayitHaritasi(anahtar,
      arguments.length >= 4 ? eskiDeger : hamOku(anahtar, undefined));
    var yeni = kayitHaritasi(anahtar, deger);
    var yazilacak = Object.create(null);
    var silinecek = [];
    Object.keys(yeni).forEach(function (id) {
      if (eski[id] === undefined || !esitMi(eski[id], yeni[id])) yazilacak[id] = yeni[id];
    });
    Object.keys(eski).forEach(function (id) {
      if (yeni[id] === undefined) silinecek.push(id);
    });
    if (Object.keys(yazilacak).length) zarf = M.kayitlariYaz(zarf, anahtar, yazilacak, yeniMeta);
    if (silinecek.length) zarf = M.kayitlariSil(zarf, anahtar, silinecek, yeniMeta);
    if (!zarf.alanlar[anahtar]) zarf.alanlar[anahtar] = { i: {} };
    kaydet(zarf, kaynak || 'yerel', [anahtar]);
    return true;
  }

  function kayitlariYaz(anahtar, kayitlar, kaynak) {
    if (!TIPLER[anahtar]) return false;
    kaydet(M.kayitlariYaz(guncelZarf(), anahtar, kayitlar || {}, yeniMeta),
      kaynak || 'yerel', [anahtar]);
    return true;
  }

  function kayitlariSil(anahtar, ids, kaynak) {
    if (!TIPLER[anahtar]) return false;
    kaydet(M.kayitlariSil(guncelZarf(), anahtar, ids || [], yeniMeta),
      kaynak || 'yerel', [anahtar]);
    return true;
  }

  function veriSil(anahtar, kaynak) {
    if (!TIPLER[anahtar]) { hamSil(anahtar); return; }
    kaydet(M.anahtariSil(guncelZarf(), anahtar, yeniMeta),
      kaynak || 'yerel', [anahtar]);
  }

  function uygula(gelen, kaynak) {
    return kaydet(M.birlestir(guncelZarf(), M.zarfaCevir(gelen)), kaynak || 'bulut', []);
  }

  Depo.yaz = veriYaz;
  Depo.sil = veriSil;
  Depo.kayitlariYaz = kayitlariYaz;
  Depo.kayitlariSil = kayitlariSil;

  function depolamaDegisti(e) {
    if (!e || !e.key) return;
    if (e.key === ZARF_ANAHTARI && e.newValue) {
      var gelen;
      try { gelen = JSON.parse(e.newValue); } catch (hata) { return; }
      var birlesmis = M.birlestir(durum, gelen);
      if (!esitMi(birlesmis, gelen)) hamYaz(ZARF_ANAHTARI, birlesmis);
      kaydet(birlesmis, 'sekme', []);
      return;
    }
    if (!TIPLER[e.key]) return;
    var beklenen = M.paket(durum);
    var yeni;
    try { yeni = e.newValue === null ? undefined : JSON.parse(e.newValue); } catch (hata2) { return; }
    if (esitMi(beklenen[e.key], yeni)) return;

    // Güncelleme öncesinden açık kalan eski bir sekmenin klasik anahtara
    // yaptığı yazımı da kaybetmeden yeni zarfa taşı.
    var eski;
    try { eski = e.oldValue === null ? undefined : JSON.parse(e.oldValue); } catch (hata3) { eski = undefined; }
    if (yeni === undefined) veriSil(e.key, 'sekme');
    else veriYaz(e.key, yeni, 'sekme', eski);
  }
  window.addEventListener('storage', depolamaDegisti);

  window.YDS.EsitlemeDepo = {
    ANAHTAR: ZARF_ANAHTARI,
    zarf: function () { return kopyala(guncelZarf()); },
    paket: function () { return M.paket(guncelZarf()); },
    uygula: uygula
  };
})();
