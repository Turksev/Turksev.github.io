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
  var ALIAS_GECIS_YEDEGI = 'yds-kelime-alias-gecis-yedegi';
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

  function eskiAliasKayitlari(zarf) {
    var bulunan = {};
    ['yds-leitner', 'yds-test-yanlis'].forEach(function (anahtar) {
      var alan = zarf && zarf.alanlar && zarf.alanlar[anahtar];
      Object.keys((alan && alan.i) || {}).forEach(function (id) {
        var yeniId = M.eskiIlerlemeKimligi
          ? M.eskiIlerlemeKimligi(id) : M.kelimeKimligi(id);
        if (yeniId === id) return;
        if (!bulunan[anahtar]) bulunan[anahtar] = {};
        bulunan[anahtar][id] = kopyala(alan.i[id]);
      });
    });
    return bulunan;
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
  var zarfKalici = !!(durum && durum.surum === M.SURUM && durum.alanlar);
  if (!durum || durum.surum !== M.SURUM || !durum.alanlar) {
    var eskiPaket = hamPaket();
    // İlk geçişin ham görüntüsünü yerelde bir kez sakla. Kullanıcıdan işlem
    // istemez; beklenmedik bir sorun olursa eski anahtarlar geri kurulabilir.
    var gecisYedegiHazir = true;
    if (Object.keys(eskiPaket).length && hamOku(GECIS_YEDEGI, null) === null) {
      gecisYedegiHazir = hamYaz(GECIS_YEDEGI,
        { zaman: Date.now(), veri: eskiPaket }) !== false;
    }
    durum = M.zarfaCevir(eskiPaket);
    if (gecisYedegiHazir) zarfKalici = hamYaz(ZARF_ANAHTARI, durum) !== false;
  } else {
    var hamDurum = durum;
    var duzeltilmisDurum = M.birlestir(durum, { surum: M.SURUM, alanlar: {} });
    if (!esitMi(hamDurum, duzeltilmisDurum)) {
      var aliasYedegi = eskiAliasKayitlari(hamDurum);
      var aliasYedegiHazir = true;
      if (Object.keys(aliasYedegi).length && hamOku(ALIAS_GECIS_YEDEGI, null) === null) {
        aliasYedegiHazir = hamYaz(ALIAS_GECIS_YEDEGI,
          { zaman: Date.now(), alanlar: aliasYedegi }) !== false;
      }
      // Normalleştirilmiş zarfı hemen kalıcılaştır; kullanıcı hiçbir karta
      // dokunmadan sekmeyi kapatsa da aynı geçiş bir sonraki açılışa kalmasın.
      if (aliasYedegiHazir && hamYaz(ZARF_ANAHTARI, duzeltilmisDurum) !== false) {
        durum = duzeltilmisDurum;
      } else {
        // Ham zarf zaten diskte güvenlidir. Yedek veya yeni zarf yazılamadıysa
        // yalnız bellekte ileri geçmiş gibi davranma; sonraki açılış tekrar dener.
        durum = hamDurum;
      }
    }
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
    var basarili = true;
    Object.keys(TIPLER).forEach(function (anahtar) {
      var varMi = Object.prototype.hasOwnProperty.call(paket, anahtar);
      var onceVardi = Object.prototype.hasOwnProperty.call(oncekiPaket || {}, anahtar);
      if (varMi) {
        if (!esitMi(hamOku(anahtar, undefined), paket[anahtar]) &&
            hamYaz(anahtar, paket[anahtar]) === false) basarili = false;
      } else if (hamOku(anahtar, undefined) !== undefined) {
        if (hamSil(anahtar) === false) basarili = false;
      }
      if (varMi !== onceVardi || (varMi && !esitMi(paket[anahtar], oncekiPaket[anahtar]))) degisen.push(anahtar);
    });
    return { degisen: degisen, basarili: basarili };
  }

  function kaydet(zarf, kaynak, dokunulanlar) {
    var oncekiZarf = durum;
    var oncekiPaket = M.paket(oncekiZarf);
    var aday = M.birlestir(zarf, { surum: M.SURUM, alanlar: {} });
    var diskteki = hamOku(ZARF_ANAHTARI, null);
    // Aday hazırlanırken başka bir sekme zarfı güncellemiş olabilir. Kalıcı
    // yazımdan hemen önce diskteki son zarfı da kat; son-yazan kazanır yarışında
    // bağımsız yeni kayıtlar yanlışlıkla düşmesin.
    if (diskteki && diskteki.surum === M.SURUM) aday = M.birlestir(aday, diskteki);

    // Zarf tek kalici islem noktasidir. Kota/gizli mod gibi bir nedenle bu
    // yazim basarisizsa bellekte ve klasik anahtarlarda olmus gibi davranma.
    if (!esitMi(diskteki, aday) && hamYaz(ZARF_ANAHTARI, aday) === false) {
      return { basarili: false, degisti: false, anahtarlar: [] };
    }

    durum = aday;
    zarfKalici = true;
    saatiGozle(durum);
    var aynaSonucu = aynala(M.paket(durum), oncekiPaket);
    var kume = Object.create(null);
    aynaSonucu.degisen.concat(dokunulanlar || []).forEach(function (a) {
      if (TIPLER[a]) kume[a] = 1;
    });
    Object.keys(TIPLER).forEach(function (a) {
      var x = oncekiZarf.alanlar[a], y = durum.alanlar[a];
      if (!esitMi(x, y)) kume[a] = 1;
    });
    var liste = Object.keys(kume);
    bildir(liste, kaynak);
    return {
      basarili: true,
      aynaBasarili: aynaSonucu.basarili,
      degisti: liste.length > 0,
      anahtarlar: liste
    };
  }

  // Zarfı, sayfanın diğer betikleri yds-* anahtarlarını okumadan önce yansıt.
  if (zarfKalici) aynala(M.paket(durum), {});

  function guncelZarf() {
    var diskte = hamOku(ZARF_ANAHTARI, null);
    if (diskte && diskte.surum === M.SURUM) durum = M.birlestir(durum, diskte);
    saatiGozle(durum);
    return durum;
  }

  function veriOku(anahtar, varsayilan) {
    if (!TIPLER[anahtar]) return hamOku(anahtar, varsayilan);
    var paket = M.paket(guncelZarf());
    return Object.prototype.hasOwnProperty.call(paket, anahtar)
      ? kopyala(paket[anahtar]) : varsayilan;
  }

  function degeriUygula(zarf, anahtar, deger, eskiDeger) {
    var eski = kayitHaritasi(anahtar, eskiDeger);
    var yeni = kayitHaritasi(anahtar, deger);
    var yazilacak = Object.create(null);
    var silinecek = [];
    Object.keys(yeni).forEach(function (id) {
      if (eski[id] === undefined || !esitMi(eski[id], yeni[id])) yazilacak[id] = yeni[id];
    });
    Object.keys(eski).forEach(function (id) {
      if (yeni[id] === undefined) silinecek.push(id);
    });
    if (Object.keys(yazilacak).length) {
      zarf = M.kayitlariYaz(zarf, anahtar, yazilacak, yeniMeta);
    }
    if (silinecek.length) zarf = M.kayitlariSil(zarf, anahtar, silinecek, yeniMeta);
    if (!zarf.alanlar[anahtar]) zarf.alanlar[anahtar] = { i: {} };
    return zarf;
  }

  function veriYaz(anahtar, deger, kaynak) {
    if (!TIPLER[anahtar]) return hamYaz(anahtar, deger);
    var zarf = guncelZarf();
    var eskiPaket = M.paket(zarf);
    zarf = degeriUygula(zarf, anahtar, deger, eskiPaket[anahtar]);
    return kaydet(zarf, kaynak || 'yerel', [anahtar]).basarili;
  }

  function kayitlariYaz(anahtar, kayitlar, kaynak) {
    if (!TIPLER[anahtar]) return false;
    return kaydet(M.kayitlariYaz(guncelZarf(), anahtar, kayitlar || {}, yeniMeta),
      kaynak || 'yerel', [anahtar]).basarili;
  }

  function kayitlariSil(anahtar, ids, kaynak) {
    if (!TIPLER[anahtar]) return false;
    return kaydet(M.kayitlariSil(guncelZarf(), anahtar, ids || [], yeniMeta),
      kaynak || 'yerel', [anahtar]).basarili;
  }

  function veriSil(anahtar, kaynak) {
    if (!TIPLER[anahtar]) return hamSil(anahtar);
    return kaydet(M.anahtariSil(guncelZarf(), anahtar, yeniMeta),
      kaynak || 'yerel', [anahtar]).basarili;
  }

  // Birden cok ilerleme alanini tek zarf yazimiyla uygular. Geri alma gibi
  // islemlerde bir alan yazilip digeri kalmasin diye tum farklar once aday
  // zarfta toplanir, ardindan tek kalici yazim yapilir.
  function paketYaz(paket, kaynak) {
    paket = paket && typeof paket === 'object' ? paket : {};
    var zarf = guncelZarf();
    var mevcut = M.paket(zarf);
    var dokunulanlar = [];
    Object.keys(TIPLER).forEach(function (anahtar) {
      if (!Object.prototype.hasOwnProperty.call(paket, anahtar)) return;
      zarf = degeriUygula(zarf, anahtar, paket[anahtar], mevcut[anahtar]);
      dokunulanlar.push(anahtar);
    });
    return kaydet(zarf, kaynak || 'yerel', dokunulanlar).basarili;
  }

  function anahtarlariSil(anahtarlar, kaynak) {
    var zarf = guncelZarf();
    var dokunulanlar = [];
    (anahtarlar || []).forEach(function (anahtar) {
      if (!TIPLER[anahtar] || dokunulanlar.indexOf(anahtar) !== -1) return;
      zarf = M.anahtariSil(zarf, anahtar, yeniMeta);
      dokunulanlar.push(anahtar);
    });
    if (!dokunulanlar.length) return true;
    return kaydet(zarf, kaynak || 'yerel', dokunulanlar).basarili;
  }

  function uygula(gelen, kaynak) {
    return kaydet(M.birlestir(guncelZarf(), M.zarfaCevir(gelen)), kaynak || 'bulut', []);
  }

  Depo.oku = veriOku;
  Depo.yaz = veriYaz;
  Depo.sil = veriSil;
  Depo.kayitlariYaz = kayitlariYaz;
  Depo.kayitlariSil = kayitlariSil;
  Depo.paketYaz = paketYaz;
  Depo.anahtarlariSil = anahtarlariSil;

  function depolamaDegisti(e) {
    if (!e || !e.key) return;
    if (e.key === ZARF_ANAHTARI && e.newValue) {
      var gelen;
      try { gelen = JSON.parse(e.newValue); } catch (hata) { return; }
      var birlesmis = M.birlestir(durum, gelen);
      kaydet(birlesmis, 'sekme', []);
      return;
    }
    if (!TIPLER[e.key]) return;
    var beklenen = M.paket(guncelZarf());
    var yeni;
    try { yeni = e.newValue === null ? undefined : JSON.parse(e.newValue); } catch (hata2) { return; }
    if (esitMi(beklenen[e.key], yeni)) return;

    // Güncelleme öncesinden açık kalan eski bir sekmenin klasik anahtara
    // yaptığı yazımı da kaybetmeden yeni zarfa taşı.
    var eski;
    try { eski = e.oldValue === null ? undefined : JSON.parse(e.oldValue); } catch (hata3) { eski = undefined; }
    if (yeni === undefined) {
      // Klasik anahtarı kaldıran eski sekmenin hangi yeni kayıtları hiç
      // görmediği bilinemez. Tüm alanı tombstone yapmak daha yeni sekmenin
      // ilerlemesini silebilir; güvenli zarfı kaynak kabul edip aynayı geri kur.
      aynala(beklenen, beklenen);
      return;
    }

    // Klasik anahtari yazan sekme eski bir tam nesneyle calisiyor olabilir.
    // oldValue -> newValue arasinda acikca eklenen/degisen kayitlari al; yeni
    // nesnede bulunmayan kimlikleri silme sayma. Boylece bu sekmede sonradan
    // eklenen kayitlar, eski sekmenin eksik anlik goruntusu yuzunden kaybolmaz.
    var eskiKayitlar = kayitHaritasi(e.key, eski);
    var yeniKayitlar = kayitHaritasi(e.key, yeni);
    var degisiklikler = Object.create(null);
    Object.keys(yeniKayitlar).forEach(function (id) {
      if (eskiKayitlar[id] === undefined || !esitMi(eskiKayitlar[id], yeniKayitlar[id])) {
        degisiklikler[id] = yeniKayitlar[id];
      }
    });
    if (Object.keys(degisiklikler).length) {
      if (!kayitlariYaz(e.key, degisiklikler, 'sekme')) aynala(beklenen, beklenen);
    } else aynala(beklenen, beklenen);
  }
  window.addEventListener('storage', depolamaDegisti);

  window.YDS.EsitlemeDepo = {
    ANAHTAR: ZARF_ANAHTARI,
    zarf: function () { return kopyala(guncelZarf()); },
    paket: function () { return M.paket(guncelZarf()); },
    uygula: uygula,
    paketYaz: paketYaz,
    anahtarlariSil: anahtarlariSil
  };
})();
