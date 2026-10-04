/* Ayarlar içe aktarma: şema, prototype güvenliği, kayıpsız birleşim ve açık onay. */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const KOK = path.resolve(__dirname, '..', '..');

function eleman() {
  return {
    textContent: '', className: '', innerHTML: '', hidden: false, disabled: false,
    value: '', files: null, children: [], olaylar: Object.create(null),
    addEventListener(tur, fn) { this.olaylar[tur] = fn; },
    appendChild(x) { this.children.push(x); return x; },
    remove() {}, click() {}, focus() { this.odaklandi = true; }
  };
}

function ortam() {
  const elemanlar = Object.create(null);
  const storage = Object.create(null);
  let paket = {};
  let yazim = 0;
  const belge = {
    body: eleman(),
    getElementById(id) { return elemanlar[id] || (elemanlar[id] = eleman()); },
    createElement() { return eleman(); }
  };
  const pencere = {
    olaylar: Object.create(null),
    YDS: {
      kacar: String,
      Ilerleme: { hepsiniSifirla() { return true; } },
      geriAlKutusu() {}, depolamaUyarisi() {}
    },
    YDS_KELIME_ALIASES: {}, YDS_KELIME_ILERLEME_KIMLIKLERI: {},
    document: belge,
    localStorage: {
      setItem(k, v) { storage[k] = String(v); },
      getItem(k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null; }
    },
    addEventListener(tur, fn) { this.olaylar[tur] = fn; }, confirm() { return true; }, prompt() { return ''; }
  };
  pencere.window = pencere;
  pencere.YDS.EsitlemeDepo = {
    paket() { return JSON.parse(JSON.stringify(paket)); },
    paketYaz(v) { yazim++; paket = JSON.parse(JSON.stringify(v)); return true; }
  };
  const baglam = vm.createContext({
    window: pencere, document: belge, console, JSON, Object, Array, Number, String,
    Boolean, Date, Math, Set, Promise, Error, Blob: function () {},
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
    setTimeout(fn) { fn(); }
  });
  vm.runInContext(fs.readFileSync(path.join(KOK, 'assets/js/esitleme-veri.js'), 'utf8'), baglam);
  vm.runInContext(fs.readFileSync(path.join(KOK, 'assets/js/ayarlar.js'), 'utf8'), baglam);
  return {
    baglam, pencere, elemanlar, storage,
    paketAyarla(v) { paket = JSON.parse(JSON.stringify(v)); },
    paket() { return paket; }, yazim() { return yazim; }
  };
}

function zarf(veri) {
  return {
    tur: 'yds-ilerleme-yedegi', sema: 1,
    olusturuldu: '2026-08-29T12:00:00.000Z', uygulamaSurumu: 'yds-v142', veri
  };
}

function tumAlanlar() {
  return {
    'yds-leitner': JSON.parse('{"prototype":{"k":2,"g":21000},"constructor":{"k":3,"g":21003,"c":21000}}'),
    'yds-yanlis': [{ a: 'constructor', n: 2, t: 1000 }],
    'yds-kategori': { constructor: { d: 3, y: 1, r: [{ id: 's1', d: 1, t: 1000 }] } },
    'yds-gecmis': [{ t: 1000, d: 8, n: 10, y: 80, m: 'alistirma', f: '', a: '' }],
    'yds-konular': { T01: { d: 1, t: 80, g: null, n: 'not', ta: 20000, u: 1000 } },
    'yds-rekor': { yuzde: 80, dogru: 8, toplam: 10 },
    'yds-yeni-sayac': { g: 20000, n: 4 },
    'yds-test-yanlis': { prototype: { n: 1, t: 1000 } },
    'yds-gunluk-yeni': 20,
    'yds-gunluk-tavan': 150,
    'yds-katmanlar': [3, 1, 2],
    'yds-eksen': 1
  };
}

function baglamDegeri(o, deger) {
  o.baglam.__girdi = JSON.stringify(deger);
  return vm.runInContext('JSON.parse(__girdi)', o.baglam);
}

