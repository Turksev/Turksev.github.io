/* ============================================================
   Service worker â€” Ã§evrimdÄ±ÅŸÄ± Ã§alÄ±ÅŸma

   Strateji:
     â€¢ Gezinme (HTML): Ã¶nce aÄŸ, olmazsa Ã¶nbellek. BÃ¶ylece site
       gÃ¼ncellendiÄŸinde kullanÄ±cÄ± eski sÃ¼rÃ¼mde kalmaz.
     â€¢ DiÄŸer dosyalar (CSS/JS/veri/ikon): Ã¶nce Ã¶nbellek, arka planda
       tazele. AÃ§Ä±lÄ±ÅŸ hÄ±zlÄ± olur, bir sonraki ziyarette gÃ¼ncel gelir.

   SÃœRÃœM deÄŸiÅŸtiÄŸinde eski Ã¶nbellekler silinir. Siteye dosya
   eklediÄŸinde hem SÃœRÃœM'Ã¼ artÄ±r hem de listeye ekle.
   ============================================================ */

var SURUM = 'yds-v115';
var ONBELLEK = SURUM;

/* Kurulumda indirilenler: sayfalar, kod ve kÃ¼Ã§Ã¼k veri dosyalarÄ±.
   Kelime katmanlarÄ± (data/kelime-k1..k7.js, ~2,7 MB) ve Ã¶bekler
   (630 KB) BÄ°LEREK burada deÄŸil â€” kullanÄ±cÄ± hangisini aÃ§arsa o,
   fetch sÄ±rasÄ±nda Ã¶nbelleÄŸe alÄ±nÄ±r. Hepsini peÅŸin indirmek, tek
   katman Ã§alÄ±ÅŸan birine 2,4 MB yÃ¼klemek olurdu. */
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
  './data/depo.js',
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
        // Tek bir dosya dÃ¼ÅŸerse kurulum tÃ¼mden baÅŸarÄ±sÄ±z olmasÄ±n.
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

  // YalnÄ±zca kendi kaynaÄŸÄ±mÄ±zdaki GET isteklerini yÃ¶net.
  if (istek.method !== 'GET') return;
  if (new URL(istek.url).origin !== self.location.origin) return;

  // Sayfa gezinmesi: Ã¶nce aÄŸ
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

  // VarlÄ±klar: Ã¶nce Ã¶nbellek, arka planda tazele
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
