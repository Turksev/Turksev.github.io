'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var kok = path.resolve(__dirname, '..', '..');
var sayfalar = [
  'index.html', 'durum.html', 'konular.html', 'kelimeler.html', 'aileler.html',
  'obekler.html', 'quiz.html', 'deneme.html', 'gramer.html', 'baglaclar.html', 'ara.html'
];

sayfalar.forEach(function (dosya) {
  var html = fs.readFileSync(path.join(kok, dosya), 'utf8');
  var betikler = [];
  html.replace(/<script\s+src="([^"]+)"/g, function (_, src) { betikler.push(src); return _; });
  var main = betikler.indexOf('assets/js/main.js');
  var motor = betikler.indexOf('assets/js/esitleme-veri.js');
  var depo = betikler.indexOf('assets/js/esitleme-depo.js');
  var bulut = betikler.indexOf('assets/js/esitleme-v2.js');
  assert.ok(main >= 0 && motor === main + 1 && depo === motor + 1,
    dosya + ': eşitleme deposu main.js sonrasında doğru sırada değil');
  assert.ok(bulut > depo, dosya + ': bulut eşitleme betiği depo katmanından önce');
  assert.strictEqual(betikler.indexOf('assets/js/esitleme.js'), -1,
    dosya + ': eski eşitleme betiği hâlâ yükleniyor');
  betikler.forEach(function (src) {
    if (/^(https?:)?\/\//.test(src)) return;
    assert.ok(fs.existsSync(path.join(kok, src)), dosya + ': eksik betik ' + src);
  });
});

var sw = fs.readFileSync(path.join(kok, 'sw.js'), 'utf8');
assert.ok(/var SURUM = 'yds-v134'/.test(sw), 'servis çalışanı sürümü artırılmadı');
['esitleme-veri.js', 'esitleme-depo.js', 'esitleme-v2.js'].forEach(function (dosya) {
  assert.ok(sw.indexOf("'./assets/js/" + dosya + "'") >= 0, 'önbellekte eksik: ' + dosya);
});

console.log('esitleme-entegrasyon: 11 sayfa başarılı');
