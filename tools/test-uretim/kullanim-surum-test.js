'use strict';
// Kullanım istatistiği: geçici depolama hatasından kurtulma ve sürümler arası uyum.
const assert = require('node:assert/strict');
const {Storage, browser} = require('./kullanim-fixture');

// 1) Bekleyen kayıt yokken yaşanan geçici okuma hatası, erişim düzelince temizlenir.
const depo = new Storage(), b = browser({storage: depo});
b.K.olay('kart-cevap');
b.advance(120000); b.checkpoint();
assert.equal(b.checkpoint(), true, 'Bütün sayaçlar kaydedildi');
depo.blocked = true;
assert.equal(b.checkpoint(), false, 'Depo erişilemezken kayıt başarısız');
assert.equal(b.K.oku().partial, true, 'Hata sürerken rapor eksik uyarısı verir');
depo.blocked = false;
assert.equal(b.checkpoint(), true, 'Erişim düzelince yeni etkileşim beklemeden kurtarır');
assert.equal(b.K.oku().partial, false, 'Kaybolan veri olmadığı için eksik uyarısı kalkar');
const kelimeler = b.report().pages.find(r => r.id === 'kelimeler');
assert.equal(kelimeler.seconds, 90, 'Kaydedilmiş süre korunur');

// 2) Bekleyen kayıt varken hata olursa veri bellekte kalır ve sonra yazılır.
const depo2 = new Storage(), c = browser({storage: depo2});
c.K.olay('ipucu');
depo2.blocked = true;
assert.equal(c.checkpoint(), false);
depo2.blocked = false;
assert.equal(c.checkpoint(), true);
assert.equal(c.report().features.find(r => r.id === 'ipucu').count, 1, 'Bekleyen eylem kaybolmaz');
assert.equal(c.K.oku().partial, false);

// 3) İleri sürümün eklediği bilinmeyen eylem kimliği satırın tamamını düşürmez.
const H = b.H, bugun = H.gun(new Date(2026, 8, 26));
const rapor = H.rapor({records: [
  {v: 1, g: bugun, p: 'kelimeler', a: 1, s: 30, f: {'kart-cevap': 1, 'gelecekteki-eylem': 4}}
]}, 7, bugun);
assert.equal(rapor.partial, false, 'Bilinmeyen eylem eksik veri sayılmaz');
assert.equal(rapor.pages.find(r => r.id === 'kelimeler').visits, 1);
assert.equal(rapor.pages.find(r => r.id === 'kelimeler').seconds, 30);
assert.equal(rapor.features.find(r => r.id === 'kart-cevap').count, 1);
assert.equal(rapor.features.some(r => r.id === 'gelecekteki-eylem'), false, 'Bilinmeyen eylem rapora eklenmez');
// Bozuk değerler hâlâ reddedilir.
assert.equal(H.gecerli({v: 1, g: bugun, p: 'kelimeler', a: 1, s: 30, f: {'kart-cevap': -1}}), false);
assert.equal(H.gecerli({v: 1, g: bugun, p: 'kelimeler', a: 1, s: 30, f: {'kart-cevap': 'x'}}), false);

// 4) Açılışta depo okunamazsa (daha önce sıfırlanmış dönem) o sırada tutulan kayıtlar
//    depo düzelince silinmez; depodaki dönem ve kurulum benimsenir.
const onceki = new Storage();
onceki.setItem('yds-kullanim-v1:epoch', 'onceki-donem');
onceki.setItem('yds-kullanim-v1:kurulum', 'kurulum-1');
onceki.blocked = true;
const acilis = browser({storage: onceki});
acilis.K.olay('ipucu');
acilis.advance(20000);
onceki.blocked = false;
assert.equal(acilis.checkpoint(), true, 'Depo düzelince kayıtlar yazılır');
const acilisRaporu = acilis.report();
assert.equal(acilisRaporu.features.find(r => r.id === 'ipucu').count, 1, 'Açılış hatası sırasındaki eylem kaybolmaz');
assert.equal(acilisRaporu.pages.find(r => r.id === 'kelimeler').visits, 1, 'Açılış hatası sırasındaki ziyaret kaybolmaz');
assert.equal(acilis.K.oku().partial, false);
assert.ok(Array.from(onceki.map.keys()).some(k => k.startsWith('yds-kullanim-v1:r:onceki-donem:') && k.includes(':kurulum-1:')),
  'Kayıt depodaki dönem ve kurulumla yazılır');
assert.equal(onceki.getItem('yds-kullanim-v1:epoch'), 'onceki-donem', 'Dönem değiştirilmez');

// Depoda hiç dönem yoksa yeni bir kimlik yazılır; kayıtlar yine korunur.
const bos = new Storage();
bos.blocked = true;
const bosAcilis = browser({storage: bos});
bosAcilis.K.olay('kart-cevap');
bos.blocked = false;
assert.equal(bosAcilis.checkpoint(), true);
assert.equal(bosAcilis.report().features.find(r => r.id === 'kart-cevap').count, 1);
assert.ok(bos.getItem('yds-kullanim-v1:epoch'), 'Yeni dönem kimliği yazıldı');
assert.ok(bos.getItem('yds-kullanim-v1:kurulum'), 'Yeni kurulum kimliği yazıldı');

