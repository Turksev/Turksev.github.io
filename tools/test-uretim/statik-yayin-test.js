'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var sayfalar = [
  'index.html', 'durum.html', 'konular.html', 'kelimeler.html', 'aileler.html',
  'obekler.html', 'quiz.html', 'deneme.html', 'gramer.html', 'baglaclar.html', 'ara.html',
  'yontem.html', 'ayarlar.html'
];
for (var t = 1; t <= 61; t++) sayfalar.push('konu/T' + String(t).padStart(2, '0') + '.html');
for (var e = 1; e <= 68; e++) sayfalar.push('konu/E' + String(e).padStart(2, '0') + '.html');
var denetlenen = 0;

function yerelMi(ref) {
  return ref && !/^(?:[a-z]+:|\/\/)/i.test(ref);
}

function hedefDosya(kaynak, ref) {
  var yol = ref.split('#')[0].split('?')[0];
  if (!yol) return kaynak;
  var tam = path.resolve(kok, path.dirname(kaynak), decodeURIComponent(yol));
  if (yol === './' || (fs.existsSync(tam) && fs.statSync(tam).isDirectory())) {
    tam = path.join(tam, 'index.html');
  }
  assert.ok(tam === kok || tam.indexOf(kok + path.sep) === 0,
    kaynak + ': depo dışına çıkan bağlantı ' + ref);
  return path.relative(kok, tam);
}

sayfalar.forEach(function (sayfa) {
  var html = fs.readFileSync(path.join(kok, sayfa), 'utf8');
  var kimlikler = [];
  html.replace(/\bid="([^"]+)"/g, function (_, id) { kimlikler.push(id); return _; });
  assert.strictEqual(new Set(kimlikler).size, kimlikler.length, sayfa + ': yinelenen id');

  html.replace(/\b(?:href|src)="([^"]+)"/g, function (_, ref) {
    if (!yerelMi(ref) || ref === '#') return _;
    var dosya = hedefDosya(sayfa, ref);
    assert.ok(fs.existsSync(path.join(kok, dosya)), sayfa + ': eksik hedef ' + ref);
    denetlenen++;

    var parca = ref.indexOf('#') >= 0 ? decodeURIComponent(ref.split('#').slice(1).join('#')) : '';
    if (!parca) return _;
    if (dosya === 'konular.html' && /^[TE]\d{2}$/.test(parca)) return _;
    var hedefHtml = fs.readFileSync(path.join(kok, dosya), 'utf8');
    assert.ok(new RegExp('\\bid="' + parca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"').test(hedefHtml),
      sayfa + ': bulunamayan çapa ' + ref);
    return _;
  });
});

var sw = fs.readFileSync(path.join(kok, 'sw.js'), 'utf8');
assert.ok(/var SURUM = 'yds-v169';/.test(sw), 'SW önbellek sürümü yds-v169 değil');
var liste = sw.match(/var TEMEL_DOSYALAR = \[([\s\S]*?)\];/);
assert.ok(liste, 'sw.js TEMEL_DOSYALAR listesi okunamadı');
var onbellek = [];
liste[1].replace(/'([^']+)'/g, function (_, ref) { onbellek.push(ref); return _; });
assert.strictEqual(new Set(onbellek).size, onbellek.length, 'SW önbelleğinde yinelenen yol');
onbellek.forEach(function (ref) {
  var yerel = ref === './' ? 'index.html' : ref.replace(/^\.\//, '');
  assert.ok(fs.existsSync(path.join(kok, yerel)), 'SW önbelleğinde eksik dosya: ' + ref);
});

var config = fs.readFileSync(path.join(kok, '_config.yml'), 'utf8');
assert.ok(/^\s*- tools\s*$/m.test(config), 'tools/ yayın dışı değil');

var konuSayfalari = sayfalar.filter(function (s) { return /^konu\//.test(s); });
var canonicals = konuSayfalari.map(function (s) {
  var html = fs.readFileSync(path.join(kok, s), 'utf8');
  var m = html.match(/<link rel="canonical" href="([^"]+)">/);
  assert.ok(m, s + ': canonical yok');
  return m[1];
});
assert.strictEqual(new Set(canonicals).size, 129, 'konu canonical adresleri benzersiz değil');

console.log('statik-yayın: ' + sayfalar.length + ' sayfa, ' + denetlenen +
  ' yerel bağlantı ve ' + onbellek.length + ' önbellek girdisi başarılı');
