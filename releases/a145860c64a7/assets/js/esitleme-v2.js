/* ============================================================
   Cihazlar arası eşitleme — Google girişi + Firestore

   Yerel ilerleme kayıt düzeyinde sürümlenir. Bulutta her eşitleme alanı ayrı
   belgede tutulur; böylece tüm kelime ve test ilerlemesi Firestore'un tek
   belge başına 1 MiB sınırına dayanmaz. Yerel zarf sürümü 2 olarak kalır;
   `yds-leitner` ve `yds-test-yanlis` dış belgeleri surum:3/k:2 kısa JSON,
   diğer on alan dış surum:2/nesne JSON taşır:
     kullanicilar/{uid}/alanlar/{anahtar} = { surum: 2|3, zaman, json }

   Her gönderim Firestore işlemi içinde önce güncel bulutu okur, yerelle
   birleştirir ve birleşimi yazar. Böylece aynı anda çalışan iki cihaz son
   yazanın bütün veriyi ezmesine yol açmaz. Eski surum:1 belgeleri ilk
   eşitlemede otomatik ve kayıpsız olarak alan belgelerine taşınır. Eski kök
   belge silinmez; eski açık sekmelerden gelebilecek son değişiklikler de
   okunup yeni düzene birleştirilir.
   ============================================================ */