async function ana() {
  const o = ortam();
  const api = o.pencere.YDS.AyarlarGuvenlik;

  const temiz = api.yedegiDogrula(baglamDegeri(o, zarf(tumAlanlar())));
  assert.deepStrictEqual(Array.from(Object.keys(temiz)).sort(), Array.from(Object.keys(tumAlanlar())).sort());
  assert.ok(Object.prototype.hasOwnProperty.call(temiz['yds-leitner'], 'prototype'));
  assert.ok(Object.prototype.hasOwnProperty.call(temiz['yds-leitner'], 'constructor'));
  const motorTuru = o.pencere.YDS.EsitlemeMotoru.paket(o.pencere.YDS.EsitlemeMotoru.zarfaCevir(temiz));
  assert.ok(Object.prototype.hasOwnProperty.call(motorTuru['yds-leitner'], 'prototype'));
  assert.ok(Object.prototype.hasOwnProperty.call(motorTuru['yds-leitner'], 'constructor'),
    'constructor kimliği eşitleme motorundan geçerken değişmemeli');
  assert.strictEqual(temiz['yds-yanlis'][0].u, 1000, 'eski yanlış kaydı normalize edilmeli');
  assert.strictEqual(temiz['yds-yeni-sayac'].ek, 0, 'eksik ek sayacı normalize edilmeli');
  assert.deepStrictEqual(Array.from(temiz['yds-katmanlar']), [1, 2, 3]);
  assert.strictEqual({}.polluted, undefined);
  const kesirliPuan = zarf({
    'yds-gecmis': [{ t: 1001, d: 1, n: 80, y: 1.25, m: 'deneme', f: 'A', a: 'tam' }]
  });
  assert.strictEqual(api.yedegiDogrula(baglamDegeri(o, kesirliPuan))['yds-gecmis'][0].y, 1.25,
    'tam denemenin kesirli YDS puanı geçerli olmalı');

  // Kategori adı ekranda gösterilir: HTML karakteri içeren yedek reddedilir, gerçek adlar geçer.
  assert.throws(function () { api.yedegiDogrula(baglamDegeri(o, zarf({ 'yds-kategori': { '<img src=x onerror=alert(1)>': { d: 0, y: 3 } } }))); },
    /kategori adı/, 'HTML içeren kategori adı reddedilir');
  assert.throws(function () { api.yedegiDogrula(baglamDegeri(o, zarf({ 'yds-kategori': { 'Kelime"onmouseover="x': { d: 1, y: 0 } } }))); });
  const gecerliKategoriler = api.yedegiDogrula(baglamDegeri(o, zarf({ 'yds-kategori': {
    'Anlamı Bozan Cümle': { d: 1, y: 0 }, 'Cümle Tamamlama': { d: 2, y: 1 }, 'Dil Bilgisi': { d: 0, y: 1 }, 'Çeviri': { d: 3, y: 0 }, 'Preposition': { d: 1, y: 1 }
  } })))['yds-kategori'];
  assert.strictEqual(Object.keys(gecerliKategoriler).length, 5, 'soru bankasındaki Türkçe kategori adları geçerli');
  assert.match(fs.readFileSync(path.join(KOK, 'assets/js/quiz.js'), 'utf8'), /kacar\(zayif\.kat\)/, 'quiz.js en zayıf kategori adını kaçışla yazar');
  // Günlük sayaç ve yeni kart sayacı cihaz payları taşıyabilir; toplam paylardan hesaplanır.
  const payli = api.yedegiDogrula(baglamDegeri(o, zarf({
    'yds-gunluk-kayit': { '20340': { t: 1, y: 0, d: 0, m: 0, z: 0, p: { tel: { t: 20, y: 2 }, pc: { t: 10, d: 7 } } } },
    'yds-yeni-sayac': { g: 20340, n: 1, p: { tel: { n: 4 }, pc: { n: 3 } } }
  })));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(payli['yds-gunluk-kayit']['20340'])),
    { t: 30, y: 2, d: 7, m: 0, z: 0, p: { tel: { t: 20, y: 2, d: 0, m: 0, z: 0 }, pc: { t: 10, y: 0, d: 7, m: 0, z: 0 } } });
  assert.strictEqual(payli['yds-yeni-sayac'].n, 7, 'yeni kart sayacı payların toplamıdır');
  assert.throws(function () { api.yedegiDogrula(baglamDegeri(o, zarf({ 'yds-gunluk-kayit': { '20340': { t: 1, p: { 'A B': { t: 1 } } } } }))); }, /cihaz payı/);
  assert.throws(function () { api.yedegiDogrula(baglamDegeri(o, zarf({ 'yds-yeni-sayac': { g: 1, n: 1, p: { tel: { n: -1 } } } }))); });
  // İçe aktarmada aynı günün kayıtları artık atılmaz, cihaz paylarıyla birleşir.
  const gunBirlesimi = api.guvenliBirlestir(
    baglamDegeri(o, { 'yds-gunluk-kayit': { '20340': { t: 20, y: 0, d: 20, m: 0, z: 0, p: { tel: { t: 20, y: 0, d: 20, m: 0, z: 0 } } } } }),
    baglamDegeri(o, { 'yds-gunluk-kayit': { '20340': { t: 10, y: 1, d: 9, m: 0, z: 0, p: { pc: { t: 10, y: 1, d: 9, m: 0, z: 0 } } } } }));
  assert.strictEqual(gunBirlesimi['yds-gunluk-kayit']['20340'].t, 30, 'yedekteki günün çalışması mevcut güne eklenir');
  const sayacBirlesimi = api.guvenliBirlestir(
    baglamDegeri(o, { 'yds-yeni-sayac': { g: 20340, n: 4, ek: 0, p: { tel: { n: 4 } } } }),
    baglamDegeri(o, { 'yds-yeni-sayac': { g: 20340, n: 3, ek: 5, p: { pc: { n: 3 } } } }));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(sayacBirlesimi['yds-yeni-sayac'])), { g: 20340, n: 7, ek: 5, p: { pc: { n: 3 }, tel: { n: 4 } } });

  const bozuklar = [
    zarf({ 'yds-gunluk-yeni': { n: 20 } }),
    zarf({ 'yds-gunluk-tavan': 10000 }),
    zarf({ 'yds-katmanlar': [0, 2] }),
    zarf({ 'yds-eksen': 2 }),
    zarf({ 'yds-rekor': { yuzde: 90, dogru: 8, toplam: 10 } }),
    zarf({ 'yds-gecmis': [{ t: 1, d: 1, n: 2, y: 80 }] }),
    zarf({ 'yds-leitner': { x: { k: 6, g: 2 } } }),
    zarf({ 'yds-test-yanlis': { x: { n: 1, t: 2, fazladan: 1 } } }),
    zarf({ 'yds-konular': { T01: { d: 1, t: 101 } } }),
    zarf({ 'yds-kategori': { Kelime: { d: -1, y: 0 } } }),
    zarf({ 'yds-yeni-sayac': { g: 1, n: -1 } }),
    zarf({ 'yds-yanlis': [{ a: 'x', n: 0, t: 1 }] })
  ];
  bozuklar.forEach(function (b) {
    assert.throws(function () { api.yedegiDogrula(baglamDegeri(o, b)); });
  });
  const protoHam = '{"tur":"yds-ilerleme-yedegi","sema":1,"olusturuldu":"2026-08-29T12:00:00.000Z","uygulamaSurumu":"yds-v142","veri":{"yds-leitner":{"__proto__":{"k":1,"g":2}}}}';
  o.baglam.__protoHam = protoHam;
  assert.throws(function () { vm.runInContext('window.YDS.AyarlarGuvenlik.yedegiDogrula(JSON.parse(__protoHam))', o.baglam); });
  assert.strictEqual({}.k, undefined, 'prototype pollution olmamalı');

  const mevcut = {
    'yds-leitner': { prototype: { k: 4, g: 100, c: 90 } },
    'yds-rekor': { yuzde: 90, dogru: 9, toplam: 10 },
    'yds-gunluk-yeni': 30,
    'yds-katmanlar': [6]
  };
  const gelen = {
    'yds-leitner': JSON.parse('{"prototype":{"k":3,"g":999},"constructor":{"k":2,"g":200}}'),
    'yds-rekor': { yuzde: 80, dogru: 8, toplam: 10 },
    'yds-gunluk-yeni': 5,
    'yds-katmanlar': [1, 2],
    'yds-eksen': 1
  };
  const birlesmis = api.guvenliBirlestir(baglamDegeri(o, mevcut), baglamDegeri(o, gelen));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(birlesmis['yds-leitner'].prototype)), mevcut['yds-leitner'].prototype,
    'daha düşük kutu veya ileri tarih mevcut kaydı geriletmemeli');
  assert.strictEqual(birlesmis['yds-leitner'].constructor.k, 2);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(birlesmis['yds-rekor'])), mevcut['yds-rekor']);
  assert.strictEqual(birlesmis['yds-gunluk-yeni'], 30, 'mevcut tercih korunmalı');
  assert.deepStrictEqual(Array.from(birlesmis['yds-katmanlar']), [6]);
  assert.strictEqual(birlesmis['yds-eksen'], 1, 'eksik mevcut alan eklenmeli');

  const elli = [];
  for (let i = 1; i <= 50; i++) elli.push({ t: i, d: 1, n: 1, y: 100, m: '', f: '', a: '' });
  const tarihBirlesimi = api.guvenliBirlestir(baglamDegeri(o, { 'yds-gecmis': elli }),
    baglamDegeri(o, { 'yds-gecmis': [{ t: 1000, d: 1, n: 1, y: 100, m: '', f: '', a: '' }] }));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(tarihBirlesimi['yds-gecmis'])), elli,
    '50 mevcut geçmiş kaydından hiçbiri içe aktarma için atılmamalı');

  api.kurtarmaYaz(baglamDegeri(o, mevcut));
  assert.ok(o.storage[api.kurtarmaAnahtari], 'eşitleme dışı kurtarma kopyası yazılmalı');
  assert.deepStrictEqual(JSON.parse(o.storage[api.kurtarmaAnahtari]).veri, mevcut);

  // Dosya seçimi yalnız önizleme üretir; paket yazımı açık onaya kadar sıfır kalır.
  o.paketAyarla(mevcut);
  const dosya = { size: 1000, text() { return Promise.resolve(JSON.stringify(zarf(gelen))); } };
  o.elemanlar.iceAktarDosya.files = [dosya];
  o.elemanlar.iceAktarDosya.olaylar.change.call(o.elemanlar.iceAktarDosya);
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.strictEqual(o.yazim(), 0, 'önizleme sırasında paketYaz çağrılmamalı');
  assert.strictEqual(o.elemanlar.iceAktarOnizleme.hidden, false);
  o.elemanlar.iceAktarOnay.olaylar.click();
  assert.strictEqual(o.yazim(), 1, 'açık onaydan sonra bir kez paket yazılmalı');
  assert.ok(o.storage[api.kurtarmaAnahtari], 'paket yazımından önce kurtarma kopyası kalmalı');

  const o2 = ortam();
  o2.paketAyarla(mevcut);
  o2.pencere.localStorage.setItem = function () { throw new Error('quota'); };
  o2.elemanlar.iceAktarDosya.files = [dosya];
  o2.elemanlar.iceAktarDosya.olaylar.change.call(o2.elemanlar.iceAktarDosya);
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  o2.elemanlar.iceAktarOnay.olaylar.click();
  assert.strictEqual(o2.yazim(), 0, 'kurtarma kopyası yazılamazsa paketYaz kesinlikle çağrılmamalı');

  const o3 = ortam();
  o3.paketAyarla(mevcut);
  o3.elemanlar.iceAktarDosya.files = [dosya];
  o3.elemanlar.iceAktarDosya.olaylar.change.call(o3.elemanlar.iceAktarDosya);
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  const aradaDegisen = JSON.parse(JSON.stringify(mevcut));
  aradaDegisen['yds-leitner'].yeni = { k: 1, g: 50 };
  o3.paketAyarla(aradaDegisen);
  o3.elemanlar.iceAktarOnay.olaylar.click();
  assert.strictEqual(o3.yazim(), 0, 'önizleme sonrası yeni ilerleme varsa ilk onay yalnız özeti yenilemeli');
  o3.elemanlar.iceAktarOnay.olaylar.click();
  assert.strictEqual(o3.yazim(), 1, 'güncel özet ikinci açık onaydan sonra yazılmalı');
  assert.ok(o3.paket()['yds-leitner'].yeni, 'önizleme sırasında eklenen ilerleme korunmalı');

  const reset = api.resetOzeti(baglamDegeri(o, tumAlanlar()));
  ['Kelime ve öbek', 'Soru yanlış', 'Kategori', 'Deneme', 'Konu', 'Bağlam', 'En iyi', 'Bugün açılan', 'Günlük çalışma sayaçları'].forEach(function (ad) {
    assert.ok(reset.indexOf(ad) !== -1, 'reset özeti alanı içermeli: ' + ad);
  });
  assert.ok(reset.indexOf('Korunacak 4 çalışma tercihi') !== -1);
  assert.ok(reset.indexOf('Sıfırlanacak 9 ilerleme alanı') !== -1);
  assert.ok(reset.indexOf('Kullanım kayıtları yedeğe girmez ve geri alınamaz') !== -1);

  const silme = ortam(), onaylar = [];
  let kullanimSilme = 0, ilerlemeSilme = 0, onay = false, ilerlemeBasarili = true, kullanimBasarili = true;
  silme.paketAyarla(tumAlanlar());
  const silmeOncesi = JSON.stringify(silme.paket());
  silme.pencere.confirm = function (mesaj) { onaylar.push(mesaj); return onay; };
  silme.pencere.YDS.Kullanim = { sifirla() { kullanimSilme++; return kullanimBasarili; } };
  silme.pencere.YDS.Ilerleme.hepsiniSifirla = function () { ilerlemeSilme++; return ilerlemeBasarili; };
  silme.elemanlar.kullanimSil.olaylar.click();
  assert.strictEqual(kullanimSilme, 0, 'kullanım silme iptalinde hiçbir kayıt silinmez');
  onay = true;
  silme.elemanlar.kullanimSil.olaylar.click();
  assert.strictEqual(kullanimSilme, 1);
  assert.strictEqual(ilerlemeSilme, 0, 'yalnız kullanım silme ilerleme sıfırlamasını çağırmaz');
  assert.strictEqual(silme.yazim(), 0, 'yalnız kullanım silme eşitleme paketine yazmaz');
  assert.strictEqual(JSON.stringify(silme.paket()), silmeOncesi);
  assert.match(onaylar.at(-1), /geri alınamaz/);
  assert.match(silme.elemanlar.ayarDurum.textContent, /İlerleme ve çalışma tercihlerin korundu/);

  onaylar.length = 0;
  silme.elemanlar.yerelSil.olaylar.click();
  assert.strictEqual(onaylar.length, 2, 'genel sıfırlama iki açık onayı korur');
  assert.match(onaylar[0], /9 ilerleme alanı/);
  assert.match(onaylar[0], /Kullanım kayıtları yedeğe girmez ve geri alınamaz/);
  assert.doesNotMatch(onaylar[0], /7 gün/);
  assert.match(onaylar[1], /Kullanım kayıtları yedekten geri gelmeyecek/);
  assert.strictEqual(ilerlemeSilme, 1);
  assert.strictEqual(kullanimSilme, 2, 'başarılı genel sıfırlama yerel kullanımı da siler');
  ilerlemeBasarili = false;
  silme.elemanlar.yerelSil.olaylar.click();
  assert.strictEqual(kullanimSilme, 2, 'ilerleme sıfırlaması başarısızsa kullanım silinmez');
  ilerlemeBasarili = true; kullanimBasarili = false;
  silme.elemanlar.yerelSil.olaylar.click();
  assert.match(silme.elemanlar.ayarDurum.textContent, /Kullanım kayıtları silinemedi/);
  assert.strictEqual(silme.elemanlar.ayarDurum.className, 'status-kutu err', 'kısmi silme tüm veriler silinmiş gibi gösterilmez');

  const kapsam = ortam();
  const kullanimRaporu = { startedDay: 20000, seconds: 120, capacityLimited: true, retainedFromDay: Date.UTC(2026, 7, 29) / 86400000, partial: false };
  kapsam.pencere.YDS.Kullanim = { oku() { return {}; }, sifirla() { return true; } };
  kapsam.pencere.YDS.KullanimHesap = { rapor(snapshot, aralik) { assert.strictEqual(aralik, 30); return kullanimRaporu; } };
  kapsam.pencere.olaylar['yds:kullanim-degisti']();
  assert.match(kapsam.elemanlar.kullanimYerelOzet.textContent, /Son 30 günde 2 dakika/);
  assert.match(kapsam.elemanlar.kullanimYerelOzet.textContent, /Depolama sınırı nedeniyle 29 Ağustos 2026 tarihinden önceki günlük ayrıntılar kaldırıldı/);
  assert.doesNotMatch(kapsam.elemanlar.kullanimYerelOzet.textContent, /kaydedilemedi veya okunamadı/);
  kullanimRaporu.partial = true;
  kapsam.pencere.olaylar['yds:kullanim-degisti']();
  assert.match(kapsam.elemanlar.kullanimYerelOzet.textContent, /Depolama sınırı/);
  assert.match(kapsam.elemanlar.kullanimYerelOzet.textContent, /kaydedilemedi veya okunamadı/);
  kullanimRaporu.partial = false; kullanimRaporu.capacityLimited = false;
  kapsam.pencere.olaylar['yds:kullanim-degisti']();
  assert.doesNotMatch(kapsam.elemanlar.kullanimYerelOzet.textContent, /Depolama sınırı|kaydedilemedi veya okunamadı/, 'etkilenmeyen dönem ve düzelmiş hata için uyarı kalmaz');

  console.log('ayarlar-ice-aktarma-test: OK');
}

ana().catch(function (hata) { console.error(hata); process.exitCode = 1; });
