'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var ZARF_ANAHTARI = 'yds-esitleme-v2';
var YEDEK_ANAHTARI = 'yds-son-yedek';
var ortamSirasi = 0;

var URETIM_DOSYALARI = [
  'data/kelime-aliaslari.js',
  'assets/js/esitleme-veri.js',
  'assets/js/esitleme-depo.js',
  'assets/js/ilerleme.js'
];

function sade(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}

function ayni(gelen, beklenen, mesaj) {
  assert.deepStrictEqual(sade(gelen), sade(beklenen), mesaj);
}

function HamBellek(baslangic) {
  this.veri = new Map();
  this.engellenecekZarfYazimi = 0;
  var self = this;
  Object.keys(baslangic || {}).forEach(function (anahtar) {
    self.veri.set(anahtar, JSON.stringify(baslangic[anahtar]));
  });
}

HamBellek.prototype.oku = function (anahtar, varsayilan) {
  if (!this.veri.has(anahtar)) return varsayilan;
  try { return JSON.parse(this.veri.get(anahtar)); } catch (e) { return varsayilan; }
};

HamBellek.prototype.ham = function (anahtar) {
  return this.veri.has(anahtar) ? this.veri.get(anahtar) : null;
};

HamBellek.prototype.ata = function (anahtar, deger) {
  this.veri.set(anahtar, JSON.stringify(deger));
};

HamBellek.prototype.sonrakiZarfYaziminiEngelle = function () {
  this.engellenecekZarfYazimi++;
};

HamBellek.prototype.depo = function () {
  var self = this;
  return {
    oku: function (anahtar, varsayilan) {
      return self.oku(anahtar, varsayilan);
    },
    yaz: function (anahtar, deger) {
      if (anahtar === ZARF_ANAHTARI && self.engellenecekZarfYazimi > 0) {
        self.engellenecekZarfYazimi--;
        return false;
      }
      self.ata(anahtar, deger);
      return true;
    },
    sil: function (anahtar) {
      self.veri.delete(anahtar);
      return true;
    }
  };
};

function ortamKur(bellek) {
  var dinleyiciler = Object.create(null);
  var kimlik = ++ortamSirasi;

  function CustomEvent(tur, ayar) {
    this.type = tur;
    this.detail = ayar && ayar.detail;
  }

  var pencere = {
    YDS: { Depo: bellek.depo() },
    crypto: {
      getRandomValues: function (dizi) {
        dizi[0] = kimlik;
        dizi[1] = kimlik * 17;
        return dizi;
      }
    },
    CustomEvent: CustomEvent,
    addEventListener: function (tur, fn) {
      if (!dinleyiciler[tur]) dinleyiciler[tur] = [];
      dinleyiciler[tur].push(fn);
    },
    dispatchEvent: function (olay) {
      (dinleyiciler[olay.type] || []).slice().forEach(function (fn) {
        fn.call(pencere, olay);
      });
      return true;
    }
  };

  var baglam = {
    window: pencere,
    CustomEvent: CustomEvent,
    Uint32Array: Uint32Array,
    JSON: JSON,
    Date: Date,
    Math: Math,
    Object: Object,
    String: String,
    Array: Array,
    parseInt: parseInt,
    console: console
  };
  vm.createContext(baglam);
  URETIM_DOSYALARI.forEach(function (dosya) {
    vm.runInContext(fs.readFileSync(path.join(kok, dosya), 'utf8'), baglam,
      { filename: dosya });
  });

  return {
    pencere: pencere,
    Depo: pencere.YDS.Depo,
    D: pencere.YDS.EsitlemeDepo,
    M: pencere.YDS.EsitlemeMotoru,
    I: pencere.YDS.Ilerleme,
    storageGonder: function (anahtar, eski, yeni) {
      (dinleyiciler.storage || []).slice().forEach(function (fn) {
        fn.call(pencere, {
          key: anahtar,
          oldValue: eski === undefined ? null : JSON.stringify(eski),
          newValue: yeni === undefined ? null : JSON.stringify(yeni)
        });
      });
    }
  };
}

function leitnerAnligi(ortam, bellek) {
  return {
    zarf: bellek.ham(ZARF_ANAHTARI),
    klasik: bellek.ham('yds-leitner'),
    paket: sade(ortam.D.paket())
  };
}

