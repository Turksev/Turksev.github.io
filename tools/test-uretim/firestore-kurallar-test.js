'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var kurallar = fs.readFileSync(path.join(kok, 'firestore.rules'), 'utf8');
var firebase = JSON.parse(fs.readFileSync(path.join(kok, 'firebase.json'), 'utf8'));

assert.strictEqual(firebase.firestore.rules, 'firestore.rules');
assert.ok(/match\s+\/kullanicilar\/\{uid\}/.test(kurallar));
assert.ok(/request\.auth\s*!=\s*null\s*&&\s*request\.auth\.uid\s*==\s*uid/.test(kurallar),
  'başka uid belgelerine erişimi kesen sahiplik denetimi eksik');
assert.ok(/allow read, delete:\s*if kendiBelgesi\(uid\)/.test(kurallar));
assert.ok(/allow create, update:\s*if kendiBelgesi\(uid\)\s*&&\s*!bulutSilinmis\(uid\)\s*&&\s*gecerliEsitlemeZarfi\(\)/.test(kurallar),
  'kök yazımı silme işaretçisi varken engellenmiyor');
assert.ok(/hasAll\(\['surum', 'zaman', 'json'\]\)/.test(kurallar));
assert.ok(/hasOnly\(\['surum', 'zaman', 'json'\]\)/.test(kurallar));
assert.ok(/request\.resource\.data\.surum\s*==\s*1/.test(kurallar),
  'önbellekteki eski istemcilerin sürüm 1 kök zarfları engelleniyor');
assert.ok(/request\.resource\.data\.surum\s*==\s*2/.test(kurallar),
  'geçişteki sürüm 2 kök zarfları engelleniyor');
assert.ok(/match\s+\/alanlar\/\{alan\}/.test(kurallar),
  'alan başına Firestore belge yolu eksik');
assert.ok(/gecerliAlanBelgesi\(alan\)/.test(kurallar),
  'alan belgesi şema denetimi eksik');
assert.ok(/allow create:\s*if kendiBelgesi\(uid\)\s*&&\s*!bulutSilinmis\(uid\)\s*&&\s*gecerliAlanBelgesi\(alan\)/.test(kurallar),
  'alan oluşturma silme işaretçisi veya şema denetiminden geçmiyor');
assert.ok(/allow update:\s*if kendiBelgesi\(uid\)\s*&&\s*!bulutSilinmis\(uid\)\s*&&\s*gecerliAlanBelgesi\(alan\)\s*&&\s*alanSurumuDusmuyor\(\)/.test(kurallar),
  'alan güncellemesi sürüm düşürme korumasından geçmiyor');
assert.ok(/hasOnly\(\['surum', 'anahtar', 'zaman', 'json'\]\)/.test(kurallar),
  'alan belgesi yalnız izinli dört alanla sınırlanmıyor');
assert.ok(/request\.resource\.data\.anahtar\s*==\s*alan/.test(kurallar),
  'belge kimliği ile veri anahtarı eşleştirilmiyor');
assert.ok(/request\.resource\.data\.surum\s*==\s*3\s*&&\s*\(alan\s*==\s*'yds-leitner'\s*\|\|\s*alan\s*==\s*'yds-test-yanlis'\)/.test(kurallar),
  'dış sürüm 3 yalnız k=2 sıkıştırılan iki alana sınırlandırılmıyor');
assert.ok(/request\.resource\.data\.surum\s*>=\s*resource\.data\.surum/.test(kurallar),
  'mevcut sürüm 3 alanın eski istemci tarafından sürüm 2 ile ezilmesi engellenmiyor');
[
  'yds-leitner', 'yds-yanlis', 'yds-kategori', 'yds-gecmis', 'yds-konular',
  'yds-rekor', 'yds-yeni-sayac', 'yds-test-yanlis', 'yds-gunluk-yeni',
  'yds-gunluk-tavan', 'yds-katmanlar', 'yds-eksen'
].forEach(function (alan) {
  assert.ok(kurallar.indexOf("alan == '" + alan + "'") >= 0,
    'izinli alan listesinde eksik: ' + alan);
});
assert.ok(/request\.resource\.data\.json\.size\(\)\s*<\s*921600/.test(kurallar),
  'alan JSON güvenlik sınırı eksik');
assert.ok(/request\.resource\.data\.json\.size\(\)\s*>\s*0/.test(kurallar),
  'boş alan JSON dizesi engellenmiyor');

// Firestore kuralındaki create/update sürüm sözleşmesinin yarış regresyonu:
// create v2/v3 olabilir; mevcut v3 belgeye eski istemcinin v2 update'i olamaz.
function alanSurumKarari(mevcutSurum, yeniSurum, alan, olusturma) {
  var semaGecerli = yeniSurum === 2 ||
    (yeniSurum === 3 && (alan === 'yds-leitner' || alan === 'yds-test-yanlis'));
  return semaGecerli && (olusturma || yeniSurum >= mevcutSurum);
}
assert.strictEqual(alanSurumKarari(null, 2, 'yds-leitner', true), true,
  'legacy v2 alan create reddedildi');
assert.strictEqual(alanSurumKarari(null, 3, 'yds-leitner', true), true,
  'kısa v3 alan create reddedildi');
assert.strictEqual(alanSurumKarari(2, 3, 'yds-leitner', false), true,
  'v2→v3 yükseltmesi reddedildi');
assert.strictEqual(alanSurumKarari(3, 2, 'yds-leitner', false), false,
  'eski v2 istemci mevcut v3 alanı ezebiliyor');
assert.strictEqual(alanSurumKarari(null, 3, 'yds-kategori', true), false,
  'sıkıştırılmayan alan dış sürüm 3 ile oluşturulabiliyor');

assert.ok(/match\s+\/yonetim\/\{belge\}/.test(kurallar),
  'silme yönetim belgesi yolu eksik');
assert.ok(/allow read, delete:\s*if kendiBelgesi\(uid\)\s*&&\s*belge\s*==\s*'durum'/.test(kurallar),
  'yönetim işaretçisi yalnız sahibince okunup silinemiyor');
assert.ok(/hasAll\(\['silindi', 'zaman'\]\)/.test(kurallar));
assert.ok(/hasOnly\(\['silindi', 'zaman'\]\)/.test(kurallar));
assert.ok(/request\.resource\.data\.silindi\s*==\s*true/.test(kurallar));
assert.ok(/request\.resource\.data\.zaman\s+is\s+int/.test(kurallar));

console.log('firestore-kurallar: sahiplik + silme işaretçisi + v2/v3 yükseltme kilidi + 12 alan belgesi başarılı');
