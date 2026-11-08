/* ============================================================
   Service worker — çevrimdışı çalışma

   Strateji:
     • Gezinme (HTML): önce ağ, olmazsa önbellek. Böylece site
       güncellendiğinde kullanıcı eski sürümde kalmaz.
     • Sürümlü dosyalar (CSS/JS/veri/ikon): değişmez yol, önce önbellek.
       Önbellekte yoksa ağdan al; yazımı yaşam döngüsü tamamlanana dek beklet.

   Kurulumda zorunlu dosyalardan biri eksikse yeni sürüm etkinleşmez.
   Bir önceki YDS önbelleği ve başka uygulamaların önbellekleri korunur.
   Her yayından önce "pnpm generate" çalıştır: değişmez varlık yollarını,
   dosya listesini ve içerik özetine bağlı worker sürümünü birlikte üretir.
   ============================================================ */

var SURUM = 'yds-v257';
/* İçerik özeti — tools/sw-surum.py üretir, elle değiştirme. Yayımlanan
   HTML/JS/CSS/veri dosyaları değişince özet değişir ve betik SURUM'u
   artırır. tools/test-uretim/sw-surum-test.js aynı özeti hesaplayıp
   karşılaştırır: dosya değişip sürüm artmamışsa CI kırmızıya döner.
   (5 Eylül 2026: altı yayın boyunca sürüm v173'te kaldı; kullanıcı yeni
   HTML + eski JS gördü.) */
var ICERIK_OZETI = '0c963743';
var ONBELLEK = SURUM;

/* Kurulumda indirilenler: sayfalar, kod ve küçük veri dosyaları.
   Kelime katmanları (data/kelime-k1..k7.js, ~2,7 MB) ve öbekler
   (630 KB) BİLEREK burada değil — kullanıcı hangisini açarsa o,
   fetch sırasında önbelleğe alınır. Hepsini peşin indirmek, tek
   katman çalışan birine 2,4 MB yüklemek olurdu. */
var TEMEL_DOSYALAR = [
  './releases/0740d66c86dd/assets/js/kelime-bicimleri.js',
  './releases/0740d66c86dd/data/kelime-bicimleri.js',
  './releases/0740d66c86dd/assets/css/kalip-calisma.css',
  './releases/0740d66c86dd/assets/js/oyun-secici.js',
  './releases/0740d66c86dd/assets/js/kalip-calisma-hesap.js',
  './releases/0740d66c86dd/assets/js/kalip-calisma-kayit.js',
  './releases/0740d66c86dd/assets/js/kalip-calisma.js',
  './releases/0740d66c86dd/data/kalip-calisma.js',
  './releases/0740d66c86dd/data/kalip-sunum.js',
  './releases/0740d66c86dd/assets/js/kalip-sunum.js',
  './',
  './index.html',
  './ana-sayfa.html',
  './durum.html',
  './konular.html',
  './kelimeler.html',
  './aileler.html',
  './obekler.html',
  './quiz.html',
  './deneme.html',
  './gramer.html',
  './baglaclar.html',
  './ara.html',
  './yontem.html',
  './ayarlar.html',
  './cumleler.html',
  './istatistik.html',
  './oyunlar.html',
  './releases/0740d66c86dd/assets/css/style.css',
  './releases/0740d66c86dd/assets/css/istatistik.css',
  './releases/0740d66c86dd/assets/css/acilis.css',
  './releases/0740d66c86dd/assets/css/oyunlar.css',
  './releases/0740d66c86dd/assets/js/main.js',
  './releases/0740d66c86dd/assets/js/kullanim-hesap.js',
  './releases/0740d66c86dd/assets/js/kullanim.js',
  './releases/0740d66c86dd/assets/js/arama-ortak.js',
  './releases/0740d66c86dd/assets/js/sozluk.js',
  './releases/0740d66c86dd/assets/js/acilis.js',
  './releases/0740d66c86dd/data/kelime-aliaslari.js',
  './releases/0740d66c86dd/data/kaynak-manifest.json',
  './releases/0740d66c86dd/data/kelime-provenans.json',
  './releases/0740d66c86dd/assets/js/esitleme-ayar.js',
  './releases/0740d66c86dd/assets/js/esitleme-veri.js',
  './releases/0740d66c86dd/assets/js/esitleme-depo.js',
  './releases/0740d66c86dd/assets/js/esitleme-v2.js',
  './releases/0740d66c86dd/assets/js/cekim.js',
  './releases/0740d66c86dd/assets/js/gunun-testi.js',
  './releases/0740d66c86dd/assets/js/ilerleme.js',
  './releases/0740d66c86dd/assets/js/veri.js',
  './releases/0740d66c86dd/assets/js/durum.js',
  './releases/0740d66c86dd/assets/js/istatistik.js',
  './releases/0740d66c86dd/assets/js/istatistik-hesap.js',
  './releases/0740d66c86dd/assets/js/konular.js',
  './releases/0740d66c86dd/assets/js/kelimeler.js',
  './releases/0740d66c86dd/assets/js/oyun-hesap.js',
  './releases/0740d66c86dd/assets/js/oyunlar.js',
  './releases/0740d66c86dd/assets/js/aileler.js',
  './releases/0740d66c86dd/assets/js/obekler.js',
  './releases/0740d66c86dd/assets/js/quiz.js',
  './releases/0740d66c86dd/assets/js/deneme-oturum.js',
  './releases/0740d66c86dd/assets/js/deneme.js',
  './releases/0740d66c86dd/assets/js/soru-konu.js',
  './releases/0740d66c86dd/assets/js/baglaclar.js',
  './releases/0740d66c86dd/assets/js/ara.js',
  './releases/0740d66c86dd/assets/js/ayarlar.js',
  './releases/0740d66c86dd/assets/js/cumleler.js',
  './releases/0740d66c86dd/assets/js/kelime-bilgi.js',
  './releases/0740d66c86dd/data/kelime-dizin.js',
  './releases/0740d66c86dd/data/aileler.js',
  './releases/0740d66c86dd/data/konular.js',
  './releases/0740d66c86dd/data/konu-metinleri.js',
  './releases/0740d66c86dd/data/konu-metinleri-t-ek.js',
  './releases/0740d66c86dd/data/konu-metinleri-e1-ek.js',
  './releases/0740d66c86dd/data/konu-metinleri-e2-ek.js',
  './releases/0740d66c86dd/data/olumsuzlar.js',
  './releases/0740d66c86dd/data/sayilar.js',
  './releases/0740d66c86dd/data/katman-uyelik.js',
  './releases/0740d66c86dd/data/yds-dagilim.js',
  './releases/0740d66c86dd/data/sorular.js',
  './releases/0740d66c86dd/data/sorular-ek.js',
  './releases/0740d66c86dd/data/deneme-formlari.js',
  './releases/0740d66c86dd/data/baglaclar.js',
  './manifest.webmanifest',
  './releases/0740d66c86dd/assets/img/icon-192.png',
  './releases/0740d66c86dd/assets/img/icon-512.png'
];

