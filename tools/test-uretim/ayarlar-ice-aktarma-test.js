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
    addEventListener() {}, confirm() { return true; }, prompt() { return ''; }
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
  ['Kelime ve öbek', 'Soru yanlış', 'Kategori', 'Deneme', 'Konu', 'Bağlam', 'En iyi', 'Bugün açılan'].forEach(function (ad) {
    assert.ok(reset.indexOf(ad) !== -1, 'reset özeti alanı içermeli: ' + ad);
  });
  assert.ok(reset.indexOf('Korunacak 4 çalışma tercihi') !== -1);

  console.log('ayarlar-ice-aktarma-test: OK');
}

ana().catch(function (hata) { console.error(hata); process.exitCode = 1; });