const EPOCH = 'yds-kullanim-v1:epoch', INSTALL = 'yds-kullanim-v1:kurulum';
const t0 = new Date(2026, 8, 26, 12).getTime();

// 5) Açılışta hiç okuyamayan B, toparlanmadan önce A kullanımı sıfırlarsa B'nin
//    sıfırlama öncesi sayaçları yeni döneme taşınmaz.
const s5 = new Storage();
s5.setItem(EPOCH, 'D1'); s5.setItem(INSTALL, 'K1');
s5.blocked = true;
const b5 = browser({storage: s5, now: t0});
b5.K.olay('ipucu'); b5.advance(20000);
s5.blocked = false;
const a5 = browser({storage: s5, now: t0 + 60000, path: '/ayarlar.html'});
assert.equal(a5.K.sifirla(), true);
b5.checkpoint(); b5.checkpoint();
const r5 = a5.report();
assert.equal(r5.features.find(r => r.id === 'ipucu').count, 0, 'Sıfırlama öncesi eylem geri gelmez');
assert.equal(r5.pages.find(r => r.id === 'kelimeler').visits, 0, 'Sıfırlama öncesi ziyaret geri gelmez');
assert.equal(r5.pages.find(r => r.id === 'kelimeler').seconds, 0, 'Sıfırlama öncesi süre geri gelmez');

// 6) Dönemi okuyup kurulumu okuyamayan kısmi açılış: sıfırlama varsa kayıtlar düşer,
//    yoksa korunur.
function kismi(sifirla) {
  const s = new Storage();
  s.setItem(EPOCH, 'D1'); s.setItem(INSTALL, 'K1');
  const gercek = s.getItem.bind(s);
  let kurulumHatasi = true;
  s.getItem = k => { if (kurulumHatasi && k === INSTALL) throw Error('okunamadı'); return gercek(k); };
  const b = browser({storage: s, now: t0});
  b.K.olay('ipucu');
  kurulumHatasi = false;
  const a = browser({storage: s, now: t0 + 60000, path: '/ayarlar.html'});
  if (sifirla) a.K.sifirla();
  b.checkpoint(); b.checkpoint();
  return a.report().features.find(r => r.id === 'ipucu').count;
}
assert.equal(kismi(true), 0, 'Kısmi açılış + sıfırlama: eski eylem geri gelmez');
assert.equal(kismi(false), 1, 'Kısmi açılış, sıfırlama yok: eylem korunur');

// 7) Boş depoda iki sekme aynı anda toparlanır: A dönemi boş okur, yazmadan önce B
//    kendi kaydını yazar. İkisi aynı 'ilk' dönemini kullandığı için B'nin kaydı silinmez.
const s7 = new Storage();
s7.blocked = true;
const a7 = browser({storage: s7, now: t0}), b7 = browser({storage: s7, now: t0});
a7.K.olay('kart-cevap'); b7.K.olay('kart-cevap');
s7.blocked = false;
const gercek7 = s7.getItem.bind(s7);
let kanca = true;
s7.getItem = k => {
  if (kanca && k === EPOCH) { kanca = false; assert.equal(b7.checkpoint(), true, 'B önce toparlanıp yazar'); return null; }
  return gercek7(k);
};
assert.equal(a7.checkpoint(), true);
a7.checkpoint(); b7.checkpoint();
assert.equal(s7.getItem(EPOCH), 'ilk');
assert.equal(a7.report().features.find(r => r.id === 'kart-cevap').count, 2, 'Yarışan iki sekmenin kayıtları birlikte kalır');

// 8) Sıfırlanmış dönem varken yenileme açılışında depo okunamazsa ziyaret çift sayılmaz.
const s8 = new Storage(), oturum8 = new Storage();
s8.setItem(EPOCH, 'D2'); s8.setItem(INSTALL, 'K2');
const ilk8 = browser({storage: s8, sessionStorage: oturum8, now: t0});
assert.equal(ilk8.checkpoint(), true);
s8.blocked = true;
const yeniden8 = browser({storage: s8, sessionStorage: oturum8, now: t0 + 5000, reload: true});
s8.blocked = false;
yeniden8.checkpoint();
assert.equal(yeniden8.report().pages.find(r => r.id === 'kelimeler').visits, 1, 'Hatalı açılışla yenileme ikinci ziyaret sayılmaz');

