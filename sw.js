/* ============================================================
   Service worker — çevrimdışı çalışma

   Strateji:
     • Gezinme (HTML): önce ağ, olmazsa önbellek. Böylece site
       güncellendiğinde kullanıcı eski sürümde kalmaz.
     • Diğer dosyalar (CSS/JS/veri/ikon): önce önbellek, arka planda
       tazele. Açılış hızlı olur, bir sonraki ziyarette güncel gelir.

   SÜRÜM değiştiğinde eski önbellekler silinir. Siteye dosya
   eklediğinde hem SÜRÜM'ü artır hem de listeye ekle.
   ============================================================ */

var SURUM = 'yds-v39';
var ONBELLEK = SURUM;

/* Kurulumda indirilenler: sayfalar, kod ve küçük veri dosyaları.
   Kelime katmanları (data/kelime-k1..k7.js, ~2,7 MB) ve öbekler
   (630 KB) BİLEREK burada değil — kullanıcı hangisini açarsa o,
   fetch sırasında önbelleğe alınır. Hepsini peşin indirmek, tek
   katman çalışan birine 2,4 MB yüklemek olurdu. */
var TEMEL_DOSYALAR = [
  './',
  './index.html',
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
  './assets/css/style.css',
  './assets/js/main.js',
  './assets/js/esitleme-ayar.js',
  './assets/js/esitleme.js',
  './assets/js/cekim.js',
  './assets/js/gunun-testi.js',
  './assets/js/ilerleme.js',
  './assets/js/veri.js',
  './assets/js/durum.js',
  './assets/js/konular.js',
  './assets/js/kelimeler.js',
  './assets/js/aileler.js',
  './assets/js/obekler.js',
  './assets/js/quiz.js',
  './assets/js/deneme.js',
  './assets/js/baglaclar.js',
  './assets/js/ara.js',
  './data/kelime-dizin.js',
  './data/aileler.js',
  './data/konular.js',
  './data/konu-metinleri.js',
  './data/olumsuzlar.js',
  './data/sayilar.js',
  './data/sorular.js',
  './data/baglaclar.js',
  './manifest.webmanifest',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(ONBELLEK)
      .then(function (c) {
        // Tek bir dosya düşerse kurulum tümden başarısız olmasın.
        return Promise.all(TEMEL_DOSYALAR.map(function (u) {
          return c.add(u).catch(function () { /* atla */ });
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (adlar) {
        return Promise.all(adlar
          .filter(function (a) { return a !== ONBELLEK; })
          .map(function (a) { return caches.delete(a); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var istek = e.request;

  // Yalnızca kendi kaynağımızdaki GET isteklerini yönet.
  if (istek.method !== 'GET') return;
  if (new URL(istek.url).origin !== self.location.origin) return;

  // Sayfa gezinmesi: önce ağ
  if (istek.mode === 'navigate') {
    e.respondWith(
      fetch(istek)
        .then(function (yanit) {
          var kopya = yanit.clone();
          caches.open(ONBELLEK).then(function (c) { c.put(istek, kopya); });
          return yanit;
        })
        .catch(function () {
          return caches.match(istek).then(function (v) {
            return v || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Varlıklar: önce önbellek, arka planda tazele
  e.respondWith(
    caches.match(istek).then(function (onbellekte) {
      var agdan = fetch(istek).then(function (yanit) {
        if (yanit && yanit.status === 200) {
          var kopya = yanit.clone();
          caches.open(ONBELLEK).then(function (c) { c.put(istek, kopya); });
        }
        return yanit;
      }).catch(function () { return onbellekte; });

      return onbellekte || agdan;
    })
  );
});
