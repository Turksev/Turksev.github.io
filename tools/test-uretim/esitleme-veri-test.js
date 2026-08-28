'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var baglam = { window: { YDS: {} } };
vm.createContext(baglam);
vm.runInContext(fs.readFileSync(path.join(kok, 'assets', 'js', 'esitleme-veri.js'), 'utf8'), baglam);

var M = baglam.window.YDS.EsitlemeMotoru;
var j = M.kararliJson;
function meta(z, aktor) { return function () { return String(z++) + ':' + aktor; }; }

// Eski biçim kayıpsız taşınır ve iki cihazın farklı kelimeleri birleşir.
var a = M.zarfaCevir({ 'yds-leitner': { abandon: { k: 2, g: 100 } } });
var b = M.zarfaCevir({ 'yds-leitner': { ability: { k: 3, g: 110 } } });
var ab = M.birlestir(a, b);
assert.deepStrictEqual(JSON.parse(JSON.stringify(M.paket(ab)['yds-leitner'])), {
  abandon: { k: 2, g: 100 }, ability: { k: 3, g: 110 }
});

// Eski kayıtlarda aynı kelimenin gerçekten daha sonra çalışılanı kazanır.
a = M.zarfaCevir({ 'yds-leitner': { abandon: { k: 4, g: 200, c: 40 } } });
b = M.zarfaCevir({ 'yds-leitner': { abandon: { k: 1, g: 50, c: 45 } } });
assert.strictEqual(M.paket(M.birlestir(a, b))['yds-leitner'].abandon.k, 1);

// Aynı tabandan iki sekmenin farklı kart güncellemeleri kaybolmaz.
var taban = M.zarfaCevir({ 'yds-leitner': { base: { k: 1, g: 10 } } });
var sekmeA = M.kayitlariYaz(taban, 'yds-leitner', { alpha: { k: 2, g: 20, c: 15 } }, meta(100, 'A'));
var sekmeB = M.kayitlariYaz(taban, 'yds-leitner', { beta: { k: 3, g: 30, c: 16 } }, meta(100, 'B'));
var birlesik = M.birlestir(sekmeA, sekmeB);
assert.deepStrictEqual(Object.keys(M.paket(birlesik)['yds-leitner']).sort(), ['alpha', 'base', 'beta']);

// Birleştirme sıra bağımsız ve tekrar uygulanabilir olmalıdır.
assert.strictEqual(j(M.birlestir(sekmeA, sekmeB)), j(M.birlestir(sekmeB, sekmeA)));
assert.strictEqual(j(birlesik), j(M.birlestir(birlesik, sekmeA)));

// Yeni silme işareti çevrimdışı kalmış eski kaydı bastırır.
var silinmis = M.kayitlariSil(sekmeA, 'yds-leitner', ['alpha'], meta(200, 'A'));
var diriltmeDenemesi = M.birlestir(silinmis, sekmeA);
assert.strictEqual(M.paket(diriltmeDenemesi)['yds-leitner'].alpha, undefined);

// Bölüm sıfırlaması, cihazda bilinmeyen eski kayıtları da geri getirmez.
var sifir = M.anahtariSil(birlesik, 'yds-leitner', meta(300, 'A'));
assert.strictEqual(M.paket(M.birlestir(sifir, sekmeB))['yds-leitner'], undefined);

// Sıfırlamadan sonra yapılan gerçek yeni çalışma korunur.
var yeniden = M.kayitlariYaz(sifir, 'yds-leitner', { gamma: { k: 1, g: 40, c: 35 } }, meta(301, 'B'));
assert.deepStrictEqual(JSON.parse(JSON.stringify(M.paket(yeniden)['yds-leitner'])),
  { gamma: { k: 1, g: 40, c: 35 } });

// Yanlış defterindeki çözülmüş soru da eski cihazdan dirilmez.
var yanlis = M.zarfaCevir({ 'yds-yanlis': [{ a: 'K|S', kat: 'K', n: 2, t: 10 }] });
yanlis = M.kayitlariSil(yanlis, 'yds-yanlis', ['K|S'], meta(400, 'A'));
assert.deepStrictEqual(JSON.parse(JSON.stringify(M.paket(M.birlestir(yanlis,
  M.zarfaCevir({ 'yds-yanlis': [{ a: 'K|S', kat: 'K', n: 1, t: 5 }] })))['yds-yanlis'])), []);

// Geçmiş birleşir, aynı sonuç çoğalmaz ve son 50 kayıt gösterilir.
var g1 = [], g2 = [];
for (var i = 1; i <= 40; i++) g1.push({ t: i, d: i, n: 80, y: i, m: 'deneme' });
for (i = 31; i <= 70; i++) g2.push({ t: i, d: i, n: 80, y: i, m: 'deneme' });
var gp = M.paket(M.birlestir(M.zarfaCevir({ 'yds-gecmis': g1 }),
  M.zarfaCevir({ 'yds-gecmis': g2 })))['yds-gecmis'];
assert.strictEqual(gp.length, 50);
assert.strictEqual(gp[0].t, 21);
assert.strictEqual(gp[49].t, 70);

console.log('esitleme-veri: 10 senaryo başarılı');