self.addEventListener('install', function (e) {
  // addAll is atomic: one missing required asset leaves the old worker active.
  // Request.cache bypasses a potentially stale HTTP cache during installation.
  e.waitUntil(caches.open(ONBELLEK).then(function (c) {
    return c.addAll(TEMEL_DOSYALAR.map(function (u) {
      return new Request(new URL(u, self.location.href).toString(), { cache: 'reload' });
    }));
  }));
});

self.addEventListener('message', function (e) {
  if (!e.data) return;
  if (e.data.type === 'YENI_SURUMU_ETKINLESTIR') self.skipWaiting();
  if (e.data.type === 'YDS_SURUM_SOR' && e.ports && e.ports[0]) {
    e.ports[0].postMessage({ surum: SURUM, icerik: ICERIK_OZETI });
  }
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (adlar) {
    // Origin may contain unrelated projects. Keep one previous YDS cache for
    // an existing offline tab, and never delete another application's cache.
    var eski = adlar.filter(function (a) { return /^yds-v\d+$/.test(a) && a !== ONBELLEK; })
      .sort(function (a, b) { return Number(b.slice(5)) - Number(a.slice(5)); });
    return Promise.all(eski.slice(1).map(function (a) { return caches.delete(a); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var istek = e.request;
  if (istek.method !== 'GET') return;
  var url = new URL(istek.url);
  if (url.origin !== self.location.origin) return;
  url.search = ''; url.hash = '';
  var anahtar = url.toString();

  function kaydet(yanit) {
    if (!yanit || !yanit.ok || yanit.type !== 'basic') return Promise.resolve(yanit);
    return caches.open(ONBELLEK).then(function (c) {
      return c.put(anahtar, yanit.clone()).then(function () { return yanit; });
    });
  }
  function onbellektenBul() {
    // Önce bu sürümün önbelleği; bulunamazsa açık kalmış eski bir sekme için
    // saklanan önceki YDS önbelleği (activate bir öncekini tutar). Başka
    // uygulamaların önbelleğine bakılmaz.
    return caches.open(ONBELLEK).then(function (c) { return c.match(anahtar); }).then(function (bulunan) {
      if (bulunan) return bulunan;
      return caches.keys().then(function (adlar) {
        var eski = adlar.filter(function (a) { return /^yds-v\d+$/.test(a) && a !== ONBELLEK; })
          .sort(function (a, b) { return Number(b.slice(5)) - Number(a.slice(5)); });
        return eski.reduce(function (zincir, ad) {
          return zincir.then(function (h) {
            return h || caches.open(ad).then(function (c) { return c.match(anahtar); });
          });
        }, Promise.resolve(undefined));
      });
    });
  }

  var sonuc;
  if (istek.mode === 'navigate') {
    // Each HTML document refers only to immutable release paths. Network-first
    // navigation can therefore never pair fresh HTML with an older JS URL.
    sonuc = fetch(istek).then(kaydet).catch(function () {
      return onbellektenBul().then(function (cached) {
        if (cached) return cached;
        return new Response('Bu sayfa çevrimdışı kullanım için henüz indirilmedi. İnternet bağlantın geldiğinde yeniden aç.', {
          status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    });
  } else {
    // Never replace the bytes at an already-cached release URL. A release
    // update changes the PATH, not only ?v=, including all dynamically loaded
    // word layers, examples and test data. Misses are cached in this version.
    sonuc = onbellektenBul().then(function (cached) {
      return cached || fetch(istek).then(kaydet);
    });
  }
  e.respondWith(sonuc);
  e.waitUntil(sonuc.then(function () {}, function () {}));
});
