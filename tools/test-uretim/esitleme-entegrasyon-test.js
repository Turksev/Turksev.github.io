'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var kok = path.resolve(__dirname, '..', '..');
var sayfalar = [
  'index.html', 'durum.html', 'konular.html', 'kelimeler.html', 'aileler.html',
  'obekler.html', 'quiz.html', 'deneme.html', 'gramer.html', 'baglaclar.html', 'ara.html',
  'cumleler.html'
];

sayfalar.forEach(function (dosya) {
  var html = fs.readFileSync(path.join(kok, dosya), 'utf8');
  var betikler = [];
  html.replace(/<script\s+src="([^"]+)"/g, function (_, src) { betikler.push(src); return _; });
  var main = betikler.indexOf('assets/js/main.js');
  var alias = betikler.indexOf('data/kelime-aliaslari.js');
  var motor = betikler.indexOf('assets/js/esitleme-veri.js');
  var depo = betikler.indexOf('assets/js/esitleme-depo.js');
  var ilerleme = betikler.indexOf('assets/js/ilerleme.js');
  var ayar = betikler.indexOf('assets/js/esitleme-ayar.js');
  var bulut = betikler.indexOf('assets/js/esitleme-v2.js');
  assert.ok(main >= 0 && alias === main + 1 && motor === alias + 1 && depo === motor + 1,
    dosya + ': eşitleme deposu main.js sonrasında doğru sırada değil');
  assert.ok(ayar > depo && bulut === ayar + 1,
    dosya + ': eşitleme ayarı ve bulut betiği doğru sırada değil');
  if (ilerleme >= 0) {
    assert.ok(ilerleme > depo && ilerleme < ayar,
      dosya + ': ilerleme betiği depo ile bulut ayarı arasında değil');
  }
  assert.strictEqual(betikler.indexOf('assets/js/esitleme.js'), -1,
    dosya + ': eski eşitleme betiği hâlâ yükleniyor');
  if (dosya === 'konular.html') {
    var temelKonu = betikler.indexOf('data/konu-metinleri.js');
    var tEk = betikler.indexOf('data/konu-metinleri-t-ek.js');
    var e1Ek = betikler.indexOf('data/konu-metinleri-e1-ek.js');
    var e2Ek = betikler.indexOf('data/konu-metinleri-e2-ek.js');
    var konuIlerleme = betikler.indexOf('assets/js/ilerleme.js');
    assert.ok(temelKonu >= 0 && tEk === temelKonu + 1 && e1Ek === tEk + 1 &&
      e2Ek === e1Ek + 1 && konuIlerleme === e2Ek + 1,
    'konular.html: 129 anlatım dosyası ilerleme betiğinden önce doğru sırada değil');
  }
  if (dosya === 'deneme.html') {
    var oturum = betikler.indexOf('assets/js/deneme-oturum.js');
    var deneme = betikler.indexOf('assets/js/deneme.js');
    assert.ok(oturum > ilerleme && deneme === oturum + 1,
      'deneme.html: güvenli oturum modülü deneme betiğinden hemen önce değil');
  }
  betikler.forEach(function (src) {
    if (/^(https?:)?\/\//.test(src)) return;
    assert.ok(fs.existsSync(path.join(kok, src)), dosya + ': eksik betik ' + src);
  });
});

var sw = fs.readFileSync(path.join(kok, 'sw.js'), 'utf8');
var main = fs.readFileSync(path.join(kok, 'assets', 'js', 'main.js'), 'utf8');
var bulut = fs.readFileSync(path.join(kok, 'assets', 'js', 'esitleme-v2.js'), 'utf8');
// Sürümü sabit bir sayıya çivilemek her yayında bu testi düşürüyordu
// (v146 -> v147'de kırıldı). Tek anlık görüntüden "artırıldı mı" anlaşılamaz;
// biçim ve geriye gitmeme denetimi asıl korunmak isteneni yakalıyor.
var swSurum = sw.match(/var SURUM = 'yds-v(\d+)'/);
assert.ok(swSurum, 'servis çalışanı sürümü okunamadı');
assert.ok(Number(swSurum[1]) >= 146, 'servis çalışanı sürümü geriye gitmiş');
assert.ok(sw.indexOf("'./data/kelime-aliaslari.js'") >= 0,
  'kelime aliasları çevrimdışı önbellekte değil');
['esitleme-veri.js', 'esitleme-depo.js', 'esitleme-v2.js'].forEach(function (dosya) {
  assert.ok(sw.indexOf("'./assets/js/" + dosya + "'") >= 0, 'önbellekte eksik: ' + dosya);
});
assert.ok(sw.indexOf("'./assets/js/deneme-oturum.js'") >= 0,
  'deneme oturum modülü çevrimdışı önbellekte değil');
['konu-metinleri.js', 'konu-metinleri-t-ek.js', 'konu-metinleri-e1-ek.js',
  'konu-metinleri-e2-ek.js'].forEach(function (dosya) {
  assert.ok(sw.indexOf("'./data/" + dosya + "'") >= 0, 'önbellekte eksik: ' + dosya);
});
assert.ok(!fs.existsSync(path.join(kok, 'assets', 'js', 'esitleme.js')),
  'artık yüklenmeyen eski eşitleme dosyası silinmedi');
assert.ok((main.match(/\.theme-toggle:not\(\.esit-dugme\)/g) || []).length >= 2,
  'tema düğmesi eşitleme düğmesinden ayrılmıyor');
assert.ok(bulut.indexOf(".theme-toggle:not(.esit-dugme)") >= 0,
  'eşitleme düğmesi gerçek tema düğmesine göre yerleşmiyor');
assert.ok(bulut.indexOf("collection('alanlar')") >= 0,
  'bulut ilerlemesi alan başına ayrı belgelere bölünmüyor');

var config = fs.readFileSync(path.join(kok, '_config.yml'), 'utf8');
['tools', 'README.md', 'firebase.json', 'firestore.rules'].forEach(function (hedef) {
  assert.ok(config.indexOf('- ' + hedef) >= 0, 'yayın dışı listesinde eksik: ' + hedef);
});

console.log('esitleme-entegrasyon: ' + sayfalar.length + ' sayfa başarılı');