function leitnerAnligiDegismedi(ortam, bellek, onceki, mesaj) {
  assert.strictEqual(bellek.ham(ZARF_ANAHTARI), onceki.zarf,
    mesaj + ': eşitleme zarfı değişmemeliydi');
  assert.strictEqual(bellek.ham('yds-leitner'), onceki.klasik,
    mesaj + ': klasik yds-leitner değişmemeliydi');
  ayni(ortam.D.paket(), onceki.paket,
    mesaj + ': bellekteki/görünür paket değişmemeliydi');
}

/* 1) Zarf yazılamazsa hiçbir katmanda yarım kayıt veya yarım silme kalmaz. */
(function atomikYerelYazim() {
  var ilkLeitner = { base: { k: 2, g: 200, c: 100 } };
  var bellek = new HamBellek({ 'yds-leitner': ilkLeitner });
  var ortam = ortamKur(bellek);
  var onceki = leitnerAnligi(ortam, bellek);

  bellek.sonrakiZarfYaziminiEngelle();
  assert.strictEqual(ortam.Depo.kayitlariYaz('yds-leitner', {
    alpha: { k: 1, g: 300, c: 200 }
  }), false, 'başarısız zarf yazımında kayitlariYaz false dönmeli');
  leitnerAnligiDegismedi(ortam, bellek, onceki, 'başarısız kayıt ekleme');
  assert.strictEqual(ortam.I.kutu('alpha'), 0,
    'başarısız kayıt ekleme Ilerleme görünümüne sızmamalı');

  var eskiKutu = ortam.I.kutu('base');
  bellek.sonrakiZarfYaziminiEngelle();
  assert.strictEqual(ortam.I.dogru('base'), false,
    'dogru() kayıt yazılamadığında UI için false dönmeli');
  assert.strictEqual(ortam.I.kutu('base'), eskiKutu,
    'dogru() yazımı başarısızsa bellekteki kutu değişmemeli');
  leitnerAnligiDegismedi(ortam, bellek, onceki, 'başarısız dogru() yazımı');

  bellek.sonrakiZarfYaziminiEngelle();
  assert.strictEqual(ortam.Depo.kayitlariSil('yds-leitner', ['base']), false,
    'başarısız zarf yazımında kayitlariSil false dönmeli');
  leitnerAnligiDegismedi(ortam, bellek, onceki, 'başarısız kayıt silme');

  bellek.sonrakiZarfYaziminiEngelle();
  assert.strictEqual(ortam.I.sifirlaKelime('base'), false,
    'sifirlaKelime(), kayıt silinemediğinde false dönmeli');
  assert.strictEqual(ortam.I.kutu('base'), eskiKutu,
    'sifirlaKelime() başarısızsa bellekteki kutuyu silmemeli');
  leitnerAnligiDegismedi(ortam, bellek, onceki, 'başarısız sifirlaKelime()');

  bellek.sonrakiZarfYaziminiEngelle();
  assert.strictEqual(ortam.Depo.yaz('yds-leitner', {
    base: { k: 4, g: 400, c: 300 }, gamma: { k: 1, g: 400, c: 300 }
  }), false, 'tam nesne yazımı zarf yazılamadığında false dönmeli');
  leitnerAnligiDegismedi(ortam, bellek, onceki, 'başarısız tam nesne yazımı');

  bellek.sonrakiZarfYaziminiEngelle();
  assert.strictEqual(ortam.Depo.sil('yds-leitner'), false,
    'anahtar silme zarf yazılamadığında false dönmeli');
  leitnerAnligiDegismedi(ortam, bellek, onceki, 'başarısız anahtar silme');

  var yeniden = ortamKur(bellek);
  ayni(yeniden.Depo.oku('yds-leitner', null), ilkLeitner,
    'reload sonrası başarısız ekleme dirilmemeli, başarısız silme kayıp yaratmamalı');
  assert.strictEqual(yeniden.I.kutu('alpha'), 0,
    'reload sonrası başarısız eklenen alpha görünmemeli');
  assert.strictEqual(yeniden.I.kutu('base'), 2,
    'reload sonrası başarısız silinen base korunmalı');
})();

