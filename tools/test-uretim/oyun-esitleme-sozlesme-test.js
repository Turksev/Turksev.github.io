'use strict';
/* Oyunlar sayfası ↔ eşitleme motoru sözleşmesi.

   Oyun, açılıştaki bulut birleşimi bitmeden cevap işlemez (başka cihazın yeni kaydı eski
   kutuyla ezilmesin). Birleşimin sürdüğünü motorun 'yds-esitleme-durumu' olayındaki durum
   adından anlar. Adlar iki dosyada düz metindir; biri değişir ya da motora yeni bir durum
   eklenirse bu test durur ve neye bakılacağını söyler. Tarayıcı takımı (tools/oyunlar-browser-qa.js)
   aynı korumayı gerçek motorla uçtan uca dener. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const kok = path.resolve(__dirname, '..', '..');
const oku = f => fs.readFileSync(path.join(kok, f), 'utf8');
const motor = oku('assets/js/esitleme-v2.js');
const oyun = oku('assets/js/oyunlar.js');
const sayfa = oku('oyunlar.html');

const SONUC = ['hata', 'hazir', 'kapali', 'silindi'];          // birleşim bitti ya da hiç başlamadı
const SUREN = ['baglaniyor', 'yuklendi', 'yukleniyor'];        // birleşim sürüyor: cevap bekletilir
const NE_YAPMALI = ' Oyunlar sayfası açılıştaki bulut birleşimini bu adlarla izler: assets/js/oyunlar.js içindeki ' +
  'ESITLEME_SONUCLARI listesini (sonuç bildiren durumlar) ve bu testteki SONUC / SUREN listelerini yeni adlara göre güncelle.';

/* ---------- 1) Motorun bildirdiği durum adları ---------- */
const motorAdlari = new Set();
let cagri = 0;
for (const m of motor.matchAll(/durumBildir\(([^;\n]*)\);/g)) {
  cagri++;
  // İlk argüman düz ad ya da iki adlı koşul ifadesi olabilir: durumBildir(silindi ? 'silindi' : 'kapali').
  const adlar = [...m[1].split(',')[0].matchAll(/'([^']*)'/g)].map(x => x[1]);
  assert.ok(adlar.length, 'durumBildir çağrısının durum adı kaynakta düz metin değil: ' + m[0] +
    ' Bu test adları kaynaktan okur; adı düz metin yaz ya da testi yeni biçime göre güncelle.');
  adlar.forEach(a => motorAdlari.add(a));
}
assert.ok(cagri >= 10, 'esitleme-v2.js içinde durumBildir çağrıları bulunamadı (' + cagri + '); işlevin adı değiştiyse bu testi güncelle');
assert.deepEqual([...motorAdlari].sort(), [...SONUC, ...SUREN].sort(),
  'Eşitleme motorunun bildirdiği durum adları değişti.' + NE_YAPMALI);
assert.match(motor, /\('yds-esitleme-durumu', \{ detail: detay \}\)/, 'motor durumunu yds-esitleme-durumu olayıyla bildirir');
assert.match(motor, /durum: durum,/, 'olayın detail.durum alanı durum adını taşır');

/* ---------- 2) Oyun sayfasının listesi ve kuralı ---------- */
const liste = /var ESITLEME_SONUCLARI = \[([^\]]*)\];/.exec(oyun);
assert.ok(liste, 'oyunlar.js içinde ESITLEME_SONUCLARI listesi bulunamadı; bu testi yeni yapıya göre güncelle');
assert.deepEqual([...liste[1].matchAll(/'([^']*)'/g)].map(x => x[1]).sort(), SONUC,
  'oyunlar.js: ESITLEME_SONUCLARI motorun sonuç bildiren durumlarıyla aynı olmalı.' + NE_YAPMALI);
assert.match(oyun, /addEventListener\('yds-esitleme-durumu'/, 'oyun sayfası motorun olayını dinler');
assert.match(oyun, /esitlemeDurumu = \(e && e\.detail && e\.detail\.durum\) \|\| '';/, 'durum adı olayın detail.durum alanından okunur');

// Kuralın kendisi: sonuç bildirmeyen her ad (bilinmeyen ad da) "sürüyor" sayılır; hiç olay gelmediyse sürmüyordur.
const bas = oyun.indexOf('  function esitlemeSuruyor() {');
assert.ok(bas >= 0, 'oyunlar.js içinde esitlemeSuruyor işlevi bulunamadı');
const govde = oyun.slice(bas, oyun.indexOf('\n  }', bas) + 4);
const ortam = vm.createContext({ ESITLEME_SONUCLARI: SONUC.slice(), esitlemeDurumu: '' });
vm.runInContext(govde, ortam);
const suruyorMu = ad => { ortam.esitlemeDurumu = ad; return vm.runInContext('esitlemeSuruyor()', ortam); };
assert.equal(suruyorMu(''), false, 'motor henüz hiçbir şey bildirmediyse cevap bekletilmez');
for (const ad of SONUC) assert.equal(suruyorMu(ad), false, ad + ': birleşim sürmüyor');
for (const ad of SUREN) assert.equal(suruyorMu(ad), true, ad + ': birleşim sürüyor, cevap bekletilir');
assert.equal(suruyorMu('yeni-ara-durum'), true, 'tanınmayan durum adı beklemeyi sürdürür (üst sınır yine geçerlidir)');
assert.match(oyun, /window\.setTimeout\(esitlemeTamam, ESITLEME_BEKLEME_MS\);/, 'bekleme sayfa açılışından başlayan bir üst sınırla biter');
assert.match(oyun, /var ESITLEME_BEKLEME_MS = 8000;/, 'üst sınır 8 saniye (README ile aynı)');

/* ---------- 3) Betik sırası ----------
   Motor betiği çalışırken 'kapali', daha önce oturum açılmışsa hemen ardından 'yukleniyor' bildirir.
   Oyun betiği ondan sonra yüklenseydi bu olayları kaçırır, birleşimi hiç beklemezdi. */
const betikler = [...sayfa.matchAll(/<script\s+src="([^"]+)"/g)].map(m => m[1]);
const sira = ad => betikler.findIndex(s => s.endsWith('/assets/js/' + ad));
assert.ok(sira('oyunlar.js') >= 0 && sira('esitleme-v2.js') >= 0, 'oyunlar.html iki betiği de yükler');
assert.ok(sira('oyunlar.js') < sira('esitleme-v2.js'),
  'oyunlar.html: oyunlar.js, esitleme-v2.js betiğinden ÖNCE yüklenmeli (motorun ilk durum olaylarını kaçırmasın)');

console.log('oyun-esitleme-sozlesme: ' + cagri + ' durumBildir çağrısı, ' + motorAdlari.size + ' durum adı (' + SUREN.length +
  ' sürüyor, ' + SONUC.length + ' sonuç), betik sırası ve bekleme kuralı geçti.');
