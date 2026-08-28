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
assert.ok(/allow create, update:\s*if kendiBelgesi\(uid\)\s*&&\s*gecerliEsitlemeZarfi\(\)/.test(kurallar));
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
assert.ok(/hasOnly\(\['surum', 'anahtar', 'zaman', 'json'\]\)/.test(kurallar),
  'alan belgesi yalnız izinli dört alanla sınırlanmıyor');
assert.ok(/request\.resource\.data\.anahtar\s*==\s*alan/.test(kurallar),
  'belge kimliği ile veri anahtarı eşleştirilmiyor');
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

console.log('firestore-kurallar: sahiplik + legacy v1/v2 + 12 alan belgesi başarılı');