(function () {
  'use strict';

  var AYAR = window.FIREBASE_AYAR;
  if (!AYAR) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  if (!window.YDS || !window.YDS.Depo || !window.YDS.EsitlemeMotoru || !window.YDS.EsitlemeDepo) return;

  var M = window.YDS.EsitlemeMotoru;
  var EsitDepo = window.YDS.EsitlemeDepo;
  var Depo = window.YDS.Depo;
  var SDK_KOK = 'https://www.gstatic.com/firebasejs/10.14.1/';
  var GECIKME = 2500;
  // Kesintisiz çalışmada (2,5 sn'den sık cevap) erteleme hiç bitmezdi; bekleyen
  // değişiklik en geç bu süre içinde gönderilir. Sekme kapanırken başlayan son
  // gönderim çoğu zaman tamamlanamadığından cihazda kalan kuyruk böyle sınırlanır.
  var AZAMI_BEKLEME = 15000;
  var YENIDEN_DENEME = 15000;
  var EN_UZUN_BEKLEME = 5 * 60 * 1000;
  // Sayfaya dönüldüğünde bulutla son doğrulanmış temas bundan eskiyse canlı
  // dinleyiciye güvenilmez; tam birleşim yapılır (uyku, arka plan, ağ değişimi).
  // Tam birleşim bütün alan belgelerini indirdiğinden eşik çok kısa tutulmaz.
  var TAZELEME_ESIGI = 2 * 60 * 1000;
  // Başarılı bir tam birleşimden sonra bu süre içinde gelen otomatik istekler
  // (üst üste gelen dönüş olayları, gidip gelen ağ) yeni tam birleşim başlatmaz.
  var OTOMATIK_ARALIK = 60 * 1000;
  // Bu kadar sorunsuz çalışmış dinleyicinin hatası yeniden kurma beklemesini sıfırlar.
  var SAGLIKLI_DINLEME = 10 * 60 * 1000;
  // Kalıcı bir hata (ör. okuma izni) her 5 dakikada 15 okumalık yeniden kurma
  // döngüsü yaratmasın: bu kadar denemeden sonra durulur; düğme ya da ağın
  // geri gelmesi dinleyicileri yeniden kurar.
  var DINLEME_EN_COK_DENEME = 6;
  // Pencere odağı sekme dönüşünden çok daha sık değişir; eşiği daha uzun.
  var ODAK_ESIGI = 5 * 60 * 1000;
  // Nabız aralığı; iki nabız arası bundan uzunsa bilgisayar uyumuştur.
  var NABIZ = 30 * 1000;
  var UYKU_ESIGI = 2 * 60 * 1000;
  // Bu süreyi aşan bulut işlemi takılmış sayılır; geç gelen sonucu yok sayılır.
  var ISLEM_ZAMAN_ASIMI = 2 * 60 * 1000;
  // Kimlik belirtecinin süresine bundan az kaldıysa işlemden önce yenilenir.
  var BELIRTEC_PAYI = 5 * 60 * 1000;
  // Düğmeye basıldığında bundan uzun süren işlem beklenmez, yerine yenisi başlar.
  var ELLE_SABIR = 10 * 1000;
  var KUYRUK_METNI = 'Bulut bağlantısı bozuldu; sayfayı yenile. İlerlemen bu cihazda korunuyor.';
  var DUGME_IPUCU = 'Şimdi eşitlemek için tıkla. Bağlantıyı Ayarlar’dan kesebilirsin.';
  var BULUT_GECIS_YEDEGI = 'yds-esitleme-bulut-gecis-yedegi';
  var ETKIN_ANAHTARI = 'yds-bulut-etkin';
  var SILME_HAZIR = false;
  var BELGE_GUVENLI_BAYT = 900 * 1024;
  // Yerel eşitleme zarfı M.SURUM=2 olarak kalır. Dış alan belgesinde sürüm 3,
  // yalnız k=2 kısa JSON taşıyan büyük alanları eski v2 istemcilerden ayırır.
  var BULUT_ALAN_LEGACY_SURUMU = 2;
  var BULUT_ALAN_KISA_SURUMU = 3;
  var ALAN_ANAHTARLARI = Object.keys(M.TIPLER);

  var auth = null, db = null;
  var sdkSozu = null;
  var kullanici = null;
  var hazir = false;
  var birikti = false;
  var gonderiliyor = false;
  var bulutSilindi = false;
  var silmeYapiliyor = false;
  var sonGonderilen = null;
  var zamanlayici = null;
  var ilkZamanlayici = null;
  var dinlemeyiBirak = null;
  var kirliAlanlar = Object.create(null);
  var sonTemas = 0;          // son başarılı işlem ya da sunucudan gelen anlık görüntü
  var ilkBekleyen = 0;       // gönderilmeyi bekleyen en eski değişikliğin zamanı
  var hataSayisi = 0, ertelemeSonu = 0;
  var islemNo = 0, islemBaslangici = 0, tamIslemde = false, hemen = false, takilmaSayisi = 0;
  var tamIstendi = false;    // sıradaki gönderim bütün alanlarla birleşim yapsın
  var kapatilanSorun = null; // kullanıcının × ile kapattığı dinleyici uyarısı
  var dinlemeNesli = 0, dinlemeOnarici = null, dinlemeHataSayisi = 0, dinlemeBaslangici = 0;
  var dinlemeVazgecildi = false, dinlemeSorunu = null, dinlemeSorunNesli = 0, dinlemeSonKod = '';
  var sonSdkDenemesi = 0;
  var tamBekleyenler = [];
  var elleOnayBekliyor = false;   // elle eşitleme bitti ama onay bir uyarının arkasında kaldı
  var sonTamEsitleme = 0, nabizNo = null, sonNabiz = 0;
  var dugme = null;
  var uyari = null, bilgiZamanlayici = null;
  var altyaziEl = null, altyaziAsli = '';

  function kokBelgesi(kisi) {
    return db.collection('kullanicilar').doc((kisi || kullanici).uid);
  }

  function alanBelgesi(kisi, anahtar) {
    return kokBelgesi(kisi).collection('alanlar').doc(anahtar);
  }

  function yonetimBelgesi(kisi) {
    return kokBelgesi(kisi).collection('yonetim').doc('durum');
  }

  function hata(kod, mesaj) {
    var e = new Error(mesaj || kod);
    e.code = kod;
    return e;
  }

  function durumBildir(durum, mesaj) {
    var detay = {
      durum: durum,
      mesaj: mesaj || '',
      yuklendi: !!auth,
      hazir: !!hazir,
      bagli: !!kullanici && !bulutSilindi,
      eposta: kullanici && kullanici.email ? kullanici.email : '',
      silindi: !!bulutSilindi,
      silmeHazir: SILME_HAZIR,
      mesgul: !!gonderiliyor || !!silmeYapiliyor,
      kullanici: kullanici ? {
        ad: kullanici.displayName || '',
        eposta: kullanici.email || ''
      } : null
    };
    try {
      var Olay = window.CustomEvent || CustomEvent;
      window.dispatchEvent(new Olay('yds-esitleme-durumu', { detail: detay }));
    } catch (e) { /* eski tarayıcı/test ortamı */ }
  }

  function zamanlayicilariDurdur() {
    if (zamanlayici) clearTimeout(zamanlayici);
    if (ilkZamanlayici) clearTimeout(ilkZamanlayici);
    if (dinlemeOnarici) clearTimeout(dinlemeOnarici);
    zamanlayici = null;
    ilkZamanlayici = null;
    dinlemeOnarici = null;
    if (dinlemeyiBirak) { dinlemeyiBirak(); dinlemeyiBirak = null; }
    dinlemeNesli++;
    islemNo++;
    hazir = false;
    birikti = false;
    gonderiliyor = false;
    tamIslemde = false;
    hemen = false;
    tamIstendi = false;
    sonGonderilen = null;
    ilkBekleyen = 0;
    hataSayisi = 0;
    ertelemeSonu = 0;
    takilmaSayisi = 0;
    dinlemeHataSayisi = 0;
    dinlemeVazgecildi = false;
    dinlemeSorunu = null;
    kapatilanSorun = null;
    elleOnayBekliyor = false;
    kirliAlanlar = Object.create(null);
    tamBitti(false);
  }

  /* ---------- işlem sırası: geri çekilme, takılma bekçisi ---------- */

  function bekleme(sayi) {
    return Math.min(EN_UZUN_BEKLEME, YENIDEN_DENEME * Math.pow(2, Math.max(0, sayi - 1)));
  }

  function islemBaslat(tam) {
    gonderiliyor = true;
    tamIslemde = !!tam;
    islemBaslangici = Date.now();
    return ++islemNo;
  }

  // Terk edilmiş ya da başka oturuma ait işlemin geç sonucu durumu değiştirmez.
  function islemGecerli(no, benimki) {
    return no === islemNo && kullanici === benimki;
  }

  function basariIsle() {
    sonTemas = Date.now();
    hataSayisi = 0;
    ertelemeSonu = 0;
    takilmaSayisi = 0;
  }

  function hataIsle() {
    hataSayisi++;
    var ms = bekleme(hataSayisi);
    ertelemeSonu = Date.now() + ms;
    return ms;
  }

  // Sözü hiç sonuçlanmayan işlem (dondurulan sekme, sessizce kopan bağlantı)
  // kuyruğu sonsuza dek kilitlemesin. Birleşim kayıpsız ve tekrarlanabilir
  // olduğundan bütün alanlarla yeniden denemek güvenlidir.
  function islemiBirak() {
    islemNo++;
    gonderiliyor = false;
    tamIslemde = false;
    alanlariIsaretle();
  }

  function takildiysaBirak() {
    if (!gonderiliyor || Date.now() - islemBaslangici < ISLEM_ZAMAN_ASIMI) return false;
    islemiBirak();
    takilmaSayisi++;
    // Kara delik bağlantıda her yeniden deneme yeni bir askıda işlem bırakır;
    // geri çekilme bunların birikmesini sınırlar.
    hataIsle();
    // Yeniden deneme başarılı olursa uyarı hemen kapanır; takılma sürerse görünür
    // kalır. Üst üste takılma Firestore kuyruğunun tıkandığını gösterir; onu
    // yalnız sayfa yenilemek açar.
    var metin = takilmaSayisi > 1
      ? 'Bulut yanıt vermiyor; sayfayı yenilemek düzeltebilir. İlerlemen bu cihazda korunuyor.'
      : 'Bulut yanıt vermiyor; yeniden deneniyor. İlerlemen bu cihazda korunuyor.';
    durumuYaz(metin);
    uyariGoster(metin, false);
    durumBildir('hata', metin);
    return true;
  }

  function tamBitti(basarili) {
    var liste = tamBekleyenler;
    tamBekleyenler = [];
    liste.forEach(function (coz) { coz(basarili); });
  }

  function saat() {
    try {
      return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }

  function hataKodu(e) {
    if (!e) return 'bilinmiyor';
    if (e.code === 'yds/alan-cok-buyuk') {
      return e.alan + ' alanı güvenli bulut sınırına yaklaştı; veri bu cihazda korunuyor';
    }
    if (e.code === 'yds/bulut-json-gecersiz') {
      return 'bulut kaydı okunamadı; yerel veri değiştirilmedi';
    }
    if (e.code === 'yds/bulut-silindi') {
      return 'bulut kopyası silinmiş; yeniden eşitleme için açık onay gerekiyor';
    }
    if (e.code === 'permission-denied' || e.code === 'firestore/permission-denied') {
      return 'bulut yazma izni reddedildi; ilerleme bu cihazda korunuyor. Tarayıcı verilerini silme; Ayarlar’dan ilerleme yedeğini indir. Bulut erişim kuralları kontrol edilmeli';
    }
    if (e.code === 'auth/network-request-failed') {
      return 'ağ bağlantısı hazır değil; Google oturumu doğrulanamadı';
    }
    if (e.code === 'resource-exhausted' || e.code === 'firestore/resource-exhausted') {
      return 'ücretsiz bulut kotası doldu; kota sıfırlanınca kendiliğinden düzelir';
    }
    if (kuyrukBozukMu(e)) return 'bulut bağlantısı bozuldu';
    return String(e.code || e.message || e).slice(0, 120);
  }

  // Firestore'un iç kuyruğu çökerse sayfa içinde bir daha toparlanmaz.
  function kuyrukBozukMu(e) {
    return !!e && /AsyncQueue is already failed|INTERNAL ASSERTION FAILED/.test(String(e.message || ''));
  }

  // Bozuk kuyruk başka bir cümlenin içine gömülmez; tek başına ne yapılacağını söyler.
  function hataMetni(onEk, e) {
    return kuyrukBozukMu(e) ? KUYRUK_METNI : onEk + ' (' + hataKodu(e) + ')';
  }

  function bulutPaketi(foto) {
    if (!foto || !foto.exists) return {};
    var veri = foto.data() || {};
    var paket = {};
    try { paket = JSON.parse(veri.json || '{}') || {}; } catch (e) { paket = {}; }
    return paket;
  }

  function bulutZarfi(foto) {
    return M.zarfaCevir(bulutPaketi(foto));
  }

  function bosZarf() {
    return M.zarfaCevir({});
  }

  function tekAlanZarfi(anahtar, alan) {
    var zarf = { surum: M.SURUM, alanlar: {} };
    if (alan) zarf.alanlar[anahtar] = alan;
    return M.birlestir(zarf, bosZarf());
  }

  function kisaBulutAlaniMi(anahtar) {
    return anahtar === 'yds-leitner' || anahtar === 'yds-test-yanlis';
  }

  function bulutAlanBelgeSurumu(anahtar) {
    return kisaBulutAlaniMi(anahtar)
      ? BULUT_ALAN_KISA_SURUMU : BULUT_ALAN_LEGACY_SURUMU;
  }

  function bulutAlanSemaHatasi() {
    var e = new Error('bulut-alan-semasi-gecersiz');
    e.code = 'yds/bulut-json-gecersiz';
    return e;
  }

  function bulutAlanZarfi(foto, anahtar) {
    if (!foto || !foto.exists) return bosZarf();
    var veri = foto.data() || {};
    if ((veri.surum !== BULUT_ALAN_LEGACY_SURUMU &&
         veri.surum !== BULUT_ALAN_KISA_SURUMU) || typeof veri.json !== 'string' ||
        (veri.anahtar !== undefined && veri.anahtar !== anahtar)) {
      throw bulutAlanSemaHatasi();
    }
    try {
      var cozulmus = JSON.parse(veri.json);
      // Erken geliştirme kopyalarındaki tam zarf biçimini de kayıpsız kabul et.
      var tamZarf = cozulmus && cozulmus.surum === M.SURUM && cozulmus.alanlar;
      if (veri.surum === BULUT_ALAN_KISA_SURUMU && tamZarf) {
        throw bulutAlanSemaHatasi();
      }
      var alan = tamZarf ? cozulmus.alanlar[anahtar] : cozulmus;
      if (!alan || typeof alan !== 'object' || Array.isArray(alan)) {
        throw bulutAlanSemaHatasi();
      }
      if (veri.surum === BULUT_ALAN_KISA_SURUMU) {
        if (!kisaBulutAlaniMi(anahtar) ||
            alan.k !== M.BULUT_KODLAMA_SURUMU ||
            !Array.isArray(alan.a) || !Array.isArray(alan.i)) {
          throw bulutAlanSemaHatasi();
        }
      } else if (alan.k !== undefined) {
        // Dış v2 belgede yalnız ilk kısa k=1 biçimi veya eski tam alan nesnesi
        // geçerlidir. k=2 mutlaka dış sürüm 3 ile taşınır.
        if (!kisaBulutAlaniMi(anahtar) || alan.k !== 1 || !Array.isArray(alan.i)) {
          throw bulutAlanSemaHatasi();
        }
      } else if (!alan.i || typeof alan.i !== 'object' || Array.isArray(alan.i)) {
        throw bulutAlanSemaHatasi();
      }
      return tekAlanZarfi(anahtar, M.bulutAlaniniCoz(anahtar, alan));
    } catch (e) {
      if (e && e.code === 'yds/bulut-json-gecersiz') throw e;
      var jsonHatasi = new Error('bulut-alan-json-gecersiz');
      jsonHatasi.code = 'yds/bulut-json-gecersiz';
      throw jsonHatasi;
    }
  }

  function alanJson(zarf, anahtar) {
    var alan = zarf && zarf.alanlar && zarf.alanlar[anahtar];
    return alan ? M.kararliJson(alan) : '';
  }

  function utf8Bayt(metin) {
    var toplam = 0;
    for (var i = 0; i < metin.length; i++) {
      var kod = metin.charCodeAt(i);
      if (kod < 0x80) toplam += 1;
      else if (kod < 0x800) toplam += 2;
      else if (kod >= 0xD800 && kod <= 0xDBFF &&
               i + 1 < metin.length && metin.charCodeAt(i + 1) >= 0xDC00 &&
               metin.charCodeAt(i + 1) <= 0xDFFF) {
        toplam += 4;
        i++;
      } else toplam += 3;
    }
    return toplam;
  }

  function alanBelgeVerisi(anahtar, json, zaman) {
    var veri = {
      surum: bulutAlanBelgeSurumu(anahtar),
      anahtar: anahtar,
      zaman: zaman,
      json: json
    };
    var bayt = utf8Bayt(JSON.stringify(veri));
    if (bayt >= BELGE_GUVENLI_BAYT) {
      var hata = new Error('alan-cok-buyuk');
      hata.code = 'yds/alan-cok-buyuk';
      hata.alan = anahtar;
      hata.bayt = bayt;
      throw hata;
    }
    return veri;
  }

  function yereldeUygula(zarf, kaynak) {
    var sonuc = EsitDepo.uygula(zarf, kaynak);
    if (sonuc === false || (sonuc && sonuc.basarili === false)) {
      throw new Error('yerel-depo-yazilamadi');
    }
    return sonuc;
  }

  function alanlariIsaretle(anahtarlar) {
    (anahtarlar || ALAN_ANAHTARLARI).forEach(function (anahtar) {
      if (M.TIPLER[anahtar]) kirliAlanlar[anahtar] = true;
    });
  }

  function kirliAlanlariAl() {
    return Object.keys(kirliAlanlar).filter(function (anahtar) {
      return !!kirliAlanlar[anahtar];
    });
  }

  function belirtecHazirla(kisi) {
    return Promise.resolve().then(function () {
      if (!kisi || typeof kisi.getIdToken !== 'function') return;
      if (typeof kisi.getIdTokenResult !== 'function') return kisi.getIdToken();
      return kisi.getIdTokenResult().then(function (sonuc) {
        // Süresine az kalmışsa şimdi yenile; işlemin ortasında dolmasın.
        var bitis = Date.parse(sonuc && sonuc.expirationTime);
        if (isFinite(bitis) && bitis - Date.now() < BELIRTEC_PAYI) return kisi.getIdToken(true);
      });
    });
  }

  // İşlem içindeki okumada gelen auth/... hatasını Firestore 10.14.1 tanımaz:
  // yeniden deneme kararında iç doğrulama hatası atar ve işlemin sözü hiç
  // sonuçlanmaz. Düz Error olarak iletmek işlemi hemen reddettirir.
  function authHatasiniSar(e) {
    if (e && e.name === 'FirebaseError' && /^auth\//.test(String(e.code || ''))) {
      var duz = new Error(e.message || e.code);
      duz.code = e.code;
      throw duz;
    }
    throw e;
  }

  /* Kök geçiş belgesiyle bütün alan belgelerini aynı işlemde oku. Firestore
     bunlardan biri başka cihazca değişirse işlemi yeni görüntülerle yeniden
     dener; alanlar ayrı belgelerde kaldığı için hiçbiri tek başına 1 MiB'ye
     yaklaşan bütün zarfı taşımak zorunda kalmaz. */
  function bulutaBirlestir(hedefAlanlar, kokuOku) {
    var benimki = kullanici;
    if (!benimki) return Promise.reject(new Error('oturum-yok'));
    hedefAlanlar = (hedefAlanlar || ALAN_ANAHTARLARI).filter(function (anahtar) {
      return !!M.TIPLER[anahtar];
    });
    var kokRef = kokBelgesi(benimki);
    var yonetimRef = yonetimBelgesi(benimki);
    var alanRefleri = hedefAlanlar.map(function (anahtar) {
      return alanBelgesi(benimki, anahtar);
    });

    // Kimlik belirteci işlemden önce yenilenir: süresi dolmuşken (uykudan sonra)
    // işlem içinde yenileme ağ yüzünden düşerse Firestore 10.14.1 hatayı tanımaz
    // ve işlemin sözü hiç sonuçlanmaz. Burada düşerse sıradan bir ret olur.
    // Sözün içinde çağırmak, çökmüş kuyruğun eşzamanlı atışını da ret yapar.
    return belirtecHazirla(benimki).then(function () { return db.runTransaction(function (islem) {
      // Yönetim işaretçisi de aynı işlemde okunur. Silme işlemi bu okuma ile
      // yarışırsa Firestore işlemi yeniden dener; işaretçi oluşmuşsa hiçbir
      // eski/açık istemci ilerlemeyi tekrar yazamaz.
      var okumalar = [islem.get(yonetimRef)].concat(
        kokuOku ? [islem.get(kokRef)] : []).concat(alanRefleri.map(function (ref) {
        return islem.get(ref);
      }));
      return Promise.all(okumalar).catch(authHatasiniSar).then(function (fotolar) {
        if (fotolar[0] && fotolar[0].exists) throw hata('yds/bulut-silindi');
        var kokFoto = kokuOku ? fotolar[1] : null;
        var alanBaslangici = kokuOku ? 2 : 1;
        var eskiBulut = bulutPaketi(kokFoto);
        var yerel = EsitDepo.zarf();
        var birlesmis = M.birlestir(yerel, bulutZarfi(kokFoto));

        hedefAlanlar.forEach(function (anahtar, i) {
          birlesmis = M.birlestir(birlesmis,
            bulutAlanZarfi(fotolar[i + alanBaslangici], anahtar));
        });

        var simdi = Date.now();
        hedefAlanlar.forEach(function (anahtar, i) {
          var alan = birlesmis.alanlar && birlesmis.alanlar[anahtar];
          if (!alan) return;
          var json = M.bulutAlanJson(anahtar, alan);
          var foto = fotolar[i + alanBaslangici];
          var onceki = foto && foto.exists ? (foto.data() || {}) : {};
          if (onceki.surum === bulutAlanBelgeSurumu(anahtar) &&
              onceki.anahtar === anahtar &&
              onceki.json === json) return;
          islem.set(alanRefleri[i], alanBelgeVerisi(anahtar, json, simdi));
        });

        return {
          zarf: birlesmis,
          json: M.kararliJson(birlesmis),
          eskiBulut: kokFoto && kokFoto.exists ? eskiBulut : null,
          hedefAlanlar: hedefAlanlar.slice(),
          // Açılış birleşimi yalnız bulut yerelde olmayan bir şey getirdiyse
          // sayfayı yeniler; kullanıcının bu sırada yaptığı değişiklik sayılmaz.
          bulutGetirdi: !!kokuOku &&
            M.kararliJson(M.paket(birlesmis)) !== M.kararliJson(M.paket(yerel))
        };
      });
    }); }).then(function (sonuc) {
      if (kullanici !== benimki) return sonuc;
      if (sonuc.eskiBulut && Depo.oku(BULUT_GECIS_YEDEGI, null) === null) {
        // Kök belge yerinde kalır; bu yedek ayrıca kolay geri dönüş sağlar.
        Depo.yaz(BULUT_GECIS_YEDEGI, { zaman: Date.now(), veri: sonuc.eskiBulut });
      }
      yereldeUygula(sonuc.zarf, 'bulut');
      return sonuc;
    });
  }

  function dinlemeyeBasla() {
    if (dinlemeyiBirak) dinlemeyiBirak();
    var benimki = kullanici;
    var nesil = ++dinlemeNesli;
    var kapaticilar = [];
    dinlemeBaslangici = Date.now();

    // Yerine yenisi kurulmuş dinleyicinin geç gelen olayı hiçbir şeyi değiştirmez.
    function gecerli() { return nesil === dinlemeNesli && kullanici === benimki; }

    function temas(foto) {
      if (foto && foto.metadata && foto.metadata.fromCache) return;
      sonTemas = Date.now();
      // Kopuştan sonra kurulan dinleyiciden sunucu görüntüsü geldi: sorun bitti.
      if (dinlemeSorunu && nesil > dinlemeSorunNesli) {
        dinlemeSorunu = null;
        if (!hataSayisi && !takilmaSayisi) basariUyarisi();
      }
    }

    // Firestore hata veren dinleyiciyi kalıcı olarak kapatır; yeniden kurulmazsa
    // sayfa açık kaldıkça öbür cihazın değişiklikleri hiç gelmez. Gönderim ayrı
    // tek seferlik isteklerle sürdüğü için uyarı yalnız almayı anlatır.
    function dinlemeKoptu(e) {
      if (!gecerli()) return;
      sonGonderilen = null;
      var izin = e && (e.code === 'permission-denied' || e.code === 'firestore/permission-denied');
      dinlemeSonKod = izin ? 'okuma izni reddedildi' : hataKodu(e);
      var metin = kuyrukBozukMu(e) ? KUYRUK_METNI
        : 'Öbür cihazlardaki değişiklikler şu an alınamıyor; yeniden bağlanılıyor (' + dinlemeSonKod + ')';
      dinlemeSorunu = metin;
      dinlemeSorunNesli = nesil;
      durumuYaz(metin);
      uyariGoster(metin, false);
      durumBildir('hata', metin);
      dinlemeyiOnar();
    }

    function abone(ref, isleyici) {
      try {
        kapaticilar.push(ref.onSnapshot(isleyici, dinlemeKoptu));
      } catch (e) {
        // Çökmüş Firestore kuyruğu aboneliği eşzamanlı reddeder.
        dinlemeKoptu(e);
      }
    }

    function dinlemeHatasi(e) {
      if (!gecerli()) return;
      sonGonderilen = null;
      if (e && e.code === 'yds/bulut-silindi') {
        bulutSilindi = true;
        zamanlayicilariDurdur();
        dugmeGuncelle();
        altyaziGuncelle();
        durumBildir('silindi', hataKodu(e));
        return;
      }
      var metin = 'Bulut dinlenemiyor; ilerleme yerelde birikiyor (' + hataKodu(e) + ')';
      durumuYaz(metin);
      uyariGoster(metin, false);
    }

    function geleniUygula(gelen, anahtar, kokten) {
      if (!hazir || !gecerli()) return;
      var once = EsitDepo.zarf();
      var birlesmis = M.birlestir(once, gelen);
      var onceJson = M.kararliJson(once);
      var birlesmisJson = M.kararliJson(birlesmis);
      var geriYazilacak = [];
      if (kokten) {
        ALAN_ANAHTARLARI.forEach(function (ad) {
          if (alanJson(birlesmis, ad) !== alanJson(once, ad)) geriYazilacak.push(ad);
        });
      } else if (alanJson(birlesmis, anahtar) !== alanJson(gelen, anahtar)) {
        geriYazilacak.push(anahtar);
      }
      try {
        yereldeUygula(birlesmis, 'bulut');
      } catch (e) {
        sonGonderilen = null;
        birikti = true;
        var metin = 'Bulut okundu fakat cihaz deposuna yazılamadı (' + hataKodu(e) + ')';
        durumuYaz(metin);
        uyariGoster(metin, false);
        planla();
        return;
      }
      if (geriYazilacak.length) {
        sonGonderilen = null;
        planla(geriYazilacak);
      } else if (!kokten) {
        sonGonderilen = birlesmisJson;
      }
      // Öbür cihazdan veri gelmesi bu cihazın gönderim sorununu çözmez.
      if (hataSayisi || takilmaSayisi) return;
      basariUyarisi();
      durumuYaz('Eşitlendi ' + saat());
      durumBildir('hazir', 'Eşitlendi ' + saat());
    }

    // Eski uygulama sürümünün kök belgeye yazdığı son değişiklikleri kaçırma.
    abone(kokBelgesi(benimki), function (foto) {
      if (!gecerli()) return;
      temas(foto);
      if (!foto || !foto.exists) return;
      geleniUygula(bulutZarfi(foto), null, true);
    });

    ALAN_ANAHTARLARI.forEach(function (anahtar) {
      abone(alanBelgesi(benimki, anahtar), function (foto) {
        if (!gecerli()) return;
        temas(foto);
        if (!foto || !foto.exists) return;
        try {
          geleniUygula(bulutAlanZarfi(foto, anahtar), anahtar, false);
        } catch (e) {
          dinlemeHatasi(e);
        }
      });
    });

    // Başka bir açık cihaz bulut kopyasını silerse bu istemciyi de anında
    // durdur. Yerel paket olduğu gibi kalır; yalnızca yeniden yazma kapanır.
    abone(yonetimBelgesi(benimki), function (foto) {
      if (!gecerli()) return;
      temas(foto);
      if (!foto || !foto.exists) return;
      bulutSilindi = true;
      zamanlayicilariDurdur();
      dugmeGuncelle();
      altyaziGuncelle();
      durumBildir('silindi', 'Bulut kopyası silindi; yerel ilerleme korunuyor.');
    });

    dinlemeyiBirak = function () {
      kapaticilar.forEach(function (kapat) {
        // Çökmüş Firestore kuyruğu aboneliği bırakırken de eşzamanlı atar;
        // yutulmazsa çıkış ve yeniden kurma yarıda kalır.
        try { if (typeof kapat === 'function') kapat(); } catch (e) { /* bozuk kuyruk */ }
      });
      kapaticilar = [];
    };
  }

  // Kopan dinleyicileri artan aralıklarla yeniden kur; arada kaçan değişiklikler
  // için ayrıca tam birleşim yap.
  function dinlemeyiOnar() {
    if (dinlemeOnarici) return;
    // Uzun süre sağlıklı çalışmış dinleyicinin hatası yeni bir dizi başlatır;
    // kurulur kurulmaz yinelenen hata ise beklemeyi büyütür (okuma döngüsü yok).
    if (Date.now() - dinlemeBaslangici >= SAGLIKLI_DINLEME) dinlemeHataSayisi = 0;
    if (dinlemeHataSayisi >= DINLEME_EN_COK_DENEME) {
      dinlemeVazgecildi = true;
      dinlemeSorunu = 'Öbür cihazlardaki değişiklikler alınamıyor (' + dinlemeSonKod +
        '). Yeniden denemek için eşitleme düğmesine tıkla.';
      durumuYaz(dinlemeSorunu);
      uyariGoster(dinlemeSorunu, false);
      durumBildir('hata', dinlemeSorunu);
      return;
    }
    dinlemeHataSayisi++;
    dinlemeOnarici = setTimeout(function () {
      dinlemeOnarici = null;
      if (!kullanici || !hazir || bulutSilindi || silmeYapiliyor) return;
      dinlemeyeBasla();
      tazele();
    }, bekleme(dinlemeHataSayisi));
  }

  /* ---------- açılıştaki ilk geçiş/eşitleme ---------- */

  function ilkEsitle() {
    if (ilkZamanlayici) { clearTimeout(ilkZamanlayici); ilkZamanlayici = null; }
    // Hazır sayfada açılış birleşimi yeniden koşarsa ekranı yenileyebilirdi.
    if (!kullanici || hazir || gonderiliyor || bulutSilindi || silmeYapiliyor) return;
    var benimki = kullanici;
    var no = islemBaslat(true);

    bulutaBirlestir(ALAN_ANAHTARLARI, true).then(function (sonuc) {
      if (!islemGecerli(no, benimki)) return;
      sonGonderilen = sonuc.json;
      hazir = true;
      gonderiliyor = false;
      tamIslemde = false;
      basariIsle();
      sonTamEsitleme = sonTemas;
      dinlemeyeBasla();
      basariUyarisi();
      durumuYaz('Eşitlendi ' + saat());
      tamBitti(true);

      if (sonuc.bulutGetirdi) {
        window.YDS.yenidenYukle('bulut-ilk-birlesim');
        return;
      }
      durumBildir('hazir', 'Eşitlendi ' + saat());
      if (birikti || kirliAlanlariAl().length) { birikti = false; planla([]); }
    }).catch(function (e) {
      if (!islemGecerli(no, benimki)) return;
      gonderiliyor = false;
      tamIslemde = false;
      if (e && e.code === 'yds/bulut-silindi') {
        bulutSilindi = true;
        zamanlayicilariDurdur();
        dugmeGuncelle();
        altyaziGuncelle();
        durumBildir('silindi', hataKodu(e));
        return;
      }
      var ms = hataIsle();
      elleOnayBekliyor = false;
      var metin = hataMetni('Buluta şu an ulaşılamıyor; ilerleme yerelde birikiyor', e);
      durumuYaz(metin);
      uyariGoster(metin, false);
      durumBildir('hata', metin);
      tamBitti(false);
      ilkZamanlayici = setTimeout(ilkEsitle, ms);
    });
  }

  /* ---------- değişiklikleri buluta yazma ---------- */

  function zamanla(ms) {
    if (zamanlayici) clearTimeout(zamanlayici);
    zamanlayici = setTimeout(gonder, Math.max(0, ms));
  }

  // Son değişiklikten 2,5 sn sonra gönder; değişiklikler kesintisiz sürse de
  // ilk bekleyen değişiklikten en geç AZAMI_BEKLEME sonra. Hata sonrası geri
  // çekilme süresi dolmadan yeni deneme yapılmaz.
  function siradakiGecikme() {
    var simdi = Date.now();
    if (!ilkBekleyen) ilkBekleyen = simdi;
    var ms = Math.min(GECIKME, ilkBekleyen + AZAMI_BEKLEME - simdi);
    return Math.max(0, ms, ertelemeSonu - simdi);
  }

  function planla(anahtarlar) {
    if (!kullanici || bulutSilindi || silmeYapiliyor) return;
    alanlariIsaretle(anahtarlar);
    if (!ilkBekleyen) ilkBekleyen = Date.now();
    if (takildiysaBirak() && !hazir) { ilkEsitle(); return; }
    if (!hazir || gonderiliyor) { birikti = true; return; }
    zamanla(siradakiGecikme());
  }

  function gonder() {
    if (zamanlayici) { clearTimeout(zamanlayici); zamanlayici = null; }
    if (!kullanici || !hazir || bulutSilindi || silmeYapiliyor) return;
    if (gonderiliyor && !takildiysaBirak()) { birikti = true; return; }
    // Yakalama istenmişse bütün alanlar okunur. Hata olursa yalnız gerçekten
    // bekleyen yerel değişiklikler kirli sayılır (uyarı metni doğru kalır);
    // yakalamanın kendisi geri çekilme süresiyle yeniden denenir.
    var kirli = kirliAlanlariAl();
    var tam = tamIstendi || kirli.length === ALAN_ANAHTARLARI.length;
    if (!tam && !kirli.length) return;
    var hedefAlanlar = tam ? ALAN_ANAHTARLARI.slice() : kirli;
    kirli.forEach(function (anahtar) { delete kirliAlanlar[anahtar]; });
    tamIstendi = false;
    ilkBekleyen = 0;
    hemen = false;

    var benimki = kullanici;
    var no = islemBaslat(tam);
    var basarili = false;
    bulutaBirlestir(hedefAlanlar, false).then(function (sonuc) {
      if (!islemGecerli(no, benimki)) return;
      basarili = true;
      sonGonderilen = sonuc.json;
      basariIsle();
      if (tam) sonTamEsitleme = sonTemas;
      basariUyarisi();
      durumuYaz('Eşitlendi ' + saat());
      durumBildir('hazir', 'Eşitlendi ' + saat());
    }).catch(function (e) {
      if (!islemGecerli(no, benimki)) return;
      // Bekleyen yerel değişiklik yokken otomatik yakalamanın ilk hatası (ör.
      // uyanıştan hemen sonra ağ henüz gelmemişken) çubuk göstermez; yeniden
      // deneme de başarısız olursa ya da kullanıcı istediyse gösterilir.
      var sessiz = !kirli.length && !hataSayisi && !tamBekleyenler.length;
      alanlariIsaretle(kirli);
      if (kirli.length) birikti = true;
      if (tam) tamIstendi = true;
      hataIsle();
      elleOnayBekliyor = false;
      var metin = hataMetni(kirli.length ? 'Yazılamadı, yeniden denenecek'
        : 'Bulutla eşitlenemedi; yeniden denenecek', e);
      durumuYaz(metin);
      if (!sessiz) uyariGoster(metin, false);
      durumBildir('hata', metin);
    }).then(function () {
      if (!islemGecerli(no, benimki)) return;
      gonderiliyor = false;
      tamIslemde = false;
      if (tam) tamBitti(basarili);
      if (birikti || tamIstendi || kirliAlanlariAl().length) {
        birikti = false;
        // Düğmeyle ya da ağın gelmesiyle istenen tam birleşim geri çekilmeyi beklemez.
        var beklemeden = tamBekleyenler.length || hemen === 'elle' || hemen === 'zorla';
        zamanla(hemen ? (beklemeden ? 0 : Math.max(0, ertelemeSonu - Date.now()))
          : siradakiGecikme());
      }
    });
  }

  /* ---------- uyanınca yakalama: uyku, arka plan, ağ değişimi ---------- */

  // Bütün alanlarla birleşim: buluttaki her yeniliği okur, yereldeki her farkı
  // yazar. Sayfayı yeniden yüklemez; canlı dinleyici güncellemesi gibi
  // 'yds-depo-degisti' ile ekrana yansır.
  function tazele(tur) {
    if (!kullanici || bulutSilindi || silmeYapiliyor) return;
    takildiysaBirak();
    if (!hazir) {
      if (!gonderiliyor) ilkEsitle();
      return;
    }
    if (gonderiliyor) {
      // Uçuştaki tam birleşim zaten her şeyi kapsar; kısmi gönderimin ardından
      // ise beklemeden tam birleşim yapılır.
      if (!tamIslemde) { tamIstendi = true; hemen = tur || true; }
      return;
    }
    tamIstendi = true;
    gonder();
  }

  function cevrimdisi() {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
  }

  // Görünür sayfa bulutla bir süredir doğrulanmış temas kurmadıysa canlı
  // dinleyiciye güvenme: bağlantı uyku/ağ değişiminde sessizce ölmüş olabilir.
  //   olagan: sayfaya dönüş/odak; eşiğe ve hata sonrası geri çekilmeye uyar
  //   zorla:  bfcache dönüşü, ağın gelmesi, donmadan çözülme, uyku sonrası
  //   elle:   düğmeye tıklama; hiçbir sınıra takılmaz
  function uyandir(tur, esik) {
    if (!kullanici || bulutSilindi || silmeYapiliyor) return;
    if (document.visibilityState === 'hidden') return;
    var simdi = Date.now();
    if (tur !== 'elle') {
      // Çevrimdışıyken deneme yalnız uyarı üretir; ağ gelince 'online' tetikler.
      if (cevrimdisi()) return;
      if (simdi - sonTamEsitleme < OTOMATIK_ARALIK) {
        // Az önce tam birleşim yapıldı; ağ geri geldiyse bekleyen gönderim
        // geri çekilme süresini beklemeden denenir.
        if (tur === 'zorla' && hazir && !gonderiliyor && (hataSayisi || kirliAlanlariAl().length)) gonder();
        return;
      }
      if (tur === 'olagan' &&
          (simdi < ertelemeSonu || simdi - sonTemas < (esik || TAZELEME_ESIGI))) return;
    }
    // Düğme, eski çıkış/giriş dolambacı gibi askıdaki işlemi beklemeden yenisini başlatır.
    if (tur === 'elle' && gonderiliyor && simdi - islemBaslangici > ELLE_SABIR) islemiBirak();
    // Kopan dinleyiciler düğmeyle hemen; onarımdan vazgeçildiyse (ör. kota dolduğu
    // saatlerde) kullanıcı döndüğünde de bir kez daha kurulur.
    if (hazir && dinlemeSorunu && (tur === 'elle' || dinlemeVazgecildi)) {
      if (dinlemeOnarici) { clearTimeout(dinlemeOnarici); dinlemeOnarici = null; }
      dinlemeVazgecildi = false;
      dinlemeHataSayisi = 0;
      dinlemeyeBasla();
    }
    tazele(tur);
  }

  // Uyuyan bilgisayarda zamanlayıcılar durur; uyanınca iki nabız arası uzar.
  // Görünür sekmede uyanış başka hiçbir olay üretmeyebilir.
  function nabiz() {
    var simdi = Date.now();
    var uyudu = sonNabiz && simdi - sonNabiz > UYKU_ESIGI;
    sonNabiz = simdi;
    if (!kullanici || bulutSilindi || silmeYapiliyor) return;
    if (takildiysaBirak()) {
      var ms = Math.max(0, ertelemeSonu - simdi);
      if (hazir) zamanla(ms);
      else {
        if (ilkZamanlayici) clearTimeout(ilkZamanlayici);
        ilkZamanlayici = setTimeout(ilkEsitle, ms);
      }
      return;
    }
    if (uyudu) uyandir('zorla');
  }

  function agGeldi() {
    sdkYeniden();
    if (!kullanici || bulutSilindi || silmeYapiliyor) return;
    if (hataSayisi) {
      // Geri çekilme ağ yokken anlamlıydı; ağ gelince sekme gizli olsa da hemen dene.
      ertelemeSonu = 0;
      if (!hazir) { if (!gonderiliyor) ilkEsitle(); }
      else if (!gonderiliyor && (birikti || tamIstendi || kirliAlanlariAl().length)) zamanla(0);
    }
    // Sağlıklı, yakın zamanda temas etmiş sayfada her ağ dönüşü 14 belgelik okuma yapmasın.
    if (!hazir || hataSayisi || gonderiliyor || dinlemeSorunu || kirliAlanlariAl().length ||
        Date.now() - sonTemas >= TAZELEME_ESIGI) uyandir('zorla');
  }

  // Açılışta ağ yokken SDK yüklenemediyse eşitleme açık olduğu hâlde düğme ⇅
  // kalıyordu; ağ gelince ya da sayfaya dönülünce yeniden denenir.
  function sdkYeniden() {
    if (auth || sdkSozu || cevrimdisi() || !onceEtkinMi()) return;
    var simdi = Date.now();
    if (simdi - sonSdkDenemesi < OTOMATIK_ARALIK) return;
    sonSdkDenemesi = simdi;
    // Kendiliğinden deneme kapatılmış uyarıyı geri getirmez; yalnız ipucunu günceller.
    sdkYukle(true).catch(function () {});
  }

  function nabziBaslat() {
    if (nabizNo || typeof setInterval !== 'function') return;
    sonNabiz = Date.now();
    nabizNo = setInterval(nabiz, NABIZ);
  }

  function nabziDurdur() {
    if (nabizNo) clearInterval(nabizNo);
    nabizNo = null;
  }

  window.addEventListener('yds-depo-degisti', function (e) {
    var kaynak = e && e.detail && e.detail.kaynak;
    var anahtarlar = e && e.detail && e.detail.anahtarlar;
    if (kaynak !== 'bulut' && kaynak !== 'baslangic') planla(anahtarlar);
  });
  window.addEventListener('pagehide', gonder);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') gonder();
    else { sdkYeniden(); uyandir('olagan'); }
  });
  window.addEventListener('focus', function () { uyandir('olagan', ODAK_ESIGI); });
  // Geri/ileri önbellekten dönen, dondurulup çözülen ya da ağı geri gelen
  // sayfa eşiği beklemeden tam birleşim yapar.
  window.addEventListener('pageshow', function (e) { if (e && e.persisted) uyandir('zorla'); });
  window.addEventListener('online', agGeldi);
  document.addEventListener('resume', function () { uyandir('zorla'); });

  /* ---------- arayüz: başlıktaki düğme + alt yazı ---------- */

  function dugmeKur() {
    var tetik = document.querySelector('.theme-toggle:not(.esit-dugme)');
    if (!tetik || !tetik.parentNode) return;
    dugme = document.createElement('button');
    dugme.type = 'button';
    dugme.className = 'theme-toggle esit-dugme';
    dugme.textContent = '⇅';
    dugme.title = 'Bağlanıyor…';
    dugme.setAttribute('aria-label', 'Cihazlar arası eşitleme');
    dugme.disabled = false;
    dugme.addEventListener('click', tiklandi);
    tetik.parentNode.insertBefore(dugme, tetik);
  }

  function dugmeGuncelle() {
    if (!dugme) return;
    if (kullanici && bulutSilindi) {
      dugme.textContent = '!';
      dugme.classList.remove('acik');
      dugme.classList.add('hata');
      dugme.title = 'Bulut kopyası silindi. Yeniden eşitlemek için tıkla.';
    } else if (kullanici) {
      var ad = kullanici.displayName || kullanici.email || 'G';
      dugme.textContent = ad.charAt(0).toLocaleUpperCase('tr');
      dugme.classList.add('acik');
      dugme.classList.remove('hata');
      dugme.title = 'Eşitleme açık: ' + (kullanici.email || '') + '\n' + DUGME_IPUCU;
    } else {
      dugme.textContent = '⇅';
      dugme.classList.remove('acik');
      dugme.classList.remove('hata');
      dugme.title = 'İlerlemeni cihazların arasında eşitle — Google ile giriş yap';
    }
  }

  function durumuYaz(metin) {
    if (!dugme || !kullanici) return;
    dugme.title = 'Eşitleme açık: ' + (kullanici.email || '') + '\n' + metin + '\n' + DUGME_IPUCU;
  }

  // Başarılı gönderim uyarıyı kapatır; ama kopan dinleyiciler yeniden kurulup
  // sunucudan ilk görüntü gelmediyse "alınamıyor" uyarısı açık kalır.
  function basariUyarisi() {
    if (dinlemeSorunu) {
      // Kullanıcı aynı sorunun uyarısını kapattıysa her gönderimde yeniden açılmaz.
      if (dinlemeSorunu !== kapatilanSorun) uyariGoster(dinlemeSorunu, false);
      return;
    }
    kapatilanSorun = null;
    // Elle eşitlemenin onayı, gönderimin buluttan dönen yankısıyla kapanmasın.
    if (uyari && uyari.className === 'esit-uyari bilgi') return;
    uyariyiKapat();
    // Onay bir uyarının arkasında kaldıysa uyarı kalkınca gösterilir.
    if (elleOnayBekliyor) {
      elleOnayBekliyor = false;
      bilgiGoster('Eşitlendi ' + saat());
    }
  }

  function uyariyiKapat() {
    if (bilgiZamanlayici) { clearTimeout(bilgiZamanlayici); bilgiZamanlayici = null; }
    if (uyari && uyari.parentNode) uyari.parentNode.removeChild(uyari);
    uyari = null;
    if (dugme) {
      if (!bulutSilindi) dugme.classList.remove('hata');
      dugme.disabled = false;
    }
  }

  function cubukYaz(metin, sinif) {
    if (!document.body) return false;
    if (!uyari) {
      uyari = document.createElement('div');
      uyari.setAttribute('role', 'status');
      uyari.innerHTML = '<span></span><button type="button" aria-label="Uyarıyı kapat">×</button>';
      uyari.querySelector('button').addEventListener('click', function () {
        if (dinlemeSorunu && uyari && uyari.querySelector('span').textContent === dinlemeSorunu) {
          kapatilanSorun = dinlemeSorunu;
        }
        uyariyiKapat();
      });
      document.body.appendChild(uyari);
    }
    uyari.className = sinif;
    uyari.querySelector('span').textContent = metin;
    uyari.querySelector('button').setAttribute('aria-label',
      sinif === 'esit-uyari bilgi' ? 'Bildirimi kapat' : 'Uyarıyı kapat');
    return true;
  }

  function uyariGoster(metin, devreDisi) {
    if (bilgiZamanlayici) { clearTimeout(bilgiZamanlayici); bilgiZamanlayici = null; }
    if (dugme) {
      dugme.classList.add('hata');
      if (devreDisi) dugme.disabled = true;
      // Tıklamanın çözüm olduğu durumlarda hesap ve ipucu da görünsün.
      dugme.title = kullanici
        ? 'Eşitleme açık: ' + (kullanici.email || '') + '\n' + metin + '\n' + DUGME_IPUCU
        : metin;
    }
    cubukYaz(metin, 'esit-uyari');
  }

  // Elle eşitlemenin kısa onayı; açık bir uyarıyı ezmez, kendiliğinden kapanır.
  function bilgiGoster(metin, sure) {
    if (uyari && uyari.className !== 'esit-uyari bilgi') return false;
    if (!cubukYaz(metin, 'esit-uyari bilgi')) return false;
    if (bilgiZamanlayici) { clearTimeout(bilgiZamanlayici); bilgiZamanlayici = null; }
    if (sure === 0) return true;
    bilgiZamanlayici = setTimeout(function () {
      bilgiZamanlayici = null;
      if (uyari && uyari.className === 'esit-uyari bilgi') uyariyiKapat();
    }, sure || 3000);
    return true;
  }

  function sdkHataMetni() {
    return cevrimdisi()
      ? 'Bulut eşitleme çevrimdışı. İlerlemen bu cihazda korunuyor.'
      : 'Bulut eşitleme kodu yüklenemedi. İlerlemen bu cihazda korunuyor.';
  }

  function cevirmdisiUyarisi() {
    uyariGoster(sdkHataMetni(), false);
  }

  function altyaziGuncelle() {
    if (!altyaziEl) {
      var adaylar = document.querySelectorAll('.site-footer span');
      for (var i = 0; i < adaylar.length; i++) {
        if (adaylar[i].textContent.indexOf('tarayıcıda saklanır') !== -1) {
          altyaziEl = adaylar[i];
          altyaziAsli = adaylar[i].textContent;
          break;
        }
      }
    }
    if (!altyaziEl) return;
    altyaziEl.textContent = kullanici && bulutSilindi
      ? 'Bulut kopyası silindi; ilerleme yalnız bu cihazda korunuyor.'
      : kullanici
      ? 'İlerleme Google hesabınla cihazların arasında eşitleniyor.'
      : altyaziAsli;
  }

  function onceEtkinMi() {
    if (Depo.oku(ETKIN_ANAHTARI, false) === true) return true;
    try {
      if (sessionStorage.getItem(ETKIN_ANAHTARI) === '1') return true;
    } catch (e) {}
    // Lazy-load öncesinde giriş yapmış kullanıcıların mevcut Firebase Auth
    // oturumunu tanı. Değeri okumadan yalnız Firebase anahtar adını ararız.
    try {
      for (var i = 0; i < localStorage.length; i++) {
        if (String(localStorage.key(i) || '').indexOf('firebase:authUser:') === 0) return true;
      }
    } catch (e) {}
    return false;
  }

  function etkinligiYaz(acik) {
    if (acik) Depo.yaz(ETKIN_ANAHTARI, true);
    else Depo.sil(ETKIN_ANAHTARI);
    try {
      if (acik) sessionStorage.setItem(ETKIN_ANAHTARI, '1');
      else sessionStorage.removeItem(ETKIN_ANAHTARI);
    } catch (e) {}
  }

  function oturumDurumu() {
    return {
      yuklendi: !!auth,
      hazir: !!hazir,
      bagli: !!kullanici && !bulutSilindi,
      eposta: kullanici && kullanici.email ? kullanici.email : '',
      silindi: !!bulutSilindi,
      silmeHazir: SILME_HAZIR,
      mesgul: !!gonderiliyor || !!silmeYapiliyor
    };
  }

  function girisYap() {
    return sdkYukle().then(function () {
      if (kullanici || (auth && auth.currentUser)) return kullanici || auth.currentUser;
      var saglayici = new window.firebase.auth.GoogleAuthProvider();
      return auth.signInWithPopup(saglayici).catch(function (e) {
        var kod = e && e.code;
        if (kod === 'auth/popup-blocked' ||
            kod === 'auth/operation-not-supported-in-this-environment') {
          return auth.signInWithRedirect(saglayici);
        }
        throw e;
      });
    });
  }

  function cikisYap() {
    var benimki = kullanici;
    etkinligiYaz(false);
    zamanlayicilariDurdur();
    if (!auth) {
      kullanici = null;
      bulutSilindi = false;
      uyariyiKapat();
      dugmeGuncelle();
      altyaziGuncelle();
      durumBildir('kapali');
      return Promise.resolve();
    }
    return auth.signOut().catch(function (e) {
      if (benimki) {
        kullanici = benimki;
        etkinligiYaz(true);
        ilkEsitle();
      }
      durumBildir('hata', hataKodu(e));
      throw e;
    });
  }

  // Gerçek bulut silme işlemi kullanıcıdan ayrıca açık, geri alınamaz işlem
  // yetkisi alınana kadar kapalıdır. Yerel veriye hiçbir koşulda dokunmaz.
  function bulutVerisiniSil() {
    return Promise.reject(hata('yds/acik-silme-onayi-gerekli',
      'Bulut kopyasını kalıcı silmek için açık kullanıcı onayı gerekli.'));
  }

  function yenidenEtkinlestir() {
    // Silme işaretini kaldırıp veriyi daha sonra yazmak, eski bir açık
    // istemcinin aradaki boşlukta stale ilerlemeyi diriltmesine izin verebilir.
    // Nesil/epoch tabanlı atomik protokol devreye alınana kadar bu geri
    // alınamaz yönetim yolu da açık kullanıcı yetkisiyle birlikte kapalıdır.
    return Promise.reject(hata('yds/atomik-yeniden-etkinlestirme-gerekli',
      'Bulut eşitlemeyi güvenle yeniden açmak için atomik nesil protokolü gerekli.'));
  }

  // Girişliyken düğme bağlantıyı kesmez, hemen tam birleşim yapar. Otomatik
  // eşitleme takılırsa çıkış/giriş dolambacına gerek kalmaz; bağlantıyı kesmek
  // Ayarlar sayfasında.
  function simdiEsitle() {
    return new Promise(function (coz) {
      tamBekleyenler.push(coz);
      uyandir('elle');
      // Hiçbir tam birleşim başlamadıysa ya da istenmediyse (gizli sayfa, oturum yok) bekletme.
      if (tamBekleyenler.length && (!gonderiliyor || (!tamIslemde && !tamIstendi))) tamBitti(false);
    });
  }

  function elleEsitle() {
    if (!dugme || dugme.classList.contains('esitleniyor')) return;
    dugme.classList.add('esitleniyor');
    dugme.setAttribute('aria-busy', 'true');
    bilgiGoster('Eşitleniyor…', 0);
    simdiEsitle().then(function (basarili) {
      if (!dugme) return;
      dugme.classList.remove('esitleniyor');
      dugme.removeAttribute('aria-busy');
      if (basarili) elleOnayBekliyor = !bilgiGoster('Eşitlendi ' + saat());
      else if (uyari && uyari.className === 'esit-uyari bilgi') uyariyiKapat();
    });
  }

  function tiklandi() {
    if (kullanici && !bulutSilindi) { elleEsitle(); return; }
    if (dugme) dugme.disabled = true;
    var islem;
    if (kullanici && bulutSilindi) {
      islem = window.confirm('Bulut eşitleme yeniden açılsın mı?\n\nBu cihazdaki ilerleme yeniden buluta kopyalanacaktır.')
        ? yenidenEtkinlestir() : Promise.resolve();
    } else {
      islem = girisYap();
    }
    Promise.resolve(islem).catch(function (e) {
      uyariGoster(kuyrukBozukMu(e) ? KUYRUK_METNI
        : 'Bulut eşitleme açılamadı (' + hataKodu(e) + '). İlerlemen bu cihazda korunuyor.', false);
      durumBildir('hata', hataKodu(e));
    }).then(function () {
      if (dugme) dugme.disabled = false;
    });
  }

  /* ---------- başlat ---------- */

  function betikYukle(url) {
    return new Promise(function (coz, reddet) {
      var s = document.createElement('script');
      var bitti = false;
      var sure = setTimeout(function () {
        if (bitti) return;
        bitti = true;
        if (s.parentNode) s.parentNode.removeChild(s);
        reddet(new Error('Firebase SDK zaman aşımı'));
      }, 12000);
      s.src = url;
      s.onload = function () {
        if (bitti) return;
        bitti = true;
        clearTimeout(sure);
        coz();
      };
      s.onerror = function () {
        if (bitti) return;
        bitti = true;
        clearTimeout(sure);
        reddet(new Error('Firebase SDK yüklenemedi'));
      };
      document.head.appendChild(s);
    });
  }

  function sdkYukle(sessiz) {
    if (sdkSozu) return sdkSozu;
    if (dugme && !sessiz) {
      dugme.disabled = true;
      dugme.title = 'Bulut eşitlemeye bağlanıyor…';
    }
    durumBildir('yukleniyor');

    sdkSozu = Promise.resolve().then(function () {
      if (window.firebase && window.firebase.initializeApp) return;
      return betikYukle(SDK_KOK + 'firebase-app-compat.js');
    }).then(function () {
      var yuklemeler = [];
      if (!window.firebase || !window.firebase.auth) {
        yuklemeler.push(betikYukle(SDK_KOK + 'firebase-auth-compat.js'));
      }
      if (!window.firebase || !window.firebase.firestore) {
        yuklemeler.push(betikYukle(SDK_KOK + 'firebase-firestore-compat.js'));
      }
      return Promise.all(yuklemeler);
    }).then(function () {
      if (!window.firebase || !window.firebase.auth || !window.firebase.firestore) {
        throw new Error('Firebase SDK eksik yüklendi');
      }
      if (!window.firebase.apps || !window.firebase.apps.length) {
        window.firebase.initializeApp(AYAR);
      }
      auth = window.firebase.auth();
      db = window.firebase.firestore();
      uyariyiKapat();
      if (dugme) dugme.disabled = false;

      auth.onAuthStateChanged(function (u) {
        zamanlayicilariDurdur();
        kullanici = u || null;
        if (kullanici) {
          etkinligiYaz(true);
          bulutSilindi = false;
          dugmeGuncelle();
          altyaziGuncelle();
          durumBildir('baglaniyor');
          ilkEsitle();
          nabziBaslat();
        } else {
          nabziDurdur();
          uyariyiKapat();
          dugmeGuncelle();
          altyaziGuncelle();
          durumBildir(bulutSilindi ? 'silindi' : 'kapali');
        }
      });
      auth.getRedirectResult().catch(function () {});
      durumBildir('yuklendi');
      return { yuklendi: true };
    }).catch(function (e) {
      sdkSozu = null;
      if (dugme) dugme.disabled = false;
      if (!sessiz) cevirmdisiUyarisi();
      else if (dugme) dugme.title = sdkHataMetni();
      durumBildir('hata', hataKodu(e));
      throw e;
    });
    return sdkSozu;
  }

  window.YDS.Esitleme = {
    girisYap: girisYap,
    cikisYap: cikisYap,
    sdkYukle: sdkYukle,
    bulutVerisiniSil: bulutVerisiniSil,
    yenidenEtkinlestir: yenidenEtkinlestir,
    oturumDurumu: oturumDurumu
  };

  // Düğme SDK'dan bağımsız kurulur. Firebase yalnız kullanıcı tıklarsa ya da
  // bu tarayıcıda daha önce etkin bir oturum izi varsa indirilir.
  dugmeKur();
  dugmeGuncelle();
  durumBildir('kapali');
  if (onceEtkinMi()) sdkYukle().catch(function () {});
})();
