'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var pencere = { YDS: {} };
var baglam = vm.createContext({ window: pencere });

function yukle(dosya) {
  vm.runInContext(fs.readFileSync(path.join(kok, dosya), 'utf8'), baglam, { filename: dosya });
}

['data/sorular.js', 'data/sorular-ek.js', 'assets/js/soru-konu.js',
 'data/deneme-formlari.js', 'data/sayilar.js'].forEach(yukle);

var sorular = pencere.SORULAR;
var formlar = pencere.DENEME_FORMLARI;
assert.strictEqual(sorular.length, 286, 'toplam soru bankası 286 olmalı');
assert.strictEqual(pencere.SAYILAR.soru, sorular.length, 'görünen soru sayısı bankayla aynı değil');
assert.strictEqual(formlar.length, 3, 'üç sabit form olmalı');

var idHaritasi = new Map();
sorular.forEach(function (s) {
  assert.ok(/^q-[0-9a-f]{8}$/.test(s.id), 'kararlı soru kimliği yok');
  assert.strictEqual(s.id, pencere.YDS.SoruKonu.kimlik(s), 'soru kimliği içerikle uyuşmuyor');
  assert.ok(!idHaritasi.has(s.id), 'çakışan soru kimliği: ' + s.id);
  assert.ok(Array.isArray(s.se) && s.se.length === 5, s.id + ': beş seçenek yok');
  assert.ok(Number.isInteger(s.d) && s.d >= 0 && s.d < 5, s.id + ': cevap anahtarı geçersiz');
  assert.ok(s.ac, s.id + ': açıklama yok');
  assert.ok(/^E\d{2}$/.test(s.konu), s.id + ': konu bağlantısı yok');
  assert.ok(s.kaynak === 'uzman-ozgun' || s.kaynak === 'calisma-bankasi', s.id + ': kaynak etiketi yok');
  idHaritasi.set(s.id, s);
});

var bolumler = [
  ['Kelime', 6], ['Dil Bilgisi', 4], ['Bağlaç', 4], ['Preposition', 2],
  ['Cloze Test', 10], ['Cümle Tamamlama', 10], ['Çeviri', 6], ['Okuma', 20],
  ['Diyalog', 5], ['Restatement', 4], ['Paragraf Tamamlama', 4],
  ['Anlamı Bozan Cümle', 5]
];
var kullanilan = new Set();

formlar.forEach(function (form) {
  assert.ok(/^[ABC]$/.test(form.id));
  assert.strictEqual(form.sorular.length, 80, form.id + ': form 80 soru değil');
  assert.ok(Array.isArray(form.sikKaydirma) && form.sikKaydirma.length === 80,
    form.id + ': şık yerleşimi eksik');
  assert.ok(form.sikKaydirma.every(function (n) {
    return Number.isInteger(n) && n >= 0 && n < 5;
  }), form.id + ': geçersiz şık kaydırması');
  assert.strictEqual(new Set(form.sorular).size, 80, form.id + ': form içinde tekrar var');
  var bas = 0;
  bolumler.forEach(function (bolum) {
    var dilim = form.sorular.slice(bas, bas + bolum[1]).map(function (id) {
      assert.ok(idHaritasi.has(id), form.id + ': bankada bulunmayan kimlik ' + id);
      return idHaritasi.get(id);
    });
    assert.ok(dilim.every(function (s) { return s.kat === bolum[0]; }),
      form.id + ': ' + (bas + 1) + '-' + (bas + bolum[1]) + ' bölüm sırası bozuk (' + bolum[0] + ')');
    bas += bolum[1];
  });

  var secilen = form.sorular.map(function (id) { return idHaritasi.get(id); });
  var cevapDagilimi = [0, 0, 0, 0, 0];
  secilen.forEach(function (s, i) {
    cevapDagilimi[(s.d - form.sikKaydirma[i] + 5) % 5]++;
  });
  assert.deepStrictEqual(cevapDagilimi, [16, 16, 16, 16, 16],
    form.id + ': doğru cevaplar A–E arasında dengeli değil');

  var ceviri = secilen.slice(36, 42);
  function turkceMi(s) { return /[çğıöşüİ]/i.test(s.s || ''); }
  assert.ok(ceviri.slice(0, 3).every(function (s) { return !turkceMi(s); }),
    form.id + ': 37–39 İngilizce→Türkçe olmalı');
  assert.ok(ceviri.slice(3).every(turkceMi),
    form.id + ': 40–42 Türkçe→İngilizce olmalı');
  var cloze = secilen.filter(function (s) { return s.kat === 'Cloze Test'; });
  var okuma = secilen.filter(function (s) { return s.kat === 'Okuma'; });
  var clozePid = Array.from(new Set(cloze.map(function (s) { return s.pid; })));
  var okumaPid = Array.from(new Set(okuma.map(function (s) { return s.pid; })));
  assert.strictEqual(clozePid.length, 2, form.id + ': cloze iki beş-soruluk metinden oluşmalı');
  assert.ok(clozePid.every(function (pid) { return cloze.filter(function (s) { return s.pid === pid; }).length === 5; }));
  assert.strictEqual(okumaPid.length, 5, form.id + ': okuma beş dört-soruluk metinden oluşmalı');
  assert.ok(okumaPid.every(function (pid) { return okuma.filter(function (s) { return s.pid === pid; }).length === 4; }));

  form.sorular.forEach(function (id) {
    assert.ok(!kullanilan.has(id), 'formlar arasında tekrar eden soru: ' + id);
    kullanilan.add(id);
  });
});

assert.strictEqual(kullanilan.size, 240, 'üç form toplam 240 benzersiz soru kullanmalı');

function konuBekle(cevap, beklenen) {
  var soru = sorular.find(function (s) { return s.se[s.d].toLowerCase() === cevap.toLowerCase(); });
  assert.ok(soru, 'regresyon sorusu bulunamadı: ' + cevap);
  assert.strictEqual(soru.konu, beklenen, cevap + ': yanlış konu bağlantısı');
}
konuBekle('moreover', 'E47');
konuBekle('so that', 'E46');
konuBekle('Once', 'E48');
konuBekle('had destroyed', 'E08');
konuBekle('be revised', 'E20');
konuBekle('Unless', 'E43');
console.log('deneme-formları: 3×80, resmî sıra, 240 benzersiz soru ve pasaj bütünlüğü başarılı');