/* 2) Güncelleme öncesinden açık eski sekmenin eksik tam nesnesi kayıt silmez. */
(function eskiSekmeBirlesimi() {
  var eski = {
    base: { k: 1, g: 100, c: 50 },
    beta: { k: 2, g: 200, c: 60 }
  };
  var yeni = {
    base: { k: 4, g: 400, c: 300 },
    alpha: { k: 3, g: 300, c: 200 }
  };
  var beklenen = {
    alpha: yeni.alpha,
    base: yeni.base,
    beta: eski.beta
  };
  var bellek = new HamBellek({ 'yds-leitner': eski });
  var ortam = ortamKur(bellek);

  // Storage olayı geldiğinde tarayıcının klasik anahtarı çoktan değiştirilmiştir.
  bellek.ata('yds-leitner', yeni);
  ortam.storageGonder('yds-leitner', eski, yeni);

  ayni(ortam.Depo.oku('yds-leitner', null), beklenen,
    'eski sekme olayı alpha/base değişikliklerini alıp beta kaydını korumalı');
  ayni(ortam.D.paket()['yds-leitner'], beklenen,
    'eski sekme birleşimi eşitleme zarfına da yansımalı');
  assert.strictEqual(ortam.I.kutu('base'), 4,
    'ortak base kaydındaki açık değişiklik Ilerleme belleğine yansımalı');
  assert.strictEqual(ortam.I.kutu('beta'), 2,
    'yeni tam nesnede bulunmayan beta eski sekme tarafından silinmemeli');

  // Aynı eski sekme klasik anahtarı bütünüyle kaldırsa bile güvenli zarfı
  // sıfırlayamaz; kaldırılan ayna güncel birleşimden yeniden kurulur.
  var silmeOncesi = sade(ortam.D.paket()['yds-leitner']);
  bellek.veri.delete('yds-leitner');
  ortam.storageGonder('yds-leitner', beklenen, undefined);
  ayni(ortam.D.paket()['yds-leitner'], silmeOncesi,
    'eski sekmenin removeItem olayı yeni zarf ilerlemesini silmemeli');
  ayni(ortam.Depo.oku('yds-leitner', null), silmeOncesi,
    'silinen klasik ayna güvenli zarftan yeniden kurulmalı');

  var yeniden = ortamKur(bellek);
  ayni(yeniden.Depo.oku('yds-leitner', null), beklenen,
    'eski sekme birleşimi reload sonrasında da kalıcı olmalı');
})();

/* 3) Eski sekme yeni uygulama kapalıyken yazdıysa reload farkı da korunur. */
(function eskiSekmeKapaliykenYazdi() {
  var ilk = { base: { k: 4, g: 400, c: 300 } };
  var bellek = new HamBellek({ 'yds-leitner': ilk });
  var yeniSekme = ortamKur(bellek);

  yeniSekme.Depo.kayitlariYaz('yds-leitner', {
    beta: { k: 2, g: 410, c: 350 }
  });

  // Güncelleme öncesinden açık kalan sekme, beta'yı hiç görmeden base'i
  // yeniden çalıştı ve klasik tam nesneyi yazdı. Yeni uygulama o sırada kapalı.
  bellek.ata('yds-leitner', {
    base: { k: 3, g: 500, c: 499 },
    gamma: { k: 1, g: 500, c: 499 }
  });

  var yeniden = ortamKur(bellek);
  ayni(yeniden.Depo.oku('yds-leitner', null), {
    base: { k: 3, g: 500, c: 499 },
    beta: { k: 2, g: 410, c: 350 },
    gamma: { k: 1, g: 500, c: 499 }
  }, 'reload eski sekmenin açık değişikliklerini alıp yeni beta kaydını korumalı');
  ayni(yeniden.D.paket()['yds-leitner'],
    yeniden.Depo.oku('yds-leitner', null),
    'reload uzlaştırması eşitleme zarfına kalıcı yazılmalı');
})();

