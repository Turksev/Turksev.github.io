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

console.log('Kullanım: geçici hatadan kurtulma, bekleyen veri koruması, açılış hatası sonrası benimseme ve ileri sürüm uyumu geçti.');