// 9) Sıfırlama önce zaman damgasını, sonra dönemi yazar: dönem değişikliği olayını
//    hemen işleyen, açılışta depoyu okuyamamış sekme damgayı güncel görür.
const s9 = new Storage();
s9.setItem(EPOCH, 'D1'); s9.setItem(INSTALL, 'K1');
s9.blocked = true;
const b9 = browser({storage: s9, now: t0});
b9.K.olay('ipucu'); b9.advance(20000);
s9.blocked = false;
const a9 = browser({storage: s9, now: t0 + 60000, path: '/ayarlar.html'});
const yaz9 = s9.setItem.bind(s9);
s9.setItem = (k, v) => {
  yaz9(k, v);
  if (k === EPOCH) { s9.setItem = yaz9; b9.emit('storage', {key: EPOCH}); }
};
assert.equal(a9.K.sifirla(), true);
b9.checkpoint(); b9.checkpoint();
const r9 = a9.report();
assert.equal(r9.features.find(r => r.id === 'ipucu').count, 0, 'Dönem olayı damgadan önce işlense de eski eylem geri gelmez');
assert.equal(r9.pages.find(r => r.id === 'kelimeler').visits, 0, 'Eski ziyaret geri gelmez');

// 10) Sıfırlamadan sonra, depoyu okuyamayan yenileme açılışı: önceki ziyaret silinmiş
//     dönemdeydi; bu yenileme yeni dönemin ilk ziyaretidir ve sayılır.
function yenilemeSifirlamaSonrasi(ilkDonem) {
  const s = new Storage(), oturum = new Storage();
  if (ilkDonem) { s.setItem(EPOCH, ilkDonem); s.setItem(INSTALL, 'K1'); }
  const ilk = browser({storage: s, sessionStorage: oturum, now: t0});
  assert.equal(ilk.checkpoint(), true);
  const ayar = browser({storage: s, now: t0 + 1000, path: '/ayarlar.html'});
  assert.equal(ayar.K.sifirla(), true);
  s.blocked = true;
  const yeniden = browser({storage: s, sessionStorage: oturum, now: t0 + 5000, reload: true});
  s.blocked = false;
  assert.equal(yeniden.checkpoint(), true);
  return yeniden.report().pages.find(r => r.id === 'kelimeler').visits;
}
assert.equal(yenilemeSifirlamaSonrasi('D1'), 1, 'Sıfırlanmış dönemden sonra yenileme ziyareti sayılır');
assert.equal(yenilemeSifirlamaSonrasi(null), 1, 'İlk dönemden sonra sıfırlanınca yenileme ziyareti sayılır');

// 11) Açılışta dönem yazılamadıysa dönem bilinmiyor sayılır. Eski sürümdeki bir sekme
//     silinmiş depoya rastgele dönem yazsa bile (sıfırlama yok) bu sekmenin kayıtları korunur.
const s11 = new Storage();
const yaz11 = s11.setItem.bind(s11);
let donemYazilamaz = true;
s11.setItem = (k, v) => { if (donemYazilamaz && k === EPOCH) throw Error('quota'); return yaz11(k, v); };
const b11 = browser({storage: s11, now: t0});
b11.K.olay('kart-cevap');
donemYazilamaz = false;
s11.setItem(EPOCH, 'eski-surum-donemi');
assert.equal(b11.checkpoint(), true);
assert.equal(b11.report().features.find(r => r.id === 'kart-cevap').count, 1, 'Yazılamayan açılış dönemi sıfırlama kanıtı sayılmaz');

// 12) Depo dışarıdan silinir; başka sekme 'ilk' dönemini yeniden yazar. Aynı 'ilk'
//     döneminde kalan eski sekme silinmiş sayaçlarını geri yazmaz.
const s12 = new Storage();
const b12 = browser({storage: s12, now: t0});
b12.K.olay('ipucu');
assert.equal(b12.checkpoint(), true);
s12.map.clear();
const a12 = browser({storage: s12, now: t0 + 1000});
assert.equal(s12.getItem(EPOCH), 'ilk');
// Eski sekme silmeden sonra yeni bir işlem yapar: yalnız bu yeni işlem yazılmalı.
b12.K.olay('kart-cevap');
b12.checkpoint(); b12.checkpoint();
const r12 = a12.report();
assert.equal(r12.features.find(r => r.id === 'ipucu').count, 0, 'Silinen eylem geri yazılmaz');
assert.equal(r12.features.find(r => r.id === 'kart-cevap').count, 1, 'Silmeden sonraki işlem kaydedilir');
// Silme yokken aynı kontrol kayıtları bozmaz.
const s12b = new Storage();
const b12b = browser({storage: s12b, now: t0});
b12b.K.olay('ipucu'); b12b.checkpoint();
b12b.K.olay('ipucu'); b12b.advance(1000);
assert.equal(b12b.checkpoint(), true);
assert.equal(b12b.report().features.find(r => r.id === 'ipucu').count, 2, 'Silme yoksa sayaçlar birikir');

console.log('Kullanım: geçici hatadan kurtulma, bekleyen veri koruması, açılış hatası sonrası benimseme, sıfırlama sırası, yarış ve dış silme koruması, yenileme ve ileri sürüm uyumu geçti.');