/* 4) yds-bilinen yalnız Leitner zarfı güvenle yazıldıktan sonra tüketilir. */
(function bilinenGocu() {
  var bilinen = ['hand-down', 'boys-and-girls'];
  var bosZarf = { surum: 2, alanlar: {} };
  var basariliBellek = new HamBellek({
    'yds-esitleme-v2': bosZarf,
    'yds-bilinen': bilinen
  });
  var basarili = ortamKur(basariliBellek);
  var tasinan = basarili.Depo.oku('yds-leitner', null);

  assert.strictEqual(basariliBellek.ham('yds-bilinen'), null,
    'başarılı yds-bilinen göçü eski anahtarı tüketmeli');
  ayni(Object.keys(tasinan || {}).sort(), ['@kelime:hand down', 'boys and girls'],
    'yds-bilinen aliasları doğru Leitner kimliklerine taşınmalı');
  assert.strictEqual(basarili.I.kutu('hand-down'), 4,
    'başarılı göç eski alias üzerinden de görünür olmalı');
  ayni(Object.keys(basarili.D.paket()['yds-leitner'] || {}).sort(),
    ['@kelime:hand down', 'boys and girls'], 'başarılı göç eşitleme zarfına yazılmalı');

  var hataliBellek = new HamBellek({
    'yds-esitleme-v2': bosZarf,
    'yds-bilinen': bilinen
  });
  hataliBellek.sonrakiZarfYaziminiEngelle();
  var hatali = ortamKur(hataliBellek);

  ayni(hataliBellek.oku('yds-bilinen', null), bilinen,
    'zarf yazımı başarısızsa yds-bilinen korunmalı');
  assert.strictEqual(hataliBellek.ham('yds-leitner'), null,
    'başarısız göç klasik Leitner anahtarı oluşturmamalı');
  assert.strictEqual(hatali.I.kutu('hand-down'), 0,
    'başarısız göç Ilerleme belleğinde görünür olmamalı');
  assert.strictEqual(hatali.D.paket()['yds-leitner'], undefined,
    'başarısız göç eşitleme paketine sızmamalı');

  hataliBellek.sonrakiZarfYaziminiEngelle();
  var yineHatali = ortamKur(hataliBellek);
  assert.strictEqual(yineHatali.I.kutu('hand-down'), 0,
    'başarısız göç reload sırasında kendiliğinden görünür olmamalı');
  ayni(hataliBellek.oku('yds-bilinen', null), bilinen,
    'tekrarlanan başarısız göçte kaynak liste yine korunmalı');

  var kurtarilan = ortamKur(hataliBellek);
  assert.strictEqual(kurtarilan.I.kutu('hand-down'), 4,
    'depolama düzelince korunan yds-bilinen listesi göçebilmelidir');
  assert.strictEqual(hataliBellek.ham('yds-bilinen'), null,
    'sonraki başarılı göç kaynak anahtarı tüketmeli');
})();

