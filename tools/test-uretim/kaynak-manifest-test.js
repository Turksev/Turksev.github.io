'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var kok = path.resolve(__dirname, '..', '..');
var manifest = JSON.parse(fs.readFileSync(path.join(kok, 'data', 'kaynak-manifest.json'), 'utf8'));

assert.strictEqual(manifest.sema_surumu, 1);
assert.strictEqual(manifest.sinav_sayisi, 49);
assert.strictEqual(manifest.sinavlar.length, 49);
assert.strictEqual(new Set(manifest.sinavlar.map(function (x) { return x.id; })).size, 49);
assert.strictEqual(new Set(manifest.sinavlar.map(function (x) { return x.sha256; })).size, 49);
manifest.sinavlar.forEach(function (x) {
  assert.ok(/\.pdf$/.test(x.dosya));
  assert.ok(/^[0-9a-f]{64}$/.test(x.sha256));
  assert.ok(x.bayt > 0);
  assert.ok(x.dosya.indexOf('\\') < 0 && x.dosya.indexOf('/') < 0,
    'yerel klasör yolu manifestte yayımlanmamalı');
});

var anaSayfa = fs.readFileSync(path.join(kok, 'index.html'), 'utf8');
var sw = fs.readFileSync(path.join(kok, 'sw.js'), 'utf8');
['data/kaynak-manifest.json', 'data/kelime-provenans.json'].forEach(function (dosya) {
  assert.ok(anaSayfa.indexOf('href="' + dosya + '"') >= 0,
    dosya + ' ana sayfada görünür değil');
  assert.ok(sw.indexOf("'./" + dosya + "'") >= 0,
    dosya + ' çevrimdışı önbellekte değil');
});

console.log('kaynak-manifest: 49 benzersiz PDF, içerik kopyası yok');
