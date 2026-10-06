'use strict';
/* Açılış sayfası hesapları: katman özetleri dizinle tutar, öbek/cümle kayıtları karışmaz,
   bugünün destesi kelimeler.html tanımıyla aynı, seri ve sıradaki kelimeler. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const esit = (a, b, mesaj) => assert.equal(JSON.stringify(a), JSON.stringify(b), mesaj);

const kok = path.resolve(__dirname, '..', '..');
const bugunTarih = new Date(2026, 9, 5, 12).getTime();
class SahteDate extends Date {
  constructor(...a) { if (a.length) super(...a); else super(bugunTarih); }
  static now() { return bugunTarih; }
}
function ortam(depoVerisi) {
  const bellek = new Map(Object.entries(depoVerisi || {}));
  const kopya = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const Depo = {
    oku: (a, v) => bellek.has(a) ? kopya(bellek.get(a)) : v,
    yaz: (a, v) => { bellek.set(a, kopya(v)); return true; },
    sil: a => bellek.delete(a), anahtarlariSil: x => x.forEach(a => bellek.delete(a))
  };
  const pencere = { YDS: { Depo }, addEventListener() {}, matchMedia: () => ({ matches: true }) };
  const baglam = vm.createContext({ window: pencere, Date: SahteDate, console, Math, JSON, Object, Array, String, Number, parseInt, Set, Map });
  for (const f of ['data/kelime-aliaslari.js', 'assets/js/esitleme-veri.js', 'assets/js/ilerleme.js', 'data/sayilar.js', 'data/katman-uyelik.js', 'assets/js/veri.js', 'assets/js/acilis.js']) {
    vm.runInContext(fs.readFileSync(path.join(kok, f), 'utf8'), baglam, { filename: f });
  }
  return { Y: pencere.YDS, bellek, SAYILAR: pencere.SAYILAR, UYELIK: pencere.KATMAN_UYELIK };
}

// 1) Boş durum: her katman tamamen yeni, toplamlar sayilar.js ile aynı, deste varsayılan katman 2.
const bos = ortam({});
const bosOzet = bos.Y.Acilis.katmanOzeti();
assert.equal(bosOzet.length, 7);
let toplam = 0;
bosOzet.forEach(o => {
  assert.equal(o.toplam, bos.SAYILAR.katman[o.k], 'katman toplamı');
  esit([o.yeni, o.ogreniliyor, o.mezun, o.tekrar], [o.toplam, 0, 0, 0], 'boş durumda hepsi yeni');
  assert.equal(o.secili, o.k === 2, 'varsayılan seçim Çekirdek');
  assert.ok(o.ad && o.puan, 'ad ve puan metni dolu');
  toplam += o.toplam;
});
assert.equal(toplam, bos.SAYILAR.kelime);
assert.equal(bos.Y.Acilis.bugunOzeti().tekrar, 0);
assert.ok(bos.Y.Acilis.bugunOzeti().bugun > 0, 'boş durumda yeni kartlar desteyi doldurur');
assert.equal(bos.Y.Acilis.seri(), 0);
esit(bos.Y.Acilis.ornekler(2, 3), bos.UYELIK[2].slice(0, 3), 'sıradaki kelimeler dizin sırasıyla');

// 2) Karışık kayıtlar: katman 2'de mezun/öğreniliyor/vadeli; öbek ve cümle kayıtları karışmaz;
//    '@kelime:' önekli çakışan kelime doğru katmana yazılır.
const Il0 = bos.Y.Ilerleme, bugun = Il0.bugun();
const k2 = bos.UYELIK[2], k4 = bos.UYELIK[4];
const leitner = {};
k2.slice(0, 50).forEach(w => { leitner[w] = { k: 5, g: bugun + 30, c: bugun - 1, m: 0 }; });        // mezun
k2.slice(50, 70).forEach(w => { leitner[w] = { k: 2, g: bugun - 1, c: bugun - 4, m: 0 }; });        // vadesi gelmiş
k2.slice(70, 80).forEach(w => { leitner[w] = { k: 3, g: bugun + 5, c: bugun - 2, m: 0 }; });        // öğreniliyor, vadesi gelmemiş
k4.slice(0, 5).forEach(w => { leitner[w] = { k: 1, g: bugun, c: bugun - 1, m: 0 }; });              // katman 4: 5 vadeli
leitner['as well'] = { k: 3, g: bugun - 2, c: bugun - 5, m: 0 };                                     // öbek kaydı
leitner['c:abc-1'] = { k: 1, g: bugun - 2, c: bugun - 3, m: 0 };                                     // cümle kaydı
// '@kelime:used to' kelime kaydıdır (1. katman); ham 'used to' öbek kaydıdır ve katmana sayılmaz.
const cakisanOrtam = ortam({ 'yds-leitner': { '@kelime:used to': { k: 3, g: bugun + 2, c: bugun - 1, m: 0 }, 'used to': { k: 2, g: bugun - 1, c: bugun - 2, m: 0 } } });
const c1 = cakisanOrtam.Y.Acilis.katmanOzeti().find(o => o.k === 1);
esit([c1.ogreniliyor, c1.tekrar, c1.mezun], [1, 0, 0], 'çakışan başlık: yalnız kelime kaydı 1. katmana sayılır');
assert.equal(cakisanOrtam.Y.Acilis.ornekler(1, 5).indexOf('used to'), -1, 'çalışılan çakışan kelime sırada gösterilmez');
const dolu = ortam({ 'yds-leitner': leitner, 'yds-katmanlar': [2, 4], 'yds-katman7': true,
  'yds-gunluk-kayit': { [String(bugun - 1)]: { t: 12, y: 1, d: 10, m: 0, z: 0 }, [String(bugun - 2)]: { t: 8, y: 0, d: 7, m: 0, z: 0 }, [String(bugun - 4)]: { t: 3, y: 0, d: 3, m: 0, z: 0 } } });
const ozet = dolu.Y.Acilis.katmanOzeti();
const o2 = ozet.find(o => o.k === 2), o4 = ozet.find(o => o.k === 4), o1 = ozet.find(o => o.k === 1);
esit([o2.mezun, o2.ogreniliyor, o2.yeni, o2.tekrar, o2.zayif], [50, 30, k2.length - 80, 20, 20], 'katman 2 kırılımı');
assert.equal(o2.yeni + o2.ogreniliyor + o2.mezun, o2.toplam, 'katman 2 toplamı tutar');
esit([o4.ogreniliyor, o4.tekrar, o4.mezun], [5, 5, 0], 'katman 4 kırılımı');
esit([o1.mezun, o1.ogreniliyor, o1.tekrar], [0, 0, 0], 'öbek ve cümle kayıtları hiçbir katmana sızmaz');
esit(ozet.filter(o => o.secili).map(o => o.k), [2, 4]);
const bugunO = dolu.Y.Acilis.bugunOzeti();
assert.equal(bugunO.tekrar, 25, 'bugünün destesi yalnız seçili katmanları sayar (2 ve 4)');
assert.equal(dolu.Y.Acilis.seri(), 2, 'bugün çalışılmadı: dün ve önceki gün art arda, 4 gün önce kopuk');
const sirada = dolu.Y.Acilis.ornekler(2, 3);
esit(sirada, k2.slice(80, 83), 'sıradaki kelimeler çalışılmamış olanlardan başlar');
sirada.forEach(w => assert.equal(dolu.Y.Ilerleme.yeniMi(w, 'kelime'), true));

// 3) Eski 6 seçimi, yds-katman7 bayrağı yokken 7 sayılır (kelimeler.js göçüyle aynı); bozuk değer varsayılana döner.
esit(ortam({ 'yds-katmanlar': [2, 6] }).Y.Acilis.seciliKatmanlar(), [2, 7]);
esit(ortam({ 'yds-katmanlar': [6, 7] }).Y.Acilis.seciliKatmanlar(), [7], 'eski 6 ile 7 birlikte: 7 bir kez');
esit(ortam({ 'yds-katmanlar': [6, 7] }).Y.Acilis.bugunOzeti().yeni, bos.UYELIK[7].length, 'yinelenen katman desteyi iki kez saymaz');
esit(ortam({ 'yds-katmanlar': [2, 6], 'yds-katman7': true }).Y.Acilis.seciliKatmanlar(), [2, 6]);
esit(ortam({ 'yds-katmanlar': 'abc' }).Y.Acilis.seciliKatmanlar(), [2]);
esit(ortam({ 'yds-katmanlar': [9, 0, 'x'] }).Y.Acilis.seciliKatmanlar(), [2]);

// 4) Katman tamamen mezunsa sıradaki kelimeler vadesi gelenlerden, o da yoksa listenin başından gelir.
const hepsiMezun = {};
bos.UYELIK[7].forEach(w => { hepsiMezun[w] = { k: 5, g: bugun + 9, c: bugun - 1, m: 0 }; });
esit(ortam({ 'yds-leitner': hepsiMezun }).Y.Acilis.ornekler(7, 2), bos.UYELIK[7].slice(0, 2));

// 5) Seri: bugün çalışıldıysa bugünden geriye sayılır.
assert.equal(ortam({ 'yds-gunluk-kayit': { [String(bugun)]: { t: 1 }, [String(bugun - 1)]: { t: 4 }, [String(bugun - 2)]: { t: 0 } } }).Y.Acilis.seri(), 2);

// 6) Sayıdan sonra iyelik eki: son okunan sayı sözcüğüne göre.
const iy = bos.Y.Acilis.iyelik;
esit([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 1000, 1482, 911, 6986, 2358, 612, 1000000].map(n => n + iy(n)),
  ['0’ı', '1’i', '2’si', '3’ü', '4’ü', '5’i', '6’sı', '7’si', '8’i', '9’u', '10’u', '20’si', '30’u', '40’ı', '50’si', '60’ı', '70’i', '80’i', '90’ı', '100’ü', '1000’i', '1482’si', '911’i', '6986’sı', '2358’i', '612’si', '1000000’u'],
  'iyelik ekleri');

console.log('acilis: boş durum, katman kırılımı (öbek/cümle sızmaz), seçili katman destesi, seri ve sıradaki kelimeler geçti.');