/* 4) Sıfırlama yedeği, sıfırlamadan sonraki etkinlikle anlamsal birleşir. */
(function semantikGeriAlma() {
  var eskiGecmis = [];
  for (var i = 1; i <= 50; i++) {
    eskiGecmis.push({ t: i, d: i, n: 80, y: i, m: 'eski-' + i });
  }
  var eskiPaket = {
    'yds-leitner': { eski: { k: 3, g: 300, c: 200 } },
    'yds-yanlis': [
      { a: 'Kelime|ortak', kat: 'Kelime', n: 5, t: 100 },
      { a: 'Kelime|yalniz-eski', kat: 'Kelime', n: 2, t: 90 }
    ],
    'yds-kategori': {
      Ortak: { d: 5, y: 1 },
      Eski: { d: 2, y: 0 }
    },
    'yds-gecmis': eskiGecmis,
    'yds-konular': {
      G01: { d: 2, t: 80, g: 70, n: 'eski tamamlandı' },
      G02: { d: 1, t: 60, g: null, n: 'yalnız eski' }
    },
    'yds-test-yanlis': {
      ortak: { n: 6, t: 100 },
      'yalniz-eski': { n: 2, t: 90 }
    },
    'yds-rekor': { yuzde: 90, dogru: 72, toplam: 80 }
  };
  var bellek = new HamBellek(eskiPaket);
  var ortam = ortamKur(bellek);

  ortam.I.hepsiniSifirla();
  var yedek = ortam.Depo.oku(YEDEK_ANAHTARI, null);
  assert.ok(yedek && yedek.veri,
    'hepsiniSifirla() geri alınabilir bir yedek bırakmalı');

  ortam.I.dogru('yeni');
  ortam.I.yanlisEkle({ kat: 'Kelime', soru: 'ortak' });
  ortam.I.yanlisEkle({ kat: 'Kelime', soru: 'yalniz-yeni' });
  ortam.I.kategoriKaydet('Ortak', false);
  ortam.I.kategoriKaydet('Yeni', true);
  ortam.I.sonucEkle({ dogru: 62, toplam: 80, yuzde: 77, mod: 'yeni-deneme' });
  ortam.I.konuYaz('G01', { d: 1, t: 95, n: 'yeni çalışma' });
  ortam.I.konuYaz('G03', { d: 1, t: 75, n: 'yalnız yeni' });
  ortam.I.testYanlis('ortak');
  ortam.I.testYanlis('yalniz-yeni');
  assert.strictEqual(ortam.Depo.yaz('yds-rekor', {
    yuzde: 85, dogru: 68, toplam: 80
  }), true, 'geri alma öncesindeki yeni rekor etkinliği yazılabilmeli');

  var yeniPaket = sade(ortam.D.paket());
  var beklenen = sade(ortam.M.paket(ortam.M.birlestir(
    ortam.M.zarfaCevir(yeniPaket), ortam.M.zarfaCevir(yedek.veri))));

  assert.strictEqual(ortam.I.yedegiGeriAl(), true,
    'bütün alanlar yazılabildiğinde yedegiGeriAl true dönmeli');
  var birlesmis = sade(ortam.D.paket());
  ayni(birlesmis, beklenen,
    'geri alma Motor ile aynı anlamsal eski+yeni birleşimini üretmeli');
  assert.strictEqual(ortam.Depo.oku(YEDEK_ANAHTARI, null), null,
    'başarılı geri alma tamamlandıktan sonra yedeği tüketmeli');

  ayni(birlesmis['yds-kategori'].Ortak, { d: 5, y: 1 },
    'kategori çakışmasında daha güçlü eski kayıt korunmalı');
  ayni(Object.keys(birlesmis['yds-kategori']).sort(), ['Eski', 'Ortak', 'Yeni'],
    'kategori birleşimi ayrık eski ve yeni kimlikleri korumalı');
  assert.strictEqual(birlesmis['yds-gecmis'].length, 50,
    'geçmiş birleşimi son 50 kayıtla sınırlanmalı');
  assert.ok(!birlesmis['yds-gecmis'].some(function (r) { return r.t === 1; }),
    '51 kayıtlık birleşimde en eski geçmiş kaydı elenmeli');
  assert.ok(birlesmis['yds-gecmis'].some(function (r) { return r.m === 'yeni-deneme'; }),
    'sıfırlama sonrası yeni geçmiş kaydı korunmalı');
  ayni(birlesmis['yds-konular'].G01, yeniPaket['yds-konular'].G01,
    'konu çakışmasında zaman damgalı son çalışma korunmalı');
  assert.strictEqual(birlesmis['yds-yanlis'].filter(function (r) {
    return r.a === 'Kelime|ortak';
  })[0].n, 5, 'yanlış birleşiminde en yüksek tekrar sayısı korunmalı');
  assert.strictEqual(birlesmis['yds-test-yanlis'].ortak.n, 6,
    'test-yanlış birleşiminde en yüksek tekrar sayısı korunmalı');
  ayni(birlesmis['yds-rekor'], eskiPaket['yds-rekor'],
    'rekor birleşiminde daha yüksek yüzdeli kayıt korunmalı');
  assert.strictEqual(ortam.I.kutu('eski'), 3,
    'geri gelen eski Leitner kaydı Ilerleme belleğine yansımalı');
  assert.strictEqual(ortam.I.kutu('yeni'), 1,
    'sıfırlama sonrası yeni Leitner kaydı geri almada korunmalı');

  // İkinci sıfırlama, başarısız geri almanın yedeği tüketmediğini sınar.
  ortam.I.hepsiniSifirla();
  ortam.I.kategoriKaydet('Yalnız yeni deneme', true);
  var basarisizOncesi = sade(ortam.D.paket());
  var korunacakYedek = bellek.ham(YEDEK_ANAHTARI);
  assert.ok(korunacakYedek, 'başarısız geri alma deneyi için yedek bulunmalı');

  bellek.sonrakiZarfYaziminiEngelle();
  assert.strictEqual(ortam.I.yedegiGeriAl(), false,
    'geri alma zarfı yazılamadığında yedegiGeriAl false dönmeli');
  assert.strictEqual(bellek.ham(YEDEK_ANAHTARI), korunacakYedek,
    'başarısız geri alma yedeği tüketmemeli veya değiştirmemeli');
  ayni(ortam.D.paket(), basarisizOncesi,
    'başarısız geri alma görünür paketi kısmen değiştirmemeli');
})();

/* 5) Birikmiş tekrar tarihleri başarıda her katmana, hatada hiçbirine geçer. */
(function birikmisTekrarlariYayma() {
  var adlar = ['alpha', 'beta', 'gamma', 'delta'];

  function ilkKayitlar() {
    return {
      alpha: { k: 1, g: 1, c: 1 },
      beta: { k: 2, g: 2, c: 2 },
      gamma: { k: 3, g: 3, c: 3 },
      delta: { k: 4, g: 4, c: 4 }
    };
  }

  function gHaritasi(kayitlar) {
    var sonuc = {};
    adlar.forEach(function (ad) { sonuc[ad] = kayitlar[ad].g; });
    return sonuc;
  }

  var bellek = new HamBellek({ 'yds-leitner': ilkKayitlar() });
  var ortam = ortamKur(bellek);
  var bugun = ortam.I.bugun();
  var beklenenG = { alpha: bugun, beta: bugun, gamma: bugun + 1, delta: bugun + 1 };

  ayni(ortam.I.birikmisiYay(adlar, 2), { tasinan: 2, gun: 2 },
    'başarılı birikmisiYay beklenen kart ve gün sayısını dönmeli');
  ayni(gHaritasi(ortam.I.tumKayitlar()), beklenenG,
    'başarılı yayma Ilerleme belleğindeki bütün g tarihlerini yenilemeli');
  ayni(gHaritasi(ortam.Depo.oku('yds-leitner', {})), beklenenG,
    'başarılı yayma klasik yds-leitner g tarihlerini yenilemeli');
  ayni(gHaritasi(ortam.D.paket()['yds-leitner']), beklenenG,
    'başarılı yayma eşitleme paketindeki g tarihlerini yenilemeli');

  var yeniden = ortamKur(bellek);
  ayni(gHaritasi(yeniden.I.tumKayitlar()), beklenenG,
    'başarılı yaymanın g tarihleri reload sonrasında korunmalı');

  var hataliBellek = new HamBellek({ 'yds-leitner': ilkKayitlar() });
  var hatali = ortamKur(hataliBellek);
  var oncekiTum = sade(hatali.I.tumKayitlar());
  var oncekiPaket = sade(hatali.D.paket());
  var oncekiKlasik = hataliBellek.ham('yds-leitner');
  var oncekiZarf = hataliBellek.ham(ZARF_ANAHTARI);

  hataliBellek.sonrakiZarfYaziminiEngelle();
  ayni(hatali.I.birikmisiYay(adlar, 2),
    { tasinan: 0, gun: 0, basarili: false },
    'zarf yazılamadığında birikmisiYay başarısızlığı bildirmeli');
  ayni(hatali.I.tumKayitlar(), oncekiTum,
    'başarısız yayma Ilerleme belleğindeki hiçbir g tarihini değiştirmemeli');
  assert.strictEqual(hataliBellek.ham('yds-leitner'), oncekiKlasik,
    'başarısız yayma klasik yds-leitner verisini değiştirmemeli');
  assert.strictEqual(hataliBellek.ham(ZARF_ANAHTARI), oncekiZarf,
    'başarısız yayma eşitleme zarfını değiştirmemeli');
  ayni(hatali.D.paket(), oncekiPaket,
    'başarısız yayma görünür eşitleme paketini değiştirmemeli');

  var hatadanSonraReload = ortamKur(hataliBellek);
  ayni(gHaritasi(hatadanSonraReload.I.tumKayitlar()),
    gHaritasi(ilkKayitlar()),
    'başarısız yayma reload sonrasında da hiçbir g değişikliği bırakmamalı');
})();

console.log('esitleme-yerel-guvenlik: 6 ana senaryo başarılı');
